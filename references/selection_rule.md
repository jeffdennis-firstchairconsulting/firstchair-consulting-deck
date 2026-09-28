# The selection rule: claim to exhibit

The slide form is chosen by the claim the headline makes, then by the shape of
the evidence under it. Never by the data that happens to be available, and
never by habit. A deck where every claim is a row of cards has not decided what
it is claiming. Apply this at the ghost-deck stage, before any content is
written; `scripts/ghost_check.py` enforces the mechanical part.

## Step 1: classify the headline

Every headline is a claim of one of these kinds. Write the kind into the
storyboard slide as `claim_kind` before choosing anything.

| The headline says… | `claim_kind` | Default exhibit | Alternatives |
|---|---|---|---|
| X is made of A, B, C | `decomposition` | `logic_tree` | `driver_tree` when leaves carry a trend or score; `hypothesis_tree` when each branch is a hypothesis with evidence |
| A beats B on these criteria | `comparison` | `scorecard` (balls, lights or arrows) | `heatmap` for 20+ cells; `table` when the numbers are the point; `map` for a two-column contrast; `contrast` when one side is what stays the same |
| The total moved from X to Y because… | `bridge` | `waterfall` | `chart` stacked when the parts are categories, not steps |
| X rose / fell / changed over time | `trend` | `chart` line | `chart` column under six periods; `curve` for a shape, not data points; `heatmap` for many entities over time; `kpi_strip` when three to five metrics each moved |
| X is N% of the whole | `composition` | `chart` 100% stacked | `chart` stacked when absolutes matter |
| First A, then B, then C | `sequence` | `chevrons` | `phases` when people are attached; `steps` when each stage builds on the last; `phases_threads` when workstreams cross phases |
| A, B and C together cause X | `convergence` | `leading_to` | `funnel` when there is attrition stage to stage |
| X sits here on two dimensions | `position` | `matrix` | |
| Here is when things happen | `plan` | `gantt` | `roadmap` when initiatives carry a financial impact; `phases_threads` when the plan is who-does-what; `stage_tracker` when the plan is readiness gates per item |
| Here is where things stand | `status` | `status` (RAG rows) | `scorecard` with lights when there are criteria per row; `kpi_strip` when the status is a set of metrics against target; `stage_tracker` when it is items through stages |
| The costs are X, the benefits Y | `trade_off` | `balance` | `map`; `contrast` when the trade is "this stays, that changes" |
| We are at stage N of M | `maturity` | `maturity` | `curve`; `stage_tracker` when several items sit at different stages |
| This is who decides what | `governance` | `decision_rights` | `table` |
| This is how these things connect (X in the middle, what it touches around it) | `relationship` | `ecosystem` | `panels` when the relationship is layers; `map` when it is one-to-one |
| These N things are true | `parallel` | `cards` | `quote` when one voice carries it; `panels` for zones with named products; `tiers` for parallel tracks; `table` for parallel numbers |
| This one idea | `reframe` | `statement` | |
| The whole argument, on one slide | `impact` | one of the one-slide family, by message (below) | `statement` when there is no proof to show |
| This is what the screen looks like | `illustration` | `image` (a real capture at full size) | `panels` or `cards` describing the screen in words when no usable capture exists |
| (structural) | `structural` | `title` `section` `agenda` `exec_summary` `ask` `risks` `backup` `sources` | |

The exhibit is the proof of the headline. If the exhibit does not prove the
headline on its own, one of them is wrong.

## The one-slide family: pick by the message

A single-slide request is still a pyramid: answer in the headline, proof in the
body, the ask and the risk at the foot. Choose the pattern by what the one
slide must make happen:

| The slide's job | Pattern |
|---|---|
| Get a decision: here is what we recommend, why, and what we need | `one_decision` |
| Land one figure: this number is the story, and here is what drives it | `one_number` |
| Give a status call: overall, by workstream, and the one red with its ask | `one_status` |
| Show a change: before and after, row by row, with the size of each change | `one_shift` |
| Make a case that needs its context: situation, complication, resolution | `one_story` |

If the message is a decision and a number both, it is a decision: put the
number in the first reason. Inside a longer deck these are **impact slides**:
one per section at most, usually right after the divider or as the close of
the section. `ghost_check.py` blocks more; a deck that is all impact slides has
no proof.

## Step 2: check the evidence shape

If the default exhibit needs data the evidence does not have (a waterfall
with no starting total, a scorecard with no criteria, a trend with two data
points), go to the alternative or reclassify the headline. Never fabricate the
missing structure, and never fabricate a plausible-looking number to fill a
chart.

## The substitution rule

The pattern the user approved at the ghost deck is the pattern that gets built.
`to_deck_brief.py` records it as `approved_pattern`; `check_brief.js` refuses a
brief whose `pattern` differs unless the slide carries
`"substitution": {"approved_by_user": true, "reason": "..."}`. When an approved
exhibit cannot be built (the screenshot is a thumbnail, the waterfall has no
starting total), stop, say why, offer two alternatives, and record the choice.
A silent swap is how a mock-up with invented numbers ends up in front of a
vice-president.

## Step 3: the repetition rule

`ghost_check.py` fails the ghost deck when, across content slides (backup
excluded):

- one pattern carries more than **40%** of the slides, or
- **three consecutive** slides share a pattern.

The fix is never to swap in a lookalike. Re-read the headline: if two adjacent
slides are both "these things are true", they may be one slide, or one of them
is really a comparison or a sequence that was written as a list.

## The one message per slide

One claim, one exhibit, one thesis band that draws the implication. A slide
with two claims is two slides. A slide whose band restates its headline has one
idea too few.

## Highlight

Amber marks the one thing the eye should land on: one bar, one row, one cell,
one card, one quadrant, one KPI. Never more than once per slide, and on most
slides not at all. If everything is highlighted, nothing is. Put it on the
thing the headline is about, which is often the miss rather than the win: on a
KPI strip where three targets were hit and one was missed, the highlight goes
on the miss.

Amber is also the colour of the amber status. The two never collide in
meaning because a status chip always carries its word; the highlight is an
edge, a fill or a ring, never a word.

## Never draw around the library

When the user describes a picture ("FLOW in the middle with lines to every
system it talks to"), find the claim under it and pick the pattern for that
claim. A picture of how things connect is `ecosystem`. Do not draw a diagram
with another tool and paste it in through `image`: the result cannot be edited,
ignores the type scale, and escapes every layout check. The brief gate refuses
an image slide whose `imageKind` is not `screenshot` or `photo`. If a shape
genuinely fits no pattern, compose it from kit primitives in native shapes and
flag it for promotion (`references/patterns.md`, last section).
