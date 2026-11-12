import type { CoreNeedKey, Needs } from '../types/game'

/** One in-game day lasts two real minutes. */
export const SECONDS_PER_DAY = 120
export const DAY_START_HOUR = 8

/** Longest stretch of neglect applied when returning to the tab or reloading. */
export const MAX_OFFLINE_SECONDS = 10 * 60
/** Longest jump accepted by a single clock tick (main-thread stalls, throttling). */
export const MAX_TICK_SECONDS = 5
/** How often the run is written to localStorage (actions save immediately). */
export const SAVE_INTERVAL_MS = 5000
export const SAVE_SCHEMA_VERSION = 1

/** Points lost per real second. Full → empty takes 4–10 minutes. */
export const NEED_RATES: Record<CoreNeedKey, number> = {
  hunger: 0.28,
  thirst: 0.34,
  hygiene: 0.16,
  happiness: 0.22,
}

export const HEALTH_RULES = {
  /** Below this value a need starts hurting health. */
  criticalThreshold: 20,
  /** Above this value every core need allows health to recover. */
  recoveryThreshold: 55,
  recoveryRate: 0.05,
  criticalPenalty: {
    hunger: 0.06,
    thirst: 0.08,
    hygiene: 0.03,
    happiness: 0.02,
  } satisfies Record<CoreNeedKey, number>,
}

export const NEED_WARNING = 35
/** Matches HEALTH_RULES.criticalThreshold, so the banner shows when health starts dropping. */
export const NEED_CRITICAL = HEALTH_RULES.criticalThreshold

export const CORE_NEEDS: readonly CoreNeedKey[] = [
  'hunger',
  'thirst',
  'hygiene',
  'happiness',
]

export const START_NEEDS: Needs = {
  hunger: 100,
  thirst: 100,
  hygiene: 100,
  happiness: 100,
  health: 100,
}
