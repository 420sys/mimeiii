"""Compare Studio results (tools/_out/results-*.json) with what the lessons claim.

    python3 tools/compare_results.py
"""
import json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
cases = json.loads((ROOT / "tools/_out/cases.json").read_text())
res = {}
for f in sorted((ROOT / "tools/_out").glob("results-*.json")):
    for r in json.loads(f.read_text()):
        res[r["i"]] = r

def norm(s):
    s = re.sub(r" \{.*$", "", s) if re.match(r"^\w+ \{\w+ = ", s) else s
    s = re.sub(r"\s+", " ", s).strip()
    return s

ok = bad = skip = 0
for i, c in enumerate(cases, 1):
    r = res.get(i)
    if not r: continue
    if r.get("skipped"): skip += 1; continue
    got = [o for o in r["out"] if not o.get("warn") or True]
    gm = [norm(o["msg"]) for o in got]
    head = f"[{i}] {c['lesson']} block {c['idx']} ({c['kind']}{' ' + c.get('id','') if c['kind']=='predict' else ''})"
    if c["kind"] == "predict":
        exp = c["expect"][0]
        e = exp.lower()
        if e == "an error":
            good = any(o["err"] for o in got)
        elif e.startswith("nothing") or e == "nothing":
            good = not gm
        else:
            good = any(norm(exp) == g or norm(exp) in g for g in gm) if gm else False
        if good: ok += 1
        else:
            bad += 1
            print(head, "\n   chip:", exp, "\n   got: ", gm[:6] or "(nothing)", "\n   code:", c["code"].strip().replace("\n", " ⏎ ")[:200])
        continue
    exp = c["expect"]
    em = [norm(e["msg"]) for e in exp]
    # an error line: compare only the message after the script/line prefix
    def same(e, g):
        if e["err"]:
            return g["err"] and (norm(e["msg"]) == norm(g["msg"]) or norm(e["msg"]).split(": ", 1)[-1][:40] in norm(g["msg"]))
        return norm(e["msg"]) == norm(g["msg"])
    random = "math.random" in c["code"] or "os.time" in c["code"] or "os.clock" in c["code"]
    matched = len(exp) == len(got) and all(same(e, g) for e, g in zip(exp, got))
    if matched: ok += 1; continue
    if random and len(exp) == len(got) and all(e["err"] == g["err"] for e, g in zip(exp, got)):
        ok += 1; continue
    bad += 1
    print(head + (" [random]" if random else ""))
    print("   want:", em[:8])
    print("   got: ", [("! " if g["err"] else "") + norm(g["msg"]) for g in got][:8])
print(f"\nchecked {ok + bad}: {ok} match, {bad} differ, {skip} client-side skipped")
