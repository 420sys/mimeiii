/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/SESSION
   The lesson behind workspace 2, one at a time, read on the study's big pane
   of glass. This file renders the lesson (the title block, a quiet head over
   each step, the end card), keeps the place you stopped at, follows the step
   you are reading for the scripts drawer, and says when a checkpoint is
   reached. study.js builds the panes, the outline and the bar's words.

   A session never invents progress: every tick comes from a runbook or a probe
   inside the lesson body, through completeGoal().
   ════════════════════════════════════════════════════════════════════════════ */

import { GOALS, GROUPS, PREDICTS, courseList, lessonById, writtenLessons } from '../data/course.js';
import { activeWs, defineWindow, goWorkspace } from '../core/wm.js';
import { clearMiss, completeGoal, goalsOf, isDone, missList, missProbe, placeOf, setPlace, state, save } from '../core/state.js';
import { log, announce } from '../core/journal.js';
import { sound } from '../core/sound.js';
import { probeSource, renderMarkdown } from '../core/md.js';
import { GLOSSARY } from '../data/glossary.js';
import { isNight, onNights, tonight } from '../core/nights.js';
import { signAfter } from '../desk/pages.js';
import { repaint, onPaint } from './window.js';
import { openMan } from './man.js';

let docEl = null, bodyEl = null, bench = null;
let current = null;
let opening = '';                     // a lesson on its way in: the switch to the study must not open the first stop as well
let skipSave = false, saveTimer = 0, wantProbe = '', wantLesson = '';   // the place: see savePlace / restorePlace (wantProbe: the probe "N to revisit" opens at)
let clockNow = () => new Date();       // study.js lends the desk's clock, so a pinned ?time reads the same everywhere

export const currentLessonId = () => current;
/** study.js: the clock the end card reads "tonight" from. */
export const setSessionClock = fn => { clockNow = typeof fn === 'function' ? fn : () => new Date(); summitKey = ''; paintEnd(); };

const p2 = n => String(n).padStart(2, '0');
const plain = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.trim(); };
const isMac = () => /Mac|iP(hone|ad|od)/.test(navigator.platform || navigator.userAgent);

/* ── the thing other panes watch ──────────────────────────────────────────── */
const watchers = new Set();

/** Subscribe to “the open lesson changed”. The callback gets the lesson id (or null when nothing is open). */
export const onLesson = fn => { watchers.add(fn); return () => watchers.delete(fn); };

function notifyLesson() {
  for (const fn of watchers) { try { fn(current); } catch (err) { console.error(err); } }
}

/** Subscribe to "the step being read, or what is cleared, changed" (the outline and the bar's words). */
const questWatchers = new Set();
export const onQuest = fn => { questWatchers.add(fn); return () => questWatchers.delete(fn); };
function notifyQuest() {
  for (const fn of questWatchers) { try { fn(qHere); } catch (err) { console.error(err); } }
}
/** The step being read (0 is the title and the intro), or null with nothing open. */
export const stepHere = () => (current ? qHere : null);

/* ── the body of one lesson ───────────────────────────────────────────────── */
function kickerFor(l) {
  const grp = GROUPS.find(g => g.id === l.g);
  return `<p class="kicker"><span>stop ${l.n}</span><span class="s">·</span>
    <span class="p">${grp ? grp.label.toLowerCase() : 'the line'}</span></p>`;
}

function paintUnbuilt(l) {
  const next = writtenLessons().find(x => !isDone(x.id)) || writtenLessons()[0];
  return `<div class="unbuilt">
      <p class="big">${l ? `${l.n} is being built` : 'no session open'}</p>
      <p>${l
    ? 'This stop is not written yet. Carry on from where you are on the line — it will be here when you come back.'
    : 'Pick a stop from the course, or start at the next one on the line.'}</p>
      ${next ? `<button class="unbuilt-next" id="ss-next">open ${next.n} · ${next.title} <span>→</span></button>` : ''}
    </div>`;
}

function render(id) {
  savePlace();                        // the lesson we are leaving keeps its place before its page is replaced
  stopQuest();
  scripts = [];
  lastStep = ''; benchKey = ''; shownSig = ''; active = 0; mirrorSrc = null; summitKey = '';
  current = id || null;
  if (!docEl) { notifyLesson(); return; }
  const l = current ? lessonById(current) : null;
  const src = l && l.md ? document.getElementById(l.md) : null;

  if (!l || l.soon || !src) {
    docEl.innerHTML = paintUnbuilt(l);
    const go = docEl.querySelector('#ss-next');
    if (go) go.onclick = () => {
      const next = writtenLessons().find(x => !isDone(x.id)) || writtenLessons()[0];
      if (next) openLesson(next.id);
    };
  } else {
    docEl.innerHTML = '';
    const frag = renderMarkdown(src.textContent, {
      lessonId: current,
      answers: (placeOf(current) || {}).p,     // saved answers are painted, never clicked: nothing is ticked or counted twice
      onPick: gotPick,
      warm: warmFor(l),
      revisit: wantLesson === current ? wantProbe : '',   // the probe N to revisit asked for stays among the warm-ups
      onGoal: (index, owner = current) => {    // a warm-up from an earlier stop earns the goal of the stop it came from
        const res = completeGoal(owner, index);
        afterGoal(res, index, owner);
      },
    });
    frag.prepend(questHead(l, frag));
    stepHeads(frag);
    docEl.append(...frag.childNodes);
    docEl.querySelectorAll('.cl.has-note').forEach(c => { c.tabIndex = 0; });
    docEl.querySelectorAll('.g-term').forEach(t => {
      const g = Object.hasOwn(GLOSSARY, t.dataset.g) ? GLOSSARY[t.dataset.g] : '';
      if (g) t.title = g;
    });
    markScripts();
    docEl.appendChild(endCard());
    docEl.appendChild(navBar(l));
    paintEnd();
    startQuest();
  }

  if (bodyEl) bodyEl.scrollTop = 0;
  restorePlace();
  paintBench();
  notifyLesson();
}

/* ── the place: step, scroll and answered probes, kept per lesson (state.place) ── */
/** The answered probes on the page: md.js leaves the pick on the probe itself (data-picked) and takes it off on "try again". */
function probePicks(kept) {
  const out = {};
  /* an answer whose probe is not on the page (the drawn warm-ups pushed it out) stays as it was */
  const onPage = new Set([...docEl.querySelectorAll('.probe[data-probe]')].map(p => p.dataset.probe));
  for (const [k, v] of Object.entries(kept || {})) if (!onPage.has(k)) out[k] = v;
  /* a warm-up drawn from an earlier stop (data-lead) is asked afresh each time it is shown */
  docEl.querySelectorAll('.probe[data-picked]:not([data-lead])').forEach(p => { out[p.dataset.probe] = +p.dataset.picked; });
  return out;
}

/** A pick made now: a wrong one is filed against the lesson the probe belongs to; a right one takes it off the list,
 *  clicks (unless it also reaches a checkpoint, which has its own sound) and tells the study, which lights the step. */
function gotPick(pid, i, right, owner) {
  if (right) {
    clearMiss(owner, pid);
    /* a warm-up drawn from another stop: that stop still holds the wrong pick and would reopen as Not quite */
    const pl = owner !== current ? placeOf(owner) : null;
    if (pl && pl.p && Object.hasOwn(pl.p, pid)) setPlace(owner, { ...pl, p: { ...pl.p, [pid]: i } });
    const g = PREDICTS[pid] ? PREDICTS[pid].goal : undefined;
    const earns = g !== undefined && !goalsOf(owner).includes(g);   // md.js reports the pick before the goal it earns
    if (!earns) sound.correct();
    if (docEl) docEl.dispatchEvent(new CustomEvent('study:correct', { bubbles: true, detail: { probe: pid } }));
  } else missProbe(owner, pid);
  repaint();
}

/** The lead of a lesson's warm-up: probes missed in earlier units, the oldest miss first, their code read from their own lesson. */
function warmFor(l) {
  const unit = GROUPS.findIndex(g => g.id === l.g), out = [];
  for (const m of missList()) {
    const from = lessonById(m.lessonId);
    const src = from && from.md ? document.getElementById(from.md) : null;
    const at = from ? GROUPS.findIndex(g => g.id === from.g) : -1;
    const body = src && at >= 0 && at < unit ? probeSource(src.textContent, m.probeId) : null;
    if (body !== null && !out.some(w => w.id === m.probeId)) out.push({ id: m.probeId, body, lesson: from.id, n: from.n });
    if (out.length === 3) break;
  }
  return out;
}

function savePlace() {
  if (!docEl || !bodyEl || !current || skipSave) return;
  clearTimeout(saveTimer);
  const prev = placeOf(current);
  const shown = bodyEl.clientHeight > 0;      // a hidden study reads scrollTop 0: keep what was stored
  setPlace(current, { s: qHere, m: qSeen, y: shown ? bodyEl.scrollTop : (prev ? prev.y : 0), p: probePicks(prev && prev.p) });
}
const queueSave = (ms = 450) => { clearTimeout(saveTimer); saveTimer = setTimeout(savePlace, ms); };

/* The page is still settling for a beat after a render: steps can grow by thousands of pixels as the rest of them
   lands. So a saved scroll is held for that beat: put back each time the page changes height, with the browser's
   scroll anchoring off, which would otherwise keep what the short page showed in view while the steps above it
   grow, and carry the reader to the end of the lesson. It lets go once the page has held still for SETTLE_QUIET,
   after SETTLE_MAX at the most, or as soon as something else scrolls the page (the learner, a step picked in the
   outline). */
const SETTLE_QUIET = 600, SETTLE_MAX = 4000;
let settle = null;
function stopSettle() { const s = settle; settle = null; if (s) s(); }

/** After render (renderMarkdown has already painted the answered probes; nothing is replayed): the step and the scroll, or the probe that "N to revisit" asked for. */
function restorePlace() {
  stopSettle();                              // a new render: the last one's scroll is not ours to hold any more
  const pl = placeOf(current);
  const ask = wantProbe && wantLesson === current ? wantProbe : '';   // only the stop it was asked of takes the request
  const want = ask && docEl ? [...docEl.querySelectorAll('.probe[data-probe]')].find(p => p.dataset.probe === ask) : null;
  if (ask) wantProbe = wantLesson = '';
  if (!docEl || !bodyEl || !docEl.querySelector('.quest-head') || !(pl || want)) return;
  const id = current;
  if (pl) { qSeen = Math.max(qSeen, pl.m, pl.s); qHere = pl.s; paintQuest(); }
  if (want) {                                // the probe "N to revisit" asked for: centred as soon as the page has a height
    let n = 0;
    const go = () => {
      if (current !== id || !bodyEl.clientHeight) { if (++n < 8) requestAnimationFrame(go); return; }
      want.scrollIntoView({ block: 'center', behavior: 'instant' });
      /* the keyboard goes with the probe: try again on a missed one, else its first open option */
      const ctl = want.querySelector('.again:not([hidden])') || want.querySelector('.opts button:not(:disabled)');
      if (ctl) ctl.focus({ preventScroll: true });
    };
    go();
    return;
  }
  const y = pl.y;
  if (!y) return;
  let quiet = 0;
  /* where the restore would have the page now: the saved scroll, or as near as a page still too short allows */
  const where = () => Math.min(y, Math.max(0, bodyEl.scrollHeight - bodyEl.clientHeight));
  const put = () => {
    if (current !== id) { stopSettle(); return; }
    if (bodyEl.clientHeight && Math.abs(bodyEl.scrollTop - y) > 2) bodyEl.scrollTop = y;
    clearTimeout(quiet);
    quiet = setTimeout(stopSettle, SETTLE_QUIET);
  };
  const moved = () => { if (bodyEl.clientHeight && Math.abs(bodyEl.scrollTop - where()) > 2) stopSettle(); };
  const grows = new ResizeObserver(put);
  const cap = setTimeout(stopSettle, SETTLE_MAX);
  settle = () => {
    grows.disconnect();
    clearTimeout(quiet);
    clearTimeout(cap);
    bodyEl.removeEventListener('scroll', moved);
    bodyEl.style.overflowAnchor = '';
  };
  bodyEl.style.overflowAnchor = 'none';
  bodyEl.addEventListener('scroll', moved, { passive: true });
  grows.observe(docEl);
  put();
}

/** A goal was just ticked: a checkpoint's latch, or the last one's chime. */
function afterGoal(res, index, owner = current) {
  if (!res) return;
  const top = owner === current && isDone(owner);
  if (top) sound.summit(); else sound.checkpoint();
  document.querySelectorAll(`.goal[data-lesson="${owner}"][data-goal="${index}"]`).forEach(g => {
    g.classList.add('just');
    setTimeout(() => g.classList.remove('just'), 750);
  });
  repaint();
  if (top) toEnd();
}

/** The lesson was just finished: the end card comes into view, unless it is far below (the outline says so). */
function toEnd() {
  const el = docEl && docEl.querySelector('.st-end');
  if (!el || !bodyEl || !bodyEl.clientHeight) return;
  const r = el.getBoundingClientRect(), b = bodyEl.getBoundingClientRect();
  if (r.top - b.bottom > bodyEl.clientHeight * 1.2) return;
  setTimeout(() => el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }), 380);
}

function navBar(l) {
  const seq = courseList();
  const i = seq.findIndex(x => x.id === l.id);
  const prev = seq[i - 1], next = seq[i + 1];
  const name = x => `${x.kind === 'tool' ? 'ref' : x.n} · ${x.title}`;
  const nav = document.createElement('nav');
  nav.className = 'stepnav';
  nav.setAttribute('aria-label', 'Previous and next stop');
  nav.innerHTML = `
    <button type="button" ${prev ? `data-go="${prev.id}"` : 'disabled'}>
      <span class="k">← previous</span><span class="v">${prev ? name(prev) : 'This is the first stop'}</span></button>
    <button type="button" class="nx" ${next ? `data-go="${next.id}"` : 'disabled'}>
      <span class="k">next →</span><span class="v">${next ? name(next) : 'End of the line, for now'}</span></button>`;
  nav.querySelectorAll('[data-go]').forEach(b => b.onclick = () => goStop(b.dataset.go));
  return nav;
}

/** Go to a stop the way the step nav does: reference sheets open the manual. */
function goStop(id) {
  const target = lessonById(id);
  if (target && target.kind === 'tool') openMan(target.id); else openLesson(id);
}

/* ── the steps: title block, step heads, here/seen/cleared ────────────────── */
let qObs = [], qHere = 0, qSeen = 0;
let holdUntil = 0, holdY = 0, holdFrame = 0;   // an explicit pick's hold on the step observer (holdPick)
let tipEl = null, tipFor = null;
/* Still (effects level 0) and the system's reduced motion both jump instead of gliding */
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.fx === '0';

function stopQuest() {
  qObs.forEach(o => o.disconnect());
  qObs = [];
  qHere = 0;
  qSeen = 0;
  holdUntil = 0;
  cancelAnimationFrame(holdFrame);
  hideTip();
}

/** The title block: the stop and its unit, the h1 (moved in from the intro), and what the lesson asks of you. */
function questHead(l, frag) {
  const head = document.createElement('header');
  head.className = 'quest-head';
  const k = document.createElement('div');
  k.innerHTML = kickerFor(l);
  head.appendChild(k.firstElementChild);
  const h1 = frag.querySelector('h1');
  if (h1) head.appendChild(h1);
  const n = (GOALS[l.id] || []).length;
  const meta = document.createElement('p');
  meta.className = 'qh-meta';
  meta.textContent = [n ? `${n} ${n === 1 ? 'checkpoint' : 'checkpoints'}` : 'no checkpoints', l.mins ? `about ${l.mins} minutes` : ''].filter(Boolean).join(' · ');
  head.appendChild(meta);
  return head;
}

/** Each step's quiet head over its h2: STEP, its number, what it asks (read, do, predict, build), and a tick once it is
 *  cleared. Decoration only: the h2 says the step, and is where a jump to the step puts the keyboard. */
function stepHeads(frag) {
  frag.querySelectorAll('.step').forEach(s => {
    const h2 = s.querySelector(':scope > h2');
    if (!h2 || s.dataset.step === '0') return;
    h2.tabIndex = -1;
    const sh = document.createElement('div');
    sh.className = 'st-sh';
    sh.setAttribute('aria-hidden', 'true');
    sh.innerHTML = `<span class="w">step</span><b>${p2(+s.dataset.step)}</b><span class="kd">${s.dataset.kind || 'read'}</span><i class="ok"></i>`;
    h2.before(sh);
  });
}

/* An explicit pick (a step in the outline or the bar, a checkpoint) owns the step for a moment. The observer's batch can be a few
   frames old, or describe the page while it is still settling, so entries computed inside the window are ignored
   and the pick cannot be undone behind the learner's back. When the window closes, a page that has scrolled
   since is read afresh from the layout, which is what the observer would have said. */
const HOLD_MS = 400, HOLD_MAX = 2500, STILL_FRAMES = 3, TOP_PX = 2;   // TOP_PX: the top of the page, where you are at the title (atTop)
/* A long jump glides for longer than HOLD_MS (about 1.2s from the foot of a long lesson back to its first step). The hold
   lasts while the page still moves, up to HOLD_MAX, so the steps the glide passes never take the lamp, or the outline's
   tab stop, on the way. The moving is counted in frames, not milliseconds: a glide moves the page every frame, however far
   apart a busy machine spaces them, so one long frame is not taken for a landing; STILL_FRAMES frames without a move are. */
function holdPick() {
  const t0 = performance.now();
  holdUntil = Infinity;
  holdY = bodyEl ? bodyEl.scrollTop : 0;
  cancelAnimationFrame(holdFrame);
  const release = () => {
    holdUntil = performance.now();
    if (!docEl || !bodyEl || !current || !bodyEl.clientHeight || Math.abs(bodyEl.scrollTop - holdY) < 3) return;
    if (bodyEl.scrollTop <= TOP_PX) { if (qHere !== 0) markHere(0); return; }       // back at the top: the title (atTop)
    const line = bodyEl.getBoundingClientRect().top + bodyEl.clientHeight * 0.35;   // the reading line
    let n = null;
    docEl.querySelectorAll('.step').forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.top <= line && r.bottom >= line) n = +s.dataset.step;
    });
    if (n !== null && n !== qHere) markHere(n);
  };
  let y = holdY, still = 0;
  const watch = () => {
    const at = bodyEl ? bodyEl.scrollTop : 0, age = performance.now() - t0;
    still = Math.abs(at - y) < 0.5 ? still + 1 : 0;
    y = at;
    if (age < HOLD_MAX && (age < HOLD_MS || still < STILL_FRAMES)) holdFrame = requestAnimationFrame(watch);   // still gliding
    else release();
  };
  holdFrame = requestAnimationFrame(watch);
}

/* The observer only hears a step cross the reading line. When the intro is shorter than the line is low, the title never
   reaches it, so on the way back up nothing crosses it and the lamp would stay on the step you left. At the top of the
   page you are at the title. */
function atTop() {
  if (!docEl || !bodyEl || !current || bodyEl.scrollTop > TOP_PX || qHere === 0 || performance.now() < holdUntil) return;
  markHere(0);
}

/** Go to a step (a step in the outline or the bar): its head at the top of the page, the keyboard on its h2.
 *  Step 0 is the title block: the page goes back to the top. */
export function goStep(n) {
  if (!docEl) return;
  const s = docEl.querySelector(`.step[data-step="${n}"]`);
  if (!s) return;
  holdPick();
  if (+n === 0 && bodyEl) bodyEl.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
  else s.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  markHere(+n);
  const h = s.querySelector('h2');
  if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
}

/** The checkpoints on the page, in page order: [{ goal, el, title, done }]. A warm-up drawn from another stop is not one. */
export function checkpoints() {
  if (!docEl || !current) return [];
  const goals = GOALS[current] || [], have = goalsOf(current), seen = new Set(), out = [];
  docEl.querySelectorAll('[data-cp]').forEach(el => {
    if (el.closest('[data-lead]')) return;
    const g = +el.dataset.cp;
    if (seen.has(g) || !goals[g]) return;
    seen.add(g);
    out.push({ goal: g, el, title: plain(goals[g].t), done: have.includes(g) });
  });
  return out;
}

/** Go to a checkpoint (in the outline, or a button on the end card): centred, the keyboard on its first open control. */
export function goCheckpoint(goal) {
  const c = checkpoints().find(x => x.goal === +goal);
  if (!c) return false;
  const el = c.el, s = el.closest('.step');
  holdPick();
  el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
  if (s) markHere(+s.dataset.step);
  const ctl = el.querySelector('.checks li[aria-checked="false"]') || el.querySelector('.again:not([hidden])')
    || el.querySelector('.opts button:not(:disabled)') || el.querySelector('.checks li');
  if (ctl) ctl.focus({ preventScroll: true });
  else { el.tabIndex = -1; el.focus({ preventScroll: true }); }
  return true;
}

function markHere(n) {
  qHere = n;
  qSeen = Math.max(qSeen, n);
  paintQuest();
}

/** A step is cleared when its runbooks are done and its probes answered
 *  rightly; a read step (or one with nothing to tick) clears when seen. */
function stepCleared(s, n) {
  if (s.hasAttribute('data-optional')) return false;   // optional practice: nothing checks it, so it is never marked done
  const books = [...s.querySelectorAll('.runbook')];
  const probes = [...s.querySelectorAll('.probe')];
  if (s.dataset.kind === 'read' || !(books.length || probes.length)) return n <= qSeen;
  return books.every(b => b.classList.contains('done'))
    && probes.every(p => {
      const v = p.querySelector('.verdict');
      return !!v && !v.hidden && !p.classList.contains('missed');
    });
}

function paintQuest() {
  if (!docEl || !current) return;
  docEl.querySelectorAll('.step').forEach(s => {
    const n = +s.dataset.step;
    s.classList.toggle('here', n === qHere);
    s.classList.toggle('cleared', stepCleared(s, n));
  });
  paintBench();
  notifyQuest();
}

function startQuest() {
  const steps = [...docEl.querySelectorAll('.step')];
  if ('IntersectionObserver' in window && steps.length) {
    // the reading line sits about 35% down the scroll root
    const io = new IntersectionObserver(es => {
      let pick = null;
      es.forEach(e => { if (e.isIntersecting && e.time >= holdUntil) pick = +e.target.dataset.step; });
      if (pick !== null) markHere(pick);
    }, { root: bodyEl, rootMargin: '-35% 0px -64% 0px' });
    steps.forEach(s => io.observe(s));
    qObs.push(io);
  }
  paintQuest();
}

/* ── the end card ─────────────────────────────────────────────────────────── */
let summitKey = '';

function endCard() {
  const el = document.createElement('section');
  el.className = 'st-end';
  el.setAttribute('aria-label', 'The end of the lesson');
  el.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.act === 'desk') { el.dispatchEvent(new CustomEvent('study:desk', { bubbles: true })); return; }
    if (b.dataset.act === 'next' && b.dataset.go) { sound.event({ type: 'ui' }); openLesson(b.dataset.go); return; }
    if (b.dataset.cp !== undefined) goCheckpoint(+b.dataset.cp);
  });
  return el;
}

/** Done: how far, how long tonight, the next lesson, the way back to the desk, what the sign will say.
 *  Not yet: what is left, one button each. */
function paintEnd() {
  const el = docEl && current ? docEl.querySelector('.st-end') : null;
  if (!el) return;
  const l = lessonById(current);
  const goals = GOALS[current] || [], have = goalsOf(current), N = goals.length;
  const cps = checkpoints();
  const open = cps.filter(c => !c.done);
  const done = isDone(current) || (N > 0 && have.length >= N) || (!N && !cps.length);
  const d = clockNow(), mins = Math.round(tonight(d) / 60), when = isNight(d) ? 'tonight' : 'today';
  const sign = done ? signAfter(current) : null;
  const seq = writtenLessons(), at = seq.findIndex(x => x.id === current), next = at >= 0 ? seq[at + 1] : null;
  const key = [current, have.join(','), N, done, mins, when, sign ? sign.text : '', open.map(c => c.goal).join(','), next ? next.id : ''].join('|');
  if (key === summitKey) return;
  summitKey = key;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const k = [`end of ${l ? l.n : 'the lesson'}`, N ? `${have.length} of ${N} checkpoints` : '', `${mins} min ${when}`].filter(Boolean).join(' · ');
  el.classList.toggle('done', done);
  if (done) {
    el.innerHTML = `<p class="st-k">${esc(k)}</p>
      <p class="big">That’s the lesson.</p>
      <div class="st-go">${next
    ? `<button type="button" class="go" data-act="next" data-go="${esc(next.id)}"><span class="n">next · ${esc(next.n)}</span><span class="t">${esc(next.title)}</span><span class="ar" aria-hidden="true">→</span></button>`
    : ''}<button type="button" class="go ghost" data-act="desk">Back to the desk</button></div>
      ${sign ? `<p class="st-next">The sign will show <b>${esc(sign.text)}</b></p>` : ''}`;
  } else {
    const left = N - have.length;
    el.innerHTML = `<p class="st-k">${esc(k)}</p>
      <p class="big">${left} ${left === 1 ? 'checkpoint' : 'checkpoints'} to go.</p>
      <div class="st-open">${open.map(c => {
    const i = cps.indexOf(c) + 1;
    return `<button type="button" class="go" data-cp="${c.goal}"><span class="n">checkpoint ${i}</span><span class="t">${esc(c.title)}</span></button>`;
  }).join('')}</div>
      <div class="st-go"><button type="button" class="go ghost" data-act="desk">Back to the desk</button></div>`;
  }
}

/* ── the scripts drawer: it follows the step you are reading ─────────────── */
let scripts = [];          // { k, step, raw, node, out, lines } for every stage script
let active = 0, benchKey = '', shownSig = '', lastStep = '', mirrorSrc = null;

/** The lesson's own scripts (not the probes', the solutions' or the runbooks'): numbered for the workbench. */
function markScripts() {
  const figs = [...docEl.querySelectorAll('figure.code')]
    .filter(f => f.dataset.lang === 'luau' && !f.closest('.probe, .solution, .runbook'));
  figs.forEach((fig, k) => {
    const step = fig.closest('.step');
    const stepN = step ? +step.dataset.step : 0;
    const cap = fig.querySelector('.code-head .cap');
    if (cap && !cap.textContent.trim()) cap.textContent = 'script';
    const raw = [...fig.querySelectorAll('.cl .tx')].map(t => t.textContent).join('\n');
    const next = fig.nextElementSibling;
    const outEl = next && next.classList.contains('out') ? next : null;
    const lines = fig.querySelectorAll('.cl').length;
    // clones are taken before anything else touches the page, so the bench gets the full well
    scripts.push({ k, step: stepN, raw, node: fig.cloneNode(true), out: outEl ? outEl.cloneNode(true) : null, lines });
    fig.dataset.script = String(k);
    if (outEl) outEl.dataset.outFor = String(k);
  });
}

/** The follow rule: this step's scripts, else the nearest earlier step's. */
function follow() {
  const byStep = n => scripts.filter(s => s.step === n);
  let src = qHere;
  while (src >= 0 && !byStep(src).length) src--;
  const list = src >= 0 ? byStep(src) : [];
  return { src: list.length ? src : null, list, borrowed: list.length > 0 && src !== qHere };
}

async function copyScript(raw, btn) {
  const was = btn.textContent;
  try {
    await navigator.clipboard.writeText(raw);
    btn.textContent = 'copied';
    btn.classList.add('did');
    sound.tick();
  } catch (_) {
    const code = btn.closest('.code').querySelector('code');
    const r = document.createRange();
    r.selectNodeContents(code);
    const sel = getSelection();
    sel.removeAllRanges(); sel.addRange(r);
    btn.textContent = `selected — press ${isMac() ? '⌘C' : 'Ctrl+C'}`;
    btn.classList.add('did');
  }
  setTimeout(() => { btn.textContent = was; btn.classList.remove('did'); }, 1800);
}

function benchNode(s) {
  const n = s.node.cloneNode(true);
  const b = n.querySelector('.copy');
  if (b) b.onclick = () => copyScript(s.raw, b);
  n.querySelectorAll('.cl.has-note').forEach(c => c.removeAttribute('tabindex'));
  return n;
}

/** One frame of .wb-swap on the bench: CSS crossfades the three panes. */
function swapFlash() {
  if (!bench) return;
  bench.root.classList.add('wb-swap');
  requestAnimationFrame(() => requestAnimationFrame(() => bench.root.classList.remove('wb-swap')));
}

/** The live runbook mirror: same state, same functions — a click here clicks
 *  the stage's own checkbox, so ticking in either place updates both. */
function syncTask() {
  if (!bench) return;
  const stepEl = current && docEl ? docEl.querySelector(`.step[data-step="${qHere}"]`) : null;
  const orig = stepEl ? stepEl.querySelector('.runbook') : null;
  const cur = bench.task.firstElementChild;
  if (!orig) { bench.task.replaceChildren(); bench.task.hidden = true; mirrorSrc = null; return; }
  bench.task.hidden = false;
  if (cur && mirrorSrc === orig) {
    const o = [...orig.querySelectorAll('.checks li')], m = [...cur.querySelectorAll('.checks li')];
    o.forEach((li, i) => { if (m[i]) m[i].setAttribute('aria-checked', li.getAttribute('aria-checked')); });
    const oh = orig.querySelector('.hint'), mh = cur.querySelector('.hint');
    if (oh && mh) { mh.textContent = oh.textContent; mh.className = oh.className; }
    const ob = orig.querySelector('.meter > i'), mb = cur.querySelector('.meter > i');
    if (ob && mb) mb.style.width = ob.style.width;
    cur.classList.toggle('done', orig.classList.contains('done'));
    return;
  }
  const clone = orig.cloneNode(true);
  clone.removeAttribute('data-cp');           // the mirror is not a second checkpoint
  const o = [...orig.querySelectorAll('.checks li')];
  [...clone.querySelectorAll('.checks li')].forEach((li, i) => {
    li.onclick = () => o[i] && o[i].click();
    li.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); o[i] && o[i].click(); } };
  });
  mirrorSrc = orig;
  bench.task.replaceChildren(clone);
}

/** Repaint the workbench for the followed step. */
function paintBench() {
  if (!bench || !docEl) return;
  const stepEl = current ? docEl.querySelector(`.step[data-step="${qHere}"]`) : null;
  const f = follow();
  const stepKey = `${current}|${qHere}`;
  if (stepKey !== lastStep) { if (lastStep) swapFlash(); lastStep = stepKey; }
  const srcKey = `${current}|${f.src}`;
  if (srcKey !== benchKey) { benchKey = srcKey; active = 0; }
  if (active >= f.list.length) active = 0;
  const s = f.list[active] || null;

  const kind = stepEl ? stepEl.dataset.kind : '';
  const h2 = stepEl ? stepEl.querySelector('h2') : null;
  bench.step.textContent = !stepEl ? '' : qHere === 0 ? 'INTRO · READ' : `STEP ${p2(qHere)} · ${kind.toUpperCase()}`;
  if (bench.title) bench.title.textContent = !stepEl ? '' : qHere === 0 ? (lessonById(current) || {}).title || '' : h2 ? h2.textContent.trim() : '';
  bench.src.textContent = f.borrowed ? `from step ${p2(f.src)}` : '';
  bench.src.hidden = !f.borrowed;

  const none = !f.list.length;
  const sig = `${srcKey}|${active}`;
  if (sig !== shownSig) {
    shownSig = sig;
    bench.tabs.replaceChildren(...f.list.map((x, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wb-tab';
      b.setAttribute('role', 'tab');
      b.dataset.i = String(i);
      b.setAttribute('aria-selected', String(i === active));
      b.textContent = `script ${x.k + 1}`;
      b.onclick = () => { active = i; paintBench(); };
      return b;
    }));
    bench.code.replaceChildren(...(s ? [benchNode(s)] : []));
    bench.out.replaceChildren(...(s && s.out ? [s.out.cloneNode(true)] : []));
  }
  bench.tabs.hidden = f.list.length < 2;      // one script needs no tab
  bench.code.hidden = none;
  bench.out.hidden = none || !(s && s.out);
  bench.empty.hidden = !none;
  bench.empty.textContent = !current ? '' : scripts.length
    ? 'No code yet. It shows up here as you reach it.'
    : 'This stop has no code to type.';
  syncTask();
}

/** What the tests read about the workbench. */
export function benchState() {
  const f = follow();
  const stepEl = current && docEl ? docEl.querySelector(`.step[data-step="${qHere}"]`) : null;
  return {
    lesson: current,
    step: current ? qHere : null,
    kind: stepEl ? stepEl.dataset.kind : null,
    scripts: f.list.length,
    script: f.list.length ? active : -1,
    borrowed: f.borrowed,
  };
}

/* ── glossary tooltip ─────────────────────────────────────────────────────── */
function showTip(term) {
  const name = term.dataset.g;
  const text = Object.hasOwn(GLOSSARY, name) ? GLOSSARY[name] : '';
  if (!text || tipFor === term) return;
  hideTip();
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'g-tip';
    tipEl.id = 'g-tip';
    tipEl.setAttribute('role', 'tooltip');
    tipEl.style.display = 'none';
    tipEl.style.position = 'fixed';
    document.body.appendChild(tipEl);
  }
  const b = document.createElement('b');
  b.className = 'gt-n';
  b.textContent = name;
  const d = document.createElement('span');
  d.className = 'g-d';
  d.textContent = text;
  tipEl.replaceChildren(b, document.createTextNode(' '), d);
  tipEl.style.display = 'block';
  const r = term.getBoundingClientRect();
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  const left = Math.min(Math.max(8, r.left), Math.max(8, innerWidth - w - 8));
  let top = r.bottom + 8;
  if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 8);
  tipEl.style.left = left + 'px';
  tipEl.style.top = top + 'px';
  // the native title would double the tooltip, so park it while ours shows
  if (term.title) { term.dataset.gt = term.title; term.removeAttribute('title'); }
  term.setAttribute('aria-describedby', 'g-tip');
  tipFor = term;
}

function hideTip() {
  if (tipEl) tipEl.style.display = 'none';
  if (tipFor) {
    tipFor.removeAttribute('aria-describedby');
    if (tipFor.dataset.gt) { tipFor.title = tipFor.dataset.gt; delete tipFor.dataset.gt; }
    tipFor = null;
  }
}

function wireGlossary(el) {
  const termOf = e => (e.target && e.target.closest ? e.target.closest('.g-term') : null);
  el.addEventListener('pointerover', e => { const t = termOf(e); if (t) showTip(t); });
  el.addEventListener('pointerout', e => {
    const t = termOf(e);
    if (t && !(e.relatedTarget && t.contains(e.relatedTarget))) hideTip();
  });
  el.addEventListener('focusin', e => { const t = termOf(e); if (t) showTip(t); });
  el.addEventListener('focusout', e => { if (termOf(e)) hideTip(); });
}

/* ── opening ──────────────────────────────────────────────────────────────── */
/** One lesson at a time: opening one replaces the one that was open (its place is kept). */
export function openLesson(id, { focus = true, probe = '' } = {}) {
  const l = lessonById(id);
  if (!l) return null;
  state.last = id;
  save();
  const wasOpen = current === id;
  opening = id;
  try { goWorkspace(2, { silent: true }); } finally { opening = ''; }
  wantLesson = id; wantProbe = probe;       // after the switch, which can open the first stop on its own and would clear them
  render(id);
  /* the keyboard goes with the lesson: PageDown, Space, the arrows, Home and End turn it at once */
  if (focus && bodyEl && !(probe && docEl && docEl.contains(document.activeElement))) bodyEl.focus({ preventScroll: true });   // unless the probe that N to revisit asked for has taken it
  if (!wasOpen) {
    log('dim', `[ > ] ${l.g ? `unit-${l.g.replace('g', '')}` : 'line'} · ${l.n} ${l.title}`);
    announce(`${l.n} ${l.title} opened.`);
    if (location.hash !== '#/' + id) history.replaceState(null, '', '#/' + id);
  }
  return l;
}

/** `[` and `]`: walk the written line, skipping the reference sheets. */
export function lessonNav(dir) {
  const seq = writtenLessons();
  const here = current ? seq.findIndex(l => l.id === current) : -1;
  const i = here === -1 ? (dir > 0 ? 0 : seq.length - 1) : here + dir;
  const l = seq[(i + seq.length) % seq.length];
  if (!l) return;
  openLesson(l.id);
}

/** Draw the open lesson again. `fresh` is for a page thrown away on purpose (progress cleared or imported): its place is not written back. */
export function paintSessions(fresh = false) {
  if (!current) return;
  if (fresh) { clearTimeout(saveTimer); skipSave = true; }
  try { render(current); } finally { skipSave = false; }
}

/* ── the study hands its elements over ────────────────────────────────────── */
let attached = false;

/** study.js: { docEl, bodyEl (#st-scroll), bench: { root, step, title, src, tabs, code, out, task, empty } }. */
export function attachSession(els) {
  docEl = els.docEl; bodyEl = els.bodyEl; bench = els.bench || null;
  if (!attached) {
    attached = true;
    wireGlossary(docEl);
    if (bench) wireGlossary(bench.code);
    bodyEl.addEventListener('scroll', hideTip, { passive: true });
    bodyEl.addEventListener('scroll', () => atTop(), { passive: true });
    /* the place: a quiet save after the scroll settles, at once after a probe answer, and when the page goes away */
    bodyEl.addEventListener('scroll', () => queueSave(), { passive: true });
    docEl.addEventListener('click', e => { if (e.target.closest('.probe .opts button, .probe .again')) queueSave(0); });
    addEventListener('pagehide', savePlace);
    document.addEventListener('visibilitychange', () => { if (document.hidden) savePlace(); });
    /* nothing has the keys (a cold load, a closed launcher): the reading keys still turn the page */
    document.addEventListener('keydown', e => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !bodyEl || !current || activeWs() !== 2) return;
      if (document.body.classList.contains('booting')) return;       // the key that skips the boot flash must not also turn the page behind it
      const a = document.activeElement;
      if (a && a !== document.body && a !== document.documentElement) return;
      const course = document.querySelector('#study .st-course');     // the course list is up: it owns the keys
      if (course && !course.hidden) return;
      const pg = bodyEl.clientHeight * .9;
      const by = { PageDown: pg, PageUp: -pg, ' ': e.shiftKey ? -pg : pg, ArrowDown: 56, ArrowUp: -56 }[e.key];
      if (by === undefined && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      bodyEl.scrollTop = e.key === 'Home' ? 0 : e.key === 'End' ? bodyEl.scrollHeight : bodyEl.scrollTop + by;
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && tipFor) hideTip(); });

    /* ticking in the stage updates the workbench's mirror of the runbook */
    docEl.addEventListener('click', e => { if (e.target.closest('.runbook')) syncTask(); });
    docEl.addEventListener('keydown', e => {
      if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('.runbook')) syncTask();
    });

    /* progress ticked anywhere (runbook, probe, goals window) repaints these; the minutes tonight repaint the end card */
    onPaint(() => { paintQuest(); syncTask(); paintEnd(); });
    onNights(() => paintEnd());
  }
  render(current);
}

/** Used at boot: open whatever the URL asked for, or the next unfinished stop. */
export function openFirstSession() {
  if (opening) return lessonById(opening);   // openLesson is already bringing one in
  const wanted = location.hash.replace('#/', '');
  const fromHash = lessonById(wanted);
  const fromLast = lessonById(state.last);
  const next = writtenLessons().find(l => !isDone(l.id)) || writtenLessons()[0];
  const pick = (fromHash && fromHash.kind === 'lesson' && !fromHash.soon) ? fromHash
    : (fromLast && fromLast.kind === 'lesson' && !fromLast.soon) ? fromLast
      : next;
  if (pick) openLesson(pick.id, { focus: false });
  return pick;
}

/* ── the window ───────────────────────────────────────────────────────────────
   The lesson lives in the study now. The definition stays registered because
   other code imports it, but wm.js redirects openWindow('session') to the
   study, so it never builds or appears. */
export const sessionWindow = defineWindow({
  id: 'session',
  title: 'Session',
  tag: '',
  icon: 'session',
  ws: 2,
  after: 'course',
  weight: 2.7,
  build(body) {
    body.innerHTML = '<p class="hint">The lesson now lives in the study, on workspace 2.</p>';
    return {};
  },
});

export const sessionWindowId = () => 'session';
