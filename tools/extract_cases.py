"""Pull every runnable script + its expected Output out of the lessons.

    python3 tools/extract_cases.py   ->  tools/_out/cases.json

A case is a ```lua or ```solution block whose expected ```output is the
next block (or, for a challenge, the block before the solution). Predict
blocks become cases too, with the right chip as the expected output.
"""
import json, pathlib, re, html, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
app = (ROOT / "src" / "data" / "course.js").read_text()
files = [ROOT / "content/lessons.md"] + sorted((ROOT / "content").glob("unit-*.md"),
         key=lambda p: int(re.search(r"\d+", p.name).group()))

preds = {}
for m in re.finditer(r"^\s*'([\w.-]+)':\s*\{(.*?)^\s*\},", app, re.S | re.M):
    o = re.search(r"options:\s*\[(.*?)\]", m.group(2), re.S)
    a = re.search(r"\banswer:\s*(\d+)", m.group(2))
    if o and a:
        opts = re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|`((?:[^`\\]|\\.)*)`", o.group(1))
        opts = [x or y or z for x, y, z in opts]
        preds[m.group(1)] = opts[int(a.group(1))].replace("\\'", "'")

cases = []
for f in files:
    for dm in re.finditer(r'<div id="md-([\w.-]+)" hidden>\n(.*?)\n</div>', f.read_text(), re.S):
        lid, text = dm.group(1), html.unescape(dm.group(2))
        blocks = [(m.group(1), m.group(2)) for m in re.finditer(r"^```([^\n]*)\n(.*?)^```", text, re.S | re.M)]
        for i, (info, body) in enumerate(blocks):
            lang = info.split()[0] if info.strip() else ""
            pm = re.search(r"predict=([\w.-]+)", info)
            if pm:
                cases.append(dict(lesson=lid, idx=i, kind="predict", id=pm.group(1), code=body,
                                  expect=[preds.get(pm.group(1), "?")]))
                continue
            if lang not in ("lua", "solution"):
                continue
            exp = None
            if i + 1 < len(blocks) and blocks[i + 1][0].strip() == "output":
                exp = blocks[i + 1][1]
            elif lang == "solution" and i > 0 and blocks[i - 1][0].strip() == "output":
                exp = blocks[i - 1][1]
            if exp is None:
                continue
            lines = []
            for ln in exp.strip("\n").split("\n"):
                err = ln.startswith("! ")
                ln = ln[2:] if err else ln
                at = ln.rfind("  -  ")
                tag = ln[at + 5:] if at != -1 else ""
                msg = ln[:at] if at != -1 else ln
                lines.append(dict(msg=msg, err=err, tag=tag))
            local = any("Client" in l["tag"] for l in lines)
            cases.append(dict(lesson=lid, idx=i, kind=lang, code=body, expect=lines, client=local))

out = ROOT / "tools/_out/cases.json"
out.write_text(json.dumps(cases))
print(f"{len(cases)} cases from {len(files)} files ->", out.relative_to(ROOT))
