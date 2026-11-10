/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/GOALS
   Workspace 2's right window, in two panes:
     goals    the checkpoints of whatever session is open, and how many of the
              course's checkpoints are reached (real numbers: no XP, no ranks)
     journal  the machine's own log (see journal-view.js)

   A checkpoint is a real checkbox: tick it here, or tick it by finishing the
   runbook in the lesson — the same store either way.
   ════════════════════════════════════════════════════════════════════════════ */

import { GROUPS, GOALS, lessonById, writtenLessons } from '../data/course.js';
import { defineWindow, openWindow } from '../core/wm.js';
import { isDone, goalsOf, toggleGoal, progressSummary } from '../core/state.js';
import { log, announce } from '../core/journal.js';
import { sound } from '../core/sound.js';
import { repaint, onPaint, icon } from './window.js';
import { currentLessonId, openLesson } from './session.js';
import { openMan } from './man.js';
import { journalPane, paintJournal } from './journal-view.js';

let api = null, tabsEl = null, bodyEl = null, pane = 'goals';

/** The lesson the goals pane is about: the open session, or the next stop. */
const targetLesson = () => {
  const open = currentLessonId() ? lessonById(currentLessonId()) : null;
  if (open && open.kind === 'lesson') return open;
  return writtenLessons().find(l => !isDone(l.id)) || writtenLessons()[0] || null;
};

/* ── goals pane ───────────────────────────────────────────────────────────── */
function goalsPane() {
  const l = targetLesson();
  const root = document.createElement('div');
  root.className = 'panel-body';
  root.tabIndex = 0;

  const sum = progressSummary();
  const goals = l ? (GOALS[l.id] || []) : [];
  const have = l ? goalsOf(l.id) : [];
  const grp = l && l.g ? GROUPS.find(g => g.id === l.g) : null;

  root.innerHTML = `
    <div class="goal-status">
      <span class="rk">checkpoints</span>
      <span class="cps">${sum.cps} / ${sum.totalCps}</span>
      <span class="fill"></span>
      <span>in the course</span>
    </div>
    ${l ? `<div class="goal-who">
      <span>${grp ? `${grp.label.toLowerCase()} · ` : ''}${l.n} ${l.title}</span>
      <span class="fill"></span>
      <span>${have.length}/${goals.length}</span>
    </div>` : ''}
    ${goals.length ? `<ul class="goals">${goals.map((g, i) => {
      const on = have.includes(i);
      return `<li><button class="goal${on ? ' on' : ''}" type="button" role="checkbox"
          aria-checked="${on}" data-goal="${i}" data-lesson="${l.id}"
          title="${on ? 'Ticked — click to untick' : 'Mark this checkpoint done'}">
          <span class="box" aria-hidden="true"></span>
          <span class="txt">${g.t}</span>
        </button></li>`;
    }).join('')}</ul>`
    : `<p class="goal-empty">${l ? 'This stop has no checkpoints — read it and move on.' : 'Nothing to check off yet.'}</p>`}
    ${l ? `<div class="goal-foot">
      <div class="row">
        <span>${sum.done} / ${sum.total} finished</span>
        <span class="fill"></span>
        <button class="foot-link" id="gl-sheet">cheatsheet <span>→</span></button>
      </div>
    </div>` : ''}`;

  root.querySelectorAll('.goal').forEach(b => {
    const i = +b.dataset.goal;
    b.onclick = () => {
      const { on, res } = toggleGoal(l.id, i);
      sound.click();
      if (on && res) { if (isDone(l.id)) sound.summit(); else sound.checkpoint(); }
      paintJournal();
      repaint();
      announce(on ? `Checkpoint ticked. ${goals[i].t.replace(/<[^>]+>/g, '')}` : 'Checkpoint unticked.');
    };
  });
  const sheet = root.querySelector('#gl-sheet');
  if (sheet) sheet.onclick = () => openMan(l.id);
  return root;
}

/* ── tabs ─────────────────────────────────────────────────────────────────── */
function paintTabs() {
  if (!tabsEl) return;
  tabsEl.innerHTML = '';
  [['goals', 'Goals'], ['journal', 'Journal']].forEach(([id, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.dataset.pane = id;
    b.setAttribute('aria-selected', String(pane === id));
    b.textContent = label;
    b.onclick = () => { pane = id; sound.click(); paint(); };
    tabsEl.appendChild(b);
  });
}

function paint() {
  if (!bodyEl) return;
  /* a repaint must not cost a keyboard user their place: the pane is rebuilt
     from scratch, so note what is focused and put the focus back after */
  const active = document.activeElement;
  const held = active && active.dataset && api && api.el.contains(active)
    ? (active.dataset.goal !== undefined
      ? `.goal[data-lesson="${active.dataset.lesson}"][data-goal="${active.dataset.goal}"]`
      : active.dataset.pane ? `[data-pane="${active.dataset.pane}"]` : null)
    : null;

  paintTabs();
  if (pane === 'journal') {
    // the journal is append-only: rebuilding 300 lines on every goal tick
    // would be rude, so only build the pane when it is actually switched to
    if (bodyEl.dataset.pane !== 'journal') {
      bodyEl.replaceChildren(journalPane());
      bodyEl.dataset.pane = 'journal';
    } else paintJournal();
  } else {
    bodyEl.replaceChildren(goalsPane());
    bodyEl.dataset.pane = 'goals';
  }
  if (held) {
    const again = api.el.querySelector(held);
    if (again) again.focus({ preventScroll: true });
  }
  const l = targetLesson();
  if (api) {
    api.setTitle(pane === 'goals' ? 'Goals' : 'Journal', pane === 'goals'
      ? (l ? `${l.n} ${l.title.toLowerCase()}` : 'the line')
      : 'journalctl —f');

  }
}

/* ── the window ───────────────────────────────────────────────────────────── */
export const systemWindow = defineWindow({
  id: 'system',
  title: 'Goals',
  tag: 'checkpoints',
  icon: 'system',
  ws: 2,
  after: 'session',
  weight: 1.1,
  rail: 'right',
  build(body, winApi) {
    api = winApi;
    const root = document.createElement('div');
    root.className = 'panel';
    tabsEl = document.createElement('div');
    tabsEl.className = 'panel-tabs';
    tabsEl.setAttribute('role', 'tablist');
    tabsEl.setAttribute('aria-label', 'Goals and journal');
    bodyEl = document.createElement('div');
    bodyEl.className = 'panel-body';
    bodyEl.id = 'system-body';
    root.append(tabsEl, bodyEl);
    body.appendChild(root);
    winApi.showFoot(false);
    paint();
    repaint();

    /* progress ticked anywhere (runbook, probe, another pane) refreshes the
       ladder and the checkpoint boxes */
    onPaint(() => paint());

    return {
      focus() { paint(); },
    };
  },
});

/** main.js wires this to the rail's "goals" button. */
export function showGoals() { pane = 'goals'; openWindow('system'); paint(); }
export function showJournal() { pane = 'journal'; openWindow('system'); paint(); }
export function paintSystem() { paint(); }
