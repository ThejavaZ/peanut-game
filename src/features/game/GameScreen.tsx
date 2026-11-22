import { useEffect, useRef, useState } from 'react'
import { EventModal } from '../../components/events/EventModal'
import type { HamsterState } from '../../components/hamster/skinSprites'
import { HamsterRoom } from '../../components/room/HamsterRoom'
import { Button } from '../../components/ui/Button'
import { NeedBar } from '../../components/ui/NeedBar'
import { Screen } from '../../components/ui/Screen'
import { CARE_ACTION_LIST } from '../../game/data/careActions'
import { MINIGAME_LIST } from '../../game/data/minigames'
import { findEasterEgg, getDisplayName } from '../../game/easterEggs'
import { minigameGap } from '../../game/minigames'
import { play as playSound } from '../../services/AudioService'
import {
  formatGameClock,
  getAgeWarning,
  getCriticalWarning,
  getHamsterMood,
} from '../../game/rules'
import { computeScore } from '../../game/score'
import { SKINS } from '../../game/skins'
import type {
  CareAction,
  GameState,
  HamsterMood,
  MinigameId,
} from '../../types/game'

const MOOD_BADGES: Record<HamsterMood, { label: string; className: string }> = {
  happy: { label: 'Happy', className: 'bg-mint' },
  ok: { label: 'Doing okay', className: 'bg-sky' },
  worried: { label: 'Worried', className: 'bg-shell' },
  critical: { label: 'Critical', className: 'bg-danger-ink text-paper' },
}

const NEED_LABELS = {
  hunger: 'Hunger',
  thirst: 'Thirst',
  hygiene: 'Hygiene',
  happiness: 'Happiness',
  health: 'Health',
} as const

interface GameScreenProps {
  run: GameState
  onCare: (action: CareAction) => void
  onResolveEvent: (choiceId: string) => void
  onOpenMinigame: (id: MinigameId) => void
  onTogglePause: () => void
  onBackToMenu: () => void
}

export function GameScreen({
  run,
  onCare,
  onResolveEvent,
  onOpenMinigame,
  onTogglePause,
  onBackToMenu,
}: GameScreenProps) {
  const { day, time } = formatGameClock(run.elapsedSeconds)
  const mood = getHamsterMood(run.hamster.needs)
  const moodBadge = MOOD_BADGES[mood]
  const warning = getCriticalWarning(run.hamster.needs)
  const ageWarning = getAgeWarning(run.hamster.ageDays)
  const gapSeconds = minigameGap(run)
  // A full belly after feeding: the one pose the state itself can tell us.
  const hamsterState: HamsterState =
    run.hamster.needs.hunger >= 90 ? 'eat' : 'idle'
  const displayName = getDisplayName(run.hamster.name)
  const skin = SKINS[run.hamster.skinId]
  const egg = findEasterEgg(run.hamster.name)
  const showSkinName = skin.name.toLowerCase() !== displayName.toLowerCase()
  const [vanished, setVanished] = useState(false)
  const [feeding, setFeeding] = useState(false)
  const [watering, setWatering] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [playing, setPlaying] = useState(false)
  const feedTimeout = useRef<number | null>(null)
  const waterTimeout = useRef<number | null>(null)
  const cleanTimeout = useRef<number | null>(null)
  const playTimeout = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (feedTimeout.current !== null) {
        window.clearTimeout(feedTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (waterTimeout.current !== null) {
        window.clearTimeout(waterTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (cleanTimeout.current !== null) {
        window.clearTimeout(cleanTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (playTimeout.current !== null) {
        window.clearTimeout(playTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    if (egg?.id !== '404') {
      return
    }
    let hideId = 0
    let showId = 0
    const cycle = () => {
      hideId = window.setTimeout(() => {
        setVanished(true)
        showId = window.setTimeout(() => {
          setVanished(false)
          cycle()
        }, 4000)
      }, 12000)
    }
    cycle()
    return () => {
      window.clearTimeout(hideId)
      window.clearTimeout(showId)
    }
  }, [egg?.id])

  // Sound lives at the edges of the screen: an event chimes when it arrives,
  // the warning buzzes only when there is a warning to hear. Both references
  // come from frozen state, so neither repeats on its own.
  useEffect(() => {
    if (run.events.pending) {
      playSound('event')
    }
  }, [run.events.pending])

  useEffect(() => {
    if (warning) {
      playSound('warning')
    }
  }, [warning])

  return (
    <Screen>
      <div className="w-full max-w-3xl">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
              Day {day} · {time}
            </p>
            <h1 className="mt-2 font-pixel text-xl sm:text-2xl">
              {displayName}
            </h1>
            {showSkinName || (egg && egg.id !== 'null') ? (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-base text-cocoa-soft">
                {showSkinName ? skin.name : null}
                {egg && egg.id !== 'null' ? (
                  <span className="border-2 border-cocoa/30 px-1 font-pixel text-[7px] uppercase">
                    {egg.label}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="border-2 border-cocoa bg-sand px-2 py-1 font-pixel text-[8px] uppercase">
              Score {computeScore(run)}
            </span>
            <span
              className={`border-2 border-cocoa px-2 py-1 font-pixel text-[8px] uppercase ${moodBadge.className}`}
            >
              {moodBadge.label}
            </span>
            <Button
              variant="secondary"
              onClick={onTogglePause}
              className="px-3 py-2 text-[8px]"
            >
              {run.paused ? 'Resume' : 'Pause'}
            </Button>
          </div>
        </header>

        {warning ? (
          <p
            role="alert"
            className="mb-3 border-2 border-danger bg-danger/10 px-3 py-2 text-lg text-danger-ink"
          >
            <strong className="font-pixel text-[9px] uppercase">
              {displayName}
            </strong>{' '}
            {warning}
          </p>
        ) : null}

        {ageWarning ? (
          <p
            role="status"
            className="mb-3 border-2 border-shell bg-shell/15 px-3 py-2 text-lg text-cocoa"
          >
            <strong className="font-pixel text-[9px] uppercase">
              {displayName}
            </strong>{' '}
            {ageWarning}
          </p>
        ) : null}

        {egg?.id === 'segfault' ? (
          <p className="mb-3 border-2 border-cocoa bg-cocoa px-3 py-1 font-pixel text-[8px] uppercase tracking-widest text-mint">
            segmentation fault · core dumped
          </p>
        ) : null}

        <div className="pixel-frame relative bg-paper p-3 sm:p-4">
          <HamsterRoom
            hamsterName={displayName}
            skinId={run.hamster.skinId}
            accessoryId={run.hamster.accessoryId}
            state={hamsterState}
            paused={run.paused}
            vanished={vanished}
            feeding={feeding}
            watering={watering}
            cleaning={cleaning}
            playing={playing}
            serverDecor={egg?.id === 'localhost'}
          />
          {run.paused ? (
            <div className="absolute inset-3 flex items-center justify-center bg-paper/85 sm:inset-4">
              <span className="pixel-frame-sm bg-paper px-4 py-3 font-pixel text-sm uppercase tracking-widest">
                Paused
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1.1fr_1fr]">
          <section className="pixel-frame-sm bg-paper p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-pixel text-[10px] uppercase">Needs</h2>
              <span className="text-sm text-cocoa-soft">
                Meals {run.stats.meals} · Play {run.stats.playSessions}
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {(Object.keys(NEED_LABELS) as (keyof typeof NEED_LABELS)[]).map(
                (need) => (
                  <NeedBar
                    key={need}
                    label={NEED_LABELS[need]}
                    value={run.hamster.needs[need]}
                  />
                ),
              )}
            </div>
          </section>

          <section className="pixel-frame-sm bg-paper p-4">
            <h2 className="font-pixel text-[10px] uppercase">Care actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {CARE_ACTION_LIST.map((action) => {
                const cooldown = run.cooldowns[action.id]
                return (
                  <Button
                    key={action.id}
                    variant="secondary"
                    disabled={
                      cooldown > 0 ||
                      run.paused ||
                      run.events.pending !== null
                    }
                    onClick={() => {
                      onCare(action.id)
                      playSound(action.id)
                      if (action.id === 'feed') {
                        if (feedTimeout.current !== null) {
                          window.clearTimeout(feedTimeout.current)
                        }
                        setFeeding(true)
                        feedTimeout.current = window.setTimeout(() => {
                          setFeeding(false)
                          feedTimeout.current = null
                        }, 1800)
                      }
                      if (action.id === 'water') {
                        if (waterTimeout.current !== null) {
                          window.clearTimeout(waterTimeout.current)
                        }
                        setWatering(true)
                        waterTimeout.current = window.setTimeout(() => {
                          setWatering(false)
                          waterTimeout.current = null
                        }, 2000)
                      }
                      if (action.id === 'clean') {
                        if (cleanTimeout.current !== null) {
                          window.clearTimeout(cleanTimeout.current)
                        }
                        setCleaning(true)
                        cleanTimeout.current = window.setTimeout(() => {
                          setCleaning(false)
                          cleanTimeout.current = null
                        }, 2000)
                      }
                      if (action.id === 'play') {
                        if (playTimeout.current !== null) {
                          window.clearTimeout(playTimeout.current)
                        }
                        setPlaying(true)
                        playTimeout.current = window.setTimeout(() => {
                          setPlaying(false)
                          playTimeout.current = null
                        }, 3200)
                      }
                    }}
                    title={action.hint}
                    className={`px-2 text-[8px] ${action.id === 'sleep' ? 'col-span-2' : ''}`}
                  >
                    {cooldown > 0
                      ? `${action.label} · ${Math.ceil(cooldown)}s`
                      : action.label}
                  </Button>
                )
              })}
            </div>
            <p className="mt-4 text-base text-cocoa-soft">
              Warnings appear before anything serious happens.
            </p>
          </section>

          <section className="pixel-frame-sm bg-paper p-4 sm:col-span-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-pixel text-[10px] uppercase">Minigames</h2>
              <span className="text-sm text-cocoa-soft">
                Rewards never replace the bars
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MINIGAME_LIST.map((game) => (
                <Button
                  key={game.id}
                  variant="secondary"
                  title={game.description}
                  disabled={
                    run.paused ||
                    run.events.pending !== null ||
                    gapSeconds > 0
                  }
                  onClick={() => onOpenMinigame(game.id)}
                  className="text-[8px]"
                >
                  {gapSeconds > 0
                    ? `${game.title} · ${Math.ceil(gapSeconds)}s`
                    : game.title}
                </Button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6">
          <Button variant="ghost" onClick={onBackToMenu}>
            ← Main menu
          </Button>
        </div>
      </div>

      {run.events.pending ? (
        <EventModal
          event={run.events.pending}
          skinId={run.hamster.skinId}
          accessoryId={run.hamster.accessoryId}
          hamsterName={displayName}
          onChoose={onResolveEvent}
        />
      ) : null}
    </Screen>
  )
}
