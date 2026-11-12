import { DEFAULT_SKIN_ID, isSkinId } from '../game/skins'
import type { SkinId } from '../types/game'

const UNLOCKS_KEY = 'peanut.skins.v1'

/** The classic hamster is always available; everything else is discovered. */
export function loadUnlockedSkins(): SkinId[] {
  const fallback: SkinId[] = [DEFAULT_SKIN_ID]
  try {
    const raw = window.localStorage.getItem(UNLOCKS_KEY)
    if (!raw) {
      return fallback
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return fallback
    }
    const ids = parsed.filter(
      (value): value is SkinId => typeof value === 'string' && isSkinId(value),
    )
    return Array.from(new Set<SkinId>([DEFAULT_SKIN_ID, ...ids]))
  } catch {
    return fallback
  }
}

export function saveUnlockedSkins(ids: readonly SkinId[]): void {
  try {
    window.localStorage.setItem(UNLOCKS_KEY, JSON.stringify(ids))
  } catch {
    // Unlocks are nice to have; the run keeps working without storage.
  }
}

export function unlockSkin(id: SkinId): SkinId[] {
  const current = loadUnlockedSkins()
  if (current.includes(id)) {
    return current
  }
  const next = [...current, id]
  saveUnlockedSkins(next)
  return next
}
