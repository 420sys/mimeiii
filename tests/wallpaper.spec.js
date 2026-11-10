/* Workspace 4: the one look, the one wall, and the switches that govern the
   machine. MIMEI has no theme picker and no wall picker: the look is still
   called ossuary inside, and the wall is the desk's city, out of focus, in
   tonight's scene (city-night, city-late or city-ice). */
import { test, expect, boot, key, expectTiled, study } from './helpers.js';

const settings = '#win-settings';
const shell = page => page.evaluate(() => ({
  rice: document.documentElement.dataset.rice,
  wall: document.documentElement.dataset.wall,
  fx: document.documentElement.dataset.fx,
}));

test.describe('the one look', () => {
  test('there is exactly one, it is ossuary, and there is no picker', async ({ page, errors }) => {
    await boot(page);
    const list = await page.evaluate(() => window.ossuary.rice.list.map(r => r.id));
    expect(list).toEqual(['ossuary']);
    expect(await page.evaluate(() => window.ossuary.rice.current())).toBe('ossuary');
    expect((await shell(page)).rice).toBe('ossuary');

    await key(page, 'Alt+Digit4');
    await expectTiled(page, ['settings']);
    await expect(page.locator('#win-wallpaper')).toHaveCount(0);
    await expect(page.locator(`${settings} #set-wall`)).toHaveCount(0);
    await expect(page.locator('[data-rice].rcard')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('the compatibility surface cannot wear an old rice', async ({ page, errors }) => {
    await boot(page);
    expect(await page.evaluate(() => window.ossuary.rice.apply('ossuary'))).toBe(true);
    expect(await page.evaluate(() => window.ossuary.rice.apply('komorebi'))).toBe(false);
    expect(await page.evaluate(() => window.ossuary.rice.force('violet-mochi'))).toBe(false);
    expect((await shell(page)).rice).toBe('ossuary');
    expect(errors).toEqual([]);
  });
});

test.describe('the wall', () => {
  test("the machine wears tonight's city, out of focus, and an old saved wall is let go", async ({ page, errors }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem('ossuary-1', JSON.stringify({ wall: 'fuji', rice: 'komorebi' }));
      }
    });
    await boot(page);
    const scene = await page.evaluate(() => document.documentElement.dataset.scene);
    expect(scene).toMatch(/^(night|late)$/);                     // Night, or Late in the small hours
    expect(await page.evaluate(() => window.ossuary.wall.current().id)).toBe(`city-${scene}`);
    expect((await shell(page)).wall).toBe(`city-${scene}`);
    expect((await shell(page)).rice).toBe('ossuary');
    await expect(page.locator('#wall-img')).toHaveAttribute('src', new RegExp(`city-${scene}\\.webp$`));
    expect(await page.evaluate(() => window.ossuary.wall.apply)).toBeUndefined();
    expect(errors).toEqual([]);
  });

  test('the wall follows the scene: Ice in settings turns the cab light, and Night brings it back', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit4');
    const night = page.locator(`${settings} #set-scene-night`), ice = page.locator(`${settings} #set-scene-ice`);
    await expect(night).toHaveAttribute('aria-pressed', 'true');
    await ice.click();
    await expect(ice).toHaveAttribute('aria-pressed', 'true');
    await expect(night).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => [document.documentElement.dataset.scene, document.body.dataset.scene])).toEqual(['ice', 'ice']);
    expect((await shell(page)).wall).toBe('city-ice');
    await expect(page.locator('#wall-img')).toHaveAttribute('src', /city-ice\.webp$/);
    await expect(page.locator('#brand .ob-mark')).toHaveAttribute('src', /mark-slate\.webp$/);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--fg').trim())).toBe('#18202b');
    /* it is the one scene: the study is light too, and says so */
    await key(page, 'Alt+Digit2');
    await expect(page.locator('#study')).toBeVisible();
    await expect.poll(async () => (await study(page)).scene).toBe('ice');
    await key(page, 'Alt+Digit4');
    await night.click();
    await expect(night).toHaveAttribute('aria-pressed', 'true');
    expect((await shell(page)).wall).toMatch(/^city-(night|late)$/);
    await expect(page.locator('#brand .ob-mark')).toHaveAttribute('src', /mark-snow\.webp$/);
    expect(errors).toEqual([]);
  });

  test('the launcher has no walls mode', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Enter');
    await expect(page.locator('#launcher')).toBeVisible();
    const modes = new Set();
    for (let i = 0; i < 5; i++) { modes.add(await page.locator('#launch-mode').textContent()); await key(page, 'Tab'); }
    expect([...modes]).not.toContain('walls');
    expect(errors).toEqual([]);
  });
});

test.describe('settings', () => {
  test('sound is a switch with a memory: on at first (the city at night), off stays off', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit4');
    const sound = page.locator(`${settings} #set-sound`);
    await expect(sound).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => window.ossuary.sound.on)).toBe(true);
    await sound.click();
    await expect(sound).toHaveAttribute('aria-checked', 'false');
    expect(await page.evaluate(() => window.ossuary.sound.on)).toBe(false);
    await page.reload();
    await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
    await expect(sound).toHaveAttribute('aria-checked', 'false');
    await sound.click();
    await expect(sound).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => window.ossuary.sound.on)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('rain starts off, and the switch brings it back and puts it away', async ({ page, errors }) => {
    await boot(page, { query: '?noboot&fx=3' });                  // pinned: a slow test machine would otherwise step the rain away
    await key(page, 'Alt+Digit4');
    const rain = page.locator(`${settings} #set-rain`);
    await expect(rain).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('#rain')).toBeHidden();
    expect(await page.evaluate(() => window.ossuary.fx().rain)).toBe(false);

    await rain.click();
    await expect(rain).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => window.ossuary.fx().rain)).toBe(true);
    await expect(page.locator('#rain')).toBeVisible();

    await rain.click();
    await expect(rain).toHaveAttribute('aria-checked', 'false');
    expect(await page.evaluate(() => window.ossuary.fx().rain)).toBe(false);
    await expect(page.locator('#rain')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('the effects buttons set the level; auto hands it back', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Alt+Digit4');
    await page.locator(`${settings} [data-fx="static"]`).click();
    await expect(page.locator(`${settings} [data-fx="static"]`)).toHaveAttribute('aria-pressed', 'true');
    const off = await page.evaluate(() => window.ossuary.fx());
    expect(off.preference).toBe('static');
    expect(off.level).toBe(0);
    expect((await shell(page)).fx).toBe('0');

    await page.locator(`${settings} [data-fx="auto"]`).click();
    expect((await page.evaluate(() => window.ossuary.fx())).preference).toBe('auto');
    expect(errors).toEqual([]);
  });

  test('Alt+P steps the level down and round again', async ({ page, errors }) => {
    await boot(page, { query: '?noboot&fx=3' });
    const level = async () => (await page.evaluate(() => window.ossuary.fx())).level;
    expect(await level()).toBe(3);
    const seen = [];
    for (let i = 0; i < 4; i++) { await key(page, 'Alt+KeyP'); seen.push(await level()); }
    expect(seen).toEqual([2, 1, 0, 3]);
    expect(errors).toEqual([]);
  });

  test('clear progress forgets every tick, but keeps the one look and the wall', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });

    // earn a goal the honest way
    const book = page.locator('#study .doc .runbook[data-task="first-three"] .checks li');
    for (let i = 0; i < 3; i++) await book.nth(i).click();
    expect(await page.evaluate(() => window.ossuary.cps())).toBeGreaterThan(0);

    await key(page, 'Alt+Digit4');
    await page.locator(`${settings} #set-reset`).click();
    await page.locator(`${settings} #set-reset-yes`).click();       // the second step, on the page
    expect(await page.evaluate(() => window.ossuary.cps())).toBe(0);
    expect(await page.evaluate(() => window.ossuary.progress().done)).toBe(0);

    await page.reload();
    await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
    expect(await page.evaluate(() => window.ossuary.cps())).toBe(0);
    expect((await shell(page)).rice).toBe('ossuary');       // the look is not progress
    expect((await shell(page)).wall).toMatch(/^city-(night|late)$/);  // and neither is the picture
    expect(errors).toEqual([]);
  });
});
