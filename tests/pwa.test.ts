import { describe, expect, test } from 'bun:test'

/**
 * The installability gate. There is no browser here, so these tests pin the
 * parts that silently break a PWA: a manifest missing a required field, an
 * icon that does not exist, a cache name nobody bumps, or a worker registered
 * at the wrong base path.
 */

const manifest = JSON.parse(
  await Bun.file('public/manifest.webmanifest').text(),
) as {
  name?: string
  short_name?: string
  description?: string
  lang?: string
  start_url?: string
  scope?: string
  display?: string
  background_color?: string
  theme_color?: string
  icons?: { src: string; sizes: string; type: string; purpose: string }[]
}

const serviceWorker = await Bun.file('public/sw.js').text()
const indexHtml = await Bun.file('index.html').text()
const mainTsx = await Bun.file('src/main.tsx').text()
const packageJson = JSON.parse(await Bun.file('package.json').text()) as {
  version?: string
}

describe('the manifest', () => {
  test('declares everything Chrome needs to offer the install', () => {
    expect(manifest.name).toContain('Peanut')
    expect(manifest.short_name).toBe('Peanut')
    expect(manifest.lang).toBe('en')
    expect(manifest.description?.length).toBeGreaterThan(10)
    // standalone is what removes the browser chrome.
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBeTruthy()
    expect(manifest.scope).toBeTruthy()
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i)
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i)
  })

  test('offers a 192 icon, a 512 icon and a maskable one', () => {
    const icons = manifest.icons ?? []
    expect(icons).toHaveLength(3)

    const any192 = icons.find(
      (icon) => icon.sizes === '192x192' && icon.purpose === 'any',
    )
    const any512 = icons.find(
      (icon) => icon.sizes === '512x512' && icon.purpose === 'any',
    )
    const maskable = icons.find((icon) => icon.purpose === 'maskable')

    expect(any192).toBeDefined()
    expect(any512).toBeDefined()
    expect(maskable?.sizes).toBe('512x512')
    for (const icon of icons) {
      expect(icon.type).toBe('image/png')
      // Relative urls resolve against the manifest, so the same file works on
      // the dev server and under /peanut-game/ in production.
      expect(icon.src.startsWith('/')).toBe(false)
    }
  })

  test('every icon it asks for actually exists and is a PNG', async () => {
    for (const icon of manifest.icons ?? []) {
      const file = Bun.file(`public/${icon.src}`)
      expect(await file.exists()).toBe(true)
      const bytes = new Uint8Array(await file.arrayBuffer())
      expect([...bytes.slice(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47])
    }
  })

  test('index.html links the manifest and the touch icon', () => {
    expect(indexHtml).toContain('rel="manifest"')
    expect(indexHtml).toContain('manifest.webmanifest')
    expect(indexHtml).toContain('apple-touch-icon')
  })
})

describe('the service worker', () => {
  test('its cache name follows the version in package.json', () => {
    // The classic PWA trap: bump the app, forget the cache, and nobody ever
    // sees the new build. The test ties them together instead.
    expect(packageJson.version).toBeTruthy()
    expect(serviceWorker).toContain(`peanut-v${packageJson.version}`)
  })

  test('caches navigations only through the network, and assets first', () => {
    expect(serviceWorker).toContain("request.mode === 'navigate'")
    // Hashed assets are immutable: cache first, never revalidate.
    expect(serviceWorker).toContain('caches.match(request)')
    expect(serviceWorker).toContain('self.location.origin')
    expect(serviceWorker).toContain("request.method !== 'GET'")
  })

  test('installs the shell and throws the old caches away', () => {
    expect(serviceWorker).toContain("addEventListener('install'")
    expect(serviceWorker).toContain("addEventListener('activate'")
    expect(serviceWorker).toContain('caches.delete')
    expect(serviceWorker).toContain('skipWaiting')
    expect(serviceWorker).toContain('./icon-192.png')
    expect(serviceWorker).toContain('./manifest.webmanifest')
  })

  test('registers only in production, at the base path', () => {
    expect(mainTsx).toContain('import.meta.env.PROD')
    expect(mainTsx).toContain("import.meta.env.BASE_URL}sw.js")
    expect(mainTsx).toContain('serviceWorker' as string)
  })
})
