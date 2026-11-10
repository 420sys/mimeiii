const { chromium } = require('playwright');

const css = `
  .study-d .nx-now {
    position: absolute;
    left: 84px;
    top: 16px;
    width: 590px;
    height: 330px;
    padding: 26px 30px 24px;
    border-radius: 14px;
    border-color: rgba(255, 255, 255, .12);
    background: linear-gradient(160deg, rgba(12, 18, 24, .80), rgba(5, 9, 14, .66));
    box-shadow: 0 34px 100px rgba(0, 0, 0, .36), inset 0 1px 0 rgba(255, 255, 255, .07);
    -webkit-backdrop-filter: blur(30px) saturate(1.12);
    backdrop-filter: blur(30px) saturate(1.12);
    display: grid;
    grid-template-columns: minmax(0, 1fr) 190px;
    grid-template-rows: auto auto auto auto auto auto auto auto;
    column-gap: 22px;
    align-content: start;
  }
  .study-d .nx-now > .nx-card-h { grid-column: 1 / -1; }
  .study-d .nx-now > .nx-kicker { grid-column: 1 / -1; }
  .study-d .nx-now > .nx-unit { grid-column: 1 / -1; }
  .study-d .nx-now > .nx-now-title { grid-column: 1 / -1; }
  .study-d .nx-now > .nx-now-meta { grid-column: 1; grid-row: 5; }
  .study-d .nx-now > .nx-now-lede { grid-column: 1; grid-row: 6; }
  .study-d .nx-now > .nx-now-meter { grid-column: 1; grid-row: 7; }
  .study-d .nx-now > .nx-actions { grid-column: 1; grid-row: 8; }
  .study-d .nx-now .nx-card-h { font-size: 8.5px; letter-spacing: .18em; margin-bottom: 15px; }
  .study-d .nx-now .nx-kicker { font-size: 9px; gap: 8px; }
  .study-d .nx-now .nx-unit { font-size: 8px; letter-spacing: .12em; margin: 15px 0 12px; }
  .study-d .nx-now .nx-now-title { font-size: 66px; line-height: .9; margin-bottom: 14px; max-width: 520px; }
  .study-d .nx-now .nx-now-meta { font-size: 9px; margin-bottom: 8px; }
  .study-d .nx-now .nx-now-lede { font-size: 11px; line-height: 1.45; -webkit-line-clamp: 2; margin-bottom: 12px; max-width: 500px; }
  .study-d .nx-now .nx-now-meter { height: 4px; width: 100%; }
  .study-d .nx-now .nx-actions { margin-top: 18px; gap: 10px; }
  .study-d .nx-now .nx-btn { height: 34px; padding: 0 15px; font-size: 9px; }
  .study-d .nx-now .nx-btn.ghost { font-size: 8px; }
  .study-d .nx-now::after {
    content: '01';
    position: absolute;
    right: 30px;
    top: 18px;
    color: rgba(255, 255, 255, .045);
    font: 300 56px/1 var(--font-code);
    letter-spacing: -.08em;
    pointer-events: none;
  }
  .nx-now-outline {
    grid-column: 2;
    grid-row: 5 / 9;
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin-top: 1px;
    padding-left: 19px;
    border-left: 1px solid var(--line);
  }
  .nx-now-outline .no-label {
    color: var(--fg-4);
    font: 500 6.5px/1 var(--font-code);
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .nx-now-outline .no-list {
    display: flex;
    flex-direction: column;
    margin: 7px 0 0;
    padding: 0;
    list-style: none;
  }
  .nx-now-outline .no-item {
    display: grid;
    grid-template-columns: 19px minmax(0, 1fr);
    align-items: center;
    gap: 4px;
    min-height: 20px;
    border-top: 1px solid var(--line-2);
  }
  .nx-now-outline .no-item:first-child { border-top-color: var(--line); }
  .nx-now-outline .no-n {
    color: var(--accent);
    font: 300 6px/1 var(--font-code);
    letter-spacing: .03em;
  }
  .nx-now-outline .no-t {
    overflow: hidden;
    color: var(--fg-3);
    font: 400 7.5px/1 var(--font-ui);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nx-now-outline .no-foot {
    margin-top: auto;
    padding-top: 7px;
    border-top: 1px solid var(--line-2);
    color: var(--fg-4);
    font: 400 6px/1.3 var(--font-code);
    letter-spacing: .04em;
  }

  .study-today {
    display: flex;
    flex-direction: column;
    position: absolute;
    left: 688px;
    top: 16px;
    width: 376px;
    height: 330px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 10px;
    background: linear-gradient(160deg, rgba(13, 17, 22, .78), rgba(5, 8, 12, .7));
    box-shadow: 0 24px 60px rgba(0, 0, 0, .28), inset 0 1px 0 rgba(255, 255, 255, .055);
    -webkit-backdrop-filter: blur(26px) saturate(1.12);
    backdrop-filter: blur(26px) saturate(1.12);
  }
  .study-today .td-top {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 4px 0 11px;
  }
  .study-today .td-date { display: flex; align-items: flex-end; gap: 9px; }
  .study-today .td-date b {
    color: var(--fg);
    font: 300 80px/.78 var(--font-code);
    letter-spacing: -.1em;
    font-variant-numeric: tabular-nums;
  }
  .study-today .td-date span {
    margin-bottom: 4px;
    color: var(--accent);
    font: 400 7px/1.5 var(--font-code);
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .study-today .td-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px 12px;
    margin-left: auto;
    min-width: 132px;
  }
  .study-today .td-stats div { display: flex; flex-direction: column; gap: 3px; }
  .study-today .td-stats span {
    color: var(--fg-4);
    font: 400 6px/1 var(--font-code);
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .study-today .td-stats b {
    color: var(--fg-2);
    font: 400 10px/1 var(--font-code);
    letter-spacing: .02em;
  }
  .study-today .td-week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
    margin: 7px 0 9px;
    padding-top: 10px;
    border-top: 1px solid var(--line-2);
  }
  .study-today .td-day { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .study-today .td-day em {
    color: var(--fg-4);
    font: 400 5.5px/1 var(--font-code);
    font-style: normal;
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .study-today .td-day b {
    color: var(--fg-3);
    font: 400 8px/1 var(--font-code);
    font-weight: 400;
  }
  .study-today .td-day i {
    display: block;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, .08);
  }
  .study-today .td-day.on i { background: var(--accent); box-shadow: 0 0 6px rgba(var(--accent-rgb), .25); }
  .study-today .td-day.now b { color: var(--accent); }
  .study-today .td-note {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--line-2);
    color: var(--fg-4);
    font: 400 6.5px/1.3 var(--font-code);
    letter-spacing: .04em;
  }
  .study-today .td-note b { color: var(--fg-3); font-weight: 400; }
  .study-today .td-quote {
    margin: auto 0 0;
    padding-top: 10px;
    color: var(--fg-3);
    font: 400 17px/1.1 var(--font-serif);
    letter-spacing: -.01em;
  }
  .study-today .td-quote em { color: var(--accent-bright); font-style: italic; }

  .study-path-wide {
    position: absolute;
    left: 84px;
    top: 360px;
    width: 980px;
    height: 400px;
    padding: 15px 17px 14px;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 10px;
    background: linear-gradient(160deg, rgba(13, 17, 22, .78), rgba(5, 8, 12, .7));
    box-shadow: 0 24px 60px rgba(0, 0, 0, .28), inset 0 1px 0 rgba(255, 255, 255, .055);
    -webkit-backdrop-filter: blur(26px) saturate(1.12);
    backdrop-filter: blur(26px) saturate(1.12);
  }
  .study-path-wide .sp-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--fg-4);
    font: 500 7px/1 var(--font-code);
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  .study-path-wide .sp-head b { color: var(--fg-3); font-weight: 400; }
  .study-path-wide .sp-sub {
    margin-top: 5px;
    color: var(--fg-4);
    font: 400 6.5px/1.3 var(--font-code);
    letter-spacing: .05em;
  }
  .study-path-wide .sp-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-top: 13px;
  }
  .study-path-wide .sp-unit {
    min-width: 0;
    height: 81px;
    padding: 10px 11px 9px;
    border: 1px solid var(--line-2);
    border-radius: 6px;
    background: rgba(255, 255, 255, .018);
  }
  .study-path-wide .sp-unit.here {
    border-color: rgba(var(--accent-rgb), .26);
    background: rgba(var(--accent-rgb), .06);
  }
  .study-path-wide .sp-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
  }
  .study-path-wide .sp-no {
    color: var(--fg-4);
    font: 300 11px/1 var(--font-code);
    letter-spacing: .04em;
  }
  .study-path-wide .sp-unit.here .sp-no { color: var(--accent); }
  .study-path-wide .sp-count {
    color: var(--fg-4);
    font: 400 7px/1 var(--font-code);
  }
  .study-path-wide .sp-unit.here .sp-count { color: var(--accent); }
  .study-path-wide .sp-name {
    display: block;
    margin-top: 8px;
    overflow: hidden;
    color: var(--fg-2);
    font: 400 9px/1.1 var(--font-ui);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .study-path-wide .sp-unit.here .sp-name { color: var(--fg); }
  .study-path-wide .sp-track {
    height: 2px;
    margin-top: 10px;
    border-radius: 2px;
    background: rgba(255, 255, 255, .08);
  }
  .study-path-wide .sp-track i {
    display: block;
    height: 100%;
    width: 0;
    border-radius: inherit;
    background: var(--accent);
  }
  .study-path-wide .sp-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 13px;
    padding-top: 10px;
    border-top: 1px solid var(--line-2);
    color: var(--fg-4);
    font: 400 6.5px/1.3 var(--font-code);
    letter-spacing: .05em;
  }
  .study-path-wide .sp-foot b { color: var(--fg-2); font-weight: 400; }

  .nx-queue {
    height: 400px;
    padding: 14px 13px 12px;
  }
  .nx-queue .nq-list {
    display: flex;
    flex-direction: column;
    margin-top: 10px;
  }
  .nx-queue .nq-row {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    align-items: center;
    gap: 6px;
    min-height: 44px;
    border-top: 1px solid var(--line-2);
  }
  .nx-queue .nq-row.current {
    min-height: 48px;
    margin: 0 -6px;
    padding: 0 6px;
    border-top-color: transparent;
    border-radius: 4px;
    background: rgba(var(--accent-rgb), .075);
  }
  .nx-queue .nq-n {
    color: var(--fg-4);
    font: 300 9px/1 var(--font-code);
    letter-spacing: .04em;
  }
  .nx-queue .nq-row.current .nq-n { color: var(--accent); }
  .nx-queue .nq-title {
    overflow: hidden;
    color: var(--fg-3);
    font: 400 8.5px/1.15 var(--font-ui);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nx-queue .nq-row.current .nq-title { color: var(--fg); }
  .nx-queue .nq-min {
    color: var(--fg-4);
    font: 400 6.5px/1 var(--font-code);
  }
  .nx-queue .nq-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: auto;
    padding-top: 9px;
    border-top: 1px solid var(--line-2);
    color: var(--fg-4);
    font: 400 6px/1.3 var(--font-code);
    letter-spacing: .04em;
  }
  .nx-queue .nq-foot b { color: var(--fg-2); font-weight: 400; }
`;

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('http://127.0.0.1:8925/?noboot', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForSelector('#wall-img.on', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(250);

  await page.evaluate(async () => {
    const { GROUPS, writtenLessons } = await import('/src/data/course.js');
    const { isDone, levelOf, progressSummary, state } = await import('/src/core/state.js');
    const { entries } = await import('/src/core/journal.js');

    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const lessons = writtenLessons();
    const sum = progressSummary();
    const rank = levelOf(sum.xp).name;
    const rows = GROUPS.map((g, i) => {
      const ls = lessons.filter(l => l.g === g.id);
      return {
        label: g.label,
        total: ls.length,
        done: ls.filter(l => isDone(l.id)).length,
        here: i === 0,
      };
    });

    const now = new Date();
    const todayNum = String(now.getDate()).padStart(2, '0');
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
    const month = now.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const key = d.toISOString().slice(0, 10);
      week.push({
        key,
        num: String(d.getUTCDate()).padStart(2, '0'),
        label: d.toLocaleDateString('en-GB', { weekday: 'narrow', timeZone: 'UTC' }),
        on: state.days.includes(key),
        now: i === 0,
      });
    }

    const last = document.querySelector('#nx-last')?.textContent.trim() || 'no session yet';
    const desk = document.querySelector('.nx-desk');
    desk.classList.add('study-d');

    const nowCard = document.querySelector('.nx-now');
    desk.appendChild(nowCard);

    const outline = document.createElement('div');
    outline.className = 'nx-now-outline';
    outline.innerHTML = `
      <p class="no-label">inside this stop</p>
      <ol class="no-list">
        <li class="no-item"><span class="no-n">01</span><span class="no-t">Get Studio</span></li>
        <li class="no-item"><span class="no-n">02</span><span class="no-t">The two windows</span></li>
        <li class="no-item"><span class="no-n">03</span><span class="no-t">Your first script</span></li>
        <li class="no-item"><span class="no-n">04</span><span class="no-t">Make it yours</span></li>
      </ol>
      <p class="no-foot">4 checklists · first pass</p>`;
    nowCard.appendChild(outline);

    const today = document.createElement('section');
    today.className = 'study-today';
    today.setAttribute('aria-label', 'Today and the last seven days');
    today.innerHTML = `
      <header class="nx-card-h"><span>today</span><span class="nx-live"><i></i>live</span></header>
      <div class="td-top">
        <div class="td-date"><b>${todayNum}</b><span>${weekday}<br>${month}</span></div>
        <div class="td-stats">
          <div><span>streak</span><b>${state.streak || 1} day${(state.streak || 1) === 1 ? '' : 's'}</b></div>
          <div><span>rank</span><b>${esc(rank)}</b></div>
          <div><span>finished</span><b>${sum.done} / ${sum.total}</b></div>
          <div><span>xp</span><b>${sum.xp}</b></div>
        </div>
      </div>
      <div class="td-week">${week.map(d => `
        <div class="td-day${d.on ? ' on' : ''}${d.now ? ' now' : ''}" title="${d.key}">
          <em>${d.label}</em><b>${d.num}</b><i></i>
        </div>`).join('')}
      </div>
      <div class="td-note"><span>last</span><b>${esc(last)}</b></div>
      <p class="td-quote">one session <em>at a time.</em></p>`;
    desk.appendChild(today);

    const path = document.createElement('section');
    path.className = 'study-path-wide';
    path.setAttribute('aria-label', 'Course path');
    path.innerHTML = `
      <div class="sp-head"><span>the course</span><b>12 units · ${sum.done} / ${sum.total}</b></div>
      <div class="sp-sub">the first page is waiting · no session yet</div>
      <div class="sp-grid">${rows.map((r, i) => `
        <article class="sp-unit${r.here ? ' here' : ''}">
          <div class="sp-top">
            <span class="sp-no">${String(i + 1).padStart(2, '0')}</span>
            <span class="sp-count">${r.done} / ${r.total}</span>
          </div>
          <b class="sp-name">${r.here ? 'Set up Roblox Studio' : esc(r.label)}</b>
          <div class="sp-track"><i></i></div>
        </article>`).join('')}
      </div>
      <div class="sp-foot"><span>next · 1.0</span><b>Set up Roblox Studio · 10 min</b><span>4 checkpoints</span></div>`;
    desk.appendChild(path);

    const upNext = lessons.filter(l => !isDone(l.id)).slice(0, 7);
    const queue = document.createElement('article');
    queue.className = 'nx-card nx-queue';
    queue.setAttribute('aria-label', 'Up next');
    queue.innerHTML = `
      <header class="nx-card-h"><span>queue</span><span>up next</span></header>
      <div class="nq-list">${upNext.length ? upNext.map((l, i) => `
        <div class="nq-row${i === 0 ? ' current' : ''}">
          <span class="nq-n">${l.n}</span>
          <span class="nq-title">${esc(l.title)}</span>
          <span class="nq-min">${l.mins ? l.mins + 'm' : '—'}</span>
        </div>`).join('') : '<div class="nq-row"><span class="nq-n">--</span><span class="nq-title">everything is finished.</span><span class="nq-min">—</span></div>'}
      </div>
      <div class="nq-foot"><span>${sum.done} / ${sum.total} stops</span><b>course index →</b></div>`;
    document.querySelector('.nx-widgets').appendChild(queue);
  });

  await page.addStyleTag({ content: css });
  await page.waitForTimeout(250);

  const report = await page.evaluate(() => {
    const box = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
    };
    const widgets = document.querySelector('.nx-widgets');
    return {
      page: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      now: box('.nx-now'),
      today: box('.study-today'),
      path: box('.study-path-wide'),
      system: box('.nx-system'),
      course: box('.nx-course'),
      queue: box('.nx-queue'),
      widgetScroll: [widgets.scrollHeight, widgets.clientHeight],
    };
  });

  await page.screenshot({ path: 'style-tiles/shots/desk-study-d.png' });
  console.log(JSON.stringify({ report, errors }, null, 2));
  await context.close();
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
