# gobble-dash-turkey-escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/yu489210-design/gobble-dash-turkey-escape/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/yu489210-design/gobble-dash-turkey-escape/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Gobble Dash — The Great Thanksgiving Escape. A turkey is on the menu, so it runs: 1000 metres from the farmyard, through the cornfield, past the kitchen ovens and carving knives, to the forest. The farmer chases the whole way, and he gains on every stumble.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `game/index.html` from any static server. No build step, no network requests, no dependencies. Node 22.18+ for `main.ts` / `serve.ts`; any desktop Chrome for play.

Controls: Space / ↑ / W jump, ↓ / S slide, Shift dash, H hide in a haystack, P pause, M mute, R restart. Click also jumps (and starts / restarts). Synthesized WebAudio sounds, no audio files.

## The run

- **Farmyard (0–300 m):** fences, hay bales, pumpkins and gravy puddles at a gentle pace. Learn the jump.
- **Cornfield (300–650 m):** dusk, scarecrows, faster scroll, corn arcs over the obstacles.
- **The Kitchen (650–1000 m):** glowing ovens to jump and hanging carving knives to slide under — the farmer is at his angriest.
- **Escape:** reach 1000 m and the forest is yours. Get caught by the farmer, or run out of 3 lives, and dinner is served... almost.

Corn pushes the farmer back, pie heals the score, feathers refill the dash. Hiding in a haystack (H) makes the farmer run straight past — if you time it.

## Layout

- `main.ts` — the hand-in program (Node 22, standard library only): copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
- `game/` — the playable game, static files only: `index.html` plus `src/` modules (`config`, `random`, `world`, `farmer` logic inside `world`, `input`, `audio`, `render`, `shots`, `main`).
- `screenshots/` — 4 real renders of the game's own code in desktop Chrome (see `shots.json` for the staged scenes).
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Test it

```sh
mkdir -p out1 out2
MAKEFUN_OUTPUT_DIR=out1 node main.ts
MAKEFUN_OUTPUT_DIR=out2 node main.ts
diff -r out1 out2   # the two runs must be byte-identical
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
