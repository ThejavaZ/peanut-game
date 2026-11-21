/**
 * Synthesised sound. No files: every effect is an oscillator shaped by an
 * envelope, which keeps the build free of audio assets and this service free of
 * the engine — nothing in `src/game/` imports it, and the rules stay silent.
 *
 * Web Audio requires a gesture, so `init()` waits for the first pointer or key
 * press before creating the context. The patch table below is pure data: the
 * tests check it without a browser.
 */

export type SoundId =
  | 'feed'
  | 'water'
  | 'clean'
  | 'play'
  | 'sleep'
  | 'event'
  | 'warning'
  | 'death'

export interface TonePatch {
  type: OscillatorType
  /** Start frequency in Hz. */
  from: number
  /** End frequency in Hz; a downward sweep reads as loss. */
  to: number
  /** Seconds. */
  duration: number
  /** Relative loudness, multiplied by the player's volume. */
  gain: number
}

export const SOUND_PATCHES: Record<SoundId, TonePatch> = {
  feed: { type: 'square', from: 220, to: 140, duration: 0.1, gain: 0.5 },
  water: { type: 'sine', from: 900, to: 620, duration: 0.16, gain: 0.35 },
  clean: { type: 'triangle', from: 500, to: 720, duration: 0.14, gain: 0.3 },
  play: { type: 'square', from: 330, to: 660, duration: 0.16, gain: 0.4 },
  sleep: { type: 'triangle', from: 300, to: 150, duration: 0.45, gain: 0.35 },
  event: { type: 'sine', from: 740, to: 988, duration: 0.22, gain: 0.45 },
  warning: { type: 'sawtooth', from: 170, to: 170, duration: 0.3, gain: 0.4 },
  death: { type: 'sine', from: 440, to: 110, duration: 0.9, gain: 0.5 },
}

/** The eight sounds the beta may play, in one list a test can walk. */
export const SOUND_IDS: readonly SoundId[] = [
  'feed',
  'water',
  'clean',
  'play',
  'sleep',
  'event',
  'warning',
  'death',
]

/**
 * Master gain for the player's preferences: mute wins over volume, volume is
 * clamped instead of trusted.
 */
export function gainFor(volume: number, muted: boolean): number {
  if (muted) {
    return 0
  }
  if (!Number.isFinite(volume)) {
    return 0
  }
  return Math.min(1, Math.max(0, volume))
}

let context: AudioContext | null = null
let master: GainNode | null = null
let volume = 0.7
let muted = false
let ambient: { stop: () => void } | null = null

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  if (!context) {
    const AudioContextCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AudioContextCtor) {
      return null
    }
    context = new AudioContextCtor()
    master = context.createGain()
    master.gain.value = gainFor(volume, muted)
    master.connect(context.destination)
  }

  if (context.state === 'suspended') {
    void context.resume()
  }
  return context
}

/** Two detuned low oscillators with a slow tremolo: barely there, but present. */
function startAmbient(): void {
  if (ambient || !context || !master) {
    return
  }

  const now = context.currentTime
  const pad = context.createGain()
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 620

  const low = context.createOscillator()
  low.type = 'sine'
  low.frequency.value = 110

  const high = context.createOscillator()
  high.type = 'sine'
  high.frequency.value = 164.81

  const tremolo = context.createOscillator()
  tremolo.type = 'sine'
  tremolo.frequency.value = 0.12

  const tremoloDepth = context.createGain()
  tremoloDepth.gain.value = 0.01

  pad.gain.value = 0.02
  tremolo.connect(tremoloDepth).connect(pad.gain)

  low.connect(filter)
  high.connect(filter)
  filter.connect(pad).connect(master)

  low.start(now)
  high.start(now)
  tremolo.start(now)

  ambient = {
    stop: () => {
      for (const oscillator of [low, high, tremolo]) {
        try {
          oscillator.stop()
          oscillator.disconnect()
        } catch {
          // Already stopped; nothing to do.
        }
      }
      pad.disconnect()
      filter.disconnect()
      tremoloDepth.disconnect()
    },
  }
}

function stopAmbient(): void {
  ambient?.stop()
  ambient = null
}

let initialized = false

/** Called once: registers the first-gesture unlock and the visibility rule. */
export function init(): void {
  if (typeof window === 'undefined' || initialized) {
    return
  }
  initialized = true

  const unlock = () => {
    const ctx = ensureContext()
    if (ctx && document.visibilityState === 'visible') {
      startAmbient()
    }
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }

  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopAmbient()
    } else if (context && !muted) {
      startAmbient()
    }
  })
}

/** Mirrors the settings screen: volume and mute, without touching the engine. */
export function applySettings(next: {
  volume: number
  muted: boolean
}): void {
  volume = next.volume
  muted = next.muted
  if (master) {
    master.gain.value = gainFor(volume, muted)
  }

  if (muted) {
    stopAmbient()
    return
  }
  if (context && document.visibilityState === 'visible') {
    startAmbient()
  }
}

export function play(id: SoundId): void {
  const patch = SOUND_PATCHES[id]
  const ctx = ensureContext()
  if (!ctx || !master || !patch || gainFor(volume, muted) === 0) {
    return
  }

  const now = ctx.currentTime
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = patch.type
  oscillator.frequency.setValueAtTime(patch.from, now)
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(patch.to, 1),
    now + patch.duration,
  )

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(patch.gain, 0.0001),
    now + 0.02,
  )
  gain.gain.exponentialRampToValueAtTime(0.0001, now + patch.duration)

  oscillator.connect(gain).connect(master)
  oscillator.start(now)
  oscillator.stop(now + patch.duration + 0.05)
}
