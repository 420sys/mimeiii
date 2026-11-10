/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · DESK/SCENES
   The three pictures of the city and what goes with each: the plate, the
   hook and its wet glass, the sky and fog masks, how hard the sign blooms,
   how much rain sits on the glass, and the one weather word the corner
   shows. Kept apart from the renderer so the corner can say the weather
   before a single picture has loaded.

     night  drizzle     the evening and the night
     late   low cloud   the 3 a.m. city: Night turns into it by itself
                        between 01:30 and 05:00
     ice    snow        the other choice in the menu (remembered)
   ════════════════════════════════════════════════════════════════════════════ */

export const IMG = 'assets/crane/';

export const SCENES = {
  night: { plate: 'city-night', hook: 'hook-night', glass: 'glass-night', sky: 'mask-sky-night', bloom: 1, drops: 1, wx: 'drizzle' },
  late: { plate: 'city-late', hook: 'hook-night', glass: 'glass-night', sky: 'mask-sky-late', fog: 'mask-fog-late', bloom: 1, drops: .8, wx: 'low cloud' },
  ice: { plate: 'city-ice', hook: 'hook-ice', glass: 'glass-ice', bloom: .62, drops: .9, wx: 'snow' },
};

/** 01:30 to 05:00: the night has turned into the 3 a.m. city. */
export const isLate = d => { const m = d.getHours() * 60 + d.getMinutes(); return m >= 90 && m < 300; };

/** The scene on screen for the remembered choice ('night' or 'ice') at a moment. */
export const sceneFor = (choice, d = new Date()) => (choice === 'ice' ? 'ice' : isLate(d) ? 'late' : 'night');
