import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  SEEDS_GRID_COLS,
  SEEDS_SECONDS,
  SEEDS_TOTAL,
} from '../../game/config'
import { SEEDS_CELLS, hungerFor, isSeed, seedCells } from '../../game/seeds'
import type { MinigameReward } from '../../types/game'

interface SeedsGameProps {
  onComplete: (reward: MinigameReward) => void
}

/**
 * Spot the object under a time limit.
 *
 * Every cell is a real button, so pointer and keyboard reach the same board:
 * Tab to a cell, Enter to uncover it. The board is drawn from the pure
 * `seedCells()`, and the reward is computed by `hungerFor()` — the screen never
 * decides how much a seed is worth.
 */
export function SeedsGame({ onComplete }: SeedsGameProps) {
  const hidden = useMemo(() => seedCells(), [])
  const [revealed, setRevealed] = useState<number[]>([])
  const [found, setFound] = useState<number[]>([])
  const [seconds, setSeconds] = useState(SEEDS_SECONDS)

  const revealedRef = useRef<number[]>([])
  const foundRef = useRef<number[]>([])
  const finishedRef = useRef(false)

  const finish = useCallback(
    (foundCells: number[]) => {
      if (finishedRef.current) {
        return
      }
      finishedRef.current = true
      onComplete({ effects: { hunger: hungerFor(foundCells.length) } })
    },
    [onComplete],
  )

  useEffect(() => {
    if (seconds <= 0) {
      finish(foundRef.current)
      return
    }
    const id = window.setTimeout(() => {
      setSeconds((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearTimeout(id)
  }, [finish, seconds])

  const uncover = useCallback((cell: number) => {
    if (finishedRef.current || revealedRef.current.includes(cell)) {
      return
    }

    revealedRef.current = [...revealedRef.current, cell]
    setRevealed(revealedRef.current)

    if (!isSeed(hidden, cell)) {
      return
    }

    foundRef.current = [...foundRef.current, cell]
    setFound(foundRef.current)

    if (foundRef.current.length >= SEEDS_TOTAL) {
      finish(foundRef.current)
    }
  }, [finish, hidden])

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${SEEDS_GRID_COLS}, minmax(0,1fr))` }}
      >
        {Array.from({ length: SEEDS_CELLS }, (_, cell) => {
          const isRevealed = revealed.includes(cell)
          const hasSeed = isSeed(hidden, cell)

          return (
            <button
              key={cell}
              type="button"
              onClick={() => uncover(cell)}
              disabled={isRevealed}
              aria-label={`Cell ${cell + 1}${isRevealed ? (hasSeed ? ': seed' : ': empty') : ''}`}
              className={`flex h-14 w-14 items-center justify-center border-2 border-cocoa transition-colors ${
                isRevealed
                  ? hasSeed
                    ? 'bg-shell'
                    : 'bg-sand'
                  : 'bg-paper-deep hover:bg-sand'
              } disabled:opacity-100`}
            >
              {isRevealed && hasSeed ? (
                <span className="h-3 w-3 border-2 border-cocoa bg-shell-dark" />
              ) : null}
            </button>
          )
        })}
      </div>

      <div className="flex w-full items-center justify-between border-2 border-cocoa/25 bg-paper-deep px-3 py-2 text-base">
        <span>
          Seeds {found.length}/{SEEDS_TOTAL}
        </span>
        <span className={seconds <= 5 ? 'text-danger' : 'text-cocoa-soft'}>
          {seconds}s
        </span>
      </div>

      <p className="text-base text-cocoa-soft">
        Every cell is a button: point and click, or Tab and Enter.
      </p>
    </div>
  )
}
