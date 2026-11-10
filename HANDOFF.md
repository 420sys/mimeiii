# Handoff — MIMEI

**Updated:** 2026-11-05
**Status:**
- Workspaces 3 and 4 are **the cab** (`moodboard/v9-cab/BUILD.md`): the
  manual, the terminal, the files and settings on panes of glass over the
  desk's city, out of focus, in tonight's scene. Night and Late are dark,
  Ice is light; the window in front has a warm lamp edge. The icon strip
  (the rail) is gone: the slim bar names this workspace's windows. The
  manual is set like a lesson page in a man page's frame, and the terminal
  greets you with the 未 mark. The skull garden and the bone-and-oxblood
  shell are retired from the screen.
- Workspace 2 is **the study** (`moodboard/v10-study/BUILD.md`), which
  replaced the climb in v10: one lesson at a time on one big pane of glass
  over the city, the outline of its steps and checkpoints down the pane's
  left edge with a warm lamp on the step you are reading, and the scripts in
  a drawer that slides out on the right (`S`). The cab's slim bar stays, and
  its middle shows the lesson's steps. The weather keeps to the margins.
- **Glass and drift** on workspaces 2–4: every pane has an edge of light, a
  faint sheen and grain, and a deeper blur at full effects
  (`styles/43-glass.css`); the city's traffic drifts slowly behind the glass
  (`src/ui/drift.js`).
- **No XP and no ranks** anywhere on screen. Progress is checkpoints reached
  (210 in the course): in the lesson's outline, in the goals window, in
  settings and in the bar.
- Workspace 1 is the **crane desk** from `moodboard/v7-crane`: the view from
  a tower crane over a city at night, an LED sign on the hook naming your
  lesson, and a menu that comes up with the mouse. The four-panel desk (Now,
  Today, Queue, the flock), the WebGL black hole and three.js are gone.
- **Ossuary is now MIMEI** (未明, the hour before dawn) everywhere you can
  see. The internals keep their old names on purpose, so nothing saved is
  lost.
- `DESIGN.md` describes what is on screen. The tests were rewritten for the
  desk, then for the climb, then for the cab; the specs that still reach for
  the climb are the next job (§9). The old visual baselines went with the old
  desk: the first run on the Mac writes new ones (§3).

`DESIGN.md` is the design authority. `moodboard/v7-crane/BUILD.md` (the desk)
and `moodboard/v9-cab/BUILD.md` (the manual and settings) have the decisions
agreed on 5 Nov 2026, and `moodboard/v10-study/BUILD.md` has the lessons'
(the study; `moodboard/v8-climb/` is the retired climb). Where this file and
`DESIGN.md` disagree, trust `DESIGN.md`.

---

## TL;DR for the next agent

- A **no-build** static site: plain ES modules + CSS, served over HTTP.
  `./serve.sh` → `http://localhost:8925`.
- The fiction: a small Linux called **MIMEI** around a real Roblox Luau
  course. Nothing in the browser runs Luau; every script goes into the
  learner's own Roblox Studio.
- Four workspaces (`Alt+1…4`): **1 desk** (the whole screen, no bar),
  **2 lessons** (the study: one pane of glass, the slim bar), **3 manual**
  (Terminal and Files open here, from the bar or the apps menu),
  **4 settings**.
- **The cab** (workspaces 3–4, DESIGN.md §2–§3, §5):
  - the look: `styles/41-cab.css` (loaded last but print; it redefines the
    shared tokens on `:root`, Night/Late, and on `:root[data-scene='ice']`).
  - the scene and the wall: `src/ui/cab.js` (`paintCab()`: `data-scene` on
    `<html>` and `<body>`, the 未 mark, the soft city through
    `core/walls.js`). The walls are `assets/walls/city-{night,late,ice}.webp`,
    made by `tools/assets.py` (its `soft` picks) from `assets/crane/`.
  - the bar: `src/ui/bar.js` (workspaces `01`–`04`, this workspace's windows
    as words in `#bar-task`, the readouts). There is no rail.
  - settings has a scene control (`#set-scene-night`, `#set-scene-ice`).
- **The desk** (DESIGN.md §4):
  - the picture: `src/desk/*.js` + `assets/crane/` (WebP, only the scene on
    screen loads). Night (drizzle) is the default, Late (low cloud) takes over
    by itself from 01:30 to 05:00, Ice (snow) is picked in the menu.
  - the sign is a real `<button id="cr-sign">`: `←`/`→` flip through every
    written lesson, `Enter` or a click leaps into the city and opens it on
    workspace 2 (a short fade under reduced motion), `m` opens its manual.
  - the menu (mouse, `Esc` pins it, `Tab`): workspaces, **tonight** (study
    time against the goal), the week, revisit and older-copy notes, sound,
    Night/Ice, motion, `all settings →`.
  - DOM, keys and menu: `src/ui/desktop.js` + `styles/35-desk.css`. Tonight:
    `src/core/nights.js`. Sound: `src/core/ambience.js` + `sound.js`.
    Start-up: `src/ui/boot.js`.
- **The lessons** (DESIGN.md §5):
  - the page and its place: `src/ui/session.js` (the lesson body, the step
    you are on, scripts, runbooks, probes, `checkpoints()`, `goStep()`,
    `goCheckpoint()`, the end card `.st-end`).
  - the screen: `src/ui/study.js` (the panes, `layout()`, the outline and
    its lamp, the scripts drawer, the bar's lent words, the course overlay)
    with `src/ui/margins.js` (the weather around the glass).
  - styles: `styles/38-study.css` (the study, all scoped to `#study`) and
    `styles/37-lesson.css` (the page's parts); the glass of every pane is
    `styles/43-glass.css`, and the traffic behind it is `src/ui/drift.js`.
- The store key stays **`ossuary-1`** and the test surface stays
  **`window.ossuary`** (now with `desk()`, `nights()`, `study()` and
  `cps()`). New store keys:
  `scene`, `goalMins`, `nights`, `unitsSeen`, `mimei`.
- Removed: `src/fx/*` (black hole, flock, dive, lens, clock), `vendor/three/`,
  the old desk panels and their tests, the old visual baselines; with the
  cab, the rail (`src/ui/rail.js`) and the skull-garden wall. They are in
  the git history.
- 237 tests in 18 specs: 231 functional, all passing here (Linux Chromium,
  no GPU, 2 workers), and 6 visual, whose baselines need the Mac.
  `browsercheck`: 41/41. Lints clean.
- `proto/` (gitignored) holds the older prototypes. The crane prototype was
  delivered as its own zip; the brief, the plan and three stills of the
  finished desk are in `moodboard/v7-crane/`.

---

## 1. What this project is

MIMEI is a quiet desk for learning Roblox Luau from absolute zero. Nothing in
the browser executes Luau: every script is meant to be typed into the
learner's own Roblox Studio, and this site is the workstation around that
loop.

| the course | the machine |
|---|---|
| the course | the filesystem at `~/roblox-luau` |
| a unit | a directory (`unit-03-decisions/`), a roman numeral on the desk |
| a lesson | a **session**: one lesson on the study's pane of glass |
| a cheatsheet | a **man page** |
| a goal | a checkpoint the machine tracks |
| a Studio task list | a **runbook** |
| a predict question | a **probe** |
| a folded solution | `solution.lua` |
| progress | **checkpoints** reached (210 in the course); tonight's study time and the week |
| the desktop | the **desk**: a crane over a city at night |

The whole course is real content in `content/*.md`, merged into
`src/data/course.js` (52 written lessons in 12 units).

---

## 2. Run it

```bash
./serve.sh                 # http://localhost:8925
./serve.sh 3000            # another port
```

No build step. `file://` will not work because lesson markdown is fetched at
runtime.

Useful URL knobs:

- `?noboot` — skip the start-up (the dark while the first picture loads).
- `?fx=0..3` — pin the effects level (and so the desk's motion: 0 Still,
  1 Calm, 2–3 Full).
- `?time=23:47` — pin the desk's clock and scene (01:30–05:00 gives Late).
- `?scene=night|late|ice` — force the scene on every workspace.
- `?manual` — drive the desk by hand: `window.STEP(dt)` advances its clock,
  for frame-exact films.
- `#/2.1` — open a stop on workspace 2.
- `Alt+1` desk · `Alt+2` lessons · `Alt+3` manual · `Alt+4` settings.

Use `http://localhost:8925/` everywhere: progress lives in `localStorage`,
which is per origin, so `127.0.0.1:8925` is a second, empty store.
Playwright runs its own server on **8928** (at `127.0.0.1`, always a fresh
profile).

---

## 3. Tests, lint, screenshots

```bash
npx playwright test                       # the full suite
npx playwright test tests/desk.spec.js    # the desk
npx playwright test tests/a11y.spec.js    # axe + contrast + keyboard

python3 tools/lint_css.py                 # or npm run lint:css
python3 tools/lint_lessons.py             # or npm run lint:content
```

**First run on the Mac: write the visual baselines.** There are none in the
repo (the old ones showed the old desk). Run

```bash
npx playwright test tests/visual.spec.js --update-snapshots
```

then open `tests/visual.spec.js-snapshots/` and look at the six pictures
(`ws1-desk`, `ws1-desk-ice-menu`, `ws2-lesson`, `ws3-man`, `ws4-settings`,
`launcher`; the last three are the cab now) before committing them. After
that, a failing visual test means: read the diff images in `test-results/`
first, update second.

Current status:

- 231 functional tests in 17 specs, run on Linux Chromium without a GPU
  (see §9). The 6 visual tests need the Mac for their baselines.
- `lint_css`: clean. `lint_lessons`: `ok`, no `warn:` lines.
- `tools/browsercheck.py`: all 41 checks across 9 cases pass (run here
  through a stand-in for the Mac's Chrome).

### Playwright quirks

- The suite uses the **system Chrome** (`channel: 'chrome'`); browser
  binaries are not installed. A one-off script should launch
  `chromium.launch({ channel: 'chrome' })`.
- Config: `playwright.config.js`, 2 workers, 1 retry, viewport 1600×1000,
  autostarts a python http.server on 8928.
- Visual shots: `?noboot&fx=0`, reduced motion, the bar clock fixed, the
  desk pinned with `?time=23:47`, the desk's rain and snow canvases masked.
- Under heavy CPU load a few timing tests (the LCP budget, the longest
  blocking task at a cold start, the cold-link keys) can miss, even on the
  retry; they pass alone. Do not chase them unless they fail alone.

### Screenshots

```bash
python3 tools/shots.py --w 1600 --h 1000 --acts "" --no-sheet
```

For exact CSS pixels use Playwright with `deviceScaleFactor: 1`. For the
desk, add `?time=23:47` (and `&fx=0` for a still frame).

---

## 4. File map

```
index.html                 shell markup; loads styles 05→00→…→36→35→37→38→39→41→60
serve.sh                   local HTTP server (8925)

src/main.js                cold start: content, start-up, desk, bar, keymap, hash;
                           the window.ossuary test surface
src/core/
  state.js                 the one localStorage store (ossuary-1): ticks (and so
                           checkpoints: totalCps, TOTAL_CPS = 210), scene,
                           goalMins, nights, unitsSeen; export/import
  nights.js                tonight's study time and the week
  ambience.js, sound.js    the city at night + soft clicks, made in the browser
  wm.js                    tiling window manager (workspace 1 keeps no windows)
  effects.js, keys.js, journal.js, rice.js, walls.js, md.js, find.js
src/desk/                  the desk's picture (ported from proto/crane)
  world.js                 stacks the layers; loads one scene's WebP
  scenes.js                Night / Late / Ice, the weather words, the grade
  stage.js                 the plate's cover-fit, the camera, the hook's sway
  atmos.js weather.js life.js roads.js   cloud/fog, rain/snow, traffic + windows
  led.js ledfont.js pages.js             the LED sign and what it says
  leap.js                  Enter: the view tips down and falls into the city
  clock.js                 one clock for every animation (STEP under ?manual)
src/ui/
  desktop.js               workspace 1: the sign button, the corner, the menu, keys
  boot.js                  the start-up (dark → desk fades in → sign powers on)
  study.js                 workspace 2, the study: the panes, layout, the outline
                           and its lamp, the scripts drawer, the course overlay
  session.js               the lesson: body, place, scripts, ticks, the end card
  margins.js               the weather around the glass (never on a pane)
  drift.js                 workspaces 2–4: the city's traffic behind the glass
  cab.js                   workspaces 3–4: the scene on <html>/<body>, the mark,
                           the soft city
  bar.js                   the cab's bar: 01–04, this workspace's windows as
                           words (on 2, the lesson's steps), the readouts
  course.js, goals.js, man.js, settings.js, launcher.js,
  tty.js, files.js, journal-view.js, window.js
src/data/course.js         GROUPS LESSONS GOALS TASKS PREDICTS (merged content)

styles/
  35-desk.css              the desk and the start-up (Inter + IBM Plex Mono)
  36-riced.css             the shell's structure: bar, seat, windows, tty, files,
                           launcher (its colour is overridden by 41)
  41-cab.css               the cab: the live tokens (Night/Late, Ice), glass, the
                           lamp edge, the bar, the manual as a lesson page,
                           settings, the launcher
  38-study.css             workspace 2, the study (Inter + IBM Plex Mono, #study)
  43-glass.css             the glass of every pane: edge, sheen, grain, deep blur
  37-lesson.css 39-strangers.css   the page's parts; small shell fixes
  20-bar, 21-rail, 30-deck, 34-noctalia         legacy, NOT linked — ignore

assets/crane/              the desk's pictures: 3 city plates (3840×2160 WebP),
                           hook, glass and sky masks per scene, the 未 mark, icon
assets/walls/              the cab's wall: city-night/-late/-ice.webp (+ @320),
                           soft, about 6 KB each
assets/fonts/              self-hosted WOFF2 + licences (Inter is new)
content/*.md               lesson truth (lessons.md + unit-3..12.md)
tools/                     lints, probe, browsercheck, screenshots, content merge
tests/                     the Playwright suite (helpers.js: deskMenu, showScript,
                           readStep, stepMap, study; climbMenu and
                           climbMenuClose still drive the retired climb, §9)
moodboard/v7-crane/        BRIEF.md and BUILD.md: why the desk looks like this
moodboard/v8-climb/        BUILD.md: why the lessons looked like this until v10
                           (the climb, retired); mast photos; climb-*.jpg;
                           proto/climb.css
moodboard/v9-cab/          BUILD.md: why the manual and settings look like this;
                           stills (cab-*.jpg)
moodboard/v10-study/       BUILD.md: why the lessons look like this now, the glass
                           and the drift; stills (*.webp)
```

`_old/`, `vibe/`, `style-tiles/` and `moodboard/` are reference material: do
not delete them or treat them as production.

`assets/crane/` was converted once from the prototype's sources
(`proto/crane/img`: 4K JPEG plates and PNG layers). There is no pipeline for
it; if you replace a picture, keep the file name and the pixel size.

---

## 5. The design contract (short version)

From `DESIGN.md`:

- **One look.** The desk is the city from the crane's hook; the lessons (the
  study) and the manual and settings (the cab) are panes
  of glass over the same city, out of focus. Night and Late dark, Ice light,
  warm light only at the lamp. No theme picker, no wall picker, no accent
  colour.
- **Type.** Inter for words and IBM Plex Mono for code, everywhere.
- **Real numbers only.** No XP, no ranks: progress is checkpoints reached.
- **No fake data.** Every number comes from the course, the clock or the
  learner's saved state. Two things on the desk are mood and never pretend
  otherwise: the weather word names the picture (not a forecast), and the
  ambience is made in the browser.
- **Content is truth.** Never edit `content/*.md` to fit the design.
- **The desk is the first screen**: the crane, the sign, the corner clock and
  a menu that comes with the mouse. No bar, no windows, no panels on it. It
  fits without scrolling from 1280×800 to 1920×1080.
- **A lesson is the study**: one at a time on one pane of glass under the
  cab's slim bar, the weather in the margins and never on the words.
- **Copy is plain English.** The Linux flavour lives in the chrome, the
  terminal and the man pages.

Read `DESIGN.md` for anything visual; this summary is not enough.

---

## 6. What just shipped: the study (and the cab and the crane desk before it)

### The study (workspace 2)

What it does is in DESIGN.md §5; why, in `moodboard/v10-study/BUILD.md`. How
it hangs together:

- **The page and the screen.** `session.js` paints the lesson into
  `#st-scroll .doc` (the title block, a quiet head `.st-sh` over each step,
  code wells, Output panels, runbooks, probes and the end card `.st-end`),
  keeps the place and lists the checkpoints in page order (`checkpoints()`).
  `study.js` owns everything around the page and never touches its body.
- **Layout** (`layout()` in `study.js`): one geometry for the reading pane,
  the drawer and the outline (`geo`), worked out again on every resize. The
  gap is 14px (10px under 900px), the drawer 28% of the width between 360
  and 440px, the page at most 1040px. Under 760px wide the drawer comes over
  the page (`bench-over`); when the page would be narrower than 720px the
  outline folds away (`no-outline`). The pane and the drawer move on
  transforms only, so nothing reflows.
- **The outline** (`nav.rd-outline`): a button per step (`.ro-step`) and per
  checkpoint (`.ro-cp`, `.done` once reached), one tab stop walked with the
  arrows, Home and End (`onOutlineKey()`); `aria-current` marks the step
  being read, and the lamp (`.ro-lamp`) glides to it (`placeLamp()`).
- **The drawer** (`#rd-bench`, `setDrawer()`): `S` or the scripts button
  (`.rd-sbtn`, `aria-controls="rd-bench"`) opens it and `Esc` closes it;
  `state.scripts` remembers it, and it is `inert` while away.
- **The bar lends its middle** (`lendBarMiddle()` in `bar.js`): the study
  hands over the steps as words and `paintLent()` draws them with the lamp
  dot (`.bt-lamp`); `fit-1` and `fit-2` when room runs short.
- **The weather** (`margins.js`) is cut round the pane, and round the drawer
  when it is out, with a 36px feather; one frame and stop on Still.
- **Glass and drift.** `styles/43-glass.css` gives `.win` and the study's
  panes their edge, sheen and grain and, at fx 3, the deeper blur behind a
  lighter fill. `src/ui/drift.js` draws the traffic on one canvas behind the
  glass on workspaces 2–4: 24 fps at most, 12 at fx 1, one frame at fx 0 or
  with reduced motion; a half-size backing store; stopped while hidden or
  booting.
- **The test surface.** `study()` reports the scripts, `courseOpen`, the
  drawer (`open`, `mode`), the outline (`here`, `steps`, `cps`, `shown`), the
  scene, the motion, the geometry (`geo`) and the weather; `drift()`
  reports the traffic.

### The cab (workspaces 3 and 4)

What it looks like is in DESIGN.md §2–§3 and §5; why, in
`moodboard/v9-cab/BUILD.md`. How it hangs together:

- **One scene for the machine.** `sceneNow()` (ui/desktop.js) is the only
  answer: the saved `state.scene` (`night` or `ice`), turned into `late` by
  the clock from 01:30 to 05:00, or `?scene=`. `paintCab()` puts it on
  `<html>` and `<body>` as `data-scene` on every workspace change, every
  30 s and whenever a choice is made (the desk's menu or
  settings), swaps the 未 mark (snow / slate) in the bar and the terminal,
  and paints `city-<scene>` through `core/walls.js` (with its LQIP).
- **Tokens, not overrides.** `41-cab.css` redefines the shared tokens on
  `:root` (`--fg…--fg-4`, `--surface-solid`, `--pane`, `--accent` = the
  text colour, `--lamp`), so older rules that read them follow without being
  rewritten. Small text is solid hex and measured (a11y, both scenes); the
  desk keeps its own scoped tokens (`--cr-*`).
- **The bar** (`bar.js`): `HOME` lists each workspace's own windows (3:
  man, tty, files; 4: settings), `windowsHere()` (core/wm.js) adds anything
  moved there. A word is a real button with `aria-pressed`; clicking the one
  in front hides it, any other is `summon()`ed (core/keys.js, which logs it).
  The repaint is keyed, so the keyboard stays on the same word.
- **The manual** keeps `man.js`'s markup; the lesson look is all CSS, with a
  container query (`.man`, under 560px) for the narrow pane beside the
  terminal and the files: there a line's note drops under its code.
- **The terminal** opens on the 未 mark (`tty.js` `markImg()`, the snow or
  slate picture from `assets/crane/`), the same mark as the bar's.
- **The wall** is made, not drawn: `tools/assets.py` blurs the desk's plates
  (`soft` picks: 768px wide, radius 5, q62) into `assets/walls/`, and
  regenerates `src/data/walls.js`. Only tonight's city loads (~6KB).
- **Removed:** `src/ui/rail.js` and its CSS (`#rail`, `--rail-w`, the stack
  dock), the skull garden (`assets/walls/skull-garden*.webp`; the source
  JPEG stays in `assets/`), the terminal's PETSCII mark, the old peek wording
  ("wallpaper only" is "the city only").

### The crane desk (workspace 1)

What it does is in DESIGN.md §4. How it hangs together:

- **Start-up.** `main.js` calls `runBoot({ ready })`: black until the first
  city picture and the fonts are in (2.5 s at most), then `desktop.js` fades
  the desk in and powers the sign on, on the desk clock. A key or click lifts
  the dark at once and does nothing else. A link to a lesson (`#/2.1`) does
  not wait for the city: `mountDesktop(el, { later: true })` loads it the
  first time the desk is shown.
- **The sign.** `hereStop()` picks the lesson: the open one, else the first
  one not finished. `startPage()` builds its page (`pages.js`): unit and
  stop, title, checkpoints, `▶ BEGIN/RESUME · N MIN` or `REVIEW`. A unit
  finished since the last visit gets one `COMPLETE` page (`state.unitsSeen`).
  `flip(±1)` walks every written lesson and wraps; `openShown()` runs the
  leap and opens the lesson.
- **The clock.** Everything on the desk, every fade included, runs on
  `src/desk/clock.js`. It stops whenever the desk is not on screen (another
  workspace, a hidden tab), so the desk costs nothing behind a lesson.
- **Tonight.** `nights.js` counts while a lesson is open on workspace 2 and
  the page was used in the last 15 minutes. A night ends at 5 a.m.; 10
  minutes make it a study night. One tick never adds more than 90 s, so a
  tab behind Roblox Studio (where the browser slows timers to once a minute)
  still counts, but a sleeping laptop does not. With two tabs, only the last
  one used counts. The seconds are progress: export/import carry them.
- **Motion** is the effects level seen from the desk: Full (fx 2–3), Calm
  (1), Still (0). Reduced motion is always Still.
- **Sound.** On for everyone since MIMEI (the one-time `state.mimei` move
  turned it on), but a browser plays nothing before the first click or key.
  Full level on the desk, half elsewhere.
- **The bar** (workspaces 3–4; the desk and the lessons own the screen)
  numbers the four workspaces (`01`–`04`, the current one named), names
  this workspace's windows, and shows the checkpoints reached
  (`9/210 checkpoints`).
- **Fallback.** If the city cannot load, the journal says so and the sign
  becomes a plain text button (`.no-world`); the menu still works.

### The rename

On screen only: the tab title, the bar, the start-up, the icon, the about
text and the export file (`mimei-progress-<date>.json`). The store
`ossuary-1`, `window.ossuary`, `data-rice="ossuary"` and the `ossuary:sync`
event keep their names, so existing progress loads untouched. A `luauos-1`
store is still copied over once, as before.

---

## 7. Data flow

- `src/data/course.js` exports `GROUPS` (12), `LESSONS`, `GOALS`, `TASKS`,
  `PREDICTS`; `writtenLessons()` gives the 52 the sign can show.
- `state.js` stores goal ticks (indexes into `GOALS[id]`); checkpoints are
  counted from them (`totalCps()`, 210 in all). XP is still derived for old
  tools, and nothing on screen shows it. `lessonProgress(id)` gives
  `{have, total, ratio}`.
- `state.nights` is `{ 'YYYY-MM-DD': seconds }` (the evening's date), the
  last 400 nights; `addStudy()` writes only that night and never lowers it.
- `state.scene` is `night` or `ice`; Late is never saved, it is the clock.
  The desk, the study and the cab (`paintCab()`) all read `sceneNow()`.
- `window.ossuary.desk()` reports the sign's page, the menu, the motion, the
  scene and the world; `nights()` reports tonight and the week; `study()`
  reports the study (the scripts, the course overlay, the drawer, the
  outline, scene, motion, geometry and weather); `drift()` the traffic;
  `cps()` the checkpoints reached. The tests read these instead of pixels.

---

## 8. Fit

Nothing meets or clips at 1280×800, 1366×768, 1440×900, 1600×1000,
1920×1080 or 900×700; below 760px wide the bottom-right corner stacks under
the clock. Phones and tablets are not a target (agreed 5 Nov), but small
screens keep working. In the study the drawer comes over the page below
760px wide, and the outline folds away when the page would be narrower than
720px.
In the cab, below 1000px wide the windows stack in one column under the bar,
and below 620px the bar's words fold away (the apps button stays).

---

## 9. Testing state

- `desk.spec.js` (19) is the desk: a fresh save, the city loading on sight
  and holding off the desk, flips, Enter and click with the leap, reduced
  motion, the menu, Night/Ice, `?time=`, motion = effects, COMPLETE once, the
  move to MIMEI, tonight's time, the plain-button fallback, the six sizes,
  and the shell's own classes kept off the desk.
- **v10, still to do: the specs that reach for the climb.** In this sandbox
  the first 73 of 223 tests gave 21 failures: 13 in `course.spec.js`, 5 in
  `critique-bugs.spec.js` and 3 more, none yet checked against the study.
  Start with `tests/helpers.js` (`climbMenu`, `climbMenuClose`, `openGoals`,
  `readStep`, `showScript`), then `lesson`, `course`, `critique-bugs`,
  `shell`, `perf`, `followup`, `review`, `visual`, `man`, `reading`,
  `strangers` and `wallpaper`.
- Before v10 the lesson specs were rewritten for the climb: `lesson.spec.js` (the page,
  the floors and landings, the sign, the top, one lesson at a time, the
  workbench in the menu), plus the climb's parts of `a11y`, `course`,
  `critique-bugs` (#4 is now "the title scrolls away and the sign keeps the
  place"), `followup` (#7: nothing on the mast or in the corners covers a
  focused control), `goals` (checkpoints, no XP), `reading` and `look` (the
  workbench, opened with `showScript(page, k)`), `review`, `shell`,
  `strangers` (the floors are real buttons) and `tabs`. The menu is brought up
  with `climbMenu(page)` and put away with `climbMenuClose(page)`; read a
  step with `readStep(page, n)`.
- The older review specs (`critique-bugs`, `followup`, `review`,
  `strangers`, `tabs`, `look`, `reading`) were moved to the new desk where
  they touched it: the sign is `#cr-sign`, the menu is brought up with
  `deskMenu(page)` before its notes (`#oss-revisit`, `#oss-bak`) are
  clicked, and the Terminal/Files tests use workspace 3.
- The cab: `shell.spec.js` (the bar's numbers and words; open, bring
  forward and put away from the bar; stack mode at 900px and 390px; no
  rail; the wall is the soft city), `wallpaper.spec.js` (the city wall, the
  scene control in settings), `a11y.spec.js` (axe on the manual, settings
  and the launcher in Ice too; the reading colours in Night and Ice) and
  `perf.spec.js` (one soft city, under 64 KB).
- `perf.spec.js`: the cold start holds the city picture back and checks that
  a key lifts the dark at once and that the dark never lasts past ~2.5 s.
- Last full run here: Linux Chromium, no GPU, 2 workers, 1 retry: see the
  numbers in §3. On the Mac, run the whole suite once and expect green.

When changing the lessons, run `npx playwright test tests/lesson.spec.js
tests/a11y.spec.js tests/reading.spec.js` first.

When changing the desk:

1. Run `npx playwright test tests/desk.spec.js tests/a11y.spec.js`.
2. Look at it at 1280×800 and 1920×1080, Night and Ice, before touching the
   visual baselines.
3. Update snapshots only after reading the new pictures.

---

## 10. Known issues / sharp edges

- **Visual baselines are missing until the first Mac run** (§3).
- **Sound needs a first click or key** (a browser rule). Sound on means "on
  from the first click".
- **Internal names say ossuary on purpose.** Do not rename `ossuary-1`,
  `window.ossuary`, `data-rice="ossuary"` or `ossuary:sync`: a rename there
  loses everyone's progress or breaks the tests.
- `styles/00-tokens.css` is overridden by `36-riced.css` and then by
  `41-cab.css` for the shell; the load order in `index.html` matters.
  `20-bar`, `21-rail`, `30-deck` and `34-noctalia` are not linked.
- **The shell's class names reach the desk.** The shell styles `.goal`
  (the goals list) and `.live` (a breathing dot) globally; on the desk they
  once turned tonight's time grey on Ice and made the menu pulse. New class
  names on the desk start with `cr-` (`.cr-tonight`, `.cr-live`).
- The desk's pictures are big (about 1 MB per scene); only the scene on
  screen loads. Do not preload the others.
- The traffic, rain and snow are drawn on canvases and are random. `?fx=0`
  (Still) stops them for screenshots; the visual tests also mask the weather.
- The tests' timing budgets assume a quiet machine; see §3.
- `tools/shots.py` may capture at a non-1 device scale; use Playwright for
  exact pixels.
- **Offline sandboxes have no axe-core.** `reading.spec.js` and
  `review.spec.js` import `@axe-core/playwright`; where it cannot be
  installed, a local stand-in makes their axe checks fail on purpose, and
  those failures are not real. On the Mac, `npm install` brings the real one.
- **Rain in the cab sits behind the panes**: it shows in the gaps and
  faintly through the glass, drawn in the text colours (white and city blue
  at Night, slate in Ice). It is off by default and stops at effects 1.
- **`?scene=` wins over the scene control.** With it in the URL, settings
  still saves a choice, but the screen stays on the forced scene.
- **New colour in the cab reads the tokens.** A hard-coded colour on
  workspaces 3–4 will be wrong in one of the two scenes; check anything new
  with `?scene=ice` as well as Night.

---

## 11. Suggested next steps

1. **Move the climb's specs to the study** (§9), then on the Mac run
   `npx playwright test`, write and review the visual baselines (§3;
   `ws2-lesson` is the study now; `ws3-man`, `ws4-settings` and
   `launcher` are the cab), then commit.
2. Live with the study for a few evenings: is the drawer ever in the way,
   does the outline's lamp keep up, is the drift calm enough behind the
   words?
3. Live with the cab for a few evenings: is the city too faint or too busy
   behind the panes, does Ice read in daylight, is the lamp edge enough to
   find the window in front?
4. Optional: a pipeline script for `assets/crane/` like `tools/assets.py`,
   so a new picture is one command.

---

## 12. Copy-paste kickoff for the next agent

> You're taking over **MIMEI** in `/Users/angeladamian/Documents/cozy3`, a
> no-build static site that teaches Roblox Luau. Read `HANDOFF.md` and
> `DESIGN.md` first, then `moodboard/v7-crane/BUILD.md`,
> `moodboard/v10-study/BUILD.md` and `moodboard/v9-cab/BUILD.md` for the
> desk's, the lessons' and the manual and settings' decisions. Run
> `./serve.sh` and `npx playwright test`; if
> `tests/visual.spec.js-snapshots/` is empty, write the baselines with
> `--update-snapshots` and look at them before committing. The desk lives in
> `src/ui/desktop.js`, `src/desk/` and `styles/35-desk.css`; the lessons (the
> study) in `src/ui/study.js`, `src/ui/session.js`, `src/ui/margins.js` and
> `styles/38-study.css`; the manual and settings (the cab) in `src/ui/cab.js`,
> `src/ui/bar.js` and `styles/41-cab.css`. The store key stays `ossuary-1`. Keep every number
> real (checkpoints, never XP), never edit `content/*.md` to fit the design,
> and ask before changing the desk's, the study's or the cab's look, the bar
> or the content.

---

## 13. Definition of done for the next change

- `npx playwright test` passes on the Mac.
- `python3 tools/lint_css.py` is clean.
- `python3 tools/lint_lessons.py` reports `ok` with no `warn:` lines.
- New behaviour has a test or a checked screenshot at 1280×800 and
  1920×1080.
- If the look changed, baselines were reviewed and refreshed deliberately.
- `DESIGN.md` still describes what is on screen.
