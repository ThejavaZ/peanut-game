import { describe, expect, test } from 'bun:test'
import {
  HAMSTER_STATE_SPRITES,
  SKIN_SPRITES,
  spriteFor,
} from '../src/components/hamster/skinSprites'

const IDLE = SKIN_SPRITES.hamster
const IDLE_GRID = IDLE.rows.join('')
const PALETTE_CHARS = new Set(Object.keys(IDLE.palette))

function eyesIn(rows: readonly string[]): number {
  return rows.filter((row) => row.includes('EE')).length
}

describe('the classic hamster poses', () => {
  test('eat and sleep are valid 16x16 grids drawn from the hamster palette', () => {
    for (const sprite of Object.values(HAMSTER_STATE_SPRITES)) {
      expect(sprite.rows).toHaveLength(16)
      for (const row of sprite.rows) {
        expect(row).toHaveLength(16)
        for (const char of row) {
          if (char !== '.') {
            expect(PALETTE_CHARS.has(char)).toBe(true)
          }
        }
      }
      // They borrow the base palette instead of inventing colours.
      expect(Object.keys(sprite.palette)).toEqual(Object.keys(IDLE.palette))
    }
  })

  test('every pose differs from the others', () => {
    const eat = HAMSTER_STATE_SPRITES.eat.rows.join('')
    const sleep = HAMSTER_STATE_SPRITES.sleep.rows.join('')

    expect(eat).not.toBe(IDLE_GRID)
    expect(sleep).not.toBe(IDLE_GRID)
    expect(eat).not.toBe(sleep)
  })

  test('sleep closes the eyes, idle and eat keep them open', () => {
    expect(eyesIn(IDLE.rows)).toBe(2)
    expect(eyesIn(HAMSTER_STATE_SPRITES.eat.rows)).toBe(2)
    expect(eyesIn(HAMSTER_STATE_SPRITES.sleep.rows)).toBe(1)
  })

  test('eating adds a crumb on the floor', () => {
    expect(HAMSTER_STATE_SPRITES.eat.rows[14]).toContain('d')
    expect(IDLE.rows[14]).toBe('................')
  })
})

describe('spriteFor', () => {
  test('gives the classic hamster its own poses', () => {
    expect(spriteFor('hamster', 'sleep')).toBe(HAMSTER_STATE_SPRITES.sleep)
    expect(spriteFor('hamster', 'eat')).toBe(HAMSTER_STATE_SPRITES.eat)
    expect(spriteFor('hamster', 'idle')).toBe(IDLE)
    // play is the hop animation and dead is upside down: both use the base grid.
    expect(spriteFor('hamster', 'play')).toBe(IDLE)
    expect(spriteFor('hamster', 'dead')).toBe(IDLE)
    expect(spriteFor('hamster')).toBe(IDLE)
  })

  test('never lends its pose to another skin', () => {
    for (const skinId of ['ferris', 'capybara', 'root', 'ruby'] as const) {
      expect(spriteFor(skinId, 'sleep')).toBe(SKIN_SPRITES[skinId])
      expect(spriteFor(skinId, 'eat')).toBe(SKIN_SPRITES[skinId])
    }
  })

  test('an unknown state degrades to idle instead of crashing', () => {
    expect(spriteFor('hamster', 'nonsense' as never)).toBe(IDLE)
  })
})
