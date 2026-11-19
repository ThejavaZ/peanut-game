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
death belongs to a dedicated system that does not exist yet (§10).

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

Total neglect from full health reaches zero in about **8 min 46 s**.

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

The HUD reads `Day N · HH:MM`. Day number and age both derive from
`elapsedSeconds`, so pausing, reloading or closing the tab never corrupts them.

---

## 7. Pause, hidden tabs and offline time

| Situation                    | What happens                                                |
| ---------------------------- | ------------------------------------------------------------ |
| Pause button                 | Time, cooldowns and decay all freeze                         |
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

## 9. What ends a run today

Honest status: **nothing in the game ends a run yet.**

The only exit is the development button *Skip to memorial (dev)* at the bottom
of the game screen. The memorial already shows days, meals and play sessions
from real stats, but the cause of death and epitaph are hard-coded placeholders.

There is no cemetery; the menu's *Cemetery* button is disabled.

---

## 10. Not implemented yet

| Planned                       | Milestone | Expected effect on gameplay                                 |
| ----------------------------- | --------- | ----------------------------------------------------------- |
| Random events (≥ 8)           | M2        | Weighted choices that can improve or damage the run          |
| Death system (≥ 6 causes)     | M2        | Ends runs for real; writes an immutable death record         |
| Persistent cemetery           | M2        | Browsable history of previous hamsters                       |
| Minigames (3 + Nap Time)      | M3        | Active play that rewards needs, with the clock paused        |
| Audio                         | M4        | Synthesised SFX and ambient loop                             |
| Balance pass                  | M4        | Target run length: **5–15 minutes** (target, not tuned)      |

Until those land, treat every "how long does a run last" number in this
document as a description of decay, not of a designed pacing.
