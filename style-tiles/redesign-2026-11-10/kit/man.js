/* The decisions cheatsheet (man luau-decisions), word for word from
   content/unit-3.md (md-cheat-3). Nothing was reworded to fit a design. */

export const MAN = {
  name: 'LUAU-DECISIONS(3)',
  book: 'MIMEI manual',
  topic: 'decisions',
  page: 2,
  pages: 11,
  title: 'Decisions cheatsheet',
  lede: 'Everything from the decisions unit on one page. Keep it open next to Studio.',
  sections: [
    {
      h: 'Comparing',
      blocks: [
        { t: 'table', head: ['', 'asks', 'example'], rows: [
          ['<code>==</code>', 'the same?', '<code>coins == 10</code>'],
          ['<code>~=</code>', 'different?', '<code>name ~= "Ada"</code>'],
          ['<code>&gt;</code> <code>&lt;</code>', 'bigger? smaller?', '<code>health &lt; 25</code>'],
          ['<code>&gt;=</code> <code>&lt;=</code>', 'or the same?', '<code>level &gt;= 5</code>'],
        ] },
        { t: 'p', html: 'Every comparison turns into <code>true</code> or <code>false</code>, so you can store it:' },
        { t: 'code', lines: [{ c: 'local canAfford = coins >= price' }] },
      ],
    },
    {
      h: 'if, elseif, else',
      blocks: [
        { t: 'code', lines: [
          { c: 'if score >= 90 then' },
          { c: '\tprint("Gold")' },
          { c: 'elseif score >= 70 then', note: 'only checked if the line above was false' },
          { c: '\tprint("Silver")' },
          { c: 'else', note: 'when nothing above was true' },
          { c: '\tprint("Keep going")' },
          { c: 'end' },
        ] },
        { t: 'ul', items: [
          'Checked top to bottom. The <strong>first</strong> true path runs, then it jumps to <code>end</code>.',
          'Put the hardest question first.',
          '<code>elseif</code> and <code>else</code> are optional. <code>end</code> is not.',
        ] },
      ],
    },
    {
      h: 'Joining questions',
      blocks: [
        { t: 'table', head: ['', 'true when'], rows: [
          ['<code>a and b</code>', 'both are true'],
          ['<code>a or b</code>', 'at least one is true'],
          ['<code>not a</code>', '<code>a</code> is false'],
        ] },
        { t: 'code', lines: [
          { c: 'if isVip or (isNight and hasLantern) then' },
          { c: 'if not (coins > 10) then', note: 'brackets, so the > happens first' },
          { c: 'if weapon == "Sword" or weapon == "Axe" then', note: 'a whole question each side' },
        ] },
      ],
    },
    {
      h: 'What counts as true',
      blocks: [
        { t: 'p', html: 'Only <code>false</code> and <code>nil</code> count as false. Everything else — including <code>0</code> and <code>""</code> — counts as true.' },
        { t: 'code', lines: [
          { c: 'if playerName then', note: 'is there anything in it at all?' },
          { c: 'local speed = customSpeed or 16', note: 'use customSpeed, or 16 if it is nil' },
        ] },
      ],
    },
    {
      h: 'Random numbers',
      blocks: [
        { t: 'code', lines: [
          { c: 'local roll = math.random(1, 6)', note: 'whole number, 1 to 6, both included' },
          { c: 'local roll = 99', note: 'fix it while testing a path' },
        ] },
      ],
    },
    {
      h: 'Messages you will see',
      blocks: [
        { t: 'table', head: ['in Output or on hover', 'usually means'], rows: [
          ['<em>Expected \'then\' when parsing if statement</em>', 'you forgot <code>then</code> — or wrote <code>=</code> instead of <code>==</code>'],
          ['<em>Expected \')\' ... got \'=\'</em>', '<code>=</code> inside brackets where you meant <code>==</code>'],
          ['<em>attempt to compare number &lt; string</em>', 'a size comparison with text — check for quotes'],
          ['<em>attempt to compare ... boolean</em>', 'usually <code>not x &gt; y</code> — add brackets'],
          ['an <code>if</code> that always runs', '<code>x == "a" or "b"</code> — each side needs its own <code>==</code>'],
          ['<em>Expected \'end\'</em>', 'an <code>if</code> without its <code>end</code>'],
        ] },
      ],
    },
    {
      h: 'The rules',
      blocks: [
        { t: 'ol', items: [
          '<code>=</code> puts a value in a box. <code>==</code> asks if two values are the same.',
          'Not equal is <code>~=</code>.',
          'A number and a string are never equal: <code>10 == "10"</code> is <code>false</code>.',
          '<code>if</code> runs the first true path only, so order matters.',
          'Only <code>false</code> and <code>nil</code> are false. <code>0</code> is true.',
          'Each side of <code>and</code> / <code>or</code> is a whole question.',
          '<code>x or default</code> gives a value when <code>x</code> is missing.',
        ] },
      ],
    },
  ],
};
