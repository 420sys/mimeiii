/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/WALLS
   Painting the wallpaper without ever showing a loading screen: the LQIP
   data-URI from the manifest goes up immediately (it is blurred but true),
   the real WebP fades in over it. Every wall is free.

   Animated walls carry a `still` — the first frame as its own WebP — and a
   `thumbStill` at picker size. CSS cannot pause a WebP, so when the visitor
   has asked for reduced motion the still is painted instead of the film.
   ════════════════════════════════════════════════════════════════════════════ */

import { WALLS, WALL_BY_ID } from '../data/walls.js';
import { log } from './journal.js';

export const walls = () => WALLS;
export const wallById = id => WALL_BY_ID[id] || null;

const motion = matchMedia('(prefers-reduced-motion: reduce)');

let current = null;

const img = () => document.getElementById('wall-img');
const lq = () => document.getElementById('wall-lqip');

/** Which URL a wall should paint as right now — the film, or the frozen frame. */
export function wallSrc(wall) {
  return wall.anim && wall.still && motion.matches ? wall.still : wall.src;
}

/** The picker card image, frozen at thumbnail size when motion is reduced. */
export function wallPreview(wall) {
  if (!wall.anim || !motion.matches) return wall.thumb;
  return wall.thumbStill || wall.still || wall.thumb;
}

/**
 * `fallback` is whatever the current look suggests — the wall goes on before
 * the learner has chosen one. `force` repaints even if it is already the wall
 * on screen: the motion preference changed and the same wall needs its other
 * frame.
 */
export function paintWall(id, { fallback = 'city-night', pos = null, force = false } = {}) {
  const wall = WALL_BY_ID[id] || WALL_BY_ID[fallback] || WALLS[0];
  if (!wall || (!force && current && current.id === wall.id)) return current;

  const el = img(), lqipEl = lq();
  if (!el || !lqipEl) return null;

  const src = wallSrc(wall);
  lqipEl.style.backgroundImage = `url("${wall.lqip}")`;
  lqipEl.classList.toggle('px', !!wall.px);
  lqipEl.style.opacity = '1';

  const next = new Image();
  next.decoding = 'async';
  next.src = src;
  const where = pos || wall.pos || (wall.fit === 'top' ? '50% 12%' : '50% 50%');
  lqipEl.style.setProperty('--wall-pos', where);
  next.onload = () => {
    el.src = src;
    el.classList.toggle('px', !!wall.px);
    el.classList.add('on');
    lqipEl.style.opacity = '0';
    el.style.setProperty('--wall-pos', where);
  };
  next.onerror = () => log('warn', `[ ! ] wall ${wall.id} would not load — staying on ${current ? current.id : 'the last one'}`);

  document.documentElement.dataset.wall = wall.id;
  current = wall;
  return wall;
}

export const currentWall = () => current;
