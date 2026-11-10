/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/FIND
   What a search reads inside a lesson. main.js loads every lesson's text into #lessons once; this folds and
   lowercases each text once, on its first search, so typing never re-reads the page. A hit comes back as the
   few words around it, for the row to show under the title.
   ════════════════════════════════════════════════════════════════════════════ */

import { lessonById } from '../data/course.js';

const MIN = 3;                 // under three letters almost every lesson matches: the title and the tag are enough
const index = new Map();       // lesson id -> { raw, low }: the text with its whitespace folded, and its lowercase twin

function textOf(id) {
  if (index.has(id)) return index.get(id);
  const l = lessonById(id);
  const el = l && l.md ? document.getElementById(l.md) : null;
  if (!el) return null;                        // not loaded (yet): look again next time, do not remember the miss
  const raw = el.textContent.replace(/^[ \t]*(?:#{1,6}|>)[ \t]?/gm, '').replace(/\*\*|`/g, '').replace(/\s+/g, ' ').trim();
  const row = { raw, low: raw.toLowerCase() };
  index.set(id, row);
  return row;
}

/** The words of lesson `id` around the first place `q` appears (any case): { before, hit, after }, or null. */
export function bodyHit(id, q) {
  const n = String(q || '').trim().toLowerCase();
  if (n.length < MIN) return null;
  const t = textOf(id);
  const at = t ? t.low.indexOf(n) : -1;
  if (at < 0) return null;
  const end = at + n.length;
  let from = Math.max(0, at - 30), to = Math.min(t.raw.length, end + 46);
  if (from > 0) { const sp = t.raw.indexOf(' ', from); if (sp > -1 && sp < at) from = sp + 1; }       // start on a word
  if (to < t.raw.length) { const sp = t.raw.lastIndexOf(' ', to); if (sp > end) to = sp; }              // end on one
  return {
    before: (from > 0 ? '… ' : '') + t.raw.slice(from, at),
    hit: t.raw.slice(at, end),
    after: t.raw.slice(end, to) + (to < t.raw.length ? ' …' : ''),
  };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** A hit as a one-line span for a list row: the words around the match, the match in bold, the whole text on a title. */
export const snipHtml = h => `<span class="snip" title="${esc(h.before + h.hit + h.after)}">${esc(h.before)}<b>${esc(h.hit)}</b>${esc(h.after)}</span>`;
