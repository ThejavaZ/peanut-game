import type { DeathCauseId } from '../../types/game'

export interface DeathCauseDefinition {
  id: DeathCauseId
  label: string
  /** Shown in the memorial under "Cause of death". */
  detail: string
  epitaphs: readonly string[]
}

/**
 * The six ways a run can end before events arrive. Negligence needs a visible
 * warning first — every cause of that kind can only fire once a need is already
 * critical. `old-age` has its own warning one full day earlier.
 */
export const DEATH_CAUSES: Record<DeathCauseId, DeathCauseDefinition> = {
  starvation: {
    id: 'starvation',
    label: 'Starvation',
    detail: 'Peanut starved with the food bowl a few pixels away.',
    epitaphs: [
      'The bowl was right there.',
      'One handful of seeds would have done it.',
    ],
  },
  dehydration: {
    id: 'dehydration',
    label: 'Dehydration',
    detail: 'Peanut dehydrated before anyone refilled the bottle.',
    epitaphs: [
      'The bottle was closer than the menu.',
      'Dry as the water bottle looked.',
    ],
  },
  filth: {
    id: 'filth',
    label: 'Squalor',
    detail: 'The cage was never cleaned, and it eventually mattered.',
    epitaphs: [
      'A clean cage was one click away.',
      'Nobody noticed but Peanut.',
    ],
  },
  despair: {
    id: 'despair',
    label: 'Despair',
    detail: 'Peanut gave up on a cage nobody played with.',
    epitaphs: [
      'The wheel spun without him.',
      'Nobody came to play. Ever.',
    ],
  },
  systemic: {
    id: 'systemic',
    label: 'Systemic failure',
    detail: 'Everything was wrong at once, and nothing was fixed in time.',
    epitaphs: [
      'Four bars, all at zero.',
      'A little help, at any time.',
    ],
  },
  'old-age': {
    id: 'old-age',
    label: 'Old age',
    detail: 'Peanut lived to a ripe old age, which for a hamster is a win.',
    epitaphs: [
      'He outran the inevitable. Eventually.',
      'A full life. Short by any measure.',
    ],
  },
}

export const DEATH_CAUSE_LIST: readonly DeathCauseDefinition[] = Object.values(
  DEATH_CAUSES,
)

/** Deterministic pick: same run, same epitaph. No clock, no Math.random. */
export function pickEpitaph(record: {
  epitaphs: readonly string[]
  seed: number
}): string {
  const { epitaphs, seed } = record
  if (epitaphs.length === 0) {
    return ''
  }
  const index = Math.abs(Math.trunc(seed)) % epitaphs.length
  return epitaphs[index]
}
