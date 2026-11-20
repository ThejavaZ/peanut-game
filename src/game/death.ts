import {
  CORE_NEEDS,
  MAX_AGE_DAYS,
  SECONDS_PER_DAY,
} from './config'
import { DEATH_CAUSES, pickEpitaph } from './data/deathCauses'
import type {
  CoreNeedKey,
  DeathCauseId,
  DeathRecord,
  GameState,
  Needs,
} from '../types/game'

const NEED_CAUSE: Record<CoreNeedKey, DeathCauseId> = {
  hunger: 'starvation',
  thirst: 'dehydration',
  hygiene: 'filth',
  happiness: 'despair',
}

/**
 * Which core need is responsible. A single clearly lowest need gets the blame;
 * when several are equally bad there is no culprit, so it is systemic.
 */
export function pickNeglectCause(needs: Needs): DeathCauseId {
  const values = CORE_NEEDS.map((key) => ({ key, value: needs[key] }))
  const min = Math.min(...values.map((entry) => entry.value))
  const lowest = values.filter((entry) => entry.value === min)
  if (lowest.length === 1) {
    return NEED_CAUSE[lowest[0].key]
  }
  return 'systemic'
}

export function buildDeathRecord(
  state: GameState,
  causeId: DeathCauseId,
): DeathRecord {
  const cause = DEATH_CAUSES[causeId]
  const { ageDays, name } = state.hamster
  return Object.freeze({
    causeId,
    cause: cause.label,
    detail: cause.detail,
    epitaph: pickEpitaph({ epitaphs: cause.epitaphs, seed: name.length + ageDays }),
    ageDays,
    day: Math.floor(state.elapsedSeconds / SECONDS_PER_DAY) + 1,
    elapsedSeconds: state.elapsedSeconds,
    /** The run's own clock, not the wall clock: builds stay reproducible. */
    diedAt: state.lastUpdatedAt,
    stats: Object.freeze({ ...state.stats }),
  })
}

/**
 * The single place a run can end.
 *
 * Order matters: a neglected hamster dies of neglect even on its last day, and
 * `old age` only fires while Peanut is otherwise healthy — so a player can
 * never die of age while the health bar is already empty.
 *
 * Every cause here had a warning first: neglect needs a critical need, and old
 * age is announced one full day earlier by `getAgeWarning`.
 */
export function evaluateDeath(state: GameState): DeathRecord | null {
  if (state.death) {
    return state.death
  }

  const { needs, ageDays } = state.hamster

  if (needs.health <= 0) {
    return buildDeathRecord(state, pickNeglectCause(needs))
  }

  if (ageDays >= MAX_AGE_DAYS) {
    return buildDeathRecord(state, 'old-age')
  }

  return null
}
