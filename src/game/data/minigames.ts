import { NAP_TIME_HEALTH, NAP_TIME_SECONDS } from '../config'
import type { MinigameId, MinigameReward } from '../../types/game'

export interface MinigameDefinition {
  id: MinigameId
  title: string
  description: string
  /** Label of the button that starts it. */
  actionLabel: string
  reward: MinigameReward
}

/**
 * The minigames that exist today. `Nap Time` is the shell's first consumer;
 * #11, #12 and #13 add the wheel, the seeds and the maze to the same record
 * and the same contract.
 *
 * Every reward is bounded on purpose: minigames are a help, never a
 * replacement for the five bars.
 */
export const MINIGAMES: Record<MinigameId, MinigameDefinition> = {
  'nap-time': {
    id: 'nap-time',
    title: 'Nap Time',
    description:
      'Peanut curls up and sleeps. Half a day passes while it does, and the world does not wait.',
    actionLabel: 'Take a nap',
    reward: {
      effects: { health: NAP_TIME_HEALTH },
      advanceSeconds: NAP_TIME_SECONDS,
    },
  },
}

export const MINIGAME_LIST: readonly MinigameDefinition[] =
  Object.values(MINIGAMES)
