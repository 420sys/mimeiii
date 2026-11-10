"""Merge tools/_parts/unit-N.js into src/data/course.js.

Each part file has four sections (//@@LESSONS, //@@GOALS, //@@TASKS,
//@@PREDICTS). course.js has a matching /*@@NAME*/ ... /*@@END NAME*/ region
in each table; the region is rebuilt from scratch on every run, so this
is safe to re-run after editing a part.

    python3 tools/merge_parts.py
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / "src" / "data" / "course.js"
NAMES = ["LESSONS", "GOALS", "TASKS", "PREDICTS"]

parts = sorted((ROOT / "tools" / "_parts").glob("unit-*.js"),
               key=lambda p: int(re.search(r"(\d+)", p.name).group(1)))
chunks = {n: [] for n in NAMES}
for p in parts:
    text = p.read_text()
    secs = re.split(r"^//@@(\w+)[ \t]*$", text, flags=re.M)
    got = dict(zip(secs[1::2], secs[2::2]))
    missing = [n for n in NAMES if n not in got]
    if missing:
        sys.exit(f"{p.name}: missing sections {missing}")
    for n in NAMES:
        body = got[n].strip("\n")
        body = "\n".join(("  " + l if l.strip() and not l.startswith("  ") else l) for l in body.split("\n"))
        chunks[n].append(f"  // ── {p.stem} ──\n{body}")

s = APP.read_text()
for n in NAMES:
    region = re.compile(r"/\*@@%s\*/.*?(?:/\*@@END %s\*/|(?=\n\};|\n\];))" % (n, n), re.S)
    if not region.search(s):
        sys.exit(f"course.js: no /*@@{n}*/ marker")
    new = f"/*@@{n}*/\n" + "\n".join(chunks[n]) + f"\n  /*@@END {n}*/"
    s = region.sub(lambda m: new, s, count=1)
APP.write_text(s)
print(f"merged {len(parts)} part files: " + ", ".join(p.name for p in parts))
