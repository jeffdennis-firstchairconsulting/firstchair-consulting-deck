#!/usr/bin/env python3
"""
postfix_pptx.py — the one sanctioned post-write edit.

    python3 scripts/postfix_pptx.py Deck.pptx

pptxgenjs cannot switch data labels off for a single series. The waterfall
pattern draws its floating bars on top of an invisible series named "base",
so this script removes the <c:dLbls> block from any series whose name is
exactly "base" in every chart part, then writes the archive back with the
same member order and compression. Nothing else is touched. render_deck.js
runs it automatically when a brief contains a waterfall.
"""
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

SER_RE = re.compile(r"<c:ser>.*?</c:ser>", re.S)
NAME_RE = re.compile(r"<c:tx>.*?<c:v>(.*?)</c:v>.*?</c:tx>", re.S)
DLBLS_RE = re.compile(r"<c:dLbls>.*?</c:dLbls>", re.S)


def fix_chart(xml: str) -> tuple[str, int]:
    n = 0

    def repl(m):
        nonlocal n
        ser = m.group(0)
        name = NAME_RE.search(ser)
        if name and name.group(1).strip() == "base" and DLBLS_RE.search(ser):
            n += 1
            return DLBLS_RE.sub("<c:dLbls><c:delete val=\"1\"/></c:dLbls>", ser, count=1)
        return ser

    return SER_RE.sub(repl, xml), n


def main(path: str) -> int:
    src = Path(path)
    if not src.exists():
        print(f"postfix: no such file {src}")
        return 1
    tmp = Path(tempfile.mkstemp(suffix=".pptx")[1])
    fixed = 0
    with zipfile.ZipFile(src) as zin, zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename.startswith("ppt/charts/chart") and item.filename.endswith(".xml"):
                text, n = fix_chart(data.decode("utf-8"))
                if n:
                    fixed += n
                    data = text.encode("utf-8")
            zout.writestr(item, data)
    shutil.move(str(tmp), str(src))
    print(f"postfix: removed base-series labels in {fixed} chart series")
    return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1]))
