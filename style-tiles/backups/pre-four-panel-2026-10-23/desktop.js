/* ════════════════════════════════════════════════════════════════════════════
   LUAUOS · UI/DESKTOP
   Workspace 1 is a desk, not a dashboard. It boots with two real tiled
   windows — a terminal and the course filesystem — and leaves the picture
   outside. Everything else in this file is furniture for the moments when
   both windows have been put away.
   ════════════════════════════════════════════════════════════════════════════ */

import { activeWs, focusWindow, openWindow } from '../core/wm.js';

let desk = null;

export function mountDesktop(el) {
  desk = el;
  if (!desk) return null;

  desk.innerHTML = `
    <div class="desk-idle" aria-hidden="true">
      <span class="di-ws">workspace 01</span>
      <span class="di-name">desk</span>
      <span class="di-line"></span>
      <span class="di-meta">luauos 1.0 · wayland · tty1</span>
    </div>`;

  // Seed the two desk windows in the saved layout without moving the learner
  // off whichever workspace they left the machine on.
  openWindow('tty', { focus: false, silent: true, reveal: false });
  openWindow('files', { focus: false, silent: true, reveal: false });

  if (activeWs() === 1) focusWindow('tty', { silent: true, takeFocus: false });
  return desk;
}

/* Kept as a no-op for older tools. */
export function stillDeck() {}
