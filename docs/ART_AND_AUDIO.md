# 🐹 Peanut — Art and audio

> Every little life has an ending. Make it count.

| Field        | Value                                                    |
| ------------ | -------------------------------------------------------- |
| Scope        | How the look of the game is built, and the plan for sound |
| Applies to   | v1.0.0 (M0–M4 complete)                         |
| Last updated | 2026-11-18                                               |
| Status       | **Art: implemented. Audio: not implemented (M4).**        |
| Related docs | [`ARCHITECTURE.md`](ARCHITECTURE.md) §8 · [`skins.md`](skins.md) |

---

## 1. Scope

Peanut has **zero bitmap assets**. Everything on screen is SVG generated from
data, or CSS boxes. There is exactly one image file in the project:
`public/favicon.svg`.

There is **no sound yet**. §10 documents the plan so nobody hunts for an audio
setting that does not exist.

---

## 2. Art direction

From the README: 2D pixel art · cute and colourful · minimalist UI ·
retro-inspired · comedic.

How those translate into code:

| Direction            | Implementation                                              |
| -------------------- | ----------------------------------------------------------- |
| Pixel art            | 16×16 character grids rendered as SVG rects, `crispEdges`    |
| Cute and colourful   | Warm pastel palette with a single dark ink colour            |
| Minimalist UI        | Two frame sizes, one border style, no gradients              |
| Retro-inspired       | Bitmap pixel fonts, `steps()` animations, hard drop shadows   |
| Comedic              | Skin jokes, room props and easter-egg decorations             |

---

## 3. Palette

Defined once as Tailwind v4 `@theme` tokens in `src/index.css`.

| Token | Hex | Role |
| ----- | --- | ---- |
| `--color-paper` | `#fff6e5` | Panel background, sprite canvas |
| `--color-paper-deep` | `#f6e7c9` | Page background, input background |
| `--color-sand` | `#efd9b4` | Selected skin tile |
| `--color-shell` | `#d9a05b` | Cage floor, warning state, *Worried* badge |
| `--color-shell-dark` | `#b97d3d` | Warning text, dark accents |
| `--color-cocoa` | `#4a3228` | **The ink** — borders, shadows, body text |
| `--color-cocoa-soft` | `#7a5b4a` | Secondary text |
| `--color-blush` | `#f2a7a0` | Text selection, food bowl |
| `--color-mint` | `#9ed9c4` | *Happy* badge, sprite highlights |
| `--color-sky` | `#a9c9e8` | Water bottle, *Doing okay* badge |
| `--color-danger` | `#d9534f` | *Critical* badge, alerts, error text |

Rules that keep the look coherent:

- **Every border, shadow and outline is `--color-cocoa`.** No element uses a
  different outline colour.
- Sprites declare their **own** hex colours in their palette and are not bound
  to the theme tokens — they only *happen* to match.
- Status colours carry meaning: `mint` ok → `shell` warning → `danger`
  critical. The same three appear in need bars, badges and alerts.

---

## 4. Typography

| Token | Family | Used for |
| ----- | ------ | -------- |
| `--font-pixel` | **Press Start 2P** | Titles, labels, buttons, badges |
| `--font-body` | **VT323** | Body copy |

Both are loaded from Google Fonts in `index.html` with `preconnect` and
`display=swap`; the CSS stacks fall back to `ui-monospace, monospace`.

> **Known trade-off:** fonts are a *network* dependency. If Google Fonts is
> unreachable, the game renders in monospace. Nothing breaks — but the pixel
> identity is lost. Self-hosting the two files would remove this dependency.

Uppercase micro-labels use `font-pixel` at `7–10px` with wide tracking, which is
the recurring typographic motif across every screen.

---

## 5. Frames, grid and focus

| Utility        | Definition                                | Used for           |
| -------------- | ----------------------------------------- | ------------------ |
| `.pixel-frame`    | 4px border + 6px hard shadow, `cocoa`  | Panels, room, cards |
| `.pixel-frame-sm` | 3px border + 4px hard shadow           | Buttons, sub-panels |
| `.pixel-grid`     | 16px line grid at 6% cocoa opacity     | Page and cage backdrop |

Buttons add a **press effect**: `active:translate-x/y` of 2px with the shadow
removed, so the button physically pushes in.

`:focus-visible` draws a **3px dashed cocoa outline** with a 3px offset — every
interactive element gets it for free from the base layer.

---

## 6. Animation

| Name | Timing | Effect |
| ---- | ------ | ------ |
| `hamster-idle` | 2.4s, `steps(2, end)`, infinite | Hops 3px up and back |

`steps()` is deliberate: smooth easing would break the pixel look.

- The idle animation is applied **conditionally** — it stops while the game is
  paused or the hamster has vanished (`HamsterRoom` decides), and `play` poses
  borrow it so a running hamster visibly runs.
- The **`blink` keyframes were removed**: they faded the whole sprite, which
  reads as a flicker bug rather than a blink, and no component ever used them.
  A convincing blink needs closed-eye frames — a sprite job, not a CSS one.
- Both switches turn motion off: `@media (prefers-reduced-motion: reduce)` for
  the operating system, and `:root[data-motion='reduced']` for the Settings
  toggle.

---

## 7. Sprites

Each skin is data, not an asset:

```ts
interface SkinSpriteData {
  palette: Record<string, string>   // char → hex
  rows: readonly string[]           // exactly 16 strings of 16 chars
}
```

- `.` is transparent; every other character maps through the palette.
- `SkinSprite.tsx` emits one `<rect>` per non-transparent cell inside an
  `<svg viewBox="0 0 16 16" shapeRendering="crispEdges">`, so it stays sharp at
  any **integer** scale with no image files.
- A soft ground shadow is a single `<ellipse>` under the grid.
- The `crown` accessory is a separate `<g>` drawn only when requested.

### Structure of `skinSprites.ts` (787 lines)

| Group | Entries | Contents |
| ----- | ------- | -------- |
| `ANIMAL_SPRITES` | 12 | Non-secret skins |
| `SECRET_SPRITES` | 9 | Secret-name skins |
| `GAME_SPRITES` | 8 | Video game culture skins (M5) |
| `HAMSTER_STATE_SPRITES` | 2 | The classic hamster's `eat` and `sleep` poses |
| **Total** | **29 + 2** | One per `SkinId`, plus two poses |

**Rows are shared.** `HAMSTER_ROWS` backs more than one skin by swapping the
palette, and `CHICK_ROWS` backs four chick variants. Editing one row changes
every skin that reuses it.

### The test is the guarantee

`SKIN_SPRITES` is exported with `as Record<SkinId, SkinSpriteData>`. A cast does
**not** verify that every key is present (verified against TypeScript 6 — a
partial object casts cleanly). So coverage does not come from the compiler:

> `tests/skins.test.ts` iterates `SKIN_LIST` and fails if any skin has no
> sprite, a row that is not 16 chars, or an unknown palette character.

Add a skin without its sprite and CI goes red.

### Poses: five states, two new grids

| State | How it is drawn | Where you see it |
| ----- | --------------- | ----------------- |
| `idle` | The base grid | The room, the menu, adoption |
| `eat` | Its own grid — cheeks full, a crumb on the floor | The room when hunger is 90 or above |
| `sleep` | Its own grid — one eye row instead of two | Nap Time, with `z z z` |
| `play` | The base grid plus the hop animation | The maze token |
| `dead` | The base grid rotated 180° inside a `<g>`, shadow left in place | The memorial |

`spriteFor(skinId, state)` decides, and it only lends poses to the **classic
hamster**: a crab sleeping would need its own grid, so every other skin simply
keeps its art. `tests/sprites.test.ts` checks the grids, the shared palette and
that no pose is ever given to another skin.

---

## 8. The room

`HamsterRoom.tsx` composes the cage from absolutely positioned Tailwind boxes —
water bottle, floor, bedding, food bowl, the wheel, and the hamster on top. No
image, no canvas.

| Prop | Effect |
| ---- | ------ |
| `hamsterName` | Used only for `aria-label` |
| `skinId` / `accessoryId` | Which sprite to draw |
| `state` | Which pose: `idle`, `eat`, `sleep`, `play`, `dead` |
| `paused` | Stops the idle animation |
| `vanished` | Fades the hamster out (the `404` easter egg) |
| `serverDecor` | Swaps the wheel for a three-rack server with LEDs (the `localhost` egg) — the two share the same corner |

The container is `role="img"` with a readable label, so screen readers announce
*"Peanut's cage"* rather than a pile of anonymous `div`s.

---

## 9. Asset inventory

| Asset | Type | Path |
| ----- | ---- | ---- |
| Favicon | Hand-written SVG, 16×16, `crispEdges` | `public/favicon.svg` |
| 29 skin sprites + 2 poses | Data → SVG at runtime | `src/components/hamster/skinSprites.ts` |
| Cage, wheel and bedding | CSS boxes | `src/components/room/HamsterRoom.tsx` |
| Frames, grid, motion | CSS | `src/index.css` |
| **Bitmap images** | **none** | — |
| **Audio files** | **none** | — |

---

## 10. Audio

Shipped, and **generated rather than loaded**: eight synthesised effects and an
ambient pad, with no audio file anywhere in the repository.

| Moment | Sound |
| ------ | ----- |
| Feeding, watering, cleaning, playing, napping | One distinct blip per action |
| An event arrives | A two-note chime |
| A critical warning | A short buzz |
| Death | A long descending tone, once |

- `src/services/AudioService.ts` uses the **Web Audio API**: one oscillator per
  effect, shaped by an envelope, driven by a patch table the tests read.
- The context is created **after the first gesture**, which browsers require.
- The ambient pad — two low oscillators with a slow tremolo — stops when the tab
  is hidden and returns when it is not.
- **Mute and volume live in Settings** and apply immediately; mute wins.
- The engine never imports the service: sound is triggered from the interface,
  so every test still runs in silence.

---

## 11. Not implemented yet

| Planned | Milestone | Notes |
| ------- | --------- | ----- |
| Authored room background | M4 | The cage is CSS boxes on purpose (ADR 6); replacing it needs real art |
| State poses for the other 28 skins | M5 | Only the classic hamster has its own grids |
| Photos in the credits | M4 | Initials stand in until the team sends theirs |
