# Gobble Dash — strategy

## What the judge weighs (in order)
1. **Complete turkey escape game, shown in screenshots:** title screen, a run in play with HUD (score / distance / lives), an end screen (caught or escaped) with restart. The turkey, the farmer, the oven and the carving knife must all be visible.
2. **Fun and depth:** dodging, jumping, hiding, outrunning; a farmer who chases, searches and corners; dangers that grow harder from farmyard to kitchen; a reason to run again.
3. **Feel and polish:** responsive controls, clear feedback when spotted / hit / caught / escaped, sound, menus, fair tuning.
4. **Look and originality:** its own Thanksgiving art, coherent autumn palette, comic timing, a scene that reads at a glance.
5. **Structure:** source split into files with one clear job each, named for what they do.

## How this entry answers each one
1. Four screenshots, one per beat: title (farm scrolling behind it), farmyard chase with the farmer close and the HUD full, the kitchen stage with a glowing oven and a hanging carving knife, and the ESCAPED end screen. The cover is the title.
2. Three mechanics beyond running: jump, slide, dash, plus hiding in haystacks — a stealth beat no plain runner has. Three stages with their own obstacle tables and rising speed. The farmer is a real second system: he closes in over time, lunges on every hit, and is pushed back by corn, dashes and hiding, so the player manages a gap, not just obstacles.
3. Synthesized WebAudio (gobble, jump, hit, alarm, win jingle), a farmer-proximity alarm with a red "HE'S CLOSE!", banners for stage changes and hiding, pause, mute, restart, best score saved locally.
4. All art is hand-drawn vector canvas: the turkey (fan tail, wattle, running legs), the farmer (straw hat, pitchfork, angry brows), autumn farmyard → dusk cornfield → night kitchen palettes. Nothing copied from a commercial game; the starter's Turkey Dodge (falling knives, catch corn) is a different game — this one is a side-scrolling escape with a chasing farmer.
5. Files by job: `config.js` (tuning), `random.js` (seeded RNG), `world.js` (rules, farmer AI, spawning), `render.js` (all drawing), `input.js`, `audio.js`, `shots.js` (staged screenshots), `main.js` (loop and screens).

## Screenshot plan (shots.json)
- `1-title.jpg` — title screen over the scrolling farm, best score shown.
- `2-chase.jpg` — farmyard play, farmer 95 px behind, HUD with score/distance/lives/corn.
- `3-kitchen.jpg` — kitchen stage at 700 m: oven + hanging knife + HUD.
- `4-escaped.jpg` — the ESCAPED end screen after a real autopilot run from 940 m.

## Risks and mitigations
- The autopilot must survive to 1000 m for the escaped shot: it stages from 940 m, not from 0, and the farmer gap is reset to 150 at seek.
- The kitchen knife must read as a knife at contact-sheet size: it is drawn large, silver, with a wooden handle and a "slide under" gap, and the HUD labels the stage THE KITCHEN.
- Determinism: seeded RNG, fixed 1/60 s steps, no Math.random in world/render; main.ts runs twice must be byte-identical.
