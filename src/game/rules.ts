import {
  CORE_NEEDS,
  DAY_START_HOUR,
  HEALTH_RULES,
  NEED_CRITICAL,
  NEED_RATES,
  NEED_WARNING,
  SAVE_SCHEMA_VERSION,
  SECONDS_PER_DAY,
  START_NEEDS,
} from './config'
import { CARE_ACTIONS } from './data/careActions'
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
    },
    cooldowns: { feed: 0, water: 0, clean: 0, play: 0, sleep: 0 },
    elapsedSeconds: 0,
    lastUpdatedAt: now,
    paused: false,
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

export function advanceRun(state: GameState, seconds: number): GameState {
  if (seconds <= 0 || state.paused) {
    return state
  }

  const elapsedSeconds = state.elapsedSeconds + seconds
  return {
    ...state,
    hamster: {
      ...state.hamster,
      needs: updateNeeds(state.hamster.needs, seconds),
      ageDays: Math.floor(elapsedSeconds / SECONDS_PER_DAY),
    },
    cooldowns: tickCooldowns(state.cooldowns, seconds),
    elapsedSeconds,
  }
}

export function applyCareAction(state: GameState, action: CareAction): GameState {
  if (state.cooldowns[action] > 0) {
    return state
  }

  const definition = CARE_ACTIONS[action]
  const needs = { ...state.hamster.needs }

  for (const [key, amount] of Object.entries(definition.effects) as [
    NeedKey,
    number,
  ][]) {
    needs[key] = clamp(needs[key] + amount)
  }

  return {
    ...state,
    hamster: { ...state.hamster, needs },
    stats: {
      ...state.stats,
      [definition.stat]: state.stats[definition.stat] + 1,
    },
    cooldowns: { ...state.cooldowns, [action]: definition.cooldownSeconds },
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
