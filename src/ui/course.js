/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/COURSE
   Workspace 2's left window: the course as a file manager. Units are
   directories, lessons are files, tools are the reference shelf. It is the
   same list the deck's departures board shows, in the shape the machine
   actually stores it.

   Keyboard is first class: ↑↓ (or j/k) walk the stops, ←→ fold a unit, Enter
   opens, / jumps here from anywhere.
   ════════════════════════════════════════════════════════════════════════════ */

import { GROUPS, courseList, isLesson } from '../data/course.js';
import { defineWindow, openWindow } from '../core/wm.js';
import { isDone, goalsOf } from '../core/state.js';
import { bodyHit, snipHtml } from '../core/find.js';
import { sound } from '../core/sound.js';
import { repaint, onPaint, icon } from './window.js';
import { openLesson, currentLessonId } from './session.js';
import { openMan } from './man.js';

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv'];
const folded = new Set(GROUPS.filter(g => !g.open).map(g => g.id));
let query = '';
let api = null;
let listEl = null, searchEl = null, footEl = null, countEl = null;
/* every place the course list is painted: the window, and the study overlay.
   Each keeps its own search text; paint() loads one into the module vars and
   runs the one painter, so there is a single source for the list's look. */
const targets = [];
let overlayHook = null;

/** study.js hands in the function that opens its course overlay. */
export const onCourseOverlay = fn => { overlayHook = fn; };

function wireTarget(list, search, foot) {
  const t = { listEl: list, searchEl: search, footEl: foot, q: '' };
  targets.push(t);
  search.oninput = () => { t.q = search.value; paint(); };
  search.onkeydown = e => {
    if (e.key === 'Escape' && !search.closest('.st-course')) {
      e.preventDefault(); search.value = ''; t.q = ''; paint(); search.blur();
    }
    if (e.key === 'Enter') {
      const first = list.querySelector('.stop');
      if (first) { e.preventDefault(); first.click(); }
    }
  };
  list.addEventListener('keydown', onListKey);
  return t;
}

/** Paint the course (search, units, stops, foot) into a given container. The
 *  window is the same thing wired to its own elements. */
export function paintCourseInto(list, search, foot) {
  const t = wireTarget(list, search, foot);
  follow();
  paint();
  return t;
}

/* every list wears the state of every stop, so all of them follow progress
   ticked anywhere: runbook, probe, or the goals pane. One subscription, made
   by whichever list (the overlay or the window) is wired first. */
let following = false;
function follow() {
  if (following) return;
  following = true;
  onPaint(() => paint());
}

const stopsOf = g => courseList().filter(l => l.g === g.id);

/** What state a stop is in — the one place that word is decided. */
function stateOf(l) {
  if (l.soon) return 'soon';
  if (isDone(l.id)) return 'done';
  if (goalsOf(l.id).length) return 'doing';
  return l.kind === 'tool' ? 'tool' : 'open';
}

/** Opening a stop: lessons go to the session window, tools to a man page. */
export function openStop(id) {
  const l = courseList().find(x => x.id === id);
  if (!l || l.soon) return;
  if (l.kind === 'tool') openMan(id);
  else openLesson(id);
}

/* ── painting ─────────────────────────────────────────────────────────────── */
function paint() {
  for (const t of targets) {
    listEl = t.listEl; searchEl = t.searchEl; footEl = t.footEl; query = t.q;
    paintBody();
  }
}

/* a folded unit hides its stops: they cannot take the arrows or be the one tab stop */
const OPEN_STOPS = '.unit-head[aria-expanded="true"] + .unit-stops .stop';

/** The list is one tab stop (roving), and it has to be a row that shows. */
function rove(root = listEl) {
  if (!root) return;
  const stops = [...root.querySelectorAll('.stop')];
  if (stops.some(r => r.tabIndex === 0 && r.matches(OPEN_STOPS))) return;
  stops.forEach(r => { r.tabIndex = -1; });
  const first = root.querySelector(OPEN_STOPS);
  if (first) first.tabIndex = 0;
}

function paintBody() {
  if (!listEl) return;
  const q = query.trim().toLowerCase();
  const named = l => (l.title + ' ' + l.id + ' ' + l.tag).toLowerCase().includes(q);
  /* searching: units with a stop whose name says it come first, so Enter opens the best match, not the first mention */
  const order = q ? [...GROUPS].sort((a, b) => stopsOf(b).some(named) - stopsOf(a).some(named)) : GROUPS;
  const current = currentLessonId();
  /* a repaint (a goal ticked anywhere) must not cost a keyboard user their
     place in the list */
  const held = document.activeElement && listEl.contains(document.activeElement)
    ? document.activeElement.dataset.id : null;
  listEl.innerHTML = '';

  let hitCount = 0;

  for (const g of order) {
    const stops = stopsOf(g);
    if (!stops.length) continue;
    const snips = new Map();      // stop id -> the words around a match in its text, for a stop whose name does not say it
    const matches = q ? stops.filter(l => {
      if (named(l)) return true;
      const hit = isLesson(l) && !l.soon ? bodyHit(l.id, q) : null;
      if (hit) snips.set(l.id, hit);
      return !!hit;
    }) : stops;
    if (q && !matches.length) continue;
    if (q) matches.sort((a, b) => named(b) - named(a));      // names first inside the unit too
    hitCount += matches.length;

    const open = q ? true : !folded.has(g.id);

    const head = document.createElement('button');
    head.className = 'unit-head';
    head.type = 'button';
    head.setAttribute('aria-expanded', String(open));
    head.dataset.unit = g.id;
    const written = stops.filter(l => isLesson(l) && !l.soon);
    const doneN = written.filter(l => isDone(l.id)).length;
    head.innerHTML = `<i class="rn" aria-hidden="true">${ROMAN[GROUPS.indexOf(g)] || ''}</i>
      <span class="dir">${g.label}</span>${written.length
    ? `<em class="u-prog${doneN === written.length ? ' done' : ''}" title="${doneN} of ${written.length} stops finished">${doneN}/${written.length}</em>` : ''}${icon('caret', 'caret')}`;
    head.title = `${g.label} · unit-${g.id.replace('g', '').padStart(2, '0')}-${g.label.toLowerCase().replace(/\s+/g, '-')}/`;
    head.onclick = () => {
      const nowOpen = head.getAttribute('aria-expanded') !== 'true';
      head.setAttribute('aria-expanded', String(nowOpen));
      if (nowOpen) folded.delete(g.id); else folded.add(g.id);
      rove(head.parentElement);   // the tab stop must not stay in the unit just folded
      sound.click();
    };

    const box = document.createElement('div');
    box.className = 'unit-stops';
    for (const l of matches) {
      const st = stateOf(l);
      const row = document.createElement('button');
      row.className = `stop ${st}`;
      row.type = 'button';
      row.dataset.id = l.id;
      row.dataset.state = st;
      if (l.id === current) row.setAttribute('aria-current', 'true');
      row.tabIndex = -1;
      row.innerHTML = `<span class="st-dot" aria-hidden="true"></span>
        <span class="n">${l.kind === 'tool' ? 'ref' : l.n}</span>
        <span class="t">${l.title}</span>${snips.has(l.id) ? snipHtml(snips.get(l.id)) : ''}`;
      row.title = st === 'soon' ? `${l.title} — not written yet` : `${l.title} — ${st === 'done' ? 'done' : 'open'}`;
      row.onclick = () => openStop(l.id);
      box.appendChild(row);
    }
    listEl.append(head, box);
  }

  if (!hitCount) {
    const none = document.createElement('p');
    none.className = 'goal-empty';
    none.textContent = `nothing in ~/roblox-luau matches "${query.trim()}"`;
    listEl.appendChild(none);
  } else {
    // roving focus: the list is one tab stop (a row that shows), arrows move inside it
    rove();
  }
  if (held) {
    const again = listEl.querySelector(`.stop[data-id="${held}"]`);
    if (again) { again.tabIndex = 0; again.focus({ preventScroll: true }); }
  }
  if (countEl) countEl.textContent = q ? `${hitCount} match${hitCount === 1 ? '' : 'es'}` : '';
  paintFoot();
}

function paintFoot() {
  if (!footEl) return;
  const writtenIds = courseList().filter(l => isLesson(l) && !l.soon).map(l => l.id);
  const done = writtenIds.filter(isDone).length;
  const nextL = nextStop();
  footEl.innerHTML = `
    <div class="row">
      <span>${done} / ${writtenIds.length} finished</span>
      <span class="fill"></span>
      ${nextL
        ? `<button class="next" id="co-next">${done ? 'next' : 'start'} ${nextL.n} <span>→</span></button>`
        : '<span class="done">the line is done</span>'}
    </div>`;
  const next = footEl.querySelector('#co-next');
  if (next) next.onclick = () => nextL && openStop(nextL.id);
}

function nextStop() {
  const written = courseList().filter(l => isLesson(l) && !l.soon);
  return written.find(l => !isDone(l.id)) || written[written.length - 1] || null;
}

/* ── keyboard, inside the list ────────────────────────────────────────────── */
function onListKey(e) {
  const root = e.currentTarget && e.currentTarget.querySelectorAll ? e.currentTarget : listEl;
  const rows = [...root.querySelectorAll(OPEN_STOPS)];
  /* every unit folded: no row shows, but a head still opens with the arrows */
  if (!rows.length && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return false;
  const i = rows.indexOf(document.activeElement);

  if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); focusRow(rows, i + 1); return true; }
  if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); focusRow(rows, i - 1); return true; }
  if (e.key === 'Home') { e.preventDefault(); focusRow(rows, 0); return true; }
  if (e.key === 'End') { e.preventDefault(); focusRow(rows, rows.length - 1); return true; }
  if (e.key === 'Enter' || e.key === ' ') {
    if (i !== -1) { e.preventDefault(); rows[i].click(); return true; }
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const head = e.target.closest('.unit-head');
    if (!head) return false;
    const open = head.getAttribute('aria-expanded') === 'true';
    const want = e.key === 'ArrowRight';
    if (open !== want) { e.preventDefault(); head.click(); }
    return true;
  }
  return false;
}

function focusRow(rows, i) {
  const n = (i + rows.length) % rows.length;
  rows.forEach(r => r.tabIndex = -1);
  rows[n].tabIndex = 0;
  rows[n].focus({ preventScroll: false });
}

/* ── the window ───────────────────────────────────────────────────────────── */
export const courseWindow = defineWindow({
  id: 'course',
  title: 'Course',
  tag: '~/roblox-luau',
  icon: 'course',
  ws: 2,
  weight: .9,
  rail: 'left',
  build(body, winApi) {
    api = winApi;
    const root = document.createElement('div');
    root.className = 'course';
    root.innerHTML = `
      <label class="course-search">
        ${icon('search')}
        <input id="course-q" type="text" spellcheck="false" autocomplete="off"
               aria-label="Search the course" placeholder="search the line">
        <kbd>/</kbd>
      </label>
      <div class="course-list" id="course-list" role="group" aria-label="Stops on the line" tabindex="-1"></div>
      <div class="course-foot" id="course-foot"></div>`;
    body.appendChild(root);

    countEl = null;
    wireTarget(root.querySelector('#course-list'), root.querySelector('#course-q'), root.querySelector('#course-foot'));

    follow();
    paint();
    repaint();

    return {
      onKey(e) {
        if (e.target.closest('#course-q')) return false;
        if (e.target.closest('#course-list')) return onListKey(e);
        return false;
      },
    };
  },
});

export function paintCourse() { paint(); }

/** Unfold one unit without opening anything: the study's overlay opens on the unit being read. */
export function unfoldUnit(gid) {
  if (!folded.delete(gid)) return;
  paint();
}

/** Bring one unit into view in the course window. The deck's shelf uses this
 *  instead of duplicating the course tree in a second place. */
export function revealUnit(gid) {
  const g = GROUPS.find(x => x.id === gid);
  if (!g) return;
  folded.delete(gid);
  query = '';
  const input = document.getElementById('course-q');
  if (input) input.value = '';
  openWindow('course');
  paint();
  setTimeout(() => {
    const head = document.querySelector(`.unit-head[data-unit="${gid}"]`);
    if (!head) return;
    head.scrollIntoView({ block: 'center', behavior: 'smooth' });
    head.focus({ preventScroll: true });
  }, 100);
}

/** `/` from anywhere: workspace 2, the course window up, the cursor in search. */
export function focusCourseSearch() {
  if (overlayHook) { overlayHook(); return; }
  openWindow('course');
  setTimeout(() => {
    const input = document.getElementById('course-q');
    if (input) { input.focus(); input.select(); }
  }, 120);
}
