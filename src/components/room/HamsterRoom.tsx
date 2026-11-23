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
  feeding?: boolean
  watering?: boolean
  cleaning?: boolean
  playing?: boolean
  serverDecor?: boolean
}

export function HamsterRoom({
  hamsterName,
  skinId,
  accessoryId = 'none',
  state = 'idle',
  paused = false,
  vanished = false,
  feeding = false,
  watering = false,
  cleaning = false,
  playing = false,
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
        <div className="relative h-16 w-7 overflow-hidden border-2 border-t-0 border-cocoa bg-sky/20">
          <div
            className={`absolute inset-x-0 bottom-0 h-full bg-sky/70 ${
              watering ? 'animate-water-level' : ''
            }`}
          />
        </div>
        <div className="h-5 w-1 bg-cocoa/60" />
      </div>

      {watering ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[32%] right-[10%] h-5 w-8"
        >
          <span className="animate-water-bubble water-bubble-delay-1 absolute left-1 h-1.5 w-1.5 bg-sky" />
          <span className="animate-water-bubble water-bubble-delay-2 absolute left-3 top-1 h-1 w-1 bg-sky" />
          <span className="animate-water-bubble water-bubble-delay-3 absolute left-5 h-1.5 w-1.5 bg-sky" />
        </div>
      ) : null}

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
          <span
            className={`h-1.5 w-1.5 bg-cocoa ${
              feeding ? 'animate-feed-food feed-food-delay-1' : ''
            }`}
          />
          <span
            className={`h-1.5 w-1.5 bg-shell-dark ${
              feeding ? 'animate-feed-food feed-food-delay-2' : ''
            }`}
          />
          <span
            className={`h-1.5 w-1.5 bg-cocoa ${
              feeding ? 'animate-feed-food feed-food-delay-3' : ''
            }`}
          />
        </div>
      </div>

      {feeding ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[21%] left-[12%] flex h-7 w-16 items-center justify-center"
        >
          <span className="animate-feed-particle feed-particle-1 absolute left-[20%] h-1.5 w-1.5 bg-shell-dark" />
          <span className="animate-feed-particle feed-particle-2 absolute left-1/2 h-1 w-1 bg-cocoa" />
          <span className="animate-feed-particle feed-particle-3 absolute left-[70%] h-1.5 w-1.5 bg-shell-dark" />
        </div>
      ) : null}

      {cleaning ? (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[50%] left-[50%] z-10 h-4 w-8"
          >
            <div className="animate-clean-sponge flex h-full w-full items-center justify-evenly border-2 border-cocoa bg-shell">
              <span className="h-1 w-1 bg-shell-hover" />
              <span className="h-1.5 w-1.5 bg-shell-hover" />
              <span className="h-1 w-1 bg-shell-hover" />
            </div>
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[50%] left-[50%] z-10 h-10 w-10"
          >
            <span className="animate-clean-bubble clean-bubble-delay-1 absolute bottom-1 left-0 h-1 w-1 bg-sky" />
            <span className="animate-clean-bubble clean-bubble-delay-2 absolute bottom-2 left-3 h-1.5 w-1.5 bg-sky" />
            <span className="animate-clean-bubble clean-bubble-delay-3 absolute bottom-0 left-6 h-2 w-2 bg-sky" />
          </div>
        </>
      ) : null}

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
          className={`absolute right-[10%] bottom-[24%] h-16 w-16 rounded-full border-4 border-cocoa bg-paper/40 ${
            playing ? 'animate-exercise-wheel' : ''
          }`}
        >
          <div className="absolute left-1/2 top-1/2 h-1 w-full -translate-x-1/2 -translate-y-1/2 bg-cocoa/70" />
          <div className="absolute left-1/2 top-1/2 h-full w-1 -translate-x-1/2 -translate-y-1/2 bg-cocoa/70" />
        </div>
      )}

      {/* hamster */}
      <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2">
        <div
          className={
            playing
              ? serverDecor
                ? 'animate-hamster-play-in-place'
                : 'animate-hamster-play'
              : ''
          }
        >
          <SkinSprite
            skinId={skinId}
            accessoryId={accessoryId}
            state={state}
            className={`h-24 w-24 transition-opacity duration-500 sm:h-32 sm:w-32 ${
              paused || vanished
                ? ''
                : watering
                  ? 'animate-hamster-water'
                  : feeding
                    ? 'animate-hamster-feed'
                    : 'animate-hamster-idle'
            } ${vanished ? 'opacity-0' : 'opacity-100'}`}
          />
        </div>
      </div>
    </div>
  )
}
