#!/usr/bin/env bash
# Adopt-matching: a local edit that already equals the source gets adopted.
set -euo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$HERE/../.." && pwd)"

W="$(mktemp -d -t measure-skill-adopt.XXXXXX)"
cleanup() {
  chmod -R u+rwX -- "$W" 2>/dev/null || true
  rm -rf -- "$W"
}
trap cleanup EXIT

export HOME="$W/home"
mkdir -p -- "$HOME"
REPO="$W/repo"
DEST="$HOME/.claude/skills/demo"
INSTALLER="$REPO/bin/install-measure-skill"

fail() {
  echo "[FAIL] test-skill-adopt.sh: $*" >&2
  exit 1
}

mkdir -p -- "$REPO/bin" "$REPO/skills/demo"
cp -- "$ROOT/bin/install-measure-skill" "$INSTALLER"
chmod 755 -- "$INSTALLER"
printf 'skills/demo\t~/.claude/skills/demo\t*\n' >"$REPO/bin/install-targets.tsv"
mkdir -p -- "$HOME/.claude/skills"
printf '# Demo skill\n' >"$REPO/skills/demo/SKILL.md"
git -C "$REPO" init -q
git -C "$REPO" add -A
git -C "$REPO" -c user.email=t@example.com -c user.name=t commit -qm fixture
ref1="$(git -C "$REPO" rev-parse HEAD)"

run_install() { # ref [extra...]
  local ref="$1"; shift
  set +e
  OUT="$(bash "$INSTALLER" --ref "$ref" "$@" 2>&1)"; RC="$?"
  set -e
}

run_check() { # ref
  set +e
  OUT="$(bash "$INSTALLER" --ref "$1" --check 2>&1)"; RC="$?"
  set -e
}

# 1. First install writes the stamp.
run_install "$ref1"
[[ "$RC" == 0 ]] || fail "first install exit $RC: $OUT"
[[ -f "$DEST/SKILL.md" ]] || fail "SKILL.md missing"

# 2. A local edit that differs from the source stays kept.
printf '# local v1\n' >>"$DEST/SKILL.md"
run_install "$ref1"
[[ "$RC" == 2 ]] || fail "differing edit exit $RC, want 2: $OUT"
grep -q 'warn: local-edit' <<<"$OUT" || fail "missing local-edit warn: $OUT"
grep -q '^written=.* kept=1' <<<"$OUT" || fail "kept is not 1: $OUT"
grep -q 'local v1' "$DEST/SKILL.md" || fail "differing edit was lost"
old_hash="$(sha256sum -- "$REPO/skills/demo/SKILL.md" | cut -d' ' -f1)"
grep -q "^file $old_hash  SKILL.md$" "$DEST/.measure-install" || fail "stamp moved for a differing edit"

# 3. --check reports the differing edit with a hint that names the flag.
run_check "$ref1"
[[ "$RC" == 1 ]] || fail "check differing exit $RC, want 1: $OUT"
grep -q '^local-edit ' <<<"$OUT" || fail "check lacks local-edit: $OUT"
grep -q -- '--adopt-matching' <<<"$OUT" || fail "check hint lacks the flag: $OUT"
grep -qi 'fold' <<<"$OUT" || fail "check hint lacks fold: $OUT"

# 4. --adopt-matching keeps a differing edit too.
run_install "$ref1" --adopt-matching
[[ "$RC" == 2 ]] || fail "adopt-matching differing exit $RC, want 2: $OUT"
grep -q 'local v1' "$DEST/SKILL.md" || fail "adopt-matching overwrote a differing edit"

# 5. The source moves to match the local edit; a plain install adopts it.
printf '# local v1\n' >>"$REPO/skills/demo/SKILL.md"
git -C "$REPO" add -A
git -C "$REPO" -c user.email=t@example.com -c user.name=t commit -qm match
ref2="$(git -C "$REPO" rev-parse HEAD)"
run_install "$ref2"
[[ "$RC" == 0 ]] || fail "matching install exit $RC, want 0: $OUT"
grep -q '^adopted ' <<<"$OUT" || fail "missing adopted line: $OUT"
new_hash="$(sha256sum -- "$REPO/skills/demo/SKILL.md" | cut -d' ' -f1)"
grep -q "^file $new_hash  SKILL.md$" "$DEST/.measure-install" || fail "stamp did not adopt the source hash"
cmp -s "$REPO/skills/demo/SKILL.md" "$DEST/SKILL.md" || fail "adopted file differs from source"

# 6. --check is clean after the adopt.
run_check "$ref2"
[[ "$RC" == 0 ]] || fail "check after adopt exit $RC: $OUT"

# 7. --adopt-matching adopts a matching edit as well.
printf '# local v2\n' >>"$DEST/SKILL.md"
printf '# local v2\n' >>"$REPO/skills/demo/SKILL.md"
git -C "$REPO" add -A
git -C "$REPO" -c user.email=t@example.com -c user.name=t commit -qm match2
ref3="$(git -C "$REPO" rev-parse HEAD)"
run_install "$ref3" --adopt-matching
[[ "$RC" == 0 ]] || fail "adopt-matching matching exit $RC: $OUT"
grep -q '^adopted ' <<<"$OUT" || fail "adopt-matching lacks adopted: $OUT"

echo "[PASS] test-skill-adopt.sh"
