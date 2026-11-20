import { useCallback, useEffect, useReducer, useRef } from 'react'
import {
  MAX_OFFLINE_SECONDS,
  MAX_TICK_SECONDS,
  SAVE_INTERVAL_MS,
} from '../game/config'
import {
  advanceRun,
  applyCareAction,
  applyEventChoice,
  createRun,
} from '../game/rules'
import { clearRun, loadRun, saveRun } from '../services/SaveService'
import type {
  AccessoryId,
  CareAction,
  GameState,
  SkinId,
} from '../types/game'

type GameAction =
  | {
      type: 'adopt'
      name: string
      skinId: SkinId
      accessoryId: AccessoryId
      now: number
    }
  | { type: 'tick'; now: number; maxSeconds?: number }
  | { type: 'care'; action: CareAction }
  | { type: 'resolveEvent'; choiceId: string; now: number }
  | { type: 'togglePause'; now: number }
  | { type: 'clear' }

/**
 * Restores a run and applies the time that passed while the tab was closed,
 * capped so a long absence is punishing but not instantly fatal.
 */
function initRun(): GameState | null {
  const saved = loadRun()
  if (!saved) {
    return null
  }

  const now = Date.now()
  const awaySeconds = Math.max(0, (now - saved.lastUpdatedAt) / 1000)
  const advanced = advanceRun(saved, Math.min(awaySeconds, MAX_OFFLINE_SECONDS))
  return { ...advanced, lastUpdatedAt: now }
}

/** Exported so the pause rules can be tested without rendering React. */
export function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  switch (action.type) {
    case 'adopt':
      return createRun(
        action.name,
        action.now,
        action.skinId,
        action.accessoryId,
      )

    case 'tick': {
      // Paused, dead or answering an event: time does not pass here either.
      if (!state || state.paused || state.death || state.events.pending) {
        return state
      }
      const elapsed = Math.max(0, (action.now - state.lastUpdatedAt) / 1000)
      const seconds = Math.min(elapsed, action.maxSeconds ?? MAX_TICK_SECONDS)
      if (seconds <= 0) {
        return state
      }
      return {
        ...advanceRun(state, seconds),
        lastUpdatedAt: action.now,
      }
    }

    case 'care':
      return state ? applyCareAction(state, action.action) : state

    case 'resolveEvent': {
      if (!state) {
        return state
      }
      const answered = applyEventChoice(state, action.choiceId)
      if (answered === state) {
        return state
      }
      // The modal froze the clock: restart it from now, so the time spent
      // reading is never charged as decay.
      return { ...answered, lastUpdatedAt: action.now }
    }

    case 'togglePause':
      if (!state) {
        return state
      }
      return {
        ...state,
        paused: !state.paused,
        lastUpdatedAt: action.now,
      }

    case 'clear':
      return null
  }
}

export function useGameRun() {
  const [run, dispatch] = useReducer(gameReducer, undefined, initRun)
  const runRef = useRef<GameState | null>(run)
  const lastSaveRef = useRef(0)
  const deathSavedRef = useRef(false)

  useEffect(() => {
    runRef.current = run
  }, [run])

  const isRunning =
    run !== null &&
    !run.paused &&
    run.death === null &&
    run.events.pending === null

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const id = window.setInterval(() => {
      // Hidden tabs pause instead of drifting: returning applies a capped catch-up.
      if (document.visibilityState === 'hidden') {
        return
      }
      dispatch({ type: 'tick', now: Date.now() })
    }, 1000)

    return () => window.clearInterval(id)
  }, [isRunning])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        dispatch({ type: 'tick', now: Date.now(), maxSeconds: MAX_OFFLINE_SECONDS })
      } else if (runRef.current) {
        saveRun(runRef.current)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  useEffect(() => {
    if (!run) {
      return
    }

    const now = Date.now()

    // The death record must outlive the interval that produced it.
    if (run.death && !deathSavedRef.current) {
      deathSavedRef.current = true
      lastSaveRef.current = now
      saveRun(run)
      return
    }

    if (now - lastSaveRef.current < SAVE_INTERVAL_MS) {
      return
    }
    lastSaveRef.current = now
    saveRun(run)
  }, [run])

  useEffect(() => {
    const onPageHide = () => {
      if (runRef.current) {
        saveRun(runRef.current)
      }
    }

    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [])

  const adopt = useCallback(
    (
      name: string,
      skinId: SkinId,
      accessoryId: AccessoryId = 'none',
    ) => {
      lastSaveRef.current = 0
      deathSavedRef.current = false
      dispatch({ type: 'adopt', name, skinId, accessoryId, now: Date.now() })
    },
    [],
  )

  const care = useCallback((action: CareAction) => {
    lastSaveRef.current = 0
    dispatch({ type: 'care', action })
  }, [])

  const resolveEvent = useCallback((choiceId: string) => {
    lastSaveRef.current = 0
    dispatch({ type: 'resolveEvent', choiceId, now: Date.now() })
  }, [])

  const togglePause = useCallback(() => {
    lastSaveRef.current = 0
    dispatch({ type: 'togglePause', now: Date.now() })
  }, [])

  const resetRun = useCallback(() => {
    clearRun()
    dispatch({ type: 'clear' })
  }, [])

  return { run, adopt, care, resolveEvent, togglePause, resetRun }
}
