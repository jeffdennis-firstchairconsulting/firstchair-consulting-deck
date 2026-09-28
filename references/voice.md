# Voice

Every deck reads as if a management consultant wrote it, whoever ran the skill.
The register is fixed. Three dials adapt it. No consultancy is named anywhere
in this skill, and none of the sample library's framework names are used.

## The register

- **Every headline is a finding.** A sentence with a verb and a period that
  someone could disagree with. Never a topic label ("Current state"), never a
  question. Test: can the reader argue with it? If not, rewrite.
- **Numbers over adjectives.** "Costs rose 18% in FY25," not "costs rose
  sharply." A number always carries its unit, its period and its source.
- **Active voice, short sentences, parallel structure.** Cards in a row and
  bullets in a list share one grammatical form. Body text is 12.5–14pt (never
  below 11); if it does not fit at that size, the slide has two ideas and should be split.
  Never shrink type to fit.
- **Caveats stated plainly, once, in the subtitle.** "Illustrative — effort per
  phase, not a quote." Not hedged into every sentence. The caveat is written on
  the slide before the room says it.
- **Recommendations in the imperative.** "Approve phase 2." "Assign a site
  owner." Not "it might be worth considering."
- **The "so what" is explicit.** The thesis band draws the implication of the
  headline; it never restates it. If the band only repeats the headline, the
  slide has one idea too few: cut the band or sharpen it.
- **Confidence comes from the evidence shown, not from emphatic language.** No
  "clearly," "obviously," "significant" without a number, no exclamation marks,
  nothing decorative in the prose. Nothing decorative in the layout either.
- **The eyebrow is the label; the headline is the finding.** Two to four words
  on the eyebrow (the renderer sets it in capitals); the headline is a sentence
  in sentence case, never title case. **The eyebrow names the move**, not the topic: "THE PATTERN," "WHY IT'S
  UNSOLVED," "THE PROOF," "THE ASK." "Background" tells the reader nothing.
- **Speaker notes are the candid channel.** What the slide says
  diplomatically, the notes say plainly, with what to confirm before presenting
  and which figures are assumed.
- **RAG honestly.** Green is done, amber is in flight, red needs a decision.
  Never soften a red. A red with a named owner reads as control; without one it
  reads as a problem. Out-of-scope items are greyed, never red.

## The three dials, set by the interview

| dial | set by | what it changes |
|---|---|---|
| seniority and technicality | frame q4 | level of detail; vocabulary; whether products and versions are named; how much of the number is shown |
| genre | frame q8 | whether the register persuades or reports; whether SCQA framing is used; whether a decision slide exists |
| presenter's position | frame q5 | "we recommend" (vendor), "we found" (expert), "we need" (team member) |

Nothing else moves. Read-versus-presented (q6) changes density, not voice: a
deck sent ahead carries full lead-ins and self-explanatory charts; a deck
talked over is sparser.

## Language that travels

Decks get read by engineers, delivery leads and executives. Keep the technical
substance and change the frame, not the depth: name the real product where an
engineer expects it, then say what it does in one clause a non-engineer can
follow. Prefer the phrase that carries upward ("executive dashboard" travels;
"name and shame" does not).

## Locale

`meta.locale` sets spelling, date format and currency formatting. Default
`en-US`; `en-GB` supported. Never mix the two in one deck.

| | en-US | en-GB |
|---|---|---|
| spelling | utilization, program, color, organization | utilisation, programme, colour, organisation |
| dates | Oct 15, 2026 · 10/15/2026 | 15 Oct 2026 · 15/10/2026 |
| currency | $4.1M · $2,140 | £4.1m · £2,140 |
| large numbers | 1,180 · $4.1M · 2.6B | 1,180 · £4.1m · 2.6bn |

**Units for a US audience.** Where a source gives a metric figure, quote the
source's figure as given and add the US-customary equivalent alongside, every
time: "41 km (25 miles)". The conversion is a derived ledger entry with its
arithmetic, so the audit can check it. Currency is never converted; it is a
fact, not a unit.

## Number conventions

Checked by `audit_facts.py` where a script can; the rest is yours.

- One unit per axis, column or card, stated in the header or the subtitle, not
  on every number.
- Consistent rounding within a slide: never "1,180" beside "1.2k"; never "2.3"
  beside "1.60".
- Currency and period stated once per slide ("$M, FY25 run-rate").
- Fiscal periods labelled as such, with calendar months on first use ("FY25
  (Jul 24–Jun 25)").
- Percentages name their base ("34% of dock hours"), not just "34%".
- A figure that appears on two slides is formatted identically both times.
- Derived figures show their arithmetic in the notes and in the ledger.
- Illustrative figures say so on the slide (subtitle), not only in the notes.
- Thousands separators from 1,000 up; no separators in years.
