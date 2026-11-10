/* Accessibility as a testable claim: axe on every workspace, the keyboard
   able to reach and finish everything, and the keyboard-only affordances
   (the outline's single tab stop, the skip link) actually wired up. There is one look,
   and the cab wears it in two lights: the contrast table is measured in Night and in Ice. */
import { test, expect, boot, key, activeWs, openGoals, deskMenu, scriptsOut, courseOverlay } from './helpers.js';
import AxeBuilder from '@axe-core/playwright';

/* WCAG relative luminance, on the hex values the tokens actually resolve to */
const hexLum = hex => {
  const [, r, g, b] = /^#(..)(..)(..)$/.exec(hex.trim()).map((v, i) => i
    ? parseInt(v, 16) / 255 : v);
  const f = v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [hexLum(a), hexLum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The full WCAG A/AA rule set, and a failure message that lists the rules. */
async function axe(page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return violations.map(v =>
    `${v.id} [${v.impact}] ×${v.nodes.length} — ${v.help} :: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
}

test.describe('axe', () => {
  test('the desk passes: as it opens, with its menu up and the popover open, and in Ice', async ({ page, errors }) => {
    await boot(page);
    await expect.poll(async () => (await page.evaluate(() => window.ossuary.desk())).started, { timeout: 8000 }).toBe(true);
    expect(await axe(page)).toEqual([]);
    await deskMenu(page);
    await page.locator('#cr-gear').click();
    await expect(page.locator('#cr-pop')).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await page.locator('#desk .tog [data-t="ice"]').click();
    await expect(page.locator('#desk')).toHaveClass(/\bice\b/);
    expect(await axe(page)).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('the study passes: reading, with the scripts out, with the course open, and in Ice', async ({ page }) => {
    await boot(page, { hash: '#/2.1' });
    expect(await axe(page)).toEqual([]);
    await scriptsOut(page);
    await page.waitForTimeout(500);                     // the drawer slides out: measure it at rest
    expect(await axe(page)).toEqual([]);
    await courseOverlay(page);
    expect(await axe(page)).toEqual([]);
    await key(page, 'Escape');
    await expect(page.locator('#study .st-course')).toBeHidden();
    /* it is the one scene: Ice in settings lights the study too */
    await key(page, 'Alt+Digit4');
    await page.locator('#win-settings #set-scene-ice').click();
    await key(page, 'Alt+Digit2');
    await expect(page.locator('html')).toHaveAttribute('data-scene', 'ice');
    await page.waitForTimeout(500);
    expect(await axe(page)).toEqual([]);
  });

  test('the manual passes', async ({ page }) => {
    await boot(page);
    await key(page, 'Alt+Digit3');
    await expect(page.locator('.win[data-win="man"]')).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test('settings passes', async ({ page }) => {
    await boot(page);
    await key(page, 'Alt+Digit4');
    await expect(page.locator('#win-settings')).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test('the launcher with nothing found passes too', async ({ page }) => {
    await boot(page);
    await key(page, 'Alt+Enter');
    await expect(page.locator('#launch-input')).toBeFocused();
    await page.keyboard.type('zzzqx');
    await expect(page.locator('#launch-list .lempty')).toBeVisible();
    await expect(page.locator('#launch-input')).not.toHaveAttribute('aria-activedescendant', /.+/);
    expect(await axe(page)).toEqual([]);
  });

  test('the launcher passes', async ({ page }) => {
    await boot(page);
    await key(page, 'Alt+Enter');
    await expect(page.locator('#launcher')).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test('the cab passes in Ice too: the manual, settings and the launcher on light glass', async ({ page }) => {
    await boot(page, { query: '?noboot&scene=ice' });
    await key(page, 'Alt+Digit3');
    await expect(page.locator('.win[data-win="man"]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.scene)).toBe('ice');
    expect(await axe(page)).toEqual([]);
    await key(page, 'Alt+Digit4');
    await expect(page.locator('#win-settings')).toBeVisible();
    expect(await axe(page)).toEqual([]);
    await key(page, 'Alt+Enter');
    await expect(page.locator('#launcher')).toBeVisible();
    expect(await axe(page)).toEqual([]);
  });

  test('the one look passes on the session workspace', async ({ page }) => {
    await boot(page, { hash: '#/2.1' });
    expect(await page.evaluate(() => window.ossuary.rice.current())).toBe('ossuary');
    await page.waitForTimeout(120);
    expect(await axe(page)).toEqual([]);
  });
});

test.describe('the reading colours', () => {
  const tokens = page => page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      fg: s.getPropertyValue('--fg').trim(),
      fg2: s.getPropertyValue('--fg-2').trim(),
      fg3: s.getPropertyValue('--fg-3').trim(),
      fg4: s.getPropertyValue('--fg-4').trim(),
      accent: s.getPropertyValue('--accent').trim(),
      accent2: s.getPropertyValue('--accent-2').trim(),
      bg: s.getPropertyValue('--surface-solid').trim(),
    };
  });
  for (const scene of ['night', 'ice']) {
    test(`fg through fg-4 and the accents clear AA on the solid surface (${scene})`, async ({ page }) => {
      await boot(page, { query: `?noboot&scene=${scene}` });
      const t = await tokens(page);
      for (const k of ['fg', 'fg2', 'fg3', 'fg4', 'accent', 'accent2']) {
        expect(contrast(t[k], t.bg), `${k} on the solid surface`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});

test.describe('the keyboard', () => {
  test('reaches the lesson, the outline, the scripts button and the course button', async ({ page }) => {
    await boot(page, { hash: '#/2.1' });
    const wanted = ['#st-scroll', 'outline', 'BUTTON.rd-sbtn', 'BUTTON.ro-course'];
    const seen = [];
    for (let i = 0; i < 160 && !wanted.every(w => seen.includes(w)); i++) {
      await page.keyboard.press('Tab');
      seen.push(await page.evaluate(() => {
        const a = document.activeElement;
        if (!a) return 'none';
        if (a.closest('.ro-list')) return 'outline';
        if (a.id) return '#' + a.id;
        const cls = a.className && String(a.className).split(' ')[0];
        return cls ? `${a.tagName}.${cls}` : a.tagName;
      }));
    }
    expect(seen).toEqual(expect.arrayContaining(wanted));
    // the outline's steps and checkpoints are one tab stop: Tab passes through the list in a single press
    expect(seen.some((s, i) => s === 'outline' && seen[i - 1] === 'outline'), 'Tab walked the outline step by step').toBe(false);
  });

  test('the course overlay and the goals window are reachable by keyboard', async ({ page }) => {
    await boot(page, { hash: '#/2.1' });
    await page.locator('#st-scroll').click({ position: { x: 20, y: 20 } });
    await key(page, '/');
    await expect(page.locator('#st-course-q')).toBeFocused();
    await key(page, 'Escape');
    await expect(page.locator('#study .st-course')).toBeHidden();
    await openGoals(page);
    await page.locator('#win-system button.goal').first().focus();
    await expect(page.locator('#win-system button.goal').first()).toBeFocused();
  });

  test('the focused thing wears a visible ring', async ({ page }) => {
    await boot(page, { hash: '#/2.1' });
    /* open the overlay by keyboard: after a mouse click Chromium treats a scripted focus() on a
       button as pointer focus and does not match :focus-visible, which is not what a keyboard user sees */
    await key(page, '/');
    await expect(page.locator('#study .st-course')).toBeVisible();
    /* the overlay gives its search field focus twice, now and 120 ms later (src/ui/study.js):
       wait out the second one, or it can take the focus back between focus() and the measure */
    await page.waitForTimeout(250);
    const stop = page.locator('#study .st-course .stop').first();
    await stop.focus();
    await expect(stop).toBeFocused();
    const style = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(style.style).not.toBe('none');
    expect(style.width).toBeGreaterThanOrEqual(2);
  });

  test('the skip link opens a session and puts the cursor in the lesson', async ({ page, errors }) => {
    await boot(page);
    await key(page, 'Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#study')).toBeVisible();
    expect(await page.evaluate(() => document.activeElement.id)).toBe('st-scroll');
    expect(await activeWs(page)).toBe(2);
    expect(errors).toEqual([]);
  });
});
