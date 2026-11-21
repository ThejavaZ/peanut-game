import { PROJECT, TEAM, initials } from './team'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'

interface CreditsScreenProps {
  onBack: () => void
}

/**
 * Read-only, reachable from the menu, and never loses the run behind it.
 *
 * The initials are placeholders by design: they are computed from the same
 * `TEAM` data the test guards, so a renamed member changes the credits without
 * anyone touching this file.
 */
export function CreditsScreen({ onBack }: CreditsScreenProps) {
  return (
    <Screen>
      <div className="pixel-frame w-full max-w-xl bg-paper p-6">
        <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
          Credits
        </p>
        <h1 className="mt-3 font-pixel text-xl">{PROJECT.name}</h1>
        <p className="mt-2 text-lg italic text-cocoa-soft">{PROJECT.tagline}</p>

        <ul className="mt-5 grid gap-3">
          {TEAM.map((member) => (
            <li
              key={member.fullName}
              className="flex items-center gap-3 border-2 border-cocoa/30 bg-paper-deep p-3"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-cocoa bg-sand font-pixel text-[10px]"
              >
                {initials(member.fullName)}
              </span>
              <span className="min-w-0">
                <span className="block font-pixel text-[8px] leading-relaxed break-words">
                  {member.fullName}
                </span>
                <span className="mt-1 block text-base text-cocoa-soft">
                  {member.role}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t-2 border-cocoa/20 pt-4 text-base text-cocoa-soft">
          <p>{PROJECT.course}</p>
          <p>{PROJECT.school}</p>
          <p className="mt-1 break-all">{PROJECT.repository}</p>
        </div>

        <div className="mt-5">
          <Button variant="ghost" onClick={onBack}>
            ← Main menu
          </Button>
        </div>
      </div>
    </Screen>
  )
}
