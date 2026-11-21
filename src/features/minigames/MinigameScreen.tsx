import type { ReactNode } from 'react'
import type { MinigameDefinition } from '../../game/data/minigames'
import { describeReward } from '../../game/minigames'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'

interface MinigameScreenProps {
  game: MinigameDefinition
  onExit: () => void
  /** The playable body: it owns its attempts and reports when it is done. */
  children: ReactNode
}

/**
 * The shell every minigame runs inside: it shows what the reward is before the
 * player commits, and offers a Skip that is always visible and always applies
 * nothing. The clock is stopped while this is on screen.
 *
 * The body decides when a session ends — by spending every attempt, or by
 * finishing in one go — and reports the reward it earned through `onComplete`.
 */
export function MinigameScreen({
  game,
  onExit,
  children,
}: MinigameScreenProps) {
  return (
    <Screen>
      <div className="pixel-frame w-full max-w-lg bg-paper p-6">
        <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
          Minigame
        </p>

        <h1 className="mt-3 font-pixel text-lg leading-relaxed">{game.title}</h1>

        <p className="mt-4 text-lg text-cocoa-soft">{game.description}</p>

        <div className="mt-5 border-2 border-cocoa/30 bg-paper-deep px-3 py-3">
          <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
            Reward
          </p>
          <p className="mt-2 text-base">
            {game.rewardPreview ?? describeReward(game.reward)}
          </p>
          {game.maxAttempts ? (
            <p className="mt-1 text-base text-cocoa-soft">
              {game.maxAttempts} attempts per session
            </p>
          ) : null}
        </div>

        <div className="mt-5">{children}</div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onExit}>
            Skip — nothing happens
          </Button>
        </div>

        <p className="mt-4 text-base text-cocoa-soft">
          The clock is stopped until you leave.
        </p>
      </div>
    </Screen>
  )
}
