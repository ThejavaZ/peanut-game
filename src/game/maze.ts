/**
 * Tiny Maze: a single fixed 5×5 level.
 *
 * The grid is data and movement is a pure function, which is what makes
 * collisions testable without a browser — every rule about walls, edges and
 * the exit lives here, and the screen only draws the result.
 *
 * Legend: `S` start, `E` exit, `#` wall, `.` floor.
 */
export const MAZE_ROWS = ['S.#..', '#...#', '###.#', '....#', '###.E'] as const

export const MAZE_WIDTH = 5
export const MAZE_HEIGHT = 5

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface MazePosition {
  x: number
  y: number
}

const DELTAS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
}

export const MAZE_START: MazePosition = { x: 0, y: 0 }

/** Out of bounds and walls are both failures: the level keeps you inside. */
export function cellAt(x: number, y: number): 'wall' | 'floor' | 'exit' | 'void' {
  if (y < 0 || y >= MAZE_HEIGHT || x < 0 || x >= MAZE_WIDTH) {
    return 'void'
  }
  const char = MAZE_ROWS[y][x]
  if (char === '#') {
    return 'wall'
  }
  if (char === 'E') {
    return 'exit'
  }
  return 'floor'
}

export function canMove(
  position: MazePosition,
  direction: Direction,
): boolean {
  const { dx, dy } = DELTAS[direction]
  const target = cellAt(position.x + dx, position.y + dy)
  return target === 'floor' || target === 'exit'
}

/** Returns the same position when the move is blocked — that is the collision. */
export function move(
  position: MazePosition,
  direction: Direction,
): MazePosition {
  const { dx, dy } = DELTAS[direction]
  if (!canMove(position, direction)) {
    return position
  }
  return { x: position.x + dx, y: position.y + dy }
}

export function isSolved(position: MazePosition): boolean {
  return cellAt(position.x, position.y) === 'exit'
}

/**
 * Breadth-first search for the shortest route. The test asserts its length, so
 * if anyone edits the grid into an unsolvable shape, CI fails instead of the
 * player.
 *
 * Returns null when the exit cannot be reached.
 */
export function solveLength(start: MazePosition = MAZE_START): number | null {
  const queue: { x: number; y: number; steps: number }[] = [
    { ...start, steps: 0 },
  ]
  const seen = new Set<string>([`${start.x},${start.y}`])

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      break
    }
    if (cellAt(current.x, current.y) === 'exit') {
      return current.steps
    }

    for (const direction of Object.keys(DELTAS) as Direction[]) {
      const { dx, dy } = DELTAS[direction]
      const nx = current.x + dx
      const ny = current.y + dy
      const key = `${nx},${ny}`
      if (seen.has(key)) {
        continue
      }
      const cell = cellAt(nx, ny)
      if (cell === 'wall' || cell === 'void') {
        continue
      }
      seen.add(key)
      queue.push({ x: nx, y: ny, steps: current.steps + 1 })
    }
  }

  return null
}
