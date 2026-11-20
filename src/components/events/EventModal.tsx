import type { AccessoryId, GameEvent, SkinId } from '../../types/game'
import { SkinSprite } from '../hamster/SkinSprite'
import { Button } from '../ui/Button'

interface EventModalProps {
  event: GameEvent
  skinId: SkinId
  accessoryId: AccessoryId
  hamsterName: string
  onChoose: (choiceId: string) => void
}

/**
 * Pure presentation: the modal reads no game state and writes none — it only
 * reports which choice was clicked.
 *
 * There is deliberately no close button, no backdrop click and no Escape key:
 * the clock stays frozen until the player commits to an option, and the
 * consequence of each one is spelled out before that happens.
 */
export function EventModal({
  event,
  skinId,
  accessoryId,
  hamsterName,
  onChoose,
}: EventModalProps) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-cocoa/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        className="pixel-frame w-full max-w-lg bg-paper p-5 sm:p-6"
      >
        <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
          Something happened to {hamsterName}
        </p>

        <h2 className="mt-3 font-pixel text-sm leading-relaxed sm:text-base">
          {event.title}
        </h2>

        <div className="mt-4 flex items-start gap-4">
          <SkinSprite
            skinId={skinId}
            accessoryId={accessoryId}
            className="h-16 w-16 shrink-0 animate-hamster-idle"
          />
          <p className="text-lg leading-snug text-cocoa-soft">
            {event.description}
          </p>
        </div>

        <div className="mt-5 grid gap-2">
          {event.choices.map((choice, index) => (
            <Button
              key={choice.id}
              onClick={() => onChoose(choice.id)}
              autoFocus={index === 0}
              className="w-full py-3"
            >
              <span className="flex w-full flex-col items-start gap-1 text-left">
                <span>{choice.label}</span>
                <span className="font-body text-base normal-case tracking-normal text-cocoa-soft">
                  {choice.hint}
                </span>
              </span>
            </Button>
          ))}
        </div>

        <p className="mt-4 text-base text-cocoa-soft">
          The clock is stopped until you choose.
        </p>
      </div>
    </div>
  )
}
