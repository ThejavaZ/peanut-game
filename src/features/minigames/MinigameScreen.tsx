import type { MinigameDefinition } from '../../game/data/minigames'
import { describeReward } from '../../game/minigames'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'

interface MinigameScreenProps {
  game: MinigameDefinition
  onPlay: () => void
  onExit: () => void
}

/**
 * The shell every minigame runs inside: it shows what the reward is before the
 * player commits, and offers a Skip that is always visible and always applies
 * nothing. The clock is stopped while this is on screen.
 */
export function MinigameScreen({
  game,
  onPlay,
  onExit,
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
          <p className="mt-2 text-base">{describeReward(game.reward)}</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onExit}>
            Skip — nothing happens
          </Button>
          <Button onClick={onPlay}>{game.actionLabel}</Button>
        </div>

        <p className="mt-4 text-base text-cocoa-soft">
          The clock is stopped until you leave.
        </p>
      </div>
    </Screen>
  )
}
