#!/usr/bin/env python3
"""
setup_fonts.py — make the visual-QA render honest. Run once per sandbox,
before the first `soffice --convert-to pdf`.

    python3 scripts/setup_fonts.py

The house style is Georgia (headlines, figures) and Calibri (everything else).
Neither ships on Linux. Without substitutes LibreOffice falls back to whatever
it has, line breaks move, and the eye pass judges a slide that PowerPoint will
never show. This installs the metric-compatible open faces and aliases them:

    Georgia -> Gelasio   (shipped in assets/fonts/, SIL OFL)
    Calibri -> Carlito   (the fonts-crosextra-carlito package; usually present)

Same advance widths, so the render's line breaks match PowerPoint's. Glyph
shapes differ slightly: judge fit from the render, final appearance in
PowerPoint. Exit 1 if a face is still missing after the attempt.
"""
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
FONT_SRC = next((p for p in (HERE.parent / "assets" / "fonts", HERE / "fonts") if p.exists()), None)
FONT_DIR = Path.home() / ".fonts"
CONF = Path.home() / ".config" / "fontconfig" / "fonts.conf"
ALIASES = {"Georgia": "Gelasio", "Calibri": "Carlito"}


def has(family):
    try:
        out = subprocess.run(["fc-list", ":family=" + family], capture_output=True, text=True, timeout=30).stdout
    except (OSError, subprocess.SubprocessError):
        return False
    return bool(out.strip())


def main():
    if shutil.which("fc-list") is None:
        print("fontconfig (fc-list) is not installed; LibreOffice rendering is not available here either. "
              "Skip the image render and say so in the hand-over.")
        return 1
    FONT_DIR.mkdir(parents=True, exist_ok=True)
    if FONT_SRC:
        for ttf in FONT_SRC.glob("*.ttf"):
            dest = FONT_DIR / ttf.name
            if not dest.exists():
                shutil.copy2(ttf, dest)
    else:
        print("assets/fonts not found; the skill is incomplete (Gelasio ships there)")
    CONF.parent.mkdir(parents=True, exist_ok=True)
    alias = "".join(f"  <alias binding=\"same\"><family>{a}</family><prefer><family>{b}</family></prefer></alias>\n"
                    for a, b in ALIASES.items())
    CONF.write_text("<?xml version=\"1.0\"?>\n<!DOCTYPE fontconfig SYSTEM \"fonts.dtd\">\n<fontconfig>\n"
                    f"  <dir>{FONT_DIR}</dir>\n{alias}</fontconfig>\n")
    subprocess.run(["fc-cache", "-f"], capture_output=True, timeout=120)
    missing = [b for b in ALIASES.values() if not has(b)]
    for a, b in ALIASES.items():
        print(f"  {a:8s} -> {b:8s} {'ok' if b not in missing else 'MISSING'}")
    if "Carlito" in missing:
        print("Carlito is missing: install fonts-crosextra-carlito (apt) or place Carlito-*.ttf in ~/.fonts, then re-run.")
    if missing:
        print("Until then the render substitutes other faces; do not judge line breaks from it.")
        return 1
    print("Fonts ready. Render with soffice; line breaks now match PowerPoint's.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
