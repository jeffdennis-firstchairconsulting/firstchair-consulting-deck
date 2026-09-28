#!/usr/bin/env node
/* ============================================================================
 *  check_brief.js — the brief gate. Run before rendering, every time.
 *
 *      node scripts/check_brief.js brief.json
 *
 *  Exit 1 = blockers; do not build. Exit 0 = build. Prints the questions to
 *  ask the user, batched, for anything a script cannot supply.
 * ========================================================================== */
const fs = require("fs");
const path = require("path");
let PATTERN_NAMES, ICONS;
try {
  ({ PATTERN_NAMES } = require(fs.existsSync(path.join(__dirname, "deck_renderer.js")) ? path.join(__dirname, "deck_renderer.js") : path.join(__dirname, "..", "assets", "deck_renderer.js")));
  ({ ICONS } = require(fs.existsSync(path.join(__dirname, "deck_style_kit.js")) ? path.join(__dirname, "deck_style_kit.js") : path.join(__dirname, "..", "assets", "deck_style_kit.js")));
} catch (e) {
  if (/pptxgenjs/.test(e.message)) console.error("RUNTIME: pptxgenjs is not installed. Run: npm install pptxgenjs. This is a missing dependency, not a problem with the brief.");
  else console.error("RUNTIME: cannot load the renderer: " + e.message);
  process.exit(3);
}

const META = {
  customer: 'Which customer or organisation is this deck for? ("Internal" if not customer-facing.)',
  program: "What is the programme, offering, or project called?",
  docType: 'What kind of document is this, for the footer? (proposal, status readout, findings, business case, working session)',
};
const META_RECOMMENDED = {
  audience: "Who is in the room, specifically: who decides, what they already believe, how technical?",
  objective: "What should happen because of this deck?",
  provenance: "What grounds the deck: what is measured, live, or booked? (Goes under the title.)",
};
const DATA = new Set(["chart", "waterfall", "scorecard", "heatmap", "matrix", "roadmap", "gantt", "maturity", "table", "curve", "kpi_strip", "stage_tracker", "one_number", "one_status"]);
const ONE = new Set(["one_decision", "one_number", "one_status", "one_shift", "one_story"]);
const BAND_STYLES = new Set(["statement", "takeaway", "bottom_line"]);
const REQ = {
  title: ["headline"], section: ["headline"], backup: [], statement: ["headline"], agenda: ["items"], exec_summary: ["headline", "keyLines"],
  ask: ["headline"], risks: ["headline", "rows"], sources: ["items"],
  cards: ["headline", "cards"], quote: ["headline", "quote"],
  phases: ["headline", "phases"], chevrons: ["headline", "steps"], steps: ["headline", "steps"],
  leading_to: ["headline", "causes", "effect"], funnel: ["headline", "stages"],
  logic_tree: ["headline", "root", "children"], driver_tree: ["headline", "root", "children"], hypothesis_tree: ["headline", "answer", "hypotheses"],
  table: ["headline", "columns", "rows"], scorecard: ["headline", "columns", "rows"], heatmap: ["headline", "columns", "rows"],
  chart: ["headline", "chart"], waterfall: ["headline", "waterfall"], matrix: ["headline", "items"],
  gantt: ["headline", "periods", "rows"], roadmap: ["headline", "periods", "rows"], phases_threads: ["headline", "phases", "threads"],
  balance: ["headline", "left", "right"], maturity: ["headline", "stages"], curve: ["headline", "curve"],
  panels: ["headline", "panels"], map: ["headline", "rows"], tiers: ["headline", "columns"], status: ["headline", "rows"],
  image: ["headline", "image"],
  one_decision: ["headline", "reasons", "ask"], one_number: ["headline", "figure", "drivers"], one_status: ["headline", "overall", "rows"],
  one_shift: ["headline", "rows"], one_story: ["headline", "situation", "complication", "resolution"],
  ecosystem: ["headline", "hub", "groups"],
  kpi_strip: ["headline", "kpis"], stage_tracker: ["headline", "stages", "rows"], contrast: ["headline", "left", "right"], decision_rights: ["headline", "roles", "rows"],
};
const IMAGE_MIN_WIDTH = 800;
function imageSize(f) { try { return require("child_process").execFileSync("python3", ["-c", `from PIL import Image;im=Image.open('${f}');print(im.size[0],im.size[1])`]).toString().trim().split(" ").map(Number); } catch { return null; } }
const Q = {
  chart: "Slide {n}: the actual numbers and their labels, units, and period. Real or illustrative?",
  waterfall: "Slide {n}: the starting total, each step with its sign, and the end total.",
  scorecard: "Slide {n}: the options, the criteria, and how each option scores on each.",
  status: "Slide {n}: which workstreams, the honest status of each, and for every red the decision and its owner.",
  ask: "Slide {n}: what exactly is being asked for: the decision, from whom, by when?",
  exec_summary: "Slide {n}: the answer in one sentence, the two-to-four key lines, the decision, and the biggest risk.",
  risks: "Slide {n}: each risk with impact, owner, and mitigation.",
  gantt: "Slide {n}: the periods, the workstreams with start and end, and milestones.",
  matrix: "Slide {n}: the two axes and where each item sits on them.",
  one_decision: "Slide {n}: the recommendation, two or three reasons with their evidence, and the ask (what, who, by when).",
  one_number: "Slide {n}: the figure with its unit and period, and the two or three things that drive it.",
  one_status: "Slide {n}: the overall call, each workstream's honest status, and the one red with its owner and ask.",
  one_shift: "Slide {n}: the matched before and after rows, and the change each one represents.",
  one_story: "Slide {n}: the situation, the complication, and the resolution, one sentence each.",
  kpi_strip: "Slide {n}: each metric with its value, target, period, and change since last time.",
  stage_tracker: "Slide {n}: the stages, the items, and where each item stands on each stage.",
  decision_rights: "Slide {n}: the decisions, the roles, and who proposes, approves and executes each one.",
  ecosystem: "Slide {n}: what sits in the middle, the systems or groups around it, what each one does, and which way information moves between them.",
  image: "Slide {n}: is this image a real screenshot or photograph? If it is a diagram or chart, it must be built with a pattern instead.",
};
const PLACEHOLDER = /\b(TBD|TODO|XXX+|FIXME|lorem ipsum|placeholder|\?\?\?)\b/i;
const NO_HEADLINE_CHECK = new Set(["section", "backup", "agenda", "sources", "title"]);

const blockers = [], warnings = [], questions = [];
const iconUse = {};
function scan(node, where) {
  if (typeof node === "string") { if (PLACEHOLDER.test(node)) warnings.push(`${where}: unresolved placeholder ${JSON.stringify(node.slice(0, 50))}`); }
  else if (Array.isArray(node)) node.forEach((v, i) => scan(v, `${where}[${i}]`));
  else if (node && typeof node === "object") Object.entries(node).forEach(([k, v]) => scan(v, `${where}.${k}`));
}
const empty = v => v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length) || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length);

function main(file) {
  let brief;
  try { brief = JSON.parse(fs.readFileSync(file, "utf8")); } catch (e) { console.error(`Cannot read ${file}: ${e.message}`); process.exit(1); }
  const meta = brief.meta || {};
  for (const [k, q] of Object.entries(META)) if (empty(meta[k])) { blockers.push(`meta.${k} is missing`); questions.push(q); }
  for (const [k, q] of Object.entries(META_RECOMMENDED)) if (empty(meta[k])) { warnings.push(`meta.${k} not set`); questions.push(q); }
  if (meta.logo && !fs.existsSync(meta.logo) && fs.existsSync(path.join(path.dirname(path.resolve(file)), meta.logo))) meta.logo = path.join(path.dirname(path.resolve(file)), meta.logo);
  if (meta.logo && !fs.existsSync(meta.logo)) blockers.push(`meta.logo points to a file that does not exist: ${meta.logo}`);
  if (meta.status === "") warnings.push("meta.status is blank: the deck will carry no Draft/Final marking");

  const slides = brief.slides || [];
  if (!slides.length) { blockers.push("brief has no slides"); questions.push("What should the deck cover, slide by slide? One takeaway per slide is enough to start."); }
  const content = slides.filter(s => !["title", "section", "backup", "sources", "agenda"].includes(s.pattern));

  slides.forEach((d, i) => {
    const n = i + 1;
    if (!PATTERN_NAMES.includes(d.pattern)) { blockers.push(`slide ${n}: unknown pattern "${d.pattern}" (see references/patterns.md)`); return; }
    (REQ[d.pattern] || []).forEach(key => { if (empty(d[key])) { blockers.push(`slide ${n} (${d.pattern}): "${key}" is empty`); if (Q[d.pattern]) questions.push(Q[d.pattern].replace("{n}", n)); } });
    if (DATA.has(d.pattern) && empty(d.source)) blockers.push(`slide ${n} (${d.pattern}): data slide with no "source" line`);
    if (d.headline && !NO_HEADLINE_CHECK.has(d.pattern) && !/[.?!]$/.test(String(d.headline).trim())) warnings.push(`slide ${n}: headline is not a full sentence: "${d.headline}"`);
    if (d.headline && !NO_HEADLINE_CHECK.has(d.pattern) && !/\s/.test(String(d.headline).trim())) warnings.push(`slide ${n}: one-word headline reads as a label`);
    if (!d.notes && !["title", "section", "backup", "sources", "agenda"].includes(d.pattern)) warnings.push(`slide ${n}: no speaker notes`);
    if (d.pattern === "cards" && (d.cards || []).length > 6) blockers.push(`slide ${n}: ${d.cards.length} cards; six is the maximum, split the slide`);
    if (d.pattern === "cards" && (d.cards || []).filter(c => c.highlight || c.accent).length > 1) warnings.push(`slide ${n}: more than one highlighted card; one per slide`);
    if (d.pattern === "statement" && slides[i + 1] && slides[i + 1].pattern === "statement") warnings.push(`slide ${n}: two statement slides back to back`);
    if (d.pattern === "ask" && empty(d.cards) && empty(d.asks) && empty(d.lead)) { blockers.push(`slide ${n} (ask): needs "cards" or a "lead" with "actions"`); questions.push(Q.ask.replace("{n}", n)); }
    if (d.pattern === "ecosystem") {
      const gs = d.groups || [], all = gs.flatMap(g => g.nodes || []);
      if (gs.length > 4) blockers.push(`slide ${n}: ${gs.length} groups; an ecosystem slide takes four at most (merge groups, or move the hub's own parts into hub.chips)`);
      if (all.length > 14) blockers.push(`slide ${n}: ${all.length} nodes; fourteen is the most that stays readable, split the slide or move detail to backup`);
      gs.forEach(g => { if ((g.nodes || []).length > 6) blockers.push(`slide ${n}: group "${g.label}" has ${g.nodes.length} nodes; six at most`);
        if (g.flow && !["in", "out", "both", "none"].includes(g.flow)) blockers.push(`slide ${n}: group "${g.label}" flow "${g.flow}" must be in, out, both or none`);
        if (empty(g.label)) blockers.push(`slide ${n}: every ecosystem group needs a label`); });
      if (all.some(x => empty(x.name))) blockers.push(`slide ${n}: every ecosystem node needs a name`);
      if (d.band && all.length > 8) warnings.push(`slide ${n}: ecosystem with ${all.length} nodes and a band; the diagram needs the room, let the headline carry the point`);
      if (gs.filter(g => g.highlight).length > 1) warnings.push(`slide ${n}: more than one highlighted group; amber marks one thing`);
    }
    /* A diagram or chart drawn elsewhere and pasted in as a picture is not
     * editable, ignores the type scale and slips past every layout check.
     * The image pattern is for real captures only, and says so explicitly. */
    if (d.pattern === "image") {
      const kind = String(d.imageKind || "").toLowerCase();
      if (!kind) { blockers.push(`slide ${n} (image): set "imageKind" to "screenshot" or "photo"`); questions.push(Q.image.replace("{n}", n)); }
      else if (!["screenshot", "photo"].includes(kind)) blockers.push(`slide ${n} (image): imageKind "${kind}" is not allowed. Diagrams, charts and maps are built natively: ecosystem for how things connect, panels or tiers for layers, chart for data. If no pattern fits, compose from kit primitives and flag it for promotion.`);
    }
    if (d.pattern === "kpi_strip" && (d.kpis || []).length > 5) blockers.push(`slide ${n}: ${d.kpis.length} KPIs; five is the maximum, split the slide`);
    if (d.pattern === "kpi_strip") (d.kpis || []).forEach((k, j) => { if (empty(k.target) && empty(k.delta)) warnings.push(`slide ${n}: KPI "${k.label}" has neither a target nor a change; a bare number does not say whether it is good`); });
    if (d.pattern === "title" && (d.figures || []).length > 3) blockers.push(`slide ${n}: title rail takes three figures at most`);
    if (d.band && typeof d.band === "object" && !Array.isArray(d.band) && d.band.style && !BAND_STYLES.has(d.band.style)) blockers.push(`slide ${n}: band style "${d.band.style}" is not one of ${[...BAND_STYLES].join(", ")}`);
    /* Icons: a named vocabulary, one idea per icon. The same icon twice on a
     * slide says two things are the same thing; the same icon on slide after
     * slide stops meaning anything. */
    const icons = [];
    (function walk(node) { if (Array.isArray(node)) node.forEach(walk); else if (node && typeof node === "object") Object.entries(node).forEach(([k, v]) => { if ((k === "icon" || k === "gateIcon") && typeof v === "string") icons.push(v); else walk(v); }); })(d);
    [...new Set(icons)].forEach(ic => { if (!ICONS[ic]) { const near = Object.keys(ICONS).filter(k => k.includes(ic.split("_")[0]) || ic.includes(k)).slice(0, 5); blockers.push(`slide ${n}: unknown icon "${ic}"${near.length ? " (did you mean: " + near.join(", ") + "?)" : ""}; see references/icons.md`); } });
    // decision_rights may repeat a gate icon: there it names a kind of gate, not an idea
    const dup = d.pattern === "decision_rights" ? [] : icons.filter((ic, j) => icons.indexOf(ic) !== j);
    if (dup.length) blockers.push(`slide ${n}: icon "${dup[0]}" used twice on one slide; one icon, one idea`);
    icons.forEach(ic => { iconUse[ic] = (iconUse[ic] || new Set()).add(n); });
    /* The substitution rule. to_deck_brief.py records the pattern the user
     * approved at the ghost deck as approved_pattern. Changing it afterwards
     * is a silent swap unless the user has been asked; record their yes as
     * substitution: {approved_by_user: true, reason: "..."}. */
    if (d.approved_pattern && d.pattern !== d.approved_pattern && !(d.substitution && d.substitution.approved_by_user)) {
      blockers.push(`slide ${n}: pattern changed from the approved "${d.approved_pattern}" to "${d.pattern}" without the user's yes. Tell them why the approved exhibit cannot be built, offer alternatives, and record their choice in "substitution".`);
    }
    /* Illustrative data is a decision the user makes, not the agent. A deck
     * about a real system with invented figures reads as a status report. */
    if (d.illustrative && !(meta.illustrativeApproved === true)) {
      blockers.push(`slide ${n}: marked illustrative but meta.illustrativeApproved is not true. Invented figures are allowed only after the user has agreed; ask, then set meta.illustrativeApproved.`);
      questions.push(`Slide ${n} would show representative (invented) values because no real figures are in the sources. Is that acceptable, or will you supply real ones or a screenshot?`);
    }
    if (d.pattern === "image" && d.image) {
      if (!fs.existsSync(d.image) && fs.existsSync(path.join(path.dirname(path.resolve(file)), d.image))) d.image = path.join(path.dirname(path.resolve(file)), d.image);
      if (!fs.existsSync(d.image)) blockers.push(`slide ${n}: image file not found: ${d.image}`);
      else { const sz = imageSize(d.image); const min = (d.tune && d.tune.minWidth) || IMAGE_MIN_WIDTH;
        if (sz && sz[0] < min) { blockers.push(`slide ${n}: ${d.image} is ${sz[0]}x${sz[1]} px, a thumbnail (minimum ${min} px wide). Do not draw a mock-up in its place.`); questions.push(`Slide ${n} needs a full-size screenshot; the one in the sources is a ${sz[0]}px thumbnail. Can you capture it at full resolution?`); } }
    }
  });

  // deck-level
  if (slides.length && slides[0].pattern !== "title") warnings.push("deck does not open with a title slide");
  const tier = meta.tier || (slides.length <= 1 ? "single" : slides.length <= 8 ? "short" : slides.length <= 25 ? "full" : "long");
  const hasSections = slides.some(s => s.pattern === "section");
  if ((tier === "long" || hasSections) && !slides.some(s => s.pattern === "exec_summary")) blockers.push(`tier ${tier}: an exec_summary slide is mandatory for long decks and any deck with sections`);
  if (hasSections && !slides.some(s => s.pattern === "agenda")) warnings.push("deck has sections but no agenda slide");
  if (meta.sectionBreak && !hasSections) blockers.push("the frame asks for a clear section break but the brief has no section divider slides");
  if (meta.genre === "capability_overview" && !slides.some(s => s.pattern === "risks")) blockers.push("capability_overview genre: a limits-and-what's-next slide (pattern risks) is mandatory; the audience must hear what the thing does not do yet");
  if (tier !== "single" && meta.objective && !slides.some(s => s.pattern === "ask")) warnings.push("an objective is set but there is no ask slide");
  if (slides.some(s => s.pattern === "backup")) { const bi = slides.findIndex(s => s.pattern === "backup"); if (slides.slice(bi + 1).some(s => s.pattern === "ask")) warnings.push("an ask slide sits after the backup divider"); }
  const externals = content.some(s => /\bhttps?:\/\//.test(JSON.stringify(s.source || "")));
  if (externals && !slides.some(s => s.pattern === "sources")) blockers.push("an external source is cited but there is no sources slide");
  // repetition (same rule as ghost_check, applied to the brief as built)
  const counts = {}; content.forEach(s => { counts[s.pattern] = (counts[s.pattern] || 0) + 1; });
  for (const [pat, c] of Object.entries(counts)) if (content.length >= 5 && c / content.length > 0.4) warnings.push(`pattern "${pat}" carries ${c} of ${content.length} content slides (over 40%)`);
  for (let i = 2; i < content.length; i++) if (content[i].pattern === content[i - 1].pattern && content[i].pattern === content[i - 2].pattern) { warnings.push(`three consecutive "${content[i].pattern}" slides`); break; }
  for (const [ic, set] of Object.entries(iconUse)) if (set.size > 2) warnings.push(`icon "${ic}" appears on ${set.size} slides (${[...set].join(", ")}); vary it so it keeps meaning something`);
  /* One-slide patterns: the whole deck in one slide. Inside a longer deck they
   * are impact slides, and they stop landing if they are everywhere. */
  const ones = slides.map((s, i) => [s, i]).filter(([s]) => ONE.has(s.pattern));
  const secCount = slides.filter(s => s.pattern === "section").length;
  if (slides.length > 1 && ones.length > Math.max(1, secCount)) warnings.push(`${ones.length} one-slide patterns in a ${slides.length}-slide deck; use at most one per section as an impact slide`);
  const dark = content.filter(s => s.pattern === "statement" || s.dark).length;
  if (content.length >= 5 && dark / content.length > 0.2) warnings.push(`${dark} of ${content.length} content slides are on the navy page; keep navy for emphasis (one in five at most)`);
  scan(brief, "brief");

  console.log(`\n${file}: ${slides.length} slides, tier ${tier}\n`);
  if (blockers.length) { console.log("BLOCKERS — do not build yet:"); blockers.forEach(b => console.log("  \u2717 " + b)); console.log(""); }
  if (warnings.length) { console.log("WARNINGS — build is possible, quality suffers:"); warnings.forEach(w => console.log("  ! " + w)); console.log(""); }
  const uniq = [...new Set(questions)];
  if (uniq.length) { console.log("ASK THE USER THESE, in one message, numbered, then wait:\n"); uniq.forEach((q, i) => console.log(`  ${i + 1}. ${q}`)); console.log("\nDo not invent answers. Anything they cannot answer is marked as an assumption on the slide and in the notes.\n"); }
  if (!blockers.length && !uniq.length) console.log("Brief is complete. Render it.\n");
  process.exit(blockers.length ? 1 : 0);
}
if (process.argv.length < 3) { console.error("usage: node scripts/check_brief.js brief.json"); process.exit(1); }
main(process.argv[2]);
