/* MIMEI · UI/DRIFT — slow, out-of-focus traffic behind the glass.
   Workspaces 2–4 stand on the soft city wall. This gives the city a little life: a few headlights
   and tail-lights drifting along the plate's highway light trails as soft round glows (bokeh), at
   under half the desk's speed. One canvas in #wall, under the veil, so the veil dims it with the city.
   Nothing on workspace 1 (the desk has its own life), nothing while the tab is hidden or booting.
   Budget: at most 24 fps at fx 3 and 2, 12 at fx 1, one still frame at fx 0 or with reduced motion.
   No allocation per frame: the sprites are drawn once, the cars are pooled, the roads are typed
   arrays, and the backing store is half the CSS size (the glows are soft anyway).
   The plate is 3840×2160 and the wall shows it with object-fit: cover at 50% 62% (41-cab.css), so a
   plate point (px, py) lands at x = (vw − 3840s)·0.5 + px·s, y = (vh − 2160s)·0.62 + py·s, with
   s = max(vw/3840, vh/2160). With parallax on, 43-glass.css moves the canvas with the wall image. */
import { ROADS } from '../desk/roads.js';
import { fxLevel, onFx } from '../core/effects.js';

const PW = 3840, PH = 2160, POS_X = .5, POS_Y = .62;
const DS = .5;          // the backing store, of the CSS size
const SPEED = .42;      // of the desk's speeds
const GAP = 2.1;        // of the desk's spawn gaps: a modest stream
const PER_LANE = 7;
/* the desk's lanes (desk/life.js): road, lane offset (plate px), direction, speed range, spawn gap range */
const LANES = [
  ['R1', -4, 1, [110, 160], [.9, 2.2]], ['R1', 4, -1, [100, 150], [1.2, 2.8]],
  ['R2', -4, 1, [120, 170], [.8, 2]], ['R2', 4, -1, [110, 160], [1.1, 2.6]],
  ['U1', -3, 1, [150, 220], [1, 2.6]], ['U1', 3, -1, [150, 220], [1.2, 3]],
  ['U2', -3, 1, [140, 210], [.9, 2.4]], ['U2', 3, -1, [140, 200], [1.3, 3]],
  ['RS', -4, 1, [100, 150], [1, 2.4]], ['RS', 4, -1, [100, 150], [1.4, 3]],
];
/* warm white one way, deep red the other; Late is dimmer and sparser, Ice much fainter and greyer */
const SCENES = {
  night: { alpha: 1, gap: 1, warm: [255, 234, 204], red: [255, 64, 48], blend: 'lighter' },
  late: { alpha: .72, gap: 1.5, warm: [255, 226, 192], red: [232, 54, 44], blend: 'lighter' },
  ice: { alpha: .4, gap: 1.25, warm: [232, 238, 246], red: [196, 112, 118], blend: 'source-over' },
};
const rmq = matchMedia('(prefers-reduced-motion: reduce)');

let cv = null, ctx = null, lanes = [], mounted = false;
const spr = { warm: null, red: null };
let S = 1, OX = 0, OY = 0;
let raf = 0, last = 0, running = false, frames = 0, fpsT = 0, fps = 0, alive = 0;
let scene = 'night', motion = 'off';
const P = { x: 0, y: 0 };

function makeRoad(pts) {
  const n = pts.length, xs = new Float32Array(n), ys = new Float32Array(n), d = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    xs[i] = pts[i][0]; ys[i] = pts[i][1];
    if (i) d[i] = d[i - 1] + Math.hypot(xs[i] - xs[i - 1], ys[i] - ys[i - 1]);
  }
  return { n, xs, ys, d, len: d[n - 1] };
}

/* where car c is (plate px), into P; each car keeps its segment, so the walk is short */
function place(R, c, lane) {
  const s = c.s < 0 ? 0 : c.s > R.len ? R.len : c.s;
  let i = c.i < 1 ? 1 : c.i > R.n - 1 ? R.n - 1 : c.i;
  while (i < R.n - 1 && R.d[i] < s) i++;
  while (i > 1 && R.d[i - 1] > s) i--;
  c.i = i;
  const x0 = R.xs[i - 1], y0 = R.ys[i - 1], dx = R.xs[i] - x0, dy = R.ys[i] - y0;
  const k = (s - R.d[i - 1]) / ((R.d[i] - R.d[i - 1]) || 1), L = Math.hypot(dx, dy) || 1;
  P.x = x0 + dx * k - dy / L * lane;
  P.y = y0 + dy * k + dx / L * lane;
}

function sprite([r, g, b]) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d'), grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(.45, `rgba(${r},${g},${b},.82)`);
  grad.addColorStop(.75, `rgba(${r},${g},${b},.3)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = grad;
  x.fillRect(0, 0, 64, 64);
  return c;
}
function paintSprites() { const sc = SCENES[scene]; spr.warm = sprite(sc.warm); spr.red = sprite(sc.red); }

function spawn(L) {
  for (let i = 0; i < L.cars.length; i++) {
    const c = L.cars[i];
    if (c.on) continue;
    c.on = true;
    c.s = L.dir > 0 ? 0 : L.R.len;
    c.i = L.dir > 0 ? 1 : L.R.n - 1;
    c.v = (L.sp[0] + Math.random() * (L.sp[1] - L.sp[0])) * SPEED;
    c.r = 12 + Math.random() * 10;      // plate px: about 5–9 CSS px at 1440×900
    c.a = .14 + Math.random() * .2;
    return;
  }
}

function advance(dt) {
  const g = SCENES[scene].gap * GAP;
  for (let li = 0; li < lanes.length; li++) {
    const L = lanes[li];
    L.next -= dt;
    if (L.next <= 0) { spawn(L); L.next = (L.gap[0] + Math.random() * (L.gap[1] - L.gap[0])) * g; }
    for (let ci = 0; ci < L.cars.length; ci++) {
      const c = L.cars[ci];
      if (!c.on) continue;
      c.s += c.v * L.dir * dt;
      if (c.s < 0 || c.s > L.R.len) c.on = false;
    }
  }
}

function draw() {
  const sc = SCENES[scene], k = S * DS, W = cv.width, H = cv.height;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, H);
  ctx.globalCompositeOperation = sc.blend;
  let n = 0;
  for (let li = 0; li < lanes.length; li++) {
    const L = lanes[li], img = L.dir > 0 ? spr.warm : spr.red;
    for (let ci = 0; ci < L.cars.length; ci++) {
      const c = L.cars[ci];
      if (!c.on) continue;
      place(L.R, c, L.lane);
      const r = c.r * k, x = (OX + P.x * S) * DS, y = (OY + P.y * S) * DS;
      if (x < -r || y < -r || x > W + r || y > H + r) continue;
      const edge = Math.min(c.s, L.R.len - c.s);   // fade in and out at the ends of the trace
      ctx.globalAlpha = c.a * sc.alpha * (edge >= 90 ? 1 : edge / 90);
      ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
      n++;
    }
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  alive = n;
}

function resize() {
  if (!cv) return;
  const wall = cv.parentElement;
  const vw = (wall && wall.clientWidth) || innerWidth, vh = (wall && wall.clientHeight) || innerHeight;
  S = Math.max(vw / PW, vh / PH);
  OX = (vw - PW * S) * POS_X;
  OY = (vh - PH * S) * POS_Y;
  const w = Math.max(1, Math.round(vw * DS)), h = Math.max(1, Math.round(vh * DS));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  if (motion === 'still') draw();
}

const wanted = () => {
  const b = document.body;
  return !!cv && /^[234]$/.test(b.dataset.ws || '') && document.visibilityState === 'visible' && !b.classList.contains('booting');
};
const cap = () => { const l = fxLevel(); return l >= 2 ? 24 : l === 1 ? 12 : 0; };

function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; fps = 0; }

function tick(now) {
  raf = 0;
  if (!running) return;
  const c = cap();
  if (!c) { sync(); return; }
  const step = 1000 / c, dt = now - last;
  if (dt >= step - 2) {
    last = now - (dt >= step ? dt % step : 0);
    advance(Math.min(dt, 250) / 1000);
    draw();
    frames++;
  }
  if (now - fpsT >= 1000) { fps = Math.round(frames * 1000 / (now - fpsT)); frames = 0; fpsT = now; }
  raf = requestAnimationFrame(tick);
}

function sync() {
  if (!cv) return;
  const want = document.body.dataset.scene || document.documentElement.dataset.scene;
  const next = SCENES[want] ? want : 'night';
  if (next !== scene) { scene = next; paintSprites(); }
  if (!wanted()) {
    stop();
    if (motion !== 'off') { ctx.clearRect(0, 0, cv.width, cv.height); motion = 'off'; alive = 0; }
    return;
  }
  if (!cap() || rmq.matches) { stop(); motion = 'still'; draw(); return; }
  motion = 'drift';
  if (!running) { running = true; last = performance.now(); fpsT = last; frames = 0; raf = requestAnimationFrame(tick); }
}

/** Put the canvas in #wall and start watching the workspace, the scene and the effects level. */
export function mountDrift() {
  if (mounted) return driftReport();
  const wall = document.getElementById('wall');
  if (!wall) return null;
  mounted = true;
  cv = document.createElement('canvas');
  cv.className = 'wall-drift';
  cv.setAttribute('aria-hidden', 'true');
  const img = document.getElementById('wall-img');
  if (img && img.parentElement === wall) img.after(cv); else wall.prepend(cv);
  ctx = cv.getContext('2d');
  const roads = {};
  for (const k of Object.keys(ROADS)) roads[k] = makeRoad(ROADS[k]);
  lanes = LANES.filter(l => roads[l[0]]).map(([k, lane, dir, sp, gap]) => ({
    R: roads[k], lane, dir, sp, gap, next: Math.random() * gap[1] * GAP,
    cars: Array.from({ length: PER_LANE }, () => ({ on: false, s: 0, i: 1, v: 0, r: 0, a: 0 })),
  }));
  const want = document.body.dataset.scene || document.documentElement.dataset.scene;
  scene = SCENES[want] ? want : 'night';
  paintSprites();
  for (let t = 0; t < 150; t++) advance(.2);   // the roads are already busy when you arrive
  resize();
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['data-ws', 'data-scene', 'class'] });
  document.addEventListener('visibilitychange', sync);
  addEventListener('resize', resize, { passive: true });
  onFx(sync);
  if (rmq.addEventListener) rmq.addEventListener('change', sync);
  sync();
  return driftReport();
}

export const driftReport = () => ({ running, fps, cars: alive, scene, motion, lanes: lanes.length });
