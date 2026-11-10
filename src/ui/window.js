/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/WINDOW (the kit)
   Everything a window, a widget or a bar button needs to look like it belongs
   to this machine: the pixel icon set, the btop tile, meters, rows, and the
   little formatting helpers the panels share.
   ════════════════════════════════════════════════════════════════════════════ */

/* ── icons: drawn on a 16-unit grid, hairline strokes, no fills ───────────── */
/* The attributes matter: without them a bare <path> fills black, and the icon
   reads as a blob. CSS may still override (many rules do, to set a colour). */
const stroke = (d, extra = '') =>
  `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" ${extra}><path d="${d}"/></svg>`;

export const ICONS = {
  deck: stroke('M2.5 3.5h11v7.5h-11zM6.5 13.5h3M8 11v2.5'),
  tty: stroke('M2.5 3.5h11v9h-11zM4.7 6.2 6.4 8l-1.7 1.8M7.7 10h3.5'),
  files: stroke('M2.5 5h4.6l1.2 1.6H13.5v6.9h-11zM2.5 5V3.6h4l1.2 1.4'),
  course: stroke('M2.5 6.5h11v6.5h-11zM2.5 6.5V4h4l1.2 1.5'),
  session: stroke('M2.5 3.5h11v9h-11zM5 7l1.4 1.5L5 10M8.4 10h3'),
  system: stroke('M3 4.5h10M3 8h10M3 11.5h6M12 10.5l1.5 1.5-1.5 1.5', ''),
  man: stroke('M3 3.5h4.3v9H3zM8.7 3.5H13v9H8.7z'),
  wallpaper: stroke('M2.5 3.5h11v9h-11zM2.5 10.5 5.5 7.5l2.5 2 2-2 3.5 3M10.5 6.2h.01'),
  settings: stroke('M8 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6L11 5M5 11l-1.4 1.4'),
  search: stroke('M10.6 10.6 13.5 13.5M11 7A4 4 0 1 1 3 7a4 4 0 0 1 8 0z'),
  caret: stroke('M4.5 6.2 8 9.8l3.5-3.6', 'style="fill:none;stroke:currentColor"'),
  lock: stroke('M4.5 7.5V5.6a3.5 3.5 0 0 1 7 0v1.9M3.5 7.5h9v5h-9z'),
  power: stroke('M8 2.5v5M4.6 4.8a4.5 4.5 0 1 0 6.8 0'),
  check: stroke('M3.5 8.5 6.5 11.5 12.5 4.5'),
  copy: stroke('M3.5 3.5h7v7h-7zM6 6h6.5v6.5H6z'),
  keys: stroke('M8 6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM6 3.2l.5-1.2h3l.5 1.2M12.8 6l1.2.5v3L12.8 10M10 12.8l-.5 1.2h-3L6 12.8M3.2 10 2 9.5v-3L3.2 6'),
  star: stroke('M8 2.5l1.7 3.6 3.8.5-2.8 2.7.7 3.9L8 11.4l-3.4 1.8.7-3.9L2.5 6.6l3.8-.5z'),
  hourglass: stroke('M4.5 2.5h7v2.2L8 8l3.5 3.3v2.2h-7v-2.2L8 8 4.5 4.7z'),
  clock: stroke('M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zM8 5v3.2l2 1.2'),
  grid: stroke('M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z'),
};

export const icon = (name, cls = 'ic') => ICONS[name] ? `<span class="${cls}" aria-hidden="true">${ICONS[name]}</span>` : '';

/* ── tiny DOM helpers ─────────────────────────────────────────────────────── */
export function el(tag, cls = '', html = '') {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html) node.innerHTML = html;
  return node;
}

/** A btop-style tile: the title is a chip over the border, drawn in CSS from
    the dataset so widget bodies can still replace their innerHTML freely. */
export function tile(title, cls = '', { wide = false, double = false, id = '' } = {}) {
  const t = el('section', `tile wgt ${cls}${wide ? ' wide' : ''}${double ? ' double' : ''}`);
  if (id) t.id = id;
  if (title) t.dataset.title = title;
  else t.classList.add('no-title');
  return t;
}

export const meter = (ratio, cls = '') =>
  `<span class="meter ${cls}"><i style="width:${Math.max(0, Math.min(1, ratio)) * 100}%"></i></span>`;

export const btn = (label, cls = '', title = '') =>
  `<button class="btn ${cls}"${title ? ` title="${escAttr(title)}"` : ''}>${label}</button>`;

export const chip = (label, cls = '') => `<span class="chip ${cls}">${label}</span>`;

export const escAttr = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ── formatting ───────────────────────────────────────────────────────────── */
export const mins = m => (m ? `~${m} min` : '');
export const pct = r => `${Math.round(r * 100)}%`;
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
export const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Compact XP: 1200 → 1.2k. Used in the bar, where room is scarce. */
export const xpNum = n => (n >= 1000 ? (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k' : String(n));

/** The machine's own name for a lesson id: 3.1 → unit-03/3.1. */
export function pathOf(lesson, groups = []) {
  if (!lesson) return '~';
  if (lesson.id === 'home') return '~';
  const unit = lesson.g ? lesson.g.replace('g', '') : '';
  const dir = groups.find(g => g.id === lesson.g);
  const name = dir ? `unit-${unit.padStart(2, '0')}-${slug(dir.label)}` : 'unit';
  return `~/roblox-luau/${name}`;
}

/** A raster-free crescent, for the "not built yet" card and empty states. */
export function moonSvg(n = 16) {
  const c = (n - 1) / 2, R = n / 2 - 0.3;
  const inA = (x, y) => (x - c) ** 2 + (y - c) ** 2 <= R * R;
  const inB = (x, y) => (x - c - n * 0.34) ** 2 + (y - c + n * 0.26) ** 2 <= (R * 0.95) ** 2;
  let body = '', rim = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!inA(x, y) || inB(x, y)) continue;
    const px = `M${x} ${y}h1v1h-1z`;
    if (inB(x + 1, y) || inB(x, y - 1) || inB(x + 1, y - 1)) rim += px; else body += px;
  }
  return `<svg class="moon" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" aria-hidden="true">
    <path class="mb" d="${body}"/><path class="mr" d="${rim}"/>
    <path class="ms" d="M${n - 3} 2h1v1h-1zM${n - 2} 6h1v1h-1zM${n - 5} ${n - 4}h1v1h-1z"/></svg>`;
}

/** Every panel that shows progress is redrawn through this, so one event
 *  repaints the bar, the goals pane and the deck together. */
const painters = new Set();
export const onPaint = fn => { painters.add(fn); return () => painters.delete(fn); };
export function repaint() {
  for (const fn of painters) { try { fn(); } catch (e) { console.error(e); } }
}
