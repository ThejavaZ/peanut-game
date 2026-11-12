import { SAVE_SCHEMA_VERSION } from '../game/config'
import type { GameState, NeedKey } from '../types/game'

const STORAGE_KEY = 'peanut.run.v1'

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

/**
 * Saves are untrusted input: they can be edited, truncated or written by an
 * older build. Validate the shape before letting the engine touch it.
 */
export function isGameState(value: unknown): value is GameState {
  if (!isRecord(value) || value.schemaVersion !== SAVE_SCHEMA_VERSION) {
    return false
  }

  const hamster = value.hamster
  if (!isRecord(hamster) || typeof hamster.name !== 'string') {
    return false
  }

  const needs = hamster.needs
  if (!isRecord(needs) || !NEED_KEYS.every((key) => isFiniteNumber(needs[key]))) {
    return false
  }

  const stats = value.stats
  if (
    !isRecord(stats) ||
    !['meals', 'drinks', 'cleanings', 'playSessions', 'naps'].every((key) =>
      isFiniteNumber(stats[key]),
    )
  ) {
    return false
  }

  const cooldowns = value.cooldowns
  if (
    !isRecord(cooldowns) ||
    !['feed', 'water', 'clean', 'play', 'sleep'].every((key) =>
      isFiniteNumber(cooldowns[key]),
    )
  ) {
    return false
  }

  return (
    isFiniteNumber(value.elapsedSeconds) &&
    isFiniteNumber(value.lastUpdatedAt) &&
    typeof value.paused === 'boolean' &&
    typeof hamster.isAlive === 'boolean'
  )
}

export function loadRun(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
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
