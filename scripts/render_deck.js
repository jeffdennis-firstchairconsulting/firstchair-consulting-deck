#!/usr/bin/env node
/* render_deck.js — gate, then build.
 *     node scripts/render_deck.js brief.json Out.pptx [--force]
 * Refuses an incomplete brief unless --force, which is allowed only after the
 * user has seen the gaps and said to proceed. Runs the brief gate, renders,
 * then tells you the two QA steps that follow. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const args = process.argv.slice(2).filter(a => !a.startsWith("--"));
const force = process.argv.includes("--force");
if (!args.length) { console.error("usage: node scripts/render_deck.js brief.json [Out.pptx] [--force]"); process.exit(1); }
const briefFile = args[0], outFile = args[1] || "Deck.pptx";
const crypto = require("crypto");
const sha = f => (f && fs.existsSync(f)) ? crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16) : null;
/* Provenance: the ledger and storyboard the deck was built from. Named in the
 * brief (meta.ledger / meta.storyboard, written by to_deck_brief.py) or by
 * --ledger / --storyboard. The hashes go into the file's subject field; the
 * audit refuses a ledger whose hash does not match. */
const optArg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const briefObj = JSON.parse(fs.readFileSync(briefFile, "utf8"));
const rel = f => (f && !path.isAbsolute(f)) ? path.resolve(path.dirname(briefFile), f) : f;
const ledgerFile = optArg("--ledger") || rel((briefObj.meta || {}).ledger) || null;
const storyboardFile = optArg("--storyboard") || rel((briefObj.meta || {}).storyboard) || null;
const overwrite = process.argv.includes("--overwrite");

/* The hand-edited-file rule. A stamp records when this script last wrote the
 * deck. If the deck on disk is newer than the stamp, someone edited it in
 * PowerPoint since, and a re-render would wipe their work. Refuse, and offer
 * the two routes. --overwrite is allowed only after the user has chosen. */
const stampFile = outFile + ".stamp.json";
if (fs.existsSync(outFile) && fs.existsSync(stampFile) && !overwrite) {
  const stamp = JSON.parse(fs.readFileSync(stampFile, "utf8"));
  const fileTime = fs.statSync(outFile).mtimeMs;
  if (fileTime > stamp.renderedAt + 2000) {
    console.error(`\n${outFile} was modified after the last render (${new Date(fileTime).toISOString()} vs ${new Date(stamp.renderedAt).toISOString()}).`);
    console.error("Someone edited it by hand. Re-rendering would overwrite those edits. Put the choice to the user:");
    console.error("  1. Keep the hand edits: from now on edit the .pptx in place (the brief stops being master).");
    console.error("  2. Re-render from the brief and lose the hand edits: re-run with --overwrite, or write to a new file name.\n");
    process.exit(2);
  }
}
/* Runtime first: the brief gate loads the renderer, so a missing pptxgenjs
 * must be reported as what it is, not as an incomplete brief. */
try { require("pptxgenjs"); } catch { console.error("pptxgenjs is not installed and Node is required for this skill. Run: npm install pptxgenjs. Do not substitute another toolchain."); process.exit(1); }
try { execFileSync("node", [path.join(__dirname, "check_brief.js"), briefFile], { stdio: "inherit" }); }
catch (e) { if (e.status === 3) process.exit(3); if (!force) { console.error("\nRefusing to build on an incomplete brief. Ask the questions above, or re-run with --force once the user has accepted the gaps.\n"); process.exit(1); }
  console.error("\n--force: building on an incomplete brief. Mark every gap as an assumption.\n"); }
const asset = f => { const l = path.join(__dirname, f); return fs.existsSync(l) ? l : path.join(__dirname, "..", "assets", f); };
const { renderDeck } = require(asset("deck_renderer.js"));
const briefSha = sha(briefFile), ledgerSha = sha(ledgerFile), storyboardSha = sha(storyboardFile);
if (ledgerFile && !ledgerSha) { console.error(`ledger not found: ${ledgerFile}. The audit needs the ledger the deck was built from.`); process.exit(1); }
renderDeck(briefObj, outFile, { briefSha, ledgerSha, storyboardSha, briefDir: path.dirname(path.resolve(briefFile)) })
  .then(() => {
    fs.writeFileSync(stampFile, JSON.stringify({ renderedAt: Date.now(), brief: path.resolve(briefFile), briefSha,
      ledger: ledgerFile ? path.resolve(ledgerFile) : null, ledgerSha, storyboard: storyboardFile ? path.resolve(storyboardFile) : null, storyboardSha }, null, 2));
    console.log(`Next: python3 scripts/validate_deck.py ${outFile} && python3 scripts/layout_check.py ${outFile} --brief ${briefFile}`); console.log("Then render to images and LOOK at every slide before handing over."); })
  .catch(e => { console.error("BUILD FAILED:", e.message); process.exit(1); });
