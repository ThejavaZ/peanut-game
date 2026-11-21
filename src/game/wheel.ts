import {
  WHEEL_GOOD_POINTS,
  WHEEL_GOOD_TOLERANCE,
  WHEEL_HAPPINESS_CAP,
  WHEEL_PERFECT_POINTS,
  WHEEL_PERFECT_TOLERANCE,
} from './config'

export type SwingResult = 'perfect' | 'good' | 'miss'

function normalize(angle: number): number {
  return ((angle % 360) + 360) % 360
}

/**
 * Shortest distance between two angles: 350° and 10° are 20° apart, not 340°.
 * Without this the marker would score a miss right next to the target.
 */
export function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normalize(a) - normalize(b))
  return Math.min(diff, 360 - diff)
}

/**
 * The target moves every swing, deterministically, so a rhythm can be learned
 * but a position cannot be memorised. Pure by design: same swing, same target.
 */
export function targetForSwing(index: number): number {
  return normalize(index * 137 + 40)
}

export function scoreSwing(angle: number, target: number): SwingResult {
  const distance = angularDistance(angle, target)
  if (distance <= WHEEL_PERFECT_TOLERANCE) {
    return 'perfect'
  }
  if (distance <= WHEEL_GOOD_TOLERANCE) {
    return 'good'
  }
  return 'miss'
}

/**
 * Happiness for a session of swings, with the hard cap the issue asks for:
 * three perfect swings would earn 36, but the wheel can never pay more than
 * 25 — a minigame helps, it does not replace the bars.
 */
export function happinessFor(results: readonly SwingResult[]): number {
  const raw = results.reduce((sum, result) => {
    if (result === 'perfect') {
      return sum + WHEEL_PERFECT_POINTS
    }
    if (result === 'good') {
      return sum + WHEEL_GOOD_POINTS
    }
    return sum
  }, 0)

  return Math.min(WHEEL_HAPPINESS_CAP, raw)
}
