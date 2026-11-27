// All sound is synthesized with WebAudio: no audio files, no network.
// The context is created on the first user gesture, so browsers allow it.
export function createAudio() {
  let context = null;
  let muted = false;
  let alarmTimer = null;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') void context.resume();
      return context;
    }
    try {
      const Ctor = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    } catch {
      context = null;
    }
    return context;
  }

  /** A short oscillator blip that slides from `fromHz` to `toHz`. */
  function blip(fromHz, toHz, seconds, type, gain) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromHz, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), now + seconds);
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.001, now + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  }

  /** Two quick descending clucks: the turkey's own voice. */
  function gobbleSound() {
    blip(520, 260, 0.09, 'square', 0.10);
    setTimeout(() => blip(440, 200, 0.12, 'square', 0.10), 90);
  }

  return {
    unlock() {
      ensure();
    },
    setMuted(value) {
      muted = value;
    },
    isMuted() {
      return muted;
    },
    gobble() {
      gobbleSound();
    },
    jump() {
      blip(280, 620, 0.16, 'sine', 0.12);
    },
    slide() {
      blip(500, 180, 0.14, 'triangle', 0.08);
    },
    dash() {
      blip(200, 900, 0.18, 'sawtooth', 0.07);
    },
    corn() {
      blip(880, 1320, 0.09, 'sine', 0.10);
    },
    pie() {
      blip(660, 990, 0.12, 'sine', 0.12);
      setTimeout(() => blip(990, 1320, 0.14, 'sine', 0.12), 110);
    },
    hit() {
      blip(160, 60, 0.28, 'sawtooth', 0.16);
    },
    hide() {
      blip(700, 500, 0.12, 'triangle', 0.08);
    },
    click() {
      blip(700, 700, 0.05, 'square', 0.06);
    },
    caught() {
      [392, 311, 233, 175].forEach((hz, i) => {
        setTimeout(() => blip(hz, hz * 0.9, 0.22, 'triangle', 0.14), i * 170);
      });
    },
    escaped() {
      [523, 659, 784, 1047].forEach((hz, i) => {
        setTimeout(() => blip(hz, hz, 0.2, 'sine', 0.13), i * 130);
      });
      setTimeout(gobbleSound, 560);
    },
    /** A repeating two-note alarm while the farmer is close; call stopAlarm to end it. */
    startAlarm() {
      if (alarmTimer !== null) return;
      alarmTimer = setInterval(() => {
        blip(740, 740, 0.09, 'square', 0.05);
        setTimeout(() => blip(560, 560, 0.09, 'square', 0.05), 120);
      }, 480);
    },
    stopAlarm() {
      if (alarmTimer !== null) {
        clearInterval(alarmTimer);
        alarmTimer = null;
      }
    },
  };
}
