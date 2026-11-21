import { useState } from 'react'
import type { Settings } from '../../services/SettingsService'
import { Button } from '../../components/ui/Button'
import { Screen } from '../../components/ui/Screen'

interface SettingsScreenProps {
  settings: Settings
  hasRun: boolean
  onChange: (patch: Partial<Settings>) => void
  onResetRun: () => void
  onClearCemetery: () => void
  onBack: () => void
}

type Confirming = 'run' | 'cemetery' | null

/**
 * Preferences live here: motion applies immediately, sound is stored for the
 * audio service that arrives in this same milestone, and both destructive
 * actions demand a second, explicit click — nothing in this screen is a
 * one-click accident.
 */
export function SettingsScreen({
  settings,
  hasRun,
  onChange,
  onResetRun,
  onClearCemetery,
  onBack,
}: SettingsScreenProps) {
  const [confirming, setConfirming] = useState<Confirming>(null)

  return (
    <Screen>
      <div className="pixel-frame w-full max-w-lg bg-paper p-6">
        <p className="font-pixel text-[8px] uppercase tracking-widest text-cocoa-soft">
          Preferences
        </p>
        <h1 className="mt-3 font-pixel text-lg">Settings</h1>

        <section className="mt-5 border-2 border-cocoa/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-pixel text-[9px] uppercase">Motion</p>
              <p className="mt-1 text-base text-cocoa-soft">
                Stops every animation when on.
              </p>
            </div>
            <Button
              variant="secondary"
              aria-pressed={settings.motionReduced}
              onClick={() => onChange({ motionReduced: !settings.motionReduced })}
            >
              {settings.motionReduced ? 'Reduced · on' : 'Reduced · off'}
            </Button>
          </div>
        </section>

        <section className="mt-3 border-2 border-cocoa/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-pixel text-[9px] uppercase">Sound</p>
              <p className="mt-1 text-base text-cocoa-soft">
                Stored now; the audio service reads it when sound lands in this
                milestone.
              </p>
            </div>
            <Button
              variant="secondary"
              aria-pressed={settings.muted}
              onClick={() => onChange({ muted: !settings.muted })}
            >
              {settings.muted ? 'Muted' : 'Mute'}
            </Button>
          </div>

          <label className="mt-4 block text-base" htmlFor="peanut-volume">
            Volume {Math.round(settings.volume * 100)}%
          </label>
          <input
            id="peanut-volume"
            type="range"
            min={0}
            max={100}
            step={5}
            disabled={settings.muted}
            value={Math.round(settings.volume * 100)}
            onChange={(event) =>
              onChange({ volume: Number(event.target.value) / 100 })
            }
            className="mt-2 w-full accent-cocoa"
          />
        </section>

        <section className="mt-3 border-2 border-danger bg-danger/5 p-4">
          <p className="font-pixel text-[9px] uppercase text-danger-ink">
            Danger zone
          </p>

          {hasRun ? (
            <div className="mt-3">
              {confirming === 'run' ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary" onClick={() => setConfirming(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    className="border-danger text-danger-ink"
                    onClick={() => {
                      setConfirming(null)
                      onResetRun()
                    }}
                  >
                    Yes, erase this run
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setConfirming('run')}
                >
                  Reset the current run
                </Button>
              )}
            </div>
          ) : null}

          <div className="mt-3">
            {confirming === 'cemetery' ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" onClick={() => setConfirming(null)}>
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  className="border-danger text-danger-ink"
                  onClick={() => {
                    setConfirming(null)
                    onClearCemetery()
                  }}
                >
                  Yes, erase every grave
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setConfirming('cemetery')}
              >
                Clear the cemetery
              </Button>
            )}
          </div>

          <p className="mt-3 text-base text-cocoa-soft">
            Neither action can be undone.
          </p>
        </section>

        <div className="mt-5">
          <Button variant="ghost" onClick={onBack}>
            ← Main menu
          </Button>
        </div>
      </div>
    </Screen>
  )
}
