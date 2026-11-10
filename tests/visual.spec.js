/* The look itself, held still.
 *
 * Every screen here is shot on the quietest machine the OS can be: effects
 * pinned to level 0 through the URL, reduced motion emulated (so every
 * transition is 1ms and the desk is Still), the start-up skipped, fonts
 * loaded, the pictures decoded. What is left on screen has to be identical
 * run to run. The bar clock follows the fixed-time clock; the desk's clock and
 * scene are pinned with `?time=`. The desk's weather canvases are masked: the
 * drops are random.
 *
 * Baselines: `npx playwright test tests/visual.spec.js --update-snapshots`.
 * When a shot fails on purpose, review `test-results/` before updating — the
 * diff images are the review. The desk changed to MIMEI on 5 Nov 2026, so the
 * first run on a Mac after that writes new baselines with that command. */
import { test, expect, boot, key } from './helpers.js';

test.use({ viewport: { width: 1600, height: 1000 } });
/* shots are steadier one at a time */
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  /* The bar clock follows the wall clock by design. Pin it so the look is
     reviewable tomorrow. */
  await page.clock.setFixedTime(new Date('2026-10-21T14:32:00'));
});

/** Pixels that are random by design: the desk's rain and snow, and the study's margin weather and frost. */
const MOVING = ['#desk canvas.cr-wx', '#study canvas.cl-wx', '#study canvas.cl-frost'];

const shot = (page, name) => expect(page).toHaveScreenshot(name, {
  animations: 'disabled',
  caret: 'hide',
  mask: MOVING.map(sel => page.locator(sel)),
  /* Wallpaper thumbs scale to fractional card widths. Chrome can resample one
     seam row by a single channel step between runs, and the animated Night
     Train still could shift a few hundred pixels; that is not a look change. */
  maxDiffPixels: 300,
});

/** Nothing on screen may still be arriving: fonts, every visible image, the
    wallpaper, the layout, and two frames' worth of calm. */
async function still(page) {
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const ws = await page.evaluate(() => document.body.dataset.ws);   // the desk and the study have their own pictures, not the wall
  if (ws === '1') await expect.poll(async () => (await page.evaluate(() => window.ossuary.desk())).started, { timeout: 8000 }).toBe(true);
  else if (ws !== '2') await expect(page.locator('#wall-img.on')).toBeVisible();   // the study draws its city on the masked canvases: nothing to fetch
  await page.waitForFunction(() => {
    const shown = el => {
      const r = el.getBoundingClientRect();
      const visible = r.width > 0 && r.height > 0 &&
        r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
      return !visible || (el.complete && el.naturalWidth > 0);
    };
    if (![...document.images].every(shown)) return false;
    if (document.body.dataset.ws === '1' || document.body.dataset.ws === '2') return true;
    const wall = document.getElementById('wall-img');
    return !!wall && wall.complete && wall.naturalWidth > 0;
  });
  /* Complete is not decoded. Ask every visible image for its bitmap before
     the screenshot; two workers racing through the picker otherwise catch
     the same still at different raster scales. */
  await page.evaluate(async () => {
    const shown = el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 &&
        r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    };
    await Promise.all([...document.images]
      .filter(shown)
      .map(img => img.decode().catch(() => {})));
  });
  await page.evaluate(() => window.ossuary.wm.flush());
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))));
  await page.waitForTimeout(250);
}

/** Boot the quiet machine and wait for it to hold still. */
async function quiet(page, { hash = '', time = '23:47' } = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page, { query: `?noboot&fx=0&time=${time}`, hash });
  await still(page);
}

test.describe('the look', () => {
  test('ws1 — the desk at night', async ({ page, errors }) => {
    await quiet(page);
    await expect(page.locator('#cr-sign')).toContainText('Begin 1.0');
    expect((await page.evaluate(() => window.ossuary.desk())).motion).toBe('still');
    await shot(page, 'ws1-desk.png');
    expect(errors).toEqual([]);
  });

  test('ws1 — the desk in Ice, menu up', async ({ page, errors }) => {
    await quiet(page, { time: '02:40' });
    await key(page, 'Escape');
    await page.locator('#desk .tog [data-t="ice"]').click();
    await expect(page.locator('#desk')).toHaveClass(/\bice\b/);
    await still(page);
    await shot(page, 'ws1-desk-ice-menu.png');
    expect(errors).toEqual([]);
  });

  test('ws2 — a lesson', async ({ page, errors }) => {
    await quiet(page, { hash: '#/2.1' });
    await expect(page.locator('#study .kicker')).toContainText('2.1');
    await still(page);
    await shot(page, 'ws2-lesson.png');
    expect(errors).toEqual([]);
  });

  test('ws3 — the manual', async ({ page, errors }) => {
    await quiet(page);
    await key(page, 'Alt+Digit3');
    await expect(page.locator('#win-man .man-doc h1')).not.toBeEmpty();
    await still(page);
    await shot(page, 'ws3-man.png');
    expect(errors).toEqual([]);
  });

  test('ws4 — settings', async ({ page, errors }) => {
    await quiet(page);
    await key(page, 'Alt+Digit4');
    await expect(page.locator('#win-settings')).toBeVisible();
    await still(page);
    await shot(page, 'ws4-settings.png');
    expect(errors).toEqual([]);
  });

  test('the launcher over the desk', async ({ page, errors }) => {
    await quiet(page);
    await key(page, 'Alt+Enter');
    await expect(page.locator('#launcher')).toBeVisible();
    await still(page);
    await shot(page, 'launcher.png');
    expect(errors).toEqual([]);
  });
});
