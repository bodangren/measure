import subprocess

# Negative-check forms under set -o pipefail. The text holds the needle on line 1 and is
# large, so grep -q exits early. Each form prints "fail" when it sees the needle (correct)
# and "pass" when it does not (a false pass for a negative check).
script = r'''
set -uo pipefail
big="NEEDLE"$'\n'"$(head -c 4000000 /dev/zero | tr '\0' 'x')"
empty=""
nl=$'\n'
r_old=0; r_new=0
for i in $(seq 1 200); do
  if printf '%s\n' "$big" | grep -qF -- NEEDLE; then :; else r_old=$((r_old+1)); fi
  if grep -qF -- NEEDLE <<< "$big"; then :; else r_new=$((r_new+1)); fi
done
echo "old form missed the needle in $r_old of 200 runs"
echo "new form missed the needle in $r_new of 200 runs"
# Edge cases: equal results for both forms
for v in "" "$nl" "a${nl}NEEDLE" "-NEEDLE" "NEEDLE${nl}"; do
  printf '%s\n' "$v" | grep -qxF -- NEEDLE; a=$?
  grep -qxF -- NEEDLE <<< "$v"; b=$?
  echo "value=$(printf %q "$v") old=$a new=$b"
done
grep -qF -- '' <<< ""; echo "empty pattern on empty text: $?"
'''
p = subprocess.run(["bash", "-c", script], text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=600)
print(p.stdout)
