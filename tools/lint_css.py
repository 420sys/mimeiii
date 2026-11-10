"""Static checks on the stylesheets: token integrity and WCAG contrast.

Two things can rot in a token-driven design and neither is visible in a
screenshot: a `var(--thing)` that no longer exists (the property silently
falls back to nothing), and a look whose text drifts under 4.5:1. This walks
styles/*.css, builds the token tables by hand, and reports both.

    python3 tools/lint_css.py            check everything
    python3 tools/lint_css.py -v         also print every ratio

Exit code 1 on any missing token or contrast failure. The same ratios are
asserted in the browser by tests/a11y.spec.js against getComputedStyle, so a
green run here plus a green run there means the tables and the machine agree.
"""
import argparse, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
STYLES = sorted((ROOT / "styles").glob("*.css"))

# set from JavaScript at runtime (wallpaper position, effect amplitudes, …)
RUNTIME = {"--wall-pos", "--noise", "--px", "--py"}

# text that must be readable: token → minimum ratio against the surface it sits on
TEXT_PAIRS = [
    ("--fg", 4.5),
    ("--fg-2", 4.5),
    ("--fg-3", 4.5),
    ("--fg-4", 4.5),
    ("--accent", 4.5),      # unit numbers, links and labels are small text
    ("--accent-2", 4.5),    # code and paths in prose
    ("--ok", 3.0),          # "lit"
    ("--warn", 3.0),        # "broken"
]
# ink that sits on a filled accent button
INK_PAIRS = [("--accent-ink", "--accent", 4.5)]

CORE = ["--bg", "--surface", "--surface-2", "--surface-solid", "--surface-hi", "--well",
        "--line", "--line-2", "--line-hi", "--fg", "--fg-2", "--fg-3", "--fg-4",
        "--accent", "--accent-ink", "--accent-2", "--ok", "--warn", "--sel"]


# ── colour maths ────────────────────────────────────────────────────────────
def parse_colour(v):
    """'#0c1026' | 'rgba(13, 17, 40, .74)' → (r, g, b, a) or None."""
    if not v:
        return None
    v = v.strip()
    m = re.fullmatch(r"#([0-9a-fA-F]{3})", v)
    if m:
        return tuple(int(c * 2, 16) for c in m.group(1)) + (1.0,)
    m = re.fullmatch(r"#([0-9a-fA-F]{6})", v)
    if m:
        h = m.group(1)
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0)
    m = re.fullmatch(r"rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+))?\s*\)", v)
    if m:
        r, g, b = (float(m.group(i)) for i in (1, 2, 3))
        a = float(m.group(4)) if m.group(4) is not None else 1.0
        return (r, g, b, a)
    return None


def over(top, bottom):
    r, g, b, a = top
    br, bg, bb, _ = bottom
    return (r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1.0)


def lum(c):
    def ch(x):
        x /= 255
        return x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4
    r, g, b = c[0], c[1], c[2]
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# ── css reading ─────────────────────────────────────────────────────────────
def strip_comments(text):
    return re.sub(r"/\*.*?\*/", "", text, flags=re.S)


def drop_media(text):
    """Remove @media blocks whole, brace-matched.

    A blanket `selector { body }` scan reads the *inner* selector of an
    @media block as if it were top level, which quietly merges the print
    palette into :root and makes every contrast check lie."""
    out, i = [], 0
    while True:
        m = re.search(r"@media[^{]*\{", text[i:])
        if not m:
            out.append(text[i:])
            return "".join(out)
        start = i + m.start()
        out.append(text[i:start])
        j, depth = i + m.end(), 1
        while j < len(text) and depth:
            if text[j] == "{":
                depth += 1
            elif text[j] == "}":
                depth -= 1
            j += 1
        i = j


def rules(text, media=False):
    """(selector, body) for every rule block; @media wrappers dropped by default."""
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", strip_comments(text if media else drop_media(text))):
        sel = " ".join(m.group(1).split())
        yield sel, m.group(2)


def tokens_in(body):
    out = {}
    for m in re.finditer(r"(--[a-z0-9-]+)\s*:\s*([^;{}]+)", body):
        out[m.group(1)] = m.group(2).strip()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-v", "--verbose", action="store_true", help="print every measured ratio")
    ap.add_argument("--min-ratio", type=float, default=None, help="override the text minimum")
    a = ap.parse_args()

    defined, used, per_rule = {}, {}, {}
    for path in STYLES:
        text = path.read_text()
        for sel, body in rules(text):
            toks = tokens_in(body)
            for k, v in toks.items():
                defined.setdefault(k, (path.name, v))
            per_rule.setdefault(sel, {}).update(toks)
            for m in re.finditer(r"var\(\s*(--[a-z0-9-]+)\s*([,)])", body):
                if m.group(2) == ")":
                    used.setdefault(m.group(1), set()).add(path.name)

    fails, warns = [], []

    # 1 · every var() used exists somewhere
    missing = sorted(k for k in used if k not in defined and k not in RUNTIME)
    for k in missing:
        fails.append(f"var({k}) used in {', '.join(sorted(used[k]))} but never defined")
    unused = sorted(k for k in defined if k not in used and k not in RUNTIME and k.startswith("--"))

    # 2 · the one look: every token present, every readable colour AA
    looks = {"ossuary": per_rule.get(":root", {})}

    min_ratio = a.min_ratio
    for name, toks in looks.items():
        base = parse_colour(toks.get("--surface-solid", ""))
        bg = parse_colour(toks.get("--bg", ""))
        surface = parse_colour(toks.get("--surface", ""))
        if not (base and bg):
            fails.append(f"{name}: no --surface-solid / --bg to measure against")
            continue
        # the two surfaces text really sits on: a solid window, and a glass window
        solid = base
        glass = over(surface, bg) if surface else base
        for tok, minimum in TEXT_PAIRS:
            if min_ratio:
                minimum = min_ratio
            c = parse_colour(toks.get(tok, ""))
            if not c:
                warns.append(f"{name}: {tok} is not a plain colour ({toks.get(tok, '?')[:40]})")
                continue
            for where, back in (("solid", solid), ("glass", glass)):
                r = ratio(c, back)
                if a.verbose:
                    print(f"  {name:22} {tok:11} on {where:5} {r:5.2f}:1  (min {minimum})")
                if r < minimum:
                    fails.append(f"{name}: {tok} on {where} is {r:.2f}:1, needs {minimum}:1")
        for ink_tok, surf_tok, minimum in INK_PAIRS:
            ink, s = parse_colour(toks.get(ink_tok, "")), parse_colour(toks.get(surf_tok, ""))
            if not (ink and s):
                fails.append(f"{name}: cannot measure {ink_tok} on {surf_tok}")
                continue
            r = ratio(ink, s)
            if a.verbose:
                print(f"  {name:22} {ink_tok:11} on {surf_tok:11} {r:5.2f}:1  (min {minimum})")
            if r < minimum:
                fails.append(f"{name}: {ink_tok} on {surf_tok} is {r:.2f}:1, needs {minimum}:1")
        for tok in CORE:
            if tok not in toks:
                warns.append(f"{name}: does not set {tok}")

    # 3 · the effect levels are complete, and reduced motion kills them all
    lvl = set()
    for sel, toks in per_rule.items():
        if sel.startswith(':root[data-fx='):
            lvl |= {k for k in toks if k.startswith('--lvl-')}
    for n in ("2", "1", "0"):
        if not any(sel == f':root[data-fx="{n}"]' for sel in per_rule):
            fails.append(f'no :root[data-fx="{n}"] block — the watchdog has a level with no rules')
    if not lvl:
        fails.append("data-fx levels define no --lvl-* tokens")
    rm = re.search(r"@media \(prefers-reduced-motion: reduce\)\s*\{(.*?)\n\}", (ROOT / "styles/00-tokens.css").read_text(), re.S)
    if not rm:
        fails.append("00-tokens.css has no prefers-reduced-motion block")
    elif not all(v in rm.group(1) for v in ("--lvl-blur: 0", "--lvl-scan: 0", "--lvl-grain: 0",
                                            "--lvl-rain: 0", "--lvl-glitch: 0", "--lvl-bloom: 0")):
        fails.append("prefers-reduced-motion does not zero every effect amplitude")

    # ── report ──
    print(f"{len(STYLES)} stylesheets · {len(defined)} tokens defined · "
          f"{len(used)} used · {len(looks)} look")
    for w in warns:
        print(f"  note  {w}")
    for f in fails:
        print(f"  FAIL  {f}")
    if unused and a.verbose:
        print(f"  defined but never used: {', '.join(unused)}")
    print(f"\n{'FAILED — ' + str(len(fails)) + ' problem(s)' if fails else 'css lint clean'} "
          f"({len(warns)} note(s))")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
