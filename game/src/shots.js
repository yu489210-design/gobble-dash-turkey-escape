// The screenshot scenes behind ?shot=title|chase|kitchen|escaped.
// Each one plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a simple autopilot (jump what must be jumped,
// slide under what hangs low, dash when the farmer closes in), so the frame
// is what a short game really looks like and the same seed always gives
// the same frame.
import { FIELD, STEP, TURKEY } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = 1 / 30;

/** The autopilot's move for this step: jump, slide, dash, or hide. */
function autopilot(state) {
  const t = state.turkey;
  const input = { jump: false, slide: false, dash: false, hide: false };
  if (t.hiding > 0 || t.y > 0) return input;
  let nearest = null;
  for (const ob of state.obstacles) {
    if (ob.x + 120 < TURKEY.x) continue;
    if (!nearest || ob.x < nearest.x) nearest = ob;
  }
  if (nearest) {
    const gap = nearest.x - TURKEY.x;
    if (nearest.kind === 'knifeRack') {
      if (gap < 150) input.slide = true;
    } else if (gap < 150) {
      input.jump = true;
    }
    if (nearest.kind === 'haybale' && gap < 130 && state.farmerGap < 120) input.hide = true;
  }
  if (state.farmerGap < 80 && state.dashReady) input.dash = true;
  return input;
}

function playForward(world, seconds) {
  let events = 0;
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    events = world.step(STEP, autopilot(world.state), false);
    if (events & EVENT_OVER) break;
  }
  return events;
}

/**
 * Set `world` to the named scene and return the screen to draw over it
 * and the best score to show. Unknown names stage the title.
 */
export function stageShot(name, world) {
  if (name === 'title') {
    world.reset();
    // Attract mode: the farm scrolls behind the title for five seconds.
    for (let i = 0; i < 5 / STEP; i += 1) world.step(STEP, { jump: false, slide: false, dash: false, hide: false }, true);
    return { screen: SCREEN_TITLE, best: 1240, over: null };
  }
  if (name === 'chase') {
    world.reset();
    world.state.farmerGap = 95;
    playForward(world, 14);
    // Settle the frame: the turkey on the ground, an obstacle closing in.
    for (let i = 0; i < 180; i += 1) {
      const t = world.state.turkey;
      const near = world.state.obstacles.some((ob) => ob.x - TURKEY.x > 120 && ob.x - TURKEY.x < 480);
      if (t.y === 0 && near) break;
      world.step(STEP, autopilot(world.state), false);
    }
    return { screen: SCREEN_PLAY, best: 1240, over: null };
  }
  if (name === 'kitchen') {
    world.seek(700);
    playForward(world, 6);
    // Wait, in quarter-second chunks, for a glowing oven to roll into the
    // middle of the frame with the turkey grounded; up to 25 more seconds.
    for (let i = 0; i < 100; i += 1) {
      playForward(world, 0.25);
      if (world.state.over) break;
      const oven = world.state.obstacles.find(
        (ob) => ob.kind === 'oven' && ob.x > 480 && ob.x < 950,
      );
      if (oven && world.state.turkey.y === 0) break;
    }
    return { screen: SCREEN_PLAY, best: 1240, over: null };
  }
  if (name === 'escaped') {
    world.seek(940);
    const events = playForward(world, 30);
    const escaped = world.state.over === 'escaped';
    return { screen: escaped ? SCREEN_OVER : SCREEN_PLAY, best: 1240, over: escaped ? 'escaped' : null };
  }
  world.reset();
  return { screen: SCREEN_TITLE, best: 0, over: null };
}

export { FIELD, SAMPLE };
