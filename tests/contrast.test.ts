import { describe, expect, test } from 'bun:test'

/**
 * The accessibility gate for the palette: ratios are computed from
 * `src/index.css` itself, so editing a colour in the stylesheet — not in this
 * file — is what can break these tests.
 *
 * The stylesheet carries two palettes: the light one inside `@theme`, and the
 * night one inside `:root[data-theme='dark']`. They are parsed block by block
 * (a single regex over the whole file would let the dark values overwrite the
 * light ones and audit the wrong colours), checked to declare exactly the same
 * tokens, and then audited against the same WCAG pairs.
 */

const css = await Bun.file('src/index.css').text()

/** The body of the first block that opens with `opening`. */
function blockBody(opening: string): string {
  const start = css.indexOf(opening)
  if (start < 0) {
    return ''
  }
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  return open < 0 || close < 0 ? '' : css.slice(open + 1, close)
}

function paletteIn(body: string): Record<string, string> {
  const colors: Record<string, string> = {}
  for (const match of body.matchAll(
    /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g,
  )) {
    colors[match[1]] = match[2]
  }
  return colors
}

function luminance(hex: string): number {
  const channels = [0, 2, 4]
    .map((offset) => parseInt(hex.slice(offset + 1, offset + 3), 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    )
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

/** WCAG 2.x contrast ratio: 1 for identical colours, 21 for black on white. */
function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

const PALETTES: [string, Record<string, string>][] = [
  ['light', paletteIn(blockBody('@theme {'))],
  ['dark', paletteIn(blockBody(":root[data-theme='dark'] {"))],
]

/**
 * Each pair names the two tokens a component actually puts together. The
 * ratio is symmetric, so `cocoa on mint` also covers mint text on a cocoa
 * fill (the segfault banner).
 */
const TEXT_PAIRS: [string, string, string][] = [
  ['cocoa', 'paper', 'body text'],
  ['cocoa', 'paper-deep', 'text on panels'],
  ['cocoa-soft', 'paper', 'secondary text'],
  ['cocoa-soft', 'paper-deep', 'badges and epitaphs'],
  ['danger-ink', 'paper', 'critical alert'],
  ['danger-ink', 'paper-deep', 'danger zone labels'],
  ['cocoa', 'mint', 'happy badge, maze exit, segfault banner'],
  ['cocoa', 'shell', 'worried badge, primary button'],
  ['cocoa', 'shell-hover', 'primary button hover'],
  ['cocoa', 'sand', 'revealed seed, score badge'],
  ['cocoa', 'sky', 'okay badge'],
  ['cocoa', 'blush', '::selection text'],
  ['paper', 'danger-ink', 'critical badge'],
]

describe('the palette', () => {
  test('is parsed from the stylesheet, tokens intact', () => {
    for (const [name, colors] of PALETTES) {
      expect(Object.keys(colors).length).toBeGreaterThanOrEqual(11)
      for (const token of [
        'paper',
        'paper-deep',
        'cocoa',
        'cocoa-soft',
        'shell',
        'shell-dark',
        'mint',
        'sand',
        'danger',
        'danger-ink',
      ]) {
        expect(`${name}.${token}:${colors[token]}`).toMatch(
          /^(light|dark)\.[a-z-]+:#[0-9a-fA-F]{6}$/,
        )
      }
    }
  })

  test('the night palette mirrors the light one, token for token', () => {
    // A token added to one block and forgotten in the other would leave that
    // theme silently using the wrong colour — usually a light rectangle in
    // the middle of the dark game.
    const [light, dark] = PALETTES.map(
      ([, colors]) => Object.keys(colors).sort(),
    )
    expect(dark).toEqual(light)
    expect(light.length).toBeGreaterThanOrEqual(15)
  })

  test('every pair used for text clears WCAG AA (4.5:1)', () => {
    const failures: string[] = []
    for (const [name, colors] of PALETTES) {
      for (const [foreground, background, label] of TEXT_PAIRS) {
        const ratio = contrast(colors[foreground], colors[background])
        if (ratio < 4.5) {
          failures.push(
            `${name}: ${label} (${foreground} on ${background}) = ${ratio.toFixed(2)}`,
          )
        }
      }
    }
    expect(failures).toEqual([])
  })

  test('outlines carrying meaning clear 3:1, and text on fills stays at 4.5:1', () => {
    // `shell` is a background, not a line: it sits at 2.14:1 on paper, which is
    // fine precisely because everything drawn on top of it is cocoa (tested
    // above at 5.13:1) and because the warning bar also prints its value and
    // exposes it through aria-valuenow — colour is never the only signal.
    const failures: string[] = []
    const checks: [string, string, number][] = [
      ['danger', 'paper', 3],
      ['cocoa', 'paper', 3],
      ['cocoa', 'shell', 4.5],
    ]
    for (const [name, colors] of PALETTES) {
      for (const [foreground, background, minimum] of checks) {
        const ratio = contrast(colors[foreground], colors[background])
        if (ratio < minimum) {
          failures.push(
            `${name}: ${foreground} on ${background} needs ${minimum}, got ${ratio.toFixed(2)}`,
          )
        }
      }
    }
    expect(failures).toEqual([])
  })
})

describe('the components follow the palette rules', () => {
  async function sourceFiles(): Promise<string[]> {
    const files: string[] = []
    const glob = new Bun.Glob('**/*.{ts,tsx}')
    for await (const file of glob.scan({ cwd: 'src' })) {
      files.push(`src/${file}`)
    }
    return files
  }

  test('nothing draws text in shell-dark, which only reaches 3.23:1', async () => {
    const offenders: string[] = []
    for (const file of await sourceFiles()) {
      const text = await Bun.file(file).text()
      if (text.includes('text-shell-dark')) {
        offenders.push(file)
      }
    }
    expect(offenders).toEqual([])
  })

  test('red text always uses the ink variant, never the fill', async () => {
    const offenders: string[] = []
    for (const file of await sourceFiles()) {
      const text = await Bun.file(file).text()
      if (/(?<![-\w])text-danger(?!-)/.test(text)) {
        offenders.push(file)
      }
    }
    expect(offenders).toEqual([])
  })

  test('every button keeps the 44px touch target', async () => {
    const button = await Bun.file('src/components/ui/Button.tsx').text()
    expect(button).toContain('min-h-11')
  })

  test('reduced motion exists for the system and for the settings switch', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain("[data-motion='reduced']")
  })

  test('the night palette hangs off data-theme', () => {
    expect(css).toContain(":root[data-theme='dark']")
  })

  test('the theme reaches the page before the first paint', async () => {
    // A useEffect would apply the theme after the first paint, so a dark-mode
    // player would get a flash of light paper on every load. The initial
    // application therefore lives in main.tsx, before createRoot.
    const main = await Bun.file('src/main.tsx').text()
    expect(main).toContain('applyTheme(loadSettings().theme)')
    expect(main.indexOf('applyTheme(')).toBeLessThan(main.indexOf('createRoot('))
  })
})
