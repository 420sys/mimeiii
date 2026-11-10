<!-- ════════════════════════════════════════════════════════════════════
     UNIT 5 — FUNCTIONS
     Same format as lessons.md. No raw less-than or ampersand anywhere:
     write &lt; and &amp; even inside code fences. Code is indented with tabs.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 5.1 ═══════════════════════════ -->
<div id="md-5.1" hidden>
# Your own functions

You have been using other people's functions since lesson 1.0 — `print`,
`task.wait`, `Instance.new`. Each one is a named block of code that does a job,
and you run it by writing its name. From this lesson on you can make your own.

```lua predict=p5-warm1
local n = 0
for i = 1, 4 do
	n += i
end
print(n)
```

## A block with a name

```lua
local function cheer() -- @n this line only names the block; nothing runs yet
	print("Go!")
end

cheer() -- @n the brackets are the call: now the block runs
cheer()
cheer()
```

```output
Go!  -  Server - Script:2
Go!  -  Server - Script:2
Go!  -  Server - Script:2
```

Read it in two halves:

- `local function cheer()` … `end` — *this is what the word `cheer` means.*
  Nothing has run yet.
- `cheer()` — *now do it.* Each call runs the whole block again.

A `function` block is written just like the `if` and `for` blocks you already
know: a line that opens it, an indented body, and an `end` to close it. The
indentation is for humans — Studio will indent for you when you press return
after `function`.

One thing to notice: the whole block is a **definition**, not an instruction.
Studio does not run it when it reads it. It only remembers it. That is the point
of naming it.

```task=u5-define
- Paste the `cheer` script into your Script and press Play
- Three lines, all with `Script:2` on the right
- Add a fourth `cheer()` and press Play again
```

> **Key idea** `local function name()` only gives a block of code a name. Each `name()` call runs the block again.

## Nothing runs until you call it

```lua predict=p5-once
local function launch()
	print("Launching!")
end

print("All systems ready")
```

The definition is a label on the block. The block itself is still waiting for the
word `launch()`, and it never comes. That is one of the two mistakes everyone
makes with functions — and the fix is a single missing line.

> **Key idea** A definition on its own does nothing, so a function you never call never runs.

## Why bother

Here is a script that makes two cubes without a function:

```lua
local a = Instance.new("Part")
a.Size = Vector3.new(4, 4, 4)
a.Anchored = true
a.Position = Vector3.new(0, 6, 0)
a.Parent = workspace

local b = Instance.new("Part")
b.Size = Vector3.new(4, 4, 4)
b.Anchored = true
b.Position = Vector3.new(6, 6, 0)
b.Parent = workspace
```

Eleven lines for two cubes. Ten cubes would be fifty-five lines, and to change
the size of every cube you would have to change it in ten places — and you would
forget one. Now the same thing with a function:

```lua
local function makeCube()
	local part = Instance.new("Part")
	part.Size = Vector3.new(4, 4, 4) -- @n change this one line and every cube changes
	part.Anchored = true
	part.Parent = workspace
end

makeCube()
makeCube()
```

The cube is described **once**. Change `4, 4, 4` to `8, 8, 8` and every cube the
function makes is bigger. You have already met this idea — it is exactly why
lesson 2.6 kept the lamp post's measurements in variables at the top. A function
is the same trick for a whole block of instructions.

```task=u5-cube
- Paste the `makeCube` script and press Play
- Find both cubes in Explorer inside Workspace
- Change `4, 4, 4` to `8, 8, 8` and press Play again
```

Both cubes appear at the very middle of the world, poking up out of the spawn
pad, one exactly inside the other — so they look like one. Every call makes the
same cube in the same place. Functions get much more useful in the next lesson,
when they can be told *where* to build.

> **Key idea** Describe a block once in a function and you only have to change it in one place.

## Where you put it matters

A script runs from the top down. That means the definition has to be above the
call:

```lua
greet() -- @n too early: `greet` is still nil on this line

local function greet()
	print("Hello!")
end
```

```output
! ServerScriptService.Script:1: attempt to call a nil value  -  Server - Script:1
```

At line 1, `greet` is just a name Luau has never seen, so it holds `nil` — the
same *nothing is here* you met with a misspelled variable in lesson 2.1. Trying
to call `nil` stops the script.

The habit that avoids this for good: **write every function at the top of the
script, and the code that uses it below.** You saw the same shape in 2.6 with
services and settings at the top.

```task=u5-order
- Paste the broken script above and press Play
- Read the red line: it tells you it gave up on line 1
- Move the function above the call and press Play — it works
```

> **Key idea** A script runs from the top down, so write each function above the code that calls it.

## Your turn

Write a function called `roll` that prints a whole number from 1 to 6, then call
it three times. Your Output should show three numbers — and you should be able to
run it again and get something different.

```solution
local function roll()
	print(math.random(1, 6))
end

roll()
roll()
roll()
```

`math.random(1, 6)` is from lesson 3.2: a whole number between 1 and 6, and both
ends are included. Because the function is written once, all three calls use the
same rule — that is the whole idea.

```task=u5-turn
- Write the `roll` function yourself, without opening the solution
- Press Play a few times and check the numbers change
- Make a second function, `roll20`, and call it once
```

> **Recap**
> - `local function name() ... end` defines a block and runs nothing.
> - `name()` is what runs it, as many times as you like.
> - Define a function above the line that calls it.

> **Done when** all checklists are ticked. A function is a named block of code.
> Writing it does nothing at all — only `NAME()` runs it.
</div>


<!-- ═══════════════════════════ 5.2 ═══════════════════════════ -->
<div id="md-5.2" hidden>
# Parameters

A function that always does exactly the same thing is only half useful. This
lesson is about handing it values when you call it, so the same block of code can
work on a different name, a different colour, a different place.

```lua predict=p5-warm2
local total = 0
for i = 1, 5 do
	if i % 2 == 0 then
		continue
	end
	total += i
end
print(total)
```

## A function that needs something

```lua
local function welcome(name) -- @n `name` is a blank slot that each call fills in
	print(`Welcome, {name}!`)
end

welcome("Ada")
welcome("Grace")
welcome("Alan")
```

```output
Welcome, Ada!  -  Server - Script:2
Welcome, Grace!  -  Server - Script:2
Welcome, Alan!  -  Server - Script:2
```

The word inside the brackets, `name`, is a **parameter**: a variable that only
exists inside the function, and it is given its value by whoever calls it.

The value you hand over — `"Ada"` — is an **argument**. Two words for two ends of
the same handover:

| word | where it appears | example |
|---|---|---|
| parameter | in the definition | `name` in `local function welcome(name)` |
| argument | in the call | `"Ada"` in `welcome("Ada")` |

Inside the function, `name` behaves exactly like any other variable: you can
print it, compare it, join it to other strings. Outside the function, `name`
means nothing at all — the same block-scope rule you met in lesson 2.5. Try
`print(name)` after the calls and Studio will underline it.

> **Key idea** A parameter is a variable inside the function, and the argument in the call is the value that fills it.

## More than one parameter

Separate them with commas — as many as you need:

```lua
local function award(playerName, coins)
	print(`{playerName} gets {coins} coins`)
end

award("Ada", 50)
award("Grace", 120)
```

```output
Ada gets 50 coins  -  Server - Script:2
Grace gets 120 coins  -  Server - Script:2
```

## Order, not names

```lua predict=p5-args
local function award(playerName, coins)
	print(`{playerName} gets {coins} coins`)
end

award(50, "Ada")
```

Luau lines arguments up with parameters **by position**. The first argument goes
into the first parameter, whatever the names say. The names are for humans;
Luau only ever counts.

```task=u5-params
- Paste the `welcome` script and press Play
- Add a fourth call with your own name
- Write a `price` function taking an `itemName` first and a `cost` second, and call it twice
```

> **Key idea** Luau matches arguments to parameters by position, never by name.

## A missing argument is nil

```lua predict=p5-missing
local function award(playerName, coins)
	print(`{playerName} gets {coins} coins`)
end

award("Grace")
```

This is the same quiet `nil` as the misspelled variable in lesson 2.1: no error,
no red line, just the word `nil` printed where a number should be. Luau does not
count your arguments for you.

You already know a way to deal with it. `or` from lesson 3.3 gives a value when
the left side is `nil`:

```lua
local function award(playerName, coins)
	coins = coins or 10 -- @n `10` is used only when `coins` is nil or false
	print(`{playerName} gets {coins} coins`)
end

award("Ada")
award("Grace", 120)
```

```output
Ada gets 10 coins  -  Server - Script:3
Grace gets 120 coins  -  Server - Script:3
```

Line 2 says: *if nothing was handed in for `coins`, use 10 instead.* This is a
common way to write a **default** — the value a parameter falls back to.

One catch worth knowing now: `or` counts `false` and `nil` as missing, but
nothing else. A real `0` in the parameter survives, because `0` is true. That is
exactly what you learned in 3.2.

```task=u5-default
- Paste the missing-argument script and see `nil` in Output
- Add `coins = coins or 10` and press Play again
- Call it with `0` as the coins and check the 0 is not replaced by the default
```

> **Key idea** A missing argument is quietly nil, and `or` can give that parameter a default value.

## Roblox: telling a function where to build

Now the cube from 5.1 can go where you want it:

```lua
local function makeCube(position, colour)
	local part = Instance.new("Part")
	part.Size = Vector3.new(4, 4, 4)
	part.Position = position -- @n `position` is whatever Vector3 the caller handed in
	part.Color = colour
	part.Anchored = true
	part.Parent = workspace
end

makeCube(Vector3.new(0, 6, 0), Color3.fromRGB(255, 170, 0))
makeCube(Vector3.new(6, 14, 0), Color3.fromRGB(120, 200, 255))
```

Two cubes, two colours, two heights, one description of a cube. The arguments are
the two things from lesson 2.4 — a `Vector3` for the position and a `Color3` for
the colour.

> **Key idea** Hand a function a Vector3 and a Color3 and one description of a cube can build anywhere, in any colour.

## Fix the bug

This script runs without any red line at all — and gives the wrong answer:

```lua
local function damage(health, hit)
	print(health - hit)
end

damage(30, 100) -- @n the first number lands in `health`, the second in `hit`
```

```output
-70  -  Server - Script:2
```

A wrong answer with no error is the hardest kind of bug, because nothing tells
you where to look. Here the arguments are in the wrong order: the 30 went into
`health` and the 100 into `hit`.

```solution
local function damage(health, hit)
	print(health - hit)
end

damage(100, 30)
-- The function is fine. The arguments are in the wrong order:
-- health wants the 100 and hit wants the 30, so swap them at the call.
```

The lesson: **read the definition before you read the call**. The definition says
which slot is which.

```task=u5-order2
- Paste the broken `damage` script and see the `-70`
- Fix the call so it prints `70`
- Swap the two parameters instead and check it still prints `70`
```

> **Key idea** When an answer is wrong and there is no error, read the definition first to see which slot is which.

## Your turn

Write a function called `line` that takes three things — a position number, a
name, and a score — and prints a scoreboard line. Then call it three times so
your Output reads exactly:

```output
1. Ada scored 250  -  Server - Script:2
2. Grace scored 90  -  Server - Script:2
3. You scored 0  -  Server - Script:2
```

```solution
local function line(number, name, score)
	print(`{number}. {name} scored {score}`)
end

line(1, "Ada", 250)
line(2, "Grace", 90)
line(3, "You", 0)
```

```task=u5-turn2
- Write `line` yourself, three parameters and all
- Your Output matches the three lines above
- Add a fourth row for a friend
```

> **Recap**
> - A parameter is a variable that only exists inside the function.
> - Arguments fill parameters by position, and a missing one is `nil`.
> - `value = value or default` gives a parameter a fallback.

> **Done when** all checklists are ticked. Parameters are variables that only
> exist inside the function, and arguments fill them **by position** — never by
> name. A missing one is `nil`, not an error.
</div>


<!-- ═══════════════════════════ 5.3 ═══════════════════════════ -->
<div id="md-5.3" hidden>
# Return values

So far your functions print. Printing is for *you* — it is how you watch a script
work. To be useful to the rest of the script, a function has to hand a value
back. That is a **return**.

```lua predict=p5-warm3
local a = Instance.new("Part")
a.Anchored = true
local b = a
b.Transparency = 0.5
print(a.Transparency)
```

## A function that answers with a value

```lua
local function double(n)
	return n * 2
end

print(double(21))
```

```output
42  -  Server - Script:5
```

`return` does two things at once:

1. It hands a value back to whoever called the function.
2. It **ends the function right there**. Nothing below it runs.

Back at the call, `double(21)` *is* that value. It is not a special sort of
thing — it is 42, and you can use it anywhere a number goes:

```lua
local function double(n)
	return n * 2
end

local total = double(21) + 8 -- @n `double(21)` is replaced by the value 42 here
print(total)
```

```output
50  -  Server - Script:6
```

> **Key idea** `return` hands a value back to the caller and ends the function right there.

## No return means nil

```lua predict=p5-noreturn
local function greet(name)
	print(`Hi {name}`)
end

print(greet("Ada"))
```

Every function gives something back. If you never write `return`, what it gives
back is `nil`. So that script prints two lines: `Hi Ada` from inside the
function, then the outer `print` showing the `nil` it got back.

So there are two kinds of function in your scripts now:

- **Do-ers** — they print, or build a part, or change something. No return.
- **Answerers** — they work something out and `return` it, so the rest of the
  script can use it.

Most functions that build a part are both, as you will see at the end of this
lesson.

> **Key idea** A function with no `return` gives back `nil`, so a do-er is fine without one and an answerer is not.

## return stops the function

```lua
local function canEnter(coins)
	if coins &lt; 50 then
		print("The door stays shut.")
		return false -- @n the function ends here for this call; lines below are skipped
	end
	print("The door swings open.")
	return true
end

print(canEnter(30))
print(canEnter(80))
```

```output
The door stays shut.  -  Server - Script:3
false  -  Server - Script:10
The door swings open.  -  Server - Script:6
true  -  Server - Script:11
```

Look at the order and the line numbers. `print(canEnter(30))` calls the function
first: line 3 prints, line 4 returns `false`, and the function is finished — so
lines 6 and 7 never run for that call. Then the outer `print` on line 10 shows the
returned `false`.

An early `return` like this is called a **guard clause**, and it reads very well:
*if the player cannot get in, say so and stop. Otherwise carry on.*

## Two answers at once

A function can return several values, separated by commas:

```lua
local function minMax(a, b)
	if a &lt; b then
		return a, b
	end
	return b, a
end

local low, high = minMax(7, 3) -- @n the first value goes in `low`, the second in `high`
print(`low {low}, high {high}`)
```

```output
low 3, high 7  -  Server - Script:9
```

Two variables on the left of `=`, two values on the right — the same pairing you
met with `local a, b = 1, 2` in the variables cheatsheet.

You do not need this often. Roblox and the Luau standard library are full of
ready-made answerers: `math.max`, `math.min`, `math.random`, `#` on a string,
`string.upper`. Whenever you find yourself writing a function to work something
out, check whether it already exists.

## Roblox: a function that hands you the part

This is the pattern you will use for the rest of the course — build the part,
then return it so the calling code can keep working on it:

```lua
local function makeCube(position, colour)
	local part = Instance.new("Part")
	part.Size = Vector3.new(4, 4, 4)
	part.Position = position
	part.Color = colour
	part.Anchored = true
	part.Parent = workspace
	return part -- @n hands the part itself back to whoever called the function
end

local cube = makeCube(Vector3.new(0, 6, 0), Color3.fromRGB(255, 170, 0))
print(`Made a part called {cube.Name}`)
cube.Name = "Lucky Cube"
```

```output
Made a part called Part  -  Server - Script:12
```

`cube` is a reference to the part in the world, exactly like lesson 2.4. The
function made it and handed it over; now the rest of the script can rename it,
recolour it or move it.

```task=u5-return
- Paste the `double` script and check Output says `42`
- Paste the `makeCube` script that returns the part and press Play
- After the call, change `cube.Color` and move `cube` up 10 studs — through the variable
```

> **Key idea** Return the part you built and the code that called the function can keep working on it.

## Fix the bug

```lua
local function priceOf(item)
	if item == "Sword" then
		return 100
	elseif item == "Potion" then
		return 30
	end
end

local total = priceOf("Sword") + priceOf("Torch")
print(total)
```

```output
! ServerScriptService.Script:9: attempt to perform arithmetic (add) on number and nil  -  Server - Script:9
```

`priceOf("Torch")` matched nothing, fell off the end of the function, and gave
back `nil`. Adding `nil` to 100 stopped the script.

This is worth pausing on: it is not the missing item that broke the script, it is
that the function had no answer for that item. Every branch of a function that is
supposed to return a value needs to end in a return.

```solution
local function priceOf(item)
	if item == "Sword" then
		return 100
	elseif item == "Potion" then
		return 30
	end
	return 0        -- the answer for everything else
end

local total = priceOf("Sword") + priceOf("Torch")
print(total)
```

At the call you can also patch a single hole with `or`, using 3.3 again:
`priceOf("Torch") or 0`. That works, but the real fix belongs inside the
function — then it is right for every caller, not just this one line.

```task=u5-fixreturn
- Paste the broken script and read the red line
- Add the missing `return 0` and press Play
- Change the first call to an item that does not exist and check nothing breaks
```

> **Key idea** Every path through an answerer must end in a `return`, or some calls will quietly give back `nil`.

## Your turn

Write a function called `buy` that takes an item name, a price and how many coins
the player has. If they can afford it, it prints what they bought and returns the
coins left over. If they cannot, it prints a refusal and returns the coins
unchanged. Start with `coins` at 50 and buy a Sword for 30, then a Shield for 40.
Your Output should read:

```output
Bought Sword for 30 coins  -  Server - Script:6
Not enough coins for Shield  -  Server - Script:3
You have 20 coins left  -  Server - Script:13
```

Notice the shape of it: `coins = buy("Sword", 30, coins)`. The function answers
with the new coin count, and you put it straight back in the box.

```solution
local function buy(itemName, price, coins)
	if coins &lt; price then
		print(`Not enough coins for {itemName}`)
		return coins
	end
	print(`Bought {itemName} for {price} coins`)
	return coins - price
end

local coins = 50
coins = buy("Sword", 30, coins)
coins = buy("Shield", 40, coins)
print(`You have {coins} coins left`)
```

```task=u5-turn3
- Write `buy` without peeking
- Your Output matches the three lines above
- Start with 500 coins instead and buy everything twice
```

> **Recap**
> - `return` hands a value back and ends the function.
> - A function with no `return` gives back `nil`.
> - Every path of an answerer needs its own `return`.

> **Done when** all checklists are ticked. `return` hands a value back and ends
> the function. No `return` means the value is `nil` — which is fine for a
> do-er, and a bug in an answerer.
</div>


<!-- ═══════════════════════════ 5.4 ═══════════════════════════ -->
<div id="md-5.4" hidden>
# Functions are values

Here is the idea that unlocks the rest of Roblox: a function is not a special
part of the language. It is a **value**, like a number or a string. It can go in a
variable, it can be handed to another function, and it can be written on the spot
without ever being given a name.

```lua predict=p5-warm4
local lives = 0
if lives then
	print("Still playing")
else
	print("Game over")
end
```

## A function is a value in a box

```lua
local function cheer()
	print("Go!")
end

local shout = cheer -- @n no brackets, so this copies the function, not its result
shout()
print(typeof(cheer))
```

```output
Go!  -  Server - Script:2
function  -  Server - Script:7
```

`local shout = cheer` copied the function into a second variable, exactly like
`local b = a` copied a number in lesson 2.4. Both names now run the same block.
`typeof` even reports `function` as a type of its own.

Once you know that, you can see what `local function cheer()` really means. It is
shorthand for this:

```lua
local cheer = function()
	print("Go!")
end

cheer()
```

```output
Go!  -  Server - Script:2
```

The long form makes the value visible: a `function ... end` block **is** an
expression that produces a function, and `local function NAME()` is the short way
to write it. Both forms turn up in Roblox code, so read both.

> **Key idea** A function is a value, so you can copy it into another variable and both names run the same block.

## Handing a function to a function

If a function is a value, a parameter can receive one — just like it receives a
number:

```lua
local function doTwice(action)
	action()
	action()
end

local function cheer()
	print("Hooray!")
end

doTwice(cheer)
```

```output
Hooray!  -  Server - Script:7
Hooray!  -  Server - Script:7
```

`doTwice` does not care what `action` is, only that it can be called. The function
is handed over with no brackets, and `doTwice` decides when to run it.

This is not a party trick. It is how almost every Roblox event works: you hand a
function to Roblox, and Roblox calls it later. Unit 8 is nothing but this —
`part.Touched:Connect(function() ... end)` is a function given away to be run
when something touches the part.

> **Key idea** A parameter can receive a function, and you hand it over by its name with no brackets.

## Written on the spot

Since a function is a value that can be passed around, it can also be written
right where you need it, with no name at all:

```lua
local function doTwice(action)
	action()
	action()
end

doTwice(function() -- @n a function with no name, written right where it is used
	print("Hooray!")
end)
```

```output
Hooray!  -  Server - Script:7
Hooray!  -  Server - Script:7
```

That is an **anonymous function**. Read the brackets carefully: `doTwice(` then
`function()` then the body, then `end` closes the function, then `)` closes
`doTwice`. Two brackets in a row at the end is not a typo — one belongs to each.

The block has no name, so nothing else can call it. For handing a function
straight to something, that is exactly what you want.

```task=u5-anon
- Paste the anonymous-function script and press Play
- Two `Hooray!` lines, no error
- Guess what happens if you delete the last `)` before pressing Play — then try it
```

## Running something later

`task.delay` takes a number of seconds and a function, and runs that function
after the wait — without stopping the rest of the script:

```lua
local function boom()
	print("Boom!")
end

print("Fuse lit")
task.delay(3, boom) -- @n `boom` has no brackets: it is handed over, not run now
print("Running away")
```

```output
Fuse lit  -  Server - Script:5
Running away  -  Server - Script:7
Boom!  -  Server - Script:2
```

Three seconds passed between `Running away` and `Boom!`. Look at the last line:
it says `Script:2`, the print *inside* the function — not line 6, where the delay
was asked for. Roblox kept the function and ran it later, on its own.

`task.wait` and `task.delay` are two different jobs:

| | what it does |
|---|---|
| `task.wait(3)` | stops **this script** for 3 seconds, then carries on |
| `task.delay(3, f)` | remembers `f` and gets straight on with the script |

```lua predict=p5-delay
local function alarm()
	print("Wake up!")
end

print("Sleeping")
task.delay(2, alarm)
print("Heard something")
```

```task=u5-delay
- Paste the `boom` script and watch when the last line arrives
- Change `3` to `1`, press Play, then try `0.5`
- Write a `warnPlayer` function and schedule it two seconds in with `task.delay`
```

> **Key idea** `task.delay` remembers a function and runs it later, while the rest of the script carries on.

## Running something alongside

`task.spawn` starts a function immediately and hands control straight back, so
two things happen at once. This is how a flickering light keeps flickering while
the rest of the script gets on with its job:

```lua
local function countdown()
	for i = 3, 1, -1 do
		print(i)
		task.wait(1)
	end
	print("Liftoff!")
end

task.spawn(countdown) -- @n runs `countdown` until its first wait, then moves on
print("The script is still running")
```

```output
3  -  Server - Script:3
The script is still running  -  Server - Script:10
2  -  Server - Script:3
1  -  Server - Script:3
Liftoff!  -  Server - Script:6
```

Read the interleaving. `task.spawn` runs `countdown` up to its first pause at
`task.wait(1)` — which is where the `3` comes from — then the main script carries
on and prints its line. A second later the countdown wakes up, and so on. Two
streams of work, one script.

You could do the same with a second `Script` in ServerScriptService. `task.spawn`
just keeps both jobs in one file.

> **Key idea** `task.spawn` starts a function straight away, and the script carries on when that function first pauses.

## Fix the bug

```lua
local function doTwice(action)
	action()
	action()
end

local function cheer()
	print("Hooray!")
end

doTwice(cheer())
```

```output
Hooray!  -  Server - Script:7
! ServerScriptService.Script:2: attempt to call a nil value  -  Server - Script:2
```

Brackets after a function mean *run it now*. So `cheer()` ran once, printed, and
gave back `nil` — because `cheer` has no `return`. `doTwice` was handed `nil` and
then tried to call it.

```solution
doTwice(cheer)
-- No brackets. You are handing over the function itself,
-- not the nothing it gives back after running.
```

Worth remembering for the rest of the course, because every event connection in
Roblox is a function being handed over in exactly this way.

```task=u5-hand
- Paste the broken script and read the red line: it blames line 2, inside `doTwice`
- Take the brackets off and press Play — two `Hooray!` lines, no error
- Say out loud why the error blamed line 2 and not line 9
```

> **Key idea** Brackets mean run it now, so to hand a function over you write its name without them.

## Your turn

Write a function called `doTimes` that takes how many times to run and a function
to run, and runs it that many times. Call it with a count of 3 and an anonymous
function that prints `Hooray!`, so your Output shows exactly three lines.

As a stretch, put a `task.wait(1)` inside the loop so the three lines arrive one
per second, then pass a **named** function instead of an anonymous one and check
it behaves the same.

```solution
local function doTimes(times, action)
	for i = 1, times do
		action()
		task.wait(1)      -- take this line out to make it instant
	end
end

doTimes(3, function()
	print("Hooray!")
end)
```

```task=u5-turn4
- Write `doTimes` yourself, without opening the solution
- Three `Hooray!` lines in Output
- Add the one-second wait, then swap the anonymous function for a named one
```

> **Recap**
> - A function is a value: it can sit in a variable or be passed to another function.
> - `cheer` hands the function over; `cheer()` runs it now.
> - `task.delay` runs a function later; `task.spawn` runs it alongside.

> **Done when** all checklists are ticked. A function is a value: it can live in a
> variable, be handed to another function, and be written on the spot with no
> name. Hand over `cheer`, not `cheer()`.
</div>


<!-- ═══════════════════════════ 5.5 ═══════════════════════════ -->
<div id="md-5.5" hidden>
# Build: a camp

Unit build time. You are going to build a camp in the dark — ground, fence, logs
round a fire, and a fire that flickers on its own while the script that built it
carries on. Three functions do all the work.

```lua predict=p5-warm5
local n = 0
while n &lt; 3 do
	n += 1
end
print(n)
```

## The script

Replace everything in your Script with this, then press Play:

```lua
-- ── settings ──────────────────────────────────────────────
local CAMP_AT = Vector3.new(0, 0, -30)      -- where the middle of the camp goes
local FENCE_HALF = 18                        -- how far the fence reaches out
local FENCE_GAP = 3                          -- space between fence posts
local POST_HEIGHT = 4
local GROUND_SIZE = Vector3.new(44, 1, 44)    -- keep FENCE_HALF a multiple of FENCE_GAP
local WOOD = Color3.fromRGB(96, 66, 40)
local FIRE_COLOR = Color3.fromRGB(255, 150, 60)

local Lighting = game:GetService("Lighting")
local partCount = 0

-- ── the factory: every part in this camp is made by this one function ──
local function makePart(name, size, at, colour, material)
	local part = Instance.new("Part")
	part.Name = name
	part.Size = size
	part.Position = at
	part.Color = colour
	part.Material = material or Enum.Material.Plastic -- @n `or` picks Plastic when no material was passed in
	part.Anchored = true
	part.Parent = workspace
	partCount += 1 -- @n made outside the function, so it keeps counting across calls
	return part
end

-- the position that sits a part of this size on top of the camp ground
local function onGround(size, at)
	return at + Vector3.new(0, GROUND_SIZE.Y + size.Y / 2, 0)
end

Lighting.ClockTime = 21        -- night, so the fire is worth having

-- ── the ground ────────────────────────────────────────────
makePart("CampGround", GROUND_SIZE, CAMP_AT + Vector3.new(0, GROUND_SIZE.Y / 2, 0),
	Color3.fromRGB(84, 108, 62), Enum.Material.Grass)

-- ── four logs round the fire ──────────────────────────────
local LOG = Vector3.new(6, 1, 1)
makePart("Log", LOG, onGround(LOG, CAMP_AT + Vector3.new(5, 0, 5)), WOOD, Enum.Material.Wood)
makePart("Log", LOG, onGround(LOG, CAMP_AT + Vector3.new(-5, 0, 5)), WOOD, Enum.Material.Wood)
makePart("Log", LOG, onGround(LOG, CAMP_AT + Vector3.new(5, 0, -5)), WOOD, Enum.Material.Wood)
makePart("Log", LOG, onGround(LOG, CAMP_AT + Vector3.new(-5, 0, -5)), WOOD, Enum.Material.Wood)

-- ── a fence round the camp, with a gate facing the player ─
local POST = Vector3.new(1, POST_HEIGHT, 1)
for x = -FENCE_HALF, FENCE_HALF, FENCE_GAP do
	for z = -FENCE_HALF, FENCE_HALF, FENCE_GAP do
		local onEdge = x == -FENCE_HALF or x == FENCE_HALF
			or z == -FENCE_HALF or z == FENCE_HALF
		if not onEdge then continue end -- @n skips every spot that is not on the edge of the square
		if x == 0 and z == FENCE_HALF then continue end   -- the gate
		makePart("FencePost", POST, onGround(POST, CAMP_AT + Vector3.new(x, 0, z)),
			Color3.fromRGB(78, 58, 42), Enum.Material.Wood)
	end
end

-- ── the fire, and a light inside it ───────────────────────
local FIRE = Vector3.new(2, 2, 2)
local fire = makePart("Fire", FIRE, onGround(FIRE, CAMP_AT), FIRE_COLOR, Enum.Material.Neon)

local light = Instance.new("PointLight")
light.Color = FIRE_COLOR
light.Range = 30
light.Brightness = 2
light.Parent = fire

-- ── keep it flickering while the rest of the script carries on ──
task.spawn(function() -- @n this function runs alongside, so the script below carries on
	while true do
		light.Brightness = 1.5 + math.random() * 1.5
		task.wait(0.1)
	end
end)

print(`Camp built from {partCount} parts`)
```

```output
Camp built from 53 parts  -  Server - Script:76
```

Look around — the camp is a short walk from where you spawn, glowing in the
dark. (The count comes out 53 with the numbers as
written. If you change a setting, expect a different number — that is the point.)

```task=u5-build
- Paste the script and press Play
- Walk round to the camp and look at it in the dark
- Find `CampGround` and a few `FencePost`s in Explorer inside Workspace
```

> **Key idea** One function that knows how to make a part, and code that only says what to make, keeps a big script short.

## How it works

Almost everything here is something you have already learned. The new part is how
the functions fit together.

- **`makePart` is a factory.** Ten lines describe one part, and the rest of the
  script only says *what* to make. This is the pattern you will see in every
  Roblox codebase: one function that knows how to make a thing, and code that asks
  for things.
- **Five parameters and a return.** Calling code reads almost like a sentence:
  ```text
  makePart("Fire", Vector3.new(2, 2, 2), CAMP_AT,
           FIRE_COLOR, Enum.Material.Neon)
  ```
- **A default in a parameter.** `material or Enum.Material.Plastic` — lesson 3.3
  doing real work. The logs and posts pass wood; leave the material off and the
  part comes out plastic.
- **`onGround` is a small answerer.** Give it a size and a spot and it returns the
  position that sits the part *on* the camp ground: the ground's thickness, plus
  half the part's height. That is the lamp post maths from 2.6, tucked into a
  function this time so every part gets it right.
- **`partCount` lives outside both functions.** A variable made inside `makePart`
  is thrown away at its `end` (lesson 2.5). The counter lives out in the script,
  where every call can reach it, and adds one each time.
- **`return part`** hands the finished part back, so `local fire = makePart(...)`
  can then hold the light.
- **`task.spawn` + `while true` + `math.random()`.** The flicker runs alongside
  the script, forever, changing `light.Brightness` about ten times a second.
  `math.random()` with no arguments gives a fraction between 0 and 1.

> **Key idea** A variable made outside the functions can be changed by every call, so `partCount` keeps one running total.

## Change one number

Set `FENCE_HALF` to `24` and press Play. The fence grows — and walks off the side
of the ground, leaving the outer posts hanging in the air.

The setting is not joined to anything. That is the whole course in miniature: a
number only changes what it is *wired to*. So wire it up:

```lua
local GROUND_SIZE = Vector3.new(FENCE_HALF * 2 + 4, 1, FENCE_HALF * 2 + 4)
```

Keep `FENCE_HALF` a multiple of `FENCE_GAP` (3, 6, 9 … 30). The loop counts in
steps of 3 from `-FENCE_HALF`, so if the far edge is not a whole number of steps
away, the loop never lands on it and the two far sides of the fence go missing —
a good bug to cause on purpose once.

Now `GROUND_SIZE` is worked out *from* `FENCE_HALF`, the way the lamp post's lamp
was worked out from `POST_HEIGHT` in 2.6. Move `FENCE_HALF` down to `12` and the
whole camp shrinks, ground and all.

```task=u5-tweak
- Set `FENCE_HALF` to `24` and watch the fence walk off the ground
- Wire `GROUND_SIZE` to `FENCE_HALF` as above and press Play
- Try `12`, then `30` — the whole camp resizes each time
- Try `20` and find the two sides of the fence that went missing
```

> **Key idea** A setting only changes what it is wired to, so work other sizes out from it.

## Make it yours

Pick at least two:

- Write a `makeTent(at)` function and stand two tents inside the fence.
- Write a `makeLantern(at)` function that makes a post with a `PointLight` in it,
  and call it at the four corners.
- Move the flicker into a function of its own that takes the **fire part** as a
  parameter, and find the light inside it with `fire:FindFirstChild("...")`. (A
  glimpse of unit 7 — try it, and if it bites, come back after 7.1.)
- Make the gate wider by skipping two posts instead of one.
- Give the fire a colder colour, and a material that is not Neon.
- Add a `makeBench(x, z)` function and put benches round the fire.

```solution
-- a lantern: a post with a neon ball on top and a light inside the ball
local function makeLantern(at)
	local POLE = Vector3.new(1, 8, 1)
	makePart("LanternPost", POLE, onGround(POLE, at), WOOD, Enum.Material.Wood)
	local ball = makePart("Lantern", Vector3.new(2, 2, 2),
		at + Vector3.new(0, GROUND_SIZE.Y + 9, 0), FIRE_COLOR, Enum.Material.Neon)

	local glow = Instance.new("PointLight")
	glow.Range = 20
	glow.Brightness = 2
	glow.Parent = ball
	return ball
end
```

```task=u5-own
- Add at least two new things to the camp
- At least one of them is made by a function of your own
- Press Play and walk round the finished camp
```

> **Recap**
> - One function can make every part, and the code that calls it says what to make.
> - A function can return what it built, so the caller can keep working on it.
> - `task.spawn` lets a loop run alongside the rest of the script.

> **Done when** all checklists are ticked — and that is the functions unit. You
> can build a block of code, feed it values, take an answer back, hand it to
> another function, and run it later or alongside. Next up: tables, which keep a
> whole camp's worth of values in one variable.
</div>


<!-- ═══════════════════════════ cheat-5 ═══════════════════════════ -->
<div id="md-cheat-5" hidden>
# Functions cheatsheet

Everything from the functions unit on one page. Keep it open next to Studio.

## Making and calling

```lua
local function cheer()      -- define: nothing runs yet
	print("Go!")
end

cheer()                     -- call: runs the body now
```

- The definition must come **above** the call, or you get *attempt to call a nil
  value*.
- Functions go at the top of the script, the code that uses them below.

## Parameters and arguments

```lua
local function award(playerName, coins)   -- playerName, coins: parameters
	coins = coins or 10                   -- a default for a missing argument
	print(`{playerName} gets {coins} coins`)
end

award("Ada", 50)                          -- "Ada", 50: arguments
```

- Filled **by position**, never by name.
- Names are only for humans; Luau counts.
- A missing argument is `nil`, not an error.
- Parameters live only inside the function.

## Returning

```lua
local function double(n)
	return n * 2        -- hands a value back AND ends the function
end

print(double(21))       -- 42
```

```lua
local function canEnter(coins)
	if coins &lt; 50 then
		return false    -- a guard clause: the answer, and stop
	end
	return true
end
```

- No `return` means the function gives back `nil`.
- `return a, b` gives two values: `local low, high = minMax(7, 3)`.
- Anything written after a `return` in the same block never runs.

## Functions are values

```lua
local shout = cheer          -- two names for the same function
doTwice(cheer)               -- hand it over with NO brackets
doTwice(cheer())             -- WRONG: this runs it and hands over nil

doTwice(function()           -- anonymous: written on the spot
	print("Hooray!")
end)                          -- one bracket for the function, one for doTwice
```

```lua
task.delay(3, boom)          -- run boom in 3 seconds; this script carries on
task.spawn(countdown)        -- run countdown alongside this script
```

## Messages you will see

| in Output or on hover | usually means |
|---|---|
| *attempt to call a nil value* | the function is defined **below** the call, or the name is misspelled |
| *attempt to call a nil value* inside a function that was handed a function | you wrote `cheer()` instead of `cheer` |
| *attempt to perform arithmetic ... on nil* | a function fell off its `end` without a `return` |
| *Expected 'end'* | a `function` without its `end` |
| *Expected ')' (to close '(' ...)* at the very end | the last bracket of an anonymous function call is missing |
| `nil` printed where a number should be | a missing argument, or a missing `return` |

## The rules

1. A function is a named block. Defining it runs nothing; `NAME()` runs it.
2. Define above the call.
3. Parameters are variables that live only inside the function; arguments fill
   them by position.
4. `return` hands a value back and ends the function.
5. No `return`, no value — the answer is `nil`.
6. Hand over `cheer`, not `cheer()`.
7. `task.wait` stops the script. `task.delay` and `task.spawn` do not.
</div>
