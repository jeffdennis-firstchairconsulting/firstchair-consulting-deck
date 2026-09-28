# Parsing the sources

During the parse you are a research analyst, not an extractor. The job is to
bring back everything the deck needs, nothing it doesn't, and the patterns that
only appear when the documents are read together. The anchor is your filter:
without it every finding looks relevant.

## Inputs: zero, one, or many

`.docx .pptx .xlsx .csv .pdf .md .txt`, transcripts, in any mix. Run
`scripts/parse_sources.py <files or folders> -o sources.json` first. It
inventories what arrived, extracts figures with citation anchors
(`report.docx ¶14`, `model.xlsx!Summary!B7`, `findings.pdf p.3`,
`deck.pptx s6`), and reports any file it could not open. It is not a
comprehension engine: you read the prose yourself.

- **No documents:** skip the parse. The interview and the stage 3 gap questions
  carry the content; the ledger still exists and every entry is `assumed` or
  `external` until the user confirms it.
- **One document:** build the ledger anyway. Grading and the coverage check
  still apply.
- **Many:** read them all before grading anything, because the cross-document
  patterns are the point.

## Relevance is graded, not binary

Every finding gets one of four grades, against the anchor, and the grade
travels with it:

| Grade | Meaning | Where it goes |
|---|---|---|
| `core` | Directly supports or contradicts the intended outcome | Storyboard, as evidence |
| `supporting` | Qualifies or contextualises a core finding | Storyboard, as evidence or as a subtitle caveat |
| `context` | About the subject, not needed for the argument | Ledger only; there if a question comes up |
| `unrelated` | Not about this deck | Listed once at the end of `ledger.md` so the user can pull anything back |

A finding that **contradicts** the intended outcome is `core`, not something to
drop. Surface it at the gap checkpoint with the evidence shown; challenge the
frame once; then defer to the user's call and mark it in the notes.

## Coverage runs both ways

Not pulling in noise is half the job. The other half is noticing what the
frame needs that no document supplied. `scripts/coverage_check.py frame.json
ledger.json [storyboard.json]` compares the decision, each key line, the risks
and every must-include against the ledger, and prints two lists to put to the
user separately:

- **Content gaps:** facts about the client's own situation. Only the user can
  supply these, or they become labelled assumptions.
- **External gaps:** facts external to the client (a market size, a regulation,
  a benchmark). Three options each: look it up (only if the user says so and a
  search tool exists), the user supplies it, or the deck states the gap. See
  `references/sources.md`.

## Synthesis is allowed and always marked

The most valuable finding in a pile is often not in any one document: three
sets of minutes that each mention the same delay from different angles; a
figure in the spreadsheet that does not match the one in the report; a
decision that was taken in one meeting and quietly reversed in another. Record
these as `derived` entries with **every** source they were drawn from and the
reasoning or arithmetic in `arithmetic`, so they can never be mistaken for
something a document said.

## The evidence ledger

The parse produces `ledger.json`, validated and rendered to `ledger.md` by
`scripts/build_ledger.py ledger.json --sources sources.json`. It is organised
by what each entry serves (a key line, a frame question, the decision, a risk)
rather than by document, the way good minutes are organised by agenda item
rather than by speaker.

Each entry:

```json
{ "id": "E12", "finding": "1,180 devices live but unrecorded", "value": "1,180",
  "grade": "core", "origin": "stated", "sources": ["scan_results.xlsx!Summary!B4"],
  "serves": ["KL1"], "arithmetic": "", "assumption": "",
  "publisher": "", "title": "", "date": "", "url": "", "notes": "" }
```

`origin` is one of four, and the validator enforces what each needs:

| Origin | Must carry |
|---|---|
| `stated` | at least one anchor that exists in `sources.json` |
| `derived` | its source anchors and the `arithmetic` or reasoning |
| `external` | publisher, title, date, url (all four) |
| `assumed` | `assumption`: what would change if it is wrong |

The ledger is a deliverable. The audit traces every fact on every slide back to
it, and it is what the user hands to whoever asks "where did that number come
from?"

## Screenshots and embedded images

`parse_sources.py` extracts every embedded image (docx, pptx, and MIME/MHTML
exports such as Confluence "Export to Word", which arrive as `.doc`) beside
`sources.json` with its pixel size, and marks each `usable` only at 800 px wide
and 300 px tall or more. A Confluence page export carries 350-450 px
thumbnails; they look like screenshots in the runbook and read as smears on a
slide. When the parse reports thumbnails and the frame calls for screens, the
gap goes to the user at the stage-3 checkpoint: "the sources contain N
screenshots at thumbnail size; can you capture them at full resolution?"
Never draw a mock-up in place of a screenshot.

## Illustrative data

A slide may carry representative rather than measured values only when the
user has agreed to it, recorded as `meta.illustrative_approved: true` in the
storyboard. Even then the slide may invent *values*, never *entities*: every
platform, product, site, team or person named on an illustrative slide must
exist in the ledger, and the audit fails the slide otherwise. On a deck about
a real system, prefer no figure to an invented one; "the dashboard shows
overall compliance, devices assessed, and failed checks" is a true sentence,
"84% compliance across 1,247 devices" is a claim the room will repeat.

## Numbers

Record the figure exactly as the source gives it, with its unit and period.
Conversions (metric to imperial for a US audience, currency never) are separate
`derived` entries that cite the original and show the arithmetic, so the audit
can recompute them.

## Confidentiality of the sources

The ledger summarises and cites; it never copies source text at length.
Anything the user marks as background-only is graded `context` regardless of
relevance and never reaches a slide. Nothing from the sources is written into
the skill's own files, ever.
