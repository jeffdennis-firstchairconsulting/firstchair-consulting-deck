#!/usr/bin/env python3
"""
check_frame.py — CHECKPOINT 1 gate. Which frame answers are good enough to build on?

    python3 scripts/check_frame.py frame.json [--write]

Each of the nine questions has a test for a usable answer (references/interview.md
explains the intent behind each). This prints, for every answer that fails, the
probe to put to the user and the unrelated example answers that show the shape
of a good one. It also sets `tier` from the size answer (--write saves it back).

Two answers can never be left empty: q1 (the outcome) and q2 (the message).
If both are missing the agent proposes each and needs a yes. Exit 1 while any
blocker remains; warnings are answers worth one probe but not worth stopping for.
"""
import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from _common import load_json, save_json, blank  # noqa: E402

OUTCOME_VERBS = re.compile(r"\b(approve|approv|fund|agree|decide|choose|pick|select|sign|commit|adopt|stop|start|"
                           r"accept|reject|endorse|understand|believe|change|prioriti|allocate|release|greenlight|"
                           r"go ahead|confirm|authori)", re.I)
TOPIC_ONLY = re.compile(r"^(our|the|an?|my)\s+[\w\s\-]+$", re.I)
POSITIONS = {"expert", "vendor", "team_member"}
DELIVERY = {"read", "presented", "sent_then_presented"}
GENRES = {"proposal", "findings", "status", "business_case", "working_session", "capability_overview"}

PROBES = {
    "q1_outcome": ("Name the thing you want to happen because of this deck: a decision, an approval, a change in what "
                   "someone believes.",
                   ["\"I want the board to approve closing the Lyon plant.\"",
                    "\"I want the two product leads to stop arguing and pick one vendor.\"",
                    "\"I want my sponsor to accept the new go-live date and say so to her peers.\""]),
    "q2_message": ("That reads as a topic. What is the claim about it, in one sentence someone could disagree with?",
                   ["\"The migration is on track, but only if security signs off this month.\"",
                    "\"Our churn problem is a pricing problem, not a product problem.\"",
                    "\"Two of the five regions should be merged before the next hiring round.\""]),
    "q3_situation": ("Two halves: what the audience already accepts as true, and what has changed that makes this deck "
                     "necessary now.",
                     ["Situation: \"The clinic network was built for walk-in volume.\" Complication: \"Walk-ins fell 30% "
                      "after the telehealth launch and the leases don't.\"",
                      "Situation: \"The warehouse software was chosen in 2019 for one site.\" Complication: \"There are now "
                      "six sites and it cannot see across them.\""]),
    "q4_audience": ("Who decides, what do they already believe about this, what will they push back on, and how technical "
                    "are they?",
                    ["\"The CFO decides. She thinks this is a cost problem. She'll push back on any timeline over six months. "
                     "Not technical.\"",
                     "\"Twelve store managers, none of whom have seen the data, most of whom think head office is the problem.\""]),
    "q5_position": ("Which are you to this audience: an expert reporting findings, a vendor proposing work, or a team member "
                    "asking for support?", []),
    "q6_delivery": ("Will this be read on its own, presented live, or sent ahead and then presented?", []),
    "q7_length": ("How long: a slide count or minutes in the room, and do you need a short version too?",
                  ["\"About twelve slides, twenty minutes, and a two-slide version for the pre-read.\"",
                   "\"One slide for the weekly email.\""]),
    "q8_genre": ("What kind of deck: proposal, findings, status readout, business case, working session, or capability overview (what a thing is, what it does, how you use it, what it does not do yet)?", []),
    "q9_constraints": ("Anything that must be in, must be out, or must match something already said? An explicit "
                       "\"nothing\" is fine.",
                       ["\"Must include the headcount table the board saw in March; must not mention the vendor dispute.\"",
                        "\"Must match the $14M figure already in the annual plan.\""]),
}


def words(s):
    return len(re.findall(r"\w+", s or ""))


def test(frame):
    f = frame.get("frame", {}) or {}
    a = frame.get("anchor", {}) or {}
    blockers, warns, probes = [], [], []

    def get(q, key="answer"):
        return (f.get(q, {}) or {}).get(key, "")

    # q1
    q1 = get("q1_outcome") or (a.get("outcome", {}) or {}).get("answer", "")
    if blank(q1):
        blockers.append("q1: no outcome. Propose one from the sources and get a yes; never default to informational silently.")
        probes.append("q1_outcome")
    elif not OUTCOME_VERBS.search(q1) or words(q1) < 4:
        warns.append(f"q1: outcome has no decision in it: {q1!r}")
        probes.append("q1_outcome")
    # q2
    q2 = get("q2_message")
    if blank(q2):
        blockers.append("q2: no governing message. Draft one from the evidence; it needs a yes before anything is built.")
        probes.append("q2_message")
    else:
        s = q2.strip()
        if TOPIC_ONLY.match(s) or words(s) < 6 or not re.search(r"\b(is|are|will|should|can|must|has|have|need|cost|save|"
                                                                r"fall|rise|require|not|only|because|if|but)\b", s, re.I):
            blockers.append(f"q2: message reads as a topic, not a claim: {s!r}. A topic cannot anchor a deck; probe for the claim.")
            probes.append("q2_message")
        if (f.get("q2_message", {}) or {}).get("origin") == "drafted":
            warns.append("q2: message is the agent's draft; it must be read back and confirmed")
    # q3
    q3 = f.get("q3_situation", {}) or {}
    if blank(q3.get("situation")) or blank(q3.get("complication")):
        warns.append("q3: situation or complication missing; infer from the sources and mark as an assumption")
        probes.append("q3_situation")
    # q4
    q4 = f.get("q4_audience", {}) or {}
    if blank(q4.get("who_decides")) and blank(a.get("audience", {}).get("answer")):
        blockers.append("q4: no audience")
        probes.append("q4_audience")
    elif sum(1 for k in ("who_decides", "what_they_believe", "pushback") if not blank(q4.get(k))) < 2:
        warns.append("q4: audience is a name or a role only; who decides, what they believe, and what they push back on are missing")
        probes.append("q4_audience")
    if q4.get("technical_level", "") not in {"low", "medium", "high"}:
        warns.append("q4: technical_level not set (low | medium | high)")
    # q5, q6, q8
    if get("q5_position") not in POSITIONS:
        warns.append("q5: presenter position not one of expert | vendor | team_member")
        probes.append("q5_position")
    if get("q6_delivery") not in DELIVERY:
        warns.append("q6: delivery not one of read | presented | sent_then_presented")
        probes.append("q6_delivery")
    if get("q8_genre") not in GENRES:
        warns.append("q8: genre not one of proposal | findings | status | business_case | working_session | capability_overview")
        probes.append("q8_genre")
    # q7 and tier
    q7 = f.get("q7_length", {}) or {}
    slides = int(q7.get("slides") or 0)
    if not slides and not q7.get("minutes"):
        warns.append("q7: no length; default is 12 to 15 slides")
        probes.append("q7_length")
        slides = 12
    if not slides and q7.get("minutes"):
        slides = max(1, round(int(q7["minutes"]) / 1.5))
    tier = "single" if slides <= 1 else "short" if slides <= 8 else "full" if slides <= 25 else "long"
    # q9
    q9 = f.get("q9_constraints", {}) or {}
    if all(not q9.get(k) for k in ("must_include", "must_exclude", "must_match")) and q9.get("origin") != "user":
        warns.append("q9: constraints not asked; an explicit \"nothing\" from the user is the answer")
        probes.append("q9_constraints")
    return blockers, warns, list(dict.fromkeys(probes)), tier


def readback(frame, tier):
    """Compose the readback paragraph from the frame. Deterministic, so the same
    frame always reads back the same way, and pasteable to skip the interview."""
    f = frame.get("frame", {}) or {}
    g = lambda q, k="answer": str((f.get(q) or {}).get(k, "") or "").strip()
    a4 = f.get("q4_audience") or {}
    q7 = f.get("q7_length") or {}
    q9 = f.get("q9_constraints") or {}
    pk = frame.get("packaging") or {}
    mode = {"read": "read on its own", "presented": "presented live", "sent_then_presented": "sent ahead and then presented"}.get(g("q6_delivery"), g("q6_delivery"))
    pos = {"expert": "the expert reporting findings", "vendor": "the vendor proposing work", "team_member": "a team member asking for support"}.get(g("q5_position"), g("q5_position"))
    parts = []
    parts.append(f"This is a {g('q8_genre').replace('_', ' ')} deck of about {q7.get('slides') or '?'} slides ({tier} tier), {mode}, from the position of {pos}.")
    lc = lambda t: (t[:1].lower() + t[1:]) if t else t
    parts.append(f"It is for {a4.get('who_decides') or 'an audience not yet named'}, who currently believe {lc(a4.get('what_they_believe')) or '(not stated)'} and will push back on {lc(a4.get('pushback')) or '(not stated)'}; technical depth {a4.get('technical_level') or 'unset'}.")
    q3 = f.get("q3_situation") or {}
    if q3.get("situation") or q3.get("complication"):
        parts.append(f"Situation: {q3.get('situation','')} Complication: {q3.get('complication','')}")
    parts.append(f"The outcome wanted: {g('q1_outcome')}")
    parts.append(f"The one sentence they should repeat afterwards: \"{g('q2_message')}\"" + (" (my draft; confirm it)" if (f.get("q2_message") or {}).get("origin") == "drafted" else ""))
    inc, exc, mat = q9.get("must_include") or [], q9.get("must_exclude") or [], q9.get("must_match") or []
    if inc or exc or mat:
        parts.append("Constraints: " + "; ".join(x for x in [
            ("must include " + ", ".join(inc)) if inc else "", ("must leave out " + ", ".join(exc)) if exc else "",
            ("must match " + ", ".join(mat)) if mat else ""] if x) + ".")
    parts.append(f"Packaging: {'logo ' + pk['logo'] if pk.get('logo') else 'no logo'}, {pk.get('status') or 'no draft marking'}, {pk.get('classification') or 'no classification'}, {pk.get('locale', 'en-US')}.")
    return " ".join(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("frame")
    ap.add_argument("--write", action="store_true", help="save the computed tier back into the frame")
    ap.add_argument("--sources", help="sources.json from parse_sources.py; when given, the ledger must exist on disk")
    ap.add_argument("--ledger", default="ledger.json", help="ledger.json written by the agent after the parse")
    args = ap.parse_args()
    frame = load_json(args.frame)
    blockers, warns, probes, tier = test(frame)
    # The ledger must be a file before the readback, not a table in the chat.
    # The audit traces the finished deck against ledger.json; a ledger that
    # exists only in prose gives it nothing to trace and the audit gets skipped.
    if args.sources:
        parsed = [f for f in (load_json(args.sources).get("files") or []) if f.get("status") == "parsed"]
        if parsed and not Path(args.ledger).exists():
            blockers.append(f"{len(parsed)} source file(s) were parsed but {args.ledger} does not exist. Write the graded ledger to disk "
                            f"and run build_ledger.py before the readback; the audit needs it later.")

    print(f"\n{args.frame}: tier {tier}\n")
    if blockers:
        print("BLOCKERS:")
        for b in blockers:
            print("  \u2717", b)
        print()
    if warns:
        print("PROBE THESE (one follow-up each, show the examples, then move on):")
        for w in warns:
            print("  !", w)
        print()
    if probes:
        print("PROBES TO PUT TO THE USER — batch them in one message:\n")
        for i, q in enumerate(probes, 1):
            text, examples = PROBES[q]
            print(f"  {i}. {text}")
            for ex in examples:
                print(f"       e.g. {ex}")
        print("\nExamples are deliberately from other domains: show the shape of a good answer, never a default to copy.\n")
    rb = readback(frame, tier)
    if not blockers:
        print("READBACK — put this to the user and ask \"is this the deck?\" (it doubles as the skip token for a later session):\n")
        print("  " + rb + "\n")
    if args.write:
        frame["tier"] = tier
        frame["readback"] = rb
        save_json(frame, args.frame)
        print(f"wrote tier={tier} into {args.frame}")
    return 1 if blockers else 0


if __name__ == "__main__":
    sys.exit(main())
