# 🐹 Peanut — User manual

> Every little life has an ending. Make it count.

Peanut is a small browser game about taking care of a hamster. You adopt it,
name it, feed it, play with it — and one day its life ends, with a record of how
it went.

---

## 1. Before you start

| | |
| --- | --- |
| **Address** | <https://thejavaz.github.io/peanut-game/> |
| **Needs** | Any current browser. No account, no download, no server |
| **Where progress lives** | In your own browser. Closing the tab is safe |
| **A full life** | Roughly 5 to 15 minutes if you look after it well |

Install it, bookmark it, open it. Nothing else is required.

---

## 2. One life, step by step

| # | What you do | What you get |
| - | ----------- | ------------ |
| 1 | Open the address | The menu: **Adopt a hamster**, **Cemetery**, and **Continue** if a life is already in progress |
| 2 | Press **Adopt a hamster** | A name field (24 characters) and a shelf of skins |
| 3 | Name it and press **Adopt** | The room: clock, five bars, score, care actions, minigames |
| 4 | Watch the bars fall | They drop in real time, always |
| 5 | Feed, water, clean, play, nap | The matching bar rises; the button rests for a few seconds |
| 6 | Wait around 45 seconds | An **event** may interrupt you: the clock stops until you choose |
| 7 | Play a minigame | Sleep advances half a day, the wheel pays happiness, the maze clears your cooldowns |
| 8 | Keep going | At day 8 you are warned; at day 9 the life ends — or sooner, if you neglect it |
| 9 | Read the memorial | Name, days, meals, play, **score**, **cause of death** and an epitaph |
| 10 | Open the **Cemetery** from the menu | Every hamster you have lost, with its cause, date and score |

Starting a new life **never erases** the cemetery.

---

## 3. The five bars

| Bar | What it means when it falls |
| --- | --------------------------- |
| **Hunger** | The bowl is empty |
| **Thirst** | The bottle needs refilling |
| **Hygiene** | The cage needs cleaning |
| **Happiness** | Nobody is playing with it |
| **Health** | The others have been ignored for too long — health does not fall on its own |

Each bar shows its `0–100` value. Health only drops while another bar is in the
red, and only recovers once **all four** are above 55.

### What the warnings mean

| You see | Meaning |
| ------- | ------- |
| Yellow bar (≤ 35) and a **Worried** badge | Nothing is wrong yet. Fix it before it gets serious |
| Red bar (≤ 20), **Critical** badge and a red alert | Health has started to fall. This is the last comfortable moment |
| A separate line saying it *is getting on in years* | Day 8: the natural end arrives on day 9 |
| A modal with two options | An event. **The clock is stopped** while you read it |

Every warning appears **before** the damage. Nothing in Peanut surprises you
without a chance to react.

---

## 4. Care actions

| Action | Does | Rests for |
| ------ | ---- | --------- |
| **Feed** | Hunger up, a little messier | 8 s |
| **Water** | Thirst up, health +1 | 8 s |
| **Clean** | Hygiene up | 20 s |
| **Play** | Happiness up, but hungry and thirsty | 12 s |
| **Nap** | Health up, but the clock moves on | 45 s |

Nothing is free: feeding dirties the cage and playing tires it. There is no
action that only helps.

---

## 5. Events

Every so often the game pauses itself and a modal opens with **one or two
options**. Each option spells out its consequences *before* you commit, and the
clock stays stopped until you decide — reading costs you nothing.

Events appear at most once every 45 seconds, and some only happen once in a
life. Some are ordinary, some are absurd, and a few are the reason your hamster
ends up in the cemetery sooner than expected.

---

## 6. Minigames

Open one from the **Minigames** panel. The clock freezes while you play, and the
reward is shown **before** you start.

| Minigame | How it plays | Reward |
| -------- | ------------ | ------ |
| **Nap Time** | One press: Peanut sleeps while half a day passes | Health +15, and the decay of that half day |
| **Hamster Wheel** | Stop the marker inside the green arc. **3 attempts**, and the target moves each time | Up to +25 happiness (a perfect session is capped) |
| **Tiny Maze** | Reach the green exit. The walls are real — they will not let you through. Arrows, WASD or the on-screen buttons | +10 happiness and **every care cooldown cleared** |

Two rules worth knowing:

- **Leaving early applies nothing.** The *Skip* button is always there and is
  always free.
- **You cannot chain them.** After any minigame, **60 seconds** must pass; the
  buttons show the countdown. Happiness alone never kept a hamster alive.

---

## 7. Score

The score summarises the life. It appears live in the HUD, ends up in the
memorial, and stays with the grave in the cemetery.

```
Score = (completed days × 100) + (meals × 5) + (drinks × 5)
      + (play sessions and minigames × 10) + (cleanings × 5)
      + (events resolved without leaving a critical bar × 15)
      − penalties, never below 0
```

A penalty period is **60 seconds** with at least one bar at 20 or below: **−10**
per period, plus **−20 more** when two or more bars were critical.

> The score **never decides whether Peanut lives or dies**. Neglect kills or
> saves; the number only remembers.

---

## 8. The ending, the memorial and the cemetery

When a life ends, the memorial shows the name, days survived, meals, play
sessions, **final score**, **cause of death** and an epitaph. There are seven
causes: five from neglect, one absurd accident and old age.

Every ending is saved as a **grave** — name, skin, days, cause, epitaph, date
and score — up to fifty of them, newest first. *Adopt another* starts a new
life **without** touching them.

Some names unlock unusual skins, and a few names behave strangely. Nobody will
tell you which.

---

## 9. Controls

| Situation | How |
| --------- | --- |
| Everything clickable | Mouse, or Tab + Enter (focus is always visible) |
| Naming | Keyboard, 24 characters maximum |
| Pause | The **Pause** button freezes everything |
| Wheel | The **Stop the wheel** button: mouse, Space or Enter |
| Maze | Arrow keys, WASD, or the four on-screen arrows |
| Escape a minigame | **Skip — nothing happens**, available at all times |

---

## 10. Tips

- Read the warning: it always arrives before the damage.
- Water is the fastest bar to fall and hygiene the slowest — but the slow one
  still kills.
- Sleeping advances the clock, so a nap at the wrong moment can walk you into
  an event you did not want.
- The maze clears your cooldowns; the wheel does not. Choose according to what
  is blocking you.

---

*Peanut is a fictional game for entertainment. Its mechanics are not
instructions for real hamster care.*
