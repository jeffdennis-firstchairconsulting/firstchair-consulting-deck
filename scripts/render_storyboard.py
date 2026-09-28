#!/usr/bin/env python3
"""
render_storyboard.py — the artifact the user red-pens.

    python3 scripts/render_storyboard.py storyboard.json -o storyboard.md

Writes the pyramid, the slide plan, the evidence ledger with citations, the
assumptions, and the open questions. It stands on its own as a document even if
no deck is ever built from it.
"""

import argparse
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from _common import load_json  # noqa: E402

MARK = {"stated": "stated", "derived": "derived", "assumed": "ASSUMED"}


def esc(text):
    return str(text or "").replace("|", "\\|").replace("\n", " ").strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    ap.add_argument("-o", "--out", default="storyboard.md")
    args = ap.parse_args()

    sb = load_json(args.storyboard)
    meta = sb.get("meta", {}) or {}
    scqa = sb.get("scqa", {}) or {}
    kls = sb.get("key_lines") or []
    ask = sb.get("decision") or sb.get("ask") or {}
    L = []

    title = meta.get("title") or f"{meta.get('program', 'Storyboard')}"
    L += [f"# {title}", ""]
    L += [f"**{meta.get('customer','')}** · {meta.get('docType','')} · "
          f"{meta.get('genre','')} deck", ""]
    if meta.get("audience"):
        L += [f"**Audience.** {meta['audience']}", ""]
    if meta.get("objective"):
        L += [f"**Objective.** {meta['objective']}", ""]
    if meta.get("provenance"):
        L += [f"**Grounded in.** {meta['provenance']}", ""]

    # ------------------------------------------------------------ setup ---
    if scqa.get("use"):
        L += ["## Setup", ""]
        for label in ("situation", "complication", "question"):
            if scqa.get(label):
                L += [f"**{label.title()}.** {scqa[label]}", ""]

    # ---------------------------------------------------------- pyramid ---
    L += ["## The argument", ""]
    L += [f"> **{sb.get('governing_thought','')}**", ""]
    L += [f"*Structure: {sb.get('structure','')}"
          + (f", grouped by {kls[0].get('grouping')}" if kls and kls[0].get("grouping") else "")
          + f" — {len(kls)} key lines.*", ""]

    for i, kl in enumerate(kls, 1):
        L += [f"### {i}. {kl.get('assertion','')}", ""]
        for s in (kl.get("support") or []):
            conf = MARK.get(str(s.get("confidence", "")).lower(), "?")
            src = f" · `{s['source']}`" if s.get("source") else ""
            ev = f" — {s['evidence']}" if s.get("evidence") else ""
            L += [f"- {s.get('claim','')}{ev} *({conf})*{src}"]
        L += [""]
        for sl in (kl.get("slides") or []):
            L += [f"  - slide → `{sl.get('pattern','')}` ({sl.get('claim_kind','?')}) · **{sl.get('headline','')}**"]
        L += [""]

    # ----------------------------------------------------------- risks ---
    risks = sb.get("risks") or []
    if risks:
        L += ["### Risks", ""]
        for r in risks:
            L.append(f"- **{r.get('risk','')}** ({r.get('impact','')}) — owner {r.get('owner','') or '?'}; {r.get('mitigation','')}")
        L.append("")
    # ------------------------------------------------------------- ask ---
    if ask:
        L += ["### The decision", "", f"**{ask.get('assertion','')}**", ""]
        for it in (ask.get("items") or []):
            L += [f"- **{it.get('kicker','')}: {it.get('title','')}** — {it.get('body','')}"]
        L += [""]

    # ------------------------------------------------------ slide plan ---
    L += ["## Slide plan", "", "| # | Pattern | Headline | Thesis band | From |",
          "|---|---|---|---|---|"]
    n = 1
    L += [f"| {n} | title | {esc(meta.get('title') or sb.get('governing_thought'))} | — | governing thought |"]
    for i, kl in enumerate(kls, 1):
        for j, sl in enumerate(kl.get("slides") or []):
            n += 1
            band = sl.get("band") or (kl.get("assertion") if j == 0 else "")
            L += [f"| {n} | {esc(sl.get('pattern'))} | {esc(sl.get('headline'))} | "
                  f"{esc(band)} | KL{i} |"]
    n += 1
    L += [f"| {n} | ask | {esc(ask.get('assertion'))} | — | the ask |", ""]

    # -------------------------------------------------------- evidence ---
    L += ["## Evidence ledger", "", "| Claim | Confidence | Source |", "|---|---|---|"]
    rows = 0
    for kl in kls:
        for s in (kl.get("support") or []):
            L += [f"| {esc(s.get('claim'))} | {MARK.get(str(s.get('confidence','')).lower(),'?')} "
                  f"| {esc(s.get('source')) or '—'} |"]
            rows += 1
    if not rows:
        L += ["| — | — | — |"]
    L += [""]

    assumptions = sb.get("assumptions") or []
    L += ["## Assumptions", ""]
    L += ([f"- {a}" for a in assumptions] if assumptions
          else ["- None recorded. If that is true, say so explicitly when handing over."])
    L += [""]

    oq = sb.get("open_questions") or []
    if oq:
        L += ["## Open questions", ""] + [f"- {q}" for q in oq] + [""]

    L += ["---", "",
          "*Storyboard for the firstchair-consulting-deck skill. Next: ghost_check.py, "
          "then to_deck_brief.py and render_deck.js.*", ""]

    Path(args.out).write_text("\n".join(L), encoding="utf-8")
    print(f"WROTE {args.out}  ({n} slides, {rows} evidence rows, {len(assumptions)} assumptions)")
    print("Give this to the user for review before converting it to a deck brief.")


if __name__ == "__main__":
    main()
