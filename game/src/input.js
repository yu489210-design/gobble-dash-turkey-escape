// Keyboard and mouse input, read once per frame by the main loop.
// Actions are latched until taken, so a quick key press is never lost
// between frames; held keys report their direction every frame.
export const ACTION_JUMP = 1;
export const ACTION_SLIDE = 2;
export const ACTION_DASH = 4;
export const ACTION_HIDE = 8;
export const ACTION_CONFIRM = 16;
export const ACTION_PAUSE = 32;
export const ACTION_RESTART = 64;
export const ACTION_MUTE = 128;

const KEY_ACTIONS = {
  Space: ACTION_JUMP | ACTION_CONFIRM,
  ArrowUp: ACTION_JUMP,
  KeyW: ACTION_JUMP,
  ArrowDown: ACTION_SLIDE,
  KeyS: ACTION_SLIDE,
  ShiftLeft: ACTION_DASH,
  ShiftRight: ACTION_DASH,
  KeyH: ACTION_HIDE,
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyR: ACTION_RESTART,
  KeyM: ACTION_MUTE,
};

export function createInput(canvas, onFirstGesture) {
  let latched = 0;
  let slideHeld = false;
  let gestured = false;

  function gesture() {
    if (gestured) return;
    gestured = true;
    if (onFirstGesture) onFirstGesture();
  }

  function keyDown(event) {
    const action = KEY_ACTIONS[event.code];
    if (action === undefined) return;
    event.preventDefault();
    gesture();
    latched |= action;
    if (action & ACTION_SLIDE) slideHeld = true;
  }

  function keyUp(event) {
    if (event.code === 'ArrowDown' || event.code === 'KeyS') slideHeld = false;
  }

  function pointerDown(event) {
    gesture();
    // A click is a jump while playing, and a confirm on menus.
    latched |= ACTION_JUMP | ACTION_CONFIRM;
    void event;
  }

  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  canvas.addEventListener('pointerdown', pointerDown);

  return {
    /** Actions latched since the last call, then cleared. */
    takeActions() {
      const actions = latched;
      latched = 0;
      return actions;
    },
    /** Whether the slide key is held down right now. */
    isSlideHeld() {
      return slideHeld;
    },
    /** Stop listening (used only by tests that boot twice). */
    dispose() {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      canvas.removeEventListener('pointerdown', pointerDown);
    },
  };
}
