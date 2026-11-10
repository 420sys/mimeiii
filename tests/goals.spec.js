/* The goals window (floats over the study on ws2): the checkpoints of the open session, how many
   of the course's checkpoints are reached (real numbers: no XP, no ranks), and journalctl.
   Ticking happens here or in the lesson — one store. */
import { test, expect, boot, key, openGoals } from './helpers.js';

const sys = '#win-system';
const panes = `${sys} .panel-tabs [role="tab"]`;

test.describe('the goals pane', () => {
  test('follows the open session and lists its checkpoints', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await openGoals(page);
    await expect(page.locator(`${sys} .goal-who`)).toContainText('2.1 Your first variable');
    const goals = page.locator(`${sys} .goal[data-lesson="2.1"]`);
    await expect(goals).toHaveCount(3);
    await expect(goals.first()).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator(`${sys} .goal-status .cps`)).toHaveText('0 / 210');
    await expect(page.locator(`${sys} .goal-status`)).not.toContainText(/xp|rank|init/);
    await expect(page.locator(`${sys} .goal .x`)).toHaveCount(0);
    await expect(page.locator(`${sys} .goal-foot`)).toContainText('0 / 52 finished');
    await expect(page.locator(`${sys} .goal-foot`)).toContainText('cheatsheet');
    expect(errors).toEqual([]);
  });

  test('a checkpoint ticked here is the same tick as the lesson', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await openGoals(page);
    const cp0 = await page.evaluate(() => window.ossuary.cps());
    const goal = page.locator(`${sys} .goal[data-lesson="2.1"][data-goal="0"]`);
    await goal.click();
    await expect(goal).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => window.ossuary.cps())).toBeGreaterThan(cp0);

    // and unticking gives it back
    await goal.click();
    await expect(goal).toHaveAttribute('aria-checked', 'false');
    expect(await page.evaluate(() => window.ossuary.cps())).toBe(cp0);
    expect(errors).toEqual([]);
  });

  test('checkpoints carried in the store are counted on the next boot, in the pane and the bar', async ({ page, errors }) => {
    await boot(page);
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('ossuary-1') || '{}');
      s.goals = s.goals || {};
      for (const id of ['2.1', '2.2', '3.1']) s.goals[id] = [0, 1, 2];
      localStorage.setItem('ossuary-1', JSON.stringify(s));
    });
    await page.reload();
    await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));

    await key(page, 'Alt+Digit2');
    await openGoals(page);
    await expect(page.locator(`${sys} .goal-status .cps`)).toHaveText('9 / 210');
    expect(await page.evaluate(() => window.ossuary.cps())).toBe(9);
    // the bar on the other workspaces agrees with the pane
    await key(page, 'Alt+Digit3');
    await expect(page.locator('#bar-cps .v')).toHaveText('9/210');
    await expect(page.locator('#bar-rank, #bar-xp')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe('the journal pane', () => {
  test('shows the tail, filters the loud lines, and can be cleared', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    // clearing progress on a fresh save is harmless and writes one loud line (two steps on the page, no native dialog)
    await key(page, 'Alt+Digit4');
    await page.locator('#win-settings #set-reset').click();
    await page.locator('#win-settings #set-reset-yes').click();
    await key(page, 'Alt+Digit2');
    await openGoals(page, 'journal');
    const out = page.locator('#journal-out');
    await expect(out.locator('.jline').first()).toBeVisible();
    await expect(out).toContainText('course on disk');

    await page.locator(`${sys} [data-filter="loud"]`).click();
    await expect(page.locator(`${sys} [data-filter="loud"]`)).toHaveAttribute('aria-pressed', 'true');
    const shown = page.locator('#journal-out .jline:not([hidden])');
    expect(await shown.count()).toBeGreaterThan(0);
    for (const cls of await shown.evaluateAll(els => els.map(e => e.className))) {
      expect(cls).toMatch(/\b(ok|warn|er)\b/);
    }

    await page.locator(`${sys} [data-filter="all"]`).click();
    await page.locator(`${sys} [data-clear]`).click();
    // clearing writes its own line, so the pane holds one entry again
    await expect(out).toContainText('journal cleared');
    expect(errors).toEqual([]);
  });

  test('the follow switch pauses the tail', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await openGoals(page, 'journal');
    const follow = page.locator(`${sys} button[data-follow]`);
    await expect(follow).toHaveAttribute('aria-pressed', 'true');
    await follow.click();
    await expect(follow).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#journal-out')).toHaveAttribute('data-follow', 'false');
    expect(errors).toEqual([]);
  });
});
