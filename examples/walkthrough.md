# Walkthrough: the worked example, stage by stage

Every command below was run in the sandbox on the fictional Halvard Freight example. Output is trimmed to what the agent acts on.

## Stage 0 — Anchor (before anything is read)

Three questions, answered by the user, recorded in `frame.json` under `anchor`. See `examples/frame.example.json`.

## Stage 1 — Parse

```
$ python3 scripts/parse_sources.py examples/sources -o sources.json
  depot_model.xlsx                   sheets: ['Utilisation', 'Cost', 'Transition']; 80 labelled values; 4 figures
  operator_interviews.md             lines: 15, words: 163; 13 figures; 4 headings

Next: grade every finding against the anchor and write ledger.json; then python3 scripts/build_ledger.py ledger.json --sources sources.json
Cite using the anchors in sources.json. Summarize; do not copy source text through.

```

The agent reads the prose itself, grades every finding against the anchor, and writes `ledger.json` (see `examples/ledger.example.json`). Then the mechanical half:

```
$ python3 scripts/build_ledger.py examples/ledger.example.json --sources sources.json --md ledger.md

Ledger holds — every core fact has a grade, an origin and a citation.

wrote ledger.md
```

## Stage 2 — Frame and CP1 readback

```
$ python3 scripts/check_frame.py examples/frame.example.json --write --sources examples/sources.example.json --ledger examples/ledger.example.json
PROBE THESE (one follow-up each, show the examples, then move on):
  ! q2: message is the agent's draft; it must be read back and confirmed

READBACK — put this to the user and ask "is this the deck?" (it doubles as the skip token for a later session):

  This is a findings deck of about 12 slides (full tier), sent ahead and then presented, from the position of the expert reporting findings. It is for CEO and CFO, who currently believe that the network is roughly the right size and closures are a service risk and will push back on loss of next-day service; union delay at Ridgeway; technical depth low. Situation: Halvard runs nine depots; the network was sized before the Carver contract ended and before Easton expanded. Complication: Three depots have run below 40% utilisation for six quarters, and the Oakmont lease renews in March at a 12% step-up. The outcome wanted: The board approves the consolidation of Ridgeway, Brookline and Oakmont and releases the $2.6M transition budget by Oct 15. The one sentence they should repeat afterwards: "Consolidating three depots saves $4.1M a year for a one-time cost of $2.6M, with next-day coverage held for 99.2% of customers." (my draft; confirm it) Constraints: must include the 17 customers who lose next-day service, the union consultation timeline; must leave out names of individual depot managers; must match the $2.6M figure already quoted to the CFO. Packaging: no logo, Draft — for discussion, Confidential, en-US.

wrote tier=full into /home/claude/skill/firstchair-consulting-deck/examples/frame.example.json
```

The agent puts the readback to the user: *is this the deck?* On a yes, the readback ends with the packaging line (logo, draft/final, classification, spelling).

## Stage 3 — Argue: pyramid and coverage

```
$ python3 scripts/pyramid_check.py examples/storyboard.example.json

/home/claude/skill/firstchair-consulting-deck/examples/storyboard.example.json: Checkpoint B — the argument

The argument holds structurally. Put it to the user before writing slides.

PUT THIS TO THE USER, THEN WAIT FOR APPROVAL:

  Governing thought:  Consolidating three depots saves $4.1M a year for a one-time cost of $2.6M, with next-day coverage held for 99.2% of customers.
  Structure:          inductive (why)

  1. Three depots carry $5.2M of fixed cost for 14% of network volume.
       · Ridgeway, Brookline and Oakmont run at 34–39% utilisation  [E1]
...
```

```
$ python3 scripts/coverage_check.py examples/frame.example.json examples/ledger.example.json examples/storyboard.example.json
coverage check

Coverage holds — every key line and the decision have evidence.

```

## CP2 — Ghost deck

```
$ python3 scripts/ghost_check.py examples/storyboard.example.json
Ghost deck holds mechanically.

GHOST DECK — read the titles in order; they must tell the story on their own:

  0.  [title]        Six depots do the work of nine
  1.  [exec_summary] Consolidating three depots saves $4.1M a year for a one-time cost of $2.6M, with next-day coverage held for 99.2% of customers.
  2.  [heatmap     ] Three depots have run below 45% utilisation for six quarters.   (trend)
  3.  [leading_to  ] Three separate changes emptied the same three depots.   (convergence)
  4.  [scorecard   ] Easton and Fairmont score highest on every criterion but one.   (comparison)
  5.  [funnel      ] Of 2,140 customers, 17 would lose next-day service.   (convergence)
  6.  [waterfall   ] Gross saving of $4.4M nets to $4.1M after fuel.   (bridge)
  7.  [roadmap     ] Savings start in month four and reach run-rate in month ten.   (plan)
  8.  [risks]        3 risks with owners
  9.  [ask]          Three approvals to start in November.
  --  [backup]       1 slides, excluded from the read-through

If a title read on its own does not advance the argument, the slide is either backup or unnecessary.

```

## Stage 4 — Build

```
$ python3 scripts/to_deck_brief.py examples/storyboard.example.json -o brief.json --frame examples/frame.example.json --ledger examples/ledger.example.json
wrote brief.json: 12 slides (tier full)
Next: node scripts/check_brief.js brief.json
$ node scripts/render_deck.js brief.json Example.pptx
postfix: removed base-series labels in 1 chart series
WROTE Example.pptx  (12 slides)
Next: python3 scripts/validate_deck.py Example.pptx && python3 scripts/layout_check.py Example.pptx --brief brief.json
Then render to images and LOOK at every slide before handing over.
```

## Stage 5 — Inspect

```
$ python3 scripts/validate_deck.py Example.pptx
PASS (structure only) — now render to images and check overflow, overlap, alignment.
$ python3 scripts/layout_check.py Example.pptx --brief brief.json

Example.pptx: 0 fail, 3 warn
Layout PASS (mechanical) — now render to images and look at every slide.
```

Then every slide is rendered to an image and looked at (`references/visual_qa.md`). Fixes go into the slide's `tune` block in the storyboard, and the build re-runs.
