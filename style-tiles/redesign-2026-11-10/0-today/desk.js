/* 0 · today. The kit with no skin: the crane's city behind today's MIMEI voice.
   It is the baseline the four directions are compared with, and the smallest
   example of what a direction supplies: a desk, a wall, and a stylesheet. */
import { boot } from '../kit/os.js';

boot({
  id: '0',
  name: 'Today',
  leapMs: 420,
  /* workspace 1: the element is the whole screen */
  desk(el, api) {
    const parts = api.deskParts(el);
    el.append(api.h('<div class="city" aria-hidden="true"></div>'), parts.sign, parts.clock, parts.brand, parts.night, parts.tools);
    api.on('leap', () => el.classList.add('is-leaping'));
    api.on('ws', n => { if (n === 1) el.classList.remove('is-leaping'); });
  },
  /* the backdrop behind workspaces 2 to 4 */
  wall(el) { el.classList.add('city-soft'); },
});
