#!/usr/bin/env bash
# The DSH agent-team reference (Task 3.2): the reference exists, its local links
# resolve, every role row names an existing prompt source and a model from the
# profile, the three review families are distinct, the prompt template and the
# restrictions are present, and every workflow command is named. Fixture edges:
# a renamed model, a missing role row, and a repeated review family each fail.
set -euo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
REF="$ROOT/skills/measure-orchestrator/references/dsh.md"
DSH_HOME_DIR="${DSH_HOME:-$HOME/.dsh}"
PATCH="${MEASURE_DSH_PATCH:-$DSH_HOME_DIR/profiles/web/cordis.patch.yml}"

fail() { echo "[FAIL] test-reference.sh: $*" >&2; exit 1; }
[[ -f "$REF" ]] || fail "missing reference: $REF"

# check_ref <ref-file> <profile-patch> — prints nothing, returns 1 on a problem
# with the problem on stderr; the caller decides whether that is the real file
# or a fixture.
check_ref() {
  local ref="$1" patch="$2" bad=0 dir role prompt model provider family
  local -a review_models=() review_families=()

  # 1. Local markdown links resolve relative to the reference's folder.
  local link
  while IFS= read -r link; do
    [[ -z "$link" ]] && continue
    case "$link" in http://*|https://*|\#*) continue ;; esac
    local target="${link%%#*}"
    [[ -z "$target" ]] && continue
    if [[ ! -e "$(cd -- "$(dirname -- "$ref")" && pwd)/$target" ]]; then
      echo "dangling link: $link" >&2
      bad=1
    fi
  done < <(grep -oE '\]\([^)]+\)' "$ref" | sed -E 's/^\]\(//; s/\)$//' | sort -u)

  # 2. Every role row: prompt source exists and the model appears in the patch.
  local rows=0
  while IFS='|' read -r _ c_role c_prompt c_model _; do
    role="$(printf '%s' "$c_role" | tr -d ' `')"
    prompt="$(printf '%s' "$c_prompt" | tr -d ' `')"
    model="$(printf '%s' "$c_model" | tr -d ' `')"
    [[ -z "$role" || -z "$model" ]] && continue
    rows=$((rows + 1))
    [[ -f "$ROOT/$prompt" ]] || { echo "missing prompt source for $role: $prompt" >&2; bad=1; }
    provider="${model%%/*}"
    if [[ -f "$patch" ]]; then
      grep -q -- "model: ${model#*/}" "$patch" || { echo "model not in profile: $model ($role)" >&2; bad=1; }
      grep -q -- "provider: $provider" "$patch" || { echo "provider not in profile: $provider ($role)" >&2; bad=1; }
    fi
    case "$role" in
      measure-review-a-correctness|measure-review-b-security|measure-review-c-ux-api)
        review_models+=("$model"); review_families+=("$provider") ;;
    esac
  done < <(grep -E '^\| `measure-[a-z-]+` \| `agents/measure-[a-z-]+\.md` \| `[a-z-]+/[^`]+` \|' "$ref")

  (( rows == 14 )) || { echo "expected 14 role rows, found $rows" >&2; bad=1; }

  # 3. The three review families are distinct and all three are present.
  local distinct
  distinct="$(printf '%s\n' "${review_families[@]}" | sort -u | wc -l | tr -d ' ')"
  (( distinct == 3 )) || { echo "the three review roles must use three families (found $distinct)" >&2; bad=1; }
  (( ${#review_models[@]} == 3 )) || { echo "expected 3 review role rows, found ${#review_models[@]}" >&2; bad=1; }

  # 4. The fixed sections are present.
  grep -q '^## 2\. Subagent tools' "$ref" || { echo "missing '## 2. Subagent tools'" >&2; bad=1; }
  grep -q '^## 5\. Prompt template' "$ref" || { echo "missing '## 5. Prompt template'" >&2; bad=1; }
  grep -q '^## 7\. Guard-marker handoffs' "$ref" || { echo "missing '## 7. Guard-marker handoffs'" >&2; bad=1; }
  grep -q 'Per-role restrictions' "$ref" || { echo "missing the per-role restrictions" >&2; bad=1; }

  # 5. Every workflow command is named in the reference.
  local command
  for command in measure-setup measure-new-track measure-new-track-set measure-implement \
                 measure-review measure-revert measure-doctor measure-orchestrate; do
    grep -q -- "$command" "$ref" || { echo "command not named: $command" >&2; bad=1; }
  done

  return "$bad"
}

# Fixture patch when no live profile is readable: the ids the reference names.
WORK="$(mktemp -d "${TMPDIR:-/tmp}/measure-dsh-reference.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
if [[ ! -f "$PATCH" ]]; then
  PATCH="$WORK/cordis.patch.yml"
  { for provider in deepseek-official minimax-cn xiaomi kimi-coding; do
      printf -- '- id: fixture-%s\n  config:\n    provider: %s\n    model: fixture\n' "$provider" "$provider"
    done
    for model in deepseek-flash MiniMax-M3.1-Flash mimo-v2.6-flash mimo-v2.6-pro k3.1-pro kimi-for-coding; do
      printf -- '    model: %s\n' "$model"
    done
  } >"$PATCH"
  echo "[WARN] no readable profile patch; model checks use a fixture"
fi

check_ref "$REF" "$PATCH" || fail "the reference does not pass its own checks"
echo "[PASS] the reference, its links, the 14 role rows, the family rule, and the sections"

# Fixture edges: each mutated copy must be rejected by the same checker.
mutant() { # name, sed expression
  local name="$1" expr="$2" copy="$WORK/$1.md"
  cp "$REF" "$copy"
  sed -i -e "$expr" "$copy"
  if check_ref "$copy" "$PATCH" >/dev/null 2>&1; then
    fail "the $name fixture passed, it must fail"
  fi
  echo "[PASS] the $name fixture is rejected"
}
mutant "renamed-model"   's#`kimi-coding/k3.1-pro`#`unknown-family/unknown-model`#'
mutant "missing-role"    '/`measure-closeout`/d'
mutant "shared-family"   's#| `measure-review-b-security` | `agents/measure-review-b-security.md` | `kimi-coding/k3.1-pro` |#| `measure-review-b-security` | `agents/measure-review-b-security.md` | `xiaomi/mimo-v2.6-pro` |#'

echo "[PASS] test-reference.sh"
