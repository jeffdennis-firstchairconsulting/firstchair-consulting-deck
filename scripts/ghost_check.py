#!/usr/bin/env python3
"""
ghost_check.py — CHECKPOINT 2. The ghost deck: titles in order, one exhibit each.

    python3 scripts/ghost_check.py storyboard.json

Mechanical tests:
  · every slide has a claim_kind and a pattern allowed for it (the selection rule)
  · headlines are claims: a full sentence with a period, not a label
  · repetition: no pattern over 40% of content slides, no three in a row
  · tier-mandatory slides: exec summary for long decks and any deck with
    sections; agenda when there are sections; a decision slide when a decision
    is named; a risks slide when risks are listed (full and long tiers)
  · data patterns carry a source line
Backup slides are exempt from repetition and the read-through, not from the rest.

Then it prints the ghost deck. Read the titles aloud in order: they must tell
the whole story without the bodies. That judgment is yours; the script only
puts the list in front of you. Put that list to the user before building.
Exit 1 on any blocker.
"""
import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from _common import load_json, blank, Report  # noqa: E402

RULE = {
    "decomposition": ["logic_tree", "driver_tree", "hypothesis_tree"],
    "comparison": ["scorecard", "heatmap", "map", "table", "contrast"],
    "bridge": ["waterfall", "chart"],
    "trend": ["chart", "curve", "heatmap", "kpi_strip"],
    "composition": ["chart"],
    "sequence": ["chevrons", "phases", "steps", "phases_threads"],
    "convergence": ["leading_to", "funnel"],
    "position": ["matrix"],
    "plan": ["gantt", "roadmap", "phases_threads", "stage_tracker"],
    "status": ["status", "scorecard", "kpi_strip", "stage_tracker"],
    "trade_off": ["balance", "map", "contrast"],
    "maturity": ["maturity", "curve", "stage_tracker"],
    "governance": ["decision_rights", "table"],
    # how things connect: a hub and what surrounds it
    "relationship": ["ecosystem", "panels", "map"],
    # one-slide family: the whole argument on one slide. Allowed once per
    # section inside a longer deck, as an impact slide (counted below).
    "impact": ["one_decision", "one_number", "one_status", "one_shift", "one_story", "statement"],
    "parallel": ["cards", "quote", "panels", "tiers", "table"],
    "reframe": ["statement"],
    "illustration": ["image", "panels", "cards"],
    "structural": ["title", "section", "agenda", "exec_summary", "ask", "risks", "backup", "sources"],
}
DATA = {"chart", "waterfall", "scorecard", "heatmap", "matrix", "roadmap", "gantt", "maturity", "table", "curve", "kpi_strip", "stage_tracker", "one_number", "one_status"}
STRUCTURAL = set(RULE["structural"])
ALL = {p for ps in RULE.values() for p in ps}
# Words that claim more than a runbook, a model, or an interview usually
# supports. Not blockers: the agent lists them under the ghost deck as
# "claims stronger than the evidence" so the user approves them knowingly.
STRONG = re.compile(r"\b(enforc\w*|eliminat\w*|every|all|always|never|no risk|zero|guarantee\w*|100%|fully|complete\w*|"
                    r"immediately|in production|proven|ensures?|prevents?|cannot|impossible|any)\b", re.I)
PLACEHOLDER = re.compile(r"\b(TBD|TODO|XXX+|FIXME|lorem ipsum|placeholder|\?\?\?)\b", re.I)


def is_claim(h):
    h = (h or "").strip()
    return bool(h) and h[-1] in ".?!" and len(h.split()) >= 4 and not h.istitle()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    args = ap.parse_args()
    sb = load_json(args.storyboard)
    rep = Report("ghost deck check")
    meta = sb.get("meta", {}) or {}
    tier = meta.get("tier") or "full"
    sections = sb.get("sections") or []

    content = []  # (label, slide) in deck order, excluding backup
    for kl in sb.get("key_lines", []):
        for j, sl in enumerate(kl.get("slides", []), 1):
            content.append((f"{kl.get('id','KL?')}.{j}", sl))
        if not kl.get("slides"):
            rep.block(f"{kl.get('id','KL?')}: key line has no slides")
    backup = [(f"B{i}", s) for i, s in enumerate(sb.get("backup", []), 1)]

    strong = []
    for label, sl in content + backup:
        ck, pat, h = sl.get("claim_kind"), sl.get("pattern"), sl.get("headline")
        for m in STRONG.finditer(h or ""):
            strong.append((label, m.group(0), h))
        if pat == "image":
            f = (sl.get("fields") or {}).get("image") or sl.get("image")
            if blank(f):
                rep.block(f"{label}: image slide with no image file; if the only capture is a thumbnail, ask the user for a full-size one — never plan a mock-up")
            elif not Path(f).exists():
                rep.block(f"{label}: image file not found: {f}")
            else:
                try:
                    from PIL import Image
                    w = Image.open(f).size[0]
                    if w < 800:
                        rep.block(f"{label}: {f} is {w} px wide, a thumbnail. Ask the user for a full-size screenshot before the ghost deck is approved.")
                except ImportError:
                    rep.warn(f"{label}: Pillow not installed; image width not checked")
        if ck not in RULE:
            rep.block(f"{label}: claim_kind {ck!r} is not one of {sorted(RULE)}; classify the headline first (references/selection_rule.md)")
        elif pat not in RULE[ck]:
            if pat in ALL:
                rep.block(f"{label}: pattern {pat!r} is not an exhibit for a {ck} claim; allowed: {RULE[ck]}")
            else:
                rep.block(f"{label}: unknown pattern {pat!r}")
        if pat not in STRUCTURAL and not is_claim(h):
            rep.block(f"{label}: headline is a label, not a claim: {h!r}")
        if pat in DATA and blank(sl.get("source")):
            rep.block(f"{label}: {pat} needs a source line")
        if PLACEHOLDER.search(str(sl)):
            rep.warn(f"{label}: placeholder text left in the slide")

    pats = [sl.get("pattern") for _, sl in content if sl.get("pattern") not in STRUCTURAL]
    n = len(pats)
    if n >= 5:
        for p in set(pats):
            c = pats.count(p)
            if c / n > 0.4:
                rep.block(f"repetition: {p!r} carries {c} of {n} content slides (over 40%); reconsider the exhibits")
    ONE = set(RULE["impact"]) - {"statement"}
    ones = [p for p in pats if p in ONE]
    if tier != "single" and len(ones) > max(1, len(sections)):
        rep.block(f"{len(ones)} one-slide patterns in a {tier} deck; they are impact slides, one per section at most "
                  f"(or build a single-slide deck with tier 'single')")
    for i in range(2, n):
        if pats[i] == pats[i - 1] == pats[i - 2]:
            rep.block(f"repetition: three consecutive {pats[i]!r} slides; vary the exhibit or merge")
            break

    # tier-mandatory
    long_like = tier == "long" or bool(sections)
    if long_like and not sb.get("exec_summary", True):
        rep.block("long tier: exec summary is mandatory")
    if tier in {"full", "long"} and sb.get("decision") and not (sb["decision"].get("items")):
        rep.block("a decision is named but has no items to say yes to")
    if tier in {"full", "long"} and not sb.get("risks"):
        rep.warn(f"{tier} tier with no risks listed; the fourth beat is missing unless the genre is purely informational")
    if tier != "single" and blank(sb.get("governing_thought")):
        rep.block("no governing thought")
    if meta.get("section_break") and not sections:
        rep.block("the frame asks for a clear section break but the storyboard has no sections; a divider slide per section is mandatory")
    if meta.get("genre") == "capability_overview" and not sb.get("risks"):
        rep.block("capability_overview genre: a limits-and-what's-next slide is mandatory. Grade the beta tags, environment caveats "
                  "and 'another system owns this' findings as core, and list them under risks (owner = who is closing the gap).")
    for s in sections:
        if blank(s.get("key_line")):
            rep.block(f"section {s.get('id')}: no key line (the section's own answer)")

    rep.emit("Ghost deck holds mechanically.")

    # the read-through
    print("GHOST DECK — read the titles in order; they must tell the story on their own:\n")
    print(f"  0.  [title]        {meta.get('title') or sb.get('governing_thought','')}")
    k = 1
    if tier in {"full", "long"} or sections:
        print(f"  {k}.  [exec_summary] {sb.get('governing_thought','')}")
        k += 1
    by_section = {}
    for s in sections:
        for kid in s.get("key_lines", []):
            by_section[kid] = s
    last_section = None
    for kl in sb.get("key_lines", []):
        sec = by_section.get(kl.get("id"))
        if sec and sec is not last_section:
            print(f"  {k}.  [section]      {sec.get('key_line','')}")
            k += 1
            last_section = sec
        for sl in kl.get("slides", []):
            print(f"  {k}.  [{sl.get('pattern','?'):<12}] {sl.get('headline','')}   ({sl.get('claim_kind','?')})")
            k += 1
    if sb.get("risks") and tier in {"full", "long"}:
        print(f"  {k}.  [risks]        {len(sb['risks'])} risks with owners")
        k += 1
    if sb.get("decision"):
        print(f"  {k}.  [ask]          {sb['decision'].get('assertion','')}")
        k += 1
    if backup:
        print(f"  --  [backup]       {len(backup)} slides, excluded from the read-through")
    print("\nIf a title read on its own does not advance the argument, the slide is either backup or unnecessary.\n")
    if strong:
        print("CLAIMS STRONGER THAN A SOURCE USUALLY SUPPORTS — put this list under the ghost deck so the user approves each one knowingly,")
        print("or soften the headline to what the ledger says:\n")
        seen = set()
        for label, word, h in strong:
            if (label, word.lower()) in seen:
                continue
            seen.add((label, word.lower()))
            print(f"  {label}: \"{word}\" in: {h}")
        print()
    return 1 if rep.blockers else 0


if __name__ == "__main__":
    sys.exit(main())
