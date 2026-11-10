/* ════════════════════════════════════════════════════════════════════════════
   LUAUOS · UI/RAIL
   The launcher rail down the left edge. One icon per window with a running
   indicator, the deck itself, and the two machine controls at the bottom.
   Clicking the focused window's icon again puts it away — the dock behaviour
   everyone already knows.

   Below 1000px the rail turns into a bottom bar (see styles/50-responsive).
   ════════════════════════════════════════════════════════════════════════════ */

import { activeWs, goWorkspace, hideWindow, isFocused, isOpen, onWM, openWindow, windowDef } from '../core/wm.js';
import { state } from '../core/state.js';
import { log } from '../core/journal.js';
import { sound } from '../core/sound.js';
import { ICONS, icon, onPaint } from './window.js';
import { openLauncher } from './launcher.js';

/* The rail's own order, which is not the same as the window registry's. */
const ITEMS = [
  { kind: 'desk', id: 'deck', icon: 'deck', title: 'The deck (Alt+1)' },
  { kind: 'win', id: 'course', icon: 'course', title: 'Course list' },
  { kind: 'win', id: 'session', icon: 'session', title: 'The lesson' },
  { kind: 'win', id: 'system', icon: 'system', title: 'Goals and journal' },
  { kind: 'win', id: 'man', icon: 'man', title: 'Manual' },
  { kind: 'win', id: 'wallpaper', icon: 'wallpaper', title: 'Wallpaper' },
  { kind: 'win', id: 'settings', icon: 'settings', title: 'Settings' },
];

let rail = null;

export function paintRail() {
  if (!rail) return;

  rail.innerHTML = '';
  for (const it of ITEMS) {
    const b = document.createElement('button');
    b.className = 'rail-btn';
    b.type = 'button';
    b.dataset.win = it.id;

    if (it.kind === 'desk') {
      const here = activeWs() === 1;
      b.classList.toggle('on', here);
      b.innerHTML = `<span class="deck-art">${ICONS.deck}</span><span class="deck-dot" aria-hidden="true"></span>`;
      b.title = `${it.title}${here ? ' — you are here' : ''}`;
      b.setAttribute('aria-pressed', String(here));
      b.onclick = () => { sound.click(); goWorkspace(1); };
    } else {
      const def = windowDef(it.id);
      const open = isOpen(it.id);
      const focused = isFocused(it.id);
      const count = it.id === 'session' ? state.tabs.length : 0;
      const sigil = count
        ? `<span class="badge" aria-hidden="true">${count}</span>` : '';
      b.innerHTML = `${ICONS[it.icon] || ICONS.deck}${sigil}`;
      b.classList.toggle('open', open);
      b.classList.toggle('focus', focused);
      b.setAttribute('aria-pressed', String(open));
      const where = def ? `workspace ${def.ws}` : '';
      b.title = `${def ? it.title : it.id} — ${open ? (focused ? 'click to put it away' : `bring it forward (${where})`) : `open (${where})`}`;
      b.setAttribute('aria-label', `${def ? it.title : it.id}${open ? ', open' : ''}`
        + `${count ? `, ${count} session${count === 1 ? '' : 's'} in tabs` : ''}`);
      b.onclick = () => {
        sound.click();
        // the dock behaviour everyone already knows: clicking the focused
        // window's icon again puts it away; anything else brings the window
        // forward — building it, or travelling to the workspace it lives on
        if (isFocused(it.id)) { hideWindow(it.id); return; }
        openWindow(it.id);
      };
    }
    rail.appendChild(b);
  }

  const spacer = document.createElement('span');
  spacer.className = 'rail-spacer';
  rail.appendChild(spacer);

  const sep = document.createElement('span');
  sep.className = 'rail-sep';
  rail.appendChild(sep);

  const keys = document.createElement('button');
  keys.className = 'rail-btn';
  keys.type = 'button';
  keys.innerHTML = icon('keys');
  keys.title = 'Keyboard shortcuts (?)';
  keys.setAttribute('aria-label', 'Keyboard shortcuts');
  keys.onclick = () => { sound.click(); openLauncher('keys'); };
  rail.appendChild(keys);

  const power = document.createElement('button');
  power.className = 'rail-btn power';
  power.type = 'button';
  power.innerHTML = ICONS.power;
  power.title = 'Power — the loud actions (clear progress, settings)';
  power.setAttribute('aria-label', 'Power menu');
  power.onclick = () => { sound.click(); log('dim', '[ ⏻ ] power menu'); openLauncher('actions'); };
  rail.appendChild(power);
}

export function initRail() {
  rail = document.getElementById('rail');
  if (!rail) return;
  rail.setAttribute('aria-label', 'Windows and the machine');
  onWM(paintRail);
  onPaint(paintRail);
  addEventListener('resize', paintRail);
  paintRail();
}
