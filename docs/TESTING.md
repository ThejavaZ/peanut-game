# 🐹 Peanut — Beta test report

| Field | Value |
| ----- | ----- |
| Applies to | v0.3.0 beta, `main` at the M3 milestone |
| Last updated | 2026-11-20 |
| Suite | 148 tests across 9 files, `bun test` |
| Related | [`DEVELOPMENT.md`](DEVELOPMENT.md) §6 · [`ARCHITECTURE.md`](ARCHITECTURE.md) |

---

## 1. Strategy

Every rule of the game is a **pure function**, so the suite runs with `bun test`
and no browser: no DOM, no `localStorage`, no timers waiting on wall-clock time.
That is a deliberate consequence of the architecture — if a rule needed a
component to be tested, it would live in the wrong place.

What this buys:

- The whole suite finishes in **well under a second**.
- Failures are localised: a broken rule points at a file, not at a screen.
- The same command runs locally and inside CI, so a green laptop means a green
  pipeline.

Commands:

```bash
bun run test          # the suite
bun run test tests/maze.test.ts   # a single file
bun run lint          # style, also enforced by CI
bun run build         # types + production build, also enforced by CI
```

---

## 2. Results

| File | Tests | Covers |
| ---- | ----- | ------ |
| `tests/events.test.ts` | 35 | Minimum interval, once-per-run flags, conditions (needs, day and stats), weights, choices, the frozen clock, save validation and migration |
| `tests/death.test.ts` | 22 | Cause priority, dominant cause, ties → systemic, the wheel accident, old age, record immutability, prior warnings, migration |
| `tests/rules.test.ts` | 17 | Decay, health coupling, cooldowns, clock, alert helpers, save validation |
| `tests/maze.test.ts` | 16 | Grid shape, **collisions** (wall, edge, exit), **solvability by breadth-first search**, reward, the 60 s gap, schema v6 |
| `tests/score.test.ts` | 15 | The Act 1 formula (worked example = 1,505), penalties, purity, schema v5 |
| `tests/minigames.test.ts` | 13 | Reward contract, clamps, clock advance, frozen clock, registry |
| `tests/wheel.test.ts` | 11 | Angle wrap-around, three scoring bands, happiness cap, registry |
| `tests/cemetery.test.ts` | 10 | Grave validation, cap of 50, newest-first order, duplicates, freezing |
| `tests/skins.test.ts` | 9 | 16×16 sprite grids, secret triggers, save migration |
| **Total** | **148** | |

**Gates on every pull request** (`.github/workflows/ci.yml`):

| Gate | Tool | Status |
| ---- | ---- | ------ |
| Style | `bun run lint` (ESLint 10) | ✅ clean |
| Types | `tsc -b` (TypeScript 6, strict by default) | ✅ clean |
| Behaviour | `bun test` | ✅ 148 / 148 |
| Build | `vite build` | ✅ passes |

The deploy workflow (`.github/workflows/deploy.yml`) repeats the same gates
**before** uploading the Pages artifact, so a red build cannot be published.

---

## 3. Representative cases

| # | Case | Expected | Actual |
| - | ---- | -------- | ------ |
| 1 | Simulate 20 minutes of total neglect | Dies within the limit, with a recorded cause | ✅ dies at ~14 min, `systemic` |
| 2 | Empty health with every need comfortable | Blamed on an accident, not neglect | ✅ `wheel-accident` |
| 3 | Same state but fewer than 5 play sessions | Not blamed on the wheel | ✅ systemic |
| 4 | Event with a false condition | Never fires | ✅ no interruption |
| 5 | Ten minutes of play with the RNG fixed | At least one event appears | ✅ deterministic in CI |
| 6 | Tick while suspended inside a minigame | No decay applied | ✅ identical state reference |
| 7 | A v2 save opened by the current build | Migrates without losing the run | ✅ reaches `schemaVersion` 6 |
| 8 | Attempt to mutate a death record | Throws | ✅ `Object.freeze` active |
| 9 | Sixty graves stored | The 50 newest survive | ✅ cap respected |
| 10 | Worked example from Act 1 §10 | 1,505 points | ✅ exactly 1,505 |
| 11 | Three perfect swings on the wheel | Would earn 36, must pay 25 | ✅ cap applied |
| 12 | Step into a wall or off the grid | Position does not change | ✅ identical reference |
| 13 | Solve the maze with breadth-first search | A solution of exactly 8 steps exists | ✅ 8 steps |
| 14 | Three minigames back to back | Hunger, thirst and hygiene cannot rise | ✅ they only fall |
| 15 | A rich life vs. a poor life under the same neglect | Same cause of death | ✅ identical (the score does not decide) |

---

## 4. Defects found and fixed

These were caught by the suite or in review **before** delivery:

1. **A migration that would have wiped runs.** An intermediate step wrote the
   current schema number instead of its own, which would have skipped a stage
   and produced an invalid save. Fixed, and written down as a rule in
   `ARCHITECTURE.md`.
2. **The same error tried to happen twice more.** When schemas v5 and v6 were
   added, the earlier steps again referenced the moving constant. Both were
   caught in review and pinned to literals before merging.
3. **Tab catch-up with the modal open.** Returning to the tab applied up to ten
   minutes of decay while an event was still unanswered. Fixed with a suspension
   flag in the reducer, plus its test.
4. **A hanging suite.** Turning events on froze a loop that (correctly) could
   not advance time with a pending event. The simulation now answers like a
   player, and carries an iteration guard: a future failure must be an error,
   never a hang.
5. **A test that proved nothing.** An assertion hid the real state behind a
   cast. It was rewritten to assert the behaviour it claimed to cover.

---

## 5. What is *not* covered, and why

| Not covered | Why |
| ----------- | --- |
| React components and screens | No DOM harness is installed (no `jsdom`/`happy-dom`), by choice: components are thin wrappers over tested logic. Adding one would be a new dependency with a reason recorded in the PR |
| Real time, `visibilitychange`, `requestAnimationFrame` | They depend on the browser clock. The *decisions* they trigger are pure and tested; the wiring is exercised manually before each release |
| `localStorage` itself | The services are tested through their pure halves (validation, migration, ordering, caps). Storage failures are swallowed by design so the game keeps running |
| Visual rendering, layout, colours | Verified by the screenshots in the release portfolio, not by assertions |
| Audio | Not implemented yet (M4) |
| The maze's *feel* (difficulty, pacing) | Subjective; covered by the balance pass in issue #22 |

**Known gap:** there is no end-to-end test driving the browser from adoption to
memorial. The release checklist in `docs/roadmap/v1.md` covers that manually:
play start to memorial with no console errors.

---

## 6. Keeping this report honest

This file must be refreshed whenever the suite changes — that is part of the
Definition of Done (`roadmap/v1.md` §8). The table in §2 must always match what
`bun run test` prints, and every new rule deserves a test before it reaches
`main`.
