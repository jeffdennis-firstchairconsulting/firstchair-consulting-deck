# firstchair-consulting-deck

An **agent skill** that builds consultant-grade PowerPoint decks the way an
analyst does: interview for the frame, read the material into an evidence
ledger, storyboard the argument, render an editable `.pptx` from a library of
46 exhibit patterns in a fixed house style, inspect every slide, then audit
every figure back to its source before handing over.

It replaces the earlier `deck-storyboard` + `house-deck-style` pair with one
skill and one path. Built by First Chair Consulting.

## What it does that a plain "make me slides" prompt does not

- **Asks before it reads.** Three anchor questions, then a graded parse of your
  documents against them, then nine frame questions pre-filled from what it
  found, then a readback you confirm. Every question shows example answers from
  unrelated domains so you see the shape of a good answer without a default.
- **Chooses the exhibit from the claim.** A comparison gets a scorecard, a
  decomposition a tree, a total a waterfall. A repetition rule stops the deck
  becoming the same slide over and over.
- **Answer first, every time.** Answer, proof, decision, risk, at every size
  from one slide to a sectioned board pack.
- **Looks at its own output.** A renderer that sizes shapes to their text, a
  mechanical layout checker, then an eye pass over rendered images with a
  sanctioned `tune` block for fixes.
- **Audits itself.** Reads the finished deck and traces every money figure,
  percentage, count and date to a ledger entry with a citation, arithmetic,
  four-field external source, or an on-slide assumption label. Two invented
  figures in a test copy were caught; the report ships with the deck.

## The house style (v2.0)

Georgia headlines and Calibri body on a warm off-white page with a teal rule;
navy for emphasis; amber as the one highlight per slide; the standard red,
amber and green for status, always with a word. 112 named icons. A split title
slide with an optional figure rail, numbered section dividers with progress
marks, three band styles, a native ecosystem map for how things connect, and a one-slide family (`one_decision`, `one_number`,
`one_status`, `one_shift`, `one_story`) for single-slide asks and impact slides.
`examples/Pattern_Catalogue.pdf` shows every pattern.

v2.0 replaces the v1 style entirely. Briefs written for v1 still render (field
names are unchanged); they pick up the new look.

## Repo layout

```
SKILL.md              the skill: the path, checkpoints, non-negotiables
README.md             this file
AGENT_PROMPT.md       operating prompt for an agent given this skill
assets/               the style (kit, patterns, renderer, font metrics), icons, QA fonts, the three templates
references/           depth per stage: interview, parsing, architecture, pyramid, selection rule,
                      patterns, voice, sources, visual QA, audit, revisions, troubleshooting
scripts/              every gate and build step; preflight for publishing
examples/             a fictional engagement end to end, and the pattern catalogue
```

## Try it

```bash
npm install pptxgenjs
pip install python-pptx python-docx openpyxl pdfplumber pillow PyYAML

# the pattern catalogue: every exhibit once
python3 scripts/setup_fonts.py        # once: Georgia/Calibri substitutes for the image render
node scripts/render_deck.js examples/catalogue.brief.json Catalogue.pptx

# the worked example, stage by stage (see examples/walkthrough.md)
python3 scripts/parse_sources.py examples/sources -o sources.json
python3 scripts/build_ledger.py examples/ledger.example.json --sources sources.json --md ledger.md
python3 scripts/check_frame.py examples/frame.example.json --sources sources.json --ledger examples/ledger.example.json
python3 scripts/pyramid_check.py examples/storyboard.example.json
python3 scripts/ghost_check.py examples/storyboard.example.json
python3 scripts/to_deck_brief.py examples/storyboard.example.json -o brief.json --frame examples/frame.example.json --ledger examples/ledger.example.json
node scripts/render_deck.js brief.json Example.pptx
python3 scripts/validate_deck.py Example.pptx && python3 scripts/layout_check.py Example.pptx --brief brief.json
python3 scripts/audit_facts.py Example.pptx examples/ledger.example.json --brief brief.json
```

LibreOffice (`soffice`) and `pdftoppm` are needed for the visual pass
(`scripts/render_slides.py` drives both). Without
Node the skill stops and says so; it does not substitute another toolchain.

## Importing

`SKILL.md` sits at the repository root. If your platform wants the nested form,
move everything into `skills/firstchair-consulting-deck/`; every path inside
the skill is relative and holds either way. Run `python3 scripts/preflight.py`
before publishing: it strict-parses the frontmatter and checks the things that
have broken imports before.

## The credit line

Every deck's closing slide carries a discreet footer credit, "Built with the
consulting-deck skill · First Chair Consulting," and the company name in the
file metadata. Set `meta.credit: false` in the brief to turn both off. That is
the only real name anywhere in this repository; every customer, programme and
figure in the examples is fictional.

Third-party assets: icons from Lucide (ISC, `assets/icons/LICENSE.txt`); the
Gelasio font (SIL OFL, `assets/fonts/OFL.txt`), used only for the visual-QA
render. Decks themselves specify Georgia and Calibri and embed no fonts.

## What to change and what not to

`assets/deck_style_kit.js` is the style. Its tokens and helpers stay as they
are, so every deck from every session lands in the same place. If a slide
genuinely fits no pattern, compose it from kit primitives in a one-off script;
if you need the same shape twice, add it to `deck_patterns.js` and
`deck_renderer.js`, add a slide to `examples/catalogue.brief.json`, and
regenerate `references/patterns.md` from it. That is how the library grows
without drifting.
