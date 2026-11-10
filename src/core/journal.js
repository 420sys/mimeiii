/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/JOURNAL
   journalctl for a machine that is teaching you: one append-only log, a
   polite live region for screen readers, and a one-line ticker for the bar
   when something actually happened.
   ════════════════════════════════════════════════════════════════════════════ */

const MAX = 300;
const lines = [];
let view = null, tickerEl = null, liveEl = null, tickTimer = 0, listeners = [];

export function mountJournal(el) { tickerEl = el; }
export function mountJournalView(el) { view = el; paintView(); }
export function mountLive(el) { liveEl = el; }

let clock = null;                     // one formatter, made at the first line: making one per line is slow
const stamp = () => (clock ||= new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })).format(new Date());

/** kind: ok | dim | warn | er | info — the same colours the log pane uses. */
export function log(kind, text) {
  const line = { t: stamp(), kind, text: String(text) };
  lines.push(line);
  if (lines.length > MAX) lines.splice(0, lines.length - MAX);
  if (view) appendView(line);
  for (const fn of listeners) { try { fn(line); } catch (_) {} }
  return line;
}

/** Only the loud kinds reach the bar — a machine that beeps at everything
 *  is a machine nobody reads. */
export function ticker(kind, text) {
  if (!tickerEl || (kind !== 'ok' && kind !== 'warn' && kind !== 'er')) return;
  tickerEl.innerHTML = `<b>${kind === 'er' ? '!' : kind === 'warn' ? '+' : 'ok'}</b> ${text}`;
  tickerEl.classList.add('on');
  clearTimeout(tickTimer);
  tickTimer = setTimeout(() => tickerEl.classList.remove('on'), 5200);
}

export const logAndTick = (kind, text) => { log(kind, text); ticker(kind, text); };

/** Screen readers get the short version of everything important. */
export function announce(text) {
  if (!liveEl) return;
  liveEl.textContent = '';
  setTimeout(() => { liveEl.textContent = text; }, 30);
}

export const entries = () => lines.slice();
export function clearJournal() {
  lines.length = 0;
  if (view) view.innerHTML = '';
  log('dim', 'journal cleared');
}

export function onLog(fn) { listeners.push(fn); }

/* ── rendering ───────────────────────────────────────────────────────────── */
function lineEl(l) {
  const d = document.createElement('div');
  d.className = 'jline ' + l.kind;
  d.innerHTML = `<span class="t">${l.t}</span><span class="h">mimei</span><span class="m">${escapeHtml(l.text)}</span>`;
  return d;
}
function appendView(l) {
  const follow = view.dataset.follow !== 'false';
  const near = view.scrollHeight - view.scrollTop - view.clientHeight < 90;
  view.appendChild(lineEl(l));
  if (follow && near) view.scrollTop = view.scrollHeight;
  while (view.children.length > MAX) view.removeChild(view.firstChild);
}
function paintView() {
  if (!view) return;
  view.innerHTML = '';
  for (const l of lines) view.appendChild(lineEl(l));
  view.scrollTop = view.scrollHeight;
}
const escapeHtml = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
