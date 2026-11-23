import { describe, expect, test } from 'bun:test'
import {
  OUTSIDE_COLUMNS,
  OUTSIDE_ROWS,
  moveOutsidePlayer,
  outsideDistance,
  outsideHazardZone,
  rollOutsideHazard,
  wanderHamster,
} from '../src/game/outside'
import type { OutsidePosition } from '../src/game/outside'

describe('outside movement', () => {
  test('moves in one tile and stays inside the map', () => {
    expect(moveOutsidePlayer({ x: 2, y: 2 }, 'right')).toEqual({ x: 3, y: 2 })
    expect(moveOutsidePlayer({ x: 0, y: 0 }, 'left')).toEqual({ x: 0, y: 0 })
    expect(
      moveOutsidePlayer(
        { x: OUTSIDE_COLUMNS - 1, y: OUTSIDE_ROWS - 1 },
        'down',
      ),
    ).toEqual({ x: OUTSIDE_COLUMNS - 1, y: OUTSIDE_ROWS - 1 })
  })

  test('wanders to a random neighboring tile, never through an edge', () => {
    const position: OutsidePosition = { x: 0, y: 0 }
    const next = wanderHamster(position, 0.99)

    expect(outsideDistance(position, next)).toBe(1)
    expect(next.x).toBeGreaterThanOrEqual(0)
    expect(next.y).toBeGreaterThanOrEqual(0)
  })
})

describe('outside hazards', () => {
  test('marks the snake grass and road as danger zones', () => {
    expect(outsideHazardZone({ x: 7, y: 0 })).toBe('snake')
    expect(outsideHazardZone({ x: 2, y: 4 })).toBe('truck')
    expect(outsideHazardZone({ x: 2, y: 2 })).toBeNull()
  })

  test('risk increases near a zone and when Peanut is far from the player', () => {
    const nearRoad = { x: 3, y: 3 }
    expect(rollOutsideHazard(nearRoad, 1, 0.025)).toBeNull()
    expect(rollOutsideHazard(nearRoad, 5, 0.01)).toBe('truck')
    expect(rollOutsideHazard({ x: 3, y: 1 }, 5, 0.01)).toBeNull()
  })
})
