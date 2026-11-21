import { useCallback, useEffect, useState } from 'react'
import { MINIGAMES } from '../../game/data/minigames'
import {
  MAZE_HEIGHT,
  MAZE_START,
  MAZE_WIDTH,
  cellAt,
  isSolved,
  move,
} from '../../game/maze'
import type { Direction, MazePosition } from '../../game/maze'
import type { MinigameReward, SkinId } from '../../types/game'
import { SkinSprite } from '../../components/hamster/SkinSprite'
import { Button } from '../../components/ui/Button'

interface MazeGameProps {
  /** The player's own skin shows as the token — a crab walks the maze too. */
  skinId: SkinId
  onComplete: (reward: MinigameReward) => void
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

const PAD: { direction: Direction; label: string }[] = [
  { direction: 'up', label: '↑' },
  { direction: 'left', label: '←' },
  { direction: 'down', label: '↓' },
  { direction: 'right', label: '→' },
]

/**
 * Tiny Maze: walls are real, so every step goes through the same pure
 * `move()` — keyboard and pointer cannot disagree about a collision.
 *
 * The reward comes from the registry, never from here, so the preview the
 * shell showed is exactly what completion applies.
 */
export function MazeGame({ skinId, onComplete }: MazeGameProps) {
  const [position, setPosition] = useState<MazePosition>(MAZE_START)
  const [blocked, setBlocked] = useState(false)
  const [steps, setSteps] = useState(0)
  const [finished, setFinished] = useState(false)

  const step = useCallback(
    (direction: Direction) => {
      if (finished) {
        return
      }
      const next = move(position, direction)

      if (next.x === position.x && next.y === position.y) {
        setBlocked(true)
        return
      }

      setBlocked(false)
      setPosition(next)
      setSteps((count) => count + 1)

      if (isSolved(next)) {
        setFinished(true)
        onComplete(MINIGAMES.maze.reward)
      }
    },
    [finished, onComplete, position],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key.toLowerCase()]
      if (!direction) {
        return
      }
      event.preventDefault()
      step(direction)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [step])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid gap-1" aria-label="Maze">
        {Array.from({ length: MAZE_HEIGHT }, (_, y) =>
          Array.from({ length: MAZE_WIDTH }, (_, x) => {
            const cell = cellAt(x, y)
            const isPlayer = position.x === x && position.y === y

            return (
              <div
                key={`${x}-${y}`}
                className={`flex h-9 w-9 items-center justify-center border-2 ${
                  cell === 'wall'
                    ? 'border-cocoa bg-cocoa'
                    : cell === 'exit'
                      ? 'border-cocoa bg-mint'
                      : 'border-cocoa/40 bg-paper-deep'
                }`}
              >
                {isPlayer ? (
                  <SkinSprite skinId={skinId} state="play" className="h-7 w-7" />
                ) : null}
              </div>
            )
          }),
        )}
      </div>

      <div className="flex items-center justify-between border-2 border-cocoa/25 bg-paper-deep px-3 py-2 text-base">
        <span>Steps {steps}</span>
        <span className={blocked ? 'text-danger-ink' : 'text-cocoa-soft'}>
          {blocked ? 'The wall does not move' : 'Find the green exit'}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {PAD.map((entry) => (
          <Button
            key={entry.direction}
            onClick={() => step(entry.direction)}
            className="px-3"
          >
            {entry.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
