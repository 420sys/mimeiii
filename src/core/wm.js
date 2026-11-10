/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/WM
   A real (small) tiling window manager.

     · four workspaces, each with its own set of windows and layout
     · windows are columns by default, with draggable weights
     · drag a titlebar: a tiled window floats and follows your hand (Hyprland
       behaviour); drop it on an edge to snap it to a half, on another
       window to slide it back into the layout at that spot
     · double-click a titlebar to fill the seat; the window menu (right click)
       offers float, fill, hide and close
     · Alt is Super. Focus, reorder, resize, workspaces and cycling all work
       from the keyboard, and every window is also reachable from the bar
       and the launcher — nothing here is drag-only.

   Geometry is recomputed from state and written as inline styles, so tests can
   read the layout back out of the DOM instead of guessing at CSS.
   ════════════════════════════════════════════════════════════════════════════ */

import { log, announce, ticker } from './journal.js';
import { state, save } from './state.js';
import { sound } from './sound.js';

/* ── the registry: who exists, and who builds their body ─────────────────── */
const registry = new Map();

/**
 * def: { id, title, tag, icon, ws, min, rail, build(body, win) }
 * `rail` ('left' | 'right') lets a column fold down to its label.
 * `build` fills the window body and may return hooks: { focus(), blur(),
 * close(), footer() , onKey(e) }.
 */
export function defineWindow(def) {
  registry.set(def.id, def);
  return def;
}
export const windowDef = id => registry.get(id) || null;

/* A window that has moved into a fixed layout (the study) keeps its id, but
   opening it runs this instead of building a tile. */
const redirects = new Map();
export const redirectWindow = (id, fn) => { redirects.set(id, fn); };
export const windowIds = () => [...registry.keys()];

/* ── state ────────────────────────────────────────────────────────────────── */
const DEFAULT_LAYOUT = {
  1: { order: [] },
  2: { order: [] },                          // the study is a fixed layout (ui/study.js), not tiles
  3: { order: ['man'] },
  4: { order: ['settings'] },
};
/* the gap is read off the seat, so a workspace can breathe wider than the rest */
const GAP = () => parseFloat(getComputedStyle(seat || document.documentElement).getPropertyValue('--gap')) || 10;
const FOLD_W = 44;                              // a folded rail: just its label, on its side

/* Workspace 1 is the desk: the city, full screen, with no windows on it.
   Terminal and Files live on workspace 3 with the manual; the launcher and the
   bar open them. Clear anything an older save left on workspace 1. */
{
  const w = state.layout && state.layout[1];
  if (w && Array.isArray(w.order) && w.order.length) {
    w.order = [];
    w.hidden = [];
    w.monocle = null;
    if (w.float) w.float = {};
    save();
  }
}

/* The mono pass gave goals and the journal more of the session's old width.
   Upgrade a split the learner has never dragged; leave a custom split alone. */
{
  const w = state.layout && state.layout[2];
  const weights = w && w.weights;
  if (weights && weights.course === 1 && weights.session === 2.5 && weights.system === 1.15) {
    weights.session = 2.3;
    weights.system = 1.35;
    save();
  }
  /* the reading column: the lesson takes the middle, course and goals are rails */
  if (weights && weights.course === 1 && weights.session === 2.3 && weights.system === 1.35) {
    Object.assign(weights, DEFAULT_LAYOUT[2].weights);
    save();
  }
  /* a short-lived quiet pass dropped the goals rail: put it back, once */
  if (w && weights && weights.session === 3.6 && Array.isArray(w.order) && w.order.join() === 'course,session') {
    w.order.push('system');
    Object.assign(weights, DEFAULT_LAYOUT[2].weights);
    save();
  }
  delete state.readingPage;
}

/* Workspace 2 is the study now: one fixed layout, no tiling. Drop the old
   course / session / goals tiles from a saved layout, once. The goals window
   stays defined and opens as a float over the study when asked. */
{
  const w = state.layout && state.layout[2];
  if (w && !state.studyMig) {
    const gone = id => id === 'course' || id === 'session' || id === 'system';
    if (Array.isArray(w.order)) w.order = w.order.filter(id => !gone(id));
    if (Array.isArray(w.hidden)) w.hidden = w.hidden.filter(id => !gone(id));
    if (Array.isArray(w.fold)) w.fold = w.fold.filter(id => !gone(id));
    if (Array.isArray(w.z)) w.z = w.z.filter(id => !gone(id));
    for (const k of ['float', 'weights']) if (w[k]) for (const id of Object.keys(w[k])) if (gone(id)) delete w[k][id];
    if (gone(w.monocle)) w.monocle = null;
    state.studyMig = 1;
    save();
  }
}

let ws = state.ws || 1;
let focused = null;
const lastFocus = new Map();
let focusToken = 0;
let seat = null, drop = null, menu = null;
let layoutFrame = 0;
const listeners = new Set();

const wsState = n => {
  if (!state.layout[n]) state.layout[n] = JSON.parse(JSON.stringify(DEFAULT_LAYOUT[n] || { order: [] }));
  const w = state.layout[n];
  w.order ||= []; w.weights ||= {}; w.float ||= {}; w.hidden ||= []; w.z ||= []; w.mode ||= 'columns';
  w.fold ||= [];
  return w;
};
const cur = () => wsState(ws);
const winEl = id => seat && seat.querySelector(`.win[data-win="${id}"]`);

export const isOpen = id => {
  for (let n = 1; n <= 4; n++) {
    const w = wsState(n);
    if (w.order.includes(id)) return true;
  }
  return false;
};
export const isFocused = id => focused === id;
export const focusedId = () => focused;
export const monocleOn = id => cur().monocle === id;
export const activeWs = () => ws;
export const windowsOn = n => (wsState(n).order || []).filter(id => !wsState(n).hidden.includes(id));
/** Every window that lives on workspace n, shown or hidden, in its order (the bar lists them). */
export const windowsHere = n => [...(wsState(n).order || [])];
export const visibleWindows = () => windowsOn(ws);
export const rects = () => [...(seat ? seat.querySelectorAll('.win:not(.hidden)') : [])]
  .map(el => ({
    id: el.dataset.win,
    x: Math.round(el.offsetLeft), y: Math.round(el.offsetTop),
    w: Math.round(el.offsetWidth), h: Math.round(el.offsetHeight),
    float: el.classList.contains('float'), focus: el.classList.contains('focus'),
    monocle: el.classList.contains('monocle'),
  }));

export function onWM(fn) { listeners.add(fn); return () => listeners.delete(fn); }
const emit = () => { for (const fn of listeners) { try { fn(); } catch (e) { console.error(e); } } };

/* ── building windows ─────────────────────────────────────────────────────── */
function ensureEl(id) {
  let el = winEl(id);
  if (el) return el;
  const def = registry.get(id);
  if (!def) return null;

  el = document.createElement('section');
  el.className = 'win';
  el.dataset.win = id;
  el.id = `win-${id}`;
  el.setAttribute('role', 'region');
  el.setAttribute('aria-labelledby', `win-${id}-t`);
  el.tabIndex = -1;

  const bar = document.createElement('header');
  bar.className = 'win-bar';
  bar.dataset.drag = '1';
  bar.innerHTML = `
    <span class="dots">
      <button class="dot d-close" title="Close (Alt+Q)" aria-label="Close ${def.title}"><svg viewBox="0 0 10 10"><path d="M3 3l4 4M7 3l-4 4"/></svg></button>
      <button class="dot d-hide" title="Hide window (Alt+Z)" aria-label="Hide ${def.title}"><svg viewBox="0 0 10 10"><path d="M2.5 5h5"/></svg></button>
      <button class="dot d-float" title="Float or tile (Alt+F)" aria-label="Float ${def.title}"><svg viewBox="0 0 10 10"><path d="M2 6.5V2h4.5"/></svg></button>
      <button class="dot d-max" title="Fill the seat (Alt+M)" aria-label="Fill ${def.title}"><svg viewBox="0 0 10 10"><path d="M3 6.5V3h3.5M7 3.5V7H3.5"/></svg></button>
    </span>
    <h2 class="win-t" id="win-${id}-t"><span class="nm">${def.title}</span></h2>
    ${def.rail ? `<button class="win-fold" type="button" aria-expanded="true" title="Fold or open ${def.title}" aria-label="Fold ${def.title}"><svg viewBox="0 0 10 10"><path d="${def.rail === 'left' ? 'M6.5 2.5 4 5l2.5 2.5' : 'M3.5 2.5 6 5 3.5 7.5'}"/></svg></button>` : ''}`;
  if (def.rail) el.classList.add('side', `side-${def.rail}`);

  const body = document.createElement('div');
  body.className = 'win-body';
  const foot = document.createElement('footer');
  foot.className = 'win-foot';
  foot.hidden = true;

  for (const dir of ['n', 's', 'w', 'e', 'nw', 'ne', 'sw', 'se']) {
    const r = document.createElement('span');
    r.className = 'rz ' + dir;
    r.dataset.rz = dir;
    el.appendChild(r);
  }
  el.prepend(bar);
  el.append(body, foot);

  const api = {
    el, body, foot, def,
    setTitle(t) {
      el.querySelector('.win-t .nm').textContent = t;
    },
    showFoot(on = true) { foot.hidden = !on; },
  };
  const hooks = def.build(body, api) || {};
  api.hooks = hooks;
  def.hooks = hooks;

  const fold = el.querySelector('.win-fold');
  if (fold) {
    fold.onclick = () => toggleFold(id);
    fold.setAttribute('aria-expanded', String(!wsState(def.ws || ws).fold.includes(id)));
  }
  /* a folded rail is all label: clicking anywhere on it opens it again */
  el.addEventListener('click', e => {
    if (el.classList.contains('folded') && !e.target.closest('.win-fold')) toggleFold(id);
  });

  bar.addEventListener('pointerdown', e => {
    if (e.target.closest('.dot, .win-fold')) return;
    focusWindow(id, { deferFocus: true });
    startDrag(id, e);
  });
  bar.addEventListener('dblclick', e => {
    if (e.target.closest('.dot, .win-fold') || el.classList.contains('folded')) return;
    toggleMonocle(id);
  });
  bar.addEventListener('contextmenu', e => { e.preventDefault(); openMenu(id, e.clientX, e.clientY); });
  el.querySelector('.dot.d-close').onclick = () => closeWindow(id);
  el.querySelector('.dot.d-hide').onclick = () => hideWindow(id);
  el.querySelector('.dot.d-float').onclick = () => toggleFloat(id);
  el.querySelector('.dot.d-max').onclick = () => toggleMonocle(id);
  el.addEventListener('pointerdown', () => focusWindow(id, { deferFocus: true }), true);
  el.addEventListener('keydown', e => {
    if (hooks.onKey && hooks.onKey(e)) e.stopPropagation();
  });

  for (const r of el.querySelectorAll('.rz')) {
    r.addEventListener('pointerdown', e => { focusWindow(id, { deferFocus: true }); startResize(id, r.dataset.rz, e); });
  }

  seat.appendChild(el);
  return el;
}

/* ── opening, closing, focusing ───────────────────────────────────────────── */
export function openWindow(id, { focus = true, ws: target = null, silent = false, reveal = true } = {}) {
  const rd = redirects.get(id);
  if (rd) { rd({ focus, silent }); return null; }
  const def = registry.get(id);
  if (!def) return null;
  const n = target || def.ws || ws;
  const w = wsState(n);
  const fresh = !w.order.includes(id);
  if (fresh) {
    // windows land next to the thing that makes sense: the session sits after
    // the course list, the man page anywhere in workspace 3
    const at = def.after && w.order.indexOf(def.after) !== -1 ? w.order.indexOf(def.after) + 1 : w.order.length;
    w.order.splice(at, 0, id);
    w.hidden = w.hidden.filter(x => x !== id);
    if (def.weight && !w.weights[id]) w.weights[id] = def.weight;
    if (n === 2 && id === 'system' && seat && !w.float[id]) {
      const W0 = seat.clientWidth, H0 = seat.clientHeight;
      const fw = Math.min(420, Math.max(300, W0 * .3)), fh = Math.min(560, Math.max(260, H0 * .7));
      w.float[id] = { x: Math.max(0, W0 - fw - 60), y: 40, w: fw, h: fh };
    }
    save();
  } else if (w.hidden.includes(id)) {
    w.hidden = w.hidden.filter(x => x !== id);
    save();
  } else if (n !== ws) {
    save();
  }

  if (n !== ws && reveal) goWorkspace(n, { silent: true });
  const el = ensureEl(id);
  if (el && !el.isConnected) seat.appendChild(el);
  el && el.classList.remove('hidden');
  // Seed the desk without yanking the learner off the workspace they left.
  if (el && n !== ws) el.classList.add('hidden');
  el && el.classList.add('opening');
  if (el) setTimeout(() => el.classList.remove('opening'), 220);

  if (focus && n === ws) focusWindow(id, { silent });
  if (reveal && n === ws && el && document.body.classList.contains('stack')) {
    /* On a stacked machine the focused window may live below the fold (the
       session always does, after the course list). Bring it to the learner
       without moving the tiled desk on a wide screen. */
    requestAnimationFrame(() => {
      if (el.isConnected && !el.classList.contains('hidden')) el.scrollIntoView({ block: 'start' });
    });
  }
  if (fresh && !silent) {
    log('dim', `[ > ] opened ${def.title}`);
    sound.open();
    def.hooks && def.hooks.opened && def.hooks.opened();
  }
  layout();
  emit();
  return el;
}

export function closeWindow(id) {
  const w = wsState(ws);
  if (!w.order.includes(id)) return;
  const el = winEl(id);
  const def = registry.get(id);
  w.order = w.order.filter(x => x !== id);
  w.hidden = w.hidden.filter(x => x !== id);
  delete w.float[id];
  save();
  if (def && def.hooks && def.hooks.closed) def.hooks.closed();
  if (el) {
    el.classList.add('closing');
    setTimeout(() => el.remove(), 160);
  }
  log('dim', `[ < ] closed ${def ? def.title : id}`);
  sound.close();
  if (focused === id) {
    focused = null;
    const rest = windowsOn(ws);
    if (rest.length) focusWindow(rest[rest.length - 1], { silent: true });
  }
  layout(); emit();
}

export function hideWindow(id) {
  const w = cur();
  if (!w.order.includes(id)) return;
  if (!w.hidden.includes(id)) w.hidden.push(id);
  save();
  const el = winEl(id);
  el && el.classList.add('hidden');
  log('dim', `[ - ] ${registry.get(id).title} hidden — apps brings it back`);
  if (focused === id) {
    focused = null;
    const rest = visibleWindows();
    if (rest.length) focusWindow(rest[rest.length - 1], { silent: true });
  }
  layout(); emit();
}

export function focusWindow(id, { silent = false, deferFocus = false, takeFocus = true } = {}) {
  const el = winEl(id);
  if (!el || el.classList.contains('hidden')) return;
  focused = id;
  for (const w of seat.querySelectorAll('.win')) w.classList.toggle('focus', w.dataset.win === id);
  const w = cur();
  w.z = (w.z || []).filter(x => x !== id).concat(id);
  if (takeFocus && typeof el.focus === 'function') { try { el.focus({ preventScroll: true }); } catch (_) { el.focus(); } }
  const hooks = registry.get(id) && registry.get(id).hooks;
  const token = ++focusToken;
  const run = () => {
    if (!takeFocus) return;
    if (token !== focusToken || focused !== id || !el.isConnected || el.classList.contains('hidden')) return;
    if (hooks && hooks.focus) hooks.focus();
  };
  /* A pointer is about to click something inside the window. Repainting now
     would replace the element under the finger before `click` fires, so the
     window's own controls would swallow the first click after it gains focus. */
  if (deferFocus) requestAnimationFrame(run); else run();
  if (!silent) announce(`${registry.get(id).title} window focused`);
  save(); emit();
}

export function focusNext(dir = 1) {
  const list = visibleWindows();
  if (!list.length) return;
  const i = list.indexOf(focused);
  const next = list[(i + (dir > 0 ? 1 : -1) + list.length) % list.length];
  focusWindow(next, { silent: true });
  log('dim', `[ > ] ${registry.get(next).title}`);
}

export const cycleWindows = () => focusNext(1);

/** Move the focused window within the layout — what Alt+Shift+H/L does. */
export function reorderFocused(dir) {
  const w = cur();
  const i = w.order.indexOf(focused);
  if (i === -1) return;
  const j = i + dir;
  if (j < 0 || j >= w.order.length) return;
  [w.order[i], w.order[j]] = [w.order[j], w.order[i]];
  save(); layout(); emit();
  log('dim', `[ ~ ] ${registry.get(focused).title} moved ${dir < 0 ? 'back' : 'forward'}`);
}

/** Grow or shrink the focused window's share of the seat. */
export function resizeFocused(dir) {
  const w = cur();
  if (w.float[focused]) {
    const f = w.float[focused];
    f.w = clamp(f.w + dir * 60, 260, seat.clientWidth);
    f.h = clamp(f.h + dir * 40, 160, seat.clientHeight);
    save(); layout(); return;
  }
  const ids = w.order.filter(id => !w.hidden.includes(id));
  if (ids.length < 2) return;
  const k = .12;
  w.weights[focused] = clamp((w.weights[focused] || 1) + dir * k, .4, 6);
  save(); layout(); emit();
}

export function toggleFloat(id = focused) {
  const w = cur();
  const el = winEl(id);
  if (!w.order.includes(id) || !el) return;
  if (w.float[id]) {
    delete w.float[id];
    el.classList.remove('float');
    log('dim', `[ ~ ] ${registry.get(id).title} tiled`);
  } else {
    w.float[id] = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    el.classList.add('float');
    w.monocle = null;
    log('dim', `[ ~ ] ${registry.get(id).title} floating`);
  }
  save(); layout(); emit();
}

export function toggleMonocle(id = focused) {
  const w = cur();
  if (!w.order.includes(id)) return;
  w.monocle = w.monocle === id ? null : id;
  save(); layout(); emit();
  log('dim', w.monocle ? `[ + ] ${registry.get(id).title} filled the seat` : '[ - ] back to the tiling');
}

export function setLayoutMode(mode) {
  const w = cur();
  w.mode = ['columns', 'rows'].includes(mode) ? mode : 'columns';
  w.monocle = null;
  save(); layout(); emit();
  log('dim', `[ ~ ] layout: ${w.mode}`);
}

export const layoutMode = () => cur().mode;

/** Fold a rail down to its label, or open it again. Only windows defined as
 *  rails fold; the seat keeps the space for whatever stays open. */
export function toggleFold(id = focused) {
  const w = cur();
  const def = registry.get(id);
  if (!def || !def.rail || !w.order.includes(id)) return;
  const on = !w.fold.includes(id);
  w.fold = on ? w.fold.concat(id) : w.fold.filter(x => x !== id);
  const el = winEl(id);
  const b = el && el.querySelector('.win-fold');
  if (b) b.setAttribute('aria-expanded', String(!on));
  save(); layout(); emit();
  announce(`${def.title} ${on ? 'folded' : 'open'}`);
}
export const isFolded = id => cur().fold.includes(id);

export function moveToWorkspace(id, n) {
  const from = wsState(ws);
  if (!from.order.includes(id)) return;
  if (n === 1) { log('dim', '[ ! ] the desk keeps its windows clear: try workspace 3'); return; }
  const to = wsState(n);
  from.order = from.order.filter(x => x !== id);
  delete from.float[id];
  if (!to.order.includes(id)) to.order.push(id);
  to.hidden = to.hidden.filter(x => x !== id);
  save();
  const el = winEl(id);
  if (el) el.remove();
  log('dim', `[ > ] ${registry.get(id).title} → workspace ${n}`);
  if (focused === id) {
    focused = null;
    const rest = visibleWindows();
    if (rest.length) focusWindow(rest[rest.length - 1], { silent: true });
  }
  layout(); emit();
}

export function goWorkspace(n, { silent = false } = {}) {
  n = clamp(n, 1, 4);
  if (n === ws) return;
  if (focused) lastFocus.set(ws, focused);
  ws = n;
  state.ws = n; save();
  document.body.dataset.ws = String(n);
  const w = cur();

  // build anything on this workspace that has never been rendered
  for (const id of w.order) ensureEl(id);
  for (const el of seat.querySelectorAll('.win')) {
    const id = el.dataset.win;
    const mine = w.order.includes(id);
    if (!mine) { el.classList.add('hidden'); continue; }
    el.classList.toggle('hidden', w.hidden.includes(id));
  }
  document.getElementById('desk').hidden = n !== 1;
  showStudy();

  focused = null;
  const list = windowsOn(n);
  const want = lastFocus.get(n);
  if (list.length) focusWindow(list.includes(want) ? want : list[0], { silent: true });

  layout(); emit();
  if (!silent) {
    const name = ['desk', 'lessons', 'manual', 'settings'][n - 1];
    log('dim', `[ ${n} ] workspace ${n} — ${name}`);
    announce(`Workspace ${n}, ${name}`);
  }
}

/* ── geometry ─────────────────────────────────────────────────────────────── */
export function layout() {
  if (layoutFrame) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    geometry();
    emit();
  });
}

/** Run the pending layout now rather than on the next frame. Tests and the
 *  screenshot tools use this so they never measure a half-placed seat; the
 *  machine itself always goes through the frame to keep paints batched. */
export function flushLayout() {
  if (layoutFrame) { cancelAnimationFrame(layoutFrame); layoutFrame = 0; }
  geometry();
  emit();
}

function geometry() {
  if (!seat) return;
  const stack = document.body.classList.contains('stack');
  const w = cur();
  const list = w.order.filter(id => !w.hidden.includes(id));

  if (stack) {                                  // small screens: a column of cards
    for (const id of list) {
      const el = winEl(id);
      if (!el) continue;
      el.style.cssText = '';
      el.classList.remove('float', 'monocle', 'folded');
    }
    document.getElementById('desk').hidden = ws !== 1;
    showStudy();
    return;
  }

  const g = GAP();
  const total = seat.clientWidth - g * 2;
  const height = seat.clientHeight - g * 2;
  const floats = list.filter(id => w.float[id]);
  const tiled = list.filter(id => !w.float[id]);

  // monocle: one window takes everything, everyone else steps out of the way
  if (w.monocle && list.includes(w.monocle)) {
    for (const id of list) {
      const el = winEl(id);
      if (!el) continue;
      const on = id === w.monocle;
      el.classList.toggle('monocle', on);
      el.classList.remove('folded');
      el.classList.toggle('float', !on && !!w.float[id]);
      if (on) {
        place(el, g, g, total, height);
      } else if (w.float[id]) {
        const f = clampFloat(w.float[id], g, g, total, height);
        place(el, f.x, f.y, f.w, f.h);
      } else {
        place(el, g + total, g, 1, 1);          // parked just off the seat
      }
    }
    return;
  }
  for (const el of seat.querySelectorAll('.win')) el.classList.remove('monocle');

  if (w.mode === 'rows') {
    const weights = tiled.map(id => w.weights[id] || 1);
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    let y = g;
    tiled.forEach((id, i) => {
      const h = Math.max(120, (height - g * (tiled.length - 1)) * weights[i] / sum);
      place(winEl(id), g, y, total, h);
      y += h + g;
    });
  } else {
    // a folded rail keeps a sliver; the open windows share what is left
    const folded = id => w.fold.includes(id) && tiled.length > 1;
    const open = tiled.filter(id => !folded(id));
    const room = total - g * (tiled.length - 1) - FOLD_W * (tiled.length - open.length);
    const weights = open.map(id => w.weights[id] || 1);
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    let x = g;
    tiled.forEach(id => {
      const wdt = folded(id) ? FOLD_W : Math.max(180, room * weights[open.indexOf(id)] / sum);
      place(winEl(id), x, g, wdt, height);
      x += wdt + g;
    });
  }
  for (const id of list) {
    const el = winEl(id);
    if (el) el.classList.toggle('folded', w.mode !== 'rows' && !w.float[id] && w.fold.includes(id) && tiled.length > 1);
  }

  for (const id of floats) {
    const f = clampFloat(w.float[id], g, g, total, height);
    const el = winEl(id);
    place(el, f.x, f.y, f.w, f.h);
    el.classList.add('float');
  }
}

function place(el, x, y, w, h) {
  if (!el) return;
  el.style.left = Math.round(x) + 'px';
  el.style.top = Math.round(y) + 'px';
  el.style.width = Math.round(w) + 'px';
  el.style.height = Math.round(h) + 'px';
}

const clampFloat = (f, minX, minY, maxW, maxH) => ({
  x: clamp(f.x, 0, Math.max(0, maxW + minX - 120)),
  y: clamp(f.y, 0, Math.max(0, maxH + minY - 60)),
  w: clamp(f.w, 260, maxW + minX),
  h: clamp(f.h, 160, maxH + minY),
});

/* ── dragging ─────────────────────────────────────────────────────────────── */
function startDrag(id, down) {
  if (down.button !== 0) return;
  const el = winEl(id);
  const w = cur();
  const startX = down.clientX, startY = down.clientY;
  let moved = false, wasFloat = !!w.float[id], dropTarget = null;

  const r0 = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };

  const move = e => {
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    if (!moved) {
      moved = true;
      el.classList.add('dragging');
      if (!wasFloat) {                       // a tiled window floats in your hand
        w.float[id] = { ...r0 };
        el.classList.add('float');
      }
    }
    const f = { x: r0.x + dx, y: r0.y + dy, w: r0.w, h: r0.h };
    const g = GAP();
    const horiz = dropZone(e.clientX, e.clientY);
    const target = horiz ? null : windowUnder(e.clientX, e.clientY, id);

    if (horiz) {
      const r = snapRect(horiz, g, seat.clientWidth - g * 2, seat.clientHeight - g * 2);
      w.float[id] = r;
      // half the seat is still a floating window: it just landed exactly there.
      // Keeping the class means the resize grips stay, which is the whole point
      // of snapping a window to a side.
      el.classList.add('float');
      showDrop(r, false);
      place(el, r.x, r.y, r.w, r.h);
    } else if (target) {
      el.classList.add('float');
      place(el, f.x, f.y, f.w, f.h);
      const tr = { x: target.offsetLeft, y: target.offsetTop, w: target.offsetWidth, h: target.offsetHeight };
      showDrop(tr, true);
    } else {
      el.classList.add('float');
      w.float[id] = clampFloat(f, g, g, seat.clientWidth - g * 2, seat.clientHeight - g * 2);
      place(el, w.float[id].x, w.float[id].y, w.float[id].w, w.float[id].h);
      hideDrop();
    }
    dropTarget = horiz ? { kind: 'snap', zone: horiz, rect: w.float[id] } : target ? { kind: 'swap', id: target.dataset.win } : null;
  };

  const up = () => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    hideDrop();
    el.classList.remove('dragging');
    if (!moved) { layout(); return; }
    if (dropTarget && dropTarget.kind === 'swap') {
      const other = dropTarget.id;
      const i = w.order.indexOf(id), j = w.order.indexOf(other);
      if (i !== -1 && j !== -1) { w.order[i] = other; w.order[j] = id; }
      delete w.float[id];                     // it slid back into the layout
      el.classList.remove('float');
      log('dim', `[ ~ ] ${registry.get(id).title} slid in beside ${registry.get(other).title}`);
    } else if (dropTarget && dropTarget.kind === 'snap') {
      log('dim', `[ ~ ] ${registry.get(id).title} snapped ${dropTarget.zone}`);
    } else {
      log('dim', `[ ~ ] ${registry.get(id).title} floating`);
    }
    save(); layout(); emit();
  };

  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
}

function startResize(id, dir, down) {
  const el = winEl(id);
  const w = cur();
  if (!w.float[id]) { w.float[id] = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }; el.classList.add('float'); }
  const f0 = { ...w.float[id] };
  const sx = down.clientX, sy = down.clientY;
  el.classList.add('dragging');

  const move = e => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    const f = { ...f0 };
    if (dir.includes('e')) f.w = f0.w + dx;
    if (dir.includes('s')) f.h = f0.h + dy;
    if (dir.includes('w')) { f.w = f0.w - dx; f.x = f0.x + dx; }
    if (dir.includes('n')) { f.h = f0.h - dy; f.y = f0.y + dy; }
    f.w = Math.max(260, f.w); f.h = Math.max(160, f.h);
    w.float[id] = f;
    place(el, f.x, f.y, f.w, f.h);
  };
  const up = () => {
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', up);
    el.classList.remove('dragging');
    save(); layout();
  };
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
}

/** Which seat edge the pointer is near, if any. */
function dropZone(x, y) {
  const r = seat.getBoundingClientRect();
  const m = 26, cx = x - r.left, cy = y - r.top;
  if (cy < m) return 'top';
  if (cy > r.height - m) return 'bottom';
  if (cx < m) return 'left';
  if (cx > r.width - m) return 'right';
  return null;
}

function snapRect(zone, g, W, H) {
  const halfW = (W - g) / 2, halfH = (H - g) / 2;
  switch (zone) {
    case 'left': return { x: g, y: g, w: halfW, h: H };
    case 'right': return { x: g + halfW + g, y: g, w: halfW, h: H };
    case 'top': return { x: g, y: g, w: W, h: halfH };
    default: return { x: g, y: g + halfH + g, w: W, h: halfH };
  }
}

const windowUnder = (x, y, except) => [...seat.querySelectorAll('.win:not(.hidden)')]
  .find(el => {
    if (el.dataset.win === except) return false;
    const b = el.getBoundingClientRect();
    return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
  });

function showDrop(rect, swap) {
  if (!drop) {
    drop = document.createElement('div');
    drop.id = 'drop';
    seat.appendChild(drop);
  }
  drop.classList.add('on');
  drop.classList.toggle('swap', !!swap);
  place(drop, rect.x, rect.y, rect.w, rect.h);
}
function hideDrop() { if (drop) drop.classList.remove('on'); }

/* ── window menu ──────────────────────────────────────────────────────────── */
function openMenu(id, x, y) {
  closeMenu();
  const w = cur();
  const isFloat = !!w.float[id];
  menu = document.createElement('div');
  menu.id = 'win-menu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `
    <button role="menuitem" data-act="max">${w.monocle === id ? 'Back to the tiling' : 'Fill the seat'} <kbd>alt M</kbd></button>
    <button role="menuitem" data-act="float">${isFloat ? 'Tile it again' : 'Float it'} <kbd>alt F</kbd></button>
    <button role="menuitem" data-act="hide">Hide window <kbd>alt Z</kbd></button>
    <hr>
    <button role="menuitem" data-act="cols">Columns layout <kbd>alt ⇧ M</kbd></button>
    <button role="menuitem" data-act="rows">Rows layout</button>
    <hr>
    <button role="menuitem" data-act="ws2">Move to 2 · lessons</button>
    <button role="menuitem" data-act="ws3">Move to 3 · manual</button>
    <button role="menuitem" data-act="ws4">Move to 4 · settings</button>
    <hr>
    <button role="menuitem" data-act="close">Close <kbd>alt Q</kbd></button>`;
  document.body.appendChild(menu);
  menu.style.left = Math.min(x, innerWidth - menu.offsetWidth - 8) + 'px';
  menu.style.top = Math.min(y, innerHeight - menu.offsetHeight - 8) + 'px';
  menu.querySelectorAll('[data-act]').forEach(b => b.onclick = () => {
    const act = b.dataset.act;
    closeMenu();
    if (act === 'max') toggleMonocle(id);
    else if (act === 'float') toggleFloat(id);
    else if (act === 'hide') hideWindow(id);
    else if (act === 'cols') setLayoutMode('columns');
    else if (act === 'rows') setLayoutMode('rows');
    else if (act === 'close') closeWindow(id);
    else if (act.startsWith('ws')) moveToWorkspace(id, +act.slice(2));
  });
  menu.focus();
  setTimeout(() => addEventListener('pointerdown', onOutside, true), 0);
}
function onOutside(e) { if (menu && !menu.contains(e.target)) closeMenu(); }
export function closeMenu() {
  removeEventListener('pointerdown', onOutside, true);
  if (menu) { menu.remove(); menu = null; }
}
export const menuOpen = () => !!menu;

/* ── empty seat ───────────────────────────────────────────────────────────── */
let emptyEl = null;
export function paintEmptySeat() {
  if (!seat) return;
  const none = visibleWindows().length === 0;
  if (!emptyEl && none && ws !== 1 && ws !== 2) {
    emptyEl = document.createElement('div');
    emptyEl.className = 'seat-empty';
    seat.appendChild(emptyEl);
  }
  if (!emptyEl) return;
  emptyEl.hidden = !none || ws === 1 || ws === 2;
  if (emptyEl.hidden) return;
  emptyEl.innerHTML = `<div class="box">
      <div class="big">workspace ${ws} is empty</div>
      <p class="hint">Nothing is running here. Open a window, or head back to the desk.</p>
      <div class="row">
        <button class="btn" data-open="course">Course</button>
        <button class="btn" data-open="session">Session</button>
        <button class="btn" data-open="man">Man page</button>
        <button class="btn primary" data-open="home">Desk</button>
      </div>
    </div>`;
  emptyEl.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
    if (b.dataset.open === 'home') goWorkspace(1); else openWindow(b.dataset.open);
  });
}

/* ── boot ─────────────────────────────────────────────────────────────────── */
export function initWM(seatEl) {
  seat = seatEl;
  document.body.dataset.ws = String(ws);
  document.getElementById('desk').hidden = ws !== 1;
  showStudy();

  const ro = new ResizeObserver(() => layout());
  ro.observe(seat);
  addEventListener('resize', () => {
    document.body.classList.toggle('stack', innerWidth < 1000);
    layout();
  });
  document.body.classList.toggle('stack', innerWidth < 1000);

  for (const id of visibleWindows()) ensureEl(id);
  layout();
  paintEmptySeat();
  onWM(() => paintEmptySeat());
  return { ws, focused };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** #study is shown on workspace 2 only, the way #desk is shown on workspace 1. */
function showStudy() {
  const el = document.getElementById('study');
  if (el) el.hidden = ws !== 2;
}
