import { describe, expect, test } from 'bun:test'
import { seededRandom } from './prng'
import {
  MAX_AGE_DAYS,
  SECONDS_PER_DAY,
} from '../src/game/config'
import {
  advanceRun,
  applyEventChoice,
  createRun,
} from '../src/game/rules'
import type { GameState, Needs } from '../src/types/game'

const NOW = 1_700_000_000_000

const net = (effects: Partial<Needs>): number =>
  Object.values(effects).reduce((sum, value) => sum + (value ?? 0), 0)

/**
 * Total neglect: no care at all, and whatever an event offers, take the worst
 * of it — the choices a careless player makes. Bounded so a future bug reports
 * a failure instead of hanging the suite.
 */
function neglectUntilDeath(): { seconds: number; cause: string } {
  let run: GameState = createRun('Balance', NOW)
  let guard = 0
  // Seeded: the event scheduler is genuinely random, and unseeded this ran a
  // different game every time. Same seed, same verdict, on every machine.
  const random = seededRandom(0xba1a)

  while (!run.death && guard < 12_000) {
    guard += 1

    const pending = run.events.pending
    if (pending) {
      const worst = [...pending.choices].sort(
        (a, b) => net(a.effects) - net(b.effects),
      )[0]
      run = applyEventChoice(run, worst.id)
      continue
    }

    run = advanceRun(run, 1, random)
  }

  return { seconds: run.elapsedSeconds, cause: run.death?.causeId ?? 'none' }
}

describe('the balance targets from the roadmap', () => {
  test('a neglected life dies between ten and fifteen minutes', () => {
    const { seconds, cause } = neglectUntilDeath()

    // Roadmap §6: "readable in 5 minutes, deadly after ~10 minutes of neglect".
    expect(seconds).toBeGreaterThanOrEqual(10 * 60)
    expect(seconds).toBeLessThanOrEqual(15 * 60)
    expect(cause).not.toBe('none')
  })

  test('the inevitable ending never beats the neglect one', () => {
    const oldAge = MAX_AGE_DAYS * SECONDS_PER_DAY

    // If old age arrived first, negligence would become unreachable and the
    // game would never punish anything.
    expect(neglectUntilDeath().seconds).toBeLessThan(oldAge)
  })

  test('a full life still ends inside the five to fifteen minute target', () => {
    const oldAge = MAX_AGE_DAYS * SECONDS_PER_DAY

    expect(oldAge).toBeGreaterThanOrEqual(5 * 60)
    expect(oldAge).toBeLessThanOrEqual(15 * 60)
  })
})
