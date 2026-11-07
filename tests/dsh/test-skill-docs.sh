#!/usr/bin/env bash
# Skill-doc contract: every SKILL.md frontmatter description stays within the
# skill format (1024 characters, no angle brackets) and the claude-skills bundle
# holds real files, not folder links.
set -uo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

python3 - "$REPO_ROOT" <<'PY'
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(sys.argv[1])
LIMIT = 1024
FORBIDDEN = ("<", ">")


def description_of(skill_md: Path) -> str:
    """The frontmatter description, inline or `|`/`>` block, whitespace-collapsed."""
    lines = skill_md.read_text(encoding="utf-8").splitlines()
    in_front = False
    in_description = False
    parts: list[str] = []
    for line in lines:
        if line.strip() == "---":
            if not in_front:
                in_front = True
                continue
            break
        if not in_front:
            continue
        if line.startswith("description:"):
            in_description = True
            rest = line.split(":", 1)[1].strip()
            if rest and rest not in ("|", ">"):
                parts.append(rest)
            continue
        if in_description:
            if line.startswith("  "):
                parts.append(line[2:])
            elif line.strip() == "":
                continue
            else:
                break
    return " ".join(" ".join(parts).split())


def check_skills(skills_root: Path) -> list[str]:
    problems: list[str] = []
    for skill_md in sorted(skills_root.glob("*/SKILL.md")):
        name = skill_md.parent.name
        description = description_of(skill_md)
        if len(description) > LIMIT:
            problems.append(f"skill {name} description is {len(description)} characters (limit {LIMIT})")
        for char in FORBIDDEN:
            if char in description:
                problems.append(f"skill {name} description contains the forbidden character {char!r}")
    return problems


def check_bundle(bundle_root: Path) -> list[str]:
    problems: list[str] = []
    if not bundle_root.exists():
        return problems
    for path in sorted(bundle_root.rglob("*")):
        if path.is_symlink():
            problems.append(f"claude-skills bundle path is a symbolic link: {path.relative_to(bundle_root)}")
    return problems


def run(root: Path) -> list[str]:
    return check_skills(root / "skills") + check_bundle(root / "claude-skills")


def fail(label: str, problems: list[str]) -> None:
    print(f"[FAIL] {label}")
    for problem in problems:
        print(f"  {problem}")
    raise SystemExit(1)


# The real repository passes.
problems = run(ROOT)
if problems:
    fail("the repository skill docs and bundle are valid", problems)
print("[PASS] every SKILL.md description is within the skill format and the bundle has no links")

TMP = Path(tempfile.mkdtemp(prefix="skill-docs."))
try:
    # Negative fixture: an oversized description.
    skills = TMP / "oversized" / "skills"
    (skills / "huge").mkdir(parents=True)
    (skills / "huge" / "SKILL.md").write_text(
        "---\nname: huge\ndescription: " + ("x" * 1100) + "\n---\n# Huge\n", encoding="utf-8"
    )
    problems = run(TMP / "oversized")
    if not problems or "huge" not in " ".join(problems) or "1024" not in " ".join(problems):
        fail("an oversized description is rejected with its skill name and length", problems)
    print("[PASS] an oversized description is rejected")

    # Negative fixture: an angle bracket.
    skills = TMP / "bracket" / "skills"
    (skills / "bracketed").mkdir(parents=True)
    (skills / "bracketed" / "SKILL.md").write_text(
        "---\nname: bracketed\ndescription: uses a <tag> in the text\n---\n# Bracketed\n", encoding="utf-8"
    )
    problems = run(TMP / "bracket")
    if not problems or "bracketed" not in " ".join(problems) or "forbidden character" not in " ".join(problems):
        fail("a description with an angle bracket is rejected with its skill name", problems)
    print("[PASS] an angle-bracket description is rejected")

    # Negative fixture: a folder link in the bundle.
    bundle = TMP / "linked" / "claude-skills"
    (bundle / "measure").mkdir(parents=True)
    (bundle / "measure" / "SKILL.md").write_text("# Measure\n", encoding="utf-8")
    (bundle / "measure" / "folder-link").symlink_to(bundle, target_is_directory=True)
    problems = run(TMP / "linked")
    if not problems or "symbolic link" not in " ".join(problems) or "folder-link" not in " ".join(problems):
        fail("a folder link in the bundle is rejected with its path", problems)
    print("[PASS] a folder link in the bundle is rejected")
finally:
    shutil.rmtree(TMP, ignore_errors=True)
PY
rc=$?
[ "$rc" -eq 0 ] || fail "the skill-doc contract test failed"
