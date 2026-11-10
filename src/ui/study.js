/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/STUDY
   Workspace 2 is the study: late at night in the cab, one lesson at a time on
   one big pane of glass, the city faint behind it and one warm lamp. Agreed
   in moodboard/v10-study/BUILD.md.

     the reading pane  in the middle: the lesson's steps and checkpoints down
                       its left edge (the outline; the lamp glides to the step
                       you are reading), the lesson beside them;
     the scripts       a drawer that slides out on the right when you want it
                       (the button in the pane's head, or S): this step's
                       script, what it prints, and the runbook;
     the bar           the cab's slim bar (bar.js); its middle is this
                       lesson's steps, as words you can click;
     the margins       rain at night, a few drops late, snow on Ice, in the
                       city around the glass, never on it (ui/margins.js).

   Built once. session.js owns the lesson (its body, its place, its scripts);
   this file builds the panes, keeps the outline and the bar's words in step
   with the page, slides the drawer, and runs the course overlay (/).
   ════════════════════════════════════════════════════════════════════════════ */

import { GOALS, lessonById, writtenLessons } from '../data/course.js';
import { goalsOf, isDone, save, state } from '../core/state.js';
import { activeWs, focusedId, goWorkspace, menuOpen, onWM, redirectWindow } from '../core/wm.js';
import { onFx } from '../core/effects.js';
import { sound } from '../core/sound.js';
import { overlayOpen } from '../core/keys.js';
import { goalSeconds, hm, isNight, onNights, tonight } from '../core/nights.js';
import { escAttr as esc, icon, onPaint } from './window.js';
import {
  attachSession, benchState, checkpoints, currentLessonId, goCheckpoint, goStep, onLesson, onQuest, openFirstSession,
  openLesson, setSessionClock, stepHere,
} from './session.js';
import { onCourseOverlay, paintCourseInto, unfoldUnit } from './course.js';
import { deskNow, motionNow, reducedOS, sceneNow } from './desktop.js';
import { lendBarMiddle, repaintBarMiddle } from './bar.js';
import { Margins } from './margins.js';

const p2 = n => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const booting = () => document.body.classList.contains('booting');
const still = () => motionNow() === 'still' || reducedOS();

let root = null, overlay = null, courseOpen = false, courseFrom = null;
let els = {};
let margins = null;
let lastWs = 0, minute = '', outlineKey = '', lampTimer = 0, litTimer = 0, arriveTimer = 0;
let drawer = !!state.scripts;            // the scripts are out (kept across visits)
const geo = { sw: 0, sh: 0, g: 14, pw: 0, bw: 0, px: 0, pxOpen: 0, bx: 0, mode: 'side', outline: true };
const q = sel => root && root.querySelector(sel);

/* ── the skeleton ─────────────────────────────────────────────────────────── */
function skeleton() {
  return `
  <div class="rd-world" aria-hidden="true">
    <canvas class="cl-wx"></canvas>
    <canvas class="cl-frost"></canvas>
  </div>
  <div class="rd-stage">
    <div class="rd-read glass">
      <header class="rd-head">
        <div class="rd-where"><b class="rd-n"></b><span class="rd-t"></span></div>
        <span class="rd-cp" aria-live="off"></span>
        <button type="button" class="rd-sbtn" aria-expanded="false" aria-controls="rd-bench" title="The scripts beside the page (S)">
          <i class="rd-ico" aria-hidden="true"></i><span>scripts</span><kbd aria-hidden="true">s</kbd>
        </button>
      </header>
      <div class="rd-body">
        <nav class="rd-outline" aria-label="Steps and checkpoints">
          <div class="ro-list">
            <i class="ro-lamp" aria-hidden="true"></i>
            <button type="button" class="ro-title" data-step="0" tabindex="-1"><span class="n"></span><span class="t"></span></button>
            <ol class="ro-steps"></ol>
          </div>
          <div class="ro-foot">
            <div class="ro-tonight" role="img"><span class="k"></span><b></b><span class="bar"><i></i></span></div>
            <div class="ro-nav">
              <button type="button" class="ro-prev" data-dir="-1"></button>
              <button type="button" class="ro-next" data-dir="1"></button>
            </div>
            <button type="button" class="ro-course" aria-expanded="false" aria-haspopup="dialog" title="The whole course (/)"><span>the course</span><kbd aria-hidden="true">/</kbd></button>
          </div>
        </nav>
        <div class="st-scroll" id="st-scroll" tabindex="0" role="document" aria-label="Lesson"><div class="doc"></div></div>
      </div>
    </div>
    <aside class="rd-bench st-bench glass" id="rd-bench" aria-label="Scripts" inert>
      <header class="wb-head">
        <span class="wb-step"></span><span class="wb-src" hidden></span>
        <button type="button" class="wb-x" title="Put the scripts away (S or Esc)"><span class="sr-only">Put the scripts away</span><span aria-hidden="true">esc</span></button>
        <span class="wb-title"></span>
      </header>
      <div class="wb-tabs" role="tablist" aria-label="Scripts in this step"></div>
      <div class="wb-code" role="tabpanel"></div>
      <div class="wb-out"></div>
      <button class="wb-sum" type="button" hidden aria-expanded="false" aria-controls="wb-task"><i class="c" aria-hidden="true"></i><span class="k">runbook</span><span class="n"></span></button>
      <div class="wb-task" id="wb-task"></div>
      <div class="wb-empty" hidden></div>
    </aside>
  </div>
  <div class="st-course" hidden role="dialog" aria-label="The course">
    <div class="stc-box glass">
      <div class="stc-head">
        <label class="course-search">
          ${icon('search')}
          <input id="st-course-q" type="text" spellcheck="false" autocomplete="off" aria-label="Search the course" placeholder="search the course">
          <kbd>/</kbd>
        </label>
        <button class="stc-x" type="button" aria-label="Esc: close the course">esc</button>
      </div>
      <div class="course-list" id="st-course-list" role="group" aria-label="Stops on the line" tabindex="-1"></div>
      <div class="course-foot" id="st-course-foot"></div>
    </div>
  </div>`;
}

/* ── the scripts drawer: the runbook mirror folds when it would squeeze the code ── */
const MIN_CODE = 200;      // px of code well worth keeping beside the runbook
/** The code well fades its right edge while a line runs on past it. JS only flips .fade-r and says where the text area sits
 *  (below the head, inside the 2px focus ring, clear of the scrollbars); the fade itself is static CSS. */
function edgeFade(pre) {
  const fig = pre && pre.parentElement;
  if (!fig) return;
  fig.classList.toggle('fade-r', pre.scrollLeft + pre.clientWidth < pre.scrollWidth - 1);
  fig.style.setProperty('--edge-inset', `${pre.offsetTop + 2}px ${Math.max(2, pre.offsetWidth - pre.clientWidth)}px ${Math.max(2, pre.offsetHeight - pre.clientHeight)}px auto`);
}
function wireFold({ root: b, task, out, tabs, code }) {
  const sum = q('.wb-sum'), head = q('.wb-head'), n = sum.querySelector('.n');
  let open = false, held = null;
  /* "would the code well be under MIN_CODE with the runbook open?" is answered from the layout, so it cannot flicker */
  const fit = () => {
    const pre = code.querySelector('pre');   // a code well that scrolls sideways has to be reachable by keyboard
    if (pre && !pre.hasAttribute('tabindex')) { pre.tabIndex = 0; pre.setAttribute('role', 'region'); pre.setAttribute('aria-label', 'Script code'); }
    edgeFade(pre);
    const has = !task.hidden && !!task.firstElementChild;
    if (sum.hidden === has) sum.hidden = !has;
    if (task.firstElementChild !== held) { held = task.firstElementChild; open = false; }   // a new runbook starts folded
    if (!has || code.hidden || !b.clientHeight) { b.classList.remove('wb-tight', 'wb-open'); return; }
    const room = b.clientHeight;
    const chrome = head.offsetHeight + tabs.offsetHeight + (out.offsetHeight ? out.offsetHeight + 12 : 0) + 56;
    const tight = room - chrome - task.scrollHeight - 16 < MIN_CODE;
    b.classList.toggle('wb-tight', tight);
    b.classList.toggle('wb-open', tight && open);
    sum.setAttribute('aria-expanded', String(tight && open));
    const h = task.querySelector('.hint');
    if (h && n.textContent !== h.textContent) n.textContent = h.textContent;
  };
  const mo = new MutationObserver(fit);
  mo.observe(task, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
  for (const el of [out, tabs]) mo.observe(el, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  mo.observe(code, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  new ResizeObserver(fit).observe(b);
  new ResizeObserver(() => edgeFade(code.querySelector('pre'))).observe(code);
  code.addEventListener('scroll', e => { if (e.target.tagName === 'PRE') edgeFade(e.target); }, true);   // scroll does not bubble, so capture it
  sum.onclick = () => { open = !open; fit(); };
}

/** Out or away. The pane glides aside as the drawer slides in (both on transforms, so nothing reflows on the way). */
function setDrawer(on, { save: keep = true, focus = false } = {}) {
  on = !!on;
  const was = drawer;
  drawer = on;
  if (keep && state.scripts !== on) { state.scripts = on; save(); }
  root.classList.toggle('bench-out', on);
  els.bench.inert = !on;
  els.sbtn.setAttribute('aria-expanded', String(on));
  els.sbtn.classList.toggle('on', on);
  if (was !== on) sound.event({ type: 'ui' });
  if (!on && els.bench.contains(document.activeElement)) els.sbtn.focus({ preventScroll: true });
  if (on && focus) {
    const t = els.bench.querySelector('.wb-tab[aria-selected="true"]') || els.bench.querySelector('.wb-code pre') || els.bench.querySelector('.wb-x');
    if (t) setTimeout(() => t.focus({ preventScroll: true }), still() ? 0 : 60);
  }
  holeLater();
}

/* ── the layout: the pane in the middle, the drawer beside it (or over it, on a narrow screen) ── */
function layout() {
  if (!root) return;
  const sw = root.clientWidth, sh = root.clientHeight;
  if (!sw || !sh) return;
  const g = sw < 900 ? 10 : 14;
  const bw = Math.round(clamp(sw * .28, 360, 440));
  let mode = 'side', pw = Math.min(1040, sw - 3 * g - bw);
  if (pw < 760) { mode = 'over'; pw = Math.min(1040, sw - 2 * g); }
  pw = Math.round(pw);
  const px = Math.round((sw - pw) / 2);
  const group = pw + g + bw;
  const pxOpen = mode === 'side' ? Math.round(Math.max(g, (sw - group) / 2)) : px;
  const bx = mode === 'side' ? pxOpen + pw + g : sw - g - Math.min(bw, sw - 2 * g);
  const outline = pw >= 720;
  Object.assign(geo, { sw, sh, g, pw, bw: Math.min(bw, sw - 2 * g), px, pxOpen, bx, mode, outline });
  const s = root.style;
  s.setProperty('--g', `${g}px`);
  s.setProperty('--pw', `${pw}px`);
  s.setProperty('--bench-w', `${geo.bw}px`);   // not --bw: that is the border width every rule shares (00-tokens.css)
  s.setProperty('--px', `${px}px`);
  s.setProperty('--px-open', `${pxOpen}px`);
  s.setProperty('--bx', `${bx}px`);
  s.setProperty('--ow', `${pw >= 940 ? 236 : 204}px`);
  root.classList.toggle('bench-over', mode === 'over');
  root.classList.toggle('no-outline', !outline);
  hole();
  placeLamp(true);
}

/** The weather keeps out of the panes: the reading pane, and the drawer when it is out. */
function hole() {
  if (!margins || !geo.sw) return;
  const x0 = drawer ? Math.min(geo.pxOpen, geo.bx) : geo.px;
  const x1 = drawer ? Math.max(geo.pxOpen + geo.pw, geo.bx + geo.bw) : geo.px + geo.pw;
  margins.layout({ vw: geo.sw, vh: geo.sh, hole: { x0, y0: geo.g, x1, y1: geo.sh - geo.g }, feather: 36 });
}
let holeTimer = 0;
const holeLater = () => { clearTimeout(holeTimer); holeTimer = setTimeout(hole, still() ? 0 : 280); };

/* ── the outline: this lesson's steps, its checkpoints under them, the lamp on the one you are reading ── */
function stepsOf() {
  if (!els.doc || !currentLessonId()) return [];
  const cps = checkpoints();
  const out = [];
  els.doc.querySelectorAll('.step[data-step]').forEach(s => {
    const n = +s.dataset.step;
    if (!n) return;
    const h2 = s.querySelector(':scope > h2');
    out.push({
      n, title: h2 ? h2.textContent.trim() : `Step ${n}`, kind: s.dataset.kind || 'read',
      cleared: s.classList.contains('cleared'), optional: s.hasAttribute('data-optional'), cps: [],
    });
  });
  cps.forEach((c, i) => {
    const s = c.el.closest('.step');
    const st = s ? out.find(x => x.n === +s.dataset.step) : null;
    if (st) st.cps.push({ goal: c.goal, title: c.title, done: c.done, i: i + 1 });
  });
  return out;
}

function paintOutline() {
  if (!root) return;
  const id = currentLessonId(), l = id ? lessonById(id) : null;
  const here = stepHere();
  const steps = stepsOf();
  const N = l ? (GOALS[id] || []).length : 0, have = l ? goalsOf(id).length : 0;
  /* the pane's head: where you are, how far */
  els.n.textContent = l ? l.n : '';
  els.t.textContent = l ? l.title : 'No lesson open';
  els.cp.textContent = !l || l.soon ? '' : !N ? 'no checkpoints' : isDone(id) || have >= N ? `all ${N} checkpoints` : `checkpoint ${Math.min(N, have + 1)} of ${N}`;
  const key = `${id}|${steps.map(s => `${s.n}:${s.title}:${s.cleared ? 1 : 0}:${s.cps.map(c => `${c.goal}${c.done ? '+' : '-'}`).join('')}`).join(',')}`;
  if (key !== outlineKey) {
    outlineKey = key;
    const held = heldOutline();
    els.title.querySelector('.n').textContent = l ? l.n : '';
    els.title.querySelector('.t').textContent = l ? l.title : '';
    els.title.title = l ? `${l.n} ${l.title}: back to the top` : '';
    els.title.hidden = !l;
    els.steps.innerHTML = steps.map(s => `
      <li class="ro-s${s.cleared ? ' cleared' : ''}" data-step="${s.n}">
        <button type="button" class="ro-step" data-step="${s.n}" tabindex="-1" aria-label="Step ${s.n}: ${esc(s.title)}${s.optional ? ', optional' : ''}${s.cleared ? ', done' : ''}"><span class="n">${p2(s.n)}</span><span class="t">${esc(s.title)}</span><i class="ok" aria-hidden="true"></i></button>
        ${s.cps.length ? `<ul class="ro-cps">${s.cps.map(c => `<li><button type="button" class="ro-cp${c.done ? ' done' : ''}" data-goal="${c.goal}" tabindex="-1" aria-label="Checkpoint ${c.i}: ${esc(c.title)}${c.done ? ', reached' : ''}"><i class="m" aria-hidden="true"></i><span class="t">${esc(c.title)}</span></button></li>`).join('')}</ul>` : ''}
      </li>`).join('');
    if (held) {
      const again = els.outline.querySelector(held);
      if (again) again.focus({ preventScroll: true });
    }
  }
  /* the one you are reading */
  if (here === 0) els.title.setAttribute('aria-current', 'step'); else els.title.removeAttribute('aria-current');
  els.steps.querySelectorAll('.ro-step').forEach(b => {
    const on = +b.dataset.step === here;
    if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    b.parentElement.classList.toggle('here', on);
  });
  roveHome();
  paintNav(l);
  placeLamp();
  repaintBarMiddle();
}

/** A selector that finds the focused control in the outline again once it has repainted. */
function heldOutline() {
  const a = document.activeElement;
  if (!a || !els.outline.contains(a)) return null;
  if (a.matches('.ro-step')) return `.ro-step[data-step="${a.dataset.step}"]`;
  if (a.matches('.ro-cp')) return `.ro-cp[data-goal="${a.dataset.goal}"]`;
  return null;
}

/* the steps and checkpoints are one group with one tab stop (the step you are reading), and the arrows walk it */
const roveItems = () => [...els.outline.querySelectorAll('.ro-title:not([hidden]), .ro-step, .ro-cp')];
function roveHome() {
  const items = roveItems();
  if (items.some(b => b.tabIndex === 0 && b === document.activeElement)) return;
  const here = els.outline.querySelector('.ro-step[aria-current]') || (els.title.hasAttribute('aria-current') && !els.title.hidden ? els.title : null) || items[0];
  items.forEach(b => { b.tabIndex = b === here ? 0 : -1; });
}
function onOutlineKey(e) {
  if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const el = e.target.closest('.ro-title, .ro-step, .ro-cp');
  if (!el) return;
  const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
  if (!d && e.key !== 'Home' && e.key !== 'End') return;
  const items = roveItems(), i = items.indexOf(el);
  const j = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : clamp(i + d, 0, items.length - 1);
  e.preventDefault();
  items.forEach(b => { b.tabIndex = b === items[j] ? 0 : -1; });
  items[j].focus();
}

/** The lamp: a warm edge on the step you are reading. It glides from step to step (CSS), at once on Still. */
function placeLamp(now = false) {
  if (!els.lamp) return;
  const on = els.outline.querySelector('.ro-step[aria-current]') || (els.title.hasAttribute('aria-current') && !els.title.hidden ? els.title : null);
  if (!on) { els.lamp.classList.remove('on'); return; }
  const top = on.offsetTop, h = on.offsetHeight;
  if (now || still()) els.lamp.classList.add('jump');
  els.lamp.style.transform = `translateY(${top}px)`;
  els.lamp.style.height = `${h}px`;
  els.lamp.classList.add('on');
  if (els.lamp.classList.contains('jump')) { els.lamp.getBoundingClientRect(); els.lamp.classList.remove('jump'); }
  /* keep the step you are reading in view in a long outline */
  clearTimeout(lampTimer);
  lampTimer = setTimeout(() => {
    const list = els.list, r = on.getBoundingClientRect(), b = list.getBoundingClientRect();
    if (r.top < b.top + 8 || r.bottom > b.bottom - 8) list.scrollTo({ top: on.offsetTop - list.clientHeight * .3, behavior: still() ? 'auto' : 'smooth' });
  }, 120);
}

/** A right answer: the lamp brightens for a moment. */
function lightUp() {
  if (!els.lamp) return;
  els.lamp.classList.remove('lit');
  els.lamp.getBoundingClientRect();
  els.lamp.classList.add('lit');
  clearTimeout(litTimer);
  litTimer = setTimeout(() => els.lamp.classList.remove('lit'), 1100);
}

/* ── the foot of the outline: tonight, the lessons either side, the course ── */
const spoken = secs => {
  const m = Math.floor(secs / 60), h = Math.floor(m / 60), r = m % 60;
  const hs = h ? `${h} ${h === 1 ? 'hour' : 'hours'}` : '', ms = r || !h ? `${r} ${r === 1 ? 'minute' : 'minutes'}` : '';
  return [hs, ms].filter(Boolean).join(' ');
};
function paintTonight() {
  if (!root) return;
  const d = deskNow(), night = isNight(d), secs = tonight(d), goal = goalSeconds();
  els.tk.textContent = night ? 'tonight' : 'today';
  els.tn.textContent = `${hm(secs)} / ${hm(goal)}`;
  els.tbar.style.width = `${(Math.min(1, secs / Math.max(1, goal)) * 100).toFixed(1)}%`;
  els.tonight.setAttribute('aria-label', `${night ? 'Tonight' : 'Today'}: ${spoken(secs)} of your ${spoken(goal)} goal`);
}
let navKey = '';
function paintNav(l) {
  els.course.setAttribute('aria-expanded', String(courseOpen));
  const seq = writtenLessons(), i = l ? seq.findIndex(x => x.id === l.id) : -1;
  const key = `${l ? l.id : ''}|${i}|${seq.length}`;
  if (key === navKey) return;
  navKey = key;
  const side = (b, x, dir) => {
    b.disabled = !x;
    b.dataset.go = x ? x.id : '';
    b.innerHTML = dir < 0 ? `<span aria-hidden="true">←</span> ${x ? esc(x.n) : '·'}` : `${x ? esc(x.n) : '·'} <span aria-hidden="true">→</span>`;
    b.title = x ? `${dir < 0 ? 'Previous' : 'Next'} lesson: ${x.n} ${x.title} (${dir < 0 ? '[' : ']'})` : dir < 0 ? 'This is the first lesson' : 'The last lesson, for now';
    b.setAttribute('aria-label', x ? `${dir < 0 ? 'Previous' : 'Next'} lesson: ${x.n} ${x.title}` : b.title);
  };
  side(els.prev, i > 0 ? seq[i - 1] : null, -1);
  side(els.next, i >= 0 && i < seq.length - 1 ? seq[i + 1] : null, 1);
}

/* ── the bar's middle: the same steps, as words ─────────────────────────── */
const barWords = {
  label: 'Steps in this lesson',
  key: () => `${currentLessonId()}|${outlineKey}|${stepHere()}`,
  items: () => {
    const here = stepHere();
    return stepsOf().map(s => ({
      id: String(s.n), num: p2(s.n), name: s.title, here: s.n === here, done: s.cleared,
      title: `Step ${s.n}: ${s.title}${s.cleared ? ' (done)' : ''}`,
    }));
  },
  go: id => { goStep(+id); },
};

/* ── the course overlay ───────────────────────────────────────────────────── */
function openCourse() {
  if (!overlay) return;
  if (activeWs() !== 2) goWorkspace(2, { silent: true });
  if (!courseOpen) courseFrom = document.activeElement;
  const l = lessonById(currentLessonId());
  if (l && l.g) unfoldUnit(l.g);   // it opens on the unit being read
  overlay.hidden = false;
  courseOpen = true;
  root.classList.add('course-up');
  els.course.setAttribute('aria-expanded', 'true');
  const row = l && overlay.querySelector(`.stop[data-id="${l.id}"]`);
  if (row) row.scrollIntoView({ block: 'nearest' });
  const input = overlay.querySelector('#st-course-q');
  const focus = () => { if (courseOpen && input) { input.focus(); input.select(); } };
  focus();
  setTimeout(focus, 120);          // the launcher hands focus back as it closes
}

function closeCourse() {
  if (!overlay || !courseOpen) return;
  const hadFocus = overlay.contains(document.activeElement);
  overlay.hidden = true;
  courseOpen = false;
  root.classList.remove('course-up');
  els.course.setAttribute('aria-expanded', 'false');
  if (!hadFocus) return;
  const back = courseFrom && courseFrom.isConnected && courseFrom !== document.body ? courseFrom : els.scroll;
  courseFrom = null;
  if (back) back.focus({ preventScroll: true });
}

/* ── the keys: S for the scripts, Esc puts them (or the course) away ──────── */
const typing = () => {
  const a = document.activeElement;
  return !!a && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable);
};
function onKey(e) {
  if (!root || activeWs() !== 2 || booting() || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  if (focusedId() || menuOpen() || overlayOpen()) return;
  if (e.key === 'Escape') {
    if (courseOpen) { e.preventDefault(); closeCourse(); return; }
    const tip = document.getElementById('g-tip');
    if (tip && tip.style.display === 'block') return;               // the glossary tip goes first
    if (drawer && !typing()) { e.preventDefault(); setDrawer(false); if (!root.contains(document.activeElement)) els.scroll.focus({ preventScroll: true }); }
    return;
  }
  if ((e.key === 's' || e.key === 'S') && !e.shiftKey && !typing() && !courseOpen) {
    e.preventDefault();
    setDrawer(!drawer, { focus: false });
  }
}

/* ── arriving: the panes glide in (not on Still) ─────────────────────────── */
function arrive(what = 'ws') {
  if (still() || !root) return;
  const cls = what === 'lesson' ? 'doc-in' : 'arrive';
  root.classList.remove(cls);
  root.getBoundingClientRect();
  root.classList.add(cls);
  clearTimeout(arriveTimer);
  arriveTimer = setTimeout(() => root.classList.remove('arrive', 'doc-in'), 900);
}

/* ── the scene and the weather ────────────────────────────────────────────── */
function applyScene() {
  if (margins) margins.set({ scene: sceneNow(), motion: still() ? 'still' : motionNow() });
}
function weatherCheck() {
  if (margins) margins.run(!!root && activeWs() === 2 && !document.hidden && !booting());
}
function tickClock() {
  if (!root) return;
  const d = deskNow(), m = `${d.getHours()}:${d.getMinutes()}`;
  if (m === minute) return;
  minute = m;
  paintTonight();
  applyScene();
}

/* ── the workspace ────────────────────────────────────────────────────────── */
function onWorkspace() {
  const ws = activeWs();
  if (ws !== lastWs) {
    const was = lastWs;
    lastWs = ws;
    if (was === 2 && courseOpen) closeCourse();
    if (ws === 2) {
      minute = ''; tickClock();
      requestAnimationFrame(() => { layout(); placeLamp(true); });
      if (was) arrive('ws');
    }
  }
  weatherCheck();
  /* arriving on the study with nothing open picks up where the line is */
  if (ws === 2 && !currentLessonId()) openFirstSession();
}

/* ── mount ────────────────────────────────────────────────────────────────── */
export function mountStudy(el) {
  root = el;
  if (!root) return null;
  root.classList.add('study');
  root.innerHTML = skeleton();
  overlay = q('.st-course');
  els = {
    stage: q('.rd-stage'), read: q('.rd-read'), bench: q('.rd-bench'), scroll: q('#st-scroll'), doc: q('.doc'),
    n: q('.rd-n'), t: q('.rd-t'), cp: q('.rd-cp'), sbtn: q('.rd-sbtn'),
    outline: q('.rd-outline'), list: q('.ro-list'), lamp: q('.ro-lamp'), title: q('.ro-title'), steps: q('.ro-steps'),
    tonight: q('.ro-tonight'), tk: q('.ro-tonight .k'), tn: q('.ro-tonight b'), tbar: q('.ro-tonight .bar i'),
    prev: q('.ro-prev'), next: q('.ro-next'), course: q('.ro-course'),
  };

  const bench = {
    root: els.bench, step: q('.wb-step'), title: q('.wb-title'), src: q('.wb-src'), tabs: q('.wb-tabs'),
    code: q('.wb-code'), out: q('.wb-out'), task: q('.wb-task'), empty: q('.wb-empty'),
  };
  setSessionClock(deskNow);
  attachSession({ docEl: els.doc, bodyEl: els.scroll, bench });
  wireFold(bench);

  margins = new Margins({ wx: q('.cl-wx'), frost: q('.cl-frost') });
  applyScene();
  setDrawer(drawer, { save: false });

  /* the outline and the head */
  els.outline.addEventListener('click', e => {
    const s = e.target.closest('.ro-step, .ro-title');
    if (s) { sound.click(); goStep(+s.dataset.step); return; }
    const c = e.target.closest('.ro-cp');
    if (c) { sound.click(); goCheckpoint(+c.dataset.goal); return; }
    const nav = e.target.closest('.ro-prev, .ro-next');
    if (nav && nav.dataset.go) { sound.click(); openLesson(nav.dataset.go); return; }
    if (e.target.closest('.ro-course')) { courseOpen ? closeCourse() : openCourse(); }
  });
  els.outline.addEventListener('keydown', onOutlineKey);
  els.sbtn.onclick = () => setDrawer(!drawer, { focus: false });
  q('.wb-x').onclick = () => setDrawer(false);

  /* the course overlay */
  paintCourseInto(q('#st-course-list'), q('#st-course-q'), q('#st-course-foot'));
  q('.stc-x').onclick = closeCourse;
  overlay.addEventListener('click', e => {
    if (e.target === overlay || (e.target.closest && e.target.closest('.stop'))) closeCourse();
  });

  addEventListener('keydown', onKey, { capture: true });
  new ResizeObserver(() => { if (activeWs() === 2) layout(); }).observe(root);
  els.doc.addEventListener('study:correct', () => lightUp());
  els.doc.addEventListener('study:desk', () => { sound.event({ type: 'ui' }); goWorkspace(1); });

  lendBarMiddle(2, barWords);
  onQuest(() => paintOutline());
  onPaint(() => { paintOutline(); paintTonight(); });
  onNights(() => paintTonight());
  onFx(() => { applyScene(); root.classList.toggle('still', still()); });
  root.classList.toggle('still', still());
  /* a new lesson: the outline is drawn again, the page comes in */
  onLesson(() => { outlineKey = ''; paintOutline(); placeLamp(true); if (activeWs() === 2) arrive('lesson'); });
  setInterval(tickClock, 15000);
  tickClock();
  paintOutline();
  document.addEventListener('visibilitychange', weatherCheck);
  new MutationObserver(weatherCheck).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(applyScene).observe(document.documentElement, { attributes: true, attributeFilter: ['data-scene'] });

  /* `/` and the launcher's "search the course" open the overlay; the old
     course and session windows now just bring the study forward */
  onCourseOverlay(openCourse);
  redirectWindow('course', () => openCourse());
  redirectWindow('session', () => { goWorkspace(2, { silent: true }); });

  lastWs = 0;
  onWM(onWorkspace);
  onWorkspace();
  return root;
}

/** What the tests read. */
export const studyReport = () => {
  const here = els.outline ? els.outline.querySelector('.ro-step[aria-current]') : null;
  return {
    ...benchState(),
    courseOpen,
    drawer: { open: drawer, mode: geo.mode },
    outline: {
      here: here ? +here.dataset.step : (els.title && els.title.hasAttribute('aria-current') ? 0 : null),
      steps: els.steps ? els.steps.querySelectorAll('.ro-step').length : 0,
      cps: els.steps ? els.steps.querySelectorAll('.ro-cp').length : 0,
      shown: geo.outline,
    },
    scene: sceneNow(),
    motion: still() ? 'still' : motionNow(),
    geo: { pw: geo.pw, bw: geo.bw, px: geo.px, pxOpen: geo.pxOpen, bx: geo.bx, g: geo.g, mode: geo.mode },
    weather: margins ? margins.report() : null,
  };
};
