<!-- ════════════════════════════════════════════════════════════════════
     UNIT 10 — CLIENT AND SERVER
     Format and special fences are described at the top of lessons.md.
     No raw less-than sign or ampersand anywhere in this file.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 10.1 ═══════════════════════════ -->
<div id="md-10.1" hidden>
# Server and client

Every script so far has run in one place: the **server**. This lesson is about
the other place your code can run — on each player's own computer — and why
Roblox games are split in two.

## Warm up

From memory:

```lua predict=p10-warm-server
local Players = game:GetService("Players")

local count = #Players:GetPlayers()
print(count)
```

## One server, many clients

A Roblox game running online looks like this:

- **The server** is one computer at Roblox. It runs the real game: the true
  score, the true health, the true position of every part. Every `Script` you
  have written runs here.
- **The clients** are the players' own devices — a laptop, a phone, an Xbox. Each
  one draws the game on its own screen and reads its own keyboard, mouse or touch.

The server is in charge. The clients show what the server tells them, and send it
what their player is doing.

When you press **Play** in Studio, Studio pretends to be both at once. That is why
every line in Output has `Server` in it — you have only ever been reading from one
half.

> **Key idea** The server runs the real game and the clients show it, so the server is in charge.

## A script that runs on the client

A **LocalScript** is a script that runs on the client. It looks exactly like a
Script. The difference is where it runs — and where you are allowed to put it.

```task=u10-local-make
- In Explorer, open **StarterPlayer** and find **StarterPlayerScripts** inside it
- Hover over StarterPlayerScripts, click **+** and choose **LocalScript**
- Replace its contents with the script below and press **Play**
```

```lua
local Players = game:GetService("Players")

local player = Players.LocalPlayer
print("Hello from", player.Name) -- @n `player.Name` is your own name: this runs on your device
```

```output
Hello from YourName  -  Client - LocalScript:4
```

Two new things in one line of Output:

- The tag says **Client**, not Server. This line was printed on the player's
  computer.
- `Players.LocalPlayer` is **the player whose computer this is**. On the client
  there is always exactly one: you. A server has no "you", so on the server
  `LocalPlayer` is `nil`.

Scripts in **StarterPlayerScripts** are copied into each player when they join, so
every player gets their own copy, running on their own device.

```lua predict=p10-localplayer
-- a normal Script, in ServerScriptService
local Players = game:GetService("Players")

print(Players.LocalPlayer)
```

> **Key idea** A LocalScript runs on one player's device, and there `Players.LocalPlayer` is that player.

## Where each kind runs

A script only runs if it is in a place where its kind is allowed.

| kind | runs on | put it in |
|---|---|---|
| `Script` | the server | **ServerScriptService**, or inside a part in **Workspace** |
| `LocalScript` | the client | **StarterPlayerScripts**, **StarterCharacterScripts**, **StarterGui** |

Put either one in the wrong place and it does not run. No error, no warning —
nothing. A LocalScript in ServerScriptService just sits there.

```lua predict=p10-wrong-place
-- a LocalScript, placed directly in Workspace
print("Am I running?")
```

> **Key idea** A script only runs in a place that suits its kind, and in the wrong place it silently does nothing.

## What one side changes, who sees

This is the most important idea in the unit. Add this to your LocalScript, under
what is already there:

```lua
local part = Instance.new("Part")
part.Name = "ClientPart"
part.Size = Vector3.new(6, 6, 6)
part.Position = Vector3.new(0, 3, -15)
part.Color = Color3.fromRGB(255, 60, 140)
part.Anchored = true
part.Parent = workspace -- @n until this line the part exists, but not in the world

print("I made a part")
```

Press Play. A pink cube appears in front of you. Now look at it from the server's
side:

```task=u10-replicate
- Press Play and find the pink cube
- In the **Test** tab, find the button that says **Current: Client** and click it — you are now looking from the **Server**
- Look in Workspace in Explorer. `ClientPart` is not there. Switch back to Client.
- Make the same part from a **Script** in ServerScriptService instead, and check it shows up in both views
```

The rule:

- **The server changes something → everyone sees it.** Roblox copies the change
  out to every client. This copying is called **replication**.
- **A client changes something → only that client sees it.** It stays on that one
  computer. The server never hears about it, and no other player does either.

The rule is deliberate. If one player's computer could change the real game, then
anyone with a cheat program could change their own coins, delete the floor, or
knock out everyone in the server. Roblox does not trust clients, and neither
should you.

(One exception you will notice: your own character. You walk it from your
keyboard, and Roblox lets your client move it so it feels instant. That is why you
can walk while the server is busy.)

> **Key idea** A change made by the server reaches everyone, and a change made by a client stays on that one screen.

## So what is a client for?

Anything that is about **one player's screen** or **one player's controls**:

- the buttons and text on their screen — next lesson
- the camera, sounds and effects only they need
- reading their keys and clicks, and telling the server about them

And the server does anything that has to be **true for everyone**: scores, health,
doors, coins, who won.

## Fix the bug

A builder wants every player's screen to print a welcome when they join. They
made a LocalScript with this inside it and put it in **ServerScriptService**.

```lua
local Players = game:GetService("Players")

local player = Players.LocalPlayer
print(`Welcome, {player.Name}!`) -- @n the code is fine; the place is wrong, so this never runs
```

Nothing appears in Output. There is nothing wrong with the code. What is wrong?

```solution
-- Same code, different place.
-- Move this LocalScript out of ServerScriptService
-- and into StarterPlayer > StarterPlayerScripts.
local Players = game:GetService("Players")

local player = Players.LocalPlayer
print(`Welcome, {player.Name}!`)
```

ServerScriptService is a server-only place. A LocalScript there never runs — and
the server could not answer `LocalPlayer` anyway. When a script does nothing at
all, the first thing to check is **where it is**. Drag it in Explorer to move it.

## Your turn

Write a LocalScript in StarterPlayerScripts that:

- waits for your character with `player.Character or player.CharacterAdded:Wait()`
- prints your character's `WalkSpeed`
- makes a glowing **Neon** part that only you can see, 10 studs above the Baseplate

Then check it really is yours alone: switch to Server view and confirm the part is
not there.

```output
16  -  Client - LocalScript:6
```

```solution
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
print(humanoid.WalkSpeed)

local part = Instance.new("Part")
part.Size = Vector3.new(4, 4, 4)
part.Position = Vector3.new(0, 10, 0)
part.Material = Enum.Material.Neon
part.Anchored = true
part.Parent = workspace
```

```task=u10-own
- Write the LocalScript and see `16` with a **Client** tag in Output
- Find your Neon part in Client view
- Switch to Server view and check it is not there
```

> **Recap**
> - `Script` runs on the server and `LocalScript` runs on one player's device.
> - A script only runs in a place that allows its kind.
> - Server changes replicate to everyone; client changes stay on that client.

> **Done when** every goal is ticked. One idea to keep: the server's changes reach
> everyone; a client's changes stay on that one screen.
</div>


<!-- ═══════════════════════════ 10.2 ═══════════════════════════ -->
<div id="md-10.2" hidden>
# Your first GUI

A **GUI** — graphical user interface — is everything flat on the screen: the coin
counter in the corner, the shop button, the "Round starting in 5" banner. It is
drawn by each player's own computer, which makes it client work, done with
LocalScripts.

## Warm up

From memory:

```lua predict=p10-warm-gui
-- a LocalScript in StarterPlayerScripts
local part = Instance.new("Part")
part.Anchored = true
part.Parent = workspace
```

## Build a screen by hand

A GUI is made of Instances, the same as the world. Make one in Explorer:

```task=u10-gui-hand
- In Explorer, hover over **StarterGui**, click **+** and add a **ScreenGui**
- Into the ScreenGui add a **TextLabel**. Rename it `Counter`.
- Into the ScreenGui add a **TextButton**. Rename it `ClickButton`.
- Drag the button somewhere away from the label, then press **Play** and see both on your screen
```

- **ScreenGui** is the sheet of glass everything else sits on. Nothing shows on
  screen unless it is inside one.
- **TextLabel** shows text. **TextButton** shows text and can be clicked or tapped.
- **StarterGui** is a template. When a player joins, Roblox copies everything in it
  into that player's **PlayerGui** — their own screen. Each player gets their own
  copy.

Click the label and look in Properties. `Text` is what it says. `TextScaled`
makes the text fill the box. `BackgroundColor3` and `TextColor3` are its colours.
Try a few now — this is how most GUIs are styled, by hand.

> **Key idea** Everything on screen sits inside a ScreenGui, and each player gets their own copy of StarterGui in PlayerGui.

## Making the button do something

Add a **LocalScript** directly inside your **ScreenGui** — so it sits next to
`Counter` and `ClickButton` in Explorer — with this inside:

```lua
local gui = script.Parent
local label = gui:WaitForChild("Counter")
local button = gui:WaitForChild("ClickButton")

local clicks = 0 -- @n made outside the function, so it keeps its value between presses

button.Activated:Connect(function()
	clicks += 1
	label.Text = `Clicks: {clicks}`
	print(clicks)
end)
```

Press Play and click the button three times.

```output
1  -  Client - LocalScript:10
2  -  Client - LocalScript:10
3  -  Client - LocalScript:10
```

The label counts up with you.

- `script` is always the script that is running, and `script.Parent` is the thing
  it sits in — here, your copy of the ScreenGui. This is the normal way for a GUI
  script to find its own buttons.
- `Activated` is the button's event for *pressed* — a mouse click, a tap on a
  phone, or a gamepad button. Use it instead of anything mouse-only, so your game
  works on every device.

```task=u10-gui-click
- Add the LocalScript inside the ScreenGui and press Play
- Click the button and watch the label count
- Change the label's text colour from the script when `clicks` reaches 10
```

> **Key idea** `script.Parent` finds the GUI the script sits in, and `Activated` fires on a click, a tap or a gamepad press.

## Where things go on screen: UDim2

A GUI's `Position` and `Size` are not `Vector3`s. They are **UDim2**s, and each
one holds **two kinds** of measurement for each direction:

- **Scale** — a fraction of the screen. `0` is the left (or top) edge, `0.5` is the
  middle, `1` is the right (or bottom) edge.
- **Offset** — an exact number of pixels.

```lua
label.Size = UDim2.fromScale(0.3, 0.1)           -- 30% of the screen wide, 10% tall
label.Position = UDim2.fromScale(0, 0)           -- the top-left corner

button.Size = UDim2.fromOffset(200, 50)          -- exactly 200 by 50 pixels
button.Position = UDim2.new(0.5, -100, 1, -70)   -- all four numbers at once
```

`UDim2.new(xScale, xOffset, yScale, yOffset)` reads: *start this far across the
screen as a fraction, then nudge this many pixels*. The button above starts in the
middle (`0.5`), moves back 100 pixels — half its width — so it is centred, and
sits 70 pixels up from the bottom.

Scale is why one GUI fits a phone and a big monitor. Use it for anything that
should stay in the same **place**. Use offset for small exact gaps.

```lua predict=p10-udim
-- the button is 200 pixels wide
button.Position = UDim2.fromScale(0.5, 0.5)
```

To place something by its **middle** instead of its top-left corner, set its
`AnchorPoint`:

```lua
button.AnchorPoint = Vector2.new(0.5, 0.5) -- @n `0.5, 0.5` is the middle of the button, not its corner
button.Position = UDim2.fromScale(0.5, 0.5)      -- now truly centred
```

`Vector2` is a `Vector3` with only X and Y — the screen is flat.

```task=u10-gui-udim
- Put the label in the top-middle of the screen using scale
- Centre the button using `AnchorPoint` and `UDim2.fromScale(0.5, 0.5)`
- In the **Test** tab, open **Device**, pick a phone, and check both still fit on the smaller screen
```

> **Key idea** Scale is a fraction of the screen and offset is pixels, so use scale for where things go.

## Fix the bug

This script is meant to change the label to `Ready!` when the game starts. It
runs without any error. The screen still says `Label`.

```lua
-- a LocalScript in StarterPlayerScripts
local StarterGui = game:GetService("StarterGui")

local label = StarterGui.ScreenGui.Counter -- @n this is the template; the player sees a copy in PlayerGui
label.Text = "Ready!"
```

```solution
-- a LocalScript inside the ScreenGui
local gui = script.Parent
local label = gui:WaitForChild("Counter")

label.Text = "Ready!"
```

StarterGui is the **template**. By the time this runs, your player already has
their own copy of the ScreenGui in their PlayerGui — that copy is what is on
screen. Changing the template changes nothing you can see. Reach the real one
through `script.Parent`, or through `player.PlayerGui`. (Stop the game and look
in Properties: the change did not stick to the template either. Changes made
while playing never do.)

> **Key idea** StarterGui is only a template, so change the copy in PlayerGui, which you reach through `script.Parent`.

## Your turn

*Optional practice: the stop clears without it.*

Build a menu that opens and closes:

- by hand: add a **Frame** to your ScreenGui named `Menu`, with a TextLabel inside
  it that says anything you like
- add a TextButton named `MenuButton` outside the Frame
- in your LocalScript: each press of `MenuButton` flips the Frame's `Visible`
  between `true` and `false`
- the button's text says `Close` while the menu is open and `Menu` while it is shut
- print the new value of `Visible` each time

```output
false  -  Client - LocalScript:16
true  -  Client - LocalScript:16
```

```solution
local gui = script.Parent
local menu = gui:WaitForChild("Menu")
local menuButton = gui:WaitForChild("MenuButton")

local function refresh()
	if menu.Visible then
		menuButton.Text = "Close"
	else
		menuButton.Text = "Menu"
	end
end

menuButton.Activated:Connect(function()
	menu.Visible = not menu.Visible
	refresh()
	print(menu.Visible)
end)

refresh()
```

A **Frame** is an empty box for grouping other GUI things. Hide the Frame, and
everything inside it hides too. `not menu.Visible` flips a boolean — the same
`not` from unit 3.

If your print sits on a different line than mine, that is fine; the values are
what count.

> **Recap**
> - A ScreenGui holds everything on screen, and each player gets a copy in PlayerGui.
> - `button.Activated:Connect` runs your function on every click or tap.
> - A UDim2 mixes scale (a fraction of the screen) with offset (pixels).

> **Done when** every goal is ticked. One idea to keep: GUIs live in each player's
> own PlayerGui, so a GUI script finds its buttons through `script.Parent`, not
> through StarterGui.
</div>


<!-- ═══════════════════════════ 10.3 ═══════════════════════════ -->
<div id="md-10.3" hidden>
# RemoteEvents

The client can see the button press. The server owns the coins. Somehow the
button press has to get across. A **RemoteEvent** is a doorway between the two:
one side fires it, the other side hears it.

## Warm up

From memory:

```lua predict=p10-warm-remote
-- a LocalScript in StarterPlayerScripts
local Players = game:GetService("Players")

local player = Players.LocalPlayer
player.leaderstats.Coins.Value = 9999
```

## Make the doorway

A RemoteEvent is an Instance. Both sides need to be able to see it, so it goes in
**ReplicatedStorage** — a service whose contents are copied to the server **and**
every client.

```task=u10-remote-make
- In Explorer, hover over **ReplicatedStorage**, click **+** and add a **RemoteEvent**
- Rename it `SayHello`
```

> **Key idea** A RemoteEvent lives in ReplicatedStorage so that the server and every client can see it.

## Client to server: FireServer

The client sends. Make a ScreenGui with a TextButton called `HelloButton`, like
last lesson, and give it a LocalScript:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local sayHello = ReplicatedStorage:WaitForChild("SayHello") -- @n waits until the RemoteEvent has arrived from the server
local button = script.Parent:WaitForChild("HelloButton")

button.Activated:Connect(function()
	sayHello:FireServer("hi there")
end)
```

The server listens. A Script in ServerScriptService:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local sayHello = ReplicatedStorage.SayHello

sayHello.OnServerEvent:Connect(function(player, message) -- @n Roblox fills in `player`; `message` is what the client sent
	print(player.Name, "says", message)
end)
```

Press Play and click the button.

```output
YourName says hi there  -  Server - Script:6
```

The click happened on the client. The print happened on the server. Something
crossed over.

Look carefully at the two ends:

- The client called `FireServer("hi there")` — **one** thing.
- The server's function got **two**: `player` and `message`.

Roblox adds the player **itself**, at the front, every time. The client cannot
choose it and cannot fake it. That `player` is the only thing you get from a
client that you can fully trust.

```lua predict=p10-player-first
-- client
remote:FireServer(50)

-- server
remote.OnServerEvent:Connect(function(amount)
	print(amount)
end)
```

```task=u10-remote-fire
- Build the button, the LocalScript and the server Script
- Click the button and see the **Server** line in Output
- Send a number as well as the message, and print both on the server
```

> **Key idea** `OnServerEvent` always gets the player first, added by Roblox, so a client cannot fake who it is.

## Server to client: FireClient

It works the other way too. The server picks **which** player to tell:

```lua
-- server Script
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local notify = ReplicatedStorage:WaitForChild("Notify")

Players.PlayerAdded:Connect(function(player)
	task.wait(3)
	notify:FireClient(player, `Welcome, {player.Name}!`) -- @n `player` chooses who gets it; everyone else hears nothing
end)
```

```lua
-- LocalScript in StarterPlayerScripts
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local notify = ReplicatedStorage:WaitForChild("Notify")

notify.OnClientEvent:Connect(function(message)
	print(message)
end)
```

```output
Welcome, YourName!  -  Client - LocalScript:7
```

`FireClient` needs to know who to send to, so the player goes first. On the
client side there is no player argument — it can only ever be you.
`FireAllClients(...)` sends to everyone at once, which is how a game tells all
players *round starting*.

| from | to | send with | listen with |
|---|---|---|---|
| client | server | `remote:FireServer(...)` | `remote.OnServerEvent` — gets `player` first |
| server | one client | `remote:FireClient(player, ...)` | `remote.OnClientEvent` |
| server | every client | `remote:FireAllClients(...)` | `remote.OnClientEvent` |

```task=u10-remote-client
- Add a second RemoteEvent called `Notify` to ReplicatedStorage
- Use `FireClient` to send a welcome, and see it arrive with a **Client** tag
- Change it to `FireAllClients` and test with **2 Players**
```

> **Key idea** The server uses `FireClient(player, ...)` to tell one player and `FireAllClients(...)` to tell everyone.

## Never trust the client

Here is a shop, written the obvious way. The client says what it bought and how
much it cost, and the server believes it:

```lua
-- server Script — DO NOT USE THIS
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local buy = ReplicatedStorage.Buy

buy.OnServerEvent:Connect(function(player, item, price)
	local coins = player.leaderstats.Coins
	coins.Value -= price
	print(player.Name, "bought", item)
end)
```

Anyone with a cheat program can run their own code on **their** client and fire
any RemoteEvent with anything in it — they do not need your button at all.
`buy:FireServer("Sword", -1000000)` and they now have a million coins. A client
can send a price of `0`, a string instead of a number, or fire 500 times a
second.

The fix is to make the server decide everything that matters. The client only
says **what it wants**. The server looks up the real price, checks the player can
afford it, and then does it:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local buy = ReplicatedStorage.Buy

local PRICES = {
	Sword = 100,
	Shield = 60,
}

buy.OnServerEvent:Connect(function(player, item)
	local price = PRICES[item] -- @n a bad name gives `nil` here, so `price` is `nil`
	if not price then
		return               -- not a real item, or not even a string
	end

	local coins = player.leaderstats.Coins
	if coins.Value >= price then
		coins.Value -= price
		print(player.Name, "bought", item)
	else
		print(player.Name, "cannot afford", item)
	end
end)
```

```output
YourName cannot afford Sword  -  Server - Script:21
```

Every remote handler on the server asks the same three questions:

1. **Is the request even sensible?** A real item, a number where a number should
   be. If not, `return` and do nothing.
2. **Is this player allowed?** Enough coins, close enough to the shop, not on
   cooldown.
3. **Then the server does it**, with the server's own numbers — never numbers the
   client sent.

```lua predict=p10-trust
buy.OnServerEvent:Connect(function(player, item)
	local price = PRICES[item]
	if not price then
		return
	end
	-- ...
end)

-- a cheater runs this on their client
buy:FireServer({ "Sword" })
```

```task=u10-remote-trust
- Add a RemoteEvent called `Buy` and the safe server script above
- Give yourself 150 coins with a `leaderstats` script, then fire `Buy` with `"Sword"` from a button
- Fire it with `"Rocket"` and with `-5` — check nothing happens either time
```

> **Key idea** The client says what it wants, and the server checks it and uses its own numbers.

## Fix the bug

This server script should give the player who pressed the button a speed boost.
It errors the moment the button is pressed:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local boost = ReplicatedStorage.Boost

boost.OnServerEvent:Connect(function()
	local character = player.Character
	character.Humanoid.WalkSpeed = 30
end)
```

```output
! ServerScriptService.Script:6: attempt to index nil with 'Character'  -  Server - Script:6
```

```solution
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local boost = ReplicatedStorage.Boost

boost.OnServerEvent:Connect(function(player)
	local character = player.Character
	if character then
		character.Humanoid.WalkSpeed = 30
	end
end)
```

The function never asked for its first argument, so `player` is an unknown global
— `nil`. Studio underlines it for you. `OnServerEvent` always gives you the player
first; you just have to give it a name. The `if character then` is a bonus: a
player who is between respawns has no character.

## Your turn

*Optional practice: the stop clears without it.*

A **cooldown**: the server only lets each player ring a bell once every 3 seconds.

- a RemoteEvent `RingBell`, a button that fires it, no arguments
- the server prints `YourName rang the bell` — but if the same player rings again
  within 3 seconds, it prints `too soon` instead
- each player has their own cooldown: use a dictionary keyed by player, and
  `os.clock()` for the time (it gives the number of seconds since the server
  started, as a decimal)

Click fast:

```output
YourName rang the bell  -  Server - Script:16
too soon  -  Server - Script:11
```

```solution
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local ringBell = ReplicatedStorage.RingBell

local COOLDOWN = 3
local lastRing = {}

ringBell.OnServerEvent:Connect(function(player)
	local now = os.clock()
	if lastRing[player] and now - lastRing[player] &lt; COOLDOWN then
		print("too soon")
		return
	end

	lastRing[player] = now
	print(player.Name, "rang the bell")
end)
```

The cooldown lives on the **server**. A cooldown kept only on the client would
stop honest players and nobody else.

The `lastRing` table keeps one entry per player forever. In a real game you would
clear it with `Players.PlayerRemoving`, as in unit 8.

> **Recap**
> - A RemoteEvent in ReplicatedStorage carries messages between client and server.
> - `OnServerEvent` gets the player first, and `FireServer` does not send it.
> - The server checks every request and uses its own numbers.

> **Done when** every goal is ticked. One idea to keep: the client asks, the server
> decides. Never use a number the client sent for anything that matters.
</div>


<!-- ═══════════════════════════ 10.4 ═══════════════════════════ -->
<div id="md-10.4" hidden>
# Build: a boost shop

A shop on the screen. You earn a coin every second. Spend 10 on a speed boost or
15 on a jump boost, and for 15 seconds you are faster or bouncier than everyone
else. The buttons are on the client, the coins and the boosts are on the server,
and two RemoteEvents carry messages between them.

This is the shape of every shop on Roblox. Once it works you can sell anything.

## Warm up

From memory:

```lua predict=p10-warm-build
local ITEMS = {
	Speed = { price = 10 },
	Jump = { price = 15 },
}

local item = ITEMS["Jump"]
print(item.price)
```

## Set up by hand

The GUI is easier to lay out by hand than from a script, so build it in Explorer.
Names matter: the scripts look for them exactly.

```task=u10-build-setup
- In **ReplicatedStorage** add two **RemoteEvent**s: `BuyItem` and `ShopResult`
- In **StarterGui** add a **ScreenGui** named `ShopGui`
- Inside `ShopGui` add two **TextLabel**s named `CoinLabel` and `Message`
- Inside `ShopGui` add two **TextButton**s named `SpeedButton` and `JumpButton`. Set their `Text` to `Speed: 10` and `Jump: 15`.
- Drag the four so none overlap. Put the buttons along the bottom of the screen.
```

## The server

Add a **Script** to ServerScriptService:

```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local buyItem = ReplicatedStorage:WaitForChild("BuyItem")
local shopResult = ReplicatedStorage:WaitForChild("ShopResult")

-- settings: the catalogue lives on the server, where no client can change it
local ITEMS = {
	Speed = { price = 10, property = "WalkSpeed", boosted = 32, normal = 16 },
	Jump = { price = 15, property = "JumpHeight", boosted = 25, normal = 7.2 },
}
local BOOST_TIME = 15   -- seconds a boost lasts
local INCOME = 1        -- coins every second, so there is something to spend

Players.PlayerAdded:Connect(function(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Value = 0
	coins.Parent = leaderstats
end)

local function onBuy(player, itemName)
	-- 1. is the request sensible?
	local item = ITEMS[itemName]
	if not item then
		return
	end

	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health == 0 then
		return
	end

	-- 2. is this player allowed?
	if humanoid[item.property] == item.boosted then -- @n square brackets read the property whose name is in `item.property`
		shopResult:FireClient(player, `{itemName} is already on`)
		return
	end

	local coins = player.leaderstats.Coins
	if coins.Value &lt; item.price then
		shopResult:FireClient(player, `Need {item.price - coins.Value} more coins`)
		return
	end

	-- 3. the server does it, with its own numbers
	coins.Value -= item.price
	humanoid[item.property] = item.boosted
	shopResult:FireClient(player, `{itemName} boost for {BOOST_TIME} seconds!`)
	print(player.Name, "bought", itemName)

	task.delay(BOOST_TIME, function() -- @n runs the inner function later; the script carries on right away
		humanoid[item.property] = item.normal
		shopResult:FireClient(player, `{itemName} boost ran out`)
	end)
end

buyItem.OnServerEvent:Connect(onBuy)

-- pay everyone, forever
while true do
	task.wait(1)
	for _, player in Players:GetPlayers() do
		local leaderstats = player:FindFirstChild("leaderstats")
		if leaderstats then
			leaderstats.Coins.Value += INCOME
		end
	end
end
```

> **Key idea** The server owns the catalogue, the coins and the boosts, and checks each request before it acts.

## The client

Add a **LocalScript** directly inside `ShopGui`:

```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local buyItem = ReplicatedStorage:WaitForChild("BuyItem")
local shopResult = ReplicatedStorage:WaitForChild("ShopResult")

local player = Players.LocalPlayer
local gui = script.Parent
local coinLabel = gui:WaitForChild("CoinLabel")
local message = gui:WaitForChild("Message")
local speedButton = gui:WaitForChild("SpeedButton")
local jumpButton = gui:WaitForChild("JumpButton")

local coins = player:WaitForChild("leaderstats"):WaitForChild("Coins")

local function showCoins()
	coinLabel.Text = `Coins: {coins.Value}`
end

coins.Changed:Connect(showCoins) -- @n no brackets: we pass the function in, we do not call it yet
showCoins()

speedButton.Activated:Connect(function()
	buyItem:FireServer("Speed")
end)

jumpButton.Activated:Connect(function()
	buyItem:FireServer("Jump")
end)

shopResult.OnClientEvent:Connect(function(text)
	message.Text = text
	print(text)
end)
```

Press Play. Watch the coin label tick up. Press **Speed** straight away, then
again once you have 10.

<!-- lint: skip script-lines -->
```output
Need 7 more coins  -  Client - LocalScript:33
YourName bought Speed  -  Server - Script:55
Speed boost for 15 seconds!  -  Client - LocalScript:33
Speed boost ran out  -  Client - LocalScript:33
```

(Your "more coins" number depends on how fast you clicked.)

```task=u10-build-run
- Write both scripts and press Play
- Watch the coin label count up on its own
- Buy a speed boost and run around, then wait for it to run out
- Buy a jump boost, then try to buy it again while it is on
```

> **Key idea** The client only draws the screen and sends a name, and the server's answer comes back through `ShopResult`.

## How it works

- **Two RemoteEvents, two directions.** `BuyItem` carries *I want this* from
  client to server. `ShopResult` carries *here is what happened* back.
- **The client only sends a name.** `"Speed"`. Not a price, not a speed. Fire
  `BuyItem` with `"Speed", 0` from a cheat and the extra `0` is simply ignored —
  the server's `onBuy` never even looks for it.
- **The catalogue is a table of tables** on the server. `ITEMS[itemName]` is
  `nil` for anything that is not a real item, so one check handles typos and
  cheaters alike.
- **`humanoid[item.property]`** reads a property whose name is in a variable.
  Brackets work on Instances just as they work on dictionaries:
  `humanoid["WalkSpeed"]` is the same as `humanoid.WalkSpeed`. That is how one
  `onBuy` serves both items.
- **`character and character:FindFirstChildOfClass("Humanoid")`** is the `and`
  trick from unit 3: if there is no character, stop at `nil` instead of erroring.
- **The order of the checks** is the three questions from 10.3: sensible, allowed,
  then do it.
- **`coins.Changed`** is new. On an `IntValue` it fires every time `Value`
  changes. The client calls `showCoins` once by hand too, so the label is right
  before the first change.
- **The coin values replicate.** The server changes `Coins`, Roblox copies it to the
  client, `Changed` fires there, and the label updates. The client never adds
  coins itself.

One honest gap: if you respawn mid-boost, your new character starts at normal
speed, and the old timer quietly sets the old, gone Humanoid. Harmless — but a
boost does not survive dying.

> **Key idea** The client sends only a name, and everything else comes from the server's own table.

## Change one number

```task=u10-build-tweak
- Make the boost last 5 seconds instead of 15
- Set `INCOME` to `5` so you can afford things faster
- Make speed cost 30 and give 60 WalkSpeed. Only the server script changes.
```

## Test the security

You are going to cheat at your own game. A LocalScript can fire any RemoteEvent
with anything in it — so pretend to be a cheater:

```lua
-- a cheat: a second LocalScript in StarterPlayerScripts
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local buyItem = ReplicatedStorage:WaitForChild("BuyItem")

buyItem:FireServer("Speed", 0)
buyItem:FireServer("Fly")
buyItem:FireServer(nil)
buyItem:FireServer({ price = 0 })
```

```task=u10-build-cheat
- Add the cheat LocalScript and press Play straight away, before you have 10 coins
- Check that your coins are not spent and you are not faster
- Check Output has no red errors from the server script
- Delete the cheat script
```

`ITEMS[nil]` is `nil` and `ITEMS[{ price = 0 }]` is `nil`, so every bad request
stops at the very first check. That is what *never trust the client* looks like
when it works.

> **Key idea** A bad request stops at the first check, because `ITEMS[...]` is `nil` for anything that is not a real item.

## Make it yours

Try at least one:

- Add a third item. Only the `ITEMS` table and one button need to change on the
  server side — your `onBuy` already handles it.
- Grey out a button while its boost is on: send the server's answer back and set
  the button's `BackgroundTransparency`.
- Show a countdown on the client: `Speed: 14`, `Speed: 13`... using a `for` loop
  and `task.wait(1)`.
- Swap the passive income for the coins from the 9.4 coin rush.
- Add a `MaxHealth` item that gives 200 health.

```task=u10-build-own
- Add something of your own to the shop
- Test it with **2 Players** and check one player's boost does not affect the other
- Show it to someone
```

> **Recap**
> - The client draws the GUI and sends requests, and the server holds the coins.
> - `BuyItem` carries a name to the server and `ShopResult` carries the answer back.
> - The server checks that a request is sensible and allowed, then does it with its own numbers.

> **Done when** every goal is ticked. That is the full client–server loop: a
> button on one screen, a request across a RemoteEvent, a server that checks
> everything, and an answer back.
</div>


<!-- ═══════════════════════════ cheat-10 ═══════════════════════════ -->
<div id="md-cheat-10" hidden>
# Client and server cheatsheet

Everything from the client and server unit on one page. Keep it open next to
Studio.

## Who runs what

| | server | client |
|---|---|---|
| script kind | `Script` | `LocalScript` |
| put it in | ServerScriptService | StarterPlayerScripts, StarterCharacterScripts, StarterGui |
| how many | one, for the whole game | one per player, on their device |
| Output tag | `Server - Script:N` | `Client - LocalScript:N` |
| `Players.LocalPlayer` | `nil` | you |
| good for | scores, health, doors, coins, who won | GUI, camera, effects, reading input |

## What replicates

- The server changes something → **every** client sees it.
- A client changes something → **only that client** sees it.
- ReplicatedStorage: both sides can see it. Put RemoteEvents and shared things here.
- ServerScriptService and ServerStorage: the server only. Clients cannot see in.

## GUIs

```lua
-- LocalScript inside a ScreenGui
local gui = script.Parent                       -- your own copy, in PlayerGui
local label = gui:WaitForChild("Counter")
local button = gui:WaitForChild("ClickButton")

button.Activated:Connect(function()             -- click, tap or gamepad
	label.Text = "Pressed"
end)

label.Visible = false
label.TextColor3 = Color3.fromRGB(255, 255, 255)
```

StarterGui is the template. Each player gets a copy in `player.PlayerGui` — change
that copy, not the template.

## UDim2

```lua
UDim2.new(xScale, xOffset, yScale, yOffset)
UDim2.fromScale(0.5, 0.5)       -- fractions of the screen
UDim2.fromOffset(200, 50)       -- pixels

button.AnchorPoint = Vector2.new(0.5, 0.5)   -- position by the middle
button.Position = UDim2.fromScale(0.5, 0.5)  -- dead centre
```

Scale for where things go. Offset for exact small sizes and gaps.

## RemoteEvents

```lua
-- client to server
remote:FireServer("Sword")
remote.OnServerEvent:Connect(function(player, item)   -- player is added for you
end)

-- server to one client
remote:FireClient(player, "Welcome!")
remote.OnClientEvent:Connect(function(message)
end)

-- server to everyone
remote:FireAllClients("Round starting")
```

## A safe server handler

```lua
remote.OnServerEvent:Connect(function(player, itemName)
	local item = ITEMS[itemName]           -- 1. sensible? look it up yourself
	if not item then return end

	local coins = player.leaderstats.Coins
	if coins.Value &lt; item.price then       -- 2. allowed?
		return
	end

	coins.Value -= item.price             -- 3. do it with the server's numbers
end)
```

## Value objects

```lua
coins.Changed:Connect(function(newValue)   -- IntValue, NumberValue, StringValue...
	print(newValue)
end)
```

## Messages you will see

| in Output | usually means |
|---|---|
| nothing at all from a script | it is in the wrong place — a LocalScript in ServerScriptService, or a Script in StarterPlayerScripts |
| *attempt to index nil with 'Name'* on `LocalPlayer` | you used `Players.LocalPlayer` in a server Script |
| GUI does not change, no error | you changed the template in StarterGui, not the copy in PlayerGui |
| orange *Infinite yield possible on ...WaitForChild* | the name is spelled differently, or the thing is somewhere else |
| *attempt to index nil with 'Character'* in `OnServerEvent` | the function did not name its first argument `player` |
| a part you made is missing in Server view | a LocalScript made it, so only that client has it |
| *attempt to compare nil* or *number with string* in a handler | a client sent something unexpected — check it before using it |

## The rules

1. The server is the truth. Clients show it and send requests.
2. Changes on the server reach everyone. Changes on a client stay there.
3. A LocalScript only runs in StarterPlayerScripts, StarterCharacterScripts or
   StarterGui.
4. GUI scripts find their buttons through `script.Parent`.
5. Use `Activated` for buttons so every device works.
6. `OnServerEvent` always gets the player first.
7. The client says *what it wants*. The server decides *what happens*.
8. Never use a price, amount or position the client sent for anything that matters.
</div>
