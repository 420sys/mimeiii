/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/MARGINS
   The study's weather stays in the margins: it falls in the city around the
   glass and never on the pane you are reading. Two canvases sit behind the
   panes:
     wx     the moving weather, drawn at 1× (soft streaks read as motion blur)
            and capped at 30 fps: drizzle at night, a few drops late, snow on ice;
     frost  what sits on the lens, drawn once per size or scene: water beads at
            night, frost creeping in from the edges on ice.
   Both are cut by the same hole (the panes: the reading pane, and the scripts
   drawer beside it when it is out), feathered, so the weather thins out
   before it reaches the glass. Still (or reduced motion) draws one frame and
   stops. Nothing is allocated per frame: the drops live in typed arrays and
   are stroked in a few buckets, one path per bucket.
   ════════════════════════════════════════════════════════════════════════════ */

import { rng } from '../desk/clock.js';

const FPS = 30;
const FADE = .8;                                   // seconds a new scene takes to come in
const MAXP = 1600;                                 // room in the typed arrays
const TAU = Math.PI * 2;

/* how each scene's weather differs from the night's drizzle */
const SCENES = {
  night: { kind: 'rain', n: 1, v: 1, a: 1, beads: 24 },
  late: { kind: 'rain', n: .3, v: .75, a: .7, beads: 14 },
  ice: { kind: 'snow', n: 1, v: 1, a: 1, beads: 0 },
};
const MOTION = { full: { n: 1, v: 1 }, calm: { n: .5, v: .6 }, still: { n: .5, v: 1 } };

/* rain buckets: [alpha, line width, share of the drops]; faint ones are the most */
const RAIN = [[.055, .65, .26], [.075, .9, .2], [.095, .65, .18], [.115, 1, .16], [.135, .8, .12], [.155, 1.1, .08]];
const NB = RAIN.length;
const MS = 4;                                      // the mask is built at 1/MS of the screen (buildMask)

function canvas(w = 1, h = 1) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

/* a flake: white core, a faint slate edge so it still reads against snow-white */
function flakeSprite() {
  const c = canvas(32, 32), g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(.4, 'rgba(255,255,255,.92)');
  gr.addColorStop(.58, 'rgba(238,242,247,.5)');
  gr.addColorStop(.74, 'rgba(24,32,43,.08)');
  gr.addColorStop(1, 'rgba(24,32,43,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return c;
}

/* a 0→1→1→0 ramp across [a−f/2, b+f/2], eased like smoothstep */
function ramp(g, a, b, f, vertical) {
  const s = a - f / 2, e = b + f / 2, span = Math.max(1, e - s), k = Math.min(.5, f / span);
  const gr = vertical ? g.createLinearGradient(0, s, 0, e) : g.createLinearGradient(s, 0, e, 0);
  const ease = [[0, 0], [.25, .156], [.5, .5], [.75, .844], [1, 1]];
  for (const [p, v] of ease) gr.addColorStop(p * k, `rgba(0,0,0,${v})`);
  for (const [p, v] of ease) gr.addColorStop(1 - k + p * k, `rgba(0,0,0,${1 - v})`);
  return gr;
}

export class Margins {
  /** wx: the moving-weather canvas; frost: the lens canvas. Both full-viewport, behind the lesson. */
  constructor({ wx, frost, seed = 11 } = {}) {
    this.wx = wx; this.frost = frost; this.seed = seed;
    this.cx = wx.getContext('2d');
    this.fx = frost.getContext('2d');
    this.r = rng(seed);
    this.mask = canvas();
    this.flake = flakeSprite();
    this.scene = 'night'; this.motion = 'full'; this.still = false;
    this.vw = 0; this.vh = 0; this.dpr = 1; this.hole = null; this.feather = 28;
    this.maskKey = ''; this.popKey = ''; this.frostKey = ''; this.mw = 0; this.mh = 0;
    this.on = false; this.raf = 0; this.last = 0; this.t = 0; this.fade = 1;
    this.cost = 0; this.peak = 0; this.frames = 0;
    this.n = 0; this.beads = 0; this.crystals = 0;
    this.X = new Float32Array(MAXP); this.Y = new Float32Array(MAXP); this.V = new Float32Array(MAXP);
    this.S = new Float32Array(MAXP);               // rain: streak length · snow: flake size
    this.P = new Float32Array(MAXP);               // snow: sway phase
    this.W = new Float32Array(MAXP);               // snow: sway width
    this.Q = new Float32Array(MAXP);               // snow: sway speed (radians a second)
    this.A = new Float32Array(MAXP);               // snow: alpha
    this.D = new Float32Array(MAXP);               // snow: depth (how hard the gusts push it)
    this.b0 = new Int32Array(NB + 1);
    this.styles = RAIN.map(() => 'rgba(0,0,0,0)');
    this.frame = (ts) => this.tick(ts);
  }

  /** The screen and the hole the weather keeps out of (the panes), in CSS px. */
  layout({ vw, vh, hole = null, feather = 28 } = {}) {
    vw = Math.max(1, Math.round(vw)); vh = Math.max(1, Math.round(vh));
    const dpr = Math.min(2, devicePixelRatio || 1);
    if (vw !== this.vw || vh !== this.vh) {
      this.wx.width = vw; this.wx.height = vh;
      this.wx.style.width = `${vw}px`; this.wx.style.height = `${vh}px`;
    }
    if (vw !== this.vw || vh !== this.vh || dpr !== this.dpr) {
      this.frost.width = Math.round(vw * dpr); this.frost.height = Math.round(vh * dpr);
      this.frost.style.width = `${vw}px`; this.frost.style.height = `${vh}px`;
      this.frostKey = '';
    }
    this.vw = vw; this.vh = vh; this.dpr = dpr; this.feather = feather;
    this.hole = hole ? { x0: Math.round(hole.x0), y0: Math.round(hole.y0), x1: Math.round(hole.x1), y1: Math.round(hole.y1) } : null;
    this.refresh();
  }

  /** scene: night | late | ice · motion: full | calm | still (reduced motion is still). */
  set({ scene = this.scene, motion = this.motion } = {}) {
    if (!SCENES[scene]) scene = 'night';
    if (!MOTION[motion]) motion = 'full';
    const changed = scene !== this.scene;
    this.scene = scene; this.motion = motion; this.still = motion === 'still';
    if (changed && !this.still && this.popKey) {
      /* the new weather comes in; the lens clears and frosts (or beads) over again */
      this.fade = 0;
      this.frost.style.transition = 'none';
      this.frost.style.opacity = '0';
      requestAnimationFrame(() => requestAnimationFrame(() => { this.frost.style.transition = `opacity ${FADE + .4}s ease`; this.frost.style.opacity = ''; }));
    } else if (this.still) this.fade = 1;
    this.refresh();
    this.schedule();
  }

  /** Start or stop the weather (study.js: only while the lessons are on screen and the tab is visible). */
  run(on) {
    on = !!on;
    if (on === this.on) return;
    this.on = on;
    if (!on) { cancelAnimationFrame(this.raf); this.raf = 0; return; }
    this.last = 0;
    if (this.still) this.paint(0);
    this.schedule();
  }

  /* ── internals ─────────────────────────────────────────────────────────── */

  schedule() {
    if (!this.on) return;
    if (this.still) { cancelAnimationFrame(this.raf); this.raf = 0; this.paint(0); return; }
    if (!this.raf) { this.last = 0; this.raf = requestAnimationFrame(this.frame); }
  }

  tick(ts) {
    this.raf = 0;
    if (!this.on || this.still) return;
    this.raf = requestAnimationFrame(this.frame);
    if (this.last && ts - this.last < 1000 / FPS - 3) return;
    const dt = this.last ? Math.min(.066, (ts - this.last) / 1000) : 1 / FPS;
    this.last = ts; this.t += dt;
    const t0 = performance.now();
    this.paint(dt);
    const ms = performance.now() - t0;
    this.cost = this.frames ? this.cost * .92 + ms * .08 : ms;
    if (this.frames > 10 && ms > this.peak) this.peak = ms;
    this.frames++;
  }

  /** Rebuild whatever the size, the hole, the scene or the motion made stale. */
  refresh() {
    if (!this.vw) return;
    const h = this.hole;
    const mk = `${this.vw}x${this.vh}|${h ? `${h.x0},${h.y0},${h.x1},${h.y1}` : '-'}|${this.feather}`;
    if (mk !== this.maskKey) { this.maskKey = mk; this.buildMask(); }
    const pk = `${this.scene}|${this.motion}|${this.vw}x${this.vh}`;
    if (pk !== this.popKey) { this.popKey = pk; this.populate(); }
    const fk = `${this.scene}|${mk}|${this.dpr}`;
    if (fk !== this.frostKey) { this.frostKey = fk; this.drawFrost(); }
    if (this.on && this.still) this.paint(0);
  }

  /* the mask is opaque where weather may fall and clear over the panes, with a feathered edge:
     alpha = 1 − inside(x) · inside(y), built from two eased ramps once per layout. It is all ramps,
     so it is built at a quarter of the size and drawn back up: a sixteenth of the pixels to fill. */
  buildMask() {
    const { vw, vh, hole: h, feather: f } = this, m = this.mask, k = MS;
    const w = Math.ceil(vw / k), hh = Math.ceil(vh / k);
    m.width = w; m.height = hh;
    this.mw = w * k; this.mh = hh * k;               // its size on screen: whole mask pixels, so the scale is exact
    const g = m.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, hh);
    this.masked = !!h;
    if (!h) return;
    const t = canvas(w, hh), c = t.getContext('2d');
    c.fillStyle = ramp(c, h.x0 / k, h.x1 / k, f / k, false); c.fillRect(0, 0, w, hh);
    c.globalCompositeOperation = 'destination-in';
    c.fillStyle = ramp(c, h.y0 / k, h.y1 / k, f / k, true); c.fillRect(0, 0, w, hh);
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(t, 0, 0);
    g.globalCompositeOperation = 'source-over';
    t.width = t.height = 0;
  }

  populate() {
    const { vw, vh, r } = this, sc = SCENES[this.scene], mo = MOTION[this.motion];
    const { X, Y, V, S, P, W, Q, A, D } = this;
    if (sc.kind === 'rain') {
      const n = Math.min(MAXP, Math.round(vw * vh / 4500 * sc.n * mo.n));
      let i = 0;
      for (let b = 0; b < NB; b++) {
        this.b0[b] = i;
        const end = b === NB - 1 ? n : Math.min(n, i + Math.round(n * RAIN[b][2]));
        for (; i < end; i++) {
          X[i] = r() * vw * 1.15 - vw * .1;
          Y[i] = r() * (vh + 60) - 30;
          V[i] = (700 + r() * 500) * sc.v * mo.v;
          S[i] = 10 + r() * 16;
        }
        this.styles[b] = `rgba(200,214,236,${(RAIN[b][0] * sc.a).toFixed(3)})`;
      }
      this.b0[NB] = n; this.n = n;
    } else {
      const n = Math.min(MAXP, Math.round(160 * (vw * vh) / (1440 * 900) * sc.n * mo.n));
      for (let i = 0; i < n; i++) {
        const near = r() < .22;
        X[i] = r() * vw * 1.1 - vw * .05;
        Y[i] = r() * vh;
        V[i] = (near ? 52 + r() * 36 : 26 + r() * 22) * sc.v * mo.v;
        S[i] = near ? 2.2 + r() * 1.4 : 1 + r();
        P[i] = r() * TAU;
        W[i] = near ? 8 + r() * 14 : 4 + r() * 8;
        Q[i] = TAU / (2.4 + r() * 2.6);
        A[i] = near ? .75 + r() * .2 : .5 + r() * .3;
        D[i] = near ? 1.5 : .7;
      }
      this.n = n;
    }
  }

  paint(dt) {
    const c = this.cx, { vw, vh } = this;
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.clearRect(0, 0, vw, vh);
    if (this.fade < 1) this.fade = Math.min(1, this.fade + dt / FADE);
    if (SCENES[this.scene].kind === 'rain') this.rain(c, dt); else this.snow(c, dt);
    c.globalAlpha = 1;
    if (this.masked) {
      c.globalCompositeOperation = 'destination-in';
      c.drawImage(this.mask, 0, 0, this.mw, this.mh);
      c.globalCompositeOperation = 'source-over';
    }
  }

  rain(c, dt) {
    const { X, Y, V, S, vw, vh, r } = this;
    const wind = .1 + .025 * Math.sin(this.t * .19);
    c.globalAlpha = this.fade;
    c.lineCap = 'round';
    for (let b = 0; b < NB; b++) {
      const i0 = this.b0[b], i1 = this.b0[b + 1];
      if (i1 <= i0) continue;
      c.strokeStyle = this.styles[b];
      c.lineWidth = RAIN[b][1];
      c.beginPath();
      for (let i = i0; i < i1; i++) {
        const dy = V[i] * dt;
        let y = Y[i] + dy, x = X[i] + dy * wind;
        const L = S[i] > .6 * dy ? S[i] : .6 * dy;
        if (y - L > vh) { y = -r() * vh * .25 - 10; x = r() * vw * 1.15 - vw * .1; }
        X[i] = x; Y[i] = y;
        c.moveTo(x, y);
        c.lineTo(x - L * wind, y - L);
      }
      c.stroke();
    }
  }

  snow(c, dt) {
    const { X, Y, V, S, P, W, Q, A, D, vw, vh, r, t, flake } = this;
    const gust = .55 + .45 * Math.sin(t * .23) * Math.sin(t * .071 + 1);
    const f = this.fade;
    for (let i = 0; i < this.n; i++) {
      const s = S[i];
      let y = Y[i] + V[i] * dt, x0 = X[i] + 20 * gust * D[i] * dt;
      if (y - s * 2 > vh) { y = -s * 2 - r() * 40; x0 = r() * vw * 1.1 - vw * .1; }
      if (x0 > vw + 30) x0 -= vw + 60;
      X[i] = x0; Y[i] = y;
      const x = x0 + W[i] * Math.sin(P[i] + t * Q[i]), z = s * 2.4;
      c.globalAlpha = A[i] * f;
      c.drawImage(flake, x - z / 2, y - z / 2, z, z);
    }
  }

  /* ── the lens ──────────────────────────────────────────────────────────── */

  drawFrost() {
    const c = this.fx, { vw, vh, dpr } = this;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, this.frost.width, this.frost.height);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.beads = 0; this.crystals = 0;
    /* the same lens every night: seeded by the scene, not by the session */
    const r = rng(this.seed * 31 + ({ night: 1, late: 2, ice: 3 })[this.scene]);
    if (SCENES[this.scene].kind === 'rain') this.drawBeads(c, r, SCENES[this.scene].beads);
    else this.drawIce(c, r);
    if (this.masked) {
      c.globalCompositeOperation = 'destination-in';
      c.drawImage(this.mask, 0, 0, this.mw, this.mh);
      c.globalCompositeOperation = 'source-over';
    }
  }

  /* water on the lens: a faint body, a dark upper rim, a lit lower rim, a glint; some left a trail */
  drawBeads(c, r, count) {
    const { vw, vh, hole: h, feather } = this, pad = feather + 10;
    const clear = (x, y) => !h || x < h.x0 - pad || x > h.x1 + pad || y < h.y0 - pad || y > h.y1 + pad;
    const area = Math.sqrt(vw * vh / (1440 * 900));
    const n = Math.round(count * Math.min(1.4, Math.max(.6, area)));
    for (let k = 0; k < n; k++) {
      let x = 0, y = 0, ok = false;
      for (let tries = 0; tries < 40 && !ok; tries++) {
        x = 8 + r() * (vw - 16); y = 8 + r() * (vh - 16);
        ok = clear(x, y);
      }
      if (!ok) continue;
      const rad = 1.4 + r() * r() * 4.4;
      if (rad > 3.2 && r() < .45) {
        c.strokeStyle = 'rgba(200,214,236,.045)';
        c.lineWidth = rad * .7; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x, y - rad); c.lineTo(x + (r() - .5) * 3, y - rad - 8 - r() * 26); c.stroke();
      }
      c.fillStyle = 'rgba(190,205,228,.05)';
      c.beginPath(); c.arc(x, y, rad, 0, TAU); c.fill();
      c.lineWidth = .7; c.strokeStyle = 'rgba(0,0,0,.22)';
      c.beginPath(); c.arc(x, y, rad * .92, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      c.lineWidth = .8; c.strokeStyle = 'rgba(214,226,242,.26)';
      c.beginPath(); c.arc(x, y, rad * .86, Math.PI * .15, Math.PI * .85); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)';
      c.beginPath(); c.arc(x - rad * .34, y - rad * .38, Math.max(.55, rad * .17), 0, TAU); c.fill();
      this.beads++;
    }
  }

  /* frost from the edges, never more than a tenth of the way in: a soft band, deeper in the corners,
     and fine crystals that grow inward and branch */
  drawIce(c, r) {
    const { vw, vh } = this;
    const band = (x0, y0, x1, y1, a) => {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      return g;
    };
    const dx = vw * .05, dy = vh * .06;
    c.fillStyle = band(0, 0, dx, 0, .14); c.fillRect(0, 0, dx, vh);
    c.fillStyle = band(vw, 0, vw - dx, 0, .14); c.fillRect(vw - dx, 0, dx, vh);
    c.fillStyle = band(0, 0, 0, dy, .1); c.fillRect(0, 0, vw, dy);
    c.fillStyle = band(0, vh, 0, vh - dy, .16); c.fillRect(0, vh - dy, vw, dy);
    const cr = Math.min(vw, vh) * .16;
    for (const [x, y, a] of [[0, 0, .16], [vw, 0, .16], [0, vh, .24], [vw, vh, .24]]) {
      const g = c.createRadialGradient(x, y, 0, x, y, cr);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(x ? x - cr : 0, y ? y - cr : 0, cr, cr);
    }
    /* crystals: fern-like stems from the edge inward, nearly straight, with short side branches at about
       sixty degrees that shorten toward the tip; now and then a stem forks into a smaller fern */
    const segs = [];
    const area = vw * vh / (1440 * 900);
    const n = Math.round(150 * Math.min(1.6, Math.max(.6, area)));
    const toEnd = (u) => (u < .5 ? .5 * Math.pow(2 * u, 2.4) : 1 - .5 * Math.pow(2 * (1 - u), 2.4));
    const fern = (x, y, ang, reach, depth) => {
      let done = 0;
      while (done < reach) {
        const l = 2.6 + r() * 2.4, x2 = x + Math.cos(ang) * l, y2 = y + Math.sin(ang) * l;
        segs.push(x, y, x2, y2);
        const left = 1 - done / reach;
        for (const side of [-1, 1]) {
          if (r() < .72) {
            const a = ang + side * (1 + r() * .16), bl = (1.6 + r() * 3.4) * (.35 + .65 * left) * (depth ? .7 : 1);
            segs.push(x2, y2, x2 + Math.cos(a) * bl, y2 + Math.sin(a) * bl);
          }
        }
        if (!depth && r() < .09 && left > .3) fern(x2, y2, ang + (r() < .5 ? -1 : 1) * (.7 + r() * .3), reach * left * .45, 1);
        x = x2; y = y2; done += l;
        ang += (r() - .5) * .16;
      }
    };
    for (let k = 0; k < n; k++) {
      const e = r() * 2 * (vw + vh);
      let x, y, nx, ny, u, dim;
      if (e < vw) { u = toEnd(e / vw); x = u * vw; y = 0; nx = 0; ny = 1; dim = vh; }
      else if (e < 2 * vw) { u = toEnd((e - vw) / vw); x = u * vw; y = vh; nx = 0; ny = -1; dim = vh; }
      else if (e < 2 * vw + vh) { u = toEnd((e - 2 * vw) / vh); x = 0; y = u * vh; nx = 1; ny = 0; dim = vw; }
      else { u = toEnd((e - 2 * vw - vh) / vh); x = vw; y = u * vh; nx = -1; ny = 0; dim = vw; }
      const corner = 1 - 2 * Math.min(u, 1 - u);
      const reach = (.02 + .08 * corner * corner) * dim * (.3 + .7 * r());
      fern(x, y, Math.atan2(ny, nx) + (r() - .5) * 1.1, Math.max(6, reach), 0);
      this.crystals++;
    }
    const stroke = (style, ox, oy) => {
      c.strokeStyle = style; c.lineWidth = .55; c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i < segs.length; i += 4) { c.moveTo(segs[i] + ox, segs[i + 1] + oy); c.lineTo(segs[i + 2] + ox, segs[i + 3] + oy); }
      c.stroke();
    };
    stroke('rgba(24,32,43,.06)', .5, .5);
    stroke('rgba(255,255,255,.3)', 0, 0);
  }

  report() {
    return {
      on: this.on, running: !!this.raf, scene: this.scene, motion: this.motion, kind: SCENES[this.scene].kind,
      n: this.n, beads: this.beads, crystals: this.crystals,
      cost: +this.cost.toFixed(3), peak: +this.peak.toFixed(3), frames: this.frames,
      size: [this.vw, this.vh], hole: this.hole,
    };
  }
}
