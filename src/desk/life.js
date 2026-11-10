/* MIMEI · DESK/LIFE — ported from proto/crane/desk.
   Life in the city, drawn in screen space behind the rig: cars on the elevated highways (white headlights one way,
   red tail lights the other, on the light trails of the photo) and now and then a plane crossing the sky,
   its beacon and strobes blinking, dimmed when it passes behind cloud. Seeded. */
import { rng, clamp, smooth } from './clock.js';
import { ROADS } from './roads.js';

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
function glow([r, g, b], core = .2) {
  const c = mk(32, 32), x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, `rgba(255,255,255,1)`); gr.addColorStop(core, `rgba(${r},${g},${b},.85)`); gr.addColorStop(.45, `rgba(${r},${g},${b},.18)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 32, 32); return c;
}
/* a path with cumulative length, normals, and point-at-distance */
function road(pts) {
  const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = (s, lane) => { s = clamp(s, 0, d[d.length - 1]); let i = 1; while (i < d.length - 1 && d[i] < s) i++;
    const k = (s - d[i - 1]) / (d[i] - d[i - 1] || 1), [x0, y0] = pts[i - 1], [x1, y1] = pts[i], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    return [x0 + dx * k - dy / L * lane, y0 + dy * k + dx / L * lane]; };
  return { len: d[d.length - 1], at };
}
const LANES = [
  /* road, lane offset (plate px), direction (+1 along the trace), speed range, spawn gap range */
  ['R1', -4, 1, [110, 160], [.9, 2.2]], ['R1', 4, -1, [100, 150], [1.2, 2.8]],
  ['R2', -4, 1, [120, 170], [.8, 2]], ['R2', 4, -1, [110, 160], [1.1, 2.6]],
  ['U1', -3, 1, [150, 220], [1, 2.6]], ['U1', 3, -1, [150, 220], [1.2, 3]],
  ['U2', -3, 1, [140, 210], [.9, 2.4]], ['U2', 3, -1, [140, 200], [1.3, 3]],
  ['RS', -4, 1, [100, 150], [1, 2.4]], ['RS', 4, -1, [100, 150], [1.4, 3]],
];
export class Life {
  constructor(canvas, stage, seed = 17) {
    this.cv = canvas; this.c = canvas.getContext('2d'); this.stage = stage; this.r = rng(seed); this.motion = 'full';
    this.w = { cars: 0, planes: 0 }; this.target = { cars: 0, planes: 0 }; this.atm = null;
    this.head = glow([255, 222, 170], .24); this.tail = glow([255, 52, 40], .16); this.white = glow([235, 242, 255]);
    this.roads = Object.fromEntries(Object.entries(ROADS).map(([k, p]) => [k, road(p)]));
    this.lanes = LANES.map(([k, lane, dir, sp, gap]) => ({ R: this.roads[k], lane, dir, sp, gap, next: this.r() * gap[1], cars: [] }));
    this.planes = []; this.nextPlane = 1.5;
    /* start with traffic already flowing */
    for (let i = 0; i < 40; i++) this.sim(.25, true);
    this.resize(); addEventListener('resize', () => this.resize());
  }
  resize() { const dpr = Math.min(2, devicePixelRatio || 1); this.dpr = dpr; this.cv.width = Math.round(innerWidth * dpr); this.cv.height = Math.round(innerHeight * dpr);
    this.cv.style.width = innerWidth + 'px'; this.cv.style.height = innerHeight + 'px'; }
  set(mode, now = false) { this.target = { night: { cars: 1, planes: 1 }, late: { cars: .38, planes: .7 }, ice: { cars: .55, planes: 0 } }[mode]; if (now) this.w = { ...this.target }; }
  sim(dt, warm = false) {
    const r = this.r;
    for (const L of this.lanes) {
      L.next -= dt;
      if (L.next <= 0) { L.next = L.gap[0] + r() * (L.gap[1] - L.gap[0]); L.cars.push({ s: L.dir > 0 ? 0 : L.R.len, v: L.sp[0] + r() * (L.sp[1] - L.sp[0]), a: .65 + r() * .35 }); }
      for (const c of L.cars) c.s += c.v * dt * L.dir;
      L.cars = L.cars.filter((c) => c.s >= -5 && c.s <= L.R.len + 5);
    }
    if (!warm) {
      this.nextPlane -= dt;
      if (this.nextPlane <= 0) { this.nextPlane = 55 + r() * 40;
        const y0 = 380 + r() * 120, y1 = y0 - 120 - r() * 90;
        this.planes.push({ a: [3750, y0], b: [1150 + r() * 300, y1], dur: 32 + r() * 8, age: 0, ph: r() }); }
      for (const p of this.planes) p.age += dt;
      this.planes = this.planes.filter((p) => p.age < p.dur);
    }
  }
  update(t, dt) {
    const { c, dpr, stage } = this, still = this.motion === 'still';
    for (const k of ['cars', 'planes']) this.w[k] += (this.target[k] - this.w[k]) * Math.min(1, dt * 1.6);
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height);
    if (still) return;
    this.sim(dt * (this.motion === 'calm' ? .6 : 1));
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalCompositeOperation = 'lighter';
    const s = stage.s;
    if (this.w.cars > .01) {
      const R = Math.max(2.6, 10.5 * s);
      for (const L of this.lanes) { const img = L.dir > 0 ? this.head : this.tail;
        for (const car of L.cars) {
          const edge = smooth(0, 40, car.s) * smooth(0, 40, L.R.len - car.s);
          const a = car.a * edge * this.w.cars * (L.dir > 0 ? 1 : .85); if (a < .01) continue;
          const [px, py] = L.R.at(car.s, L.lane), [x, y] = stage.toScreen(px, py);
          c.globalAlpha = a; c.drawImage(img, x - R, y - R, 2 * R, 2 * R);
        } }
    }
    if (this.w.planes > .01) for (const p of this.planes) {
      const k = p.age / p.dur, px = p.a[0] + (p.b[0] - p.a[0]) * k, py = p.a[1] + (p.b[1] - p.a[1]) * k + 18 * Math.sin(k * 3.1);
      const fade = smooth(0, .08, k) * (1 - smooth(.88, 1, k)), cloud = this.atm && this.atm.density ? this.atm.density(px, py) : 0;
      const A = fade * this.w.planes * (1 - .85 * cloud); if (A < .01) continue;
      const [x, y] = stage.toScreen(px, py), u = p.age + p.ph * 3;
      const R = Math.max(2.4, 8 * s);
      c.globalAlpha = .7 * A; c.drawImage(this.white, x - R, y - R, 2 * R, 2 * R);                       /* steady lights */
      const red = (u % 1.15) < .14; if (red) { c.globalAlpha = .95 * A; c.drawImage(this.tail, x - 1.3 * R, y + .2 * R - 1.3 * R, 2.6 * R, 2.6 * R); }
      const st = u % 1.6, strobe = st < .05 || (st > .14 && st < .19);
      if (strobe) { c.globalAlpha = A; c.drawImage(this.white, x - 2 * R, y - 2 * R, 4 * R, 4 * R); }
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
}
