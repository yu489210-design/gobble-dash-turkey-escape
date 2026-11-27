// All drawing: one canvas, vector art only, no image files.
// The logical field is 1280x720; the canvas scales to the window.
import { FIELD, FONT, OBSTACLES, PALETTES, PX_PER_METRE, STAGES, TURKEY } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/** Deterministic decor value for index `i` (no Math.random in shots). */
function hash(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 800) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 8);
  ctx.strokeStyle = 'rgba(40,20,5,0.85)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  function skyAndGround(pal, distance, stageIndex) {
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    g.addColorStop(0, pal.skyTop);
    g.addColorStop(1, pal.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    // Sun or moon.
    ctx.fillStyle = pal.sun;
    ctx.beginPath();
    ctx.arc(1120, stageIndex === 2 ? 110 : 96, 44, 0, Math.PI * 2);
    ctx.fill();
    if (stageIndex === 2) {
      ctx.fillStyle = '#2b2a4a';
      ctx.beginPath();
      ctx.arc(1104, 98, 38, 0, Math.PI * 2);
      ctx.fill();
    }
    // Drifting clouds, parallaxed by distance.
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 6; i += 1) {
      const cx = (((i * 260 + 80 - distance * 0.12) % 1400) + 1400) % 1400 - 60;
      const cy = 60 + hash(i) * 130;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 52, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 34, cy + 6, 38, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Far scenery: barn and silo, corn rows, or kitchen windows.
    ctx.fillStyle = pal.far;
    if (stageIndex === 0) {
      ctx.fillRect(120, 470, 190, 148);
      ctx.beginPath();
      ctx.moveTo(100, 472); ctx.lineTo(215, 400); ctx.lineTo(330, 472);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8e0d0';
      ctx.beginPath(); ctx.arc(430, 520, 34, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(398, 520, 64, 98);
    } else if (stageIndex === 1) {
      for (let i = 0; i < 14; i += 1) {
        const cx = 40 + i * 92;
        ctx.fillStyle = i % 2 ? '#7a5a1e' : '#8a6a24';
        ctx.beginPath();
        ctx.moveTo(cx, FIELD.groundY); ctx.lineTo(cx + 12, 480 + hash(i) * 30);
        ctx.lineTo(cx + 24, FIELD.groundY); ctx.closePath(); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#1e1a2e';
      ctx.fillRect(0, 380, FIELD.width, 238);
      for (let i = 0; i < 4; i += 1) {
        ctx.fillStyle = '#ffca6a';
        ctx.fillRect(140 + i * 300, 420, 120, 130);
        ctx.strokeStyle = '#1e1a2e'; ctx.lineWidth = 6;
        ctx.strokeRect(140 + i * 300, 420, 120, 130);
        ctx.beginPath(); ctx.moveTo(200 + i * 300, 420); ctx.lineTo(200 + i * 300, 550);
        ctx.moveTo(140 + i * 300, 485); ctx.lineTo(260 + i * 300, 485); ctx.stroke();
      }
    }
    // Mid-ground fence line, scrolling.
    ctx.strokeStyle = pal.mid;
    ctx.lineWidth = 8;
    const off = distance % 120;
    ctx.beginPath();
    for (let x = -off; x < FIELD.width + 120; x += 120) {
      ctx.moveTo(x, FIELD.groundY - 46); ctx.lineTo(x, FIELD.groundY - 6);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, FIELD.groundY - 34); ctx.lineTo(FIELD.width, FIELD.groundY - 34);
    ctx.moveTo(0, FIELD.groundY - 16); ctx.lineTo(FIELD.width, FIELD.groundY - 16);
    ctx.stroke();
    // Ground.
    ctx.fillStyle = pal.ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = pal.groundDark;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 10);
    ctx.fillStyle = pal.dirt;
    for (let i = 0; i < 24; i += 1) {
      const gx = (((i * 173 - distance * 1.0) % 1400) + 1400) % 1400 - 60;
      ctx.beginPath();
      ctx.ellipse(gx, FIELD.groundY + 34 + hash(i + 40) * 52, 26, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCorn(x, groundY, y, scale = 1) {
    ctx.save();
    ctx.translate(x, groundY - y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath(); ctx.ellipse(0, 0, 13, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9a92e';
    for (let r = -1; r <= 1; r += 1) {
      for (let c = -1; c <= 1; c += 1) {
        ctx.beginPath(); ctx.arc(r * 7, c * 9, 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = '#4e9a3d';
    ctx.beginPath(); ctx.moveTo(-12, 6); ctx.lineTo(-20, 22); ctx.lineTo(-4, 12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, 6); ctx.lineTo(20, 22); ctx.lineTo(4, 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawPie(x, groundY, y) {
    ctx.save();
    ctx.translate(x, groundY - y);
    ctx.fillStyle = '#e8b25a';
    ctx.beginPath(); ctx.moveTo(-16, 10); ctx.lineTo(16, 10); ctx.lineTo(0, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c94f3d';
    ctx.beginPath(); ctx.moveTo(-11, 8); ctx.lineTo(11, 8); ctx.lineTo(0, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, -4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawFeather(x, groundY, y) {
    ctx.save();
    ctx.translate(x, groundY - y);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.ellipse(0, 0, 8, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b8a888'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 20); ctx.stroke();
    ctx.restore();
  }

  function drawObstacle(ob) {
    const def = OBSTACLES[ob.kind];
    const x = ob.x;
    const gy = FIELD.groundY;
    if (ob.kind === 'fence') {
      ctx.fillStyle = '#8a5a2e';
      ctx.fillRect(x, gy - 74, 10, 74);
      ctx.fillRect(x + 24, gy - 74, 10, 74);
      ctx.fillRect(x - 6, gy - 62, 46, 9);
      ctx.fillRect(x - 6, gy - 34, 46, 9);
    } else if (ob.kind === 'haybale') {
      ctx.fillStyle = '#e8c25a';
      roundRect(ctx, x, gy - 58, 86, 58, 26); ctx.fill();
      ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + 43, gy - 29, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 43, gy - 29, 10, 0, Math.PI * 2); ctx.stroke();
    } else if (ob.kind === 'pumpkin') {
      ctx.fillStyle = '#e8722a';
      ctx.beginPath(); ctx.ellipse(x + 31, gy - 23, 31, 23, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c75a17'; ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i += 1) {
        ctx.beginPath(); ctx.ellipse(x + 31 + i * 12, gy - 23, 10, 21, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#4e7a2e';
      ctx.fillRect(x + 27, gy - 52, 8, 12);
    } else if (ob.kind === 'scarecrow') {
      ctx.strokeStyle = '#6e4a22'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(x + 22, gy); ctx.lineTo(x + 22, gy - 96); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 8, gy - 78); ctx.lineTo(x + 52, gy - 78); ctx.stroke();
      ctx.fillStyle = '#5a7ac9';
      ctx.fillRect(x + 2, gy - 82, 40, 44);
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath(); ctx.arc(x + 22, gy - 96, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a5a2e';
      ctx.beginPath(); ctx.ellipse(x + 22, gy - 106, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    } else if (ob.kind === 'oven') {
      ctx.fillStyle = '#3a3f4a';
      roundRect(ctx, x, gy - 118, 96, 118, 8); ctx.fill();
      ctx.fillStyle = '#ff7a2f';
      roundRect(ctx, x + 12, gy - 84, 72, 56, 6); ctx.fill();
      ctx.fillStyle = '#ffd23e';
      roundRect(ctx, x + 22, gy - 74, 52, 36, 4); ctx.fill();
      ctx.fillStyle = '#3a3f4a';
      ctx.beginPath(); ctx.arc(x + 24, gy - 104, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 48, gy - 104, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 72, gy - 104, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = `800 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('HOT!', x + 48, gy - 126);
    } else if (ob.kind === 'knifeRack') {
      ctx.fillStyle = '#6e4a22';
      ctx.fillRect(x, gy - 150, 8, 150);
      ctx.fillRect(x + 102, gy - 150, 8, 150);
      ctx.fillRect(x, gy - 150, 110, 10);
      // A big carving knife hangs low from the rack: slide under it.
      ctx.fillStyle = '#7a4a26';
      ctx.fillRect(x + 44, gy - 100, 22, 12);
      ctx.fillStyle = '#d7dce3';
      ctx.beginPath();
      ctx.moveTo(x + 12, gy - 92); ctx.lineTo(x + 98, gy - 92);
      ctx.lineTo(x + 98, gy - 56); ctx.lineTo(x + 55, gy - 44);
      ctx.lineTo(x + 12, gy - 56); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#9aa2ad'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 12, gy - 92); ctx.lineTo(x + 98, gy - 92); ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(x + 28, gy - 88); ctx.lineTo(x + 62, gy - 88); ctx.lineTo(x + 58, gy - 62); ctx.lineTo(x + 32, gy - 62); ctx.closePath(); ctx.fill();
      // Warning tag so the knife reads at a glance.
      ctx.fillStyle = '#e5534b';
      ctx.beginPath(); ctx.moveTo(x + 55, gy - 168); ctx.lineTo(x + 71, gy - 150); ctx.lineTo(x + 39, gy - 150); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `800 16px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('!', x + 55, gy - 154);
    } else if (ob.kind === 'puddle') {
      ctx.fillStyle = '#7a4a1e';
      ctx.beginPath(); ctx.ellipse(x + 60, gy - 9, 60, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#a8763a';
      ctx.beginPath(); ctx.ellipse(x + 40, gy - 10, 22, 4, 0, 0, Math.PI * 2); ctx.fill();
    }
    void def;
  }

  function drawTurkey(state, xOverride) {
    const t = state.turkey;
    const x = xOverride ?? TURKEY.x;
    const gy = FIELD.groundY - t.y;
    const sliding = t.sliding > 0;
    const hiding = t.hiding > 0;
    const blink = t.invulnerable > 0 && Math.floor(state.time * 12) % 2 === 0;
    ctx.save();
    if (blink) ctx.globalAlpha = 0.35;
    ctx.translate(x, gy);
    if (sliding) {
      ctx.translate(6, -TURKEY.slideHeight / 2);
      ctx.scale(1.25, 0.62);
    }
    const legSwing = Math.sin(t.runPhase) * (t.y > 0 ? 0.2 : 1);
    // Tail fan.
    ctx.fillStyle = '#a0522d';
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.rotate(i * 0.34 - 0.5);
      ctx.beginPath(); ctx.ellipse(-26, -34, 10, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#d2691e';
    for (let i = -1; i <= 1; i += 1) {
      ctx.save();
      ctx.rotate(i * 0.3 - 0.5);
      ctx.beginPath(); ctx.ellipse(-24, -30, 8, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // Legs.
    ctx.strokeStyle = '#e8a33c'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const footY = sliding ? 8 : 0;
    ctx.beginPath();
    ctx.moveTo(-6, -12); ctx.lineTo(-6 + legSwing * 12, footY); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -12); ctx.lineTo(8 - legSwing * 12, footY); ctx.stroke();
    // Body.
    ctx.fillStyle = '#8a5230';
    ctx.beginPath(); ctx.ellipse(0, -30, 34, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a86f3e';
    ctx.beginPath(); ctx.ellipse(6, -24, 22, 16, 0, 0, Math.PI * 2); ctx.fill();
    // Wing.
    ctx.fillStyle = '#6e3f22';
    ctx.beginPath();
    ctx.ellipse(-4, -30 + Math.sin(t.runPhase * 2) * 2, 18, 12, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Head, beak, wattle, eye.
    ctx.fillStyle = '#f5efe0';
    ctx.beginPath(); ctx.arc(28, -56, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8722a';
    ctx.beginPath(); ctx.moveTo(40, -58); ctx.lineTo(54, -52); ctx.lineTo(40, -48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e5534b';
    ctx.beginPath(); ctx.ellipse(34, -44, 5, 9, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(32, -60, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (hiding) {
      // Hay covers the turkey: only its eyes peek out.
      ctx.fillStyle = '#e8c25a';
      roundRect(ctx, x - 34, FIELD.groundY - 52, 92, 52, 22); ctx.fill();
      ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x + 12, FIELD.groundY - 26, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(x + 30, FIELD.groundY - 46, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 40, FIELD.groundY - 46, 3, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawFarmer(state) {
    const gap = state.farmerGap;
    const fx = TURKEY.x - gap - 62;
    if (fx < -90) return;
    const gy = FIELD.groundY;
    const swing = Math.sin(state.turkey.runPhase * 1.15);
    ctx.save();
    ctx.translate(fx, gy);
    // Pitchfork, held high behind him.
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(-34, -118); ctx.stroke();
    ctx.strokeStyle = '#d7dce3'; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath(); ctx.moveTo(-34 + i * 8, -118); ctx.lineTo(-34 + i * 8, -132); ctx.stroke();
    }
    // Legs: overalls.
    ctx.strokeStyle = '#3a5a8a'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(-4, -52); ctx.lineTo(-4 + swing * 16, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(10, -52); ctx.lineTo(10 - swing * 16, 0); ctx.stroke();
    // Body: red plaid shirt, overalls.
    ctx.fillStyle = '#c94f3d';
    roundRect(ctx, -16, -104, 44, 56, 10); ctx.fill();
    ctx.fillStyle = '#3a5a8a';
    ctx.fillRect(-14, -58, 40, 14);
    // Arms pumping.
    ctx.strokeStyle = '#c94f3d'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(24, -92); ctx.lineTo(38, -70 + swing * 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12, -92); ctx.lineTo(-26, -70 - swing * 10); ctx.stroke();
    // Head with straw hat and angry brows.
    ctx.fillStyle = '#f2c9a0';
    ctx.beginPath(); ctx.arc(8, -122, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8c25a';
    ctx.beginPath(); ctx.ellipse(8, -134, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(-6, -152, 28, 20);
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -128); ctx.lineTo(10, -124); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -128); ctx.lineTo(10, -124); ctx.stroke();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(2, -120, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(15, -120, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (gap <= 110) {
      text(ctx, '!', fx + 10, FIELD.groundY - 178, 44, '#ff3b30');
      text(ctx, "HE'S CLOSE!", 640, 150, 30, '#ff3b30');
    }
  }

  function drawHud(state, best) {
    const pal = PALETTES[STAGES[state.stageIndex].palette];
    ctx.fillStyle = 'rgba(20,12,4,0.55)';
    roundRect(ctx, 12, 12, 1256, 56, 12); ctx.fill();
    ctx.font = `800 22px ${FONT}`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 30, 40);
    ctx.fillStyle = '#ffd23e';
    ctx.fillText(`🌽 ${state.corn}`, 250, 40);
    // Distance progress: farm on the left, forest on the right.
    const px = 420;
    const pw = 380;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(ctx, px, 32, pw, 12, 6); ctx.fill();
    ctx.fillStyle = '#7ddb6a';
    roundRect(ctx, px, 32, pw * Math.min(1, state.distance / 1000), 12, 6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 18px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(state.distance)} m / 1000 m`, px + pw / 2, 62);
    ctx.font = `800 15px ${FONT}`;
    ctx.fillText('🏠', px - 16, 38);
    ctx.fillText('🌲', px + pw + 18, 38);
    // Stage and lives.
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = `800 20px ${FONT}`;
    ctx.fillText(STAGES[state.stageIndex].name, 1050, 32);
    ctx.fillStyle = '#ff5a6e';
    ctx.font = `800 24px ${FONT}`;
    ctx.fillText('♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, 3 - state.lives)), 1050, 58);
    // Farmer gap bar + dash meter.
    const gapFrac = Math.max(0, Math.min(1, state.farmerGap / 420));
    ctx.textAlign = 'left';
    ctx.font = `800 14px ${FONT}`;
    ctx.fillStyle = '#ffb3ab';
    ctx.fillText('FARMER', 1090, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(ctx, 1090, 34, 150, 10, 5); ctx.fill();
    ctx.fillStyle = gapFrac > 0.4 ? '#7ddb6a' : gapFrac > 0.2 ? '#ffd23e' : '#ff3b30';
    roundRect(ctx, 1090, 34, 150 * gapFrac, 10, 5); ctx.fill();
    ctx.fillStyle = '#cfe8ff';
    ctx.fillText(state.dashReady ? 'DASH READY (Shift)' : 'DASH…', 1090, 62);
    if (best > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `800 15px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(`BEST ${best}`, 1256, 96);
    }
    void pal;
    // Banner.
    if (state.bannerTime > 0 && state.banner) {
      text(ctx, state.banner, 640, 190, 40, '#fff');
    }
  }

  function drawPanel(title, lines, accent) {
    ctx.fillStyle = 'rgba(15,10,4,0.62)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fff8e6';
    roundRect(ctx, 290, 130, 700, 440, 20); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 6;
    roundRect(ctx, 290, 130, 700, 440, 20); ctx.stroke();
    text(ctx, title, 640, 190, 54, accent);
    lines.forEach((line, i) => {
      text(ctx, line, 640, 260 + i * 44, 24, '#3a2410');
    });
  }

  function draw(state, screen, best, overKind) {
    const pal = PALETTES[STAGES[state.stageIndex].palette];
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    skyAndGround(pal, state.distance * PX_PER_METRE * 0.6, state.stageIndex);
    for (const pk of state.pickups) {
      if (pk.kind === 'corn') drawCorn(pk.x, FIELD.groundY, pk.y);
      else if (pk.kind === 'pie') drawPie(pk.x, FIELD.groundY, pk.y);
      else drawFeather(pk.x, FIELD.groundY, pk.y);
    }
    for (const ob of state.obstacles) drawObstacle(ob);
    if (screen !== SCREEN_TITLE) drawFarmer(state);
    drawTurkey(state);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state, best);
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(20,12,4,0.45)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      text(ctx, 'GOBBLE DASH', 640, 150, 84, '#ffd23e');
      text(ctx, 'The Great Thanksgiving Escape', 640, 216, 32, '#fff');
      text(ctx, 'The farmer wants you for dinner. Run 1000 m to the forest!', 640, 290, 24, '#fff');
      text(ctx, 'SPACE / ↑ jump    ↓ slide    SHIFT dash    H hide in hay', 640, 350, 22, '#ffe9a8');
      text(ctx, 'Jump fences & ovens — slide under carving knives — grab corn', 640, 388, 22, '#ffe9a8');
      text(ctx, 'PRESS SPACE OR CLICK TO RUN', 640, 470, 30, '#7ddb6a');
      if (best > 0) text(ctx, `BEST SCORE ${best}`, 640, 520, 22, '#fff');
      text(ctx, 'A turkey, a farmer, one oven too many.', 640, 580, 18, 'rgba(255,255,255,0.8)', 'center', 600);
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['Take a breath. The farmer waits for no turkey.', 'Press P or Space to keep running.'], '#ffd23e');
    } else if (screen === SCREEN_OVER) {
      if (overKind === 'escaped') {
        drawPanel('ESCAPED!', [
          'You made it to the forest — 1000 m of pure gobble.',
          `Score ${Math.floor(state.score)}   •   Corn ${state.corn}   •   Best ${Math.max(best, Math.floor(state.score))}`,
          'The farmer is still looking. Let him.',
          'Press R or click to run again.',
        ], '#4caf50');
      } else {
        drawPanel('CAUGHT!', [
          'The farmer got you. Dinner is served... almost.',
          `Score ${Math.floor(state.score)}   •   Distance ${Math.floor(state.distance)} m   •   Best ${Math.max(best, Math.floor(state.score))}`,
          'Tip: hide in a haystack (H) when he gets close.',
          'Press R or click to run again.',
        ], '#e5534b');
      }
    }
  }

  return { draw, resize };
}
