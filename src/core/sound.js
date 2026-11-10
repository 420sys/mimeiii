/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/SOUND
   Generated rather than downloaded: the desk's ambience (core/ambience.js:
   rain on steel and the city far below, the wind at 3 a.m., muffled snow,
   the sign's hum and its relays, the chain at the end of a swing) and a
   few soft clicks for the windows. Zero bytes, no licence to leak.

   Sound is on unless the learner turns it off (the switch is in the desk's
   menu and in Settings). A browser will not play anything until the page
   has been clicked or typed into, so the first click or key is what starts
   it: the ambience fades in over a couple of seconds. On the desk it plays
   at full level; with a lesson (or any other workspace) on screen it keeps
   going at half, and the sign's hum stops.
   ════════════════════════════════════════════════════════════════════════════ */

import { state, save } from './state.js';
import { log } from './journal.js';
import { Ambience } from './ambience.js';

let ctx = null, master = null, enabled = !!state.sound;
let amb = null, building = false, onDesk = false, scene = 'night', unlocked = false;

const VOL = { click: .035, open: .06, close: .05, ok: .08, level: .1, tick: .04 };
const LEVEL = { desk: .9, away: .45 };

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch (_) { return null; }
  master = ctx.createGain();
  master.gain.value = enabled ? .9 : 0;
  master.connect(ctx.destination);
  return ctx;
}

const level = () => (enabled ? (onDesk ? LEVEL.desk : LEVEL.away) : 0);
const later = fn => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 120));

/** The ambience is made once, after the first click or key (its loops take a moment to build), then only turned up and down. */
function ambience() {
  if (amb || building || !enabled || !unlocked) return;
  building = true;
  later(() => {
    building = false;
    const c = ensure();
    if (!c || amb || !enabled) return;
    try {
      amb = new Ambience(c, scene);
      amb.start(c.currentTime + .05, 2.5, level());
      amb.setHum(onDesk ? 1 : 0, c.currentTime + .1);
    } catch (e) {
      amb = null;
      console.warn('sound: no ambience', e);
    }
  });
}

function blip({ f = 880, f2 = null, t = .06, type = 'sine', vol = VOL.click, delay = 0 }) {
  if (!enabled || !unlocked) return;
  const c = ensure();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t0);
  if (f2) osc.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t0 + t);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + .006);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + t);
  osc.connect(g); g.connect(master);
  osc.start(t0); osc.stop(t0 + t + .02);
}

export const sound = {
  get on() { return enabled; },

  set(on) {
    enabled = !!on;
    state.sound = enabled; save();
    if (enabled) {
      unlocked = true;                 // this is a click: the browser will play now
      const c = ensure();
      if (c && c.state === 'suspended') c.resume();
      if (master) master.gain.value = .9;
      if (amb) amb.setLevel(level(), c.currentTime, .8); else ambience();
      blip({ f: 520, f2: 880, t: .12, vol: .06 });
      log('dim', '[ * ] sound on — the city, the sign and soft clicks');
    } else {
      if (amb && ctx) amb.setLevel(0, ctx.currentTime, .5);
      if (master) master.gain.value = 0;
      log('dim', '[ * ] sound off');
    }
    return enabled;
  },

  /** The desk is on screen (full level, the sign hums) or not (half level, no hum). */
  desk(on) {
    onDesk = !!on;
    if (!amb || !ctx) return;
    amb.setLevel(level(), ctx.currentTime, on ? 1.2 : .8);
    amb.setHum(on ? 1 : 0, ctx.currentTime + .05);
  },

  /** The scene on the desk: 'night', 'late' or 'ice'. The beds cross-fade. */
  scene(k) {
    if (!k || k === scene) return;
    scene = k;
    if (amb && ctx) amb.setMode(k, ctx.currentTime, 2);
  },

  /** Something happened on the desk: the sign changed, blinked or powered on, the chain creaked, a control was used. */
  event(e) {
    if (!enabled || !amb || !ctx || ctx.state !== 'running') return;
    if (e.type === 'mode') return;                    // scene() moves the beds
    amb.event(e, ctx.currentTime + .01);
  },

  click() { blip({ f: 1250, f2: 820, t: .03, vol: VOL.click }); },
  open() { blip({ f: 420, f2: 900, t: .1, vol: VOL.open, type: 'triangle' }); },
  close() { blip({ f: 700, f2: 300, t: .09, vol: VOL.close, type: 'triangle' }); },
  tick() { blip({ f: 1180, t: .03, vol: VOL.tick }); },
  ok(step = 0) { blip({ f: 660 + step * 120, f2: 990 + step * 120, t: .13, vol: VOL.ok, type: 'triangle' }); },
  level() {
    [0, 1, 2, 3].forEach(i => blip({ f: 440 * Math.pow(2, i / 4), t: .16, vol: VOL.level, type: 'triangle', delay: i * .09 }));
  },
  /** A lesson: a checkpoint ticked is a soft latch (two clicks), a right answer is the first click alone. */
  checkpoint() {
    blip({ f: 1500, f2: 760, t: .028, vol: .05 });
    blip({ f: 2200, f2: 1300, t: .022, vol: .03, delay: .05 });
  },
  correct() { blip({ f: 1500, f2: 760, t: .028, vol: .04 }); },
  /** The end of a lesson (summit, the name it kept): one quiet chime, three soft notes that ring out. */
  summit() {
    [659.3, 830.6, 987.8].forEach((f, i) => blip({ f, t: 1.4, vol: .035, delay: .05 + i * .13 }));
  },

  /** The old rain bed: the ambience has the rain now, so this only stays for older callers. */
  rain() {},

  /** What the tests read. */
  report() {
    return { on: enabled, unlocked, context: ctx ? ctx.state : null, ambience: !!amb, desk: onDesk, scene,
      level: amb ? +amb.master.gain.value.toFixed(3) : 0 };
  },
};

/** The first click or key anywhere is the browser's permission to play: start the ambience then. */
export function initSound() {
  const unlock = () => {
    unlocked = true;
    if (enabled) {
      const c = ensure();
      if (c && c.state === 'suspended') c.resume();
      ambience();
    }
    removeEventListener('pointerdown', unlock, true);
    removeEventListener('keydown', unlock, true);
  };
  addEventListener('pointerdown', unlock, true);
  addEventListener('keydown', unlock, true);
}
