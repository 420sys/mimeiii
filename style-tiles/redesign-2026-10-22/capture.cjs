const { chromium } = require('@playwright/test');
const path = require('path');

const BASE = 'http://127.0.0.1:8925/style-tiles/redesign-2026-10-22';
const OUT = path.join(__dirname, '..', 'shots');

const directions = [
  { id: 'a', file: 'a-instrument.html', name: 'a-instrument', open: true },
  { id: 'b', file: 'b-console.html', name: 'b-console', open: true },
  { id: 'c', file: 'c-folio.html', name: 'c-folio', open: true },
];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const report = [];
  for (const d of directions) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`${BASE}/${d.file}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/redesign-${d.name}.png` });
    if (d.open) {
      await page.locator('[data-tool="course"]').first().click();
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${OUT}/redesign-${d.name}-open.png` });
      await page.keyboard.press('Escape');
    }
    report.push({ name: d.name, errors, title: await page.title() });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
})();
