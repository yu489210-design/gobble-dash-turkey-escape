// The game rules, with no DOM in them: a Node test can run this file
// directly. The turkey auto-runs to the right; the world scrolls left.
// Jump the fences, hay bales, pumpkins and ovens; slide under the hanging
// carving knives; hide in a haystack when the farmer gets too close.
// The farmer gains on every hit and slowly closes in; corn, dashing and
// hiding push him back. Reach 1000 m and the turkey escapes to the forest.
import {
  ESCAPE_DISTANCE, FARMER, FIELD, LIVES, OBSTACLES, PICKUPS,
  PX_PER_METRE, SPEED, STAGES, STEP, TURKEY,
} from './config.js';
import { createRandom } from './random.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_PICKUP = 4;
export const EVENT_STAGE = 8;
export const EVENT_SPOTTED = 16;
export const EVENT_HIDDEN = 32;

const SPAWN_TABLE = {
  farmyard: ['fence', 'haybale', 'pumpkin', 'puddle', 'fence', 'haybale'],
  cornfield: ['fence', 'haybale', 'scarecrow', 'pumpkin', 'haybale', 'puddle'],
  kitchen: ['oven', 'knifeRack', 'oven', 'puddle', 'knifeRack', 'fence'],
};

function stageFor(distance) {
  let index = 0;
  for (let i = 0; i < STAGES.length; i += 1) {
    if (distance >= STAGES[i].from) index = i;
  }
  return index;
}

function speedFor(stageIndex) {
  return [SPEED.farmyard, SPEED.cornfield, SPEED.kitchen][stageIndex];
}

export function createWorld(random) {
  const state = {
    time: 0,
    distance: 0,
    score: 0,
    lives: LIVES,
    corn: 0,
    stageIndex: 0,
    speed: SPEED.farmyard,
    farmerGap: FARMER.startGap,
    dashReady: true,
    dashCooldown: 0,
    over: null,
    banner: '',
    bannerTime: 0,
    turkey: {
      y: 0, vy: 0, sliding: 0, dashing: 0, hiding: 0,
      invulnerable: 0, runPhase: 0,
    },
    obstacles: [],
    pickups: [],
  };
  let spawnIn = 1.1;
  let wasAlarmed = false;

  // Forgiving hitboxes: the turkey's box is inset from its drawn body and
  // each obstacle's box is 80% of its drawn width with 12 px off the top,
  // so a jump that looks clear plays clear.
  function turkeyRect() {
    const t = state.turkey;
    const height = t.sliding > 0 ? TURKEY.slideHeight : TURKEY.height - 4;
    return {
      x: TURKEY.x + 9, width: TURKEY.width - 18,
      bottom: FIELD.groundY - t.y, height,
    };
  }

  function obstacleRect(ob) {
    const def = OBSTACLES[ob.kind];
    const inset = def.width * 0.1;
    if (def.kind === 'duck') {
      return { x: ob.x + inset, width: def.width * 0.8, bottom: FIELD.groundY - 52, height: 26 };
    }
    return { x: ob.x + inset, width: def.width * 0.8, bottom: FIELD.groundY, height: def.height - 12 };
  }

  function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x
      && a.bottom - a.height < b.bottom && a.bottom > b.bottom - b.height;
  }

  function spawnObstacle() {
    const table = SPAWN_TABLE[STAGES[state.stageIndex].palette];
    const kind = random.pick(table);
    const def = OBSTACLES[kind];
    const ob = { kind, x: FIELD.width + 90, passed: false, hit: false };
    state.obstacles.push(ob);
    // A corn arc over jumpable obstacles rewards a well-timed jump.
    if (def.kind === 'jump' && random.chance(0.55)) {
      const height = def.height + 46;
      for (let i = 0; i < 3; i += 1) {
        state.pickups.push({
          kind: 'corn', x: ob.x - 26 + i * 34, y: height - Math.abs(i - 1) * 22, taken: false,
        });
      }
    } else if (random.chance(0.3)) {
      state.pickups.push({
        kind: random.chance(0.12) ? 'pie' : 'corn',
        x: FIELD.width + 90, y: 0, taken: false,
      });
    }
    if (random.chance(0.1)) {
      state.pickups.push({ kind: 'feather', x: FIELD.width + 260, y: 90, taken: false });
    }
  }

  function showBanner(text, seconds) {
    state.banner = text;
    state.bannerTime = seconds;
  }

  function reset() {
    state.time = 0;
    state.distance = 0;
    state.score = 0;
    state.lives = LIVES;
    state.corn = 0;
    state.stageIndex = 0;
    state.speed = SPEED.farmyard;
    state.farmerGap = FARMER.startGap;
    state.dashReady = true;
    state.dashCooldown = 0;
    state.over = null;
    state.banner = '';
    state.bannerTime = 0;
    state.turkey = { y: 0, vy: 0, sliding: 0, dashing: 0, hiding: 0, invulnerable: 0, runPhase: 0 };
    state.obstacles = [];
    state.pickups = [];
    spawnIn = 1.1;
    wasAlarmed = false;
  }

  /**
   * Move a fresh world to `distance` metres in, so a screenshot can stage a
   * late scene: the stage, speed and a clean turkey match that distance,
   * and play continues from there for real.
   */
  function seek(distance) {
    reset();
    state.distance = distance;
    state.stageIndex = stageFor(distance);
    state.speed = speedFor(state.stageIndex);
    state.score = Math.floor(distance);
    state.time = distance / (state.speed / PX_PER_METRE);
    state.farmerGap = 150;
    showBanner('', 0);
  }

  function step(dt, input, attract) {
    let events = 0;
    const t = state.turkey;
    if (state.over) return events;
    state.time += dt;

    // Stage changes as the turkey runs on.
    const nextStage = stageFor(state.distance);
    if (nextStage !== state.stageIndex) {
      state.stageIndex = nextStage;
      showBanner(`STAGE ${nextStage + 1}: ${STAGES[nextStage].name}!`, 2.2);
      events |= EVENT_STAGE;
    }
    const targetSpeed = speedFor(state.stageIndex);
    state.speed += (targetSpeed - state.speed) * Math.min(1, dt * 0.8);
    const speed = t.dashing > 0 ? state.speed + 260 : state.speed;

    // Distance and score: one point per metre run, before bonuses.
    const metres = (speed * dt) / PX_PER_METRE;
    state.distance += metres;
    state.score += metres;

    // Timers.
    if (t.invulnerable > 0) t.invulnerable -= dt;
    if (t.sliding > 0) t.sliding -= dt;
    if (t.dashing > 0) t.dashing -= dt;
    if (t.hiding > 0) t.hiding -= dt;
    if (state.dashCooldown > 0) {
      state.dashCooldown -= dt;
      if (state.dashCooldown <= 0) state.dashReady = true;
    }
    if (state.bannerTime > 0) state.bannerTime -= dt;
    t.runPhase += dt * (speed / 34);

    // The farmer never stops: he gains a little every second, faster late.
    const closing = 5 + state.stageIndex * 2.5;
    state.farmerGap = Math.max(0, state.farmerGap - closing * dt);

    // Player actions (ignored while hiding or in attract mode).
    if (!attract && t.hiding <= 0) {
      if (input.jump && t.y === 0 && t.sliding <= 0) {
        t.vy = TURKEY.jumpVelocity;
        t.y = 0.01;
      }
      if (input.slide && t.y === 0) t.sliding = TURKEY.slideTime;
      if (input.dash && state.dashReady && t.dashing <= 0) {
        t.dashing = TURKEY.dashTime;
        state.dashReady = false;
        state.dashCooldown = TURKEY.dashCooldown;
        state.farmerGap = Math.min(420, state.farmerGap + FARMER.loseOnDash);
      }
      if (input.hide) {
        const hay = state.obstacles.find((ob) => ob.kind === 'haybale'
          && Math.abs(ob.x - TURKEY.x) < 150 && !ob.hit);
        if (hay) {
          t.hiding = TURKEY.hideTime;
          state.farmerGap = Math.min(420, state.farmerGap + FARMER.loseOnHide);
          showBanner('HIDDEN IN THE HAY!', 1.4);
          events |= EVENT_HIDDEN;
        }
      }
    }

    // Turkey vertical physics.
    if (t.y > 0) {
      t.vy -= TURKEY.gravity * dt;
      t.y += t.vy * dt;
      if (t.y <= 0) {
        t.y = 0;
        t.vy = 0;
      }
    }

    // Spawning.
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnObstacle();
      spawnIn = random.range(0.85, 1.35);
    }

    // Move everything left, and drop what scrolled off.
    for (const ob of state.obstacles) ob.x -= speed * dt;
    for (const pk of state.pickups) pk.x -= speed * dt;
    state.obstacles = state.obstacles.filter((ob) => ob.x + OBSTACLES[ob.kind].width > -40);
    state.pickups = state.pickups.filter((pk) => pk.x > -40);

    // Passing an obstacle cleanly scores its dodge points.
    const rect = turkeyRect();
    for (const ob of state.obstacles) {
      if (!ob.passed && ob.x + OBSTACLES[ob.kind].width < TURKEY.x) {
        ob.passed = true;
        if (!ob.hit) state.score += OBSTACLES[ob.kind].points;
      }
    }

    // Pickups.
    for (const pk of state.pickups) {
      if (pk.taken) continue;
      const pr = { x: pk.x - 13, width: 26, bottom: FIELD.groundY - pk.y, height: 26 };
      if (overlaps(rect, pr)) {
        pk.taken = true;
        const def = PICKUPS[pk.kind];
        state.score += def.points;
        state.farmerGap = Math.min(420, state.farmerGap + def.gapBonus);
        if (pk.kind === 'corn') state.corn += 1;
        if (pk.kind === 'feather') {
          state.dashReady = true;
          state.dashCooldown = 0;
        }
        events |= EVENT_PICKUP;
      }
    }
    state.pickups = state.pickups.filter((pk) => !pk.taken);

    // Obstacle hits: a hiding turkey is safe inside the haystack.
    if (t.invulnerable <= 0 && t.hiding <= 0) {
      for (const ob of state.obstacles) {
        if (ob.hit) continue;
        if (overlaps(rect, obstacleRect(ob))) {
          ob.hit = true;
          state.lives -= 1;
          t.invulnerable = TURKEY.invulnerable;
          state.farmerGap = Math.max(0, state.farmerGap - FARMER.lungeOnHit);
          events |= EVENT_HIT;
          if (state.lives <= 0) {
            state.over = 'caught';
            events |= EVENT_OVER;
          }
          break;
        }
      }
    }

    // The farmer's alarm: crossing into the danger gap warns the player.
    const alarmed = state.farmerGap <= FARMER.alarmGap && !state.over;
    if (alarmed && !wasAlarmed) events |= EVENT_SPOTTED;
    wasAlarmed = alarmed;

    // Caught, or escaped to the forest.
    if (!state.over && state.farmerGap <= FARMER.catchGap) {
      state.over = 'caught';
      events |= EVENT_OVER;
    }
    if (!state.over && state.distance >= ESCAPE_DISTANCE) {
      state.over = 'escaped';
      state.score += 200;
      events |= EVENT_OVER;
    }
    return events;
  }

  return { state, reset, seek, step, stageFor, speedFor };
}

export { STEP };
