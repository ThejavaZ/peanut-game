import { SkinSprite } from '../../components/hamster/SkinSprite'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'
import type { AccessoryId, SkinId } from '../../types/game'

interface MainMenuProps {
  hasRun: boolean
  hamsterName?: string
  skinId?: SkinId
  accessoryId?: AccessoryId
  day?: number
  onStart: () => void
  onContinue: () => void
}

export function MainMenu({
  hasRun,
  hamsterName,
  skinId = 'hamster',
  accessoryId = 'none',
  day,
  onStart,
  onContinue,
}: MainMenuProps) {
  return (
    <Screen>
      <div className="w-full max-w-2xl text-center">
        <span className="inline-block border-2 border-cocoa bg-mint px-3 py-1 font-pixel text-[8px] uppercase tracking-widest">
          Indie · Pet sim · Dark comedy
        </span>

        <div className="mt-8 flex justify-center">
          <SkinSprite
            skinId={skinId}
            accessoryId={accessoryId}
            className="h-36 w-36 animate-hamster-idle sm:h-40 sm:w-40"
          />
        </div>

        <h1 className="mt-6 font-pixel text-4xl text-cocoa sm:text-6xl">PEANUT</h1>
        <p className="mt-4 font-pixel text-[10px] uppercase tracking-[0.2em] text-cocoa-soft">
          A hamster&apos;s little life
        </p>

        <div className="pixel-frame mx-auto mt-10 max-w-sm bg-paper p-5">
          {hasRun ? (
            <>
              <Button onClick={onContinue} className="w-full">
                Continue with {hamsterName}
              </Button>
              <Button variant="secondary" onClick={onStart} className="mt-3 w-full">
                Adopt a new hamster
              </Button>
              <p className="mt-4 text-base text-cocoa-soft">
                Day {day} · still alive. Starting over replaces this hamster.
              </p>
            </>
          ) : (
            <>
              <Button onClick={onStart} className="w-full">
                Adopt a hamster
              </Button>
              <Button variant="secondary" disabled className="mt-3 w-full">
                Cemetery · soon
              </Button>
              <p className="mt-5 text-lg text-cocoa-soft">
                Every little life has an ending. Make it count.
              </p>
            </>
          )}
        </div>

        <p className="mt-8 font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
          v0.3.0 · skins &amp; secrets
        </p>
      </div>
    </Screen>
  )
}
