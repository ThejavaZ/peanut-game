interface HamsterSpriteProps {
  className?: string
}

const BODY = '#e2a76f'
const BODY_LIGHT = '#eec08c'
const BODY_DARK = '#cf8f55'
const BELLY = '#f7e3c3'
const EAR = '#d98f7a'
const EAR_INNER = '#f7c6b8'
const EYE = '#2b1d16'
const NOSE = '#e8837a'
const CHEEK = '#f2a7a0'

/**
 * 16x16 pixel-art hamster drawn with plain rects, so it stays crisp at any
 * integer scale without shipping image assets.
 */
export function HamsterSprite({ className = '' }: HamsterSpriteProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <ellipse cx="8" cy="14.7" rx="5" ry="0.8" fill={BODY_DARK} opacity="0.25" />

      {/* ears (behind the body) */}
      <rect x="2" y="1" width="3" height="4" fill={EAR} />
      <rect x="11" y="1" width="3" height="4" fill={EAR} />
      <rect x="3" y="2" width="1" height="2" fill={EAR_INNER} />
      <rect x="12" y="2" width="1" height="2" fill={EAR_INNER} />

      {/* head and body */}
      <rect x="5" y="2" width="6" height="1" fill={BODY} />
      <rect x="4" y="3" width="8" height="1" fill={BODY} />
      <rect x="3" y="4" width="10" height="1" fill={BODY} />
      <rect x="2" y="5" width="12" height="6" fill={BODY} />
      <rect x="3" y="11" width="10" height="1" fill={BODY} />
      <rect x="4" y="12" width="8" height="1" fill={BODY} />

      {/* head highlight */}
      <rect x="5" y="3" width="3" height="1" fill={BODY_LIGHT} />

      {/* feet */}
      <rect x="4" y="13" width="2" height="1" fill={BODY_DARK} />
      <rect x="10" y="13" width="2" height="1" fill={BODY_DARK} />

      {/* belly, cheeks and whiskers */}
      <rect x="5" y="8" width="6" height="4" fill={BELLY} />
      <rect x="3" y="9" width="1" height="1" fill={CHEEK} />
      <rect x="12" y="9" width="1" height="1" fill={CHEEK} />
      <rect x="1" y="10" width="1" height="1" fill={BODY_DARK} />
      <rect x="14" y="10" width="1" height="1" fill={BODY_DARK} />

      {/* eyes */}
      <g className="animate-blink">
        <rect x="4" y="6" width="2" height="2" fill={EYE} />
        <rect x="10" y="6" width="2" height="2" fill={EYE} />
        <rect x="4" y="6" width="1" height="1" fill="#fff" />
        <rect x="10" y="6" width="1" height="1" fill="#fff" />
      </g>

      {/* nose and mouth */}
      <rect x="7" y="9" width="2" height="1" fill={NOSE} />
      <rect x="7" y="11" width="2" height="1" fill={BODY_DARK} />
    </svg>
  )
}
