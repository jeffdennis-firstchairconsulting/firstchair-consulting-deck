/* ============================================================================
 *  DECK PATTERNS (v2) — composed helpers the renderer builds slides from.
 *  Built only from kit primitives. Everything here sizes itself from the
 *  content it is given (K.textHeight / K.cardNeed), so a first render lands
 *  balanced instead of leaving half a card empty.
 * ========================================================================== */
const K = require("./deck_style_kit.js");
const { T, FONT, HEAD, ML, CW, PW, SZ, EDGE } = K;
const shadow = () => K.softShadow();

/* --- header stack: returns y where content starts ------------------------- */
function slideHeader(s, o = {}) {
  const onDark = !!o.onDark;
  let y = 0.8;
  if (o.eyebrow) K.eyebrow(s, o.eyebrow, onDark);
  if (o.headline) y = K.headline(s, o.headline, { onDark, size: o.headlineSize || SZ.headline });
  if (o.subtitle) y = K.subtitle(s, o.subtitle, { onDark, y: y + 0.08 });
  return Math.max(y + 0.32, K.CONTENT_TOP);
}

/* --- card row: equal widths, height = tallest card's need, clamped -------- */
function cardRow(s, items, o = {}) {
  const gap = o.gap == null ? 0.3 : o.gap;
  const n = items.length;
  const w = (CW - (n - 1) * gap) / n;
  const titleSize = o.titleSize || (n > 3 ? 16 : SZ.cardTitle);
  const bodySize = o.bodySize || (n > 3 ? 12.5 : 13.5);
  const need = Math.max(...items.map(it => K.cardNeed(Object.assign({ titleSize, bodySize }, it), w)));
  const room = K.CONTENT_BOTTOM - o.y - (o.reserve || 0);
  const h = Math.min(Math.max(need, o.minH || 1.2), o.maxH || 3.8, Math.max(room, 0.6));
  items.forEach((it, i) => K.card(s, Object.assign({ titleSize, bodySize }, it, { x: ML + i * (w + gap), y: o.y, w, h, dark: it.dark || o.dark })));
  return o.y + h;
}

/* --- band placement: below content if room, else pinned above source line -- */
function placeBand(s, b, contentBottom) {
  if (!b || !b.runs) return contentBottom;
  const h = K.bandNeed(b.runs, b.style);
  const y = Math.min(contentBottom + 0.3, K.CONTENT_BOTTOM - h);
  K.band(s, b.runs, y, h, b.style, b.label);
  return y + h;
}

/* --- two-column map rows (today -> proposed) ------------------------------ */
function mapRows(s, o) {
  const colW = (CW - 0.5) / 2, xL = ML, xR = ML + colW + 0.5;
  K.pill(s, { x: xL, y: o.y, w: colW, h: 0.42, text: o.leftTitle, variant: "light", size: 12 });
  K.pill(s, { x: xR, y: o.y, w: colW, h: 0.42, text: o.rightTitle, variant: "navy", size: 12 });
  let y = o.y + 0.6;
  const bottom = o.bottom || K.CONTENT_BOTTOM;
  let fs = 13, gap = 0.14, rowNeed;
  const needFor = f => o.rows.map(r => Math.max(0.5, K.textHeight(r.left, f, colW - 0.5), K.textHeight(r.right, f, colW - 0.5, true)) + 0.24);
  while (true) { rowNeed = needFor(fs); if (fs <= 11 || rowNeed.reduce((a, b) => a + b, 0) + gap * (o.rows.length - 1) <= bottom - y) break; fs -= 0.5; }
  o.rows.forEach((r, ri) => {
    const rowH = rowNeed[ri];
    K.rect(s, xL, y, colW, rowH, T.WHITE, { shadow: shadow() });
    K.txt(s, r.left, { x: xL + 0.25, y, w: colW - 0.5, h: rowH, fontSize: fs, color: T.SLATE, valign: "middle" });
    K.rect(s, xR, y, colW, rowH, T.TEAL_TINT); K.rect(s, xR, y, EDGE, rowH, r.highlight ? T.AMBER : T.TEAL);
    K.txt(s, r.right, { x: xR + 0.28, y, w: colW - 0.5, h: rowH, fontSize: fs, bold: true, color: T.INK, valign: "middle" });
    K.arrow(s, xL + colW + 0.08, y + rowH / 2, 0.34);
    y += rowH + gap;
  });
  return y - gap;
}

/* --- panel (architecture zone) ------------------------------------------- */
function panel(s, o) {
  const hl = !!o.highlight;
  K.rect(s, o.x, o.y, o.w, o.h, hl ? T.NAVY : T.WHITE, { shadow: shadow() });
  K.rect(s, o.x, o.y, o.w, EDGE, hl ? T.AMBER : T.NAVY);
  K.txt(s, o.label.toUpperCase(), { x: o.x + 0.22, y: o.y + 0.2, w: o.w - 0.44, h: 0.26, fontSize: SZ.caption, bold: true, color: hl ? T.MINT : T.TEAL_TXT, charSpacing: 1.6 });
  if (o.caption) K.txt(s, o.caption, { x: o.x + 0.22, y: o.y + 0.48, w: o.w - 0.44, h: 0.26, fontSize: 11.5, color: hl ? T.ON_NAVY : T.SLATE });
  const n = (o.chips || []).length, gap = 0.08;
  const cy = o.y + (o.caption ? 0.82 : 0.54);
  const avail = o.y + o.h - cy - 0.14;
  // stacked when there is room; side by side when a short panel cannot take the stack
  const across = n > 1 && n <= 3 && n * 0.28 + (n - 1) * gap > avail;
  const chipH = across ? Math.max(0.24, Math.min(0.36, avail)) : Math.max(0.24, Math.min(0.36, (avail - (n - 1) * gap) / Math.max(n, 1)));
  const chipW = across ? (o.w - 0.44 - (n - 1) * 0.1) / n : o.w - 0.44;
  (o.chips || []).forEach((c, i) => {
    const label = typeof c === "string" ? c : c.text;
    let variant = typeof c === "string" ? "outline" : (c.variant || "outline");
    if (hl && variant === "outline") variant = "dark";
    K.pill(s, { x: o.x + 0.22 + (across ? i * (chipW + 0.1) : 0), y: across ? cy : cy + i * (chipH + gap), w: chipW, h: chipH, text: label, variant, size: 11.5 });
  });
}

/* --- stacked column of cards under a kicker ------------------------------- */
function stackColumn(s, o) {
  K.pill(s, { x: o.x, y: o.y, w: o.w, h: 0.4, text: o.kicker, variant: o.variant || "light", size: 12 });
  let y = o.y + 0.56;
  o.items.forEach(it => {
    const h = Math.max(o.itemH || 0.9, K.cardNeed(Object.assign({ titleSize: 14, bodySize: 12 }, it), o.w));
    K.card(s, Object.assign({ x: o.x, y, w: o.w, h, titleSize: 14, bodySize: 12 }, it));
    y += h + 0.16;
  });
  return y - 0.16;
}

/* --- constant band (the thing that does not rotate) ---------------------- */
function constantBand(s, o) {
  const h = o.h || 0.6, tagW = o.tag ? K.textWidth(o.tag.toUpperCase(), 11, true) + 0.5 : 0;
  K.rect(s, ML, o.y, CW, h, T.NAVY); K.rect(s, ML, o.y, EDGE, h, T.TEAL);
  K.txt(s, [{ text: o.label + "  \u2014  ", options: { bold: true, color: T.WHITE } }, { text: o.text, options: { color: T.ON_NAVY } }],
    { x: ML + 0.35, y: o.y, w: CW - 0.8 - tagW, h, fontSize: 13, valign: "middle" });
  if (o.tag) K.txt(s, o.tag.toUpperCase(), { x: PW - ML - tagW - 0.3, y: o.y, w: tagW, h, fontSize: 11, bold: true, color: T.MINT, charSpacing: 1.6, align: "right", valign: "middle" });
}

/* --- column lists (bullets under headers) --------------------------------- */
function columnLists(s, o) {
  const cols = o.columns, gap = 0.3, w = (CW - (cols.length - 1) * gap) / cols.length;
  let maxY = o.y;
  cols.forEach((c, i) => {
    const x = ML + i * (w + gap);
    if (c.header) K.pill(s, { x, y: o.y, w, h: 0.38, text: c.header, variant: c.headerVariant || "light", size: 12 });
    const ly = o.y + (c.header ? 0.5 : 0);
    const fsz = o.fontSize || 13;
    const h = c.items.reduce((a, t) => a + K.textHeight(t, fsz, w - 0.4) + 0.08, 0) + 0.1;
    const runs = c.items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < c.items.length - 1 } }));
    K.txt(s, runs, { x: x + 0.06, y: ly, w: w - 0.12, h, fontSize: fsz, color: c.color || T.INK, paraSpaceAfter: 4, valign: "top" });
    maxY = Math.max(maxY, ly + h);
  });
  return maxY;
}

/* --- flow row (phases) with content-sized height -------------------------- */
function flowRow(s, items, y, o = {}) {
  const gap = 0.34, n = items.length, w = (CW - (n - 1) * gap) / n;
  let tsz = n > 3 ? 15 : 17, bsz = n > 3 ? 12 : 13;
  const headH = it => (it.tag ? 0.3 : 0) + K.textHeight(it.title, tsz, w - 0.5, true) + 0.06;
  const need = () => Math.max(1.1, ...items.map(it => EDGE + 0.22 + headH(it) + (it.body ? K.textHeight(it.body, bsz, w - 0.5) + 0.08 : 0) + 0.2));
  // step type down (never below 11 pt body) until the row fits the room it was given
  while (o.maxH && need() > o.maxH && bsz > 11) { bsz -= 0.5; tsz = Math.max(13, tsz - 0.5); }
  const h = need();
  items.forEach((it, i) => {
    const x = ML + i * (w + gap), hl = !!it.highlight;
    K.rect(s, x, y, w, h, hl ? T.NAVY : T.WHITE, { shadow: shadow() });
    K.rect(s, x, y, w, EDGE, hl ? T.AMBER : T.TEAL);
    let cy = y + EDGE + 0.2;
    if (it.tag) { K.txt(s, it.tag.toUpperCase(), { x: x + 0.25, y: cy, w: w - 0.5, h: 0.24, fontSize: 10.5, bold: true, color: hl ? T.MINT : T.TEAL_TXT, charSpacing: 1.4 }); cy += 0.3; }
    const th = K.textHeight(it.title, tsz, w - 0.5, true);
    K.txt(s, it.title, { x: x + 0.25, y: cy, w: w - 0.5, h: th + 0.04, fontSize: tsz, bold: true, color: hl ? T.WHITE : T.INK, valign: "top" });
    cy += th + 0.1;
    if (it.body) K.txt(s, it.body, { x: x + 0.25, y: cy, w: w - 0.5, h: y + h - cy - 0.12, fontSize: bsz, color: hl ? T.ON_NAVY : T.INK, lineSpacingMultiple: 1.02, valign: "top" });
    if (i < n - 1) K.arrow(s, x + w + 0.05, y + h / 2, gap - 0.1);
  });
  return y + h;
}

/* --- native charts -------------------------------------------------------- */
const quietAxes = (o = {}) => ({
  catAxisLabelColor: T.SLATE, catAxisLabelFontFace: FONT, catAxisLabelFontSize: 12,
  valAxisLabelColor: T.SLATE, valAxisLabelFontFace: FONT, valAxisLabelFontSize: 11,
  valGridLine: { color: T.RULE, size: 0.5 }, catGridLine: { style: "none" },
  catAxisLineColor: T.SLATE, valAxisLineShow: false,
  valAxisTitle: o.valTitle, showValAxisTitle: !!o.valTitle, valAxisTitleColor: T.SLATE, valAxisTitleFontSize: 11, valAxisTitleFontFace: FONT,
  legendFontFace: FONT, legendFontSize: 11, legendColor: T.INK, legendPos: "b",
  dataLabelFontFace: FONT, dataLabelFontSize: 12, dataLabelColor: T.INK, dataLabelFontBold: true,
  titleFontFace: FONT, titleFontSize: 13, titleColor: T.INK,
});

/** kinds: bar | column | stacked | stacked100 | line | area | paired(=column, multi-series) */
function houseChart(s, c, box) {
  const kind = c.kind || "column";
  const series = (c.series || [{ name: c.seriesName || "Series 1", values: c.values || [] }]).map(sr => ({ name: sr.name, labels: c.labels, values: sr.values }));
  const multi = series.length > 1;
  const colors = series.map((sr, i) => i === c.highlightSeries ? T.AMBER : T.SERIES[i % T.SERIES.length]);
  // highlight one category in a single-series chart: amber for the bar that matters
  if (!multi && c.highlightIndex != null) {
    const s0 = series[0];
    const base = s0.values.map((v, i) => i === c.highlightIndex ? 0 : v);
    const hi = s0.values.map((v, i) => i === c.highlightIndex ? v : 0);
    series.length = 0; series.push({ name: s0.name, labels: c.labels, values: base }, { name: s0.name + " ", labels: c.labels, values: hi });
    colors.length = 0; colors.push(T.TEAL, T.AMBER);
  }
  const stacked = kind === "stacked" || kind === "stacked100" || c.highlightIndex != null;
  const type = kind === "line" ? "line" : kind === "area" ? "area" : "bar";
  const opts = Object.assign({ x: box.x, y: box.y, w: box.w, h: box.h, chartColors: colors,
    showLegend: multi && c.highlightIndex == null, showTitle: !!c.title, title: c.title,
    showValue: c.showValues !== false && type === "bar" && !(kind === "stacked100"),
    dataLabelPosition: stacked ? "ctr" : "outEnd", valAxisHidden: c.showAxis === false,
    barDir: kind === "bar" ? "bar" : "col", barGrouped: !stacked, barGapWidthPct: multi ? 60 : 70,
    lineSize: 2.5, lineDataSymbol: "circle", lineDataSymbolSize: 7, lineSmooth: false,
    valAxisMinVal: c.min, valAxisMaxVal: c.max, dataLabelFormatCode: c.format || "General",
  }, quietAxes({ valTitle: c.units }));
  if (stacked) { opts.barGrouping = kind === "stacked100" ? "percentStacked" : "stacked"; opts.barGapWidthPct = 60; opts.dataLabelColor = T.WHITE;
    if (c.highlightIndex != null) { opts.dataLabelColor = T.WHITE; opts.dataLabelFormatCode = `${c.format || "General"};;;`; } }
  if (kind === "stacked100") opts.valAxisLabelFormatCode = "0%";
  if (type === "area") opts.chartColorsOpacity = 60;
  s.addChart(type, series, opts);
}

/** waterfall as a native stacked column: invisible base + total/up/down series */
function waterfallChart(s, c, box) {
  const steps = c.steps || []; // [{label, value, type: start|delta|total}]
  const labels = steps.map(st => st.label);
  const base = [], up = [], down = [], total = [];
  let run = 0;
  steps.forEach(st => {
    const t = st.type || "delta";
    if (t === "start" || t === "total") {
      const v = t === "start" ? st.value : (st.value != null ? st.value : run);
      run = v; base.push(0); up.push(0); down.push(0); total.push(v);
    } else if (st.value >= 0) { base.push(run); up.push(st.value); down.push(0); total.push(0); run += st.value; }
    else { run += st.value; base.push(run); up.push(0); down.push(-st.value); total.push(0); }
  });
  const series = [
    { name: "base", labels, values: base },
    { name: "Total", labels, values: total },
    { name: "Increase", labels, values: up },
    { name: "Decrease", labels, values: down },
  ];
  const opts = Object.assign({ x: box.x, y: box.y, w: box.w, h: box.h, barDir: "col", barGrouping: "stacked", barGapWidthPct: 55,
    chartColors: [T.PAGE, T.NAVY, c.upColor || T.TEAL, c.downColor || T.RAG_R],
    showLegend: false, showTitle: !!c.title, title: c.title, showValue: true, dataLabelPosition: "ctr",
    valAxisHidden: c.showAxis === false,
  }, quietAxes({ valTitle: c.units }), { dataLabelFormatCode: `${c.format || "0"};-${c.format || "0"};;`, dataLabelColor: T.WHITE, dataLabelFontBold: true });
  s.addChart("bar", series, opts);
  return { labels, run };
}

/* --- table ---------------------------------------------------------------- */
/** cells are strings, or {text, status} to colour an outcome with the status set (the word carries the meaning) */
function tableBlock(s, o) {
  const cols = o.columns;                    // [{header, align?, width?}]
  const rows = o.rows;
  const n = cols.length;
  const weights = cols.map(c => c.width || 1), tw = weights.reduce((a, b) => a + b, 0);
  const W = o.w || CW;
  const widths = weights.map(w => W * w / tw);
  const fs = o.fontSize || (rows.length <= 5 ? 14 : 13);
  const minRow = rows.length <= 5 ? 0.52 : 0.42;
  const cellText = c => (c && typeof c === "object") ? String(c.text) : String(c);
  const cellH = (row, i) => Math.max(minRow, ...row.map((c, j) => K.textHeight(cellText(c), fs, widths[j] - 0.24, i === -1 || j === 0) + 0.2));
  const heights = rows.map((r, i) => cellH(r, i));
  const headH = cellH(cols.map(c => c.header), -1);
  const data = [];
  data.push(cols.map((c, j) => ({ text: c.header, options: { bold: true, color: T.WHITE, fill: { color: T.NAVY }, align: c.align || (j === 0 ? "left" : "center"), fontSize: fs, fontFace: FONT, valign: "middle" } })));
  rows.forEach((r, i) => {
    const hl = o.highlightRow === i;
    data.push(r.map((cell, j) => {
      const st = cell && typeof cell === "object" && cell.status ? K.RAG[K.ragKey(cell.status)] : null;
      return { text: cellText(cell), options: { color: st ? st.txt : T.INK, bold: hl || j === 0 || !!st, fill: { color: hl ? T.AMBER : (i % 2 ? T.ZEBRA : T.WHITE) },
        align: cols[j].align || (j === 0 ? "left" : "center"), fontSize: fs, fontFace: FONT, valign: "middle" } };
    }));
  });
  s.addTable(data, { x: o.x || ML, y: o.y, w: W, colW: widths, rowH: [headH, ...heights], border: { type: "solid", color: T.RULE, pt: 0.75 }, margin: 0.1 });
  return o.y + headH + heights.reduce((a, b) => a + b, 0);
}

/* --- scorecard grid: options x criteria with a cell marker ---------------- */
/** cell values: for balls 0..1; for lights 'g'|'a'|'r'; for arrows 'up'|'flat'|'down' */
function scorecard(s, o) {
  const rows = o.rows, cols = o.columns, mode = o.mode || "balls";
  const labelW = o.labelW || 3.0, gridW = CW - labelW, cw = gridW / cols.length;
  const rh = o.rowH || Math.min(0.66, (o.maxH || 3.9) / (rows.length + 1));
  let y = o.y;
  K.rect(s, ML, y, CW, rh, T.NAVY);
  cols.forEach((c, j) => K.txt(s, c, { x: ML + labelW + j * cw, y, w: cw, h: rh, fontSize: 12, bold: true, color: T.WHITE, align: "center", valign: "middle" }));
  y += rh;
  rows.forEach((r, i) => {
    const hl = r.highlight;
    s.addShape("rect", { x: ML, y, w: CW, h: rh, fill: { color: hl ? T.AMBER : i % 2 ? T.ZEBRA : T.WHITE }, line: { color: T.RULE, width: 0.5 } });
    K.txt(s, r.label, { x: ML + 0.18, y, w: labelW - 0.2, h: rh, fontSize: 13, bold: true, color: T.INK, valign: "middle" });
    r.cells.forEach((v, j) => {
      const cx = ML + labelW + j * cw + cw / 2, cy = y + rh / 2, d = Math.min(0.36, rh * 0.6);
      if (mode === "balls") K.harveyBall(s, cx - d / 2, cy - d / 2, d, Number(v));
      else if (mode === "lights") {
        const k = K.ragKey(v), m = K.RAG[k];
        K.ragDot(s, cx - d / 2, cy - d / 2, d, m.solid);
        K.txt(s, { g: "G", a: "A", r: "R", n: "\u2013" }[k], { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fontSize: 9, bold: true, color: T.WHITE, align: "center", valign: "middle" });
      } else if (mode === "arrows") {
        const ch = { up: "\u2191", flat: "\u2192", down: "\u2193" }[v] || "";
        const col = { up: T.RAG_G, flat: T.SLATE, down: T.RAG_R }[v] || T.SLATE;
        K.txt(s, ch, { x: cx - 0.3, y: cy - 0.22, w: 0.6, h: 0.44, fontSize: 20, bold: true, color: col, align: "center", valign: "middle" });
      } else {
        K.txt(s, String(v), { x: ML + labelW + j * cw, y, w: cw, h: rh, fontSize: 12.5, color: T.INK, align: "center", valign: "middle" });
      }
    });
    y += rh;
  });
  return y;
}

/* --- heatmap: numeric grid, teal scale, value printed ---------------------- */
function heatmap(s, o) {
  const rows = o.rows, cols = o.columns;
  const vals = rows.flatMap(r => r.cells.map(Number));
  const lo = o.min != null ? o.min : Math.min(...vals), hi = o.max != null ? o.max : Math.max(...vals);
  const labelW = o.labelW || 2.6, cw = (CW - labelW) / cols.length;
  const rh = Math.min(0.52, (o.maxH || 3.9) / (rows.length + 1));
  const a = [0xE3, 0xEF, 0xEC], b = [0x0E, 0x2A, 0x47];
  const shade = t => a.map((c, i) => Math.round(c + (b[i] - c) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
  let y = o.y;
  cols.forEach((c, j) => K.txt(s, c, { x: ML + labelW + j * cw, y, w: cw, h: rh, fontSize: 11.5, bold: true, color: T.INK, align: "center", valign: "middle" }));
  y += rh;
  rows.forEach(r => {
    K.txt(s, r.label, { x: ML, y, w: labelW - 0.12, h: rh, fontSize: 12.5, bold: true, color: T.INK, valign: "middle", align: "right" });
    r.cells.forEach((v, j) => {
      const t = hi === lo ? 0.5 : (Number(v) - lo) / (hi - lo);
      K.rect(s, ML + labelW + j * cw + 0.03, y + 0.03, cw - 0.06, rh - 0.06, shade(t));
      K.txt(s, o.format ? o.format(v) : String(v), { x: ML + labelW + j * cw, y, w: cw, h: rh, fontSize: 11.5, color: t > 0.5 ? T.WHITE : T.INK, align: "center", valign: "middle" });
    });
    y += rh;
  });
  return y;
}

/* --- tree layout: root left, children right (logic/driver/hypothesis) ----- */
function treeLR(s, o) {
  const root = o.root, kids = o.children;
  const top = o.y, bottom = o.bottom || K.CONTENT_BOTTOM;
  const H = bottom - top;
  const useLeaves = kids.some(k => k.leaves && k.leaves.length);
  const rootW = 2.5, kidW = useLeaves ? 3.0 : CW - 2.5 - 0.6, leafW = CW - rootW - kidW - 1.2;
  const rootX = ML, kidX = ML + rootW + 0.6, leafX = kidX + kidW + 0.6;
  const rowN = Math.max(kids.length, kids.reduce((a, k) => a + Math.max(1, (k.leaves || []).length), 0));
  const slotH = H / (useLeaves ? rowN : kids.length);
  const rH = Math.min(1.4, Math.max(0.8, K.textHeight(root, 14, rootW - 0.3, true) + 0.44));
  K.rect(s, rootX, top + H / 2 - rH / 2, rootW, rH, T.NAVY);
  K.txt(s, root, { x: rootX + 0.15, y: top + H / 2 - rH / 2, w: rootW - 0.3, h: rH, fontSize: 14, bold: true, color: T.WHITE, align: "center", valign: "middle" });
  const trunkX = rootX + rootW + 0.3;
  let cursor = top, firstMid = null, lastMid = null;
  kids.forEach(k => {
    const n = useLeaves ? Math.max(1, (k.leaves || []).length) : 1;
    const blockH = slotH * n;
    const th = K.textHeight(k.title, 13, kidW - 0.4, true), bh = k.body ? K.textHeight(k.body, 11.5, kidW - 0.4) : 0;
    const kH = Math.min(blockH - 0.12, Math.max(0.62, th + bh + 0.34));
    const kY = cursor + blockH / 2 - kH / 2, hl = !!k.highlight;
    K.rect(s, kidX, kY, kidW, kH, hl ? T.NAVY : T.WHITE, { shadow: shadow() }); K.rect(s, kidX, kY, EDGE, kH, hl ? T.AMBER : T.TEAL);
    K.txt(s, k.title, { x: kidX + 0.24, y: kY + 0.1, w: kidW - 0.4, h: th + 0.06, fontSize: 13, bold: true, color: hl ? T.WHITE : T.INK, valign: "top" });
    if (k.body) K.txt(s, k.body, { x: kidX + 0.24, y: kY + th + 0.16, w: kidW - 0.4, h: kH - th - 0.24, fontSize: 11.5, color: hl ? T.ON_NAVY : T.SLATE, valign: "top" });
    const mid = kY + kH / 2;
    K.hline(s, trunkX, mid, kidX - trunkX, T.SLATE, 1);
    if (firstMid == null) firstMid = mid; lastMid = mid;
    (k.leaves || []).forEach((lf, j) => {
      const lY = cursor + j * slotH, lH = slotH - 0.1, ly = lY + 0.05;
      K.rect(s, leafX, ly, leafW, lH, T.WHITE, { line: { color: T.RULE, width: 0.75 } });
      const markW = (lf.trend || lf.ball != null) ? 0.55 : 0;
      K.txt(s, lf.text, { x: leafX + 0.14, y: ly, w: leafW - 0.28 - markW, h: lH, fontSize: 11.5, color: T.INK, valign: "middle" });
      if (lf.trend) { const ch = { up: "\u2191", flat: "\u2192", down: "\u2193" }[lf.trend]; const col = { up: T.RAG_G, flat: T.SLATE, down: T.RAG_R }[lf.trend];
        K.txt(s, ch, { x: leafX + leafW - 0.52, y: ly, w: 0.42, h: lH, fontSize: 18, bold: true, color: col, align: "center", valign: "middle" }); }
      if (lf.ball != null) K.harveyBall(s, leafX + leafW - 0.44, ly + lH / 2 - 0.14, 0.28, Number(lf.ball));
      K.hline(s, kidX + kidW, ly + lH / 2, leafX - kidX - kidW, T.SLATE, 1);
      if (j === 0) K.vline(s, kidX + kidW + 0.3, Math.min(mid, ly + lH / 2), Math.abs(mid - (ly + lH / 2)), T.SLATE, 1);
      if (j === (k.leaves.length - 1) && j > 0) K.vline(s, kidX + kidW + 0.3, mid, ly + lH / 2 - mid, T.SLATE, 1);
    });
    cursor += blockH;
  });
  K.vline(s, trunkX, firstMid, lastMid - firstMid, T.SLATE, 1);
  K.hline(s, rootX + rootW, top + H / 2, 0.3, T.SLATE, 1);
  return bottom;
}

/* --- 2x2 matrix ----------------------------------------------------------- */
function matrix2x2(s, o) {
  const size = Math.min(o.h || 3.9, CW * 0.5);
  const x0 = ML + 0.8, y0 = o.y, w = size * 1.3, h = size;
  const quads = o.quadrants || {};
  [[x0, y0, "tl"], [x0 + w / 2, y0, "tr"], [x0, y0 + h / 2, "bl"], [x0 + w / 2, y0 + h / 2, "br"]].forEach(([x, y, q]) => {
    const hl = o.highlightQuadrant === q;
    s.addShape("rect", { x, y, w: w / 2, h: h / 2, fill: { color: hl ? T.AMBER : T.WHITE, transparency: hl ? 70 : 0 }, line: { color: T.RULE, width: 1 } });
    if (quads[q]) K.txt(s, quads[q].toUpperCase(), { x: x + 0.14, y: y + 0.1, w: w / 2 - 0.28, h: 0.26, fontSize: 10.5, bold: true, color: hl ? T.AMBER_TXT : T.TEAL_TXT, charSpacing: 1.2 });
  });
  K.txt(s, o.xAxis || "", { x: x0, y: y0 + h + 0.06, w, h: 0.3, fontSize: 12, bold: true, color: T.INK, align: "center" });
  K.txt(s, o.yAxis || "", { x: x0 - 0.45 - h / 2, y: y0 + h / 2 - 0.2, w: h, h: 0.4, fontSize: 12, bold: true, color: T.INK, align: "center", valign: "middle", rotate: 270 });
  K.txt(s, "low", { x: x0, y: y0 + h + 0.06, w: 0.8, h: 0.3, fontSize: 10, color: T.SLATE });
  K.txt(s, "high", { x: x0 + w - 0.8, y: y0 + h + 0.06, w: 0.8, h: 0.3, fontSize: 10, color: T.SLATE, align: "right" });
  const hit = (a, b) => !(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]);
  // every dot is an obstacle before any label is placed, so labels never sit under a later dot
  const placed = (o.items || []).map(it => { const d = 0.3 + (it.size || 1) * 0.1, cx = x0 + it.x * w, cy = y0 + (1 - it.y) * h; return [cx - d / 2, cy - d / 2, cx + d / 2, cy + d / 2]; });
  (o.items || []).forEach(it => {
    const d = 0.3 + (it.size || 1) * 0.1;
    const cx = x0 + it.x * w, cy = y0 + (1 - it.y) * h;
    s.addShape("ellipse", { x: cx - d / 2, y: cy - d / 2, w: d, h: d, fill: { color: T.NAVY }, line: { color: it.highlight ? T.AMBER : T.WHITE, width: it.highlight ? 3 : 1.5 } });
    const lw = K.textWidth(it.label, 11.5, true) + 0.1, lh = 0.28;
    const cands = [[cx + d / 2 + 0.05, cy - lh / 2], [cx - lw / 2, cy + d / 2 + 0.02], [cx - lw / 2, cy - d / 2 - lh - 0.02], [cx - d / 2 - lw - 0.05, cy - lh / 2],
      [cx + d / 2, cy + d / 2], [cx + d / 2, cy - d / 2 - lh], [cx - d / 2 - lw, cy + d / 2], [cx - d / 2 - lw, cy - d / 2 - lh]];
    let box = null;
    for (const [lx, ly] of cands) { const bb = [lx, ly, lx + lw, ly + lh]; if (!placed.some(p => hit(p, bb))) { box = bb; break; } }
    if (!box) { const [lx, ly] = cands[0]; box = [lx, ly, lx + lw, ly + lh]; }
    placed.push(box);
    K.txt(s, it.label, { x: box[0], y: box[1], w: lw, h: lh, fontSize: 11.5, bold: true, color: T.INK, valign: "middle" });
  });
  return { right: x0 + w + 0.4, bottom: y0 + h + 0.42 };
}

/* ======================= v2 additions ===================================== */

/* --- numbered rows: amber Georgia numeral, bold title, body ---------------- */
function numberedRows(s, items, o) {
  const x = o.x == null ? ML : o.x, w = o.w || CW, gap = o.gap == null ? 0.2 : o.gap;
  const tsz = o.titleSize || 16, bsz = o.bodySize || 13, nw = 0.62;
  let y = o.y;
  items.forEach((it, i) => {
    const th = K.textHeight(it.title || "", tsz, w - nw, true), bh = it.body ? K.textHeight(it.body, bsz, w - nw) : 0;
    const h = Math.max(o.minH || 0.5, th + (bh ? bh + 0.06 : 0));
    K.numeral(s, it.n || i + 1, x, y - 0.04, nw, Math.min(0.5, h + 0.02), o.numSize || 26);
    K.txt(s, it.title || "", { x: x + nw, y, w: w - nw, h: th + 0.02, fontSize: tsz, bold: true, color: o.onDark ? T.WHITE : T.INK, valign: "top" });
    if (it.body) K.txt(s, it.body, { x: x + nw, y: y + th + 0.06, w: w - nw, h: bh + 0.02, fontSize: bsz, color: o.onDark ? T.ON_NAVY : T.SLATE, valign: "top" });
    y += h + gap;
  });
  return y - gap;
}

/* --- KPI tile: label, big figure, target and period, delta with its arrow -- */
function kpiTile(s, k, x, y, w, h, hl) {
  K.rect(s, x, y, w, h, hl ? T.NAVY : T.WHITE, { shadow: shadow() });
  K.rect(s, x, y, w, EDGE, hl ? T.AMBER : T.TEAL);
  const on = !!hl, ix = x + 0.25, iw = w - 0.5;
  let cy = y + EDGE + 0.2;
  if (k.icon) { K.iconBadge(s, k.icon, x + w - 0.25 - 0.5, cy, 0.5, on ? "teal" : "mint"); }
  K.txt(s, String(k.label).toUpperCase(), { x: ix, y: cy, w: iw - (k.icon ? 0.6 : 0), h: 0.44, fontSize: 11, bold: true, color: on ? T.MINT : T.TEAL_TXT, charSpacing: 1.4, valign: "top" });
  cy += 0.56;
  const val = String(k.value) + (k.unit ? k.unit : "");
  const vs = K.fitSize(val, iw, 0.9, 44, 24, true, "head");
  K.htxt(s, val, { x: ix, y: cy, w: iw, h: 0.84, fontSize: vs, color: on ? T.WHITE : T.INK, valign: "middle" });
  cy += 0.92;
  if (k.delta != null && k.delta !== "") {
    const up = String(k.direction || (String(k.delta).trim().startsWith("-") ? "down" : "up")) === "up";
    const good = k.good ? (k.good === (up ? "up" : "down")) : null;
    const col = good == null ? (on ? T.ON_NAVY : T.SLATE) : good ? (on ? T.MINT : T.RAG_G) : (on ? T.RAG_R_FILL : T.RAG_R);
    K.txt(s, [{ text: (up ? "\u25B2 " : "\u25BC ") + String(k.delta), options: { bold: true, color: col } }, { text: "  " + (k.deltaLabel || (good == null ? "" : good ? "better" : "worse")), options: { color: on ? T.ON_NAVY : T.SLATE } }],
      { x: ix, y: cy, w: iw, h: 0.3, fontSize: 12.5, valign: "middle" });
    cy += 0.36;
  }
  const foot = [k.target ? "Target " + k.target : "", k.period || ""].filter(Boolean).join("  \u00b7  ");
  if (foot) K.txt(s, foot, { x: ix, y: y + h - 0.44, w: iw, h: 0.3, fontSize: 11.5, color: on ? T.ON_NAVY_MUTE : T.SLATE, valign: "middle" });
}

/* --- stage grid: items x stages, each cell done / part / not started ------- */
function stageGrid(s, o) {
  const stages = o.stages, rows = o.rows, labelW = o.labelW || 2.9, noteW = rows.some(r => r.note) ? 2.2 : 0;
  const cw = (CW - labelW - noteW) / stages.length;
  const rh = Math.min(0.62, (o.maxH || 3.8) / (rows.length + 1));
  let y = o.y;
  K.rect(s, ML, y, CW, rh, T.NAVY);
  stages.forEach((st, j) => K.txt(s, st, { x: ML + labelW + j * cw + 0.04, y, w: cw - 0.08, h: rh, fontSize: 11.5, bold: true, color: T.WHITE, align: "center", valign: "middle" }));
  if (noteW) K.txt(s, o.noteHeader || "Status", { x: PW - ML - noteW + 0.1, y, w: noteW - 0.2, h: rh, fontSize: 11.5, bold: true, color: T.WHITE, valign: "middle" });
  y += rh;
  const frac = v => typeof v === "number" ? v : ({ done: 1, complete: 1, full: 1, progress: 0.5, partial: 0.5, part: 0.5, started: 0.5, none: 0, "": 0, todo: 0, not: 0 }[String(v || "").toLowerCase()] ?? 0);
  rows.forEach((r, i) => {
    const hl = !!r.highlight;
    K.rect(s, ML, y, CW, rh, i % 2 ? T.ZEBRA : T.WHITE, { line: { color: T.RULE, width: 0.5 } });
    if (hl) K.rect(s, ML, y, EDGE, rh, T.AMBER);
    K.txt(s, r.label, { x: ML + 0.2, y, w: labelW - 0.25, h: rh, fontSize: 13, bold: true, color: T.INK, valign: "middle" });
    r.cells.forEach((v, j) => {
      const f = frac(v), d = Math.min(0.34, rh * 0.58), cx = ML + labelW + j * cw + cw / 2;
      K.harveyBall(s, cx - d / 2, y + rh / 2 - d / 2, d, f, T.TEAL);
    });
    if (noteW && r.note) K.txt(s, r.note, { x: PW - ML - noteW + 0.1, y, w: noteW - 0.2, h: rh, fontSize: 12, color: T.INK, valign: "middle" });
    y += rh;
  });
  // legend: shape carries the meaning, colour is secondary
  const lx = ML, ly = y + 0.14;
  [[1, "Done"], [0.5, "Under way"], [0, "Not started"]].forEach(([f, t], i) => {
    const x = lx + i * 1.9; K.harveyBall(s, x, ly + 0.04, 0.22, f, T.TEAL);
    K.txt(s, t, { x: x + 0.32, y: ly, w: 1.5, h: 0.3, fontSize: 11, color: T.SLATE, valign: "middle" });
  });
  return ly + 0.34;
}

/* --- decision-rights grid: decisions x roles, a role code per cell --------- */
const RIGHTS = {
  A: { label: "Approves", fill: T.NAVY, color: T.WHITE },
  P: { label: "Proposes", fill: T.TEAL, color: T.WHITE },
  E: { label: "Executes", fill: T.TEAL_TINT, color: T.INK },
  C: { label: "Consulted", fill: T.WHITE, color: T.INK, line: true },
  I: { label: "Informed", fill: null, color: T.SLATE },
};
function rightsGrid(s, o) {
  const roles = o.roles, rows = o.rows, gateW = rows.some(r => r.gate) ? 2.9 : 0, labelW = o.labelW || 3.1;
  const cw = (CW - labelW - gateW) / roles.length;
  const rh = Math.min(0.66, (o.maxH || 3.7) / (rows.length + 1));
  let y = o.y;
  K.rect(s, ML, y, CW, rh, T.NAVY);
  K.txt(s, o.decisionHeader || "Decision", { x: ML + 0.2, y, w: labelW - 0.25, h: rh, fontSize: 12, bold: true, color: T.WHITE, valign: "middle" });
  roles.forEach((r, j) => K.txt(s, r, { x: ML + labelW + j * cw + 0.04, y, w: cw - 0.08, h: rh, fontSize: 12, bold: true, color: T.WHITE, align: "center", valign: "middle" }));
  if (gateW) K.txt(s, o.gateHeader || "Gate", { x: PW - ML - gateW + 0.14, y, w: gateW - 0.2, h: rh, fontSize: 12, bold: true, color: T.WHITE, valign: "middle" });
  y += rh;
  rows.forEach((r, i) => {
    const hl = !!r.highlight;
    K.rect(s, ML, y, CW, rh, i % 2 ? T.ZEBRA : T.WHITE, { line: { color: T.RULE, width: 0.5 } });
    if (hl) K.rect(s, ML, y, EDGE, rh, T.AMBER);
    K.txt(s, r.decision, { x: ML + 0.2, y, w: labelW - 0.25, h: rh, fontSize: 12.5, bold: true, color: T.INK, valign: "middle" });
    (r.cells || []).forEach((code, j) => {
      const c = String(code || "").toUpperCase().trim(); if (!c) return;
      const m = RIGHTS[c[0]] || { label: c, fill: T.ZEBRA, color: T.INK };
      const cx = ML + labelW + j * cw, bw = Math.min(cw - 0.2, 1.5), bh = Math.min(0.36, rh - 0.16);
      if (m.fill) K.rect(s, cx + (cw - bw) / 2, y + (rh - bh) / 2, bw, bh, m.fill, m.line ? { line: { color: T.SLATE, width: 0.75 } } : {});
      K.txt(s, m.label, { x: cx + (cw - bw) / 2, y: y + (rh - bh) / 2, w: bw, h: bh, fontSize: 11, bold: c[0] !== "I", color: m.color, align: "center", valign: "middle" });
    });
    if (gateW && r.gate) {
      K.icon(s, r.gateIcon || "lock", PW - ML - gateW + 0.12, y + rh / 2 - 0.13, 0.26, "navy");
      K.txt(s, r.gate, { x: PW - ML - gateW + 0.48, y, w: gateW - 0.56, h: rh, fontSize: 11.5, color: T.INK, valign: "middle" });
    }
    y += rh;
  });
  return y;
}

/* --- beat strip: the ask and the risk, side by side, for one-slide patterns */
function beatStripNeed(ask, risk, w = CW) {
  const cw = ask && risk ? (w - 0.3) / 2 : w;
  const body = o => o ? o.text + (o.mitigation ? "  Mitigation: " + o.mitigation : "") : "";
  const need = (o, bold) => o ? K.textHeight(body(o), 13, cw - 1.2, bold) + 0.62 : 0;
  return Math.max(0.8, need(ask, true), need(risk, false));
}
function beatStrip(s, ask, risk, y, h) {
  const both = ask && risk, w = both ? (CW - 0.3) / 2 : CW;
  const cell = (x, o, kind) => {
    const isAsk = kind === "ask";
    K.rect(s, x, y, w, h, isAsk ? T.NAVY : T.WHITE, isAsk ? {} : { shadow: shadow() });
    K.rect(s, x, y, EDGE, h, isAsk ? T.AMBER : T.RAG_R);
    K.iconBadge(s, isAsk ? (o.icon || "flag") : (o.icon || "warning"), x + 0.28, y + h / 2 - 0.26, 0.52, isAsk ? "teal" : "navy");
    const label = isAsk ? (o.label || "The ask") : (o.label || "The risk");
    const meta = [o.who, o.when || o.by, o.owner ? "Owner: " + o.owner : ""].filter(Boolean).join("  \u00b7  ");
    K.txt(s, [{ text: label.toUpperCase() + "   ", options: { bold: true, color: isAsk ? T.MINT : T.RAG_R, fontSize: 10.5, charSpacing: 1.6 } },
      { text: meta, options: { bold: true, color: isAsk ? T.ON_NAVY : T.SLATE, fontSize: 11 } }], { x: x + 1.0, y: y + 0.12, w: w - 1.2, h: 0.28, valign: "middle" });
    K.txt(s, o.text + (o.mitigation ? "  Mitigation: " + o.mitigation : ""), { x: x + 1.0, y: y + 0.42, w: w - 1.2, h: h - 0.5, fontSize: 13, bold: isAsk, color: isAsk ? T.WHITE : T.INK, valign: "top" });
  };
  if (ask) cell(ML, ask, "ask");
  if (risk) cell(both ? ML + w + 0.3 : ML, risk, "risk");
  return y + h;
}

/* --- ecosystem map: one hub, up to four groups of related things ----------
 * The hub is a tall navy panel in the centre; groups stack on the left and
 * right. Each group is a labelled column of node cards joined by a bracket,
 * and one straight connector runs from the bracket to the hub, with an
 * optional arrow (flow: in | out | both | none) and a short verb above it.
 * Everything is native and axis-aligned: no diagonals, no crossing lines,
 * no image. Planned nodes draw dashed, with a "Next" tag. */
function ecosystemMap(s, o) {
  const groups = o.groups || [], y0 = o.y, bottom = o.bottom;
  const H = bottom - y0, hubW = o.hubW || 2.45, gap = 0.82;
  const sideW = (CW - hubW - 2 * gap) / 2, hubX = ML + sideW + gap;
  const sides = { left: [], right: [] };
  groups.forEach((g, i) => sides[g.side === "right" || (g.side !== "left" && i >= Math.ceil(groups.length / 2)) ? "right" : "left"].push(g));
  const labelH = 0.34, groupGap = 0.3, rowGap = 0.08;
  /* Card modes, tried in order until every side fits:
   *   roomy    name over role, one column            (0.62 per card)
   *   compact  name and role on one line, one column (0.44, 0.56 if it wraps)
   *   paired   roomy cards two across in the largest groups */
  const nodes = g => g.nodes || [];
  const colN = new Map(groups.map(g => [g, 1]));
  let mode = "roomy";
  const cardW = g => (sideW - 0.2 - (colN.get(g) - 1) * 0.14) / colN.get(g);
  const ix = n => n.icon ? 0.6 : 0.18;
  // compact cards share one height across the slide; type steps 12 -> 11 -> 10.5 before any card wraps
  let csz = 12;
  const lineOf = n => n.name + (n.role ? "  \u2014  " + n.role : "");
  const wraps = () => groups.some(g => nodes(g).some(n => K.lineCount(lineOf(n), csz, cardW(g) - ix(n) - 0.2 - (isPlanned(n) ? 0.62 : 0)) > 1));
  const roleWraps = () => groups.some(g => nodes(g).some(n => n.role && K.lineCount(n.role, 11, cardW(g) - ix(n) - 0.2 - (isPlanned(n) ? 0.62 : 0)) > 1));
  const cardH = () => mode !== "compact" ? (roleWraps() ? 0.8 : 0.62) : (wraps() ? 0.58 : 0.46);
  const rowHeights = g => { const c = colN.get(g), hs = []; nodes(g).forEach((n, j) => { const r = Math.floor(j / c); hs[r] = Math.max(hs[r] || 0, cardH(g, n)); }); return hs; };
  const groupH = g => { const hs = rowHeights(g); return labelH + hs.reduce((a, b) => a + b, 0) + (hs.length - 1) * rowGap; };
  const sideH = k => sides[k].reduce((a, g) => a + groupH(g), 0) + Math.max(0, sides[k].length - 1) * groupGap;
  const fits = () => sideH("left") <= H && sideH("right") <= H;
  if (!fits()) { mode = "compact"; while (wraps() && csz > 10.5) csz -= 0.5; }
  if (!fits()) {
    // last resort: roomy cards two across, only where a card stays wide enough to hold its words
    mode = "roomy";
    while (!fits()) {
      const cand = groups.filter(g => colN.get(g) === 1 && nodes(g).length >= 2 && (sideW - 0.34) / 2 >= 1.9).sort((a, b) => nodes(b).length - nodes(a).length)[0];
      if (!cand) { groups.forEach(g => colN.set(g, 1)); mode = "compact"; break; }
      colN.set(cand, 2);
    }
  }
  // hub
  const hub = o.hub || {};
  K.rect(s, hubX, y0, hubW, H, T.NAVY); K.rect(s, hubX, y0, hubW, EDGE, T.TEAL);
  const hw = hubW - 0.44, hx = hubX + 0.22;
  let hy = y0 + 0.28;
  if (hub.kicker) { K.txt(s, String(hub.kicker).toUpperCase(), { x: hx, y: hy, w: hw, h: 0.26, fontSize: 10.5, bold: true, color: T.MINT, charSpacing: 1.6 }); hy += 0.32; }
  const ns = K.fitSize(hub.name || "", hw, 0.8, 30, 18, true, "head"), nhh = K.headHeight(hub.name || "", ns, hw, 1.2);
  K.htxt(s, hub.name || "", { x: hx, y: hy, w: hw, h: nhh + 0.04, fontSize: ns, color: T.WHITE, valign: "top" }); hy += nhh + 0.1;
  const chips = hub.chips || [];
  const chipLine = chips.length ? (hub.chipsLabel ? hub.chipsLabel + ": " : "") + chips.join(" \u00b7 ") : "";
  const stacked = chips.length * 0.4 + (hub.chipsLabel ? 0.3 : 0);
  const bodyRoom = y0 + H - 0.2 - hy - (chips.length ? stacked + 0.15 : 0);
  const useStack = !hub.body || K.textHeight(hub.body, 12, hw) <= bodyRoom;
  const chipsH = !chips.length ? 0 : useStack ? stacked : K.textHeight(chipLine, 11, hw) + 0.04;
  if (hub.body) {
    const room = y0 + H - 0.2 - hy - (chipsH ? chipsH + 0.15 : 0);
    const bs = K.fitSize(hub.body, hw, room, 12.5, 10.5);
    K.txt(s, hub.body, { x: hx, y: hy, w: hw, h: Math.max(room, 0.3), fontSize: bs, color: T.ON_NAVY, valign: "top" });
  }
  if (chips.length && useStack) {
    const cy0 = y0 + H - 0.2 - stacked;
    if (hub.chipsLabel) K.txt(s, String(hub.chipsLabel).toUpperCase(), { x: hx, y: cy0, w: hw, h: 0.26, fontSize: 10, bold: true, color: T.MINT, charSpacing: 1.4 });
    chips.forEach((c, i) => K.pill(s, { x: hx, y: cy0 + (hub.chipsLabel ? 0.3 : 0) + i * 0.4, w: hw, h: 0.32, text: c, variant: "dark", size: 10.5 }));
  } else if (chips.length) {
    K.txt(s, chipLine, { x: hx, y: y0 + H - 0.2 - chipsH, w: hw, h: chipsH, fontSize: 11, color: T.MINT, valign: "top" });
  }
  // groups
  ["left", "right"].forEach(side => {
    const gs = sides[side]; if (!gs.length) return;
    let gy = y0 + Math.max(0, (H - sideH(side)) / 2);
    const gx = side === "left" ? ML : PW - ML - sideW;
    gs.forEach(g => {
      const hl = !!g.highlight, c = colN.get(g), cw = cardW(g), hs = rowHeights(g);
      const lineC = hl ? T.AMBER : T.SLATE;
      K.txt(s, String(g.label || "").toUpperCase(), { x: gx, y: gy, w: sideW, h: 0.26, fontSize: 11, bold: true, color: hl ? T.AMBER_TXT : T.TEAL_TXT, charSpacing: 1.6, align: side === "left" ? "left" : "right" });
      const ny0 = gy + labelH, mids = [];
      const rowY = hs.map((_, r) => ny0 + hs.slice(0, r).reduce((a, b) => a + b, 0) + r * rowGap);
      nodes(g).forEach((n, j) => {
        const r = Math.floor(j / c), k = j % c, nh = hs[r];
        const nx = side === "left" ? gx + k * (cw + 0.14) : gx + 0.2 + k * (cw + 0.14), ny = rowY[r];
        const planned = isPlanned(n);
        if (planned) s.addShape("rect", { x: nx, y: ny, w: cw, h: nh, fill: { color: T.PAGE }, line: { color: T.SLATE, width: 1, dashType: "dash" } });
        else { K.rect(s, nx, ny, cw, nh, T.WHITE, { shadow: shadow() }); K.rect(s, side === "left" ? nx + cw - 0.06 : nx, ny, 0.06, nh, hl ? T.AMBER : T.TEAL); }
        const d = Math.min(0.4, nh - 0.12), ox = ix(n) + (side === "right" && !planned ? 0.04 : 0);
        if (n.icon) K.iconBadge(s, n.icon, nx + 0.12 + (side === "right" ? 0.04 : 0), ny + (nh - d) / 2, d, planned ? "navy" : "mint");
        const tagW = planned ? 0.62 : 0, tw = cw - ox - 0.16 - tagW;
        const runs = mode === "compact"
          ? [{ text: n.name, options: { bold: true, color: planned ? T.SLATE : T.INK, fontSize: csz } }].concat(n.role ? [{ text: "  \u2014  " + n.role, options: { color: T.SLATE, fontSize: csz - 1 } }] : [])
          : [{ text: n.name, options: { bold: true, color: planned ? T.SLATE : T.INK, fontSize: 13, breakLine: !!n.role } }].concat(n.role ? [{ text: n.role, options: { color: T.SLATE, fontSize: 11 } }] : []);
        K.txt(s, runs, { x: nx + ox, y: ny, w: tw, h: nh, valign: "middle", lineSpacingMultiple: 0.95 });
        if (planned) K.pill(s, { x: nx + cw - tagW - 0.1, y: ny + nh / 2 - 0.14, w: tagW, h: 0.28, text: "Next", variant: "outline", size: 10 });
        if (k === (side === "left" ? c - 1 : 0) || (side === "left" && j === nodes(g).length - 1)) mids.push(ny + nh / 2);
      });
      const rowsMid = [...new Set(mids)].sort((a, b) => a - b);
      const bx = side === "left" ? gx + sideW + 0.12 : gx + 0.08;
      rowsMid.forEach(m => K.hline(s, side === "left" ? gx + sideW : bx, m, side === "left" ? 0.12 : 0.12, lineC, 1));
      if (rowsMid.length > 1) K.vline(s, bx, rowsMid[0], rowsMid[rowsMid.length - 1] - rowsMid[0], lineC, 1);
      const my = (rowsMid[0] + rowsMid[rowsMid.length - 1]) / 2;
      const x1 = side === "left" ? bx : hubX + hubW, x2 = side === "left" ? hubX : bx;
      const toHub = g.flow === "in" || g.flow === "both", fromHub = g.flow === "out" || g.flow === "both";
      const endArrow = side === "left" ? toHub : fromHub, beginArrow = side === "left" ? fromHub : toHub;
      const ln = { color: lineC, width: hl ? 2.5 : 1.75 };
      if (beginArrow) ln.beginArrowType = "triangle";
      if (endArrow) ln.endArrowType = "triangle";
      s.addShape("line", { x: x1, y: my, w: x2 - x1, h: 0, line: ln });
      if (g.verb) K.txt(s, g.verb, { x: x1 + 0.04, y: my - 0.44, w: x2 - x1 - 0.08, h: 0.4, fontSize: 10, bold: true, italic: true, color: hl ? T.AMBER_TXT : T.SLATE, align: "center", valign: "bottom" });
      gy = ny0 + hs.reduce((a, b) => a + b, 0) + (hs.length - 1) * rowGap + groupGap;
    });
  });
  return bottom;
}
const isPlanned = n => String(n.status || "").toLowerCase() === "planned";

module.exports = { slideHeader, cardRow, placeBand, mapRows, panel, stackColumn, constantBand, columnLists, flowRow,
  houseChart, waterfallChart, tableBlock, scorecard, heatmap, treeLR, matrix2x2, shadow,
  numberedRows, kpiTile, stageGrid, rightsGrid, RIGHTS, beatStrip, beatStripNeed, ecosystemMap };
