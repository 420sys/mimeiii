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
  { id: 'g1', label: '01 · set up',        open: true },
  { id: 'g2', label: '02 · variables',     open: true },
  { id: 'g3', label: '03 · coming next',   open: false },
  { id: 'g9', label: '99 · reference',     open: true },
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
  ['01 · read', 'One idea at a time',
   'Short explanations, each with a script you can copy in one click.'],
  ['02 · do it in Studio', 'Paste, press Play, compare',
   'You run every script in your own Roblox Studio. The lesson shows what your <b>Output</b> window should say, so you know straight away if it worked.'],
  ['03 · tick it off', 'Your progress, saved here',
   'Each lesson ends with a short <b>In Studio</b> checklist. Tick the steps as you finish them and the goal on the right lights up.'],
];

const HOME_COLS = [
  ['What you need', [
    '<strong>Roblox Studio</strong>, which is free, and a Roblox account to sign in with.',
    'A Windows PC or a Mac. Studio does not run on phones, tablets or Chromebooks.',
  ]],
  ['What it covers', [
    'Right now: <strong>variables</strong> — the first thing every Roblox script needs, from storing a number to holding a part in the world.',
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
  box.innerHTML = `<div class="outwin-h"><span>output</span><span class="sub">what Studio should show</span></div>
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
  box.className = 'blk task';
  if (!cfg) { box.textContent = `[missing task: ${b.id}]`; return box; }

  const steps = b.body.split('\n').map(l => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
  const lessonId = current;

  box.innerHTML = `
    <div class="blk-h">in studio <span class="sub">${cfg.title}</span></div>
    <ul class="checks">${steps.map((s, i) =>
      `<li data-i="${i}" role="checkbox" tabindex="0"><span class="m">○</span><span>${inline(s)}</span></li>`).join('')}
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
      li.querySelector('.m').textContent = on ? '✔' : '○';
    });
    const all = have.length >= steps.length;
    status.textContent = all ? '✓ done — nice work' : `${have.length}/${steps.length} done`;
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
  box.className = 'blk';
  if (!cfg) { box.textContent = `[missing predict: ${b.id}]`; return box; }

  const lessonId = current;
  box.innerHTML = `
    <div class="blk-h">predict first <span class="sub">decide before you press Play</span></div>
    <p class="pre-q">What will the Output window show?</p>
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

/* ── persisted state ─────────────────────────────────────────────────── */
const store = (() => {
  const KEY = 'cozy-luau-v2';   // v2: Studio lessons — v1 progress was for a different course
  const s = { done: [], goals: {}, tasks: {}, days: [], wp: 'windowsill', rain: true, last: 'home', tabs: [] };
  try { Object.assign(s, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} };

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
  for (const g of GROUPS) {
    const sec = document.createElement('div');
    sec.className = 'grp' + (g.open ? '' : ' closed');
    const items = LESSONS.filter(l => l.g === g.id);
    const done = items.filter(l => store.isDone(l.id)).length;
    sec.innerHTML = `<button data-g="${g.id}"><span class="caret">▾</span> ${g.label}
      <span style="margin-left:auto;color:var(--fg-4)">${done}/${items.length}</span></button>`;
    sec.querySelector('button').onclick = () => sec.classList.toggle('closed');
    for (const l of items) {
      const b = document.createElement('button');
      const done = store.isDone(l.id);
      const doing = !done && store.goalsOf(l.id).length > 0;
      b.className = 'grp-item ' + (done ? 'done' : doing ? 'doing' : 'todo') + (l.soon ? ' soon' : '');
      b.dataset.id = l.id;
      b.innerHTML = `<span class="n">${l.n}</span><span class="t">${l.title}</span>
        <span class="mk">${l.soon ? '·' : ''}</span><span class="e"></span>`;
      b.onclick = () => go(l.id);
      sec.appendChild(b);
    }
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
  $('#stat-lessons').textContent = '▤ ' + done;
  $('#stat-streak').textContent = '✦ ' + store.streak();
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
    li.innerHTML = `<span class="bx">${done ? '▣' : '▢'}</span><span class="txt">${g.t}</span><span class="xp">${g.xp}</span>`;
    li.onclick = () => { store.setGoal(id, i); renderGoals(id); paintTreeState(); };
    ul.appendChild(li);
  });
  $('#goal-count').textContent = `${have.length}/${list.length}`;
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
  store.raw.tabs.forEach(id => {
    const l = LESSONS.find(x => x.id === id);
    if (!l) return;
    const b = document.createElement('button');
    b.className = 'tab' + (id === current ? ' on' : '');
    b.innerHTML = `<span class="tm">${store.isDone(id) ? '✔' : '·'}</span>${l.title}`;
    b.onclick = () => go(id);
    b.oncontextmenu = e => { e.preventDefault(); store.raw.tabs = store.raw.tabs.filter(x => x !== id); store.save(); renderTabs(); };
    host.appendChild(b);
  });
}

/* ── the document ────────────────────────────────────────────────────── */
/**
 * Home is the desktop itself: the wallpaper with panels floating on it, no
 * file tree, no side panels, no window chrome. The lesson prose supplies
 * the headline and its opening paragraphs; the rest is assembled from the
 * HOME_* tables above and from the live course list, so the grid can never
 * drift out of sync with what is actually written.
 */
function buildDesktopHome(frag) {
  const wrap = document.createElement('div');
  wrap.className = 'desk-home';

  /* ── hero ── */
  const hero = document.createElement('div');
  hero.className = 'dh-panel dh-hero';

  const kick = document.createElement('div');
  kick.className = 'hero-kick';
  kick.textContent = 'roblox luau · from zero · in your own studio';
  hero.appendChild(kick);

  const h1 = frag.querySelector('h1');
  if (h1) {
    // the tagline is "from nothing" — give it the emphasis it is asking for
    h1.innerHTML = h1.innerHTML.replace(/from nothing/i, '<em>from nothing</em>');
    hero.appendChild(h1);
  }
  [...frag.querySelectorAll(':scope > p')].slice(0, 2).forEach(p => {
    p.className = 'hero-lede';
    hero.appendChild(p);
  });

  const cta = document.createElement('div');
  cta.className = 'hero-cta';
  const written = writtenLessons();
  const next = nextLesson();
  const started = store.raw.done.length > 0 || store.raw.tabs.length > 0;

  const start = document.createElement('button');
  start.className = 'btn primary big';
  start.textContent = started ? `▸ Continue ${next.n} — ${next.title}` : `▸ Start with ${next.n} — ${next.title}`;
  start.onclick = () => go(next.id);

  const ref = document.createElement('button');
  ref.className = 'btn big';
  ref.textContent = 'Variables cheatsheet';
  ref.onclick = () => go('cheat');

  cta.append(start, ref);
  hero.appendChild(cta);

  const meta = document.createElement('div');
  meta.className = 'hero-meta';
  meta.innerHTML = `<span><b>${written.length}</b> lessons written</span>
    <span>needs <b>Roblox Studio</b> (free)</span>
    <span><b>no</b> coding experience</span>`;
  hero.appendChild(meta);
  wrap.appendChild(hero);

  /* ── resume, only once there is something to resume ── */
  const done = written.filter(l => store.isDone(l.id)).length;
  if (done > 0) {
    const bar = document.createElement('div');
    bar.className = 'dh-panel dh-resume';
    bar.innerHTML = `<span class="lab">progress</span>`;
    const txt = document.createElement('div');
    txt.className = 'grow';
    txt.innerHTML = `<div class="ttl">${done} of ${written.length} lessons done</div>
      <div class="sub">next up: ${next.n} — ${next.title}</div>`;
    const track = document.createElement('div');
    track.className = 'track';
    track.style.cssText = 'flex:1 1 140px;min-width:120px';
    track.innerHTML = `<i style="width:${Math.round(done / written.length * 100)}%"></i>`;
    const resume = document.createElement('button');
    resume.className = 'btn primary';
    resume.textContent = '▸ Resume';
    resume.onclick = () => go(next.id);
    bar.append(txt, track, resume);
    wrap.appendChild(bar);
  }

  /* ── the course, generated from the manifest ── */
  const course = document.createElement('section');
  course.className = 'dh-panel dh-sec';
  const soon = LESSONS.filter(l => isLesson(l) && l.soon).length;
  course.innerHTML = `<h2>the course <span class="cnt">${written.length} written · ${soon} to come</span></h2>`;
  const grid = document.createElement('div');
  grid.className = 'lesson-grid';
  courseList().forEach(l => {
    const isTool = l.kind === 'tool';
    const isDone = store.isDone(l.id);
    const doing = !isDone && store.goalsOf(l.id).length > 0;
    const b = document.createElement('button');
    b.className = 'lcard' + (l.soon ? ' soon' : isDone ? ' done' : doing ? ' doing' : '');
    b.innerHTML = `<span class="n">${isTool ? 'tool' : l.n}</span>
      <span class="t">${l.title}</span>
      <span class="m"><span>${isTool ? 'always open' : '~' + l.mins + ' min'}</span>
        <span class="st">${l.soon ? 'soon' : isDone ? 'done' : doing ? 'in progress' : 'not started'}</span></span>`;
    if (!l.soon) b.onclick = () => go(l.id);
    grid.appendChild(b);
  });
  course.appendChild(grid);
  wrap.appendChild(course);

  /* ── how a lesson works ── */
  const how = document.createElement('section');
  how.className = 'dh-panel dh-sec';
  how.innerHTML = `<h2>how a lesson works</h2>
    <p>Every lesson has the same three parts. Keep this site and Roblox Studio open side by side.</p>`;
  const steps = document.createElement('div');
  steps.className = 'steps';
  steps.innerHTML = HOME_STEPS.map(([num, title, body]) =>
    `<div class="step"><span class="num">${num}</span><h3>${title}</h3><p>${body}</p></div>`).join('');
  how.appendChild(steps);
  wrap.appendChild(how);

  /* ── what this is / is not / habits ── */
  const about = document.createElement('section');
  about.className = 'dh-panel dh-sec';
  about.innerHTML = `<h2>about this course</h2>`;
  const cols = document.createElement('div');
  cols.className = 'dh-cols';
  cols.innerHTML = HOME_COLS.map(([title, paras]) =>
    `<div><h3>${title}</h3>${paras.map(p => `<p>${p}</p>`).join('')}</div>`).join('');
  about.appendChild(cols);
  wrap.appendChild(about);

  frag.replaceChildren(wrap);
}

function renderLesson(id) {
  const lesson = LESSONS.find(l => l.id === id);
  const doc = $('#doc');
  const gutter = $('#gutter');
  const win = $('#win-lesson');
  doc.innerHTML = '';
  document.body.classList.toggle('at-home', id === 'home');

  $('#win-title').textContent = lesson.slug || (lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.md');
  $('#win-tag').textContent = lesson.tag;

  const src = document.getElementById(lesson.md);
  if (lesson.soon || !src) {
    doc.innerHTML = `
      <div class="soon">
        <div class="big">[ not written yet ]</div>
        <h2>${lesson.title}</h2>
        <p>This one is not written yet. The variables unit comes first — once you have
           worked through it, this is next.</p>
        <button class="btn primary" id="want">ask for this lesson</button>
      </div>`;
    const want = $('#want');
    if (want) want.onclick = () => {
      log('hl', `queued: ${lesson.title}`);
      want.textContent = '✓ queued';
      want.disabled = true;
    };
    gutter.textContent = Array.from({ length: 12 }, (_, i) => i + 1).join('\n');
    return;
  }

  const frag = renderMarkdown(src.textContent);
  if (id === 'home') buildDesktopHome(frag);
  doc.appendChild(frag);

  // prev / next
  const seq = courseList();
  const idx = seq.findIndex(l => l.id === id);
  const nav = document.createElement('div');
  nav.className = 'stepnav';
  const prev = seq[idx - 1], next = seq[idx + 1];
  nav.innerHTML = `
    <button ${prev ? `data-go="${prev.id}"` : 'disabled'}>
      <span class="k">← before</span>${prev ? prev.title : 'this is the start'}</button>
    <button class="nx" ${next ? `data-go="${next.id}"` : 'disabled'}>
      <span class="k">next →</span>${next ? next.title : 'the end'}</button>`;
  nav.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  doc.appendChild(nav);

  // gutter approximates the editor line numbers
  const lines = src.textContent.split('\n').length + 30;
  gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');

  doc.scrollTop = 0;
  $('#foot-right').textContent = `luau · utf-8 · ~${lesson.mins || 2} min`;
}

/* ── routing ─────────────────────────────────────────────────────────── */
function go(id, push = true) {
  const lesson = LESSONS.find(l => l.id === id);
  if (!lesson) return;
  const fromHome = document.body.classList.contains('at-home');
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
  if (!palHits.length) { host.innerHTML = '<div class="pempty">nothing matches that</div>'; return; }
  host.innerHTML = palHits.map((l, i) => `
    <button class="prow ${i === palSel ? 'sel' : ''}" data-id="${l.id}">
      <span class="n">${l.n}</span><span class="t">${l.title}</span>
      <span class="m">${store.isDone(l.id) ? 'done' : l.tag}</span>
    </button>`).join('');
  host.querySelectorAll('.prow').forEach(b => b.onclick = () => { closePalette(); go(b.dataset.id); });
}

/* ── backdrop ────────────────────────────────────────────────────────── */
function paintWall(id) {
  $$('#wp img').forEach(img => img.classList.toggle('on', img.dataset.wp === id));
  document.documentElement.dataset.wp = id;
  $$('.wk-thumb').forEach(t => t.classList.toggle('on', t.dataset.wp === id));
}
function buildWallPicker() {
  const grid = $('#wp-grid');
  grid.innerHTML = $$('#wp img').map(img => `
    <button class="wk-thumb ${img.dataset.wp === store.raw.wp ? 'on' : ''}" data-wp="${img.dataset.wp}">
      <img src="${img.getAttribute('src')}" alt="" loading="lazy">
      <span>${img.dataset.wp}</span>
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
    }));
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    for (const d of drops) {
      ctx.strokeStyle = `oklch(0.88 0.03 240 / ${d.a})`;
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
    ['luau-desktop 0.5.0 — starting', 'dim'],
    ['  mounting ~/roblox-luau-from-zero .. ok', 'ok'],
    ['  reading progress from disk ........ ok', 'ok'],
    ['  looking for roblox studio ......... yours', 'ok'],
    ['', ''],
    ['welcome. open studio next to this window.', 'on'],
  ];
  let text = '';
  for (const [l] of lines) {
    const chunks = l.match(/.{1,3}/g) || [''];
    for (const c of chunks) { text += c; el.innerHTML = esc(text) + '<span class="caret"></span>'; await sleep(11); }
    text += '\n';
    el.innerHTML = esc(text).replace(/ok/g, '<span class="ok">ok</span>') + '<span class="caret"></span>';
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
    $$('.ws').forEach(x => x.classList.toggle('on', x === b));
    go({ 1: 'home', 2: nextLesson().id, 3: 'cheat' }[b.dataset.goto]);
  });
  const brand = $('#brand');
  if (brand) brand.onclick = () => go('home');
  $('#wp-btn').onclick = () => document.body.classList.toggle('wp-open');
  $('#wp-x').onclick = () => document.body.classList.remove('wp-open');
  $('#rain-btn').onclick = () => {
    store.raw.rain = !store.raw.rain; store.save();
    $('#rain').classList.toggle('off', !store.raw.rain);
    $('#rain-btn').setAttribute('aria-pressed', String(store.raw.rain));
    $('#rain-btn').classList.toggle('on', store.raw.rain);
  };
  $('#out-clear').onclick = () => { outEl.innerHTML = ''; log('dim', 'cleared'); };
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
    $('#foot-right').textContent = `luau · utf-8 · ${isNaN(pct) ? 100 : pct}%`;
  });

  // keyboard
  addEventListener('keydown', e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '');
    if (e.key === 'Escape') {
      const overlay = document.body.classList.contains('pal-open') || document.body.classList.contains('wp-open');
      closePalette(); document.body.classList.remove('wp-open');
      if (!overlay && !typing && document.body.classList.contains('win-max')) $('#win-max').click();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    if (typing) return;
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
        <div class="soon">
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
