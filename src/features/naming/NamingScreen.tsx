import { useState, type FormEvent } from 'react'
import { HamsterSprite } from '../../components/hamster/HamsterSprite'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'

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

interface NamingScreenProps {
  onAdopt: (hamsterName: string) => void
  onBack: () => void
  replacingName?: string
}

export function NamingScreen({
  onAdopt,
  onBack,
  replacingName,
}: NamingScreenProps) {
  const [name, setName] = useState('')
  const trimmedName = name.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (trimmedName.length > 0) {
      onAdopt(trimmedName)
    }
  }

  const suggestName = () => {
    const current = SUGGESTED_NAMES.filter((suggestion) => suggestion !== trimmedName)
    setName(current[Math.floor(Math.random() * current.length)])
  }

  return (
    <Screen>
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <HamsterSprite className="h-24 w-24 animate-hamster-idle" />
        </div>

        <form onSubmit={handleSubmit} className="pixel-frame bg-paper p-6">
          <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
            Adoption papers
          </p>
          <h2 className="mt-3 font-pixel text-lg leading-relaxed">Name your hamster</h2>
          <p className="mt-3 text-lg text-cocoa-soft">
            Any name works. It won&apos;t change what happens next.
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
            maxLength={16}
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
            <span>{trimmedName.length}/16</span>
          </div>

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
