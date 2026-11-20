# 🐹 Peanut — Gameplay rules

> Every little life has an ending. Make it count.

| Field        | Value                                                  |
| ------------ | ------------------------------------------------------ |
| Scope        | How the game actually plays, in numbers                |
| Applies to   | v0.3.0 (M0 + M1 + M1.5 complete)                       |
| Last updated | 2026-11-18                                             |
| Source of truth | `src/game/config.ts`, `src/game/data/careActions.ts` |
| Related docs | [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`skins.md`](skins.md) |

Every value below is read from the source, not estimated. Numbers marked
**target** are design intentions that are not tuned yet.

---

## 1. The loop

1. Adopt a hamster and name it.
2. Keep five needs above zero.
3. Watch the clock: needs fall constantly, even while you read the UI.
4. The run ends. Every hamster has an ending.

The HUD shows the current `0–100` value of each need, but never a countdown to
zero. This document is the reference for the underlying rates.

---

## 2. The five needs

| Need       | Decays? | Rate per second | Full → empty   |
| ---------- | ------- | --------------- | -------------- |
| Hunger     | yes     | `0.28`          | ~5 min 57 s    |
| Thirst     | yes     | `0.34`          | ~4 min 54 s    |
| Hygiene    | yes     | `0.16`          | ~10 min 25 s   |
| Happiness  | yes     | `0.22`          | ~7 min 35 s    |
| Health     | no      | derived         | see §4         |

Thirst is the fastest killer, hygiene the most forgiving. Nothing decays while
the game is paused.

All values clamp to `[0, 100]`. **Zero is a warning state, never instant death** —
death only comes from the death system described in §9.

### Thresholds

| Threshold | Value | Meaning                                                |
| --------- | ----- | ------------------------------------------------------ |
| Warning   | `35`  | Mood badge drops to *Worried*                           |
| Critical  | `20`  | Mood badge becomes *Critical* and the alert banner shows |

The critical threshold is deliberately equal to
`HEALTH_RULES.criticalThreshold`, so the banner appears at the exact moment
health starts falling.

---

## 3. What the HUD shows

| Element          | Behaviour                                                       |
| ---------------- | --------------------------------------------------------------- |
| Need bars        | Shows the rounded `0–100` value; bar and number change colour at warning (`35`) and critical (`20`) |
| Mood badge       | `Happy` (average ≥ 75), `Doing okay`, `Worried` (≤ 35), `Critical` (≤ 20) |
| Alert banner     | Names the **lowest** core need once it is critical, or health    |
| Action buttons   | Disabled during cooldown, labelled with remaining seconds        |
| Pause overlay    | Freezes the room and every action                               |

No number is hidden from the player who reads the bars — but no countdown
predicts when a need will hit zero either.

---

## 4. Health

Health never decays on its own. It moves only as a consequence of the four
core needs.

**While any core need is below `20`, health loses that need's penalty every
second:**

| Need      | Penalty per second |
| --------- | ------------------ |
| Hunger    | `0.06`             |
| Thirst    | `0.08`             |
| Hygiene   | `0.03`             |
| Happiness | `0.02`             |
| **All four at once** | **`0.19`**  |

Two numbers matter, measured on the engine from a fresh hamster with total
neglect:

| Moment | Elapsed |
| ------ | ------- |
| First need goes critical → **the alert banner appears** | **3 min 56 s** |
| Health reaches zero → **death** | **13 min 53 s** |

The `0.19/s` rate alone would drain health in **8 min 46 s**, but it only starts
once every core need is critical — hunger empties at ~5 min, hygiene not until
~10 min 25 s. That gap is what makes the run last almost fourteen minutes.

> Under *total* neglect all four needs hit zero before health does, so the cause
> is always **systemic failure**. The specific causes — starvation, dehydration,
> squalor, despair — need **selective** neglect: feeding and playing while
> forgetting the water, for instance.

**Health recovers at `+0.05` per second — but only when all four core needs are
at `55` or above.** That is one point every 20 seconds, and no recovery happens
in the same tick as a penalty. In practice the *Nap* action is the real health
tool: `+12` instantly.

---

## 5. Care actions

Each action applies its effects only if its cooldown has expired, and increments
the matching run stat.

| Action  | Cooldown | Effects                                                    | Stat           |
| ------- | -------- | ---------------------------------------------------------- | -------------- |
| Feed    | 8 s      | hunger `+42`, happiness `+4`, hygiene `−3`                  | `meals`        |
| Water   | 8 s      | thirst `+48`, health `+1`                                   | `drinks`       |
| Clean   | 20 s     | hygiene `+55`, happiness `+3`                               | `cleanings`    |
| Play    | 12 s     | happiness `+32`, hunger `−8`, thirst `−10`, hygiene `−4`    | `playSessions` |
| Nap     | 45 s     | health `+12`, happiness `+5`, hunger `−6`, thirst `−6`      | `naps`         |

Design note: **every action has a cost.** Feeding dirties the cage, playing
drinks and eats, napping makes the hamster hungrier. Nothing is a free refill,
so the player always makes a small trade-off.

---

## 6. Clock and calendar

| Constant            | Value        | Meaning                                  |
| ------------------- | ------------ | ---------------------------------------- |
| `SECONDS_PER_DAY`   | `120`        | One in-game day every two real minutes   |
| `DAY_START_HOUR`    | `08:00`      | Every in-game day starts in the morning  |
| `MAX_AGE_DAYS`      | `8`          | Old age ends the run on Day 9            |

The HUD reads `Day N · HH:MM`. Day number and age both derive from
`elapsedSeconds`, so pausing, reloading or closing the tab never corrupts them.

---

## 7. Pause, hidden tabs and offline time

| Situation                    | What happens                                                |
| ---------------------------- | ------------------------------------------------------------ |
| Pause button                 | Time, cooldowns and decay all freeze                         |
| Event modal open             | Frozen too — reading an event costs Peanut no time           |
| Tab is hidden                | No ticks while hidden; the run is saved immediately          |
| Tab becomes visible again    | Catch-up applied, capped at **10 minutes** of decay          |
| Single tick stall            | Capped at **5 seconds**; the rest is dropped by design       |
| Reload / reopen              | Offline decay applied, again capped at 10 minutes            |

The cap exists so an absence is **punishing but not fatal by default**. You can
still kill the hamster — you just cannot do it by accident overnight.

---

## 8. Adoption

- The name is trimmed, must not be empty, and is limited to **24 characters**.
- *Surprise me* picks one of eight suggested names.
- Adoption can replace an existing hamster; the naming screen warns first and
  there is no undo.
- Choosing a look is optional — the classic hamster is always available.

### Secret names

Some names unlock skins or cosmetic surprises. They never change needs,
cooldowns or health. Full list, with spoilers, in [`skins.md`](skins.md).

---

## 9. How a run ends

Death is real now, and it is never instant.

### Rules

- Health reaching `0` ends the run.
- Reaching `ageDays = 8` (**Day 9**, ~16 real minutes) ends the run — **but only
  while health is still above zero**. A neglected hamster dies of neglect even
  on its last day; old age is for hamsters that are otherwise fine.
- Once dead, everything freezes: needs, cooldowns, the clock and the care
  buttons. The record is written once and never rewritten.

### The seven causes

| Cause | Trigger | Warning before it |
| ----- | ------- | ----------------- |
| Starvation | Hunger is the single lowest core need | Critical banner |
| Dehydration | Thirst is the single lowest core need | Critical banner |
| Squalor | Hygiene is the single lowest core need | Critical banner |
| Despair | Happiness is the single lowest core need | Critical banner |
| Systemic failure | Two or more core needs equally bad | Critical banner |
| The wheel flew off | Health empty **while every need stays comfortable** and at least 5 play sessions | Health banner once the bar drops under 20 |
| Old age | `ageDays ≥ 8` while health > 0 | Age banner, one full day earlier |

Three things decide which cause you get:

1. **Who is lowest.** One clearly lowest need gets the blame; a tie means no
   culprit, so it is systemic. Under *total* neglect every need hits zero before
   health does — see §4 — so that path always ends **systemic**. The specific
   causes need selective neglect: feeding and playing while forgetting water.
2. **Neglect beats accidents and age.** The health check runs first, so `old
   age` can only fire on a hamster that is still being looked after.
3. **An accident needs impossible evidence.** Neglect cannot empty the health
   bar while every need is at or above 55 — penalties only exist below 20, and
   above 55 health recovers. If the bar is empty anyway *and* the wheel has been
   used at least five times, nothing but the accident explains it.

### Warnings

| Ending | First warning | Death |
| ------ | ------------- | ----- |
| Neglect | ~**3 min 56 s** into total neglect (first need critical) | ~**13 min 53 s** |
| The wheel flew off | Health banner when the bar drops under 20 | When the bar empties |
| Old age | Whole of **Day 8** (`ageDays = 7`) | Start of **Day 9** (`ageDays = 8`) |

No death happens without one of those having been visible first.

### After death

- The memorial shows name, days survived, meals, play sessions, **real cause of
  death** and an epitaph — all read from the frozen `DeathRecord`.
- The record is written to storage immediately, so **reloading brings the
  memorial back**.
- The same moment adds a **grave** to the cemetery: name, skin, days, cause and
  epitaph, kept in its own storage key (newest first, up to 50).
- Leaving the memorial clears the **run** only. *Adopt another* never touches
  the cemetery, so every hamster you have lost stays listed in the menu.

---

## 10. Events

Nine events can interrupt a run. A modal opens over the HUD, **the clock stops**,
and there is no way out of it but to choose.

### What an event declares

| Field | Meaning |
| ----- | ------- |
| `id`, `title`, `description` | Identity and copy |
| `weight` | Likelihood against the other eligible events |
| `cooldownSeconds` | Seconds before this same event may fire again |
| `oncePerRun` | Never fires twice in one run |
| `conditions` | Gates on needs or day — all must be true |
| `choices` | One or two options, each with visible effects |

### Cadence

Three gates, in this order, every check:

| Gate | Value | Effect |
| ---- | ----- | ------ |
| Global gap | `EVENT_MIN_INTERVAL_SECONDS = 45` | Events can never crowd each other |
| Chance | `EVENT_CHANCE = 0.3` | Even a valid moment may pass silently |
| Eligibility | conditions + cooldown + once-per-run | Only events that make sense |

Nothing can fire while another event is waiting for an answer, and nothing at
all can fire after death or while the game is paused.

### The nine events

| Event | Type | Fires when | Weight | Cooldown | One-shot | Choices |
| ----- | ---- | ---------- | ------ | -------- | -------- | ------- |
| The bowl is empty | negligence | hunger ≤ 35 | 40 | 60 s | no | fill it / later |
| The water bottle is stuck | negligence | thirst ≤ 40 | 35 | 90 s | no | twist it free / let it be |
| Nobody has played today | negligence | happiness ≤ 30 | 30 | 120 s | no | sit with it / tomorrow |
| The cage needs a real clean | negligence | hygiene ≤ 30 | 30 | 100 s | no | strip it / just add paper |
| Peanut is out of the cage | absurd | day ≥ 2 | 30 | 180 s | **yes** | chase it / leave a trail of seeds |
| Peanut runs all night | absurd | day ≥ 3 | 25 | 240 s | no | let it run / stop the wheel |
| There is something in the walls | absurd | day ≥ 4 | 25 | 150 s | **yes** | listen / move the cage |
| The wheel is going too fast | absurd | play sessions ≥ 5 | 25 | 150 s | no | push it faster / take the wheel off |
| Peanut has a sniffle | inevitable | day ≥ 5 | 20 | 0 | **yes** | the vet / wait and see |

Four negligence, four absurd, one inevitable. Every option gives and takes
something — no choice is a free refill.

> The wheel event is the only one gated on a **stat** instead of a need or a
> day, and its costliest choice is the only one that can empty the health bar
> while every need is healthy — which is what lets the death system call it an
> accident instead of neglect (§9).

### The modal

- Title, an illustration of your hamster, a description, and **one or two
  options with the consequence spelled out before you commit**.
- No close button, no Escape, no clicking outside: only choosing closes it.
- While it is open, **decay, cooldowns and the clock are frozen**. Reading the
  event costs the hamster nothing.
- The chosen effect applies immediately and is saved — reload and it is there.

### History note

This shipped disabled first (`EVENTS_ENABLED = false`) together with the
scheduler, because a queued event nobody can answer would have been invisible.
The modal and the remaining five events flipped it on.

## 11. Not implemented yet

| Planned                       | Milestone | Expected effect on gameplay                                 |
| ----------------------------- | --------- | ----------------------------------------------------------- |
| Minigames (3 + Nap Time)      | M3        | Active play that rewards needs, with the clock paused        |
| Audio                         | M4        | Synthesised SFX and ambient loop                             |
| Balance pass                  | M4        | Target run length: **5–15 minutes** (target, not tuned)      |

Until those land, treat every "how long does a run last" number in this
document as a description of decay, not of a designed pacing.
