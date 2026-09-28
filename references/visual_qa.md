# Visual QA

Each slide has to be balanced, aligned and pleasing to the eye, because a slide
that is not obscures its own message. The old process told the agent to look
and the user still fixed slides by hand. So there are three layers, and the
third has one non-negotiable rule: **never hand over a deck you have not looked
at after the last change.** A fix applied and not re-rendered is unchecked.

## Layer 1: the renderer sizes to content

Cards, rows, panels and trees measure their text (Georgia and Calibri metrics
from `assets/font_metrics.json`, with 10% slack for the LibreOffice-vs-PowerPoint
difference) and size themselves to it, then align siblings to the tallest.
`layout_check.py` measures with the same table, per run font, so the renderer
and the checker agree on what fits. Headlines break to two balanced lines and step
down in size rather than run to three. Most of what used to be fixed by hand
never happens. When it does, the fix goes in the brief, never in the file.

## Layer 2: the mechanical check

```bash
python3 scripts/validate_deck.py Deck.pptx                 # file integrity, canvas, palette, footers
python3 scripts/layout_check.py Deck.pptx --brief brief.json
```

`layout_check.py` fails on estimated text overflow and on overlapping text
boxes; it warns on near-aligned siblings, three-line headlines, an empty band
over a quarter of the content area, content reaching the footer band, and a
data slide with no source line. Every warning is resolved or dismissed in the
eye pass, with a reason.

## Layer 3: the eye pass

Render every slide to an image and look at each one:

```bash
python3 scripts/setup_fonts.py            # once per sandbox
python3 scripts/render_slides.py Deck.pptx
```

It writes four-up contact sheets (`sheet-NN.jpg`) and single slides
(`slide-NN.jpg`), every image capped at 1600 px, into `Deck_qa/`, deleting the
previous render first so you never judge a stale image. Do not render at higher
resolution: image readers commonly reject images over 2000 px once a
conversation holds more than twenty, and the failure can be silent.

**How to look.** Each sheet once, per render. Open a single slide only to
check something the sheet suggests. Write down what you see on each slide
before moving to the next; do not re-open an image to "confirm" what you
already wrote.

**If you cannot see an image, say so.** When an image read fails or returns
text instead of a picture, retry once, then stop. Tell the user the eye pass
could not be done here, report what the mechanical checks found, and hand over
with the gap stated. Never write a verdict ("clean", "excellent", "confirmed
good") about a slide you have not seen: that is an invented fact about the
deliverable, and it is how a broken slide reaches a board.

Look for these, in this order, because the first ones hide the later ones:

1. **Overflow.** Text touching or crossing the edge of its box or card.
2. **Overlap.** Anything drawn over anything else that is not meant to be.
3. **Uneven gaps.** Cards in a row with different gaps; a band too close to or
   too far from the content above it.
4. **Alignment across columns.** Kickers, titles and bodies in sibling cards
   starting at the same height.
5. **Balance.** Does the content sit in the slide, or hang at the top with an
   empty lower third? Is the right side as full as the left?
6. **The eye.** Does it land where the argument wants it: the one highlighted
   element, then the headline, then the band? If two things compete, one loses
   its highlight.
7. **Reading.** Is every label legible at this size? Is the source line
   present and not fighting the footer?

After staring at the code you see what you intended, not what rendered. Look at
the image, not the memory of it.

## Fixing: the `tune` block

Every slide accepts a `tune` object. It is the sanctioned adjustment; write the
fix there, re-render, look again. Keys:

| key | what it moves | typical use |
|---|---|---|
| `contentY` | where content starts (default 2.4") | pull content up under a one-line headline with no subtitle |
| `headlineSize` | headline point size (24–42) | a long headline that wants three lines |
| `minH`, `maxH` | card/exhibit height bounds | lift short cards so the slide fills; cap tall ones |
| `cardTitleSize` | card title size | four cards with long titles |
| `fontSize` | table and risks body size | a dense table |
| `labelW` | left label column width (scorecard, heatmap, gantt, roadmap) | long row labels |
| `rowH` | scorecard row height | many rows |
| `chartHeight` | chart or waterfall height | make room for a band |
| `bandGap` | extra gap above the thesis band | separate band from content |

```json
{ "pattern": "cards", "headline": "…", "cards": [ … ],
  "tune": { "contentY": 2.2, "minH": 2.4, "cardTitleSize": 15 } }
```

Content changes are the other fix: cut words, split a slide, shorten a label.
Prefer cutting words to shrinking type; never drop body below 10pt or captions
below 9pt.

## What LibreOffice cannot tell you

Run `python3 scripts/setup_fonts.py` once per sandbox before the first render.
It installs Gelasio (shipped in `assets/fonts/`) and aliases Georgia to it and
Calibri to Carlito; both are metrically compatible, so line breaks in the
render are trustworthy. Without it LibreOffice substitutes other faces and the
line breaks you judge are not the ones PowerPoint will show. Glyph shapes
differ slightly. Judge fit from the render; judge final appearance in
PowerPoint. The 10% slack in the renderer covers every case seen so far, not
provably every case, so a deck headed for a boardroom gets opened in PowerPoint
once before it goes.
