import { describe, expect, test } from 'bun:test'
import {
  MAZE_HAPPINESS,
  MINIGAME_GAP_SECONDS,
  SAVE_SCHEMA_VERSION,
} from '../src/game/config'
import { MINIGAMES } from '../src/game/data/minigames'
import {
  applyMinigameReward,
  minigameGap,
} from '../src/game/minigames'
import {
  MAZE_HEIGHT,
  MAZE_ROWS,
  MAZE_START,
  MAZE_WIDTH,
  canMove,
  cellAt,
  isSolved,
  move,
  solveLength,
} from '../src/game/maze'
import { createRun } from '../src/game/rules'
import { isGameState, migrateSave } from '../src/services/SaveService'
import type { GameState } from '../src/types/game'

const NOW = 1_700_000_000_000

function makeRun(): GameState {
  return createRun('Mochi', NOW)
}

function at(run: GameState, elapsed: number): GameState {
  return { ...run, elapsedSeconds: elapsed }
}

describe('the grid', () => {
  test('holds only walls, floors, one start and one exit', () => {
    const chars = MAZE_ROWS.join('')
    expect(MAZE_ROWS).toHaveLength(MAZE_HEIGHT)
    for (const row of MAZE_ROWS) {
      expect(row).toHaveLength(MAZE_WIDTH)
    }
    expect(chars).not.toContain('?')
    expect([...chars].filter((char) => char === 'S')).toHaveLength(1)
    expect([...chars].filter((char) => char === 'E')).toHaveLength(1)
  })

  test('classifies walls, floors, the exit and the void', () => {
    expect(cellAt(0, 0)).toBe('floor') // the start
    expect(cellAt(4, 4)).toBe('exit')
    expect(cellAt(2, 0)).toBe('wall')
    expect(cellAt(-1, 0)).toBe('void')
    expect(cellAt(5, 0)).toBe('void')
    expect(cellAt(0, -1)).toBe('void')
    expect(cellAt(0, 5)).toBe('void')
  })

  test('is solvable, in eight steps', () => {
    expect(solveLength()).toBe(8)
  })
})

describe('collisions', () => {
  test('cannot walk into a wall', () => {
    // From the start: down and left are both closed.
    expect(canMove(MAZE_START, 'down')).toBe(false)
    expect(canMove(MAZE_START, 'left')).toBe(false)
    expect(move(MAZE_START, 'down')).toBe(MAZE_START)
    expect(move(MAZE_START, 'left')).toBe(MAZE_START)
  })

  test('cannot walk out of the level', () => {
    expect(canMove({ x: 0, y: 0 }, 'left')).toBe(false)
    expect(canMove({ x: 4, y: 4 }, 'right')).toBe(false)
    expect(canMove({ x: 4, y: 4 }, 'down')).toBe(false)
    expect(canMove({ x: 0, y: 0 }, 'up')).toBe(false)
  })

  test('walks onto free floor and onto the exit', () => {
    expect(canMove(MAZE_START, 'right')).toBe(true)
    expect(move(MAZE_START, 'right')).toEqual({ x: 1, y: 0 })
    expect(canMove({ x: 3, y: 4 }, 'right')).toBe(true)
    expect(move({ x: 3, y: 4 }, 'right')).toEqual({ x: 4, y: 4 })
  })

  test('the solution ends on the exit and nowhere before it', () => {
    expect(isSolved(MAZE_START)).toBe(false)
    expect(isSolved({ x: 3, y: 4 })).toBe(false)
    expect(isSolved({ x: 4, y: 4 })).toBe(true)
  })

  test('a blocked step does not count as a step', () => {
    const before = move(MAZE_START, 'down')
    expect(before).toBe(MAZE_START)
  })
})

describe('the maze reward', () => {
  test('declares the preview it will apply', () => {
    const maze = MINIGAMES.maze
    expect(maze.rewardPreview).toBe(
      `+${MAZE_HAPPINESS} happiness · clears every care cooldown`,
    )
    expect(maze.reward.effects.happiness).toBe(MAZE_HAPPINESS)
    expect(maze.reward.clearsCooldowns).toBe(true)
    expect(maze.maxAttempts).toBeUndefined()
  })

  test('clears the care cooldowns — and the wheel does not', () => {
    const busy: GameState = {
      ...makeRun(),
      cooldowns: { feed: 8, water: 8, clean: 20, play: 12, sleep: 45 },
    }

    const afterMaze = applyMinigameReward(busy, MINIGAMES.maze.reward)
    expect(afterMaze.cooldowns.feed).toBe(0)

    const afterWheel = applyMinigameReward(busy, MINIGAMES.wheel.reward)
    expect(afterWheel.cooldowns.feed).toBe(8)
  })
})

describe('the gap between minigames', () => {
  test('starts at the full gap the moment a minigame finishes', () => {
    const played = applyMinigameReward(makeRun(), MINIGAMES.maze.reward)

    expect(played.lastMinigameAt).toBe(played.elapsedSeconds)
    expect(minigameGap(played)).toBe(MINIGAME_GAP_SECONDS)
  })

  test('counts down with the clock and opens at zero', () => {
    const played = applyMinigameReward(makeRun(), MINIGAMES.wheel.reward)

    expect(minigameGap(at(played, played.elapsedSeconds + 30))).toBe(30)
    expect(minigameGap(at(played, played.elapsedSeconds + 59))).toBe(1)
    expect(minigameGap(at(played, played.elapsedSeconds + 60))).toBe(0)
    expect(minigameGap(at(played, played.elapsedSeconds + 600))).toBe(0)
  })

  test('a fresh run may play immediately', () => {
    expect(minigameGap(makeRun())).toBe(MINIGAME_GAP_SECONDS)
  })
})

describe('three minigames in a row still leave the bars necessary', () => {
  test('no minigame can feed, water or clean', () => {
    let run = makeRun()
    run = { ...run, hamster: { ...run.hamster, needs: { ...run.hamster.needs, hunger: 10, thirst: 12, hygiene: 14 } } }

    run = applyMinigameReward(run, MINIGAMES.wheel.reward)
    run = applyMinigameReward(run, MINIGAMES.maze.reward)
    run = applyMinigameReward(run, MINIGAMES['nap-time'].reward)

    // Happiness may rise, and the nap decays time — but hunger, thirst and
    // hygiene can only go down: the bars still have to be managed by hand.
    expect(run.hamster.needs.hunger).toBeLessThanOrEqual(10)
    expect(run.hamster.needs.thirst).toBeLessThanOrEqual(12)
    expect(run.hamster.needs.hygiene).toBeLessThanOrEqual(14)
    expect(run.hamster.needs.happiness).toBeGreaterThan(0)
  })
})

describe('save schema v6', () => {
  test('rejects a v5 save and upgrades it with the gap at zero', () => {
    const v5 = { ...makeRun(), schemaVersion: 5 }
    delete (v5 as Partial<GameState>).lastMinigameAt

    expect(isGameState(v5)).toBe(false)

    const migrated = migrateSave(v5) as GameState

    expect(isGameState(migrated)).toBe(true)
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.lastMinigameAt).toBe(0)
    expect(minigameGap(migrated)).toBe(MINIGAME_GAP_SECONDS)
  })

  test('a fresh run validates with the gap in place', () => {
    expect(isGameState(createRun('Mochi', NOW))).toBe(true)
  })
})
