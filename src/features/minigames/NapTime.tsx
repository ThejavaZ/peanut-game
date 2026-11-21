import type { MinigameDefinition } from '../../game/data/minigames'
import type { MinigameReward } from '../../types/game'
import { Button } from '../../components/ui/Button'

interface NapTimeProps {
  game: MinigameDefinition
  onComplete: (reward: MinigameReward) => void
}

/**
 * The simplest consumer of the shell: one press, one reward, no attempts —
 * which is exactly why Nap Time never needed them.
 */
export function NapTime({ game, onComplete }: NapTimeProps) {
  return (
    <div className="flex justify-center">
      <Button onClick={() => onComplete(game.reward)}>{game.actionLabel}</Button>
    </div>
  )
}
