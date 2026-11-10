/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · CORE/KEYS
   Alt is Super. Every tiling action, every workspace, the launcher and the
   two "just browsing" keys ([ and ]) come through here.

   Two rules keep this from fighting the rest of the page:
     · plain keys ([ ] / q ? m) are ignored while the cursor is in an input, so
       typing a search never opens a lesson by accident;
     · Alt combinations are read from `e.code`, not `e.key`, because Option on
       macOS turns Alt+H into "˙" and the keyboard is not the OS's business.

   Nothing here reaches into a window module directly: the commands a key can
   fire that belong to a window are handed in by main.js. That keeps this file
   free of imports from ui/*.
   ════════════════════════════════════════════════════════════════════════════ */

import {
  closeWindow, cycleWindows, focusNext, focusedId, goWorkspace, hideWindow,
  isOpen, layoutMode, menuOpen, closeMenu, monocleOn, moveToWorkspace, openWindow,
  reorderFocused, resizeFocused, setLayoutMode, toggleFloat, toggleMonocle,
  windowDef,
} from './wm.js';
import { cycleFxPreference, isPeeking, setPeek } from './effects.js';
import { sound } from './sound.js';
import { log } from './journal.js';

/** Filled in by main.js: the parts of the machine that live in ui/*. */
export const commands = {
  launcher: null,      // (mode) => void
  lesson: null,        // (dir) => void   previous / next stop
  search: null,        // () => void      focus the course search
  rain: null,          // () => void      toggle the rain
  fx: null,            // () => void      cycle the effects level
  launcherOpen: null,  // () => boolean
  manual: null,        // () => boolean   the desk's M key; false when the desk is not up
};

/** The keymap the launcher's `keys` mode and the settings window print.
 *  One table, so the help can never drift from the keyboard. */
export const KEYMAP = [
  { k: ['alt', '↵'], d: 'Launcher — lessons, windows, actions' },
  { k: ['alt', '1–4'], d: 'Switch workspace' },
  { k: ['alt', '⇧', '1–4'], d: 'Move the focused window to a workspace' },
  { k: ['alt', 'h', 'j', 'k', 'l'], d: 'Move focus between windows' },
  { k: ['alt', '⇧', 'h', 'l'], d: 'Reorder the focused window' },
  { k: ['alt', '⇧', 'j', 'k'], d: 'Shrink / grow the focused window' },
  { k: ['alt', 'm'], d: 'Fill the seat with the focused window' },
  { k: ['alt', 'f'], d: 'Float or tile the focused window' },
  { k: ['alt', 'z'], d: 'Hide it (its word in the bar brings it back)' },
  { k: ['alt', 'q'], d: 'Close the focused window' },
  { k: ['alt', 'tab'], d: 'Cycle through the windows on this workspace' },
  { k: ['alt', '⇧', 'm'], d: 'Columns or rows layout' },
  { k: ['alt', 'b'], d: 'The city only (everything else steps aside)' },
  { k: ['alt', 'p'], d: 'Cycle the effects level (performance)' },
  { k: ['alt', '⇧', 'r'], d: 'Rain on or off' },
  { k: ['alt', '⇧', 'f'], d: 'Effects level' },
  { k: ['[', ']'], d: 'Previous / next lesson' },
  { k: ['/'], d: 'Search the course' },
  { k: ['←', '→'], d: 'On the desk: show the other lessons on the sign' },
  { k: ['↵'], d: 'On the desk: open the lesson on the sign' },
  { k: ['m'], d: 'Open the manual for the lesson on the sign' },
  { k: ['q'], d: 'Leave a man page' },
  { k: ['?'], d: 'This list' },
  { k: ['esc'], d: 'Back out of whatever is in front of you · on the desk, the menu' },
];

const typing = () => {
  const a = document.activeElement;
  if (!a) return false;
  return /INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable;
};

const FX_STEPS = ['full', 'balanced', 'minimal', 'static'];
export const fxLabel = pref => (pref === 'auto' ? 'auto' : pref);

/** Alt+P / the bar's fx module: step the machine down its levels by hand. */
export const cycleFx = () => cycleFxPreference();

export function initKeys() {
  addEventListener('keydown', onKey, { capture: true });
  addEventListener('keyup', onKeyUp);
}

/* Alt alone: the bar flashes the modifier so you know Super is down. On macOS
   the browser eats the keydown but not the keyup, so this is best-effort. */
function onKeyUp(e) {
  if (e.key === 'Alt' || e.code === 'AltLeft' || e.code === 'AltRight') {
    document.body.classList.remove('mod-down');
  }
}

function onKey(e) {
  const mod = e.altKey && !e.ctrlKey && !e.metaKey;
  const inLauncher = commands.launcherOpen ? commands.launcherOpen() : false;

  if (mod && e.code === 'AltRight') return;
  if (e.key === 'Alt') {
    document.body.classList.add('mod-down');
    return;
  }

  /* ── the launcher owns the keyboard while it is up ── */
  if (inLauncher) {
    if (mod && e.code === 'Enter') { e.preventDefault(); commands.launcher(); }
    return;
  }
  if (menuOpen()) {
    if (e.key === 'Escape' || mod) closeMenu();
    if (e.key === 'Escape') return;
  }

  /* ── the city-only state (peek) swallows everything but Esc and Alt+B ── */
  if (isPeeking()) {
    if (e.key === 'Escape' || (mod && e.code === 'KeyB')) {
      e.preventDefault();
      setPeek(false, { focusBack: false });
    }
    return;
  }

  /* ── Alt (Super) combinations ── */
  if (mod) {
    const code = e.code;
    if (code === 'Enter') { e.preventDefault(); commands.launcher && commands.launcher(); return; }

    const digit = /^Digit([1-4])$/.exec(code);
    if (digit) {
      e.preventDefault();
      const n = +digit[1];
      const id = focusedId();
      if (e.shiftKey && id) moveToWorkspace(id, n);
      else goWorkspace(n);
      return;
    }

    switch (code) {
      case 'KeyH': case 'ArrowLeft':  e.preventDefault(); e.shiftKey ? reorderFocused(-1) : focusNext(-1); return;
      case 'KeyL': case 'ArrowRight': e.preventDefault(); e.shiftKey ? reorderFocused(1) : focusNext(1); return;
      case 'KeyK': case 'ArrowUp':    e.preventDefault(); e.shiftKey ? resizeFocused(1) : focusNext(-1); return;
      case 'KeyJ': case 'ArrowDown':  e.preventDefault(); e.shiftKey ? resizeFocused(-1) : focusNext(1); return;
      case 'KeyM': e.preventDefault(); if (e.shiftKey) setLayoutMode(layoutMode() === 'rows' ? 'columns' : 'rows'); else toggleMonocle(); return;
      case 'KeyF': e.preventDefault(); if (e.shiftKey) commands.fx && commands.fx(); else toggleFloat(); return;
      case 'KeyZ': e.preventDefault(); focusedId() && hideWindow(focusedId()); return;
      case 'KeyQ': e.preventDefault(); focusedId() && closeWindow(focusedId()); return;
      case 'KeyB': e.preventDefault(); setPeek(true, { focusBack: true }); return;
      case 'KeyP': e.preventDefault(); commands.fx ? commands.fx() : cycleFx(); return;
      case 'KeyR': if (e.shiftKey) { e.preventDefault(); commands.rain ? commands.rain() : null; } return;
      case 'Tab': e.preventDefault(); cycleWindows(); sound.click(); return;
      case 'Backquote': e.preventDefault(); cycleWindows(); return;
      default: return;
    }
  }

  /* ── plain keys, only when the cursor is not in a field ── */
  if (typing()) return;
  if (e.ctrlKey || e.metaKey) return;

  switch (e.key) {
    case 'Escape': {
      if (focusedId() && monocleOn(focusedId())) toggleMonocle(focusedId());
      break;
    }
    case '[': e.preventDefault(); commands.lesson && commands.lesson(-1); break;
    case ']': e.preventDefault(); commands.lesson && commands.lesson(1); break;
    case '/': e.preventDefault(); commands.search && commands.search(); break;
    case '?': e.preventDefault(); commands.launcher && commands.launcher('keys'); break;
    case 'm': case 'M': if (commands.manual && commands.manual()) e.preventDefault(); break;
    case 'q': {
      // q leaves a man page, and only a man page
      const id = focusedId();
      if (id && windowDef(id) && windowDef(id).tag === 'man') { e.preventDefault(); closeWindow(id); }
      break;
    }
    default: break;
  }
}

/** True when the machine is showing something the learner can back out of. */
export const overlayOpen = () => isPeeking() || (commands.launcherOpen && commands.launcherOpen());

export const openKeys = () => commands.launcher && commands.launcher('keys');
export const openActions = () => commands.launcher && commands.launcher('actions');
export const openWindowsList = () => commands.launcher && commands.launcher('windows');

/** The bar's window words: open a window, or bring it forward (the journal says so). */
export function summon(id) {
  const def = windowDef(id);
  if (!def) return;
  const before = isOpen(id);
  openWindow(id);
  if (before) log('dim', `[ ^ ] ${def.title} brought forward`);
}
