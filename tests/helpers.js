/* Shared test plumbing: boot the machine honestly, catch everything it
   complains about, and drive it with the same keys a learner would use. */
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  /* every page gets its errors collected; specs assert the list is empty */
  errors: async ({ page }, use) => {
    const list = [];
    page.on('pageerror', e => list.push('pageerror: ' + e.message));
    page.on('console', m => {
      if (m.type() === 'error') list.push('console: ' + m.text());
    });
    page.on('requestfailed', r => {
      const url = r.url();
      if (!/favicon/.test(url)) list.push(`request failed: ${url} — ${r.failure() && r.failure().errorText}`);
    });
    await use(list);
  },
});
export { expect };

/** Boot with the flash skipped (`?noboot`) and wait for the machine to be up.
 *  Pass a lesson hash to land on a specific stop. */
export async function boot(page, { hash = '', query = '?noboot' } = {}) {
  await page.goto('/index.html' + query + hash);
  await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
}

/** The keyboard is read from `e.code`, so drive it the same way. */
export const key = (page, combo) => page.keyboard.press(combo);

/** The desk's menu stays out of the way until the mouse moves; Esc pins it up, the way a keyboard user brings it. */
export async function deskMenu(page) {
  if (!(await page.evaluate(() => window.ossuary.desk().menu.pinned))) await key(page, 'Escape');
  await expect.poll(() => page.evaluate(() => window.ossuary.desk().menu.k)).toBeGreaterThan(.9);
}

/** Machine state, read through the surface main.js exposes. Reading the
 *  rectangles always flushes first: geometry lands on the next frame, and a
 *  test that measures before it lands is measuring the previous layout. */
export const wmRects = async page => {
  await page.evaluate(() => window.ossuary.wm.flush());
  return page.evaluate(() => window.ossuary.wm.rects());
};
export const activeWs = page => page.evaluate(() => window.ossuary.wm.activeWs());
export const fx = page => page.evaluate(() => window.ossuary.fx());
export const progress = page => page.evaluate(() => window.ossuary.progress());
export const journal = page => page.locator('#journal-out .jline');

/** Windows are laid out as inline geometry (`offsetLeft` inside #seat), so
 *  assert they sit inside the seat's own client box. */
export async function expectTiled(page, ids = null) {
  await page.evaluate(() => window.ossuary.wm.flush());
  const seat = await page.evaluate(() => {
    const el = document.getElementById('seat');
    return { w: el.clientWidth, h: el.clientHeight };
  });
  const rects = await wmRects(page);
  const list = ids ? rects.filter(r => ids.includes(r.id)) : rects;
  expect(list.length, 'windows on the seat').toBeGreaterThan(0);
  for (const r of list) {
    expect(r.x, `${r.id} x`).toBeGreaterThanOrEqual(-1);
    expect(r.y, `${r.id} y`).toBeGreaterThanOrEqual(-1);
    expect(r.x + r.w, `${r.id} right edge`).toBeLessThanOrEqual(seat.w + 1);
    expect(r.y + r.h, `${r.id} bottom edge`).toBeLessThanOrEqual(seat.h + 1);
  }
  return list;
}

/** What the study reports about the workbench, the rail and the overlay. */
export const study = page => page.evaluate(() => window.ossuary.study());

/** The scripts drawer slides out beside the reading pane when it is wanted; bring
 *  it out the way a mouse user does (the scripts button in the pane's head; S does
 *  the same from the page) and wait until it is out and can be read. */
export async function scriptsOut(page) {
  if (!(await study(page)).drawer.open) await page.locator('#study .rd-sbtn').click();
  await expect.poll(async () => (await study(page)).drawer.open).toBe(true);
  await expect(page.locator('#study .st-bench')).toBeVisible();
}

/** Put the scripts away again (Esc), back to the page alone. */
export async function scriptsAway(page) {
  if (!(await study(page)).drawer.open) return;
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await study(page)).drawer.open).toBe(false);
}

/** The course overlay, opened the way a mouse user opens it: the course button at
 *  the foot of the outline (/ does the same from the page). */
export async function courseOverlay(page) {
  if (!(await study(page)).courseOpen) await page.locator('#study .ro-course').click();
  await expect(page.locator('#study .st-course')).toBeVisible();
  await expect.poll(async () => (await study(page)).courseOpen).toBe(true);
}

/** Open the goals/journal window the way the launcher's goals action does.
 *  On ws2 it floats over the study; pass 'journal' to land on that pane. */
export async function openGoals(page, pane = 'goals') {
  await page.evaluate(() => window.ossuary.wm.open('system'));
  await expect(page.locator('#win-system')).toBeVisible();
  if (pane !== 'goals') await page.locator(`#win-system .panel-tabs [data-pane='${pane}']`).click();
}

/** One row per stage step: its number, how many workbench scripts it holds and
 *  whether it has a runbook. */
export const stepMap = page => page.locator('#st-scroll').evaluate(sc =>
  [...sc.querySelectorAll('.step')].map(s => ({
    n: +s.dataset.step,
    kind: s.dataset.kind,
    scripts: s.querySelectorAll('figure.code[data-script]').length,
    book: !!s.querySelector('.runbook'),
  })));

/** Scroll #st-scroll until step n sits on the reading line, and wait for the
 *  study to say it is following that step. */
export async function readStep(page, n) {
  await page.locator('#st-scroll').evaluate((sc, n) => {
    const s = sc.querySelector(`.step[data-step='${n}']`);
    const top = s.getBoundingClientRect().top - sc.getBoundingClientRect().top;
    sc.scrollTop += top - sc.clientHeight * 0.34;
  }, n);
  await expect.poll(async () => (await study(page)).step).toBe(n);
}

/** Show script K (0-based, as the page numbers them) in the scripts drawer the way a learner does:
 *  read its step, bring the scripts out, and pick its tab when the step holds more than one script. */
export async function showScript(page, k = 0) {
  const n = await page.locator(`#study .doc figure.code[data-script='${k}']`).evaluate(f => +f.closest('.step').dataset.step);
  await readStep(page, n);
  await scriptsOut(page);
  const tab = page.locator('#study .st-bench .wb-tab', { hasText: new RegExp(`^script ${k + 1}$`) });
  if ((await tab.count()) && (await tab.getAttribute('aria-selected')) !== 'true') await tab.click();
  await expect(page.locator('#study .st-bench .wb-code figure.code')).toHaveCount(1);
}
