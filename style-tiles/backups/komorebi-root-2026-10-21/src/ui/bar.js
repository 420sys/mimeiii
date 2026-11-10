/* ════════════════════════════════════════════════════════════════════════════
   LUAUOS · UI/BAR
   The waybar across the top: workspaces on the left, the clock in the middle,
   and the machine's modules on the right. Every module is a real button with a
   title, a pressed state and a keyboard path — the bar is a toolbar, not
   decoration.
   ════════════════════════════════════════════════════════════════════════════ */

import { activeWs, goWorkspace, onWM, windowsOn } from '../core/wm.js';
import { progressSummary, levelOf } from '../core/state.js';
import { fxLevel, fxPreference, fxReport, setRain, rainWanted, setPeek, isPeeking, onFx, cycleFxPreference } from '../core/effects.js';
import { sound } from '../core/sound.js';
import { log, mountJournal } from '../core/journal.js';
import { repaint, onPaint, xpNum } from './window.js';
import { showGoals, showJournal } from './goals.js';
import { openLauncher } from './launcher.js';

const WS = [
  { n: 1, name: 'deck', title: 'The desktop — clock, course index, the line' },
  { n: 2, name: 'session', title: 'Reading: the course, the lesson, your goals' },
  { n: 3, name: 'man', title: 'Reference: cheatsheets as man pages' },
  { n: 4, name: 'deck ops', title: 'Wallpaper and settings' },
];

const LEVEL_WORD = ['static', 'minimal', 'balanced', 'full'];

let els = {};
let clockTimer = 0;

export function paintBar() {
  if (!els.ws) return;

  /* workspaces */
  els.ws.innerHTML = WS.map(w => {
    const open = windowsOn(w.n).length;
    const here = activeWs() === w.n;
    return `<button class="ws" data-ws="${w.n}" title="${w.title} (Alt+${w.n})"
        aria-label="Workspace ${w.n} — ${w.name}"
        ${here ? 'aria-current="page"' : ''}>
      <span class="num">${w.n}</span><span class="nm">${w.name}</span>
      ${open ? `<span class="cnt">${open}</span>` : ''}</button>`;
  }).join('');
  els.ws.querySelectorAll('.ws').forEach(b => b.onclick = () => {
    sound.click();
    goWorkspace(+b.dataset.ws);
  });

  /* rank + streak */
  const sum = progressSummary();
  const rank = levelOf(sum.xp);
  els.rank.innerHTML = `<span class="rk">${rank.name}</span><b>${xpNum(sum.xp)}</b><span class="lbl"> xp</span>`;
  els.rank.title = `${rank.name} — ${rank.blurb}. ${sum.xp} of ${sum.totalXP} XP. Click for the goals.`;
  els.streak.innerHTML = `<b>${sum.streak}</b><span class="lbl"> ${sum.streak === 1 ? 'day' : 'days'}</span>`;
  els.streak.title = `${sum.streak} ${sum.streak === 1 ? 'day' : 'days'} in a row · ${sum.done}/${sum.total} sessions finished`;

  /* machine modules */
  els.rain.setAttribute('aria-pressed', String(rainWanted()));
  const fx = fxLevel();
  const why = fxReport().reduced ? ', reduced motion'
    : fxPreference() === 'auto' ? ', chosen by the machine' : ', set by you';
  els.fx.classList.toggle('warn', fx <= 1);
  els.fx.title = `Effects: ${LEVEL_WORD[fx]} (level ${fx}${why}) — Alt+Shift+F`;
  els.fx.setAttribute('aria-label', `Effects level ${LEVEL_WORD[fx]}, click to change`);
  els.fx.style.color = fx <= 1 ? 'var(--amber)' : '';
  els.soundBtn.setAttribute('aria-pressed', String(sound.on));
  els.soundBtn.title = sound.on ? 'Sound on — click to switch off' : 'Sound off — click to switch on';
  els.peek.setAttribute('aria-pressed', String(isPeeking()));
}

export function initBar() {
  els = {
    ws: document.getElementById('workspaces'),
    clockTime: document.getElementById('clock-time'),
    clockDate: document.getElementById('clock-date'),
    rank: document.getElementById('mod-rank'),
    streak: document.getElementById('mod-streak'),
    rain: document.getElementById('mod-rain'),
    fx: document.getElementById('mod-fx'),
    soundBtn: document.getElementById('mod-sound'),
    peek: document.getElementById('mod-peek'),
  };
  if (!els.ws) return;

  const tick = document.getElementById('bar-tick');
  if (tick) mountJournal(tick);

  document.getElementById('brand').onclick = () => { sound.click(); goWorkspace(1); };
  document.getElementById('clock').onclick = () => goWorkspace(1);
  document.getElementById('mod-launch').onclick = () => openLauncher();

  els.rank.onclick = () => { sound.click(); showGoals(); };
  els.streak.onclick = () => { sound.click(); showJournal(); };

  els.rain.onclick = () => {
    setRain(!rainWanted());
    log('dim', rainWanted() ? '[ * ] rain on' : '[ * ] rain off');
    paintBar();
    repaint();
  };
  els.fx.onclick = () => {
    cycleFxPreference();
    paintBar();
  };
  els.soundBtn.onclick = () => {
    sound.set(!sound.on);
    paintBar();
  };
  els.peek.onclick = () => {
    setPeek(!isPeeking(), { focusBack: !isPeeking() });
    paintBar();
  };

  /* the clock: two lines, tabular numbers, no seconds to distract */
  const clock = () => {
    const d = new Date();
    if (els.clockTime) els.clockTime.textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (els.clockDate) els.clockDate.textContent = d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
      .toLowerCase().replace(',', '');
  };
  const scheduleClock = () => {
    clock();
    clearTimeout(clockTimer);
    const now = new Date();
    clockTimer = setTimeout(scheduleClock, (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 40);
  };
  scheduleClock();

  onWM(paintBar);
  onFx(paintBar);
  onPaint(paintBar);
  paintBar();
}
