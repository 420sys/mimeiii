/* MIMEI · DESK/WEATHER — ported from proto/crane/desk.
   Weather in screen space, in two layers: one behind the rig (far rain, far snow) and one in front of it
   (near rain, near snow, drips off the sign). Near rain catches the light of the sign. Densities follow the
   screen area, streak length follows the frame time (so it reads as motion blur at 30 or 120 fps). */
import { rng, clamp, smooth } from './clock.js';

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function dotSprite(soft) {
  const c = mk(32, 32), x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  if (soft) { g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.6, 'rgba(255,255,255,.28)'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
  else { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); }
  x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c;
}
/* the sign's bottom lip, where water gathers (plate px) */
const LIP = [[430, 971], [905, 897]], FACE_C = [669, 790];

export class Weather {
  constructor(back, front, stage, seed = 9) {
    this.back = back; this.front = front; this.stage = stage; this.r = rng(seed);
    this.bc = back.getContext('2d'); this.fc = front.getContext('2d');
    this.w = { rain: 0, snow: 0, drips: 0 }; this.target = { rain: 0, snow: 0, drips: 0 };
    this.motion = 'full'; this.signLevel = 0; this.snowDot = dotSprite(false); this.bokeh = dotSprite(true);
    this.rainF = []; this.rainN = []; this.snowF = []; this.snowN = []; this.drops = [];
    this.drips = [.1, .27, .45, .62, .8, .93].map((f) => ({ f, size: 0, grow: 1.5 + this.r() * 2.5, y: 0, v: 0, falling: false, wait: this.r() * 3 }));
    this.resize(); addEventListener('resize', () => this.resize());
  }
  resize() {
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    for (const cv of [this.back, this.front]) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
    this.dpr = dpr; this.W = W; this.H = H; this.area = (W * H) / (1440 * 900);
    this.populate();
  }
  populate() {
    const r = this.r, W = this.W, H = this.H, A = this.area, n = (k) => Math.round(k * A);
    const rain = (near) => ({ x: r() * W * 1.2 - W * .1, y: r() * H * 1.3 - H * .3, near,
      v: near ? 3800 + r() * 800 : 2600 + r() * 800, len: near ? 70 + r() * 60 : 26 + r() * 18, a: near ? .05 + r() * .06 : .05 + r() * .06, lw: near ? 1.3 + r() * .9 : .8 + r() * .5 });
    this.rainF = Array.from({ length: n(260) }, () => rain(false)); this.rainN = Array.from({ length: n(60) }, () => rain(true));
    const flake = (kind) => ({ kind, x: r() * W, y: r() * H, ph: r() * 6.28, sw: kind === 2 ? 14 + r() * 22 : 5 + r() * 12, per: 2.2 + r() * 2.4,
      v: kind === 0 ? 34 + r() * 30 : kind === 1 ? 70 + r() * 50 : 46 + r() * 40, sz: kind === 0 ? .9 + r() * 1 : kind === 1 ? 2 + r() * 1.8 : 14 + r() * 26,
      a: kind === 0 ? .35 + r() * .35 : kind === 1 ? .5 + r() * .35 : .05 + r() * .1 });
    this.snowF = [...Array.from({ length: n(380) }, () => flake(0)), ...Array.from({ length: n(40) }, () => flake(1))];
    this.snowN = [...Array.from({ length: n(55) }, () => flake(1)), ...Array.from({ length: n(12) }, () => flake(2))];
  }
  set(mode, now = false) {
    this.target = { night: { rain: 1, snow: 0, drips: 1 }, late: { rain: 0, snow: 0, drips: .35 }, ice: { rain: 0, snow: 1, drips: 0 } }[mode];
    if (now) this.w = { ...this.target };
  }
  update(t, dt, fadeK) {
    const { bc, fc, dpr, W, H, stage } = this, still = this.motion === 'still', calm = this.motion === 'calm';
    for (const k of ['rain', 'snow', 'drips']) this.w[k] += (this.target[k] - this.w[k]) * Math.min(1, dt * (fadeK || 1.6));
    bc.setTransform(1, 0, 0, 1, 0, 0); fc.setTransform(1, 0, 0, 1, 0, 0);
    bc.clearRect(0, 0, this.back.width, this.back.height); fc.clearRect(0, 0, this.front.width, this.front.height);
    if (still) return;
    bc.setTransform(dpr, 0, 0, dpr, 0, 0); fc.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = stage.s, dens = calm ? .5 : 1, wind = .07;
    /* --- rain --- */
    if (this.w.rain > .01) {
      const wr = this.w.rain;
      const [cx, cy] = stage.toScreen(FACE_C[0], FACE_C[1], true), rx = 340 * s, ry = 240 * s, lit = this.signLevel;
      for (const [list, ctx] of [[this.rainF, bc], [this.rainN, fc]]) {
        const near = list === this.rainN; ctx.lineCap = 'round';
        const buckets = [[], [], [], []];
        for (let i = 0; i < list.length; i++) { const d = list[i];
          const v = d.v * s; d.y += v * dt; d.x += v * wind * dt;
          if (d.y - d.len * s > H) { d.y = -this.r() * H * .3 - 20; d.x = this.r() * W * 1.2 - W * .1; }
          if (i / list.length > dens) continue;
          const L = Math.max(d.len * s, .75 * v * dt);
          if (!near) { buckets[Math.min(3, Math.floor((d.a - .05) / .015))].push(d, L); continue; }
          const ex = (d.x - cx) / rx, ey = (d.y - L / 2 - cy) / ry, e = ex * ex + ey * ey, boost = e < 1 ? (1 - e) * (1 - e) * lit : 0;
          ctx.strokeStyle = boost > .02 ? `rgba(${Math.round(214 + 30 * boost)},${Math.round(226 + 24 * boost)},255,${(d.a + .3 * boost) * wr})` : `rgba(210,222,240,${d.a * wr})`;
          ctx.lineWidth = d.lw; ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - L * wind, d.y - L); ctx.stroke();
        }
        if (!near) buckets.forEach((b, k) => { if (!b.length) return; ctx.strokeStyle = `rgba(200,214,236,${(.057 + k * .015) * wr})`; ctx.lineWidth = .9; ctx.beginPath();
          for (let i = 0; i < b.length; i += 2) { const d = b[i], L = b[i + 1]; ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - L * wind, d.y - L); } ctx.stroke(); });
      }
    }
    /* --- snow --- */
    if (this.w.snow > .01) {
      const ws = this.w.snow, gust = .6 + .4 * Math.sin(t * .23) * Math.sin(t * .071 + 1);
      for (const [list, ctx] of [[this.snowF, bc], [this.snowN, fc]]) {
        for (let i = 0; i < list.length; i++) { const f = list[i];
          const depth = f.kind === 0 ? .5 : f.kind === 1 ? 1 : 1.7;
          f.y += f.v * dt * (calm ? .7 : 1); f.x += (22 * gust * depth) * dt;
          const x = f.x + f.sw * Math.sin(f.ph + t * 6.283 / f.per);
          if (f.y - f.sz > H) { f.y = -f.sz - this.r() * 40; f.x = this.r() * W * 1.1 - W * .1; }
          if (x - f.sz > W + 40) f.x -= W + 80;
          if (i / list.length > dens) continue;
          ctx.globalAlpha = f.a * ws; const z = f.sz * (f.kind === 2 ? 1 : 2.2);
          ctx.drawImage(f.kind === 2 ? this.bokeh : this.snowDot, x - z / 2, f.y - z / 2, z, z);
        }
        ctx.globalAlpha = 1;
      }
    }
    /* --- drips off the bottom lip of the sign --- */
    if (this.w.drips > .01) {
      const wd = this.w.drips;
      for (const d of this.drips) {
        const px = LIP[0][0] + (LIP[1][0] - LIP[0][0]) * d.f, py = LIP[0][1] + (LIP[1][1] - LIP[0][1]) * d.f;
        if (!d.falling) {
          if (d.wait > 0) { d.wait -= dt * wd; continue; }
          d.size = Math.min(1, d.size + dt / d.grow);
          if (d.size >= 1) { d.falling = true; d.y = 0; d.v = 0; }
          const [x, y] = stage.toScreen(px, py + 2, true), rr = (1.2 + 2.2 * d.size) * s;
          fc.globalAlpha = .55 * wd * smooth(0, .3, d.size); fc.drawImage(this.snowDot, x - rr, y - rr * .6, 2 * rr, 2 * rr * 1.15);
        } else {
          d.v += 2550 * dt; d.y += d.v * dt;
          const [x, y] = stage.toScreen(px, py + 2 + d.y, true), L = Math.max(5, d.v * dt * .75) * s;
          fc.globalAlpha = 1; fc.strokeStyle = `rgba(214,228,255,${.42 * wd})`; fc.lineWidth = Math.max(1, 3.2 * s); fc.lineCap = 'round';
          fc.beginPath(); fc.moveTo(x, y); fc.lineTo(x, y - L); fc.stroke();
          if (y - L > H) { d.falling = false; d.size = 0; d.grow = 1.5 + this.r() * 2.5; d.wait = this.r() * 2.5; }
        }
      }
      fc.globalAlpha = 1;
    }
  }
}
