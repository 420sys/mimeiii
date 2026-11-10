/* A session, read the way a learner reads it in the study: the page renders with
   its code in it, the scripts drawer beside it follows the step being read, the
   runbooks and probes tick real checkpoints in the outline, the URL and the
   keyboard walk the line, and none of it moves without saying so. One lesson at a time. */
import { test, expect, boot, key, activeWs, study, openGoals, readStep, stepMap, scriptsOut, scriptsAway, showScript } from './helpers.js';

const doc = '#study .doc';
const kicker = '#study .kicker';
const bench = '#study .st-bench';

test.describe('a session', () => {
  test('renders as a document: kicker, numbered code wells, Studio output', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await expect(page.locator('#study h1')).toHaveText('Your first variable');
    await expect(page.locator(kicker)).toContainText('stop 2.1');
    await expect(page.locator(kicker)).toContainText('variables');

    /* the code sits in the page, a numbered well per script */
    expect(await page.locator(`${doc} figure.code`).count()).toBeGreaterThanOrEqual(4);
    const well = page.locator(`${doc} figure.code[data-script='0']`);
    await expect(well.locator('.code-head .lang')).toHaveText('luau');
    await expect(well.locator('.cl').first()).toContainText('local coins = 10');
    await expect(well.locator('.cl .ln').first()).toHaveText('1');

    // the output panel is Studio's window, not more code: it sits under the script it follows
    const out = page.locator(`${doc} .out[data-out-for]`).first();
    const outFor = await out.getAttribute('data-out-for');
    expect(outFor, 'a script followed by an Output panel').not.toBeNull();
    await expect(out).toContainText('Server - Script:2');
    await expect(out.locator('.out-head')).toContainText('Output');
    // and the scripts drawer carries the same script with its output
    await showScript(page, +outFor);
    await expect(page.locator(`${bench} .wb-out .out`).first()).toContainText('Server - Script:2');
    await expect(page.locator(`${bench} .wb-out .out .out-head`).first()).toContainText('Output');
    expect(errors).toEqual([]);
  });

  test('the copy button puts the script on the clipboard', async ({ page, context, errors }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await boot(page, { hash: '#/2.1' });
    const copy = page.locator(`${doc} figure.code[data-script='0'] .copy`);
    await copy.click();
    await expect(copy).toHaveText('copied');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('local coins = 10');
    expect(errors).toEqual([]);
  });

  test('a solution is folded away until you ask for it', async ({ page }) => {
    await boot(page, { hash: '#/2.1' });
    const solution = page.locator(`${doc} details.solution`).first();
    await expect(solution).not.toHaveAttribute('open', '');
    await solution.locator('summary').click();
    await expect(solution).toHaveAttribute('open', '');
    await expect(solution.locator('figure.code')).toBeVisible();
  });

  test('a runbook ticks step by step, fills its meter and finishes the goal', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const cp0 = await page.evaluate(() => window.ossuary.cps());
    const book = page.locator(`${doc} .runbook[data-task='first-three']`);
    const steps = book.locator('.checks li');
    expect(await steps.count()).toBe(3);

    await steps.nth(0).click();
    await expect(steps.nth(0)).toHaveAttribute('aria-checked', 'true');
    await expect(book.locator('.hint')).toHaveText('1 of 3 done');

    await steps.nth(1).click();
    await steps.nth(2).click();
    await expect(book.locator('.hint')).toHaveText('all done — checkpoint reached');
    await expect(book).toHaveClass(/done/);

    const cp1 = await page.evaluate(() => window.ossuary.cps());
    expect(cp1).toBeGreaterThan(cp0);
    // the outline took the tick: one checkpoint lit, the pane's head counts on, and so did the checkbox in the goals pane
    await expect(page.locator('#study .ro-cp.done')).toHaveCount(1);
    await expect(page.locator('#study .rd-cp')).toHaveText('checkpoint 2 of 3');
    await openGoals(page);
    await expect(page.locator('.win[data-win="system"] .goal[aria-checked="true"]').first()).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a probe: a wrong pick explains itself and locks the question', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const probe = page.locator(`${doc} .probe[data-probe='p-first']`);
    await probe.scrollIntoViewIfNeeded();
    const opts = probe.locator('.opts button');
    await opts.nth(0).click();

    await expect(probe.locator('.verdict')).toBeVisible();
    await expect(probe.locator('.verdict')).toContainText('Not quite.');
    await expect(opts.nth(0)).toHaveClass(/wrong/);
    await expect(opts.nth(1)).toHaveClass(/right/);
    await expect(probe).toHaveClass(/missed/);
    for (const i of [0, 1, 2]) await expect(opts.nth(i)).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test('a probe: the right pick says so and ticks its goal', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.2' });
    const cp0 = await page.evaluate(() => window.ossuary.cps());
    const probe = page.locator(`${doc} .probe[data-probe='p-kinds']`);
    await probe.scrollIntoViewIfNeeded();
    await probe.locator('.opts button').nth(1).click();
    await expect(probe.locator('.verdict')).toContainText('Correct.');
    const cp1 = await page.evaluate(() => window.ossuary.cps());
    expect(cp1).toBeGreaterThan(cp0);
    await expect(probe.locator('.opts button').nth(1)).toHaveClass(/right/);
    expect(errors).toEqual([]);
  });

  test('[ and ] walk the written line, skipping the reference sheets', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await key(page, ']');
    await expect(page.locator(kicker)).toContainText('2.2');
    await key(page, ']');
    await expect(page.locator(kicker)).toContainText('2.3');
    await key(page, '[');
    await expect(page.locator(kicker)).toContainText('2.2');
    expect(page.url()).toContain('#/2.2');

    // the step nav at the foot of the lesson does the same
    await page.locator(`${doc} .stepnav .nx`).click();
    await expect(page.locator(kicker)).toContainText('2.3');
    expect(errors).toEqual([]);
  });

  test('the URL is the stop: a hash change opens it, a reference id opens the manual', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await page.evaluate(() => { location.hash = '#/4.1'; });
    await expect(page.locator(kicker)).toContainText('4.1');
    await page.evaluate(() => { location.hash = '#/cheat-3'; });
    await expect(page.locator('.win[data-win="man"] .win-t .nm')).toContainText('Decisions');
    expect(await activeWs(page)).toBe(3);
    expect(errors).toEqual([]);
  });

  test('one lesson at a time: the next one takes the page, nothing piles up', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await key(page, ']');
    await expect(page.locator(kicker)).toContainText('2.2');
    await expect(page.locator(`${doc} h1`)).toHaveCount(1);
    await expect(page.locator('#study .st-tabs, #study .tab')).toHaveCount(0);
    expect((await study(page)).lesson).toBe('2.2');
    await key(page, '[');
    await expect(page.locator(kicker)).toContainText('2.1');
    await expect(page.locator(`${doc} h1`)).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('the machine says what it opened — live region and journal', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await expect(page.locator('#live')).toContainText('Your first variable opened.');

    await openGoals(page, 'journal');
    const lines = page.locator('#journal-out .jline');
    await expect(lines.first()).toBeVisible();
    const all = await lines.allInnerTexts();
    expect(all.join(' | ')).toContain('2.1 Your first variable');
    expect(errors).toEqual([]);
  });

  test('ticking a step survives a reload', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const step = page.locator(`${doc} .runbook[data-task='first-three'] .checks li`).first();
    await step.click();
    await expect(step).toHaveAttribute('aria-checked', 'true');

    await page.reload();
    await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
    const again = page.locator(`${doc} .runbook[data-task='first-three'] .checks li`).first();
    await expect(again).toHaveAttribute('aria-checked', 'true');
    expect(errors).toEqual([]);
  });

  test('a lesson with a "done when" block gets the quiet treatment', async ({ page }) => {
    await boot(page, { hash: '#/2.1' });
    await expect(page.locator(`${doc} blockquote.done-when`).first()).toBeVisible();
    await expect(page.locator(`${doc} blockquote.done-when`).first()).not.toContainText('Done when');
  });

  test('the outline has an entry per step, named by its heading, and a checkpoint per goal', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const steps = page.locator(`${doc} .step:not(.step-intro)`);
    const n = await steps.count();
    expect(n).toBeGreaterThan(0);
    await expect(page.locator('#study .ro-step')).toHaveCount(n);
    const first = steps.first();
    const at = await first.getAttribute('data-step');
    const h2 = (await first.locator('h2').textContent()).trim();
    await expect(page.locator(`#study .ro-step[data-step="${at}"] .t`)).toHaveText(h2);
    await expect(page.locator('#study .ro-cp')).toHaveCount(3);
    await expect(page.locator('#study .ro-cp.done')).toHaveCount(0);
    expect((await study(page)).outline).toMatchObject({ steps: n, cps: 3, here: 0 });
    await expect(page.locator('#study .rd-n')).toHaveText('2.1');
    await expect(page.locator('#study .rd-cp')).toHaveText('checkpoint 1 of 3');
    await expect(page.locator(`${doc} .quest-head h1`)).toHaveText('Your first variable');
    expect(errors).toEqual([]);
  });

  test('a step in the outline carries you to it', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const n = await page.locator(`${doc} .step:not(.step-intro)`).count();
    await page.locator(`#study .ro-step[data-step="${n}"]`).click();
    await expect(page.locator(`${doc} .step[data-step="${n}"]`)).toHaveClass(/here/);
    await expect.poll(async () => (await study(page)).step).toBe(n);
    await expect(page.locator(`#study .ro-step[data-step="${n}"]`)).toHaveAttribute('aria-current', 'step');
    expect(errors).toEqual([]);
  });

  test('ticking every checkpoint finishes the lesson: the end of the page says so, and so does the pane\'s head', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const end = page.locator(`${doc} .st-end`);
    await expect(end.locator('.big')).toHaveText('3 checkpoints to go.');
    await expect(end.locator('.st-open .go[data-cp]')).toHaveCount(3);
    // answer the two probes the way a learner would
    for (const id of ['p-first', 'p-typo']) {
      await page.locator(`${doc} .probe[data-probe='${id}'] .opts button`).nth(1).dispatchEvent('click');
    }
    for (const task of ['first-three', 'first-sent', 'first-typo']) {
      const items = page.locator(`${doc} .runbook[data-task='${task}'] .checks li`);
      const c = await items.count();
      for (let i = 0; i < c; i++) await items.nth(i).dispatchEvent('click');
    }
    await expect(end).toHaveClass(/\bdone\b/);
    await expect(end.locator('.big')).toHaveText('That’s the lesson.');
    await expect(end.locator('.st-k')).toContainText('3 of 3 checkpoints');
    await expect(end.locator('.go[data-act="desk"]')).toBeVisible();
    await expect(end.locator('.st-next')).toContainText('The sign will show');
    await expect(page.locator('#study .ro-cp.done')).toHaveCount(3);
    await expect(page.locator('#study .rd-cp')).toHaveText('all 3 checkpoints');

    // a finished lesson opened again says so straight away
    await page.reload();
    await page.waitForFunction(() => window.ossuary && !document.body.classList.contains('booting'));
    await expect(page.locator(`${doc} .st-end .big`)).toHaveText('That’s the lesson.');
    await expect(page.locator('#study .rd-cp')).toHaveText('all 3 checkpoints');
    expect(errors).toEqual([]);
  });

  test('hovering an engine name shows the glossary tooltip', async ({ page, errors }) => {
    // 2.1 only calls print(); 2.4 reads workspace and Color3, which become glossary terms
    await boot(page, { hash: '#/2.4' });
    /* the code is in the page: the first script that holds a glossary term */
    const k = await page.locator(`${doc} figure.code[data-script]:has(.g-term)`).first().getAttribute('data-script');
    expect(k, 'a script with a glossary term').not.toBeNull();
    const term = page.locator(`${doc} figure.code[data-script='${k}'] .g-term`).first();
    await term.scrollIntoViewIfNeeded();
    await expect(term).toBeVisible();
    const name = await term.getAttribute('data-g');
    const text = await page.evaluate(async n => (await import('/src/data/glossary.js')).GLOSSARY[n], name);
    const tip = page.locator('.g-tip');
    /* a scroll hides the tip by design, so let the opening scroll finish and hover until it sticks */
    await expect(async () => {
      await page.mouse.move(2, 2);
      await term.hover();
      await expect(tip).toBeVisible({ timeout: 500 });
    }).toPass();
    await expect(tip).toContainText(text);
    await expect(tip.locator('b')).toHaveText(name);
    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('a line note shows beside its line and never lands in the code text', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const k = await page.locator(`${doc} figure.code[data-script]:has(.cl.has-note)`).first().getAttribute('data-script');
    expect(k, 'a script with a line note').not.toBeNull();
    const line = page.locator(`${doc} figure.code[data-script='${k}'] .cl.has-note`).first();
    await expect(line).toHaveCount(1);
    await expect(line.locator('.ln-note')).not.toBeEmpty();
    await line.scrollIntoViewIfNeeded();
    await expect(line.locator('.ln-note')).toBeHidden();       // in the page a note folds under its line until asked for
    await line.hover();
    await expect(line.locator('.ln-note')).toBeVisible();
    await page.mouse.move(2, 400);
    await line.focus();                                        // the keyboard asks the same way
    await expect(line.locator('.ln-note')).toBeVisible();
    // and the workbench keeps them too
    await showScript(page, +k);
    await expect(page.locator(`${bench} .wb-code .cl.has-note .ln-note`).first()).toBeVisible();
    expect(await line.locator('.tx').innerText()).not.toContain('@n');
    expect(errors).toEqual([]);
  });
});

/* ── the scripts drawer beside the page: the workbench follows the step being read ── */
test.describe('the study', () => {
  test('the workbench follows the step being read', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const withCode = (await stepMap(page)).filter(s => s.scripts > 0);
    expect(withCode.length, 'steps that hold scripts').toBeGreaterThan(0);
    for (const s of withCode) {
      await readStep(page, s.n);
      const info = await study(page);
      expect(info.lesson).toBe('2.1');
      expect(info.kind).toBe(s.kind);
      expect(info.borrowed, `step ${s.n} shows its own code`).toBe(false);
      expect(info.scripts).toBe(s.scripts);
      await expect(page.locator('#study .wb-tab')).toHaveCount(s.scripts);
      await expect(page.locator(`${bench} .wb-step`)).toContainText(`STEP ${String(s.n).padStart(2, '0')}`);
    }
    expect(errors).toEqual([]);
  });

  test('a step with no code borrows the nearest earlier step\'s and says so', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const map = await stepMap(page);
    const bare = map.find(s => s.n > 0 && s.scripts === 0 && map.some(e => e.n < s.n && e.scripts > 0));
    expect(bare, 'a step without code that follows one with code').toBeTruthy();
    const from = map.filter(e => e.n < bare.n && e.scripts > 0).pop();

    await readStep(page, bare.n);
    const info = await study(page);
    expect(info.borrowed).toBe(true);
    expect(info.scripts).toBe(from.scripts);
    await expect(page.locator('#study .wb-tab')).toHaveCount(from.scripts);
    // the drawer is put away until it is wanted; out, it says where the code it shows comes from
    await scriptsOut(page);
    await expect(page.locator(`${bench} .wb-src`)).toBeVisible();
    await expect(page.locator(`${bench} .wb-src`)).toHaveText(`from step ${String(from.n).padStart(2, '0')}`);
    expect(errors).toEqual([]);
  });

  test('a tick in the workbench task ticks the stage runbook, and the reverse', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const s = (await stepMap(page)).find(x => x.book);
    expect(s, 'a step with a runbook').toBeTruthy();
    await readStep(page, s.n);
    await scriptsOut(page);
    const stage = page.locator(`${doc} .step[data-step='${s.n}'] .runbook .checks li`);
    const mirror = page.locator(`${bench} .wb-task .checks li`);
    await expect(mirror).toHaveCount(await stage.count());
    // on a short screen the mirror folds to one line rather than squeeze the code: open it to tick
    if (!(await mirror.first().isVisible())) await page.locator(`${bench} .wb-sum`).click();
    await expect(mirror.first()).toBeVisible();

    await mirror.nth(0).click();
    await expect(stage.nth(0)).toHaveAttribute('aria-checked', 'true');
    await expect(mirror.nth(0)).toHaveAttribute('aria-checked', 'true');

    await scriptsAway(page);                                   // the page's own runbook, with the scripts put away
    await stage.nth(1).click();
    await expect(stage.nth(1)).toHaveAttribute('aria-checked', 'true');
    await scriptsOut(page);
    await expect(mirror.nth(1)).toHaveAttribute('aria-checked', 'true');
    expect(errors).toEqual([]);
  });

  test('a step with two scripts gives the workbench a tab for each', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    const two = (await stepMap(page)).find(x => x.scripts > 1);
    expect(two, 'a step with more than one script').toBeTruthy();
    await readStep(page, two.n);
    await scriptsOut(page);
    const tabs = page.locator(`${bench} .wb-tab`);
    await expect(tabs).toHaveCount(two.scripts);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    const firsts = await page.locator(`${doc} .step[data-step='${two.n}'] figure.code[data-script]`)
      .evaluateAll(fs => fs.map(f => f.querySelector('.cl .tx').textContent.trim()));
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`${bench} .wb-code .cl .tx`).first()).toHaveText(firsts[1]);
    expect(errors).toEqual([]);
  });

  test('the pane\'s head names the open stop, and the foot of the outline knows the lessons either side', async ({ page, errors }) => {
    await boot(page, { hash: '#/2.1' });
    await expect(page.locator('#study .rd-n')).toHaveText('2.1');
    await expect(page.locator('#study .rd-t')).toHaveText('Your first variable');
    expect((await study(page)).lesson).toBe('2.1');

    await key(page, ']');
    await expect(page.locator('#study .rd-n')).toHaveText('2.2');
    await expect(page.locator('#study .ro-title .n')).toHaveText('2.2');
    expect((await study(page)).lesson).toBe('2.2');
    await expect(page.locator('#study .ro-prev')).toHaveAttribute('data-go', '2.1');
    await expect(page.locator('#study .ro-next')).toHaveAttribute('data-go', '2.3');
    expect(errors).toEqual([]);
  });
});
