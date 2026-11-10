from PIL import Image, ImageDraw, ImageFont

W, H = 1440, 900
canvas = Image.new("RGB", (W * 2, H * 2), "#05080c")
tiles = [
    ("style-tiles/shots/desk-type-mono.png", (0, 0)),
    ("style-tiles/shots/desk-type-geist.png", (W, 0)),
    ("style-tiles/shots/desk-type-sans.png", (0, H)),
]
for path, pos in tiles:
    canvas.paste(Image.open(path).convert("RGB"), pos)

mono = "/System/Library/Fonts/Menlo.ttc"
serif = "/System/Library/Fonts/Supplemental/Georgia.ttf"
f_small = ImageFont.truetype(mono, 15)
f_tiny = ImageFont.truetype(mono, 12)
f_label = ImageFont.truetype(mono, 15)
f_body = ImageFont.truetype(mono, 19)
f_title = ImageFont.truetype(serif, 74)

draw = ImageDraw.Draw(canvas)
draw.line([(W, 0), (W, H * 2)], fill="#16212a", width=1)
draw.line([(0, H), (W * 2, H)], fill="#16212a", width=1)

panel = Image.new("RGB", (W, H), "#070b0f")
pd = ImageDraw.Draw(panel)
for y in range(H):
    v = max(0, 16 - int(y * 0.012))
    pd.line([(0, y), (W, y)], fill=(5 + v // 3, 8 + v // 2, 12 + v // 2))
pd.rectangle((72, 64, 96, 68), fill="#8ed8ff")
pd.text((118, 54), "TYPE STUDIES / 02", font=f_small, fill="#8ed8ff")
pd.text((72, 106), "Same desk, three voices.", font=f_title, fill="#ebe6db")
pd.text((72, 196), "The layout is fixed. Only the type system changes.", font=f_body, fill="#8f918f")
pd.line((72, 252, W - 72, 252), fill="#1b262f")

rows = [
    ("M1", "MONO SHELL", "Current", "One monospaced voice. The lesson title is the only serif."),
    ("G1", "GEIST CHROME", "Serif lesson", "Geist takes the controls. Instrument Serif keeps the lesson title."),
    ("G2", "ALL GEIST", "Sans lesson", "One sans voice. Mono stays only for time and code."),
]
y = 292
for badge, name, tag, desc in rows:
    pd.rectangle((72, y, 112, y + 40), fill="#0d151b", outline="#26323b")
    pd.text((84, y + 8), badge, font=f_label, fill="#8ed8ff")
    pd.text((132, y + 2), name, font=f_tiny, fill="#687075")
    pd.text((132, y + 22), tag, font=f_body, fill="#ebe6db")
    pd.text((330, y + 2), desc, font=f_small, fill="#8f918f")
    y += 110

pd.line((72, 654, W - 72, 654), fill="#1b262f")
pd.text((72, 684), "NOTES", font=f_tiny, fill="#8f918f")
notes = [
    "The desk layout, ice-blue signal, and live data are unchanged in all three.",
    "M1 is the current build. G1 and G2 use the self-hosted Geist face already in the project.",
    "In G1 and G2, JetBrains Mono is kept for the clock and the lesson code.",
]
for i, note in enumerate(notes):
    pd.text((72, 716 + i * 27), note, font=f_small, fill="#b7b4ab" if i == 0 else "#8f918f")

pd.text((72, 838), "Review at 1440 × 900. Choose a typography direction, or ask for another face.", font=f_small, fill="#687075")
pd.text((W - 196, 844), "LUAUOS / NOCTALIA", font=f_tiny, fill="#687075")
canvas.paste(panel, (W, H))

overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
labels = [
    ((84, 842), "M1  ·  mono shell"),
    ((W + 84, 842), "G1  ·  Geist + serif"),
    ((84, H + 842), "G2  ·  all Geist"),
]
for (x, y), text in labels:
    tw = od.textlength(text, font=f_label)
    od.rounded_rectangle((x, y, x + tw + 30, y + 26), radius=3, fill=(4, 7, 10, 215), outline=(56, 70, 80, 220))
    od.rectangle((x, y, x + 3, y + 26), fill=(142, 216, 255, 255))
    od.text((x + 14, y + 6), text, font=f_label, fill=(196, 193, 185, 255))
canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
canvas.save("style-tiles/shots/type-studies.png")
