/* The course: a glass overlay over the study with the full line, opened from the course
   button at the foot of the outline (or /). It keeps the old list (.unit-head, .stop).
   The outline beside the page is the one-lesson map: its steps and checkpoints, and the
   lessons either side. Everything asserted is a visible label or an ARIA state. */
import { test, expect, boot, key, activeWs, study, openGoals, courseOverlay } from './helpers.js';

const courseWin = '#study .st-course';
const overlay = courseWin;

/** Open the overlay the way a learner does: the course button at the foot of the outline. */
const openCourse = async page => {
  await boot(page);
  await key(page, 'Alt+Digit2');
  await expect(page.locator('#study')).toBeVisible();
  await courseOverlay(page);
};

/** Only the unit you are on starts open, so deep stops need their directory
 *  opened first, the same click a learner makes. */
async function openUnit(page, n) {
  const head = page.locator(`${courseWin} .unit-head[data-unit="g${n}"]`);
  await expect(head).toBeVisible();
  if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'true');
  return head;
}

test.describe('the course', () => {
  test('the line lists every unit as a directory', async ({ page, errors }) => {
    await openCourse(page);
    const heads = page.locator(`${courseWin} .unit-head`);
    expect(await heads.count()).toBeGreaterThanOrEqual(12);
    const first = heads.first();
    await expect(first.locator('.rn')).toHaveText('i');
    await expect(first.locator('.dir')).toHaveText('Set up');
    await expect(first.locator('.cnt')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('a group opens and closes, and says so to assistive tech', async ({ page }) => {
    await openCourse(page);
    const head = page.locator(`${courseWin} .unit-head`).nth(2);
    const wasOpen = await head.getAttribute('aria-expanded');
    await head.click();
    await expect(head).toHaveAttribute('aria-expanded', wasOpen === 'true' ? 'false' : 'true');
    await head.click();
    await expect(head).toHaveAttribute('aria-expanded', wasOpen);
  });

  test('a stop shows its number, title and state', async ({ page }) => {
    await openCourse(page);
    const stop = page.locator(`${courseWin} .stop`).first();
    await expect(stop.locator('.t')).not.toBeEmpty();
    await expect(stop.locator('.n')).toHaveText(/\d+\.\d+|ref/);
    await expect(stop).toHaveAttribute('data-state', /open|next|done|doing/);
    await expect(stop.locator('.m')).toHaveCount(0);
  });

  test('clicking a stop opens the lesson and marks where you are', async ({ page, errors }) => {
    await openCourse(page);
    await openUnit(page, 3);
    const stop = page.locator(`${courseWin} .stop[data-id="3.2"]`);
    await stop.click();
    await expect(page.locator('#study .kicker')).toContainText('3.2');
    await expect(page.locator('#study h1')).not.toBeEmpty();
    // choosing a stop puts the overlay away
    await expect(page.locator(courseWin)).toBeHidden();
    expect((await study(page)).courseOpen).toBe(false);
    // and the list, opened again, marks where you are
    await courseOverlay(page);
    await expect(page.locator(`${courseWin} .stop[aria-current="true"]`)).toHaveAttribute('data-id', '3.2');
    await expect(page.locator(`${courseWin} .stop[data-id="3.2"]`)).toHaveAttribute('data-state', /next|doing|open/);
    expect(errors).toEqual([]);
  });

  test('the search filters the line, and Escape clears it', async ({ page, errors }) => {
    await openCourse(page);
    const q = page.locator('#st-course-q');
    const before = await page.locator(`${courseWin} .stop`).count();
    await q.fill('while');
    const after = await page.locator(`${courseWin} .stop`).count();
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThan(0);
    await expect(page.locator(`${courseWin} .stop`).first().locator('.t')).toContainText(/while/i);
    // in the overlay Escape closes it; reopened, the search is still what was typed, so clear it by hand
    await key(page, 'Escape');
    await expect(page.locator(courseWin)).toBeHidden();
    await courseOverlay(page);
    await q.fill('');
    expect(await page.locator(`${courseWin} .stop`).count()).toBe(before);
    expect(errors).toEqual([]);
  });

  test('the / key opens the course with the cursor in the search box', async ({ page }) => {
    await boot(page);
    await key(page, 'Alt+Digit2');
    await page.locator('#st-scroll').click({ position: { x: 20, y: 20 } });
    await key(page, '/');
    await expect(page.locator(courseWin)).toBeVisible();
    await expect(page.locator('#st-course-q')).toBeFocused();
    expect(await activeWs(page)).toBe(2);
    expect((await study(page)).courseOpen).toBe(true);
  });

  test('Enter in the search opens the first match', async ({ page }) => {
    await openCourse(page);
    await page.locator('#st-course-q').fill('tables');
    const first = await page.locator(`${courseWin} .stop`).first().getAttribute('data-id');
    await page.locator('#st-course-q').press('Enter');
    await expect(page.locator('#study .kicker')).toContainText(first);
    await expect(page.locator(courseWin)).toBeHidden();
  });

  test('the list walks with the arrow keys and opens with Enter', async ({ page }) => {
    await openCourse(page);
    /* the overlay puts the cursor back in its search box 120ms after it opens (the launcher hands focus
       back as it closes); let that timer go off first, or it can land between focus() and the keys */
    await page.evaluate(() => new Promise(r => setTimeout(r, 140)));
    const first = page.locator(`${courseWin} .stop`).first();
    await first.focus();
    await key(page, 'ArrowDown');
    const secondId = await page.locator(`${courseWin} .stop`).nth(1).getAttribute('data-id');
    await key(page, 'Enter');
    await expect(page.locator('#study .kicker')).toContainText(secondId.split('.')[0]);
  });

  test('the footer knows the next stop and can carry you there', async ({ page, errors }) => {
    await openCourse(page);
    const cta = page.locator('#st-course-foot #co-next');
    await expect(cta).toContainText('start 1.0');
    await expect(page.locator(`${courseWin} .course-foot`)).toContainText('0 / 52 finished');
    await expect(page.locator(`${courseWin} .course-foot .reset`)).toHaveCount(0);
    await cta.click();
    await expect(page.locator('#study .kicker')).toContainText('1.0');
    expect(errors).toEqual([]);
  });

  test('a stop that is already ticked wears its state', async ({ page }) => {
    await boot(page, { hash: '#/2.1' });
    /* tick one checkpoint in the goals window; the outline and the course have to follow */
    await openGoals(page);
    const goal = page.locator('.win[data-win="system"] .goal[data-lesson="2.1"]').first();
    await expect(goal).toBeVisible();
    await goal.click();
    await expect(page.locator('#study .ro-cp.done')).toHaveCount(1);
    await courseOverlay(page);
    await expect(page.locator(`${courseWin} .stop[data-id="2.1"]`)).toHaveAttribute('data-state', 'doing');
    // and it keeps its state across a workspace round trip
    await key(page, 'Alt+Digit1');
    await key(page, 'Alt+Digit2');
    await expect(page.locator('#study .ro-cp.done')).toHaveCount(1);
    await expect(page.locator(`${courseWin} .stop[data-id="2.1"]`)).toHaveAttribute('data-state', 'doing');
  });

  test('the outline lists the open lesson\'s steps and checkpoints, and marks the one being read', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const outline = page.locator('#study .rd-outline');
    await expect(outline).toBeVisible();
    await expect(outline.locator('.ro-title .n')).toHaveText('2.1');
    await expect(outline.locator('.ro-title .t')).toHaveText('Your first variable');
    // a button per step of the page, and the checkpoints under the steps that hold them
    const n = await page.locator('#study .doc .step:not(.step-intro)').count();
    expect(n).toBeGreaterThan(1);
    await expect(outline.locator('.ro-step')).toHaveCount(n);
    const s = await study(page);
    expect(s.outline).toMatchObject({ steps: n, here: 0, shown: true });
    expect(s.outline.cps).toBeGreaterThan(0);
    await expect(outline.locator('.ro-cp')).toHaveCount(s.outline.cps);
    // the one being read, and only it: the title, at the top of the lesson
    await expect(outline.locator('[aria-current="step"]')).toHaveCount(1);
    await expect(outline.locator('.ro-title')).toHaveAttribute('aria-current', 'step');

    // label in name: what a screen reader says holds the name printed on the button
    const names = await outline.locator('.ro-step, .ro-cp').evaluateAll(els => els.map(e =>
      [e.querySelector('.t').textContent.replace(/\s+/g, ' ').trim(), e.getAttribute('aria-label') || '']));
    expect(names.length).toBeGreaterThan(n);
    for (const [text, label] of names) expect(label.includes(text), `${label} / ${text}`).toBe(true);
    expect(errors).toEqual([]);
  });

  test('opening another unit in the course only browses; a stop opens its lesson, and the outline\'s next button carries you on', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const kicker = page.locator('#study .kicker');
    await expect(kicker).toContainText('2.1');
    await courseOverlay(page);

    // a unit's directory only browses: the lesson stays where it was
    await openUnit(page, 3);
    await expect(page.locator(`${courseWin} .stop[data-id="3.1"]`)).toBeVisible();
    await expect(kicker).toContainText('2.1');
    expect((await study(page)).lesson).toBe('2.1');

    // a stop in it opens its lesson; the pane's head and the outline follow
    await page.locator(`${courseWin} .stop[data-id="3.1"]`).click();
    await expect(kicker).toContainText('3.1');
    await expect(page.locator(courseWin)).toBeHidden();
    await expect(page.locator('#study .rd-n')).toHaveText('3.1');
    await expect(page.locator('#study .ro-title .n')).toHaveText('3.1');

    // the next button at the foot of the outline turns the line on, and the previous one knows where you were
    const next = page.locator('#study .ro-next');
    const go = await next.getAttribute('data-go');
    expect(go, 'a lesson after 3.1').toBeTruthy();
    await next.click();
    await expect(kicker).toContainText(go);
    await expect(page.locator('#study .rd-n')).toHaveText(go);
    expect((await study(page)).lesson).toBe(go);
    await expect(page.locator('#study .ro-prev')).toHaveAttribute('data-go', '3.1');
    expect(errors).toEqual([]);
  });

  test('the outline is one tab stop, and the arrows walk its steps and checkpoints without turning the page', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const outline = page.locator('#study .rd-outline');
    const kicker = page.locator('#study .kicker');
    const name = a => (a.matches('.ro-title') ? 'title' : a.matches('.ro-step') ? `step ${a.dataset.step}` : a.matches('.ro-cp') ? `cp ${a.dataset.goal}` : a.tagName);
    const on = () => page.evaluate(`(${name})(document.activeElement)`);
    const items = await outline.locator('.ro-title:not([hidden]), .ro-step, .ro-cp').evaluateAll((els, src) => els.map(eval(src)), `(${name})`);
    expect(items.length).toBeGreaterThan(3);
    expect(items[0]).toBe('title');
    // one tab stop: the one being read, here the title
    await expect(outline.locator('[tabindex="0"]')).toHaveCount(1);
    await expect(outline.locator('.ro-title')).toHaveAttribute('tabindex', '0');

    await outline.locator('.ro-title').focus();
    await key(page, 'ArrowDown');
    expect(await on()).toBe(items[1]);
    await key(page, 'End');
    expect(await on()).toBe(items[items.length - 1]);
    await key(page, 'ArrowUp');
    expect(await on()).toBe(items[items.length - 2]);
    await key(page, 'Home');
    expect(await on()).toBe('title');
    await expect(outline.locator('[tabindex="0"]')).toHaveCount(1);
    // the cursor moved; nothing was read or opened
    expect((await study(page)).step).toBe(0);
    await expect(kicker).toContainText('2.1');

    // Enter on a step reads it, and the outline marks it
    const two = items.indexOf('step 2');
    expect(two).toBeGreaterThan(0);
    for (let i = 0; i < two; i++) await key(page, 'ArrowDown');
    expect(await on()).toBe('step 2');
    await key(page, 'Enter');
    await expect.poll(async () => (await study(page)).step).toBe(2);
    await expect(outline.locator('.ro-step[data-step="2"]')).toHaveAttribute('aria-current', 'step');
    await expect(kicker).toContainText('2.1');
    expect(errors).toEqual([]);
  });

  test('the course button opens the overlay, and closing it gives the button its focus back', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await expect(page.locator(courseWin)).toBeHidden();

    const all = page.locator('#study .ro-course');
    await all.click();
    await expect(page.locator(courseWin)).toBeVisible();
    await expect(all).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#st-course-q')).toBeFocused();
    expect((await study(page)).courseOpen).toBe(true);
    await key(page, 'Escape');
    await expect(page.locator(courseWin)).toBeHidden();
    await expect(all).toHaveAttribute('aria-expanded', 'false');
    await expect(all).toBeFocused();
    expect((await study(page)).courseOpen).toBe(false);

    await all.click();
    await page.locator(`${courseWin} .stc-x`).click();
    await expect(page.locator(courseWin)).toBeHidden();
    await expect(all).toBeFocused();
    expect(errors).toEqual([]);
  });
});
