import { HamsterSprite } from '../../components/hamster/HamsterSprite'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'
import type { RunSummary } from '../../types/game'

interface MemorialScreenProps {
  run: RunSummary
  onAdoptAnother: () => void
  onMainMenu: () => void
}

export function MemorialScreen({ run, onAdoptAnother, onMainMenu }: MemorialScreenProps) {
  return (
    <Screen>
      <article className="pixel-frame w-full max-w-xl bg-paper p-6 text-center sm:p-8">
        <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
          In memory of
        </p>
        <h1 className="mt-4 font-pixel text-2xl leading-relaxed">{run.hamsterName}</h1>

        <div className="my-6 flex justify-center">
          <HamsterSprite className="h-24 w-24 opacity-60 grayscale" />
        </div>

        <p className="text-xl italic text-cocoa-soft">&ldquo;{run.epitaph}&rdquo;</p>

        <dl className="mt-6 grid grid-cols-3 gap-2">
          <div className="border-2 border-cocoa/25 px-2 py-3">
            <dt className="font-pixel text-[7px] uppercase text-cocoa-soft">Days</dt>
            <dd className="mt-1 text-2xl">{run.daysSurvived}</dd>
          </div>
          <div className="border-2 border-cocoa/25 px-2 py-3">
            <dt className="font-pixel text-[7px] uppercase text-cocoa-soft">Meals</dt>
            <dd className="mt-1 text-2xl">{run.meals}</dd>
          </div>
          <div className="border-2 border-cocoa/25 px-2 py-3">
            <dt className="font-pixel text-[7px] uppercase text-cocoa-soft">Play</dt>
            <dd className="mt-1 text-2xl">{run.playSessions}</dd>
          </div>
        </dl>

        <div className="mt-6 border-t-2 border-cocoa/20 pt-4">
          <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
            Cause of death
          </p>
          <p className="mt-2 text-lg">{run.causeOfDeath}</p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onAdoptAnother}>Adopt another</Button>
          <Button variant="secondary" onClick={onMainMenu}>
            Main menu
          </Button>
        </div>

        <p className="mt-5 text-base text-cocoa-soft">
          Placeholder memorial — the death system arrives in M2.
        </p>
      </article>
    </Screen>
  )
}
