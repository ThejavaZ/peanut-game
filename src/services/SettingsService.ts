export interface Settings {
  /** Applied immediately: it mirrors the `prefers-reduced-motion` media query. */
  motionReduced: boolean
  /** Stored for the audio service; nothing makes sound yet. */
  muted: boolean
  volume: number
}

const STORAGE_KEY = 'peanut.settings.v1'

export const DEFAULT_SETTINGS: Settings = {
  motionReduced: false,
  muted: false,
  volume: 0.7,
}

function clampVolume(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_SETTINGS.volume
  }
  return Math.min(1, Math.max(0, value))
}

/**
 * A corrupted or partial payload degrades **field by field** to its default
 * instead of crashing or wiping the player's other choices — the same rule the
 * run save follows, applied to something much smaller.
 */
export function normalizeSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) {
    return { ...DEFAULT_SETTINGS }
  }

  const record = value as Record<string, unknown>

  return {
    motionReduced:
      typeof record.motionReduced === 'boolean'
        ? record.motionReduced
        : DEFAULT_SETTINGS.motionReduced,
    muted:
      typeof record.muted === 'boolean' ? record.muted : DEFAULT_SETTINGS.muted,
    volume: clampVolume(record.volume),
  }
}

export function loadSettings(): Settings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_SETTINGS }
    }
    return normalizeSettings(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private mode or a full quota: the game keeps running without preferences.
  }
}
