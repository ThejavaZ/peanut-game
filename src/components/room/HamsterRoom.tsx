import { SkinSprite } from '../hamster/SkinSprite'
import type { HamsterState } from '../hamster/skinSprites'
import type { AccessoryId, SkinId } from '../../types/game'

interface HamsterRoomProps {
  hamsterName: string
  skinId: SkinId
  accessoryId?: AccessoryId
  /** Which pose Peanut is in right now. */
  state?: HamsterState
  paused?: boolean
  vanished?: boolean
  serverDecor?: boolean
}

export function HamsterRoom({
  hamsterName,
  skinId,
  accessoryId = 'none',
  state = 'idle',
  paused = false,
  vanished = false,
  serverDecor = false,
}: HamsterRoomProps) {
  return (
    <div
      className="pixel-grid relative aspect-[16/9] w-full overflow-hidden border-4 border-cocoa bg-cage"
      role="img"
      aria-label={`${hamsterName}'s cage`}
    >
      {/* water bottle */}
      <div className="absolute top-[12%] right-[8%] flex flex-col items-center">
        <div className="h-2 w-9 border-2 border-cocoa bg-sky" />
        <div className="h-16 w-7 border-2 border-t-0 border-cocoa bg-sky/70" />
        <div className="h-5 w-1 bg-cocoa/60" />
      </div>

      {/* floor */}
      <div className="absolute inset-x-0 bottom-0 h-[26%] border-t-4 border-cocoa bg-shell/45" />
      <div className="absolute inset-x-0 bottom-[26%] h-2 bg-paper-deep" />

      {/* bedding: pale shavings scattered on the floor. A material colour,
          like the sprite palettes: wood shavings stay pale in both themes,
          and paper-tinted shavings would vanish against the dark floor. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[4%] h-[9%] opacity-70"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, transparent 0 9px, rgba(255,246,229,0.55) 9px 13px)',
        }}
      />

      {/* food bowl */}
      <div className="absolute bottom-[16%] left-[12%] flex h-7 w-16 items-end justify-center rounded-b-md border-2 border-cocoa bg-blush">
        <div className="mb-1 flex gap-1.5">
          <span className="h-1.5 w-1.5 bg-cocoa" />
          <span className="h-1.5 w-1.5 bg-shell-dark" />
          <span className="h-1.5 w-1.5 bg-cocoa" />
        </div>
      </div>

      {serverDecor ? (
        <div
          className="absolute right-[9%] bottom-[20%] flex flex-col gap-1"
          aria-hidden="true"
        >
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="flex h-4 w-10 items-center gap-1 border-2 border-cocoa bg-cocoa px-1"
            >
              <span className="h-1 w-1 bg-mint" />
              <span className="h-1 w-1 bg-mint/60" />
              <span className="h-1 w-1 bg-danger" />
            </div>
          ))}
        </div>
      ) : (
        // The wheel belongs to the room; the server rack only appears for the
        // localhost easter egg, and the two share the same corner.
        <div
          aria-hidden="true"
          className="absolute right-[10%] bottom-[24%] h-16 w-16 rounded-full border-4 border-cocoa bg-paper/40"
        >
          <div className="absolute left-1/2 top-1/2 h-1 w-full -translate-x-1/2 -translate-y-1/2 bg-cocoa/70" />
          <div className="absolute left-1/2 top-1/2 h-full w-1 -translate-x-1/2 -translate-y-1/2 bg-cocoa/70" />
        </div>
      )}

      {/* hamster */}
      <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2">
        <SkinSprite
          skinId={skinId}
          accessoryId={accessoryId}
          state={state}
          className={`h-24 w-24 transition-opacity duration-500 sm:h-32 sm:w-32 ${
            paused || vanished ? '' : 'animate-hamster-idle'
          } ${vanished ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>
    </div>
  )
}
