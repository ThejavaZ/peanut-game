export type NeedKey = 'hunger' | 'thirst' | 'hygiene' | 'happiness' | 'health'
export type CoreNeedKey = Exclude<NeedKey, 'health'>
export type Needs = Record<NeedKey, number>

export type CareAction = 'feed' | 'water' | 'clean' | 'play' | 'sleep'

export type NeedStatus = 'ok' | 'warning' | 'critical'
export type HamsterMood = 'happy' | 'ok' | 'worried' | 'critical'

/**
 * Every skin is cosmetic: it never changes needs, health or death rules.
 * Secret skins are unlocked by adopting a hamster with a specific name.
 */
export type SkinId =
  | 'hamster'
  | 'chick'
  | 'chick-pink'
  | 'chick-blue'
  | 'chick-green'
  | 'chicken-costume'
  | 'bunny'
  | 'duckling'
  | 'fancy-rat'
  | 'capybara'
  | 'gopher'
  | 'ferris'
  | 'elephpant'
  | 'duke'
  | 'camel'
  | 'kodee'
  | 'python'
  | 'ruby'
  | 'swift'
  | 'javascript'
  | 'root'

export type AccessoryId = 'none' | 'crown'

export type EasterEggId =
  | '404'
  | 'null'
  | 'segfault'
  | 'sudo'
  | 'root'
  | 'localhost'

export interface Hamster {
  name: string
  skinId: SkinId
  accessoryId: AccessoryId
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
  /** Events answered while no need was left critical. */
  eventsResolved: number
  minigamesCompleted: number
  /** Seconds spent with at least one of the five bars at or below 20. */
  criticalSeconds: number
  /** Seconds spent with two or more bars at or below 20. */
  doubleCriticalSeconds: number
}

export type DeathCauseId =
  | 'starvation'
  | 'dehydration'
  | 'filth'
  | 'despair'
  | 'systemic'
  | 'wheel-accident'
  | 'old-age'

/**
 * Written once, when the run ends, and never rewritten afterwards. Every field
 * is readonly and the object is frozen: the record is evidence, not state.
 */
export interface DeathRecord {
  readonly causeId: DeathCauseId
  readonly cause: string
  readonly detail: string
  readonly epitaph: string
  /** `hamster.ageDays` at the moment of death. */
  readonly ageDays: number
  /** Displayed day number, same formula as the HUD clock. */
  readonly day: number
  readonly elapsedSeconds: number
  readonly diedAt: number
  readonly stats: Readonly<RunStats>
}

/**
 * Gates an event on the current state. Everything is data, so conditions can
 * be validated, documented and tested without executing game code.
 */
export type EventCondition =
  | { type: 'needAtMost'; need: CoreNeedKey; value: number }
  | { type: 'needAtLeast'; need: CoreNeedKey; value: number }
  | { type: 'dayAtLeast'; day: number }
  | { type: 'dayAtMost'; day: number }
  /** Gates on a run stat, e.g. how often Peanut has been played with. */
  | { type: 'statAtLeast'; stat: keyof RunStats; value: number }

/** One option inside an event. Every option costs or gives something. */
export interface EventChoice {
  readonly id: string
  readonly label: string
  /** The consequence shown to the player before choosing. */
  readonly hint: string
  readonly effects: Partial<Needs>
}

export interface GameEvent {
  readonly id: string
  readonly title: string
  readonly description: string
  /** Relative likelihood against the other eligible events. */
  readonly weight: number
  /** Seconds before this same event may fire again. */
  readonly cooldownSeconds: number
  /** Never fires more than once in a single run. */
  readonly oncePerRun: boolean
  readonly conditions: readonly EventCondition[]
  /** One or two options; never zero, never three. */
  readonly choices: readonly EventChoice[]
}

/**
 * Everything the scheduler needs to remember between ticks. Persisted with the
 * run so closing the tab does not revive an event that already happened.
 */
export interface EventSchedulerState {
  /** `elapsedSeconds` of the last event of any kind. */
  readonly lastEventAt: number
  /** `elapsedSeconds` when each event id last fired. */
  readonly lastFiredAt: Readonly<Record<string, number>>
  /** Event ids that already fired during this run. */
  readonly fired: readonly string[]
  /** The event waiting for a decision, or `null`. At most one at a time. */
  readonly pending: GameEvent | null
}

export interface GameState {
  schemaVersion: number
  hamster: Hamster
  stats: RunStats
  cooldowns: Record<CareAction, number>
  elapsedSeconds: number
  lastUpdatedAt: number
  paused: boolean
  /** `null` while Peanut is alive. */
  death: DeathRecord | null
  events: EventSchedulerState
  /** `elapsedSeconds` when the last minigame finished; starts the gap. */
  lastMinigameAt: number
}

export interface RunSummary {
  hamsterName: string
  skinId: SkinId
  accessoryId: AccessoryId
  daysSurvived: number
  meals: number
  playSessions: number
  causeOfDeath: string
  epitaph: string
  score: number
}

/**
 * One grave. Written once when a run ends, never updated afterwards — the same
 * rule as `DeathRecord`, because a history you can rewrite is not a history.
 */
export interface CemeteryEntry {
  readonly name: string
  readonly skinId: SkinId
  readonly accessoryId: AccessoryId
  readonly daysSurvived: number
  readonly causeOfDeath: string
  readonly epitaph: string
  readonly diedAt: number
  readonly score: number
}

export type MinigameId = 'nap-time' | 'wheel' | 'maze' | 'seeds'

/**
 * The contract every minigame reports back. Applied exactly once when the game
 * finishes; leaving early applies nothing at all.
 *
 * Order is fixed: the effects land first, then `advanceSeconds` of real game
 * time passes through the normal clock (decay, ageing, and anything else the
 * clock can trigger).
 */
export interface MinigameReward {
  readonly effects: Partial<Needs>
  readonly advanceSeconds?: number
  readonly clearsCooldowns?: boolean
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
  | { name: 'cemetery' }
  | { name: 'settings' }
  | { name: 'credits' }
  | { name: 'minigame'; id: MinigameId }
