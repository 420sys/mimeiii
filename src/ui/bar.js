/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/BAR
   The cab's bar (workspaces 2, 3 and 4; the desk has its own menu). One slim
   line in the desk's voice: the mark, MIMEI and the four workspaces as
   numbers on the left, this workspace's words in the middle, the live
   readouts and the two global controls on the right.

   The middle does what the rail used to: every window that lives here is a
   word. The one in front has the lamp (the warm edge on its pane says the
   same); clicking it puts it away, clicking any other brings it forward. A
   workspace can lend the middle its own words instead (lendBarMiddle): the
   study shows the open lesson's steps there, the lamp on the one you are
   reading. When the words do not all fit, only the lit one keeps its name.
   The lamp glides from word to word (at once on Still).
   ════════════════════════════════════════════════════════════════════════════ */

import {
  activeWs, focusedId, goWorkspace, hideWindow, isFocused, onWM, windowDef, windowsHere, windowsOn,
} from '../core/wm.js';
import { summon } from '../core/keys.js';
import { progressSummary } from '../core/state.js';
import { sound } from '../core/sound.js';
import { onPaint, escAttr } from './window.js';
import { openLauncher } from './launcher.js';

const WS = [
  { n: 1, name: 'desk', title: 'The desk' },
  { n: 2, name: 'lessons', title: 'Lessons: the study' },
  { n: 3, name: 'manual', title: 'The manual, the terminal and the files' },
  { n: 4, name: 'settings', title: 'Settings' },
];
const p2 = n => String(n).padStart(2, '0');

/* the windows each workspace keeps, in the bar's order; anything else moved here joins after them */
const HOME = { 3: ['man', 'tty', 'files'], 4: ['settings'] };
const WORD = { man: 'manual', tty: 'terminal', files: 'files', settings: 'settings', system: 'goals', course: 'course', session: 'lesson' };
const word = id => WORD[id] || (windowDef(id) ? windowDef(id).title.toLowerCase() : id);

let els = {};
let clockTimer = 0;
const lent = {};            // workspace -> { label, key(), items(), go(id) }: words lent to the middle

/** A workspace lends the middle its own words (the study: the lesson's steps). items() gives
 *  [{ id, num, name, title, here, done }]; go(id) is what a click on one does. */
export function lendBarMiddle(ws, words) {
  lent[ws] = words;
  if (els.task) { els.task.dataset.key = ''; paintWins(); }
}
/** The lender's words changed (the step being read, a step cleared). */
export function repaintBarMiddle() { if (els.task) paintWins(); }

const stillNow = () => document.documentElement.dataset.fx === '0' || matchMedia('(prefers-reduced-motion: reduce)').matches;

function clockText() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function paintClock() {
  if (!els.clock) return;
  const now = new Date();
  els.clock.textContent = clockText();
  els.clock.dateTime = now.toISOString();
  els.clock.title = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** The middle: this workspace's windows, the one in front with the lamp (or the words a workspace lent it). */
function paintWins() {
  if (!els.task) return;
  const n = activeWs();
  if (lent[n]) { paintLent(n, lent[n]); return; }
  if (els.task.classList.contains('lent')) {
    els.task.classList.remove('lent', 'fit-1', 'fit-2');
    els.task.setAttribute('aria-label', 'Windows on this workspace');
  }
  const shown = windowsOn(n);
  const ids = [...new Set([...(HOME[n] || []), ...windowsHere(n)])].filter(id => windowDef(id));
  const key = `${n}|${ids.join(',')}|${shown.join(',')}|${focusedId()}`;
  if (els.task.dataset.key === key) return;
  els.task.dataset.key = key;
  const had = els.task.contains(document.activeElement) ? document.activeElement.dataset.win : null;
  els.task.innerHTML = ids.map(id => {
    const def = windowDef(id), f = isFocused(id), on = shown.includes(id);
    const tip = f ? `${def.title}: in front, click to put it away (Alt+Z)` : on ? `${def.title}: bring it forward` : `${def.title}: open it`;
    return `<button type="button" class="bw${f ? ' focus' : ''}${on ? ' open' : ''}" data-win="${id}"
        aria-pressed="${f}" title="${escAttr(tip)}"><i class="bt-dot" aria-hidden="true"></i><span class="bt-name">${escAttr(word(id))}</span></button>`;
  }).join('');
  els.task.querySelectorAll('.bw').forEach(b => b.onclick = () => {
    sound.click();
    const id = b.dataset.win;
    // the dock behaviour everyone already knows: the window in front goes away, any other comes forward
    if (isFocused(id)) { hideWindow(id); return; }
    summon(id);
  });
  /* a repaint under the keyboard keeps the cursor on the same word */
  if (had) { const b = els.task.querySelector(`.bw[data-win="${had}"]`); if (b) b.focus({ preventScroll: true }); }
  glide();
}

/** Draw lent words afresh for a new lesson; otherwise move the lamp in place. */
function paintLent(n, own) {
  const t = els.task;
  const key = `${n}|lent|${own.key()}`;
  if (t.dataset.key === key) return;
  t.dataset.key = key;
  const items = own.items();
  const struct = items.map(it => `${it.id}:${it.name}`).join('|');
  let fresh = false;
  if (!t.classList.contains('lent')) { t.classList.add('lent'); t.dataset.struct = '-'; }
  t.setAttribute('aria-label', own.label);
  if (t.dataset.struct !== struct) {
    fresh = true;
    t.dataset.struct = struct;
    const had = t.contains(document.activeElement) ? document.activeElement.dataset.id : null;
    t.innerHTML = items.map(it => `<button type="button" class="bw bs" data-id="${escAttr(it.id)}"><i class="bt-dot" aria-hidden="true"></i><span class="bt-num">${escAttr(it.num)}</span><span class="bt-name">${escAttr(it.name)}</span></button>`).join('');
    t.querySelectorAll('.bs').forEach(b => b.onclick = () => { sound.click(); own.go(b.dataset.id); });
    if (had) { const b = t.querySelector(`.bs[data-id="${had}"]`); if (b) b.focus({ preventScroll: true }); }
  }
  const byId = new Map(items.map(it => [it.id, it]));
  t.querySelectorAll('.bs').forEach(b => {
    const it = byId.get(b.dataset.id);
    if (!it) return;
    b.classList.toggle('focus', !!it.here);
    b.classList.toggle('done', !!it.done);
    if (it.here) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    if (b.title !== it.title) b.title = it.title;
  });
  fitLent();
  glide(fresh);
}

/** Fit full names, then only the current name, then compact words. */
function fitLent() {
  const t = els.task, bs = [...t.querySelectorAll('.bs')];
  if (!bs.length) { t.classList.remove('fit-1', 'fit-2'); return; }
  const room = t.clientWidth;
  if (!room) return;
  const parts = bs.map(b => ({ here: b.classList.contains('focus'), num: b.querySelector('.bt-num').scrollWidth, name: b.querySelector('.bt-name').scrollWidth }));
  const GAP = 4, DOT = 13, NAME = 8;
  const need = (pad, named, cap) => parts.reduce((a, p) => a + pad + DOT + p.num + (named(p) ? NAME + Math.min(cap, p.name) : 0), 0) + GAP * (parts.length - 1);
  const fit = need(24, () => true, 1e4) <= room ? '' : need(24, p => p.here, 220) <= room ? 'fit-1' : 'fit-2';
  t.classList.toggle('fit-1', fit === 'fit-1');
  t.classList.toggle('fit-2', fit === 'fit-2');
}

/* One warm dot glides to the lit word. */
let lampX = null, lampY = 0, lampRaf = 0, lampUntil = 0;
function glide(jump = false) {
  const t = els.task;
  if (!t) return;
  if (!els.lamp) {
    els.lamp = document.createElement('i');
    els.lamp.className = 'bt-lamp';
    els.lamp.setAttribute('aria-hidden', 'true');
  }
  if (els.lamp.parentElement !== t) t.appendChild(els.lamp);
  if (jump) lampX = null;
  lampUntil = performance.now() + 900;
  if (!lampRaf) lampRaf = requestAnimationFrame(lampStep);
}
function lampStep() {
  lampRaf = 0;
  const t = els.task, lamp = els.lamp;
  if (!t || !lamp) return;
  const dot = t.querySelector('.bw.focus .bt-dot');
  if (!dot || !t.clientWidth) {
    t.classList.remove('has-lamp'); lamp.style.opacity = '0'; lampX = null; return;
  }
  const tr = t.getBoundingClientRect(), r = dot.getBoundingClientRect();
  const x = r.left - tr.left + r.width / 2 - 2.5, y = r.top - tr.top + r.height / 2 - 2.5;
  if (lampX === null || stillNow()) { lampX = x; lampY = y; } else { lampX += (x - lampX) * .2; lampY += (y - lampY) * .2; }
  lamp.style.transform = `translate(${lampX.toFixed(2)}px, ${lampY.toFixed(2)}px)`;
  lamp.style.opacity = '1';
  t.classList.add('has-lamp');
  if (Math.abs(x - lampX) > .25 || performance.now() < lampUntil) lampRaf = requestAnimationFrame(lampStep);
}

function paintStatus() {
  if (!els.cps) return;
  const sum = progressSummary();
  els.cps.querySelector('.v').textContent = `${sum.cps}/${sum.totalCps}`;
  if (els.net) {
    const on = navigator.onLine;
    els.net.classList.toggle('off', !on);
    els.net.querySelector('.sr-only').textContent = on ? 'online' : 'offline';
    els.net.setAttribute('aria-label', `Network ${on ? 'online' : 'offline'}`);
    els.net.title = `Network ${on ? 'online' : 'offline'}`;
  }
}

export function paintBar() {
  if (!els.ws) return;
  const now = activeWs();
  const key = String(now);
  if (els.ws.dataset.key !== key) {
    els.ws.dataset.key = key;
    els.ws.innerHTML = WS.map(w => {
      const here = now === w.n;
      return `<button class="ws" data-ws="${w.n}" title="${w.title} (Alt+${w.n})"
          ${here ? 'aria-current="page"' : ''}><span class="num" aria-hidden="true">${p2(w.n)}</span><small class="ws-name${here ? '' : ' sr-only'}">${w.name}</small></button>`;
    }).join('');
    els.ws.querySelectorAll('.ws').forEach(b => b.onclick = () => {
      sound.click();
      goWorkspace(+b.dataset.ws);
    });
  }
  const active = WS.find(w => w.n === now);
  els.ws.dataset.active = active ? active.name : 'desk';
  paintWins();
  paintStatus();
  paintClock();
}

export function initBar() {
  els = {
    ws: document.getElementById('workspaces'),
    task: document.getElementById('bar-task'),
    cps: document.getElementById('bar-cps'),
    net: document.getElementById('bar-net'),
    clock: document.getElementById('bar-clock'),
  };
  if (!els.ws) return;

  document.getElementById('brand').onclick = () => { sound.click(); goWorkspace(1); };
  document.getElementById('mod-launch').onclick = () => openLauncher();
  document.getElementById('mod-apps').onclick = () => openLauncher('windows');

  addEventListener('online', paintStatus);
  addEventListener('offline', paintStatus);
  /* A new width changes what fits and where the lamp sits. */
  addEventListener('resize', () => { if (els.task && els.task.classList.contains('lent')) fitLent(); glide(true); }, { passive: true });
  clockTimer = setInterval(paintClock, 10000);

  onWM(paintBar);
  onPaint(paintBar);
  paintBar();
  paintClock();
}

export function stopBarClock() {
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = 0;
}
