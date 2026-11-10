<!-- ════════════════════════════════════════════════════════════════════
     LESSON BODIES
     Each lesson lives in a hidden div and is pulled into the editor
     window by app.js. Nothing here runs in the browser — every script is
     copied into the learner's own Roblox Studio.

     Special fences:
       ```lua               a script, with a copy button
       ```output            what Studio's Output window should show.
                            `! ` at the start of a line = an error (red).
                            `  -  Server - Script:1` at the end = the grey
                            source tag Studio prints next to each line.
       ```lua predict=id    a question with answer chips (PREDICTS in app.js)
       ```task=id           an In Studio checklist, one `- step` per line
                            (TASKS in app.js says which goal it ticks)

     These divs are read with innerHTML, so never write a raw less-than
     sign or ampersand anywhere in here — not even inside a code fence.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ home ═══════════════════════════ -->
<div id="md-home" hidden>
# Learn Roblox Luau from nothing

No coding experience needed. Every lesson is a small script you put into your
own Roblox Studio, run, and watch work. You will be writing real Roblox code
from the very first lesson.

Keep this page open next to Studio. Read a little here, do it there, and tick it
off when it works.
</div>


<!-- ═══════════════════════════ 1.0 ═══════════════════════════ -->
<div id="md-1.0" hidden>
# Set up Roblox Studio

Before writing any code you need somewhere to run it. Roblox Studio is the free
program every Roblox game is built in, and it is where every script in this
course will run.

This lesson is only setup. By the end you will have run one script and seen it
talk back to you, which is the whole loop the rest of the course is built on.

## Get Studio

Roblox Studio runs on **Windows** and **Mac**. It does not run on phones, tablets
or Chromebooks.

1. Go to **create.roblox.com** and choose to start creating. It will offer to
   download Studio.
2. Install it and sign in with your normal Roblox account. If you do not have
   one, make one — it is free.

```task=setup-open
- Install Roblox Studio and sign in
- Start a **new** place and pick the **Baseplate** template
- You can see a big flat grey floor — that is the Baseplate
```

## The two windows you need

Studio has a lot of windows. For now you need two of them:

- **Explorer** — a list of everything in your game, laid out like folders.
- **Output** — where your scripts talk back to you. This is the most important
  window in this whole course.

Both are switched on from the **View** tab at the top of Studio. (Newer versions
of Studio sometimes move these into a **Window** menu instead — same names.)

Look in Explorer and find these two:

| | |
|---|---|
| **Workspace** | everything you can see in the 3D world. The Baseplate lives in here. |
| **ServerScriptService** | where scripts go. Scripts in here run when the game starts. |

```task=setup-panels
- Open the **Explorer** window
- Open the **Output** window
- In Explorer, find **Workspace** and open it — the **Baseplate** is inside
- Find **ServerScriptService**
```

> **Key idea** Explorer shows everything in your game, and Output is where your scripts talk back to you.

## Your first script

Hover over **ServerScriptService** in Explorer. A small **+** button appears.
Click it and choose **Script**.

A new script opens with one line already in it:

```lua
print("Hello world!") -- @n the brackets hold what to show; quotes mark it as text
```

Now press **Play** at the top of Studio (or the F5 key). Your character drops
onto the Baseplate, and the Output window shows this:

```output
Hello world!  -  Server - Script:1
```

That grey part on the right is Studio telling you *where* the message came
from: the server, a script called `Script`, line 1. When a script misbehaves
later on, that tag is how you find it.

`print` means **show this in the Output window**. It is how a script talks to
you, and you will use it in every single lesson.

Press **Stop** (or Shift+F5) to stop playing. Always stop before you change a
script — then press Play again to see the change.

```task=setup-run
- Add a **Script** to ServerScriptService
- Press **Play**
- Find `Hello world!` in the Output window
- Press **Stop**
```

> **Key idea** `print` shows a message in Output, and the grey tag tells you which script and line it came from.

## Make it yours

The words between the quotes are just text. Change them to anything you like:

```lua
print("This is my game now.") -- @n only the words inside the quotes changed
```

The quotes have to stay. They tell Luau *this is text, not code*. Delete one and
see what happens — the script editor underlines the problem in red before you
even press Play.

```task=setup-edit
- Change the message to something of your own
- Press Play and see your message in Output
- Delete one of the quote marks and look at the red underline
- Put the quote back
```

> **Key idea** The quotes mark text, so change the words between them but keep the quotes.

> **Recap**
> - Studio is where every script in this course runs.
> - Scripts go in ServerScriptService and run when you press Play.
> - `print` shows a message in the Output window.

> **Done when** all four checklists are ticked. From here on, every lesson works
> the same way: paste the script into your Script, press Play, compare your Output
> with the lesson.
</div>


<!-- ═══════════════════════════ 2.1 ═══════════════════════════ -->
<div id="md-2.1" hidden>
# Your first variable

A game has to remember things. How many coins you have. What your name is.
Whether a door is open. A **variable** is how a script remembers something.

## A box with a name on it

Think of a variable as a box with a label on it:

```lua
local coins = 10 -- @n 10 goes into the box now; nothing shows in Output yet
```

Read it left to right:

- `local` — *I am making a new box.*
- `coins` — *the label on the box.*
- `=` — *put this in the box.*
- `10` — *the thing going in.*

The `=` does not mean "is equal to" like in maths. It means **put the thing on
the right into the box on the left**.

Now print it. Replace everything in your Script with this:

```lua
local coins = 10
print(coins) -- @n no quotes, so print shows what is inside the box
```

```output
10  -  Server - Script:2
```

`print(coins)` looks **inside** the box and shows what it finds.

```lua predict=p-first
local coins = 10
print("coins")
```

> **Key idea** A variable is a name on a box, and `=` puts the value on its right into the box.

## Three boxes

A script can have as many variables as it needs. Each one holds one thing:

```lua
local coins = 10
local playerName = "Ada"
local isVip = true -- @n true has no quotes: it is a yes or no value, not text

print(coins)
print(playerName)
print(isVip)
```

```output
10  -  Server - Script:5
Ada  -  Server - Script:6
true  -  Server - Script:7
```

Three different kinds of thing went in: a number, some text, and `true`. The next
lesson is about those kinds. For now, notice that `"Ada"` needed quotes and `10`
and `true` did not.

```task=first-three
- Paste the script above into your Script
- Press Play and check your Output matches
- Change `playerName` to your own name and run it again
```

> **Key idea** Each variable holds one thing, and that thing can be a number, text or true or false.

## Printing more than one thing

Give `print` several things, separated by commas, and it prints them all on one
line with a space between each:

```lua
local coins = 10
local playerName = "Ada"

print(playerName, "has", coins, "coins") -- @n boxes show their contents; quoted words show as typed
```

```output
Ada has 10 coins  -  Server - Script:4
```

That line is built from two variables and two bits of fixed text. Change what is
in the boxes and the sentence changes with them — that is the whole point of a
variable.

```task=first-sent
- Make a variable called `level` holding a number
- Print a sentence that uses your name **and** your level
- Change the level, press Play, and watch the sentence change
```

> **Key idea** Give `print` several things separated by commas and it shows them all on one line.

## Names matter, exactly

Luau reads names exactly as you typed them. `coins`, `Coins` and `coin` are three
different names.

```lua predict=p-typo
local coins = 10
print(coin)
```

This is one of the most important things in this whole lesson. A misspelled name
does **not** stop your script. It quietly gives you `nil`, which is Luau's word
for *nothing is here*.

```output
nil  -  Server - Script:2
```

Studio does try to warn you: look at your script and `coin` has a wavy underline.
Hover over it and Studio says something like *Unknown global 'coin'*. Get into
the habit of checking those underlines — they find mistakes before you even press
Play.

Rules for names:

- letters, numbers and `_` only — no spaces
- cannot start with a number: `2coins` is not allowed, `coins2` is fine
- cannot be a word Luau already uses, like `local`, `end` or `true`
- capital letters count: `playerName` and `PlayerName` are different

```task=first-typo
- Make a variable, then print it with its name misspelled
- See `nil` in the Output
- Find the wavy underline in the script and hover over it
- Fix the name and see the real value come back
```

> **Key idea** Names must match exactly, and a misspelt name gives `nil` instead of an error.

## Your turn

*Optional practice: the stop clears without it.*

Write a script with a variable `pet` holding the name of an animal and a variable
`legs` holding how many legs it has. Print one sentence that uses both, so the
Output shows something like:

```output
cat has 4 legs  -  Server - Script:4
```

```solution
local pet = "cat"
local legs = 4

print(pet, "has", legs, "legs")
```

> **Recap**
> - `local` makes a new variable and `=` puts a value in it.
> - A misspelt name gives `nil`, not an error.
> - `print` shows what is inside a variable in Output.

> **Done when** all three checklists are ticked. If you remember one thing: a
> typo in a variable name gives you `nil`, not an error.
</div>


<!-- ═══════════════════════════ 2.2 ═══════════════════════════ -->
<div id="md-2.2" hidden>
# Kinds of values

```lua predict=p2-warm-kinds
local coins = 10
local Coins = 99
print(coins)
```

Everything you put in a variable is a **value**, and every value has a **type** —
the kind of thing it is. You have already met the four basic ones.

| type | what it is | examples |
|---|---|---|
| `number` | any number, whole or decimal | `10`, `-3`, `0.5` |
| `string` | text, always in quotes | `"Ada"`, `"Hello world!"`, `""` |
| `boolean` | yes or no — only two values | `true`, `false` |
| `nil` | nothing at all | `nil` |

"String" is the programming word for text — a string of letters.

## Asking a value what it is

`typeof` tells you the type of anything:

```lua
print(typeof(10))
print(typeof("Ada"))
print(typeof(true))
print(typeof(nil)) -- @n nil is a value too, so you can ask for its type
```

```output
number  -  Server - Script:1
string  -  Server - Script:2
boolean  -  Server - Script:3
nil  -  Server - Script:4
```

It works on variables too: `typeof(coins)` tells you the type of whatever is in
the `coins` box right now.

```lua predict=p-kinds
print(typeof("true"))
```

```task=kinds-typeof
- Run the four `typeof` lines above
- Make a variable of your own and print its `typeof`
- Print `typeof("10")` and `typeof(10)` — two different answers
```

> **Key idea** `typeof` tells you the type of any value: number, string, boolean or nil.

## Numbers do maths

| | | gives |
|---|---|---|
| `+` | add | `7 + 2` is `9` |
| `-` | subtract | `7 - 2` is `5` |
| `*` | multiply | `7 * 2` is `14` |
| `/` | divide | `7 / 2` is `3.5` |
| `//` | divide, round down | `7 // 2` is `3` |
| `%` | what is left over | `7 % 2` is `1` |
| `^` | power | `2 ^ 3` is `8` |

```lua
local price = 25
local amount = 3
local total = price * amount -- @n price * amount is done first; total stores the answer

print(total)
```

```output
75  -  Server - Script:5
```

The right side of `=` gets worked out first, then the answer goes in the box.
`total` holds `75`, not the sum.

> **Key idea** The right side of `=` is worked out first, and only the answer goes in the box.

## Strings get joined

Two dots, `..`, join strings together:

```lua
local first = "Ada"
local last = "Lovelace"

print(first .. " " .. last)
```

```output
Ada Lovelace  -  Server - Script:4
```

The `" "` in the middle is a string with just a space in it. Without it you
would get `AdaLovelace`.

Here is where types start to matter:

```lua predict=p-join
print("10" .. 5)
```

`..` always makes text. `+` always does maths. Mixing them up is one of the most
common beginner bugs in Roblox — and it does not always give you an error. It
just gives you the wrong answer.

> **Key idea** `..` joins text and `+` does maths, so mixing them up gives wrong answers.

## When types do not fit

Some mixes cannot work at all. Try adding a number to a word:

```lua
local coins = 10
print("ten" + coins) -- @n + needs two numbers, and "ten" is text
```

Your script stops, and Output shows a red line roughly like this:

```output
! ServerScriptService.Script:2: attempt to perform arithmetic (add) on string and number  -  Server - Script:2
```

Read errors left to right: **which script**, **which line**, then **what went
wrong**. Luau tried to do `+` and found a string where it needed a number.

Joining `nil` fails the same way. A variable that holds nothing cannot be glued
onto text:

```lua
local name
print("Hello " .. name) -- @n name is empty here, so .. has nothing to join on
```

```output
! ServerScriptService.Script:2: attempt to concatenate string with nil  -  Server - Script:2
```

`local name` with nothing after it is allowed — the box exists, but it is empty,
so it holds `nil`. *Concatenate* is the long word for joining.

```task=kinds-error
- Run the `"ten" + coins` script and find the red error in Output
- Point at the part of the error that says which **line**
- Fix it so it prints a number instead
- Cause the `concatenate ... nil` error, then fix it by giving the variable a value
```

> **Key idea** Mixing the wrong types stops the script, and the red line names the line that broke.

## Fix the bug

This script should print `Total: 30`. It runs without any error — but the answer
is wrong:

```lua
local apples = 10
local pears = 20
local total = apples .. pears
print(`Total: {total}`)
```

```output
Total: 1020  -  Server - Script:4
```

```solution
local apples = 10
local pears = 20
local total = apples + pears
print(`Total: {total}`)
```

`..` glued the two numbers together as text: `"10"` and `"20"` make `"1020"`.
Adding is `+`. This is the sneaky kind of bug — no red line, just a wrong answer —
so always check your Output against what you expected.

> **Recap**
> - Every value has a type: number, string, boolean or nil.
> - `..` makes text and `+` does maths.
> - A red error names the script, the line and what went wrong.

> **Done when** all checklists are ticked. The one to remember: `..` makes text,
> `+` does maths, and the red line in Output tells you exactly which line broke.
</div>


<!-- ═══════════════════════════ 2.3 ═══════════════════════════ -->
<div id="md-2.3" hidden>
# Changing a variable

```lua predict=p2-warm-change
print("Score: " .. 4 + 1)
```

A box can be emptied and filled again. In a game this happens all the time:
coins go up, health goes down, a timer counts.

## Putting something new in the box

To change a variable, use `=` again — but **without** `local`:

```lua
local coins = 10
print(coins)

coins = 25
print(coins)
```

```output
10  -  Server - Script:2
25  -  Server - Script:5
```

`local` means *make a new box*. You only do that once. After that, plain
`coins = ...` reaches for the box you already have and replaces what is inside.
The `10` is gone.

> **Key idea** After `local` has made the box, a plain `=` replaces what is inside it.

## Changing it using what is already there

Most of the time you want the new value to depend on the old one. Picking up 5
coins means *whatever I had, plus 5*:

```lua
local coins = 10
coins = coins + 5 -- @n the coins on the right is still 10 when it is read
print(coins)
```

```output
15  -  Server - Script:3
```

Luau works out the right side first — `coins + 5` is `15` — and then puts that
answer back in the same box.

This is so common there is a shortcut:

| shortcut | means |
|---|---|
| `coins += 5` | `coins = coins + 5` |
| `coins -= 5` | `coins = coins - 5` |
| `coins *= 2` | `coins = coins * 2` |
| `coins /= 2` | `coins = coins / 2` |
| `name ..= "!"` | `name = name .. "!"` |

```lua predict=p-change
local score = 10
score += 5
score *= 2
print(score)
```

> **Key idea** The right side is worked out from the old value, then the answer goes back in the same box.

## Putting variables inside text

Joining with `..` gets messy fast:

```lua
print("Ada has " .. coins .. " coins and is level " .. level)
```

Luau has a neater way. Use **backticks** instead of quotes, and put variables
inside curly brackets:

```lua
local playerName = "Ada"
local coins = 15
local level = 3

print(`{playerName} has {coins} coins and is level {level}`) -- @n only the parts in curly brackets swap for values
```

```output
Ada has 15 coins and is level 3  -  Server - Script:5
```

The backtick key is usually at the top-left of your keyboard, under Esc. You can
even do maths inside the brackets: `` `Next level at {level * 100} XP` ``.

```task=change-ops
- Make a `coins` variable and use `+=` to add to it twice
- Print it with backticks, like `` `You have {coins} coins` ``
- Use `..=` to add an exclamation mark to a string variable
```

> **Key idea** Backticks let you put variables in curly brackets right inside your text.

## Watching it change

So far everything happens instantly. `task.wait` pauses your script for a number
of seconds, which lets you watch a variable change:

```lua
local health = 100
print(`Health: {health}`)

task.wait(1) -- @n nothing below this line runs until a second has passed
health -= 30
print(`Ouch! Health: {health}`) -- @n shows health as it is right now, after the hit

task.wait(1)
health -= 30
print(`Ouch! Health: {health}`)

task.wait(1)
health += 20
print(`Healed. Health: {health}`)
```

```output
Health: 100  -  Server - Script:2
Ouch! Health: 70  -  Server - Script:6
Ouch! Health: 40  -  Server - Script:10
Healed. Health: 60  -  Server - Script:14
```

The lines appear one second apart. One box, `health`, holding four different
values over time. That is what most of a game is: variables changing while the
game runs.

```task=change-time
- Run the health script and watch the lines arrive one by one
- Add one more hit that takes away 25
- Make the waits longer or shorter and see the difference
```

> **Key idea** `task.wait` pauses the script, so you can watch one variable hold different values over time.

## Your turn

*Optional practice: the stop clears without it.*

Make a countdown. Start a variable `timeLeft` at `3`. Print it, wait one second,
take one away, and repeat until it reaches `0`, then print `Go!`. Use backticks
for every line:

```output
3...  -  Server - Script:2
2...  -  Server - Script:6
1...  -  Server - Script:10
Go!  -  Server - Script:13
```

```solution
local timeLeft = 3
print(`{timeLeft}...`)

task.wait(1)
timeLeft -= 1
print(`{timeLeft}...`)

task.wait(1)
timeLeft -= 1
print(`{timeLeft}...`)

task.wait(1)
print("Go!")
```

Copying the same three lines over and over feels clumsy. It is — and in unit 4
you will learn the loop that does it for you.

> **Recap**
> - Use `local` once, then plain `=` or `+=` to change a variable.
> - Backticks with curly brackets put values inside text.
> - `task.wait` pauses the script for a number of seconds.

> **Done when** all checklists are ticked. Remember: `local` once to make the box,
> plain `=` (or `+=`) every time after that.
</div>


<!-- ═══════════════════════════ 2.4 ═══════════════════════════ -->
<div id="md-2.4" hidden>
# Variables that hold parts

```lua predict=p2-warm-parts
local lives = 3
lives -= 1
lives *= 10
print(`Lives left: {lives}`)
```

This is where Roblox gets fun. A variable can hold more than numbers and text —
it can hold a **thing in your game**. A part, a light, a player.

Everything in the Explorer window is called an **Instance**. The Baseplate is an
Instance. So is Workspace. So is your Script.

## Pointing at the Baseplate

```lua
local baseplate = workspace.Baseplate

print(baseplate)
print(baseplate.ClassName) -- @n ClassName is a property: what kind of Instance this is
print(typeof(baseplate))
```

```output
Baseplate  -  Server - Script:3
Part  -  Server - Script:4
Instance  -  Server - Script:5
```

`workspace.Baseplate` means *go into Workspace and find the thing called
Baseplate* — exactly the path you can see in Explorer. Printing an Instance shows
its name. Its **class** is `Part`: a Baseplate is just a very big part.

Every Instance has **properties** — the settings you see in the Properties window
when you click it in Explorer. A dot reads one, and `=` changes it:

```lua
local baseplate = workspace.Baseplate
baseplate.Color = Color3.fromRGB(70, 110, 60)
```

Press Play — the floor turns green. `Color3.fromRGB` makes a colour from red,
green and blue amounts, each from 0 to 255.

```task=parts-base
- Store the Baseplate in a variable and print its name
- Change its `Color` and press Play to see it
- Press Stop — the colour goes back. Changes made by a script while playing are not saved.
```

> **Key idea** Everything in Explorer is an Instance, and a dot reads or changes its properties.

## Making a brand new part

`Instance.new` creates something new:

```lua
local part = Instance.new("Part")
part.Name = "MyFirstPart"
part.Size = Vector3.new(4, 4, 4)
part.Position = Vector3.new(0, 10, 0) -- @n x, then y, then z: the 10 lifts the part up
part.Color = Color3.fromRGB(255, 170, 0)
part.Anchored = true
part.Parent = workspace

print(`Made {part.Name}`)
```

```output
Made MyFirstPart  -  Server - Script:9
```

An orange cube is floating above the middle of the Baseplate.

- `Vector3.new(x, y, z)` holds three numbers. It is used for sizes and positions.
  The middle one, **y**, is height.
- `Anchored = true` pins the part in place. Without it, the part falls.
- `Parent = workspace` puts the part into the world. Until that line runs, the
  part exists only inside your script — nobody can see it. Setting the Parent
  **last** is a good habit.

While playing, look in Explorer: `MyFirstPart` is now inside Workspace.

Spell a property wrong and the script stops. Try `part.Colour = ...` and Output
shows a red line saying something like *Colour is not a valid member of Part*.
Properties have to be spelled exactly as Roblox spells them — check the
Properties window when you are not sure.

```task=parts-make
- Run the script and find the orange cube
- Find `MyFirstPart` inside Workspace in Explorer (while playing)
- Change `Anchored` to `false` and watch it fall
- Change its size and colour to something of your own
```

> **Key idea** `Instance.new` makes a part that nobody can see until you set its Parent to workspace.

## Two names, one part

Here is the most important idea in this lesson.

```lua predict=p-copy
local x = 5
local y = x
y = 10
print(x)
```

Numbers are **copied**. `y` gets its own 5, so changing `y` does nothing to `x`.

Parts are different:

```lua predict=p-alias
local a = Instance.new("Part")
a.Anchored = true
a.Position = Vector3.new(0, 5, 0)
a.Parent = workspace

local b = a
b.Transparency = 0.5
print(a.Transparency)
```

A variable that holds a part does not hold a copy of the part. It holds a
**reference** — directions to the one real part in the world. `local b = a` copies
the directions, not the part. There is still only one cube, and `a` and `b` are
two names for it.

That is how scripts work with your game: the variable is how you reach the thing,
not the thing itself.

```task=parts-alias
- Run the `a` and `b` script and see one half-see-through part
- Check in Explorer: there is only **one** new part, not two
- Change `a.Color` after `b.Transparency` and see both changes on the same part
```

> **Key idea** A variable that holds a part holds a reference to the one real part, not a copy.

## Moving a part properly

A part's `Position` is a `Vector3`, and a `Vector3` cannot be changed one number
at a time. This **does not** work:

```lua
part.Position.Y = 20
```

Output says something like *Y cannot be assigned to*. Instead, give the part a
whole new Position — or add a Vector3 to the one it already has:

```lua
local part = Instance.new("Part")
part.Anchored = true
part.Position = Vector3.new(0, 5, 0)
part.Parent = workspace

task.wait(2)
part.Position += Vector3.new(0, 10, 0) -- @n adds to the old Position instead of replacing it
print(part.Position)
```

```output
0, 15, 0  -  Server - Script:8
```

After two seconds the part jumps up 10 studs. (A **stud** is Roblox's unit of
distance.) `+=` from the last lesson works on properties too.

```task=parts-move
- Run the script and watch the part jump after two seconds
- Try `part.Position.Y = 20` and read the error
- Make the part move sideways instead, along X
```

> **Key idea** You cannot change one number inside a Vector3, so give the part a whole new Position.

## Your turn

*Optional practice: the stop clears without it.*

Make a tower of two parts from a script: a grey block 4 studs wide, 2 tall and 4
deep sitting on the Baseplate, and a red block the same size sitting exactly on
top of it. Both anchored. Use a variable for the height so you can work out the
second position from it.

Hint: a part's Position is its middle. A block 2 tall sitting on the floor has
its middle at height 1.

```solution
local HEIGHT = 2

local bottom = Instance.new("Part")
bottom.Size = Vector3.new(4, HEIGHT, 4)
bottom.Position = Vector3.new(0, HEIGHT / 2, 0)
bottom.Color = Color3.fromRGB(120, 120, 120)
bottom.Anchored = true
bottom.Parent = workspace

local top = Instance.new("Part")
top.Size = Vector3.new(4, HEIGHT, 4)
top.Position = bottom.Position + Vector3.new(0, HEIGHT, 0)
top.Color = Color3.fromRGB(200, 40, 40)
top.Anchored = true
top.Parent = workspace

print(`Top block is at {top.Position}`)
```

The second block starts from the first block's position and goes up one full
height. Change `HEIGHT` to `5` and both blocks still stack perfectly.

> **Recap**
> - Everything in Explorer is an Instance with properties.
> - A variable holding a part is a reference, so two names can reach one part.
> - Change a Position by giving a whole new Vector3, or by adding one.

> **Done when** all four checklists are ticked. The big idea: a variable holding a
> part is a **reference** to it — change the part through any name and it changes
> in the world.
</div>


<!-- ═══════════════════════════ 2.5 ═══════════════════════════ -->
<div id="md-2.5" hidden>
# Where a variable lives

```lua predict=p2-warm-scope
local a = Instance.new("Part")
local b = a
b.Name = "Crate"
print(a.Name)
```

Every variable lives somewhere. Outside that place, its name means nothing. This
is called **scope**, and it is why you write `local` every time.

## A variable only lives in its block

`do` and `end` make a block — a fenced-off area of code. A `local` made inside a
block only exists until that block's `end`:

```lua predict=p-scope
do
	local reward = "Gold"
end

print(reward)
```

Studio underlines `reward` on the last line, because there is no `reward` out
there. You will use blocks constantly soon — every `if`, every loop and every
function is one — and each one keeps its locals to itself.

That is a good thing. It means a variable made deep inside one part of a script
cannot be accidentally changed by some other part.

> **Key idea** A `local` only exists inside its block, up to the `end` that closes it.

## Why you always write local

Leave `local` off and the script still runs:

```lua
coins = 10 -- @n no local here, so coins is a global
print(coins)
```

But now `coins` is a **global**: it is not tied to any block, so it is visible
everywhere in the script and lives for as long as the script does.

Globals make bugs that are hard to find, because anything anywhere can change
them. Roblox developers write `local` every single time. Do the same and you skip
a whole category of mistakes.

> **Key idea** Without `local` a variable becomes a global that anything can change, so always write `local`.

## Naming like a Roblox developer

Roblox code has a style most developers follow. It makes scripts easier to read,
and it is what you will see in every tutorial and every game's code:

| style | used for | example |
|---|---|---|
| `camelCase` | normal variables | `playerName`, `coinCount`, `doorPart` |
| `PascalCase` | services and classes | `Players`, `Workspace`, `Lighting` |
| `SCREAMING_SNAKE_CASE` | settings that never change | `MAX_HEALTH`, `JUMP_POWER` |

Good names say what the thing is. `coinCount` beats `c`. `spawnDoor` beats `part2`.

> **Key idea** Use camelCase for variables, PascalCase for services and SCREAMING_SNAKE_CASE for settings that never change.

## Services

Roblox splits the game into **services**, like the folders at the top of
Explorer. Scripts get them with `game:GetService` and store them in a variable at
the very top of the script:

```lua
local Lighting = game:GetService("Lighting") -- @n the name in quotes must match the service exactly

Lighting.ClockTime = 20 -- @n 20 means eight in the evening, so the sky goes dark
print(`It is now {Lighting.ClockTime}:00`) -- @n the :00 is plain text sitting after the number
```

```output
It is now 20:00  -  Server - Script:4
```

Press Play — it is night time. `ClockTime` is the time of day from 0 to 24.

Real scripts often start with several of these — `Players`, `Lighting`,
`ReplicatedStorage` — one per line. The services go at the top, named exactly like
the service. You do not need
`GetService` for Workspace: `workspace` (small w) is always there for you.

```task=scope-style
- Run the `Lighting` script and make it night
- Try a few other `ClockTime` values, like `6` for sunrise
- Rename the variables in an old script from this course to follow the naming style
```

> **Key idea** Get a service with `game:GetService` and keep it in a PascalCase variable at the top.

## Telling Studio what type a variable holds

You can write the type after a colon:

```lua
local coins: number = 10
local playerName: string = "Ada"
local isVip: boolean = false
```

This does not change what the script does when it runs. It is a note to Studio
saying *this box only ever holds a number*. Put `--!strict` on the very first line
and Studio checks every line of the script against those notes:

```lua
--!strict
local coins: number = 10
coins = "lots"
```

Studio underlines `"lots"` in red with something like *Type 'string' could not be
converted into 'number'*. That is a bug found before the game even starts.

You do not need types for this course. But you will see them in other people's
code, and now you know what they mean.

```task=scope-strict
- Paste the `--!strict` script
- Hover over the red underline and read the message
- Change `"lots"` to a number and watch the underline disappear
```

## Fix the bug

This script should make it sunset. Press Play and it stops with a red error
instead. Studio has also put a wavy underline under one name:

```lua
local lighting = game:GetService("Lighting")

local SUNSET_TIME = 18
Lighting.ClockTime = SUNSET_TIME
```

```output
! ServerScriptService.Script:4: attempt to index nil with 'ClockTime'  -  Server - Script:4
```

*Index* means using a dot to reach inside something. The script tried to reach
inside `nil`.

```solution
local Lighting = game:GetService("Lighting")

local SUNSET_TIME = 18
Lighting.ClockTime = SUNSET_TIME
```

The variable was made as `lighting` (small l) but used as `Lighting`. That second
name was never made, so it holds `nil` — and nothing has a `ClockTime` inside
`nil`. The naming style prevents this: services are always PascalCase, named
exactly like the service.

> **Recap**
> - A local variable only lives inside its block.
> - Always write `local`, or the variable becomes a global.
> - Services go at the top, named exactly like the service.

> **Done when** all checklists are ticked. Always `local`, good names, services at
> the top.
</div>


<!-- ═══════════════════════════ 2.6 ═══════════════════════════ -->
<div id="md-2.6" hidden>
# Build: a lamp post

```lua predict=p2-warm-lamp
local name
print(typeof(name))
```

Time to put the whole unit together. You are going to build a glowing lamp post
out of nothing but a script — and every measurement of it lives in a variable at
the top, so you can reshape it by changing one number.

This is how real Roblox scripts are laid out: **settings first**, then the code
that uses them.

## The script

Replace everything in your Script with this, then press Play:

```lua
local Lighting = game:GetService("Lighting")

-- settings: change these to reshape the lamp
local POST_HEIGHT = 12 -- @n every height and position below is worked out from this
local POST_WIDTH = 1
local LAMP_SIZE = 3
local POST_COLOR = Color3.fromRGB(45, 45, 50)
local LIGHT_COLOR = Color3.fromRGB(255, 200, 120)
local SPOT = Vector3.new(0, 0, -10)

-- make it night so the lamp has something to light up
Lighting.ClockTime = 20 -- @n 20 is night, so the lamp has something to light

-- the post
local post = Instance.new("Part")
post.Name = "Post"
post.Anchored = true
post.Size = Vector3.new(POST_WIDTH, POST_HEIGHT, POST_WIDTH)
post.Position = SPOT + Vector3.new(0, POST_HEIGHT / 2, 0)
post.Color = POST_COLOR
post.Material = Enum.Material.Metal
post.Parent = workspace

-- the glowing ball on top
local lamp = Instance.new("Part")
lamp.Name = "Lamp"
lamp.Anchored = true
lamp.Shape = Enum.PartType.Ball
lamp.Size = Vector3.new(LAMP_SIZE, LAMP_SIZE, LAMP_SIZE)
lamp.Position = SPOT + Vector3.new(0, POST_HEIGHT + LAMP_SIZE / 2, 0) -- @n top of the post, then up to the middle of the ball
lamp.Color = LIGHT_COLOR
lamp.Material = Enum.Material.Neon
lamp.Parent = workspace

-- the light itself, inside the lamp
local light = Instance.new("PointLight")
light.Color = LIGHT_COLOR
light.Range = 20
light.Brightness = 2
light.Parent = lamp -- @n this line is what puts the light inside the lamp

print(`Lamp post built: {POST_HEIGHT} studs tall`)
```

```output
Lamp post built: 12 studs tall  -  Server - Script:42
```

Turn around in front of your character — the lamp post is a few studs away,
glowing in the dark.

```task=lamp-build
- Paste the script and press Play
- Find the lamp post in the world
- Find `Post` and `Lamp` in Explorer, and the `PointLight` inside `Lamp`
```

> **Key idea** Put your settings in variables at the top, then write the code that uses them.

## How it works

Everything in it is something you have already learned:

- **Settings at the top**, in `SCREAMING_SNAKE_CASE`, because the rest of the
  script reads them and nothing changes them.
- **A service** — `Lighting` — stored in a variable at the very top.
- **Variables holding parts**: `post`, `lamp` and `light` are references, and every
  line after `Instance.new` sets one property through them.
- **Maths inside the values.** A part's Position is its **middle**. To make the
  post stand *on* the floor, its middle has to be half its height up:
  `POST_HEIGHT / 2`. The lamp sits on top of the post: the full post height, plus
  half the lamp.
- **Adding Vector3s.** `SPOT + Vector3.new(...)` means *start at the spot, then go
  up this much*. Change `SPOT` and the whole lamp post moves together.
- **Parent last**, every time.

A few new things snuck in, and that is fine:

- `Enum.Material.Metal` and `Enum.Material.Neon` choose from a fixed list Roblox
  gives you. Neon is the one that glows.
- `Enum.PartType.Ball` makes a part round.
- A `PointLight` gives off light. It goes **inside** a part by setting its Parent
  to that part.

> **Key idea** A part Position is its middle, so work positions out from the settings with half heights and Vector3 addition.

## Change one number

The reason for putting everything in variables: you can change the lamp post by
changing one line. Set `POST_HEIGHT` to `30` and press Play. The post grows, and
the lamp rises with it — because the lamp's position is worked out *from*
`POST_HEIGHT` instead of being typed in by hand.

```task=lamp-tweak
- Set `POST_HEIGHT` to `30` and press Play — the lamp moves up with it
- Change `LIGHT_COLOR` — both the ball and the light change colour
- Change `SPOT` to move the whole lamp post somewhere else
```

> **Key idea** Because every position is worked out from a variable, changing one setting reshapes the whole lamp post.

## Make it yours

Some ideas — try at least one:

- Add a `BASE_SIZE` setting and a wide flat part at the bottom of the post.
- Make a second lamp post. You need new variables for its parts — and a second
  `SPOT`.
- Add a `task.wait(3)` near the end and then turn the light off with
  `light.Enabled = false`.
- Change `ClockTime` to make it sunset instead.

```task=lamp-own
- Add something new to the lamp post using a setting variable
- Press Play and see it work
- Show it to someone
```

> **Recap**
> - Settings go first, in variables, then the code that uses them.
> - Work positions out from the settings instead of typing them by hand.
> - Set Parent last, and a light goes inside a part by setting its Parent to that part.

> **Done when** all checklists are ticked — and that is the variables unit
> finished. You can now store values, change them, hold parts in the world, and lay
> out a script the way Roblox developers do. Next up: making decisions with `if`.
</div>


<!-- ═══════════════════════════ cheat ═══════════════════════════ -->
<div id="md-cheat" hidden>
# Variables cheatsheet

Everything from the variables unit on one page. Keep it open next to Studio.

## Making and changing

```lua
local coins = 10        -- make a new variable (only once)
coins = 25              -- put something new in it
coins += 5              -- add to it: same as coins = coins + 5
coins -= 5
coins *= 2
coins /= 2

local name              -- an empty variable — it holds nil
local a, b = 1, 2       -- two at once
```

## The four basic types

| type | example | check with |
|---|---|---|
| `number` | `10`, `-3`, `0.5` | `typeof(x) == "number"` |
| `string` | `"Ada"`, `""` | `typeof(x) == "string"` |
| `boolean` | `true`, `false` | `typeof(x) == "boolean"` |
| `nil` | `nil` | `x == nil` |

## Maths

| | |
|---|---|
| `+  -  *  /` | add, subtract, multiply, divide |
| `//` | divide and round down — `7 // 2` is `3` |
| `%` | remainder — `7 % 2` is `1` |
| `^` | power — `2 ^ 3` is `8` |

## Text

```lua
local first = "Ada"
print(first .. " Lovelace")           -- join with ..
print(`Hello, {first}!`)              -- backticks: variables in curly brackets
print(`Next level at {level * 100}`)  -- maths works in there too
print("Coins:", coins)                -- commas: printed with spaces between
```

## Roblox things

```lua
local Players = game:GetService("Players")   -- services go at the top
local Lighting = game:GetService("Lighting")

local baseplate = workspace.Baseplate        -- a reference to a part

local part = Instance.new("Part")            -- make a new part
part.Size = Vector3.new(4, 1, 2)
part.Position = Vector3.new(0, 10, 0)
part.Color = Color3.fromRGB(255, 170, 0)
part.Anchored = true
part.Parent = workspace                      -- parent last

part.Position += Vector3.new(0, 5, 0)        -- move it: a whole new Vector3
```

## Types, if you want them

```lua
--!strict
local coins: number = 10
local playerName: string = "Ada"
local isVip: boolean = false
```

## Naming

| style | for | example |
|---|---|---|
| `camelCase` | normal variables | `coinCount` |
| `PascalCase` | services | `Players` |
| `SCREAMING_SNAKE_CASE` | settings that never change | `MAX_HEALTH` |

## Messages you will see

| in Output or on hover | usually means |
|---|---|
| `nil` where you expected a value | a typo in the variable name, or it was never given a value |
| *Unknown global 'x'* | that name was never made with `local` — often a typo |
| *attempt to perform arithmetic ... on string* | maths on text — check your quotes |
| *attempt to concatenate string with nil* | joining a variable that holds nothing |
| *X is not a valid member of Part* | a property name is spelled wrong |
| *Y cannot be assigned to* | change the whole Position, not just one number |

## The six rules

1. `local` every time you make a variable.
2. `=` puts a value in a box. It is not "equals".
3. Text needs quotes. Numbers, `true`, `false` and `nil` do not.
4. `..` joins text. `+` does maths.
5. A typo in a name gives `nil`, not an error — watch the underlines.
6. A variable holding a part is a reference. Change it through any name and the
   part changes.
</div>
