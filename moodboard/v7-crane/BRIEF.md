# MIMEI 未: redesign brief (v7 crane, Nov 2026)

Built from 10 rounds of Q&A, a name and mark board, three still frames, one round of feedback
on those frames, and then the first motion prototype (this version). It replaces v6 LVNAR
completely: nothing carries over.

## Who it is for
- My own study space, and a portfolio piece: it can be bold, but it must be polished.
- Total beginner. Goals: understand programming, then ship a Roblox game.
- Long late-night sessions on a recent MacBook (16:10). There is no big monitor, so there is
  no ultrawide (21:9) version.

## The idea
You study on the arm of a construction crane, very high above a night city. You see it through
your own eyes; there is no figure. The feel is calm and a bit melancholy, but cozy and safe.
Tokyo Ghoul is the mood only. Nothing extra is added for coziness: the view is enough.
**The city is the picture.** Everything else stays small and quiet.

## Identity
- **Name:** **MIMEI 未明** (“not yet light”, the small hours before dawn). Decided.
- **Mark:** the single kanji 未 in brush and ink. White on Night, slate on Ice.
- **Colour:** no accent colour. The city is cool blue-white and the UI is white (slate on Ice).
  Warm `#FFB46B` is only for light close to you (on the railing). Red `#FF3B30` is only for the
  aviation beacons on the towers. There is no violet or lavender anywhere: not in the UI, the
  screen, the city or effects.
- **Type:** Inter for the clock, IBM Plex Mono for small labels, and an LED dot-matrix font on
  the sign. Japanese appears only in the mark.
- **Language:** English. Unit titles are English only.
- **Moon:** small and far away, in the scene.

## The view (the desk)
- **Camera:** on the crane arm, between a straight-ahead and a downward view: the horizon sits
  high and the streets are below. Very high, with low cloud on some nights. A slow drift, like
  a film camera.
- **City:** Tokyo with gothic cathedral spires, and an endless sea of lights to the horizon.
  Painted at 4K (3840 × 2160) and sharp on a Retina MacBook. Nothing is drawn over it: no markers,
  no lit districts, no labels.
- **Foreground:** the hook and its sign, small and off to the upper left, plus the walkway
  railing at the bottom edge.
- **Motion (gentle):** trains on raised tracks, slow red beacons on the towers, streams of car
  lights, planes and sometimes a helicopter searchlight, crows below you, and steam from
  rooftops. No fireworks.
- **Weather:** it changes each night. Mostly drizzle, sometimes clear, sometimes low cloud.
- **Real clock:** fewer lit windows late at night, a last train, and blue light before dawn.
- **Ice:** the same view on a silent snowy morning (the Night/Ice toggle).

## The hook and the sign
- **Hook:** a heavy, real hook block: dark gunmetal painted steel with worn edges and rust,
  bolts, a big sheave, and a forged hook with a safety latch. Two wire ropes come down from
  above, and two chains hang the sign from the hook.
- **Weather on the steel:** soaking wet with drips in drizzle (Night), damp after the rain
  (Late), and frosted with fresh snow and small icicles (Ice).
- **Sign:** an old riveted LED sign: 92 × 39 white diodes behind dark glass. The text is white
  with a soft glow, lit on the sign's own grid, and the rain on the glass catches the light.
- **Text:** up to four short lines, centred like a marquee. Labels are in capitals, and Luau
  code is in lower case (`and, or, not`, `for i = 1, 10 do`). The top line is dimmer, the
  title is brightest.
  - Lesson: `DECISIONS · 3.3` / `and, or, not` / `CHECKPOINT 1/4` / `▶ RESUME · 15 MIN`
  - Unit finished: `UNIT III` / `COMPLETE` / `NEXT · IV LOOPS`
  - New unit: `LOOPS · 4.1` / `COUNTING WITH` / `for i = 1, 10 do` / `▶ BEGIN · 20 MIN`
- **Long text scrolls.** A line that is too wide for the sign waits 2.6 seconds, scrolls left
  at 20 dots a second and loops with a gap. After three loops it rests for 18 seconds, then
  starts again. Short lines stay still and centred. With reduced motion, long lines flip
  word by word instead of scrolling.

## The course
- 12 units. The course is shown only on the sign; there is no progress in the city.
- **Milestones:** only the sign changes, with a calm “unit complete” message. Nothing else
  happens.
- **Entering a lesson:** the leap. The camera drops off the crane and dives into the city.
  With reduced motion, it fades instead.

## The HUD
- **On screen:** only the weather, clock and date, top right.
- **Hidden menu:** everything else appears when you move the mouse (and fades out after about
  2.5 seconds), or with Esc:
  - top left: the 未 mark, MIMEI and workspaces 01–04;
  - bottom left: tonight's goal and study nights this week;
  - bottom right: sound, the Night/Ice toggle and settings.
- There are no crane readouts, compass, corner brackets or checkpoint markers. There is no
  music player.

## Secrets
- A stranger on another rooftop, gone the next time you look.
- An unlit sign you can wake (like 月光夜学, “moonlight night school”).
- Lit windows on one tower that spell 月 (moon).
- A ghost train at 4:44 a.m.

## Sound and start-up
- **Start-up:** you climb the crane ladder and step out onto the arm.
- **Sound:** wind, distant traffic and city hum, trains and the odd horn. No music.

## Build
- **City plates:** painted plates upscaled to 4K. Each plate is split into 3 × 3 tiles, every
  tile gets an AI detail pass, and the tiles are merged back so that colour and layout come
  from the original while fine detail comes from the tiles. Then a light grade.
- **Hook:** painted into the Night plate, cut out with a proper matte, then placed on Late and
  repainted for Ice. It is also saved as its own layer (`img/hook-night.png`,
  `img/hook-ice.png`) so it can sway.
- **Sign:** drawn live in a canvas over the plate, dot by dot, on a measured map of the sign's
  diode grid, so any text can be shown.
- **Screens:** the plate fills any screen and the sign stays locked to the plate. On a 16:10
  MacBook the crop slides a little so the hook never sits under the menu.
- A static site with no build step. Smooth on a recent MacBook. Reduced motion is respected.
  Course data, sections and progress stay real.

## My calls (correct any of these)
- **Hidden menu:** on mouse move or Esc, so the corners stay empty while you study.
- **Railing:** kept. You have somewhere to stand, and it carries the only warm light.
- **Placement:** the hook and sign hang upper left. The rest of the frame is city.
- **Sign glass:** the sky reflection at the top of the glass (and the frost at the bottom on
  Ice) is toned down so the text reads.
- **Sway in 2D:** the hook is a photo layer, so it can sway as a slow pendulum without losing
  any quality. Real 3D is only needed for the climb and the leap.
- **Late plate:** the warm glow in the low cloud is calmed so the view stays white and blue.
- **Late comes by itself:** between 01:30 and 05:00 the view slowly turns into the 3 a.m. city,
  and back again after 05:00.
- **Extra life:** car lights on the highways, a plane about once a minute, steam, cloud and
  beacons are in the first motion prototype. Trains, crows and the helicopter come later.
- **Sound:** on by default, but it starts on your first click or key press, because browsers
  block sound before that. Ambience only: no music.
- **Safari:** Safari can't blur a canvas the same way, so the sign has a second renderer that
  looks the same.

## Answered
- **Long text:** titles scroll across the sign (see "The hook and the sign").
- **Monitor shape:** MacBook only, so there is no wider version.

## Open questions
1. **Moon phase:** should the moon's phase show your progress? This was a v6 idea, so it is
   out unless you want it back.
2. **Sway:** the hook swings about 4 px on a MacBook screen, once every 10 seconds or so.
   Stiller, or more alive?
3. **Scroll speed:** is 20 dots a second, with a 2.6 second pause, right for long titles?
4. **Sound:** on from the first click (now), or off until you turn it on?

## Motion prototype (Nov 2026)
Folder: `proto/crane/desk/`. It uses the plates, hook layers, fonts and tokens from
`proto/crane/` (`../img`, `../fonts`, `../tokens.css`).

**Run it:** in the `cozy3/` folder, run `python3 -m http.server 8931`, then open
`http://localhost:8931/proto/crane/desk/`. It needs the server: opening the file directly does
not work, because the page uses ES modules.

**What moves**
- **Camera:** a slow film-camera drift (a very small zoom and pan over about a minute).
- **Hook and sign:** a slow pendulum sway in gusts, with a small rock of the sign under the
  hook. A big swing ends with a creak.
- **Sign:** it powers on at start-up. Text changes with a roll or a wipe, long titles scroll,
  and the action line (`▶ RESUME`) glows when you point at the sign. Click it or press Enter
  and it blinks, shows `OPENING`, then comes back (a stand-in for the leap).
- **Night:** drizzle (far rain and close rain lit by the sign), drips from the sign's lip,
  steam from rooftops, slow cloud with the moon glowing through it, red beacons, car lights on
  the highways, and a plane now and then.
- **Late (3 a.m.):** low fog drifting through the towers, fewer cars, and drips after the rain.
- **Ice:** snow in gusts (far, middle and soft close flakes), haze, steam and cars.
- **HUD:** the real clock, date and weather. The hidden menu fades in when you move the mouse
  and out after 2.6 seconds; Esc keeps it open. The Night/Ice toggle crossfades the whole view.
- **Sound:** rain, patter and pings on the steel, drips and city hum (Night); wind, city and
  drips (Late); wind and a snowy hush (Ice). Also the sign's hum and clack, creaks, a soft
  tick on the menu, and a distant train now and then.
- **Settings (gear):** motion Full, Calm or Still. Still is used when your Mac is set to reduce
  motion: nothing drifts or sways, there is no weather or traffic, and long titles flip.

**Keys:** ← and → show other sign pages (resume, next checkpoint, a new lesson, unit complete,
long titles). Enter opens the lesson. Esc keeps the menu open.

**Address options** (add after `?`, joined with `&`):
`f=night|late|ice` fixes the scene (by default it follows the clock), `time=03:12` fakes the
clock, `lesson=3.4&state=resume|begin|complete&cp=2` picks the sign page,
`motion=full|calm|still`, `menu=1` shows the menu, `sound=0` mutes, `led=js` forces the Safari
renderer, and `bare` shows only the plate, hook and sign.

**Not in it yet:** trains on the raised tracks, crows, the helicopter, weather that changes
each night, fewer lit windows late at night, the last train, blue light before dawn, the climb
at start-up, the leap into a lesson, and the secrets.

## Files
- Frames (3840 × 2160): `proto/crane/out/crane-f1-night-2347.jpg`, `crane-f2-late-0312.jpg`,
  `crane-f3-ice-0705.jpg`, and `crane-f4-menu-2347.jpg` (the hidden menu shown). Source:
  `proto/crane/frame.html?f=night|late|ice` (add `&menu=1` to show the menu).
- Plates: `proto/crane/img/plate2-{night,late,ice}-4k.jpg`. Hook layers: `img/hook-*.png`.
  The motion prototype uses the same city without the hook (`img/city-{night,late,ice}-4k.jpg`),
  plus sky and fog masks (`img/mask-*.png`) and the sign glass (`img/glass-*.png`).
- Sign: LED font `proto/crane/ledfont.js`, grid map `proto/crane/hi/sign-geom.json`.
- 4K pipeline scripts: `proto/crane/hi/` (`merge.py`, `finish.py`, `matte2.py`,
  `glass_tame.py`).
- Motion prototype: `proto/crane/desk/` (see above). Film and stills tools are in
  `proto/crane/desk/tools/` (`film.mjs`, `snap.mjs`, `audio.mjs`).
- Motion film (28 s, 1920 × 1200, with sound) and MacBook stills (2880 × 1800):
  `proto/crane/out/motion/` (`mimei-desk-motion.mp4`, `mimei-desk-night-scroll.jpg`,
  `mimei-desk-late-menu.jpg`, `mimei-desk-ice.jpg`).

## Next
1. Name and mark board, three still frames, and this round of fixes (done).
2. A motion prototype of the desk: the hook and sign swaying, rain or snow, camera drift, the
   sign changing text, the hidden menu, and sound (done, see above).
3. Build it into the real site (desk only), with tests, accessibility and fixes such as
   `studyMig`. Agree a short brief for this before changing the real site.
4. Later: trains, crows, the helicopter, nightly weather, the climb and the leap, and the
   secrets.
