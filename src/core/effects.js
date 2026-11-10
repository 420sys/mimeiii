/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/EFFECTS
   Rain, scanlines, grain, parallax and the watchdog that decides how much of
   the theatre this particular machine can afford. The level is also the
   desk's motion setting: 2 or 3 is Full, 1 is Calm, 0 is Still.

   Levels:  3 everything · 2 no blur/parallax · 1 no scan/grain/rain/glitch
            0 a static desktop, identical layout, nothing moving

   Level 3 is the default and is only kept if the frames are actually cheap:
   the watchdog samples real frame times, and on a slow machine it steps the
   level down and says so in the journal. A learner never has to find a
   settings switch to make the site fast.
   ════════════════════════════════════════════════════════════════════════════ */

import { log, ticker } from './journal.js';
import { state, save } from './state.js';

const rmq = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => rmq.matches;

let level = 3;
let rainOn = true, rainRaf = 0, rainCtx = null, drops = [], splashes = [], rainW = 0, rainH = 0;
let lastFrame = 0, slowStreak = 0, fastStreak = 0, frames = [], watching = false;
let autoCeiling = 3;

/* ── level control ────────────────────────────────────────────────────────── */
export const fxLevel = () => level;

const HINTS = {
  full: 3, balanced: 2, minimal: 1, static: 0,
};
export const FX_PREFS = ['full', 'balanced', 'minimal', 'static'];

/** Who to tell when the level changes (the bar's fx module, the settings pane). */
const fxListeners = new Set();
export const onFx = fn => { fxListeners.add(fn); return () => fxListeners.delete(fn); };

/** What the machine can afford before it has measured anything. */
function deviceCeiling() {
  const c = navigator.hardwareConcurrency || 8;
  const mem = navigator.deviceMemory || 8;
  const save = navigator.connection && navigator.connection.saveData;
  if (save) return 1;
  if (c <= 2 || mem <= 2) return 1;
  if (c <= 4 || mem <= 4) return 2;
  return 3;
}

export function setLevel(n, reason = '') {
  /* Reduced motion is not a preference to be overruled: the operating system
     asked for stillness, so nothing — not even a `?fx=` pin, not the watchdog —
     gets to raise the level above 0. */
  const asked = Math.max(0, Math.min(3, n));
  const next = reduced() ? 0 : asked;
  const changed = next !== level;
  level = next;
  document.documentElement.dataset.fx = String(level);
  if (changed && reason) {
    log(level <= 1 ? 'warn' : 'dim', `[ ${level <= 1 ? '!' : '*'} ] effects level ${level} — ${reason}`);
    if (level <= 1) ticker('warn', `effects reduced to level ${level} — ${reason}`);
  }
  if (level <= 1) stopRain(); else if (rainOn) startRain();
  applyRainVisibility();
  if (changed) for (const fn of fxListeners) { try { fn(level); } catch (_) {} }
  return level;
}

/** Called once at boot with the stored preference. */
export function initEffects() {
  buildNoise();
  autoCeiling = deviceCeiling();

  if (reduced()) {
    setLevel(0, 'reduced motion requested');
  } else if (state.fx === 'auto') {
    setLevel(autoCeiling, autoCeiling < 3 ? 'measured from this device' : '');
  } else {
    setLevel(HINTS[state.fx] ?? 3, `you set ${state.fx}`);
  }

  rainOn = !!state.rain;
  if (rainOn && level >= 2) startRain();
  applyRainVisibility();

  /* the setting can change while the page is open — follow it either way */
  rmq.addEventListener('change', () => {
    if (reduced()) setLevel(0, 'reduced motion requested');
    else if (state.fx === 'auto') setLevel(autoCeiling, 'reduced motion is off again');
    else setLevel(HINTS[state.fx] ?? 3, `you set ${state.fx}`);
  });

  if (level >= 3 && matchMedia('(pointer: fine)').matches && !reduced()) {
    document.body.classList.add('parallax');
    addEventListener('pointermove', onPointerMove, { passive: true });
  }
  if (level >= 2) watch();
  const sleep = () => document.documentElement.toggleAttribute('data-asleep', document.hidden);
  sleep();
  addEventListener('visibilitychange', () => {
    sleep();
    if (document.hidden) stopRain(); else if (rainOn && level >= 2) startRain();
  });
  return level;
}

/** Manual choice: 'auto' hands control back to the watchdog. */
export function setFxPreference(pref) {
  state.fx = pref; save();
  if (pref === 'auto') {
    autoCeiling = deviceCeiling();
    setLevel(autoCeiling, 'auto');
  } else {
    setLevel(HINTS[pref] ?? 3, `you set ${pref}`);
  }
  return level;
}

export const fxPreference = () => state.fx;

/** Alt+P / the bar's fx module: step the machine one notch quieter, by hand. */
export function cycleFxPreference() {
  const here = state.fx === 'auto' ? level : (HINTS[state.fx] ?? level);
  const next = (here + 3) % 4;            // 3→2→1→0→3
  return setFxPreference(FX_PREFS.find(p => HINTS[p] === next));
}

/* ── the watchdog ─────────────────────────────────────────────────────────── */
function watch() {
  if (watching) return;
  watching = true;
  requestAnimationFrame(sample);
}

function sample(now) {
  requestAnimationFrame(sample);
  if (document.hidden || !lastFrame) { lastFrame = now; return; }
  const dt = now - lastFrame;
  lastFrame = now;
  if (dt > 250) { frames.length = 0; return; }       // a tab woke up: ignore it
  frames.push(dt);
  if (frames.length < 90) return;

  frames.sort((a, b) => a - b);
  const p95 = frames[Math.floor(frames.length * .95)];
  frames.length = 0;

  if (state.fx !== 'auto') return;                   // the learner has chosen
  if (p95 > 26) {
    slowStreak++; fastStreak = 0;
    if (slowStreak >= 2 && level > 0) {
      slowStreak = 0;
      setLevel(level - 1, `frames were taking ${Math.round(p95)}ms`);
    }
  } else if (p95 < 15) {
    fastStreak++; slowStreak = 0;
    if (fastStreak >= 6 && level < autoCeiling) {
      fastStreak = 0;
      setLevel(level + 1, 'the machine is keeping up again');
    }
  }
}

export const fxReport = () => ({
  level, preference: state.fx, ceiling: autoCeiling,
  reduced: reduced(), rain: rainOn,
  fps: lastFrame ? Math.round(1000 / Math.max(1, lastFrame)) : null,
});

/* ── grain: a tiny noise tile, made once, cached as a data-URI ────────────── */
function buildNoise() {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const ctx = c.getContext('2d');
  const data = ctx.createImageData(96, 96);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = 120 + Math.random() * 135;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  document.documentElement.style.setProperty('--noise', `url("${c.toDataURL('image/png')}")`);
}

/* ── rain ─────────────────────────────────────────────────────────────────── */
export function setRain(on, { remember = true } = {}) {
  rainOn = !!on;
  if (remember) { state.rain = rainOn; save(); }
  applyRainVisibility();
  if (rainOn && level >= 2 && !document.hidden) startRain(); else stopRain();
  return rainOn;
}

export const rainWanted = () => rainOn;

function applyRainVisibility() {
  const cv = document.getElementById('rain');
  if (cv) cv.hidden = !rainOn || level < 2;
}

function startRain() {
  const cv = document.getElementById('rain');
  if (!cv || rainRaf) return;
  rainCtx = cv.getContext('2d');
  sizeRain();
  addEventListener('resize', sizeRain);
  if (reduced()) return;
  rainRaf = requestAnimationFrame(rainFrame);
}

function stopRain() {
  cancelAnimationFrame(rainRaf);
  rainRaf = 0;
  const cv = document.getElementById('rain');
  if (cv && rainCtx) rainCtx.clearRect(0, 0, cv.width, cv.height);
}

function sizeRain() {
  const cv = document.getElementById('rain');
  if (!cv) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  rainW = cv.width = Math.round(innerWidth * dpr);
  rainH = cv.height = Math.round(innerHeight * dpr);
  cv.style.width = innerWidth + 'px';
  cv.style.height = innerHeight + 'px';
  const n = Math.min(180, Math.round(innerWidth / 9));
  drops = Array.from({ length: n }, () => newDrop());
  splashes = [];
}

const newDrop = () => ({
  x: Math.random() * rainW,
  y: Math.random() * rainH,
  l: 9 + Math.random() * 20,
  s: .7 + Math.random() * 1.5,
  a: .05 + Math.random() * .16,
  hue: Math.random() < .07,
});

let rainIdle = false;
function rainFrame() {
  rainRaf = requestAnimationFrame(rainFrame);
  if (!rainCtx) return;
  /* the desk (workspace 1) and the lessons (workspace 2) have their own weather: this canvas is hidden there, so it draws nothing */
  if (document.body.dataset.ws === '1' || document.body.dataset.ws === '2') {
    if (!rainIdle) { rainCtx.clearRect(0, 0, rainW, rainH); rainIdle = true; }
    return;
  }
  rainIdle = false;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const cs = getComputedStyle(document.documentElement);
  const cool = cs.getPropertyValue('--accent-2').trim() || '#aac8ff';
  const warm = cs.getPropertyValue('--accent').trim() || '#ff8cdc';

  rainCtx.clearRect(0, 0, rainW, rainH);
  rainCtx.lineCap = 'round';
  rainCtx.lineWidth = 1 * dpr;
  for (const d of drops) {
    rainCtx.strokeStyle = hexA(d.hue ? warm : cool, d.a);
    rainCtx.beginPath();
    rainCtx.moveTo(d.x, d.y);
    rainCtx.lineTo(d.x - 1.2 * dpr, d.y + d.l * dpr);
    rainCtx.stroke();
    d.y += d.s * 4.4 * dpr;
    d.x -= d.s * .5 * dpr;
    if (d.y > rainH) {
      if (Math.random() < .25) splashes.push({ x: d.x, y: rainH - 2 * dpr, r: 1 * dpr, a: .16 });
      Object.assign(d, newDrop(), { y: -d.l * dpr, x: Math.random() * rainW });
    }
  }
  for (let i = splashes.length - 1; i >= 0; i--) {
    const s = splashes[i];
    rainCtx.strokeStyle = hexA(cool, Math.max(0, s.a));
    rainCtx.beginPath();
    rainCtx.arc(s.x, s.y, s.r, Math.PI, 0);
    rainCtx.stroke();
    s.r += .5 * dpr; s.a -= .02;
    if (s.a <= 0) splashes.splice(i, 1);
  }
}

/** #rrggbb + alpha → rgba(), so the rain can follow the look's palette. */
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(n.slice(0, 2), 16) || 170;
  const g = parseInt(n.slice(2, 4), 16) || 200;
  const b = parseInt(n.slice(4, 6), 16) || 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, a))})`;
}

/* ── parallax: the wall leans very slightly towards the cursor ───────────── */
let px = 0, py = 0, queued = false;
function onPointerMove(e) {
  if (level < 3) return;
  px = (e.clientX / innerWidth - .5) * -14;
  py = (e.clientY / innerHeight - .5) * -10;
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    document.documentElement.style.setProperty('--px', px.toFixed(1) + 'px');
    document.documentElement.style.setProperty('--py', py.toFixed(1) + 'px');
  });
}

/* ── one-off flourishes ───────────────────────────────────────────────────── */
export function flash(kind) {
  if (level < 1) return;
  if (kind === 'levelup') {
    document.body.classList.add('levelup');
    setTimeout(() => document.body.classList.remove('levelup'), 900);
  }
  if (kind === 'glitch' && level >= 2) {
    document.body.classList.add('glitch');
    setTimeout(() => document.body.classList.remove('glitch'), 280);
  }
  if (kind === 'wipe') {
    document.body.classList.remove('wipe');
    void document.body.offsetWidth;
    document.body.classList.add('wipe');
    setTimeout(() => document.body.classList.remove('wipe'), 440);
  }
}

/* ── peek: everything steps aside so the wall is the whole screen ────────── */
export function setPeek(on, { focusBack = false } = {}) {
  document.body.classList.toggle('peek', !!on);
  const back = document.getElementById('peek-back');
  const btn = document.getElementById('mod-peek');
  if (back) {
    back.hidden = !on;
    back.tabIndex = on ? 0 : -1;
  }
  if (btn) btn.setAttribute('aria-pressed', String(!!on));
  if (on && focusBack && back) setTimeout(() => back.focus({ preventScroll: true }), 120);
  if (on) log('dim', '[ * ] the city only — Esc brings everything back');
  return !!on;
}
export const isPeeking = () => document.body.classList.contains('peek');
