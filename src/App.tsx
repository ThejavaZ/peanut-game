import { useState } from 'react'
import { GameScreen } from './features/game/GameScreen'
import { MemorialScreen } from './features/memorial/MemorialScreen'
import { MainMenu } from './features/menu/MainMenu'
import { NamingScreen } from './features/naming/NamingScreen'
import { findEasterEgg, getDisplayName } from './game/easterEggs'
import { buildRunSummary } from './game/runSummary'
import { findSecretSkin } from './game/skins'
import { useGameRun } from './hooks/useGameRun'
import { loadUnlockedSkins, unlockSkin } from './services/SkinService'
import type { Screen, SkinId } from './types/game'

function App() {
  const { run, adopt, care, togglePause, resetRun } = useGameRun()
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })
  const [unlockedSkins, setUnlockedSkins] = useState<SkinId[]>(() =>
    loadUnlockedSkins(),
  )

  const goToMenu = () => setScreen({ name: 'menu' })
  const goToNaming = () => setScreen({ name: 'naming' })

  const handleAdopt = (hamsterName: string, skinId: SkinId) => {
    const secret = findSecretSkin(hamsterName)
    if (secret) {
      setUnlockedSkins(unlockSkin(secret.id))
    }
    const egg = findEasterEgg(hamsterName)
    adopt(
      hamsterName,
      secret?.id ?? skinId,
      egg?.id === 'sudo' ? 'crown' : 'none',
    )
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
          hamsterName={run ? getDisplayName(run.hamster.name) : undefined}
          skinId={run?.hamster.skinId}
          accessoryId={run?.hamster.accessoryId}
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
          unlockedSkins={unlockedSkins}
          initialSkinId={run?.hamster.skinId}
          replacingName={run ? getDisplayName(run.hamster.name) : undefined}
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
