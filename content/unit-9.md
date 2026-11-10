<!-- ════════════════════════════════════════════════════════════════════
     UNIT 9 — PLAYERS
     Format and special fences are described at the top of lessons.md.
     No raw less-than sign or ampersand anywhere in this file.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 9.1 ═══════════════════════════ -->
<div id="md-9.1" hidden>
# The player list

Every Roblox game has a player list — the panel in the top right with everyone's
name. A game with a score puts that score right there, next to the name. This
lesson is how you get a number of your own onto it.

## Warm up

Before you read on, answer from memory:

```lua predict=p9-warm-leaderstats
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	print(player.Name, "joined")
end)
```

## A folder called leaderstats

Roblox looks at each player and asks one question: *is there a folder called
`leaderstats` inside this player?* If there is, every number inside that folder
is shown on the player list. That is the whole trick.

```lua
local Players = game:GetService("Players")

local function onPlayerAdded(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats" -- @n Spelled exactly; any other name is just a normal folder
	leaderstats.Parent = player -- @n Parented to the player, not to Workspace

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Value = 0
	coins.Parent = leaderstats

	print(player.Name, "joined")
end

Players.PlayerAdded:Connect(onPlayerAdded)
```

Press Play. Your name and `Coins 0` appear in the player list, and Output shows:

```output
Player1 joined  -  Server - Script:13
```

(The name in your Output is whatever your Roblox username is, not `Player1`.)

Everything here is something you already know except one thing: **`IntValue`**.
It is a whole number wrapped up in an Instance, so other parts of the game can
watch it and Roblox can read it. Its number lives in a property called `Value`.

- `Folder` is an Instance that holds other Instances. It has no position and
  nothing you can see in the world, which makes it perfect for this.
- `leaderstats` is spelled in lowercase, exactly. `Leaderstats`, `leaderStats`
  and `leader_stats` all do nothing at all.

```task=u9-leaderstats
- Add a **Script** to ServerScriptService with the script above
- Press Play and find your name in the player list with **Coins 0** next to it
- Press Stop
```

> **Key idea** Roblox shows every number inside a folder named exactly `leaderstats` on the player list.

## Reading and changing it

Your own scripts can reach that value like any other Instance — go into the
player, into their `leaderstats` folder, into `Coins`. Keep your first Script,
and add this as a **second** Script next to it in ServerScriptService:

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local coins = player:WaitForChild("leaderstats"):WaitForChild("Coins") -- @n One step down at a time: player, folder, value
	print(coins.Value)

	coins.Value += 50 -- @n Same as coins.Value = coins.Value + 50
	print(coins.Value)
end)
```

```output
0  -  Server - Script:5
50  -  Server - Script:8
```

The player list changes the moment you set `Value`. Nothing else to do — Roblox
is watching that number for you.

`WaitForChild` is here for a reason. Two scripts are now listening for the same
player, and nothing says which one hears about them first. If this one goes first,
the folder does not exist yet. `WaitForChild` waits until it does, instead of
handing you `nil`.

```lua predict=p9-leaderstats-name
local Players = game:GetService("Players")

local function onPlayerAdded(player)
	local stats = Instance.new("Folder")
	stats.Name = "stats"
	stats.Parent = player

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Value = 100
	coins.Parent = stats
end

Players.PlayerAdded:Connect(onPlayerAdded)
```

```task=u9-leaderstats-value
- Add the second Script, press Play, and check the player list says 50
- Add another `coins.Value += 25` line and run it again
- Print `typeof(coins.Value)` and see what an `IntValue` holds
```

> **Key idea** An `IntValue` keeps its number in `Value`, and changing `Value` updates the player list.

## Two numbers at once

A folder can hold as many numbers as you like. Each one gets its own column:

```lua
local Players = game:GetService("Players")

local function onPlayerAdded(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Parent = leaderstats

	local wins = Instance.new("IntValue")
	wins.Name = "Wins"
	wins.Parent = leaderstats
end

Players.PlayerAdded:Connect(onPlayerAdded)
```

`coins.Value` and `wins.Value` are both `0` already, because `0` is what integers
start at. Setting `Value = 0` out loud, as the first script did, is easier to
read and a good habit.

> **Key idea** Each `IntValue` in the folder gets its own column.

## Fix the bug

This script is meant to put `Coins 0` on the player list. It does not.

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "Leaderstats"
	leaderstats.Parent = player

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Value = 0
	coins.Parent = leaderstats
end)
```

No error. No red text. Just an empty player list, which is the worst kind of bug
to look for. Work out what is wrong before you open the answer.

```solution
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Value = 0
	coins.Parent = leaderstats
end)
```

Roblox looks for a folder named exactly `leaderstats`, all lowercase. `Name` is
just a string, so Luau had no way to tell you that `"Leaderstats"` was wrong —
it is a perfectly good name for a folder, it is just not the name Roblox is
looking for. When something should appear and silently does not, check your
spelling of names that Roblox itself gives meaning to.

> **Key idea** A name Roblox gives meaning to must match exactly: `Leaderstats` is not `leaderstats`.

## Your turn

*Optional practice: the stop clears without it.*

Write the leaderboard for a game where you can win rounds:

- two stats, `Coins` and `Wins`
- `Coins` starts at `0`, `Wins` starts at `0`
- after the folder is made, set `Wins` to `1` and `Coins` to `250`
- print both values, each on its own line

Your Output should show your own name on the first line:

```output
YourName joined  -  Server - Script:16
250  -  Server - Script:21
1  -  Server - Script:22
```

```solution
local Players = game:GetService("Players")

local function onPlayerAdded(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Parent = leaderstats

	local wins = Instance.new("IntValue")
	wins.Name = "Wins"
	wins.Parent = leaderstats

	print(player.Name, "joined")

	coins.Value = 250
	wins.Value = 1

	print(coins.Value)
	print(wins.Value)
end

Players.PlayerAdded:Connect(onPlayerAdded)
```

If you laid your script out differently, your line numbers will differ. What
matters is that the two numbers are `250` and `1`.

> **Recap**
> - Parent a Folder named `leaderstats` to the player.
> - Put `IntValue`s inside it, and each one becomes a column.
> - Change a number through its `Value` property.

> **Done when** every goal is ticked. One idea to keep: to put a number
> on the player list, parent an `IntValue` to a `Folder` called `leaderstats` that
> is parented to the player.
</div>


<!-- ═══════════════════════════ 9.2 ═══════════════════════════ -->
<div id="md-9.2" hidden>
# The character and its Humanoid

Your character in the game is a Model full of parts, and one of those parts is
the thing that makes it alive. It is called the **Humanoid**, and it is the most
useful object in Roblox: health, walking, jumping, dying and respawning all run
through it.

## Warm up

From memory — in what order do these things happen for a player who joins?

```lua predict=p9-warm-humanoid
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	print(`{player.Name} is here`)

	player.CharacterAdded:Connect(function(character)
		print(`{player.Name} spawned`)
	end)
end)
```

## Finding the Humanoid

Remember from unit 7 how to walk down from the top:

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local character = player.Character or player.CharacterAdded:Wait() -- @n Can be nil right at join, so it waits for the body if so
	local humanoid = character:WaitForChild("Humanoid")

	print(character.Name)
	print(humanoid.Health)
	print(humanoid.MaxHealth)
end)
```

```output
YourName  -  Server - Script:7
100  -  Server - Script:8
100  -  Server - Script:9
```

The character Model is named after you. Inside it sits a `Humanoid`. Health
starts at `100` and `MaxHealth` is also `100`, which is why the health bar over
your head is full.

`player.Character or player.CharacterAdded:Wait()` is worth reading slowly. If the
character already exists, use it. If it does not, `:Wait()` pauses this script
right there until `CharacterAdded` fires once, and hands the character back. It is
the standard way to say *the character, whenever it shows up*.

> **Key idea** The Humanoid lives inside the character Model, so get the character first, then wait for its `Humanoid`.

## Changing how the character moves

| property | what it does | normal value |
|---|---|---|
| `WalkSpeed` | how fast you walk, in studs per second | `16` |
| `JumpHeight` | how high you jump, in studs | `7.2` |
| `Health` | current health | `100` |
| `MaxHealth` | the number `Health` fills up to | `100` |

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local character = player.Character or player.CharacterAdded:Wait()
	local humanoid = character:WaitForChild("Humanoid")

	task.wait(3)
	humanoid.WalkSpeed = 40 -- @n Studs per second; the normal value is 16
	print("You are fast now")

	task.wait(3)
	humanoid.WalkSpeed = 8
	print("You are slow now")
end)
```

```output
You are fast now  -  Server - Script:9
You are slow now  -  Server - Script:13
```

While it is running, hold your movement keys. You really do move faster, then
slower. A property is not a setting on a label somewhere — it is the thing
itself, and changing it changes the game in front of you.

```task=u9-humanoid-speed
- Run the speed script and feel your character change pace twice
- Set `JumpHeight` to `20` and jump
- Set `WalkSpeed` to `0` and try to walk
```

> **Key idea** `WalkSpeed` and `JumpHeight` are ordinary properties, and changing them changes the game at once.

## Causing damage

Two ways. Set `Health` yourself, or ask the Humanoid to do the sum:

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local character = player.Character or player.CharacterAdded:Wait()
	local humanoid = character:WaitForChild("Humanoid")

	task.wait(3)
	humanoid:TakeDamage(25) -- @n Takes 25 off, so Health goes from 100 to 75
	print(humanoid.Health)

	task.wait(3)
	humanoid.Health = 10
	print(humanoid.Health)
end)
```

```output
75  -  Server - Script:9
10  -  Server - Script:13
```

`TakeDamage` is a **method** — a function that belongs to that Humanoid. You call
it with a colon, the same way you call `player:WaitForChild(...)`. It subtracts
from `Health` for you.

Set `Health` to `0` and your character falls over and respawns. That triggers an
event worth knowing:

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local character = player.Character or player.CharacterAdded:Wait()
	local humanoid = character:WaitForChild("Humanoid")

	humanoid.Died:Connect(function() -- @n Runs once, when Health reaches 0
		print(player.Name, "was knocked out")
	end)

	task.wait(2)
	humanoid.Health = 0
end)
```

```output
YourName was knocked out  -  Server - Script:8
```

After a few seconds you respawn fresh, at full health, and the whole thing is a
brand new character Model. Anything you connected to the old Humanoid is gone
with it — which is exactly why `CharacterAdded` exists. Every respawn runs it
again.

Health has a ceiling. Inside the same `PlayerAdded` function as above:

```lua predict=p9-humanoid-max
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

humanoid.Health = 150
print(humanoid.Health)
```

```task=u9-humanoid-damage
- Take 25 damage and watch the health bar drop
- Set health to 0 and read the `Died` message in Output
- Press Play again and check your character respawns at 100
```

> **Key idea** A respawn builds a brand new character, so anything you connected to the old Humanoid is gone.

## Fix the bug

This script is meant to print `100`, then make you walk twice as fast. It stops
before it does either.

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local humanoid = player:WaitForChild("Humanoid")

	print(humanoid.Health)
	humanoid.WalkSpeed = 32
end)
```

After about five seconds, an **orange** line appears in Output:

```output
Infinite yield possible on 'Players.YourName:WaitForChild("Humanoid")'
```

Orange means a warning, not an error, and this one you will meet again. It is
Studio saying *I have been waiting a long time for something that is not here*.
The script is still stuck on line 4, waiting forever. Look at Explorer while
playing: a Humanoid lives inside the character, not inside the player.

```solution
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local character = player.Character or player.CharacterAdded:Wait()
	local humanoid = character:WaitForChild("Humanoid")

	print(humanoid.Health)
	humanoid.WalkSpeed = 32
end)
```

`WaitForChild` only looks one step down, directly inside the thing you call it
on. When it hangs, open Explorer while playing and check the child is really
where you think it is. The players are under **Players**; their characters are
under **Workspace**.

> **Key idea** `WaitForChild` looks one step down only, and the Humanoid is in the character, not the player.

## Your turn

*Optional practice: the stop clears without it.*

Write a short round of a game:

- wait 2 seconds, then print `Round starting`
- set `WalkSpeed` to `24` and `JumpHeight` to `12`
- wait 4 seconds, take 40 damage and print the health that is left
- wait 2 more seconds, then set health to `0`
- when the Humanoid dies, print `Round over`, then the player's name on its own line

Your Output should look like this:

```output
Round starting  -  Server - Script:13
60  -  Server - Script:20
Round over  -  Server - Script:8
YourName  -  Server - Script:9
```

```solution
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local character = player.Character or player.CharacterAdded:Wait()
	local humanoid = character:WaitForChild("Humanoid")

	humanoid.Died:Connect(function()
		print("Round over")
		print(player.Name)
	end)

	task.wait(2)
	print("Round starting")

	humanoid.WalkSpeed = 24
	humanoid.JumpHeight = 12

	task.wait(4)
	humanoid:TakeDamage(40)
	print(humanoid.Health)

	task.wait(2)
	humanoid.Health = 0
end)
```

> **Recap**
> - Get the character first, then its Humanoid.
> - `WalkSpeed` changes how it moves, and `TakeDamage` lowers `Health`.
> - Every respawn is a new character, so use `CharacterAdded`.

> **Done when** every goal is ticked. One idea to keep: the character is
> a Model, the Humanoid inside it is the living part, and every respawn is a new
> character — so connect to `CharacterAdded` if you want to keep working on it.
</div>


<!-- ═══════════════════════════ 9.3 ═══════════════════════════ -->
<div id="md-9.3" hidden>
# Attributes and tags

So far every setting in your game has been a property Roblox made: `Size`,
`Color`, `WalkSpeed`. This lesson is about adding **your own** settings to any
Instance — and about labelling whole groups of parts so one script can run all of
them.

## Warm up

From memory:

```lua predict=p9-warm-attr
local prices = {
	Sword = 100,
	Shield = 60,
}

print(prices.Bow)
```

## Your own settings: attributes

An **attribute** is a named value you stick onto an Instance. It is like a
variable that lives on the part instead of in your script.

Make it by hand first, so you can see where it lives:

```task=u9-attr-hand
- Add a **Part** to Workspace and name it `Crate`. Tick **Anchored**.
- Select it, scroll to the bottom of the **Properties** window and find **Attributes**
- Click **+ Add Attribute**. Name it `Value`, type **number**, and click Save
- Set the new `Value` attribute to `25`
```

Now read it from a script:

```lua
local crate = workspace.Crate

print(crate:GetAttribute("Value")) -- @n Reads the Value attribute you made by hand
print(crate:GetAttribute("Owner"))
```

```output
25  -  Server - Script:3
nil  -  Server - Script:4
```

`GetAttribute` asks for an attribute by name. If there is no attribute with that
name you get `nil`, not an error — the same rule as a missing key in a
dictionary.

Scripts can set them too, and make new ones on the spot:

```lua
local crate = workspace.Crate

crate:SetAttribute("Value", 40)
crate:SetAttribute("Owner", "Ada") -- @n Creates the attribute if it does not exist yet
crate:SetAttribute("Locked", true)

print(crate:GetAttribute("Value"), crate:GetAttribute("Owner"), crate:GetAttribute("Locked"))
```

```output
40 Ada true  -  Server - Script:7
```

Press Play, click `Crate` in Explorer, and look at its Attributes: all three are
there. An attribute can hold a number, a string, a boolean, and Roblox values like
`Color3` and `Vector3` — but **not** a table or an Instance.

Why not just use a variable? Because an attribute is visible to **every** script,
and to you, in the Properties window. A builder can change a crate's value by
typing in a box, without opening a single script.

```lua predict=p9-attr-type
local crate = workspace.Crate

crate:SetAttribute("Value", 40)
crate.Value = 50
print(crate:GetAttribute("Value"))
```

> **Key idea** An attribute is your own named setting on an Instance, and a missing one gives `nil`.

## Knowing when one changes

Every Instance can tell you when one of its attributes changes:

```lua
local crate = workspace.Crate

crate:GetAttributeChangedSignal("Locked"):Connect(function() -- @n The name in quotes must match the attribute exactly
	print("Locked is now", crate:GetAttribute("Locked"))
end)

task.wait(2)
crate:SetAttribute("Locked", true)
task.wait(2)
crate:SetAttribute("Locked", false)
```

```output
Locked is now true  -  Server - Script:4
Locked is now false  -  Server - Script:4
```

This is an event, just like `Touched`. Something changes, your function runs. It
works no matter **who** changed it — another script, or you typing in the
Properties window while the game runs. Try it: during Play, untick `Locked` by
hand and watch Output.

```task=u9-attr-script
- Read your `Value` attribute from a script and print it
- Set a new `Owner` attribute from the script and find it in Properties
- Connect to `GetAttributeChangedSignal`, then change the attribute by hand during Play
```

> **Key idea** `GetAttributeChangedSignal` fires whenever that attribute changes, whoever changed it.

## Labels for many parts: tags

An attribute is a setting on **one** Instance. A **tag** is a label you put on
**many** — a single word like `Lava` — so one script can find all of them.

Tags belong to a service called **CollectionService**:

```task=u9-tag-hand
- Make three Parts named anything you like, and anchor them
- Select all three, then in **Properties** scroll to **Tags** and click **+**
- Type `Lava` and press Enter. All three parts now carry the tag.
- Run the first script below and watch all three turn to glowing lava at once
```

Now one script handles all three, however many you add later:

```lua
local CollectionService = game:GetService("CollectionService")

local lavaParts = CollectionService:GetTagged("Lava")
print(#lavaParts, "lava parts")

for _, part in lavaParts do
	part.Color = Color3.fromRGB(255, 80, 20)
	part.Material = Enum.Material.Neon
end
```

```output
3 lava parts  -  Server - Script:4
```

`GetTagged` hands you a list of every Instance with that tag. You already know
what to do with a list.

That is the real power here. Before, your lava script would have needed
`workspace.Lava1`, `workspace.Lava2`, `workspace.Lava3`... Now a builder tags a
fourth part and it simply works. Nothing in the script changes.

Make them actually dangerous with a loop and an event:

```lua
local CollectionService = game:GetService("CollectionService")

local function makeLava(part)
	part.Color = Color3.fromRGB(255, 80, 20)
	part.Material = Enum.Material.Neon

	part.Touched:Connect(function(hit)
		local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid") -- @n Like FindFirstChild, but it looks for a class, not a name
		if humanoid then
			humanoid.Health = 0
		end
	end)
end

for _, part in CollectionService:GetTagged("Lava") do
	makeLava(part)
end
```

Code that runs on every tagged part goes in a function, so it is written once.

```lua predict=p9-tag-case
local CollectionService = game:GetService("CollectionService")

-- the three parts are tagged "Lava"
print(#CollectionService:GetTagged("lava"))
```

> **Key idea** A tag labels many Instances, and `GetTagged` hands you all of them as a list.

## Fix the bug

This crate should print `Opened!` when its `Locked` attribute is set to `false`.
Run it — nothing is printed, ever.

```lua
local crate = workspace.Crate
crate:SetAttribute("Locked", true)

crate:GetAttributeChangedSignal("locked"):Connect(function()
	if crate:GetAttribute("Locked") == false then
		print("Opened!")
	end
end)

task.wait(2)
crate:SetAttribute("Locked", false)
```

```solution
local crate = workspace.Crate
crate:SetAttribute("Locked", true)

crate:GetAttributeChangedSignal("Locked"):Connect(function()
	if crate:GetAttribute("Locked") == false then
		print("Opened!")
	end
end)

task.wait(2)
crate:SetAttribute("Locked", false)
```

Attribute names are case-sensitive, like variable names. The script was listening
for changes to an attribute called `locked`, which nothing ever changes. Same
rule as tags: `"Lava"` and `"lava"` are different words.

> **Key idea** Attribute and tag names are case-sensitive, so a wrong capital silently matches nothing.

## Your turn

Using tags **and** attributes together:

- tag two or more parts `Pad`, and give each a number attribute `Speed` (try `30`
  on one and `60` on another)
- one script finds every `Pad` with `GetTagged`
- when a character touches a pad, set their `WalkSpeed` to that pad's `Speed`
- print the name of the pad and the speed it gave

When you step on a pad with `Speed` set to `30`, Output should say something like:

```output
Pad1 30  -  Server - Script:10
```

```solution
local CollectionService = game:GetService("CollectionService")

local function makePad(pad)
	pad.Touched:Connect(function(hit)
		local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid")
		if humanoid then
			local speed = pad:GetAttribute("Speed") or 16
			if humanoid.WalkSpeed ~= speed then
				humanoid.WalkSpeed = speed
				print(pad.Name, speed)
			end
		end
	end)
end

for _, pad in CollectionService:GetTagged("Pad") do
	makePad(pad)
end
```

Two details worth copying. `or 16` means a pad you forgot to give a `Speed` still
works. And the `~=` check stops Output filling up with one line per touch —
`Touched` fires many times a second while you stand on a part.

```task=u9-attr-own
- Tag at least two parts `Pad` and give each a `Speed` attribute
- Run your script and step from one pad to the other
- Change a pad's `Speed` in Properties and run it again — no script changes needed
```

> **Recap**
> - `SetAttribute` and `GetAttribute` store your own values on an Instance.
> - `GetAttributeChangedSignal` runs a function when that attribute changes.
> - `GetTagged` finds every Instance that carries a tag.

> **Done when** all checklists are ticked. One idea to keep: attributes are your
> own settings on one Instance; tags are a label on many, so one script can run
> them all.
</div>


<!-- ═══════════════════════════ 9.4 ═══════════════════════════ -->
<div id="md-9.4" hidden>
# Build: a coin rush

Time to make an actual game. Spinning coins are scattered over the Baseplate.
Touch one and it goes on your score. A rare blue gem is worth five. Coins come
back a few seconds after they are taken, somewhere new. The first player to 25
wins — and then everyone starts again from zero.

It uses almost everything since unit 2: settings variables, `if`, loops,
functions, tables, events, debounce, `leaderstats` and attributes.

## Warm up

From memory:

```lua predict=p9-warm-build
local coins = {}

for i = 1, 3 do
	table.insert(coins, i * 10)
end

print(#coins, coins[3])
```

## The script

Start from a fresh **Baseplate**. Add one Script to ServerScriptService and
replace everything in it with this:

```lua
local Players = game:GetService("Players")

-- settings: change these to change the game
local COIN_COUNT = 20
local AREA = 80          -- coins land within this many studs of the middle
local RESPAWN_TIME = 5   -- seconds before a taken coin comes back
local GOAL = 25
local GOLD = Color3.fromRGB(255, 200, 40)
local GEM = Color3.fromRGB(80, 220, 255)

local coinFolder = Instance.new("Folder")
coinFolder.Name = "Coins"
coinFolder.Parent = workspace

local coins = {}

-- every player gets a score on the player list
Players.PlayerAdded:Connect(function(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	local score = Instance.new("IntValue")
	score.Name = "Coins"
	score.Value = 0
	score.Parent = leaderstats
end)

local function randomSpot()
	local x = math.random(-AREA, AREA) -- @n A random whole number from minus AREA up to AREA
	local z = math.random(-AREA, AREA)
	return Vector3.new(x, 3, z)
end

-- put a coin somewhere new, and decide what it is worth
local function placeCoin(coin)
	if math.random(1, 10) == 1 then
		coin:SetAttribute("Worth", 5)
		coin.Color = GEM
	else
		coin:SetAttribute("Worth", 1)
		coin.Color = GOLD
	end
	coin.Position = randomSpot()
	coin.Transparency = 0
	coin:SetAttribute("Taken", false)
end

local function announceWinner(winner)
	print(`{winner.Name} wins with {winner.leaderstats.Coins.Value} coins!`)

	local character = winner.Character
	if character then
		local sparkles = Instance.new("Sparkles")
		sparkles.Parent = character:FindFirstChild("HumanoidRootPart")
		task.delay(5, function()
			sparkles:Destroy()
		end)
	end

	for _, player in Players:GetPlayers() do
		player.leaderstats.Coins.Value = 0
	end
end

local function onCoinTouched(coin, hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player or coin:GetAttribute("Taken") then -- @n player is nil for non-players; Taken is true once grabbed
		return
	end

	coin:SetAttribute("Taken", true)
	coin.Transparency = 1

	local score = player.leaderstats.Coins
	score.Value += coin:GetAttribute("Worth") -- @n Adds 1 for a gold coin or 5 for a gem
	if score.Value >= GOAL then
		announceWinner(player)
	end

	task.delay(RESPAWN_TIME, function()
		placeCoin(coin)
	end)
end

-- make the coins
for i = 1, COIN_COUNT do
	local coin = Instance.new("Part")
	coin.Name = "Coin"
	coin.Shape = Enum.PartType.Cylinder
	coin.Size = Vector3.new(0.4, 3, 3)
	coin.Material = Enum.Material.Neon
	coin.Anchored = true
	coin.CanCollide = false
	placeCoin(coin)

	coin.Touched:Connect(function(hit)
		onCoinTouched(coin, hit)
	end)

	coin.Parent = coinFolder
	table.insert(coins, coin)
end

print(`{COIN_COUNT} coins are out. First to {GOAL} wins.`)

-- spin every coin, forever
while true do
	for _, coin in coins do
		coin.CFrame *= CFrame.Angles(0, math.rad(4), 0) -- @n Turns 4 degrees each frame, around its own middle
	end
	task.wait()
end
```

Press Play.

```output
20 coins are out. First to 25 wins.  -  Server - Script:105
```

Run around and collect. Watch your number climb on the player list. Somewhere out
there is a blue one.

```task=u9-build-run
- Paste the script into a fresh Baseplate and press Play
- Collect coins and watch **Coins** go up on the player list
- Find a blue gem and see your score jump by 5
- Reach 25 and read the winner line in Output
```

When someone gets there, every score drops back to zero and Output says
something like this (a gem can push you a little past 25):

```output
YourName wins with 25 coins!  -  Server - Script:50
```

## How it works

Read it top to bottom; every part is something you have done before.

- **Settings first.** Every number you might want to change is a
  `SCREAMING_SNAKE_CASE` variable at the top.
- **A Folder for the coins.** Explorer stays tidy: all twenty coins sit inside
  `Workspace.Coins` instead of spilling into Workspace.
- **`leaderstats`** from 9.1, one `IntValue` called `Coins` per player.
- **`placeCoin` is used twice.** Once when a coin is made, and again every time
  one respawns. Writing the "put it somewhere and roll its value" code once in a
  function is why respawning is only three lines.
- **Attributes as notes on the coin.** `Worth` remembers what the coin is worth;
  `Taken` remembers whether someone already grabbed it. The coin carries its own
  state, so one `onCoinTouched` function works for all twenty.
- **`Taken` is the debounce.** `Touched` fires many times in a single step. Without
  that check, one coin could pay you four or five times.
- **`GetPlayerFromCharacter`** turns *some body part touched me* into *this
  player touched me*, and gives `nil` for anything that is not a player — a
  falling part, say. `if not player ... return` ignores those.
- **`task.delay`** runs the respawn later without stopping anything now.
- **The spin loop goes last**, because `while true do` never finishes. Any line
  after it would never run. One loop spins every coin a tiny bit each frame; with
  no number, `task.wait()` waits a single frame.

Two small extras: a `Sparkles` object makes particles wherever it is parented, and
`Players:GetPlayers()` gives a list of everyone in the game right now.

> **Key idea** Each coin carries its own state in attributes, so one handler and one `placeCoin` function serve all twenty.

## Change one number

```task=u9-build-tweak
- Set `COIN_COUNT` to `60` and `AREA` to `40` — a crowded field
- Set `GOAL` to `5` so you can see the win and the reset quickly
- Make gems rarer: one in 25 instead of one in 10
- Make the spin faster by changing the `4`
```

## Test with more than one player

A game for one is not much of a race. Studio can pretend to be several players.

```task=u9-build-test
- Open the **Test** tab at the top of Studio
- Under **Clients and Servers**, choose **2 Players** and click **Start**
- Three windows open: a server and two players. Collect coins in each player window.
- Check that only the player who touched a coin gets its points, then click **Cleanup** to close them
```

> **Key idea** Studio can run several test players, and each player should only get points for coins they touched.

## Make it yours

Try at least one:

- Add a `Wins` stat next to `Coins`, and give the winner one win each time.
- Give every gem a `PointLight`, so you can spot them from a distance.
- Make taken coins shoot up into the air with `TweenService` instead of just
  turning invisible.
- Add a third coin type, worth 10, that appears one time in 50.
- Put the coins in a ring instead of at random, using `math.cos` and `math.sin`.

```task=u9-build-own
- Add something of your own to the coin rush
- Test it with 2 players
- Show it to someone
```

> **Recap**
> - Settings go at the top, helper functions in the middle, and the forever loop last.
> - Attributes on each coin remember its `Worth` and whether it is `Taken`.
> - `Taken` stops one touch from paying out many times.

> **Done when** all checklists are ticked. That is a whole game: a score, items
> with their own state, events, a win condition and a reset — the same shape as
> most simulator games on Roblox.
</div>


<!-- ═══════════════════════════ cheat-9 ═══════════════════════════ -->
<div id="md-cheat-9" hidden>
# Players cheatsheet

Everything from the players unit on one page. Keep it open next to Studio.

## A score on the player list

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"          -- exactly this, all lowercase
	leaderstats.Parent = player

	local coins = Instance.new("IntValue")    -- NumberValue for decimals
	coins.Name = "Coins"
	coins.Value = 0
	coins.Parent = leaderstats
end)

-- anywhere else on the server
local coins = player:WaitForChild("leaderstats"):WaitForChild("Coins")
coins.Value += 10
```

## The character and Humanoid

```lua
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local root = character:WaitForChild("HumanoidRootPart")

humanoid.WalkSpeed = 16      -- normal
humanoid.JumpHeight = 7.2    -- normal
humanoid.MaxHealth = 100
humanoid.Health = 100
humanoid:TakeDamage(25)

humanoid.Died:Connect(function()
	print(player.Name, "died")
end)

-- from a part that was touched
local player = Players:GetPlayerFromCharacter(hit.Parent)        -- nil if not a player
local humanoid = hit.Parent:FindFirstChildOfClass("Humanoid")
```

Every respawn is a new character. Use `player.CharacterAdded` to set it up again
each time.

## Attributes

```lua
part:SetAttribute("Worth", 5)             -- make it, or change it
local worth = part:GetAttribute("Worth")  -- nil if it does not exist
part:SetAttribute("Worth", nil)           -- remove it

part:GetAttributeChangedSignal("Worth"):Connect(function()
	print("now", part:GetAttribute("Worth"))
end)
```

Attributes hold numbers, strings, booleans, `Color3`, `Vector3` and a few more
Roblox types. Not tables, not Instances.

## Tags

```lua
local CollectionService = game:GetService("CollectionService")

for _, part in CollectionService:GetTagged("Lava") do
	-- set up each tagged part
end

CollectionService:AddTag(part, "Lava")      -- from a script
CollectionService:RemoveTag(part, "Lava")
print(CollectionService:HasTag(part, "Lava"))
part:HasTag("Lava")                          -- the same, called on the part
```

Add tags by hand: select the parts, then **Properties → Tags → +**.

## Everyone in the game

```lua
for _, player in Players:GetPlayers() do
	print(player.Name)
end
```

## Testing with several players

**Test** tab → **Clients and Servers** → pick **2 Players** → **Start**.
**Cleanup** closes the windows.

## Messages you will see

| in Output | usually means |
|---|---|
| nothing on the player list, no error | the folder is not called exactly `leaderstats`, or it is not parented to the player |
| orange *Infinite yield possible on ...WaitForChild("Humanoid")* | you looked in the player — the Humanoid is in the **character** |
| *leaderstats is not a valid member of Player* | the folder is not made yet — use `WaitForChild` |
| *attempt to index nil with 'Parent'* / *with 'leaderstats'* | `GetPlayerFromCharacter` gave `nil` — something that is not a player touched it |
| *attempt to perform arithmetic on nil* | `GetAttribute` gave `nil` — the name is spelled differently, or it was never set |
| *Value is not a valid member of Part* | you wrote `part.Value` — attributes are not properties, use `GetAttribute` |
| a score that goes up several times per touch | `Touched` fires many times — add a debounce |

## The rules

1. `leaderstats`, lowercase, inside the player. Numbers go in `IntValue`s.
2. Change the number through `.Value`.
3. The Humanoid lives in the character, and the character lives in Workspace.
4. A respawn makes a new character. Set it up in `CharacterAdded`.
5. `GetPlayerFromCharacter(hit.Parent)` — and check it is not `nil`.
6. Attributes are settings on one Instance. Tags are labels on many.
7. Names of attributes and tags are case-sensitive.
8. Test with 2 players before you call it finished.
</div>
