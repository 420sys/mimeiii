/* C · Signal — wrought iron.

   The owner's filigree lives here as ironwork: every blade sign hangs from a
   forged scroll bracket. Nothing is traced. A bar is a centre line (a Bézier
   stem with rolled ends) and a width that tapers into the roll, turned into a
   filled outline, so scrolls thin out the way hammered iron does.

   Units are the desk's own (1 = 1 % of the stage width). A bracket is drawn
   around a blade whose top-left corner is (0, 0) and whose width is w; mirror
   it with `flip` for a mast on the right. Snow (Ice) is laid on whatever
   faces up. */

const TAU = Math.PI * 2;
const n2 = v => +v.toFixed(2);
const P = (x, y) => `${n2(x)} ${n2(y)}`;

function cubic(p0, p1, p2, p3, n = 30) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, m = 1 - t;
    out.push([
      m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0],
      m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}
const straight = (a, b, n = 10) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);

/* A rolled end: the bar leaves `from` along `heading` and winds in on itself
   (an Archimedean spiral, so the gap between turns stays even, like a bar
   rolled on the anvil). dir +1 turns clockwise on screen. */
function roll(from, heading, { r, turns = 1.25, dir = 1, rEnd = 0.12 }) {
  const PHI = turns * TAU, b = (r - rEnd) / PHI, lean = Math.atan2(b, r);
  const a0 = heading - dir * (Math.PI / 2 + lean);
  const cx = from[0] - r * Math.cos(a0), cy = from[1] - r * Math.sin(a0);
  const out = [];
  let phi = 0;
  while (phi < PHI) {
    phi = Math.min(PHI, phi + Math.min(0.3, 0.06 / (r - b * phi)));
    const rr = r - b * phi, a = a0 + dir * phi;
    out.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  return out;
}

/** One forged bar.
 *  stem   2 points (straight) or 4 (a cubic Bézier)
 *  from   a roll at the start, to: a roll at the end ({ r, turns, dir })
 *  w      the bar's width; tip: how much is left of it at the end of a roll
 *  ends   what an end without a roll does: 'butt' | 'round' | 'point'      */
export function scroll({ stem, from, to, w = 0.28, tip = 0.42, eye = 1.7, ends = 'butt', snow = true }) {
  const core = stem.length === 4 ? cubic(...stem) : straight(stem[0], stem[1]);
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const head = from ? roll(core[0], ang(core[1], core[0]), from).reverse() : [];
  const tail = to ? roll(core[core.length - 1], ang(core[core.length - 2], core[core.length - 1]), to) : [];
  const line = [...head, ...core, ...tail];
  const n = line.length;

  /* width along the bar: full on the stem, tapering through each roll */
  const wd = new Array(n);
  for (let i = 0; i < n; i++) {
    let k = 1;
    if (i < head.length) k = tip + (1 - tip) * Math.pow(i / head.length, 0.8);
    else if (i >= n - tail.length) k = tip + (1 - tip) * Math.pow((n - 1 - i) / tail.length, 0.8);
    else if (ends === 'point') {
      const c = (i - head.length) / (core.length - 1);
      if (!from && c < 0.3) k = Math.max(0.06, c / 0.3);
      if (!to && c > 0.7) k = Math.max(0.06, (1 - c) / 0.3);
    }
    wd[i] = w * k;
  }

  const L = [], R = [], up = [];
  for (let i = 0; i < n; i++) {
    const a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    tx /= len; ty /= len;
    const h = wd[i] / 2;
    L.push([line[i][0] - ty * h, line[i][1] + tx * h]);
    R.push([line[i][0] + ty * h, line[i][1] - tx * h]);
    /* does this stretch face the sky? (not the wound-up inside of a roll) */
    const inRoll = i < head.length ? (head.length - i) / head.length : i >= n - tail.length ? (i - (n - tail.length)) / tail.length : 0;
    up.push(Math.abs(ty) < 0.62 && inRoll < 0.34);
  }
  const cap = (a, b, hw) => (ends === 'round' ? `A${n2(hw)} ${n2(hw)} 0 0 1 ${P(b[0], b[1])}` : `L${P(b[0], b[1])}`);
  let d = `M${P(L[0][0], L[0][1])}` + L.slice(1).map(p => `L${P(p[0], p[1])}`).join('')
    + cap(L[n - 1], R[n - 1], wd[n - 1] / 2)
    + R.slice(0, -1).reverse().map(p => `L${P(p[0], p[1])}`).join('')
    + cap(R[0], L[0], wd[0] / 2) + 'Z';
  const dot = (p, r) => `M${P(p[0] + r, p[1])}a${n2(r)} ${n2(r)} 0 1 0 ${n2(-2 * r)} 0a${n2(r)} ${n2(r)} 0 1 0 ${n2(2 * r)} 0Z`;
  if (from) d += dot(line[0], (wd[0] / 2) * eye);
  if (to) d += dot(line[n - 1], (wd[n - 1] / 2) * eye);

  /* snow: a soft white line laid along every stretch that faces up */
  let sn = '';
  if (snow) {
    let run = [];
    const flush = () => { if (run.length > 2) sn += 'M' + run.map(p => P(p[0], p[1])).join('L'); run = []; };
    for (let i = 0; i < n; i++) {
      if (up[i]) run.push([line[i][0], line[i][1] - wd[i] / 2 - 0.05]); else flush();
    }
    flush();
  }
  return { d, sn, line };
}

/** A leaf: base at (x, y), growing along `a` (degrees), bent a little. */
export function leaf(x, y, a, len = 1, wid = 0.36, bend = 0.3) {
  const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r);
  const at = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  const tip = at(len, wid * bend * 1.6), a1 = at(len * 0.34, wid), a2 = at(len * 0.72, wid * 0.74);
  const b1 = at(len * 0.4, -wid * 0.72), b2 = at(len * 0.78, -wid * 0.2);
  const o = at(0, 0);
  return `M${P(...o)}C${P(...a1)} ${P(...a2)} ${P(...tip)}C${P(...b2)} ${P(...b1)} ${P(...o)}Z`;
}
const ball = (x, y, r) => `M${P(x + r, y)}a${n2(r)} ${n2(r)} 0 1 0 ${n2(-2 * r)} 0a${n2(r)} ${n2(r)} 0 1 0 ${n2(2 * r)} 0Z`;
const box = (x, y, w, h) => `M${P(x, y)}h${n2(w)}v${n2(h)}h${n2(-w)}Z`;
/* a spear point standing on (x, y): a forged finial */
const spear = (x, y, h = 1, w = 0.5) => `M${P(x, y)}C${P(x - w * 0.2, y - h * 0.3)} ${P(x - w, y - h * 0.42)} ${P(x, y - h)}C${P(x + w, y - h * 0.42)} ${P(x + w * 0.2, y - h * 0.3)} ${P(x, y)}Z` + box(x - w * 0.55, y - 0.08, w * 1.1, 0.16);
/* a collar: the band that binds two bars where they touch */
const collar = (x, y, len = 0.5, th = 0.2, a = 0) => {
  const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), q = (u, v) => P(x + u * c - v * s, y + u * s + v * c);
  return `M${q(-len / 2, -th / 2)}L${q(len / 2, -th / 2)}L${q(len / 2, th / 2)}L${q(-len / 2, th / 2)}Z`;
};

/* ── the brackets ─────────────────────────────────────────────────────────
   Each returns { fe: [paths], sn: [snow lines], bolts: [[x, y, r]], box }.
   o.w  the blade's width      o.g  the gap between mast and blade
   o.drop  how far the blade hangs below the arm                           */

function make() {
  const fe = [], sn = [], bolts = [];
  const add = s => { fe.push(s.d); if (s.sn) sn.push(s.sn); return s; };
  return { fe, sn, bolts, add, raw: d => fe.push(d) };
}
const straps = (m, w, d, inset = 0.5) => { m.raw(box(inset - 0.09, -d - 0.05, 0.18, d + 0.2)); m.raw(box(w - inset - 0.09, -d - 0.05, 0.18, d + 0.2)); m.raw(ball(inset, -d * 0.5, 0.17)); m.raw(ball(w - inset, -d * 0.5, 0.17)); };

/* 'arm': the classic hanging-sign bracket. A mast on the wall with a spear on
   it; an arm that ends in a ram's-horn curl; in the corner a great C-scroll
   with its back to the blade and an S-scroll inside it; and on top of the arm
   an S lying on its side like a wave. o.plain leaves the wave and the inner
   scroll out (for the smaller blades). */
function arm(o) {
  const { w, g = 3.2, drop: d = 0.8, crest: cr = 2.5, brace: br = 4.4, over: ov = 0.8, plain = false, k = 1 } = o;
  const m = make(), t = 0.3 * k, yA = -d - t / 2, top = yA - t / 2, x0 = -g;
  const mastTop = plain ? top - 0.9 : top - cr * 0.78;
  /* the mast, its spear and its drop */
  m.raw(box(x0 - 0.19 * k, mastTop, 0.38 * k, br + 0.75 - mastTop));
  m.raw(spear(x0, mastTop, 1.2 * k, 0.44 * k));
  m.raw(ball(x0, br + 0.95, 0.25 * k));
  m.sn.push(`M${P(x0 - 0.26, mastTop - 0.1)}L${P(x0 + 0.26, mastTop - 0.1)}`);
  m.bolts.push([x0, mastTop + 0.5, 0.1], [x0, br * 0.5, 0.1], [x0, br + 0.35, 0.1]);
  /* the arm */
  m.add(scroll({ stem: [[x0, yA], [w + ov, yA]], to: { r: 0.62 * k, turns: 1.3, dir: -1 }, w: t, tip: 0.4 }));
  /* the brace: one great C. The lower roll sits by the mast, the upper one tucks under the arm. */
  const rl = 0.56 * k, ru = 0.6 * k, ax = x0 + 0.34 + rl;
  m.add(scroll({
    stem: [[ax, br - 0.1], [-0.95, br + 0.02], [-0.3, br * 0.58], [-0.5, -d + ru + 0.12]],
    from: { r: rl, turns: 1.25, dir: 1 }, to: { r: ru, turns: 1.3, dir: -1 }, w: 0.3 * k, tip: 0.36, snow: false,
  }));
  m.raw(collar(x0 + 0.26, br - 0.1 - rl, 0.2, 0.5, 0));
  m.raw(collar(-0.5 - ru, -d + 0.04, 0.5, 0.2, 0));
  if (!plain) {
    /* inside it: a stem out of the mast that winds into a roll, and a sprig of two leaves */
    m.add(scroll({
      stem: [[x0 + 0.1, 0.7], [x0 + 1.5, 0.7], [x0 + 2.25, br * 0.52], [x0 + 1.5, br * 0.74]],
      to: { r: 0.5, turns: 1.3, dir: 1 }, w: 0.22, tip: 0.4, snow: false,
    }));
    m.raw(leaf(x0 + 1.5, 1.02, 118, 0.95, 0.24, 0.5));
    m.raw(leaf(x0 + 1.72, 1.2, 58, 0.7, 0.2, -0.5));
    /* the wave on top of the arm: an S lying on its side */
    const span = w + ov + g, rw = 0.6, lx = x0 + 0.4 + rw, kiss = x0 + span * 0.62, L = kiss - lx;
    m.add(scroll({
      stem: [[lx, top - rw * 2 - 0.04], [lx + L * 0.5, top - rw * 2 - 0.5], [kiss - L * 0.5, top - 0.12], [kiss, top - 0.12]],
      from: { r: rw, turns: 1.3, dir: -1 }, to: { r: 0.5, turns: 1.25, dir: -1 }, w: 0.25, tip: 0.4,
    }));
    m.raw(leaf(kiss - L * 0.2, top - 0.2, -60, 0.95, 0.25, 0.5));
    m.raw(leaf(kiss - L * 0.24, top - 0.2, -118, 0.7, 0.2, -0.5));
    m.raw(collar(kiss - 0.12, top - 0.02, 0.46, 0.22, 0));
  }
  straps(m, w, d);
  return { ...m, box: [x0 - 0.7, mastTop - 1.5, w + ov + 0.9, br + 1.4] };
}

/* 'swan': a mast and one long neck that arches over the blade and comes down
   into a curl on the far side; under the arch two scrolls lean on each other.
   For where there is little room beside the blade. */
function swan(o) {
  const { w, g = 1.6, drop: d = 0.9, crest: cr = 2.7, over: ov = 0.9 } = o;
  const m = make(), x0 = -g, yB = -d - 0.13, top = yB - cr;
  m.raw(box(x0 - 0.18, top + 1.0, 0.36, cr + d + 1.6));
  m.raw(ball(x0, top + 0.86, 0.28));
  m.raw(ball(x0, d + 1.72, 0.22));
  m.bolts.push([x0, top + 1.5, 0.1], [x0, 0.7, 0.1]);
  m.sn.push(`M${P(x0 - 0.14, top + 0.52)}L${P(x0 + 0.14, top + 0.52)}`);
  /* the neck */
  const ex = w + ov;
  m.add(scroll({
    stem: [[x0 + 0.12, yB - 0.2], [x0 + 0.2, top - 1.5], [ex + 0.5, top - 1.0], [ex, yB - 1.0]],
    to: { r: 0.58, turns: 1.3, dir: 1 }, w: 0.32, tip: 0.38,
  }));
  /* the bar the blade hangs from */
  m.add(scroll({ stem: [[x0, yB], [w + 0.35, yB]], w: 0.26, ends: 'round' }));
  /* under the arch: two scrolls, back to back */
  const cx = (x0 + ex) / 2 - 0.1;
  m.add(scroll({
    stem: [[cx - 0.16, yB - 0.2], [cx - 0.2, yB - cr * 0.62], [cx - 0.9, yB - cr * 0.7], [cx - 1.25, yB - cr * 0.42]],
    to: { r: 0.4, turns: 1.2, dir: -1 }, w: 0.2, tip: 0.42, snow: false,
  }));
  m.add(scroll({
    stem: [[cx + 0.16, yB - 0.2], [cx + 0.2, yB - cr * 0.56], [cx + 0.85, yB - cr * 0.62], [cx + 1.15, yB - cr * 0.38]],
    to: { r: 0.36, turns: 1.2, dir: 1 }, w: 0.2, tip: 0.42, snow: false,
  }));
  m.raw(leaf(cx, yB - cr * 0.34, -90, 1.0, 0.24, 0));
  m.raw(collar(cx, yB - 0.42, 0.62, 0.2, 0));
  straps(m, w, d);
  return { ...m, box: [x0 - 0.6, top - 0.9, ex + 1.5, d + 2.2] };
}

/* 'crown': no mast. A bar across the top of the blade, two S-scrolls leaning
   on a spear. For blades fixed flat to the wall, with no room beside them. */
function crown(o) {
  const { w, drop: d = 0.7, crest: cr = 2.2, over: ov = 0.7 } = o;
  const m = make(), yA = -d - 0.14, cx = w / 2, half = w / 2 + ov;
  m.add(scroll({ stem: [[cx, yA], [cx + half, yA]], to: { r: 0.4, turns: 1.1, dir: 1 }, w: 0.26, tip: 0.45 }));
  m.add(scroll({ stem: [[cx, yA], [cx - half, yA]], to: { r: 0.4, turns: 1.1, dir: -1 }, w: 0.26, tip: 0.45 }));
  for (const s of [1, -1]) {
    m.add(scroll({
      stem: [[cx + s * 0.34, yA - cr * 0.56], [cx + s * half * 0.5, yA - cr * 1.05], [cx + s * half * 0.62, yA - 0.1], [cx + s * half * 0.96, yA - 0.56]],
      from: { r: 0.3, turns: 1.0, dir: -s }, to: { r: 0.36, turns: 1.1, dir: -s }, w: 0.21, tip: 0.45,
    }));
    m.raw(leaf(cx + s * 0.3, yA - 0.2, -90 + s * 52, 0.9, 0.26, s * 0.5));
  }
  m.raw(box(cx - 0.13, yA - cr, 0.26, cr));
  m.raw(spear(cx, yA - cr, 1.0, 0.4));
  m.raw(collar(cx, yA - cr * 0.5, 0.86, 0.2, 0));
  straps(m, w, d, Math.min(0.6, w * 0.2));
  return { ...m, box: [-ov - 0.7, yA - cr - 1.2, w + ov + 0.7, 0.4] };
}

/* 'lamp': the little swan-neck the lantern hangs from */
function lamp(o) {
  const { reach = 2.2, rise = 2.4 } = o;
  const m = make();
  m.raw(box(-0.15, -rise - 0.2, 0.3, rise + 1.5));
  m.raw(ball(0, -rise - 0.4, 0.24));
  m.bolts.push([0, -rise + 0.5, 0.09], [0, 0.8, 0.09]);
  m.add(scroll({ stem: [[0.05, 0.5], [0.4, -rise - 0.8], [reach * 0.8, -rise - 0.6], [reach, -0.55]], to: { r: 0.32, turns: 1.0, dir: 1 }, w: 0.24, tip: 0.45 }));
  m.add(scroll({ stem: [[0.1, 1.0], [0.9, 0.9], [1.3, 0.1], [0.75, -0.5]], to: { r: 0.3, turns: 1.1, dir: -1 }, w: 0.18, tip: 0.45, ends: 'point', snow: false }));
  m.raw(leaf(0.2, -0.3, -50, 0.8, 0.22, 0.5));
  return { ...m, box: [-0.6, -rise - 1.4, reach + 1.2, 1.6] };
}

const KINDS = { arm, swan, crown, lamp };

/** The bracket as an SVG, placed around its blade. `flip` puts the mast on the right. */
export function bracket(kind, o = {}) {
  const b = KINDS[kind](o);
  const [x0, y0, x1, y1] = b.box;
  const W = x1 - x0, H = y1 - y0;
  const left = o.flip ? (o.w ?? 0) - x1 : x0;
  return `<svg class="c-iron" aria-hidden="true" viewBox="${n2(x0)} ${n2(y0)} ${n2(W)} ${n2(H)}" style="--ix:${n2(left)};--iy:${n2(y0)};--iw:${n2(W)};--ih:${n2(H)}"${o.flip ? ' data-flip' : ''}>`
    + `<path class="fe" d="${b.fe.join('')}"/>`
    + b.bolts.map(([x, y, r]) => `<circle class="bolt" cx="${n2(x)}" cy="${n2(y)}" r="${r}"/>`).join('')
    + (b.sn.length ? `<path class="sn" d="${b.sn.join('')}"/>` : '')
    + '</svg>';
}
