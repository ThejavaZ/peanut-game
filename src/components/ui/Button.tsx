import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const variantStyles: Record<Variant, string> = {
  primary: 'bg-shell text-cocoa hover:bg-[#e3ad6b]',
  secondary: 'bg-paper text-cocoa hover:bg-sand',
  ghost: 'border-0 bg-transparent text-cocoa-soft shadow-none hover:bg-paper/70 hover:text-cocoa',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const frame =
    variant === 'ghost'
      ? ''
      : 'pixel-frame-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-3 font-pixel text-[10px] uppercase tracking-wider transition-transform disabled:cursor-not-allowed disabled:opacity-50 ${frame} ${variantStyles[variant]} ${className}`}
      {...props}
    />
  )
}
