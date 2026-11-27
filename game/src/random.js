// A tiny seeded random generator (mulberry32), so a seed always deals the
// same farm: the same obstacles, corn and weather, run after run.
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    /** A float in [min, max). */
    range(min, max) {
      return min + next() * (max - min);
    },
    /** An integer in [min, max]. */
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    /** One element of `items`, uniformly. */
    pick(items) {
      return items[Math.floor(next() * items.length)];
    },
    /** True with probability `p`. */
    chance(p) {
      return next() < p;
    },
  };
}
