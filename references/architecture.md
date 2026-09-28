# Deck architecture: the four beats

Every deck, at every size, is built answer-first. The audience is told the
conclusion before the evidence, the evidence before the ask, and the ask before
the risks. The story of how the conclusion was reached is not part of the
spine; it goes in backup for whoever asks.

| Beat | What it does | Test |
|---|---|---|
| **1 Answer** | The conclusion, as a claim with a verb. Leads with the impact and the value to *them*, not the topic. | Could someone disagree with it? Does it say what it means for the audience? |
| **2 Proof** | The two to four things that make the answer true, in MECE order, each with its evidence. | Would removing one weaken the answer? Would adding one be redundant? |
| **3 Decision** | The open question or decision the audience owns: what is needed, from whom, by when. Absent only when the genre is purely informational. | Can it be said yes to in the room? |
| **4 Risk** | What could make the answer wrong or the decision fail, with owner and mitigation, stated once. | Would the audience be surprised later by something the presenter already knew? |

The pyramid (`references/pyramid_method.md`) is the mechanism that keeps beat 2
sound: one governing thought, key lines that are mutually exclusive and
collectively exhaustive, evidence under each. The four beats are the order the
audience meets them in.

## The beats are fractal

| Tier | Size | Where each beat lands |
|---|---|---|
| **Single slide** | 1 | Answer = headline. Proof = the exhibit and body. Decision and risk = the strip at the foot of a one-slide pattern (or the band and the subtitle caveat on any other pattern). |
| **Short deck** | 2–8 | Answer = first slide after the title. Proof = one slide per key line. Decision = the ask slide. Risk = a line on the ask slide, or its own slide if there is more than one. |
| **Full deck** | 9–25 | Answer + proof headlines + decision + top risk = the executive summary. Then the body repeats the beats at full length: proof, decision slide, risks slide. |
| **Long deck** | 26+ or any deck with sections | Exec summary as above, then each section is its own small pyramid: the divider carries the section's answer, its slides the proof. Deck-level decision and risks after the last section. Backup follows. |

## What each tier changes in the process

| Tier | Interview | Storyboard | Mandatory |
|---|---|---|---|
| Single | Anchor only: audience, the one claim, read or presented | None; propose title + exhibit in one line, get a yes | Source line if it carries data |
| Short | Anchor + the nine minus length, sections, exec cut | Title list, approved in one message | Ask when a decision is named |
| Full | The full path | Storyboard; review optional (show the titles, continue unless stopped) | Ask; risks slide when risks exist |
| Long | The full path | Storyboard review required | Exec summary; agenda; section dividers with key lines; risks; backup |

`check_frame.py` sets the tier from the size answer; `to_deck_brief.py` and
`ghost_check.py` enforce the mandatory slides.

## What the executive summary is

The answer, the key lines as headlines, the decision, and the single biggest
risk, on one slide a reader could stop after. It is never a table of contents,
and nothing later in the deck should surprise someone who read only this slide.

## Genre governs the framing, not the beats

A status readout still leads with the answer ("on track, one decision
needed"), still shows proof (the RAG rows), still names the decision and the
risk. What changes is that nothing is manufactured to persuade: SCQA framing is
off, the ask may be "no decision needed", and a status deck with an invented
complication is worse than no framing at all.

### The capability overview

A deck that explains what a thing is, what it does, how you use it and what
it does not do yet (a module walkthrough, a product overview, "here is what
the programme built") is its own genre, `capability_overview`. It is
informational, so the decision beat may be "no decision needed", but the
fourth beat is not optional: it becomes **limits and what's next**. Beta tags,
dev-environment caveats, and "another system still owns this" findings are
graded core, not context, and land on a mandatory slide before the close. An
executive who learns the limits from the engineer in the room, rather than
from the slide, stops trusting the rest of the deck. `ghost_check.py` and
`check_brief.js` refuse the genre without that slide.

For a mixed room (executives and practitioners in one session, interleaved),
tag each slide with `audience`; the renderer puts it on the eyebrow so the
treatment is identical everywhere. Value slides carry the executive tag,
screen-by-screen slides the practitioner tag, and the read-through must still
work with the practitioner slides skipped.

## The single slide and the impact slide

A single-slide deck still carries all four beats, on one slide: the headline is
the answer, the body is the proof, and the strip at the foot is the decision and
the risk. That is what the one-slide family is built for; pick the pattern by
the slide's job (`references/selection_rule.md`).

Inside a longer deck the same patterns are **impact slides**: the moment a
section's argument lands on one page, usually straight after its divider or as
its close. One per section at most (one per deck when there are no sections).
More than that and the deck stops having proof; `ghost_check.py` blocks it and
`check_brief.js` warns.

## Backup

Everything that explains how the conclusion was reached, and any detail a
specific reader may ask for, sits after the ask behind a `backup` divider.
Backup slides are excluded from the title read-through and the repetition
check. They are still audited.

## Going back a stage

The path is linear; the work is not. When a later checkpoint reveals an
earlier mistake, go back to the stage that was wrong, keep everything upstream
of it, and never restart from the anchor unless the anchor was the fault.

| Going back to | Kept | Regenerated |
|---|---|---|
| Anchor | The ledger, re-graded against the new anchor | Frame, storyboard, brief |
| Frame (CP1) | Ledger, anchor | Storyboard, brief |
| Argument (CP2) | Ledger, frame | Storyboard slides for the affected key lines; brief |
| Build | Everything upstream | The brief's affected slides; re-render |
