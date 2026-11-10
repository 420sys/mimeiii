/* The window manager: it has to behave like a tiling WM, because that is the
   whole conceit. Every case here is something a person does with a mouse or
   the Super key — drag it, snap it, float it, hide it, move it to another
   workspace — and every assertion is read out of `ossuary.wm.rects()`.
   The seat's own client box is the coordinate space: windows are positioned
   with inline `left/top` inside `#seat`, so rects are seat-relative. */
import { test, expect, boot, key, expectTiled, wmRects, activeWs } from './helpers.js';

const idsOf = list => list.map(r => r.id).sort();
const byId = (list, id) => list.find(r => r.id === id);

/* Workspace 2 is the fixed study now and no longer tiles. Workspace 3 still does:
   the manual lives there, and files and the terminal are opened beside it the way
   a learner would from the apps launcher (seeded hidden, then the workspace is shown). */
async function openThree(page) {
  await boot(page);
  await page.evaluate(() => {
    window.ossuary.wm.open('files', { ws: 3, reveal: false, focus: false, silent: true });
    window.ossuary.wm.open('tty', { ws: 3, reveal: false, focus: false, silent: true });
  });
  await key(page, 'Alt+Digit3');           // man, files, tty
  await expectTiled(page, ['man', 'files', 'tty']);
}

test.describe('the window manager', () => {
  test('a tiled row divides the seat, and focus is one window at a time', async ({ page, errors }) => {
    await openThree(page);
    const list = await wmRects(page);
    expect(list.filter(r => r.focus)).toHaveLength(1);
    expect(list.map(r => r.id)).toContain(list.find(r => r.focus).id);
    const [a, b] = list.sort((x, y) => x.x - y.x);
    expect(b.x).toBeGreaterThanOrEqual(a.x + a.w);      // no overlap: a real tiling
    await expect(page.locator('.win.focus')).toHaveCount(1);
    /* switching to a workspace focuses its first window, like a WM does */
    expect((await wmRects(page)).find(r => r.focus).id).toBe('man');
    expect(errors).toEqual([]);
  });

  test('Alt+H / Alt+L walk the focus ring', async ({ page }) => {
    await openThree(page);
    const before = (await wmRects(page)).find(r => r.focus).id;
    await key(page, 'Alt+KeyL');
    const next = (await wmRects(page)).find(r => r.focus).id;
    expect(next).not.toBe(before);
    await key(page, 'Alt+KeyH');
    expect((await wmRects(page)).find(r => r.focus).id).toBe(before);
  });

  test('Alt+Shift+L reorders the row instead of moving focus', async ({ page }) => {
    await openThree(page);
    const before = await wmRects(page);
    const focused = before.find(r => r.focus).id;
    await key(page, 'Alt+Shift+KeyL');
    const after = await wmRects(page);
    expect(after.find(r => r.focus).id).toBe(focused);
    expect(after.reduce((s, r) => s + r.w, 0)).toBeCloseTo(before.reduce((s, r) => s + r.w, 0), 0);
    // it actually moved: the focused window's left edge changed
    expect(byId(after, focused).x).not.toBe(byId(before, focused).x);
  });

  test('Alt+Shift+K / Alt+Shift+J grow and shrink the focused window', async ({ page }) => {
    await openThree(page);
    const focused = (await wmRects(page)).find(r => r.focus).id;
    const w0 = byId(await wmRects(page), focused).w;
    await key(page, 'Alt+Shift+KeyK');
    const w1 = byId(await wmRects(page), focused).w;
    expect(w1).toBeGreaterThan(w0);
    await key(page, 'Alt+Shift+KeyJ');
    await key(page, 'Alt+Shift+KeyJ');
    const w2 = byId(await wmRects(page), focused).w;
    expect(w2).toBeLessThan(w1);
  });

  test('Alt+M fills the seat with the focused window, and puts it back', async ({ page, errors }) => {
    await openThree(page);
    const seat = await page.evaluate(() => {
      const el = document.getElementById('seat');
      return { w: el.clientWidth, h: el.clientHeight };
    });
    await key(page, 'Alt+KeyM');
    await page.evaluate(() => window.ossuary.wm.flush());
    const focused = (await wmRects(page)).find(r => r.focus);
    expect(focused.monocle).toBe(true);
    expect(focused.w).toBeGreaterThan(seat.w * 0.9);
    expect(focused.h).toBeGreaterThan(seat.h * 0.9);
    await key(page, 'Alt+KeyM');
    await page.evaluate(() => window.ossuary.wm.flush());
    expect((await wmRects(page)).find(r => r.focus).monocle).toBe(false);
    await expectTiled(page);
    expect(errors).toEqual([]);
  });

  test('Alt+F floats the focused window and Alt+F tiles it again', async ({ page }) => {
    await openThree(page);
    const id = (await wmRects(page)).find(r => r.focus).id;
    await key(page, 'Alt+KeyF');
    expect(byId(await wmRects(page), id).float).toBe(true);
    await expect(page.locator(`.win[data-win="${id}"]`)).toHaveClass(/float/);
    await key(page, 'Alt+KeyF');
    expect(byId(await wmRects(page), id).float).toBe(false);
  });

  test('Alt+Z hides a window, and the apps launcher brings it back', async ({ page, errors }) => {
    await openThree(page);
    const id = (await wmRects(page)).find(r => r.focus).id;
    await key(page, 'Alt+KeyZ');
    expect((await wmRects(page)).map(r => r.id)).not.toContain(id);
    await expect(page.locator(`.win[data-win="${id}"]`)).toHaveClass(/hidden/);
    await page.locator('#mod-apps').click();
    await expect(page.locator('#launcher')).toBeVisible();
    await page.locator(`#row-win-${id}`).click();
    await expectTiled(page, [id]);
    expect(errors).toEqual([]);
  });

  test('Alt+Q closes the focused window and the seat says it is empty', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit3');                 // workspace 3 opens the manual
    await expectTiled(page, ['man']);
    await key(page, 'Alt+KeyQ');
    /* the close animation keeps the frame in the DOM for a moment, so wait for
       it to leave rather than sampling once (workspace 1 keeps its dashboard,
       and any tools opened there stay in the DOM, hidden) */
    await expect(page.locator('#seat .win:not(.hidden)')).toHaveCount(0);
    expect(await wmRects(page)).toEqual([]);
    await expect(page.locator('.seat-empty')).toBeVisible();
    expect(await page.locator('.seat-empty').textContent()).toContain('empty');
    expect(errors).toEqual([]);
  });

  test('Alt+Shift+4 carries the focused window to another workspace', async ({ page }) => {
    await openThree(page);
    const id = (await wmRects(page)).find(r => r.focus).id;
    const before3 = (await page.evaluate(() => window.ossuary.wm.windowsOn(3))).length;
    const before4 = (await page.evaluate(() => window.ossuary.wm.windowsOn(4))).length;

    await key(page, 'Alt+Shift+Digit4');
    expect(await page.evaluate(() => window.ossuary.wm.windowsOn(3))).not.toContain(id);
    expect((await page.evaluate(() => window.ossuary.wm.windowsOn(3))).length).toBe(before3 - 1);
    expect((await page.evaluate(() => window.ossuary.wm.windowsOn(4))).length).toBe(before4 + 1);

    await key(page, 'Alt+Digit3');
    expect(await activeWs(page)).toBe(3);
    expect((await wmRects(page)).map(r => r.id)).not.toContain(id);
    await expectTiled(page);
  });

  test('Alt+Tab cycles the windows on this workspace', async ({ page }) => {
    await openThree(page);
    const first = (await wmRects(page)).find(r => r.focus).id;
    await key(page, 'Alt+Tab');
    const second = (await wmRects(page)).find(r => r.focus).id;
    expect(second).not.toBe(first);
    await key(page, 'Alt+Tab');
    await key(page, 'Alt+Tab');
    expect((await wmRects(page)).find(r => r.focus).id).toBe(first);
  });

  test('Alt+Shift+M switches the row to rows', async ({ page }) => {
    await openThree(page);
    await key(page, 'Alt+Shift+KeyM');
    await page.evaluate(() => window.ossuary.wm.flush());
    const list = (await wmRects(page)).sort((a, b) => a.y - b.y);
    expect(list[0].y).toBeLessThan(40);
    expect(list[1].y).toBeGreaterThan(list[0].y + 40);      // stacked, not side by side
    expect(Math.abs(list[0].x - list[1].x)).toBeLessThan(2);
    await expectTiled(page);
  });

  test('Alt+3 remembers the workspace across a reload', async ({ page }) => {
    await boot(page);
    await key(page, 'Alt+Digit3');
    await page.reload();
    await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
    expect(await activeWs(page)).toBe(3);
  });

  test('dragging a titlebar floats the window under the pointer', async ({ page, errors }) => {
    await openThree(page);
    const id = (await wmRects(page)).find(r => r.focus).id;
    const bar = page.locator(`.win[data-win="${id}"] .win-bar`);
    const box = await bar.boundingBox();
    const start = byId(await wmRects(page), id);

    /* start from the middle of the bar: the left edge is the window's own
       traffic-light buttons, which deliberately swallow the pointerdown */
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 150, { steps: 12 });
    await page.mouse.up();

    const moved = byId(await wmRects(page), id);
    expect(moved.float).toBe(true);
    expect(moved.x).toBeGreaterThan(start.x + 10);
    expect(moved.y).toBeGreaterThan(start.y + 100);
    await expect(page.locator(`.win[data-win="${id}"]`)).toHaveClass(/float/);
    expect(errors).toEqual([]);
  });

  test('dragging to the left edge snaps to half the seat', async ({ page, errors }) => {
    await openThree(page);
    const seat = await page.locator('#seat').boundingBox();
    const id = (await wmRects(page)).find(r => r.focus).id;
    const bar = page.locator(`.win[data-win="${id}"] .win-bar`);
    const box = await bar.boundingBox();

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(seat.x + 6, seat.y + seat.height / 2, { steps: 12 });
    await page.mouse.up();

    const snapped = byId(await wmRects(page), id);
    const gap = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('seat')).getPropertyValue('--gap')));
    expect(snapped.x).toBeLessThanOrEqual(gap + 6);
    expect(snapped.w).toBeGreaterThan(seat.width * 0.4);
    expect(snapped.w).toBeLessThan(seat.width * 0.6);
    /* it stays resizable: a snapped window is a floating window that landed */
    await expect(page.locator(`.win[data-win="${id}"]`)).toHaveClass(/float/);
    await expectTiled(page);
    expect(errors).toEqual([]);
  });

  test('dropping one window on another swaps their places', async ({ page, errors }) => {
    await openThree(page);
    const list = (await wmRects(page)).sort((a, b) => a.x - b.x);
    const [left, right] = list;
    const target = await page.locator(`.win[data-win="${right.id}"]`).boundingBox();
    const bar = await page.locator(`.win[data-win="${left.id}"] .win-bar`).boundingBox();

    await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
    await page.mouse.down();
    await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 14 });
    await page.mouse.up();
    await page.evaluate(() => window.ossuary.wm.flush());

    const after = (await wmRects(page)).sort((a, b) => a.x - b.x);
    expect(after[0].id).toBe(right.id);
    expect(after[1].id).toBe(left.id);
    await expectTiled(page);
    expect(errors).toEqual([]);
  });

  test('a floating window can be resized by its corner', async ({ page }) => {
    await openThree(page);
    const id = (await wmRects(page)).find(r => r.focus).id;
    await key(page, 'Alt+KeyF');
    const before = byId(await wmRects(page), id);
    const grip = await page.locator(`.win[data-win="${id}"] .rz.se`).boundingBox();
    await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
    await page.mouse.down();
    await page.mouse.move(grip.x + grip.width / 2 + 120, grip.y + grip.height / 2 - 120, { steps: 10 });
    await page.mouse.up();
    const after = byId(await wmRects(page), id);
    expect(after.w).toBeGreaterThan(before.w + 80);
    expect(after.h).toBeLessThan(before.h - 80);
  });

  test('opening a hidden window from the launcher puts it back in the row', async ({ page, errors }) => {
    await openThree(page);
    await key(page, 'Alt+KeyZ');
    await page.locator('#mod-apps').click();
    await expect(page.locator('#launcher')).toBeVisible();
    await page.locator('#row-win-man').click();
    await expectTiled(page, ['man']);
    await expect(page.locator('.win[data-win="man"]')).not.toHaveClass(/hidden/);
    expect(errors).toEqual([]);
  });

  test("the titlebar's own buttons do what they say", async ({ page, errors }) => {
    await openThree(page);
    const bar = page.locator('.win[data-win="man"] .win-bar');
    await bar.locator('.dot.d-float').click();
    expect(byId(await wmRects(page), 'man').float).toBe(true);
    await bar.locator('.dot.d-max').click();
    expect(byId(await wmRects(page), 'man').monocle).toBe(true);
    await bar.locator('.dot.d-hide').click();
    await expect(page.locator('.win[data-win="man"]')).toHaveClass(/hidden/);
    await page.locator('#mod-apps').click();
    await expect(page.locator('#launcher')).toBeVisible();
    await page.locator('#row-win-man').click();
    await expect(page.locator('.win[data-win="man"]')).not.toHaveClass(/hidden/);
    await bar.locator('.dot.d-close').click();
    await expect(page.locator('.win[data-win="man"]')).toHaveCount(0);
    expect((await wmRects(page)).map(r => r.id)).not.toContain('man');
    expect(errors).toEqual([]);
  });

  test('right-clicking a titlebar opens a window menu that acts on that window', async ({ page, errors }) => {
    await openThree(page);
    const bar = page.locator('.win[data-win="files"] .win-bar');
    const box = await bar.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });

    const menu = page.locator('#win-menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('role', 'menu');
    expect(await menu.locator('[role="menuitem"]').count()).toBeGreaterThan(6);

    await menu.locator('[data-act="float"]').click();
    await expect(menu).toBeHidden();
    expect(byId(await wmRects(page), 'files').float).toBe(true);

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: 'right' });
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    expect(errors).toEqual([]);
  });
});
