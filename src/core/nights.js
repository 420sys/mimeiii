/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/NIGHTS
   Tonight's study time, for the goal in the desk's menu (one hour unless
   Settings says otherwise) and the study nights of the week under it.

     · time counts while a lesson is open (workspace 2) and the page has been
       used in the last 15 minutes: reading, scrolling, ticking. Working in
       Roblox Studio beside it still counts, until the page has gone untouched
       for a quarter of an hour.
     · a night ends at 5 a.m.: 01:30 on Friday is still Thursday night.
     · a night with at least 10 minutes of study counts towards the week.
     · with two tabs open, only the one used last counts, so nothing doubles.

   The seconds live in the store as `nights` (state.js writes only the night
   that changed); export and import carry them with the rest of the progress.
   ════════════════════════════════════════════════════════════════════════════ */

import { addStudy, dayKey, state, STORE_KEY } from './state.js';

const TICK = 20_000;                 // how often time is added
const IDLE = 15 * 60_000;            // untouched this long, and the time stops
const MAX_STEP = 90_000;             // the most one tick adds (hidden tabs tick once a minute)
const ENDS = 5;                      // a night ends at 05:00
export const NIGHT_MIN = 600;        // seconds: a study night
const INPUT_KEY = `${STORE_KEY}.input`;
const TAB = Math.random().toString(36).slice(2, 10);

/** The night a moment belongs to: the evening's date (before 5 a.m. it is still last night). */
export const nightKey = (d = new Date()) =>
  dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() - ENDS, d.getMinutes()));

/** Evening and night say "tonight"; the day says "today". */
export const isNight = (d = new Date()) => d.getHours() >= 17 || d.getHours() < ENDS;

export const secondsOn = key => state.nights[key] || 0;
export const tonight = (d = new Date()) => secondsOn(nightKey(d));
export const goalSeconds = () => state.goalMins * 60;

/** `0:42` from seconds. */
export const hm = secs => { const m = Math.floor(secs / 60); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };

/** The ISO week (Monday first) the night of `d` falls in: its number and its seven nights. */
export function week(d = new Date()) {
  const [y, m, day] = nightKey(d).split('-').map(Number);
  const n = new Date(y, m - 1, day);
  const wd = (n.getDay() + 6) % 7;                        // 0 = Monday
  const mon = new Date(y, m - 1, day - wd);
  const nights = Array.from({ length: 7 }, (_, i) => {
    const k = dayKey(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i));
    return { key: k, on: secondsOn(k) >= NIGHT_MIN, now: i === wd, letter: 'MTWTFSS'[i] };
  });
  const t = new Date(Date.UTC(y, m - 1, day));
  t.setUTCDate(t.getUTCDate() + 3 - wd);                  // the Thursday of this week names it
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const num = 1 + Math.round(((t - y0) / 864e5 - 3 + ((y0.getUTCDay() + 6) % 7)) / 7);
  return { num, nights, studied: nights.filter(x => x.on).length };
}

/* ── the counter ──────────────────────────────────────────────────────────── */
let lastInput = Date.now(), lastTick = Date.now(), lastShare = 0, timer = 0, studying = () => false;
const listeners = new Set();
export const onNights = fn => { listeners.add(fn); return () => listeners.delete(fn); };

/** Tell the other tabs this one was used last (at most every few seconds). */
function used() {
  lastInput = Date.now();
  if (lastInput - lastShare < 4000) return;
  lastShare = lastInput;
  try { localStorage.setItem(INPUT_KEY, `${TAB}:${lastInput}`); } catch (_) { /* private mode: this tab counts alone */ }
}

function mine() {
  let v = '';
  try { v = localStorage.getItem(INPUT_KEY) || ''; } catch (_) { return true; }
  const [tab, t] = v.split(':');
  return !tab || tab === TAB || !(+t > lastInput);
}

/** Add the time since the last tick, if it was study. Returns the seconds added. */
export function tick(now = Date.now()) {
  /* a tab behind Roblox Studio is woken about once a minute, so up to 90 s counts;
     a laptop that slept does not add the hours it slept */
  const dt = Math.min(now - lastTick, MAX_STEP) / 1000;
  lastTick = now;
  if (!(dt > 0) || !studying() || now - lastInput > IDLE || !mine()) return 0;
  addStudy(nightKey(new Date(now)), dt);
  for (const fn of listeners) { try { fn(); } catch (_) {} }
  return dt;
}

/** Start counting. `isStudying()` says whether a lesson is open on screen. */
export function initNights({ isStudying }) {
  studying = isStudying;
  for (const ev of ['pointerdown', 'keydown', 'wheel']) addEventListener(ev, used, { passive: true, capture: true });
  addEventListener('scroll', used, { passive: true, capture: true });
  let moved = 0;
  addEventListener('pointermove', () => { const t = Date.now(); if (t - moved > 2000) { moved = t; used(); } }, { passive: true });
  addEventListener('pagehide', () => tick());
  if (!timer) timer = setInterval(() => tick(), TICK);
}

/** What the tests and the menu read. */
export const nightsReport = () => ({ key: nightKey(), tonight: tonight(), goal: goalSeconds(), lastInput, week: week() });
