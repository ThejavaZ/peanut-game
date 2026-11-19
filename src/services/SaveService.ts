import { SAVE_SCHEMA_VERSION } from '../game/config'
import { DEATH_CAUSES } from '../game/data/deathCauses'
import { DEFAULT_SKIN_ID, isSkinId } from '../game/skins'
import type { AccessoryId, GameState, NeedKey } from '../types/game'

const STORAGE_KEY = 'peanut.run.v1'

const ACCESSORY_IDS: readonly AccessoryId[] = ['none', 'crown']

const STAT_KEYS = ['meals', 'drinks', 'cleanings', 'playSessions', 'naps']

const COOLDOWN_KEYS = ['feed', 'water', 'clean', 'play', 'sleep']

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
 *
 * Each step writes its own version so the next one still matches.
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
    schemaVersion: SAVE_SCHEMA_VERSION,
    death: typeof value.death === 'undefined' ? null : value.death,
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
