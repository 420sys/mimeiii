<!-- ════════════════════════════════════════════════════════════════════
     UNIT 11 — ORGANISING AND SAVING
     Same format as lessons.md. No raw less-than or ampersand anywhere:
     write &lt; and &amp; even inside code fences.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 11.1 ═══════════════════════════ -->
<div id="md-11.1" hidden>
# ModuleScripts

By now your games have several scripts: one for coins, one for the shop, one for
a door. Sooner or later two of them need the same thing. They need the same
price, the same setting or the same function. Copying it into both means
remembering to change it in both, and one day you will forget.

A **ModuleScript** fixes that. It is a script that other scripts can borrow from.

```lua predict=p11-warm1
local stats = { coins = 5 }
stats.gems = 2
stats.coins = nil
print(stats.coins, stats.gems)
```

## A script that hands something back

In Explorer, hover over **ReplicatedStorage**, click the **+** and choose
**ModuleScript**. Rename it **Config**: click it and press F2, or double-click
the name. It opens with this already inside:

```lua
local module = {}

return module
```

Two things make a ModuleScript different from a Script:

- It **does not run on its own.** It just sits there until another script asks
  for it.
- It **ends with `return`.** Whatever it returns is the thing it hands over.

Almost every module hands over a table. Replace what is in Config with this:

```lua
local Config = {}

Config.START_COINS = 10
Config.DOOR_PRICE = 50
Config.WELCOME = "Welcome to the night line"

return Config
```

That is an ordinary table from the tables unit, holding three settings. Now add
a **Script** to ServerScriptService and ask for the module:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage.Config) -- @n `Config` now holds the table that the module returned

print(Config.WELCOME)
print(`Everyone starts with {Config.START_COINS} coins`)
```

```output
Welcome to the night line  -  Server - Script:5
Everyone starts with 10 coins  -  Server - Script:6
```

`require` means **run that module and give me what it returned**. After that
line, the `Config` variable in your Script holds the module's table. You read
its settings with a dot, exactly as if the table had been made right there.

The settings now live in one place. Change `START_COINS` in the module and every
script that requires Config gets the new number.

```task=u11-config
- Add a ModuleScript to ReplicatedStorage and rename it **Config**
- Paste the settings table into it
- Require it from a Script in ServerScriptService and print two settings
- Change `START_COINS` in the module only, press Play, and see the new number
```

> **Key idea** A ModuleScript does not run by itself, and `require` runs it and gives you whatever it returns.

## A module only runs once

Add one line to the very top of your Config module, so you can see when it runs:

```lua
print("Config is loading")

local Config = {}
```

Now ask for it twice:

```lua predict=p11-once
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local a = require(ReplicatedStorage.Config)
local b = require(ReplicatedStorage.Config)
print(a == b)
```

```output
Config is loading  -  Server - Config:1
true  -  Server - Script:5
```

The first `require` runs the module and remembers what it returned. Every
`require` after that skips the running and hands back the **same** table. That
counts for later lines in this script and for every other script on the server.

Notice the grey tag on the first line. It says `Config:1`, because that print
lives on line 1 of the module, not in your Script.

> **Key idea** The first `require` runs the module, and every later `require` gives back the same table.

## One table, shared by every script

Because every script gets the very same table, a module can hold things that
several scripts change together. It is the same idea as two variables holding
one part in the variables unit: two names, one thing.

Make a ModuleScript in **ServerScriptService** called **Scoreboard**:

```lua
local Scoreboard = {}

Scoreboard.total = 0

function Scoreboard.add(amount)
	Scoreboard.total += amount -- @n this changes the one table every script shares
	print(`Total is now {Scoreboard.total}`)
end

return Scoreboard
```

`function Scoreboard.add(amount)` stores a function in the table under the key
`add`. Functions are values, so a table can hold them like anything else. It is
a shorter way to write `Scoreboard.add = function(amount) ... end`.

Now make two Scripts in ServerScriptService. The first one:

```lua
local ServerScriptService = game:GetService("ServerScriptService")
local Scoreboard = require(ServerScriptService.Scoreboard)

Scoreboard.add(5)
```

The second one:

```lua
local ServerScriptService = game:GetService("ServerScriptService")
local Scoreboard = require(ServerScriptService.Scoreboard)

task.wait(1)
Scoreboard.add(10)
```

```output
Total is now 5  -  Server - Scoreboard:7
Total is now 15  -  Server - Scoreboard:7
```

The second script adds 10 to the 5 the first script left behind. They share one
`total`. The `task.wait(1)` is only there because Roblox does not promise which
script starts first. Waiting makes the order certain.

```task=u11-shared
- Make the **Scoreboard** module in ServerScriptService
- Make two Scripts that both call `Scoreboard.add`
- See the total carry over from one script to the other in Output
```

> **Key idea** Every script that requires a module gets the same table, so scripts can share and change one set of values.

## Where a module lives

Where you put a module decides who can use it:

| put it in | who can require it |
|---|---|
| **ReplicatedStorage** | Scripts **and** LocalScripts. Good for settings both sides need. |
| **ServerScriptService** | Scripts only. Players can never see what is inside. |

One catch from the client and server unit: the server and each player are
separate computers. A LocalScript that requires Config gets **its own copy** of
the table. If the client changes it, the server's copy does not change, so a
module cannot be used to sneak a message to the server.

On the client, things in ReplicatedStorage may not have arrived yet when the
LocalScript starts. Use `WaitForChild` there:

```lua
local Config = require(ReplicatedStorage:WaitForChild("Config")) -- @n `WaitForChild` waits until Config has arrived on this client
```

> **Key idea** Put a module in ReplicatedStorage for both sides, or in ServerScriptService to keep it server only.

## Fix the bug

Here is a module called **Prices** in ReplicatedStorage:

```lua
local Prices = {}

Prices.Sword = 100
Prices.Shield = 75
```

And a Script that uses it:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Prices = require(ReplicatedStorage.Prices)

print(Prices.Sword)
```

Press Play and the Script stops on line 2 with a red line much like this:

```output
! Module code did not return exactly one value  -  Server - Script:2
```

Find the problem before you open the solution.

```solution
local Prices = {}

Prices.Sword = 100
Prices.Shield = 75

return Prices -- a module must hand back exactly one thing
```

The module made its table and then never handed it over. `require` got nothing
back, so it stopped. When you see that error, look at the **last line** of the
module.

```task=u11-fix
- Make the Prices module without its `return` line and require it
- Read the red error in Output
- Add `return Prices` and see `100` printed
```

## Your turn

Make a ModuleScript called **Shop** in ReplicatedStorage. Inside it:

- a dictionary `Shop.prices` with at least three items and their prices,
  including a `Sword` that costs `100`
- a function `Shop.canAfford(coins, item)` that gives back `true` when the item
  exists **and** `coins` is at least its price, and `false` otherwise

Then a Script in ServerScriptService that prints these three answers:

```lua
print(Shop.canAfford(120, "Sword"))
print(Shop.canAfford(50, "Sword"))
print(Shop.canAfford(999, "Rocket"))
```

<!-- lint: skip script-lines -->
```output
true  -  Server - Script:4
false  -  Server - Script:5
false  -  Server - Script:6
```

The last one is the tricky one. There is no Rocket, so its price is `nil`, and
comparing a number with `nil` is an error. Check for that first.

```solution
-- ModuleScript: ReplicatedStorage.Shop
local Shop = {}

Shop.prices = {
	Sword = 100,
	Shield = 75,
	Potion = 20,
}

function Shop.canAfford(coins, item)
	local price = Shop.prices[item]
	if price == nil then
		return false -- there is no such item
	end
	return coins >= price
end

return Shop

-- Script: ServerScriptService.Script
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Shop = require(ReplicatedStorage.Shop)

print(Shop.canAfford(120, "Sword"))
print(Shop.canAfford(50, "Sword"))
print(Shop.canAfford(999, "Rocket"))
```

```task=u11-turn
- Write the Shop module and its `canAfford` function
- Require it and get the three answers above
- Add a fourth item to the module and check it from the Script
```

> **Recap**
> - A ModuleScript ends with `return`, and `require` gives you what it returned.
> - A module runs once, and every `require` gets the same table.
> - ReplicatedStorage modules work on both sides; ServerScriptService modules are server only.

> **Done when** all checklists are ticked. The one idea: a ModuleScript runs
> once and hands every script that requires it the **same** table.
</div>


<!-- ═══════════════════════════ 11.2 ═══════════════════════════ -->
<div id="md-11.2" hidden>
# Templates and models

Making a part from a script takes a line for every property. That is fine for
a cube. It is not fine for a tree, a car or a house. Real games build those
things by hand in Studio, store one copy out of sight, and let scripts make as
many copies as they need. The stored copy is called a **template**.

```lua predict=p11-warm2
local copy = workspace.Baseplate:Clone()
print(copy.Parent)
```

## Building a model by hand

A **Model** is a group of parts that act as one thing. You have been using one
all along: every player's character is a Model full of parts.

Build a tree. Do this while Studio is **not** playing, so it is saved:

```task=u11-model
- In Workspace, add a **Part** named **Trunk**. Set Size to `2, 8, 2`, make it brown, and tick **Anchored**
- Add a second Part named **Leaves**. Set Shape to **Ball**, Size to `8, 8, 8`, make it green, tick **Anchored**, and move it onto the top of the trunk
- Click Trunk, then Ctrl-click Leaves (⌘-click on a Mac), and press Ctrl+G (⌘G) to group them. Rename the new Model **Tree**
- Click Tree. In Properties, click **PrimaryPart**, then click **Trunk** in Explorer
- Drag Tree into **ServerStorage**
```

Two new things in there:

- **PrimaryPart** is the part the model treats as its handle. When a script
  moves the model, it moves it by that part.
- **ServerStorage** is a storage room. Nothing in it is in the world, nothing in
  it runs, and players cannot see inside it at all. It is the place for
  templates.

> **Key idea** A Model groups parts into one thing, and a template waits in ServerStorage, out of the world.

## Making copies

`Clone` copies something along with everything inside it. You met it in the
world unit. Here it is on the whole tree:

```lua
local ServerStorage = game:GetService("ServerStorage")

local template = ServerStorage.Tree

local tree = template:Clone() -- @n `tree` is a new copy; `template` stays in ServerStorage
tree:PivotTo(CFrame.new(0, 4, -20)) -- @n the numbers are x, y, z, so 4 is the height
tree.Parent = workspace

print(`Planted a {tree.Name}`)
```

```output
Planted a Tree  -  Server - Script:9
```

A tree stands a little way in front of where you spawn.

A Model has no `Position`. Instead it has a **pivot**: one CFrame that the
whole model moves by. Because you set PrimaryPart, the pivot is the middle of
the Trunk. `PivotTo` moves the whole model so its pivot lands on the CFrame you
give it, and every part inside comes along.

The `4` is the same maths as the lamp post: a part's position is its middle, so
an 8 stud trunk needs its middle 4 studs up to stand on the floor.

To read where a model is, use `GetPivot`:

```lua
print(tree:GetPivot().Position)
```

```task=u11-clone
- Clone one Tree into the world with `PivotTo`
- While playing, look in Explorer: Tree is still in ServerStorage, and a copy is in Workspace
- Change the CFrame so the tree stands somewhere else
```

> **Key idea** `Clone` copies a template with everything inside, and `PivotTo` moves the whole model.

## Fix the bug

This looks right but stops at once:

```lua
local ServerStorage = game:GetService("ServerStorage")

local tree = ServerStorage.Tree:Clone()
tree.Position = Vector3.new(0, 4, -20)
tree.Parent = workspace
```

```output
! ServerScriptService.Script:4: Position is not a valid member of Model "Tree"  -  Server - Script:4
```

```solution
local ServerStorage = game:GetService("ServerStorage")

local tree = ServerStorage.Tree:Clone()
tree:PivotTo(CFrame.new(0, 4, -20)) -- models move by their pivot
tree.Parent = workspace
```

Parts have a Position. Models do not, because a model is many parts. The error
even tells you what kind of thing it found: `Model "Tree"`. When you see that,
reach for `PivotTo`.

```task=u11-fix2
- Try `tree.Position = ...` on the model and read the error
- Fix it with `PivotTo`
```

## A clone is a real copy

```lua predict=p11-copy
local ServerStorage = game:GetService("ServerStorage")

local template = ServerStorage.Tree
local copy = template:Clone()
copy.Name = "BigTree"
print(template.Name)
```

In the variables unit, `local b = a` gave you a second name for the **same**
part. `Clone` is different. It makes a whole new thing, so changing the copy
leaves the template alone. That is exactly what you want from a template: you
can paint, resize and move every copy without ever spoiling the original.

> **Key idea** A clone is a new thing, so changing it never changes the template.

## A forest

One template, one loop, as many trees as you like:

```lua
local ServerStorage = game:GetService("ServerStorage")

local TREE_COUNT = 12
local AREA = 60

local template = ServerStorage.Tree

for i = 1, TREE_COUNT do
	local x = math.random(-AREA, AREA)
	local z = math.random(-AREA, AREA)
	local turn = math.rad(math.random(0, 359))

	local tree = template:Clone()
	tree:PivotTo(CFrame.new(x, 4, z) * CFrame.Angles(0, turn, 0)) -- @n `*` joins the move and the spin into one CFrame
	tree.Parent = workspace
end

print(`Planted {TREE_COUNT} trees`)
```

```output
Planted 12 trees  -  Server - Script:18
```

Every press of Play grows a different forest. The `CFrame.Angles(0, turn, 0)`
spins each tree around its trunk by a random amount, so they do not all face the
same way.

Change the template once (bigger leaves, a different green) and every tree in
the next forest changes with it. That is the point of a template.

```task=u11-forest
- Run the forest script
- Press Play a few times and see a different forest each time
- Change the Leaves colour in the template in ServerStorage and play again
```

> **Key idea** One template and one loop give you as many copies as you want.

## Your turn

Plant a straight row of **5** trees along the X axis. The first one stands at
x `-24`, z `-30`, and each one after it is `12` studs further along X. Turn each
tree a random amount. When the loop is done, print:

```output
Row of 5 trees done  -  Server - Script:12
```

Your line number may be different. That is fine.

```solution
local ServerStorage = game:GetService("ServerStorage")

local template = ServerStorage.Tree

for i = 0, 4 do
	local tree = template:Clone()
	local turn = math.rad(math.random(0, 359))
	tree:PivotTo(CFrame.new(-24 + i * 12, 4, -30) * CFrame.Angles(0, turn, 0))
	tree.Parent = workspace
end

print("Row of 5 trees done")
```

Counting from `0` makes the maths neat: the first tree is `-24 + 0 * 12`, the
last is `-24 + 4 * 12`, which is `24`.

```task=u11-turn2
- Plant the row of five trees
- Check the gaps between them are even
- Make the row run along Z instead
```

> **Recap**
> - Build a model once by hand, set its PrimaryPart and keep it in ServerStorage.
> - `Clone` it, then `PivotTo` it, then set its `Parent` to put it in the world.
> - A Model has no `Position`; it moves by its pivot.

> **Done when** all checklists are ticked. The one idea: build it once by hand,
> keep it in ServerStorage, and `Clone` plus `PivotTo` it into the world.
</div>


<!-- ═══════════════════════════ 11.3 ═══════════════════════════ -->
<div id="md-11.3" hidden>
# Errors on purpose

So far every error has been an accident. This lesson is about using errors on
purpose: stopping loudly when something is badly wrong, and **catching** errors
from things you cannot control. That second part is what makes saving data
possible in the next lesson.

```lua predict=p11-warm3
local function check(n)
	if n &lt; 0 then
		return "negative"
	end
	return "fine"
end

print(check(-2))
```

## Stopping with error

`error` stops the script, right there, with your own message:

```lua
local function giveCoins(amount)
	if typeof(amount) ~= "number" then -- @n `typeof` gives the kind of value as text, such as "number"
		error(`giveCoins needs a number, got {typeof(amount)}`)
	end
	print(`Gave {amount} coins`)
end

giveCoins(10)
giveCoins("ten")
print("This line never runs")
```

```output
Gave 10 coins  -  Server - Script:5
! ServerScriptService.Script:3: giveCoins needs a number, got string  -  Server - Script:3
```

Under the red line, Studio prints a short trail in blue. It shows which line
called which, so you can see that line 9 is the call that went wrong.

Why would you ever want this? Because the other choice is worse. Without the
check, `"ten"` would slip into the coin maths and break something much later, in
a place that has nothing to do with the real mistake. A loud error at the exact
spot saves you an hour of hunting.

Keep the two kinds of problem apart:

- **Something normal in a game.** Not enough coins, a door already open. That is
  not an error. Handle it with `if` and `return`.
- **A bug.** A function given the wrong kind of value. That is what `error` is
  for.

> **Key idea** `error` stops the script at the spot of a bug and shows your own message.

## warn and assert

`warn` prints a line in **orange**. It does not stop anything. Use it for *this
is odd, but I can carry on*:

```lua
warn("No spawn point found, using the middle of the map")
```

`assert` is a short way to write a check and an error together. If the first
thing is `false` or `nil`, it errors with the message:

```lua
local function giveCoins(amount)
	assert(typeof(amount) == "number", "giveCoins needs a number") -- @n `assert` is a check and an `error` in one line
	print(`Gave {amount} coins`)
end
```

Read it as *make sure this is true, or stop*.

```task=u11-error
- Run the `giveCoins` script and find the red line
- Find the line number inside the error message
- Add a `warn` somewhere and spot its orange line
- Rewrite the check with `assert` and run it again
```

> **Key idea** `warn` prints in orange and carries on, and `assert` stops the script when its first value is false or nil.

## Catching an error with pcall

Some things can fail even when your code is perfect. Saving a player's data
goes over the internet to Roblox's computers, and sometimes the internet has a
bad second. You cannot stop that from happening. You can only **catch** it.

`pcall` means *protected call*. You give it a function. It runs the function,
and if the function errors, `pcall` catches the error instead of letting it
stop your script:

```lua
local function risky()
	error("Something broke")
end

local ok, message = pcall(risky) -- @n `ok` is true or false; `message` is the error text
print(ok)
print(message)
print("Still running")
```

```output
false  -  Server - Script:6
ServerScriptService.Script:2: Something broke  -  Server - Script:7
Still running  -  Server - Script:8
```

`pcall` gives back two things, like the functions with more than one return
value from the functions unit:

- first, `true` if the function worked, `false` if it errored
- second, if it errored: the error message. If it worked: whatever the
  function returned

```lua predict=p11-pcall
local ok, result = pcall(function()
	return 10 * 2
end)
print(ok, result)
```

That shape, with a function written right inside the brackets, is how you will
see `pcall` most often. The next lesson uses it on every save and every load:

```lua
local ok, result = pcall(function()
	return somethingThatMightFail()
end)

if ok then
	print("It worked:", result)
else
	warn("It failed:", result)
end
```

```task=u11-pcall
- Run the `risky` script and see the last line still runs
- Change `risky` so it returns a number instead of erroring, and print what `pcall` gives back
- Wrap the `giveCoins("ten")` call from earlier in a `pcall` so its last line runs too
```

> **Key idea** `pcall(fn)` runs a function that might fail, and gives back `true` or `false` instead of stopping your script.

## Fix the bug

This was meant to catch the error and carry on:

```lua
local function loadSave()
	error("The save server is down")
end

local ok, message = pcall(loadSave())
print("Loaded?", ok)
```

```output
! ServerScriptService.Script:2: The save server is down  -  Server - Script:2
```

`Loaded?` never appears. The error got straight past `pcall`. Look closely at
line 5.

```solution
local function loadSave()
	error("The save server is down")
end

local ok, message = pcall(loadSave) -- the function itself, no brackets
print("Loaded?", ok)
```

`loadSave()` with brackets **runs** the function, right now, before `pcall` has
even started. It errors, and there is nothing to catch it. `pcall` needs the
function itself so it can run it safely. If the function needs arguments, give
them to `pcall` after it: `pcall(giveCoins, "ten")`.

```task=u11-fix3
- Run the broken script and see that `pcall` caught nothing
- Remove the brackets and see `Loaded? false`
```

## Your turn

Write a function `safeDivide(a, b)`. If `b` is `0`, it errors with the message
`cannot divide by zero`. Otherwise it returns `a / b`.

Call it through `pcall` twice, once with `10, 2` and once with `1, 0`, and print
what `pcall` gives back each time. You can print a `pcall` directly:
`print(pcall(...))` prints both things it returns.

```output
true 5  -  Server - Script:8
false ServerScriptService.Script:3: cannot divide by zero  -  Server - Script:9
```

```solution
local function safeDivide(a, b)
	if b == 0 then
		error("cannot divide by zero")
	end
	return a / b
end

print(pcall(safeDivide, 10, 2))
print(pcall(safeDivide, 1, 0))
```

```task=u11-turn3
- Write `safeDivide`
- Call it through `pcall` for both cases and match the Output
- Add a third call with text, `pcall(safeDivide, "ten", 2)`, and read what comes back
```

> **Recap**
> - `error` stops loudly; `warn` only prints; `assert` is a check and an error in one.
> - `pcall(fn)` catches an error and gives back `ok` and a result or message.
> - Pass `pcall` the function itself, with no brackets after it.

> **Done when** all checklists are ticked. The one idea: `error` stops loudly at
> a bug, and `pcall(fn)` runs something that might fail without letting it
> stop your script.
</div>


<!-- ═══════════════════════════ 11.4 ═══════════════════════════ -->
<div id="md-11.4" hidden>
# Saving data

Every coin, every win and every unlock in your games so far has vanished the
moment you pressed Stop. In a published game the same thing happens when the
last player leaves and the server shuts down. Everything a script holds lives
in the server's memory, and when the server goes, so does the memory.

To keep anything, you have to hand it to Roblox to look after. That is what a
**DataStore** is.

```lua predict=p11-warm4
local folder = Instance.new("Folder")
folder.Name = "???"
folder.Parent = player
```

## Switch it on first

Studio blocks DataStores until you say yes, because saving from Studio writes to
your game's **real** saved data. Use a place you are happy to test in.

```task=u11-setup
- Publish your place: **File → Publish to Roblox**. Any name will do
- Open **Game Settings** (on the Home tab, or in the File menu) and go to **Security**
- Switch on **Enable Studio Access to API Services**, then click **Save**
```

## A dictionary that never forgets

A DataStore works like one huge dictionary that Roblox keeps for your game. You
save a value under a **key**, a string, and later you load it back with the same
key. It is still there next time you press Play, tomorrow, and next year.

Each player gets their own key. Build it from their **UserId**, a number that
belongs to their account for ever. Never use their Name: players can change
their name, and their save would be lost.

```lua
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local visitStore = DataStoreService:GetDataStore("Visits")

Players.PlayerAdded:Connect(function(player)
	local key = "player_" .. player.UserId -- @n `..` joins text, so the key looks like `player_12345`

	local ok, visits = pcall(function()
		return visitStore:GetAsync(key)
	end)
	if not ok then
		warn(`Could not load {player.Name}: {visits}`)
		return
	end

	visits = (visits or 0) + 1
	print(`{player.Name} has visited {visits} times`)

	local saved, message = pcall(function()
		visitStore:SetAsync(key, visits) -- @n writes the new number over whatever was saved under this key
	end)
	if not saved then
		warn(`Could not save {player.Name}: {message}`)
	end
end)
```

```output
Ada has visited 1 times  -  Server - Script:18
```

You will see your own name, of course.

- `GetDataStore("Visits")` picks a store by name. One game can have many stores.
- `GetAsync(key)` **loads** what is saved under the key. For a player who has
  never been saved, there is nothing, so it gives back `nil`. That is why the
  next line says `visits or 0`, the default trick from the decisions unit.
- `SetAsync(key, value)` **saves** a value under the key, replacing what was
  there.

**Async** means the script has to wait while Roblox's computers answer over the
internet, a bit like `task.wait`. And anything that goes over the internet can
fail, which is why each call sits inside a `pcall`. If it fails, you get an
orange warning instead of a dead script.

```lua predict=p11-again
print(`{player.Name} has visited {visits} times`)
```

```task=u11-visits
- Paste the visits script and press Play
- See `visited 1 times` with your name
- Stop and Play again. The number goes up
- Switch API access off in Game Settings, Play, and read the warning. Then switch it back on
```

If something is not set up, the `warn` line shows Roblox's reason:

| the warning mentions | it means |
|---|---|
| *You must publish this place to the web* | the place was never published |
| *StudioAccessToApisNotAllowed* | Enable Studio Access to API Services is off |

> **Key idea** A DataStore keeps a value under a key, and the key for a player is built from their UserId. Wrap every call in `pcall`, because the internet can fail.

## What you can save

The value can be a number, a string, a boolean, or a **table** of those. One
table per player is the usual way:

```lua
{ coins = 120, wins = 3, unlocked = { "Sword", "Shield" } }
```

Two things cannot be saved: Instances (parts, models, players) and functions.
Save the *facts* about a thing, like its name or colour, not the thing itself.

> **Key idea** You can save numbers, strings, booleans and tables of those, but not Instances or functions.

## Save when they leave, not all the time

Loading and saving on every change would be slow, and Roblox limits how often
you may save to the same key. The usual plan:

1. **Load once** when the player joins, into a table the script keeps.
2. **Change that table** while they play. That is instant.
3. **Save once** when they leave.

This script gives every player one point for every second they spend in the
game, and remembers it between visits:

```lua
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local store = DataStoreService:GetDataStore("PlayerData")

local sessions = {} -- [player] = their data, while they are in the game

local function keyFor(player)
	return "player_" .. player.UserId
end

local function load(player)
	local ok, saved = pcall(function()
		return store:GetAsync(keyFor(player))
	end)
	if not ok then
		warn(`Could not load {player.Name}: {saved}`)
		return
	end

	local data = saved or {} -- @n a new player has no save, so start with an empty table
	data.points = data.points or 0
	sessions[player] = data
	print(`{player.Name} loaded with {data.points} points`)
end

local function save(player)
	local data = sessions[player]
	if not data then
		return -- never loaded, so do not overwrite what is saved
	end

	local ok, message = pcall(function()
		store:SetAsync(keyFor(player), data)
	end)
	if ok then
		print(`Saved {player.Name}: {data.points} points`)
	else
		warn(`Could not save {player.Name}: {message}`)
	end
end

Players.PlayerAdded:Connect(load)

Players.PlayerRemoving:Connect(function(player)
	save(player)
	sessions[player] = nil
end)

game:BindToClose(function()
	for _, player in ipairs(Players:GetPlayers()) do
		save(player)
	end
end)

-- one point for every second in the game
while true do
	task.wait(1)
	for _, data in pairs(sessions) do
		data.points += 1
	end
end
```

Play for about ten seconds, then press Stop:

```output
Ada loaded with 0 points  -  Server - Script:24
Saved Ada: 10 points  -  Server - Script:37
```

Your number will be different. You may see the `Saved` line twice, once from
each of the two save points below. That is fine.

The pieces:

- **`sessions`** holds each player's data while they play, with the player as
  the key, like the per-player tables in the events unit. The loop at the
  bottom only ever touches this table, never the DataStore.
- **`data.points or 0`** fills in a starting value. It also means that if you
  add a new stat next month, old saves that do not have it yet still work.
- **The check at the top of `save`.** If loading failed, `sessions` has nothing
  for that player, so `save` does nothing. Without that check, a failed load
  would be followed by saving zero over the top of their real data.
- **`PlayerRemoving`** saves when someone leaves.
- **`game:BindToClose`** runs when the whole server is shutting down: the last
  player left, the game was updated, or you pressed Stop in Studio. The server
  waits for it to finish, up to 30 seconds, so the saves get through. Without
  it, saving on Stop in Studio often gets cut off.

```task=u11-leave
- Paste the points script and play for about ten seconds
- Press Stop and find the `Saved` line in Output
- Press Play. You load with the points you had
```

> **Key idea** Load once on join, change a table while they play, and save when they leave.

## Your turn

Show the points on the leaderboard. When a player loads, give them a
`leaderstats` folder with an IntValue called **Points**, starting at their
saved points. Then make the loop at the bottom update it every second, so the
leaderboard ticks up.

Stop and Play: the leaderboard should start from your saved number, not 0.

```solution
-- inside load, straight after  sessions[player] = data
local leaderstats = Instance.new("Folder")
leaderstats.Name = "leaderstats"

local points = Instance.new("IntValue")
points.Name = "Points"
points.Value = data.points
points.Parent = leaderstats

leaderstats.Parent = player

-- and the loop at the bottom, now updating the leaderboard too
while true do
	task.wait(1)
	for player, data in pairs(sessions) do
		data.points += 1
		player.leaderstats.Points.Value = data.points
	end
end
```

The saved number lives in `data`. The IntValue only **shows** it. Keep it that
way round and you will never save the wrong number.

```task=u11-turn4
- Add a `leaderstats` folder with a **Points** value when a player loads
- Make the loop update it every second
- Stop and Play. The leaderboard starts from your saved points
```

> **Recap**
> - `GetAsync` loads and `SetAsync` saves, both inside `pcall`.
> - A new player has nothing saved, so `GetAsync` gives `nil` and you fill in defaults.
> - Save on `PlayerRemoving` and in `BindToClose`, and never save a player who did not load.

> **Done when** all checklists are ticked. The one idea: load once when they
> join, change a table while they play, save when they leave and when the
> server closes, and wrap every DataStore call in `pcall`.
</div>


<!-- ═══════════════════════════ 11.5 ═══════════════════════════ -->
<div id="md-11.5" hidden>
# Build: coins that save

Time to put the unit together. You are going to build a ring of glowing coins
that players collect, with a coin count on the leaderboard that is still there
when they come back.

This time the code is split up the way real games split it. Each script has
one job:

| name | type | where | its one job |
|---|---|---|---|
| **PlayerData** | ModuleScript | ServerScriptService | load, change and save each player's data |
| **Data** | Script | ServerScriptService | players joining and leaving |
| **Coins** | Script | ServerScriptService | the coins in the world |

The Coins script never touches a DataStore. It just says *give this player a
coin*, and PlayerData looks after the rest.

```lua predict=p11-warm5
local ok, result = pcall(function()
	return nil + 1
end)
print(ok)
```

You need API access switched on and the place published, as in the last
lesson.

## PlayerData

Add a **ModuleScript** to ServerScriptService and name it **PlayerData**:

```lua
local DataStoreService = game:GetService("DataStoreService")

local store = DataStoreService:GetDataStore("PlayerData_v1")

-- every stat a player has, and what a brand new player starts with
local DEFAULTS = {
	Coins = 0,
}

local PlayerData = {}
PlayerData.DEFAULTS = DEFAULTS

local sessions = {} -- [player] = their data, only once it has loaded

local function keyFor(player)
	return "player_" .. player.UserId
end

function PlayerData.load(player)
	local ok, saved = pcall(function()
		return store:GetAsync(keyFor(player))
	end)
	if not ok then
		warn(`Could not load {player.Name}: {saved}`)
		return nil
	end

	-- fill in any stat the save does not have yet
	local data = saved or {}
	for stat, startValue in pairs(DEFAULTS) do
		if data[stat] == nil then
			data[stat] = startValue
		end
	end

	sessions[player] = data
	return data
end

function PlayerData.save(player)
	local data = sessions[player]
	if not data then
		return -- never loaded, so never overwrite what is saved
	end

	local ok, message = pcall(function()
		store:SetAsync(keyFor(player), data)
	end)
	if ok then
		print(`Saved {player.Name}`)
	else
		warn(`Could not save {player.Name}: {message}`)
	end
end

function PlayerData.forget(player)
	sessions[player] = nil
end

function PlayerData.add(player, stat, amount)
	local data = sessions[player]
	if not data then
		return
	end
	data[stat] += amount -- @n `stat` holds a name like "Coins", so this changes that one stat

	-- keep the leaderboard showing the same number
	local leaderstats = player:FindFirstChild("leaderstats")
	local value = leaderstats and leaderstats:FindFirstChild(stat) -- @n `and` stops at `nil` if there is no leaderstats yet
	if value then
		value.Value = data[stat]
	end
end

return PlayerData
```

> **Key idea** PlayerData is the only code that talks to the DataStore, and it holds the shared `sessions` table.

## Data

Add a **Script** to ServerScriptService and name it **Data**:

```lua
local Players = game:GetService("Players")
local ServerScriptService = game:GetService("ServerScriptService")

local PlayerData = require(ServerScriptService.PlayerData)

local AUTOSAVE_EVERY = 60 -- seconds

local function onPlayerAdded(player)
	local data = PlayerData.load(player)
	if not data then
		player:Kick("Your data could not load. Please rejoin.") -- @n `Kick` removes the player and shows them this message
		return
	end
	if player.Parent == nil then
		PlayerData.forget(player) -- they left while we were loading
		return
	end

	-- one IntValue on the leaderboard for every stat
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	for stat in pairs(PlayerData.DEFAULTS) do
		local value = Instance.new("IntValue")
		value.Name = stat
		value.Value = data[stat]
		value.Parent = leaderstats
	end
	leaderstats.Parent = player

	print(`{player.Name} loaded with {data.Coins} coins`)
end

local function onPlayerRemoving(player)
	PlayerData.save(player)
	PlayerData.forget(player)
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)

game:BindToClose(function()
	for _, player in ipairs(Players:GetPlayers()) do
		PlayerData.save(player)
	end
end)

-- save everyone now and then, in case the server stops without warning
while true do
	task.wait(AUTOSAVE_EVERY)
	for _, player in ipairs(Players:GetPlayers()) do
		PlayerData.save(player)
	end
end
```

> **Key idea** Data handles joining and leaving: it builds the leaderboard on join and saves on leave, on close and every minute.

## Coins

Add one more **Script** to ServerScriptService and name it **Coins**:

```lua
local Players = game:GetService("Players")
local ServerScriptService = game:GetService("ServerScriptService")

local PlayerData = require(ServerScriptService.PlayerData)

local COIN_COUNT = 8
local RING_RADIUS = 20
local COIN_VALUE = 1
local RESPAWN_TIME = 5
local COIN_COLOR = Color3.fromRGB(255, 200, 40)

local function makeCoin(position)
	local coin = Instance.new("Part")
	coin.Name = "Coin"
	coin.Shape = Enum.PartType.Cylinder
	coin.Size = Vector3.new(0.5, 3, 3)
	coin.Position = position
	coin.Color = COIN_COLOR
	coin.Material = Enum.Material.Neon
	coin.Anchored = true
	coin.CanCollide = false
	coin.Parent = workspace

	local taken = false
	coin.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if not player or taken then
			return
		end
		taken = true
		PlayerData.add(player, "Coins", COIN_VALUE)
		coin.Transparency = 1

		task.wait(RESPAWN_TIME)
		taken = false
		coin.Transparency = 0
	end)
end

-- a ring of coins around the spawn
for i = 1, COIN_COUNT do
	local angle = (i / COIN_COUNT) * math.pi * 2
	local x = math.cos(angle) * RING_RADIUS
	local z = math.sin(angle) * RING_RADIUS
	makeCoin(Vector3.new(x, 3, z))
end

print(`Placed {COIN_COUNT} coins`)
```

Press Play. A ring of gold coins floats around you. Run through them and watch
**Coins** count up on the leaderboard. Then press Stop, and Play again.

```output
Placed 8 coins  -  Server - Coins:48
Ada loaded with 0 coins  -  Server - Data:30
Saved Ada  -  Server - PlayerData:50
Ada loaded with 5 coins  -  Server - Data:30
```

Those lines come from three different scripts, and the grey tags tell you
which. The first two lines may swap places. Your numbers will be your own.

```task=u11-build
- Make the **PlayerData** ModuleScript in ServerScriptService
- Make the **Data** and **Coins** Scripts next to it
- Press Play, collect some coins and watch the leaderboard
- Press Stop, then Play. Your coins are still there
```

> **Key idea** Coins only calls `PlayerData.add`, and knows nothing about saving.

## How it works

Nearly everything is something you have already learned. The new part is how it
fits together.

- **PlayerData owns the data.** It is the only code that talks to the DataStore,
  and the only place the `sessions` table lives. Any script that requires it
  gets the same module, so the Data script and the Coins script see the same
  sessions.
- **Data owns joining and leaving.** Load and build the leaderboard on join,
  save and forget on leave, save everyone on close and every minute.
- **Coins owns the coins.** It knows nothing about saving. It calls
  `PlayerData.add` and that is all.
- **`DEFAULTS` drives everything.** `load` fills in any missing stat from it, and
  Data makes one leaderboard value for each stat in it.
- **`taken`** is a debounce, from the events unit. Each coin has its own, because
  each call to `makeCoin` makes its own local.
- **`math.cos` and `math.sin`** turn an angle into a spot on a circle. That is
  all you need to know about them to place things in a ring.
- **A Cylinder lies along X**, so a size of `0.5` on X makes a thin coin standing
  on its edge. `Enum.PartType.Cylinder` is the one new name here.

Two lines guard against the worst thing that can happen to a saving game:
wiping someone's progress.

```lua predict=p11-wipe
-- imagine load had failed, but the game carried on anyway
local data = { Coins = 0 }
store:SetAsync("player_" .. player.UserId, data)
```

That is why Data **kicks** a player whose data would not load, rather than
letting them play on with nothing. And it is why `save` refuses to save anyone
who never loaded. Kicking feels harsh, but it is far kinder than losing
someone's coins.

The `player.Parent == nil` check covers one more case. Loading takes a moment.
If the player leaves during that moment, they are already gone by the time
their data arrives, so the script forgets it rather than keeping it for ever.

> **Key idea** If a load fails, kick the player and never save for them, so a failed load cannot wipe their progress.

## Change one number

Every setting sits at the top of a script:

```task=u11-tweak
- Set `COIN_COUNT` to `16` and `RING_RADIUS` to `30` in Coins
- Set `COIN_VALUE` to `5` and collect one coin
- Add `Gems = 0` to `DEFAULTS` in PlayerData, press Play, and see **Gems** appear on the leaderboard
```

That last one is worth noticing. One line in `DEFAULTS` and the new stat loads,
shows on the leaderboard and saves. Players with an old save get `Gems = 0`
filled in for them.

## Make it yours

Some ideas. Try at least one:

- Give the Gems a use: one coin in every ring is a **gem** instead, worth one
  Gem. Use `math.random` to pick which.
- Make the coins spin with TweenService, like the spinning coin from the world
  unit.
- Make a coin that is worth 10 but only appears one time in five.
- Change `AUTOSAVE_EVERY` to `10`, watch the `Saved` lines arrive, then set it
  back. Saving too often wastes Roblox's limits.
- Want a fresh start while testing? Change the store name to `PlayerData_v2`.
  Every player starts again from `DEFAULTS`.

```task=u11-own
- Add something new to the coins or the data
- Press Play, Stop and Play, and check it saved
- Show it to someone
```

> **Recap**
> - Each script has one job: PlayerData saves, Data joins and leaves, Coins places coins.
> - `DEFAULTS` lists every stat, so one new line adds a stat that loads, shows and saves.
> - A player whose data did not load is kicked, so nothing is overwritten.

> **Done when** all checklists are ticked, and that is the unit. You can split a
> game into modules, build things from templates, catch errors, and keep a
> player's progress for ever. Next: the hero project, a whole game.
</div>


<!-- ═══════════════════════════ cheat-11 ═══════════════════════════ -->
<div id="md-cheat-11" hidden>
# Organising and saving cheatsheet

Everything from the organising and saving unit on one page.

## ModuleScripts

```lua
-- ModuleScript: ReplicatedStorage.Config
local Config = {}

Config.START_COINS = 10

function Config.describe()
	return `Start with {Config.START_COINS} coins`
end

return Config -- always the last line
```

```lua
-- any Script
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Config = require(ReplicatedStorage.Config)

-- any LocalScript: wait for it first
local Config = require(ReplicatedStorage:WaitForChild("Config"))
```

| | |
|---|---|
| runs | once, the first time it is required |
| every later `require` | gets the same table back |
| in ReplicatedStorage | Scripts and LocalScripts can use it |
| in ServerScriptService | only Scripts can use it |
| server and client | each get their own copy |

## Templates and models

```lua
local ServerStorage = game:GetService("ServerStorage")

local tree = ServerStorage.Tree:Clone()            -- a real copy, Parent nil
tree:PivotTo(CFrame.new(0, 4, -20))                -- move a whole model
tree:PivotTo(CFrame.new(0, 4, -20) * CFrame.Angles(0, math.rad(90), 0))
tree.Parent = workspace                            -- parent last

print(tree:GetPivot().Position)                    -- where it is
```

- **Ctrl+G** (⌘G) groups selected parts into a Model.
- Set **PrimaryPart** so the model moves by that part.
- Keep templates in **ServerStorage**: not in the world, not visible to players.

## Errors

```lua
error("message")                       -- stop here, in red
warn("message")                        -- orange, keeps going
assert(condition, "message")           -- error if condition is false or nil

local ok, result = pcall(function()    -- run it, catch any error
	return somethingRisky()
end)
local ok, result = pcall(fn, arg1, arg2)  -- the function itself, no brackets
```

`ok` is `true` or `false`. `result` is the return value, or the error message.

## Saving

```lua
local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("PlayerData_v1")

local key = "player_" .. player.UserId           -- UserId, never Name

local ok, saved = pcall(function()
	return store:GetAsync(key)                   -- nil for a new player
end)

local ok, message = pcall(function()
	store:SetAsync(key, { Coins = 10 })          -- numbers, strings, booleans, tables
end)

game:BindToClose(function()
	-- save everyone: runs when the server shuts down, or you press Stop
end)
```

Before it works in Studio: **publish the place**, then **Game Settings →
Security → Enable Studio Access to API Services**.

## Messages you will see

| in Output | usually means |
|---|---|
| *Module code did not return exactly one value* | the module is missing its `return` line |
| *X is not a valid member of Model* | models have no Position: use `PivotTo` |
| *attempt to index nil* on a cloned thing | a template name is spelled wrong, or it is not in ServerStorage |
| `false` from a `pcall` you expected to work | print the second value: it is the error message |
| an error that `pcall` did not catch | you wrote `pcall(fn())` with brackets |
| *You must publish this place to the web* | publish before using DataStores |
| *StudioAccessToApisNotAllowed* | switch on API access in Game Settings |
| *DataStore request was added to queue* | too many saves to one key too quickly. Save less often |

## The rules

1. One module, one job. Settings in one place.
2. A module ends with `return`. Nothing after it.
3. Build it by hand, keep it in ServerStorage, `Clone` it out.
4. Models move with `PivotTo`, parts with `Position` or `CFrame`.
5. `error` for bugs, `if` and `return` for normal game things.
6. Every DataStore call goes inside a `pcall`.
7. Load once, change a table, save on leave and on close.
8. Never save over data that did not load.
</div>
