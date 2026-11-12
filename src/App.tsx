import { useState } from 'react'
import { GameScreen } from './features/game/GameScreen'
import { MemorialScreen } from './features/memorial/MemorialScreen'
import { MainMenu } from './features/menu/MainMenu'
import { NamingScreen } from './features/naming/NamingScreen'
import { buildPlaceholderRun } from './game/placeholderRun'
import type { Screen } from './types/game'

function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })

  const goToMenu = () => setScreen({ name: 'menu' })
  const goToNaming = () => setScreen({ name: 'naming' })

  const adoptHamster = (hamsterName: string) => {
    setScreen({ name: 'game', hamsterName })
  }

  const endRun = (hamsterName: string) => {
    setScreen({ name: 'memorial', run: buildPlaceholderRun(hamsterName) })
  }

  switch (screen.name) {
    case 'menu':
      return <MainMenu onStart={goToNaming} />

    case 'naming':
      return <NamingScreen onAdopt={adoptHamster} onBack={goToMenu} />

    case 'game':
      return (
        <GameScreen
          hamsterName={screen.hamsterName}
          onEndRun={() => endRun(screen.hamsterName)}
          onBackToMenu={goToMenu}
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
