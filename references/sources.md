# External facts and internet search

Search is a bounded step the user switches on per gap, never something you do
on your own initiative. Consulting decks routinely need external facts (a market
size, a regulation and its effective date, a benchmark, a competitor's stated
position), and a stated gap is better than an empty slot, but a wrong number is
worse than either.

## When you may search

- **Only for facts external to the client.** What a regulator published, what a
  market is worth, what a vendor says on its own site. Never to fill in anything
  about the client's own estate, numbers, people or plans. Those come from the
  user or are marked assumed.
- **Only after the user says so.** `coverage_check.py` lists external gaps
  separately from content gaps. Put them to the user with three options each:
  look it up, they supply it, or the deck states the gap. Search nothing until
  they choose.
- **Only if a search tool exists where you are running.** If it does not, say so
  and offer the other two routes. Never claim to have looked.

## Source tiers

**Accepted:** government and regulator publications; official statistics
agencies; standards bodies; company filings and a company's own official pages;
peer-reviewed journals; established research houses; the mainstream business
and trade press.

**Refused:** forums, social media, content farms, anonymous blogs, aggregator
summaries, and any page that is itself an AI-generated digest. A fact that
exists only in the refused tier is reported as unsourced and the deck states
the gap.

If in doubt, ask: would the most sceptical person in the room accept this
publisher as an authority? If not, it is refused.

## Provenance rules

- **The page, not the snippet.** Open the source and read the claim in context
  before using it. A search-result summary is not a source.
- **Numbers need two independent accepted sources,** or a visible "single
  source" flag on the slide's subtitle.
- **Every external fact carries publisher, title, date and URL.** All four go in
  the ledger entry (`origin: external`), into the slide's source line, and onto
  the `sources` slide at the back. `build_ledger.py` refuses an external entry
  missing any field; `audit_facts.py` fails a slide that uses one.
- **Two origins only.** A fact is from the user's material or from a fetched
  page the deck cites. Anything else is an assumption and is labelled as one on
  the slide and in the notes. There is no third category to hide in. This is
  the hallucination guard.
- **Dates matter.** Record the publication date, not the retrieval date, and
  prefer the most recent accepted source when two disagree; say in the notes
  that they disagreed.

## Ledger entry shape

```json
{ "id": "E31", "finding": "UK parcel volume grew 4% in 2025", "value": "4%",
  "grade": "supporting", "origin": "external",
  "publisher": "Ofcom", "title": "Annual monitoring update on postal services",
  "date": "2025-11-20", "url": "https://…",
  "sources": [], "serves": ["KL2"] }
```

The cost of all this is that external facts are slower to include than
internal ones. That is the intended trade: the audience will forgive a stated
gap and will not forgive a wrong number.
