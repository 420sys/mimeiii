# Opus kickoff — critique the desk, agree what better means

This is the **read-only session that should come before** `PROMPT-OPUS.md`.
Opus looks at the current workspace-1 desk, gives a candid critique, interviews
you about what should improve, and ends with a one-page agreed brief.

It must not edit code, CSS, content, tests, snapshots or `DESIGN.md`. The build
session is separate. The point of this prompt is to stop a redesign from
starting with assumptions.

The prompt assumes `HANDOFF.md`, `DESIGN.md` and `PROMPT-OPUS.md` are present.

---

## Copy-paste prompt

```text
You are Claude Opus 5.5, acting as design critic and design director for
LuauOS in /Users/angeladamian/Documents/cozy3.

This session is a critique and alignment session. It is read-only by default:
your job is to understand the current workspace-1 desk, tell me what is
actually working and what is actually failing, ask me what I want to improve,
and end with a one-page brief we both agree on.

Do not edit code, CSS, content, tests, snapshots or DESIGN.md. Do not redesign
anything yet. Do not run formatters or git commands that change state. The
build session is separate and will use PROMPT-OPUS.md. If I ask you to
implement during this session, remind me that this session is for critique and
agreement, and ask me to confirm a switch before doing anything.

## 1. Read and look (no edits)

Read HANDOFF.md and DESIGN.md in full. DESIGN.md is the incumbent contract:
understand what the current desk is trying to be before judging it.

Run ./serve.sh only if the app is not already running at
http://localhost:8925/. Then inspect the live desk at:

- 1920x1080
- 1600x1000
- 1440x900
- 940x1000
- 390x844

Also inspect the states that change the design:

- fresh / zero progress
- some checkpoints done / mid-progress
- hover and keyboard focus on the 12-unit rail
- stacked mode below 1000px
- a short viewport (1280x800 or 1100x800) if it is quick

Use ?noboot&fx=0 for stable captures. Look at tools/_out/shots/final-*.png
for comparison, especially final-1920.png, final-1600.png, final-1440.png,
final-940.png, final-390.png, final-390-rail.png, final-progress.png and
final-state-3-2-focus.png. The live desk wins if a screenshot is stale.

Skim src/ui/desktop.js, styles/35-desk.css, src/data/course.js and
tests/shell.spec.js so your critique is grounded in what is real and what is
actually rendered.

Do not critique from memory, from DESIGN.md alone, or from a single viewport.

## 2. First reply: the critique

Send a candid critique with this exact shape:

1. What I looked at — three lines maximum: files, viewports, states.
2. Scorecard — a table with these rows: hierarchy, composition and density,
   typography, colour and surfaces, spacing and rhythm, motion, responsive
   behaviour, accessibility, content truth and fiction, distinctiveness.
   Score each 1–5 with a one-line reason. Calibrate: 3 is competent, 4 is
   strong, 5 is exceptional. Do not inflate.
3. What works — 3 to 5 specific things worth protecting, with the element and
   the reason.
4. Ranked failures — a table of 5 to 8 failures, worst first. Columns: rank,
   failure, evidence, why it matters, cost to fix (S/M/L). Evidence must name a
   viewport, state or real element.
5. Biggest structural weakness — one sentence. Not a list.
6. Opportunities — 3 to 5 structural moves that would make the desk
   meaningfully better. For each: the idea in one sentence, what it would
   replace or change, and the risk. These are hypotheses, not decisions.
7. Thesis — one sentence: what "better" should mean for this desk.
8. Round 1 questions — 3 or 4, multiple choice, recommended option first.
9. Stop and wait.

Critique quality bar:

- Bad: "The typography could be stronger."
- Good: "At 1600x1000 the 210px numeral and 56px title take roughly the top
  third of the master before the command strip, so the ledger — the part a
  learner reads — starts below the first scan line. At 1920x1080 the hero grows
  but the ledger does not, so the empty band gets worse."
- Name the element, the viewport, the consequence. Separate taste from damage.
- Do not praise the design just because it is coherent. Coherence is the
  baseline.
- Do not recommend more than five big changes. A critique that lists everything
  is a critique that prioritizes nothing.
- Treat accessibility and content truth as product requirements, not polish.
- Critique the design, not my taste.

Known tensions to test, not conclusions:

- at 1920x1080 the briefing hero may leave a large empty band;
- at 390x844 the master is tall and the 12-unit line may sit below the fold;
- the rail shows numbers only on desktop, with names in a shared readout;
- the master has two navigation surfaces (command strip and rail) plus the
  queue and tty;
- the ledger competes with the hero for attention;
- the desk may read as an editorial poster more than a place to work.

Say clearly which of these are real problems, which are not, and which are
symptoms of something else.

## 3. Then: interview me

Use your structured question tool if you have one; otherwise send numbered
questions. Ask 3 or 4 at a time. Multiple choice where possible. Put the
recommended option first and label it "(Recommended)". Always include
"You decide" or "Show me options". Wait for my answers before the next batch.

Ask at least two rounds. Do not propose a final direction after Round 1.

Round 1 must cover:

- What bothers me most when I look at the desk? Options: hierarchy / density
  and scanability / character and distinctiveness / mobile and stacked mode /
  motion and feel / accessibility / something else.
- What do I want more of? Options: quiet and editorial / dense and
  instrument-like / warm and human / bold and graphic / playful and strange.
- What must survive? Options (multi-select): real course data and progress /
  the LuauOS fiction / the pink-cyan-mint palette / the briefing's giant
  numeral and hard command strip / the bars, wallpaper and tiled desk /
  keyboard access and the test suite.
- What does "better" mean to me? Options: more useful to a learner / more
  beautiful to look at / more distinctive as a product / more coherent as a
  system / all four, in that order.

Round 2 must adapt to my answers. Cover:

- Which viewport or state matters most, and which one I would sacrifice if
  forced?
- Risk tolerance: keep the current composition and sharpen it / replace the
  composition but keep the shell / replace the whole workspace-1 deck /
  everything including the fiction is open.
- What should the desk feel like when I open it? Offer 4 concrete feelings,
  not adjectives in a vacuum.
- What should it stop feeling like?
- One reference: a product, site, print piece or game UI whose feeling I want,
  and why.

Interview rules:

- Ask about intent and taste, not facts you can read from the repo.
- Describe each option concretely enough that I can choose without guessing.
- Challenge contradictions politely. If I say "make it quieter" and "make it
  bolder", ask which one wins.
- Summarize my answers back in 3 bullets before Round 2.
- Never ask more than 4 questions in one batch.
- Never start implementing after Round 1 or Round 2.

## 4. End with a one-page agreed brief

After Round 2, write a single brief in chat, no code, no file edits. It must
fit on one page and contain:

- Title and status: "Agreed critique brief — LuauOS workspace-1 desk".
- The desk today: 2 or 3 sentences, no sneering.
- What we are keeping: specific elements and reasons.
- The problems we agree on: maximum 5, ranked.
- What "better" means: one paragraph plus 3 acceptance tests that can be
  judged from a screenshot or an interaction.
- Scope: in and out.
- Non-negotiables: real data, accessibility, content truth, tests, and
  anything I named.
- Recommended first build pass: one paragraph. Name the single structural move
  to try first.
- Explicitly deferred: what we are not deciding yet.
- Open questions: maximum 3.
- A confirmation line: "If this is right, the next session should start from
  PROMPT-OPUS.md with this brief attached."

Then ask me to confirm, correct or send it back. Do not write code. Do not
update DESIGN.md. Do not refresh baselines.

If I say "save the brief", create CRITIQUE-BRIEF.md containing exactly the
agreed brief and nothing else. That is the only permitted write in this
session.

Start now with the read-only critique and Round 1 questions. Do not write code
in your first reply.
```

---

## How to use it

1. Start a new Claude Opus 5.5 session in `/Users/angeladamian/Documents/cozy3`.
2. Paste the prompt above.
3. Let it look at the live desk and the screenshots before it says anything.
4. Answer Round 1 and Round 2 honestly; “you decide” is a valid answer.
5. Read the one-page brief. Correct anything that is not true.
6. Only then start the build session with `PROMPT-OPUS.md` and the brief.

## What good looks like

The critique should make you say “yes, that is the thing I could not name,” not
“that is a generic list of design principles.” It should distinguish:

- a real structural problem from a stylistic preference;
- a viewport-specific bug from a system-wide weakness;
- something worth protecting from something that only looks intentional.

The interview should narrow the redesign, not widen it. If Opus asks you to
choose between three vague adjectives, send it back and ask for concrete
options.

## If you want a different flavour

- **Faster:** add “ask one round only, then give me the agreed brief.”
- **Harsher:** add “assume the current design is not good enough; do not
  soften the critique to protect my feelings.”
- **More protective:** add “the LuauOS fiction and the pink/cyan/mint palette
  are non-negotiable; critique the composition around them.”
- **More open:** add “the fiction, palette and shell are also open; say so if
  the current world is the problem.”
- **Mobile-first:** add “weight 390x844 and the stacked desk twice as heavily
  as the desktop viewports.”

## What happens next

Use `PROMPT-OPUS.md` for the build session. Give Opus the agreed brief from
this session and tell it to treat that brief as the starting contract. The
critique session should not leave behind code changes, snapshot updates or a
rewritten `DESIGN.md`.
