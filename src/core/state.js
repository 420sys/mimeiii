/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/STATE
   One object in localStorage, derived values computed from it, and nothing
   else in the machine is allowed to keep its own copy of progress.

   Learning progress is never stored as XP: it is stored as which goal
   checkpoints have been ticked, and XP is summed from those. That way the
   content can be re-priced (goals carry `xp`, authored with the lesson) and
   nobody's total goes wrong.

   STORE_KEY is 'ossuary-1'. The machine used to be called luauOS and kept the
   same store under 'luauos-1'; that store is copied over once (and left where
   it was), so nobody loses a checkpoint to the rename. It is called MIMEI now;
   the key keeps its old name on purpose, so nothing has to be copied again.
   ════════════════════════════════════════════════════════════════════════════ */

import { GROUPS, LESSONS, GOALS, TASKS, PREDICTS, writtenLessons, nextLesson, cheatFor, TOTAL_XP, TOTAL_CPS } from '../data/course.js';
import { log, announce } from './journal.js';

export const STORE_KEY = 'ossuary-1';
const OLD_KEY = 'luauos-1';
export const BAK_KEY = `${STORE_KEY}.bak`;

/* what the learner must hear once: logged at once, spoken by main.js when the live region exists */
const heard = [];
let failed = false;
let trouble = '';          // '' | 'unsaved' | 'unread': what Settings should say about the store
const tell = (kind, text) => { trouble = kind; log('er', `[ ! ] ${text}`); announce(text); heard.push(text); };
export const storageTrouble = () => trouble;
export const clearTrouble = () => { if (trouble === 'unread') trouble = ''; };   // a good file was imported: the notice has done its job
export function flushNotices() { while (heard.length) announce(heard.shift()); }

/* ── the older copy: is there one, and has the learner been pointed at it ──────
   Settings holds the download; the desk says so, once, until Settings has been opened over this copy. */
const bakText = () => { try { return localStorage.getItem(BAK_KEY) || ''; } catch (_) { return ''; } };
const bakSig = t => { let h = 5381; for (let i = 0, n = Math.min(t.length, 4000); i < n; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return `${t.length}.${(h >>> 0).toString(36)}`; };
export const hasBackup = () => !!bakText();
export const backupUnseen = () => { const t = bakText(); return !!t && state.bakSeen !== bakSig(t); };
/** Settings was opened: note the copy as seen. True when that changed something (the desk should repaint). */
export function seeBackup() {
  const t = bakText();
  if (!t || state.bakSeen === bakSig(t)) return false;
  state.bakSeen = bakSig(t);
  save();
  return true;
}

/** Keep the text about to be lost under a second key, so a bad day never ends a learner's progress for good. */
function keepBackup(text) {
  try { localStorage.setItem(BAK_KEY, text); } catch (_) { /* a full store cannot hold a copy either */ }
}

/** A write threw: keep what was stored, say so once, and carry on in memory (Export still works). */
function saveFailed() {
  if (failed) return;
  failed = true;
  let old = null;
  try { old = localStorage.getItem(STORE_KEY); } catch (_) { /* blocked storage cannot be read either */ }
  if (old) keepBackup(old);
  tell('unsaved', 'this browser would not save your progress (storage is full or blocked); Settings → Export keeps a copy as a file');
}

/* ── ranks: the Linux ladder from nothing to legend ────────────────────────
   Thresholds are percents of the XP the written course actually offers, so
   finishing the last unit lands exactly on the last rung. */
const FRACTIONS = [0, .028, .079, .149, .24, .35, .48, .63, .80, 1];
export const RANKS = ['init', 'shell', 'script', 'daemon', 'service', 'kernel', 'sysadmin', 'kernel-dev', 'root', 'legend']
  .map((name, i) => ({
    i, name,
    at: i === 0 ? 0 : Math.round(TOTAL_XP * FRACTIONS[i] / 10) * 10,
    blurb: [
      'you have just switched the machine on',
      'you can talk to a script',
      'you write your own instructions',
      'your code keeps running while you think',
      'things you built answer when called',
      'you can see the whole system at once',
      'you keep a growing project tidy',
      'you write tools other code uses',
      'nothing in this machine is a secret to you',
      'you built something real and shipped it',
    ][i],
  }));

export const levelOf = xp => {
  let r = RANKS[0];
  for (const rank of RANKS) if (xp >= rank.at) r = rank;
  return r;
};

/* ── the store ────────────────────────────────────────────────────────────── */
const defaults = () => ({
  done: [],                 // finished lesson ids
  goals: {},                // lesson id -> [goal index, ...]
  tasks: {},                // runbook id -> [step index, ...]
  days: [],                 // ISO dates the course was open
  rice: 'ossuary',
  wall: null,               // null = whatever the look suggests
  ws: 1,                    // active workspace
  layout: {},               // workspace -> {order, float, weights, mode, fold}
  tabs: [],                 // open sessions
  last: 'home',
  fx: 'auto',               // auto | full | balanced | minimal | static
  sound: true,              // the ambience and the clicks (on from the first click; a browser will not play sooner)
  rain: false,
  seenBoot: false,
  bootedAt: 0,
  bakSeen: '',              // which .bak Settings was last opened over (the desk's notice stays quiet once it has been)
  missed: {},               // lesson id -> { probe id: { n: times missed, t: when it was first missed } }
  place: {},                // lesson id -> { s: step, m: furthest step, y: scrollTop, p: { probe id: option picked } }
  gen: 0,                   // bumped when progress is cleared or imported, so another tab draws its open lesson again
  studyMig: 0,              // wm.js: the old course / session / goals tiles were dropped from workspace 2 (once)
  scene: 'night',           // the desk: 'night' (it turns into the 3 a.m. city by itself) or 'ice'
  goalMins: 60,             // tonight's goal, in minutes of study
  nights: {},               // night (the evening's date; a night ends at 5 a.m.) -> seconds studied
  unitsSeen: [],            // units whose COMPLETE the sign has already shown
  mimei: 0,                 // the one-time move to MIMEI (sound on, finished units counted as seen)
  scripts: false,           // workspace 2: the scripts drawer is out beside the lesson
});

function read() {
  const s = defaults();
  let text = null;
  try {
    text = localStorage.getItem(STORE_KEY);
    if (text === null && (text = localStorage.getItem(OLD_KEY)) !== null) {
      try { localStorage.setItem(STORE_KEY, text); } catch (_) { /* carried over next time */ }       // the rename: carry it over once
    }
    const raw = JSON.parse(text || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not a store');
    overlay(s, raw);
  } catch (_) {
    /* a store that will not parse starts a fresh one, but its text is kept first: nothing is lost for good */
    if (text) {
      keepBackup(text);
      tell('unread', `your saved progress could not be read, so this session starts fresh; the old text is kept as ${BAK_KEY} in this browser`);
    }
  }
  return tidy(s);
}

/** The defaults with whatever a parsed store holds laid over them, so a key this version added is never missing. */
function overlay(s, raw) {
  for (const k of Object.keys(s)) if (raw[k] !== undefined) s[k] = raw[k];
  return s;
}

/** A stored object as this version holds it: the old look's name, walls that are gone, a place or a missed list that is
 *  not the shape it should be. The first read and whatever another tab writes both go through here. */
function tidy(s) {
  if (s.rice === 'komorebi') s.rice = 'ossuary';  // the old look's name
  if (s.wall) s.wall = null;  // walls that are gone: the wall follows the scene now
  if (!s.place || typeof s.place !== 'object' || Array.isArray(s.place)) s.place = {};
  s.missed = tidyMissed(s.missed);
  if (typeof s.bakSeen !== 'string' || s.bakSeen.length > 40) s.bakSeen = '';
  if (!Number.isInteger(s.gen) || s.gen < 0) s.gen = 0;
  if (s.scene !== 'night' && s.scene !== 'ice') s.scene = 'night';
  if (!Number.isInteger(s.goalMins) || s.goalMins < 10 || s.goalMins > 600) s.goalMins = 60;
  s.nights = tidyNights(s.nights);
  const units = new Set(GROUPS.map(g => g.id));
  s.unitsSeen = Array.isArray(s.unitsSeen) ? [...new Set(s.unitsSeen.filter(id => units.has(id)))] : [];
  return s;
}

/* ── study nights: { 'YYYY-MM-DD': seconds }, the last 400 kept ────────────── */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
function tidyNights(n) {
  if (!n || typeof n !== 'object' || Array.isArray(n)) return {};
  const rows = Object.entries(n).filter(([k, v]) => DATE.test(k) && Number.isFinite(v) && v > 0)
    .sort(([a], [b]) => (a < b ? -1 : 1)).slice(-400);
  return Object.fromEntries(rows.map(([k, v]) => [k, Math.min(86400, Math.round(v))]));
}

export const state = read();

/* ── other tabs ───────────────────────────────────────────────────────────────
   A write by another tab fires 'storage' here (never in the tab that wrote it). The newest stored text is laid over this
   tab's `state` in place (nothing that imported it goes stale), cut down by tidy() exactly as read() does, and the page
   is told ('ossuary:sync') to repaint. Adopting never writes back, so two tabs cannot echo each other. A scroll in the
   other tab changes only `place`, which no panel paints, so that alone raises no event. `detail.fresh` is true when the other tab cleared or imported progress (`gen` moved):
   the open lesson is then drawn again too, so its old picks are not written back over the new store. The workspace on
   screen (`ws`) and the windows laid out on it (`layout`) are never adopted: they belong to this tab. Nothing redraws the
   windows from an adopted layout, so taking the other tab's would leave a window drawn here that its order no longer lists. */
const SHOWN = ['done', 'goals', 'tasks', 'days', 'missed', 'tabs', 'bakSeen', 'nights', 'goalMins'];   // what the panels paint; every other key is adopted quietly
function adopt() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (_) { return false; }   // half a write: the next event brings the whole
  if (!isObj(raw)) return false;                                                           // removed, or not a store: this tab keeps what it holds
  const fresh = tidy(overlay(defaults(), raw));
  fresh.ws = state.ws;                                     // the workspace on screen belongs to this tab alone
  fresh.layout = state.layout;                             // so do its windows: nothing redraws them from an adopted layout, so a window closed over there would linger here
  const wiped = fresh.gen !== state.gen;                   // progress was cleared or imported over there: this tab's open lesson is stale
  const shows = wiped || SHOWN.some(k => JSON.stringify(fresh[k]) !== JSON.stringify(state[k]));
  Object.assign(state, fresh);
  if (shows) window.dispatchEvent(new CustomEvent('ossuary:sync', { detail: { fresh: wiped } }));
  return shows;
}
addEventListener('storage', e => { if (e.key === STORE_KEY) adopt(); });

/* ask the browser not to evict this store when space runs short: once per page, quietly, and nothing waits on the answer */
(async () => {
  try {
    const st = navigator.storage;
    if (st && st.persist && !(st.persisted && await st.persisted())) await st.persist();
  } catch (_) { /* a browser that will not say is a browser that will not say */ }
})();

export const save = () => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    if (trouble === 'unsaved') { trouble = ''; failed = false; }   // storage came back: the warning is stale
  } catch (_) { saveFailed(); }
};

/* a write that changes one part of the store: what is stored is read back first and only that part is replaced, so a tab
   that has only been scrolled (the place) never writes over what another tab saved since this one loaded */
function savePart(edit) {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (_) { /* unreadable: the whole store is written instead */ }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) { save(); return; }
  try {
    edit(raw);
    localStorage.setItem(STORE_KEY, JSON.stringify(raw));
    if (trouble === 'unsaved') { trouble = ''; failed = false; }
  } catch (_) { saveFailed(); }
}

/* ── the move to MIMEI, once: the ambience is the desk's sound, so sound starts on (a browser still waits for the
   first click), and the units already finished before the sign existed do not all say COMPLETE at once. Only a
   store saved before the move is touched, and only these three keys are written (savePart), like every other part. ── */
if (!state.mimei) {
  const seen = GROUPS.filter(g => {
    const ls = writtenLessons().filter(l => l.g === g.id);
    return ls.length && ls.every(l => state.done.includes(l.id));
  }).map(g => g.id);
  Object.assign(state, { mimei: 1, sound: true, unitsSeen: seen });
  let stored = false;
  try { stored = !!localStorage.getItem(STORE_KEY); } catch (_) { /* no storage: nothing to move */ }
  if (stored) savePart(raw => Object.assign(raw, { mimei: 1, sound: true, unitsSeen: seen }));
}

/** Study time for one night. Only that night is written (savePart), and the larger of the two counts wins, so a second
 *  tab can never take time away. */
export function addStudy(key, secs) {
  if (!DATE.test(key) || !(secs > 0)) return 0;
  const v = Math.min(86400, Math.round((state.nights[key] || 0) + secs));
  state.nights[key] = v;
  state.nights = tidyNights(state.nights);
  savePart(raw => {
    const n = isObj(raw.nights) ? raw.nights : {};
    n[key] = Math.max(Number.isFinite(n[key]) ? n[key] : 0, v);
    raw.nights = tidyNights(n);
  });
  return v;
}

/* ── days + streak ────────────────────────────────────────────────────────── */
/** The calendar day as the learner lives it: local year, month and day. The UTC
 *  date flips at 1-2 am in Central Europe and mid-evening in the Americas. */
export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => dayKey();
if (!state.days.includes(today())) { state.days.push(today()); state.days.sort(); save(); }

export function streak() {
  let n = 0;
  const d = new Date();
  const have = new Set(state.days);       // a lookup per day walked back, not a scan of the whole list each time
  for (;;) {
    const key = dayKey(d);
    if (!have.has(key)) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/* ── checkpoints ──────────────────────────────────────────────────────────── */
export const isDone = id => state.done.includes(id);
export const goalsOf = id => state.goals[id] || [];
export const taskOf = id => state.tasks[id] || [];

const xpFor = (id, list) => list.reduce((n, i) => n + ((GOALS[id] && GOALS[id][i] && GOALS[id][i].xp) || 0), 0);
export const xpOf = id => xpFor(id, goalsOf(id));

/** Checkpoints reached across the written course. */
export function totalCps() {
  let n = 0;
  for (const l of writtenLessons()) n += goalsOf(l.id).filter(i => i < (GOALS[l.id] || []).length).length;
  return n;
}

export function totalXP() {
  let n = 0;
  for (const id of Object.keys(state.goals)) n += xpOf(id);
  return n;
}

export const lessonProgress = id => {
  const total = (GOALS[id] || []).length || 1;
  const have = goalsOf(id).length;
  return { have, total, ratio: isDone(id) ? 1 : Math.min(1, have / total) };
};

export function markDone(id) {
  if (isDone(id)) return false;
  state.done.push(id);
  save();
  return true;
}

/**
 * Tick a goal. Returns what just happened so the caller can show it:
 * { xp, leveled, rank } (kept for old callers; nothing on screen shows XP or
 * ranks) — the machine says so in the journal, there are no popups to dismiss.
 */
export function setGoal(id, index) {
  const g = state.goals[id] || (state.goals[id] = []);
  if (g.includes(index)) return null;
  const beforeXP = totalXP();
  const beforeRank = levelOf(beforeXP);
  g.push(index);
  save();
  const after = totalXP();
  const rank = levelOf(after);
  return { xp: after - beforeXP, leveled: rank.i > beforeRank.i, rank, beforeRank };
}

export function toggleTask(id, i) {
  const t = state.tasks[id] || (state.tasks[id] = []);
  const at = t.indexOf(i);
  if (at === -1) t.push(i); else t.splice(at, 1);
  save();
  return t.includes(i);
}

/** Unticking a checkpoint: a learner who misread a goal should not be stuck
 *  with it. Retiring the lesson's "done" state comes with it. */
export function unsetGoal(id, index) {
  const g = state.goals[id];
  if (!g) return false;
  const at = g.indexOf(index);
  if (at === -1) return false;
  g.splice(at, 1);
  state.done = state.done.filter(x => x !== id);
  save();
  return true;
}

/** The goals pane's click: tick it, or untick it if it is already ticked. */
export function toggleGoal(id, index) {
  if (goalsOf(id).includes(index)) {
    unsetGoal(id, index);
    log('dim', `[ - ] goal unticked — ${id}`);
    return { on: false, res: null };
  }
  return { on: true, res: completeGoal(id, index) };
}

/**
 * Called when a lesson's every goal is ticked: retires the stop and opens the
 * session in the journal on the ladder rung it reached.
 */
export function completeGoal(lessonId, index) {
  const res = setGoal(lessonId, index);
  if (!res) return null;
  const goals = GOALS[lessonId] || [];
  if (goals.length && goalsOf(lessonId).length >= goals.length) {
    if (markDone(lessonId)) {
      const l = LESSONS.find(x => x.id === lessonId);
      log('ok', `[ OK ] unit-${(l && l.g || '').replace('g', '')} — ${l ? l.n + ' ' + l.title : lessonId} finished`);
      announce(`${l ? l.title : lessonId} finished.`);
    }
  }
  log('dim', `[ + ] checkpoint reached — ${goalsOf(lessonId).length} of ${goals.length}`);   // no XP, no ranks: the study counts checkpoints
  return res;
}

export function clearProgress() {
  state.done = []; state.goals = {}; state.tasks = {}; state.tabs = []; state.place = {}; state.missed = {};
  state.gen++;                              // other tabs see this and draw their open lesson again
  save();
}

/* ── course helpers that need progress ───────────────────────────────────── */
/* ── the place: where the learner stopped in each lesson ──────────────────────
   { s: step, m: furthest step seen, y: scrollTop, p: { probe id: option picked } }. A few numbers per lesson and nothing
   for a lesson never opened; session.js writes it and puts it back after render. */
export const placeOf = id => (Object.hasOwn(state.place, id) ? tidyPlace(state.place[id]) : null);
export function setPlace(id, p) {
  const t = tidyPlace(p || {});
  const now = t.s || t.m || t.y || t.p ? t : undefined;
  if (JSON.stringify(state.place[id]) === JSON.stringify(now)) return;
  if (now) state.place[id] = now; else delete state.place[id];
  savePart(raw => {                       // only this lesson's place is written: a tab that was just scrolled must not undo another tab's progress
    if (!isObj(raw.place)) raw.place = {};
    if (now) raw.place[id] = now; else delete raw.place[id];
  });
}

/* ── missed probes: what the learner got wrong, kept so it can come back ──────
   { lesson id: { probe id: { n: times missed (stops at 9), t: when it was first missed } } }. A wrong pick files one; a
   right pick later (the lesson's own probe, or a warm-up that asked it again) takes it out. Only known lessons and
   probes are kept, so the store stays small however long someone struggles. */
function tidyMissed(m) {
  const out = {};
  if (!m || typeof m !== 'object' || Array.isArray(m)) return out;
  const ids = new Set(LESSONS.map(l => l.id));
  for (const [lid, row] of Object.entries(m)) {
    if (!ids.has(lid) || !row || typeof row !== 'object' || Array.isArray(row)) continue;
    const kept = Object.entries(row)
      .filter(([pid, v]) => Object.hasOwn(PREDICTS, pid) && v && Number.isInteger(v.n) && v.n > 0)
      .map(([pid, v]) => [pid, { n: Math.min(v.n, 9), t: Number.isFinite(v.t) && v.t > 0 ? Math.round(v.t) : 0 }]);
    if (kept.length) out[lid] = Object.fromEntries(kept);
  }
  return out;
}

/** A wrong pick on a probe: count it. Returns the count, or 0 when the lesson or probe is not real. */
export function missProbe(lessonId, probeId) {
  if (!Object.hasOwn(PREDICTS, probeId) || !LESSONS.some(l => l.id === lessonId)) return 0;
  const row = Object.hasOwn(state.missed, lessonId) ? state.missed[lessonId] : (state.missed[lessonId] = {});
  const was = Object.hasOwn(row, probeId) ? row[probeId] : null;
  row[probeId] = { n: Math.min(9, (was ? was.n : 0) + 1), t: was ? was.t : Date.now() };
  save();
  return row[probeId].n;
}

/** A right pick: the probe is no longer weak. */
export function clearMiss(lessonId, probeId) {
  if (!Object.hasOwn(state.missed, lessonId) || !Object.hasOwn(state.missed[lessonId], probeId)) return false;
  delete state.missed[lessonId][probeId];
  if (!Object.keys(state.missed[lessonId]).length) delete state.missed[lessonId];
  save();
  return true;
}

/** Every stored miss, the oldest first: [{ lessonId, probeId, n, t }]. */
export function missList() {
  const out = [];
  for (const [lessonId, row] of Object.entries(state.missed)) {
    for (const [probeId, v] of Object.entries(row)) out.push({ lessonId, probeId, n: v.n, t: v.t });
  }
  return out.sort((a, b) => a.t - b.t);
}

/* ── one file to keep: export and import ──────────────────────────────────────
   Only progress travels (what was ticked, where you stopped); the look, the layout and the switches stay on the machine. */
const PROGRESS = ['done', 'goals', 'tasks', 'days', 'place', 'nights'];
const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
const ints = v => Array.isArray(v) && v.every(n => Number.isInteger(n) && n >= 0);
const rows = (v, ok) => isObj(v) && Object.values(v).every(ok);
const SHAPE = {
  done: v => Array.isArray(v) && v.every(x => typeof x === 'string'),
  goals: v => rows(v, ints),
  tasks: v => rows(v, ints),
  days: v => Array.isArray(v) && v.every(x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)),
  place: v => rows(v, isObj),
  nights: v => rows(v, x => Number.isFinite(x) && x >= 0),
};
const n0 = v => (Number.isFinite(v) && v > 0 ? Math.round(v) : 0);

/** One lesson's place, cut down to the three numbers and the picks it may hold. */
function tidyPlace(o) {
  if (!isObj(o)) o = {};
  const q = { s: n0(o.s), m: n0(o.m), y: n0(o.y) };
  const p = isObj(o.p) ? Object.entries(o.p).filter(([k, v]) => k !== '__proto__' && Number.isInteger(v) && v >= 0 && v < 20) : [];
  if (p.length) q.p = Object.fromEntries(p);
  return q;
}

export function progressFile() {
  const progress = {};
  for (const k of PROGRESS) progress[k] = state[k];
  return JSON.stringify({ app: 'mimei', v: 1, saved: new Date().toISOString(), progress }, null, 1);
}

/** Check a file's text before anything is replaced: { ok: true, data, sum } or { ok: false, why }. */
export function readProgressFile(text) {
  let raw;
  try { raw = JSON.parse(text); } catch (_) { return { ok: false, why: 'it is not a JSON file' }; }
  const p = isObj(raw) && isObj(raw.progress) ? raw.progress : raw;
  if (!isObj(p) || !PROGRESS.some(k => k in p)) return { ok: false, why: 'it holds no MIMEI progress' };
  for (const k of PROGRESS) if (k in p && !SHAPE[k](p[k])) return { ok: false, why: `its "${k}" part is not what MIMEI saves` };
  const ids = new Set(LESSONS.map(l => l.id));
  const mine = o => Object.entries(o || {}).filter(([k]) => ids.has(k));
  const data = {
    done: [...new Set((p.done || []).filter(id => ids.has(id)))],
    goals: Object.fromEntries(mine(p.goals).map(([id, g]) => [id, [...new Set(g)].filter(i => i < (GOALS[id] || []).length)])),
    place: Object.fromEntries(mine(p.place).map(([k, v]) => [k, tidyPlace(v)])),
    tasks: Object.fromEntries(Object.entries(p.tasks || {}).filter(([k]) => Object.hasOwn(TASKS, k)).map(([k, t]) => [k, [...new Set(t)]])),
    days: [...new Set(p.days || [])].sort().filter(d => d <= today()).slice(-3700),   // none from the future; ten years of days is more than a streak can use
    nights: 'nights' in p ? tidyNights(Object.fromEntries(Object.entries(p.nights).filter(([k]) => k <= today()))) : null,   // a file from before the nights keeps this browser's
  };
  const xp = Object.entries(data.goals).reduce((n, [id, g]) => n + xpFor(id, g), 0);
  const cps = Object.values(data.goals).reduce((n, g) => n + g.length, 0);
  return { ok: true, data, sum: { done: data.done.length, cps, xp, days: data.days.length } };
}

/** Put a checked file in place of this browser's progress. */
export function applyProgress(data) {
  Object.assign(state, { done: data.done, goals: data.goals, tasks: data.tasks, days: data.days, place: data.place, missed: {}, gen: state.gen + 1 });
  if (data.nights) state.nights = data.nights;   // the file holds no misses: the ones kept here belong to the progress it replaces
  if (!state.days.includes(today())) { state.days.push(today()); state.days.sort(); }
  save();
}

export const nextStop = () => nextLesson(isDone);
export const sheetFor = id => cheatFor(id);
export const written = () => writtenLessons();
export const progressSummary = () => {
  const writtenIds = writtenLessons().map(l => l.id);
  const done = writtenIds.filter(isDone).length;
  return { done, total: writtenIds.length, cps: totalCps(), totalCps: TOTAL_CPS, xp: totalXP(), totalXP: TOTAL_XP, streak: streak() };
};
