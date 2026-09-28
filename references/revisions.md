# Revisions and going back

The real loop does not end at handover. "Make slide 4 a chart, cut 8 and 9,
soften the ask" is the normal next message. Handle it without a restart and
without losing anyone's work.

## The brief is the master

Every change is made in `brief.json` (or, upstream, in the storyboard and
re-converted) and re-rendered. The renderer is deterministic: a re-render
reproduces every slide the user did not ask to change, `tune` blocks included.
Changed slides go back through `layout_check.py`, the eye pass and
`audit_facts.py`; unchanged slides do not need another look, but the audit runs
on the whole deck because it is cheap.

- **A wording change** → edit the slide in the brief, re-render.
- **A different exhibit for the same claim** → change `pattern` and its fields;
  check the claim kind still fits (`references/selection_rule.md`).
- **Cut a slide** → remove it from the brief; page numbers renumber; re-run
  `ghost_check.py` on the storyboard if the argument changed.
- **A new fact** → it goes in the ledger first, with its anchor or its
  assumption label, or the audit will fail on it. This is the rule that keeps
  revisions honest.

## The hand-edited-file rule

`render_deck.js` writes `<Deck>.pptx.stamp.json` after every render. If the
`.pptx` on disk is newer than the stamp, the user edited it in PowerPoint.
The script refuses (exit 2) and prints the two routes; put them to the user
rather than choosing:

1. **Keep the hand edits.** From now on the brief is no longer master; edit the
   `.pptx` in place (python-pptx for text, or tell the user what to change).
   Say plainly that the renderer will not be used again for this file.
2. **Re-render from the brief and lose the hand edits.** Re-run with
   `--overwrite`, or write to a new file name so both versions exist.

Never re-render over a newer file without that choice. Never silently pick one.

## Going back a stage

A user at the ghost deck sometimes realises the frame was wrong. Each checkpoint
names what going back keeps and what it regenerates; never restart from the
anchor when a later stage was the one at fault.

| going back to | kept | regenerated |
|---|---|---|
| anchor | the ledger (re-grade every entry against the new anchor) | frame, storyboard, brief |
| frame (CP1) | ledger, anchor | storyboard, brief |
| argument (CP2) | ledger, frame | storyboard slides for the affected key lines only; brief |
| build | everything upstream | the affected slides of the brief; re-render |

When the frame changes, re-run `check_frame.py --write` so the readback (the
skip token) is current, and `coverage_check.py`, because a new outcome usually
needs evidence the old one did not.
