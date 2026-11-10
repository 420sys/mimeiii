/* Critique batch 3: what a stranger needs on a cold, hosted first visit.
   - the desk says what this is while nothing is ticked, counted from the course (a line under its clock)
   - progress can be exported, imported (checked first) and cleared in two inline steps
   - an unreadable store or a failed save keeps the old text as ossuary-1.bak and says so once
   - the place in each lesson (step, scroll, answered probes) comes back
   - the slim bar's dots are tabbable only while it shows, and a cold link takes the keys */
import fs from 'node:fs';
import { test, expect, boot, key, progress, study, readStep, openGoals } from './helpers.js';

const S = '#win-settings', DOC = '#study .doc', SC = '#st-scroll';
const focused = page => page.evaluate(() => (document.activeElement ? document.activeElement.id || document.activeElement.tagName : ''));
const top = page => page.locator(SC).evaluate(s => Math.round(s.scrollTop));
const up = page => page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));

/** A store in localStorage before the app reads it: once per tab, so a reload keeps what the app itself wrote. */
const seed = (page, store, raw = null) => page.addInitScript(([store, raw]) => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.setItem('ossuary-1', raw ?? JSON.stringify(store));
}, [store, raw]);

const settings = async page => { await key(page, 'Alt+Digit4'); await expect(page.locator(S)).toBeVisible(); };
const first3 = page => page.locator(`${DOC} .runbook[data-task='first-three'] .checks li`);

test.describe('the first screen says what this is (#7)', () => {
  const course = page => page.evaluate(async () => {
    const { writtenLessons } = await import('/src/data/course.js');
    const all = writtenLessons();
    return { stops: all.length, mins: all.reduce((n, l) => n + (l.mins || 0), 0) };
  });
  const line = page => page.locator('#cr-promise');

  test('one quiet line, counted from the course, while nothing is ticked', async ({ page, errors }) => {
    await boot(page);
    const c = await course(page);
    expect(c.stops).toBeGreaterThan(0);
    await expect(line(page)).toHaveText(`${c.stops} stops · about ${Math.round(c.mins / 60)} hours · you type every script in your own Roblox Studio (Windows or Mac)`);
    expect(errors).toEqual([]);
  });

  test('the first tick retires it, live and after a reload', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await expect(line(page)).not.toHaveAttribute('hidden', /.*/);
    for (let i = 0; i < 3; i++) await first3(page).nth(i).click();
    expect((await progress(page)).cps).toBeGreaterThan(0);
    await key(page, 'Alt+Digit1');
    await expect(line(page)).toBeHidden();
    await expect(line(page)).toHaveAttribute('hidden', '');
    await page.reload();
    await up(page);
    await key(page, 'Alt+Digit1');
    await expect(line(page)).toHaveAttribute('hidden', '');
    expect(errors).toEqual([]);
  });

  for (const [w, h] of [[1280, 800], [1366, 657]]) {
    test(`the line sits under the clock, on screen and clear of the sign, at ${w}×${h}`, async ({ page, errors }) => {
      await page.setViewportSize({ width: w, height: h });
      await boot(page);
      const desk = () => page.evaluate(() => window.ossuary.desk());
      await expect.poll(async () => (await desk()).started, { timeout: 8000 }).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      await expect(line(page)).toBeVisible();
      const g = await page.evaluate(() => {
        const r = s => { const q = document.querySelector(s).getBoundingClientRect(); return { l: q.left, t: q.top, r: q.right, b: q.bottom }; };
        return { clock: r('#desk .cr-clock'), line: r('#cr-promise'), fs: parseFloat(getComputedStyle(document.getElementById('cr-promise')).fontSize), vw: innerWidth, vh: innerHeight };
      });
      const f = (await desk()).world.face;
      const face = { l: Math.min(...f.map(p => p[0])), r: Math.max(...f.map(p => p[0])), t: Math.min(...f.map(p => p[1])), b: Math.max(...f.map(p => p[1])) };
      const meet = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
      expect(g.line.t, 'the line sits under the clock').toBeGreaterThanOrEqual(g.clock.b - 1);
      expect(g.line.l).toBeGreaterThanOrEqual(0);
      expect(g.line.r).toBeLessThanOrEqual(g.vw);
      expect(g.line.b, 'the line is on screen').toBeLessThanOrEqual(g.vh);
      expect(g.fs, 'the line is 11px or more').toBeGreaterThanOrEqual(11);
      expect(meet(face, g.line), 'the line is clear of the sign').toBe(false);
      expect(errors).toEqual([]);
    });
  }
});

/* a small save to move around: 1.0 finished with two goals, a half-ticked runbook, a place in 2.1 with one wrong answer */
const SAVE = {
  done: ['1.0'], goals: { '1.0': [0, 1] }, tasks: { 'first-three': [0] }, days: ['2026-10-19', '2026-10-20'],
  place: { '2.1': { s: 2, m: 3, y: 640, p: { 'p-first': 0 } } },
};
const noDialogs = page => { const seen = []; page.on('dialog', d => { seen.push(d.type()); d.dismiss(); }); return seen; };
const asFile = (name, text) => ({ name, mimeType: 'application/json', buffer: Buffer.from(text) });
const pick = (page, file) => page.locator('#set-import-file').setInputFiles(file);
const saved = async dl => JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));

test.describe('progress can be kept as one file and brought back (#6)', () => {
  test('Export downloads one JSON file holding progress and nothing else', async ({ page, errors }) => {
    await seed(page, SAVE);
    await boot(page);
    await settings(page);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator(`${S} #set-export`).click()]);
    expect(dl.suggestedFilename()).toMatch(/^mimei-progress-\d{4}-\d{2}-\d{2}\.json$/);
    const file = await saved(dl);
    expect(file.app).toBe('mimei');
    expect(Object.keys(file.progress).sort()).toEqual(['days', 'done', 'goals', 'nights', 'place', 'tasks']);
    expect(file.progress).toMatchObject({ done: ['1.0'], goals: { '1.0': [0, 1] }, tasks: { 'first-three': [0] }, place: SAVE.place });
    expect(file.progress.days).toEqual(expect.arrayContaining(SAVE.days));
    await expect(page.locator(`${S} .set-note`)).toContainText('Saved mimei-progress-');
    expect(errors).toEqual([]);
  });

  test('Import says what is in the file and replaces progress only after a yes', async ({ page, errors }) => {
    const dialogs = noDialogs(page);
    await boot(page);
    await settings(page);
    await pick(page, asFile('mine.json', JSON.stringify({ app: 'ossuary', v: 1, progress: SAVE })));
    const ask = page.locator(`${S} [aria-label='Confirm import']`);
    await expect(ask).toContainText('mine.json');
    await expect(ask).toContainText('1 finished stop');
    await expect(page.locator('#set-in-yes')).toBeFocused();
    expect((await progress(page)).done, 'nothing changes before the yes').toBe(0);
    await page.locator('#set-in-yes').click();
    await expect(ask).toHaveCount(0);
    expect((await progress(page)).done).toBe(1);
    expect((await progress(page)).cps).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.ossuary.state.place['2.1'])).toEqual(SAVE.place['2.1']);
    await page.reload();
    await up(page);
    expect((await progress(page)).done, 'it was saved, not only held in memory').toBe(1);
    expect(dialogs).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('Import refuses a file that is not progress, and changes nothing', async ({ page, errors }) => {
    await seed(page, SAVE);
    await boot(page);
    await settings(page);
    const before = await progress(page);
    for (const [name, text, why] of [
      ['notes.json', 'this is not json', 'not a JSON file'],
      ['other.json', JSON.stringify({ hello: 1 }), 'no MIMEI progress'],
      ['bad.json', JSON.stringify({ progress: { done: 'yes' } }), 'not what MIMEI saves'],
    ]) {
      await pick(page, asFile(name, text));
      await expect(page.locator(`${S} .set-note`)).toContainText(`Not imported: ${name}`);
      await expect(page.locator(`${S} .set-note`)).toContainText(why);
      await expect(page.locator('#set-in-yes')).toHaveCount(0);
    }
    expect(await progress(page)).toEqual(before);
    expect(errors).toEqual([]);
  });

  test('Clear progress is two steps on the page, offers Export first, and opens no browser dialog', async ({ page, errors }) => {
    const dialogs = noDialogs(page);
    await seed(page, SAVE);
    await boot(page);
    await settings(page);
    const clear = page.locator(`${S} #set-reset`), sure = page.locator(`${S} #set-sure`);
    await clear.click();
    await expect(sure).toContainText('1 finished stop');
    await expect(page.locator('#set-reset-export')).toBeFocused();
    expect((await progress(page)).done, 'asking forgets nothing').toBe(1);
    await page.locator('#set-reset-no').click();
    await expect(sure).toHaveCount(0);
    await expect(clear).toBeFocused();
    expect((await progress(page)).done).toBe(1);

    await clear.click();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#set-reset-export').click()]);
    expect((await saved(dl)).progress.done).toEqual(['1.0']);
    await expect(sure, 'exporting is not the answer: the question stays').toBeVisible();
    await page.locator('#set-reset-yes').click();
    await expect(sure).toHaveCount(0);
    expect(await progress(page)).toMatchObject({ done: 0, cps: 0 });
    expect(await page.evaluate(() => window.ossuary.state.place)).toEqual({});
    expect(dialogs).toEqual([]);
    expect(errors).toEqual([]);
  });
});

/* a store that cannot be read, or a save the browser refuses: the old text is kept, and the learner hears once */
const GARBAGE = '{"done":["1.0"],"goals":{"1.0":[0';       // a save cut off halfway
const journalLines = (page, text) => page.locator('#journal-out .jline').filter({ hasText: text });

test.describe('a store that cannot be read or saved is never lost silently (#6)', () => {
  test('text that will not parse is kept as ossuary-1.bak, and the learner is told once', async ({ page, errors }) => {
    await seed(page, null, GARBAGE);
    await boot(page);
    const kept = await page.evaluate(() => ({ bak: localStorage.getItem('ossuary-1.bak'), now: localStorage.getItem('ossuary-1') }));
    expect(kept.bak, 'the old text is kept as it was').toBe(GARBAGE);
    expect(() => JSON.parse(kept.now), 'the new store is a good one').not.toThrow();
    await settings(page);
    await expect(page.locator(`${S} .set-warn`)).toContainText('ossuary-1.bak');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#set-bak').click()]);
    expect(fs.readFileSync(await dl.path(), 'utf8')).toBe(GARBAGE);
    await openGoals(page, 'journal');
    await expect(journalLines(page, 'could not be read')).toHaveCount(1);
    await page.reload();
    await up(page);
    expect(await page.evaluate(() => localStorage.getItem('ossuary-1.bak')), 'a good store later leaves the copy alone').toBe(GARBAGE);
    expect(errors).toEqual([]);
  });

  test('a save the browser refuses is told once, the last good text is kept, and Export still works', async ({ page, errors }) => {
    await page.addInitScript(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === 'ossuary-1' && window.__full) throw new DOMException('the quota has been exceeded', 'QuotaExceededError');
        return set.call(this, k, v);
      };
    });
    await seed(page, SAVE);
    await boot(page, { hash: '#/2.1' });
    const good = await page.evaluate(() => { window.__full = true; return localStorage.getItem('ossuary-1'); });
    for (const i of [1, 2]) await first3(page).nth(i).click();                  // two saves that fail
    await expect.poll(() => page.evaluate(() => localStorage.getItem('ossuary-1.bak'))).toBe(good);
    await settings(page);
    await expect(page.locator(`${S} .set-warn`)).toContainText('not keeping your progress');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator(`${S} #set-export`).click()]);
    expect((await saved(dl)).progress.tasks['first-three'], 'what is only in memory still reaches the file').toEqual([0, 1, 2]);
    await page.evaluate(() => { window.__full = false; });
    await key(page, 'Alt+Digit2');
    await first3(page).nth(0).click();                                          // storage is back: this save lands
    await settings(page);
    await expect(page.locator(`${S} .set-warn`)).toHaveCount(0);
    await openGoals(page, 'journal');
    await expect(journalLines(page, 'would not save your progress')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
});

test('the browser is asked once to keep the store (navigator.storage.persist)', async ({ page, errors }) => {
  await page.addInitScript(() => {
    window.__persist = 0;
    if (!navigator.storage) return;
    navigator.storage.persisted = async () => false;
    navigator.storage.persist = async () => { window.__persist++; return true; };
  });
  await boot(page, { hash: '#/2.1' });
  await expect.poll(() => page.evaluate(() => window.__persist)).toBe(1);
  await key(page, 'Alt+Digit4');
  await key(page, 'Alt+Digit1');
  expect(await page.evaluate(() => window.__persist), 'asked once, not on every move').toBe(1);
  expect(errors).toEqual([]);
});

test.describe('the place in a lesson comes back (#6)', () => {
  const place = page => page.evaluate(() => { const p = window.ossuary.state.place['2.1']; return p ? { s: p.s, y: p.y, p: p.p } : null; });

  test('a reload brings back the step, the scroll and an answered probe', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const probe = page.locator(`${DOC} .probe[data-probe='p-first']`);
    await probe.scrollIntoViewIfNeeded();
    await probe.locator('.opts button').nth(0).click();                         // a wrong answer: it says so, and it is kept
    await expect(probe).toHaveClass(/missed/);
    await readStep(page, 3);
    const y = await top(page);
    await expect.poll(() => place(page)).toEqual({ s: 3, y, p: { 'p-first': 0 } });
    await page.reload();
    await up(page);
    await expect.poll(async () => Math.abs((await top(page)) - y)).toBeLessThanOrEqual(3);
    expect((await study(page)).step).toBe(3);
    const again = page.locator(`${DOC} .probe[data-probe='p-first']`);
    await expect(again).toHaveClass(/missed/);
    await expect(again.locator('.verdict')).toContainText('Not quite.');
    await expect(again.locator('.opts button').nth(0)).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test('a saved answer shows again without ticking anything', async ({ page, errors }) => {
    await seed(page, { place: { '2.1': { s: 0, m: 0, y: 0, p: { 'p-first': 1 } } } });
    await boot(page, { hash: '#/2.1' });
    const right = page.locator(`${DOC} .probe[data-probe='p-first'] .opts button`).nth(1);
    await expect(right).toHaveClass(/right/);
    await expect(right).toBeDisabled();
    expect((await progress(page)).cps, 'replaying an answer earns nothing').toBe(0);
    expect(await page.evaluate(() => window.ossuary.state.goals['2.1'] || [])).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test.describe('the keyboard and a cold link (leftovers from batch 1)', () => {
  /** The step whose heading has the keyboard, or '' when it is somewhere else. */
  const atHeading = page => page.evaluate(() => (document.activeElement.tagName === 'H2' ? document.activeElement.closest('.step').dataset.step : ''));

  test('the outline\'s steps are real buttons: Enter or a click takes you to their step, and the keyboard finds the outline at the step being read', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const steps = page.locator('#study .ro-step'), n = await steps.count();
    expect(n, 'one button per step').toBe(await page.locator(`${DOC} .step:not(.step-intro)`).count());
    expect(await steps.evaluateAll(fs => fs.every(f => f.tagName === 'BUTTON' && !!f.dataset.step && !!f.textContent.trim()))).toBe(true);

    const last = steps.nth(n - 1), step = await last.getAttribute('data-step');
    await last.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => atHeading(page), { message: 'Enter on a step hands the keyboard to its heading' }).toBe(step);
    await expect.poll(async () => (await study(page)).step).toBe(+step);

    const first = steps.first(), one = await first.getAttribute('data-step');
    await first.click();
    /* the glide back up from the last step passes every step between: none of them takes the outline on the way */
    const passed = await page.evaluate(() => new Promise(done => {
      const seen = new Set(), t = setInterval(() => seen.add(window.ossuary.study().step), 30);
      setTimeout(() => { clearInterval(t); done([...seen]); }, 1600);
    }));
    expect(passed, 'the steps the glide passes never take the outline').toEqual([+one]);
    await expect.poll(() => atHeading(page), { message: 'a click does the same' }).toBe(one);

    /* the outline is one tab stop, and it sits on the step being read: back from the page, the keyboard lands there */
    await expect.poll(async () => (await study(page)).step).toBe(+one);
    await expect(first).toHaveAttribute('tabindex', '0');
    await page.locator(SC).focus();
    for (let i = 0; i < 12 && !(await first.evaluate(f => f === document.activeElement)); i++) await page.keyboard.press('Shift+Tab');
    await expect(first).toBeFocused();
    await expect(first).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a cold link under the start-up: the key that lifts the dark does not turn the lesson, then the lesson has the keys', async ({ page, errors }) => {
    /* a font that is still loading keeps the dark up (the start-up waits for the fonts), so there is time for a key */
    let hold = true;
    await page.route(/\/assets\/fonts\/space-grotesk\.woff2$/, async r => {
      while (hold) await new Promise(res => setTimeout(res, 50));
      await r.continue().catch(() => {});
    });
    await page.addInitScript(() => {
      const f = new FontFace('Held', 'url(/assets/fonts/space-grotesk.woff2)');
      document.fonts.add(f);
      f.load().catch(() => {});
    });
    await page.goto('/index.html#/2.1', { waitUntil: 'commit' });
    await page.waitForFunction(() => document.body && document.body.classList.contains('booting') && document.querySelector('#desk .cr-sign'));
    await page.keyboard.press('Space');                                         // any key lifts the dark
    await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
    hold = false;
    await expect(page.locator('#study .kicker')).toContainText('2.1');
    await expect.poll(() => focused(page)).toBe('st-scroll');
    expect(await top(page), 'the skipping key did not scroll the lesson').toBe(0);
    await expect(page.locator(SC)).toHaveCSS('outline-style', 'none');          // a link lands calm: no ring until the first key
    await page.keyboard.press('PageDown');
    await expect.poll(() => top(page)).toBeGreaterThan(300);
    await expect(page.locator(SC)).not.toHaveClass(/quiet/);
    expect(errors).toEqual([]);
  });
});
