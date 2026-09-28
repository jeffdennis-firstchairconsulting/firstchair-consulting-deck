#!/usr/bin/env python3
"""
audit_facts.py — the independent pass. Reads the FINISHED DECK, not the brief.

    python3 scripts/audit_facts.py Deck.pptx ledger.json [--brief brief.json] [--report audit.md]

The build runs from ledger to slides; this runs from slides to ledger, so a
figure that crept in during writing has no trace and is caught.

Facts extracted from every slide (text boxes, tables, chart series, notes):
money, percentages, counts of 2+ digits, dates and fiscal periods. Each is
traced to the ledger and reported with its provenance:

  stated    the figure appears in a ledger entry with a citation anchor
  derived   the entry carries arithmetic that recomputes to the figure
  external  the entry carries publisher, title, date and url
  assumed   the slide or its notes labels it as an assumption / illustrative
  UNTRACED  none of the above                                  -> FAIL

Also: a figure formatted two ways across slides (WARN), mixed currency
symbols (FAIL), every data slide has a source line (FAIL), draft/final marking
present (FAIL), headlines that read as labels (WARN), a slide marked
illustrative only in its notes (FAIL). Then the rubric. Exit 1 on any FAIL.
"""
import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    from pptx import Presentation
except ImportError:
    sys.exit("python-pptx is required: pip install python-pptx")

EMU_IN = 914400
DATA_PATTERNS = {"chart", "waterfall", "scorecard", "heatmap", "matrix", "roadmap", "gantt", "maturity", "table", "curve", "kpi_strip", "stage_tracker", "one_number", "one_status"}
NO_HEADLINE = {"title", "section", "backup", "agenda", "sources"}

MONEY = r"[$£€]\s?\d[\d,]*(?:\.\d+)?\s?(?:k|m|bn|b|million|billion)?\b"
PCT = r"\d[\d,]*(?:\.\d+)?\s?%"
PERIOD = r"\b(?:Q[1-4]\s?(?:FY)?\s?\d{2,4}|FY\s?\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4}-\d{2}-\d{2}|\b(?:19|20)\d{2}\b)"
COUNT = r"(?<![\w.$£€%-])\d[\d,]*(?:\.\d+)?(?![\w%])"
FACT_RE = re.compile(f"({MONEY})|({PCT})|({PERIOD})|({COUNT})", re.I)
MULT = {"k": 1e3, "m": 1e6, "million": 1e6, "bn": 1e9, "b": 1e9, "billion": 1e9}


def norm(tok):
    """A token -> (kind, float value, currency) so 4.1 and $4.1M and 4.1M compare equal on value."""
    t = tok.strip().lower().replace(",", "").replace(" ", "")
    cur = t[0] if t and t[0] in "$£€" else ""
    t = t.lstrip("$£€")
    if t.endswith("%"):
        return ("pct", float(t[:-1]), "")
    m = re.match(r"^(\d+(?:\.\d+)?)(k|m|million|bn|b|billion)?$", t)
    if m:
        v = float(m.group(1))
        # money magnitude suffixes are kept separate from the bare value so 4.1 matches $4.1M
        return ("num", v, cur)
    return ("period", tok.strip().lower(), "")


def facts_in(text):
    out = []
    for m in FACT_RE.finditer(text or ""):
        tok = m.group(0).strip()
        if re.fullmatch(r"\d{1,2}", tok.replace(",", "")) and not m.group(1) and not m.group(2):
            continue  # single digits and small counts are words, not facts
        out.append(tok)
    return out


def slide_texts(prs):
    """Yield (index, kind, text) for every text-bearing thing on each slide."""
    for i, slide in enumerate(prs.slides, start=1):
        for sh in slide.shapes:
            top = (sh.top or 0) / EMU_IN
            if sh.has_text_frame and sh.text_frame.text.strip():
                if top > 6.9:
                    yield i, "footer", sh.text_frame.text
                elif sh.text_frame.text.strip().startswith("Source:"):
                    yield i, "source", sh.text_frame.text
                else:
                    first = sh.text_frame.paragraphs[0].runs
                    is_head = bool(first) and first[0].font.size and first[0].font.size.pt >= 24 and top < 1.2
                    yield i, ("headline" if is_head else "body"), sh.text_frame.text
            if getattr(sh, "has_table", False) and sh.has_table:
                for row in sh.table.rows:
                    yield i, "table", " | ".join(c.text for c in row.cells)
            if getattr(sh, "has_chart", False) and sh.has_chart:
                try:
                    for plot in sh.chart.plots:
                        for ser in plot.series:
                            if ser.name and ser.name.strip().lower() == "base":
                                continue
                            vals = [v for v in ser.values if v is not None and v != 0]
                            yield i, "chart", " ".join(f"{v:g}" for v in vals)
                except Exception:  # noqa: BLE001
                    pass
        if slide.has_notes_slide:
            yield i, "notes", slide.notes_slide.notes_text_frame.text


def ledger_index(ledger):
    """All numeric values the ledger vouches for, with the entries that hold them."""
    idx = defaultdict(list)
    periods = set()
    for e in ledger.get("entries", []):
        blob = " ".join(str(e.get(k, "")) for k in ("finding", "value", "arithmetic"))
        for tok in facts_in(blob):
            kind, v, cur = norm(tok)
            if kind == "period":
                periods.add(v)
            else:
                idx[(kind, round(v, 6))].append(e)
        # derived: recompute
        if e.get("origin") == "derived":
            for expr in str(e.get("arithmetic", "")).split(";"):
                if "=" not in expr:
                    continue
                lhs, rhs = expr.split("=", 1)
                clean = re.sub(r"[^\d.+\-*/() ]", "", lhs)
                if not re.search(r"\d", clean) or not re.search(r"[+\-*/]", clean):
                    continue  # prose, not arithmetic
                try:
                    val = eval(clean, {"__builtins__": {}})  # noqa: S307 arithmetic only
                except Exception:  # noqa: BLE001
                    continue
                for tok in facts_in(rhs)[:1]:
                    k2, v2, _ = norm(tok)
                    if k2 == "num" and abs(val - v2) > max(0.05 * abs(v2), 0.05):
                        e["_recompute_fail"] = f"{lhs.strip()} = {val:g}, ledger says {v2:g}"
    return idx, periods


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("deck")
    ap.add_argument("ledger")
    ap.add_argument("--brief")
    ap.add_argument("--report", default="audit.md")
    a = ap.parse_args()
    prs = Presentation(a.deck)
    ledger = json.load(open(a.ledger))
    fails, warns, rows = [], [], []
    # Provenance: the deck must carry the renderer's stamp, and the ledger
    # handed to this audit must be the ledger the deck was rendered with.
    import hashlib
    subject = (prs.core_properties.subject or "")
    m = re.search(r"ledger=([0-9a-f]{16}|none)", subject)
    if "firstchair-consulting-deck render" not in subject:
        fails.append("deck carries no render stamp: it was not produced by scripts/render_deck.js and cannot be audited as a skill deliverable")
    elif m and m.group(1) == "none":
        fails.append("deck was rendered without a ledger (no meta.ledger in the brief, no --ledger on render_deck.js); re-render with the ledger named")
    elif m:
        h = hashlib.sha256(open(a.ledger, "rb").read()).hexdigest()[:16]
        if h != m.group(1):
            fails.append(f"ledger hash mismatch: deck was rendered against ledger {m.group(1)}, this file is {h}. Audit the ledger the deck was built from, or re-render.")
    ledger_blob = json.dumps(ledger).lower()
    brief = json.load(open(a.brief)) if a.brief else None
    patterns = [s.get("pattern") for s in (brief or {}).get("slides", [])] if brief else []
    idx, periods = ledger_index(ledger)

    per_slide = defaultdict(lambda: {"texts": [], "notes": "", "source": "", "headline": "", "footer": ""})
    for i, kind, text in slide_texts(prs):
        d = per_slide[i]
        if kind == "notes":
            d["notes"] += text + "\n"
        elif kind == "source":
            d["source"] = text
        elif kind == "footer":
            d["footer"] += text + " "
        else:
            if kind == "headline":
                d["headline"] = text
            d["texts"].append((kind, text))

    forms = defaultdict(set)   # value -> string forms seen
    currencies = set()
    for i in sorted(per_slide):
        d = per_slide[i]
        pat = patterns[i - 1] if i - 1 < len(patterns) else None
        labelled = bool(re.search(r"assum|illustrative|indicative|estimate", " ".join(t for _, t in d["texts"]), re.I))
        labelled_notes_only = (not labelled) and bool(re.search(r"assum|illustrative", d["notes"], re.I))
        for kind, text in d["texts"]:
            for tok in facts_in(text):
                k, v, cur = norm(tok)
                if cur:
                    currencies.add(cur)
                if k == "period":
                    prov = "stated" if v in periods else ("assumed" if labelled else ("UNTRACED" if kind == "headline" else "period-label"))
                    ids = ""
                    if prov == "period-label":
                        warns.append(f"slide {i}: period label {tok!r} not itself in the ledger (fine for an axis or column header if the range is)")
                else:
                    hits = idx.get((k, round(v, 6)), [])
                    if hits:
                        e = hits[0]
                        prov = e.get("origin", "stated")
                        ids = ", ".join(dict.fromkeys(h.get("id", "?") for h in hits[:6]))
                        if any(h.get("_recompute_fail") for h in hits):
                            prov = "DERIVED-MISMATCH"
                        if prov == "external" and not all(e.get(f) for f in ("publisher", "title", "date", "url")):
                            prov = "EXTERNAL-UNCITED"
                    else:
                        prov = "assumed" if labelled else "UNTRACED"
                        ids = ""
                    if kind != "chart":
                        forms[(k, round(v, 6))].add(tok.replace(" ", ""))
                rows.append((i, tok, prov, ids, kind))
                if prov in ("UNTRACED", "DERIVED-MISMATCH", "EXTERNAL-UNCITED"):
                    fails.append(f"slide {i}: {prov}  {tok!r} in {kind}" + (f" ({ids})" if ids else ""))
        if labelled_notes_only:
            fails.append(f"slide {i}: marked illustrative/assumed only in the notes; the slide itself must say so")
        if labelled:
            # An illustrative slide may invent values; it may not invent names.
            # Every proper noun on it (platform, product, site, team) must exist
            # somewhere in the ledger, or the slide has invented an entity.
            STOP = {"illustrative", "representative", "only", "data", "the", "and", "for", "not", "draft", "final", "confidential"}
            pieces = [t.replace("Illustrative \u2014 representative values, not measured data.", " ") for k, t in d["texts"] if k != "headline"]
            for sent in (x.strip() for piece in pieces for x in re.split(r"(?<=[.!?;:])\s+|\n", piece)):
                sent = sent.strip()
                for m in re.finditer(r"\b([A-Z][a-z]{2,}(?:[ -][A-Z][a-z]{2,})*)\b", sent):
                    name = m.group(1)
                    if m.start() == 0 and " " not in name and "-" not in name:
                        continue  # sentence-initial single word: capitalised because it starts the sentence
                    if name.lower() in STOP or name.lower() in ledger_blob:
                        continue
                    fails.append(f"slide {i}: illustrative slide names {name!r}, which is nowhere in the ledger; invented entity")
        is_data = (pat in DATA_PATTERNS) if pat else any(k in ("chart", "table") for k, _ in d["texts"])
        if is_data and not d["source"]:
            fails.append(f"slide {i}: data slide with no source line")
        if d["headline"] and pat not in NO_HEADLINE and not re.search(r"[.?!]$", d["headline"].strip()):
            warns.append(f"slide {i}: headline reads as a label: {d['headline'][:60]!r}")
    # Contradiction heuristic: two slides that speak of the same thing in
    # different tenses ("planned" on one, "immediately" on another). Cheap,
    # keyed on shared content-word stems, and it caught a real one.
    FUTURE = re.compile(r"\b(planned|coming soon|in the near future|roadmap|not yet|future|later)\b", re.I)
    PRESENT = re.compile(r"\b(immediately|today|in production|already|automatically|right after)\b", re.I)
    STOPW = {"the", "and", "that", "this", "with", "from", "into", "after", "before", "which", "every", "their", "there", "these", "those", "about", "where", "while", "would", "could", "should"}
    def stems(sent):
        return {w[:6] for w in re.findall(r"[a-z]{5,}", sent.lower()) if w not in STOPW}
    fut, pres = [], []
    for i, d in per_slide.items():
        for _, t in d["texts"]:
            for sent in re.split(r"(?<=[.;])\s+", t):
                if FUTURE.search(sent):
                    fut.append((i, sent.strip(), stems(sent)))
                if PRESENT.search(sent):
                    pres.append((i, sent.strip(), stems(sent)))
    seen_pairs = set()
    for fi, fs, fst in fut:
        for pi, ps, pst in pres:
            if fi != pi and len(fst & pst) >= 2 and (fi, pi) not in seen_pairs:
                seen_pairs.add((fi, pi))
                warns.append(f"possible contradiction between slide {fi} ({fs[:70]!r}) and slide {pi} ({ps[:70]!r}): one says future, the other present; make them agree")
    if len(currencies) > 1:
        fails.append(f"mixed currency symbols in the deck: {sorted(currencies)} — never convert currency, and never mix it")
    for key, fs in forms.items():
        cleaned = {re.sub(r"[$£€]", "", f).lower() for f in fs}
        if len(cleaned) > 1 and key[0] == "num":
            warns.append(f"figure {key[1]:g} appears in different forms: {sorted(fs)}")
    footer_all = " ".join(d["footer"] for d in per_slide.values())
    if not re.search(r"draft|final", footer_all, re.I):
        fails.append("no Draft/Final marking anywhere in the footer")
    for e in ledger.get("entries", []):
        if e.get("_recompute_fail"):
            warns.append(f"ledger {e.get('id')}: arithmetic does not recompute: {e['_recompute_fail']}")

    traced = sum(1 for r in rows if r[2] not in ("UNTRACED", "DERIVED-MISMATCH", "EXTERNAL-UNCITED"))
    rubric = [
        ("Render stamp present and ledger matches", not any("stamp" in f or "hash" in f or "without a ledger" in f for f in fails)),
        ("No invented entities on illustrative slides", not any("invented entity" in f for f in fails)),
        ("Every fact traced", not any(f for f in fails if "UNTRACED" in f or "MISMATCH" in f or "UNCITED" in f)),
        ("Source line on every data slide", not any("no source line" in f for f in fails)),
        ("No label headlines", not warns or not any("label" in w for w in warns)),
        ("Draft/Final marking present", not any("Draft/Final" in f for f in fails)),
        ("Illustrative stated on the slide, not only in notes", not any("only in the notes" in f for f in fails)),
        ("One currency, no conversion", not any("currency" in f for f in fails)),
        ("Figures formatted consistently", not any("different forms" in w for w in warns)),
        ("Titles read as one argument (agent judgment)", None),
        ("Four beats at the right grain (agent judgment)", None),
        ("Visual balance passed on every slide (eye pass)", None),
    ]
    L = [f"# Fact audit: {Path(a.deck).name}", "", f"{len(rows)} facts on {len(per_slide)} slides; {traced} traced, {len(rows) - traced} not.", "",
         "| slide | fact | provenance | ledger | where |", "|---|---|---|---|---|"]
    L += [f"| {i} | {tok} | {prov} | {ids} | {kind} |" for i, tok, prov, ids, kind in rows]
    L += ["", "## Failures", ""] + ([f"- {f}" for f in fails] or ["- none"])
    L += ["", "## Warnings", ""] + ([f"- {w}" for w in warns] or ["- none"])
    L += ["", "## Rubric", "", "| item | result |", "|---|---|"]
    L += [f"| {name} | {'pass' if ok else 'FAIL' if ok is False else 'judged by the agent on a fresh read'} |" for name, ok in rubric]
    Path(a.report).write_text("\n".join(L) + "\n", encoding="utf-8")

    print(f"{a.deck}: {len(rows)} facts, {traced} traced, {len(rows) - traced} untraced")
    for w in warns:
        print("  WARN", w)
    for f in fails:
        print("  FAIL", f)
    print(f"\nwrote {a.report}")
    if fails:
        print("AUDIT FAILED — fix the brief (cite it, label it, or remove it) and rebuild. Never hand over an unaudited deck.")
        return 1
    print("AUDIT PASS (mechanical). Now the judgment half: fresh read, headline vs evidence, titles in order.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
