import { describe, expect, test } from 'bun:test'
import { SKIN_SPRITES } from '../src/components/hamster/skinSprites'
import { SAVE_SCHEMA_VERSION } from '../src/game/config'
import { findEasterEgg, getDisplayName } from '../src/game/easterEggs'
import { createRun } from '../src/game/rules'
import {
  DEFAULT_SKIN_ID,
  findSecretSkin,
  isSkinId,
  normalizeAdoptionName,
  SKIN_LIST,
  SKINS,
} from '../src/game/skins'
import { isGameState, migrateSave } from '../src/services/SaveService'

const NOW = 1_700_000_000_000

describe('skin registry', () => {
  test('every skin has a valid 16x16 sprite', () => {
    for (const skin of SKIN_LIST) {
      const sprite = SKIN_SPRITES[skin.id]
      expect(sprite).toBeDefined()
      expect(sprite.rows).toHaveLength(16)
      for (const row of sprite.rows) {
        expect(row).toHaveLength(16)
        for (const char of row) {
          if (char !== '.') {
            expect(sprite.palette[char]).toBeDefined()
          }
        }
      }
    }
  })

  test('secret triggers are unique and normalized', () => {
    const triggers = SKIN_LIST.flatMap((skin) => skin.triggers ?? [])
    expect(new Set(triggers).size).toBe(triggers.length)
    for (const trigger of triggers) {
      expect(trigger).toBe(normalizeAdoptionName(trigger))
    }
  })

  test('matches secret names ignoring case, accents and spaces', () => {
    expect(findSecretSkin('  FERRIS ')).toMatchObject({ id: 'ferris' })
    expect(findSecretSkin('elePHPant')).toMatchObject({ id: 'elephpant' })
    expect(findSecretSkin('pollito rosa')).toMatchObject({ id: 'chick-pink' })
    expect(findSecretSkin('  Go  ')).toMatchObject({ id: 'gopher' })
    expect(findSecretSkin('Mochi')).toBeNull()
  })

  test('classic hamster is always a valid skin', () => {
    expect(DEFAULT_SKIN_ID).toBe('hamster')
    expect(isSkinId('hamster')).toBe(true)
    expect(isSkinId('dragon')).toBe(false)
  })

  test('createRun stores the chosen skin and accessory', () => {
    const run = createRun('Ferris', NOW, 'ferris', 'crown')

    expect(run.hamster.skinId).toBe('ferris')
    expect(run.hamster.accessoryId).toBe('crown')
    expect(SKINS[run.hamster.skinId].name).toBe('Ferris')
  })
})

describe('name easter eggs', () => {
  test('detects the non-programming jokes', () => {
    expect(findEasterEgg('404')).toMatchObject({ id: '404' })
    expect(findEasterEgg('Null')).toMatchObject({ id: 'null' })
    expect(findEasterEgg('sudo')).toMatchObject({ id: 'sudo' })
    expect(findEasterEgg('127.0.0.1')).toMatchObject({ id: 'localhost' })
  })

  test('Null is displayed as No name without losing the input', () => {
    expect(getDisplayName('Null')).toBe('No name')
    expect(getDisplayName('Mochi')).toBe('Mochi')
  })
})

describe('save migration', () => {
  test('upgrades a v1 save with the classic skin', () => {
    const current = createRun('Mochi', NOW)
    const v1 = {
      ...current,
      schemaVersion: 1,
      hamster: {
        name: current.hamster.name,
        adoptedAt: current.hamster.adoptedAt,
        ageDays: current.hamster.ageDays,
        needs: current.hamster.needs,
        isAlive: current.hamster.isAlive,
      },
    }

    const migrated = migrateSave(v1)

    expect(isGameState(migrated)).toBe(true)
    expect((migrated as typeof current).schemaVersion).toBe(
      SAVE_SCHEMA_VERSION,
    )
    expect((migrated as typeof current).hamster.skinId).toBe('hamster')
    expect((migrated as typeof current).hamster.accessoryId).toBe('none')
  })

  test('rejects unknown skins', () => {
    const run = createRun('Mochi', NOW)
    const corrupted = {
      ...run,
      hamster: { ...run.hamster, skinId: 'dragon' },
    }

    expect(isGameState(corrupted)).toBe(false)
  })
})
