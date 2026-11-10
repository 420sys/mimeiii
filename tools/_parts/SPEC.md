# Zero-to-hero course spec

Nothing runs in the browser. Every script is pasted into the learner's own Roblox
Studio. We only write lessons.

## The learning system (every lesson follows it)

1. **Warm up** (retrieval + spacing). The first block of every lesson is a
   `predict=` whose PREDICTS entry has `recall: 'X.Y'` — a question about an
   EARLIER lesson, answered from memory. Pick from 1–3 units back, sometimes
   further (interleaving). Keep it short (2–5 lines of code).
2. **One idea at a time.** Each `##` section introduces one concept with a short
   script and the exact ```output it gives (correct `Script:N` line numbers —
   N is the line the print is on).
3. **Predict before Play.** At least one normal `predict=` per lesson on the new
   concept, ideally targeting a known misconception.
4. **In Studio** checklists (`task=`), 2–4 per lesson. Each one ticks a goal.
5. **Your turn.** At least one challenge per lesson: a precise brief, the Output
   it should give, then a ```solution fence (folded until clicked). Never show
   the solution before the brief.
6. **Fix the bug** in about every other lesson: a broken script, the error or
   wrong output it gives, then a ```solution fence with the fix and a sentence
   on why.
7. **Done when** blockquote at the end + the one idea to remember.
8. Each unit ends with a **Build** lesson (a complete, working, fun thing in the
   world: full script, How it works, Change one number, Make it yours with
   stretch ideas + a task) and a **cheatsheet** (kind 'tool') in the same style
   as the existing variables cheatsheet, including a "Messages you will see"
   table and "The rules".

## Writing rules

- Same voice as unit 2: short sentences, second person, plain words, British
  spelling (colour), no emojis, no hype. Explain every new word the first time.
- Never use a concept before the lesson that teaches it. If a small extra
  sneaks in (like Enum.Material in 2.6), say so in one line.
- Indent code with TABS. Use `task.wait`, never `wait`. Use `local` always.
  Services at the top via `game:GetService`. Parent last.
- In lesson files: never a raw less-than sign or ampersand, even in code.
  Write `&lt;` and `&amp;` (also `&lt;=`). `>` is fine.
  Inside PREDICTS/TASKS/GOALS strings (JS) write them normally; GOALS `t` is
  HTML so use `&lt;` there.
- Output fences: `  -  Server - Script:N` for Scripts,
  `  -  Client - LocalScript:N` for LocalScripts, `  -  Server - ModuleName:N`
  when the print is inside a ModuleScript. `! ` prefix for red errors. Random
  output: say "yours will be different".
- Don't print whole tables expecting text — Studio shows them as an expandable
  `{...}`. Print fields or use table.concat.
- Be technically exact for current Roblox (2026): Humanoid default WalkSpeed 16,
  JumpHeight 7.2 (UseJumpPower false), `Players:GetPlayerFromCharacter`,
  `Instance:WaitForChild`, generalized iteration `for i, v in list do` is
  valid (teach ipairs/pairs as the explicit form), `task.spawn/delay`,
  TweenService, `:PivotTo` for models, DataStores need a published place and
  Game Settings → Security → Enable Studio Access to API Services.
- Where the learner must build something by hand in Studio (a part named Door,
  a ScreenGui), give exact click steps in a task list.
- Lesson length: like unit 2 (roughly 150–260 markdown lines). Build lessons can
  be longer.

## File format

Lesson markdown goes in `content/unit-N.md`, same div format as lessons.md:

    <!-- ═══ 3.1 ═══ -->
    <div id="md-3.1" hidden>
    # Title
    ...
    </div>

Cheatsheet div id: `md-cheat-N`.

App data goes in `tools/_parts/unit-N.js` with exactly these four markers, each
followed by entries in the same shape as app.js (trailing commas):

    //@@LESSONS
    { id: '3.1', kind: 'lesson', n: '3.1', g: 'g3', title: '...', md: 'md-3.1', tag: 'logic', mins: 12 },
    { id: 'cheat-3', kind: 'tool', n: '▸', g: 'g3', title: 'Decisions cheatsheet', md: 'md-cheat-3', tag: 'reference', mins: 3 },
    //@@GOALS
    '3.1': [ { t: '...', xp: 15 }, ... ],
    'cheat-3': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
    //@@TASKS
    'u3-compare': { goal: 0, title: '...' },
    //@@PREDICTS
    'p3-warm1': { recall: '2.3', options: [...], answer: 1, why: '...', goal: 0 },

IDs: tasks `uN-...`, predicts `pN-...` — unique across the whole course.
Every goal of a lesson must be completable by some task (via `goal`) or a
predict (via `goal`); the lesson completes when all goals are ticked.
Warm-up predicts usually have no goal. `why` strings are inline markdown.
Optional predict field `q` overrides the question line.

## The line

| unit | group | lessons |
|---|---|---|
| 3 Decisions | g3 | 3.1 Comparing values (== ~= < > <= >=, booleans as results, = vs ==, 10 == "10") · 3.2 if, elseif, else (truthy/falsy: only false and nil; 0 is truthy; introduce math.random) · 3.3 and, or, not (combining, `x or default`) · 3.4 Build: a mystery chest (random rarity tiers spawn a coloured part) · cheat-3 |
| 4 Loops | g4 | 4.1 while loops (counting, `while true do` + task.wait, day–night cycle, the frozen-Studio / script timeout danger) · 4.2 for loops (numeric for, step, counting down, a row of parts) · 4.3 break, continue, repeat, nested loops (grid of parts) · 4.4 Build: a rainbow staircase (Color3.fromHSV) · cheat-4 |
| 5 Functions | g5 | 5.1 Your own functions · 5.2 Parameters · 5.3 Return values (early return, multiple returns) · 5.4 Functions are values (anonymous functions, passing functions, task.delay/task.spawn — sets up events) · 5.5 Build: a part factory (makePart function builds a small scene) · cheat-5 |
| 6 Tables | g6 | 6.1 Lists (index from 1, #, nil past the end) · 6.2 Looping over lists (ipairs, table.insert/remove/find/concat) · 6.3 Dictionaries (keys, dot vs brackets, pairs, removing with nil) · 6.4 Tables of tables + GetChildren + table.sort with a function · 6.5 Build: a loot table (weighted random drops) · cheat-6 |
| 7 The world | g7 | 7.1 Finding things (FindFirstChild, WaitForChild, GetChildren/GetDescendants, IsA, Clone, Destroy, Folders; learner builds parts by hand) · 7.2 CFrame (position + rotation, CFrame.Angles + math.rad, moving relative to a part, lookAt) · 7.3 Smooth motion with TweenService · 7.4 Build: moving platforms and a spinning coin · cheat-7 |
| 8 Events | g8 | 8.1 Events and :Connect (Touched, finding the player from the hit part) · 8.2 Debounce (cooldown flag, per-player table) · 8.3 Players joining (PlayerAdded, CharacterAdded, PlayerRemoving, :Wait, Disconnect) · 8.4 Clicks and prompts (ClickDetector, ProximityPrompt) · 8.5 Build: a mini obby (kill bricks, checkpoints, prompt-opened door) · cheat-8 |
| 9 Players | g9 | 9.1 leaderstats · 9.2 The character and Humanoid (Health, WalkSpeed, JumpHeight, TakeDamage, Died) · 9.3 Attributes and tags (SetAttribute/GetAttribute/changed signal, CollectionService tags set in Studio) · 9.4 Build: a coin collecting game · cheat-9 |
| 10 Client and server | g10 | 10.1 Server and client (LocalScript, StarterPlayerScripts, LocalPlayer, what replicates) · 10.2 Your first GUI (ScreenGui, TextLabel, TextButton, Activated, UDim2) · 10.3 RemoteEvents (FireServer/OnServerEvent/FireClient, never trust the client) · 10.4 Build: a shop (buy a speed boost with coins, server checks) · cheat-10 |
| 11 Organising and saving | g11 | 11.1 ModuleScripts · 11.2 Templates and models (ServerStorage, Clone, PivotTo, PrimaryPart) · 11.3 Errors on purpose (error, pcall, warn, assert) · 11.4 Saving data (DataStoreService, pcall, PlayerRemoving, BindToClose) · 11.5 Build: coins that save · cheat-11 |
| 12 Hero project | g12 | 12.1 Plan a real game (round-based "Lava Rise": lobby, intermission, round, winners; modules) · 12.2 Build 1: the round loop · 12.3 Build 2: the rising lava and who survives · 12.4 Build 3: the status GUI · 12.5 Ship it and keep going (polish checklist, publishing, reading the Creator Hub docs, debugging method) |

Units 2 and before are written (see content/lessons.md). Later units may use
anything from earlier units — and should, to keep old skills fresh.
