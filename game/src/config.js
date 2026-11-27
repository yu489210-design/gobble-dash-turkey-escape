// Every tuning number and colour for Gobble Dash, in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it
// to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720, groundY: 618 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** Distance, in metres, the turkey must cover to reach the forest and escape. */
export const ESCAPE_DISTANCE = 1000;
/** Pixels of scroll that count as one metre. */
export const PX_PER_METRE = 30;

export const TURKEY = {
  x: 300,
  width: 74,
  height: 62,
  jumpVelocity: 900,
  gravity: 2200,
  slideTime: 0.8,
  slideHeight: 34,
  dashTime: 0.45,
  dashCooldown: 2.2,
  hideTime: 1.3,
  invulnerable: 1.6,
};

export const FARMER = {
  /** Gap, in pixels, between farmer and turkey when a run starts. */
  startGap: 230,
  /** Gap at which the farmer grabs the turkey. */
  catchGap: 42,
  /** Gap below which the alarm sounds and the screen warns the player. */
  alarmGap: 110,
  /** Pixels the farmer gains on the turkey when it is hit. */
  lungeOnHit: 62,
  /** Pixels the farmer loses when the turkey hides in a haystack. */
  loseOnHide: 190,
  /** Pixels the farmer loses when the turkey dashes. */
  loseOnDash: 46,
};

export const LIVES = 3;

/** Scroll speed, px/s, at each stage; it also sets the metres-per-second. */
export const SPEED = { farmyard: 330, cornfield: 400, kitchen: 470 };

/** Stages by distance: name, from-metre, palette key, spawn table. */
export const STAGES = [
  { name: 'FARMYARD', from: 0, palette: 'farmyard' },
  { name: 'CORNFIELD', from: 300, palette: 'cornfield' },
  { name: 'THE KITCHEN', from: 650, palette: 'kitchen' },
];

/** Obstacle kinds. 'jump' must be jumped over; 'duck' must be slid under. */
export const OBSTACLES = {
  fence: { kind: 'jump', width: 34, height: 74, points: 5 },
  haybale: { kind: 'jump', width: 86, height: 58, points: 5, hideSpot: true },
  pumpkin: { kind: 'jump', width: 62, height: 46, points: 5 },
  scarecrow: { kind: 'jump', width: 44, height: 96, points: 5 },
  oven: { kind: 'jump', width: 96, height: 118, points: 10 },
  knifeRack: { kind: 'duck', width: 110, height: 52, hangY: 96, points: 10 },
  puddle: { kind: 'jump', width: 120, height: 18, points: 5 },
};

export const PICKUPS = {
  corn: { points: 10, gapBonus: 7 },
  pie: { points: 25, gapBonus: 12 },
  feather: { points: 5, gapBonus: 4 },
};

export const PALETTES = {
  farmyard: {
    skyTop: '#ffd98a', skyBottom: '#fff3cf', sun: '#ffcf4d',
    far: '#c98f4e', mid: '#a86f35', ground: '#7fae4e', groundDark: '#5d8a38',
    dirt: '#c99a5b', text: '#3a2410', panel: '#fff8e6', accent: '#e5534b',
  },
  cornfield: {
    skyTop: '#ff9e57', skyBottom: '#ffd9a0', sun: '#ff7a2f',
    far: '#8a5a2e', mid: '#6e4520', ground: '#c98a2e', groundDark: '#9a6520',
    dirt: '#b5772f', text: '#331d08', panel: '#fff3d6', accent: '#e5534b',
  },
  kitchen: {
    skyTop: '#2b2a4a', skyBottom: '#5a3a5e', sun: '#f2e6c9',
    far: '#3a2f45', mid: '#2c2433', ground: '#8a6a4a', groundDark: '#6b4e33',
    dirt: '#a08055', text: '#fff3d6', panel: '#2c2433', accent: '#ff8c42',
  },
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-dash.best';
