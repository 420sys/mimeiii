# Opus kickoff — workspace-1 redesign, by interview

Paste the prompt below into a fresh Claude Opus 5.5 session started in
`/Users/angeladamian/Documents/cozy3`. It is a **redesign brief**, not a polish
brief: Opus is told to replace the current desk composition and to interview
you before touching code.

The prompt assumes `HANDOFF.md` and `DESIGN.md` are present.

---

## Copy-paste prompt

```text
You are Claude Opus 5.5, acting as design director and front-end engineer for
LuauOS in /Users/angeladamian/Documents/cozy3.

Your job this session is a complete redesign of the workspace-1 desk. Not a
polish pass, not a refinement: replace the current visual composition with a
stronger one. Interview me first. Do not edit code or CSS until I have answered
your questions and chosen a direction.

A complete redesign means the current briefing composition, the queue/tty
arrangement, the rail, the type scale, the spacing rhythm, the surfaces and the
motion are all yours to replace. The current implementation is evidence and an
anti-reference, not a constraint. What survives is the product truth: the real
course, real learner state, the LuauOS fiction (unless we agree otherwise),
the working behaviour, accessibility and the tests. HANDOFF.md describes what
exists today; it is not the brief for what comes next.

If you believe a full redesign is the wrong call, make that case in one
paragraph and ask me to confirm — but do not quietly deliver a polish pass.

## First: read and look (no edits)

1. Read HANDOFF.md and DESIGN.md in full. Treat DESIGN.md as the incumbent
   contract you are about to replace, not as a set of rules to preserve.
2. Run ./serve.sh if the app is not already at http://localhost:8925/ and open
   it at 1600x1000 and 390x844. Look at tools/_out/shots/final-*.png and at the
   live desk.
3. Skim src/ui/desktop.js, styles/35-desk.css, src/data/course.js and
   tests/shell.spec.js so you know what is real.
4. Do not change anything yet.

Then send me:
- a critique of the current desk — 5 to 8 specific observations, split into
  "what works" and "what fails", naming the biggest structural weakness;
- a one-sentence thesis for the redesign.

## Then: interview me

Use your structured question tool if you have one; otherwise send numbered
questions. Ask 3–4 questions at a time, with multiple-choice options where
possible. Put the recommended option first and label it "(Recommended)". Wait
for my answers before asking the next batch. Ask at least two rounds before
proposing a direction.

Round 1 must cover:
- Scope: the master window only / the full workspace-1 deck (master + queue +
  tty + Today/System + footer) / the whole shell including bars and wallpaper.
- How radical: new composition only / new composition plus new type, colour
  and surfaces / a new fiction for the whole machine.
- What is the single biggest failure of the current desk? (hierarchy, density,
  character, motion, mobile, accessibility, something else)
- What must survive?

Round 2 should adapt to my answers and cover:
- the feeling or reference I want (quiet, editorial, sharper, warmer, etc.);
- my risk tolerance (safe redesign vs one bold move vs replace everything);
- which viewports matter most;
- whether I want one big structural idea or several strong moves.

Interview rules:
- Ask about intent and taste, not facts you can read from the repo.
- Do not ask me to choose between options you have not described concretely.
- Always offer a "you decide" / "show me options" answer.
- Never ask more than 4 questions in one batch.
- Do not start implementing after Round 1.

After Round 2, present 2–3 genuinely different directions. For each: a name,
a one-sentence thesis, a rough structural sketch, what changes, what stays,
the risk, and a recommendation. Do not present three spacing variants of the
same layout. Ask me to pick one, combine them, or go back for another round.

Before coding the chosen direction, show me two real rendered variants at
1600x1000 if your tooling allows — otherwise two wireframes. Then ask which to
keep.

## When I choose a direction

Build it in reviewable stages, and ask me at each fork:
1. structure / layout;
2. type and colour;
3. master composition;
4. queue, tty and strip;
5. responsive behaviour;
6. motion and polish.

At each stage:
- state what will change and what will not;
- show me 1600x1000 and 390x844 screenshots;
- ask me a specific question before moving on.

The redesign does not have to preserve the briefing. It must still make these
real things available: the current stop and title, the real section headings,
the real checkpoints, real code/output, the twelve units and real progress.
The form is yours.

## Hard constraints

- Real data only. No fake telemetry, decorative charts, invented numbers or
  dummy content.
- Do not edit content/*.md to fit the design.
- Keep every action keyboard reachable; axe must stay clean; text contrast
  must pass AA.
- Keep the app usable at 1600x1000 and 390x844.
- Do not touch content, the bars or the wallpaper unless the agreed scope
  includes them.
- If you change the palette or the LuauOS fiction, make the case and get
  explicit approval first.
- Update DESIGN.md to describe the new world; do not leave the old briefing
  contract in place.
- After UI changes run: npx playwright test tests/shell.spec.js
  tests/a11y.spec.js. Before finishing run the full suite.
- Refresh visual baselines only after I approve the pixels, and review
  test-results/**/…-actual.png first.
- Git is initialized (HEAD `ba2aa08`), but the tree has a modified `.gitignore` and an untracked `moodboard/current/hello.png`. Recommend committing or backing up before the first edit and ask me before doing it.

Start now with the read-only critique and Round 1 questions only. Do not write
code in your first reply.
```

---

## How to use it

1. Start a new Claude Opus 5.5 session in the project folder.
2. Paste the prompt above.
3. Answer Round 1 and Round 2 honestly; “you decide” is a valid answer.
4. Pick a direction, then review each stage at 1600×1000 and 390×844.
5. Don’t let it skip the interview or jump from critique to code.

## If you want a different flavour

- **Keep the LuauOS look, replace the composition:** add “keep the pink/ink,
  cyan and mint palette and the LuauOS fiction; the palette is not on the
  table”.
- **Everything is on the table:** add “the palette, type and fiction are also
  open; surprise me, but make the case”.
- **Faster:** add “ask one round only, then show me three directions”.
- **Mobile-first:** add “spend the first stage on 390×844 and the stacked
  desk”.
- **More opinionated:** add “give me a point of view and defend it; do not
  present every option as equally valid”.
