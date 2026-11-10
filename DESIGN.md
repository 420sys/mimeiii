# MIMEI — the quiet desk

The design contract. Read this before touching markup. There is **one look**;
every screen either belongs to it or does not ship.

---

## 1. The fiction

You sit at a quiet desk with the course open beside Roblox Studio. The machine
runs **MIMEI** (未明, the hour before dawn): a small Linux whose whole job is
teaching you Roblox Luau. (It was called Ossuary until 5 Nov 2026, and luauOS
before that; §9 covers the renames.) Nothing in the browser runs Luau. Every
script goes into the learner's own Studio, and MIMEI is the workstation around
that loop.

| the course | the machine |
|---|---|
| the course | the filesystem at `~/roblox-luau` |
| a unit | a directory (`unit-03-decisions/`), a roman numeral on the desk |
| a lesson | a **session**: one lesson on the study's pane of glass (§5) |
| a cheatsheet | a **man page** (`man luau-decisions`) |
| a goal | a checkpoint the machine tracks |
| a Studio task list | a **runbook** |
| a predict question | a **probe** |
| a folded solution | `cat solution.lua` |
| progress | **checkpoints** reached (210 in the course), nothing else: no XP, no ranks; tonight's study time and the week |
| finishing a unit | a chime in the journal: `[ OK ] unit-03 done` |
| the desktop | the **desk**: a crane over a city at night, its sign naming your lesson |

Copy is **plain English** ("Begin", "Resume", "course index"). The Linux
flavour lives in the chrome, the terminal, tooltips and the man pages. A
beginner must never need jargon to learn. There is no fake calendar or
decorative progress: every number comes from the course, the clock or the
learner's stored state. Two things on the desk are mood, not data, and never
pretend otherwise: the weather word names the picture (drizzle, low cloud,
snow), not a forecast, and the ambience is made in the browser.

## 2. The one look

One voice everywhere you look: the desk (§4), the study (§5) and **the cab**,
the windows on workspaces 3 and 4 (§3; the decisions are in
`moodboard/v9-cab/BUILD.md`). Inter for words, IBM Plex Mono for code and the
small capitals; white and city blue at Night and Late, slate in Ice; no
accent colour. The only warm light is the lamp (`#ffb46b`), and it marks
*you*. (Inside, the look is still called `ossuary`: `data-rice="ossuary"`.)

- **Scenes.** Night (the default) and Late (by itself from 01:30 to 05:00)
  are dark; Ice is light. It is one choice, made in the desk's menu or in
  settings, and every workspace follows it: the desk and the study read
  `sceneNow()`, and `src/ui/cab.js` puts the same scene on
  `<html>` and `<body>` (`data-scene`) for the cab.
- **Palette** (`styles/41-cab.css`, all hex so they can be measured):
  - Night (`:root`): ink `--bg #05070c`, `--surface-solid #070a10`, panes
    `--pane rgba(6,9,15,.74)`; text `--fg #f2f5fa`, `--fg-2 #c8ccd5`,
    `--fg-3 #9499a2` and the quiet `--fg-4 #7e838b` (still 5:1).
  - Ice (`:root[data-scene='ice']`): `--surface-solid #f4f6f9`, panes
    `rgba(246,248,251,.8)`; text `--fg #18202b`, `--fg-2 #373e48`,
    `--fg-3 #5a6069`, `--fg-4 #656a72`.
  - `--accent` is the text colour itself; `--accent-2 #a9c4e4` (city blue)
    is strings and paths. `--ok` and `--warn` are plain text too: nothing is
    coloured to mean good or bad.
  - **The lamp**: `--lamp #ffb46b` at Night, `#c96f22` in Ice (deeper, so the
    edge still reads on light glass). It is the edge of the window in front,
    that window's dot in the bar and the caret where you type. Nothing else
    is warm.
  - `--faint` is for hairlines and ornaments, never words.
- **Surfaces.** Windows are panes of glass: a hairline edge, 8px corners, a
  soft shadow, the city faint behind the text, 14px of city between them.
  The window in front gets the lamp edge with a soft glow. The bar is one
  slim line of the same glass, and the launcher, the scrim and the empty
  seat speak the same voice. The tokens are redefined on `:root`, so anything
  older that reads them follows; the desk keeps its own scoped tokens
  (`--cr-*`), and the study's panes are the cab's glass (`.glass`).
- **Glass** (`styles/43-glass.css`). Every pane has an edge of light along
  its top and a faint sheen and grain under the words. At full effects the
  blur behind the panes goes deeper (1.5× `--glass-blur`) behind a lighter
  fill; at balanced and below they keep the solid fill. Behind the glass on
  workspaces 2–4 the city's traffic drifts (`src/ui/drift.js`): soft
  headlights and tail-lights along the plate's light trails, slower than
  the desk's, dimmer at Late, fainter and greyer on Ice, never on the desk.
- **Type.** All self-hosted, so the machine starts offline and no third party
  sees the reader:
  - **Inter** for words: window titles, the manual's prose, settings.
  - **IBM Plex Mono** for code, the terminal, counts and the small capitals
    (11px, tracked wide) that head sections and label things.
  - Nothing readable is under 11px (`tests/reading.spec.js`; `.brand-name`,
    `.sr-only` and svg are exempt).
  - JetBrains Mono and Space Grotesk are still declared for older parts and
    fallbacks; nothing on screen depends on them.
- **The wall.** The desk's city, out of focus and dimmed, in tonight's scene:
  `assets/walls/city-night.webp`, `city-late.webp` and `city-ice.webp`, made
  by `tools/assets.py` from the desk's plates (`assets/crane/city-*.webp`:
  768px wide, blurred in the file, about 6KB each), under a veil so the panes
  stay readable. Only tonight's city loads. There is no wall picker and no
  theme picker. `window.ossuary.rice` remains a compatibility surface with
  one entry, `ossuary`; the old rice ids, including `komorebi`, return
  `false`. A saved wall is dropped on load: the wall follows the scene.
- **Icons.** One 16-unit stroke kit in `src/ui/window.js` (`ICONS`), always
  `currentColor` at `1em`. The brand mark is the 未 mark
  (`assets/crane/mark-snow.webp`, `mark-slate.webp` in Ice), in the bar and
  in the terminal's greeting; the favicon is `assets/crane/icon.png`. No
  emoji, no second icon set.
- **Motion.**
  - Shell transitions run 110–280ms, ease-out.
  - The bar's glass is the cab's one live blur; it follows the effects level
    (none at 2 and below). The wall is blurred in the file, not by CSS.
  - The desk moves as one picture (§4): rain, traffic, the swaying sign.
    It holds when the tab is hidden or another workspace is up, and it is
    still under reduced motion or fx 0.

## 3. The shell

```
┌── bar (workspaces 3 and 4) ───────────────────────────────────────────────┐
│ 未 MIMEI  01 02 03 MANUAL 04    ● manual  terminal  files   9/210  22:08 │
├───────────────────────────────────────────────────────────────────────────┤
│ workspace 1: the desk is the whole screen — no bar, no windows            │
│ workspace 2: the study — one pane of glass over the city, the slim bar    │
│ workspaces 3–4: the cab — panes of glass over the soft city, 14px apart   │
└───────────────────────────────────────────────────────────────────────────┘
   in stack mode (<1000px) the windows stack in one column under the bar
```

- **Bar** (workspaces 3 and 4): one slim line (32px) of glass, one hairline
  below.
  - Left: the 未 mark, `MIMEI` in tracked capitals, then the four workspaces
    as numbers, `01` to `04`. The one you are on shows its name (`MANUAL`,
    `SETTINGS`) and is underlined; the others keep their names for screen
    readers only. While Alt is held the numbers light up.
  - Middle (`#bar-task`, "Windows on this workspace"): this workspace's
    windows as words, `manual`, `terminal` and `files` on 3 and `settings`
    on 4, with anything moved here after them. The one in front has the
    lamp's dot and `aria-pressed="true"`; an open one has a faint dot. A
    click on the one in front puts it away; a click on any other opens it or
    brings it forward, and the journal says so. The words fold away below
    620px; the apps button stays.
  - Right: the checkpoints reached (`9/210 checkpoints`), a tabular clock
    (date on hover) and the search and apps controls.
  - The bar is not shown on workspaces 1 and 2: the desk and the lessons are
    the whole screen and each has its own menu (§4, §5).
- **No dock.** The icon strip down the left (the rail) is gone, at every
  width. The bar's words, the apps button (`#mod-apps`: the launcher's
  windows mode), the launcher (`Alt+Enter`) and the keys reach every window.
- **Workspaces:**
  1. *desk*: the crane over the city, §4. It holds no windows.
  2. *lessons*: the study, one lesson at a time (§5); the goals/journal
     window floats over it.
  3. *manual*: the cheatsheet at full width; the terminal and the file
     manager open here too.
  4. *settings*: settings alone.

  Switching workspaces tiles that set. An older saved layout that still lists
  the wall picker on 4, or windows on 1, is cleaned on load.
- **Windows:** real ones, panes of glass. Drag a titlebar to float, drop on
  an edge to snap, drop over another window to swap, double-click to fill.
  Four faint circles at the top left close, hide, float and fill (their keys
  are in their titles); the right-click menu has the same and the layouts.
  The window in front gets the warm lamp edge; the keyboard ring on a window
  is a 2px lamp outline just inside it. The keyboard is first class (§7).
- **Launcher:** wofi/rofi shape. A centred panel with modes (`lessons`,
  `windows`, `actions`, `keys`), fuzzy matching, arrows, Enter to run and Tab
  to change mode. There is no walls mode.
- **Journal:** journalctl-flavoured activity log in the goals/journal window.
  The bar has no ticker; the desk reads stored state, not the log.

## 4. The desk (workspace 1)

The first screen is a view from a tower crane over a city at night. A sign
hangs from the hook and names your lesson in LED letters. It is the whole
screen: no bar, no windows. A menu comes up with the mouse. The
build plan and the agreed decisions are in `moodboard/v7-crane/BUILD.md`.

```
                                                         drizzle
                                                          23:47
                                                       THU 05 NOV
        ┌──────────────────────────┐        52 stops · about 17 hours · you type
        │ SET UP · 1.0             │        every script in your own Roblox Studio
        │ Set up Roblox Studio     │        (Windows or Mac)        ← fresh save only
        │ 4 CHECKPOINTS            │
        │ ▶ BEGIN · 10 MIN         │   ← the sign: a real button
        └──────────────────────────┘
  (the city: plate, rain on the glass, traffic, the hook and the sign sway)

 menu (comes up with the mouse, Esc pins it):
 ┌ 未 MIMEI  01 desk 02 03 04 ┐                                   
 tonight  0:20 / 1:00 ━━──── │ 2 study nights this week │ M T W T F S S
 3 to revisit · older copy kept · settings          ♪  ☾ ❄  ⚙  esc · hide
```

- **The picture** (`src/desk/`): `world.js` stacks the layers from
  `assets/crane/` (WebP, only the scene on screen is loaded): the city plate,
  traffic and window life on a canvas, rain or snow behind and in front of
  the glass, the hook and the sign, and a colour grade. Three scenes
  (`scenes.js`), each with one weather word in the corner:
  - **Night** (`drizzle`): the default.
  - **Late** (`low cloud`): Night turns into it by itself between 01:30 and
    05:00, the 3 a.m. city.
  - **Ice** (`snow`): the light scene, chosen in the menu. Night/Ice is
    remembered (`state.scene`).
- **The sign** (`pages.js`, `led.js`): four rows of LED text read from the
  real course and progress: the unit and stop, the title, the checkpoints,
  and the action (`▶ BEGIN · 10 MIN`, `▶ RESUME …`, `REVIEW`). The first time
  you come back after finishing a unit it says `UNIT III` / complete, once
  (`state.unitsSeen`). It is a real `<button id="cr-sign">` clipped to the
  sign's shape, with the same words as text for screen readers and a ring on
  keyboard focus.
  - `←`/`→` flip it through every written lesson, in course order, wrapping.
    A screen reader hears the new page.
  - `Enter` or a click opens the lesson with the **leap**: the view tips down
    and falls into the city (about 1.5 s), then workspace 2 opens on the
    lesson. Under reduced motion it is a short fade.
  - `m` opens the manual for the lesson on the sign.
- **The corner** (top right): the weather word, the real clock and date, and
  on a fresh save one line counted from the course (never typed in):
  `52 stops · about 17 hours · you type every script in your own Roblox
  Studio (Windows or Mac)`. The first tick retires it.
- **The menu** is out of the way until the mouse moves, and goes again after
  2.6 s of stillness. `Esc` pins it up and lets it go; `Tab` into it also
  brings it up. Three corners:
  - top left: the 未 mark, MIMEI and the four workspaces (01–04);
  - bottom left: **tonight** (`0:20 / 1:00`, a bar), the study nights this
    week and the week's dots (today ringed), then `N to revisit` and the
    older-copy note when they apply;
  - bottom right: sound, Night/Ice, and the gear: motion (Full, Calm,
    Still), the desk's keys and `all settings →`.
- **Tonight** (`src/core/nights.js`): time counts while a lesson is open on
  workspace 2 and the page has been used in the last 15 minutes (reading,
  scrolling, ticking; a tab behind Roblox Studio keeps counting until then).
  A night ends at 5 a.m. A night with at least 10 minutes counts towards the
  week. The goal is one hour, changeable in Settings (30 min to 2 h). With two
  tabs open only the one used last counts. The seconds are progress: export
  and import carry them.
- **Motion** is the effects setting seen from the desk: Full is fx 2–3, Calm
  is fx 1, Still is fx 0. Picking one in the menu sets the effects to
  full/minimal/static. Reduced motion is always Still, and the menu says why.
- **Sound** (`src/core/ambience.js`, `sound.js`): the city at night and soft
  clicks, made in the browser (no audio files). It starts on for everyone
  since MIMEI; the browser still waits for the first click or key. It plays
  at full level on the desk and at half on every other workspace, where the
  sign's hum stops.
- **Start-up** (`src/ui/boot.js`): a black screen while the first picture
  and the fonts load (never more than 2.5 s), then the desk fades in and the
  sign powers on. Any key or click lifts the dark at once, and that key does
  nothing else. A link to a lesson does not wait for the city: the city loads
  the first time the desk is actually shown. `?noboot` skips the start-up.
- **Pins** for screenshots and films: `?time=23:47` fixes the clock and the
  scene, `?manual` runs the desk on a hand-driven clock (`window.STEP(dt)`), and
  `?fx=0..3` pins the motion.
- **Lifecycle.** The desk draws only on workspace 1 with the tab shown; on
  every other workspace, and in a hidden tab, it holds. If the city cannot
  load, the desk says so in the journal and the sign becomes a plain text
  button (`.no-world`); the menu still works.
- **Fit.** Nothing meets or clips at 1280×800, 1366×768, 1440×900,
  1600×1000, 1920×1080 or 900×700; below 760px wide the bottom-right corner
  stacks under the clock. Phones and tablets are not a target; small screens
  keep working. `tests/desk.spec.js` asserts it.

## 5. Lessons, manual, goals, settings

- **Workspace 2 is the study** (`src/ui/study.js`, `src/ui/session.js`,
  `src/ui/margins.js`, `styles/38-study.css` and `37-lesson.css`; the
  decisions are in `moodboard/v10-study/BUILD.md`). Late at night in the
  cab: one lesson at a time on one big pane of glass, the city faint behind
  it and one warm lamp. The cab's slim bar stays.
  - **The picture.** The reading pane in the middle, the city around it and
    its slow traffic behind the glass (§2). Night and Late are dark, Ice is
    light. There is no accent colour: warm light only at *you* (the lamp).
  - **The outline** runs down the pane's left edge: the lesson's steps, the
    checkpoints under each, lit once reached. Every step and checkpoint is a
    button that takes you there; the arrows, Home and End walk them. The
    lamp glides to the step you are reading (at once on Still). When the page
    is narrower than 720px the outline folds away.
  - **The page.** Inter for words, IBM Plex Mono for code and the small
    capitals; each step opens under a quiet head (`.st-sh`). Runbooks and
    probes tick real checkpoints; a probe answers `Correct.` or `Not quite.`
    and says why. The lesson ends with **the end card** (`.st-end`). `[` and
    `]` walk the line to the previous and the next lesson.
  - **The scripts** (`S`, or the button in the pane's head): a drawer slides
    out on the right with this step's script, what it prints and the
    runbook, which folds when it would squeeze the code. The pane glides
    aside as it comes (both on transforms, so nothing reflows); on a screen
    under 760px wide the drawer comes over the page instead. `Esc` puts it
    away, and whether it is out is kept across visits.
  - **The bar lends its middle to the lesson** (`lendBarMiddle`): this
    lesson's steps as words you can click, the lamp on the one you are
    reading; when room runs short it keeps only the current name, then only
    the numbers.
  - **The weather stays in the margins** (`src/ui/margins.js`): drizzle on
    Night, a few drops on Late, snow on Ice, in the city around the glass and
    never on it (nor on the drawer while it is out). Still draws one frame
    and stops.
  - **The course overlay** (`/`) lists every unit and stop, with search.
  - **Progress is checkpoints.** No XP and no ranks anywhere on screen. The
    outline lights this lesson's; the goals window (`9 / 210`), settings and
    the bar count the course's.
- **Manual** (workspace 3, `src/ui/man.js`): the cheatsheet as a real `man`
  page, set like a lesson page: Inter for words (16px/1.72), IBM Plex Mono
  for code in the lesson's numbered wells, section heads as small capitals
  over a hairline. It keeps the man-page frame: the header line
  (`LUAU-VARIABLES(2)`, `MIMEI manual`, the page count) and the window's
  footer (`◀ ▶`, `man 1/11`, `top`, `q close`). Beside the terminal and the
  files (a pane under 560px) the same page is set tighter, and a note after a
  line of code drops under that line instead of breaking beside it.
- **Terminal and files** (workspace 3): the terminal greets you with the 未
  mark, who you are, the checkpoints and what is next; the files window is
  the course as directories.
- **Goals/journal:** the open lesson's checkpoints, the course's
  checkpoints reached (`9 / 210`) and the machine log. Ticking a goal updates
  the study, the desk and the bar on the next real event.
- **Settings** (workspace 4, alone): the scene (Night or Ice; Late comes by
  itself), effects (auto/static/minimal/balanced/full; this is also how much
  the desk moves), sound (on since MIMEI), rain (off by default; also
  `Alt+Shift+R`), the city only (peek, `Alt+B`), tonight's goal (30 min to
  2 h, one hour unless changed), goals, journal, export, import, clear
  progress. Export downloads one JSON file, `mimei-progress-<date>.json`
  (ticks, tasks, days, the study time of each night, where you stopped in
  each lesson); files saved under the old name still import. Import checks
  the file, says what it holds, and replaces progress only after an inline yes.
  Clear progress is two steps on the page, never a browser dialog: the question
  offers "Export a copy first", then "Yes, clear it". It forgets ticks but
  keeps the look and the scene. There is no theme control and no wall
  control: the scene is the one choice, and the desk, the study and the cab
  share it.

## 6. Accessibility contract

- Every action is reachable by keyboard; every desktop action also has a
  launcher entry, so nothing is mouse-only.
- Focus is always visible: a 2px ring in the text colour at 2px offset (on a
  window, a lamp outline just inside its edge), so it reads on dark and on
  light glass. The skip link puts the cursor
  in the lesson. Windows are `role="region"` with
  `aria-labelledby`; the course tree is a real listbox with roving focus; the
  launcher is a dialog combobox; switches are `role="switch"` with
  `aria-checked`. The skip link opens a lesson.
- A polite live region announces boot, goal ticks, probe verdicts and window
  changes. It is visually hidden and off screen.
- Text contrast passes AA (4.5:1) for `--fg`, `--fg-2`, `--fg-3` and the quiet
  `--fg-4` labels, and for `--accent` and `--accent-2`, on the solid surface,
  in Night and in Ice. On a lit launcher row the quiet parts step up to
  `--fg-3`. The lamp is never text: it is an edge, a dot and a caret. Ratios
  are asserted from the rendered tokens in `tests/a11y.spec.js` (both scenes)
  and statically in `tools/lint_css.py` (the Night `:root`). The desk's text sits on a dark city (a soft dark halo
  behind the clock; dark ink on a light halo in Ice), and every desk text is
  11px or more.
- On the desk the sign is a real button whose text is the sign's words as
  one sentence ("Begin 1.0, Set up Roblox Studio. Unit I, Set up: not
  started, 4 checkpoints, about 10 minutes."), with a hint that names the
  keys. A flip is announced. The menu's controls are real buttons (the gear
  has `aria-expanded`; sound and the scene are `aria-pressed`), and the menu
  shows whenever focus is in it. The picture is `aria-hidden`; tonight's bar
  and the week are `role="img"` with a label that says the numbers.
- Opening a lesson by any door hands the keyboard to the lesson (`#st-scroll`),
  a cold link included once the start-up has lifted (no ring until the first
  key); PageDown, Space, the arrows, Home and End then read it. The
  outline's steps and checkpoints are real buttons with spoken names, one
  tab stop for the whole outline (the arrows, Home and End walk it). The
  scripts drawer is `inert` while it is away, and nothing in the margins
  ever covers a focused control.
- Axe scans run over the desk, a lesson workspace, the manual, settings, the
  launcher and the single look, and over the cab again in Ice. New interactive markup must not add
  violations.
- `prefers-reduced-motion` forces effects level 0: no rain, parallax, typing
  or window transitions.
  - The desk is Still: no rain, traffic or sway, the sign changes in place,
    and the gear's popover says why.
  - Opening a lesson from the sign is a short fade instead of the leap.
- The leap announces "Opening 1.0 …" in the live region as it starts. Its
  overlay is `aria-hidden`; focus lands in the lesson as with any other open.

## 7. Keyboard (Alt is Super)

| keys | action |
|---|---|
| `Alt+Enter` | launcher |
| `Alt+1..4` / `Alt+Shift+1..4` | switch / move window to workspace |
| `Alt+H J K L` / arrows | move focus |
| `Alt+Shift+H J K L` | reorder · grow / shrink |
| `Alt+M` `Alt+F` `Alt+Z` | maximise · float · hide |
| `Alt+Shift+M` | rows or columns layout |
| `Alt+Q` | close window |
| `Alt+Tab` or ``Alt+` `` | cycle windows |
| `Alt+B` | the city only (peek): everything else steps aside |
| `Alt+P` / `Alt+Shift+F` | cycle the effects level |
| `Alt+Shift+R` | rain on or off |
| `[` `]` | previous / next lesson (one lesson at a time) |
| `/` | search the course |
| `←` `→` | on the desk: the other lessons on the sign |
| `Enter` | on the desk: open the lesson on the sign |
| `m` | the manual page for the lesson on the sign |
| `q` | close the man page (inside it) |
| `Esc` | leave overlays, unmaximise; on the desk, pin or hide the menu; in a lesson, bring the menu up or put it away |
| `?` | keys, via the launcher |

Keys are read from `event.code`, so the physical key matters; Alt held down
lights the bar's workspace numbers like a Super key (best effort: macOS
browsers keep some Alt keydowns). Inside a text field plain keys stand down — typing
always wins.

## 8. Performance contract

- First load: shell CSS + JS + self-hosted fonts and tonight's soft city
  (about 6KB of WebP and its LQIP data-URI, both generated by
  `tools/assets.py`). Fonts never call a third party.
- The desk (`src/desk/`, about 80KB of JS) is a dynamic import, and it loads
  only the scene on screen: about 1MB of WebP for Night (the city plate is
  850KB of that), less for Late, about 0.9MB for Ice. The start-up's dark
  covers that first load and never waits more than 2.5 s. A link to a lesson
  loads none of it until the desk is shown.
- The desk draws only while it is on screen: another workspace or a hidden
  tab holds every loop. The weather and traffic canvases are sized to the
  window; the sign's LED text is drawn once per page, not per frame.
- Effects sit behind `data-fx` and a **watchdog**: if frame time stays over
  26ms, the machine drops a level and says so in the journal. Levels:
  `3` everything · `2` no blur/parallax · `1` no scanline/grain/glitch/rain ·
  `0` static. The desk reads the same level as its motion (Full, Calm,
  Still); in the cab only the bar's glass blur follows the level, and the
  wall is already soft in the file. `prefers-reduced-motion` outranks the `?fx=` pin and the watchdog,
  and follows the setting if it changes while the page is open.
- Budget targets in `tests/perf.spec.js`: LCP < 2500ms on localhost, CLS <
  0.05, no task over 300ms and at most 8 long tasks during boot, the start-up
  lifted by a key at once and never more than about 2.5s of dark, a lesson
  opening in under 1.5s, heap growth under
  40MB across a twelve-stop read, and the wall (one soft city, at most
  64KB) within its byte cap.
- The drift (workspaces 2–4) draws at most 24 frames a second at full and
  balanced effects, 12 at minimal, and one still frame at static or with
  reduced motion; its canvas is backed at half size and nothing is
  allocated per frame. It stops while hidden, while booting and on the
  desk.
- A cold `#/2.1` costs one task of about 165ms on the 2-CPU Linux box with
  no GPU (it was about 275ms): the lesson is drawn once, not twice (openLesson
  holds `openFirstSession` off while it switches to the study), the weather's
  mask is built at a quarter of the screen and drawn back up, and the journal
  keeps one clock formatter. Most of what is left is the first layout of the
  lesson, forced by `scrollTop = 0` in `render()`.

## 9. File map

```
index.html            shell markup only; every window is built by js
styles/*.css          fonts → tokens → chrome → content → effects
assets/fonts/         self-hosted WOFF2 faces + OFL licences
assets/walls/         city-night / city-late / city-ice.webp + @320 thumbs: the desk's
                      plates, soft (made by tools/assets.py from assets/crane/)
assets/crane/         the desk: city plates, hook, glass and sky masks per scene,
                      the 未 mark (snow / slate) and the 256px icon
src/data/course.js    GROUPS LESSONS GOALS TASKS PREDICTS (+ /*@@*/ markers)
src/data/walls.js     generated by tools/assets.py (the three soft cities)
src/core/*.js         state, rice (one look), walls, md, wm, keys, effects,
                      sound + ambience (the city at night), nights (tonight's
                      study time), journal, find
src/ui/*.js           bar, cab (the scene and the wall on 3–4), window (kit + icons), course, session, man,
                      goals, journal-view, desktop (the desk's DOM, keys and
                      menu), settings, boot, tty, files, launcher, study (the
                      study: its panes, outline, drawer and course overlay),
                      session (the lesson itself: body, place, scripts, ticks),
                      margins (the weather around the glass) and drift (the
                      city's traffic behind the glass on 2–4)
src/desk/*.js         the desk's picture: world (layers), scenes, stage, atmos,
                      weather, life, roads, led + ledfont + pages (the sign),
                      leap, clock
src/main.js           boot the machine + the `window.ossuary` test surface
content/*.md          the course, untouched by design work
tools/                content/asset pipelines, lint, probe, browser check,
                      screenshot + contact-sheet pipeline
tests/                Playwright: shell, desk, wm, course, lesson, man,
                      wallpaper (look + wall + settings), goals, a11y, perf, visual
moodboard/v7-crane/   the desk's brief and build plan (BRIEF.md, BUILD.md)
moodboard/v8-climb/   the climb's decisions (retired in v10), mast photos, prototype CSS
moodboard/v9-cab/     the cab's decisions (BUILD.md) and its stills
moodboard/v10-study/  the study's decisions (BUILD.md) and its stills
```

The stylesheets load in `index.html` order; `styles/41-cab.css` comes last but
print, so the cab's tokens win over `36-riced.css` (the shell's structure).

**The rename.** luauOS became Ossuary all the way down: `window.ossuary`, the
package name, every header comment and visible string, and the store. The
store moved from `luauos-1` to `ossuary-1`: on the first load with no
`ossuary-1`, the old store is copied over unchanged and left where it was, so
a rollback still finds it. The old look name `komorebi` becomes `ossuary`, and
a saved wall is dropped (since the cab, the wall follows the scene).

**The second rename.** Ossuary became MIMEI on 5 Nov 2026, on screen only: the
tab title, the bar, the start-up, the icon, the about text and the export
file name. The internals keep their names, so nothing saved is lost: the store
`ossuary-1`, `window.ossuary`, `data-rice="ossuary"` and the `ossuary:sync`
event. A one-time move (`state.mimei`) turns sound on and counts units that
are already finished as seen, so nobody comes back to a pile of UNIT
COMPLETE pages.

**Progress safety.** `ossuary-1` also keeps `place`: per lesson `{s, m, y, p}`
(step, furthest step, scrollTop, picks of answered probes), put back after the
lesson renders; nothing ticks on restore. A store that will not parse, or a
save that throws, keeps the old text under `ossuary-1.bak` and says so once in
the journal and in Settings. `navigator.storage.persist()` is asked once per
page. Export writes `{app, v, saved, progress}`; Import validates every part
before anything is replaced.

**One host.** localStorage is per origin, so `http://localhost:8925` and
`http://127.0.0.1:8925` are two different stores. `serve.sh`, HANDOFF.md and
this file all say `localhost:8925`; Playwright's own server is on 8928.

## 10. Tests and tools

Everything below is expected green before a change lands. There is no CI:
these are the CI.

```
npx playwright test
npx playwright test tests/visual.spec.js --update-snapshots   # after a look change
python3 tools/lint_lessons.py            # content markers + structure
python3 tools/extract_cases.py           # predicts → cases.json
python3 tools/merge_parts.py             # regenerate src/data/course.js
python3 tools/assets.py                  # rebuild the wall + LQIP + thumb
python3 tools/lint_css.py                # token integrity + one-look contrast
python3 tools/browsercheck.py --fires    # keyboard + click smoke over every action
python3 tools/probe.py                   # one page of machine state as text
python3 tools/shots.py                   # each workspace + contact sheet
```

- **Specs:**
  - `shell`: boot to the desk (no bar, no dock), the bar's workspaces and
    window words on the other workspaces, Terminal/Files from the apps menu
    and the bar on workspace 3 (open, bring forward, put away, in stack mode
    too), stack mode and the terminal's fit at phone width.
  - `desk`: a fresh save (Begin 1.0, the corner read from the course and the
    clock); the city loads on sight and holds off the desk; `←`/`→` flip and
    wrap and are announced; Enter and a click open with the leap; reduced
    motion is Still with a short fade; the menu with the mouse, `Esc` and
    `Tab`; Night/Ice remembered; the late plate and `?time=`; motion is the
    effects setting; a finished unit says COMPLETE once; the move to MIMEI and
    the luauOS carry-over; tonight's time; the desk keys stay out of the
    launcher; the plain-button fallback; nothing meets or clips at six sizes.
  - `critique-bugs`, `followup`, `review`, `tabs`: the fixes from the earlier
    reviews, each pinned by the test that found it.
  - `wm`: tiling, drag, snap, float, workspaces.
  - `course`: tree, search, progress propagation.
  - `lesson`: runbooks, probes, ticks, tabs, URL + `[`/`]`.
  - `man`.
  - `wallpaper`: the one look, the wall that follows the scene (Night, Late,
    Ice; the scene control in settings), no picker; settings.
  - `goals`.
  - `strangers`: the line under the desk's clock comes from the course and
    goes with the first tick; export, import and the two-step clear (no native dialog); a
    store that will not parse, or a save that throws, keeps `ossuary-1.bak` and
    says so; `storage.persist()` is asked once; step, scroll and probe answers
    come back after a reload without ticking anything; the outline's steps are
    real buttons that take the keyboard to their step; a cold link takes the
    keys.
  - `a11y`: axe + token contrast, in Night and Ice.
  - `perf`: the budgets in §8.
  - `visual`: tracked screenshots.
- `visual.spec.js` runs serially (`describe.configure({ mode: 'serial' })`);
  the rest of the suite stays parallel.
- **Visual baselines** live in `tests/visual.spec.js-snapshots/`:
  - Each shot is taken on the quietest machine (`?noboot&fx=0` + reduced
    motion, so the desk is Still), after fonts, the pictures and layout have
    settled.
  - The bar clock is pinned with the fixed-time clock and the desk's clock
    and scene with `?time=23:47`. The desk's rain and snow canvases are
    masked, since the drops are random.
  - The old baselines went with the old desk on 5 Nov 2026. The first run on
    a Mac writes new ones: `npx playwright test tests/visual.spec.js
    --update-snapshots`, then look at them.
  - When one fails, read the diff images in `test-results/` before touching
    `--update-snapshots`.
- **Machine state for tools and tests** is `window.ossuary`:
  - `state`, `progress()`, `cps()` (checkpoints reached; `xp()` is kept for
    old tools and nothing shows it), `fx()`;
  - `wm.*` (rects/activeWs/windowsOn/open/flush);
  - `wall.current()` and `desk()` (what the sign says, the menu, and whether
    the city is up, held or leaping); `nights()` (tonight and the week);
  - `study()` (the study: the scripts, the drawer and its mode, the outline,
    scene, motion, geometry and weather), `drift()` (whether the traffic
    runs, its frame rate and lights), `lesson()`, `rice.*` (the one-entry
    compatibility surface), `sound`;
  - `still()` (a no-op).
- `tools/browsercheck.py` drives `tools/probe.html` in the Mac's Chrome
  (`tools/_chrome.py`). Its cases were brought up to date with the MIMEI desk
  on 5 Nov 2026 and all pass.
- **URL knobs:** `?noboot` skips the start-up, `?fx=0..3` pins the effects
  level, `?time=23:47` pins the desk's clock and scene, `?scene=night|late|ice`
  forces the scene everywhere, `?manual` drives the
  desk by hand (for films), `#/2.1` opens a stop. `tools/shot.html` composes
  them for pixels.

## 11. Rules

1. No build step. Plain ES modules and CSS layers, served by `./serve.sh`.
2. One look, one contract. Do not add a theme picker, a wall picker, a rice
   stylesheet or an accent colour. One voice (§2): Inter and IBM Plex Mono,
   white and city blue at Night and Late, slate in Ice, warm light only at
   the lamp. The desk is the crane picture (§4), the lessons are the study
   (§5), and the manual and settings are the cab (§3).
3. No fake data. If the course, the clock or the learner has not produced a
   number, the UI does not show one. The desk's weather word names the
   picture, never a forecast.
4. Content is never edited to fit the design — the design bends to the content.
   `content/*.md` stays the single source of lesson truth.
5. Never break `tools/lint_lessons.py`, `tools/extract_cases.py` or
   `tools/merge_parts.py`: the `const` names and `/*@@*/` markers stay.
6. Every visual change lands with a test or a probe number. A look change also
   lands with fresh baselines — after reading the new pixels, never before.
7. The first screen is the desk: the crane, the sign, the corner clock and a
   menu that comes with the mouse, with no bar and no windows on it. It fits
   without scrolling from 1280×800 to 1920×1080. Do not add panels, a second
   dashboard or duplicate counts; the sign names one lesson at a time.
8. Rain stays off by default. The settings switch and `Alt+Shift+R` remain
   available.
