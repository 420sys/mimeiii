/* Critique batch 4: weak material comes back.
   - a wrong probe answer is filed per lesson with a count; 'try again' resets the probe; a right pick clears the miss and still earns the goal
   - a reopened lesson paints its saved answers and never counts a miss twice
   - the desk queue head says 'N to revisit' and opens the oldest miss at its probe
   - a warm-up draws first from misses of earlier units: three at most, none twice
   - search reads lesson text; optional steps say so; an older copy of the progress is pointed out until Settings opens */
import { test, expect, boot, key, progress, deskMenu, study, courseOverlay } from './helpers.js';
import AxeBuilder from '@axe-core/playwright';

const DOC = '#study .doc';
const up = page => page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
/** A store in localStorage before the app reads it: once per tab, so a reload keeps what the app itself wrote. */
const seed = (page, store, raw = null) => page.addInitScript(([store, raw]) => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.setItem('ossuary-1', raw ?? JSON.stringify(store));
}, [store, raw]);
const missed = page => page.evaluate(() => JSON.parse(JSON.stringify(window.ossuary.state.missed)));
const probe = (page, id) => page.locator(`${DOC} .probe[data-probe='${id}']`);
const pick = (page, id, i) => probe(page, id).locator('.opts button').nth(i).click();
const m = (n, t) => ({ n, t });

test.describe('missed probes are kept, and can be tried again', () => {
  test('a wrong pick is counted, try again resets it, a right pick clears it and earns the goal', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.2' });
    const p = probe(page, 'p-kinds');
    await p.scrollIntoViewIfNeeded();
    await expect(p.locator('.again')).toBeHidden();
    await pick(page, 'p-kinds', 0);
    await expect(p).toHaveClass(/missed/);
    expect((await missed(page))['2.2']['p-kinds'].n).toBe(1);
    expect((await progress(page)).cps).toBe(0);
    await p.locator('.again').click();
    await expect(p).not.toHaveClass(/missed/);
    await expect(p.locator('.verdict')).toBeHidden();
    for (const i of [0, 1, 2]) await expect(p.locator('.opts button').nth(i)).toBeEnabled();
    await pick(page, 'p-kinds', 2);
    expect((await missed(page))['2.2']['p-kinds'].n, 'a second miss adds to the count').toBe(2);
    await p.locator('.again').click();
    await pick(page, 'p-kinds', 1);
    await expect(p.locator('.verdict')).toContainText('Correct.');
    expect(await missed(page)).toEqual({});
    expect((await progress(page)).cps, 'a right answer after a miss still earns its goal').toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
});

const picks = page => page.evaluate(() => (window.ossuary.state.place['2.1'] || {}).p);

test.describe('a reopened lesson paints what was answered and never counts it twice', () => {
  test('a reload paints the saved answer, the miss stays at one, try again forgets the pick', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await probe(page, 'p-first').scrollIntoViewIfNeeded();
    await pick(page, 'p-first', 0);
    await expect.poll(() => picks(page)).toEqual({ 'p-first': 0 });
    await page.reload();
    await up(page);
    const p = probe(page, 'p-first');
    await expect(p).toHaveClass(/missed/);
    await expect(p.locator('.opts button').nth(0)).toHaveClass(/wrong/);
    await expect(p.locator('.again')).toBeVisible();
    expect((await missed(page))['2.1']['p-first'].n, 'painting an answer is not making one').toBe(1);
    await p.locator('.again').click();
    await expect.poll(() => picks(page)).toBeUndefined();
    await page.reload();
    await up(page);
    await expect(probe(page, 'p-first')).not.toHaveClass(/missed/);
    await expect(probe(page, 'p-first').locator('.opts button').nth(0)).toBeEnabled();
    expect((await missed(page))['2.1']['p-first'].n, 'try again keeps the count until a right pick').toBe(1);
    expect(errors).toEqual([]);
  });
});

const BAD = { '2.2': { 'p-kinds': { n: 99, t: 5 }, 'no-such-probe': m(1, 1), 'p-join': 'x' }, 'no.such': { 'p-kinds': m(1, 1) }, '3.1': [] };

test.describe('the store keeps misses small and the desk counts them', () => {
  test('stored misses are cleaned on read: known lessons and probes only, counts capped at 9', async ({ page, errors }) => {
    await seed(page, { missed: BAD });
    await boot(page);
    expect(await missed(page)).toEqual({ '2.2': { 'p-kinds': { n: 9, t: 5 } } });
    expect(errors).toEqual([]);
  });

  test('nothing stored, nothing shown', async ({ page, errors }) => {
    await boot(page);
    await expect(page.locator('#oss-revisit')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('N to revisit counts the misses and opens the oldest one at its probe', async ({ page, errors }) => {
    await seed(page, { missed: { '3.1': { 'p3-same': m(1, 2000) }, '2.2': { 'p-kinds': m(2, 1000) } } });
    await boot(page);
    const b = page.locator('#oss-revisit');
    await expect(b).toHaveText('2 to revisit');
    await deskMenu(page);
    await b.click();
    await expect(page.locator('#study .kicker')).toContainText('2.2');
    await expect.poll(() => page.evaluate(() => {
      const sc = document.getElementById('st-scroll').getBoundingClientRect();
      const r = document.querySelector('#study .doc .probe[data-probe=p-kinds]').getBoundingClientRect();
      return r.top >= sc.top - 1 && r.bottom <= sc.bottom + 1;
    })).toBe(true);
    expect(errors).toEqual([]);
  });
});

const warmIds = page => page.locator(`${DOC} .probe`)
  .filter({ has: page.locator('.from', { hasText: /^warm up/ }) })
  .evaluateAll(ps => ps.map(p => p.dataset.probe));

test.describe('a warm-up draws first from what was missed in earlier units', () => {
  test('two misses lead, and the lesson own warm-up takes the third place', async ({ page, errors }) => {
    await seed(page, { missed: { '2.2': { 'p-kinds': m(1, 10) }, '2.3': { 'p-change': m(1, 20) } } });
    await boot(page, { hash: '#/3.1' });
    expect(await warmIds(page)).toEqual(['p-kinds', 'p-change', 'p3-warm1']);
    expect(errors).toEqual([]);
  });

  test('four misses leave three, the oldest first, none twice', async ({ page, errors }) => {
    await seed(page, { missed: { '2.2': { 'p-kinds': m(1, 10), 'p-join': m(1, 20) }, '2.3': { 'p-change': m(1, 30) }, '2.4': { 'p-copy': m(1, 40) } } });
    await boot(page, { hash: '#/3.1' });
    expect(await warmIds(page)).toEqual(['p-kinds', 'p-join', 'p-change']);
    expect(errors).toEqual([]);
  });

  test('misses in the same or a later unit never lead: the fixed warm-up stays', async ({ page, errors }) => {
    await seed(page, { missed: { '3.1': { 'p3-same': m(1, 10) }, '4.1': { 'p4-forever': m(1, 20) } } });
    await boot(page, { hash: '#/3.2' });
    expect(await warmIds(page)).toEqual(['p3-warm2']);
    expect(errors).toEqual([]);
  });
});

test('a lead question says where it was missed, is asked afresh each time, and a right pick clears it', async ({ page, errors }) => {
  await seed(page, { missed: { '2.2': { 'p-kinds': m(1, 10) } } });
  await boot(page, { hash: '#/3.1' });
  await expect(probe(page, 'p-kinds').locator('.from')).toContainText('missed in 2.2');
  await pick(page, 'p-kinds', 0);
  expect((await missed(page))['2.2']['p-kinds'].n).toBe(2);
  await page.reload();
  await up(page);
  await expect(probe(page, 'p-kinds').locator('.opts button').first()).toBeEnabled();
  expect((await missed(page))['2.2']['p-kinds'].n, 'showing it again is not missing it again').toBe(2);
  await pick(page, 'p-kinds', 1);
  await expect(probe(page, 'p-kinds').locator('.verdict')).toContainText('Correct.');
  expect(await missed(page)).toEqual({});
  expect(errors).toEqual([]);
});

test.describe('search reads the lesson text too', () => {
  test('the course overlay finds ipairs in 6.2 and 6.3 with the words around it', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit2');
    await expect(page.locator('#study')).toBeVisible();
    await courseOverlay(page);                               // the course button sits at the foot of the outline
    await page.locator('#st-course-q').fill('ipairs');
    for (const id of ['6.2', '6.3']) await expect(page.locator(`#study .st-course .stop[data-id='${id}']`)).toBeVisible();
    const snips = await page.locator('#study .st-course .stop .snip').allTextContents();
    expect(snips.length).toBeGreaterThan(0);
    for (const s of snips) expect(s.toLowerCase()).toContain('ipairs');
    expect(errors).toEqual([]);
  });

  test('the launcher finds lessons by what they say, a name still ranks first, Enter opens the hit', async ({ page, errors }) => {
    await boot(page);
    await page.keyboard.press('Alt+Enter');
    const input = page.locator('#launch-input');
    await expect(input).toBeFocused();
    await input.fill('ipairs');
    for (const id of ['62', '63']) await expect(page.locator(`#launch-list #row-${id}`)).toBeVisible();
    await expect(page.locator('#launch-list .snip').first()).toContainText(/ipairs/i);
    await input.fill('while');
    await expect(page.locator('#launch-list .lrow').first().locator('.snip')).toHaveCount(0);
    await input.fill('ipairs');
    await input.press('Enter');
    await expect(page.locator('#launcher')).toBeHidden();
    await expect(page.locator('#study .kicker')).toBeVisible();
    expect(errors).toEqual([]);
  });
});

/* practice that nothing checks says so: a Your turn with no runbook or probe wears optional and is never marked done.
   The badge is the step's quiet head over its h2: what it asks, then ' · optional' when nothing checks it. */
const badge = (page, sel) => page.locator(sel).first().locator('.st-sh .kd').evaluate(e => {
  const after = getComputedStyle(e, '::after').content;
  return e.textContent + (after === 'none' ? '' : after.replace(/^"|"$/g, ''));
});

test.describe('practice that nothing checks is labelled optional', () => {
  test('a Your turn with no runbook or probe says optional and is never marked done', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const opt = page.locator(`${DOC} .step[data-optional]`).first();
    await expect(opt).toBeAttached();
    await expect(opt).toHaveAttribute('data-kind', 'build');
    await expect(opt.locator('.runbook, .probe')).toHaveCount(0);
    expect(await badge(page, `${DOC} .step[data-optional]`)).toBe('build · optional');
    const n = await opt.getAttribute('data-step');
    await page.locator(`#study .ro-step[data-step='${n}']`).click();      // its step in the outline takes you there
    await expect(opt).toHaveClass(/here/);
    await expect.poll(async () => (await study(page)).step).toBe(+n);
    await expect(opt).not.toHaveClass(/cleared/);
    expect(errors).toEqual([]);
  });

  test('a build step that has a runbook keeps its build badge', async ({ page, errors }) => {
    await boot(page, { hash: '#/3.1' });
    const built = page.locator(`${DOC} .step[data-kind='build']`).first();
    await expect(built).toBeAttached();
    expect(await built.getAttribute('data-optional')).toBeNull();
    expect(await badge(page, `${DOC} .step[data-kind='build']`)).toBe('build');
    expect(errors).toEqual([]);
  });
});

/* the older copy: pointed out in the desk's menu until Settings is opened, downloadable from Settings whenever it exists */
const GARBAGE = '{"done":["1.0"],"goals":{"1.0":[0';
const SET = '#win-settings';
const inSettings = async page => { await key(page, 'Alt+Digit4'); await expect(page.locator(SET)).toBeVisible(); };

test.describe('an older copy of the progress is pointed out, then left alone', () => {
  test('the desk says so until Settings is opened; Settings keeps the download', async ({ page, errors }) => {
    await seed(page, null, GARBAGE);
    await boot(page);
    const note = page.locator('#oss-bak');
    await deskMenu(page);
    await expect(note).toBeVisible();
    await expect(note).toContainText('older copy kept');
    await note.click();                                                    // the note is a way to Settings
    await expect(page.locator(SET)).toBeVisible();
    await expect(page.locator(`${SET} #set-bak`)).toHaveText('Download the older copy');
    await key(page, 'Alt+Digit1');
    await expect(page.locator('#cr-sign')).toBeVisible();
    await expect(note).toBeHidden();
    await page.reload();
    await up(page);
    await expect(page.locator('#cr-sign')).toBeVisible();
    await expect(note).toBeHidden();
    await inSettings(page);
    await expect(page.locator(`${SET} #set-bak`)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('with no older copy there is no notice and no row', async ({ page, errors }) => {
    await boot(page);
    await expect(page.locator('#oss-bak')).toBeHidden();
    await inSettings(page);
    await expect(page.locator(`${SET} #set-bak`)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('the revisit count and the note sit inside the menu at 1280×800', async ({ page, errors }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.addInitScript(() => localStorage.setItem('ossuary-1.bak', '{"older":true}'));
    await seed(page, { missed: { '2.2': { 'p-kinds': m(1, 10) } } });
    await boot(page);
    await deskMenu(page);
    await expect(page.locator('#oss-revisit')).toBeVisible();
    await expect(page.locator('#oss-bak')).toBeVisible();
    const fit = await page.evaluate(() => {
      const p = document.querySelector('#desk .m.bl').getBoundingClientRect();
      return ['#oss-revisit', '#oss-bak'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return r.left >= p.left && r.right <= p.right + 1 && r.top >= p.top && r.bottom <= p.bottom + 1 && r.bottom <= innerHeight; });
    });
    expect(fit).toEqual([true, true]);
    expect(errors).toEqual([]);
  });
});

/* axe on what this batch put on screen: the desk with a revisit count and the older-copy note, Settings with its row,
   a missed probe with try again, and the text hits in the course overlay and the launcher */
const axe = async page => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()).violations
  .map(v => `${v.id} [${v.impact}] ×${v.nodes.length} :: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);

test.describe('axe passes on what this batch added', () => {
  test('the desk with a revisit count and the older-copy note, then Settings with its row', async ({ page, errors }) => {
    await page.addInitScript(() => localStorage.setItem('ossuary-1.bak', '{"older":true}'));
    await seed(page, { missed: { '2.2': { 'p-kinds': m(1, 10) } } });
    await boot(page);
    await deskMenu(page);
    await expect(page.locator('#oss-revisit')).toBeVisible();
    await expect(page.locator('#oss-bak')).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await inSettings(page);
    await expect(page.locator(`${SET} #set-bak`)).toBeVisible();
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('a missed probe with try again, then the course overlay and the launcher with text hits', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.2' });
    await probe(page, 'p-kinds').scrollIntoViewIfNeeded();
    await pick(page, 'p-kinds', 0);
    await expect(probe(page, 'p-kinds').locator('.again')).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await courseOverlay(page);                                   // the course button sits at the foot of the outline
    await page.locator('#st-course-q').fill('ipairs');
    await expect(page.locator('#study .st-course .stop .snip').first()).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await key(page, 'Escape');
    await expect(page.locator('#study .st-course')).toBeHidden();
    await key(page, 'Alt+Enter');
    const input = page.locator('#launch-input');
    await expect(input).toBeFocused();
    await input.fill('ipairs');
    await expect(page.locator('#launch-list .snip').first()).toBeVisible();
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
});
