export type Theme = 'light' | 'dark'

export interface Settings {
  /** Applied immediately: it mirrors the `prefers-reduced-motion` media query. */
  motionReduced: boolean
  /** Applied immediately: swaps the whole token palette through `data-theme`. */
  theme: Theme
  /** Stored for the audio service; nothing makes sound yet. */
  muted: boolean
  volume: number
}

const STORAGE_KEY = 'peanut.settings.v1'

export const DEFAULT_SETTINGS: Settings = {
  motionReduced: false,
  theme: 'light',
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
    theme: record.theme === 'dark' ? 'dark' : DEFAULT_SETTINGS.theme,
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

/**
 * The one place that paints a preference onto the document: the palette hangs
 * off `data-theme` on `<html>`, and the browser chrome (the toolbar of an
 * installed copy) reads the `theme-color` meta — so both move together.
 *
 * Called by `main.tsx` before the first render (a useEffect would apply it
 * after the paint, and a dark-mode player would see a flash of light paper)
 * and by `App` whenever the setting changes.
 */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  // Read the token back instead of hardcoding it: the palette stays the
  // single source of truth for both the page and the chrome.
  const paper = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-paper')
    .trim()
  if (meta && paper) {
    meta.setAttribute('content', paper)
  }
}
