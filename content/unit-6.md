<!-- ════════════════════════════════════════════════════════════════════
     UNIT 6 — TABLES
     Same format as lessons.md. No raw less-than or ampersand anywhere:
     write &lt; and &amp; even inside code fences. Code is indented with tabs.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 6.1 ═══════════════════════════ -->
<div id="md-6.1" hidden>
# Lists

A variable holds one thing. But a game is full of *many* things: every player in
the server, every item in a backpack, every coin on the map. Making a variable for
each one does not work — you would need to know how many there are before the game
even starts. A **table** is one variable that holds as many values as you like.

```lua predict=p6-warm1
local function double(n)
	return n * 2
end

print(double(5) + 1)
```

## Many values in one box

```lua
local fruits = { "Apple", "Banana", "Cherry" }

print(fruits[1])
print(fruits[2])
print(fruits[3])
```

```output
Apple  -  Server - Script:3
Banana  -  Server - Script:4
Cherry  -  Server - Script:5
```

Curly brackets `{ }` make a table. Values separated by commas, in order, make a
**list** — a table where each value has a numbered slot.

The number in square brackets is the **index**: which slot to look in.
`fruits[2]` means *the second thing in `fruits`*.

> **Key idea** A table holds many values, and the number in square brackets says which slot to look in.

## Lists start at 1

```lua predict=p6-zero
local fruits = { "Apple", "Banana", "Cherry" }
print(fruits[0])
```

If you have used another language before, this catches you out: Luau lists start
at **1**, not 0. The first item is `fruits[1]`. If you have never programmed
before, good news — it is the way you would count anyway.

And notice what you got for slot 0: not an error, but `nil`. It is the same quiet
`nil` as a misspelled variable in 2.1 or a missing argument in 5.2. Asking a table
for a slot that is empty always gives `nil`:

```lua
local fruits = { "Apple", "Banana", "Cherry" }
print(fruits[4])
print(fruits[100])
```

```output
nil  -  Server - Script:2
nil  -  Server - Script:3
```

```task=u6-index
- Paste the `fruits` script and print all three fruits
- Print `fruits[0]` and `fruits[4]` and see `nil` both times
- Add a fourth fruit to the list and print it
```

> **Key idea** Luau lists start at 1, and asking for an empty slot gives `nil`, not an error.

## How many?

Put `#` in front of a list and you get how many items it holds — its **length**:

```lua
local fruits = { "Apple", "Banana", "Cherry" }
print(#fruits)
print(`The last fruit is {fruits[#fruits]}`)
```

```output
3  -  Server - Script:2
The last fruit is Cherry  -  Server - Script:3
```

`fruits[#fruits]` reads from the inside out: `#fruits` is 3, so it is
`fruits[3]` — the last item, however long the list is. You will use that trick a
lot.

An empty list is just two curly brackets, and its length is 0:

```lua
local backpack = {}
print(#backpack)
```

```output
0  -  Server - Script:2
```

## Changing a slot

A slot works like a variable. `=` puts something new in it:

```lua
local fruits = { "Apple", "Banana", "Cherry" }
fruits[2] = "Blueberry" -- @n this overwrites whatever was in slot 2
fruits[4] = "Damson" -- @n slot 4 was empty, so this grows the list

print(fruits[2])
print(#fruits)
```

```output
Blueberry  -  Server - Script:5
4  -  Server - Script:6
```

Slot 2 was replaced. Slot 4 was empty, so setting it added a new item on the end —
and `#fruits` went up to 4.

Do not skip slots. Setting `fruits[10]` on a list of three leaves holes at 5 to 9,
and `#` stops meaning *how many* in a reliable way. Lists work best with no gaps:
1, 2, 3, and so on. Next lesson you will meet `table.insert`, which adds to the end
for you so you never have to count.

```task=u6-length
- Print `#fruits` for a list of three
- Change slot 2 and add slot 4, then print the length again
- Make an empty list called `backpack` and print `#backpack`
```

## One list, two names

This should feel familiar from parts in 2.4:

```lua predict=p6-ref
local a = { "Sword", "Shield" }
local b = a
b[1] = "Axe"
print(a[1])
```

A table works like a part, not like a number. The variable holds a **reference**
to the one real table. `local b = a` copies the directions, not the table. Two
names, one list — so changing it through `b` changes what `a` sees.

That matters as soon as you hand a table to a function: the function gets a
reference too, so if it changes the table, the caller's table changes.

> **Key idea** A table variable holds a reference, so two names can point at one list and a change through either shows in both.

## Printing a whole list

Try printing the list itself:

```lua
local fruits = { "Apple", "Banana", "Cherry" }
print(fruits)
```

Studio does not print the words. It shows the table as a small expandable `{...}`
with an arrow you can click to look inside — handy for checking, but not text you
can read in a sentence. (Some Studio settings show a code like `table: 0x...`
instead. Same idea: it is a table, not a sentence.)

To turn a list into readable text, use `table.concat`. It joins every item with
whatever string you give it:

```lua
local fruits = { "Apple", "Banana", "Cherry" }
print(table.concat(fruits, ", ")) -- @n the `", "` goes between each pair of items
```

```output
Apple, Banana, Cherry  -  Server - Script:2
```

`table.concat` works on lists of strings and numbers. You will meet the rest of the
`table.` toolbox next lesson.

## Roblox: a list of colours

Lists are perfect for a fixed set of choices. Here is a part that cycles through
three colours, using a `for` loop from unit 4 to walk the indexes:

```lua
local COLOURS = {
	Color3.fromRGB(255, 80, 80),
	Color3.fromRGB(80, 255, 120),
	Color3.fromRGB(80, 140, 255),
}

local part = Instance.new("Part")
part.Anchored = true
part.Size = Vector3.new(6, 6, 6)
part.Position = Vector3.new(0, 8, -12)
part.Material = Enum.Material.Neon
part.Parent = workspace

for i = 1, #COLOURS do -- @n `#COLOURS` is 3 today, and grows with the list
	part.Color = COLOURS[i]
	print(`Colour {i} of {#COLOURS}`)
	task.wait(1)
end
```

```output
Colour 1 of 3  -  Server - Script:16
Colour 2 of 3  -  Server - Script:16
Colour 3 of 3  -  Server - Script:16
```

Two things to notice. The list is written over several lines, one item per line,
with a comma after **every** item — even the last one. Luau allows that trailing
comma, and it means adding a fourth colour is one new line, not two edits.

And the loop uses `#COLOURS` as its end, not `3`. Add a fourth colour and the loop
runs four times without any other change.

> **Key idea** Loop to `#COLOURS` instead of a typed number and the loop follows the list when it grows.

## Your turn

Make a list called `names` with four names in it. Then print, in this order:

- how many names there are,
- the first name,
- the last name — using `#`, not by typing 4,
- every name joined with `" and "`.

With the names Ada, Grace, Alan and Linus your Output should read:

```output
4  -  Server - Script:3
First: Ada  -  Server - Script:4
Last: Linus  -  Server - Script:5
Ada and Grace and Alan and Linus  -  Server - Script:6
```

```solution
local names = { "Ada", "Grace", "Alan", "Linus" }

print(#names)
print(`First: {names[1]}`)
print(`Last: {names[#names]}`)
print(table.concat(names, " and "))
```

```task=u6-turn
- Write the names script without opening the solution
- Your Output matches the four lines above
- Add a fifth name and check `Last:` changes without touching that line
```

> **Recap**
> - A list keeps many values in order, and slots start at 1.
> - `#` says how many items there are, and an empty slot is `nil`.
> - Two names can share one table, so a change through one shows in the other.

> **Done when** all checklists are ticked. A list keeps many values in order.
> Slots start at **1**, `#` says how many, and an empty slot is `nil`, not an
> error.
</div>


<!-- ═══════════════════════════ 6.2 ═══════════════════════════ -->
<div id="md-6.2" hidden>
# Looping over lists

A list on its own just sits there. The real power comes from doing something to
**every** item in it — every player, every coin, every enemy — without knowing
ahead of time how many there will be. This lesson is the loop you will write more
than any other in Roblox.

```lua predict=p6-warm2
local fruits = { "Apple", "Banana", "Cherry" }
fruits[2] = "Kiwi"
print(#fruits, fruits[2])
```

## ipairs: every item, in order

```lua
local fruits = { "Apple", "Banana", "Cherry" }

for index, fruit in ipairs(fruits) do -- @n `index` gets the slot number, `fruit` gets the item in it
	print(index, fruit)
end
```

```output
1 Apple  -  Server - Script:4
2 Banana  -  Server - Script:4
3 Cherry  -  Server - Script:4
```

Read it as: *for each slot in `fruits`, put the slot number in `index` and the
value in `fruit`, then run the body.* The body runs once per item.

- `ipairs` is short for *index pairs*: it walks the list from slot 1 upwards and
  hands you both the index and the value, one pair at a time.
- `index` and `fruit` are names you choose, like parameters. Pick names that say
  what they are.
- Both only exist inside the loop, like the counter in a numeric `for` (4.2).

It does the same job as `for i = 1, #fruits do` with `fruits[i]` inside — but you
get the value handed to you, so there is less to type and less to get wrong.

> **Key idea** `for index, value in ipairs(list) do` runs the body once per item, in order, and hands you the slot number and the value.

## Not using the index

Often you only want the value. The convention is to name the index `_`, which
says to anyone reading: *I am not using this*:

```lua
local scores = { 40, 75, 20, 90 }
local total = 0

for _, score in ipairs(scores) do -- @n `_` is just a name for an index you will not use
	total += score
end

print(`Total: {total}`)
```

```output
Total: 225  -  Server - Script:8
```

`total` is made **before** the loop, so it survives it — the same rule as in 4.2.

You will also see Roblox code that leaves out `ipairs` and writes
`for _, score in scores do`. Modern Luau understands that too and loops just the
same. This course writes `ipairs` because it says out loud *this is a list, walked
in order* — but read both.

```task=u6-loop
- Paste the `ipairs` fruit script and check the three lines
- Paste the scores script and get `Total: 225`
- Add a fifth score and check the total changes with no other edit
```

## Adding and removing

The `table` library has the tools you need to change a list while the game runs:

```lua
local backpack = { "Sword" }

table.insert(backpack, "Shield")       -- add to the end
table.insert(backpack, "Potion")
table.insert(backpack, 1, "Map")       -- add at slot 1, push the rest along

print(table.concat(backpack, ", "))

table.remove(backpack, 2)              -- take out slot 2, close the gap
print(table.concat(backpack, ", "))
print(#backpack)
```

```output
Map, Sword, Shield, Potion  -  Server - Script:7
Map, Shield, Potion  -  Server - Script:10
3  -  Server - Script:11
```

| | what it does |
|---|---|
| `table.insert(list, value)` | add `value` to the end |
| `table.insert(list, i, value)` | add `value` at slot `i`, moving the rest up one |
| `table.remove(list, i)` | take out slot `i`, moving the rest down one — and give it back |
| `table.remove(list)` | take out the last item |
| `table.find(list, value)` | the slot `value` is in, or `nil` if it is not there |
| `table.concat(list, sep)` | every item joined into one string |

`table.insert` and `table.remove` always keep the list tidy — no holes — which is
why you should use them instead of setting slots by hand.

> **Key idea** `table.insert` and `table.remove` change a list and keep it tidy, with no holes.

## Finding something

`table.find` answers *is this in the list, and where?*:

```lua
local backpack = { "Map", "Sword", "Potion" }

print(table.find(backpack, "Sword"))
print(table.find(backpack, "Bow"))

if table.find(backpack, "Map") then
	print("You can see the whole island.")
end
```

```output
2  -  Server - Script:3
nil  -  Server - Script:4
You can see the whole island.  -  Server - Script:7
```

It returns the slot number, or `nil`. And since only `false` and `nil` count as
false (3.2), you can drop it straight into an `if`.

```lua predict=p6-remove
local queue = { "Ada", "Grace", "Alan" }
local first = table.remove(queue, 1)
print(first, #queue, queue[1])
```

```task=u6-insert
- Paste the backpack script and check both Output lines
- Use `table.find` to check for an item that is there and one that is not
- Write the two lines that remove `"Sword"` without knowing its slot: find it, then remove it
```

## Roblox: a row of parts you can keep track of

Here is why you put parts in a list. Build them, keep the references, and you can
deal with all of them later:

```lua
local pillars = {}

for i = 1, 5 do
	local part = Instance.new("Part")
	part.Anchored = true
	part.Size = Vector3.new(2, 8, 2)
	part.Position = Vector3.new(i * 5, 4, -15)
	part.Parent = workspace
	table.insert(pillars, part) -- @n keeps the part in the list so later code can find it
end

print(`Built {#pillars} pillars`)
task.wait(2)

for _, pillar in ipairs(pillars) do
	pillar.Color = Color3.fromRGB(255, 200, 0)
	pillar.Material = Enum.Material.Neon
	task.wait(0.3)
end
```

```output
Built 5 pillars  -  Server - Script:12
```

The first loop builds and remembers. The second loop, two seconds later, lights
them up one by one. Without the list, the parts would still be in the world — but
the script would have lost track of them as soon as each `part` variable went out
of scope.

> **Key idea** Keep the parts you build in a list and the script can come back and deal with all of them later.

## Fix the bug

This is meant to remove every `"Rock"` from the backpack:

```lua
local backpack = { "Rock", "Rock", "Gem", "Rock" }

for i = 1, #backpack do -- @n `#backpack` is worked out once, before any rock is removed
	if backpack[i] == "Rock" then
		table.remove(backpack, i)
	end
end

print(table.concat(backpack, ", "))
```

```output
Rock, Gem  -  Server - Script:9
```

One rock got away. When slot 1 is removed, everything slides down — the second
rock moves into slot 1. But the loop has already finished slot 1 and moves on to
slot 2, so it never sees that rock. Removing from a list while walking forwards
through it skips items.

```solution
local backpack = { "Rock", "Rock", "Gem", "Rock" }

for i = #backpack, 1, -1 do          -- walk backwards instead
	if backpack[i] == "Rock" then
		table.remove(backpack, i)
	end
end

print(table.concat(backpack, ", "))
-- Walking from the end, a removal only slides items you have
-- already checked. Output: Gem
```

Counting down with a negative step is from 4.2. This is one of the places it
really earns its keep.

```task=u6-fix
- Paste the broken script and see the rock that got away
- Change the loop to count backwards and get just `Gem`
- Explain to yourself why walking backwards fixes it
```

> **Key idea** Removing items while walking a list forwards skips some, so walk it backwards.

## Your turn

Start with an empty list called `log`. Use a loop to insert the words `Day 1`
up to `Day 5` into it. Then remove the first and the last day, and print what is
left joined with `" / "` and how many days are in it:

```output
Day 2 / Day 3 / Day 4  -  Server - Script:10
3 days left  -  Server - Script:11
```

```solution
local log = {}

for day = 1, 5 do
	table.insert(log, `Day {day}`)
end

table.remove(log, 1)
table.remove(log)

print(table.concat(log, " / "))
print(`{#log} days left`)
```

```task=u6-turn2
- Write the log script without opening the solution
- Your Output matches the two lines above
- Change the loop to 10 days and see the result grow
```

> **Recap**
> - `ipairs` walks a list in order and gives you the index and the value.
> - `table.insert`, `table.remove` and `table.find` add, take out and look up items.
> - To remove while looping, count backwards with `for i = #list, 1, -1 do`.

> **Done when** all checklists are ticked. `for _, value in ipairs(list) do`
> walks every item in order. `table.insert` and `table.remove` keep the list
> tidy — and to remove while looping, walk backwards.
</div>


<!-- ═══════════════════════════ 6.3 ═══════════════════════════ -->
<div id="md-6.3" hidden>
# Dictionaries

A list numbers its slots: 1, 2, 3. But lots of things in a game are better found
by **name** than by number. A player's stats: coins, level, health. A shop's
prices: Sword, Shield, Potion. For that you want a table whose slots have names —
a **dictionary**.

```lua predict=p6-warm3
local hasKey = false
local isVip = true
print(hasKey or isVip, not isVip)
```

## Slots with names

```lua
local stats = {
	coins = 120, -- @n the key `coins` is on the left, its value on the right
	level = 3,
	name = "Ada",
}

print(stats.coins)
print(stats.name)
```

```output
120  -  Server - Script:7
Ada  -  Server - Script:8
```

Each slot has a **key** — the name — and a **value**. `coins = 120` means *a slot
called `coins` holding 120*. Read it with a dot, exactly like a property on a
part: `stats.coins`.

That is not a coincidence. Every Roblox Instance behaves a lot like a dictionary:
`part.Color` is *the value under the key `Color`*. You have been reading
dictionaries since lesson 2.4.

> **Key idea** A dictionary slot has a key and a value, and you read it with a dot, like a property on a part.

## Changing, adding, removing

```lua
local stats = { coins = 120, level = 3 }

stats.coins += 30          -- change it
stats.gems = 5             -- add a new key
stats.level = nil          -- remove a key

print(stats.coins, stats.gems, stats.level)
```

```output
150 5 nil  -  Server - Script:7
```

- Setting a key that exists changes it. `+=` works, like on any variable.
- Setting a key that does not exist yet adds it.
- Setting a key to `nil` **removes** it. A slot holding *nothing* is the same as
  no slot at all.

And a key that was never there gives `nil` — no error. A typo in a key name,
`stats.cions`, quietly gives `nil` just like a typo in a variable name.

```task=u6-dict
- Make a `stats` dictionary with three keys and print two of them
- Add a new key, change one with `+=`, remove one with `nil`
- Print a key you misspell on purpose and see `nil`
```

> **Key idea** Setting a key to `nil` removes it, and a key that was never there gives `nil`, not an error.

## Square brackets for keys in variables

The dot only works when you type the key's name into the script. When the key is
in a variable — say, whichever item the player picked — use square brackets:

```lua
local prices = {
	Sword = 100,
	Shield = 75,
	Potion = 20,
}

local choice = "Shield"

print(prices[choice])
print(prices["Potion"])
print(prices.choice) -- @n the dot looks for a key named choice, not the variable
```

```output
75  -  Server - Script:9
20  -  Server - Script:10
nil  -  Server - Script:11
```

The last line is the trap. `prices.choice` means *the key literally called
`choice`*, and there isn't one. The dot never looks inside a variable.

| you write | Luau looks up the key |
|---|---|
| `prices.Sword` | `"Sword"` |
| `prices["Sword"]` | `"Sword"` — the same thing |
| `prices[choice]` | whatever string is in `choice` |
| `prices.choice` | `"choice"` — almost never what you meant |

Square brackets also let you use keys that are not valid names, like
`prices["Fire Sword"]` with a space in it.

```lua predict=p6-dot
local inventory = { Apple = 3, Pear = 0 }
local fruit = "Apple"
print(inventory.fruit)
```

> **Key idea** When the key is in a variable, use square brackets, because the dot never looks inside a variable.

## pairs: every key and value

`ipairs` walks a list by number. For a dictionary, which has no numbers, use
`pairs`:

```lua
local prices = {
	Sword = 100,
	Shield = 75,
	Potion = 20,
}

for item, price in pairs(prices) do -- @n each pass hands you one key and its value
	print(`{item} costs {price}`)
end
```

```output
Shield costs 75  -  Server - Script:8
Sword costs 100  -  Server - Script:8
Potion costs 20  -  Server - Script:8
```

Your three lines may come out in a **different order**. That is not a bug:
dictionaries have no order at all. `pairs` visits every key exactly once, but in
whatever order it finds them. If order matters, you need a list — the next lesson
shows how to sort one.

| | walks | order |
|---|---|---|
| `ipairs(list)` | slots 1, 2, 3 … | always in order |
| `pairs(dict)` | every key | no order you can rely on |

Also, `#` does not count a dictionary. `#prices` gives 0, because there are no
numbered slots. To count keys, loop with `pairs` and add one each time.

```task=u6-pairs
- Paste the `prices` script with `pairs` and see all three lines
- Press Play a few times and notice the order is not promised
- Use `pairs` to add up every price and print the total
```

> **Key idea** `pairs` visits every key in no reliable order, and `#` does not count a dictionary.

## Roblox: one dictionary of settings

In 2.6 the lamp post kept its settings in separate variables at the top. A
dictionary keeps them together, and you can hand the whole lot to a function in
one go:

```lua
local function makeBlock(settings)
	local part = Instance.new("Part")
	part.Anchored = true
	part.Size = settings.size
	part.Position = settings.position
	part.Color = settings.colour or Color3.fromRGB(200, 200, 200) -- @n grey is used only when the dictionary has no colour key
	part.Parent = workspace
	return part
end

makeBlock({
	size = Vector3.new(4, 1, 4),
	position = Vector3.new(0, 4, -12),
	colour = Color3.fromRGB(255, 120, 200),
})

makeBlock({
	size = Vector3.new(2, 6, 2),
	position = Vector3.new(6, 3, -12),
})
```

This is the cure for the five-parameter `makePart` from 5.5. With a dictionary,
**the arguments have names**. Order no longer matters, a missing one is easy to
spot, and a default with `or` still works for anything left out — the second block
comes out grey.

> **Key idea** Hand a function one dictionary and the arguments have names, so their order stops mattering.

## Fix the bug

This is meant to print each player's score:

```lua
local scores = { Ada = 250, Grace = 90 }

for name, score in ipairs(scores) do
	print(`{name}: {score}`)
end

print("Done")
```

```output
Done  -  Server - Script:7
```

No error, and no scores either. `ipairs` only walks numbered slots starting at 1.
This table has no slot 1 — only the keys `Ada` and `Grace` — so the loop ends
before it even starts.

```solution
local scores = { Ada = 250, Grace = 90 }

for name, score in pairs(scores) do      -- pairs, for a dictionary
	print(`{name}: {score}`)
end

print("Done")
```

```task=u6-fixpairs
- Paste the broken script and see only `Done`
- Change `ipairs` to `pairs` and see both scores
- Say which of the two you would use for a list of names, and why
```

> **Key idea** `ipairs` only walks slots 1, 2, 3 and so on, so use `pairs` for a dictionary.

## Your turn

Make a dictionary called `prices` with three items. Make a variable `coins` set
to 100 and a variable `wanted` holding the name of one item. Then:

- if the item is not in the shop at all, print `We do not sell that`,
- else if `coins` is enough, take the price off and print what is left,
- otherwise print how many more coins are needed.

With `Sword = 100, Shield = 75, Potion = 20`, coins at 100 and `wanted` set to
`"Shield"`, your Output should be:

```output
Bought Shield. 25 coins left  -  Server - Script:10
```

Then try `"Bow"`, and then `"Sword"` with coins at 60.

```solution
local prices = { Sword = 100, Shield = 75, Potion = 20 }
local coins = 100
local wanted = "Shield"

local price = prices[wanted]
if price == nil then
	print("We do not sell that")
elseif coins >= price then
	coins -= price
	print(`Bought {wanted}. {coins} coins left`)
else
	print(`You need {price - coins} more coins`)
end
```

```task=u6-turn3
- Write the shop without opening the solution
- Get `Bought Shield. 25 coins left`
- Try `"Bow"`, then `"Sword"` with 60 coins, and see all three paths
```

> **Recap**
> - A dictionary finds values by key, and `dict.key` reads one.
> - Use `dict[variable]` when the key is in a variable, and `= nil` to remove a key.
> - `pairs` walks every key and value, in no order you can rely on.

> **Done when** all checklists are ticked. A dictionary finds values by name.
> `dict.key` when you type the name, `dict[variable]` when the name is in a
> variable. `pairs` walks it in no particular order, and `= nil` removes a key.
</div>


<!-- ═══════════════════════════ 6.4 ═══════════════════════════ -->
<div id="md-6.4" hidden>
# Tables of tables

A value in a table can be anything — including another table. A list of
dictionaries is how almost all game data is shaped: a list of players, each with a
name and a score; a list of items, each with a price and a rarity. This lesson
puts the pieces together, and then shows that Roblox hands you lists all the time.

```lua predict=p6-warm4
local prices = { Sword = 100, Potion = 20 }
local item = "Potion"
print(prices[item], prices.item)
```

## A list of dictionaries

```lua
local players = {
	{ name = "Ada", score = 250 },
	{ name = "Grace", score = 90 },
	{ name = "Alan", score = 410 },
}

print(players[1].name) -- @n first slot of the list, then its `name` key
print(players[3].score)
print(#players)
```

```output
Ada  -  Server - Script:7
410  -  Server - Script:8
3  -  Server - Script:9
```

Read `players[1].name` from left to right, one step at a time:

1. `players` — the list.
2. `players[1]` — its first item, which is a dictionary.
3. `players[1].name` — the `name` inside that dictionary.

It is the same as following a path in Explorer: `workspace.Baseplate.Color` is
three steps too.

> **Key idea** A value in a table can be another table, so `players[1].name` reads one step at a time from left to right.

## Walking it

`ipairs` hands you each dictionary in turn, and the dot reads its keys:

```lua
local players = {
	{ name = "Ada", score = 250 },
	{ name = "Grace", score = 90 },
	{ name = "Alan", score = 410 },
}

for place, player in ipairs(players) do
	print(`{place}. {player.name} — {player.score}`)
end
```

```output
1. Ada — 250  -  Server - Script:8
2. Grace — 90  -  Server - Script:8
3. Alan — 410  -  Server - Script:8
```

`player` holds a different dictionary each time round. And it is a reference
(6.1), so `player.score += 10` inside the loop changes the real entry in the list.

```task=u6-nested
- Paste the players list and print `players[2].name`
- Walk it with `ipairs` and print every row
- Add a fourth player, then give everyone 10 bonus points in a loop
```

> **Key idea** In an `ipairs` loop the loop variable is a reference to the real entry, so changing it changes the list.

## Sorting

`table.sort` puts a list in order. On plain numbers or strings it sorts smallest
first:

```lua
local scores = { 40, 75, 20, 90 }
table.sort(scores)
print(table.concat(scores, ", "))
```

```output
20, 40, 75, 90  -  Server - Script:3
```

For a list of dictionaries, Luau cannot guess what *in order* means — by name? by
score? You tell it, with a function. Here is where 5.4 pays off: `table.sort` takes
a function as its second argument.

```lua
local players = {
	{ name = "Ada", score = 250 },
	{ name = "Grace", score = 90 },
	{ name = "Alan", score = 410 },
}

table.sort(players, function(a, b)
	return a.score > b.score -- @n true means `a` goes before `b`, so big scores come first
end)

for place, player in ipairs(players) do
	print(`{place}. {player.name} — {player.score}`)
end
```

```output
1. Alan — 410  -  Server - Script:12
2. Ada — 250  -  Server - Script:12
3. Grace — 90  -  Server - Script:12
```

The function is handed two items, `a` and `b`, and answers one question: **should
`a` come before `b`?** `table.sort` asks that question as many times as it needs
to and shuffles the list into place. `a.score > b.score` means *bigger scores
first* — a leaderboard. Flip it to `&lt;` for smallest first.

```lua predict=p6-sort
local names = { "Grace", "Alan", "Ada" }
table.sort(names, function(a, b)
	return #a &lt; #b
end)
print(names[1])
```

`table.sort` changes the list it was handed. It does not make a new one, and it
returns nothing — so `local sorted = table.sort(list)` gives you `nil`.

```task=u6-sort
- Sort a list of numbers and print it with `table.concat`
- Sort the players by score, biggest first, and print the leaderboard
- Change the sort to put names in alphabetical order with `a.name &lt; b.name`
```

> **Key idea** `table.sort` takes a function that answers should `a` come before `b`, and it changes the list in place.

## Roblox hands you lists

Lots of Roblox functions return a list. The one you will use most is
`GetChildren`: it gives you everything directly inside an Instance, as a list.

```lua
local children = workspace:GetChildren()
print(`Workspace holds {#children} things`)

for _, child in ipairs(children) do
	print(child.Name, child.ClassName)
end
```

```output
Workspace holds 4 things  -  Server - Script:2
Camera Camera  -  Server - Script:5
Terrain Terrain  -  Server - Script:5
Baseplate Part  -  Server - Script:5
SpawnLocation SpawnLocation  -  Server - Script:5
```

Yours may be different: more things if you have added parts, and your character
will appear too if the script runs after you spawn. The colon in
`workspace:GetChildren()` is how you call a function that belongs to an Instance —
you met it in `game:GetService` in 2.5. Unit 7 is all about finding things like
this.

Now loops and lists can work on the world:

```lua
for i = 1, 10 do
	local part = Instance.new("Part")
	part.Anchored = true
	part.Size = Vector3.new(2, 2, 2)
	part.Position = Vector3.new(math.random(-20, 20), 3, math.random(-40, -20))
	part.Parent = workspace
end

task.wait(2)

for _, thing in ipairs(workspace:GetChildren()) do -- @n `GetChildren()` returns a list, so `ipairs` can walk it
	if thing.Name == "Part" then -- @n only things still named Part pass, so the Baseplate is skipped
		thing.Color = Color3.fromRGB(120, 255, 170)
		thing.Material = Enum.Material.Neon
	end
end
```

Ten grey cubes appear, scattered in front of you. Two seconds later, every one of
them lights up green — found by asking Workspace for its children and checking each
one's name. The Baseplate is skipped, because its name is not `Part`.

```task=u6-children
- Print every child of Workspace with its name and class
- Run the scatter script and watch the ten cubes light up
- Count the lit cubes in the loop and print the number at the end
```

> **Key idea** `GetChildren` gives you a list, so the loops you already know can work on everything inside an Instance.

## Your turn

Make a list of four dictionaries, each an item with a `name`, a `price` and a
`rarity` (a string). Sort it by price, cheapest first, then print the list — and
after it, print the total cost of everything:

```output
Potion (Common) costs 20  -  Server - Script:15
Shield (Rare) costs 75  -  Server - Script:15
Sword (Rare) costs 100  -  Server - Script:15
Crown (Legendary) costs 900  -  Server - Script:15
Everything costs 1095  -  Server - Script:18
```

```solution
local items = {
	{ name = "Sword", price = 100, rarity = "Rare" },
	{ name = "Crown", price = 900, rarity = "Legendary" },
	{ name = "Potion", price = 20, rarity = "Common" },
	{ name = "Shield", price = 75, rarity = "Rare" },
}

table.sort(items, function(a, b)
	return a.price &lt; b.price
end)

local total = 0
for _, item in ipairs(items) do
	total += item.price
	print(`{item.name} ({item.rarity}) costs {item.price}`)
end

print(`Everything costs {total}`)
```

```task=u6-turn4
- Write the item list and sort without opening the solution
- Your Output matches the five lines above
- Change the sort to show the most expensive first
```

> **Recap**
> - A list of dictionaries is how game data is shaped: `list[i].key`.
> - `table.sort` needs a function that says whether `a` comes before `b`.
> - `GetChildren` returns a list you can walk with `ipairs`.

> **Done when** all checklists are ticked. A list of dictionaries is how game data
> is shaped: `list[i].key`. `table.sort(list, function(a, b) ... end)` sorts it —
> the function answers *should `a` come before `b`?*
</div>


<!-- ═══════════════════════════ 6.5 ═══════════════════════════ -->
<div id="md-6.5" hidden>
# Build: a loot drop

Unit build time. Every game with treasure has a **loot table**: a list of things
that can drop, each with a chance. Common things drop often, legendary things
almost never. You are going to build one — and every few seconds, a crate drops
out of the sky with a random prize in it, glowing in its rarity's colour.

This is how real games do it. Change the weights and you change the whole game's
economy, without touching a single line of logic.

```lua predict=p6-warm5
print("A")
task.delay(1, function()
	print("B")
end)
print("C")
```

## The script

Replace everything in your Script with this, then press Play:

```lua
-- ── settings ──────────────────────────────────────────────
local DROP_AT = Vector3.new(0, 40, -20)
local DROP_SPREAD = 12             -- how far from DROP_AT a crate can land
local SECONDS_BETWEEN = 2
local DROPS = 15

-- each rarity: a colour, and how big a crate it gets
local RARITIES = {
	Common = { colour = Color3.fromRGB(190, 190, 190), size = 2 },
	Rare = { colour = Color3.fromRGB(80, 150, 255), size = 3 },
	Epic = { colour = Color3.fromRGB(190, 90, 255), size = 3.5 },
	Legendary = { colour = Color3.fromRGB(255, 190, 40), size = 5 },
}

-- the loot table: what can drop, and how often (bigger weight = more often)
local LOOT = {
	{ name = "Stick", rarity = "Common", weight = 50 },
	{ name = "Bread", rarity = "Common", weight = 30 },
	{ name = "Silver Key", rarity = "Rare", weight = 12 },
	{ name = "Spell Book", rarity = "Epic", weight = 6 },
	{ name = "Dragon Egg", rarity = "Legendary", weight = 2 },
}

-- ── picking from the loot table ───────────────────────────
local function totalWeight(loot)
	local total = 0
	for _, entry in ipairs(loot) do
		total += entry.weight
	end
	return total
end

local function rollLoot(loot)
	local roll = math.random(1, totalWeight(loot))
	for _, entry in ipairs(loot) do
		if roll &lt;= entry.weight then -- @n true when the roll lands inside this entry's stretch
			return entry
		end
		roll -= entry.weight -- @n moves the roll past this stretch before the next entry
	end
end

-- ── making a crate in the world ───────────────────────────
local function dropCrate(entry)
	local look = RARITIES[entry.rarity] -- @n square brackets, because the rarity name is in a variable
	local offset = Vector3.new(
		math.random(-DROP_SPREAD, DROP_SPREAD), 0, math.random(-DROP_SPREAD, DROP_SPREAD))

	local crate = Instance.new("Part")
	crate.Name = entry.name
	crate.Size = Vector3.new(look.size, look.size, look.size)
	crate.Position = DROP_AT + offset
	crate.Color = look.colour
	crate.Material = Enum.Material.Neon
	crate.Parent = workspace
	return crate
end

-- ── the drops ─────────────────────────────────────────────
local counts = {}

for i = 1, DROPS do
	local entry = rollLoot(LOOT)
	dropCrate(entry)
	counts[entry.rarity] = (counts[entry.rarity] or 0) + 1 -- @n starts from 0 the first time a rarity drops
	print(`Drop {i}: {entry.name} ({entry.rarity})`)
	task.wait(SECONDS_BETWEEN)
end

for rarity, count in pairs(counts) do
	print(`{rarity}: {count}`)
end
```

```output
Drop 1: Stick (Common)  -  Server - Script:66
Drop 2: Bread (Common)  -  Server - Script:66
Drop 3: Silver Key (Rare)  -  Server - Script:66
Drop 4: Stick (Common)  -  Server - Script:66
Common: 11  -  Server - Script:71
Rare: 3  -  Server - Script:71
Epic: 1  -  Server - Script:71
```

Yours will be different — it is random, and the list is shortened here. Look up:
glowing crates fall out of the sky, tumble and land. The crates are not anchored,
on purpose. The rare ones are bigger and blue, and if you see a big gold one, you
got lucky.

```task=u6-build
- Paste the script and press Play
- Watch the crates drop, and find a few in Explorer by their item names
- Read the counts at the end and compare them with the weights
```

## How it works

- **`RARITIES` is a dictionary of dictionaries.** Look up a rarity by name and you
  get its colour and size: `RARITIES[entry.rarity].colour`. Square brackets,
  because the rarity's name is in a variable (6.3).
- **`LOOT` is a list of dictionaries** — the shape from 6.4. Each entry has a name,
  a rarity, and a **weight**.
- **Weights, not percentages.** The weights add up to 100 here, so a weight of 2 is
  a 2% chance. But they do not have to: add a new item with weight 10 and every
  chance shifts, and nothing else needs editing. `totalWeight` works the total out
  for you.
- **How `rollLoot` picks.** Imagine the weights laid out end to end along a ruler
  of length 100: Stick takes 1–50, Bread 51–80, Silver Key 81–92, Spell Book
  93–98, Dragon Egg 99–100. Roll a number on the ruler, then walk along it: if
  the roll lands inside this entry's stretch, return it; otherwise take this
  stretch off the roll and try the next. Bigger stretches catch more rolls.
- **An early `return` inside a loop** (5.3) ends the whole function the moment a
  winner is found.
- **`counts` starts empty and grows.** `counts[entry.rarity] or 0` means *what we
  have so far, or 0 if this rarity has not dropped yet* — the 3.3 default trick
  on a dictionary key.
- **`pairs` for the summary**, because `counts` is a dictionary. The order of
  those last lines is not promised.

> **Key idea** A loot table is a list of dictionaries, and a bigger weight takes a longer stretch of the ruler, so it drops more often.

## Change one number

Set the Dragon Egg's weight to `40` and press Play. Gold crates everywhere. One
number, and the rarest item in the game became the most common one.

Now put it back to `2`, set `DROPS` to `200` and `SECONDS_BETWEEN` to `0`.
Two hundred crates pour out of the sky into a glowing heap — Roblox copes with that
easily. With that many drops, the counts at the end get very close to the weights: around
100 Commons for every 4 Legendaries. That is how game designers check their
loot tables are fair.

```task=u6-tweak
- Set the Dragon Egg weight to `40` and watch the gold crates fall
- Put it back, then drop 200 crates with no wait between them
- Check the counts at the end roughly match the weights
```

> **Key idea** Change one number in a table and the whole game's odds change, with no edit to the logic.

## Make it yours

Pick at least two:

- Add a new rarity — `Mythic`, say — with its own colour and size, and one item in
  the loot table that uses it.
- Add a `PointLight` to Legendary crates only, so they glow on the ground.
- Make every crate's name show its rarity too: `Dragon Egg (Legendary)`.
- After all the drops, sort a list of the items you got by rarity and print it
  as a list from best to worst. (Hint: give each rarity a `rank` number in
  `RARITIES`, then sort by it.)
- Keep a list of every crate as it drops, and when the drops are finished, wait
  five seconds and `:Destroy()` them all in a loop.
- Give each crate a value in coins, and add up the total value of the haul.

```solution
-- one way to clear up: keep a list of crates, then destroy them all
local crates = {}

for i = 1, DROPS do
	local entry = rollLoot(LOOT)
	table.insert(crates, dropCrate(entry))
	task.wait(SECONDS_BETWEEN)
end

task.wait(5)
for _, crate in ipairs(crates) do
	crate:Destroy()        -- removes it from the game for good (more in 7.1)
end
```

```task=u6-own
- Add at least two new things to the loot drop
- At least one of them changes a table, not just a number
- Press Play and watch your version run
```

> **Recap**
> - A table of settings or odds lets you change the game without touching the logic.
> - Use `RARITIES[entry.rarity]` when the key is in a variable.
> - `pairs` walks a dictionary such as `counts`, in no promised order.

> **Done when** all checklists are ticked — and that is the tables unit. You can
> keep many values in a list, find values by name in a dictionary, put tables
> inside tables, sort them, and walk them with loops. Next up: the world itself —
> finding, cloning and moving the things in your game.
</div>


<!-- ═══════════════════════════ cheat-6 ═══════════════════════════ -->
<div id="md-cheat-6" hidden>
# Tables cheatsheet

Everything from the tables unit on one page. Keep it open next to Studio.

## Lists

```lua
local fruits = { "Apple", "Banana", "Cherry" }

fruits[1]               -- "Apple": lists start at 1
fruits[#fruits]         -- the last item
#fruits                 -- 3: how many
fruits[10]              -- nil: an empty slot, not an error
local empty = {}        -- #empty is 0
```

## Changing a list

| | what it does |
|---|---|
| `table.insert(list, v)` | add to the end |
| `table.insert(list, i, v)` | add at slot `i`, push the rest up |
| `table.remove(list, i)` | take out slot `i`, close the gap, give it back |
| `table.remove(list)` | take out the last item |
| `table.find(list, v)` | the slot `v` is in, or `nil` |
| `table.concat(list, ", ")` | join into one string |
| `table.sort(list)` | sort, smallest first — changes the list, returns nothing |

## Looping

```lua
for i, fruit in ipairs(fruits) do     -- a list: in order, slot by slot
	print(i, fruit)
end

for _, fruit in ipairs(fruits) do     -- _ means "not using this"

for key, value in pairs(prices) do    -- a dictionary: every key, no order

for i = #list, 1, -1 do               -- walk backwards to remove while looping
```

## Dictionaries

```lua
local stats = { coins = 120, level = 3 }

stats.coins += 30           -- change
stats.gems = 5              -- add a key
stats.level = nil           -- remove a key
stats["coins"]              -- same as stats.coins
stats[keyName]              -- the key whose name is IN keyName
counts[k] = (counts[k] or 0) + 1   -- count things up
```

## Tables of tables

```lua
local players = {
	{ name = "Ada", score = 250 },
	{ name = "Alan", score = 410 },
}

players[2].name             -- "Alan"

table.sort(players, function(a, b)
	return a.score > b.score    -- should a come before b? biggest first
end)
```

## Roblox

```lua
for _, child in ipairs(workspace:GetChildren()) do   -- everything directly inside
	print(child.Name)
end
```

## Messages you will see

| in Output or on hover | usually means |
|---|---|
| `nil` from `list[0]` | lists start at 1 |
| `nil` from `dict.key` | a typo in the key, or you meant `dict[key]` with brackets |
| `{...}` or `table: 0x...` | you printed a whole table — print a field or use `table.concat` |
| an `ipairs` loop that never runs | it was a dictionary — use `pairs` |
| `#dict` is 0 | `#` only counts numbered slots |
| an item skipped when removing | you removed while walking forwards — walk backwards |
| *attempt to index nil with 'name'* | `list[i]` was empty, so `list[i].name` had nothing to look in |
| *invalid argument #1 to 'concat'* | the list holds something that is not a string or number |

## The rules

1. `{ }` makes a table. A list has numbered slots; a dictionary has named keys.
2. Lists start at **1**. An empty slot is `nil`, not an error.
3. `ipairs` for lists, in order. `pairs` for dictionaries, in no order.
4. Use `table.insert` and `table.remove` so a list never has holes.
5. `dict.key` when you type the name; `dict[variable]` when the name is in a
   variable.
6. Setting a key to `nil` removes it.
7. A table is a reference, like a part: two names, one table.
</div>
