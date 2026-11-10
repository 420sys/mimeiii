/* Lesson 3.1, "Comparing values": the first three steps, word for word from
   content/unit-3.md (md-3.1), with its probes from PREDICTS and its runbook from
   TASKS in src/data/course.js. The outline lists all seven steps; the prototypes
   only set the first three, which is enough to judge a reading page.
   Nothing here was reworded to fit a design.                                  */

export const LESSON = {
  id: '3.1',
  unit: 3,
  unitTitle: 'Decisions',
  title: 'Comparing values',
  mins: 12,
  checkpoints: [
    'Print six comparisons and read the answers',
    'Predict whether 10 == "10"',
    'Store a comparison in a boolean variable',
    'Write the health check yourself',
  ],
  /* kind: what the step asks of you. cps: the checkpoints it holds (0-based). */
  steps: [
    { n: 1, kind: 'read',  title: 'A question with a yes or no answer' },
    { n: 2, kind: 'do',    title: 'One equals sign or two', cps: [0, 1] },
    { n: 3, kind: 'read',  title: 'Keeping the answer' },
    { n: 4, kind: 'do',    title: 'Comparing Roblox things', cps: [2] },
    { n: 5, kind: 'read',  title: 'Some things cannot be compared' },
    { n: 6, kind: 'read',  title: 'Fix the bug' },
    { n: 7, kind: 'build', title: 'Your turn', cps: [3] },
  ],
  here: 2, // the step the demo learner is reading
  blocks: [
    { t: 'p', html: 'Every game is full of questions. Does the player have enough coins? Is it night yet? Is health below zero? Before a script can <em>decide</em> anything, it has to be able to <em>ask</em>. This lesson is about asking.' },
    {
      t: 'probe', id: 'p3-warm1', recall: '2.3', picked: 1,
      code: ['local coins = 10', 'coins += 5', 'print(`You have {coins} coins`)'],
      q: 'From memory — what will the Output window show?',
      options: ['You have 10 coins', 'You have 15 coins', 'You have {coins} coins'],
      answer: 1,
      why: '<code>+= 5</code> adds 5 to whatever <code>coins</code> holds, so it becomes 15. Backticks put the value of <code>coins</code> where the curly brackets are.',
    },

    { t: 'step', n: 1 },
    { t: 'p', html: 'You have used <code>&gt;</code> in maths. In Luau it asks a question, and the answer is a boolean — <code>true</code> or <code>false</code>:' },
    { t: 'code', lines: [{ c: 'print(5 > 3)' }, { c: 'print(5 > 8)' }] },
    { t: 'output', lines: [['true', 'Server - Script:1'], ['false', 'Server - Script:2']] },
    { t: 'p', html: '<code>5 &gt; 3</code> is not an instruction. It is a question — <em>is 5 bigger than 3?</em> — and Luau replaces it with the answer. That is all a comparison ever does: it turns into <code>true</code> or <code>false</code>.' },
    { t: 'p', html: 'There are six of them:' },
    {
      t: 'table', head: ['', 'asks', 'gives <code>true</code> for'],
      rows: [
        ['<code>==</code>', 'is it the same?', '<code>5 == 5</code>'],
        ['<code>~=</code>', 'is it different?', '<code>5 ~= 3</code>'],
        ['<code>&gt;</code>', 'bigger?', '<code>5 &gt; 3</code>'],
        ['<code>&lt;</code>', 'smaller?', '<code>3 &lt; 5</code>'],
        ['<code>&gt;=</code>', 'bigger or the same?', '<code>5 &gt;= 5</code>'],
        ['<code>&lt;=</code>', 'smaller or the same?', '<code>3 &lt;= 5</code>'],
      ],
    },
    { t: 'p', html: '<code>~=</code> is the odd one out. Many languages write <em>not equal</em> as <code>!=</code>, but Luau uses a wavy line: <code>~=</code>. The <code>~</code> key is usually next to the backtick key.' },
    { t: 'key', html: 'A comparison is a question, and Luau replaces it with the answer: <code>true</code> or <code>false</code>.' },

    { t: 'step', n: 2 },
    { t: 'p', html: 'You already know <code>=</code> from the variables unit. It <strong>puts a value in a box</strong>. To ask whether two things are the same, Luau uses <strong>two</strong> of them:' },
    {
      t: 'code', lines: [
        { c: 'local coins = 10        -- one =  : put 10 in the box' },
        { c: 'print(coins == 10)      -- two == : is the box holding 10?' },
        { c: 'print(coins == 25)' },
      ],
    },
    { t: 'output', lines: [['true', 'Server - Script:2'], ['false', 'Server - Script:3']] },
    { t: 'p', html: 'Mixing them up is the most common mistake in this unit. Read <code>=</code> as <em>becomes</em> and <code>==</code> as <em>is the same as</em>, and you will rarely get them wrong.' },
    {
      t: 'probe', id: 'p3-same', cp: 1, picked: 1,
      code: ['print(10 == "10")'],
      q: 'What will the Output window show? Pick before you press Play.',
      options: ['true', 'false', 'an error'],
      answer: 1,
      why: 'One is a number and one is a string, so they are not the same value. <code>==</code> never errors on different types — it just says <code>false</code>.',
    },
    { t: 'p', html: 'Types matter here, just like they did with <code>..</code> and <code>+</code>. A number and a string are never the same value, even when they look alike. The same goes for capitals: <code>"Ada" == "ada"</code> is <code>false</code>, because a capital A is a different letter as far as Luau is concerned.' },
    {
      /* Two of three ticked: tick the last one and checkpoint 1 is reached. */
      t: 'task', id: 'u3-compare', title: 'Ask some questions', cp: 0,
      items: [
        ['Print <code>5 &gt; 3</code>, <code>5 == 5</code> and <code>5 ~= 5</code> and check your Output says <code>true</code>, <code>true</code>, <code>false</code>', true],
        ['Print <code>10 == "10"</code> and see <code>false</code>', true],
        ['Print <code>"Ada" == "ada"</code> — then make it <code>true</code> by changing one letter', false],
      ],
    },
    { t: 'key', html: 'One <code>=</code> puts a value in a box, and two <code>==</code> ask whether two values are the same.' },

    { t: 'step', n: 3 },
    { t: 'p', html: 'A comparison gives you a value, so you can put that value in a variable, just like a number:' },
    {
      t: 'code', lines: [
        { c: 'local coins = 120' },
        { c: 'local price = 100' },
        { c: '' },
        { c: 'local canAfford = coins >= price', note: 'the answer is stored, not the two numbers' },
        { c: 'print(`Can afford it: {canAfford}`)' },
        { c: 'print(typeof(canAfford))', note: 'so the answer to a comparison really is a boolean' },
      ],
    },
    { t: 'output', lines: [['Can afford it: true', 'Server - Script:5'], ['boolean', 'Server - Script:6']] },
    { t: 'p', html: 'Luau works out the right side of <code>=</code> first, as always. <code>coins &gt;= price</code> becomes <code>true</code>, and <code>true</code> goes into <code>canAfford</code>.' },
    { t: 'p', html: 'Good names for boolean variables read like a yes-or-no question: <code>canAfford</code>, <code>isNight</code>, <code>hasKey</code>, <code>isVip</code>. When you see <code>if canAfford</code> in the next lesson, it will read almost like English.' },
    { t: 'key', html: 'The answer to a comparison is a value, so you can keep it in a boolean variable.' },
  ],
};

/* In the demo the learner got the second probe right, so checkpoint 2 of 4
   ("Predict whether 10 == "10"") is the one already reached. */
export const REACHED = [false, true, false, false];
