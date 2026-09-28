# Pattern reference

Forty-six patterns. Pick from what the slide's headline *claims* (`references/selection_rule.md`), then fill the fields below. Every content pattern also accepts `eyebrow` (the label: short, capitals are applied for you), `headline` (the finding, sentence case), `subtitle`, `band`, `source`, `notes`, `audience` (a mixed-room tag, rendered on the eyebrow), `illustrative` (true only after the user has agreed; rendered in the subtitle in words), and a `tune` block (`references/visual_qa.md`). `body`/`detail`/`items` fields accept a string or an array of strings.

`band` is a string (the statement style) or `{text, style, label}` with `style` one of `statement` (pale teal, the default), `takeaway` (white card with a check badge: what this slide proves) or `bottom_line` (navy with an amber edge and a Georgia line: the implication, labelled by `label`). Use `bottom_line` once or twice in a deck, where the argument turns.

Icons: any `icon` field takes a name from `assets/icons/icons.json` (`references/icons.md`). One icon, one idea: never the same icon twice on a slide, and vary them across the deck.

Data patterns (**source line required**, the gate refuses without it): `chart`, `curve`, `gantt`, `heatmap`, `kpi_strip`, `matrix`, `maturity`, `one_number`, `one_status`, `roadmap`, `scorecard`, `stage_tracker`, `table`, `waterfall`.

The JSON under each pattern is the slide from `examples/catalogue.brief.json`, which renders to `examples/Pattern_Catalogue.pptx`. Open the PDF next to this file.

## Structural

These carry the argument's skeleton. `to_deck_brief.py` generates most of them from the storyboard; attach them to a key line only when you know why. The divider (`section`) numbers itself and draws progress marks from every `section` in the brief; give each a short `label` for its mark and a `keyLine` (the section's one-line answer). `title` takes an optional rail of up to three `figures` ({value, label, icon}); every one is audited like any other figure.

### `title`

Title: split layout, optional figure rail (up to three, each audited like any figure).

```json
{
 "pattern": "title",
 "eyebrow": "Depot network review · Halvard Freight",
 "headline": "Six depots do the work of nine.",
 "subtitle": "What the network data shows, what it would take to consolidate, and what the board is asked to decide.",
 "meta": "All figures fictional · Built to show every pattern in the library",
 "figures": [
  {
   "value": "3",
   "label": "depots to consolidate",
   "icon": "warehouse"
  },
  {
   "value": "$4.1M",
   "label": "annual saving, net of fuel",
   "icon": "savings"
  },
  {
   "value": "99.2%",
   "label": "of customers keep next-day service",
   "icon": "truck"
  }
 ]
}
```

### `section`

Standard divider: number, section title, the section's one-line answer, progress marks.

```json
{
 "pattern": "section",
 "headline": "Where the network stands today.",
 "keyLine": "Three depots carry a third of the cost for a seventh of the volume.",
 "label": "Today"
}
```

### `agenda`

Agenda with the current section marked.

```json
{
 "pattern": "agenda",
 "headline": "Where we are in the argument.",
 "items": [
  "The network today",
  "What consolidation would look like",
  "What it costs and saves",
  "Risks and the decision"
 ],
 "current": 2
}
```

### `exec_summary`

The whole deck on one slide. A reader may stop here.

```json
{
 "pattern": "exec_summary",
 "headline": "Consolidating three depots saves $4.1M a year at a one-time cost of $2.6M.",
 "answer": "Consolidating three depots saves $4.1M a year — for a one-time cost of $2.6M and no loss of next-day coverage.",
 "keyLines": [
  "Three depots run below 40% utilisation and sit within 60 miles of a larger site.",
  "Their volume fits inside the receiving sites' spare capacity with 18% headroom.",
  "Next-day coverage holds for 99.2% of current customers after re-routing.",
  "The saving is dominated by lease and labour; fuel rises by $0.3M and is included."
 ],
 "decision": "Approve the consolidation plan and the $2.6M transition budget by Oct 15.",
 "risk": "Union consultation at the Ridgeway depot could add four months.",
 "source": "Halvard depot P&L FY25; route model v3 (fictional)"
}
```

### `statement`

Statement: one idea.

```json
{
 "pattern": "statement",
 "eyebrow": "Why now",
 "headline": "Every month of delay costs $340,000.",
 "body": "The three sites lose $4.1M a year against the consolidated network. Oakmont's lease renews in March at a 12% step-up; missing it adds two years to the exit.",
 "kicker": "Nothing here gets cheaper by waiting."
}
```

### `ask`

Ask, audience-addressed variant: a lead card beside numbered actions; bottom-line band.

```json
{
 "pattern": "ask",
 "eyebrow": "What we need from depot managers",
 "headline": "The receiving sites need two things from their managers this quarter.",
 "lead": {
  "audience": "Easton and Fairmont managers",
  "text": "Run the December peak-week dry run at full volume.",
  "points": [
   "It is the last test the model has not passed",
   "It tells us whether Fairmont needs overflow cover"
  ]
 },
 "actions": [
  {
   "title": "Book the dry-run week",
   "body": "Week of Dec 8, both sites, full shift pattern."
  },
  {
   "title": "Report the friction",
   "body": "Daily log of anything the model got wrong."
  }
 ],
 "band": {
  "text": "Pass the dry run and the Ridgeway move can start in February.",
  "style": "bottom_line"
 }
}
```

The ask.

```json
{
 "pattern": "ask",
 "eyebrow": "The decision",
 "headline": "Three approvals to start in November.",
 "cards": [
  {
   "kicker": "Decision",
   "title": "Approve the plan",
   "body": "Close Ridgeway, Brookline and Oakmont; Easton and Fairmont receive."
  },
  {
   "kicker": "Budget",
   "title": "$2.6M transition",
   "body": "Released in three tranches, one per phase."
  },
  {
   "kicker": "Mandate",
   "title": "Start union engagement",
   "body": "Informal engagement at Ridgeway from Nov 1."
  }
 ],
 "band": "Approve these three and the first saving lands in month four."
}
```

### `risks`

Risks table.

```json
{
 "pattern": "risks",
 "eyebrow": "What could go wrong",
 "headline": "Three risks, each with an owner and a mitigation.",
 "rows": [
  {
   "risk": "Union consultation at Ridgeway extends beyond four months",
   "impact": "High",
   "owner": "HR director",
   "mitigation": "Start informal engagement now; sequence Oakmont and Brookline first so savings begin regardless."
  },
  {
   "risk": "Easton peak-week capacity is tighter than modelled",
   "impact": "Medium",
   "owner": "Ops director",
   "mitigation": "Pilot a peak week in December before committing; Fairmont takes overflow."
  },
  {
   "risk": "Brookline sublet market softens",
   "impact": "Low",
   "owner": "Property",
   "mitigation": "Exit penalty already in the $2.6M; sublet is upside only."
  }
 ],
 "highlightRow": 0
}
```

### `backup`

Backup divider.

```json
{
 "pattern": "backup"
}
```

### `sources`

Sources slide.

```json
{
 "pattern": "sources",
 "items": [
  {
   "publisher": "Halvard Freight",
   "title": "Depot P&L FY25",
   "date": "Jul 2026",
   "url": "internal (fictional)"
  },
  {
   "publisher": "Halvard Freight",
   "title": "Route model v3",
   "date": "Aug 2026",
   "url": "internal (fictional)"
  }
 ]
}
```

## Parallel points

Use when the claim is a set of parallel facts. Not a sequence, not a comparison. `cards` takes `icon` per card and `dark: true` for the navy variant (emphasis; one navy content slide in five at most).

### `cards`

Cards size to their content now.

```json
{
 "pattern": "cards",
 "eyebrow": "The network today",
 "headline": "Three of nine depots run below 40% utilisation.",
 "subtitle": "Utilisation is dock hours used over dock hours available, FY25 average.",
 "cards": [
  {
   "kicker": "Depot",
   "title": "Ridgeway · 34%",
   "body": "Volume fell 22% after the Carver contract ended in 2024."
  },
  {
   "kicker": "Depot",
   "title": "Brookline · 37%",
   "body": "Sits 41 miles from Easton, which runs at 71%."
  },
  {
   "kicker": "Depot",
   "title": "Oakmont · 39%",
   "body": "Lease renews in March; rent steps up 12%."
  },
  {
   "kicker": "Consequence",
   "title": "Fixed cost with no volume",
   "body": "The three carry $5.2M of lease and labour for 14% of network volume.",
   "highlight": true
  }
 ],
 "band": {
  "text": "Three depots carry $5.2M of fixed cost for 14% of network volume.",
  "style": "takeaway"
 },
 "source": "Halvard depot P&L FY25 (fictional)"
}
```

Dark variant of cards, with icons. Use sparingly: one dark content slide in five at most.

```json
{
 "pattern": "cards",
 "dark": true,
 "eyebrow": "What operators get back",
 "headline": "Consolidation frees each receiving site's team for the work only they can do.",
 "cards": [
  {
   "icon": "route",
   "title": "Fewer re-plans",
   "body": "One planning run for the region instead of three depot schedules stitched together."
  },
  {
   "icon": "timer",
   "title": "Shorter shunts",
   "body": "Trailers stop crossing between the low sites and Easton to balance loads."
  },
  {
   "icon": "team",
   "title": "Deeper benches",
   "body": "Two larger crews cover absence without agency labour."
  }
 ],
 "band": "Net effect: less stitching, fewer handoffs, and more of each shift spent moving freight."
}
```

### `quote`

A quote slide: one voice, sized to fit.

```json
{
 "pattern": "quote",
 "eyebrow": "What operators say",
 "headline": "The depot managers already know which sites are underused.",
 "quote": "We could run Brookline's whole Tuesday out of Easton's afternoon shift and nobody would notice except the landlord.",
 "attribution": "Regional operations manager, interview 14 Aug",
 "source": "Operator interviews, Aug 2026 (fictional)"
}
```

## Sequence

Use when the claim is an order: first A, then B. `phases` when people are attached; `chevrons` for a plain sequence; `steps` when each stage builds on the last.

### `phases`

Phases with a constant and rotating roles.

```json
{
 "pattern": "phases",
 "eyebrow": "How the transition runs",
 "headline": "Three phases over nine months, each gated on the last.",
 "subtitle": "Routes move before people; people move before buildings close.",
 "phases": [
  {
   "tag": "Months 1–3",
   "title": "Re-route",
   "body": "Shift Ridgeway and Brookline volume to Easton on the route model; measure service."
  },
  {
   "tag": "Months 4–6",
   "title": "Consult and transfer",
   "body": "Union consultation, transfer offers, hiring at receiving sites.",
   "highlight": true
  },
  {
   "tag": "Months 7–9",
   "title": "Close and exit",
   "body": "Lease exits, asset disposal, Oakmont handed back at renewal."
  }
 ],
 "constant": {
  "label": "TRANSITION LEAD",
  "text": "one accountable owner across all three phases, reporting to the COO monthly.",
  "tag": "constant"
 },
 "columns": [
  {
   "header": "PHASE 1",
   "items": [
    "Route planner",
    "Depot managers (both)"
   ]
  },
  {
   "header": "PHASE 2",
   "items": [
    "HR business partner",
    "Union liaison"
   ],
   "highlight": true
  },
  {
   "header": "PHASE 3",
   "items": [
    "Property",
    "Finance"
   ]
  }
 ]
}
```

### `chevrons`

Chevrons for a sequence without people attached.

```json
{
 "pattern": "chevrons",
 "eyebrow": "The re-routing sequence",
 "headline": "Volume moves in four steps, each reversible until the last.",
 "steps": [
  {
   "title": "Model",
   "body": "Re-plan every route on the current order book."
  },
  {
   "title": "Pilot",
   "body": "Run one week of Brookline Tuesdays from Easton."
  },
  {
   "title": "Measure",
   "body": "Service, cost per drop, driver hours.",
   "highlight": true
  },
  {
   "title": "Commit",
   "body": "Move the remaining days once service holds."
  }
 ],
 "band": "Nothing closes until the pilot has held service for four weeks."
}
```

### `steps`

Staircase for stages that build.

```json
{
 "pattern": "steps",
 "eyebrow": "Capability staircase",
 "headline": "Each step builds on the one before it.",
 "subtitle": "Where the network sits today is step two.",
 "steps": [
  {
   "title": "Visibility",
   "body": "Utilisation measured per dock per day."
  },
  {
   "title": "Route control",
   "body": "Central planning replaces depot-level planning.",
   "highlight": true
  },
  {
   "title": "Dynamic balancing",
   "body": "Volume moves between sites weekly."
  },
  {
   "title": "Network design",
   "body": "Sites opened and closed on the model."
  }
 ]
}
```

## Causes to effect

Several things converging on one result; `funnel` when there is attrition between stages.

### `leading_to`

Causes converging on one effect.

```json
{
 "pattern": "leading_to",
 "eyebrow": "Why utilisation fell",
 "headline": "Three separate changes emptied the same three depots.",
 "causes": [
  {
   "title": "Carver contract ended (2024)",
   "body": "Ridgeway lost its anchor customer."
  },
  {
   "title": "Easton expansion (2023)",
   "body": "Added dock capacity 41 miles from Brookline."
  },
  {
   "title": "Parcel mix shift",
   "body": "Smaller consignments consolidate better at larger sites."
  }
 ],
 "effect": "Three depots below 40%",
 "effectBody": "None of the three causes was a mistake. Together they left the network one size too big.",
 "source": "Halvard volume history 2022–25 (fictional)"
}
```

### `funnel`

Funnel with attrition at each stage.

```json
{
 "pattern": "funnel",
 "eyebrow": "Customer impact",
 "headline": "Of 2,140 customers, 17 would lose next-day service.",
 "stages": [
  {
   "title": "Customers served by the three depots",
   "value": "2,140",
   "note": "All current accounts routed through Ridgeway, Brookline or Oakmont."
  },
  {
   "title": "Re-routable within the model",
   "value": "2,061",
   "note": "Fit within receiving sites' drive-time windows."
  },
  {
   "title": "Re-routable with a later cut-off",
   "value": "62",
   "note": "Next-day holds if orders are in by 4pm rather than 6pm."
  },
  {
   "title": "Lose next-day service",
   "value": "17",
   "note": "Rural addresses beyond the 2-hour drive window.",
   "highlight": true
  }
 ],
 "source": "Route model v3 (fictional)"
}
```

## Decomposition

X is made of A, B, C. `driver_tree` when leaves carry a trend or a Harvey ball; `hypothesis_tree` when the deck answers one question with evidence under each branch.

### `logic_tree`

Logic tree: decomposition without leaves.

```json
{
 "pattern": "logic_tree",
 "eyebrow": "Where the saving comes from",
 "headline": "The $4.1M saving is lease, labour and overhead, less fuel.",
 "root": "$4.1M net annual saving",
 "children": [
  {
   "title": "Lease and facilities · $2.3M",
   "body": "Three leases exit; Oakmont at renewal."
  },
  {
   "title": "Labour · $1.6M",
   "body": "Net of 14 transfers and 9 new hires at receiving sites.",
   "highlight": true
  },
  {
   "title": "Overhead · $0.5M",
   "body": "Site management, insurance, systems."
  },
  {
   "title": "Fuel and hours · −$0.3M",
   "body": "Longer stem miles from Easton."
  }
 ],
 "source": "Halvard depot P&L FY25; transition model (fictional)"
}
```

### `driver_tree`

Driver tree with trend arrows on the leaves.

```json
{
 "pattern": "driver_tree",
 "eyebrow": "What drives utilisation",
 "headline": "Volume fell and capacity did not.",
 "root": "Dock utilisation 34–39%",
 "children": [
  {
   "title": "Volume",
   "leaves": [
    {
     "text": "Consignments per day",
     "trend": "down"
    },
    {
     "text": "Average consignment size",
     "trend": "down"
    },
    {
     "text": "Customer count",
     "trend": "flat"
    }
   ]
  },
  {
   "title": "Capacity",
   "leaves": [
    {
     "text": "Dock doors",
     "trend": "flat"
    },
    {
     "text": "Shift hours",
     "trend": "flat"
    }
   ]
  },
  {
   "title": "Routing",
   "highlight": true,
   "leaves": [
    {
     "text": "Share planned centrally",
     "trend": "up"
    }
   ]
  }
 ],
 "source": "Halvard operations data FY23–25 (fictional)"
}
```

### `hypothesis_tree`

Hypothesis tree with evidence under each branch.

```json
{
 "pattern": "hypothesis_tree",
 "eyebrow": "The question",
 "headline": "Can the network lose three depots without losing service?",
 "answer": "Yes — if routes move before people, and people move before buildings.",
 "hypotheses": [
  {
   "title": "Receiving sites have room",
   "evidence": [
    "Easton at 71%, Fairmont at 66%",
    "18% headroom after transfer",
    "Peak week modelled at 91%"
   ],
   "highlight": true
  },
  {
   "title": "Service holds",
   "evidence": [
    "99.2% next-day coverage",
    "17 accounts affected",
    "Later cut-off covers 62 more"
   ]
  },
  {
   "title": "People can transfer",
   "evidence": [
    "14 of 23 within 30 miles",
    "9 hires needed at Easton",
    "Union consultation required at Ridgeway"
   ]
  },
  {
   "title": "Leases can exit",
   "evidence": [
    "Oakmont renews March",
    "Ridgeway break clause 2027",
    "Brookline sublet market strong"
   ]
  }
 ],
 "source": "Transition model; HR data (fictional)"
}
```

## Comparison

Options on criteria. `scorecard` modes: `balls` (0, .25, .5, .75, 1), `lights` (g|a|r), `arrows` (up|flat|down), `text`. `heatmap` for 20+ numeric cells. `table` cells may be `{text, status}` to colour an outcome with the status set, and a table takes a `note`. `contrast` sets what stays the same beside what changes: the reassurance slide.

### `table`

Plain table with a highlight row.

```json
{
 "pattern": "table",
 "eyebrow": "The three sites",
 "headline": "Oakmont is the cheapest to exit and the first to go.",
 "columns": [
  {
   "header": "Depot",
   "width": 1.4
  },
  {
   "header": "Utilisation"
  },
  {
   "header": "Annual cost ($M)"
  },
  {
   "header": "Exit cost ($M)"
  },
  {
   "header": "Lease end"
  },
  {
   "header": "Receiving site",
   "align": "left",
   "width": 1.3
  }
 ],
 "rows": [
  [
   "Ridgeway",
   "34%",
   "2.1",
   "1.4",
   "2027 break",
   "Fairmont"
  ],
  [
   "Brookline",
   "37%",
   "1.8",
   "0.9",
   "2029",
   "Easton"
  ],
  [
   "Oakmont",
   "39%",
   "1.3",
   "0.3",
   "Mar 2027",
   "Easton"
  ]
 ],
 "highlightRow": 2,
 "source": "Halvard depot P&L FY25; property schedule (fictional)"
}
```

### `scorecard`

Harvey-ball scorecard.

```json
{
 "pattern": "scorecard",
 "eyebrow": "Choosing receiving sites",
 "headline": "Easton and Fairmont score highest on every criterion but one.",
 "columns": [
  "Spare capacity",
  "Drive time",
  "Labour market",
  "Lease term",
  "Access"
 ],
 "mode": "balls",
 "rows": [
  {
   "label": "Easton",
   "cells": [
    1,
    0.75,
    0.75,
    1,
    0.5
   ],
   "highlight": true
  },
  {
   "label": "Fairmont",
   "cells": [
    0.75,
    0.75,
    1,
    0.75,
    0.75
   ]
  },
  {
   "label": "Carlton",
   "cells": [
    0.5,
    0.25,
    0.5,
    0.5,
    1
   ]
  },
  {
   "label": "Westbrook",
   "cells": [
    0.25,
    0.5,
    0.25,
    1,
    0.75
   ]
  }
 ],
 "legend": "Full = strongest on that criterion; empty = weakest. Scored by the route model and site visits.",
 "source": "Site assessment, Aug 2026 (fictional)"
}
```

Traffic-light scorecard: colour plus letter.

```json
{
 "pattern": "scorecard",
 "eyebrow": "Readiness by site",
 "headline": "Two receiving sites are ready; one needs a hiring plan first.",
 "columns": [
  "Capacity",
  "People",
  "Systems",
  "Property"
 ],
 "mode": "lights",
 "rows": [
  {
   "label": "Easton",
   "cells": [
    "g",
    "a",
    "g",
    "g"
   ]
  },
  {
   "label": "Fairmont",
   "cells": [
    "g",
    "g",
    "g",
    "a"
   ]
  },
  {
   "label": "Carlton",
   "cells": [
    "a",
    "r",
    "g",
    "g"
   ]
  }
 ],
 "legend": "G ready · A in progress · R needs a decision.",
 "source": "Site readiness review (fictional)"
}
```

### `heatmap`

Heatmap: value in every cell.

```json
{
 "pattern": "heatmap",
 "eyebrow": "Utilisation by depot and quarter",
 "headline": "The three low sites have been below 45% for six quarters.",
 "columns": [
  "Q1 25",
  "Q2 25",
  "Q3 25",
  "Q4 25",
  "Q1 26",
  "Q2 26"
 ],
 "rows": [
  {
   "label": "Easton",
   "cells": [
    68,
    70,
    72,
    74,
    71,
    73
   ]
  },
  {
   "label": "Fairmont",
   "cells": [
    61,
    64,
    66,
    68,
    66,
    67
   ]
  },
  {
   "label": "Carlton",
   "cells": [
    55,
    54,
    58,
    57,
    56,
    59
   ]
  },
  {
   "label": "Ridgeway",
   "cells": [
    44,
    41,
    38,
    36,
    34,
    35
   ]
  },
  {
   "label": "Brookline",
   "cells": [
    43,
    42,
    40,
    39,
    37,
    38
   ]
  },
  {
   "label": "Oakmont",
   "cells": [
    45,
    44,
    42,
    40,
    39,
    39
   ]
  }
 ],
 "source": "Halvard operations data (fictional)"
}
```

### `contrast`

Contrast: what stays the same beside what changes. The reassurance slide.

```json
{
 "pattern": "contrast",
 "eyebrow": "How we run it",
 "headline": "The safety rules stay exactly as they are; only the timing of moves changes.",
 "left": {
  "kicker": "Unchanged",
  "title": "Governance is unchanged",
  "items": [
   "Every route change goes through the network change board",
   "Customer notice at least 30 days ahead",
   "Site managers sign off their own cut-over",
   "Post-move service check at day 7 and day 30"
  ],
  "note": "All existing responsibilities stay with the site."
 },
 "right": {
  "icon": "clock",
  "title": "Moves follow the depot clock",
  "items": [
   {
    "title": "Northern sites",
    "body": "After 22:00 local, once the last trunk has left."
   },
   {
    "title": "Southern sites",
    "body": "Sunday day shift, when volume is lowest."
   }
  ],
  "note": "Standard windows validated in the pilot; exceptions by request."
 }
}
```

## Quantity

`chart.kind`: column | bar | stacked | stacked100 | line | area. Single-series charts take `highlightIndex`; multi-series take `series:[{name,values}]` and `highlightSeries`. `waterfall.steps[].type`: start | delta | total. All native, editable charts. `chart`, `waterfall` and `curve` take a side `card` or a navy `panel` of short headed points. `kpi_strip` is three to five metrics, each with its target, change and period; `good: up|down` colours the change and says better or worse in words.

### `chart`

Column chart with the navy commentary panel; one highlighted bar in amber.

```json
{
 "pattern": "chart",
 "eyebrow": "Utilisation across the network",
 "headline": "Three depots sit well below the network average of 58%.",
 "subtitle": "Dock utilisation, FY25 average.",
 "chart": {
  "kind": "column",
  "labels": [
   "Easton",
   "Fairmont",
   "Carlton",
   "Westbrook",
   "Hallam",
   "Norcross",
   "Oakmont",
   "Brookline",
   "Ridgeway"
  ],
  "values": [
   71,
   66,
   57,
   60,
   62,
   64,
   39,
   37,
   34
  ],
  "units": "% of dock hours",
  "highlightIndex": 8
 },
 "source": "Halvard operations data FY25 (fictional)",
 "panel": {
  "points": [
   {
    "title": "Structural, not seasonal",
    "body": "No site moved more than 4 points in FY25."
   },
   {
    "title": "Two clusters",
    "body": "Six sites at 57–71%; three at 34–39%."
   },
   {
    "title": "Room to receive",
    "body": "Easton and Fairmont have the most spare dock hours."
   }
  ]
 }
}
```

Stacked column, multi-series.

```json
{
 "pattern": "chart",
 "eyebrow": "Cost mix",
 "headline": "Lease and labour are 78% of depot cost at the three sites.",
 "chart": {
  "kind": "stacked",
  "labels": [
   "Ridgeway",
   "Brookline",
   "Oakmont"
  ],
  "series": [
   {
    "name": "Lease",
    "values": [
     0.9,
     0.8,
     0.6
    ]
   },
   {
    "name": "Labour",
    "values": [
     0.8,
     0.6,
     0.5
    ]
   },
   {
    "name": "Overhead",
    "values": [
     0.3,
     0.3,
     0.2
    ]
   },
   {
    "name": "Fuel",
    "values": [
     0.1,
     0.1,
     0.0
    ]
   }
  ],
  "units": "$M per year",
  "format": "0.0"
 },
 "band": "Fuel is the only cost that rises after consolidation — and it is the smallest bar.",
 "source": "Halvard depot P&L FY25 (fictional)"
}
```

Two-line chart.

```json
{
 "pattern": "chart",
 "eyebrow": "Volume trend",
 "headline": "Network volume is flat; the three sites' volume is not.",
 "chart": {
  "kind": "line",
  "labels": [
   "Q1 24",
   "Q2 24",
   "Q3 24",
   "Q4 24",
   "Q1 25",
   "Q2 25",
   "Q3 25",
   "Q4 25"
  ],
  "series": [
   {
    "name": "Network (000 consignments)",
    "values": [
     412,
     418,
     421,
     430,
     419,
     424,
     428,
     433
    ]
   },
   {
    "name": "Three sites (000)",
    "values": [
     78,
     74,
     69,
     63,
     61,
     59,
     58,
     57
    ]
   }
  ],
  "units": "000 consignments"
 },
 "source": "Halvard volume history (fictional)"
}
```

### `waterfall`

Waterfall as a native stacked column with an invisible base.

```json
{
 "pattern": "waterfall",
 "eyebrow": "The bridge",
 "headline": "Gross saving of $4.4M nets to $4.1M after fuel.",
 "subtitle": "Annual run-rate after transition, $M.",
 "waterfall": {
  "steps": [
   {
    "label": "Lease",
    "value": 2.3,
    "type": "delta"
   },
   {
    "label": "Labour",
    "value": 1.6
   },
   {
    "label": "Overhead",
    "value": 0.5
   },
   {
    "label": "Fuel",
    "value": -0.3
   },
   {
    "label": "Net saving",
    "type": "total"
   }
  ],
  "units": "$M",
  "format": "0.0"
 },
 "card": {
  "kicker": "What is not in the bridge",
  "title": "One-time costs",
  "body": [
   "$2.6M transition cost",
   "Payback inside eight months",
   "Lease exit penalties included"
  ]
 },
 "source": "Transition model v3 (fictional)"
}
```

### `matrix`

2x2 with plotted items.

```json
{
 "pattern": "matrix",
 "eyebrow": "Every depot on two axes",
 "headline": "Three sites are low on utilisation and high on cost to keep.",
 "xAxis": "Cost to keep (lease + labour)",
 "yAxis": "Utilisation",
 "quadrants": {
  "tl": "Efficient",
  "tr": "Core",
  "bl": "Review",
  "br": "Consolidate"
 },
 "highlightQuadrant": "br",
 "items": [
  {
   "label": "Easton",
   "x": 0.8,
   "y": 0.85,
   "size": 3
  },
  {
   "label": "Fairmont",
   "x": 0.65,
   "y": 0.78,
   "size": 2
  },
  {
   "label": "Carlton",
   "x": 0.4,
   "y": 0.55
  },
  {
   "label": "Westbrook",
   "x": 0.35,
   "y": 0.6
  },
  {
   "label": "Hallam",
   "x": 0.3,
   "y": 0.63
  },
  {
   "label": "Ridgeway",
   "x": 0.75,
   "y": 0.2,
   "highlight": true
  },
  {
   "label": "Brookline",
   "x": 0.7,
   "y": 0.25,
   "highlight": true
  },
  {
   "label": "Oakmont",
   "x": 0.55,
   "y": 0.28,
   "highlight": true
  }
 ],
 "card": {
  "kicker": "Reading the matrix",
  "title": "Bottom-right is the case",
  "body": "High fixed cost, low use. The other six sites are either core or cheap enough to keep."
 },
 "source": "Halvard depot P&L FY25 (fictional)"
}
```

### `kpi_strip`

KPI strip: each figure with its target, change and period. The highlight goes on the miss.

```json
{
 "pattern": "kpi_strip",
 "eyebrow": "Pilot results",
 "headline": "The Oakmont pilot hit three of four targets in its first eight weeks.",
 "kpis": [
  {
   "label": "On-time delivery",
   "value": "97.8",
   "unit": "%",
   "delta": "+1.2 pts",
   "direction": "up",
   "good": "up",
   "target": "97.0%",
   "period": "Weeks 1–8",
   "icon": "clock"
  },
  {
   "label": "Cost per consignment",
   "value": "$4.62",
   "delta": "-8%",
   "direction": "down",
   "good": "down",
   "target": "$4.80",
   "period": "Weeks 1–8",
   "icon": "dollar"
  },
  {
   "label": "Trailer fill",
   "value": "81",
   "unit": "%",
   "delta": "+9 pts",
   "direction": "up",
   "good": "up",
   "target": "78%",
   "period": "Weeks 1–8",
   "icon": "package"
  },
  {
   "label": "Customer complaints",
   "value": "14",
   "delta": "+3",
   "direction": "up",
   "good": "down",
   "target": "≤ 10",
   "period": "Weeks 1–8",
   "icon": "feedback"
  }
 ],
 "highlight": 3,
 "band": "Complaints are the one miss: all 14 trace to the first fortnight's re-routed postcodes.",
 "source": "Oakmont pilot tracker, weeks 1–8 (fictional)"
}
```

## Time plans

`gantt` rows have `start`/`end` in 1-based periods and optional `milestones:[{at,label}]`; `today` draws the marker. `roadmap` adds `impactHeader` and per-row `impact`. `stage_tracker` puts items against stages; each cell is done | progress | none (or a fraction) and the legend says what each shape means.

### `gantt`

Gantt with milestones and today line.

```json
{
 "pattern": "gantt",
 "eyebrow": "Transition timeline",
 "headline": "Nine months from approval to the last lease exit.",
 "periods": [
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul"
 ],
 "today": 1,
 "rows": [
  {
   "label": "Route modelling",
   "start": 1,
   "end": 2,
   "done": true
  },
  {
   "label": "Brookline pilot",
   "start": 2,
   "end": 3,
   "milestones": [
    {
     "at": 3,
     "label": "Go/no-go"
    }
   ]
  },
  {
   "label": "Union consultation",
   "start": 3,
   "end": 6,
   "highlight": true
  },
  {
   "label": "Transfers and hiring",
   "start": 4,
   "end": 7
  },
  {
   "label": "Oakmont exit",
   "start": 5,
   "end": 5,
   "milestones": [
    {
     "at": 5,
     "label": "Lease end"
    }
   ]
  },
  {
   "label": "Ridgeway, Brookline exit",
   "start": 7,
   "end": 9
  }
 ],
 "source": "Transition plan v2 (fictional)"
}
```

### `roadmap`

Roadmap with financial impact column.

```json
{
 "pattern": "roadmap",
 "eyebrow": "Roadmap and financial impact",
 "headline": "Savings start in month four and reach run-rate in month ten.",
 "periods": [
  "Q4 26",
  "Q1 27",
  "Q2 27",
  "Q3 27"
 ],
 "impactHeader": "Run-rate ($M/yr)",
 "rows": [
  {
   "label": "Re-route",
   "impact": "0.4",
   "activities": [
    {
     "start": 1,
     "end": 1,
     "label": "Model and pilot"
    },
    {
     "start": 2,
     "end": 2,
     "label": "Commit"
    }
   ]
  },
  {
   "label": "People",
   "impact": "1.6",
   "activities": [
    {
     "start": 2,
     "end": 3,
     "label": "Consult, transfer, hire",
     "highlight": true
    }
   ]
  },
  {
   "label": "Property",
   "impact": "2.3",
   "activities": [
    {
     "start": 2,
     "end": 2,
     "label": "Oakmont"
    },
    {
     "start": 3,
     "end": 4,
     "label": "Ridgeway, Brookline"
    }
   ]
  },
  {
   "label": "Overhead",
   "impact": "0.5",
   "activities": [
    {
     "start": 3,
     "end": 4,
     "label": "Systems and insurance"
    }
   ]
  }
 ],
 "source": "Transition model v3 (fictional)"
}
```

### `phases_threads`

Phases x threads grid.

```json
{
 "pattern": "phases_threads",
 "eyebrow": "Who does what, when",
 "headline": "Four workstreams run across three phases.",
 "phases": [
  "Re-route",
  "Consult and transfer",
  "Close and exit"
 ],
 "threads": [
  {
   "label": "Operations",
   "items": [
    "Route model, pilot",
    "Run both sites in parallel",
    "Single-site running"
   ]
  },
  {
   "label": "People",
   "items": [
    "Communicate the plan",
    "Consultation, offers, hiring",
    "Onboard transfers"
   ]
  },
  {
   "label": "Property",
   "items": [
    "Notice periods confirmed",
    "Oakmont handback",
    "Ridgeway and Brookline exit"
   ]
  },
  {
   "label": "Finance",
   "items": [
    "Baseline and tracking",
    "Monthly benefit reporting",
    "Close-out and audit"
   ]
  }
 ]
}
```

### `stage_tracker`

Stage tracker: items against stages; shape carries the state, the legend says so.

```json
{
 "pattern": "stage_tracker",
 "eyebrow": "Readiness by site",
 "headline": "Easton is ready to receive; Fairmont needs its hiring stage closed first.",
 "stages": [
  "Capacity check",
  "Lease terms",
  "Hiring",
  "Systems cut-over",
  "Dry run"
 ],
 "rows": [
  {
   "label": "Easton (receives Brookline, Oakmont)",
   "cells": [
    "done",
    "done",
    "done",
    "done",
    "progress"
   ],
   "note": "Dry run week 2"
  },
  {
   "label": "Fairmont (receives Ridgeway)",
   "cells": [
    "done",
    "done",
    "progress",
    "none",
    "none"
   ],
   "note": "11 of 18 hires",
   "highlight": true
  },
  {
   "label": "Ridgeway exit",
   "cells": [
    "done",
    "progress",
    "none",
    "none",
    "none"
   ],
   "note": "Break clause 2027"
  },
  {
   "label": "Brookline exit",
   "cells": [
    "done",
    "done",
    "none",
    "none",
    "none"
   ],
   "note": "Sublet in market"
  },
  {
   "label": "Oakmont exit",
   "cells": [
    "done",
    "done",
    "done",
    "done",
    "done"
   ],
   "note": "Complete"
  }
 ],
 "noteHeader": "Where it stands",
 "source": "Transition PMO tracker (fictional)"
}
```

## Trade-off and maturity

`balance.heavier` is left|right and lowers that side. `maturity.current` is 1-based. `curve` draws a native smoothed line with an optional `marker`.

### `balance`

Balance: heavier side sits lower.

```json
{
 "pattern": "balance",
 "eyebrow": "The trade-off",
 "headline": "The benefits outweigh the costs by year two.",
 "heavier": "right",
 "left": {
  "kicker": "Costs",
  "title": "$2.6M one-time",
  "items": [
   "Lease exit penalties $1.1M",
   "Severance and transfer $0.9M",
   "Re-routing and pilot $0.4M",
   "Systems and moves $0.2M"
  ]
 },
 "right": {
  "kicker": "Benefits",
  "title": "$4.1M a year",
  "items": [
   "Lease and facilities $2.3M",
   "Labour $1.6M",
   "Overhead $0.5M",
   "Less fuel $0.3M"
  ],
  "highlight": true
 },
 "source": "Transition model v3 (fictional)"
}
```

### `maturity`

Maturity stages with the current one highlighted.

```json
{
 "pattern": "maturity",
 "eyebrow": "Network planning maturity",
 "headline": "Halvard plans depot by depot; the model requires network-level planning.",
 "current": 2,
 "stages": [
  {
   "title": "Local",
   "body": "Each depot plans its own routes."
  },
  {
   "title": "Coordinated",
   "body": "Depots share a weekly plan."
  },
  {
   "title": "Central",
   "body": "One planner, one order book."
  },
  {
   "title": "Dynamic",
   "body": "Volume rebalances weekly on the model."
  }
 ],
 "source": "Planning maturity assessment, Aug 2026 (fictional)"
}
```

### `curve`

Curve as a native smoothed line.

```json
{
 "pattern": "curve",
 "eyebrow": "Cost per consignment",
 "headline": "Unit cost falls until a site passes 80% utilisation, then rises.",
 "curve": {
  "labels": [
   "30%",
   "40%",
   "50%",
   "60%",
   "70%",
   "80%",
   "90%",
   "100%"
  ],
  "values": [
   9.8,
   8.1,
   7.0,
   6.3,
   5.9,
   5.8,
   6.4,
   7.9
  ],
  "title": "Cost per consignment ($) by utilisation",
  "marker": {
   "at": 5,
   "label": "Target 70–80%"
  }
 },
 "card": {
  "kicker": "Why the curve turns",
  "title": "Congestion costs",
  "body": "Above 80%, waiting time and overtime outrun the fixed-cost saving."
 },
 "source": "Halvard cost model (fictional)"
}
```

## Architecture, status and governance

`status` values take the standard set: done|green|on track, progress|amber|at risk, risk|red|blocked, none|not started; every chip carries its word and a red names the decision and its owner. `decision_rights` cells are role codes: P proposes, A approves, E executes, C consulted, I informed; `gate` names the control each decision passes, with a `gateIcon`.

### `panels`

Panels: zones with named products; live chips in teal, the highlighted zone navy with an amber edge.

```json
{
 "pattern": "panels",
 "eyebrow": "The planning stack",
 "headline": "One planning tool, feeding every depot.",
 "legend": [
  {
   "label": "proposed",
   "live": true
  },
  {
   "label": "alternative"
  }
 ],
 "panels": [
  {
   "label": "Order intake",
   "caption": "one order book for the network",
   "chips": [
    {
     "text": "Existing TMS",
     "live": true
    },
    "Replace TMS"
   ]
  },
  {
   "label": "Route planning",
   "caption": "central planning replaces depot planning",
   "highlight": true,
   "chips": [
    {
     "text": "Planner module",
     "live": true
    },
    "Third-party optimiser"
   ]
  },
  {
   "label": "Depot execution",
   "caption": "docks and drivers work the plan",
   "chips": [
    {
     "text": "Current yard system",
     "live": true
    },
    "New yard system"
   ]
  },
  {
   "label": "Reporting",
   "caption": "utilisation per dock per day",
   "chips": [
    {
     "text": "Existing BI",
     "live": true
    },
    "New dashboard"
   ]
  }
 ],
 "band": "No new platform is required — the planning module is a licence, not a project."
}
```

### `map`

Two-column mapping.

```json
{
 "pattern": "map",
 "eyebrow": "The analogy",
 "headline": "You already did this with warehouses in 2021.",
 "leftTitle": "WAREHOUSES, 2021",
 "rightTitle": "DEPOTS, 2027",
 "rows": [
  {
   "left": "Eleven warehouses, four below 50% used",
   "right": "Nine depots, three below 40% used"
  },
  {
   "left": "Consolidated to seven over twelve months",
   "right": "Consolidate to six over nine months"
  },
  {
   "left": "Saved $6M a year, service unchanged",
   "right": "Save $4.1M a year, 17 accounts affected"
  }
 ],
 "band": "The playbook exists — this is the second run of it."
}
```

### `tiers`

Tiers: stacked columns.

```json
{
 "pattern": "tiers",
 "eyebrow": "How the saving lands",
 "headline": "One-time, recurring, and optional.",
 "columns": [
  {
   "kicker": "ONE-TIME",
   "items": [
    {
     "title": "Transition cost",
     "body": "$2.6M across nine months."
    },
    {
     "title": "Asset disposal",
     "body": "Racking and yard equipment, $0.2M recovered."
    }
   ]
  },
  {
   "kicker": "RECURRING",
   "items": [
    {
     "title": "Net saving",
     "body": "$4.1M a year from month ten.",
     "accent": true
    },
    {
     "title": "Maintenance",
     "body": "Two fewer sites to maintain."
    }
   ]
  },
  {
   "kicker": "OPTIONAL",
   "variant": "outline",
   "items": [
    {
     "title": "Sublet Brookline",
     "body": "Market rent covers 60% of the remaining lease."
    },
    {
     "title": "Fourth closure",
     "body": "Carlton if volume falls another 10%."
    }
   ]
  }
 ]
}
```

### `status`

The honest RAG slide.

```json
{
 "pattern": "status",
 "eyebrow": "Where the workstreams stand",
 "headline": "Two of four foundations are in place.",
 "subtitle": "Green is done, amber is in flight, red needs a decision from the board.",
 "rows": [
  {
   "name": "Route model",
   "status": "done",
   "detail": "Version 3 validated against FY25 actuals."
  },
  {
   "name": "Site assessment",
   "status": "done",
   "detail": "Easton and Fairmont confirmed as receiving sites."
  },
  {
   "name": "Union engagement",
   "status": "risk",
   "detail": "Consultation cannot start before board approval; four-month clock."
  },
  {
   "name": "Transition budget",
   "status": "risk",
   "label": "Needs decision",
   "detail": "$2.6M requested; not in the FY27 plan."
  }
 ],
 "band": "The two reds are decisions, not engineering — and they gate everything after them."
}
```

### `decision_rights`

Decision rights: who proposes, approves and executes, and the gate each decision passes.

```json
{
 "pattern": "decision_rights",
 "eyebrow": "Who decides what",
 "headline": "Every move needs the network board's approval; sites execute their own.",
 "roles": [
  "Site manager",
  "Ops director",
  "Network board",
  "HR"
 ],
 "rows": [
  {
   "decision": "Close a depot",
   "cells": [
    "C",
    "P",
    "A",
    "C"
   ],
   "gate": "Board minute",
   "gateIcon": "stamp",
   "highlight": true
  },
  {
   "decision": "Re-route a postcode",
   "cells": [
    "E",
    "A",
    "I",
    "I"
   ],
   "gate": "Change ticket",
   "gateIcon": "ticket"
  },
  {
   "decision": "Move staff between sites",
   "cells": [
    "C",
    "P",
    "I",
    "A"
   ],
   "gate": "Union consultation",
   "gateIcon": "handshake"
  },
  {
   "decision": "Run a peak-week dry run",
   "cells": [
    "E",
    "A",
    "I",
    ""
   ],
   "gate": "Ops calendar",
   "gateIcon": "calendar"
  }
 ],
 "gateHeader": "Gate"
}
```

### `image`

An image slide is for a real capture at full size. Below 800 px the gate refuses it; ask for a proper screenshot.

```json
{
 "pattern": "image",
 "eyebrow": "Operations · Status screen",
 "audience": "depot managers",
 "headline": "The console shows a depot's day on one screen.",
 "subtitle": "Screenshot of the status view; callouts mark what to read first.",
 "image": "sources/depot_console.png",
 "caption": "Halvard Depot Console, status view, fictional data.",
 "callouts": [
  {
   "title": "Utilisation card",
   "body": "The one number the morning stand-up runs on."
  },
  {
   "title": "Bay allocation",
   "body": "Highlighted bar is the bay running behind plan."
  },
  {
   "title": "Sync time",
   "body": "If older than an hour, the feed has stalled."
  }
 ],
 "imageKind": "screenshot"
}
```

## Relationships

How things connect: one hub and the groups around it. Use `ecosystem` for systems, teams, suppliers or concepts arranged around a centre. Groups take `label`, `flow` (in | out | both | none: which way information moves, drawn as an arrow), a short `verb` for the connector, `highlight`, and up to six `nodes` ({name, role, icon, status: "planned"}). Four groups and fourteen nodes at most; the hub takes `kicker`, `name`, `body` and `chips` (its own parts, e.g. what it runs on). Cards size themselves: roomy, then compact on one line, then two across. Leave the band off when there are more than eight nodes. Never draw a diagram elsewhere and paste it in through `image`: the gate refuses an image slide whose `imageKind` is not `screenshot` or `photo`.

### `ecosystem`

Ecosystem: a hub and up to four groups around it; arrows show which way information moves; dashed nodes are planned. Native shapes, never a pasted diagram.

```json
{
 "pattern": "ecosystem",
 "eyebrow": "The planning system",
 "headline": "The route planner sits between the order book and the depots, with finance and HR alongside.",
 "hub": {
  "kicker": "Proposed hub",
  "name": "Route planner",
  "body": "One planning run for the whole network, replacing nine depot schedules.",
  "chipsLabel": "Built on",
  "chips": [
   "Existing TMS licence",
   "Network data warehouse"
  ]
 },
 "groups": [
  {
   "label": "Demand and data",
   "flow": "in",
   "verb": "feeds",
   "nodes": [
    {
     "name": "Order book",
     "role": "Consignments by day",
     "icon": "inbox"
    },
    {
     "name": "Telematics",
     "role": "Truck positions",
     "icon": "location"
    },
    {
     "name": "Customer master",
     "role": "Delivery windows",
     "icon": "person"
    }
   ]
  },
  {
   "label": "Controls",
   "flow": "both",
   "verb": "checks",
   "nodes": [
    {
     "name": "Finance",
     "role": "Cost per drop",
     "icon": "dollar"
    },
    {
     "name": "HR rota",
     "role": "Driver hours",
     "icon": "calendar"
    }
   ]
  },
  {
   "label": "Execution",
   "flow": "out",
   "verb": "sends plans",
   "highlight": true,
   "nodes": [
    {
     "name": "Depot yard system",
     "role": "Dock allocation",
     "icon": "warehouse"
    },
    {
     "name": "Driver app",
     "role": "Route and stops",
     "icon": "mobile"
    }
   ]
  },
  {
   "label": "Reporting",
   "flow": "out",
   "verb": "reports",
   "nodes": [
    {
     "name": "Operations dashboard",
     "role": "Utilisation by dock",
     "icon": "dashboard"
    },
    {
     "name": "Carbon reporting",
     "role": "Emissions by route",
     "icon": "globe",
     "status": "planned"
    }
   ]
  }
 ],
 "source": "Planning systems inventory, Aug 2026 (fictional)"
}
```

## The one-slide family

The whole argument on one slide: the headline is the answer, the body is the proof, the strip at the foot is the ask and the risk. Pick by the message: a decision to ask for (`one_decision`), one figure that carries the argument (`one_number`), a status call (`one_status`), a before-and-after change (`one_shift`), a case that needs its context to land (`one_story`). Built for a single-slide request; inside a longer deck, use one per section at most, as an impact slide (the gates count them). `ask` and `risk` are `{text, who, when, owner, mitigation}`; all fields but `text` optional.

### `one_decision`

One-slide decision: the recommendation, three reasons, the ask, the risk.

```json
{
 "pattern": "one_decision",
 "eyebrow": "Decision",
 "headline": "Approve consolidating three depots; it saves $4.1M a year from year two.",
 "reasons": [
  {
   "title": "The three sites are structurally underused",
   "body": "34–39% utilisation for six quarters; the network runs at 58%."
  },
  {
   "title": "Their volume fits next door",
   "body": "Easton and Fairmont absorb it with 18% headroom to spare."
  },
  {
   "title": "Customers barely notice",
   "body": "17 of 2,140 customers lose next-day service; all are offered a two-day rate."
  }
 ],
 "ask": {
  "text": "Approve the plan and release the $2.6M transition budget.",
  "who": "The board",
  "when": "By Oct 15",
  "cost": "$2.6M one-time"
 },
 "risk": {
  "text": "Union consultation at Ridgeway could add four months.",
  "owner": "HR director",
  "mitigation": "Exit Oakmont and Brookline first."
 },
 "source": "Halvard depot P&L FY25; route model v3 (fictional)"
}
```

### `one_number`

One number: the figure, what it measures, what drives it, so what.

```json
{
 "pattern": "one_number",
 "eyebrow": "The saving",
 "headline": "Consolidation saves $4.1M a year, three-quarters of it from two lines.",
 "figure": {
  "value": "$4.1M",
  "label": "annual saving at run-rate",
  "period": "From month ten, net of $0.3M extra fuel",
  "context": "vs $2.6M one-time cost"
 },
 "drivers": [
  {
   "icon": "building",
   "title": "Leases: $1.9M",
   "body": "Three leases end or break by 2029."
  },
  {
   "icon": "team",
   "title": "Labour: $1.3M",
   "body": "Two larger crews replace three small ones."
  },
  {
   "icon": "layers",
   "title": "Overhead: $1.2M",
   "body": "Site management, security and utilities."
  }
 ],
 "so_what": "The budget pays back inside eight months of run-rate saving.",
 "source": "Halvard depot P&L FY25 (fictional)"
}
```

### `one_status`

One-slide status: the overall call, the workstreams, the one red and the ask.

```json
{
 "pattern": "one_status",
 "eyebrow": "Status",
 "headline": "The transition is on plan except for Fairmont hiring, which gates Ridgeway.",
 "overall": {
  "status": "amber",
  "label": "At risk",
  "summary": "Two of three site moves are on plan; Fairmont needs seven more hires before Ridgeway can move."
 },
 "rows": [
  {
   "name": "Oakmont exit",
   "status": "done",
   "label": "Complete",
   "detail": "Closed week 8; volume at Easton."
  },
  {
   "name": "Brookline exit",
   "status": "green",
   "detail": "Sublet in market; move in month five."
  },
  {
   "name": "Fairmont hiring",
   "status": "red",
   "label": "Off track",
   "detail": "11 of 18 hired; local market tight."
  },
  {
   "name": "Systems cut-over",
   "status": "amber",
   "detail": "Easton done; Fairmont waits on hiring."
  }
 ],
 "issue": {
  "text": "Fairmont is seven hires short; Ridgeway cannot move until they start.",
  "owner": "HR director",
  "ask": "Approve a 10% retention premium for Fairmont roles.",
  "askOf": "Ops director",
  "by": "Next Friday"
 },
 "source": "Transition PMO tracker (fictional)"
}
```

### `one_shift`

One-slide shift: before and after with the change called out, then the ask and the risk.

```json
{
 "pattern": "one_shift",
 "eyebrow": "What changes",
 "headline": "Consolidation turns three small depots into two full ones.",
 "beforeLabel": "Today: nine depots",
 "afterLabel": "After: six depots",
 "rows": [
  {
   "before": "Three depots at 34–39% utilisation",
   "after": "Two receiving depots at 74–77%",
   "delta": "+38 pts"
  },
  {
   "before": "$5.2M fixed cost for 14% of volume",
   "after": "$1.1M added cost at the receiving sites",
   "delta": "−$4.1M"
  },
  {
   "before": "Next-day for 100% of customers",
   "after": "Next-day for 99.2% of customers",
   "delta": "−17 cust."
  }
 ],
 "ask": {
  "text": "Approve the move of three depots into two.",
  "who": "The board",
  "when": "Oct 15"
 },
 "risk": {
  "text": "Peak-week capacity at Easton is tight.",
  "owner": "Ops director",
  "mitigation": "December dry run."
 },
 "source": "Route model v3 (fictional)"
}
```

### `one_story`

One-slide story: situation, complication, resolution, then the ask and the risk.

```json
{
 "pattern": "one_story",
 "eyebrow": "The case in one slide",
 "headline": "Close three underused depots now, before the Oakmont lease renews at a 12% step-up.",
 "situation": "Halvard runs nine depots sized for a network that had the Carver contract.",
 "complication": "Carver ended; three depots have run below 40% utilisation for six quarters, and the Oakmont lease renews in March.",
 "resolution": "Move their volume to Easton and Fairmont over nine months: $4.1M a year saved, next-day kept for 99.2% of customers.",
 "ask": {
  "text": "Approve the plan and the $2.6M budget.",
  "who": "The board",
  "when": "Oct 15"
 },
 "risk": {
  "text": "Ridgeway union consultation could add four months.",
  "owner": "HR director"
 },
 "source": "Halvard depot P&L FY25; property schedule (fictional)"
}
```

## Rules that hold across patterns

- One highlight per slide, in amber: the one bar, row, cell, card or quadrant the eye should land on. `highlight: true` renders a card navy with an amber edge; `accent: true` renders it soft teal (supporting, not the point). On most slides, nothing is highlighted.
- Colour is never the only signal: status chips carry their word, lights carry a letter, balls and stage cells are drawn as fractions with a legend, heatmap cells print their value, KPI changes say better or worse.
- The status set is fixed: green 15803D, amber D97706, red B91C1C, grey for not started. Never soften a red to amber.
- Cards: two to six; never a fifth squeezed in where four fit; one highlighted at most.
- Charts stay native. Never an image of a chart.
- Navy is for emphasis: `statement`, dark `cards`, dividers and the title. One navy content slide in five at most; `statement` never back to back, never last.
- Georgia for headlines and big figures, Calibri for everything else. Nothing else.
- If a slide genuinely fits no pattern, compose it from kit primitives (`assets/deck_style_kit.js`) in a one-off script. If you need the same shape twice, add it to `assets/deck_patterns.js` and `deck_renderer.js`, document it here, and add it to the catalogue brief. That is the promotion rule that stops the style drifting one improvised slide at a time.
