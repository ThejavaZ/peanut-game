import {
  SEEDS_GRID_COLS,
  SEEDS_GRID_ROWS,
  SEEDS_HUNGER_CAP,
  SEEDS_TOTAL,
  SEED_HUNGER_POINTS,
} from './config'

export const SEEDS_CELLS = SEEDS_GRID_COLS * SEEDS_GRID_ROWS

/**
 * The cells hiding a seed. Everything here is pure given the random source, so
 * tests fix it and get the same board every time — the screen only draws.
 *
 * The index is clamped on purpose: a random source returning 1 (a test fake,
 * a bug) must not loop forever on an empty slice.
 */
export function seedCells(random: () => number = Math.random): number[] {
  const pool = Array.from({ length: SEEDS_CELLS }, (_, index) => index)
  const hidden: number[] = []

  while (hidden.length < SEEDS_TOTAL && pool.length > 0) {
    const index = Math.min(
      Math.max(Math.floor(random() * pool.length), 0),
      pool.length - 1,
    )
    hidden.push(...pool.splice(index, 1))
  }

  return hidden
}

export function isSeed(hidden: readonly number[], cell: number): boolean {
  return hidden.includes(cell)
}

/**
 * Partial by design: finding nothing pays nothing, finding every seed pays the
 * cap. Ten points each, capped at 35 — five seeds would earn 50.
 */
export function hungerFor(found: number): number {
  return Math.min(
    SEEDS_HUNGER_CAP,
    Math.max(0, Math.floor(found)) * SEED_HUNGER_POINTS,
  )
}
