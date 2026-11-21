import type { CemeteryEntry } from '../../types/game'
import { SkinSprite } from '../../components/hamster/SkinSprite'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'

interface CemeteryScreenProps {
  entries: readonly CemeteryEntry[]
  onBack: () => void
}

/**
 * Read-only list of every hamster that has died, newest first. Nothing here
 * can be edited: a history you can rewrite is not a history.
 */
export function CemeteryScreen({ entries, onBack }: CemeteryScreenProps) {
  const total = entries.length

  return (
    <Screen>
      <div className="w-full max-w-2xl">
        <header className="text-center">
          <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
            Every little life has an ending
          </p>
          <h1 className="mt-4 font-pixel text-2xl">Cemetery</h1>
          <p className="mt-3 text-lg text-cocoa-soft">
            {total === 0
              ? 'Nobody rests here yet.'
              : `${total} ${total === 1 ? 'hamster rests' : 'hamsters rest'} here.`}
          </p>
        </header>

        {total > 0 ? (
          <ul className="mt-6 grid gap-3">
            {entries.map((entry) => (
              <li
                key={`${entry.name}-${entry.diedAt}`}
                className="pixel-frame-sm bg-paper p-4"
              >
                <div className="flex items-start gap-4">
                  <SkinSprite
                    skinId={entry.skinId}
                    accessoryId={entry.accessoryId}
                    className="h-14 w-14 shrink-0 opacity-70 grayscale"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="font-pixel text-sm">{entry.name}</h2>
                      <span className="font-pixel text-[7px] uppercase tracking-widest text-cocoa-soft">
                        Day {entry.daysSurvived} · Score {entry.score} ·{' '}
                        {new Date(entry.diedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-base text-cocoa-soft">
                      {entry.causeOfDeath}
                    </p>
                    <p className="mt-2 text-lg italic text-cocoa-soft">
                      &ldquo;{entry.epitaph}&rdquo;
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-6">
          <Button variant="ghost" onClick={onBack}>
            ← Main menu
          </Button>
        </div>
      </div>
    </Screen>
  )
}
