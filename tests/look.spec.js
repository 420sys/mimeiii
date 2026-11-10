/* Look batch: the code well's edge fade and the 11px window titles, each held by a test.
   - a line that runs past the well's right edge shows a static 40px fade there, only while there is more to the right
   - the fade starts clear, takes no clicks, never sits on note text, and is left off paper
   - every window title is 11px or more and is not cut without a title, at laptop sizes */
import { test, expect, boot, showScript } from './helpers.js';

const SIZES = [[1280, 800], [1366, 768]];
const WELL = '#study .wb-code .code', PRE = `${WELL} pre`;
const state = page => page.evaluate(([well, pre]) => {
  const f = document.querySelector(well), p = document.querySelector(pre), a = getComputedStyle(f, '::after'), rects = [];
  const left = f.getBoundingClientRect().right - parseFloat(getComputedStyle(f).borderRightWidth) - parseFloat(a.right) - parseFloat(a.width);
  for (const n of f.querySelectorAll('.ln-note')) {
    const tw = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
    for (let t; (t = tw.nextNode());) { const g = document.createRange(); g.selectNodeContents(t); rects.push(...g.getClientRects()); }
  }
  return {
    shown: f.classList.contains('fade-r') && a.display !== 'none', more: p.scrollLeft + p.clientWidth < p.scrollWidth - 1, width: parseFloat(a.width),
    clear: a.backgroundImage.split('rgba(')[1].split(')')[0].endsWith(', 0'), still: a.animationName === 'none' && parseFloat(a.transitionDuration) === 0,
    inert: a.pointerEvents === 'none', notes: rects.length, underFade: rects.filter(r => r.right > left + 0.5).length,
  };
}, [WELL, PRE]);

for (const [w, h] of SIZES) {
  test(`edge fade at ${w}×${h}: shown while a line runs past the right edge, gone at the end, static, clear of the notes`, async ({ page, errors }) => {
    await page.setViewportSize({ width: w, height: h });
    await boot(page, { hash: '#/12.3' });
    await showScript(page, 1);
    await expect(page.locator(PRE)).toHaveAttribute('tabindex', '0');
    const shown = async () => (await state(page)).shown, s = await state(page);
    expect(s.more, 'a line runs on past the edge').toBe(true);
    expect.soft(s.shown, 'fade at the start').toBe(true);
    expect.soft([s.width, s.clear, s.still, s.inert], '40px, starts clear, no motion, no clicks').toEqual([40, true, true, true]);
    expect.soft(s.notes, 'note text on show').toBeGreaterThan(0);
    expect.soft(s.underFade, 'note text under the fade').toBe(0);
    const go = x => page.locator(PRE).evaluate((p, x) => { p.scrollLeft = x; }, x);
    await go(99999);
    await expect.poll(shown, { message: 'gone at the end' }).toBe(false);
    await go(0);
    await expect.poll(shown, { message: 'back at the start' }).toBe(true);
    await page.emulateMedia({ media: 'print' });
    expect.soft(await shown(), 'left off paper').toBe(false);
    await page.emulateMedia({ media: 'screen' });
    // a rule, not this pre's own style: the wider window reflows the page, and with the step's head just above the reading
    // line the line can land on the step before, whose script then fills the well
    await page.evaluate(sel => { const s = new CSSStyleSheet(); s.replaceSync(`${sel} { font-size: 4px !important; }`); document.adoptedStyleSheets = [...document.adoptedStyleSheets, s]; }, PRE);
    await page.setViewportSize({ width: w + 40, height: h });
    await expect.poll(shown, { message: 'gone when the code fits' }).toBe(false);
    expect(errors).toEqual([]);
  });
}

/* window titles: every title bar is 11px or more, and a title cut short says itself in full on hover */
const WINS = [['tty', 3], ['files', 3], ['system', 2], ['man', 3], ['settings', 4]];   // the desk (1) keeps no windows
for (const [w, h] of SIZES) {
  test(`window titles at ${w}×${h}: 11px or more and not cut`, async ({ page, errors }) => {
    await page.setViewportSize({ width: w, height: h });
    await boot(page);
    for (const [id, ws] of WINS) {
      await page.evaluate(id => window.ossuary.wm.open(id), id);
      await expect(page.locator('body')).toHaveAttribute('data-ws', String(ws));
      const nm = page.locator(`#win-${id} .win-t .nm`);
      await expect(nm).toBeVisible();
      const t = await nm.evaluate(n => ({ fs: parseFloat(getComputedStyle(n).fontSize), cut: n.scrollWidth - n.clientWidth, said: (n.closest('[title]') || {}).title || '', txt: n.textContent.trim() }));
      expect.soft(t.fs, `${id} title size`).toBeGreaterThanOrEqual(11);
      expect.soft(t.cut <= 1 || t.said.includes(t.txt), `${id} title ${t.txt} is cut and has no title`).toBe(true);
    }
    const head = await page.locator('#win-man .man-head .m').evaluate(n => parseFloat(getComputedStyle(n).fontSize));
    expect.soft(head, 'the manual header label is title text too').toBeGreaterThanOrEqual(11);
    expect(errors).toEqual([]);
  });
}
