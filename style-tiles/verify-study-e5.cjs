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
    grid-template-columns: minmax(0, 1fr) 188px;
    grid-template-rows: auto auto auto auto auto auto auto auto;
    column-gap: 20px;
    align-content: start;
  }
  .study-d .nx-now > .nx-card-h { grid-column: 1 / -1; }
  .study-d .nx-now > .nx-kicker { grid-column: 1; grid-row: 2; }
  .study-d .nx-now > .nx-unit { grid-column: 1; grid-row: 3; }
  .study-d .nx-now > .nx-now-title { grid-column: 1; grid-row: 4; }
  .study-d .nx-now > .nx-now-meta { grid-column: 1; grid-row: 5; }
  .study-d .nx-now > .nx-now-lede { grid-column: 1; grid-row: 6; }
  .study-d .nx-now > .nx-now-meter { grid-column: 1; grid-row: 7; }
  .study-d .nx-now > .nx-actions { grid-column: 1; grid-row: 8; }
  .study-d .nx-now .nx-card-h { font-size: 8.5px; letter-spacing: .18em; margin-bottom: 15px; }
  .study-d .nx-now .nx-kicker { font-size: 9px; gap: 8px; }
  .study-d .nx-now .nx-unit { font-size: 8px; letter-spacing: .12em; margin: 15px 0 12px; }
  .study-d .nx-now .nx-now-title { font-size: 56px; line-height: .9; margin-bottom: 13px; max-width: 342px; }
  .study-d .nx-now .nx-now-meta { font-size: 9px; margin-bottom: 8px; }
  .study-d .nx-now .nx-now-lede { font-size: 10.5px; line-height: 1.45; -webkit-line-clamp: 3; margin-bottom: 12px; max-width: 338px; }
  .study-d .nx-now .nx-now-meter { height: 4px; width: 100%; }
  .study-d .nx-now .nx-actions { margin-top: 18px; gap: 10px; }
  .study-d .nx-now .nx-btn { height: 34px; padding: 0 15px; font-size: 9px; }
  .study-d .nx-now .nx-btn.ghost { font-size: 8px; }
  .nx-now-outline {
    grid-column: 2;
    grid-row: 2 / 9;
    display: flex;
    flex-direction: column;
    min-width: 0;
    margin-top: 3px;
    padding: 0 0 0 19px;
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
    min-height: 31px;
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
    font: 400 8px/1.1 var(--font-ui);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nx-now-outline .no-d {
    display: block;
    margin-top: 3px;
    color: var(--fg-4);
    font: 400 5.5px/1 var(--font-code);
    letter-spacing: .04em;
    text-transform: uppercase;
  }
  .nx-now-outline .no-code {
    margin: auto 0 0;
    padding: 9px 0 0;
    border-top: 1px solid var(--line-2);
    color: var(--fg-4);
    font: 400 6px/1.45 var(--font-code);
    letter-spacing: .01em;
  }
  .nx-now-outline .no-code b { color: var(--accent-bright); font-weight: 400; }
  .nx-now-outline .no-foot {
    padding-top: 7px;
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

const eCss = `
  :root[data-shell="noctalia"] {
    --wall-filter: saturate(.94) brightness(.86) contrast(1.03);
    --wall-veil: .08;
    --fg: #f3efe6;
    --fg-2: #d7dbdc;
    --fg-3: #b8c2c6;
    --fg-4: #8d9aa2;
    --line: rgba(198, 236, 255, .14);
    --line-2: rgba(198, 236, 255, .07);
  }
  :root[data-shell="noctalia"] .wall-veil {
    opacity: .62;
    background:
      linear-gradient(180deg, rgba(2, 8, 13, .46) 0%, rgba(2, 7, 11, .02) 26%, rgba(2, 7, 11, .02) 58%, rgba(2, 5, 9, .46) 100%),
      radial-gradient(ellipse at 50% 43%, transparent 0 35%, rgba(2, 7, 11, .18) 70%, rgba(2, 5, 9, .52) 100%),
      linear-gradient(118deg, rgba(24, 82, 104, .13), transparent 42%, rgba(85, 22, 76, .10));
  }
  :root[data-shell="noctalia"] .wall-noise { opacity: .048; }

  .nx-ambient {
    position: absolute;
    inset: -18%;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 18% 26%, rgba(142, 216, 255, .24), transparent 26%),
      radial-gradient(circle at 44% 70%, rgba(85, 226, 205, .13), transparent 30%),
      radial-gradient(circle at 78% 17%, rgba(244, 145, 207, .09), transparent 26%);
    filter: blur(32px) saturate(1.15);
    opacity: .92;
    animation: nxAmbient 24s ease-in-out infinite alternate;
  }
  @keyframes nxAmbient {
    from { transform: translate3d(-1.4%, -1%, 0) scale(1.03); }
    to   { transform: translate3d(1.6%, 1.6%, 0) scale(1.09); }
  }

  .study-e .nx-card,
  .study-e .study-today,
  .study-e .study-path-wide {
    border-color: rgba(185, 232, 255, .20);
    background: linear-gradient(155deg, rgba(8, 21, 29, .46), rgba(3, 8, 13, .40));
    box-shadow:
      0 30px 90px rgba(0, 0, 0, .40),
      0 0 70px rgba(142, 216, 255, .055),
      inset 0 1px 0 rgba(255, 255, 255, .10);
    -webkit-backdrop-filter: blur(32px) saturate(1.30);
    backdrop-filter: blur(32px) saturate(1.30);
  }
  .study-e .nx-card::before,
  .study-e .study-today::before,
  .study-e .study-path-wide::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 1px;
    background: linear-gradient(90deg, rgba(142, 216, 255, .58), rgba(142, 216, 255, .08) 36%, transparent 72%);
    opacity: .62;
    pointer-events: none;
  }
  .study-e .nx-card-h { font-size: 7.5px; letter-spacing: .15em; }
  .study-e .nx-now .nx-card-h { font-size: 8px; }
  .study-e .nx-now .nx-card-h #nx-now-h { color: var(--accent); }
  .study-e .study-path-wide .sp-head > span:first-child { color: var(--accent); }

  .study-e .nx-now {
    border-color: rgba(185, 232, 255, .25);
    background:
      radial-gradient(ellipse at 18% 42%, rgba(142, 216, 255, .12), transparent 52%),
      linear-gradient(150deg, rgba(10, 30, 40, .57), rgba(3, 8, 14, .46));
    box-shadow:
      0 34px 100px rgba(0, 0, 0, .44),
      0 0 90px rgba(142, 216, 255, .085),
      inset 0 1px 0 rgba(255, 255, 255, .11);
  }
  .study-e .nx-now::after {
    content: '';
    position: absolute;
    top: 14px;
    right: 14px;
    width: 29px;
    height: 29px;
    border-top: 1px solid rgba(142, 216, 255, .30);
    border-right: 1px solid rgba(142, 216, 255, .30);
    opacity: .65;
    pointer-events: none;
  }
  #desk .study-e .nx-now-title em {
    background: linear-gradient(100deg, #dff9ff 0%, #8ed8ff 48%, #58acff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 0 18px rgba(142, 216, 255, .10));
  }
  .study-e .nx-now .nx-now-lede { color: var(--fg-3); }
  .study-e .nx-now .nx-now-meter {
    background: rgba(255, 255, 255, .08);
    box-shadow: inset 0 0 0 1px rgba(142, 216, 255, .035);
  }
  .study-e .nx-now .nx-now-meter i {
    background: linear-gradient(90deg, var(--accent), #c7f4ff);
    box-shadow: 0 0 9px rgba(142, 216, 255, .36);
  }
  #desk .study-e .nx-btn.primary {
    border-color: transparent;
    background: linear-gradient(132deg, #d7f8ff 0%, #92ddff 55%, #6ec8ff 100%);
    box-shadow: 0 0 24px rgba(142, 216, 255, .22), inset 0 1px 0 rgba(255, 255, 255, .52);
  }
  .study-e .nx-now-outline { border-left-color: rgba(142, 216, 255, .18); }
  .study-e .nx-now-outline .no-label { color: var(--accent); }
  .study-e .nx-now-outline .no-code {
    padding: 8px 8px 7px;
    border: 1px solid rgba(142, 216, 255, .09);
    border-radius: 4px;
    background: rgba(0, 0, 0, .18);
  }

  #desk .study-e #dek-time {
    background: linear-gradient(180deg, #f8fdff, #b9ebff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .study-e .nx-course .nx-ring { filter: drop-shadow(0 0 9px rgba(142, 216, 255, .12)); }
  .study-e .nx-course .nx-ring-fg { filter: drop-shadow(0 0 4px rgba(142, 216, 255, .45)); }

  .study-e .study-today {
    padding: 15px 16px 14px;
    background:
      radial-gradient(ellipse at 78% 28%, rgba(142, 216, 255, .06), transparent 48%),
      linear-gradient(155deg, rgba(8, 21, 29, .46), rgba(3, 8, 13, .40));
  }
  .study-e .study-today .td-top { margin: 2px 0 8px; gap: 14px; }
  .study-e .study-today .td-date b { font-size: 74px; }
  .study-e .study-today .td-cal {
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--line-2);
  }
  .study-e .study-today .td-cal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--fg-4);
    font: 500 6.5px/1 var(--font-code);
    letter-spacing: .14em;
    text-transform: uppercase;
  }
  .study-e .study-today .td-cal-head b { color: var(--accent); font-weight: 400; }
  .study-e .study-today .td-cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px 0;
    margin-top: 5px;
  }
  .study-e .study-today .td-cal-grid .wd {
    padding-bottom: 2px;
    color: var(--fg-4);
    font: 400 5.5px/1 var(--font-code);
    letter-spacing: .06em;
    text-align: center;
    text-transform: uppercase;
  }
  .study-e .study-today .td-cal-grid .d {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 15px;
    color: var(--fg-4);
    font: 400 7px/1 var(--font-code);
    font-variant-numeric: tabular-nums;
  }
  .study-e .study-today .td-cal-grid .d.past { color: var(--fg-3); }
  .study-e .study-today .td-cal-grid .d.on::after {
    content: '';
    position: absolute;
    bottom: 1px;
    left: 50%;
    width: 3px;
    height: 3px;
    margin-left: -1.5px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 5px rgba(142, 216, 255, .4);
  }
  .study-e .study-today .td-cal-grid .d.today {
    color: var(--accent);
    font-weight: 500;
  }
  .study-e .study-today .td-cal-grid .d.today::before {
    content: '';
    position: absolute;
    inset: 1px 10px;
    border: 1px solid rgba(142, 216, 255, .34);
    border-radius: 3px;
    background: rgba(142, 216, 255, .10);
  }
  .study-e .study-today .td-weekline {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 7px;
    padding-top: 7px;
    border-top: 1px solid var(--line-2);
  }
  .study-e .study-today .td-weekline > span {
    color: var(--fg-4);
    font: 400 5.5px/1 var(--font-code);
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .study-e .study-today .td-weekline-bars {
    display: flex;
    flex: 1;
    gap: 3px;
  }
  .study-e .study-today .td-weekline-bar {
    flex: 1;
    height: 3px;
    border-radius: 2px;
    background: rgba(198, 236, 255, .10);
  }
  .study-e .study-today .td-weekline-bar.on {
    background: var(--accent);
    box-shadow: 0 0 5px rgba(142, 216, 255, .35);
  }
  .study-e .study-today .td-weekline > b {
    color: var(--fg-3);
    font: 400 6px/1 var(--font-code);
    font-weight: 400;
  }
  .study-e .study-today .td-note { padding-top: 6px; }
  .study-e .study-today .td-quote { padding-top: 7px; font-size: 16px; }

  .study-e .study-path-wide {
    padding: 15px 17px 13px;
    background:
      radial-gradient(ellipse at 50% 8%, rgba(142, 216, 255, .065), transparent 52%),
      linear-gradient(155deg, rgba(8, 21, 29, .34), rgba(3, 8, 13, .30));
  }
  .study-e .study-path-wide .sp-head { font-size: 7.5px; }
  .study-e .study-path-wide .sp-sub { color: var(--fg-3); }
  .study-e .study-path-wide .sp-map {
    position: relative;
    height: 300px;
    margin-top: 7px;
  }
  .study-e .study-path-wide .sp-map::before {
    content: '';
    position: absolute;
    inset: 2px 0;
    background-image: radial-gradient(rgba(142, 216, 255, .10) .6px, transparent .8px);
    background-size: 19px 19px;
    opacity: .35;
    -webkit-mask-image: radial-gradient(ellipse at 50% 50%, #000 0 38%, transparent 74%);
    mask-image: radial-gradient(ellipse at 50% 50%, #000 0 38%, transparent 74%);
    pointer-events: none;
  }
  .study-e .study-path-wide .sp-route-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }
  .study-e .study-path-wide .sp-route,
  .study-e .study-path-wide .sp-route-glow {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .study-e .study-path-wide .sp-route-glow {
    stroke: rgba(142, 216, 255, .28);
    stroke-width: 15;
    filter: blur(10px);
  }
  .study-e .study-path-wide .sp-route {
    stroke: url(#sp-route-gradient);
    stroke-width: 1.45;
    stroke-dasharray: 2 6;
    animation: nxRoute 18s linear infinite;
  }
  @keyframes nxRoute { to { stroke-dashoffset: -180; } }
  .study-e .study-path-wide .sp-start {
    position: absolute;
    left: 95px;
    top: 0;
    z-index: 2;
    transform: translateX(-50%);
    color: var(--accent);
    font: 400 5.5px/1 var(--font-code);
    letter-spacing: .16em;
    text-align: center;
    text-transform: uppercase;
  }
  .study-e .study-path-wide .sp-start::after {
    content: '';
    display: block;
    width: 1px;
    height: 17px;
    margin: 4px auto 0;
    background: linear-gradient(rgba(142, 216, 255, .55), transparent);
  }
  .study-e .study-path-wide .sp-node {
    position: absolute;
    z-index: 3;
    width: 158px;
    transform: translateX(-50%);
    text-align: center;
  }
  .study-e .study-path-wide .sp-dot {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin: 0 auto;
    border: 1px solid rgba(185, 232, 255, .30);
    border-radius: 50%;
    background: rgba(4, 12, 18, .92);
    box-shadow: 0 0 0 4px rgba(3, 8, 12, .50), 0 0 12px rgba(142, 216, 255, .055);
    color: var(--fg-2);
    font: 400 6.5px/1 var(--font-code);
    letter-spacing: .02em;
    transition: border-color 160ms, color 160ms, box-shadow 160ms;
  }
  .study-e .study-path-wide .sp-node.here .sp-dot {
    width: 30px;
    height: 30px;
    margin-top: -3px;
    border-color: rgba(142, 216, 255, .88);
    background: rgba(142, 216, 255, .16);
    box-shadow: 0 0 0 4px rgba(3, 8, 12, .52), 0 0 28px rgba(142, 216, 255, .32);
    color: var(--accent-bright);
  }
  .study-e .study-path-wide .sp-node.here .sp-name { color: var(--fg); }
  .study-e .study-path-wide .sp-name {
    display: block;
    margin-top: 9px;
    color: var(--fg-2);
    font: 400 9.5px/1.14 var(--font-ui);
  }
  .study-e .study-path-wide .sp-count {
    display: block;
    margin-top: 4px;
    color: var(--fg-4);
    font: 400 6px/1 var(--font-code);
    letter-spacing: .03em;
  }
  .study-e .study-path-wide .sp-node.here .sp-count { color: var(--accent); }
  .study-e .study-path-wide .sp-node.here::before {
    content: '';
    position: absolute;
    top: -12px;
    left: 50%;
    width: 48px;
    height: 48px;
    margin-left: -24px;
    border: 1px solid rgba(142, 216, 255, .12);
    border-radius: 50%;
    box-shadow: 0 0 30px rgba(142, 216, 255, .07);
    pointer-events: none;
  }
  .study-e .study-path-wide .sp-pips {
    display: flex;
    justify-content: center;
    gap: 3px;
    margin-top: 6px;
  }
  .study-e .study-path-wide .sp-pip {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(198, 236, 255, .16);
  }
  .study-e .study-path-wide .sp-pip.on {
    background: var(--accent);
    box-shadow: 0 0 4px rgba(142, 216, 255, .45);
  }
  .study-e .study-path-wide .sp-foot { margin-top: 2px; font-size: 6.5px; }
  .study-e .study-path-wide .sp-foot b { color: var(--fg); }

  .study-e .nx-queue { padding: 14px 13px 12px; }
  .study-e .nx-queue .nq-list {
    position: relative;
    padding-left: 10px;
  }
  .study-e .nx-queue .nq-list::before {
    content: '';
    position: absolute;
    top: 8px;
    bottom: 8px;
    left: 3px;
    width: 1px;
    background: linear-gradient(180deg, transparent, rgba(142, 216, 255, .24) 14%, rgba(142, 216, 255, .10) 86%, transparent);
  }
  .study-e .nx-queue .nq-row {
    position: relative;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    gap: 5px;
    border-top-color: rgba(198, 236, 255, .055);
  }
  .study-e .nx-queue .nq-row::after {
    content: '';
    position: absolute;
    top: 50%;
    left: -11px;
    width: 5px;
    height: 5px;
    margin-top: -2.5px;
    border: 1px solid rgba(142, 216, 255, .30);
    border-radius: 50%;
    background: var(--surface-solid);
  }
  .study-e .nx-queue .nq-row.current {
    border-left: 1px solid rgba(142, 216, 255, .40);
    background: linear-gradient(90deg, rgba(142, 216, 255, .10), rgba(142, 216, 255, .025));
    box-shadow: inset 2px 0 0 rgba(142, 216, 255, .16);
  }
  .study-e .nx-queue .nq-row.current::after {
    border-color: var(--accent);
    background: var(--accent);
    box-shadow: 0 0 8px rgba(142, 216, 255, .50);
  }
  .study-e .nx-queue .nq-title { font-size: 9.5px; color: var(--fg-2); }
  .study-e .nx-queue .nq-n { font-size: 9.5px; }
  .study-e .nx-queue .nq-min { color: var(--fg-4); font-size: 7px; }

  @media (prefers-reduced-motion: reduce) {
    .nx-ambient { animation: none; }
    .study-e .study-path-wide .sp-route { animation: none; }
  }
`;

const e2Css = `
  body.study-e2-shell #rail { display: none; }
  body.study-e2-shell #shell { grid-template-columns: 1fr; }
  .study-e2 .nx-widgets { right: 85px; }
  .study-e2 .nx-now { left: 86px; }
  .study-e2 .study-today { left: 690px; }
  .study-e2 .study-path-wide { left: 86px; }
  .study-e2 .nx-foot { left: 86px; right: 85px; }

  #bar .apps {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    margin-left: 3px;
    padding: 0 7px;
    border: 1px solid transparent;
    border-radius: 3px;
    color: var(--fg-4);
    font: 500 6.5px/1 var(--font-code);
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  #bar .apps svg { width: 12px; height: 12px; }
  #bar .apps:hover {
    color: var(--fg);
    background: rgba(255, 255, 255, .045);
    border-color: var(--line-2);
  }
  #bar .apps:focus-visible {
    border-color: rgba(142, 216, 255, .35);
    color: var(--accent);
  }
  @media (max-width: 1000px) {
    body.study-e2-shell #rail { display: flex; }
    #bar .apps { display: none; }
  }
`;

const e3Css = `
  body.study-e3-shell #bar {
    padding: 0 18px;
    background: linear-gradient(180deg, rgba(4, 10, 15, .78), rgba(4, 9, 14, .54));
    border-bottom-color: rgba(198, 236, 255, .11);
    box-shadow: 0 1px 0 rgba(142, 216, 255, .025);
    -webkit-backdrop-filter: blur(26px) saturate(1.25);
    backdrop-filter: blur(26px) saturate(1.25);
  }
  body.study-e3-shell #bar .bar-l { gap: 10px; }
  body.study-e3-shell #bar .bar-r { gap: 6px; }
  body.study-e3-shell #bar .bar-mode { display: none; }
  body.study-e3-shell #bar .brand { padding-right: 2px; }
  body.study-e3-shell #bar .brand-name { font-size: 9px; letter-spacing: .2em; }
  body.study-e3-shell #bar #workspaces {
    gap: 2px;
    margin-left: 2px;
    padding-left: 12px;
    border-left-color: rgba(198, 236, 255, .11);
  }
  body.study-e3-shell #bar #workspaces::after {
    content: attr(data-active);
    margin-left: 6px;
    padding-left: 10px;
    border-left: 1px solid var(--line-2);
    color: var(--fg-4);
    font: 500 6.5px/1 var(--font-code);
    letter-spacing: .15em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  body.study-e3-shell #bar .ws {
    min-width: 23px;
    height: 23px;
    padding: 0;
    border-radius: 3px;
    font-size: 8px;
  }
  body.study-e3-shell #bar .ws .nm { display: none !important; }
  body.study-e3-shell #bar .ws[aria-current="page"] {
    background: rgba(142, 216, 255, .13);
    border-color: rgba(142, 216, 255, .34);
    color: var(--accent-bright);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .12), 0 0 12px rgba(142, 216, 255, .07);
  }
  body.study-e3-shell #bar .ws[aria-current="page"]:hover {
    background: rgba(142, 216, 255, .19);
    color: var(--accent-bright);
  }
  body.study-e3-shell #bar .bar-c .clock {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    height: 30px;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 3px;
  }
  body.study-e3-shell #bar .bar-c .clock:hover {
    border-color: var(--line-2);
    background: rgba(255, 255, 255, .035);
  }
  body.study-e3-shell #bar #clock-time {
    color: var(--fg);
    font: 400 11px/1 var(--font-mono, var(--font-code));
    font-variant-numeric: tabular-nums;
    letter-spacing: .015em;
  }
  body.study-e3-shell #bar #clock-date {
    color: var(--fg-4);
    font: 500 6px/1 var(--font-code);
    letter-spacing: .16em;
    text-transform: uppercase;
  }
  body.study-e3-shell #bar .stat,
  body.study-e3-shell #bar .bar-r > .bar-sep { display: none; }
  body.study-e3-shell #bar #mod-rain,
  body.study-e3-shell #bar #mod-fx,
  body.study-e3-shell #bar #mod-sound,
  body.study-e3-shell #bar #mod-peek { display: none; }
  body.study-e3-shell #bar .stat {
    padding: 0 4px;
    border-radius: 3px;
  }
  body.study-e3-shell #bar .stat .rk { color: var(--fg-4); }
  body.study-e3-shell #bar .stat b { color: var(--fg-2); }
  body.study-e3-shell #bar .bar-r > .bar-sep { margin: 0 3px; }
  body.study-e3-shell #bar .apps {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 3px;
    color: var(--fg-4);
  }
  body.study-e3-shell #bar .apps svg { width: 12px; height: 12px; }
  body.study-e3-shell #bar .apps:hover {
    color: var(--accent);
    background: rgba(142, 216, 255, .08);
  }
  body.study-e3-shell #bar .launch {
    height: 24px;
    margin-left: 2px;
    padding: 0 4px;
    border-radius: 3px;
    color: var(--fg-2);
  }
  body.study-e3-shell #bar .launch kbd { margin-left: 1px; }
`;

const e4Css = `
  body.study-e4-shell #bar {
    background:
      linear-gradient(180deg, rgba(206, 236, 248, .34) 0%, rgba(115, 151, 168, .22) 48%, rgba(36, 58, 71, .22) 100%),
      rgba(43, 64, 76, .78);
    border-bottom-color: rgba(211, 243, 255, .38);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, .28),
      0 1px 0 rgba(210, 242, 255, .12),
      0 10px 30px rgba(2, 8, 12, .14);
    -webkit-backdrop-filter: blur(30px) saturate(.8) brightness(1.12);
    backdrop-filter: blur(30px) saturate(.8) brightness(1.12);
  }
  body.study-e4-shell #bar::before {
    content: '';
    position: absolute;
    inset: 0 0 auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(224, 247, 255, .38) 22%, rgba(224, 247, 255, .12) 78%, transparent);
    pointer-events: none;
  }
  body.study-e4-shell #bar .brand { color: #f4fbff; }
  body.study-e4-shell #bar .brand-name { color: #f4fbff; }
  body.study-e4-shell #bar .brand .seal {
    background: #d3f2ff;
    color: #06131a;
    box-shadow:
      0 0 18px rgba(142, 216, 255, .30),
      inset 0 1px 0 rgba(255, 255, 255, .80);
  }
  body.study-e4-shell #bar #workspaces {
    border-left-color: rgba(224, 247, 255, .22);
  }
  body.study-e4-shell #bar .ws { color: #c4d9e5; }
  body.study-e4-shell #bar .ws:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, .13);
  }
  body.study-e4-shell #bar .ws[aria-current="page"] {
    background: #ccefff;
    border-color: transparent;
    color: #06131a;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, .85),
      0 0 14px rgba(142, 216, 255, .26);
  }
  body.study-e4-shell #bar .ws[aria-current="page"]:hover {
    background: #e3f8ff;
    color: #06131a;
  }
  body.study-e4-shell #bar #workspaces::after {
    color: #d1e7f2;
    border-left-color: rgba(224, 247, 255, .22);
  }
  body.study-e4-shell #bar .bar-c .clock:hover {
    border-color: rgba(255, 255, 255, .16);
    background: rgba(255, 255, 255, .08);
  }
  body.study-e4-shell #bar #clock-time { color: #ffffff; }
  body.study-e4-shell #bar #clock-date { color: #c7e0eb; }
  body.study-e4-shell #bar .apps { color: #d7eaf3; }
  body.study-e4-shell #bar .apps:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, .13);
  }
  body.study-e4-shell #bar .launch { color: #e9f7fd; }
  body.study-e4-shell #bar .launch:hover { background: rgba(255, 255, 255, .13); }
  body.study-e4-shell #bar .launch kbd {
    color: #eaf8ff;
    border-color: rgba(255, 255, 255, .22);
    background: rgba(255, 255, 255, .10);
  }
  body.study-e4-shell #bar .launch svg { color: #d7eaf3; }
`;

const e5Css = `
  /* E5 · course map v2: one crisp route, station nodes, no per-node noise */
  .study-e5 .study-path-wide {
    background:
      radial-gradient(ellipse at 50% -12%, rgba(142, 216, 255, .055), transparent 58%),
      linear-gradient(160deg, rgba(9, 22, 30, .56), rgba(3, 8, 13, .50));
  }
  .study-e5 .study-path-wide .sp-map { height: 300px; margin-top: 7px; }
  .study-e5 .study-path-wide .sp-map::before {
    content: '';
    position: absolute;
    inset: 2px 0;
    background-image:
      linear-gradient(rgba(142, 216, 255, .075) 1px, transparent 1px),
      linear-gradient(90deg, rgba(142, 216, 255, .075) 1px, transparent 1px);
    background-size: 41px 41px;
    opacity: .55;
    -webkit-mask-image: radial-gradient(ellipse at 50% 52%, #000 0 34%, transparent 74%);
    mask-image: radial-gradient(ellipse at 50% 52%, #000 0 34%, transparent 74%);
    pointer-events: none;
  }
  .study-e5 .study-path-wide .sp-flow {
    fill: none;
    stroke: rgba(142, 216, 255, .38);
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .study-e5 .study-path-wide .sp-route-cap {
    fill: none;
    stroke: rgba(142, 216, 255, .34);
    stroke-width: 1.4;
    stroke-linecap: round;
  }
  .study-e5 .study-path-wide .sp-end { fill: rgba(142, 216, 255, .46); }
  .study-e5 .study-path-wide .sp-start {
    top: 2px;
    color: rgba(142, 216, 255, .78);
    font-size: 5.5px;
    letter-spacing: .20em;
  }
  .study-e5 .study-path-wide .sp-start::after {
    height: 13px;
    background: linear-gradient(rgba(142, 216, 255, .40), transparent);
  }
  .study-e5 .study-path-wide .sp-route-glow { display: none; }
  .study-e5 .study-path-wide .sp-route {
    stroke: url(#sp-route-gradient);
    stroke-width: 1.5;
    stroke-dasharray: none;
    animation: none;
    filter: drop-shadow(0 0 5px rgba(142, 216, 255, .13));
  }
  .study-e5 .study-path-wide .sp-node { width: 158px; }
  .study-e5 .study-path-wide .sp-dot {
    width: 26px;
    height: 26px;
    border: 1px solid rgba(185, 232, 255, .30);
    background: rgba(4, 12, 18, .95);
    box-shadow: 0 0 0 3px rgba(3, 8, 12, .55);
    color: var(--fg-3);
    font: 400 7px/1 var(--font-code);
    letter-spacing: .02em;
  }
  .study-e5 .study-path-wide .sp-node:hover .sp-dot {
    border-color: rgba(185, 232, 255, .62);
    color: var(--fg);
  }
  .study-e5 .study-path-wide .sp-node:hover .sp-name { color: var(--fg-2); }
  .study-e5 .study-path-wide .sp-node.here .sp-dot {
    width: 30px;
    height: 30px;
    margin-top: -2px;
    border-color: rgba(142, 216, 255, .98);
    background: rgba(142, 216, 255, .22);
    box-shadow:
      0 0 0 3px rgba(3, 8, 12, .62),
      0 0 0 6px rgba(142, 216, 255, .12),
      0 0 16px rgba(142, 216, 255, .26);
    color: var(--accent-bright);
  }
  .study-e5 .study-path-wide .sp-node.here::before { display: none; }
  .study-e5 .study-path-wide .sp-name {
    margin-top: 10px;
    color: var(--fg-2);
    font: 400 9.5px/1.16 var(--font-ui);
    white-space: normal;
  }
  .study-e5 .study-path-wide .sp-node.here .sp-name { color: var(--fg); }
  .study-e5 .study-path-wide .sp-node.done .sp-dot {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--accent-ink);
    box-shadow: 0 0 0 3px rgba(3, 8, 12, .55), 0 0 12px rgba(142, 216, 255, .18);
  }
  .study-e5 .study-path-wide .sp-count,
  .study-e5 .study-path-wide .sp-pips { display: none; }
  .study-e5 .study-path-wide .sp-foot { margin-top: 4px; }
`;

const TYPE = process.env.TYPE || 'p1';
const typeCss = {
  mono: '',
  geist: `
    @font-face {
      font-family: 'Geist';
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url('/assets/fonts/geist.woff2') format('woff2');
    }
    :root[data-shell="noctalia"] {
      --font-ui: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-code: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-serif: 'Instrument Serif', Georgia, 'Times New Roman', serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    #clock-time, #desk .nx-clock b, #desk .td-date b, #desk .nx-now-outline .no-n,
    #desk .nx-now-outline .no-code, #desk .nx-queue .nq-min { font-family: var(--font-mono); }
    #desk .nx-now-outline .no-code { letter-spacing: -.02em; }
  `,

  p1: `
    @font-face {
      font-family: 'Space Grotesk';
      font-style: normal;
      font-weight: 300 700;
      font-display: swap;
      src: url('/assets/fonts/space-grotesk.woff2') format('woff2');
    }
    :root[data-shell="noctalia"] {
      --font-ui: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-code: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-serif: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    #clock-time, #desk .nx-clock b, #desk .td-date b, #desk .nx-now-outline .no-n,
    #desk .nx-now-outline .no-code, #desk .nx-queue .nq-min { font-family: var(--font-mono); }
    #desk .nx-now-title { font-size: 48px; font-weight: 600; letter-spacing: -.06em; line-height: .9; }
    #desk .nx-now-title em { font-style: normal; font-weight: 600; color: var(--accent-bright); }
    #desk .nx-now-lede { font-family: var(--font-ui); }
  `,
  p2: `
    @font-face {
      font-family: 'IBM Plex Sans';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/assets/fonts/ibm-plex-sans-400-normal.woff2') format('woff2');
    }
    @font-face {
      font-family: 'IBM Plex Sans';
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: url('/assets/fonts/ibm-plex-sans-500-normal.woff2') format('woff2');
    }
    @font-face {
      font-family: 'IBM Plex Sans';
      font-style: normal;
      font-weight: 600;
      font-display: swap;
      src: url('/assets/fonts/ibm-plex-sans-600-normal.woff2') format('woff2');
    }
    @font-face {
      font-family: 'IBM Plex Mono';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/assets/fonts/ibm-plex-mono-400-normal.woff2') format('woff2');
    }
    @font-face {
      font-family: 'IBM Plex Mono';
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: url('/assets/fonts/ibm-plex-mono-500-normal.woff2') format('woff2');
    }
    :root[data-shell="noctalia"] {
      --font-ui: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-code: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-serif: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    #clock-time, #desk .nx-clock b, #desk .td-date b, #desk .nx-now-outline .no-n,
    #desk .nx-now-outline .no-code, #desk .nx-queue .nq-min { font-family: var(--font-mono); }
    #desk .nx-now-title { font-size: 47px; font-weight: 600; letter-spacing: -.045em; line-height: .92; }
    #desk .nx-now-title em { font-style: normal; font-weight: 600; color: var(--accent-bright); }
    #desk .nx-now-lede { font-family: var(--font-ui); }
  `,
  p3: `
    @font-face {
      font-family: 'Sora';
      font-style: normal;
      font-weight: 300 700;
      font-display: swap;
      src: url('/assets/fonts/sora.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Newsreader';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: url('/assets/fonts/newsreader-normal.woff2') format('woff2');
    }
    @font-face {
      font-family: 'Newsreader';
      font-style: italic;
      font-weight: 400;
      font-display: swap;
      src: url('/assets/fonts/newsreader-italic.woff2') format('woff2');
    }
    :root[data-shell="noctalia"] {
      --font-ui: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-code: 'Sora', -apple-system, BlinkMacSystemFont, sans-serif;
      --font-serif: 'Newsreader', Georgia, serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    #clock-time, #desk .nx-clock b, #desk .td-date b, #desk .nx-now-outline .no-n,
    #desk .nx-now-outline .no-code, #desk .nx-queue .nq-min { font-family: var(--font-mono); }
    #desk .nx-now-title { font-size: 56px; font-weight: 400; letter-spacing: -.015em; line-height: .9; }
    #desk .nx-now-title em { font-family: 'Newsreader'; font-style: italic; color: var(--accent-bright); }
    #desk .nx-now-lede { font-family: var(--font-ui); }
  `,
  sans: `
    @font-face {
      font-family: 'Geist';
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url('/assets/fonts/geist.woff2') format('woff2');
    }
    :root[data-shell="noctalia"] {
      --font-ui: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-code: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-serif: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    #clock-time, #desk .nx-clock b, #desk .td-date b, #desk .nx-now-outline .no-n,
    #desk .nx-now-outline .no-code, #desk .nx-queue .nq-min { font-family: var(--font-mono); }
    #desk .nx-now-title { font-size: 48px; font-weight: 650; letter-spacing: -.06em; line-height: .9; }
    #desk .nx-now-title em { font-style: normal; font-weight: 650; color: var(--accent-bright); }
    #desk .nx-now-lede { font-family: var(--font-ui); }
    #desk .nx-now-outline .no-code { letter-spacing: -.02em; }
  `,
};

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
        dots: ls.map(l => isDone(l.id)),
        here: i === 0,
      };
    });

    const now = new Date();
    const todayNum = String(now.getDate()).padStart(2, '0');
    const weekday = now.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
    const month = now.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const monthLabel = now.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    const first = new Date(year, monthIndex, 1);
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push({ blank: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        d,
        key,
        on: state.days.includes(key),
        past: d < now.getDate(),
        today: d === now.getDate(),
      });
    }
    while (cells.length % 7) cells.push({ blank: true });
    const weekDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(year, monthIndex, now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      weekDays.push({ key, on: state.days.includes(key) });
    }

    const last = document.querySelector('#nx-last')?.textContent.trim() || 'no session yet';
    const desk = document.querySelector('.nx-desk');
    desk.classList.add('study-d', 'study-e', 'study-e2', 'study-e3', 'study-e5');
    document.body.classList.add('study-e2-shell', 'study-e3-shell', 'study-e4-shell');
    const ambient = document.createElement('div');
    ambient.className = 'nx-ambient';
    ambient.setAttribute('aria-hidden', 'true');
    desk.prepend(ambient);

    const barRight = document.querySelector('#bar .bar-r');
    const clock = document.getElementById('clock');
    const time = document.getElementById('clock-time');
    if (clock && time) clock.prepend(time);
    const workspaces = document.getElementById('workspaces');
    const activeName = workspaces?.querySelector('.ws[aria-current="page"] .nm')?.textContent.trim() || 'desk';
    if (workspaces) workspaces.dataset.active = activeName.toLowerCase();
    if (barRight) {
      const seps = [...barRight.querySelectorAll('.bar-sep')];
      if (seps.length > 1) seps[seps.length - 1].remove();
      const apps = document.createElement('button');
      apps.id = 'mod-apps';
      apps.className = 'mod apps';
      apps.type = 'button';
      apps.title = 'Apps — open the window switcher (Alt+Enter, Tab)';
      apps.setAttribute('aria-label', 'Apps');
      apps.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>`;
      apps.onclick = async () => {
        const { openLauncher } = await import('/src/ui/launcher.js');
        openLauncher('windows');
      };
      barRight.insertBefore(apps, document.getElementById('mod-launch'));
    }

    const nowCard = document.querySelector('.nx-now');
    desk.appendChild(nowCard);
    const heroTitle = nowCard.querySelector('#nx-now-title');
    if (heroTitle) heroTitle.innerHTML = 'Set up<br><em>Roblox Studio.</em>';

    const outline = document.createElement('div');
    outline.className = 'nx-now-outline';
    outline.innerHTML = `
      <p class="no-label">inside this stop</p>
      <ol class="no-list">
        <li class="no-item"><span class="no-n">01</span><span><span class="no-t">Get Studio</span><span class="no-d">install · sign in</span></span></li>
        <li class="no-item"><span class="no-n">02</span><span><span class="no-t">Two windows</span><span class="no-d">explorer · output</span></span></li>
        <li class="no-item"><span class="no-n">03</span><span><span class="no-t">First script</span><span class="no-d">print · play</span></span></li>
        <li class="no-item"><span class="no-n">04</span><span><span class="no-t">Make it yours</span><span class="no-d">edit · see it</span></span></li>
      </ol>
      <p class="no-code">> <b>print("Hello world!")</b><br><span>Hello world! — Server · Script:1</span></p>
      <p class="no-foot">4 checklists · ~10 min</p>`;
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
      <div class="td-cal">
        <div class="td-cal-head"><span>${monthLabel} ${year}</span><b>${state.days.length ? 'activity' : 'quiet month'}</b></div>
        <div class="td-cal-grid">
          <span class="wd">M</span><span class="wd">T</span><span class="wd">W</span><span class="wd">T</span><span class="wd">F</span><span class="wd">S</span><span class="wd">S</span>
          ${cells.map(c => c.blank ? '<span class="d blank"></span>' : `<span class="d${c.on ? ' on' : ''}${c.past ? ' past' : ''}${c.today ? ' today' : ''}" title="${c.key}">${c.d}</span>`).join('')}
        </div>
      </div>
      <div class="td-weekline">
        <span>this week</span>
        <div class="td-weekline-bars">${weekDays.map(d => `<i class="td-weekline-bar${d.on ? ' on' : ''}" title="${d.key}"></i>`).join('')}</div>
        <b>${weekDays.filter(d => d.on).length} / 7</b>
      </div>
      <div class="td-note"><span>last</span><b>${esc(last)}</b></div>
      <p class="td-quote">one session <em>at a time.</em></p>`;
    desk.appendChild(today);

    const path = document.createElement('section');
    path.className = 'study-path-wide';
    path.setAttribute('aria-label', 'Course path');
    const cols = [95, 345, 595, 845];
    const yRows = [46, 151, 256];
    const routeOrder = [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11];
    const nodes = routeOrder.map((unitIndex, i) => ({
      ...rows[unitIndex],
      x: cols[i % 4],
      y: yRows[Math.floor(i / 4)],
      n: unitIndex + 1,
    }));
    path.innerHTML = `
      <div class="sp-head"><span>the course</span><b>12 units · ${sum.done} / ${sum.total}</b></div>
      <div class="sp-sub">the first page is waiting · one line through the language</div>
      <div class="sp-map">
        <span class="sp-start">start</span>
        <svg class="sp-route-svg" viewBox="0 0 946 300" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sp-route-gradient" gradientUnits="userSpaceOnUse" x1="95" y1="46" x2="845" y2="256">
              <stop offset="0" stop-color="rgba(142,216,255,.60)"></stop>
              <stop offset=".30" stop-color="rgba(142,216,255,.48)"></stop>
              <stop offset=".64" stop-color="rgba(142,216,255,.40)"></stop>
              <stop offset="1" stop-color="rgba(142,216,255,.32)"></stop>
            </linearGradient>
          </defs>
          <path class="sp-route" d="M 95 46 H 845 Q 875 46 875 76 V 121 Q 875 151 845 151 H 95 Q 65 151 65 181 V 226 Q 65 256 95 256 H 845"></path>
          <path class="sp-flow" d="M 466 41 l 6 5 l -6 5"></path>
          <path class="sp-flow" d="M 474 146 l -6 5 l 6 5"></path>
          <path class="sp-flow" d="M 466 251 l 6 5 l -6 5"></path>
        </svg>
        ${nodes.map(d => `
          <div class="sp-node${d.here ? ' here' : ''}${d.done === d.total && d.total ? ' done' : ''}" style="left:${d.x}px;top:${d.y - 13}px" title="${esc(d.label)} — ${d.done}/${d.total} checkpoints">
            <span class="sp-dot">${String(d.n).padStart(2, '0')}</span>
            <span class="sp-name">${esc(d.label)}</span>
          </div>`).join('')}
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

  await page.addStyleTag({ content: css + typeCss[TYPE] + eCss + e2Css + e3Css + e4Css + e5Css });
  await page.evaluate(() => document.fonts.ready);
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

  await page.screenshot({ path: 'style-tiles/shots/desk-study-e5.png' });
  console.log(JSON.stringify({ report, errors }, null, 2));
  await context.close();
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
