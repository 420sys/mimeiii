/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · DESK/WORLD
   The crane view itself, loaded the first time the desk is seen: the city
   plate, the clouds and fog over it, the traffic and the planes, the rain
   or snow in two layers, and the hook with the old LED sign swaying on its
   cable. ui/desktop.js decides what the sign says; this file only draws.

     · only the scene on screen is loaded; a change of scene loads the new
       pictures, then cross-fades (Night turns into the 3 a.m. city by
       itself, the menu switches to Ice)
     · every layer is placed with its own matrix by the stage, so the LED
       glow screen-blends straight onto the city; the sign's button and its
       focus ring are placed the same way, so they sway with the glass
     · motion: 'full', 'calm' (half the sway, slower weather) or 'still'
       (nothing drifts; the sign flips long titles in pieces instead of
       scrolling them, and the world is redrawn four times a second)
     · it runs on the desk clock, which ui/desktop.js holds while the desk
       is not on screen: a desk nobody is looking at costs nothing
   ════════════════════════════════════════════════════════════════════════════ */

import { clock, clamp, ease, onFrame, tween } from './clock.js';
import { CV, FACE_P, LedRenderer, Sign } from './led.js';
import { M2, Stage } from './stage.js';
import { Atmos, Q } from './atmos.js';
import { Weather } from './weather.js';
import { Life } from './life.js';
import { IMG, SCENES } from './scenes.js';

/** One picture, decoded before it is shown; null when it cannot be had (the desk still works without it). */
const load = name => new Promise(ok => {
  if (!name) { ok(null); return; }
  const i = new Image();
  i.decoding = 'async';
  i.alt = '';
  i.onload = () => (i.decode ? i.decode() : Promise.resolve()).then(() => ok(i), () => ok(i));
  i.onerror = () => ok(null);
  i.src = `${IMG}${name}.webp`;
});

/** The face of the sign, in the sign canvas's own pixels (the LED canvas is placed at CV). */
export const FACE = FACE_P.map(([x, y]) => [x - CV.x, y - CV.y]);
export const SIGN_BOX = { w: CV.w, h: CV.h };

export class World {
  /**
   * root: the element holding .cr-backs, .cr-life, .cr-wxb, .cr-fronts, .cr-wxf, .cr-grades
   * onEvent({type, ...}): sign changes, blinks, chain creaks and scene changes, for the sound
   */
  constructor(root, { motion = 'full', onEvent = null, ledJS = false } = {}) {
    this.root = root;
    this.backs = root.querySelector('.cr-backs');
    this.fronts = root.querySelector('.cr-fronts');
    this.grades = root.querySelector('.cr-grades');
    this.stage = new Stage();
    this.weather = new Weather(root.querySelector('.cr-wxb'), root.querySelector('.cr-wxf'), this.stage);
    this.life = new Life(root.querySelector('.cr-life'), this.stage);
    this.sign = new Sign(3);
    this.sign.onEvent = kind => this.emit(kind === 'blink' ? { type: 'blink' } : { type: 'sign', kind });
    this.onEvent = onEvent;
    this.ledJS = ledJS;
    this.scenes = [];
    this.scene = null;
    this.busy = null;
    this.missing = [];
    this.act = 0; this.actT = 0;
    this.lastGrid = -1; this.lit = 0;
    this.frames = 0; this.acc = 0; this.lastCreak = -9;
    this.fading = false;
    this.setMotion(motion);
    onFrame((t, dt) => this.frame(t, dt));
  }

  emit(e) { if (this.onEvent) { try { this.onEvent(e); } catch (_) { /* the picture never waits on the sound */ } } }

  setMotion(m) {
    this.motion = m;
    this.stage.motion = m;
    this.weather.motion = m;
    this.life.motion = m;
    this.sign.still = m === 'still';
    for (const S of this.scenes) S.atm.motion = m;
  }

  /* ── scenes ─────────────────────────────────────────────────────────────── */
  async makeScene(k) {
    const c = SCENES[k];
    const names = [c.plate, c.hook, c.glass, c.sky, c.fog];
    const [plate, hook, glass, sky, fog] = await Promise.all(names.map(load));
    [plate, hook, glass, sky, fog].forEach((im, i) => { if (names[i] && !im && !this.missing.includes(names[i])) this.missing.push(names[i]); });
    const P = plate || document.createElement('div');
    P.className = plate ? 'plate' : 'plate plate-none';
    const atm = new Atmos(k, { sky, fog });
    atm.motion = this.motion;
    atm.cv.className = 'atmos';
    const led = document.createElement('canvas');
    led.className = 'led';
    const lr = new LedRenderer(led, { bloom: c.bloom, drops: c.drops, glass, js: this.ledJS });
    const g1 = document.createElement('div'), g2 = document.createElement('div');
    g1.className = `grade vig k-${k}`;
    g2.className = `grade warm k-${k}`;
    if (hook) hook.className = 'hook';
    const S = { k, plate: P, atm, hook, led, lr, grades: [g1, g2], els: [P, atm.cv, hook, led, g1, g2].filter(Boolean) };
    this.stage.add(P, [1, 0, 0, 1, 0, 0]);
    this.stage.add(atm.cv, [Q, 0, 0, Q, 0, 0]);
    if (hook) this.stage.add(hook, M2.T(250, 0), true);
    this.stage.add(led, M2.T(CV.x, CV.y), true);
    return S;
  }

  mount(S, a = 1) {
    this.backs.append(S.plate, S.atm.cv);
    if (S.hook) this.fronts.append(S.hook);
    this.fronts.append(S.led);
    this.grades.append(...S.grades);
    for (const e of S.els) e.style.opacity = String(a);
    this.scenes.push(S);
    S.lr.render(this.sign.grid);
  }

  unmount(S) {
    for (const e of S.els) { e.remove(); this.stage.remove(e); }
    this.scenes.splice(this.scenes.indexOf(S), 1);
  }

  /** The first scene: loaded, placed and drawn once, so the first frame on screen is already the city. */
  async start(k) {
    const S = await this.makeScene(k);
    this.mount(S, 1);
    this.scene = k;
    this.weather.set(k, true);
    this.life.set(k, true);
    this.draw(clock.t, 0);
    return this;
  }

  /** Cross-fade to another scene. `dur` 0 swaps at once (the desk is not on screen). */
  setScene(k, dur = 1.4) {
    if (!SCENES[k]) return Promise.resolve();
    const run = async () => {
      if (k === this.scene) return;
      const from = this.scenes[this.scenes.length - 1];
      const S = await this.makeScene(k);
      this.mount(S, 0);
      this.scene = k;
      this.weather.set(k, dur <= 0);
      this.life.set(k, dur <= 0);
      this.emit({ type: 'mode', to: k });
      this.fading = true;
      await tween(dur, e => {
        const a = e.toFixed(3), b = (1 - e).toFixed(3);
        for (const el of S.els) el.style.opacity = a;
        if (from) { from.led.style.opacity = b; for (const g of from.grades) g.style.opacity = b; }
      }, ease.sine);
      this.fading = false;
      if (from) this.unmount(from);
      if (dur <= 0) this.draw(clock.t, 0);
    };
    this.busy = (this.busy || Promise.resolve()).then(run, run);
    return this.busy;
  }

  /* ── the sign ───────────────────────────────────────────────────────────── */
  show(lines, kind = 'auto', dur) { this.sign.show(lines, kind, dur); }
  blink() { this.sign.blink(); }
  get blank() { return this.sign.blank; }

  /** Place an element over the sign's canvas (its button, its focus ring): it sways with the glass. */
  attach(el) { this.stage.add(el, M2.T(CV.x, CV.y), true); }

  /** Where the sign's face is on screen now (four corners, css px). */
  face() { return FACE_P.map(([x, y]) => this.stage.toScreen(x, y, true)); }

  set keepClear(px) { this.stage.keepClear = px; }

  /* ── the frame ──────────────────────────────────────────────────────────── */
  frame(t, dt) {
    if (!this.scenes.length) return;
    /* still: nothing drifts, so four redraws a second keep the clock-driven bits (the sign's pieces) honest */
    if (this.motion === 'still' && !this.sign.tr && !this.fading && this.frames) {
      this.acc += dt;
      if (this.acc < .25) return;
      dt = this.acc;
    }
    this.acc = 0;
    this.draw(t, dt);
  }

  draw(t, dt) {
    if (!this.scenes.length) return;
    this.frames++;
    const { stage, sign } = this;
    stage.update(t, dt);
    this.actT = clamp(this.actT + (this.act ? dt / .25 : -dt / .5));
    sign.act = ease.sine(this.actT);
    if (sign.update(t) || this.lastGrid < 0) {
      this.lastGrid = sign.version;
      for (const S of this.scenes) S.lr.render(sign.grid);
    }
    let sum = 0;
    for (let n = 0; n < sign.grid.length; n += 7) sum += sign.grid[n];
    this.lit = clamp(sum / 60);
    for (const S of this.scenes) S.atm.update(t, dt);
    this.life.atm = this.scenes[this.scenes.length - 1].atm;
    this.life.update(t, dt);
    this.weather.signLevel = this.lit;
    this.weather.update(t, dt);
    for (const e of stage.takeExtremes()) {
      if (e.amt > .82 && t - this.lastCreak > 3.2) { this.lastCreak = t; this.emit({ type: 'creak', amt: +e.amt.toFixed(2) }); }
    }
  }

  report() {
    return {
      scene: this.scene, layers: this.scenes.length, motion: this.motion, frames: this.frames,
      missing: this.missing.slice(), lit: +this.lit.toFixed(3), blank: this.sign.blank,
      led: this.scenes.length ? (this.scenes[0].lr.js ? 'js' : 'filter') : null,
      face: this.scenes.length ? this.face().map(p => p.map(v => Math.round(v))) : null,
    };
  }
}
