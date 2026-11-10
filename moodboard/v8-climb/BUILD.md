# v8 · The Climb — workspace 2

Agreed 5 Nov 2026. This is why the lesson pages look the way they do; what is
on screen is in `DESIGN.md` §5, how it is built is in `HANDOFF.md` §6.

## The idea

The desk (workspace 1) is the view from a tower crane over the city. A lesson
is the climb back up that crane: you read on the mast. The section headings
are its floors, the checkpoints are numbered landings, the last checkpoint is
the top, and the LED sign from the hook says where you are.

## Decisions

- **Hybrid camera.** Cinematic (the sharp photo, the page on a dark glass
  sheet) when a lesson opens (held 1.4 s), while its title is in view, and at
  the top. Quiet (the photo out of focus, a drawn lattice, the page on a soft
  shade) while reading. A 1.2 s focus pull between them; at once on Still,
  under reduced motion and at fx 0 (fx 1 still animates).
- **You** are a warm lamp (`#ffb46b`): the only warm light on the screen.
- **Floors** are the section headings. **Landings** are the checkpoints,
  numbered. The **sign** reads `UNIT · n.n` over `CHECKPOINT n/N`, flashes
  `CORRECT` after a right answer, and says `COMPLETE` when the lesson is done.
- **Scenes:** Night and Late are dark, Ice is light, as on the desk.
- **No XP, no ranks.** Progress is checkpoints reached, real numbers only
  (210 in the course). The rank ladder and every XP figure are gone from the
  screen; the store keeps its old fields so nothing saved is lost.
- **One lesson at a time.** No tabs; `[` and `]` walk the line.
- **Weather in the margins only**, never on the words.
- **Line notes** fold under their line in the page (hover or Tab shows them);
  the workbench shows them always.
- **The menu** (`Esc`, the `esc · menu` hint, the screen's top or left edge,
  or `Tab`) holds the course rail, the workbench and the corners; a click on
  the dimmed page or `Esc` puts it away.
- **The lessons own the screen**, like the desk: no bar, no rail, no wall on
  workspace 2. The bar stays on the manual and settings.

## Sources

- `mast-night-source.jpg`, `mast-late-source.jpg`, `mast-ice-source.jpg`: the
  three mast photographs the plates in `assets/climb/` (sharp and `-soft`)
  were made from.
- `climb-open.jpg`, `climb-reading.jpg`, `climb-menu.jpg`, `climb-ice.jpg`:
  four stills of the finished lessons (2.1 at 1440×900, 23:47): the
  cinematic open, the quiet read, the menu, and Ice on a code step.
- `proto/climb.css`: the prototype's stylesheet, kept for reference. The
  shipped styles are `styles/38-study.css` and `styles/37-lesson.css`.
