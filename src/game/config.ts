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
/** v3 adds `death`; v4 adds the event scheduler; v5 adds score counters. */
export const SAVE_SCHEMA_VERSION = 5

/**
 * Score rules from Act 1 §10. The score never decides whether Peanut lives
 * or dies — it only summarises the life.
 */
export const SCORE_POINTS = {
  perDay: 100,
  perMeal: 5,
  perDrink: 5,
  perPlaySession: 10,
  perCleaning: 5,
  perEventResolved: 15,
  penaltyPerCriticalPeriod: 10,
  penaltyPerDoubleCriticalPeriod: 20,
} as const

/** Length of one penalty period: 60 s with a critical bar costs 10 points. */
export const SCORE_PERIOD_SECONDS = 60

/** Cemetery payload version, and how many graves are kept (newest first). */
export const CEMETERY_SCHEMA_VERSION = 1
export const CEMETERY_MAX_ENTRIES = 50

/**
 * Events are live: the modal in `src/components/events/EventModal.tsx` answers
 * them, and a queued event freezes the clock until someone chooses.
 */
export const EVENTS_ENABLED = true
/** No two events may ever be closer than this, whatever the weights say. */
export const EVENT_MIN_INTERVAL_SECONDS = 45
/** Chance per eligible check that an event fires at all. */
export const EVENT_CHANCE = 0.3

/** `hamster.ageDays` at which Peanut dies of old age, whatever its needs are. */
export const MAX_AGE_DAYS = 8
/** The last full day before that, when the HUD starts warning about age. */
export const AGE_WARNING_DAYS = MAX_AGE_DAYS - 1

/**
 * Play sessions needed before an empty health bar can be blamed on the wheel:
 * exactly the gate that lets the wheel event exist in the first place.
 */
export const WHEEL_DEATH_SESSIONS = 5

/**
 * Nap Time: half a day of sleep. The health comes from the reward, the cost is
 * the decay those seconds cause — which is what stops it being a free refill.
 */
export const NAP_TIME_SECONDS = 60
export const NAP_TIME_HEALTH = 15

/** Hamster Wheel: three swings, a hard cap, and angles in degrees. */
export const WHEEL_ATTEMPTS = 3
export const WHEEL_PERFECT_POINTS = 12
export const WHEEL_GOOD_POINTS = 6
export const WHEEL_HAPPINESS_CAP = 25
export const WHEEL_PERFECT_TOLERANCE = 12
export const WHEEL_GOOD_TOLERANCE = 26
export const WHEEL_SPEED_DEG_PER_SECOND = 180

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
