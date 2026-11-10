/* ════════════════════════════════════════════════════════════════════════════
   LUAUOS · UI/BAR
   The open masthead: the brand and the workspace numerals sit directly on the
   picture, aligned to the desk frame; the launcher and the window switcher are
   the only two icons on the right. There is no bar material and no second
   clock — the desk's system card owns the time.
   ════════════════════════════════════════════════════════════════════════════ */

import { activeWs, goWorkspace, onWM } from '../core/wm.js';
import { sound } from '../core/sound.js';
import { mountJournal } from '../core/journal.js';
import { onPaint } from './window.js';
import { openLauncher } from './launcher.js';

const WS = [
  { n: 1, name: 'desk', title: 'The desk — live widgets over the picture' },
  { n: 2, name: 'session', title: 'Reading: the course, the lesson, your goals' },
  { n: 3, name: 'man', title: 'Reference: cheatsheets as man pages' },
  { n: 4, name: 'settings', title: 'Wallpaper and settings' },
];

let els = {};

export function paintBar() {
  if (!els.ws) return;

  els.ws.innerHTML = WS.map(w => {
    const here = activeWs() === w.n;
    return `<button class="ws" data-ws="${w.n}" title="${w.title} (Alt+${w.n})"
        aria-label="Workspace ${w.n} — ${w.name}"
        ${here ? 'aria-current="page"' : ''}>
      <span class="num">${w.n}</span></button>`;
  }).join('');

  els.ws.querySelectorAll('.ws').forEach(b => b.onclick = () => {
    sound.click();
    goWorkspace(+b.dataset.ws);
  });

  const active = WS.find(w => w.n === activeWs());
  els.ws.dataset.active = active ? active.name : 'desk';
}

export function initBar() {
  els = { ws: document.getElementById('workspaces') };
  if (!els.ws) return;

  const tick = document.getElementById('bar-tick');
  if (tick) mountJournal(tick);

  document.getElementById('brand').onclick = () => { sound.click(); goWorkspace(1); };
  document.getElementById('mod-launch').onclick = () => openLauncher();
  document.getElementById('mod-apps').onclick = () => openLauncher('windows');

  onWM(paintBar);
  onPaint(paintBar);
  paintBar();
}
