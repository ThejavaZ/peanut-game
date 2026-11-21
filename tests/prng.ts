/**
 * Deterministic PRNG (mulberry32) for simulations that must not depend on
 * `Math.random`.
 *
 * The neglect and balance tests drive hundreds of ticks through a game whose
 * event scheduler is genuinely random. Left unseeded they were flaky — one run
 * in twenty let the events sustain the hamster long enough for old age to win.
 * Same seed, same sequence, same verdict, on every machine and every run.
 */
export function seededRandom(seed: number): () => number {
  let state = seed | 0

  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
