import type { GameEvent } from '../../types/game'

/**
 * The eight events that can interrupt a run.
 *
 * Design rule from the roadmap: an event may hurt, but the player always sees
 * the consequence before choosing, and no option is a free refill.
 *
 * Mix: four negligence, three absurd, one inevitable.
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
  {
    id: 'water-bottle-jam',
    title: 'The water bottle is stuck',
    description:
      'The spout has seized up. Peanut licks it anyway, which is somehow sadder than doing nothing.',
    weight: 35,
    cooldownSeconds: 90,
    oncePerRun: false,
    conditions: [{ type: 'needAtMost', need: 'thirst', value: 40 }],
    choices: [
      {
        id: 'unjam',
        label: 'Twist it free now',
        hint: 'Thirst +22 · hygiene −4 (it sprays everywhere)',
        effects: { thirst: 22, hygiene: -4 },
      },
      {
        id: 'wait',
        label: 'It will fix itself',
        hint: 'Thirst −10 · happiness −5',
        effects: { thirst: -10, happiness: -5 },
      },
    ],
  },
  {
    id: 'no-play',
    title: 'Nobody has played today',
    description:
      'Peanut sits at the bars and watches you watch the screen. It has been doing that for a while.',
    weight: 30,
    cooldownSeconds: 120,
    oncePerRun: false,
    conditions: [{ type: 'needAtMost', need: 'happiness', value: 30 }],
    choices: [
      {
        id: 'floor',
        label: 'Sit on the floor with it',
        hint: 'Happiness +18 · hunger −6',
        effects: { happiness: 18, hunger: -6 },
      },
      {
        id: 'tomorrow',
        label: 'Play tomorrow',
        hint: 'Happiness −10 · health −3',
        effects: { happiness: -10, health: -3 },
      },
    ],
  },
  {
    id: 'deep-clean',
    title: 'The cage needs a real clean',
    description:
      'The bedding has opinions now. Open the cage and the room learns about them too.',
    weight: 30,
    cooldownSeconds: 100,
    oncePerRun: false,
    conditions: [{ type: 'needAtMost', need: 'hygiene', value: 30 }],
    choices: [
      {
        id: 'strip',
        label: 'Strip the bedding',
        hint: 'Hygiene +30 · happiness −4 (all of it, at once)',
        effects: { hygiene: 30, happiness: -4 },
      },
      {
        id: 'cover',
        label: 'Just add fresh paper',
        hint: 'Hygiene +12 · happiness +3',
        effects: { hygiene: 12, happiness: 3 },
      },
    ],
  },
  {
    id: 'walls',
    title: 'There is something in the walls',
    description:
      'A scratching sound, twice, then nothing. Peanut stares at the same corner you do.',
    weight: 25,
    cooldownSeconds: 150,
    oncePerRun: true,
    conditions: [{ type: 'dayAtLeast', day: 4 }],
    choices: [
      {
        id: 'listen',
        label: 'Listen at the wall',
        hint: 'Happiness +10 · thirst −6',
        effects: { happiness: 10, thirst: -6 },
      },
      {
        id: 'move',
        label: 'Move the cage away',
        hint: 'Happiness −4 · hygiene −9',
        effects: { happiness: -4, hygiene: -9 },
      },
    ],
  },
  {
    id: 'sniffle',
    title: 'Peanut has a sniffle',
    description:
      'One small sneeze. Then another. Nothing in this house has ever been fine on its own.',
    weight: 20,
    cooldownSeconds: 0,
    oncePerRun: true,
    conditions: [{ type: 'dayAtLeast', day: 5 }],
    choices: [
      {
        id: 'vet',
        label: 'Take it to the vet',
        hint: 'Health +12 · hunger −8 · happiness −4',
        effects: { health: 12, hunger: -8, happiness: -4 },
      },
      {
        id: 'wait',
        label: 'Wait and see',
        hint: 'Health −7 · happiness −6',
        effects: { health: -7, happiness: -6 },
      },
    ],
  },
  {
    id: 'wheel-frenzy',
    title: 'The wheel is going too fast',
    description:
      'Peanut has been running for a while and shows no sign of stopping. The axle is making a noise it did not have yesterday.',
    weight: 25,
    cooldownSeconds: 150,
    oncePerRun: false,
    conditions: [{ type: 'statAtLeast', stat: 'playSessions', value: 5 }],
    choices: [
      {
        id: 'faster',
        label: 'Push it faster',
        hint: 'Happiness +15 · health −35 (it is really enjoying this)',
        effects: { happiness: 15, health: -35 },
      },
      {
        id: 'dismantle',
        label: 'Take the wheel off',
        hint: 'Happiness −8 · hygiene −4',
        effects: { happiness: -8, hygiene: -4 },
      },
    ],
  },
]
