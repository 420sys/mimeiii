/* B · Filigree: the drawing hand.

   Nothing here touches the page. A spine is walked from a curvature programme
   (curvature changes linearly along it, then winds into a logarithmic curl), so
   every curve is one continuous gesture with no joins. A ribbon, blade, lobe or
   feather is a spine given a width that swells and tapers. The crest, the small
   page ornaments and the banner are built from those and returned as SVG. */

const PI = Math.PI, TAU = PI * 2, DEG = PI / 180, STEP = 0.2;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const f = v => String(Math.round(v * 10) / 10);
const xy = p => `${f(p.x)} ${f(p.y)}`;
const V = (x, y) => ({ x, y });
const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const mix = (a, b, t) => V(lerp(a.x, b.x, t), lerp(a.y, b.y, t));

/* ── curves through points ────────────────────────────────────────────── */

/** Cubic segments through P (chord-length Catmull-Rom). The pen is already at P[0]. */
function chain(P, closed = false) {
  const n = P.length;
  const T = P.map((p, i) => {
    const a = closed ? P[(i - 1 + n) % n] : P[Math.max(0, i - 1)];
    const c = closed ? P[(i + 1) % n] : P[Math.min(n - 1, i + 1)];
    const dx = c.x - a.x, dy = c.y - a.y, m = Math.hypot(dx, dy) || 1;
    return [dx / m, dy / m];
  });
  let d = '';
  for (let i = 0, m = closed ? n : n - 1; i < m; i++) {
    const b = P[i], c = P[(i + 1) % n], tb = T[i], tc = T[(i + 1) % n], h = dist(b, c) / 3;
    d += `C${f(b.x + tb[0] * h)} ${f(b.y + tb[1] * h)} ${f(c.x - tc[0] * h)} ${f(c.y - tc[1] * h)} ${xy(c)}`;
  }
  return d;
}
export const open = P => `M${xy(P[0])}${chain(P)}`;
export const loop = P => `M${xy(P[0])}${chain(P, true)}Z`;
/** A dot. Wound the same way as the blades, so it joins them instead of cutting a hole. */
export const dot = (x, y, r) => `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 1 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 1 ${f(-2 * r)} 0Z`;

/* ── spines ───────────────────────────────────────────────────────────── */

/** Walk a programme in its own units from the origin, heading along +x.
 *  prog.k = [k0, len, k1, len, k2 …]: curvature (1 / radius; + turns clockwise
 *  on screen) at each node and the length between nodes. prog.curl = [turns, c]
 *  winds on into a logarithmic spiral from the last curvature; prog.uncurl
 *  unwinds one out of the first. */
function trace(prog, flip = 1) {
  let x = 0, y = 0, th = 0, s = 0;
  const pts = [];
  const put = k => pts.push({ x, y, th, s, k });
  const go = (ds, k) => { const d = k * ds; x += Math.cos(th + d / 2) * ds; y += Math.sin(th + d / 2) * ds; th += d; s += ds; put(k); };
  const K = prog.k.map((v, i) => (i % 2 ? v : v * flip));
  if (prog.uncurl) {
    const [turns, c = 0.2] = prog.uncurl, r1 = 1 / Math.abs(K[0]), dir = Math.sign(K[0]);
    const tot = turns * TAU, n = Math.ceil(tot / STEP), dp = tot / n;
    put(dir / (r1 * Math.exp(-c * tot)));
    for (let i = 0; i < n; i++) { const r = r1 * Math.exp(-c * (tot - (i + 0.5) * dp)); go(r * dp, dir / r); }
  } else put(K[0]);
  for (let i = 1; i < K.length; i += 2) {
    const len = K[i], k0 = K[i - 1], k1 = K[i + 1];
    const n = Math.max(2, Math.ceil(Math.max(len / 8, Math.abs(k0 + k1) * len / 2 / STEP)));
    for (let j = 0; j < n; j++) go(len / n, lerp(k0, k1, (j + 0.5) / n));
  }
  if (prog.curl) {
    const [turns, c = 0.2] = prog.curl, kl = K[K.length - 1], r0 = 1 / Math.abs(kl), dir = Math.sign(kl);
    const tot = turns * TAU, n = Math.ceil(tot / STEP), dp = tot / n;
    for (let i = 0; i < n; i++) { const r = r0 * Math.exp(-c * (i + 0.5) * dp); go(r * dp, dir / r); }
  }
  return pts;
}
/** Turn, scale and move a traced spine so it runs from A to B (B is the eye of its curl). */
function fit(pts, A, B) {
  const E = pts[pts.length - 1], sc = dist(A, B) / Math.hypot(E.x, E.y), ra = Math.atan2(B.y - A.y, B.x - A.x) - Math.atan2(E.y, E.x);
  const c = Math.cos(ra), s = Math.sin(ra);
  return pts.map(p => ({ x: A.x + sc * (p.x * c - p.y * s), y: A.y + sc * (p.x * s + p.y * c), th: p.th + ra, s: p.s * sc, k: p.k / sc }));
}
/** Place a traced spine at O with a heading. */
function place(pts, O, heading, sc = 1) {
  const c = Math.cos(heading), s = Math.sin(heading);
  return pts.map(p => ({ x: O.x + sc * (p.x * c - p.y * s), y: O.y + sc * (p.x * s + p.y * c), th: p.th + heading, s: p.s * sc, k: p.k / sc }));
}
export const spine = (prog, A, B, flip = 1) => fit(trace(prog, flip), A, B);

/** The point a fraction u of the way along a spine. */
export function at(pts, u) {
  const S = pts[pts.length - 1].s, s = clamp(u) * S;
  let lo = 0, hi = pts.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (pts[m].s <= s) lo = m; else hi = m; }
  const a = pts[lo], b = pts[hi], t = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), th: lerp(a.th, b.th, t), k: lerp(a.k, b.k, t), s, u: s / S };
}
/** Points along a spine from u0 to u1, pushed sideways by off (+ is the right-hand side). */
export function along(pts, u0, u1, off = 0, n = 0) {
  n = n || Math.max(4, Math.ceil(Math.abs(u1 - u0) * pts.length));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const p = at(pts, lerp(u0, u1, i / n)), o = typeof off === 'function' ? off(p.u, p) : off;
    out.push(V(p.x - Math.sin(p.th) * o, p.y + Math.cos(p.th) * o));
  }
  return out;
}
/** A quadratic Bézier sampled as a spine (dense towards the tip). */
function quadSpine(P0, P1, P2, n = 12, bias = 1.6) {
  const pts = [];
  let s = 0, prev = null;
  for (let i = 0; i <= n; i++) {
    const t = 1 - (1 - i / n) ** bias, m = 1 - t;
    const p = V(m * m * P0.x + 2 * m * t * P1.x + t * t * P2.x, m * m * P0.y + 2 * m * t * P1.y + t * t * P2.y);
    const dx = 2 * m * (P1.x - P0.x) + 2 * t * (P2.x - P1.x), dy = 2 * m * (P1.y - P0.y) + 2 * t * (P2.y - P1.y);
    if (prev) s += dist(prev, p);
    pts.push({ x: p.x, y: p.y, th: Math.atan2(dy, dx), s, k: 0 });
    prev = p;
  }
  return pts;
}
const cubicAt = (P, t) => {
  const m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
  return V(a * P[0].x + b * P[1].x + c * P[2].x + d * P[3].x, a * P[0].y + b * P[1].y + c * P[2].y + d * P[3].y);
};

/* ── ribbons and blades ───────────────────────────────────────────────── */

function hull(L, R, tip) {
  const n = L.length - 1;
  if (tip === 'round') { const ring = L.concat(R.slice(0, n).reverse()); return `M${xy(ring[0])}${chain(ring)}Z`; }
  return `M${xy(L[0])}${chain(L)}L${xy(R[n])}${chain(R.slice().reverse())}Z`;
}
/** A spine given a half-width wf(u, p), which may be [left, right]. */
export function ribbon(pts, wf, tip = 'point') {
  const S = pts[pts.length - 1].s, L = [], R = [];
  for (const p of pts) {
    const w = wf(p.s / S, p), wl = w.length ? w[0] : w, wr = w.length ? w[1] : w;
    const nx = -Math.sin(p.th), ny = Math.cos(p.th);
    L.push(V(p.x - nx * wl, p.y - ny * wl));
    R.push(V(p.x + nx * wr, p.y + ny * wr));
  }
  return hull(L, R, tip);
}
/** A leaf-shaped width: W at its fattest, a sets how soon it swells, b how long it tapers. */
export const leafW = (W, a = 0.5, b = 1) => {
  const us = a / (a + b), m = us ** a * (1 - us) ** b;
  return u => W * (clamp(u) ** a) * ((1 - clamp(u)) ** b) / m;
};

/* ── the scroll: a tapered ribbon that winds into a curl with a ball ──── */

/** Returns the spine, its outline (ball included), the engraved line inside it and its width. */
export function scroll(prog, A, B, o = {}) {
  const { w = 8, alpha = 0.34, root = 0.4, peak = 0.32, fall = 0.45, flip = 1, ball = 0.62, cut = 0.42, pointed = false } = o;
  const pts = spine(prog, A, B, flip);
  const both = !!prog.uncurl;
  const wf = (u, p) => {
    const prof = both ? 1 - 0.25 * Math.abs(u - 0.5) * 2 : u < peak ? lerp(root, 1, ease(u / peak)) : 1 - fall * ((u - peak) / (1 - peak)) ** 1.6;
    const a = Math.max(0.01, w * prof * (pointed ? Math.min(1, u / 0.06) ** 0.6 : 1)), b = alpha / Math.max(Math.abs(p.k), 1e-5);
    return (a ** -4 + b ** -4) ** -0.25;
  };
  let d = ribbon(pts, wf, 'flat');
  const knob = (e, fwd) => {
    const re = 1 / Math.abs(e.k), we = wf(e.u, e), rho = Math.max(ball * re, we * 1.5), sg = Math.sign(e.k);
    const nx = -Math.sin(e.th), ny = Math.cos(e.th);
    return dot(e.x + sg * nx * (rho - we) + fwd * Math.cos(e.th) * rho * 0.3, e.y + sg * ny * (rho - we) + fwd * Math.sin(e.th) * rho * 0.3, rho);
  };
  if (ball) {
    d += knob({ ...pts[pts.length - 1], u: 1 }, 1);
    if (both) d += knob({ ...pts[0], u: 0 }, -1);
  }
  /* the engraved line rides the outside of the bend and crosses over where the bend reverses */
  const line = cut ? open(along(pts, both ? 0.04 : 0.07, 0.95, (u, p) => -Math.tanh(p.k * 90) * wf(u, p) * cut)) : '';
  return { pts, d, line, wf };
}

/* ── acanthus ─────────────────────────────────────────────────────────── */

/** One lobe: a fat blade that leans along the stem and flicks its tip away from it. */
function lobe(O, heading, len, side, fat = 0.2, hook = 1) {
  const q = hook / len;
  const pts = place(trace({ k: [-1.0 * q, len * 0.55, -0.3 * q, len * 0.45, 2.6 * q] }, side), O, heading);
  return { d: ribbon(pts, leafW(len * fat, 0.6, 1.05)), vein: open(along(pts, 0.12, 0.8)) };
}
/** Lobes along one side of a spine. side: +1 right-hand, −1 left-hand, 0 the outside of the bend. */
export function fringe(pts, o) {
  const { from = 0.1, to = 0.8, n = 5, side = 0, len = 30, env = t => 1 - 0.55 * t, lean = 54, fat = 0.2, hook = 1, wf = () => 0, jit = null } = o;
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1), p = at(pts, lerp(from, to, t));
    const sd = side || -Math.sign(p.k) || 1, w = wf(p.u, p);
    const O = V(p.x - Math.sin(p.th) * sd * w * 0.35, p.y + Math.cos(p.th) * sd * w * 0.35);
    const l = len * env(t) * (jit ? 0.9 + 0.2 * jit() : 1);
    out.push(lobe(O, p.th + sd * lean * DEG, l, sd, fat, hook));
  }
  return out;
}
/** A whole leaf from A to its tip B: a curling rib, long lobes outside the bend, short ones inside. */
export function leaf(A, B, o = {}) {
  const { flip = 1, bend = 1, n = 5, fat = 0.13, lobes = 0.4 } = o;
  const pts = spine({ k: [0.002 * bend, 45, 0.007 * bend, 40, 0.02 * bend, 15, 0.05 * bend] }, A, B, flip);
  const L = pts[pts.length - 1].s, wf = leafW(L * fat, 0.55, 1.2);
  const out = -flip * Math.sign(bend);
  const outer = fringe(pts, { from: 0.1, to: 0.74, n, side: out, len: L * lobes, env: t => 0.55 + 0.45 * Math.sin(PI * (0.12 + 0.76 * t)) - 0.25 * t, lean: 50, wf });
  const inner = fringe(pts, { from: 0.2, to: 0.7, n: Math.max(2, n - 2), side: -out, len: L * lobes * 0.6, env: t => 1 - 0.4 * t, lean: 46, wf, hook: 0.7 });
  return { pts, body: ribbon(pts, wf), rib: open(along(pts, 0.05, 0.86)), lobes: inner.concat(outer) };
}

/* ── feathers and the wing ────────────────────────────────────────────── */

/** A feather from its base b to its tip e. The vane is narrower on the leading side. */
function feather(b, e, o = {}) {
  const { w = 12, sag = 0.07, blunt = 0.6, lead = 0.8, slits = 0 } = o;
  const len = dist(b, e), ux = (e.x - b.x) / len, uy = (e.y - b.y) / len;
  const c = V((b.x + e.x) / 2 + uy * sag * len, (b.y + e.y) / 2 - ux * sag * len);
  const pts = quadSpine(b, c, e, 13);
  const prof = u => (0.5 + 0.5 * ease(u / 0.28)) * (1 - u ** 3) ** blunt;
  const d = ribbon(pts, u => [w * lead * prof(u), w * (2 - lead) * prof(u)], 'round');
  const rachis = open(along(pts, 0.02, 0.92, -w * 0.1, 8));
  let cut = '';
  for (let i = 0; i < slits; i++) {
    const u = lerp(0.34, 0.86, i / Math.max(1, slits - 1)), p = at(pts, u), q = at(pts, u - 0.075);
    const wp = w * (2 - lead) * prof(u);
    cut += `M${f(p.x - Math.sin(p.th) * wp)} ${f(p.y + Math.cos(p.th) * wp)}L${f(q.x - Math.sin(q.th) * wp * 0.3)} ${f(q.y + Math.cos(q.th) * wp * 0.3)}`;
  }
  return { d, rachis, cut, pts };
}

/* ── the crest ────────────────────────────────────────────────────────── */

export const CREST = { rx: 84, ry: 106, top: -262, bottom: 244, half: 470 };

/** One half of the crest (drawn for the right; the left is the same markup mirrored).
 *  variant 'l' changes the lowest scrollwork a little, so the two sides are not a stamp. */
export function crestHalf(variant = 'r') {
  const F = [], SK = [], SH = [];
  const add = (cls, d) => F.push(`<path class="${cls}" d="${d}"/>`);
  const sk = (d, p) => SK.push(`<path pathLength="1" style="--d:${(Math.hypot(p.x, p.y) / 520 * 0.55).toFixed(2)}s" d="${d}"/>`);
  let cuts = '';
  const putScroll = (cls, s) => { add(cls, s.d); if (s.line) cuts += s.line; sk(open(along(s.pts, 0, 1)), s.pts[0]); };
  const putLobes = (cls, lobes) => { for (const l of lobes) { add(`${cls} f`, l.d); cuts += l.vein; } };
  const putLeaf = (cls, lf) => { putLobes(cls, lf.lobes); add(cls, lf.body); cuts += lf.rib; sk(open(along(lf.pts, 0, 1)), lf.pts[0]); };
  const flush = () => { if (cuts) { add('cut', cuts); cuts = ''; } };

  /* tendrils, behind everything */
  const T = (A, B, flip, w = 2.1, prog) => scroll(prog || { k: [0.004, 60, -0.006, 50, -1 / 13], curl: [1.05, 0.2] }, A, B, { w, flip, root: 0.7, alpha: 0.3, cut: 0, ball: 0.8 });
  const t1 = T(V(196, 118), V(318, 132), 1), t2 = T(V(118, 168), V(196, 226), -1);
  const t3 = variant === 'l' ? T(V(60, 208), V(150, 262), -1, 2.3) : T(V(60, 208), V(128, 250), -1);
  const t4 = T(V(60, -128), V(118, -196), -1, 1.8);
  for (const t of [t1, t2, t3, t4]) { add('c', t.d); sk(open(along(t.pts, 0, 1)), t.pts[0]); }
  /* beads trailing off the tendrils */
  let beads = '';
  const trail = (p, th, n, r0, gap) => { for (let i = 0; i < n; i++) { const g = gap * (i + 1) * (1 - 0.06 * i); beads += dot(p.x + Math.cos(th) * g, p.y + Math.sin(th) * g, r0 * (1 - i / (n + 0.6))); } };
  trail(V(330, 118), -0.5, 4, 2.6, 9);
  trail(V(210, 236), 0.7, 3, 2.2, 8);
  if (variant === 'l') trail(V(160, 274), 0.9, 4, 2.4, 8);
  add('c', beads);

  /* the wing: flight feathers, then three ranks of coverts laid over their bases */
  const Bq = [V(98, -10), V(138, -112), V(262, -172)];
  const Tc = [V(150, 18), V(300, 66), V(444, -8), V(458, -252)];
  const base = t => { const m = 1 - t; return V(m * m * Bq[0].x + 2 * m * t * Bq[1].x + t * t * Bq[2].x, m * m * Bq[0].y + 2 * m * t * Bq[1].y + t * t * Bq[2].y); };
  const rank = (cls, n, reach, w0, w1, o = {}) => {
    for (let i = 0; i < n; i++) {
      const t = (i + (o.shift || 0)) / (n - 1 + (o.shift || 0) * 2), tt = clamp(t) ** 0.92;
      const b = base(tt), e = mix(b, cubicAt(Tc, tt), reach * (1 + (o.wave || 0) * Math.sin(i * 2.4)));
      const fe = feather(b, e, { w: lerp(w0, w1, t), sag: lerp(o.sag0 ?? 0.1, o.sag1 ?? 0.045, t), blunt: o.blunt ?? 0.6, slits: o.slits ? (t > 0.3 ? 5 : 3) : 0 });
      add(`${cls} f`, fe.d);
      cuts += fe.rachis + fe.cut;
      if (o.sk) sk(fe.rachis, b);
      if (o.shim && t > 0.5) SH.push(`<path pathLength="1" style="--d:${(i * 0.37 % 5).toFixed(2)}s" d="${fe.rachis}"/>`);
    }
    flush();
  };
  rank('f1', 18, 1, 13.5, 11, { slits: true, sk: true, shim: true });
  rank('f2', 15, 0.52, 11.5, 10, { blunt: 0.7, wave: 0.04, shift: 0.5, sk: true });
  rank('f3', 13, 0.3, 9.5, 9, { blunt: 0.8, wave: 0.05 });
  rank('f4', 12, 0.16, 7.5, 7.5, { blunt: 0.9, shift: 0.5 });

  /* leaves */
  putLeaf('b', leaf(V(166, 96), V(300, 78), { flip: -1, n: 6 }));
  putLeaf('b', leaf(V(112, 150), V(214, 196), { flip: 1, n: 5 }));
  putLeaf('b', variant === 'l' ? leaf(V(34, 168), V(104, 246), { flip: -1, n: 5 }) : leaf(V(34, 168), V(92, 236), { flip: -1, n: 4 }));
  putLeaf('b', leaf(V(40, -108), V(96, -168), { flip: 1, n: 4, bend: 0.8 }));
  flush();

  /* the scrolls */
  const s4 = scroll({ k: [0.003, 50, -0.004, 40, -1 / 15], curl: [1.1, 0.2] }, V(138, 122), V(252, 134), { w: 5.5 });
  putLobes('b', fringe(s4.pts, { from: 0.2, to: 0.62, n: 4, len: 24, wf: s4.wf }));
  putScroll('a', s4);
  const s3 = scroll({ k: [0.004, 60, 0.012, 30, 1 / 17], curl: [1.1, 0.2] }, V(86, 142), V(50, 198), { w: 6.5 });
  putLobes('b', fringe(s3.pts, { from: 0.12, to: 0.6, n: 4, len: 22, wf: s3.wf }));
  putScroll('a', s3);
  const s2 = scroll({ k: [-0.003, 90, -0.009, 60, -1 / 30], curl: [1.3, 0.2] }, V(2, 128), V(190, 86), { w: 9.5 });
  putLobes('b', fringe(s2.pts, { from: 0.1, to: 0.66, n: 7, len: 34, wf: s2.wf }));
  putScroll('a', s2);
  const s5 = scroll({ k: [0.002, 40, 0.012, 24, 1 / 12], curl: [1.1, 0.2] }, V(20, -104), V(62, -150), { w: 4.5 });
  putScroll('a', s5);
  flush();

  /* the arm: the wing's leading edge, winding into the shoulder */
  const arm = scroll({ k: [-0.0012, 110, -0.0035, 55, -1 / 36], curl: [1.25, 0.2] }, V(268, -182), V(120, -34), { w: 11, pointed: true, root: 0.3, peak: 0.6, fall: 0.2 });
  putLobes('b', fringe(arm.pts, { from: 0.42, to: 0.7, n: 5, len: 26, wf: arm.wf }));
  putScroll('a', arm);
  flush();

  return `<g class="fills">${F.join('')}</g><g class="sk">${SK.join('')}</g><g class="shim">${SH.join('')}</g>`;
}

/** The middle of the crest: the cartouche (a double hairline, lathe-work between, beads outside),
 *  the 未 as a mask, the palmette above and the pendant below. */
export function crestCentre(markHref, id = 'b-mark') {
  const { rx, ry } = CREST;
  const ell = (a, b, n, fn) => { const P = []; for (let i = 0; i < n; i++) { const t = i / n * TAU; P.push(fn ? fn(t) : V(a * Math.cos(t), b * Math.sin(t))); } return P; };
  /* lathe-work: two waves round the oval, half a beat apart, so they braid */
  const wave = ph => loop(ell(0, 0, 264, t => { const r = 3.1 * Math.sin(44 * t + ph); return V((rx - 4.6 + r) * Math.cos(t), (ry - 4.6 + r) * Math.sin(t)); }));
  let beads = '';
  const N = 72;
  for (let i = 0; i < N; i++) { const t = (i + 0.5) / N * TAU; beads += dot((rx + 9) * Math.cos(t), (ry + 9) * Math.sin(t), i % 6 === 2 ? 2.3 : 1.35); }
  /* palmette */
  const blades = [];
  for (const [a, l, w] of [[0, 62, 7], [-26, 50, 6], [26, 50, 6], [-52, 36, 5], [52, 36, 5]]) {
    const th = (-90 + a) * DEG, O = V(0, -ry - 8);
    const pts = place(trace({ k: [0, l * 0.6, 0.004 * Math.sign(a), l * 0.4, 0.03 * Math.sign(a)] }), O, th);
    blades.push(`<path class="a f" d="${ribbon(pts, leafW(w, 0.5, 1))}"/><path class="cut" d="${open(along(pts, 0.1, 0.8))}"/>`);
  }
  /* pendant */
  const drop = (y, l, w) => ribbon(place(trace({ k: [0, l, 0] }), V(0, y), 90 * DEG), leafW(w, 0.42, 0.9));
  const pend = `<path class="a" d="${dot(0, ry + 20, 4.6)}${drop(ry + 26, 46, 8.5)}${dot(0, ry + 78, 3.2)}${drop(ry + 83, 30, 4.6)}${dot(0, ry + 120, 1.9)}${dot(0, ry + 128, 1.2)}"/>
    <path class="cut" d="M0 ${ry + 34}V${ry + 62}"/>`;
  const sc = 0.585, mw = 240 * sc, mh = 284 * sc, mx = -119.5 * sc, my = -127 * sc;
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="${f(mx)}" y="${f(my)}" width="${f(mw)}" height="${f(mh)}" style="mask-type:alpha"><image href="${markHref}" x="${f(mx)}" y="${f(my)}" width="${f(mw)}" height="${f(mh)}"/></mask></defs>
    <g class="fills">
      ${blades.join('')}<path class="a" d="${dot(0, -ry - 9, 5.2)}"/>${pend}
      <ellipse class="disc" rx="${rx + 3}" ry="${ry + 3}"/>
      <path class="bead" d="${beads}"/>
      <ellipse class="ln2" rx="${rx}" ry="${ry}"/><ellipse class="ln1" rx="${rx - 9.2}" ry="${ry - 9.2}"/>
      <path class="lathe" d="${wave(0)}${wave(PI)}"/>
      <rect class="mk" x="${f(mx)}" y="${f(my)}" width="${f(mw)}" height="${f(mh)}" mask="url(#${id})"/>
    </g>
    <g class="sk"><ellipse pathLength="1" style="--d:0s" rx="${rx}" ry="${ry}"/><ellipse pathLength="1" style="--d:.1s" rx="${rx - 9.2}" ry="${ry - 9.2}"/></g>`;
}

/* ── the banner under the crest ───────────────────────────────────────── */

/** A ribbon banner for a band bw × bh (px), with folded swallow-tail ends. u is one plate unit in px. */
export function banner(bw, bh, u) {
  const tl = 78 * u, fw = 17 * u, drop = 13 * u, rise = 4 * u, notch = 20 * u, pad = 8 * u;
  const W = bw + 2 * tl, H = bh + drop + rise + 2 * pad;
  const x0 = tl, x1 = tl + bw, yt = pad, yb = pad + bh, mid = W / 2;
  const band = `M${f(x0)} ${f(yt + rise)}Q${f(mid)} ${f(yt - rise)} ${f(x1)} ${f(yt + rise)}L${f(x1)} ${f(yb + rise)}Q${f(mid)} ${f(yb - rise)} ${f(x0)} ${f(yb + rise)}Z`;
  const inner = `M${f(x0 + 5 * u)} ${f(yt + rise + 4.5 * u)}Q${f(mid)} ${f(yt - rise + 4.5 * u)} ${f(x1 - 5 * u)} ${f(yt + rise + 4.5 * u)}M${f(x1 - 5 * u)} ${f(yb + rise - 4.5 * u)}Q${f(mid)} ${f(yb - rise - 4.5 * u)} ${f(x0 + 5 * u)} ${f(yb + rise - 4.5 * u)}`;
  const tail = s => {
    /* s = +1 right, −1 left; X() mirrors about the middle */
    const X = x => (s > 0 ? x : W - x);
    const a = x1 - fw, b = x1 + tl - 2 * u, t = yt + rise + drop, m = (yt + yb) / 2 + rise + drop, bt = yb + rise + drop;
    return {
      shape: `M${f(X(a))} ${f(t)}C${f(X(a + 30 * u))} ${f(t - 7 * u)} ${f(X(b - 26 * u))} ${f(t + 7 * u)} ${f(X(b))} ${f(t - 3 * u)}L${f(X(b - notch))} ${f(m)}L${f(X(b))} ${f(bt + 2 * u)}C${f(X(b - 26 * u))} ${f(bt + 9 * u)} ${f(X(a + 30 * u))} ${f(bt - 5 * u)} ${f(X(a))} ${f(bt)}Z`,
      fold: `M${f(X(x1))} ${f(yb + rise)}L${f(X(a))} ${f(bt)}L${f(X(a))} ${f(yb + rise - 1.2 * u)}Z`,
      hatch: [0, 1, 2, 3, 4].map(i => `M${f(X(x1 + (3 + i * 3.6) * u))} ${f(t + (2 - i * 0.3) * u)}V${f(bt - (3 + i * 5) * u)}`).join(''),
    };
  };
  const R = tail(1), L = tail(-1);
  return `<svg class="bn" viewBox="0 0 ${f(W)} ${f(H)}" width="${f(W)}" height="${f(H)}" style="left:${f(-tl)}px;top:${f(-pad)}px" aria-hidden="true">
    <path class="bn-tail" d="${R.shape}${L.shape}"/><path class="bn-hatch" d="${R.hatch}${L.hatch}"/><path class="bn-fold" d="${R.fold}${L.fold}"/>
    <path class="bn-band" d="${band}"/><path class="bn-in" d="${inner}"/></svg>`;
}

/* ── small ornaments for the calm pages ───────────────────────────────── */

const svg = (w, h, body, cls = '') => `<svg class="orn ${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${body}</svg>`;

/** A scroll flourish for the corner of a pane: it grows from the corner along both edges. */
export function corner() {
  const a = scroll({ k: [0.004, 40, 0.014, 26, 1 / 9], curl: [1.1, 0.2] }, V(4, 4), V(52, 22), { w: 2.6, root: 0.5, cut: 0, ball: 0.7 });
  const b = scroll({ k: [-0.004, 30, -0.016, 20, -1 / 7], curl: [1.05, 0.2] }, V(4, 4), V(20, 40), { w: 2.1, root: 0.5, cut: 0, ball: 0.7 });
  const lf = fringe(a.pts, { from: 0.16, to: 0.5, n: 3, len: 11, wf: a.wf, fat: 0.22 });
  return svg(64, 52, `<path d="${lf.map(l => l.d).join('')}${a.d}${b.d}${dot(4, 4, 2)}${dot(60, 10, 1.1)}${dot(27, 47, 1)}"/>`, 'orn-corner');
}
/** A fleuron rule: a hairline, broken in the middle by two small scrolls and a lozenge. */
export function fleuron(w = 240) {
  const m = w / 2;
  const s = flip => scroll({ k: [0.01, 12, 0.05, 8, 1 / 4.2], curl: [1, 0.2] }, V(m + 5, 8), V(m + 22, 8.5), { w: 1.7, root: 0.6, cut: 0, ball: 0.72, flip }).d;
  const mir = d => `<path transform="translate(${w} 0) scale(-1 1)" d="${d}"/>`;
  const side = s(1) + s(-1);
  return svg(w, 16, `<path d="${side}M${f(m)} 4.2L${f(m + 3.6)} 8L${f(m)} 11.8L${f(m - 3.6)} 8Z"/>${mir(side)}<path class="hair" d="M0 8H${f(m - 30)}M${f(m + 30)} 8H${w}"/><path d="${dot(m - 34, 8, 1.1)}${dot(m + 34, 8, 1.1)}"/>`, 'orn-fleuron');
}
/** A small wing for the key idea's cartouche. */
export function winglet() {
  let d = '', c = '';
  const fs = [[V(8, 22), V(47, 6), 4.2], [V(7, 23), V(44, 14), 4], [V(6, 24), V(38, 21), 3.7], [V(5, 25), V(30, 26.5), 3.3], [V(5, 26), V(22, 30), 2.8]];
  for (const [b, e, w] of fs) { const fe = feather(b, e, { w, sag: 0.09 }); d += fe.d; c += fe.rachis; }
  const a = scroll({ k: [0.01, 16, 0.05, 8, 1 / 4.6], curl: [1.05, 0.2] }, V(26, 9), V(8, 22.5), { w: 2.4, root: 0.4, cut: 0, ball: 0.75, flip: -1 });
  return svg(50, 34, `<path class="fe" d="${d}"/><path class="rc" d="${c}"/><path d="${a.d}"/>`, 'orn-wing');
}
/** A hand-inked tick: two tapered strokes. */
export function tick() {
  const a = ribbon(place(trace({ k: [0.02, 7, 0.04] }), V(2.6, 8.6), 52 * DEG), leafW(1.5, 0.35, 0.6));
  const b = ribbon(place(trace({ k: [-0.03, 8, -0.012, 8, 0.01] }), V(6.2, 13.4), -58 * DEG), leafW(1.55, 0.25, 1.3));
  return svg(18, 18, `<path d="${a}${b}"/>`, 'orn-tick');
}
/** Leaf, bud and rosette for the outline's vine and the map, as data-URL masks. */
export function glyphs() {
  const lf = leaf(V(3, 16), V(17, 4), { flip: 1, n: 3, fat: 0.2, lobes: 0.42 });
  const leafD = lf.lobes.map(l => l.d).join('') + lf.body;
  const bud = ribbon(place(trace({ k: [0.01, 13, 0.03] }), V(4, 15), -48 * DEG), leafW(3.4, 0.5, 0.8)) + dot(4.4, 14.6, 1.6);
  let petals = '';
  for (let i = 0; i < 8; i++) petals += ribbon(place(trace({ k: [0, 5.6, 0] }), V(10 + Math.cos(i * TAU / 8) * 2.4, 10 + Math.sin(i * TAU / 8) * 2.4), i * TAU / 8), leafW(1.75, 0.7, 0.8));
  const url = (vb, body) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>`)}")`;
  return {
    leaf: url('0 0 20 20', `<path d="${leafD}"/>`),
    bud: url('0 0 20 20', `<path d="${bud}"/>`),
    rosette: url('0 0 20 20', `<path d="${petals}"/><circle cx="10" cy="10" r="8.6" fill="none" stroke="#000" stroke-width="1"/>`),
    rosetteFull: url('0 0 20 20', `<path d="${petals}${dot(10, 10, 2.2)}"/>`),
    tick: url('0 0 18 18', tick().replace(/^<svg[^>]*>|<\/svg>$/g, '')),
  };
}
/** The crest's scrollwork alone, for the wall: a spray that grows out of a corner. */
export function spray() {
  const F = [];
  let cuts = '';
  const put = s => { F.push(s.d); };
  const S = (prog, A, B, o) => scroll(prog, A, B, { cut: 0, ...o });
  const a = S({ k: [-0.002, 150, -0.006, 90, -1 / 46], curl: [1.3, 0.2] }, V(0, 0), V(330, -120), { w: 15 });
  const b = S({ k: [0.003, 120, 0.008, 70, 1 / 34], curl: [1.25, 0.2] }, V(60, -40), V(150, -330), { w: 12 });
  const c = S({ k: [0.004, 60, -0.006, 50, -1 / 16], curl: [1.1, 0.2] }, V(250, -60), V(470, -66), { w: 6 });
  const e = S({ k: [0.004, 60, -0.006, 50, -1 / 16], curl: [1.1, 0.2] }, V(110, -250), V(96, -470), { w: 6, flip: -1 });
  for (const s of [a, b]) for (const l of fringe(s.pts, { from: 0.1, to: 0.66, n: 7, len: 52, wf: s.wf })) F.push(l.d);
  for (const [A, B, fl] of [[V(180, -20), V(400, 30), -1], [V(40, -170), V(-30, -390), 1], [V(210, -150), V(330, -300), 1]]) {
    const lf = leaf(A, B, { flip: fl, n: 6 });
    F.push(lf.body); for (const l of lf.lobes) F.push(l.d);
  }
  [a, b, c, e].forEach(put);
  return F.join('') + cuts;
}
