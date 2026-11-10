/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/LAUNCHER
   wofi/rofi, not a shell: a centred panel with a mode, a fuzzy list and a
   footer of keys. Tab changes mode — lessons, windows, actions, keys.
   It is a real dialog combobox: the input keeps focus, ↑↓ move the selection,
   Enter runs, Esc closes, and the panel announces the selected row.

   Every action on the desktop has an entry here, which is what makes the site
   keyboard-complete rather than keyboard-friendly.
   ════════════════════════════════════════════════════════════════════════════ */

import { writtenLessons, GROUPS } from '../data/course.js';
import { isDone, state, save } from '../core/state.js';
import { openWindow, windowIds, windowDef, isOpen, focusedId, goWorkspace } from '../core/wm.js';
import { setPeek, isPeeking, rainWanted, setRain, fxLevel, cycleFxPreference } from '../core/effects.js';
import { sound } from '../core/sound.js';
import { log } from '../core/journal.js';
import { ICONS, icon, escAttr } from './window.js';
import { KEYMAP } from '../core/keys.js';
import { openLesson } from './session.js';
import { openMan } from './man.js';
import { openSettings } from './settings.js';
import { showGoals, showJournal } from './goals.js';
import { focusCourseSearch } from './course.js';
import { bodyHit, snipHtml } from '../core/find.js';

const MODES = [
  { id: 'lessons', label: 'lessons', ph: 'jump to a lesson' },
  { id: 'windows', label: 'windows', ph: 'open or focus a window' },
  { id: 'actions', label: 'actions', ph: 'do something' },
  { id: 'keys', label: 'keys', ph: 'what the keyboard does' },
];

let host = null, input = null, listEl = null, modeEl = null, countEl = null;
let mode = 'lessons';
let rows = [];
let sel = 0;
let restoreFocus = null;

/* ── what each mode offers ────────────────────────────────────────────────── */
const WS_NAMES = ['desk', 'lessons', 'manual', 'settings'];

function buildRows() {
  const out = [];
  if (mode === 'lessons') {
    for (const l of writtenLessons()) {
      out.push({
        id: l.id,
        label: `${l.n} ${l.title}`,
        sub: (GROUPS.find(g => g.id === l.g) || {}).label || '',
        right: isDone(l.id) ? 'done' : l.mins ? `~${l.mins}m` : '',
        icon: isDone(l.id) ? 'check' : 'session',
        run: () => openLesson(l.id),
      });
    }
  } else if (mode === 'windows') {
    for (const id of windowIds()) {
      const def = windowDef(id);
      const open = isOpen(id);
      out.push({
        id: `win-${id}`,
        label: def.title,
        sub: `workspace ${def.ws} · ${WS_NAMES[def.ws - 1]}`,
        right: focusedId() === id ? 'focused' : open ? 'open' : '',
        icon: def.icon || 'deck',
        run: () => openWindow(id),
      });
    }
    out.push({ id: 'win-keys', label: 'Keyboard shortcuts', sub: 'the whole map', icon: 'system', run: () => setMode('keys') });
  } else if (mode === 'actions') {
    out.push(
      { id: 'a-deck', label: 'Go to the desk', sub: 'workspace 1 · the crane', icon: 'deck', run: () => goWorkspace(1) },
      { id: 'a-course', label: 'Search the course', sub: 'workspace 2', icon: 'search', run: () => focusCourseSearch() },
      { id: 'a-goals', label: 'Goals and journal', sub: 'what you have ticked', icon: 'system', run: () => showGoals() },
      { id: 'a-man', label: 'Open the manual', sub: 'cheatsheets for every unit', icon: 'man', run: () => openMan(state.last) },
      { id: 'a-settings', label: 'Settings', sub: 'effects, sound, progress', icon: 'settings', run: () => openSettings() },
      { id: 'a-rain', label: rainWanted() ? 'Stop the rain' : 'Start the rain', sub: 'the window outside', icon: 'deck', run: () => setRain(!rainWanted()) },
      { id: 'a-fx', label: 'Next effects level', sub: `now level ${fxLevel()}`, icon: 'settings', run: () => cycleFxPreference() },
      { id: 'a-sound', label: sound.on ? 'Sound off' : 'Sound on', sub: 'the city at night and soft clicks', icon: 'deck', run: () => sound.set(!sound.on) },
      { id: 'a-peek', label: isPeeking() ? 'Bring everything back' : 'The city only', sub: 'alt b', icon: 'deck', run: () => setPeek(!isPeeking(), { focusBack: false }) },
      { id: 'a-keys', label: 'Keyboard shortcuts', sub: 'the whole map', icon: 'system', run: () => setMode('keys') },
    );
  } else if (mode === 'keys') {
    for (const { k, d } of KEYMAP) {
      out.push({ id: `k-${k.join('')}-${d}`, label: d, keys: k, sub: '', run: null });
    }
  }
  return out;
}

/* ── fuzzy ────────────────────────────────────────────────────────────────── */
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9. ]+/g, ' ');

/** Subsequence score: earlier, tighter hits rank higher. */
function score(hay, needle) {
  if (!needle) return 1;
  const h = norm(hay), n = norm(needle);
  if (h.includes(n)) return 100 - h.indexOf(n);
  let i = 0, s = 0, streak = 0;
  for (const ch of n) {
    const at = h.indexOf(ch, i);
    if (at === -1) return 0;
    streak = at === i ? streak + 1 : 0;
    s += 1 + streak * 0.5;
    i = at + 1;
  }
  return s;
}

const NAMED = 40;                        // a name score from here up holds the words outright
function filtered(q) {
  if (mode === 'keys') return rows;
  const text = mode === 'lessons';       // lessons are also found by what they say
  const scored = rows
    .map(r => {
      const s = score(`${r.label} ${r.sub || ''} ${r.id}`, q);
      const hit = text && s < NAMED ? bodyHit(r.id, q) : null;       // a name that has the words needs no snippet
      return hit ? { r: { ...r, hit }, s: NAMED - 1 } : { r, s };    // a text hit sits under a name hit and over a loose fuzzy one
    })
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, 40).map(x => x.r);
}

/* ── painting ─────────────────────────────────────────────────────────────── */
function paint() {
  const q = input.value;
  const hits = filtered(q);
  if (sel >= hits.length) sel = Math.max(0, hits.length - 1);
  listEl.innerHTML = hits.length ? hits.map((r, i) => rowHtml(r, i, i === sel)).join('')
    : '<div class="lempty" role="option" aria-disabled="true" aria-selected="false">nothing on this machine matches that</div>';   // a listbox holds options only
  const active = listEl.querySelector('[aria-selected="true"]');
  if (active) {
    input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  } else input.removeAttribute('aria-activedescendant');   // no row to point at: a stale id names nothing
  countEl.textContent = `${hits.length}${hits.length === 40 ? '+' : ''} ${hits.length === 1 ? 'result' : 'results'}`;
  listEl.setAttribute('aria-label', `${mode} results`);
}

function rowHtml(r, i, on) {
  if (mode === 'keys') {
    return `<div class="lrow" id="row-${cssId(r.id)}" role="option" aria-selected="${on}" tabindex="-1">
      <span class="k">${r.keys.map(k => `<kbd>${k}</kbd>`).join(' ')}</span>
      <span class="lb" title="${escAttr(r.label)}">${r.label}</span></div>`;
  }
  const right = r.right ? `<span class="k">${r.right}</span>` : '';
  const swatch = r.sw ? `<span class="sw" aria-hidden="true" style="background:${r.sw[2]};border-color:${r.sw[4]}"></span>` : '';
  const ic = r.icon && ICONS[r.icon] ? `<span class="ic">${ICONS[r.icon]}</span>` : swatch;
  return `<button class="lrow${r.hit ? ' has-snip' : ''}" id="row-${cssId(r.id)}" role="option" aria-selected="${on}" tabindex="-1" data-i="${i}">
    ${ic}<span class="lb" title="${escAttr([r.label, r.sub].filter(Boolean).join(" · "))}">${r.label}${r.sub ? ` <span class="sub">${r.sub}</span>` : ''}</span>
    ${r.sw ? swatch : ''}${right}${r.hit ? snipHtml(r.hit) : ''}</button>`;
}

const cssId = s => String(s).replace(/[^a-zA-Z0-9_-]/g, '');

/* ── selection + run ──────────────────────────────────────────────────────── */
function move(d) {
  const hits = filtered(input.value);
  if (!hits.length) return;
  sel = (sel + d + hits.length) % hits.length;
  sound.tick();
  paint();
}

function run(i = sel) {
  const hits = filtered(input.value);
  const r = hits[i];
  if (!r || !r.run) return;
  close({ restore: false });
  r.run();
  log('dim', `[ ⌁ ] ${r.label}`);
}

function setMode(next) {
  mode = next;
  sel = 0;
  const m = MODES.find(x => x.id === mode);
  modeEl.textContent = m.label;
  input.placeholder = m.ph;
  input.value = '';
  rows = buildRows();
  paint();
}

/* ── open / close ─────────────────────────────────────────────────────────── */
export function openLauncher(startMode = null) {
  if (!host) return;
  if (!host.hidden) { if (startMode) setMode(startMode); return; }
  restoreFocus = document.activeElement && document.activeElement.focus ? document.activeElement : null;
  host.hidden = false;
  const scrim = document.getElementById('scrim');
  if (scrim) scrim.hidden = false;
  setMode(startMode || mode);
  setTimeout(() => input.focus(), 20);
  sound.open();
}

export function closeLauncher({ restore = true } = {}) {
  if (!host || host.hidden) return;
  host.hidden = true;
  const scrim = document.getElementById('scrim');
  if (scrim) scrim.hidden = true;
  sound.close();
  if (restore && restoreFocus && restoreFocus.focus) {
    try { restoreFocus.focus({ preventScroll: true }); } catch (_) { restoreFocus.focus(); }
  }
}

const close = closeLauncher;
export const launcherOpen = () => !!host && !host.hidden;
export const toggleLauncher = (m = null) => (launcherOpen() ? closeLauncher() : openLauncher(m));

export function initLauncher() {
  host = document.getElementById('launcher');
  input = document.getElementById('launch-input');
  listEl = document.getElementById('launch-list');
  modeEl = document.getElementById('launch-mode');
  countEl = document.getElementById('launch-count');
  if (!host) return null;

  input.addEventListener('input', () => { sel = 0; paint(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeLauncher(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); sel = 0; paint(); }
    else if (e.key === 'End') { e.preventDefault(); sel = filtered(input.value).length - 1; paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const i = MODES.findIndex(m => m.id === mode);
      const n = (i + (e.shiftKey ? -1 : 1) + MODES.length) % MODES.length;
      setMode(MODES[n].id);
      sound.click();
    } else if (e.key === 'PageDown') { e.preventDefault(); move(5); }
    else if (e.key === 'PageUp') { e.preventDefault(); move(-5); }
  });

  listEl.addEventListener('pointerdown', e => {
    const row = e.target.closest('.lrow');
    if (!row) return;
    if (mode === 'keys') return;
    e.preventDefault();
    const i = +row.dataset.i;
    sel = i;
    paint();
    run(i);
  });
  listEl.addEventListener('pointermove', e => {
    const row = e.target.closest('.lrow');
    if (!row || mode === 'keys') return;
    const i = +row.dataset.i;
    if (i !== sel) { sel = i; paint(); }
  });

  const scrim = document.getElementById('scrim');
  if (scrim) scrim.onclick = () => closeLauncher();
  host.addEventListener('pointerdown', e => e.stopPropagation());

  return { open: openLauncher, close: closeLauncher, isOpen: launcherOpen };
}
