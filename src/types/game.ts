export interface RunSummary {
  hamsterName: string
  daysSurvived: number
  meals: number
  playSessions: number
  causeOfDeath: string
  epitaph: string
}

/**
 * Screens are a plain state machine instead of routes: the game lives on a
 * single URL, which keeps GitHub Pages deploys simple.
 */
export type Screen =
  | { name: 'menu' }
  | { name: 'naming' }
  | { name: 'game'; hamsterName: string }
  | { name: 'memorial'; run: RunSummary }
