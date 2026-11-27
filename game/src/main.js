// Boot and the one loop: input is read once per frame, the world advances
// in fixed 1/60 s steps (several in a slow frame, none in a fast one), and
// the renderer paints what is there. The game moves between four screens:
// title, play, paused and game over.
//
// ?seed=N fixes the farm's pattern. ?shot=title|chase|kitchen|escaped
// (with &seed=N) stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_HIT, EVENT_OVER, EVENT_SPOTTED } from './world.js';
import {
  ACTION_CONFIRM, ACTION_DASH, ACTION_HIDE, ACTION_JUMP, ACTION_MUTE,
  ACTION_PAUSE, ACTION_RESTART, ACTION_SLIDE, createInput,
} from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts one visit.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, scene.over);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, () => audio.unlock());
  let screen = SCREEN_TITLE;
  let overKind = null;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let lastCorn = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    overKind = null;
    accumulator = 0;
    lastCorn = 0;
    screen = SCREEN_PLAY;
    audio.gobble();
    announce(`Playing. ${LIVES} lives. Run 1000 metres to escape.`);
  }

  function endGame() {
    overKind = world.state.over;
    screen = SCREEN_OVER;
    audio.stopAlarm();
    if (overKind === 'escaped') audio.escaped();
    else audio.caught();
    if (world.state.score > best) {
      best = Math.floor(world.state.score);
      saveBest(best);
    }
    announce(overKind === 'escaped'
      ? `Escaped! Score ${Math.floor(world.state.score)}. Best ${best}.`
      : `Caught. Score ${Math.floor(world.state.score)}. Best ${best}.`);
  }

  function handleActions(actions) {
    if (actions & ACTION_MUTE) audio.setMuted(!audio.isMuted());
    if (actions & ACTION_RESTART && (screen === SCREEN_OVER || screen === SCREEN_PLAY)) {
      startGame();
      return;
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopAlarm();
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step(actions) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { jump: false, slide: false, dash: false, hide: false }, true);
      return;
    }
    const events = world.step(STEP, {
      jump: Boolean(actions & ACTION_JUMP),
      slide: input.isSlideHeld() || Boolean(actions & ACTION_SLIDE),
      dash: Boolean(actions & ACTION_DASH),
      hide: Boolean(actions & ACTION_HIDE),
    }, false);
    if (world.state.corn > lastCorn) {
      lastCorn = world.state.corn;
      audio.corn();
    }
    if (events & EVENT_HIT) {
      audio.hit();
      announce(world.state.lives === 1 ? 'Hit. 1 life left.' : `Hit. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_SPOTTED) {
      audio.startAlarm();
      announce('The farmer is close!');
    }
    if (world.state.farmerGap > 130) audio.stopAlarm();
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    // Actions are read once per frame; only the first fixed sub-step sees
    // the latched jump/dash/hide, so one press is one move.
    const actions = input.takeActions();
    handleActions(actions);
    let pending = actions;
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(pending);
        pending = 0;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, overKind);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      audio.stopAlarm();
      announce('Paused.');
    }
  });

  announce('Gobble Dash. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
