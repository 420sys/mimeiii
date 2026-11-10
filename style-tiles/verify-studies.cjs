const { chromium } = require('playwright');

const common = `
  .nx-desk.study-a .nx-now {
    position: absolute;
    left: 84px;
    top: 118px;
    width: 580px;
    min-height: 360px;
    padding: 26px 30px 28px;
    border-radius: 14px;
    border-color: rgba(255, 255, 255, .12);
    background: linear-gradient(160deg, rgba(12, 18, 24, .80), rgba(5, 9, 14, .66));
    box-shadow: 0 34px 100px rgba(0, 0, 0, .36), inset 0 1px 0 rgba(255, 255, 255, .07);
    -webkit-backdrop-filter: blur(30px) saturate(1.12);
    backdrop-filter: blur(30px) saturate(1.12);
  }
  .study-a .nx-now .nx-card-h { font-size: 8.5px; letter-spacing: .18em; margin-bottom: 16px; }
  .study-a .nx-now .nx-kicker { font-size: 9px; gap: 8px; }
  .study-a .nx-now .nx-unit { font-size: 8px; letter-spacing: .12em; margin: 16px 0 14px; }
  .study-a .nx-now .nx-now-title { font-size: 72px; line-height: .9; margin-bottom: 16px; max-width: 520px; }
  .study-a .nx-now .nx-now-meta { font-size: 9px; margin-bottom: 10px; }
  .study-a .nx-now .nx-now-lede { font-size: 12px; line-height: 1.5; -webkit-line-clamp: 3; margin-bottom: 16px; max-width: 500px; }
  .study-a .nx-now .nx-now-meter { height: 4px; width: 100%; }
  .study-a .nx-now .nx-actions { margin-top: 24px; gap: 10px; }
  .study-a .nx-now .nx-btn { height: 36px; padding: 0 16px; font-size: 9px; }
  .study-a .nx-now .nx-btn.ghost { font-size: 8px; }
  .study-a .nx-now::after {
    content: '01';
    position: absolute;
    right: 30px;
    top: 20px;
    color: rgba(255, 255, 255, .045);
    font: 300 58px/1 var(--font-code);
    letter-spacing: -.08em;
    pointer-events: none;
  }
  .study-a-strip {
    position: absolute;
    left: 84px;
    bottom: 78px;
    width: 580px;
    height: 42px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: rgba(8, 12, 17, .48);
    color: var(--fg-4);
    font: 400 6.5px/1 var(--font-code);
    letter-spacing: .12em;
    text-transform: uppercase;
    -webkit-backdrop-filter: blur(18px);
    backdrop-filter: blur(18px);
  }
  .study-a-strip .units { flex: 1; display: flex; gap: 3px; height: 8px; }
  .study-a-strip .units i { flex: 1; border-radius: 2px; background: rgba(255, 255, 255, .09); }
  .study-a-strip .units i.here { background: rgba(var(--accent-rgb), .35); }
  .study-a-strip .v { color: var(--fg-2); }

  .study-b .nx-system .nx-clock { display: none; }
  .study-clock {
    position: absolute;
    left: 84px;
    top: 112px;
    width: 590px;
    padding: 18px 0 18px 28px;
    border-left: 1px solid rgba(var(--accent-rgb), .46);
    background: linear-gradient(90deg, rgba(5, 8, 12, .36), transparent 84%);
    -webkit-backdrop-filter: blur(3px);
    backdrop-filter: blur(3px);
  }
  .study-clock .sc-top {
    display: flex;
    justify-content: space-between;
    color: var(--fg-4);
    font: 400 7px/1 var(--font-code);
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  .study-clock .sc-top b { color: var(--accent); font-weight: 400; }
  .study-clock .sc-time {
    display: block;
    margin: 20px 0 0;
    color: var(--fg);
    font: 200 144px/.8 var(--font-code);
    letter-spacing: -.09em;
    font-variant-numeric: tabular-nums;
  }
  .study-clock .sc-date {
    margin-top: 18px;
    color: var(--accent);
    font: 400 10px/1 var(--font-code);
    letter-spacing: .3em;
    text-transform: uppercase;
  }
  .study-clock .sc-rule { width: 100%; height: 1px; margin: 26px 0 18px; background: var(--line); }
  .study-clock .sc-next { max-width: 470px; color: var(--fg); font: 400 28px/1.04 var(--font-serif); }
  .study-clock .sc-next span {
    display: block;
    margin-bottom: 9px;
    color: var(--fg-4);
    font: 400 7px/1 var(--font-code);
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .study-clock .sc-next em { color: var(--accent-bright); font-style: italic; }
  .study-clock .sc-note {
    margin-top: 13px;
    color: var(--fg-4);
    font: 400 8px/1.4 var(--font-code);
    letter-spacing: .04em;
  }
  .study-clock .sc-pips { display: flex; gap: 3px; margin-top: 24px; width: 100%; height: 12px; align-items: flex-end; }
  .study-clock .sc-pips i { flex: 1; height: 3px; border-radius: 2px; background: rgba(255, 255, 255, .09); }
  .study-clock .sc-pips i.here { background: rgba(var(--accent-rgb), .4); }

  .study-c .nx-course { display: none; }
  .study-path {
    position: absolute;
    left: 84px;
    top: 54px;
    width: 448px;
    padding: 14px 16px 13px;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 10px;
    background: linear-gradient(160deg, rgba(13, 17, 22, .78), rgba(5, 8, 12, .7));
    box-shadow: 0 24px 60px rgba(0, 0, 0, .28), inset 0 1px 0 rgba(255, 255, 255, .055);
    -webkit-backdrop-filter: blur(26px) saturate(1.12);
    backdrop-filter: blur(26px) saturate(1.12);
  }
  .study-path .sp-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
    color: var(--fg-4);
    font: 500 7px/1 var(--font-code);
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  .study-path .sp-head b { color: var(--fg-3); font-weight: 400; }
  .study-path .sp-sub {
    margin-bottom: 8px;
    color: var(--fg-4);
    font: 400 6.5px/1.3 var(--font-code);
    letter-spacing: .05em;
  }
  .study-path .sp-list { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
  .study-path .sp-item {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    border-top: 1px solid var(--line-2);
  }
  .study-path .sp-item:first-child { border-top-color: var(--line); }
  .study-path .sp-num {
    color: var(--fg-4);
    font: 300 9px/1 var(--font-code);
    letter-spacing: .04em;
  }
  .study-path .sp-name {
    overflow: hidden;
    color: var(--fg-3);
    font: 400 8.5px/1 var(--font-ui);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .study-path .sp-count {
    color: var(--fg-4);
    font: 400 7px/1 var(--font-code);
    letter-spacing: .03em;
  }
  .study-path .sp-item.here {
    margin: 2px -7px;
    padding: 0 7px;
    border-top-color: transparent;
    border-radius: 4px;
    background: rgba(var(--accent-rgb), .075);
  }
  .study-path .sp-item.here .sp-num { color: var(--accent); }
  .study-path .sp-item.here .sp-name { color: var(--fg); }
  .study-path .sp-item.here .sp-count { color: var(--accent); }
  .study-path .sp-foot {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
    padding-top: 9px;
    border-top: 1px solid var(--line-2);
    color: var(--fg-4);
    font: 400 6.5px/1.3 var(--font-code);
    letter-spacing: .04em;
  }
  .study-path .sp-foot b { color: var(--fg-2); font-weight: 400; }
`;

async function freshPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8925/?noboot', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector('#wall-img.on', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(250);
  return { context, page, errors };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];

  // A — the next session, large.
  {
    const { context, page, errors } = await freshPage(browser);
    await page.evaluate(() => {
      const desk = document.querySelector('.nx-desk');
      desk.classList.add('study-a');
      const now = document.querySelector('.nx-now');
      desk.appendChild(now);
      const strip = document.createElement('div');
      strip.className = 'study-a-strip';
      strip.innerHTML = `<span>course</span><div class="units">${Array.from({ length: 12 }, (_, i) => `<i class="${i === 0 ? 'here' : ''}"></i>`).join('')}</div><span class="v">0 / 52</span>`;
      desk.appendChild(strip);
    });
    await page.addStyleTag({ content: common });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'style-tiles/shots/desk-study-a.png' });
    results.push({ variant: 'a', errors });
    await context.close();
  }

  // B — the clock.
  {
    const { context, page, errors } = await freshPage(browser);
    await page.evaluate(() => {
      const desk = document.querySelector('.nx-desk');
      desk.classList.add('study-b');
      const time = document.querySelector('#dek-time')?.textContent.trim() || '--:--';
      const date = document.querySelector('#nx-date')?.textContent.trim() || '----';
      const title = document.querySelector('#nx-now-title')?.innerHTML || '';
      const meta = document.querySelector('#nx-now-meta')?.textContent.trim() || '';
      const clock = document.createElement('section');
      clock.className = 'study-clock';
      clock.setAttribute('aria-label', 'Clock and next session');
      clock.innerHTML = `
        <div class="sc-top"><span>desk / open</span><b>no session yet</b></div>
        <b class="sc-time">${time}</b>
        <div class="sc-date">${date}</div>
        <div class="sc-rule"></div>
        <div class="sc-next"><span>first stop</span>${title}</div>
        <div class="sc-note">${meta} · 12 units · one at a time</div>
        <div class="sc-pips">${Array.from({ length: 12 }, (_, i) => `<i class="${i === 0 ? 'here' : ''}"></i>`).join('')}</div>`;
      desk.appendChild(clock);
    });
    await page.addStyleTag({ content: common });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'style-tiles/shots/desk-study-b.png' });
    results.push({ variant: 'b', errors });
    await context.close();
  }

  // C — the course path.
  {
    const { context, page, errors } = await freshPage(browser);
    await page.evaluate(async () => {
      const { GROUPS, writtenLessons } = await import('/src/data/course.js');
      const { isDone } = await import('/src/core/state.js');
      const lessons = writtenLessons();
      const rows = GROUPS.map((g, i) => {
        const ls = lessons.filter(l => l.g === g.id);
        return {
          label: g.label,
          total: ls.length,
          done: ls.filter(l => isDone(l.id)).length,
          here: i === 0,
        };
      });

      const desk = document.querySelector('.nx-desk');
      desk.classList.add('study-c');
      const path = document.createElement('section');
      path.className = 'study-path';
      path.setAttribute('aria-label', 'Course path');
      path.innerHTML = `
        <div class="sp-head"><span>the course</span><b>0 / 52</b></div>
        <div class="sp-sub">12 units · the first page is waiting</div>
        <ol class="sp-list">${rows.map((r, i) => `
          <li class="sp-item${r.here ? ' here' : ''}">
            <span class="sp-num">${String(i + 1).padStart(2, '0')}</span>
            <span class="sp-name">${r.here ? 'Set up Roblox Studio' : r.label}</span>
            <span class="sp-count">${r.done} / ${r.total}</span>
          </li>`).join('')}
        </ol>
        <div class="sp-foot"><span>next · 1.0</span><b>Set up Roblox Studio · 10 min</b></div>`;
      desk.appendChild(path);
    });
    await page.addStyleTag({ content: common });
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'style-tiles/shots/desk-study-c.png' });
    results.push({ variant: 'c', errors });
    await context.close();
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
