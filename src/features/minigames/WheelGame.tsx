import { useCallback, useEffect, useRef, useState } from 'react'
import {
  WHEEL_ATTEMPTS,
  WHEEL_SPEED_DEG_PER_SECOND,
} from '../../game/config'
import {
  happinessFor,
  scoreSwing,
  targetForSwing,
} from '../../game/wheel'
import type { SwingResult } from '../../game/wheel'
import type { MinigameReward } from '../../types/game'
import { Button } from '../../components/ui/Button'

interface WheelGameProps {
  onComplete: (reward: MinigameReward) => void
}

const RESULT_LABEL: Record<SwingResult, string> = {
  perfect: 'Perfect!',
  good: 'Good',
  miss: 'Missed',
}

const RESULT_CLASS: Record<SwingResult, string> = {
  perfect: 'text-cocoa',
  good: 'text-cocoa',
  miss: 'text-cocoa-soft',
}

/**
 * Timing minigame: stop the marker inside the arc, three times.
 *
 * The angle lives in a ref and is written straight to the DOM by
 * requestAnimationFrame, so the wheel runs at 60 fps without re-rendering
 * React, while every scoring decision stays in the pure functions of
 * `game/wheel.ts` — which is what makes it testable without a browser.
 */
export function WheelGame({ onComplete }: WheelGameProps) {
  const [results, setResults] = useState<SwingResult[]>([])
  const angleRef = useRef(0)
  const resultsRef = useRef<SwingResult[]>([])
  const markerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame = 0
    let last = performance.now()

    const step = (now: number) => {
      const delta = (now - last) / 1000
      last = now
      angleRef.current =
        (angleRef.current + delta * WHEEL_SPEED_DEG_PER_SECOND) % 360
      if (markerRef.current) {
        markerRef.current.style.transform = `rotate(${angleRef.current}deg)`
      }
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [])

  const stop = useCallback(() => {
    const index = resultsRef.current.length
    if (index >= WHEEL_ATTEMPTS) {
      return
    }

    const result = scoreSwing(angleRef.current, targetForSwing(index))
    resultsRef.current = [...resultsRef.current, result]
    setResults(resultsRef.current)

    if (resultsRef.current.length >= WHEEL_ATTEMPTS) {
      onComplete({ effects: { happiness: happinessFor(resultsRef.current) } })
    }
  }, [onComplete])

  const target = targetForSwing(results.length)
  const lastResult = results[results.length - 1]

  return (
    <div>
      <div className="flex flex-col items-center gap-4">
        <div className="pixel-grid relative h-44 w-44 rounded-full border-4 border-cocoa bg-paper-deep">
          {/* The target arc: moves every swing. */}
          <div
            className="absolute inset-0"
            style={{ transform: `rotate(${target}deg)` }}
          >
            <div className="absolute left-1/2 top-0 h-5 w-2 -translate-x-1/2 border-2 border-cocoa bg-mint" />
          </div>

          {/* The marker: rotated imperatively by the animation loop. */}
          <div ref={markerRef} className="absolute inset-0">
            <div className="absolute left-1/2 top-1 h-5 w-2 -translate-x-1/2 border-2 border-cocoa bg-danger" />
          </div>

          <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cocoa bg-shell" />
        </div>

        <p
          className={`font-pixel text-[9px] uppercase tracking-widest ${
            lastResult ? RESULT_CLASS[lastResult] : 'text-cocoa-soft'
          }`}
        >
          {lastResult ? RESULT_LABEL[lastResult] : 'Stop inside the green arc'}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between border-2 border-cocoa/25 bg-paper-deep px-3 py-2 text-base">
        <span>
          Swings {results.length}/{WHEEL_ATTEMPTS}
        </span>
        <span>Happiness +{happinessFor(results)}</span>
      </div>

      <div className="mt-4">
        <Button onClick={stop} autoFocus className="w-full">
          Stop the wheel
        </Button>
      </div>
    </div>
  )
}
