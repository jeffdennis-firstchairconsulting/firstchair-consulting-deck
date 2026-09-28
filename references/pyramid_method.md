# The method

Minto's Pyramid Principle, as it applies to building a deck. The short version:
**the audience has a question, the deck answers it, and everything in the deck
exists to support that answer.** If a slide doesn't support the answer, it isn't
in the deck — it's in the appendix or it's gone.

## The three rules

Every grouping in the pyramid obeys all three. Most broken decks break one.

1. **Ideas at any level summarize the ideas below them.** A key line is not a
   heading over its support; it is the conclusion the support forces. If you can
   read the support and not arrive at the key line, the key line is wrong.
2. **Ideas in a grouping are the same kind of idea.** All reasons, or all steps,
   or all components — never a mix. "We should do this because it's cheaper,
   because the platform is proven, and first we'd run a pilot" mixes reasons with
   steps, and the audience feels the wobble even if they can't name it.
3. **Ideas in a grouping are logically ordered.** Time order for steps,
   structural order for parts of a whole, degree order — most important first —
   for reasons. Arbitrary order reads as an unsorted list.

## Finding the governing thought

Work bottom-up from the material, not top-down from an opinion.

1. List what the sources actually say. Facts, figures, findings — each with a
   citation anchor.
2. Group them by what they have in common. Not by which document they came from.
3. Summarize each group in a sentence that states the *implication*, not the
   contents. "Four systems disagree about device counts" — not "Data quality."
4. Ask: what do these summaries, taken together, force me to conclude? That's
   your candidate governing thought.
5. Test it: **can someone in the room disagree with it?** If not, it's a topic,
   not a thought. "Network inventory" is a topic. "The inventory can't be
   automated against until ownership is resolved" is a thought.

Then test whether it answers *the audience's* question rather than a question
you find more interesting. The infrastructure director asking "why is this
late?" is not asking "what is a source of truth?"

## Key lines

Two to five. Each a full sentence. All answering exactly one question that the
governing thought provokes:

| Governing thought | The question it provokes | Key lines answer |
|---|---|---|
| "You should consolidate onto one record." | *Why?* | reasons |
| "Consolidating takes three phases." | *How?* | steps |
| "One of three options fits." | *Which?* | options |

Mixing those is the most common structural failure. `pyramid_check.py` flags it
when the `grouping` values differ, but it can only see what you declare — the
real check is reading them aloud and hearing whether they answer the same
question.

**Never a category label.** "Costs", "Risks", "Next steps" are headings, not
arguments. The same content as an assertion: "Delivery cost falls 40% by the
third engagement." A deck of category labels can be entirely true and still
persuade nobody, because it never says anything.

## MECE

**M**utually **E**xclusive, **C**ollectively **E**xhaustive.

- *Mutually exclusive*: no two key lines cover the same ground. If two overlap,
  the audience hears the same point twice and trusts the structure less. The
  overlap check in `pyramid_check.py` compares shared salient terms — a crude
  proxy, but it catches the obvious cases.
- *Collectively exhaustive*: nothing material is missing. The honest test is to
  ask what a hostile reader would say is absent, and then either add it or be
  ready to explain the omission.

A grouping ending in "and other considerations" is not MECE; it's an admission
that the grouping logic doesn't hold. Find the real cut.

## Deductive or inductive

**Deductive** is a chain: a situation, a comment on that situation, and the
conclusion the two force. Exactly three steps.

> Devices exist that no record accounts for. Automation acts on records.
> Therefore automation cannot safely act on this estate.

Powerful, hard to refuse, and tiring to read. Use it for a single decisive
argument — rarely for the whole key line level, because the audience must hold
every step to follow the end.

**Inductive** is a set of like things that add up.

> Three findings show the record is stale: unrecorded devices, unowned subnets,
> a three-year-old reconciliation.

Easier to follow, easier to survive interruption, and what you should default to
at the key line. Declare which one you're using in `structure` — the check warns
when you say deductive and don't have exactly three key lines.

## SCQA, and when it earns its place

**S**ituation (what they accept) → **C**omplication (what changed) →
**Q**uestion (what that provokes) → **A**nswer (your governing thought).

- **Proposal decks: yes.** The complication is why anyone should spend money.
- **Findings decks: usually.** The complication is what the investigation turned
  up that nobody expected.
- **Status readouts: usually not.** If work is proceeding as agreed, there is no
  complication, and inventing one to fit the framework reads as spin. Lead with
  the answer instead: where things stand, what needs a decision.

Set `scqa.use` accordingly. A manufactured complication is worse than no framing
at all — the audience notices, and it costs you the credibility you need for the
slide that actually matters.

## Provenance

Every support point carries a confidence tag:

| Tag | Means | Obligation |
|---|---|---|
| `stated` | It is in a source | Cite the anchor. No anchor, no `stated`. |
| `derived` | You computed it from sources | Cite the inputs and say you derived it, so the arithmetic can be checked. |
| `assumed` | Neither | Say so on the slide or in the notes, and list it in `assumptions[]`. |

Assumptions are not a failure. Hiding them is. A deck that says "assumes the
March figures still hold" survives being wrong; a deck that quietly presents an
assumption as a finding does not.

If most of the support is `assumed`, the honest move is to say the evidence
isn't there yet — not to build a confident deck on it.

## Common failures

- **The governing thought is a topic.** Test: can it be disagreed with?
- **Key lines are headings.** Test: does each one assert something?
- **Support restates the key line.** One support point is usually this. Two
  genuinely different pieces of evidence, or the key line is unsupported.
- **The grouping mixes kinds.** Reasons and steps in one list.
- **The pyramid is upside down.** Building to a conclusion at the end. The
  audience decides in the first two minutes; give them the answer first and
  spend the rest earning it.
- **The deck answers a question nobody asked.** The most expensive failure, and
  the reason Checkpoint B exists.
