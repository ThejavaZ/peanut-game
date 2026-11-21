# 🐹 Peanut — Development guide

> Every little life has an ending. Make it count.

| Field          | Value                                                 |
| -------------- | ----------------------------------------------------- |
| Scope          | How to set up, work on and ship Peanut                |
| Applies to     | v0.9.0 (M0–M3 complete)                      |
| Last updated   | 2026-11-18                                            |
| Related docs   | [`roadmap/v1.md`](roadmap/v1.md) §8 · [`ARCHITECTURE.md`](ARCHITECTURE.md) |

---

## 1. Requirements

| Tool | Version | Notes |
| ---- | ------- | ----- |
| [Bun](https://bun.sh) | 1.4.4 in local dev; CI uses `latest` | Package manager, test runner and runtime |
| Browser | Any modern one | No backend, no accounts |

Node.js is **not** required. There is no `engines` field and no `.nvmrc` — Bun
does everything.

---

## 2. Getting started

```bash
bun install          # install dependencies (respects bun.lock)
bun run dev          # start Vite on http://localhost:5173/
bun run test         # run the engine and sprite tests
bun run lint         # ESLint over the whole repo
bun run build        # tsc -b (type-check) + vite build → dist/
bun run preview      # serve the production build locally
```

| Command | What it actually does | When it fails |
| ------- | --------------------- | ------------- |
| `bun run dev` | Vite dev server, base path `/` | — |
| `bun run test` | `bun test` over `tests/` | A wrong rule, a broken sprite grid |
| `bun run lint` | ESLint 10 flat config on `**/*.{ts,tsx}` | Unused code, bad hooks usage |
| `bun run build` | `tsc -b && vite build`, base path `/peanut-game/` | Type errors, build errors |
| `bun run preview` | Serves `dist/` | — |

Run **all three** (`test`, `lint`, `build`) before you commit. That is exactly
what CI runs, so a green local run means a green pipeline.

---

## 3. Project structure

```
src/
├── main.tsx            React entry point
├── App.tsx             screen state machine + adoption side effects
├── index.css           theme tokens, pixel frames, animations
├── types/game.ts       every shared type (single source of truth)
├── game/               PURE engine — no React, no DOM, no I/O
│   ├── config.ts       all balance numbers
│   ├── rules.ts        decay, health, actions, clock
│   ├── data/           static game data (care actions)
│   ├── skins.ts        skin registry + secret names
│   ├── easterEggs.ts   name jokes
│   └── runSummary.ts   memorial data
├── hooks/useGameRun.ts reducer, clock effects, save throttling
├── services/           the only files allowed to touch localStorage
├── features/           one folder per screen
└── components/         presentational, prop-driven
tests/                  bun test, no DOM
docs/                   this documentation
.github/                issue forms, PR template, workflows
```

**Dependency direction is one-way** — see
[`ARCHITECTURE.md`](ARCHITECTURE.md) §2. Inside `src/game/` you may import from
`src/types/` and `src/game/` only.

---

## 4. TypeScript rules that will bite you

The project uses **TypeScript 6.0.3**.

**`strict` is on.** `tsconfig.app.json` does not declare it because TypeScript 6
enables `strict` by default. Verified: a `null` assigned to `number` and an
implicitly `any` parameter both fail to compile with no flags, and
`--strict false` silences them. Do not add `"strict": true` thinking it is
missing — it is redundant.

Three other options shape the code style:

| Option | Effect | What you must do |
| ------ | ------ | ---------------- |
| `verbatimModuleSyntax` | Types are erased at runtime | Write `import type { X }` for type-only imports |
| `erasableSyntaxOnly` | Nothing that needs runtime emission | **No enums, no namespaces, no parameter properties** — use string-literal unions like `CareAction`, `SkinId`, `Screen` |
| `noUnusedLocals` / `noUnusedParameters` | Dead code fails the build | Delete instead of commenting out |

`allowImportingTsExtensions` + `noEmit` mean imports may carry `.ts`/`.tsx`
extensions only if you need to; the codebase mostly omits them — match whatever
the neighbouring file does.

---

## 5. Lint

`eslint.config.js` (flat config) applies to `**/*.{ts,tsx}` with:

- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-plugin-react-hooks` recommended — rules of hooks
- `eslint-plugin-react-refresh` (Vite preset)
- Browser globals; `dist/` ignored

The React Compiler (`babel-plugin-react-compiler`) runs through Vite, not
through ESLint. It changes how components memoise, not how they behave.

---

## 6. Testing

- Runner: **`bun test`** (no Jest, no Vitest, no config file).
- Location: `tests/`, two files, **26 tests**.
- Coverage focus: the pure engine (`rules.test.ts`) and the cosmetic registries
  (`skins.test.ts`).
- **There is no DOM environment.** No `jsdom`/`happy-dom` is installed, so tests
  cannot touch `window`, `document` or `localStorage`. This works because the
  engine is pure — keep it that way.
- `SaveService` shape validation and migration are tested as plain functions.

To run a single file:

```bash
bun run test tests/rules.test.ts
```

---

## 7. Conventions

| Topic | Rule |
| ----- | ---- |
| Commits | [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `docs:`, `chore:`, `ci:`, `test:`, `refactor:` |
| Branches | `feat/...`, `fix/...`, `docs/...`, `chore/...` |
| PR title | Same convention as commits |
| Dependencies | **No new dependency without a reason recorded in the PR** |
| Language | English for UI text and docs |
| Data | Gameplay numbers belong in `src/game/config.ts`, never inline |

### Definition of done

Copied verbatim from [`roadmap/v1.md`](roadmap/v1.md) §8 and from
`.github/PULL_REQUEST_TEMPLATE.md` — all three must stay in sync:

- [ ] Item checked in `docs/roadmap/v1.md`
- [ ] Tests cover the logic
- [ ] `bun run test` passes
- [ ] `bun run lint` passes
- [ ] `bun run build` passes
- [ ] Docs updated when behaviour changes

---

## 8. CI and deployment

### `.github/workflows/ci.yml` — pull requests

```
pull_request / workflow_dispatch
  └─ verify: checkout → setup bun → install --frozen-lockfile
             → lint → test → build
```

Runs on every PR and on manual dispatch. `concurrency: ci-${{ github.ref }}`
with `cancel-in-progress` so a new push cancels the stale run.

### `.github/workflows/deploy.yml` — push to `main`

```
push to main
  └─ build:  checkout → setup bun → install → lint → test → build → upload artifact
       └─ deploy (needs: build): publish to GitHub Pages
```

**Lint and tests run inside the deploy job.** If either fails, the artifact is
never uploaded — a red build cannot reach Pages.

### Deployment details

| Item | Value |
| ---- | ----- |
| Base path | `base: '/peanut-game/'` on `build` only (`vite.config.ts`) |
| Artifact | `dist/` |
| Source of truth for numbers | `src/game/config.ts` |

**Configuration:** *Settings → Pages → Source: GitHub Actions* is enabled, and
the first deploy was verified live on 2026-11-18 serving the build with the
correct `/peanut-game/` base path.

---

## 9. Recipes

### Add a care action

Touching only the UI is not enough — the cooldowns and stats are declared in
several places. Files to edit:

1. `src/types/game.ts` — add the id to the `CareAction` union. If it has a new
   counter, add it to `RunStats` too.
2. `src/game/data/careActions.ts` — entry in `CARE_ACTIONS` **and** in
   `CARE_ACTION_LIST`.
3. `src/game/rules.ts` — the `cooldowns` object in `createRun()` and the
   matching field in `tickCooldowns()` (both list every action explicitly).
4. `src/services/SaveService.ts` — add the id to the cooldown validation array
   (and the stat, if any). Otherwise saves will be rejected.
5. `tests/rules.test.ts` — cover the effects and the cooldown.

The HUD needs **no change**: `GameScreen` iterates `CARE_ACTION_LIST`. (Only
`sleep` has a special `col-span-2` class, keyed by id.)

### Add a skin

1. `src/types/game.ts` — add the id to `SkinId`.
2. `src/game/skins.ts` — entry in `SKINS` (`name`, `description`, `category`,
   optional `triggers` for a secret name).
3. `src/components/hamster/skinSprites.ts` — `SKIN_SPRITES` entry: 16 rows of
   exactly 16 characters plus a palette for every character used.

Nothing else. `isSkinId()` is derived from `SKINS`, the sprite test validates
the 16×16 grid automatically, and secret triggers are checked for uniqueness and
normalisation.

> A new skin is **not** unlocked by default. Either give it `triggers` (a secret
> name) or unlock it through `src/services/SkinService.ts`.

### Add a screen

1. `src/types/game.ts` — add the variant to the `Screen` union.
2. `src/App.tsx` — add the `case` to the switch and wire the callbacks.
3. `src/features/<name>/` — new component wrapping `src/components/ui/Screen.tsx`.

There is no router; adding a URL is not part of the job.

### Add a test

Create `tests/<topic>.test.ts`:

```ts
import { describe, expect, test } from 'bun:test'
```

Keep it pure — no `window`, no `localStorage`. Put engine tests next to the
existing ones in `tests/rules.test.ts` when they cover the same module.

---

## 10. Not implemented yet

| Planned | Milestone | What it changes for developers |
| ------- | --------- | ------------------------------ |
| Events and death system | M2 | New pure modules in `src/game/`, new persisted structures (cemetery), schema bump to v3 |
| Minigames | M3 | New `src/features/minigames/`, a pause-the-clock shell |
| Audio | M4 | New `src/services/AudioService.ts` (Web Audio API) |
| Branch protection | optional | Requires status checks enabled in repository settings |
