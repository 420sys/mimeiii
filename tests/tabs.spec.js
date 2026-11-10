/* Two tabs, one store: what one tab saves, the other adopts and shows (the Sync tabs choice).
   - a tick in one tab shows in the other with no reload, and a stale tab ticking another goal keeps both
   - Clear progress and Import in one tab show in the other
   - a stale tab that misses a probe or opens a lesson keeps what the other tab saved
   - the windows are per tab: goals closed in one tab is still open, and closable, in the other */
import { test, expect, boot, key, openGoals } from './helpers.js';

const sys = '#win-system', S = '#win-settings', DOC = '#study .doc';
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem('ossuary-1')));
const cps = page => page.evaluate(() => window.ossuary.cps());
const goal = (page, i, id = '2.1') => page.locator(`${sys} .goal[data-lesson='${id}'][data-goal='${i}']`);
const ticked = (page, i, on = 'true', id = '2.1') => expect(goal(page, i, id)).toHaveAttribute('aria-checked', on);
const probe = (page, id) => page.locator(`${DOC} .probe[data-probe='${id}']`);
const pick = (page, id, i) => probe(page, id).locator('.opts button').nth(i).click();
const settings = async page => { await key(page, 'Alt+Digit4'); await expect(page.locator(S)).toBeVisible(); };

/** The errors fixture only listens to `page`: give a second tab the same ears. */
const watch = (p, errors, name) => {
  p.on('pageerror', e => errors.push(`${name} pageerror: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errors.push(`${name} console: ${m.text()}`); });
  return p;
};

/** Two tabs of one browser, both on one lesson (2.1 unless told) with the goals window open and nothing ticked: from here each is stale to the other. */
async function twoTabs(context, page, errors, id = '2.1') {
  await boot(page, { hash: '#/' + id });
  await openGoals(page);
  const b = watch(await context.newPage(), errors, 'B');
  await boot(b, { hash: '#/' + id });
  await openGoals(b);
  return b;
}

test('a tick shows in the other tab with no reload, and a stale tab ticking another goal keeps both', async ({ page, context, errors }) => {
  const b = await twoTabs(context, page, errors);
  await goal(page, 0).click();
  await ticked(b, 0);                                            // B shows A's tick without a reload
  await expect(b.locator(`${sys} .goal-status .cps`)).not.toHaveText(/^0 \//);
  await goal(b, 2).click();                                      // B was loaded before A ticked: its own copy used to be saved over A's
  await ticked(page, 2);                                         // and A shows B's tick in turn
  for (const p of [page, b]) expect((await stored(p)).goals['2.1'].slice().sort()).toEqual([0, 2]);
  expect(await cps(page)).toBe(await cps(b));
  expect(await cps(b)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Clear progress in one tab shows in the other, and the lesson it has open is drawn again', async ({ page, context, errors }) => {
  const b = await twoTabs(context, page, errors, '2.2');
  await pick(b, 'p-kinds', 1);                                   // B answers right: the goal is ticked and the pick sits on its page
  await ticked(page, 0, 'true', '2.2');                          // A shows it
  await settings(page);
  await page.locator(`${S} #set-reset`).click();
  await page.locator('#set-reset-yes').click();                  // A clears
  await ticked(b, 0, 'false', '2.2');                            // B shows the clear without a reload
  expect(await cps(b)).toBe(0);
  await expect(probe(b, 'p-kinds'), 'its open lesson is drawn again, not kept with the old pick').not.toHaveAttribute('data-picked', /\d/);
  expect(await b.evaluate(() => window.ossuary.state.ws), 'each tab keeps its own workspace').toBe(2);
  await b.evaluate(() => window.ossuary.wm.go(1));               // B saves its whole store: the old progress must not come back
  const s = await stored(b);
  expect([s.done, s.goals, s.tasks, s.missed]).toEqual([[], {}, {}, {}]);
  expect(errors).toEqual([]);
});

test('Import in one tab shows in the other', async ({ page, context, errors }) => {
  const b = await twoTabs(context, page, errors);
  await settings(page);
  const file = { name: 'mine.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'ossuary', v: 1, progress: { goals: { '2.1': [0, 1] } } })) };
  await page.locator('#set-import-file').setInputFiles(file);
  await page.locator('#set-in-yes').click();                     // A says yes
  for (const [i, on] of [[0, 'true'], [1, 'true'], [2, 'false']]) await ticked(b, i, on);
  expect(await cps(b)).toBe(await cps(page));
  expect(await cps(b)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('a stale tab that misses a probe or opens a lesson keeps what the other tab saved', async ({ page, context, errors }) => {
  const b = await twoTabs(context, page, errors, '2.2');
  await pick(page, 'p-kinds', 0);                                // A: a wrong pick, filed as a miss
  await expect.poll(() => b.evaluate(() => Object.keys(window.ossuary.state.missed))).toEqual(['2.2']);   // B has been told
  await b.evaluate(() => { location.hash = '#/2.1'; });           // B opens another stop: the store is saved whole
  await expect.poll(async () => (await stored(b)).last).toBe('2.1');
  expect(Object.keys((await stored(b)).missed), 'the miss is still stored').toEqual(['2.2']);
  expect(errors).toEqual([]);
});

/** Count the 'ossuary-1' writes a tab hears from here on. state.js added its own listener first, so a count above zero means the tab has already adopted the write. */
const listen = p => p.evaluate(() => { window.__heard = 0; addEventListener('storage', e => { if (e.key === 'ossuary-1') window.__heard++; }); });
const heard = p => expect.poll(() => p.evaluate(() => window.__heard)).toBeGreaterThan(0);
const onWs2 = p => p.evaluate(() => window.ossuary.wm.windowsOn(2));

test('goals closed in one tab stay open in the other, and its own close dot still works', async ({ page, context, errors }) => {
  const b = await twoTabs(context, page, errors);
  await listen(b);
  await page.locator(`${sys} .dot.d-close`).click();              // A closes goals and saves its layout
  await heard(b);
  expect(await onWs2(b), 'each tab keeps its own windows').toContain('system');
  await b.locator(`${sys} .dot.d-close`).click();                 // B's own close dot, on a window B still draws
  await expect(b.locator(sys)).toHaveCount(0);
  expect(await onWs2(b)).not.toContain('system');
  expect(errors).toEqual([]);
});

test('a second tab that loads leaves the goals window of the first one in its order', async ({ page, context, errors }) => {
  await boot(page, { hash: '#/2.1' });
  await openGoals(page);
  await listen(page);
  const b = watch(await context.newPage(), errors, 'B');
  await boot(b, { hash: '#/2.1' });                               // B never opens goals, and its boot rewrites the stored layout
  await b.evaluate(() => window.ossuary.wm.go(1));                // and saves the whole store, whatever its boot did
  await heard(page);
  expect(await onWs2(page)).toContain('system');
  await page.locator(`${sys} .dot.d-close`).click();
  await expect(page.locator(sys)).toHaveCount(0);
  expect(await onWs2(page)).not.toContain('system');
  expect(errors).toEqual([]);
});
