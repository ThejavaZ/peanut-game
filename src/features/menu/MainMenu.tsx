import { HamsterSprite } from '../../components/hamster/HamsterSprite'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'

interface MainMenuProps {
  onStart: () => void
}

export function MainMenu({ onStart }: MainMenuProps) {
  return (
    <Screen>
      <div className="w-full max-w-2xl text-center">
        <span className="inline-block border-2 border-cocoa bg-mint px-3 py-1 font-pixel text-[8px] uppercase tracking-widest">
          Indie · Pet sim · Dark comedy
        </span>

        <div className="mt-8 flex justify-center">
          <HamsterSprite className="h-36 w-36 animate-hamster-idle sm:h-40 sm:w-40" />
        </div>

        <h1 className="mt-6 font-pixel text-4xl text-cocoa sm:text-6xl">PEANUT</h1>
        <p className="mt-4 font-pixel text-[10px] uppercase tracking-[0.2em] text-cocoa-soft">
          A hamster&apos;s little life
        </p>

        <div className="pixel-frame mx-auto mt-10 max-w-sm bg-paper p-5">
          <Button onClick={onStart} className="w-full">
            Adopt a hamster
          </Button>
          <Button variant="secondary" disabled className="mt-3 w-full">
            Cemetery · soon
          </Button>
          <p className="mt-5 text-lg text-cocoa-soft">
            Every little life has an ending. Make it count.
          </p>
        </div>

        <p className="mt-8 font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
          v0.1.0 · M0 foundation
        </p>
      </div>
    </Screen>
  )
}
