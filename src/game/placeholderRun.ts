import type { RunSummary } from '../types/game'

/**
 * Placeholder run used by the M0 shell to preview the memorial screen.
 * The real run data comes from the game engine in M1/M2.
 */
export function buildPlaceholderRun(hamsterName: string): RunSummary {
  return {
    hamsterName,
    daysSurvived: 1,
    meals: 0,
    playSessions: 0,
    causeOfDeath: 'Unknown — the death system arrives in M2.',
    epitaph: 'He lived, he ran, he ate. Mostly ate.',
  }
}
