"""Build the walls: the desk's city, out of focus, behind the cab (workspaces 3 and 4).

    python3 tools/assets.py            build anything missing or stale
    python3 tools/assets.py --force    rebuild everything
    python3 tools/assets.py --report   just print what is there

Sources are the hand-picked originals in assets/ plus the best of the
inspiration art in vibe/. Everything lands in assets/walls/ as:

    <slug>.webp            up to 2560px wide, quality 72   (the wall); a soft
                           wall is 768px wide and blurred, quality 62
    <slug>@320.webp        picker thumbnail
    <slug>@still.webp      first frame, only for animated walls — what a
                           visitor who asked for reduced motion gets
    <slug>@320@still.webp  the frozen first frame at picker size

Animated walls keep their motion in an animated WebP; the stills exist because
CSS cannot pause a WebP, so reduced motion is served a frozen first frame
instead. The small still keeps the picture book on the same raster path as
every other card: a reduced-motion card is never a full wall in a 320px slot.

and the manifest for the app is written to src/data/walls.js, which carries a
24px LQIP data-URI per wall so the desktop can paint instantly while the real
image streams in.

Budgets are enforced, not suggested: a wall over 480KB or a thumb over 26KB
fails the run with a non-zero exit, so a careless re-encode cannot silently
make the site slow.
"""
from __future__ import annotations

import base64
import io
import json
import math
import pathlib
import sys
import time

from PIL import Image, ImageFilter, ImageSequence

ROOT = pathlib.Path(__file__).resolve().parent.parent
WALLS = ROOT / "assets" / "walls"
MANIFEST = ROOT / "src" / "data" / "walls.js"

WALL_MAX = 2560          # px, longest edge of the stored wall
WALL_MAX_H = 1600
ANIM_MAX = 1000          # animated walls stay smaller: motion costs more
ANIM_FPS = 10
LQIP_W = 24
BUDGET_WALL = 480 * 1024
BUDGET_ANIM = 1_000 * 1024
BUDGET_STILL = 120 * 1024
BUDGET_THUMB = 26 * 1024
THUMB_EDGE = 320        # longest edge of a picker thumbnail
SOFT_W = 768            # a soft wall is out of focus anyway: small, blurred, a few KB

# slug, source, label, flags
#   px  pixel art — draw it with hard pixels, never smoothed
#   fit "cover" (default) or "top" for tall art worth seeing from the top
#   anim/fps  keep the motion, thinned to at most fps (writes a still too)
#   soft  out of focus: SOFT_W wide, Gaussian blur of this radius (px at SOFT_W)
PICKS = [
    # The cab sits in front of the desk's city, out of focus: one wall per scene (src/ui/cab.js picks it).
    ("city-night", "assets/crane/city-night.webp", "the city at night, out of focus", dict(soft=5)),
    ("city-late", "assets/crane/city-late.webp", "the city late at night, out of focus", dict(soft=5)),
    ("city-ice", "assets/crane/city-ice.webp", "the city in ice, out of focus", dict(soft=5)),
]


def average(img: Image.Image) -> str:
    px = img.convert("RGB").resize((1, 1), Image.Resampling.BOX)
    r, g, b = px.getpixel((0, 0))
    return f"#{r:02x}{g:02x}{b:02x}"


def lqip(img: Image.Image) -> str:
    w = LQIP_W
    h = max(1, round(img.height * w / img.width))
    small = img.convert("RGB").resize((w, h), Image.Resampling.BOX)
    buf = io.BytesIO()
    small.save(buf, "WEBP", quality=32, method=4)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def still_size(img: Image.Image) -> tuple[int, int]:
    w, h = img.size
    scale = min(WALL_MAX / w, WALL_MAX_H / h, 1.0)
    return max(1, round(w * scale)), max(1, round(h * scale))


def shrink_animation(img: Image.Image, fps: int) -> tuple[list[Image.Image], list[int]]:
    """Every frame, uniformly scaled and thinned to at most `fps`."""
    frames, durations = [], []
    kept, acc = 0.0, 0
    target_ms = 1000 / fps
    for i, frame in enumerate(ImageSequence.Iterator(img)):
        dur = frame.info.get("duration", 100) or 100
        step = max(1, math.ceil(target_ms / max(dur, 20)))
        if i % step:
            continue
        f = frame.convert("RGBA")
        w, h = f.size
        scale = min(ANIM_MAX / w, WALL_MAX_H / h, 1.0)
        if scale < 1:
            f = f.resize((round(w * scale), round(h * scale)), Image.Resampling.LANCZOS)
        frames.append(f)
        durations.append(int(min(240, max(40, dur * step))))
        acc += 1
        if acc >= 90:                          # a wall, not a film
            break
    return frames, durations


def build(force: bool) -> int:
    WALLS.mkdir(parents=True, exist_ok=True)
    (ROOT / "src" / "data").mkdir(parents=True, exist_ok=True)
    entries, problems = [], []
    sizes = []                      # (slug, anim, bytes, thumb_bytes) for the report
    still_total = 0
    thumb_still_total = 0

    for slug, rel, label, flags in PICKS:
        src = ROOT / rel
        if not src.exists():
            problems.append(f"missing source {rel}")
            continue
        out = WALLS / f"{slug}.webp"
        thumb = WALLS / f"{slug}@320.webp"
        still_out = WALLS / f"{slug}@still.webp"
        thumb_still = WALLS / f"{slug}@320@still.webp"
        anim = bool(flags.get("anim"))
        fresh = (out.exists() and thumb.exists()
                 and out.stat().st_mtime >= src.stat().st_mtime
                 and (not anim or (still_out.exists() and thumb_still.exists())))

        if fresh and not force:
            with Image.open(out) as img:
                meta = dict(w=img.width, h=img.height, bytes=out.stat().st_size,
                            thumb_bytes=thumb.stat().st_size,
                            still_bytes=still_out.stat().st_size if still_out.exists() else 0,
                            thumb_still_bytes=thumb_still.stat().st_size if thumb_still.exists() else 0,
                            built=False)
        else:
            t0 = time.time()
            with Image.open(src) as raw:
                if anim and getattr(raw, "n_frames", 1) > 1:
                    frames, durs = shrink_animation(raw, int(flags.get("fps", ANIM_FPS)))
                    if not frames:
                        problems.append(f"{slug}: no frames")
                        continue
                    if len(frames) == 1:
                        anim = False
                    else:
                        frames[0].save(out, "WEBP", save_all=True, append_images=frames[1:],
                                       duration=durs, loop=0,
                                       quality=int(flags.get("q", 60)), method=5,
                                       allow_mixed=True)
                        # what a reduced-motion visitor sees: the first frame, still
                        frames[0].convert("RGB").save(still_out, "WEBP", quality=70, method=6)
                elif flags.get("soft"):
                    anim = False
                    still = raw.convert("RGB")
                    still = still.resize((SOFT_W, round(still.height * SOFT_W / still.width)), Image.Resampling.LANCZOS)
                    still = still.filter(ImageFilter.GaussianBlur(float(flags["soft"])))
                    still.save(out, "WEBP", quality=62, method=6)
                else:
                    anim = False
                    still = raw.convert("RGB")
                    still = still.resize(still_size(still), Image.Resampling.LANCZOS)
                    still.save(out, "WEBP", quality=72, method=6)
            with Image.open(out) as made:
                scale = min(THUMB_EDGE / max(made.width, made.height), 1.0)
                tw = max(1, round(made.width * scale))
                th = max(1, round(made.height * scale))
                frame0 = made.convert("RGB").copy()
                if scale < 1:
                    frame0 = frame0.resize((tw, th), Image.Resampling.LANCZOS)
                frame0.save(thumb, "WEBP", quality=70, method=6)
                if anim and still_out.exists():
                    with Image.open(still_out) as frozen:
                        frozen = frozen.convert("RGB")
                        fscale = min(THUMB_EDGE / max(frozen.width, frozen.height), 1.0)
                        fw = max(1, round(frozen.width * fscale))
                        fh = max(1, round(frozen.height * fscale))
                        if fscale < 1:
                            frozen = frozen.resize((fw, fh), Image.Resampling.LANCZOS)
                        frozen.save(thumb_still, "WEBP", quality=70, method=6)
                meta = dict(w=made.width, h=made.height, bytes=out.stat().st_size,
                            thumb_bytes=thumb.stat().st_size,
                            still_bytes=still_out.stat().st_size if anim and still_out.exists() else 0,
                            thumb_still_bytes=thumb_still.stat().st_size if anim and thumb_still.exists() else 0,
                            built=True, secs=round(time.time() - t0, 1))

        over = []
        if meta["bytes"] > (BUDGET_ANIM if anim else BUDGET_WALL):
            over.append(f"{meta['bytes'] // 1024}KB")
        if meta["still_bytes"] > BUDGET_STILL:
            over.append(f"still {meta['still_bytes'] // 1024}KB")
        if meta["thumb_bytes"] > BUDGET_THUMB:
            over.append(f"thumb {meta['thumb_bytes'] // 1024}KB")
        if meta["thumb_still_bytes"] > BUDGET_THUMB:
            over.append(f"thumb still {meta['thumb_still_bytes'] // 1024}KB")
        if over:
            problems.append(f"{slug}: over budget ({', '.join(over)})")

        with Image.open(out) as made:
            still = made.convert("RGB")
            entry = dict(
                id=slug, label=label, src=f"assets/walls/{slug}.webp",
                thumb=f"assets/walls/{slug}@320.webp", w=meta["w"], h=meta["h"],
                avg=average(still), lqip=lqip(still),
                px=bool(flags.get("px")), anim=anim,
                fit=flags.get("fit", "cover"),
            )
            if flags.get("pos"):
                entry["pos"] = flags["pos"]
            if anim:
                entry["still"] = f"assets/walls/{slug}@still.webp"
                entry["thumbStill"] = f"assets/walls/{slug}@320@still.webp"
            entries.append(entry)
        sizes.append((slug, anim, meta["bytes"], meta["thumb_bytes"]))
        still_total += meta["still_bytes"]
        thumb_still_total += meta["thumb_still_bytes"]
        print(f"{'built' if meta.get('built') else 'ok   '} {slug:13} "
              f"{meta['w']:>5}x{meta['h']:<5} {meta['bytes'] // 1024:>4}KB  "
              f"thumb {meta['thumb_bytes'] // 1024:>3}KB  {label}")

    js = ["/* Generated by tools/assets.py — do not edit by hand.",
          "   One entry per wallpaper; lqip is a 24px WebP data-URI so the deck can",
          "   paint something true before the real image arrives. */",
          "export const WALLS = ["]
    for e in entries:
        js.append("  { " + ", ".join(
            f'{k}: {json.dumps(v)}' if not isinstance(v, (int, bool))
            else f'{k}: {json.dumps(v)}' for k, v in e.items()) + " },")
    js.append("];")
    js.append("")
    js.append("export const WALL_BY_ID = Object.fromEntries(WALLS.map(w => [w.id, w]));")
    MANIFEST.write_text("\n".join(js))

    total = sum(b for _, a, b, _ in sizes if not a)
    anim_total = sum(b for _, a, b, _ in sizes if a)
    thumbs = sum(t for *_, t in sizes)
    print(f"\n{len(entries)} walls · stills {total // 1024}KB · animated "
          f"{anim_total // 1024}KB · freeze-frames {still_total // 1024}KB · "
          f"thumbs {thumbs // 1024}KB · thumb freeze-frames "
          f"{thumb_still_total // 1024}KB")
    print(f"manifest → {MANIFEST.relative_to(ROOT)}")
    if problems:
        print("\nPROBLEMS:")
        for p in problems:
            print("  " + p)
        return 1
    print("all walls inside budget")
    return 0


if __name__ == "__main__":
    if "--report" in sys.argv:
        if not MANIFEST.exists():
            sys.exit("no manifest yet — run without --report first")
        import re
        txt = MANIFEST.read_text()
        for m in re.finditer(r'id: "([^"]+)".*?w: (\d+), h: (\d+)', txt, re.S):
            print(f"{m.group(1):14} {m.group(2)}x{m.group(3)}")
        sys.exit(0)
    sys.exit(build("--force" in sys.argv))
