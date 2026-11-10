"""Download the prototype fonts once, so the prototypes stay self-hosted.

Every face is under the SIL Open Font License 1.1 and comes from Google Fonts.
Only the Latin subset is kept; the two-glyph Japanese files hold 未 and 明.
Run from anywhere:  python3 fetch_fonts.py   (standard library only)
"""
import os
import re
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "fonts")
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

# (css family, google spec, file stem)
LATIN = [
    ("Michroma", "Michroma", "michroma"),
    ("Cinzel", "Cinzel:wght@400..900", "cinzel"),
    ("Cormorant Garamond", "Cormorant Garamond:ital,wght@0,300..700;1,300..700", "cormorant-garamond"),
    ("Pinyon Script", "Pinyon Script", "pinyon-script"),
    ("Tilt Neon", "Tilt Neon", "tilt-neon"),
    ("Doto", "Doto:wght@100..900", "doto"),
    ("Anton", "Anton", "anton"),
    ("Bebas Neue", "Bebas Neue", "bebas-neue"),
    ("Unbounded", "Unbounded:wght@200..900", "unbounded"),
    ("Anta", "Anta", "anta"),
]
# The mark is the only Japanese on screen, so two glyphs are enough.
MARK = [
    ("Shippori Mincho B1", "Shippori Mincho B1:wght@800", "shippori-mincho-b1-mark"),
    ("Yuji Syuku", "Yuji Syuku", "yuji-syuku-mark"),
    ("Dela Gothic One", "Dela Gothic One", "dela-gothic-one-mark"),
]
MARK_TEXT = "未明"

# Faces the site already ships (assets/fonts), declared again for the prototypes.
LOCAL = """
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 100 900; font-display: swap;
  src: url('../../../assets/fonts/inter-latin.woff2') format('woff2'); }
@font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 400; font-display: swap;
  src: url('../../../assets/fonts/ibm-plex-mono-400-normal.woff2') format('woff2'); }
@font-face { font-family: 'IBM Plex Mono'; font-style: normal; font-weight: 500; font-display: swap;
  src: url('../../../assets/fonts/ibm-plex-mono-500-normal.woff2') format('woff2'); }
@font-face { font-family: 'Newsreader'; font-style: normal; font-weight: 200 800; font-display: swap;
  src: url('../../../assets/fonts/newsreader-normal.woff2') format('woff2'); }
@font-face { font-family: 'Newsreader'; font-style: italic; font-weight: 200 800; font-display: swap;
  src: url('../../../assets/fonts/newsreader-italic.woff2') format('woff2'); }
@font-face { font-family: 'Instrument Serif'; font-style: normal; font-weight: 400; font-display: swap;
  src: url('../../../assets/fonts/instrument-serif.woff2') format('woff2'); }
@font-face { font-family: 'Instrument Serif'; font-style: italic; font-weight: 400; font-display: swap;
  src: url('../../../assets/fonts/instrument-serif-italic.woff2') format('woff2'); }
@font-face { font-family: 'Space Grotesk'; font-style: normal; font-weight: 300 700; font-display: swap;
  src: url('../../../assets/fonts/space-grotesk.woff2') format('woff2'); }
@font-face { font-family: 'Geist'; font-style: normal; font-weight: 100 900; font-display: swap;
  src: url('../../../assets/fonts/geist.woff2') format('woff2'); }
""".strip()


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()


def faces(css):
    """Yield (subset comment, block) for each @font-face in a Google css2 reply."""
    for m in re.finditer(r"(?:/\*\s*([\w\-\[\]0-9]+)\s*\*/\s*)?@font-face\s*{([^}]*)}", css):
        yield (m.group(1) or ""), m.group(2)


def prop(block, name):
    m = re.search(name + r"\s*:\s*([^;]+);", block)
    return m.group(1).strip() if m else ""


def main():
    os.makedirs(OUT, exist_ok=True)
    rules, report = [], []
    for family, spec, stem in LATIN:
        url = "https://fonts.googleapis.com/css2?" + urllib.parse.urlencode({"family": spec, "display": "swap"})
        css = get(url).decode()
        latin = [block for subset, block in faces(css) if subset == "latin"]
        styles = [prop(b, "font-style") for b in latin]
        for block in latin:
            style, weight = prop(block, "font-style"), prop(block, "font-weight")
            src = re.search(r"url\((https://[^)]+)\)", block).group(1)
            # one file per style unless the family ships several static weights
            several = styles.count(style) > 1
            name = stem + ("-italic" if style == "italic" else "") + (
                "-" + weight if several else "") + ".woff2"
            data = get(src)
            with open(os.path.join(OUT, name), "wb") as f:
                f.write(data)
            rules.append(
                f"@font-face {{ font-family: '{family}'; font-style: {style}; font-weight: {weight}; "
                f"font-display: swap;\n  src: url('fonts/{name}') format('woff2'); }}")
            report.append((name, len(data)))
    for family, spec, stem in MARK:
        url = "https://fonts.googleapis.com/css2?" + urllib.parse.urlencode({"family": spec, "text": MARK_TEXT})
        css = get(url).decode()
        for _, block in faces(css):
            src = re.search(r"url\((https://[^)]+)\)", block).group(1)
            weight = prop(block, "font-weight")
            name = stem + ".woff2"
            data = get(src)
            with open(os.path.join(OUT, name), "wb") as f:
                f.write(data)
            # A separate family name, so nothing falls through to it by accident.
            rules.append(
                f"@font-face {{ font-family: '{family} Mark'; font-style: normal; font-weight: {weight}; "
                f"font-display: swap;\n  src: url('fonts/{name}') format('woff2'); unicode-range: U+672A, U+660E; }}")
            report.append((name, len(data)))
    head = ("/* Prototype fonts (redesign 2026-11-10). Made by fetch_fonts.py; all SIL OFL 1.1.\n"
            "   The '… Mark' families hold only 未 and 明: the mark is the one piece of Japanese. */\n")
    with open(os.path.join(HERE, "fonts.css"), "w") as f:
        f.write(head + "\n".join(rules) + "\n\n/* already shipped with the site */\n" + LOCAL + "\n")
    for name, size in report:
        print(f"{size:7d}  {name}")
    print("total", sum(s for _, s in report), "bytes in", len(report), "files")


if __name__ == "__main__":
    main()
