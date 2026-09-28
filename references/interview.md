# The interview

The interview captures the frame: what the deck is for, who it is for, and
what constrains it. It does not capture content; content comes from the
sources and from the gap questions in stage 3. Read this whole file before
asking anything, because the point is not the questions, it is what each one
is trying to learn.

## How to interview

Interview like a skilled interviewer, not a form. You know what you are trying
to *learn* from each question, so you can hear a thin answer and probe it.
"It's for my boss" is a true answer that teaches nothing; the probe is "what's
their role, what do they care about, what will they push back on?"

- **Plain language.** Ask the way you would ask a colleague across a desk. Never
  "what is the desired outcome state"; always "what do you want to happen?"
- **Show the shape of a good answer, from an unrelated domain.** Every question
  carries two or three example answers below. They are deliberately about other
  industries so the user sees the shape without a default to copy. Never draw an
  example from the user's own topic.
- **A probe is not a repeat.** When an answer fails its test, say what was
  missing and show the example. At most two probes per question; after that,
  record the best answer you have as an assumption and move on.
- **Never ask what you already know** from the conversation, a pasted frame, or
  the sources. Pre-fill it and say where it came from.
- **Batch, then probe.** One message with all nine (pre-filled where possible),
  then a short conversational pass only on the answers that failed. Then the
  readback.
- **Two answers cannot default to nothing:** the outcome (Q1) and the message
  (Q2). If the user skips both, propose each from the evidence and get a yes.

`scripts/check_frame.py frame.json` runs the tests and prints the probes.

## The anchor, before anything is read

Three questions, one or two sentences each, asked before any document is
opened. They give the parse something to filter against. Rough answers are fine;
the nine refine them.

1. **What do you want to happen because of this deck?**
   *"I want the board to approve the plant closure." · "I want the ops team to
   stop arguing about which vendor and pick one." · "I want my sponsor to
   understand why we're three months late and agree to the new date."*
2. **Who is it for?** Name the people, their roles, and what they already think.
   *"The CFO, who thinks this is a cost problem, and two divisional heads who
   think it's a people problem." · "Twelve regional managers who have never seen
   the data."*
3. **What kind of deck, and roughly how big?**
   *"A one-slide summary for a weekly email." · "A 15-slide findings readout for
   a steering committee." · "A 40-slide proposal with an appendix."*

The third answer sets the tier (see `references/architecture.md`), so a
one-slide request never meets a nine-question interview.

## The nine frame questions

Asked after the parse, pre-filled from the ledger where the sources support an
answer (cite the anchor), drafted where they do not (mark it drafted), asked
outright where neither works. Each has an intent, a test, and a probe.

| # | Question (plain) | What you are trying to learn | Test for a usable answer | Usual origin |
|---|---|---|---|---|
| 1 | What should happen because of this deck? | The decision or belief change that defines success. Sets the ask slide and the arc. | Names a decision, approval, or belief change with a verb | Anchor; never blank |
| 2 | What's the one sentence they should repeat afterwards? | The governing thought. | A claim someone could disagree with, six words or more, not a topic | User, else drafted from the evidence and confirmed |
| 3 | What do they already accept, and what's changed? | Situation and complication (SCQ). Why now. | Both halves present | Inferred from sources, marked assumed |
| 4 | Who's in the room? | Who decides, what they believe, what they'll push back on, how technical. Sets detail and register. | At least two of: decides / believes / pushback; technical level set | Anchor, refined |
| 5 | What are you to them? | Expert reporting, vendor proposing, or team member asking. Sets "we found / we recommend / we need". | One of the three | Asked outright |
| 6 | Read alone, presented live, or sent ahead then presented? | Density. A read deck stands alone; a presented deck is sparse. | One of the three | Asked outright |
| 7 | How long, and do you need a short version? | Tier, and whether an exec cut is built. | A slide count or minutes; exec cut yes/no | Anchor, refined |
| 8 | What kind of deck? | Genre: proposal, findings, status, business case, working session, or capability overview. Sets whether the deck persuades or reports. | One of the five | Inferred from source document types |
| 9 | Anything that must be in, must be out, or must match something already said? | Mandatory content, off-limits content, numbers already quoted. | Explicit list or an explicit "nothing" | Asked outright |

### Example answers, by question (unrelated domains on purpose)

- **Q1** "Get the steering group to approve phase 2 funding." · "Have the
  clinical director agree that the rota, not the headcount, is the problem."
- **Q2** "The migration is on track, but only if security signs off this month."
  · "Our churn is a pricing problem, not a product problem." · "Two of the five
  regions should merge before the next hiring round."
- **Q3** Situation: "The clinic network was built for walk-in volume."
  Complication: "Walk-ins fell 30% after telehealth and the leases didn't."
- **Q4** "The CFO decides. She thinks it's a cost problem. She'll push back on
  any timeline over six months. Not technical." · "The head of engineering
  decides; he's seen the outage data; he'll push back on anything that touches
  the release calendar. Very technical."
- **Q5** "We're the vendor proposing the work." · "I'm the analyst reporting what
  the audit found."
- **Q6** "Sent Tuesday, presented Thursday, so every slide has to stand alone."
- **Q7** "About twelve slides, twenty minutes, and a two-slide pre-read." · "One
  slide for the weekly email."
- **Q8** "A status readout; nobody is deciding anything, they need to know where
  it stands."
- **Q9** "Must include the headcount table the board saw in March; must not
  mention the vendor dispute." · "Must match the $14M in the annual plan."
  · "Nothing."

### Probes, when an answer fails

The probe names what was missing and shows the example. Written out in
`scripts/check_frame.py`, which prints the right one for each failure. For Q2,
the most common failure is a topic ("our cloud migration approach"); the probe
is: "That's the topic. What's the claim about it? Something like 'the approach
is right but the timeline isn't' or 'we should switch now'. What's yours?"

## The readback (checkpoint 1)

After the answers, write the frame back as one or two paragraphs, in prose,
and ask one question: **"Is this the deck?"** The paragraph covers: what should
happen, the message, who's in the room and what they believe, your position,
read or presented, the size, the genre, and the constraints. Nothing else.

End it with one line for the packaging, all optional, all defaulted: a logo
(file or URL), draft or final, a confidentiality marking, US or UK spelling.
*Defaults: no logo, draft, no marking, US.* This is the only time the logo is
asked for. On the single-slide tier the same line rides on its one checkpoint.

The readback paragraph is saved into `frame.json` as `readback`. It is written
so it can be pasted into a later session to skip the interview.

## Skipping the interview

A pasted readback paragraph, or a revision of an existing deck, jumps straight
to the parse. Still play back the three anchor lines and ask "still this?" so a
new deck is never built on last month's purpose. Packaging answers travel with
the paragraph; a returning user is not asked for the logo twice.

## Never ask

Colours, fonts, layout, slide-by-slide content, which exhibit to use, whether
they want a title slide. The style and the selection rule own those. Asking
makes the skill look like it doesn't know its own job.

## When the user can't or won't answer

Build with the gap marked, not papered over: the assumption on the slide where
it changes what the audience reads, the detail in the speaker notes, and every
assumption listed in the handover so it can be corrected in one pass.
