# Troubleshooting

Failures seen while building real decks in this style, and the fix for each.
Every one of these is fixed **in the generator script** and the deck rebuilt —
never by hand-editing the packed XML.

## "PowerPoint can't open this file" / repair prompt

In order of likelihood:

1. **Something rezipped the deck.** Write with `writeFile()` and stop. Do not
   unzip and re-zip a pptxgenjs deck.
2. **A `#` or an alpha channel in a hex color.** `"#1E3A5F"` and `"1E3A5F80"`
   both corrupt the file. Colors are six bare hex digits. For translucency use
   `transparency: 0-100` on fills, `opacity: 0.0-1.0` on shadows — each is
   silently ignored on the other.
3. **A negative shadow `offset`.** Use `angle:270` with a positive offset for an
   upward shadow.
4. **A diagonal connector.** `arrow()` forces `h:0`; keep it that way.
5. **A chart with `secondaryValAxis`/`secondaryCatAxis` but no `valAxes` *and*
   `catAxes` arrays** (two entries each). pptxgenjs writes axis ids it never
   declares and PowerPoint discards the chart, reporting the file as corrupt.
6. **`dataLabelPosition:"outEnd"` on a stacked bar or column.** Use `ctr`,
   `inEnd`, or `inBase` there. `outEnd` is fine on unstacked charts.
7. **Reordered children of `<p:presentation>`.** Don't touch them.

`unzip -t deck.pptx` and `python3 scripts/validate_deck.py deck.pptx` between
every build catches most of this before anyone opens the file.

## Shapes are missing from the rendered slide

`pres.layout = "LAYOUT_WIDE"` was set after slides were added, or not at all.
The default canvas is 10 x 5.625 in; coordinates past that edge are written to
the file, not clamped, so the shape exists but sits off the slide.
`validate_deck.py` reports these as off-canvas.

## The same shadow appears on the wrong shape, or options bleed between slides

pptxgenjs **mutates option objects in place** (it converts values to EMU on
first use). Never share one `shadow` or options object across two `add*` calls.
The kit's `softShadow()` and the patterns file's `shadow()` are factories that
return a fresh object every call — use those, not a module-level constant.

## Text doesn't line up with the shape next to it

Text boxes have built-in internal padding. Set `margin: 0` on any text box that
must align with a shape, line, or dot at the same `x`. Every helper in the kit
already does this; hand-placed text often doesn't.

## Double bullets, or bullets with huge gaps

Use `bullet: true` on each item — never a literal `•` character, which renders a
second bullet. Set `breakLine: true` on every array item except the last. Space
bulleted paragraphs with `paraSpaceAfter`, not `lineSpacing`.

## `charSpacing` has no effect

The option is `charSpacing`, not `letterSpacing` — the latter is silently
ignored. The eyebrow and section labels depend on it.

## Text overflows its card

The validator does not catch this; only rendering does. Fixes, in order of
preference: cut words, split the slide, enlarge the card. Do not drop body text
below 10pt or captions below 9pt. Leave ~10% slack rather than fitting exactly
to the preview; the renderer's measurement already does.

## The render looks right but the fonts are wrong

The style is Georgia and Calibri; Linux has neither. Run
`python3 scripts/setup_fonts.py`: it installs Gelasio from `assets/fonts/` and
aliases Georgia→Gelasio and Calibri→Carlito. Both are metrically compatible, so
line breaks are trustworthy; glyph shapes differ slightly from PowerPoint. If
it reports Carlito missing, install `fonts-crosextra-carlito` or copy
`Carlito-*.ttf` into `~/.fonts`. Headlines that render in a sans serif mean the
alias is not in place.

## Regenerating the font metrics

`assets/font_metrics.json` holds advance widths (fraction of the em) for
Calibri (regular, bold, italic) and Georgia (regular, bold), taken from Carlito
and Gelasio. Regenerate only if the style's faces change: with fontTools, read
`hmtx` for each character in the existing table from each face (instantiate
Gelasio's variable font at wght 400 and 700 first), divide by `unitsPerEm`, and
write the same `{"faces": {...}}` shape. The renderer and `layout_check.py` both
read it; change one face, re-render the catalogue, and look.

## Rendering for visual QA

```bash
python3 scripts/setup_fonts.py                      # once per sandbox: Georgia/Calibri substitutes
python3 scripts/render_slides.py MyDeck.pptx        # sheets + singles, capped at 1600 px
```

Look at every slide. After staring at the generating code you tend to see what
you intended rather than what rendered — check overflow first, then overlap,
then uneven gaps, then footer collisions, then alignment across columns.

## `require('pptxgenjs')` fails

`npm install pptxgenjs` in the working directory. Nothing else in this skill has
a runtime dependency; `validate_deck.py` needs `python-pptx`.

## The waterfall shows a "base" series or stray labels

The waterfall is a native stacked column with an invisible base series.
`render_deck.js` runs `scripts/postfix_pptx.py` after writing, which strips the
labels from any series named `base`. If labels reappear, that step did not run:
check Python is on the path and `scripts/postfix_pptx.py` is present. Opening the
chart data in PowerPoint will always show the base series; that is expected.

## render_deck.js exits 2 and refuses to build

The deck on disk is newer than its `.stamp.json`: someone edited it by hand.
Put the two routes in `references/revisions.md` to the user. Do not use
`--overwrite` without their choice.

## validate_deck.py says "no render stamp"

The file was not written by `scripts/render_deck.js`. Hand-rolled pptxgenjs
code, however good it looks, is not a deliverable of this skill: it carries no
provenance, no notes, no credit, and the audit cannot trust it. Put the content
in a brief and render it.

## check_brief.js says the pattern changed from the approved one

You changed an exhibit after the user approved the ghost deck. Go back to
them: say what could not be built and why, offer alternatives, and record
their answer in the slide's `substitution` block. See the substitution rule in
`references/selection_rule.md`.

## check_brief.js or ghost_check.py refuses an image as a thumbnail

The capture is under 800 px wide. Ask the user for a full-size screenshot.
If they accept the quality anyway, set `tune.minWidth` on that slide, and say
in the notes that the image is low-resolution.

## audit_facts.py fails on a figure you know is right

Then it is right but untraced. Add a ledger entry with its anchor (stated), its
arithmetic (derived), its four citation fields (external), or label it on the
slide as assumed/illustrative. Never relax the audit to make a deck pass.

## layout_check.py reports OVERFLOW on text that looks fine in the render

The checker measures with the Georgia/Calibri metric table plus 10% slack;
PowerPoint is slightly tighter. If the render clearly fits, dismiss the warning in the eye
pass with a note. If it is a FAIL and the render is borderline, cut words.

## check_brief.js exits 3 with "RUNTIME"

The brief was never read: the renderer could not load (usually pptxgenjs is not
installed). Run `npm install pptxgenjs` in the skill folder or the working
folder. Exit 3 is a missing dependency, never an incomplete brief; do not ask
the user brief questions about it.

## "unknown icon" or "icon used twice on one slide"

Icon names come from `assets/icons/icons.json` (`references/icons.md`); the
gate suggests near names. Two uses on one slide say two things are the same
thing: pick a neighbour from the same group. An icon on more than two slides is
a warning, not a blocker; vary it unless the recurrence is the point.

## The agent keeps re-reading the same slide image

Symptom: the same image is requested again and again, each time followed by a
fresh review, or a review follows a "failed to read" message. The image is not
reaching the model: it is over the reader's size limit (commonly 2000 px once
more than twenty images are in the conversation), the read tool returns text
only, or the file is missing. Render with `scripts/render_slides.py` (1600 px
cap, fewer images via contact sheets). If the images still do not come back as
pictures, the environment cannot do the eye pass: stop after one retry, say so,
and hand over with the gap stated. Any review written about an image that was
not seen must be withdrawn.

## "imageKind ... is not allowed" or an image slide blocked for imageKind

The image pattern holds real screenshots and photographs, and the brief must
say which (`"imageKind": "screenshot"` or `"photo"`). A diagram, chart or map
drawn elsewhere and pasted in is refused: rebuild it natively (`ecosystem` for
how things connect, `panels`/`tiers` for layers, `chart` for data).

## An ecosystem slide looks cramped

The pattern tries roomy cards, then compact one-line cards, then two across. If
it is still tight: drop the band (the headline carries the point), shorten the
`role` lines to three or four words, move the hub's own parts into `hub.chips`,
or merge groups. More than fourteen nodes is two slides.
