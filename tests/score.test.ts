import { describe, expect, test } from 'bun:test'
import {
  SAVE_SCHEMA_VERSION,
  SCORE_PERIOD_SECONDS,
} from '../src/game/config'
import { EVENTS } from '../src/game/data/events'
import { buildDeathRecord } from '../src/game/death'
import { applyMinigameReward } from '../src/game/minigames'
import { computeScore } from '../src/game/score'
import {
  advanceRun,
  applyEventChoice,
  createRun,
} from '../src/game/rules'
import { buildRunSummary } from '../src/game/runSummary'
import { isGameState, migrateSave } from '../src/services/SaveService'
import { toCemeteryEntry } from '../src/services/CemeteryService'
import type { GameState, Needs, RunStats } from '../src/types/game'

const NOW = 1_700_000_000_000

function makeRun(): GameState {
  return createRun('Mochi', NOW)
}

function withStats(run: GameState, stats: Partial<RunStats>): GameState {
  return { ...run, stats: { ...run.stats, ...stats } }
}

function withNeeds(run: GameState, needs: Partial<Needs>): GameState {
  return {
    ...run,
    hamster: { ...run.hamster, needs: { ...run.hamster.needs, ...needs } },
  }
}

function withPendingEvent(run: GameState): GameState {
  return { ...run, events: { ...run.events, pending: EVENTS[0] } }
}

describe('the Act 1 formula', () => {
  test('reproduces the worked example from Act 1 section 10', () => {
    // 12 días × 100 + 20 alimentaciones × 5 + 18 hidrataciones × 5 +
    // 8 juegos × 10 + 6 limpiezas × 5 + 3 eventos × 15 − 40 = 1,505
    const run = withStats(makeRun(), {
      meals: 20,
      drinks: 18,
      playSessions: 8,
      cleanings: 6,
      eventsResolved: 3,
      criticalSeconds: 4 * SCORE_PERIOD_SECONDS,
    })
    const aged: GameState = {
      ...run,
      hamster: { ...run.hamster, ageDays: 12 },
    }

    expect(computeScore(aged)).toBe(1_505)
  })

  test('counts completed days only', () => {
    // A life that ends during day 1 earned no full day.
    const run = withStats(makeRun(), { meals: 10 })
    expect(computeScore(run)).toBe(50)

    const oneDay: GameState = { ...run, hamster: { ...run.hamster, ageDays: 1 } }
    expect(computeScore(oneDay)).toBe(150)
  })

  test('a minigame pays like a play session', () => {
    expect(computeScore(withStats(makeRun(), { minigamesCompleted: 3 }))).toBe(
      30,
    )
  })

  test('never drops below zero', () => {
    const ruined = withStats(makeRun(), {
      criticalSeconds: 6_000,
      doubleCriticalSeconds: 6_000,
    })
    expect(computeScore(ruined)).toBe(0)
  })
})

describe('penalties', () => {
  test('a period is 60 seconds and only a full period costs points', () => {
    const base = withStats(makeRun(), {
      meals: 10,
      criticalSeconds: SCORE_PERIOD_SECONDS - 1,
    })
    expect(computeScore(base)).toBe(50)

    const full = withStats(makeRun(), {
      meals: 10,
      criticalSeconds: SCORE_PERIOD_SECONDS,
    })
    expect(computeScore(full)).toBe(40)
  })

  test('two critical bars cost an extra 20 per period', () => {
    const doubled = withStats(makeRun(), {
      meals: 10,
      criticalSeconds: SCORE_PERIOD_SECONDS,
      doubleCriticalSeconds: SCORE_PERIOD_SECONDS,
    })
    expect(computeScore(doubled)).toBe(50 - 10 - 20)
  })

  test('critical seconds accumulate while the clock runs', () => {
    const starving = withNeeds(makeRun(), {
      hunger: 10,
      thirst: 80,
      hygiene: 80,
      happiness: 80,
      health: 90,
    })

    const ticked = advanceRun(starving, 10)
    expect(ticked.stats.criticalSeconds).toBe(10)
    expect(ticked.stats.doubleCriticalSeconds).toBe(0)
  })

  test('two critical bars at once accumulate both counters', () => {
    const starving = withNeeds(makeRun(), {
      hunger: 10,
      thirst: 15,
      hygiene: 80,
      happiness: 80,
      health: 90,
    })

    const ticked = advanceRun(starving, 10)
    expect(ticked.stats.criticalSeconds).toBe(10)
    expect(ticked.stats.doubleCriticalSeconds).toBe(10)
  })

  test('an event pays only when nothing is left critical', () => {
    const answered = applyEventChoice(withPendingEvent(makeRun()), 'fill')
    expect(answered.stats.eventsResolved).toBe(1)

    const leftBad = applyEventChoice(
      withPendingEvent(withNeeds(makeRun(), { hunger: 5 })),
      'later',
    )
    expect(leftBad.stats.eventsResolved).toBe(0)
  })

  test('a finished minigame is counted once', () => {
    const played = applyMinigameReward(makeRun(), { effects: { health: 5 } })
    expect(played.stats.minigamesCompleted).toBe(1)
  })
})

describe('the score never decides survival', () => {
  test('it reads the state and changes nothing', () => {
    const run = withStats(makeRun(), { meals: 7, eventsResolved: 2 })
    const before = JSON.stringify(run)

    computeScore(run)

    expect(JSON.stringify(run)).toBe(before)
  })

  test('a richer life dies exactly like a poorer one', () => {
    const neglect = (run: GameState): GameState =>
      withNeeds(run, {
        hunger: 0,
        thirst: 0,
        hygiene: 0,
        happiness: 0,
        health: 0,
      })

    const plain = advanceRun(neglect(makeRun()), 1)
    const rich = advanceRun(
      neglect(withStats(makeRun(), { meals: 50, eventsResolved: 9 })),
      1,
    )

    expect(computeScore(rich)).toBeGreaterThan(computeScore(plain))
    expect(rich.death?.causeId).toBe(plain.death?.causeId)
  })
})

describe('the score travels with the record', () => {
  test('the memorial and the grave carry the same score', () => {
    const run = withStats(makeRun(), { meals: 10 })
    const death = buildDeathRecord(run, 'starvation')

    expect(buildRunSummary(run, death).score).toBe(computeScore(run))
    expect(toCemeteryEntry(run, death).score).toBe(computeScore(run))
  })
})

describe('save schema v5', () => {
  test('rejects a v4 save and upgrades it with zeroed counters', () => {
    const run = makeRun()
    const v4 = {
      ...run,
      schemaVersion: 4,
      stats: { meals: 3, drinks: 2, cleanings: 1, playSessions: 4, naps: 0 },
    }

    expect(isGameState(v4)).toBe(false)

    const migrated = migrateSave(v4) as GameState

    expect(isGameState(migrated)).toBe(true)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.stats.meals).toBe(3)
    expect(migrated.stats.eventsResolved).toBe(0)
    expect(migrated.stats.criticalSeconds).toBe(0)
  })

  test('a fresh run validates with the score counters in place', () => {
    expect(isGameState(createRun('Mochi', NOW))).toBe(true)
  })
})
