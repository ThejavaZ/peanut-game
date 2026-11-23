import type { DeathCauseId } from '../types/game'

export const OUTSIDE_HAPPINESS = 18
export const OUTSIDE_COLUMNS = 8
export const OUTSIDE_ROWS = 5
export const OUTSIDE_WANDER_MS = 850
export const OUTSIDE_PROGRESS_TO_WIN = 20
export const OUTSIDE_REACTION_MS = 2500
export const OUTSIDE_RESCUE_PENALTY = 6

export interface OutsidePosition {
  readonly x: number
  readonly y: number
}

export type OutsideDirection = 'up' | 'down' | 'left' | 'right'
export type OutsideHazard = 'snake' | 'truck'

const DIRECTIONS: readonly OutsideDirection[] = [
  'up',
  'down',
  'left',
  'right',
]

export const OUTSIDE_START_PLAYER: OutsidePosition = { x: 2, y: 2 }
export const OUTSIDE_START_HAMSTER: OutsidePosition = { x: 3, y: 2 }

export function moveOutsidePlayer(
  position: OutsidePosition,
  direction: OutsideDirection,
): OutsidePosition {
  const delta: Record<OutsideDirection, OutsidePosition> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  }
  const next = delta[direction]

  return {
    x: Math.max(0, Math.min(OUTSIDE_COLUMNS - 1, position.x + next.x)),
    y: Math.max(0, Math.min(OUTSIDE_ROWS - 1, position.y + next.y)),
  }
}

export function outsideDistance(
  first: OutsidePosition,
  second: OutsidePosition,
): number {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y)
}

export function wanderHamster(
  position: OutsidePosition,
  roll: number,
): OutsidePosition {
  const available = DIRECTIONS.map((direction) =>
    moveOutsidePlayer(position, direction),
  ).filter(
    (next) => next.x !== position.x || next.y !== position.y,
  )

  return available[Math.min(available.length - 1, Math.floor(roll * available.length))]
}

/** The garden's upper-right corner is snake grass; its bottom row is a road. */
export function outsideHazardZone(
  position: OutsidePosition,
): OutsideHazard | null {
  if (position.y === OUTSIDE_ROWS - 1) {
    return 'truck'
  }
  if (position.x >= OUTSIDE_COLUMNS - 2 && position.y <= 1) {
    return 'snake'
  }
  return null
}

interface NearbyDanger {
  hazard: OutsideHazard
  tilesAway: number
}

function nearestDanger(position: OutsidePosition): NearbyDanger | null {
  let closest: NearbyDanger | null = null

  for (let y = 0; y < OUTSIDE_ROWS; y += 1) {
    for (let x = 0; x < OUTSIDE_COLUMNS; x += 1) {
      const hazard = outsideHazardZone({ x, y })
      if (!hazard) {
        continue
      }

      const tilesAway = outsideDistance(position, { x, y })
      if (!closest || tilesAway < closest.tilesAway) {
        closest = { hazard, tilesAway }
      }
    }
  }

  return closest
}

/**
 * Wandering near danger raises the odds; being far from the player raises
 * them further. Staying with Peanut keeps the danger low, not impossible.
 */
export function rollOutsideHazard(
  position: OutsidePosition,
  playerDistance: number,
  roll: number,
): OutsideHazard | null {
  const danger = nearestDanger(position)
  if (!danger || danger.tilesAway > 2) {
    return null
  }

  const zoneChance = [0.14, 0.08, 0.03][danger.tilesAway]
  const separationFactor =
    playerDistance <= 1
      ? 0.25
      : playerDistance === 2
        ? 0.7
        : Math.min(1.5, 0.8 + (playerDistance - 2) * 0.12)

  return roll < zoneChance * separationFactor ? danger.hazard : null
}

export function deathCauseForOutsideHazard(
  hazard: OutsideHazard,
): DeathCauseId {
  return hazard === 'snake' ? 'outside-snake' : 'outside-truck'
}
