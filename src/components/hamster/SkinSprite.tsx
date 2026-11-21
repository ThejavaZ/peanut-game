import type { AccessoryId, SkinId } from '../../types/game'
import { spriteFor } from './skinSprites'
import type { HamsterState } from './skinSprites'

interface SkinSpriteProps {
  skinId: SkinId
  accessoryId?: AccessoryId
  /** Which pose to draw. Only the classic hamster has its own grids. */
  state?: HamsterState
  className?: string
}

function Crown() {
  return (
    <g>
      <rect x="5" y="0" width="1" height="2" fill="#f7df1e" />
      <rect x="7" y="0" width="2" height="2" fill="#f7df1e" />
      <rect x="10" y="0" width="1" height="2" fill="#f7df1e" />
      <rect x="5" y="2" width="6" height="1" fill="#f7df1e" />
      <rect x="6" y="3" width="1" height="1" fill="#d9534f" />
      <rect x="9" y="3" width="1" height="1" fill="#d9534f" />
    </g>
  )
}

/**
 * 16x16 pixel sprite selected by skin and pose. Every cell is a 1x1 rect, so
 * the art stays crisp at any integer scale without bitmap assets.
 *
 * `dead` turns the *body* upside down — legs up, the cartoon convention —
 * while the ground shadow stays where it belongs, which is why the rotation
 * lives on a group instead of on the whole element. It works for every skin
 * without a second grid each.
 */
export function SkinSprite({
  skinId,
  accessoryId = 'none',
  state = 'idle',
  className = '',
}: SkinSpriteProps) {
  const sprite = spriteFor(skinId, state)
  const pose = state === 'dead' ? 'rotate(180 8 8)' : undefined
  const motion =
    state === 'play' ? ' animate-hamster-idle' : ''

  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={`${className}${motion}`}
    >
      <ellipse
        cx="8"
        cy="14.6"
        rx="5.2"
        ry="0.8"
        fill="#4a3228"
        opacity="0.18"
      />
      <g transform={pose}>
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
      </g>
    </svg>
  )
}
