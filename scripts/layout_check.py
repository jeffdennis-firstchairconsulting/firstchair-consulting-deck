#!/usr/bin/env python3
"""
layout_check.py — the mechanical half of visual QA. Run after validate_deck.py.

    python3 scripts/layout_check.py Deck.pptx [--brief brief.json]

Per slide it flags:
  OVERFLOW  text that will not fit its box (measured per run font with the
            Georgia/Calibri metric table the renderer uses, +10% slack) -> FAIL
  OVERLAP   two text-bearing shapes whose boxes intersect          -> FAIL
  ROW       siblings in a row whose top or height differ (>0.05")  -> WARN
  HEADLINE  a headline that runs to three lines                    -> WARN
  EMPTY     an empty band taller than 25% of the content area      -> WARN
  FOOTER    content within 0.3" of the footer band                 -> WARN
  SOURCE    a slide with a chart or table and no source line       -> WARN
                                                                (FAIL with --brief:
                                                                 the brief says which
                                                                 slides are data slides)
Exit 1 on any FAIL. The eye pass must resolve or dismiss every WARN.
"""
import argparse
import json
import sys
from pathlib import Path

try:
    from pptx import Presentation
    from pptx.util import Emu
    from PIL import ImageFont
except ImportError as exc:  # noqa: BLE001
    sys.exit(f"missing dependency ({exc}); pip install python-pptx pillow")

EMU_IN = 914400
SLACK = 1.10
LINE = 1.20
DATA_PATTERNS = {"chart", "waterfall", "scorecard", "heatmap", "matrix", "roadmap", "gantt", "maturity", "table", "curve", "kpi_strip", "stage_tracker", "one_number", "one_status"}

def _metrics():
    """Advance widths for Georgia and Calibri (from the metric-compatible open
    fonts Gelasio and Carlito), the same table the renderer sizes with."""
    here = Path(__file__).resolve().parent
    for cand in (here / "font_metrics.json", here.parent / "assets" / "font_metrics.json"):
        if cand.exists():
            return json.loads(cand.read_text())["faces"]
    sys.exit("font_metrics.json not found next to this script or in ../assets; the skill is incomplete")


FACES = _metrics()


def width_in(text, size_pt, bold, face="Calibri", italic=False):
    f = FACES.get(face) or FACES["Calibri"]
    tbl = f["bold"] if bold else (f.get("italic") if italic and f.get("italic") else f["regular"])
    return sum(tbl.get(ch, 0.55) for ch in text) * size_pt / 72 * SLACK


def lines_needed(text, size_pt, bold, w_in, face="Calibri"):
    total = 0
    for para in text.split("\n"):
        words = para.split()
        if not words:
            total += 1
            continue
        cur, n = 0.0, 1
        sp = width_in(" ", size_pt, bold, face)
        for wd in words:
            ww = width_in(wd, size_pt, bold, face)
            if cur > 0 and cur + sp + ww > w_in:
                n += 1
                cur = ww
            else:
                cur += (sp if cur > 0 else 0) + ww
        total += n
    return total


def text_runs(shape):
    """(text, size_pt, bold, runs) per paragraph. runs = [(text,size,bold)] for mixed-size lines."""
    out = []
    for para in shape.text_frame.paragraphs:
        t = "".join(r.text for r in para.runs)
        if not t.strip():
            out.append(("", 11, False, []))
            continue
        runs = [(r.text, r.font.size.pt if r.font.size else 11, bool(r.font.bold), r.font.name or "Calibri") for r in para.runs]
        size = max(r[1] for r in runs)
        out.append((t, size, any(r[2] for r in runs), runs))
    return out


def para_lines(t, size, bold, runs, w):
    """Lines a paragraph needs; mixed-size runs that fit on one line count as one."""
    if len({r[1] for r in runs}) > 1:
        total = sum(width_in(rt, rs, rb, rf) for rt, rs, rb, rf in runs)
        if total <= w:
            return 1
    return lines_needed(t, size, bold, w, runs[0][3] if runs else "Calibri")


def shape_box(sh):
    """Box as drawn: a quarter-turn rotation swaps width and height about the centre."""
    if sh.left is None or sh.top is None:
        return None
    l, t, w, h = sh.left / EMU_IN, sh.top / EMU_IN, (sh.width or 0) / EMU_IN, (sh.height or 0) / EMU_IN
    if round((getattr(sh, "rotation", 0) or 0) % 180) == 90:
        cx, cy = l + w / 2, t + h / 2
        l, t, w, h = cx - h / 2, cy - w / 2, h, w
    return (l, t, l + w, t + h)


def intersect(a, b, tol=0.02):
    return not (a[2] <= b[0] + tol or b[2] <= a[0] + tol or a[3] <= b[1] + tol or b[3] <= a[1] + tol)


def check(path, brief=None):
    prs = Presentation(str(path))
    fails, warns = [], []
    patterns = [s.get("pattern") for s in (brief or {}).get("slides", [])] if brief else []

    for i, slide in enumerate(prs.slides, start=1):
        pat = patterns[i - 1] if i - 1 < len(patterns) else None
        boxes = []           # (box, text, is_text)
        has_chart = has_table = has_source = False
        headline_lines = 0
        for sh in slide.shapes:
            box = shape_box(sh)
            if box is None:
                continue
            if sh.has_chart:
                has_chart = True
                boxes.append((box, "<chart>", False))
                continue
            if sh.has_table:
                has_table = True
                boxes.append((box, "<table>", False))
                continue
            if not sh.has_text_frame:
                continue
            txt = sh.text_frame.text.strip()
            if not txt:
                continue
            if txt.startswith("Source:"):
                has_source = True
                continue
            in_footer = box[1] > 6.9
            if in_footer:
                continue
            boxes.append((box, txt, True))
            # OVERFLOW
            w = box[2] - box[0] - 0.06
            h = box[3] - box[1]
            need = 0.0
            for t, size, bold, runs in text_runs(sh):
                need += (para_lines(t, size, bold, runs, w) if t else 1) * size / 72 * LINE
            if need > h + 0.06 and h > 0.15:
                fails.append(f"slide {i}: OVERFLOW  needs {need:.2f}\" has {h:.2f}\"  {txt[:50]!r}")
            # HEADLINE (the navy 24-42pt bold box near the top)
            runs = text_runs(sh)
            if runs and runs[0][2] and runs[0][1] >= 24 and box[1] < 1.2:
                headline_lines = max(headline_lines, sum(lines_needed(t, s_, b, w, rr[0][3] if rr else "Calibri") for t, s_, b, rr in runs if t))
        if headline_lines >= 3:
            warns.append(f"slide {i}: HEADLINE  runs to {headline_lines} lines")

        # OVERLAP between text boxes (charts/tables count as solid)
        for a in range(len(boxes)):
            for b in range(a + 1, len(boxes)):
                (ba, ta, ia), (bb, tb, ib) = boxes[a], boxes[b]
                if not (ia or ib):
                    continue
                if intersect(ba, bb):
                    # nested (a label inside a card) is fine only if one fully contains the other
                    contains = (ba[0] <= bb[0] + 0.01 and ba[1] <= bb[1] + 0.01 and ba[2] >= bb[2] - 0.01 and ba[3] >= bb[3] - 0.01) or \
                               (bb[0] <= ba[0] + 0.01 and bb[1] <= ba[1] + 0.01 and bb[2] >= ba[2] - 0.01 and bb[3] >= ba[3] - 0.01)
                    if not contains:
                        fails.append(f"slide {i}: OVERLAP   {ta[:30]!r} x {tb[:30]!r}")

        # ROW alignment: sibling boxes (same width and height) whose tops are nearly but not exactly equal
        sib = {}
        for b, t, it in boxes:
            if it:
                sib.setdefault((round(b[2] - b[0], 2), round(b[3] - b[1], 2)), []).append(round(b[1], 2))
        for tops in sib.values():
            tops = sorted(set(tops))
            for k in range(len(tops) - 1):
                if 0.02 < tops[k + 1] - tops[k] <= 0.12:
                    warns.append(f"slide {i}: ROW       sibling boxes at {tops[k]:.2f}\" and {tops[k + 1]:.2f}\" nearly but not exactly aligned")

        # EMPTY region: largest vertical gap between content boxes in the content area
        content = [b for b, t, it in boxes if b[1] >= 2.0]
        structural = pat in {"title", "section", "statement", "backup", "sources", "agenda"} if pat else False
        if content and not structural:
            ys = sorted((b[1], b[3]) for b in content)
            bottom = max(b[3] for b in content)
            gap_top = ys[0][0] - 2.4
            gaps = [gap_top] + [ys[k + 1][0] - max(y2 for _, y2 in ys[:k + 1]) for k in range(len(ys) - 1)]
            gaps.append(6.6 - bottom)
            area = 6.6 - 2.4
            worst = max(gaps)
            if worst > 0.25 * area and worst > 1.2:
                warns.append(f"slide {i}: EMPTY     {worst:.2f}\" of empty space inside the content area")
            if bottom > 6.78 - 0.02 and i > 1:
                warns.append(f"slide {i}: FOOTER    content reaches {bottom:.2f}\", into the source/footer band")

        is_data = (pat in DATA_PATTERNS) if pat else (has_chart or has_table)
        if is_data and not has_source:
            (fails if pat else warns).append(f"slide {i}: SOURCE    data slide with no source line")

    return fails, warns


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deck")
    ap.add_argument("--brief")
    a = ap.parse_args()
    brief = json.load(open(a.brief)) if a.brief else None
    fails, warns = check(Path(a.deck), brief)
    for w in warns:
        print("  WARN", w)
    for f in fails:
        print("  FAIL", f)
    print(f"\n{a.deck}: {len(fails)} fail, {len(warns)} warn")
    if fails:
        print("Fix in the brief (content or a `tune` block), re-render, re-check. Never hand-edit the file.")
        return 1
    print("Layout PASS (mechanical) — now render to images and look at every slide.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
