/* Workspace 3: the manual. The sheets are the course's own reference material,
   set plainly (no runbooks, no probes, no copy buttons), and `q` closes the
   page the way it has closed man pages for fifty years. */
import { test, expect, boot, key, activeWs, courseOverlay } from './helpers.js';

const win = '.win[data-win="man"]';
const title = `${win} .win-t .nm`;
const head = `${win} .man-head`;

const openMan = async page => {
  await boot(page);
  await key(page, 'Alt+Digit3');
  await expect(page.locator(win)).toBeVisible();
};

const overlay = '#study .st-course';

/** The course overlay, opened the way a learner opens it: the course button at the foot of the outline. */
async function openOverlay(page) {
  await expect(page.locator('#study')).toBeVisible();
  await courseOverlay(page);
  await expect(page.locator(overlay)).toBeVisible();
}

/** Only the units you are on start folded open; cheat-3 lives in unit 3. */
async function openUnit(page, n) {
  await openOverlay(page);
  const head = page.locator(`${overlay} .unit-head[data-unit="g${n}"]`);
  if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'true');
}

test.describe('the manual', () => {
  test('is a page with a name, a section and a footer that says how to leave', async ({ page, errors }) => {
    await openMan(page);
    await expect(page.locator(`${head} .l`)).toHaveText(/^LUAU-[A-Z0-9-]+\(\d+\)$/);
    await expect(page.locator(`${head} .r`)).toHaveText(/^\d+\/11$/);
    await expect(page.locator(`${win} .man-doc h1`)).not.toBeEmpty();

    const foot = page.locator(`${win} .win-foot`);
    await expect(foot.locator('#man-prev')).toBeVisible();
    await expect(foot.locator('#man-next')).toBeVisible();
    await expect(foot.locator('#man-pos')).toHaveText('top');
    await expect(foot).toContainText('close');
    expect(errors).toEqual([]);
  });

  test('the prev and next buttons flip sheets and the counter follows', async ({ page, errors }) => {
    await openMan(page);
    const before = await page.locator(title).innerText();
    await expect(page.locator(`${head} .r`)).toHaveText('1/11');

    await page.locator(`${win} #man-next`).click();
    await expect(page.locator(`${head} .r`)).toHaveText('2/11');
    await expect(page.locator(title)).not.toHaveText(before);

    await page.locator(`${win} #man-prev`).click();
    await expect(page.locator(`${head} .r`)).toHaveText('1/11');
    await expect(page.locator(title)).toHaveText(before);
    expect(errors).toEqual([]);
  });

  test('q closes the page — and only from inside it', async ({ page, errors }) => {
    await openMan(page);
    await page.locator(`${win} .man-body`).click();
    await key(page, 'q');
    await expect(page.locator(win)).toHaveCount(0);

    // with a lesson focused instead, q does nothing at all
    await key(page, 'Alt+Digit2');
    await page.locator('#st-scroll').click({ position: { x: 20, y: 20 } });
    await key(page, 'q');
    await expect(page.locator('#study')).toBeVisible();
    await expect(page.locator(win)).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('[ and ] still walk the lessons from anywhere — the man page stays put', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await key(page, 'Alt+Digit3');
    const sheet = await page.locator(title).innerText();

    await key(page, ']');
    await expect(page.locator('#study .kicker')).toContainText('2.2');
    expect(await activeWs(page)).toBe(2);
    await expect(page.locator(title)).toHaveText(sheet);
    expect(errors).toEqual([]);
  });

  test('a reference stop in the course list opens its sheet', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit2');
    await openUnit(page, 3);
    const cheats = page.locator('#study .st-course .stop[data-id="cheat-3"]');
    await expect(cheats).toBeVisible();
    await cheats.click();
    await expect(page.locator(title)).toContainText('Decisions cheatsheet');
    await expect(page.locator(`${head} .l`)).toHaveText('LUAU-DECISIONS(3)');
    expect(await activeWs(page)).toBe(3);
    expect(errors).toEqual([]);
  });

  test('searching for a reference opens it too', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit2');
    await openOverlay(page);
    await page.locator('#st-course-q').fill('variables cheatsheet');
    await page.locator('#st-course-q').press('Enter');
    await expect(page.locator(title)).toContainText('Variables cheatsheet');
    expect(errors).toEqual([]);
  });

  test('is plain: code stays, runbooks, probes and copy buttons do not', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit3');
    const doc = page.locator(`${win} .man-doc`);
    expect(await doc.locator('figure.code').count()).toBeGreaterThan(0);
    await expect(doc.locator('.runbook')).toHaveCount(0);
    await expect(doc.locator('.probe')).toHaveCount(0);
    await expect(doc.locator('.copy')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('the page offers the lesson it belongs to', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit2');
    await openUnit(page, 3);
    await page.locator('#study .st-course .stop[data-id="cheat-3"]').click();
    await page.locator(`${win} #man-open`).click();
    await expect(page.locator('#study .kicker')).toContainText('3.1');
    expect(await activeWs(page)).toBe(2);
    expect(errors).toEqual([]);
  });
});
