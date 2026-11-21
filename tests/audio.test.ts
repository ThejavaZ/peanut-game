import { describe, expect, test } from 'bun:test'
import {
  SOUND_IDS,
  SOUND_PATCHES,
  gainFor,
} from '../src/services/AudioService'

describe('the patch table', () => {
  test('defines every sound the beta may play, and nothing else', () => {
    expect(SOUND_IDS).toHaveLength(8)
    expect(Object.keys(SOUND_PATCHES).sort()).toEqual([...SOUND_IDS].sort())
  })

  test('every patch is physically sensible', () => {
    for (const id of SOUND_IDS) {
      const patch = SOUND_PATCHES[id]
      expect(patch.from).toBeGreaterThan(0)
      expect(patch.to).toBeGreaterThan(0)
      expect(patch.duration).toBeGreaterThan(0)
      // Nothing may ring longer than a second: this is a UI, not a soundtrack.
      expect(patch.duration).toBeLessThanOrEqual(1)
      expect(patch.gain).toBeGreaterThan(0)
      expect(patch.gain).toBeLessThanOrEqual(1)
    }
  })

  test('uses shapes that match the intent of each sound', () => {
    expect(SOUND_PATCHES.warning.type).toBe('sawtooth')
    expect(SOUND_PATCHES.death.to).toBeLessThan(SOUND_PATCHES.death.from)
    expect(SOUND_PATCHES.event.to).toBeGreaterThan(SOUND_PATCHES.event.from)
  })
})

describe('master gain from the preferences', () => {
  test('mute wins over volume', () => {
    expect(gainFor(1, true)).toBe(0)
    expect(gainFor(0.7, true)).toBe(0)
  })

  test('volume passes through clamped', () => {
    expect(gainFor(0.5, false)).toBe(0.5)
    expect(gainFor(-3, false)).toBe(0)
    expect(gainFor(9, false)).toBe(1)
  })

  test('a broken value silences instead of exploding', () => {
    expect(gainFor(Number.NaN, false)).toBe(0)
    expect(gainFor(Number.POSITIVE_INFINITY, false)).toBe(0)
  })
})
