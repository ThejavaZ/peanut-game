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
  ├────────┴─────────┴────────────────────────┘   (main menu)
  └──▶ cemetery ──▶ menu                          (read-only)

game ──▶ minigame ──▶ game                        (exit or reward)
```

| Screen     | Component                             | Notes                                             |
| ---------- | ------------------------------------- | ------------------------------------------------- |
| `menu`     | `features/menu/MainMenu.tsx`          | Shows *Continue* only when a run exists, plus the cemetery count |
| `naming`   | `features/naming/NamingScreen.tsx`    | Validates input, picks a skin, warns when replacing |
| `game`     | `features/game/GameScreen.tsx`        | The live HUD, hosts the event modal and the minigame panel |
| `memorial` | `features/memorial/MemorialScreen.tsx`| Carries a `RunSummary`, not the live `GameState`  |
| `cemetery` | `features/cemetery/CemeteryScreen.tsx`| Read-only list of every grave                     |
| `minigame` | `features/minigames/MinigameScreen.tsx`| Shell: frozen clock, reward preview, always-on skip |

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

A sixth, `src/game/events.ts`, owns scheduling. It only **queues**: it selects
eligible events and stores one as `state.events.pending`, never touching needs.
Answering it is `applyEventChoice` in `rules.ts`. That split is deliberate —
`events.ts` imports only `config` and `data`, so there is no cycle back through
the rules.

**Events are live** (`EVENTS_ENABLED = true`). The scheduler queues at most one
event; `src/components/events/EventModal.tsx` renders it; `applyEventChoice`
resolves it. A queued event freezes three things at once — `advanceRun`, the
reducer's tick and the hook's `isRunning` — so reading a dialog can never cost
the hamster any time.

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
- **While a minigame owns the screen**, ticks carry a `suspended` flag that the
  reducer drops, and the way out dispatches `refreshClock` — so the time spent
  playing is never billed as decay either.
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

Three independent `localStorage` keys:

| Key                  | Service                      | Contents                                     |
| -------------------- | ---------------------------- | -------------------------------------------- |
| `peanut.run.v1`      | `services/SaveService.ts`    | The whole `GameState`                         |
| `peanut.skins.v1`    | `services/SkinService.ts`    | Unlocked cosmetic skin ids                    |
| `peanut.cemetery.v1` | `services/CemeteryService.ts`| Every grave: `{ schemaVersion: 1, entries[] }` |

The cemetery is deliberately **its own key**: clearing the run (`clearRun()`)
cannot touch it, which is what lets *Adopt another* start over without erasing
the hamsters that already died. It is capped at `CEMETERY_MAX_ENTRIES` graves,
newest first, so a long-lived save cannot fill the storage quota.

The run key name says `v1`; the payload carries `schemaVersion: 5`. The key is
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
  `death` (null while Peanut is alive), v3 → v4 adds the event scheduler,
  v4 → v5 adds the score counters. Each step writes **its own** version — never
  `SAVE_SCHEMA_VERSION` — so the next step in the chain still matches. Using the
  constant inside an early step would silently skip the rest.
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

Lines counted at the score (2026-11-19): **6 047 total** — 4 334 in `src/`,
1 713 in `tests/`.

| Path                                | Lines | Responsibility                                  |
| ----------------------------------- | ----- | ----------------------------------------------- |
| `src/main.tsx`                      | 10    | React entry point                               |
| `src/App.tsx`                       | 150   | Screen state machine, adoption side effects, minigame suspension |
| `src/types/game.ts`                 | 216   | Every shared type: `DeathRecord`, `GameEvent`, score counters |
| `src/game/config.ts`                | 105   | All balance numbers, including the score rules  |
| `src/game/rules.ts`                 | 320   | Pure engine: decay, health, actions, clock, critical-time tracking |
| `src/game/events.ts`                | 140   | Scheduler: eligibility, weighted pick, queueing  |
| `src/game/death.ts`                 | 97    | The only place a run can end, and the record it writes |
| `src/game/score.ts`                 | 40    | Score from Act 1 §10: pure, never affects survival |
| `src/game/minigames.ts`             | 86    | Reward contract: apply once, preview, advance   |
| `src/game/data/careActions.ts`      | 61    | The five care action definitions                |
| `src/game/data/deathCauses.ts`      | 98    | The seven causes of death and their epitaphs    |
| `src/game/data/events.ts`           | 228   | The nine events: conditions, weights, choices    |
| `src/game/data/minigames.ts`        | 36    | Minigame registry and their rewards             |
| `src/game/skins.ts`                 | 185   | Skin registry and secret-name lookup            |
| `src/game/easterEggs.ts`            | 44    | Name easter eggs and display names              |
| `src/game/runSummary.ts`            | 24    | Memorial data built from the `DeathRecord`      |
| `src/hooks/useGameRun.ts`           | 285   | Reducer, clock effects, saves, suspension       |
| `src/services/CemeteryService.ts`   | 115   | Graves: validation, cap, append, score          |
| `src/services/SaveService.ts`       | 358   | Run persistence, validation, v1→v2→v3→v4→v5 migration |
| `src/services/SkinService.ts`       | 43    | Skin unlock persistence                          |
| `src/features/menu/MainMenu.tsx`    | 88    | Menu screen with the cemetery entry point        |
| `src/features/cemetery/CemeteryScreen.tsx` | 75 | Read-only list of every grave               |
| `src/features/minigames/MinigameScreen.tsx` | 53 | The shell every minigame runs inside       |
| `src/features/naming/NamingScreen.tsx` | 188 | Adoption form and skin picker                  |
| `src/features/game/GameScreen.tsx`  | 272   | Live HUD with score, warnings, modal, minigames  |
| `src/features/memorial/MemorialScreen.tsx` | 76 | Final score beside days, meals and cause |
| `src/components/events/EventModal.tsx` | 79 | The modal: presentation only, no state           |
| `src/components/ui/Screen.tsx`      | 13    | Full-screen layout wrapper                      |
| `src/components/ui/Button.tsx`      | 33    | Shared button variants                          |
| `src/components/ui/NeedBar.tsx`     | 48    | Single need bar with warning states             |
| `src/components/room/HamsterRoom.tsx` | 77  | Cage scene                                       |
| `src/components/hamster/SkinSprite.tsx` | 64 | Grid → SVG renderer                            |
| `src/components/hamster/skinSprites.ts` | 526 | 21 × 16×16 sprite grids                    |
| `src/index.css`                     | 101   | Theme tokens, frames, animations                |
| `tests/rules.test.ts`               | 184   | Engine and save validation                      |
| `tests/skins.test.ts`               | 114   | Skins, easter eggs, migration                   |
| `tests/death.test.ts`               | 345   | Causes, record immutability, warnings           |
| `tests/events.test.ts`              | 527   | Interval, once-per-run, conditions, weights     |
| `tests/cemetery.test.ts`            | 132   | Grave validation, cap, duplicates               |
| `tests/minigames.test.ts`           | 193   | Reward contract, frozen clock, registry         |
| `tests/score.test.ts`               | 218   | The Act 1 formula, penalties, schema v5         |

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
| Wheel, seeds and maze | M3      | They reuse the shell in `src/features/minigames/` and the same reward contract |
| Audio                | M4        | New `src/services/AudioService.ts` (Web Audio API)  |

When any of these lands, **this document must be updated in the same PR** —
that is part of the Definition of Done
([`roadmap/v1.md`](roadmap/v1.md) §8).
