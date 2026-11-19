# 🐹 Peanut — Architecture

> Every little life has an ending. Make it count.

| Field        | Value                                            |
| ------------ | ------------------------------------------------ |
| Scope        | How the code in `src/` is organised and why      |
| Applies to   | v0.3.0 (M0 + M1 + M1.5 complete)                 |
| Last updated | 2026-11-18                                       |
| Related docs | [`roadmap/v1.md`](roadmap/v1.md) (decisions, §5) |

---

## 1. Overview

Peanut is a single-page React application with no router, no backend and no
state library. The whole game is one `GameState` object that a pure engine
transforms, and React only renders it.

The guiding rule comes from the roadmap (§5, ADR 1):

> **Engine decoupled from React.** Needs, clock, events and death live in
> `src/game/` as pure functions. React only renders state and dispatches
> actions. Changing hunger math must not touch five components.

Everything below follows from that sentence.

---

## 2. Layers

```
┌─────────────────────────────────────────────────────────────┐
│  src/types/game.ts        shared types (single source)      │
└─────────────────────────────────────────────────────────────┘
                ▲ imported by every layer
┌─────────────────────────────────────────────────────────────┐
│  src/game/                PURE — no React, no DOM, no I/O   │
│    rules.ts               createRun, updateNeeds,           │
│                           advanceRun, applyCareAction       │
│    config.ts              all balance numbers in one place  │
│    data/careActions.ts    the five care actions             │
│    skins.ts / easterEggs.ts  cosmetic registries            │
│    runSummary.ts          summary shown by the memorial     │
└─────────────────────────────────────────────────────────────┘
                ▲ called by
┌─────────────────────────────────────────────────────────────┐
│  src/hooks/useGameRun.ts  React binding: reducer + clock +  │
│                           save throttling                   │
│  src/services/            I/O boundary: localStorage        │
│    SaveService.ts         run save, validation, migration   │
│    SkinService.ts         unlocked skins                    │
└─────────────────────────────────────────────────────────────┘
                ▲ consumed by
┌─────────────────────────────────────────────────────────────┐
│  src/App.tsx              screen state machine              │
│  src/features/            one folder per screen             │
│  src/components/          presentational, prop-driven       │
└─────────────────────────────────────────────────────────────┘
```

**Dependency direction is one-way.** `src/game/` never imports from
`src/features/`, `src/components/` or `src/hooks/`. Only `src/types/` and
`src/game/data/` are shared downward. If you find yourself importing React
inside `src/game/`, the layering is broken.

---

## 3. Screen state machine

There is no router. `src/App.tsx` holds a `Screen` union and switches on it:

```
menu ──▶ naming ──▶ game ──▶ memorial ──▶ naming   (adopt another)
  ▲        ▲         │                        │
  └────────┴─────────┴────────────────────────┘   (main menu)
```

| Screen     | Component                             | Notes                                             |
| ---------- | ------------------------------------- | ------------------------------------------------- |
| `menu`     | `features/menu/MainMenu.tsx`          | Shows *Continue* only when a run exists           |
| `naming`   | `features/naming/NamingScreen.tsx`    | Validates input, picks a skin, warns when replacing |
| `game`     | `features/game/GameScreen.tsx`        | The live HUD                                      |
| `memorial` | `features/memorial/MemorialScreen.tsx`| Carries a `RunSummary`, not the live `GameState`  |

The union lives in `src/types/game.ts`. Because the game stays on one URL,
GitHub Pages never returns a 404 (roadmap §5, ADR 3).

`src/App.tsx` is also the only place that knows about **adoption side effects**
in order: secret skin unlock → skin override → accessory choice → `adopt()`.

---

## 4. The engine

Four pure functions in `src/game/rules.ts` do all the work:

| Function           | Responsibility                                                            |
| ------------------ | ------------------------------------------------------------------------- |
| `createRun`        | Builds a fresh `GameState` with full needs and zero cooldowns             |
| `updateNeeds`      | Decay, health coupling and clamping for `n` seconds                       |
| `advanceRun`       | Wraps `updateNeeds` plus cooldown ticking and the in-game clock           |
| `applyCareAction`  | Applies one care action if its cooldown allows it                         |

A fifth pure module, `src/game/death.ts`, exposes `evaluateDeath(state)`.
`advanceRun` calls it after every tick, so the engine is the only place that can
end a run — React never decides when Peanut dies.

Two rules are load-bearing and tests depend on them:

- **Zero is not instant death.** Needs clamp at `0` and raise a warning. Death
  only comes from `evaluateDeath`, after a warning has already been shown.
- **Cosmetics never touch rules.** Skins and name easter eggs only change
  rendering. `tests/skins.test.ts` exists largely to keep that true.

All balance numbers live in `src/game/config.ts` — decay rates, warning and
critical thresholds, health penalties, day length, offline caps. Nothing in the
codebase hardcodes a gameplay number.

---

## 5. The clock

Time is **derived from real elapsed time**, never accumulated from tick counts
(roadmap §5, ADR 7).

```
useGameRun
  └─ setInterval(1000)                    → dispatch tick
       └─ document.visibilityState check  → hidden tabs do not tick
            └─ elapsed = now - lastUpdatedAt
               seconds = min(elapsed, MAX_TICK_SECONDS = 5)
               advanceRun(state, seconds)
               lastUpdatedAt = now
```

Three constants protect the loop, all in `src/game/config.ts`:

| Constant              | Value   | Why it exists                                              |
| --------------------- | ------- | ---------------------------------------------------------- |
| `MAX_TICK_SECONDS`    | `5`     | A stalled main thread or throttled timer cannot jump ahead |
| `MAX_OFFLINE_SECONDS` | `600`   | Returning after hours is punishing, not instantly fatal    |
| `SECONDS_PER_DAY`     | `120`   | One in-game day every two real minutes                     |

Edge cases worth knowing before you touch this code:

- **While paused**, `lastUpdatedAt` is *not* advanced. `togglePause` resets it
  on resume, so pausing never burns game time.
- **Returning to the tab** dispatches a catch-up tick capped at
  `MAX_OFFLINE_SECONDS`, so a long absence applies at most 10 minutes of decay.
- **Ticks are capped, not queued.** If the browser throttles for 30 seconds,
  5 seconds are applied and the rest is dropped by design — better a slow game
  than a hamster that starves while you were in another tab.

---

## 6. React binding

`src/hooks/useGameRun.ts` exposes `{ run, adopt, care, togglePause, resetRun }`
and owns a `useReducer` with five action types: `adopt`, `tick`, `care`,
`togglePause`, `clear`.

| Effect                | Behaviour                                                                 |
| --------------------- | ------------------------------------------------------------------------- |
| Tick interval         | 1 s, only while `run !== null && !run.paused`                              |
| `visibilitychange`    | Visible → capped catch-up tick; hidden → save immediately                 |
| Autosave              | Every `SAVE_INTERVAL_MS` (5 s), and immediately after any player action   |
| `pagehide`            | Final save so closing the tab does not lose the run                        |

Player actions reset the save throttle to `0`, so the next state change writes
to `localStorage` straight away. This is why the save is throttled **by
coalescing**, not skipped: nothing is lost, bursts are just merged.

`initRun()` runs once on mount: it loads the save and applies capped offline
decay before React ever renders the menu.

---

## 7. Persistence

Two independent `localStorage` keys:

| Key               | Service               | Contents                                     |
| ----------------- | --------------------- | -------------------------------------------- |
| `peanut.run.v1`   | `services/SaveService.ts`   | The whole `GameState`                |
| `peanut.skins.v1` | `services/SkinService.ts`   | Unlocked cosmetic skin ids            |

The run key name says `v1`; the payload carries `schemaVersion: 3`. The key is
the *storage slot*, the version is *inside the payload* — they move at different
speeds on purpose.

**Saves are untrusted input.** They can be hand-edited, truncated, or written
by an older build, so `loadRun()` never trusts `JSON.parse` alone:

```
JSON.parse → migrateSave() → isGameState() → engine
                                │
                                └─ shape guard: schemaVersion, hamster,
                                   needs, stats, cooldowns, primitives
```

- `migrateSave()` upgrades older payloads **step by step** instead of discarding
  a run the player cares about: v1 → v2 adds cosmetic skins, v2 → v3 adds
  `death` (null while Peanut is alive). Each step writes its own version so the
  next one still matches.
- If validation fails, `loadRun()` returns `null` — the game starts clean rather
  than crashing on a corrupted object.
- Both services swallow `localStorage` errors: private mode or a full quota must
  not stop the game from running.

---

## 8. Rendering

No canvas engine. Pixel art is SVG built from data:

- `components/hamster/skinSprites.ts` holds each skin as a **16×16 character grid**
  plus a palette (`SKIN_SPRITES`).
- `components/hamster/SkinSprite.tsx` turns that grid into one `<rect>` per cell
  inside an `<svg viewBox="0 0 16 16" shapeRendering="crispEdges">`, so the art
  stays sharp at any integer scale with **zero bitmap assets**.
- `components/room/HamsterRoom.tsx` composes the cage from absolutely positioned
  Tailwind boxes — pure presentational, every visual cue is a prop
  (`paused`, `vanished`, `serverDecor`).

Theme tokens (`@theme` in `src/index.css`) define the palette, the two pixel
fonts and the `pixel-frame` utilities used by every panel. Animations live in
the same file and are disabled under `prefers-reduced-motion`.

A test validates every sprite grid, so a typo in the 16×16 art fails CI instead
of rendering a hole.

---

## 9. File map

Lines counted at the M2 death system (2026-11-18): **3 433 total** — 2 864 in
`src/`, 569 in `tests/`.

| Path                                | Lines | Responsibility                                  |
| ----------------------------------- | ----- | ----------------------------------------------- |
| `src/main.tsx`                      | 10    | React entry point                               |
| `src/App.tsx`                       | 108   | Screen state machine, adoption side effects, memorial routing |
| `src/types/game.ts`                 | 122   | Every shared type, including `DeathRecord`      |
| `src/game/config.ts`                | 60    | All balance numbers                             |
| `src/game/rules.ts`                 | 242   | Pure engine: decay, health, actions, clock, age warning |
| `src/game/death.ts`                 | 82    | The only place a run can end, and the record it writes |
| `src/game/data/careActions.ts`      | 61    | The five care action definitions                |
| `src/game/data/deathCauses.ts`      | 88    | The six causes of death and their epitaphs      |
| `src/game/skins.ts`                 | 185   | Skin registry and secret-name lookup            |
| `src/game/easterEggs.ts`            | 44    | Name easter eggs and display names              |
| `src/game/runSummary.ts`            | 21    | Memorial data built from the `DeathRecord`      |
| `src/hooks/useGameRun.ts`           | 191   | Reducer, clock effects, save throttling, death save |
| `src/services/SaveService.ts`       | 186   | Run persistence, validation, v1→v2→v3 migration |
| `src/services/SkinService.ts`       | 43    | Skin unlock persistence                          |
| `src/features/menu/MainMenu.tsx`    | 79    | Menu screen                                      |
| `src/features/naming/NamingScreen.tsx` | 188 | Adoption form and skin picker                  |
| `src/features/game/GameScreen.tsx`  | 220   | Live HUD, critical and age warnings              |
| `src/features/memorial/MemorialScreen.tsx` | 72 | Memorial screen from a `RunSummary`         |
| `src/components/ui/Screen.tsx`      | 13    | Full-screen layout wrapper                      |
| `src/components/ui/Button.tsx`      | 33    | Shared button variants                          |
| `src/components/ui/NeedBar.tsx`     | 48    | Single need bar with warning states             |
| `src/components/room/HamsterRoom.tsx` | 77  | Cage scene                                       |
| `src/components/hamster/SkinSprite.tsx` | 64 | Grid → SVG renderer                            |
| `src/components/hamster/skinSprites.ts` | 526 | 21 × 16×16 sprite grids                    |
| `src/index.css`                     | 101   | Theme tokens, frames, animations                |
| `tests/rules.test.ts`               | 180   | Engine and save validation                      |
| `tests/skins.test.ts`               | 114   | Skins, easter eggs, migration                   |
| `tests/death.test.ts`               | 275   | Causes, record immutability, warnings           |

---

## 10. Invariants

Anything that breaks one of these is a regression, whatever the feature:

1. **The engine stays pure.** No `window`, no `document`, no React inside
   `src/game/`. Tests depend on it.
2. **Zero never kills instantly.** A need at `0` raises a warning; only
   `evaluateDeath` ends a run, and only after a warning has been shown.
3. **Cosmetics never change rules.** Needs, cooldowns and health are identical
   for every skin and name.
4. **Saves are untrusted.** Anything read from `localStorage` goes through
   `isGameState()` before the engine touches it.
5. **The clock never jumps.** Every path that advances time passes through
   `MAX_TICK_SECONDS` or `MAX_OFFLINE_SECONDS`.

---

## 11. Not implemented yet

Documented here so this guide does not pretend features exist. See
[`roadmap/v1.md`](roadmap/v1.md) §3 for the milestones.

| Planned              | Milestone | Expected impact on this document                    |
| -------------------- | --------- | --------------------------------------------------- |
| Random events        | M2        | Weighted scheduler in `src/game/` plus an event modal in the HUD |
| Persistent cemetery  | M2        | A second storage key holding the history of past hamsters |
| Minigames (3 + Nap)  | M3        | New `src/features/minigames/` layer, clock paused while playing |
| Audio                | M4        | New `src/services/AudioService.ts` (Web Audio API)  |

When any of these lands, **this document must be updated in the same PR** —
that is part of the Definition of Done
([`roadmap/v1.md`](roadmap/v1.md) §8).
