import { describe, expect, test } from 'bun:test'
import { SECONDS_PER_DAY } from '../src/game/config'
import {
  advanceRun,
  applyCareAction,
  createRun,
  formatGameClock,
  getCriticalWarning,
  getHamsterMood,
  getNeedStatus,
  updateNeeds,
} from '../src/game/rules'
import { isGameState } from '../src/services/SaveService'
import type { Needs } from '../src/types/game'

const NOW = 1_700_000_000_000

function needs(overrides: Partial<Needs> = {}): Needs {
  return {
    hunger: 100,
    thirst: 100,
    hygiene: 100,
    happiness: 100,
    health: 100,
    ...overrides,
  }
}

describe('createRun', () => {
  test('starts a healthy hamster with empty stats and cooldowns', () => {
    const run = createRun('Mochi', NOW)

    expect(run.hamster.name).toBe('Mochi')
    expect(run.hamster.isAlive).toBe(true)
    expect(run.hamster.needs).toEqual(needs())
    expect(run.stats).toEqual({
      meals: 0,
      drinks: 0,
      cleanings: 0,
      playSessions: 0,
      naps: 0,
    })
    expect(run.cooldowns.feed).toBe(0)
    expect(run.elapsedSeconds).toBe(0)
    expect(run.lastUpdatedAt).toBe(NOW)
    expect(run.paused).toBe(false)
  })
})

describe('updateNeeds', () => {
  test('decays core needs over time', () => {
    const next = updateNeeds(needs(), 10)

    expect(next.hunger).toBeCloseTo(97.2, 5)
    expect(next.thirst).toBeCloseTo(96.6, 5)
    expect(next.hygiene).toBeCloseTo(98.4, 5)
    expect(next.happiness).toBeCloseTo(97.8, 5)
    expect(next.health).toBe(100)
  })

  test('clamps needs at zero instead of going negative', () => {
    const next = updateNeeds(needs({ hunger: 1, thirst: 1 }), 60)

    expect(next.hunger).toBe(0)
    expect(next.thirst).toBe(0)
  })

  test('drains health while a core need is critical', () => {
    const next = updateNeeds(needs({ hunger: 10 }), 10)

    // Only hunger is critical: 0.06 health per second.
    expect(next.health).toBeCloseTo(99.4, 5)
  })

  test('recovers health when every core need is comfortable', () => {
    const next = updateNeeds(needs({ health: 50 }), 10)

    expect(next.health).toBeCloseTo(50.5, 5)
  })

  test('does not recover health if any core need is low', () => {
    const next = updateNeeds(needs({ health: 50, happiness: 30 }), 10)

    expect(next.health).toBe(50)
  })
})

describe('applyCareAction', () => {
  test('applies effects, counts the action and starts its cooldown', () => {
    const run = createRun('Mochi', NOW)
    run.hamster.needs = needs({ hunger: 50, happiness: 50, hygiene: 50 })

    const next = applyCareAction(run, 'feed')

    expect(next.hamster.needs.hunger).toBe(92)
    expect(next.hamster.needs.happiness).toBe(54)
    expect(next.hamster.needs.hygiene).toBe(47)
    expect(next.stats.meals).toBe(1)
    expect(next.cooldowns.feed).toBe(8)
  })

  test('ignores the action while it is cooling down', () => {
    const run = applyCareAction(createRun('Mochi', NOW), 'water')
    const next = applyCareAction(run, 'water')

    expect(next).toBe(run)
    expect(next.stats.drinks).toBe(1)
  })
})

describe('advanceRun', () => {
  test('advances time, ages the hamster and cools actions down', () => {
    const run = applyCareAction(createRun('Mochi', NOW), 'feed')
    const next = advanceRun(run, 3)

    expect(next.elapsedSeconds).toBe(3)
    expect(next.cooldowns.feed).toBe(5)
    expect(next.hamster.ageDays).toBe(0)
  })

  test('counts in-game days', () => {
    const next = advanceRun(createRun('Mochi', NOW), SECONDS_PER_DAY + 1)

    expect(next.hamster.ageDays).toBe(1)
  })

  test('does nothing while paused', () => {
    const run = { ...createRun('Mochi', NOW), paused: true }

    expect(advanceRun(run, 30)).toBe(run)
  })
})

describe('status helpers', () => {
  test('classifies need values', () => {
    expect(getNeedStatus(100)).toBe('ok')
    expect(getNeedStatus(35)).toBe('warning')
    expect(getNeedStatus(15)).toBe('critical')
    expect(getNeedStatus(0)).toBe('critical')
  })

  test('describes the hamster mood', () => {
    expect(getHamsterMood(needs())).toBe('happy')
    expect(getHamsterMood(needs({ happiness: 30 }))).toBe('worried')
    expect(getHamsterMood(needs({ thirst: 5 }))).toBe('critical')
  })

  test('reports the most urgent warning', () => {
    expect(getCriticalWarning(needs())).toBeNull()
    expect(getCriticalWarning(needs({ thirst: 5 }))).toBe(
      'is dangerously thirsty.',
    )
  })

  test('formats the in-game clock', () => {
    expect(formatGameClock(0)).toEqual({ day: 1, time: '08:00' })
    expect(formatGameClock(60)).toEqual({ day: 1, time: '20:00' })
    expect(formatGameClock(SECONDS_PER_DAY)).toEqual({ day: 2, time: '08:00' })
  })
})

describe('save validation', () => {
  test('accepts a run created by the engine', () => {
    expect(isGameState(createRun('Mochi', NOW))).toBe(true)
  })

  test('rejects corrupted or outdated saves', () => {
    expect(isGameState(null)).toBe(false)
    expect(isGameState({})).toBe(false)
    expect(isGameState({ ...createRun('Mochi', NOW), schemaVersion: 99 })).toBe(
      false,
    )
    expect(
      isGameState({
        ...createRun('Mochi', NOW),
        hamster: { ...createRun('Mochi', NOW).hamster, needs: {} },
      }),
    ).toBe(false)
  })
})
