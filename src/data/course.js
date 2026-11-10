/* ════════════════════════════════════════════════════════════════════════
   COURSE DATA — the single source of truth for what the machine teaches.

   GROUPS  the stretches of line (units)
   LESSONS every stop: id, kind, number, unit, title, md div, tag, minutes
   GOALS   what each lesson's checkpoints are, and what they are worth in XP
   TASKS   Studio runbooks: id -> which goal they tick, and their title
   PREDICTS probes: options, the right answer, why, and which goal they tick

   tools/merge_parts.py rebuilds the marked @@LESSONS / @@GOALS / @@TASKS /
   @@PREDICTS regions from tools/_parts/unit-N.js, so new units are added
   there, never here.
   tools/lint_lessons.py and tools/extract_cases.py read this file directly.
   ════════════════════════════════════════════════════════════════════════ */

const GROUPS = [
  { id: 'g1',  label: 'Set up',                 open: true },
  { id: 'g2',  label: 'Variables',              open: true },
  { id: 'g3',  label: 'Decisions',              open: false },
  { id: 'g4',  label: 'Loops',                  open: false },
  { id: 'g5',  label: 'Functions',              open: false },
  { id: 'g6',  label: 'Tables',                 open: false },
  { id: 'g7',  label: 'The world',              open: false },
  { id: 'g8',  label: 'Events',                 open: false },
  { id: 'g9',  label: 'Players',                open: false },
  { id: 'g10', label: 'Client and server',      open: false },
  { id: 'g11', label: 'Organising and saving',  open: false },
  { id: 'g12', label: 'Hero project',           open: false },
];

/* kind: 'home' is the desktop (never in the tree), 'lesson' counts towards
   progress, 'tool' is reference material that is always open. */
const LESSONS = [
  { id: 'home', kind: 'home',   n: '◆',   g: null, title: 'Desktop',                    md: 'md-home', tag: 'home' },

  { id: '1.0',  kind: 'lesson', n: '1.0', g: 'g1', title: 'Set up Roblox Studio',       md: 'md-1.0',  tag: 'set up',    mins: 10 },

  { id: '2.1',  kind: 'lesson', n: '2.1', g: 'g2', title: 'Your first variable',        md: 'md-2.1',  tag: 'variables', mins: 10 },
  { id: '2.2',  kind: 'lesson', n: '2.2', g: 'g2', title: 'Kinds of values',            md: 'md-2.2',  tag: 'variables', mins: 12 },
  { id: '2.3',  kind: 'lesson', n: '2.3', g: 'g2', title: 'Changing a variable',        md: 'md-2.3',  tag: 'variables', mins: 12 },
  { id: '2.4',  kind: 'lesson', n: '2.4', g: 'g2', title: 'Variables that hold parts',  md: 'md-2.4',  tag: 'variables', mins: 15 },
  { id: '2.5',  kind: 'lesson', n: '2.5', g: 'g2', title: 'Where a variable lives',     md: 'md-2.5',  tag: 'variables', mins: 12 },
  { id: '2.6',  kind: 'lesson', n: '2.6', g: 'g2', title: 'Build: a lamp post',         md: 'md-2.6',  tag: 'build',     mins: 20 },

  { id: 'cheat', kind: 'tool',  n: '▸',   g: 'g2', title: 'Variables cheatsheet',       md: 'md-cheat', tag: 'reference', mins: 3 },

  /*@@LESSONS*/
  // ── unit-3 ──
  { id: '3.1', kind: 'lesson', n: '3.1', g: 'g3', title: 'Comparing values',       md: 'md-3.1', tag: 'logic', mins: 12 },
  { id: '3.2', kind: 'lesson', n: '3.2', g: 'g3', title: 'if, elseif, else',       md: 'md-3.2', tag: 'logic', mins: 15 },
  { id: '3.3', kind: 'lesson', n: '3.3', g: 'g3', title: 'and, or, not',           md: 'md-3.3', tag: 'logic', mins: 15 },
  { id: '3.4', kind: 'lesson', n: '3.4', g: 'g3', title: 'Build: a mystery chest', md: 'md-3.4', tag: 'build', mins: 20 },
  { id: 'cheat-3', kind: 'tool', n: '▸', g: 'g3', title: 'Decisions cheatsheet',  md: 'md-cheat-3', tag: 'reference', mins: 3 },
  // ── unit-4 ──
  { id: '4.1', kind: 'lesson', n: '4.1', g: 'g4', title: 'While loops',               md: 'md-4.1', tag: 'loops', mins: 15 },
  { id: '4.2', kind: 'lesson', n: '4.2', g: 'g4', title: 'for loops',                 md: 'md-4.2', tag: 'loops', mins: 15 },
  { id: '4.3', kind: 'lesson', n: '4.3', g: 'g4', title: 'Break, continue, repeat',   md: 'md-4.3', tag: 'loops', mins: 15 },
  { id: '4.4', kind: 'lesson', n: '4.4', g: 'g4', title: 'Build: a rainbow staircase', md: 'md-4.4', tag: 'build', mins: 20 },
  { id: 'cheat-4', kind: 'tool', n: '▸', g: 'g4', title: 'Loops cheatsheet',         md: 'md-cheat-4', tag: 'reference', mins: 3 },
  // ── unit-5 ──
  { id: '5.1', kind: 'lesson', n: '5.1', g: 'g5', title: 'Your own functions',   md: 'md-5.1', tag: 'functions', mins: 12 },
  { id: '5.2', kind: 'lesson', n: '5.2', g: 'g5', title: 'Parameters',           md: 'md-5.2', tag: 'functions', mins: 15 },
  { id: '5.3', kind: 'lesson', n: '5.3', g: 'g5', title: 'Return values',        md: 'md-5.3', tag: 'functions', mins: 15 },
  { id: '5.4', kind: 'lesson', n: '5.4', g: 'g5', title: 'Functions are values', md: 'md-5.4', tag: 'functions', mins: 18 },
  { id: '5.5', kind: 'lesson', n: '5.5', g: 'g5', title: 'Build: a camp',        md: 'md-5.5', tag: 'build',     mins: 25 },
  { id: 'cheat-5', kind: 'tool', n: '▸', g: 'g5', title: 'Functions cheatsheet', md: 'md-cheat-5', tag: 'reference', mins: 3 },
  // ── unit-6 ──
  { id: '6.1', kind: 'lesson', n: '6.1', g: 'g6', title: 'Lists',                md: 'md-6.1', tag: 'tables', mins: 15 },
  { id: '6.2', kind: 'lesson', n: '6.2', g: 'g6', title: 'Looping over lists',   md: 'md-6.2', tag: 'tables', mins: 18 },
  { id: '6.3', kind: 'lesson', n: '6.3', g: 'g6', title: 'Dictionaries',         md: 'md-6.3', tag: 'tables', mins: 18 },
  { id: '6.4', kind: 'lesson', n: '6.4', g: 'g6', title: 'Tables of tables',     md: 'md-6.4', tag: 'tables', mins: 20 },
  { id: '6.5', kind: 'lesson', n: '6.5', g: 'g6', title: 'Build: a loot drop',   md: 'md-6.5', tag: 'build',  mins: 25 },
  { id: 'cheat-6', kind: 'tool', n: '▸', g: 'g6', title: 'Tables cheatsheet',    md: 'md-cheat-6', tag: 'reference', mins: 3 },
  // ── unit-7 ──
  { id: '7.1', kind: 'lesson', n: '7.1', g: 'g7', title: 'Finding things',                md: 'md-7.1', tag: 'world', mins: 20 },
  { id: '7.2', kind: 'lesson', n: '7.2', g: 'g7', title: 'CFrame',                        md: 'md-7.2', tag: 'world', mins: 20 },
  { id: '7.3', kind: 'lesson', n: '7.3', g: 'g7', title: 'Smooth motion with TweenService', md: 'md-7.3', tag: 'world', mins: 18 },
  { id: '7.4', kind: 'lesson', n: '7.4', g: 'g7', title: 'Build: the sky lifts',          md: 'md-7.4', tag: 'build', mins: 25 },
  { id: 'cheat-7', kind: 'tool', n: '▸', g: 'g7', title: 'The world cheatsheet',          md: 'md-cheat-7', tag: 'reference', mins: 3 },
  // ── unit-8 ──
  { id: '8.1', kind: 'lesson', n: '8.1', g: 'g8', title: 'Events and Connect',   md: 'md-8.1', tag: 'events', mins: 20 },
  { id: '8.2', kind: 'lesson', n: '8.2', g: 'g8', title: 'Debounce',             md: 'md-8.2', tag: 'events', mins: 18 },
  { id: '8.3', kind: 'lesson', n: '8.3', g: 'g8', title: 'Players joining',      md: 'md-8.3', tag: 'events', mins: 20 },
  { id: '8.4', kind: 'lesson', n: '8.4', g: 'g8', title: 'Clicks and prompts',   md: 'md-8.4', tag: 'events', mins: 20 },
  { id: '8.5', kind: 'lesson', n: '8.5', g: 'g8', title: 'Build: a mini obby',   md: 'md-8.5', tag: 'build',  mins: 30 },
  { id: 'cheat-8', kind: 'tool', n: '▸', g: 'g8', title: 'Events cheatsheet',    md: 'md-cheat-8', tag: 'reference', mins: 3 },
  // ── unit-9 ──
  { id: '9.1', kind: 'lesson', n: '9.1', g: 'g9', title: 'The player list',              md: 'md-9.1', tag: 'players', mins: 14 },
  { id: '9.2', kind: 'lesson', n: '9.2', g: 'g9', title: 'The character and its Humanoid', md: 'md-9.2', tag: 'players', mins: 16 },
  { id: '9.3', kind: 'lesson', n: '9.3', g: 'g9', title: 'Attributes and tags',          md: 'md-9.3', tag: 'players', mins: 18 },
  { id: '9.4', kind: 'lesson', n: '9.4', g: 'g9', title: 'Build: a coin rush',           md: 'md-9.4', tag: 'build',   mins: 30 },
  { id: 'cheat-9', kind: 'tool', n: '▸', g: 'g9', title: 'Players cheatsheet',           md: 'md-cheat-9', tag: 'reference', mins: 3 },
  // ── unit-10 ──
  { id: '10.1', kind: 'lesson', n: '10.1', g: 'g10', title: 'Server and client',   md: 'md-10.1', tag: 'network', mins: 16 },
  { id: '10.2', kind: 'lesson', n: '10.2', g: 'g10', title: 'Your first GUI',      md: 'md-10.2', tag: 'gui',     mins: 18 },
  { id: '10.3', kind: 'lesson', n: '10.3', g: 'g10', title: 'RemoteEvents',        md: 'md-10.3', tag: 'network', mins: 22 },
  { id: '10.4', kind: 'lesson', n: '10.4', g: 'g10', title: 'Build: a boost shop', md: 'md-10.4', tag: 'build',   mins: 35 },
  { id: 'cheat-10', kind: 'tool', n: '▸', g: 'g10', title: 'Client and server cheatsheet', md: 'md-cheat-10', tag: 'reference', mins: 3 },
  // ── unit-11 ──
  { id: '11.1', kind: 'lesson', n: '11.1', g: 'g11', title: 'ModuleScripts',            md: 'md-11.1', tag: 'organise', mins: 15 },
  { id: '11.2', kind: 'lesson', n: '11.2', g: 'g11', title: 'Templates and models',     md: 'md-11.2', tag: 'organise', mins: 18 },
  { id: '11.3', kind: 'lesson', n: '11.3', g: 'g11', title: 'Errors on purpose',        md: 'md-11.3', tag: 'organise', mins: 15 },
  { id: '11.4', kind: 'lesson', n: '11.4', g: 'g11', title: 'Saving data',              md: 'md-11.4', tag: 'saving',   mins: 20 },
  { id: '11.5', kind: 'lesson', n: '11.5', g: 'g11', title: 'Build: coins that save',   md: 'md-11.5', tag: 'build',    mins: 30 },
  { id: 'cheat-11', kind: 'tool', n: '▸', g: 'g11', title: 'Organising and saving cheatsheet', md: 'md-cheat-11', tag: 'reference', mins: 3 },
  // ── unit-12 ──
  { id: '12.1', kind: 'lesson', n: '12.1', g: 'g12', title: 'Plan a real game',            md: 'md-12.1', tag: 'project', mins: 30 },
  { id: '12.2', kind: 'lesson', n: '12.2', g: 'g12', title: 'Build 1: the round loop',     md: 'md-12.2', tag: 'build',   mins: 30 },
  { id: '12.3', kind: 'lesson', n: '12.3', g: 'g12', title: 'Build 2: the rising lava',    md: 'md-12.3', tag: 'build',   mins: 30 },
  { id: '12.4', kind: 'lesson', n: '12.4', g: 'g12', title: 'Build 3: the status GUI',     md: 'md-12.4', tag: 'build',   mins: 30 },
  { id: '12.5', kind: 'lesson', n: '12.5', g: 'g12', title: 'Ship it and keep going',      md: 'md-12.5', tag: 'project', mins: 30 },
  { id: 'cheat-12', kind: 'tool', n: '▸', g: 'g12', title: 'Lava Rise: the full code',    md: 'md-cheat-12', tag: 'reference', mins: 5 },
  /*@@END LESSONS*/
];

/**
 * The homepage is the desktop, not a lesson — so its editorial copy lives
 * here rather than in lessons.md. Only the headline and its two opening
 * paragraphs come from the markdown, so the tone stays in one place.
 */
const HOME_STEPS = [
  ['Warm up',
   'Every lesson opens with a question about an <b>earlier</b> lesson, answered from memory. Pulling an idea back out is what makes it stick.'],
  ['Predict, then run it',
   'Pick what the <b>Output</b> window will say before you press Play in your own Roblox Studio. The lesson shows the real answer so you know straight away.'],
  ['Your turn',
   'Challenges and broken scripts to fix, with the solution folded away until you have tried. Each unit ends with a <b>Build</b>: something real in your game.'],
];

const HOME_COLS = [
  ['What you need', [
    '<strong>Roblox Studio</strong>, which is free, and a Roblox account to sign in with.',
    'A Windows PC or a Mac. Studio does not run on phones, tablets or Chromebooks.',
  ]],
  ['What it covers', [
    'From your first <strong>variable</strong> to a finished round-based game: decisions, loops, functions, tables, moving parts, events, players, GUIs, client and server, modules and saving data.',
    'Twelve stretches of line. Each one ends with a build and a cheatsheet.',
  ]],
  ['Three habits to start now', [
    '<strong>Predict before you press Play.</strong> Being wrong and finding out why teaches far more than reading the right answer.',
    '<strong>Try before you peek.</strong> Every solution is folded away. A wrong attempt is still practice.',
    '<strong>Break things on purpose.</strong> Misspell a name, delete a quote. Then read what the Output window says.',
  ]],
];

/** Goals — the right-hand panel. Studio tasks and predicts can tick one. */
const GOALS = {
  '1.0': [
    { t: 'Open a Baseplate in Roblox Studio', xp: 10 },
    { t: 'Find the Explorer and Output windows', xp: 10 },
    { t: 'Run a script and read its Output', xp: 15 },
    { t: 'Change the message and run it again', xp: 15 },
  ],
  '2.1': [
    { t: 'Make three variables and print them', xp: 15 },
    { t: 'Print a sentence built from variables', xp: 15 },
    { t: 'Misspell a name and see <code>nil</code>', xp: 20 },
  ],
  '2.2': [
    { t: 'Tell a number from text that looks like one', xp: 15 },
    { t: 'Ask <code>typeof</code> about four values', xp: 15 },
    { t: 'Cause and read an arithmetic error', xp: 20 },
  ],
  '2.3': [
    { t: 'Predict a value after three changes', xp: 15 },
    { t: 'Use <code>+=</code> and string interpolation', xp: 20 },
    { t: 'Watch a variable change over time', xp: 20 },
  ],
  '2.4': [
    { t: 'Store the Baseplate in a variable', xp: 15 },
    { t: 'Create a part from a script', xp: 25 },
    { t: 'See two variables point at one part', xp: 20 },
    { t: 'Move a part through its Position', xp: 20 },
  ],
  '2.5': [
    { t: 'Predict where a variable stops existing', xp: 15 },
    { t: 'Rewrite a script with Roblox naming style', xp: 20 },
    { t: 'Get a type error from <code>--!strict</code>', xp: 25 },
  ],
  '2.6': [
    { t: 'Build the lamp post', xp: 30 },
    { t: 'Change one number and watch it rebuild', xp: 20 },
    { t: 'Make it your own', xp: 30 },
  ],
  cheat: [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  /*@@GOALS*/
  // ── unit-3 ──
  '3.1': [
  { t: 'Print six comparisons and read the answers', xp: 15 },
  { t: 'Predict whether <code>10 == "10"</code>', xp: 15 },
  { t: 'Store a comparison in a boolean variable', xp: 15 },
  { t: 'Write the health check yourself', xp: 25 },
  ],
  '3.2': [
  { t: 'Give an <code>if</code> an <code>else</code> path', xp: 15 },
  { t: 'Predict which path an <code>elseif</code> chain picks', xp: 15 },
  { t: 'Make every path of a chain run', xp: 20 },
  { t: 'Predict what <code>if 0 then</code> does', xp: 15 },
  { t: 'Write the treasure roll yourself', xp: 25 },
  ],
  '3.3': [
  { t: 'Use <code>and</code>, <code>or</code> and <code>not</code>', xp: 15 },
  { t: 'Predict an <code>and</code> with one false side', xp: 15 },
  { t: 'Give a value a default with <code>or</code>', xp: 20 },
  { t: 'Write the night market yourself', xp: 25 },
  ],
  '3.4': [
  { t: 'Build the mystery chest', xp: 30 },
  { t: 'Test every tier on purpose', xp: 20 },
  { t: 'Make it your own', xp: 30 },
  ],
  'cheat-3': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  // ── unit-4 ──
  '4.1': [
  { t: 'Run a countdown and a day–night loop', xp: 15 },
  { t: 'Spot a loop that can never end', xp: 15 },
  { t: 'Predict how many times a loop runs', xp: 15 },
  { t: 'Make a part hop up and stop by itself', xp: 25 },
  ],
  '4.2': [
  { t: 'Build a row of parts with a <code>for</code> loop', xp: 20 },
  { t: 'Predict a total built up in a loop', xp: 15 },
  { t: 'Build a tower that ends in a point', xp: 25 },
  ],
  '4.3': [
  { t: 'Use <code>break</code>, <code>continue</code> and <code>repeat</code>', xp: 20 },
  { t: 'Predict which numbers <code>continue</code> skips', xp: 15 },
  { t: 'Predict how many times a nested loop runs', xp: 15 },
  { t: 'Build a checkerboard with two loops', xp: 25 },
  ],
  '4.4': [
  { t: 'Build the rainbow staircase', xp: 30 },
  { t: 'Reshape it with the settings', xp: 20 },
  { t: 'Make it your own', xp: 30 },
  ],
  'cheat-4': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  // ── unit-5 ──
  '5.1': [
  { t: 'Define a function and call it three times', xp: 15 },
  { t: 'Predict what a function that is never called does', xp: 15 },
  { t: 'Build two cubes with one function', xp: 20 },
  { t: 'Fix a call made above its function', xp: 15 },
  { t: 'Write the dice roll yourself', xp: 25 },
  ],
  '5.2': [
  { t: 'Hand a function an argument', xp: 15 },
  { t: 'Predict which slot an argument lands in', xp: 15 },
  { t: 'Give a parameter a default with <code>or</code>', xp: 20 },
  { t: 'Fix arguments given in the wrong order', xp: 20 },
  { t: 'Write the scoreboard yourself', xp: 25 },
  ],
  '5.3': [
  { t: 'Return a value and use it', xp: 15 },
  { t: 'Predict what a function without <code>return</code> gives', xp: 15 },
  { t: 'Fix a function that falls off its end', xp: 20 },
  { t: 'Write the shop purchase yourself', xp: 25 },
  ],
  '5.4': [
  { t: 'Hand over an anonymous function', xp: 15 },
  { t: 'Predict the order with <code>task.delay</code>', xp: 15 },
  { t: 'Schedule a function for later', xp: 20 },
  { t: 'Fix <code>cheer()</code> handed over by mistake', xp: 20 },
  { t: 'Write <code>doTimes</code> yourself', xp: 25 },
  ],
  '5.5': [
  { t: 'Build the camp', xp: 30 },
  { t: 'Wire the ground to the fence', xp: 20 },
  { t: 'Make it your own', xp: 30 },
  ],
  'cheat-5': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  // ── unit-6 ──
  '6.1': [
  { t: 'Read items out of a list by slot', xp: 15 },
  { t: 'Predict what slot 0 holds', xp: 15 },
  { t: 'Count and grow a list with <code>#</code>', xp: 15 },
  { t: 'Predict two names for one table', xp: 15 },
  { t: 'Write the names list yourself', xp: 25 },
  ],
  '6.2': [
  { t: 'Walk a list with <code>ipairs</code>', xp: 15 },
  { t: 'Predict what <code>table.remove</code> gives back', xp: 15 },
  { t: 'Insert, remove and find items', xp: 20 },
  { t: 'Fix the rock that got away', xp: 20 },
  { t: 'Write the day log yourself', xp: 25 },
  ],
  '6.3': [
  { t: 'Add, change and remove keys', xp: 15 },
  { t: 'Predict a dot used on a variable', xp: 15 },
  { t: 'Walk a dictionary with <code>pairs</code>', xp: 20 },
  { t: 'Fix an <code>ipairs</code> that never runs', xp: 20 },
  { t: 'Write the shop yourself', xp: 25 },
  ],
  '6.4': [
  { t: 'Read and walk a list of dictionaries', xp: 15 },
  { t: 'Predict a sort by length', xp: 15 },
  { t: 'Sort a leaderboard with a function', xp: 20 },
  { t: 'Light up parts found with <code>GetChildren</code>', xp: 20 },
  { t: 'Write the item list yourself', xp: 25 },
  ],
  '6.5': [
  { t: 'Build the loot drop', xp: 30 },
  { t: 'Change the weights and check the counts', xp: 20 },
  { t: 'Make it your own', xp: 30 },
  ],
  'cheat-6': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  // ── unit-7 ──
  '7.1': [
  { t: 'Build a folder of crates by hand', xp: 15 },
  { t: 'Use <code>FindFirstChild</code> and <code>WaitForChild</code>', xp: 20 },
  { t: 'Loop over <code>GetChildren</code> and fix the classic bug', xp: 20 },
  { t: 'Clone a row of crates yourself', xp: 25 },
  ],
  '7.2': [
  { t: 'Turn a part with <code>CFrame.Angles</code>', xp: 15 },
  { t: 'Predict what happens without <code>math.rad</code>', xp: 15 },
  { t: 'Build a ring of stones', xp: 25 },
  { t: 'Walk a part forward and point one at a target', xp: 20 },
  { t: 'Fix the spinning part', xp: 20 },
  ],
  '7.3': [
  { t: 'Tween a part and change how it feels', xp: 20 },
  { t: 'Predict whether <code>:Play()</code> waits', xp: 15 },
  { t: 'Find the tween that never played', xp: 20 },
  { t: 'Write an opening and closing door', xp: 25 },
  ],
  '7.4': [
  { t: 'Build the sky lifts and reach the coin', xp: 30 },
  { t: 'Change the settings and play again', xp: 20 },
  { t: 'Make it your own', xp: 30 },
  ],
  'cheat-7': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  // ── unit-8 ──
  '8.1': [
  { t: 'Connect a handler to <code>Touched</code>', xp: 15 },
  { t: 'Find the player who touched a part', xp: 20 },
  { t: 'Make a lava brick', xp: 20 },
  { t: 'Build the paint pad yourself', xp: 25 },
  ],
  '8.2': [
  { t: 'See how often <code>Touched</code> really fires', xp: 15 },
  { t: 'Add a cooldown flag', xp: 20 },
  { t: 'Give each player their own cooldown', xp: 20 },
  { t: 'Fix the debounce that does nothing', xp: 20 },
  { t: 'Build the score pad yourself', xp: 25 },
  ],
  '8.3': [
  { t: 'Catch every player who joins', xp: 15 },
  { t: 'React to every new character', xp: 20 },
  { t: 'See a player leave', xp: 15 },
  { t: 'Switch a handler off with <code>Disconnect</code>', xp: 20 },
  { t: 'Build the welcome counter yourself', xp: 25 },
  ],
  '8.4': [
  { t: 'Click a part with a ClickDetector', xp: 15 },
  { t: 'Make a light switch', xp: 15 },
  { t: 'Fix the toggle that only works once', xp: 20 },
  { t: 'Open a door with a ProximityPrompt', xp: 20 },
  { t: 'Build the click race yourself', xp: 25 },
  ],
  '8.5': [
  { t: 'Build the obby and finish it', xp: 30 },
  { t: 'Change the settings and play again', xp: 20 },
  { t: 'Make it your own', xp: 30 },
  ],
  'cheat-8': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  // ── unit-9 ──
  '9.1': [
  { t: 'Put a <code>Coins</code> stat on the player list', xp: 20 },
  { t: 'Change a stat from a second script', xp: 15 },
  { t: 'Spot why a stat does not show up', xp: 15 },
  ],
  '9.2': [
  { t: 'Find the Humanoid and read its health', xp: 15 },
  { t: 'Change <code>WalkSpeed</code> and <code>JumpHeight</code>', xp: 20 },
  { t: 'Deal damage and catch <code>Died</code>', xp: 20 },
  ],
  '9.3': [
  { t: 'Add an attribute by hand and read it', xp: 15 },
  { t: 'Set an attribute and watch it change', xp: 20 },
  { t: 'Run many tagged parts from one script', xp: 25 },
  { t: 'Build speed pads from tags and attributes', xp: 25 },
  ],
  '9.4': [
  { t: 'Play the coin rush', xp: 30 },
  { t: 'Change the settings and play again', xp: 20 },
  { t: 'Test it with two players', xp: 25 },
  { t: 'Make it your own', xp: 30 },
  ],
  'cheat-9': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  // ── unit-10 ──
  '10.1': [
  { t: 'Run a LocalScript and see a <b>Client</b> line', xp: 15 },
  { t: 'Know where <code>LocalPlayer</code> exists', xp: 15 },
  { t: 'See a client-made part missing on the server', xp: 25 },
  { t: 'Make something only you can see', xp: 20 },
  ],
  '10.2': [
  { t: 'Build a ScreenGui by hand', xp: 15 },
  { t: 'Make a button change a label', xp: 20 },
  { t: 'Place things with <code>UDim2</code>', xp: 20 },
  ],
  '10.3': [
  { t: 'Send a message from client to server', xp: 25 },
  { t: 'Send a message from server to client', xp: 20 },
  { t: 'Write a server check a cheater cannot beat', xp: 30 },
  ],
  '10.4': [
  { t: 'Set up the shop GUI and remotes', xp: 20 },
  { t: 'Buy a boost and watch it run out', xp: 30 },
  { t: 'Change the shop from the server alone', xp: 15 },
  { t: 'Cheat at your own shop and fail', xp: 25 },
  { t: 'Make it your own', xp: 30 },
  ],
  'cheat-10': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  // ── unit-11 ──
  '11.1': [
  { t: 'Require a settings module from a Script', xp: 15 },
  { t: 'Predict what two <code>require</code>s give back', xp: 15 },
  { t: 'Share one table between two scripts', xp: 20 },
  { t: 'Fix a module with no <code>return</code>', xp: 15 },
  { t: 'Write the Shop module yourself', xp: 25 },
  ],
  '11.2': [
  { t: 'Build a Tree model and store it in ServerStorage', xp: 20 },
  { t: 'Clone it into the world with <code>PivotTo</code>', xp: 20 },
  { t: 'Fix a model moved with Position', xp: 15 },
  { t: 'Grow a random forest from one template', xp: 20 },
  { t: 'Plant the row of trees yourself', xp: 25 },
  ],
  '11.3': [
  { t: 'Stop a script with your own error', xp: 15 },
  { t: 'Catch an error with <code>pcall</code>', xp: 20 },
  { t: 'Fix a <code>pcall</code> that caught nothing', xp: 15 },
  { t: 'Write <code>safeDivide</code> yourself', xp: 25 },
  ],
  '11.4': [
  { t: 'Switch on API access for a published place', xp: 15 },
  { t: 'Save and load a visit count', xp: 25 },
  { t: 'Save when a player leaves', xp: 25 },
  { t: 'Put saved points on the leaderboard yourself', xp: 25 },
  ],
  '11.5': [
  { t: 'Build coins that save', xp: 35 },
  { t: 'Add a new stat with one line', xp: 20 },
  { t: 'Make it your own', xp: 30 },
  ],
  'cheat-11': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  // ── unit-12 ──
  '12.1': [
  { t: 'Build the arena with the Command Bar', xp: 20 },
  { t: 'Add the settings and the saving', xp: 20 },
  { t: 'Predict where the round clock runs', xp: 15 },
  { t: 'Stub out the four phases', xp: 25 },
  ],
  '12.2': [
  { t: 'Run a full round and earn a win', xp: 30 },
  { t: 'Predict how a round ends early', xp: 15 },
  { t: 'Lose a round on purpose', xp: 15 },
  { t: 'Fix a win for a round never played', xp: 20 },
  { t: 'List who is in the arena yourself', xp: 25 },
  ],
  '12.3': [
  { t: 'Make the lava rise and burn', xp: 30 },
  { t: 'Predict whether a tween waits', xp: 15 },
  { t: 'Climb to the top and survive', xp: 25 },
  { t: 'Fix lava leaking into the next round', xp: 20 },
  { t: 'Add the <code>Hurry!</code> countdown yourself', xp: 25 },
  ],
  '12.4': [
  { t: 'Build the RoundGui by hand', xp: 20 },
  { t: 'Show the status and banner on screen', xp: 30 },
  { t: 'Predict who respawns at the end of a round', xp: 15 },
  { t: 'Fix the vanishing banner', xp: 20 },
  { t: 'Show how many players are left yourself', xp: 25 },
  ],
  '12.5': [
  { t: 'Test a round with two players', xp: 25 },
  { t: 'Predict where the real mistake is', xp: 15 },
  { t: 'Hunt down three bugs one at a time', xp: 25 },
  { t: 'Use the docs to make the lava pulse', xp: 25 },
  { t: 'Publish Lava Rise', xp: 40 },
  ],
  'cheat-12': [{ t: 'Keep this open while you work in Studio', xp: 0 }],
  /*@@END GOALS*/
};

/**
 * Studio tasks — the `task=id` fence. The fence body is the list of steps,
 * one `- ` line each, so the steps read naturally in the markdown. Ticking
 * every step completes `goal` for the lesson the task sits in.
 */
const TASKS = {
  'setup-open':   { goal: 0, title: 'Open Studio' },
  'setup-panels': { goal: 1, title: 'Set up your windows' },
  'setup-run':    { goal: 2, title: 'Run your first script' },
  'setup-edit':   { goal: 3, title: 'Make it yours' },

  'first-three':  { goal: 0, title: 'Three variables' },
  'first-sent':   { goal: 1, title: 'A sentence' },
  'first-typo':   { goal: 2, title: 'Break it on purpose' },

  'kinds-typeof': { goal: 1, title: 'Ask typeof' },
  'kinds-error':  { goal: 2, title: 'Cause an error' },

  'change-ops':   { goal: 1, title: 'Shorthand and interpolation' },
  'change-time':  { goal: 2, title: 'A variable that changes over time' },

  'parts-base':   { goal: 0, title: 'Point at the Baseplate' },
  'parts-make':   { goal: 1, title: 'Make a part' },
  'parts-alias':  { goal: 2, title: 'Two names, one part' },
  'parts-move':   { goal: 3, title: 'Move it properly' },

  'scope-style':  { goal: 1, title: 'Tidy it up' },
  'scope-strict': { goal: 2, title: 'Turn on strict mode' },

  'lamp-build':   { goal: 0, title: 'Build it' },
  'lamp-tweak':   { goal: 1, title: 'Change one number' },
  'lamp-own':     { goal: 2, title: 'Make it yours' },
  /*@@TASKS*/
  // ── unit-3 ──
  'u3-compare': { goal: 0, title: 'Ask some questions' },
  'u3-keep':    { goal: 2, title: 'Keep the answer' },
  'u3-turn':    { goal: 3, title: 'Your turn: the health check' },
  'u3-if':      { goal: 0, title: 'One path or the other' },
  'u3-elseif':  { goal: 2, title: 'Every path' },
  'u3-turn2':   { goal: 4, title: 'Your turn: the treasure roll' },
  'u3-logic':   { goal: 0, title: 'Join some questions' },
  'u3-default': { goal: 2, title: 'Defaults and a famous bug' },
  'u3-turn3':   { goal: 3, title: 'Your turn: the night market' },
  'u3-build':   { goal: 0, title: 'Build it' },
  'u3-tweak':   { goal: 1, title: 'Test every path' },
  'u3-own':     { goal: 2, title: 'Make it yours' },
  // ── unit-4 ──
  'u4-while':    { goal: 0, title: 'Loops that wait' },
  'u4-turn':     { goal: 3, title: 'Your turn: the hopping part' },
  'u4-for':      { goal: 0, title: 'Count and build' },
  'u4-turn2':    { goal: 2, title: 'Your turn: a pointed tower' },
  'u4-control':  { goal: 0, title: 'Leave, skip, repeat' },
  'u4-turn3':    { goal: 3, title: 'Your turn: a checkerboard' },
  'u4-build':    { goal: 0, title: 'Build it' },
  'u4-tweak':    { goal: 1, title: 'Change the settings' },
  'u4-own':      { goal: 2, title: 'Make it yours' },
  // ── unit-5 ──
  'u5-define':    { goal: 0, title: 'Define it, call it' },
  'u5-cube':      { goal: 2, title: 'One cube, described once' },
  'u5-order':     { goal: 3, title: 'Above the call' },
  'u5-turn':      { goal: 4, title: 'Your turn: a dice roll' },
  'u5-params':    { goal: 0, title: 'Hand it something' },
  'u5-default':   { goal: 2, title: 'A default value' },
  'u5-order2':    { goal: 3, title: 'Fix the bug: the wrong order' },
  'u5-turn2':     { goal: 4, title: 'Your turn: a scoreboard' },
  'u5-return':    { goal: 0, title: 'Get a value back' },
  'u5-fixreturn': { goal: 2, title: 'Fix the bug: no answer' },
  'u5-turn3':     { goal: 3, title: 'Your turn: the shop' },
  'u5-anon':      { goal: 0, title: 'A function with no name' },
  'u5-delay':     { goal: 2, title: 'Later, not now' },
  'u5-hand':      { goal: 3, title: 'Fix the bug: brackets' },
  'u5-turn4':     { goal: 4, title: 'Your turn: doTimes' },
  'u5-build':     { goal: 0, title: 'Build it' },
  'u5-tweak':     { goal: 1, title: 'Wire one number' },
  'u5-own':       { goal: 2, title: 'Make it yours' },
  // ── unit-6 ──
  'u6-index':    { goal: 0, title: 'Slot by slot' },
  'u6-length':   { goal: 2, title: 'How many' },
  'u6-turn':     { goal: 4, title: 'Your turn: a list of names' },
  'u6-loop':     { goal: 0, title: 'Every item' },
  'u6-insert':   { goal: 2, title: 'Insert, remove, find' },
  'u6-fix':      { goal: 3, title: 'Fix the bug: the rock that got away' },
  'u6-turn2':    { goal: 4, title: 'Your turn: a day log' },
  'u6-dict':     { goal: 0, title: 'Slots with names' },
  'u6-pairs':    { goal: 2, title: 'Every key' },
  'u6-fixpairs': { goal: 3, title: 'Fix the bug: the empty loop' },
  'u6-turn3':    { goal: 4, title: 'Your turn: the shop' },
  'u6-nested':   { goal: 0, title: 'A list of dictionaries' },
  'u6-sort':     { goal: 2, title: 'A leaderboard' },
  'u6-children': { goal: 3, title: 'Lists from Roblox' },
  'u6-turn4':    { goal: 4, title: 'Your turn: sorted items' },
  'u6-build':    { goal: 0, title: 'Build it' },
  'u6-tweak':    { goal: 1, title: 'Change the weights' },
  'u6-own':      { goal: 2, title: 'Make it yours' },
  // ── unit-7 ──
  'u7-look':        { goal: 0, title: 'Build something to find' },
  'u7-find':        { goal: 1, title: 'Wait for it' },
  'u7-loop':        { goal: 2, title: 'Loop over a folder' },
  'u7-turn':        { goal: 3, title: 'Your turn: a row of crates' },
  'u7-cframe':      { goal: 0, title: 'Turn a part' },
  'u7-ring':        { goal: 2, title: 'Your turn: a ring of stones' },
  'u7-walk':        { goal: 3, title: 'Walk and point' },
  'u7-spin':        { goal: 4, title: 'Fix the spin' },
  'u7-tween':       { goal: 0, title: 'Your first tweens' },
  'u7-door':        { goal: 2, title: 'The tween that never played' },
  'u7-turn-tween':  { goal: 3, title: 'Your turn: a door' },
  'u7-course':      { goal: 0, title: 'Build it and climb it' },
  'u7-tweak':       { goal: 1, title: 'Change one number' },
  'u7-own':         { goal: 2, title: 'Make it yours' },
  // ── unit-8 ──
  'u8-touch':   { goal: 0, title: 'A pad to step on' },
  'u8-who':     { goal: 1, title: 'Who touched it?' },
  'u8-lava':    { goal: 2, title: 'A lava brick' },
  'u8-paint':   { goal: 3, title: 'Your turn: the paint pad' },
  'u8-spam':    { goal: 0, title: 'Count the touches' },
  'u8-flag':    { goal: 1, title: 'A cooldown flag' },
  'u8-two':     { goal: 2, title: 'Two players, two cooldowns' },
  'u8-fix':     { goal: 3, title: 'Fix the debounce' },
  'u8-score':   { goal: 4, title: 'Your turn: the score pad' },
  'u8-join':    { goal: 0, title: 'Everyone who joins' },
  'u8-spawn':   { goal: 1, title: 'Every new body' },
  'u8-leave':   { goal: 2, title: 'Someone leaves' },
  'u8-once':    { goal: 3, title: 'First one wins' },
  'u8-welcome': { goal: 4, title: 'Your turn: the welcome counter' },
  'u8-click':   { goal: 0, title: 'A button' },
  'u8-switch':  { goal: 1, title: 'A light switch' },
  'u8-fixlamp': { goal: 2, title: 'Fix the toggle' },
  'u8-prompt':  { goal: 3, title: 'A door with a prompt' },
  'u8-race':    { goal: 4, title: 'Your turn: the click race' },
  'u8-build':   { goal: 0, title: 'Build it and finish it' },
  'u8-tweak':   { goal: 1, title: 'Change one number' },
  'u8-own':     { goal: 2, title: 'Make it yours' },
  // ── unit-9 ──
  'u9-leaderstats':       { goal: 0, title: 'A score on the player list' },
  'u9-leaderstats-value': { goal: 1, title: 'Change it from a script' },
  'u9-humanoid-speed':    { goal: 1, title: 'Fast, slow, high' },
  'u9-humanoid-damage':   { goal: 2, title: 'Take damage' },
  'u9-attr-hand':         { goal: 0, title: 'An attribute by hand' },
  'u9-attr-script':       { goal: 1, title: 'Attributes from a script' },
  'u9-tag-hand':          { goal: 2, title: 'Tag three parts' },
  'u9-attr-own':          { goal: 3, title: 'Speed pads' },
  'u9-build-run':         { goal: 0, title: 'Play it' },
  'u9-build-tweak':       { goal: 1, title: 'Change one number' },
  'u9-build-test':        { goal: 2, title: 'Two players' },
  'u9-build-own':         { goal: 3, title: 'Make it yours' },
  // ── unit-10 ──
  'u10-local-make':    { goal: 0, title: 'Your first LocalScript' },
  'u10-replicate':     { goal: 2, title: 'Look from the server' },
  'u10-own':           { goal: 3, title: 'Only for you' },
  'u10-gui-hand':      { goal: 0, title: 'A screen by hand' },
  'u10-gui-click':     { goal: 1, title: 'Make it click' },
  'u10-gui-udim':      { goal: 2, title: 'Put it in its place' },
  'u10-remote-make':   { goal: 0, title: 'Make the doorway' },
  'u10-remote-fire':   { goal: 0, title: 'Client to server' },
  'u10-remote-client': { goal: 1, title: 'Server to client' },
  'u10-remote-trust':  { goal: 2, title: 'A shop that checks' },
  'u10-build-setup':   { goal: 0, title: 'Set it up' },
  'u10-build-run':     { goal: 1, title: 'Go shopping' },
  'u10-build-tweak':   { goal: 2, title: 'Change one number' },
  'u10-build-cheat':   { goal: 3, title: 'Try to cheat' },
  'u10-build-own':     { goal: 4, title: 'Make it yours' },
  // ── unit-11 ──
  'u11-config':  { goal: 0, title: 'A settings module' },
  'u11-shared':  { goal: 2, title: 'One table, two scripts' },
  'u11-fix':     { goal: 3, title: 'Fix the bug: the missing return' },
  'u11-turn':    { goal: 4, title: 'Your turn: the Shop module' },
  'u11-model':   { goal: 0, title: 'Build a tree by hand' },
  'u11-clone':   { goal: 1, title: 'Plant one tree' },
  'u11-fix2':    { goal: 2, title: 'Fix the bug: models have no Position' },
  'u11-forest':  { goal: 3, title: 'A forest' },
  'u11-turn2':   { goal: 4, title: 'Your turn: a row of trees' },
  'u11-error':   { goal: 0, title: 'Error, warn and assert' },
  'u11-pcall':   { goal: 1, title: 'Catch it' },
  'u11-fix3':    { goal: 2, title: 'Fix the bug: the brackets' },
  'u11-turn3':   { goal: 3, title: 'Your turn: safeDivide' },
  'u11-setup':   { goal: 0, title: 'Switch saving on' },
  'u11-visits':  { goal: 1, title: 'Count visits' },
  'u11-leave':   { goal: 2, title: 'Points that last' },
  'u11-turn4':   { goal: 3, title: 'Your turn: points on the leaderboard' },
  'u11-build':   { goal: 0, title: 'Build it' },
  'u11-tweak':   { goal: 1, title: 'Change one number' },
  'u11-own':     { goal: 2, title: 'Make it yours' },
  // ── unit-12 ──
  'u12-map':    { goal: 0, title: 'Build the arena' },
  'u12-setup':  { goal: 1, title: 'Settings and saving' },
  'u12-plan':   { goal: 3, title: 'Your turn: the four stubs' },
  'u12-loop':   { goal: 0, title: 'Run a round' },
  'u12-lose':   { goal: 2, title: 'Lose on purpose' },
  'u12-fix':    { goal: 3, title: 'Fix the bug: the free win' },
  'u12-turn':   { goal: 4, title: 'Your turn: who is in the arena' },
  'u12-lava':   { goal: 0, title: 'Add the lava' },
  'u12-climb':  { goal: 2, title: 'The climb' },
  'u12-fix2':   { goal: 3, title: 'Fix the bug: the leaking lava' },
  'u12-turn2':  { goal: 4, title: 'Your turn: hurry' },
  'u12-gui':    { goal: 0, title: 'Build the screen' },
  'u12-client': { goal: 1, title: 'Wire up the client' },
  'u12-fix3':   { goal: 3, title: 'Fix the bug: the vanishing banner' },
  'u12-turn3':  { goal: 4, title: 'Your turn: players left' },
  'u12-test':   { goal: 0, title: 'Two players' },
  'u12-debug':  { goal: 2, title: 'The bug drill' },
  'u12-docs':   { goal: 3, title: 'Your turn: read the docs' },
  'u12-ship':   { goal: 4, title: 'Ship it' },
  /*@@END TASKS*/
};

/** Predict blocks — a question, some chips, one right answer, and the why. */
const PREDICTS = {
  'p-first': {
    options: ['10', 'coins', 'nothing'],
    answer: 1,
    why: 'The quotes make it text, so `print` shows the word itself. Without quotes, `print(coins)` would look inside the variable and show `10`.',
  },
  'p-typo': {
    options: ['10', 'nil', 'an error'],
    answer: 1,
    why: 'Luau does not stop you here. A name that was never made just holds `nil` — nothing. That is why a typo can hide for a long time. The orange underline in the script editor is your warning.',
    goal: undefined,
  },
  'p-kinds': {
    options: ['boolean', 'string', 'true'],
    answer: 1,
    why: 'The quotes win. `"true"` is a piece of text that happens to spell a word — `typeof` reports `string`. Without quotes, `true` is a boolean.',
    goal: 0,
  },
  'p-join': {
    options: ['15', '105', 'an error'],
    answer: 1,
    why: '`..` always joins things as text. It turns the 5 into `"5"` and glues it onto `"10"`, giving `"105"`. If you wanted 15, you needed `+`.',
  },
  'p-change': {
    options: ['15', '30', '20'],
    answer: 1,
    why: 'Line by line: 10, then `+= 5` makes 15, then `*= 2` doubles it to 30. Each line works with whatever the variable holds right then.',
    goal: 0,
  },
  'p-alias': {
    options: ['0', '0.5', 'an error'],
    answer: 1,
    why: '`a` and `b` are two names for the same part. There is only one part in the world, so changing it through `b` changes what you see through `a`.',
  },
  'p-copy': {
    options: ['5', '10', 'nil'],
    answer: 0,
    why: 'Numbers are copied. `y = x` puts its own 5 into `y`, and later changing `y` leaves `x` alone. Parts behave differently because a variable holds a <b>reference</b> to the part, not a copy of it.',
  },
  'p-scope': {
    options: ['Gold', 'nil', 'an error'],
    answer: 1,
    why: '`reward` only exists between the `do` and the `end`. After the `end`, the name means nothing, so `print` shows `nil`. Studio underlines it to warn you.',
    goal: 0,
  },
  'p2-warm-kinds': {
    recall: '2.1', options: ['10', '99', 'nil'], answer: 0,
    why: 'Capital letters count. `coins` and `Coins` are two different boxes, and `print(coins)` looks in the small-c one.',
  },
  'p2-warm-change': {
    recall: '2.2', options: ['Score: 41', 'Score: 5', 'an error'], answer: 1,
    why: 'Maths happens before joining, just like times before plus. `4 + 1` is worked out first, then `5` is joined onto the text.',
  },
  'p2-warm-parts': {
    recall: '2.3', options: ['Lives left: 20', 'Lives left: 30', 'Lives left: 29'], answer: 0,
    why: 'Line by line: 3, then `-= 1` makes 2, then `*= 10` makes 20. Backticks drop the value into the text.',
  },
  'p2-warm-scope': {
    recall: '2.4', options: ['Part', 'Crate', 'nil'], answer: 1,
    why: '`a` and `b` are two names for one part. Renaming it through `b` renames the only part there is.',
  },
  'p2-warm-lamp': {
    recall: '2.2', options: ['string', 'nil', 'an error'], answer: 1,
    why: '`local name` with nothing after it makes an empty box. Empty means `nil`, and `typeof` reports `"nil"`.',
  },
  /*@@PREDICTS*/
  // ── unit-3 ──
  'p3-warm1': {
  recall: '2.3',
  options: ['You have 10 coins', 'You have 15 coins', 'You have {coins} coins'],
  answer: 1,
  why: '`+= 5` adds 5 to whatever `coins` holds, so it becomes 15. Backticks put the value of `coins` where the curly brackets are.',
  },
  'p3-same': {
  options: ['true', 'false', 'an error'],
  answer: 1,
  why: 'One is a number and one is a string, so they are not the same value. `==` never errors on different types — it just says `false`.',
  goal: 1,
  },
  'p3-warm2': {
  recall: '3.1',
  options: ['true', 'false', '-10'],
  answer: 1,
  why: '`>=` asks *is 40 at least 50?* The answer is no, so the comparison turns into `false`.',
  },
  'p3-order': {
  options: ['Gold', 'Bronze', 'Bronze and Gold'],
  answer: 1,
  why: 'The first question, `score >= 50`, is already true for 95. Luau runs that path and skips the rest — Gold is never checked. Ask the hardest question first.',
  goal: 1,
  },
  'p3-zero': {
  options: ['yes', 'no', 'an error'],
  answer: 0,
  why: 'Only `false` and `nil` count as false. `0` is a real number, so it counts as true and the first path runs.',
  goal: 3,
  },
  'p3-warm3': {
  recall: '3.2',
  options: ['Bronze', 'Silver', 'Bronze and Silver'],
  answer: 0,
  why: '80 passes the very first question, `score >= 50`, so Bronze runs and the chain stops. The order is wrong — Silver should be asked first.',
  },
  'p3-and': {
  options: ['true', 'false', '50'],
  answer: 1,
  why: '`coins >= 40` is true, but `level >= 5` is false. `and` needs both sides, so the answer is `false`.',
  goal: 1,
  },
  'p3-default': {
  options: ['nil', 'No title', 'true'],
  answer: 1,
  why: '`title` is `nil`, which counts as false, so `or` gives back its right side: `"No title"`.',
  },
  'p3-tier': {
  q: 'With the roll fixed at 86, which tier does the chest give?',
  options: ['Rare', 'Epic', 'Legendary'],
  answer: 1,
  why: '86 is not `&lt;= 60` and not `&lt;= 85`, but it is `&lt;= 97` — so the third path runs: Epic. One more than the Rare limit is the very first Epic roll.',
  },
  // ── unit-4 ──
  'p4-warm1': {
  recall: '3.3',
  options: ['In you go.', 'Locked.', 'an error'],
  answer: 0,
  why: '`or` only needs one side to be true. `hasKey` is false, but `isVip` is true, so the first path runs.',
  },
  'p4-forever': {
  q: 'What happens when you press Play?',
  options: ['It prints 100 once', 'It prints 100 for ever and Studio freezes', 'It prints 100 down to 1'],
  answer: 1,
  why: 'Nothing inside the loop changes `health`, so `health > 0` is true every single time. With no `task.wait`, it never pauses either — Studio locks up until Roblox kills the script.',
  goal: 1,
  },
  'p4-offbyone': {
  q: 'How many numbers does this print?',
  options: ['4', '5', '6'],
  answer: 0,
  why: 'It prints 1, 2, 3 and 4. When `count` reaches 5, `count &lt; 5` is false, so 5 itself is never printed. `&lt;=` would include it.',
  goal: 2,
  },
  'p4-warm2': {
  recall: '4.1',
  q: 'What is the last line in Output?',
  options: ['Lives left: 1', 'Lives left: 0', 'Game over'],
  answer: 2,
  why: 'The loop prints 3, 2 and 1, then `lives` is 0 and `lives > 0` is false. The loop is skipped and the script carries on to `Game over`.',
  },
  'p4-step': {
  options: ['4', '10', '24'],
  answer: 1,
  why: '`total` is made before the loop, so it keeps its value between passes: 0 + 1 + 2 + 3 + 4 = 10.',
  goal: 1,
  },
  'p4-warm3': {
  recall: '4.2',
  options: ['12', '21', '42'],
  answer: 2,
  why: 'Each pass adds `i * 2`: 2 + 4 + 6 + 8 + 10 + 12 = 42. It is double 1 + 2 + 3 + 4 + 5 + 6, which is 21.',
  },
  'p4-continue': {
  options: ['1 2', '1 2 4 5', '1 2 3 4 5'],
  answer: 1,
  why: 'When `i` is 3, `continue` skips the print and jumps straight on to 4. Only that one pass is skipped — `break` would have stopped the loop for good.',
  goal: 1,
  },
  'p4-nested': {
  options: ['3', '5', '6'],
  answer: 2,
  why: 'The inner loop runs twice for **each** of the three outer passes: 3 × 2 = 6. Nested loops multiply.',
  goal: 2,
  },
  'p4-hue': {
  q: 'What hue does step 3 print?',
  options: ['0.3', '0.5', '0.6'],
  answer: 1,
  why: 'For step 3: (3 - 1) / (5 - 1) = 2 / 4 = 0.5. Step 1 gets 0 and step 5 gets exactly 1, so the five hues are spread evenly from one end of the colour wheel to the other.',
  },
  // ── unit-5 ──
  'p5-warm1': {
  recall: '4.2',
  options: ['4', '10', '24'],
  answer: 1,
  why: 'The loop runs with `i` as 1, 2, 3 and 4, adding each to `n`: 1 + 2 + 3 + 4 is 10.',
  },
  'p5-once': {
  options: ['All systems ready', 'Launching! then All systems ready', 'All systems ready then Launching!'],
  answer: 0,
  why: 'Defining `launch` only gives the block a name. Nothing calls `launch()`, so its body never runs. Only the outer `print` does.',
  goal: 1,
  },
  'p5-warm2': {
  recall: '4.3',
  options: ['15', '9', '6'],
  answer: 1,
  why: '`i % 2 == 0` is true for 2 and 4, and `continue` skips the rest of the loop for them. Only 1, 3 and 5 are added: 9.',
  },
  'p5-args': {
  options: ['Ada gets 50 coins', '50 gets Ada coins', 'an error'],
  answer: 1,
  why: 'Arguments fill parameters by position. The first argument, `50`, goes into `playerName`; `"Ada"` goes into `coins`. Luau does not read the names — and backticks happily print a number or a string, so there is no error.',
  goal: 1,
  },
  'p5-missing': {
  options: ['Grace gets 0 coins', 'Grace gets nil coins', 'an error'],
  answer: 1,
  why: 'Nothing was handed in for `coins`, so it holds `nil`. Backticks turn `nil` into the word *nil*. No error, just a wrong sentence.',
  },
  'p5-warm3': {
  recall: '2.4',
  options: ['0', '0.5', 'an error'],
  answer: 1,
  why: '`a` and `b` are two names for one part. Changing it through `b` changes the part you see through `a`.',
  },
  'p5-noreturn': {
  options: ['Hi Ada', 'Hi Ada, then nil', 'nil'],
  answer: 1,
  why: 'The function prints `Hi Ada` while it runs. It has no `return`, so it gives back `nil`, and the outer `print` shows that `nil` on a second line.',
  goal: 1,
  },
  'p5-warm4': {
  recall: '3.2',
  options: ['Still playing', 'Game over', 'an error'],
  answer: 0,
  why: 'Only `false` and `nil` count as false. `0` is a real number, so `if lives then` is true. To check for no lives left, write `if lives > 0 then`.',
  },
  'p5-delay': {
  options: ['Sleeping, Wake up!, Heard something', 'Sleeping, Heard something, Wake up!', 'Wake up!, Sleeping, Heard something'],
  answer: 1,
  why: '`task.delay` does not stop the script. It schedules `alarm` for two seconds from now and the script carries straight on to `Heard something`. Two seconds later, `Wake up!`.',
  goal: 1,
  },
  'p5-warm5': {
  recall: '4.1',
  options: ['2', '3', '4'],
  answer: 1,
  why: 'The loop checks `n < 3` before every run. It runs with `n` at 0, 1 and 2, making it 1, 2, 3. At 3 the check is false and the loop stops.',
  },
  // ── unit-6 ──
  'p6-warm1': {
  recall: '5.3',
  options: ['10', '11', '12'],
  answer: 1,
  why: '`double(5)` hands back 10, and the call *is* that value — so the line becomes `print(10 + 1)`.',
  },
  'p6-zero': {
  options: ['Apple', 'nil', 'an error'],
  answer: 1,
  why: 'Luau lists start at slot 1, so slot 0 is empty. An empty slot gives `nil` — never an error.',
  goal: 1,
  },
  'p6-ref': {
  options: ['Sword', 'Axe', 'nil'],
  answer: 1,
  why: '`local b = a` copies the reference, not the table. There is one list with two names, so changing it through `b` changes what `a` sees — just like parts in 2.4.',
  goal: 3,
  },
  'p6-warm2': {
  recall: '6.1',
  options: ['3 Banana', '3 Kiwi', '4 Kiwi'],
  answer: 1,
  why: 'Slot 2 already had something in it, so `=` replaces it. Nothing was added, so the length stays 3.',
  },
  'p6-remove': {
  options: ['Ada 2 Grace', 'Ada 3 Ada', 'nil 2 Grace'],
  answer: 0,
  why: '`table.remove` takes slot 1 out **and gives it back**, so `first` is `"Ada"`. The rest slide down: two left, and Grace is now first in the queue.',
  goal: 1,
  },
  'p6-warm3': {
  recall: '3.3',
  options: ['true false', 'false false', 'true true'],
  answer: 0,
  why: '`or` needs only one true side, and `isVip` is true. `not` flips `true` to `false`.',
  },
  'p6-dot': {
  options: ['3', 'nil', 'an error'],
  answer: 1,
  why: '`inventory.fruit` looks for a key literally called `fruit`, and there is none. To use the name stored in the variable, write `inventory[fruit]`.',
  goal: 1,
  },
  'p6-warm4': {
  recall: '6.3',
  options: ['20 20', '20 nil', 'nil nil'],
  answer: 1,
  why: '`prices[item]` uses the string inside `item`, so it finds Potion. `prices.item` looks for a key called `item`, which does not exist.',
  },
  'p6-sort': {
  options: ['Ada', 'Alan', 'Grace'],
  answer: 0,
  why: 'The function says *shorter names come first*: `#a` is the length of the string. Ada has 3 letters, Alan 4, Grace 5 — so Ada leads.',
  goal: 1,
  },
  'p6-warm5': {
  recall: '5.4',
  options: ['A B C', 'A C B', 'A C'],
  answer: 1,
  why: '`task.delay` schedules the function and the script carries straight on, so C prints right after A. A second later, B.',
  },
  // ── unit-7 ──
  'p7-warm1': {
  recall: '6.2',
  options: ['2', '3', 'plum'],
  answer: 1,
  why: '`table.insert` adds `"plum"` to the end of the list, so there are three things in it. `#` counts them.',
  },
  'p7-find': {
  options: ['true', 'false', 'an error'],
  answer: 0,
  why: 'There is nothing called Ghost, so `FindFirstChild` gives `nil` — and `nil == nil` is `true`. No error: that is the whole point of `FindFirstChild`. A dot, `workspace.Ghost`, would have stopped the script.',
  },
  'p7-wait': {
  q: 'Which line appears in Output first?',
  options: ['part is here', 'script still going', 'only one of them prints'],
  answer: 1,
  why: '`task.delay` does not pause the script. It books the function for three seconds from now and lets the script carry straight on, so `script still going` prints first and `part is here` three seconds later.',
  },
  'p7-isa': {
  options: ['true true', 'false true', 'false false'],
  answer: 1,
  why: '`ClassName` is exactly `Part`, so comparing it to `"BasePart"` is false. `IsA` checks the whole family, and a Part is a kind of BasePart, so it says true.',
  },
  'p7-warm2': {
  recall: '5.3',
  options: ['6', '12', 'an error'],
  answer: 1,
  why: 'The inside call runs first: `double(3)` returns 6. Then `double(6)` returns 12. A function call can go anywhere a value can — even inside another call.',
  },
  'p7-rad': {
  q: 'Roughly what will the Y part of the Orientation be?',
  options: ['90', 'about 117', 'an error'],
  answer: 1,
  why: '`CFrame.Angles` reads 90 as **90 radians**, which is more than fourteen full turns. What is left over after the full turns is roughly 117 degrees — not what anyone meant. That is why you always write `math.rad(90)`.',
  goal: 1,
  },
  'p7-warm3': {
  recall: '4.1',
  q: 'How many numbers does this print?',
  options: ['4', '5', 'it never stops'],
  answer: 1,
  why: '1, 2, 4, 8, 16. After 16 the next value is 32, and `32 < 20` is false, so the loop stops before printing it.',
  },
  'p7-block': {
  q: 'When does "after" appear in Output?',
  options: ['at once, right after "before"', 'two seconds later, when the part arrives', 'never'],
  answer: 0,
  why: '`:Play()` starts the tween and returns straight away. The part is still moving when `after` prints. To wait for it, use `lift.Completed:Wait()`.',
  goal: 1,
  },
  'p7-warm4': {
  recall: '7.2',
  options: ['0, 5, 0', '0, 5, -5', '0, 0, -5'],
  answer: 1,
  why: 'A new part faces straight ahead, so moving it *forward* five studs takes Z from 0 to -5. `*=` moves it on from where it already was, so the height of 5 is kept.',
  },
  // ── unit-8 ──
  'p8-warm1': {
  recall: '7.1',
  options: ['Dragon', 'nil', 'an error'],
  answer: 1,
  why: 'There is no Dragon, so `FindFirstChild` gives `nil` instead of stopping the script. `workspace.Dragon` with a dot would have been the error.',
  },
  'p8-first': {
  q: 'You press Play and do not touch anything. What does Output show?',
  options: ['touched! then ready', 'ready', 'nothing at all'],
  answer: 1,
  why: '`Connect` only stores the function for later. Nothing has touched the pad yet, so it has not run. The script carries on and prints `ready`. `touched!` only appears once something touches the pad.',
  },
  'p8-warm2': {
  recall: '3.3',
  options: ['false', 'true', 'nil'],
  answer: 1,
  why: '`not` flips a boolean. `open` was `false`, so `not open` is `true`, and that goes back into the box. Running the same line again would flip it back. This is how every toggle works.',
  },
  'p8-many': {
  q: 'You walk across the pad once. How many times does "touch" print?',
  options: ['exactly once', 'twice, one for each foot', 'lots, and a different number each time'],
  answer: 2,
  why: '`Touched` fires for every body part that touches, every time it touches again. Feet, lower legs, sometimes hands — touching, lifting and touching again as you walk. You cannot predict the number, which is exactly why you need a debounce.',
  goal: 0,
  },
  'p8-warm3': {
  recall: '6.3',
  options: ['5', '6', 'an error'],
  answer: 1,
  why: '`scores["Ada"]` and `scores.Ada` are the same entry, written two ways. It starts at 5, `+= 1` makes it 6.',
  },
  'p8-disc': {
  q: 'You walk all over the pad for ten seconds. What does Output show?',
  options: ['count is 1, once', 'count is 1, 2, 3 and so on', 'nothing at all'],
  answer: 0,
  why: 'The very first touch runs the handler, which disconnects itself. After that, the pad is not being listened to any more, so no more touches reach the function. One line.',
  },
  'p8-warm4': {
  recall: '4.2',
  options: ['10 7 4 1', '10 7 4', '10 9 8 ... 1'],
  answer: 0,
  why: 'The third number is the step. Start at 10 and go down 3 each time: 10, 7, 4, 1. The next would be -2, which is past the stop of 1, so the loop ends.',
  },
  'p8-param': {
  q: 'Someone clicks the button. What does `something.Name` print?',
  options: ['the name of the part they clicked', 'their Roblox username', 'an error, it must be called player'],
  answer: 1,
  why: '`MouseClick` always hands its handler the **Player** who clicked. What you call that parameter is up to you — `something` works as well as `player` does. `player` is just the clearer name.',
  },
  'p8-hold': {
  q: 'A player walks up and quickly taps E once. What happens?',
  options: ['the vault opens', 'nothing — they let go too soon', 'it opens after two seconds'],
  answer: 1,
  why: 'With `HoldDuration = 2` the key has to be held down for two whole seconds while the ring fills. Let go early and the prompt resets, and `Triggered` never fires.',
  },
  'p8-warm5': {
  recall: '5.3',
  options: ['reward reward', 'reward blocked', 'blocked blocked'],
  answer: 1,
  why: 'The two calls run left to right. The first finds `ready` true, sets it to false and returns `"reward"`. The second finds it false and returns `"blocked"` straight away. That is a debounce, without any events.',
  },
  // ── unit-9 ──
  'p9-warm-leaderstats': {
  recall: '8.3',
  q: 'From memory — you press Play. What does the Output window show?',
  options: ['YourName joined', 'player joined', 'nothing'],
  answer: 0,
  why: '`PlayerAdded` hands your function the player who joined, and `player.Name` is their username. The word `"joined"` is in quotes, so it is printed as it is.',
  },
  'p9-leaderstats-name': {
  q: 'You press Play. What appears on the player list next to your name?',
  options: ['Coins 100', 'Coins 0', 'nothing'],
  answer: 2,
  why: 'The folder is called `stats`, not `leaderstats`. Roblox only shows values inside a folder with exactly that name, so the coins exist but nobody can see them.',
  goal: 2,
  },
  'p9-warm-humanoid': {
  recall: '8.3',
  q: 'From memory — you press Play. In what order do the lines appear?',
  options: ['is here, then spawned', 'spawned, then is here', 'only is here'],
  answer: 0,
  why: 'The player joins first, so `PlayerAdded` runs and connects to `CharacterAdded`. A moment later the character spawns and that event fires. It fires again on every respawn too.',
  },
  'p9-humanoid-max': {
  options: ['150', '100', 'an error'],
  answer: 1,
  why: '`Health` can never be more than `MaxHealth`. Roblox quietly stops it at 100. To give someone 150 health, raise `MaxHealth` first, then `Health`.',
  goal: 0,
  },
  'p9-warm-attr': {
  recall: '6.3',
  options: ['nil', 'an error', '0'],
  answer: 0,
  why: 'Asking a dictionary for a key it does not have gives `nil`, not an error. `GetAttribute` follows the same rule, as you are about to see.',
  },
  'p9-attr-type': {
  options: ['50', '40', 'an error'],
  answer: 2,
  why: 'An attribute is not a property. `crate.Value` looks for a property or child called `Value`, finds none, and the script stops with *Value is not a valid member of Part*. Attributes are only reached through `GetAttribute` and `SetAttribute`.',
  },
  'p9-tag-case': {
  options: ['3', '0', 'an error'],
  answer: 1,
  why: 'Tags are case-sensitive. Nothing is tagged `lava` with a small l, so `GetTagged` gives an empty list — and `#` of an empty list is `0`. No error, just nothing.',
  },
  'p9-warm-build': {
  recall: '6.2',
  options: ['3 30', '3 3', '30 3'],
  answer: 0,
  why: 'The loop adds 10, 20 and 30, so the list has 3 items, and item number 3 is `30`.',
  },
  // ── unit-10 ──
  'p10-warm-server': {
  recall: '9.4',
  q: 'From memory — you press Play on your own in Studio. What does the Output window show?',
  options: ['0', '1', 'nil'],
  answer: 0,
  why: 'Scripts start the moment the server does — before your player has finished joining. `GetPlayers` gives an empty list, and `#` of an empty list is `0`. That is why games listen for `PlayerAdded` instead of counting at the start.',
  },
  'p10-localplayer': {
  options: ['YourName', 'nil', 'Server'],
  answer: 1,
  why: 'The server is not anybody’s computer, so it has no "local" player. `LocalPlayer` only means something on a client. On the server, the player always comes from an event like `PlayerAdded`.',
  goal: 1,
  },
  'p10-wrong-place': {
  options: ['Am I running?', 'nothing', 'an error'],
  answer: 1,
  why: 'A LocalScript only runs in places that belong to a player: StarterPlayerScripts, StarterCharacterScripts, StarterGui (and the copies they make). Workspace on its own is not one of them, so it never starts — and nothing tells you.',
  },
  'p10-warm-gui': {
  recall: '10.1',
  q: 'From memory — another player is in the game with you. Who sees this part?',
  options: ['everyone', 'only you', 'nobody'],
  answer: 1,
  why: 'A LocalScript runs on your own computer, and things a client makes stay on that client. The server never hears about the part, so it is never copied to anyone else.',
  },
  'p10-udim': {
  q: 'Where does the button end up?',
  options: ['dead centre', 'right of centre', 'off the screen'],
  answer: 1,
  why: '`Position` places the button’s **top-left corner** by default. That corner goes to the middle, so the whole 200-pixel button hangs off to the right and down. Set `AnchorPoint` to `0.5, 0.5` to position by the middle.',
  goal: 2,
  },
  'p10-warm-remote': {
  recall: '10.1',
  q: 'From memory — does the server now think you have 9999 coins?',
  options: ['yes', 'no, only your screen shows 9999', 'an error'],
  answer: 1,
  why: 'A client’s changes never reach the server. Your own screen shows 9999, but the real value on the server has not moved, and the next time the server changes it your screen snaps back. This is exactly why the client has to *ask*.',
  },
  'p10-player-first': {
  options: ['50', 'your name', 'nil'],
  answer: 1,
  why: 'The server always gets the player first, whatever the client sent. The function named its first argument `amount`, so `amount` holds the **player** — and printing a player shows their name. The 50 arrived second and was never given a name.',
  },
  'p10-trust': {
  q: 'What happens on the server?',
  options: ['the sword is bought', 'nothing', 'the server script errors'],
  answer: 1,
  why: 'Using a table as a key just looks for that exact table in `PRICES`. It is not there, so `price` is `nil` and the handler returns. Looking things up on the server shrugs off anything strange a client sends.',
  goal: 2,
  },
  'p10-warm-build': {
  recall: '6.4',
  options: ['15', '10', 'nil'],
  answer: 0,
  why: '`ITEMS["Jump"]` is the inner table `{ price = 15 }`, and `.price` reads from that. Brackets and dots both work: `ITEMS.Jump.price` is the same thing.',
  },
  // ── unit-11 ──
  'p11-warm1': {
  recall: '6.3',
  options: ['5 2', 'nil 2', 'an error'],
  answer: 1,
  why: 'Setting a key to `nil` removes it from the dictionary, so `stats.coins` is `nil` now. `gems` was added and is still there.',
  },
  'p11-once': {
  q: 'With `print("Config is loading")` at the top of Config, what does Output show?',
  options: ['Config is loading, then true', 'Config is loading twice, then true', 'Config is loading twice, then false'],
  answer: 0,
  why: 'A module runs only the first time it is required. The second `require` hands back the very same table without running anything, so the print appears once and `a == b` is `true`.',
  goal: 1,
  },
  'p11-warm2': {
  recall: '7.1',
  options: ['Workspace', 'nil', 'Baseplate'],
  answer: 1,
  why: 'A clone starts with no Parent. It exists only inside your script until you set `copy.Parent`, which is why you always parent it last.',
  },
  'p11-copy': {
  options: ['Tree', 'BigTree', 'nil'],
  answer: 0,
  why: '`Clone` makes a whole new model. Renaming the copy leaves the template in ServerStorage exactly as it was. Compare `local b = a`, which only makes a second name for the same thing.',
  },
  'p11-warm3': {
  recall: '5.3',
  options: ['negative', 'fine', 'negative and fine'],
  answer: 0,
  why: '`-2 < 0` is true, so the function reaches `return "negative"` and stops right there. The last line never runs.',
  },
  'p11-pcall': {
  options: ['true 20', 'false 20', 'true nil'],
  answer: 0,
  why: 'The function did not error, so the first value is `true`. When it works, the second value is whatever the function returned: `20`.',
  goal: 1,
  },
  'p11-warm4': {
  recall: '9.1',
  q: 'What must the folder be called for Roblox to show it as the leaderboard?',
  options: ['Leaderboard', 'leaderstats', 'stats'],
  answer: 1,
  why: 'Exactly `leaderstats`, all lower case, parented to the player. Any value inside it, like an IntValue called Coins, gets its own column.',
  },
  'p11-again': {
  q: 'You played once and saw `visited 1 times`. You press Stop, then Play. What does this line show now?',
  options: ['visited 1 times', 'visited 2 times', 'visited nil times'],
  answer: 1,
  why: 'The 1 was saved under your key. This time `GetAsync` loads that 1 instead of `nil`, the script adds one, and saves 2. That is the whole point of a DataStore: it outlives the server.',
  },
  'p11-warm5': {
  recall: '11.3',
  options: ['true', 'false', 'the script stops'],
  answer: 1,
  why: '`nil + 1` is an error, but it happens inside the function given to `pcall`, so `pcall` catches it and gives back `false` as its first value. The script carries on.',
  },
  'p11-wipe': {
  q: 'This player had 500 coins saved. What do they have after this line runs?',
  options: ['500 coins', '0 coins', '500, because SetAsync adds'],
  answer: 1,
  why: '`SetAsync` replaces whatever was saved under the key. Saving a fresh table over a save that simply failed to load wipes the real data. That is why the build kicks the player and refuses to save anyone who did not load.',
  },
  // ── unit-12 ──
  'p12-warm1': {
  recall: '10.3',
  q: 'A LocalScript sends this to the server. What should the server do with the 9999?',
  options: ['Trust it and give the item', 'Ignore it and check its own record of coins', 'Save it to the DataStore'],
  answer: 1,
  why: 'Never trust the client. Anyone can change what their own computer sends. The server keeps the real coin count and only believes that.',
  },
  'p12-where': {
  q: 'This is the round countdown. Where must it run?',
  options: ['In a LocalScript on each player', 'In a Script on the server', 'Either, it makes no difference'],
  answer: 1,
  why: 'The server owns the game. If each client ran its own clock, every player could be in a different round, and anyone could change their own copy. One clock on the server, shown to everyone.',
  goal: 2,
  },
  'p12-warm2': {
  recall: '4.2',
  options: ['1 2 3', '3 2 1', '3'],
  answer: 1,
  why: 'The third number, `-1`, is the step: start at 3, go down by one each time, stop after 1. Each `print` makes its own line.',
  },
  'p12-early': {
  q: 'With 40 seconds left in the round, the only player in the arena dies. What happens?',
  options: ['The round waits out all 40 seconds', 'The round ends within about a second', 'The script errors'],
  answer: 1,
  why: '`Died` takes them out of `alive`. On the next lap, `countAlive()` is `0`, so `break` ends the loop and `endRound` runs straight away.',
  goal: 1,
  },
  'p12-warm3': {
  recall: '8.1',
  q: 'A player walks into this part. What is printed?',
  options: ['The name of the part they touched with', 'The player\'s character name', 'Workspace'],
  answer: 1,
  why: '`hit` is the body part that touched, like a foot. Its Parent is the character model, which is named after the player. That is why `GetPlayerFromCharacter(hit.Parent)` works.',
  },
  'p12-tween': {
  q: 'When does the print happen?',
  options: ['Straight away, while the lava rises', 'After the lava has finished rising', 'Never'],
  answer: 0,
  why: '`tween:Play()` starts the tween and returns at once. The lava climbs on its own while the script carries on, which is why the round can count down at the same time.',
  goal: 1,
  },
  'p12-warm4': {
  recall: '10.1',
  options: ['your name', 'nil', 'an error'],
  answer: 1,
  why: '`LocalPlayer` only means something on a player\'s own computer. The server is not a player, so on the server it is `nil`.',
  },
  'p12-reset': {
  q: 'At the end of a round, who gets a brand new character from this loop?',
  options: ['Everyone', 'Only the survivors', 'Only the players who died'],
  answer: 1,
  why: '`alive` only holds the survivors. Everyone else died during the round, and Roblox respawns them on its own timer. So only winners spawn at this moment, and only their GUIs get rebuilt.',
  goal: 2,
  },
  'p12-warm5': {
  recall: '11.5',
  q: 'Why kick a player whose data did not load, instead of letting them play?',
  options: ['To save memory on the server', 'So their real save is never overwritten with nothing', 'Because Roblox requires it'],
  answer: 1,
  why: 'If they played on with empty data, leaving would save that empty data over their real progress. Kicking costs them a rejoin. Not kicking could cost them everything.',
  },
  'p12-first': {
  q: 'This errors with *attempt to index nil with \'Name\'* on line 2. Which line holds the real mistake?',
  options: ['Line 2', 'Line 5', 'Line 6'],
  answer: 1,
  why: 'Line 2 is where the `nil` is **used**. It was **made** on line 5: `"Lavaa"` is a typo, so `FindFirstChild` found nothing. The red line points at the crash, and you follow the value back to where it went wrong.',
  goal: 1,
  },
  /*@@END PREDICTS*/
};


/* ── reading the course ───────────────────────────────────────────────── */

export const isLesson = l => l.kind === 'lesson';
export const courseList = () => LESSONS.filter(l => l.kind !== 'home');
export const writtenLessons = () => LESSONS.filter(l => isLesson(l) && !l.soon);
export const lessonById = id => LESSONS.find(l => l.id === id) || null;

/** The next stop to make: the first written lesson that is not finished.
 *  `done` is a predicate so this table stays free of any storage concerns. */
export const nextLesson = done => {
  const written = writtenLessons();
  return written.find(l => !done(l.id)) || written[0];
};

/** The cheatsheet for the stretch of line a lesson is on (variables before
 *  unit 3, so an early stop still has a reference to open). */
export const cheatFor = id => {
  const l = lessonById(id) && lessonById(id).g ? lessonById(id) : null;
  const g = (l || writtenLessons()[0]).g;
  return LESSONS.find(x => x.kind === 'tool' && x.g === g)
      || LESSONS.find(x => x.id === 'cheat');
};

/** Checkpoints in the written course: the only count the climb keeps. */
export const TOTAL_CPS = writtenLessons().reduce((n, l) => n + (GOALS[l.id] || []).length, 0);

/** Total XP available in the written course (kept for old saves; nothing shows it). */
export const TOTAL_XP = writtenLessons()
  .reduce((n, l) => n + (GOALS[l.id] || []).reduce((m, g) => m + (g.xp || 0), 0), 0);

export {
  GROUPS, LESSONS, GOALS, TASKS, PREDICTS, HOME_STEPS, HOME_COLS,
};
