#!/usr/bin/env bash
# Contract test for the CI workflow (track ci_workflow_20261123, spec FR-3).
#
# It checks .github/workflows/ci.yml for: both triggers (pull_request and push
# to main) and no other trigger; the four repo-check commands in order as plain
# `bash ...` steps; one job with a stable name; read-only permissions; pinned
# action versions; no absolute path outside the repo; no heavy-run wrapper.
# The test FAILS before the workflow file exists (Red state).
#
# CI_WORKFLOW_UNDER_TEST overrides the file under test (used only for /tmp
# mutation fixtures that prove this test is not vacuous). It defaults to the
# repo workflow file.
set -uo pipefail

DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd -- "$DIR/../.." && pwd)"
WF="${CI_WORKFLOW_UNDER_TEST:-$REPO/.github/workflows/ci.yml}"

FAILED=0
PASS_COUNT=0
FAIL_COUNT=0
RESULTS=()

pass() { RESULTS+=("PASS: $1"); PASS_COUNT=$((PASS_COUNT + 1)); echo "PASS: $1"; }
fail() { RESULTS+=("FAIL: $1"); FAILED=1; FAIL_COUNT=$((FAIL_COUNT + 1)); echo "FAIL: $1"; }

have_file=0
if [ -f "$WF" ]; then
  have_file=1
fi

need_file() {
  if [ "$have_file" -eq 0 ]; then
    fail "$1: cannot check, workflow file is missing"
    return 1
  fi
  return 0
}

# Extract the `on:` trigger block: the `on:` line plus following lines up to
# the next top-level key. Supports the mapping form only; an inline
# `on: [...]` list cannot pin push branches, so it fails the push check.
on_block() {
  awk '/^on:/{f=1;print;next} f && /^[^[:space:]#]/{exit} f' "$WF"
}

# Two-space keys inside the `on:` block are the trigger names.
on_keys() {
  on_block | grep -oE '^  [A-Za-z_][A-Za-z0-9_]*' | sed -E 's/^  //' | sort -u
}

echo "=== workflow-file-exists ==="
if [ "$have_file" -eq 1 ]; then
  pass "workflow-file-exists: $WF exists"
else
  fail "workflow-file-exists: $WF is missing (Green has not added it yet)"
fi

echo "=== trigger-pull-request ==="
if need_file "trigger-pull-request"; then
  if on_keys | grep -qx 'pull_request'; then
    pass "trigger-pull-request: on: includes pull_request"
  else
    fail "trigger-pull-request: on: does not include pull_request"
  fi
fi

echo "=== trigger-push-to-main ==="
if need_file "trigger-push-to-main"; then
  push_section="$(awk '/^  push:/{f=1;next} f && /^  [A-Za-z_][A-Za-z0-9_]*:/{exit} f' "$WF")"
  if [ -z "$push_section" ]; then
    fail "trigger-push-to-main: on: has no push: section with a branches list"
  else
    branches_line="$(echo "$push_section" | grep -E 'branches:' | head -n 1 || true)"
    if [ -z "$branches_line" ]; then
      fail "trigger-push-to-main: push: section names no branches"
    elif [[ "$branches_line" == *"["* ]]; then
      items="$(echo "$branches_line" | sed -E 's/.*\[([^]]*)\].*/\1/' | tr ',' '\n' | tr -d "'\"" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' | grep -v '^$' || true)"
      if [ "$items" = "main" ]; then
        pass "trigger-push-to-main: push branches list is exactly [main]"
      else
        fail "trigger-push-to-main: push branches list is not exactly [main]: [$items]"
      fi
    else
      items="$(echo "$push_section" | grep -E '^[[:space:]]*-[[:space:]]*' | sed -E 's/^[[:space:]]*-[[:space:]]*//; s/[[:space:]]*#.*$//' | tr -d "'\"" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' | grep -v '^$' || true)"
      if [ -z "$items" ]; then
        fail "trigger-push-to-main: push: branches list is empty"
      elif echo "$items" | grep -qxv 'main'; then
        fail "trigger-push-to-main: push: branches list names a branch other than main: [$items]"
      else
        pass "trigger-push-to-main: push: branches list names only main"
      fi
    fi
  fi
fi

echo "=== trigger-no-other ==="
if need_file "trigger-no-other"; then
  actual="$(on_keys | tr '\n' ' ' | sed -E 's/ +$//')"
  echo "Trigger keys: [$actual]"
  if [ "$actual" = "pull_request push" ]; then
    pass "trigger-no-other: only pull_request and push start the workflow"
  else
    fail "trigger-no-other: expected exactly [pull_request push], found [$actual]"
  fi
fi

echo "=== one-job ==="
JOB_NAMES=""
if need_file "one-job"; then
  JOB_NAMES="$(awk '/^jobs:/{f=1;next} f && /^[^[:space:]#]/{exit} f' "$WF" | grep -E '^  [A-Za-z0-9_-]+:' | sed -E 's/^  //; s/:.*$//' || true)"
  if [ -z "$JOB_NAMES" ]; then
    echo "Job count: 0"
    fail "one-job: no job found under jobs:"
  else
    JOB_COUNT="$(echo "$JOB_NAMES" | grep -c .)"
    echo "Job count: $JOB_COUNT"
    if [ "$JOB_COUNT" -eq 1 ]; then
      pass "one-job: exactly one job"
    else
      fail "one-job: expected 1 job, found $JOB_COUNT: [$JOB_NAMES]"
    fi
  fi
fi

echo "=== job-stable-name ==="
if need_file "job-stable-name"; then
  if [ -z "$JOB_NAMES" ]; then
    fail "job-stable-name: no job name to check"
  elif echo "$JOB_NAMES" | grep -qE '^[A-Za-z0-9_-]+$'; then
    echo "Job name: $JOB_NAMES"
    pass "job-stable-name: single stable job name [$JOB_NAMES] (feeds the required-check rule)"
  else
    fail "job-stable-name: job name is not a stable identifier: [$JOB_NAMES]"
  fi
fi

CMDS=(
  "bash tests/spec_review_gate/run.sh"
  "bash tests/dsh/run.sh"
  "bash plugins/dsh-measure-guard/scripts/check-parity.sh"
  "bash plugins/opencode-measure-guard/scripts/check-parity.sh"
)

echo "=== four-commands-present ==="
ORDER="ok"
PREV=0
IDX=0
if need_file "four-commands-present"; then
  for cmd in "${CMDS[@]}"; do
    IDX=$((IDX + 1))
    hits="$(grep -n -F -- "$cmd" "$WF" | cut -d: -f1 || true)"
    n="$(echo "$hits" | grep -c . || true)"
    [ -z "$hits" ] && n=0
    echo "Occurrences of [$cmd]: $n"
    if [ "$n" -ne 1 ]; then
      fail "four-commands-present: command $IDX [$cmd] occurs $n times, expected exactly 1"
      ORDER="bad"
      continue
    fi
    ln="$hits"
    if ! sed -n "${ln}p" "$WF" | grep -qE '^[[:space:]]*(-[[:space:]]+)?run:[[:space:]]*bash '; then
      fail "four-commands-present: command $IDX [$cmd] is not a plain \`bash ...\` run step (line $ln)"
      ORDER="bad"
      continue
    fi
    pass "four-commands-present: command $IDX [$cmd] is one plain bash run step"
    if [ "$ln" -le "$PREV" ]; then
      ORDER="bad"
    fi
    PREV="$ln"
  done
fi

echo "=== commands-in-order ==="
if need_file "commands-in-order"; then
  if [ "$have_file" -eq 1 ] && [ "$ORDER" = "ok" ]; then
    pass "commands-in-order: the four commands run in spec order"
  else
    fail "commands-in-order: the four commands are not all present exactly once in spec order"
  fi
fi

echo "=== no-extra-run-steps ==="
if need_file "no-extra-run-steps"; then
  RUN_COUNT="$(grep -cE '^[[:space:]]*(-[[:space:]]+)?run:' "$WF" || true)"
  echo "Run step count: $RUN_COUNT"
  if [ "$RUN_COUNT" -eq 4 ]; then
    pass "no-extra-run-steps: exactly the four command steps, nothing else"
  else
    fail "no-extra-run-steps: expected 4 run: steps, found $RUN_COUNT"
  fi
fi

echo "=== no-heavy-run ==="
if need_file "no-heavy-run"; then
  if grep -q -F 'heavy-run' "$WF"; then
    fail "no-heavy-run: workflow references heavy-run (FR-7 wrapper is local-only)"
  else
    pass "no-heavy-run: workflow names no heavy-run wrapper"
  fi
fi

echo "=== no-heavy-var ==="
if need_file "no-heavy-var"; then
  if grep -q -F 'HEAVY_' "$WF"; then
    fail "no-heavy-var: workflow sets a HEAVY_ variable (FR-7 wrapper is local-only)"
  else
    pass "no-heavy-var: workflow sets no HEAVY_ variable"
  fi
fi

echo "=== permissions-contents-read ==="
if need_file "permissions-contents-read"; then
  if grep -qE '^[[:space:]]*permissions:' "$WF" && grep -qE '^[[:space:]]*contents:[[:space:]]*read([[:space:]]*$|#)' "$WF"; then
    pass "permissions-contents-read: permissions: contents: read is set"
  else
    fail "permissions-contents-read: permissions: contents: read is missing"
  fi
fi

echo "=== permissions-no-write ==="
if need_file "permissions-no-write"; then
  perm_block="$(awk '/^[[:space:]]*permissions:/{f=1;next} f && /^[^[:space:]#]/{exit} f' "$WF")"
  if echo "$perm_block" | grep -qE 'write'; then
    fail "permissions-no-write: permissions block grants write"
  else
    pass "permissions-no-write: permissions block grants no write"
  fi
fi

echo "=== actions-present ==="
ACTION_REFS=""
if need_file "actions-present"; then
  ACTION_REFS="$(grep -E '^[[:space:]]*-[[:space:]]*uses:' "$WF" | sed -E 's/.*uses:[[:space:]]*//; s/[[:space:]#].*$//' | sed -E 's/^[^@]+@//' || true)"
  USES_COUNT="$(grep -cE '^[[:space:]]*-[[:space:]]*uses:' "$WF" || true)"
  echo "Action step count: $USES_COUNT"
  if [ "$USES_COUNT" -ge 1 ]; then
    pass "actions-present: workflow declares $USES_COUNT action step(s)"
  else
    fail "actions-present: workflow declares no action step (checkout is needed to run repo commands)"
  fi
fi

echo "=== actions-pinned ==="
if need_file "actions-pinned"; then
  # Pin rule, justified: a full 40-hex commit SHA is immutable and preferred.
  # A major or major.minor.patch version tag (v4, v4.1.0) is accepted because
  # first-party actions move such tags only to compatible fixes, and the tag
  # is the ref the required-check rule resolves. Branch names, `latest`, and
  # short SHAs are rejected: they can move under the workflow.
  unpinned="$(echo "$ACTION_REFS" | grep -vE '^([0-9a-f]{40}|v[0-9]+(\.[0-9]+){0,2})$' || true)"
  if [ -z "$ACTION_REFS" ]; then
    fail "actions-pinned: no action refs to check"
  elif [ -z "$unpinned" ]; then
    pass "actions-pinned: every action ref is a full SHA or version tag"
  else
    fail "actions-pinned: unpinned action ref(s): [$(echo "$unpinned" | tr '\n' ' ')]"
  fi
fi

echo "=== no-absolute-path ==="
if need_file "no-absolute-path"; then
  bad="$(grep -nE '/(home|root|mnt|media|etc|var|usr|opt|private)/' "$WF" || true)"
  if [ -n "$bad" ]; then
    fail "no-absolute-path: workflow names a path outside the repo: [$bad]"
  elif grep -qF '$HOME' "$WF"; then
    fail "no-absolute-path: workflow references \$HOME"
  else
    pass "no-absolute-path: workflow names no path outside the repo"
  fi
fi

TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo "=== Total: $TOTAL checks (PASS=$PASS_COUNT, FAIL=$FAIL_COUNT) ==="
for r in "${RESULTS[@]+"${RESULTS[@]}"}"; do echo "$r"; done
if [ "$FAILED" -ne 0 ]; then
  exit 1
fi
exit 0
