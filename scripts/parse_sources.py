#!/usr/bin/env python3
"""
parse_sources.py — inventory source material and fix citation anchors.

    python3 scripts/parse_sources.py ./inbox notes.docx -o sources.json

Handles .docx .pptx .xlsx .csv .pdf .md .txt, and MIME/MHTML exports (Confluence 'Export to Word' .doc, .mht). For each file it records the structure,
the figures with the phrase around them, and an anchor precise enough to cite:

    report.docx ¶14          model.xlsx!Summary!B7          findings.pdf p.3

What this is NOT: a comprehension engine. You read the prose yourself. This
reaches material too large or too binary for your context (spreadsheets, long
PDFs), gives you locators so citations are real rather than remembered, and
lists what arrived so nothing is silently ignored.

Snippets are capped deliberately. Client prose stays in the client's documents —
summarize and cite, do not copy through.
"""

import argparse
import csv
import datetime as dt
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from _common import need, save_json  # noqa: E402

SNIPPET = 140
MAX_FIGURES = 40
MAX_HEADINGS = 60

# money, percentages, multipliers, and plain counts of 2+ digits
FIGURE_RE = re.compile(
    r"(?<![\w.])("
    r"[$£€]\s?\d[\d,]*(?:\.\d+)?\s?(?:k|m|bn|b|million|billion)?"
    r"|\d[\d,]*(?:\.\d+)?\s?%"
    r"|\d[\d,]*(?:\.\d+)?\s?(?:x|hrs?|hours?|days?|weeks?|months?|years?|FTEs?|devices?|sites?|users?|seats?)"
    r"|\d{2,}[\d,]*(?:\.\d+)?"
    r")(?![\w])",
    re.I,
)
DATE_RE = re.compile(
    r"\b(?:Q[1-4]\s?(?:FY)?\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}"
    r"|\d{4}-\d{2}-\d{2}|\b(?:FY)\d{2,4})\b",
    re.I,
)


def clip(text, n=SNIPPET):
    text = re.sub(r"\s+", " ", (text or "")).strip()
    return text if len(text) <= n else text[: n - 1].rstrip() + "…"


def scan_text(text, anchor, figures, dates):
    """Pull figures and dates out of one block of text, tagged with its anchor."""
    if not text or not text.strip():
        return
    flat = re.sub(r"\s+", " ", text).strip()
    for m in FIGURE_RE.finditer(flat):
        if len(figures) >= MAX_FIGURES:
            break
        s, e = m.span()
        figures.append({
            "value": m.group(1).strip(),
            "context": clip(flat[max(0, s - 60):min(len(flat), e + 60)]),
            "anchor": anchor,
        })
    for m in DATE_RE.finditer(flat):
        d = m.group(0)
        if not any(x["text"].lower() == d.lower() for x in dates):
            dates.append({"text": d, "anchor": anchor})


# --------------------------------------------------------------------------- #
#  per-format readers                                                          #
# --------------------------------------------------------------------------- #

def read_docx(path, rec):
    docx = need("docx")
    doc = docx.Document(str(path))
    headings, figures, dates, tables = [], [], [], []
    for i, para in enumerate(doc.paragraphs, 1):
        text = (para.text or "").strip()
        if not text:
            continue
        anchor = f"{path.name} ¶{i}"
        style = (para.style.name or "") if para.style else ""
        if style.lower().startswith("heading") or style.lower() == "title":
            if len(headings) < MAX_HEADINGS:
                headings.append({"text": clip(text, 100), "level": style, "anchor": anchor})
        scan_text(text, anchor, figures, dates)
    for t_i, table in enumerate(doc.tables, 1):
        hdr = [clip(c.text, 40) for c in table.rows[0].cells] if table.rows else []
        tables.append({"anchor": f"{path.name} table {t_i}", "rows": len(table.rows),
                       "cols": len(table.columns), "headers": hdr})
        for r_i, row in enumerate(table.rows[1:], 2):
            scan_text(" | ".join(c.text for c in row.cells),
                      f"{path.name} table {t_i} row {r_i}", figures, dates)
    rec.update(structure={"paragraphs": len(doc.paragraphs), "tables": len(doc.tables)},
               headings=headings, figures=figures, dates=dates, tables=tables)


def read_xlsx(path, rec):
    openpyxl = need("openpyxl")
    wb = openpyxl.load_workbook(str(path), read_only=True, data_only=True)
    sheets, figures, dates, labelled = [], [], [], []
    for ws in wb.worksheets:
        rows = list(ws.iter_rows(max_row=min(ws.max_row or 1, 400), values_only=False))
        if not rows:
            sheets.append({"name": ws.title, "rows": 0, "cols": 0, "headers": [], "columns": []})
            continue
        header_cells = [c for c in rows[0]]
        headers = [clip(str(c.value), 32) for c in header_cells if c.value is not None]
        cols = {}
        for row in rows[1:]:
            # a leading text cell labels the numbers on its row: "Unrecorded devices | 1180"
            label = None
            for cell in row:
                if isinstance(cell.value, str) and cell.value.strip():
                    label = clip(cell.value, 60)
                    break
            for idx, cell in enumerate(row):
                if cell.value is None or idx >= len(header_cells):
                    continue
                name = headers[idx] if idx < len(headers) else f"col{idx+1}"
                if isinstance(cell.value, (int, float)) and not isinstance(cell.value, bool):
                    cols.setdefault(name, []).append((float(cell.value), cell.coordinate))
                    if label and len(labelled) < 80:
                        labelled.append({
                            "label": label, "column": name,
                            "value": int(cell.value) if float(cell.value).is_integer() else float(cell.value),
                            "anchor": f"{path.name}!{ws.title}!{cell.coordinate}",
                        })
                elif isinstance(cell.value, (dt.date, dt.datetime)):
                    d = cell.value.isoformat()[:10]
                    if not any(x["text"] == d for x in dates):
                        dates.append({"text": d, "anchor": f"{path.name}!{ws.title}!{cell.coordinate}"})
                elif isinstance(cell.value, str):
                    scan_text(cell.value, f"{path.name}!{ws.title}!{cell.coordinate}", figures, dates)
        summaries = []
        for name, vals in cols.items():
            nums = [v for v, _ in vals]
            if not nums:
                continue
            hi = max(vals, key=lambda t: t[0])
            summaries.append({
                "column": name, "count": len(nums), "min": round(min(nums), 4),
                "max": round(hi[0], 4), "sum": round(sum(nums), 4),
                "max_at": f"{path.name}!{ws.title}!{hi[1]}",
            })
        sheets.append({"name": ws.title, "rows": ws.max_row or 0, "cols": ws.max_column or 0,
                       "headers": headers[:20], "columns": summaries[:20]})
    wb.close()
    rec.update(structure={"sheets": [s["name"] for s in sheets]}, sheets=sheets,
               labelled_figures=labelled, figures=figures, dates=dates)


def read_csv(path, rec):
    figures, dates = [], []
    with path.open(newline="", encoding="utf-8", errors="replace") as fh:
        sample = fh.read(8192)
        fh.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample) if sample.strip() else csv.excel
        except csv.Error:
            dialect = csv.excel
        reader = csv.reader(fh, dialect)
        rows = []
        for i, row in enumerate(reader):
            if i > 2000:
                break
            rows.append(row)
    headers = rows[0] if rows else []
    cols = {h: [] for h in headers}
    for r_i, row in enumerate(rows[1:], 2):
        for idx, val in enumerate(row):
            if idx >= len(headers):
                continue
            try:
                cols[headers[idx]].append(float(str(val).replace(",", "").replace("$", "")))
            except ValueError:
                scan_text(val, f"{path.name} row {r_i} col {headers[idx]}", figures, dates)
    summaries = [{"column": h, "count": len(v), "min": round(min(v), 4),
                  "max": round(max(v), 4), "sum": round(sum(v), 4)}
                 for h, v in cols.items() if v]
    rec.update(structure={"rows": max(len(rows) - 1, 0), "cols": len(headers)},
               headers=[clip(h, 32) for h in headers], columns=summaries[:20],
               figures=figures, dates=dates)


def read_pdf(path, rec):
    pdfplumber = need("pdfplumber")
    figures, dates, pages = [], [], 0
    with pdfplumber.open(str(path)) as pdf:
        pages = len(pdf.pages)
        for p_i, page in enumerate(pdf.pages, 1):
            if p_i > 80:
                break
            scan_text(page.extract_text() or "", f"{path.name} p.{p_i}", figures, dates)
    rec.update(structure={"pages": pages}, figures=figures, dates=dates)


def read_pptx(path, rec):
    pptx = need("pptx")
    prs = pptx.Presentation(str(path))
    headings, figures, dates, n = [], [], [], 0
    for i, slide in enumerate(prs.slides, 1):
        n = i
        texts = []
        for sh in slide.shapes:
            if sh.has_text_frame and sh.text_frame.text.strip():
                texts.append(sh.text_frame.text.strip())
            if getattr(sh, "has_table", False) and sh.has_table:
                for row in sh.table.rows:
                    texts.append(" | ".join(c.text for c in row.cells))
        if texts and len(headings) < MAX_HEADINGS:
            headings.append({"text": clip(texts[0], 100), "level": "slide", "anchor": f"{path.name} slide {i}"})
        for t in texts:
            scan_text(t, f"{path.name} slide {i}", figures, dates)
    rec.update(structure={"slides": n}, headings=headings, figures=figures, dates=dates)


def read_plain(path, rec):
    text = path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    headings, figures, dates = [], [], []
    for i, line in enumerate(lines, 1):
        if line.startswith("#") and len(headings) < MAX_HEADINGS:
            headings.append({"text": clip(line.lstrip("# ").strip(), 100),
                             "level": f"h{len(line) - len(line.lstrip('#'))}",
                             "anchor": f"{path.name} line {i}"})
        scan_text(line, f"{path.name} line {i}", figures, dates)
    rec.update(structure={"lines": len(lines), "words": len(text.split())},
               headings=headings, figures=figures, dates=dates)



def is_mime(path):
    """A Confluence 'Export to Word' is a MIME multipart file with a .doc
    extension. Word opens it; python-docx does not. Sniff the first bytes."""
    try:
        head = path.open("rb").read(600)
    except OSError:
        return False
    return b"MIME-Version:" in head and b"Content-Type: multipart/related" in head


IMAGE_MIN_WIDTH = 800


def read_mhtml(path, rec):
    """Confluence / browser MHTML exports. Text comes from the HTML part;
    every embedded image is saved beside sources.json with its pixel size,
    because a screenshot the user thinks is in the material is often a
    350-px thumbnail, and the agent must say so instead of drawing one."""
    import email
    import html as htmlmod
    from email import policy
    msg = email.message_from_bytes(path.read_bytes(), policy=policy.default)
    headings, figures, dates, images = [], [], [], []
    text = ""
    img_dir = Path(OUT_DIR) / f"{path.stem}_images"
    n = 0
    for part in msg.walk():
        ct = part.get_content_type()
        if ct == "text/html" and not text:
            h = part.get_content()
            for tag, lvl in (("h1", "h1"), ("h2", "h2"), ("h3", "h3")):
                for m in re.finditer(rf"<{tag}[^>]*>(.*?)</{tag}>", h, re.S | re.I):
                    t = htmlmod.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
                    if t and len(headings) < MAX_HEADINGS:
                        headings.append({"text": clip(t, 100), "level": lvl, "anchor": f"{path.name} §{t[:40]}"})
            t = re.sub(r"<(style|script).*?</\1>", "", h, flags=re.S | re.I)
            t = re.sub(r"<br\s*/?>|</p>|</h\d>|</li>|</tr>", "\n", t, flags=re.I)
            text = htmlmod.unescape(re.sub(r"<[^>]+>", "", t))
        elif ct.startswith("image/") or ct == "application/octet-stream":
            b = part.get_payload(decode=True) or b""
            ext = "png" if b[:4] == b"\x89PNG" else "jpg" if b[:2] == b"\xff\xd8" else "gif" if b[:3] == b"GIF" else None
            if not ext:
                continue
            n += 1
            img_dir.mkdir(parents=True, exist_ok=True)
            f = img_dir / f"img{n:02d}.{ext}"
            f.write_bytes(b)
            w = hgt = None
            try:
                from PIL import Image
                w, hgt = Image.open(f).size
            except Exception:  # noqa: BLE001
                pass
            images.append({"path": str(f), "width": w, "height": hgt,
                           "usable": (w or 0) >= IMAGE_MIN_WIDTH and (hgt or 0) >= 300,
                           "anchor": f"{path.name} image {n}"})
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    for i, line in enumerate(lines, 1):
        scan_text(line, f"{path.name} line {i}", figures, dates)
    thumbs = [im for im in images if not im["usable"]]
    rec.update(structure={"lines": len(lines), "words": len(text.split()), "images": len(images)},
               headings=headings, figures=figures, dates=dates, images=images,
               text_path=str(Path(OUT_DIR) / f"{path.stem}.txt"))
    (Path(OUT_DIR) / f"{path.stem}.txt").write_text("\n".join(lines), encoding="utf-8")
    if images and thumbs:
        rec["note"] = (f"{len(thumbs)} of {len(images)} embedded images are below {IMAGE_MIN_WIDTH}px wide (Confluence thumbnails). "
                       f"They cannot go on a slide. If screens are to be shown, ask the user for full-size captures. Never draw a mock-up in their place.")


def read_legacy_doc(path, rec):
    if is_mime(path):
        return read_mhtml(path, rec)
    rec["status"] = "unsupported"
    rec["note"] = "binary Word 97 .doc: ask the user to save as .docx (or convert with LibreOffice)"

READERS = {".docx": read_docx, ".pptx": read_pptx, ".xlsx": read_xlsx, ".xlsm": read_xlsx, ".csv": read_csv,
           ".pdf": read_pdf, ".md": read_plain, ".txt": read_plain, ".markdown": read_plain,
           ".doc": read_legacy_doc, ".mht": read_mhtml, ".mhtml": read_mhtml, ".eml": read_mhtml}
OUT_DIR = "."


# --------------------------------------------------------------------------- #

def collect(paths):
    out = []
    for raw in paths:
        p = Path(raw)
        if p.is_dir():
            out += [f for f in sorted(p.rglob("*"))
                    if f.is_file() and not f.name.startswith((".", "~$"))]
        elif p.is_file():
            out.append(p)
        else:
            print(f"[warn] no such path: {p}", file=sys.stderr)
    return out


def main():
    ap = argparse.ArgumentParser(description="Inventory source material for a storyboard.")
    ap.add_argument("paths", nargs="+", help="files and/or directories")
    ap.add_argument("-o", "--out", default="sources.json")
    args = ap.parse_args()

    global OUT_DIR
    OUT_DIR = str(Path(args.out).resolve().parent)
    files, records = collect(args.paths), []
    for path in files:
        rec = {"path": str(path), "name": path.name, "type": path.suffix.lower().lstrip("."),
               "bytes": path.stat().st_size, "status": "parsed", "note": "",
               "headings": [], "figures": [], "dates": []}
        reader = READERS.get(path.suffix.lower())
        if reader is None:
            rec["status"] = "unsupported"
            rec["note"] = ("no reader for this extension — if it matters, read it yourself "
                           "or ask the user to export it as docx/xlsx/csv/pdf/md/txt")
        else:
            try:
                reader(path, rec)
            except Exception as exc:  # noqa: BLE001
                rec["status"] = "error"
                rec["note"] = f"{type(exc).__name__}: {exc}"
        records.append(rec)

    doc = {"generated": dt.datetime.now().isoformat(timespec="seconds"),
           "file_count": len(records), "files": records}
    save_json(doc, args.out)

    # human summary — the agent reads this, not the JSON
    print(f"\nparsed {len(records)} file(s) -> {args.out}\n")
    for r in records:
        bits = []
        if r.get("structure"):
            bits.append(", ".join(f"{k}: {v}" for k, v in r["structure"].items())[:70])
        if r.get("labelled_figures"):
            bits.append(f"{len(r['labelled_figures'])} labelled values")
        if r.get("figures"):
            bits.append(f"{len(r['figures'])} figures")
        if r.get("headings"):
            bits.append(f"{len(r['headings'])} headings")
        if r.get("images"):
            usable = sum(1 for im in r["images"] if im.get("usable"))
            bits.append(f"{len(r['images'])} images ({usable} usable on a slide, {len(r['images']) - usable} thumbnails)")
        flag = "" if r["status"] == "parsed" and not r.get("note") else f"  [{r['status'].upper() if r['status'] != 'parsed' else 'NOTE'}] {r['note']}"
        print(f"  {r['name']:<34} {'; '.join(bits)}{flag}")
    bad = [r for r in records if r["status"] != "parsed"]
    if bad:
        print(f"\n{len(bad)} file(s) not parsed — say so to the user rather than ignoring them.")
    print("\nNext: grade every finding against the anchor and write ledger.json; then python3 scripts/build_ledger.py ledger.json --sources sources.json")
    print("Cite using the anchors in sources.json. Summarize; do not copy source text through.\n")


if __name__ == "__main__":
    main()
