#!/usr/bin/env bash
# The real skill installer (bin/install-measure-skill): each file and the stamp are
# written through a sibling temporary file and renamed, so a failed write leaves the
# previous file intact instead of a truncated one. A read-only target folder makes the
# atomic path fail where an in-place writer would have succeeded (the file itself stays
# writable), and a normal install reproduces the source exactly.
set -euo pipefail

HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$HERE/../.." && pwd)"

W="$(mktemp -d -t measure-skill-install.XXXXXX)"
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
  echo "[FAIL] test-skill-install.sh: $*" >&2
  exit 1
}

mkdir -p -- "$REPO/bin" "$REPO/skills/demo/references"
cp -- "$ROOT/bin/install-measure-skill" "$INSTALLER"
chmod 755 -- "$INSTALLER"
printf 'skills/demo\t~/.claude/skills/demo\t*\n' >"$REPO/bin/install-targets.tsv"
mkdir -p -- "$HOME/.claude/skills"
printf '# Demo skill\n' >"$REPO/skills/demo/SKILL.md"
printf 'reference v1\n' >"$REPO/skills/demo/references/guide.md"
git -C "$REPO" init -q
git -C "$REPO" add -A
git -C "$REPO" -c user.email=t@example.com -c user.name=t commit -qm fixture
ref1="$(git -C "$REPO" rev-parse HEAD)"

install() { # ref
  bash "$INSTALLER" --ref "$1" >/dev/null 2>&1
}

# 1. A normal install reproduces the source and writes a complete stamp.
install "$ref1" || fail "the first install failed"
[[ -f "$DEST/SKILL.md" ]] || fail "SKILL.md was not installed"
[[ -f "$DEST/references/guide.md" ]] || fail "references/guide.md was not installed"
cmp -s "$REPO/skills/demo/SKILL.md" "$DEST/SKILL.md" || fail "SKILL.md differs from the source"
cmp -s "$REPO/skills/demo/references/guide.md" "$DEST/references/guide.md" || fail "guide.md differs from the source"
[[ -f "$DEST/.measure-install" ]] || fail "the stamp was not written"
grep -q '^# measure install stamp v1$' "$DEST/.measure-install" || fail "the stamp header is missing"
grep -q "^file $(sha256sum -- "$REPO/skills/demo/SKILL.md" | cut -d' ' -f1)  SKILL.md$" "$DEST/.measure-install" ||
  fail "the stamp lacks the SKILL.md hash"
! find "$DEST" -name 'measure-install.tmp*' -print -quit | grep -q . || fail "a temporary file was left after the install"

# 2. A changed source needs a write: in a read-only folder the atomic write cannot create
#    its sibling and fails, while an in-place `cat > file` would have succeeded.
printf 'reference v2\n' >"$REPO/skills/demo/references/guide.md"
git -C "$REPO" add -A
git -C "$REPO" -c user.email=t@example.com -c user.name=t commit -qm update
ref2="$(git -C "$REPO" rev-parse HEAD)"
find "$DEST" -type d -exec chmod a-w {} +
if install "$ref2"; then
  fail "the read-only folder install unexpectedly succeeded"
fi
find "$DEST" -type d -exec chmod u+w {} +
cmp -s "$REPO/skills/demo/references/guide.md" "$DEST/references/guide.md" && fail "the target was changed by the failed install"
cmp -s "$DEST/references/guide.md" <(printf 'reference v1\n') || fail "the failed install lost the previous content"
! find "$DEST" -name 'measure-install.tmp*' -print -quit | grep -q . || fail "a temporary file was left after the failure"

# 3. Restoring the folder lets the same install finish the update.
install "$ref2" || fail "the recovery install failed"
cmp -s "$REPO/skills/demo/references/guide.md" "$DEST/references/guide.md" || fail "the recovery did not install the new content"
! find "$DEST" -name 'measure-install.tmp*' -print -quit | grep -q . || fail "a temporary file was left after the recovery"

# 4. The stamp itself is replaced atomically: its content is complete and parseable.
grep -q "^ref .*$" "$DEST/.measure-install" || fail "the stamp lacks the ref line"
grep -q "^commit " "$DEST/.measure-install" || fail "the stamp lacks the commit line"
[[ "$(grep -c '^file ' "$DEST/.measure-install")" == "2" ]] || fail "the stamp does not list both files"

echo "[PASS] test-skill-install.sh"
