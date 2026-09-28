# The final audit

Before handover, an independent pass reads the finished deck the way the audience
will and checks it against the ledger. The build ran from ledger to slides; the
audit runs from slides to ledger, so a figure that crept in during writing has no
trace and is caught. It is the step a manager does before a deck reaches a
client, and the report it produces is the answer to "where did that number come
from?" in the room.

## Independence

The audit reads two files: the rendered `.pptx` and `ledger.json`. Not the brief,
not the storyboard. If a subagent is available, it does this pass with no memory
of the build. If not, run it as a separate step with only those two files open,
and do the judgment half on a fresh read, not from memory of what you meant.

## The mechanical half

```bash
python3 scripts/audit_facts.py Deck.pptx ledger.json --brief brief.json --report audit.md
```

Every money figure, percentage, count and period on every slide (text, tables,
chart series, notes) is traced to the ledger and reported with its provenance:

| provenance | passes when |
|---|---|
| stated | the figure appears in a ledger entry with a citation anchor |
| derived | the entry carries `arithmetic` that recomputes to the figure |
| external | the entry carries publisher, title, date and url, all four |
| assumed | the slide itself (not only the notes) says assumed / illustrative / estimate |
| UNTRACED | none of the above: **fail** |

Before any of that, the audit checks provenance: the deck must carry the render
stamp `render_deck.js` writes into the file's subject field (a hand-built deck
fails outright), and the ledger handed to the audit must hash to the ledger the
deck was rendered against (name it in `meta.ledger`, which `to_deck_brief.py
--ledger` sets). Auditing a deck against a ledger it was not built from proves
nothing.

Also failed: an illustrative slide that names an entity not in the ledger;
a slide marked illustrative only in its notes; a data slide with no
source line; mixed currency symbols; no Draft/Final marking in the footer.
Warned: a possible contradiction, where the same capitalised feature is
described as future on one slide ("planned", "not yet") and as present on
another ("immediately", "today"); a figure formatted two ways across slides; a label headline; a period
label (axis, column header) not itself in the ledger; ledger arithmetic that does
not recompute.

The audit passes only with zero failures. Fix in the brief (cite it, label it, or
remove it), rebuild, re-audit. The report lists every fact with its ledger id.

## The judgment half

On a fresh read, per slide: does the headline claim more than the evidence under
it supports? Does the slide say anything the ledger does not? Per deck: do the
titles, read in order, make one argument? Do the four beats (answer, proof,
decision, risk) land where the tier says they should (`references/architecture.md`)?
Write the answers into the audit report under a heading `## Judgment`, one line
per finding, and fix whatever fails before handover.

## The rubric

Scored per deck and included in the report. A deck is not handed over with a fail
in the first group.

**Must pass:** every fact traced · titles read as one argument · four beats at the
right grain · source line on every data slide · no label headlines · no overflow
or overlap (`layout_check.py`) · Draft/Final marking present.

**Quality:** one message per slide · no pattern over the repetition threshold ·
number conventions held (`references/voice.md`) · colour never the only signal ·
visual balance passed on every slide · speaker notes on every content slide ·
assumptions listed at handover.

## Handover

Give the user the `.pptx`, `audit.md`, `ledger.md`, and a plain list of every
assumption, every illustrative figure, and anything unconfirmed. Then stop; the
next message is usually a revision (`references/revisions.md`).
