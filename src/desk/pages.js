/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · DESK/PAGES
   What the sign on the crane hook says, read from the real course and the real
   progress. Every page is four rows of LED text (unit, title, checkpoints, the
   action), and the same words as one plain sentence for the button that sits
   over the sign, so a screen reader hears exactly what the sign shows.

     resume    the lesson you are in (or the first one you have not finished)
     begin     a lesson you have not started
     review    a lesson you have finished
     complete  the first time you come back after finishing a unit, once;
               after the last unit it says COURSE COMPLETE
   ════════════════════════════════════════════════════════════════════════════ */

import { GOALS, GROUPS, writtenLessons } from '../data/course.js';
import { goalsOf, isDone, placeOf, state } from '../core/state.js';
import { width } from './ledfont.js';

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const COLS = 92, MARGIN = 2;
const fits = text => width(text) <= COLS - 2 * MARGIN;

export const unitIndex = g => GROUPS.findIndex(u => u.id === g);
const unitOf = l => GROUPS[unitIndex(l.g)] || GROUPS[0];

/** `DECISIONS · 3.3`, or `UNIT X · 10.2` when the unit's name is too wide for the sign. */
export function unitLine(l) {
  const i = unitIndex(l.g), named = `${unitOf(l).label.toUpperCase()} · ${l.n}`;
  return fits(named) ? named : `UNIT ${ROMAN[i] || i + 1} · ${l.n}`;
}

/** Where a lesson stands: 'review' (finished), 'resume' (begun: a checkpoint ticked, or read into), 'begin'. */
export function lessonStatus(l) {
  if (isDone(l.id)) return 'review';
  const p = placeOf(l.id);
  return goalsOf(l.id).length || (p && (p.s || p.m || p.y)) ? 'resume' : 'begin';
}

const ACT = { review: 'REVIEW', resume: 'RESUME', begin: 'BEGIN' };

/** One lesson's page: { kind, id, lines, say }. */
export function lessonPage(l) {
  const kind = lessonStatus(l);
  const cps = (GOALS[l.id] || []).length;
  const have = goalsOf(l.id).length;
  const at = Math.min(cps, have + 1);
  const mins = l.mins ? ` · ${l.mins} MIN` : '';
  const third = kind === 'review' ? `${cps}/${cps} CHECKPOINTS`
    : kind === 'resume' ? (cps ? `CHECKPOINT ${at}/${cps}` : 'IN PROGRESS')
      : `${cps} ${cps === 1 ? 'CHECKPOINT' : 'CHECKPOINTS'}`;
  const lines = [
    { text: unitLine(l), lv: .46, row: 2 },
    { text: l.title, lv: 1, row: 11 },
    { text: third, lv: .62, row: 20 },
    { text: `▶ ${ACT[kind]}${mins}`, lv: kind === 'begin' ? .55 : .46, row: 29, act: true },
  ];
  const u = unitOf(l), i = unitIndex(l.g);
  const where = kind === 'review' ? `finished, all ${cps} checkpoints`
    : kind === 'resume' ? (cps ? `checkpoint ${at} of ${cps} next` : 'in progress')
      : `not started, ${cps} ${cps === 1 ? 'checkpoint' : 'checkpoints'}`;
  const say = `${ACT[kind][0]}${ACT[kind].slice(1).toLowerCase()} ${l.n}, ${l.title}. Unit ${ROMAN[i]}, ${u.label}: ${where}${l.mins ? `, about ${l.mins} minutes` : ''}.`;
  return { kind, id: l.id, lines, say };
}

/** The page for a finished unit: `UNIT III / COMPLETE / NEXT · IV LOOPS`, or COURSE COMPLETE after the last. */
export function completePage(g) {
  const i = unitIndex(g), next = GROUPS[i + 1];
  const nextLesson = next && writtenLessons().find(l => l.g === next.id);
  const last = !nextLesson;
  const tail = last ? 'COURSE COMPLETE' : `NEXT · ${ROMAN[i + 1]} ${next.label.toUpperCase()}`;
  return {
    kind: 'complete', unit: g, id: last ? null : nextLesson.id,
    lines: [
      { text: `UNIT ${ROMAN[i]}`, lv: .42, row: 5 },
      { text: 'COMPLETE', lv: 1, row: 15 },
      { text: fits(tail) ? tail : (last ? tail : `NEXT · UNIT ${ROMAN[i + 1]}`), lv: .4, row: 29, act: true },
    ],
    say: last ? `Unit ${ROMAN[i]} complete. That was the last unit: the course is complete.`
      : `Unit ${ROMAN[i]} complete. Next: unit ${ROMAN[i + 1]}, ${next.label}, starting with ${nextLesson.n} ${nextLesson.title}.`,
  };
}

/** The page the sign shows while a lesson opens. */
export const openingPage = title => [{ text: 'OPENING', lv: 1, row: 11 }, { text: title, lv: .5, row: 21 }];

/** Units whose every written lesson is finished. */
export const finishedUnits = () => GROUPS
  .filter(u => { const ls = writtenLessons().filter(l => l.g === u.id); return ls.length && ls.every(l => isDone(l.id)); })
  .map(u => u.id);

/** What the desk's sign will say when you go back to it from lesson `id`: a unit finished since the sign last said
 *  so (UNIT III · COMPLETE, or COURSE COMPLETE after the last), else the stop the desk is about (desktop.js hereStop). */
export function signAfter(id) {
  const fresh = finishedUnits().filter(g => !state.unitsSeen.includes(g));
  if (fresh.length) {
    const g = fresh[fresh.length - 1], i = unitIndex(g), next = GROUPS[i + 1];
    const more = next && writtenLessons().some(l => l.g === next.id);
    return { kind: 'complete', text: more ? `UNIT ${ROMAN[i]} · COMPLETE` : 'COURSE COMPLETE' };
  }
  const all = writtenLessons();
  const at = all.findIndex(l => l.id === id);
  const open = at >= 0 ? all[at] : null;
  const l = (open && !isDone(open.id) ? open : null)
    || (at >= 0 ? all.slice(at + 1).find(x => !isDone(x.id)) : null)
    || all.find(x => !isDone(x.id)) || open || all[0];
  return l ? { kind: 'lesson', id: l.id, text: `${l.n} · ${l.title}` } : null;
}
