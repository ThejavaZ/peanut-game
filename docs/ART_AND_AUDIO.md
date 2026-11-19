# 🐹 Peanut — Art and audio

> Every little life has an ending. Make it count.

| Field        | Value                                                    |
| ------------ | -------------------------------------------------------- |
| Scope        | How the look of the game is built, and the plan for sound |
| Applies to   | v0.3.0 (M0 + M1 + M1.5 complete)                         |
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
| `blink` | 5s, `steps(1, end)`, infinite | Drops opacity to `0.2` for 3 frames |

`steps()` is deliberate: smooth easing would break the pixel look.

- The idle animation is applied **conditionally** — it stops while the game is
  paused or the hamster has vanished (`HamsterRoom` decides).
- `blink` is **defined but not referenced by any component yet** (see §11).
- Both are switched off under `@media (prefers-reduced-motion: reduce)`.

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

### Structure of `skinSprites.ts` (526 lines)

| Group | Entries | Contents |
| ----- | ------- | -------- |
| `ANIMAL_SPRITES` | 12 | Non-secret skins |
| `SECRET_SPRITES` | 9 | Secret-name skins |
| **Total** | **21** | One per `SkinId` |

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

---

## 8. The room

`HamsterRoom.tsx` composes the cage from absolutely positioned Tailwind boxes —
water bottle, floor, food bowl, and the hamster on top. No image, no canvas.

| Prop | Effect |
| ---- | ------ |
| `hamsterName` | Used only for `aria-label` |
| `skinId` / `accessoryId` | Which sprite to draw |
| `paused` | Stops the idle animation |
| `vanished` | Fades the hamster out (the `404` easter egg) |
| `serverDecor` | Adds a three-rack server with LEDs (the `localhost` egg) |

The container is `role="img"` with a readable label, so screen readers announce
*"Peanut's cage"* rather than a pile of anonymous `div`s.

---

## 9. Asset inventory

| Asset | Type | Path |
| ----- | ---- | ---- |
| Favicon | Hand-written SVG, 16×16, `crispEdges` | `public/favicon.svg` |
| 21 skin sprites | Data → SVG at runtime | `src/components/hamster/skinSprites.ts` |
| Cage and props | CSS boxes | `src/components/room/HamsterRoom.tsx` |
| Frames, grid, motion | CSS | `src/index.css` |
| **Bitmap images** | **none** | — |
| **Audio files** | **none** | — |

---

## 10. Audio (planned — M4)

Nothing is implemented. The roadmap's plan:

- `src/services/AudioService.ts` using the **Web Audio API**.
- **Synthesised SFX first** (no asset files in the first build): feed, water,
  clean, play, nap, warning, death.
- Optional ambient music loop — quiet and adorable.
- Mute and volume persisted with the rest of the settings.
- Optional files only after synthesis proves insufficient.

Because it will live in `src/services/`, audio inherits the same rule as
persistence: the pure engine in `src/game/` must never import it.

---

## 11. Not implemented yet

| Planned | Milestone | Notes |
| ------- | --------- | ----- |
| State sprites (idle, eat, sleep, play, dead) | M4 | Currently one pose per skin |
| Room background art | M4 | Replaces CSS boxes with authored art |
| `blink` wiring | M4 | The keyframes exist, no component uses them |
| Audio: SFX, music, settings | M4 | §10 |
| Responsive and reduced-motion audit | M4 | Reduced motion is done; full audit pending |
