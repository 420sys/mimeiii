/* Critique follow-up: the confirmed defects found in the uncommitted work (the numbers are the review's items).
   - a tab that is only scrolled never writes over what another tab saved (#1, #16)
   - Import drops the misses kept here (#2); a huge days list is cut to what a streak can use (#17)
   - review: a right warm-up repairs its own stop (#3); N to revisit shows its question and takes the keyboard (#4, #6)
   - a saved answer outlives the warm-ups that crowd it off the page (#5); a verdict is spoken (#8)
   - a focused control is never cut off at the reading pane's edge or covered (#7); try again stays in view (#13); the course list keeps a tab stop that shows (#10) */
import { test, expect, boot, key, progress, deskMenu, courseOverlay } from './helpers.js';

const DOC = '#study .doc', SC = '#st-scroll', S = '#win-settings';
/** A store in localStorage before the app reads it: once per tab, so a reload keeps what the app itself wrote. */
const seed = (page, store) => page.addInitScript(store => {
  if (sessionStorage.getItem('seeded')) return;
  sessionStorage.setItem('seeded', '1');
  localStorage.setItem('ossuary-1', JSON.stringify(store));
}, store);
const m = (n, t) => ({ n, t });
const probe = (page, id) => page.locator(`${DOC} .probe[data-probe='${id}']`);
const pick = (page, id, i) => probe(page, id).locator('.opts button').nth(i).click();
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('ossuary-1')));
const asFile = (name, obj) => ({ name, mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(obj)) });
const lesson = async (page, id) => {
  await page.evaluate(id => { location.hash = '#/' + id; }, id);
  await expect(page.locator('#study .kicker')).toContainText(id);
};
const warmIds = page => page.locator(`${DOC} .probe`)
  .filter({ has: page.locator('.from', { hasText: /^warm up/ }) })
  .evaluateAll(ps => ps.map(p => p.dataset.probe));

test('a second tab that is only scrolled never writes over what the first tab saved (#1, #16)', async ({ page, context, errors }) => {
  await boot(page, { hash: '#/2.2' });
  const b = await context.newPage();                    // loaded before the first tab answers
  await boot(b, { hash: '#/2.2' });
  await pick(page, 'p-kinds', 1);                       // right: the goal is ticked and saved
  await expect.poll(async () => (await stored(page)).goals).toEqual({ '2.2': [0] });
  await b.locator(SC).evaluate(el => { el.scrollTop = 400; });
  await expect.poll(async () => (((await stored(b)).place || {})['2.2'] || {}).y).toBe(400);
  expect((await stored(b)).goals, 'the goal is still there once the scrolled tab has saved').toEqual({ '2.2': [0] });
  const c = await context.newPage();
  await boot(c);
  expect((await progress(c)).cps, 'a fresh tab still has the checkpoints').toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Import drops the misses kept here: they belong to the progress it replaces (#2)', async ({ page, errors }) => {
  await seed(page, { missed: { '2.2': { 'p-kinds': m(1, 5) } }, place: { '2.2': { p: { 'p-kinds': 0 } } } });
  await boot(page);
  await expect(page.locator('#oss-revisit')).toHaveText('1 to revisit');
  await key(page, 'Alt+Digit4');
  await expect(page.locator(S)).toBeVisible();
  const right = { goals: { '2.2': [0] }, place: { '2.2': { s: 0, m: 0, y: 0, p: { 'p-kinds': 1 } } } };
  await page.locator('#set-import-file').setInputFiles(asFile('right.json', { app: 'ossuary', v: 1, progress: right }));
  await page.locator('#set-in-yes').click();
  await expect(page.locator('#set-in-yes')).toHaveCount(0);
  expect(await page.evaluate(() => window.ossuary.state.missed)).toEqual({});
  await key(page, 'Alt+Digit1');
  await expect(page.locator('#oss-revisit')).toBeHidden();
  expect(errors).toEqual([]);
});

test('an imported list of days is cut to what a streak can use, so a huge file cannot freeze the page (#17)', async ({ page, errors }) => {
  await boot(page);
  await key(page, 'Alt+Digit4');
  await expect(page.locator(S)).toBeVisible();
  const days = Array.from({ length: 36500 }, (_, i) => new Date(Date.UTC(1900, 0, 1 + i)).toISOString().slice(0, 10));
  await page.locator('#set-import-file').setInputFiles(asFile('long.json', { app: 'ossuary', v: 1, progress: { days } }));
  const t0 = Date.now();
  await page.locator('#set-in-yes').click();
  await expect(page.locator('#set-in-yes')).toHaveCount(0);
  expect(Date.now() - t0, 'the import returns at once').toBeLessThan(4000);
  expect(await page.evaluate(() => window.ossuary.state.days.length)).toBeLessThanOrEqual(3701);
  expect(errors).toEqual([]);
});

const inView = (page, id) => page.evaluate(id => {
  const sc = document.getElementById('st-scroll').getBoundingClientRect();
  const r = document.querySelector(`#study .doc .probe[data-probe=${id}]`).getBoundingClientRect();
  return r.top >= sc.top - 1 && r.bottom <= sc.bottom + 1;
}, id);

test('a right answer to a carried-over warm-up repairs the stop it was missed in (#3)', async ({ page, errors }) => {
  await boot(page, { hash: '#/2.2' });
  await pick(page, 'p-kinds', 0);                       // wrong, in its own stop
  await expect.poll(async () => ((await stored(page)).place['2.2'] || {}).p).toEqual({ 'p-kinds': 0 });
  await lesson(page, '3.1');                            // it leads here as a warm-up
  await expect(probe(page, 'p-kinds').locator('.from')).toContainText('missed in 2.2');
  await pick(page, 'p-kinds', 1);
  await expect.poll(async () => (await stored(page)).missed).toEqual({});
  expect(((await stored(page)).place['2.2'] || {}).p, 'the owner stop keeps the right pick').toEqual({ 'p-kinds': 1 });
  await lesson(page, '2.2');
  await expect(probe(page, 'p-kinds')).not.toHaveClass(/missed/);
  await expect(probe(page, 'p-kinds').locator('.verdict')).toContainText('Correct.');
  expect(errors).toEqual([]);
});

test('N to revisit opens a stop that shows the missed warm-up even when earlier misses lead (#4)', async ({ page, errors }) => {
  await seed(page, { missed: { '5.1': { 'p5-warm1': m(1, 10) }, '2.2': { 'p-kinds': m(1, 20), 'p-join': m(1, 30) }, '2.3': { 'p-change': m(1, 40) } } });
  await boot(page);
  await expect(page.locator('#oss-revisit')).toHaveText('4 to revisit');
  await deskMenu(page);
  await page.locator('#oss-revisit').click();
  await expect(page.locator('#study .kicker')).toContainText('5.1');
  expect(await warmIds(page)).toEqual(['p5-warm1', 'p-kinds', 'p-join']);
  await expect.poll(() => inView(page, 'p5-warm1')).toBe(true);
  expect(errors).toEqual([]);
});

test('N to revisit puts the keyboard on the probe, not on the scroller (#6)', async ({ page, errors }) => {
  await boot(page, { hash: '#/2.1' });
  await pick(page, 'p-first', 0);                       // wrong: try again shows
  await expect(probe(page, 'p-first').locator('.again')).toBeVisible();
  await key(page, 'Alt+Digit1');
  await page.locator('#oss-revisit').focus();
  await key(page, 'Enter');
  await expect(page.locator('#study .kicker')).toContainText('2.1');
  await expect(probe(page, 'p-first').locator('.again')).toBeFocused();
  await expect.poll(() => inView(page, 'p-first')).toBe(true);
  expect(errors).toEqual([]);
});

test('a saved warm-up answer survives the carried-over warm-ups that push it off the page (#5)', async ({ page, errors }) => {
  const missed = { '2.2': { 'p-kinds': m(1, 10), 'p-join': m(1, 20) }, '2.3': { 'p-change': m(1, 30) } };
  await seed(page, { missed, place: { '3.1': { s: 0, m: 0, y: 0, p: { 'p3-warm1': 1 } } } });
  await boot(page, { hash: '#/3.1' });
  expect(await warmIds(page)).toEqual(['p-kinds', 'p-join', 'p-change']);
  await expect(probe(page, 'p3-warm1')).toHaveCount(0);
  await page.locator(SC).evaluate(el => { el.scrollTop = 80; });
  await expect.poll(async () => (((await stored(page)).place || {})['3.1'] || {}).y).toBe(80);
  expect(((await stored(page)).place['3.1'] || {}).p, 'the answer is still stored').toEqual({ 'p3-warm1': 1 });
  expect(errors).toEqual([]);
});

test('Shift+Tab never leaves a focused control cut off at the pane\'s edge or under anything (#7)', async ({ page, errors }) => {
  await boot(page, { hash: '#/2.2' });
  await page.locator(SC).evaluate(el => { el.scrollTop = el.scrollHeight; });
  await page.evaluate(() => {
    const c = [...document.querySelectorAll(`#study .doc button:not([disabled]), #study .doc [tabindex='0']`)].filter(e => e.offsetParent);
    c[c.length - 1].focus();
  });
  for (let i = 0; i < 30; i++) {
    await key(page, 'Shift+Tab');
    const hid = await page.evaluate(async sel => {
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));   // let the page settle after the scroll
      const a = document.activeElement;
      if (!a || !a.closest('#study .doc')) return [];
      /* the study has no mast or corner signs: a control hides at the reading pane's edge, or under whatever lies over the pane */
      const name = e => e.getAttribute('class') || e.tagName, what = name(a), bad = [];
      const sc = document.querySelector(sel).getBoundingClientRect(), r = a.getBoundingClientRect();
      const fits = r.height <= sc.height - 2;
      if (fits ? r.top < sc.top - 1 || r.bottom > sc.bottom + 1 : r.bottom <= sc.top || r.top >= sc.bottom) bad.push(`${what} cut off at the pane's edge`);
      const x = (Math.max(r.left, sc.left) + Math.min(r.right, sc.right)) / 2, y = (Math.max(r.top, sc.top) + Math.min(r.bottom, sc.bottom)) / 2;
      const hit = document.elementFromPoint(x, y);
      if (hit && !a.contains(hit) && !hit.contains(a)) bad.push(`${name(hit)} over ${what}`);
      return bad;
    }, SC);
    expect(hid, `Shift+Tab ${i + 1}: what hides the focused control`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test('a probe verdict is spoken through the live region (#8)', async ({ page, errors }) => {
  await boot(page, { hash: '#/2.2' });
  await pick(page, 'p-kinds', 0);
  await expect(page.locator('#live')).toContainText('Not quite.');
  await probe(page, 'p-kinds').locator('.again').click();
  await pick(page, 'p-kinds', 1);
  await expect(page.locator('#live')).toContainText('Correct.');
  expect(errors).toEqual([]);
});

test('activating an Effects level keeps the keyboard on that button (#9)', async ({ page, errors }) => {
  await boot(page);
  await key(page, 'Alt+Digit4');
  await expect(page.locator(S)).toBeVisible();
  const b = page.locator('#set-fx-balanced');
  await b.focus();
  await key(page, 'Enter');
  await expect(b).toHaveAttribute('aria-pressed', 'true');
  await expect(b).toBeFocused();
  expect(errors).toEqual([]);
});

test('folding the first unit leaves a stop the keyboard can reach (#10)', async ({ page, errors }) => {
  await boot(page);
  await key(page, 'Alt+Digit2');
  await expect(page.locator('#study')).toBeVisible();
  await courseOverlay(page);                              // the course button sits at the foot of the outline
  const win = '#study .st-course', heads = page.locator(`${win} .unit-head`);
  await expect(heads.first()).toBeVisible();
  if ((await heads.nth(1).getAttribute('aria-expanded')) !== 'true') await heads.nth(1).click();
  await heads.first().focus();
  await key(page, 'ArrowLeft');
  await expect(heads.first()).toHaveAttribute('aria-expanded', 'false');
  const shown = () => page.locator(`${win} .stop`).evaluateAll(rows => rows.filter(r => r.tabIndex === 0 && r.offsetParent !== null).length);
  expect(await shown(), 'one tab stop, and it is a row that shows').toBe(1);
  await heads.nth(1).focus();
  await key(page, 'ArrowDown');
  expect(await page.evaluate(() => document.activeElement.classList.contains('stop') && !!document.activeElement.offsetParent)).toBe(true);
  expect(errors).toEqual([]);
});

for (const [w, h] of [[1280, 800], [1366, 657], [1920, 1080]]) {
  test(`Settings scrolls inside its own window, so the last key and the About text can be reached at ${w}×${h} (#12)`, async ({ page, errors }) => {
    await page.setViewportSize({ width: w, height: h });
    await boot(page);
    await key(page, 'Alt+Digit4');
    await expect(page.locator(S)).toBeVisible();
    const r = await page.evaluate(async () => {
      const body = document.getElementById('settings-body'), edge = document.getElementById('win-settings').getBoundingClientRect().bottom;
      body.scrollTop = body.scrollHeight;
      await new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f)));
      const end = sel => [...body.querySelectorAll(sel)].pop().getBoundingClientRect().bottom;
      return { edge, cap: end('.kbdlist kbd'), about: end('.about p') };
    });
    expect(r.cap, 'the last key cap ends inside the window').toBeLessThanOrEqual(r.edge + 1);
    expect(r.about, 'the last About line ends inside the window').toBeLessThanOrEqual(r.edge + 1);
    expect(errors).toEqual([]);
  });
}

test('a wrong pick near the pane bottom leaves try again in view, so Space cannot reset a probe unseen (#13)', async ({ page, errors }) => {
  await page.setViewportSize({ width: 1366, height: 657 });
  await boot(page, { hash: '#/2.2' });
  await page.evaluate(async () => {
    const sc = document.getElementById('st-scroll'), r = sc.getBoundingClientRect();
    const o = document.querySelector('#study .doc .probe[data-probe=p-kinds] .opts').getBoundingClientRect();
    sc.scrollTop += o.bottom - (r.top + r.height * .88);   // the options end 88% down the pane: the verdict and the button fall below it
    await new Promise(f => requestAnimationFrame(() => requestAnimationFrame(f)));
  });
  await pick(page, 'p-kinds', 0);
  await expect(probe(page, 'p-kinds').locator('.again')).toBeFocused();
  await expect.poll(() => page.evaluate(() => {
    const sc = document.getElementById('st-scroll').getBoundingClientRect();
    const v = document.querySelector('#study .doc .probe[data-probe=p-kinds] .verdict').getBoundingClientRect();
    const b = document.querySelector('#study .doc .probe[data-probe=p-kinds] .again').getBoundingClientRect();
    return v.top >= sc.top - 1 && b.bottom <= sc.bottom + 1;
  })).toBe(true);
  expect(errors).toEqual([]);
});
