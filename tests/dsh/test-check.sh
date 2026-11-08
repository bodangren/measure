#!/usr/bin/env bash
# Task 1.3: --check, its eight items, every red case, and the exact JSON shape.
set -euo pipefail
source "$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)/lib.sh"
world_init

run install --ref t
assert_rc 0
GOOD_PATCH="$W/patch.good"
cp -- "$PATCH" "$GOOD_PATCH"

check() { run --check --dsh-home "$DSH_HOME" --profile web --project "$W/project" "$@"; }
reinstall() {
  run install --no-skills
  assert_rc 0
}
restore_patch() { cp -- "$GOOD_PATCH" "$PATCH"; }

# 1. Green after install: every item, in the design order, and no write.
before="$(profile_fingerprint)"
check
assert_rc 0
assert_out '^PASS dsh-install:'
assert_out '^PASS node:'
assert_out '^PASS skill-measure:.*root .*\.agents/skills/measure'
assert_out '^PASS skill-orchestrator:.*root .*\.agents/skills/measure-orchestrator'
assert_out '^PASS plugin:'
assert_out '^PASS record:.*mode guard'
assert_out '^PASS foreign-row:'
assert_out '^SKIP live:'
assert_not_out '^FAIL '
assert_eq "$(profile_fingerprint)" "$before"

# 1b. A generated __pycache__ in the repository skill source is not part of the
# installed copy (the installer copies tracked files from the ref), so --check stays green.
mkdir -p "$SKILL_SRC/measure-orchestrator/scripts/__pycache__"
printf 'x' >"$SKILL_SRC/measure-orchestrator/scripts/__pycache__/x.pyc"
check
assert_rc 0
assert_out '^PASS skill-orchestrator:'
assert_not_out '^FAIL skill-orchestrator'
rm -rf "$SKILL_SRC/measure-orchestrator/scripts/__pycache__"

# 2. --json prints exactly the documented object and element schema.
check --json
assert_rc 0
assert_not_out '^PASS '
printf '%s' "$OUT" | node -e '
const chunks = []
process.stdin.on("data", c => chunks.push(c))
process.stdin.on("end", () => {
  const bad = m => { console.error("json: " + m); process.exit(1) }
  let j
  try { j = JSON.parse(chunks.join("")) } catch (e) { bad("not JSON: " + e.message) }
  if (JSON.stringify(Object.keys(j)) !== JSON.stringify(["ok", "mode", "items", "actions"])) bad("top-level keys")
  if (j.ok !== true) bad("ok must be true")
  if (j.mode !== "check") bad("mode must be check")
  if (!Array.isArray(j.actions) || j.actions.length !== 0) bad("actions must be an empty array")
  const order = ["dsh-install", "node", "skill-measure", "skill-orchestrator", "plugin", "record", "foreign-row", "live"]
  if (!Array.isArray(j.items) || j.items.length !== order.length) bad("items length")
  j.items.forEach((it, i) => {
    if (JSON.stringify(Object.keys(it)) !== JSON.stringify(["item", "status", "detail"])) bad("item keys at " + i)
    if (it.item !== order[i]) bad("item order at " + i + ": " + it.item)
    if (!["PASS", "FAIL", "WARN", "SKIP"].includes(it.status)) bad("status at " + i)
    if (typeof it.detail !== "string" || it.detail.length === 0) bad("detail at " + i)
  })
  if (j.items[7].status !== "SKIP") bad("live must SKIP without --live")
})
' || fail "--json does not match the exact schema"

# 3a. Missing plugin copy.
mv -- "$PLUGIN_DST" "$W/plugin.saved"
check
assert_rc 1
assert_out '^FAIL plugin:.*missing'
mv -- "$W/plugin.saved" "$PLUGIN_DST"

# 3b. A missing install stamp.
rm -f -- "$PLUGIN_DST/.measure-dsh-install"
check
assert_rc 1
assert_out '^FAIL plugin:.*stamp'
reinstall

# 3c. A stale stamped file (the source moved on, the copy did not).
printf '\n# source moved on\n' >>"$PLUGIN_SRC/README.md"
check
assert_rc 1
assert_out '^FAIL plugin:.*stale.*README\.md'
reinstall

# 3d. A stamped file that is missing from the copy.
rm -f -- "$PLUGIN_DST/client.js"
check
assert_rc 1
assert_out '^FAIL plugin:.*client\.js'
reinstall

# 3e. A locally edited copy file is a WARN, not a failure.
printf '\n// local edit\n' >>"$PLUGIN_DST/index.js"
check
assert_rc 0
assert_out '^WARN plugin:.*edited.*index\.js'
cp -- "$PLUGIN_SRC/index.js" "$PLUGIN_DST/index.js"
reinstall

# 3f. A copied file the stamp omits is an untracked-leftover WARN.
grep -v '  README\.md$' "$PLUGIN_DST/.measure-dsh-install" >"$W/stamp.new"
mv -- "$W/stamp.new" "$PLUGIN_DST/.measure-dsh-install"
check
assert_rc 0
assert_out '^WARN plugin:.*unstamped.*README\.md'
reinstall

# 4. Missing managed block.
: >"$PATCH"
check
assert_rc 1
assert_out '^FAIL record:.*no managed block'
restore_patch

# 5. Two managed blocks.
{ cat -- "$GOOD_PATCH"; cat -- "$GOOD_PATCH"; } >"$PATCH"
check
assert_rc 1
assert_out '^FAIL record:.*more than one managed block'
restore_patch

# 6. An incomplete skill copy names the missing files.
rm -f -- "$HOME/.agents/skills/measure/references/implement.md" \
  "$HOME/.agents/skills/measure/references/review.md" \
  "$HOME/.agents/skills/measure/assets/workflow.md"
check
assert_rc 1
assert_out '^FAIL skill-measure:.*references/implement\.md'
assert_out '^FAIL skill-measure:.*references/review\.md'
assert_out '^FAIL skill-measure:.*assets/workflow\.md'
cp -R -- "$SKILL_SRC/measure/." "$HOME/.agents/skills/measure/"

# 6b. No installed root at all is also a failure.
mv -- "$HOME/.agents/skills/measure" "$HOME/.agents/skills/measure.saved"
mv -- "$HOME/.claude/skills/measure" "$HOME/.claude/skills/measure.saved"
check
assert_rc 1
assert_out '^FAIL skill-measure:.*no installed'
mv -- "$HOME/.agents/skills/measure.saved" "$HOME/.agents/skills/measure"
mv -- "$HOME/.claude/skills/measure.saved" "$HOME/.claude/skills/measure"

# 7. An invalid mode in the record fails.
sed -i 's/mode: guard/mode: nope/' "$PATCH"
check
assert_rc 1
assert_out '^FAIL record:.*mode'
restore_patch

# 8. --mode is compared with the record; without it the found mode is reported.
check --mode strict
assert_rc 1
assert_out '^FAIL record:.*strict'
check --mode guard
assert_rc 0
assert_out '^PASS record:.*mode guard'

# 9. A module that does not export the three names fails the plugin item.
BROKEN="$W/broken-plugin"
cp -R -- "$PLUGIN_SRC" "$BROKEN"
cat >"$BROKEN/index.js" <<'JS'
export const name = 'not-measure-guard'
export const inject = []
export function apply() {}
JS
run install --source "$BROKEN" --no-skills
assert_rc 0
check --source "$BROKEN"
assert_rc 1
assert_out '^FAIL plugin:.*module'
reinstall
check
assert_rc 0

# 10. live SKIPs without --live and again without a session id; the hint names
#     both sources of the id.
check
assert_rc 0
assert_out '^SKIP live:.*--live'
check --live
assert_rc 0
assert_out '^SKIP live:.*--session'
assert_out '^SKIP live:.*DSH_SESSION_ID'

# 11. A missing or non-package --source makes the plugin item SKIP, not fail.
check --source "$W/no-such-plugin"
assert_rc 0
assert_out '^SKIP plugin:.*source'
assert_not_out '^FAIL '
mkdir -p -- "$W/empty-plugin"
check --source "$W/empty-plugin"
assert_rc 0
assert_out '^SKIP plugin:.*source'

# 12. The check honours a different agents home.
run install --no-skills
assert_rc 0
mkdir -p -- "$W/other-agents/skills"
cp -R -- "$HOME/.agents/skills/measure" "$W/other-agents/skills/measure"
cp -R -- "$HOME/.agents/skills/measure-orchestrator" "$W/other-agents/skills/measure-orchestrator"
set +e
OUT="$(DSH_AGENTS_HOME="$W/other-agents" "$RUN" --check --dsh-home "$DSH_HOME" --profile web --project "$W/project" 2>&1)"
RC=$?
set -e
assert_rc 0
assert_out "^PASS skill-measure:.*root $W/other-agents/skills/measure"

# 13. A missing profile is an environment error (3), with the item still FAIL.
run --check --dsh-home "$W/no-such-dsh" --profile web --project "$W/project"
assert_rc 3
assert_out '^FAIL dsh-install:.*does not exist'

echo "[PASS] test-check.sh"
