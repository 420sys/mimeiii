/* D · Rose window: the geometry, constructed as with a compass.

   Everything is in window units. The outer edge of the stone ring is R = 1000,
   the centre is (0, 0) and y grows downward, as in SVG. A petal is built once
   in its own frame (x across, y outward along its axis) and turned into place.

   The construction, from the centre outward:
     oculus     a twelve-foil: twelve arcs of one radius, one lobe under each petal
     hub        a ring of stone with twelve small eyes on the mullion axes
     petals     twelve lights. Two straight jambs (the faces of the mullions,
                which have a constant width) and a pointed head: two arcs of
                one radius, each tangent to its jamb at the springing
     panes      a petal is cut by leads into as many panes as its unit has
                lessons. Every lead is the head itself, moved down the axis:
                the same two arcs, the same compass opening
     roundels   the largest circle that fits each spandrel between two heads
     eyes       the largest circles that fit what is left of the spandrel
     beads      one for every checkpoint in the course, evenly round the rim   */

const RAD = Math.PI / 180;
const S15 = Math.sin(15 * RAD), C15 = Math.cos(15 * RAD);

export const DIM = {
  R: 1000,
  frame: 968,        // inner edge of the outer roll moulding
  beadR: 941.5,      // the bead course runs in a channel between the mouldings
  bead: 10.4,
  channel: 915,      // inner edge of the channel
  glass: 890,        // inner edge of the frame: everything inside is glass and tracery
  tip: 853,          // apex of a petal's head
  hub: 226,          // the petals start here
  mull: 11,          // half the width of a mullion
  lead: 4.6,         // half the width of a lead
  k: 1.45,           // head radius, in spans: 1 is equilateral, more is a sharper lancet
  even: 0.55,        // 0: leads evenly spaced along the axis; 1: every pane the same area of glass
  lobeC: 126, lobeR: 40,   // the oculus: lobe centres and lobe radius
};

const f = n => String(Math.round(n * 10) / 10);
const mir = p => [-p[0], p[1]];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** A path that is built from points and remembers them, so a shape has both an SVG `d` and a polygon. */
function pen(W) {
  let d = '', cur = null;
  const pts = [];
  return {
    M(p) { cur = W(p); d += `M${f(cur[0])} ${f(cur[1])}`; pts.push(cur); return this; },
    L(p) { const q = W(p); if (dist(q, cur) < 1e-6) return this; cur = q; d += `L${f(q[0])} ${f(q[1])}`; pts.push(q); return this; },
    /** A minor arc from the current point to p about centre c. */
    A(p, c, r) {
      const q = W(p), o = W(c);
      if (dist(q, cur) < 1e-6) return this;
      const a0 = Math.atan2(cur[1] - o[1], cur[0] - o[0]);
      let da = Math.atan2(q[1] - o[1], q[0] - o[0]) - a0;
      while (da > Math.PI) da -= 2 * Math.PI;
      while (da < -Math.PI) da += 2 * Math.PI;
      const n = Math.max(2, Math.ceil(Math.abs(da) / (6 * RAD)));
      for (let i = 1; i <= n; i++) pts.push([o[0] + r * Math.cos(a0 + da * i / n), o[1] + r * Math.sin(a0 + da * i / n)]);
      d += `A${f(r)} ${f(r)} 0 0 ${da > 0 ? 1 : 0} ${f(q[0])} ${f(q[1])}`;
      cur = q;
      return this;
    },
    Z() { d += 'Z'; return { d, pts }; },
  };
}

function measure(pts) {
  let a = 0, cx = 0, cy = 0, x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length], w = p[0] * q[1] - q[0] * p[1];
    a += w; cx += (p[0] + q[0]) * w; cy += (p[1] + q[1]) * w;
    x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
  }
  a /= 2;
  return { area: Math.abs(a), c: [cx / (6 * a), cy / (6 * a)], box: [x0, y0, x1, y1] };
}

const bisect = (fn, lo, hi, n = 60) => { for (let i = 0; i < n; i++) { const mid = (lo + hi) / 2; if (fn(mid) > 0) hi = mid; else lo = mid; } return (lo + hi) / 2; };

/** The whole window for a course: `units` is api.UNITS. Pure: no DOM, the same numbers every time. */
export function roseGeometry(units, dims = {}) {
  const D = { ...DIM, ...dims };
  const { mull: m, lead, k } = D;

  /* ── one petal, in its own frame ─────────────────────────────────────── */
  const jamb = t => [t * S15 - m * C15, t * C15 + m * S15];      // the right jamb: the face of a mullion of constant width
  const tAt = rho => Math.sqrt(rho * rho - m * m);
  const headAt = rho => {
    const t = tAt(rho), P = jamb(t), r = k * 2 * P[0];            // the springing, and one radius for both arcs
    const C = [P[0] - r * C15, P[1] + r * S15];                   // the centre lies on the normal to the jamb: the arc leaves it tangent
    return { t, P, r, C, apex: C[1] + Math.sqrt(r * r - C[0] * C[0]) };
  };
  const H = headAt(bisect(rho => headAt(rho).apex - D.tip, D.hub + 1, D.tip));
  const tHub = tAt(D.hub);
  const HUB = { on: 'jamb', p: jamb(tHub) };
  const TOP = { on: 'head', p: [0, H.apex] };

  /** Where a lead (the head moved down the axis by tau, its edge at radius q) meets the side of the petal. */
  const meet = (tau, q) => {
    const Cd = [H.C[0], H.C[1] - tau];
    const d0 = [-m * C15 - Cd[0], m * S15 - Cd[1]];
    const b = S15 * d0[0] + C15 * d0[1], disc = b * b - (d0[0] * d0[0] + d0[1] * d0[1] - q * q);
    if (disc >= 0) { const t = -b + Math.sqrt(disc); if (t <= H.t) return { on: 'jamb', t, p: jamb(t) }; }
    const a = (H.r * H.r - q * q + tau * tau) / (2 * tau), hh = H.r * H.r - a * a;
    return hh < 0 ? null : { on: 'head', p: [H.C[0] + Math.sqrt(hh), H.C[1] - a] };
  };
  const edge = (tau, q) => {
    const Cd = [H.C[0], H.C[1] - tau];
    return { Cd, q, end: meet(tau, q), apex: [0, Cd[1] + Math.sqrt(q * q - Cd[0] * Cd[0])] };
  };

  /** A piece of a petal between a lower and an upper boundary (null: the hub below, the head above). */
  const piece = (W, lo, up) => {
    const a = lo ? lo.end : HUB, b = up ? up.end : TOP;
    const P = pen(W).M(mir(a.p));
    if (lo) P.A(lo.apex, mir(lo.Cd), lo.q).A(a.p, lo.Cd, lo.q); else P.A(a.p, [0, 0], D.hub);
    if (a.on === 'jamb' && b.on === 'jamb') P.L(b.p);
    else { if (a.on === 'jamb') P.L(H.P); P.A(b.p, H.C, H.r); }
    if (up) P.A(up.apex, up.Cd, up.q).A(mir(b.p), mir(up.Cd), up.q);
    if (b.on === 'head') { if (a.on === 'jamb') P.A(mir(H.P), mir(H.C), H.r).L(mir(a.p)); else P.A(mir(a.p), mir(H.C), H.r); }
    else P.L(mir(a.p));
    return P.Z();
  };

  const I = p => p;
  const whole = measure(piece(I, null, null).pts).area;
  const below = alpha => measure(piece(I, null, edge(H.apex - alpha, H.r)).pts).area;
  /* the lowest lead still has to stand on the jambs above the hub */
  const alphaMin = bisect(al => { const e = meet(H.apex - al, H.r + lead); return e && e.on === 'jamb' ? e.t - tHub - 6 : 1; }, D.hub, D.tip);

  /** Apex heights of the n - 1 leads in a petal of n panes. */
  const leads = n => {
    const out = [];
    for (let j = 1; j < n; j++) {
      const lin = D.hub + (D.tip - D.hub) * j / n;
      const eq = bisect(al => below(al) - whole * j / n, alphaMin, D.tip - 1);
      out.push(Math.max(alphaMin, lin + (eq - lin) * D.even));
    }
    return out;
  };

  /* ── turned into place ───────────────────────────────────────────────── */
  const turn = deg => { const s = Math.sin(deg * RAD), c = Math.cos(deg * RAD); return ([x, y]) => [y * s + x * c, -y * c + x * s]; };

  const petals = units.map((u, i) => {
    const deg = i * 30, W = turn(deg), n = u.lessons.length, al = leads(n);
    const panes = u.lessons.map((l, j) => {
      const lo = j === 0 ? null : edge(H.apex - al[j - 1], H.r + lead);
      const up = j === n - 1 ? null : edge(H.apex - al[j], H.r - lead);
      const sh = piece(W, lo, up), ms = measure(sh.pts);
      const y0 = j === 0 ? D.hub : al[j - 1], y1 = j === n - 1 ? D.tip : al[j];
      return { id: l.id, title: l.title, unit: u.n, j, n, d: sh.d, pts: sh.pts, ...ms, rho: Math.hypot(ms.c[0], ms.c[1]), a0: W([0, y0]), a1: W([0, y1]) };
    });
    const out = piece(W, null, null);
    return { unit: u.n, roman: u.roman, title: u.title, deg, d: out.d, pts: out.pts, tip: W([0, D.tip]), panes };
  });

  /* ── the spandrels: a roundel, and eyes in what is left ──────────────── */
  const ax = q => [q * S15, q * C15];                               // the mullion axis on the clockwise side of a petal
  const toHead = p => dist(p, H.C) - H.r;                            // clear distance to this petal's head
  const qR = bisect(q => toHead(ax(q)) - (D.glass - q), Math.hypot(H.P[0], H.P[1]), D.glass);
  const fit = D.glass - qR;                                          // the largest circle the spandrel holds
  const ring = 13;                                                   // the stone ring a roundel is set in
  const round = { q: qR, r: fit - ring - 3, ring };
  /* an eye under the roundel, on the axis, where the two heads close in */
  const qE = bisect(q => toHead(ax(q)) - (qR - q - fit), Math.hypot(H.P[0], H.P[1]), qR);
  const eyeLow = { q: qE, r: toHead(ax(qE)) - 8 };
  /* an eye either side of the roundel, against the rim: the largest circle between head, rim and roundel */
  const clear = p => Math.min(D.glass - Math.hypot(p[0], p[1]), toHead(p), dist(p, ax(qR)) - fit);
  let best = [ax(qR)[0] - fit, ax(qR)[1] + fit * 0.5], step = 40;
  while (step > 0.01) {
    let moved = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const c = [best[0] + dx * step, best[1] + dy * step];
      if (clear(c) > clear(best)) { best = c; moved = true; }
    }
    if (!moved) step /= 2;
  }
  const eyeSide = { p: best, r: clear(best) - 7 };
  /* reflect a point across the mullion axis (the spandrel is symmetric about it) */
  const flip = p => { const dq = p[0] * S15 + p[1] * C15, e = [dq * S15, dq * C15]; return [2 * e[0] - p[0], 2 * e[1] - p[1]]; };

  const roundels = [], eyes = [];
  units.forEach((u, i) => {
    const W = turn(i * 30), next = units[(i + 1) % units.length];
    /* the numeral stands before its petal, reading clockwise: this spandrel belongs to the next unit */
    roundels.push({ unit: next.n, roman: next.roman, c: W(ax(round.q)), r: round.r, ring: round.ring });
    if (eyeLow.r > 7) eyes.push({ c: W(ax(eyeLow.q)), r: eyeLow.r });
    if (eyeSide.r > 7) { eyes.push({ c: W(eyeSide.p), r: eyeSide.r }); eyes.push({ c: W(flip(eyeSide.p)), r: eyeSide.r }); }
    eyes.push({ c: W(ax(187)), r: 12.5, hub: true });               // the hub: one small eye at the foot of every mullion
  });

  /* ── the oculus: a twelve-foil ───────────────────────────────────────── */
  const cuspR = D.lobeC * C15 + Math.sqrt(D.lobeR * D.lobeR - (D.lobeC * S15) ** 2);
  const oc = pen(I).M(turn(-15)([0, cuspR]));
  for (let i = 0; i < 12; i++) oc.A(turn(i * 30 + 15)([0, cuspR]), turn(i * 30)([0, D.lobeC]), D.lobeR);
  const oculus = { d: oc.Z().d, cusp: cuspR, out: D.lobeC + D.lobeR };

  /* ── the bead course: one bead for every checkpoint, in course order from the top ── */
  const total = units.reduce((a, u) => a + u.lessons.reduce((b, l) => b + l.checkpoints.length, 0), 0);
  const beads = [];
  let n = 0;
  for (const u of units) for (const l of u.lessons) for (let c = 0; c < l.checkpoints.length; c++) {
    const a = (n + 0.5) * 360 / total;
    beads.push({ i: n, unit: u.n, lesson: l.id, c: turn(a)([0, D.beadR]), deg: a });
    n++;
  }

  return { D, H, petals, panes: petals.flatMap(p => p.panes), roundels, eyes, oculus, beads, total, turn };
}

/* ── colour ─────────────────────────────────────────────────────────────── */

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const hex = c => '#' + c.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((x, i) => x + (B[i] - x) * t)); };
const ramp = (stops, t) => {
  t = Math.max(0, Math.min(1, t));
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return stops[stops.length - 1][1];
};

export const LOOK = {
  /* seen from outside, lit from within */
  night: {
    stone: '#070c12', stoneLit: '#0d161e', lead: '#04070b', channel: '#020508', edge: '#bfeef8', edgeA: 0.5,
    glass: [[0, '#8fe6f7'], [0.22, '#49c6d8'], [0.5, '#1ba3b5'], [0.78, '#12798c'], [1, '#0d5466']],
    deep: '#062a34', pale: '#e8fbff',
    round: ['#0b3b4a', '#0f5567'], numeral: '#e8fbff', eye: ['#bdf1fa', '#39b9cb'],
    ocu: ['#ffffff', '#e8fbff', '#9be9f8'], mark: '#04090d',
    bead: ['#12303a', '#081419'], beadEdge: '#2a5866', beadLit: ['#ffffff', '#b9f1fb'], beadGlow: '#8fe6f7',
    you: ['#ffffff', '#e8fbff'], youGlow: '#e8fbff',
  },
  /* seen from inside, at a snowy dawn */
  ice: {
    stone: '#eaeff1', stoneLit: '#f6f9fa', lead: '#2a3640', channel: '#dfe6e9', edge: '#ffffff', edgeA: 0.9,
    glass: [[0, '#f3fafb'], [0.3, '#dcf0f4'], [0.6, '#bfe2ea'], [0.85, '#9dd0dd'], [1, '#86c3d2']],
    deep: '#6fb3c5', pale: '#ffffff',
    round: ['#d8eef2', '#b9dfe8'], numeral: '#1d2a33', eye: ['#ffffff', '#cfeaf0'],
    ocu: ['#ffffff', '#f4fbfc', '#d3ecf1'], mark: '#1b262e',
    bead: ['#ffffff', '#dfe9ec'], beadEdge: '#55646e', beadLit: ['#2a3640', '#16303b'], beadGlow: '#7fbfd0',
    you: ['#ffffff', '#ffffff'], youGlow: '#ffffff',
  },
};

/** The window as SVG markup, in window units (wrap it in a <g> that moves and scales it).
 *  o.mode 'night' | 'ice'; o.id a prefix for its gradients; o.rng a seeded source;
 *  o.soft draws the dim fragment for the wall (no beads, no numerals, no eyes);
 *  o.open puts data-open on every pane; o.mark the image of the brush 未. */
export function roseSVG(G, o) {
  const L = LOOK[o.mode], id = o.id, rnd = o.rng, D = G.D, soft = !!o.soft;
  const defs = [], out = [];
  const night = o.mode === 'night';

  /* every pane its own gradient along the petal's axis: lighter toward the heart, deeper toward the rim,
     and a seeded depth of its own, so that it reads as glass and not as a chart */
  const panes = G.panes.map(p => {
    const t = (p.rho - D.hub) / (D.tip - 60 - D.hub);
    const v = rnd() * 2 - 1, spark = rnd() < 0.1;
    let base = ramp(L.glass, t + v * 0.16);
    base = v < 0 ? mix(base, L.deep, -v * (night ? 0.42 : 0.3)) : mix(base, L.pale, v * (night ? 0.2 : 0.35));
    if (spark) base = mix(base, L.pale, night ? 0.38 : 0.5);
    const a = mix(base, L.pale, night ? 0.3 : 0.45), c = mix(base, L.deep, night ? 0.38 : 0.22);
    defs.push(`<linearGradient id="${id}p${p.id.replace('.', '-')}" gradientUnits="userSpaceOnUse" x1="${f(p.a0[0])}" y1="${f(p.a0[1])}" x2="${f(p.a1[0])}" y2="${f(p.a1[1])}"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${c}"/></linearGradient>`);
    return { ...p, fill: `url(#${id}p${p.id.replace('.', '-')})` };
  });

  defs.push(
    `<radialGradient id="${id}stone" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${D.glass}"><stop offset="0" stop-color="${L.stoneLit}"/><stop offset=".55" stop-color="${L.stone}"/><stop offset="1" stop-color="${night ? L.lead : L.stone}"/></radialGradient>`,
    `<linearGradient id="${id}roll" gradientUnits="userSpaceOnUse" x1="-700" y1="-700" x2="700" y2="700"><stop offset="0" stop-color="${night ? '#1a2a35' : '#ffffff'}"/><stop offset=".5" stop-color="${L.stone}"/><stop offset="1" stop-color="${night ? '#020406' : '#d5dee2'}"/></linearGradient>`,
    `<radialGradient id="${id}ocu"><stop offset="0" stop-color="${L.ocu[0]}"/><stop offset=".6" stop-color="${L.ocu[1]}"/><stop offset="1" stop-color="${L.ocu[2]}"/></radialGradient>`,
    `<radialGradient id="${id}rnd" cx=".42" cy=".38" r=".75"><stop offset="0" stop-color="${L.round[1]}"/><stop offset="1" stop-color="${L.round[0]}"/></radialGradient>`,
    `<radialGradient id="${id}eye" cx=".4" cy=".36" r=".8"><stop offset="0" stop-color="${L.eye[0]}"/><stop offset="1" stop-color="${L.eye[1]}"/></radialGradient>`,
    `<radialGradient id="${id}bd" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="${L.bead[0]}"/><stop offset="1" stop-color="${L.bead[1]}"/></radialGradient>`,
    `<radialGradient id="${id}bl" cx=".4" cy=".36" r=".75"><stop offset="0" stop-color="${L.beadLit[0]}"/><stop offset="1" stop-color="${L.beadLit[1]}"/></radialGradient>`,
    `<radialGradient id="${id}bg"><stop offset="0" stop-color="${L.beadGlow}" stop-opacity="${night ? 0.55 : 0.5}"/><stop offset="1" stop-color="${L.beadGlow}" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="${id}halo"><stop offset="0" stop-color="${L.pale}" stop-opacity="${night ? 0.5 : 0.7}"/><stop offset=".45" stop-color="${L.pale}" stop-opacity="${night ? 0.16 : 0.25}"/><stop offset="1" stop-color="${L.pale}" stop-opacity="0"/></radialGradient>`,
    `<linearGradient id="${id}you" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.you[0]}"/><stop offset="1" stop-color="${L.you[1]}"/></linearGradient>`,
    `<radialGradient id="${id}yg"><stop offset="0" stop-color="${L.youGlow}" stop-opacity="${night ? 0.62 : 0.95}"/><stop offset=".5" stop-color="${L.youGlow}" stop-opacity="${night ? 0.2 : 0.4}"/><stop offset="1" stop-color="${L.youGlow}" stop-opacity="0"/></radialGradient>`,
    `<mask id="${id}mk" maskUnits="userSpaceOnUse" x="-110" y="-124" width="220" height="248"><image href="${o.mark}" x="-98" y="-116" width="196" height="232" preserveAspectRatio="xMidYMid meet"/></mask>`,
  );

  const circ = (c, r, extra = '') => `<circle cx="${f(c[0])}" cy="${f(c[1])}" r="${f(r)}" ${extra}/>`;
  const holes = [
    ...G.petals.map(p => p.d),
    ...G.roundels.map(r => `M${f(r.c[0] - r.r)} ${f(r.c[1])}a${f(r.r)} ${f(r.r)} 0 1 0 ${f(r.r * 2)} 0a${f(r.r)} ${f(r.r)} 0 1 0 ${f(-r.r * 2)} 0Z`),
    ...(soft ? [] : G.eyes.map(e => `M${f(e.c[0] - e.r)} ${f(e.c[1])}a${f(e.r)} ${f(e.r)} 0 1 0 ${f(e.r * 2)} 0a${f(e.r)} ${f(e.r)} 0 1 0 ${f(-e.r * 2)} 0Z`)),
    G.oculus.d,
  ].join('');

  /* the frame: two roll mouldings with the bead channel between them */
  out.push(`<g class="rw-frame">
    <circle r="${D.R}" fill="${L.stone}"/>
    <circle r="${(D.R + D.frame) / 2}" fill="none" stroke="url(#${id}roll)" stroke-width="${D.R - D.frame}"/>
    <circle r="${(D.frame + D.channel) / 2}" fill="none" stroke="${L.channel}" stroke-width="${D.frame - D.channel}"/>
    <circle r="${(D.channel + D.glass) / 2}" fill="none" stroke="url(#${id}roll)" stroke-width="${D.channel - D.glass}"/>
    <circle r="${D.R - 1}" fill="none" stroke="${L.edge}" stroke-opacity="${night ? 0.3 : 0}" stroke-width="2"/>
    ${night ? '' : `<circle r="${D.R}" fill="none" stroke="${L.lead}" stroke-width="3.2"/><circle r="${D.frame}" fill="none" stroke="${L.lead}" stroke-opacity=".55" stroke-width="1.6"/><circle r="${D.channel}" fill="none" stroke="${L.lead}" stroke-opacity=".55" stroke-width="1.6"/><circle r="${D.glass}" fill="none" stroke="${L.lead}" stroke-width="3.2"/>`}
  </g>`);

  /* the tracery: stone, and along one edge of every opening a thin line of light */
  out.push(`<circle class="rw-stone" r="${D.glass}" fill="url(#${id}stone)"/>`);
  if (night) out.push(`<path class="rw-edge" d="${holes}" fill="${L.edge}" fill-opacity="${L.edgeA}" transform="translate(2.6 2.6)"/>`);
  else out.push(`<path class="rw-edge" d="${holes}" fill="none" stroke="${L.lead}" stroke-width="5" stroke-linejoin="round"/><path d="${holes}" fill="${L.lead}" fill-opacity=".16" transform="translate(4 5)"/>`);
  out.push(`<path class="rw-leads" d="${G.petals.map(p => p.d).join('')}" fill="${L.lead}"/>`);

  /* the glass */
  out.push(`<g class="rw-petals">${G.petals.map(p => `<g class="rw-petal" data-u="${p.unit}">${
    panes.filter(x => x.unit === p.unit).map(x => `<path class="rw-pane" d="${x.d}" fill="${x.fill}" data-id="${x.id}"${o.open ? ` data-open="${x.id}"` : ''}/>`).join('')
  }<path class="rw-hi" d="${p.d}"/></g>`).join('')}</g>`);

  out.push(`<g class="rw-roundels">${G.roundels.map(r => `<g class="rw-roundel" data-u="${r.unit}">${circ(r.c, r.r, `fill="url(#${id}rnd)"`)}${
    soft ? '' : `${circ(r.c, r.r - 7, `fill="none" stroke="${L.numeral}" stroke-opacity="${night ? 0.32 : 0.4}" stroke-width="1.6"`)}<text x="${f(r.c[0])}" y="${f(r.c[1])}" dy=".355em" text-anchor="middle" fill="${L.numeral}">${r.roman}</text>`
  }</g>`).join('')}</g>`);
  if (!soft) out.push(`<g class="rw-eyes">${G.eyes.map(e => circ(e.c, e.r, `fill="url(#${id}eye)"`)).join('')}</g>`);

  /* the oculus, and in it the brush 未 */
  out.push(`<g class="rw-oculus"><path d="${G.oculus.d}" fill="url(#${id}ocu)"/>${
    soft ? '' : `<rect x="-110" y="-124" width="220" height="248" fill="${L.mark}" mask="url(#${id}mk)"/>`}</g>`);

  /* the bead course */
  if (!soft) {
    out.push(`<g class="rw-beads" data-total="${G.total}">${G.beads.map(b => `<g class="rw-bead" transform="translate(${f(b.c[0])} ${f(b.c[1])})"><circle class="rw-bead-glow" r="${f(D.bead * 2.7)}" fill="url(#${id}bg)" opacity="0"/><circle class="rw-bead-dot" r="${D.bead}" fill="url(#${id}bd)" stroke="${L.beadEdge}" stroke-width="1.4"/></g>`).join('')}</g>`);
    /* the light of the heart bleeds a little over the stone */
    out.push(`<circle class="rw-halo" r="${night ? 330 : 300}" fill="url(#${id}halo)" pointer-events="none"/>`);
    /* the pane of the lesson on the sign: white light, set by litPane() */
    out.push(`<g class="rw-you" pointer-events="none"><circle class="rw-you-glow" r="10" fill="url(#${id}yg)"/><path class="rw-you-pane" d="" fill="url(#${id}you)"/></g>`);
  }

  return `<defs>${defs.join('')}</defs>${out.join('')}`;
}

/** Light the first n beads of a window that is already in the page. */
export function lightBeads(root, n, id) {
  root.querySelectorAll('.rw-bead').forEach((b, i) => {
    const lit = i < n;
    b.classList.toggle('is-lit', lit);
    b.firstElementChild.setAttribute('opacity', lit ? 1 : 0);
    b.lastElementChild.setAttribute('fill', `url(#${id}${lit ? 'bl' : 'bd'})`);
  });
}

/** Move the white pane to a lesson. */
export function litPane(root, G, lessonId) {
  const p = G.panes.find(x => x.id === lessonId), you = root.querySelector('.rw-you');
  if (!p || !you) return null;
  const r = Math.max(p.box[2] - p.box[0], p.box[3] - p.box[1]) * 0.95 + 40;
  const glow = you.querySelector('.rw-you-glow');
  glow.setAttribute('cx', f(p.c[0])); glow.setAttribute('cy', f(p.c[1])); glow.setAttribute('r', f(r));
  you.querySelector('.rw-you-pane').setAttribute('d', p.d);
  root.querySelectorAll('.rw-pane.is-you').forEach(x => x.classList.remove('is-you'));
  const el = root.querySelector(`.rw-pane[data-id="${lessonId}"]`);
  if (el) el.classList.add('is-you');
  return p;
}
