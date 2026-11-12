import { useState } from 'react'
import { GameScreen } from './features/game/GameScreen'
import { MemorialScreen } from './features/memorial/MemorialScreen'
import { MainMenu } from './features/menu/MainMenu'
import { NamingScreen } from './features/naming/NamingScreen'
import { buildRunSummary } from './game/runSummary'
import { useGameRun } from './hooks/useGameRun'
import type { Screen } from './types/game'

function App() {
  const { run, adopt, care, togglePause, resetRun } = useGameRun()
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })

  const goToMenu = () => setScreen({ name: 'menu' })
  const goToNaming = () => setScreen({ name: 'naming' })

  const handleAdopt = (hamsterName: string) => {
    adopt(hamsterName)
    setScreen({ name: 'game' })
  }

  const handleEndRun = () => {
    if (!run) {
      return
    }
    const summary = buildRunSummary(run)
    resetRun()
    setScreen({ name: 'memorial', run: summary })
  }

  switch (screen.name) {
    case 'menu':
      return (
        <MainMenu
          hasRun={run !== null}
          hamsterName={run?.hamster.name}
          day={run ? run.hamster.ageDays + 1 : undefined}
          onStart={goToNaming}
          onContinue={() => setScreen({ name: 'game' })}
        />
      )

    case 'naming':
      return (
        <NamingScreen
          onAdopt={handleAdopt}
          onBack={goToMenu}
          replacingName={run?.hamster.name}
        />
      )

    case 'game':
      if (!run) {
        return (
          <MainMenu
            hasRun={false}
            onStart={goToNaming}
            onContinue={goToMenu}
          />
        )
      }
      return (
        <GameScreen
          run={run}
          onCare={care}
          onTogglePause={togglePause}
          onBackToMenu={goToMenu}
          onEndRun={handleEndRun}
        />
      )

    case 'memorial':
      return (
        <MemorialScreen
          run={screen.run}
          onAdoptAnother={goToNaming}
          onMainMenu={goToMenu}
        />
      )
  }
}

export default App
