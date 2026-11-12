import { useState, type FormEvent } from 'react'
import { SkinSprite } from '../../components/hamster/SkinSprite'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'
import { findEasterEgg } from '../../game/easterEggs'
import {
  DEFAULT_SKIN_ID,
  findSecretSkin,
  SKIN_LIST,
  SKINS,
} from '../../game/skins'
import type { AccessoryId, EasterEggId, SkinId } from '../../types/game'

const SUGGESTED_NAMES = [
  'Peanut',
  'Mochi',
  'Waffle',
  'Biscuit',
  'Noodle',
  'Tofu',
  'Chestnut',
  'Nugget',
]

const EGG_HINTS: Record<EasterEggId, string> = {
  '404': 'This name has not been found. The hamster will show up anyway.',
  null: 'This hamster will be called “No name”. The paperwork is fine.',
  segfault: 'This name may cause unexpected behaviour. Nothing fatal.',
  sudo: 'This name grants root access. And a very small crown.',
  root: 'This name already has a skin. Of course it does.',
  localhost: 'This name comes with a tiny server rack. Local only.',
}

interface NamingScreenProps {
  onAdopt: (hamsterName: string, skinId: SkinId) => void
  onBack: () => void
  unlockedSkins: readonly SkinId[]
  initialSkinId?: SkinId
  replacingName?: string
}

export function NamingScreen({
  onAdopt,
  onBack,
  unlockedSkins,
  initialSkinId = DEFAULT_SKIN_ID,
  replacingName,
}: NamingScreenProps) {
  const [name, setName] = useState('')
  const [selectedSkinId, setSelectedSkinId] =
    useState<SkinId>(initialSkinId)
  const trimmedName = name.trim()

  const secretSkin = findSecretSkin(trimmedName)
  const egg = findEasterEgg(trimmedName)
  const effectiveSkinId = secretSkin?.id ?? selectedSkinId
  const accessoryId: AccessoryId = egg?.id === 'sudo' ? 'crown' : 'none'
  const skin = SKINS[effectiveSkinId]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (trimmedName.length > 0) {
      onAdopt(trimmedName, effectiveSkinId)
    }
  }

  const suggestName = () => {
    const current = SUGGESTED_NAMES.filter(
      (suggestion) => suggestion !== trimmedName,
    )
    setName(current[Math.floor(Math.random() * current.length)])
  }

  return (
    <Screen>
      <div className="w-full max-w-lg">
        <div className="mb-4 flex flex-col items-center">
          <SkinSprite
            skinId={effectiveSkinId}
            accessoryId={accessoryId}
            className="h-24 w-24 animate-hamster-idle"
          />
          <p className="mt-2 font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
            {skin.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="pixel-frame bg-paper p-6">
          <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
            Adoption papers
          </p>
          <h2 className="mt-3 font-pixel text-lg leading-relaxed">
            Name your hamster
          </h2>
          <p className="mt-3 text-lg text-cocoa-soft">
            Any name works. Probably.
          </p>
          {replacingName ? (
            <p className="mt-3 border-2 border-danger/60 bg-danger/10 px-2 py-1 text-base text-danger">
              This replaces {replacingName}. There is no way back.
            </p>
          ) : null}

          <label htmlFor="hamster-name" className="sr-only">
            Hamster name
          </label>
          <input
            id="hamster-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
            autoFocus
            autoComplete="off"
            placeholder="Peanut"
            className="mt-5 w-full border-4 border-cocoa bg-paper-deep px-3 py-3 font-pixel text-sm text-cocoa placeholder:text-cocoa/30"
          />

          <div className="mt-2 flex items-center justify-between text-base text-cocoa-soft">
            <button
              type="button"
              onClick={suggestName}
              className="underline decoration-dashed underline-offset-4 hover:text-cocoa"
            >
              Surprise me
            </button>
            <span>{trimmedName.length}/24</span>
          </div>

          {secretSkin ? (
            <div className="mt-4 border-2 border-shell-dark bg-shell/20 px-3 py-2">
              <p className="font-pixel text-[8px] uppercase tracking-widest text-shell-dark">
                Secret detected
              </p>
              <p className="mt-1 text-base">
                This is not a hamster name. The adoption papers tremble.
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
                Choose a look
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {unlockedSkins.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedSkinId(id)}
                    aria-pressed={effectiveSkinId === id}
                    className={`flex flex-col items-center gap-1 border-2 px-1 py-2 transition-colors ${
                      effectiveSkinId === id
                        ? 'border-cocoa bg-sand'
                        : 'border-cocoa/30 bg-paper hover:border-cocoa/60'
                    }`}
                  >
                    <SkinSprite skinId={id} className="h-9 w-9" />
                    <span className="font-pixel text-[7px] uppercase leading-tight">
                      {SKINS[id].name}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-cocoa-soft">
                {unlockedSkins.length}/{SKIN_LIST.length} looks discovered. Some
                names unlock secret friends.
              </p>
            </div>
          )}

          {egg ? (
            <p className="mt-3 border-2 border-cocoa/25 bg-paper-deep px-2 py-1 text-base text-cocoa-soft">
              {EGG_HINTS[egg.id]}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={onBack}>
              ← Back
            </Button>
            <Button type="submit" disabled={trimmedName.length === 0}>
              Adopt
            </Button>
          </div>
        </form>
      </div>
    </Screen>
  )
}
