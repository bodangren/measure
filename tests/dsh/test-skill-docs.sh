#!/usr/bin/env bash
# Skill-doc contract: every SKILL.md frontmatter description stays within the
# skill format (1024 characters, no angle brackets), no SKILL.md links to a
# folder (npm rule `skill.referenced-directory`, finding N3 of
# skill_doctor_fixes_20261031), and the claude-skills bundle holds no symlink.
set -uo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

python3 - "$REPO_ROOT" <<'PY'
import re
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(sys.argv[1])
LIMIT = 1024
FORBIDDEN = ("<", ">")
SCHEME = re.compile(r"^[A-Za-z][A-Za-z0-9+.-]*:")
LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")


def description_of(skill_md: Path) -> str | None:
    """The frontmatter description, inline or `|`/`>` block, whitespace-collapsed."""
    lines = skill_md.read_text(encoding="utf-8").splitlines()
    in_front = False
    in_description = False
    seen = False
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
            seen = True
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
    if not seen:
        return None
    return " ".join(" ".join(parts).split())


def folder_links(skill_md: Path) -> list[str]:
    """Markdown link targets that point to a folder instead of a file."""
    problems: list[str] = []
    for raw in LINK.findall(skill_md.read_text(encoding="utf-8")):
        target = raw.strip()
        if target.startswith("#"):
            continue  # an in-page anchor, not a folder
        if target.startswith("<") and target.endswith(">"):
            target = target[1:-1].strip()
        target = target.split("#", 1)[0].strip()
        if target and SCHEME.match(target):
            continue
        if not target or target.endswith("/"):
            problems.append(f"skill {skill_md.parent.name} links to a folder: {raw.strip()}")
            continue
        resolved = (skill_md.parent / target).resolve()
        if resolved.is_dir():
            problems.append(f"skill {skill_md.parent.name} links to a folder: {raw.strip()}")
    return problems


def check_skills(skills_root: Path) -> list[str]:
    problems: list[str] = []
    for skill_md in sorted(skills_root.glob("*/SKILL.md")):
        name = skill_md.parent.name
        description = description_of(skill_md)
        if description is None:
            problems.append(f"skill {name} has no description")
            continue
        if len(description) > LIMIT:
            problems.append(f"skill {name} description is {len(description)} characters (limit {LIMIT})")
        for char in FORBIDDEN:
            if char in description:
                problems.append(f"skill {name} description contains the forbidden character {char!r}")
        problems.extend(folder_links(skill_md))
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


def write_skill(root: Path, name: str, frontmatter: str, body: str = "# Skill\n") -> Path:
    skill_dir = root / "skills" / name
    skill_dir.mkdir(parents=True, exist_ok=True)
    skill_md = skill_dir / "SKILL.md"
    skill_md.write_text(f"---\n{frontmatter}\n---\n\n{body}", encoding="utf-8")
    return skill_md


# The real repository passes.
problems = run(ROOT)
if problems:
    fail("the repository skill docs and bundle are valid", problems)
print("[PASS] every SKILL.md description is within the skill format, no folder links, no bundle symlinks")

TMP = Path(tempfile.mkdtemp(prefix="skill-docs."))
try:
    # The exact boundary: 1024 passes, 1025 fails (inline).
    boundary = TMP / "boundary"
    write_skill(boundary, "exact", "name: exact\ndescription: " + ("x" * 1024))
    if run(boundary):
        fail("a 1024-character description passes", run(boundary))
    print("[PASS] a 1024-character description passes")
    over = TMP / "over"
    write_skill(over, "over", "name: over\ndescription: " + ("x" * 1025))
    problems = run(over)
    if not problems or "over" not in " ".join(problems) or "1025" not in " ".join(problems):
        fail("a 1025-character description is rejected with its length", problems)
    print("[PASS] a 1025-character description is rejected")

    # The `|` block form is parsed: an over-long block fails, a short block passes.
    block_over = TMP / "block_over"
    write_skill(block_over, "blk", "name: blk\ndescription: |\n  " + ("y" * 1025))
    problems = run(block_over)
    if not problems or "blk" not in " ".join(problems) or "1025" not in " ".join(problems):
        fail("a 1025-character block description is rejected (block form parsed)", problems)
    print("[PASS] a block description is parsed and its length checked")
    block_ok = TMP / "block_ok"
    write_skill(block_ok, "blk", "name: blk\ndescription: |\n  short block text")
    if run(block_ok):
        fail("a short block description passes", run(block_ok))

    # `<` and `>` are independent rules.
    for char, label in (("<", "less-than"), (">", "greater-than")):
        case = TMP / f"char_{label}"
        write_skill(case, label, f"name: {label}\ndescription: uses a {char} b")
        problems = run(case)
        if not problems or "forbidden character" not in " ".join(problems):
            fail(f"a {char}-only description is rejected", problems)
        print(f"[PASS] a {char}-only description is rejected")

    # A missing description is reported.
    missing = TMP / "missing"
    write_skill(missing, "nodesc", "name: nodesc")
    problems = run(missing)
    if not problems or "has no description" not in " ".join(problems):
        fail("a missing description is rejected", problems)
    print("[PASS] a missing description is rejected")

    # Markdown folder links are rejected; a file link passes.
    linked = TMP / "linked"
    skill_md = write_skill(linked, "linked", "name: linked\ndescription: short")
    (linked / "skills" / "linked" / "assets").mkdir()
    with skill_md.open("a", encoding="utf-8") as handle:
        handle.write("[docs](assets)\n[folder](assets/)\n")
    problems = run(linked)
    if not problems or "links to a folder" not in " ".join(problems):
        fail("a Markdown link to a folder is rejected", problems)
    print("[PASS] a Markdown folder link is rejected")
    file_link = TMP / "file_link"
    skill_md = write_skill(file_link, "filelink", "name: filelink\ndescription: short")
    (file_link / "skills" / "filelink" / "assets").mkdir()
    (file_link / "skills" / "filelink" / "assets" / "a.md").write_text("a\n", encoding="utf-8")
    with skill_md.open("a", encoding="utf-8") as handle:
        handle.write("[docs](assets/a.md)\n")
    if run(file_link):
        fail("a Markdown file link passes", run(file_link))
    print("[PASS] a Markdown file link passes")

    # A symlink anywhere in the bundle is rejected.
    bundles = TMP / "bundles"
    bundle = bundles / "claude-skills"
    (bundle / "measure").mkdir(parents=True)
    (bundle / "measure" / "SKILL.md").write_text("# Measure\n", encoding="utf-8")
    (bundle / "measure" / "folder-link").symlink_to(bundle, target_is_directory=True)
    problems = run(bundles)
    if not problems or "symbolic link" not in " ".join(problems) or "folder-link" not in " ".join(problems):
        fail("a symlink in the bundle is rejected with its path", problems)
    print("[PASS] a symlink in the bundle is rejected")
finally:
    shutil.rmtree(TMP, ignore_errors=True)
PY
rc=$?
[ "$rc" -eq 0 ] || fail "the skill-doc contract test failed"
