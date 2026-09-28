---
name: "firstchair-consulting-deck"
description: "Builds consultant-grade PowerPoint decks and single slides in the First Chair house style, and revises decks built with it. Use for any deck, slides, storyboard, exhibit or .pptx request."
---

# First Chair consulting deck

**When to use:** Build consultant-grade PowerPoint decks the way an analyst does: a short interview for the frame, a graded read of the user's documents into an evidence ledger, a Pyramid Principle storyboard with a ghost-deck checkpoint, a native editable .pptx rendered from 46 exhibit patterns in a fixed house style (including a one-slide family for single-slide asks and impact slides), a mechanical and visual layout pass, and a fact audit that traces every figure back to its source. Use whenever the user asks for a deck, slides, a presentation, a proposal, an ecosystem or integration diagram, a status readout, a findings readout, a business case, an executive summary, a board pack, a storyboard, a single slide, a one-slide summary, an impact slide, or a .pptx, from any material or from none. Also use when they ask to revise, extend or re-audit a deck built with it. Asks before it invents; never fabricates a figure.

One skill that takes a user from a folder of material (or nothing) to a deck a
management consultant would put in front of a board. It replaces the
`deck-storyboard` + `house-deck-style` pair with a single path.

**Division of labour:** the user owns the intent and the facts; the skill owns
the geometry and the gates; you own the interview, the argument, and the writing.

**What an expert knows that a generalist doesn't:** the slide form is chosen by
the claim it proves, not by the data that happens to be available. A comparison
gets a scorecard, a decomposition gets a tree, a sequence gets chevrons, a total
gets a waterfall. A deck where every claim is a row of cards has not decided
what it is claiming.

**Never invent a fact.** A figure is from the user's material, from a page you
fetched and cite, or it is labelled an assumption on the slide. There is no
fourth category. The audit at the end enforces this.

## The path

Eight stages. Checkpoints (CP) are where you stop and wait for the user. The
ceremony scales with the deck; see *Tiers* below before starting.

```
0 ANCHOR     three plain questions before reading anything   -> frame.json (anchor)
1 PARSE      read sources against the anchor; grade; ledger   -> sources.json, ledger.json/.md
2 FRAME      nine questions, pre-filled from the ledger       -> frame.json
   CP1       readback: "is this the deck?" (+ packaging line)
3 ARGUE      pyramid; coverage; content and external gaps     -> storyboard.json/.md
   CP2       ghost deck: titles in order, one exhibit each
4 BUILD      storyboard -> brief.json -> Deck.pptx
5 INSPECT    validate, layout check, eye pass, tune, repeat
6 AUDIT      independent fact trace, deck -> ledger            -> audit.md
   HAND OVER deck + audit + ledger + assumptions
7 REVISE     brief stays master; hand-edit guard; go back a stage cleanly
```

### 0. Anchor — before you read anything

Ask three questions, in plain language, each with two or three example answers
from **unrelated domains** so the user sees the shape of a good answer without a
default to copy (`references/interview.md`):

1. What do you want to happen because of this deck?
2. Who is it for? Names, roles, what they already think.
3. What kind of deck, and roughly how big?

One or two sentences each; rough answers are fine. Record them in
`assets/frame.template.json` → `frame.json` under `anchor`. This is the
thirty-second hallway brief; without it the parse has no reference point.

### 1. Parse — act as a research analyst, not an extractor

```bash
python3 scripts/parse_sources.py <files or folder> -o sources.json
```

Then read the prose yourself and grade every finding against the anchor: core,
supporting, context, unrelated. Only core and supporting reach the storyboard.
Write `ledger.json` (`references/parsing.md` has the entry shape); cross-document
patterns go in as `derived` with every source they were drawn from.

```bash
python3 scripts/build_ledger.py ledger.json --sources sources.json --md ledger.md
```

The ledger is a deliverable and is what the audit traces against. **It is a
file, not a table in the chat**: `check_frame.py --sources` refuses the readback
while sources were parsed and `ledger.json` does not exist. The parse also
extracts embedded images with their sizes (Confluence "Export to Word" `.doc`
files are MIME and are read); a screenshot under 800 px is a thumbnail and goes
to the user as a gap, never on a slide and never redrawn as a mock-up. With no
documents, skip to stage 2; the interview and the gap questions carry the content.

### 2. Frame — nine questions, pre-filled

Fill the nine frame questions in `frame.json`: from the ledger where it supports
an answer (`origin: inferred`, cite the entry), your own draft where it cannot
(`origin: drafted`; the governing message usually), asked outright for the rest
(position, delivery mode, length). Then:

```bash
python3 scripts/check_frame.py frame.json --write --sources sources.json
```

It tests each answer, prints a probe with unrelated examples for any that fail,
and composes the **readback**. Batch the probes into one message. **Two answers
never default to nothing:** the outcome (q1) and the governing message (q2); if
the user skips both, propose each and get a yes.

**CP1.** Put the readback to the user: *is this the deck?* End it with one line
for the packaging: logo (file or URL), draft or final, classification, US or UK
spelling; all optional, all defaulted. The confirmed readback is the skip token:
a user who pastes it in a later session goes straight to the parse, after you
play back the three anchor lines and ask "still this?"

### 3. Argue — pyramid, coverage, gaps

Write `storyboard.json` from `assets/storyboard.template.json`
(`references/pyramid_method.md`, `references/architecture.md`). Every slide
names its `claim_kind` and the `pattern` chosen for it by
`references/selection_rule.md`. Every support point cites a ledger id.

```bash
python3 scripts/pyramid_check.py storyboard.json
python3 scripts/coverage_check.py frame.json ledger.json storyboard.json
```

Coverage prints **content gaps** (only the user can fill; else labelled
assumptions) and **external gaps** separately. External gaps get three options
each: look it up (only if the user says so and a search tool exists;
`references/sources.md`), the user supplies it, or the deck states the gap.
Batch the gap questions into one message. If the evidence points away from the
intended message, say so once, with the evidence, then build what they decide.

**CP2. The ghost deck.** This is the checkpoint to fight for.

```bash
python3 scripts/ghost_check.py storyboard.json
```

It enforces the selection rule, the repetition rule (no pattern over 40% of
content slides, none three in a row), label headlines, tier-mandatory slides,
and source lines; then prints the titles in order with the exhibit for each,
and under them the **claims stronger than the evidence** (headline words like
"enforce", "every", "eliminates", "in production"). Read the titles aloud: they
must tell the whole story without the bodies. Put the list to the user before
building, **as the script printed it**: pattern names from the library, not
descriptions like "screenshot" or "value callout", and the strong-claim list
underneath so each is approved knowingly or softened to what the ledger says.
For a single slide, this is one line: title plus exhibit.

### 4. Build

```bash
python3 scripts/to_deck_brief.py storyboard.json -o brief.json --frame frame.json --ledger ledger.json
node scripts/render_deck.js brief.json Deck.pptx
```

The converter refuses unclassified slides and data slides without a source; it
never seeds content, and it records each slide's `approved_pattern` and the
ledger and storyboard the deck comes from. The renderer owns every coordinate
and writes a provenance stamp into the file; `validate_deck.py` and the audit
refuse a deck without it, so **the .pptx is always rendered from a brief by
`render_deck.js`**, never by code you write for the occasion. `check_brief.js`
runs first and refuses: a pattern that differs from the approved one without
the user's recorded yes (the substitution rule: stop, explain, offer
alternatives, record the choice); an `illustrative` slide without
`meta.illustrativeApproved`; an `image` under 800 px; a section-break frame
with no section dividers; a `capability_overview` with no limits slide. It
prints the questions for anything missing; `--force` only after the user has
seen the gaps and said go. `npm install pptxgenjs` if the require fails; no
Node means stop and say so, never substitute another toolchain.

### 5. Inspect — three layers, one rule

```bash
python3 scripts/validate_deck.py Deck.pptx
python3 scripts/layout_check.py Deck.pptx --brief brief.json
python3 scripts/render_slides.py Deck.pptx        # contact sheets + single slides, ≤1600 px
```

Then **look at every slide image** against the checklist in
`references/visual_qa.md`: overflow, overlap, gaps, alignment, balance, where
the eye lands. Fixes go into the slide's `tune` block in the brief (or into the
content), never into the file. Re-render, look again. **Never hand over a deck
you have not looked at after the last change.**

**Never describe a slide you have not seen.** View each image once per render:
the sheets first, a single slide only to check a suspected problem. If an image
read fails or comes back without a picture, retry once at most, then stop and
tell the user the visual pass could not be done in this environment; hand over
with that stated, never with a verdict on slides you did not see. Re-requesting
the same image is a loop, not a check.

### 6. Audit — from the deck back to the ledger

```bash
python3 scripts/audit_facts.py Deck.pptx ledger.json --brief brief.json --report audit.md
```

Reads the finished `.pptx`, not the brief. Every figure is traced (stated,
derived and recomputed, external with four citation fields, or labelled
assumed on the slide) or it fails. Then the judgment half on a fresh read:
headline vs evidence per slide; titles as one argument; four beats present
(`references/audit.md`). Use a subagent with no memory of the build if one is
available. The deck is not handed over with a failing audit.

**Hand over:** `Deck.pptx`, `audit.md`, `ledger.md`, and a plain list of every
assumption, illustrative figure, and unconfirmed item.

### 7. Revise

The brief stays master: change it, re-render, re-inspect the changed slides,
re-audit. If the `.pptx` is newer than its stamp file (`Deck.pptx.stamp.json`), the user edited it
by hand: `render_deck.js` refuses and prints the two routes; put them to the
user. Going back a stage keeps what is still valid (`references/revisions.md`).

## Tiers

| tier | size | interview | storyboard | mandatory |
|---|---|---|---|---|
| single | 1 slide | anchor only; the claim is the title | none: one line, title + exhibit (usually from the one-slide family), yes/no | source line if data |
| short | 2–8 | anchor + frame minus length/sections/exec cut | title list in one message | |
| full | 9–25 | the full path | storyboard document; review optional | decision slide when a decision is named |
| long | 26+ or any sections | the full path | review required; each section its own pyramid | exec summary; agenda |

Set the tier from the anchor before asking anything else.

## The deck architecture: four beats, answer first

Every deck at every size: **answer**, then **proof** (two to four key lines,
MECE, evidence under each), then **decision** (what is needed from whom by
when), then **risk** (what could make it wrong, with owner and mitigation). The
story of how you got there is backup, not spine. The beats are fractal: a single
slide has them in headline, body, band and caveat; a full deck has them as the
executive summary and again in the body. Genre governs framing, not beats: a
status readout with a manufactured complication is worse than no framing.
`references/architecture.md`.

## Voice

Every headline is a finding someone could disagree with. Numbers over
adjectives, with unit, period and source. Caveats once, in the subtitle.
Recommendations in the imperative. Confidence from evidence, not emphasis.
Three dials from the interview: audience seniority/technicality, genre,
presenter's position. US spelling and dates by default (`meta.locale`); metric
figures quoted as given with US units alongside; currency never converted.
`references/voice.md`.

## The house style (v2)

The style is code in `assets/deck_style_kit.js`; the brief never carries a
colour or a font. What you need to know to write a good brief:

- **Two surfaces.** The off-white page with a teal rule is the working surface.
  Navy (amber rule) is for emphasis: `statement`, `cards` with `dark: true`,
  dividers and the title. One navy content slide in five at most.
- **Eyebrow and headline.** The eyebrow is the label (two to four words; the
  renderer sets the capitals). The headline is the finding, a sentence in
  sentence case, set in Georgia. Aim for two lines at most.
- **Amber is the one highlight** on a slide, and on most slides there is none.
  Put it on what the headline is about, often the miss rather than the win.
- **Status colours are the standard set** (green, amber, red, grey for not
  started) and every status chip carries its word.
- **Bands.** `band` is the implication, not a restatement: a string (statement
  style), or `{text, style: "takeaway" | "bottom_line", label}`. Use
  `bottom_line` where the argument turns, once or twice a deck.
- **Icons.** 112 named icons (`references/icons.md`) for card heads, KPI tiles,
  drivers, the title rail and status rows. Pick by the idea; one icon, one idea
  per slide; vary them across the deck. The gate enforces the first two.
- **Title and dividers.** The title takes up to three `figures` in its side rail
  (audited like any figure). Dividers number themselves and draw progress marks;
  give each `section` a short `label` and a `keyLine`.
- **Relationships.** How systems, teams or concepts connect around a centre
  is `ecosystem`: a hub, up to four labelled groups, arrows for which way
  information moves, dashed nodes for what is planned.
- **One-slide family.** For a single-slide request, pick by the message:
  `one_decision` (get a yes), `one_number` (one figure carries it),
  `one_status` (the status call and the one red), `one_shift` (before and after),
  `one_story` (situation, complication, resolution). Each carries the ask and
  the risk at its foot. In a longer deck they are impact slides: one per
  section at most (`references/selection_rule.md`).

Before the first image render in a sandbox, run `python3 scripts/setup_fonts.py`
so the render breaks lines the way PowerPoint will.

## Never ask

Colours, fonts, layout, slide count within a tier, which exhibit to use, whether
to add a title slide. The style and the selection rule own those. Never ask
what the conversation, a pasted frame, or the sources already answer.

## Non-negotiables

- **Never invent a fact.** Stated, derived, external, or labelled assumed.
  Illustrative values only with the user's recorded yes, and never an invented
  entity: no platform, product, site or team that is not in the ledger.
- **Never swap an approved exhibit silently.** If it cannot be built, say so
  and offer alternatives before rendering.
- **Never draw a mock-up in place of a screenshot.** A thumbnail is a gap to
  put to the user, not a picture to redraw.
- **The deck is rendered by `render_deck.js` from a brief.** A hand-built
  .pptx has no stamp, fails the validator, and is not a deliverable.
- **Never soften a red.** A red with an owner reads as control.
- **Never hand over a deck you have not looked at after the last change.**
- **Never re-render over a hand-edited file** without the user's choice.
- **Never search without the user's go**, and only for facts external to the client.
- **Never rezip a written .pptx** by hand; the only post-write edit is
  `scripts/postfix_pptx.py`, which the renderer runs itself.
- **Charts and diagrams stay native.** Never an image of a chart, and never a
  diagram drawn in another tool and pasted in. "X in the middle with lines to
  everything it touches" is `ecosystem`; layers are `panels` or `tiers`. The
  `image` pattern is for real screenshots and photographs only (`imageKind`).
- **One highlight per slide.** Amber marks the one thing the eye should land on.
- **Colour is never the only signal.**
- **No real names in the skill** except First Chair Consulting, in the credit
  line and the file metadata; `meta.credit: false` turns it off.
- pptxgenjs rules from real corruption: `LAYOUT_WIDE` before any slide; hex
  colours six bare digits; axis-aligned arrows only; shadow offset ≥ 0; never
  share an options object between two `add*` calls (`references/troubleshooting.md`).

## Files

| file | what it is |
|---|---|
| `assets/deck_style_kit.js` | tokens, primitives, text measurement. **The style. Do not edit.** |
| `assets/deck_patterns.js` | composed exhibits, content-sized |
| `assets/deck_renderer.js` | brief → deck; 46 patterns; `tune` blocks; logo, markings, credit |
| `assets/font_metrics.json` | Georgia and Calibri advance widths, shared with `layout_check.py` (generated, do not edit) |
| `assets/icons/` | `icons.json` (112 icon names and the concepts each expresses: read this one), `icon_images.json` (the images, packed; never read it), Lucide ISC licence |
| `assets/fonts/` | Gelasio (Georgia-compatible, SIL OFL) for the visual-QA render only |
| `assets/frame.template.json` · `storyboard.template.json` · `brief.template.json` | the three documents you fill, empty |
| `scripts/parse_sources.py` · `build_ledger.py` | stage 1 |
| `scripts/check_frame.py` | stage 2 gate + readback |
| `scripts/pyramid_check.py` · `coverage_check.py` · `ghost_check.py` | stage 3 gates |
| `scripts/to_deck_brief.py` · `check_brief.js` · `render_deck.js` · `postfix_pptx.py` | stage 4 |
| `scripts/validate_deck.py` · `layout_check.py` · `setup_fonts.py` · `render_slides.py` | stage 5 |
| `scripts/audit_facts.py` | stage 6 |
| `scripts/render_storyboard.py` | storyboard.json → readable storyboard.md for CP2 review |
| `scripts/preflight.py` | package check before publishing |
| `references/interview.md` | how to interview; the questions, their intent, tests, examples, probes |
| `references/parsing.md` | grading, coverage, synthesis, the ledger |
| `references/architecture.md` | the four beats, per tier |
| `references/pyramid_method.md` | governing thought, key lines, MECE, SCQA |
| `references/selection_rule.md` | claim kind → exhibit |
| `references/patterns.md` | field reference for all 46 patterns, generated from the catalogue |
| `references/icons.md` | the icon vocabulary by group, and how to choose |
| `references/voice.md` · `sources.md` · `visual_qa.md` · `audit.md` · `revisions.md` · `troubleshooting.md` | depth for the stage named |
| `examples/` | a fictional engagement end to end: sources, frame, ledger, storyboard, brief, deck, audit; plus the pattern catalogue |
| `AGENT_PROMPT.md` | operating prompt for an agent given this skill |
