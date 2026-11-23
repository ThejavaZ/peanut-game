import { useCallback, useEffect, useRef, useState } from 'react'
import { SkinSprite } from '../../components/hamster/SkinSprite'
import { Button } from '../../components/ui/Button'
import {
  OUTSIDE_COLUMNS,
  OUTSIDE_HAPPINESS,
  OUTSIDE_PROGRESS_TO_WIN,
  OUTSIDE_REACTION_MS,
  OUTSIDE_RESCUE_PENALTY,
  OUTSIDE_ROWS,
  OUTSIDE_START_HAMSTER,
  OUTSIDE_START_PLAYER,
  OUTSIDE_WANDER_MS,
  deathCauseForOutsideHazard,
  moveOutsidePlayer,
  outsideDistance,
  outsideHazardZone,
  rollOutsideHazard,
  wanderHamster,
} from '../../game/outside'
import type {
  OutsideDirection,
  OutsideHazard,
  OutsidePosition,
} from '../../game/outside'
import type {
  AccessoryId,
  MinigameReward,
  SkinId,
} from '../../types/game'

interface OutsideGameProps {
  hamsterName: string
  skinId: SkinId
  accessoryId: AccessoryId
  onComplete: (reward: MinigameReward) => void
}

const KEY_TO_DIRECTION: Record<string, OutsideDirection> = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

const PAD: { direction: OutsideDirection; label: string }[] = [
  { direction: 'up', label: '↑' },
  { direction: 'left', label: '←' },
  { direction: 'down', label: '↓' },
  { direction: 'right', label: '→' },
]

const HAZARD_COPY: Record<OutsideHazard, string> = {
  snake: 'A snake lunges from the grass! Reach Peanut to save it!',
  truck: 'A truck races down the road! Reach Peanut to save it!',
}

function samePosition(first: OutsidePosition, second: OutsidePosition): boolean {
  return first.x === second.x && first.y === second.y
}

export function OutsideGame({
  hamsterName,
  skinId,
  accessoryId,
  onComplete,
}: OutsideGameProps) {
  const [player, setPlayer] = useState(OUTSIDE_START_PLAYER)
  const [hamster, setHamster] = useState(OUTSIDE_START_HAMSTER)
  const [progress, setProgress] = useState(0)
  const [hazard, setHazard] = useState<OutsideHazard | null>(null)
  const [rescues, setRescues] = useState(0)
  const [message, setMessage] = useState(
    `${hamsterName} is wandering. Stay close and follow!`,
  )

  const playerRef = useRef(player)
  const hamsterRef = useRef(hamster)
  const hazardRef = useRef(hazard)
  const progressRef = useRef(progress)
  const rescuesRef = useRef(rescues)
  const finishedRef = useRef(false)

  const finish = useCallback(
    (reward: MinigameReward) => {
      if (finishedRef.current) {
        return
      }
      finishedRef.current = true
      onComplete(reward)
    },
    [onComplete],
  )

  const finishWithReward = useCallback(
    (rescueCount: number) => {
      finish({
        effects: {
          happiness: Math.max(
            0,
            OUTSIDE_HAPPINESS - rescueCount * OUTSIDE_RESCUE_PENALTY,
          ),
        },
      })
    },
    [finish],
  )

  const rescue = useCallback(() => {
    hazardRef.current = null
    setHazard(null)
    setRescues((count) => {
      const next = count + 1
      rescuesRef.current = next
      return next
    })
    setMessage(`You reached ${hamsterName} just in time! Keep following.`)
  }, [hamsterName])

  const movePlayer = useCallback(
    (direction: OutsideDirection) => {
      if (finishedRef.current) {
        return
      }

      const next = moveOutsidePlayer(playerRef.current, direction)
      if (samePosition(next, playerRef.current)) {
        return
      }

      playerRef.current = next
      setPlayer(next)

      if (
        hazardRef.current &&
        outsideDistance(next, hamsterRef.current) <= 1
      ) {
        rescue()
      }
    },
    [rescue],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key.toLowerCase()]
      if (!direction) {
        return
      }
      event.preventDefault()
      movePlayer(direction)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [movePlayer])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (finishedRef.current || hazardRef.current) {
        return
      }

      const nextHamster = wanderHamster(hamsterRef.current, Math.random())
      hamsterRef.current = nextHamster
      setHamster(nextHamster)

      const separation = outsideDistance(playerRef.current, nextHamster)
      const nextHazard = rollOutsideHazard(
        nextHamster,
        separation,
        Math.random(),
      )

      if (nextHazard) {
        hazardRef.current = nextHazard
        setHazard(nextHazard)
        setMessage(HAZARD_COPY[nextHazard])
        return
      }

      const nextProgress = progressRef.current + 1
      progressRef.current = nextProgress
      setProgress(nextProgress)
      setMessage(
        separation > 3
          ? `${hamsterName} is getting far away. Go catch up!`
          : `${hamsterName} is exploring. Keep it in sight!`,
      )

      if (nextProgress >= OUTSIDE_PROGRESS_TO_WIN) {
        finishWithReward(rescuesRef.current)
      }
    }, OUTSIDE_WANDER_MS)

    return () => window.clearInterval(timer)
  }, [finishWithReward, hamsterName])

  useEffect(() => {
    if (!hazard) {
      return
    }

    const timer = window.setTimeout(() => {
      finish({
        effects: {},
        deathCauseId: deathCauseForOutsideHazard(hazard),
      })
    }, OUTSIDE_REACTION_MS)

    return () => window.clearTimeout(timer)
  }, [finish, hazard])

  const tryRescue = () => {
    if (!hazardRef.current) {
      return
    }

    if (outsideDistance(playerRef.current, hamsterRef.current) > 1) {
      setMessage(`Get closer to ${hamsterName} before the danger reaches it!`)
      return
    }

    rescue()
  }

  const distance = outsideDistance(player, hamster)
  const isDanger = Boolean(hazard)
  const playerPosition = {
    left: `${((player.x + 0.5) / OUTSIDE_COLUMNS) * 100}%`,
    top: `${((player.y + 0.5) / OUTSIDE_ROWS) * 100}%`,
  }
  const hamsterPosition = {
    left: `${((hamster.x + 0.5) / OUTSIDE_COLUMNS) * 100}%`,
    top: `${((hamster.y + 0.5) / OUTSIDE_ROWS) * 100}%`,
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`outside-board relative grid aspect-[8/5] grid-cols-8 grid-rows-5 overflow-hidden border-2 border-cocoa ${
          isDanger ? 'outside-board-danger' : ''
        }`}
        aria-label={`Outdoor map. You are moving around while ${hamsterName} wanders.`}
      >
        {Array.from({ length: OUTSIDE_ROWS }, (_, y) =>
          Array.from({ length: OUTSIDE_COLUMNS }, (_, x) => {
            const position = { x, y }
            const zone = outsideHazardZone(position)
            return (
              <div
                key={`${x}-${y}`}
                className={`outside-tile ${
                  zone === 'snake'
                    ? 'outside-tile-snake'
                    : zone === 'truck'
                      ? 'outside-tile-road'
                      : ''
                }`}
                aria-hidden="true"
              >
                {zone === 'snake' && x === OUTSIDE_COLUMNS - 1 && y === 0
                  ? '🐍'
                  : null}
                {zone === 'truck' && x === OUTSIDE_COLUMNS - 1 ? '🚧' : null}
              </div>
            )
          }),
        )}

        <span
          className="outside-token outside-player-token"
          style={playerPosition}
          role="img"
          aria-label="You"
        >
          🧍
        </span>
        <span
          className={`outside-token outside-hamster-token ${
            isDanger ? 'outside-hamster-threat' : ''
          }`}
          style={hamsterPosition}
          role="img"
          aria-label={hamsterName}
        >
          <SkinSprite
            skinId={skinId}
            accessoryId={accessoryId}
            state="play"
            className="h-8 w-8"
          />
        </span>
        {hazard ? (
          <span
            className={`outside-event outside-event-${hazard}`}
            role="img"
            aria-label={hazard === 'snake' ? 'Snake attack!' : 'Truck approaching!'}
          >
            {hazard === 'snake' ? '🐍' : '🚚'}
          </span>
        ) : null}
      </div>

      <div
        className="border-2 border-cocoa/30 bg-paper-deep px-3 py-2"
        role="status"
        aria-live="polite"
      >
        <p className="font-pixel text-[8px] uppercase tracking-widest">
          {hazard ? HAZARD_COPY[hazard] : message}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 text-base">
          <span>Distance: {distance} tiles</span>
          <span className={distance >= 4 ? 'text-danger-ink' : 'text-cocoa-soft'}>
            {distance >= 4 ? 'Too far!' : 'Close by'}
          </span>
        </div>
        <div
          className="mt-2 h-3 border-2 border-cocoa bg-paper"
          role="meter"
          aria-label="Distance from Peanut"
          aria-valuemin={0}
          aria-valuemax={OUTSIDE_COLUMNS + OUTSIDE_ROWS - 2}
          aria-valuenow={distance}
        >
          <div
            className={`h-full ${distance >= 4 ? 'bg-danger' : 'bg-mint'}`}
            style={{
              width: `${(distance / (OUTSIDE_COLUMNS + OUTSIDE_ROWS - 2)) * 100}%`,
            }}
          />
        </div>
        <p className="mt-2 text-base text-cocoa-soft">
          Explore together {progress}/{OUTSIDE_PROGRESS_TO_WIN} · Rescues:{' '}
          {rescues} · Reward up to +{OUTSIDE_HAPPINESS} happiness
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="grid grid-cols-3 gap-1"
          aria-label="Movement controls"
          role="group"
        >
          <span />
          <Button
            variant="secondary"
            onClick={() => movePlayer('up')}
            aria-label="Move up"
            className="px-3"
          >
            ↑
          </Button>
          <span />
          {PAD.slice(1).map((entry) => (
            <Button
              key={entry.direction}
              variant="secondary"
              onClick={() => movePlayer(entry.direction)}
              aria-label={`Move ${entry.direction}`}
              className="px-3"
            >
              {entry.label}
            </Button>
          ))}
          <span />
        </div>

        {hazard ? (
          <Button onClick={tryRescue} className="flex-1">
            Reach {hamsterName}!
          </Button>
        ) : null}
      </div>
      <p className="text-sm text-cocoa-soft">
        Move with WASD, arrow keys, or the buttons. The snake grass is in the
        upper-right; the road is along the bottom. Get within one tile to rescue
        Peanut from an attack.
      </p>
    </div>
  )
}
