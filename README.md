# 🐹 Peanut — A hamster's little life.

> Every little life has an ending. Make it count.

**Peanut** is a minimalist indie web game about taking care of a little hamster. Feed it, play with it, keep its habitat clean and try to give it the best life possible.

But there is a catch: no matter how well you take care of your hamster, its story will eventually come to an end.

Sometimes because of your decisions. Sometimes because of completely absurd and unexpected events.

## 🎮 About the Game

Peanut is a 2D pixel art pet simulator that combines survival mechanics, casual minigames and dark comedy.

The player adopts a hamster, chooses its name and becomes responsible for its well-being. Throughout the game, the player must manage its needs, interact with its environment and react to random events.

Every hamster has its own story, and every story has an ending.

## 🎯 Main Objective

Develop a minimalist browser-based indie game that explores basic video game mechanics through an interactive pet simulation.

The main objectives are:

- Implement a pet needs and survival system.
- Develop a time progression and event system.
- Create interactive minigames.
- Implement different endings and causes of death.
- Provide a simple and enjoyable user interface.
- Save player progress locally.

## 🕹️ Gameplay Features

### Pet Care

- Customize your hamster's name.
- Feed your hamster.
- Provide fresh water.
- Clean its habitat.
- Play and interact with it.
- Monitor its health and happiness.

### Survival System

- Hunger, thirst, hygiene, happiness and health.
- Time progression.
- Consequences for neglecting your pet.
- Random events and unexpected situations.

### Minigames

- Hamster Wheel.
- Find the Seeds.
- Tiny Maze.

### The End

Every hamster eventually dies. Depending on the player's decisions and random events, its story can have different endings.

After its death, the game generates a memorial containing its name, age, survival time and cause of death.

## 🎨 Art Direction

- 2D Pixel Art.
- Cute and colorful environments.
- Minimalist user interface.
- Retro-inspired visual elements.
- Comedic animations and unexpected events.

## 🔊 Audio

The game will feature simple sound effects and ambient background music to enhance player interaction.

## 🛠️ Technologies

| Technology    | Purpose                       |
| ------------- | ----------------------------- |
| React         | User interface                |
| TypeScript    | Game logic and type safety    |
| Vite          | Development and build tooling |
| Tailwind CSS  | Styling                       |
| Web Audio API | Sound effects                 |
| LocalStorage  | Local game persistence        |
| GitHub Pages  | Web deployment                |

## 📌 Development Scope

The initial release will focus on a playable single-player experience without requiring a backend or user accounts.

Future improvements may include additional minigames, new hamster events, more customization options and expanded gameplay mechanics.

## 🚀 Deployment

The game is deployed to GitHub Pages through the workflow in `.github/workflows/deploy.yml`.

**Live Demo:** <https://thejavaz.github.io/peanut-game/> _(available after the first deploy on `main`)_

## 🧑‍💻 Run Locally

```bash
bun install
bun run dev      # development server
bun run build    # type-check + production build
bun run preview  # preview the production build
```

## 📚 Documentation

- [Roadmap v1 (MVP)](docs/roadmap/v1.md) — milestones, scope and current status.

## 📚 Project Status

- [x] Game concept and identity.
- [x] Initial development proposal.
- [x] Repository and project scaffolding (React + TypeScript + Vite).
- [x] Visual prototype: pixel-art hamster, cage and app shell.
- [x] Screen flow: main menu → naming → game → memorial.
- [x] Tailwind CSS theme and GitHub Pages deployment workflow.
- [ ] Core gameplay implementation.
- [ ] Random events and death system.
- [ ] Minigames.
- [ ] Audio and animations.
- [ ] Final release.

## 👨‍💻 Developer

**Javier Sarmiento**

Individual academic project developed for the Video Game Development course.

## 📄 License

MIT License (planned).

---

_Peanut is a fictional game created for entertainment purposes. Its mechanics and events are not intended to represent real hamster care._
