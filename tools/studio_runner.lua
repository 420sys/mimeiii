-- Test harness for the lesson scripts. Runs from execute_luau on the
-- Server datamodel during Play (plugin context, so it may set .Source).
-- Pass a batch range by editing FIRST/LAST below before each call; results
-- for the batch are posted to tools/_out/results-FIRST.json.
local HttpService = game:GetService("HttpService")
local LogService = game:GetService("LogService")
local Lighting = game:GetService("Lighting")
local SSS = game:GetService("ServerScriptService")
local Players = game:GetService("Players")

local BASE = "http://localhost:8925/"

return function(FIRST, LAST)
local cases = HttpService:JSONDecode(HttpService:GetAsync(BASE .. "tools/_out/cases.json"))
LAST = math.min(LAST, #cases)

local watched = { workspace, SSS, game:GetService("ReplicatedStorage"),
	game:GetService("ServerStorage"), Lighting }
local baseline = {}
for _, w in watched do
	baseline[w] = {}
	for _, c in w:GetChildren() do baseline[w][c] = true end
end
local lightProps = { ClockTime = Lighting.ClockTime, Brightness = Lighting.Brightness }
local bp = workspace:FindFirstChild("Baseplate")
local bpProps = bp and { Color = bp.Color, Transparency = bp.Transparency, Material = bp.Material, Size = bp.Size }

local function cleanup()
	for _, w in watched do
		for _, c in w:GetChildren() do
			if not baseline[w][c] and not c:IsA("Camera") and not c:IsA("Terrain") and not Players:GetPlayerFromCharacter(c) then
				pcall(function() c:Destroy() end)
			end
		end
	end
	for k, v in lightProps do Lighting[k] = v end
	if bp and bp.Parent then for k, v in bpProps do bp[k] = v end end
	for _, plr in Players:GetPlayers() do
		local ls = plr:FindFirstChild("leaderstats")
		if ls then ls:Destroy() end
		for name in plr:GetAttributes() do plr:SetAttribute(name, nil) end
	end
end

local function waitFor(code)
	local total = 1
	for n in code:gmatch("task%.wait%(([%d%.]+)%)") do total += tonumber(n) or 0 end
	for n in code:gmatch("task%.delay%(([%d%.]+)") do total += tonumber(n) or 0 end
	if code:find("task%.wait%(%)") then total += 0.5 end
	if code:find("Tween") then total += 2 end
	return math.min(total, 6)
end

local results = {}
local current
local conn = LogService.MessageOut:Connect(function(msg, kind)
	if not current then return end
	if msg:find("^Stack Begin") or msg:find("^Stack End") or msg:find("^Script '") then return end
	table.insert(current, { msg = msg, err = kind == Enum.MessageType.MessageError,
		warn = kind == Enum.MessageType.MessageWarning })
end)

for i = FIRST, LAST do
	local case = cases[i]
	if case.client then
		table.insert(results, { i = i, skipped = "client" })
		continue
	end
	cleanup()
	task.wait(0.1)
	current = {}
	local s = Instance.new("Script")
	s.Name = "Script"
	s.Source = case.code
	s.Parent = SSS
	task.wait(waitFor(case.code))
	local got = current
	current = nil
	s:Destroy()
	table.insert(results, { i = i, out = got })
end
cleanup()
conn:Disconnect()
HttpService:PostAsync(BASE .. `results-{FIRST}.json`, HttpService:JSONEncode(results))
return `done {FIRST}-{LAST}`
end
