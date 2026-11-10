/* Workspace 1, the MIMEI desk: the city at night from the top of a crane, and
   an LED sign on the hook that says where you are in the course. The sign is a
   real button (Enter or a click opens its lesson with the leap; ← and → flip it
   through every lesson), the corners are three quiet lines and a menu that
   comes up with the mouse, Esc or Tab. Everything here is read from the real
   course and the real progress; nothing on the sign is typed in. */
import { test, expect, boot, key, activeWs } from './helpers.js';

const desk = page => page.evaluate(() => window.ossuary.desk());
const up = page => expect.poll(async () => (await desk(page)).started, { timeout: 8000 }).toBe(true);
const shown = async page => (await desk(page)).page;
const written = page => page.evaluate(async () => (await import('/src/data/course.js')).writtenLessons().map(l => ({ id: l.id, n: l.n, title: l.title, g: l.g, mins: l.mins })));
const seed = (page, store) => page.addInitScript(store => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.clear();
  localStorage.setItem('ossuary-1', JSON.stringify(store));
}, store);
/** The middle of the sign's face, on screen. */
const faceMid = async page => {
  const f = (await desk(page)).world.face;
  return { x: f.reduce((a, p) => a + p[0], 0) / 4, y: f.reduce((a, p) => a + p[1], 0) / 4 };
};
const menuOpacity = page => page.locator('#cr-menu').evaluate(el => +getComputedStyle(el).opacity);
const sleep = ms => new Promise(r => setTimeout(r, ms));

test.describe('the desk', () => {
  test('a fresh save: the sign says Begin 1.0, the corners are read from the course and the clock', async ({ page, errors }) => {
    await boot(page);
    await up(page);
    const all = await written(page);
    const p = await shown(page);
    expect(p.kind).toBe('begin');
    expect(p.id).toBe(all[0].id);
    expect(p.lines).toContain(all[0].title);
    expect(p.lines.at(-1)).toMatch(/^▶ BEGIN/);
    await expect(page.locator('#cr-sign')).toHaveAccessibleName(new RegExp(`^Begin ${all[0].n.replace('.', '\\.')}, ${all[0].title}\\.`));
    await expect(page.locator('#cr-sign')).toHaveAccessibleDescription(/Enter opens it/);

    /* the bar, the wallpaper and the screen effects step aside: the picture is the screen */
    for (const sel of ['#bar', '#wall', '.fx-layers']) await expect(page.locator(sel)).toBeHidden();
    const box = await page.locator('#desk').boundingBox();
    const vp = page.viewportSize();
    expect(box, 'the desk is the whole screen').toEqual({ x: 0, y: 0, width: vp.width, height: vp.height });

    /* the three quiet lines: the weather word, the clock, the date */
    const now = await page.evaluate(() => { const d = new Date(); return { hm: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }; });
    await expect(page.locator('.cr-clock')).toHaveText(/^\d\d:\d\d$/);
    expect(Math.abs(parseInt((await page.locator('.cr-clock').textContent()).replace(':', ''), 10) - parseInt(now.hm.replace(':', ''), 10)) % 2400).toBeLessThanOrEqual(1);
    await expect(page.locator('.cr-wxw')).toHaveText(/^(drizzle|low cloud|snow)$/);
    await expect(page.locator('.cr-date')).toHaveText(/^(sun|mon|tue|wed|thu|fri|sat) · \d\d · [a-z]{3}$/);

    /* a stranger's line, counted from the course */
    const mins = all.reduce((n, l) => n + (l.mins || 0), 0);
    await expect(page.locator('#cr-promise')).toHaveText(`${all.length} stops · about ${Math.round(mins / 60)} hours · you type every script in your own Roblox Studio (Windows or Mac)`);

    /* the menu: tonight, the week, and the controls */
    await expect(page.locator('#cr-goal-n')).toHaveText('0:00 / 1:00');
    await expect(page.locator('#cr-goal')).toHaveAttribute('aria-label', /^(Tonight|Today): 0 minutes of your 1 hour goal$/);
    await expect(page.locator('#cr-week > div')).toHaveCount(7);
    await expect(page.locator('#cr-week i.now')).toHaveCount(1);
    await expect(page.locator('#cr-nights')).toHaveText(/^0 study nights · week \d+$/);
    await expect(page.locator('#cr-snd')).toHaveAttribute('aria-pressed', 'true');           // sound is on for a new visitor
    await expect(page.locator('#desk .tog [data-t="night"]')).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });

  test('the city loads on sight, holds still off the desk, and runs again on it', async ({ page, errors }) => {
    await boot(page);
    await up(page);
    let r = await desk(page);
    expect(r.world.missing).toEqual([]);
    expect(r.held).toBe(false);
    await expect(page.locator('#desk .plate')).toHaveCount(1);
    await expect(page.locator('#desk .led')).toHaveCount(1);
    await expect.poll(async () => (await desk(page)).fade).toBe(0);               // the fade-in is over
    await key(page, 'Alt+Digit2');
    expect(await activeWs(page)).toBe(2);
    await expect(page.locator('#desk')).toBeHidden();
    await expect.poll(async () => (await desk(page)).held).toBe(true);
    const a = (await desk(page)).world.frames;
    await sleep(600);
    expect((await desk(page)).world.frames, 'no frames while the desk is away').toBe(a);
    await key(page, 'Alt+Digit1');
    await expect(page.locator('#desk')).toBeVisible();
    await expect.poll(async () => (await desk(page)).world.frames).toBeGreaterThan(a);
    r = await desk(page);
    expect(r.held).toBe(false);
    expect(r.entered).toBe(true);
    expect(errors).toEqual([]);
  });

  test('← and → flip the sign through every lesson, wrap at the ends, and say so', async ({ page, errors }) => {
    await boot(page);
    await up(page);
    const all = await written(page);
    await key(page, 'ArrowRight');
    expect((await shown(page)).id).toBe(all[1].id);
    await expect(page.locator('#live')).toContainText(`${all[1].n}, ${all[1].title}`);
    await expect(page.locator('#cr-say')).toContainText(all[1].title);
    await key(page, 'ArrowLeft');
    await key(page, 'ArrowLeft');
    expect((await shown(page)).id, 'left of the first is the last').toBe(all.at(-1).id);
    await key(page, 'ArrowRight');
    expect((await shown(page)).id).toBe(all[0].id);
    expect(errors).toEqual([]);
  });

  test('Enter opens the lesson on the sign with the leap, and the lesson comes out of the black', async ({ page, errors }) => {
    await boot(page);
    await up(page);
    const all = await written(page);
    await key(page, 'ArrowRight');
    await key(page, 'Enter');
    expect((await desk(page)).leaping).toBe(true);
    await key(page, 'ArrowRight');                                                    // keys wait while it leaps
    expect((await shown(page)).id).toBe(all[1].id);
    await expect.poll(() => activeWs(page), { timeout: 12000 }).toBe(2);
    await expect(page.locator('#st-scroll h1')).toContainText(all[1].title);
    await expect.poll(async () => (await desk(page)).leaping, { timeout: 8000 }).toBe(false);
    await expect(page.locator('#leap')).not.toHaveClass(/on/);
    await expect.poll(() => page.locator('#leap').evaluate(el => +getComputedStyle(el).opacity)).toBe(0);
    /* back on the desk, the sign is about the lesson that is open */
    await key(page, 'Alt+Digit1');
    await expect.poll(async () => (await shown(page)).id).toBe(all[1].id);
    expect(errors).toEqual([]);
  });

  test('a click on the sign opens it too, and the sign is the only thing that does', async ({ page, errors }) => {
    await boot(page);
    await up(page);
    const all = await written(page);
    await page.mouse.click(700, 700);                                                 // the city is not a door
    await sleep(300);
    expect(await activeWs(page)).toBe(1);
    const m = await faceMid(page);
    await page.mouse.click(m.x, m.y);
    await expect.poll(() => activeWs(page), { timeout: 12000 }).toBe(2);
    await expect(page.locator('#st-scroll h1')).toContainText(all[0].title);
    expect(errors).toEqual([]);
  });

  test('under reduced motion the desk is still, says why, and the leap is a short fade', async ({ page, errors }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await boot(page);
    await up(page);
    expect((await desk(page)).motion).toBe('still');
    expect((await desk(page)).world.motion).toBe('still');
    await key(page, 'Escape');
    await page.locator('#cr-gear').click();
    await expect(page.locator('#cr-pop')).toBeVisible();
    await expect(page.locator('#cr-rm')).toBeVisible();
    await expect(page.locator('#desk .seg [data-m="still"]')).toHaveAttribute('aria-pressed', 'true');
    await key(page, 'Escape');                                                        // closes the popover
    await expect(page.locator('#cr-pop')).toBeHidden();
    const t0 = Date.now();
    await page.locator('#cr-sign').focus();
    await key(page, 'Enter');
    await expect.poll(() => activeWs(page), { timeout: 12000, intervals: [50] }).toBe(2);   // read often: the poll's own back-off must not be what is timed
    expect(Date.now() - t0, 'a fade, not a fall').toBeLessThan(2500);
    expect(errors).toEqual([]);
  });

  test('the menu comes up with the mouse and goes again; Esc pins it and lets it go', async ({ page, errors }) => {
    await boot(page);
    await up(page);
    expect(await menuOpacity(page)).toBe(0);
    await page.mouse.move(600, 400);
    await page.mouse.move(640, 420);
    await expect.poll(() => menuOpacity(page)).toBeGreaterThan(.95);
    expect((await desk(page)).menu.idle).toBe(false);
    /* 2.6s still, then it goes — on the desk's clock, which slows with the frames on a loaded machine (dt ≤ 0.1s) */
    await expect.poll(() => menuOpacity(page), { timeout: 12000 }).toBe(0);
    expect((await desk(page)).menu.idle).toBe(true);
    await key(page, 'Escape');
    expect((await desk(page)).menu.pinned).toBe(true);
    await expect.poll(() => menuOpacity(page)).toBeGreaterThan(.95);
    await sleep(3200);
    expect(await menuOpacity(page), 'pinned, it stays').toBeGreaterThan(.95);
    await key(page, 'Escape');
    expect((await desk(page)).menu.pinned).toBe(false);
    await expect.poll(() => menuOpacity(page), { timeout: 6000 }).toBe(0);
    expect(errors).toEqual([]);
  });

  test('Tab finds the sign (with a ring), then the menu, which comes up while the keyboard is in it', async ({ page, errors }) => {
    await boot(page);
    await up(page);
    for (let i = 0; i < 4 && await page.evaluate(() => document.activeElement.id) !== 'cr-sign'; i++) await key(page, 'Tab');
    expect(await page.evaluate(() => document.activeElement.id)).toBe('cr-sign');
    await expect.poll(() => page.locator('.cr-ring').evaluate(el => +getComputedStyle(el).opacity)).toBe(1);
    await key(page, 'Tab');
    expect(await page.evaluate(() => !!document.activeElement.closest('#cr-menu'))).toBe(true);
    await expect.poll(() => menuOpacity(page)).toBeGreaterThan(.95);
    await sleep(3400);
    expect(await menuOpacity(page), 'the keyboard keeps it up').toBeGreaterThan(.95);
    expect(errors).toEqual([]);
  });

  test('Night or Ice is remembered, and the menu walks to the other workspaces', async ({ page, errors }) => {
    await boot(page, { query: '?noboot&time=23:30' });
    await up(page);
    expect((await desk(page)).scene).toBe('night');
    await expect(page.locator('.cr-wxw')).toHaveText('drizzle');
    await key(page, 'Escape');
    await page.locator('#desk .tog [data-t="ice"]').click();
    await expect(page.locator('#desk .tog [data-t="ice"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#desk')).toHaveClass(/\bice\b/);
    await expect.poll(async () => (await desk(page)).world.scene, { timeout: 4000 }).toBe('ice');
    await expect(page.locator('.cr-wxw')).toHaveText('snow');
    expect(await page.evaluate(() => window.ossuary.state.scene)).toBe('ice');
    await page.reload();
    await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
    await up(page);
    expect((await desk(page)).scene).toBe('ice');
    await expect(page.locator('#desk')).toHaveClass(/\bice\b/);
    await expect(page.locator('.cr-mark')).toHaveAttribute('src', /mark-slate/);
    /* the workspace buttons */
    await key(page, 'Escape');
    await page.locator('#cr-menu .ws [data-ws="4"]').click();
    expect(await activeWs(page)).toBe(4);
    await expect(page.locator('#win-settings')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the shell keeps its own classes: tonight keeps the desk ink in Ice, and the menu does not breathe', async ({ page, errors }) => {
    /* the shell has its own .goal (the goals list) and .live (a breathing dot);
       both once reached the desk: tonight went bone-grey on Ice, the menu pulsed */
    await seed(page, { scene: 'ice', mimei: 1 });
    await boot(page, { query: '?noboot&fx=3&time=23:30' });
    await up(page);
    expect((await desk(page)).scene).toBe('ice');
    await key(page, 'Escape');
    await expect.poll(() => menuOpacity(page)).toBeGreaterThan(.95);
    const look = await page.evaluate(() => {
      const cs = sel => getComputedStyle(document.querySelector(sel));
      const menu = cs('#cr-menu'), goal = cs('#cr-goal'), corner = cs('#desk .m.bl');
      return { anim: menu.animationName, ink: goal.color, corner: corner.color, pad: goal.paddingLeft, edge: goal.borderLeftWidth, bg: goal.backgroundColor };
    });
    expect(look.anim, 'the menu fades on the desk clock, nothing else').toBe('none');
    expect(look.ink, 'tonight is written in the corner ink').toBe(look.corner);
    expect([look.pad, look.edge]).toEqual(['0px', '0px']);
    expect(look.bg).toBe('rgba(0, 0, 0, 0)');
    const ops = [];
    for (let i = 0; i < 6; i++) { ops.push(await menuOpacity(page)); await sleep(350); }
    expect(Math.min(...ops), 'pinned, it holds still').toBeGreaterThan(.95);
    expect(errors).toEqual([]);
  });

  test('late at night the city is the late plate; the time can be pinned for a picture', async ({ page, errors }) => {
    await boot(page, { query: '?noboot&time=02:40' });
    await up(page);
    expect((await desk(page)).scene).toBe('late');
    await expect(page.locator('.cr-clock')).toHaveText('02:40');
    await expect(page.locator('.cr-wxw')).toHaveText('low cloud');
    expect(errors).toEqual([]);
  });

  test('the motion setting is the effects setting: Full, Calm and Still', async ({ page, errors }) => {
    await boot(page);
    await up(page);
    await key(page, 'Escape');
    await page.locator('#cr-gear').click();
    await expect(page.locator('#cr-gear')).toHaveAttribute('aria-expanded', 'true');
    for (const [m, pref] of [['still', 'static'], ['calm', 'minimal'], ['full', 'full']]) {
      await page.locator(`#desk .seg [data-m="${m}"]`).click();
      await expect(page.locator(`#desk .seg [data-m="${m}"]`)).toHaveAttribute('aria-pressed', 'true');
      expect((await desk(page)).motion).toBe(m);
      expect((await desk(page)).world.motion).toBe(m);
      expect(await page.evaluate(() => window.ossuary.fx().preference)).toBe(pref);
    }
    await page.locator('#cr-all').click();
    expect(await activeWs(page)).toBe(4);
    await expect(page.locator('#set-fx-full')).toHaveAttribute('aria-pressed', 'true');
    expect(errors).toEqual([]);
  });

  test('a unit finished since the sign last said so: COMPLETE once, and Enter starts the next unit', async ({ page, errors }) => {
    const all = await (async () => { await boot(page); return written(page); })();
    const firstUnit = all.filter(l => l.g === all[0].g).map(l => l.id);
    const next = all.find(l => l.g !== all[0].g);
    const ctx = await page.context().browser().newContext({ viewport: { width: 1440, height: 900 }, baseURL: page.url().replace(/\/index\.html.*$/, '') });
    const p2 = await ctx.newPage();
    const errs = [];
    p2.on('pageerror', e => errs.push(e.message));
    p2.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await seed(p2, { done: firstUnit, mimei: 1, unitsSeen: [] });
    await boot(p2);
    await up(p2);
    let s = await shown(p2);
    expect(s.kind).toBe('complete');
    expect(s.lines.slice(0, 2)).toEqual(['UNIT I', 'COMPLETE']);
    expect(s.id).toBe(next.id);
    await expect(p2.locator('#cr-sign')).toHaveAccessibleName(new RegExp(`^Unit I complete\\. Next: unit II`));
    await p2.reload();
    await p2.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
    await up(p2);
    s = await shown(p2);
    expect(s.kind, 'only once').toBe('begin');
    expect(s.id).toBe(next.id);
    await key(p2, 'Enter');
    await expect.poll(() => activeWs(p2), { timeout: 12000 }).toBe(2);
    await expect(p2.locator('#st-scroll h1')).toContainText(next.title);
    expect(errs).toEqual([]);
    await ctx.close();
    expect(errors).toEqual([]);
  });

  test('an older save moves to MIMEI once: sound on, finished units do not all say COMPLETE', async ({ page, errors }) => {
    await seed(page, { done: ['1.0'], sound: false, rice: 'ossuary' });
    await boot(page);
    await up(page);
    const store = await page.evaluate(() => JSON.parse(localStorage.getItem('ossuary-1')));
    expect(store.mimei).toBe(1);
    expect(store.sound).toBe(true);
    expect(store.unitsSeen).toEqual(['g1']);
    expect(store.done).toEqual(['1.0']);
    const s = await shown(page);
    expect(s.kind).toBe('begin');
    expect(s.id).toBe('2.1');
    expect(errors).toEqual([]);
  });

  test('a luauOS save is carried over to ossuary-1 and kept', async ({ page, errors }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.clear();
      localStorage.setItem('luauos-1', JSON.stringify({ done: ['1.0'], rice: 'komorebi', wall: 'devroom' }));
    });
    await boot(page);
    const store = await page.evaluate(() => ({
      next: JSON.parse(localStorage.getItem('ossuary-1')),
      old: localStorage.getItem('luauos-1'),
    }));
    expect(store.next.done).toEqual(['1.0']);
    expect(store.next.rice).toBe('ossuary');
    expect(store.next.wall).toBe(null);
    expect(store.old).not.toBeNull();                    // a rollback still finds it
    await up(page);
    expect((await shown(page)).id).toBe('2.1');
    expect(errors).toEqual([]);
  });

  test('tonight counts while a lesson is open and in use, not while the desk is up', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    expect(await activeWs(page)).toBe(2);
    await page.mouse.move(500, 500);
    await page.mouse.down(); await page.mouse.up();
    const tick = dt => page.evaluate(async dt => { const n = await import('/src/core/nights.js'); n.tick(Date.now() + dt); return n.nightsReport(); }, dt);
    const a = await tick(20000);
    expect(a.tonight).toBeGreaterThanOrEqual(19);
    await key(page, 'Alt+Digit1');
    const b = await tick(60000);
    expect(b.tonight, 'the desk is not study').toBe(a.tonight);
    /* Settings changes the goal, and the desk's bar follows */
    await key(page, 'Alt+Digit4');
    await page.locator('#set-goal-30').click();
    await expect(page.locator('#set-goal-30')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.ossuary.state.goalMins)).toBe(30);
    await key(page, 'Alt+Digit1');
    await expect(page.locator('#cr-goal-n')).toHaveText(/^0:00 \/ 0:30$/);
    expect(errors).toEqual([]);
  });

  test('the desk keys stay out of the launcher, and m opens the manual for the lesson on the sign', async ({ page, errors }) => {
    await boot(page);
    await up(page);
    const all = await written(page);
    await key(page, 'Alt+Enter');
    await expect(page.locator('#launcher')).toBeVisible();
    await key(page, 'ArrowRight');
    expect((await shown(page)).id, 'the launcher has the keys').toBe(all[0].id);
    await key(page, 'Escape');
    await expect(page.locator('#launcher')).toBeHidden();
    await key(page, 'ArrowRight');
    await key(page, 'm');
    expect(await activeWs(page)).toBe(3);
    await expect(page.locator('#win-man')).toBeVisible();
    const sheet = await page.evaluate(async id => (await import('/src/data/course.js')).cheatFor(id).id, all[1].id);
    expect(await page.evaluate(() => window.ossuary.state.last), 'the cheatsheet of the lesson on the sign').toBe(sheet);
    expect(errors).toEqual([]);
  });

  test('without the city the sign is a plain button that still opens the lesson', async ({ page, errors }) => {
    await page.route('**/src/desk/world.js', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: 'throw new Error("no city tonight");' }));
    await boot(page);
    await expect(page.locator('#desk')).toHaveClass(/no-world/);
    await expect(page.locator('#cr-sign')).toBeVisible();
    await expect(page.locator('#cr-sign')).toContainText('Begin 1.0, Set up Roblox Studio');
    await page.locator('#cr-sign').click();
    await expect.poll(() => activeWs(page), { timeout: 12000 }).toBe(2);
    expect(errors).toEqual([]);
  });

  for (const [w, h] of [[1280, 800], [1366, 768], [1440, 900], [1600, 1000], [1920, 1080], [900, 700]]) {
    test(`nothing meets or clips at ${w}×${h}`, async ({ page, errors }) => {
      await page.setViewportSize({ width: w, height: h });
      await boot(page);
      await up(page);
      await page.evaluate(() => document.fonts.ready);
      await key(page, 'Escape');
      await expect.poll(() => menuOpacity(page)).toBeGreaterThan(.95);
      const g = await page.evaluate(() => {
        const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
        return { tl: r('#desk .m.tl'), bl: r('#desk .m.bl'), br: r('#desk .m.br'), hud: r('#desk .cr-hud'), vw: innerWidth, vh: innerHeight };
      });
      const f = (await desk(page)).world.face;
      const face = { l: Math.min(...f.map(p => p[0])), r: Math.max(...f.map(p => p[0])), t: Math.min(...f.map(p => p[1])), b: Math.max(...f.map(p => p[1])) };
      const meet = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      const blocks = { tl: g.tl, bl: g.bl, br: g.br, hud: g.hud };
      for (const [k, b] of Object.entries(blocks)) {
        expect(b.l, `${k} left`).toBeGreaterThanOrEqual(0);
        expect(b.t, `${k} top`).toBeGreaterThanOrEqual(0);
        expect(b.r, `${k} right`).toBeLessThanOrEqual(g.vw);
        expect(b.b, `${k} bottom`).toBeLessThanOrEqual(g.vh);
      }
      const names = Object.keys(blocks);
      for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
        expect(meet(blocks[names[i]], blocks[names[j]]), `${names[i]} meets ${names[j]}`).toBe(false);
      }
      expect(meet(face, g.tl), 'the sign is clear of the menu').toBe(false);
      expect(meet(face, g.hud), 'the sign is clear of the clock').toBe(false);
      expect(face.l).toBeGreaterThanOrEqual(0);
      expect(face.t).toBeGreaterThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
});
