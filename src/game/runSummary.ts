import type { GameState, RunSummary } from '../types/game'

/**
 * M1 placeholder: the real cause of death and epitaph generator arrive with
 * the death system in M2. Stats are already real.
 */
export function buildRunSummary(run: GameState): RunSummary {
  return {
    hamsterName: run.hamster.name,
    daysSurvived: Math.max(1, run.hamster.ageDays + 1),
    meals: run.stats.meals,
    playSessions: run.stats.playSessions,
    causeOfDeath: 'Unknown — the death system arrives in M2.',
    epitaph: 'He lived, he ran, he ate. Mostly ate.',
  }
}
