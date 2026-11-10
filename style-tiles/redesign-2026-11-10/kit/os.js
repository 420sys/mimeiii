/* ════════════════════════════════════════════════════════════════════════
   The shared machine for the redesign prototypes (10 Nov 2026).

   Each direction is a skin and a desk on top of this file. It builds what
   every direction keeps: the four workspaces, the slim bar, the study (one
   lesson, its outline, the scripts drawer), the cab (manual, terminal, files),
   settings, the launcher and the course. It owns no look: os.css lays things
   out, the direction's skin.css gives them a face.

   A direction calls boot({ id, name, desk, wall?, map?, decorate? }):
     desk(el, api)      workspace 1. The element is yours; draw anything.
     wall(el, api)      optional. The backdrop behind workspaces 2 to 4.
     map(el, api)       optional. Your own picture of the course (the overlay).
     decorate(kind, el, api)  optional. Called once for every part the machine
                        builds, so a skin can add ornament to it.

   Everything is real or says it is a demo: the course table is generated from
   src/data/course.js, the lesson and the manual are the site's own words, and
   the progress is the demo learner in course.js. Nothing touches localStorage
   key ossuary-1.
   ════════════════════════════════════════════════════════════════════════ */

import { UNITS, TOTALS, DEMO, LESSONS, lessonById, unitOf, stateOf, reachedIn } from './course.js';
import { LESSON, REACHED } from './lesson.js';
import { MAN } from './man.js';

export { UNITS, TOTALS, DEMO, LESSONS, LESSON, MAN, lessonById, unitOf, stateOf, reachedIn };

/* ── small things ─────────────────────────────────────────────────────── */

const Q = new URLSearchParams(location.search);
/** ?shot: draw one settled frame (no intro, loops held), for screenshots. */
export const SHOT = Q.has('shot');
export const reduced = Q.get('motion') === 'still' || matchMedia('(prefers-reduced-motion: reduce)').matches;

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const h = html => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
};
/** A seeded random source (mulberry32), so a generated picture is the same every load. */
export const rng = seed => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const bus = new EventTarget();
export const on = (name, fn) => bus.addEventListener(name, e => fn(e.detail));
const emit = (name, detail) => bus.dispatchEvent(new CustomEvent(name, { detail }));

const T0 = performance.now();
/** Seconds since start; held at 8 s under ?shot so every screenshot is the same frame. */
export const t = () => (SHOT ? 8 : (performance.now() - T0) / 1000);

/* ── the clock (real, unless ?time=23:47 and ?date=2026-11-05 pin it) ─── */

export function now() {
  const d = new Date();
  const date = Q.get('date'), time = Q.get('time');
  if (date) { const [y, m, dd] = date.split('-').map(Number); d.setFullYear(y, m - 1, dd); }
  if (time) { const [hh, mm] = time.split(':').map(Number); d.setHours(hh, mm, 0, 0); }
  return d;
}
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = n => String(n).padStart(2, '0');
const isoWeek = d => {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7));
  return Math.ceil(((x - Date.UTC(x.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
};
export function clock() {
  const d = now();
  return {
    hh: pad(d.getHours()), mm: pad(d.getMinutes()), text: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    dow: DOW[d.getDay()], day: pad(d.getDate()), mon: MON[d.getMonth()], week: isoWeek(d),
    /* The word names the picture, never a forecast (DESIGN.md §1). */
    weather: scene() === 'ice' ? 'snow' : 'drizzle',
  };
}
const hm = m => `${Math.floor(m / 60)}:${pad(m % 60)}`;
export const tonight = () => ({
  ...DEMO.tonight, text: `${hm(DEMO.tonight.mins)} / ${hm(DEMO.tonight.goal)}`, frac: DEMO.tonight.mins / DEMO.tonight.goal,
});
/** The demo week: a study night on every day so far, Monday first. */
export function week() {
  const today = (now().getDay() + 6) % 7;
  const dots = [0, 1, 2, 3, 4, 5, 6].map(i => i <= today);
  return { dots, nights: today + 1, today, number: isoWeek(now()), letters: ['M', 'T', 'W', 'T', 'F', 'S', 'S'] };
}

/* ── state ────────────────────────────────────────────────────────────── */

const S = {
  ws: 1,
  overlay: null,            // 'course' | 'launcher' | null
  drawer: false,
  front: 'man',             // the window in front on workspace 3
  reached: [...REACHED],    // checkpoints of 3.1
  cps: DEMO.checkpoints,    // checkpoints reached in the whole course
};
const WS = [null, 'desk', 'lessons', 'manual', 'settings'];
const root = document.documentElement;
let cfg = {};
let api = {};
const deco = (kind, el) => { try { cfg.decorate && cfg.decorate(kind, el, api); } catch (e) { console.error('decorate', kind, e); } return el; };

export const scene = () => root.dataset.scene || 'night';
export function setScene(s) {
  root.dataset.scene = s === 'ice' ? 'ice' : 'night';
  try { sessionStorage.setItem('mimei-proto-scene', root.dataset.scene); } catch (e) { /* private mode */ }
  emit('scene', root.dataset.scene);
  paintBar(); paintSettings();
}
export const toggleScene = () => setScene(scene() === 'ice' ? 'night' : 'ice');

/* ── what the desk's sign says ────────────────────────────────────────── */

const reachedCount = () => S.reached.filter(Boolean).length;
/** The four lines the crane's sign shows for a lesson, from real course data and the demo progress. */
export function sign(id = DEMO.now) {
  const l = lessonById(id), u = unitOf(id), st = stateOf(id);
  const total = l.checkpoints.length;
  const got = st === 'now' ? reachedCount() : reachedIn(id);
  const act = st === 'done' ? 'REVISIT' : st === 'now' ? 'RESUME' : 'BEGIN';
  const mid = st === 'done' ? `${total}/${total} CHECKPOINTS` : st === 'now' ? `CHECKPOINT ${Math.min(got + 1, total)}/${total}` : `${total} CHECKPOINTS`;
  return {
    id, state: st, unit: u.title, roman: u.roman, unitN: u.n, title: l.title, mins: l.mins, total, got, act,
    lines: [`${u.title.toUpperCase()} · ${id}`, l.title, mid, `▶ ${act} · ${l.mins} MIN`],
  };
}

/* ── Luau, coloured ───────────────────────────────────────────────────── */

const KW = new Set(['local', 'if', 'then', 'elseif', 'else', 'end', 'and', 'or', 'not', 'for', 'while', 'do', 'repeat', 'until', 'function', 'return', 'break', 'continue', 'in']);
/** One line of Luau as spans: .k keyword .b true/false/nil .s string .i {interpolation} .n number .c comment .f call .v name .o operator */
export function luau(line) {
  const re = /(--.*$)|(`(?:[^`\\]|\\.)*`)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|(\s+)|([^\sA-Za-z_\d"'`-]+|-)/g;
  let out = '', m;
  while ((m = re.exec(line))) {
    const [tok, com, tpl, str, num, id, ws] = m;
    if (com) out += `<span class="c">${esc(com)}</span>`;
    else if (tpl) out += `<span class="s">${esc(tpl).replace(/\{[^}]*\}/g, x => `<span class="i">${x}</span>`)}</span>`;
    else if (str) out += `<span class="s">${esc(str)}</span>`;
    else if (num) out += `<span class="n">${num}</span>`;
    else if (id) {
      const cls = id === 'true' || id === 'false' || id === 'nil' ? 'b' : KW.has(id) ? 'k' : /^\s*\(/.test(line.slice(re.lastIndex)) ? 'f' : 'v';
      out += `<span class="${cls}">${id}</span>`;
    } else if (ws) out += ws.replace(/\t/g, '    ');
    else out += `<span class="o">${esc(tok)}</span>`;
  }
  return out;
}

/* ── the parts of a page ──────────────────────────────────────────────── */

function codeFig(lines, cap = 'luau') {
  const fig = h(`<figure class="code"><figcaption>${esc(cap)}</figcaption><ol></ol></figure>`);
  for (const l of lines) {
    const li = h(`<li><code>${luau(l.c) || '&nbsp;'}</code></li>`);
    if (l.note) { li.classList.add('has-note'); li.append(h(`<span class="note">${esc(l.note)}</span>`)); }
    $('ol', fig).append(li);
  }
  return deco('code', fig);
}
const outputFig = lines => deco('output', h(`<figure class="output"><figcaption>Output</figcaption><pre>${
  lines.map(([txt, src]) => `<span class="o-line${txt.startsWith('!') ? ' is-err' : ''}"><span class="o-t">${esc(txt)}</span><span class="o-src">${esc(src)}</span></span>`).join('')
}</pre></figure>`));
const tableEl = b => deco('table', h(`<div class="tbl"><table><thead><tr>${b.head.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${
  b.rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`));
const keyEl = b => deco('key', h(`<aside class="key"><span class="key-k">key idea</span><p>${b.html}</p></aside>`));

function probeEl(b) {
  const el = h(`<div class="probe" data-id="${b.id}">
    <p class="probe-k"><span class="k">quick question</span> <span class="from">${b.recall ? `warm up — from ${esc(b.recall)}` : 'predict first'}</span></p>
    <p class="q">${esc(b.q)}</p>
    <div class="opts" role="group" aria-label="Answers">${b.options.map((o, i) => `<button type="button" class="opt" data-i="${i}"><span class="opt-mark" aria-hidden="true"></span><code>${esc(o)}</code></button>`).join('')}</div>
    <p class="verdict" role="status" hidden></p>
  </div>`);
  $('.q', el).before(codeFig(b.code.map(c => ({ c })), 'predict.lua'));
  const pick = i => {
    const right = i === b.answer;
    $$('.opt', el).forEach((o, k) => {
      o.classList.toggle('is-picked', k === i);
      o.classList.toggle('is-right', k === i && right);
      o.classList.toggle('is-wrong', k === i && !right);
      o.setAttribute('aria-pressed', k === i);
    });
    el.classList.add('is-answered');
    el.classList.toggle('is-right', right);
    const v = $('.verdict', el);
    v.hidden = false;
    v.innerHTML = `${right ? '<b class="y">Correct.</b>' : '<b class="n">Not quite.</b>'} ${b.why}`;
    if (right && b.cp !== undefined) reach(b.cp);
  };
  $$('.opt', el).forEach(o => o.addEventListener('click', () => pick(+o.dataset.i)));
  if (b.picked !== undefined) pick(b.picked);
  return deco('probe', el);
}

function runbookEl(b) {
  const el = h(`<div class="runbook" data-id="${b.id}">
    <div class="runbook-h"><span class="k">in Studio</span><span class="sub">runbook</span><span class="rb-title">${esc(b.title)}</span></div>
    <ul>${b.items.map(([html, done], i) => `<li><label><input type="checkbox" ${done ? 'checked' : ''} data-i="${i}"><span class="box" aria-hidden="true"></span><span class="t">${html}</span></label></li>`).join('')}</ul>
    <div class="runbook-foot"><span class="meter"><i></i></span><span class="hint"></span></div>
  </div>`);
  const sync = () => {
    const boxes = $$('input', el), n = boxes.filter(x => x.checked).length;
    $('.meter i', el).style.width = `${(n / boxes.length) * 100}%`;
    $('.hint', el).textContent = `${n} of ${boxes.length} done`;
    el.classList.toggle('is-done', n === boxes.length);
    if (n === boxes.length && b.cp !== undefined) reach(b.cp);
  };
  el.addEventListener('change', sync);
  sync();
  return deco('runbook', el);
}

function blockEl(b) {
  switch (b.t) {
    case 'p': return h(`<p>${b.html}</p>`);
    case 'ul': return h(`<ul class="list">${b.items.map(x => `<li>${x}</li>`).join('')}</ul>`);
    case 'ol': return h(`<ol class="list">${b.items.map(x => `<li>${x}</li>`).join('')}</ol>`);
    case 'code': return codeFig(b.lines);
    case 'output': return outputFig(b.lines);
    case 'table': return tableEl(b);
    case 'key': return keyEl(b);
    case 'probe': return probeEl(b);
    case 'task': return runbookEl(b);
    default: return h('<span></span>');
  }
}

/* ── progress (the demo learner's, held in memory only) ───────────────── */

function reach(i) {
  if (S.reached[i]) return;
  S.reached[i] = true;
  S.cps += 1;
  paintBar(); paintOutline(); paintSettings();
  const n = reachedCount(), of = LESSON.checkpoints.length, title = LESSON.checkpoints[i];
  const toast = $('#toast');
  toast.innerHTML = `<span class="toast-k">checkpoint ${n} of ${of}</span><span class="toast-t">${esc(title)}</span>`;
  toast.hidden = false;
  root.dataset.flash = 'cp';
  clearTimeout(reach.t);
  reach.t = setTimeout(() => { toast.hidden = true; delete root.dataset.flash; }, 3600);
  emit('checkpoint', { index: i, n, of, title, total: S.cps });
}
function note(text) {
  const toast = $('#toast');
  toast.innerHTML = `<span class="toast-k">prototype</span><span class="toast-t">${esc(text)}</span>`;
  toast.hidden = false;
  clearTimeout(reach.t);
  reach.t = setTimeout(() => { toast.hidden = true; }, 3200);
}

/* ── the bar (workspaces 2 to 4) ──────────────────────────────────────── */

const ICON = {
  search: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.2"/><path d="M10.2 10.2 14 14"/></svg>',
  apps: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h3.5v3.5H3zM9.5 3H13v3.5H9.5zM3 9.5h3.5V13H3zM9.5 9.5H13V13H9.5z"/></svg>',
  moon: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M12.6 10.1A5.4 5.4 0 0 1 5.9 3.4a5.4 5.4 0 1 0 6.7 6.7z"/></svg>',
  snow: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2.8 5l10.4 6M13.2 5 2.8 11M6.4 2.9 8 4.5l1.6-1.6M6.4 13.1 8 11.5l1.6 1.6"/></svg>',
};

function buildBar() {
  const bar = h(`<header id="bar" class="bar">
    <div class="bar-l">
      <button class="brand" data-go="1" aria-label="MIMEI: back to the desk"><span class="mark" aria-hidden="true"></span><span class="brand-name">MIMEI</span></button>
      <nav class="wss" aria-label="Workspaces">${[1, 2, 3, 4].map(n => `<button class="wsb" data-go="${n}"><span class="wsb-n">0${n}</span><span class="wsb-t">${WS[n]}</span></button>`).join('')}</nav>
    </div>
    <div class="bar-m" id="bar-task"></div>
    <div class="bar-r">
      <span class="bar-cps"><b></b><span class="bar-cps-t">checkpoints</span></span>
      <time class="bar-clock"></time>
      <button class="bar-btn" data-act="launcher" aria-label="Search the course (Alt+Enter)">${ICON.search}</button>
      <button class="bar-btn" data-act="scene" aria-label="Night or Ice"></button>
    </div>
  </header>`);
  return deco('bar', bar);
}

function paintBar() {
  const bar = $('#bar');
  if (!bar) return;
  $$('.wsb', bar).forEach(b => {
    const here = +b.dataset.go === S.ws;
    b.classList.toggle('is-here', here);
    b.setAttribute('aria-current', here ? 'page' : 'false');
  });
  $('.bar-cps b', bar).textContent = `${S.cps}/${TOTALS.checkpoints}`;
  $('.bar-clock', bar).textContent = clock().text;
  $('[data-act="scene"]', bar).innerHTML = scene() === 'ice' ? ICON.snow : ICON.moon;
  const m = $('#bar-task', bar);
  if (S.ws === 2) {
    m.innerHTML = `<ol class="bar-steps" aria-label="Steps of this lesson">${LESSON.steps.map(s =>
      `<li class="${s.n < LESSON.here ? 'is-done' : s.n === LESSON.here ? 'is-here' : ''}"><span class="bs-n">${pad(s.n)}</span>${s.n === LESSON.here ? `<span class="bs-t">${esc(s.title)}</span>` : ''}</li>`).join('')}</ol>`;
  } else if (S.ws === 3) {
    m.innerHTML = `<div class="bar-wins">${[['man', 'manual'], ['tty', 'terminal'], ['files', 'files']].map(([k, w]) =>
      `<button class="bw ${S.front === k ? 'is-front' : ''}" data-front="${k}">${w}</button>`).join('')}</div>`;
  } else if (S.ws === 4) {
    m.innerHTML = '<div class="bar-wins"><span class="bw is-front">settings</span></div>';
  } else m.innerHTML = '';
}

/* ── workspace 2: the study ───────────────────────────────────────────── */

function buildStudy(el) {
  const u = unitOf(LESSON.id);
  el.innerHTML = `
    <article class="pane page">
      <aside class="outline" aria-label="This lesson"></aside>
      <div class="page-top">
        <span class="cp-count"></span>
        <button class="btn-scripts" data-act="drawer">scripts <kbd>S</kbd></button>
      </div>
      <div class="scroll" tabindex="0">
        <div class="prose">
          <header class="l-head">
            <p class="kicker"><span>lesson ${LESSON.id}</span><span class="s">·</span><span>${esc(u.title)}</span></p>
            <h1>${esc(LESSON.title)}</h1>
            <p class="meta">${LESSON.checkpoints.length} checkpoints · about ${LESSON.mins} minutes</p>
          </header>
        </div>
      </div>
    </article>
    <aside class="pane drawer" aria-label="Scripts" hidden></aside>`;
  const prose = $('.prose', el);
  let into = prose;
  for (const b of LESSON.blocks) {
    if (b.t === 'step') {
      const s = LESSON.steps.find(x => x.n === b.n);
      into = h(`<section class="step ${s.n < LESSON.here ? 'is-done' : s.n === LESSON.here ? 'is-here' : ''}" id="step-${s.n}" data-kind="${s.kind}">
        <header class="step-h"><p class="step-k"><span>step ${pad(s.n)}</span><span class="s">·</span><span>${s.kind}</span></p><h2>${esc(s.title)}</h2></header></section>`);
      deco('step', into);
      prose.append(into);
    } else into.append(blockEl(b));
  }
  prose.append(h(`<p class="more">Steps 04 to 07 carry on here in the real lesson. These mock-ups set the first three.</p>`));
  deco('page', $('.page', el));
  buildDrawer($('.drawer', el));
  paintOutline();
  /* the outline's lamp follows the step in view */
  const sc = $('.scroll', el);
  sc.addEventListener('scroll', () => {
    const top = sc.getBoundingClientRect().top + sc.clientHeight * 0.3;
    let cur = 0;
    $$('.step', sc).forEach(s => { if (s.getBoundingClientRect().top < top) cur = +s.id.slice(5); });
    if (cur !== buildStudy.cur) { buildStudy.cur = cur; paintOutline(cur); }
  }, { passive: true });
}

function paintOutline(view) {
  const ol = $('.outline');
  if (!ol) return;
  const at = view === undefined ? (buildStudy.cur ?? LESSON.here) : view;
  const tn = tonight();
  ol.innerHTML = `
    <button class="ol-title ${at === 0 ? 'is-view' : ''}" data-step="0"><b>${LESSON.id}</b><span>${esc(LESSON.title)}</span></button>
    <ol class="ol-steps">${LESSON.steps.map(s => `
      <li class="ol-step ${s.n < LESSON.here ? 'is-done' : s.n === LESSON.here ? 'is-here' : ''} ${s.n === at ? 'is-view' : ''}" data-kind="${s.kind}">
        <button data-step="${s.n}"><span class="ol-n">${pad(s.n)}</span><span class="ol-t">${esc(s.title)}</span></button>
        ${(s.cps || []).map(c => `<span class="ol-cp ${S.reached[c] ? 'is-reached' : ''}"><i aria-hidden="true"></i><span>${esc(LESSON.checkpoints[c])}</span></span>`).join('')}
      </li>`).join('')}</ol>
    <footer class="ol-foot">
      <div class="ol-tonight"><span class="ol-k">tonight</span><b>${tn.text}</b><span class="meter"><i style="width:${Math.min(100, tn.frac * 100)}%"></i></span></div>
      <div class="ol-nav"><button data-act="prev" aria-label="Previous lesson">‹</button><span>${LESSON.id}</span><button data-act="next" aria-label="Next lesson">›</button></div>
      <button class="ol-course" data-act="course">the course <kbd>C</kbd></button>
    </footer>`;
  deco('outline', ol);
  const n = reachedCount(), of = LESSON.checkpoints.length;
  $('.cp-count').innerHTML = n >= of ? `<b>${of}</b> of ${of} checkpoints` : `checkpoint <b>${n + 1}</b> of ${of}`;
}

function buildDrawer(el) {
  const s = LESSON.steps.find(x => x.n === LESSON.here);
  const i = LESSON.blocks.findIndex(b => b.t === 'step' && b.n === LESSON.here);
  const j = LESSON.blocks.findIndex((b, k) => k > i && b.t === 'step');
  const mine = LESSON.blocks.slice(i + 1, j < 0 ? undefined : j);
  el.innerHTML = `<header class="dr-h"><p class="dr-k"><span>step ${pad(s.n)}</span><span class="s">·</span><span>${s.kind}</span></p><h3>${esc(s.title)}</h3><button class="dr-x" data-act="drawer" aria-label="Close the scripts">esc</button></header><div class="dr-body"></div>`;
  const body = $('.dr-body', el);
  mine.filter(b => b.t === 'code').forEach((b, k) => { const f = codeFig(b.lines, `script ${k + 1}`); f.classList.add('notes-open'); body.append(f); });
  const out = mine.find(b => b.t === 'output');
  if (out) body.append(outputFig(out.lines));
  body.append(h('<p class="dr-hint">Type it into a Script in ServerScriptService, then press Play. Nothing on this site runs Luau.</p>'));
  deco('drawer', el);
}

/* ── workspace 3: the manual, the terminal and the files ──────────────── */

const win = (app, title, body) => h(`<section class="win ${app}" data-app="${app}" tabindex="-1">
  <header class="win-bar"><span class="win-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="win-title">${esc(title)}</span></header>
  <div class="win-body">${body}</div></section>`);

function buildMan() {
  const w = win('man', MAN.title, `
    <header class="man-head"><span>${MAN.name}</span><span>${MAN.book} · ${MAN.topic}</span><span>${MAN.page}/${MAN.pages}</span></header>
    <div class="man-scroll" tabindex="0"><div class="man-page"><h1>${esc(MAN.title)}</h1><p class="lede">${esc(MAN.lede)}</p></div></div>
    <footer class="man-foot"><span class="mf-nav"><button aria-label="Previous page">◀</button><button aria-label="Next page">▶</button><span>man ${MAN.page}/${MAN.pages}</span></span><span class="mf-keys"><span>top</span><span><kbd>q</kbd> close</span></span></footer>`);
  const page = $('.man-page', w);
  for (const s of MAN.sections) {
    const sec = h(`<section class="man-sec"><h2>${esc(s.h)}</h2></section>`);
    s.blocks.forEach(b => sec.append(blockEl(b)));
    $$('.code', sec).forEach(f => f.classList.add('notes-open'));
    page.append(deco('man-sec', sec));
  }
  return w;
}

function buildTty() {
  const sg = sign();
  const w = win('tty', 'luau@desk', `<div class="tty-scroll" tabindex="0">
    <div class="tty-hello"><span class="mark" aria-hidden="true"></span><div>
      <p class="tty-host">luau@desk</p>
      <p>mimei 1.0 · tty1 · online</p>
      <p><span class="tty-live" data-live="progress"></span></p>
      <p><span class="tty-dim">next</span> ${sg.id} ${esc(sg.title)}</p>
      <p class="tty-dim">help · ls · open ${sg.id}</p>
    </div></div>
    <div class="tty-log" aria-live="polite"></div>
    <label class="tty-line"><span class="tty-ps">luau@desk ~$</span><input class="tty-in" spellcheck="false" autocomplete="off" aria-label="Terminal"></label></div>`);
  const log = $('.tty-log', w), inp = $('.tty-in', w);
  const say = (cmd, html) => { log.append(h(`<div class="tty-out"><p class="tty-cmd"><span class="tty-ps">luau@desk ~$</span> ${esc(cmd)}</p>${html}</div>`)); $('.tty-scroll', w).scrollTop = 1e6; };
  const run = cmd => {
    const [c, a] = cmd.trim().split(/\s+/);
    if (!c) return;
    if (c === 'help') say(cmd, '<p>ls · open &lt;lesson&gt; · man · scene night|ice · clear</p>');
    else if (c === 'ls') say(cmd, `<p class="tty-cols">${UNITS.map(u => `<span>${u.dir}/</span>`).join('')}</p>`);
    else if (c === 'open') { say(cmd, `<p>opening ${esc(a || DEMO.now)} …</p>`); openLesson(a || DEMO.now); }
    else if (c === 'man') { say(cmd, `<p>${MAN.name} is in front.</p>`); front('man'); }
    else if (c === 'scene' && (a === 'night' || a === 'ice')) { setScene(a); say(cmd, `<p>scene: ${a}</p>`); }
    else if (c === 'clear') log.innerHTML = '';
    else say(cmd, `<p>${esc(c)}: not found. Try <b>help</b>.</p>`);
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { run(inp.value); inp.value = ''; } e.stopPropagation(); });
  return w;
}

function buildFiles() {
  const cur = unitOf(DEMO.now);
  const w = win('files', '~/roblox-luau', `<div class="f-grid"><ul class="f-dirs"></ul><div class="f-side"><ul class="f-list"></ul><div class="f-info"></div></div></div>`);
  const show = u => {
    $$('.f-dirs button', w).forEach(b => b.classList.toggle('is-open', b.dataset.u === String(u.n)));
    $('.f-list', w).innerHTML = u.lessons.map(l => `<li><button class="f-file is-${stateOf(l.id)}" data-id="${l.id}"><span class="f-n">${l.id}</span><span class="f-t">${esc(l.title)}</span></button></li>`).join('')
      + (u.cheat ? `<li><button class="f-file is-man" data-man="1"><span class="f-n">man</span><span class="f-t">${esc(u.cheat.title)}</span></button></li>` : '');
    info(u.lessons.find(l => l.id === DEMO.now) || u.lessons[0]);
  };
  const info = l => {
    const st = stateOf(l.id);
    $('.f-info', w).innerHTML = `<p class="fi-t"><b>${l.id}</b> ${esc(l.title)}</p><p class="fi-m"><span>${st === 'done' ? 'finished' : st === 'now' ? 'in progress' : 'ready'}</span><span>${l.mins} min</span><span>${l.checkpoints.length} checkpoints</span></p><button class="fi-open" data-id="${l.id}">open →</button>`;
    $$('.f-file', w).forEach(b => b.classList.toggle('is-sel', b.dataset.id === l.id));
  };
  $('.f-dirs', w).innerHTML = UNITS.map(u => `<li><button data-u="${u.n}">${u.dir}/</button></li>`).join('');
  w.addEventListener('click', e => {
    const d = e.target.closest('[data-u]'), f = e.target.closest('.f-file'), o = e.target.closest('.fi-open');
    if (d) show(UNITS[+d.dataset.u - 1]);
    else if (f && f.dataset.man) front('man');
    else if (f) info(lessonById(f.dataset.id));
    else if (o) openLesson(o.dataset.id);
  });
  w.addEventListener('dblclick', e => { const f = e.target.closest('.f-file[data-id]'); if (f) openLesson(f.dataset.id); });
  show(cur);
  return w;
}

function front(app) {
  S.front = app;
  $$('#ws3 .win').forEach(w => w.classList.toggle('is-front', w.dataset.app === app));
  paintBar();
}

/* ── workspace 4: settings (the site's own rows and words) ────────────── */

const SET = { fx: 'full', goal: 60, sound: true, rain: false };
const goalWord = m => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60}` : `${m / 60} h`);

function paintSettings() {
  const body = $('#ws4 .win-body');
  if (!body) return;
  const lvl = { full: 3, balanced: 2, minimal: 1, static: 0, auto: 3 }[SET.fx];
  const word = { 3: 'full', 2: 'balanced', 1: 'minimal', 0: 'static' }[lvl];
  const row = (label, sub, control) => `<div class="srow"><span class="d">${label} <span class="sub">${sub}</span></span><span class="ctl">${control}</span></div>`;
  const seg = (name, opts, cur, label) => `<span class="seg" role="group" aria-label="${label}">${opts.map(([v, t]) => `<button data-${name}="${v}" aria-pressed="${String(v) === String(cur)}">${t}</button>`).join('')}</span>`;
  const sw = (name, on) => `<button class="sw" role="switch" aria-checked="${on}" data-sw="${name}" aria-label="${name}"><i></i></button>`;
  body.innerHTML = `<div class="set">
    <section class="rowset"><h3>the machine</h3>
      ${row('scene', `now ${scene()} · night turns late from 01:30 to 05:00 · ice is light, here, on the desk and in the lessons`, seg('scene', [['night', 'night'], ['ice', 'ice']], scene(), 'Scene'))}
      ${row('effects', `now ${word} (level ${lvl}) · the desk moves: ${lvl >= 2 ? 'full' : lvl === 1 ? 'calm' : 'still'}`, seg('fx', ['auto', 'full', 'balanced', 'minimal', 'static'].map(x => [x, x]), SET.fx, 'Effects level'))}
      ${row('sound', 'the city at night and soft clicks, made in the browser · half volume in lessons', sw('sound', SET.sound))}
      ${row('rain', 'the canvas outside these windows', sw('rain', SET.rain))}
      ${row('the city only', 'everything steps aside so you can see the city', '<button class="btn ghost" data-act="peek">peek <kbd>alt b</kbd></button>')}
    </section>
    <section class="rowset"><h3>what you have done</h3>
      ${row('tonight’s goal', 'counted while a lesson is open and you have used the page in the last 15 minutes · the night ends at 5 a.m.', seg('goal', [30, 45, 60, 90, 120].map(m => [m, goalWord(m)]), SET.goal, 'Tonight’s goal'))}
      ${row('sessions finished', `${DEMO.lessonsDone} of ${TOTALS.lessons} on the line`, `<b>${DEMO.lessonsDone}/${TOTALS.lessons}</b>`)}
      ${row('checkpoints', 'ticked in lessons, runbooks and the goals window', `<b>${S.cps}/${TOTALS.checkpoints}</b>`)}
      ${row('streak', 'days in a row with MIMEI open', `<b>${week().nights} ${week().nights === 1 ? 'day' : 'days'}</b>`)}
      ${row('look at it', 'tick checkpoints, read the log', '<button class="btn ghost">Goals</button><button class="btn ghost">Journal</button>')}
      ${row('keep a copy', 'one file: what you ticked and where you stopped', '<button class="btn ghost">Export</button><button class="btn ghost">Import…</button>')}
    </section>
    <section class="rowset"><h3>keyboard</h3>
      <div class="kbdlist">${[
        [['alt', '1…4'], 'desk, lessons, manual, settings'], [['alt', 'enter'], 'search the course'], [['S'], 'the scripts, beside the lesson'],
        [['C'], 'the course'], [['N'], 'night or ice'], [['esc'], 'put it away'],
      ].map(([k, d]) => `<span class="ks">${k.map(x => `<kbd>${x}</kbd>`).join('')}</span><span class="d">${d}</span>`).join('')}</div>
    </section>
    <section class="about">
      <p><b>MIMEI 1.0</b> — a quiet desk for learning Roblox Luau from nothing. Nothing on this site runs Luau: every script goes into your own Roblox Studio.</p>
      <p>No build step, no framework, no tracking. Your progress lives in this browser only.</p>
    </section></div>`;
  deco('settings', body);
}

/* ── the course (overlay) and the launcher ────────────────────────────── */

function buildCourse(el) {
  if (cfg.map) { cfg.map(el, api); return; }
  el.innerHTML = `<div class="pane course-list"><header class="co-h"><h2>the course</h2><p>${TOTALS.units} units · ${TOTALS.lessons} lessons · ${TOTALS.checkpoints} checkpoints</p><button data-act="close" class="co-x">esc</button></header>
    <div class="co-grid">${UNITS.map(u => `<section class="co-unit ${u.lessons.every(l => stateOf(l.id) === 'done') ? 'is-done' : u.n === unitOf(DEMO.now).n ? 'is-now' : ''}">
      <h3><span class="co-r">${u.roman}</span>${esc(u.title)}</h3>
      <ol>${u.lessons.map(l => `<li><button class="co-l is-${stateOf(l.id)}" data-open="${l.id}"><span class="co-n">${l.id}</span><span class="co-t">${esc(l.title)}</span><span class="co-m">${l.mins}m</span></button></li>`).join('')}</ol>
    </section>`).join('')}</div></div>`;
  deco('course', el);
}

function buildLauncher(el) {
  el.innerHTML = `<div class="pane launch" role="dialog" aria-label="Search the course">
    <header class="la-h"><span class="la-mode is-on">lessons</span><span class="la-mode">windows</span><input class="la-in" placeholder="jump to a lesson" spellcheck="false" autocomplete="off" aria-label="Search the course"><span class="la-count"></span></header>
    <ol class="la-list" role="listbox"></ol>
    <footer class="la-f"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>tab</kbd> mode</span><span><kbd>esc</kbd> close</span></footer></div>`;
  const inp = $('.la-in', el), list = $('.la-list', el);
  let sel = 0, rows = [];
  const paint = () => {
    const q = inp.value.trim().toLowerCase();
    rows = LESSONS.filter(l => !q || `${l.id} ${l.title} ${UNITS[l.unit - 1].title}`.toLowerCase().includes(q));
    sel = Math.min(sel, Math.max(0, rows.length - 1));
    $('.la-count', el).textContent = `${rows.length} results`;
    list.innerHTML = rows.map((l, i) => `<li role="option" aria-selected="${i === sel}" class="la-row is-${stateOf(l.id)} ${i === sel ? 'is-sel' : ''}" data-open="${l.id}"><span class="la-n">${l.id}</span><span class="la-t">${esc(l.title)}</span><span class="la-u">${esc(UNITS[l.unit - 1].title)}</span><span class="la-m">~${l.mins}m</span></li>`).join('');
    const cur = $('.is-sel', list);
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  };
  inp.addEventListener('input', () => { sel = 0; paint(); });
  inp.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, rows.length - 1); paint(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); paint(); e.preventDefault(); }
    else if (e.key === 'Enter' && rows[sel]) openLesson(rows[sel].id);
    if (e.key !== 'Escape') e.stopPropagation();
  });
  buildLauncher.open = () => { inp.value = ''; sel = LESSONS.findIndex(l => l.id === DEMO.now); paint(); setTimeout(() => inp.focus(), 30); };
  deco('launcher', el);
}

/* ── moving around ────────────────────────────────────────────────────── */

function sync() {
  root.dataset.ws = S.ws;
  root.dataset.overlay = S.overlay || '';
  root.dataset.drawer = S.drawer ? 'open' : '';
  $('.drawer').hidden = !S.drawer;
  $('#course').hidden = S.overlay !== 'course';
  $('#launcher').hidden = S.overlay !== 'launcher';
  $$('#proto [data-go]').forEach(b => b.classList.toggle('is-here', +b.dataset.go === S.ws));
  paintBar();
  const hash = `#${S.ws}${S.overlay ? '.' + S.overlay : S.drawer && S.ws === 2 ? '.drawer' : ''}`;
  if (location.hash !== hash) history.replaceState(null, '', location.pathname + location.search + hash);
}

export function go(n) {
  if (n === S.ws && !S.overlay) return;
  S.ws = n; S.overlay = null;
  sync();
  emit('ws', n);
}
export function overlay(name) {
  S.overlay = S.overlay === name ? null : name;
  sync();
  if (S.overlay === 'launcher') buildLauncher.open();
  emit('overlay', S.overlay);
}
export function drawer(open = !S.drawer) { S.drawer = open; sync(); emit('drawer', open); }

/** Open a lesson. The desk may play its own way in first: it gets 'leap' and the machine waits cfg.leapMs. */
export function openLesson(id = DEMO.now) {
  const wait = S.ws === 1 && !SHOT && !reduced ? (cfg.leapMs || 0) : 0;
  if (S.ws === 1) emit('leap', { id, ms: wait });
  setTimeout(() => {
    S.overlay = null; S.ws = 2; sync(); emit('ws', 2);
    if (id !== LESSON.id) note(`only lesson ${LESSON.id} is set in these mock-ups · you asked for ${id}`);
  }, wait);
}

function readHash() {
  const [w, ov] = location.hash.slice(1).split('.');
  const n = +w;
  S.ws = n >= 1 && n <= 4 ? n : 1;
  S.overlay = ov === 'course' || ov === 'launcher' ? ov : null;
  S.drawer = ov === 'drawer';
}

function keys(e) {
  const typing = /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
  if (e.key === 'Escape') {
    if (S.overlay) { overlay(S.overlay); e.preventDefault(); }
    else if (S.drawer) drawer(false);
    return;
  }
  if (e.altKey && e.key === 'Enter') { overlay('launcher'); e.preventDefault(); return; }
  if (typing || e.metaKey || e.ctrlKey) return;
  const k = e.key.toLowerCase();
  if (/^[1-4]$/.test(e.key)) { go(+e.key); e.preventDefault(); }
  else if (k === '/') { overlay('launcher'); e.preventDefault(); }
  else if (k === 'c') overlay('course');
  else if (k === 'n') toggleScene();
  else if (k === 's' && S.ws === 2) drawer();
  else if (k === 'g' && !e.altKey) location.href = '../index.html';
}

function clicks(e) {
  const g = e.target.closest('[data-go]'), a = e.target.closest('[data-act]'), o = e.target.closest('[data-open]');
  const f = e.target.closest('[data-front]'), w = e.target.closest('#ws3 .win'), st = e.target.closest('[data-step]');
  if (g) return go(+g.dataset.go);
  if (o) return openLesson(o.dataset.open);
  if (f) return front(f.dataset.front);
  if (st) { const s = +st.dataset.step, sc = $('#ws2 .scroll'), to = s ? $(`#step-${s}`) : $('.l-head'); if (to) sc.scrollTo({ top: to.offsetTop - 24, behavior: reduced || SHOT ? 'auto' : 'smooth' }); else note('steps 04 to 07 are not set in these mock-ups'); return; }
  if (a) {
    const act = a.dataset.act;
    if (act === 'launcher' || act === 'course') return overlay(act);
    if (act === 'close') return overlay(S.overlay);
    if (act === 'scene') return toggleScene();
    if (act === 'drawer') return drawer();
    if (act === 'prev' || act === 'next') return note('only lesson 3.1 is set in these mock-ups');
    if (act === 'peek') return go(1);
  }
  if (w && w.dataset.app !== S.front) front(w.dataset.app);
  const sc = e.target.closest('[data-scene]'), fx = e.target.closest('[data-fx]'), gl = e.target.closest('[data-goal]'), sw = e.target.closest('[data-sw]');
  if (sc && sc.closest('.set')) setScene(sc.dataset.scene);
  if (fx) { SET.fx = fx.dataset.fx; paintSettings(); }
  if (gl) { SET.goal = +gl.dataset.goal; paintSettings(); }
  if (sw) { SET[sw.dataset.sw] = !SET[sw.dataset.sw]; paintSettings(); emit('setting', { ...SET }); }
  if (e.target.id === 'course' || e.target.id === 'launcher') overlay(S.overlay);
}

/* ── the desk's working parts ─────────────────────────────────────────── */

/** What every desk carries, as plain unstyled elements a direction can put
 *  anywhere (or ignore and draw its own from sign(), clock(), tonight(), week()):
 *    sign    a real <button>: four lines naming a lesson. ← and → flip it
 *            through every lesson, Enter or a click opens it, M opens the manual.
 *    clock   the weather word, the time and the date.
 *    brand, night, tools   the three corners of the menu that comes with the
 *            mouse and leaves after 2.6 s (Esc pins it). The desk element gets
 *            .menu-on while it is up.                                          */
function deskParts(desk) {
  let id = DEMO.now;
  const signEl = h('<button class="sign" type="button"><span class="sign-l sign-l1"></span><span class="sign-l sign-l2"></span><span class="sign-l sign-l3"></span><span class="sign-l sign-l4"></span></button>');
  const clockEl = h('<div class="dclock"><span class="dclock-w"></span><time class="dclock-t"></time><span class="dclock-d"></span></div>');
  const brand = h(`<div class="dmenu dmenu-brand"><span class="mark" aria-hidden="true"></span><span class="brand-name">MIMEI</span>
    <nav class="wss" aria-label="Workspaces">${[1, 2, 3, 4].map(n => `<button class="wsb ${n === 1 ? 'is-here' : ''}" data-go="${n}"><span class="wsb-n">0${n}</span><span class="wsb-t">${WS[n]}</span></button>`).join('')}</nav></div>`);
  const night = h('<div class="dmenu dmenu-night"><span class="dn-k">tonight</span><b class="dn-t"></b><span class="meter"><i></i></span><span class="dn-w"></span><span class="dn-dots"></span></div>');
  const tools = h(`<div class="dmenu dmenu-tools"><button class="dt-b" data-desk="sound" aria-pressed="true" aria-label="Sound">sound</button><button class="dt-b" data-act="scene" aria-label="Night or Ice"></button><button class="dt-b" data-go="4">settings</button><span class="dt-hint">esc · hide</span></div>`);

  const paintSign = () => {
    const s = sign(id);
    signEl.dataset.state = s.state;
    s.lines.forEach((txt, i) => { signEl.children[i].textContent = txt; });
    signEl.setAttribute('aria-label', `${s.unit}, lesson ${s.id}: ${s.title}. ${s.act.toLowerCase()}, ${s.mins} minutes.`);
    emit('sign', s);
  };
  const paint = () => {
    const c = clock(), tn = tonight(), w = week();
    $('.dclock-w', clockEl).textContent = c.weather;
    $('.dclock-t', clockEl).textContent = c.text;
    $('.dclock-d', clockEl).textContent = `${c.dow} · ${c.day} · ${c.mon}`;
    $('.dn-t', night).textContent = tn.text;
    $('.meter i', night).style.width = `${Math.min(100, tn.frac * 100)}%`;
    $('.dn-w', night).textContent = `${w.nights} study ${w.nights === 1 ? 'night' : 'nights'} · week ${w.number}`;
    $('.dn-dots', night).innerHTML = w.letters.map((x, i) => `<span class="${w.dots[i] ? 'is-on' : ''} ${i === w.today ? 'is-today' : ''}"><i></i>${x}</span>`).join('');
    $('[data-act="scene"]', tools).innerHTML = `${scene() === 'ice' ? ICON.snow : ICON.moon}<span>${scene()}</span>`;
    paintSign();
  };
  const flip = d => { const i = api.order.indexOf(id); id = api.order[(i + d + api.order.length) % api.order.length]; paintSign(); };
  signEl.addEventListener('click', () => openLesson(id));
  $('[data-desk="sound"]', tools).addEventListener('click', e => { const b = e.currentTarget; b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });

  let hide = 0, pinned = SHOT && Q.has('menu');
  const show = () => {
    desk.classList.add('menu-on');
    clearTimeout(hide);
    if (!pinned) hide = setTimeout(() => desk.classList.remove('menu-on'), 2600);
  };
  if (pinned || Q.has('menu')) { pinned = true; desk.classList.add('menu-on'); }
  desk.addEventListener('pointermove', show);
  desk.addEventListener('focusin', show);
  document.addEventListener('keydown', e => {
    if (S.ws !== 1 || S.overlay || e.altKey || e.metaKey || e.ctrlKey || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') flip(1);
    else if (e.key === 'ArrowLeft') flip(-1);
    else if (e.key === 'Enter' && !e.target.closest('button, a')) openLesson(id);
    else if (e.key.toLowerCase() === 'm') go(3);
    else if (e.key === 'Escape') { pinned = !pinned; pinned ? show() : desk.classList.remove('menu-on'); }
  });
  on('scene', paint); on('tick', paint); on('checkpoint', paint);
  paint();
  return { sign: signEl, clock: clockEl, brand, night, tools, flip, paint, lesson: () => sign(id) };
}

/* ── the prototype switcher (not part of any design) ──────────────────── */

const PROTOS = [['a-hologram', 'A', 'Hologram'], ['b-filigree', 'B', 'Filigree'], ['c-signal', 'C', 'Signal'], ['d-rose', 'D', 'Rose window']];
function buildSwitcher() {
  return h(`<nav id="proto" aria-label="Prototype switcher">
    <a href="../index.html" class="pr-home" title="Back to the gallery (G)">gallery</a>
    <span class="pr-set">${PROTOS.map(([dir, k, name]) => `<a href="../${dir}/${location.search}${location.hash}" class="${cfg.id === k.toLowerCase() ? 'is-here' : ''}" title="${name}">${k}</a>`).join('')}</span>
    <span class="pr-set">${[1, 2, 3, 4].map(n => `<button data-go="${n}" title="${WS[n]} (${n})">${WS[n]}</button>`).join('')}</span>
    <span class="pr-set"><button data-act="course" title="The course (C)">course</button><button data-act="launcher" title="Search (Alt+Enter)">search</button><button data-act="scene" title="Night or Ice (N)">night / ice</button></span>
  </nav>`);
}

/* ── start ────────────────────────────────────────────────────────────── */

export function boot(config) {
  cfg = config;
  root.dataset.proto = cfg.id;
  let saved = null;
  try { saved = sessionStorage.getItem('mimei-proto-scene'); } catch (e) { /* private mode */ }
  root.dataset.scene = Q.get('scene') === 'ice' || (!Q.get('scene') && saved === 'ice') ? 'ice' : 'night';
  if (SHOT) root.dataset.shot = '';
  readHash();

  const os = h(`<div id="os">
    <div id="wall" aria-hidden="true"></div>
    <main>
      <section id="ws1" class="ws desk" aria-label="Desk"></section>
      <section id="ws2" class="ws study" aria-label="Lessons"></section>
      <section id="ws3" class="ws cab" aria-label="Manual"></section>
      <section id="ws4" class="ws cab" aria-label="Settings"></section>
    </main>
    <div id="course" class="overlay" hidden></div>
    <div id="launcher" class="overlay" hidden></div>
    <div id="toast" role="status" hidden></div>
  </div>`);
  document.body.append(os);

  api = {
    UNITS, TOTALS, DEMO, LESSONS, LESSON, MAN, lessonById, unitOf, stateOf, reachedIn,
    $, $$, h, esc, rng, luau, on, t, SHOT, reduced,
    now, clock, tonight, week, sign,
    scene, setScene, toggleScene, go, overlay, drawer, openLesson,
    ws: () => S.ws, checkpoints: () => S.cps, deskParts,
    /** Lesson ids in course order, for a sign that flips with ← and →. */
    order: LESSONS.map(l => l.id),
    mark: { snow: '../../../assets/crane/mark-snow.webp', slate: '../../../assets/crane/mark-slate.webp' },
    el: { os, wall: $('#wall', os), ws1: $('#ws1', os) },
  };

  $('main', os).before(buildBar());
  buildStudy($('#ws2', os));
  const ws3 = $('#ws3', os);
  [buildMan(), buildTty(), buildFiles()].forEach(w => ws3.append(deco('window', w)));
  $('[data-live="progress"]', ws3).textContent = `${DEMO.lessonsDone} / ${TOTALS.lessons} stops · ${S.cps} / ${TOTALS.checkpoints} checkpoints`;
  on('checkpoint', () => { $('[data-live="progress"]', ws3).textContent = `${DEMO.lessonsDone} / ${TOTALS.lessons} stops · ${S.cps} / ${TOTALS.checkpoints} checkpoints`; });
  $('#ws4', os).append(deco('window', win('settings', 'Settings', '')));
  paintSettings();
  front('man');
  buildCourse($('#course', os));
  buildLauncher($('#launcher', os));
  if (!SHOT && !Q.has('bare')) os.append(buildSwitcher());

  if (cfg.wall) cfg.wall(api.el.wall, api);
  cfg.desk(api.el.ws1, api);

  document.addEventListener('keydown', keys);
  os.addEventListener('click', clicks);
  addEventListener('hashchange', () => { readHash(); sync(); emit('ws', S.ws); if (S.overlay === 'launcher') buildLauncher.open(); });
  setInterval(() => { paintBar(); emit('tick', clock()); }, 15000);

  sync();
  if (S.overlay === 'launcher') buildLauncher.open();
  emit('ws', S.ws);
  emit('scene', scene());
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(() => { window.__ready = true; root.dataset.ready = ''; }));
  window.mimeiProto = api;
  return api;
}
