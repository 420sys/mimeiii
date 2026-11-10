/* Critique batch 1: the first-contact bugs, each held by a test that fails on the old code.
   - a lesson opened by any door hands the keyboard to the lesson
   - the title scrolls away as plain content, nothing under it jumps, and the pane's head keeps the place
   - the desk runs after a lesson-first load; a city that cannot load leaves the sign and the menu working
   - plain m opens the manual on the desk; the desk's key list and the bar tell the truth
   - the streak and the week count the learner's own calendar day, not UTC's */
import { test, expect, boot, key, activeWs, study } from './helpers.js';

const SC = '#st-scroll';
const desk = page => page.evaluate(() => window.ossuary.desk());
const deskUp = page => expect.poll(async () => (await desk(page)).started, { timeout: 8000 }).toBe(true);
const scrollTop = page => page.locator(SC).evaluate(s => Math.round(s.scrollTop));
const focused = page => page.evaluate(() => (document.activeElement ? document.activeElement.id || document.activeElement.tagName : ''));
const frames = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))));

/** Press a reading key; wait for the lesson to move, then to rest (Chrome eases keyboard scrolling). */
async function press(page, k, from) {
  await page.keyboard.press(k);
  await expect.poll(() => scrollTop(page), { message: `${k} moves the lesson` }).not.toBe(from);
  /* at rest means still across two frames, read a moment apart: a loaded machine can hold one frame long enough to look still */
  let last = -1;
  await expect.poll(async () => { await frames(page); const y = await scrollTop(page); const same = y === last; last = y; return same; }, { intervals: [150] }).toBe(true);
  return last;
}

/** The reading keys, with nothing but the keyboard: each one has to move the lesson. */
async function readWithKeys(page) {
  const room = await page.locator(SC).evaluate(s => s.scrollHeight - s.clientHeight);
  expect(room, 'the lesson is longer than one screen').toBeGreaterThan(600);
  let y = await scrollTop(page);
  expect(y).toBe(0);
  y = await press(page, 'PageDown', y); expect(y, 'PageDown').toBeGreaterThan(300);
  y = await press(page, 'Home', y); expect(y, 'Home').toBe(0);
  y = await press(page, 'Space', y); expect(y, 'Space').toBeGreaterThan(300);
  y = await press(page, 'Home', y); expect(y, 'Home again').toBe(0);
  y = await press(page, 'ArrowDown', y); expect(y, 'ArrowDown').toBeGreaterThan(10);
  y = await press(page, 'End', y);
  /* the bottom as it is now: a late font can move it by a pixel or two after the first measure */
  const bottom = await page.locator(SC).evaluate(s => s.scrollHeight - s.clientHeight);
  expect(y, 'End').toBeGreaterThanOrEqual(bottom - 2);
  y = await press(page, 'PageUp', y); expect(y, 'PageUp').toBeLessThan(bottom - 300);
}

test.describe('after a lesson opens, the keyboard turns its pages (#3)', () => {
  test('through the launcher: Alt+Enter, type, Enter', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Enter');
    await page.locator('#launch-input').fill('your first variable');
    await page.keyboard.press('Enter');
    await expect(page.locator('#study .kicker')).toContainText('2.1');
    expect(await focused(page)).toBe('st-scroll');
    await readWithKeys(page);
    expect(errors).toEqual([]);
  });

  test('through the / overlay: type, Enter', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await key(page, '/');
    await expect(page.locator('#st-course-q')).toBeFocused();
    await page.keyboard.type('kinds of values');
    await page.keyboard.press('Enter');
    await expect(page.locator('#study .kicker')).toContainText('2.2');
    await expect(page.locator('#study .st-course')).toBeHidden();
    expect(await focused(page)).toBe('st-scroll');
    await readWithKeys(page);
    expect(errors).toEqual([]);
  });

  test('through the sign, when the leap is a fade (reduced motion)', async ({ page, errors }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await boot(page);
    await page.locator('#cr-sign').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#study .kicker')).toContainText('1.0');
    expect(await focused(page)).toBe('st-scroll');
    await readWithKeys(page);
    expect(errors).toEqual([]);
  });

  test('through the sign, after the leap', async ({ page, errors }) => {
    await boot(page, { query: '?noboot&motion=full' });
    await deskUp(page);
    const f = (await desk(page)).world.face;
    await page.mouse.click(f.reduce((a, p) => a + p[0], 0) / 4, f.reduce((a, p) => a + p[1], 0) / 4);
    await expect.poll(async () => (await activeWs(page)) === 2 && !(await desk(page)).leaping, { timeout: 9000 }).toBe(true);
    expect(await focused(page)).toBe('st-scroll');
    await readWithKeys(page);
    expect(errors).toEqual([]);
  });

  test('a cold link lands with the keys already on the lesson, and the reading keys turn the page', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await expect.poll(() => focused(page)).toBe('st-scroll');
    await readWithKeys(page);
    expect(errors).toEqual([]);
  });
});

test.describe('the title scrolls away and the sign keeps the place (#4)', () => {
  /* where the first step heading sits in the document, at any scroll offset: one number, or the page jumped */
  const geometry = page => page.evaluate(() => {
    const sc = document.getElementById('st-scroll');
    const h = document.querySelector('#study .step:not(.step-intro) h2');
    const head = document.querySelector('#study .quest-head').getBoundingClientRect();
    const top = sc.getBoundingClientRect().top;
    return {
      heading: h.getBoundingClientRect().top - top + sc.scrollTop,
      plaque: head.height,
      shown: Math.round(head.bottom - top),        // how far down the viewport the title still reaches
    };
  });
  const scrollTo = async (page, y) => {
    await page.locator(SC).evaluate((s, y) => { s.scrollTop = y; }, y);
    await frames(page);
  };
  const report = page => page.evaluate(() => window.ossuary.study());

  test('nothing under the title moves when the first scroll notch lands', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    /* the pane glides in and the page rises into place as the study arrives (not on Still): measure once it is home */
    await expect(page.locator('#study')).not.toHaveClass(/\b(arrive|doc-in)\b/);
    const rest = await geometry(page);
    expect(rest.plaque, 'the title keeps its full size').toBeGreaterThan(100);
    for (const y of [2, 41, 120, 400, 41, 2, 0]) {
      await scrollTo(page, y);
      const g = await geometry(page);
      expect(Math.abs(g.heading - rest.heading), `the first step heading moved at scrollTop ${y}`).toBeLessThan(1);
      expect(Math.abs(g.plaque - rest.plaque), `the title resized at scrollTop ${y}`).toBeLessThan(1);
    }
    await scrollTo(page, 600);
    expect((await geometry(page)).shown, 'the title has scrolled off like any other content').toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });

  test('the pane\'s head names the stop throughout; the outline marks the title while it is in view, the step being read once it has gone, and the title again at the top', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const here = async () => (await report(page)).outline.here;
    const head = () => page.locator('#study .rd-where').evaluate(e => e.textContent.replace(/\s+/g, ' ').trim());
    await expect(page.locator('#study .rd-n')).toHaveText('2.1');
    await expect(page.locator('#study .rd-t')).toHaveText('Your first variable');
    const named = await head();
    await expect.poll(here).toBe(0);
    await expect(page.locator('#study .ro-title')).toHaveAttribute('aria-current', 'step');
    const vh = await page.locator(SC).evaluate(s => s.clientHeight);

    await scrollTo(page, Math.round(vh * 1.5));     // the title has gone
    await expect.poll(here).toBeGreaterThan(0);
    expect(await here(), 'the outline marks the step the study is following').toBe((await report(page)).step);
    await expect(page.locator('#study .ro-step[aria-current="step"]')).toHaveCount(1);
    await expect(page.locator('#study .ro-title')).not.toHaveAttribute('aria-current', 'step');
    expect(await head()).toBe(named);

    await scrollTo(page, 1e6);                      // the end of the lesson
    expect(await head()).toBe(named);
    await scrollTo(page, 0);                        // and the top again
    await expect.poll(here).toBe(0);
    await expect(page.locator('#study .ro-title')).toHaveAttribute('aria-current', 'step');
    expect(await head()).toBe(named);
    expect(errors).toEqual([]);
  });

  /* the lamp glides from step to step, and nothing moves when the machine is asked to be still */
  for (const [name, query, setup, expected] of [
    ['reduced motion', '?noboot', p => p.emulateMedia({ reducedMotion: 'reduce' }), '0s'],
    ['fx 0', '?noboot&fx=0', async () => {}, '0s'],
    ['fx 1', '?noboot&fx=1', async () => {}, '0.42s, 0.42s, 0.3s'],
    ['balanced effects', '?noboot&fx=2', async () => {}, '0.42s, 0.42s, 0.3s'],
  ]) {
    test(`the lamp's glide under ${name}`, async ({ page }) => {
      await setup(page);
      await boot(page, { hash: '#/2.1', query });
      const lamp = page.locator('#study .ro-lamp');
      await expect(lamp).toHaveClass(/\bon\b/);
      await expect(lamp).toHaveCSS('transition-duration', expected);
      if (expected !== '0s') await expect(lamp).toHaveCSS('transition-property', 'transform, height, opacity');
    });
  }
});

test.describe('the desk after a lesson-first load (#5)', () => {
  test('open a lesson link, then the desk: the city runs, the clock and the sign are real', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await expect(page.locator('#study .kicker')).toContainText('2.1');
    expect((await desk(page)).started, 'nothing is loaded for a desk not yet seen').toBe(false);
    await key(page, 'Alt+Digit1');
    await deskUp(page);
    await expect.poll(async () => (await desk(page)).fade).toBe(0);
    const r = await desk(page);
    expect(r.held).toBe(false);
    expect(r.page.id, 'the sign is about the lesson in hand').toBe('2.1');
    await expect(page.locator('.cr-clock')).toHaveText(/^\d\d:\d\d$/);
    const a = r.world.frames;
    await expect.poll(async () => (await desk(page)).world.frames).toBeGreaterThan(a);
    expect(errors).toEqual([]);
  });

  test('a city that cannot load leaves the sign, the clock and the menu working', async ({ page, errors }) => {
    const warned = [];
    page.on('console', m => { if (m.type() === 'warning' && /desk/i.test(m.text())) warned.push(m.text()); });
    await page.route('**/assets/crane/city-*.webp', route => route.fulfill({ status: 200, contentType: 'image/webp', body: 'not a picture' }));
    await boot(page);
    await deskUp(page);
    const r = await desk(page);
    expect(r.world.missing.length, 'the missing plate is named').toBe(1);
    await expect(page.locator('#desk .plate-none')).toHaveCount(1);
    await expect(page.locator('.cr-clock')).toHaveText(/^\d\d:\d\d$/);
    expect(r.page.kind).toBe('begin');
    await page.keyboard.press('Escape');
    await expect(page.locator('#cr-goal-n')).toHaveText('0:00 / 1:00');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Enter');
    await expect.poll(() => activeWs(page), { timeout: 9000 }).toBe(2);   // the leap runs on the desk's clock, which slows with the frames on a loaded machine
    expect(errors.filter(e => !/city-/.test(e))).toEqual([]);
    expect(warned).toEqual([]);
  });
});

test.describe('the desk says what its keys do (quick wins 1 and 2)', () => {
  const manualH1 = page => page.locator('#win-man .man-doc h1');

  test('plain m on the desk opens the manual for the lesson on the sign', async ({ page, errors }) => {
    await boot(page);
    expect(await activeWs(page)).toBe(1);
    await page.keyboard.press('m');
    expect(await activeWs(page)).toBe(3);
    await expect(manualH1(page)).not.toBeEmpty();
    const first = await manualH1(page).innerText();

    await key(page, 'Alt+Digit1');
    await deskUp(page);
    /* walk the sign to a lesson whose unit has another cheatsheet (1.0 has none, so the first sheet opened) */
    const sheetOf = id => page.evaluate(async id => { const c = (await import('/src/data/course.js')).cheatFor(id); return c ? c.id : null; }, id);
    const firstSheet = await page.evaluate(() => window.ossuary.state.last);
    let sheet = null;
    for (let i = 0; i < 12 && !(sheet && sheet !== firstSheet); i++) {
      await page.keyboard.press('ArrowRight');
      sheet = await sheetOf((await desk(page)).page.id);
    }
    expect(sheet && sheet !== firstSheet, 'a lesson with its own cheatsheet').toBe(true);
    await page.keyboard.press('m');
    expect(await activeWs(page)).toBe(3);
    await expect(manualH1(page)).not.toHaveText(first);
    expect(await page.evaluate(() => window.ossuary.state.last)).toBe(sheet);
    expect(errors).toEqual([]);
  });

  test('m leaves the keyboard alone in a field, in the launcher and on the study', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Enter');
    await expect(page.locator('#launch-input')).toBeFocused();
    await page.keyboard.type('manual');
    await expect(page.locator('#launch-input')).toHaveValue('manual');
    expect(await activeWs(page)).toBe(1);
    await key(page, 'Escape');
    await expect(page.locator('#launcher')).toBeHidden();

    await key(page, 'Alt+Digit2');
    await page.keyboard.press('m');
    expect(await activeWs(page)).toBe(2);
    expect(errors).toEqual([]);
  });

  test('the desk\'s key list and the keys list name the real keys', async ({ page, errors }) => {
    await boot(page);
    await page.keyboard.press('Escape');
    await page.locator('#cr-gear').click();
    const keys = page.locator('#cr-pop .keys');
    for (const k of ['← →', 'enter', 'm', 'esc']) await expect(keys.locator('b', { hasText: k })).toHaveCount(1);
    await expect(keys).not.toContainText('super');
    await page.keyboard.press('Escape');
    await page.keyboard.press('?');
    await expect(page.locator('#launcher')).toBeVisible();
    const row = page.locator('#launch-list .lrow').filter({ hasText: 'Open the manual for the lesson on the sign' });
    await expect(row).toHaveCount(1);
    await expect(row.locator('kbd')).toHaveText('m');
    await expect(page.locator('#launch-list .lrow').filter({ hasText: 'On the desk: open the lesson on the sign' })).toHaveCount(1);
    await expect(page.locator('#launch-list .lrow').filter({ hasText: 'On the desk: show the other lessons on the sign' })).toHaveCount(1);
    expect(errors).toEqual([]);
  });
});

test.describe('the stop in hand is named where you look (quick win 3)', () => {
  const task = page => page.locator('#bar-task');
  const head = page => page.locator('#study .rd-n');

  test('on workspace 2 the pane\'s head names the open stop and follows [ and ]; the bar\'s middle is its steps', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    expect(await activeWs(page)).toBe(2);
    await expect(head(page)).toHaveText('2.1');
    /* the cab's slim bar stays on the study, and its middle is this lesson's steps, as words */
    await expect(page.locator('#bar')).toBeVisible();
    await expect(task(page).locator('.bs')).toHaveCount((await study(page)).outline.steps);
    await key(page, ']');
    await expect(page.locator('#study .kicker')).toContainText('2.2');
    await expect(head(page)).toHaveText('2.2');
    await expect(task(page).locator('.bs')).toHaveCount((await study(page)).outline.steps);
    await key(page, '[');
    await expect(head(page)).toHaveText('2.1');
    // on the manual its middle names the window in front
    await key(page, 'Alt+Digit3');
    await expect(task(page)).toBeVisible();
    await expect(task(page)).toContainText('manual');
    expect(errors).toEqual([]);
  });

  test('the desk\'s sign and the study\'s head agree, even when that is not the first unfinished stop', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });             // 1.0 is still unfinished; the stop in hand is 2.1
    await key(page, 'Alt+Digit1');
    await deskUp(page);
    await expect(page.locator('#bar')).toBeHidden();  // the desk has no bar: the sign says it
    const r = await desk(page);
    expect(r.page.id).toBe('2.1');
    expect(r.page.lines).toContain('Your first variable');
    await key(page, 'Alt+Digit2');
    await expect(head(page)).toHaveText('2.1');
    await expect(page.locator('#study .rd-t')).toHaveText('Your first variable');
    expect(errors).toEqual([]);
  });
});

/* the learner's own calendar day, read at one fixed instant in time zones on either side of UTC */
for (const [zone, instant, today, before] of [
  ['Pacific/Auckland', '2026-10-20T12:30:00Z', '2026-10-21', ['2026-10-19', '2026-10-20']],     // 01:30 on the 21st; UTC still says the 20th
  ['America/Los_Angeles', '2026-10-21T02:30:00Z', '2026-10-20', ['2026-10-18', '2026-10-19']],  // 19:30 on the 20th; UTC already says the 21st
]) {
  test.describe(`the streak counts the learner's own days (${zone})`, () => {
    test.use({ timezoneId: zone });
    test.beforeEach(async ({ page }) => {
      await page.clock.setFixedTime(new Date(instant));
      await page.addInitScript(days => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem('ossuary-1', JSON.stringify({ days }));
      }, before);
    });

    test('today is the local date, and the streak runs back through local days', async ({ page, errors }) => {
      await boot(page);
      const got = await page.evaluate(() => ({ days: window.ossuary.state.days, streak: window.ossuary.progress().streak }));
      expect(got.days).toEqual([...before, today].sort());
      expect(got.streak).toBe(3);
      await expect(page.locator('#cr-week i.now')).toHaveCount(1);
      await key(page, 'Alt+Digit4');
      await expect(page.locator('#win-settings .srow', { hasText: 'streak' })).toContainText('3 days');
      expect(errors).toEqual([]);
    });
  });
}

test.describe('the bar does not move when its label changes (cold-load layout shift)', () => {
  /* The centre cell used to be as wide as its text, so a stop name that arrived after first paint pushed the bar's
     columns about; perf.spec read it as a cumulative layout shift of 0.0505 (limit 0.05) on a cold #/2.1. */
  const boxes = page => page.evaluate(() => ['.bar-l', '.bar-c', '#bar-task', '.bar-r'].map(s => {
    const r = document.querySelector('#bar ' + s).getBoundingClientRect();
    return `${s} x${Math.round(r.x)} w${Math.round(r.width)}`;
  }));

  test('the lamp moving from one window to another lays the bar out the same', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await key(page, 'Alt+Digit3');                                   // the bar is on the manual and settings
    await expect(page.locator('#bar-task .bw.focus')).toHaveText('manual');
    const short = await boxes(page);
    await page.evaluate(() => window.ossuary.wm.open('tty'));
    await expect(page.locator('#bar-task .bw.focus')).toHaveText('terminal');   // the lamp moves; the words stay put
    await page.evaluate(() => window.ossuary.wm.flush());
    expect(await boxes(page)).toEqual(short);
    expect(errors).toEqual([]);
  });
});
