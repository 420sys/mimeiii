/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · DESK/LEAP
   Opening a lesson from the desk, in about a second and a half: the sign's
   action line blinks with a relay's clack, the view tips down and falls
   into the city, the dark closes over it, and the lesson fades in out of
   the dark. With reduced motion (or Still) it is only the fade.

   The curtain is a fixed element outside #desk: the desk is hidden the
   moment the lesson opens, and the curtain still has to lift off it.
   Everything runs on the desk clock (ui/desktop.js keeps it running until
   the leap has landed), so a recorded film of it is frame-exact. A real
   3D leap off the crane comes later.
   ════════════════════════════════════════════════════════════════════════════ */

import { clamp, ease, tween, wait } from './clock.js';

/**
 * leap({ world, worldEl, curtain, motion, open, dip })
 *   world    the World (for the blink), or null when the pictures never loaded
 *   worldEl  the element that tips and falls
 *   curtain  the fixed dark element over everything
 *   motion   'full' | 'calm' | 'still'
 *   open()   opens the lesson, under the curtain
 *   dip(a)   the corners' opacity (0..1), so the menu and clock leave first
 * Resolves once the lesson is showing.
 */
export async function leap({ world, worldEl, curtain, motion = 'full', open, dip = () => {} }) {
  const shade = a => { curtain.style.opacity = clamp(a).toFixed(3); };
  curtain.classList.add('on');
  try {
    if (motion === 'still' || !world) {
      await tween(.32, e => { shade(e); dip(1 - e); }, ease.sine);
      open();
      await tween(.36, e => shade(1 - e), ease.sine);
      return;
    }
    const calm = motion === 'calm';
    world.blink();
    tween(.26, e => dip(1 - e), ease.sine);
    await wait(.24);
    worldEl.style.transformOrigin = '50% 78%';
    await tween(.9, (e, k) => {
      /* the view pitches down (the city rises) and drops forward into it; the dark closes over the last third */
      const y = -e * innerHeight * (calm ? .22 : .38), s = 1 + e * (calm ? 1.1 : 2.2);
      worldEl.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
      shade((k - .45) / .5);
    }, ease.in);
    shade(1);
    open();
    worldEl.style.transform = '';
    await tween(.36, e => shade(1 - e), ease.out);
  } finally {
    shade(0);
    worldEl.style.transform = '';
    curtain.classList.remove('on');
  }
}
