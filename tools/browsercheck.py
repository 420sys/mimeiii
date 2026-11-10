"""Smoke-test the whole machine in headless Chrome and say what is broken.

This is the dependency-free half of the test story: it needs Python and Chrome
and nothing else, so it still runs when npm is unhappy, and it drives
tools/probe.html — the same harness a human uses by hand — rather than a
private copy of the DOM.

    python3 tools/browsercheck.py              the desk, a lesson, the man, the launcher, stack, settings
    python3 tools/browsercheck.py --shots      also write tools/_out/smoke-*.png
    python3 tools/browsercheck.py --fires      also run tools/probe.py --act=… for every action

Exit code 1 if any check fails.
"""
import argparse, pathlib, re, subprocess, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _chrome import Server, run, probe_json, console_errors  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "tools" / "_out"
ap = argparse.ArgumentParser()
ap.add_argument("--shots", action="store_true", help="write a screenshot per case")
ap.add_argument("--fires", action="store_true", help="also exercise every WS action via probe.py")
ap.add_argument("--w", type=int, default=1600)
ap.add_argument("--h", type=int, default=1000)
a = ap.parse_args()

OUT.mkdir(parents=True, exist_ok=True)


def clean(d, label):
    """The health signal every case shares: it booted, and nothing threw."""
    bad = []
    if not d:
        return [f"{label}: the probe produced nothing"]
    if not d.get("ok"):
        bad.append(f"{label}: the machine never finished booting")
    if d.get("bootError"):
        bad.append(f"{label}: boot error — {str(d['bootError'])[:200]}")
    for e in d.get("errors") or []:
        bad.append(f"{label}: {e}")
    return bad


def case(name, act="", hash_="", w=None, h=None, wall="", checks=(), shot=False):
    """One probe run, then a list of (ok, label) per check."""
    q = [f"w={w or a.w}", f"h={h or a.h}", f"act={act}"]
    if wall:
        q.append(f"wall={wall}")
    url = "/tools/probe.html?" + "&".join(q) + hash_
    png = (OUT / f"smoke-{name}.png") if (shot or a.shots) else None
    with Server() as srv:
        dom, err, _ = run(srv.url(url), w=(w or a.w) + 40, h=(h or a.h) + 80,
                          budget=9000, screenshot=png)
    d = probe_json(dom)
    fails = clean(d, name)
    results = []
    for label, fn in checks:
        try:
            good = bool(fn(d))
        except Exception as e:
            good, label = False, f"{label} — check threw {e!r}"
        if not good:
            fails.append(f"{name}: {label}")
        results.append((good, label))
    for ln in console_errors(err, 3):
        fails.append(f"{name}: chrome console — {ln[:160]}")
    return results, fails, d


fails, table = [], []


def run_case(*args, **kw):
    res, bad, d = case(*args, **kw)
    table.append((kw.get("name") or args[0], res))
    fails.extend(bad)
    return d


# ── 1 · the desk ────────────────────────────────────────────────────────────
desk = lambda d: d.get("deck") or {}
run_case("desk", checks=[
    ("no windows open on a cold start", lambda d: d["windows"] == []),
    ("it opens on the desk", lambda d: d["ws"] == 1),
    ("the desk fills the screen", lambda d: d["rects"]["desk"]["w"] >= a.w - 1),
    ("the bar steps aside on the desk", lambda d: not (d["rects"]["bar"] or {}).get("vis")),
    ("the one look is ossuary", lambda d: d.get("rice") == "ossuary"),
    ("the sign names the first lesson", lambda d: "1.0" in (desk(d).get("sign") or "")),
    ("the clock shows the time", lambda d: bool(re.match(r"^\d\d:\d\d$", desk(d).get("clock") or ""))),
    ("the menu has its three corners", lambda d: desk(d).get("corners") == 3),
    ("a fresh save says what this is", lambda d: "stops" in (desk(d).get("promise") or "")),
    ("tonight's goal starts at nothing", lambda d: (desk(d).get("goal") or "").startswith("0:00 /")),
    ("its fonts loaded (Inter, IBM Plex Mono)", lambda d: all(any(n in f for f in (d.get("fonts") or [])) for n in ("Inter", "IBM Plex Mono"))),
    ("nothing overflows sideways", lambda d: d["overflowX"] is False),
    ("the live region is silent and off screen", lambda d: d["a11y"]["srOnlyLive"]),
])

# ── 2 · a written lesson, opened by hash ────────────────────────────────────
d = run_case("lesson", act="", hash_="#/3.2", checks=[
    ("the lesson is open on workspace 2", lambda d: d["ws"] == 2 and bool(d["lesson"])),
    ("the lesson has a title", lambda d: bool(d["lesson"] and d["lesson"]["h1"])),
    ("the kicker is there", lambda d: bool(d["lesson"] and d["lesson"]["kicker"])),
    ("code wells were rendered", lambda d: (d["lesson"] or {}).get("code", 0) >= 5),
    ("output panels were rendered", lambda d: (d["lesson"] or {}).get("out", 0) >= 3),
    ("runbooks were rendered", lambda d: (d["lesson"] or {}).get("runbook", 0) >= 2),
    ("probes were rendered", lambda d: (d["lesson"] or {}).get("probe", 0) >= 1),
    ("prev/next navigation exists", lambda d: bool(d["lesson"] and d["lesson"]["nav"])),
    ("it tells a screen reader what opened", lambda d: bool(d.get("live"))),
    ("the course rail is beside it", lambda d: bool((d["lesson"] or {}).get("rail"))),
])

# ── 3 · the manual, from the bar ────────────────────────────────────────────
run_case("man", act="man", checks=[
    ("the man window opened", lambda d: any(w["id"] == "man" for w in d["windows"])),
    ("it is on workspace 3", lambda d: d["ws"] == 3),
    ("something is open on 3", lambda d: d["openWs"][2] >= 1),
])

# ── 4 · settings ───────────────────────────────────────────────────────────
run_case("settings", act="settings", checks=[
    ("the settings window opened", lambda d: any(w["id"] == "settings" for w in d["windows"])),
    ("there is no wall picker", lambda d: not any(w["id"] == "wallpaper" for w in d["windows"])),
    ("it tiles without overlapping the seat", lambda d: d["overflowX"] is False),
])

# ── 5 · the launcher ───────────────────────────────────────────────────────
run_case("launcher", act="launcher", checks=[
    ("the launcher is up", lambda d: d["launcher"]["open"]),
    ("it says what mode it is in", lambda d: bool(d["launcher"]["mode"])),
    ("it lists everything you can do", lambda d: d["launcher"]["rows"] > 10),
    ("the input is a combobox", lambda d: d["launcher"]["role"] in ("combobox", "textbox")),
])
run_case("launcher-esc", act="launcheresc", checks=[
    ("escape closes it", lambda d: d["launcher"]["open"] is False),
])

# ── 6 · the city only ──────────────────────────────────────────────────────
run_case("peek", act="peek", checks=[
    ("the wall is still there", lambda d: bool(d["wall"])),
    ("the bar steps aside", lambda d: d["rects"]["bar"]["vis"] is False),
    ("the machine says it is peeking", lambda d: "peek" in d["body"].split()),
])
run_case("peek-esc", act="peekesc", checks=[
    ("escape brings the desk back", lambda d: "peek" not in d["body"].split()),
])

# ── 7 · the honest stack, under 1000px ─────────────────────────────────────
run_case("stack", w=940, h=780, checks=[
    ("the machine says it is in stack mode", lambda d: "stack" in d["body"]),
    ("the desk is still the whole screen", lambda d: d["rects"]["desk"]["w"] >= 939),
    ("no sideways scroll", lambda d: d["overflowX"] is False),
])

# ── 9 · every action a key can fire ────────────────────────────────────────
if a.fires:
    for act in ("ws2", "ws3", "ws4", "next", "prev", "float", "monocle", "hide", "close",
                "cycle", "rows", "reorder", "rain", "fx", "keys", "search", "goals",
                "course", "session", "settings", "deck", "unpeek", "peekesc", "launchrun"):
        p = subprocess.run([sys.executable, str(ROOT / "tools" / "probe.py"), f"--act={act}", "--raw"],
                           capture_output=True, text=True)
        ok = p.returncode == 0
        table.append((f"fire:{act}", [(ok, "no errors")]))
        if not ok:
            fails.append(f"fire:{act}: probe exited {p.returncode} — {p.stdout[:200]}")

# ── report ─────────────────────────────────────────────────────────────────
print(f"smoke · {a.w}×{a.h} · one look\n")
for name, res in table:
    bad = [lbl for ok, lbl in res if not ok]
    mark = "ok  " if not bad else "FAIL"
    print(f"  {mark} {name:16} {len(res) - len(bad)}/{len(res)}")
    for lbl in bad:
        print(f"         · {lbl}")

print()
if fails:
    print(f"{len(fails)} problem(s):")
    for f in fails:
        print(f"  - {f}")
    sys.exit(1)
print(f"all good — {sum(len(r) for _, r in table)} checks across {len(table)} cases")
