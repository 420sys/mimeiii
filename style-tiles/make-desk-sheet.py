from PIL import Image, ImageDraw, ImageFont

W, H = 1440, 900
canvas = Image.new("RGB", (W * 2, H * 2), "#05080c")
a = Image.open("style-tiles/shots/desk-study-a.png").convert("RGB")
b = Image.open("style-tiles/shots/desk-study-b.png").convert("RGB")
c = Image.open("style-tiles/shots/desk-study-c.png").convert("RGB")
canvas.paste(a, (0, 0))
canvas.paste(b, (W, 0))
canvas.paste(c, (0, H))

mono = "/System/Library/Fonts/Menlo.ttc"
serif = "/System/Library/Fonts/Supplemental/Georgia.ttf"
serif_italic = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"

f_small = ImageFont.truetype(mono, 15)
f_tiny = ImageFont.truetype(mono, 12)
f_label = ImageFont.truetype(mono, 15)
f_body = ImageFont.truetype(mono, 19)
f_title = ImageFont.truetype(serif, 74)
f_title_italic = ImageFont.truetype(serif_italic, 74)
f_letter = ImageFont.truetype(mono, 54)

draw = ImageDraw.Draw(canvas)

# image boundary lines
for x in (W,):
    draw.line([(x, 0), (x, H * 2)], fill="#16212a", width=1)
for y in (H,):
    draw.line([(0, y), (W * 2, y)], fill="#16212a", width=1)

# panel
p = (W, H, W * 2, H * 2)
panel = Image.new("RGB", (W, H), "#070b0f")
pd = ImageDraw.Draw(panel)
# very quiet horizontal light
for y in range(H):
    v = max(0, 16 - int(y * 0.012))
    pd.line([(0, y), (W, y)], fill=(5 + v // 3, 8 + v // 2, 12 + v // 2))
# accent hairline
pd.rectangle((72, 64, 96, 68), fill="#8ed8ff")
pd.text((118, 54), "DESK STUDIES / 01", font=f_small, fill="#8ed8ff")
pd.text((72, 106), "One desk. Three weights.", font=f_title, fill="#ebe6db")
pd.text((72, 196), "Same graphite, same live data, same ice-blue signal.", font=f_body, fill="#8f918f")

# divider
pd.line((72, 252, W - 72, 252), fill="#1b262f")

# variant list
rows = [
    ("A", "TOP LEFT", "now, large", "The next session becomes the room's focal point. The course line sits at the bottom edge."),
    ("B", "TOP RIGHT", "the clock", "Time becomes furniture. The right rail keeps the session and progress within reach."),
    ("C", "BOTTOM LEFT", "the path", "The whole course laid out as a quiet left column. The next stop is already marked."),
]
y = 294
for letter, where, title, desc in rows:
    pd.rectangle((72, y, 112, y + 40), fill="#0d151b", outline="#26323b")
    pd.text((84, y + 8), letter, font=f_label, fill="#8ed8ff")
    pd.text((132, y + 2), where, font=f_tiny, fill="#687075")
    pd.text((132, y + 22), title, font=f_body, fill="#ebe6db")
    pd.text((300, y + 2), desc[:70], font=f_small, fill="#8f918f")
    if len(desc) > 70:
        pd.text((300, y + 24), desc[70:], font=f_small, fill="#8f918f")
    y += 106

# signal strip
pd.line((72, 646, W - 72, 646), fill="#1b262f")
pd.text((72, 676), "SIGNAL STUDY", font=f_tiny, fill="#8f918f")
swatches = [
    ("ice blue", "#8ed8ff", "current"),
    ("mint", "#9be8c6", ""),
    ("lilac", "#c9b8ff", ""),
    ("bone", "#ede7da", ""),
]
x = 72
for name, color, note in swatches:
    pd.ellipse((x, 716, x + 20, 736), fill=color)
    pd.text((x + 30, 716), name, font=f_small, fill="#c4c1b9")
    if note:
        pd.text((x + 30, 736), note, font=f_tiny, fill="#8ed8ff")
    x += 270

pd.text((72, 810), "All studies use the real course and machine data, with no windows open.", font=f_small, fill="#8f918f")
pd.text((72, 842), "Review at 1440 × 900. Signal can change independently of the layout.", font=f_small, fill="#687075")
pd.text((W - 196, 844), "LUAUOS / NOCTALIA", font=f_tiny, fill="#687075")

canvas.paste(panel, (W, H))

# labels over the screenshot tiles
overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
labels = [
    ((84, 842), "A  ·  now, large"),
    ((W + 84, 842), "B  ·  the clock"),
    ((84, H + 842), "C  ·  the path"),
]
for (x, y), text in labels:
    tw = od.textlength(text, font=f_label)
    od.rounded_rectangle((x, y, x + tw + 30, y + 26), radius=3, fill=(4, 7, 10, 215), outline=(56, 70, 80, 220))
    od.rectangle((x, y, x + 3, y + 26), fill=(142, 216, 255, 255))
    od.text((x + 14, y + 6), text, font=f_label, fill=(196, 193, 185, 255))
canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
canvas.save("style-tiles/shots/desk-studies.png")
