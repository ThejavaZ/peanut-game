import { describe, expect, test } from 'bun:test'
import { seededRandom } from './prng'
import {
  AGE_WARNING_DAYS,
  MAX_AGE_DAYS,
  SAVE_SCHEMA_VERSION,
  SECONDS_PER_DAY,
  WHEEL_DEATH_SESSIONS,
} from '../src/game/config'
import { DEATH_CAUSES, DEATH_CAUSE_LIST } from '../src/game/data/deathCauses'
import {
  buildDeathRecord,
  evaluateDeath,
  pickNeglectCause,
} from '../src/game/death'
import {
  advanceRun,
  applyCareAction,
  applyEventChoice,
  createRun,
  getAgeWarning,
  getCriticalWarning,
} from '../src/game/rules'
import { isGameState, migrateSave } from '../src/services/SaveService'
import type { GameState, Needs } from '../src/types/game'

const NOW = 1_700_000_000_000
const DAY = SECONDS_PER_DAY

/** Net value of a choice: negative totals hurt, positive totals help. */
const total = (effects: Partial<Needs>): number =>
  Object.values(effects).reduce((sum, value) => sum + (value ?? 0), 0)

function makeRun(): GameState {
  return createRun('Peanut', NOW)
}

function withNeeds(run: GameState, overrides: Partial<Needs>): GameState {
  return {
    ...run,
    hamster: {
      ...run.hamster,
      needs: { ...run.hamster.needs, ...overrides },
    },
  }
}

/** A run whose health is already empty, the state every neglect death starts from. */
function neglected(overrides: Partial<Needs> = {}): GameState {
  return withNeeds(makeRun(), {
    health: 0,
    hunger: 0,
    thirst: 60,
    hygiene: 60,
    happiness: 60,
    ...overrides,
  })
}

describe('pickNeglectCause', () => {
  test('blames the single lowest core need', () => {
    expect(
      pickNeglectCause({
        hunger: 0,
        thirst: 70,
        hygiene: 70,
        happiness: 70,
        health: 0,
      }),
    ).toBe('starvation')
    expect(
      pickNeglectCause({
        hunger: 70,
        thirst: 3,
        hygiene: 70,
        happiness: 70,
        health: 0,
      }),
    ).toBe('dehydration')
    expect(
      pickNeglectCause({
        hunger: 70,
        thirst: 70,
        hygiene: 1,
        happiness: 70,
        health: 0,
      }),
    ).toBe('filth')
    expect(
      pickNeglectCause({
        hunger: 70,
        thirst: 70,
        hygiene: 70,
        happiness: 1,
        health: 0,
      }),
    ).toBe('despair')
  })

  test('blames no single need when several are equally bad', () => {
    expect(
      pickNeglectCause({
        hunger: 0,
        thirst: 0,
        hygiene: 0,
        happiness: 0,
        health: 0,
      }),
    ).toBe('systemic')
    expect(
      pickNeglectCause({
        hunger: 40,
        thirst: 40,
        hygiene: 70,
        happiness: 70,
        health: 0,
      }),
    ).toBe('systemic')
  })
})

describe('evaluateDeath', () => {
  test('does not kill while health is above zero', () => {
    expect(evaluateDeath(makeRun())).toBeNull()
    expect(
      evaluateDeath(withNeeds(makeRun(), { hunger: 0, health: 5 })),
    ).toBeNull()
  })

  test('kills when health reaches zero and names the cause', () => {
    const record = evaluateDeath(neglected())
    expect(record).not.toBeNull()
    expect(record?.causeId).toBe('starvation')
    expect(record?.cause).toBe(DEATH_CAUSES.starvation.label)
    expect(record?.detail).toBe(DEATH_CAUSES.starvation.detail)
    expect(record?.stats.meals).toBe(0)
  })

  test('old age only fires while Peanut is otherwise healthy', () => {
    const aged = {
      ...makeRun(),
      elapsedSeconds: MAX_AGE_DAYS * DAY,
      hamster: { ...makeRun().hamster, ageDays: MAX_AGE_DAYS },
    }
    expect(evaluateDeath(aged)?.causeId).toBe('old-age')

    // Same age, but health already gone: neglect wins.
    const sameAge = { ...neglected(), elapsedSeconds: MAX_AGE_DAYS * DAY }
    expect(evaluateDeath(sameAge)?.causeId).toBe('starvation')
  })

  test('returns the existing record instead of writing a second one', () => {
    const dead = advanceRun(neglected(), 1)
    expect(dead.death).not.toBeNull()
    expect(evaluateDeath(dead)).toBe(dead.death)
  })
})

describe('DeathRecord', () => {
  test('is frozen: the record is evidence, not state', () => {
    const record = buildDeathRecord(neglected(), 'starvation')
    expect(Object.isFrozen(record)).toBe(true)
    expect(Object.isFrozen(record.stats)).toBe(true)
    expect(() => {
      ;(record as { cause: string }).cause = 'forged'
    }).toThrow()
  })

  test('is deterministic: same run, same epitaph', () => {
    const state = neglected()
    expect(buildDeathRecord(state, 'starvation').epitaph).toBe(
      buildDeathRecord(state, 'starvation').epitaph,
    )
    expect(buildDeathRecord(state, 'starvation').epitaph.length).toBeGreaterThan(0)
  })

  test('records the day exactly like the HUD clock', () => {
    const state = { ...neglected(), elapsedSeconds: 3 * DAY + 30 }
    const record = buildDeathRecord(state, 'starvation')
    expect(record.day).toBe(4)
    expect(record.elapsedSeconds).toBe(3 * DAY + 30)
    expect(record.diedAt).toBe(state.lastUpdatedAt)
  })
})

describe('advanceRun with death', () => {
  test('stops the run and freezes it', () => {
    const dead = advanceRun(neglected(), 1)

    expect(dead.death).not.toBeNull()
    expect(dead.hamster.isAlive).toBe(false)

    const later = advanceRun(dead, 60)
    expect(later).toBe(dead)
    expect(later.death).toBe(dead.death)
  })

  test('refuses care actions once the run has ended', () => {
    const dead = advanceRun(neglected(), 1)
    expect(applyCareAction(dead, 'feed')).toBe(dead)
    expect(applyCareAction(dead, 'sleep')).toBe(dead)
  })

  test('kills by old age on the day it reaches the limit', () => {
    const almost = {
      ...makeRun(),
      elapsedSeconds: MAX_AGE_DAYS * DAY - 1,
    }
    const alive = advanceRun(almost, 1)

    expect(alive.death?.causeId).toBe('old-age')
    expect(alive.hamster.ageDays).toBe(MAX_AGE_DAYS)
    expect(alive.hamster.isAlive).toBe(false)
  })

  test('reaches neglect death from a healthy run by neglect alone', () => {
    let run = makeRun()
    let guard = 0

    // Total neglect, with events answered the neglectful way — whichever
    // option costs the most — because a dialog that nobody answers stops the
    // clock forever (and would hang this loop).
    //
    // One second per tick, like the real clock, and a seeded random: a ten
    // second step coarsens the decay enough that old age occasionally wins
    // (measured: 1 run in 40), and unseeded events made this flaky in CI.
    const random = seededRandom(0xdead)

    while (!run.death && run.elapsedSeconds < 20 * DAY && guard < 5000) {
      guard += 1
      const pending = run.events.pending
      if (pending) {
        const worst = [...pending.choices].sort(
          (a, b) => total(a.effects) - total(b.effects),
        )[0]
        run = applyEventChoice(run, worst.id)
        continue
      }
      run = advanceRun(run, 1, random)
    }

    expect(run.death).not.toBeNull()
    expect(run.death?.causeId).toMatch(
      /starvation|dehydration|filth|despair|systemic/,
    )
    expect(run.elapsedSeconds).toBeLessThan(20 * DAY)
  })
})

describe('warnings before death', () => {
  test('every neglect death happened while a need was already critical', () => {
    const dead = advanceRun(neglected(), 1)
    expect(getCriticalWarning(dead.hamster.needs)).not.toBeNull()
  })

  test('old age is announced a full day before it happens', () => {
    expect(AGE_WARNING_DAYS).toBeLessThan(MAX_AGE_DAYS)
    expect(getAgeWarning(AGE_WARNING_DAYS)).not.toBeNull()
    expect(getAgeWarning(AGE_WARNING_DAYS - 1)).toBeNull()
    expect(getAgeWarning(MAX_AGE_DAYS)).not.toBeNull()
  })
})

describe('the wheel accident', () => {
  /** Health empty while every need stays above the recovery threshold. */
  function comfortableRun(playSessions: number): GameState {
    const run = makeRun()
    return {
      ...run,
      hamster: {
        ...run.hamster,
        needs: {
          hunger: 60,
          thirst: 60,
          hygiene: 60,
          happiness: 60,
          health: 0,
        },
      },
      stats: { ...run.stats, playSessions },
    }
  }

  test('takes the blame when neglect is impossible', () => {
    const record = evaluateDeath(comfortableRun(WHEEL_DEATH_SESSIONS))

    expect(record?.causeId).toBe('wheel-accident')
    expect(record?.cause).toBe(DEATH_CAUSES['wheel-accident'].label)
    expect(record?.detail).toBe(DEATH_CAUSES['wheel-accident'].detail)
  })

  test('is never blamed without enough play sessions', () => {
    // Same impossible-looking state, but the wheel was never in play: there is
    // no accident to name, so the cause falls back to neglect.
    const record = evaluateDeath(comfortableRun(WHEEL_DEATH_SESSIONS - 1))

    expect(record?.causeId).toBe('systemic')
  })

  test('healthy needs still kill before old age is even considered', () => {
    const aged = { ...comfortableRun(WHEEL_DEATH_SESSIONS) }
    aged.hamster = { ...aged.hamster, ageDays: MAX_AGE_DAYS + 5 }

    expect(evaluateDeath(aged)?.causeId).toBe('wheel-accident')
  })
})

describe('death content', () => {
  test('registers at least six causes with an epitaph each', () => {
    expect(DEATH_CAUSE_LIST.length).toBeGreaterThanOrEqual(6)
    for (const cause of DEATH_CAUSE_LIST) {
      expect(cause.label.length).toBeGreaterThan(0)
      expect(cause.detail.length).toBeGreaterThan(0)
      expect(cause.epitaphs.length).toBeGreaterThan(0)
    }
  })
})

describe('save validation for death', () => {
  test('accepts an alive run (death null) and a dead one', () => {
    expect(isGameState(makeRun())).toBe(true)
    expect(isGameState(advanceRun(neglected(), 1))).toBe(true)
  })

  test('rejects a death record with an unknown cause', () => {
    const forged = {
      ...makeRun(),
      death: {
        ...buildDeathRecord(makeRun(), 'starvation'),
        causeId: 'laser',
      },
    }
    expect(isGameState(forged)).toBe(false)
  })

  test('upgrades a v2 save with a null death', () => {
    const v2 = {
      ...makeRun(),
      schemaVersion: 2,
      // A real v2 payload simply has no `death` key.
      death: undefined,
    }

    const migrated = migrateSave(v2) as GameState

    expect(isGameState(migrated)).toBe(true)
    expect(migrated.death).toBeNull()
    // The whole chain runs: v2 → v3 → v4, not a single shortcut step.
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.events.pending).toBeNull()
  })
})
