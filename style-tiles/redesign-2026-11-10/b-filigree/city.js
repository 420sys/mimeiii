/* B · Filigree: what the crest is printed over. Ink splatter, the megacity as a
   banknote engraving (line and hatching only), and the wear of the print.
   All of it is seeded, so the plate is the same on every load. */

import { loop, dot } from './ornament.js';

const TAU = Math.PI * 2;
const f = v => String(Math.round(v * 10) / 10);

/** One splat: a lumpy blob with a few flung arms, droplets off their ends and a scatter of specks. */
export function splat(rand, cx, cy, R, o = {}) {
  const { arms = 6, lumps = 5, drops = 26, spread = 2.6, squash = 0.86 } = o;
  const A = [], arm = [];
  for (let j = 0; j < lumps; j++) A.push([2 + j, (0.17 / (1 + j * 0.5)) * (0.5 + rand()), rand() * TAU]);
  for (let j = 0; j < arms; j++) arm.push([rand() * TAU, 0.06 + rand() * 0.09, 0.25 + rand() * 0.8]);
  const N = 110, P = [];
  for (let i = 0; i < N; i++) {
    const t = i / N * TAU;
    let r = 1;
    for (const [n, a, ph] of A) r += a * Math.sin(n * t + ph);
    for (const [a, wd, amp] of arm) { const dl = Math.atan2(Math.sin(t - a), Math.cos(t - a)); r += amp * Math.exp(-((dl / wd) ** 2)); }
    P.push({ x: cx + Math.cos(t) * R * r, y: cy + Math.sin(t) * R * r * squash });
  }
  let d = loop(P);
  for (const [a, , amp] of arm) {
    let g = R * (1.12 + amp);
    const n = 2 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      g += R * (0.1 + rand() * 0.3);
      const aa = a + (rand() - 0.5) * 0.12;
      d += dot(cx + Math.cos(aa) * g, cy + Math.sin(aa) * g * squash, Math.max(0.5, R * 0.085 * (1 - i / (n + 1)) * (0.5 + rand())));
    }
  }
  for (let i = 0; i < drops; i++) {
    const a = rand() * TAU, g = R * (1.05 + rand() ** 1.6 * spread);
    d += dot(cx + Math.cos(a) * g, cy + Math.sin(a) * g * squash, Math.max(0.45, R * 0.032 * (0.3 + rand() ** 2 * 2.4)));
  }
  return d;
}

/** Print wear: tiny dots in three sizes inside a box, as zero-length round-capped strokes. */
export function specks(rand, x0, y0, x1, y1, n) {
  const d = ['', '', ''];
  for (let i = 0; i < n; i++) {
    const r = rand(), k = r < 0.62 ? 0 : r < 0.9 ? 1 : 2;
    d[k] += `M${f(x0 + rand() * (x1 - x0))} ${f(y0 + rand() * (y1 - y0))}h0`;
  }
  return d.map((p, i) => `<path class="wear wear-${i}" d="${p}"/>`).join('');
}

/** The megacity in ink. Three depths; each tower is an outline, a hatched side
 *  and rows of window ticks. Drawn in plate units about x = 0 with the ground at
 *  y = 0; env(x) (0…1) shapes the skyline's height across the plate. */
export function skyline(rand, half, o = {}) {
  const { h = 150, env = () => 1 } = o;
  const layers = [
    { cls: 'far', w: [13, 30], t: [0.6, 1], gap: [2, 14], hatch: 3.6, win: 0 },
    { cls: 'mid', w: [18, 42], t: [0.36, 0.74], gap: [0, 9], hatch: 2.7, win: 5.2 },
    { cls: 'near', w: [24, 58], t: [0.16, 0.46], gap: [0, 6], hatch: 2.15, win: 4.4 },
  ];
  let out = '';
  for (const L of layers) {
    let mass = '', line = '', hatch = '', win = '', dots = '';
    let x = -half - rand() * 30;
    while (x < half) {
      const w = L.w[0] + rand() * (L.w[1] - L.w[0]);
      const e = env((x + w / 2) / half);
      const H = h * e * (L.t[0] + rand() * (L.t[1] - L.t[0]));
      if (H > 9) {
        /* up to three tiers, each narrower than the one below */
        const tiers = [];
        const kind = rand();
        let xa = x, xb = x + w, yb = 0, ya = -H * (kind < 0.42 ? 1 : 0.58 + rand() * 0.2);
        tiers.push([xa, xb, ya, yb]);
        if (kind >= 0.42) {
          const inset = w * (0.1 + rand() * 0.12);
          xa += inset * (rand() < 0.5 ? 1 : 0.4); xb -= inset; yb = ya; ya = -H * (kind < 0.75 ? 1 : 0.84);
          tiers.push([xa, xb, ya, yb]);
          if (kind >= 0.75) { const i2 = (xb - xa) * 0.22; xa += i2; xb -= i2; yb = ya; ya = -H; tiers.push([xa, xb, ya, yb]); }
        }
        const side = 0.24 + rand() * 0.16, glass = rand() < 0.4;
        for (const [a, b, t, bt] of tiers) {
          const cx = b - (b - a) * side;
          mass += `M${f(a)} ${f(bt)}V${f(t)}H${f(b)}V${f(bt)}Z`;
          line += `M${f(a)} ${f(bt)}V${f(t)}H${f(b)}V${f(bt)}M${f(cx)} ${f(t)}V${f(bt)}`;
          for (let hx = cx + L.hatch; hx < b - 0.6; hx += L.hatch) hatch += `M${f(hx)} ${f(t + 0.8)}V${f(bt)}`;
          if (L.win && b - a > 9) {
            if (glass) for (let wx = a + 3.4; wx < cx - 1.4; wx += 3.4) win += `M${f(wx)} ${f(t + 3)}V${f(bt)}`;
            else for (let wy = t + L.win; wy < bt - 1; wy += L.win) dots += `M${f(a + 2.4)} ${f(wy)}H${f(cx - 2)}`;
          }
        }
        /* what stands on the roof */
        const [ta, tb, tt] = tiers[tiers.length - 1], tm = (ta + tb) / 2, r = rand();
        if (r < 0.3) { const al = 8 + rand() * (L.cls === 'far' ? 34 : 20); line += `M${f(tm)} ${f(tt)}v${f(-al)}M${f(tm - 2.2)} ${f(tt - al * 0.55)}h4.4M${f(tm - 1.4)} ${f(tt - al * 0.8)}h2.8`; }
        else if (r < 0.42) { const sp = 10 + rand() * 22; mass += `M${f(tm - 3.5)} ${f(tt)}L${f(tm)} ${f(tt - sp)}L${f(tm + 3.5)} ${f(tt)}Z`; line += `M${f(tm - 3.5)} ${f(tt)}L${f(tm)} ${f(tt - sp)}L${f(tm + 3.5)} ${f(tt)}M${f(tm)} ${f(tt - sp)}v${f(-sp * 0.5)}`; }
        else if (r < 0.54 && tb - ta > 15) { const bw = (tb - ta) * 0.7, bh = 7 + rand() * 6, bx = ta + (tb - ta) * 0.15, by = tt - 4 - bh;
          mass += `M${f(bx)} ${f(by)}h${f(bw)}v${f(bh)}h${f(-bw)}Z`;
          line += `M${f(bx)} ${f(by)}h${f(bw)}v${f(bh)}h${f(-bw)}ZM${f(bx + 2)} ${f(tt - 4)}v4M${f(bx + bw - 2)} ${f(tt - 4)}v4`;
          for (let q = 2.4; q < bw - 1; q += 2.4) hatch += `M${f(bx + q)} ${f(by + 1.4)}v${f(bh - 2.8)}`; }
        else if (r < 0.62 && L.cls !== 'near') { const rr = 5 + rand() * 6; dots += `M${f(tm - rr)} ${f(tt - rr - 5)}a${f(rr)} ${f(rr * 0.42)} 0 1 0 ${f(rr * 2)} 0a${f(rr)} ${f(rr * 0.42)} 0 1 0 ${f(-rr * 2)} 0`; }
        /* a vertical sign down the side of a tall one */
        if (L.cls !== 'far' && H > h * 0.34 && rand() < 0.3) {
          const [a, , t0] = tiers[0], sh = Math.min(30, H * 0.4), sy = t0 + 6;
          mass += `M${f(a - 5.5)} ${f(sy)}h5.5v${f(sh)}h-5.5Z`;
          line += `M${f(a - 5.5)} ${f(sy)}h5.5v${f(sh)}h-5.5Z`;
          for (let q = 2.6; q < sh - 3; q += 5.2) line += `M${f(a - 4)} ${f(sy + q)}h2.5v2.5h-2.5Z`;
        }
      }
      x += w + L.gap[0] + rand() * (L.gap[1] - L.gap[0]);
    }
    out += `<g class="sky sky-${L.cls}"><path class="sky-m" d="${mass}"/><path class="sky-l" d="${line}"/><path class="sky-h" d="${hatch}"/><path class="sky-w" d="${win}"/><path class="sky-d" d="${dots}"/></g>`;
  }
  /* still water under the ground line: broken hairlines that thin out as they go down */
  let water = '';
  for (let i = 0; i < 4; i++) {
    let x = -half * (0.82 - i * 0.12);
    const end = half * (0.82 - i * 0.12);
    while (x < end) { const l = 10 + rand() * (60 - i * 12); if (rand() < 0.74 - i * 0.12) water += `M${f(x)} ${f(5 + i * 4.6)}h${f(l)}`; x += l + 6 + rand() * 26; }
  }
  return `${out}<path class="sky-water" d="${water}"/>`;
}
