/* ============================================================================
 *  DECK RENDERER (v2) — brief.json -> .pptx. Owns every coordinate.
 *
 *  45 patterns. Every content pattern accepts: eyebrow, headline, subtitle,
 *  band, source, notes, tune, audience. `band` is a string (statement style)
 *  or {text, style: statement|takeaway|bottom_line, label}. `tune` is the
 *  sanctioned adjustment block the eye pass writes into (contentY,
 *  headlineSize, maxH, minH, bandGap, cardTitleSize, fontSize, labelW, rowH,
 *  chartHeight, minWidth). Never hand-edit the .pptx.
 * ========================================================================== */
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");
const asset = f => { const l = path.join(__dirname, f); return fs.existsSync(l) ? l : path.join(__dirname, "..", "assets", f); };
const K = require(asset("deck_style_kit.js"));
const P = require(asset("deck_patterns.js"));
const { T, ML, CW, PW, PH, SZ, EDGE } = K;

const asLines = v => Array.isArray(v) ? v.join("\n") : (v || "");
/** band: string | [{text,bold}] | {text, style, label} -> {runs, style, label} */
function bandOf(b) {
  if (!b) return null;
  if (typeof b === "object" && !Array.isArray(b)) return { runs: [{ text: String(b.text || "") }], style: b.style || "statement", label: b.label };
  if (Array.isArray(b)) return { runs: b, style: "statement" };
  return { runs: [{ text: String(b) }], style: "statement" };
}
const bandH = d => { const b = bandOf(d.band); return b ? K.bandNeed(b.runs, b.style) + 0.3 : 0; };
const header = (s, d, onDark) => P.slideHeader(s, { onDark, eyebrow: d.eyebrow, headline: d.headline, subtitle: d.subtitle, headlineSize: (d.tune || {}).headlineSize || d.headlineSize });
const tune = (d, k, dflt) => (d.tune && d.tune[k] != null) ? d.tune[k] : dflt;
const startY = (d, y) => tune(d, "contentY", y);
const finish = (s, d, bottom, onDark) => { P.placeBand(s, bandOf(d.band), bottom + tune(d, "bandGap", 0)); K.sourceLine(s, d.source, onDark); return { s, onDark }; };
const page = p => { const s = p.addSlide(); K.bgWhite(s); return s; };

const normStatus = v => K.ragKey(v);
const STATUS_LABEL = { g: "On track", a: "At risk", r: "Needs decision", n: "Not started" };

let LOGO = null;      // {path, ratio}
let BRIEF_DIR = null; // relative image/logo paths resolve against the brief's folder
let SECTIONS = [];    // [{title, label}] in deck order, for the divider progress marks

function logoBox(s, x, y, boxW, boxH) {
  if (!LOGO) return;
  let w = boxW, h = boxW / LOGO.ratio; if (h > boxH) { h = boxH; w = boxH * LOGO.ratio; }
  s.addImage({ path: LOGO.path, x: x + (boxW - w) / 2, y: y + (boxH - h) / 2, w, h });
}

/* ---- the divider layout shared by section and backup ---- */
function divider(p, d, o) {
  const s = p.addSlide(); K.bgNavy(s, false);
  const stripW = 3.4;
  K.rect(s, 0, 0, stripW, PH, T.NAVY_DEEP); K.rect(s, stripW, 0, 0.07, PH, T.TEAL);
  if (o.number != null) K.htxt(s, o.number, { x: 0.3, y: 2.35, w: stripW - 0.6, h: 2.0, fontSize: 120, color: T.AMBER, align: "center", valign: "middle" });
  else if (o.icon) K.iconBadge(s, o.icon, stripW / 2 - 0.75, 2.6, 1.5, "teal");
  const x = stripW + 0.8, w = PW - x - ML;
  K.txt(s, String(o.eyebrow).toUpperCase(), { x, y: 2.2, w, h: 0.32, fontSize: SZ.eyebrow, bold: true, color: T.MINT, charSpacing: 2.4 });
  const yb = K.headline(s, d.headline, { onDark: true, x, w, y: 2.62, size: tune(d, "headlineSize", 44), min: 32 });
  const line = d.keyLine || d.subtitle;
  if (line) K.subtitle(s, line, { onDark: true, x, w, y: yb + 0.2, size: 18 });
  if (o.marks && SECTIONS.length > 1) {
    const n = SECTIONS.length, mw = Math.min(1.6, (w - (n - 1) * 0.16) / n);
    SECTIONS.forEach((sec, i) => {
      const mx = x + i * (mw + 0.16), cur = i === o.index;
      K.rect(s, mx, 6.2, mw, 0.08, cur ? T.AMBER : T.ON_NAVY_MUTE);
      K.txt(s, sec.label, { x: mx, y: 6.34, w: mw, h: 0.44, fontSize: 10.5, bold: cur, color: cur ? T.WHITE : T.ON_NAVY_MUTE, valign: "top" });
    });
  }
  return { s, onDark: true, footerX: stripW + 0.8 };
}

const PATTERNS = {
  /* ---------------- structural ---------------- */
  title(p, d) {
    const s = p.addSlide(); K.bgNavy(s, false);
    const railX = 9.62;
    K.rect(s, railX, 0, PW - railX, PH, T.NAVY_DEEP); K.rect(s, railX - 0.07, 0, 0.07, PH, T.TEAL);
    const x = 0.93, w = railX - x - 0.7;
    if (d.eyebrow) K.txt(s, String(d.eyebrow).toUpperCase(), { x, y: 1.2, w, h: 0.32, fontSize: SZ.eyebrow, bold: true, color: T.MINT, charSpacing: 2.8 });
    K.rect(s, x, 1.66, 0.8, 0.07, T.AMBER);
    let fs = tune(d, "headlineSize", 52);
    while (fs > 32 && K.lineCount(d.headline, fs, w - 0.08, true, "head") > 3) fs -= 1;
    const t = K.balanceBreak(d.headline, fs, w - 0.08, true, "head"), th = K.headHeight(t, fs, w - 0.08, 1.2) + 0.06;
    K.htxt(s, t, { x, y: 2.1, w, h: th, fontSize: fs, color: T.WHITE, valign: "top", lineSpacingMultiple: 0.96 });
    let y = 2.1 + th + 0.25;
    if (d.subtitle) y = K.subtitle(s, d.subtitle, { onDark: true, x, w, y, size: 18 });
    const meta = d.meta || d.note;
    if (meta) K.txt(s, meta, { x, y: 6.25, w, h: 0.4, fontSize: 12, color: T.ON_NAVY_MUTE, valign: "middle" });
    const rx = railX + 0.45, rw = PW - rx - 0.5;
    const figs = (d.figures || []).slice(0, 3);
    if (figs.length) {
      const gap = figs.length === 3 ? 1.71 : 2.1, y0 = figs.length === 3 ? 1.37 : 1.9;
      figs.forEach((f, i) => {
        const fy = y0 + i * gap;
        if (f.icon) K.iconBadge(s, f.icon, rx, fy + 0.1, 0.56, "teal");
        const vx = rx + (f.icon ? 0.86 : 0), vw = rw - (f.icon ? 0.86 : 0);
        K.htxt(s, String(f.value), { x: vx, y: fy - 0.05, w: vw, h: 0.72, fontSize: K.fitSize(String(f.value), vw, 0.72, 40, 24, true, "head"), color: T.WHITE, valign: "middle" });
        K.txt(s, f.label, { x: vx, y: fy + 0.68, w: vw, h: 0.5, fontSize: 13, color: T.ON_NAVY, valign: "top" });
      });
      if (LOGO) logoBox(s, rx, 6.2, rw, 0.7);
    } else {
      if (LOGO) logoBox(s, rx, 1.2, rw, 1.2);
      const marks = [d.date, K.deckConfig().status, K.deckConfig().classification].filter(Boolean);
      marks.forEach((m, i) => K.txt(s, m, { x: rx, y: 5.3 + i * 0.4, w: rw, h: 0.36, fontSize: 12.5, bold: i === 0, color: i === 0 ? T.WHITE : T.ON_NAVY_MUTE, valign: "middle" }));
    }
    return { s, onDark: true, noFooter: true };
  },
  section(p, d) {
    const idx = d._sectionIndex || 0;
    return divider(p, d, { number: String(idx + 1).padStart(2, "0"), index: idx, marks: true,
      eyebrow: d.eyebrow || `Section ${idx + 1} of ${Math.max(SECTIONS.length, 1)}` });
  },
  backup(p, d) {
    return divider(p, Object.assign({ headline: "Supporting detail." }, d), { icon: "archive", eyebrow: d.eyebrow || "Backup", marks: false });
  },
  statement(p, d) {
    const s = p.addSlide(); K.bgNavy(s);
    let y = 1.9;
    if (d.icon) { K.iconBadge(s, d.icon, ML, 1.3, 0.8, "teal"); y = 2.4; }
    if (d.eyebrow) K.txt(s, String(d.eyebrow).toUpperCase(), { x: ML, y, w: CW, h: 0.32, fontSize: SZ.eyebrow, bold: true, color: T.MINT, charSpacing: 2.4 });
    const yb = K.headline(s, d.headline, { onDark: true, y: y + 0.42, size: tune(d, "headlineSize", 46), min: 32 });
    if (d.body) K.subtitle(s, asLines(d.body), { onDark: true, y: yb + 0.3, size: 19 });
    if (d.kicker) K.txt(s, d.kicker, { x: ML, y: 6.2, w: CW, h: 0.36, fontSize: 14, italic: true, color: T.ON_NAVY_MUTE });
    return { s, onDark: true };
  },
  agenda(p, d) {
    const s = page(p);
    const y0 = header(s, Object.assign({ eyebrow: "Agenda" }, d));
    const items = d.items || [];
    const rowH = Math.min(0.86, (K.CONTENT_BOTTOM - y0 - 0.1) / Math.max(items.length, 1));
    const w = CW * 0.7;
    items.forEach((it, i) => {
      const y = y0 + i * rowH, cur = d.current === i + 1 || d.current === it;
      const title = typeof it === "string" ? it : it.title, note = typeof it === "string" ? "" : (it.note || "");
      if (cur) { K.rect(s, ML, y + 0.05, w, rowH - 0.1, T.NAVY); K.rect(s, ML, y + 0.05, EDGE, rowH - 0.1, T.AMBER); }
      else K.hline(s, ML, y + rowH, w, T.RULE, 0.75);
      K.htxt(s, String(i + 1).padStart(2, "0"), { x: ML + 0.25, y, w: 0.8, h: rowH, fontSize: 22, color: T.AMBER, valign: "middle" });
      K.txt(s, [{ text: title, options: { bold: true, color: cur ? T.WHITE : T.INK, fontSize: 18 } }].concat(note ? [{ text: "   " + note, options: { color: cur ? T.ON_NAVY : T.SLATE, fontSize: 13 } }] : []),
        { x: ML + 1.15, y, w: w - 1.3, h: rowH, valign: "middle" });
    });
    return finish(s, d, y0 + items.length * rowH);
  },
  exec_summary(p, d) {
    const s = page(p);
    let y = header(s, Object.assign({ eyebrow: "Executive summary" }, d));
    const ans = bandOf(d.answer || d.headline); const ah = K.bandNeed(ans.runs, "statement");
    K.band(s, ans.runs, y, ah, "statement"); y += ah + 0.28;
    const ask = d.decision ? { text: d.decision, label: "Decision needed" } : null, risk = d.risk ? { text: d.risk, label: "Biggest risk" } : null;
    const stripH = (ask || risk) ? P.beatStripNeed(ask, risk) : 0;
    const room = K.CONTENT_BOTTOM - y - (stripH ? stripH + 0.25 : 0);
    const kls = (d.keyLines || []).map(t => ({ title: t }));
    let tsz = 17; while (tsz > 12 && kls.reduce((a, k) => a + Math.max(0.34, K.textHeight(k.title, tsz, CW - 0.62, true)) + 0.12, 0) > room) tsz -= 0.5;
    y = P.numberedRows(s, kls, { y, titleSize: tsz, gap: 0.12, minH: 0.34, numSize: 22 }) + 0.25;
    if (ask || risk) P.beatStrip(s, ask, risk, Math.max(y, K.CONTENT_BOTTOM - stripH), stripH);
    K.sourceLine(s, d.source);
    return { s };
  },
  ask(p, d) {
    const s = page(p);
    const y = startY(d, header(s, d));
    if (d.lead) {
      /* audience-addressed ask: a lead card (who, what, why) beside numbered actions */
      const leftW = CW * 0.56, rightX = ML + leftW + 0.3, rightW = CW - leftW - 0.3;
      const L = d.lead, pts = L.points || [];
      const need = 0.3 + 0.34 + K.headHeight(L.text, 22, leftW - 0.8) + 0.2 + pts.reduce((a, t) => a + K.textHeight(t, 14, leftW - 1.0) + 0.1, 0) + 0.3;
      const acts = d.actions || [];
      const actH = acts.map(a => Math.max(0.9, K.textHeight(a.title, 15, rightW - 1.0, true) + (a.body ? K.textHeight(a.body, 12.5, rightW - 1.0) : 0) + 0.44));
      const H = Math.min(Math.max(need, actH.reduce((a, b) => a + b, 0) + (acts.length - 1) * 0.22), K.CONTENT_BOTTOM - y - bandH(d));
      K.rect(s, ML, y, leftW, H, T.WHITE, { shadow: P.shadow() }); K.rect(s, ML, y, EDGE, H, T.AMBER);
      let cy = y + 0.3;
      if (L.audience) { K.txt(s, L.audience, { x: ML + 0.45, y: cy, w: leftW - 0.8, h: 0.28, fontSize: 12.5, bold: true, color: T.AMBER_TXT, charSpacing: 1 }); cy += 0.36; }
      const th = K.headHeight(L.text, 22, leftW - 0.8);
      K.htxt(s, L.text, { x: ML + 0.45, y: cy, w: leftW - 0.8, h: th + 0.05, fontSize: 22, color: T.INK, valign: "top" }); cy += th + 0.2;
      if (pts.length) K.txt(s, pts.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < pts.length - 1 } })), { x: ML + 0.5, y: cy, w: leftW - 0.9, h: y + H - cy - 0.2, fontSize: 14, color: T.INK, paraSpaceAfter: 6, valign: "top" });
      let ay = y;
      acts.forEach((a, i) => {
        const h = Math.min(actH[i], (H - (acts.length - 1) * 0.22) / acts.length + 0.001) ;
        K.rect(s, rightX, ay, rightW, h, T.NAVY);
        K.numeral(s, i + 1, rightX + 0.28, ay + 0.2, 0.5, 0.5, 26);
        K.txt(s, a.title, { x: rightX + 0.85, y: ay + 0.22, w: rightW - 1.05, h: 0.34, fontSize: 15, bold: true, color: T.WHITE, valign: "top" });
        if (a.body) K.txt(s, a.body, { x: rightX + 0.85, y: ay + 0.58, w: rightW - 1.05, h: h - 0.66, fontSize: 12.5, color: T.ON_NAVY, valign: "top" });
        ay += h + 0.22;
      });
      return finish(s, d, y + H);
    }
    const items = (d.cards || d.asks || []).map(c => ({ kicker: c.kicker, title: c.title, body: asLines(c.body), highlight: !!c.highlight, icon: c.icon }));
    return finish(s, d, P.cardRow(s, items, { y, titleSize: tune(d, "cardTitleSize", SZ.cardTitle), minH: tune(d, "minH", 2.0), maxH: tune(d, "maxH", 3.2), reserve: bandH(d) }));
  },
  risks(p, d) {
    const s = page(p);
    const y = header(s, d);
    const cols = [{ header: "Risk", width: 3 }, { header: "Impact", width: 1.1, align: "center" }, { header: "Owner", width: 1.4, align: "left" }, { header: "Mitigation", width: 3.6, align: "left" }];
    const rows = (d.rows || []).map(r => [r.risk, r.status ? { text: r.impact || K.RAG[K.ragKey(r.status)].label, status: r.status } : (r.impact || ""), r.owner || "", asLines(r.mitigation)]);
    const bottom = P.tableBlock(s, { y: startY(d, y), columns: cols, rows, fontSize: tune(d, "fontSize", 12.5), highlightRow: d.highlightRow });
    return finish(s, d, bottom);
  },
  sources(p, d) {
    const s = page(p);
    let y = header(s, Object.assign({ eyebrow: "Sources", headline: "Sources cited in this deck." }, d));
    (d.items || []).forEach((it, i) => {
      const line = typeof it === "string" ? it : [it.publisher, it.title, it.date, it.url].filter(Boolean).join(" \u00b7 ");
      const h = K.textHeight(line, 12, CW - 0.5) + 0.12;
      K.txt(s, `${i + 1}.`, { x: ML, y, w: 0.4, h, fontSize: 12, color: T.SLATE, valign: "top" });
      K.txt(s, line, { x: ML + 0.45, y, w: CW - 0.45, h, fontSize: 12, color: T.INK, valign: "top" });
      y += h + 0.06;
    });
    return { s };
  },

  /* ---------------- parallel ---------------- */
  cards(p, d) {
    const dark = !!d.dark;
    const s = p.addSlide(); if (dark) K.bgNavy(s); else K.bgWhite(s);
    const y = startY(d, header(s, d, dark));
    const items = (d.cards || []).map(c => ({ kicker: c.kicker, title: c.title, body: asLines(c.body), caption: c.caption, highlight: !!c.highlight, accent: !!c.accent, icon: c.icon, iconTone: c.iconTone }));
    const bottom = P.cardRow(s, items, { y, dark, titleSize: tune(d, "cardTitleSize"), minH: tune(d, "minH", 1.9), maxH: tune(d, "maxH", 3.6), reserve: bandH(d) });
    if (dark && d.band) { const b = bandOf(d.band); K.txt(s, b.runs.map(r => r.text).join(""), { x: ML, y: bottom + 0.35, w: CW, h: 0.5, fontSize: 17, italic: true, color: T.WHITE, valign: "top" }); K.sourceLine(s, d.source, true); return { s, onDark: true }; }
    return finish(s, d, bottom, dark);
  },
  image(p, d) {
    /* A screenshot or photograph with a caption and optional numbered callouts.
     * The image must be a real file at usable resolution: a Confluence/Word
     * thumbnail (typically 350-450 px wide) reads as a smear on a 13.33 in
     * slide. Fail loudly and ask the user for a full-size capture. */
    const minW = tune(d, "minWidth", 800);
    if (d.image && !fs.existsSync(d.image) && BRIEF_DIR && fs.existsSync(path.join(BRIEF_DIR, d.image))) d.image = path.join(BRIEF_DIR, d.image);
    if (!d.image || !fs.existsSync(d.image)) throw new Error(`image slide "${d.headline}": image file not found: ${d.image}. Ask the user for the screenshot; never draw a mock-up in its place.`);
    let iw = 0, ih = 0;
    try { [iw, ih] = require("child_process").execFileSync("python3", ["-c", `from PIL import Image;im=Image.open('${d.image}');print(im.size[0],im.size[1])`]).toString().trim().split(" ").map(Number); } catch { throw new Error(`image slide: cannot read ${d.image} (is Pillow installed?)`); }
    if (iw < minW) throw new Error(`image slide "${d.headline}": ${d.image} is ${iw}x${ih} px, below the ${minW} px minimum. This is a thumbnail. Ask the user for a full-size capture (or set tune.minWidth if they accept the quality).`);
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const callouts = d.callouts || [];
    const capH = d.caption ? K.textHeight(String(d.caption), 12, CW) + 0.15 : 0;
    const calloutW = callouts.length ? 3.6 : 0;
    const boxW = CW - calloutW - (callouts.length ? 0.35 : 0), boxH = K.CONTENT_BOTTOM - y0 - capH - 0.1 - bandH(d);
    const ratio = iw / ih; let w = boxW, h = w / ratio; if (h > boxH) { h = boxH; w = h * ratio; }
    const x = ML + (boxW - w) / 2;
    K.rect(s, x - 0.05, y0 - 0.05, w + 0.1, h + 0.1, T.WHITE, { line: { color: T.RULE, width: 0.75 }, shadow: P.shadow() });
    s.addImage({ path: d.image, x, y: y0, w, h });
    if (d.caption) K.txt(s, String(d.caption), { x: ML, y: y0 + h + 0.14, w: boxW, h: capH, fontSize: 12, italic: true, color: T.SLATE, valign: "top" });
    let cy = y0;
    callouts.forEach((c, i) => {
      const cx = ML + boxW + 0.35;
      const bodyH = K.textHeight(String(c.body || ""), 12.5, calloutW - 0.6) + 0.1;
      s.addShape("ellipse", { x: cx, y: cy, w: 0.38, h: 0.38, fill: { color: T.NAVY }, line: { type: "none" } });
      K.txt(s, String(i + 1), { x: cx, y: cy, w: 0.38, h: 0.38, fontSize: 13, bold: true, color: T.WHITE, align: "center", valign: "middle" });
      K.txt(s, String(c.title || ""), { x: cx + 0.52, y: cy, w: calloutW - 0.52, h: 0.34, fontSize: 14, bold: true, color: T.INK });
      K.txt(s, String(c.body || ""), { x: cx + 0.52, y: cy + 0.36, w: calloutW - 0.52, h: bodyH, fontSize: 12.5, color: T.INK, valign: "top" });
      cy += 0.42 + bodyH + 0.14;
    });
    return finish(s, d, Math.max(y0 + h + capH, cy));
  },
  quote(p, d) {
    const s = page(p);
    const y = startY(d, header(s, d) + 0.1);
    const q = "\u201C" + d.quote + "\u201D";
    const fsz = K.fitSize(q, CW - 1.8, 2.6, 28, 18, false, "head");
    const h = K.textHeight(q, fsz, CW - 1.8, false, 1.15, "head") + 0.2;
    K.rect(s, ML, y, CW, h + 1.15, T.WHITE, { shadow: P.shadow() }); K.rect(s, ML, y, EDGE, h + 1.15, T.TEAL);
    K.txt(s, q, { x: ML + 0.8, y: y + 0.35, w: CW - 1.6, h, fontFace: K.HEAD, fontSize: fsz, italic: true, color: T.INK, valign: "top" });
    K.txt(s, "\u2014 " + (d.attribution || ""), { x: ML + 0.8, y: y + h + 0.5, w: CW - 1.6, h: 0.4, fontSize: 13, bold: true, color: T.TEAL_TXT });
    return finish(s, d, y + h + 1.15);
  },

  /* ---------------- sequence ---------------- */
  phases(p, d) {
    const s = page(p);
    let y = startY(d, header(s, d));
    const colW = d.columns ? (CW - (d.columns.length - 1) * 0.3) / d.columns.length : 0;
    const colsNeed = d.columns ? 0.52 + Math.max(...d.columns.map(c => c.items.reduce((a, t) => a + K.textHeight(t, 12.5, colW - 0.4) + 0.08, 0))) + 0.1 : 0;
    const reserve = (d.constant ? 0.8 : 0) + colsNeed + bandH(d) + 0.25;
    y = P.flowRow(s, (d.phases || []).map(f => ({ tag: f.tag, title: f.title, body: asLines(f.body), highlight: !!f.highlight })), y, { maxH: K.CONTENT_BOTTOM - y - reserve }) + 0.22;
    if (d.constant) { P.constantBand(s, { y, h: 0.56, label: d.constant.label, text: d.constant.text, tag: d.constant.tag }); y += 0.76; }
    if (d.columns) y = P.columnLists(s, { y, fontSize: 12.5, columns: d.columns.map(c => ({ header: c.header, items: c.items, headerVariant: c.highlight ? "highlight" : (c.variant || "light") })) }) + 0.1;
    return finish(s, d, y);
  },
  chevrons(p, d) {
    const s = page(p);
    const y = startY(d, header(s, d));
    const steps = d.steps || [], n = steps.length, gap = 0.08, w = (CW - (n - 1) * gap) / n, h = 0.78;
    steps.forEach((st, i) => K.chevron(s, { x: ML + i * (w + gap), y, w, h, text: st.title, first: i === 0, size: n > 5 ? 12 : 14,
      fill: st.highlight ? T.AMBER : (i === n - 1 ? T.NAVY : T.STEEL), color: st.highlight ? T.INK : (i === n - 1 ? T.WHITE : T.INK) }));
    let by = y + h + 0.22, maxB = by;
    steps.forEach((st, i) => {
      if (!st.body) return;
      const body = asLines(st.body), bh = K.textHeight(body, 12.5, w - 0.24) + 0.1;
      K.txt(s, body, { x: ML + i * (w + gap) + 0.12, y: by, w: w - 0.24, h: bh, fontSize: 12.5, color: T.INK, valign: "top" });
      maxB = Math.max(maxB, by + bh);
    });
    return finish(s, d, maxB);
  },
  steps(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const steps = d.steps || [], n = steps.length;
    const H = Math.min(3.8, K.CONTENT_BOTTOM - y0 - bandH(d) - 0.1), riser = H / n, tread = CW / n;
    steps.forEach((st, i) => {
      const x = ML + i * tread, top = y0 + H - (i + 1) * riser, last = i === n - 1 && !st.highlight;
      K.rect(s, x, top, tread * (n - i), riser, st.highlight ? T.AMBER : last ? T.NAVY : (i % 2 ? T.STEEL : T.ZEBRA), { line: { color: T.PAGE, width: 1.5 } });
      K.txt(s, st.title, { x: x + 0.14, y: top + 0.08, w: tread - 0.28, h: 0.34, fontSize: 13, bold: true, color: last ? T.WHITE : T.INK, valign: "top" });
      if (st.body) K.txt(s, asLines(st.body), { x: x + 0.14, y: top + 0.42, w: tread - 0.28, h: riser - 0.46, fontSize: 11.5, color: last ? T.ON_NAVY : T.INK, valign: "top" });
    });
    return finish(s, d, y0 + H);
  },

  /* ---------------- causes to effect ---------------- */
  leading_to(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const causes = d.causes || [], n = causes.length;
    const leftW = CW * 0.58, rightW = CW - leftW - 0.7;
    const H = Math.min(3.9, K.CONTENT_BOTTOM - y0 - bandH(d) - 0.05), rowH = (H - (n - 1) * 0.14) / n;
    causes.forEach((c, i) => {
      const y = y0 + i * (rowH + 0.14);
      s.addShape("homePlate", { x: ML, y, w: leftW, h: rowH, fill: { color: c.highlight ? T.AMBER : T.WHITE }, line: { color: T.RULE, width: 0.75 } });
      K.rect(s, ML, y, EDGE, rowH, c.highlight ? T.AMBER_TXT : T.TEAL);
      const th = K.textHeight(c.title || c, 13.5, leftW - 1.0, true);
      K.txt(s, c.title || c, { x: ML + 0.3, y: y + 0.12, w: leftW - 1.0, h: th + 0.04, fontSize: 13.5, bold: true, color: T.INK, valign: "top" });
      if (c.body) K.txt(s, asLines(c.body), { x: ML + 0.3, y: y + 0.18 + th, w: leftW - 1.0, h: rowH - th - 0.24, fontSize: 11.5, color: c.highlight ? T.INK : T.SLATE, valign: "top" });
    });
    K.card(s, { x: ML + leftW + 0.7, y: y0, w: rightW, h: H, kicker: d.effectKicker || "Result", title: d.effect, body: asLines(d.effectBody), highlight: true, titleSize: 20, icon: d.effectIcon });
    return finish(s, d, y0 + H);
  },
  funnel(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const stages = d.stages || [], n = stages.length;
    const H = Math.min(3.9, K.CONTENT_BOTTOM - y0 - bandH(d) - 0.05), rowH = (H - (n - 1) * 0.07) / n;
    const maxW = CW * 0.6, minW = maxW * 0.36, cx = ML + maxW / 2;
    stages.forEach((st, i) => {
      const w = maxW - (maxW - minW) * (i / Math.max(1, n - 1)), y = y0 + i * (rowH + 0.07), last = i === n - 1 && !st.highlight;
      K.rect(s, cx - w / 2, y, w, rowH, st.highlight ? T.AMBER : last ? T.NAVY : (i % 2 ? T.STEEL : T.ZEBRA));
      K.txt(s, st.title + (st.value != null ? "   " + st.value : ""), { x: cx - w / 2, y, w, h: rowH, fontSize: 13.5, bold: true, color: last ? T.WHITE : T.INK, align: "center", valign: "middle" });
      if (st.note) K.txt(s, st.note, { x: ML + maxW + 0.45, y, w: CW - maxW - 0.45, h: rowH, fontSize: 12.5, color: T.INK, valign: "middle" });
    });
    return finish(s, d, y0 + H);
  },

  /* ---------------- decomposition ---------------- */
  logic_tree(p, d) { const s = page(p); const y = startY(d, header(s, d));
    P.treeLR(s, { y, root: d.root, children: d.children || [], bottom: K.CONTENT_BOTTOM - bandH(d) });
    return finish(s, d, K.CONTENT_BOTTOM - bandH(d)); },
  driver_tree(p, d) { const s = page(p); const y = startY(d, header(s, d));
    P.treeLR(s, { y, root: d.root, children: d.children || [], bottom: K.CONTENT_BOTTOM - bandH(d) });
    return finish(s, d, K.CONTENT_BOTTOM - bandH(d)); },
  hypothesis_tree(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const hyps = d.hypotheses || [], n = hyps.length, gap = 0.3, w = (CW - (n - 1) * gap) / n;
    const ans = bandOf(d.answer), ah = K.bandNeed(ans.runs, "statement"); K.band(s, ans.runs, y0, ah, "statement");
    const top = y0 + ah + 0.38;
    K.hline(s, ML + w / 2, top - 0.19, CW - w, T.SLATE, 1);
    const H = K.CONTENT_BOTTOM - bandH(d) - top;
    hyps.forEach((hp, i) => {
      const x = ML + i * (w + gap), hl = !!hp.highlight;
      K.vline(s, x + w / 2, top - 0.19, 0.19, T.SLATE, 1);
      K.rect(s, x, top, w, 0.56, hl ? T.AMBER : T.NAVY);
      K.txt(s, hp.title, { x: x + 0.12, y: top, w: w - 0.24, h: 0.56, fontSize: 12.5, bold: true, color: hl ? T.INK : T.WHITE, align: "center", valign: "middle" });
      K.rect(s, x, top + 0.66, w, H - 0.66, T.WHITE, { shadow: P.shadow() });
      const runs = (hp.evidence || []).map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < hp.evidence.length - 1 } }));
      if (runs.length) K.txt(s, runs, { x: x + 0.14, y: top + 0.78, w: w - 0.28, h: H - 0.9, fontSize: 12, color: T.INK, paraSpaceAfter: 5, valign: "top" });
    });
    return finish(s, d, K.CONTENT_BOTTOM - bandH(d));
  },

  /* ---------------- comparison ---------------- */
  table(p, d) { const s = page(p); const y = startY(d, header(s, d));
    const bottom = P.tableBlock(s, { y, columns: d.columns, rows: d.rows, fontSize: tune(d, "fontSize", 13), highlightRow: d.highlightRow });
    if (d.note) K.txt(s, d.note, { x: ML, y: bottom + (d.band ? bandH(d) + 0.1 : 0.12), w: CW, h: 0.3, fontSize: 11.5, italic: true, color: T.SLATE });
    return finish(s, d, bottom); },
  scorecard(p, d) { const s = page(p); const y = startY(d, header(s, d));
    const bottom = P.scorecard(s, { y, rows: d.rows, columns: d.columns, mode: d.mode, labelW: tune(d, "labelW"), rowH: tune(d, "rowH"), maxH: K.CONTENT_BOTTOM - y - bandH(d) - (d.legend ? 0.4 : 0) });
    if (d.legend) K.txt(s, d.legend, { x: ML, y: bottom + 0.1, w: CW, h: 0.28, fontSize: 11, italic: true, color: T.SLATE });
    return finish(s, d, bottom + (d.legend ? 0.38 : 0)); },
  heatmap(p, d) { const s = page(p); const y = startY(d, header(s, d));
    const bottom = P.heatmap(s, { y, rows: d.rows, columns: d.columns, min: d.min, max: d.max, labelW: tune(d, "labelW"), maxH: K.CONTENT_BOTTOM - y - bandH(d) });
    return finish(s, d, bottom); },

  /* ---------------- quantity ---------------- */
  chart(p, d) {
    const s = page(p);
    const y = startY(d, header(s, d));
    const c = d.chart || {}, side = d.card || d.panel;
    const h = tune(d, "chartHeight", K.CONTENT_BOTTOM - y - bandH(d) - 0.05), w = side ? 7.4 : CW;
    P.houseChart(s, c, { x: ML - 0.1, y, w, h });
    if (d.panel) chartPanel(s, d.panel, ML + w + 0.35, y, CW - w - 0.35, h);
    else if (d.card) K.card(s, { x: ML + w + 0.35, y, w: CW - w - 0.35, h, kicker: d.card.kicker, title: d.card.title, titleSize: 17, body: asLines(d.card.body), caption: d.card.caption, icon: d.card.icon });
    return finish(s, d, y + h);
  },
  waterfall(p, d) {
    const s = page(p);
    const y = startY(d, header(s, d));
    const side = d.card || d.panel, h = tune(d, "chartHeight", K.CONTENT_BOTTOM - y - bandH(d) - 0.05), w = side ? 7.4 : CW;
    P.waterfallChart(s, d.waterfall || {}, { x: ML - 0.1, y, w, h });
    if (d.panel) chartPanel(s, d.panel, ML + w + 0.35, y, CW - w - 0.35, h);
    else if (d.card) K.card(s, { x: ML + w + 0.35, y, w: CW - w - 0.35, h, kicker: d.card.kicker, title: d.card.title, titleSize: 17, body: asLines(d.card.body), caption: d.card.caption });
    return finish(s, d, y + h);
  },
  matrix(p, d) {
    const s = page(p);
    const y = startY(d, header(s, d));
    const r = P.matrix2x2(s, { y, h: tune(d, "maxH", K.CONTENT_BOTTOM - y - bandH(d) - 0.45), quadrants: d.quadrants, xAxis: d.xAxis, yAxis: d.yAxis, items: d.items, highlightQuadrant: d.highlightQuadrant });
    if (d.card) K.card(s, { x: r.right, y, w: PW - ML - r.right, h: r.bottom - y - 0.42, kicker: d.card.kicker, title: d.card.title, titleSize: 16, body: asLines(d.card.body) });
    return finish(s, d, r.bottom);
  },

  /* ---------------- time plans ---------------- */
  gantt(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const periods = d.periods || [], rows = d.rows || [], labelW = tune(d, "labelW", 2.8), pw = (CW - labelW) / periods.length;
    const rh = Math.min(0.54, (K.CONTENT_BOTTOM - y0 - bandH(d) - 0.7) / Math.max(rows.length, 1));
    K.rect(s, ML + labelW, y0, CW - labelW, 0.4, T.NAVY);
    periods.forEach((pd, j) => K.txt(s, pd, { x: ML + labelW + j * pw, y: y0, w: pw, h: 0.4, fontSize: 11, bold: true, color: T.WHITE, align: "center", valign: "middle" }));
    let y = y0 + 0.44;
    rows.forEach((r, i) => {
      K.rect(s, ML, y, CW, rh, i % 2 ? T.ZEBRA : T.WHITE);
      K.txt(s, r.label, { x: ML + 0.12, y, w: labelW - 0.24, h: rh, fontSize: 12.5, bold: true, color: T.INK, valign: "middle" });
      const a = r.start - 1, b = r.end;
      K.rect(s, ML + labelW + a * pw + 0.05, y + rh * 0.22, (b - a) * pw - 0.1, rh * 0.56, r.highlight ? T.AMBER : r.done ? T.STEEL : T.TEAL);
      (r.milestones || []).forEach(m => { const mx = ML + labelW + (m.at - 0.5) * pw; s.addShape("diamond", { x: mx - 0.12, y: y + rh / 2 - 0.12, w: 0.24, h: 0.24, fill: { color: T.NAVY }, line: { color: T.WHITE, width: 1 } });
        if (m.label) K.txt(s, m.label, { x: mx + 0.16, y, w: 1.8, h: rh, fontSize: 10.5, bold: true, color: T.INK, valign: "middle" }); });
      y += rh;
    });
    periods.forEach((_, j) => K.vline(s, ML + labelW + j * pw, y0 + 0.44, y - y0 - 0.44, T.RULE, 0.5));
    if (d.today) { const tx = ML + labelW + (d.today - 0.5) * pw; K.vline(s, tx, y0 + 0.4, y - y0 - 0.4, T.NAVY, 1.75); K.txt(s, "today", { x: tx - 0.4, y: y + 0.03, w: 0.8, h: 0.24, fontSize: 10, bold: true, color: T.INK, align: "center" }); }
    return finish(s, d, y + 0.28);
  },
  roadmap(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const periods = d.periods || [], rows = d.rows || [];
    const impactW = d.impactHeader ? 1.6 : 0, labelW = tune(d, "labelW", 2.4), pw = (CW - labelW - impactW) / periods.length;
    periods.forEach((pd, j) => K.pill(s, { x: ML + labelW + j * pw + 0.04, y: y0, w: pw - 0.08, h: 0.4, text: pd, variant: "navy", size: 12 }));
    if (impactW) K.txt(s, d.impactHeader, { x: PW - ML - impactW, y: y0, w: impactW, h: 0.4, fontSize: 11.5, bold: true, color: T.INK, align: "center", valign: "middle" });
    let y = y0 + 0.52;
    const rh = Math.min(0.78, (K.CONTENT_BOTTOM - y0 - bandH(d) - 0.55) / Math.max(rows.length, 1));
    rows.forEach(r => {
      K.txt(s, r.label, { x: ML, y, w: labelW - 0.15, h: rh, fontSize: 13, bold: true, color: T.INK, valign: "middle" });
      (r.activities || []).forEach(a => {
        const x = ML + labelW + (a.start - 1) * pw + 0.05, w = (a.end - a.start + 1) * pw - 0.1;
        K.rect(s, x, y + 0.08, w, rh - 0.16, T.WHITE, { shadow: P.shadow() }); K.rect(s, x, y + 0.08, EDGE, rh - 0.16, a.highlight ? T.AMBER : T.TEAL);
        K.txt(s, a.label, { x: x + 0.16, y: y + 0.08, w: w - 0.24, h: rh - 0.16, fontSize: 11.5, bold: true, color: T.INK, align: "center", valign: "middle" });
      });
      if (impactW && r.impact != null) K.txt(s, String(r.impact), { x: PW - ML - impactW, y, w: impactW, h: rh, fontSize: 13, bold: true, color: T.INK, align: "center", valign: "middle" });
      K.hline(s, ML, y + rh, CW, T.RULE, 0.75);
      y += rh;
    });
    return finish(s, d, y);
  },
  phases_threads(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const phases = d.phases || [], threads = d.threads || [];
    const labelW = tune(d, "labelW", 2.4), pw = (CW - labelW) / phases.length;
    phases.forEach((ph, i) => K.chevron(s, { x: ML + labelW + i * pw, y: y0, w: pw - 0.04, h: 0.54, text: ph, first: i === 0, fill: i === phases.length - 1 ? T.NAVY : T.STEEL, color: i === phases.length - 1 ? T.WHITE : T.INK, size: 12 }));
    let y = y0 + 0.74;
    threads.forEach(th => {
      const cells = th.items || [];
      const h = Math.max(0.52, ...cells.map(c => K.textHeight(asLines(c), 11.5, pw - 0.3) + 0.2));
      K.txt(s, th.label, { x: ML, y, w: labelW - 0.2, h, fontSize: 13, bold: true, color: T.INK, valign: "middle" });
      cells.forEach((c, i) => { if (c) K.txt(s, asLines(c), { x: ML + labelW + i * pw + 0.12, y, w: pw - 0.3, h, fontSize: 11.5, color: T.INK, valign: "middle" }); });
      K.hline(s, ML, y + h + 0.05, CW, T.RULE, 0.75);
      y += h + 0.12;
    });
    return finish(s, d, y);
  },

  /* ---------------- trade-off, maturity ---------------- */
  balance(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const H = Math.min(3.5, K.CONTENT_BOTTOM - y0 - bandH(d) - 0.55), panW = CW * 0.42;
    const heavier = d.heavier || "right";
    const yL = y0 + (heavier === "left" ? 0.45 : 0), yR = y0 + (heavier === "right" ? 0.45 : 0);
    const side = (x, y, o) => K.card(s, { x, y, w: panW, h: H - 0.45, kicker: o.kicker, title: o.title, body: asLines(o.items ? o.items.map(t => "\u2022 " + t).join("\n") : o.body), titleSize: 17, bodySize: 13, highlight: !!o.highlight });
    side(ML, yL, d.left || {}); side(PW - ML - panW, yR, d.right || {});
    const beamY = y0 + H + 0.05, cx = ML + CW / 2;
    s.addShape("triangle", { x: cx - 0.3, y: beamY - 0.05, w: 0.6, h: 0.45, fill: { color: T.NAVY }, line: { type: "none" } });
    s.addShape("line", { x: ML + 0.4, y: beamY, w: CW - 0.8, h: 0, line: { color: T.NAVY, width: 3 } });
    return finish(s, d, beamY + 0.45);
  },
  maturity(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const stages = d.stages || [], n = stages.length, curI = (d.current || 0) - 1;
    const H = Math.min(3.8, K.CONTENT_BOTTOM - y0 - bandH(d) - 0.4), sw = CW / n;
    stages.forEach((st, i) => {
      const h = H * (0.35 + 0.65 * (i / Math.max(1, n - 1))), x = ML + i * sw, top = y0 + H - h;
      const cur = i === curI, past = i < curI;
      K.rect(s, x + 0.04, top, sw - 0.08, h, cur ? T.AMBER : past ? T.NAVY : T.WHITE, cur || past ? {} : { line: { color: T.RULE, width: 0.75 } });
      K.txt(s, st.title, { x: x + 0.16, y: top + 0.1, w: sw - 0.32, h: 0.36, fontSize: 13, bold: true, color: past ? T.WHITE : T.INK, valign: "top" });
      if (st.body) K.txt(s, asLines(st.body), { x: x + 0.16, y: top + 0.48, w: sw - 0.32, h: h - 0.54, fontSize: 11.5, color: past ? T.ON_NAVY : T.INK, valign: "top" });
      K.txt(s, st.tag || `Stage ${i + 1}`, { x, y: y0 + H + 0.08, w: sw, h: 0.28, fontSize: 11, bold: true, color: cur ? T.AMBER_TXT : T.SLATE, align: "center", charSpacing: 1 });
    });
    return finish(s, d, y0 + H + 0.36);
  },
  curve(p, d) {
    const s = page(p);
    const y = startY(d, header(s, d));
    const c = d.curve || {}, h = tune(d, "chartHeight", K.CONTENT_BOTTOM - y - bandH(d) - 0.05), side = d.card || d.panel, w = side ? 7.4 : CW;
    const series = [{ name: c.seriesName || "Curve", labels: c.labels, values: c.values }];
    s.addChart("line", series, { x: ML - 0.1, y, w, h, chartColors: [T.TEAL], lineSize: 3, lineSmooth: true, lineDataSymbol: "none",
      showLegend: false, showTitle: !!c.title, title: c.title, showValue: false, valAxisHidden: c.showAxis === false,
      catAxisLabelColor: T.SLATE, catAxisLabelFontSize: 12, catAxisLabelFontFace: K.FONT, valAxisLabelColor: T.SLATE, valAxisLabelFontSize: 11, valAxisLabelFontFace: K.FONT,
      valGridLine: { style: "none" }, catGridLine: { style: "none" }, titleFontSize: 13, titleColor: T.INK, titleFontFace: K.FONT });
    if (c.marker) K.pill(s, { x: ML + 0.4 + (c.marker.at / Math.max(1, c.labels.length - 1)) * (w - 1.3), y: y + 0.4, w: 1.6, h: 0.36, text: c.marker.label, variant: "highlight", size: 11 });
    if (d.panel) chartPanel(s, d.panel, ML + w + 0.35, y, CW - w - 0.35, h);
    else if (d.card) K.card(s, { x: ML + w + 0.35, y, w: CW - w - 0.35, h, kicker: d.card.kicker, title: d.card.title, titleSize: 17, body: asLines(d.card.body) });
    return finish(s, d, y + h);
  },

  /* ---------------- architecture and status ---------------- */
  panels(p, d) {
    const s = page(p);
    let top = startY(d, header(s, d));
    if (d.legend) { let x = ML; d.legend.forEach(l => { const lw = K.textWidth(l.label, 11) + 0.1; K.rect(s, x, top + 0.06, 0.16, 0.16, l.live ? T.TEAL : T.WHITE, { line: { color: T.SLATE, width: 0.75 } }); K.txt(s, l.label, { x: x + 0.24, y: top - 0.02, w: lw, h: 0.3, fontSize: 11, italic: true, color: T.SLATE, valign: "middle" }); x += 0.24 + lw + 0.4; }); top += 0.42; }
    const list = d.panels || [], cols = list.length <= 2 ? list.length : (list.length === 3 ? 3 : 2), rows = Math.ceil(list.length / cols);
    const avail = K.CONTENT_BOTTOM - bandH(d) - top - (rows - 1) * 0.18, pw = (CW - (cols - 1) * 0.35) / cols, ph = avail / rows;
    list.forEach((pn, i) => P.panel(s, { x: ML + (i % cols) * (pw + 0.35), y: top + Math.floor(i / cols) * (ph + 0.18), w: pw, h: ph, label: pn.label, caption: pn.caption, highlight: !!pn.highlight,
      chips: (pn.chips || []).map(c => typeof c === "string" ? c : { text: c.text, variant: c.live ? "teal" : (c.variant || "outline") }) }));
    return finish(s, d, top + rows * ph + (rows - 1) * 0.18);
  },
  map(p, d) { const s = page(p); const y = startY(d, header(s, d));
    return finish(s, d, P.mapRows(s, { y, leftTitle: d.leftTitle || "TODAY", rightTitle: d.rightTitle || "PROPOSED", rows: d.rows || [], bottom: K.CONTENT_BOTTOM - bandH(d) })); },
  tiers(p, d) {
    const s = page(p); const y = startY(d, header(s, d));
    const cols = d.columns || [], gx = 0.35, w = (CW - (cols.length - 1) * gx) / Math.max(cols.length, 1);
    let bottom = y;
    cols.forEach((c, i) => { bottom = Math.max(bottom, P.stackColumn(s, { x: ML + i * (w + gx), y, w, kicker: c.kicker, variant: c.variant || (i === 1 ? "navy" : i === 2 ? "outline" : "light"),
      items: (c.items || []).map(it => ({ title: it.title, body: asLines(it.body), highlight: !!it.highlight, accent: !!it.accent })) })); });
    return finish(s, d, bottom);
  },
  status(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d)), rows = d.rows || [], gap = 0.14;
    const room = K.CONTENT_BOTTOM - bandH(d) - y0;
    const rh = Math.min(0.9, (room - (rows.length - 1) * gap) / Math.max(rows.length, 1));
    rows.forEach((r, i) => {
      const st = normStatus(r.status), y = y0 + i * (rh + gap);
      K.rect(s, ML, y, CW, rh, T.WHITE, { shadow: P.shadow() }); K.rect(s, ML, y, 0.12, rh, K.RAG[st].solid);
      if (r.icon) K.iconBadge(s, r.icon, ML + 0.36, y + rh / 2 - 0.26, 0.52, "mint");
      const nx = ML + (r.icon ? 1.05 : 0.4);
      K.txt(s, r.name, { x: nx, y, w: 4.3 - (nx - ML), h: rh, fontSize: 16, bold: true, color: T.INK, valign: "middle" });
      K.statusPill(s, { x: ML + 4.45, y: y + rh / 2 - 0.2, w: 1.9, h: 0.4, text: r.label || STATUS_LABEL[st], status: st });
      K.txt(s, asLines(r.detail), { x: ML + 6.6, y, w: CW - 6.85, h: rh, fontSize: 13, color: T.INK, valign: "middle", lineSpacingMultiple: 0.98 });
    });
    return finish(s, d, y0 + rows.length * (rh + gap) - gap);
  },

  ecosystem(p, d) {
    /* how things relate: one hub and the groups of systems, teams or concepts
     * around it. The native answer to "draw me a diagram with X in the middle". */
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const hasPlanned = (d.groups || []).some(g => (g.nodes || []).some(n => String(n.status || "").toLowerCase() === "planned"));
    const hasFlow = (d.groups || []).some(g => g.flow && g.flow !== "none");
    const keyH = (hasPlanned || hasFlow) ? 0.34 : 0;
    const bottom = K.CONTENT_BOTTOM - bandH(d) - keyH;
    P.ecosystemMap(s, { y: y0, bottom, hub: d.hub, groups: d.groups, hubW: tune(d, "hubW") });
    if (keyH) {
      const bits = [hasFlow ? "Arrows show which way information moves" : "", hasPlanned ? "Dashed: planned, not yet connected" : ""].filter(Boolean).join("   \u00b7   ");
      K.txt(s, bits, { x: ML, y: bottom + 0.06, w: CW, h: 0.26, fontSize: 10.5, italic: true, color: T.SLATE, align: "center", valign: "middle" });
    }
    return finish(s, d, bottom + keyH);
  },

  /* =================== v2: one-slide family ===================
   * Each carries all four beats on one slide: the headline is the answer,
   * the body is the proof, and the strip at the foot is the ask and the risk.
   * Built for a single-slide request; usable inside a longer deck as an
   * impact slide, at most one per section (ghost_check.py counts them). */
  one_decision(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, Object.assign({ eyebrow: "Decision" }, d)));
    const risk = d.risk ? Object.assign({ label: "The risk" }, d.risk) : null;
    const stripH = risk ? P.beatStripNeed(null, risk) : 0;
    const bottom = K.CONTENT_BOTTOM - (stripH ? stripH + 0.28 : 0);
    const leftW = CW * 0.56, rx = ML + leftW + 0.45, rw = CW - leftW - 0.45;
    K.sectionLabel(s, d.reasonsLabel || "Why", ML, y0, leftW);
    P.numberedRows(s, (d.reasons || []).map(r => ({ title: r.title, body: asLines(r.body) })), { x: ML, w: leftW, y: y0 + 0.42, titleSize: 16, bodySize: 13, gap: 0.22 });
    const a = d.ask || {}, H = bottom - y0;
    K.rect(s, rx, y0, rw, H, T.NAVY); K.rect(s, rx, y0, rw, EDGE, T.AMBER);
    K.txt(s, (a.label || "The ask").toUpperCase(), { x: rx + 0.35, y: y0 + 0.32, w: rw - 0.7, h: 0.28, fontSize: 12, bold: true, color: T.MINT, charSpacing: 2.2 });
    const metaRows = [a.who, a.when || a.by, a.cost].filter(Boolean).length;
    const ts = K.fitSize(a.text || "", rw - 0.7, H - 0.72 - 0.3 - metaRows * 0.48 - 0.15, 24, 14, true, "head");
    const th = K.headHeight(a.text || "", ts, rw - 0.7);
    K.htxt(s, a.text || "", { x: rx + 0.35, y: y0 + 0.72, w: rw - 0.7, h: th + 0.05, fontSize: ts, color: T.WHITE, valign: "top" });
    let ly = y0 + 0.72 + th + 0.3;
    [["Who", a.who], ["By when", a.when || a.by], ["Cost", a.cost]].filter(r => r[1]).forEach(([k, v]) => {
      K.hline(s, rx + 0.35, ly, rw - 0.7, T.ON_NAVY_MUTE, 0.5);
      K.txt(s, k.toUpperCase(), { x: rx + 0.35, y: ly + 0.08, w: 1.3, h: 0.34, fontSize: 11, bold: true, color: T.MINT, charSpacing: 1.4, valign: "middle" });
      K.txt(s, v, { x: rx + 1.75, y: ly + 0.08, w: rw - 2.1, h: 0.34, fontSize: 14, bold: true, color: T.WHITE, valign: "middle" });
      ly += 0.48;
    });
    if (risk) P.beatStrip(s, null, risk, K.CONTENT_BOTTOM - stripH, stripH);
    K.sourceLine(s, d.source);
    return { s };
  },
  one_number(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const f = d.figure || {};
    const ask = d.ask ? Object.assign({ label: "The ask" }, d.ask) : null, risk = d.risk ? Object.assign({ label: "The risk" }, d.risk) : null;
    const b = !(ask || risk) && d.so_what ? { runs: [{ text: d.so_what }], style: "bottom_line", label: d.soWhatLabel || "So what" } : null;
    const footH = (ask || risk) ? P.beatStripNeed(ask, risk) : b ? K.bandNeed(b.runs, "bottom_line") : 0;
    const bottom = K.CONTENT_BOTTOM - (footH ? footH + 0.28 : 0);
    const leftW = 5.0, H = bottom - y0;
    K.rect(s, ML, y0, leftW, H, T.WHITE, { shadow: P.shadow() }); K.rect(s, ML, y0, leftW, EDGE, T.TEAL);
    const val = String(f.value) + (f.unit || "");
    // the figure takes whatever the label, period and context leave free
    const below = 0.3 + (f.label ? K.textHeight(f.label, 17, leftW - 0.7, true) + 0.06 : 0) + (f.period ? K.textHeight(f.period, 13, leftW - 0.7) + 0.08 : 0) + (f.context ? 0.44 : 0) + 0.12;
    const vs = K.fitSize(val, leftW - 0.7, Math.min(2.1, H - 0.2 - below), 110, 36, true, "head");
    const vh = K.headHeight(val, vs, leftW - 0.7, 1.2);
    const vy = y0 + 0.16;
    K.htxt(s, val, { x: ML + 0.35, y: vy, w: leftW - 0.7, h: vh + 0.02, fontSize: vs, color: T.INK, valign: "top" });
    K.rect(s, ML + 0.38, vy + vh + 0.04, 1.3, 0.09, T.AMBER);
    let cy = vy + vh + 0.24;
    if (f.label) { const lh = K.textHeight(f.label, 17, leftW - 0.7, true); K.txt(s, f.label, { x: ML + 0.35, y: cy, w: leftW - 0.7, h: lh + 0.04, fontSize: 17, bold: true, color: T.INK, valign: "top" }); cy += lh + 0.06; }
    if (f.period) { const ph = K.textHeight(f.period, 13, leftW - 0.7); K.txt(s, f.period, { x: ML + 0.35, y: cy, w: leftW - 0.7, h: ph + 0.04, fontSize: 13, color: T.SLATE, valign: "top" }); cy += ph + 0.1; }
    if (f.context) K.pill(s, { x: ML + 0.35, y: cy + 0.02, w: Math.min(leftW - 0.7, K.textWidth(f.context, 12, true) + 0.5), h: 0.38, text: f.context, variant: "light", size: 12 });
    const rx = ML + leftW + 0.5, rw = CW - leftW - 0.5;
    K.sectionLabel(s, d.driversLabel || "What drives it", rx, y0, rw);
    const drivers = d.drivers || [], dn = Math.max(drivers.length, 1);
    const slot = (H - 0.45) / dn;
    drivers.forEach((dv, i) => {
      const dy = y0 + 0.45 + i * slot, ix = dv.icon ? 0.82 : 0;
      if (dv.icon) K.iconBadge(s, dv.icon, rx, dy + 0.04, 0.6, "mint");
      const th = K.textHeight(dv.title, 16, rw - ix, true);
      K.txt(s, dv.title, { x: rx + ix, y: dy, w: rw - ix, h: th + 0.02, fontSize: 16, bold: true, color: T.INK, valign: "top" });
      if (dv.body) K.txt(s, asLines(dv.body), { x: rx + ix, y: dy + th + 0.06, w: rw - ix, h: slot - th - 0.2, fontSize: 13, color: T.SLATE, valign: "top" });
      if (i < drivers.length - 1) K.hline(s, rx, dy + slot - 0.1, rw, T.RULE, 0.75);
    });
    if (ask || risk) P.beatStrip(s, ask, risk, K.CONTENT_BOTTOM - footH, footH);
    else if (b) K.band(s, b.runs, K.CONTENT_BOTTOM - footH, footH, "bottom_line", b.label);
    K.sourceLine(s, d.source);
    return { s };
  },
  one_status(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, Object.assign({ eyebrow: "Status" }, d)));
    const o = d.overall || {}, ok = K.ragKey(o.status), m = K.RAG[ok];
    const issue = d.issue || null;
    const ask = issue && issue.ask ? { label: "The ask", text: issue.ask, who: issue.askOf, when: issue.by } : null;
    const risk = issue ? { label: issue.label || "The one red", text: issue.text, owner: issue.owner } : null;
    const stripH = issue ? P.beatStripNeed(ask, risk) : 0;
    const bottom = K.CONTENT_BOTTOM - (stripH ? stripH + 0.26 : 0);
    const tileW = 3.0, tileH = 1.0;
    K.rect(s, ML, y0, tileW, tileH, m.solid);
    K.txt(s, "OVERALL", { x: ML + 0.3, y: y0 + 0.16, w: tileW - 0.6, h: 0.26, fontSize: 11, bold: true, color: T.WHITE, charSpacing: 2 });
    K.htxt(s, o.label || m.label, { x: ML + 0.3, y: y0 + 0.44, w: tileW - 0.6, h: 0.5, fontSize: K.fitSize(o.label || m.label, tileW - 0.6, 0.5, 24, 16, true, "head"), color: T.WHITE, valign: "middle" });
    if (o.summary) K.txt(s, o.summary, { x: ML + tileW + 0.4, y: y0, w: CW - tileW - 0.4, h: tileH, fontSize: K.fitSize(o.summary, CW - tileW - 0.4, tileH, 17, 12.5), color: T.INK, valign: "middle" });
    const rows = d.rows || [], ry = y0 + tileH + 0.2, gap = 0.07;
    const rh = Math.min(0.62, (bottom - ry - (rows.length - 1) * gap) / Math.max(rows.length, 1));
    rows.forEach((r, i) => {
      const st = K.ragKey(r.status), y = ry + i * (rh + gap);
      K.rect(s, ML, y, CW, rh, T.WHITE, { line: { color: T.RULE, width: 0.5 } }); K.rect(s, ML, y, 0.1, rh, K.RAG[st].solid);
      K.txt(s, r.name, { x: ML + 0.3, y, w: 3.6, h: rh, fontSize: 14, bold: true, color: T.INK, valign: "middle" });
      K.statusPill(s, { x: ML + 4.0, y: y + rh / 2 - 0.18, w: 1.75, h: 0.36, text: r.label || STATUS_LABEL[st], status: st, size: 11 });
      K.txt(s, asLines(r.detail), { x: ML + 6.0, y, w: CW - 6.2, h: rh, fontSize: 12.5, color: T.INK, valign: "middle" });
    });
    if (issue) P.beatStrip(s, ask, risk, K.CONTENT_BOTTOM - stripH, stripH);
    K.sourceLine(s, d.source);
    return { s };
  },
  one_shift(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const ask = d.ask ? Object.assign({ label: "The ask" }, d.ask) : null, risk = d.risk ? Object.assign({ label: "The risk" }, d.risk) : null;
    const stripH = (ask || risk) ? P.beatStripNeed(ask, risk) : 0;
    const bottom = K.CONTENT_BOTTOM - (stripH ? stripH + 0.26 : 0) - (!stripH ? bandH(d) : 0);
    const rows = d.rows || [], hasDelta = rows.some(r => r.delta);
    const deltaW = hasDelta ? 1.7 : 0, colW = (CW - 0.6 - deltaW - (hasDelta ? 0.2 : 0)) / 2, xL = ML, xR = ML + colW + 0.6;
    K.pill(s, { x: xL, y: y0, w: colW, h: 0.42, text: d.beforeLabel || "Before", variant: "light", size: 12.5 });
    K.pill(s, { x: xR, y: y0, w: colW, h: 0.42, text: d.afterLabel || "After", variant: "navy", size: 12.5 });
    if (hasDelta) K.txt(s, (d.deltaLabel || "Change").toUpperCase(), { x: PW - ML - deltaW, y: y0, w: deltaW, h: 0.42, fontSize: 11, bold: true, color: T.AMBER_TXT, align: "center", valign: "middle", charSpacing: 1.4 });
    let y = y0 + 0.58;
    const need = rows.map(r => Math.max(0.66, K.textHeight(r.before, 14, colW - 0.5), K.textHeight(r.after, 14, colW - 0.5, true)) + 0.26);
    const scale = Math.min(1, (bottom - y - (rows.length - 1) * 0.12) / need.reduce((a, b) => a + b, 0));
    rows.forEach((r, i) => {
      const h = need[i] * scale;
      K.rect(s, xL, y, colW, h, T.WHITE, { shadow: P.shadow() });
      K.txt(s, r.before, { x: xL + 0.25, y, w: colW - 0.5, h, fontSize: 14, color: T.SLATE, valign: "middle" });
      K.rect(s, xR, y, colW, h, T.TEAL_TINT); K.rect(s, xR, y, EDGE, h, T.TEAL);
      K.txt(s, r.after, { x: xR + 0.28, y, w: colW - 0.5, h, fontSize: 14, bold: true, color: T.INK, valign: "middle" });
      K.arrow(s, xL + colW + 0.1, y + h / 2, 0.4);
      if (r.delta) K.htxt(s, r.delta, { x: PW - ML - deltaW, y, w: deltaW, h, fontSize: 20, color: T.AMBER_TXT, align: "center", valign: "middle" });
      y += h + 0.12;
    });
    if (stripH) { P.beatStrip(s, ask, risk, K.CONTENT_BOTTOM - stripH, stripH); K.sourceLine(s, d.source); return { s }; }
    return finish(s, d, y - 0.12);
  },
  one_story(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const ask = d.ask ? Object.assign({ label: "The ask" }, d.ask) : null, risk = d.risk ? Object.assign({ label: "The risk" }, d.risk) : null;
    const stripH = (ask || risk) ? P.beatStripNeed(ask, risk) : 0;
    const bottom = K.CONTENT_BOTTOM - (stripH ? stripH + 0.26 : 0);
    const parts = [["situation", "Situation", "compass", false], ["complication", "Complication", "mountain", false], ["resolution", "Resolution", "lightbulb", true]]
      .filter(([k]) => d[k]).map(([k, label, ic, hl]) => { const v = d[k]; const o = typeof v === "string" ? { text: v } : v; return Object.assign({ label, icon: ic, hl }, o); });
    const labelW = 2.7, tw = CW - labelW - 0.5, gap = 0.14;
    const need = parts.map(pt => Math.max(0.9, K.textHeight(pt.text, 15, tw, pt.hl) + 0.4));
    const scale = Math.min(1, (bottom - y0 - (parts.length - 1) * gap) / need.reduce((a, b) => a + b, 0));
    let y = y0;
    parts.forEach((pt, i) => {
      const h = need[i] * scale;
      K.rect(s, ML, y, CW, h, pt.hl ? T.NAVY : T.WHITE, pt.hl ? {} : { shadow: P.shadow() });
      K.rect(s, ML, y, EDGE, h, pt.hl ? T.AMBER : (i === 1 ? T.SLATE : T.TEAL));
      K.iconBadge(s, pt.icon, ML + 0.3, y + h / 2 - 0.27, 0.54, pt.hl ? "teal" : "mint");
      K.txt(s, pt.label.toUpperCase(), { x: ML + 1.0, y, w: labelW - 1.0, h, fontSize: 12, bold: true, color: pt.hl ? T.MINT : T.TEAL_TXT, charSpacing: 1.6, valign: "middle" });
      K.txt(s, pt.text, { x: ML + labelW, y, w: tw, h, fontSize: 15, bold: pt.hl, color: pt.hl ? T.WHITE : T.INK, valign: "middle" });
      y += h + gap;
    });
    if (stripH) P.beatStrip(s, ask, risk, K.CONTENT_BOTTOM - stripH, stripH);
    K.sourceLine(s, d.source);
    return { s };
  },

  /* =================== v2: further additions =================== */
  kpi_strip(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const kpis = (d.kpis || []).slice(0, 5), n = Math.max(kpis.length, 1), gap = 0.28;
    const w = (CW - (n - 1) * gap) / n, h = tune(d, "tileH", Math.min(2.6, K.CONTENT_BOTTOM - y0 - bandH(d) - (d.cards ? 1.8 : 0)));
    kpis.forEach((k, i) => P.kpiTile(s, k, ML + i * (w + gap), y0, w, h, d.highlight === i || k.highlight));
    let bottom = y0 + h;
    if (d.cards) bottom = P.cardRow(s, d.cards.map(c => ({ kicker: c.kicker, title: c.title, body: asLines(c.body) })), { y: bottom + 0.3, titleSize: 15, bodySize: 12.5, minH: 1.1, maxH: 1.6, reserve: bandH(d) });
    return finish(s, d, bottom);
  },
  stage_tracker(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const bottom = P.stageGrid(s, { y: y0, stages: d.stages || [], rows: d.rows || [], labelW: tune(d, "labelW"), noteHeader: d.noteHeader, maxH: K.CONTENT_BOTTOM - y0 - bandH(d) - 0.45 });
    return finish(s, d, bottom);
  },
  contrast(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const L = d.left || {}, R = d.right || {}, gap = 0.45, w = (CW - gap) / 2, xR = ML + w + gap;
    const litems = L.items || [], ritems = (R.items || []).map(it => typeof it === "string" ? { title: it } : it);
    const lneed = 0.36 + K.headHeight(L.title || "", 22, w - 0.8) + 0.3 + litems.reduce((a, t) => a + K.textHeight(t, 14, w - 1.1) + 0.12, 0) + (L.note ? 0.62 : 0.2);
    const rItemH = it => K.textHeight(it.title, 14, w - 1.2, true) + (it.body ? K.textHeight(it.body, 12.5, w - 1.2) + 0.04 : 0) + 0.34;
    const rneed = 0.36 + Math.max(0.5, K.headHeight(R.title || "", 22, w - 1.5)) + 0.3 + ritems.reduce((a, it) => a + rItemH(it) + 0.16, 0) + (R.note ? 0.62 : 0.2);
    const H = Math.min(Math.max(lneed, rneed, 2.8), K.CONTENT_BOTTOM - y0 - bandH(d));
    K.rect(s, ML, y0, w, H, T.WHITE, { shadow: P.shadow() }); K.rect(s, ML, y0, w, EDGE, T.NAVY);
    let ly = y0 + 0.36;
    if (L.kicker) { K.txt(s, L.kicker.toUpperCase(), { x: ML + 0.4, y: ly - 0.06, w: w - 0.8, h: 0.26, fontSize: 11, bold: true, color: T.TEAL_TXT, charSpacing: 1.6 }); ly += 0.3; }
    const lth = K.headHeight(L.title || "", 22, w - 0.8);
    K.htxt(s, L.title || "", { x: ML + 0.4, y: ly, w: w - 0.8, h: lth + 0.04, fontSize: 22, color: T.INK, valign: "top" }); ly += lth + 0.3;
    if (litems.length) K.txt(s, litems.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < litems.length - 1 } })), { x: ML + 0.5, y: ly, w: w - 0.9, h: y0 + H - ly - (L.note ? 0.6 : 0.15), fontSize: 14, color: T.INK, paraSpaceAfter: 7, valign: "top" });
    if (L.note) K.txt(s, L.note, { x: ML + 0.4, y: y0 + H - 0.55, w: w - 0.8, h: 0.4, fontSize: 12.5, italic: true, color: T.SLATE, valign: "middle" });
    K.rect(s, xR, y0, w, H, T.NAVY);
    let ry = y0 + 0.36;
    if (R.icon) K.iconBadge(s, R.icon, xR + 0.4, ry - 0.02, 0.5, "teal");
    const rtx = xR + (R.icon ? 1.05 : 0.4), rth = K.headHeight(R.title || "", 22, w - 1.5);
    K.htxt(s, R.title || "", { x: rtx, y: ry, w: xR + w - 0.4 - rtx, h: Math.max(rth, 0.46), fontSize: 22, color: T.WHITE, valign: "middle" }); ry += Math.max(rth, 0.46) + 0.3;
    ritems.forEach(it => {
      const ih = rItemH(it);
      K.rect(s, xR + 0.4, ry, w - 0.8, ih, T.NAVY_DEEP); K.rect(s, xR + 0.4, ry, 0.07, ih, T.AMBER);
      const tth = K.textHeight(it.title, 14, w - 1.2, true);
      K.txt(s, it.title, { x: xR + 0.68, y: ry + 0.14, w: w - 1.2, h: tth + 0.02, fontSize: 14, bold: true, color: T.MINT, valign: "top" });
      if (it.body) K.txt(s, it.body, { x: xR + 0.68, y: ry + 0.18 + tth, w: w - 1.2, h: ih - tth - 0.26, fontSize: 12.5, color: T.ON_NAVY, valign: "top" });
      ry += ih + 0.16;
    });
    if (R.note) K.txt(s, R.note, { x: xR + 0.4, y: y0 + H - 0.55, w: w - 0.8, h: 0.4, fontSize: 12.5, italic: true, color: T.ON_NAVY_MUTE, valign: "middle" });
    return finish(s, d, y0 + H);
  },
  decision_rights(p, d) {
    const s = page(p);
    const y0 = startY(d, header(s, d));
    const bottom = P.rightsGrid(s, { y: y0, roles: d.roles || [], rows: d.rows || [], labelW: tune(d, "labelW"), decisionHeader: d.decisionHeader, gateHeader: d.gateHeader, maxH: K.CONTENT_BOTTOM - y0 - bandH(d) - 0.45 });
    const used = [...new Set((d.rows || []).flatMap(r => (r.cells || []).map(c => String(c || "").toUpperCase().trim()[0]).filter(Boolean)))];
    let lx = ML;
    ["P", "A", "E", "C", "I"].filter(c => used.includes(c)).forEach(c => {
      const m = P.RIGHTS[c], lw = K.textWidth(m.label, 11, true) + 0.3;
      K.txt(s, [{ text: c + "  ", options: { bold: true, color: T.INK } }, { text: m.label, options: { color: T.SLATE } }], { x: lx, y: bottom + 0.12, w: lw + 0.4, h: 0.3, fontSize: 11, valign: "middle" });
      lx += lw + 0.55;
    });
    return finish(s, d, bottom + 0.42);
  },
};

/* navy commentary panel beside a chart: short headed points, mint heads */
function chartPanel(s, pn, x, y, w, h) {
  K.rect(s, x, y, w, h, T.NAVY);
  const pts = pn.points || [];
  const need = pts.map(pt => K.textHeight(pt.title, 15, w - 0.7, true) + (pt.body ? K.textHeight(asLines(pt.body), 12.5, w - 0.7) : 0) + 0.12);
  const gap = Math.max(0.18, (h - 0.6 - need.reduce((a, b) => a + b, 0)) / Math.max(pts.length, 1));
  let cy = y + 0.36;
  pts.forEach((pt, i) => {
    const th = K.textHeight(pt.title, 15, w - 0.7, true);
    K.txt(s, pt.title, { x: x + 0.35, y: cy, w: w - 0.7, h: th + 0.02, fontSize: 15, bold: true, color: T.MINT, valign: "top" });
    if (pt.body) K.txt(s, asLines(pt.body), { x: x + 0.35, y: cy + th + 0.06, w: w - 0.7, h: need[i] - th, fontSize: 12.5, color: T.ON_NAVY, valign: "top" });
    cy += need[i] + Math.min(gap, 0.4);
  });
}

/* ---------------------------------- render ---------------------------------- */
async function renderDeck(brief, outFile, opts = {}) {
  const meta = brief.meta || {};
  K.configure({ customer: meta.customer || "", program: meta.program || "", docType: meta.docType || "", footer: meta.footer || "",
    status: meta.status == null ? "Draft \u2014 for discussion" : meta.status, version: meta.version || "", classification: meta.classification || "",
    credit: meta.credit !== false, creditText: meta.creditText || "Built with the consulting-deck skill \u00b7 First Chair Consulting", locale: meta.locale || "en-US" });
  LOGO = null;
  BRIEF_DIR = opts.briefDir || null;
  if (meta.logo && !fs.existsSync(meta.logo) && BRIEF_DIR && fs.existsSync(path.join(BRIEF_DIR, meta.logo))) meta.logo = path.join(BRIEF_DIR, meta.logo);
  if (meta.logo && fs.existsSync(meta.logo)) {
    try { const sz = require("child_process").execFileSync("python3", ["-c", `from PIL import Image;im=Image.open('${meta.logo}');print(im.size[0]/im.size[1])`]).toString().trim(); LOGO = { path: meta.logo, ratio: parseFloat(sz) || 1 }; } catch { LOGO = { path: meta.logo, ratio: 2.5 }; }
  }
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE";
  p.author = meta.author || "";
  p.title = meta.title || meta.program || "Deck";
  p.company = meta.credit !== false ? "First Chair Consulting" : (meta.customer || "");
  /* Provenance stamp. validate_deck.py refuses a deck without it, so a deck
   * built by hand-rolled code cannot pass as a deliverable; audit_facts.py
   * checks the ledger hash against the one the deck was rendered with. */
  const stamp = ["firstchair-consulting-deck render", "style=v2", `brief=${opts.briefSha || "unknown"}`, `ledger=${opts.ledgerSha || "none"}`, `storyboard=${opts.storyboardSha || "none"}`].join(" ");
  p.subject = stamp;

  const slides = brief.slides || [];
  SECTIONS = slides.filter(d => d.pattern === "section").map(d => ({ title: d.headline, label: d.label || String(d.headline || "").split(/\s+/).slice(0, 4).join(" ") }));
  let pageNo = 0, secI = 0;
  slides.forEach((d, i) => {
    /* `audience` tags a slide for one part of a mixed room; it rides on the
     * eyebrow so the treatment is identical on every slide. `illustrative`
     * marks a slide whose data is representative, not measured: it goes in
     * the subtitle in words, not a 9pt footnote, so a reader cannot miss it. */
    d = Object.assign({}, d);
    if (d.pattern === "section") d._sectionIndex = secI++;
    if (d.audience) d.eyebrow = [d.eyebrow, `for ${d.audience}`].filter(Boolean).join(" \u00b7 ");
    if (d.illustrative) d.subtitle = ["Illustrative \u2014 representative values, not measured data.", d.subtitle].filter(Boolean).join(" ");
    const fn = PATTERNS[d.pattern];
    if (!fn) throw new Error(`slide ${i + 1}: unknown pattern "${d.pattern}" (see references/patterns.md)`);
    const out = fn(p, d) || {};
    pageNo += 1;
    if (!out.noFooter) K.footer(out.s, pageNo, !!out.onDark, { credit: i === slides.length - 1, x: out.footerX });
    if (d.notes) out.s.addNotes(String(d.notes));
  });
  const f = await p.writeFile({ fileName: outFile });
  if (slides.some(d => d.pattern === "waterfall")) {
    const fixer = [path.join(__dirname, "postfix_pptx.py"), path.join(__dirname, "..", "scripts", "postfix_pptx.py")].find(f => fs.existsSync(f));
    if (fixer) require("child_process").execFileSync("python3", [fixer, outFile], { stdio: "inherit" });
    else console.error("WARNING: scripts/postfix_pptx.py not found; the waterfall base series will show labels.");
  }
  if (!opts.quiet) console.log(`WROTE ${f}  (${slides.length} slides)`);
  return f;
}

module.exports = { renderDeck, PATTERNS, PATTERN_NAMES: Object.keys(PATTERNS) };
