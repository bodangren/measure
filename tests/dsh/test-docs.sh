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

# Fixture edges: each mutant must be rejected by the same checks.
WORK="$(mktemp -d "${TMPDIR:-/tmp}/measure-dsh-docs.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

cp "$GUIDE" "$WORK/guide.md"
printf '\n[broken](./no-such-doc.md)\n' >>"$WORK/guide.md"
if check_links "$WORK/guide.md" >/dev/null 2>&1; then fail "the dangling-link fixture passed, it must fail"; fi
echo "[PASS] the dangling-link fixture is rejected"

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
