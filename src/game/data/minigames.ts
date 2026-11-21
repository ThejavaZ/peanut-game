import {
  MAZE_HAPPINESS,
  NAP_TIME_HEALTH,
  NAP_TIME_SECONDS,
  SEEDS_HUNGER_CAP,
  SEEDS_SECONDS,
  WHEEL_ATTEMPTS,
  WHEEL_HAPPINESS_CAP,
} from '../config'
import type { MinigameId, MinigameReward } from '../../types/game'

export interface MinigameDefinition {
  id: MinigameId
  title: string
  description: string
  /** Label of the button that starts it. */
  actionLabel: string
  reward: MinigameReward
  /** Swings or tries granted per session; absent means a single, one-shot play. */
  maxAttempts?: number
  /** Overrides the generated preview when the reward depends on play. */
  rewardPreview?: string
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
  wheel: {
    id: 'wheel',
    title: 'Hamster Wheel',
    description:
      'Peanut is already running. Stop the marker inside the golden arc — three swings, and the happiness you earn is capped.',
    actionLabel: 'Start running',
    maxAttempts: WHEEL_ATTEMPTS,
    rewardPreview: `Up to +${WHEEL_HAPPINESS_CAP} happiness`,
    reward: { effects: { happiness: WHEEL_HAPPINESS_CAP } },
  },
  maze: {
    id: 'maze',
    title: 'Tiny Maze',
    description:
      'Five by five, one way out, and the walls are real — they do not let you through. Reach the exit and every care cooldown clears.',
    actionLabel: 'Enter the maze',
    reward: {
      effects: { happiness: MAZE_HAPPINESS },
      clearsCooldowns: true,
    },
    rewardPreview: `+${MAZE_HAPPINESS} happiness · clears every care cooldown`,
  },
  seeds: {
    id: 'seeds',
    title: 'Find the Seeds',
    description:
      'Five seeds hide among twelve cells. Uncover them before the twenty seconds run out — every seed you find feeds Peanut.',
    actionLabel: 'Look for seeds',
    rewardPreview: `Up to +${SEEDS_HUNGER_CAP} hunger · ${SEEDS_SECONDS} seconds`,
    reward: { effects: { hunger: SEEDS_HUNGER_CAP } },
  },
}

export const MINIGAME_LIST: readonly MinigameDefinition[] =
  Object.values(MINIGAMES)
