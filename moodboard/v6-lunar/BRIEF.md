# LVNAR: redesign brief (v6, Nov 2026)

Built from 11 rounds of Q&A and two rounds of style frames. The desk comes first; the other workspaces
get redesigned later. No rules carried over from Ossuary or luauOS.

## Who it is for
- My own study space, and a portfolio piece: it can be bold, but must be polished.
- Total beginner. Goals: understand programming, then ship a Roblox game.
- Long late-night sessions, at irregular times. Recent MacBook plus a big desktop monitor.
- Never boring or plain. Wanted feel: Tokyo Ghoul, meaning grey, melancholy Tokyo streets
  (power lines, alleys, vending machines) and red spider lilies with falling petals.

## Identity
- **Name:** LVNAR ("lua" is Portuguese for moon), set in carved Roman capitals (Trajan-like, Cinzel).
- **Mark:** emblem A: a dreamy skull inside a crescent-moon halo, with a violet rose, ice-blue
  scrollwork, grunge splatter and handwritten script, drawn as a tattoo or tee-shirt illustration.
- **Type:** sharp sci-fi titles (Anta), LED numbers (Doto), mono for code and HUD micro-text,
  a script face for handwriting, and Japanese sign faces (Dela Gothic One, Shippori Mincho, DotGothic16).
- **Colour:** teal, cyan and royal blue, plus violet and hot magenta, over wet concrete greys.
  Iridescence everywhere: buttons, focus rings, progress and links. **Red** only in the spider
  lilies and petals, plus rare flashes for milestones and glitches.
- **Voice:** system messages in the HUD, a broadcaster on the screens, a coach in lessons.
- **Night/Ice:** the first visit follows the device setting; toggle in the HUD; Auto in settings.

## The desk: a plaza to hang out in
- A street-level plaza at night in a rainy Tokyo district, mixed with 2000s digital art. Balanced density.
- **Towers with personality:** dense Tokyo blocks with vertical signs and rooftop clutter, gothic
  cathedral spires with a rose window, and giant brand screens on the towers.
- **Signage:** lots of neon katakana and kanji using real words, for example 月光夜学 (moonlight night
  school), 彼岸花 (spider lily), 眠らない街 (the city that never sleeps), ルアウ (Luau), ヒント (tip).
- **Ice:** the same plaza on a silent, snowy morning: heavy snow, pastel signs, red lilies in the snow.
- **Hologram:** the LVNAR skull (rose and moon), huge, in liquid chrome with an opal oil-slick
  sheen. See-through, with scanlines, flicker, RGB split and glitch slices. Pure atmosphere; it
  pulses with the music.
- **Moon:** in the sky; its phase shows progress through the current unit.
- **Course map:** 12 LED columns around the plaza, one per unit, lighting up as you go.
- **Always visible:** the course map and the current lesson with a resume button on the main
  screen. Opening it flies into the screen, as in the current mockup.
- **Other screens:** a Luau tip or snippet of the day, and ads for invented brands
  (retro-futuristic corporations; poetic, moon-themed).
- **Explorable:** windows, signs and the moon hide things.
- **Details:** grunge splatter and ink, handwritten script, scanlines, glitch and hologram noise.
- **Game layer:** collectible skulls and badges, earned by study nights and finished lessons and units;
  unlockable cosmetics (hologram skins, HUD themes); the collection lives in a HUD corner.

## The HUD (replaces the top bar)
- A sci-fi HUD spread over all four corners: crosshairs, corner ticks, micro-text. Standard
  size, subtle motion, changes per workspace. Every item is a live widget.
- **Items:** workspaces (numbers, plus the name of the active one); streak (forgiving: study nights
  per week, opens the week); clock and date (opens today's study time and a daily goal);
  Night/Ice; settings (sound and music volume, motion and effects, Night/Ice/Auto, text size,
  reset or export progress); collection; now playing.
- **Proposed corners:** top left: skull, LVNAR, workspaces. Top right: clock, date, Night/Ice.
  Bottom left: streak and collection. Bottom right: now playing and settings.

## Sound and start-up
- Ambience: rain, wind and city hum, plus Y2K interface blips and chimes.
- Music generated live in the browser: 2000s chill-out and trance, plus lo-fi. Silent until you
  choose sound.
- LVNAR FM plays only when you press play. Interface blips start after your first click or key.
- Start-up (about 7.6 s, once per night, a night ends at 5 am): the skull is drawn in ink and
  coloured, the moon fills to tonight's phase, then the city lights up. Any key or click skips it.
  Later visits that night get only the light-up (1.6 s). Reduced motion skips it entirely.
- Plaza motion: a slow film-camera drift. Apart from that, only rain, snow and petals move.
  Settings: motion full / calm / off (auto follows the device).

## Constraints
- Static site with no build step; three.js. Smooth on a recent MacBook (quality tiers, capped
  pixel ratio); reduced motion respected; course data, sections and progress stay real.

## My calls (correct any of these)
- **Tokyo Ghoul:** mood only (streets, rain, lilies); no characters, masks or logos from the show.
- **Signs:** the painted signs are re-lettered in HTML, so the Japanese is real and can flicker;
  one sign (月光夜学) stays unlit; clicking it wakes it and reveals hidden skull 05. Brands: SELENE, NOCTURNE (ノクターン), HALCYON (ハルシオン).
- **Lilies:** red in both modes; petals drift behind the HUD and never cover text.
- **Hologram:** a soft dark halo sits behind the hologram so the see-through skull stays readable.

## Next
1. Emblem and plaza style frames (done: `proto/lunar/frame2.html`, Night and `?mode=ice`).
2. A motion prototype of the LVNAR desk: plaza, columns, chrome skull, HUD, sound, start-up, dive
   (done: `proto/lunar/desk/`, plus a 27 s film).
3. Build it into the real site (desk only), with tests, accessibility and fixes such as `studyMig`.
