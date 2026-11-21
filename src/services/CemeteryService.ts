import { CEMETERY_MAX_ENTRIES, CEMETERY_SCHEMA_VERSION } from '../game/config'
import { computeScore } from '../game/score'
import { isSkinId } from '../game/skins'
import type {
  AccessoryId,
  CemeteryEntry,
  DeathRecord,
  GameState,
} from '../types/game'

const STORAGE_KEY = 'peanut.cemetery.v1'

const ACCESSORY_IDS: readonly AccessoryId[] = ['none', 'crown']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Same rule as the run save: the payload is untrusted input. */
export function isCemeteryEntry(value: unknown): value is CemeteryEntry {
  if (!isRecord(value)) {
    return false
  }
  return (
    typeof value.name === 'string' &&
    typeof value.skinId === 'string' &&
    isSkinId(value.skinId) &&
    typeof value.accessoryId === 'string' &&
    ACCESSORY_IDS.includes(value.accessoryId as AccessoryId) &&
    isFiniteNumber(value.daysSurvived) &&
    typeof value.causeOfDeath === 'string' &&
    typeof value.epitaph === 'string' &&
    isFiniteNumber(value.diedAt) &&
    isFiniteNumber(value.score)
  )
}

interface CemeteryPayload {
  schemaVersion: number
  entries: CemeteryEntry[]
}

export function isCemetery(value: unknown): value is CemeteryPayload {
  if (!isRecord(value) || value.schemaVersion !== CEMETERY_SCHEMA_VERSION) {
    return false
  }
  const entries = value.entries
  return Array.isArray(entries) && entries.every(isCemeteryEntry)
}

/**
 * Newest first, capped, and never recording the same death twice. The cap
 * matters: a player who adopts hamster after hamster must not one day fill the
 * storage quota and lose the run too.
 */
export function addEntry(
  entries: readonly CemeteryEntry[],
  entry: CemeteryEntry,
  max: number = CEMETERY_MAX_ENTRIES,
): CemeteryEntry[] {
  const isTheSame = (candidate: CemeteryEntry): boolean =>
    candidate.diedAt === entry.diedAt && candidate.name === entry.name

  return [entry, ...entries.filter((candidate) => !isTheSame(candidate))].slice(
    0,
    max,
  )
}

/** Written once per death, from the immutable record — never recomputed later. */
export function toCemeteryEntry(
  run: GameState,
  death: DeathRecord,
): CemeteryEntry {
  return Object.freeze({
    name: run.hamster.name,
    skinId: run.hamster.skinId,
    accessoryId: run.hamster.accessoryId,
    daysSurvived: Math.max(1, death.day),
    causeOfDeath: death.detail,
    epitaph: death.epitaph,
    diedAt: death.diedAt,
    score: computeScore(run),
  })
}

export function loadCemetery(): CemeteryEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    return isCemetery(parsed) ? parsed.entries : []
  } catch {
    return []
  }
}

export function appendEntry(entry: CemeteryEntry): CemeteryEntry[] {
  const entries = addEntry(loadCemetery(), entry)
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ schemaVersion: CEMETERY_SCHEMA_VERSION, entries }),
    )
  } catch {
    // Private mode or a full quota: the game keeps running without a cemetery.
  }
  return entries
}

/** Called only from the settings screen, behind an explicit confirmation. */
export function clearCemetery(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to do if storage is unavailable.
  }
}
