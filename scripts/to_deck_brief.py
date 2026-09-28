#!/usr/bin/env python3
"""
to_deck_brief.py — storyboard.json -> brief.json for the renderer.

    python3 scripts/to_deck_brief.py storyboard.json -o brief.json [--frame frame.json]

What it builds, in order:
  title · exec_summary (full/long) · agenda (when sections exist) · per section
  a divider carrying the section key line · each key line's slides in order
  (the key line's assertion becomes the thesis band on its first slide when
  the slide has none) · risks (full/long, when listed) · ask · backup divider
  and backup slides · sources (when any external fact is cited)

What it refuses:
  · a slide with no claim_kind or no pattern (the selection rule cannot be
    skipped by omission)
  · a data pattern with no source

What it never does: seed content. A slide's fields come from the storyboard's
`fields`; if they are missing, check_brief.js will list exactly what to ask.
Assumed support points go into the slide's speaker notes so the presenter
sees them.
"""
import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from _common import load_json, save_json, blank  # noqa: E402

META_KEYS = ("customer", "program", "docType", "audience", "objective", "provenance", "title", "author",
             "locale", "status", "version", "classification", "logo", "credit", "tier")
DATA = {"chart", "waterfall", "scorecard", "heatmap", "matrix", "roadmap", "gantt", "maturity", "table", "curve", "kpi_strip", "stage_tracker", "one_number", "one_status"}


def slide_from(sl, label, band_default=None, notes_extra=""):
    if blank(sl.get("claim_kind")) or blank(sl.get("pattern")):
        sys.exit(f"{label}: slide has no claim_kind/pattern. Classify the claim and pick the exhibit "
                 f"(references/selection_rule.md) before converting.")
    out = {"pattern": sl["pattern"], "approved_pattern": sl["pattern"]}
    for k in ("eyebrow", "headline", "subtitle", "band", "source", "notes", "tune", "audience", "illustrative", "image", "caption", "callouts"):
        if not blank(sl.get(k)):
            out[k] = sl[k]
    if band_default and blank(out.get("band")):
        out["band"] = band_default
    out.update(sl.get("fields") or {})
    if sl["pattern"] in DATA and blank(out.get("source")):
        sys.exit(f"{label}: {sl['pattern']} slide has no source line.")
    if notes_extra:
        out["notes"] = (out.get("notes", "") + "\n" + notes_extra).strip()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    ap.add_argument("-o", "--out", default="brief.json")
    ap.add_argument("--frame")
    ap.add_argument("--ledger", help="ledger.json the storyboard cites; its hash goes into the render stamp")
    args = ap.parse_args()
    sb = load_json(args.storyboard)
    frame = load_json(args.frame) if args.frame else {}
    meta_in = sb.get("meta", {}) or {}
    pk = (frame.get("packaging") or {}) if frame else {}
    meta = {k: meta_in[k] for k in META_KEYS if not blank(meta_in.get(k)) or meta_in.get(k) is False}
    for k in ("logo", "status", "classification", "locale", "credit"):
        if k in pk and blank(meta.get(k)) and not (k == "credit" and "credit" in meta):
            meta[k] = pk[k]
    tier = meta.get("tier") or (frame.get("tier") if frame else None) or "full"
    meta["tier"] = tier
    # provenance for the render stamp: the storyboard this brief came from, and the ledger it cites
    # stored relative to the brief so the example still renders on another machine
    import os
    brief_dir = Path(args.out).resolve().parent
    meta["storyboard"] = os.path.relpath(Path(args.storyboard).resolve(), brief_dir)
    if args.ledger:
        meta["ledger"] = os.path.relpath(Path(args.ledger).resolve(), brief_dir)
    genre = meta_in.get("genre") or ((frame.get("frame", {}).get("q8_genre", {}) or {}).get("answer") if frame else None)
    if genre:
        meta["genre"] = genre
    if meta_in.get("section_break") or (frame and (frame.get("frame", {}).get("q9_constraints", {}) or {}).get("section_break")):
        meta["sectionBreak"] = True
    if meta_in.get("illustrative_approved") is True:
        meta["illustrativeApproved"] = True
    if blank(meta.get("title")):
        meta["title"] = sb.get("governing_thought", "")
    slides = []
    kls = sb.get("key_lines", [])
    sections = sb.get("sections") or []
    scqa = sb.get("scqa", {}) or {}

    # title
    if tier != "single":
        slides.append({"pattern": "title",
                       "eyebrow": " \u00b7 ".join(x for x in (meta.get("docType", ""), meta.get("customer", "")) if x),
                       "headline": (meta_in.get("title") or sb.get("governing_thought", "")).rstrip(".") + ".",
                       "subtitle": scqa.get("complication", "") if scqa.get("use") else (meta.get("objective") or ""),
                       "meta": meta.get("provenance", ""),
                       "notes": "Open on the answer. The provenance line is what buys the room's attention."})
    # exec summary
    decision = sb.get("decision") or sb.get("ask") or {}
    risks = sb.get("risks") or []
    if tier in {"full", "long"} or sections:
        slides.append({"pattern": "exec_summary", "eyebrow": "Executive summary",
                       "headline": sb.get("governing_thought", ""), "answer": sb.get("governing_thought", ""),
                       "keyLines": [kl.get("assertion", "") for kl in kls],
                       "decision": decision.get("assertion", ""),
                       "risk": (risks[0].get("risk", "") if risks else ""),
                       "notes": "The whole deck on one slide. A reader may stop here; nothing below should surprise them."})
    if sections:
        slides.append({"pattern": "agenda", "headline": "What this deck covers.", "items": [s.get("title", "") for s in sections],
                       "notes": "Re-used as a tracker: set `current` per section when presenting."})
    by_section = {kid: s for s in sections for kid in s.get("key_lines", [])}
    last = None
    for kl in kls:
        sec = by_section.get(kl.get("id"))
        if sec and sec is not last:
            slides.append({"pattern": "section", "label": sec.get("title", ""), "headline": sec.get("key_line", ""),
                           "notes": f"Section {sec.get('id')}: its own small pyramid."})
            last = sec
        assumed = [s for s in kl.get("support", []) if s.get("confidence") == "assumed"]
        extra = ("ASSUMED: " + "; ".join(s.get("claim", "") for s in assumed) + ". Confirm before presenting.") if assumed else ""
        for j, sl in enumerate(kl.get("slides", []), 1):
            band_default = kl.get("assertion") if j == 1 and len(kl.get("slides", [])) > 1 else None
            slides.append(slide_from(sl, f"{kl.get('id','KL?')} slide {j}", band_default, extra if j == 1 else ""))
    if risks and tier in {"full", "long"}:
        if meta.get("genre") == "capability_overview":
            slides.append({"pattern": "risks", "eyebrow": "Limits and what's next",
                           "headline": sb.get("limits_headline") or "What the modules do not do yet, and what is coming.",
                           "rows": risks, "notes": "For a capability overview the fourth beat is limits, not risks: "
                           "beta status, environment caveats, what another system still owns. Say it before the room does."})
        else:
            slides.append({"pattern": "risks", "eyebrow": "What could go wrong",
                           "headline": f"{len(risks)} risk{'s' if len(risks) != 1 else ''}, each with an owner and a mitigation.",
                           "rows": risks, "notes": "The fourth beat. A risk without an owner reads as a problem."})
    if decision and tier != "single":
        slides.append({"pattern": "ask", "eyebrow": "The decision", "headline": decision.get("assertion", ""),
                       "cards": [{"kicker": i.get("kicker", "Decision"), "title": i.get("title", ""), "body": i.get("body", "")}
                                 for i in decision.get("items", [])],
                       "band": decision.get("band", ""), "notes": "Small, concrete, sayable-yes-to in the room."})
    backup = sb.get("backup") or []
    if backup:
        slides.append({"pattern": "backup", "notes": "Backup: how the conclusion was reached, and detail for whoever asks."})
        for i, sl in enumerate(backup, 1):
            slides.append(slide_from(sl, f"backup {i}"))
    externals = []
    for kl in kls:
        for s in kl.get("support", []):
            if s.get("confidence") == "external" and s.get("citation"):
                externals.append(s["citation"])
    if externals:
        slides.append({"pattern": "sources", "items": externals})

    # single-slide tier: the one slide only, its band is the decision
    if tier == "single":
        if len(slides) != 1:
            sys.exit(f"single tier must produce exactly one slide; storyboard has {len(slides)}")
        if decision.get("assertion") and blank(slides[0].get("band")):
            slides[0]["band"] = decision["assertion"]

    brief = {"meta": meta, "slides": slides}
    if sb.get("assumptions"):
        brief["_assumptions"] = sb["assumptions"]
    save_json(brief, args.out)
    print(f"wrote {args.out}: {len(slides)} slides (tier {tier})")
    print(f"Next: node scripts/check_brief.js {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
