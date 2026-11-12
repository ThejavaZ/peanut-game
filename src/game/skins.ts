import type { SkinId } from '../types/game'

export interface SkinDefinition {
  id: SkinId
  name: string
  description: string
  category: 'classic' | 'cosmetic' | 'secret'
  /** Names that unlock this skin. Compared after normalizing case, accents and spaces. */
  triggers?: readonly string[]
}

export const DEFAULT_SKIN_ID: SkinId = 'hamster'

export const SKINS: Record<SkinId, SkinDefinition> = {
  hamster: {
    id: 'hamster',
    name: 'Hamster',
    description: 'The classic Peanut. Small, round, allegedly a hamster.',
    category: 'classic',
  },
  chick: {
    id: 'chick',
    name: 'Chick',
    description: 'A yellow chick. Nobody in the game notices.',
    category: 'cosmetic',
    triggers: ['chick', 'pollito', 'pollito amarillo', 'yellow chick'],
  },
  'chick-pink': {
    id: 'chick-pink',
    name: 'Pink Chick',
    description: 'A pink chick. Extremely healthy for a hamster.',
    category: 'cosmetic',
    triggers: ['pink chick', 'pollito rosa', 'pink', 'rosa'],
  },
  'chick-blue': {
    id: 'chick-blue',
    name: 'Blue Chick',
    description: 'A blue chick. The cage is still a cage.',
    category: 'cosmetic',
    triggers: ['blue chick', 'pollito azul', 'blue', 'azul'],
  },
  'chick-green': {
    id: 'chick-green',
    name: 'Mint Chick',
    description: 'A mint chick. Refreshing and slightly illegal.',
    category: 'cosmetic',
    triggers: ['mint chick', 'pollito verde', 'green', 'verde'],
  },
  'chicken-costume': {
    id: 'chicken-costume',
    name: 'Chicken Costume',
    description: 'It is either a chicken or a hamster in a very good disguise.',
    category: 'cosmetic',
    triggers: ['chicken', 'gallina', 'chicken costume', 'disfraz'],
  },
  bunny: {
    id: 'bunny',
    name: 'Bunny',
    description: 'Long ears, same cage. The paperwork says hamster.',
    category: 'cosmetic',
    triggers: ['bunny', 'rabbit', 'conejo', 'coneja'],
  },
  duckling: {
    id: 'duckling',
    name: 'Duckling',
    description: 'A duckling. It has opinions about the water bottle.',
    category: 'cosmetic',
    triggers: ['duck', 'duckling', 'pato', 'patito'],
  },
  'fancy-rat': {
    id: 'fancy-rat',
    name: 'Fancy Rat',
    description: 'A fancy rat. Fancier than most hamsters.',
    category: 'cosmetic',
    triggers: ['rat', 'fancy rat', 'rata', 'raton'],
  },
  capybara: {
    id: 'capybara',
    name: 'Capybara',
    description: 'A miniature capybara. It is already tired of everything.',
    category: 'cosmetic',
    triggers: ['capybara', 'capibara', 'capi'],
  },
  gopher: {
    id: 'gopher',
    name: 'Little Gopher',
    description: 'A tiny creature that loves concurrency. Not a hamster.',
    category: 'secret',
    triggers: ['gopher', 'go'],
  },
  ferris: {
    id: 'ferris',
    name: 'Ferris',
    description: 'A very safe little crab. Too many legs for a hamster.',
    category: 'secret',
    triggers: ['ferris', 'rust', 'rustacean'],
  },
  elephpant: {
    id: 'elephpant',
    name: 'elePHPant',
    description: 'Your hamster is growing quite a lot. Probably normal.',
    category: 'secret',
    triggers: ['elephpant', 'php'],
  },
  duke: {
    id: 'duke',
    name: 'Duke',
    description: 'A white blob with a red nose. Java approves.',
    category: 'secret',
    triggers: ['duke', 'java'],
  },
  camel: {
    id: 'camel',
    name: 'Camel',
    description: 'A camel. There is more than one way to do it.',
    category: 'secret',
    triggers: ['camel', 'perl'],
  },
  kodee: {
    id: 'kodee',
    name: 'Kodee',
    description: 'A small purple robot with cat ears. Kotlin says hi.',
    category: 'secret',
    triggers: ['kodee', 'kotlin'],
  },
  python: {
    id: 'python',
    name: 'Python',
    description: 'A blue and yellow snake. It only eats once per run.',
    category: 'secret',
    triggers: ['python'],
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    description: 'A shiny red gem. It is very polite about being a hamster.',
    category: 'secret',
    triggers: ['ruby'],
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    description: 'A small bird. Fast, but not fast enough to leave the cage.',
    category: 'secret',
    triggers: ['swift'],
  },
  javascript: {
    id: 'javascript',
    name: 'Scripty',
    description: 'A yellow creature of undefined behaviour.',
    category: 'secret',
    triggers: ['javascript', 'js', 'scripty'],
  },
  root: {
    id: 'root',
    name: 'Root',
    description: 'It has full access to the cage. And to your heart.',
    category: 'secret',
    triggers: ['root'],
  },
}

export const SKIN_LIST: readonly SkinDefinition[] = Object.values(SKINS)

/** Case, accents and extra spaces should not stop a secret from working. */
export function normalizeAdoptionName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

export function findSecretSkin(name: string): SkinDefinition | null {
  const normalized = normalizeAdoptionName(name)
  if (!normalized) {
    return null
  }
  return SKIN_LIST.find((skin) => skin.triggers?.includes(normalized)) ?? null
}

export function isSkinId(value: string): value is SkinId {
  return Object.hasOwn(SKINS, value)
}
