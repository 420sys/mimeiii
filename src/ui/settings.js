/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/SETTINGS
   Workspace 4, right window: the machine's own switches. Effects (which is
   also how much the desk moves), sound, rain, tonight's goal, the keyboard
   map, the honest state of your progress, and the one destructive button in
   the whole site.
   ════════════════════════════════════════════════════════════════════════════ */

import { defineWindow, openWindow, activeWs, isOpen, onWM } from '../core/wm.js';
import { state, save, clearProgress, progressSummary, dayKey, progressFile, readProgressFile, applyProgress, storageTrouble, clearTrouble, hasBackup, seeBackup, BAK_KEY } from '../core/state.js';
import { fxPreference, fxLevel, setFxPreference, setRain, rainWanted, setPeek, onFx, FX_PREFS } from '../core/effects.js';
import { sound } from '../core/sound.js';
import { log, announce } from '../core/journal.js';
import { KEYMAP } from '../core/keys.js';
import { escAttr as esc, icon, onPaint, repaint } from './window.js';
import { paintSessions } from './session.js';
import { paintCab } from './cab.js';
import { sceneNow } from './desktop.js';
import { showGoals, showJournal } from './goals.js';

let api = null, bodyEl = null, fileEl = null;

const LEVEL_WORDS = { 3: 'full', 2: 'balanced', 1: 'minimal', 0: 'static' };

/* the inline flows: nothing here asks the browser (no confirm, no alert); every step is a row on this page */
let stage = 'idle';                       // 'clear' while the two-step Clear is open
let pending = null;                       // a checked import file waiting for a yes: { name, data, sum }
let note = '', want = '';     // the line under Keep a copy · the id to focus after the next paint
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const fileName = () => `mimei-progress-${dayKey()}.json`;
/* tonight's goal, in minutes: what the desk's bar fills up to */
const GOALS_MIN = [30, 45, 60, 90, 120];
const goalWord = m => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60}` : `${m / 60} h`);
/* the desk's word for an effects level: Full, Calm or Still */
const deskMotion = lvl => (lvl >= 2 ? 'full' : lvl === 1 ? 'calm' : 'still');

/** Hand the browser a text file to save. */
function download(name, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function exportProgress() {
  const s = progressSummary(), name = fileName();
  download(name, progressFile());
  note = `Saved ${name}: ${plural(s.done, 'stop', 'stops')} finished, ${plural(s.cps, 'checkpoint', 'checkpoints')}. Keep it somewhere safe; Import brings it back.`;
  log('dim', `[ * ] progress exported — ${name}`);
  announce('Progress exported.');
}

/** Step one of Clear: ask on the page, with the export offered first. */
function askClear() {
  stage = 'clear'; pending = null; note = '';
  want = 'set-reset-export';
  const s = progressSummary();
  announce(`Clear progress? This forgets ${plural(s.done, 'finished stop', 'finished stops')} and ${plural(s.cps, 'checkpoint', 'checkpoints')}. Export a copy first, or choose Yes, clear it.`);
  paint();
}

function focusWant() {
  const el = want && bodyEl ? bodyEl.querySelector(`#${want}`) : null;
  want = '';
  if (el) el.focus();
}

const noteHtml = () => (note ? `<p class="set-note">${esc(note)}</p>` : '');

function downloadBackup() {
  let text = '';
  try { text = localStorage.getItem(BAK_KEY) || ''; } catch (_) { /* unreadable */ }
  if (text) download(`${BAK_KEY}.txt`, text, 'text/plain');
}

/** The file picker answered: read it and check it. Nothing is replaced until the learner says yes. */
async function onFile() {
  const f = fileEl && fileEl.files && fileEl.files[0];
  if (!f) return;
  stage = 'idle'; pending = null;
  let r = { ok: false, why: 'it is too big to be a progress file' };
  if (f.size <= 1e6) {
    try { r = readProgressFile(await f.text()); } catch (_) { r = { ok: false, why: 'it could not be read' }; }
  }
  if (r.ok) {
    pending = { name: f.name, data: r.data, sum: r.sum };
    note = '';
    want = 'set-in-yes';
    announce(`${f.name} holds ${plural(r.sum.done, 'finished stop', 'finished stops')} and ${plural(r.sum.cps, 'checkpoint', 'checkpoints')}. Replace your progress with it, or cancel.`);
  } else {
    note = `Not imported: ${f.name} — ${r.why}. Nothing was changed.`;
    announce(note);
  }
  paint();
}

function troubleHtml(bad) {
  if (bad === 'unsaved') return '<p class="set-warn" role="status">This browser is not keeping your progress: its storage is full or blocked. Export a copy now so nothing is lost.</p>';
  if (bad !== 'unread') return '';
  return `<p class="set-warn" role="status">Your saved progress could not be read, so this session started fresh. The old text is kept in this browser as <code>${esc(BAK_KEY)}</code>; the older copy row below downloads it.</p>`;
}

/** Step two of Import: the learner said yes. */
function doImport() {
  if (!pending) return;
  const name = pending.name;
  applyProgress(pending.data);
  clearTrouble();
  pending = null;
  const s = progressSummary();
  note = `Imported ${name}: ${plural(s.done, 'stop', 'stops')} finished, ${plural(s.cps, 'checkpoint', 'checkpoints')}.`;
  log('ok', `[ OK ] progress imported — ${name}`);
  announce(note);
  want = 'set-import';
  paintSessions(true);
  repaint();
  paint();
}

/** Step two of Clear: the learner said yes. */
function doClear() {
  clearProgress();
  stage = 'idle'; note = '';
  log('er', '[ ! ] progress cleared — the line starts again at 1.0');
  sound.close();
  announce('Progress cleared.');
  want = 'set-reset';
  paintSessions(true);
  repaint();
  paint();
}

function importHtml() {
  if (!pending) return '';
  const s = pending.sum, now = progressSummary();
  return `<div class="set-warn" role="group" aria-label="Confirm import">
      <p><b>${esc(pending.name)}</b> holds ${plural(s.done, 'finished stop', 'finished stops')}, ${plural(s.cps, 'checkpoint', 'checkpoints')} and ${plural(s.days, 'day', 'days')}. Importing replaces what this browser has now (${now.done} finished, ${plural(now.cps, 'checkpoint', 'checkpoints')}).</p>
      <div class="set-acts"><button class="btn" id="set-in-yes">Replace my progress</button><button class="btn ghost" id="set-in-no">Cancel</button></div>
    </div>`;
}

function clearHtml(sum) {
  if (stage !== 'clear') {
    return `<div class="srow">
          <span class="d">start over <span class="sub">forgets every ticked checkpoint — there is no undo</span></span>
          <button class="btn ghost" id="set-reset">Clear progress…</button>
        </div>`;
  }
  return `<div class="set-warn" id="set-sure" role="group" aria-label="Confirm clearing progress">
      <p>This forgets ${plural(sum.done, 'finished stop', 'finished stops')} and ${plural(sum.cps, 'checkpoint', 'checkpoints')} in this browser, and there is no undo. Export a copy first?</p>
      <div class="set-acts"><button class="btn" id="set-reset-export">Export a copy first</button><button class="btn ghost danger" id="set-reset-yes">Yes, clear it</button><button class="btn ghost" id="set-reset-no">Keep my progress</button></div>${noteHtml()}
    </div>`;
}

function row(label, sub, control) {
  return `<div class="srow"><span class="d">${label}${sub ? ` <span class="sub">${sub}</span>` : ''}</span>${control}</div>`;
}
const sw = (on, id, label) => `<button class="sw" role="switch" aria-checked="${on}" id="${id}" aria-label="${label}"></button>`;

function paint() {
  if (!bodyEl) return;
  const had = bodyEl.contains(document.activeElement) ? document.activeElement.id : '';
  const pref = fxPreference();
  const level = fxLevel();
  const sum = progressSummary();

  bodyEl.innerHTML = `
    <div class="pane">
      <section class="rowset">
        <h3>the machine</h3>
        ${row('scene', `now ${sceneNow()} · night turns late from 01:30 to 05:00 · ice is light, here, on the desk and on the climb`, `
          <span class="segbar" role="group" aria-label="Scene">
            ${['night', 'ice'].map(k => `<button data-scene="${k}" id="set-scene-${k}" aria-pressed="${(sceneNow() === 'ice') === (k === 'ice')}">${k}</button>`).join('')}
          </span>`)}
        ${row('effects', `now ${LEVEL_WORDS[level]} (level ${level}) · the desk moves: ${deskMotion(level)}`, `
          <span class="segbar" role="group" aria-label="Effects level">
            <button data-fx="auto" id="set-fx-auto" aria-pressed="${pref === 'auto'}">auto</button>
            ${FX_PREFS.map(p => `<button data-fx="${p}" id="set-fx-${p}" aria-pressed="${pref === p}">${p}</button>`).join('')}
          </span>`)}
        ${row('sound', 'the city at night and soft clicks, made in the browser · half volume in lessons', sw(sound.on, 'set-sound', 'sound'))}
        ${row('rain', 'the canvas outside these windows', sw(rainWanted(), 'set-rain', 'rain'))}
        ${row('the city only', 'everything steps aside so you can see the city', `
          <button class="btn ghost" id="set-peek">${icon('deck')} peek <kbd>alt b</kbd></button>`)}
      </section>

      <section class="rowset">
        <h3>what you have done</h3>
        ${troubleHtml(storageTrouble())}
        ${row('tonight’s goal', 'counted while a lesson is open and you have used the page in the last 15 minutes · the night ends at 5 a.m.', `
          <span class="segbar" role="group" aria-label="Tonight’s goal">
            ${GOALS_MIN.map(m => `<button data-goal="${m}" id="set-goal-${m}" aria-pressed="${state.goalMins === m}">${goalWord(m)}</button>`).join('')}
          </span>`)}
        ${row('sessions finished', `${sum.done} of ${sum.total} on the line`, `<b>${sum.done}/${sum.total}</b>`)}
        ${row('checkpoints', 'ticked in lessons, runbooks and the goals window', `<b>${sum.cps}/${sum.totalCps}</b>`)}
        ${row('streak', 'days in a row with MIMEI open', `<b>${sum.streak} ${sum.streak === 1 ? 'day' : 'days'}</b>`)}
        <div class="srow">
          <span class="d">look at it <span class="sub">tick checkpoints, read the log</span></span>
          <span class="row" style="display:flex;gap:6px">
            <button class="btn ghost" id="set-goals">Goals</button>
            <button class="btn ghost" id="set-journal">Journal</button>
          </span>
        </div>
        <div class="srow">
          <span class="d">keep a copy <span class="sub">one file: what you ticked and where you stopped</span></span>
          <span class="set-acts"><button class="btn ghost" id="set-export">Export</button><button class="btn ghost" id="set-import">Import…</button></span>
        </div>
        ${stage === 'clear' ? '' : noteHtml()}
        ${importHtml()}
        ${hasBackup() ? row('older copy', `kept in this browser as <code>${esc(BAK_KEY)}</code> when a save failed or could not be read`, '<button class="btn ghost" id="set-bak">Download the older copy</button>') : ''}
        ${clearHtml(sum)}
      </section>

      <section class="rowset">
        <h3>keyboard</h3>
        <div class="kbdlist">
          ${KEYMAP.map(({ k, d }) => `<span class="ks">${k.map(x => `<kbd>${x}</kbd>`).join('')}</span><span class="d">${d}</span>`).join('')}
        </div>
      </section>

      <section class="about" style="margin-top:4px">
        <p><b>MIMEI 1.0</b> — a quiet desk for learning Roblox Luau from nothing.
           Nothing on this site runs Luau: every script goes into your own Roblox Studio.</p>
        <p>No build step, no framework, no tracking. Your progress lives in this
           browser only (<code>${'localStorage'}</code> key <code>ossuary-1</code>, the name it had before MIMEI) — it is never sent anywhere. Export keeps a copy as a file you can bring back.</p>
        <p>The desk’s city, its sign and its sound are drawn in the browser from the pictures in <code>assets/crane/</code>. Inter and IBM Plex Mono are under the SIL Open Font License (<code>assets/fonts/</code>).</p>
        <p>The course text lives in <code>content/*.md</code>; the machine reads it at startup.</p>
      </section>
    </div>`;

  bodyEl.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => {
    const pref = b.dataset.fx;
    setFxPreference(pref);
    sound.click();
    log('dim', `[ * ] effects set to ${pref}`);
    paint();
    repaint();
  });
  bodyEl.querySelectorAll('[data-scene]').forEach(b => b.onclick = () => {
    const k = b.dataset.scene;
    if ((sceneNow() === 'ice') === (k === 'ice')) return;
    state.scene = k;
    save();
    sound.click();
    sound.scene(sceneNow());
    log('dim', `[ * ] scene: ${k}`);
    paintCab();
    paint();
  });
  bodyEl.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => {
    const m = +b.dataset.goal;
    if (state.goalMins === m) return;
    state.goalMins = m;
    save();
    sound.click();
    log('dim', `[ * ] tonight's goal: ${goalWord(m)}`);
    paint();
    repaint();
  });
  bodyEl.querySelector('#set-sound').onclick = () => {
    sound.set(!sound.on);
    paint();
    repaint();
  };
  bodyEl.querySelector('#set-rain').onclick = () => {
    setRain(!rainWanted());
    paint();
    repaint();
  };
  bodyEl.querySelector('#set-peek').onclick = () => setPeek(true, { focusBack: true });
  bodyEl.querySelector('#set-goals').onclick = () => showGoals();
  bodyEl.querySelector('#set-journal').onclick = () => showJournal();
  const on = (id, fn) => { const el = bodyEl.querySelector(`#${id}`); if (el) el.onclick = fn; };
  on('set-export', () => { exportProgress(); paint(); });
  on('set-import', () => { if (fileEl) { fileEl.value = ''; fileEl.click(); } });
  on('set-bak', downloadBackup);
  on('set-in-yes', doImport);
  on('set-in-no', () => { pending = null; want = 'set-import'; paint(); });
  on('set-reset', askClear);
  on('set-reset-export', () => { exportProgress(); paint(); });
  on('set-reset-yes', doClear);
  on('set-reset-no', () => { stage = 'idle'; note = ''; want = 'set-reset'; paint(); });
  if (!want) want = had;                 // a repaint keeps the focus on the same control
  focusWant();

  if (api) {
    api.setTitle('Settings');
  }
}

export const settingsWindow = defineWindow({
  id: 'settings',
  title: 'Settings',
  tag: 'this machine',
  icon: 'settings',
  ws: 4,
  weight: 1,
  build(body, winApi) {
    api = winApi;
    bodyEl = document.createElement('div');
    bodyEl.id = 'settings-body';
    body.appendChild(bodyEl);
    /* the picker lives outside the repainted body, so a repaint never swallows its answer */
    fileEl = Object.assign(document.createElement('input'), { type: 'file', id: 'set-import-file', accept: 'application/json,.json', hidden: true });
    fileEl.setAttribute('aria-label', 'Choose a progress file to import');
    fileEl.onchange = onFile;
    body.appendChild(fileEl);
    winApi.showFoot(false);
    paint();
    onFx(() => paint());
    onPaint(() => paint());
    /* the older copy counts as seen once Settings is on screen, however it got there (the desk note, the keys, the launcher) */
    const seen = () => { if (activeWs() === 4 && isOpen('settings') && seeBackup()) repaint(); };
    onWM(seen);
    seen();
    return { focus() { if (seeBackup()) repaint(); else paint(); } };
  },
});

export function openSettings() {
  openWindow('settings');
  if (seeBackup()) repaint();       // the desk's notice has done its job
  paint();
}
