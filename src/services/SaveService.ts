import { SAVE_SCHEMA_VERSION } from '../game/config'
import { DEATH_CAUSES } from '../game/data/deathCauses'
import { createEventScheduler } from '../game/events'
import { DEFAULT_SKIN_ID, isSkinId } from '../game/skins'
import type { AccessoryId, GameState, NeedKey } from '../types/game'

const STORAGE_KEY = 'peanut.run.v1'

const ACCESSORY_IDS: readonly AccessoryId[] = ['none', 'crown']

const STAT_KEYS = [
  'meals',
  'drinks',
  'cleanings',
  'playSessions',
  'naps',
  'eventsResolved',
  'minigamesCompleted',
  'criticalSeconds',
  'doubleCriticalSeconds',
]

const COOLDOWN_KEYS = ['feed', 'water', 'clean', 'play', 'sleep']

const CONDITION_TYPES = [
  'needAtMost',
  'needAtLeast',
  'dayAtLeast',
  'dayAtMost',
  'statAtLeast',
] as const

/**
 * Need conditions may only gate on core needs; `statAtLeast` is validated
 * against the run stats instead.
 */
const CONDITION_NEEDS: readonly NeedKey[] = [
  'hunger',
  'thirst',
  'hygiene',
  'happiness',
]

const NEED_KEYS: readonly NeedKey[] = [
  'hunger',
  'thirst',
  'hygiene',
  'happiness',
  'health',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isDeathRecord(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }
  const stats = value.stats
  return (
    typeof value.causeId === 'string' &&
    Object.hasOwn(DEATH_CAUSES, value.causeId) &&
    typeof value.cause === 'string' &&
    typeof value.detail === 'string' &&
    typeof value.epitaph === 'string' &&
    isFiniteNumber(value.ageDays) &&
    isFiniteNumber(value.day) &&
    isFiniteNumber(value.elapsedSeconds) &&
    isFiniteNumber(value.diedAt) &&
    isRecord(stats) &&
    STAT_KEYS.every((key) => isFiniteNumber(stats[key]))
  )
}

function isEventCondition(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.type !== 'string' ||
    !(CONDITION_TYPES as readonly string[]).includes(value.type)
  ) {
    return false
  }
  if (value.type === 'dayAtLeast' || value.type === 'dayAtMost') {
    return isFiniteNumber(value.day)
  }
  if (value.type === 'statAtLeast') {
    return (
      typeof value.stat === 'string' &&
      STAT_KEYS.includes(value.stat) &&
      isFiniteNumber(value.value)
    )
  }
  return (
    typeof value.need === 'string' &&
    CONDITION_NEEDS.includes(value.need as NeedKey) &&
    isFiniteNumber(value.value)
  )
}

function isEventChoice(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }
  const effects = value.effects
  return (
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.hint === 'string' &&
    isRecord(effects) &&
    Object.keys(effects).every(
      (key) =>
        NEED_KEYS.includes(key as NeedKey) && isFiniteNumber(effects[key]),
    )
  )
}

function isGameEvent(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }
  const conditions = value.conditions
  const choices = value.choices
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.description === 'string' &&
    isFiniteNumber(value.weight) &&
    value.weight > 0 &&
    isFiniteNumber(value.cooldownSeconds) &&
    value.cooldownSeconds >= 0 &&
    typeof value.oncePerRun === 'boolean' &&
    Array.isArray(conditions) &&
    conditions.length > 0 &&
    conditions.every(isEventCondition) &&
    Array.isArray(choices) &&
    choices.length >= 1 &&
    choices.length <= 2 &&
    choices.every(isEventChoice)
  )
}

function isEventScheduler(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }
  const lastFiredAt = value.lastFiredAt
  const fired = value.fired
  const pending = value.pending
  return (
    isFiniteNumber(value.lastEventAt) &&
    isRecord(lastFiredAt) &&
    Object.values(lastFiredAt).every(isFiniteNumber) &&
    Array.isArray(fired) &&
    fired.every((id) => typeof id === 'string') &&
    (pending === null || isGameEvent(pending))
  )
}

/**
 * Saves are untrusted input: they can be edited, truncated or written by an
 * older build. Validate the shape before letting the engine touch it.
 */
export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value) || value.schemaVersion !== SAVE_SCHEMA_VERSION) {
    return false
  }

  const hamster = value.hamster
  if (
    !isRecord(hamster) ||
    typeof hamster.name !== 'string' ||
    typeof hamster.skinId !== 'string' ||
    !isSkinId(hamster.skinId) ||
    typeof hamster.accessoryId !== 'string' ||
    !ACCESSORY_IDS.includes(hamster.accessoryId as AccessoryId)
  ) {
    return false
  }

  const needs = hamster.needs
  if (!isRecord(needs) || !NEED_KEYS.every((key) => isFiniteNumber(needs[key]))) {
    return false
  }

  const stats = value.stats
  if (
    !isRecord(stats) ||
    !STAT_KEYS.every((key) => isFiniteNumber(stats[key]))
  ) {
    return false
  }

  const cooldowns = value.cooldowns
  if (
    !isRecord(cooldowns) ||
    !COOLDOWN_KEYS.every((key) => isFiniteNumber(cooldowns[key]))
  ) {
    return false
  }

  const death = value.death
  if (death !== null && !isDeathRecord(death)) {
    return false
  }

  if (!isEventScheduler(value.events)) {
    return false
  }

  return (
    isFiniteNumber(hamster.adoptedAt) &&
    isFiniteNumber(hamster.ageDays) &&
    isFiniteNumber(value.elapsedSeconds) &&
    isFiniteNumber(value.lastUpdatedAt) &&
    typeof value.paused === 'boolean' &&
    typeof hamster.isAlive === 'boolean'
  )
}

/**
 * Saves predate several features, so they are upgraded step by step instead of
 * being discarded:
 *
 * - v1 → v2 adds cosmetic skins (`skinId`, `accessoryId`).
 * - v2 → v3 adds `death` (null while Peanut is alive).
 * - v3 → v4 adds the event scheduler.
 *
 * Each step writes **its own** version, never `SAVE_SCHEMA_VERSION`, so the
 * next step in the chain still matches.
 */
function migrateV1toV2(value: Record<string, unknown>): Record<string, unknown> {
  const hamster = value.hamster
  if (!isRecord(hamster)) {
    return value
  }

  return {
    ...value,
    schemaVersion: 2,
    hamster:
      typeof hamster.skinId === 'undefined'
        ? {
            ...hamster,
            skinId: DEFAULT_SKIN_ID,
            accessoryId: 'none',
          }
        : hamster,
  }
}

function migrateV2toV3(value: Record<string, unknown>): Record<string, unknown> {
  return {
    ...value,
    // Literal, not SAVE_SCHEMA_VERSION: this step always lands on v3 so the
    // next one still matches. Using the constant here silently skips it.
    schemaVersion: 3,
    death: typeof value.death === 'undefined' ? null : value.death,
  }
}

function migrateV3toV4(value: Record<string, unknown>): Record<string, unknown> {
  return {
    ...value,
    // Literal, not SAVE_SCHEMA_VERSION: this step always lands on v4 so the
    // next one still matches. Using the constant here silently skips it.
    schemaVersion: 4,
    events: isEventScheduler(value.events)
      ? value.events
      : createEventScheduler(),
  }
}

/**
 * Score counters arrive with v5. A v4 payload simply has none, so they start
 * at zero rather than invalidating a run the player already cares about.
 */
function migrateV4toV5(value: Record<string, unknown>): Record<string, unknown> {
  const stats = value.stats
  if (!isRecord(stats)) {
    return { ...value, schemaVersion: SAVE_SCHEMA_VERSION }
  }

  const scoreKeys = [
    'eventsResolved',
    'minigamesCompleted',
    'criticalSeconds',
    'doubleCriticalSeconds',
  ]

  return {
    ...value,
    schemaVersion: SAVE_SCHEMA_VERSION,
    stats: {
      ...stats,
      ...Object.fromEntries(
        scoreKeys.map((key) => [
          key,
          isFiniteNumber(stats[key]) ? stats[key] : 0,
        ]),
      ),
    },
  }
}

export function migrateSave(value: unknown): unknown {
  if (!isRecord(value)) {
    return value
  }

  let current = value
  if (current.schemaVersion === 1) {
    current = migrateV1toV2(current)
  }
  if (current.schemaVersion === 2) {
    current = migrateV2toV3(current)
  }
  if (current.schemaVersion === 3) {
    current = migrateV3toV4(current)
  }
  if (current.schemaVersion === 4) {
    current = migrateV4toV5(current)
  }
  return current
}

export function loadRun(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = migrateSave(JSON.parse(raw))
    return isGameState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveRun(state: GameState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Private mode or a full quota: the game keeps running without persistence.
  }
}

export function clearRun(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
