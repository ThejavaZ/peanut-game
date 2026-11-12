import { HamsterRoom } from '../../components/room/HamsterRoom'
import { Button } from '../../components/ui/Button'
import { NeedBar } from '../../components/ui/NeedBar'
import { Screen } from '../../components/ui/Screen'
import { CARE_ACTION_LIST } from '../../game/data/careActions'
import {
  formatGameClock,
  getCriticalWarning,
  getHamsterMood,
} from '../../game/rules'
import type { CareAction, GameState, HamsterMood } from '../../types/game'

const MOOD_BADGES: Record<HamsterMood, { label: string; className: string }> = {
  happy: { label: 'Happy', className: 'bg-mint' },
  ok: { label: 'Doing okay', className: 'bg-sky' },
  worried: { label: 'Worried', className: 'bg-shell' },
  critical: { label: 'Critical', className: 'bg-danger text-paper' },
}

const NEED_LABELS = {
  hunger: 'Hunger',
  thirst: 'Thirst',
  hygiene: 'Hygiene',
  happiness: 'Happiness',
  health: 'Health',
} as const

interface GameScreenProps {
  run: GameState
  onCare: (action: CareAction) => void
  onTogglePause: () => void
  onBackToMenu: () => void
  onEndRun: () => void
}

export function GameScreen({
  run,
  onCare,
  onTogglePause,
  onBackToMenu,
  onEndRun,
}: GameScreenProps) {
  const { day, time } = formatGameClock(run.elapsedSeconds)
  const mood = getHamsterMood(run.hamster.needs)
  const moodBadge = MOOD_BADGES[mood]
  const warning = getCriticalWarning(run.hamster.needs)

  return (
    <Screen>
      <div className="w-full max-w-3xl">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
              Day {day} · {time}
            </p>
            <h1 className="mt-2 font-pixel text-xl sm:text-2xl">
              {run.hamster.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`border-2 border-cocoa px-2 py-1 font-pixel text-[8px] uppercase ${moodBadge.className}`}
            >
              {moodBadge.label}
            </span>
            <Button
              variant="secondary"
              onClick={onTogglePause}
              className="px-3 py-2 text-[8px]"
            >
              {run.paused ? 'Resume' : 'Pause'}
            </Button>
          </div>
        </header>

        {warning ? (
          <p
            role="alert"
            className="mb-3 border-2 border-danger bg-danger/10 px-3 py-2 text-lg text-danger"
          >
            <strong className="font-pixel text-[9px] uppercase">
              {run.hamster.name}
            </strong>{' '}
            {warning}
          </p>
        ) : null}

        <div className="pixel-frame relative bg-paper p-3 sm:p-4">
          <HamsterRoom hamsterName={run.hamster.name} paused={run.paused} />
          {run.paused ? (
            <div className="absolute inset-3 flex items-center justify-center bg-paper/85 sm:inset-4">
              <span className="pixel-frame-sm bg-paper px-4 py-3 font-pixel text-sm uppercase tracking-widest">
                Paused
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1.1fr_1fr]">
          <section className="pixel-frame-sm bg-paper p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-pixel text-[10px] uppercase">Needs</h2>
              <span className="text-sm text-cocoa-soft">
                Meals {run.stats.meals} · Play {run.stats.playSessions}
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {(Object.keys(NEED_LABELS) as (keyof typeof NEED_LABELS)[]).map(
                (need) => (
                  <NeedBar
                    key={need}
                    label={NEED_LABELS[need]}
                    value={run.hamster.needs[need]}
                  />
                ),
              )}
            </div>
          </section>

          <section className="pixel-frame-sm bg-paper p-4">
            <h2 className="font-pixel text-[10px] uppercase">Care actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {CARE_ACTION_LIST.map((action) => {
                const cooldown = run.cooldowns[action.id]
                return (
                  <Button
                    key={action.id}
                    variant="secondary"
                    disabled={cooldown > 0 || run.paused}
                    onClick={() => onCare(action.id)}
                    title={action.hint}
                    className={`px-2 text-[8px] ${action.id === 'sleep' ? 'col-span-2' : ''}`}
                  >
                    {cooldown > 0
                      ? `${action.label} · ${Math.ceil(cooldown)}s`
                      : action.label}
                  </Button>
                )
              })}
            </div>
            <p className="mt-4 text-base text-cocoa-soft">
              Warnings appear before anything serious happens.
            </p>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBackToMenu}>
            ← Main menu
          </Button>
          <Button variant="ghost" onClick={onEndRun} className="text-danger">
            Skip to memorial (dev)
          </Button>
        </div>
      </div>
    </Screen>
  )
}
