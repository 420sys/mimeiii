# MIMEI: building the desk into the real site (step 3)

A one-page plan to agree before anything in the real site changes. The design is in
`BRIEF.md`; this page only says how it goes into the site.

## What changes
- **Workspace 1 (the desk)** becomes the crane view from the motion prototype: the city, the
  hook and sign, the weather, the clock, the hidden menu and the ambience.
- **It goes from the desk:** the four panels (Now, Today, Queue and the flock), the black hole,
  the falling dive and the field clock. They stay in git history.
- **It stays the same:** lessons (workspace 2), the manual (3), settings (4), the launcher,
  the terminal, the keyboard shortcuts, and all saved progress. XP and rank stay in the top
  bar on the lesson pages.
- **Fixed on the way:** the `studyMig` bug (a one-time clean-up that runs on every load).

## The sign uses real progress
- **Resume:** the lesson you are in (or the first one you haven't finished), its unit, the
  next checkpoint (`CHECKPOINT 2/4`) and the lesson's minutes from the course.
- **Begin:** a lesson you haven't started: `4 CHECKPOINTS` and `▶ BEGIN · 15 MIN`.
- **Unit complete:** the first time you come back after finishing a unit: `UNIT III` /
  `COMPLETE` / `NEXT · IV LOOPS`. After the last unit: `COURSE COMPLETE`.
- **← and →** flip the sign through the other lessons, so you can pick any lesson from the desk.
  Click the sign or press Enter to open the one it shows.

## The corners
- **Top right:** the clock and date (real), and the weather (see question 3).
- **Hidden menu:** the 未 mark, MIMEI and workspaces 01–04 (they switch for real); tonight's
  goal and study nights this week (see question 4); sound, Night/Ice and settings.
- The top bar is hidden on the desk. It is still there on workspaces 2–4.

## My calls (correct any of these)
- **Opening a lesson:** a simple 2D leap for now. The view tips down and falls into the city,
  then the lesson fades in (about 1.5 seconds). With reduced motion it just fades. The real 3D
  leap comes later.
- **Start-up:** the kernel-log screen goes. The desk fades in from black and the sign powers
  on. The climb up the crane comes later.
- **Night/Ice** is remembered. The motion setting (Full, Calm, Still) uses the site's
  existing effects setting, so there is one switch, not two. Reduced motion means Still.
- **Speed:** the city pictures are made smaller (WebP), and only the scene on screen is loaded.
- **Accessibility:** the sign is a real button with the same words as text for screen readers,
  everything works from the keyboard, and the corner text stays readable on bright snow.
- **Tests:** the desk tests are rewritten for the new desk, and the whole suite passes before
  you get it. `DESIGN.md` is updated to describe the new desk.

## How you get it
A zip of the whole site with the new desk, plus a short film of it working. Unzip it next to
your current folder and try it with `./serve.sh`. Your progress shows up, because it is saved
in the browser, not in the folder. When you are happy, it replaces the old folder (with steps
that keep your git history).

## Decisions (agreed 5 Nov 2026)
1. **Latest copy:** the 1 November backup is the latest version of the site.
2. **The name:** MIMEI everywhere: tab title, top bar, start-up and icon. The lesson pages
   keep their colours. Saved progress and the code's internal names do not change.
3. **Weather:** the picture's weather as a word only (drizzle, low cloud, snow). No temperature.
4. **Tonight's goal:** 1 hour, changeable in Settings. Time counts while a lesson is open and
   the page has been used in the last 15 minutes. A night ends at 5 a.m. A night with at
   least 10 minutes of study counts towards the week.
5. **Sound in lessons:** the ambience keeps playing at half volume.
6. **Phone or iPad:** not used. Small screens just keep working.
7. **My calls** above are all fine as written.
