/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/JOURNAL VIEW
   The machine's log, journalctl-flavoured: a tail you can pause, a filter for
   the loud lines only, and a clear button that says what it did. The journal
   itself lives in core/journal.js — this is only the pane.
   ════════════════════════════════════════════════════════════════════════════ */

import { clearJournal, entries, mountJournalView, onLog } from '../core/journal.js';
import { sound } from '../core/sound.js';

let outEl = null, barEl = null, filter = 'all';

/* the pane may not exist yet (the window is closed) — the log keeps going
   anyway, and paintJournal() catches up whenever it is opened again. */
onLog(line => {
  if (!outEl) return;
  paintCount();
  if (filter === 'loud' && !/ok|warn|er/.test(line.kind)) {
    const last = outEl.lastElementChild;
    if (last) last.hidden = true;
  }
});

export function journalPane() {
  const root = document.createElement('div');
  root.className = 'journal';
  root.innerHTML = `
    <div class="journal-bar">
      <span class="cnt" data-count></span>
      <span class="sp"></span>
      <button type="button" data-filter="all" aria-pressed="true" title="Everything">all</button>
      <button type="button" data-filter="loud" aria-pressed="false" title="Only the lines that matter">loud</button>
      <button type="button" data-follow aria-pressed="true" title="Keep the tail pinned to the bottom">follow</button>
      <button type="button" data-clear title="Clear the pane — the log keeps going">clear</button>
    </div>
    <pre class="journal-out" id="journal-out" tabindex="0" aria-label="Journal" aria-live="off"></pre>`;

  barEl = root.querySelector('.journal-bar');
  outEl = root.querySelector('#journal-out');
  mountJournalView(outEl);

  barEl.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
    filter = b.dataset.filter;
    barEl.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    applyFilter();
    sound.click();
  });
  const follow = barEl.querySelector('[data-follow]');
  follow.onclick = () => {
    const on = follow.getAttribute('aria-pressed') !== 'true';
    follow.setAttribute('aria-pressed', String(on));
    outEl.dataset.follow = String(on);
    if (on) outEl.scrollTop = outEl.scrollHeight;
    sound.click();
  };
  barEl.querySelector('[data-clear]').onclick = () => { clearJournal(); paintJournal(); };

  outEl.dataset.follow = 'true';
  paintJournal();
  return root;
}

function applyFilter() {
  if (!outEl) return;
  const loud = filter === 'loud';
  [...outEl.children].forEach(line => {
    line.hidden = loud && !/ok|warn|er/.test(line.className);
  });
  paintCount();
}

function paintCount() {
  if (!barEl) return;
  const c = barEl.querySelector('[data-count]');
  if (c) c.textContent = filter === 'loud'
    ? `${entries().filter(l => /ok|warn|er/.test(l.kind)).length} loud`
    : `${entries().length} lines`;
}

export function paintJournal() {
  if (!outEl) return;
  applyFilter();
}
