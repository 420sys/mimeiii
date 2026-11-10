# MIMEI 未: redesign brief (v11 whole, Nov 2026)

Built from the whole moodboard (every folder here, plus `vibe/`), the seven
images attached on 10 Nov 2026, a colour measurement of all of them, and
sixteen answered questions. This round is prototypes only: nothing in the real
site changed. The prototypes are in `style-tiles/redesign-2026-11-10/`.

The seven attached images are `v6-lunar/01` to `07`. The other two in that
folder (`08` LED columns, `09` glass shatter) were not attached; ten files was
the upload limit, so that is not read as a decision.

## The board, measured

Every image was shrunk and its pixels sorted by tone and by hue family (the
script and its output are kept with the prototypes' notes; the gallery page
shows the swatches).

| Group | Images | Near-black | Near-white | Of the coloured pixels |
|---|---|---|---|---|
| The seven attached | 7 | 21% | 22% | **blue 53%, teal 35%** (88%), magenta 4% |
| Megacity (01, 02, 06) | 3 | 18% | 1% | blue 66%, teal 31% (97%) |
| Neo-Akiba (07) | 1 | 23% | 6% | blue 44%, teal 18%, yellow 10%, green 9% |
| Filigree (03, 04) | 2 | 33% | 35% | only 15% is coloured at all; of that, teal 77% |
| 2000s digital art (05, 09, v5) | 11 | 22% | 13% | blue 70%, teal 29% (99%) |
| `vibe/` | 20 | 18% | 1% | blue 55%, violet 18%, magenta 14%, orange 7% |
| Everything | 42 | 22% | 6% | blue 57%, teal 13%, violet 11%, magenta 9% |

Read plainly: in what was attached, nine tenths of all colour is blue or teal.
A fifth of it is black ground and a fifth is white ground, so a dark mode and
a light mode are both native to the board. Warm and hot colour is under five
per cent everywhere except `vibe/`, where the lavender and pink live.

## What the board says

1. **Cold light in the dark.** Colour is rarely the subject. Light is: lit
   windows, a lit billboard, a hologram, white-hot glass. The hue stays between
   teal and blue while the brightness does the work.
2. **One enormous thing and one very fine thing.** A hologram as tall as a
   tower over thousands of tiny windows. A crest over hair-thin filigree. A
   white field crossed by hairline bars. Almost nothing at a middle scale.
3. **Lettering is part of the building.** Brand names on towers, billboards,
   vertical signs, script under a crest, seals in circles. Words are never a
   caption under the picture.
4. **Ornament has two shapes.** It grows out of one corner (04, 05, the spades
   piece), or it stands symmetric like a coat of arms (03).
5. **Two grounds, black and white.** Night scenes, and white pages with black
   ink and one cool tint. Ice is not an afterthought on this board.
6. **Screens inside screens.** The `vibe/` folder is riced desktops, windows,
   widgets, terminals. The small-Linux fiction comes from here, and stays.
7. **Height, weather and nobody about.** Rain, haze, snow; seen from high up or
   from the street looking up; people absent or tiny.
8. **A 2000s hand.** Glossy black, shards, thin interface bars, micro type:
   the digital art of 2003 to 2008, drawn with care.

Missing from the board, so missing from the designs: warm grounds, pastel
flat interfaces, soft friendly shapes, daylight nature, faces.

## The answers (10 Nov 2026)

| Question | Answer |
|---|---|
| Why start over | Just exploring: today's MIMEI is liked; see what else is possible first |
| Loudness | Loud home, calm page |
| Most you | Neon megacity; skulls and filigree |
| Colour | Teal and ice blue |
| Skulls | Gone |
| Anime | None |
| Japanese | Only the 未 mark |
| Night and Ice | "Make them perfect, tailored to my taste, go all out": both |
| The small Linux | Keep all of it |
| Name | MIMEI 未明 is final |
| Rewards | Checkpoints only |
| Sound | Ambience only |
| Who opens it | Me and portfolio visitors |
| Pictures | Any mix |
| Screens | MacBook and a big monitor |
| GitHub | Push all of it |

Two answers meet: filigree is "most you", and skulls are gone. So the
ornament stays and the skull leaves: wings, scrollwork, tracery, ironwork,
splatter and script, carrying the 未 mark instead.

One answer changed an old decision: v7 was MacBook only. A big monitor counts
again, so every prototype is checked at 1440 × 900 and at 2560 × 1440.

## The rules this gives every direction

- Teal and ice blue lead. White and near-black are free. No second hue family.
- The desk is loud. Workspaces 2 to 4 are calm: ornament keeps to the margins,
  the edges and the small parts.
- Night and Ice are each designed for themselves.
- No skulls, no anime, no Japanese but 未.
- The machine stays whole: four workspaces, the bar, the study, the manual,
  the terminal, the files, settings, the launcher, the course.
- Progress is checkpoints. Nothing is earned, unlocked or filled in.
- Real words and real numbers only (`DESIGN.md` §11.3 and §11.4 still hold).
- Everything in the mock-ups is drawn in code: SVG, canvas and CSS.

## The directions

All five run on one shared machine (`style-tiles/redesign-2026-11-10/kit/`)
with the site's real course table, the real text of lesson 3.1 and the real
decisions cheatsheet. A direction is a desk, a backdrop, a course map and a
stylesheet on top of it.

| | Direction | The desk | Leads with | Warm lamp |
|---|---|---|---|---|
| 0 | Today | The crane's city and the sign, unskinned: the baseline | what you have | yes |
| A | Hologram | A generated megacity from above; a tower-high hologram of 未; a white billboard names the lesson | megacity, cinematic | yes, one |
| B | Filigree | A printed plate: 未 carried by wings and scrollwork; ice ink on black, black ink on white | filigree, graphic | no |
| C | Signal | A street of signs: the biggest is the lesson, twelve blade signs are the units, ironwork brackets | megacity, typographic | yes, one |
| D | Rose window | A cathedral of glass in the megacity: twelve petals, one pane per lesson, 210 beads | both, as architecture | no |

A and C put the megacity first and keep filigree as a jewel (a halo ring, the
ironwork). B and D put the ornament first and keep the megacity as setting (an
engraved skyline, the towers behind the cathedral). D starts from something
already in today's desk: the cathedral with a rose window at the lower right of
the crane's city.

## What is real and what is a stand-in

- **Real:** the course (12 units, 52 lessons, 210 checkpoints, 1007 minutes),
  lesson 3.1's first three steps, the decisions cheatsheet, the settings rows,
  the clock.
- **Demo:** the learner. Units I and II finished, one checkpoint into 3.1, 24
  of 210, 0:21 of a 1:00 goal. It is held in memory and never touches the real
  store (`ossuary-1`).
- **Not built:** sound, the other 51 lessons, steps 04 to 07 of lesson 3.1,
  goals and the journal, export and import, the start-up.
- **Stand-in:** in the settings row for the scene, the last words read "in the
  lessons" where the site still says "on the climb" (the climb was retired in
  v10; the site's own copy has not caught up).

## My calls (correct any of these)

- **The warm lamp.** "Teal and ice blue" came back without the "one red" in the
  option, so nothing is red. Today's one warm light (the lamp that marks you)
  is kept in A and C and left out of B and D, so both can be seen.
- **Checkpoints as a picture.** D draws all 210 checkpoints as beads round the
  window and lights the ones reached. That is the count itself, not a reward,
  but it sits close to "the world changes", which was not chosen. Say so if it
  is over the line.
- **Wording.** The kicker reads "lesson 3.1" (the site still says "stop 3.1";
  `moodboard/v10-study/BUILD.md` left that open).
- **Type.** New faces are tried per direction (Michroma, Cinzel, Cormorant
  Garamond, Pinyon Script, Tilt Neon, Doto, Anton, Bebas Neue, Unbounded), all
  self-hosted and under the SIL Open Font License. Inter and IBM Plex Mono stay
  where reading and code happen.

## Next

1. Pick a direction, or name the parts to combine (for example A's desk with
   B's pages).
2. One more round on the pick: the desk's motion, sound, the start-up, the way
   into a lesson, and every part of the lesson page.
3. A one-page build plan, agreed before the real site changes, as in v7 to v10.
