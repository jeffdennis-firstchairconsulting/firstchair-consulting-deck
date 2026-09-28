/* ============================================================================
 *  DECK STYLE KIT (v2) — the house style, as code.
 *
 *  Tokens, primitives, and the text-measurement helper every pattern sizes
 *  itself with. Nothing about a customer, programme, or engagement is
 *  hardcoded here; per-deck values arrive through configure() from the brief.
 *
 *  THE LOOK
 *   - Two surfaces: a warm off-white page with a teal rule across the top,
 *     and a navy page with an amber rule (emphasis only).
 *   - Georgia bold for headlines and big numbers; Calibri for everything else.
 *   - Eyebrow above every headline: small bold capitals, letter-spaced. It
 *     carries the label; the headline carries the finding.
 *   - Square-cornered white cards with a coloured top edge and a soft shadow.
 *   - Amber is the one highlight per slide: the thing the eye should land on.
 *   - Status colours are the standard red / amber / green set below, always
 *     with a word on them: colour is never the only signal.
 *
 *  HARD RULES (from real corruption and QA history)
 *   - Never rezip a written .pptx.
 *   - Hex colors: six bare digits, no '#', no alpha.
 *   - Arrows are axis-aligned only (arrow() forces h:0).
 *   - Shadow offset >= 0; upward shadow = angle:270.
 *   - Never share an options object between two add* calls (pptxgenjs mutates).
 *   - Canvas 13.33 x 7.5 (LAYOUT_WIDE), set before any slide.
 *   - Teal text on the light page uses TEAL_TXT (5.4:1); TEAL is for fills.
 * ========================================================================== */

const fs = require("fs");
const path = require("path");

/* ----------------------------- TOKENS ------------------------------------- */
const T = {
  // surfaces and structure
  PAGE: "F6F7F5", WHITE: "FFFFFF", NAVY: "0E2A47", NAVY_DEEP: "081A2D",
  // brand accents
  TEAL: "0D9488",        // fills, bars, data series, rules
  TEAL_TXT: "0F766E",    // teal text on light surfaces
  MINT: "5EEAD4",        // accent text and badges on navy
  TEAL_TINT: "E3EFEC",   // statement band, soft teal fill
  AMBER: "F59E0B",       // THE highlight: one per slide
  AMBER_TXT: "B45309",   // amber text on light surfaces
  // text
  INK: "16232E", SLATE: "5A6B7B", ON_NAVY: "C9D6E2", ON_NAVY_MUTE: "9FB3C4",
  // lines and fills
  RULE: "D5DBE0", ZEBRA: "ECEFF1", STEEL: "C9D6E2",
  // standard status set (solid for dots and bars, FILL + TXT for chips)
  RAG_G: "15803D", RAG_G_FILL: "DCFCE7", RAG_G_TXT: "14532D",
  RAG_A: "D97706", RAG_A_FILL: "FEF3C7", RAG_A_TXT: "78350F",
  RAG_R: "B91C1C", RAG_R_FILL: "FEE2E2", RAG_R_TXT: "7F1D1D",
  RAG_N: "9FB3C4", RAG_N_FILL: "ECEFF1", RAG_N_TXT: "5A6B7B",
  SERIES: ["0D9488", "0E2A47", "5A6B7B", "9FB3C4", "0F766E", "C9D6E2"],
};
// v1 names, kept so every pattern speaks one vocabulary
Object.assign(T, {
  ACCENT: T.TEAL_TXT, HIGHLIGHT: T.AMBER, HIGHLIGHT_TXT: T.INK,
  BODY: T.INK, MUTE: T.SLATE, FOOT: T.SLATE,
  CARD: T.WHITE, CARD_BD: T.RULE, TINT: T.TEAL_TINT, TINT2: T.STEEL,
  NAVY_CARD: T.NAVY_DEEP, NAVY_CARD_BD: T.NAVY,
});
/** every colour a run may carry; validate_deck.py mirrors this list */
const PALETTE = [...new Set(Object.values(T).flat().filter(v => /^[0-9A-F]{6}$/.test(v)))];

const HEAD = "Georgia", BODYF = "Calibri", FONT = BODYF;
const PW = 13.33, PH = 7.5;
const ML = 0.73, CW = PW - 2 * ML;   // 11.87
const RULE_H = 0.12;                // the coloured rule across the top
const FOOTER_Y = 7.06;
const SOURCE_Y = 6.76;
const CONTENT_TOP = 2.15;           // where content starts under a one-line headline
const CONTENT_BOTTOM = 6.62;        // last usable y for content (source line below)
const SZ = { eyebrow: 13, headline: 40, headlineMin: 30, sub: 16, cardTitle: 18, body: 14, small: 12, caption: 11, foot: 10 };

/* ----------------------------- DECK CONFIG -------------------------------- */
const DECK = { footer: "", customer: "", program: "", docType: "", status: "", version: "",
  date: "", classification: "", credit: true, creditText: "", locale: "en-US" };
function configure(o = {}) {
  Object.assign(DECK, o);
  if (!o.footer) {
    const left = DECK.customer || DECK.program || "";
    const marks = [DECK.status, DECK.version, DECK.classification].filter(Boolean).join("  \u00b7  ");
    DECK.footer = [left, DECK.docType, marks].filter(Boolean).join("  \u00b7  ");
  }
  return DECK;
}
const deckConfig = () => DECK;

/* ----------------------------- TEXT MEASURE ------------------------------- */
const METRICS = JSON.parse(fs.readFileSync(path.join(__dirname, "font_metrics.json"), "utf8")).faces;
const SLACK = 1.10;   // LibreOffice vs PowerPoint metric difference + safety; layout_check.py uses the same
const LINE = 1.20;    // line height as a multiple of font size

function table(face, bold, italic) {
  const f = METRICS[face === "head" || face === HEAD ? HEAD : BODYF];
  return (bold ? f.bold : italic && f.italic ? f.italic : f.regular);
}
/** width in inches of a string at fontSize pt; face = "body" | "head" */
function textWidth(str, fontSize, bold = false, face = "body", italic = false) {
  const tbl = table(face, bold, italic);
  let w = 0;
  for (const ch of String(str)) w += (tbl[ch] != null ? tbl[ch] : 0.55);
  return w * fontSize / 72 * SLACK;
}
/** number of lines a string wraps to inside a box of width w (inches) */
function lineCount(str, fontSize, w, bold = false, face = "body") {
  let lines = 0;
  for (const para of String(str).split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) { lines += 1; continue; }
    let n = 1, cur = 0;
    const space = textWidth(" ", fontSize, bold, face);
    for (const wd of words) {
      const ww = textWidth(wd, fontSize, bold, face);
      if (cur > 0 && cur + space + ww > w) { n += 1; cur = ww; }
      else cur += (cur > 0 ? space : 0) + ww;
    }
    lines += n;
  }
  return lines;
}
/** height in inches a string needs in a box of width w */
function textHeight(str, fontSize, w, bold = false, lineMult = LINE, face = "body") {
  return lineCount(str, fontSize, w, bold, face) * fontSize / 72 * lineMult;
}
const headHeight = (str, fontSize, w, lineMult = 1.12) => textHeight(str, fontSize, w, true, lineMult, "head");
/** largest font size in [min,max] at which str fits in w x h */
function fitSize(str, w, h, max, min, bold = false, face = "body") {
  for (let s = max; s >= min; s -= 0.5) if (textHeight(str, s, w, bold, face === "head" ? 1.12 : LINE, face) <= h) return s;
  return min;
}
/** insert a line break so a two-line headline balances; returns text with \n */
function balanceBreak(str, fontSize, w, bold = true, face = "head") {
  if (String(str).includes("\n")) return str;
  if (lineCount(str, fontSize, w, bold, face) < 2) return str;
  const words = String(str).split(/\s+/);
  let best = null, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    if (lineCount(a, fontSize, w, bold, face) > 1 || lineCount(b, fontSize, w, bold, face) > 1) continue;
    const d = Math.abs(textWidth(a, fontSize, bold, face) - textWidth(b, fontSize, bold, face));
    if (d < bestDiff) { bestDiff = d; best = a + "\n" + b; }
  }
  return best || str;
}

/* ----------------------------- LOW-LEVEL ---------------------------------- */
const softShadow = (up = false) => ({ type: "outer", color: "0E2A47", blur: 8, offset: 2, angle: up ? 270 : 90, opacity: 0.14 });
const txt = (s, text, o) => s.addText(text, Object.assign({ fontFace: BODYF, margin: 0, isTextBox: true }, o));
const htxt = (s, text, o) => txt(s, text, Object.assign({ fontFace: HEAD, bold: true }, o));
const rect = (s, x, y, w, h, fill, extra = {}) => s.addShape("rect", Object.assign({ x, y, w, h, fill: { color: fill }, line: { type: "none" } }, extra));
function topRule(s, color) { rect(s, 0, 0, PW, RULE_H, color); }
const bgWhite = s => { s.background = { color: T.PAGE }; topRule(s, T.TEAL); };   // the light page
const bgPage = bgWhite;
const bgNavy = (s, rule = true) => { s.background = { color: T.NAVY }; if (rule) topRule(s, T.AMBER); };

function footer(s, pageNum, onDark = false, opts = {}) {
  const color = onDark ? T.ON_NAVY_MUTE : T.SLATE;
  const fx = opts.x || ML;
  if (DECK.footer) txt(s, DECK.footer, { x: fx, y: FOOTER_Y, w: Math.min(8.5, PW - fx - 1.4), h: 0.3, fontSize: SZ.foot, color, valign: "middle" });
  if (pageNum != null) txt(s, String(pageNum), { x: PW - ML - 0.6, y: FOOTER_Y, w: 0.6, h: 0.3, fontSize: SZ.foot, color, align: "right", valign: "middle" });
  if (opts.credit && DECK.credit && DECK.creditText)
    txt(s, DECK.creditText, { x: PW - ML - 6.2, y: FOOTER_Y, w: 5.5, h: 0.3, fontSize: 9, italic: true, color, align: "right", valign: "middle" });
}
/** source line on data slides: bottom-left, above the footer */
function sourceLine(s, text, onDark = false) {
  if (!text) return;
  txt(s, "Source: " + text, { x: ML, y: SOURCE_Y, w: CW, h: 0.26, fontSize: SZ.foot, italic: true,
    color: onDark ? T.ON_NAVY_MUTE : T.SLATE, valign: "middle" });
}

/* ----------------------------- ICONS -------------------------------------- */
const ICON_DIR = path.join(__dirname, "icons");
const ICONS = JSON.parse(fs.readFileSync(path.join(ICON_DIR, "icons.json"), "utf8")).icons;
function iconPath(name, colorway = "white") {
  if (!ICONS[name]) throw new Error(`unknown icon "${name}". Pick one from assets/icons/icons.json (references/icons.md).`);
  return path.join(ICON_DIR, colorway, name + ".png");
}
/** icon in a filled circle. tone: "teal" (white glyph on teal, any surface) | "mint" (navy glyph on mint, light page) | "navy" | "amber" */
function iconBadge(s, name, x, y, d, tone = "teal") {
  const fill = { teal: T.TEAL, mint: T.MINT, navy: T.NAVY, amber: T.AMBER }[tone] || T.TEAL;
  s.addShape("ellipse", { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" } });
  const g = d * 0.56;
  s.addImage({ path: iconPath(name, tone === "mint" || tone === "amber" ? "navy" : "white"), x: x + (d - g) / 2, y: y + (d - g) / 2, w: g, h: g });
}
/** bare glyph, no circle */
function icon(s, name, x, y, d, colorway = "navy") { s.addImage({ path: iconPath(name, colorway), x, y, w: d, h: d }); }

/* ----------------------------- HEADER STACK -------------------------------- */
function eyebrow(s, text, onDark = false, y = 0.46) {
  txt(s, String(text).toUpperCase(), { x: ML, y, w: CW, h: 0.3, fontSize: SZ.eyebrow, bold: true, color: onDark ? T.MINT : T.TEAL_TXT, charSpacing: 2.4 });
}
/** headline: Georgia, balanced break, stepped down only if it would take 3 lines. Returns bottom y. */
function headline(s, text, o = {}) {
  const { onDark = false, y = 0.8, size = SZ.headline, min = SZ.headlineMin, w = CW, x = ML } = o;
  let fs = size;
  const wm = w - 0.08;   // measure a hair narrow: the checker allows for box insets
  while (fs > min && lineCount(text, fs, wm, true, "head") > 2) fs -= 1;
  const t = balanceBreak(text, fs, wm, true, "head");
  const lines = lineCount(t, fs, wm, true, "head");
  const h = Math.max(0.62, lines * fs / 72 * 1.2 + 0.04);
  htxt(s, t, { x, y, w, h, fontSize: fs, color: onDark ? T.WHITE : T.INK, valign: "top", lineSpacingMultiple: 0.98 });
  return y + h;
}
function subtitle(s, text, o = {}) {
  const { onDark = false, y = 1.6, size = SZ.sub, w = CW, x = ML } = o;
  const h = Math.max(0.3, textHeight(text, size, w) + 0.04);
  txt(s, text, { x, y, w, h, fontSize: size, color: onDark ? T.ON_NAVY : T.SLATE, lineSpacingMultiple: 1.05, valign: "top" });
  return y + h;
}
function sectionLabel(s, text, x = ML, y, w = CW, onDark = false) {
  txt(s, String(text).toUpperCase(), { x, y, w, h: 0.28, fontSize: SZ.caption, bold: true, color: onDark ? T.MINT : T.TEAL_TXT, charSpacing: 1.8 });
}

/* ----------------------------- CARD --------------------------------------- */
const EDGE = 0.09;
/** measure a card's natural content height for width w */
function cardNeed(o, w) {
  const iw = w - 0.5;
  let h = EDGE + 0.24;
  if (o.icon) h += 0.78;
  if (o.kicker) h += 0.34;
  if (o.title) h += textHeight(o.title, o.titleSize || SZ.cardTitle, iw, true) + 0.12;
  if (o.body) h += textHeight(o.body, o.bodySize || SZ.body, iw) + 0.06;
  if (o.caption) h += 0.42;
  return h + 0.24;
}
/** square card. Default: white with a navy top edge. highlight:true = navy card with an amber edge (the one highlight).
 *  accent:true = soft teal card. dark:true = card on the navy page. edge: override the top-edge colour ("none" for none). */
function card(s, o) {
  const hl = !!o.highlight, ac = !!o.accent, dk = !!o.dark;
  const fill = hl ? T.NAVY : dk ? T.NAVY_DEEP : ac ? T.TEAL_TINT : (o.fill || T.WHITE);
  rect(s, o.x, o.y, o.w, o.h, fill, dk ? {} : { shadow: softShadow(o.shadowUp) });
  const edge = o.edge || (hl ? T.AMBER : dk ? null : ac ? T.TEAL : T.NAVY);
  if (edge && o.edge !== "none") rect(s, o.x, o.y, o.w, EDGE, edge);
  const onNavy = hl || dk;
  const iw = o.w - 0.5, ix = o.x + 0.25;
  const kc = onNavy ? T.MINT : T.TEAL_TXT;
  const tc = onNavy ? (dk ? T.MINT : T.WHITE) : T.INK;
  const bc = onNavy ? T.ON_NAVY : T.INK;
  let cy = o.y + EDGE + 0.24;
  if (o.icon) { iconBadge(s, o.icon, ix, cy, 0.62, onNavy ? "teal" : (o.iconTone || "teal")); cy += 0.78; }
  if (o.kicker) { txt(s, String(o.kicker).toUpperCase(), { x: ix, y: cy, w: iw, h: 0.26, fontSize: SZ.caption, bold: true, color: kc, charSpacing: 1.6 }); cy += 0.34; }
  if (o.title) {
    let ts = o.titleSize || SZ.cardTitle;
    const bodyH = o.body ? textHeight(o.body, o.bodySize || SZ.body, iw) : 0;
    while (ts > 12 && cy - o.y + textHeight(o.title, ts, iw, true) + 0.12 + bodyH + (o.caption ? 0.44 : 0.22) > o.h) ts -= 0.5;
    const th = textHeight(o.title, ts, iw, true);
    txt(s, o.title, { x: ix, y: cy, w: iw, h: th + 0.04, fontSize: ts, bold: true, color: tc, valign: "top" });
    cy += th + 0.12;
  }
  if (o.body) { const bh = o.h - (cy - o.y) - (o.caption ? 0.44 : 0.2);
    txt(s, o.body, { x: ix, y: cy, w: iw, h: Math.max(bh, 0.2), fontSize: o.bodySize || SZ.body, color: bc, lineSpacingMultiple: 1.05, valign: "top" }); }
  if (o.caption) txt(s, o.caption, { x: ix, y: o.y + o.h - 0.4, w: iw, h: 0.3, fontSize: SZ.caption, bold: true, color: onNavy ? T.MINT : T.TEAL_TXT, valign: "middle" });
}

/* ----------------------------- CHIPS, DOTS -------------------------------- */
/** square chip. variants: navy | light | outline | highlight (amber) | teal | dark (on navy page) */
function pill(s, o) {
  const v = o.variant || "light";
  const map = {
    navy: { fill: T.NAVY, line: { type: "none" }, t: T.WHITE },
    light: { fill: T.ZEBRA, line: { type: "none" }, t: T.INK },
    outline: { fill: T.WHITE, line: { color: T.RULE, width: 1 }, t: T.INK },
    highlight: { fill: T.AMBER, line: { type: "none" }, t: T.INK },
    teal: { fill: T.TEAL, line: { type: "none" }, t: T.WHITE },
    dark: { fill: T.NAVY_DEEP, line: { type: "none" }, t: T.ON_NAVY },
  }[v] || { fill: T.ZEBRA, line: { type: "none" }, t: T.INK };
  const h = o.h || 0.36;
  s.addShape("rect", { x: o.x, y: o.y, w: o.w, h, fill: { color: map.fill }, line: map.line });
  txt(s, o.text, { x: o.x + 0.06, y: o.y, w: o.w - 0.12, h, fontSize: o.size || SZ.caption, bold: true, color: map.t, align: o.align || "center", valign: "middle" });
}
/* the standard status set */
const STATUS_ALIASES = { done: "g", green: "g", g: "g", complete: "g", completed: "g", "on track": "g", ok: "g",
  progress: "a", amber: "a", a: "a", inflight: "a", "in progress": "a", wip: "a", watch: "a",
  risk: "r", red: "r", r: "r", blocked: "r", "at risk": "r", decision: "r", "off track": "r",
  none: "n", grey: "n", gray: "n", n: "n", "not started": "n", planned: "n" };
const ragKey = v => STATUS_ALIASES[String(v == null ? "" : v).toLowerCase().trim()] || "a";
const RAG = {
  g: { solid: T.RAG_G, fill: T.RAG_G_FILL, txt: T.RAG_G_TXT, label: "On track" },
  a: { solid: T.RAG_A, fill: T.RAG_A_FILL, txt: T.RAG_A_TXT, label: "At risk" },
  r: { solid: T.RAG_R, fill: T.RAG_R_FILL, txt: T.RAG_R_TXT, label: "Off track" },
  n: { solid: T.RAG_N, fill: T.RAG_N_FILL, txt: T.RAG_N_TXT, label: "Not started" },
};
/** status chip: always carries its word. status: g|a|r|n or any alias */
function statusPill(s, o) {
  const m = RAG[ragKey(o.status)];
  const h = o.h || 0.38;
  rect(s, o.x, o.y, o.w, h, m.fill);
  rect(s, o.x, o.y, 0.07, h, m.solid);
  txt(s, o.text || m.label, { x: o.x + 0.12, y: o.y, w: o.w - 0.16, h, fontSize: o.size || SZ.caption, bold: true, color: m.txt, align: "center", valign: "middle" });
}
const ragDot = (s, x, y, d, color) => s.addShape("ellipse", { x, y, w: d, h: d, fill: { color }, line: { type: "none" } });

/** Harvey ball: fraction 0..1 as a ring plus a wedge (a shape, so it survives without colour) */
function harveyBall(s, x, y, d, fraction, color = T.NAVY) {
  s.addShape("ellipse", { x, y, w: d, h: d, fill: { color: T.WHITE }, line: { color, width: 1.25 } });
  const f = Math.max(0, Math.min(1, fraction));
  if (f >= 0.999) { s.addShape("ellipse", { x, y, w: d, h: d, fill: { color }, line: { color, width: 1.25 } }); return; }
  if (f <= 0.001) return;
  s.addShape("pie", { x, y, w: d, h: d, fill: { color }, line: { type: "none" }, angleRange: [270, 270 + 360 * f] });
}

/* ----------------------------- BANDS -------------------------------------- */
/* Three band styles, usable under any pattern through the `band` field:
 *   statement   (default)  pale teal, teal bar on the left, bold ink text
 *   takeaway               white card, teal bar, check badge: "what this proves"
 *   bottom_line            navy, amber top edge, mint label, Georgia white text
 */
const runsText = r => (Array.isArray(r) ? r : [{ text: r }]).map(x => x.text).join("");
function bandNeed(richText, style = "statement") {
  const str = runsText(richText);
  if (style === "bottom_line") return Math.max(0.92, headHeight(str, 20, CW - 1.0, 1.2) + 0.62);
  if (style === "takeaway") return Math.max(0.9, textHeight(str, 17, CW - 1.6) + 0.44);
  return Math.max(0.66, textHeight(str, 15, CW - 0.9, true) + 0.36);
}
function band(s, richText, y, h, style = "statement", label) {
  const runs = Array.isArray(richText) ? richText : [{ text: richText }];
  if (style === "bottom_line") {
    rect(s, ML, y, CW, h, T.NAVY); rect(s, ML, y, CW, EDGE, T.AMBER);
    txt(s, String(label || "The bottom line").toUpperCase(), { x: ML + 0.5, y: y + 0.2, w: CW - 1.0, h: 0.26, fontSize: SZ.small, bold: true, color: T.MINT, charSpacing: 2.4 });
    htxt(s, runsText(runs), { x: ML + 0.5, y: y + 0.48, w: CW - 1.0, h: h - 0.56, fontSize: 20, color: T.WHITE, valign: "top", lineSpacingMultiple: 1.02 });
    return;
  }
  if (style === "takeaway") {
    rect(s, ML, y, CW, h, T.WHITE, { shadow: softShadow() }); rect(s, ML, y, EDGE, h, T.TEAL);
    iconBadge(s, "check_circle", ML + 0.4, y + h / 2 - 0.3, 0.6, "teal");
    txt(s, runs.map(r => ({ text: r.text, options: { bold: !!r.bold, color: T.INK } })), { x: ML + 1.25, y, w: CW - 1.6, h, fontSize: 17, valign: "middle", lineSpacingMultiple: 1.04 });
    return;
  }
  rect(s, ML, y, CW, h, T.TEAL_TINT); rect(s, ML, y, EDGE, h, T.TEAL);
  txt(s, runs.map(r => ({ text: r.text, options: { bold: true, color: T.INK } })), { x: ML + 0.5, y, w: CW - 0.9, h, fontSize: 15, valign: "middle", lineSpacingMultiple: 1.04 });
}
/** v1 name: the answer band, now the statement style */
function thesisBand(s, richText, y, h) { band(s, richText, y, h || bandNeed(richText), "statement"); }

/* axis-aligned arrows only */
function arrow(s, x, y, w, color = T.SLATE) { s.addShape("line", { x, y, w, h: 0, line: { color, width: 2, endArrowType: "triangle" } }); }
function arrowDown(s, x, y, h, color = T.SLATE) { s.addShape("line", { x, y, w: 0, h, line: { color, width: 2, endArrowType: "triangle" } }); }
function hline(s, x, y, w, color = T.RULE, width = 1) { s.addShape("line", { x, y, w, h: 0, line: { color, width } }); }
function vline(s, x, y, h, color = T.RULE, width = 1) { s.addShape("line", { x, y, w: 0, h, line: { color, width } }); }

/* chevron (the block-arrow shape) with centred text */
function chevron(s, o) {
  const first = !!o.first;
  s.addShape(first ? "homePlate" : "chevron", { x: o.x, y: o.y, w: o.w, h: o.h, fill: { color: o.fill || T.STEEL }, line: { type: "none" } });
  const pad = first ? 0.18 : o.h * 0.32;
  txt(s, o.text, { x: o.x + pad, y: o.y, w: o.w - pad - o.h * 0.32, h: o.h, fontSize: o.size || 13, bold: true,
    color: o.color || T.INK, align: "center", valign: "middle" });
}
/** big Georgia numeral (amber on any surface) */
function numeral(s, n, x, y, w, h, size = 26) { htxt(s, String(n), { x, y, w, h, fontSize: size, color: T.AMBER, valign: "top" }); }

const KIT = { T, PALETTE, FONT, HEAD, BODYF, SZ, PW, PH, ML, CW, RULE_H, EDGE, FOOTER_Y, SOURCE_Y, CONTENT_TOP, CONTENT_BOTTOM,
  configure, deckConfig, softShadow, bgWhite, bgPage, bgNavy, topRule, rect, txt, htxt, footer, sourceLine,
  ICONS, iconPath, iconBadge, icon,
  eyebrow, headline, subtitle, sectionLabel, card, cardNeed, pill, statusPill, ragKey, RAG, ragDot, harveyBall,
  band, bandNeed, thesisBand, arrow, arrowDown, hline, vline, chevron, numeral,
  textWidth, lineCount, textHeight, headHeight, fitSize, balanceBreak };
module.exports = KIT;
