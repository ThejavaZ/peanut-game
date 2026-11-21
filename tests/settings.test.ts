import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
} from '../src/services/SettingsService'

describe('normalising settings', () => {
  test('falls back to the defaults for anything unreadable', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings('nope')).toEqual(DEFAULT_SETTINGS)
    expect(normalizeSettings(42)).toEqual(DEFAULT_SETTINGS)
  })

  test('keeps valid preferences', () => {
    expect(
      normalizeSettings({ motionReduced: true, muted: true, volume: 0.25 }),
    ).toEqual({ motionReduced: true, muted: true, volume: 0.25 })
  })

  test('repairs each field on its own instead of dropping the payload', () => {
    const repaired = normalizeSettings({
      motionReduced: true,
      muted: 'yes',
      volume: 99,
    })

    expect(repaired.motionReduced).toBe(true)
    expect(repaired.muted).toBe(DEFAULT_SETTINGS.muted)
    expect(repaired.volume).toBe(1)
  })

  test('clamps the volume to the audible range', () => {
    expect(normalizeSettings({ volume: -3 }).volume).toBe(0)
    expect(normalizeSettings({ volume: 5 }).volume).toBe(1)
    expect(normalizeSettings({ volume: Number.NaN }).volume).toBe(
      DEFAULT_SETTINGS.volume,
    )
  })

  test('an empty object becomes usable defaults, not a crash', () => {
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS)
  })
})
