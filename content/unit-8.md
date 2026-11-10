<!-- ════════════════════════════════════════════════════════════════════
     UNIT 8 — EVENTS
     Same format as lessons.md. No raw less-than or ampersand anywhere:
     write &lt; and &amp; even inside code fences.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 8.1 ═══════════════════════════ -->
<div id="md-8.1" hidden>
# Events and Connect

```lua predict=p8-warm1
local thing = workspace:FindFirstChild("Dragon")
print(thing)
```

Every script so far has run from top to bottom and then finished. That is fine
for building a lamp post, but a game is mostly *waiting*. Waiting for a player to
step on a pad, to click a button, to join. The moment something happens, the
game reacts.

Roblox tells your script when something happens through an **event**. This
lesson is how to listen for one.

## A pad to step on

Build the pad by hand this time, and put the script **inside** it.

```task=u8-touch
- In Explorer, hover over **Workspace**, click **+**, choose **Part**
- Rename it `Pad`, tick **Anchored**, and make it flat and wide — about `8, 1, 8`
- Move it a little way in front of the SpawnLocation
- Hover over `Pad`, click **+**, choose **Script** — the script now sits inside the part
- Paste the script below into it, press Play, and walk onto the pad
```

```lua
local pad = script.Parent

pad.Touched:Connect(function(hit) -- @n Everything down to end) is the handler Roblox calls on each touch
	print(hit.Name, "touched the pad")
end)

print("Waiting for something to touch the pad")
```

```output
Waiting for something to touch the pad  -  Server - Script:7
LeftFoot touched the pad  -  Server - Script:4
RightFoot touched the pad  -  Server - Script:4
LeftLowerLeg touched the pad  -  Server - Script:4
RightFoot touched the pad  -  Server - Script:4
```

Your list will be different and probably much longer — that is normal, and the
next lesson is all about it.

`script` is a variable Roblox gives every script: it means *this script*. Its
Parent is whatever the script sits inside, so `script.Parent` is the pad. Putting
a script inside the part it controls is very common in Roblox, because then the
script never has to go looking for its part.

## Reading the Connect line

```lua
pad.Touched:Connect(function(hit)
	print(hit.Name, "touched the pad")
end)
```

- `pad.Touched` — the **event**: *something touched this part*. Every part has it.
- `:Connect(...)` — *when that happens, call this function*.
- `function(hit) ... end` — the function to call. It has no name; it is handed
  straight to `Connect`, the same way you handed functions to `task.delay` in
  unit 5.
- `hit` — what Roblox passes in: the part that did the touching.

The function does not run when the script reaches it. `Connect` only *stores* it,
and the script carries on to the next line. Roblox calls the function later —
every time the event happens, for as long as the game runs. A function used like
this is called a **handler**.

```lua predict=p8-first
local pad = script.Parent

pad.Touched:Connect(function(hit)
	print("touched!")
end)

print("ready")
```

The function can also have a name. This does exactly the same thing:

```lua
local pad = script.Parent

local function onTouched(hit)
	print(hit.Name, "touched the pad")
end

pad.Touched:Connect(onTouched)
```

Notice there are **no brackets** after `onTouched` on the last line. You are
handing over the function, not calling it.

> **Key idea** `Connect` does not run your function; it hands it to Roblox to call every time the event happens.

## Who touched it?

`hit` is a single body part — a foot, a leg. The player's whole body is a
**Model** called the **character**, and the foot is inside it. So `hit.Parent` is
the character. `Players:GetPlayerFromCharacter` turns a character into the
**Player** it belongs to, or gives `nil` if it is not anyone's character:

```lua
local Players = game:GetService("Players")

local pad = script.Parent

pad.Touched:Connect(function(hit)
	local character = hit.Parent
	local player = Players:GetPlayerFromCharacter(character) -- @n The Player for this character, or nil if it is not anyone's
	if player then
		print(player.Name, "stepped on the pad")
	else
		print(hit.Name, "is not part of a player")
	end
end)
```

```output
YourName stepped on the pad  -  Server - Script:9
YourName stepped on the pad  -  Server - Script:9
YourName stepped on the pad  -  Server - Script:9
```

You will see your own Roblox username where it says `YourName`.

That `if player then` matters more than it looks. Anything can touch a part: a
falling crate, a ball, the hat on your head. A hat is an **Accessory**, so when a
hat brushes the pad, `hit.Parent` is the hat, not the character, and
`GetPlayerFromCharacter` gives `nil`. Checking first means your script ignores
everything that is not a player instead of crashing on it.

Two anchored parts never fire `Touched` on each other — the pad does not notice
the Baseplate it is sitting on. Something has to actually move into it.

```task=u8-who
- Replace the pad script with the `GetPlayerFromCharacter` version
- Walk onto the pad and see your name in Output
- Add an unanchored Part by hand above the pad, press Play, and watch it fall on — you get the `is not part of a player` line
```

> **Key idea** `hit` is one body part, so ask `GetPlayerFromCharacter(hit.Parent)` and check for `nil` before you trust it.

## A lava brick

Every character has a **Humanoid** inside it: the object that makes it walk,
jump and have health. Unit 9 is all about it. For now you only need one fact —
setting its `Health` to `0` knocks the character out, and they respawn.

That is enough to make the most famous part in Roblox:

```lua
local pad = script.Parent
pad.Color = Color3.fromRGB(255, 80, 40)
pad.Material = Enum.Material.Neon

pad.Touched:Connect(function(hit)
	local humanoid = hit.Parent:FindFirstChild("Humanoid") -- @n nil when the toucher has no Humanoid, such as a hat
	if humanoid then
		humanoid.Health = 0
	end
end)
```

This version does not care *who* touched it, only whether the thing that touched
it has a Humanoid. Anything with a Humanoid — a player, or a zombie you make
later — is knocked out.

```task=u8-lava
- Turn your pad into lava with the script above
- Walk onto it and get knocked out, then respawn
- Make it smaller and put it in a gap you have to jump over
```

> **Key idea** To catch anything alive, look for a Humanoid in `hit.Parent` instead of asking who it is.

## Fix the bug

This was meant to print the name of whatever touches the pad. It stops with an
error the moment you press Play, before anyone touches anything:

```lua
local pad = script.Parent

local function onTouched(hit)
	print(hit.Name, "touched the pad")
end

pad.Touched:Connect(onTouched())
```

```output
! Workspace.Pad.Script:4: attempt to index nil with 'Name'  -  Server - Script:4
```

```solution
local pad = script.Parent

local function onTouched(hit)
	print(hit.Name, "touched the pad")
end

pad.Touched:Connect(onTouched)
```

`onTouched()` with brackets **calls** the function, right there, with nothing
passed in — so `hit` is `nil`, and `hit.Name` breaks on line 4. `Connect` wanted
the function itself, to call later. Without the brackets, that is what it gets.
Notice the error path, too: `Workspace.Pad.Script`, because the script lives
inside the pad.

> **Key idea** Pass `onTouched` with no brackets to hand the function over; with brackets you call it on the spot.

## Your turn

Make a **paint pad**. Every time a player steps on it, it changes to a random
colour and prints who painted it. Use `math.random(0, 255)` three times to make a
random `Color3.fromRGB`. The Output should look like this, many times over:

```output
YourName painted the pad  -  Server - Script:11
```

```solution
local Players = game:GetService("Players")

local pad = script.Parent

pad.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player then
		return
	end
	pad.Color = Color3.fromRGB(math.random(0, 255), math.random(0, 255), math.random(0, 255))
	print(player.Name, "painted the pad")
end)
```

The `if not player then return end` at the top is the same check as before, just
turned around: *if this is not a player, stop here*. It keeps the interesting part
of the function from being indented inside an `if`. You will see this shape in
almost every Touched handler ever written.

```task=u8-paint
- Write the paint pad yourself before opening the solution
- Step on it and watch it flicker through colours
- Notice how many lines arrive from one step — keep that in mind for the next lesson
```

> **Recap**
> - `event:Connect(fn)` stores `fn`, and Roblox calls it each time the event happens.
> - `hit` is a body part, and `hit.Parent` is the character.
> - `GetPlayerFromCharacter` gives `nil` for anything that is not a player.

> **Done when** all four checklists are ticked. The big idea: `event:Connect(fn)`
> does not run `fn` — it hands it to Roblox to run **every time** the event happens.
</div>


<!-- ═══════════════════════════ 8.2 ═══════════════════════════ -->
<div id="md-8.2" hidden>
# Debounce

```lua predict=p8-warm2
local open = false
open = not open
print(open)
```

You will have noticed by now: one step on a pad can fire `Touched` five, ten,
twenty times. Each foot counts. Each leg counts. Walking makes your feet touch,
lift and touch again. For a lava brick that does not matter — knocked out is
knocked out. For a pad that **gives a coin**, it is a disaster.

## Seeing the problem

```lua predict=p8-many
pad.Touched:Connect(function(hit)
	print("touch")
end)
```

Put this in your `Pad` and walk across it once, at normal speed:

```lua
local Players = game:GetService("Players")

local pad = script.Parent
local touches = 0

pad.Touched:Connect(function(hit)
	if Players:GetPlayerFromCharacter(hit.Parent) then
		touches += 1
		print("player touches so far:", touches)
	end
end)
```

```output
player touches so far: 1  -  Server - Script:9
player touches so far: 2  -  Server - Script:9
player touches so far: 3  -  Server - Script:9
player touches so far: 4  -  Server - Script:9
player touches so far: 5  -  Server - Script:9
player touches so far: 6  -  Server - Script:9
```

Your number will be different every time you try. That is the point — you cannot
count on it.

```task=u8-spam
- Walk across the pad once and count the lines
- Jump on it, then stand still on it — compare the counts
- Run across it diagonally and see if you get more
```

> **Key idea** One step fires `Touched` many times, so you cannot count on one call per touch.

## A cooldown flag

The fix is a **debounce**: a boolean that says *I am busy, ignore everything for
now*. Every handler call checks it first:

```lua
local Players = game:GetService("Players")

local pad = script.Parent
local COOLDOWN = 2
local ready = true

pad.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player or not ready then -- @n Leave if this is not a player, or if the pad is busy
		return
	end

	ready = false -- @n Closed straight away, before anything slow happens
	print(player.Name, "got a reward")
	task.wait(COOLDOWN) -- @n Only this copy of the handler waits; other touches carry on
	ready = true
end)
```

```output
YourName got a reward  -  Server - Script:14
```

One line, however you walk on. Stay on the pad and keep moving, and you get one
more line every two seconds.

The shape is always the same four steps:

1. **check** — if not ready, `return` and do nothing,
2. **close** — `ready = false`,
3. **do the thing**,
4. **wait, then open** — `task.wait(COOLDOWN)`, then `ready = true`.

Here is the part that is easy to miss. Each touch runs its **own copy** of the
handler, and they all run side by side. While one copy is sitting in
`task.wait(2)`, the other twenty touches are still arriving — and every one of
them hits `not ready` and leaves straight away. The wait does not block the
touches. The flag does.

`ready` has to live **outside** the function, at the top of the script, so every
copy of the handler sees the same one. Keep that in mind for the bug at the end
of the lesson.

```task=u8-flag
- Put the cooldown script in your pad and walk across it — one reward
- Stay on the pad and keep walking: one more reward every two seconds
- Turn the pad grey while it is cooling down, and back to green when it is ready
```

> **Key idea** A debounce is a flag the handler checks first, closes, then reopens after a wait.

## One cooldown each

One flag works for one player. Add a second player and it goes wrong: while
*you* are cooling down, the pad ignores *everyone*. The fix is to keep a
cooldown **per player** — and a dictionary is perfect for that:

```lua
local Players = game:GetService("Players")

local pad = script.Parent
local COOLDOWN = 3
local cooling = {}

pad.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player or cooling[player] then -- @n No entry for this player is nil, so they get through
		return
	end

	cooling[player] = true
	print(player.Name, "got a reward")
	task.wait(COOLDOWN)
	cooling[player] = nil
end)
```

Until now, every dictionary key you have used was a string. A key can be
anything — including a Player. `cooling[player]` means *the entry for this exact
player*. A player who is cooling down has `true` there; a player who is not has
nothing there, which is `nil`, which is falsy. Setting it back to `nil` removes
the entry completely, so the table never fills up.

To test with more than one player, use Studio's local test server:

```task=u8-two
- Open the **Test** tab at the top of Studio
- Find **Clients and Servers**, set the number of players to **2**, and press **Start**
- Three windows open: a Server, `Player1` and `Player2`
- Walk both players onto the pad, and read the **Server** window's Output
- Press **Cleanup** (or close the windows) when you are done
```

```output
Player1 got a reward  -  Server - Script:14
Player2 got a reward  -  Server - Script:14
```

Each player gets their own reward, on their own timer. In a test server the
players are always called `Player1`, `Player2` and so on.

> **Key idea** A table with the player as the key gives every player their own cooldown.

## Once per player, for ever

Sometimes the reward should only ever happen once — a secret badge, a first-visit
bonus. That is the same table, just never cleared:

```lua
local Players = game:GetService("Players")

local pad = script.Parent
local claimed = {}

pad.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player or claimed[player] then
		return
	end

	claimed[player] = true
	print(player.Name, "found the secret pad")
end)
```

## Fix the bug

This was meant to give one reward every two seconds. It still gives dozens:

```lua
local Players = game:GetService("Players")

local pad = script.Parent

pad.Touched:Connect(function(hit)
	local ready = true
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player or not ready then
		return
	end

	ready = false
	print(player.Name, "got a reward")
	task.wait(2)
	ready = true
end)
```

```output
YourName got a reward  -  Server - Script:13
YourName got a reward  -  Server - Script:13
YourName got a reward  -  Server - Script:13
YourName got a reward  -  Server - Script:13
```

```solution
local Players = game:GetService("Players")

local pad = script.Parent
local ready = true

pad.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player or not ready then
		return
	end

	ready = false
	print(player.Name, "got a reward")
	task.wait(2)
	ready = true
end)
```

`local ready = true` was **inside** the handler. Remember scope from unit 2: a
`local` lives inside its block. Every touch ran a fresh copy of the function, and
every copy made a brand new `ready` that started at `true`. Twenty touches, twenty
separate flags, none of them ever closed for anybody else. Moving it outside the
function gives all of them one shared flag.

```task=u8-fix
- Run the broken script and see the flood of rewards
- Move the `local ready = true` line above the `Connect`
- Run it again: one reward every two seconds
```

> **Key idea** Keep the flag outside the handler, or every touch gets its own fresh flag.

## Your turn

Make a **score pad**. Each player scores one point when they step on it — but no
more than once every three seconds each. Keep every player's score in a table,
and print the new score each time:

```output
YourName score: 1  -  Server - Script:16
YourName score: 2  -  Server - Script:16
YourName score: 3  -  Server - Script:16
```

```solution
local Players = game:GetService("Players")

local pad = script.Parent
local COOLDOWN = 3
local scores = {}
local cooling = {}

pad.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player or cooling[player] then
		return
	end

	cooling[player] = true
	scores[player] = (scores[player] or 0) + 1
	print(player.Name, "score:", scores[player])

	task.wait(COOLDOWN)
	cooling[player] = nil
end)
```

`(scores[player] or 0) + 1` is the default trick from unit 3. The first time,
`scores[player]` is `nil`, so `or 0` steps in and the score becomes 1. After that
it holds a number and the `or` never gets a look in.

```task=u8-score
- Write the score pad yourself before opening the solution
- Score three points in a row and check the three-second gap
- Test it with two players and check they each have their own score
```

> **Recap**
> - One step on a pad can fire `Touched` many times.
> - A debounce checks, closes, does the thing, then reopens after a wait.
> - The flag, or the table of flags, lives outside the handler.

> **Done when** all five checklists are ticked. Remember the four steps — check,
> close, do, wait-then-open — and that the flag lives **outside** the handler.
</div>


<!-- ═══════════════════════════ 8.3 ═══════════════════════════ -->
<div id="md-8.3" hidden>
# Players joining

```lua predict=p8-warm3
local scores = {}
scores["Ada"] = 5
scores.Ada += 1
print(scores.Ada)
```

Touching a pad is one kind of event. The most important events in any game are
not about parts at all — they are about **people**. Someone joins. Someone
respawns. Someone leaves. Almost every Roblox game starts with a script that
listens for all three.

These scripts go in **ServerScriptService**, not inside a part.

## PlayerAdded

```lua
local Players = game:GetService("Players")

local function onPlayerAdded(player)
	print(player.Name, "joined the game")
end

Players.PlayerAdded:Connect(onPlayerAdded)
```

```output
YourName joined the game  -  Server - Script:4
```

`Players` is the service that holds everyone in the game. Its `PlayerAdded` event
fires once for each player, as they arrive, and hands you their **Player** — the
same kind of object `GetPlayerFromCharacter` gave you last lesson.

## Players who are already here

There is a catch. An event only tells you about things that happen **after** you
connect. If your script starts a moment late — because it waited for something
first, say — a player who joined in that moment is simply missed. Events do not
replay.

So every serious script also handles the players who are already in the game:

```lua
local Players = game:GetService("Players")

local function onPlayerAdded(player)
	print(player.Name, "joined the game")
end

Players.PlayerAdded:Connect(onPlayerAdded)

for _, player in ipairs(Players:GetPlayers()) do -- @n `_` means we ignore the index and keep only `player`
	onPlayerAdded(player)
end
```

`Players:GetPlayers()` is a list of everyone here right now. Connect for the
future, loop for the present — and because the work lives in one named function,
both paths do exactly the same thing. Get into the habit now and you will never
lose a player to timing.

```task=u8-join
- Put the script above in a Script in ServerScriptService
- Press Play and find your name in Output
- Add a `task.wait(5)` before the `Connect` line, take the loop out, and see that your join is missed
- Put the loop back and see that it catches you again
```

> **Key idea** `Connect` catches players who join later, and a loop over `GetPlayers()` catches those already here.

## CharacterAdded: every time you spawn

The **Player** is you, the person — your name, your account. The **character** is
your body in the world, and it gets replaced every time you respawn. Each Player
has its own `CharacterAdded` event:

```lua
local Players = game:GetService("Players")

local function onCharacterAdded(character)
	print(character.Name, "spawned")
	local highlight = Instance.new("Highlight")
	highlight.FillColor = Color3.fromRGB(125, 255, 175)
	highlight.Parent = character
end

local function onPlayerAdded(player)
	print(player.Name, "joined the game")
	player.CharacterAdded:Connect(onCharacterAdded)
	if player.Character then -- @n nil if there is no body yet, so this skips until CharacterAdded
		onCharacterAdded(player.Character)
	end
end

Players.PlayerAdded:Connect(onPlayerAdded)

for _, player in ipairs(Players:GetPlayers()) do
	onPlayerAdded(player)
end
```

```output
YourName joined the game  -  Server - Script:11
YourName spawned  -  Server - Script:4
```

Your character glows green. Press **Esc**, choose **Reset Character**, and when
you respawn Output says `spawned` again — and the new body glows too. The old
body, and the Highlight inside it, were thrown away.

- A character is named after its player, so `character.Name` is your name too.
- A **Highlight** draws a glowing outline and fill over whatever it is parented
  to. It is a small extra, here so you can *see* each new character.
- The `if player.Character then` part is the same "already here" idea, one level
  down: if the character spawned before we connected, deal with it now.

```task=u8-spawn
- Run the CharacterAdded script and see yourself glow
- Reset your character from the Esc menu and see `spawned` print again
- Change the Highlight colour
```

> **Key idea** The character is replaced on every respawn, so listen to `CharacterAdded` to reach each new body.

## PlayerRemoving

```lua
local Players = game:GetService("Players")

Players.PlayerRemoving:Connect(function(player)
	print(player.Name, "left the game")
end)
```

`PlayerRemoving` fires as a player leaves, while you can still read their name
and their data. Unit 11 uses it to save each player's coins before they go.

You will not see it in a normal Play session, because pressing Stop shuts the
whole server down. Use the two-player test from the last lesson: start
**Clients and Servers** with 2 players, then close `Player2`'s window. The Server
window shows:

```output
Player2 left the game  -  Server - Script:4
```

```task=u8-leave
- Add the PlayerRemoving script as a new Script in ServerScriptService
- Start a test server with **2** players
- Close one player's window and find the `left the game` line in the **Server** Output
```

## Wait: pausing until it happens

`:Connect` says *call this every time*. `:Wait()` says *pause right here until it
happens once*, and gives you whatever the event passes:

```lua
local Players = game:GetService("Players")

local player = Players.PlayerAdded:Wait()
print("the first player is", player.Name)

local character = player.Character or player.CharacterAdded:Wait() -- @n The left of `or` is tried first; the wait runs only if it is nil
print(character.Name, "has a body")
```

```output
the first player is YourName  -  Server - Script:4
YourName has a body  -  Server - Script:7
```

Waiting for `PlayerAdded` like this is only safe right at the start of a server
script, before anyone could have joined — it is the same timing catch as before.
The second pattern is safe anywhere, and you will see it everywhere in Roblox
code. It is unit 3's `or` at work: *use the character if there already is one,
or else wait for it to arrive*. You
met `:Wait()` once already — `tween.Completed:Wait()` in unit 7 is exactly the same
thing on a different event.

> **Key idea** `:Wait()` pauses until the event fires once, and `player.Character or player.CharacterAdded:Wait()` gets the body whenever it exists.

## Disconnect: stop listening

`:Connect` gives something back: a **connection**. Keep it in a variable and you
can switch the handler off with `:Disconnect()`. Here is a pad that only the
first player can ever claim:

```lua
local Players = game:GetService("Players")

local pad = workspace:WaitForChild("Pad")
local connection

connection = pad.Touched:Connect(function(hit) -- @n No `local` here: the variable was made on the line above
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if player then
		print(player.Name, "was first!")
		pad.Color = Color3.fromRGB(255, 215, 0)
		connection:Disconnect()
	end
end)
```

```output
YourName was first!  -  Server - Script:9
```

Why `local connection` on a line of its own? Because the handler needs to reach
`connection`, and a `local` does not exist until the end of the line that makes
it. Declaring the empty variable first means it already exists when the function
inside is written. Roblox also has `:Once()`, which connects and disconnects
itself after the first time — handy, but now you know what it is doing.

```lua predict=p8-disc
local count = 0
local connection

connection = pad.Touched:Connect(function(hit)
	count += 1
	connection:Disconnect()
	print("count is", count)
end)
```

```task=u8-once
- Make sure your `Pad` from the last lessons is still in Workspace, with its own script disabled or deleted
- Run the first-player script and step on the pad
- Step on it ten more times and check Output still has only one line
```

> **Key idea** Keep the connection in a variable and call `:Disconnect()` to stop listening.

## Fix the bug

This is meant to make every player fast as soon as they join. Press Play and it
breaks straight away:

```lua
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local humanoid = player.Character.Humanoid
	humanoid.WalkSpeed = 30
end)
```

```output
! ServerScriptService.Script:4: attempt to index nil with 'Humanoid'  -  Server - Script:4
```

```solution
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid")
		humanoid.WalkSpeed = 30
	end)
end)
```

When a player joins, their **character has not spawned yet**. `player.Character`
is `nil`, so `.Humanoid` breaks. Wait for the body with `CharacterAdded` — and
because it fires on every respawn, the speed comes back each time too.
`WalkSpeed` is how fast a character walks; it is normally `16`.

## Your turn

Write a **welcome counter**. When anyone joins, print their name and how many
players are now in the game. When anyone leaves, print their name and how many
are left. Test it with a 2-player test server, then close `Player2`:

```output
Player1 joined. Players here: 1  -  Server - Script:4
Player2 joined. Players here: 2  -  Server - Script:4
Player2 left. Players here: 1  -  Server - Script:14
```

One hint: while `PlayerRemoving` runs, the leaving player is **still in the
list**. Account for that.

```solution
local Players = game:GetService("Players")

local function onPlayerAdded(player)
	print(`{player.Name} joined. Players here: {#Players:GetPlayers()}`)
end

Players.PlayerAdded:Connect(onPlayerAdded)
for _, player in ipairs(Players:GetPlayers()) do
	onPlayerAdded(player)
end

Players.PlayerRemoving:Connect(function(player)
	-- the leaving player is still in the list while this runs
	print(`{player.Name} left. Players here: {#Players:GetPlayers() - 1}`)
end)
```

```task=u8-welcome
- Write the welcome counter yourself before opening the solution
- Test it with 2 players and check all three lines
- Try it with 3 players
```

> **Recap**
> - `PlayerAdded` plus a loop over `GetPlayers()` misses nobody.
> - `CharacterAdded` runs for every new body, not just the first.
> - `:Wait()` waits for one event; `:Disconnect()` stops listening.

> **Done when** all five checklists are ticked. Connect for the future, loop for
> the present, `CharacterAdded` for every new body — and `:Wait()` when you only
> need it once.
</div>


<!-- ═══════════════════════════ 8.4 ═══════════════════════════ -->
<div id="md-8.4" hidden>
# Clicks and prompts

```lua predict=p8-warm4
for i = 10, 1, -3 do
	print(i)
end
```

`Touched` is clumsy for anything a player should do *on purpose*. You brush past
a part and it fires. For buttons, levers, doors and shops, Roblox gives you two
better tools: the **ClickDetector** and the **ProximityPrompt**. Both are
Instances you put inside a part, and both have one event that hands you the
player directly.

## A button you can click

```task=u8-click
- Make a new Part in Workspace, name it `Button`, anchor it, and make it red
- Hover over `Button`, click **+**, and add a **ClickDetector**
- Hover over `Button` again and add a **Script**
- Paste the script below, press Play, and click the button with your mouse
```

```lua
local button = script.Parent
local detector = button:WaitForChild("ClickDetector")

detector.MouseClick:Connect(function(player) -- @n The first argument is the Player, not a body part
	print(player.Name, "clicked the button")
end)
```

```output
YourName clicked the button  -  Server - Script:5
```

```lua predict=p8-param
detector.MouseClick:Connect(function(something)
	print(something.Name)
end)
```

When your mouse is over the button, the cursor turns into a hand — that is the
ClickDetector saying *you can click this*. It also works with a tap on a phone. By
default you have to be within **32** studs; the detector's
`MaxActivationDistance` property changes that.

That is the big difference from `Touched`. No `hit.Parent`, no
`GetPlayerFromCharacter` — `MouseClick` already knows who did it.

> **Key idea** `MouseClick` hands you the player directly, so there is no `hit.Parent` to unpack.

## A light switch

Put it to work. This button turns its own light on and off:

```lua
local button = script.Parent
local detector = button:WaitForChild("ClickDetector")

local light = Instance.new("PointLight")
light.Range = 16
light.Brightness = 3
light.Parent = button

detector.MouseClick:Connect(function(player)
	light.Enabled = not light.Enabled -- @n Work out the right side first, then store that opposite
	if light.Enabled then
		button.Material = Enum.Material.Neon
	else
		button.Material = Enum.Material.Plastic
	end
	print(player.Name, "switched the light", light.Enabled and "on" or "off")
end)
```

```output
YourName switched the light off  -  Server - Script:16
YourName switched the light on  -  Server - Script:16
```

`light.Enabled = not light.Enabled` is the classic toggle: whatever it is now,
make it the other one. And `light.Enabled and "on" or "off"` is unit 3 again —
*if it is enabled, "on", or else "off"*. A neat way to pick between two words.

Make it night with `Lighting.ClockTime` from unit 2 if you want to see the light
properly.

```task=u8-switch
- Put the light switch script in your Button and click it a few times
- Make it night and watch the light go on and off
- Change the light's colour each time it turns on
```

> **Key idea** `light.Enabled = not light.Enabled` flips a boolean to its opposite.

## Fix the bug

Add a **PointLight** by hand inside `Button` first. Then try this. The first
click turns the light off, as expected — but no click ever turns it back on:

```lua
local button = script.Parent
local detector = button:WaitForChild("ClickDetector")
local light = button:WaitForChild("PointLight")

detector.MouseClick:Connect(function(player)
	light.Enabled = not light
	print("light is now", light.Enabled)
end)
```

```output
light is now false  -  Server - Script:7
light is now false  -  Server - Script:7
light is now false  -  Server - Script:7
```

```solution
detector.MouseClick:Connect(function(player)
	light.Enabled = not light.Enabled
	print("light is now", light.Enabled)
end)
```

`light` is the PointLight itself — an Instance — and every Instance is truthy.
So `not light` is `false`, every single click. The toggle has to flip the
**property**, `light.Enabled`, not the object. No error, just the wrong answer —
which is why the `print` was worth having.

```task=u8-fixlamp
- Add a PointLight inside Button by hand
- Run the broken script, click three times, and read the Output
- Fix the toggle and check the light now goes on **and** off
```

> **Key idea** Flip the property, not the object: `not light` is always false because an Instance is truthy.

## A ProximityPrompt

A **ProximityPrompt** is the little *E — Open* box that pops up when you walk up
to something. Walk close, press the key (or tap the button on a phone), and its
`Triggered` event fires with the player who did it.

```task=u8-prompt
- Make a new Part named `Door`, anchor it, and set its Size to `6, 8, 1`
- Put it somewhere you can walk up to, standing on the Baseplate
- Hover over `Door`, click **+**, add a **ProximityPrompt**
- Click the ProximityPrompt and, in Properties, set **ActionText** to `Open` and **ObjectText** to `Door`
- Add a **Script** inside `Door` and paste the script below
- Press Play, walk to the door, and press **E**
```

```lua
local TweenService = game:GetService("TweenService")

local door = script.Parent
local prompt = door:WaitForChild("ProximityPrompt")

local closedPosition = door.Position
local openPosition = closedPosition + Vector3.new(door.Size.X, 0, 0) -- @n The closed spot, moved along x by one door width
local info = TweenInfo.new(0.6, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local isOpen = false

prompt.Triggered:Connect(function(player)
	isOpen = not isOpen -- @n Flips on every trigger: false, true, false, and so on

	local target = closedPosition
	if isOpen then
		target = openPosition
	end
	TweenService:Create(door, info, { Position = target }):Play()

	prompt.ActionText = isOpen and "Close" or "Open"
	print(player.Name, isOpen and "opened" or "closed", "the door")
end)
```

```output
YourName opened the door  -  Server - Script:21
YourName closed the door  -  Server - Script:21
```

The door slides sideways by its own width, and the prompt's text flips between
*Open* and *Close*. Units 3, 7 and 8 in one script: a toggle, a tween, an event.

The prompt is inside the door, so it moves with it — that is why this door
slides sideways rather than up. If it shot up into the sky, the prompt would go
with it and soon be out of reach.

These are the ProximityPrompt properties you will reach for most:

| property | what it does | default |
|---|---|---|
| `ActionText` | the verb on the prompt: *Open*, *Buy*, *Talk* | `Interact` |
| `ObjectText` | the name of the thing, shown above | empty |
| `HoldDuration` | seconds the key must be held down; 0 means a tap | `0` |
| `KeyboardKeyCode` | which key to press | `E` |
| `MaxActivationDistance` | how close, in studs, you must be | `10` |

```lua predict=p8-hold
prompt.HoldDuration = 2

prompt.Triggered:Connect(function(player)
	print(player.Name, "opened the vault")
end)
```

Use `HoldDuration` for anything a player should not do by accident — buying
something, opening the vault, resetting their progress. A held prompt shows a
ring that fills up while they hold.

> **Key idea** A prompt's `Triggered` event gives you the player, and `HoldDuration` makes it need a deliberate hold.

## Your turn

Make a **click race**. Count every player's clicks on your Button separately. Each
click prints their total. The first click that takes a player to 10 turns the
button gold and prints that they won.

```output
YourName has 1 clicks  -  Server - Script:8
YourName has 2 clicks  -  Server - Script:8
YourName has 10 clicks  -  Server - Script:8
YourName wins!  -  Server - Script:12
```

```solution
local button = script.Parent
local detector = button:WaitForChild("ClickDetector")
local GOAL = 10
local clicks = {}

detector.MouseClick:Connect(function(player)
	clicks[player] = (clicks[player] or 0) + 1
	print(player.Name, "has", clicks[player], "clicks")

	if clicks[player] == GOAL then
		button.Color = Color3.fromRGB(255, 215, 0)
		print(player.Name, "wins!")
	end
end)
```

It is the score pad from 8.2, with a click instead of a touch. Because a click is
always on purpose, there is no debounce at all — every click should count.

```task=u8-race
- Write the click race yourself before opening the solution
- Race to 10 and turn the button gold
- Race a second player in a 2-player test server
```

> **Recap**
> - A ClickDetector and a ProximityPrompt both hand you the player.
> - `x = not x` flips a boolean.
> - Use `HoldDuration` for actions a player should not do by accident.

> **Done when** all five checklists are ticked. Use `Touched` for things that
> happen *to* players, and a ClickDetector or a ProximityPrompt for things they
> do *on purpose* — both hand you the player straight away.
</div>


<!-- ═══════════════════════════ 8.5 ═══════════════════════════ -->
<div id="md-8.5" hidden>
# Build: a mini obby

```lua predict=p8-warm5
local ready = true

local function touch()
	if not ready then
		return "blocked"
	end
	ready = false
	return "reward"
end

print(touch(), touch())
```

An **obby** — an obstacle course — is the most played kind of Roblox game there
is. This build makes a complete one from a single script: stepping stones over a
lava floor, strips of lava to jump, checkpoints that remember how far you got, a
gate that opens with a prompt, and a finish line.

Every event in this unit is in it.

## The script

Clear out the pads and buttons from the last lessons (or start a fresh Baseplate),
add a **Script** to **ServerScriptService**, paste this in, and press Play:

```lua
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

-- ═══ settings: change these to reshape the obby ═══
local SECTIONS = 3		-- how many checkpoints
local STONES = 4		-- stepping stones between checkpoints
local GAP = 8			-- studs from one stone to the next
local LAVA_COLOR = Color3.fromRGB(255, 80, 40)
local STONE_COLOR = Color3.fromRGB(143, 184, 255)
local CHECKPOINT_COLOR = Color3.fromRGB(125, 255, 175)

local obby = Instance.new("Folder")
obby.Name = "Obby"
obby.Parent = workspace

local function makePart(name, size, position, color)
	local part = Instance.new("Part")
	part.Name = name
	part.Anchored = true
	part.Size = size
	part.Position = position
	part.Color = color
	part.Parent = obby
	return part
end

-- ═══ 1. lay out the course, front to back ═══
local checkpoints = {}
local lavaParts = {}
local z = -12

for section = 1, SECTIONS do
	local pad = makePart(`Checkpoint{section}`, Vector3.new(8, 2, 8), Vector3.new(0, 1, z), CHECKPOINT_COLOR)
	table.insert(checkpoints, pad)
	z -= GAP + 2 -- @n z only goes down, so the course runs away from the spawn

	for stone = 1, STONES do
		local x = math.random(-4, 4)
		local block = makePart("Stone", Vector3.new(5, 2, 5), Vector3.new(x, 1, z), STONE_COLOR)
		-- every second stone has a strip of lava across it
		if stone % 2 == 0 then -- @n `%` gives the remainder, so this is true on stones 2 and 4
			local strip = makePart("Lava", Vector3.new(5, 0.4, 1), block.Position + Vector3.new(0, 1.2, 0), LAVA_COLOR)
			strip.Material = Enum.Material.Neon
			table.insert(lavaParts, strip)
		end
		z -= GAP
	end
end

-- ═══ 2. the finish: a floor, a gate, and a gold pad behind it ═══
makePart("Finish", Vector3.new(12, 2, 16), Vector3.new(0, 1, z - 4), CHECKPOINT_COLOR)
local gate = makePart("Gate", Vector3.new(12, 10, 1), Vector3.new(0, 7, z - 4), Color3.fromRGB(60, 60, 70))
local winPad = makePart("WinPad", Vector3.new(6, 1, 6), Vector3.new(0, 2.5, z - 9), Color3.fromRGB(255, 207, 107))
winPad.Material = Enum.Material.Neon

-- ═══ 3. the lava floor, under everything after the first checkpoint ═══
local floorStart = -16
local floorEnd = z - 12
local length = floorStart - floorEnd
local floor = makePart("LavaFloor", Vector3.new(120, 1, length), Vector3.new(0, 0.5, floorStart - length / 2), LAVA_COLOR)
floor.Material = Enum.Material.Neon
table.insert(lavaParts, floor)

-- ═══ 4. lava knocks you out ═══
local function onLavaTouched(hit)
	local humanoid = hit.Parent:FindFirstChild("Humanoid")
	if humanoid then
		humanoid.Health = 0
	end
end

for _, lava in ipairs(lavaParts) do
	lava.Touched:Connect(onLavaTouched)
end

-- ═══ 5. checkpoints remember how far each player got ═══
local reached = {}

for index, pad in ipairs(checkpoints) do
	pad.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if player and (reached[player] or 0) &lt; index then
			reached[player] = index
			print(`{player.Name} reached checkpoint {index}`)
		end
	end)
end

-- ═══ 6. respawn at your last checkpoint ═══
local finished = {}

local function onCharacterAdded(player, character)
	local index = reached[player] -- @n nil until the player has touched a checkpoint
	if not index then
		return
	end
	local root = character:WaitForChild("HumanoidRootPart")
	task.wait()	-- let Roblox finish placing the character first
	root.CFrame = checkpoints[index].CFrame + Vector3.new(0, 4, 0) -- @n Four studs above the pad, so you do not land inside it
end

local function onPlayerAdded(player)
	player.CharacterAdded:Connect(function(character)
		onCharacterAdded(player, character)
	end)
end

Players.PlayerAdded:Connect(onPlayerAdded)
for _, player in ipairs(Players:GetPlayers()) do
	onPlayerAdded(player)
end

Players.PlayerRemoving:Connect(function(player)
	reached[player] = nil
	finished[player] = nil
end)

-- ═══ 7. the gate opens with a prompt ═══
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open"
prompt.ObjectText = "Gate"
prompt.HoldDuration = 1
prompt.Parent = gate

local closedPosition = gate.Position
local info = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
local openTween = TweenService:Create(gate, info, { Position = closedPosition + Vector3.new(12, 0, 0) })
local closeTween = TweenService:Create(gate, info, { Position = closedPosition })

prompt.Triggered:Connect(function(player)
	prompt.Enabled = false
	print(`{player.Name} opened the gate`)
	openTween:Play()
	task.wait(4)
	closeTween:Play()
	prompt.Enabled = true
end)

-- ═══ 8. the finish line ═══
winPad.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if player and not finished[player] then
		finished[player] = true
		print(`{player.Name} finished the obby!`)
	end
end)

print(`Obby built: {SECTIONS} checkpoints, {#lavaParts} lava parts`)
```

```output
Obby built: 3 checkpoints, 7 lava parts  -  Server - Script:148
```

Then, as you play:

```output
YourName reached checkpoint 1  -  Server - Script:84
YourName reached checkpoint 2  -  Server - Script:84
YourName reached checkpoint 3  -  Server - Script:84
YourName opened the gate  -  Server - Script:132
YourName finished the obby!  -  Server - Script:144
```

The first green checkpoint is just in front of where you spawn. Jump up onto it,
then hop from stone to stone. Fall in the lava and you come back at the last green
pad you stood on. At the end, hold **E** at the gate, slip through, and step on
the gold pad.

```task=u8-build
- Paste the script into ServerScriptService and press Play
- Reach checkpoint 1, then fall in the lava on purpose — you respawn on the checkpoint
- Get to the gate, hold **E** to open it, and step on the gold pad
- Find the `Obby` folder in Explorer while playing and look at what was built
```

## How it works

Read it section by section — each numbered part is one idea from this unit or an
earlier one:

1. **The layout** is two nested `for` loops (unit 4) and the `makePart` helper
   (unit 5). `z` is a running position: every new piece is placed further along
   and pushes `z` on for the next. Lava strips and checkpoints go into tables
   (unit 6) so later sections can loop over them.
2. **The finish** is worked out from wherever `z` ended up, so it is always at the
   end of the course however long it gets.
3. **The lava floor** stretches from the first checkpoint to the finish, worked out
   from the same `z`. Its middle is halfway between the two ends.
4. **Lava** — one named handler, `onLavaTouched`, connected to every lava part in
   a loop. One function, seven connections.
5. **Checkpoints** keep a per-player table, `reached`, exactly like the cooldowns
   in 8.2. `(reached[player] or 0) &lt; index` means a checkpoint only counts if it is
   further than your best so far — walking back to checkpoint 1 does not throw
   away checkpoint 3. That check is also why each line only prints once: no
   separate debounce needed.
6. **Respawning** is `CharacterAdded` (8.3). When a new body arrives and the player
   has a checkpoint, the script moves their `HumanoidRootPart` — the invisible
   block in the middle of every character that the rest of the body hangs off.
   Moving it moves the whole character. Adding a Vector3 to a CFrame moves it
   without turning it, so `+ Vector3.new(0, 4, 0)` drops you just above the pad.
   `PlayerRemoving` cleans up both tables so a player who leaves does not stay in
   them for ever.
7. **The gate** is a ProximityPrompt and two tweens (8.4 and 7.3). Turning
   `prompt.Enabled` off while it is open is the debounce: nobody can trigger it
   twice.
8. **The finish line** uses a "once per player" table (8.2), so it only
   congratulates each player once.

The `task.wait()` before moving the character is worth knowing about. Roblox
places a new character on a spawn point *just after* `CharacterAdded` fires; move
it too early and Roblox puts it straight back. Waiting one frame lets Roblox
finish first.

> **Key idea** Each numbered part reuses one earlier idea: loops lay out the course, tables remember players, and one handler serves many parts.

## Change one number

```task=u8-tweak
- Set `SECTIONS` to `5` — a longer course, and the lava floor grows with it
- Set `GAP` to `10` and see if you can still make the jumps
- Set `STONES` to `1` for a quick, easy course to test the gate and finish
- Change `LAVA_COLOR` and the floor and strips all change together
```

`math.random` places the stones, so the course is a little different every time
you press Play. If you want the same course every time, put
`math.randomseed(1)` at the very top — any number works, and each one gives its
own layout.

## Make it yours

Some ideas — try at least one:

- **Moving lava.** Tween some of the strips sideways across their stones for ever,
  with the `-1, true` TweenInfo from unit 7.
- **A spinning bar.** A long lava part in the middle of a checkpoint, spun with the
  `dt` loop from 7.3. Jump it as it comes round.
- **A speed pad.** A pad that sets the touching player's `WalkSpeed` to 30 for five
  seconds, then back to 16 — with a per-player debounce.
- **A reset button.** A ClickDetector at the start that clears your checkpoint with
  `reached[player] = nil`.
- **Walls**, so nobody can just walk round the lava floor.

```task=u8-own
- Add something new to the obby using what you learned in this unit
- Play it from start to finish
- Get someone else to play it
```

> **Recap**
> - Settings at the top and one `makePart` helper build the whole course.
> - A table keyed by player remembers each player's progress.
> - One named handler can be connected to many parts.

> **Done when** all three checklists are ticked — and that is unit 8. Your games
> now react: to touches, to clicks, to prompts, to people joining and leaving.
> Next up: players themselves — their stats, their health, and the leaderboard.
</div>


<!-- ═══════════════════════════ cheat-8 ═══════════════════════════ -->
<div id="md-cheat-8" hidden>
# Events cheatsheet

Everything from the events unit on one page. Keep it open next to Studio.

## Connecting

```lua
part.Touched:Connect(function(hit)       -- call this every time it happens
	print(hit.Name)
end)

local function onTouched(hit) end
part.Touched:Connect(onTouched)          -- no brackets: hand the function over

local connection = part.Touched:Connect(onTouched)
connection:Disconnect()                  -- stop listening

part.Touched:Once(onTouched)             -- only the first time
local player = Players.PlayerAdded:Wait() -- pause until it happens once
```

## The events you will use most

| event | fires when | hands you |
|---|---|---|
| `part.Touched` | something touches the part | the part that touched |
| `Players.PlayerAdded` | a player joins | the Player |
| `Players.PlayerRemoving` | a player is leaving | the Player |
| `player.CharacterAdded` | their body spawns or respawns | the character Model |
| `humanoid.Died` | the character is knocked out | nothing |
| `detector.MouseClick` | a ClickDetector is clicked | the Player |
| `prompt.Triggered` | a ProximityPrompt is used | the Player |
| `tween.Completed` | a tween finishes | how it ended |

## Who touched it?

```lua
local Players = game:GetService("Players")

part.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player then
		return                            -- a hat, a crate, anything else
	end
	print(player.Name)
end)

-- anything with health, players or not
local humanoid = hit.Parent:FindFirstChild("Humanoid")
```

## Debounce

```lua
-- one cooldown for everyone
local ready = true
part.Touched:Connect(function(hit)
	if not ready then return end
	ready = false
	-- do the thing
	task.wait(2)
	ready = true
end)

-- one cooldown each
local cooling = {}
-- check:  if cooling[player] then return end
-- close:  cooling[player] = true
-- open:   cooling[player] = nil

-- once per player, for ever
local claimed = {}
-- if claimed[player] then return end
-- claimed[player] = true
```

## Players, safely

```lua
local function onPlayerAdded(player)
	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid")
	end)
end

Players.PlayerAdded:Connect(onPlayerAdded)          -- the future
for _, player in ipairs(Players:GetPlayers()) do     -- the present
	onPlayerAdded(player)
end

local character = player.Character or player.CharacterAdded:Wait()
```

## Testing with more than one player

**Test** tab → **Clients and Servers** → choose **2** players → **Start**. Read the
**Server** window's Output. Close a player's window to make them leave. Players
are named `Player1`, `Player2`, ...

## Messages you will see

| in Output | usually means |
|---|---|
| *attempt to index nil with 'Name'* in a handler | you wrote `Connect(fn())` — the brackets called it right away with nothing |
| *attempt to index nil with 'Humanoid'* | `player.Character` before the character spawned — use `CharacterAdded` |
| *attempt to index nil with 'Parent'* | the thing you saved was destroyed or never found |
| dozens of lines from one step | `Touched` fired for every body part — add a debounce |
| the debounce does nothing | the flag is a `local` *inside* the handler — move it out |
| `PlayerRemoving` never prints | you pressed Stop; test with a 2-player server and close a window |
| a toggle that only works once | you wrote `not thing` instead of `not thing.Enabled` |

## The rules

1. `Connect` does not run the function. It hands it to Roblox for later.
2. No brackets when you pass a function: `Connect(onTouched)`.
3. `Touched` fires for every body part, many times. Debounce anything that gives
   a reward.
4. The debounce flag lives **outside** the handler.
5. `hit.Parent` is the character, `GetPlayerFromCharacter` gives the player — and
   check for `nil`.
6. Connect `PlayerAdded` **and** loop `GetPlayers()`.
7. A Player is the person, a character is the body. Use `CharacterAdded` for the
   body, every time it spawns.
8. Clicks and prompts hand you the player directly. Use them for anything a
   player does on purpose.
</div>
