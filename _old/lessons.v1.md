<!-- ════════════════════════════════════════════════════════════════════
     LESSON BODIES
     Each one lives in a hidden div and is pulled into the editor window
     by app.js. The special fences are:

       ```lua lab=id       a live editor + terminal + checks
       ```lua predict=id   a multiple-choice guess, answered inline

     Both are lifted out of the markdown before it is parsed, so they can
     never collide with ordinary code fences. The config for each one —
     solutions, hints, checks, answers — lives in LABS and PREDICTS in
     app.js. The fence body is the starter code (or the question).
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ home ═══════════════════════════ -->
<div id="md-home" hidden>
# Learn Luau from nothing

No sign-up, no install, no prior code. If you can use a web browser, you can
start — and the editor in every lesson is a real Luau interpreter running on
this page.

You will not be reading about code. You will be writing it, from the first
lesson, and the checks under each editor tell you plainly whether it works.

## How a lesson works

Each one has the same three parts:

- **The prose.** Short. It explains one idea at a time, and every claim has a
  working example you can run right there.
- **The editor.** Type, press **run**, read what came back. Nothing is graded
  until the checks say so, and nothing breaks that you cannot undo with
  **reset**.
- **The checks.** A short list that ticks itself off. When they all pass, the
  goal in the panel on the right lights up and your progress saves to this
  browser.

You cannot break anything. That is the point — this is the one place where the
fastest way to understand something is to do it wrong and read the message.

## Where to go

| | |
|---|---|
| **0.1 — Hello, computer** | start here. One command, and the first thing you will break on purpose. |
| **0.2 — Boxes with names** | variables, which is where a program starts being a program |
| **Scratchpad** (down in the dock) | an empty page with a working interpreter |
| **Cheatsheet** | every bit of syntax the course has covered, on one page |

## What this is, and what it is not

This is the **Luau language** — the one Roblox runs. Variables, text, numbers,
conditions, loops, tables, functions. Everything you learn here transfers
directly to a Roblox script.

It is not Roblox itself. There is no `game`, no `workspace`, no `Instance` and
no 3D — those are engine features, not language features, and they are a
different course. What is here is the part that stays the same no matter what
you build with it.

## Two habits worth starting now

**Predict before you run.** Every lesson has a *predict first* block that asks
you to commit to an answer before you see it. Guessing wrong and finding out why
teaches you about ten times more than reading the right answer does.

**Break things on purpose.** Change a number, delete a word, swap two lines.
The error messages in this interpreter are written to be read, not deciphered.

---

When you are ready, open **0.1** from the tree on the left. It takes about six
minutes and you will have written and run your first program before the end of
it.
</div>


<!-- ═══════════════════════════ 0.1 ═══════════════════════════ -->
<div id="md-0.1" hidden>
# Hello, computer

Nothing to install. Nothing to sign up for. The editor below the text is a real
Luau interpreter, running in this page — when you press **run**, the code you
typed executes and you see exactly what it printed.

That is the whole loop. Write a line, run it, look at what came back. Every
lesson from here works the same way.

## Talking to the machine

`print` is a command that means *say this out loud*. Whatever you put between
the brackets is what comes back:

```lua
print("Hello, world!")
```

The quotes are not decoration. They are the part of the instruction that says
*this is text, not an instruction*. Leave them off and the computer goes looking
for a box named `Hello` instead.

```lua predict=p1
print("Hello")
```

## Joining two things

Two dots sit between two pieces of text and glue them together:

```lua
print("Hello, " .. "world!")
```

The dots are called the **concatenation operator** — a long name for "put these
next to each other". Note where the spaces are: inside the quotes. The computer
copies exactly what you typed, spaces and all.

```lua predict=p3
print("5" .. "5")
```

That one is worth staring at. Two fives went in. `"55"` came out, not 10.
Quoting a number makes it text, and `..` on two pieces of text always gives you
back more text.

## Your first lab

```lua lab=hello
-- say hello to the whole world
print()
```

Below the editor is a list of **checks**. They run every time you press run, and
they are the honest answer to *did I get it right* — more reliable than a feeling.
Aim for all of them passing.

## Breaking it on purpose

The fastest way to learn what a language thinks is to hand it something wrong and
read what it says back. Do that now: the line below references a name that was
never made.

```lua lab=oops
print("before")
-- now write a line that prints something that does not exist
```

Notice that `before` still printed. The program ran in order, top to bottom, and
stopped at the exact line that went wrong. Errors here always come with a line
number, and the line number is the single most useful thing on the screen.

## Two lines, one at a time

There is no upper limit on how many lines you write. Each `print` is its own
instruction, and they run in the order you put them.

```lua lab=greettwo
-- two lines: your name, then "was here."
```

## Now this one

Joining lets you build a sentence out of a fixed part and a variable part —
which is the thing that makes a program a program, rather than a sign.

```lua lab=join
local who = "world"

-- join the two pieces with ..
print()
```

That `local who = "world"` line is a box with a name on it. It gets its own
lesson, and it is the next one.

> **Done when** every check passes on all four labs above. If you skipped one,
> scroll back up — they build on each other.
</div>


<!-- ═══════════════════════════ 0.2 ═══════════════════════════ -->
<div id="md-0.2" hidden>
# Boxes with names

A program that cannot remember anything is a program that can only do one thing
once. Variables are how it remembers.

## Making a box

```lua
local score = 42
```

Read that as three parts. `local` means *make a new box*. `score` is what the box
is called. `42` is what you put in it. The equals sign is the act of putting, not
a statement of fact — it means *put the thing on the right into the box on the
left*, and nothing more.

```lua predict=p2
local score = 42
print(score)
```

The box is called `score`. It contains the number 42. Those are two different
things, and telling them apart is most of what this lesson is about.

```lua lab=box
-- make a box called score holding 42

print()
```

## Changing what is inside

A box holds one thing at a time. Assign to it again and the old value is gone —
not archived, not hidden, just gone:

```lua
local score = 42
score = 100
```

No `local` the second time. `local` would mean *make a second box*, and now you
have two boxes with the same name and a very confusing afternoon. Without it, the
line reaches for the box that already exists and swaps out the contents.

```lua lab=change
local score = 42
-- change it to 100

print(score)
```

## The swap

Here is the classic, and it catches almost everyone: you have two boxes and you
want their contents exchanged.

```lua
local a = "tea"
local b = "coffee"

a = b   -- the tea is gone forever
b = a   -- now both boxes say coffee
```

The tea did not move. It was overwritten. Pouring one cup into another does not
swap them, it just loses the first one — so you reach for a third cup.

```lua lab=swap
local a = "tea"
local b = "coffee"

-- swap them

print(a)
print(b)
```

## Why `local` is not optional

Without `local`, an assignment does not make a box in your file. It makes one in
the shared space that every script in a Roblox place can see — and every script
in the place can also *overwrite*. Two scripts that both write `score = 0` at the
top of a level are fighting over one box.

Roblox's own engine exposes hundreds of names that way: `game`, `workspace`,
`print`. Your names should not join them. `local` keeps your box yours, and the
habit costs you seven characters and saves you a genuinely awful class of bug.

## Reading between the quotes

Put quotes around something and it stops being a number:

```lua
local a = 4      -- the number 4
local b = "4"    -- a piece of text that happens to look like a 4
```

`a + 1` gives 5. `b + 1` also gives 5 — because Luau quietly reads text that
looks like a number when the surrounding instruction needs a number. It is a
forgiving language about that, and forgiveness has a cost. `a .. "!"` gives
`4!` and `b .. "!"` gives `4!`, and now you cannot tell which one you had.

## Putting it to work

Everything so far, in one small thing that is recognisably a program:

```lua lab=receipt
local item  = "notebook"
local price = 4
local count = 3

-- work out the total, then print the item and the total
```

`price * count` is a calculation sitting on the right of an `=` — the box on the
left receives whatever it works out to. That is how almost every number in a
program gets made.

> **Done when** all five labs pass. The receipt one is the one that matters; the
> rest are the parts it is made of.
</div>


<!-- ═══════════════════════════ 0.3 ═══════════════════════════ -->
<div id="md-0.3" hidden>
# Numbers you can bend

Six operators, one surprise, and a bug to hunt.

## The obvious four

```lua
print(7 + 3)   -- 10
print(7 - 3)   -- 4
print(7 * 3)   -- 21
print(7 / 2)   -- 3.5
```

`*` is multiply, `/` is divide, and division does not round. `7 / 2` is `3.5`,
not `3`. If you want a whole number you ask for one, which is the subject of
lesson 0.7.

## The leftover

`%` gives you the remainder after dividing — what is left over when you take out
as many whole copies as fit.

```lua
print(10 % 3)   -- 1   (three 3s make 9, one left over)
print(12 % 4)   -- 0   (three 4s make 12 exactly, nothing left)
```

It looks like a toy. It is not. Remainder is how you find out whether a number is
even (`n % 2 == 0`), how you make a value wrap around after it hits a ceiling,
and how you lay things out in a grid.

```lua lab=mod
print(10 % 3)
-- and what is 12 % 4?
```

## Order of operations

Old rules apply: multiply and divide happen before add and subtract, and
brackets overrule everything.

```lua
print(2 + 3 * 4)     -- 14, not 20
print((2 + 3) * 4)   -- 20
```

There is a second set of rules you have not met yet, and it is the one that bites:
`..` the joining operator from lesson 0.1 is **weaker** than arithmetic. So

```lua
print("total: " .. apples + price)
```

does the `+` first and the joining second, giving `total: 9`. That is the
behaviour you want here — but it is worth knowing it is a rule you are relying on
rather than a coincidence.

```lua predict=p4
print("5" + 5)
```

Text that looks like a number is read as a number when the instruction is
arithmetic. So `"5"` plus `5` is `10`. It is the same forgiveness from lesson
0.2, and it explains why `"5" .. "5"` is `"55"` while `"5" + 5` is `10`: `..`
never converts anything to text, and `+` always does.

## The broken calculator

This one runs without complaining and gives the wrong answer, which is the worst
kind of bug. Find it.

```lua lab=fixcalc
local apples = 6
local price  = 3

print(apples + price)              -- wrong
print("total: " .. apples + price)
```

The interpreter will not help you here. Nothing crashed — the arithmetic is
correct, it is just answering a question nobody asked. This is what most real
bugs look like: working code, wrong result.

## Now the four operators

```lua lab=math
-- four lines: + , - , * and /
```

> **Done when** all three labs pass and you can say, without checking, why
> `"5" .. "5"` and `"5" + 5` disagree.
</div>


<!-- ═══════════════════════════ 0.4 ═══════════════════════════ -->
<div id="md-0.4" hidden>
# Yes or no

So far every line has run. The next step is a line that *decides* — and the
interesting part is not the deciding, it is what counts as a yes.

## true and false

Two values, spelled `true` and `false`. Nothing else. They are not the words
*tru* and *fals*, and they are not the strings `"true"` and `"false"` — that
distinction will matter in a minute.

Comparing two things gives you one of them back:

```lua
print(5 > 3)      -- true
print(5 == 3)     -- false
print(5 ~= 3)     -- true   (~= means "is not equal to")
print(5 >= 5)     -- true
```

Note `=` versus `==`. One equals assigns, two equals asks. Writing `if x = 5`
does not compare, it *overwrites x with 5* then complains the result was not a
yes-or-no. This is the single most common typo in the language.

## The one place Luau is fussy

In a condition, exactly two values are treated as "no": `false` and `nil`.
Everything else is a yes. Not just `true`:

```lua
if 0 then print("yes") end      -- yes. Zero is a yes.
if "" then print("yes") end     -- yes. Empty text is a yes.
if "false" then print("yes") end-- yes. The word is a yes.
```

That last one trips up everyone coming from a language where `"false"` might be
special. It is not. It is a non-empty piece of text, and text is a yes.

```lua predict=p5
local score = 80
if score > 100 then
  print("big")
else
  print("small")
end
```

## Making a decision

```lua
local age = 15

if age >= 18 then
  print("come in")
else
  print("not yet")
end
```

`if` opens the question, `then` opens the work, `else` opens the alternative, and
`end` closes the whole thing. That `end` is not optional and it is not matched by
anything — it just marks where the decision stops. Forget it and the error says
*tried to find 'end'*.

The indentation is for you, not for the computer. Get it right anyway.

```lua lab=gate
local age = 15

-- change this to 18 or more and read what changes
-- if age is 18 or over: print "come in"
-- otherwise: print "not yet"
```

## More than two answers

`elseif` chains extra questions on, and the computer takes the **first** one that
is true, then skips the rest entirely:

```lua
if score >= 90 then
  print("A")
elseif score >= 80 then
  print("B")
elseif score >= 70 then
  print("C")
else
  print("F")
end
```

Order matters. Check the strictest case first. Put `score >= 70` at the top and a
score of 95 lands on `C`, because that is the first question that came back true.

## and, or, not

Three words that combine conditions:

- `a and b` — a yes only if *both* are yes
- `a or b` — a yes if *either* is yes
- `not a` — flips it

```lua
if age >= 18 and hasId then
  print("come in")
end
```

`and` and `or` are lazy. In `a and b`, if `a` is a no, then `b` is never even
looked at. This is not an optimisation, it is a guarantee you can build on: it is
why `if list and list[1] then` is safe — when `list` is missing, the look-up on
the right never runs.

They also do not produce `true` and `false`. They hand back one of the values
they were given. `0 and false` is `false`. `nil or "backup"` is `"backup"`.

```lua predict=p6
print(0 and false)
```

```lua lab=both
local age   = 20
local hasId = true

-- both things must be true
```

## A real gate

Chain the questions the way a ticket desk would:

```lua lab=ticket
local age   = 15
local hasId = true

-- under 13: "child ticket"
-- under 18: "teen ticket"
-- otherwise: "adult ticket"
```

> **Done when** all three labs pass and you have seen for yourself that `0`,
> `""` and `"false"` are all yeses.
</div>


<!-- ═══════════════════════════ 0.5 ═══════════════════════════ -->
<div id="md-0.5" hidden>
# Again and again

The computer's one real advantage is that it never gets bored. Loops are how you
hand it something tedious and walk away.

## Walking a range

```lua
for i = 1, 5 do
  print(i)
end
```

Four parts: the name `i`, a start, a stop, and `end`. The body runs five times.
`i` is 1 the first time, 2 the second, 5 the last — and the loop stops by itself
when it passes the stop. You do not bump `i`, you do not check it, you do not
write the `end` condition.

`i` here is not a real variable you made. It is the loop's own counter, and it is
only valid between the `do` and the `end`.

```lua predict=p7
for i = 1, 3 do
  print(i)
end
```

## Starting from anywhere

```lua
for i = 0, 10, 2 do     -- 0, 2, 4, 6, 8, 10
for i = 5, 1, -1 do     -- 5, 4, 3, 2, 1
```

The third number is the step. Positive counts up, negative counts down, and
leaving it out means 1. A step of `0` would never reach the end, so it is
refused rather than left to hang — a small kindness the language does for you.

```lua lab=count
-- print 1 through 5
```

## While

When the number of turns is not known in advance, you ask instead of counting:

```lua
local fuel = 3
while fuel > 0 do
  print("fuel: " .. fuel)
  fuel = fuel - 1
end
print("empty")
```

The condition is checked *before* each turn. Something inside the body has to
change, or the condition stays true and the loop runs until it is stopped. The
interpreter on this page will give up on you with a message rather than freezing
your browser — but the machine you are learning to write for would not, so the
habit is worth building here.

`repeat ... until` is the same idea with the check at the *end*, which means the
body always runs at least once:

```lua
repeat
  print("at least once")
until true
```

## Interrupting

`break` leaves a loop immediately:

```lua
for i = 1, 100 do
  if i == 4 then break end
  print(i)
end
```

Prints 1, 2, 3 and stops. Useful when you found what you came for and there is no
point looking at the remaining ninety-six.

```lua lab=down
-- count 3, 2, 1, then say liftoff
```

> **Done when** both labs pass. The countdown needs the step argument from above,
> which is the point of it.
</div>


<!-- ═══════════════════════════ 0.6 ═══════════════════════════ -->
<div id="md-0.6" hidden>
# Lists of things

Six variables is fine. Six hundred needs a different shape.

## A list

```lua
local pets = {"cat", "dog", "fish"}
```

Braces make a table. Inside, values separated by commas land at positions
**starting at one** — not zero. `pets[1]` is `"cat"`. `pets[3]` is `"fish"`.
`pets[0]` is not an error; it is simply nothing, and printing nothing gives you
`nil`, which is what Luau calls "there is no value here".

`#` asks how many items a list holds:

```lua
print(#pets)   -- 3
```

```lua predict=p8
local pets = {"cat", "dog", "fish"}
print(#pets)
```

## Walking a list

```lua
for i, pet in ipairs(pets) do
  print(i .. ". " .. pet)
end
```

`ipairs` hands you two things each turn: the position and the value. Name them
`i` and `pet` and use either. It walks from the front and stops at the first gap.
If you do not need one of them, `_` is the conventional name for *ignore this*.

```lua lab=list
local pets = {"cat", "dog", "fish"}

-- print "1. cat", "2. dog", "3. fish"
```

## Changing a list

```lua
table.insert(pets, "hamster")   -- put it on the end
table.remove(pets, 1)           -- take the first one out
```

Both change the list in place and both keep the numbering tight — removing the
first item shifts everything else down so the list still starts at 1. That is
what makes `#pets` still mean something afterwards.

## Tables with names

A table can hold named things instead of, or as well as, numbered ones:

```lua
local torch = {name = "torch", price = 5, uses = 40}
print(torch.price)      -- 5
print(torch["price"])   -- 5, same thing
```

Two spellings of the same look-up. `torch.price` is the one you want when you
know the name while typing; the bracket form is for when you work it out at
runtime.

This gets interesting when a list holds tables:

```lua
local bag = {
  {name = "torch", price = 5},
  {name = "rope",  price = 3},
}
```

`bag[1].name` is `"torch"`. A list of things, each of which has named parts —
that is the shape of nearly every real data structure you will meet, in Roblox
and out of it.

## Adding it up

```lua lab=inv
local bag = {
  {name = "torch",   price = 5},
  {name = "rope",    price = 3},
  {name = "canteen", price = 7},
}

-- print one line per item, then the total
```

The pattern to reach for: start a box at 0 *before* the loop, then add to it
*inside*. A box that accumulates is called an accumulator and it is how you turn
a list into a single answer.

> **Done when** both labs pass. This is the last new idea before you can write
> something that is genuinely yours.
</div>


<!-- ═══════════════════════════ play ═══════════════════════════ -->
<div id="md-play" hidden>
# Scratchpad

An empty page and a working interpreter. Nothing here is graded and nothing is
saved anywhere but this browser.

```lua lab=scratch
local name = "you"

print("Hello, " .. name)
print(2 + 2)

for i = 1, 3 do
  print("line " .. i)
end
```

## Things worth poking at

- `print(type(42))` then `print(type("42"))` — the two are not the same
- `print(10 / 4)` and `print(10 % 4)` — the whole answer and the leftover
- `print(1 == "1")` — different types are never equal
- a `for` loop whose body never changes anything, with `while true do end` above it
- `print(#"hello")` — `#` works on text too
- leave a quote unclosed and read what it says

## What is in the interpreter

Variables, `local`, arithmetic, comparisons, `and`/`or`/`not`, `..`, text with
`string.*`, tables with `table.*`, `math.*`, `if` / `elseif` / `else`,
`while`, `repeat`, numeric and `ipairs`/`pairs` loops, `break`, functions with
`return`, and `pcall` to survive an error.

It is a teaching interpreter, not Roblox. There is no `game`, no `workspace`, no
`Instance`, and no parenting — those arrive with the engine, and they are a
different course. What is here is the language itself, and it is the same
language Roblox runs.
</div>


<!-- ═══════════════════════════ cheat ═══════════════════════════ -->
<div id="md-cheat" hidden>
# Cheatsheet

Everything from the first six boxes, in one place.

## Naming things

```lua
local score = 42          -- make a box
score = 100               -- change what is in it
local name = "Ada"
local ok = true
```

## Text

```lua
"hello"                   -- text, in quotes
"a" .. "b"                -- "ab"          join
#"hello"                  -- 5             how long
"hello":upper()           -- "HELLO"
"hello":sub(1, 3)         -- "hel"          from 1, inclusive
"hello":rep(2)            -- "hellohello"
string.format("%s = %d", k, v)
```

## Numbers

| | |
|---|---|
| `+ - * /` | add, subtract, multiply, divide |
| `%` | remainder — `10 % 3` is `1` |
| `^` | power — `2 ^ 3` is `8` |
| `math.floor(x)` | round down |
| `math.max(a, b)` | larger of two |
| `math.random(1, 6)` | a die |

## Asking questions

| | |
|---|---|
| `==` | equal to |
| `~=` | not equal to |
| `< > <= >=` | the obvious four |
| `and` | both |
| `or` | either |
| `not` | flip |

Only `false` and `nil` are no. `0`, `""` and `"false"` are all yes.

## Deciding

```lua
if score > 90 then
  print("A")
elseif score > 80 then
  print("B")
else
  print("keep going")
end
```

## Repeating

```lua
for i = 1, 10 do end          -- 1 to 10
for i = 10, 1, -1 do end      -- backwards
for i = 0, 10, 2 do end       -- step of 2

while fuel > 0 do
  fuel = fuel - 1
end

repeat
  tick()
until done

break                          -- leave the loop now
```

## Lists

```lua
local pets = {"cat", "dog", "fish"}

pets[1]                        -- "cat"   (counting starts at 1)
#pets                          -- 3
table.insert(pets, "hamster")   -- add to the end
table.remove(pets, 1)           -- take the first out

for i, pet in ipairs(pets) do
  print(i, pet)
end
```

## Tables with names

```lua
local torch = {name = "torch", price = 5}

torch.price                    -- 5
torch["price"]                 -- 5, the same

for key, value in pairs(torch) do
  print(key, value)
end
```

## Functions

```lua
local function add(a, b)
  return a + b
end

print(add(2, 3))               -- 5
```

Covered properly in 0.7.

## Looking at a value

```lua
print(type(42))                -- number
print(type("42"))              -- string
print(type({}))                -- table
print(#pets)                   -- items in a list
```

## Three errors you will meet constantly

| message | usually means |
|---|---|
| `there is nothing named 'x' yet` | a typo, or the box was never made |
| `expected 'end'` | an `if` or a loop was never closed |
| `'..' joins text … but one side is a table` | you joined a table into text without saying how |

## The rules worth memorising

1. `=` puts something in a box. `==` asks a question.
2. Lists start at 1.
3. `..` always makes text. `+` always makes a number.
4. Only `false` and `nil` are false.
5. Every `if`, `for` and `while` needs a matching `end`.
6. Use `local`. Always.
</div>
