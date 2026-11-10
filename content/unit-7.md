<!-- ════════════════════════════════════════════════════════════════════
     UNIT 7 — THE WORLD
     Same format as lessons.md. No raw less-than or ampersand anywhere:
     write &lt; and &amp; even inside code fences.
     ════════════════════════════════════════════════════════════════════ -->

<!-- ═══════════════════════════ 7.1 ═══════════════════════════ -->
<div id="md-7.1" hidden>
# Finding things

So far your scripts have made their own parts, or reached for the Baseplate by
name. Real games are the other way round: the world is already built, and the
script has to go and find what it needs. The tree in Explorer is the map, and
this lesson is how to read it from code.

```lua predict=p7-warm1
local fruits = {"apple", "pear"}
table.insert(fruits, "plum")
print(#fruits)
```

## Build something to find

You have made parts from a script. This time, build them by hand — the way a
level designer would — so your script has something to go looking for.

```task=u7-look
- In Explorer, hover over **Workspace** and click the **+**, then **Part**
- Rename it `Crate`, set its **Anchored** property to `true`
- Select it and press **Ctrl+D** (**Cmd+D** on a Mac) twice to make two copies
- Make the three crates sit apart from each other
- Hover over **Workspace**, click **+**, pick **Folder**, and name it `Crates`
- Drag all three crates into the `Crates` folder
- Click + on one crate and add a **PointLight** inside it
```

## Reaching in with a dot

The dot you have been using for properties also walks down the tree:

```lua
local crates = workspace.Crates

print(crates.Name)
print(crates.Parent)
print(crates.ClassName)
```

```output
Crates  -  Server - Script:3
Workspace  -  Server - Script:4
Folder  -  Server - Script:5
```

`workspace.Crates` means *the child of Workspace called Crates*. `.Name` and
`.Parent` are really just properties like `Color` and `Size` — every Instance has
them. A **Folder** is an Instance whose only job is to hold other Instances, so
your tree does not turn into a mess.

## When the dot cannot find it

A dot is impatient. If the name is not there, the script stops:

```lua
local barrels = workspace.Barrels
print(barrels.Name)
```

```output
! ServerScriptService.Script:1: Barrels is not a valid member of Workspace "Workspace"  -  Server - Script:1
```

The error names the thing you asked for and where you asked. Check the spelling
first, then check the capital letters: it must be `Crates`, not `crates`.

A script that dies the moment a folder is missing is not much use, so there is a
method that asks instead of demanding.

> **Key idea** A dot on a name that is missing stops the whole script with an error.

## FindFirstChild

`FindFirstChild` looks for a child by name. If it is there you get the Instance;
if it is not, you get `nil` — and a script can survive `nil`:

```lua
local crates = workspace:FindFirstChild("Crates")

if crates then -- @n `nil` counts as false, so a missing folder skips to the else
	print("Found:", crates.Name)
else
	print("No Crates folder in this game")
end
```

```output
Found: Crates  -  Server - Script:4
```

A `:` calls a **method** — a function that belongs to that Instance. You have
used one all along: `game:GetService("Players")`. `game:GetService` is *the
GetService method of game*. `workspace:FindFirstChild` is the same shape.

Get used to `FindFirstChild` for anything a player or another script could have
changed. It is the difference between a script that crashes and a script that
says something helpful.

```lua predict=p7-find
print(workspace:FindFirstChild("Ghost") == nil)
```

> **Key idea** A missing child gives `nil` instead of an error, so check it with `if` before you use it.

## WaitForChild: waiting for it to turn up

Some things do not exist yet when the script starts. Parts made by another script,
and anything belonging to a player, appear later. `WaitForChild` waits for
exactly that:

```lua
print(workspace:FindFirstChild("LatePart"))

local late = workspace:WaitForChild("LatePart") -- @n The script pauses on this line until LatePart exists
print("It arrived:", late.Name)
```

```output
nil  -  Server - Script:1
It arrived: LatePart  -  Server - Script:4
```

To see the wait actually happen, let a second script create the part after a
delay. Add a second **Script** to ServerScriptService with this in it, and run the
script above as well:

```lua
task.delay(3, function()
	local part = Instance.new("Part")
	part.Name = "LatePart"
	part.Anchored = true
	part.Position = Vector3.new(0, 5, 0)
	part.Parent = workspace
end)
```

`task.delay(3, ...)` runs that function three seconds from now and lets the rest
of the script carry on immediately.

If the name never appears, Output shows a warning in orange:
*Infinite yield possible on 'Workspace:WaitForChild("LatePart")'*. That is Studio
saying *I have waited five seconds and I am still waiting*. The script is not
dead — but nine times out of ten it means you misspelled the name.

```lua predict=p7-wait
task.delay(3, function()
	print("part is here")
end)

print("script still going")
```

```task=u7-find
- Add the `task.delay` script as a **second** Script and press Play
- Watch `nil` print first, then the part arrive three seconds later
- Change the name in `WaitForChild` to something wrong and read the orange warning
```

> **Key idea** `WaitForChild` pauses until the child exists, so use it for things that turn up later.

## GetChildren: everything inside

`GetChildren` hands you a table of the folder's direct children:

```lua
local crates = workspace:FindFirstChild("Crates")

for i, crate in ipairs(crates:GetChildren()) do -- @n `GetChildren()` is the table that `ipairs` loops over
	crate.Color = Color3.fromRGB(150, 100, 60)
	print(i, crate.Name)
end
```

```output
1 Crate  -  Server - Script:5
2 Crate  -  Server - Script:5
3 Crate  -  Server - Script:5
```

Three crates, three lines, all of them brown now. All three lines say
`Script:5`, because they all come from the same `print`: the loop runs it once
per child. The **order is not guaranteed**: it may
not match what you see in Explorer, so never rely on child number 2 being *the*
second crate. If order matters, sort the list with `table.sort`, like you did in unit 6.

This is where loops stop being exercises and start being the way you work. Adding
a fourth crate by hand needs no change to this script at all.

> **Key idea** `GetChildren` gives you a table of what is inside, so a loop can run over it, but the order is not guaranteed.

## IsA: is this the kind of thing I want?

Folders hold whatever you put in them — parts, sounds, lights. `IsA` asks whether
an Instance is of a class, and it says yes to *anywhere in the family*:

```lua
local crates = workspace:FindFirstChild("Crates")

for i, thing in ipairs(crates:GetChildren()) do
	print(thing.Name, thing.ClassName, thing:IsA("BasePart"))
end
```

```output
Crate Part true  -  Server - Script:4
Crate Part true  -  Server - Script:4
Crate Part true  -  Server - Script:4
```

`ClassName` is exactly what the thing is: `Part`. `IsA("BasePart")` is true
because a Part, a MeshPart, a WedgePart and a TrussPart all belong to the BasePart
family — everything solid you can stand on. To pick out the solid things from a
mixed bag, `IsA("BasePart")` is the check you want.

```lua predict=p7-isa
local part = Instance.new("Part")
print(part.ClassName == "BasePart", part:IsA("BasePart"))
```

## GetDescendants and the whole tree

`GetChildren` looks one level down. `GetDescendants` looks all the way down —
children, grandchildren, everything:

```lua
local crates = workspace:FindFirstChild("Crates")

print("#children:", #crates:GetChildren())
print("#descendants:", #crates:GetDescendants())

for i, thing in ipairs(crates:GetDescendants()) do
	if thing:IsA("BasePart") then
		thing.Material = Enum.Material.Wood
	else
		print("skipping:", thing.Name)
	end
end
```

```output
#children: 3  -  Server - Script:3
#descendants: 4  -  Server - Script:4
skipping: PointLight  -  Server - Script:10
```

Three children: the three crates. The PointLight is not one of them — it sits
*inside* a crate, so it is that crate's child, the folder's grandchild. Four
descendants: the three crates plus the light buried in one of them.

That is the whole difference. `GetChildren` = one level. `GetDescendants` = every
level, including the parts of a character, the decorations on a model, and
anything else buried inside.

## Clone and Destroy

Once you can find something, you can copy it or remove it. **Clone** makes a
copy — including everything inside it — and the copy starts with no Parent, so
nobody can see it until you say where it goes:

```lua
local crates = workspace:FindFirstChild("Crates")
local first = crates:FindFirstChild("Crate")

local copy = first:Clone()
copy.Position += Vector3.new(0, 8, 0)
copy.Parent = crates -- @n Until this line the copy is not in the world at all
```

`Destroy` removes an Instance and everything under it, for good:

```lua
local crates = workspace:FindFirstChild("Crates")
local first = crates:FindFirstChild("Crate")

print("before:", #crates:GetChildren())
first:Destroy()
print("after:", #crates:GetChildren())
```

```output
before: 3  -  Server - Script:4
after: 2  -  Server - Script:6
```

Note what `Destroy` did *not* do: the variable `first` still holds the old
Instance. It is out of the tree, out of the game, but the variable is fine — it
just points at something that is no longer anywhere. Printing `first.Parent`
afterwards gives `nil`.

`Clone` and `Destroy` are how most games make things appear and disappear: keep a
template part in a hidden folder, clone it, move the copy, parent it. You will do
exactly that in unit 11.

## Fix the bug

This should turn every crate brown. Instead it stops with an error:

```lua
local crates = workspace:FindFirstChild("Crates")

for i, crate in ipairs(crates) do
	crate.Color = Color3.fromRGB(150, 100, 60)
end
```

```output
! ServerScriptService.Script:3: invalid argument #1 to 'ipairs' (table expected, got Instance)  -  Server - Script:3
```

Read it closely: `ipairs` wanted a **table** and got an **Instance**. A Folder is
not a list of its contents — you have to ask it for them.

```solution
local crates = workspace:FindFirstChild("Crates")

for i, crate in ipairs(crates:GetChildren()) do
	crate.Color = Color3.fromRGB(150, 100, 60)
end
```

`crates` is the folder. `crates:GetChildren()` is the table of things inside it.
Forgetting those brackets is one of the most common Roblox mistakes there is.

```task=u7-loop
- Run the broken script and read the error in Output
- Add `:GetChildren()` and watch every crate turn brown
- Add a fourth crate by hand and press Play again — the loop picks it up
- Delete one crate with `:Destroy()` and watch the count drop
```

## Your turn

Fill a line with crates without touching the mouse. Make one more part by hand
in Workspace and name it `Template`. Then write a script that makes a new Folder
called `Row`, clones the template ten times into it, spaces the copies five
studs apart along the X axis, and prints how many crates the folder holds at the
end. It should say:

```output
crates now: 10  -  Server - Script:14
```

```solution
local template = workspace:WaitForChild("Template")

local row = Instance.new("Folder")
row.Name = "Row"
row.Parent = workspace

for i = 1, 10 do
	local crate = template:Clone()
	crate.Anchored = true
	crate.Position = Vector3.new(i * 5, 3, 0)
	crate.Parent = row
end

print("crates now:", #row:GetChildren())
```

(Your line number will be wherever your `print` ends up. That is fine.)

The template stays untouched — a clone never changes the original. Notice the
copy also keeps its name, so all ten are called `Template`. Names do not have to
be unique, which is why `FindFirstChild` gives you *a* child with that name, not
necessarily the one you meant.

```task=u7-turn
- Write the clone-a-row script yourself before opening the solution
- Check the ten crates line up in the world
- Change the spacing and the count to something of your own
```

> **Recap**
> - A dot on a missing name is an error; `FindFirstChild` gives `nil` instead.
> - `GetChildren` is one level down; `GetDescendants` is every level.
> - `Clone` makes a copy with no Parent; `Destroy` removes an Instance for good.

> **Done when** all four checklists are ticked. The big idea: a dot walks the
> tree and stops the script if the name is missing; `FindFirstChild` and `WaitForChild` ask
> politely and give you `nil` instead. Use the polite ones.
</div>


<!-- ═══════════════════════════ 7.2 ═══════════════════════════ -->
<div id="md-7.2" hidden>
# CFrame

Everything you have moved so far has been moved with `Position` — a point in
space with no direction. A part can also *face* somewhere. A door faces the
street. A turret aims at a player. That is what **CFrame** holds: a position and
a direction, together, in one value.

```lua predict=p7-warm2
local function double(n)
	return n * 2
end

print(double(double(3)))
```

## CFrame is Position plus a turn

```lua
local part = Instance.new("Part")
part.Anchored = true
part.Parent = workspace

part.CFrame = CFrame.new(0, 5, 0)
print(part.Position)
print(part.CFrame.Position)
```

```output
0, 5, 0  -  Server - Script:6
0, 5, 0  -  Server - Script:7
```

Both lines give the same point. `CFrame.new(x, y, z)` sets a position *and* a
direction, and by default the direction is "facing straight ahead, not tilted".
The direction has a name: the part's **orientation**. Click a part in Studio and
you can see both in the Properties window — **Position** and **Orientation**.

So which should you use? `Position` when you only care about where. `CFrame` when
you care which way it faces, or when you want to move it *along the way it
faces*.

> **Key idea** A `CFrame` holds where a part is and which way it faces, while `Position` holds only where.

## Turning

To give a part an orientation, multiply a position by an angle:

```lua
local part = Instance.new("Part")
part.Anchored = true
part.Parent = workspace

part.CFrame = CFrame.new(0, 5, 0) * CFrame.Angles(0, math.rad(45), 0) -- @n Go to 0, 5, 0, then turn 45 degrees around y
print(math.round(part.Orientation.Y)) -- @n Orientation is in degrees, so this prints 45
```

```output
45  -  Server - Script:6
```

`math.round` is there because the real number can come out as something like
`45.00000250447816` — computers store decimals very slightly off. Rounding hides
the noise.

```task=u7-cframe
- Paste the turning script, press Play, and find the part
- Click it and find **Orientation** in the Properties window
- Change `45` to `90`, then try the turn on the x axis instead of y
```

`CFrame.Angles(x, y, z)` is a **turn** with no position. The three numbers are
turns around the three axes:

- **x** — pitch: nose up, nose down
- **y** — yaw: turning left and right, like a person
- **z** — roll: a barrel roll, like an aeroplane wing over wing

The numbers inside `CFrame.Angles` are in **radians**, not degrees, and there are
about 6.28 radians in a full circle. Nobody wants to think in those, so `math.rad`
converts degrees for you: `math.rad(45)` is 45 degrees as a radian. Use it every
single time and you will never have to think about radians again.

`math.rad(180)` prints as `3.141592653589793` — pi, the same thing you met in
school. There is no degree version of `CFrame.Angles`; `math.rad` is the normal
way to write it, and you will see it in every Roblox tutorial you ever read.

```lua predict=p7-rad
local part = Instance.new("Part")
part.Anchored = true
part.CFrame = CFrame.new(0, 5, 0) * CFrame.Angles(0, 90, 0)
part.Parent = workspace
print(part.Orientation)
```

> **Key idea** `CFrame.Angles` wants radians, so wrap your degrees in `math.rad`.

## Multiplying CFrame means "and then"

The `*` is doing something clever. `CFrame.new(0, 5, 0) * CFrame.Angles(0, math.rad(90), 0)`
reads as *go to 0, 5, 0, and then turn 90 degrees*. The second CFrame is applied
**relative to the first**, not to the world.

That reading is the whole trick, because the thing being moved can be a part:

```lua
local walker = Instance.new("Part")
walker.Size = Vector3.new(2, 2, 2)
walker.Anchored = true
walker.CFrame = CFrame.new(0, 3, -10)
walker.Color = Color3.fromRGB(255, 170, 0)
walker.Parent = workspace

for step = 1, 4 do
	task.wait(0.5)
	walker.CFrame *= CFrame.new(0, 0, -5) -- @n Short for walker.CFrame = walker.CFrame * CFrame.new(0, 0, -5)
	print(`walker at step {step}`)
end
```

```output
walker at step 1  -  Server - Script:11
walker at step 2  -  Server - Script:11
walker at step 3  -  Server - Script:11
walker at step 4  -  Server - Script:11
```

The part walks five studs *along its own forward direction* each time, because
`CFrame.new(0, 0, -5)` means "five studs forward, from where I am and whichever
way I am facing".

Two directions matter here, and they are not the same:

- `CFrame.new(x, y, z) * ...` — **from the world origin**, absolute.
- `part.CFrame * CFrame.new(...)` — **from where the part already is**, relative.

If you use the first one in a loop you keep teleporting back towards the middle
of the world. The second one moves it on from wherever it stands.

Turn it too, and you get something that walks in a curve:

```lua
walker.CFrame *= CFrame.new(0, 0, -5) * CFrame.Angles(0, math.rad(45), 0)
```

Five studs forward, then a 45 degree turn: repeat that and the part walks around
an octagon back to where it started. The order inside one multiplication matters —
forward *then* turn is a different path from turn *then* forward. When a shape
comes out wrong, try swapping them.

> **Key idea** The `*` means and then: the right-hand CFrame is applied from wherever the left one ended.

## Your turn: a ring of stones

Put twelve thin parts in a circle, each one turned to face outwards from the
centre, like standing stones round a fire. They should sit on a circle of radius
12 around the middle of the world, standing on the ground — twelve stones in the positions of
the hours on a clock face. At the end, print how many you placed:

```output
Placed 12 stones  -  Server - Script:20
```

```solution
local CENTRE = Vector3.new(0, 0, 0)
local RADIUS = 12
local COUNT = 12

for i = 1, COUNT do
	local angle = (i / COUNT) * math.pi * 2

	local stone = Instance.new("Part")
	stone.Name = `Stone{i}`
	stone.Anchored = true
	stone.Size = Vector3.new(3, 6, 1)
	stone.Color = Color3.fromRGB(150, 150, 160)
	stone.Material = Enum.Material.Slate
	stone.CFrame = CFrame.new(CENTRE)
		* CFrame.Angles(0, -angle, 0)
		* CFrame.new(0, 3, -RADIUS)
	stone.Parent = workspace
end

print(`Placed {COUNT} stones`)
```

Read the CFrame line from left to right, like a sentence. *Go to the centre of
the world, turn to face this way, then step outwards twelve studs.* Because the
step comes **after** the turn, it always goes outwards from the middle — and
because the part was turned first, each stone faces away from the fire.

```task=u7-ring
- Paste in the ring script and press Play
- Find a stone and check its Orientation — every one is different
- Change `RADIUS` to `4` and press Play again
- Swap the order of the last two CFrame multiplications and look at what happens
```

## Facing something

There is one more CFrame helper worth meeting now, because it answers a question
you will ask constantly: *how do I point this thing at that thing?*

`CFrame.lookAt(from, to)` gives a CFrame at `from` that faces `to`. Stand it on
its end and it becomes a pointer:

```lua
local pointer = Instance.new("Part")
pointer.Size = Vector3.new(1, 1, 6)
pointer.Anchored = true
pointer.Color = Color3.fromRGB(125, 255, 175)
pointer.Material = Enum.Material.Neon
pointer.Parent = workspace

local target = Instance.new("Part")
target.Shape = Enum.PartType.Ball
target.Size = Vector3.new(2, 2, 2)
target.Anchored = true
target.Color = Color3.fromRGB(255, 95, 200)
target.Parent = workspace

local x = -20
for i = 1, 40 do
	x += 1
	target.Position = Vector3.new(x, 6, -14)
	pointer.CFrame = CFrame.lookAt(Vector3.new(0, 6, -4), target.Position) -- @n Stand at the first point and face the second
	task.wait(0.1)
end
```

The neon bar sweeps round to follow the ball as it slides past, ten studs in
front of it. No angles, no
radians, no maths — you said *start here, face there* and Roblox worked out the
turn.

```task=u7-walk
- Run the walker script and watch it step forward four times
- Add the 45 degree turn to its line and change the loop to 8 steps — an octagon
- Run the pointer script and watch it follow the ball
```

> **Key idea** `CFrame.lookAt(from, to)` points a part at a target with no angles to work out.

## Fix the bug

This is meant to spin a part where it stands. Instead the part jumps to the
middle of the world and sits there:

```lua
local rotor = Instance.new("Part")
rotor.Anchored = true
rotor.Size = Vector3.new(6, 1, 1)
rotor.Color = Color3.fromRGB(255, 170, 0)
rotor.CFrame = CFrame.new(10, 5, 0)
rotor.Parent = workspace

for i = 1, 20 do
	task.wait(0.1)
	rotor.CFrame = CFrame.Angles(0, math.rad(9), 0)
end
```

```solution
for i = 1, 20 do
	task.wait(0.1)
	rotor.CFrame *= CFrame.Angles(0, math.rad(9), 0)
end
```

`CFrame.Angles` carries no position — it is a turn and nothing else. Assigning it
straight onto the part threw away the `CFrame.new(10, 5, 0)` and left the part at
the origin. `*=` keeps what the part already has and turns it a bit more, twenty
times over: half a turn in two seconds.

```task=u7-spin
- Run the broken script, then the fixed one, and watch the difference
- Try `CFrame.new(0, 0, -5)` in place of the turn and see the part move instead
- Make it do a full turn instead of half
```

> **Recap**
> - A `CFrame` is a position and a direction in one value.
> - `CFrame.Angles` takes radians, so write `math.rad(degrees)`.
> - Use `*=` to move on from where the part is; a bare `CFrame.Angles` sends it to the origin.

> **Done when** all four checklists are ticked. `CFrame` = where **and** which
> way. Multiply to mean *and then*: `part.CFrame * something` moves it from where
> it stands, `CFrame.new(...) * something` moves it from the middle of the world.
</div>


<!-- ═══════════════════════════ 7.3 ═══════════════════════════ -->
<div id="md-7.3" hidden>
# Smooth motion with TweenService

You can move a part in a loop, but there is a better way for anything that should
glide. A **tween** takes a part from where it is to where you want it, smoothly,
over a set time, without you moving it yourself.

```lua predict=p7-warm3
local n = 1
while n &lt; 20 do
	print(n)
	n *= 2
end
```

## One tween, three pieces

```lua
local TweenService = game:GetService("TweenService")

local part = Instance.new("Part")
part.Anchored = true
part.Position = Vector3.new(0, 1, -10)
part.Color = Color3.fromRGB(255, 170, 0)
part.Parent = workspace

local info = TweenInfo.new(2)

local goal = { Position = Vector3.new(0, 20, -10) } -- @n Keys are property names; values are where they should end

local lift = TweenService:Create(part, info, goal) -- @n This only builds the tween. Nothing moves yet
lift:Play() -- @n The move starts here, and the script carries straight on

print("tween started")
```

```output
tween started  -  Server - Script:16
```

Three pieces, in this order:

1. **what** — `part`,
2. **how** — `info`, the timing,
3. **where to** — `goal`, a table of properties and the values to reach.

The `goal` table is a dictionary, from unit 6 — the keys are property names. Give
it two properties and both change at once, in the same two seconds:

```lua
local goal = {
	Position = Vector3.new(0, 20, -10),
	Color = Color3.fromRGB(125, 255, 175),
	Transparency = 0.4,
}
```

The part glides up, changing colour and fading as it goes. One tween, one
`Play()`, any number of properties.

```lua predict=p7-block
print("before")

local lift = TweenService:Create(part, TweenInfo.new(2), { Position = Vector3.new(0, 20, -10) })
lift:Play()

print("after")
```

> **Key idea** A tween is three things: what to move, how it moves, and where it ends up.

## TweenInfo: the how

`TweenInfo.new(2)` is the short form. The full form is a list, and each one
changes how the motion feels:

| | means | default |
|---|---|---|
| time | how many seconds the move takes | — (you must give this) |
| easing style | the shape of the speed-up and slow-down | `Enum.EasingStyle.Quad` |
| easing direction | that shape forwards, backwards, or both ways | `Enum.EasingDirection.Out` |
| repeat count | how many times to play again | `0` |
| reverses | play backwards after each play | `false` |
| delay | seconds to wait before starting | `0` |

`Enum.EasingStyle.Sine` and `Enum.EasingStyle.Quad` with direction `Out` are the
two that read as "smooth" to a player. `Enum.EasingStyle.Back` overshoots and
springs back; `Enum.EasingStyle.Bounce` bounces like a ball.

Put `repeat count` and `reverses` together and you get something that never
stops, without a loop in sight:

```lua
local bob = TweenService:Create(part,
	TweenInfo.new(1.2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true), -- @n Last two values: repeat for ever (-1), reverse each time
	{ Position = Vector3.new(0, 8, -10) })

bob:Play()
```

A repeat count of `-1` means for ever, and `true` for reversing makes it come
back down each time. Up, down, up, down, gently, for as long as the game runs.

> **Key idea** `TweenInfo` sets how the move feels, and a repeat count of `-1` with reverses on loops for ever.

## Play does not wait

Look at the Output from the example above once more: `tween started` prints
immediately, while the part is still on the ground. `:Play()` starts the tween and
returns straight away — the same as `task.spawn`. If you want to wait for it to
finish, ask it:

```lua
lift:Play()
lift.Completed:Wait()
print("the part has arrived")
```

`Completed` is a signal on the tween that fires when it stops; `:Wait()` pauses
your script until it does. Signals and `:Wait()` are the whole of the next unit,
so do not worry about the shape of that line yet — it is here because you will
need it, and it reads almost like English.

```task=u7-tween
- Run the lift script and watch the part rise over two seconds
- Change the time to `0.2` and again to `6` — same script, very different feel
- Try `Enum.EasingStyle.Bounce` and watch what the part does at the top
- Use the forever-and-back TweenInfo and let it bob
```

> **Key idea** `Play()` starts the tween and returns at once; `Completed:Wait()` is how you wait for the end.

## Turning with a tween

`goal` can hold a `CFrame` just as happily as a `Position`:

```lua
local info = TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
local goal = { CFrame = CFrame.Angles(0, math.rad(180), 0) }
```

Careful — this one is a trap. A CFrame of *turn 180 degrees, position zero* will
also slide the part to the middle of the world, exactly like the bug at the end of
the last lesson. Do not tween a bare `CFrame.Angles`. Build the CFrame you want
from the part's own:

```lua
local info = TweenInfo.new(1)
local goal = { CFrame = part.CFrame * CFrame.Angles(0, math.rad(180), 0) }
```

For a part that spins for ever, the loop is still the better tool:

```lua
task.spawn(function()
	while true do
		local dt = task.wait()
		part.CFrame *= CFrame.Angles(0, dt * 2, 0)
	end
end)
```

`task.wait()` with nothing in the brackets waits for a single frame and hands you
how many seconds that frame took. Multiplying the turn by that time makes the spin
the same speed on a fast machine and a slow one — worth knowing, and the reason
you will see `dt` in other people's code.

> **Key idea** Never tween a bare `CFrame.Angles`; build the goal from the part's own CFrame.

## Fix the bug

This script looks right and prints no errors. The part just never moves:

```lua
local TweenService = game:GetService("TweenService")

local door = Instance.new("Part")
door.Anchored = true
door.Size = Vector3.new(6, 8, 0.5)
door.Position = Vector3.new(0, 4, -10)
door.Parent = workspace

local info = TweenInfo.new(2)
local goal = { Position = Vector3.new(0, 12, -10) }

local slide = TweenService:Create(door, info, goal)
print("door should be opening")
```

```solution
local slide = TweenService:Create(door, info, goal)
slide:Play()
print("door should be opening")
```

`TweenService:Create` only builds the tween — it is a description of the move, not
the move. Without `:Play()` nothing happens and nothing complains. This is one of
the very few bugs in Roblox with no red line and no wrong answer to notice: the
game just quietly does not do what you asked.

```task=u7-door
- Run the broken script and confirm nothing moves
- Add `:Play()` and watch the door slide up
- Make it slide back down afterwards with a second tween
```

## Your turn

Write a door that slides up out of the way in one second, waits one second, and
slides back down in one second. Print a line as it starts opening and another as
it starts closing, and make sure the closing line only appears **after** the
door has finished opening:

```output
Door opening  -  Server - Script:17
Door closing  -  Server - Script:23
```

Your line numbers will differ. What matters is the two seconds between the lines.

```solution
local TweenService = game:GetService("TweenService")

local door = Instance.new("Part")
door.Anchored = true
door.Size = Vector3.new(6, 8, 0.5)
door.Position = Vector3.new(0, 4, -10)
door.Color = Color3.fromRGB(90, 70, 60)
door.Parent = workspace

local function slide(toY, time)
	local info = TweenInfo.new(time, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
	local tween = TweenService:Create(door, info, { Position = Vector3.new(0, toY, -10) })
	tween:Play()
	return tween
end

print("Door opening")
local up = slide(12, 1)
up.Completed:Wait()

task.wait(1)

print("Door closing")
slide(4, 1)
```

Two things in there are worth keeping for later. The small `slide` function means
the two moves share one description, so they always match — that is unit 5 paying
off. And `Completed:Wait()` is what makes the script pause instead of piling the
moves on top of each other.

```task=u7-turn-tween
- Write the door yourself before opening the solution
- Make it open in half a second, as a fast automatic door
- Give the opening and closing different times
```

> **Recap**
> - A tween takes what, how, and where to.
> - Nothing moves until `:Play()`, and `:Play()` does not wait.
> - `Completed:Wait()` pauses your script until the tween ends.

> **Done when** all three checklists are ticked. One tween is three parts: what,
> how, where to — and `:Play()` to set it going. It only *starts* the tween; it
> never waits for it.
</div>


<!-- ═══════════════════════════ 7.4 ═══════════════════════════ -->
<div id="md-7.4" hidden>
# Build: the sky lifts

```lua predict=p7-warm4
local part = Instance.new("Part")
part.CFrame = CFrame.new(0, 5, 0)
part.CFrame *= CFrame.new(0, 0, -5)
print(part.Position)
```

Time to put the unit together into something you can actually play on: a course
of platforms that rise and fall in a slow wave, with a spinning coin waiting at
the top. You jump when a platform is low and ride it up to the next one.

Everything is built by one script, and every measurement lives in a setting at
the top.

## The script

Add a **Script** to ServerScriptService, replace everything in it with this, and
press Play:

```lua
local TweenService = game:GetService("TweenService")

-- ═══ settings: change these to rebuild the course ═══
local LIFT_COUNT = 6		-- how many moving platforms
local GAP = 10			-- studs between lift centres
local RISE = 12			-- how far each lift travels upwards
local TIME = 2			-- seconds for one rise
local LIFT_SIZE = Vector3.new(8, 1, 8)
local START = Vector3.new(0, 1, -14)	-- centre of the start pad
local LIFT_COLOR = Color3.fromRGB(70, 110, 90)
local COIN_COLOR = Color3.fromRGB(255, 214, 100)

local course = Instance.new("Folder")
course.Name = "SkyCourse"
course.Parent = workspace

-- one helper so every part in this build is made the same way
local function makePart(name, size, position, colour, material, parent)
	local part = Instance.new("Part")
	part.Name = name
	part.Size = size
	part.Position = position
	part.Color = colour
	part.Material = material
	part.Anchored = true
	part.Parent = parent
	return part
end

-- ═══ the pad you start from ═══
makePart("StartPad", Vector3.new(12, 1, 12), START,
	Color3.fromRGB(45, 55, 80), Enum.Material.Slate, course)

-- ═══ the lifts ═══
local lifts = {}

for i = 1, LIFT_COUNT do
	local home = START + Vector3.new(0, 0, -GAP * i) -- @n Each lift sits GAP studs further along than the last
	local lift = makePart(`Lift{i}`, LIFT_SIZE, home, LIFT_COLOR, Enum.Material.WoodPlanks, course)
	lifts[i] = { part = lift, home = home } -- @n Keeps each lift and its start spot for the tween loop below
end

-- ═══ the ledge at the top ═══
local ledgeSpot = START + Vector3.new(0, RISE, -GAP * (LIFT_COUNT + 1)) -- @n One slot past the last lift, and RISE studs higher
makePart("TopLedge", Vector3.new(10, 1, 10), ledgeSpot,
	Color3.fromRGB(45, 55, 80), Enum.Material.Slate, course)

-- ═══ the coin, floating over the ledge ═══
local coin = makePart("Coin", Vector3.new(0.6, 4, 4), ledgeSpot + Vector3.new(0, 3.5, 0),
	COIN_COLOR, Enum.Material.Neon, course)
coin.Shape = Enum.PartType.Cylinder

local glow = Instance.new("PointLight")
glow.Color = COIN_COLOR
glow.Range = 18
glow.Brightness = 2
glow.Parent = coin

-- ═══ set every lift moving, each one a little later than the last ═══
local info = TweenInfo.new(TIME, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)

for i, entry in ipairs(lifts) do
	local goal = { Position = entry.home + Vector3.new(0, RISE, 0) }
	local tween = TweenService:Create(entry.part, info, goal)
	task.delay((i - 1) * TIME / LIFT_COUNT, function() -- @n Lift 1 starts now; each later lift starts a little after
		tween:Play()
	end)
end

-- ═══ the coin bobs up and down for ever, and spins ═══
local bob = TweenService:Create(coin,
	TweenInfo.new(1.5, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true),
	{ Position = coin.Position + Vector3.new(0, 1.5, 0) })
bob:Play()

task.spawn(function()
	while true do
		local dt = task.wait()
		coin.CFrame *= CFrame.Angles(0, dt * 1.5, 0)
	end
end)

print(`Sky course built: {LIFT_COUNT} lifts, rising {RISE} studs`)
```

```output
Sky course built: 6 lifts, rising 12 studs  -  Server - Script:83
```

Walk forward onto the dark start pad, just in front of where you spawn. The
lifts carry on in a straight line from there, each one rising and falling a
little after the one before it. Hop from lift to lift, and when the last one is
at the top, step off onto the ledge with the spinning coin.

```task=u7-course
- Paste the script and press Play
- Find `SkyCourse` in Explorer while playing — every part is inside it
- Jump on the first lift and ride it
- Time your jumps and reach the coin at the top
```

## How it works

Everything in it is something you already know:

- **`makePart`** — one small function that sets the eight properties every part
  needs, so the code below is one line per part instead of eight. Unit 5, and the
  reason this script is readable.
- **Lifts in a loop** — `for i = 1, LIFT_COUNT` makes as many as the setting says,
  spaced `GAP` apart. Change `LIFT_COUNT` to seven and you get seven.
- **Each lift is tweened with `-1, true`** — for ever, and back again. That is what
  makes the wave.
- **`task.delay((i - 1) * TIME / LIFT_COUNT, ...)`** staggers the starts. Each
  lift begins a fraction of a cycle after the one before it, so the whole row is
  out of step and there is always a way up. This one line is what turns six
  identical platforms into a course.
- **The coin spins with `dt`** — `task.wait()` returns the seconds that frame
  took, so multiplying by it keeps the speed the same whatever machine it runs on.

- **Everything is placed from `START`.** The start pad sits on it, the lifts count
  away from it, and the ledge is worked out from it. Move `START` and the whole
  course moves together.

One small new thing snuck in: `Enum.Material.WoodPlanks` and
`Enum.Material.Slate` are two more materials from the same list as Neon and
Metal.

> **Key idea** Put every number in a setting at the top, and you can rebuild the whole course by changing one line.

## One thing that will not work

If you stand on a lift and try to ride it *sideways*, nothing will happen: a
tweened anchored part does not carry you along. Roblox characters are pushed by
parts that are moving with physics, and a tween is not physics — it is the part
being placed somewhere new sixty times a second. A lift going **up** works,
because you simply fall back onto it each time it rises. That is exactly why this
course is built out of rising platforms and not moving walkways.

> **Key idea** A tween places an anchored part again and again, so it does not carry a player sideways.

## Change one number

```task=u7-tweak
- Set `LIFT_COUNT` to `12` and press Play — a long climb
- Set `RISE` to `4` and `TIME` to `4` — a slow, shallow wave that is easy to ride
- Set `RISE` to `25` — now you have to wait and jump at the right moment
- Change `LIFT_SIZE` to make wide, safe platforms or narrow scary ones
```

## Make it yours

Some ideas — try at least one:

- Colour the lifts by height: make `LIFT_COLOR` change with `i`, from green at the
  bottom to red at the top, using `Color3.fromRGB` and a little maths.
- Add a second row of lifts going sideways from the top ledge, as a bonus climb.
- Put a `PointLight` in the middle of each lift so the course glows in the dark.
- Give the coin a `TweenService` spin on its `Transparency` as well, so it
  shimmers while it turns.

```task=u7-own
- Add something to the course using a setting variable
- Press Play and play it through to the top
- Show it to someone
```

> **Recap**
> - Settings at the top control the whole build.
> - A loop and a helper make many parts from one description.
> - `task.delay` staggers the starts, and `-1, true` keeps every lift moving for ever.

> **Done when** all three checklists are ticked — and that is unit 7. You can now
> find your way around a game that already exists, place and turn parts with
> `CFrame`, and make anything move smoothly. Next up: events, where the game
> starts reacting to what players do.
</div>


<!-- ═══════════════════════════ cheat-7 ═══════════════════════════ -->
<div id="md-cheat-7" hidden>
# The world cheatsheet

Finding things, CFrame and tweens on one page. Keep it open next to Studio.

## Finding an Instance

```lua
workspace.Crates                      -- the child called Crates, or an error
workspace:FindFirstChild("Crates")    -- the child, or nil
workspace:WaitForChild("Crates")      -- waits for it, then gives it to you
part:GetChildren()                    -- table of direct children
part:GetDescendants()                 -- table of everything inside, all levels
thing:IsA("BasePart")                 -- is it that class, or in that family?
thing.ClassName                       -- exactly what it is: Part, Folder, ...
thing.Name                            -- its name
thing.Parent                          -- what holds it
thing:Clone()                         -- a copy, with no Parent yet
thing:Destroy()                       -- gone, with everything inside it
thing:GetFullName()                   -- the whole path as text
```

`GetChildren` and `GetDescendants` come back in no particular order. Use a
Folder to keep a hand-built level tidy.

## CFrame

```lua
part.CFrame = CFrame.new(0, 5, 0)                                  -- place it
part.CFrame = CFrame.new(0, 5, 0) * CFrame.Angles(0, math.rad(45), 0)  -- place and turn
part.CFrame *= CFrame.new(0, 0, -5)                                -- 5 studs forward
part.CFrame *= CFrame.Angles(0, math.rad(45), 0)                   -- turn a bit more
part.CFrame = CFrame.lookAt(part.Position, target.Position)        -- face a target
part.Position                                                      -- just the point
part.Orientation                                                   -- just the turn, in degrees
part.CFrame.LookVector                                             -- the way it faces
```

- `*` means **and then**, and the right-hand CFrame is relative to the left.
- `CFrame.Angles` needs **radians** — always write `math.rad(degrees)`.
- `part.CFrame * ...` moves it on from where it stands. `CFrame.new(...) * ...`
  starts again from the middle of the world.

## Tweening

```lua
local TweenService = game:GetService("TweenService")

local info = TweenInfo.new(
	2,                                  -- seconds
	Enum.EasingStyle.Sine,              -- the shape of the speed
	Enum.EasingDirection.InOut,         -- forwards, backwards, or both
	-1,                                 -- repeat count: -1 is for ever
	true                                -- come back afterwards
)

local goal = {
	Position = Vector3.new(0, 20, 0),
	Color = Color3.fromRGB(125, 255, 175),
	Transparency = 0.4,
}

local tween = TweenService:Create(part, info, goal)
tween:Play()
tween.Completed:Wait()                  -- only if you want to wait for it
```

A tween does **not** carry a player standing on the part. Use rising platforms for
rides, not sliding ones.

## Waiting

```lua
task.wait()        -- one frame; hands you how long that frame took
task.wait(2)       -- two seconds
task.delay(3, function() ... end)   -- run this later, carry on now
task.spawn(function() ... end)      -- run this now, side by side
```

## Spinning a part for ever

```lua
task.spawn(function()
	while true do
		local dt = task.wait()
		part.CFrame *= CFrame.Angles(0, dt * 1.5, 0)
	end
end)
```

Multiplying by `dt` keeps the speed the same on every machine.

## Messages you will see

| in Output | usually means |
|---|---|
| *Crates is not a valid member of Workspace* | the dot could not find that name in that parent |
| *attempt to index nil with 'Color'* | `FindFirstChild` gave you `nil`, then you used a dot |
| *attempt to index nil with 'ClockTime'* | a name is misspelled, or the thing is not there yet |
| *invalid argument #1 to 'ipairs' (table expected, got Instance)* | forgot `:GetChildren()` on a folder |
| *Infinite yield possible on 'Workspace:WaitForChild("X")'* | that name never appeared; check the spelling |
| nothing moves, no error | a tween was never `:Play()`ed |

## The rules

1. `.Name` on a path dies if the name is missing. `FindFirstChild` gives `nil`.
2. `WaitForChild` for anything a player or another script could create.
3. `:GetChildren()` gives you a table to loop over; the order is not guaranteed.
4. `IsA` asks *what family*, `ClassName` says *exactly what*.
5. A `CFrame` is a position **and** a direction. `*` means "and then".
6. `CFrame.Angles` is in radians — wrap your degrees in `math.rad`.
7. A tween takes what, how, where to — and does nothing at all until `:Play()`.
8. `task.wait()` with nothing in it waits one frame and returns the time it took.
</div>
