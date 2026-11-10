/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · MAIN
   The cold start. Mount the log and the live region, pull the course off
   disk, put the one look on the machine, build the window manager, give the
   desk / bar / launcher their targets, wire the keyboard, start
   counting tonight's study time, and then lift the dark.

   Order matters exactly once: the lessons are read out of `content/*.md`,
   so the course has to be in the DOM before mountDesktop() (the sign names
   them). Everything else can happen in any order: the start-up only waits
   for the desk's first picture, and the machine is up underneath it.

   The only other thing this file owns is the wiring that would otherwise make
   ui/* import each other in circles: the keyboard's `commands`, the URL hash,
   and the boot-time decision about what to look at.
   ════════════════════════════════════════════════════════════════════════════ */

import { GROUPS, lessonById, writtenLessons } from './data/course.js';
import { log, mountLive } from './core/journal.js';
import { flushNotices, progressSummary, state, save, totalXP, totalCps } from './core/state.js';
import {
  cycleFxPreference, fxReport, initEffects, rainWanted, setPeek, setRain, setFxPreference,
} from './core/effects.js';
import { DEFAULT_RICE, RICE_BY_ID, RICES, applyRice } from './core/rice.js';
import { currentWall } from './core/walls.js';
import {
  activeWs, flushLayout, focusNext, goWorkspace, initWM, openWindow,
  rects as wmRects, windowsOn,
} from './core/wm.js';
import { commands, initKeys } from './core/keys.js';
import { initSound, sound } from './core/sound.js';
import { initNights, nightsReport } from './core/nights.js';

/* Every window is defined by importing its module. These four are imported for
   their functions; goals and settings are here for the side effect alone (the
   bar, the launcher and the window manager reach them by id, so they must exist). */
import { focusCourseSearch, openStop, paintCourse } from './ui/course.js';
import { currentLessonId, lessonNav, onLesson, openFirstSession, openLesson, paintSessions } from './ui/session.js';
import { openMan } from './ui/man.js';
import { paintSystem } from './ui/goals.js';
import './ui/settings.js';
import './ui/tty.js';
import './ui/files.js';

import { deskManual, deskReady, deskReport, mountDesktop, stillDeck } from './ui/desktop.js';
import { mountStudy, studyReport } from './ui/study.js';
import { driftReport, mountDrift } from './ui/drift.js';
import { initBar } from './ui/bar.js';
import { initCab } from './ui/cab.js';
import { initLauncher, launcherOpen, openLauncher } from './ui/launcher.js';
import { runBoot } from './ui/boot.js';
import { repaint } from './ui/window.js';

/* ── the course, off disk ─────────────────────────────────────────────────────
   lesson bodies are authored as hidden `#md-*` divs; lessons.md carries units
   1–2, one file per unit after that. The list is derived from GROUPS so that
   adding a unit to the course data is the only edit a new unit needs. */
const CONTENT_FILES = [
  'lessons.md',
  ...GROUPS.filter(g => +g.id.slice(1) >= 3).map(g => `unit-${g.id.slice(1)}.md`),
];

const MS = 8000;

async function loadContent() {
  const host = document.getElementById('lessons');
  if (!host) return { stops: 0, failed: CONTENT_FILES.length };

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), MS);
  const results = await Promise.allSettled(CONTENT_FILES.map(async f => {
    const res = await fetch(`content/${f}`, { signal: abort.signal });
    if (!res.ok) throw new Error(`${f} — HTTP ${res.status}`);
    return { f, text: await res.text() };
  }));
  clearTimeout(timer);

  let stops = 0, failed = 0;
  for (const r of results) {
    if (r.status === 'rejected') {
      failed++;
      const why = r.reason && r.reason.name === 'AbortError' ? `took longer than ${MS / 1000}s` : (r.reason && r.reason.message) || r.reason;
      log('er', `[ ! ] could not read course content — ${why}`);
      continue;
    }
    const doc = new DOMParser().parseFromString(r.value.text, 'text/html');
    for (const node of [...doc.body.children]) {
      if (!/^md-/.test(node.id || '')) continue;
      host.appendChild(document.importNode(node, true));
      stops++;
    }
  }
  return { stops, failed };
}

/* ── the URL: `#/3.2` is a stop on the line ───────────────────────────────── */
function lessonFromHash() {
  let id = '';
  try { id = decodeURIComponent(location.hash.replace(/^#\/?/, '')).trim(); } catch (_) { return null; }
  if (!id) return null;
  const l = lessonById(id);
  return l && !l.soon ? l : null;
}

function wireHash() {
  addEventListener('hashchange', () => {
    const l = lessonFromHash();
    if (l) openStop(l.id);
  });
}

/* ── the wiring the core cannot own ───────────────────────────────────────── */
function wireCommands() {
  commands.launcher = mode => openLauncher(mode || null);
  commands.lesson = dir => lessonNav(dir);
  commands.search = () => focusCourseSearch();
  commands.rain = () => {
    setRain(!rainWanted());
    log('dim', rainWanted() ? '[ * ] rain on' : '[ * ] rain off');
    repaint();
  };
  commands.fx = () => cycleFxPreference();
  commands.launcherOpen = () => launcherOpen();
  commands.manual = deskManual;
}

/* ── the open session drives the panes beside it ──────────────────────────────
   The session, the course list and the goals pane all read `currentLessonId()`,
   and none of them may import the others — so the session announces the change
   and this is where the word is passed along. */
function wireLesson() {
  onLesson(() => {
    paintCourse();
    paintSystem();
    repaint();
  });
}

function wireChrome() {
  /* the peek curtain: click it (or Esc, from keys.js) to bring everything back */
  const back = document.getElementById('peek-back');
  if (back) back.onclick = () => setPeek(false);

  /* the skip link points at `#session-body`, which only exists once a session
     is open — so opening one is part of following it */
  const skip = document.querySelector('.skip');
  if (skip) skip.onclick = e => {
    e.preventDefault();
    const open = currentLessonId();
    if (open) openLesson(open, { focus: false }); else openFirstSession();
    const body = document.getElementById('st-scroll');
    if (body) {
      body.focus({ preventScroll: true });
      body.scrollIntoView({ block: 'nearest' });
    }
  };

  wireHash();
  addEventListener('ossuary:sync', e => { if (e.detail && e.detail.fresh) paintSessions(true); repaint(); });   // another tab saved: every panel paints from the adopted store
}

/* ── what to look at once the dark has lifted ─────────────────────────────── */
function afterBoot() {
  repaint();

  const wanted = lessonFromHash();
  if (wanted) {
    /* the URL asked for a stop: open it; focusLessonWhenUp() below gives the lesson the keys */
    if (wanted.kind === 'lesson') openLesson(wanted.id, { focus: false });
    else openStop(wanted.id);
  } else if (state.ws === 3) {
    openMan(state.last);
  } else if (state.ws === 2) {
    openFirstSession();
  } else if (state.ws === 4) {
    focusNext(1);
  }
  focusLessonWhenUp();
}

/* A lesson opened by a cold load (a link, a reload on workspace 2) gets the keys once the dark has lifted (afterBoot runs
   then), unless the learner has already put them somewhere: PageDown, Space and the arrows then turn it. The key that
   lifted the dark did nothing else (ui/boot.js), so it cannot scroll the page underneath. */
function focusLessonWhenUp() {
  if (activeWs() !== 2 || !currentLessonId() || launcherOpen()) return;
  const a = document.activeElement;
  if (a && a !== document.body && a !== document.documentElement) return;   // they have taken the keys themselves
  const sc = document.getElementById('st-scroll');
  if (!sc) return;
  sc.classList.add('quiet');      // the keys without a ring until the first key: a link lands calm, the reading keys still work
  const loud = () => sc.classList.remove('quiet');
  sc.addEventListener('keydown', loud, { once: true });
  sc.addEventListener('blur', loud, { once: true });
  sc.focus({ preventScroll: true });
}

/* ── cold start ───────────────────────────────────────────────────────────── */
async function main() {
  mountLive(document.getElementById('live'));
  flushNotices();                 // anything state.js had to say while the store loaded (a save it could not read)

  /* the start-up waits on this one thing: the desk's sign reads its words out
     of the course, and a sign that says the wrong lesson is worse than a
     start-up that takes 200ms longer */
  const content = await loadContent();
  log('dim', `[ * ] course on disk — ${content.stops} stops mounted · ${writtenLessons().length} written`);

  /* what the machine looks like */
  initEffects();

  /* ?fx=N pins the level. It is the same choice the settings window offers;
     the URL form exists so a screenshot or a test always sees one machine. */
  const fxPin = /[?&]fx=([0-3])\b/.exec(location.search);
  if (fxPin) setFxPreference(['static', 'minimal', 'balanced', 'full'][+fxPin[1]]);
  if (!applyRice(state.rice)) {
    state.rice = DEFAULT_RICE;                 // a stored rice id that no longer exists
    applyRice(DEFAULT_RICE);
    save();
  }
  /* the wall is the desk's city, out of focus, in tonight's scene (ui/cab.js) */
  initCab();

  /* the machine itself */
  if (state.layout[4] && Array.isArray(state.layout[4].order)) {
    /* the wall picker is gone: workspace 4 is settings alone */
    const ws4 = state.layout[4];
    ws4.order = ws4.order.filter(id => id !== 'rices' && id !== 'wallpaper');
    if (Array.isArray(ws4.hidden)) ws4.hidden = ws4.hidden.filter(id => id !== 'wallpaper');
    if (ws4.weights) delete ws4.weights.wallpaper;
    if (!ws4.order.length) ws4.order.push('settings');
    save();
  }
  initWM(document.getElementById('seat'));
  mountDesktop(document.getElementById('desk'), { later: !!lessonFromHash() });
  mountStudy(document.getElementById('study'));
  mountDrift();
  initBar();
  initLauncher();
  initKeys();
  initSound();
  /* tonight's study time counts while a lesson is open on screen (workspace 2) */
  initNights({ isStudying: () => activeWs() === 2 && !!currentLessonId() });
  wireCommands();
  wireLesson();
  wireChrome();

  /* the dark lifts once the desk's first picture is up (never more than a moment);
     a link to a lesson does not wait for the desk's pictures */
  await runBoot({ ready: lessonFromHash() ? null : deskReady });
  afterBoot();
}

/* ── the test surface ─────────────────────────────────────────────────────────
   Playwright reads the machine's own state through this instead of guessing
   from pixels: layout rectangles, the fx report, the progress summary. */
globalThis.ossuary = {
  name: 'MIMEI',
  version: '1.0',
  state,
  progress: progressSummary,
  cps: totalCps,                 // checkpoints reached: the only progress number the course shows
  xp: totalXP,                   // kept for old saves and old tests; nothing shows it
  fx: fxReport,
  wm: { rects: wmRects, activeWs, windowsOn, open: openWindow, go: goWorkspace, flush: flushLayout },
  wall: { current: currentWall },
  desk: deskReport,
  study: studyReport,
  drift: driftReport,
  lesson: lessonFromHash,
  rice: { list: RICES, current: () => state.rice,
          /* the machine has one look; these remain for older tools and tests */
          apply: id => (RICE_BY_ID[id] ? applyRice(id) : false),
          force: id => (RICE_BY_ID[id] ? applyRice(id) : false) },
  sound,
  nights: nightsReport,
  /* kept for older tools: the desk holds itself still from the motion setting */
  still: stillDeck,
};

main().catch(err => {
  console.error(err);
  log('er', `[ ! ] the machine did not finish starting — ${err && err.message}`);
});
