#!/usr/bin/env python3
"""
preflight.py — check a skill package will publish and import cleanly.

    python3 scripts/preflight.py            # checks this skill
    python3 scripts/preflight.py ../other   # checks any skill directory

Encodes the failures that actually blocked an import, in the order they bit:

  1. Frontmatter parses under a STRICT YAML parser. The classic killer is an
     unquoted colon-space inside `description`, which turns the scalar into a
     nested mapping and makes the parser miss `name` entirely.
  2. `name` and `description` are quoted, single-line, non-empty strings.
  3. `name` is lowercase-hyphenated and matches the directory name.
  4. SKILL.md sits at the package root.
  5. Every file the docs list actually exists.
  6. .gitignore excludes build junk and re-includes intended example binaries.
  7. No build artifacts left in the tree.

Exit 1 on any failure. Run it before zipping or pushing.
"""

import argparse
import re
import sys
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).parent))
from _common import need  # noqa: E402

UNQUOTED_RISK = re.compile(r":\s|^[-?#&*!|>@`%\[\]{},'\"]")
ARTIFACTS = ("node_modules", "__pycache__", ".DS_Store", ".ipynb_checkpoints")

fails, warns = [], []


def fail(m):
    fails.append(m)


def warn(m):
    warns.append(m)


def check(root):
    yaml = need("yaml")

    skill_md = root / "SKILL.md"
    if not skill_md.exists():
        fail(f"SKILL.md not found at package root ({root}). Importers look at the top level; "
             "zip the folder's CONTENTS, not the folder.")
        return
    src = skill_md.read_text(encoding="utf-8")

    m = re.match(r"^---\n(.*?)\n---\n", src, re.S)
    if not m:
        fail("SKILL.md has no YAML frontmatter block delimited by --- at the very start")
        return
    raw = m.group(1)

    # 1. strict parse
    try:
        fm = yaml.safe_load(raw)
    except Exception as exc:  # noqa: BLE001
        fail(f"frontmatter does not parse as YAML: {type(exc).__name__}: {str(exc)[:160]}\n"
             "        Almost always an unquoted ': ' inside a value. Double-quote it.")
        return
    if not isinstance(fm, dict):
        fail("frontmatter is not a mapping")
        return

    # 2. fields
    for key in ("name", "description"):
        val = fm.get(key)
        if not isinstance(val, str) or not val.strip():
            fail(f"frontmatter `{key}` must be a non-empty string (got {type(val).__name__})")

    # 3. quoting and single-line, checked on the raw text
    for line in raw.splitlines():
        for key in ("name", "description"):
            if line.startswith(f"{key}:"):
                value = line[len(key) + 1:].strip()
                if not (value.startswith('"') and value.endswith('"') and len(value) > 1):
                    fail(f"frontmatter `{key}` value is not double-quoted — quote it even if it looks safe")
                elif UNQUOTED_RISK.search(value[1:-1]) and '\\"' not in value:
                    pass  # quoted, so risky characters are fine
        if line.strip() in {">", "|", ">-", "|-"} or line.rstrip().endswith((": >", ": |")):
            fail("frontmatter uses a folded/literal block scalar — importers parse these "
                 "inconsistently; keep values on one line")

    name = fm.get("name", "")
    if isinstance(name, str) and name:
        if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name):
            fail(f"name \"{name}\" should be lowercase-hyphenated")
        if name != root.name:
            warn(f'name "{name}" != directory name "{root.name}" — publish the repo under the skill name')

    desc = fm.get("description", "")
    if isinstance(desc, str):
        if len(desc) < 80:
            warn("description is short — it is what the platform matches on; name the triggers")
        if len(desc) > 1400:
            warn(f"description is {len(desc)} chars — some importers truncate; tighten it")

    # 5. manifest vs disk
    on_disk = {str(p.relative_to(root)) for p in root.rglob("*")
               if p.is_file() and not any(a in p.parts for a in ARTIFACTS)}
    for doc in ("SKILL.md", "README.md"):
        f = root / doc
        if not f.exists():
            continue
        for ref in set(re.findall(r"`([A-Za-z0-9_]+/[A-Za-z0-9_./-]+)`", f.read_text(encoding="utf-8"))):
            if ref.endswith("/"):
                continue
            if ref in on_disk:
                continue
            stem = ref.rsplit(".", 1)[0]
            if any(d.startswith(stem) for d in on_disk):
                continue          # e.g. "examples/X.pptx / .pdf" shorthand
            if (root / ref).is_dir():
                continue
            fail(f"{doc} references `{ref}` which is not in the package")
        # bare file names in backticks (no directory) must exist somewhere in the package
        names_on_disk = {Path(d).name for d in on_disk}
        for ref in set(re.findall(r"`([A-Za-z0-9_.-]+\.(?:md|js|py|json|pptx|pdf|yaml|yml|txt))`", f.read_text(encoding="utf-8"))):
            if ref not in names_on_disk and not ref.startswith("<"):
                # working files the agent creates at run time are allowed
                if ref in {"frame.json", "ledger.json", "ledger.md", "sources.json", "storyboard.json", "storyboard.md",
                           "brief.json", "audit.md", "Deck.pptx", "Deck.pdf", "Catalogue.pptx", "Example.pptx", "Deck.pptx.stamp.json"}:
                    continue
                fail(f"{doc} names `{ref}`, which is not in the package under any directory")

    # 6. gitignore
    gi = root / ".gitignore"
    if not gi.exists():
        warn("no .gitignore — build junk will be committed")
    else:
        text = gi.read_text(encoding="utf-8")
        if "node_modules" not in text:
            warn(".gitignore does not exclude node_modules/")
        ignored_ext = re.findall(r"^\*(\.\w+)$", text, re.M)
        for ext in ignored_ext:
            shipped = [d for d in on_disk if d.startswith("examples/") and d.endswith(ext)]
            for s in shipped:
                if f"!{s}" not in text:
                    fail(f".gitignore ignores *{ext} but ships `{s}` without a `!{s}` negation — "
                         "the example asset will vanish on push")
        # every shipped file must survive the .gitignore. An unanchored name
        # ("audit.md") silently drops a same-named reference file in a
        # subfolder; anchor root-only junk with a leading slash ("/audit.md").
        import shutil as _sh
        import subprocess
        import tempfile
        if _sh.which("git"):
            with tempfile.TemporaryDirectory() as td:
                subprocess.run(["git", "init", "-q", td], check=False)
                (Path(td) / ".gitignore").write_text(text, encoding="utf-8")
                shipped = sorted(on_disk)
                r = subprocess.run(["git", "-C", td, "check-ignore", "--no-index", "--stdin"], input="\n".join(shipped),
                                   capture_output=True, text=True)
                for lost in [x for x in r.stdout.splitlines() if x.strip()]:
                    fail(f".gitignore would drop shipped file `{lost}` on push; anchor or negate the pattern")
        else:
            warn("git not found; could not check that .gitignore keeps every shipped file")

    # 7. artifacts — __pycache__ is self-inflicted and safe to remove; the rest is a failure
    import shutil
    for p in list(root.rglob("__pycache__")):
        shutil.rmtree(p, ignore_errors=True)
        warn(f"removed {p.relative_to(root)} (bytecode cache, not for publishing)")
    for p in root.rglob("*"):
        if any(a in p.parts for a in ARTIFACTS if a != "__pycache__"):
            fail(f"build artifact in package: {p.relative_to(root)}")
            break


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("root", nargs="?", default=str(Path(__file__).resolve().parent.parent))
    args = ap.parse_args()
    root = Path(args.root).resolve()

    print(f"\npreflight: {root}\n")
    check(root)
    for w in warns:
        print("  WARN " + w)
    for f in fails:
        print("  FAIL " + f)
    if fails:
        print("\nNOT READY TO PUBLISH — fix the above.\n")
        return 1
    print("\nPASS — frontmatter parses, manifest matches, package is clean.")
    print("Zip the CONTENTS of this directory, not the directory itself.\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
