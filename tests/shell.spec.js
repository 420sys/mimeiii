/* The shell: a riced desktop with a real bar, the desk, a terminal, the
   course filesystem, and the boot path. There is no dock: the bar names the
   windows of the workspace you are on, and the apps menu opens the rest. Workspace 1 is the desk, the city
   full screen with no bar and no windows; the terminal and files are tools
   that open on workspace 3, next to the manual. */
import { test, expect, boot, key, expectTiled, activeWs, wmRects, scriptsOut } from './helpers.js';

test.describe('the shell', () => {
  test('boots into the desk: the city full screen, no bar, no loose windows; the lessons have the study under the slim bar; the bar is on the manual and settings', async ({ page, errors }) => {
    await boot(page);

    await expect(page.locator('#desk')).toBeVisible();
    await expect(page.locator('#bar')).toBeHidden();
    await expect(page.locator('#rail')).toHaveCount(0);            // the icon strip is gone everywhere
    await expect(page.locator('#boot')).toBeHidden();
    await expect(page.locator('#cr-sign')).toHaveAccessibleName(/^Begin 1\.0, Set up Roblox Studio\./);
    await expect(page.locator('#win-tty')).toHaveCount(0);
    await expect(page.locator('#win-files')).toHaveCount(0);
    expect(await wmRects(page)).toEqual([]);

    // the lessons have the study, under the cab's slim bar: its middle is this lesson's steps
    await key(page, 'Alt+Digit2');
    await expect(page.locator('#study')).toBeVisible();
    await expect(page.locator('#bar')).toBeVisible();
    await expect(page.locator('#bar-task')).toHaveClass(/\blent\b/);
    await expect(page.locator('#bar-task .bs').first()).toBeVisible();

    // the bar is on the manual and settings
    await key(page, 'Alt+Digit3');
    await expect(page.locator('#bar')).toBeVisible();
    await expect(page.locator('#wall-img')).toHaveClass(/on/);
    await expect(page.locator('#brand')).toBeVisible();
    await expect(page.locator('#brand')).toHaveAccessibleName('MIMEI — the desk');
    await expect(page.locator('#mod-launch')).toBeVisible();
    await expect(page.locator('#mod-apps')).toBeVisible();
    await expect(page.locator('#bar-clock')).not.toBeEmpty();
    await expect(page.locator('#bar-cps')).toBeVisible();          // real numbers: checkpoints reached, no XP, no rank
    await expect(page.locator('#bar-cps')).toContainText('checkpoints');

    const workspaces = await page.locator('#workspaces .ws').evaluateAll(els => els.map(el => ({
      n: el.querySelector('.num').textContent,
      name: el.querySelector('.ws-name').textContent,
      current: el.getAttribute('aria-current'),
    })));
    expect(workspaces.map(w => w.n)).toEqual(['01', '02', '03', '04']);
    expect(workspaces.map(w => w.name)).toEqual(['desk', 'lessons', 'manual', 'settings']);
    expect(workspaces[2].current).toBe('page');
    await expect(page.locator('#workspaces')).toHaveAttribute('data-active', 'manual');
    /* the middle names this workspace's windows; the one in front has the lamp */
    await expect(page.locator('#bar-task .bw')).toHaveText(['manual', 'terminal', 'files']);
    await expect(page.locator('#bar-task .bw.focus')).toHaveText('manual');
    await expect(page.locator('#bar-task .bw[data-win="man"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#brand').click();
    expect(await activeWs(page)).toBe(1);
    expect(await page.evaluate(() => window.ossuary.version)).toBe('1.0');
    expect(await page.evaluate(() => document.documentElement.dataset.rice)).toBe('ossuary');
    /* behind the windows: the desk's city, out of focus, in tonight's scene */
    expect(await page.evaluate(() => document.documentElement.dataset.wall)).toMatch(/^city-(night|late)$/);
    expect(errors).toEqual([]);
  });

  test('the terminal is a working shell over the real course', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await key(page, 'Alt+Digit3');                    // the lessons own the screen: the bar is on the manual
    await page.locator('#mod-apps').click();
    await page.locator('#row-win-tty').click();
    expect(await activeWs(page), 'the terminal lives with the manual').toBe(3);
    await expect(page.locator('#win-tty')).toBeVisible();

    const screen = page.locator('#tty-screen');
    const input = page.locator('#tty-input');

    await input.fill('pwd');
    await input.press('Enter');
    await expect(screen).toContainText('~/roblox-luau');

    await input.fill('uname -a');
    await input.press('Enter');
    await expect(screen).toContainText('mimei 1.0 tty1 x86_64 GNU/Linux');

    await input.fill('ls 2');
    await input.press('Enter');
    await expect(screen).toContainText('unit-02-variables/');
    await expect(screen).toContainText('Your first variable');

    await input.fill('doesnotexist');
    await input.press('Enter');
    await expect(screen).toContainText('command not found: doesnotexist');

    /* Tab completes a command; ↑/↓ walk this session's history. */
    await input.fill('hel');
    await input.press('Tab');
    await expect(input).toHaveValue('help ');
    await input.fill('pwd');
    await input.press('Enter');
    await input.press('ArrowUp');
    await expect(input).toHaveValue('pwd');
    await input.press('ArrowDown');
    await expect(input).toHaveValue('');

    expect(errors).toEqual([]);
  });

  test('open runs a stop and puts the lesson on workspace 2', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.2' });
    await key(page, 'Alt+Digit3');
    await page.locator('#mod-apps').click();
    await page.locator('#row-win-tty').click();
    await page.locator('#tty-input').fill('open 2.1');
    await page.locator('#tty-input').press('Enter');

    expect(await activeWs(page)).toBe(2);
    await expect(page.locator('#study')).toBeVisible();
    await expect(page.locator('#st-scroll h1')).toContainText('Your first variable');
    await expect(page.locator('#win-tty')).toBeHidden();

    await key(page, 'Alt+Digit3');
    expect(await activeWs(page)).toBe(3);
    await expect(page.locator('#win-tty')).toBeVisible();
    await key(page, 'Alt+Digit1');
    expect(await activeWs(page)).toBe(1);
    await expect(page.locator('#win-tty')).toBeHidden();
    await expect(page.locator('#desk')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('the file manager is ~/roblox-luau, not a mock', async ({ page, errors }) => {
    await boot(page, { hash: '#/1.0' });
    await key(page, 'Alt+Digit3');
    await page.locator('#mod-apps').click();
    await page.locator('#row-win-files').click();
    await expect(page.locator('#win-files')).toBeVisible();
    const files = page.locator('#win-files');

    await expect(files.locator('.fm-dir')).toHaveCount(12);
    await expect(files.locator('.fm-dir.here')).toHaveAttribute('data-g', 'g1');
    await expect(files.locator('.fm-file')).toHaveCount(1);

    await files.locator('.fm-dir[data-g="g2"]').click();
    await expect(files.locator('.fm-dir.here')).toHaveAttribute('data-g', 'g2');
    await expect(files.locator('.fm-file')).toHaveCount(7);
    await expect(files.locator('.fm-file.selected')).toHaveAttribute('data-id', '2.1');

    /* j/k and arrows walk the unit; the inspector follows the selection. */
    await page.keyboard.press('j');
    await expect(files.locator('.fm-file.selected')).toHaveAttribute('data-id', '2.2');
    await expect(files.locator('.fi-title b')).toHaveText('Kinds of values');

    await page.keyboard.press('Enter');
    expect(await activeWs(page)).toBe(2);
    await expect(page.locator('#st-scroll h1')).toContainText('Kinds of values');
    expect(errors).toEqual([]);
  });

  test('the bar switches workspaces and tells you what is focused', async ({ page, errors }) => {
    await boot(page);

    await key(page, 'Alt+Digit3');                    // the desk has no bar; the lessons, the manual and settings do
    await expect(page.locator('#bar-task')).toBeVisible();
    await page.locator('#workspaces .ws[data-ws="2"]').click();
    expect(await activeWs(page)).toBe(2);
    await expect(page.locator('#study')).toBeVisible();
    await expect(page.locator('#desk')).toBeHidden();
    expect(await wmRects(page)).toEqual([]);
    await expect(page.locator('#study .kicker')).toContainText('1.0');

    // on the lessons the bar stays: it says where you are, its middle is the lesson's steps, and it walks on
    await expect(page.locator('#bar')).toBeVisible();
    await expect(page.locator('#workspaces')).toHaveAttribute('data-active', 'lessons');
    await expect(page.locator('#bar-task .bs').first()).toBeVisible();
    await page.locator('#workspaces .ws[data-ws="4"]').click();
    expect(await activeWs(page)).toBe(4);
    await expect(page.locator('#workspaces')).toHaveAttribute('data-active', 'settings');
    await expectTiled(page, ['settings']);
    await expect(page.locator('#bar-task')).toContainText('settings');
    await expect(page.locator('#bar-task')).not.toHaveClass(/beat/);

    await page.locator('#brand').click();
    expect(await activeWs(page)).toBe(1);
    await expect(page.locator('#desk')).toBeVisible();
    await expect(page.locator('#bar')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('the bar names the windows here: a word opens a tool, the one in front goes away (in stack mode too)', async ({ page, errors }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await boot(page);
    await key(page, 'Alt+Digit3');                    // the desk has no bar: its menu walks to the rest
    await expect(page.locator('#bar-task')).toBeVisible();
    await expect(page.locator('#bar-task .bw')).toHaveText(['manual', 'terminal', 'files']);
    const tty = page.locator('#bar-task .bw[data-win="tty"]');
    const files = page.locator('#bar-task .bw[data-win="files"]');

    await expect(tty).not.toHaveClass(/open/);
    await expect(files).not.toHaveClass(/open/);

    await tty.click();
    await expect(page.locator('#win-tty')).toBeVisible();
    await expect(page.locator('#win-tty')).toHaveClass(/focus/);
    await expect(tty).toHaveClass(/open/);
    await expect(tty).toHaveClass(/focus/);
    await expect(tty).toHaveAttribute('aria-pressed', 'true');

    await files.click();
    await expect(page.locator('#win-files')).toBeVisible();
    await expect(page.locator('#win-files')).toHaveClass(/focus/);
    await expect(files).toHaveClass(/focus/);
    await expect(tty).toHaveAttribute('aria-pressed', 'false');

    await files.click();                              // the one in front goes away
    await expect(page.locator('#win-files')).toBeHidden();
    await expect(files).not.toHaveClass(/focus/);

    await files.click();
    await expect(page.locator('#win-files')).toBeVisible();
    await expect(page.locator('#win-files')).toHaveClass(/focus/);
    expect(errors).toEqual([]);
  });

  test('Alt+2 shows the study: the page with its head and outline; the scripts come out beside it; no tiling windows', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit2');
    expect(await activeWs(page)).toBe(2);
    await expect(page.locator('#study')).toBeVisible();
    await expect(page.locator('#study #st-scroll')).toBeVisible();
    await expect(page.locator('#study .rd-head')).toBeVisible();
    await expect(page.locator('#study .rd-outline')).toBeVisible();
    await expect(page.locator('#study .ro-course')).toBeVisible();
    await scriptsOut(page);
    await expect(page.locator('#study .st-bench')).toBeVisible();
    await expect(page.locator('#desk')).toBeHidden();
    expect(await wmRects(page)).toEqual([]);
    await expect(page.locator('.seat-empty')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('apps opens each window on its own workspace', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await key(page, 'Alt+Digit3');                    // the bar (and its apps menu) is not on the desk or the lessons
    for (const [id, ws] of [['man', 3], ['settings', 4], ['system', 2]]) {
      if (await activeWs(page) === 2) await key(page, 'Alt+Digit3');
      await page.locator('#mod-apps').click();
      await expect(page.locator('#launcher')).toBeVisible();
      await page.locator(`#row-win-${id}`).click();
      expect(await activeWs(page), `workspace for ${id}`).toBe(ws);
      await expectTiled(page, [id]);
      await expect(page.locator('#launcher')).toBeHidden();
    }
    /* the course window is the study's overlay now: apps brings the study forward and opens it */
    await key(page, 'Alt+Digit3');
    await page.locator('#mod-apps').click();
    await page.locator('#row-win-course').click();
    expect(await activeWs(page)).toBe(2);
    await expect(page.locator('#study .st-course')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('stack mode keeps the shell usable on a narrow screen', async ({ page, errors }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await boot(page);

    expect(await page.evaluate(() => document.body.classList.contains('stack'))).toBe(true);
    /* the desk is the whole screen here too, with its menu in the corners */
    expect(await page.locator('#desk').boundingBox()).toEqual({ x: 0, y: 0, width: 900, height: 900 });
    await expect(page.locator('#bar')).toBeHidden();
    await expect.poll(() => page.evaluate(() => window.ossuary.desk().started), { timeout: 8000 }).toBe(true);
    await page.keyboard.press('Escape');
    await page.locator('#cr-menu .ws [data-ws="3"]').click();
    expect(await activeWs(page)).toBe(3);

    /* the bar is the way around: one slim line, this workspace's windows by name */
    await expect(page.locator('#bar')).toBeVisible();
    await expect(page.locator('#bar-task .bw')).toHaveText(['manual', 'terminal', 'files']);
    const barBox = await page.locator('#bar').evaluate(el => {
      const r = el.getBoundingClientRect();
      return { w: r.width, h: r.height, x: r.x, y: r.y };
    });
    expect(barBox.w).toBe(900);
    expect(barBox.h).toBeLessThan(48);

    await page.locator('#bar-task .bw[data-win="tty"]').click();
    await expect(page.locator('#tty-form')).toBeVisible();
    await expect(page.locator('#tty-screen')).toBeVisible();

    /* the prompt is pinned inside the terminal at phone width, and nothing
       spills sideways. Reopen it there so the window is tiled at the new size. */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    await key(page, 'Alt+KeyQ');
    await expect(page.locator('#win-tty')).toBeHidden();
    /* at phone width the bar keeps the workspaces and the apps menu; the words step aside */
    await expect(page.locator('#bar-task')).toBeHidden();
    await expect(page.locator('#mod-apps')).toBeVisible();
    await page.locator('#mod-apps').click();
    await page.locator('#row-win-tty').click();
    await expect(page.locator('#tty-form')).toBeVisible();
    const fit = await page.evaluate(() => {
      const form = document.querySelector('#tty-form').getBoundingClientRect();
      const win = document.querySelector('#win-tty').getBoundingClientRect();
      return {
        formBottom: Math.round(form.bottom),
        winBottom: Math.round(win.bottom),
        innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth,
      };
    });
    expect(fit.formBottom).toBeLessThanOrEqual(fit.winBottom);
    expect(fit.formBottom).toBeLessThanOrEqual(fit.innerHeight);
    expect(fit.scrollWidth).toBeLessThanOrEqual(fit.innerWidth + 1);

    await page.locator('#mod-apps').click();
    await page.locator('#row-win-course').click();
    expect(await activeWs(page)).toBe(2);
    await expect(page.locator('#study')).toBeVisible();
    await expect(page.locator('#study .st-course')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('settings (Alt+4) is settings alone, filling the seat', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit4');
    expect(await activeWs(page)).toBe(4);
    const [settings] = await expectTiled(page, ['settings']);
    expect(settings.x).toBeLessThan(40);
    expect(settings.w).toBeGreaterThan(1000);
    await expect(page.locator('#win-wallpaper')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('the launcher opens on Alt+Enter and lists lessons', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Enter');
    const host = page.locator('#launcher');
    await expect(host).toBeVisible();
    await expect(page.locator('#launch-input')).toBeFocused();
    expect(await page.locator('#launch-list .lrow').count()).toBeGreaterThan(20);
    await expect(page.locator('#launch-input')).toHaveAttribute('role', 'combobox');
    await key(page, 'Escape');
    await expect(host).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('the launcher runs a lesson', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Enter');
    await page.locator('#launch-input').fill('while loops');
    const first = page.locator('#launch-list .lrow').first();
    await expect(first).toBeVisible();
    await first.click();
    await expect(page.locator('#study h1')).toContainText('While loops');
    expect(await activeWs(page)).toBe(2);
    expect(errors).toEqual([]);
  });
});
