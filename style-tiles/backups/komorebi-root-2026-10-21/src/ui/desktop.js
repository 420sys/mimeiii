/* ════════════════════════════════════════════════════════════════════════════
   LUAUOS · UI/DESKTOP
   Workspace 1: the desk. A slim glass bar, one quiet machine card, the course
   as a typographic index, the line, the journal, and a full-width progress
   pulse. No cover art, no second theme: the wallpaper is the picture, the
   panels are glass, and lavender only marks the live thing.

   Everything here is course or machine state; the notes below the fold are
   the only long copy.
   ════════════════════════════════════════════════════════════════════════════ */

import { GROUPS, HOME_STEPS, HOME_COLS, courseList, lessonById, writtenLessons } from '../data/course.js';
import {
  isDone, goalsOf, lessonProgress, progressSummary, state,
} from '../core/state.js';
import { RICE_BY_ID } from '../core/rice.js';
import { currentWall } from '../core/walls.js';
import { escAttr, meter, onPaint } from './window.js';
import { entries, onLog } from '../core/journal.js';
import { currentLessonId, openLesson } from './session.js';
import { openMan } from './man.js';
import { revealUnit } from './course.js';

let desk = null;
let clockTimer = 0;
let copy = { title: 'Learn Roblox Luau from nothing', paras: [] };

/* ── the words, from the course itself ────────────────────────────────────── */
function readHomeCopy() {
  const src = document.getElementById('md-home');
  if (!src) return copy;
  const blocks = src.textContent.split(/\n\s*\n/).map(b => b.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  const titleBlock = blocks.find(b => b.startsWith('# '));
  if (titleBlock) copy.title = titleBlock.slice(2).trim();
  copy.paras = blocks.filter(b => !b.startsWith('#') && !b.startsWith('>') && !b.startsWith('- ')).slice(0, 2);
  return copy;
}

const nextStop = () => writtenLessons().find(l => !isDone(l.id)) || writtenLessons()[0];

const writtenFor = gid => writtenLessons().filter(l => l.g === gid);

function unitGroups() {
  const written = writtenLessons();
  return GROUPS.filter(g => written.some(l => l.g === g.id));
}

function unitNo(gid) {
  const i = GROUPS.findIndex(g => g.id === gid);
  return i < 0 ? '--' : String(i + 1).padStart(2, '0');
}

function currentUnitId() {
  const n = nextStop();
  if (n && n.g) return n.g;
  const groups = unitGroups();
  return groups.length ? groups[groups.length - 1].id : null;
}

function firstSentence(s) {
  const text = String(s || '').trim();
  if (!text) return 'a quiet deck for the night line.';
  const m = text.match(/^.*?[.!?](?:\s|$)/);
  return (m ? m[0] : text).trim();
}

/** The first real paragraph of a stop, pulled from the markdown already in the
    page. Used as the one line of editorial in the course feature. */
function lessonLede(id) {
  const l = lessonById(id);
  const el = l && l.md ? document.getElementById(l.md) : null;
  if (!el) return '';
  const blocks = el.textContent.split(/\n\s*\n/).map(b => b.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  const para = blocks.find(b => !/^[#>`|]/.test(b) && !/^- /.test(b) && !/^\d+\. /.test(b));
  if (!para) return '';
  const plain = para
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return plain.length > 260 ? plain.slice(0, 257).replace(/\s+\S*$/, '') + '…' : plain;
}

/* ── widgets ──────────────────────────────────────────────────────────────── */
function heroMarkup() {
  return `
    <section class="dek-hero" aria-labelledby="dek-title">
      <div class="hero-l">
        <div class="hero-kicker"><span class="hero-word">luauOS</span><span class="hero-slash">/</span><span>komorebi</span></div>
        <h1 class="hero-title" id="dek-title"></h1>
        <div class="hero-under">
          <span class="hero-sub" id="dek-lede"></span>
          <button class="hero-notes" id="dek-notes" type="button">notes <span aria-hidden="true">↓</span></button>
        </div>
      </div>
      <div class="hero-clock">
        <div class="hero-time" id="dek-time">--:--</div>
      </div>
      <div class="hero-stats" aria-label="Course at a glance">
        <div class="hstat" title="stops finished of written stops"><b id="dek-stat-done">--</b><span>done</span></div>
        <div class="hstat" title="days in a row with the desk open"><b id="dek-stat-streak">--</b><span>streak</span></div>
      </div>
    </section>`;
}

function notesMarkup() {
  return `
    <section class="dek-notes" aria-label="Notes">
      <div class="panel p-how">
        <header class="panel-h"><span class="lbl">how a session works</span><span class="meta">${HOME_STEPS.length} steps</span></header>
        <ol class="steps">${HOME_STEPS.map(([h, p]) => `<li><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol>
        <p class="tip">Keep this deck and Roblox Studio open side by side.</p>
      </div>
      <div class="panel p-about">
        <header class="panel-h"><span class="lbl">before you start</span><span class="meta">notes</span></header>
        <div class="cols">${HOME_COLS.map(([h, paras]) =>
          `<div><h3>${h}</h3>${paras.map(p => `<p>${p}</p>`).join('')}</div>`).join('')}</div>
      </div>
    </section>`;
}

function mainMarkup() {
  return `
    <div class="dek-main">
      <div class="dek-col dek-left">
        <section class="panel p-desk" aria-labelledby="dek-desk-lbl">
          <header class="panel-h">
            <span class="lbl" id="dek-desk-lbl">desk</span>
            <span class="meta"><i class="live"></i> running</span>
          </header>
          <div class="desk-body">
            <section class="desk-sec" aria-labelledby="dek-sys-lbl">
              <div class="desk-sec-h"><span class="desk-kicker" id="dek-sys-lbl">machine</span></div>
              <dl class="sys-list" id="dek-sys"></dl>
            </section>
            <div class="desk-rule" aria-hidden="true"></div>
            <section class="desk-sec" aria-labelledby="dek-streak-lbl">
              <div class="desk-sec-h"><span class="desk-kicker" id="dek-streak-lbl">streak</span><span class="meta">last seven days</span></div>
              <div class="streak-body" id="dek-streak"></div>
            </section>
            <section class="desk-sec desk-last" aria-labelledby="dek-last-lbl">
              <div class="desk-sec-h"><span class="desk-kicker" id="dek-last-lbl">last session</span></div>
              <p class="last-line none" id="dek-last">none yet</p>
            </section>
          </div>
        </section>
      </div>

      <div class="dek-col dek-center">
        <section class="panel p-course" aria-labelledby="dek-course-lbl">
          <header class="panel-h">
            <span class="lbl" id="dek-course-lbl">the course</span>
            <span class="meta" id="dek-course-meta"></span>
          </header>
          <div class="course-now" id="dek-now"></div>
          <div class="course-rule" aria-hidden="true"></div>
          <div class="course-units" id="dek-units"></div>
        </section>
      </div>

      <div class="dek-col dek-right">
        <section class="panel p-route" aria-labelledby="dek-route-lbl">
          <header class="panel-h"><span class="lbl" id="dek-route-lbl">the line</span></header>
          <ol class="route" id="dek-route"></ol>
        </section>

        <section class="panel p-activity" aria-labelledby="dek-log-lbl">
          <header class="panel-h"><span class="lbl" id="dek-log-lbl">activity</span><span class="meta">journal</span></header>
          <div class="jfeed" id="dek-log"><p class="quiet">the journal is quiet.</p></div>
          <div class="jprompt" aria-hidden="true"><span>luauos@desk</span><b>:~$</b> tail -f /var/log/luauos.log</div>
        </section>
      </div>

      <section class="panel p-progress" aria-labelledby="dek-chart-lbl">
        <header class="panel-h">
          <span class="lbl" id="dek-chart-lbl">progress</span>
        </header>
        <div class="chart" id="dek-chart"></div>
      </section>
    </div>`;
}

/* ── clock ────────────────────────────────────────────────────────────────── */
function paintClock() {
  if (!desk) return;
  const time = desk.querySelector('#dek-time');
  if (!time) return;
  const d = new Date();
  time.textContent = d.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

/* no seconds: wake at the next minute, not every second */
function scheduleClock() {
  paintClock();
  clearTimeout(clockTimer);
  const now = new Date();
  clockTimer = setTimeout(scheduleClock, (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 40);
}

/* ── the two numbers in the hero ──────────────────────────────────────────── */
function paintHeroStats() {
  const sum = progressSummary();
  const set = (id, value) => {
    const el = desk && desk.querySelector(id);
    if (el) el.textContent = String(value);
  };
  set('#dek-stat-done', `${sum.done}/${sum.total}`);
  set('#dek-stat-streak', sum.streak);
}

/* ── the feature: the stop you would sit down at ──────────────────────────── */
function paintNow() {
  const host = desk && desk.querySelector('#dek-now');
  if (!host) return;
  const openId = currentLessonId();
  const open = openId ? lessonById(openId) : null;
  const l = (open && !open.soon) ? open : nextStop();
  if (!l) { host.innerHTML = '<p class="quiet">The whole line is finished.</p>'; return; }

  const p = lessonProgress(l.id);
  const g = GROUPS.find(x => x.id === l.g);
  const started = progressSummary().done > 0;
  const done = isDone(l.id);
  const isOpen = openId === l.id;
  const no = g ? unitNo(g.id) : '--';
  const verb = done ? 'Review' : isOpen ? 'Continue' : 'Start';

  host.innerHTML = `
    <p class="now-kicker" id="dek-stopline">
      <span class="k">${started ? 'next stop' : 'first stop'}</span>
      <span class="now-slash">/</span>
      <span class="now-go">${l.mins ? `~${l.mins} min` : 'a short stop'}</span>
      ${done ? '<span class="now-fin">done</span>' : ''}
    </p>
    <div class="now-body">
      <div class="now-copy">
        <p class="now-unit">${g ? g.label.toLowerCase() : 'the line'} <span aria-hidden="true">·</span> unit ${no}</p>
        <h2 class="now-title">${l.title}</h2>
        <p class="now-meta">${p.have}/${p.total} checkpoints <span aria-hidden="true">·</span> ${Math.round(p.ratio * 100)}%</p>
        <p class="now-lede">${escAttr(lessonLede(l.id))}</p>
      </div>
      <div class="now-side">
        <div class="now-num" aria-hidden="true">${l.n}</div>
        <button class="btn primary now-go-btn" id="dek-go">${verb} ${l.n}<span aria-hidden="true">→</span></button>
        <button class="now-man" id="dek-ref" type="button" title="Open the manual for this stop">manual</button>
      </div>
    </div>
    <div class="now-meter">${meter(p.ratio)}</div>`;

  const go = host.querySelector('#dek-go');
  if (go) go.onclick = () => openLesson(l.id);
  const ref = host.querySelector('#dek-ref');
  if (ref) ref.onclick = () => openMan(l.id);
}

/* ── machine: four quiet facts, not six little wells ──────────────────────── */
function paintSystem() {
  const host = desk && desk.querySelector('#dek-sys');
  if (!host) return;
  const rice = RICE_BY_ID[state.rice] || { name: 'komorebi' };
  const wall = currentWall();
  const rows = [
    ['os', 'luauOS 1.0'],
    ['wm', 'luauwm'],
    ['look', rice.name],
    ['wall', wall ? wall.label.toLowerCase() : 'sakura'],
  ];
  host.innerHTML = rows.map(([k, v]) => `
    <div class="sys-row">
      <dt>${k}</dt>
      <dd>${escAttr(v)}</dd>
    </div>`).join('');

}

/* ── where you left off: the last stop opened ────────────────────────────── */
function paintLast() {
  const host = desk && desk.querySelector('#dek-last');
  if (!host) return;
  const l = lessonById(state.last);
  const real = state.last !== 'home' && l && !l.soon && l.kind !== 'tool';
  host.textContent = real ? `${l.n} ${l.title}` : 'none yet';
  host.classList.toggle('none', !real);
  host.title = real ? `${l.n} ${l.title}` : '';
}

/* ── the course, as a typographic index — no cover art ────────────────────── */
function paintUnits() {
  const host = desk && desk.querySelector('#dek-units');
  if (!host) return;
  const groups = unitGroups();
  const current = currentUnitId();
  const sum = progressSummary();

  const meta = desk.querySelector('#dek-course-meta');
  if (meta) meta.textContent = `${groups.length} units · ${sum.total} stops`;

  host.innerHTML = groups.map(g => {
    const stops = writtenFor(g.id);
    const done = stops.filter(l => isDone(l.id)).length;
    const total = stops.length;
    const ratio = total ? done / total : 0;
    const here = g.id === current;
    const complete = total > 0 && done === total;
    return `<button class="cu${here ? ' here' : ''}${complete ? ' complete' : ''}"
        type="button" data-unit="${g.id}"${here ? ' aria-current="true"' : ''}
        title="${escAttr(`${g.label} — ${done} of ${total} stops`)}">
      <span class="cu-no">${unitNo(g.id)}</span>
      <span class="cu-title">${g.label}${here ? '<span class="sr-only">, you are here</span>' : ''}</span>
      <span class="cu-count">${done}<span>/${total}</span></span>
    </button>`;
  }).join('');

  host.querySelectorAll('.cu').forEach(b => {
    b.onclick = () => revealUnit(b.dataset.unit);
  });
}

/* ── streak: a big real number and seven small marks ──────────────────────── */
function paintStreak() {
  const host = desk && desk.querySelector('#dek-streak');
  if (!host) return;
  const sum = progressSummary();
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      on: state.days.includes(key),
      today: i === 0,
      label: d.toLocaleDateString('en-GB', { weekday: 'narrow', timeZone: 'UTC' }),
    });
  }
  host.innerHTML = `
    <div class="streak-main"><b>${sum.streak}</b><span>${sum.streak === 1 ? 'day' : 'days'}</span></div>
    <div class="week" aria-label="The last seven days">
      ${days.map(d => `<span class="wd${d.on ? ' on' : ''}${d.today ? ' now' : ''}" title="${d.key}${d.on ? ' — desk open' : ''}">
        <i aria-hidden="true"></i><em>${d.label}</em>
      </span>`).join('')}
    </div>`;
}

/* ── progress as one pulse: a tick per real stop, grouped by unit ─────────── */
function paintChart() {
  const host = desk && desk.querySelector('#dek-chart');
  if (!host) return;
  const groups = unitGroups();
  const current = currentUnitId();
  const next = nextStop();

  host.innerHTML = groups.map(g => {
    const stops = writtenFor(g.id);
    const done = stops.filter(l => isDone(l.id)).length;
    const here = g.id === current;
    const ticks = stops.map(l => {
      const hit = isDone(l.id);
      const nxt = !hit && next && l.id === next.id;
      return `<i class="tick${hit ? ' done' : ''}${nxt ? ' next' : ''}"
        title="${escAttr(`${l.n} ${l.title} — ${hit ? 'done' : nxt ? 'next' : 'not yet'}`)}"></i>`;
    }).join('');
    return `<div class="chart-col${here ? ' here' : ''}" role="group" style="--n:${stops.length}"
        aria-label="Unit ${unitNo(g.id)} ${escAttr(g.label)} — ${done} of ${stops.length} stops done">
      <div class="pulse" aria-hidden="true">${ticks}</div>
      <span>${unitNo(g.id)}</span>
    </div>`;
  }).join('');
}

/* ── the line, as a departures board ──────────────────────────────────────── */
function paintLine() {
  const ol = desk && desk.querySelector('#dek-route');
  if (!ol) return;
  const next = nextStop();
  const started = progressSummary().done > 0;
  let lastG = null;
  ol.innerHTML = '';
  courseList().forEach(l => {
    if (l.g !== lastG) {
      lastG = l.g;
      const sec = document.createElement('li');
      sec.className = 'sec';
      sec.textContent = (GROUPS.find(g => g.id === l.g) || {}).label || 'the line';
      ol.appendChild(sec);
    }
    const done = isDone(l.id);
    const doing = !done && goalsOf(l.id).length > 0;
    const isNext = !l.soon && !done && next && l.id === next.id;
    const st = l.soon ? 'soon' : done ? 'done' : isNext ? 'next' : doing ? 'doing' : l.kind === 'tool' ? 'tool' : 'open';
    const label = { soon: 'being built', done: 'done', next: started ? 'next stop' : 'start here', doing: 'started', tool: 'reference', open: '' }[st];
    const li = document.createElement('li');
    li.innerHTML = `<button class="rt ${st}" type="button"${l.soon ? ' disabled' : ''}${isNext ? ' aria-current="true"' : ''}>
        <span class="dot" aria-hidden="true"></span>
        <span class="n">${l.kind === 'tool' ? 'ref' : l.n}</span>
        <span class="t">${l.title}${label ? `<span class="sr-only"> — ${label}</span>` : ''}</span>
      </button>`;
    const b = li.querySelector('button');
    if (!l.soon) b.onclick = () => (l.kind === 'tool' ? openMan(l.id) : openLesson(l.id));
    ol.appendChild(li);
  });
}

/* ── journal ──────────────────────────────────────────────────────────────── */
/** The one honest line the feed says before anything has been finished. */
function firstRunRow() {
  const l = nextStop();
  const row = document.createElement('div');
  row.className = 'jrow dim hint';
  const t = document.createElement('span');
  t.className = 't';
  t.textContent = '--:--';
  const m = document.createElement('span');
  m.className = 'm';
  m.textContent = l ? `nothing done yet · start ${l.n} ${l.title}` : 'nothing done yet';
  row.append(t, m);
  return row;
}

function paintLog() {
  const host = desk && desk.querySelector('#dek-log');
  if (!host) return;
  const rows = entries().slice(-7);
  const fresh = !currentLessonId() && progressSummary().done === 0;
  host.innerHTML = '';
  for (const r of rows) {
    const row = document.createElement('div');
    row.className = `jrow ${r.kind}`;
    const t = document.createElement('span');
    t.className = 't';
    t.textContent = r.t.slice(0, 5);
    const m = document.createElement('span');
    m.className = 'm';
    m.textContent = r.text.replace(/^\[[^\]]*\]\s*/, '');
    row.append(t, m);
    host.appendChild(row);
  }
  if (fresh) host.appendChild(firstRunRow());
}

function paintDesktop() {
  paintClock();
  paintHeroStats();
  paintNow();
  paintSystem();
  paintUnits();
  paintStreak();
  paintLast();
  paintChart();
  paintLine();
  paintLog();
}

export function mountDesktop(el) {
  desk = el;
  readHomeCopy();
  desk.innerHTML = `<div class="dek-dash">${heroMarkup()}${mainMarkup()}</div>${notesMarkup()}`;

  const h1 = desk.querySelector('#dek-title');
  if (h1) h1.textContent = copy.title;
  const lede = desk.querySelector('#dek-lede');
  if (lede) lede.textContent = firstSentence(copy.paras[0]);

  const notesBtn = desk.querySelector('#dek-notes');
  if (notesBtn) notesBtn.onclick = () => {
    const notes = desk.querySelector('.dek-notes');
    if (notes) notes.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  paintDesktop();
  onPaint(paintDesktop);
  onLog(() => paintLog());
  addEventListener('resize', paintDesktop);
  scheduleClock();
  return desk;
}

/* Kept as a no-op for older tools; there is no LED board to hold. */
export function stillDeck() {}
