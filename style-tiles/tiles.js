/* ════════════════════════════════════════════════════════════════════════
   LUAUOS · STYLE TILES · SHARED BEHAVIOUR
   No framework, no build. Views, moods, the clock, the map selection and the
   real course checkpoints. Everything is local to the tile; nothing writes to
   the learner's saved progress.
   ════════════════════════════════════════════════════════════════════════ */

(() => {
  const body = document.body;
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const motionOK = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const views = [...document.querySelectorAll('.view[data-view]')];
  const viewTabs = [...document.querySelectorAll('[data-view-tab]')];
  const moodButtons = [...document.querySelectorAll('[data-mood-tab]')];
  const wipe = document.querySelector('.mood-wipe');
  const live = document.querySelector('[data-live]');
  const clockEls = [...document.querySelectorAll('[data-clock]')];
  const dateEls = [...document.querySelectorAll('[data-date]')];
  const validViews = new Set(['desk', 'lesson', 'line']);
  const validMoods = new Set(['asa', 'yoru']);

  const say = (text) => {
    if (!live) return;
    live.textContent = '';
    window.setTimeout(() => { live.textContent = text; }, 40);
  };

  const syncTabs = () => {
    const view = body.dataset.view;
    viewTabs.forEach((tab) => {
      const on = tab.dataset.viewTab === view;
      if (on) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    const mood = body.dataset.mood;
    moodButtons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.moodTab === mood));
    });
  };

  const setUrl = () => {
    const next = `?view=${body.dataset.view}&mood=${body.dataset.mood}`;
    try { history.replaceState(null, '', next); } catch (_) {}
  };

  let viewToken = 0;

  function setView(name, { animate = true, announce = true } = {}) {
    if (!validViews.has(name) || name === body.dataset.view) return;
    const current = views.find((view) => view.dataset.view === body.dataset.view);
    const next = views.find((view) => view.dataset.view === name);
    if (!next) return;

    const token = ++viewToken;
    body.dataset.view = name;
    syncTabs();
    setUrl();

    const finish = () => {
      if (token !== viewToken) return;
      if (current) {
        current.hidden = true;
        current.classList.remove('is-leaving');
      }
      next.hidden = false;
      next.classList.remove('is-entering');
      next.scrollTop = 0;
      if (animate && motionOK()) {
        next.classList.add('is-entering');
        next.addEventListener('animationend', () => next.classList.remove('is-entering'), { once: true });
      }
      if (announce) {
        say(name === 'lesson' ? 'Lesson surface.' : name === 'line' ? 'The line.' : 'Desk.');
      }
    };

    if (current && animate && motionOK()) {
      current.classList.add('is-leaving');
      window.setTimeout(finish, 130);
    } else {
      finish();
    }
  }

  let wipeTimer = 0;

  function setMood(name, { animate = true, announce = true } = {}) {
    if (!validMoods.has(name) || name === body.dataset.mood) return;
    body.dataset.mood = name;
    root.dataset.mood = name;
    syncTabs();
    setUrl();

    if (wipe && animate && motionOK()) {
      window.clearTimeout(wipeTimer);
      wipe.classList.remove('run');
      // Force the animation to restart when the mood is toggled quickly.
      void wipe.offsetWidth;
      wipe.classList.add('run');
      wipeTimer = window.setTimeout(() => wipe.classList.remove('run'), 700);
    }

    if (announce) {
      say(name === 'asa' ? 'Morning. Asa.' : 'Night. Yoru.');
    }
  }

  /* ── time is real; no invented date or weather ────────────────────────── */
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

  /* ── the line: selecting a unit changes the quiet side panel ──────────── */
  const unitNodes = [...document.querySelectorAll('[data-unit-node]')];
  const mapFields = {
    no: [...document.querySelectorAll('[data-map-no]')],
    title: [...document.querySelectorAll('[data-map-title]')],
    count: [...document.querySelectorAll('[data-map-count]')],
    first: [...document.querySelectorAll('[data-map-first]')],
    note: [...document.querySelectorAll('[data-map-note]')],
  };

  function selectUnit(node) {
    if (!node) return;
    unitNodes.forEach((item) => {
      const on = item === node;
      item.classList.toggle('is-selected', on);
      if (on) item.setAttribute('aria-current', 'true');
      else item.removeAttribute('aria-current');
    });

    const set = (list, value) => list.forEach((el) => { el.textContent = value || ''; });
    set(mapFields.no, node.dataset.unitNo);
    set(mapFields.title, node.dataset.unitTitle);
    set(mapFields.count, node.dataset.unitCount);
    set(mapFields.first, node.dataset.unitFirst);
    set(mapFields.note, node.dataset.unitNote);
  }

  unitNodes.forEach((node) => {
    node.addEventListener('click', () => selectUnit(node));
    node.addEventListener('focus', () => selectUnit(node));
  });

  /* ── the studio checklist is a preview: it never touches saved progress ─ */
  const goals = [...document.querySelectorAll('[data-goal]')];
  const goalCounts = [...document.querySelectorAll('[data-goal-count]')];
  const goalFills = [...document.querySelectorAll('[data-goal-fill]')];
  const cardProgress = [...document.querySelectorAll('[data-card-progress]')];

  function paintGoals() {
    const done = goals.filter((goal) => goal.getAttribute('aria-pressed') === 'true').length;
    const total = goals.length || 4;
    goalCounts.forEach((el) => { el.textContent = `${done} / ${total}`; });
    cardProgress.forEach((el) => { el.textContent = `${done} / ${total}`; });
    goalFills.forEach((el) => { el.style.width = `${(done / total) * 100}%`; });
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

  /* ── copy the small script; a tactile, honest detail ──────────────────── */
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
      if (!ok) return;
      const old = button.textContent;
      button.textContent = 'copied';
      button.classList.add('is-copied');
      window.setTimeout(() => {
        button.textContent = old;
        button.classList.remove('is-copied');
      }, 1200);
      say('Script copied.');
    });
  });

  /* ── wiring ────────────────────────────────────────────────────────────── */
  document.querySelectorAll('[data-view-target]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      setView(button.dataset.viewTarget);
    });
  });

  document.querySelectorAll('[data-mood-target]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      setMood(button.dataset.moodTarget);
    });
  });

  document.addEventListener('keydown', (event) => {
    const typing = event.target instanceof HTMLElement
      && (event.target.matches('input, textarea, select, [contenteditable="true"]'));

    if (event.altKey && ['Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
      event.preventDefault();
      setView({ Digit1: 'desk', Digit2: 'lesson', Digit3: 'line' }[event.code]);
      return;
    }

    if (typing) return;

    if (event.key === 'Escape' && body.dataset.view !== 'desk') {
      setView('desk');
      return;
    }

    if (event.key.toLowerCase() === 'm' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      setMood(body.dataset.mood === 'yoru' ? 'asa' : 'yoru');
    }
  });

  /* ── boot state ────────────────────────────────────────────────────────── */
  const initialView = validViews.has(params.get('view')) ? params.get('view') : 'desk';
  const initialMood = validMoods.has(params.get('mood')) ? params.get('mood') : 'yoru';

  body.dataset.view = initialView;
  body.dataset.mood = initialMood;
  root.dataset.mood = initialMood;

  views.forEach((view) => {
    view.hidden = view.dataset.view !== initialView;
    view.classList.remove('is-entering', 'is-leaving');
  });

  syncTabs();
  paintGoals();
  paintClock();
  window.setInterval(paintClock, 30000);

  if (unitNodes.length) selectUnit(unitNodes[0]);

  requestAnimationFrame(() => body.classList.add('is-ready'));
})();
