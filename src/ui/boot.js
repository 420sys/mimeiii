/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/BOOT
   The start-up: a dark screen while the first picture of the city loads,
   then the desk fades in from black and the sign on the crane powers on
   (ui/desktop.js runs that part, on the desk clock). A cold link to a
   lesson just lifts the dark off the lesson.

   The dark waits for the desk's pictures and the fonts, never longer than
   2.5 seconds, and any key or click lifts it at once (that key does nothing
   else). `?noboot` skips it entirely (the tests and the screenshots use
   that). However it lifts, the promise resolves the same way, so what opens
   next (main.js afterBoot) never waits behind it.
   ════════════════════════════════════════════════════════════════════════════ */

import { state, save } from '../core/state.js';
import { log } from '../core/journal.js';

const MAX_WAIT = 2500;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** True when the machine should not stage the start-up at all. */
export const skipBoot = () => /[?&]noboot\b/.test(location.search);

/**
 * runBoot({ ready }) — resolves once the dark has lifted, however it lifted.
 *   ready()  a promise for "the first picture is up" (the desk's), or nothing to wait for
 * The key that lifts the dark does only that: it does not also flip the sign,
 * open a lesson or scroll one (Cmd and Ctrl shortcuts still reach the browser).
 */
export function runBoot({ ready = null } = {}) {
  return new Promise(resolve => {
    let done = false;
    const finish = why => {
      if (done) return;
      done = true;
      removeEventListener('keydown', key, true);
      removeEventListener('pointerdown', tap, true);
      state.seenBoot = true;
      state.bootedAt = state.bootedAt || Date.now();
      save();
      document.body.classList.remove('booting');
      log('ok', `[ OK ] mimei up — ${why}, effects ${document.documentElement.dataset.fx}`);
      resolve(why !== 'no start-up');
    };
    const key = e => {
      if (!e.metaKey && !e.ctrlKey) { e.preventDefault(); e.stopImmediatePropagation(); }
      finish('lifted by hand');
    };
    const tap = () => finish('lifted by hand');

    if (skipBoot()) { finish('no start-up'); return; }

    addEventListener('keydown', key, true);
    addEventListener('pointerdown', tap, true);
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    const first = ready ? Promise.resolve().then(ready).catch(() => {}) : Promise.resolve();
    Promise.race([Promise.all([fonts, first]).then(() => 'ready'), sleep(MAX_WAIT).then(() => 'still loading')])
      .then(why => finish(why === 'ready' ? 'the city is up' : 'the city is still loading'));
  });
}
