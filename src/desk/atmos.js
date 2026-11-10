/* MIMEI · DESK/ATMOS — ported from proto/crane/desk.
   Atmosphere behind the rig, drawn at 1/4 plate resolution: low cloud drifting through the sky (lit by the moon),
   fog banks at 3 a.m., haze in the snow, steam from the roofs, and the red aviation lights on the towers.
   Everything is an overlay on the photo — nothing is cut out of it. Seeded, so every run is the same. */
import { rng, noise1, clamp, smooth } from './clock.js';

export const Q = 4, AW = 960, AH = 540;
const PATS = new WeakMap();
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* tileable value-noise fbm, n x n, normalised 0..1 */
function fbm(n, seed, cells = 4, oct = 5, gain = .5) {
  const r = rng(seed), out = new Float32Array(n * n); let amp = 1;
  for (let o = 0; o < oct; o++, amp *= gain) {
    const g = cells << o, v = Float32Array.from({ length: g * g }, () => r());
    for (let y = 0; y < n; y++) { const fy = y / n * g, iy = Math.floor(fy), ty = fy - iy, sy = ty * ty * (3 - 2 * ty), y0 = iy % g, y1 = (iy + 1) % g;
      for (let x = 0; x < n; x++) { const fx = x / n * g, ix = Math.floor(fx), tx = fx - ix, sx = tx * tx * (3 - 2 * tx), x0 = ix % g, x1 = (ix + 1) % g;
        const a = v[y0 * g + x0] + (v[y0 * g + x1] - v[y0 * g + x0]) * sx, b = v[y1 * g + x0] + (v[y1 * g + x1] - v[y1 * g + x0]) * sx;
        out[y * n + x] += amp * (a + (b - a) * sy); } }
  }
  let lo = Infinity, hi = -Infinity; for (const v of out) { if (v < lo) lo = v; if (v > hi) hi = v; }
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) / (hi - lo);
  return out;
}
/* noise -> an RGBA tile of one colour, alpha from a curve */
function tile(n, vals, [r, g, b], curve) {
  const c = mk(n, n), x = c.getContext('2d'), im = x.createImageData(n, n);
  for (let i = 0; i < n * n; i++) { im.data[4 * i] = r; im.data[4 * i + 1] = g; im.data[4 * i + 2] = b; im.data[4 * i + 3] = Math.round(255 * clamp(curve(vals[i]))); }
  x.putImageData(im, 0, 0); return c;
}
/* grey mask image -> alpha mask canvas */
function alphaMask(img) {
  const c = mk(AW, AH), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, AW, AH);
  const im = x.getImageData(0, 0, AW, AH); for (let i = 0; i < AW * AH; i++) { im.data[4 * i + 3] = im.data[4 * i]; im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = 255; }
  x.putImageData(im, 0, 0); return c;
}
function puffSprite([r, g, b]) {
  const c = mk(64, 64), x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(.45, `rgba(${r},${g},${b},.55)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c;
}
function beaconSprite() {
  const c = mk(48, 48), x = c.getContext('2d'), gr = x.createRadialGradient(24, 24, 0, 24, 24, 24);
  gr.addColorStop(0, 'rgba(255,150,130,1)'); gr.addColorStop(.12, 'rgba(255,70,52,.75)'); gr.addColorStop(.4, 'rgba(255,52,40,.22)'); gr.addColorStop(1, 'rgba(255,40,30,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 48, 48); return c;
}

/* roof vents (plate px): x, y, drift direction, strength */
const VENTS = {
  night: [[605, 1480, -1, .12], [2473, 1316, 1, .1], [2860, 1487, 1, .1], [3253, 615, -.4, .07], [2160, 1880, 1, .13]],
  ice: [[612, 1455, -1, .14], [2478, 1300, 1, .1], [2840, 1455, 1, .11], [3253, 615, -.4, .05], [2168, 1868, 1, .14]],
};
VENTS.late = VENTS.night;
const BEACONS = { night: [[2541, 529], [3309, 534], [3134, 560], [2860, 562], [3806, 630], [3279, 632], [167, 758], [3834, 759]] };
BEACONS.late = [...BEACONS.night, [2447, 534], [2574, 621], [3305, 707]];
BEACONS.ice = [];

export class Atmos {
  constructor(kind, { sky, fog } = {}, seed = 5) {
    this.kind = kind; this.cv = mk(AW, AH); this.c = this.cv.getContext('2d'); this.motion = 'full';
    const r = this.r = rng(seed);
    const N = 256;
    if (kind !== 'ice') {
      this.nA = fbm(N, seed + 1, 3, 5); this.nB = fbm(N, seed + 2, 6, 4);
      const col = kind === 'late' ? [104, 120, 146] : [96, 114, 146];
      const cv = (v) => Math.pow(clamp((v - .4) / .42), 1.4);
      this.cloudA = tile(N, this.nA, col, cv); this.cloudB = tile(N, this.nB, col, cv);
      this.skyMask = sky ? alphaMask(sky) : null; this.work = mk(AW, AH); this.wc = this.work.getContext('2d');
    }
    if (kind === 'late') {
      const nf = fbm(N, seed + 3, 3, 4), ng = fbm(N, seed + 4, 5, 3);
      this.fogA = tile(N, nf, [178, 190, 210], (v) => .35 + .65 * v); this.fogB = tile(N, ng, [178, 190, 210], (v) => clamp((v - .3) / .7));
      this.fogMask = fog ? alphaMask(fog) : null; this.work2 = mk(AW, AH); this.wc2 = this.work2.getContext('2d');
    }
    if (kind === 'ice') {
      const nh = fbm(N, seed + 5, 3, 4), ni = fbm(N, seed + 6, 6, 3);
      this.hazeA = tile(N, nh, [240, 244, 250], (v) => clamp((v - .25) / .75)); this.hazeB = tile(N, ni, [246, 248, 252], (v) => clamp((v - .45) / .55));
    }
    this.puffImg = puffSprite(kind === 'ice' ? [250, 251, 253] : kind === 'late' ? [186, 196, 214] : [196, 204, 222]);
    this.beaconImg = beaconSprite();
    this.vents = VENTS[kind].map(([x, y, dir, a], i) => ({ x, y, dir, a, next: r() * 1.2, rate: .8 + r() * .5 }));
    this.puffs = [];
    this.beacons = BEACONS[kind].map(([x, y]) => { const grp = Math.floor(r() * 3); return { x, y, ph: grp * .33 + r() * .05, per: 2.1 + grp * .12 + r() * .06 }; });
    this.moonN = noise1(seed + 9);
    this.t = 0;
    /* let the plumes get going before the first frame */
    for (let i = 0; i < 9 * 15; i++) this.sim(1 / 15);
  }
  sim(dt) {
    this.t += dt; const r = this.r;
    for (const v of this.vents) {
      v.next -= dt;
      if (v.next <= 0) { v.next = (1 / v.rate) * (.6 + r() * .8);
        const life = 6 + r() * 3.5;
        this.puffs.push({ x: v.x + (r() - .5) * 14, y: v.y, vx: v.dir * (14 + r() * 12), vy: -(34 + r() * 14), r0: 16 + r() * 10, r1: 110 + r() * 70, life, age: 0, a: v.a * (.7 + r() * .5), w: r() * 6.28 }); }
    }
    for (const p of this.puffs) { p.age += dt; p.x += (p.vx + 6 * Math.sin(p.w + p.age * .9)) * dt; p.y += p.vy * dt; p.vy *= Math.pow(.9, dt); p.vx += p.vx * .04 * dt; }
    this.puffs = this.puffs.filter((p) => p.age < p.life);
  }
  /* cloud density (0..1) at a plate point, from the same noise the clouds are drawn with */
  density(px, py) {
    if (!this.nA || !this.oA) return 0; const N = 256, k = 1;
    const sa = (arr, sc, offx, offy) => { const u = ((((px / Q - offx) / sc) % N) + N) % N, v = ((((py / Q - offy) / sc) % N) + N) % N;
      return arr[Math.floor(v) * N + Math.floor(u)]; };
    const cv = (v) => Math.pow(clamp((v - .4) / .42), 1.4);
    const a = cv(sa(this.nA, 6, this.oA[0], this.oA[1])), b = cv(sa(this.nB, 3, this.oB[0], this.oB[1])) * .55;
    return 1 - (1 - a) * (1 - b) * k;
  }
  update(t, dt) {
    const still = this.motion === 'still', calm = this.motion === 'calm';
    if (!still) this.sim(dt * (calm ? .6 : 1));
    const c = this.c, tt = still ? 0 : t * (calm ? .5 : 1);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, AW, AH);
    const pat = (ctx, img, sc, ox, oy, a) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(ox, oy); ctx.scale(sc, sc);
      if (!PATS.has(img)) PATS.set(img, ctx.createPattern(img, 'repeat'));
      ctx.fillStyle = PATS.get(img); ctx.fillRect(-ox / sc, -oy / sc, AW / sc + 1, AH / sc + 1); ctx.restore(); };
    /* clouds in the sky */
    if (this.cloudA) {
      this.oA = [-40 + tt * 6.5, -10 + tt * .4]; this.oB = [-90 + tt * 10, 20 + tt * .7];
      const w = this.wc; w.globalCompositeOperation = 'source-over'; w.clearRect(0, 0, AW, AH);
      pat(w, this.cloudA, 6, this.oA[0], this.oA[1], 1); pat(w, this.cloudB, 3, this.oB[0], this.oB[1], .55);
      if (this.skyMask) { w.globalCompositeOperation = 'destination-in'; w.drawImage(this.skyMask, 0, 0); w.globalCompositeOperation = 'source-over'; }
      c.globalAlpha = this.kind === 'late' ? .2 : .22; c.drawImage(this.work, 0, 0); c.globalAlpha = 1;
      /* the moon lights the cloud passing in front of it */
      if (this.kind === 'night') {
        const d = this.density(2326, 193), mx = 2326 / Q, my = 193 / Q, R = 80;
        const g = c.createRadialGradient(mx, my, 0, mx, my, R);
        g.addColorStop(0, 'rgba(214,226,248,.9)'); g.addColorStop(.25, 'rgba(200,216,242,.35)'); g.addColorStop(1, 'rgba(190,206,236,0)');
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(.05 + .32 * d); c.fillStyle = g; c.fillRect(mx - R, my - R, 2 * R, 2 * R);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
    }
    /* 3 a.m. fog banks rolling through the valleys */
    if (this.fogA) {
      const w = this.wc2; w.globalCompositeOperation = 'source-over'; w.clearRect(0, 0, AW, AH);
      pat(w, this.fogA, 5, -tt * 3.2, 0, 1); pat(w, this.fogB, 2.6, 60 - tt * 5.5, tt * .3, .7);
      if (this.fogMask) { w.globalCompositeOperation = 'destination-in'; w.drawImage(this.fogMask, 0, 0); w.globalCompositeOperation = 'source-over'; }
      c.globalAlpha = .2; c.drawImage(this.work2, 0, 0); c.globalAlpha = 1;
    }
    /* snow haze: slow sheets blowing across */
    if (this.hazeA) { pat(c, this.hazeA, 6, tt * 9, 0, .1); pat(c, this.hazeB, 3, tt * 16, tt * 2, .06); }
    /* steam */
    if (!still) for (const p of this.puffs) {
      const k = p.age / p.life, env = smooth(0, .14, k) * (1 - smooth(.3, 1, k)), rr = (p.r0 + (p.r1 - p.r0) * (1 - (1 - k) * (1 - k))) / Q;
      if (env <= 0) continue; c.globalAlpha = p.a * env; c.drawImage(this.puffImg, p.x / Q - rr, p.y / Q - rr, 2 * rr, 2 * rr);
    }
    c.globalAlpha = 1;
    /* aviation lights: slow red pulses in small groups */
    if (this.beacons.length) {
      c.globalCompositeOperation = 'lighter';
      for (const b of this.beacons) {
        const u = still ? .2 : (((t / b.per + b.ph) % 1) + 1) % 1, p = still ? .35 : smooth(0, .09, u) * (1 - smooth(.3, .46, u));
        if (p <= 0) continue; const R = 6.5; c.globalAlpha = .7 * p; c.drawImage(this.beaconImg, b.x / Q - R, b.y / Q - R, 2 * R, 2 * R);
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
  }
}
