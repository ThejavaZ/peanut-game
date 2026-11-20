import { describe, expect, test } from 'bun:test'
import {
  MAX_TICK_SECONDS,
  NAP_TIME_HEALTH,
  NAP_TIME_SECONDS,
} from '../src/game/config'
import {
  MINIGAME_LIST,
  MINIGAMES,
} from '../src/game/data/minigames'
import {
  applyMinigameReward,
  describeReward,
} from '../src/game/minigames'
import { createRun, advanceRun } from '../src/game/rules'
import { gameReducer } from '../src/hooks/useGameRun'
import type { GameState, MinigameReward } from '../src/types/game'

const NOW = 1_700_000_000_000

function makeRun(): GameState {
  return createRun('Mochi', NOW)
}

function withNeeds(run: GameState, health: number): GameState {
  return {
    ...run,
    hamster: { ...run.hamster, needs: { ...run.hamster.needs, health } },
  }
}

describe('the reward contract', () => {
  test('applies the deltas, clamped to the bounds', () => {
    const run = makeRun()
    const full = applyMinigameReward(run, { effects: { hunger: 40 } })
    expect(full.hamster.needs.hunger).toBe(100)

    const hurt = applyMinigameReward(withNeeds(run, 50), {
      effects: { health: NAP_TIME_HEALTH },
    })
    expect(hurt.hamster.needs.health).toBe(65)
  })

  test('an empty reward changes nothing', () => {
    // What "leaving without finishing" amounts to at the engine level.
    const run = makeRun()
    const untouched = applyMinigameReward(run, { effects: {} })
    expect(untouched.hamster.needs).toEqual(run.hamster.needs)
    expect(untouched.cooldowns).toEqual(run.cooldowns)
    expect(untouched.elapsedSeconds).toBe(run.elapsedSeconds)
  })

  test('clears every care cooldown only when asked', () => {
    const busy: GameState = {
      ...makeRun(),
      cooldowns: { feed: 8, water: 8, clean: 20, play: 12, sleep: 45 },
    }

    const kept = applyMinigameReward(busy, { effects: { happiness: 5 } })
    expect(kept.cooldowns.feed).toBe(8)

    const cleared = applyMinigameReward(busy, {
      effects: {},
      clearsCooldowns: true,
    })
    expect(cleared.cooldowns).toEqual({
      feed: 0,
      water: 0,
      clean: 0,
      play: 0,
      sleep: 0,
    })
  })

  test('advances the clock, decaying as real time would', () => {
    const run = withNeeds(makeRun(), 50)
    const napped = applyMinigameReward(run, {
      effects: { health: NAP_TIME_HEALTH },
      advanceSeconds: NAP_TIME_SECONDS,
    })

    expect(napped.elapsedSeconds).toBe(run.elapsedSeconds + NAP_TIME_SECONDS)
    // 60 s of decay at 0.28/s, applied after the reward landed.
    expect(napped.hamster.needs.hunger).toBeCloseTo(100 - 0.28 * 60, 4)
    // 50 → +15 reward, then recovery while every need stays comfortable.
    expect(napped.hamster.needs.health).toBeCloseTo(68, 4)
  })

  test('never touches a dead run', () => {
    // All needs empty: the engine marks the run dead on the next tick.
    const dying: GameState = {
      ...makeRun(),
      hamster: {
        ...makeRun().hamster,
        needs: { hunger: 0, thirst: 0, hygiene: 0, happiness: 0, health: 0 },
      },
    }
    const dead = advanceRun(dying, 1)
    expect(dead.death).not.toBeNull()

    expect(applyMinigameReward(dead, { effects: { health: 50 } })).toBe(dead)
  })
})

describe('describeReward', () => {
  test('names every effect, the advance and the cooldown wipe', () => {
    const reward: MinigameReward = {
      effects: { health: 15, hunger: -8 },
      advanceSeconds: 60,
      clearsCooldowns: true,
    }
    const text = describeReward(reward)

    expect(text).toContain('Health +15')
    expect(text).toContain('Hunger −8')
    expect(text).toContain('advances 60s')
    expect(text).toContain('clears every care cooldown')
  })

  test('says so when nothing happens', () => {
    expect(describeReward({ effects: {} })).toBe('nothing changes')
  })

  test('always describes the reward the shell will actually apply', () => {
    const nap = MINIGAMES['nap-time']
    const text = describeReward(nap.reward)

    expect(text).toContain(`Health +${NAP_TIME_HEALTH}`)
    expect(text).toContain(`advances ${NAP_TIME_SECONDS}s`)
  })
})

describe('the minigame registry', () => {
  test('ships Nap Time, ready to play', () => {
    const nap = MINIGAMES['nap-time']
    expect(MINIGAME_LIST).toHaveLength(1)
    expect(nap.title.length).toBeGreaterThan(0)
    expect(nap.actionLabel.length).toBeGreaterThan(0)
    expect(nap.description.length).toBeGreaterThan(0)
    expect(nap.reward.effects.health).toBe(NAP_TIME_HEALTH)
    expect(nap.reward.advanceSeconds).toBe(NAP_TIME_SECONDS)
  })
})

describe('the clock is frozen inside a minigame', () => {
  test('a suspended tick is dropped instead of applied', () => {
    const run = makeRun()
    const skipped = gameReducer(run, {
      type: 'tick',
      now: NOW + 60_000,
      suspended: true,
    })

    expect(skipped).toBe(run)
    expect(skipped?.elapsedSeconds).toBe(run.elapsedSeconds)
    expect(skipped?.hamster.needs).toEqual(run.hamster.needs)
  })

  test('the same tick applies once the minigame is gone', () => {
    const run = makeRun()
    const advanced = gameReducer(run, {
      type: 'tick',
      now: NOW + 60_000,
    })

    expect(advanced).not.toBe(run)
    expect(advanced?.elapsedSeconds).toBe(MAX_TICK_SECONDS)
    expect(advanced?.hamster.needs.hunger).toBeLessThan(100)
  })

  test('refreshing the clock after a minigame costs no decay', () => {
    const run = makeRun()
    const resumed = gameReducer(run, {
      type: 'refreshClock',
      now: NOW + 60_000,
    })

    expect(resumed?.lastUpdatedAt).toBe(NOW + 60_000)
    expect(resumed?.elapsedSeconds).toBe(run.elapsedSeconds)
    expect(resumed?.hamster.needs).toEqual(run.hamster.needs)
  })

  test('the reward action applies once through the reducer', () => {
    const run = makeRun()
    const rewarded = gameReducer(run, {
      type: 'applyReward',
      reward: { effects: { happiness: 30 } },
    })

    expect(rewarded?.hamster.needs.happiness).toBe(100)
    expect(rewarded?.lastUpdatedAt).toBe(run.lastUpdatedAt)
  })
})
