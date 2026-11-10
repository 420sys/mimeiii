/* ════════════════════════════════════════════════════════════════════════
   A · Hologram — the ink.

   The filigree on the board (the winged crest, the rose scrollwork) without
   the skull: scrolls, leaves, feathers, and a crest that carries 未. All of it
   is drawn in code. Shapes are SVG path data, so one drawing serves a
   <canvas> (Path2D) and inline SVG alike.
   ════════════════════════════════════════════════════════════════════════ */

const TAU = Math.PI * 2, D = Math.PI / 180;
const f2 = v => Math.round(v * 100) / 100;
const pt = p => `${f2(p[0])} ${f2(p[1])}`;

/** Points along a cubic. */
export function cubic(p0, p1, p2, p3, n = 22) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return out;
}

/** A spiral, from the outside in. spin +1 winds clockwise on screen. */
export function spiral(c, r0, a0, turns, spin = 1, r1 = r0 * 0.1) {
  const n = Math.max(12, Math.round(turns * 30)), out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = a0 + spin * t * turns * TAU, r = r1 + (r0 - r1) * (1 - t) ** 1.3;
    out.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
  }
  return out;
}

/** A stroke whose width changes along a line of points, closed into one shape. half(t) is the half-width at t in 0…1. */
export function ribbon(pts, half) {
  const n = pts.length, len = [0];
  for (let i = 1; i < n; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = [], R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1;
    const w = half(len[i] / len[n - 1]), nx = (-dy / m) * w, ny = (dx / m) * w;
    L.push(pt([pts[i][0] + nx, pts[i][1] + ny])); R.push(pt([pts[i][0] - nx, pts[i][1] - ny]));
  }
  return `M${L.join('L')}L${R.reverse().join('L')}Z`;
}
const dot = (p, r) => `M${f2(p[0] - r)} ${f2(p[1])}a${f2(r)} ${f2(r)} 0 1 0 ${f2(r * 2)} 0a${f2(r)} ${f2(r)} 0 1 0 ${f2(-r * 2)} 0Z`;

/**
 * A scroll: a stem that leaves `from` heading `dir` (degrees, clockwise from
 * east) and winds into a spiral round `c`. It swells where the stem meets the
 * spiral and thins to a bead at the heart, the way a pen would draw it.
 */
export function scroll({ from, dir, c, r, turns = 1.4, spin = 1, w = 5, thin = 0.2, bead = 1, pull = 0.44 }) {
  const th = Math.atan2(c[1] - from[1], c[0] - from[0]), a0 = th - spin * Math.PI / 2;
  const S = [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0)], T = [-Math.sin(a0) * spin, Math.cos(a0) * spin];
  const d = Math.hypot(S[0] - from[0], S[1] - from[1]) * pull, dv = [Math.cos(dir * D), Math.sin(dir * D)];
  const stem = cubic(from, [from[0] + dv[0] * d, from[1] + dv[1] * d], [S[0] - T[0] * d, S[1] - T[1] * d], S, 18);
  const sp = spiral(c, r, a0, turns, spin), pts = stem.concat(sp.slice(1));
  const lenStem = 18, tm = lenStem / (pts.length - 1) * 0.9;
  const half = t => w * (t < tm ? thin + (1 - thin) * Math.sin((Math.PI / 2) * (t / tm)) : 0.3 + 0.7 * Math.cos((Math.PI / 2) * ((t - tm) / (1 - tm))) ** 1.15);
  const end = pts[pts.length - 1];
  return { d: ribbon(pts, half) + (bead ? dot(end, w * 0.62 * bead) : ''), pts, end, start: S };
}

/** A leaf: fat on one side, like an acanthus lobe. */
export function leaf(p, ang, len, wid, lean = 0.3) {
  const a = ang * D, tip = [p[0] + Math.cos(a) * len, p[1] + Math.sin(a) * len], nx = -Math.sin(a), ny = Math.cos(a);
  const m = [p[0] + Math.cos(a) * len * 0.42, p[1] + Math.sin(a) * len * 0.42];
  const o = [m[0] + nx * wid * (1 + lean), m[1] + ny * wid * (1 + lean)], i = [m[0] - nx * wid * (1 - lean), m[1] - ny * wid * (1 - lean)];
  return `M${pt(p)}Q${pt(o)} ${pt(tip)}Q${pt(i)} ${pt(p)}Z`;
}

/** A feather: its vane and its shaft. */
export function feather(b, ang, len, wid, bend = 0.1) {
  const a = ang * D, tip = [b[0] + Math.cos(a) * len, b[1] + Math.sin(a) * len], nx = -Math.sin(a), ny = Math.cos(a);
  const ctl = [(b[0] + tip[0]) / 2 - nx * bend * len, (b[1] + tip[1]) / 2 - ny * bend * len];
  const spine = [];
  for (let i = 0; i <= 18; i++) { const t = i / 18, u = 1 - t; spine.push([u * u * b[0] + 2 * u * t * ctl[0] + t * t * tip[0], u * u * b[1] + 2 * u * t * ctl[1] + t * t * tip[1]]); }
  const half = t => wid * (t < 0.42 ? 0.3 + 0.7 * Math.sin((Math.PI / 2) * (t / 0.42)) : Math.sqrt(Math.max(0, 1 - ((t - 0.42) / 0.58) ** 2.3)));
  return { vane: ribbon(spine, half), shaft: `M${spine.map(pt).join('L')}` };
}

/** The right wing, raised: three tiers of feathers on an arm that runs up and out from the shoulder. */
export function wing(px, py, L) {
  const tiers = [
    { n: 10, a0: -84, a1: 6, len: 1, wid: 0.062, arm: 0.36, bend: 0.1 },
    { n: 9, a0: -80, a1: 12, len: 0.64, wid: 0.07, arm: 0.24, bend: 0.12 },
    { n: 8, a0: -74, a1: 20, len: 0.38, wid: 0.078, arm: 0.11, bend: 0.14 },
  ];
  const armA = -56 * D, out = [];
  for (const T of tiers) {
    for (let i = T.n - 1; i >= 0; i--) {
      const u = i / (T.n - 1), ang = T.a0 + (T.a1 - T.a0) * u ** 0.92;
      const g = u < 0.22 ? 1 - 2.4 * (u - 0.22) ** 2 : 1 - 0.56 * ((u - 0.22) / 0.78) ** 1.3;
      const len = L * T.len * g, at = T.arm * L * (1 - u) ** 1.15;
      out.push(feather([px + Math.cos(armA) * at, py + Math.sin(armA) * at], ang, len, len * T.wid * (1 + u * 0.35), T.bend));
    }
  }
  /* the arm lies over the roots of the feathers */
  const arm = cubic([px - L * 0.03, py + L * 0.03], [px + L * 0.07, py - L * 0.13], [px + L * 0.19, py - L * 0.29], [px + Math.cos(armA) * L * 0.43, py + Math.sin(armA) * L * 0.43], 16);
  return { feathers: out, arm: ribbon(arm, t => L * (0.05 - 0.036 * t)) };
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/* The scrollwork under the ring, right half; the left is its mirror. */
function cartouche() {
  const out = [];
  const a = scroll({ from: [512, 606], dir: 14, c: [652, 650], r: 46, turns: 1.55, spin: 1, w: 9.5 });
  const b = scroll({ from: [516, 616], dir: 78, c: [560, 716], r: 27, turns: 1.3, spin: -1, w: 6.5 });
  const c = scroll({ from: [578, 606], dir: -18, c: [724, 560], r: 31, turns: 1.3, spin: -1, w: 6.5 });
  const e = scroll({ from: [662, 700], dir: 50, c: [694, 742], r: 15, turns: 1.1, spin: 1, w: 4 });
  out.push(a.d, b.d, c.d, e.d);
  out.push(leaf([596, 604], -38, 46, 9, 0.25), leaf([628, 598], -62, 34, 7, 0.2), leaf([704, 664], 22, 52, 9, -0.3), leaf([690, 690], 52, 40, 7, -0.3));
  out.push(leaf([752, 548], -52, 44, 7, 0.3), leaf([760, 566], -18, 34, 6, 0.3), leaf([590, 730], 34, 36, 6, -0.25));
  out.push(dot([772, 648], 5), dot([790, 634], 3.6), dot([804, 624], 2.4), dot([626, 760], 4), dot([640, 772], 2.6));
  return out;
}

/**
 * The crest: wings, a ring with the twelve units round it like the hours, the
 * mark at its heart, scrollwork under it. Drawn in a 1000 × 800 box scaled to
 * `size` wide.
 *   mode 'light'  for the hologram: white with alpha (feathers are thin veils)
 *   mode 'ink'    for the plate: solid ink with paper-coloured line work
 *   units  [{ state: 'done' | 'now' | 'next' }] × 12
 */
export function drawCrest(ctx, size, o = {}) {
  const ink = o.mode === 'ink', k = size / 1000, cx = 500, cy = 392;
  const INKC = o.ink || '#05090c', PAPER = o.paper || '#f7fafb';
  ctx.save();
  ctx.scale(k, k);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const solid = d => { const p = new Path2D(d); ctx.fillStyle = ink ? INKC : 'rgba(255,255,255,.86)'; ctx.fill(p); };

  /* the wings */
  const W = wing(cx + 128, cy + 4, 330), arm = new Path2D(W.arm);
  for (const flip of [1, -1]) {
    ctx.save();
    if (flip < 0) { ctx.translate(1000, 0); ctx.scale(-1, 1); }
    for (const fe of W.feathers) {
      const v = new Path2D(fe.vane), sh = new Path2D(fe.shaft);
      if (ink) { ctx.fillStyle = INKC; ctx.fill(v); ctx.strokeStyle = PAPER; ctx.lineWidth = 1.5; ctx.stroke(v); ctx.globalAlpha = 0.75; ctx.lineWidth = 1; ctx.stroke(sh); ctx.globalAlpha = 1; }
      else {
        ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; ctx.fill(v);
        ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fill(v);
        ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.2; ctx.stroke(v);
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.1; ctx.stroke(sh);
      }
    }
    if (ink) { ctx.fillStyle = INKC; ctx.fill(arm); ctx.strokeStyle = PAPER; ctx.lineWidth = 1.5; ctx.stroke(arm); }
    else { ctx.globalCompositeOperation = 'destination-out'; ctx.fill(arm); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill(arm); ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.2; ctx.stroke(arm); }
    ctx.restore();
  }

  /* the ring: it hides the wings' roots */
  const RO = 204, RI = 150;
  ctx.beginPath(); ctx.arc(cx, cy, RO + 8, 0, TAU);
  if (ink) { ctx.fillStyle = PAPER; ctx.fill(); }
  else { ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000'; ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fill(); }
  const line = ink ? INKC : 'rgba(255,255,255,.95)';
  ctx.strokeStyle = line;
  ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, RO, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx, cy, RO - 9, 0, TAU); ctx.stroke();
  ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(cx, cy, RI, 0, TAU); ctx.stroke();
  ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, RI - 7, 0, TAU); ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * TAU, r0 = RO + (i % 10 ? 12 : 10), r1 = RO + (i % 10 ? 17 : 24);
    ctx.moveTo(cx + r0 * Math.cos(a), cy + r0 * Math.sin(a)); ctx.lineTo(cx + r1 * Math.cos(a), cy + r1 * Math.sin(a));
  }
  ctx.lineWidth = 1.3; ctx.stroke();
  /* the twelve units, set like the hours: XII at the top */
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = "600 25px 'Cinzel', serif";
  const units = o.units || [];
  for (let n = 1; n <= 12; n++) {
    const a = (-90 + n * 30) * D, st = (units[n - 1] || {}).state || 'next', r = (RO - 9 + RI) / 2;
    ctx.save();
    ctx.translate(cx + r * Math.cos(a), cy + r * Math.sin(a)); ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = ink ? INKC : '#fff';
    ctx.globalAlpha = st === 'now' ? 1 : st === 'done' ? (ink ? 0.92 : 0.8) : (ink ? 0.34 : 0.3);
    ctx.fillText(ROMAN[n - 1], 0, 1);
    if (st === 'now') {                                  /* the one you are in: a pointer on the rim */
      ctx.beginPath(); ctx.moveTo(-11, -31); ctx.lineTo(11, -31); ctx.lineTo(0, -19); ctx.closePath(); ctx.fill();
      ctx.fillRect(-17, 17, 34, 2.4);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  /* the mark */
  if (o.mark) {
    const mh = 232, mw = mh * (o.mark.width / o.mark.height);
    ctx.drawImage(o.mark, cx - mw / 2, cy - mh / 2 + 2, mw, mh);
  }

  /* the scrollwork, a finial under it, a crown over it */
  const C = cartouche();
  for (const flip of [1, -1]) {
    ctx.save();
    if (flip < 0) { ctx.translate(1000, 0); ctx.scale(-1, 1); }
    C.forEach(solid);
    solid(leaf([500, 606], 90, 150, 13, 0));
    solid(leaf([508, 182], -68, 62, 9, 0.3)); solid(leaf([514, 190], -34, 44, 7, 0.3));
    ctx.restore();
  }
  solid(leaf([500, 184], -90, 78, 10, 0)); solid(dot([500, 772], 6)); solid(dot([500, 92], 4.5));
  ctx.restore();
}

/* ── ornament for the pages, as inline SVG ────────────────────────────── */

const svg = (w, h, body, cls) => `<svg class="orn ${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">${body}</svg>`;

/** Scrollwork that grows out of a corner (top-left; a skin mirrors it for the others). */
export function cornerOrnament(cls = '') {
  const a = scroll({ from: [4, 4], dir: 20, c: [128, 58], r: 30, turns: 1.5, spin: -1, w: 4.6 });
  const b = scroll({ from: [4, 4], dir: 74, c: [50, 138], r: 24, turns: 1.4, spin: 1, w: 4 });
  const c = scroll({ from: [112, 22], dir: -6, c: [186, 30], r: 14, turns: 1.15, spin: 1, w: 2.8 });
  const d = scroll({ from: [20, 118], dir: 96, c: [26, 190], r: 13, turns: 1.1, spin: -1, w: 2.6 });
  const parts = [a.d, b.d, c.d, d.d, leaf([64, 30], 48, 34, 6, 0.3), leaf([30, 66], 44, 30, 5.5, -0.3), leaf([96, 20], -30, 22, 4, 0.3), leaf([16, 96], 122, 22, 4, -0.3),
    dot([160, 70], 3.2), dot([174, 82], 2.3), dot([185, 90], 1.5), dot([72, 166], 3), dot([84, 178], 2.1), dot([93, 186], 1.4)];
  return svg(210, 210, `<path d="${parts.join('')}"/>`, `orn-corner ${cls}`);
}

/** A rule with a scroll at each end and a lozenge between. */
export function ruleOrnament(cls = '') {
  const half = [
    scroll({ from: [112, 12], dir: 0, c: [176, 12], r: 9, turns: 1.2, spin: 1, w: 2.2 }).d,
    scroll({ from: [118, 12], dir: -30, c: [146, 5], r: 4.5, turns: 1, spin: -1, w: 1.5 }).d,
  ].join('');
  return svg(240, 24, `<path d="${half}"/><path d="${half}" transform="translate(240 0) scale(-1 1)"/><path d="M120 5l7 7-7 7-7-7z"/><path class="hair" d="M0 12h92M148 12h0M240 12h-0"/>`, `orn-rule ${cls}`);
}
