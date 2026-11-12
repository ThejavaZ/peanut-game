import { HamsterRoom } from '../../components/room/HamsterRoom'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'

const NEEDS = ['Hunger', 'Thirst', 'Hygiene', 'Happiness', 'Health']
const CARE_ACTIONS = ['Feed', 'Water', 'Clean', 'Play']

interface GameScreenProps {
  hamsterName: string
  onEndRun: () => void
  onBackToMenu: () => void
}

export function GameScreen({ hamsterName, onEndRun, onBackToMenu }: GameScreenProps) {
  return (
    <Screen>
      <div className="w-full max-w-3xl">
        <header className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
              Day 1 · New home
            </p>
            <h1 className="mt-2 font-pixel text-xl sm:text-2xl">{hamsterName}</h1>
          </div>
          <span className="border-2 border-cocoa bg-mint px-2 py-1 font-pixel text-[8px] uppercase">
            Alive
          </span>
        </header>

        <div className="pixel-frame bg-paper p-3 sm:p-4">
          <HamsterRoom hamsterName={hamsterName} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
          <section className="pixel-frame-sm bg-paper p-4">
            <h2 className="font-pixel text-[10px] uppercase">Needs · coming in M1</h2>
            <p className="mt-2 text-lg text-cocoa-soft">
              Hunger, thirst, hygiene, happiness and health are the next milestone.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {NEEDS.map((need) => (
                <li key={need} className="border-2 border-cocoa/25 px-2 py-1 text-base">
                  {need}
                </li>
              ))}
            </ul>
          </section>

          <section className="pixel-frame-sm bg-paper p-4">
            <h2 className="font-pixel text-[10px] uppercase">Care actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {CARE_ACTIONS.map((action) => (
                <Button key={action} variant="secondary" disabled className="px-2 text-[8px]">
                  {action}
                </Button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={onBackToMenu}>
            ← Main menu
          </Button>
          <Button variant="ghost" onClick={onEndRun} className="text-danger">
            Skip to memorial (dev)
          </Button>
        </div>
      </div>
    </Screen>
  )
}
