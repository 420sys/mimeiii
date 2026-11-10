/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/CAB
   Workspaces 3 and 4 are the crane's cab: the manual, the terminal, the files
   and settings on panes of glass in front of you, and the desk's city behind
   them, out of focus, in tonight's scene.

   The scene lives on <html> and <body> (data-scene: night, late or ice), so
   the cab's colours follow the desk and the study: Night and Late are dark,
   Ice is light. The wall is the soft city for that scene (assets/walls/city-*.webp,
   made by tools/assets.py), painted through core/walls.js with its LQIP.

   Nothing announces the scene: a choice is made in the desk's menu or in
   settings, and the clock turns Night into Late at 01:30
   and back at 05:00. The cab looks again whenever the workspace changes, a
   choice is made, or half a minute passes.
   ════════════════════════════════════════════════════════════════════════════ */

import { paintWall } from '../core/walls.js';
import { onWM } from '../core/wm.js';
import { sceneNow } from './desktop.js';

let shown = '';
let timer = 0;

/** The wall for a scene: the soft city of that name. */
export const cabWall = (scene = sceneNow()) => `city-${scene}`;

/** Put tonight's scene on the cab. `force` repaints the wall even if the scene has not changed. */
export function paintCab({ force = false } = {}) {
  const s = sceneNow();
  if (s === shown && !force) return s;
  shown = s;
  document.documentElement.dataset.scene = s;
  document.body.dataset.scene = s;
  /* the 未 mark in the bar and in the terminal: snow on the dark glass, slate on the light */
  const src = `assets/crane/mark-${s === 'ice' ? 'slate' : 'snow'}.webp`;
  document.querySelectorAll('#brand .ob-mark, .tty-mark').forEach(m => { if (!m.src.endsWith(src)) m.src = src; });
  paintWall(cabWall(s), { force });
  return s;
}

export function initCab() {
  paintCab();
  onWM(() => paintCab());
  timer = setInterval(() => paintCab(), 30000);
  /* a WebP cannot be paused from CSS, and a soft wall is never animated, but the motion preference
     still repaints: the same rule every wall has followed */
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => paintCab({ force: true }));
}

export function stopCab() {
  if (timer) clearInterval(timer);
  timer = 0;
}
