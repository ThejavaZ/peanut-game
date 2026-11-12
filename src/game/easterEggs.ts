import type { EasterEggId } from '../types/game'
import { normalizeAdoptionName } from './skins'

export interface EasterEggDefinition {
  id: EasterEggId
  triggerNames: readonly string[]
  label: string
}

/**
 * Name-based jokes. None of them change needs, health, cooldowns or death
 * rules: they are cosmetic surprises, not penalties.
 */
export const EASTER_EGGS: readonly EasterEggDefinition[] = [
  { id: '404', triggerNames: ['404'], label: 'Not found' },
  { id: 'null', triggerNames: ['null', 'nil', 'none'], label: 'No name' },
  {
    id: 'segfault',
    triggerNames: ['segmentationfault', 'segfault', 'segmentation fault'],
    label: 'Core dumped',
  },
  { id: 'sudo', triggerNames: ['sudo'], label: 'Root access' },
  { id: 'root', triggerNames: ['root'], label: 'Superuser' },
  {
    id: 'localhost',
    triggerNames: ['localhost', '127.0.0.1'],
    label: 'Local host',
  },
]

export function findEasterEgg(name: string): EasterEggDefinition | null {
  const normalized = normalizeAdoptionName(name)
  if (!normalized) {
    return null
  }
  return (
    EASTER_EGGS.find((egg) => egg.triggerNames.includes(normalized)) ?? null
  )
}

/** `Null` is shown as "No name" everywhere, but the save keeps the real input. */
export function getDisplayName(name: string): string {
  return findEasterEgg(name)?.id === 'null' ? 'No name' : name.trim()
}
