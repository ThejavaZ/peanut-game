import {
  AGE_WARNING_DAYS,
  CORE_NEEDS,
  DAY_START_HOUR,
  EVENTS_ENABLED,
  HEALTH_RULES,
  NEED_CRITICAL,
  NEED_RATES,
  NEED_WARNING,
  SAVE_SCHEMA_VERSION,
  SECONDS_PER_DAY,
  START_NEEDS,
} from './config'
import { CARE_ACTIONS } from './data/careActions'
import { evaluateDeath } from './death'
import { advanceEvents, createEventScheduler } from './events'
import { DEFAULT_SKIN_ID } from './skins'
import type {
  AccessoryId,
  CareAction,
  CoreNeedKey,
  GameState,
  HamsterMood,
  NeedKey,
  NeedStatus,
  Needs,
  SkinId,
} from '../types/game'

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

export function createRun(
  name: string,
  now: number,
  skinId: SkinId = DEFAULT_SKIN_ID,
  accessoryId: AccessoryId = 'none',
): GameState {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    hamster: {
      name,
      skinId,
      accessoryId,
      adoptedAt: now,
      ageDays: 0,
      needs: { ...START_NEEDS },
      isAlive: true,
    },
    stats: {
      meals: 0,
      drinks: 0,
      cleanings: 0,
      playSessions: 0,
      naps: 0,
      eventsResolved: 0,
      minigamesCompleted: 0,
      criticalSeconds: 0,
      doubleCriticalSeconds: 0,
    },
    cooldowns: { feed: 0, water: 0, clean: 0, play: 0, sleep: 0 },
    elapsedSeconds: 0,
    lastUpdatedAt: now,
    paused: false,
    death: null,
    events: createEventScheduler(),
  }
}

/**
 * Pure needs update: decay, health coupling and clamping.
 * Zero is a warning, never instant death — death belongs to the death system.
 */
export function updateNeeds(needs: Needs, seconds: number): Needs {
  if (seconds <= 0) {
    return needs
  }

  const next: Needs = {
    hunger: clamp(needs.hunger - NEED_RATES.hunger * seconds),
    thirst: clamp(needs.thirst - NEED_RATES.thirst * seconds),
    hygiene: clamp(needs.hygiene - NEED_RATES.hygiene * seconds),
    happiness: clamp(needs.happiness - NEED_RATES.happiness * seconds),
    health: needs.health,
  }

  let healthDelta = 0
  for (const need of CORE_NEEDS) {
    if (next[need] < HEALTH_RULES.criticalThreshold) {
      healthDelta -= HEALTH_RULES.criticalPenalty[need] * seconds
    }
  }

  const comfortable = CORE_NEEDS.every(
    (need) => next[need] >= HEALTH_RULES.recoveryThreshold,
  )
  if (healthDelta === 0 && comfortable) {
    healthDelta = HEALTH_RULES.recoveryRate * seconds
  }

  next.health = clamp(needs.health + healthDelta)
  return next
}

function tickCooldowns(
  cooldowns: GameState['cooldowns'],
  seconds: number,
): GameState['cooldowns'] {
  return {
    feed: Math.max(0, cooldowns.feed - seconds),
    water: Math.max(0, cooldowns.water - seconds),
    clean: Math.max(0, cooldowns.clean - seconds),
    play: Math.max(0, cooldowns.play - seconds),
    sleep: Math.max(0, cooldowns.sleep - seconds),
  }
}

/**
 * The clock. `random` is injected so tests can drive the event scheduler
 * deterministically; gameplay uses `Math.random`.
 */
export function advanceRun(
  state: GameState,
  seconds: number,
  random: () => number = Math.random,
): GameState {
  if (
    seconds <= 0 ||
    state.paused ||
    state.death ||
    state.events.pending
  ) {
    return state
  }

  const needs = updateNeeds(state.hamster.needs, seconds)
  const criticalBars = Object.values(needs).filter(
    (value) => value <= NEED_CRITICAL,
  ).length

  const elapsedSeconds = state.elapsedSeconds + seconds
  const next: GameState = {
    ...state,
    hamster: {
      ...state.hamster,
      needs,
      ageDays: Math.floor(elapsedSeconds / SECONDS_PER_DAY),
    },
    cooldowns: tickCooldowns(state.cooldowns, seconds),
    elapsedSeconds,
    stats: {
      ...state.stats,
      criticalSeconds:
        state.stats.criticalSeconds + (criticalBars >= 1 ? seconds : 0),
      doubleCriticalSeconds:
        state.stats.doubleCriticalSeconds + (criticalBars >= 2 ? seconds : 0),
    },
  }

  // A dead run is frozen: needs, cooldowns and the clock stop with the record.
  const death = evaluateDeath(next)
  if (death) {
    return {
      ...next,
      death,
      hamster: { ...next.hamster, isAlive: false },
    }
  }

  return EVENTS_ENABLED ? advanceEvents(next, seconds, random) : next
}

/**
 * Care actions, event choices and minigame rewards all change needs exactly
 * the same way: add the delta, clamp to the bounds.
 */
export function applyEffects(needs: Needs, effects: Partial<Needs>): Needs {
  const next = { ...needs }
  for (const [key, amount] of Object.entries(effects) as [NeedKey, number][]) {
    next[key] = clamp(next[key] + amount)
  }
  return next
}

export function applyCareAction(state: GameState, action: CareAction): GameState {
  if (state.death || state.cooldowns[action] > 0) {
    return state
  }

  const definition = CARE_ACTIONS[action]

  return {
    ...state,
    hamster: {
      ...state.hamster,
      needs: applyEffects(state.hamster.needs, definition.effects),
    },
    stats: {
      ...state.stats,
      [definition.stat]: state.stats[definition.stat] + 1,
    },
    cooldowns: { ...state.cooldowns, [action]: definition.cooldownSeconds },
  }
}

/**
 * Answers the event waiting in `state.events.pending`.
 *
 * Unknown choice or nothing pending: the state comes back untouched, so a
 * double click or a stale modal cannot apply an effect twice.
 */
export function applyEventChoice(
  state: GameState,
  choiceId: string,
): GameState {
  const pending = state.events.pending
  if (!pending) {
    return state
  }

  const choice = pending.choices.find(
    (candidate) => candidate.id === choiceId,
  )
  if (!choice) {
    return state
  }

  const needs = applyEffects(state.hamster.needs, choice.effects)
  const leftCritical = Object.values(needs).some(
    (value) => value <= NEED_CRITICAL,
  )

  return {
    ...state,
    hamster: { ...state.hamster, needs },
    // Act 1 §10: an event pays only when the answer leaves nothing critical.
    stats: {
      ...state.stats,
      eventsResolved: state.stats.eventsResolved + (leftCritical ? 0 : 1),
    },
    events: { ...state.events, pending: null },
  }
}

export function getNeedStatus(value: number): NeedStatus {
  if (value <= NEED_CRITICAL) {
    return 'critical'
  }
  if (value <= NEED_WARNING) {
    return 'warning'
  }
  return 'ok'
}

export function getHamsterMood(needs: Needs): HamsterMood {
  const critical = CORE_NEEDS.some((need) => needs[need] <= NEED_CRITICAL)
  if (critical || needs.health <= NEED_CRITICAL) {
    return 'critical'
  }

  const worried =
    CORE_NEEDS.some((need) => needs[need] <= NEED_WARNING) ||
    needs.health <= NEED_WARNING
  if (worried) {
    return 'worried'
  }

  const average =
    (needs.hunger + needs.thirst + needs.hygiene + needs.happiness + needs.health) /
    5
  return average >= 75 ? 'happy' : 'ok'
}

const WARNING_MESSAGES: Record<NeedKey, string> = {
  hunger: 'is starving.',
  thirst: 'is dangerously thirsty.',
  hygiene: 'needs a clean cage.',
  happiness: 'is very unhappy.',
  health: 'is in poor health.',
}

/** Lowest core need, or health, when it is critical. */
export function getCriticalWarning(needs: Needs): string | null {
  let lowest: CoreNeedKey = 'hunger'
  for (const need of CORE_NEEDS) {
    if (needs[need] < needs[lowest]) {
      lowest = need
    }
  }

  if (needs[lowest] <= NEED_CRITICAL) {
    return WARNING_MESSAGES[lowest]
  }
  if (needs.health <= NEED_CRITICAL) {
    return WARNING_MESSAGES.health
  }
  return null
}

/**
 * Announced one full day before old age ends the run, so the inevitable
 * ending is never a surprise either.
 */
export function getAgeWarning(ageDays: number): string | null {
  return ageDays >= AGE_WARNING_DAYS ? 'is getting on in years.' : null
}

export function formatGameClock(elapsedSeconds: number): {
  day: number
  time: string
} {
  const day = Math.floor(elapsedSeconds / SECONDS_PER_DAY) + 1
  const progress = (elapsedSeconds % SECONDS_PER_DAY) / SECONDS_PER_DAY
  const minutesInDay = (DAY_START_HOUR * 60 + progress * 24 * 60) % (24 * 60)
  const hours = Math.floor(minutesInDay / 60)
  const minutes = Math.floor(minutesInDay % 60)
  const pad = (value: number) => String(value).padStart(2, '0')
  return { day, time: `${pad(hours)}:${pad(minutes)}` }
}
