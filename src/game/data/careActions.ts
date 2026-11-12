import type { CareAction, Needs, RunStats } from '../../types/game'

export interface CareActionDefinition {
  id: CareAction
  label: string
  hint: string
  cooldownSeconds: number
  effects: Partial<Needs>
  stat: keyof RunStats
}

export const CARE_ACTIONS: Record<CareAction, CareActionDefinition> = {
  feed: {
    id: 'feed',
    label: 'Feed',
    hint: 'A handful of seeds. Fills the bowl and the hamster.',
    cooldownSeconds: 8,
    effects: { hunger: 42, happiness: 4, hygiene: -3 },
    stat: 'meals',
  },
  water: {
    id: 'water',
    label: 'Water',
    hint: 'Fresh water. The bottle empties faster than you think.',
    cooldownSeconds: 8,
    effects: { thirst: 48, health: 1 },
    stat: 'drinks',
  },
  clean: {
    id: 'clean',
    label: 'Clean',
    hint: 'New bedding. Nobody likes a dirty cage.',
    cooldownSeconds: 20,
    effects: { hygiene: 55, happiness: 3 },
    stat: 'cleanings',
  },
  play: {
    id: 'play',
    label: 'Play',
    hint: 'A little run. Fun, but it burns energy.',
    cooldownSeconds: 12,
    effects: { happiness: 32, hunger: -8, thirst: -10, hygiene: -4 },
    stat: 'playSessions',
  },
  sleep: {
    id: 'sleep',
    label: 'Nap',
    hint: 'A short nap. Restores health if the hamster is otherwise okay.',
    cooldownSeconds: 45,
    effects: { health: 12, happiness: 5, hunger: -6, thirst: -6 },
    stat: 'naps',
  },
}

export const CARE_ACTION_LIST: readonly CareActionDefinition[] = [
  CARE_ACTIONS.feed,
  CARE_ACTIONS.water,
  CARE_ACTIONS.clean,
  CARE_ACTIONS.play,
  CARE_ACTIONS.sleep,
]
