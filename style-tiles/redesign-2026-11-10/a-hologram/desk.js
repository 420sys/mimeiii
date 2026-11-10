/* ════════════════════════════════════════════════════════════════════════
   A · Hologram.

   The megacity and the filigree in one picture: you are high over a city in
   the rain, and standing in it, as tall as its towers, is a crest of light —
   wings and scrollwork carrying 未, with the twelve units round it like the
   hours of a clock. A white billboard on a rooftop names your lesson. In Ice
   the same city is drawn in ink under snow, and the crest is printed on it.

   city.js draws the city, ink.js draws the crest and the page ornament, and
   this file puts them on the desk and makes them move.
   ════════════════════════════════════════════════════════════════════════ */

import { boot } from '../kit/os.js';
import { buildCity, paintCity, PLAZA, RING } from './city.js';
import { drawCrest, cornerOrnament, ruleOrnament } from './ink.js';

const PAD = 28;                                   // bleed round the still layers, so they can slide
const DRIFT = { far: 5, holo: 8, mid: 13, fore: 24 };
const TAU = Math.PI * 2;
const city = buildCity(2026);
let paintWall = null;

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
const tint = (src, colour) => {
  const c = mk(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = colour; x.fillRect(0, 0, c.width, c.height);
  return c;
};
/** The CSS transform that lays a w × h box on four screen points (top-left, top-right, bottom-right, bottom-left). */
function onQuad(w, h, q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1, g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
}

boot({ id: 'a', name: 'Hologram', leapMs: 880, desk, wall, map, decorate });

/* ── workspace 1 ──────────────────────────────────────────────────────── */

function desk(el, api) {
  const { h, $, $$, SHOT, reduced, UNITS, stateOf } = api;
  const still = SHOT || reduced;
  const unitState = u => (u.lessons.every(l => stateOf(l.id) === 'done') ? 'done' : u.lessons.some(l => stateOf(l.id) !== 'next') ? 'now' : 'next');
  const parts = api.deskParts(el);

  const stage = h('<div class="stage"></div>');
  const cv = {}, lyr = {};
  for (const k of ['far', 'holo', 'mid', 'lights', 'fore']) {
    lyr[k] = h(`<div class="lyr lyr-${k}"><canvas aria-hidden="true"></canvas></div>`);
    cv[k] = lyr[k].firstChild;
    stage.append(lyr[k]);
  }
  cv.weather = h('<canvas class="weather" aria-hidden="true"></canvas>');
  /* in Ice the crest is cut into a standing slab of frosted glass */
  const slab = h('<div class="slab" aria-hidden="true"></div>');
  lyr.holo.prepend(slab);
  /* the three boards are real elements laid on the buildings: the lesson, the time, tonight */
  lyr.fore.append(parts.sign, parts.clock, parts.night);
  stage.append(cv.weather);

  /* the course as a ruler along the bottom: 52 ticks, one a lesson; a click turns the billboard to it */
  const ruler = h(`<nav class="ruler" aria-label="The course, lesson by lesson"><ol>${UNITS.map(u => `
    <li class="ru-unit is-${unitState(u)}"><span class="ru-r" aria-hidden="true">${u.roman}</span><span class="ru-ticks">${u.lessons.map(l =>
    `<button class="ru-t is-${stateOf(l.id)}" data-flip="${l.id}" aria-label="${u.title}, lesson ${l.id}: ${api.esc(l.title)}" title="${l.id} · ${api.esc(l.title)}"><i></i></button>`).join('')}</span></li>`).join('')}</ol></nav>`);
  let shown = api.DEMO.now;
  ruler.addEventListener('click', e => {
    const b = e.target.closest('[data-flip]');
    if (b) parts.flip(api.order.indexOf(b.dataset.flip) - api.order.indexOf(shown));
  });
  api.on('sign', sg => {
    shown = sg.id;
    $$('.ru-t', ruler).forEach(b => b.classList.toggle('is-shown', b.dataset.flip === sg.id));
    /* long titles step down a size so the billboard never clips */
    parts.sign.style.setProperty('--fit', `${Math.max(1.5, Math.min(2.5, 37 / sg.title.length)).toFixed(2)}em`);
  });
  parts.paint();

  el.append(stage, h('<div class="vignette" aria-hidden="true"></div>'), parts.brand, parts.tools, ruler, h('<div class="leapflash" aria-hidden="true"></div>'));

  /* ── the picture ── */
  let R = null, mark = null, HB = null, holo = null, drops = [], cars = [];
  const signWords = () => UNITS.slice(0, 4).map(u => ({ text: u.title, state: unitState(u) }));

  function render() {
    const W = innerWidth, H = innerHeight, s = Math.min(devicePixelRatio || 1, 2, 3400 / (W + PAD * 2));
    const scene = api.scene();
    R = paintCity(city, cv, { W, H, s, pad: PAD }, scene, { signs: signWords() });
    R.W = W; R.H = H; R.s = s; R.night = scene !== 'ice';
    place(parts.sign, R.board, 27);
    place(parts.clock, R.clock, 9.4);
    place(parts.night, R.tonight, 15);
    const bc = [(R.board[0][0] + R.board[2][0]) / 2, (R.board[0][1] + R.board[2][1]) / 2];
    stage.style.setProperty('--ox', `${bc[0].toFixed(1)}px`); stage.style.setProperty('--oy', `${bc[1].toFixed(1)}px`);
    buildHolo();
    const fs = Math.min(devicePixelRatio || 1, 1.5);
    for (const k of ['lights', 'weather']) { cv[k].width = Math.round(W * fs); cv[k].height = Math.round(H * fs); cv[k].getContext('2d').setTransform(fs, 0, 0, fs, 0, 0); }
    frame(api.t());
    if (paintWall) paintWall(compose());
  }
  function place(node, q, per) {
    const w = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), hh = Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]);
    node.style.width = `${w.toFixed(1)}px`; node.style.height = `${hh.toFixed(1)}px`; node.style.fontSize = `${(w / per).toFixed(2)}px`;
    node.style.transform = onQuad(w, hh, q);
  }

  /* ── the hologram: light in the dark at night, frost cut in glass in Ice ── */
  function buildHolo() {
    const { s, night } = R, bw = R.holo.br[0] - R.holo.tl[0], bh = bw * 0.8, m = bw * 0.24;
    HB = { x: R.holo.tl[0] - m, y: R.holo.tl[1] - m, w: bw + m * 2, h: bh + m * 2 };
    const c = cv.holo, HW = Math.round(HB.w * s), HH = Math.round(HB.h * s), mp = Math.round(m * s), cw = Math.round(bw * s), ch = Math.round(bh * s);
    c.width = HW; c.height = HH;
    Object.assign(c.style, { left: `${HB.x}px`, top: `${HB.y}px`, width: `${HB.w}px`, height: `${HB.h}px` });
    Object.assign(slab.style, { left: `${R.holo.tl[0] - bw * 0.06}px`, top: `${R.holo.tl[1] - bh * 0.08}px`, width: `${bw * 1.12}px`, height: `${bh * 1.17}px` });
    const units = UNITS.map(u => ({ state: unitState(u) })), r = api.rng(77);
    const lum = mk(cw, ch);
    drawCrest(lum.getContext('2d'), cw, { units, mark });
    /* light in columns, like a curtain of LEDs in the rain; in Ice the same ribs read as reeded glass */
    const mask = mk(cw, ch), mx = mask.getContext('2d'), pitch = Math.max(3, Math.round(3 * s)), on = pitch - Math.max(1, Math.round(s));
    for (let x = 0; x < cw; x += pitch) { mx.fillStyle = `rgba(255,255,255,${(night ? 0.46 + 0.54 * r() : 0.82 + 0.18 * r()).toFixed(2)})`; mx.fillRect(x, 0, night ? on : pitch, ch); }
    const body = mk(cw, ch), bx = body.getContext('2d');
    bx.drawImage(lum, 0, 0);
    bx.globalCompositeOperation = 'source-in';
    const gd = bx.createLinearGradient(0, 0, 0, ch);
    (night ? ['#f6fdff', '#baf0f8', '#5edbe0'] : ['#ffffff', '#ffffff', '#effcfc']).forEach((col, i) => gd.addColorStop(i / 2, col));
    bx.fillStyle = gd; bx.fillRect(0, 0, cw, ch);
    bx.globalCompositeOperation = 'destination-in'; bx.drawImage(mask, 0, 0);
    const small = div => { const q = mk(HW / div, HH / div), x = q.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(lum, mp / div, mp / div, cw / div, ch / div); return q; };
    if (night) {
      /* the beams that carry it up from the plaza */
      const beams = mk(HW, HH), ex = beams.getContext('2d');
      for (let i = 0; i < 26; i++) {
        const x = mp + cw * (0.16 + 0.68 * r()), top = mp + ch * (0.5 + 0.3 * r()), g2 = ex.createLinearGradient(0, HH, 0, top);
        g2.addColorStop(0, `rgba(150,238,246,${(0.1 + 0.2 * r()).toFixed(2)})`); g2.addColorStop(1, 'rgba(150,238,246,0)');
        ex.fillStyle = g2; ex.fillRect(x, top, Math.max(1, s * (0.8 + r() * 1.6)), HH - top);
      }
      holo = { body, beams, tight: tint(small(7), '#8fe9f2'), wide: tint(small(22), '#55cfe0'), shade: tint(small(16), '#000'), HW, HH, mp, cw, ch, pitch };
    } else holo = { body, edge: tint(body, '#0f8794'), shade: tint(small(12), '#0a6976'), HW, HH, mp, cw, ch, pitch };
  }

  function frame(t) {
    if (!R || !holo) return;
    const hx = cv.holo.getContext('2d'), { HW, HH, mp, cw, ch } = holo, s = R.s;
    hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, HW, HH);
    if (R.night) {
      const fl = still ? 1 : 0.9 + 0.1 * Math.sin(t * 9.1) * Math.sin(t * 2.3);
      hx.globalCompositeOperation = 'source-over'; hx.globalAlpha = 0.6; hx.drawImage(holo.shade, 0, 0, HW, HH);   // a little dark behind, so the light reads
      hx.globalCompositeOperation = 'lighter';
      hx.globalAlpha = 0.55 * fl; hx.drawImage(holo.wide, 0, 0, HW, HH);
      hx.globalAlpha = 0.5 * fl; hx.drawImage(holo.tight, 0, 0, HW, HH);
      hx.globalAlpha = 0.75 * (still ? 1 : 0.8 + 0.2 * Math.sin(t * 1.7)); hx.drawImage(holo.beams, 0, 0);
      hx.globalAlpha = fl; hx.drawImage(holo.body, mp, mp);
      hx.globalAlpha = 0.2 * fl; hx.drawImage(holo.body, mp - holo.pitch, mp); hx.drawImage(holo.body, mp + holo.pitch, mp);
      /* a brighter band walks down it */
      const by = ((t * 0.09) % 1.3 - 0.15) * ch, bh = ch * 0.11;
      hx.save(); hx.beginPath(); hx.rect(mp, mp + by, cw, bh); hx.clip(); hx.globalAlpha = 0.5; hx.drawImage(holo.body, mp, mp); hx.restore();
      /* and now and then a few rows slip */
      if (!still) {
        const k = Math.floor(t * 11), g = api.rng(k * 7919);
        if (g() > 0.9) for (let i = 0; i < 3; i++) {
          const sy = Math.floor(g() * ch), sh = Math.ceil((2 + g() * 9) * s), dx = Math.round((g() - 0.5) * 22 * s);
          hx.globalAlpha = 0.85; hx.drawImage(holo.body, 0, sy, cw, sh, mp + dx, mp + sy, cw, sh);
        }
      }
      hx.globalAlpha = 1; hx.globalCompositeOperation = 'source-over';
    } else {
      hx.globalAlpha = 0.5; hx.drawImage(holo.shade, 0, Math.round(5 * s), HW, HH);                         // a soft teal shadow inside the glass
      hx.globalAlpha = 0.7; hx.drawImage(holo.edge, mp + Math.round(1.5 * s), mp + Math.round(2 * s));     // the cut edge
      hx.globalAlpha = 1; hx.drawImage(holo.body, mp, mp);
      /* light crosses the frost, slowly */
      const pos = (still ? 0.36 : (t * 0.05) % 1.7 - 0.3) * cw, band = cw * 0.16, lean = ch * 0.35;
      hx.save();
      hx.beginPath(); hx.moveTo(mp + pos, mp); hx.lineTo(mp + pos + band, mp); hx.lineTo(mp + pos + band - lean, mp + ch); hx.lineTo(mp + pos - lean, mp + ch); hx.closePath(); hx.clip();
      hx.globalCompositeOperation = 'lighter'; hx.globalAlpha = 0.6; hx.drawImage(holo.body, mp, mp);
      hx.restore();
      hx.globalAlpha = 1; hx.globalCompositeOperation = 'source-over';
    }
    lights(t); weather(t);
  }

  /* the things that move in the city: the lights on the masts, the traffic on the ring road */
  function lights(t) {
    const x = cv.lights.getContext('2d'), { W, H, pr, night } = R, F = pr.F;
    x.clearRect(0, 0, W, H);
    const off = k => [-cur.x * DRIFT[k], -cur.y * DRIFT[k] * 0.6];
    x.globalCompositeOperation = night ? 'lighter' : 'source-over';
    for (const b of R.beacons) {
      if (b.layer === 'fore') continue;
      const o = off(b.layer), a = still ? 0.8 : 0.2 + 0.8 * Math.max(0, Math.sin(t * 1.1 + b.ph * TAU)) ** 3;
      x.fillStyle = night ? `rgba(130,240,240,${a.toFixed(2)})` : `rgba(8,60,70,${(a * 0.7).toFixed(2)})`;
      x.beginPath(); x.arc(b.x + o[0], b.y + o[1], b.r * (night ? 1 + a * 0.8 : 0.9), 0, TAU); x.fill();
    }
    for (const c of cars) {
      for (let j = 0; j < 4; j++) {
        const a = c.a + c.v * (t - j * 0.09), far = Math.sin(a) >= 0, o = off(far ? 'far' : 'mid');
        const p = pr(PLAZA.x + (RING.r + c.lane) * Math.cos(a), RING.y + 1.6, PLAZA.z + (RING.r + c.lane) * Math.sin(a));
        const rad = Math.max(0.7, Math.min(3, (2.3 * F) / p[2])) * (1 - j * 0.16), al = (1 - j * 0.27) * (far ? 0.75 : 1);
        x.fillStyle = night ? (c.v > 0 ? `rgba(236,251,255,${al.toFixed(2)})` : `rgba(84,228,226,${al.toFixed(2)})`) : `rgba(10,24,30,${(al * 0.75).toFixed(2)})`;
        x.beginPath(); x.arc(p[0] + o[0], p[1] + o[1], rad, 0, TAU); x.fill();
      }
    }
    x.globalCompositeOperation = 'source-over';
  }

  /* drizzle at night, snow in Ice */
  function weather(t) {
    const x = cv.weather.getContext('2d'), { W, H, night } = R;
    x.clearRect(0, 0, W, H);
    if (night) {
      x.lineCap = 'round';
      for (let band = 0; band < 3; band++) {
        x.beginPath();
        for (const d of drops) {
          if (d.band !== band) continue;
          const y = ((d.y + t * (0.55 + d.z * 0.95)) % 1) * (H + 120) - 60, px = d.x * (W + 160) - 80 - y * 0.085, len = 12 + d.z * 40;
          x.moveTo(px, y); x.lineTo(px - len * 0.085, y + len);
        }
        x.strokeStyle = `rgba(190,232,244,${[0.07, 0.13, 0.22][band]})`; x.lineWidth = [0.7, 0.9, 1.2][band]; x.stroke();
      }
    } else {
      for (const d of drops) {
        const y = ((d.y + t * (0.018 + d.z * 0.05)) % 1) * (H + 30) - 15, px = d.x * W + Math.sin(t * (0.35 + d.z * 0.6) + d.x * 50) * 14 * d.z, rad = 0.7 + d.z * 2.3;
        x.fillStyle = `rgba(255,255,255,${(0.55 + 0.45 * d.z).toFixed(2)})`;
        x.beginPath(); x.arc(px, y, rad, 0, TAU); x.fill();
        if (d.z > 0.5) { x.strokeStyle = 'rgba(60,96,112,.16)'; x.lineWidth = 0.5; x.stroke(); }
      }
    }
  }
  function seedMoving() {
    const r = api.rng(404);
    drops = Array.from({ length: 300 }, () => { const z = r(); return { x: r(), y: r(), z, band: z < 0.4 ? 0 : z < 0.78 ? 1 : 2 }; });
    cars = Array.from({ length: 44 }, (_, i) => ({ a: r() * TAU, v: (0.055 + r() * 0.05) * (i % 2 ? 1 : -1), lane: i % 2 ? 4.5 : -4.5 }));
  }

  /* the city behind workspaces 2 to 4 is this picture, small */
  function compose() {
    const W = R.W, H = R.H, k = 0.3, c = mk(W * k, H * k), x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    for (const key of ['far', 'holo', 'mid', 'fore']) {
      if (key === 'holo') x.drawImage(cv.holo, HB.x * k, HB.y * k, HB.w * k, HB.h * k);
      else x.drawImage(cv[key], -PAD * k, -PAD * k, (W + PAD * 2) * k, (H + PAD * 2) * k);
    }
    return c;
  }

  /* ── moving it ── */
  const cur = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
  let raf = 0, skip = false;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    skip = !skip;
    if (skip) return;                                         // about thirty frames a second
    const t = api.t();
    cur.x += (tgt.x + Math.sin(t * 0.13) * 0.22 - cur.x) * 0.07; cur.y += (tgt.y + Math.cos(t * 0.1) * 0.14 - cur.y) * 0.07;
    stage.style.setProperty('--px', cur.x.toFixed(4)); stage.style.setProperty('--py', cur.y.toFixed(4));
    frame(t);
  };
  const run = () => {
    const on = !still && R && api.ws() === 1 && !document.hidden;
    if (on && !raf) raf = requestAnimationFrame(loop);
    if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  if (!still) el.addEventListener('pointermove', e => { tgt.x = (e.clientX / innerWidth - 0.5) * 2; tgt.y = (e.clientY / innerHeight - 0.5) * 2; });
  document.addEventListener('visibilitychange', run);
  api.on('ws', n => { if (n === 1) el.classList.remove('is-leaping'); run(); });
  api.on('scene', () => { if (R) { render(); run(); } });
  api.on('leap', () => el.classList.add('is-leaping'));
  api.on('ws', n => {                                         // arriving in a lesson from the billboard: its light fades off the page
    if (n !== 2 || !el.classList.contains('is-leaping')) return;
    document.documentElement.classList.add('is-arriving');
    setTimeout(() => document.documentElement.classList.remove('is-arriving'), 700);
  });
  let rz = 0;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (R) render(); }, 160); });

  return (async () => {
    const img = new Image();
    img.src = api.mark.snow;
    await Promise.all([img.decode().catch(() => {}), ...["400 40px 'Bebas Neue'", "600 25px 'Cinzel'", "400 20px 'Michroma'", "800 40px 'Doto'"].map(f => document.fonts.load(f).catch(() => {}))]);
    mark = img;
    seedMoving();
    render();
    run();
  })();
}

/* ── the backdrop of workspaces 2 to 4 ────────────────────────────────── */

function wall(el, api) {
  const c = api.h('<canvas class="wall-city"></canvas>');
  el.append(c, api.h('<div class="wall-veil"></div>'));
  paintWall = src => { c.width = src.width; c.height = src.height; c.getContext('2d').drawImage(src, 0, 0); };
}

/* ── the course: a skyline. A unit is a tower, a lesson is a floor, a minute is a height ── */

function map(el, api) {
  const { UNITS, TOTALS, stateOf, esc } = api;
  const ustate = u => (u.lessons.every(l => stateOf(l.id) === 'done') ? 'done' : u.lessons.some(l => stateOf(l.id) !== 'next') ? 'now' : 'next');
  const tower = u => `<section class="sk-tower is-${ustate(u)}" aria-label="Unit ${u.n}: ${esc(u.title)}">
    <header class="sk-roof"><span class="sk-r">${u.roman}</span><h3>${esc(u.title)}</h3><span class="sk-m">${u.mins} min · ${u.cps} checkpoints</span></header>
    <ol class="sk-floors">${u.lessons.map(l => `<li style="--m:${l.mins}"><button class="sk-floor is-${stateOf(l.id)}" data-open="${l.id}"><span class="sk-n">${l.id}</span><span class="sk-t">${esc(l.title)}</span><span class="sk-min">${l.mins}</span></button></li>`).join('')}</ol>
  </section>`;
  el.innerHTML = `<div class="pane skyline" role="dialog" aria-label="The course">
    <header class="sk-h"><h2>the course</h2>
      <p class="sk-sum">${TOTALS.units} units · ${TOTALS.lessons} lessons · ${TOTALS.checkpoints} checkpoints · ${TOTALS.minutes} minutes</p>
      <p class="sk-key"><span class="is-done"><i></i>finished</span><span class="is-now"><i></i>here</span><span class="is-next"><i></i>not yet</span><span class="sk-scale">a floor is a lesson · its height is its minutes</span></p>
      <button class="co-x" data-act="close">esc</button></header>
    <div class="sk-rows"><div class="sk-row">${UNITS.slice(0, 6).map(tower).join('')}</div><div class="sk-row">${UNITS.slice(6).map(tower).join('')}</div></div>
    ${cornerOrnament('tr')}</div>`;
}

/* ── ornament on the calm pages: it keeps to corners and rules ────────── */

function decorate(kind, el, api) {
  if (kind === 'page') el.append(api.h(cornerOrnament('tl')), api.h(cornerOrnament('br')));
  else if (kind === 'window' && el.dataset.app === 'man') el.append(api.h(cornerOrnament('tr')));
  else if (kind === 'window' && el.dataset.app === 'settings') el.append(api.h(cornerOrnament('br')));
  else if (kind === 'launcher') el.querySelector('.launch').append(api.h(cornerOrnament('tr')));
  else if (kind === 'key') el.append(api.h(ruleOrnament()));
}
