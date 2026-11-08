#!/usr/bin/env bash
# The guide and its documentation checks (Task 4.1): docs/dsh.md exists, its
# local links resolve, it names the eight commands, the README links the guide
# and names DSH, the CHANGELOG carries the environment entry, and the tech stack
# records the CLI. Fixture edges: a dangling link, a missing command name, a
# missing README link, and a missing changelog entry each fail.
set -euo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$HERE/../.." && pwd)"
GUIDE="$ROOT/docs/dsh.md"
README="$ROOT/README.md"
CHANGELOG="$ROOT/CHANGELOG.md"
TECHSTACK="$ROOT/measure/tech-stack.md"
TARGETS="$ROOT/bin/install-targets.tsv"

fail() { echo "[FAIL] test-docs.sh: $*" >&2; exit 1; }

COMMANDS=(
  measure-setup measure-new-track measure-new-track-set measure-implement
  measure-review measure-revert measure-doctor measure-orchestrate
)

check_links() { # file
  local file="$1" link target
  while IFS= read -r link; do
    [[ -z "$link" ]] && continue
    case "$link" in http://*|https://*|mailto:*|\#*) continue ;; esac
    target="${link%%#*}"
    [[ -z "$target" ]] && continue
    [[ -e "$(dirname -- "$file")/$target" ]] || { echo "dangling link in $file: $link" >&2; return 1; }
  done < <(grep -oE '\]\([^)]+\)' "$file" | sed -E 's/^\]\(//; s/\)$//' | sort -u)
}

check_commands() { # file
  local file="$1" command
  for command in "${COMMANDS[@]}"; do
    grep -q -- "$command" "$file" || { echo "command not named in $file: $command" >&2; return 1; }
  done
}

check_readme() { # file
  grep -q 'docs/dsh.md' "$1" || { echo "README does not link docs/dsh.md" >&2; return 1; }
  grep -qi 'deepseek harness' "$1" || { echo "README does not name the DeepSeek Harness" >&2; return 1; }
}

check_changelog() { # file
  grep -qi 'dsh_measure_dev_20261107\|measure-dsh' "$1" || { echo "CHANGELOG has no environment entry" >&2; return 1; }
}

check_techstack() { # file
  grep -q 'bin/measure-dsh' "$1" || { echo "tech-stack does not record bin/measure-dsh" >&2; return 1; }
  grep -q 'dsh_measure_dev_20261107' "$1" || { echo "tech-stack has no tooling exception for this track" >&2; return 1; }
}

# check_code_spans FILE: inline code spans pair up (a backtick run closes with an equal
# run; fenced blocks and escaped backticks are skipped; a different run inside an open span
# is content). Catches a stray backtick in a guide or README.
check_code_spans() { # file
  python3 - "$1" <<'PY'
import sys
path = sys.argv[1]
stack = []
fence = None
for number, line in enumerate(open(path, encoding="utf-8").read().splitlines(), 1):
    stripped = line.lstrip()
    if stripped.startswith("```") or stripped.startswith("~~~"):
        marker = stripped[:3]
        if fence is None:
            fence = marker
        elif fence == marker:
            fence = None
        continue
    if fence is not None:
        continue
    i = 0
    while i < len(line):
        if line[i] != "`" or (i > 0 and line[i - 1] == "\\"):
            i += 1
            continue
        j = i
        while j < len(line) and line[j] == "`":
            j += 1
        run = j - i
        if stack and stack[-1][1] == run:
            stack.pop()
        elif not stack:
            stack.append((number, run))
        i = j
if stack:
    print(f"{path}:{stack[0][0]}: an inline code span opened with {stack[0][1]} backticks never closes",
          file=sys.stderr)
    sys.exit(1)
PY
}

# check_limits FILE HEADING: the named `## ` section exists and holds at least two bullets.
check_limits() { # file heading
  python3 - "$1" "$2" <<'PY'
import re, sys
path, heading = sys.argv[1], sys.argv[2]
lines = open(path, encoding="utf-8").read().splitlines()
start = None
for i, line in enumerate(lines):
    if line.strip() == f"## {heading}":
        start = i
        break
if start is None:
    print(f"{path}: no '## {heading}' section", file=sys.stderr)
    sys.exit(1)
bullets = 0
for line in lines[start + 1:]:
    if line.startswith("## "):
        break
    if re.match(r"^[-*] \S", line):
        bullets += 1
if bullets < 2:
    print(f"{path}: the '## {heading}' section has {bullets} bullets", file=sys.stderr)
    sys.exit(1)
PY
}

check_targets() { # file

  if grep -q 'dsh-measure-guard' "$1"; then
    echo "install-targets.tsv still carries a DSH plugin row; bin/measure-dsh owns that copy" >&2
    return 1
  fi
}

for file in "$GUIDE" "$README" "$CHANGELOG" "$TECHSTACK" "$TARGETS"; do
  [[ -f "$file" ]] || fail "missing file: $file"
done

check_links "$GUIDE" || fail "the guide has a dangling link"
echo "[PASS] the guide's links resolve"
check_links "$README" || fail "the README has a dangling link"
echo "[PASS] the README's links resolve"
check_commands "$GUIDE" || fail "the guide does not name every command"
echo "[PASS] the guide names all eight commands"
check_readme "$README" || fail "the README does not link the guide or name DSH"
echo "[PASS] the README links the guide and names DSH"
check_changelog "$CHANGELOG" || fail "the CHANGELOG has no environment entry"
echo "[PASS] the CHANGELOG carries the environment entry"
check_techstack "$TECHSTACK" || fail "the tech stack is missing the CLI rows"
echo "[PASS] the tech stack records the CLI and its tooling exception"
check_targets "$TARGETS" || fail "the installer still carries the DSH plugin row"
echo "[PASS] the installer carries no DSH plugin row"
for doc in "$GUIDE" "$ROOT/plugins/dsh-measure-guard/README.md" "$ROOT/plugins/opencode-measure-guard/README.md"; do
  check_code_spans "$doc" || fail "unbalanced inline code span in $doc"
done
echo "[PASS] the guide and both plugin READMEs hold balanced inline code spans"
check_limits "$ROOT/plugins/dsh-measure-guard/README.md" 'Known limits' || fail "the DSH README does not document its known limits"
check_limits "$ROOT/plugins/opencode-measure-guard/README.md" 'Known limitations (OpenCode 2.0.32)' ||
  fail "the OpenCode README does not document its known limitations"
echo "[PASS] both adapter READMEs document their known limits"

# Fixture edges: each mutant must be rejected by the same checks.
WORK="$(mktemp -d "${TMPDIR:-/tmp}/measure-dsh-docs.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

cp "$GUIDE" "$WORK/guide.md"
printf '\n[broken](./no-such-doc.md)\n' >>"$WORK/guide.md"
if check_links "$WORK/guide.md" >/dev/null 2>&1; then fail "the dangling-link fixture passed, it must fail"; fi
echo "[PASS] the dangling-link fixture is rejected"

cp "$ROOT/plugins/opencode-measure-guard/README.md" "$WORK/spans.md"
printf '\nA broken `span here.\n' >>"$WORK/spans.md"
if check_code_spans "$WORK/spans.md" >/dev/null 2>&1; then fail "the unbalanced-span fixture passed, it must fail"; fi
echo "[PASS] the unbalanced-span fixture is rejected"

printf '# Fixture\n\n## Other\n\n- one\n- two\n' >"$WORK/nolimits.md"
if check_limits "$WORK/nolimits.md" 'Known limits' >/dev/null 2>&1; then fail "the missing-limits fixture passed, it must fail"; fi
echo "[PASS] the missing-limits fixture is rejected"

cp "$GUIDE" "$WORK/commands.md"
sed -i 's/measure-doctor//' "$WORK/commands.md"
if check_commands "$WORK/commands.md" >/dev/null 2>&1; then fail "the missing-command fixture passed, it must fail"; fi
echo "[PASS] the missing-command fixture is rejected"

cp "$README" "$WORK/readme.md"
sed -i '/docs\/dsh\.md/d' "$WORK/readme.md"
if check_readme "$WORK/readme.md" >/dev/null 2>&1; then fail "the missing-README-link fixture passed, it must fail"; fi
echo "[PASS] the missing-README-link fixture is rejected"

cp "$CHANGELOG" "$WORK/changelog.md"
sed -i '/dsh_measure_dev_20261107\|measure-dsh/d' "$WORK/changelog.md"
if check_changelog "$WORK/changelog.md" >/dev/null 2>&1; then fail "the missing-changelog fixture passed, it must fail"; fi
echo "[PASS] the missing-changelog fixture is rejected"

echo "[PASS] test-docs.sh"
