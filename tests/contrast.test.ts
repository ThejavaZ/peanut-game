import { describe, expect, test } from 'bun:test'

/**
 * The accessibility gate for the palette: ratios are computed from
 * `src/index.css` itself, so editing a colour in the stylesheet — not in this
 * file — is what can break these tests.
 */

const css = await Bun.file('src/index.css').text()

function palette(): Record<string, string> {
  const colors: Record<string, string> = {}
  for (const match of css.matchAll(
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

const colors = palette()

describe('the palette', () => {
  test('is parsed from the stylesheet, tokens intact', () => {
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
      expect(colors[token]).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  test('every pair used for text clears WCAG AA (4.5:1)', () => {
    const textPairs: [string, string, string][] = [
      ['cocoa', 'paper', 'body text'],
      ['cocoa', 'paper-deep', 'text on panels'],
      ['cocoa-soft', 'paper', 'secondary text'],
      ['cocoa-soft', 'paper-deep', 'badges and epitaphs'],
      ['danger-ink', 'paper', 'critical alert'],
      ['danger-ink', 'paper-deep', 'danger zone labels'],
      ['cocoa', 'mint', 'happy badge, maze exit'],
      ['cocoa', 'shell', 'worried badge'],
      ['cocoa', 'sand', 'revealed seed, credit initials'],
    ]

    for (const [foreground, background] of textPairs) {
      const ratio = contrast(colors[foreground], colors[background])
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('outlines carrying meaning clear 3:1, and text on fills stays at 4.5:1', () => {
    // `shell` is a background, not a line: it sits at 2.14:1 on paper, which is
    // fine precisely because everything drawn on top of it is cocoa (tested
    // above at 5.13:1) and because the warning bar also prints its value and
    // exposes it through aria-valuenow — colour is never the only signal.
    expect(contrast(colors.danger, colors.paper)).toBeGreaterThanOrEqual(3)
    expect(contrast(colors.cocoa, colors.paper)).toBeGreaterThanOrEqual(3)
    expect(contrast(colors.cocoa, colors.shell)).toBeGreaterThanOrEqual(4.5)
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
})
