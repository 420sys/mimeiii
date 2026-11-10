/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/MD
   Lesson markdown → the machine's own DOM.

   marked and DOMPurify do the boring part (prose, lists, tables, inline code);
   everything with a job gets rebuilt here:
     ```lua / ```luau      a numbered code well with a copy button
     ```output             a Studio Output panel (errors red, source tags dim)
     ```solution           folded away behind `cat solution.lua`
     ```task=id            a runbook — square checks that tick goals
     ```lua predict=id     a probe — pick an answer, get the reason why
     [V-rbx] [V-lua] [VERIFY]   pills
     > **Done when** …     the [ done when ] block

   The runbook/probe blocks are the only things that touch progress, and they
   do it through the `onGoal(index)` the caller passes in — so a lesson body
   can be rendered read-only (the man page) without ever ticking anything.
   ════════════════════════════════════════════════════════════════════════════ */

import '../../vendor/marked.min.js';       // UMD: fills globalThis.marked
import '../../vendor/purify.min.js';       // UMD: fills globalThis.DOMPurify
import { TASKS, PREDICTS } from '../data/course.js';
import { state, toggleTask } from './state.js';
import { sound } from './sound.js';
import { announce } from './journal.js';
import { GLOSSARY } from '../data/glossary.js';

const marked = globalThis.marked;
const DOMPurify = globalThis.DOMPurify;

/* ── luau highlighting ──────────────────────────────────────────────────────
   One pass, five token kinds. `.tok-g` is for the engine's own names so a
   learner can see at a glance what Roblox gives them for free and what they
   wrote themselves. */
const GLOBALS = new Set([
  'game', 'workspace', 'script', 'Instance', 'Vector3', 'CFrame', 'Color3', 'UDim2',
  'TweenInfo', 'Enum', 'Ray', 'Region3', 'NumberRange', 'BrickColor', 'Random',
  'print', 'warn', 'error', 'assert', 'require', 'pcall', 'xpcall', 'tostring', 'tonumber',
  'type', 'typeof', 'pairs', 'ipairs', 'next', 'select', 'unpack', 'setmetatable', 'getmetatable',
  'rawget', 'rawset', 'spawn', 'wait', 'task', 'math', 'string', 'table', 'os', 'coroutine',
  'tonumber', 'string', 'tick', 'shared', 'self', 'plugin', 'DateTime',
]);

const HL_RE = new RegExp([
  '(--\\[\\[[\\s\\S]*?\\]\\]|--[^\\n]*)',                                   // 1 comment
  '("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`|\\[\\[[\\s\\S]*?\\]\\])', // 2 string
  '(\\b0[xX][0-9a-fA-F]+\\b|\\b\\d+\\.?\\d*(?:[eE][+-]?\\d+)?\\b)',        // 3 number
  '(\\b(?:and|break|continue|do|else|elseif|end|false|for|function|if|in|local|nil|not|or|repeat|return|then|true|until|while)\\b)', // 4 keyword
  '([A-Za-z_]\\w*)(?=\\s*\\()',                                            // 5 call
  '\\b([A-Za-z_]\\w*)\\b',                                                 // 6 name
].join('|'), 'g');

export const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function highlightLuau(code) {
  let out = '', last = 0, m;
  HL_RE.lastIndex = 0;
  while ((m = HL_RE.exec(code))) {
    out += escapeHtml(code.slice(last, m.index));
    const t = escapeHtml(m[0]);
    if (m[1]) out += `<span class="tok-c">${t}</span>`;
    else if (m[2]) out += `<span class="tok-s">${t}</span>`;
    else if (m[3]) out += `<span class="tok-n">${t}</span>`;
    else if (m[4]) out += `<span class="tok-k">${t}</span>`;
    else if (m[5]) out += `<span class="tok-f">${t}</span>`;
    else if (m[6] && GLOBALS.has(m[6])) {
      out += Object.hasOwn(GLOSSARY, m[6])
        ? `<span class="tok-g g-term" data-g="${t}">${t}</span>`
        : `<span class="tok-g">${t}</span>`;
    }
    else out += t;
    last = m.index + m[0].length;
  }
  out += escapeHtml(code.slice(last));
  return out;
}

/** A one-line bit of markdown (task steps, probe questions, verdicts). */
export const inlineMd = s => DOMPurify.sanitize(marked.parseInline(String(s)), { ADD_ATTR: ['title'] });

/* ── custom fences, lifted out before marked can see them ─────────────────
     ```lua predict=p-first      a probe
     ```task=setup-run           a runbook                                     */
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

/** The code shown with probe `id` in lesson markdown `md`, or null: a warm-up can draw a probe missed in an earlier lesson. */
export function probeSource(md, id) {
  const b = splitBlocks(md).blocks.find(x => x.kind === 'predict' && x.id === id);
  return b ? b.body : null;
}

const PILLS = {
  'V-rbx': ['rbxl', 'Roblox Studio', 'run this inside Roblox Studio'],
  'V-lua': ['lua', 'Luau', 'plain Luau — no engine needed'],
  'VERIFY': ['warn', 'you check', 'check this yourself rather than trusting the lesson'],
};

/* ── the pieces ───────────────────────────────────────────────────────────── */

/* ── helpers: line notes, asides, steps ──────────────────────────────────── */

/** True when `s` ends inside an unclosed string literal. */
function inString(s) {
  let q = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = ''; }
    else if (c === '"' || c === "'" || c === '`') q = c;
  }
  return q !== '';
}

/** A trailing `-- @n note` (outside any string) -> { code, note }. */
function splitNote(line) {
  const re = /(^|\s)--[ \t]+@n(?:[ \t]+|$)/g;
  let m, last = null;
  while ((m = re.exec(line))) last = m;
  if (!last) return { code: line, note: '' };
  const at = last.index + last[1].length;
  const before = line.slice(0, at);
  if (inString(before)) return { code: line, note: '' };
  return { code: before.replace(/\s+$/, ''), note: line.slice(last.index + last[0].length).trim() };
}

/** Turn a blockquote into an <aside> with a label span in front. */
function asideFrom(bq, cls, lblCls, label) {
  const aside = document.createElement('aside');
  aside.className = cls;
  const lbl = document.createElement('span');
  lbl.className = lblCls;
  lbl.textContent = label;
  aside.appendChild(lbl);
  while (bq.firstChild) aside.appendChild(bq.firstChild);
  bq.replaceWith(aside);
}

/** Group the host's top-level children into the quest steps (see quest-spec). */
function wrapSteps(host) {
  const kids = [...host.children];
  let end = kids.findIndex(el => el.classList.contains('done-when'));
  if (end === -1) end = kids.length;
  const steps = [];
  let cur = null, n = 0;
  const open = intro => {
    cur = document.createElement('section');
    cur.className = intro ? 'step step-intro' : 'step';
    cur.dataset.step = String(intro ? 0 : ++n);
    steps.push(cur);
  };
  for (const el of kids.slice(0, end)) {
    if (el.tagName === 'H2') {
      open(false);
      if (/^\s*(your turn|build)/i.test(el.textContent)) cur.dataset.kind = 'build';
    } else if (!cur) open(true);
    cur.appendChild(el);
  }
  steps.forEach(s => {
    if (s.dataset.kind === 'build' && !s.querySelector('.runbook, .probe')) s.setAttribute('data-optional', '');   // practice that nothing checks
    if (s.dataset.kind) return;
    s.dataset.kind = s.classList.contains('step-intro') ? 'read'
      : s.querySelector('.runbook') ? 'do'
      : s.querySelector('.probe') ? 'predict' : 'read';
  });
  host.replaceChildren(...steps, ...kids.slice(end));
}

/** A numbered code well: the thing every lesson hands you to type.
 *  opts.notes  strip trailing `-- @n` line notes and show them beside the line */
export function codeBlock(raw, { lang = 'luau', cap = '', copy = true, notes = false } = {}) {
  let code = raw.replace(/\n$/, '');
  let noteOf = null;
  if (notes) {
    noteOf = [];
    code = code.split('\n').map(ln => { const s = splitNote(ln); noteOf.push(s.note); return s.code; }).join('\n');
  }
  const box = document.createElement('figure');
  box.className = 'code';
  box.dataset.lang = lang;

  const head = document.createElement('figcaption');
  head.className = 'code-head';
  head.innerHTML = `<span class="lang">${escapeHtml(lang)}</span>
    <span class="cap">${escapeHtml(cap)}</span><span class="sp"></span>`;
  if (copy) {
    const b = document.createElement('button');
    b.className = 'copy';
    b.type = 'button';
    b.textContent = 'copy';
    b.title = 'Copy this script into Studio';
    b.onclick = () => copyText(code, b);
    head.appendChild(b);
  }

  const pre = document.createElement('pre');
  const body = document.createElement('code');
  const lines = code.split('\n');
  body.innerHTML = lines.map((ln, i) => {
    const tx = lang === 'text' ? escapeHtml(ln) : highlightLuau(ln);
    const note = noteOf && noteOf[i];
    const nt = note ? `<span class="ln-note" role="note">${inlineMd(note)}</span>` : '';
    return `<span class="cl${note ? ' has-note' : ''}"><span class="ln" aria-hidden="true">${i + 1}</span><span class="tx">${tx}</span>${nt}</span>`;
  }).join('');
  pre.appendChild(body);
  box.append(head, pre);
  return box;
}

async function copyText(raw, btn) {
  const was = btn.textContent;
  try {
    await navigator.clipboard.writeText(raw);
    btn.textContent = 'copied';
    btn.classList.add('did');
    sound.tick();
  } catch (_) {
    // no clipboard (insecure context): select it and say so
    const code = btn.closest('.code').querySelector('code');
    const r = document.createRange();
    r.selectNodeContents(code);
    const sel = getSelection();
    sel.removeAllRanges(); sel.addRange(r);
    btn.textContent = `selected — press ${/Mac|iP(hone|ad|od)/.test(navigator.platform || navigator.userAgent) ? '⌘C' : 'Ctrl+C'}`;
    btn.classList.add('did');
  }
  setTimeout(() => { btn.textContent = was; btn.classList.remove('did'); }, 1800);
}

/** Studio's Output window, which is where every learner looks first. */
export function outputPanel(raw) {
  const lines = raw.replace(/\n$/, '').split('\n');
  const box = document.createElement('div');
  box.className = 'out';
  box.innerHTML = `<div class="out-head"><span class="k">Studio</span><span class="sub">Output</span>
    <span class="sp"></span><span class="sub">what you should see</span></div>
    <pre>${lines.map(l => {
      const err = l.startsWith('! ');
      const text = err ? l.slice(2) : l;
      const at = text.lastIndexOf('  -  ');
      const msg = at === -1 ? text : text.slice(0, at);
      const src = at === -1 ? '' : `<span class="src">${escapeHtml(text.slice(at))}</span>`;
      return `<span class="${err ? 'er' : 'ln'}">${escapeHtml(msg)}${src}</span>`;
    }).join('\n')}</pre>`;
  return box;
}

/** ```solution — one way to do it, folded away so the learner tries first. */
export function solutionBlock(raw) {
  const box = document.createElement('details');
  box.className = 'solution';
  box.innerHTML = `<summary><span class="k">cat solution.lua</span>
    <span>Tried it yourself first? Here is one way to do it.</span></summary>`;
  box.appendChild(codeBlock(raw, { lang: 'luau', cap: 'solution.lua' }));
  return box;
}

/** ```task=id — the runbook: the steps you do in your own Roblox Studio. */
export function taskBlock(id, body, { onGoal = null, lessonId = null } = {}) {
  const cfg = TASKS[id];
  const box = document.createElement('div');
  box.className = 'runbook';
  box.dataset.task = id;
  if (!cfg) {
    box.textContent = `[missing runbook: ${id}]`;
    return box;
  }

  const steps = body.split('\n').map(l => l.replace(/^\s*-\s*/, '').trim()).filter(Boolean);
  if (cfg.goal !== undefined) box.dataset.cp = String(cfg.goal);   // a checkpoint in the lesson (study.js numbers them in page order)
  box.innerHTML = `<div class="runbook-h"><span class="k">in Studio</span><span class="sub">runbook</span></div>
    <p class="t">${escapeHtml(cfg.title)}</p>
    <ul class="checks" role="group" aria-label="${escapeHtml(cfg.title)} — steps">${steps.map((s, i) =>
      `<li data-i="${i}" role="checkbox" aria-checked="false" tabindex="0"><span class="m" aria-hidden="true"></span><span>${inlineMd(s)}</span></li>`).join('')}
    </ul>
    <div class="runbook-foot"><span class="meter thin"><i style="width:0%"></i></span><span class="hint">0 of ${steps.length} done</span></div>`;

  const items = [...box.querySelectorAll('.checks li')];
  const bar = box.querySelector('.meter > i');
  const status = box.querySelector('.hint');

  const paint = () => {
    const have = state.tasks[id] || [];
    items.forEach((li, i) => {
      const on = have.includes(i);
      li.setAttribute('aria-checked', String(on));
    });
    const n = items.filter(li => li.getAttribute('aria-checked') === 'true').length;
    bar.style.width = (n / steps.length * 100).toFixed(0) + '%';
    const all = n >= steps.length;
    status.textContent = all ? 'all done — checkpoint reached' : `${n} of ${steps.length} done`;
    status.className = 'hint' + (all ? ' pass' : '');
    box.classList.toggle('done', all);
    return all;
  };

  const toggle = i => {
    const on = toggleTask(id, i);
    if (!paint()) return;
    if (on && onGoal) onGoal(cfg.goal);
  };
  items.forEach((li, i) => {
    li.onclick = () => toggle(i);
    li.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(i); } };
  });
  if (paint() && cfg.goal !== undefined) box.dataset.complete = '1';
  return box;
}

/** ```lua predict=id — a probe: answer it before you run anything. */
export function probeBlock(id, body, { onGoal = null, onAnswer = null, answer = null, from = '' } = {}) {
  /* answer: a pick already made, painted with no side effects (no sound, goal or miss), so a saved answer comes back
     without being counted twice. onAnswer(index, right): a pick made now. onGoal(goal): a right pick's checkpoint. */
  const cfg = PREDICTS[id];
  const box = document.createElement('div');
  box.className = 'probe';
  box.dataset.probe = id;
  if (from) box.dataset.lead = '1';          // a warm-up drawn from an earlier stop: its answer is not kept as this lesson's place
  if (!cfg) {
    box.textContent = `[missing probe: ${id}]`;
    return box;
  }
  const head = from
    ? `<span class="k">quick question</span> <span class="from">warm up — missed in ${escapeHtml(String(from))}</span>`
    : cfg.recall
      ? `<span class="k">quick question</span> <span class="from">warm up — from ${escapeHtml(String(cfg.recall))}</span>`
      : '<span class="k">quick question</span> <span class="from">predict first</span>';
  if (!from && cfg.goal !== undefined) box.dataset.cp = String(cfg.goal);   // a checkpoint in the lesson; a warm-up from another stop is not this one's
  const q = cfg.q || (cfg.recall || from
    ? 'From memory — what will the Output window show?'
    : 'What will the Output window show? Pick before you press Play.');

  box.innerHTML = `<div class="probe-h">${head}</div>
    <p class="q">${inlineMd(q)}</p>
    <div class="opts">${cfg.options.map((o, i) => `<button type="button" data-i="${i}">${escapeHtml(o)}</button>`).join('')}</div>
    <p class="verdict" hidden></p>
    <button type="button" class="again" hidden>try again</button>`;
  box.querySelector('.q').before(codeBlock(body, { lang: 'luau', cap: 'predict.lua', copy: false }));

  const verdict = box.querySelector('.verdict'), again = box.querySelector('.again');
  const buttons = [...box.querySelectorAll('.opts button')];
  /* the answered state, painted from a pick and nothing more: a saved answer comes back through here too */
  const paint = i => {
    const right = i === cfg.answer;
    buttons.forEach(x => { x.disabled = true; });
    buttons[cfg.answer].classList.add('right');
    if (!right) buttons[i].classList.add('wrong');
    verdict.hidden = false;
    verdict.innerHTML = `${right ? '<b class="y">Correct.</b>' : '<b class="n">Not quite.</b>'} ${inlineMd(cfg.why)}`;
    box.classList.toggle('missed', !right);
    box.dataset.picked = String(i);       // session.js keeps this as the lesson's place
    again.hidden = right;
    return right;
  };
  /* try again: the question is asked afresh (a miss that was counted stays counted) */
  again.onclick = () => {
    buttons.forEach(x => { x.disabled = false; x.classList.remove('right', 'wrong'); });
    verdict.hidden = true;
    verdict.textContent = '';
    box.classList.remove('missed');
    delete box.dataset.picked;
    again.hidden = true;
    buttons[0].focus({ preventScroll: true });
  };
  buttons.forEach((btn, i) => btn.onclick = () => {
    const right = paint(i);
    if (!right) {                                  // the options just locked: the keyboard moves to try again, and it must be in view or Space would reset it unseen
      again.focus({ preventScroll: true });
      again.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    }
    announce(verdict.textContent);          // the verdict is plain text on the page: say it too
    if (onAnswer) onAnswer(i, right);
    if (right && cfg.goal !== undefined && onGoal) onGoal(cfg.goal);
  });
  if (Number.isInteger(answer) && answer >= 0 && answer < buttons.length) paint(answer);
  return box;
}

/* ── the renderer ─────────────────────────────────────────────────────────── */

/**
 * renderMarkdown(md, opts) -> a fragment you can append into .doc or .man-doc.
 * opts.lessonId  the lesson these goals belong to (runbooks/probes need it)
 * opts.onGoal    (index) => void — called when a check or probe is satisfied
 * opts.plain     true for man pages: no runbooks, no probes, no copy buttons
 * opts.answers   { probe id: option index } — probes shown already answered; painted, never clicked, so nothing is counted
 * opts.onPick    (probeId, index, right, ownerId) — a pick made now; opts.onGoal gets (index, ownerId) as well
 * opts.warm      [{ id, body, lesson, n }] — probes missed in earlier units; they lead the warm-up (3 in all, none twice)
 */
export function renderMarkdown(md, { lessonId = null, onGoal = null, plain = false, answers = null, onPick = null, warm = null, revisit = '' } = {}) {
  const { md: clean, blocks } = splitBlocks(md);

  let html = marked.parse(clean, { gfm: true, breaks: false });
  html = html.replace(/\[(V-rbx|V-lua|VERIFY)\]/g, (_, k) => {
    const [cls, label, title] = PILLS[k];
    return `<span class="pill ${cls}" title="${escapeHtml(title)}">${escapeHtml(label)}</span>`;
  });

  const host = document.createElement('div');
  host.innerHTML = DOMPurify.sanitize(html, { ADD_ATTR: ['title', 'data-lang'] });

  /* code wells */
  host.querySelectorAll('pre > code').forEach(code => {
    const pre = code.parentElement;
    const cls = [...code.classList].find(c => c.startsWith('language-'));
    const lang = cls ? cls.replace('language-', '') : '';
    const raw = code.textContent;
    let node;
    if (lang === 'output') node = outputPanel(raw);
    else if (lang === 'solution') node = plain ? codeBlock(raw, { lang: 'luau', cap: 'solution.lua' }) : solutionBlock(raw);
    else if (!lang || lang === 'lua' || lang === 'luau' || lang === 'text') {
      node = codeBlock(raw, { lang: lang === 'text' ? 'text' : 'luau', copy: !plain && lang !== 'text', notes: lang === 'lua' || lang === 'luau' });
    } else {
      node = codeBlock(raw, { lang, copy: !plain });
    }
    pre.replaceWith(node);
  });

  /* tables get their own scroll box */
  host.querySelectorAll('table').forEach(t => {
    const wrap = document.createElement('div');
    wrap.className = 'tbl';
    t.replaceWith(wrap);
    wrap.appendChild(t);
  });

  /* [ done when ] blocks: the lesson already says "Done when", so the label
     the CSS draws would be a stutter — drop the phrase and keep the rest. */
  host.querySelectorAll('blockquote').forEach(bq => {
    const first = bq.querySelector('p');
    const strong = first && first.querySelector('strong');
    if (strong && /^done when$/i.test(strong.textContent.trim())) {
      strong.remove();
      first.innerHTML = first.innerHTML.replace(/^\s+/, '');
      bq.classList.add('done-when');
    } else if (strong && /^(key idea|recap)$/i.test(strong.textContent.trim())) {
      const recap = /^recap$/i.test(strong.textContent.trim());
      strong.remove();
      first.innerHTML = first.innerHTML.replace(/^\s+/, '');
      if (!first.textContent.trim() && !first.children.length) first.remove();
      if (recap) asideFrom(bq, 'recap', 'rc-lbl', 'recap');
      else asideFrom(bq, 'key-idea', 'ki-lbl', 'key idea');
    }
  });

  /* a probe, wired: a saved answer is painted quietly; a pick made now reports itself; a right one earns its goal for the
     lesson the probe belongs to. `lead` are missed probes of earlier units: when there are any they open the warm-up. */
  const lead = !plain && Array.isArray(warm) ? warm : [];
  let warmed = false;
  const probe = w => probeBlock(w.id, w.body, {
    answer: answers && Object.hasOwn(answers, w.id) ? answers[w.id] : null,
    from: w.lesson !== lessonId ? w.n : '',
    onGoal: onGoal && (g => onGoal(g, w.lesson)),
    onAnswer: (i, right) => { if (onPick) onPick(w.id, i, right, w.lesson); },
  });

  /* put the runbooks and probes back where their sentinel paragraph sits */
  [...host.querySelectorAll('p')].forEach(p => {
    const m = new RegExp('^' + SENTINEL + '(\\d+)@@$').exec(p.textContent.trim());
    if (!m) return;
    const b = blocks[+m[1]];
    if (!b) { p.remove(); return; }
    if (plain) { p.remove(); if (b.kind === 'predict') p.replaceWith(codeBlock(b.body, { lang: 'luau', copy: false })); return; }
    if (b.kind === 'task') { p.replaceWith(taskBlock(b.id, b.body, { onGoal, lessonId })); return; }
    const warmUp = x => !!(PREDICTS[x.id] && PREDICTS[x.id].recall);
    if (lead.length && warmUp(b)) {
      /* the warm-up, drawn from misses: missed probes first, the lesson's own warm-ups after; 3 at most, none twice */
      if (warmed) { p.remove(); return; }
      warmed = true;
      const own = blocks.filter(x => x.kind === 'predict' && warmUp(x)).map(x => ({ id: x.id, body: x.body, lesson: lessonId }));
      const mine = own.filter(x => !lead.some(w => w.id === x.id));
      /* revisit: the probe the learner was sent here for is not pushed out by the carried-over ones */
      p.replaceWith(...[...mine.filter(x => x.id === revisit), ...lead, ...mine.filter(x => x.id !== revisit)].slice(0, 3).map(w => probe(w)));
      return;
    }
    p.replaceWith(probe({ id: b.id, body: b.body, lesson: lessonId }));
  });

  /* quest steps: wrap last, on the final DOM, so runbooks and probes are in place */
  if (!plain) wrapSteps(host);

  /* the last line of defence: a lesson that links nothing should say so */
  if (!host.children.length) {
    const p = document.createElement('p');
    p.className = 'hint';
    p.textContent = 'This lesson has no text yet.';
    host.appendChild(p);
  }
  return host;
}
