import type { MinigameDefinition } from '../../game/data/minigames'
import type { MinigameReward, SkinId } from '../../types/game'
import { SkinSprite } from '../../components/hamster/SkinSprite'
import { Button } from '../../components/ui/Button'

interface NapTimeProps {
  game: MinigameDefinition
  skinId: SkinId
  onComplete: (reward: MinigameReward) => void
}

/**
 * The one screen where sleeping is not implied but shown: the pose comes from
 * the state sprites, and the player's own skin is respected — a crab naps too.
 */
export function NapTime({ game, skinId, onComplete }: NapTimeProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <SkinSprite skinId={skinId} state="sleep" className="h-24 w-24" />
        <span
          aria-hidden="true"
          className="absolute -top-1 right-0 font-pixel text-[8px] text-cocoa-soft"
        >
          z z z
        </span>
      </div>

      <Button onClick={() => onComplete(game.reward)}>{game.actionLabel}</Button>
    </div>
  )
}
