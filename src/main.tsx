import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, loadSettings } from './services/SettingsService'

/**
 * The theme lands on <html> before React renders: a useEffect would apply it
 * after the first paint, and a dark-mode player would get a flash of light
 * paper on every load. Settings own this attribute, App keeps it in sync.
 */
applyTheme(loadSettings().theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

/**
 * Installing and going offline are bonuses, so they never gate the game: the
 * service worker only registers in the production build — in dev it would
 * happily cache the dev server — and the base path keeps it on the same scope
 * the app lives in, `/peanut-game/` on GitHub Pages.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {
        // Offline support is a bonus; the game runs without it.
      })
  })
}
