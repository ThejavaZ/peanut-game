import { describe, expect, test } from 'bun:test'
import {
  EVENT_CHANCE,
  EVENT_MIN_INTERVAL_SECONDS,
  MAX_AGE_DAYS,
  SAVE_SCHEMA_VERSION,
  SECONDS_PER_DAY,
} from '../src/game/config'
import { EVENTS } from '../src/game/data/events'
import {
  advanceEvents,
  createEventScheduler,
  dayOf,
  isConditionMet,
  isEventEligible,
  pickEvent,
} from '../src/game/events'
import {
  advanceRun,
  applyEventChoice,
  createRun,
} from '../src/game/rules'
import { isGameState, migrateSave } from '../src/services/SaveService'
import type { GameEvent, GameState, Needs } from '../src/types/game'

const NOW = 1_700_000_000_000
const DAY = SECONDS_PER_DAY

/** Always rolls under EVENT_CHANCE and always takes the first candidate. */
const alwaysFire = () => 0
const neverFire = () => 0.999

function at(elapsed: number, overrides: Partial<Needs> = {}): GameState {
  const base = createRun('Peanut', NOW)
  return {
    ...base,
    elapsedSeconds: elapsed,
    hamster: {
      ...base.hamster,
      needs: { ...base.hamster.needs, ...overrides },
    },
  }
}

const synthetic = (overrides: Partial<GameEvent>): GameEvent => ({
  id: 'test-event',
  title: 'Test',
  description: 'Test event',
  weight: 10,
  cooldownSeconds: 0,
  oncePerRun: false,
  conditions: [{ type: 'dayAtLeast', day: 1 }],
  choices: [{ id: 'go', label: 'Go', hint: 'Nothing', effects: { hunger: 5 } }],
  ...overrides,
})

describe('scheduler state', () => {
  test('a fresh run has nothing pending and nothing fired', () => {
    const scheduler = createRun('Peanut', NOW).events
    expect(scheduler).toEqual(createEventScheduler())
    expect(scheduler.pending).toBeNull()
    expect(scheduler.fired).toEqual([])
    expect(scheduler.lastEventAt).toBe(0)
  })

  test('day is derived exactly like the HUD clock', () => {
    expect(dayOf(0)).toBe(1)
    expect(dayOf(DAY - 1)).toBe(1)
    expect(dayOf(DAY)).toBe(2)
    expect(dayOf(MAX_AGE_DAYS * DAY)).toBe(MAX_AGE_DAYS + 1)
  })
})

describe('conditions', () => {
  const state = at(2 * DAY - 1, { hunger: 40 })

  test('needAtMost and needAtLeast', () => {
    expect(
      isConditionMet({ type: 'needAtMost', need: 'hunger', value: 40 }, state),
    ).toBe(true)
    expect(
      isConditionMet({ type: 'needAtMost', need: 'hunger', value: 39 }, state),
    ).toBe(false)
    expect(
      isConditionMet(
        { type: 'needAtLeast', need: 'hunger', value: 41 },
        state,
      ),
    ).toBe(false)
    expect(
      isConditionMet({ type: 'needAtLeast', need: 'hunger', value: 40 }, state),
    ).toBe(true)
  })

  test('dayAtLeast and dayAtMost', () => {
    expect(isConditionMet({ type: 'dayAtLeast', day: 2 }, state)).toBe(true)
    expect(isConditionMet({ type: 'dayAtLeast', day: 3 }, state)).toBe(false)
    expect(isConditionMet({ type: 'dayAtMost', day: 2 }, state)).toBe(true)
    expect(isConditionMet({ type: 'dayAtMost', day: 1 }, state)).toBe(false)
  })
})

describe('the minimum interval', () => {
  test('no event fires before the global gap has passed', () => {
    const tooSoon = at(EVENT_MIN_INTERVAL_SECONDS - 1, { hunger: 30 })
    expect(advanceEvents(tooSoon, 1, alwaysFire)).toBe(tooSoon)
  })

  test('an event fires once the gap has passed', () => {
    const ready = at(EVENT_MIN_INTERVAL_SECONDS, { hunger: 30 })
    const queued = advanceEvents(ready, 1, alwaysFire)
    expect(queued.events.pending).not.toBeNull()
    expect(queued.events.lastEventAt).toBe(EVENT_MIN_INTERVAL_SECONDS)
  })

  test('no second event fires straight after the first', () => {
    const first = advanceEvents(
      at(EVENT_MIN_INTERVAL_SECONDS, { hunger: 30 }),
      1,
      alwaysFire,
    )
    expect(first.events.pending).not.toBeNull()

    // 'later' keeps hunger low, so the same event stays eligible by condition.
    const answered = applyEventChoice(first, 'later')
    expect(answered.events.pending).toBeNull()
    expect(answered.events.lastEventAt).toBe(EVENT_MIN_INTERVAL_SECONDS)
    expect(answered.hamster.needs.hunger).toBeLessThanOrEqual(35)

    // Ten seconds later the global gap (45 s) has not passed yet.
    const again: GameState = {
      ...answered,
      elapsedSeconds: EVENT_MIN_INTERVAL_SECONDS + 10,
    }
    expect(advanceEvents(again, 1, alwaysFire)).toBe(again)
  })

  test('the chance gate alone can hold an event back', () => {
    const ready = at(EVENT_MIN_INTERVAL_SECONDS, { hunger: 30 })
    expect(advanceEvents(ready, 1, neverFire)).toBe(ready)
    expect(EVENT_CHANCE).toBeGreaterThan(0)
    expect(EVENT_CHANCE).toBeLessThan(1)
  })
})

describe('once-per-run events', () => {
  // 240 s in: past day ≥ 2 so `cage-escape` can fire, and hunger high enough
  // to keep `empty-bowl` out. It is the first eligible event in the registry,
  // so a zero roll picks it every time.
  const elapsed = 2 * DAY

  test('fires exactly once, then never again in the same run', () => {
    const first = advanceEvents(at(elapsed, { hunger: 60 }), 1, alwaysFire)
    expect(first.events.pending?.id).toBe('cage-escape')
    expect(first.events.fired).toContain('cage-escape')

    const answered = applyEventChoice(first, 'chase')
    expect(answered.events.pending).toBeNull()

    // Well past its 180 s cooldown and the 45 s global gap. The scheduler
    // state has to come from `answered`, not from a fresh run, or `fired` is
    // empty and the whole test would prove nothing.
    const muchLater: GameState = { ...answered, elapsedSeconds: elapsed + 600 }
    expect(isEventEligible(EVENTS[1], muchLater)).toBe(false)

    const second = advanceEvents(muchLater, 1, alwaysFire)
    expect(
      second.events.fired.filter((id) => id === 'cage-escape'),
    ).toHaveLength(1)
    expect(second.events.pending?.id).not.toBe('cage-escape')
  })

  test('an event that has not fired yet stays eligible', () => {
    expect(isEventEligible(EVENTS[1], at(elapsed, { hunger: 60 }))).toBe(true)
  })
})

describe('condition-gated events', () => {
  test('nothing fires while every condition is false', () => {
    // Day 1, full belly: `empty-bowl` needs hunger ≤ 35, the other two need
    // day ≥ 2 and day ≥ 3.
    const quiet = at(EVENT_MIN_INTERVAL_SECONDS + 30, { hunger: 100 })
    expect(advanceEvents(quiet, 1, alwaysFire)).toBe(quiet)
  })

  test('the same state fires as soon as the condition becomes true', () => {
    const hungry = at(EVENT_MIN_INTERVAL_SECONDS + 30, { hunger: 30 })
    const queued = advanceEvents(hungry, 1, alwaysFire)
    expect(queued.events.pending?.id).toBe('empty-bowl')
  })

  test('a pending event is never interrupted by another one', () => {
    const queued = advanceEvents(
      at(EVENT_MIN_INTERVAL_SECONDS + 30, { hunger: 30 }),
      1,
      alwaysFire,
    )
    expect(queued.events.pending).not.toBeNull()
    expect(advanceEvents(queued, 600, alwaysFire)).toBe(queued)
  })
})

describe('picking by weight', () => {
  const light: GameEvent = synthetic({ id: 'light', weight: 9 })
  const heavy: GameEvent = synthetic({ id: 'heavy', weight: 1 })

  test('a zero roll takes the first candidate, a high roll the last', () => {
    expect(pickEvent([light, heavy], () => 0)?.id).toBe('light')
    expect(pickEvent([light, heavy], () => 0.95)?.id).toBe('heavy')
    expect(pickEvent([], () => 0)).toBeNull()
  })

  test('the heavier event wins far more often', () => {
    let lightWins = 0
    let heavyWins = 0
    for (let i = 0; i < 200; i += 1) {
      const random = () => i / 200
      const picked = pickEvent([light, heavy], random)
      if (picked?.id === 'light') {
        lightWins += 1
      } else {
        heavyWins += 1
      }
    }
    expect(lightWins).toBeGreaterThan(heavyWins * 4)
    expect(heavyWins).toBeGreaterThan(0)
  })
})

describe('answering an event', () => {
  const queued = advanceEvents(
    at(EVENT_MIN_INTERVAL_SECONDS + 30, { hunger: 30 }),
    1,
    alwaysFire,
  )

  test('applies the chosen effects and clears the pending event', () => {
    const answered = applyEventChoice(queued, 'fill')
    expect(answered.events.pending).toBeNull()
    expect(answered.hamster.needs.hunger).toBe(55)
    expect(answered.hamster.needs.hygiene).toBe(95)
  })

  test('clamps effects to the need bounds', () => {
    const full: GameState = {
      ...queued,
      hamster: { ...queued.hamster, needs: { ...queued.hamster.needs, hunger: 95 } },
    }
    const answered = applyEventChoice(full, 'fill')
    expect(answered.hamster.needs.hunger).toBe(100)
  })

  test('an unknown choice changes nothing at all', () => {
    expect(applyEventChoice(queued, 'nope')).toBe(queued)
  })

  test('nothing pending means nothing to answer', () => {
    const idle = at(EVENT_MIN_INTERVAL_SECONDS)
    expect(applyEventChoice(idle, 'fill')).toBe(idle)
  })
})

describe('the scheduler does not run by itself yet', () => {
  test('advanceRun never queues an event while EVENTS_ENABLED is false', () => {
    let run = at(EVENT_MIN_INTERVAL_SECONDS + 30, { hunger: 30 })
    for (let i = 0; i < 30; i += 1) {
      run = advanceRun(run, 10)
    }
    expect(run.events.pending).toBeNull()
  })

  test('a dead run schedules nothing', () => {
    const base = at(EVENT_MIN_INTERVAL_SECONDS + 30, { hunger: 30 })
    const dying: GameState = {
      ...base,
      hamster: {
        ...base.hamster,
        needs: { hunger: 0, thirst: 0, hygiene: 0, happiness: 0, health: 0 },
      },
    }

    const deadRun = advanceRun(dying, 1)
    expect(deadRun.death).not.toBeNull()
    expect(advanceEvents(deadRun, 60, alwaysFire)).toBe(deadRun)
  })
})

describe('event content', () => {
  test('ships three seed events with unique ids', () => {
    expect(EVENTS).toHaveLength(3)
    expect(new Set(EVENTS.map((event) => event.id)).size).toBe(EVENTS.length)
  })

  test('every event is well formed', () => {
    for (const event of EVENTS) {
      expect(event.weight).toBeGreaterThan(0)
      expect(event.cooldownSeconds).toBeGreaterThanOrEqual(0)
      expect(event.conditions.length).toBeGreaterThan(0)
      expect(event.choices.length).toBeGreaterThanOrEqual(1)
      expect(event.choices.length).toBeLessThanOrEqual(2)
      expect(event.title.length).toBeGreaterThan(0)
      expect(event.description.length).toBeGreaterThan(0)
      for (const choice of event.choices) {
        expect(Object.keys(choice.effects).length).toBeGreaterThan(0)
        expect(choice.hint.length).toBeGreaterThan(0)
      }
    }
  })

  test('choice ids are unique inside each event', () => {
    for (const event of EVENTS) {
      expect(new Set(event.choices.map((choice) => choice.id)).size).toBe(
        event.choices.length,
      )
    }
  })
})

describe('save validation for events', () => {
  test('accepts a run created by the engine', () => {
    expect(isGameState(createRun('Mochi', NOW))).toBe(true)
    expect(isGameState(advanceEvents(at(60, { hunger: 30 }), 1, alwaysFire))).toBe(
      true,
    )
  })

  test('rejects a scheduler that is missing', () => {
    const run = createRun('Mochi', NOW)
    expect(isGameState({ ...run, events: undefined })).toBe(false)
  })

  test('rejects an event with impossible choices or weight', () => {
    const threeChoices: GameEvent = synthetic({
      choices: [
        { id: 'a', label: 'A', hint: 'x', effects: { hunger: 1 } },
        { id: 'b', label: 'B', hint: 'x', effects: { hunger: 1 } },
        { id: 'c', label: 'C', hint: 'x', effects: { hunger: 1 } },
      ],
    })
    const base = at(60)
    expect(
      isGameState({
        ...base,
        events: { ...base.events, pending: threeChoices },
      }),
    ).toBe(false)
    expect(
      isGameState({
        ...base,
        events: {
          ...base.events,
          pending: synthetic({ weight: 0 }),
        },
      }),
    ).toBe(false)
    expect(
      isGameState({
        ...base,
        events: {
          ...base.events,
          pending: synthetic({
            conditions: [{ type: 'magic' as never, need: 'hunger' }],
          }),
        },
      }),
    ).toBe(false)
  })

  test('upgrades a v3 save with a default scheduler', () => {
    const v3 = {
      ...createRun('Mochi', NOW),
      schemaVersion: 3,
      // A real v3 payload has no `events` key at all.
      events: undefined,
    }

    const migrated = migrateSave(v3) as GameState

    expect(isGameState(migrated)).toBe(true)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.events).toEqual(createEventScheduler())
  })
})
