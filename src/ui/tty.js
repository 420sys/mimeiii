/* ════════════════════════════════════════════════════════════════════════════
   MIMEI · UI/TTY
   Workspace 1's terminal. It is not a pretend console: the prompt runs a small
   set of real commands over the course and the machine, and every tool the
   desktop has can be reached from it. The first thing it prints is the machine
   itself — wall, rank, stops, network — so the desk opens on a live system
   readout, not a fake dashboard.
   ════════════════════════════════════════════════════════════════════════════ */

import { GROUPS, courseList, lessonById, writtenLessons } from '../data/course.js';
import { isDone, progressSummary, state } from '../core/state.js';
import { currentWall } from '../core/walls.js';
import { defineWindow, openWindow } from '../core/wm.js';
import { log } from '../core/journal.js';
import { openStop } from './course.js';
import { openMan } from './man.js';
import { showGoals } from './goals.js';
import { openSettings } from './settings.js';
import { openLauncher } from './launcher.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

let api = null, root = null, screen = null, input = null;
let promptApi = null;
let history = [], histAt = 0;

const nextStop = () => writtenLessons().find(l => !isDone(l.id)) || writtenLessons()[0] || null;

function machineRows() {
  const sum = progressSummary();
  const wall = currentWall();
  const next = nextStop();
  const online = navigator.onLine ? 'online' : 'offline';
  return [
    ['os', 'mimei 1.0 · rolling'],
    ['wm', 'luau · tiled'],
    ['shell', 'luau 0.6'],
    ['wall', wall ? wall.label : 'the city, out of focus'],
    ['checkpoints', `${sum.cps} / ${sum.totalCps}`],
    ['stops', `${sum.done} / ${sum.total} finished`],
    ['next', next ? `${next.n}  ${next.title}` : 'the whole line is done'],
    ['net', online],
    ['tty', `1 · ${innerWidth}×${innerHeight}`],
  ];
}

/* the 未 mark, the same one the bar and the desk wear: snow at night, slate in Ice (ui/cab.js swaps it with the scene) */
const markImg = () => `<img class="tty-mark" src="assets/crane/mark-${document.documentElement.dataset.scene === 'ice' ? 'slate' : 'snow'}.webp" alt="" width="240" height="284" decoding="async">`;

function fetchMarkup() {
  const rows = machineRows().map(([k, v]) =>
    `<div class="tty-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  return `<div class="tty-fetch">
    ${markImg()}
    <div class="tty-fetch-copy">
      <p class="tty-who"><span>luau</span><span class="at">@</span><span>desk</span></p>
      <p class="tty-rule">────────────</p>
      <dl class="tty-rows">${rows}</dl>
    </div>
  </div>`;
}

function introMarkup() {
  const sum = progressSummary();
  const next = nextStop();
  const online = navigator.onLine ? 'online' : 'offline';
  return `<div class="tty-intro">
    ${markImg()}
    <div class="tty-intro-copy">
      <p class="tty-who"><span>luau</span><span class="at">@</span><span>desk</span></p>
      <p class="tty-sub">mimei 1.0 <span class="sep">·</span> tty1 <span class="sep">·</span> ${online}</p>
      <p class="tty-progress">${sum.done} / ${sum.total} stops <span class="sep">·</span> ${sum.cps} / ${sum.totalCps} checkpoints</p>
      <p class="tty-next-line"><span class="tn-k">next</span>${next ? ` <b>${esc(next.n)}</b> ${esc(next.title)}` : ' the line is finished'}</p>
      <p class="tty-hint-line">help <span class="sep">·</span> ls <span class="sep">·</span> open ${next ? esc(next.n) : '—'}</p>
    </div>
  </div>`;
}

function welcome() {
  screen.innerHTML = introMarkup();
}

function line(html, cls = '') {
  const el = document.createElement('div');
  el.className = 'tty-line' + (cls ? ' ' + cls : '');
  el.innerHTML = html;
  screen.appendChild(el);
  return el;
}

function scroll() {
  if (screen) screen.scrollTop = screen.scrollHeight;
}

function print(html, cls = '') {
  line(html, cls);
  scroll();
}

function printFetch() {
  print(fetchMarkup());
}

function commandLine(raw) {
  print(`<span class="tt-user">luau@mimei</span><span class="tt-colon">:</span><span class="tt-path">~</span><span class="tt-dollar">$</span> ${esc(raw)}`, 'tty-cmdline');
}

const commands = {
  help() {
    print(`<div class="tty-help">
      <p><b>course</b> open the course tree in workspace 2</p>
      <p><b>search</b> open the launcher on lessons</p>
      <p><b>man</b> read a cheatsheet · <b>goals</b> checkpoints and journal</p>
      <p><b>settings</b> open settings in workspace 4</p>
      <p><b>ls</b> list the course · <b>ls 3</b> list one unit · <b>open 3.1</b> open a stop</p>
      <p><b>neofetch</b> the machine · <b>date</b> · <b>pwd</b> · <b>whoami</b> · <b>clear</b></p>
    </div>`);
  },

  course() {
    print('<span class="tt-dim">→ workspace 2 · the course tree</span>');
    openWindow('course');
  },

  files() {
    print('<span class="tt-dim">→ files · ~/roblox-luau</span>');
    openWindow('files');
  },

  search() {
    print('<span class="tt-dim">opening the launcher · lessons</span>');
    openLauncher('lessons');
  },

  man(arg) {
    if (arg) {
      const l = courseList().find(x => x.id === arg);
      if (!l) return print(`<span class="tt-err">man: no entry for ${esc(arg)}</span>`);
      openMan(arg);
    } else {
      openMan(state.last);
    }
  },

  goals() {
    print('<span class="tt-dim">→ workspace 2 · checkpoints and journal</span>');
    showGoals();
  },

  settings() {
    print('<span class="tt-dim">→ workspace 4 · settings</span>');
    openSettings();
  },

  neofetch() {
    printFetch();
  },

  ls(arg) {
    if (arg) {
      const n = arg.replace(/^unit-/, '').replace(/[^0-9]/g, '');
      const g = GROUPS.find(x => x.id === `g${n}`) || GROUPS.find(x => x.id === arg);
      if (!g) return print(`<span class="tt-err">ls: cannot access '${esc(arg)}': no such unit</span>`);
      const stops = courseList().filter(l => l.g === g.id);
      print(`<div class="tty-listing"><p class="tt-dir">unit-${String(Number(n || g.id.slice(1))).padStart(2, '0')}-${g.label.toLowerCase().replace(/\s+/g, '-')}/</p>${stops.map(l =>
        `<p>${l.kind === 'tool' ? '▸' : l.n}  ${esc(l.title)}${isDone(l.id) ? '  <span class="tt-ok">done</span>' : ''}</p>`).join('')}</div>`);
      return;
    }
    print(`<div class="tty-listing">${GROUPS.map(g => {
      const stops = courseList().filter(l => l.g === g.id);
      const done = stops.filter(l => isDone(l.id)).length;
      return `<p><span class="tt-dir">unit-${g.id.slice(1).padStart(2, '0')}-${g.label.toLowerCase().replace(/\s+/g, '-')}/</span><span class="tt-count">${done}/${stops.length}</span></p>`;
    }).join('')}</div>`);
  },

  open(arg) {
    if (!arg) return print('<span class="tt-err">open: give me a stop, e.g. open 3.1</span>');
    const l = lessonById(arg);
    if (!l || l.soon) return print(`<span class="tt-err">open: no stop '${esc(arg)}'</span>`);
    print(`<span class="tt-dim">→ opening ${esc(l.n)} ${esc(l.title)}</span>`);
    openStop(l.id);
  },

  clear() {
    screen.innerHTML = '';
  },

  date() {
    print(esc(new Date().toString()));
  },

  pwd() {
    print('~/roblox-luau');
  },

  whoami() {
    print('luau');
  },

  uname(arg) {
    print(arg === '-a' ? 'mimei 1.0 tty1 x86_64 GNU/Linux' : 'mimei');
  },

  echo(...args) {
    print(esc(args.join(' ')));
  },

  history() {
    print(history.length
      ? history.map((h, i) => `<span class="tt-dim">${String(i + 1).padStart(3, ' ')}</span>  ${esc(h)}`).join('<br>')
      : '<span class="tt-dim">no commands yet</span>');
  },

  sudo() {
    print(`<span class="tt-err">luau is not in the sudoers file. This machine teaches Luau, not root.</span>`);
  },

  exit() {
    print('<span class="tt-dim">the desk stays open. close the window if you want it out of the way.</span>');
  },
};

function execute(raw) {
  const text = raw.trim();
  if (!text) return;
  commandLine(text);
  history.push(text);
  histAt = history.length;

  const [cmd, ...args] = text.split(/\s+/);
  const fn = commands[cmd];
  if (!fn) {
    print(`<span class="tt-err">luau: command not found: ${esc(cmd)}</span> <span class="tt-dim">— try help</span>`);
    return;
  }

  try {
    fn(...args);
    log('dim', `[ > ] tty · ${text}`);
  } catch (err) {
    console.error(err);
    print(`<span class="tt-err">luau: ${esc(err && err.message ? err.message : err)}</span>`);
  }
  scroll();
}

function run(raw) {
  if (!input || !screen) return;
  input.value = '';
  input.focus();
  execute(raw);
}

function onPromptKey(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    execute(input.value);
    input.value = '';
    return;
  }
  if (e.key === 'ArrowUp') {
    if (!history.length) return;
    e.preventDefault();
    histAt = Math.max(0, histAt - 1);
    input.value = history[histAt] || '';
    input.setSelectionRange(input.value.length, input.value.length);
    return;
  }
  if (e.key === 'ArrowDown') {
    if (!history.length) return;
    e.preventDefault();
    histAt = Math.min(history.length, histAt + 1);
    input.value = history[histAt] || '';
    input.setSelectionRange(input.value.length, input.value.length);
    return;
  }
  if (e.key === 'Tab') {
    const part = input.value.trim();
    if (!part) return;
    e.preventDefault();
    const hit = Object.keys(commands).find(c => c.startsWith(part));
    if (hit) input.value = hit + ' ';
  }
}

export const ttyWindow = defineWindow({
  id: 'tty',
  title: 'Terminal',
  tag: 'tty1',
  icon: 'tty',
  ws: 3,                                  // with the manual: the desk keeps its windows clear
  weight: 1.55,
  build(body, winApi) {
    api = winApi;
    root = document.createElement('div');
    root.className = 'tty';
    root.innerHTML = `
      <div class="tty-screen" id="tty-screen" role="log" aria-live="polite" aria-label="Terminal output"></div>
      <form class="tty-prompt" id="tty-form">
        <label class="tty-prompt-label" for="tty-input">
          <span class="tt-user">luau@desk</span><span class="tt-colon">:</span><span class="tt-path">~</span><span class="tt-dollar">$</span>
        </label>
        <input id="tty-input" name="tty-command" type="text" autocomplete="off" spellcheck="false"
               autocapitalize="off" aria-label="Terminal command" placeholder="help">
      </form>`;
    body.appendChild(root);
    winApi.setTitle('luau@desk');
    winApi.showFoot(false);

    screen = root.querySelector('#tty-screen');
    input = root.querySelector('#tty-input');
    promptApi = root.querySelector('#tty-form');

    input.addEventListener('keydown', onPromptKey);
    promptApi.addEventListener('submit', e => {
      e.preventDefault();
      execute(input.value);
      input.value = '';
    });
    screen.addEventListener('pointerdown', e => {
      if (e.target.closest('button, a')) return;
      input.focus();
    });

    welcome();

    return {
      focus() {
        if (input) input.focus({ preventScroll: true });
      },
    };
  },
});

export const ttyCommands = commands;
