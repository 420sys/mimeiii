# Redesign prototypes, 10 Nov 2026: how a direction is built

Prototypes only. Nothing in the real site (`index.html`, `src/`, `styles/`,
`content/`, `assets/`) changes in this round. Everything lives under
`style-tiles/redesign-2026-11-10/`.

## The brief (the owner's answers, 10 Nov 2026)

| | |
|---|---|
| Why | Exploring. He likes today's MIMEI and wants to see what else is possible before committing. |
| Most him | **Neon megacity** (rain, billboards, holograms, vertical signs) and **filigree** (tattoo and tee-graphic ink: scrollwork, wings, splatter, script). |
| Colour | **Teal and ice blue.** |
| Loudness | **Loud home, calm page.** The desk goes all out. The reading column stays quiet. |
| Night and Ice | Both, made perfect: each mode designed for itself, not one inverted into the other. |
| Out | **No skulls. No anime. No Japanese except the 未 mark.** |
| Kept | The name MIMEI and the 未 mark. The whole machine: workspaces 1 to 4, the bar, the terminal, the files, man pages, the launcher. |
| Progress | **Checkpoints only.** No XP, ranks, badges, collectibles, or a world that fills in as a reward. |
| Sound | Ambience only (a switch in the mock-ups; they make no sound). |
| Who | Him, and portfolio visitors: the first ten seconds have to impress a stranger. |
| Screens | MacBook (1440 × 900) **and a big monitor** (2560 × 1440). |
| Pictures | Any mix in the real build. In these mock-ups everything is drawn in code. |

Still true from the site's own contract (`DESIGN.md`): no build step; no fake
data (every number comes from the course, the clock or the learner); lesson
text is never edited to fit a design; nothing readable under 11 px; text
contrast at least 4.5:1 (the quietest text too); reduced motion is respected.

## What a direction is

A folder beside `kit/` with three files. `0-today/` is the smallest example.

```
a-hologram/
  index.html   links ../kit/fonts.css, ../kit/os.css, skin.css, then desk.js
  skin.css     the look: tokens for Night and Ice, then every part restyled
  desk.js      boot({ id, name, desk, wall, map, decorate, leapMs })
```

`kit/os.js` builds everything the directions share, with the site's real
words and numbers, and calls you back:

| hook | what you get |
|---|---|
| `desk(el, api)` | Workspace 1. `el` is the whole screen and it is yours. This is the loud part. |
| `wall(el, api)` | Optional. The backdrop behind workspaces 2 to 4 (`#wall`, full screen, under the panes). Keep it quiet. |
| `map(el, api)` | Optional. Your own picture of the course inside the overlay `#course` (C opens it). Without it, a plain list is shown. A lesson is opened with any element carrying `data-open="3.1"`; `data-act="close"` closes. |
| `decorate(kind, el, api)` | Optional. Called once for each part as it is built, so you can add ornament: `bar`, `page`, `outline` (repainted often: keep it cheap and idempotent), `drawer`, `window` (`el.dataset.app` is `man`, `tty`, `files` or `settings`), `step`, `code`, `output`, `table`, `key`, `probe`, `runbook`, `man-sec`, `settings`, `course`, `launcher`. |
| `leapMs` | How long your desk's way into a lesson takes. The machine sends `leap`, waits, then shows workspace 2. |

### The api

- **Course (real):** `UNITS` (12: `n`, `roman`, `title`, `dir`, `mins`, `cps`,
  `lessons[]` with `id`, `title`, `mins`, `checkpoints[]`, `build`), `TOTALS`
  (12 units, 52 lessons, 210 checkpoints, 1007 minutes), `LESSONS`, `order`,
  `lessonById`, `unitOf`, `stateOf(id)` → `done | now | next`, `reachedIn(id)`.
- **The demo learner:** `DEMO` (units I and II finished, one checkpoint into
  3.1, 24 of 210 checkpoints, 0:21 of a 1:00 goal tonight). `checkpoints()` is
  the live count; ticking the last box of the runbook in the lesson reaches
  another one (`on('checkpoint', …)`, and `html[data-flash='cp']` for 3.6 s).
- **The desk's working parts:** `deskParts(el)` returns plain unstyled elements
  you place and style: `sign` (a real `<button class="sign">` with four
  `.sign-l` lines; ← → flip it through all 52 lessons, Enter or a click opens,
  M opens the manual), `clock` (`.dclock-w` weather word, `.dclock-t` time,
  `.dclock-d` date), and the three corners of the menu that comes with the
  mouse and leaves after 2.6 s, Esc pins it: `brand` (未, MIMEI, workspaces),
  `night` (tonight, the week), `tools` (sound, Night or Ice, settings). `el`
  gets `.menu-on` while the menu is up. Or draw your own from `sign(id)`,
  `clock()`, `tonight()`, `week()`; `on('sign', s => …)` follows the flips.
- **Moving:** `go(1…4)`, `openLesson(id)`, `overlay('course' | 'launcher')`,
  `drawer()`, `scene()`, `setScene('night' | 'ice')`, `toggleScene()`, `ws()`.
- **Events:** `on('ws' | 'scene' | 'leap' | 'sign' | 'checkpoint' | 'tick' | 'overlay' | 'drawer' | 'setting', fn)`.
- **Drawing:** `rng(seed)` (seeded, so a generated picture is the same on every
  load), `t()` (seconds; held at 8 under `?shot`), `SHOT`, `reduced`,
  `h(html)`, `$`, `$$`, `esc`, `luau(line)`, `mark.snow` / `mark.slate` (the
  brush 未, as image URLs relative to your folder).

### The page map (classes and states)

- `html[data-scene='night' | 'ice']`, `html[data-ws='1…4']`,
  `html[data-overlay='course' | 'launcher']`, `html[data-drawer='open']`,
  `html[data-shot]`, `html[data-flash='cp']`.
- **Bar** `.bar`: `.brand` (`.mark`, `.brand-name`), `.wss .wsb(.is-here)`
  (`.wsb-n`, `.wsb-t`), `#bar-task` (`.bar-steps li(.is-done | .is-here)` with
  `.bs-n`, `.bs-t`; or `.bar-wins .bw(.is-front)`), `.bar-cps`, `.bar-clock`,
  `.bar-btn`. Hidden on the desk.
- **Study** `#ws2`: `.pane.page` holds `.outline` (`.ol-title`, `.ol-steps
  .ol-step(.is-done | .is-here | .is-view)[data-kind]` with `.ol-n`, `.ol-t`,
  `.ol-cp(.is-reached)`; `.ol-foot` with `.ol-tonight`, `.ol-nav`,
  `.ol-course`), `.page-top` (`.cp-count`, `.btn-scripts`), `.scroll > .prose`
  (`.l-head`: `.kicker`, `h1`, `.meta`; `.step(.is-done | .is-here)` with
  `.step-h`: `.step-k`, `h2`). `.pane.drawer` is the scripts (S).
- **Parts:** `figure.code` (`figcaption`, `ol > li(.has-note)` with `code` and
  `.note`; token spans `.k .b .s .i .n .c .f .v .o`), `figure.output`
  (`.o-line(.is-err)`, `.o-t`, `.o-src`), `.tbl`, `aside.key` (`.key-k`),
  `.probe(.is-answered.is-right)` (`.probe-k`, `.q`, `.opts .opt(.is-picked |
  .is-right | .is-wrong)` with `.opt-mark`, `.verdict`), `.runbook(.is-done)`
  (`.runbook-h`, `ul li label` with `input`, `.box`, `.t`; `.runbook-foot`
  with `.meter i`, `.hint`).
- **Cab** `#ws3`: three `.win(.is-front)[data-app]` (`.win-bar`: `.win-dots`,
  `.win-title`; `.win-body`). `man`: `.man-head`, `.man-scroll > .man-page`
  (`h1`, `.lede`, `.man-sec > h2`), `.man-foot`. `tty`: `.tty-hello` (`.mark`),
  `.tty-log`, `.tty-line` (`.tty-ps`, `.tty-in`); it takes `help`, `ls`,
  `open 3.1`, `man`, `scene ice`, `clear`. `files`: `.f-grid` holds `.f-dirs`, `.f-list
  .f-file(.is-done | .is-now | .is-next | .is-sel)`, `.f-info`.
- **Settings** `#ws4 .win.settings`: `.set .rowset` (`h3`, `.srow`: `.d`,
  `.sub`, `.ctl` with `.seg button[aria-pressed]`, `.sw[aria-checked]`,
  `.btn`), `.kbdlist`, `.about`.
- **Overlays:** `#course` (default `.course-list`: `.co-unit(.is-done |
  .is-now)`, `.co-l.is-done | .is-now | .is-next`), `#launcher .launch`
  (`.la-h`, `.la-in`, `.la-row(.is-sel)`, `.la-f`), `#toast`.

### Styling it

`kit/os.css` has two halves. The layout is ordinary CSS. The default look is
wrapped in `:where()`, so it has **no specificity**: any rule you write wins.
Start by redefining the tokens on `:root` and `:root[data-scene='ice']`
(`--bg --pane --pane-solid --edge --faint --fg --fg-2 --fg-3 --fg-4 --accent
--lamp --well --scrim`, the four `--font-*`, `--radius --gap --bar-h --page-w
--outline-w --drawer-w --measure --read-size`), then restyle parts. Sizes are
in `rem`; the root size grows from 16 px (MacBook) to 21 px (big monitor), so
use `rem`, `%`, `vw`/`vh` and `clamp()`, never fixed pixel layouts.

Fonts, all self-hosted (`kit/fonts.css`): Inter, IBM Plex Mono, Newsreader,
Instrument Serif, Space Grotesk, Geist (the site's own), plus Michroma,
Cinzel, Cormorant Garamond (roman and italic), Pinyon Script, Tilt Neon, Doto,
Anton, Bebas Neue, Unbounded, Anta. For a typeset 未: `'Shippori Mincho B1
Mark'`, `'Yuji Syuku Mark'`, `'Dela Gothic One Mark'` (they hold only 未 and
明). The brush 未 is `.mark` (a mask: it takes `color`).

## Rules for every direction

1. Write only inside your own folder. Do not edit `kit/` or another direction.
   If the kit is in your way, work around it in your folder and say so in your
   report.
2. Both scenes are designed. Check every screen at `?scene=night` and
   `?scene=ice`.
3. The desk is loud; workspaces 2 to 4 are calm. On a reading page ornament
   stays in the margins, the edges and the small parts. Body text is plain,
   at least 17 px equivalent, with a line length the kit already sets.
4. Real words and numbers only. Signs, labels and tickers may use: the course
   (unit and lesson titles, counts, minutes), the clock, the demo learner's
   numbers, the site's own interface words, MIMEI and 未. No invented brands,
   slogans, statistics or coordinates. No lorem ipsum.
5. No skulls, no anime, no Japanese but 未. Teal and ice blue lead; white and
   near-black are free. Do not add a second hue family unless your direction's
   notes allow the warm lamp.
6. Progress is checkpoints. Show state (finished, here, not yet) where the
   machine needs it. Do not build rewards, unlocks or a picture that fills in.
7. Everything is drawn in code (SVG, canvas, CSS). No raster art except the
   site's own 未 mark. No new dependencies, no network requests, no build.
8. Motion: nothing essential depends on it. Under `api.reduced` hold still.
   Under `api.SHOT` draw one settled frame from `api.t()` and stop: no intro,
   no loop (CSS animations are switched off for you, so an element's own style
   must be its settled state). Pause loops when `api.ws() !== 1` or the tab is
   hidden. Cap canvases at a device pixel ratio of 2 and ambient loops at
   about 30 frames a second.
9. Keyboard: the sign is a real button, focus is visible, and nothing is
   reachable by mouse only.
10. It must hold at 1440 × 900 and at 2560 × 1440 with no scrollbars on the
    desk, nothing clipped and nothing stranded in a corner.

## Looking at it

The Preview serves the repository on port 3000:
`http://127.0.0.1:3000/style-tiles/redesign-2026-11-10/<your-folder>/`

```
./capture.sh a-hologram                          # every screen, Night and Ice, 1440 × 900
./capture.sh a-hologram /tmp/big 2560 1440       # the big monitor
SCENES=night SCREENS="1:desk" ./capture.sh a-hologram   # just one
```

Screenshots land in `.hoplite/artifacts/shots/` (not committed). Address
options: `?scene=ice`, `?shot` (one settled frame, no switcher), `?menu` (the
desk's menu held open), `?time=23:47&date=2026-11-05` (pin the clock),
`?motion=still`, `#1 … #4`, `#2.drawer`, `#2.course`, `#2.launcher`.
Keys: `1`–`4`, `C` course, `S` scripts, `N` Night or Ice, `Alt+Enter` or `/`
search, `Esc`, `G` gallery; on the desk `←` `→` `Enter` `M`.
