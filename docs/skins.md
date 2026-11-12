# Skins & Secret Characters

Peanut is a hamster. Usually.

Skins are **purely cosmetic**: they never change hunger, thirst, hygiene, happiness, health, cooldowns, or the death rules. A crab in a hamster cage is still a hamster as far as the game is concerned.

Skins are unlocked by **adopting a hamster with a specific name**. Matching ignores case, accents, and extra spaces. Once unlocked, a skin stays available in the adoption screen for every future run.

> Spoiler warning: this document lists every secret.

## Cosmetic skins

| Skin | Trigger names | Notes |
| --- | --- | --- |
| Hamster | — | Always available. The classic Peanut. |
| Chick | `chick`, `pollito`, `pollito amarillo`, `yellow chick` | A yellow chick. |
| Pink Chick | `pink chick`, `pollito rosa`, `pink`, `rosa` | A pink chick. |
| Blue Chick | `blue chick`, `pollito azul`, `blue`, `azul` | A blue chick. |
| Mint Chick | `mint chick`, `pollito verde`, `green`, `verde` | A mint chick. |
| Chicken Costume | `chicken`, `gallina`, `chicken costume`, `disfraz` | It is either a chicken or a very good disguise. |
| Bunny | `bunny`, `rabbit`, `conejo`, `coneja` | Long ears, same cage. |
| Duckling | `duck`, `duckling`, `pato`, `patito` | Has opinions about the water bottle. |
| Fancy Rat | `rat`, `fancy rat`, `rata`, `raton` | Fancier than most hamsters. |
| Capybara | `capybara`, `capibara`, `capi` | Miniature and already tired. |

## Developer mascots

Original pixel-art interpretations, not official artwork.

| Skin | Trigger names | Reference |
| --- | --- | --- |
| Little Gopher | `gopher`, `go` | Go's gopher. Loves concurrency. |
| Ferris | `ferris`, `rust`, `rustacean` | Rust's community crab. Very safe. |
| elePHPant | `elephpant`, `php` | PHP's elephant. Growing normally. |
| Duke | `duke`, `java` | Java's mascot. White blob, red nose. |
| Camel | `camel`, `perl` | Perl's O'Reilly camel. |
| Kodee | `kodee`, `kotlin` | Kotlin's purple robot. |
| Python | `python` | A blue and yellow snake. |
| Ruby | `ruby` | A shiny red gem. |
| Swift | `swift` | A small, fast bird. |
| Scripty | `javascript`, `js`, `scripty` | A creature of undefined behaviour. |
| Root | `root` | A dark hamster with full access to the cage. |

## Name-based easter eggs

These do not unlock a skin, but they change how the run is presented. None of them are penalties.

| Name | Effect |
| --- | --- |
| `404` | The hamster periodically disappears for a few seconds. It always comes back. |
| `Null` | The hamster is displayed as **No name**. The save keeps the original input. |
| `SegmentationFault` | A non-fatal `segmentation fault · core dumped` banner appears. |
| `sudo` | The hamster wears a tiny crown. |
| `root` | Unlocks the Root skin and shows a **Superuser** badge. |
| `localhost` | A small server rack appears in the cage. |

## Implementation notes

- Skin definitions and trigger names live in `src/game/skins.ts`.
- Name jokes live in `src/game/easterEggs.ts`.
- Unlocks are stored separately from the run in `localStorage` (`peanut.skins.v1`), so they survive death and new adoptions.
- The current run stores `skinId` and `accessoryId`; saves from before skins are migrated automatically.
- Sprites are 16×16 SVG grids in `src/components/hamster/skinSprites.ts`, rendered by `SkinSprite`.
- All references are inspiration only. The game ships original pixel art and does not reuse official mascot illustrations.
