/* ════════════════════════════════════════════════════════════════════════════
   LUAUOS · UI/DESKTOP
   Workspace 1: the Noctalia desk. The picture stays outside; the desk is a
   single editorial frame over it — the stop you would sit down at, today's
   real activity, the whole course as one line, and the machine's own readouts.
   Every value is read from the course, the browser or the session.
   ════════════════════════════════════════════════════════════════════════════ */

import { GOALS, GROUPS, lessonById, writtenLessons } from '../data/course.js';
import { goalsOf, isDone, lessonProgress, levelOf, progressSummary, state } from '../core/state.js';
import { currentWall } from '../core/walls.js';
import { escAttr, onPaint } from './window.js';
import { onLog } from '../core/journal.js';
import { currentLessonId, openLesson } from './session.js';
import { openMan } from './man.js';
import { revealUnit } from './course.js';
import { activeWs, onWM, openWindow } from '../core/wm.js';

let desk = null;
let clockTimer = 0;

const q = id => desk && desk.querySelector(id);
const nextStop = () => writtenLessons().find(l => !isDone(l.id)) || writtenLessons()[0];

function unitNo(gid) {
  const i = GROUPS.findIndex(g => g.id === gid);
  return i < 0 ? '--' : String(i + 1).padStart(2, '0');
}

function plain(s) {
  return String(s || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstSentence(s) {
  const text = String(s || '').trim();
  if (!text) return 'a quiet desk for the night line.';
  const m = text.match(/^.*?[.!?](?:\s|$)/);
  return (m ? m[0] : text).trim();
}

/** The first real paragraph of a stop, pulled from the markdown already in
    the page. Kept short: it is a preview, not the lesson. */
function lessonLede(id, max = 150) {
  const l = lessonById(id);
  const el = l && l.md ? document.getElementById(l.md) : null;
  if (!el) return '';
  const blocks = el.textContent.split(/\n\s*\n/).map(b => b.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
  const para = blocks.find(b => !/^[#>`|]/.test(b) && !/^- /.test(b) && !/^\d+\. /.test(b));
  if (!para) return '';
  const clean = plain(para);
  return clean.length > max ? clean.slice(0, max - 3).replace(/\s+\S*$/, '') + '…' : clean;
}

/** Two lines, balanced at the middle of the real lesson title. */
function heroTitle(title) {
  const clean = String(title || 'the next stop').replace(/[.]+$/, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return `<em>${escAttr(clean)}.</em>`;
  const mid = Math.ceil(parts.length / 2);
  const head = parts.slice(0, mid).join(' ');
  const tail = parts.slice(mid).join(' ');
  return `${escAttr(head)}<br><em>${escAttr(tail)}.</em>`;
}

/** The section headings of a stop, and the first task bullet under each one.
    This is the real lesson copy, parsed once per paint; no invented outline. */
function parseSections(id) {
  const l = lessonById(id);
  const host = l && l.md ? document.getElementById(l.md) : null;
  if (!host) return { sections: [], code: '', output: '' };

  const lines = host.textContent.replace(/\r/g, '').split('\n');
  const sections = [];
  let section = null;
  let inFence = false;
  let fence = '';
  let code = '';
  let output = '';

  for (const raw of lines) {
    const line = raw.trim();
    if (/^```/.test(line)) {
      if (!inFence) {
        inFence = true;
        fence = line.slice(3).trim();
      } else {
        inFence = false;
        fence = '';
      }
      continue;
    }

    if (inFence) {
      if (!code && /^lua\b/i.test(fence)) code = line;
      if (!output && /^output\b/i.test(fence)) output = line;
      if (section && !section.taskBullet && /^task=/.test(fence) && /^-\s+/.test(line)) {
        section.taskBullet = line.replace(/^-\s+/, '');
      }
      continue;
    }

    if (/^##\s+/.test(line)) {
      section = { title: line.replace(/^##\s+/, '').trim(), bullet: '', taskBullet: '' };
      sections.push(section);
      continue;
    }

    if (section && !section.bullet && /^-\s+/.test(line)) {
      section.bullet = line.replace(/^-\s+/, '');
    }
  }

  return { sections, code, output };
}

function shortSectionTitle(text) {
  const clean = plain(text)
    .replace(/^(the|your|a|an)\s+/i, '')
    .replace(/\s+(you need|you want)$/i, '')
    .trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'this section';
}

const FIRST_STOP_DESCRIPTORS = ['install · sign in', 'explorer · output', 'print · play', 'edit · see it'];

function lessonOutline(l) {
  const { sections, code, output } = parseSections(l.id);
  const goals = GOALS[l.id] || [];
  const items = sections.slice(0, 4).map((s, i) => {
    const fallback = s.taskBullet || s.bullet || (goals[i] && goals[i].t) || 'read · run';
    const descriptor = l.id === '1.0' && FIRST_STOP_DESCRIPTORS[i]
      ? FIRST_STOP_DESCRIPTORS[i]
      : plain(fallback).slice(0, 42);
    return { title: shortSectionTitle(s.title), desc: descriptor };
  });

  if (!items.length) {
    goals.slice(0, 4).forEach(g => {
      items.push({ title: plain(g.t), desc: g.xp ? `${g.xp} xp` : 'checkpoint' });
    });
  }

  const p = lessonProgress(l.id);
  const codeLine = plain(code).slice(0, 46);
  const outLine = plain(output).replace(/\s+-\s+/g, ' · ').slice(0, 62);

  return {
    items,
    code: codeLine,
    output: outLine,
    foot: `${p.total} checkpoint${p.total === 1 ? '' : 's'} · ${l.mins ? `~${l.mins} min` : 'a short stop'}`,
  };
}

/* ── the shell ────────────────────────────────────────────────────────────── */
function shellMarkup() {
  return `
    <div class="nx-desk">
      <div class="nx-ambient" aria-hidden="true"></div>

      <article class="nx-now" aria-labelledby="nx-now-h">
        <header class="nx-card-h">
          <span id="nx-now-h">now</span>
          <span id="nx-now-count">-- / --</span>
        </header>
        <p class="nx-kicker" id="dek-stopline"><span class="k">first stop</span><span class="nx-slash">/</span><span class="now-go"></span></p>
        <p class="nx-unit" id="nx-now-unit"></p>
        <h2 class="nx-now-title now-title" id="nx-now-title"></h2>
        <p class="nx-now-meta now-meta" id="nx-now-meta"></p>
        <p class="nx-now-lede now-lede" id="nx-now-lede"></p>
        <div class="nx-now-meter" id="nx-now-meter"></div>
        <div class="nx-actions">
          <button class="nx-btn primary" id="dek-go" type="button"></button>
          <button class="nx-btn ghost" id="dek-ref" type="button" title="Open the manual for this stop">manual</button>
        </div>
        <div class="nx-now-outline" id="nx-now-outline"></div>
      </article>

      <section class="study-today" aria-label="Today and the last seven days">
        <header class="nx-card-h"><span>today</span><span class="nx-live"><i aria-hidden="true"></i>live</span></header>
        <div class="td-top">
          <div class="td-date"><b id="td-day">--</b><span id="td-wd">---<br>---</span></div>
          <div class="td-stats">
            <div><span>streak</span><b id="td-streak">--</b></div>
            <div><span>rank</span><b id="td-rank">--</b></div>
            <div><span>finished</span><b id="td-finished">-- / --</b></div>
            <div><span>xp</span><b id="td-xp">--</b></div>
          </div>
        </div>
        <div class="td-cal">
          <div class="td-cal-head"><span id="td-month">----</span><b id="td-activity">quiet month</b></div>
          <div class="td-cal-grid" id="td-cal"></div>
        </div>
        <div class="td-weekline">
          <span>this week</span>
          <div class="td-weekline-bars" id="td-week"></div>
          <b id="td-week-count">-- / 7</b>
        </div>
        <div class="td-note"><span>last</span><b id="td-last">no session yet</b></div>
        <p class="td-quote">one session <em>at a time.</em></p>
      </section>

      <section class="study-path-wide" aria-label="Course path">
        <div class="sp-head"><span>the course</span><b id="sp-count">-- units · -- / --</b></div>
        <div class="sp-sub">the first page is waiting · one line through the language</div>
        <div class="sp-map" id="sp-map"></div>
        <div class="sp-foot"><span id="sp-next">next</span><b id="sp-next-title"></b><span id="sp-next-meta"></span></div>
      </section>

      <section class="nx-widgets" aria-label="Desktop widgets">
        <article class="nx-card nx-system" aria-labelledby="nx-sys-h">
          <header class="nx-card-h">
            <span id="nx-sys-h">system</span>
            <span class="nx-live"><i aria-hidden="true"></i>live</span>
          </header>
          <div class="nx-clock">
            <b id="dek-time">--:--</b>
            <span id="nx-date">----</span>
          </div>
          <dl class="nx-sys-rows">
            <div><dt>os</dt><dd>luauOS 1.0</dd></div>
            <div><dt>shell</dt><dd>noctalia</dd></div>
            <div><dt>threads</dt><dd id="nx-threads">--</dd></div>
            <div><dt>memory</dt><dd id="nx-memory">--</dd></div>
            <div><dt>display</dt><dd id="nx-display">----</dd></div>
            <div><dt>wall</dt><dd id="nx-wall">----</dd></div>
            <div><dt>network</dt><dd id="nx-network"><i class="nx-dot" aria-hidden="true"></i><span>online</span></dd></div>
          </dl>
        </article>

        <article class="nx-card nx-course" aria-labelledby="nx-course-h">
          <header class="nx-card-h">
            <span id="nx-course-h">course</span>
            <button class="nx-card-link" id="nx-open-course" type="button">index →</button>
          </header>
          <div class="nx-course-main">
            <div class="nx-ring" aria-hidden="true">
              <svg viewBox="0 0 60 60">
                <circle class="nx-ring-bg" cx="30" cy="30" r="25"></circle>
                <circle class="nx-ring-fg" id="nx-ring-fg" cx="30" cy="30" r="25"></circle>
              </svg>
              <b id="nx-pct">0%</b>
            </div>
            <div class="nx-course-copy">
              <span>stops finished</span>
              <b id="nx-done">0 / 0</b>
              <em id="nx-rank">init</em>
            </div>
          </div>
          <div class="nx-week" id="nx-week" aria-label="The last seven days"></div>
          <div class="nx-course-foot">
            <span id="nx-last">the journal is quiet.</span>
            <button class="nx-card-link" id="nx-open-progress" type="button">progress →</button>
          </div>
        </article>

        <article class="nx-card nx-queue" aria-label="Up next">
          <header class="nx-card-h"><span>queue</span><span>up next</span></header>
          <div class="nq-list" id="nq-list"></div>
          <div class="nq-foot">
            <span id="nq-count">-- / -- stops</span>
            <button class="nx-card-link" id="nq-index" type="button">course index →</button>
          </div>
        </article>
      </section>

      <footer class="nx-foot" aria-hidden="true">
        <span id="nx-foot-display">wayland · 1440 × 900</span>
        <span class="nx-sep">/</span>
        <span id="nx-foot-ws">workspace 1 / desk</span>
        <span class="grow"></span>
        <span><kbd>super</kbd> <span class="nx-sep">/</span> launcher</span>
        <span class="nx-sep">·</span>
        <span>luauOS 1.0</span>
      </footer>
    </div>`;
}

/* ── clock ────────────────────────────────────────────────────────────────── */
function paintClock() {
  const time = q('#dek-time');
  if (!time) return;
  const d = new Date();
  time.textContent = d.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const date = q('#nx-date');
  if (date) date.textContent = d.toLocaleDateString('en-GB', {
    weekday: 'short', day: '2-digit', month: 'short',
  }).toLowerCase().replace(',', '');
}

function scheduleClock() {
  paintClock();
  clearTimeout(clockTimer);
  const now = new Date();
  clockTimer = setTimeout(scheduleClock, (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 40);
}

/* ── the stop you would sit down at ───────────────────────────────────────── */
function paintOutline(l) {
  const host = q('#nx-now-outline');
  const card = q('.nx-now');
  if (!host) return;

  const o = lessonOutline(l);
  card.classList.toggle('no-outline', !o.items.length);
  if (!o.items.length) {
    host.innerHTML = '';
    host.hidden = true;
    return;
  }
  host.hidden = false;

  host.innerHTML = `
    <p class="no-label">inside this stop</p>
    <ol class="no-list">
      ${o.items.map((s, i) => `
        <li class="no-item">
          <span class="no-n">${String(i + 1).padStart(2, '0')}</span>
          <span>
            <span class="no-t">${escAttr(s.title)}</span>
            <span class="no-d">${escAttr(s.desc)}</span>
          </span>
        </li>`).join('')}
    </ol>
    ${o.code ? `<p class="no-code">&gt; <b>${escAttr(o.code)}</b>${o.output ? `<br><span>${escAttr(o.output)}</span>` : ''}</p>` : ''}
    <p class="no-foot">${escAttr(o.foot)}</p>`;
}

function paintNow() {
  const host = q('#nx-now-title');
  if (!host) return;

  const openId = currentLessonId();
  const open = openId ? lessonById(openId) : null;
  const l = (open && !open.soon) ? open : nextStop();
  if (!l) {
    host.textContent = 'The course is loading.';
    return;
  }

  const written = writtenLessons();
  const index = written.findIndex(x => x.id === l.id) + 1;
  const p = lessonProgress(l.id);
  const g = GROUPS.find(x => x.id === l.g);
  const started = progressSummary().done > 0 || goalsOf(l.id).length > 0;
  const done = isDone(l.id);
  const isOpen = openId === l.id;
  const verb = done ? 'Review' : isOpen || started ? 'Continue' : 'Start';
  const cleanTitle = String(l.title || 'the next stop').replace(/[.]+$/, '').trim();

  host.classList.toggle('long', cleanTitle.length > 24);
  host.innerHTML = heroTitle(cleanTitle);

  const kicker = q('#dek-stopline');
  if (kicker) {
    const k = kicker.querySelector('.k');
    const go = kicker.querySelector('.now-go');
    if (k) k.textContent = started ? 'next stop' : 'first stop';
    if (go) go.textContent = l.mins ? `~${l.mins} min` : 'a short stop';
  }

  const count = q('#nx-now-count');
  if (count) count.textContent = `${index || '--'} / ${written.length}`;

  const unit = q('#nx-now-unit');
  if (unit) unit.textContent = `${g ? g.label.toLowerCase() : 'the line'} · unit ${g ? unitNo(g.id) : '--'}`;

  const meta = q('#nx-now-meta');
  if (meta) meta.textContent = `${p.have}/${p.total} checkpoints · ${Math.round(p.ratio * 100)}%`;

  const lede = q('#nx-now-lede');
  if (lede) lede.textContent = firstSentence(lessonLede(l.id));

  const meter = q('#nx-now-meter');
  if (meter) meter.innerHTML = `<i style="width:${Math.round(p.ratio * 100)}%"></i>`;

  const go = q('#dek-go');
  if (go) {
    go.textContent = `${verb} ${l.n} →`;
    go.onclick = () => openLesson(l.id);
  }

  const ref = q('#dek-ref');
  if (ref) ref.onclick = () => openMan(l.id);

  paintOutline(l);
}

/* ── today: the real month, the real streak, the real last session ─────────── */
function paintToday() {
  const now = new Date();
  const sum = progressSummary();
  const rank = levelOf(sum.xp).name;

  const day = q('#td-day');
  if (day) day.textContent = String(now.getDate()).padStart(2, '0');
  const wd = q('#td-wd');
  if (wd) wd.innerHTML = `${now.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}<br>${now.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()}`;

  const streak = q('#td-streak');
  if (streak) streak.textContent = `${sum.streak} day${sum.streak === 1 ? '' : 's'}`;
  const rankEl = q('#td-rank');
  if (rankEl) rankEl.textContent = rank;
  const finished = q('#td-finished');
  if (finished) finished.textContent = `${sum.done} / ${sum.total}`;
  const xp = q('#td-xp');
  if (xp) xp.textContent = String(sum.xp);

  const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push({ blank: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = monthKey(new Date(now.getFullYear(), now.getMonth(), d));
    cells.push({
      d, key,
      on: state.days.includes(key),
      past: d < now.getDate(),
      today: d === now.getDate(),
    });
  }
  while (cells.length % 7) cells.push({ blank: true });

  const monthOn = cells.filter(c => c.on).length;
  const month = q('#td-month');
  if (month) month.textContent = `${now.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()} ${now.getFullYear()}`;
  const activity = q('#td-activity');
  if (activity) activity.textContent = monthOn ? 'activity' : 'quiet month';

  const cal = q('#td-cal');
  if (cal) {
    cal.innerHTML = `
      <span class="wd">M</span><span class="wd">T</span><span class="wd">W</span><span class="wd">T</span><span class="wd">F</span><span class="wd">S</span><span class="wd">S</span>
      ${cells.map(c => c.blank
        ? '<span class="d blank"></span>'
        : `<span class="d${c.on ? ' on' : ''}${c.past ? ' past' : ''}${c.today ? ' today' : ''}" title="${c.key}">${c.d}</span>`).join('')}`;
  }

  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = monthKey(d);
    week.push({ key, on: state.days.includes(key) });
  }
  const bars = q('#td-week');
  if (bars) bars.innerHTML = week.map(d => `<i class="td-weekline-bar${d.on ? ' on' : ''}" title="${d.key}"></i>`).join('');
  const weekCount = q('#td-week-count');
  if (weekCount) weekCount.textContent = `${week.filter(d => d.on).length} / 7`;

  const last = lessonById(state.last);
  const real = state.last !== 'home' && last && !last.soon && last.kind !== 'tool';
  const lastEl = q('#td-last');
  if (lastEl) {
    lastEl.textContent = real ? `${last.n} ${last.title}` : 'no session yet';
    lastEl.title = real ? `${last.n} ${last.title}` : 'The desk has not opened a session yet.';
  }
}

/* ── the course: one solid route through twelve real units ────────────────── */
function paintPath() {
  const lessons = writtenLessons();
  const sum = progressSummary();
  const rows = GROUPS.map((g, i) => {
    const ls = lessons.filter(l => l.g === g.id);
    return {
      label: g.label,
      total: ls.length,
      done: ls.filter(l => isDone(l.id)).length,
      here: false,
      index: i,
    };
  });

  const openId = currentLessonId();
  const open = openId ? lessonById(openId) : null;
  const focus = (open && !open.soon) ? open : nextStop();
  const hereGroup = focus ? GROUPS.findIndex(g => g.id === focus.g) : 0;
  rows.forEach(r => { r.here = r.index === hereGroup; });

  const count = q('#sp-count');
  if (count) count.textContent = `${GROUPS.length} units · ${sum.done} / ${sum.total}`;

  const cols = ['10.04%', '36.47%', '62.90%', '89.32%'];
  const yRows = [46, 151, 256];
  const routeOrder = [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11];
  const nodes = routeOrder.map((unitIndex, i) => ({
    ...rows[unitIndex],
    gid: GROUPS[unitIndex].id,
    x: cols[i % 4],
    y: yRows[Math.floor(i / 4)],
    n: unitIndex + 1,
  }));

  const map = q('#sp-map');
  if (map) {
    map.innerHTML = `
      <span class="sp-start">start</span>
      <svg class="sp-route-svg" viewBox="0 0 946 300" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="sp-route-gradient" gradientUnits="userSpaceOnUse" x1="95" y1="46" x2="845" y2="256">
            <stop offset="0" stop-color="rgba(142,216,255,.60)"></stop>
            <stop offset=".30" stop-color="rgba(142,216,255,.48)"></stop>
            <stop offset=".64" stop-color="rgba(142,216,255,.40)"></stop>
            <stop offset="1" stop-color="rgba(142,216,255,.32)"></stop>
          </linearGradient>
        </defs>
        <path class="sp-route" d="M 95 46 H 845 Q 875 46 875 76 V 121 Q 875 151 845 151 H 95 Q 65 151 65 181 V 226 Q 65 256 95 256 H 845"></path>
        <path class="sp-flow" d="M 466 41 l 6 5 l -6 5"></path>
        <path class="sp-flow" d="M 474 146 l -6 5 l 6 5"></path>
        <path class="sp-flow" d="M 466 251 l 6 5 l -6 5"></path>
      </svg>
      ${nodes.map(d => `
        <button type="button" class="sp-node${d.here ? ' here' : ''}${d.done === d.total && d.total ? ' done' : ''}" data-gid="${escAttr(d.gid)}" style="left:${d.x};top:${d.y - 13}px" title="${escAttr(d.label)} — ${d.done}/${d.total} checkpoints">
          <span class="sp-dot">${String(d.n).padStart(2, '0')}</span>
          <span class="sp-name">${escAttr(d.label)}</span>
        </button>`).join('')}`;

    map.querySelectorAll('.sp-node').forEach(node => {
      node.onclick = () => {
        openWindow('course');
        revealUnit(node.dataset.gid);
      };
    });
  }

  const next = nextStop();
  const p = next ? lessonProgress(next.id) : { total: 0 };
  const nextEl = q('#sp-next');
  if (nextEl) nextEl.textContent = next ? `next · ${next.n}` : 'the line is complete';
  const titleEl = q('#sp-next-title');
  if (titleEl) titleEl.textContent = next ? `${next.title} · ${next.mins ? `${next.mins} min` : 'a short stop'}` : '';
  const metaEl = q('#sp-next-meta');
  if (metaEl) metaEl.textContent = next ? `${p.total} checkpoints` : '';
}

/* ── the queue: the next seven real stops, each one a door ────────────────── */
function paintQueue() {
  const lessons = writtenLessons();
  const sum = progressSummary();
  const upNext = lessons.filter(l => !isDone(l.id)).slice(0, 7);
  const list = q('#nq-list');
  if (!list) return;

  list.innerHTML = upNext.length
    ? upNext.map((l, i) => `
      <button type="button" class="nq-row${i === 0 ? ' current' : ''}" data-id="${escAttr(l.id)}">
        <span class="nq-n">${escAttr(l.n)}</span>
        <span class="nq-title">${escAttr(l.title)}</span>
        <span class="nq-min">${l.mins ? `${l.mins}m` : '—'}</span>
      </button>`).join('')
    : '<div class="nq-row"><span class="nq-n">--</span><span class="nq-title">everything is finished.</span><span class="nq-min">—</span></div>';

  list.querySelectorAll('.nq-row[data-id]').forEach(row => {
    row.onclick = () => openLesson(row.dataset.id);
  });

  const count = q('#nq-count');
  if (count) count.textContent = `${sum.done} / ${sum.total} stops`;
}

/* ── course card: a real ring, a real week, a real rank ───────────────────── */
function paintCourse() {
  const sum = progressSummary();
  const ratio = sum.total ? sum.done / sum.total : 0;
  const pct = Math.round(ratio * 100);

  const pctEl = q('#nx-pct');
  if (pctEl) pctEl.textContent = `${pct}%`;
  const done = q('#nx-done');
  if (done) done.textContent = `${sum.done} / ${sum.total}`;
  const rank = q('#nx-rank');
  if (rank) rank.textContent = levelOf(sum.xp).name;

  const ring = q('#nx-ring-fg');
  if (ring) {
    const circ = 2 * Math.PI * 25;
    ring.style.strokeDasharray = String(circ);
    ring.style.strokeDashoffset = String(circ * (1 - ratio));
  }

  const week = q('#nx-week');
  if (week) {
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
    week.innerHTML = days.map(d => `<span class="nx-day${d.on ? ' on' : ''}${d.today ? ' now' : ''}" title="${d.key}${d.on ? ' — desk open' : ''}">
      <i aria-hidden="true"></i><em>${d.label}</em>
    </span>`).join('');
  }

  const lastEl = q('#nx-last');
  if (lastEl) {
    const last = lessonById(state.last);
    const real = state.last !== 'home' && last && !last.soon && last.kind !== 'tool';
    lastEl.textContent = real ? `last · ${last.n} ${last.title}` : 'no session yet';
    lastEl.title = real ? `${last.n} ${last.title}` : 'The desk has not opened a session yet.';
  }
}

/* ── machine facts, not invented telemetry ───────────────────────────────── */
function paintSystem() {
  const threads = q('#nx-threads');
  if (threads) threads.textContent = navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : '--';

  const memory = q('#nx-memory');
  if (memory) memory.textContent = navigator.deviceMemory ? `${navigator.deviceMemory}g` : '--';

  const display = q('#nx-display');
  if (display) display.textContent = `${innerWidth} × ${innerHeight}`;

  const wall = q('#nx-wall');
  const current = currentWall();
  if (wall) wall.textContent = current ? current.label : 'deep line';

  const network = q('#nx-network');
  if (network) {
    const online = navigator.onLine;
    network.classList.toggle('off', !online);
    const label = network.querySelector('span');
    if (label) label.textContent = online ? 'online' : 'offline';
  }
}

function paintFoot() {
  const names = ['desk', 'session', 'man', 'settings'];
  const ws = activeWs();
  const foot = q('#nx-foot-ws');
  if (foot) foot.textContent = `workspace ${ws} / ${names[ws - 1] || 'desk'}`;
  const display = q('#nx-foot-display');
  if (display) display.textContent = `wayland · ${innerWidth} × ${innerHeight}`;
}

function paintDesktop() {
  paintClock();
  paintNow();
  paintToday();
  paintPath();
  paintQueue();
  paintCourse();
  paintSystem();
  paintFoot();
}

export function mountDesktop(el) {
  desk = el;
  desk.innerHTML = shellMarkup();

  q('#nx-open-course').onclick = () => openWindow('course');
  q('#nx-open-progress').onclick = () => openWindow('system');
  q('#nq-index').onclick = () => openWindow('course');

  paintDesktop();
  onPaint(paintDesktop);
  onLog(() => {
    paintNow();
    paintToday();
    paintPath();
    paintQueue();
    paintCourse();
  });
  onWM(paintFoot);
  addEventListener('resize', paintSystem);
  addEventListener('resize', paintFoot);
  addEventListener('online', paintSystem);
  addEventListener('offline', paintSystem);
  scheduleClock();
  return desk;
}

/* Kept as a no-op for older tools. */
export function stillDeck() {}
