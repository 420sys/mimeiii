"""Measure the colour of the reference images, so the taste read rests on numbers.

For each group of images: the dominant swatches (median cut on a small copy)
and how the coloured pixels divide between hue families. Prints JSON.
"""
import colorsys
import glob
import json
import os
import sys

from PIL import Image

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
GROUPS = {
    "attached": sorted(glob.glob(f"{ROOT}/moodboard/v6-lunar/0[1-7]-*.jpg")),
    "megacity": [f"{ROOT}/moodboard/v6-lunar/{n}" for n in (
        "01-hologram-dancer-billboard-city.jpg", "02-aerial-city-ring-roads-blue-red.jpg",
        "06-teal-plaza-towers-night.jpg")],
    "akiba": [f"{ROOT}/moodboard/v6-lunar/07-neo-akiba-anime-billboards.jpg"],
    "filigree": [f"{ROOT}/moodboard/v6-lunar/{n}" for n in (
        "03-winged-skull-filigree-blue.jpg", "04-rose-skull-scrollwork-violet.jpg")],
    "digital-2000s": [f"{ROOT}/moodboard/v6-lunar/05-dragon-kanji-2000s-digital-art.jpg",
                      f"{ROOT}/moodboard/v6-lunar/09-glass-shatter-moon.jpg"]
                     + sorted(glob.glob(f"{ROOT}/moodboard/v5-chrome-soft-club/*.jpg")),
    "vibe": sorted(p for p in glob.glob(f"{ROOT}/vibe/*") if os.path.isfile(p)),
    "whole-board": sorted(glob.glob(f"{ROOT}/moodboard/v6-lunar/*.jpg"))
                   + sorted(glob.glob(f"{ROOT}/moodboard/v5-chrome-soft-club/*.jpg"))
                   + sorted(glob.glob(f"{ROOT}/moodboard/current/*.jpg"))
                   + sorted(p for p in glob.glob(f"{ROOT}/vibe/*") if os.path.isfile(p)),
}
# hue families, in degrees
FAMILIES = [("red", 345, 15), ("orange", 15, 45), ("yellow", 45, 70), ("green", 70, 160),
            ("teal", 160, 200), ("blue", 200, 250), ("violet", 250, 290), ("magenta", 290, 345)]


def load(path, size=96):
    im = Image.open(path)
    if getattr(im, "n_frames", 1) > 1:
        im.seek(im.n_frames // 2)
    im = im.convert("RGB")
    im.thumbnail((size, size), Image.LANCZOS)
    return im


def family(h):
    d = h * 360
    for name, a, b in FAMILIES:
        if (a <= d < b) if a < b else (d >= a or d < b):
            return name
    return "red"


def measure(paths):
    fam = {n: 0.0 for n, _, _ in FAMILIES}
    dark = light = grey = coloured = 0
    pool = []
    for p in paths:
        try:
            im = load(p)
        except Exception:
            continue
        px = list(im.get_flattened_data()) if hasattr(im, "get_flattened_data") else list(im.getdata())
        w = 1.0 / len(px)            # every image counts the same, whatever its size
        for r, g, b in px:
            h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
            if l < 0.12:
                dark += w
            elif l > 0.9:
                light += w
            elif s < 0.16:
                grey += w
            else:
                coloured += w
                fam[family(h)] += w
        pool.append(im.resize((48, 48)))
    n = max(1, len(pool))
    # swatches: median cut over a mosaic of every image in the group
    cols = int(len(pool) ** 0.5) + 1
    mosaic = Image.new("RGB", (cols * 48, ((len(pool) + cols - 1) // cols) * 48))
    for i, im in enumerate(pool):
        mosaic.paste(im, ((i % cols) * 48, (i // cols) * 48))
    q = mosaic.quantize(colors=8, method=Image.Quantize.MEDIANCUT)
    pal = q.getpalette()[:24]
    counts = sorted(q.getcolors(), reverse=True)
    total = sum(c for c, _ in counts)
    swatches = [{"hex": "#%02x%02x%02x" % tuple(pal[i * 3:i * 3 + 3]), "share": round(c / total, 3)} for c, i in counts]
    tot_c = max(1e-9, coloured)
    return {
        "images": len(pool),
        "tone": {"dark": round(dark / n, 3), "light": round(light / n, 3), "grey": round(grey / n, 3), "coloured": round(coloured / n, 3)},
        "hue": {k: round(v / tot_c, 3) for k, v in fam.items()},
        "swatches": swatches,
    }


if __name__ == "__main__":
    out = {name: measure(paths) for name, paths in GROUPS.items()}
    json.dump(out, sys.stdout, indent=1)
