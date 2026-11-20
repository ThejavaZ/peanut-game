import { useState } from 'react'
import { CemeteryScreen } from './features/cemetery/CemeteryScreen'
import { GameScreen } from './features/game/GameScreen'
import { MemorialScreen } from './features/memorial/MemorialScreen'
import { MainMenu } from './features/menu/MainMenu'
import { NamingScreen } from './features/naming/NamingScreen'
import { findEasterEgg, getDisplayName } from './game/easterEggs'
import { buildRunSummary } from './game/runSummary'
import { findSecretSkin } from './game/skins'
import { useGameRun } from './hooks/useGameRun'
import { loadCemetery } from './services/CemeteryService'
import { loadUnlockedSkins, unlockSkin } from './services/SkinService'
import type { Screen, SkinId } from './types/game'

function App() {
  const { run, adopt, care, resolveEvent, togglePause, resetRun } = useGameRun()
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })
  const [unlockedSkins, setUnlockedSkins] = useState<SkinId[]>(() =>
    loadUnlockedSkins(),
  )

  const goToMenu = () => setScreen({ name: 'menu' })
  const goToNaming = () => setScreen({ name: 'naming' })
  const goToCemetery = () => setScreen({ name: 'cemetery' })

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

  /**
   * The record is what the player sees now: a dead run always renders the
   * memorial, whatever screen it was left on. Leaving it (either way) clears
   * the run — the persistent history of every hamster is the cemetery (M2).
   */
  const summary = run && run.death ? buildRunSummary(run, run.death) : null
  const activeScreen: Screen =
    summary && screen.name !== 'memorial'
      ? { name: 'memorial', run: summary }
      : screen

  const leaveMemorial = (next: Screen) => {
    resetRun()
    setScreen(next)
  }

  switch (activeScreen.name) {
    case 'menu':
      return (
        <MainMenu
          hasRun={run !== null}
          hamsterName={run ? getDisplayName(run.hamster.name) : undefined}
          skinId={run?.hamster.skinId}
          accessoryId={run?.hamster.accessoryId}
          day={run ? run.hamster.ageDays + 1 : undefined}
          cemeteryCount={loadCemetery().length}
          onStart={goToNaming}
          onContinue={() => setScreen({ name: 'game' })}
          onOpenCemetery={goToCemetery}
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
            cemeteryCount={loadCemetery().length}
            onStart={goToNaming}
            onContinue={goToMenu}
            onOpenCemetery={goToCemetery}
          />
        )
      }
      return (
        <GameScreen
          run={run}
          onCare={care}
          onResolveEvent={resolveEvent}
          onTogglePause={togglePause}
          onBackToMenu={goToMenu}
        />
      )

    case 'memorial':
      return (
        <MemorialScreen
          run={activeScreen.run}
          onAdoptAnother={() => leaveMemorial({ name: 'naming' })}
          onMainMenu={() => leaveMemorial({ name: 'menu' })}
        />
      )

    case 'cemetery':
      return <CemeteryScreen entries={loadCemetery()} onBack={goToMenu} />
  }
}

export default App
