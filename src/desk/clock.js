/* MIMEI · DESK/CLOCK — ported from proto/crane/desk.
   One clock for everything. Live: requestAnimationFrame. Film (?manual): window.STEP(dt) advances virtual time,
   so every animation (and every fade) is frame-exact when recorded. No CSS transitions anywhere. */
const subs = new Set();
export const clock = { t: 0, dt: 0, manual: new URLSearchParams(location.search).has('manual') };
export const onFrame = (fn) => { subs.add(fn); return () => subs.delete(fn); };
function tick(dt) { clock.dt = Math.min(Math.max(dt, 0), 0.1); clock.t += clock.dt; for (const f of [...subs]) f(clock.t, clock.dt); }
let raf = 0, running = false;
/* start (or resume) the frame loop; stopClock() holds it, so a desk nobody is looking at costs nothing */
export function startClock() {
  if (clock.manual) { window.STEP = (dt) => tick(dt); return; }
  if (running) return;
  running = true;
  let last = performance.now();
  const loop = (now) => { if (!running) return; tick((now - last) / 1000); last = now; raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
}
export function stopClock() { running = false; cancelAnimationFrame(raf); raf = 0; }
export const clockRunning = () => running || clock.manual;
export const ease = {
  io: (k) => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2,
  sine: (k) => -(Math.cos(Math.PI * k) - 1) / 2,
  out: (k) => 1 - Math.pow(1 - k, 3), in: (k) => k * k * k, lin: (k) => k,
};
/* tween in clock time; resolves when done */
export function tween(dur, fn, e = ease.io) {
  return new Promise((res) => {
    const t0 = clock.t; fn(0, 0);
    if (dur <= 0) { fn(1, 1); res(); return; }
    const off = onFrame((t) => { const k = Math.min(1, (t - t0) / dur); fn(e(k), k); if (k >= 1) { off(); res(); } });
  });
}
export const wait = (s) => tween(s, () => {}, ease.lin);
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
/* seeded PRNG so the film is the same every time */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* smooth 1-D value noise in [-1, 1] (deterministic) */
export function noise1(seed = 7) {
  const r = rng(seed), N = 256, v = Float32Array.from({ length: N }, () => r() * 2 - 1);
  return (x) => { const i = Math.floor(x), f = x - i, a = v[((i % N) + N) % N], b = v[(((i + 1) % N) + N) % N], s = f * f * (3 - 2 * f); return a + (b - a) * s; };
}
