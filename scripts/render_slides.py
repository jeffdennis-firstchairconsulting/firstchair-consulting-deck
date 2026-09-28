#!/usr/bin/env python3
"""
render_slides.py — slide images for the eye pass, the same way every time.

    python3 scripts/render_slides.py Deck.pptx [--out qa/] [--slides 3,7]

Writes, into --out (default: <deck>_qa/ beside the deck):
  sheet-01.jpg, sheet-02.jpg ...   four slides per sheet, numbered: LOOK AT THESE FIRST
  slide-01.jpg, slide-02.jpg ...   one slide each, for a close look at a suspected problem

Every image is at most 1600 px on its long side. Image readers reject or
silently drop larger files once a conversation holds many images (a common
limit is 2000 px when more than 20 images are in context), and an agent that
cannot see an image tends to re-request it in a loop. Old images in --out are
deleted first, so you never judge a stale render.

The rule that goes with it (references/visual_qa.md): view each image once per
render. If an image does not come back as a picture, do not retry it more than
once and never describe a slide you did not see; tell the user the visual pass
could not be done here and hand over with that stated.
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

MAX_PX = 1600


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deck")
    ap.add_argument("--out")
    ap.add_argument("--slides", help="comma-separated slide numbers to render singly (default: all)")
    args = ap.parse_args()
    deck = Path(args.deck).resolve()
    if not deck.exists():
        sys.exit(f"not found: {deck}")
    soffice = shutil.which("soffice") or shutil.which("libreoffice")
    if not soffice or not shutil.which("pdftoppm"):
        print("LibreOffice (soffice) and/or pdftoppm are not installed: slide images cannot be made here.")
        print("Do not describe slides you have not seen. Tell the user the visual pass was not possible, "
              "rely on validate_deck.py and layout_check.py, and say so in the hand-over.")
        return 2
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        sys.exit("Pillow is required: pip install pillow")

    out = Path(args.out) if args.out else deck.parent / (deck.stem + "_qa")
    out.mkdir(parents=True, exist_ok=True)
    for old in list(out.glob("slide-*.jpg")) + list(out.glob("sheet-*.jpg")):
        old.unlink()

    with tempfile.TemporaryDirectory() as td:
        r = subprocess.run([soffice, "--headless", "--convert-to", "pdf", "--outdir", td, str(deck)],
                           capture_output=True, text=True, timeout=600)
        pdf = Path(td) / (deck.stem + ".pdf")
        if not pdf.exists():
            sys.exit(f"LibreOffice did not produce a PDF:\n{r.stdout}\n{r.stderr}")
        shutil.copy2(pdf, out / pdf.name)
        subprocess.run(["pdftoppm", "-jpeg", "-scale-to", str(MAX_PX), str(pdf), str(Path(td) / "p")], check=True)
        pages = sorted(Path(td).glob("p-*.jpg"), key=lambda p: int(p.stem.split("-")[1]))
        want = {int(x) for x in args.slides.split(",")} if args.slides else None
        singles = []
        for i, p in enumerate(pages, 1):
            if want is None or i in want:
                dest = out / f"slide-{i:02d}.jpg"
                shutil.copy2(p, dest)
                singles.append(dest)
        # contact sheets: 2 x 2, numbered, each at most MAX_PX wide
        sheets = []
        cell_w = (MAX_PX - 10) // 2
        for s in range(0, len(pages), 4):
            ims = [Image.open(p) for p in pages[s:s + 4]]
            ims = [im.resize((cell_w, round(im.height * cell_w / im.width))) for im in ims]
            ch = ims[0].height
            rows = (len(ims) + 1) // 2
            sheet = Image.new("RGB", (MAX_PX, rows * ch + (rows - 1) * 10), "white")
            d = ImageDraw.Draw(sheet)
            for k, im in enumerate(ims):
                x, y = (k % 2) * (cell_w + 10), (k // 2) * (ch + 10)
                sheet.paste(im, (x, y))
                d.rectangle([x, y, x + 44, y + 26], fill="black")
                d.text((x + 8, y + 7), str(s + k + 1), fill="white")
            dest = out / f"sheet-{s // 4 + 1:02d}.jpg"
            sheet.save(dest, quality=85)
            sheets.append(dest)

    print(f"{len(pages)} slides -> {out}")
    print("  sheets (look at these first, once each): " + ", ".join(p.name for p in sheets))
    print(f"  singles: {len(singles)} (open one only to check a suspected problem)")
    print("If an image does not come back as a picture, retry once at most, then stop and tell the user; "
          "never describe a slide you have not seen.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
