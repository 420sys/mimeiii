/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/DESKTOP
   Workspace 1 is the desk: the city at night from the top of a crane, and
   an old LED sign hanging off the hook that says where you are in the
   course. The picture is the whole screen; the words are three quiet lines
   in the top-right corner (the weather, the clock, the date) and a menu
   that only comes up when the mouse moves (or Esc, or Tab) and goes again.

     · the sign shows the lesson you are in, or the first one you have not
       finished: RESUME / BEGIN / REVIEW with its checkpoints and minutes.
       The first time you come back after finishing a unit it says COMPLETE.
       ← and → flip it through every lesson; Enter or a click opens the one
       it shows (the leap, desk/leap.js). The sign is a real button: its
       words are the same as text for a screen reader, and a flip is read out.
     · the menu: the 未 mark and workspaces 01–04; tonight's goal and the
       study nights of the week (core/nights.js); sound, Night or Ice, and
       the motion setting (Full / Calm / Still is the site's effects setting:
       one switch, not two).
     · the pictures and the moving parts (desk/world.js) load the first time
       the desk is seen, and the desk clock holds whenever it is not on
       screen. Every fade here runs on that clock, so a film of the desk
       (?manual) is frame-exact.
   ════════════════════════════════════════════════════════════════════════════ */

import { lessonById, writtenLessons } from '../data/course.js';
import { backupUnseen, isDone, missList, progressSummary, save, state } from '../core/state.js';
import { announce, log, onLog } from '../core/journal.js';
import { activeWs, focusedId, goWorkspace, menuOpen, onWM, openWindow } from '../core/wm.js';
import { fxLevel, onFx, setFxPreference } from '../core/effects.js';
import { sound } from '../core/sound.js';
import { overlayOpen } from '../core/keys.js';
import { goalSeconds, hm, isNight, onNights, tonight, week } from '../core/nights.js';
import { escAttr as esc, onPaint } from './window.js';
import { currentLessonId, openLesson } from './session.js';
import { openMan } from './man.js';
import { clock, clamp, ease, onFrame, startClock, stopClock, tween, wait } from '../desk/clock.js';
import { completePage, finishedUnits, lessonPage } from '../desk/pages.js';
import { SCENES, sceneFor } from '../desk/scenes.js';
import { leap } from '../desk/leap.js';

let desk = null, els = {};
const q = sel => desk && desk.querySelector(sel);
const qs = new URLSearchParams(location.search);
const booting = () => document.body.classList.contains('booting');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── time: live, or pinned for a screenshot (?time=23:47) or a film (?manual) ── */
let T0 = null;
{
  const t = /^(\d{1,2}):(\d{2})$/.exec(qs.get('time') || '');
  if (t) { T0 = clock.manual ? new Date(2026, 10, 5) : new Date(); T0.setHours(+t[1], +t[2], 0, 0); }
  else if (clock.manual) T0 = new Date(2026, 10, 5, 23, 47, 38);
}
const now = () => (T0 ? new Date(T0.getTime() + clock.t * 1000) : new Date());

/* ── motion and scene ─────────────────────────────────────────────────────── */
const MOTION = ['full', 'calm', 'still'];
const PREF_FOR = { full: 'full', calm: 'minimal', still: 'static' };
const forcedMotion = MOTION.includes(qs.get('motion')) ? qs.get('motion') : /[?&]still\b/.test(location.search) ? 'still' : null;
/* effects level 2 or 3 is Full, 1 is Calm, 0 (and reduced motion, which forces 0) is Still */
const motionFor = lvl => (lvl >= 2 ? 'full' : lvl === 1 ? 'calm' : 'still');
const motionNow = () => forcedMotion || motionFor(fxLevel());
const reducedOS = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const forcedScene = ['night', 'late', 'ice'].includes(qs.get('scene')) ? qs.get('scene') : null;
const sceneNow = () => forcedScene || sceneFor(state.scene, now());

/* ── what the sign is about ───────────────────────────────────────────────── */
/** The stop the desk is about: the open lesson if it is not finished, else the next one not finished after it
 *  (or the first one not finished anywhere), else the open lesson or the first. */
export function hereStop() {
  const all = writtenLessons();
  if (!all.length) return null;
  const open = lessonById(currentLessonId());
  const at = open ? all.findIndex(l => l.id === open.id) : -1;
  if (at >= 0 && !isDone(open.id)) return all[at];
  const after = at >= 0 ? all.slice(at + 1).find(l => !isDone(l.id)) : null;
  return after || all.find(l => !isDone(l.id)) || (at >= 0 ? all[at] : all[0]);
}

/** The page the desk opens on: a unit finished since the sign last said so (once), or the stop the desk is about.
 *  `keep` looks without using up the COMPLETE: the desk is mounted before anyone has seen it. */
function startPage({ keep = false } = {}) {
  const fresh = finishedUnits().filter(g => !state.unitsSeen.includes(g));
  if (fresh.length) {
    if (!keep) {
      state.unitsSeen = [...state.unitsSeen, ...fresh];
      save();
    }
    return completePage(fresh[fresh.length - 1]);
  }
  const l = hereStop();
  return l ? lessonPage(l) : null;
}

/* ── state of the desk ────────────────────────────────────────────────────── */
let world = null, worldP = null;
let shown = null;               // the page on the sign: { kind, id, lines, say }
let entered = false;            // the desk is on screen (entered and not yet left)
let leaping = false, held = true, lastWs = 0, minute = '';
const ui = { k: 0, show: false, pinned: false, lastMove: -99, hover: false, pop: false, live: false, idle: false,
  dip: 1, fade: 1, overSign: false, signFocus: false, last: {} };

/* ── the skeleton: drawn at once, the world fills in behind it ────────────── */
const ICON = {
  sound: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 6h2.2L8 3.2v9.6L4.7 10H2.5z"/><path class="w" d="M10.6 5.6a3.4 3.4 0 0 1 0 4.8M12.4 3.8a6 6 0 0 1 0 8.4"/><path class="x" d="M10.8 6.2l3.6 3.6M14.4 6.2l-3.6 3.6"/></svg>',
  moon: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M10.8 1.2A6.9 6.9 0 1 0 14.8 11 5.6 5.6 0 0 1 10.8 1.2Z"/></svg>',
  snow: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true"><path d="M8 1v14M2 4.5l12 7M2 11.5l12-7M6.2 2.4 8 3.8l1.8-1.4M6.2 13.6 8 12.2l1.8 1.4"/></svg>',
  gear: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="8" cy="8" r="2.3"/><path d="M8 1.2v2M8 12.8v2M1.2 8h2M12.8 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4"/></svg>',
};
const WS = [
  { n: 2, name: 'lessons' },
  { n: 3, name: 'manual' },
  { n: 4, name: 'settings' },
];
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const p2 = n => String(n).padStart(2, '0');

function skeleton() {
  return `
  <div class="cr-world" aria-hidden="true">
    <div class="cr-backs"></div>
    <canvas class="cr-wx cr-life"></canvas>
    <canvas class="cr-wx cr-wxb"></canvas>
    <div class="cr-fronts"></div>
    <canvas class="cr-wx cr-wxf"></canvas>
    <div class="cr-grades"></div>
  </div>
  <button class="cr-sign" id="cr-sign" type="button" aria-describedby="cr-hint"><span class="sr-only" id="cr-say"></span></button>
  <svg class="cr-ring" aria-hidden="true" width="530" height="400" viewBox="0 0 530 400"><polygon points=""/></svg>
  <span class="sr-only" id="cr-hint">Enter opens it. The left and right arrow keys show the other lessons.</span>
  <div class="cr-hud">
    <div class="micro cr-wxw" aria-hidden="true"></div><div class="cr-clock" aria-hidden="true"></div><div class="micro cr-date" aria-hidden="true"></div>
    <p class="cr-promise" id="cr-promise" hidden></p>
  </div>
  <div class="cr-menu" id="cr-menu">
    <div class="cr-scrim"></div>
    <nav class="m tl" aria-label="MIMEI">
      <div class="brand"><img class="cr-mark" src="assets/crane/mark-snow.webp" alt="" width="240" height="284"><span>MIMEI</span></div>
      <div class="ws">
        <button type="button" class="on" aria-current="page" title="The desk (Alt+1)">01 desk</button>
        ${WS.map(w => `<button type="button" data-ws="${w.n}" title="${w.name[0].toUpperCase()}${w.name.slice(1)} (Alt+${w.n})">${p2(w.n)}<span class="sr-only"> ${w.name}</span></button>`).join('')}
      </div>
    </nav>
    <section class="m bl" aria-labelledby="cr-when">
      <div class="micro" id="cr-when">tonight</div>
      <div class="cr-tonight" id="cr-goal" role="img"><b id="cr-goal-n">0:00 / 1:00</b><span class="bar"><i id="cr-goal-bar"></i></span></div>
      <div class="micro cr-nights" id="cr-nights"></div>
      <div class="week" id="cr-week" role="img"></div>
      <div class="cr-notes">
        <button class="cr-link" type="button" id="oss-revisit" hidden></button>
        <button class="cr-link" type="button" id="oss-bak" title="An older copy of your progress is kept in this browser; Settings has it for download" hidden>older copy kept · settings</button>
      </div>
    </section>
    <div class="m br">
      <div class="pop" id="cr-pop" role="group" aria-label="Desk settings" hidden>
        <div class="micro" id="cr-motion-l">motion</div>
        <div class="seg" role="group" aria-labelledby="cr-motion-l">
          ${MOTION.map(m => `<button type="button" data-m="${m}" aria-pressed="false">${m}</button>`).join('')}
        </div>
        <p class="micro cr-rm" id="cr-rm" hidden>your system asks for reduced motion, so the desk stays still</p>
        <div class="micro keys"><span><b>← →</b> lessons</span><span><b>enter</b> open</span><span><b>m</b> manual</span><span><b>esc</b> menu</span></div>
        <button class="cr-link cr-all" type="button" id="cr-all">all settings →</button>
      </div>
      <div class="icons">
        <button type="button" class="ic" id="cr-snd" aria-pressed="true" title="Sound">${ICON.sound}<span class="sr-only">Sound</span></button>
        <span class="tog" role="group" aria-label="Scene">
          <button type="button" data-t="night" aria-pressed="true" title="Night">${ICON.moon}<span class="sr-only">Night</span></button>
          <button type="button" data-t="ice" aria-pressed="false" title="Ice">${ICON.snow}<span class="sr-only">Ice</span></button>
        </span>
        <button type="button" class="ic" id="cr-gear" aria-expanded="false" aria-controls="cr-pop" title="Motion and keys">${ICON.gear}<span class="sr-only">Motion and keys</span></button>
      </div>
      <div class="micro hint" aria-hidden="true">esc · hide</div>
    </div>
  </div>
  <div class="cr-fade" aria-hidden="true"></div>`;
}

/* ── painting the words ───────────────────────────────────────────────────── */
function paintHud(d = now()) {
  els.wx.textContent = SCENES[sceneNow()].wx;
  els.clock.textContent = `${p2(d.getHours())}:${p2(d.getMinutes())}`;
  els.date.textContent = `${DAYS[d.getDay()]} · ${p2(d.getDate())} · ${MON[d.getMonth()]}`;
}

const spoken = secs => {
  const m = Math.floor(secs / 60), h = Math.floor(m / 60), r = m % 60;
  const hs = h ? `${h} ${h === 1 ? 'hour' : 'hours'}` : '', ms = r || !h ? `${r} ${r === 1 ? 'minute' : 'minutes'}` : '';
  return [hs, ms].filter(Boolean).join(' ');
};

function paintTonight() {
  if (!desk) return;
  const d = now(), night = isNight(d), secs = tonight(d), goal = goalSeconds(), wk = week(d);
  els.when.textContent = night ? 'tonight' : 'today';
  els.goalN.textContent = `${hm(secs)} / ${hm(goal)}`;
  els.goalBar.style.width = `${(Math.min(1, secs / Math.max(1, goal)) * 100).toFixed(1)}%`;
  els.goal.setAttribute('aria-label', `${night ? 'Tonight' : 'Today'}: ${spoken(secs)} of your ${spoken(goal)} goal`);
  els.nights.textContent = `${wk.studied} study ${wk.studied === 1 ? 'night' : 'nights'} · week ${wk.num}`;
  els.week.innerHTML = wk.nights.map(n => `<div><i class="${n.on ? 'on' : ''}${n.now ? ' now' : ''}"></i>${n.letter}</div>`).join('');
  const on = wk.nights.map((n, i) => (n.on ? DAY_NAMES[i] : '')).filter(Boolean);
  els.week.setAttribute('aria-label', on.length ? `Study nights this week: ${on.join(', ')}` : 'No study nights yet this week');
}

/** The one quiet line a stranger needs: how many stops, how long, and where the code goes. Counted from the course, never typed in. */
function promise() {
  const all = writtenLessons();
  const mins = all.reduce((n, x) => n + (x.mins || 0), 0);
  const parts = [`${all.length} stops`];
  if (mins) parts.push(mins >= 90 ? `about ${Math.round(mins / 60)} hours` : `about ${mins} minutes`);
  parts.push('you type every script in your own Roblox Studio (Windows or Mac)');
  return parts.join(' · ');
}

/* N to revisit: probes missed before, oldest first; the click opens the oldest at its probe.
   And while nothing is ticked yet, the stranger's line under the date. */
function paintNotes() {
  if (!desk) return;
  const sum = progressSummary(), fresh = !sum.done && !sum.cps;
  els.promise.hidden = !fresh;
  if (fresh && !els.promise.textContent) els.promise.textContent = promise();
  const b = els.revisit, misses = missList(), n = misses.length;
  b.hidden = !n;
  if (n) {
    const m = misses[0], l = lessonById(m.lessonId);
    b.textContent = `${n} to revisit`;
    b.title = `${n} missed ${n === 1 ? 'question' : 'questions'} to try again, the oldest in ${l ? `${l.n} ${l.title}` : m.lessonId}`;
    b.dataset.lesson = m.lessonId;
    b.dataset.probe = m.probeId;
  }
  els.bak.hidden = !backupUnseen();       // an older copy exists and Settings has not been opened over it yet
}

function paintControls() {
  if (!desk) return;
  els.snd.setAttribute('aria-pressed', String(sound.on));
  els.snd.classList.toggle('off', !sound.on);
  for (const b of els.tog) b.setAttribute('aria-pressed', String((state.scene === 'ice') === (b.dataset.t === 'ice')));
  const m = motionNow();
  for (const b of els.seg) b.setAttribute('aria-pressed', String(b.dataset.m === m));
  els.rm.hidden = !reducedOS();
}

function theme(k) {
  const ice = k === 'ice';
  desk.classList.toggle('ice', ice);
  desk.classList.toggle('dark', !ice);
  els.mark.src = `assets/crane/mark-${ice ? 'slate' : 'snow'}.webp`;
  paintHud();
}

/* ── the sign ─────────────────────────────────────────────────────────────── */
function setPage(page, kind = 'auto', { say = false } = {}) {
  shown = page;
  if (!page) return;
  els.say.textContent = page.say;
  if (world && !leaping) world.show(page.lines, kind);        // still: the sign dissolves in place instead (led.js)
  if (say) announce(page.say);
}

/** ← and →: every written lesson, in course order, wrapping at the ends. */
function flip(dir) {
  const all = writtenLessons();
  if (!all.length || !shown) return;
  let i;
  if (shown.kind === 'complete') {
    const at = shown.id ? all.findIndex(l => l.id === shown.id) : all.length;
    i = dir > 0 ? at : at - 1;
  } else {
    i = all.findIndex(l => l.id === shown.id) + dir;
  }
  i = (i + all.length) % all.length;
  sound.event({ type: 'ui' });
  setPage(lessonPage(all[i]), 'wipe', { say: true });
}

/** The page again from the progress (a checkpoint ticked in another tab, a lesson finished): rolls only what changed. */
function refreshSign() {
  if (!shown || !shown.id || shown.kind === 'complete' || leaping) return;
  const l = lessonById(shown.id);
  if (!l) return;
  const page = lessonPage(l);
  if (page.say === shown.say) return;
  setPage(page, 'auto');
}

/** Enter or a click: the lesson on the sign (after COMPLETE, the next unit's first lesson; after the course, the index). */
async function openShown() {
  if (leaping || !shown) return;
  if (!shown.id) { openWindow('course'); return; }
  const id = shown.id, l = lessonById(id);
  if (!l) return;
  leaping = true;
  desk.classList.add('leaping');
  holdCheck();
  announce(`Opening ${l.n} ${l.title}`);
  sound.event({ type: 'leap' });
  try {
    await leap({
      world, worldEl: q('.cr-world'), curtain: els.curtain, motion: motionNow(),
      dip: a => { ui.dip = a; },
      open: () => openLesson(id),
    });
  } catch (e) {
    console.warn('desk: the leap did not finish', e);
    if (activeWs() === 1) openLesson(id);
  } finally {
    leaping = false;
    desk.classList.remove('leaping');
    ui.dip = 1;
    holdCheck();
  }
}

/** The `m` key: the manual page for the lesson on the sign. False when the desk is not what the learner is looking at. */
export function deskManual() {
  if (!desk || leaping || activeWs() !== 1 || focusedId() || booting()) return false;
  const id = shown && shown.id ? shown.id : (hereStop() || {}).id;
  if (!id) return false;
  openMan(id);
  return true;
}

/* ── the world ────────────────────────────────────────────────────────────── */
const uScale = () => clamp(innerHeight / 1080, .8, 1.2);
/* keep the hook clear of the menu's top-left block on a narrow (16:10) screen */
const clearOfMenu = () => { const b = q('.m.tl'); return b ? b.getBoundingClientRect().right + 26 * uScale() : 0; };

function ensureWorld() {
  if (worldP) return worldP;
  worldP = import('../desk/world.js').then(async ({ World, FACE, SIGN_BOX }) => {
    const w = new World(q('.cr-world'), { motion: motionNow(), onEvent: e => sound.event(e), ledJS: qs.get('led') === 'js' });
    w.keepClear = clearOfMenu();
    /* the button and its ring sit on the sign's own canvas and sway with it */
    const c = FACE.reduce((a, [x, y]) => [a[0] + x / 4, a[1] + y / 4], [0, 0]);
    const out = k => FACE.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]);
    els.sign.style.width = `${SIGN_BOX.w}px`;
    els.sign.style.height = `${SIGN_BOX.h}px`;
    els.sign.style.clipPath = `polygon(${out(1.03).map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(', ')})`;
    els.ring.querySelector('polygon').setAttribute('points', out(1.07).map(p => p.map(v => v.toFixed(1)).join(',')).join(' '));
    w.attach(els.sign);
    w.attach(els.ring);
    await w.start(sceneNow());
    world = w;
    desk.classList.add('up');
    if (w.missing.length) log('warn', `[ ! ] the desk is missing ${w.missing.join(', ')} — it still works without`);
    return w;
  }).catch(e => {
    console.warn('desk: the city did not load', e);
    log('warn', '[ ! ] the desk could not draw the city — the sign and the menu still work');
    desk.classList.add('no-world');
    return null;
  });
  return worldP;
}

/** Resolves once the first picture is up (or could not be had); the start-up waits on it. */
export const deskReady = () => (activeWs() === 1 ? ensureWorld().then(() => true) : Promise.resolve(false));

function holdCheck() {
  const want = leaping || (activeWs() === 1 && !document.hidden && !booting());
  if (want) startClock(); else stopClock();
  held = !want;
}

async function enter(first) {
  entered = true;
  ui.fade = 1;
  ui.dip = 1;
  setPage(startPage(), 'none');
  paintAll();
  holdCheck();
  sound.desk(true);
  const w = await Promise.race([ensureWorld(), sleep(4000)]);
  if (!entered) return;
  if (w) {
    w.keepClear = clearOfMenu();
    if (w.scene !== sceneNow()) await w.setScene(sceneNow(), 0);
    w.setMotion(motionNow());
  }
  theme(sceneNow());
  sound.scene(sceneNow());
  tween(first ? 1.2 : .7, e => { ui.fade = 1 - e; }, ease.sine);
  if (!w || !shown) return;
  if (first || w.blank) {
    await wait(first ? .9 : .25);
    if (!entered || leaping) return;
    w.show(shown.lines, 'power');
    sound.event({ type: 'hum', level: 1 });
  } else {
    w.show(shown.lines, 'auto');
  }
}

function exit() {
  entered = false;
  sound.desk(false);
  closePop();
  ui.pinned = false; ui.show = false; ui.k = 0; ui.fade = 1;
  paintFrame();
}

function onWorkspace() {
  const ws = activeWs();
  if (ws !== lastWs) {
    const was = lastWs;
    lastWs = ws;
    if (was === 1) exit();
    if (ws === 1 && !booting()) enter(false);
  }
  holdCheck();
}

/* ── the menu ─────────────────────────────────────────────────────────────── */
function openPop(on) {
  ui.pop = on;
  els.pop.hidden = !on;
  els.gear.setAttribute('aria-expanded', String(on));
}
const closePop = () => { if (ui.pop) openPop(false); };

function chooseScene(k) {
  if (state.scene === k) return;
  state.scene = k;
  save();
  log('dim', `[ * ] desk: ${k === 'ice' ? 'ice' : 'night'}`);
  applyScene(1.4);
}

/** The scene changed (the menu, or the clock passing 01:30 / 05:00): the corners dip and come back in the new colours. */
function applyScene(dur) {
  const k = sceneNow();
  paintControls();
  sound.scene(k);
  if (world && world.scene !== k) world.setScene(k, entered ? dur : 0);
  if (!entered) { theme(k); return; }
  let swapped = false;
  tween(1.1, (_, x) => {
    ui.dip = x < .45 ? 1 - ease.sine(x / .45) : ease.sine((x - .45) / .55);
    if (!swapped && x >= .45) { swapped = true; theme(k); }
    if (x >= 1) ui.dip = 1;
  }, ease.lin);
}

function setMotion(m) {
  setFxPreference(PREF_FOR[m]);
  log('dim', `[ * ] desk motion: ${m}${reducedOS() && m !== 'still' ? ' (reduced motion keeps it still)' : ''}`);
}

function wireMenu() {
  desk.addEventListener('pointermove', e => {
    ui.lastMove = clock.t;
    ui.show = true;
    ui.hover = !!(e.target.closest && e.target.closest('.m'));
  });
  desk.addEventListener('pointerdown', e => {
    ui.lastMove = clock.t;
    ui.show = true;
    if (ui.pop && !e.target.closest('.pop, #cr-gear')) closePop();
  });
  desk.addEventListener('pointerleave', () => { ui.hover = false; });
  for (const b of desk.querySelectorAll('.ws [data-ws]')) b.onclick = () => { sound.event({ type: 'ui' }); goWorkspace(+b.dataset.ws); };
  els.snd.onclick = () => { sound.set(!sound.on); paintControls(); };
  for (const b of els.tog) b.onclick = () => { sound.event({ type: 'ui' }); chooseScene(b.dataset.t); };
  els.gear.onclick = () => { sound.event({ type: 'ui' }); openPop(!ui.pop); };
  for (const b of els.seg) b.onclick = () => { sound.event({ type: 'ui' }); setMotion(b.dataset.m); paintControls(); };
  els.all.onclick = () => { closePop(); openWindow('settings'); };
  els.revisit.onclick = e => { const d = e.currentTarget.dataset; openLesson(d.lesson, { probe: d.probe }); };
  els.bak.onclick = () => openWindow('settings');
  els.sign.onclick = () => openShown();
  els.sign.addEventListener('pointerenter', () => { ui.overSign = true; });
  els.sign.addEventListener('pointerleave', () => { ui.overSign = false; });
  els.sign.addEventListener('focus', () => { ui.signFocus = true; });
  els.sign.addEventListener('blur', () => { ui.signFocus = false; });
}

/* ── the keys: only on the desk, with no window, field, launcher or menu in the way ── */
function onKey(e) {
  if (!desk || activeWs() !== 1 || booting()) return;
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (focusedId() || menuOpen() || overlayOpen()) return;
  const a = document.activeElement;
  if (a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable)) return;
  if (leaping) { if (['ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(e.key)) e.preventDefault(); return; }
  const onControl = a && a !== document.body && a !== document.documentElement && a.closest && a.closest('button, a, [tabindex]');
  switch (e.key) {
    case 'ArrowRight': case 'ArrowLeft':
      e.preventDefault();
      flip(e.key === 'ArrowRight' ? 1 : -1);
      break;
    case 'Enter':
      /* a button the keyboard is on takes its own Enter (the sign's opens the lesson); one only clicked with the
         mouse keeps focus without showing it, and Enter still means the sign */
      if (onControl && a.matches(':focus-visible')) return;
      e.preventDefault();
      if (onControl) a.blur();
      openShown();
      break;
    case 'Escape':
      e.preventDefault();
      if (ui.pop) { closePop(); if (els.menu.contains(a)) els.gear.focus(); break; }
      ui.pinned = !(ui.pinned || ui.k > .5);
      ui.show = ui.pinned;
      if (!ui.pinned) { ui.lastMove = -99; if (els.menu.contains(a)) a.blur(); }
      break;
    default: break;
  }
}

/* ── one frame of the corners (on the desk clock) ─────────────────────────── */
function set(el, key, v) { if (ui.last[key] !== v) { ui.last[key] = v; el.style.opacity = v; } }

function paintFrame(t = clock.t, dt = 0) {
  if (!desk) return;
  const d = now(), m = `${d.getHours()}:${d.getMinutes()}`;
  if (m !== minute) {
    minute = m;
    paintHud(d);
    paintTonight();
    if (entered && !leaping && world && world.scene !== sceneNow()) applyScene(6);   // 01:30 and 05:00
  }
  /* the keyboard in the menu keeps it up; a button clicked with the mouse keeps its focus but not the menu */
  const a = document.activeElement;
  const inMenu = !!a && els.menu.contains(a) && a.matches(':focus-visible');
  const idle = t - ui.lastMove > 2.6 && !ui.hover && !ui.pop && !inMenu;
  if (!ui.pinned && idle) ui.show = false;
  if (inMenu) ui.show = true;
  ui.k = clamp(ui.k + (ui.show ? dt / .45 : -dt / .9));
  set(els.menu, 'menu', (ease.sine(ui.k) * ui.dip).toFixed(3));
  const live = ui.show || ui.k > .5;
  if (live !== ui.live) { ui.live = live; els.menu.classList.toggle('cr-live', live); }
  set(els.hud, 'hud', ui.dip.toFixed(3));
  set(els.fade, 'fade', ui.fade.toFixed(3));
  const awake = t - ui.lastMove < 2.6 || ui.pinned || inMenu;
  if (awake === ui.idle) { ui.idle = !awake; desk.classList.toggle('cr-idle', ui.idle); }
  if (world) world.act = !leaping && ((ui.overSign && awake) || ui.signFocus) ? 1 : 0;
}

function paintAll() {
  if (!desk) return;
  paintHud();
  paintTonight();
  paintNotes();
  paintControls();
  if (entered) refreshSign();
}

/* ── mount ────────────────────────────────────────────────────────────────── */
/** `later`: the URL asked for a lesson, which opens as soon as the start-up is done (main.js). */
export function mountDesktop(el, { later = false } = {}) {
  desk = el;
  if (!desk) return null;
  desk.classList.add('cr', 'dark');
  desk.innerHTML = skeleton();
  els = {
    sign: q('#cr-sign'), say: q('#cr-say'), ring: q('.cr-ring'), hud: q('.cr-hud'), wx: q('.cr-wxw'), clock: q('.cr-clock'), date: q('.cr-date'), promise: q('#cr-promise'),
    menu: q('#cr-menu'), mark: q('.cr-mark'), when: q('#cr-when'), goal: q('#cr-goal'), goalN: q('#cr-goal-n'), goalBar: q('#cr-goal-bar'),
    nights: q('#cr-nights'), week: q('#cr-week'), revisit: q('#oss-revisit'), bak: q('#oss-bak'),
    pop: q('#cr-pop'), seg: [...desk.querySelectorAll('.seg [data-m]')], rm: q('#cr-rm'), all: q('#cr-all'),
    snd: q('#cr-snd'), tog: [...desk.querySelectorAll('.tog [data-t]')], gear: q('#cr-gear'), fade: q('.cr-fade'),
  };
  els.curtain = document.getElementById('leap') || Object.assign(document.createElement('div'), { id: 'leap' });
  els.curtain.setAttribute('aria-hidden', 'true');
  if (!els.curtain.isConnected) document.body.appendChild(els.curtain);

  const setU = () => desk.style.setProperty('--u', uScale().toFixed(3));
  setU();
  addEventListener('resize', () => { setU(); if (world) requestAnimationFrame(() => { world.keepClear = clearOfMenu(); }); });

  wireMenu();
  addEventListener('keydown', onKey, { capture: true });
  onFrame(paintFrame);
  theme(sceneNow());
  shown = startPage({ keep: true });
  if (shown) els.say.textContent = shown.say;
  paintAll();
  paintFrame();

  onPaint(paintAll);
  onLog(paintNotes);
  onNights(paintTonight);
  onFx(() => { if (world) world.setMotion(motionNow()); paintControls(); });
  onWM(onWorkspace);
  document.addEventListener('visibilitychange', holdCheck);
  lastWs = activeWs();
  if (lastWs === 1 && !later) ensureWorld();   // the pictures load while the start-up is still dark
  /* the start-up lifts by dropping body.booting; the desk powers on once it has. A link to a lesson opens the
     lesson straight after, so then the city waits until the desk is actually shown. */
  const powerOn = () => {
    if (!later) { enter(true); return; }
    setTimeout(() => { if (activeWs() === 1 && !entered) enter(true); }, 0);
  };
  let up = !booting();
  const lifted = () => {
    if (up || booting()) return;
    up = true;
    if (activeWs() === 1) powerOn();
    holdCheck();
  };
  new MutationObserver(lifted).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  if (up && lastWs === 1) powerOn();
  holdCheck();
  return desk;
}

/** What the tests read: the page on the sign, the corners, and whether the world is up and running. */
export const deskReport = () => ({
  started: !!world, loading: !!worldP && !world, held, leaping, entered,
  page: shown ? { kind: shown.kind, id: shown.id, say: shown.say, lines: shown.lines.map(l => l.text) } : null,
  menu: { shown: ui.show, pinned: ui.pinned, pop: ui.pop, k: +ui.k.toFixed(2), idle: ui.idle },
  fade: +ui.fade.toFixed(2), dip: +ui.dip.toFixed(2), motion: motionNow(), scene: sceneNow(),
  world: world ? world.report() : null,
});

/* Kept as a no-op for older tools. */
export function stillDeck() {}

/* The lessons (study.js) wear the desk's clock, motion, scene and icons. */
export { now as deskNow, motionNow, sceneNow, reducedOS, ICON, MOTION, setMotion };
