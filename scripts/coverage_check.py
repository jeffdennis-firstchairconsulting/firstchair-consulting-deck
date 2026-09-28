#!/usr/bin/env python3
"""
coverage_check.py — what the deck needs that no document supplied.

    python3 scripts/coverage_check.py frame.json ledger.json [storyboard.json]

Compares what the frame demands (the outcome, the governing message, each
must_include item) and what the storyboard claims (each key line, the
decision, each risk) against what the ledger holds as core or supporting
evidence. Two lists come out, and they are put to the user separately:

  CONTENT GAPS   facts about the client's own situation that no source holds.
                 Only the user can supply these, or they become assumptions.
  EXTERNAL GAPS  facts external to the client (a market size, a regulation, a
                 benchmark). Three options each: look it up (if the user
                 approves and a search tool exists), the user supplies it, or
                 the deck states the gap.

A key line with no evidence at all is a blocker: the argument cannot be built
on it. Exit 1 on blockers.
"""
import argparse
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from _common import load_json, blank, Report  # noqa: E402

EXTERNAL_WORDS = ("market", "industry", "benchmark", "regulat", "competitor", "peer", "average", "standard",
                  "typical", "sector", "law", "compliance", "rate of", "index")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frame")
    ap.add_argument("ledger")
    ap.add_argument("storyboard", nargs="?")
    args = ap.parse_args()
    frame, ledger = load_json(args.frame), load_json(args.ledger)
    sb = load_json(args.storyboard) if args.storyboard else None
    rep = Report("coverage check")

    served = {}
    for e in ledger.get("entries", []):
        if e.get("grade") in {"core", "supporting"}:
            for s in e.get("serves") or []:
                served.setdefault(s, []).append(e)
    external_needed = [e for e in ledger.get("entries", []) if e.get("origin") == "external" and blank(e.get("url"))]
    external_gaps, content_gaps = [], []

    # frame demands
    f = frame.get("frame", {}) or {}
    q1 = (f.get("q1_outcome") or {}).get("answer") or (frame.get("anchor", {}).get("outcome", {}) or {}).get("answer", "")
    if q1 and not (served.get("decision") or served.get("q1_outcome")):
        content_gaps.append(f"the decision ({q1!r}) has no evidence entry serving it: what makes it the right call?")
    q9 = f.get("q9_constraints", {}) or {}
    STOP = {"the", "and", "who", "that", "with", "from", "this", "for", "are", "was", "were", "their", "which", "into", "over"}
    def keywords(t):
        return {w.strip(".,;:()").lower() for w in str(t).split() if len(w.strip(".,;:()")) > 3} - STOP
    for item in q9.get("must_include") or []:
        kw = keywords(item)
        hit = any(item in (e.get("serves") or []) or len(kw & keywords(e.get("finding", ""))) >= max(1, min(2, len(kw) // 2))
                  for e in ledger.get("entries", []) if e.get("grade") in {"core", "supporting"})
        if not hit:
            content_gaps.append(f"must_include item {item!r} has nothing in the ledger")
    # storyboard demands
    if sb:
        for kl in sb.get("key_lines", []):
            kid = kl.get("id", "KL?")
            ev = served.get(kid, [])
            cited = [s.get("ledger") for s in kl.get("support", []) if s.get("ledger")]
            if not ev and not cited:
                rep.block(f"{kid}: key line has no evidence in the ledger and cites none: {kl.get('assertion','')!r}",
                          f"Key line {kid}: what evidence supports \"{kl.get('assertion','')}\"? A number, a document, or a name.")
            assumed = [s for s in kl.get("support", []) if s.get("confidence") == "assumed"]
            if assumed and len(assumed) == len(kl.get("support", [])):
                rep.warn(f"{kid}: every support point is assumed")
            for s in kl.get("support", []):
                txt = (s.get("claim", "") + " " + s.get("evidence", "")).lower()
                if s.get("confidence") == "assumed" and any(w in txt for w in EXTERNAL_WORDS):
                    external_gaps.append(f"{kid}: {s.get('claim','')!r}")
                elif s.get("confidence") == "assumed":
                    content_gaps.append(f"{kid}: {s.get('claim','')!r}")
        for i, r in enumerate(sb.get("risks", []), 1):
            if not r.get("owner"):
                content_gaps.append(f"risk {i} ({r.get('risk','')[:50]!r}) has no owner")
        if sb.get("decision") and not served.get("decision"):
            rep.warn("decision has no ledger entry serving it")
    for e in external_needed:
        external_gaps.append(f"{e.get('id')}: {e.get('finding','')!r} (marked external, not yet sourced)")

    rep.emit("Coverage holds — every key line and the decision have evidence." if not content_gaps and not external_gaps
             else "Coverage has gaps — put the lists below to the user before the ghost deck.")
    if content_gaps:
        print("CONTENT GAPS — only the user can fill these (or they become labelled assumptions):")
        for g in dict.fromkeys(content_gaps):
            print("  ?", g)
        print()
    if external_gaps:
        print("EXTERNAL GAPS — put to the user with three options each: look it up / you supply it / state the gap:")
        for g in dict.fromkeys(external_gaps):
            print("  ?", g)
        print()
    return 1 if rep.blockers else 0


if __name__ == "__main__":
    sys.exit(main())
