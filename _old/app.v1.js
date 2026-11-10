/* ════════════════════════════════════════════════════════════════════════
   LUAU DESKTOP — app.js
   ────────────────────────────────────────────────────────────────────────
   Four things live in this file, in this order:
     1. CONTENT   — the course tree, the goals, the lab + quiz config
     2. LUAU      — a small interpreter (tokenizer → parser → evaluator)
                    so every lab in the lessons actually runs in the page
     3. MARKDOWN  — marked + DOMPurify + a Luau highlighter + block syntax
     4. DESKTOP   — routing, tabs, tree, palette, goals, output, rain, boot
   ════════════════════════════════════════════════════════════════════════ */
(() => {
'use strict';

/* ════════════════════════════════════════════════════════════════════════
   1. CONTENT
   ════════════════════════════════════════════════════════════════════════ */

const GROUPS = [
  { id: 'g0', label: '00 · start here',    open: true },
  { id: 'g1', label: '01 · first steps',   open: true },
  { id: 'g2', label: '02 · making it think', open: true },
  { id: 'g3', label: '99 · sandbox',       open: true },
];

const LESSONS = [
  { id: 'home',  n: '◆',     g: 'g0', title: 'Welcome',              md: 'md-home',  tag: 'start',  mins: 2 },
  { id: '0.1',   n: '0.1',   g: 'g1', title: 'Hello, computer',      md: 'md-0.1',   tag: 'tier 0', mins: 6 },
  { id: '0.2',   n: '0.2',   g: 'g1', title: 'Boxes with names',     md: 'md-0.2',   tag: 'tier 0', mins: 9 },
  { id: '0.3',   n: '0.3',   g: 'g1', title: 'Numbers you can bend', md: 'md-0.3',   tag: 'tier 0', mins: 7 },
  { id: '0.4',   n: '0.4',   g: 'g2', title: 'Yes or no',            md: 'md-0.4',   tag: 'tier 0', mins: 8 },
  { id: '0.5',   n: '0.5',   g: 'g2', title: 'Again and again',      md: 'md-0.5',   tag: 'tier 0', mins: 8 },
  { id: '0.6',   n: '0.6',   g: 'g2', title: 'Lists of things',      md: 'md-0.6',   tag: 'tier 0', mins: 10 },
  { id: '0.7',   n: '0.7',   g: 'g2', title: 'Your own commands',    soon: true,     tag: 'tier 0', mins: 12 },
  { id: 'play',  n: '▸',     g: 'g3', title: 'Scratchpad',           md: 'md-play',  tag: 'tools',  mins: 0 },
  { id: 'cheat', n: '▸',     g: 'g3', title: 'Cheatsheet',           md: 'md-cheat', tag: 'tools',  mins: 3 },
];

/**
 * The homepage is the desktop, not a lesson — so its editorial copy lives
 * here rather than in lessons.md. Only the headline and its two opening
 * paragraphs come from the markdown, so the tone stays in one place.
 */
const HOME_STEPS = [
  ['01 · the prose', 'Short, and one idea at a time',
   'Every claim comes with a working example you can run right there in the page.'],
  ['02 · the editor', 'Type, press run, read what came back',
   'Nothing is graded until the checks say so, and nothing is permanent — <b>reset</b> puts the starter code back.'],
  ['03 · the checks', 'A short list that ticks itself off',
   'When they all pass, the goal lights up in the side panel and your progress saves to this browser.'],
];

const HOME_COLS = [
  ['What this is', [
    'This is the <strong>Luau language</strong> — the one Roblox runs. Variables, text, numbers, conditions, loops, tables, functions.',
    'Everything you learn here transfers straight into a Roblox script.',
  ]],
  ['What it is not', [
    'Not Roblox itself. There is no <code>game</code>, no <code>workspace</code>, no <code>Instance</code> and no 3D here.',
    'Those are engine features, not language features — a different course. What is here is the part that stays the same.',
  ]],
  ['Two habits to start now', [
    '<strong>Predict before you run.</strong> Every lesson asks you to commit to an answer first. Guessing wrong and finding out why teaches far more than reading the right answer.',
    '<strong>Break things on purpose.</strong> Change a number, delete a word, swap two lines. The errors here are written to be read.',
  ]],
];

/** Goals — the right-hand panel. A lab can tick one when it passes. */
const GOALS = {
  home: [
    { t: 'Open the first lesson from the tree', xp: 10 },
    { t: 'Run something in the scratchpad', xp: 15 },
    { t: 'Know where the cheatsheet lives', xp: 10 },
  ],
  '0.1': [
    { t: 'Make the computer say something back', xp: 15 },
    { t: 'Put two things together with <code>..</code>', xp: 20 },
    { t: 'Break it on purpose and read the error', xp: 20 },
    { t: 'Build a two-line greeting', xp: 25 },
  ],
  '0.2': [
    { t: 'Make a box, put something in it, print it', xp: 15 },
    { t: 'Change what is inside the box', xp: 20 },
    { t: 'Swap two boxes without losing either value', xp: 25 },
    { t: 'Say why <code>local</code> matters', xp: 20 },
    { t: 'Build a shop receipt from variables', xp: 30 },
  ],
  '0.3': [
    { t: 'Do arithmetic and see the answer', xp: 15 },
    { t: 'Use <code>%</code> to get a remainder', xp: 20 },
    { t: 'Fix the broken calculator', xp: 30 },
  ],
  '0.4': [
    { t: 'Predict which branch runs', xp: 15 },
    { t: 'Write an <code>if</code> that guards something', xp: 25 },
    { t: 'Combine conditions with <code>and</code> / <code>or</code>', xp: 25 },
    { t: 'Build a ticket gate', xp: 30 },
  ],
  '0.5': [
    { t: 'Predict what a loop prints', xp: 15 },
    { t: 'Count with a <code>for</code> loop', xp: 25 },
    { t: 'Build a countdown', xp: 30 },
  ],
  '0.6': [
    { t: 'Make a list and print it one at a time', xp: 20 },
    { t: 'Add and read items by position', xp: 25 },
    { t: 'Build an inventory total', xp: 30 },
  ],
  play:  [{ t: 'Anything you type here is yours to break', xp: 0 }],
  cheat: [{ t: 'Skim the syntax you have met so far', xp: 0 }],
};

/** Labs — markdown declares ` ```lua lab=id `; everything else lives here. */
const LABS = {
  'hello': {
    goal: 0, solution: `print("Hello, world!")`,
    hint: 'The quotes are part of the instruction, not part of the words.',
    checks: [{ t: 'prints exactly: Hello, world!', ok: o => o[0] === 'Hello, world!' }],
  },
  'join': {
    goal: 1, solution: `local who = "world"\nprint("Hello, " .. who .. "!")`,
    hint: 'Two dots join text. The spaces are inside the quotes, so you control them.',
    checks: [
      { t: 'the output contains a comma and a space', ok: o => /, /.test(o.join('\n')) },
      { t: 'the output ends with an exclamation mark', ok: o => o.some(l => l.trim().endsWith('!')) },
    ],
  },
  'oops': {
    goal: 2, solution: `print("before")\nprint(missing)\nprint("after")`,
    hint: 'Name something that was never made. The interpreter will tell you the line number.',
    checks: [
      { t: 'the run stops with an error', ok: (o, e) => !!e },
      { t: 'the error mentions a line number', ok: (o, e) => !!e && typeof e.line === 'number' && e.line > 0 },
    ],
  },
  'greettwo': {
    goal: 3, solution: `print("Ada Lovelace")\nprint("was here.")`,
    hint: 'Two prints, two lines. Order matters.',
    checks: [
      { t: 'prints two lines', ok: o => o.length === 2 },
      { t: 'the first line is a name', ok: o => (o[0] || '').trim().length > 0 },
      { t: 'the second line is different from the first', ok: o => o[0] !== o[1] },
    ],
  },

  'box': {
    goal: 0, solution: `local score = 42\nprint(score)`,
    hint: 'A box has a name on the left and a value on the right, joined by one `=`.',
    checks: [
      { t: 'prints the number 42', ok: o => /^42$/.test((o[0] || '').trim()) },
    ],
  },
  'change': {
    goal: 1, solution: `local score = 42\nscore = 100\nprint(score)`,
    hint: 'Assign a second time with `=` and no `local`. The box keeps its name, the contents change.',
    checks: [
      { t: 'prints 100 once', ok: o => o.length === 1 && /^100$/.test(o[0].trim()) },
      { t: 'never prints 42', ok: o => !o.some(l => /42/.test(l)) },
    ],
  },
  'swap': {
    goal: 2, solution: `local a = "tea"\nlocal b = "coffee"\n\nlocal spare = a\na = b\nb = spare\n\nprint(a)\nprint(b)`,
    hint: 'You cannot pour two cups at once. Use a third, empty cup.',
    checks: [
      { t: 'the first box ends up holding the second value', ok: o => (o[0] || '').trim() !== '' && o[0].trim() !== o[1]?.trim() },
      { t: 'both values are still printed — nothing was lost', ok: o => o.length === 2 && o.every(l => l.trim() !== '') },
    ],
  },
  'receipt': {
    goal: 4, solution:
      `local item   = "notebook"\nlocal price  = 4\nlocal count  = 3\n\nlocal total = price * count\nprint(item)\nprint(total)`,
    hint: 'Three boxes, then a fourth that is `price * count`. Print the item name and the total.',
    checks: [
      { t: 'prints a line that is just the item name', ok: o => o.some(l => /[A-Za-z]/.test(l) && !/\d/.test(l)) },
      { t: 'prints a line that is just a number', ok: o => o.some(l => /^\s*\d+\s*$/.test(l)) },
      { t: 'the number is the price times the count', ok: o => o.some(l => /^\s*12\s*$/.test(l)) },
    ],
  },

  'math': {
    goal: 0, solution: `print(7 + 3)\nprint(7 - 3)\nprint(7 * 3)\nprint(7 / 2)`,
    hint: 'Four lines. `/` gives a fraction; Luau does not round for you.',
    checks: [
      { t: 'prints four lines', ok: o => o.length === 4 },
      { t: 'includes 21 (7 × 3)', ok: o => o.some(l => /^21$/.test(l.trim())) },
      { t: 'includes 3.5 (7 ÷ 2, not rounded)', ok: o => o.some(l => /^3\.5$/.test(l.trim())) },
    ],
  },
  'mod': {
    goal: 1, solution: `print(10 % 3)\nprint(12 % 4)`,
    hint: '`%` is the leftover after dividing. 10 ÷ 3 is 3 with 1 left over.',
    checks: [
      { t: 'prints 1 (the remainder of 10 ÷ 3)', ok: o => o.some(l => /^1$/.test(l.trim())) },
      { t: 'prints 0 (12 divides evenly)', ok: o => o.some(l => /^0$/.test(l.trim())) },
    ],
  },
  'fixcalc': {
    goal: 2, solution:
      `local apples = 6\nlocal price  = 3\n\nprint(apples * price)\nprint("total: " .. apples * price)`,
    hint: 'One line does arithmetic, the other glues text to a number — and `..` binds looser than `*`, so no brackets are needed.',
    checks: [
      { t: 'the arithmetic line prints 18', ok: o => o.some(l => /^18$/.test(l.trim())) },
      { t: 'the glued line contains the word total and the number 18',
        ok: o => o.some(l => /total/i.test(l) && /18/.test(l)) },
      { t: 'nothing errors', ok: (o, e) => !e },
    ],
  },

  'gate': {
    goal: 1, solution:
      `local age = 20\n\nif age >= 18 then\n  print("come in")\nelse\n  print("not yet")\nend`,
    hint: '`if` on one line, the work indented, `else`, more work, then `end` to close it. Then set age to 15 and run it again.',
    checks: [
      { t: 'prints exactly one line', ok: o => o.length === 1 },
      { t: 'someone 20 or over gets let in', ok: o => /come in/i.test(o[0] || '') },
    ],
  },
  'both': {
    goal: 2, solution:
      `local age    = 20\nlocal hasId  = true\n\nif age >= 18 and hasId then\n  print("come in")\nelse\n  print("not yet")\nend`,
    hint: 'Two conditions, both must hold: `and` between them.',
    checks: [
      { t: 'uses and or or in the condition', ok: (o, e, src) => /\b(and|or)\b/.test(src) },
      { t: 'prints come in', ok: o => /come in/i.test(o[0] || '') },
    ],
  },
  'ticket': {
    goal: 3, solution:
      `local age   = 15\nlocal hasId = true\n\nif age < 13 then\n  print("child ticket")\nelseif age < 18 then\n  print("teen ticket")\nelse\n  print("adult ticket")\nend`,
    hint: 'Start with the strictest case. `elseif` sits between, and you still need one `end`.',
    checks: [
      { t: 'prints exactly one line', ok: o => o.length === 1 },
      { t: 'the line is teen ticket', ok: o => /teen ticket/i.test(o[0] || '') },
      { t: 'uses elseif for the middle case', ok: (o, e, src) => /elseif/.test(src) },
    ],
  },

  'count': {
    goal: 1, solution: `for i = 1, 5 do\n  print(i)\nend`,
    hint: 'A `for` takes a name, a start, a stop. It walks from one to the other on its own.',
    checks: [
      { t: 'prints five lines', ok: o => o.length === 5 },
      { t: 'starts at 1 and ends at 5', ok: o => o[0]?.trim() === '1' && o[4]?.trim() === '5' },
    ],
  },
  'down': {
    goal: 2, solution:
      `for n = 3, 1, -1 do\n  print(n)\nend\nprint("liftoff")`,
    hint: 'A third number sets the step. To walk backwards, make it negative.',
    checks: [
      { t: 'counts down: 3, 2, 1', ok: o => o.slice(0, 3).join(',').replace(/\s/g, '') === '3,2,1' },
      { t: 'then says liftoff', ok: o => /liftoff/i.test(o[3] || '') },
    ],
  },

  'list': {
    goal: 0, solution:
      `local pets = {"cat", "dog", "fish"}\n\nfor i, pet in ipairs(pets) do\n  print(i .. ". " .. pet)\nend`,
    hint: '`ipairs` walks a list from the front and hands you a position and a value.',
    checks: [
      { t: 'prints three lines', ok: o => o.length === 3 },
      { t: 'each line starts with its position', ok: o => /^1/.test(o[0]?.trim()) && /^3/.test(o[2]?.trim()) },
      { t: 'mentions one animal per line', ok: o => o.filter(l => /cat|dog|fish/i.test(l)).length === 3 },
    ],
  },
  'inv': {
    goal: 2, solution:
      `local bag = {\n  {name = "torch",    price = 5},\n  {name = "rope",     price = 3},\n  {name = "canteen",  price = 7},\n}\n\nlocal total = 0\nfor _, item in ipairs(bag) do\n  print(item.name .. " costs " .. item.price)\n  total = total + item.price\nend\nprint("total: " .. total)`,
    hint: 'Start the total at 0, then add each price to it inside the loop. `_` is the usual name for a position you do not need.',
    checks: [
      { t: 'prints one line per item', ok: o => o.length === 4 },
      { t: 'prints a total', ok: o => /total/i.test(o[3] || '') },
      { t: 'the total is the sum of the prices', ok: o => /15/.test(o[3] || '') },
    ],
  },

  /* ungraded — nothing to pass, just a page that runs code */
  'scratch': {
    checks: [],
    goal: 0,
    hint: 'Everything you have met so far works here. Break it.',
    solution: `local t = {}

for i = 1, 5 do
  table.insert(t, i * i)
end

print(table.concat(t, ", "))
print("count:", #t)`,
  },
};

/** Predict blocks — a question, some chips, one right answer, and the why. */
const PREDICTS = {
  'p1': {
    options: ['Hello', '"Hello"', 'nothing'],
    answer: 1,
    why: 'Quotes are part of the instruction. Without them the computer goes looking for a box named `Hello` — and there is not one.',
  },
  'p2': {
    options: ['42', 'score', 'an error'],
    answer: 0,
    why: '`print(score)` prints what is <b>inside</b> the box. `print("score")` would print the word.',
  },
  'p3': {
    options: ['5', '10', '"55"'],
    answer: 2,
    why: '`..` always makes text. Two pieces of text sitting next to each other give `"55"`.',
  },
  'p4': {
    options: ['10', '7.5', 'an error'],
    answer: 0,
    why: '`+` adds numbers. And in Luau, `"5"` in arithmetic is quietly read as the number 5.',
  },
  'p5': {
    options: ['big', 'small', 'an error'],
    answer: 1,
    why: '`80 > 100` is false, so the `else` branch runs.',
  },
  'p6': {
    options: ['true', 'false', 'an error'],
    answer: 1,
    why: '`0` is true in Luau — only `nil` and `false` are false. So the first side is true, and `and` then checks the second, which is not.',
  },
  'p7': {
    options: ['1 2 3', '3 2 1', 'nothing'],
    answer: 0,
    why: 'Without a step, `for` always walks upwards by 1.',
  },
  'p8': {
    options: ['0', '1', 'nothing'],
    answer: 1,
    why: 'Lists in Luau are numbered from 1, not 0. `pets[1]` is the first one.',
  },
};

/* ════════════════════════════════════════════════════════════════════════
   2. LUAU — a small interpreter
   Deliberately a subset: variables, the operators, tables, functions,
   if / while / repeat / for, and a slice of the standard library.
   Enough to run every lab on this site, and honest about what it does
   not know rather than guessing.
   ════════════════════════════════════════════════════════════════════════ */

class LuaError extends Error {
  constructor(msg, line) { super(msg); this.line = line; this.lua = true; }
}

const KEYWORDS = new Set(['and','break','do','else','elseif','end','false','for','function',
  'if','in','local','nil','not','or','repeat','return','then','true','until','while']);

/* ── tokenizer ───────────────────────────────────────────────────────── */
function tokenize(src) {
  const t = [];
  let i = 0, line = 1;
  const isD = c => c >= '0' && c <= '9';
  const isA = c => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  const isAN = c => isA(c) || isD(c);

  while (i < src.length) {
    const c = src[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }

    if (c === '-' && src[i + 1] === '-') {
      const m = /^--\[(=*)\[/.exec(src.slice(i));
      if (m) {
        const close = ']' + m[1] + ']';
        const end = src.indexOf(close, i + m[0].length);
        if (end === -1) throw new LuaError('this long comment never closes', line);
        line += (src.slice(i, end + close.length).match(/\n/g) || []).length;
        i = end + close.length; continue;
      }
      let nl = src.indexOf('\n', i);
      i = nl === -1 ? src.length : nl;
      continue;
    }

    if (c === '[' && /^\[=*\[/.test(src.slice(i))) {
      const m = /^\[(=*)\[/.exec(src.slice(i));
      const close = ']' + m[1] + ']';
      const end = src.indexOf(close, i + m[0].length);
      if (end === -1) throw new LuaError('this text block never closes', line);
      const raw = src.slice(i + m[0].length, end);
      const at = line;
      line += (raw.match(/\n/g) || []).length;
      t.push({ k: 'str', v: raw.replace(/^\n/, ''), line: at });
      i = end + close.length; continue;
    }

    if (c === '"' || c === "'") {
      let j = i + 1, out = '';
      while (j < src.length && src[j] !== c) {
        if (src[j] === '\\') {
          const e = src[j + 1];
          out += e === 'n' ? '\n' : e === 't' ? '\t' : e === 'r' ? '\r'
               : e === '\\' ? '\\' : e === '"' ? '"' : e === "'" ? "'" : e;
          j += 2; continue;
        }
        if (src[j] === '\n') throw new LuaError('this text starts on line ' + line + ' but never closes', line);
        out += src[j]; j++;
      }
      if (j >= src.length) throw new LuaError('this text starts on line ' + line + ' but never closes', line);
      t.push({ k: 'str', v: out, line }); i = j + 1; continue;
    }

    if (isD(c) || (c === '.' && isD(src[i + 1]))) {
      const m = /^0[xX][0-9a-fA-F]+|^\d+\.?\d*(?:[eE][+-]?\d+)?|^\.\d+(?:[eE][+-]?\d+)?/.exec(src.slice(i));
      const raw = m[0];
      const v = /^0[xX]/.test(raw) ? parseInt(raw, 16) : parseFloat(raw);
      t.push({ k: 'num', v, line }); i += raw.length; continue;
    }

    if (isA(c)) {
      let j = i; while (j < src.length && isAN(src[j])) j++;
      t.push({ k: 'name', v: src.slice(i, j), line }); i = j; continue;
    }

    const three = src.substr(i, 3), two = src.substr(i, 2);
    if (three === '...') { t.push({ k: 'sym', v: '...', line }); i += 3; continue; }
    if (two === '==' || two === '~=' || two === '<=' || two === '>=' || two === '..') {
      t.push({ k: 'sym', v: two, line }); i += 2; continue;
    }
    if ('+-*/%^#=<>;:,.(){}[]'.includes(c)) { t.push({ k: 'sym', v: c, line }); i++; continue; }
    throw new LuaError(`I do not recognise the character '${c}'`, line);
  }
  t.push({ k: 'eof', v: '<end of file>', line });
  return t;
}

/* ── parser ──────────────────────────────────────────────────────────── */
function parse(tokens) {
  let p = 0;
  const peek = (o = 0) => tokens[p + o];
  const bump = () => tokens[p++];
  const isSym = v => peek().k === 'sym' && peek().v === v;
  const isKw = v => peek().k === 'name' && peek().v === v;
  const at = v => isSym(v) || isKw(v);
  const fail = msg => { throw new LuaError(msg, peek().line); };
  const take = v => { if (!at(v)) fail(`expected '${v}' here`); return bump(); };
  const name = () => {
    const tk = peek();
    if (tk.k !== 'name' || KEYWORDS.has(tk.v)) fail('expected a name here');
    return bump().v;
  };

  function block(stops) {
    const body = [];
    while (!(peek().k === 'eof' || (peek().k === 'name' && stops.includes(peek().v)))) {
      const s = statement();
      if (s) body.push(s);
      if (s && s.k === 'return') break;
    }
    return body;
  }

  function statement() {
    const tk = peek();
    if (tk.k === 'sym' && tk.v === ';') { bump(); return null; }

    if (isKw('local')) {
      bump();
      if (isKw('function')) {
        bump();
        const n = name();
        const fn = funcBody(n, tk.line);
        return { k: 'local', names: [n], values: [fn], line: tk.line };
      }
      const names = [name()];
      while (isSym(',')) { bump(); names.push(name()); }
      let values = [];
      if (isSym('=')) { bump(); values = exprList(); }
      return { k: 'local', names, values, line: tk.line };
    }

    if (isKw('function')) {
      bump();
      let target = { k: 'name', name: name(), line: tk.line };
      while (isSym('.')) { bump(); target = { k: 'index', obj: target, key: { k: 'lit', v: name() }, line: tk.line }; }
      let method = null;
      if (isSym(':')) { bump(); method = name(); }
      const fn = funcBody(method, tk.line, method !== null);
      if (method) target = { k: 'index', obj: target, key: { k: 'lit', v: method }, line: tk.line };
      return { k: 'assign', targets: [target], values: [fn], line: tk.line };
    }

    if (isKw('if')) {
      bump();
      const branches = [];
      let cond = expr();
      take('then');
      branches.push({ cond, body: block(['elseif', 'else', 'end']) });
      while (isKw('elseif')) {
        bump();
        const c = expr();
        take('then');
        branches.push({ cond: c, body: block(['elseif', 'else', 'end']) });
      }
      let alt = null;
      if (isKw('else')) { bump(); alt = block(['end']); }
      take('end');
      return { k: 'if', branches, alt, line: tk.line };
    }

    if (isKw('while')) {
      bump();
      const cond = expr();
      take('do');
      const body = block(['end']);
      take('end');
      return { k: 'while', cond, body, line: tk.line };
    }

    if (isKw('repeat')) {
      bump();
      const body = block(['until']);
      take('until');
      const cond = expr();
      return { k: 'repeat', body, cond, line: tk.line };
    }

    if (isKw('do')) {
      bump();
      const body = block(['end']);
      take('end');
      return { k: 'do', body, line: tk.line };
    }

    if (isKw('for')) {
      bump();
      const first = name();
      if (isSym('=')) {
        bump();
        const from = expr(); take(',');
        const to = expr();
        let step = null;
        if (isSym(',')) { bump(); step = expr(); }
        take('do');
        const body = block(['end']);
        take('end');
        return { k: 'fornum', v: first, from, to, step, body, line: tk.line };
      }
      const names = [first];
      while (isSym(',')) { bump(); names.push(name()); }
      take('in');
      const iter = exprList();
      take('do');
      const body = block(['end']);
      take('end');
      return { k: 'forin', names, iter, body, line: tk.line };
    }

    if (isKw('return')) {
      bump();
      const values = (peek().k === 'eof' || at('end') || at('else') || at('elseif') || at('until') || isSym(';'))
        ? [] : exprList();
      return { k: 'return', values, line: tk.line };
    }

    if (isKw('break')) { bump(); return { k: 'break', line: tk.line }; }

    // assignment or a bare call
    const target = suffix();
    if (isSym('=') || isSym(',')) {
      const targets = [target];
      while (isSym(',')) { bump(); targets.push(suffix()); }
      take('=');
      const values = exprList();
      targets.forEach(t => {
        if (t.k !== 'name' && t.k !== 'index') fail('you can only assign to a box, not to a value');
      });
      return { k: 'assign', targets, values, line: tk.line };
    }
    if (target.k !== 'call' && target.k !== 'methodcall') {
      fail('this line does not do anything — did you mean to set a variable, or add brackets to call it?');
    }
    return { k: 'callstmt', call: target, line: tk.line };
  }

  function funcBody(fnName, line, isMethod) {
    take('(');
    const params = [];
    let vararg = false;
    if (!isSym(')')) {
      if (isSym('...')) { bump(); vararg = true; }
      else {
        params.push(name());
        while (isSym(',')) {
          bump();
          if (isSym('...')) { bump(); vararg = true; break; }
          params.push(name());
        }
      }
    }
    take(')');
    const body = block(['end']);
    take('end');
    return { k: 'fn', params, vararg, body, name: fnName, isMethod, line };
  }

  function exprList() {
    const out = [expr()];
    while (isSym(',')) { bump(); out.push(expr()); }
    return out;
  }

  const BIN = [
    ['or'], ['and'],
    ['<', '>', '<=', '>=', '~=', '=='],
    ['..'],
    ['+', '-'],
    ['*', '/', '%'],
    ['^'],
  ];
  // `and` and `or` arrive from the tokenizer as *name* tokens, not symbols —
  // checking only peek().k === 'sym' here silently drops them, which makes
  // `if a and b then` fail with a confusing "expected 'then'".
  const isBinOp = level => {
    const v = peek().v;
    if (!BIN[level].includes(v)) return false;
    return (v === 'and' || v === 'or') ? peek().k === 'name' : peek().k === 'sym';
  };
  function expr(level = 0) {
    if (level >= BIN.length) return unary();
    let left = expr(level + 1);
    while (isBinOp(level)) {
      const op = bump().v;
      const right = (op === '..' || op === '^') ? expr(level) : expr(level + 1);
      left = { k: 'bin', op, left, right };
    }
    return left;
  }
  function unary() {
    const tk = peek();
    if (isSym('-') || isSym('#')) { bump(); return { k: 'un', op: tk.v, e: unary() }; }
    if (isKw('not')) { bump(); return { k: 'un', op: 'not', e: unary() }; }
    return simple();
  }
  function simple() {
    let e = primary();
    return suffixFrom(e);
  }
  function suffix() {
    const tk = peek();
    if (tk.k !== 'name' || KEYWORDS.has(tk.v)) fail('this line should start with a name');
    bump();
    return suffixFrom({ k: 'name', name: tk.v, line: tk.line });
  }
  function suffixFrom(e) {
    for (;;) {
      if (isSym('.')) { bump(); e = { k: 'index', obj: e, key: { k: 'lit', v: name() }, line: e.line }; continue; }
      if (isSym('[')) { bump(); const k = expr(); take(']'); e = { k: 'index', obj: e, key: k, line: e.line }; continue; }
      if (isSym(':')) {
        bump();
        const m = name();
        const args = callArgs();
        e = { k: 'methodcall', obj: e, method: m, args, line: e.line };
        continue;
      }
      if (isSym('(') || isSym('{') || (peek().k === 'str')) {
        const args = callArgs();
        e = { k: 'call', fn: e, args, line: e.line };
        continue;
      }
      return e;
    }
  }
  function callArgs() {
    if (isSym('(')) {
      bump();
      const args = isSym(')') ? [] : exprList();
      take(')');
      return args;
    }
    if (isSym('{')) return [tableCtor()];
    if (peek().k === 'str') { const s = bump(); return [{ k: 'lit', v: s.v }]; }
    fail('expected an argument list here');
  }
  function tableCtor() {
    take('{');
    const items = [];
    while (!isSym('}')) {
      if (isSym('[')) {
        bump();
        const key = expr(); take(']'); take('=');
        items.push({ key, value: expr() });
      } else if (peek().k === 'name' && !KEYWORDS.has(peek().v) && peek(1).k === 'sym' && peek(1).v === '=') {
        const key = bump().v; bump();
        items.push({ key: { k: 'lit', v: key }, value: expr() });
      } else {
        items.push({ key: null, value: expr() });
      }
      if (isSym(',') || isSym(';')) { bump(); continue; }
      break;
    }
    take('}');
    return { k: 'table', items };
  }
  function primary() {
    const tk = peek();
    if (tk.k === 'num') { bump(); return { k: 'lit', v: tk.v, line: tk.line }; }
    if (tk.k === 'str') { bump(); return { k: 'lit', v: tk.v, line: tk.line }; }
    if (isKw('nil')) { bump(); return { k: 'lit', v: undefined, line: tk.line }; }
    if (isKw('true')) { bump(); return { k: 'lit', v: true, line: tk.line }; }
    if (isKw('false')) { bump(); return { k: 'lit', v: false, line: tk.line }; }
    if (isSym('...')) { bump(); return { k: 'vararg', line: tk.line }; }
    if (isKw('function')) { bump(); return funcBody('?', tk.line); }
    if (isSym('{')) return tableCtor();
    if (isSym('(')) {
      bump();
      const e = expr();
      take(')');
      return { k: 'paren', e, line: tk.line };
    }
    if (tk.k === 'name') {
      if (KEYWORDS.has(tk.v)) fail(`'${tk.v}' cannot start a value here`);
      bump();
      return { k: 'name', name: tk.v, line: tk.line };
    }
    fail(`expected a value here, found '${tk.v}'`);
  }

  const chunk = block(['end', 'else', 'elseif', 'until']);
  if (peek().k !== 'eof') fail(`unexpected '${peek().v}' — something above it was never closed`);
  return chunk;
}

/* ── values ──────────────────────────────────────────────────────────── */
const isTable = v => v !== null && typeof v === 'object' && v.__tbl === true;
const isFn = v => v !== null && typeof v === 'object' && v.__fn === true;
let tableIds = 0;

function newTable() { return { __tbl: true, map: new Map(), id: ++tableIds }; }

function tget(t, k) {
  if (k === undefined || k === null) throw new LuaError('you cannot look up a key that is nil', null);
  if (typeof k === 'number') k = normNum(k);
  return t.map.get(k);
}
function tset(t, k, v) {
  if (k === undefined || k === null) throw new LuaError('a table key cannot be nil', null);
  if (typeof k === 'number') k = normNum(k);
  if (v === undefined) t.map.delete(k);
  else t.map.set(k, v);
}
const normNum = n => Number.isInteger(n) ? n : n;

function tlen(t) { let n = 0; while (tget(t, n + 1) !== undefined) n++; return n; }

function numfmt(n) {
  if (typeof n !== 'number') return String(n);
  if (Number.isNaN(n)) return '-nan';
  if (n === Infinity) return 'inf';
  if (n === -Infinity) return '-inf';
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(14)));
}

function tostr(v) {
  if (v === undefined) return 'nil';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return numfmt(v);
  if (typeof v === 'string') return v;
  if (isTable(v)) return 'table: 0x' + (v.id * 2654435761 % 0xfffffff).toString(16).padStart(6, '0');
  if (isFn(v)) return 'function: 0x' + ((v.uid || 1) * 40503 % 0xfffffff).toString(16).padStart(6, '0');
  return String(v);
}
function tonum(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    return v.trim() !== '' && !Number.isNaN(n) ? n : undefined;
  }
  return undefined;
}
function typename(v) {
  if (v === undefined) return 'nil';
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'number') return 'number';
  if (typeof v === 'string') return 'string';
  if (isTable(v)) return 'table';
  if (isFn(v)) return 'function';
  return 'userdata';
}
const truthy = v => v !== undefined && v !== false;

function numOr(v, what) {
  const n = tonum(v);
  if (n === undefined) throw new LuaError(`expected a number, but got a ${typename(v)}`, null);
  return n;
}

/* ── scope ───────────────────────────────────────────────────────────── */
class Scope {
  constructor(parent = null) { this.vars = new Map(); this.parent = parent; }
  get(n) {
    let s = this;
    while (s) { if (s.vars.has(n)) return s.vars.get(n); s = s.parent; }
    return GLOBAL.get(n);
  }
  def(n, v) { this.vars.set(n, v); }
  assign(n, v) {
    let s = this;
    while (s) { if (s.vars.has(n)) { s.vars.set(n, v); return; } s = s.parent; }
    GLOBAL.set(n, v);
  }
  declared(n) {
    let s = this;
    while (s) { if (s.vars.has(n)) return true; s = s.parent; }
    return false;
  }
}
const GLOBAL = new Map();

class Return { constructor(v) { this.v = v; } }
class Break {}

/* A function handing back more than one value. Kept separate from a plain
   value so the *last* expression in a list can expand while everything
   else truncates to its first — which is what Luau does, and what makes
   `local ok, err = pcall(f)` behave the way everyone expects. */
class Multi { constructor(vals) { this.vals = vals; } }
const one = v => v instanceof Multi ? v.vals[0] : v;

/* ── standard library ────────────────────────────────────────────────── */
function native(fn, name) { return { __fn: true, native: fn, name, uid: ++fnUid }; }
let fnUid = 0;

function mkTable(obj) {
  const t = newTable();
  for (const k of Object.keys(obj)) tset(t, k, obj[k]);
  return t;
}

function callValue(fn, args, line) {
  if (!isFn(fn)) throw new LuaError(`I tried to call a ${typename(fn)}, but only a function can be called`, line);
  if (fn.native) return fn.native(args, line);
  const sc = new Scope(fn.scope);
  fn.params.forEach((p, i) => sc.def(p, args[i]));
  if (fn.vararg) sc.def('...', args.slice(fn.params.length));
  try {
    const out = execBlock(fn.body, sc);
    if (out instanceof Return) return out.v.length === 1 ? one(out.v[0]) : new Multi(out.v.map(one));
    return undefined;
  } catch (e) {
    if (e instanceof Return) return e.v.length === 1 ? one(e.v[0]) : new Multi(e.v.map(one));
    throw e;
  }
}

const STRING_LIB = {
  upper: native((a) => tostr(a[0]).toUpperCase(), 'upper'),
  lower: native((a) => tostr(a[0]).toLowerCase(), 'lower'),
  len:   native((a) => tostr(a[0]).length, 'len'),
  rep:   native((a) => tostr(a[0]).repeat(Math.max(0, Math.floor(numOr(a[1], 'n')))), 'rep'),
  sub: native((a) => {
    const s = tostr(a[0]);
    let i = a[1] === undefined ? 1 : Math.trunc(numOr(a[1]));
    let j = a[2] === undefined ? s.length : Math.trunc(numOr(a[2]));
    const len = s.length;
    if (i < 0) i = len + i + 1;
    if (j < 0) j = len + j + 1;
    i = Math.max(1, i); j = Math.min(len, j);
    return i > j ? '' : s.slice(i - 1, j);
  }, 'sub'),
  find: native((a) => {
    const s = tostr(a[0]), pat = tostr(a[1]).replace(/[%\-\[\]^$.*+?(){}|]/g, m => m === '%' ? '' : '\\' + m);
    const at = s.search(new RegExp(pat));
    return at === -1 ? undefined : at + 1;
  }, 'find'),
  format: native((a) => luaFormat(tostr(a[0]), a.slice(1)), 'format'),
};

function luaFormat(f, args) {
  let n = 0;
  return f.replace(/%[%sdifq]/g, (m) => {
    if (m === '%%') return '%';
    const v = args[n++];
    if (m === '%s') return tostr(v);
    if (m === '%d' || m === '%i') return String(Math.trunc(numOr(v, 'n')));
    if (m === '%f') return numOr(v, 'n').toFixed(6);
    if (m === '%q') return JSON.stringify(tostr(v));
    return m;
  });
}

function installStdlib() {
  const out = [];

  GLOBAL.set('print', native((a) => { out.push(a.map(tostr).join('\t')); return undefined; }, 'print'));
  GLOBAL.set('tostring', native((a) => tostr(a[0]), 'tostring'));
  GLOBAL.set('tonumber', native((a) => tonum(a[0]), 'tonumber'));
  GLOBAL.set('type', native((a) => typename(a[0]), 'type'));
  GLOBAL.set('typeof', native((a) => typename(a[0]), 'typeof'));
  GLOBAL.set('error', native((a, line) => {
    const m = a[0] === undefined ? 'code stopped here' : tostr(a[0]);
    throw new LuaError(m, line);
  }, 'error'));
  GLOBAL.set('assert', native((a, line) => {
    if (!truthy(a[0])) throw new LuaError(a[1] === undefined ? 'assertion failed' : tostr(a[1]), line);
    return a[0];
  }, 'assert'));
  GLOBAL.set('pcall', native((a, line) => {
    try {
      const r = callValue(a[0], a.slice(1), line);
      return r instanceof Multi ? new Multi([true, ...r.vals]) : new Multi([true, r]);
    } catch (e) {
      return new Multi([false, e && e.lua ? e.message : String(e && e.message || e)]);
    }
  }, 'pcall'));
  GLOBAL.set('select', native((a, line) => {
    const n = a[0] === '#' ? a.length - 1 : Math.trunc(numOr(a[0], 'n'));
    return a[n];
  }, 'select'));

  GLOBAL.set('string', mkTable(STRING_LIB));
  GLOBAL.set('table', mkTable({
    insert: native((a, line) => {
      const t = a[0];
      if (!isTable(t)) throw new LuaError('table.insert needs a table', line);
      if (a.length === 2) tset(t, tlen(t) + 1, a[1]);
      else {
        const pos = Math.trunc(numOr(a[1], 'position'));
        for (let i = tlen(t); i >= pos; i--) tset(t, i + 1, tget(t, i));
        tset(t, pos, a[2]);
      }
      return undefined;
    }, 'insert'),
    remove: native((a, line) => {
      const t = a[0];
      if (!isTable(t)) throw new LuaError('table.remove needs a table', line);
      const pos = a[1] === undefined ? tlen(t) : Math.trunc(numOr(a[1], 'position'));
      const v = tget(t, pos);
      const n = tlen(t);
      for (let i = pos; i < n; i++) tset(t, i, tget(t, i + 1));
      tset(t, n, undefined);
      return v;
    }, 'remove'),
    concat: native((a, line) => {
      const t = a[0];
      if (!isTable(t)) throw new LuaError('table.concat needs a table', line);
      const sep = a[1] === undefined ? '' : tostr(a[1]);
      const parts = [];
      for (let i = 1; i <= tlen(t); i++) parts.push(tostr(tget(t, i)));
      return parts.join(sep);
    }, 'concat'),
    sort: native((a, line) => {
      const t = a[0];
      if (!isTable(t)) throw new LuaError('table.sort needs a table', line);
      const n = tlen(t);
      const items = [];
      for (let i = 1; i <= n; i++) items.push(tget(t, i));
      const cmp = a[1];
      items.sort((x, y) => {
        if (isFn(cmp)) return truthy(callValue(cmp, [x, y], line)) ? -1 : 1;
        if (typeof x === 'number' && typeof y === 'number') return x - y;
        return tostr(x) < tostr(y) ? -1 : 1;
      });
      items.forEach((v, i) => tset(t, i + 1, v));
      return undefined;
    }, 'sort'),
  }));

  GLOBAL.set('math', mkTable({
    floor: native(a => Math.floor(numOr(a[0]))),
    ceil:  native(a => Math.ceil(numOr(a[0]))),
    abs:   native(a => Math.abs(numOr(a[0]))),
    sqrt:  native(a => Math.sqrt(numOr(a[0]))),
    round: native(a => Math.round(numOr(a[0]))),
    max:   native(a => Math.max(...a.map(v => numOr(v)))),
    min:   native(a => Math.min(...a.map(v => numOr(v)))),
    random: native(a => {
      if (a.length === 0) return Math.random();
      const lo = a.length === 1 ? 1 : Math.trunc(numOr(a[0]));
      const hi = Math.trunc(numOr(a[a.length - 1]));
      return lo + Math.floor(Math.random() * (hi - lo + 1));
    }),
    huge: Infinity,
    pi: Math.PI,
  }));

  GLOBAL.set('os', mkTable({
    time: native(() => Math.floor(Date.now() / 1000)),
    clock: native(() => (performance.now() / 1000)),
  }));

  GLOBAL.set('task', mkTable({
    wait: native(() => undefined),
    defer: native((a, line) => callValue(a[0], [], line)),
  }));

  GLOBAL.set('pairs', native((a, line) => {
    const t = a[0];
    if (!isTable(t)) throw new LuaError('pairs needs a table', line);
    const nums = [], rest = [];
    for (const k of t.map.keys()) {
      if (typeof k === 'number' && Number.isInteger(k) && k >= 1) nums.push(k); else rest.push(k);
    }
    nums.sort((x, y) => x - y);
    return { __iter: true, kind: 'pairs', tbl: t, keys: [...nums, ...rest] };
  }, 'pairs'));

  GLOBAL.set('ipairs', native((a, line) => {
    const t = a[0];
    if (!isTable(t)) throw new LuaError('ipairs needs a table', line);
    const keys = [];
    for (let i = 1; i <= tlen(t); i++) keys.push(i);
    return { __iter: true, kind: 'ipairs', tbl: t, keys };
  }, 'ipairs'));

  GLOBAL.set('next', native((a, line) => {
    const t = a[0];
    if (!isTable(t)) throw new LuaError('next needs a table', line);
    const keys = [...t.map.keys()];
    if (a[1] === undefined) return keys.length ? [keys[0], tget(t, keys[0])] : undefined;
    const i = keys.indexOf(typeof a[1] === 'number' ? a[1] : a[1]);
    return i === -1 || i === keys.length - 1 ? undefined : [keys[i + 1], tget(t, keys[i + 1])];
  }, 'next'));

  return out;
}

/* ── evaluator ───────────────────────────────────────────────────────── */
/* NB: named evN, not eval — `eval` is a reserved word under strict mode and
   a function declaration with that name is a SyntaxError. */
let steps = 0;
let depth = 0;
const STEP_LIMIT = 400000;
const DEPTH_LIMIT = 190;

function tick() {
  if (++steps > STEP_LIMIT) {
    throw new LuaError('this ran for a very long time — is a loop never ending?', null);
  }
}

function execBlock(body, scope) {
  for (const st of body) {
    const r = exec(st, scope);
    if (r instanceof Return || r instanceof Break) return r;
  }
  return null;
}

function exec(node, scope) {
  if (++depth > DEPTH_LIMIT) throw new LuaError('this went too many levels deep — a function is probably calling itself forever', node.line);
  try {
    switch (node.k) {
      case 'local': {
        const vals = evalList(node.values, scope);
        node.names.forEach((n, i) => scope.def(n, vals[i]));
        return null;
      }
      case 'assign': {
        const vals = evalList(node.values, scope);
        node.targets.forEach((t, i) => {
          const v = vals[i];
          if (t.k === 'name') scope.assign(t.name, v);
          else {
            const obj = evN(t.obj, scope);
            const key = evN(t.key, scope);
            if (!isTable(obj)) throw new LuaError(`I tried to put something into a ${typename(obj)} — only tables hold keys`, t.line);
            tset(obj, key, v);
          }
        });
        return null;
      }
      case 'callstmt': { evN(node.call, scope); return null; }
      case 'do': return execBlock(node.body, new Scope(scope));
      case 'if': {
        for (const b of node.branches) {
          if (truthy(one(evN(b.cond, scope)))) return execBlock(b.body, new Scope(scope));
        }
        return node.alt ? execBlock(node.alt, new Scope(scope)) : null;
      }
      case 'while': {
        while (truthy(one(evN(node.cond, scope)))) {
          tick();
          const r = execBlock(node.body, new Scope(scope));
          if (r instanceof Break) break;
          if (r instanceof Return) return r;
        }
        return null;
      }
      case 'repeat': {
        for (;;) {
          tick();
          const sc = new Scope(scope);
          const r = execBlock(node.body, sc);
          if (r instanceof Break) break;
          if (r instanceof Return) return r;
          if (truthy(one(evN(node.cond, sc)))) break;
        }
        return null;
      }
      case 'fornum': {
        const from = numOr(one(evN(node.from, scope)));
        const to = numOr(one(evN(node.to, scope)));
        const step = node.step ? numOr(one(evN(node.step, scope))) : 1;
        if (step === 0) throw new LuaError('a for loop cannot step by zero — it would never get anywhere', node.line);
        for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
          tick();
          const sc = new Scope(scope);
          sc.def(node.v, i);
          const r = execBlock(node.body, sc);
          if (r instanceof Break) break;
          if (r instanceof Return) return r;
        }
        return null;
      }
      case 'forin': {
        const it = evalList(node.iter, scope)[0];
        if (it && it.__iter) {
          for (const k of it.keys) {
            tick();
            const sc = new Scope(scope);
            node.names.forEach((n, i) => sc.def(n, i === 0 ? k : (i === 1 ? tget(it.tbl, k) : undefined)));
            const r = execBlock(node.body, sc);
            if (r instanceof Break) break;
            if (r instanceof Return) return r;
          }
          return null;
        }
        const iter = evalList(node.iter, scope);
        const f = it, state = iter[1];
        let ctrl = iter[2];
        for (;;) {
          tick();
          const res = callValue(f, [state, ctrl], node.line);
          const first = Array.isArray(res) ? res[0] : (isTable(res) ? tget(res, 1) : res);
          if (first === undefined) break;
          ctrl = first;
          const sc = new Scope(scope);
          node.names.forEach((n, i) => sc.def(n, i === 0 ? first
            : (isTable(res) ? tget(res, i + 1) : i === 1 ? (Array.isArray(res) ? res[1] : undefined) : undefined)));
          const r = execBlock(node.body, sc);
          if (r instanceof Break) break;
          if (r instanceof Return) return r;
        }
        return null;
      }
      case 'return': return new Return(evalList(node.values, scope));
      case 'break': return new Break();
      default: throw new LuaError('I do not know how to run this line', node.line);
    }
  } finally { depth--; }
}

function evalList(list, scope) {
  const out = [];
  list.forEach((e, i) => {
    const v = evN(e, scope);
    if (i === list.length - 1 && v instanceof Multi) out.push(...v.vals);
    else out.push(one(v));
  });
  return out;
}

function evN(node, scope) {
  const line = node.line;
  switch (node.k) {
    case 'lit': return node.v;
    case 'paren': return evN(node.e, scope);
    case 'vararg': return scope.get('...') || [];
    case 'name': {
      const v = scope.get(node.name);
      if (v === undefined && !scope.declared(node.name) && !GLOBAL.has(node.name)) {
        // a genuinely unknown name is almost always a typo — say so
        throw new LuaError(`there is nothing named '${node.name}' yet — has it been created?`, line);
      }
      return v;
    }
    case 'un': {
      if (node.op === 'not') return !truthy(one(evN(node.e, scope)));
      const v = one(evN(node.e, scope));
      if (node.op === '-') return -numOr(v);
      if (node.op === '#') {
        if (typeof v === 'string') return v.length;
        if (isTable(v)) return tlen(v);
        throw new LuaError(`'#' needs text or a list, not a ${typename(v)}`, line);
      }
      return v;
    }
    case 'bin': return binop(node, scope);
    case 'index': {
      const obj = one(evN(node.obj, scope));
      const key = one(evN(node.key, scope));
      if (typeof obj === 'string') {
        const m = STRING_LIB[key];
        if (m) return m;
        throw new LuaError(`text has no '${key}'`, line);
      }
      if (!isTable(obj)) {
        throw new LuaError(`I tried to look up '${key}' on a ${typename(obj)} — only a table has keys`, line);
      }
      return tget(obj, key);
    }
    case 'table': {
      const t = newTable();
      let n = 0;
      for (const it of node.items) {
        if (it.key) tset(t, one(evN(it.key, scope)), one(evN(it.value, scope)));
        else tset(t, ++n, one(evN(it.value, scope)));
      }
      return t;
    }
    case 'fn': return { __fn: true, params: node.params, vararg: node.vararg, body: node.body,
      scope: node.name === '?' || node.isMethod ? scope : scope, name: node.name, uid: ++fnUid };
    case 'call': {
      const fn = one(evN(node.fn, scope));
      const args = evalList(node.args, scope);
      if (isFn(fn) && fn.uid === undefined) fn.uid = ++fnUid;
      return callValue(fn, args, line);
    }
    case 'methodcall': {
      const obj = one(evN(node.obj, scope));
      const m = (typeof obj === 'string') ? STRING_LIB[node.method] : (isTable(obj) ? tget(obj, node.method) : undefined);
      if (!isFn(m)) throw new LuaError(`there is no '${node.method}' to call here`, line);
      return callValue(m, [obj, ...evalList(node.args, scope)], line);
    }
    default: throw new LuaError('I do not know how to work this out', line);
  }
}

function binop(node, scope) {
  const line = node.line;
  const op = node.op;

  if (op === 'and') { const l = one(evN(node.left, scope)); return truthy(l) ? one(evN(node.right, scope)) : l; }
  if (op === 'or')  { const l = one(evN(node.left, scope)); return truthy(l) ? l : one(evN(node.right, scope)); }

  const l = one(evN(node.left, scope));
  const r = one(evN(node.right, scope));

  switch (op) {
    case '..': {
      const ls = (typeof l === 'string' || typeof l === 'number') ? tostr(l) : null;
      const rs = (typeof r === 'string' || typeof r === 'number') ? tostr(r) : null;
      if (ls === null || rs === null) {
        throw new LuaError(`'..' joins text, so both sides must be text or a number — one side is a ${typename(ls === null ? l : r)}`, line);
      }
      return ls + rs;
    }
    case '==': return eq(l, r);
    case '~=': return !eq(l, r);
    case '<': case '>': case '<=': case '>=': {
      if (typeof l === 'number' && typeof r === 'number') {
        return op === '<' ? l < r : op === '>' ? l > r : op === '<=' ? l <= r : l >= r;
      }
      if (typeof l === 'string' && typeof r === 'string') {
        return op === '<' ? l < r : op === '>' ? l > r : op === '<=' ? l <= r : l >= r;
      }
      throw new LuaError(`'${op}' compares two numbers or two pieces of text — here I got a ${typename(l)} and a ${typename(r)}`, line);
    }
  }

  const a = tonum(l), b = tonum(r);
  if (a === undefined || b === undefined) {
    const bad = a === undefined ? l : r;
    throw new LuaError(`'${op}' is arithmetic, so both sides must be numbers — one side is a ${typename(bad)}`, line);
  }
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return a / b;
    case '%': return a - Math.floor(a / b) * b;
    case '^': return Math.pow(a, b);
  }
  throw new LuaError(`I do not know the operator '${op}'`, line);
}

function eq(l, r) {
  if (l === r) return true;
  if (typeof l === 'number' && typeof r === 'number') return l === r;
  if (isTable(l) || isTable(r) || isFn(l) || isFn(r)) return l === r;
  return false;
}

/** Run source. Returns { lines, error }. */
function runLua(src) {
  steps = 0; depth = 0; tableIds = 0; fnUid = 0;
  GLOBAL.clear();
  const out = installStdlib();
  try {
    const ast = parse(tokenize(src));
    const scope = new Scope(null);
    const r = execBlock(ast, scope);
    if (r instanceof Return && r.v.length) out.push(r.v.map(tostr).join('\t'));
    return { lines: out, error: null };
  } catch (e) {
    if (e instanceof LuaError) return { lines: out, error: { msg: e.message, line: e.line } };
    if (e instanceof RangeError) return { lines: out, error: { msg: 'this nested too deeply — a function is calling itself forever', line: null } };
    return { lines: out, error: { msg: String(e && e.message || e), line: null } };
  }
}

/* ════════════════════════════════════════════════════════════════════════
   3. MARKDOWN
   ════════════════════════════════════════════════════════════════════════ */

const HL_RE = new RegExp([
  '(--\\[\\[[\\s\\S]*?\\]\\]|--[^\\n]*)',                                   // 1 comment
  '("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|\\[\\[[\\s\\S]*?\\]\\])', // 2 string
  '(\\b0[xX][0-9a-fA-F]+\\b|\\b\\d+\\.?\\d*(?:[eE][+-]?\\d+)?\\b)',        // 3 number
  '(\\b(?:and|break|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\\b)', // 4 keyword
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

/* Custom fenced blocks are lifted out BEFORE marked sees them, so the
   `lab` and `predict` syntax can never collide with real code fences. */
/* Accepted forms — the `lua` prefix is optional, and only there so editors
   syntax-highlight the starter code while authoring:
     ```lua lab=hello      ```lab=hello
     ```lua predict=p1     ```predict=p1                                  */
const BLOCK_RE = /^```[ \t]*(?:\w+[ \t]+)?(lab|predict)=([\w.]+)[ \t]*\n([\s\S]*?)^```[ \t]*$/gm;
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

function renderMarkdown(md) {
  const { md: clean, blocks } = splitBlocks(md);

  let html = marked.parse(clean, { gfm: true, breaks: false });

  // inline pills like [V-rbx]
  html = html.replace(/\[(V-rbx|V-lua|VERIFY)\]/g, (_, k) =>
    `<span class="pill ${PILLS[k][0]}" title="${PILLS[k][1]}">${k}</span>`);

  const host = document.createElement('div');
  host.innerHTML = DOMPurify.sanitize(html, { ADD_ATTR: ['data-lang', 'data-wp'] });

  // language stamp + syntax colour on every fenced block
  host.querySelectorAll('pre > code').forEach(code => {
    const pre = code.parentElement;
    const cls = [...code.classList].find(c => c.startsWith('language-'));
    const lang = cls ? cls.replace('language-', '') : '';
    if (lang && lang !== 'text') {
      pre.dataset.lang = lang;
      code.innerHTML = highlight(code.textContent);
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
    const el = b.kind === 'lab' ? labBlock(b) : predictBlock(b);
    p.replaceWith(el);
  });

  return host;
}

/* ── a live lab: editor, terminals, checks ───────────────────────────── */
function labBlock(b) {
  const cfg = LABS[b.id];
  const box = document.createElement('div');
  box.className = 'blk';
  if (!cfg) { box.textContent = `[missing lab: ${b.id}]`; return box; }

  box.innerHTML = `
    <div class="blk-h">try it <span class="sub">write it, run it, watch the checks</span></div>
    <div class="lab">
      <div>
        <textarea class="edit" spellcheck="false" aria-label="code editor"></textarea>
        <div class="runbar">
          <button class="btn primary" data-run>▸ run</button>
          <button class="btn" data-hint>hint</button>
          <button class="btn" data-reset>reset</button>
          <button class="btn" data-show>answer</button>
          <span class="hint" data-status></span>
        </div>
      </div>
      <pre class="term" data-term><span class="hr">— output shows up here —</span></pre>
    </div>
    <ul class="checks" data-checks>
      ${cfg.checks.map(c => `<li><span class="m">○</span><span>${c.t}</span></li>`).join('')}
    </ul>
    <p class="hint" data-hintbox style="display:none"></p>`;

  const ta = box.querySelector('.edit');
  const term = box.querySelector('[data-term]');
  const status = box.querySelector('[data-status]');
  const hintbox = box.querySelector('[data-hintbox]');
  const checkEls = [...box.querySelectorAll('[data-checks] li')];

  const saved = store.getLab(b.id);
  ta.value = saved !== undefined ? saved : b.body;

  const setStatus = (t, cls = '') => { status.textContent = t; status.className = 'hint ' + cls; };

  const write = (lines, err) => {
    const html = lines.map(l => `<span class="p">&gt;</span> ${esc(l)}`);
    html.push(err
      ? `<span class="er">✖ ${esc((err.line ? 'line ' + err.line + ': ' : '') + err.msg)}</span>`
      : `<span class="hr">— done, ${lines.length} line${lines.length === 1 ? '' : 's'} of output —</span>`);
    term.innerHTML = html.join('\n');
  };

  const grade = (lines, err, src) => {
    let n = 0;
    cfg.checks.forEach((c, i) => {
      let ok = false;
      try { ok = !!c.ok(lines, err, src); } catch (_) { ok = false; }
      checkEls[i].className = ok ? 'pass' : 'fail';
      checkEls[i].querySelector('.m').textContent = ok ? '✔' : '✕';
      if (ok) n++;
    });
    return n;
  };

  function run() {
    const src = ta.value;
    store.setLab(b.id, src);
    const { lines, error } = runLua(src);
    write(lines, error);
    const passed = grade(lines, error, src);
    if (passed === cfg.checks.length) {
      setStatus('✓ every check passes', 'pass');
      if (!passedOnce[b.id]) { passedOnce[b.id] = true; log('ok', `✓ ${b.id} — all checks pass`); }
      if (cfg.goal !== undefined) completeGoal(current, cfg.goal);
      if (b.id === 'scratch') completeGoal('home', 1);
    } else {
      setStatus(`${passed}/${cfg.checks.length} checks pass`);
    }
  }

  box.querySelector('[data-run]').onclick = run;
  box.querySelector('[data-reset]').onclick = () => { ta.value = b.body; store.setLab(b.id, b.body); setStatus('reset'); };
  box.querySelector('[data-hint]').onclick = () => { hintbox.style.display = ''; hintbox.textContent = cfg.hint; };
  box.querySelector('[data-show]').onclick = () => {
    ta.value = cfg.solution; store.setLab(b.id, cfg.solution);
    setStatus('answer loaded — read it, then run it');
  };
  ta.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, t = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(t);
      ta.selectionStart = ta.selectionEnd = s + 2;
      store.setLab(b.id, ta.value);
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run(); }
  });
  ta.addEventListener('input', () => store.setLab(b.id, ta.value));
  return box;
}

/* ── predict first ───────────────────────────────────────────────────── */
function predictBlock(b) {
  const cfg = PREDICTS[b.id];
  const box = document.createElement('div');
  box.className = 'blk';
  if (!cfg) { box.textContent = `[missing predict: ${b.id}]`; return box; }

  box.innerHTML = `
    <div class="blk-h">predict first <span class="sub">commit before you run it</span></div>
    <p class="pre-q">${b.body || 'What does this print?'}</p>
    <div class="predict">${cfg.options.map((o, i) => `<button data-i="${i}">${o}</button>`).join('')}</div>
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
    verdict.innerHTML = `${right ? '<b class="y">Yes.</b>' : '<b class="n">Not quite.</b>'} ${cfg.why}`;
    if (right && cfg.goal !== undefined) completeGoal(current, cfg.goal);
  });
  return box;
}

/* ════════════════════════════════════════════════════════════════════════
   4. DESKTOP
   ════════════════════════════════════════════════════════════════════════ */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

let current = null;
const passedOnce = {};

/* ── persisted state ─────────────────────────────────────────────────── */
const store = (() => {
  const KEY = 'cozy-luau-v1';
  const s = { done: [], goals: {}, labs: {}, days: [], wp: 'windowsill', rain: true, last: 'home', tabs: [] };
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
    getLab: id => s.labs[id],
    setLab: (id, v) => { s.labs[id] = v; save(); },
    isDone: id => s.done.includes(id),
    markDone: id => { if (!s.done.includes(id)) { s.done.push(id); save(); } },
    clear: () => { s.done = []; s.goals = {}; s.labs = {}; s.tabs = []; save(); },
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
      b.className = 'grp-item ' + (done ? 'done' : doing ? 'doing' : 'todo');
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
  const written = LESSONS.filter(l => !l.soon).length;
  const done = LESSONS.filter(l => store.isDone(l.id)).length;
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
  kick.textContent = 'luau · from zero · in the browser';
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
  const written = LESSONS.filter(l => !l.soon && l.id !== 'home');
  const next = written.find(l => !store.isDone(l.id)) || written[0];
  const started = store.raw.done.length > 0 || store.raw.tabs.length > 0;

  const start = document.createElement('button');
  start.className = 'btn primary big';
  start.textContent = started ? `▸ Continue ${next.n} — ${next.title}` : '▸ Start lesson 0.1';
  start.onclick = () => go(next.id);

  const scratch = document.createElement('button');
  scratch.className = 'btn big';
  scratch.textContent = 'Open the scratchpad';
  scratch.onclick = () => go('play');

  cta.append(start, scratch);
  hero.appendChild(cta);

  const meta = document.createElement('div');
  meta.className = 'hero-meta';
  meta.innerHTML = `<span><b>${written.length}</b> lessons written</span>
    <span><b>0</b> installs</span><span><b>0</b> accounts</span>
    <span>runs <b>offline</b> once loaded</span>`;
  hero.appendChild(meta);
  wrap.appendChild(hero);

  /* ── resume, only once there is something to resume ── */
  const done = store.raw.done.length;
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
  course.innerHTML = `<h2>the course <span class="cnt">${written.length} written · 1 to come</span></h2>`;
  const grid = document.createElement('div');
  grid.className = 'lesson-grid';
  LESSONS.filter(l => l.g !== 'g0').forEach(l => {
    const isTool = l.g === 'g3';
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
    <p>Every lesson has the same three parts, and you cannot break anything.</p>`;
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
        <p>This box is next in line. Everything before it is finished — when you get through
           the ones above, this one gets written.</p>
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
  const idx = LESSONS.findIndex(l => l.id === id);
  const nav = document.createElement('div');
  nav.className = 'stepnav';
  const prev = LESSONS[idx - 1], next = LESSONS[idx + 1];
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
  $('#foot-right').textContent = `luau · utf-8 · ~${lesson.mins} min`;
}

/* ── routing ─────────────────────────────────────────────────────────── */
function go(id, push = true) {
  const lesson = LESSONS.find(l => l.id === id);
  if (!lesson) return;
  current = id;
  store.raw.last = id;
  store.save();
  openTab(id);
  paintTreeState();
  renderGoals(id);
  renderLesson(id);
  $$('.d-item').forEach(d => d.classList.toggle('on', d.dataset.open === id || (d.dataset.open === 'lesson' && !['play','cheat'].includes(id))));
  if (push) location.hash = '#/' + id;
  if (id === '0.1') completeGoal('home', 0);
  if (id === 'cheat') completeGoal('home', 2);
  if (window.innerWidth <= 860) document.body.classList.remove('tree-open');
}

function step(d) {
  const i = LESSONS.findIndex(l => l.id === current);
  const t = LESSONS[i + d];
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
  palHits = LESSONS.filter(l => !q || (l.title + ' ' + l.id).toLowerCase().includes(q));
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
    ['luau-desktop 0.4.1 — starting', 'dim'],
    ['  mounting ~/luau-from-zero ......... ok', 'ok'],
    ['  reading progress from disk ........ ok', 'ok'],
    ['  interpreter: embedded, offline .... ok', 'ok'],
    ['', ''],
    ['welcome. nothing here needs installing.', 'on'],
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
  $('#menu-btn').onclick = () => {
    if (innerWidth <= 860) document.body.classList.toggle('tree-open');
    else document.body.classList.toggle('no-tree');
  };
  $('#tree-close').onclick = () => document.body.classList.toggle('no-tree');
  $$('.ws').forEach(b => b.onclick = () => {
    $$('.ws').forEach(x => x.classList.toggle('on', x === b));
    go({ 1: 'home', 2: 'play', 3: 'cheat' }[b.dataset.goto]);
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
    if (!confirm('Forget all progress and every scratchpad you have written?')) return;
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
    go(d.dataset.open === 'lesson' ? current : d.dataset.open);
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
    if (e.key === 'Escape') { closePalette(); document.body.classList.remove('wp-open'); return; }
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
          <p class="hint">Everything else on the page — the interpreter, the labs —
             is already loaded and working.</p>
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
