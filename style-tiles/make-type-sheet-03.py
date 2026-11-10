from PIL import Image, ImageDraw, ImageFont

W, H = 1440, 900
canvas = Image.new("RGB", (W * 2, H * 2), "#05080c")
tiles = [
    ("style-tiles/shots/desk-type-p1.png", (0, 0)),
    ("style-tiles/shots/desk-type-p2.png", (W, 0)),
    ("style-tiles/shots/desk-type-p3.png", (0, H)),
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
pd.text((118, 54), "TYPE STUDIES / 03", font=f_small, fill="#8ed8ff")
pd.text((72, 106), "Another three voices.", font=f_title, fill="#ebe6db")
pd.text((72, 196), "The layout is fixed. New families, same desk.", font=f_body, fill="#8f918f")
pd.line((72, 252, W - 72, 252), fill="#1b262f")

rows = [
    ("P1", "SPACE GROTESK", "Geometric", "A sharp engineered sans. One family across the whole desk."),
    ("P2", "IBM PLEX", "Technical", "A humanist Linux sans, with Plex Mono for time and code."),
    ("P3", "SORA + NEWSREADER", "Editorial", "Sora controls the machine; Newsreader gives the lesson its voice."),
]
y = 292
for badge, name, tag, desc in rows:
    pd.rectangle((72, y, 112, y + 40), fill="#0d151b", outline="#26323b")
    pd.text((84, y + 8), badge, font=f_label, fill="#8ed8ff")
    pd.text((132, y + 2), name, font=f_tiny, fill="#687075")
    pd.text((132, y + 22), tag, font=f_body, fill="#ebe6db")
    pd.text((350, y + 2), desc, font=f_small, fill="#8f918f")
    y += 110

pd.line((72, 654, W - 72, 654), fill="#1b262f")
pd.text((72, 684), "NOTES", font=f_tiny, fill="#8f918f")
notes = [
    "All three keep the ice-blue signal and the D2 lesson-cover hero.",
    "Space Grotesk, IBM Plex, Sora, and Newsreader are now self-hosted in assets/fonts.",
    "In P1 and P2 the clock and code fall back to mono; P3 keeps JetBrains Mono there.",
]
for i, note in enumerate(notes):
    pd.text((72, 716 + i * 27), note, font=f_small, fill="#b7b4ab" if i == 0 else "#8f918f")

pd.text((72, 838), "Review at 1440 × 900. Pick a family, or ask for one more direction.", font=f_small, fill="#687075")
pd.text((W - 196, 844), "LUAUOS / NOCTALIA", font=f_tiny, fill="#687075")
canvas.paste(panel, (W, H))

overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
labels = [
    ((84, 842), "P1  ·  Space Grotesk"),
    ((W + 84, 842), "P2  ·  IBM Plex"),
    ((84, H + 842), "P3  ·  Sora + Newsreader"),
]
for (x, y), text in labels:
    tw = od.textlength(text, font=f_label)
    od.rounded_rectangle((x, y, x + tw + 30, y + 26), radius=3, fill=(4, 7, 10, 215), outline=(56, 70, 80, 220))
    od.rectangle((x, y, x + 3, y + 26), fill=(142, 216, 255, 255))
    od.text((x + 14, y + 6), text, font=f_label, fill=(196, 193, 185, 255))
canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
canvas.save("style-tiles/shots/type-studies-03.png")
