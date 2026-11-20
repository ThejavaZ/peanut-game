import {
  EVENT_CHANCE,
  EVENT_MIN_INTERVAL_SECONDS,
  SECONDS_PER_DAY,
} from './config'
import { EVENTS } from './data/events'
import type {
  EventCondition,
  EventSchedulerState,
  GameEvent,
  GameState,
} from '../types/game'

export function createEventScheduler(): EventSchedulerState {
  return { lastEventAt: 0, lastFiredAt: {}, fired: [], pending: null }
}

export function dayOf(elapsedSeconds: number): number {
  return Math.floor(elapsedSeconds / SECONDS_PER_DAY) + 1
}

export function isConditionMet(
  condition: EventCondition,
  state: GameState,
): boolean {
  switch (condition.type) {
    case 'needAtMost':
      return state.hamster.needs[condition.need] <= condition.value
    case 'needAtLeast':
      return state.hamster.needs[condition.need] >= condition.value
    case 'dayAtLeast':
      return dayOf(state.elapsedSeconds) >= condition.day
    case 'dayAtMost':
      return dayOf(state.elapsedSeconds) <= condition.day
    case 'statAtLeast':
      return state.stats[condition.stat] >= condition.value
  }
}

/**
 * An event may fire only if every condition holds, its own cooldown has
 * elapsed, and — for one-shot events — it has not already happened in this run.
 * A pending event always blocks: the player is answering, nothing else may
 * interrupt.
 */
export function isEventEligible(
  event: GameEvent,
  state: GameState,
): boolean {
  const scheduler = state.events

  if (scheduler.pending) {
    return false
  }
  if (event.oncePerRun && scheduler.fired.includes(event.id)) {
    return false
  }

  const lastFired = scheduler.lastFiredAt[event.id]
  if (
    lastFired !== undefined &&
    state.elapsedSeconds - lastFired < event.cooldownSeconds
  ) {
    return false
  }

  return event.conditions.every((condition) =>
    isConditionMet(condition, state),
  )
}

/**
 * Weighted pick. `random` is injected so tests can be exact: a function
 * returning `0` always picks the first candidate, `0.999…` the last.
 */
export function pickEvent(
  candidates: readonly GameEvent[],
  random: () => number,
): GameEvent | null {
  const total = candidates.reduce((sum, event) => sum + event.weight, 0)
  if (candidates.length === 0 || total <= 0) {
    return null
  }

  let roll = random() * total
  for (const event of candidates) {
    roll -= event.weight
    if (roll < 0) {
      return event
    }
  }
  // Floating point can leave the roll at exactly zero; the heaviest tie goes last.
  return candidates[candidates.length - 1]
}

/**
 * The scheduler proper.
 *
 * Three gates, in order: a global minimum interval so events never crowd the
 * player, a per-check chance so they stay rare, and eligibility so an event
 * only appears when it makes sense. No UI here — the chosen event is queued as
 * `pending` for the modal to render.
 */
export function advanceEvents(
  state: GameState,
  seconds: number,
  random: () => number = Math.random,
): GameState {
  if (seconds <= 0 || state.death || state.events.pending) {
    return state
  }

  const elapsed = state.elapsedSeconds
  if (elapsed - state.events.lastEventAt < EVENT_MIN_INTERVAL_SECONDS) {
    return state
  }
  if (random() >= EVENT_CHANCE) {
    return state
  }

  const picked = pickEvent(
    EVENTS.filter((event) => isEventEligible(event, state)),
    random,
  )
  if (!picked) {
    return state
  }

  return {
    ...state,
    events: {
      lastEventAt: elapsed,
      lastFiredAt: { ...state.events.lastFiredAt, [picked.id]: elapsed },
      fired: state.events.fired.includes(picked.id)
        ? state.events.fired
        : [...state.events.fired, picked.id],
      pending: picked,
    },
  }
}
