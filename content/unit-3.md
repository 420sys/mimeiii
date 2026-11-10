<!-- ════════════════════════════════════════════════════════════════════
     UNIT 3 — DECISIONS
     Same format as lessons.md. No raw less-than or ampersand anywhere:
     write &lt; and &amp; even inside code fences.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 3.1 ═══════════════════════════ -->
<div id="md-3.1" hidden>
# Comparing values

Every game is full of questions. Does the player have enough coins? Is it night
yet? Is health below zero? Before a script can *decide* anything, it has to be
able to *ask*. This lesson is about asking.

```lua predict=p3-warm1
local coins = 10
coins += 5
print(`You have {coins} coins`)
```

## A question with a yes or no answer

You have used `>` in maths. In Luau it asks a question, and the answer is a
boolean — `true` or `false`:

```lua
print(5 > 3)
print(5 > 8)
```

```output
true  -  Server - Script:1
false  -  Server - Script:2
```

`5 > 3` is not an instruction. It is a question — *is 5 bigger than 3?* — and
Luau replaces it with the answer. That is all a comparison ever does: it turns
into `true` or `false`.

There are six of them:

| | asks | gives `true` for |
|---|---|---|
| `==` | is it the same? | `5 == 5` |
| `~=` | is it different? | `5 ~= 3` |
| `>` | bigger? | `5 > 3` |
| `&lt;` | smaller? | `3 &lt; 5` |
| `>=` | bigger or the same? | `5 >= 5` |
| `&lt;=` | smaller or the same? | `3 &lt;= 5` |

`~=` is the odd one out. Many languages write *not equal* as `!=`, but Luau uses
a wavy line: `~=`. The `~` key is usually next to the backtick key.

> **Key idea** A comparison is a question, and Luau replaces it with the answer: `true` or `false`.

## One equals sign or two

You already know `=` from the variables unit. It **puts a value in a box**. To
ask whether two things are the same, Luau uses **two** of them:

```lua
local coins = 10        -- one =  : put 10 in the box
print(coins == 10)      -- two == : is the box holding 10?
print(coins == 25)
```

```output
true  -  Server - Script:2
false  -  Server - Script:3
```

Mixing them up is the most common mistake in this unit. Read `=` as *becomes*
and `==` as *is the same as*, and you will rarely get them wrong.

```lua predict=p3-same
print(10 == "10")
```

Types matter here, just like they did with `..` and `+`. A number and a string
are never the same value, even when they look alike. The same goes for
capitals: `"Ada" == "ada"` is `false`, because a capital A is a different
letter as far as Luau is concerned.

```task=u3-compare
- Print `5 > 3`, `5 == 5` and `5 ~= 5` and check your Output says `true`, `true`, `false`
- Print `10 == "10"` and see `false`
- Print `"Ada" == "ada"` — then make it `true` by changing one letter
```

> **Key idea** One `=` puts a value in a box, and two `==` ask whether two values are the same.

## Keeping the answer

A comparison gives you a value, so you can put that value in a variable, just
like a number:

```lua
local coins = 120
local price = 100

local canAfford = coins >= price -- @n the answer is stored, not the two numbers
print(`Can afford it: {canAfford}`)
print(typeof(canAfford)) -- @n so the answer to a comparison really is a boolean
```

```output
Can afford it: true  -  Server - Script:5
boolean  -  Server - Script:6
```

Luau works out the right side of `=` first, as always. `coins >= price` becomes
`true`, and `true` goes into `canAfford`.

Good names for boolean variables read like a yes-or-no question: `canAfford`,
`isNight`, `hasKey`, `isVip`. When you see `if canAfford` in the next lesson,
it will read almost like English.

> **Key idea** The answer to a comparison is a value, so you can keep it in a boolean variable.

## Comparing Roblox things

Properties can be compared too. A property is just a value with a long name:

```lua
local Lighting = game:GetService("Lighting")
local baseplate = workspace.Baseplate

print(baseplate.Anchored == true) -- @n a property on the left, a plain value on the right
print(Lighting.ClockTime >= 18) -- @n false in the afternoon, true once evening starts
print(baseplate.Name == "Baseplate")
```

```output
true  -  Server - Script:4
false  -  Server - Script:5
true  -  Server - Script:6
```

The Baseplate is anchored. A new Baseplate place starts in the early afternoon,
around 14 on the `ClockTime` clock, so `ClockTime >= 18` is `false`. (If you
changed the time in Studio, yours may differ.)

```task=u3-keep
- Make `coins` and `price` variables and store `coins >= price` in `canAfford`
- Print it with backticks, then change `coins` so the answer flips
- Print `Lighting.ClockTime >= 18`, then set `ClockTime` to `20` first and run it again
```

## Some things cannot be compared

`==` and `~=` work on anything — they just say `false` when the types differ.
The size questions are stricter. Asking whether a number is smaller than a
string makes no sense, so Luau stops the script:

```lua
local level = 10
print(level &lt; "20")
```

```output
! ServerScriptService.Script:2: attempt to compare number &lt; string  -  Server - Script:2
```

Same shape of error as the variables unit: which script, which line, what went
wrong. If you ever see *attempt to compare*, look for a value that is the wrong
type — very often a number that is secretly text because it has quotes round it.

> **Key idea** `==` and `~=` work on anything, but the size questions need matching types or the script stops.

## Fix the bug

This script is meant to print whether the player has exactly 50 coins. Studio
underlines it in red, and if you press Play anyway, Output shows:

```lua
local coins = 50
print(coins = 50)
```

```output
! ServerScriptService.Script:2: Expected ')' (to close '(' at column 6), got '='
```

The exact words of a red underline can vary a little between Studio versions,
but the clue is always the same: it found an `=` where it did not expect one.

```solution
local coins = 50
print(coins == 50)
-- One = puts a value in a box. Two == asks a question.
-- Inside print() you want the answer to a question.
```

## Your turn

Write a script with two variables, `health` set to `20` and `maxHealth` set to
`100`. Make two boolean variables from them — one that says whether health is
full, one that says whether health is below 25 — and print both so your Output
looks like this:

```output
Full health: false  -  Server - Script:6
In danger: true  -  Server - Script:7
```

Then set `health` to `100` and run it again. Both answers should flip.

```solution
local health = 20
local maxHealth = 100

local isFull = health == maxHealth
local inDanger = health &lt; 25
print(`Full health: {isFull}`)
print(`In danger: {inDanger}`)
```

```task=u3-turn
- Write the health script without peeking at the solution
- Your Output says `Full health: false` and `In danger: true`
- Set `health` to `100` and see both answers flip
```

> **Recap**
> - A comparison turns into `true` or `false`.
> - `=` puts a value in a box and `==` asks if two values are the same.
> - `~=` means different, and size questions need matching types.

> **Done when** all checklists are ticked. The one to remember: `=` puts a value
> in a box, `==` asks whether two values are the same — and every comparison
> turns into `true` or `false`.
</div>


<!-- ═══════════════════════════ 3.2 ═══════════════════════════ -->
<div id="md-3.2" hidden>
# if, elseif, else

A comparison asks a question. `if` is how a script **acts on the answer**. This
is the moment your scripts stop doing the same thing every time and start making
choices.

```lua predict=p3-warm2
local coins = 40
local price = 50
print(coins >= price)
```

## Only if it is true

```lua
local coins = 120

if coins >= 100 then
	print("You can buy the sword!")
end

print("Shop closed.") -- @n not pushed in, so it is outside the if and always runs
```

```output
You can buy the sword!  -  Server - Script:4
Shop closed.  -  Server - Script:7
```

Read it as English: *if coins is at least 100, then print this.* The lines
between `then` and `end` only run when the question is `true`. The last line is
outside the `if`, so it runs either way.

Change `coins` to `30` and run it again. Now only `Shop closed.` appears — the
inside of the `if` was skipped.

Three things every `if` needs:

- `if` and then a question
- `then` at the end of that line
- `end` to close it, lined up under the `if`

The lines inside are pushed in by one **Tab**. Luau does not care about the
Tab, but people do: it lets you see at a glance what belongs to the `if`. Studio
adds it for you when you press Enter after `then`.

> **Key idea** The lines between `then` and `end` only run when the question is `true`.

## Otherwise

`else` gives the `if` a second path for when the answer is `false`:

```lua
local coins = 30

if coins >= 100 then
	print("You can buy the sword!")
else
	print(`You need {100 - coins} more coins.`)
end
```

```output
You need 70 more coins.  -  Server - Script:6
```

Exactly one of the two paths runs. Never both, never neither.

```task=u3-if
- Run the shop script with `coins` at `120`, then at `30`
- Add an `else` that tells the player how many coins they are missing
- Press Play with a few different amounts and check the right path runs each time
```

> **Key idea** With an `else`, exactly one of the two paths runs.

## More than two paths

`elseif` asks another question if the first one was `false`. You can chain as
many as you need:

```lua
local score = 72

if score >= 90 then
	print("Gold medal")
elseif score >= 70 then -- @n when this is asked, score is already below 90
	print("Silver medal")
elseif score >= 50 then
	print("Bronze medal")
else
	print("Keep practising")
end
```

```output
Silver medal  -  Server - Script:6
```

Luau checks the questions **top to bottom** and runs the first one that is
`true`. Then it jumps straight to the `end` and skips everything else — even if
a later question would also have been `true`. `72` is also at least 50, but
Bronze never gets a look in.

That makes the order important:

```lua predict=p3-order
local score = 95

if score >= 50 then
	print("Bronze")
elseif score >= 90 then
	print("Gold")
end
```

The fix is to ask the hardest question first. Biggest number at the top, working
down.

`elseif` is one word. `else if` with a space is something different, and it
needs an extra `end` — stick to the one-word version.

> **Key idea** Luau runs the first true path from the top and skips the rest, so ask the hardest question first.

## Rolling a dice

Decisions get interesting when the script does not know the answer in advance.
`math.random(1, 6)` gives a random whole number from 1 to 6, both included — a
dice roll:

```lua
local roll = math.random(1, 6)
print(`You rolled {roll}`)

if roll == 6 then
	print("Jackpot!")
elseif roll == 1 then
	print("Unlucky...")
end
```

```output
You rolled 6  -  Server - Script:2
Jackpot!  -  Server - Script:5
```

Yours will be different. Press Stop and Play a few times and you will see each
path run. This `if` has no `else`, so when you roll a 2 to 5 nothing extra
happens — and that is fine. An `else` is optional.

```task=u3-elseif
- Run the medal script, then change `score` so each of the four medals prints
- Put the questions in the wrong order and see Gold disappear
- Run the dice script until you have seen both `Jackpot!` and `Unlucky...`
```

## What counts as true

`if` does not only accept booleans. You can give it any value, and Luau follows
one short rule:

> **Only `false` and `nil` count as false. Everything else counts as true.**

```lua predict=p3-zero
local coins = 0

if coins then
	print("yes")
else
	print("no")
end
```

This catches people who know other languages, where `0` counts as false. In
Luau, `0` is a real number, so it counts as true. So does `""`, the empty
string.

The useful side of the rule is checking for `nil`. A variable that was never
given a value holds `nil`, and `nil` counts as false:

```lua
local playerName

if playerName then -- @n no comparison: a nil here counts as false
	print(`Welcome back, {playerName}!`)
else
	print("Welcome, new player!")
end
```

```output
Welcome, new player!  -  Server - Script:6
```

Give `playerName` a value on the first line and run it again — now the first
path runs. `if something then` is how Roblox scripts ask *is this here at all?*,
and you will use it constantly once you start looking for things in the world.

> **Key idea** Only `false` and `nil` count as false, so even `0` and the empty string count as true.

## Decisions about the world

`if` works on properties too. This one checks the time of day and reacts:

```lua
local Lighting = game:GetService("Lighting")
local baseplate = workspace.Baseplate

Lighting.ClockTime = 21 -- @n set first, so the question below sees 21

if Lighting.ClockTime >= 18 then
	baseplate.Color = Color3.fromRGB(30, 30, 60)
	print("Night mode on")
else
	baseplate.Color = Color3.fromRGB(90, 140, 70)
	print("Day mode on")
end
```

```output
Night mode on  -  Server - Script:8
```

The floor goes a dark blue. Change `21` to `12` and it turns grassy green
instead.

## Fix the bug

This script should print `Big part!` for parts bigger than 10 studs tall.
Studio underlines it in red, and pressing Play gives:

```lua
local height = 12

if height > 10
	print("Big part!")
end
```

```output
! ServerScriptService.Script:4: Expected 'then' when parsing if statement, got 'print'
```

```solution
local height = 12

if height > 10 then
	print("Big part!")
end
-- Every if needs `then` after its question. Studio reached print
-- while it was still waiting for one.
```

## Your turn

Roll a number from 1 to 100 with `math.random`. Then print what the player
found:

- 90 or more — `Treasure!`
- 50 to 89 — `A few coins.`
- below 50 — `Just dust.`

Print the roll as well, so you can check the right line ran. One possible
Output:

```output
Roll: 63  -  Server - Script:2
A few coins.  -  Server - Script:7
```

```solution
local roll = math.random(1, 100)
print(`Roll: {roll}`)

if roll >= 90 then
	print("Treasure!")
elseif roll >= 50 then
	print("A few coins.")
else
	print("Just dust.")
end
```

```task=u3-turn2
- Write the treasure script without peeking at the solution
- Press Play several times and check the message always matches the roll
- Change it so `Treasure!` also turns the Baseplate gold
```

> **Recap**
> - `if` runs its lines only when the question is true.
> - `elseif` and `else` add more paths, and only the first true path runs.
> - Only `false` and `nil` count as false.

> **Done when** all checklists are ticked. The one to remember: `if` checks top
> to bottom and runs the **first** true path only — and only `false` and `nil`
> count as false.
</div>


<!-- ═══════════════════════════ 3.3 ═══════════════════════════ -->
<div id="md-3.3" hidden>
# and, or, not

Real questions are rarely about one thing. A door opens if you have the key
**and** you are close enough. A shop sells to you if you are VIP **or** you have
enough coins. This lesson joins questions together.

```lua predict=p3-warm3
local score = 80

if score >= 50 then
	print("Bronze")
elseif score >= 70 then
	print("Silver")
else
	print("None")
end
```

## and — both must be true

```lua
local level = 7
local hasKey = true

if level >= 5 and hasKey then -- @n a question on the left, a boolean on the right
	print("The door opens.")
else
	print("The door stays shut.")
end
```

```output
The door opens.  -  Server - Script:5
```

`and` is `true` only when **both** sides are `true`. Set `hasKey` to `false`, or
`level` to `3`, and the door stays shut.

> **Key idea** `and` is true only when both sides are true.

## or — either one is enough

```lua
local isVip = false
local coins = 250

if isVip or coins >= 200 then -- @n isVip is false, but the right side is true, so this passes
	print("Welcome to the lounge.")
end
```

```output
Welcome to the lounge.  -  Server - Script:5
```

`or` is `true` when **at least one** side is `true`. This player is not VIP, but
they have enough coins, so they get in.

> **Key idea** `or` is true when at least one side is true.

## not — flip it

`not` turns `true` into `false` and `false` into `true`:

```lua
local isNight = false

if not isNight then
	print("The sun is up.")
end
```

```output
The sun is up.  -  Server - Script:4
```

All three on one page:

| | gives `true` when | example that is `true` |
|---|---|---|
| `a and b` | both are true | `5 > 3 and 2 > 1` |
| `a or b` | at least one is true | `5 > 3 or 2 > 9` |
| `not a` | `a` is false | `not (2 > 9)` |

```lua predict=p3-and
local coins = 50
local level = 3
print(coins >= 40 and level >= 5)
```

```task=u3-logic
- Run the door script, then make it stay shut in two different ways
- Run the lounge script with `isVip` true and `coins` at 0 — still welcome?
- Write an `if` that uses `not` on a boolean of your own
```

## Brackets for not

`not` grabs the very next thing it touches. That causes a sneaky problem:

```lua
local coins = 5

if not coins > 10 then
	print("Poor")
end
```

Output shows a red line roughly like this:

```output
! ServerScriptService.Script:3: attempt to compare number &lt; boolean  -  Server - Script:3
```

Luau did `not coins` first. `coins` is `5`, which counts as true, so
`not coins` is `false` — and then it tried to ask whether `false > 10`, which
makes no sense. Put the question in brackets so it happens first:

```lua
if not (coins > 10) then -- @n the brackets ask the question first, then not flips it
```

Or skip `not` entirely and ask the opposite question: `if coins &lt;= 10 then`.
That is usually easier to read.

> **Key idea** `not` grabs the very next thing, so put a question in brackets before flipping it.

## Fix the bug

This is one of the most famous beginner bugs in any language. The script should
only print for swords and axes. Run it with a bow:

```lua
local weapon = "Bow"

if weapon == "Sword" or "Axe" then
	print("That is a melee weapon.")
end
```

```output
That is a melee weapon.  -  Server - Script:4
```

It printed — for a bow. Try to work out why before you open the solution. Hint:
think about what `or` sees on its right side.

```solution
local weapon = "Bow"

if weapon == "Sword" or weapon == "Axe" then
	print("That is a melee weapon.")
end
-- The broken version asks two separate questions:
--   weapon == "Sword"   which is false
--   "Axe"               which is just a string
-- A string counts as true, so `false or "Axe"` passes every time.
-- Each side of `or` has to be a whole question.
```

## A default value with or

`or` has a second job, and Roblox code uses it everywhere. It does not just
give `true` or `false` — it gives back **the first side that counts as true**:

```lua
local playerName = nil
local nickname = "Ace"

print(playerName or "Guest")
print(nickname or "Guest")
```

```output
Guest  -  Server - Script:4
Ace  -  Server - Script:5
```

`playerName` is `nil`, which counts as false, so `or` moves on and gives back
`"Guest"`. `nickname` holds a real value, so `or` gives that back and never
looks at the right side.

So `something or backup` means *use this, or if it is missing, use that*. It is
the shortest way to give a variable a default:

```lua
local speed = customSpeed or 16 -- @n customSpeed is nil, so 16 is used
```

`customSpeed` was never made, so it is `nil` and `speed` becomes `16`. (Studio
will underline `customSpeed` — that is expected in this tiny example.)

```lua predict=p3-default
local title = nil
local label = title or "No title"
print(label)
```

```task=u3-default
- Run the `playerName or "Guest"` script and check both lines
- Give `playerName` a real value and see `Guest` disappear
- Fix the `"Sword" or "Axe"` bug yourself before opening the solution
```

> **Key idea** `or` gives back the first side that counts as true, so `x or default` fills in a missing value.

## Your turn

The night market only lets you in if **you are VIP**, or if **it is night and
you are carrying a lantern**. Write it with three variables and one `if`:

```lua
local isVip = false
local hour = 22
local hasLantern = true
```

Night means 18 or later, or before 6. Print `The market lets you in.` or
`Come back later.`. With the values above, the player should get in.

```output
The market lets you in.  -  Server - Script:8
```

Then check: setting `hour` to `14` should keep them out. Setting `isVip` to
`true` should let them in at any hour.

```solution
local isVip = false
local hour = 22
local hasLantern = true

local isNight = hour >= 18 or hour &lt; 6

if isVip or (isNight and hasLantern) then
	print("The market lets you in.")
else
	print("Come back later.")
end
-- Brackets make the meaning clear: VIP, OR (night AND lantern).
-- Storing isNight in its own variable keeps the if readable.
```

```task=u3-turn3
- Write the night market script without peeking at the solution
- Try `hour` at `14`, then `3`, then `22` — only 14 should keep you out
- Set `isVip` to `true` and check it works at any hour
```

> **Recap**
> - `and` needs both sides true, and `or` needs at least one.
> - `not` flips true and false, so use brackets around a question.
> - Each side of `and` and `or` must be a whole question.

> **Done when** all checklists are ticked. The one to remember: every side of
> `and` and `or` must be a whole question — and `x or default` fills in a value
> when `x` is missing.
</div>


<!-- ═══════════════════════════ 3.4 ═══════════════════════════ -->
<div id="md-3.4" hidden>
# Build: a mystery chest

Time to put the unit together. You are going to build a treasure chest that
rolls a random reward every time you press Play — Common, Rare, Epic or
Legendary — and shows it floating above the chest in the right colour. Rare
things are rare: a Legendary comes up three times in a hundred.

This is exactly how loot works in real Roblox games: a random number, and a
chain of `if`s that turns it into a reward.

## The script

Replace everything in your Script with this, then press Play:

```lua
-- settings: change these to reshape the odds
local COMMON_UP_TO = 60      -- rolls 1-60 are Common
local RARE_UP_TO = 85        -- 61-85 are Rare
local EPIC_UP_TO = 97        -- 86-97 are Epic, 98-100 Legendary
local SPOT = Vector3.new(0, 0, -12)

-- roll for a reward
local roll = math.random(1, 100) -- @n one roll from 1 to 100, kept in a box for later

local tier -- @n made empty out here so it still exists after the if
local color
if roll &lt;= COMMON_UP_TO then
	tier = "Common"
	color = Color3.fromRGB(170, 170, 170)
elseif roll &lt;= RARE_UP_TO then
	tier = "Rare"
	color = Color3.fromRGB(70, 140, 255)
elseif roll &lt;= EPIC_UP_TO then
	tier = "Epic"
	color = Color3.fromRGB(170, 80, 255)
else
	tier = "Legendary"
	color = Color3.fromRGB(255, 190, 40)
end

-- the chest
local chest = Instance.new("Part")
chest.Name = "Chest"
chest.Anchored = true
chest.Size = Vector3.new(4, 3, 3)
chest.Position = SPOT + Vector3.new(0, 1.5, 0)
chest.Color = Color3.fromRGB(110, 70, 40)
chest.Material = Enum.Material.Wood
chest.Parent = workspace

-- the reward, floating above it
local reward = Instance.new("Part")
reward.Name = tier .. "Reward"
reward.Anchored = true
reward.Shape = Enum.PartType.Ball
reward.Size = Vector3.new(2, 2, 2)
reward.Position = SPOT + Vector3.new(0, 5, 0)
reward.Color = color
reward.Parent = workspace -- @n set last, so the reward is ready before it appears

-- the best two tiers glow
if tier == "Epic" or tier == "Legendary" then -- @n two whole questions joined by or
	reward.Material = Enum.Material.Neon
	local light = Instance.new("PointLight")
	light.Color = color
	light.Range = 14
	light.Parent = reward
end

-- only Legendary gets a bigger ball
if tier == "Legendary" then
	reward.Size = Vector3.new(3, 3, 3)
end

print(`Rolled {roll}: {tier}!`)
```

```output
Rolled 73: Rare!  -  Server - Script:60
```

Yours will be different — that is the point. Turn around in front of your
character: there is a wooden chest with a coloured ball floating over it.

```task=u3-build
- Paste the script and press Play
- Find the chest and the reward ball in the world
- Find `Chest` and the reward in Explorer — the reward's name includes its tier
- Press Stop and Play a few times and watch the tier change
```

> **Key idea** Keep the odds in settings at the top, roll once, and let a chain of `if` turn the roll into a reward.

## How it works

Everything in it comes from this unit and the last one:

- **Settings at the top.** The odds live in three numbers. Each tier covers a
  range of rolls: Common is 1 to 60, so it comes up 60 times in 100.
- **Empty variables first.** `local tier` and `local color` make two empty boxes
  *before* the `if`. Each path then fills them in. If they were made with
  `local` inside the `if`, they would vanish at its `end` — remember scope from
  2.5 — and the rest of the script could not use them.
- **An `elseif` chain, smallest first.** Each question uses `&lt;=`, so the
  order runs from the smallest number up. A roll of 40 matches the first
  question and stops there. A roll of 90 fails the first two and matches the
  third. Anything left over falls through to `else`.
- **`or` joining two questions.** `tier == "Epic" or tier == "Legendary"` — each
  side is a whole question, not `tier == "Epic" or "Legendary"`.
- **A second `if` later on.** Decisions do not all have to happen in one place.
  The Legendary ball is made with the normal size first, then grown afterwards.
- **`..` to build a name.** `tier .. "Reward"` makes names like `EpicReward`.

> **Key idea** Make the empty variables before the `if`, or they vanish at its `end`, and put the smallest range first.

## Test every path

Waiting for a Legendary could take a while. Instead of pressing Play forty
times, cheat: replace the roll line with a fixed number.

```lua
local roll = 99
```

Now it is always Legendary. Try `10`, `70` and `90` too. Testing each path on
purpose is something real developers do all the time — you do not want to find
out your Legendary code is broken when a player finally rolls one. Put
`math.random(1, 100)` back when you are done.

```lua predict=p3-tier
local roll = 86
```

```task=u3-tweak
- Set `roll` to `99` and see a big glowing gold ball
- Try `10`, `70` and `90` so you have seen all four tiers
- Change `COMMON_UP_TO` to `20` and roll a few times — Common gets rare
- Put `math.random(1, 100)` back
```

> **Key idea** Replace the random roll with a fixed number to test each path on purpose.

## Make it yours

Some ideas — try at least one:

- Add a fifth tier, **Mythic**, for a roll of exactly 100. Where does its
  `elseif` have to go?
- Make it night with `Lighting.ClockTime` so the glowing tiers really shine.
- Give the chest a `local isLucky = math.random(1, 10) == 1` and, if it is
  lucky, make the reward ball twice as big — whatever its tier.
- Print a different message for each tier, like `Legendary! Screenshot it!`.

```task=u3-own
- Add something new to the chest using an `if`
- Test it by fixing the roll to a number that triggers it
- Show it to someone
```

> **Recap**
> - One random roll and an elseif chain turn a number into a reward.
> - Variables the later code needs must be made before the if.
> - Fix the roll to a number to test each path.

> **Done when** all checklists are ticked — and that is the decisions unit
> finished. Your scripts can now ask questions, compare values, join questions
> with `and`, `or` and `not`, and choose between paths. Next up: doing things
> again and again with loops.
</div>


<!-- ═══════════════════════════ cheat-3 ═══════════════════════════ -->
<div id="md-cheat-3" hidden>
# Decisions cheatsheet

Everything from the decisions unit on one page. Keep it open next to Studio.

## Comparing

| | asks | example |
|---|---|---|
| `==` | the same? | `coins == 10` |
| `~=` | different? | `name ~= "Ada"` |
| `>` `&lt;` | bigger? smaller? | `health &lt; 25` |
| `>=` `&lt;=` | or the same? | `level >= 5` |

Every comparison turns into `true` or `false`, so you can store it:

```lua
local canAfford = coins >= price
```

## if, elseif, else

```lua
if score >= 90 then
	print("Gold")
elseif score >= 70 then        -- only checked if the line above was false
	print("Silver")
else                           -- when nothing above was true
	print("Keep going")
end
```

- Checked top to bottom. The **first** true path runs, then it jumps to `end`.
- Put the hardest question first.
- `elseif` and `else` are optional. `end` is not.

## Joining questions

| | true when |
|---|---|
| `a and b` | both are true |
| `a or b` | at least one is true |
| `not a` | `a` is false |

```lua
if isVip or (isNight and hasLantern) then
if not (coins > 10) then                 -- brackets, so the > happens first
if weapon == "Sword" or weapon == "Axe" then   -- a whole question each side
```

## What counts as true

Only `false` and `nil` count as false. Everything else — including `0` and
`""` — counts as true.

```lua
if playerName then          -- is there anything in it at all?
local speed = customSpeed or 16   -- use customSpeed, or 16 if it is nil
```

## Random numbers

```lua
local roll = math.random(1, 6)      -- whole number, 1 to 6, both included
local roll = 99                     -- fix it while testing a path
```

## Messages you will see

| in Output or on hover | usually means |
|---|---|
| *Expected 'then' when parsing if statement* | you forgot `then` — or wrote `=` instead of `==` |
| *Expected ')' ... got '='* | `=` inside brackets where you meant `==` |
| *attempt to compare number &lt; string* | a size comparison with text — check for quotes |
| *attempt to compare ... boolean* | usually `not x > y` — add brackets |
| an `if` that always runs | `x == "a" or "b"` — each side needs its own `==` |
| *Expected 'end'* | an `if` without its `end` |

## The rules

1. `=` puts a value in a box. `==` asks if two values are the same.
2. Not equal is `~=`.
3. A number and a string are never equal: `10 == "10"` is `false`.
4. `if` runs the first true path only, so order matters.
5. Only `false` and `nil` are false. `0` is true.
6. Each side of `and` / `or` is a whole question.
7. `x or default` gives a value when `x` is missing.
</div>
