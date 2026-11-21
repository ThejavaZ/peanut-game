import { SCORE_PERIOD_SECONDS, SCORE_POINTS } from './config'
import type { GameState } from '../types/game'

function periods(seconds: number): number {
  return Math.floor(seconds / SCORE_PERIOD_SECONDS)
}

/**
 * Score from Act 1 §10.
 *
 * Pure by contract: it reads the state, returns a number and changes nothing —
 * and it never influences survival, which the Act 1 states explicitly. The
 * score summarises a life, it does not judge it.
 *
 * Days count **completed** days only ("cada día completo en que la mascota
 * permanece viva"), so a life that ends on day 1 earns no day points.
 *
 * Penalty reading: every period with a critical bar costs 10, and a period
 * with two or more critical bars costs 20 *more* — hence both counters, since
 * the seconds with two critical bars are also seconds with one.
 */
export function computeScore(state: GameState): number {
  const { hamster, stats } = state

  const gained =
    hamster.ageDays * SCORE_POINTS.perDay +
    stats.meals * SCORE_POINTS.perMeal +
    stats.drinks * SCORE_POINTS.perDrink +
    stats.playSessions * SCORE_POINTS.perPlaySession +
    stats.cleanings * SCORE_POINTS.perCleaning +
    stats.minigamesCompleted * SCORE_POINTS.perPlaySession +
    stats.eventsResolved * SCORE_POINTS.perEventResolved

  const penalty =
    periods(stats.criticalSeconds) * SCORE_POINTS.penaltyPerCriticalPeriod +
    periods(stats.doubleCriticalSeconds) *
      SCORE_POINTS.penaltyPerDoubleCriticalPeriod

  return Math.max(0, gained - penalty)
}
