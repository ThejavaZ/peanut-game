import { describe, expect, test } from 'bun:test'
import {
  SEEDS_GRID_COLS,
  SEEDS_GRID_ROWS,
  SEEDS_HUNGER_CAP,
  SEEDS_SECONDS,
  SEEDS_TOTAL,
} from '../src/game/config'
import { MINIGAMES } from '../src/game/data/minigames'
import { SEEDS_CELLS, hungerFor, isSeed, seedCells } from '../src/game/seeds'

describe('the board', () => {
  test('is twelve cells holding five seeds', () => {
    expect(SEEDS_CELLS).toBe(SEEDS_GRID_COLS * SEEDS_GRID_ROWS)
    expect(SEEDS_CELLS).toBe(12)
    expect(SEEDS_TOTAL).toBeLessThan(SEEDS_CELLS)
    expect(SEEDS_SECONDS).toBeGreaterThan(0)
  })

  test('hides exactly five unique cells inside the grid', () => {
    const hidden = seedCells(() => 0.42)

    expect(hidden).toHaveLength(SEEDS_TOTAL)
    expect(new Set(hidden).size).toBe(SEEDS_TOTAL)
    for (const cell of hidden) {
      expect(cell).toBeGreaterThanOrEqual(0)
      expect(cell).toBeLessThan(SEEDS_CELLS)
    }
  })

  test('terminates when the random source is degenerate', () => {
    // A fake that always returns 0, and one that returns 1: neither may loop
    // forever on an empty slice.
    const alwaysLow = seedCells(() => 0)
    const alwaysHigh = seedCells(() => 1)

    expect(alwaysLow).toHaveLength(SEEDS_TOTAL)
    expect(new Set(alwaysLow).size).toBe(SEEDS_TOTAL)
    expect(alwaysHigh).toHaveLength(SEEDS_TOTAL)
    expect(new Set(alwaysHigh).size).toBe(SEEDS_TOTAL)
  })
})

describe('finding seeds', () => {
  const hidden = [1, 4, 6, 9, 11]

  test('recognises a seed and an empty cell', () => {
    expect(isSeed(hidden, 4)).toBe(true)
    expect(isSeed(hidden, 11)).toBe(true)
    expect(isSeed(hidden, 0)).toBe(false)
    expect(isSeed(hidden, 7)).toBe(false)
  })

  test('pays ten points a seed, capped below five seeds', () => {
    expect(hungerFor(0)).toBe(0)
    expect(hungerFor(1)).toBe(10)
    expect(hungerFor(2)).toBe(20)
    // Four seeds would earn 40; the cap is 35.
    expect(hungerFor(4)).toBe(SEEDS_HUNGER_CAP)
    expect(hungerFor(SEEDS_TOTAL)).toBe(SEEDS_HUNGER_CAP)
  })

  test('never pays a negative reward', () => {
    expect(hungerFor(-3)).toBe(0)
  })
})

describe('the seeds registration', () => {
  test('previews the reward it will pay', () => {
    const seeds = MINIGAMES.seeds

    expect(seeds.title).toBe('Find the Seeds')
    expect(seeds.rewardPreview).toBe(
      `Up to +${SEEDS_HUNGER_CAP} hunger · ${SEEDS_SECONDS} seconds`,
    )
    expect(seeds.reward.effects.hunger).toBe(SEEDS_HUNGER_CAP)
    expect(seeds.description.length).toBeGreaterThan(0)
    // The board itself is the set of tries: no separate attempt counter.
    expect(seeds.maxAttempts).toBeUndefined()
  })

  test('is the fourth minigame of the milestone', () => {
    expect(Object.keys(MINIGAMES)).toHaveLength(5)
  })
})
