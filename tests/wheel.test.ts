import { describe, expect, test } from 'bun:test'
import {
  WHEEL_ATTEMPTS,
  WHEEL_GOOD_TOLERANCE,
  WHEEL_HAPPINESS_CAP,
  WHEEL_PERFECT_TOLERANCE,
} from '../src/game/config'
import { MINIGAMES } from '../src/game/data/minigames'
import {
  angularDistance,
  happinessFor,
  scoreSwing,
  targetForSwing,
} from '../src/game/wheel'

describe('angles', () => {
  test('measures the short way around the wheel', () => {
    expect(angularDistance(10, 350)).toBe(20)
    expect(angularDistance(0, 180)).toBe(180)
    expect(angularDistance(45, 45)).toBe(0)
    expect(angularDistance(-90, 270)).toBe(0)
  })

  test('moves the target every swing, the same way every time', () => {
    const first = targetForSwing(0)
    const second = targetForSwing(1)

    expect(first).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(360)
    expect(second).not.toBe(first)
    expect(targetForSwing(0)).toBe(first)
    expect(targetForSwing(7)).toBe(targetForSwing(7))
  })
})

describe('scoring a swing', () => {
  test('lands perfect inside the tolerance', () => {
    const target = targetForSwing(0)
    expect(scoreSwing(target, target)).toBe('perfect')
    expect(scoreSwing(target + WHEEL_PERFECT_TOLERANCE, target)).toBe('perfect')
  })

  test('lands good outside the perfect zone', () => {
    const target = targetForSwing(0)
    const justOutside = target + WHEEL_PERFECT_TOLERANCE + 1
    expect(scoreSwing(justOutside, target)).toBe('good')
    expect(scoreSwing(target + WHEEL_GOOD_TOLERANCE, target)).toBe('good')
  })

  test('misses beyond the good zone, including across the seam', () => {
    const target = targetForSwing(0)
    expect(scoreSwing(target + WHEEL_GOOD_TOLERANCE + 1, target)).toBe('miss')
    // 180° away is a miss even though the raw subtraction is large either way.
    expect(scoreSwing(target + 180, target)).toBe('miss')
  })

  test('a swing just past the seam still counts', () => {
    const target = targetForSwing(0)
    const wrapped = target > 350 ? target - 360 + 5 : target + 360 - 5
    expect(scoreSwing(wrapped, target)).toBe('perfect')
  })
})

describe('the happiness cap', () => {
  test('pays what the swings earned', () => {
    expect(happinessFor(['good', 'good'])).toBe(12)
    expect(happinessFor(['perfect', 'good'])).toBe(18)
    expect(happinessFor(['miss', 'miss', 'miss'])).toBe(0)
  })

  test('never pays more than the cap, even on a perfect session', () => {
    const perfectSession: SwingResult[] = Array.from(
      { length: WHEEL_ATTEMPTS },
      () => 'perfect',
    )
    expect(happinessFor(perfectSession)).toBe(WHEEL_HAPPINESS_CAP)
    expect(happinessFor(perfectSession)).toBeLessThan(
      WHEEL_ATTEMPTS * 12,
    )
  })

  test('an empty session pays nothing', () => {
    expect(happinessFor([])).toBe(0)
  })
})

describe('the wheel registration', () => {
  test('grants three attempts and previews the cap honestly', () => {
    const wheel = MINIGAMES.wheel

    expect(wheel.maxAttempts).toBe(WHEEL_ATTEMPTS)
    expect(wheel.rewardPreview).toBe(`Up to +${WHEEL_HAPPINESS_CAP} happiness`)
    expect(wheel.reward.effects.happiness).toBe(WHEEL_HAPPINESS_CAP)
    expect(wheel.title.length).toBeGreaterThan(0)
    expect(wheel.description.length).toBeGreaterThan(0)
  })

  test('nap time still declares no attempts', () => {
    expect(MINIGAMES['nap-time'].maxAttempts).toBeUndefined()
  })
})
