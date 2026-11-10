/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/RICE
   The machine has one look, still called ossuary inside: the desk's. Inter and
   IBM Plex Mono, white and city blue at night, slate in Ice, and the desk's
   city behind the windows, out of focus (ui/cab.js). There is no theme picker
   and no second look — the desktop is the desk, not a poster on the wall.

   The manifest remains a table because boot still applies it and because the
   machine reports which look it is wearing in the system card.
   ════════════════════════════════════════════════════════════════════════════ */

export const RICES = [
  {
    id: 'ossuary', name: 'ossuary', tag: 'the desk',
    wall: 'city', blur: false,
    blurb: 'the desk\'s city, out of focus, behind glass',
  },
];

export const RICE_BY_ID = Object.fromEntries(RICES.map(r => [r.id, r]));
export const DEFAULT_RICE = 'ossuary';

/**
 * Put the look on the machine. `false` only means "no look by that name",
 * which the boot path uses to recover from a stored id that no longer exists.
 */
export function applyRice(id) {
  const rice = RICE_BY_ID[id];
  if (!rice) return false;
  const root = document.documentElement;
  const body = document.body;
  root.dataset.rice = id;
  body.classList.remove('curved', 'blur', 'has-sign', 'rice-change');
  return true;
}
