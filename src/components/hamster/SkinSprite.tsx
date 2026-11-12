import type { AccessoryId, SkinId } from '../../types/game'
import { SKIN_SPRITES } from './skinSprites'

interface SkinSpriteProps {
  skinId: SkinId
  accessoryId?: AccessoryId
  className?: string
}

function Crown() {
  return (
    <g>
      <rect x="5" y="0" width="1" height="2" fill="#f7df1e" />
      <rect x="7" y="0" width="2" height="2" fill="#f7df1e" />
      <rect x="10" y="0" width="1" height="2" fill="#f7df1e" />
      <rect x="5" y="2" width="6" height="1" fill="#f7df1e" />
      <rect x="6" y="2" width="1" height="1" fill="#d9534f" />
      <rect x="9" y="2" width="1" height="1" fill="#d9534f" />
    </g>
  )
}

/**
 * 16x16 pixel sprite selected by skin. Every cell is a 1x1 rect, so the art
 * stays crisp at any integer scale without bitmap assets.
 */
export function SkinSprite({
  skinId,
  accessoryId = 'none',
  className = '',
}: SkinSpriteProps) {
  const sprite = SKIN_SPRITES[skinId] ?? SKIN_SPRITES.hamster

  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <ellipse cx="8" cy="14.6" rx="5.2" ry="0.8" fill="#4a3228" opacity="0.18" />
      {sprite.rows.map((row, y) =>
        [...row].map((char, x) => {
          const fill = sprite.palette[char]
          if (!fill) {
            return null
          }
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
            />
          )
        }),
      )}
      {accessoryId === 'crown' ? <Crown /> : null}
    </svg>
  )
}
