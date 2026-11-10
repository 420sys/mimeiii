<!-- ════════════════════════════════════════════════════════════════════
     UNIT 4 — LOOPS
     Same format as lessons.md. No raw less-than or ampersand anywhere:
     write &lt; and &amp; even inside code fences.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 4.1 ═══════════════════════════ -->
<div id="md-4.1" hidden>
# While loops

A game is full of things that must happen again and again: a timer counting
down, a door that checks whether you have the key, the sun crossing the sky. You
could write those lines out by hand, but they would never stop. A **loop** tells
the script to go back and do something again.

```lua predict=p4-warm1
local hasKey = false
local isVip = true

if hasKey or isVip then
	print("In you go.")
else
	print("Locked.")
end
```

## Going round and round while something is true

`while` runs a block **as long as its question stays true**. It checks the
question before each pass, exactly like an `if`:

```lua
local countdown = 3

while countdown > 0 do
	print(`T-minus {countdown}`)
	task.wait(1) -- @n pauses this script for one second
	countdown -= 1 -- @n `-= 1` takes one off `countdown` each pass
end

print("Liftoff!")
```

```output
T-minus 3  -  Server - Script:4
T-minus 2  -  Server - Script:4
T-minus 1  -  Server - Script:4
Liftoff!  -  Server - Script:9
```

Trace it once, line by line, because this is the shape of every loop:

1. `countdown` is 3. Is 3 > 0? Yes — run the block.
2. Print `T-minus 3`. Wait a second. `countdown` becomes 2.
3. Back to the top. Is 2 > 0? Yes — run the block again. And so on.
4. `countdown` becomes 0. Is 0 > 0? No. Skip the block and carry on at
   `print("Liftoff!")`.

Notice that all three prints inside the loop report **the same line number, 4**.
That is the giveaway that they came from a loop: one line of code, three times.

`while` needs the same three pieces as `if`: the question, `do`, and `end`.

> **Key idea** A `while` loop checks its question before every pass and stops the first time the answer is false.

## The line that changes the answer

Look at what `countdown -= 1` really does. Without it, `countdown` would stay at
3 forever, and the question would be true forever. Something inside the loop has
to move it towards `false` — otherwise the loop never stops.

```lua predict=p4-forever
local health = 100

while health > 0 do
	print(health)
end
```

Nothing ever changes `health`, so the question stays true for ever — and there is
no `task.wait`, so the loop never even pauses to let the rest of the game run.
Studio freezes. After about ten seconds Roblox gives up on the script and Output
shows a red line like *Script timeout: exhausted allowed execution time*. That
is a **stuck loop**, and it is the first problem every programmer meets. Do not
try this one in a place you care about without saving first.

Two rules keep you safe:

- Something inside the loop must eventually make the question false.
- If the loop has no `task.wait` in it, it will run thousands of times a second
  and eat the whole program. Any loop that repeats for a long time wants a
  `task.wait()`.

`task.wait()` with nothing in the brackets waits for one frame — about a
sixtieth of a second. It is the polite way of saying *carry on next frame*.

> **Key idea** Something inside the loop must move the question towards false, and a long loop needs a `task.wait`.

## Watch it happen: a day–night cycle

Here is a loop that never ends, and that is exactly what we want. `Lighting.ClockTime`
is the time of day from 0 to 24, and nudging it a little every frame makes the
sun move:

```lua
local Lighting = game:GetService("Lighting")

Lighting.ClockTime = 6

while true do -- @n `true` is always true, so this loop never ends
	task.wait(0.5)
	Lighting.ClockTime = (Lighting.ClockTime + 0.1) % 24 -- @n `% 24` wraps the clock back to 0 after 24
end
```

Press Play and stand still for a while. The sky slides from dawn to noon to
night and back. `%` is the remainder operator from lesson 2.2: it keeps the
number inside 0 to 24, so when the clock reaches the end of the day it wraps
round to midnight instead of counting up to 25.

The script never finishes, and that is fine — a Roblox script is allowed to keep
running for as long as the game does, **as long as it gives the engine a break
now and then**. `task.wait` is that break.

Try changing `0.5` to `0.05` for a much faster day, and `0.1` to `1` for a
chunky, jumpy one.

```task=u4-while
- Run the countdown script and watch the lines arrive one second apart
- Delete the `task.wait(1)` from the countdown and see every line arrive at once — then put it back
- Run the day-night script and watch the sky move
- Change the wait and the step until the day passes at a speed you like
```

> **Key idea** A loop that never ends is fine in Roblox, as long as `task.wait` gives the engine a break each pass.

## A loop that reacts

Loops are not only for counting. Put an `if` inside one and the script can watch
something and react — this is the shape of most game logic you will ever write:

```lua
local baseplate = workspace.Baseplate
local Lighting = game:GetService("Lighting")

Lighting.ClockTime = 6
local step = 0

while step &lt; 8 do
	step += 1
	Lighting.ClockTime += 2

	if Lighting.ClockTime >= 18 then
		baseplate.Color = Color3.fromRGB(25, 25, 55)
		print(`Step {step}: it is dark now`)
	else
		baseplate.Color = Color3.fromRGB(90, 140, 70)
		print(`Step {step}: still light`)
	end

	task.wait(0.6)
end
```

```output
Step 1: still light  -  Server - Script:16
Step 2: still light  -  Server - Script:16
Step 3: still light  -  Server - Script:16
Step 4: still light  -  Server - Script:16
Step 5: still light  -  Server - Script:16
Step 6: it is dark now  -  Server - Script:13
Step 7: it is dark now  -  Server - Script:13
Step 8: it is dark now  -  Server - Script:13
```

The clock starts at 6 in the morning and each step adds two hours, so step 6
lands on 18:00. The floor is green for the first five steps and dark blue after
that. You have just written a loop that
watches a value and changes the world when it crosses a threshold — a sunset,
in eight printed lines.

> **Key idea** Put an `if` inside a loop and the script can watch a value and react when it crosses a threshold.

## Fix the bug

This script is supposed to count from 1 to 5. Instead it prints `1` every
second, for ever, until you press Stop:

```lua
local count = 1

while count &lt;= 5 do
	print(count)
	task.wait(1)
	count += 0
end
```

```solution
local count = 1

while count &lt;= 5 do
	print(count)
	task.wait(1)
	count += 1        -- it was += 0, so count never moved
end

print("Done!")
-- The question `count &lt;= 5` has to be able to become false.
-- `count += 0` adds nothing, so it stayed true for ever.
```

```lua predict=p4-offbyone
local count = 1

while count &lt; 5 do
	print(count)
	count += 1
end
```

> **Key idea** If a loop never stops, look for the line that should change the question and check it really changes it.

## Your turn

Write a loop that makes a part move upwards, one small hop at a time, and stops
by itself after twenty hops. Make an anchored part at `Vector3.new(0, 5, -20)`,
then move it 2 studs higher each pass.

```output
Hop 20 of 20 — height 45  -  Server - Script:14
Part stopped moving.  -  Server - Script:15
```

```solution
local part = Instance.new("Part")
part.Anchored = true
part.Position = Vector3.new(0, 5, -20)
part.Parent = workspace

local hops = 0

while hops &lt; 20 do
	hops += 1
	part.Position += Vector3.new(0, 2, 0)
	task.wait(0.1)
end

print(`Hop {hops} of 20 — height {part.Position.Y}`)
print("Part stopped moving.")
-- hops counts the passes, so the loop can stop itself.
-- The part starts at 5 studs, and 20 hops of 2 studs is 40 more: 45.
```

```task=u4-turn
- Write the hopping part without peeking at the solution
- Your Output ends with `Hop 20 of 20 — height 45`
- Move the print inside the loop and watch every hop print instead
```

> **Recap**
> - `while` repeats its block for as long as the question stays true.
> - Something inside the loop must move the question towards false.
> - A long loop needs a `task.wait` so the game can keep running.

> **Done when** all checklists are ticked. The one to remember: a `while` loop
> repeats until its question turns false — so something inside it has to move
> towards false, and it needs a `task.wait`.
</div>


<!-- ═══════════════════════════ 4.2 ═══════════════════════════ -->
<div id="md-4.2" hidden>
# for loops

Counting loops are so common that Luau has a shorter form for them. A **numeric
for loop** runs a block a set number of times, and hands you the number each
pass.

```lua predict=p4-warm2
local lives = 3

while lives > 0 do
	print(`Lives left: {lives}`)
	lives -= 1
end

print("Game over")
```

## Counting up

```lua
for i = 1, 5 do -- @n `i` is 1 on the first pass, then 2, up to 5
	print(`Round {i}`)
end
```

```output
Round 1  -  Server - Script:2
Round 2  -  Server - Script:2
Round 3  -  Server - Script:2
Round 4  -  Server - Script:2
Round 5  -  Server - Script:2
```

Read the middle of that line as a range: `i = 1, 5` means *start at 1, stop
after 5*. Five passes, and `i` is 1, then 2, then 3, then 4, then 5.

`i` is a variable, and it is remade with the next number at the top of every
pass. It only exists inside the loop — after the `end`, the name means nothing,
just like the `do` block in lesson 2.5.

Compare the two shapes:

| | |
|---|---|
| `while count &lt;= 5 do` | you manage the number yourself |
| `for i = 1, 5 do` | Luau manages it for you |

Use `for` when you know how many times. Use `while` when you do not — for
example, looping until the player has collected every coin.

> **Key idea** `for i = 1, 5` runs the block once for each number in the range, and `i` holds the current one.

## Counting by twos, and counting down

The third number is the **step**: how big the jump is each time. Leave it out
and the step is 1.

```lua
for i = 0, 10, 5 do
	print(i)
end

print("---")

for i = 3, 1, -1 do -- @n the `-1` step makes `i` go 3, then 2, then 1
	print(i)
end
```

```output
0  -  Server - Script:2
5  -  Server - Script:2
10  -  Server - Script:2
---  -  Server - Script:5
3  -  Server - Script:8
2  -  Server - Script:8
1  -  Server - Script:8
```

A step of `-1` counts down. The rule for a step is: it has to be moving your
number towards the stop value. Ask for `for i = 1, 5, -1` and the loop runs
**zero** times — you cannot count *down* from 1 and ever reach 5, so Luau does
not even start. That is not an error, just a loop that never
happens, and it is a classic reason for nothing appearing in Output.

```lua predict=p4-step
local total = 0

for i = 1, 4 do
	total += i
end

print(total)
```

> **Key idea** The third number is the step, and it must point towards the stop value or the loop runs zero times.

## A row of parts

This is where loops pay off. Instead of writing out `Instance.new("Part")` eight
times, you write it once and let `i` decide where each part goes:

```lua
for i = 1, 8 do
	local part = Instance.new("Part")
	part.Name = "Marker" .. i
	part.Anchored = true
	part.Size = Vector3.new(3, 3, 3)
	part.Position = Vector3.new(i * 5 - 25, 4, -25) -- @n `i` changes each pass, so each part gets its own x
	part.Color = Color3.fromRGB(80, 150, 255)
	part.Parent = workspace
end

print("Row built.")
```

```output
Row built.  -  Server - Script:11
```

Eight small blue cubes in a line. Follow the maths in `i * 5 - 25`: at `i = 1`
the x position is `1 * 5 - 25`, which is `-20`; at `i = 8` it is `40 - 25`, which
is `15`. Each part lands 5 studs further along than the last, and the whole row
is centred around zero.

That trick — taking the loop number and turning it into a position, a size or a
colour — is worth stopping to appreciate. It is how developers build roads,
fences, towers and patterns that would take hours to place by hand.

```task=u4-for
- Run the counting loops and check each Output matches
- Run `for i = 1, 5, -1 do print(i) end` and see that nothing prints at all
- Build the row of eight parts, then change `8` to `20`
- Make the parts alternate colour by putting an `if` on `i % 2` inside the loop
```

> **Key idea** Work out a position, size or colour from `i` and one loop can build a whole row of parts.

## A variable that survives the loop

`i` dies at the `end`, but a variable made **before** the loop lives on and can
be changed from inside it. That is how you add things up:

```lua
local total = 0

for i = 1, 5 do
	total += i -- @n `total` was made before the loop, so it keeps its value
	print(`Added {i}, total is now {total}`)
end

print(`Five rounds, {total} points.`)
```

```output
Added 1, total is now 1  -  Server - Script:5
Added 2, total is now 3  -  Server - Script:5
Added 3, total is now 6  -  Server - Script:5
Added 4, total is now 10  -  Server - Script:5
Added 5, total is now 15  -  Server - Script:5
Five rounds, 15 points.  -  Server - Script:8
```

This pattern — an **accumulator** outside, added to inside — shows up every time
you want a sum, a best score, or a count of how many things matched. Note that
`total` ends at 15, not 5: it is 1 + 2 + 3 + 4 + 5.

> **Key idea** A variable made before the loop lives on, so you can add to it on every pass and keep the total.

## Fix the bug

This loop should build five parts in a staircase climbing upwards, but all five
land in the same place:

```lua
for i = 1, 5 do
	local part = Instance.new("Part")
	part.Anchored = true
	part.Size = Vector3.new(4, 1, 4)
	part.Position = Vector3.new(0, 4, -25)
	part.Parent = workspace
end
```

```solution
for i = 1, 5 do
	local part = Instance.new("Part")
	part.Anchored = true
	part.Size = Vector3.new(4, 1, 4)
	part.Position = Vector3.new(0, 2 + i * 2, -25)
	part.Parent = workspace
end
-- The position was the same every pass, so the parts piled up in one spot.
-- `i * 2` makes each one two studs higher than the last.
```

## Your turn

Build a tower of ten parts, each one a little smaller and a little higher than
the one below it, so it ends in a point. Start with a 20-stud wide base, lose
2 studs of width every level, and make each level 4 studs tall, sitting on top of
the one below. Add a print at the end
saying how many levels you built.

```output
Tower built: 10 levels tall  -  Server - Script:10
```

```solution
for i = 1, 10 do
	local part = Instance.new("Part")
	part.Name = "Level" .. i
	part.Anchored = true
	part.Size = Vector3.new(22 - i * 2, 4, 22 - i * 2)
	part.Position = Vector3.new(0, i * 4 - 2, -30)
	part.Parent = workspace
end

print("Tower built: 10 levels tall")
-- Every number that changes with the level is worked out from i:
-- width 22 - 2i (20 at the bottom, 2 at the top),
-- height i * 4 - 2 so each part sits on top of the last.
```

```task=u4-turn2
- Build the tower without peeking at the solution
- Every level is smaller than the one below it, all the way to a point
- Make it 15 levels tall — what else has to change so the top level is not zero or less wide?
```

> **Recap**
> - `for i = start, stop, step` counts for you, and `i` only exists inside the loop.
> - A step that points away from the stop value runs the loop zero times.
> - Make a variable before the loop to keep a running total.

> **Done when** all checklists are ticked. The one to remember: `for i = 1, 5 do`
> gives you a fresh `i` each pass — turn `i` into positions, sizes and colours
> and one short loop can build a whole street.
</div>


<!-- ═══════════════════════════ 4.3 ═══════════════════════════ -->
<div id="md-4.3" hidden>
# Break, continue, repeat

Three more tools, and your loops can do almost anything: leave early, skip a
pass, and run at least once.

```lua predict=p4-warm3
local total = 0

for i = 1, 6 do
	total += i * 2
end

print(total)
```

## Leaving early with break

`break` jumps straight out of the loop, right now, ignoring the question:

```lua
local coins = 0

for i = 1, 20 do
	coins += 7
	print(`Coin {i}: {coins} coins`)

	if coins >= 50 then
		print("Enough for the sword. Stopping here.")
		break -- @n leaves the whole loop, even though `i` could go to 20
	end
end
```

```output
Coin 1: 7 coins  -  Server - Script:5
Coin 2: 14 coins  -  Server - Script:5
Coin 3: 21 coins  -  Server - Script:5
Coin 4: 28 coins  -  Server - Script:5
Coin 5: 35 coins  -  Server - Script:5
Coin 6: 42 coins  -  Server - Script:5
Coin 7: 49 coins  -  Server - Script:5
Coin 8: 56 coins  -  Server - Script:5
Enough for the sword. Stopping here.  -  Server - Script:8
```

The loop was allowed to run to 20, but it quit at 8. This is how you stop
searching once you have found what you were looking for, instead of checking
everything else for nothing.

> **Key idea** `break` leaves the loop at once, so you can stop as soon as you have found what you wanted.

## Skipping a pass with continue

`continue` is the opposite. It abandons the rest of *this pass* and jumps back
to the top of the loop for the next one:

```lua
for i = 1, 6 do
	if i % 2 == 0 then
		continue -- @n skips the print below, then starts the next pass
	end
	print(`Odd number: {i}`)
end
```

```output
Odd number: 1  -  Server - Script:5
Odd number: 3  -  Server - Script:5
Odd number: 5  -  Server - Script:5
```

`i % 2` is the remainder after dividing by 2 — remember `%` from lesson 2.2. Even
numbers leave 0, so the `if` catches them and `continue` skips the print. Only
the odd ones get through.

Like `break`, `continue` should be the **last** line of its block. Anything
after it in the same block can never run, and Studio warns you about it with a
wavy underline.

```lua predict=p4-continue
for i = 1, 5 do
	if i == 3 then
		continue
	end
	print(i)
end
```

> **Key idea** `continue` skips only the rest of this pass, and the loop carries on with the next one.

## repeat — run it at least once

`repeat ... until` is a `while` loop with the question at the **bottom**. It runs
the block first and asks afterwards, so the block always happens at least once:

```lua
local potions = 0

repeat
	potions += 1
	print(`Drinking potion {potions}...`)
until potions >= 3 or math.random(1, 3) == 1 -- @n the loop stops when this is true, not when it is false

print(`Stopped after {potions}`)
```

```output
Drinking potion 1...  -  Server - Script:5
Drinking potion 2...  -  Server - Script:5
Drinking potion 3...  -  Server - Script:5
Stopped after 3  -  Server - Script:8
```

(Yours may stop sooner if the random roll comes up on the first or second drink.)

Two things to notice. `until` takes the question for **stopping** — the opposite
of `while`, which takes the question for carrying on. And there is no `do` and
no `end`: the block ends at `until` itself, which makes it a neat fit for
*do this until something happens*.

| | question checked | loop runs |
|---|---|---|
| `while cond do` | at the top | zero times or more |
| `repeat` | at the bottom | one time or more |

```task=u4-control
- Run the `break` script and check the loop stops at coin 8
- Delete the `break` and see it run all twenty passes
- Use `continue` to print only multiples of 3 between 1 and 15
- Run the potion script a few times and spot a run that stops early
```

> **Key idea** `repeat ... until` asks its question at the bottom, so the block always runs at least once.

## Loops inside loops

A loop can live inside another one. The inner loop finishes completely for each
single pass of the outer one:

```lua
for row = 1, 3 do
	local line = ""
	for column = 1, 4 do
		line ..= "#" -- @n `..=` adds a `#` onto the end of `line`
	end
	print(`Row {row}: {line}`)
end
```

```output
Row 1: ####  -  Server - Script:6
Row 2: ####  -  Server - Script:6
Row 3: ####  -  Server - Script:6
```

Three rows, and each row builds a line of four hashes: twelve passes in total,
but only three prints.

That is handy for making grids. Each loop controls one direction:

```lua
for x = 1, 4 do
	for z = 1, 4 do
		local tile = Instance.new("Part")
		tile.Name = "Tile"
		tile.Anchored = true
		tile.Size = Vector3.new(6, 0.5, 6)
		tile.Position = Vector3.new(x * 7 - 21, 0.25, z * 7 - 60)
		tile.Color = Color3.fromRGB(60, 60, 90)
		tile.Parent = workspace
	end
end

print("Floor done.")
```

```output
Floor done.  -  Server - Script:13
```

A 4 by 4 floor, laid on the Baseplate a little way in front of the spawn —
sixteen parts from two loops, and the two positions (`x` and
`z`) are kept apart so you can change each one separately.

> **Key idea** The inner loop finishes completely for every single pass of the outer loop.

## Fix the bug

This loop is meant to build parts 1, 2, 4 and 5 — skipping number 3, which is
where a doorway goes. But it only builds two:

```lua
for i = 1, 5 do
	if i == 3 then
		break
	end
	print(`Building part {i}`)
end
```

```output
Building part 1  -  Server - Script:5
Building part 2  -  Server - Script:5
```

```solution
for i = 1, 5 do
	if i == 3 then
		continue
	end
	print(`Building part {i}`)
end
-- break leaves the whole loop, so parts 4 and 5 never happened.
-- continue skips only this pass and carries on with 4 and 5.
```

```lua predict=p4-nested
local count = 0

for a = 1, 3 do
	for b = 1, 2 do
		count += 1
	end
end

print(count)
```

## Your turn

Build a checkerboard floor with a `for` inside a `for`: eight tiles across and
eight tiles deep, where every tile whose two numbers add up to an even number is
dark and the rest are light. That is 8 by 8, so 64 parts.

```output
Checkerboard done: 64 tiles  -  Server - Script:22
```

```solution
local tiles = 0

for x = 1, 8 do
	for z = 1, 8 do
		local tile = Instance.new("Part")
		tile.Name = "Tile"
		tile.Anchored = true
		tile.Size = Vector3.new(6, 0.5, 6)
		tile.Position = Vector3.new(x * 7 - 28, 0.25, z * 7 - 80)

		if (x + z) % 2 == 0 then
			tile.Color = Color3.fromRGB(30, 30, 40)
		else
			tile.Color = Color3.fromRGB(220, 220, 230)
		end

		tile.Parent = workspace
		tiles += 1
	end
end

print(`Checkerboard done: {tiles} tiles`)
-- 8 x 8 passes of the inner loop, so tiles ends at 64.
```

```task=u4-turn3
- Build the checkerboard without peeking at the solution
- Your Output ends with `Checkerboard done: 64 tiles`
- Stand on it and walk around — then change the tile size and the spacing
- Make the pattern diagonal by using `(x + z) % 3` instead of `% 2`
```

> **Recap**
> - `break` leaves the loop; `continue` skips one pass.
> - `repeat ... until` runs its block at least once.
> - A loop inside a loop runs fully on every pass of the outer one.

> **Done when** all checklists are ticked. The one to remember: `break` leaves
> the loop, `continue` skips one pass, and `repeat ... until` runs its block at
> least once.
</div>


<!-- ═══════════════════════════ 4.4 ═══════════════════════════ -->
<div id="md-4.4" hidden>
# Build: a rainbow staircase

Time to put the unit together. You are going to build a staircase that climbs
from the Baseplate up into the sky, 24 steps with every step a different colour
of the rainbow — and then make one part climb it, hopping from step to step.

Colour is the new idea here. `Color3.fromHSV` builds a colour from a **hue** — a
position on the colour wheel — from 0 to 1:

| hue | colour |
|---|---|
| 0 | red |
| 0.17 | yellow |
| 0.33 | green |
| 0.5 | cyan |
| 0.67 | blue |
| 0.83 | magenta |
| 1 | back to red |

That last row is the useful part: hue 0 and hue 1 are the same red. So if you
divide the steps of a staircase evenly between 0 and 1, the colours sweep the
whole wheel and meet up neatly at the top.

## The script

Replace everything in your Script with this, then press Play:

```lua
-- settings: change these to reshape the staircase
local STEPS = 24
local STEP_WIDTH = 6
local STEP_DEPTH = 3
local STEP_HEIGHT = 0.5
local CLIMB = 1.5              -- how far up each step is
local START = Vector3.new(16, 0, -10)

local steps = {} -- @n an empty list, ready to hold the parts

for i = 1, STEPS do
	local height = i * CLIMB

	local step = Instance.new("Part")
	step.Name = `Step{i}`
	step.Anchored = true
	step.Size = Vector3.new(STEP_WIDTH, STEP_HEIGHT, STEP_DEPTH)
	step.Position = START + Vector3.new(0, height, i * STEP_DEPTH) -- @n adding a Vector3 to START moves the step up and along
	step.Material = Enum.Material.SmoothPlastic

	local hue = (i - 1) / (STEPS - 1) -- @n gives 0 on step 1 and 1 on the last step
	step.Color = Color3.fromHSV(hue, 1, 1)

	step.Parent = workspace
	steps[i] = step -- @n files this part in the list so the next loop can find it
end

-- a small ball to climb it
local ball = Instance.new("Part")
ball.Name = "Climber"
ball.Shape = Enum.PartType.Ball
ball.Anchored = true
ball.Size = Vector3.new(2, 2, 2)
ball.Position = START + Vector3.new(0, 2, 0)
ball.Color = Color3.fromRGB(255, 255, 255)
ball.Parent = workspace

-- walk the ball up, one step at a time
for i = 1, STEPS do
	local step = steps[i]
	ball.Position = step.Position + Vector3.new(0, 2, 0)
	ball.Color = step.Color
	task.wait(0.15)
end

print(`Climbed {STEPS} steps, finishing {STEPS * CLIMB} studs up`)
```

```output
Climbed 24 steps, finishing 36 studs up  -  Server - Script:46
```

Look around — just to one side of where you spawned, a staircase runs away into
the distance,
red at the bottom and red again at the top. A white ball hops from step to step,
taking on the colour of whatever it is standing on.

```task=u4-build
- Paste the script and press Play
- Watch the ball climb the whole staircase
- Find `Step1` and `Step24` in Explorer and check their colours are both red
```

> **Key idea** Hue 0 and hue 1 are the same red, so spreading the steps evenly from 0 to 1 sweeps the whole colour wheel.

## How it works

Everything in it is from this unit or earlier:

- **Settings at the top.** Six numbers describe the whole staircase. `CLIMB`
  sets how steep it is; `STEP_DEPTH` how deep each tread is.
- **A `for` loop that builds.** `i` runs from 1 to 24 and every number that
  changes per step comes from `i`: the height (`i * CLIMB`) and the distance
  along (`i * STEP_DEPTH`).
- **A table holding the parts** — something new, used here just this once.
  `local steps = {}` makes an empty list and `steps[i] = step` files step number
  `i` in it, so the second loop can find the parts the first loop made. Tables
  get a whole unit of their own in unit 6.
- **Hue maths.** `(i - 1) / (STEPS - 1)` maps 1 to 24 onto 0 to 1. At `i = 1` it
  is 0, at `i = 24` it is exactly 1. That is why the top step matches the bottom.
- **`Color3.fromHSV`.** Three numbers: hue 0 to 1, saturation 1 for a full
  colour, and value 1 for full brightness. Lower the value to 0.4 and you get the
  same rainbow in dark colours.
- **A second loop, this time in time.** The first loop builds instantly. The
  second one has a `task.wait` in it, so you can watch the ball move. Same loop
  shape, completely different job.

> **Key idea** One loop builds the parts and a second loop with a `task.wait` moves something along them.

## Test it with a shorter staircase

Twenty-four steps is a lot to sit through when you are only changing the colours.
Set `STEPS` to `5` while you fiddle, then put it back:

```lua
local STEPS = 5
```

The hue maths keeps working at any size, because it divides by `STEPS - 1`
rather than assuming 24. That is the whole point of deriving values from `i`:
change one setting and the pattern rebuilds itself correctly.

```lua predict=p4-hue
local STEPS = 5

for i = 1, STEPS do
	local hue = (i - 1) / (STEPS - 1)
	print(`Step {i}: hue {hue}`)
end
```

```task=u4-tweak
- Set `STEPS` to `5` and watch both loops still work
- Make the staircase snake from side to side: change the Position line's `Vector3.new(0, height, ...)` to `Vector3.new(math.sin(i / 3) * 10, height, ...)` (`math.sin` makes a smooth wave — new, but harmless)
- Set the saturation to `0.5` in `Color3.fromHSV` for washed-out pastel steps
- Put `STEPS` back to `24`
```

> **Key idea** Work every value out from `i` and a setting, and one change to the setting rebuilds the whole pattern.

## Make it yours

Some ideas — try at least one:

- Add a `local SPEED = 0.5` setting and use `task.wait(SPEED)` so you can slow
  the climb down.
- Make the ball climb back down again with `for i = STEPS, 1, -1 do`.
- Put the staircase in the dark: set `Lighting.ClockTime = 22` and give every
  step `Enum.Material.Neon` so it glows.
- Add a landing at the top — a wide part after the loop, using `STEPS` to work
  out where it goes.

```task=u4-own
- Add something new to the staircase
- Press Play and watch it work
- Show it to someone
```

> **Recap**
> - `Color3.fromHSV` turns a hue from 0 to 1 into a colour.
> - Values worked out from `i` and settings make a pattern that resizes itself.
> - A list lets a second loop find the parts the first loop made.

> **Done when** all checklists are ticked — and that is the loops unit finished.
> You can repeat things a set number of times, repeat things until they are
> done, skip and stop passes, nest one loop inside another, and turn a loop
> number into positions, sizes and colours. Next up: bundling code up into your
> own functions.
</div>


<!-- ═══════════════════════════ cheat-4 ═══════════════════════════ -->
<div id="md-cheat-4" hidden>
# Loops cheatsheet

Everything from the loops unit on one page. Keep it open next to Studio.

## while — for when you do not know how many times

```lua
while condition do
	-- runs while condition is true
	task.wait(1)
end
```

- Question checked at the top, so it can run zero times.
- Something inside must move it towards false, and it needs a `task.wait`.
- `while true do ... end` is fine as long as the body waits — that is a game loop.

## for — for counting

```lua
for i = 1, 5 do			-- 1, 2, 3, 4, 5
for i = 0, 10, 5 do		-- 0, 5, 10   (third number is the step)
for i = 3, 1, -1 do		-- 3, 2, 1    (negative step counts down)
for i = 1, 5, -1 do		-- runs zero times
```

`i` is local to the loop and fresh each pass. A `for` at any size can build a
row of parts:

```lua
for i = 1, 8 do
	local part = Instance.new("Part")
	part.Anchored = true
	part.Size = Vector3.new(3, 3, 3)
	part.Position = Vector3.new(i * 5 - 25, 4, -25)
	part.Parent = workspace
end
```

## break and continue

```lua
for i = 1, 100 do
	if done then break end        -- leave the loop now
	if i % 2 == 0 then continue end   -- skip the rest of this pass
	print(i)
end
```

- `break` stops looping. `continue` goes straight to the next pass.
- Put `break` and `continue` last in their block — nothing after them runs.

## repeat — at least once

```lua
repeat
	-- runs once before anything is checked
until condition          -- stop WHEN this is true
```

| | checked | runs |
|---|---|---|
| `while` | top | 0 or more times |
| `repeat` | bottom | 1 or more times |

## Loops inside loops

```lua
for x = 1, 4 do
	for z = 1, 4 do
		-- inner loop finishes completely for each pass of the outer one
	end
end
```

## Counting helpers

```lua
local total = 0                           -- accumulator outside the loop
for i = 1, 5 do total += i end            -- added to inside it

if i % 2 == 0 then end                    -- even numbers (remainder is 0)
```

## Colour from a hue

```lua
Color3.fromHSV(0, 1, 1)        -- red
Color3.fromHSV(0.33, 1, 1)     -- green
Color3.fromHSV(0.67, 1, 1)     -- blue

local hue = (i - 1) / (STEPS - 1)   -- spread a whole loop across the wheel
```

Hue 0 and hue 1 are the same colour, so a loop from 0 to 1 starts and ends on
red. Saturation 1 is a full colour, 0 is grey. Value 1 is full brightness.

## Messages you will see

| in Output or on hover | usually means |
|---|---|
| Studio freezes, or an error about the script running too long | a loop with no `task.wait`, or one that never ends |
| a loop body prints nothing at all | the question was false on the first check — often a backwards step or stop value |
| *Unreachable code* on hover | something written after `break`, `continue` or `return` |
| *Expected 'until'* | a `repeat` without its `until` |
| *Expected 'end'* | a `for` or `while` without its `end` |
| same line number on every printed row | that is a loop, working perfectly |

## The rules

1. `while` for when you do not know how many passes, `for` when you do.
2. Something inside the loop must change the answer, or it never ends.
3. Any long loop needs a `task.wait`, or it swallows the whole game.
4. `i` only exists inside its loop; an accumulator made before the loop lives on.
5. `break` leaves, `continue` skips.
6. `repeat ... until` runs at least once and stops when the question is true.
7. Turn the loop number into positions, sizes and colours — that is where loops
   earn their keep.
</div>
