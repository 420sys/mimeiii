"""Screenshots of each workspace, plus a stitched contact sheet.

The dependency-free half of the visual pipeline: no npm, no Playwright, just
headless Chrome and Pillow. Use it while the design is moving; use
`npx playwright test tests/visual.spec.js` for the tracked baselines.

    python3 tools/shots.py                      every workspace
    python3 tools/shots.py --acts "" ,ws2,man   only these actions
    python3 tools/shots.py --no-sheet           just the PNGs
    python3 tools/shots.py --open               open the folder when done

Output: tools/_out/shots/*.png and, unless --no-sheet, sheet-workspaces.png.
"""
import argparse, functools, http.server, pathlib, re, shutil, signal, socketserver
import subprocess, sys, tempfile, threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "tools" / "_out" / "shots"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TIMEOUT = 60

p = argparse.ArgumentParser()
p.add_argument("--w", type=int, default=1600)
p.add_argument("--h", type=int, default=1000)
p.add_argument("--acts", default=",ws2,man,settings",
               help="comma-separated actions; the empty one is the deck")
p.add_argument("--hash", default="")
p.add_argument("--budget", type=int, default=12000)
p.add_argument("--thumb", type=int, default=560, help="contact-sheet cell width")
p.add_argument("--no-sheet", action="store_true")
p.add_argument("--open", action="store_true")
a = p.parse_args()

ACTS = [x.strip() for x in a.acts.split(",")]
OUT.mkdir(parents=True, exist_ok=True)


class Q(http.server.SimpleHTTPRequestHandler):
    def end_headers(s):
        s.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(s, *x): pass


socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(Q, directory=str(ROOT)))
PORT = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()


def shoot(name, act="", wall=""):
    """One page → one PNG. Returns (name, ok, note, path)."""
    url = (f"http://127.0.0.1:{PORT}/tools/shot.html"
           f"?w={a.w}&h={a.h}&act={act}&wall={wall}{a.hash}")
    png = OUT / f"{name}.png"
    prof = tempfile.mkdtemp(prefix="cozy-shot-")
    cmd = [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
           # 1 for the Retina-free pixel grid the CSS is designed against
           "--force-device-scale-factor=1",
           f"--virtual-time-budget={a.budget}", f"--window-size={a.w},{a.h}",
           f"--user-data-dir={prof}", f"--screenshot={png}", "--dump-dom", url]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        dom, err = proc.communicate(timeout=TIMEOUT)
    except subprocess.TimeoutExpired:
        proc.send_signal(signal.SIGTERM)
        try: dom, err = proc.communicate(timeout=10)
        except subprocess.TimeoutExpired: proc.kill(); dom, err = proc.communicate()
    shutil.rmtree(prof, ignore_errors=True)

    ok = 'data-shot="ready"' in (dom or "")
    note = ""
    m = re.search(r'data-error="([^"]*)"', dom or "")
    if m and m.group(1).strip():
        note = m.group(1).strip()[:90]
    if not png.exists():
        note = note or "chrome wrote no image"
    bad = [ln for ln in (err or "").splitlines()
           if re.search(r"Uncaught|SyntaxError|TypeError|ReferenceError", ln)]
    if bad:
        note = note or bad[0][:90]
    return name, ok and png.exists(), note, png


# ── shoot ────────────────────────────────────────────────────────────────────
results = []
print(f"shooting {a.w}×{a.h} → {OUT.relative_to(ROOT)}")
for act in ACTS:
    label = act or "deck"
    name = f"ws-{label}"
    results.append(shoot(name, act=act))
    print(f"  {label:12} {'ok ' if results[-1][1] else 'BAD'} {results[-1][2]}")

if not a.no_sheet:
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("  (Pillow not installed — no contact sheets)")
        Image = None
    if Image:
        def sheet(title, names, out_name, cols=2):
            ims = [(n, Image.open(OUT / f"{n}.png").convert("RGB")) for n in names
                   if (OUT / f"{n}.png").exists()]
            if not ims:
                return
            tw = a.thumb
            cells = []
            for n, im in ims:
                th = round(im.height * (tw / im.width))
                cells.append((n, im.resize((tw, th), Image.LANCZOS)))
            ch = max(c.height for _, c in cells) + 26
            rows = (len(cells) + cols - 1) // cols
            pad = 14
            W = cols * tw + (cols + 1) * pad
            H = rows * ch + (rows + 1) * pad + 30
            sheet_im = Image.new("RGB", (W, H), (10, 12, 20))
            dr = ImageDraw.Draw(sheet_im)
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 13)
                head = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 16)
            except Exception:
                font = head = ImageFont.load_default()
            dr.text((pad, pad // 2), f"ossuary · {title} · {a.w}×{a.h}", fill=(200, 210, 240), font=head)
            for i, (n, _) in enumerate(cells):
                x = pad + (i % cols) * (tw + pad)
                y = 30 + pad + (i // cols) * ch
                src = dict(ims)[n]
                sheet_im.paste(src.resize((tw, round(src.height * tw / src.width)), Image.LANCZOS), (x, y))
                dr.text((x + 2, y + tw * 0 + cells[i][1].height + 6), n, fill=(150, 200, 255), font=font)
            path = OUT / out_name
            sheet_im.save(path)
            print(f"  sheet {path.relative_to(ROOT)}  {sheet_im.width}×{sheet_im.height}")

        sheet("workspaces", [f"ws-{x or 'deck'}" for x in ACTS], "sheet-workspaces.png")

httpd.shutdown()
bad = [r for r in results if not r[1]]
print(f"\n{len(results) - len(bad)}/{len(results)} shots healthy")
for n, _, note, _ in bad:
    print(f"  BAD {n}: {note or 'page never reported ready'}")

if a.open:
    subprocess.run(["open", str(OUT)])

sys.exit(1 if bad else 0)
