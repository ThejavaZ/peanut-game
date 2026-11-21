import { describe, expect, test } from 'bun:test'
import {
  CEMETERY_MAX_ENTRIES,
  CEMETERY_SCHEMA_VERSION,
} from '../src/game/config'
import { buildDeathRecord } from '../src/game/death'
import { createRun } from '../src/game/rules'
import {
  addEntry,
  isCemetery,
  isCemeteryEntry,
  toCemeteryEntry,
} from '../src/services/CemeteryService'
import type { CemeteryEntry } from '../src/types/game'

const NOW = 1_700_000_000_000

function entry(overrides: Partial<CemeteryEntry> = {}): CemeteryEntry {
  return {
    name: 'Peanut',
    skinId: 'hamster',
    accessoryId: 'none',
    daysSurvived: 4,
    causeOfDeath: 'Starvation',
    epitaph: 'The bowl was right there.',
    diedAt: NOW,
    score: 1_500,
    ...overrides,
  }
}

describe('isCemeteryEntry', () => {
  test('accepts a well formed grave', () => {
    expect(isCemeteryEntry(entry())).toBe(true)
    expect(isCemeteryEntry(entry({ skinId: 'ferris', accessoryId: 'crown' }))).toBe(
      true,
    )
  })

  test('rejects anything a corrupted save could contain', () => {
    expect(isCemeteryEntry(null)).toBe(false)
    expect(isCemeteryEntry({})).toBe(false)
    expect(isCemeteryEntry(entry({ skinId: 'dragon' }))).toBe(false)
    expect(isCemeteryEntry(entry({ accessoryId: 'hat' }))).toBe(false)
    expect(isCemeteryEntry(entry({ daysSurvived: 'four' as never }))).toBe(false)
    expect(isCemeteryEntry(entry({ diedAt: Number.NaN }))).toBe(false)
    expect(isCemeteryEntry(entry({ epitaph: 42 as never }))).toBe(false)
  })
})

describe('isCemetery', () => {
  const payload = {
    schemaVersion: CEMETERY_SCHEMA_VERSION,
    entries: [entry(), entry({ name: 'Mochi', diedAt: NOW + 1 })],
  }

  test('accepts a payload with two graves', () => {
    expect(isCemetery(payload)).toBe(true)
    expect(payload.entries).toHaveLength(2)
  })

  test('rejects the wrong version, shape or content', () => {
    expect(isCemetery(null)).toBe(false)
    expect(isCemetery({ ...payload, schemaVersion: 99 })).toBe(false)
    expect(isCemetery({ ...payload, entries: 'nope' })).toBe(false)
    expect(isCemetery({ ...payload, entries: [null] })).toBe(false)
    expect(isCemetery({ ...payload, entries: [entry({ skinId: 'dragon' })] })).toBe(
      false,
    )
  })
})

describe('addEntry', () => {
  test('puts the newest grave first', () => {
    const older = entry({ name: 'Peanut', diedAt: NOW })
    const newer = entry({ name: 'Mochi', diedAt: NOW + 1000 })

    const result = addEntry([older], newer)

    expect(result.map((item) => item.name)).toEqual(['Mochi', 'Peanut'])
  })

  test('never records the same death twice', () => {
    const grave = entry()

    const result = addEntry(addEntry([], grave), grave)

    expect(result).toHaveLength(1)
  })

  test('caps the list and drops the oldest', () => {
    let list: CemeteryEntry[] = []
    for (let index = 0; index < CEMETERY_MAX_ENTRIES + 10; index += 1) {
      list = addEntry(list, entry({ name: `Ham ${index}`, diedAt: NOW + index }))
    }

    expect(list).toHaveLength(CEMETERY_MAX_ENTRIES)
    expect(list[0].name).toBe(`Ham ${CEMETERY_MAX_ENTRIES + 9}`)
    expect(list[list.length - 1].name).toBe(
      `Ham ${CEMETERY_MAX_ENTRIES + 10 - CEMETERY_MAX_ENTRIES}`,
    )
  })

  test('honours an explicit maximum', () => {
    const list = addEntry([entry({ diedAt: 1 }), entry({ diedAt: 2 })], entry({ diedAt: 3 }), 2)
    expect(list).toHaveLength(2)
    expect(list[0].diedAt).toBe(3)
  })
})

describe('toCemeteryEntry', () => {
  test('copies the run and its immutable record into a frozen grave', () => {
    const run = createRun('Mochi', NOW)
    const death = buildDeathRecord(run, 'starvation')

    const grave = toCemeteryEntry(run, death)

    expect(grave.name).toBe('Mochi')
    expect(grave.skinId).toBe(run.hamster.skinId)
    expect(grave.causeOfDeath).toBe(death.detail)
    expect(grave.epitaph).toBe(death.epitaph)
    expect(grave.daysSurvived).toBe(death.day)
    expect(grave.diedAt).toBe(death.diedAt)
    expect(Object.isFrozen(grave)).toBe(true)
  })

  test('never reports fewer than one day', () => {
    const run = createRun('Mochi', NOW)
    const death = { ...buildDeathRecord(run, 'starvation'), day: 0 }
    expect(toCemeteryEntry(run, death).daysSurvived).toBe(1)
  })
})
