/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/FILES
   Workspace 1's file manager: ~/roblox-luau as it actually is. Units are
   directories, every stop is a file, and the current stop carries the same
   state the rest of the machine uses. It is a second way into the course that
   does not turn the desk into a dashboard.
   ════════════════════════════════════════════════════════════════════════════ */

import { GROUPS, GOALS, courseList } from '../data/course.js';
import { goalsOf, isDone } from '../core/state.js';
import { defineWindow, openWindow } from '../core/wm.js';
import { currentLessonId } from './session.js';
import { openStop } from './course.js';
import { onPaint } from './window.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const stateOf = l => {
  if (l.soon) return 'soon';
  if (isDone(l.id)) return 'done';
  if (goalsOf(l.id).length) return 'doing';
  return l.kind === 'tool' ? 'tool' : 'open';
};
const stateLabel = l => ({
  done: 'finished', doing: 'in progress', open: 'ready', soon: 'not written', tool: 'reference',
}[stateOf(l)]);
const stopsOf = g => courseList().filter(l => l.g === g.id);
const dirOf = g => `unit-${g.id.slice(1).padStart(2, '0')}-${g.label.toLowerCase().replace(/\s+/g, '-')}/`;

let root = null, unitsEl = null, filesEl = null, inspectEl = null;
let selectedGid = null, selectedId = null, offPaint = null, api = null;

function initialGid() {
  const id = currentLessonId();
  const l = courseList().find(x => x.id === id);
  if (l && l.g) return l.g;
  return (GROUPS.find(g => stopsOf(g).some(x => !isDone(x.id) && !x.soon)) || GROUPS[0]).id;
}

function initialStop(stops) {
  const current = currentLessonId();
  if (stops.some(l => l.id === current)) return current;
  return (stops.find(l => !isDone(l.id) && !l.soon) || stops[0] || {}).id || null;
}

function rows() {
  return [...(filesEl ? filesEl.querySelectorAll('.fm-file') : [])];
}

function markSelected() {
  rows().forEach(r => {
    r.classList.toggle('selected', r.dataset.id === selectedId);
    r.setAttribute('aria-selected', String(r.dataset.id === selectedId));
  });
  renderInspector();
}

function selectFile(id, { focus = false } = {}) {
  const l = courseList().find(x => x.id === id);
  if (!l) return;
  selectedGid = l.g || selectedGid;
  selectedId = id;
  markSelected();
  if (focus) {
    const row = filesEl && filesEl.querySelector(`.fm-file[data-id="${id}"]`);
    if (row) {
      rows().forEach(r => r.tabIndex = -1);
      row.tabIndex = 0;
      row.focus({ preventScroll: true });
    }
  }
}

function selectUnit(gid, { focus = false } = {}) {
  const g = GROUPS.find(x => x.id === gid);
  if (!g) return;
  selectedGid = gid;
  selectedId = initialStop(stopsOf(g));
  paint();
  if (focus) {
    const row = filesEl && filesEl.querySelector('.fm-file');
    if (row) {
      rows().forEach(r => r.tabIndex = -1);
      row.tabIndex = 0;
      row.focus({ preventScroll: true });
    }
  }
}

function moveFile(d) {
  const list = rows();
  if (!list.length) return;
  const at = list.indexOf(document.activeElement);
  const next = at === -1 ? 0 : (at + d + list.length) % list.length;
  selectedId = list[next].dataset.id;
  markSelected();
  list.forEach(r => r.tabIndex = -1);
  list[next].tabIndex = 0;
  list[next].focus({ preventScroll: true });
}

function renderInspector() {
  if (!inspectEl) return;
  const g = GROUPS.find(x => x.id === selectedGid) || GROUPS[0];
  const stops = stopsOf(g);
  const l = courseList().find(x => x.id === selectedId) || stops.find(x => !isDone(x.id) && !x.soon) || stops[0];
  if (!l) {
    inspectEl.innerHTML = '<div class="fm-inspect-empty">no entry selected</div>';
    return;
  }
  const goals = GOALS[l.id] || [];
  const st = stateOf(l);
  const meta = [
    `<span class="fi-state ${st}">${stateLabel(l)}</span>`,
    l.mins ? `<span>${l.mins} min</span>` : '',
    goals.length ? `<span>${goals.length} checkpoint${goals.length === 1 ? '' : 's'}</span>` : '',
  ].filter(Boolean).join('');

  inspectEl.innerHTML = `
    <div class="fi-title"><span class="fi-n">${l.kind === 'tool' ? 'ref' : l.n}</span><b>${esc(l.title)}</b></div>
    <div class="fi-meta">${meta}</div>
    <button type="button" class="fi-open"${st === 'soon' ? ' disabled' : ''}
      aria-label="${st === 'soon' ? 'Not written yet' : `Open ${esc(l.title)}`}">
      ${st === 'soon' ? 'not written yet' : 'open'} <span>↵</span>
    </button>`;
  const btn = inspectEl.querySelector('.fi-open');
  if (btn && st !== 'soon') btn.onclick = () => openStop(l.id);
}

function paint() {
  if (!root) return;
  if (!selectedGid) selectedGid = initialGid();
  const g = GROUPS.find(x => x.id === selectedGid) || GROUPS[0];
  const stops = stopsOf(g);
  if (!selectedId || !stops.some(l => l.id === selectedId)) selectedId = initialStop(stops);
  const current = currentLessonId();

  const held = document.activeElement && filesEl && filesEl.contains(document.activeElement)
    ? document.activeElement.dataset.id || document.activeElement.dataset.g || null
    : null;

  unitsEl.innerHTML = GROUPS.map(unit => {
    const list = stopsOf(unit);
    if (!list.length) return '';
    const here = unit.id === g.id;
    return `<button type="button" class="fm-dir${here ? ' here' : ''}" data-g="${unit.id}"
        role="option" aria-selected="${here}" tabindex="${here ? 0 : -1}">
      <span class="fm-dir-name">${dirOf(unit)}</span>
    </button>`;
  }).join('');

  filesEl.innerHTML = stops.map(l => {
    const st = stateOf(l);
    const cur = l.id === current;
    const sel = l.id === selectedId;
    return `<button type="button" class="fm-file ${st}${cur ? ' current' : ''}${sel ? ' selected' : ''}" data-id="${l.id}"
        role="option" aria-selected="${sel}" tabindex="-1"
        title="${st === 'soon' ? 'not written yet' : `select ${esc(l.title)}`}">
      <span class="fm-dot" aria-hidden="true"></span>
      <span class="fm-n">${l.kind === 'tool' ? 'ref' : l.n}</span>
      <span class="fm-name">${esc(l.title)}</span>
    </button>`;
  }).join('');

  filesEl.querySelectorAll('.fm-file').forEach(b => {
    b.onclick = () => selectFile(b.dataset.id, { focus: true });
  });
  unitsEl.querySelectorAll('.fm-dir').forEach(b => {
    b.onclick = () => selectUnit(b.dataset.g, { focus: true });
  });

  const first = filesEl.querySelector('.fm-file');
  if (first && !filesEl.querySelector('.fm-file[tabindex="0"]')) first.tabIndex = 0;

  if (held) {
    const again = filesEl.querySelector(`[data-id="${held}"]`) || unitsEl.querySelector(`[data-g="${held}"]`);
    if (again) {
      again.tabIndex = 0;
      again.focus({ preventScroll: true });
    }
  }

  renderInspector();
  if (api) api.setTitle('~/roblox-luau');
}

/* Called by the terminal's unit index; opens this folder on the desk. */
export function openFilesAt(gid) {
  if (!GROUPS.some(g => g.id === gid)) return false;
  selectedGid = gid;
  selectedId = initialStop(stopsOf(GROUPS.find(g => g.id === gid)));
  openWindow('files');
  if (api) paint();
  return true;
}

export const filesWindow = defineWindow({
  id: 'files',
  title: 'Files',
  tag: '~/roblox-luau',
  icon: 'files',
  ws: 3,                                  // with the manual: the desk keeps its windows clear
  weight: 0.82,
  build(body, winApi) {
    api = winApi;
    selectedGid = initialGid();
    selectedId = null;

    root = document.createElement('div');
    root.className = 'fm';
    root.innerHTML = `
      <div class="fm-body">
        <div class="fm-units" id="fm-units" role="listbox" aria-label="Course units"></div>
        <div class="fm-pane">
          <div class="fm-files" id="fm-files" role="listbox" aria-label="Stops in this unit"></div>
          <div class="fm-inspect" id="fm-inspect"></div>
        </div>
      </div>`;
    body.appendChild(root);

    unitsEl = root.querySelector('#fm-units');
    filesEl = root.querySelector('#fm-files');
    inspectEl = root.querySelector('#fm-inspect');

    winApi.setTitle('~/roblox-luau');
    winApi.showFoot(false);
    paint();
    offPaint = onPaint(() => paint());

    return {
      focus() {
        const cur = filesEl.querySelector('.fm-file.selected') || filesEl.querySelector('.fm-file');
        if (cur) {
          rows().forEach(r => r.tabIndex = -1);
          cur.tabIndex = 0;
          cur.focus({ preventScroll: true });
        }
      },
      onKey(e) {
        if (e.target.closest('.fm-units')) {
          if (e.key === 'ArrowRight' || e.key === 'l') {
            e.preventDefault();
            const i = GROUPS.findIndex(g => g.id === selectedGid);
            if (i < GROUPS.length - 1) selectUnit(GROUPS[i + 1].id, { focus: true });
            return true;
          }
          if (e.key === 'ArrowLeft' || e.key === 'h') {
            e.preventDefault();
            const i = GROUPS.findIndex(g => g.id === selectedGid);
            if (i > 0) selectUnit(GROUPS[i - 1].id, { focus: true });
            return true;
          }
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const row = filesEl.querySelector('.fm-file.selected') || filesEl.querySelector('.fm-file');
            if (row) selectFile(row.dataset.id, { focus: true });
            return true;
          }
          if (e.key === 'ArrowDown' || e.key === 'j') {
            e.preventDefault();
            const list = rows();
            if (list[0]) selectFile(list[0].dataset.id, { focus: true });
            return true;
          }
          return false;
        }

        if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); moveFile(1); return true; }
        if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); moveFile(-1); return true; }
        if (e.key === 'Home') { e.preventDefault(); const list = rows(); if (list[0]) selectFile(list[0].dataset.id, { focus: true }); return true; }
        if (e.key === 'End') { e.preventDefault(); const list = rows(); if (list.length) selectFile(list[list.length - 1].dataset.id, { focus: true }); return true; }
        if (e.key === 'Enter' || e.key === ' ') {
          if (document.activeElement && document.activeElement.classList.contains('fm-file')) {
            e.preventDefault();
            selectFile(document.activeElement.dataset.id);
            const l = courseList().find(x => x.id === selectedId);
            if (l && !l.soon) openStop(l.id);
            return true;
          }
        }
        if (e.key === 'ArrowRight' || e.key === 'l') {
          e.preventDefault();
          const i = GROUPS.findIndex(g => g.id === selectedGid);
          if (i < GROUPS.length - 1) selectUnit(GROUPS[i + 1].id, { focus: true });
          return true;
        }
        if (e.key === 'ArrowLeft' || e.key === 'h') {
          e.preventDefault();
          const i = GROUPS.findIndex(g => g.id === selectedGid);
          if (i > 0) selectUnit(GROUPS[i - 1].id, { focus: true });
          return true;
        }
        return false;
      },
      closed() {
        if (offPaint) offPaint();
        offPaint = null;
      },
    };
  },
});
