# v10 · the study: lessons on workspace 2, richer glass and a living city

The user's picks for this round (from main's brief to its helper chat):

- **Vibe:** a late-night study. Calm, roomy, the city faint behind the glass, one warm lamp.
- **Wishes:** richer glass (a deeper blur, an edge of light, a little grain), slow traffic in the city, smoother motion, and the same upgrades on workspaces 3 and 4.

## What shipped

- **The study replaces the climb on workspace 2** (`src/ui/study.js`, `styles/38-study.css`).
  - One reading pane of glass, centred on the city.
  - An outline column, with the warm lamp on the current step.
  - The scripts drawer (S). It slides in beside the page, or over it on narrow screens.
  - The mast, the rail and the climb sheet are gone. The weather margins live on as `src/ui/margins.js`, around the glass and never on it.
- **The bar lends its words to the lesson** (`src/ui/bar.js`, `fitLent`).
  - It shows the step numbers, with a lamp dot on the current step.
  - When space runs out, it keeps only the current name (fit-1), then no names (fit-2).
- **Glass** (`styles/43-glass.css`).
  - Every pane gets an edge of light along the top, plus a faint sheen and grain under the words.
  - At fx 3 there is a deeper live blur (1.5× `--glass-blur`) behind a lighter fill (`--pane-glass`).
  - At fx 2 and below, the panes keep the cab's solid fill.
  - The focused pane keeps its lamp edge.
- **Drift** (`src/ui/drift.js`).
  - Soft headlights (warm white) and tail-lights (deep red) move along the plate's light trails at 0.42× the desk's speed.
  - It reuses the desk's road traces and lanes.
  - Late is dimmer and sparser; Ice is fainter and greyer.
  - It runs on workspaces 2–4 only, and never while hidden or booting.

## Geometry at 1440×900

- The reading pane is 995×840: at x 223 with the drawer closed, x 14 with it open. The drawer is 403 wide.
- The outline is 236 wide (204 when the page is under 940). The lamp is 39 px tall on the title row.
- `layout()`:
  - gap 14 (10 under 900 px);
  - drawer `clamp(28% of width, 360, 440)`;
  - page at most 1040;
  - under 760 the drawer goes over the page.

## Budget, measured headless at 1440×900

- **Drift:** capped at 24 fps at fx 3 and 2, 12 fps at fx 1, one still frame at fx 0 or with reduced motion.
  - 26–28 lights at Night, 20 at Ice.
  - Backing store at half size; nothing is allocated per frame.
- **Motion check:** across two frames 1 s apart, 8264 px (0.64%) changed, all on the roads and none in the sky.
- **Off on the desk:** workspace 1 reports `running: false` and the canvas is hidden.

## Stills

- `study-night`, `study-night-drawer`, `study-ice`, `study-late-drawer`: fx 1, the headless default.
- `study-night-full-fx`: fx 3, with the drift showing at the margins.
- `cab-glass-night`, `cab-glass-ice`: workspace 3 at fx 3.
- `drift-moving`: what changed on screen in one second.

## Open for the next round

- The kicker still reads "STOP 1.0 · SET UP", the climb's wording from `session.js`. Should it say "Lesson 1.0" or "Step"?
- The bar clock shows the real time and ignores `?time=`.
- The launcher keeps its own glass; it was not part of this round.
