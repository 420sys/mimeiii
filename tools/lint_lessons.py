"""Check the lesson content against the course data without a browser.

    python3 tools/lint_lessons.py

- every lesson in LESSONS has its md div, and every div is listed
- every predict=/task= id used in markdown exists in PREDICTS / TASKS
- every goal of every lesson can be ticked by a task or predict in it
- no raw less-than sign or ampersand in the markdown (innerHTML eats them)
- `Script:N` (or `LocalScript:N`, `ModuleScript:N`) tags in an ```output block
  land on a print/warn/error/assert line of the ```lua block above it, or of
  the ```solution right after it (an error may land on any line of code),
  counting lines as the page shows them, header comments included. A heuristic,
  so it only warns. A tag past the end of every shown snippet is a note, not a
  problem: lessons print the interesting part of a longer script. A block that
  mixes scripts opts out with `<!-- lint: skip script-lines -->` on the line
  above its ```output fence.
"""
import pathlib, re, sys, html

ROOT = pathlib.Path(__file__).resolve().parent.parent
app = (ROOT / "src" / "data" / "course.js").read_text()
md_files = [ROOT / "content" / "lessons.md"] + sorted(
    (ROOT / "content").glob("unit-*.md"), key=lambda p: int(re.search(r"\d+", p.name).group()))

problems = []
warns = []
notes = []
def bad(where, msg): problems.append(f"{where}: {msg}")
def warn(where, msg): warns.append(f"{where}: {msg}")
def note(where, msg): notes.append(f"{where}: {msg}")
SKIP = "<!-- lint: skip script-lines -->"

def table(name):
    i = app.index(f"const {name} = ")
    j = app.index("\n};", i) if app[i:].find("= {") < 20 else app.index("\n];", i)
    return app[i:j]

lessons = re.findall(r"\{ id: '([^']+)',\s*kind: '(\w+)'.*?md: '([^']+)'", table("LESSONS"))
goals_src = table("GOALS")
tasks = dict(re.findall(r"'([\w.-]+)':\s*\{\s*goal:\s*(\d+)", table("TASKS")))
pred_src = table("PREDICTS")
preds = {}
for m in re.finditer(r"^\s*'([\w.-]+)':\s*\{(.*?)^\s*\},", pred_src, re.S | re.M):
    g = re.search(r"\bgoal:\s*(\d+)", m.group(2))
    a = re.search(r"\banswer:\s*(\d+)", m.group(2))
    o = re.search(r"options:\s*\[(.*?)\]", m.group(2), re.S)
    n_opts = len(re.findall(r"'(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"|`(?:[^`\\]|\\.)*`", o.group(1))) if o else 0
    preds[m.group(1)] = (int(g.group(1)) if g else None, int(a.group(1)) if a else None, n_opts)

def goal_count(lid):
    m = re.search(r"^\s*(?:'%s'|%s):\s*\[(.*?)\],?\s*$" % (re.escape(lid), re.escape(lid)), goals_src, re.S | re.M)
    if not m: return None
    return len(re.findall(r"\{\s*t:", m.group(1)))

# a code line that prints (an error may be any code line); a trailing comment is not code
def code_line(src, err=False):
    c = re.sub(r"\s--.*$", "", src).strip()
    return bool(c) and not c.startswith("--") and (err or bool(re.search(r"\b(print|warn|error|assert)\b", c)))

divs = {}
for f in md_files:
    text = f.read_text()
    for m in re.finditer(r'<div id="(md-[\w.-]+)" hidden>\n(.*?)\n</div>', text, re.S):
        divs[m.group(1)] = (f.name, m.group(2))
    body = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    body = re.sub(r'</?div[^>]*>', "", body)
    for n, line in enumerate(body.split("\n"), 1):
        if "<" in line: bad(f.name, f"raw '<' in: {line.strip()[:70]}")
        for amp in re.finditer(r"&(?!(?:lt|gt|amp|quot|#\d+);)", line):
            bad(f.name, f"raw '&' in: {line.strip()[:70]}")

for lid, kind, md in lessons:
    if md not in divs:
        bad(lid, f"no div {md}"); continue
    fname, raw = divs[md]
    text = html.unescape(raw)
    used_t = re.findall(r"^```[ \t]*(?:\w+[ \t]+)?task=([\w.-]+)", text, re.M)
    used_p = re.findall(r"^```[ \t]*(?:\w+[ \t]+)?predict=([\w.-]+)", text, re.M)
    ticks = set()
    for t in used_t:
        if t not in tasks: bad(lid, f"task {t} not in TASKS")
        else: ticks.add(int(tasks[t]))
    for p in used_p:
        if p not in preds: bad(lid, f"predict {p} not in PREDICTS"); continue
        g, a, n = preds[p]
        if g is not None: ticks.add(g)
        if a is None or a >= n: bad(lid, f"predict {p}: answer {a} out of {n} options")
    gc = goal_count(lid)
    if gc is None:
        if kind != "home": bad(lid, "no GOALS entry")
    elif kind == "lesson":
        missing = set(range(gc)) - ticks
        if missing: bad(lid, f"goals {sorted(missing)} cannot be ticked")
        extra = {t for t in ticks if t >= gc}
        if extra: bad(lid, f"tasks/predicts tick goals {sorted(extra)} that do not exist")
    # output line numbers: a `Script:N` tag lands on the line that prints it, counted as the page
    # shows the code (header comments included). A heuristic, so it only warns.
    blocks = [(m.group(1), m.group(2).rstrip("\n").split("\n"), m.start())
              for m in re.finditer(r"^```(\S*)[^\n]*\n(.*?)^```", text, re.S | re.M)]
    for k, (lang, body, at) in enumerate(blocks):
        if lang != "output" or text[:at].rstrip().endswith(SKIP): continue   # mixed scripts opt out
        # the script is the lua block above; a challenge shows the Output first and its solution after it
        homes = [b[1] for b in blocks[:k] if b[0] in ("lua", "solution")][-1:]
        if k + 1 < len(blocks) and blocks[k + 1][0] == "solution": homes.append(blocks[k + 1][1])
        for ln in body:
            m = re.search(r"Script:(\d+)\s*$", ln)
            if not m or not homes: continue
            n, err = int(m.group(1)), ln.startswith("! ")
            srcs = [h[n - 1] for h in homes if 0 < n <= len(h)]
            if not srcs:
                note(lid, f"Output tag Script:{n} -> past the shown snippet ({max(map(len, homes))} lines)")
            elif not any(code_line(s, err) for s in srcs):
                warn(lid, f"Output tag Script:{n} -> line is {srcs[-1].strip()[:50]!r} (mixed scripts? put {SKIP} above the output)")

listed = {md for _, _, md in lessons}
for d, (f, _) in divs.items():
    if d not in listed: bad(f, f"div {d} is not in LESSONS")

for w in warns:
    print(f"warn: {w}")
for n in notes:
    print(f"note: {n}")
extra = [f"{len(x)} {name}" for name, x in (("warnings", warns), ("notes", notes)) if x]
print("\n".join(problems) if problems else
      f"ok: {len(lessons)} entries, {len(divs)} divs, {len(preds)} predicts, {len(tasks)} tasks"
      + (f" ({', '.join(extra)})" if extra else ""))
sys.exit(1 if problems else 0)
