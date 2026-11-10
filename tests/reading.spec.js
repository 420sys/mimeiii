/* Critique batch 2, reading: the code bench and the small print, each held by a test.
   - bench code never wraps (white-space: pre, it scrolls sideways); a line note sits under its own row;
     the reading column keeps 520px; Output Script:N tags still land on a print, warn or error line
   - the runbook mirror folds to one line when it would squeeze the code under ~240px
   - anything that states a fact is 11px or more; a title cut short says itself in full on hover
   - the bar's centre label fits at laptop widths (on the manual and settings; on the lessons its middle is the steps) */
import { test, expect, boot, key, showScript, scriptsAway } from './helpers.js';
import AxeBuilder from '@axe-core/playwright';

const SIZES = [[1280, 800], [1366, 768], [1440, 900]];
const CODE = '#study .wb-code';

/** Open script k (0-based, as the page numbers them) in the workbench, in the menu. */
async function open(page, k) {
  await showScript(page, k);
  await expect(page.locator('#study .wb-tab[aria-selected="true"]')).toHaveText(`script ${k + 1}`);
}

for (const [w, h] of SIZES) {
  for (const [id, k] of [['12.3', 1], ['7.3', 0]]) {
    test(`bench ${id} script ${k + 1} at ${w}×${h}: no wrapped row, notes under their row, tags match`, async ({ page, errors }) => {
      await page.setViewportSize({ width: w, height: h });
      await boot(page, { hash: '#/' + id });
      await open(page, k);
      await expect(page.locator(`${CODE} pre`)).toHaveAttribute('tabindex', '0');   // a well that scrolls sideways is reachable by keyboard
      const r = await page.evaluate(() => {
        const box = e => e.getBoundingClientRect(), rows = [...document.querySelectorAll('#study .wb-code .cl')];
        const tx = rows.map(x => x.querySelector('.tx')), lh = parseFloat(getComputedStyle(tx[0]).lineHeight);
        const noted = rows.filter(x => x.querySelector('.ln-note')), pre = document.querySelector('#study .wb-code pre');
        const tags = [...document.querySelectorAll('#study .wb-out .src')].map(s => +(/Script:(\d+)/.exec(s.textContent) || [])[1]);
        return {
          ws: getComputedStyle(tx[0]).whiteSpace, wrapped: tx.filter(t => box(t).height > lh * 1.4).length,
          numbered: rows.every((x, i) => +x.querySelector('.ln').textContent === i + 1),
          noted: noted.length, under: noted.every(x => box(x.querySelector('.ln-note')).top >= box(x.querySelector('.tx')).bottom - 1),
          sideways: pre.scrollWidth > pre.clientWidth, ox: getComputedStyle(pre).overflowX, column: box(document.querySelector('#study .doc')).width,
          badTags: tags.filter(n => !rows[n - 1] || !/print|warn|error/.test(rows[n - 1].textContent)).length,
        };
      });
      expect(r.ws).toBe('pre');
      expect(r.wrapped, 'rows taller than one line').toBe(0);
      expect(r.numbered, 'line numbers run 1..n').toBe(true);
      expect(r.noted, 'rows with a note').toBeGreaterThan(0);
      expect(r.under, 'every note sits under its own row').toBe(true);
      expect(['auto', 'scroll'], 'a line longer than the well can scroll sideways').toContain(r.ox);
      if (id === '12.3') expect(r.sideways, 'a long line scrolls sideways').toBe(true);   // 7.3's lines fit the wider bench
      expect(r.column, 'reading column').toBeGreaterThanOrEqual(520);
      expect(r.badTags, 'Output Script:N tags that miss a print, warn or error line').toBe(0);
      expect(errors).toEqual([]);
    });
  }
}

/* the runbook mirror folds to one line on a short screen instead of squeezing the code. Open at its true height (three
   checks, about 250px) it still leaves the code about 250px on 1366×657 and 1280×680, so it rightly stays open there;
   on these screens it would leave under 200px */
for (const [w, h] of [[1366, 590], [1280, 610]]) {
  test(`runbook folds to a summary at ${w}×${h} and opens by click and by Enter`, async ({ page, errors }) => {
    await page.setViewportSize({ width: w, height: h });
    await boot(page, { hash: '#/12.3' });
    await open(page, 1);
    const sum = page.locator('#study .wb-sum'), checks = page.locator('#study .wb-task .checks');
    await expect(sum).toBeVisible();
    await expect(sum).toHaveAttribute('aria-expanded', 'false');
    await expect(sum).toContainText(/[0-9]+ of [0-9]+ done/);
    await expect(checks).toBeHidden();
    expect(await page.locator(CODE).evaluate(c => c.clientHeight), 'code area with the runbook folded').toBeGreaterThanOrEqual(240);
    await sum.click();
    await expect(sum).toHaveAttribute('aria-expanded', 'true');
    await expect(checks).toBeVisible();
    await page.locator('#study .wb-task .checks li').first().click();   // ticking the mirror ticks the stage runbook
    await expect(sum).toContainText('1 of');
    await sum.focus();
    await page.keyboard.press('Enter');
    await expect(sum).toHaveAttribute('aria-expanded', 'false');
    await expect(checks).toBeHidden();
    expect(errors).toEqual([]);
  });
}

test('at 1440×900 the runbook stays open beside the code', async ({ page, errors }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await boot(page, { hash: '#/12.3' });
  await open(page, 1);
  await expect(page.locator('#study .wb-task .checks')).toBeVisible();
  await expect(page.locator('#study .wb-sum')).toBeHidden();
  expect(await page.locator(CODE).evaluate(c => c.clientHeight)).toBeGreaterThanOrEqual(240);
  expect(errors).toEqual([]);
});

/* the small print: anything that states a fact is 11px or more (the brand mark is decoration), and a name cut with an
   ellipsis says itself in full on a title, its own or its row's */
const under11 = (page, root) => page.evaluate(root => {
  const out = new Set(), w = document.createTreeWalker(document.querySelector(root), NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const e = n.parentElement;
    if (!e || !n.nodeValue.trim() || e.closest('script, style, svg, .brand-name, .sr-only')) continue;
    const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    if (r.width && r.height && s.visibility !== 'hidden' && +s.opacity > .05 && parseFloat(s.fontSize) < 11) out.add(`${e.className || e.tagName} ${s.fontSize} ${n.nodeValue.trim().slice(0, 16)}`);
  }
  return [...out];
}, root);
const cutBare = (page, root, allow = []) => page.evaluate(([root, allow]) => {
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return [...document.querySelector(root).querySelectorAll('*')]
    .filter(e => getComputedStyle(e).textOverflow === 'ellipsis' && e.getBoundingClientRect().width > 0 && e.scrollWidth > e.clientWidth + 1)
    .filter(e => !allow.some(s => e.matches(s)))
    .filter(e => { const t = e.closest('[title]'); return !t || !norm(t.title).includes(norm(e.textContent)); })
    .map(e => `${e.className}: ${e.textContent.trim().slice(0, 30)}`);
}, [root, allow]);
const fine = async (page, root, what, allow = []) => {
  expect(await under11(page, root), `${what}: text under 11px`).toEqual([]);
  expect(await cutBare(page, root, allow), `${what}: cut names without a title`).toEqual([]);
};

for (const [w, h] of [[1280, 800], [1366, 768], [1440, 900], [1600, 1000], [1920, 1080]]) {
  test(`facts are 11px or more and cut names have titles at ${w}×${h}`, async ({ page, errors }) => {
    await page.setViewportSize({ width: w, height: h });
    await boot(page);
    await fine(page, '#bar', 'bar');
    await fine(page, '#desk', 'desk');
    await page.keyboard.press('Alt+Enter');
    await expect(page.locator('#launch-input')).toBeFocused();
    await fine(page, '#launcher', 'launcher, lessons');
    for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');   // lessons, windows, actions, keys
    await fine(page, '#launcher', 'launcher, keys');
    await page.keyboard.press('Escape');
    await page.evaluate(() => { location.hash = '#/12.3'; });
    await expect(page.locator('#study .kicker')).toContainText('12.3');
    await open(page, 1);
    await fine(page, '#study', 'study, scripts out');
    await scriptsAway(page);
    await fine(page, '#study', 'study, reading');
    await page.keyboard.press('/');
    await expect(page.locator('#study .st-course')).toBeVisible();
    await fine(page, '#study .st-course', 'course overlay');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Alt+Digit4');
    await expect(page.locator('#win-settings')).toBeVisible();
    await fine(page, '#settings-body', 'settings');
    await fine(page, '#win-settings .win-bar', 'settings title bar');   // window titles are 11px too; only the brand mark stays decoration
    await page.keyboard.press('Alt+Digit3');
    await expect(page.locator('#win-man .man-head .m')).toBeVisible();
    await fine(page, '#win-man .win-bar', 'manual title bar');
    await fine(page, '#bar', 'bar on the manual');
    expect(errors).toEqual([]);
  });
}

/* the bar's centre label (the bar lives on the manual and settings; the lessons own the screen): every window
   name it shows is not cut and clears the items on both sides */
for (const [w, h] of SIZES) {
  test(`bar label at ${w}×${h}: each window name fits and clears both sides`, async ({ page, errors }) => {
    await page.setViewportSize({ width: w, height: h });
    await boot(page, { hash: '#/2.1' });
    for (const [id, name] of [['tty', 'terminal'], ['files', 'files'], ['man', 'manual'], ['settings', 'settings']]) {
      await page.evaluate(id => window.ossuary.wm.open(id), id);
      await expect(page.locator('#bar')).toBeVisible();
      await expect(page.locator('#bar-task')).toContainText(name);
      const r = await page.evaluate(() => {
        const box = e => e.getBoundingClientRect(), shown = e => [...e.children].filter(k => box(k).width > 0);
        const nm = document.querySelector('#bar .bt-name'), t = box(document.getElementById('bar-task'));
        return {
          cut: nm.scrollWidth - nm.clientWidth, left: t.left, right: t.right,
          lRight: Math.max(...shown(document.querySelector('#bar .bar-l')).map(k => box(k).right)),
          rLeft: Math.min(...shown(document.querySelector('#bar .bar-r')).map(k => box(k).left)),
        };
      });
      expect(r.cut, `${name}: label overflow in px`).toBeLessThanOrEqual(0);
      expect(r.left, `${name}: label starts right of the left items`).toBeGreaterThan(r.lRight);
      expect(r.right, `${name}: label ends left of the right items`).toBeLessThan(r.rLeft);
    }
    expect(errors).toEqual([]);
  });
}

/* axe where the bench is tightest: the code well that scrolls sideways, and the runbook folded, then open */
test('axe passes on the short-screen bench, runbook folded and open (1366×590)', async ({ page, errors }) => {
  await page.setViewportSize({ width: 1366, height: 590 });
  await boot(page, { hash: '#/12.3' });
  await open(page, 1);
  await expect(page.locator('#study .wb-sum')).toBeVisible();
  const run = async () => (await new AxeBuilder({ page }).include('#study .st-bench').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze())
    .violations.map(v => `${v.id} [${v.impact}]: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
  expect(await run(), 'runbook folded').toEqual([]);
  await page.locator('#study .wb-sum').click();
  await expect(page.locator('#study .wb-task .checks')).toBeVisible();
  expect(await run(), 'runbook open').toEqual([]);
  expect(errors).toEqual([]);
});
