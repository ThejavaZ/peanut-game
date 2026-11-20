import type { DeathRecord, GameState, RunSummary } from '../types/game'

/**
 * The memorial reads the immutable `DeathRecord`, never the live state: once a
 * run ends, what is shown must not depend on anything that could change.
 */
export function buildRunSummary(
  run: GameState,
  death: DeathRecord,
): RunSummary {
  return {
    hamsterName: run.hamster.name,
    skinId: run.hamster.skinId,
    accessoryId: run.hamster.accessoryId,
    daysSurvived: Math.max(1, death.day),
    meals: death.stats.meals,
    playSessions: death.stats.playSessions,
    causeOfDeath: death.detail,
    epitaph: death.epitaph,
  }
}
