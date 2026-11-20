import type { GameEvent } from '../../types/game'

/**
 * Three events to prove the model. Content targets (≥ 8) belong to issue #4,
 * which also flips `EVENTS_ENABLED` on — until then these never fire in a
 * normal game, they only exist so the scheduler can be tested.
 *
 * Design rule from the roadmap: an event may hurt, but the player always sees
 * the consequence before choosing, and no option is a free refill.
 */
export const EVENTS: readonly GameEvent[] = [
  {
    id: 'empty-bowl',
    title: 'The bowl is empty',
    description:
      'Peanut pushes the bowl around the cage. It makes a sound like a coin dropping into nothing.',
    weight: 40,
    cooldownSeconds: 60,
    oncePerRun: false,
    conditions: [{ type: 'needAtMost', need: 'hunger', value: 35 }],
    choices: [
      {
        id: 'fill',
        label: 'Fill the bowl now',
        hint: 'Hunger +25 · hygiene −5 (seed husks everywhere)',
        effects: { hunger: 25, hygiene: -5 },
      },
      {
        id: 'later',
        label: 'You will do it later',
        hint: 'Hunger −12 · happiness −8',
        effects: { hunger: -12, happiness: -8 },
      },
    ],
  },
  {
    id: 'cage-escape',
    title: 'Peanut is out of the cage',
    description:
      'The door was not latched. Peanut is under the sofa and has opinions about it.',
    weight: 30,
    cooldownSeconds: 180,
    oncePerRun: true,
    conditions: [{ type: 'dayAtLeast', day: 2 }],
    choices: [
      {
        id: 'chase',
        label: 'Chase it around the room',
        hint: 'Happiness +12 · hygiene −12 · hunger −6',
        effects: { happiness: 12, hygiene: -12, hunger: -6 },
      },
      {
        id: 'trail',
        label: 'Leave a trail of seeds',
        hint: 'Happiness +14 · hunger −8 · thirst −6',
        effects: { happiness: 14, hunger: -8, thirst: -6 },
      },
    ],
  },
  {
    id: 'night-wheel',
    title: 'Peanut runs all night',
    description:
      'The wheel has been going since midnight. You can hear it through the floor.',
    weight: 25,
    cooldownSeconds: 240,
    oncePerRun: false,
    conditions: [{ type: 'dayAtLeast', day: 3 }],
    choices: [
      {
        id: 'let-run',
        label: 'Let it run',
        hint: 'Happiness +15 · hunger −8 · thirst −8',
        effects: { happiness: 15, hunger: -8, thirst: -8 },
      },
      {
        id: 'stop',
        label: 'Stop the wheel',
        hint: 'Happiness −10 · health +4',
        effects: { happiness: -10, health: 4 },
      },
    ],
  },
]
