#!/usr/bin/env python3
"""
pyramid_check.py — CHECKPOINT B. Does the argument hold?

    python3 scripts/pyramid_check.py storyboard.json

Tests what can be tested mechanically: one governing thought stated as an
assertion, key lines that are claims rather than category labels, a consistent
grouping, adequate support, honest provenance, and a declared logical structure.

It cannot judge whether the argument is *true* or whether the groupings are
genuinely MECE — that is your job, and the point of Checkpoint B. What it can do
is catch the failures that are visible in the shape of the thing.

Ends by printing the pyramid, which is what you put to the user for approval.
Exit 1 means fix it before writing slides.
"""

import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from _common import load_json, blank, Report  # noqa: E402

PATTERNS = {"title", "section", "image", "backup", "statement", "agenda", "exec_summary", "ask", "risks", "sources",
            "cards", "quote", "phases", "chevrons", "steps", "leading_to", "funnel",
            "logic_tree", "driver_tree", "hypothesis_tree", "table", "scorecard", "heatmap",
            "chart", "waterfall", "matrix", "gantt", "roadmap", "phases_threads",
            "balance", "maturity", "curve", "panels", "map", "tiers", "status",
            "one_decision", "one_number", "one_status", "one_shift", "one_story",
            "kpi_strip", "stage_tracker", "contrast", "decision_rights", "ecosystem"}
CLAIM_KINDS = {"decomposition", "comparison", "bridge", "trend", "composition", "sequence", "convergence",
               "position", "plan", "status", "trade_off", "maturity", "parallel", "reframe", "quote",
               "governance", "impact", "illustration", "relationship"}
AUTO = {"title", "ask", "exec_summary", "agenda", "backup", "sources", "risks"}
CONFIDENCE = {"stated", "derived", "external", "assumed"}
PLACEHOLDER = re.compile(r"\b(TBD|TODO|XXX+|FIXME|lorem ipsum|placeholder|\?\?\?)\b", re.I)

VERBS = {
    "score", "scores", "save", "saves", "saved", "lose", "loses", "lost", "fit", "fits", "reach", "reaches", "account", "accounts",
    "drive", "drives", "outweigh", "outweighs", "require", "requires", "remain", "remains", "stand", "stands", "show", "shows",
    "carry", "carries", "deliver", "delivers", "move", "moves", "exceed", "exceeds", "miss", "misses", "add", "adds", "cut", "cuts",
    "grow", "grows", "grew", "fell", "rose", "double", "doubles", "halve", "halves", "close", "closes", "open", "opens", "win", "wins",
    "empty", "emptied", "net", "nets", "start", "starts", "build", "builds", "sit", "sits", "hold", "holds", "run", "runs",
    "is", "are", "was", "were", "be", "been", "being", "has", "have", "had", "will",
    "would", "can", "could", "must", "should", "may", "might", "does", "do", "did",
    "needs", "need", "makes", "make", "gives", "give", "costs", "cost", "falls", "fall",
    "rises", "rise", "exists", "exist", "sits", "sit", "holds", "hold", "runs", "run",
    "means", "mean", "lacks", "lack", "leaves", "leave", "turns", "turn", "beats", "beat",
    "breaks", "break", "stops", "stop", "starts", "start", "gates", "gate", "blocks",
    "block", "buys", "buy", "pays", "pay", "takes", "take", "gets", "get", "goes", "go",
    "comes", "come", "sits", "stays", "stay", "remains", "remain", "requires", "require",
    "delivers", "deliver", "solves", "solve", "shows", "show", "proves", "prove",
    "depends", "depend", "works", "work", "fails", "fail", "wins", "win", "loses", "lose",
    "grows", "grow", "shrinks", "shrink", "doubles", "double", "halves", "cuts", "cut",
    "saves", "save", "adds", "add", "removes", "remove", "fixes", "fix", "owns", "own",
    "knows", "know", "trusts", "trust", "matches", "match", "misses", "miss", "sees",
    "see", "does not", "cannot", "isn't", "aren't", "won't", "can't", "don't", "doesn't",
}
STOP = {
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "for", "with", "at",
    "by", "from", "as", "that", "this", "these", "those", "it", "its", "their", "our",
    "your", "we", "you", "they", "is", "are", "was", "were", "be", "been", "has", "have",
    "had", "will", "not", "no", "so", "than", "then", "into", "over", "under", "out",
}


def words(text):
    return re.findall(r"[a-z][a-z'’-]+", (text or "").lower())


def is_assertion(text):
    """Rough test: a claim, not a category label. Returns (ok, reason)."""
    t = (text or "").strip()
    if not t:
        return False, "empty"
    w = words(t)
    if len(w) < 4:
        return False, "too short to be a claim"
    if not t.endswith((".", "!", "?")):
        return False, "does not end with a full stop"
    if not (set(w) & VERBS or any(x.endswith(("ed", "ing")) for x in w[1:])):
        return False, "no verb found — reads as a topic label"
    return True, ""


def sentence_count(text):
    return len([s for s in re.split(r"(?<=[.!?])\s+", (text or "").strip()) if s.strip()])


def jaccard(a, b):
    sa = {w for w in words(a) if w not in STOP and len(w) > 3}
    sb = {w for w in words(b) if w not in STOP and len(w) > 3}
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("storyboard")
    args = ap.parse_args()

    sb = load_json(args.storyboard)
    r = Report(f"{args.storyboard}: Checkpoint B — the argument")

    # ---------------------------------------------------------------- top ---
    gt = str(sb.get("governing_thought", "")).strip()
    if blank(gt) or gt.startswith("One sentence."):
        r.block("no governing thought",
                "In one sentence, what is the answer? Everything in the deck will hang off it.")
    else:
        ok, why = is_assertion(gt)
        if not ok:
            r.block(f"governing thought is not an assertion ({why}): \"{gt[:70]}\"",
                    "The governing thought reads as a topic rather than a claim. What is the actual "
                    "assertion — something someone in the room could disagree with?")
        if sentence_count(gt) > 1:
            r.warn(f"governing thought is {sentence_count(gt)} sentences — compress it to one")
        if len(words(gt)) > 30:
            r.warn("governing thought is long; if it will not fit a title slide it is doing too much")

    structure = str(sb.get("structure", "")).strip().lower()
    if structure not in {"deductive", "inductive"}:
        r.block('structure must be declared as "deductive" or "inductive"',
                "Is the argument a chain (situation → complication → therefore) or a set of "
                "independent reasons that add up? Deductive is harder to follow but harder to refuse.")

    # --------------------------------------------------------- key lines ---
    kls = sb.get("key_lines") or []
    if not kls:
        r.block("no key lines",
                "What are the two to four points that, taken together, make the governing thought true?")
    if len(kls) == 1:
        r.block("a single key line means the governing thought is just restated — split it or drop a level")
    if len(kls) > 5:
        r.warn(f"{len(kls)} key lines — above five the audience stops holding them; group them")
    if structure == "deductive" and kls and len(kls) != 3:
        r.warn(f"structure is deductive but there are {len(kls)} key lines — a deductive chain "
               "is three steps (situation, comment, therefore). Either regroup or call it inductive.")

    groupings, total_support, assumed = [], 0, 0
    for i, kl in enumerate(kls, 1):
        tag = kl.get("id") or f"KL{i}"
        assertion = str(kl.get("assertion", "")).strip()
        ok, why = is_assertion(assertion)
        if not ok:
            r.block(f"{tag}: assertion is not a claim ({why}): \"{assertion[:60]}\"",
                    f"Key line {i} reads as a heading rather than an argument. What does it actually assert?")
        if kl.get("grouping"):
            groupings.append(str(kl["grouping"]).strip().lower())

        support = kl.get("support") or []
        total_support += len(support)
        if not support:
            r.block(f"{tag}: no support",
                    f"What evidence stands behind key line {i}? At least two points, or it is an assertion with nothing under it.")
        elif len(support) == 1:
            r.warn(f"{tag}: only one support point — one piece of evidence is a restatement, not an argument")

        for j, s in enumerate(support, 1):
            conf = str(s.get("confidence", "")).strip().lower()
            if conf not in CONFIDENCE:
                r.block(f"{tag}.{j}: confidence must be stated, derived or assumed (got \"{conf}\")")
            if conf == "assumed":
                assumed += 1
            if conf in {"stated", "derived", "external"} and blank(s.get("source")) and blank(s.get("ledger")):
                r.block(f"{tag}.{j}: marked {conf} but has no source anchor",
                        f"Where does this come from: \"{str(s.get('claim',''))[:50]}\"? A stated fact without a citation is an assumption.")
            if blank(s.get("claim")):
                r.block(f"{tag}.{j}: empty claim")

        slides = kl.get("slides") or []
        if not slides:
            r.block(f"{tag}: no slides attached")
        for k, sl in enumerate(slides, 1):
            pat = str(sl.get("pattern", "")).strip()
            if pat not in PATTERNS:
                r.block(f"{tag} slide {k}: unknown pattern \"{pat}\" — see references/patterns.md")
            if pat in AUTO:
                r.warn(f"{tag} slide {k}: pattern \"{pat}\" is generated by to_deck_brief.py; do not attach it to a key line")
            claim = str(sl.get("claim_kind", "")).strip().lower()
            if claim not in CLAIM_KINDS:
                r.block(f"{tag} slide {k}: no claim kind (have \"{claim}\"); every slide names the kind of claim its headline makes — see references/selection_rule.md")
            hl = str(sl.get("headline", "")).strip()
            ok, why = is_assertion(hl)
            if not ok:
                r.warn(f"{tag} slide {k}: headline is not an assertion ({why}): \"{hl[:60]}\"")

    if groupings and len(set(groupings)) > 1:
        r.warn(f"key lines mix groupings ({', '.join(sorted(set(groupings)))}) — they should all answer "
               "the same question about the governing thought",
               "Do your key lines all answer the same question — all reasons why, or all steps in how? "
               "Mixing them is what makes a deck feel like it wanders.")

    for i in range(len(kls)):
        for j in range(i + 1, len(kls)):
            score = jaccard(kls[i].get("assertion"), kls[j].get("assertion"))
            if score > 0.45:
                a = kls[i].get("id") or f"KL{i+1}"
                b = kls[j].get("id") or f"KL{j+1}"
                r.warn(f"{a} and {b} overlap heavily ({score:.0%} shared terms) — probably not mutually exclusive",
                       f"Key lines {i+1} and {j+1} look like the same point twice. Are they distinct, or should they merge?")

    if total_support and assumed / total_support > 0.4:
        r.warn(f"{assumed} of {total_support} support points are assumptions — the argument rests "
               "mostly on things no source confirms",
               "A lot of this rests on assumptions rather than evidence. Which of them can you confirm "
               "before this is presented, and which should be stated openly on the slide?")

    declared = sb.get("assumptions") or []
    if assumed and len(declared) < assumed:
        r.warn(f"{assumed} assumed support points but only {len(declared)} listed in assumptions[] — "
               "list them all; they go into the speaker notes and the handover")

    # -------------------------------------------------------------- ask ----
    ask = sb.get("decision") or sb.get("ask") or {}
    genre = str((sb.get("meta") or {}).get("genre", "")).lower()
    if blank(ask.get("assertion")):
        if genre in {"informational", "working_session"}:
            r.warn("no decision slide: fine for an informational or working-session deck, otherwise name the decision")
        else:
            r.block("no decision", "What do you want the audience to do? Without it this is a document, not a deck.")
    elif not (ask.get("items") or []):
        r.warn("decision has no concrete items — name the decision, the access, the people")

    # ---------------------------------------------------- global hygiene ---
    def scan(node, where):
        if isinstance(node, str):
            if PLACEHOLDER.search(node):
                r.warn(f"{where}: unresolved placeholder — {node[:50]!r}")
        elif isinstance(node, list):
            for n, v in enumerate(node):
                scan(v, f"{where}[{n}]")
        elif isinstance(node, dict):
            for k, v in node.items():
                scan(v, f"{where}.{k}")
    scan(sb, "storyboard")

    slide_total = 2 + sum(len(kl.get("slides") or []) for kl in kls)
    if slide_total > 18:
        r.warn(f"~{slide_total} slides — long for one sitting; consider an appendix or an exec cut")
    if kls and slide_total < 5:
        r.warn(f"~{slide_total} slides — thin; either the argument needs more support or this is a memo")

    code = r.emit(ok_message="The argument holds structurally. Put it to the user before writing slides.")

    # ------------------------------------------- the thing you present -----
    if not r.blockers:
        print("PUT THIS TO THE USER, THEN WAIT FOR APPROVAL:\n")
        print(f"  Governing thought:  {gt}")
        print(f"  Structure:          {structure}"
              f"{' (' + groupings[0] + ')' if groupings else ''}\n")
        for i, kl in enumerate(kls, 1):
            print(f"  {i}. {kl.get('assertion','')}")
            for s in (kl.get("support") or []):
                mark = {"stated": "·", "derived": "≈", "assumed": "?"}.get(
                    str(s.get("confidence", "")).lower(), "·")
                src = f"  [{s.get('source') or s.get('ledger')}]" if (s.get("source") or s.get("ledger")) else ""
                print(f"       {mark} {str(s.get('claim',''))[:88]}{src}")
            print()
        print(f"  Ask: {ask.get('assertion','')}\n")
        print("  Legend: · stated in a source   ≈ derived from sources   ? assumed\n")
        print("If the evidence points somewhere other than the governing thought, say so now —")
        print("once, with your reasoning. Then build what they decide.\n")

    sys.exit(code)


if __name__ == "__main__":
    main()
