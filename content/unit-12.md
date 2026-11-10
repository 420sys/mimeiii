<!-- ════════════════════════════════════════════════════════════════════
     UNIT 12 — HERO PROJECT: LAVA RISE
     Same format as lessons.md. No raw less-than or ampersand anywhere:
     write &lt; and &amp; even inside code fences.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 12.1 ═══════════════════════════ -->
<div id="md-12.1" hidden>
# Plan a real game

This last unit is one project: a complete round-based game called **Lava
Rise**. Players wait in a lobby. A countdown runs. Everyone is dropped into a
glass arena with a rainbow spiral of platforms, and lava starts climbing from
the floor. Whoever is still above the lava when time runs out wins, and their
wins are saved for ever.

There is almost nothing new to learn here. Every piece is something you have
already done. What is new is putting a whole game together, so this lesson is
about the plan.

```lua predict=p12-warm1
-- in a LocalScript
buyEvent:FireServer(9999) -- "I have 9999 coins, honest"
```

## Phases

Almost every round-based game on Roblox is the same loop of **phases**:

```text
   waiting  ->  intermission  ->  round  ->  results
      ^                                         |
      +-----------------------------------------+
```

| phase | what is happening | what ends it |
|---|---|---|
| **waiting** | not enough players yet | enough players join |
| **intermission** | a countdown in the lobby | the countdown reaches 0 |
| **round** | everyone in the arena, lava rising | time runs out, or nobody is left |
| **results** | survivors are named and get a win | a short pause |

Write the phases down before any code. Each one becomes a function, and the
main loop of the game becomes four lines.

> **Key idea** A round-based game is a loop of phases: waiting, intermission, round and results.

## Who does what

The game is six scripts. Each has one job, the way you split the coins build in
the last unit:

| name | type | where | its one job |
|---|---|---|---|
| **Config** | ModuleScript | ReplicatedStorage | every setting, readable by server and clients |
| **PlayerData** | ModuleScript | ServerScriptService | load, change and save wins |
| **Data** | Script | ServerScriptService | players joining and leaving |
| **RoundSystem** | Script | ServerScriptService | the phases: the heart of the game |
| **Lava** | ModuleScript | ServerScriptService | the lava: rise, reset, burn |
| **RoundClient** | LocalScript | inside a ScreenGui | shows the status on screen |

The **server owns the game**. It runs the clock, decides who is alive and gives
out wins. The client only **shows** what the server says. That is the rule from
the client and server unit, and it is why nobody can give themselves a win.

```lua predict=p12-where
for seconds = 60, 1, -1 do
	status.Value = `Survive! {seconds}`
	task.wait(1)
end
```

> **Key idea** The server owns the game, and the client only shows what the server says.

## Build the arena with the Command Bar

The arena has a floor, four glass walls, twenty platforms and the lava. That is
a lot of clicking, so you will build it with code. But a script that runs while
playing has its changes thrown away when you press Stop.

The **Command Bar** is the answer. It runs code once, straight away, while you
are **editing**, and what it builds stays in your place like anything you built
by hand. Open it from the **View** tab. It is a long box at the bottom of
Studio.

Start a fresh **Baseplate** place for this project. Press Stop if you are
playing, paste this whole script into the Command Bar and press Enter:

```lua
local CENTER = Vector3.new(0, 0, -150)
local SIZE = 80
local WALL_HEIGHT = 90
local PLATFORM_COUNT = 20

local arena = Instance.new("Model")
arena.Name = "Arena"

local function block(name, size, offset, color, material)
	local part = Instance.new("Part")
	part.Name = name
	part.Size = size
	part.Position = CENTER + offset
	part.Color = color
	part.Material = material
	part.Anchored = true
	part.Parent = arena
	return part
end

block("Floor", Vector3.new(SIZE, 2, SIZE), Vector3.new(0, 1, 0), Color3.fromRGB(60, 60, 75), Enum.Material.Slate)

local half = SIZE / 2
local glass = Color3.fromRGB(170, 200, 255)
local walls = {
	block("Wall", Vector3.new(2, WALL_HEIGHT, SIZE), Vector3.new(half, WALL_HEIGHT / 2, 0), glass, Enum.Material.Glass),
	block("Wall", Vector3.new(2, WALL_HEIGHT, SIZE), Vector3.new(-half, WALL_HEIGHT / 2, 0), glass, Enum.Material.Glass),
	block("Wall", Vector3.new(SIZE, WALL_HEIGHT, 2), Vector3.new(0, WALL_HEIGHT / 2, half), glass, Enum.Material.Glass),
	block("Wall", Vector3.new(SIZE, WALL_HEIGHT, 2), Vector3.new(0, WALL_HEIGHT / 2, -half), glass, Enum.Material.Glass),
}
for _, wall in ipairs(walls) do
	wall.Transparency = 0.7
end

for i = 1, PLATFORM_COUNT do
	local angle = math.rad(i * 25) -- @n `math.rad` turns degrees into radians for cos and sin
	local offset = Vector3.new(math.cos(angle) * 22, 3 + i * 3, math.sin(angle) * 22) -- @n x and z go round a circle; y climbs 3 studs a step
	local color = Color3.fromHSV(i / PLATFORM_COUNT, 0.6, 1)
	block("Platform", Vector3.new(8, 1, 8), offset, color, Enum.Material.SmoothPlastic)
end

block("ArenaSpawn", Vector3.new(6, 1, 6), Vector3.new(0, 2.5, 0), Color3.fromRGB(125, 255, 175), Enum.Material.Neon)

local lava = block("Lava", Vector3.new(SIZE - 4, 100, SIZE - 4), Vector3.new(0, -60, 0), Color3.fromRGB(255, 90, 20), Enum.Material.Neon)
lava.CanCollide = false -- @n players pass through the lava instead of standing on it

arena.Parent = workspace
print("Arena built")
```

Look around from the spawn: 150 studs away stands a glass box with a
rainbow spiral inside. The default **SpawnLocation** from the Baseplate template
is your lobby.

Everything in that script is from earlier units, and the numbers are the design:

- The **floor** is 2 studs thick with its middle at y `1`, so its top is at `2`.
- The **platforms** climb in a spiral: each one is 25 degrees further round and
  3 studs higher than the last. Three studs is an easy jump. The top one, number
  20, is at y `63`.
- The **lava** is a huge slab hidden **under** the Baseplate. Its middle is at
  `-60` and it is 100 tall, so its top is at `-10`. During a round it will rise
  68 studs, which puts its top at `58`: just below the last two platforms.
  Reach the top and you survive.
- **ArenaSpawn** is the green pad in the middle, where players land.

```task=u12-map
- Start a new Baseplate place and open the **Command Bar** from the View tab
- Paste the arena script and press Enter
- In Explorer, open **Arena**: find the Floor, four Walls, twenty Platforms, ArenaSpawn and Lava
- If you ran it twice by mistake, delete one of the two Arena models
```

> **Key idea** The Command Bar runs code while you are editing, so what it builds stays in your place.

## Settings and saving

Three scripts come straight from the last unit, with small changes. Put them in
now, so the game has somewhere to keep its settings and its wins.

**Config**, a ModuleScript in **ReplicatedStorage**:

```lua
local Config = {}

Config.MIN_PLAYERS = 1   -- set this to 2 once other people can join
Config.INTERMISSION = 10 -- seconds of countdown in the lobby
Config.ROUND_TIME = 60   -- seconds a round lasts
Config.LAVA_RISE = 68    -- studs the lava climbs in one round
Config.END_PAUSE = 5     -- seconds the result stays up

return Config
```

**PlayerData**, a ModuleScript in **ServerScriptService**. It is the coins build
module with a new store name and `Wins` instead of `Coins`:

```lua
local DataStoreService = game:GetService("DataStoreService")

local store = DataStoreService:GetDataStore("LavaRise_v1")

-- every stat a player has, and what a brand new player starts with
local DEFAULTS = {
	Wins = 0,
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
	data[stat] += amount

	-- keep the leaderboard showing the same number
	local leaderstats = player:FindFirstChild("leaderstats")
	local value = leaderstats and leaderstats:FindFirstChild(stat)
	if value then
		value.Value = data[stat]
	end
end

return PlayerData
```

**Data**, a Script in **ServerScriptService**. Only the printed line is
different from the coins build:

```lua
local Players = game:GetService("Players")
local ServerScriptService = game:GetService("ServerScriptService")

local PlayerData = require(ServerScriptService.PlayerData)

local AUTOSAVE_EVERY = 60 -- seconds

local function onPlayerAdded(player)
	local data = PlayerData.load(player)
	if not data then
		player:Kick("Your data could not load. Please rejoin.")
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

	print(`{player.Name} loaded with {data.Wins} wins`)
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

Saving needs the same setup as last unit: **publish** this new place, then
switch on **Enable Studio Access to API Services** in Game Settings → Security.
Without it, Data kicks you as soon as you press Play, which is exactly what it
was built to do.

```output
Ada loaded with 0 wins  -  Server - Data:30
```

```task=u12-setup
- Add **Config** to ReplicatedStorage
- Add **PlayerData** and **Data** to ServerScriptService
- Publish the place and switch on API access
- Press Play and see **Wins** on the leaderboard
```

> **Key idea** Settings live in the Config module, and wins are saved by the same PlayerData code as the last unit.

## Your turn

Start the heart of the game the way professionals start anything big: with the
**shape** first. Add a Script called **RoundSystem** to ServerScriptService.
Write four functions, `waitForPlayers`, `intermission`, `playRound` and
`endRound`, that each only print their own name for now. Then write the forever
loop that calls them in order, with a `task.wait(2)` at the end of each lap.

Press Play, and the four phases should print in order, over and over:

```output
waitForPlayers  -  Server - RoundSystem:2
intermission  -  Server - RoundSystem:6
playRound  -  Server - RoundSystem:10
endRound  -  Server - RoundSystem:14
```

```solution
local function waitForPlayers()
	print("waitForPlayers")
end

local function intermission()
	print("intermission")
end

local function playRound()
	print("playRound")
end

local function endRound()
	print("endRound")
end

while true do
	waitForPlayers()
	intermission()
	playRound()
	endRound()
	task.wait(2)
end
```

Empty functions like these are called **stubs**. The game already has its whole
shape, and it runs. From here on you fill in one function at a time and press
Play after each, so you always know which change broke something.

```task=u12-plan
- Add the **RoundSystem** Script with four stub functions
- Write the forever loop that calls them in order
- Play and watch the four phases print, lap after lap
```

> **Recap**
> - A round is a loop: waiting, intermission, round, results.
> - The server owns the game; the client only shows it.
> - Build the shape first with empty stub functions, then fill them in one at a time.

> **Done when** all checklists are ticked. The plan, the map, the settings and the
> saving are in. Next build: the round loop.
</div>


<!-- ═══════════════════════════ 12.2 ═══════════════════════════ -->
<div id="md-12.2" hidden>
# Build 1: the round loop

Time to fill in the stubs. By the end of this lesson Lava Rise is a real game
loop: wait, count down, send everyone into the arena, run a timed round, hand
out wins, and do it all again. There is no lava yet. That comes next.

```lua predict=p12-warm2
for seconds = 3, 1, -1 do
	print(seconds)
end
```

## A status everyone can read

Every player needs to know what is going on: *Next round in 7*, *Survive! 42*.
The server will keep that one line of text in a **StringValue**, an Instance
whose whole job is to hold one string in its `Value`, like the IntValues on the
leaderboard.

The server makes it in **ReplicatedStorage**. Everything in there is copied to
every player automatically, so when the server changes the value, every client
sees the change. In the last build lesson you will put it on the screen. For now
you can watch it in Explorer while playing.

> **Key idea** The server keeps one line of status text in a StringValue in ReplicatedStorage, and every client can read it.

## The script

Replace everything in **RoundSystem** with this:

```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")

local Config = require(ReplicatedStorage.Config)
local PlayerData = require(ServerScriptService.PlayerData)

local arenaSpawn = workspace:WaitForChild("Arena"):WaitForChild("ArenaSpawn")

-- the line of text every player can read, made here so the server owns it
local status = Instance.new("StringValue")
status.Name = "Status"
status.Value = "Starting up"
status.Parent = ReplicatedStorage

local alive = {}       -- [player] = true while they are still in the round
local connections = {} -- the Died connections, disconnected after each round

Players.PlayerRemoving:Connect(function(player)
	alive[player] = nil
end)

local function countAlive()
	local count = 0
	for _ in pairs(alive) do -- @n only the keys matter here, so the value is skipped with `_`
		count += 1
	end
	return count
end

local function waitForPlayers()
	while #Players:GetPlayers() &lt; Config.MIN_PLAYERS do
		status.Value = `Waiting for {Config.MIN_PLAYERS} players`
		task.wait(1)
	end
end

local function intermission()
	for seconds = Config.INTERMISSION, 1, -1 do
		status.Value = `Next round in {seconds}`
		task.wait(1)
	end
end

local function sendIn(player)
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health &lt;= 0 then
		return -- no living character right now, so they sit this round out
	end

	local offset = Vector3.new(math.random(-10, 10), 4, math.random(-10, 10))
	character:PivotTo(arenaSpawn.CFrame + offset)
	alive[player] = true

	local connection = humanoid.Died:Connect(function()
		alive[player] = nil
	end)
	table.insert(connections, connection)
end

local function playRound()
	for _, player in ipairs(Players:GetPlayers()) do
		sendIn(player)
	end
	print(`Round started with {countAlive()} players`)

	for seconds = Config.ROUND_TIME, 1, -1 do
		if countAlive() == 0 then
			break -- everyone is out, so end early
		end
		status.Value = `Survive! {seconds}`
		task.wait(1)
	end
end

local function endRound()
	local winners = {}
	for player in pairs(alive) do
		table.insert(winners, player.Name)
		PlayerData.add(player, "Wins", 1) -- @n goes through PlayerData, so the win is saved
	end

	if #winners == 0 then
		status.Value = "Nobody survived"
	else
		status.Value = `Survivors: {table.concat(winners, ", ")}`
	end
	print(status.Value)

	-- tidy up, so the next round starts clean
	for _, connection in ipairs(connections) do
		connection:Disconnect()
	end
	connections = {} -- @n a fresh empty table, now the old ones are disconnected

	-- survivors go back to the lobby
	for player in pairs(alive) do
		player:LoadCharacter()
	end
	alive = {}
end

while true do
	waitForPlayers()
	intermission()
	playRound()
	endRound()
	task.wait(Config.END_PAUSE)
end
```

Press Play and wait. Ten seconds later you are dropped onto the green pad in the
arena. Sixty seconds after that you are back at the lobby spawn, with one more
**Win** on the leaderboard.

```output
Round started with 1 players  -  Server - RoundSystem:66
Survivors: Ada  -  Server - RoundSystem:89
```

While it plays, open **ReplicatedStorage** in Explorer and click **Status**. Its
Value in the Properties window counts down with the game.

```task=u12-loop
- Replace RoundSystem with the full script and press Play
- Get dropped into the arena when the countdown ends
- Watch **Status** count down in ReplicatedStorage while you wait
- Survive the round and see **Wins** go up by one
```

> **Key idea** Each phase is one function, and a `while true` loop calls them in order, forever.

## How it works

Each phase is one function, and each one is something you have built before.

- **`waitForPlayers`** is a `while` loop that checks once a second. With
  `MIN_PLAYERS` at 1, it lets you straight through.
- **`intermission`** is a `for` loop counting down, from the loops unit.
- **`alive`** is a dictionary with **players as the keys**, like the
  per-player debounce tables in the events unit. `alive[player] = true` puts
  someone in, `alive[player] = nil` takes them out, and `countAlive` counts the
  keys with `pairs`. A dictionary like this, where only the keys matter, is
  often called a **set**.
- **`sendIn`** checks the player has a living character first. A player who has
  just joined, or who is dead and waiting to respawn, has no living character to
  move. `character and character:FindFirstChildOfClass("Humanoid")` gives `nil`
  instead of an error if there is no character at all.
- **`PivotTo`** moves the whole character model, the same as the trees in the
  last unit. The random offset stops everyone landing on the same spot.
- **`humanoid.Died`** takes a player out of `alive` the moment they die. Each
  connection is saved in `connections`, and `endRound` disconnects them all, so
  old rounds never leave listeners behind.
- **`break`** ends the round early if nobody is left.
- **`player:LoadCharacter()`** gives a player a brand new character at the
  spawn point. It is how the survivors get home.

```lua predict=p12-early
for seconds = Config.ROUND_TIME, 1, -1 do
	if countAlive() == 0 then
		break
	end
	status.Value = `Survive! {seconds}`
	task.wait(1)
end
```

```task=u12-lose
- Play, and once you are in the arena press **Esc → Reset Character**
- See the round end within a second, with `Nobody survived` in Output
- Check your Wins did **not** go up
```

> **Key idea** `alive` is a dictionary with players as keys: set a player to `true` to add them and to `nil` to remove them.

## Fix the bug

Someone tidied up `sendIn` and moved one line to the top:

```lua
local function sendIn(player)
	alive[player] = true

	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health &lt;= 0 then
		return
	end

	local offset = Vector3.new(math.random(-10, 10), 4, math.random(-10, 10))
	character:PivotTo(arenaSpawn.CFrame + offset)

	local connection = humanoid.Died:Connect(function()
		alive[player] = nil
	end)
	table.insert(connections, connection)
end
```

It seems fine. But reset your character when the status says *Next round in
2*. You are still dead when the round starts, so you never go into the arena.
You respawn in the lobby, the round runs the full minute anyway, and at the end
you get a **Win** for a round you never played.

Work out why before you look.

```solution
local function sendIn(player)
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health &lt;= 0 then
		return
	end

	local offset = Vector3.new(math.random(-10, 10), 4, math.random(-10, 10))
	character:PivotTo(arenaSpawn.CFrame + offset)
	alive[player] = true -- only once they are really in the arena

	local connection = humanoid.Died:Connect(function()
		alive[player] = nil
	end)
	table.insert(connections, connection)
end
```

With the line at the top, a dead player is marked alive **before** the check
sends them away. They return early, so they never get a `Died` connection
either, and nothing ever takes them out of `alive`. Put a player into the set
only once everything that should be true about them is true.

```task=u12-fix
- Move `alive[player] = true` to the top of `sendIn`
- Reset at *Next round in 2* and win a round you never played
- Move it back, try again, and see that you get no win
```

> **Key idea** Put a player into the set only once everything that should be true about them is true.

## Your turn

At the start of each round, print who is in the arena on one line:

```output
In the arena: Ada  -  Server - RoundSystem:70
```

With two players it would say `In the arena: Ada, Bo`. Put it in `playRound`,
just after the players are sent in. Your line number may be different.

```solution
-- in playRound, just after the sendIn loop
local names = {}
for player in pairs(alive) do
	table.insert(names, player.Name)
end
print(`In the arena: {table.concat(names, ", ")}`)
```

Looping over `alive` rather than `Players:GetPlayers()` means anyone who sat the
round out is left off the list.

```task=u12-turn
- Print the names of everyone in the arena when a round starts
- Reset just before a round and check your name is left off
```

> **Recap**
> - `status` is a StringValue the server writes and every client can read.
> - `alive` is a dictionary of players, and `Died` takes a player out of it.
> - `endRound` gives wins, cuts the old connections and sends survivors home.

> **Done when** all checklists are ticked. The game has a heartbeat. Next: the
> thing that makes it a game, the lava.
</div>


<!-- ═══════════════════════════ 12.3 ═══════════════════════════ -->
<div id="md-12.3" hidden>
# Build 2: the rising lava

A round where nothing can hurt you is just a long wait. This build makes the
lava rise during every round and burn anyone it reaches. It goes in its own
module, **Lava**, so RoundSystem can just say *rise* and *reset* without knowing
how either is done.

```lua predict=p12-warm3
part.Touched:Connect(function(hit)
	print(hit.Parent.Name)
end)
```

## The Lava module

Add a **ModuleScript** to ServerScriptService and name it **Lava**:

```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage.Config)

local lava = workspace:WaitForChild("Arena"):WaitForChild("Lava")
local START_CFRAME = lava.CFrame -- where the lava sleeps between rounds

local Lava = {}

local tween = nil -- the rise playing right now, if there is one

-- touching the lava is the end of you
lava.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player then
		return
	end
	local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
	if humanoid and humanoid.Health > 0 then
		humanoid.Health = 0
	end
end)

-- put the lava back under the floor, and stop it if it is moving
function Lava.reset()
	if tween then
		tween:Cancel() -- @n stops the rise that is playing right now
		tween = nil
	end
	lava.CFrame = START_CFRAME -- @n puts the lava back at the spot saved when the module loaded
end

-- start the lava climbing, steadily, for the whole round
function Lava.rise()
	Lava.reset()
	local info = TweenInfo.new(Config.ROUND_TIME, Enum.EasingStyle.Linear)
	local goal = { CFrame = START_CFRAME + Vector3.new(0, Config.LAVA_RISE, 0) }
	tween = TweenService:Create(lava, info, goal)
	tween:Play()
end

-- the height of the top of the lava right now
function Lava.top()
	return lava.Position.Y + lava.Size.Y / 2 -- @n the middle height plus half the height is the top surface
end

return Lava
```

The pieces:

- **`START_CFRAME`** is read once, when the module first loads, while the lava is
  still asleep under the floor. Every reset goes back to exactly that spot.
- **`Lava.rise`** is a tween from the world unit. It moves the lava up by
  `LAVA_RISE` studs over `ROUND_TIME` seconds. **Linear** easing means the same
  speed the whole way, with no slow start, so the lava is predictable and fair.
- **`Lava.reset`** cancels the tween if one is playing, then snaps the lava home.
- **The `Touched` connection** finds the player from the part that touched it, from the
  events unit, and sets their Health to 0. The lava has `CanCollide` off, so it
  passes through the platforms but still fires `Touched`.
- **`Lava.top`** works out where the lava's surface is. A part's position is its
  middle, so the top is half its height above that. RoundSystem uses it in a
  moment.

```lua predict=p12-tween
Lava.rise()
print("The countdown starts now")
```

> **Key idea** The Lava module hides how the lava works, so RoundSystem only has to say `rise`, `reset` and `top`.

## RoundSystem, second version

Replace everything in **RoundSystem** with this. It is the first version plus
three changes, each marked with a comment: it requires Lava, `playRound` starts
the lava and checks heights, and `endRound` resets it.

```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")

local Config = require(ReplicatedStorage.Config)
local Lava = require(ServerScriptService.Lava) -- new
local PlayerData = require(ServerScriptService.PlayerData)

local arenaSpawn = workspace:WaitForChild("Arena"):WaitForChild("ArenaSpawn")

-- the line of text every player can read, made here so the server owns it
local status = Instance.new("StringValue")
status.Name = "Status"
status.Value = "Starting up"
status.Parent = ReplicatedStorage

local alive = {}       -- [player] = true while they are still in the round
local connections = {} -- the Died connections, disconnected after each round

Players.PlayerRemoving:Connect(function(player)
	alive[player] = nil
end)

local function countAlive()
	local count = 0
	for _ in pairs(alive) do
		count += 1
	end
	return count
end

local function waitForPlayers()
	while #Players:GetPlayers() &lt; Config.MIN_PLAYERS do
		status.Value = `Waiting for {Config.MIN_PLAYERS} players`
		task.wait(1)
	end
end

local function intermission()
	for seconds = Config.INTERMISSION, 1, -1 do
		status.Value = `Next round in {seconds}`
		task.wait(1)
	end
end

local function sendIn(player)
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health &lt;= 0 then
		return -- no living character right now, so they sit this round out
	end

	local offset = Vector3.new(math.random(-10, 10), 4, math.random(-10, 10))
	character:PivotTo(arenaSpawn.CFrame + offset)
	alive[player] = true

	local connection = humanoid.Died:Connect(function()
		alive[player] = nil
	end)
	table.insert(connections, connection)
end

-- new: Touched can miss someone the lava slides past, so check heights too
local function burnAnyoneBelowLava()
	local top = Lava.top() -- @n asks the Lava module how high the surface is right now
	for player in pairs(alive) do
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if root and humanoid and root.Position.Y &lt; top then
			humanoid.Health = 0
		end
	end
end

local function playRound()
	for _, player in ipairs(Players:GetPlayers()) do
		sendIn(player)
	end
	print(`Round started with {countAlive()} players`)

	Lava.rise() -- new
	for seconds = Config.ROUND_TIME, 1, -1 do
		if countAlive() == 0 then
			break -- everyone is out, so end early
		end
		status.Value = `Survive! {seconds}`
		task.wait(1)
		burnAnyoneBelowLava() -- new
	end
end

local function endRound()
	local winners = {}
	for player in pairs(alive) do
		table.insert(winners, player.Name)
		PlayerData.add(player, "Wins", 1)
	end

	if #winners == 0 then
		status.Value = "Nobody survived"
	else
		status.Value = `Survivors: {table.concat(winners, ", ")}`
	end
	print(status.Value)

	-- tidy up, so the next round starts clean
	for _, connection in ipairs(connections) do
		connection:Disconnect()
	end
	connections = {}

	-- survivors go back to the lobby
	for player in pairs(alive) do
		player:LoadCharacter()
	end
	alive = {}

	Lava.reset() -- new
end

while true do
	waitForPlayers()
	intermission()
	playRound()
	endRound()
	task.wait(Config.END_PAUSE)
end
```

Press Play. When you land on the pad, the floor starts to glow, and about ten
seconds later the lava breaks through it. Climb.

```output
Round started with 1 players  -  Server - RoundSystem:80
Nobody survived  -  Server - RoundSystem:105
```

That is the Output if the lava catches you. Climb all twenty platforms and it
says `Survivors:` with your name instead.

```task=u12-lava
- Add the **Lava** module and replace RoundSystem with the second version
- Play a round and stand still on the floor until the lava gets you
- See `Nobody survived` and the round end early
```

> **Key idea** `playRound` starts the lava and checks heights every second, and `endRound` puts the lava back.

## Why check twice

The lava already kills on `Touched`. So why does `burnAnyoneBelowLava` check
everyone's height once a second as well?

Because `Touched` is reported by the physics engine, and a part moved by a tween
is not really *crashing into* anything. Most of the time the touch is noticed.
Now and then, especially when a player is standing perfectly still, it can be
missed, and a player would stand happily inside the lava. The height check is
the safety net: if the middle of your character, the **HumanoidRootPart**, is
under the lava's surface, you are out. Checking a thing two ways is normal when
fairness matters.

> **Key idea** `Touched` can miss a player the lava slides past, so a height check once a second is the safety net.

## The climb

Now play it properly. Run to the first platform, jump, and keep going round the
spiral. The lava's top starts at y `-10` and ends at `58`, rising a little over
a stud every second. The platforms rise 3 studs each, so you have about two and
a half seconds per jump. Standing still is not an option.

```task=u12-climb
- Play a round and climb as fast as you can
- Reach platform 19 or 20 and stay there until the time runs out
- See your name in `Survivors:` and **Wins** go up by one
```

## Fix the bug

Here is an earlier version of `Lava.rise`, from before it called `Lava.reset`.
The author also forgot the `Lava.reset()` at the end of `endRound`:

```lua
function Lava.rise()
	local info = TweenInfo.new(Config.ROUND_TIME, Enum.EasingStyle.Linear)
	local goal = { CFrame = lava.CFrame + Vector3.new(0, Config.LAVA_RISE, 0) }
	tween = TweenService:Create(lava, info, goal)
	tween:Play()
end
```

The first round is perfect. In the second round, everyone dies the moment they
land on the pad, and the lava climbs right out of the top of the arena. Work out
why before you look.

```solution
function Lava.rise()
	Lava.reset() -- start every rise from the bottom
	local info = TweenInfo.new(Config.ROUND_TIME, Enum.EasingStyle.Linear)
	local goal = { CFrame = START_CFRAME + Vector3.new(0, Config.LAVA_RISE, 0) }
	tween = TweenService:Create(lava, info, goal)
	tween:Play()
end
```

`lava.CFrame` means *wherever the lava is right now*. After round one, that is
the top. So round two starts with the lava already above the floor, and then
climbs another 68 studs from there.

The fix is to never trust what the last round left behind. `Lava.rise` resets
first and always works from `START_CFRAME`. This is the most common kind of bug
in round-based games: **something from the last round leaks into the next
one**. Anything a round changes, the next round should set back itself.

```task=u12-fix2
- Paste the broken `Lava.rise` and remove the `Lava.reset()` from `endRound`
- Play two rounds and see the second one go wrong
- Put the real versions back and play two rounds again
```

> **Key idea** Start every round from a known state, because anything left from the last round leaks into the next one.

## Your turn

Make the last ten seconds feel urgent. In the round's countdown, when there are
`10` seconds or fewer left, the status should say `Hurry! 9` instead of
`Survive! 9`. Watch it in **Status** in ReplicatedStorage while you play.

```solution
-- in playRound, replacing the status.Value line in the countdown
if seconds &lt;= 10 then
	status.Value = `Hurry! {seconds}`
else
	status.Value = `Survive! {seconds}`
end
```

```task=u12-turn2
- Make the status say `Hurry!` for the last ten seconds
- Play a round and watch **Status** switch over
- Keep it: the next lesson's script includes it
```

> **Recap**
> - Lava is a module with `rise`, `reset` and `top`.
> - The lava kills on `Touched` and again with a height check.
> - `Lava.rise` resets first, so nothing from the last round leaks in.

> **Done when** all checklists are ticked. Lava Rise is a whole game now. All it
> needs is a way for players to see what is going on.
</div>


<!-- ═══════════════════════════ 12.4 ═══════════════════════════ -->
<div id="md-12.4" hidden>
# Build 3: the status GUI

Right now the only way to know what is happening is to stare at ReplicatedStorage
in Explorer. Players cannot do that. This build puts the status at the top of
everyone's screen, turns it orange while a round is on, and shows a big banner
with the result at the end.

It is the whole client and server unit in one place: the server decides, and the
client shows.

```lua predict=p12-warm4
-- in a Script on the server
local Players = game:GetService("Players")
print(Players.LocalPlayer)
```

## Build the screen

Make the GUI by hand, the way you did in the client and server unit. Do this
while **not** playing:

```task=u12-gui
- In **StarterGui**, add a **ScreenGui** and name it **RoundGui**. Leave its other properties alone for now
- Inside RoundGui, add a **TextLabel** named **StatusLabel**. Set Size to `0.4, 0, 0, 50`, Position to `0.3, 0, 0, 10`, BackgroundTransparency to `0.4`, tick **TextScaled**, and clear its Text
- Add a second **TextLabel** to RoundGui, named **Banner**. Set Size to `0.6, 0, 0, 90`, Position to `0.2, 0, 0.3, 0`, BackgroundTransparency to `1`, tick **TextScaled**, set TextColor3 to `255, 210, 80`, and untick **Visible**
- Add a **LocalScript** inside RoundGui and name it **RoundClient**
```

You type a Size as four numbers: X scale, X offset, Y scale, Y offset. So
`0.4, 0, 0, 50` means *40% of the screen wide, 50 pixels tall*, from the GUI
lesson.

## RoundSystem, final version

The server needs to tell clients two more things: **whether a round is on**, and
**how it ended**. Replace everything in **RoundSystem** one last time. The
changes from the second version are marked with comments, and it includes the
`Hurry!` from your turn last lesson.

```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")

local Config = require(ReplicatedStorage.Config)
local Lava = require(ServerScriptService.Lava)
local PlayerData = require(ServerScriptService.PlayerData)

local arenaSpawn = workspace:WaitForChild("Arena"):WaitForChild("ArenaSpawn")

-- the line of text every player can read, made here so the server owns it
local status = Instance.new("StringValue")
status.Name = "Status"
status.Value = "Starting up"
status:SetAttribute("InRound", false) -- new: lets clients colour the status
status.Parent = ReplicatedStorage

-- new: tells every client how the round ended, so they can show a banner
local roundEnded = Instance.new("RemoteEvent")
roundEnded.Name = "RoundEnded"
roundEnded.Parent = ReplicatedStorage

local alive = {}       -- [player] = true while they are still in the round
local connections = {} -- the Died connections, disconnected after each round

Players.PlayerRemoving:Connect(function(player)
	alive[player] = nil
end)

local function countAlive()
	local count = 0
	for _ in pairs(alive) do
		count += 1
	end
	return count
end

local function waitForPlayers()
	while #Players:GetPlayers() &lt; Config.MIN_PLAYERS do
		status.Value = `Waiting for {Config.MIN_PLAYERS} players`
		task.wait(1)
	end
end

local function intermission()
	for seconds = Config.INTERMISSION, 1, -1 do
		status.Value = `Next round in {seconds}`
		task.wait(1)
	end
end

local function sendIn(player)
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health &lt;= 0 then
		return -- no living character right now, so they sit this round out
	end

	local offset = Vector3.new(math.random(-10, 10), 4, math.random(-10, 10))
	character:PivotTo(arenaSpawn.CFrame + offset)
	alive[player] = true

	local connection = humanoid.Died:Connect(function()
		alive[player] = nil
	end)
	table.insert(connections, connection)
end

-- Touched can miss someone the lava slides past, so check heights too
local function burnAnyoneBelowLava()
	local top = Lava.top()
	for player in pairs(alive) do
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if root and humanoid and root.Position.Y &lt; top then
			humanoid.Health = 0
		end
	end
end

local function playRound()
	for _, player in ipairs(Players:GetPlayers()) do
		sendIn(player)
	end
	print(`Round started with {countAlive()} players`)
	status:SetAttribute("InRound", true) -- new

	Lava.rise()
	for seconds = Config.ROUND_TIME, 1, -1 do
		if countAlive() == 0 then
			break -- everyone is out, so end early
		end
		if seconds &lt;= 10 then
			status.Value = `Hurry! {seconds}`
		else
			status.Value = `Survive! {seconds}`
		end
		task.wait(1)
		burnAnyoneBelowLava()
	end
end

local function endRound()
	local winners = {}
	for player in pairs(alive) do
		table.insert(winners, player.Name)
		PlayerData.add(player, "Wins", 1)
	end

	if #winners == 0 then
		status.Value = "Nobody survived"
	else
		status.Value = `Survivors: {table.concat(winners, ", ")}`
	end
	print(status.Value)
	status:SetAttribute("InRound", false) -- new
	roundEnded:FireAllClients(status.Value) -- new

	-- tidy up, so the next round starts clean
	for _, connection in ipairs(connections) do
		connection:Disconnect()
	end
	connections = {}

	-- survivors go back to the lobby
	for player in pairs(alive) do
		player:LoadCharacter()
	end
	alive = {}

	Lava.reset()
end

while true do
	waitForPlayers()
	intermission()
	playRound()
	endRound()
	task.wait(Config.END_PAUSE)
end
```

The two new things:

- **An attribute on Status.** `InRound` is `true` during a round and `false`
  the rest of the time. Attributes copy to clients along with the Instance,
  just like its Value. Clients use it to choose a colour.
- **`roundEnded:FireAllClients(message)`** is `FireClient` for everyone at once.
  It sends the result to every player so each one can show the banner.

> **Key idea** The server tells clients about the round with an attribute on Status and a RemoteEvent for the result.

## The client

Open the **RoundClient** LocalScript you made inside RoundGui, and paste this:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage:WaitForChild("Config"))
local status = ReplicatedStorage:WaitForChild("Status")
local roundEnded = ReplicatedStorage:WaitForChild("RoundEnded")

local gui = script.Parent
local statusLabel = gui:WaitForChild("StatusLabel")
local banner = gui:WaitForChild("Banner")

local CALM = Color3.fromRGB(235, 235, 255)
local DANGER = Color3.fromRGB(255, 120, 60)

-- copy the server's text, and go orange while a round is on
local function showStatus()
	statusLabel.Text = status.Value
	if status:GetAttribute("InRound") then
		statusLabel.TextColor3 = DANGER
	else
		statusLabel.TextColor3 = CALM
	end
end

status.Changed:Connect(showStatus)
status:GetAttributeChangedSignal("InRound"):Connect(showStatus) -- @n fires when the InRound attribute changes, not only Value
showStatus()

-- the big banner at the end of a round
roundEnded.OnClientEvent:Connect(function(message)
	banner.Text = message
	banner.TextTransparency = 1 -- @n start invisible, so the tween can fade it in
	banner.Visible = true
	TweenService:Create(banner, TweenInfo.new(0.5), { TextTransparency = 0 }):Play()

	task.wait(Config.END_PAUSE - 1) -- @n keeps the banner up while the server waits, less one second
	banner.Visible = false
end)

print("Round GUI ready")
```

```output
Round GUI ready  -  Client - RoundClient:40
```

Notice the tag says **Client**. This script runs on your computer, not the
server's.

- It **never decides anything.** It reads `Status` and shows it. If a player
  hacked this script to say *You win!*, only their own screen would change. The
  server's `alive` table would not care.
- **`status.Changed`** fires whenever the server changes the Value.
- **`showStatus()`** is also called once straight away, so a player who joins
  in the middle of a round sees the right text without waiting for the next
  change.
- It requires **Config** too. ReplicatedStorage modules work on both sides, so
  the banner stays up for exactly as long as the server waits.

```task=u12-client
- Paste the final RoundSystem and the RoundClient LocalScript
- Press Play: the countdown is at the top of the screen
- Watch it turn orange when the round starts, and see `Hurry!` at the end
```

> **Key idea** The client only reads and shows. It never decides anything.

## Fix the bug

Play two rounds: one where the lava gets you, one where you survive. When you
lose, the banner fades in and stays for four seconds. When you **win**, it
flashes for an instant and is gone. And Output shows `Round GUI ready` a second
time, right then.

```lua predict=p12-reset
-- in endRound, straight after the banner is sent
for player in pairs(alive) do
	player:LoadCharacter()
end
```

The clue is that second `Round GUI ready`. Something made the LocalScript start
again from the top.

```solution
-- not a code change: a property.
-- Click RoundGui in StarterGui and untick ResetOnSpawn.
```

A ScreenGui has a property called **ResetOnSpawn**, and it is ticked by default.
Every time your character spawns, Roblox throws away your copy of the GUI and
makes a fresh one from StarterGui, scripts and all. Winners get
`LoadCharacter()` a split second after the banner arrives, so their GUI is
replaced, banner and all. Losers are not respawned by `endRound` at all. Roblox
respawns them on its own timer, about five seconds after they died, by which
time the banner has mostly done its job.

A game-wide GUI like this one should live for the whole visit, so untick
**ResetOnSpawn**. Keep it ticked for GUIs that really belong to one life, like a
health bar.

```task=u12-fix3
- Survive a round and see the banner vanish and `Round GUI ready` print again
- Untick **ResetOnSpawn** on RoundGui
- Survive again and see the banner stay
```

> **Key idea** ResetOnSpawn replaces a ScreenGui, scripts and all, each time your character spawns, so untick it for a GUI that should last.

## Your turn

Show how many players are left during a round, like this:

```text
Survive! 42 · 3 left
```

This is a **server** change: the server is the only one that knows who is
alive. Change the two lines in `playRound` that set the countdown text.

```solution
-- in playRound's countdown
if seconds &lt;= 10 then
	status.Value = `Hurry! {seconds} · {countAlive()} left`
else
	status.Value = `Survive! {seconds} · {countAlive()} left`
end
```

You did not touch the client at all. It just shows whatever text it is given,
which is exactly the split you want.

```task=u12-turn3
- Add the number of players left to the countdown
- Play and check the status line shows `1 left`
- Reset yourself and watch the round end
```

> **Recap**
> - The server decides and sets `Status`; the client only shows it.
> - `FireAllClients` sends the round result to every player.
> - Untick ResetOnSpawn for a GUI that should last the whole visit.

> **Done when** all checklists are ticked. Lava Rise is finished. The last lesson
> is about getting it to other people, and about what to do next.
</div>


<!-- ═══════════════════════════ 12.5 ═══════════════════════════ -->
<div id="md-12.5" hidden>
# Ship it and keep going

The game works on your computer. This lesson is about everything between that
and other people playing it: testing with more than one player, finding bugs
quickly, using the official docs, and publishing. Then, what to learn next.

```lua predict=p12-warm5
local data = PlayerData.load(player)
if not data then
	player:Kick("Your data could not load. Please rejoin.")
	return
end
```

## Test with two players

A game for many players has to be tested with many players. Studio can pretend.

```task=u12-test
- In Config, set `MIN_PLAYERS` to `2`
- On the **Test** tab, find **Clients and Servers**, choose **2** players and press **Start**
- Studio opens a server window and two player windows. Play a round with both
- When you are done, press **Cleanup** (or Stop) on the Test tab to close them all
```

With two players you can finally test the things one player never could: one
dies and one survives, the status says `1 left`, both screens show the same
banner. The test players are called **Player1** and **Player2**, and each one
gets its own save.

## A debugging method

Every developer writes bugs. The good ones find them fast because they follow
the same steps every time instead of guessing.

1. **Read the first red line.** Later errors are often caused by the first one.
   Click it and Studio jumps to the line.
2. **Read it left to right**: which script, which line, what went wrong.
3. **Make it happen again.** A bug you can repeat is half fixed.
4. **Print what the script believes.** Just above the broken line, print the
   values it is using. The bug is wherever what you *think* is in a variable is
   not what is really in it.
5. **Change one thing, then test.** Change three things at once and you will
   not know which one mattered.

Studio can also stop a script mid-run so you can look around. Click just to the
**left of a line number** and a red dot appears: a **breakpoint**. Press Play.
When the script reaches that line it freezes, and you can hover over any variable
to see its value. **Step Over** in the toolbar runs one line at a time.
**Resume** lets it carry on. Click the dot again to remove it.

```lua predict=p12-first
local function describe(part)
	return part.Name .. " is " .. part.BrickColor.Name
end

local lava = workspace:FindFirstChild("Lavaa")
print(describe(lava))
```

> **Key idea** Read the first red line, make the bug repeat, print what the script believes, and change one thing at a time.

## Fix the bugs: a drill

Put this in a new Script in ServerScriptService, next to your game. It is meant
to give every player one free win three seconds after they join. It has **three**
bugs, and Studio will only show you one at a time. Use the method: run it, read
the first red line, fix that one thing, run it again.

```lua
local Players = game:GetService("Players")

local function giveWin(player)
	local wins = player.leaderstats.wins
	wins.Value = wins + 1
	print(`{player.Name} has {wins.Value} wins`) -- @n backticks and braces put values into the text
end

Players.PlayerAdded:Connect(function(player) -- @n runs once for every player who joins
	task.wait(3) -- @n pauses only this handler; the rest of the game carries on
	giveWin(player.Name)
end)
```

The first one looks like this:

```output
! ServerScriptService.Script:4: attempt to index nil with 'wins'  -  Server - Script:4
```

```solution
local Players = game:GetService("Players")

local function giveWin(player)
	local wins = player.leaderstats.Wins   -- 2: the IntValue is called Wins
	wins.Value = wins.Value + 1            -- 3: maths on the Value, not the IntValue
	print(`{player.Name} has {wins.Value} wins`)
end

Players.PlayerAdded:Connect(function(player)
	task.wait(3)
	giveWin(player)                        -- 1: the player, not their name
end)
```

The three errors, in the order you meet them:

1. *attempt to index nil with 'wins'*. Line 4 says `player.leaderstats`, so
   `player` must be wrong. Print it and you get a name, a string, not a Player.
   A string has no `leaderstats`, so that gives `nil`. The real mistake is on
   line 11: `player.Name` should be `player`.
2. *wins is not a valid member of Folder "Players.Ada.leaderstats"*. Capitals
   count. The value is called `Wins`.
3. *attempt to perform arithmetic (add) on Instance and number*. `wins` is the
   IntValue itself. The number is in `wins.Value`.

Notice that the first error was on line 4 but the bug was on line 11. That is
step 4 of the method: the line that breaks is where the bad value is *used*, not
always where it was *made*.

One last lesson in this drill: the win it gives is not saved, because it went
straight to the IntValue and never through `PlayerData.add`. The leaderboard
only **shows** the data. When you are done, delete this Script.

```task=u12-debug
- Paste the drill script and fix the three bugs one at a time
- Put a breakpoint on the `wins.Value` line, play, and hover over `wins` when it stops
- Delete the drill script when you are done
```

> **Key idea** The line that breaks is where a bad value is used, not always where it was made.

## Reading the docs

Nobody remembers every property of every class. Developers look things up all
day, and the place to look is the **Creator Hub** documentation at
**create.roblox.com/docs**. Search for any class, like `TweenInfo`, `Humanoid` or
`ProximityPrompt`, and its page lists:

- **Properties**: what it has, like `Health` or `WalkSpeed`
- **Methods**: what it can do, the ones you call with a colon
- **Events**: what it can tell you, the ones you `:Connect` to
- **Code samples** you can paste into Studio and run

Read the short description at the top of each property first. Most of the time
that one sentence is all you need.

> **Key idea** The Creator Hub page for a class lists its properties, methods, events and code samples.

## Your turn

Using only the docs, make the lava's colour slowly **pulse** between two
oranges, forever, from a Script of its own.

Look up **TweenInfo.new** on the Creator Hub. Two of its arguments, after the
time, easing style and easing direction, are a **repeat count** and whether the
tween **reverses**. The docs say what number means *repeat for ever*.

```solution
local TweenService = game:GetService("TweenService")

local lava = workspace:WaitForChild("Arena"):WaitForChild("Lava")

-- 1 second, smooth, repeat for ever (-1), and play backwards each time (true)
local info = TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
local goal = { Color = Color3.fromRGB(255, 170, 40) }

TweenService:Create(lava, info, goal):Play()
```

Two tweens on the same part at once is fine as long as they change different
properties. The rise moves `CFrame`, the pulse changes `Color`.

```task=u12-docs
- Find the **TweenInfo.new** page and read about its arguments
- Make the lava pulse forever from its own Script
- Find one more property on the **Humanoid** page you have never used, and try it
```

## Publish it

```task=u12-ship
- Set `MIN_PLAYERS` to `2` in Config, so a round needs real company
- Go through the polish list below and do at least one
- **File → Publish to Roblox** to update the published game
- In Game Settings → **Permissions**, make the game **Public**. Roblox may ask you to fill in a short questionnaire about the game first
- Send the link to a friend and play a round together
```

A polish list. Each one is a short job using a unit you know:

- a **Sound** that plays when the lava starts to rise (the world unit)
- a sign in the lobby with the rules on a SurfaceGui (the GUI lesson)
- give survivors coins too, and add the shop from the client and server unit
- a **Wins** requirement for a golden trail, using an attribute (the players unit)
- make the platforms shrink each round, from the Config (the world unit)

## What to learn next

You started this course not knowing what a variable was. You have now built and
published a multiplayer game with saving, a server that owns the rules and a
client that shows them. That is a real foundation. Some directions from here:

| next | what it is for |
|---|---|
| **types** and `--!strict` | the type notes from the variables unit, used everywhere, so Studio finds bugs before you press Play |
| **metatables and classes** | making many objects that share the same functions, like every enemy in a game |
| **RunService** | running code every frame, for smooth movement and cameras |
| **raycasting** | asking *what is in that direction?*: guns, line of sight, placing things |
| **animation** | making characters and models move with the Animation Editor |
| **the DevForum** | devforum.roblox.com, where Roblox developers ask and answer questions |

The best way to keep learning is the way you have been learning: pick something
small you want to exist, build it, and look up what you do not know. Predict
before you press Play. Break things on purpose. Read the first red line.

> **Recap**
> - Test with two players from the Test tab, since one player hides many bugs.
> - Debug in order: first red line, repeat it, print, change one thing.
> - Look things up in the Creator Hub docs instead of guessing.

> **Done when** all checklists are ticked, and that is the whole course. Every
> script you wrote ran in your own Studio, and every one of them was yours. Go
> and build the next thing.
</div>


<!-- ═══════════════════════════ cheat-12 ═══════════════════════════ -->
<div id="md-cheat-12" hidden>
# Lava Rise: the full code

Every script in the finished game, and where each one goes. Use it to check
your own copy, or to start again from a clean slate.

## Where everything lives

| name | type | where |
|---|---|---|
| **Arena** | Model (built once with the Command Bar) | Workspace |
| **Config** | ModuleScript | ReplicatedStorage |
| **PlayerData** | ModuleScript | ServerScriptService |
| **Data** | Script | ServerScriptService |
| **Lava** | ModuleScript | ServerScriptService |
| **RoundSystem** | Script | ServerScriptService |
| **RoundGui** | ScreenGui, **ResetOnSpawn off** | StarterGui |
| **StatusLabel**, **Banner** | TextLabels | inside RoundGui |
| **RoundClient** | LocalScript | inside RoundGui |
| **Status**, **RoundEnded** | made by RoundSystem while playing | ReplicatedStorage |

Saving needs a **published** place and **Enable Studio Access to API Services**
switched on.

## Config

```lua
local Config = {}

Config.MIN_PLAYERS = 1   -- set this to 2 once other people can join
Config.INTERMISSION = 10 -- seconds of countdown in the lobby
Config.ROUND_TIME = 60   -- seconds a round lasts
Config.LAVA_RISE = 68    -- studs the lava climbs in one round
Config.END_PAUSE = 5     -- seconds the result stays up

return Config
```

## PlayerData

```lua
local DataStoreService = game:GetService("DataStoreService")

local store = DataStoreService:GetDataStore("LavaRise_v1")

-- every stat a player has, and what a brand new player starts with
local DEFAULTS = {
	Wins = 0,
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
	data[stat] += amount

	-- keep the leaderboard showing the same number
	local leaderstats = player:FindFirstChild("leaderstats")
	local value = leaderstats and leaderstats:FindFirstChild(stat)
	if value then
		value.Value = data[stat]
	end
end

return PlayerData
```

## Data

```lua
local Players = game:GetService("Players")
local ServerScriptService = game:GetService("ServerScriptService")

local PlayerData = require(ServerScriptService.PlayerData)

local AUTOSAVE_EVERY = 60 -- seconds

local function onPlayerAdded(player)
	local data = PlayerData.load(player)
	if not data then
		player:Kick("Your data could not load. Please rejoin.")
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

	print(`{player.Name} loaded with {data.Wins} wins`)
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

## Lava

```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage.Config)

local lava = workspace:WaitForChild("Arena"):WaitForChild("Lava")
local START_CFRAME = lava.CFrame -- where the lava sleeps between rounds

local Lava = {}

local tween = nil -- the rise playing right now, if there is one

-- touching the lava is the end of you
lava.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player then
		return
	end
	local humanoid = player.Character:FindFirstChildOfClass("Humanoid")
	if humanoid and humanoid.Health > 0 then
		humanoid.Health = 0
	end
end)

-- put the lava back under the floor, and stop it if it is moving
function Lava.reset()
	if tween then
		tween:Cancel()
		tween = nil
	end
	lava.CFrame = START_CFRAME
end

-- start the lava climbing, steadily, for the whole round
function Lava.rise()
	Lava.reset()
	local info = TweenInfo.new(Config.ROUND_TIME, Enum.EasingStyle.Linear)
	local goal = { CFrame = START_CFRAME + Vector3.new(0, Config.LAVA_RISE, 0) }
	tween = TweenService:Create(lava, info, goal)
	tween:Play()
end

-- the height of the top of the lava right now
function Lava.top()
	return lava.Position.Y + lava.Size.Y / 2
end

return Lava
```

## RoundSystem

```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerScriptService = game:GetService("ServerScriptService")

local Config = require(ReplicatedStorage.Config)
local Lava = require(ServerScriptService.Lava)
local PlayerData = require(ServerScriptService.PlayerData)

local arenaSpawn = workspace:WaitForChild("Arena"):WaitForChild("ArenaSpawn")

-- the line of text every player can read, made here so the server owns it
local status = Instance.new("StringValue")
status.Name = "Status"
status.Value = "Starting up"
status:SetAttribute("InRound", false)
status.Parent = ReplicatedStorage

-- tells every client how the round ended, so they can show a banner
local roundEnded = Instance.new("RemoteEvent")
roundEnded.Name = "RoundEnded"
roundEnded.Parent = ReplicatedStorage

local alive = {}       -- [player] = true while they are still in the round
local connections = {} -- the Died connections, disconnected after each round

Players.PlayerRemoving:Connect(function(player)
	alive[player] = nil
end)

local function countAlive()
	local count = 0
	for _ in pairs(alive) do
		count += 1
	end
	return count
end

local function waitForPlayers()
	while #Players:GetPlayers() &lt; Config.MIN_PLAYERS do
		status.Value = `Waiting for {Config.MIN_PLAYERS} players`
		task.wait(1)
	end
end

local function intermission()
	for seconds = Config.INTERMISSION, 1, -1 do
		status.Value = `Next round in {seconds}`
		task.wait(1)
	end
end

local function sendIn(player)
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health &lt;= 0 then
		return -- no living character right now, so they sit this round out
	end

	local offset = Vector3.new(math.random(-10, 10), 4, math.random(-10, 10))
	character:PivotTo(arenaSpawn.CFrame + offset)
	alive[player] = true

	local connection = humanoid.Died:Connect(function()
		alive[player] = nil
	end)
	table.insert(connections, connection)
end

-- Touched can miss someone the lava slides past, so check heights too
local function burnAnyoneBelowLava()
	local top = Lava.top()
	for player in pairs(alive) do
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if root and humanoid and root.Position.Y &lt; top then
			humanoid.Health = 0
		end
	end
end

local function playRound()
	for _, player in ipairs(Players:GetPlayers()) do
		sendIn(player)
	end
	print(`Round started with {countAlive()} players`)
	status:SetAttribute("InRound", true)

	Lava.rise()
	for seconds = Config.ROUND_TIME, 1, -1 do
		if countAlive() == 0 then
			break -- everyone is out, so end early
		end
		if seconds &lt;= 10 then
			status.Value = `Hurry! {seconds}`
		else
			status.Value = `Survive! {seconds}`
		end
		task.wait(1)
		burnAnyoneBelowLava()
	end
end

local function endRound()
	local winners = {}
	for player in pairs(alive) do
		table.insert(winners, player.Name)
		PlayerData.add(player, "Wins", 1)
	end

	if #winners == 0 then
		status.Value = "Nobody survived"
	else
		status.Value = `Survivors: {table.concat(winners, ", ")}`
	end
	print(status.Value)
	status:SetAttribute("InRound", false)
	roundEnded:FireAllClients(status.Value)

	-- tidy up, so the next round starts clean
	for _, connection in ipairs(connections) do
		connection:Disconnect()
	end
	connections = {}

	-- survivors go back to the lobby
	for player in pairs(alive) do
		player:LoadCharacter()
	end
	alive = {}

	Lava.reset()
end

while true do
	waitForPlayers()
	intermission()
	playRound()
	endRound()
	task.wait(Config.END_PAUSE)
end
```

## RoundClient

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Config = require(ReplicatedStorage:WaitForChild("Config"))
local status = ReplicatedStorage:WaitForChild("Status")
local roundEnded = ReplicatedStorage:WaitForChild("RoundEnded")

local gui = script.Parent
local statusLabel = gui:WaitForChild("StatusLabel")
local banner = gui:WaitForChild("Banner")

local CALM = Color3.fromRGB(235, 235, 255)
local DANGER = Color3.fromRGB(255, 120, 60)

-- copy the server's text, and go orange while a round is on
local function showStatus()
	statusLabel.Text = status.Value
	if status:GetAttribute("InRound") then
		statusLabel.TextColor3 = DANGER
	else
		statusLabel.TextColor3 = CALM
	end
end

status.Changed:Connect(showStatus)
status:GetAttributeChangedSignal("InRound"):Connect(showStatus)
showStatus()

-- the big banner at the end of a round
roundEnded.OnClientEvent:Connect(function(message)
	banner.Text = message
	banner.TextTransparency = 1
	banner.Visible = true
	TweenService:Create(banner, TweenInfo.new(0.5), { TextTransparency = 0 }):Play()

	task.wait(Config.END_PAUSE - 1)
	banner.Visible = false
end)

print("Round GUI ready")
```

## Messages you will see

| in Output | usually means |
|---|---|
| kicked with *Your data could not load* | API access is off, or the place is not published |
| *Arena is not a valid member of Workspace* | the arena was not built, or was renamed. Run the Command Bar script |
| *Infinite yield possible on ... WaitForChild("Status")* | RoundSystem is not running, or has an error further up |
| nobody gets a win, ever | the lava rises above the top platform: check `LAVA_RISE` |
| the second round kills everyone at once | the lava was not reset between rounds |
| the banner vanishes for winners | **ResetOnSpawn** is still ticked on RoundGui |
| *Waiting for 2 players* for ever in Studio | set `MIN_PLAYERS` to 1, or test with 2 players |

## The rules

1. Plan the phases first. One phase, one function.
2. One script, one job. Settings live in Config.
3. The server decides. The client only shows.
4. Put a player in the `alive` set only when everything about them is true.
5. Disconnect what you connect, every round.
6. Every round sets back everything it changed.
7. Read the first red line, print what the script believes, change one thing.
</div>
