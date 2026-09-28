"""Shared helpers: dependency bootstrap, JSON IO, reporting.

Every script in this skill imports from here. Keep it dependency-free itself.
"""

import importlib
import json
import subprocess
import sys
from pathlib import Path

PIP_NAMES = {
    "docx": "python-docx",
    "openpyxl": "openpyxl",
    "pdfplumber": "pdfplumber",
    "yaml": "PyYAML",
    "pptx": "python-pptx",
}


def need(module, optional=False):
    """Import a module, installing it once if absent.

    Returns the module, or None when optional and unavailable. Fails loudly
    otherwise — never silently degrade to a different toolchain.
    """
    try:
        return importlib.import_module(module)
    except ImportError:
        pass
    pkg = PIP_NAMES.get(module, module)
    print(f"[deps] installing {pkg} ...", file=sys.stderr)
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--quiet", "--break-system-packages", pkg],
            check=True, capture_output=True, timeout=300,
        )
        return importlib.import_module(module)
    except Exception as exc:  # noqa: BLE001
        msg = (f"[deps] cannot install {pkg}: {exc}\n"
               f"       Install it manually, or tell the user this runtime is unavailable.\n"
               f"       Do NOT substitute a different toolchain.")
        if optional:
            print(msg, file=sys.stderr)
            return None
        sys.exit(msg)


def load_json(path):
    p = Path(path)
    if not p.exists():
        sys.exit(f"no such file: {p}")
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        sys.exit(f"{p} is not valid JSON: {exc}")


def save_json(obj, path):
    Path(path).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def blank(v):
    """True for anything that counts as 'not filled in yet'."""
    if v is None:
        return True
    if isinstance(v, str):
        return not v.strip()
    if isinstance(v, (list, dict)):
        return len(v) == 0
    return False


class Report:
    """Collects blockers, warnings and questions; prints them in a fixed shape."""

    def __init__(self, title):
        self.title = title
        self.blockers, self.warnings, self.questions = [], [], []

    def block(self, msg, question=None):
        self.blockers.append(msg)
        if question:
            self.questions.append(question)

    def warn(self, msg, question=None):
        self.warnings.append(msg)
        if question:
            self.questions.append(question)

    def emit(self, ok_message="Nothing outstanding.", ask_header=None):
        print(f"\n{self.title}\n")
        if self.blockers:
            print("BLOCKERS — do not go on yet:")
            for b in self.blockers:
                print("  x " + b)
            print()
        if self.warnings:
            print("WARNINGS — you can proceed, quality suffers:")
            for w in self.warnings:
                print("  ! " + w)
            print()
        uniq = list(dict.fromkeys(self.questions))
        if uniq:
            print(ask_header or "ASK THE USER THESE — in ONE message, numbered, then wait:\n")
            for i, q in enumerate(uniq, 1):
                print(f"  {i}. {q}")
            print("\nDo not invent answers. Anything they cannot answer becomes an explicit")
            print("assumption, tagged in the storyboard and surfaced on the slide.\n")
        if not self.blockers and not uniq:
            print(ok_message + "\n")
        return 1 if self.blockers else 0
