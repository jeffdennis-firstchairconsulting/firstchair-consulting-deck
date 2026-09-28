# Icons

112 icons, pre-rendered from Lucide (ISC licence, `assets/icons/LICENSE.txt`) in two colourways (white glyphs for teal and navy badges; navy glyphs for mint and amber badges and bare icons), packed into `assets/icons/icon_images.json`. `assets/icons/icons.json` is the index of names and concepts: read that one, never the image file. The renderer picks the colourway; you pick the name.

## How to choose

- **Pick by the idea, not the word.** Read the concepts column. A slide about approval gates wants `stamp` or `gavel`, not `check_circle`; a slide about waiting wants `hourglass`, not `clock`.
- **One icon, one idea.** Never the same icon twice on a slide; `check_brief.js` blocks it. Two cards with the same icon are telling the reader they are the same thing.
- **Vary across the deck.** The gate warns when an icon appears on more than two slides. When an idea genuinely recurs (the same workstream on three slides), keeping its icon is the exception worth making; otherwise reach for a neighbour in the same group.
- **Icons label, they do not decorate.** Use them where the reader scans: card heads, KPI tiles, driver lists, the title rail, status rows. A slide of prose does not need one. If every element on a slide has an icon, drop them all.
- **Never an icon in place of a word.** The label still says what the icon shows.
- **Unknown name = blocker.** The gate suggests near names. If nothing here fits, use no icon; do not reach for an image file. A concept that keeps coming up with no icon is a candidate for the library (render it with the same Lucide source and add it to `icons.json`).

Fields that take an icon: `cards[].icon`, `kpis[].icon`, `drivers[].icon` (one_number), `figures[].icon` (title), `rows[].icon` (status), `right.icon` (contrast), `rows[].gateIcon` (decision_rights), `icon` (statement), `effectIcon` (leading_to), `card.icon` (chart).

## Security and control

| name | use for |
|---|---|
| `shield` | security, protection, compliance baseline |
| `lock` | restricted access, locked down, cannot bypass |
| `key` | credentials, access grant, permission |
| `fingerprint` | identity, authentication, unique |
| `stamp` | approval, sign-off, authorisation |
| `gavel` | policy, ruling, enforcement decision |
| `landmark` | regulator, institution, governing body |

## Governance and process

| name | use for |
|---|---|
| `clipboard_check` | audit passed, checklist complete, validation |
| `checklist` | requirements, criteria, steps to complete |
| `workflow` | process flow, orchestration |
| `pull_request` | proposed change, peer review |
| `merge` | merge, consolidate, integrate into baseline |
| `branch` | variant, fork, parallel version |
| `split` | divergence, two paths, segmentation |
| `filter` | screening, gating, narrowing down |
| `ticket` | change ticket, request, service ticket |
| `scale` | trade-off, fairness, weighing options |
| `signpost` | direction, decision point, choice |
| `milestone` | milestone, checkpoint on a path |

## People

| name | use for |
|---|---|
| `team` | team, users, community |
| `person` | an individual, owner, persona |
| `approver` | approver, verified person, accountable owner |
| `onboard` | onboarding, new users, adoption |
| `handshake` | partnership, agreement, vendor |
| `training` | training, enablement, learning |
| `support` | support, service desk, help line |
| `megaphone` | announcement, communication, launch message |
| `feedback` | feedback, conversation, comment |
| `briefcase` | business, executive, commercial |

## Technology

| name | use for |
|---|---|
| `server` | infrastructure, servers, devices in a fleet |
| `server_config` | device configuration, managed infrastructure |
| `database` | data store, system of record |
| `cloud` | cloud, hosted service |
| `network` | network topology, connected systems |
| `router` | network device, router, switch |
| `chip` | compute, processing, hardware |
| `terminal` | command line, manual CLI work |
| `code` | code, template, script |
| `plug` | integration, connector, plug-in |
| `link` | connection, linkage, traceability |
| `bot` | automation, agent, robot |
| `brain` | intelligence, reasoning, AI |
| `laptop` | end-user device, workstation |
| `mobile` | mobile, app |
| `storage` | storage, backup, capture |
| `wifi` | connectivity, wireless |
| `dashboard` | dashboard, console, single view |

## Measures and results

| name | use for |
|---|---|
| `gauge` | performance, speed, capacity |
| `bar_chart` | volume, comparison of amounts |
| `line_chart` | trend over time |
| `trend_up` | growth, improvement, increase |
| `trend_down` | reduction, decline, cost down |
| `target` | goal, target, focus |
| `pulse` | monitoring, health, live signal |
| `award` | quality, achievement, recognition |

## Time

| name | use for |
|---|---|
| `clock` | timing, schedule, time of day |
| `calendar` | date, plan, calendar |
| `calendar_check` | scheduled and confirmed, date met |
| `hourglass` | waiting, lead time, running out |
| `timer` | speed, duration, time saved |
| `history` | history, audit trail, past versions |

## Money

| name | use for |
|---|---|
| `dollar` | cost, value, spend |
| `savings` | savings, reserve |
| `wallet` | budget, funding |
| `receipt` | invoice, charge, spend record |

## Operations and places

| name | use for |
|---|---|
| `truck` | logistics, delivery, transport |
| `package` | release, package, shipment |
| `inventory` | inventory, stock, catalog of items |
| `factory` | production, manufacturing, plant |
| `warehouse` | site, depot, facility |
| `building` | office, business unit, organisation |
| `location` | location, site, region |
| `globe` | global, all regions, worldwide |
| `route` | path, rollout route, journey |

## Change and momentum

| name | use for |
|---|---|
| `rocket` | launch, go-live, acceleration |
| `bolt` | speed, instant, power |
| `refresh` | update, sync, refresh cycle |
| `repeat` | repeatable, recurring, routine |
| `rollback` | rollback, undo, reversal |
| `layers` | layers, stack, tiers of a solution |
| `puzzle` | fit, missing piece, component |
| `sparkles` | new capability, enhancement |
| `lightbulb` | idea, insight, recommendation |
| `compass` | strategy, orientation, direction |
| `mountain` | challenge, obstacle, ambition |
| `flag` | goal reached, marker, finish line |

## Status and signals

| name | use for |
|---|---|
| `check_circle` | success, done, confirmed |
| `warning` | risk, warning, caution |
| `alert` | issue, attention needed |
| `fail` | failure, blocked, rejected |
| `ban` | not allowed, out of scope, prohibited |
| `bell` | notification, alerting |
| `mute` | mute alerts, suppress notifications |
| `eye` | visibility, transparency, preview |
| `search` | discovery, investigation, lookup |
| `lifebuoy` | help, recovery, rescue |
| `umbrella` | resilience, coverage, protection from impact |

## Knowledge and work

| name | use for |
|---|---|
| `test` | testing, pilot, experiment |
| `microscope` | analysis, deep inspection |
| `document` | document, runbook, report |
| `guide` | guide, knowledge base, reference |
| `archive` | records, archive, retention |
| `inbox` | intake, requests queue |
| `send` | deploy, dispatch, submit |
| `share` | share, distribute |
| `upload` | push, publish, upload |
| `download` | pull, adopt, download |
| `settings` | settings, configuration, tuning |
| `wrench` | maintenance, fix, remediation |
| `hammer` | build, construct |
| `presentation` | briefing, readout, presentation |
| `edit` | edit, draft, author |
