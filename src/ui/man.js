/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/MAN
   Workspace 3: reference material, set the way a manual has been set for fifty
   years. Every cheatsheet in the course is a man page — `man luau-decisions` —
   with a name and section in the corner, capitalised headings and a footer that
   tells you how to leave. `q` closes it, because of course it does.
   ════════════════════════════════════════════════════════════════════════════ */

import { GROUPS, courseList, cheatFor, lessonById } from '../data/course.js';
import { defineWindow, closeWindow, openWindow } from '../core/wm.js';
import { state, save } from '../core/state.js';
import { log } from '../core/journal.js';
import { renderMarkdown } from '../core/md.js';
import { sound } from '../core/sound.js';
import { openLesson } from './session.js';

let api = null, docEl = null, bodyEl = null, headEl = null, footEl = null;
let sheet = null;

const sheets = () => courseList().filter(l => l.kind === 'tool');
export const currentSheet = () => sheet;

const sectionOf = l => {
  const g = GROUPS.find(x => x.id === l.g);
  const unit = l.g ? l.g.replace('g', '') : '1';
  const name = (g ? g.label : l.title).toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return { unit, name: `LUAU-${name}`, label: g ? g.label.toLowerCase() : 'reference' };
};

/** Every cheatsheet the machine knows, in line order. */
export const manSheets = () => sheets().map(l => ({ id: l.id, n: l.n, title: l.title, tag: l.tag }));

/**
 * openMan(id) — `id` is either a cheatsheet lesson id or any lesson, in which
 * case the machine opens that unit's sheet.
 */
export function openMan(id) {
  const l = lessonById(id);
  let target = null;
  if (l && l.kind === 'tool') target = l;
  else if (l) target = cheatFor(l.id);
  if (!target) target = sheets()[0] || null;
  sheet = target ? target.id : null;
  state.last = sheet || state.last;
  save();
  openWindow('man');
  render();
  return sheet;
}

export function nextSheet(dir) {
  const list = sheets();
  if (!list.length) return;
  const i = list.findIndex(s => s.id === sheet);
  const next = list[(i + dir + list.length) % list.length];
  sound.open();
  sheet = next.id;
  render();
}

/* ── painting ─────────────────────────────────────────────────────────────── */
function render() {
  if (!docEl) return;
  const l = sheet ? lessonById(sheet) : null;
  const list = sheets();
  const i = Math.max(0, list.findIndex(s => s.id === sheet));
  const sec = l ? sectionOf(l) : { name: 'LUAU', unit: '1', label: '' };

  if (headEl) {
    headEl.innerHTML = `<span class="l">${sec.name}(${sec.unit})</span>
      <span class="m">MIMEI manual · ${sec.label}</span>
      <span class="r">${i + 1}/${list.length}</span>`;
  }
  if (api) {
    api.setTitle(l ? l.title : 'Manual');

  }

  const src = l && l.md ? document.getElementById(l.md) : null;
  if (!l || !src) {
    docEl.innerHTML = `<div class="unbuilt"><p class="big">[ no manual page ]</p>
      <h2>The reference shelf is empty</h2>
      <p>Cheatsheets are written alongside the unit they belong to.</p></div>`;
  } else {
    docEl.innerHTML = '';
    docEl.append(...renderMarkdown(src.textContent, { plain: true }).childNodes);
    const back = document.createElement('p');
    back.className = 'hint';
    back.innerHTML = `want the lesson itself? <button class="btn ghost" id="man-open">open ${l.title.replace(/ cheatsheet$/i, '')}</button>`;
    docEl.appendChild(back);
    const open = docEl.querySelector('#man-open');
    if (open) open.onclick = () => {
      const lesson = courseList().find(x => x.kind === 'lesson' && (x.g || '') === (l.g || ''));
      openLesson(lesson ? lesson.id : '1.0');
    };
  }
  bodyEl.scrollTop = 0;
  paintFoot();
}

function paintFoot() {
  if (!footEl) return;
  const list = sheets();
  const i = Math.max(0, list.findIndex(s => s.id === sheet));
  footEl.innerHTML = `
    <button class="btn ghost" id="man-prev" title="Previous sheet">◀</button>
    <button class="btn ghost" id="man-next" title="Next sheet">▶</button>
    <span class="seg">man ${i + 1}/${list.length}</span>
    <span class="fill"></span>
    <span class="seg" id="man-pos">top</span>
    <span class="seg"><kbd>q</kbd> close</span>`;
  footEl.querySelector('#man-prev').onclick = () => nextSheet(-1);
  footEl.querySelector('#man-next').onclick = () => nextSheet(1);
}

/* ── the window ───────────────────────────────────────────────────────────── */
export const manWindow = defineWindow({
  id: 'man',
  title: 'Manual',
  tag: 'man',
  icon: 'man',
  ws: 3,
  weight: 1,
  build(body, winApi) {
    api = winApi;
    const root = document.createElement('div');
    root.className = 'man';
    headEl = document.createElement('div');
    headEl.className = 'man-head';
    bodyEl = document.createElement('div');
    bodyEl.className = 'man-body';
    bodyEl.tabIndex = 0;
    bodyEl.setAttribute('role', 'document');
    bodyEl.setAttribute('aria-label', 'Manual page');
    docEl = document.createElement('div');
    docEl.className = 'man-doc';
    bodyEl.appendChild(docEl);
    root.append(headEl, bodyEl);
    body.appendChild(root);

    footEl = winApi.foot;
    winApi.showFoot(true);

    bodyEl.addEventListener('scroll', () => {
      const p = Math.round(bodyEl.scrollTop / Math.max(1, bodyEl.scrollHeight - bodyEl.clientHeight) * 100);
      const pos = footEl.querySelector('#man-pos');
      if (pos) pos.textContent = isNaN(p) ? 'top' : (p >= 99 ? 'end' : p + '%');
    }, { passive: true });

    if (!sheet) sheet = sheets()[0] ? sheets()[0].id : null;
    render();

    return {
      focus() { paintFoot(); },
      onKey(e) {
        if (e.altKey || e.ctrlKey || e.metaKey) return false;
        if (/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || '')) return false;
        if (e.key === 'q') { e.preventDefault(); closeWindow('man'); log('dim', '[ q ] man page closed'); return true; }
        return false;
      },
    };
  },
});

/** Open the sheet that belongs to whatever is being read. */
export function openManForLesson(id) {
  const l = lessonById(id);
  return openMan(l ? l.id : 'cheat');
}
