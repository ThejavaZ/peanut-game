import { getNeedStatus } from '../../game/rules'
import type { NeedStatus } from '../../types/game'

const BAR_STYLES: Record<NeedStatus, string> = {
  ok: 'bg-mint',
  warning: 'bg-shell',
  critical: 'bg-danger',
}

const VALUE_STYLES: Record<NeedStatus, string> = {
  ok: 'text-cocoa-soft',
  warning: 'text-shell-dark',
  critical: 'text-danger',
}

interface NeedBarProps {
  label: string
  value: number
}

export function NeedBar({ label, value }: NeedBarProps) {
  const status = getNeedStatus(value)
  const rounded = Math.round(value)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base">{label}</span>
        <span className={`font-pixel text-[8px] ${VALUE_STYLES[status]}`}>
          {rounded}
        </span>
      </div>
      <div
        className="mt-1 h-3 w-full border-2 border-cocoa bg-paper-deep"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
      >
        <div
          className={`h-full transition-[width] duration-500 ease-out ${BAR_STYLES[status]}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  )
}
