import type {
  CareAction,
  GameState,
  MinigameReward,
  NeedKey,
} from '../types/game'
import { MINIGAME_GAP_SECONDS } from './config'
import { CARE_ACTIONS } from './data/careActions'
import { advanceRun, applyEffects } from './rules'

const NEED_LABELS: Record<NeedKey, string> = {
  hunger: 'Hunger',
  thirst: 'Thirst',
  hygiene: 'Hygiene',
  happiness: 'Happiness',
  health: 'Health',
}

/** Derived, so a future care action is covered without touching this file. */
function clearedCooldowns(): Record<CareAction, number> {
  return Object.fromEntries(
    (Object.keys(CARE_ACTIONS) as CareAction[]).map((action) => [action, 0]),
  ) as Record<CareAction, number>
}

/**
 * Preview shown before starting a minigame. Always derived from the reward
 * itself, so what the shell promises and what the reward does cannot drift
 * apart.
 */
export function describeReward(reward: MinigameReward): string {
  const parts: string[] = []

  for (const [key, amount] of Object.entries(reward.effects) as [
    NeedKey,
    number,
  ][]) {
    const sign = amount >= 0 ? '+' : '−'
    parts.push(`${NEED_LABELS[key]} ${sign}${Math.abs(amount)}`)
  }
  if (reward.advanceSeconds) {
    parts.push(`advances ${reward.advanceSeconds}s of game time`)
  }
  if (reward.clearsCooldowns) {
    parts.push('clears every care cooldown')
  }

  return parts.join(' · ') || 'nothing changes'
}

/**
 * Applies a finished minigame exactly once.
 *
 * Effects land first, cooldowns are cleared second, and time passes last
 * through the one and only clock — so an advance also decays, ages, and may
 * trigger whatever the clock can trigger. A dead run is never touched.
 */
export function applyMinigameReward(
  state: GameState,
  reward: MinigameReward,
): GameState {
  if (state.death) {
    return state
  }

  let next: GameState = {
    ...state,
    hamster: {
      ...state.hamster,
      needs: applyEffects(state.hamster.needs, reward.effects),
    },
    stats: {
      ...state.stats,
      minigamesCompleted: state.stats.minigamesCompleted + 1,
    },
  }

  if (reward.clearsCooldowns) {
    next = { ...next, cooldowns: clearedCooldowns() }
  }

  if (reward.advanceSeconds && reward.advanceSeconds > 0) {
    next = advanceRun(next, reward.advanceSeconds)
  }

  // The gap starts when the minigame finishes, including any time it advanced.
  return { ...next, lastMinigameAt: next.elapsedSeconds }
}

/**
 * Seconds until the next minigame may start; 0 means ready. Same shape as the
 * care-action cooldowns, so the HUD renders it the same way.
 */
export function minigameGap(state: GameState): number {
  return Math.max(
    0,
    MINIGAME_GAP_SECONDS - (state.elapsedSeconds - state.lastMinigameAt),
  )
}
