"""Turn capture.sh's PNGs into the small WebP stills the gallery page shows.

  python3 make-shots.py            every direction that has been captured
  python3 make-shots.py a-hologram just one

Reads .hoplite/artifacts/shots/<dir>-<scene>-<n>-<screen>.png (not committed)
and writes shots/<same name>.webp beside this file (committed, about 100 KB each).
Needs Pillow, like tools/assets.py.
"""
import glob
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, "..", "..", ".hoplite", "artifacts", "shots"))
OUT = os.path.join(HERE, "shots")
WIDTH = 1440

os.makedirs(OUT, exist_ok=True)
want = sys.argv[1:]
total = 0
for png in sorted(glob.glob(os.path.join(SRC, "*.png"))):
    name = os.path.basename(png)[:-4]
    if want and not any(name.startswith(w + "-") for w in want):
        continue
    im = Image.open(png).convert("RGB")
    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    dst = os.path.join(OUT, name + ".webp")
    im.save(dst, "WEBP", quality=82, method=6)
    total += os.path.getsize(dst)
    print(f"{os.path.getsize(dst) / 1024:6.0f} KB  shots/{name}.webp")
print(f"total {total / 1024 / 1024:.1f} MB")
