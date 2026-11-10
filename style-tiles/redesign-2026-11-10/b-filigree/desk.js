/* B · FILIGREE. MIMEI as a printed plate: the 未 carried by wings and scrollwork,
   in ice-blue ink on black at Night and in black ink with a teal wash on white
   paper in Ice. ornament.js is the drawing hand, city.js the ground it prints on;
   this file lays the plate out for the screen and hangs the machine's working
   parts on it. */
import { boot } from '../kit/os.js';
import { CREST, crestHalf, crestCentre, banner, corner, fleuron, winglet, glyphs, spray } from './ornament.js';
import { splat, specks, skyline } from './city.js';

const ease = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const n1 = v => Math.round(v * 10) / 10;

/* the small ornaments the stylesheet uses as masks */
for (const [k, v] of Object.entries(glyphs())) document.documentElement.style.setProperty(`--orn-${k}`, v);

/* ── where things sit, for this screen and this scene ─────────────────── */

function layout(scene) {
  const W = innerWidth, H = innerHeight, k = Math.max(0.62, Math.min(W / 1440, H / 900));
  if (scene === 'ice') {
    const ck = k * 0.8, cx = Math.round(W * 0.315), cy = Math.round(H * 0.455);
    const bandY = cy + 4 * k, rowX = (cx + CREST.half * ck + W - 44 * k) / 2 + 20 * k;
    return { W, H, k, ck, cx, cy, ice: true, topY: 62 * k, bandY, rowX, rowY: bandY, miX: rowX, miY: bandY + 60 * k, signY: cy + 232 * ck, base: H - 34 * k };
  }
  const cx = W / 2, cy = Math.round(H * 0.462), topY = 62 * k;
  return { W, H, k, ck: k, cx, cy, ice: false, topY, rowX: cx, rowY: topY, miX: cx, miY: topY + 35 * k, signY: cy + 224 * k, base: H - 34 * k };
}

/* ── the ground: splatter, handwriting, hairline bars, the city ───────── */

const ticks = (x0, x1, y, step, len, every = 0, big = 0) => {
  let d = '';
  for (let x = x0, i = 0; x <= x1 + 0.01; x += step, i++) d += `M${n1(x)} ${n1(y)}v${n1(every && i % every === 0 ? big : len)}`;
  return d;
};

function back(L, api) {
  const { W, H, k, ck, cx, cy, topY, base } = L, r = api.rng(L.ice ? 2005 : 1107);
  const half = W / 2 / k;
  const crest = `translate(${cx} ${cy}) scale(${n1(ck * 100) / 100})`;
  if (L.ice) {
    const env = x => ease((0.93 - Math.abs(x - 0.1)) / 0.36) * (0.3 + 0.7 * ease((x + 0.5) / 1.1)) * (1 - 0.5 * Math.exp(-(((x + 0.37) / 0.2) ** 2)));
    const y0 = L.bandY - 27 * k, y1 = L.bandY + 27 * k;
    return `
      <g transform="${crest}">
        <path class="wash" d="${splat(r, -70, -60, 170, { arms: 4, drops: 34, spread: 1.5 })}"/>
        <path class="wash" d="${splat(r, 170, 80, 110, { arms: 3, drops: 22, spread: 1.6 })}"/>
        <path class="wash wash-2" d="${splat(r, -230, 90, 70, { arms: 5, drops: 18 })}${splat(r, 60, -200, 54, { arms: 4, drops: 12 })}"/>
        <path class="blot" d="${splat(r, -330, -190, 9, { arms: 5, drops: 16, spread: 5 })}${splat(r, 300, 190, 7, { arms: 4, drops: 14, spread: 6 })}${splat(r, 120, 250, 5, { arms: 3, drops: 10, spread: 7 })}"/>
      </g>
      <rect class="band" x="0" y="${n1(y0)}" width="${W}" height="${n1(y1 - y0)}"/>
      <path class="hair" d="M0 ${n1(y0)}H${W}M0 ${n1(y1)}H${W}M0 ${n1(y1 + 5 * k)}H${n1(W * 0.62)}"/>
      <path class="hair hair-2" d="${ticks(L.rowX - 300 * k, L.rowX + 300 * k, y0, 6 * k, -4 * k, 5, -9 * k)}${ticks(W * 0.02, W * 0.1, y1, 6 * k, 4 * k, 5, 9 * k)}"/>
      <path class="dash" d="M${n1(W * 0.72)} ${n1(H * 0.2)}h${n1(56 * k)}m${n1(14 * k)} 0h${n1(22 * k)}M${n1(W * 0.72)} ${n1(H * 0.2 + 5 * k)}h${n1(34 * k)}m${n1(36 * k)} 0h${n1(22 * k)}M${n1(W * 0.56)} ${n1(H * 0.74)}h${n1(40 * k)}m${n1(12 * k)} 0h${n1(60 * k)}M${n1(W * 0.56)} ${n1(H * 0.74 + 5 * k)}h${n1(70 * k)}"/>
      <text class="script" x="${n1(W * 0.6)}" y="${n1(H * 0.31)}" font-size="${n1(58 * k)}" transform="rotate(-5 ${n1(W * 0.6)} ${n1(H * 0.31)})">the hour before dawn</text>
      <text class="script script-2" x="${n1(W * 0.655)}" y="${n1(H * 0.67)}" font-size="${n1(38 * k)}" transform="rotate(-5 ${n1(W * 0.655)} ${n1(H * 0.67)})">learn Roblox Luau from nothing</text>
      <g class="city" transform="translate(${W / 2} ${n1(base)}) scale(${k})">${skyline(r, half, { h: 128, env })}</g>
      <path class="hair" d="M${n1(36 * k)} ${n1(base)}H${n1(W - 36 * k)}"/>`;
  }
  const env = x => { const a = Math.abs(x); return ease((0.9 - a) / 0.3) * (1 - 0.66 * Math.exp(-((a / 0.34) ** 2))); };
  const gap = 322 * k;
  return `
    <g transform="${crest}">
      <path class="blot" d="${splat(r, 300, -170, 96, { arms: 7, drops: 40 })}${splat(r, -292, 118, 84, { arms: 6, drops: 36 })}"/>
      <path class="blot blot-2" d="${splat(r, -372, -128, 46, { arms: 5, drops: 22 })}${splat(r, 336, 168, 38, { arms: 5, drops: 20 })}${splat(r, 40, -236, 22, { arms: 4, drops: 12, spread: 4 })}"/>
      <text class="script" x="-560" y="168" font-size="56" transform="rotate(-8 -560 168)">the hour before dawn</text>
      <text class="script script-2" x="-524" y="216" font-size="38" transform="rotate(-8 -524 216)">learn Roblox Luau from nothing</text>
      <text class="script script-2" x="292" y="214" font-size="42" transform="rotate(-8 292 214)">the hour before dawn</text>
    </g>
    <path class="hair" d="M${n1(36 * k)} ${n1(topY)}H${n1(cx - gap)}M${n1(cx + gap)} ${n1(topY)}H${n1(W - 36 * k)}M${n1(36 * k)} ${n1(base)}H${n1(W - 36 * k)}"/>
    <path class="hair hair-2" d="${ticks(cx - gap - 150 * k, cx - gap, topY, 6 * k, 4 * k, 5, 9 * k)}${ticks(cx + gap, cx + gap + 150 * k, topY, 6 * k, 4 * k, 5, 9 * k)}${ticks(cx - 150 * k, cx + 150 * k, base, 6 * k, 4 * k, 5, 9 * k)}"/>
    <g class="city" transform="translate(${cx} ${n1(base)}) scale(${k})">${skyline(r, half, { h: 150, env })}</g>`;
}

/* ── workspace 1 ──────────────────────────────────────────────────────── */

function desk(el, api) {
  const { UNITS, TOTALS, DEMO } = api;
  const still = api.SHOT || api.reduced;
  const nowUnit = api.unitOf(DEMO.now).n;
  const state = u => (u.lessons.every(l => api.stateOf(l.id) === 'done') ? 'done' : u.n === nowUnit ? 'now' : 'next');
  const totals = `${TOTALS.units} units · ${TOTALS.lessons} lessons · ${TOTALS.checkpoints} checkpoints`;
  const clip = `<clipPath id="b-out"><path clip-rule="evenodd" d="M-700 -500H700V500H-700ZM${-CREST.rx} 0a${CREST.rx} ${CREST.ry} 0 1 0 ${CREST.rx * 2} 0a${CREST.rx} ${CREST.ry} 0 1 0 ${-CREST.rx * 2} 0Z"/></clipPath>`;

  const plate = api.h(`<div class="plate" aria-hidden="true">
    <svg class="pl pl-back"></svg>
    <svg class="pl pl-l"><defs>${clip}</defs><g class="crest"><g clip-path="url(#b-out)">${crestHalf('l')}</g></g></svg>
    <svg class="pl pl-r"><g class="crest"><g clip-path="url(#b-out)">${crestHalf('r')}</g></g></svg>
    <svg class="pl pl-c"><g class="crest">${crestCentre(api.mark.snow)}</g></svg>
    <svg class="pl pl-wear"><g class="crest">${specks(api.rng(77), -CREST.half, CREST.top, CREST.half, CREST.bottom, 640)}</g></svg>
  </div>`);
  const units = api.h(`<button class="units" type="button" data-act="course" aria-label="The course: ${TOTALS.units} units. You are in unit ${UNITS[nowUnit - 1].roman}, ${UNITS[nowUnit - 1].title}.">${
    UNITS.map(u => `<span class="un is-${state(u)}" data-n="${u.n}">${u.roman}</span>`).join('')}</button>`);
  const micro = api.h(`<p class="micro">${totals}</p>`);

  /* the sign's unit gets a small mark in the row */
  const follow = s => api.$$('.un', units).forEach(x => x.classList.toggle('is-sign', +x.dataset.n === s.unitN));
  api.on('sign', follow);
  const parts = api.deskParts(el);
  follow(parts.lesson());
  const slot = api.h('<span class="bn-slot" aria-hidden="true"></span>');
  parts.sign.append(slot);
  el.append(plate, units, micro, parts.sign, parts.clock, parts.brand, parts.night, parts.tools);

  units.addEventListener('pointerover', e => {
    const s = e.target.closest('.un');
    if (!s) return;
    const u = UNITS[s.dataset.n - 1];
    micro.textContent = `${u.roman} · ${u.title} · ${u.lessons.length} ${u.lessons.length === 1 ? 'lesson' : 'lessons'} · ${u.cps} checkpoints`;
  });
  units.addEventListener('pointerleave', () => { micro.textContent = totals; });

  let L = null, bnKey = '';
  const fitBanner = () => {
    const w = parts.sign.offsetWidth, h = parts.sign.offsetHeight;
    if (!w || !L) return;
    const key = `${w}:${h}:${L.k}`;
    if (key === bnKey) return;
    bnKey = key;
    slot.innerHTML = banner(w, h, L.k);
  };
  const draw = () => {
    L = layout(api.scene());
    const { W, H, k, ck, cx, cy } = L;
    const set = (name, v) => el.style.setProperty(name, `${n1(v)}px`);
    set('--u', k); set('--cx', cx); set('--cy', cy); set('--top-y', L.topY); set('--row-x', L.rowX); set('--row-y', L.rowY);
    set('--mi-x', L.miX); set('--mi-y', L.miY); set('--sign-y', L.signY);
    for (const s of plate.children) s.setAttribute('viewBox', `0 0 ${W} ${H}`);
    api.$$('.crest', plate).forEach(g => g.setAttribute('transform', `translate(${cx} ${cy}) scale(${g.closest('.pl-l') ? -ck : ck} ${ck})`));
    api.$('.pl-back', plate).innerHTML = back(L, api);
    fitBanner();
  };
  new ResizeObserver(fitBanner).observe(parts.sign);

  /* the ornament draws itself once, the first time the desk is seen */
  let played = still;
  const intro = () => {
    if (played || api.ws() !== 1) return;
    played = true;
    plate.classList.add('is-intro');
    setTimeout(() => plate.classList.remove('is-intro'), 2800);
  };
  if (still) el.classList.add('is-still');

  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(draw, 90); });
  api.on('scene', draw);
  api.on('leap', () => el.classList.add('is-leaping'));
  api.on('ws', n => { if (n === 1) { el.classList.remove('is-leaping'); intro(); fitBanner(); } });
  draw();
  intro();
}

/* ── the wall behind workspaces 2 to 4 ────────────────────────────────── */

function wall(el) {
  el.innerHTML = `<svg class="wl" viewBox="0 0 1600 1000" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
    <g transform="translate(1640 1050) scale(-1.7 1.7)"><path d="${spray()}"/></g></svg>`;
}

/* ── the course, as a contents plate ──────────────────────────────────── */

function map(el, api) {
  const { UNITS, TOTALS, DEMO, esc } = api;
  const nowUnit = api.unitOf(DEMO.now).n;
  const unit = u => {
    const st = u.lessons.every(l => api.stateOf(l.id) === 'done') ? 'done' : u.n === nowUnit ? 'now' : 'next';
    return `<section class="at-unit is-${st}">
      <span class="at-r" aria-hidden="true">${u.roman}</span>
      <h3><span class="at-ut">${esc(u.title)}</span><span class="at-um">${u.mins} min · ${u.cps} checkpoints</span></h3>
      <ol>${u.lessons.map(l => `<li><button class="at-l is-${api.stateOf(l.id)}" data-open="${l.id}"><span class="at-n">${l.id}</span><span class="at-t">${esc(l.title)}</span><span class="at-lead" aria-hidden="true"></span><span class="at-m">${l.mins} min</span></button></li>`).join('')}</ol>
    </section>`;
  };
  const col = us => us.map(unit).join(`<div class="at-fl" aria-hidden="true">${fleuron(160)}</div>`);
  el.innerHTML = `<div class="pane atlas" role="dialog" aria-label="The course">
    <header class="at-h">
      <p class="at-k">MIMEI</p>
      <h2>The course</h2>
      <p class="at-sum">${TOTALS.units} units · ${TOTALS.lessons} lessons · ${TOTALS.checkpoints} checkpoints</p>
      <button class="at-x" data-act="close">esc</button>
    </header>
    <div class="at-cols"><div class="at-col">${col(UNITS.slice(0, 6))}</div><div class="at-col">${col(UNITS.slice(6))}</div></div>
  </div>`;
  const pane = el.firstElementChild;
  pane.append(api.h(corner().replace('orn-corner', 'orn-corner c-tl')), api.h(corner().replace('orn-corner', 'orn-corner c-br')));
}

/* ── ornament on the calm pages: the margins, the edges, the small parts ─ */

function decorate(kind, el, api) {
  const corners = host => host.append(api.h(corner().replace('orn-corner', 'orn-corner c-tl')), api.h(corner().replace('orn-corner', 'orn-corner c-br')));
  if (kind === 'page' || kind === 'drawer' || kind === 'window') corners(el);
  else if (kind === 'launcher') corners(api.$('.launch', el));
  else if (kind === 'step') api.$('.step-h', el).prepend(api.h(fleuron()));
  else if (kind === 'key') el.prepend(api.h(winglet()));
  else if (kind === 'man-sec') el.prepend(api.h(fleuron(200)));
}

boot({ id: 'b', name: 'Filigree', leapMs: 500, desk, wall, map, decorate });
