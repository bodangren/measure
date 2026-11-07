#!/usr/bin/env bash
# The rehearsal fixture: make-project.sh builds a disposable Measure project and
# the plugin's real snapshot loader reads it as the active track. Cleanup is
# asserted too (the project is removed from the temp folder).
set -uo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"

REHEARSAL="$TESTS_DIR/rehearsal/make-project.sh"
PLUGIN_DIR="$REPO_ROOT/plugins/dsh-measure-guard"
PROJECT=""
cleanup() {
  if [[ -n "$PROJECT" ]]; then
    "$REHEARSAL" --cleanup "$PROJECT"
    PROJECT=""
  fi
}
trap cleanup EXIT

[[ -x "$REHEARSAL" ]] || fail "the fixture builder is missing or not executable: $REHEARSAL"

PROJECT="$("$REHEARSAL")"
[[ -d "$PROJECT" ]] || fail "the builder did not print an existing project"
case "$PROJECT" in
  "${TMPDIR:-/tmp}"/* | /tmp/* | /var/folders/*) ;;
  *) fail "the fixture is outside the temp folder: $PROJECT" ;;
esac

for file in measure/index.md measure/tracks.md measure/tracks/rehearsal_20260101/plan.md measure/tracks/rehearsal_20260101/metadata.json; do
  [[ -f "$PROJECT/$file" ]] || fail "missing fixture file: $file"
done

# The commit is the fixture's contract: assert the object, not the .git/HEAD file.
assert_committed() {
  local dir="$1" count
  git -C "$dir" rev-parse --verify --quiet HEAD >/dev/null 2>&1 || return 1
  count="$(git -C "$dir" log --oneline 2>/dev/null | wc -l | tr -d ' ')"
  [[ "$count" == "1" ]]
}
assert_committed "$PROJECT" || fail "the fixture has no single initial commit"
EMPTY="$(mktemp -d "${TMPDIR:-/tmp}/dsh-fixture-negative.XXXXXX")"
if git -C "$EMPTY" init -q && assert_committed "$EMPTY"; then
  rm -rf -- "$EMPTY"
  fail "a repository with no commit passed the commit assertion"
fi
rm -rf -- "$EMPTY"
echo "[PASS] the fixture carries exactly one initial commit"

OUT="$(PLUGIN_DIR="$PLUGIN_DIR" PROJECT="$PROJECT" node --experimental-strip-types --input-type=module -e '
import { execFileSync } from "node:child_process"
import { existsSync, readFileSync, realpathSync } from "node:fs"

const project = process.env.PROJECT
const plugin = process.env.PLUGIN_DIR
const { loadSnapshot } = await import("file://" + plugin + "/src/snapshot.js")

const io = {
  resolve: async path => {
    try { return realpathSync(path) } catch { return path }
  },
  readText: async path => {
    try { return readFileSync(path, "utf8") } catch { return "" }
  },
  exists: async path => existsSync(path),
  gitLines: async (args, cwd) => {
    try {
      return String(execFileSync("git", args, { cwd, encoding: "utf8" })).split("\n").filter(line => line.trim() !== "")
    } catch { return [] }
  },
}
const snapshot = await loadSnapshot(io, project)
const problems = []
if (!snapshot.hasMeasure) problems.push("hasMeasure is false")
if (snapshot.parseError !== null) problems.push("parseError: " + String(snapshot.parseError))
if (snapshot.active?.entry?.id !== "rehearsal_20260101") problems.push("active track: " + String(snapshot.active?.entry?.id))
const tasks = snapshot.active?.plan?.phases?.flatMap(phase => phase.tasks) ?? []
if (tasks.filter(task => task.marker === "~").length !== 1) problems.push("not exactly one [~] task")
if (problems.length > 0) {
  console.error(problems.join("; "))
  process.exit(1)
}
process.stdout.write("rehearsal fixture snapshot ok\n")
')"
[[ "$OUT" == *"rehearsal fixture snapshot ok"* ]] || fail "the snapshot loader rejected the fixture: $OUT"
echo "[PASS] the fixture is a valid, active Measure project"

BEFORE="$(ls -d "$PROJECT" 2>/dev/null || true)"
"$REHEARSAL" --cleanup "$PROJECT"
[[ -n "$BEFORE" ]] || fail "the fixture vanished before cleanup"
[[ ! -e "$PROJECT" ]] || fail "cleanup did not remove the fixture"
PROJECT=""
echo "[PASS] cleanup removes the fixture"

if "$REHEARSAL" --cleanup /; then fail "cleanup accepted a non-temp directory"; fi
echo "[PASS] cleanup refuses a non-temp directory"
