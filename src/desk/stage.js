/* MIMEI · DESK/STAGE — ported from proto/crane/desk.
   Stage: the 4K plate cover-fits the screen with a little overscan, the camera breathes very slowly,
   and the crane hook (with the sign) sways on its long cable. Every layer is positioned with its own
   matrix (no transformed wrapper), so the LED glow can screen-blend straight onto the city. */
import { noise1, clamp } from './clock.js';

export const PW = 3840, PH = 2160;
const OVERSCAN = 1.012;
/* The hook block's left edge (plate x ~565 between y 80 and 330). On a 16:10 MacBook a centred crop pushes the hook
   under the menu's top-left block; keepClear (css px, from the UI) shifts the crop right until the hook is clear. */
const HOOK_LEFT = 565;

/* 2-D affine [a b c d e f] — same order as CSS matrix() */
export const M2 = {
  mul: (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]],
  T: (x, y) => [1, 0, 0, 1, x, y],
  S: (s) => [s, 0, 0, s, 0, 0],
  R: (r) => [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0],
  ap: (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]],
  about: (p, m) => M2.mul(M2.T(p[0], p[1]), M2.mul(m, M2.T(-p[0], -p[1]))),
};
const I = [1, 0, 0, 1, 0, 0];
const css = (m) => `matrix(${m[0].toFixed(6)},${m[1].toFixed(6)},${m[2].toFixed(6)},${m[3].toFixed(6)},${m[4].toFixed(3)},${m[5].toFixed(3)})`;

/* the rig: a long cable from far above the frame, the hook block, the sign hanging under it */
const PIVOT = [650, -9000], HOOK = [650, 500], DEPTH_C = [650, 600];
const SWAY = 1.0e-3, ROCK = .006, DEPTH = .002;      /* ~10 plate px of swing at the sign, a 0.3° rock */

export class Stage {
  constructor() {
    this.items = []; this.W = innerWidth; this.H = innerHeight;
    this.cam = I; this.rig = I; this.motion = 'full'; this.swayK = 1; this.swayTarget = 1;
    this.nA = noise1(11); this.nB = noise1(23); this.nC = noise1(37);
    this.theta = 0; this.thetaV = 0; this.extremes = []; this.keepClear = 0;
    addEventListener('resize', () => { this.W = innerWidth; this.H = innerHeight; });
  }
  /* local = placement in plate px; rig = moves with the hook */
  add(el, local = I, rig = false) {
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', transformOrigin: '0 0', willChange: 'transform' });
    this.items.push({ el, local, rig, last: '' }); return el;
  }
  remove(el) { this.items = this.items.filter((it) => it.el !== el); }
  /* plate scale on screen */
  get s() { return this.cam[0]; }
  update(t, dt) {
    const { W, H } = this, full = this.motion === 'full', calm = this.motion === 'calm', still = this.motion === 'still';
    /* camera */
    const base = Math.max(W / PW, H / PH) * OVERSCAN;
    const z = still ? 1 : 1 + (calm ? .0015 : .0035) * Math.sin(2 * Math.PI * t / 53);
    const dx = still ? 0 : (calm ? 5 : 12) * Math.sin(2 * Math.PI * t / 61 + 1), dy = still ? 0 : (calm ? 3 : 7) * Math.sin(2 * Math.PI * t / 47 + 2);
    const s = base * z;
    let tx = (W - PW * s) / 2 - dx * s, ty = (H - PH * s) / 2 - dy * s;
    tx = Math.max(tx, this.keepClear - HOOK_LEFT * s);
    tx = clamp(tx, W - PW * s, 0); ty = clamp(ty, H - PH * s, 0);
    this.cam = [s, 0, 0, s, tx, ty];
    /* rig sway (pendulum period ~9.6 s, a gusty envelope), rock of the sign under the hook, a hint of depth */
    this.swayK += (this.swayTarget - this.swayK) * Math.min(1, dt * 1.5);
    const k = still ? 0 : this.swayK * (calm ? .45 : 1);
    const gust = .72 + .28 * this.nA(t / 7.3), w = 2 * Math.PI / 9.6;
    const th = SWAY * k * gust * (Math.sin(w * t) + .18 * Math.sin(2.13 * w * t + 1.7));
    const ph = ROCK * k * (.6 + .4 * this.nB(t / 5.1)) * Math.sin(2 * Math.PI * t / 3.3 + .6);
    const sg = 1 + DEPTH * k * Math.cos(w * t);
    this.rig = M2.mul(M2.about(PIVOT, M2.R(th)), M2.mul(M2.about(DEPTH_C, M2.S(sg)), M2.about(HOOK, M2.R(ph))));
    /* sway extremes (for chain creaks) */
    const v = (th - this.theta) / Math.max(dt, 1e-4);
    if (dt > 0 && Math.sign(v) !== Math.sign(this.thetaV) && this.thetaV !== 0 && Math.abs(th) > SWAY * .55) this.extremes.push({ t, side: Math.sign(th), amt: Math.abs(th) / SWAY });
    this.theta = th; this.thetaV = v || this.thetaV;
    const camRig = M2.mul(this.cam, this.rig);
    for (const it of this.items) {
      const m = M2.mul(it.rig ? camRig : this.cam, it.local), c = css(m);
      if (c !== it.last) { it.el.style.transform = c; it.last = c; }
    }
  }
  /* plate point -> screen px */
  toScreen(x, y, rig = false) { return M2.ap(rig ? M2.mul(this.cam, this.rig) : this.cam, x, y); }
  takeExtremes() { const e = this.extremes; this.extremes = []; return e; }
}
