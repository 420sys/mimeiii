/* The performance contract, measured on the real machine in the real browser:
   a cold start that paints fast and stays still, a start-up that is short and skippable,
   effects that obey both the URL pin and reduced-motion, a heap that does not
   climb as you read, and a wall that keeps its byte budgets. */
import { test, expect, boot, key } from './helpers.js';

/** Observe what the browser actually paints, before any script runs. */
const watchPerf = page => page.addInitScript(() => {
  window.__perf = { lcp: 0, cls: 0, longTasks: [] };
  try {
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) window.__perf.lcp = Math.max(window.__perf.lcp, e.startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) window.__perf.longTasks.push(Math.round(e.duration));
    }).observe({ type: 'longtask', buffered: true });
  } catch (err) { window.__perf.err = String(err); }
});

test.describe('cold start', () => {
  test('the start-up is a short dark: it waits for the city, never long, and any key lifts it', async ({ page, errors }) => {
    /* the pictures of the city are held back, so the dark has something to wait for */
    let hold = true;
    await page.route(/\/assets\/crane\/.*\.webp$/, async r => {
      while (hold) await new Promise(res => setTimeout(res, 50));
      await r.continue().catch(() => {});
    });
    await page.goto('/index.html', { waitUntil: 'commit' });
    await page.waitForFunction(() => document.body && document.querySelector('#desk .cr-sign'));   // the machine is up behind the dark
    await expect(page.locator('body')).toHaveClass(/booting/);
    await expect(page.locator('#boot')).toBeVisible();
    const t0 = Date.now();
    await key(page, 'Escape');
    await page.waitForFunction(() => !document.body.classList.contains('booting'));
    expect(Date.now() - t0, 'a key lifts it at once').toBeLessThan(1500);
    await expect(page.locator('#boot')).toBeHidden();
    expect((await page.evaluate(() => window.ossuary.desk())).menu.pinned, 'the key did only that').toBe(false);
    hold = false;
    await expect.poll(async () => (await page.evaluate(() => window.ossuary.desk())).started, { timeout: 8000 }).toBe(true);

    /* and left alone, it gives up waiting after a moment */
    hold = true;
    const t1 = Date.now();
    await page.goto('/index.html', { waitUntil: 'commit' });
    await page.waitForFunction(() => window.ossuary && document.body && !document.body.classList.contains('booting'), null, { timeout: 6000 });
    expect(Date.now() - t1, 'never more than about 2.5 seconds of dark').toBeLessThan(4500);
    hold = false;
    await expect.poll(async () => (await page.evaluate(() => window.ossuary.desk())).started, { timeout: 8000 }).toBe(true);
    expect(errors).toEqual([]);
  });

  test('paints large, settles immediately and never blocks for long', async ({ page, errors }) => {
    await watchPerf(page);
    await page.goto('/index.html?noboot#/2.1');
    await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
    await page.waitForTimeout(1200);

    const perf = await page.evaluate(() => window.__perf);
    expect(perf.lcp, 'largest contentful paint (ms)').toBeGreaterThan(0);
    expect(perf.lcp).toBeLessThan(2500);
    expect(perf.cls, 'cumulative layout shift').toBeLessThan(0.05);
    expect(Math.max(0, ...perf.longTasks), 'longest blocking task (ms)').toBeLessThan(300);
    expect(perf.longTasks.length, 'number of long tasks').toBeLessThanOrEqual(8);
    expect(errors).toEqual([]);
  });
});

test.describe('effects', () => {
  test('?fx=1 pins the machine to minimal — no rain, no theatre', async ({ page, errors }) => {
    await boot(page, { query: '?noboot&fx=1' });
    const fx = await page.evaluate(() => window.ossuary.fx());
    expect(fx.level).toBe(1);
    expect(fx.preference).toBe('minimal');
    await expect(page.locator('#rain')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.dataset.fx)).toBe('1');
    expect(errors).toEqual([]);
  });

  test('prefers-reduced-motion pins it to level 0 whatever the URL says', async ({ page, errors }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await boot(page, { query: '?noboot&fx=3' });
    const fx = await page.evaluate(() => window.ossuary.fx());
    expect(fx.level).toBe(0);
    expect(fx.reduced).toBe(true);
    await expect(page.locator('#rain')).toBeHidden();
    expect(errors).toEqual([]);
  });
});

test.describe('reading', () => {
  test('opening a stop is instant, and an hour of them does not fill the heap', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });

    const t0 = Date.now();
    await page.evaluate(() => { location.hash = '#/6.1'; });
    await page.waitForFunction(() => (document.querySelector('#study .kicker') || {}).textContent?.includes('6.1'));
    expect(Date.now() - t0, 'opening a stop (ms)').toBeLessThan(1500);

    const heap = () => page.evaluate(() =>
      (performance.memory ? performance.memory.usedJSHeapSize : null));
    const before = await heap();
    for (const id of ['2.2', '2.3', '2.4', '2.5', '2.6', '3.1', '3.2', '3.3', '3.4', '4.1', '4.2', '5.1']) {
      await page.evaluate(h => { location.hash = '#/' + h; }, id);
    }
    await page.waitForTimeout(800);
    const after = await heap();
    if (before !== null && after !== null) {
      expect(after - before, 'heap growth across 12 stops (bytes)').toBeLessThan(40 * 1024 * 1024);
    }
    await expect(page.locator('#study .kicker')).toContainText('5.1');
    expect(errors).toEqual([]);
  });

  test('the wall keeps its byte budget at runtime, and the study brings down no climb plates', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    /* the lessons are glass over tonight's city now: the retired climb's mast plates are not fetched at all */
    await expect(page.locator('#study .kicker')).toContainText('2.1');
    const plates = await page.evaluate(() => performance.getEntriesByType('resource').filter(r => /assets\/climb\//.test(r.name)).length);
    expect(plates, 'climb plates fetched').toBe(0);

    /* the wall is on the manual and settings: tonight's city, soft, a few KB */
    await page.keyboard.press('Alt+Digit3');
    await expect(page.locator('#wall-img.on')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('wall-img').naturalWidth)).toBeGreaterThan(0);

    const res = await page.evaluate(() => performance.getEntriesByType('resource')
      .filter(r => /assets\/walls\/.*\.webp/.test(r.name))
      .map(r => ({ file: r.name.split('/').pop(), bytes: r.encodedBodySize })));
    expect(res.length, 'walls fetched during boot').toBeGreaterThan(0);

    const thumbs = res.filter(r => /@320\.webp$/.test(r.file));
    const full = res.filter(r => !/@320\.webp$/.test(r.file));
    if (thumbs.length) {
      expect(Math.max(...thumbs.map(r => r.bytes)), 'largest thumbnail (bytes)').toBeLessThanOrEqual(26 * 1024);
    }
    if (full.length) {
      expect(Math.max(...full.map(r => r.bytes)), 'largest wallpaper (bytes)').toBeLessThanOrEqual(1024 * 1024);
    }
    const scene = await page.evaluate(() => document.documentElement.dataset.scene);
    expect(res.some(r => r.file === `city-${scene}.webp`), "tonight's city came down").toBe(true);
    expect(new Set(full.map(r => r.file)).size, 'one city, not every scene').toBe(1);
    expect(Math.max(...full.map(r => r.bytes)), 'the soft city (bytes)').toBeLessThanOrEqual(64 * 1024);
    expect(errors).toEqual([]);
  });
});
