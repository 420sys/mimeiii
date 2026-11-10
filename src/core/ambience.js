/* MIMEI · CORE/AMBIENCE — ported from proto/crane/desk/js/audio.js.
   Ambience only (no music). Night: rain on steel, drips off the sign, the city far below. 3 a.m.: wind, the city,
   now and then a far train. Snow: muffled wind. The sign hums faintly and its relays clack when the page changes;
   the chain creaks at the end of a swing. One graph for live playback and for the film (offline -> WAV). Seeded. */
import { rng } from '../desk/clock.js';

const BEDS = {
  night: { rain: .13, patter: .09, pings: .032, drips: .05, city: .1, cityLP: 190, wind: 0, hush: 0 },
  late: { rain: 0, patter: 0, pings: 0, drips: .018, city: .09, cityLP: 170, wind: .085, hush: 0 },
  ice: { rain: 0, patter: 0, pings: 0, drips: 0, city: .065, cityLP: 120, wind: .12, hush: .045 },
};
/* looping buffers: seamless (end cross-faded into the start) */
function loopBuf(ctx, secs, seed, fill) {
  const sr = ctx.sampleRate, n = Math.round(secs * sr), f = Math.round(.3 * sr), b = ctx.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) { const r = rng(seed + ch * 101), src = new Float32Array(n + f); fill(src, r, sr);
    const d = b.getChannelData(ch); d.set(src.subarray(0, n)); for (let i = 0; i < f; i++) { const k = i / f; d[i] = src[i] * k + src[n + i] * (1 - k); } }
  return b;
}
const white = (d, r) => { for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; };
const pink = (d, r) => { let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < d.length; i++) { const w = r() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
    b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; } };
const brown = (d, r) => { let l = 0; for (let i = 0; i < d.length; i++) { l = (l + .02 * (r() * 2 - 1)) / 1.02; d[i] = l * 3.5; } };
/* rain patter: thousands of tiny ticks */
const patter = (d, r, sr) => { const n = Math.round(d.length / sr * 90);
  for (let k = 0; k < n; k++) { const t0 = Math.floor(r() * d.length), a = Math.pow(r(), 3) * .9, L = Math.round(sr * (.002 + r() * .004)), tau = L / 3;
    for (let j = 0; j < L && t0 + j < d.length; j++) d[t0 + j] += a * (r() * 2 - 1) * Math.exp(-j / tau); } };
/* rain on steel: sparse inharmonic pings */
const pings = (d, r, sr) => { const n = Math.round(d.length / sr * 1.3);
  for (let k = 0; k < n; k++) { const t0 = Math.floor(r() * d.length), f = 1700 + r() * 2400, a = .15 + r() * .5, tau = .05 + r() * .12, L = Math.round(sr * tau * 5);
    for (let j = 0; j < L && t0 + j < d.length; j++) { const t = j / sr, e = Math.exp(-t / tau);
      d[t0 + j] += a * e * (Math.sin(6.283 * f * t) + .5 * Math.sin(6.283 * f * 2.76 * t) * Math.exp(-t / tau) + .25 * Math.sin(6.283 * f * 5.4 * t)); } } };
/* drips: falling 'plip' */
const drips = (d, r, sr) => { const n = Math.round(d.length / sr * .45);
  for (let k = 0; k < n; k++) { const t0 = Math.floor(r() * d.length), a = .3 + r() * .6, f0 = 1100 + r() * 700, L = Math.round(sr * .06); let ph = 0;
    for (let j = 0; j < L && t0 + j < d.length; j++) { const t = j / sr, f = f0 * (1 - .55 * Math.min(1, t / .035)); ph += 6.283 * f / sr; d[t0 + j] += a * Math.sin(ph) * Math.exp(-t / .016); } } };
/* slow random envelope 0..1 (for gusts and rain swells) */
const envelope = (lo, hi, per) => (d, r, sr) => { const step = Math.round(per * sr); let a = lo + (hi - lo) * r(), b = lo + (hi - lo) * r();
  for (let i = 0; i < d.length; i++) { if (i % step === 0) { a = b; b = lo + (hi - lo) * r(); } const k = (i % step) / step, s = k * k * (3 - 2 * k); d[i] = a + (b - a) * s; } };

export class Ambience {
  constructor(ctx, mode = 'night', seed = 21) {
    this.ctx = ctx; this.r = rng(seed); const c = ctx;
    this.master = c.createGain(); this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .3;
    const trim = c.createGain(); trim.gain.value = 1.8;   /* +5 dB: audible on laptop speakers at a normal volume */
    this.master.connect(trim); trim.connect(comp); comp.connect(c.destination);
    const src = (buf) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; this.sources.push(s); return s; };
    const biq = (type, f, q = .7) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
    const gain = (v = 0) => { const g = c.createGain(); g.gain.value = v; return g; };
    this.sources = []; this.g = {};
    const bed = (name, chain) => { const g = gain(BEDS[mode][name] || 0); chain.reduce((a, b) => (a.connect(b), b)).connect(g); g.connect(this.master); this.g[name] = g; return g; };
    const pinkB = loopBuf(c, 7, seed + 1, pink), whiteB = loopBuf(c, 5, seed + 2, white), brownB = loopBuf(c, 9, seed + 3, brown);
    /* rain bed with slow swells */
    const swell = gain(0), sw = src(loopBuf(c, 23, seed + 4, envelope(.72, 1, 2.6))); sw.connect(swell.gain);
    bed('rain', [src(pinkB), biq('highpass', 380), biq('lowpass', 7200), swell]);
    bed('patter', [src(loopBuf(c, 8, seed + 5, patter)), biq('bandpass', 2600, .6)]);
    bed('pings', [src(loopBuf(c, 11, seed + 6, pings)), biq('highpass', 1200)]);
    bed('drips', [src(loopBuf(c, 13, seed + 7, drips)), biq('lowpass', 3200)]);
    this.cityLP = biq('lowpass', BEDS[mode].cityLP); const cityEnv = gain(0), ce = src(loopBuf(c, 31, seed + 8, envelope(.75, 1, 4))); ce.connect(cityEnv.gain);
    bed('city', [src(brownB), this.cityLP, cityEnv]);
    /* wind: band-passed noise, gusting, the band moving with the gust */
    const gust = src(loopBuf(c, 37, seed + 9, envelope(.25, 1, 3.4))), gg = gain(0), bp = biq('bandpass', 260, .9), fm = gain(380);
    gust.connect(gg.gain); gust.connect(fm); fm.connect(bp.frequency);
    bed('wind', [src(pinkB), bp, biq('lowpass', 1400), gg]);
    bed('hush', [src(whiteB), biq('lowpass', 520), biq('highpass', 90)]);
    /* the sign: faint mains hum (follows how much of the sign is lit) */
    this.hum = gain(0); const hp = biq('lowpass', 900);
    for (const [f, a] of [[100, .5], [200, .3], [300, .14], [400, .06]]) { const o = c.createOscillator(); o.frequency.value = f; const g = gain(a); o.connect(g); g.connect(hp); this.sources.push(o); }
    hp.connect(this.hum); this.hum.connect(this.master);
    this.whiteB = whiteB; this.mode = mode;
  }
  start(at = 0, fade = 1.6, level = .9) { for (const s of this.sources) s.start(at); this.master.gain.setValueAtTime(0, at); this.master.gain.linearRampToValueAtTime(level, at + fade); }
  setLevel(v, at, dur = .6) { const p = this.master.gain; p.cancelScheduledValues(at); p.setValueAtTime(p.value, at); p.linearRampToValueAtTime(v, at + dur); }
  setMode(mode, at, dur = 2) {
    const B = BEDS[mode]; this.mode = mode;
    for (const k of Object.keys(this.g)) this.g[k].gain.setTargetAtTime(B[k] || 0, at, dur / 3);
    this.cityLP.frequency.setTargetAtTime(B.cityLP, at, dur / 3);
  }
  setHum(level, at) { this.hum.gain.setTargetAtTime(.0045 * level, at, .08); }
  /* --- one-shots --- */
  burst(at, { f = 2200, q = 1.2, dur = .04, decay = .018, a = .06 } = {}) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.whiteB; const b = c.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(a, at); g.gain.setTargetAtTime(0, at + .002, decay); s.connect(b); b.connect(g); g.connect(this.master);
    s.start(at, this.r() * 4); s.stop(at + dur + decay * 6);
  }
  tone(at, f, a, decay, type = 'sine', f1 = null) {
    const c = this.ctx, o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, at + decay * 3);
    const g = c.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(a, at + .003); g.gain.setTargetAtTime(0, at + .004, decay);
    o.connect(g); g.connect(this.master); o.start(at); o.stop(at + decay * 8);
  }
  clack(at, k = 1) { this.burst(at, { f: 2100, q: 1.4, a: .05 * k, decay: .012 }); this.tone(at, 150, .05 * k, .03); this.burst(at + .028, { f: 3200, q: 2, a: .02 * k, decay: .008 }); }
  power(at) { const c = this.ctx, o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 100; const lp = c.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(160, at); lp.frequency.exponentialRampToValueAtTime(1600, at + .8); const g = c.createGain(); g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(.012, at + .5); g.gain.linearRampToValueAtTime(0, at + 1.2); o.connect(lp); lp.connect(g); g.connect(this.master); o.start(at); o.stop(at + 1.3);
    this.clack(at, .9); this.clack(at + .42, .5); }
  creak(at, amt = 1) {
    const c = this.ctx, r = this.r, o = c.createOscillator(); o.type = 'sawtooth'; const f = 62 + r() * 30;
    o.frequency.setValueAtTime(f, at); o.frequency.linearRampToValueAtTime(f * (1.18 + r() * .2), at + .35);
    const vib = c.createOscillator(), vg = c.createGain(); vib.frequency.value = 17 + r() * 9; vg.gain.value = f * .05; vib.connect(vg); vg.connect(o.frequency);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 + r() * 500; bp.Q.value = 5;
    const g = c.createGain(), a = (.016 + .012 * r()) * Math.min(1.3, amt); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(a, at + .07);
    g.gain.linearRampToValueAtTime(a * .6, at + .3); g.gain.linearRampToValueAtTime(0, at + .48);
    o.connect(bp); bp.connect(g); g.connect(this.master); o.start(at); vib.start(at); o.stop(at + .5); vib.stop(at + .5);
  }
  tick(at) { this.tone(at, 2300, .022, .006); this.burst(at, { f: 5200, q: .8, a: .012, decay: .004 }); }
  train(at) { const c = this.ctx, s = c.createBufferSource(); s.buffer = this.whiteB; s.loop = true; const lp = c.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(140, at); lp.frequency.linearRampToValueAtTime(520, at + 6); lp.frequency.linearRampToValueAtTime(140, at + 14);
    const g = c.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.05, at + 6); g.gain.linearRampToValueAtTime(0, at + 14);
    s.connect(lp); lp.connect(g); g.connect(this.master); s.start(at); s.stop(at + 14.2); }
  /* the leap off the crane: air rushing past, rising, then gone under the lesson */
  whoosh(at) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.whiteB; s.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .8;
    bp.frequency.setValueAtTime(320, at); bp.frequency.exponentialRampToValueAtTime(2400, at + 1.05);
    const g = c.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(.05, at + .9); g.gain.linearRampToValueAtTime(0, at + 1.4);
    s.connect(bp); bp.connect(g); g.connect(this.master); s.start(at, this.r() * 4); s.stop(at + 1.45);
  }
  /* the desk's events -> sound */
  event(e, at) {
    if (e.type === 'sign') { if (e.kind === 'power') this.power(at); else if (e.kind === 'off') this.clack(at, .7); else this.clack(at, e.kind === 'roll' ? .55 : .8); }
    else if (e.type === 'hum') this.setHum(e.level, at);
    else if (e.type === 'creak') this.creak(at, e.amt);
    else if (e.type === 'ui') this.tick(at);
    else if (e.type === 'mode') this.setMode(e.to, at, 2);
    else if (e.type === 'train') this.train(at);
    else if (e.type === 'blink') { this.clack(at, .4); }
    else if (e.type === 'leap') this.whoosh(at + .2);
  }
}
