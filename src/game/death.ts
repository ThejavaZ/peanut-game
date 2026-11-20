import {
  CORE_NEEDS,
  HEALTH_RULES,
  MAX_AGE_DAYS,
  SECONDS_PER_DAY,
  WHEEL_DEATH_SESSIONS,
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
 * Order matters: a neglected hamster dies of neglect even on its last day,
 * an accident is only accepted when neglect is impossible, and `old age` fires
 * only while Peanut is otherwise healthy — so a player can never die of age
 * while the health bar is already empty.
 *
 * Every cause here had a warning first: neglect needs a critical need, an
 * accident has to pass through the health warning at 20 on the way down, and
 * old age is announced one full day earlier by `getAgeWarning`.
 */
export function evaluateDeath(state: GameState): DeathRecord | null {
  if (state.death) {
    return state.death
  }

  const { needs, ageDays } = state.hamster
  const { stats } = state

  if (needs.health <= 0) {
    // Neglect cannot empty the bar while every need stays comfortable: the
    // penalties only exist below 20, and above 55 health recovers. If the bar
    // is empty anyway and the wheel has been in play, this was not neglect.
    const comfortable = CORE_NEEDS.every(
      (need) => needs[need] >= HEALTH_RULES.recoveryThreshold,
    )
    if (comfortable && stats.playSessions >= WHEEL_DEATH_SESSIONS) {
      return buildDeathRecord(state, 'wheel-accident')
    }

    return buildDeathRecord(state, pickNeglectCause(needs))
  }

  if (ageDays >= MAX_AGE_DAYS) {
    return buildDeathRecord(state, 'old-age')
  }

  return null
}
