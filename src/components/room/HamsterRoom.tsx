import { HamsterSprite } from '../hamster/HamsterSprite'

interface HamsterRoomProps {
  hamsterName: string
}

export function HamsterRoom({ hamsterName }: HamsterRoomProps) {
  return (
    <div
      className="pixel-grid relative aspect-[16/9] w-full overflow-hidden border-4 border-cocoa bg-[#fdf1d8]"
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

      {/* food bowl */}
      <div className="absolute bottom-[16%] left-[12%] flex h-7 w-16 items-end justify-center rounded-b-md border-2 border-cocoa bg-blush">
        <div className="mb-1 flex gap-1.5">
          <span className="h-1.5 w-1.5 bg-cocoa" />
          <span className="h-1.5 w-1.5 bg-shell-dark" />
          <span className="h-1.5 w-1.5 bg-cocoa" />
        </div>
      </div>

      {/* hamster */}
      <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2">
        <HamsterSprite className="h-24 w-24 animate-hamster-idle sm:h-32 sm:w-32" />
      </div>
    </div>
  )
}
