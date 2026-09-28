# Fact audit: Example_Deck.pptx

67 facts on 12 slides; 67 traced, 0 not.

| slide | fact | provenance | ledger | where |
|---|---|---|---|---|
| 1 | 40% | derived | E21 | body |
| 1 | 12% | stated | E10 | body |
| 1 | FY25 | period-label |  | body |
| 1 | Aug 2026 | period-label |  | body |
| 2 | $4.1M | stated | E6, E8 | headline |
| 2 | $2.6M | stated | E7, E8 | headline |
| 2 | 99.2% | stated | E5 | headline |
| 2 | $4.1M | stated | E6, E8 | body |
| 2 | $2.6M | stated | E7, E8 | body |
| 2 | 99.2% | stated | E5 | body |
| 2 | $5.2M | derived | E3 | body |
| 2 | 14% | derived | E3 | body |
| 2 | 18% | stated | E4 | body |
| 2 | 99.2% | stated | E5 | body |
| 2 | $4.1M | stated | E6, E8 | body |
| 2 | $2.6M | stated | E7, E8 | body |
| 3 | 45% | stated | E2 | headline |
| 3 | Q1 25 | stated |  | body |
| 3 | Q2 25 | period-label |  | body |
| 3 | Q3 25 | period-label |  | body |
| 3 | Q4 25 | period-label |  | body |
| 3 | Q1 26 | period-label |  | body |
| 3 | Q2 26 | stated |  | body |
| 3 | $5.2M | derived | E3 | body |
| 3 | 14% | derived | E3 | body |
| 4 | 2024 | stated | E11 | body |
| 4 | 2023 | stated | E20 | body |
| 4 | 40% | derived | E21 | body |
| 4 | $5.2M | derived | E3 | body |
| 4 | 14% | derived | E3 | body |
| 5 | 18% | stated | E4 | body |
| 5 | 99.2% | stated | E5 | body |
| 6 | 2,140 | stated | E5, E16 | headline |
| 6 | 2,140 | stated | E5, E16 | body |
| 6 | 2,061 | stated | E16 | body |
| 7 | $4.4M | derived | E17 | headline |
| 7 | $4.1M | stated | E6, E8 | headline |
| 7 | 4.1 | stated | E6, E8 | chart |
| 7 | 2.3 | derived | E3, E6, E17 | chart |
| 7 | 1.6 | stated | E6, E17 | chart |
| 7 | 0.5 | stated | E6, E17, E18 | chart |
| 7 | 0.3 | stated | E6, E18, E19 | chart |
| 7 | $2.6M | stated | E7, E8 | body |
| 7 | $4.1M | stated | E6, E8 | body |
| 7 | $2.6M | stated | E7, E8 | body |
| 8 | Q4 26 | period-label |  | body |
| 8 | Q1 27 | period-label |  | body |
| 8 | Q2 27 | period-label |  | body |
| 8 | Q3 27 | period-label |  | body |
| 8 | 0.3 | stated | E6, E18, E19 | body |
| 8 | 1.6 | stated | E6, E17 | body |
| 8 | 2.3 | derived | E3, E6, E17 | body |
| 8 | 0.5 | stated | E6, E17, E18 | body |
| 9 | $2.6M | stated | E7, E8 | table |
| 10 | $2.6M | stated | E7, E8 | body |
| 12 | 34% | stated | E1 | table |
| 12 | 2.1 | derived | E18 | table |
| 12 | 1.4 | stated | E19 | table |
| 12 | 2027 | stated | E19 | table |
| 12 | 37% | stated | E1 | table |
| 12 | 1.8 | derived | E18 | table |
| 12 | 0.9 | derived | E18, E19 | table |
| 12 | 2029 | stated | E19 | table |
| 12 | 39% | stated | E1, E21 | table |
| 12 | 1.3 | derived | E18 | table |
| 12 | 0.3 | stated | E6, E18, E19 | table |
| 12 | Mar 2027 | stated |  | table |

## Failures

- none

## Warnings

- slide 1: period label 'FY25' not itself in the ledger (fine for an axis or column header if the range is)
- slide 1: period label 'Aug 2026' not itself in the ledger (fine for an axis or column header if the range is)
- slide 3: period label 'Q2 25' not itself in the ledger (fine for an axis or column header if the range is)
- slide 3: period label 'Q3 25' not itself in the ledger (fine for an axis or column header if the range is)
- slide 3: period label 'Q4 25' not itself in the ledger (fine for an axis or column header if the range is)
- slide 3: period label 'Q1 26' not itself in the ledger (fine for an axis or column header if the range is)
- slide 8: period label 'Q4 26' not itself in the ledger (fine for an axis or column header if the range is)
- slide 8: period label 'Q1 27' not itself in the ledger (fine for an axis or column header if the range is)
- slide 8: period label 'Q2 27' not itself in the ledger (fine for an axis or column header if the range is)
- slide 8: period label 'Q3 27' not itself in the ledger (fine for an axis or column header if the range is)

## Rubric

| item | result |
|---|---|
| Render stamp present and ledger matches | pass |
| No invented entities on illustrative slides | pass |
| Every fact traced | pass |
| Source line on every data slide | pass |
| No label headlines | FAIL |
| Draft/Final marking present | pass |
| Illustrative stated on the slide, not only in notes | pass |
| One currency, no conversion | pass |
| Figures formatted consistently | pass |
| Titles read as one argument (agent judgment) | judged by the agent on a fresh read |
| Four beats at the right grain (agent judgment) | judged by the agent on a fresh read |
| Visual balance passed on every slide (eye pass) | judged by the agent on a fresh read |
