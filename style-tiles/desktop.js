/* ════════════════════════════════════════════════════════════════════════
   LUAUOS · KISSA OS · DESKTOP BEHAVIOUR
   A small, real-feeling Linux desk: workspaces, tiled windows you can move,
   a taskbar of open windows, a rofi-shaped launcher, the real course line,
   and the Studio runbook. No fake telemetry, nothing saved.
   ════════════════════════════════════════════════════════════════════════ */

import { LESSONS, GROUPS } from '../src/data/course.js';

(() => {
  'use strict';

  const body = document.body;
  const params = new URLSearchParams(location.search);
  const motionOK = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const validWorkspaces = new Set(['desk', 'session', 'line']);
  const workspaceTabs = [...document.querySelectorAll('[data-workspace-tab]')];
  const workspaceTargets = [...document.querySelectorAll('[data-workspace-target]')];
  const windows = [...document.querySelectorAll('[data-window]')];
  const windowById = Object.fromEntries(windows.map((win) => [win.dataset.window, win]));
  const windowChips = [...document.querySelectorAll('[data-window-focus]')];
  const windowMinButtons = [...document.querySelectorAll('[data-window-min]')];
  const desktop = document.querySelector('.desktop');

  const clockEls = [...document.querySelectorAll('[data-clock]')];
  const dateEls = [...document.querySelectorAll('[data-date]')];
  const live = document.querySelector('[data-live]');
  const toastEl = document.querySelector('[data-toast]');

  const launcher = document.querySelector('[data-launcher]');
  const launcherPanel = launcher ? launcher.querySelector('.launcher-panel') : null;
  const launcherInput = launcher ? launcher.querySelector('[data-launch-input]') : null;
  const launcherList = launcher ? launcher.querySelector('[data-launch-list]') : null;
  const launcherGroups = [...document.querySelectorAll('[data-launch-group]')];
  const launcherTriggers = [...document.querySelectorAll('[data-launch]')];
  const launcherClosers = [...document.querySelectorAll('[data-launch-close]')];
  const inertRegions = [document.querySelector('.panel'), desktop].filter(Boolean);

  const deskMenu = document.querySelector('[data-desk-menu]');
  const deskMenuActions = deskMenu ? [...deskMenu.querySelectorAll('[data-menu-action]')] : [];

  const unitNodes = [...document.querySelectorAll('[data-unit-node]')];
  const lineStops = document.querySelector('[data-line-stops]');
  const lineDetail = document.querySelector('.line-detail');
  const lineHint = document.querySelector('.line-detail-hint');
  const mapFields = {
    no: [...document.querySelectorAll('[data-map-no]')],
    title: [...document.querySelectorAll('[data-map-title]')],
    count: [...document.querySelectorAll('[data-map-count]')],
    note: [...document.querySelectorAll('[data-map-note]')],
  };

  const goals = [...document.querySelectorAll('[data-goal]')];
  const goalCounts = [...document.querySelectorAll('[data-goal-count]')];
  const goalFills = [...document.querySelectorAll('[data-goal-fill]')];
  const goalMeta = [...document.querySelectorAll('[data-goal-meta]')];

  const lessonStops = LESSONS.filter((lesson) => lesson.kind === 'lesson');
  const lessonsByGroup = new Map(
    GROUPS.map((group) => [group.id, lessonStops.filter((lesson) => lesson.g === group.id)]),
  );

  let toastTimer = 0;
  let launcherOpen = false;
  let launcherReturnFocus = null;
  let activeLaunchIndex = 0;
  let visibleLaunchItems = [];
  let windowZ = 20;
  let drag = null;
  let selectedStopId = null;
  let currentUnitNode = null;
  let deskMenuOpen = false;

  const say = (text) => {
    if (!live) return;
    live.textContent = '';
    window.setTimeout(() => { live.textContent = text; }, 40);
  };

  function toast(text) {
    if (!toastEl) return;
    window.clearTimeout(toastTimer);
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-on'), 2800);
  }

  /* ── build the full course into the launcher ───────────────────────────── */
  function buildLauncherStops() {
    const root = document.querySelector('[data-launch-stops]');
    if (!root) return;

    const fragment = document.createDocumentFragment();
    lessonStops.forEach((lesson) => {
      const group = GROUPS.find((item) => item.id === lesson.g);
      const unitLabel = group ? group.label : lesson.tag;
      const item = document.createElement('button');

      item.type = 'button';
      item.className = 'launch-item';
      item.dataset.launchItem = '';
      item.dataset.command = `stop:${lesson.id}`;
      item.dataset.search = [
        lesson.id, lesson.title, lesson.tag, unitLabel, `${lesson.mins} min`, 'stop lesson',
      ].join(' ').toLowerCase();
      item.title = `${lesson.id} / ${lesson.title}`;

      const no = document.createElement('span');
      no.className = 'li-no';
      no.textContent = lesson.id;

      const title = document.createElement('span');
      title.className = 'li-title';
      title.textContent = lesson.title;

      const meta = document.createElement('span');
      meta.className = 'li-meta';
      meta.textContent = `${unitLabel} / ${lesson.mins} min`;

      const arrow = document.createElement('span');
      arrow.className = 'li-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↵';

      item.append(no, title, meta, arrow);
      fragment.append(item);
    });

    root.replaceChildren(fragment);
  }

  buildLauncherStops();
  const launcherItems = [...document.querySelectorAll('[data-launch-item]')];

  /* ── workspaces and window state ───────────────────────────────────────── */
  function syncWorkspace() {
    const workspace = body.dataset.workspace;
    workspaceTabs.forEach((tab) => {
      if (tab.dataset.workspaceTab === workspace) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  function isWindowVisible(win) {
    if (!win || win.classList.contains('is-minimized')) return false;
    const workspace = body.dataset.workspace;
    if (workspace === 'desk') return true;
    if (workspace === 'session') return win.dataset.window !== 'line';
    if (workspace === 'line') return win.dataset.window === 'line';
    return false;
  }

  function syncWindowAccess() {
    windows.forEach((win) => {
      const visible = isWindowVisible(win);
      win.inert = !visible;
      win.setAttribute('aria-hidden', String(!visible));
    });
  }

  function syncWindowChips() {
    windowChips.forEach((chip) => {
      const win = windowById[chip.dataset.windowFocus];
      const focused = Boolean(win && win.classList.contains('is-focused'));
      const minimized = Boolean(win && win.classList.contains('is-minimized'));
      chip.classList.toggle('is-focused', focused);
      chip.classList.toggle('is-minimized', minimized);
      chip.setAttribute('aria-pressed', String(focused));
    });
  }

  function syncWindowState() {
    syncWindowAccess();
    syncWindowChips();
  }

  function focusWindow(win) {
    if (!win || win.classList.contains('is-minimized')) return;
    windows.forEach((item) => item.classList.toggle('is-focused', item === win));
    win.style.zIndex = String(++windowZ);
    syncWindowChips();
  }

  function restoreWindow(win) {
    if (!win) return;
    win.classList.remove('is-minimized');
    syncWindowState();
  }

  function minimizeWindow(win) {
    if (!win) return;
    win.classList.add('is-minimized');
    win.classList.remove('is-focused');
    syncWindowState();

    const next = windows.find((item) => item !== win && isWindowVisible(item));
    if (next) focusWindow(next);
    else syncWindowChips();

    const label = win.dataset.window || 'window';
    toast(`${label} minimized · click its chip to restore`);
    say(`${label} minimized.`);
  }

  function mainWindowFor(workspace) {
    if (workspace === 'line') return windowById.line;
    return windowById.session;
  }

  function syncUrl() {
    try {
      history.replaceState(null, '', `?workspace=${body.dataset.workspace}`);
    } catch (_) {
      /* a local file has no history to rewrite */
    }
  }

  function setWorkspace(name, { announce = true, focus = true } = {}) {
    if (!validWorkspaces.has(name)) return;

    const changed = body.dataset.workspace !== name;
    body.dataset.workspace = name;
    clearAllGeometry();
    syncWorkspace();
    syncUrl();

    const main = mainWindowFor(name);
    if (main) restoreWindow(main);
    syncWindowState();
    if (focus && main) focusWindow(main);

    if (changed && announce) {
      say(name === 'desk' ? 'The desk.' : name === 'session' ? 'Session workspace.' : 'The line workspace.');
    }
  }

  function activateWindow(id) {
    const win = windowById[id];
    if (!win) return;

    const workspace = body.dataset.workspace;
    const visible = workspace === 'desk'
      || (workspace === 'session' && id !== 'line')
      || (workspace === 'line' && id === 'line');

    restoreWindow(win);
    if (!visible) setWorkspace(id === 'line' ? 'line' : 'session', { focus: false, announce: false });
    focusWindow(win);
    say(`${id} focused.`);
  }

  workspaceTargets.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      setWorkspace(button.dataset.workspaceTarget);
    });
  });

  windowChips.forEach((chip) => {
    chip.addEventListener('click', () => activateWindow(chip.dataset.windowFocus));
  });

  windowMinButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      minimizeWindow(windowById[button.dataset.windowMin]);
    });
  });

  windows.forEach((win) => {
    win.addEventListener('pointerdown', () => focusWindow(win));
  });

  /* ── moving a window: the desk is allowed to become yours ──────────────── */
  function clearGeometry(win) {
    if (!win) return;
    win.classList.remove('is-floating', 'is-dragging');
    ['left', 'top', 'right', 'bottom', 'width', 'height'].forEach((property) => {
      win.style.removeProperty(property);
    });
  }

  function clearAllGeometry() {
    windows.forEach(clearGeometry);
  }

  function beginPointerDrag(win, bar, event) {
    if (event.button !== 0 || event.target.closest('button')) return;
    if (!desktop) return;

    focusWindow(win);
    const rect = win.getBoundingClientRect();
    const deskRect = desktop.getBoundingClientRect();

    drag = {
      win,
      bar,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left - deskRect.left,
      startTop: rect.top - deskRect.top,
      width: rect.width,
      height: rect.height,
      deskWidth: deskRect.width,
      deskHeight: deskRect.height,
      moved: false,
    };

    try { bar.setPointerCapture(event.pointerId); } catch (_) {}
  }

  function movePointerDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;

    if (!drag.moved) {
      drag.moved = true;
      drag.win.classList.add('is-floating', 'is-dragging');
      drag.win.style.right = 'auto';
      drag.win.style.bottom = 'auto';
      drag.win.style.width = `${drag.width}px`;
      drag.win.style.height = `${drag.height}px`;
    }

    const minLeft = -(drag.width - 140);
    const maxLeft = drag.deskWidth - 140;
    const maxTop = drag.deskHeight - 40;
    const left = Math.max(minLeft, Math.min(maxLeft, drag.startLeft + dx));
    const top = Math.max(0, Math.min(maxTop, drag.startTop + dy));

    drag.win.style.left = `${left}px`;
    drag.win.style.top = `${top}px`;
  }

  function endPointerDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { win, bar, pointerId, moved } = drag;
    win.classList.remove('is-dragging');
    try { bar.releasePointerCapture(pointerId); } catch (_) {}

    if (moved) {
      say('Window moved. Double-click its titlebar to tile it again.');
    }
    drag = null;
  }

  windows.forEach((win) => {
    const bar = win.querySelector('[data-win-bar]');
    if (!bar) return;

    bar.addEventListener('pointerdown', (event) => beginPointerDrag(win, bar, event));
    bar.addEventListener('pointermove', movePointerDrag);
    bar.addEventListener('pointerup', endPointerDrag);
    bar.addEventListener('pointercancel', endPointerDrag);

    bar.addEventListener('dblclick', (event) => {
      if (event.target.closest('button')) return;
      if (win.classList.contains('is-floating')) {
        clearGeometry(win);
        focusWindow(win);
        toast(`${win.dataset.window} tiled`);
        return;
      }
      setWorkspace(win.dataset.window === 'line' ? 'line' : 'session');
    });
  });

  /* ── time is real ──────────────────────────────────────────────────────── */
  function paintClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const date = now.toLocaleDateString('en-GB', {
      weekday: 'short', day: '2-digit', month: 'short',
    }).toUpperCase();

    clockEls.forEach((el) => { el.textContent = time; });
    dateEls.forEach((el) => { el.textContent = date; });
  }

  /* ── the line: real units, real stops ──────────────────────────────────── */
  function setMapField(field, value) {
    mapFields[field].forEach((el) => { el.textContent = value || ''; });
  }

  function renderUnitStops(lessons, stopId) {
    if (!lineStops) return;
    const fragment = document.createDocumentFragment();

    lessons.forEach((lesson) => {
      const stop = document.createElement('button');
      stop.type = 'button';
      stop.className = 'line-stop';
      stop.dataset.lineStop = lesson.id;
      stop.title = `${lesson.id} / ${lesson.title}`;
      if (lesson.id === stopId) {
        stop.classList.add('is-current');
        stop.setAttribute('aria-current', 'true');
      }

      const no = document.createElement('span');
      no.className = 'line-stop-no';
      no.textContent = lesson.id;

      const title = document.createElement('span');
      title.className = 'line-stop-title';
      title.textContent = lesson.title;

      const mins = document.createElement('span');
      mins.className = 'line-stop-min';
      mins.textContent = `${lesson.mins} min`;

      stop.append(no, title, mins);
      stop.addEventListener('click', () => selectStop(lesson.id));
      fragment.append(stop);
    });

    lineStops.replaceChildren(fragment);
  }

  function selectUnit(node, preferredStopId = null) {
    if (!node) return;

    const lessons = lessonsByGroup.get(node.dataset.unitGroup) || [];
    const sameUnit = currentUnitNode === node;
    const keepStop = sameUnit && selectedStopId && lessons.some((lesson) => lesson.id === selectedStopId)
      ? selectedStopId
      : null;
    const nextStopId = preferredStopId || keepStop || (lessons[0] ? lessons[0].id : null);

    currentUnitNode = node;
    selectedStopId = nextStopId;

    unitNodes.forEach((item) => {
      const on = item === node;
      item.classList.toggle('is-selected', on);
      if (on) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });

    setMapField('no', node.dataset.unitNo);
    setMapField('title', node.dataset.unitTitle);
    setMapField('count', `${lessons.length} ${lessons.length === 1 ? 'stop' : 'stops'}`);
    setMapField('note', node.dataset.unitNote);
    if (lineDetail) lineDetail.dataset.unitNo = node.dataset.unitNo;

    renderUnitStops(lessons, nextStopId);

    if (lineHint) {
      const selected = lessonStops.find((lesson) => lesson.id === nextStopId);
      lineHint.textContent = selected && selected.id !== '1.0'
        ? `${selected.id} is in the line · preview contains 1.0 only`
        : 'preview contains 1.0 only';
    }
  }

  function selectStop(stopId) {
    const lesson = lessonStops.find((item) => item.id === stopId);
    if (!lesson) return;

    selectedStopId = stopId;
    if (lineStops) {
      lineStops.querySelectorAll('[data-line-stop]').forEach((stop) => {
        const current = stop.dataset.lineStop === stopId;
        stop.classList.toggle('is-current', current);
        if (current) stop.setAttribute('aria-current', 'true');
        else stop.removeAttribute('aria-current');
      });
    }

    if (lineHint) {
      lineHint.textContent = stopId === '1.0'
        ? 'preview contains 1.0 only'
        : `${stopId} is in the line · preview contains 1.0 only`;
    }

    if (stopId === '1.0') {
      setWorkspace('session');
      focusWindow(windowById.session);
      say('Session 1.0, Set up Roblox Studio.');
      return;
    }

    toast(`Stop ${stopId} · ${lesson.title}. Preview contains 1.0 only.`);
    say(`Stop ${stopId}, ${lesson.title}. This preview contains 1.0 only.`);
  }

  /* A stop can be opened from the launcher, the next tab, or the runbook.
     It always selects the real unit and lands on the right workspace. */
  function openStopPreview(stopId) {
    const lesson = lessonStops.find((item) => item.id === stopId);
    if (!lesson) {
      toast('No stop by that name');
      return;
    }

    const unit = unitNodes.find((node) => node.dataset.unitGroup === lesson.g);
    if (!unit) {
      toast('No unit for that stop');
      return;
    }

    selectUnit(unit, lesson.id);

    if (lesson.id === '1.0') {
      setWorkspace('session');
      focusWindow(windowById.session);
      toast('Session 1.0 · Set up Roblox Studio');
      say('Session 1.0, Set up Roblox Studio.');
      return;
    }

    setWorkspace('line');
    focusWindow(windowById.line);
    toast(`Stop ${lesson.id} · ${lesson.title}. Preview contains 1.0 only.`);
    say(`Stop ${lesson.id}, ${lesson.title}. This preview contains 1.0 only.`);
  }

  unitNodes.forEach((node) => {
    node.addEventListener('click', () => {
      selectUnit(node);
      if (body.dataset.workspace === 'desk') setWorkspace('line');
    });
    node.addEventListener('focus', () => selectUnit(node));
  });

  document.querySelectorAll('[data-next-stop]').forEach((button) => {
    button.addEventListener('click', () => openStopPreview(button.dataset.nextStop));
  });

  /* ── the Studio checklist is a preview; it never writes progress ───────── */
  function paintGoals() {
    const done = goals.filter((goal) => goal.getAttribute('aria-pressed') === 'true').length;
    const total = goals.length || 4;
    goalCounts.forEach((el) => { el.textContent = `${done} / ${total}`; });
    goalFills.forEach((el) => { el.style.width = `${(done / total) * 100}%`; });
    goalMeta.forEach((el) => { el.textContent = `${done} / ${total}`; });
  }

  goals.forEach((goal) => {
    goal.addEventListener('click', () => {
      const on = goal.getAttribute('aria-pressed') !== 'true';
      goal.setAttribute('aria-pressed', String(on));
      goal.classList.toggle('is-checked', on);
      paintGoals();
      const done = goals.filter((item) => item.getAttribute('aria-pressed') === 'true').length;
      say(`${done} of ${goals.length} studio checkpoints. Preview only.`);
    });
  });

  /* ── copy the script ───────────────────────────────────────────────────── */
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      field.remove();
      return ok;
    }
  }

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const ok = await copyText(button.dataset.copy || '');
      if (!ok) {
        toast('Could not copy');
        return;
      }
      const old = button.textContent;
      button.textContent = 'copied';
      window.setTimeout(() => { button.textContent = old; }, 1200);
      toast('Script copied');
      say('Script copied.');
    });
  });

  /* ── launcher: the whole course, in a rofi-shaped book ─────────────────── */
  function setInert(on) {
    inertRegions.forEach((el) => { el.inert = on; });
  }

  function paintLaunchActive() {
    launcherItems.forEach((item) => item.classList.remove('is-active'));
    const item = visibleLaunchItems[activeLaunchIndex];
    if (!item) return;
    item.classList.add('is-active');
    item.scrollIntoView({ block: 'nearest' });
  }

  function updateLaunchEmpty() {
    if (!launcherList) return;
    let empty = launcherList.querySelector('.launcher-empty');
    if (!visibleLaunchItems.length) {
      if (!empty) {
        empty = document.createElement('p');
        empty.className = 'launcher-empty';
        empty.textContent = 'No stop by that name.';
        launcherList.appendChild(empty);
      }
      empty.hidden = false;
    } else if (empty) {
      empty.hidden = true;
    }
  }

  function filterLauncher() {
    const query = (launcherInput ? launcherInput.value : '').trim().toLowerCase();
    visibleLaunchItems = [];

    launcherGroups.forEach((group) => {
      let any = false;
      group.querySelectorAll('[data-launch-item]').forEach((item) => {
        const haystack = `${item.dataset.search || ''} ${item.textContent}`.toLowerCase();
        const show = !query || haystack.includes(query);
        item.hidden = !show;
        if (show) {
          any = true;
          visibleLaunchItems.push(item);
        }
      });
      group.hidden = !any;
    });

    activeLaunchIndex = 0;
    updateLaunchEmpty();
    paintLaunchActive();
  }

  function openLauncher(trigger) {
    if (!launcher || launcherOpen) return;
    closeDeskMenu();
    launcherOpen = true;
    launcherReturnFocus = trigger || document.activeElement;
    launcher.hidden = false;
    body.classList.add('launcher-open');
    setInert(true);
    launcherTriggers.forEach((button) => button.setAttribute('aria-expanded', 'true'));
    if (launcherInput) {
      launcherInput.value = '';
      filterLauncher();
      if (launcherList) launcherList.scrollTop = 0;
      requestAnimationFrame(() => launcherInput.focus());
    }
  }

  function closeLauncher() {
    if (!launcher || !launcherOpen) return;
    launcherOpen = false;
    launcher.hidden = true;
    body.classList.remove('launcher-open');
    setInert(false);
    launcherTriggers.forEach((button) => button.setAttribute('aria-expanded', 'false'));
    if (launcherReturnFocus instanceof HTMLElement) launcherReturnFocus.focus();
    launcherReturnFocus = null;
  }

  function resetDesk() {
    windows.forEach((win) => {
      clearGeometry(win);
      win.classList.remove('is-minimized');
    });
    setWorkspace('desk', { announce: false });
    syncWindowState();
    toast('Windows tiled · desk reset');
    say('Window layout reset.');
  }

  function executeCommand(command) {
    if (!command) return;
    const [kind, value] = command.split(':');

    if (kind === 'workspace') {
      closeLauncher();
      setWorkspace(value);
      return;
    }

    if (kind === 'stop') {
      closeLauncher();
      openStopPreview(value);
      return;
    }

    if (kind === 'desktop' && value === 'reset') {
      closeLauncher();
      resetDesk();
      return;
    }

    if (kind === 'desktop' && value === 'about') {
      closeLauncher();
      toast('LuauOS / Kissa · 12 units · 52 stops · fresh save 0 / 52');
      say('LuauOS Kissa. Twelve units, fifty-two stops, fresh save.');
      return;
    }

    closeLauncher();
  }

  launcherTriggers.forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', (event) => {
      event.preventDefault();
      openLauncher(button);
    });
  });

  launcherClosers.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      closeLauncher();
    });
  });

  launcherItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const index = visibleLaunchItems.indexOf(item);
      if (index >= 0) {
        activeLaunchIndex = index;
        paintLaunchActive();
      }
    });
    item.addEventListener('click', () => executeCommand(item.dataset.command));
  });

  if (launcherInput) {
    launcherInput.addEventListener('input', filterLauncher);
    launcherInput.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!visibleLaunchItems.length) return;
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        activeLaunchIndex = (activeLaunchIndex + direction + visibleLaunchItems.length) % visibleLaunchItems.length;
        paintLaunchActive();
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const item = visibleLaunchItems[activeLaunchIndex];
        if (item) executeCommand(item.dataset.command);
      }
    });
  }

  /* Keep tabbing inside the little book while it is open. */
  document.addEventListener('keydown', (event) => {
    if (!launcherOpen || !launcherPanel) return;
    if (event.key !== 'Tab') return;
    const focusable = [...launcherPanel.querySelectorAll('button:not([hidden]), input, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ── desktop context menu ──────────────────────────────────────────────── */
  function openDeskMenu(x, y) {
    if (!deskMenu) return;
    deskMenu.hidden = false;
    deskMenuOpen = true;
    deskMenu.style.left = '0px';
    deskMenu.style.top = '0px';
    const width = deskMenu.offsetWidth;
    const height = deskMenu.offsetHeight;
    const left = Math.max(10, Math.min(x, window.innerWidth - width - 10));
    const top = Math.max(10, Math.min(y, window.innerHeight - height - 10));
    deskMenu.style.left = `${left}px`;
    deskMenu.style.top = `${top}px`;
    const first = deskMenu.querySelector('button');
    if (first) first.focus({ preventScroll: true });
  }

  function closeDeskMenu() {
    if (!deskMenu || !deskMenuOpen) return;
    deskMenu.hidden = true;
    deskMenuOpen = false;
  }

  deskMenuActions.forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.menuAction;
      closeDeskMenu();
      if (action === 'launch') openLauncher(launcherTriggers[0]);
      if (action === 'session') {
        setWorkspace('session');
        focusWindow(windowById.session);
      }
      if (action === 'line') {
        setWorkspace('line');
        focusWindow(windowById.line);
      }
      if (action === 'reset') resetDesk();
    });
  });

  document.addEventListener('contextmenu', (event) => {
    if (launcherOpen) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('.win, .panel, .launcher, .desk-menu')) return;
    event.preventDefault();
    openDeskMenu(event.clientX, event.clientY);
  });

  document.addEventListener('pointerdown', (event) => {
    if (!deskMenuOpen) return;
    if (deskMenu && event.target instanceof Node && deskMenu.contains(event.target)) return;
    closeDeskMenu();
  });

  /* ── URL / keys ────────────────────────────────────────────────────────── */
  document.addEventListener('keydown', (event) => {
    const typing = event.target instanceof HTMLElement
      && event.target.matches('input, textarea, select, [contenteditable="true"]');

    if (event.key === 'Escape') {
      if (deskMenuOpen) {
        event.preventDefault();
        closeDeskMenu();
        return;
      }
      if (launcherOpen) {
        event.preventDefault();
        closeLauncher();
        return;
      }
      if (body.dataset.workspace !== 'desk') {
        event.preventDefault();
        setWorkspace('desk');
      }
      return;
    }

    if (launcherOpen || deskMenuOpen || typing) return;
    if (event.metaKey || event.ctrlKey || event.altKey) {
      if (event.altKey && ['Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
        event.preventDefault();
        setWorkspace({ Digit1: 'desk', Digit2: 'session', Digit3: 'line' }[event.code]);
      }
      return;
    }

    if (event.code === 'Slash' || event.key === '/') {
      event.preventDefault();
      openLauncher(document.activeElement);
      return;
    }

    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      resetDesk();
    }
  });

  /* ── boot ──────────────────────────────────────────────────────────────── */
  const initialWorkspace = validWorkspaces.has(params.get('workspace'))
    ? params.get('workspace')
    : 'desk';

  setWorkspace(initialWorkspace, { announce: false });
  paintGoals();
  paintClock();
  window.setInterval(paintClock, 30000);

  if (unitNodes.length) selectUnit(unitNodes[0]);
  syncWindowState();

  if (params.get('launcher') === '1') {
    openLauncher(launcherTriggers[0]);
  }

  requestAnimationFrame(() => body.classList.add('is-ready'));
})();
