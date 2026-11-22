#!/usr/bin/env bash
# tests/deps_audit/run.sh — dependency audit check for the two JS folders.
#
# Contract (plan.md "Audit check contract" and the header of tests/deps_audit/test.sh):
# - Runs `bun audit --json` in extensions/measure-status and in
#   plugins/opencode-measure-guard, then counts advisories by severity.
# - Prints one line per folder, in this shape:
#     <folder>: critical N, high N, moderate N, low N
#   where <folder> is the folder base name (measure-status,
#   opencode-measure-guard).
# - Exit 0 when both folders hold 0 critical and 0 high advisories.
# - Exit 1 when any folder holds a critical or high advisory that the allow
#   file does not cover.
# - Exit 2 when `bun audit` fails or its output does not parse. It also exits
#   2 when an advisory record has a severity outside critical, high,
#   moderate, and low. The parser never drops such a record.
#
# Env:
# - DEPS_AUDIT_FIXTURE_DIR: when set, the parser reads
#   <dir>/measure-status.json and <dir>/opencode-measure-guard.json (files
#   shaped like real `bun audit --json` output) instead of running
#   `bun audit`, so the tests run without the network.
# - DEPS_AUDIT_ALLOW_FILE: path of the allow file; defaults to
#   tests/deps_audit/allow.txt. Each line holds a GHSA id and its
#   PM-accepted reason. An entry needs both parts: a bare id exempts
#   nothing. The id matches exactly, never as a prefix. An advisory whose
#   GHSA id (the advisory `url` tail) matches an allow line does not count.
#
# `bun audit --json` exits 1 when it finds advisories and 0 when it finds
# none. A run that fails for another reason exits with a code above 1 and
# leaves no parsable output, so both cases end at exit 2 here.
set -uo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$HERE/../.." && pwd)"
ALLOW_FILE="${DEPS_AUDIT_ALLOW_FILE:-$HERE/allow.txt}"
FIXTURE_DIR="${DEPS_AUDIT_FIXTURE_DIR:-}"

FOLDER_NAMES=(measure-status opencode-measure-guard)
FOLDER_PATHS=(extensions/measure-status plugins/opencode-measure-guard)

TMPDIR_RUN="$(mktemp -d)" || {
  printf 'run.sh: cannot create a temporary directory\n' >&2
  exit 2
}
trap 'rm -rf "$TMPDIR_RUN"' EXIT

AUDIT_FILES=()
for index in "${!FOLDER_NAMES[@]}"; do
  name="${FOLDER_NAMES[$index]}"
  target="$TMPDIR_RUN/$name.json"
  if [[ -n "$FIXTURE_DIR" ]]; then
    source_file="$FIXTURE_DIR/$name.json"
    if [[ ! -f "$source_file" ]]; then
      printf 'run.sh: no fixture file for %s: %s\n' "$name" "$source_file" >&2
      exit 2
    fi
    cp -- "$source_file" "$target" || exit 2
  else
    (cd -- "$REPO_ROOT/${FOLDER_PATHS[$index]}" && bun audit --json) >"$target" 2>"$TMPDIR_RUN/$name.err"
    audit_rc=$?
    if [[ "$audit_rc" -gt 1 ]]; then
      printf 'run.sh: bun audit failed in %s (exit %d)\n' "${FOLDER_PATHS[$index]}" "$audit_rc" >&2
      exit 2
    fi
  fi
  AUDIT_FILES+=("$target")
done

PAIRS=()
for index in "${!FOLDER_NAMES[@]}"; do
  PAIRS+=("${FOLDER_NAMES[$index]}=${AUDIT_FILES[$index]}")
done

python3 - "$ALLOW_FILE" "${PAIRS[@]}" <<'PY'
import json
import sys

SEVERITIES = ("critical", "high", "moderate", "low")

allow_file = sys.argv[1]
allowed = set()
try:
    with open(allow_file, encoding="utf-8", errors="replace") as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split(None, 1)
            token = parts[0].rstrip(":")
            reason = parts[1].strip() if len(parts) > 1 else ""
            # An entry needs an id and a reason. A bare id exempts nothing.
            if token and reason:
                allowed.add(token)
except OSError:
    # A missing allow file allows nothing.
    pass

exit_code = 0
for pair in sys.argv[2:]:
    name, path = pair.split("=", 1)
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError) as error:
        sys.stderr.write("run.sh: cannot parse the audit output for %s: %s\n" % (name, error))
        sys.exit(2)
    if not isinstance(data, dict):
        sys.stderr.write("run.sh: the audit output for %s is not a JSON object\n" % name)
        sys.exit(2)
    counts = {severity: 0 for severity in SEVERITIES}
    for package, advisories in data.items():
        if not isinstance(advisories, list):
            sys.stderr.write("run.sh: the audit output for %s has a malformed %s entry\n" % (name, package))
            sys.exit(2)
        for advisory in advisories:
            if not isinstance(advisory, dict):
                sys.stderr.write("run.sh: the audit output for %s has a malformed advisory\n" % name)
                sys.exit(2)
            severity = advisory.get("severity")
            # The severity is checked before the count and before the
            # allowance. A record with an unknown severity is malformed.
            if severity not in SEVERITIES:
                sys.stderr.write(
                    "run.sh: the audit output for %s has an advisory with an unknown severity: %r\n"
                    % (name, severity)
                )
                sys.exit(2)
            ghsa = str(advisory.get("url", "")).rsplit("/", 1)[-1]
            if ghsa in allowed:
                continue
            counts[severity] += 1
            if severity in ("critical", "high"):
                sys.stderr.write(
                    "run.sh: %s %s in %s: %s\n" % (severity, name, package, ghsa or advisory.get("title", ""))
                )
                exit_code = 1
    print(
        "%s: critical %d, high %d, moderate %d, low %d"
        % (name, counts["critical"], counts["high"], counts["moderate"], counts["low"])
    )
sys.exit(exit_code)
PY
