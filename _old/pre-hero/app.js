/* ════════════════════════════════════════════════════════════════════════
   LUAU DESKTOP — app.js
   ────────────────────────────────────────────────────────────────────────
   Three things live in this file, in this order:
     1. CONTENT   — the course tree, goals, predicts, and Studio tasks
     2. MARKDOWN  — marked + DOMPurify + a Luau highlighter + block syntax
     3. DESKTOP   — routing, tabs, tree, palette, goals, activity, rain, boot

   Nothing on this site runs Luau. Every script in the course is copied into
   the learner's own Roblox Studio and run there; the site's job is to teach,
   show what the Output window should say, and keep track of progress.
   ════════════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ════════════════════════════════════════════════════════════════════════
   1. CONTENT
   ════════════════════════════════════════════════════════════════════════ */

const GROUPS = [
  { id: 'g1', label: 'Set up',       open: true },
  { id: 'g2', label: 'Variables',    open: true },
  { id: 'g3', label: 'Coming next',  open: false },
  { id: 'g9', label: 'Reference',    open: true },
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

  { id: '3.1',  kind: 'lesson', n: '3.1', g: 'g3', title: 'Making decisions',           soon: true, tag: 'logic', mins: 15 },
  { id: '3.2',  kind: 'lesson', n: '3.2', g: 'g3', title: 'Doing things again',         soon: true, tag: 'logic', mins: 15 },
  { id: '3.3',  kind: 'lesson', n: '3.3', g: 'g3', title: 'Your own functions',         soon: true, tag: 'logic', mins: 15 },
  { id: '3.4',  kind: 'lesson', n: '3.4', g: 'g3', title: 'Tables',                     soon: true, tag: 'data',  mins: 15 },
  { id: '3.5',  kind: 'lesson', n: '3.5', g: 'g3', title: 'Events: reacting to players', soon: true, tag: 'roblox', mins: 15 },

  { id: 'cheat', kind: 'tool',  n: '▸',   g: 'g9', title: 'Variables cheatsheet',       md: 'md-cheat', tag: 'reference', mins: 3 },
];

const isLesson = l => l.kind === 'lesson';
const courseList = () => LESSONS.filter(l => l.kind !== 'home');
const writtenLessons = () => LESSONS.filter(l => isLesson(l) && !l.soon);
const nextLesson = () => writtenLessons().find(l => !store.isDone(l.id)) || writtenLessons()[0];

/**
 * The homepage is the desktop, not a lesson — so its editorial copy lives
 * here rather than in lessons.md. Only the headline and its two opening
 * paragraphs come from the markdown, so the tone stays in one place.
 */
const HOME_STEPS = [
  ['Read one idea',
   'Short explanations, each with a script you can copy in one click.'],
  ['Run it in Studio',
   'Paste the script into your own Roblox Studio and press Play. The lesson shows what your <b>Output</b> window should say, so you know straight away if it worked.'],
  ['Tick it off',
   'Each lesson ends with an <b>In Studio</b> checklist. Tick the steps as you finish them and your progress is saved on this machine.'],
];

const HOME_COLS = [
  ['What you need', [
    '<strong>Roblox Studio</strong>, which is free, and a Roblox account to sign in with.',
    'A Windows PC or a Mac. Studio does not run on phones, tablets or Chromebooks.',
  ]],
  ['What it covers', [
    'Right now: <strong>variables</strong>, the first thing every Roblox script needs, from storing a number to holding a part in the world.',
    'Next up: decisions, loops, functions, tables and events.',
  ]],
  ['Two habits to start now', [
    '<strong>Predict before you press Play.</strong> Every lesson asks you to commit to an answer first. Being wrong and finding out why teaches far more than reading the right answer.',
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
};

/* ════════════════════════════════════════════════════════════════════════
   2. MARKDOWN
   ════════════════════════════════════════════════════════════════════════ */

const HL_RE = new RegExp([
  '(--\\[\\[[\\s\\S]*?\\]\\]|--[^\\n]*)',                                   // 1 comment
  '("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`|\\[\\[[\\s\\S]*?\\]\\])', // 2 string
  '(\\b0[xX][0-9a-fA-F]+\\b|\\b\\d+\\.?\\d*(?:[eE][+-]?\\d+)?\\b)',        // 3 number
  '(\\b(?:and|break|continue|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\\b)', // 4 keyword
  '([A-Za-z_]\\w*)(?=\\s*\\()',                                            // 5 call
  '\\b([A-Za-z_]\\w*)\\b',                                                 // 6 name
].join('|'), 'g');

const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function highlight(code) {
  let out = '', last = 0, m;
  HL_RE.lastIndex = 0;
  while ((m = HL_RE.exec(code))) {
    out += esc(code.slice(last, m.index));
    const t = esc(m[0]);
    if (m[1]) out += `<span class="c">${t}</span>`;
    else if (m[2]) out += `<span class="s">${t}</span>`;
    else if (m[3]) out += `<span class="n">${t}</span>`;
    else if (m[4]) out += `<span class="k">${t}</span>`;
    else if (m[5]) out += `<span class="f">${t}</span>`;
    else out += t;
    last = m.index + m[0].length;
  }
  out += esc(code.slice(last));
  return out;
}

const PILLS = {
  'V-rbx': ['rbxl', 'runs in Roblox Studio'],
  'V-lua': ['lua', 'plain Luau, no engine'],
  'VERIFY': ['warn', 'check this yourself'],
};

/* Custom fenced blocks are lifted out BEFORE marked sees them, so their
   syntax can never collide with real code fences:
     ```predict=p-first     a question with answer chips; body is the code
     ```task=setup-run      an In Studio checklist; body is `- step` lines  */
const BLOCK_RE = /^```[ \t]*(?:\w+[ \t]+)?(predict|task)=([\w.-]+)[ \t]*\n([\s\S]*?)^```[ \t]*$/gm;
const SENTINEL = '@@BLK:';

function splitBlocks(md) {
  const blocks = [];
  let last = 0, out = '', m;
  BLOCK_RE.lastIndex = 0;
  while ((m = BLOCK_RE.exec(md))) {
    out += md.slice(last, m.index);
    out += `\n\n${SENTINEL}${blocks.length}@@\n\n`;
    blocks.push({ kind: m[1], id: m[2], body: m[3].replace(/\s+$/, '') });
    last = m.index + m[0].length;
  }
  out += md.slice(last);
  return { md: out, blocks };
}

/* inline markdown for one short line — task steps carry `code` and **bold** */
const inline = s => DOMPurify.sanitize(marked.parseInline(s));

function renderMarkdown(md) {
  const { md: clean, blocks } = splitBlocks(md);

  let html = marked.parse(clean, { gfm: true, breaks: false });

  // inline pills like [V-rbx]
  html = html.replace(/\[(V-rbx|V-lua|VERIFY)\]/g, (_, k) =>
    `<span class="pill ${PILLS[k][0]}" title="${PILLS[k][1]}">${k}</span>`);

  const host = document.createElement('div');
  host.innerHTML = DOMPurify.sanitize(html, { ADD_ATTR: ['data-lang', 'data-wp'] });

  host.querySelectorAll('pre > code').forEach(code => {
    const pre = code.parentElement;
    const cls = [...code.classList].find(c => c.startsWith('language-'));
    const lang = cls ? cls.replace('language-', '') : '';
    if (lang === 'output') outputBlock(pre, code);
    else if (lang && lang !== 'text') {
      pre.dataset.lang = lang;
      const raw = code.textContent;
      code.innerHTML = highlight(raw);
      if (lang === 'lua' || lang === 'luau') addCopy(pre, raw);
    }
  });

  // wide tables get their own scroll box
  host.querySelectorAll('table').forEach(t => {
    const wrap = document.createElement('div');
    wrap.className = 'tbl';
    t.replaceWith(wrap);
    wrap.appendChild(t);
  });

  // put the interactive blocks back where their sentinel paragraph sits
  [...host.querySelectorAll('p')].forEach(p => {
    const m = new RegExp('^' + SENTINEL + '(\\d+)@@$').exec(p.textContent.trim());
    if (!m) return;
    const b = blocks[+m[1]];
    if (!b) return;
    p.replaceWith(b.kind === 'task' ? taskBlock(b) : predictBlock(b));
  });

  return host;
}

/* ── copy, because every script on this site goes into Studio ────────── */
function addCopy(pre, raw) {
  const b = document.createElement('button');
  b.className = 'copy';
  b.type = 'button';
  b.textContent = 'copy';
  b.onclick = async () => {
    try {
      await navigator.clipboard.writeText(raw.replace(/\n$/, ''));
      b.textContent = 'copied ✓';
    } catch (_) {
      // clipboard API blocked (insecure context) — select the code instead
      const r = document.createRange();
      r.selectNodeContents(pre.querySelector('code'));
      const sel = getSelection();
      sel.removeAllRanges(); sel.addRange(r);
      b.textContent = 'selected — ⌘C';
    }
    setTimeout(() => { b.textContent = 'copy'; }, 1600);
  };
  pre.classList.add('has-copy');
  pre.appendChild(b);
}

/* ── ```output — what Studio's Output window should show ─────────────────
   Lines starting with `! ` are errors (red in Studio too). A trailing
   `  -  Server - Script:3` source tag is dimmed, the way Studio shows it. */
function outputBlock(pre, code) {
  const lines = code.textContent.replace(/\n$/, '').split('\n');
  const box = document.createElement('div');
  box.className = 'outwin';
  box.innerHTML = `<div class="outwin-h"><span>Output</span><span class="sub">what Studio should show</span></div>
    <pre>${lines.map(l => {
      const err = l.startsWith('! ');
      const text = err ? l.slice(2) : l;
      const at = text.lastIndexOf('  -  ');
      const msg = at === -1 ? text : text.slice(0, at);
      const src = at === -1 ? '' : `<span class="src">${esc(text.slice(at))}</span>`;
      return `<span class="${err ? 'er' : 'ln'}">${esc(msg)}${src}</span>`;
    }).join('\n')}</pre>`;
  pre.replaceWith(box);
}

/* ── ```task — an In Studio checklist the learner ticks themselves ────── */
function taskBlock(b) {
  const cfg = TASKS[b.id];
  const box = document.createElement('div');
  box.className = 'blk task tile';
  if (!cfg) { box.textContent = `[missing task: ${b.id}]`; return box; }

  const steps = b.body.split('\n').map(l => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
  const lessonId = current;

  box.innerHTML = `
    <div class="tile-h">in Studio</div>
    <p class="blk-t">${cfg.title}</p>
    <ul class="checks">${steps.map((s, i) =>
      `<li data-i="${i}" role="checkbox" tabindex="0"><span class="m" aria-hidden="true"></span><span>${inline(s)}</span></li>`).join('')}
    </ul>
    <p class="hint" data-status></p>`;

  const items = [...box.querySelectorAll('.checks li')];
  const status = box.querySelector('[data-status]');

  const paint = () => {
    const have = store.taskOf(b.id);
    items.forEach((li, i) => {
      const on = have.includes(i);
      li.className = on ? 'pass' : '';
      li.setAttribute('aria-checked', String(on));
    });
    const all = have.length >= steps.length;
    status.textContent = all ? 'All done. Nice work.' : `${have.length} of ${steps.length} done`;
    status.className = 'hint' + (all ? ' pass' : '');
    return all;
  };

  const toggle = i => {
    store.toggleTask(b.id, i);
    if (paint()) completeGoal(lessonId, cfg.goal);
  };
  items.forEach((li, i) => {
    li.onclick = () => toggle(i);
    li.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(i); } };
  });
  paint();
  return box;
}

/* ── predict first ───────────────────────────────────────────────────── */
function predictBlock(b) {
  const cfg = PREDICTS[b.id];
  const box = document.createElement('div');
  box.className = 'blk tile';
  if (!cfg) { box.textContent = `[missing predict: ${b.id}]`; return box; }

  const lessonId = current;
  box.innerHTML = `
    <div class="tile-h">predict first</div>
    <p class="pre-q">What will the Output window show? Pick before you press Play.</p>
    <pre data-lang="lua"><code>${highlight(b.body)}</code></pre>
    <div class="predict">${cfg.options.map((o, i) => `<button data-i="${i}">${esc(o)}</button>`).join('')}</div>
    <p class="verdict" style="display:none"></p>`;

  const verdict = box.querySelector('.verdict');
  const buttons = [...box.querySelectorAll('.predict button')];
  buttons.forEach(btn => btn.onclick = () => {
    const i = +btn.dataset.i;
    buttons.forEach(x => x.disabled = true);
    buttons[cfg.answer].classList.add('right');
    const right = i === cfg.answer;
    if (!right) btn.classList.add('wrong');
    verdict.style.display = '';
    verdict.innerHTML = `${right ? '<b class="y">Yes.</b>' : '<b class="n">Not quite.</b>'} ${inline(cfg.why)}`;
    if (right && cfg.goal !== undefined) completeGoal(lessonId, cfg.goal);
  });
  return box;
}

/* ════════════════════════════════════════════════════════════════════════
   3. DESKTOP
   ════════════════════════════════════════════════════════════════════════ */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let current = null;
// set up in wire(); go() and the keyboard handler need to reach them
let isPeeking = () => false, endPeek = () => {}, startPeek = () => {};

/* ── persisted state ─────────────────────────────────────────────────── */
const store = (() => {
  const KEY = 'cozy-luau-v2';   // v2: Studio lessons — v1 progress was for a different course
  const s = { done: [], goals: {}, tasks: {}, days: [], wp: 'night-train', look: 2, rain: true, last: 'home', tabs: [] };
  try { Object.assign(s, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} };
  // The night-line redesign brought its own backdrops. Anyone who saved the
  // old default gets the new one once; a later pick of theirs is respected.
  if (s.look !== 2) { s.look = 2; s.wp = 'night-train'; save(); }

  const today = new Date().toISOString().slice(0, 10);
  if (!s.days.includes(today)) { s.days.push(today); s.days.sort(); save(); }

  // consecutive days ending today
  const streak = () => {
    let n = 0;
    const d = new Date();
    for (;;) {
      const key = d.toISOString().slice(0, 10);
      if (!s.days.includes(key)) break;
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  };

  return {
    raw: s, save, streak,
    taskOf: id => s.tasks[id] || [],
    toggleTask: (id, i) => {
      const t = s.tasks[id] || (s.tasks[id] = []);
      const at = t.indexOf(i);
      if (at === -1) t.push(i); else t.splice(at, 1);
      save();
    },
    isDone: id => s.done.includes(id),
    markDone: id => { if (!s.done.includes(id)) { s.done.push(id); save(); } },
    clear: () => { s.done = []; s.goals = {}; s.tasks = {}; s.tabs = []; save(); },
    goalsOf: id => s.goals[id] || [],
    setGoal: (id, i) => {
      const g = s.goals[id] || (s.goals[id] = []);
      if (!g.includes(i)) { g.push(i); save(); }
    },
  };
})();

/* ── output log ──────────────────────────────────────────────────────── */
const outEl = $('#out');
function log(kind, text) {
  const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const line = document.createElement('span');
  line.className = 'l';
  line.innerHTML = `<span class="t">${stamp}</span> <span class="${kind}">${esc(text)}</span>`;
  const caret = outEl.querySelector('.caret');
  if (caret) caret.remove();
  outEl.appendChild(line);
  outEl.appendChild(Object.assign(document.createElement('span'), { className: 'caret' }));
  outEl.scrollTop = outEl.scrollHeight;
}

/* ── the tree ────────────────────────────────────────────────────────── */
function renderTree() {
  const host = $('#nav');
  host.innerHTML = '';
  // Each group is a stretch of the line and each lesson a stop on it. The
  // stop marker carries the state: filled = done, half = started, ring = not
  // yet, dashed track = not written yet.
  for (const g of GROUPS) {
    const sec = document.createElement('div');
    sec.className = 'grp' + (g.open ? '' : ' closed') + (g.id === 'g3' ? ' future' : '');
    const items = LESSONS.filter(l => l.g === g.id);
    const counted = items.filter(isLesson);
    const done = counted.filter(l => store.isDone(l.id)).length;
    sec.innerHTML = `<button class="grp-h" data-g="${g.id}" aria-expanded="${g.open}">
      <svg class="caret" viewBox="0 0 10 10" aria-hidden="true"><path d="m3 2 4 3-4 3"/></svg>
      <span>${g.label}</span>
      <span class="cnt">${counted.length ? `${done}/${counted.length}` : ''}</span></button>`;
    const head = sec.querySelector('button');
    head.onclick = () => {
      sec.classList.toggle('closed');
      head.setAttribute('aria-expanded', String(!sec.classList.contains('closed')));
    };
    const list = document.createElement('div');
    list.className = 'stops';
    for (const l of items) {
      const b = document.createElement('button');
      const isDone = store.isDone(l.id);
      const doing = !isDone && store.goalsOf(l.id).length > 0;
      b.className = 'grp-item ' + (isDone ? 'done' : doing ? 'doing' : 'todo')
        + (l.soon ? ' soon' : '') + (l.kind === 'tool' ? ' tool' : '');
      b.dataset.id = l.id;
      b.innerHTML = `<span class="stop" aria-hidden="true"></span><span class="n">${l.kind === 'tool' ? 'ref' : l.n}</span><span class="t">${l.title}</span>`;
      b.setAttribute('aria-label', `${l.title}${isDone ? ', done' : doing ? ', started' : l.soon ? ', not written yet' : ''}`);
      b.onclick = () => go(l.id);
      list.appendChild(b);
    }
    sec.appendChild(list);
    host.appendChild(sec);
  }
  paintTreeState();
}

function paintTreeState() {
  $$('.grp-item').forEach(b => {
    b.classList.toggle('on', b.dataset.id === current);
  });
  const written = writtenLessons().length;
  const done = writtenLessons().filter(l => store.isDone(l.id)).length;
  $('#p-done').textContent = done;
  $('#p-total').textContent = written;
  $('#p-bar').style.width = written ? (done / written * 100) + '%' : '0%';
  $('#stat-lessons').innerHTML = `<b>${done}</b> done`;
  $('#stat-streak').innerHTML = `<b>${store.streak()}</b> day streak`;
}

/* ── goals ───────────────────────────────────────────────────────────── */
function renderGoals(id) {
  const list = GOALS[id] || [];
  const ul = $('#goals');
  ul.innerHTML = '';
  const have = store.goalsOf(id);
  list.forEach((g, i) => {
    const li = document.createElement('li');
    const done = have.includes(i);
    li.className = done ? 'done' : '';
    li.innerHTML = `<span class="bx" aria-hidden="true"></span><span class="txt">${g.t}</span>`;
    li.title = done ? 'Done' : 'Mark as done';
    li.onclick = () => completeGoal(id, i);
    ul.appendChild(li);
  });
  $('#goal-count').textContent = `${have.length}/${list.length}`;
  fitTiles();
}

function completeGoal(id, i) {
  if (!id || i === undefined) return;
  const before = store.goalsOf(id).length;
  store.setGoal(id, i);
  renderGoals(id);
  paintTreeState();
  const list = GOALS[id] || [];
  if (store.goalsOf(id).length === list.length && !store.isDone(id)) {
    store.markDone(id);
    log('ok', `✓ lesson complete: ${LESSONS.find(l => l.id === id)?.title}`);
    paintTreeState();
  } else if (store.goalsOf(id).length > before) {
    log('hl', `+ goal: ${list[i]?.t.replace(/<[^>]+>/g, '')}`);
  }
}

/* ── tabs ────────────────────────────────────────────────────────────── */
function openTab(id) {
  if (id === 'home') return;
  const t = store.raw.tabs;
  if (!t.includes(id)) t.unshift(id);
  store.raw.tabs = t.slice(0, 5);
  store.save();
  renderTabs();
}
function renderTabs() {
  const host = $('#tabs');
  host.innerHTML = '';
  store.raw.tabs.forEach((id, i) => {
    const l = LESSONS.find(x => x.id === id);
    if (!l) return;
    const b = document.createElement('button');
    b.className = 'tab' + (id === current ? ' on' : '') + (store.isDone(id) ? ' done' : '');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(id === current));
    b.title = 'Right-click to close';
    b.innerHTML = `<span class="tm">${i + 1}</span><span class="tt">${l.title}</span>`;
    b.onclick = () => go(id);
    b.oncontextmenu = e => { e.preventDefault(); store.raw.tabs = store.raw.tabs.filter(x => x !== id); store.save(); renderTabs(); };
    host.appendChild(b);
  });
}

/* ── the LED board ───────────────────────────────────────────────────────
   The one loud thing on the desktop: a dot-matrix sign like the ones above
   the doors on a night train. It is drawn dot by dot from a 5×8 font, so it
   looks the same in every browser and never waits on a web font. Each row
   is 5 bits, leftmost dot in the high bit; row 8 is the descender row. */
const GLYPHS = {
  A: [14,17,17,31,17,17,17], B: [30,17,17,30,17,17,30], C: [14,17,16,16,16,17,14],
  D: [28,18,17,17,17,18,28], E: [31,16,16,30,16,16,31], F: [31,16,16,30,16,16,16],
  G: [14,17,16,23,17,17,15], H: [17,17,17,31,17,17,17], I: [14,4,4,4,4,4,14],
  J: [7,2,2,2,2,18,12],      K: [17,18,20,24,20,18,17], L: [16,16,16,16,16,16,31],
  M: [17,27,21,21,17,17,17], N: [17,17,25,21,19,17,17], O: [14,17,17,17,17,17,14],
  P: [30,17,17,30,16,16,16], Q: [14,17,17,17,21,18,13], R: [30,17,17,30,20,18,17],
  S: [15,16,16,14,1,1,30],   T: [31,4,4,4,4,4,4],       U: [17,17,17,17,17,17,14],
  V: [17,17,17,17,17,10,4],  W: [17,17,17,21,21,21,10], X: [17,17,10,4,10,17,17],
  Y: [17,17,17,10,4,4,4],    Z: [31,1,2,4,8,16,31],
  a: [0,0,14,1,15,17,15,0],  b: [16,16,22,25,17,17,30,0], c: [0,0,14,16,16,17,14,0],
  d: [1,1,13,19,17,17,15,0], e: [0,0,14,17,31,16,14,0],   f: [6,9,8,28,8,8,8,0],
  g: [0,0,15,17,17,15,1,14], h: [16,16,22,25,17,17,17,0], i: [4,0,12,4,4,4,14,0],
  j: [2,0,6,2,2,2,18,12],    k: [16,16,18,20,24,20,18,0], l: [12,4,4,4,4,4,14,0],
  m: [0,0,26,21,21,17,17,0], n: [0,0,22,25,17,17,17,0],   o: [0,0,14,17,17,17,14,0],
  p: [0,0,30,17,17,30,16,16], q: [0,0,13,19,17,15,1,1],   r: [0,0,22,25,16,16,16,0],
  s: [0,0,14,16,14,1,30,0],  t: [8,8,28,8,8,9,6,0],       u: [0,0,17,17,17,19,13,0],
  v: [0,0,17,17,17,10,4,0],  w: [0,0,17,17,21,21,10,0],   x: [0,0,17,10,4,10,17,0],
  y: [0,0,17,17,17,15,1,14], z: [0,0,31,2,4,8,31,0],
  0: [14,17,19,21,25,17,14], 1: [4,12,4,4,4,4,14],  2: [14,17,1,2,4,8,31],
  3: [31,2,4,2,1,17,14],     4: [2,6,10,18,31,2,2], 5: [31,16,30,1,1,17,14],
  6: [6,8,16,30,17,17,14],   7: [31,1,2,4,8,8,8],   8: [14,17,17,14,17,17,14],
  9: [14,17,17,15,1,2,12],
  ' ': [0,0,0,0,0,0,0], '.': [0,0,0,0,0,12,12], ',': [0,0,0,0,12,4,8],
  ':': [0,12,12,0,12,12,0], '-': [0,0,0,14,0,0,0], '?': [14,17,1,2,4,0,4],
  '!': [4,4,4,4,4,0,4], "'": [12,4,8,0,0,0,0], '>': [8,4,2,1,2,4,8],
};
const glyphOf = ch => {
  const g = GLYPHS[ch] || GLYPHS[ch.toUpperCase()] || GLYPHS['?'];
  return g.length === 8 ? g : [...g, 0];
};
const glyphW = ch => (ch === ' ' ? 3 : 5);
const lineCols = s => [...s].reduce((w, ch) => w + glyphW(ch) + 1, 0) - 1;

// The break that keeps the longest line shortest, for a given line count.
function breakInto(text, n) {
  const words = text.split(/\s+/).filter(Boolean);
  if (n <= 1 || words.length < n) return [words.join(' ')];
  let best = null;
  (function rec(start, left, acc) {
    if (left === 1) {
      const ls = [...acc, words.slice(start).join(' ')];
      const w = Math.max(...ls.map(lineCols));
      if (!best || w < best.w) best = { w, ls };
      return;
    }
    for (let i = start + 1; i <= words.length - (left - 1); i++)
      rec(i, left - 1, [...acc, words.slice(start, i).join(' ')]);
  })(0, n, []);
  return best.ls;
}

const BOARD = { PAD: 2, LEAD: 3, MAX_PITCH: 11 };
let boardWatch = null;

function mountBoard(plate, text) {
  if (boardWatch) boardWatch.disconnect();
  const cv = plate.querySelector('canvas');
  if (!cv || !cv.getContext) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;

  // the drawable width is the plate's content box, not counting its padding
  const inner = () => {
    const cs = getComputedStyle(plate);
    return Math.floor(plate.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
  };
  const draw = animate => {
    const W = inner();
    if (W <= 0) return;
    width = W;
    const maxH = Math.max(120, Math.min(250, innerHeight * 0.3));

    // pick the line count that gives the biggest dots
    let pick = null;
    for (let n = 1; n <= 4; n++) {
      const lines = breakInto(text, n);
      const cols = Math.max(...lines.map(lineCols)) + BOARD.PAD * 2;
      const rows = lines.length * 8 + (lines.length - 1) * BOARD.LEAD + BOARD.PAD * 2 - 1;
      const pitch = Math.min(W / cols, maxH / rows, BOARD.MAX_PITCH);
      if (!pick || pitch > pick.pitch + 0.25) pick = { lines, rows, pitch };
    }
    const pitch = Math.max(3, Math.floor(pick.pitch * 4) / 4);
    const cols = Math.floor(W / pitch);
    const rows = pick.rows;
    const H = Math.ceil(rows * pitch);
    const ox = (W - cols * pitch) / 2;

    const lit = new Uint8Array(cols * rows);
    pick.lines.forEach((ln, li) => {
      let x = BOARD.PAD;
      const y0 = BOARD.PAD + li * (8 + BOARD.LEAD);
      for (const ch of ln) {
        const g = glyphOf(ch), w = glyphW(ch);
        for (let r = 0; r < 8; r++)
          for (let c = 0; c < w; c++)
            if ((g[r] >> (4 - c)) & 1 && x + c < cols && y0 + r < rows) lit[(y0 + r) * cols + x + c] = 1;
        x += w + 1;
      }
    });

    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const r = pitch * 0.36;
    const dot = (path, x, y, rad) => {
      const cx = ox + x * pitch + pitch / 2, cy = y * pitch + pitch / 2;
      path.moveTo(cx + rad, cy); path.arc(cx, cy, rad, 0, Math.PI * 2);
    };

    const frame = edge => {
      ctx.clearRect(0, 0, W, H);
      const off = new Path2D(), glow = new Path2D(), on = new Path2D(), hot = new Path2D();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        if (lit[y * cols + x] && x < edge) {
          dot(glow, x, y, r * 2.1); dot(on, x, y, r); dot(hot, x, y, r * 0.42);
        } else dot(off, x, y, r);
      }
      ctx.fillStyle = 'rgba(125, 255, 175, 0.075)'; ctx.fill(off);
      ctx.fillStyle = 'rgba(125, 255, 175, 0.13)';  ctx.fill(glow);
      ctx.fillStyle = '#7dffaf';                    ctx.fill(on);
      ctx.fillStyle = 'rgba(236, 255, 244, 0.85)';  ctx.fill(hot);
    };

    if (!animate || still) { frame(cols); return; }
    // one sweep, left to right, the way a sign refreshes between stops
    const t0 = performance.now(), dur = 900;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      frame((1 - Math.pow(1 - p, 3)) * (cols + 2));
      if (p < 1 && cv.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  draw(true);
  boardWatch = new ResizeObserver(() => { if (inner() !== width) draw(false); });
  boardWatch.observe(plate);
}

/* Lua is Portuguese for moon, so the mark is a pixel crescent. Generated
   from two overlapping circles rather than hand-placed pixels. */
function moonSVG(n = 16) {
  const c = (n - 1) / 2, R = n / 2 - 0.3;
  const inA = (x, y) => (x - c) ** 2 + (y - c) ** 2 <= R * R;
  const inB = (x, y) => (x - c - n * 0.28) ** 2 + (y - c + n * 0.22) ** 2 <= (R * 0.86) ** 2;
  let body = '', rim = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!inA(x, y) || inB(x, y)) continue;
    const px = `M${x} ${y}h1v1h-1z`;
    // the inner edge of the crescent catches the light
    if (inB(x + 1, y) || inB(x, y - 1) || inB(x + 1, y - 1)) rim += px; else body += px;
  }
  return `<svg class="moon" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true">
    <path class="mb" d="${body}"/><path class="mr" d="${rim}"/>
    <path class="ms" d="M${n - 3} 2h1v1h-1zM${n - 2} 6h1v1h-1zM${n - 5} ${n - 4}h1v1h-1z"/></svg>`;
}

/* Tile titles sit in the top border, btop-style. The border is a masked
   pseudo-element, and the gap in it has to match the title's width, which
   only layout knows, so it is measured after anything re-renders. */
function fitTiles(root = document) {
  root.querySelectorAll('.tile').forEach(t => {
    const h = t.querySelector(':scope > .tile-h');
    if (h && h.offsetWidth) t.style.setProperty('--tw', h.offsetWidth + 'px');
  });
}

/* ── the document ────────────────────────────────────────────────────── */
/**
 * Home is the desktop itself: the backdrop with tiles floating on it, no
 * lesson list, no side panels, no window chrome. The lesson prose supplies
 * the headline and its opening paragraphs; the rest is assembled from the
 * HOME_* tables above and from the live course list, so the line can never
 * drift out of sync with what is actually written.
 */
function buildDesktopHome(frag) {
  const wrap = document.createElement('div');
  wrap.className = 'desk-home';

  const written = writtenLessons();
  const next = nextLesson();
  const done = written.filter(l => store.isDone(l.id)).length;
  const started = done > 0 || store.raw.tabs.length > 0;
  const soon = LESSONS.filter(l => isLesson(l) && l.soon).length;

  const tile = (cls, title) => {
    const t = document.createElement('section');
    t.className = 'tile ' + cls;
    if (title) {
      const h = document.createElement('h2');
      h.className = 'tile-h';
      h.innerHTML = title;
      t.appendChild(h);
    }
    return t;
  };

  /* ── the board: the headline, lit dot by dot ── */
  const hero = tile('dh-board');
  const h1src = frag.querySelector('h1');
  const h1 = document.createElement('h1');
  h1.className = 'sr-only';
  h1.textContent = h1src ? h1src.textContent.trim() : 'Learn Roblox Luau from nothing';
  const plate = document.createElement('div');
  plate.className = 'board';
  plate.innerHTML = '<canvas aria-hidden="true"></canvas>';
  hero.append(h1, plate);

  const stopline = document.createElement('p');
  stopline.className = 'stopline';
  stopline.innerHTML = `<span class="k">${started ? 'next stop' : 'first stop'}</span>
    <span class="v">${next.n} ${next.title}</span><span class="m">~${next.mins} min</span>`;
  hero.appendChild(stopline);

  [...frag.querySelectorAll(':scope > p')].slice(0, 2).forEach(p => {
    p.className = 'lede';
    hero.appendChild(p);
  });

  const cta = document.createElement('div');
  cta.className = 'cta';
  const start = document.createElement('button');
  start.className = 'btn primary big';
  start.innerHTML = `${started ? 'Continue' : 'Start with'} ${next.n} <span class="ct">${next.title}</span>`;
  start.onclick = () => go(next.id);
  const ref = document.createElement('button');
  ref.className = 'btn big';
  ref.textContent = 'Open the cheatsheet';
  ref.onclick = () => go('cheat');
  cta.append(start, ref);
  hero.appendChild(cta);
  wrap.appendChild(hero);

  /* ── fetch: the learner's machine, fastfetch-style ── */
  const ff = tile('dh-fetch', 'you@luau');
  const spark = written.map(l => {
    const total = (GOALS[l.id] || []).length || 1;
    const f = store.isDone(l.id) ? 1 : Math.min(1, store.goalsOf(l.id).length / total);
    return '▁▂▃▄▅▆▇█'[Math.round(f * 7)];
  }).join('');
  const streak = store.streak();
  const body = document.createElement('div');
  body.className = 'ff';
  body.innerHTML = `${moonSVG()}
    <dl class="kv">
      <div><dt>course</dt><dd>Roblox Luau, from zero</dd></div>
      <div><dt>lessons</dt><dd>${written.length} written, ${soon} on the way</dd></div>
      <div><dt>done</dt><dd>${done} of ${written.length}</dd></div>
      <div><dt>progress</dt><dd class="spark" title="One bar per lesson, filled as you tick its goals">${spark}</dd></div>
      <div><dt>streak</dt><dd>${streak} ${streak === 1 ? 'day' : 'days'} in a row</dd></div>
      <div><dt>runs in</dt><dd>your own Roblox Studio</dd></div>
      <div><dt>needs</dt><dd>no coding experience</dd></div>
    </dl>`;
  const sw = document.createElement('div');
  sw.className = 'swatches';
  sw.setAttribute('aria-hidden', 'true');
  sw.innerHTML = '<i></i>'.repeat(8);
  ff.append(body, sw);
  wrap.appendChild(ff);

  /* ── the line: every lesson is a stop ── */
  const line = tile('dh-line', `the line <span class="cnt">${written.length} stops open, ${soon} being built</span>`);
  const ol = document.createElement('ol');
  ol.className = 'route';
  let lastGroup = null;
  courseList().forEach(l => {
    if (l.g !== lastGroup) {
      lastGroup = l.g;
      const sec = document.createElement('li');
      sec.className = 'rt-sec';
      sec.textContent = GROUPS.find(g => g.id === l.g)?.label || '';
      ol.appendChild(sec);
    }
    const isTool = l.kind === 'tool';
    const isDone = store.isDone(l.id);
    const doing = !isDone && store.goalsOf(l.id).length > 0;
    const isNext = !l.soon && !isDone && l.id === next.id;
    const state = l.soon ? 'soon' : isDone ? 'done' : isNext ? 'next' : doing ? 'doing' : isTool ? 'tool' : 'open';
    const label = { soon: 'being built', done: 'done', next: started ? 'next stop' : 'start here',
                    doing: 'started', tool: 'reference', open: '' }[state];
    const li = document.createElement('li');
    li.className = 'rt ' + state;
    li.innerHTML = `<button${l.soon ? ' disabled' : ''}>
        <span class="stop" aria-hidden="true"></span>
        <span class="n">${isTool ? 'ref' : l.n}</span>
        <span class="t">${l.title}</span>
        <span class="m">${l.mins ? `~${l.mins} min` : ''}</span>
        <span class="st">${label}</span>
      </button>`;
    if (!l.soon) li.querySelector('button').onclick = () => go(l.id);
    ol.appendChild(li);
  });
  line.appendChild(ol);
  wrap.appendChild(line);

  /* ── how a lesson works: a real sequence, so it is numbered ── */
  const how = tile('dh-how', 'how a lesson works');
  const steps = document.createElement('ol');
  steps.className = 'steps';
  steps.innerHTML = HOME_STEPS.map(([t, p]) => `<li><h3>${t}</h3><p>${p}</p></li>`).join('');
  const tip = document.createElement('p');
  tip.className = 'how-tip';
  tip.textContent = 'Keep this page and Roblox Studio open side by side.';
  how.append(steps, tip);
  wrap.appendChild(how);

  /* ── before you start ── */
  const about = tile('dh-about', 'before you start');
  const cols = document.createElement('div');
  cols.className = 'cols';
  cols.innerHTML = HOME_COLS.map(([t, paras]) =>
    `<div><h3>${t}</h3>${paras.map(p => `<p>${p}</p>`).join('')}</div>`).join('');
  about.appendChild(cols);
  wrap.appendChild(about);

  frag.replaceChildren(wrap);
}

function renderLesson(id) {
  const lesson = LESSONS.find(l => l.id === id);
  const doc = $('#doc');
  const gutter = $('#gutter');
  doc.innerHTML = '';
  if (boardWatch) { boardWatch.disconnect(); boardWatch = null; }
  document.body.classList.toggle('at-home', id === 'home');

  $('#win-title').textContent = lesson.slug || (lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md');
  $('#win-tag').textContent = lesson.tag;
  $('#foot-mode').textContent = lesson.kind === 'tool' ? 'reference' : lesson.soon ? 'draft' : 'lesson';
  $('#foot-left').textContent = 'line 1';

  const src = document.getElementById(lesson.md);
  if (lesson.soon || !src) {
    doc.innerHTML = `
      <div class="unbuilt">
        ${moonSVG()}
        <p class="soon-k">${lesson.n} is being built</p>
        <h2>${lesson.title}</h2>
        <p>The variables unit comes first. Once you have worked through it, this is the next stop.</p>
        <button class="btn primary" id="soon-go">Go to ${nextLesson().n} ${nextLesson().title}</button>
      </div>`;
    $('#soon-go').onclick = () => go(nextLesson().id);
    gutter.textContent = Array.from({ length: 12 }, (_, i) => i + 1).join('\n');
    $('#foot-right').textContent = 'utf-8';
    return;
  }

  const frag = renderMarkdown(src.textContent);
  if (id === 'home') buildDesktopHome(frag);
  else {
    // a kicker over each lesson title: where on the line this stop is
    const h1 = frag.querySelector('h1');
    if (h1) {
      const k = document.createElement('p');
      k.className = 'kicker';
      const grp = GROUPS.find(g => g.id === lesson.g)?.label || '';
      k.innerHTML = lesson.kind === 'tool'
        ? `<span>reference</span><span>keep it open while you work</span>`
        : `<span>${lesson.n}</span><span>${grp}</span><span>~${lesson.mins} min</span>`;
      h1.before(k);
    }
  }
  doc.append(...frag.childNodes);   // unwrapped, so .doc > * reaches each block

  if (id !== 'home') {
    const seq = courseList();
    const idx = seq.findIndex(l => l.id === id);
    const nav = document.createElement('nav');
    nav.className = 'stepnav';
    nav.setAttribute('aria-label', 'Previous and next lesson');
    const prev = seq[idx - 1], next = seq[idx + 1];
    nav.innerHTML = `
      <button ${prev ? `data-go="${prev.id}"` : 'disabled'}>
        <span class="k">previous stop</span><span class="v">${prev ? prev.title : 'This is the first stop'}</span></button>
      <button class="nx" ${next ? `data-go="${next.id}"` : 'disabled'}>
        <span class="k">next stop</span><span class="v">${next ? next.title : 'End of the line, for now'}</span></button>`;
    nav.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
    doc.appendChild(nav);
  }

  // gutter approximates the editor line numbers
  const lines = src.textContent.split('\n').length + 30;
  gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  gutter.style.transform = '';

  doc.scrollTop = 0;
  $('#foot-right').textContent = `~${lesson.mins || 2} min`;

  if (id === 'home') {
    const plate = doc.querySelector('.board');
    const h1 = doc.querySelector('.dh-board h1');
    if (plate && h1) mountBoard(plate, h1.textContent);
  }
  // after the at-home switch, so tiles that were hidden have a size again
  fitTiles();
}

/* ── routing ─────────────────────────────────────────────────────────── */
function go(id, push = true) {
  const lesson = LESSONS.find(l => l.id === id);
  if (!lesson) return;
  const fromHome = document.body.classList.contains('at-home');
  endPeek();
  current = id;
  store.raw.last = id;
  store.save();
  openTab(id);
  paintTreeState();
  renderGoals(id);
  renderLesson(id);
  if (fromHome !== (id === 'home')) playModeChange(id === 'home' ? 'to-home' : 'to-course');
  $$('.d-item').forEach(d => d.classList.toggle('on',
    d.dataset.open === 'home' ? id === 'home' : (id !== 'home')));
  const ws = id === 'home' ? '1' : id === 'cheat' ? '3' : '2';
  $$('.ws').forEach(x => {
    x.classList.toggle('on', x.dataset.goto === ws);
    x.setAttribute('aria-current', x.dataset.goto === ws ? 'page' : 'false');
  });
  if (push) location.hash = '#/' + id;
  if (window.innerWidth <= 860) document.body.classList.remove('tree-open');
}

// The home/course switch is a class flip, which on its own snaps the tree and
// panels in. A short-lived class runs the entry choreography in CSS instead.
let modeTimer = 0;
function playModeChange(kind) {
  const b = document.body;
  b.classList.remove('to-home', 'to-course');
  void b.offsetWidth;            // restart the animations if clicked mid-flight
  b.classList.add(kind);
  clearTimeout(modeTimer);
  modeTimer = setTimeout(() => b.classList.remove(kind), 900);
}

function step(d) {
  const seq = courseList();
  const i = seq.findIndex(l => l.id === current);
  const t = seq[i + d];
  if (t) go(t.id);
}

/* ── palette ─────────────────────────────────────────────────────────── */
let palSel = 0, palHits = [];
function openPalette() {
  document.body.classList.add('pal-open');
  const inp = $('#palette-input');
  inp.value = ''; palSel = 0;
  drawPalette('');
  setTimeout(() => inp.focus(), 30);
}
function closePalette() { document.body.classList.remove('pal-open'); }
function drawPalette(q) {
  q = q.trim().toLowerCase();
  palHits = [...courseList(), LESSONS.find(l => l.id === 'home')]
    .filter(l => !q || (l.title + ' ' + l.id).toLowerCase().includes(q));
  const host = $('#palette-list');
  if (!palHits.length) { host.innerHTML = '<div class="pempty">No lesson matches that. Try a word like part or text.</div>'; return; }
  host.innerHTML = palHits.map((l, i) => `
    <button class="prow ${i === palSel ? 'sel' : ''}" data-id="${l.id}" role="option" aria-selected="${i === palSel}">
      <span class="n">${l.kind === 'home' ? '~' : l.kind === 'tool' ? 'ref' : l.n}</span><span class="t">${l.title}</span>
      <span class="m">${store.isDone(l.id) ? 'done' : l.soon ? 'being built' : l.tag}</span>
    </button>`).join('');
  host.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
  host.querySelectorAll('.prow').forEach(b => b.onclick = () => { closePalette(); go(b.dataset.id); });
}

/* ── backdrop ────────────────────────────────────────────────────────── */
function paintWall(id) {
  if (!$(`#wp img[data-wp="${id}"]`)) id = 'night-train';
  $$('#wp img').forEach(img => img.classList.toggle('on', img.dataset.wp === id));
  document.documentElement.dataset.wp = id;
  $$('.wk-thumb').forEach(t => {
    t.classList.toggle('on', t.dataset.wp === id);
    t.setAttribute('aria-pressed', String(t.dataset.wp === id));
  });
}
function buildWallPicker() {
  const grid = $('#wp-grid');
  grid.innerHTML = $$('#wp img').map(img => `
    <button class="wk-thumb ${img.dataset.wp === store.raw.wp ? 'on' : ''}" data-wp="${img.dataset.wp}"
      ${img.hasAttribute('data-px') ? 'data-px' : ''} aria-pressed="${img.dataset.wp === store.raw.wp}">
      <img src="${img.getAttribute('src')}" alt="" loading="lazy">
      <span>${img.dataset.label || img.dataset.wp}</span>
    </button>`).join('');
  grid.querySelectorAll('.wk-thumb').forEach(b => b.onclick = () => {
    store.raw.wp = b.dataset.wp; store.save(); paintWall(b.dataset.wp);
  });
}

/* ── rain ────────────────────────────────────────────────────────────── */
function startRain() {
  const cv = $('#rain'), ctx = cv.getContext('2d');
  let w, h, drops, raf;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size() {
    w = cv.width = innerWidth; h = cv.height = innerHeight;
    const n = Math.min(150, Math.round(w / 9));
    drops = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      l: 9 + Math.random() * 20, s: 0.7 + Math.random() * 1.5, a: 0.05 + Math.random() * 0.16,
      hue: Math.random() < 0.06,
    }));
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (const d of drops) {
      ctx.strokeStyle = d.hue ? `rgba(255, 140, 220, ${d.a * 1.4})` : `rgba(170, 200, 255, ${d.a})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 1.2, d.y + d.l); ctx.stroke();
      d.y += d.s * 4.4; d.x -= d.s * 0.5;
      if (d.y > h) { d.y = -d.l; d.x = Math.random() * w; }
    }
    raf = requestAnimationFrame(frame);
  }
  size();
  addEventListener('resize', size);
  if (!still) frame();
  return { stop: () => cancelAnimationFrame(raf) };
}

/* ── clock, boot ─────────────────────────────────────────────────────── */
function clock() {
  const d = new Date();
  $('#clock-time').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  $('#clock-date').textContent = d.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })
    .toLowerCase().replace(',', '');
}
setInterval(clock, 20000); clock();

function battery() {
  if (!navigator.getBattery) return;
  navigator.getBattery().then(b => {
    const bars = '▮'.repeat(Math.max(1, Math.round(b.level * 4))) + '▯'.repeat(4 - Math.max(1, Math.round(b.level * 4)));
    const t = `${bars} ${Math.round(b.level * 100)}%`;
    $('#stat-bat').textContent = t;
    setTimeout(battery, 60000);
  }).catch(() => {});
}

async function boot() {
  const el = $('#boot-log');
  const lines = [
    ['luau desktop 0.6, night line', 'dim'],
    ['  mounting ~/roblox-luau ............ ok', 'ok'],
    ['  reading your progress ............. ok', 'ok'],
    ['  roblox studio ..................... on your machine', 'ok'],
    ['', ''],
    ['open Studio next to this window.', 'on'],
  ];
  let text = '';
  for (const [l] of lines) {
    const chunks = l.match(/.{1,3}/g) || [''];
    for (const c of chunks) { text += c; el.innerHTML = esc(text) + '<span class="caret"></span>'; await sleep(11); }
    text += '\n';
    el.innerHTML = esc(text).replace(/ ok$/gm, ' <span class="ok">ok</span>') + '<span class="caret"></span>';
    await sleep(70);
  }
  // the fade itself is a CSS animation (see #boot) — it starts as soon as the
  // log stops animating, so there is no timer to keep in sync here
  await sleep(200);
  document.body.classList.remove('booting');
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ── wiring ──────────────────────────────────────────────────────────── */
function wire() {
  // top bar
  // Home has no tree to toggle, so there the button opens the course with
  // the tree showing; inside the course it collapses / expands the tree.
  $('#menu-btn').onclick = () => {
    const b = document.body;
    if (b.classList.contains('at-home')) {
      b.classList.remove('no-tree');
      go(nextLesson().id);
      if (innerWidth <= 860) b.classList.add('tree-open');
      return;
    }
    if (innerWidth <= 860) b.classList.toggle('tree-open');
    else b.classList.toggle('no-tree');
  };
  $('#tree-close').onclick = () => document.body.classList.toggle('no-tree');

  // window controls — red closes the lesson's tab, yellow tucks the window
  // into the dock, green toggles a focus mode with only the lesson on screen
  const win = $('#win-lesson');
  const setMax = on => {
    document.body.classList.toggle('win-max', on);
    $('#win-max').setAttribute('aria-pressed', String(on));
  };
  $('#win-close').onclick = () => {
    const id = current;
    store.raw.tabs = store.raw.tabs.filter(x => x !== id);
    store.save();
    log('dim', `closed ${LESSONS.find(l => l.id === id)?.title || id}`);
    win.classList.add('closing');
    setTimeout(() => {
      win.classList.remove('closing');
      const nextTab = store.raw.tabs[0];
      setMax(false);
      if (nextTab) go(nextTab); else { renderTabs(); go('home'); }
    }, 200);
  };
  $('#win-min').onclick = () => {
    win.classList.add('minimizing');
    setTimeout(() => {
      win.classList.remove('minimizing');
      setMax(false);
      go('home');
    }, 380);
  };
  $('#win-max').onclick = () => setMax(!document.body.classList.contains('win-max'));
  $('.win-bar').ondblclick = e => { if (!e.target.closest('.dots')) $('#win-max').onclick(); };
  $$('.ws').forEach(b => b.onclick = () => {
    const to = { 1: 'home', 2: nextLesson().id, 3: 'cheat' }[b.dataset.goto];
    // "next lesson" while already in a lesson keeps you where you are
    go(b.dataset.goto === '2' && current && isLesson(LESSONS.find(l => l.id === current)) ? current : to);
  });
  const brand = $('#brand');
  if (brand) brand.onclick = () => go('home');
  $('#wp-btn').onclick = () => document.body.classList.toggle('wp-open');
  $('#pal-btn').onclick = openPalette;

  // peek: hide every panel so the backdrop fills the screen. Esc, a click
  // anywhere or the pill at the bottom brings the desktop back.
  const peekBtn = $('#peek-btn'), peekBack = $('#peek-back');
  const setPeek = on => {
    if (on && !document.body.classList.contains('at-home')) return;
    document.body.classList.toggle('peek', on);
    peekBtn.setAttribute('aria-pressed', String(on));
    peekBack.tabIndex = on ? 0 : -1;
    if (on) setTimeout(() => peekBack.focus({ preventScroll: true }), 320);
    else if (document.activeElement === peekBack) peekBtn.focus({ preventScroll: true });
  };
  peekBtn.onclick = () => setPeek(true);
  peekBack.onclick = () => setPeek(false);
  $('#wp').addEventListener('click', () => setPeek(false));
  isPeeking = () => document.body.classList.contains('peek');
  endPeek = () => setPeek(false);
  startPeek = () => setPeek(true);
  $('#wp-x').onclick = () => document.body.classList.remove('wp-open');
  $('#rain-btn').onclick = () => {
    store.raw.rain = !store.raw.rain; store.save();
    $('#rain').classList.toggle('off', !store.raw.rain);
    $('#rain-btn').setAttribute('aria-pressed', String(store.raw.rain));
    $('#rain-btn').classList.toggle('on', store.raw.rain);
  };
  $('#out-clear').onclick = () => { outEl.innerHTML = ''; log('dim', 'cleared'); };
  addEventListener('resize', () => fitTiles());
  document.fonts?.ready.then(() => fitTiles());
  $('#reset-btn').onclick = () => {
    if (!confirm('Forget all progress and every ticked step?')) return;
    store.clear(); renderTree(); renderGoals(current); renderLesson(current); renderTabs();
    log('er', 'progress cleared');
  };

  // tree search filters in place
  $('#search').oninput = e => {
    const q = e.target.value.trim().toLowerCase();
    $$('.grp').forEach(sec => {
      let any = false;
      sec.querySelectorAll('.grp-item').forEach(b => {
        const l = LESSONS.find(x => x.id === b.dataset.id);
        const hit = !q || (l.title + ' ' + l.id).toLowerCase().includes(q);
        b.style.display = hit ? '' : 'none';
        if (hit) any = true;
      });
      sec.style.display = any || !q ? '' : 'none';
      if (q) sec.classList.remove('closed');
    });
  };

  // dock
  $$('.d-item').forEach(d => d.onclick = () => {
    d.classList.add('bounce');
    setTimeout(() => d.classList.remove('bounce'), 500);
    go(d.dataset.open === 'home' ? 'home'
      : (current && current !== 'home' ? current : nextLesson().id));
  });

  // palette
  $('#palette-input').oninput = e => { palSel = 0; drawPalette(e.target.value); };
  $('#palette').onclick = e => e.stopPropagation();
  $('#scrim').onclick = () => { closePalette(); document.body.classList.remove('wp-open'); };

  // scroll → line numbers
  const doc = $('#doc'), gutter = $('#gutter');
  doc.addEventListener('scroll', () => {
    gutter.style.transform = `translateY(${-doc.scrollTop}px)`;
    const lh = parseFloat(getComputedStyle(doc).lineHeight) || 24;
    const ln = Math.max(1, Math.round(doc.scrollTop / lh) + 1);
    const pct = Math.round(doc.scrollTop / Math.max(1, doc.scrollHeight - doc.clientHeight) * 100);
    $('#foot-left').textContent = `line ${ln}`;
    if (current !== 'home') $('#foot-right').textContent = `${isNaN(pct) ? 100 : pct}%`;
  });

  // keyboard
  addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '');
    if (isPeeking()) {
      // while peeking only Esc (and B, which toggles) mean anything
      if (e.key === 'Escape' || e.key.toLowerCase() === 'b') { e.preventDefault(); endPeek(); }
      return;
    }
    if (e.key === 'Escape') {
      const overlay = document.body.classList.contains('pal-open') || document.body.classList.contains('wp-open');
      closePalette(); document.body.classList.remove('wp-open');
      if (!overlay && !typing && document.body.classList.contains('win-max')) $('#win-max').click();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    if (typing) return;
    if (e.key.toLowerCase() === 'b' && !e.metaKey && !e.ctrlKey && current === 'home') { startPeek(); return; }
    if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
    if (e.key === '[') step(-1);
    if (e.key === ']') step(1);
    if (e.key === 'j') step(1);
    if (e.key === 'k') step(-1);
  });
  $('#palette-input').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palSel + 1, palHits.length - 1); drawPalette(e.target.value); }
    if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(palSel - 1, 0); drawPalette(e.target.value); }
    if (e.key === 'Enter' && palHits[palSel]) { closePalette(); go(palHits[palSel].id); }
  });

  addEventListener('hashchange', () => {
    const id = location.hash.replace('#/', '');
    if (id && id !== current) go(id, false);
  });
}

/* ── lesson bodies ───────────────────────────────────────────────────────
   The markdown lives in one file and is split into per-lesson <div id="md-x">
   elements. It is fetched rather than inlined so the authoring copy stays
   readable and out of the way; the fallback below means a double-clicked
   index.html still shows the shell instead of a blank page. */
async function loadLessonBodies() {
  try {
    const res = await fetch('content/lessons.md', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const host = document.createElement('div');
    host.innerHTML = await res.text();          // inert: a detached div
    [...host.children].forEach(el => {
      if (el.id && el.id.startsWith('md-')) document.body.appendChild(el);
    });
  } catch (e) {
    const miss = document.createElement('div');
    miss.id = 'md-__missing';
    miss.hidden = true;
    document.body.appendChild(miss);
    $('#doc') && null;
    setTimeout(() => {
      $('#doc').innerHTML = `
        <div class="unbuilt">
          <div class="big">[ no lesson text ]</div>
          <h2>This site needs to be served over http</h2>
          <p>The lesson markdown is fetched at runtime, and browsers block that on
             <code>file://</code>. Two ways around it:</p>
          <p style="text-align:left;max-width:52ch;margin:0 auto 14px">
            <code>cd cozy &amp;&amp; ./serve.sh</code> &nbsp;→&nbsp; opens on
            <code>http://localhost:8925</code><br>
            or, in this folder, <code>python3 -m http.server</code>
          </p>
          <p class="hint">Everything else on the page is loaded and working — only the
             lesson text is missing.</p>
        </div>`;
    }, 60);
  }
}

/* ── start ───────────────────────────────────────────────────────────── */
async function start() {
  buildWallPicker();
  paintWall(store.raw.wp);
  $('#rain').classList.toggle('off', !store.raw.rain);
  $('#rain-btn').classList.toggle('on', store.raw.rain);
  renderTree();
  wire();
  startRain();
  battery();

  // ?noboot skips the intro — for screenshots and for anyone who has seen it
  const skipBoot = /[?&]noboot\b/.test(location.search);
  if (skipBoot) $('#boot').remove();
  const booting = skipBoot ? (document.body.classList.remove('booting'), Promise.resolve()) : boot();
  await loadLessonBodies();

  const wanted = location.hash.replace('#/', '');
  const first = LESSONS.find(l => l.id === wanted) ? wanted
              : (LESSONS.find(l => l.id === store.raw.last) ? store.raw.last : 'home');
  go(first, false);
  log('dim', 'session opened');
  log('ok', `picking up at ${LESSONS.find(l => l.id === first)?.title}`);

  renderTabs();
  await booting;
}

document.addEventListener('DOMContentLoaded', start);
})();
