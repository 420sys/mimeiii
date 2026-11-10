/* One list of things a learner can do, shared by tools/probe.html and
   tools/shot.html. Every entry is either a click on something real or a key
   the site listens for — never a call into the site's own API — so a probe or
   a screenshot exercises the same path a person would.

   window.runAct(iframe, 'ws2') → the iframe has done it by the time you await.
   An unknown action is not an error: it means "just look at the machine". */
window.runAct = async function runAct(f, a, sleepMs) {
  const d = f.contentDocument, w = f.contentWindow;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  /* Keys go to whatever has focus, like a person's do — dispatching everything
     on `window` would skip every listener on the focused element itself. */
  const key = (code, opts = {}) => {
    const target = d.activeElement || d.body || w;
    target.dispatchEvent(new w.KeyboardEvent('keydown',
      Object.assign({ code, key: code.replace(/^(Digit|Key)/, ''), bubbles: true, cancelable: true }, opts)));
  };
  const alt = { altKey: true };
  const click = sel => { const el = d.querySelector(sel); if (el) { el.click(); return true; } return false; };
  /* The launcher runs a row on the press itself (pointerdown, before its input
     can lose focus), as a mouse does — a bare click() would do nothing there. */
  const press = sel => {
    const el = d.querySelector(sel);
    if (!el) return false;
    el.dispatchEvent(new w.PointerEvent('pointerdown',
      { bubbles: true, cancelable: true, button: 0, isPrimary: true, pointerType: 'mouse' }));
    return true;
  };
  /* a window the way a person reaches it: its word in the bar, or the apps menu */
  const open = async id => {
    if (click(`#bar-task .bw[data-win="${id}"]`)) return;
    click('#mod-apps'); await sleep(220); press(`#row-win-${id}`);
  };
  /** Type into the launcher the way a person does, then Enter. */
  const type = async (text, mode) => {
    if (mode) { key('Tab', alt); await sleep(60); }
    const inp = d.getElementById('launch-input');
    if (!inp) return;
    inp.value = text;
    inp.dispatchEvent(new w.Event('input', { bubbles: true }));
    await sleep(80);
  };

  if (a === 'peek') key('KeyB', alt);
  if (a === 'unpeek') click('#peek-back');
  if (a === 'peekesc') { key('KeyB', alt); await sleep(120); key('Escape', { key: 'Escape' }); }
  if (a === 'launcher') key('Enter', alt);
  if (a === 'launcheresc') { key('Enter', alt); await sleep(200); key('Escape', { key: 'Escape' }); }
  if (a === 'launchrun') { key('Enter', alt); await sleep(220); await type('settings'); key('Enter', { key: 'Enter' }); }
  if (a.startsWith('launch:')) { key('Enter', alt); await sleep(220); await type(a.slice(7)); }
  if (a === 'keys') key('Slash', { key: '?', shiftKey: true });
  if (a === 'search') key('Slash', { key: '/' });
  if (a === 'rain') key('KeyR', Object.assign({ shiftKey: true }, alt));
  if (a === 'fx') key('KeyP', alt);
  if (a === 'next') key('BracketRight', { key: ']' });
  if (a === 'prev') key('BracketLeft', { key: '[' });
  if (a === 'float') key('KeyF', alt);
  if (a === 'monocle') key('KeyM', alt);
  if (a === 'hide') key('KeyZ', alt);
  if (a === 'close') key('KeyQ', alt);
  if (a === 'cycle') key('Tab', alt);
  if (a === 'rows') key('KeyM', Object.assign({ shiftKey: true }, alt));
  if (a === 'reorder') key('KeyL', Object.assign({ shiftKey: true }, alt));
  if (/^ws[1-4]$/.test(a)) key('Digit' + a.slice(2), alt);
  if (a === 'man') await open('man');
  if (a === 'goals') await open('system');
  if (a === 'settings') await open('settings');
  if (a === 'course') await open('course');
  if (a === 'session') await open('session');
  if (a === 'deck') click('#brand');
  await sleep(a ? (sleepMs == null ? 600 : sleepMs) : 0);
};
