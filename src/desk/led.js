/* MIMEI · DESK/LED — ported from proto/crane/desk.
   The old LED sign on the crane hook: 92 x 39 diodes on the sign's own (perspective) grid.
   Sign = the model (pages, marquee, transitions -> a brightness grid).
   LedRenderer = the look (white diodes, glow in the wet glass, light caught by raindrops, camera bloom).
   Long lines scroll like a real marquee: hold at the start so the first words can be read, scroll one diode
   column at a time, loop with a gap, and rest after a few loops. Short lines sit still, centred. */
import { width, blit } from './ledfont.js';
import { rng, clamp } from './clock.js';

export const COLS = 92, ROWS = 39, CV = { x: 401, y: 593, w: 530, h: 400 };
/* LED lattice: dot (i, j) -> plate px. Measured on the sign glass (median error 0.6 px). */
const HL = [[6.4100333976432395, -0.11945030318234066, 452.0602879095688],
            [1.0353877602505426, 7.097267706481152, 664.3278765945433],
            [0.0019481287946008729, -0.00017086768763920177, 1]];
export function latP(i, j) { const [a, b, c] = HL[0], [d, e, g] = HL[1], [h, k, l] = HL[2], w = h * i + k * j + l;
  return [(a * i + b * j + c) / w, (d * i + e * j + g) / w]; }
export const lat = (i, j) => { const [x, y] = latP(i, j); return [x - CV.x, y - CV.y]; };
export const FACE_P = [latP(-.7, -.7), latP(COLS - .3, -.7), latP(COLS - .3, ROWS - .3), latP(-.7, ROWS - .3)];

/* ---------------- model ---------------- */
export const MQ = { speed: 20, hold: 2.6, gap: 24, loops: 3, rest: 18, margin: 2, flip: 3.4 };
const layout = (l) => { const w = width(l.text); return { ...l, w, fits: w <= COLS - 2 * MQ.margin }; };
/* chunks for still mode (no scrolling): split on spaces into parts that fit */
function chunks(text) {
  const out = []; let cur = '';
  for (const word of text.split(' ')) { const next = cur ? cur + ' ' + word : word;
    if (width(next) <= COLS - 2 * MQ.margin || !cur) cur = next; else { out.push(cur); cur = word; } }
  if (cur) out.push(cur); return out;
}
/* draw one line at page-time t. Returns true if the line is moving (so the caller knows to keep redrawing). */
function paintLine(g, L, t, still, lv = L.lv) {
  if (L.fits) { blit(g, COLS, L.text, Math.round((COLS - L.w) / 2), L.row, lv); return; }
  if (still) { const cs = L.cs || (L.cs = chunks(L.text)), s = cs[Math.floor(t / MQ.flip) % cs.length];
    blit(g, COLS, s, Math.round((COLS - width(s)) / 2), L.row, lv); return; }
  const x = marqueeX(L, t), span = L.w + MQ.gap;
  blit(g, COLS, L.text, x, L.row, lv);
  if (x + span < COLS) blit(g, COLS, L.text, x + span, L.row, lv);
}
/* left edge of a scrolling line at page-time t */
export function marqueeX(L, t) {
  const span = L.w + MQ.gap, cyc = MQ.hold + span / MQ.speed, big = MQ.loops * cyc + MQ.rest;
  let u = t % big, x = MQ.margin;
  if (u < MQ.loops * cyc) { u %= cyc; if (u >= MQ.hold) x -= Math.floor((u - MQ.hold) * MQ.speed); }
  return x;
}
export class Sign {
  constructor(seed = 3) {
    this.grid = new Float32Array(COLS * ROWS); this.A = new Float32Array(COLS * ROWS); this.B = new Float32Array(COLS * ROWS);
    this.page = []; this.pageT0 = 0; this.tr = null; this.t = 0; this.still = false; this.version = 0; this.onEvent = null;
    const r = rng(seed); this.order = Float32Array.from({ length: COLS * ROWS }, () => r());
    /* an old sign: a few tired diodes and one dead one */
    this.wear = new Float32Array(COLS * ROWS).fill(1);
    for (let k = 0; k < 9; k++) this.wear[Math.floor(r() * COLS * ROWS)] = .45 + r() * .25;
    this.wear[Math.floor(r() * COLS * ROWS)] = 0;
    this.blank = true; this.act = 0; this.blinkT0 = null;
  }
  /* lines: [{text, lv, row}] ; kind: 'auto' | 'wipe' | 'dissolve' | 'roll' | 'power' | 'cut' */
  show(lines, kind = 'auto', dur) {
    const to = lines.map(layout);
    if (kind === 'auto') {
      const same = this.page.length === to.length && to.every((l, i) => l.row === this.page[i].row);
      const changed = same ? to.filter((l, i) => l.text !== this.page[i].text).length : -1;
      kind = this.blank ? 'power' : changed === 0 ? 'none' : (same && changed <= 1) ? 'roll' : 'wipe';
    }
    if (kind === 'none') return;
    if (this.still && (kind === 'roll' || kind === 'wipe')) kind = 'dissolve';      /* still: pages change in place, never slide */
    const D = { wipe: .62, dissolve: .7, roll: .42, power: 1.1, off: .5, cut: 0 };
    this.tr = { kind, from: this.page, fromT0: this.pageT0, to, t0: this.t, dur: dur ?? D[kind] ?? .6 };
    if (kind === 'roll') this.tr.rows = to.filter((l, i) => !this.page[i] || l.text !== this.page[i].text).map((l) => l.row);
    this.blank = false;
    this.onEvent && this.onEvent(kind, this.t);
  }
  off(dur = .5) { this.tr = { kind: 'off', from: this.page, fromT0: this.pageT0, to: [], t0: this.t, dur }; this.blank = true; }
  /* act: hover glow on the action line (0..1); blink: the action line flashes when you open it */
  paint(g, page, tp) { g.fill(0);
    for (const L of page) { let lv = L.lv;
      if (L.act) { lv += (.95 - lv) * this.act; if (this.blinkT0 !== null && this.t - this.blinkT0 < .56 && Math.floor((this.t - this.blinkT0) * 9) % 2 === 0) continue; }
      paintLine(g, L, tp, this.still, lv); } }
  blink() { this.blinkT0 = this.t; this.onEvent && this.onEvent('blink', this.t); }
  /* advance to time t; returns true when the grid changed */
  update(t) {
    this.t = t; const { grid, A, B } = this; const prev = this.version;
    let out;
    if (this.tr) {
      const tr = this.tr, k = tr.dur > 0 ? clamp((t - tr.t0) / tr.dur) : 1;
      this.paint(A, tr.from, t - tr.fromT0); this.paint(B, tr.to, 0);
      out = this.B2 || (this.B2 = new Float32Array(COLS * ROWS));
      const o = this.order;
      if (tr.kind === 'wipe') { const c = Math.floor(k * (COLS + 4)) - 2;
        for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const n = j * COLS + i;
          out[n] = i < c ? B[n] : i === c ? Math.max(A[n], B[n]) && 1 : i === c + 1 ? Math.max(A[n], B[n]) * .5 : A[n]; } }
      else if (tr.kind === 'dissolve' || tr.kind === 'power' || tr.kind === 'off') {
        const src = tr.kind === 'off' ? B : A, dst = tr.kind === 'off' ? A : B, kk = tr.kind === 'off' ? 1 - k : k;
        for (let n = 0; n < out.length; n++) { const th = o[n];
          out[n] = tr.kind === 'off' ? (th < kk ? dst[n] : 0) : th < kk ? dst[n] * (kk - th < .1 ? 1.35 : 1) : src[n]; } }
      else if (tr.kind === 'roll') { out.set(B);
        const off = Math.round(k * 9);
        for (const row of tr.rows) for (let y = row; y < row + 9 && y < ROWS; y++) for (let i = 0; i < COLS; i++) {
          const ya = y + off, yb = y + off - 9, n = y * COLS + i;
          out[n] = ya < row + 9 && ya < ROWS ? A[ya * COLS + i] : yb >= row ? B[yb * COLS + i] : 0; } }
      else out.set(B);
      if (k >= 1) { this.page = tr.to; this.pageT0 = t; this.tr = null; }
    } else { this.paint(A, this.page, t - this.pageT0); out = A; }
    let changed = false;
    for (let n = 0; n < grid.length; n++) { const v = Math.fround(Math.min(1.4, out[n]) * this.wear[n]); if (v !== grid[n]) { grid[n] = v; changed = true; } }
    if (changed) this.version++;
    return this.version !== prev;
  }
}

/* ---------------- renderer ---------------- */
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
let FILTER_OK = null;
export function canvasFilterOK() {
  if (FILTER_OK !== null) return FILTER_OK;
  try { const c = mk(24, 8), x = c.getContext('2d', { willReadFrequently: true }); x.filter = 'blur(3px)'; x.fillStyle = '#fff'; x.fillRect(10, 2, 4, 4);
    FILTER_OK = x.getImageData(4, 4, 1, 1).data[3] > 0; } catch (e) { FILTER_OK = false; }
  return FILTER_OK;
}
/* one lit diode: hot white core + tight halo (sprite, 4x supersampled) */
const S = 4, R = 6;
function diode() {
  const sp = mk(R * 2 * S, R * 2 * S), sc = sp.getContext('2d');
  let g = sc.createRadialGradient(R * S, R * S, 0, R * S, R * S, R * S);
  g.addColorStop(0, 'rgba(236,243,255,.55)'); g.addColorStop(.35, 'rgba(214,228,255,.18)'); g.addColorStop(1, 'rgba(200,220,255,0)');
  sc.fillStyle = g; sc.fillRect(0, 0, sp.width, sp.height);
  sc.save(); sc.translate(R * S, R * S); sc.scale(1, 1.2);
  g = sc.createRadialGradient(0, 0, 0, 0, 0, 1.75 * S); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.62, 'rgba(250,252,255,.95)'); g.addColorStop(1, 'rgba(240,246,255,0)');
  sc.fillStyle = g; sc.beginPath(); sc.arc(0, 0, 1.75 * S, 0, Math.PI * 2); sc.fill(); sc.restore();
  return sp;
}
/* separable box blur x3 ~ gaussian, zero outside (like a canvas blur) */
function boxes(sigma) { const wi = Math.sqrt(12 * sigma * sigma / 3 + 1); let wl = Math.floor(wi); if (wl % 2 === 0) wl--; const wu = wl + 2;
  const m = Math.round((12 * sigma * sigma - 3 * wl * wl - 12 * wl - 9) / (-4 * wl - 4)); return [0, 1, 2].map((i) => ((i < m ? wl : wu) - 1) / 2); }
function bh(s, d, w, h, r) { const iv = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) { const o = y * w; let a = 0; for (let x = 0; x <= r && x < w; x++) a += s[o + x];
    for (let x = 0; x < w; x++) { d[o + x] = a * iv; const p = x + r + 1, q = x - r; if (p < w) a += s[o + p]; if (q >= 0) a -= s[o + q]; } } }
function bv(s, d, w, h, r) { const iv = 1 / (2 * r + 1);
  for (let x = 0; x < w; x++) { let a = 0; for (let y = 0; y <= r && y < h; y++) a += s[y * w + x];
    for (let y = 0; y < h; y++) { d[y * w + x] = a * iv; const p = y + r + 1, q = y - r; if (p < h) a += s[p * w + x]; if (q >= 0) a -= s[q * w + x]; } } }
function gauss(src, out, tmp, w, h, sigma) { const rs = boxes(sigma); let a = src;
  for (const r of rs) { bh(a, tmp, w, h, r); bv(tmp, out, w, h, r); a = out; } return out; }

export class LedRenderer {
  constructor(canvas, { bloom = 1, drops = 1, glass = null, js = false } = {}) {
    this.cv = canvas; canvas.width = CV.w; canvas.height = CV.h;
    this.c = canvas.getContext('2d'); this.bloom = bloom; this.drops = drops; this.glass = glass;
    this.js = js || !canvasFilterOK();
    this.sp = diode();
    this.pos = new Float32Array(COLS * ROWS * 2);
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { const [x, y] = lat(i, j); this.pos[(j * COLS + i) * 2] = x; this.pos[(j * COLS + i) * 2 + 1] = y; }
    const f = FACE_P.map(([x, y]) => [x - CV.x, y - CV.y]);
    this.face = new Path2D(); f.forEach(([x, y], k) => k ? this.face.lineTo(x, y) : this.face.moveTo(x, y)); this.face.closePath();
    if (!this.js) { this.dots = mk(CV.w, CV.h); this.dc = this.dots.getContext('2d'); this.dd = mk(CV.w, CV.h); this.ddc = this.dd.getContext('2d'); }
    else this.initJS();
  }
  render(grid) { if (this.js) this.renderJS(grid); else this.renderFilter(grid); }
  renderFilter(grid) {
    const { c, dots, dc, sp, pos } = this, b = this.bloom;
    dc.globalCompositeOperation = 'source-over'; dc.globalAlpha = 1; dc.clearRect(0, 0, CV.w, CV.h); dc.globalCompositeOperation = 'lighter';
    for (let n = 0; n < grid.length; n++) { const lv = grid[n]; if (!lv) continue;
      dc.globalAlpha = Math.min(1, lv); dc.drawImage(sp, pos[2 * n] - R, pos[2 * n + 1] - R, R * 2, R * 2);
      if (lv > 1) { dc.globalAlpha = lv - 1; dc.drawImage(sp, pos[2 * n] - R, pos[2 * n + 1] - R, R * 2, R * 2); } }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.filter = 'none'; c.clearRect(0, 0, CV.w, CV.h);
    c.save(); c.clip(this.face); c.globalCompositeOperation = 'lighter';
    c.filter = 'blur(14px)'; c.globalAlpha = .55 * b; c.drawImage(dots, 0, 0);     /* light scattered in the wet glass */
    c.filter = 'blur(5px)'; c.globalAlpha = .5 * b; c.drawImage(dots, 0, 0);
    c.filter = 'blur(1.6px)'; c.globalAlpha = .5; c.drawImage(dots, 0, 0);
    c.filter = 'none'; c.globalAlpha = 1; c.drawImage(dots, 0, 0);
    if (this.glass) { const x = this.ddc;             /* rain on the glass catches the light near the letters */
      x.globalCompositeOperation = 'source-over'; x.filter = 'none'; x.clearRect(0, 0, CV.w, CV.h);
      x.filter = 'blur(9px)'; x.drawImage(dots, 0, 0); x.drawImage(dots, 0, 0); x.filter = 'none';
      x.globalCompositeOperation = 'destination-in'; x.drawImage(this.glass, 0, 0);
      c.globalAlpha = 1.0 * this.drops; c.drawImage(this.dd, 0, 0); c.globalAlpha = .6 * this.drops; c.drawImage(this.dd, 0, 0); }
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.filter = 'blur(26px)'; c.globalAlpha = .16 * b; c.drawImage(dots, 0, 0); c.restore();   /* camera bloom */
  }
  /* ---- fallback without canvas filters (Safari): same layers, blurred in JS ---- */
  initJS() {
    const W = CV.w, H = CV.h, w = W >> 1, h = H >> 1; this.W = W; this.H = H; this.w = w; this.h = h;
    /* sprite -> 13x13 premultiplied (r,g,b) tables at 4x4 sub-pixel phases */
    const big = this.sp, bc = mk(big.width + S, big.height + S).getContext('2d', { willReadFrequently: true });
    this.ph = [];
    for (let py = 0; py < 4; py++) for (let px = 0; px < 4; px++) {
      bc.clearRect(0, 0, bc.canvas.width, bc.canvas.height); bc.drawImage(big, px, py);
      const d = bc.getImageData(0, 0, bc.canvas.width, bc.canvas.height).data, N = 13, t = new Float32Array(N * N * 3), cw = bc.canvas.width;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let r = 0, g = 0, b2 = 0;
        for (let v = 0; v < 4; v++) for (let u = 0; u < 4; u++) { const xx = x * 4 + u, yy = y * 4 + v; if (xx >= cw || yy >= bc.canvas.height) continue;
          const k = (yy * cw + xx) * 4, a = d[k + 3] / 255; r += d[k] / 255 * a; g += d[k + 1] / 255 * a; b2 += d[k + 2] / 255 * a; }
        const q = (y * N + x) * 3; t[q] = r / 16; t[q + 1] = g / 16; t[q + 2] = b2 / 16; }
      this.ph.push(t); }
    this.Ar = new Float32Array(W * H); this.Ag = new Float32Array(W * H); this.Ab = new Float32Array(W * H);
    this.L = new Float32Array(W * H); this.T = new Float32Array(W * H); this.B16 = new Float32Array(W * H);
    this.Lh = new Float32Array(w * h); this.Th = new Float32Array(w * h);
    this.b5 = new Float32Array(w * h); this.b14 = new Float32Array(w * h); this.b9 = new Float32Array(w * h); this.b26 = new Float32Array(w * h);
    this.cF = mk(W, H); this.cH = mk(w, h); this.cD = mk(w, h); this.cB = mk(w, h);
    this.iF = new ImageData(W, H); this.iH = new ImageData(w, h); this.iD = new ImageData(w, h); this.iB = new ImageData(w, h);
    this.gA = null;
    if (this.glass) { const g = mk(w, h).getContext('2d', { willReadFrequently: true }); g.drawImage(this.glass, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data; this.gA = new Float32Array(w * h); for (let n = 0; n < w * h; n++) this.gA[n] = d[n * 4 + 3] / 255; }
  }
  renderJS(grid) {
    const { W, H, w, h, Ar, Ag, Ab, L, pos } = this, b = this.bloom, N = 13;
    Ar.fill(0); Ag.fill(0); Ab.fill(0);
    for (let n = 0; n < grid.length; n++) { const lv = grid[n]; if (!lv) continue;
      const x0 = pos[2 * n] - R, y0 = pos[2 * n + 1] - R, ix = Math.floor(x0), iy = Math.floor(y0);
      const t = this.ph[Math.min(3, Math.floor((x0 - ix) * 4)) + 4 * Math.min(3, Math.floor((y0 - iy) * 4))];
      for (let y = 0; y < N; y++) { const yy = iy + y; if (yy < 0 || yy >= H) continue;
        for (let x = 0; x < N; x++) { const xx = ix + x; if (xx < 0 || xx >= W) continue; const q = (y * N + x) * 3, k = yy * W + xx;
          Ar[k] += t[q] * lv; Ag[k] += t[q + 1] * lv; Ab[k] += t[q + 2] * lv; } } }
    for (let k = 0; k < W * H; k++) { Ar[k] = Math.min(1, Ar[k]); Ag[k] = Math.min(1, Ag[k]); Ab[k] = Math.min(1, Ab[k]); L[k] = (Ar[k] + Ag[k] + Ab[k]) / 3; }
    gauss(L, this.B16, this.T, W, H, 1.6);
    const Lh = this.Lh; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = 2 * y * W + 2 * x; Lh[y * w + x] = (L[k] + L[k + 1] + L[k + W] + L[k + W + 1]) / 4; }
    gauss(Lh, this.b5, this.Th, w, h, 2.5); gauss(Lh, this.b14, this.Th, w, h, 7); gauss(Lh, this.b9, this.Th, w, h, 4.5); gauss(Lh, this.b26, this.Th, w, h, 13);
    const tint = [.955, .972, 1];
    const put = (img, n, r, g, bb) => { const a = Math.max(r, g, bb, 1e-6), d = img.data, k = n * 4;
      d[k] = Math.min(255, r / a * 255 + .5); d[k + 1] = Math.min(255, g / a * 255 + .5); d[k + 2] = Math.min(255, bb / a * 255 + .5); d[k + 3] = Math.min(255, a * 255 + .5); };
    for (let k = 0; k < W * H; k++) { const s = .5 * this.B16[k]; put(this.iF, k, Math.min(1, Ar[k] + s * tint[0]), Math.min(1, Ag[k] + s * tint[1]), Math.min(1, Ab[k] + s * tint[2])); }
    for (let k = 0; k < w * h; k++) {
      const v = Math.min(1, .5 * b * this.b5[k] + .55 * b * this.b14[k]); put(this.iH, k, v * tint[0], v * tint[1], v);
      const dv = this.gA ? Math.min(1, 1.6 * this.drops * Math.min(1, 2 * this.b9[k]) * this.gA[k]) : 0; put(this.iD, k, dv * tint[0], dv * tint[1], dv);
      const bv2 = Math.min(1, .16 * b * this.b26[k]); put(this.iB, k, bv2 * tint[0], bv2 * tint[1], bv2); }
    this.cF.getContext('2d').putImageData(this.iF, 0, 0); this.cH.getContext('2d').putImageData(this.iH, 0, 0);
    this.cD.getContext('2d').putImageData(this.iD, 0, 0); this.cB.getContext('2d').putImageData(this.iB, 0, 0);
    const c = this.c; c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, W, H);
    c.save(); c.clip(this.face); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
    c.drawImage(this.cH, 0, 0, W, H); c.drawImage(this.cF, 0, 0); c.drawImage(this.cD, 0, 0, W, H); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(this.cB, 0, 0, W, H); c.restore();
  }
}
