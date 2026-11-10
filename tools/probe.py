"""Run tools/probe.html headless and print its JSON.

    python3 tools/probe.py "#/2.1"                      1600x1000, no action
    python3 tools/probe.py --act=ws2 --w=1600 --h=1000
    python3 tools/probe.py --act=wallpaper
    python3 tools/probe.py --act=man "#/cheat-3"
    python3 tools/probe.py --act=ws2 --where=395,300     what is at that point
    python3 tools/probe.py --act=ws2 --raw               the JSON itself

Positional shorthand is still accepted: probe.py HASH W H ACT.
Exit code: 0 when the machine booted clean, 1 when it did not, 2 when the
probe page produced nothing parseable.
"""
import argparse, json, sys
from urllib.parse import quote

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
from _chrome import Server, run, probe_json  # noqa: E402

p = argparse.ArgumentParser()
p.add_argument("hash", nargs="?", default="", help="URL fragment, e.g. '#/3.2'")
p.add_argument("wpos", nargs="?", default=None, help="width (shorthand)")
p.add_argument("hpos", nargs="?", default=None, help="height (shorthand)")
p.add_argument("actpos", nargs="?", default=None, help="action (shorthand)")
p.add_argument("--w", default=None)
p.add_argument("--h", default=None)
p.add_argument("--act", default=None)
p.add_argument("--wall", default="")
p.add_argument("--where", default="", help="x,y — report what is on top at that point")
p.add_argument("--sel", default="", help="CSS selector — box, scroll size and clipping of it + ancestors")
p.add_argument("--budget", type=int, default=9000, help="virtual time budget in ms")
p.add_argument("--noboot", action="store_true", help="ignored; the probe always skips the flash")
p.add_argument("--raw", action="store_true", help="print the JSON, not the aligned table")
a = p.parse_args()
W = a.w or a.wpos or "1600"
H = a.h or a.hpos or "1000"
ACT = a.act if a.act is not None else (a.actpos or "")

url = (f"/tools/probe.html?w={W}&h={H}&act={ACT}&wall={a.wall}"
       f"&where={a.where}&sel={quote(a.sel)}{a.hash}")

with Server() as srv:
    dom, err, _ = run(srv.url(url), w=int(W) + 40, h=int(H) + 80, budget=a.budget)

d = probe_json(dom)
if not d:
    print("NO PROBE OUTPUT")
    print("\n".join(err.splitlines()[:20]))
    sys.exit(2)

if a.raw:
    print(json.dumps(d, indent=2))
    sys.exit(0 if d.get("ok") else 1)

for k, v in d.items():
    print(f"{k:16} {v}")

if not d.get("ok") or d.get("errors") or d.get("bootError"):
    sys.exit(1)
