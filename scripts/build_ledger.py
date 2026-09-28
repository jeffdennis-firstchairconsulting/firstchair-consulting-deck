#!/usr/bin/env python3
"""
build_ledger.py — validate the evidence ledger and render it for humans.

    python3 scripts/build_ledger.py ledger.json --sources sources.json [--md ledger.md]

The agent writes ledger.json during the parse (the judgment half); this script
is the mechanical half. It checks every entry and refuses a ledger that would
let an unsourced fact reach a slide:

  · grade    is core | supporting | context | unrelated
  · origin   is stated | derived | external | assumed
  · stated   entries cite an anchor that exists in sources.json (file and locator)
  · derived  entries cite two or more anchors (or one plus arithmetic) and carry `arithmetic`
  · external entries carry publisher, title, date, url — all four
  · assumed  entries carry `assumption` text saying what would change if wrong
  · core and supporting entries name at least one thing they serve (a frame
    question, a key line id, "decision", "risk", or a must_include item)

Then it writes ledger.md organised by what each entry serves, the way minutes
are organised by agenda item rather than by speaker. Exit 1 on any failure.

Ledger entry shape:
  { "id": "E12", "finding": "…", "value": "…", "grade": "core", "origin": "stated",
    "sources": ["report.docx ¶14"], "serves": ["KL2"], "arithmetic": "", "assumption": "",
    "publisher": "", "title": "", "date": "", "url": "", "notes": "" }
"""
import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from _common import load_json, blank, Report  # noqa: E402

GRADES = {"core", "supporting", "context", "unrelated"}
ORIGINS = {"stated", "derived", "external", "assumed"}
LOCATOR = re.compile(r"^(?P<file>[^\s!¶]+\.\w{2,5})(?:\s*(?:¶\d+|p\.\d+|s\d+|!.+|row\s?\d+.*|line\s?\d+|slide\s?\d+|\S+))?$", re.I)


def anchors_in(sources):
    files = {f["name"] for f in sources.get("files", [])}
    return files


def check(ledger, sources):
    rep = Report("ledger check")
    files = anchors_in(sources) if sources else set()
    ids = set()
    for e in ledger.get("entries", []):
        eid = e.get("id", "?")
        if eid in ids:
            rep.block(f"{eid}: duplicate id")
        ids.add(eid)
        if blank(e.get("finding")):
            rep.block(f"{eid}: no finding text")
        g, o = e.get("grade"), e.get("origin")
        if g not in GRADES:
            rep.block(f"{eid}: grade {g!r} not in {sorted(GRADES)}")
        if o not in ORIGINS:
            rep.block(f"{eid}: origin {o!r} not in {sorted(ORIGINS)}")
        srcs = e.get("sources") or []
        if o == "stated":
            if not srcs:
                rep.block(f"{eid}: stated entry with no source anchor")
            for s in srcs:
                m = LOCATOR.match(s.strip())
                if not m:
                    rep.block(f"{eid}: anchor {s!r} is not file + locator (report.docx ¶14, model.xlsx!Summary!B7, findings.pdf p.3)")
                elif files and m.group("file") not in files:
                    rep.block(f"{eid}: anchor cites {m.group('file')!r}, which is not in sources.json")
        if o == "derived":
            if len(srcs) < 1:
                rep.block(f"{eid}: derived entry with no source anchors")
            if blank(e.get("arithmetic")):
                rep.block(f"{eid}: derived entry must show its arithmetic")
        if o == "external":
            for k in ("publisher", "title", "date", "url"):
                if blank(e.get(k)):
                    rep.block(f"{eid}: external entry missing {k}")
        if o == "assumed" and blank(e.get("assumption")):
            rep.block(f"{eid}: assumed entry must say what would change if the assumption is wrong")
        if g in {"core", "supporting"} and not e.get("serves"):
            rep.block(f"{eid}: {g} entry serves nothing; name the key line, frame question, decision, risk or must_include")
        if g == "unrelated" and e.get("serves"):
            rep.warn(f"{eid}: graded unrelated but serves {e['serves']}")
    if not ledger.get("entries"):
        rep.warn("ledger has no entries")
    return rep


def render_md(ledger):
    by = {}
    for e in ledger.get("entries", []):
        for s in (e.get("serves") or ["(unassigned)"]):
            by.setdefault(s, []).append(e)
    out = [f"# Evidence ledger", ""]
    a = ledger.get("anchor") or {}
    if a:
        out += [f"**Anchor:** {a.get('outcome','')} · {a.get('audience','')} · {a.get('kind_and_size','')}", ""]
    order = sorted(by, key=lambda k: (k.startswith("("), k))
    for topic in order:
        out.append(f"## {topic}")
        out.append("")
        out.append("| id | grade | origin | finding | value | source |")
        out.append("|---|---|---|---|---|---|")
        for e in by[topic]:
            src = "; ".join(e.get("sources") or []) if e.get("origin") != "external" else f"{e.get('publisher')} · {e.get('title')} · {e.get('date')}"
            extra = f" *(derived: {e['arithmetic']})*" if e.get("origin") == "derived" and e.get("arithmetic") else ""
            extra += f" *(assumes: {e['assumption']})*" if e.get("origin") == "assumed" and e.get("assumption") else ""
            out.append(f"| {e.get('id')} | {e.get('grade')} | {e.get('origin')} | {e.get('finding','')}{extra} | {e.get('value','')} | {src} |")
        out.append("")
    unrelated = [e for e in ledger.get("entries", []) if e.get("grade") == "unrelated"]
    if unrelated:
        out.append("## Set aside as unrelated (pull back anything that belongs)")
        out.append("")
        for e in unrelated:
            out.append(f"- {e.get('id')}: {e.get('finding','')} — {'; '.join(e.get('sources') or [])}")
        out.append("")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ledger")
    ap.add_argument("--sources")
    ap.add_argument("--md", default="ledger.md")
    args = ap.parse_args()
    ledger = load_json(args.ledger)
    sources = load_json(args.sources) if args.sources else None
    rep = check(ledger, sources)
    n = len(ledger.get("entries", []))
    grades = {}
    for e in ledger.get("entries", []):
        grades[e.get("grade")] = grades.get(e.get("grade"), 0) + 1
    print(f"{args.ledger}: {n} entries " + ", ".join(f"{k} {v}" for k, v in sorted(grades.items(), key=lambda kv: str(kv[0]))))
    rep.emit("Ledger holds — every core fact has a grade, an origin and a citation.")
    rc = 1 if rep.blockers else 0
    if rc == 0:
        Path(args.md).write_text(render_md(ledger), encoding="utf-8")
        print(f"wrote {args.md}")
    return rc


if __name__ == "__main__":
    sys.exit(main())
