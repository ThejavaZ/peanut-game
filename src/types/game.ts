export type NeedKey = 'hunger' | 'thirst' | 'hygiene' | 'happiness' | 'health'
export type CoreNeedKey = Exclude<NeedKey, 'health'>
export type Needs = Record<NeedKey, number>

export type CareAction = 'feed' | 'water' | 'clean' | 'play' | 'sleep'

export type NeedStatus = 'ok' | 'warning' | 'critical'
export type HamsterMood = 'happy' | 'ok' | 'worried' | 'critical'

export interface Hamster {
  name: string
  adoptedAt: number
  ageDays: number
  needs: Needs
  isAlive: boolean
}

export interface RunStats {
  meals: number
  drinks: number
  cleanings: number
  playSessions: number
  naps: number
}

export interface GameState {
  schemaVersion: number
  hamster: Hamster
  stats: RunStats
  cooldowns: Record<CareAction, number>
  elapsedSeconds: number
  lastUpdatedAt: number
  paused: boolean
}

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
  | { name: 'game' }
  | { name: 'memorial'; run: RunSummary }
