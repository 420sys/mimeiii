/* ════════════════════════════════════════════════════════════════════════
   A · Hologram — the megacity.

   A city generated from one seed and drawn through a real camera: boxes on a
   street grid, projected in perspective and painted back to front. It is
   painted once per scene into three still layers (far, mid, fore) so the desk
   can slide them against each other; everything that moves is drawn on top
   of them by desk.js.

   Night is light in the dark: lit windows, haze, glowing edges.
   Ice is ink on white: snow on every roof, fine floor lines, fog.
   ════════════════════════════════════════════════════════════════════════ */

const D = Math.PI / 180;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a < 0 ? 0 : a > 1 ? 1 : +a.toFixed(3)})`;
/** A seeded random source, so the city is the same city on every load. */
const mul = s => () => {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* The world, in metres. x runs right, y up, z away from the camera. */
export const CAM = { y: 300, pitch: 8.5 * D, f: 0.92 };
export const PLAZA = { x: 60, z: 1000, r: 170 };
export const RING = { r: 300, y: 92, w: 16 };                       // the elevated ring road round the plaza
export const HOLO = { x: 60, z: 1000, y0: 30, w: 470, h: 376 };     // the plane the hologram stands in
/* Corners run top-left, top-right, bottom-right, bottom-left: [x, y, z]. */
export const BOARD = [[-196, 262, 416], [-74, 262, 440], [-74, 176, 440], [-196, 176, 416]];
export const CLOCK = [[196, 352, 565], [304, 352, 565], [304, 306, 565], [196, 306, 565]];

/** The camera for a W × H screen: (x, y, z) → [screen x, screen y, depth]. */
export function camera(W, H) {
  const F = CAM.f * W, cp = Math.cos(CAM.pitch), sp = Math.sin(CAM.pitch), x0 = W / 2, y0 = H / 2;
  const pr = (x, y, z) => {
    const dy = y - CAM.y, Z = Math.max(z * cp - dy * sp, 2), k = F / Z;
    return [x0 + x * k, y0 - (dy * cp + z * sp) * k, Z];
  };
  pr.F = F;
  pr.horizon = y0 - F * Math.tan(CAM.pitch);
  return pr;
}

/* ── the model ────────────────────────────────────────────────────────── */

export function buildCity(seed = 2026) {
  const rnd = mul(seed), R = (a, b) => a + (b - a) * rnd(), S = () => (rnd() * 2147483647) | 0;
  const boxes = [], masts = [];
  const layerOf = z => (z >= 830 ? 'far' : z >= 430 ? 'mid' : 'fore');
  const STY = ['bands', 'bands', 'bands', 'cells', 'cells', 'cells', 'cells', 'strips', 'dark'];

  function tower(x, z, w, d, h, o = {}) {
    const base = {
      style: o.style || STY[(rnd() * STY.length) | 0], lit: o.lit ?? R(0.16, 0.82),
      hue: o.hue ?? (rnd() < 0.66 ? 0 : rnd() < 0.68 ? 1 : 2), layer: o.layer || layerOf(z), fixed: !!o.fixed, ox: x, oz: z,
    };
    const tiers = o.tiers || (h > 150 && rnd() < 0.62 ? (h > 250 && rnd() < 0.5 ? 3 : 2) : 1);
    let y = 0, ww = w, dd = d, first = null;
    for (let t = 0; t < tiers; t++) {
      const top = t === tiers - 1 ? h : h * (t === 0 ? R(0.5, 0.68) : R(0.8, 0.9));
      const b = { x, z, w: ww, d: dd, y0: y, y1: top, tier: t, seed: S(), ...base };
      boxes.push(b);
      first = first || b;
      y = top; ww *= R(0.62, 0.84); dd *= R(0.62, 0.84);
    }
    if (!o.bare && rnd() < 0.55) boxes.push({ x: x + R(-0.18, 0.18) * ww, z: z + R(-0.18, 0.18) * dd, w: ww * R(0.24, 0.5), d: dd * R(0.24, 0.5), y0: h, y1: h + R(3, 10), tier: 9, seed: S(), ...base, style: 'dark' });
    if (!o.bare && h > 105 && rnd() < 0.42) masts.push({ x, z, y0: h, y1: h + R(16, 62), ph: rnd(), layer: base.layer });
    return first;
  }

  const PITCH = 100, LOT = 74;
  /* the three things that stand in the foreground keep their ground clear */
  const kept = (x, z) => (x < -200 && x > -400 && z > 430 && z < 620) || (x > -240 && x < -30 && z < 430) || (x > 150 && x < 370 && z > 530 && z < 730);
  for (let iz = 0; iz < 50; iz++) {
    const zc = 380 + iz * PITCH, n = Math.ceil((zc * 0.62 + 240) / PITCH);
    for (let ix = -n; ix < n; ix++) {
      const xc = PLAZA.x + (ix + 0.5) * PITCH, dx = xc - PLAZA.x, dz = zc - PLAZA.z, dp = Math.hypot(dx, dz);
      if (dp < PLAZA.r + 55 || kept(xc, zc) || rnd() < 0.025) continue;
      let h = R(34, 96);
      h += Math.exp(-(((dp - 440) / 250) ** 2)) * R(50, 240);                                   // downtown, round the plaza
      if (dz > 120) h += Math.exp(-((dx / 560) ** 2)) * Math.exp(-dz / 1800) * R(60, 230);       // the wall behind the hologram
      h += 170 * rnd() * Math.exp(-(((xc + 1500) / 600) ** 2 + ((zc - 3100) / 800) ** 2));       // two more downtowns, far off
      h += 190 * rnd() * Math.exp(-(((xc - 1700) / 700) ** 2 + ((zc - 2500) / 700) ** 2));
      if (zc > 760 && rnd() < 0.05) h *= R(1.45, 2.05);
      if (dz < -120 && Math.abs(dx) < 260) h = Math.min(h, R(52, 126));                          // the valley in front of it
      if (dp < RING.r + 46) h = Math.min(h, R(30, 66));                                          // low under the ring road
      if (zc < 600) h = Math.min(h, R(58, 150));
      h = clamp(h, 26, 460);
      const k = rnd();
      if (h > 170 || k < 0.4) tower(xc, zc, LOT * R(0.74, 1), LOT * R(0.74, 1), h);
      else if (k < 0.75) {
        const along = rnd() < 0.5;
        for (const sgn of [-1, 1]) {
          if (along) tower(xc + sgn * LOT * 0.26, zc, LOT * 0.46, LOT * R(0.7, 1), h * R(0.55, 1));
          else tower(xc, zc + sgn * LOT * 0.26, LOT * R(0.7, 1), LOT * 0.46, h * R(0.55, 1));
        }
      } else for (const sx of [-1, 1]) for (const sz of [-1, 1]) tower(xc + sx * LOT * 0.26, zc + sz * LOT * 0.26, LOT * 0.46, LOT * 0.46, h * R(0.4, 1));
    }
  }

  /* the foreground: the tower at the left edge, the billboard's house, the clock's tower */
  const edge = tower(-276, 476, 112, 52, 900, { style: 'strips', lit: 0.22, hue: 1, layer: 'fore', tiers: 1, bare: true, fixed: true });
  edge.name = true;
  tower(-128, 420, 150, 52, 148, { style: 'cells', lit: 0.42, hue: 0, layer: 'fore', tiers: 1, bare: true, fixed: true });
  tower(258, 630, 144, 128, 300, { style: 'bands', lit: 0.5, hue: 0, layer: 'fore', tiers: 1, bare: true, fixed: true });

  /* a few towers behind the billboard carry signs; they are named in paintCity from the course */
  const cand = boxes.filter(b => b.tier === 0 && !b.fixed && b.y1 > 262 && b.z > 1080 && b.z < 2200 && b.x / b.z < -0.2 && b.x / b.z > -0.5)
    .sort((a, b) => b.y1 - a.y1);
  const signs = [];
  for (const b of cand) {
    if (signs.length >= 4) break;
    if (signs.every(o => Math.abs(o.x / o.z - b.x / b.z) > 0.05)) signs.push(b);
  }
  signs.sort((a, b) => a.x / a.z - b.x / b.z).forEach((b, i) => { b.sign = i; });

  /* and a few carry a screen */
  const scr = boxes.filter(b => b.tier === 0 && !b.fixed && b.sign === undefined && b.w > 50 && b.y1 > 150 && b.z > 1100 && b.z < 2700 && Math.abs(b.x / b.z) < 0.5);
  for (let i = 0; i < 7 && scr.length; i++) { const b = scr.splice((rnd() * scr.length) | 0, 1)[0]; b.screen = [R(0.42, 0.55), R(0.82, 0.93)]; }

  boxes.forEach(b => { b.key = Math.hypot(b.ox, b.oz) - b.y0 * 1e-3; });
  boxes.sort((a, b) => b.key - a.key);
  return { seed, boxes, masts };
}

/* ── the painting ─────────────────────────────────────────────────────── */

const LIGHT = [[208, 238, 250], [86, 226, 220], [112, 172, 255]];   // ice white, teal, blue
const INK = [30, 58, 72];
let scratchA = null, scratchB = null;
const scratch = (which, w, h) => {
  let c = which ? scratchB : scratchA;
  if (!c) { c = document.createElement('canvas'); if (which) scratchB = c; else scratchA = c; }
  c.width = w; c.height = h;
  return c;
};

/**
 * Paint the city for one scene.
 *   cv    { far, mid, fore }: three canvases, sized here
 *   V     { W, H, s, pad }: the screen in CSS pixels, the pixel scale, and the bleed round it
 *   info  { signs: [{ text, state }] } the words on the towers behind the billboard
 * Returns the camera and where the moving things are.
 */
export function paintCity(M, cv, V, scene, info = {}) {
  const N = scene !== 'ice', { W, H, s, pad } = V, pr = camera(W, H), F = pr.F, u = F / 1325;
  const X0 = -pad, X1 = W + pad, Y0 = -pad, Y1 = H + pad;
  const g = {};
  for (const k of ['far', 'mid', 'fore']) {
    const c = cv[k];
    c.width = Math.round((W + pad * 2) * s); c.height = Math.round((H + pad * 2) * s);
    const x = c.getContext('2d');
    x.setTransform(s, 0, 0, s, pad * s, pad * s);
    x.lineJoin = 'round';
    g[k] = x;
  }
  const FOG = N ? [10, 46, 58] : [240, 245, 247];
  const fog = Z => 1 - Math.exp(-Z / (N ? 2400 : 1500));
  const quad = (c, a, b, d, e) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.lineTo(e[0], e[1]); c.closePath(); };
  const hz = pr.horizon;
  const hc = pr(HOLO.x, HOLO.y0 + HOLO.h * 0.55, HOLO.z);

  /* sky, the light behind the hologram, the last skyline, the ground */
  {
    const c = g.far, sky = c.createLinearGradient(0, Y0, 0, hz + 30);
    (N ? [[0, '#01040a'], [0.4, '#020c14'], [0.75, '#061e2a'], [1, '#0b3a48']] : [[0, '#d6e3ea'], [0.55, '#e7eff3'], [1, '#f7fafb']]).forEach(([o, col]) => sky.addColorStop(o, col));
    c.fillStyle = sky; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    const glow = c.createRadialGradient(hc[0], hc[1], 0, hc[0], hc[1], W * 0.5);
    (N ? [[0, 'rgba(120,225,240,.30)'], [0.3, 'rgba(60,170,200,.14)'], [1, 'rgba(0,0,0,0)']] : [[0, 'rgba(255,255,255,.95)'], [0.5, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]).forEach(([o, col]) => glow.addColorStop(o, col));
    c.fillStyle = glow; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    const gr = c.createLinearGradient(0, hz, 0, Y1);
    (N ? [[0, css(FOG)], [0.3, '#05161e'], [1, '#020609']] : [[0, '#f5f8f9'], [0.4, '#e9f0f3'], [1, '#d9e4e9']]).forEach(([o, col]) => gr.addColorStop(o, col));
    c.fillStyle = gr; c.fillRect(X0, hz + 8 * u, X1 - X0, Y1 - hz);
    const r = mul(M.seed + 7);
    for (let k = 0; k < 3; k++) {
      const base = hz + (6 + k * 13) * u;
      c.fillStyle = css(N ? mix(FOG, [5, 16, 22], 0.1 + k * 0.17) : mix(FOG, [150, 172, 184], 0.14 + k * 0.13));
      for (let x = X0; x < X1;) {
        const w = (4 + r() * (14 + k * 6)) * u, h = (5 + r() ** 2.4 * (34 + k * 24)) * u;
        c.fillRect(x, base - h, w + 0.5, h + 18 * u);
        x += w + (r() < 0.2 ? r() * 10 * u : 0);
      }
    }
  }

  /* the streets: wet asphalt at night, slush in the snow */
  {
    const zs = [300, 380, 480, 600, 720, 830, 960, 1200, 1500, 1900, 2400, 3000, 3800, 4700, 5330];
    const road = (c, a, b, d, e, Z) => {
      const f = fog(Z);
      c.fillStyle = css(mix(N ? [9, 30, 40] : [192, 208, 216], FOG, f * (N ? 0.75 : 0.9)));
      quad(c, a, b, d, e); c.fill();
    };
    for (let ix = -34; ix <= 34; ix++) {
      const x = PLAZA.x + ix * 100;
      for (let i = 0; i < zs.length - 1; i++) {
        const z0 = zs[i], z1 = zs[i + 1];
        if (Math.abs(x) > z1 * 0.62 + 140) continue;
        const a = pr(x - 13, 0, z0), b = pr(x + 13, 0, z0), d = pr(x + 13, 0, z1), e = pr(x - 13, 0, z1), c = g[z0 >= 830 ? 'far' : 'mid'];
        road(c, a, b, d, e, (a[2] + d[2]) / 2);
        if (N) {
          const m0 = pr(x, 0, z0), m1 = pr(x, 0, z1);
          c.globalCompositeOperation = 'lighter';
          c.strokeStyle = css([120, 215, 235], 0.2 * (1 - fog(m0[2])));
          c.lineWidth = Math.max(0.6, 4.5 * F / m0[2]);
          c.beginPath(); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]); c.stroke();
          c.globalCompositeOperation = 'source-over';
        }
      }
    }
    for (let k = 0; k < 50; k++) {
      const z = 430 + k * 100, half = z * 0.62 + 240, c = g[z >= 830 ? 'far' : 'mid'];
      const a = pr(-half, 0, z - 13), b = pr(half, 0, z - 13), d = pr(half, 0, z + 13), e = pr(-half, 0, z + 13);
      road(c, a, b, d, e, a[2]);
      if (N) {
        const m0 = pr(-half, 0, z), m1 = pr(half, 0, z);
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = css([120, 215, 235], 0.22 * (1 - fog(m0[2])));
        c.lineWidth = Math.max(0.5, 4.5 * F / m0[2]);
        c.beginPath(); c.moveTo(m0[0], m0[1]); c.lineTo(m1[0], m1[1]); c.stroke();
        c.globalCompositeOperation = 'source-over';
      }
    }
  }

  /* a circle on the ground or in the air, as a path */
  const arc = (c, r, y, a0, a1, move = true) => {
    const n = 72, d = (a1 - a0) / n;
    for (let i = 0; i <= n; i++) {
      const a = a0 + d * i, p = pr(PLAZA.x + r * Math.cos(a), y, PLAZA.z + r * Math.sin(a));
      if (i === 0 && move) c.moveTo(p[0], p[1]); else c.lineTo(p[0], p[1]);
    }
  };

  /* the plaza the hologram stands on */
  {
    const c = g.far;
    c.beginPath(); arc(c, PLAZA.r, 0, 0, Math.PI * 2); c.closePath();
    c.fillStyle = N ? '#06222c' : '#fbfdfd'; c.fill();
    for (const [r, a, w] of [[PLAZA.r, 0.9, 1.6], [PLAZA.r - 22, 0.35, 0.8], [112, 0.6, 1.1], [64, 0.8, 1.3], [26, 0.5, 0.9]]) {
      c.beginPath(); arc(c, r, 0, 0, Math.PI * 2); c.closePath();
      if (N) {
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = css([110, 225, 240], a * 0.35); c.lineWidth = w * 4 * u; c.stroke();
        c.strokeStyle = css([215, 245, 252], a); c.lineWidth = w * u; c.stroke();
        c.globalCompositeOperation = 'source-over';
      } else { c.strokeStyle = css(INK, a * 0.8); c.lineWidth = w * 0.8 * u; c.stroke(); }
    }
    c.beginPath();
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2, p = pr(PLAZA.x + (PLAZA.r - 22) * Math.cos(a), 0, PLAZA.z + (PLAZA.r - 22) * Math.sin(a)), q = pr(PLAZA.x + (PLAZA.r - (i % 4 ? 8 : 0)) * Math.cos(a), 0, PLAZA.z + (PLAZA.r - (i % 4 ? 8 : 0)) * Math.sin(a));
      c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
    }
    c.strokeStyle = N ? 'rgba(190,240,250,.5)' : css(INK, 0.5); c.lineWidth = 0.8 * u; c.stroke();
  }

  /* one face of a box, from A (left on screen) to B */
  function face(c, b, ax, az, bx, bz, side) {
    const p0 = pr(ax, b.y0, az), p1 = pr(bx, b.y0, bz), p2 = pr(bx, b.y1, bz), p3 = pr(ax, b.y1, az);
    if (Math.max(p1[0], p2[0]) < X0 || Math.min(p0[0], p3[0]) > X1 || Math.min(p3[1], p2[1]) > Y1 || Math.max(p0[1], p1[1]) < Y0) return;
    const Z = (p0[2] + p1[2]) / 2, fg = fog(Z), tall = b.y1 - b.y0;
    const yb = (p0[1] + p1[1]) / 2, yt = (p3[1] + p2[1]) / 2;
    const fh = yb - yt, fw = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    if (fh < 0.6 || fw < 0.4) return;
    const base = N ? mix(side ? [5, 11, 16] : [8, 17, 24], FOG, fg * 0.92) : mix(side ? [104, 130, 145] : [138, 161, 174], FOG, fg * 0.95);
    if (b.y0 === 0) {
      const gd = c.createLinearGradient(0, yb, 0, yt), lift = Math.min(1, 46 / tall);
      gd.addColorStop(0, css(N ? mix(base, [24, 92, 110], 0.34 * (1 - fg * 0.6)) : mix(base, [246, 249, 250], 0.5)));
      gd.addColorStop(lift, css(base)); gd.addColorStop(1, css(N ? mix(base, [0, 2, 4], 0.25 * (1 - fg)) : base));
      c.fillStyle = gd;
    } else c.fillStyle = css(base);
    quad(c, p0, p1, p2, p3); c.fill();

    const r = mul(b.seed + (side ? 911 : 0));
    const rows = Math.max(1, Math.round(tall / 3.9)), cols = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 3.4));
    const rh = fh / rows, cw = fw / cols;
    /* a point on the face: u along it, v up it */
    const at = (uu, v) => {
      const lx = p0[0] + (p3[0] - p0[0]) * v, ly = p0[1] + (p3[1] - p0[1]) * v, rx = p1[0] + (p2[0] - p1[0]) * v, ry = p1[1] + (p2[1] - p1[1]) * v;
      return [lx + (rx - lx) * uu, ly + (ry - ly) * uu];
    };

    if (!N) {                                        /* ice: floor lines and mullions in ink */
      const a = (1 - fg) * 0.5;
      if (a > 0.02) {
        if (rh >= 1.5 && b.style !== 'dark' && b.style !== 'strips') {
          const step = rh < 3 ? 2 : 1;
          c.beginPath();
          for (let i = step; i < rows; i += step) { const v = i / rows, l = at(0, v), q = at(1, v); c.moveTo(l[0], l[1]); c.lineTo(q[0], q[1]); }
          c.strokeStyle = css(INK, a * 0.55); c.lineWidth = Math.min(1, 0.5 + rh * 0.05); c.stroke();
        }
        if (cw >= 2.6 && b.style !== 'bands' && b.style !== 'dark') {
          const step = cw < 5 ? 3 : b.style === 'strips' ? 2 : 1;
          c.beginPath();
          for (let i = step; i < cols; i += step) { const q = at(i / cols, 0), t = at(i / cols, 1); c.moveTo(q[0], q[1]); c.lineTo(t[0], t[1]); }
          c.strokeStyle = css(INK, a * (b.style === 'strips' ? 0.6 : 0.34)); c.lineWidth = 0.6; c.stroke();
        }
        quad(c, p0, p1, p2, p3); c.strokeStyle = css(INK, a * 0.9); c.lineWidth = 0.8; c.stroke();
      }
      return;
    }

    const col = mix(LIGHT[b.hue], FOG, fg * 0.78), al = 1 - fg * 0.5;
    const dens = b.style === 'strips' ? b.lit * 0.3 : b.style === 'dark' ? b.lit * 0.16 : b.lit;
    if (rh < 1.1 || cw < 0.7) {                      /* far away: specks */
      const n = Math.min(70, Math.round((fw * fh / 16) * dens));
      c.fillStyle = css(col, 0.72 * al);
      for (let i = 0; i < n; i++) { const p = at(r(), r()); c.fillRect(p[0], p[1], Math.max(0.9, cw * 0.8), Math.max(0.9, rh * 0.6)); }
    } else if (rh < 3.2 || cw < 2.2) {                /* middle distance: a line a floor */
      c.lineWidth = Math.max(0.7, rh * 0.5);
      if (b.style === 'bands') {
        const P = [new Path2D(), new Path2D()];
        for (let i = 0; i < rows; i++) {
          if (r() >= dens) continue;
          const v = (i + 0.5) / rows, l = at(0.04, v), q = at(0.96, v), k = r() < 0.5 ? 0 : 1;
          P[k].moveTo(l[0], l[1]); P[k].lineTo(q[0], q[1]);
        }
        c.strokeStyle = css(col, 0.42 * al); c.stroke(P[0]);
        c.strokeStyle = css(col, 0.88 * al); c.stroke(P[1]);
      } else {
        for (let i = 0; i < rows; i++) {
          if (r() >= dens * 1.2 + 0.08) continue;
          const v = (i + 0.5) / rows, l = at(0.04, v), q = at(0.96, v);
          c.setLineDash([cw * (1 + ((r() * 3) | 0)), cw * (1 + ((r() * 4) | 0)), cw * (1 + ((r() * 2) | 0)), cw * (2 + ((r() * 7) | 0))]);
          c.lineDashOffset = r() * 40;
          c.strokeStyle = css(col, (0.35 + 0.6 * r()) * al);
          c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(q[0], q[1]); c.stroke();
        }
        c.setLineDash([]);
      }
    } else {                                          /* near: every window */
      const P = [new Path2D(), new Path2D(), new Path2D()];
      const E = [];
      for (let i = 0; i < cols; i++) {
        const u0 = (i + 0.14) / cols, u1 = (i + 0.86) / cols;
        E.push(pr(ax + (bx - ax) * u0, b.y0, az + (bz - az) * u0), pr(ax + (bx - ax) * u0, b.y1, az + (bz - az) * u0), pr(ax + (bx - ax) * u1, b.y0, az + (bz - az) * u1), pr(ax + (bx - ax) * u1, b.y1, az + (bz - az) * u1));
      }
      for (let i = 0; i < rows; i++) {
        const v0 = (i + 0.2) / rows, v1 = (i + 0.8) / rows, rowLit = r() < dens, rb = r();
        const yy = p0[1] + (p3[1] - p0[1]) * v0;
        if (yy < Y0 - 40 || yy > Y1 + 40) continue;
        for (let j = 0; j < cols; j++) {
          const lit = b.style === 'bands' ? rowLit && r() > 0.07 : r() < dens * (0.3 + 1.4 * rb);
          if (!lit) continue;
          const k = b.style === 'bands' ? (rb < 0.4 ? 0 : rb < 0.8 ? 1 : 2) : (r() * 3) | 0;
          const a = E[j * 4], t = E[j * 4 + 1], d = E[j * 4 + 2], e = E[j * 4 + 3], p = P[k];
          p.moveTo(a[0] + (t[0] - a[0]) * v0, a[1] + (t[1] - a[1]) * v0);
          p.lineTo(d[0] + (e[0] - d[0]) * v0, d[1] + (e[1] - d[1]) * v0);
          p.lineTo(d[0] + (e[0] - d[0]) * v1, d[1] + (e[1] - d[1]) * v1);
          p.lineTo(a[0] + (t[0] - a[0]) * v1, a[1] + (t[1] - a[1]) * v1);
          p.closePath();
        }
      }
      [0.3, 0.62, 0.96].forEach((a, k) => { c.fillStyle = css(col, a * al); c.fill(P[k]); });
    }

    if (b.style === 'strips' && !side && fw > 4) {    /* light down the edges of a dark tower */
      c.globalCompositeOperation = 'lighter';
      for (const uu of cols > 14 ? [0.07, 0.5, 0.93] : [0.08, 0.92]) {
        const q = at(uu, 0.01), t = at(uu, 0.985);
        c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(t[0], t[1]);
        c.strokeStyle = css(col, 0.2 * al); c.lineWidth = Math.max(1.6, cw * 1.8); c.stroke();
        c.strokeStyle = css(mix(col, [255, 255, 255], 0.5), 0.95 * al); c.lineWidth = Math.max(0.7, cw * 0.36); c.stroke();
      }
      c.globalCompositeOperation = 'source-over';
    }
    if (b.screen && !side && fw > 8) {                 /* a screen: light with nothing on it */
      const a = at(0.1, b.screen[0]), d = at(0.9, b.screen[0]), e = at(0.9, b.screen[1]), t = at(0.1, b.screen[1]);
      const gd = c.createLinearGradient(0, t[1], 0, a[1]);
      gd.addColorStop(0, css(mix([226, 246, 252], FOG, fg * 0.6))); gd.addColorStop(0.55, css(mix([84, 214, 216], FOG, fg * 0.6))); gd.addColorStop(1, css(mix([26, 92, 150], FOG, fg * 0.6)));
      c.fillStyle = gd; quad(c, a, d, e, t); c.fill();
      c.strokeStyle = 'rgba(0,10,16,.34)'; c.lineWidth = 0.6;
      c.beginPath();
      for (let y = t[1] + 1.5; y < a[1]; y += 2.5) { c.moveTo(a[0], y); c.lineTo(d[0], y); }
      c.stroke();
    }
  }

  function roof(c, b) {
    const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
    const a = pr(x0, b.y1, z0), d = pr(x1, b.y1, z0), e = pr(x1, b.y1, z1), t = pr(x0, b.y1, z1);
    if (Math.max(d[0], e[0]) < X0 || Math.min(a[0], t[0]) > X1 || t[1] > Y1 || a[1] < Y0) return;
    const fg = fog(a[2]);
    c.fillStyle = css(N ? mix([10, 25, 32], FOG, fg * 0.9) : mix([253, 254, 254], FOG, fg * 0.35));
    quad(c, a, d, e, t); c.fill();
    if (N) { c.strokeStyle = css([150, 218, 236], 0.24 * (1 - fg)); c.lineWidth = 0.8; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(d[0], d[1]); c.stroke(); }
    else { c.strokeStyle = css(INK, 0.45 * (1 - fg)); c.lineWidth = 0.7; c.stroke(); }
  }

  /* a blade sign on the front of a tower: one of the course's own words */
  function blade(c, b) {
    const word = (info.signs || [])[b.sign];
    if (!word) return;
    const z = b.z - b.d / 2 - 0.6, w = clamp(b.w * 0.34, 14, 22), x0 = b.x - b.w / 2 + b.w * 0.1, yT = b.y1 - 6, yB = Math.max(b.y0 + 20, b.y1 - 150);
    const tl = pr(x0, yT, z), br = pr(x0 + w, yB, z), x = tl[0], y = tl[1], pw = br[0] - tl[0], ph = br[1] - tl[1], st = word.state;
    const paper = N ? (st === 'now' ? '#e9f7fb' : st === 'done' ? 'rgba(5,36,46,.94)' : 'rgba(3,12,17,.92)') : (st === 'now' ? '#060b0e' : st === 'done' ? '#1f3640' : '#c9d6dc');
    const type = N ? (st === 'now' ? '#031016' : st === 'done' ? '#d2f1fa' : 'rgba(120,170,186,.55)') : (st === 'next' ? '#7f949e' : '#f6fafb');
    c.save();
    if (N && st !== 'next') { c.shadowColor = st === 'now' ? 'rgba(200,240,252,.9)' : 'rgba(70,215,225,.55)'; c.shadowBlur = (st === 'now' ? 22 : 12) * s; }
    c.fillStyle = paper; c.fillRect(x, y, pw, ph);
    c.shadowBlur = 0;
    c.strokeStyle = N ? 'rgba(150,225,240,.55)' : css(INK, 0.6); c.lineWidth = 0.7; c.strokeRect(x, y, pw, ph);
    c.fillStyle = type; c.textAlign = 'center'; c.textBaseline = 'middle';
    const text = word.text.toUpperCase(), fs = pw * 1.16, adv = fs * 0.92;
    if (text.length * adv < ph - pw * 0.5) {
      c.font = `400 ${fs}px 'Bebas Neue', sans-serif`;
      const y0 = y + (ph - text.length * adv) / 2 + adv / 2;
      [...text].forEach((ch, i) => c.fillText(ch, x + pw / 2, y0 + i * adv + fs * 0.04));
    } else {
      c.translate(x + pw / 2, y + ph / 2); c.rotate(-Math.PI / 2);
      c.font = `400 ${Math.min(pw * 0.98, (ph * 0.9) / (text.length * 0.43))}px 'Bebas Neue', sans-serif`;
      c.fillText(text, 0, pw * 0.05);
    }
    c.restore();
  }

  /* MIMEI down the side of the tower at the left edge */
  function nameplate(c, b) {
    const x = b.x + b.w / 2 + 0.4, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2, word = 'MIMEI', yT = 520, yB = 178, n = word.length;
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const y1 = yT - ((yT - yB) / n) * i, y2 = yT - ((yT - yB) / n) * (i + 1);
      const o = pr(x, y1, z0 + (z1 - z0) * 0.2), ex = pr(x, y1, z0 + (z1 - z0) * 0.8), ey = pr(x, y2, z0 + (z1 - z0) * 0.2);
      c.save();
      c.transform((ex[0] - o[0]) / 100, (ex[1] - o[1]) / 100, (ey[0] - o[0]) / 260, (ey[1] - o[1]) / 260, o[0], o[1]);
      c.translate(50, 130); c.scale(1, 2.05);
      c.font = "400 150px 'Bebas Neue', sans-serif";
      if (N) { c.shadowColor = 'rgba(80,225,230,.9)'; c.shadowBlur = 16 * s; c.fillStyle = '#e6fbff'; } else c.fillStyle = '#071015';
      c.fillText(word[i], 0, 4);
      if (N) c.fillText(word[i], 0, 4);
      c.restore();
    }
    c.restore();
  }

  for (const b of M.boxes) {
    const c = g[b.layer], x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
    if (x1 < 0) face(c, b, x1, z0, x1, z1, true);
    else if (x0 > 0) face(c, b, x0, z1, x0, z0, true);
    face(c, b, x0, z0, x1, z0, false);
    if (b.y1 < CAM.y) roof(c, b);
    if (b.sign !== undefined) blade(c, b);
    if (b.name) nameplate(c, b);
  }

  /* masts, and where their lights are (desk.js blinks them) */
  const beacons = [];
  for (const m of M.masts) {
    const a = pr(m.x, m.y0, m.z), t = pr(m.x, m.y1, m.z);
    if (t[0] < X0 || t[0] > X1 || t[1] < Y0 || a[1] > Y1) continue;
    const c = g[m.layer], f = fog(a[2]);
    c.strokeStyle = N ? css([120, 170, 190], 0.4 * (1 - f)) : css(INK, 0.5 * (1 - f));
    c.lineWidth = Math.max(0.5, 1.2 * F / a[2] * 0.6);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(t[0], t[1]); c.stroke();
    if (f < 0.72) beacons.push({ x: t[0], y: t[1], ph: m.ph, r: clamp(2.2 * F / a[2], 0.8, 2.6), layer: m.layer });
  }

  /* the ring road: the far half behind the hologram, the near half in front of it */
  const band = (c, a0, a1) => {
    const ri = RING.r - RING.w / 2, ro = RING.r + RING.w / 2;
    c.beginPath(); arc(c, ro, RING.y - 7, a0, a1); arc(c, ri, RING.y - 7, a1, a0, false); c.closePath();
    c.fillStyle = N ? '#02070a' : '#8fa6b2'; c.fill();
    c.beginPath(); arc(c, ro, RING.y, a0, a1); arc(c, ri, RING.y, a1, a0, false); c.closePath();
    c.fillStyle = N ? '#071a22' : '#fdfefe'; c.fill();
    if (!N) { c.strokeStyle = css(INK, 0.7); c.lineWidth = 0.8 * u; c.stroke(); }
    for (const r of [ro, ri]) {
      c.beginPath(); arc(c, r, RING.y + 1, a0, a1);
      if (N) {
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = 'rgba(90,220,235,.3)'; c.lineWidth = 5 * u; c.stroke();
        c.strokeStyle = 'rgba(225,248,253,.95)'; c.lineWidth = 1.1 * u; c.stroke();
        c.globalCompositeOperation = 'source-over';
      }
    }
  };
  const piers = (c, a0, a1) => {
    c.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      if (a < a0 || a > a1) continue;
      const p = pr(PLAZA.x + RING.r * Math.cos(a), RING.y - 7, PLAZA.z + RING.r * Math.sin(a)), q = pr(PLAZA.x + RING.r * Math.cos(a), 0, PLAZA.z + RING.r * Math.sin(a));
      c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
    }
    c.strokeStyle = N ? '#03090d' : css(INK, 0.6); c.lineWidth = 2.2 * u; c.stroke();
  };
  piers(g.far, 0, Math.PI); band(g.far, 0, Math.PI);

  /* what the hologram throws on the city round it */
  if (N) {
    const c = g.far, base = pr(HOLO.x, 0, HOLO.z), sp = c.createRadialGradient(base[0], base[1] - 40 * u, 0, base[0], base[1] - 40 * u, W * 0.36);
    sp.addColorStop(0, 'rgba(120,228,240,.22)'); sp.addColorStop(0.45, 'rgba(60,180,205,.08)'); sp.addColorStop(1, 'rgba(0,0,0,0)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = sp; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0); c.globalCompositeOperation = 'source-over';
  }
  piers(g.mid, Math.PI, Math.PI * 2); band(g.mid, Math.PI, Math.PI * 2);

  /* the billboard's truss and the clock's frame; the words on them are real elements, laid over these */
  const board = BOARD.map(p => pr(p[0], p[1], p[2])), clock = CLOCK.map(p => pr(p[0], p[1], p[2]));
  {
    const c = g.fore, zAt = x => 416 + ((x + 196) / 122) * 24;
    c.strokeStyle = N ? '#0b1b22' : '#22343d'; c.lineWidth = 2.4 * u; c.lineCap = 'round';
    c.beginPath();
    const legs = [-190, -152, -114, -80];
    legs.forEach((x, i) => {
      const top = pr(x, 262, zAt(x) + 1.5), foot = pr(x, 148, zAt(x) + 6), stay = pr(x, 148, zAt(x) + 24);
      c.moveTo(top[0], top[1]); c.lineTo(foot[0], foot[1]);
      c.moveTo(top[0], top[1]); c.lineTo(stay[0], stay[1]);
      if (i) { const pf = pr(legs[i - 1], 148, zAt(legs[i - 1]) + 6), mid = pr(x, 176, zAt(x) + 1.5), pm = pr(legs[i - 1], 176, zAt(legs[i - 1]) + 1.5); c.moveTo(pf[0], pf[1]); c.lineTo(mid[0], mid[1]); c.moveTo(foot[0], foot[1]); c.lineTo(pm[0], pm[1]); }
    });
    c.stroke();
    const grow = (q, k) => { const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2; return q.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * (1 + (k - 1) * 1.6)]); };
    const fr = grow(board, 1.022);
    c.fillStyle = N ? '#02070a' : '#0b1418'; quad(c, fr[0], fr[1], fr[2], fr[3]); c.fill();
    if (N) { c.shadowColor = 'rgba(190,236,250,.55)'; c.shadowBlur = 60 * s; }
    c.fillStyle = N ? '#f1fafd' : '#05090c'; quad(c, board[0], board[1], board[2], board[3]); c.fill();
    c.shadowBlur = 0;
    /* the clock: two posts and a dark board */
    c.beginPath();
    for (const x of [204, 250, 296]) { const a = pr(x, 300, 567), t = pr(x, 352, 567); c.moveTo(a[0], a[1]); c.lineTo(t[0], t[1]); }
    c.stroke();
    const cf = grow(clock, 1.03);
    c.fillStyle = N ? '#01060a' : '#f9fbfc'; quad(c, cf[0], cf[1], cf[2], cf[3]); c.fill();
    c.strokeStyle = N ? 'rgba(150,225,240,.5)' : css(INK, 0.8); c.lineWidth = 1 * u; c.stroke();
  }

  /* light that spreads: the bright parts, blurred and added back */
  if (N) {
    for (const k of ['far', 'mid', 'fore']) {
      const cvs = cv[k], c = g[k], w = cvs.width, h = cvs.height;
      for (const [div, alpha] of [[4, 0.55], [12, 0.5]]) {
        const sm = scratch(0, Math.ceil(w / div), Math.ceil(h / div)), sx = sm.getContext('2d');
        sx.imageSmoothingQuality = 'high';
        sx.drawImage(cvs, 0, 0, sm.width, sm.height);
        sx.globalCompositeOperation = 'multiply'; sx.drawImage(sm, 0, 0);          // darks fall away, lights stay
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingQuality = 'high';
        if (k === 'far') { c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha; c.drawImage(sm, 0, 0, w, h); }
        else {
          const full = scratch(1, w, h), fx = full.getContext('2d');
          fx.imageSmoothingQuality = 'high'; fx.drawImage(sm, 0, 0, w, h);
          fx.globalCompositeOperation = 'destination-in'; fx.drawImage(cvs, 0, 0);    // only where this layer is
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha; c.drawImage(full, 0, 0);
        }
        c.restore();
      }
    }
    if (scratchB) { scratchB.width = scratchB.height = 1; }
  }

  return { pr, beacons, board, clock, holo: { tl: pr(HOLO.x - HOLO.w / 2, HOLO.y0 + HOLO.h, HOLO.z), br: pr(HOLO.x + HOLO.w / 2, HOLO.y0, HOLO.z), c: hc } };
}
