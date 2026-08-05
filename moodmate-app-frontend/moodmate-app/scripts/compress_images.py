from PIL import Image
from pathlib import Path

base = Path(__file__).resolve().parents[1] / "assets" / "images"
badges = base / "badges"
home = base / "home"

for p in badges.glob("*.png"):
    im = Image.open(p).convert("RGBA")
    im = im.resize((256, 256), Image.Resampling.LANCZOS)
    bg = Image.new("RGB", im.size, (248, 248, 246))
    bg.paste(im, mask=im.split()[-1])
    bg.save(p, "PNG", optimize=True)
    print(p.name, p.stat().st_size)

for name, size in [
    ("moodbird.png", (320, 320)),
    ("wellness-tree.png", (320, 320)),
    ("mission-hero.png", (800, 450)),
]:
    p = home / name
    im = Image.open(p).convert("RGBA")
    im = im.resize(size, Image.Resampling.LANCZOS)
    bg = Image.new("RGB", im.size, (248, 248, 246))
    bg.paste(im, mask=im.split()[-1])
    bg.save(p, "PNG", optimize=True)
    print(name, p.stat().st_size)
