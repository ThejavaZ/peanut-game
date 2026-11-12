import type { ReactNode } from 'react'

interface ScreenProps {
  children: ReactNode
}

export function Screen({ children }: ScreenProps) {
  return (
    <main className="pixel-grid flex min-h-dvh flex-col items-center justify-center bg-paper-deep px-4 py-10">
      {children}
    </main>
  )
}
