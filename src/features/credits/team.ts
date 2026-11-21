/**
 * The team, exactly as the Act 1 assigned the work (§17). Kept as data — not
 * markup — so a test can guarantee that nobody is missing from the credits.
 */
export interface Member {
  readonly fullName: string
  /** The responsibility promised in Act 1 §17. */
  readonly role: string
}

export const TEAM: readonly Member[] = [
  {
    fullName: 'Javier Armando Sarmiento Gil',
    role: 'Integration and main development',
  },
  { fullName: 'Brayan López Orcí', role: 'Gameplay and testing' },
  { fullName: 'Laura Jacqueline Dávila Villa', role: 'Visual design and experience' },
  { fullName: 'Ramón Viera Salas', role: 'Documentation and content' },
]

export const PROJECT = {
  name: 'Peanut',
  tagline: 'A hamster’s little life.',
  course: 'Creación de Videojuegos · IDGS10-2',
  school: 'Universidad Tecnológica de Hermosillo',
  repository: 'https://github.com/ThejavaZ/peanut-game',
} as const

/** `Javier Armando Sarmiento Gil` → `JS` — a placeholder until photos exist. */
export function initials(fullName: string): string {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length === 0) {
    return ''
  }
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : ''
  return `${first}${last}`.toUpperCase()
}
