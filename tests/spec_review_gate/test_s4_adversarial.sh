#!/usr/bin/env bash
# S4 adversarial tests: the A11 recipe (doc-to-code drift) of the anti-pattern catalog.
# The suite extracts the bash block of the A11 entry from
# skills/measure-orchestrator/references/anti-pattern-catalog.md, checks that
# measure/anti-patterns.md holds the same block, and runs it with plain `bash` in a fixture
# folder under a checked `mktemp -d` folder. Each fixture folder holds its own copies of
# measure/product.md and measure/tech-stack.md, so no result depends on the drift of this
# repository.
# "Contract" rows assert the exact exit code, the exact candidate lines, and an empty stderr.
# "Report" rows assert only exit 0 or 1, no hang, and no new file; they print the output.
# The safety group requires that no run creates a file and that no PWNED marker appears.
# The time group requires that 10,000 path claims end in less than 5 seconds.
# The sensitivity group runs the Contract rows against broken copies of the recipe; each copy
# must fail at least one Contract row (A4).
# Fixture rules: explicit subprocess environment, no write in the real repository.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CATALOG="$ROOT/skills/measure-orchestrator/references/anti-pattern-catalog.md"
PROJECT_CATALOG="$ROOT/measure/anti-patterns.md"

TMP="$(mktemp -d)" || TMP=""
if [ -z "$TMP" ] || [ ! -d "$TMP" ]; then
  echo "FAIL: mktemp -d failed; no fixture can be built"
  echo "=== Total: 1 checks (PASS=0, FAIL=1) ==="
  exit 1
fi
trap 'rm -rf "$TMP"' EXIT

for f in "$CATALOG" "$PROJECT_CATALOG"; do
  if [ ! -f "$f" ]; then
    echo "FAIL: catalog not found: $f"
    echo "=== Total: 1 checks (PASS=0, FAIL=1) ==="
    exit 1
  fi
done

env -i PATH="${PATH:-/usr/bin:/bin}" HOME=/nonexistent-home-for-test LC_ALL=C.UTF-8 \
  python3 -I - "$CATALOG" "$PROJECT_CATALOG" "$TMP" "$ROOT" <<'PY'
import os
import re
import stat
import subprocess
import sys
import time
from pathlib import Path

CATALOG = Path(sys.argv[1])
PROJECT_CATALOG = Path(sys.argv[2])
TMP = Path(sys.argv[3])
ROOT = Path(sys.argv[4])
HEADING = "## A11 — Doc-to-code drift after closeout"
P = "measure/product.md"
T = "measure/tech-stack.md"
NODOC = "DRIFT candidate: the document does not exist"
TIME_LIMIT = 5.0
RUN_TIMEOUT = 10

total = 0
passed = 0
failed = []


def record(label, ok, detail=""):
    global total, passed
    total += 1
    if ok:
        passed += 1
        print(f"PASS: {label}")
    else:
        failed.append(label)
        print(f"FAIL: {label} -- {detail}")


def a11_recipe(path):
    """The lines between the first ```bash line after the A11 heading and the next ``` line."""
    lines = path.read_text(encoding="utf-8").splitlines()
    try:
        start = lines.index(HEADING)
    except ValueError:
        return ""
    body = []
    inside = False
    for ln in lines[start + 1:]:
        if not inside:
            if ln.startswith("## ") or ln == "---":
                return ""
            if ln == "```bash":
                inside = True
            continue
        if ln == "```":
            return "\n".join(body) + "\n"
        body.append(ln)
    return ""


def env():
    return {"PATH": os.environ.get("PATH", "/usr/bin:/bin"), "HOME": "/nonexistent-home-for-test",
            "LC_ALL": "C.UTF-8"}


def tree(base):
    out = set()
    for dirpath, dirnames, filenames in os.walk(base, followlinks=False):
        for n in dirnames + filenames:
            out.add(os.path.join(dirpath, n))
    return out


def run_recipe(recipe_file, cwd, opts=(), timeout=RUN_TIMEOUT):
    """Run the recipe with bash in cwd. Return (rc, stdout, stderr, seconds); rc None on timeout."""
    t0 = time.monotonic()
    try:
        r = subprocess.run(["bash", *opts, str(recipe_file)], cwd=cwd, env=env(),
                           stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                           timeout=timeout)
        rc, out, err = r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired as exc:
        rc, out, err = None, exc.stdout or b"", exc.stderr or b""
    return rc, out.decode("utf-8", "replace"), err.decode("utf-8", "replace"), time.monotonic() - t0


case_no = 0


def make_case(product=None, tech=b"", files=(), dirs=(), setup=None):
    """A fixture folder. product/tech: bytes, or None for a missing document."""
    global case_no
    case_no += 1
    case = TMP / "cases" / f"c{case_no:03d}"
    (case / "measure").mkdir(parents=True)
    for d in dirs:
        (case / d).mkdir(parents=True, exist_ok=True)
    for f in files:
        (case / f).parent.mkdir(parents=True, exist_ok=True)
        (case / f).write_bytes(b"x\n")
    if product is not None:
        (case / P).write_bytes(product)
    if tech is not None:
        (case / T).write_bytes(tech)
    if setup:
        setup(case)
    return case


# --- G1 extract -----------------------------------------------------------------------------
RECIPE = a11_recipe(CATALOG)
PROJECT_RECIPE = a11_recipe(PROJECT_CATALOG)
record("G1 extract: the A11 bash block of the skills catalog is non-empty", bool(RECIPE.strip()), "empty extract")
record("G1 extract: measure/anti-patterns.md holds a non-empty A11 bash block", bool(PROJECT_RECIPE.strip()),
       "empty extract")
record("G1 extract: both A11 bash blocks are the same", bool(RECIPE.strip()) and RECIPE == PROJECT_RECIPE,
       "the blocks differ")
if not RECIPE.strip():
    print(f"=== Total: {total} checks (PASS={passed}, FAIL={len(failed)}) ===")
    sys.exit(1)
RECIPE_FILE = TMP / "recipe.sh"
RECIPE_FILE.write_text(RECIPE, encoding="utf-8")
r = subprocess.run(["bash", "-n", str(RECIPE_FILE)], env=env(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
record("G1 extract: bash -n accepts the recipe", r.returncode == 0, r.stderr.decode("utf-8", "replace"))

# --- Contract rows --------------------------------------------------------------------------
def dir_doc(case):
    (case / P).mkdir()


def unreadable_product(case):
    """make_case wrote product.md; make it unreadable for this process."""
    os.chmod(case / P, 0)


# (id, label, case factory, expected exit, expected stdout lines)
CONTRACT = [
    ("existing", "a backtick path that exists gives no line",
     lambda: make_case(b"See `src/a.txt` for the code.\n", files=["src/a.txt"]), 0, []),
    ("existing_dir", "a backtick folder that exists gives no line",
     lambda: make_case(b"Folder `src/` and `src/lib/`.\n", dirs=["src/lib"]), 0, []),
    ("missing", "a backtick path that does not exist gives one line",
     lambda: make_case(b"See `src/missing.txt`.\n"), 0, [f"{P}: DRIFT candidate: src/missing.txt does not exist"]),
    ("tech_missing", "a missing path in tech-stack.md gives one line with the tech-stack.md prefix",
     lambda: make_case(b"", tech=b"Uses `lib/gone.js`.\n"), 0, [f"{T}: DRIFT candidate: lib/gone.js does not exist"]),
    ("both_docs", "missing paths in both documents give lines in document order",
     lambda: make_case(b"`zz/p.txt`\n", tech=b"`aa/t.txt`\n"), 0,
     [f"{P}: DRIFT candidate: zz/p.txt does not exist", f"{T}: DRIFT candidate: aa/t.txt does not exist"]),
    ("dedupe_sort", "a repeated missing path gives one line, and the lines are sorted",
     lambda: make_case(b"`b/2.txt` and `a/1.txt`\nagain `b/2.txt`\n"), 0,
     [f"{P}: DRIFT candidate: a/1.txt does not exist", f"{P}: DRIFT candidate: b/2.txt does not exist"]),
    ("dotdot_present", "a path with '..' to a file that exists gives no line",
     lambda: make_case(b"`../../present.txt`\n", setup=lambda c: (c.parent.parent / "present.txt").write_bytes(b"x")),
     0, []),
    ("dotdot_absent", "a path with '..' to a file that does not exist gives one line",
     lambda: make_case(b"`../absent_zz.txt`\n"), 0, [f"{P}: DRIFT candidate: ../absent_zz.txt does not exist"]),
    ("no_product", "a missing product.md gives exit 0 and exactly one line",
     lambda: make_case(None), 0, [f"{P}: {NODOC}"]),
    ("no_tech", "a missing tech-stack.md gives exit 0 and exactly one line",
     lambda: make_case(b"", tech=None), 0, [f"{T}: {NODOC}"]),
    ("no_docs", "both documents missing give exit 0 and two lines",
     lambda: make_case(None, tech=None), 0, [f"{P}: {NODOC}", f"{T}: {NODOC}"]),
    ("no_product_tech_claim", "a missing product.md does not hide a candidate of tech-stack.md",
     lambda: make_case(None, tech=b"`x/y.z`\n"), 0, [f"{P}: {NODOC}", f"{T}: DRIFT candidate: x/y.z does not exist"]),
    ("empty", "an empty document gives no line",
     lambda: make_case(b"", tech=b""), 0, []),
    ("space", "a backtick path with a space is checked like any other path",
     lambda: make_case(b"See `src/a b.txt`.\n"), 0, [f"{P}: DRIFT candidate: src/a b.txt does not exist"]),
    ("space_existing", "an existing backtick path with a space gives no line",
     lambda: make_case(b"See `src/a b.txt`.\n", files=["src/a b.txt"]), 0, []),
    ("trailing_extra", "a span with characters after the path is not a path claim",
     lambda: make_case(b"See `src/a.txt:tag`.\n", files=["src/a.txt"]), 0, []),
    ("nul_missing", "a NUL byte in the document does not hide a missing claim",
     lambda: make_case(b"caf\x00\n`src/nul_zz.txt`\n"), 0, [f"{P}: DRIFT candidate: src/nul_zz.txt does not exist"]),
    ("nul_existing", "a NUL byte in the document does not hide an existing claim",
     lambda: make_case(b"caf\x00\n`src/nul_ok.txt`\n", files=["src/nul_ok.txt"]), 0, []),
    ("nonutf8_missing", "invalid UTF-8 bytes do not hide an ASCII missing claim",
     lambda: make_case(b"`src/\xff\xfe.txt` caf\xe9\n`src/ascii_zz.txt`\n"), 0,
     [f"{P}: DRIFT candidate: src/ascii_zz.txt does not exist"]),
    ("dir_document", "a document path that is a directory gives the not-a-regular-file line",
     lambda: make_case(None, setup=dir_doc), 0, [f"{P}: DRIFT candidate: the document is not a regular file"]),
    ("unreadable_document", "an unreadable document gives the cannot-be-read line",
     lambda: make_case(b"", setup=unreadable_product), 0, [f"{P}: DRIFT candidate: the document cannot be read"]),
    ("command", "a backtick command such as `git log` gives no line",
     lambda: make_case(b"Run `git log` and `bash measure/generate.sh`.\n"), 0, []),
    ("no_slash", "a backtick word without '/' gives no line",
     lambda: make_case(b"The `README` and `node.json` and `status` fields.\n"), 0, []),
]

CONTRACT_CASES = {}


def contract_results(recipe_file, stop_on_fail=False):
    res = []
    for cid, label, factory, exp_rc, exp_lines in CONTRACT:
        case = CONTRACT_CASES.get(cid)
        if case is None:
            case = CONTRACT_CASES[cid] = factory()
        rc, out, err, _s = run_recipe(recipe_file, case)
        lines = out.splitlines()
        ok = rc == exp_rc and lines == exp_lines and err == ""
        res.append((cid, label, ok, f"rc={rc} stdout={lines!r} stderr={err!r}"))
        if stop_on_fail and not ok:
            break
    return res


for cid, label, ok, detail in contract_results(RECIPE_FILE):
    record(f"G2 contract: {label}", ok, detail)

# --- Report rows ------------------------------------------------------------------------------
def fifo(case):
    os.mkfifo(case / P)




def link_file(case):
    (case / "real.md").write_bytes(b"`gone/x.txt`\n")
    os.symlink("../real.md", case / P)


def link_zero(case):
    os.symlink("/dev/zero", case / P)


def link_dangling(case):
    os.symlink("../nothing-here.md", case / P)


def link_dir(case):
    os.symlink("/", case / P)




HOSTILE = (b"`src/$(touch PWNED)` `$(touch PWNED)/x` `src/x;touch PWNED`\n"
           b"`src/a|touch PWNED` `src/a&&touch PWNED` `src/`touch PWNED`/x`\n"
           b"`src/\x1b[31mred` `src/\x1bx/y`\n"
           b"`src/split\nacross.txt`\n")
REPORT = [
    ("hostile text: $(...), a backtick split, ';', '|', '&&', ESC bytes", lambda: make_case(HOSTILE), ()),
    ("CRLF line ends", lambda: make_case(b"`src/crlf.txt`\r\n`src/a.txt\r`\r\n", files=["src/a.txt"]), ()),
    ("a path that starts with '-'", lambda: make_case(b"`-rf/x` `--help/x` `-e/x`\n"), ()),
    ("an absolute path such as /etc/x", lambda: make_case(b"`/etc/x` `/nonexistent/zz`\n"), ()),
    ("a glob such as tests/*.sh", lambda: make_case(b"`tests/*.sh` `src/?.txt`\n"), ()),
    ("a fenced code block with three backticks",
     lambda: make_case(b"```bash\nls src/fenced.txt\n```\n`src/after.txt`\n"), ()),
    # A NUL byte makes grep print 'binary file matches' and hide each claim (finding F1, Nit).
    ("a NUL byte", lambda: make_case(b"caf\x00\n`src/ok_zz.txt`\n"), ()),
    ("non-UTF-8 bytes", lambda: make_case(b"`src/\xff\xfe.txt` caf\xe9\n`src/ok_zz.txt`\n"), ()),
    ("a document path that is a folder", lambda: make_case(None, setup=dir_doc), ()),
    ("a document path that is a FIFO", lambda: make_case(None, setup=fifo), ()),
    ("a document path that is a symbolic link to a file", lambda: make_case(None, setup=link_file), ()),
    ("a document path that is a symbolic link to /dev/zero", lambda: make_case(None, setup=link_zero), ()),
    ("a document path that is a dangling symbolic link", lambda: make_case(None, setup=link_dangling), ()),
    ("a document path that is a symbolic link to a folder", lambda: make_case(None, setup=link_dir), ()),
    ("bash -o pipefail: a missing document", lambda: make_case(None, tech=None), ("-o", "pipefail")),
    ("bash -o pipefail: an empty document", lambda: make_case(b"", tech=b""), ("-o", "pipefail")),
    ("bash -o pipefail: one missing path", lambda: make_case(b"`src/missing.txt`\n", tech=b"`src/m2.txt`\n"),
     ("-o", "pipefail")),
    ("bash -o pipefail: a path that exists", lambda: make_case(b"`src/a.txt`\n", tech=b"`src/a.txt`\n",
                                                                files=["src/a.txt"]), ("-o", "pipefail")),
]

for label, factory, opts in REPORT:
    case = factory()
    before = tree(TMP)
    rc, out, err, secs = run_recipe(RECIPE_FILE, case, opts, timeout=5)
    after = tree(TMP)
    new = sorted(after - before)
    print(f"  report [{label}]: rc={rc} {secs:.2f}s stdout={out.splitlines()!r} stderr={err.strip()[:200]!r}")
    record(f"G3 report: {label}: exit 0 or 1, no hang", rc in (0, 1), f"rc={rc}")
    record(f"G3 report: {label}: no file created", not new, ", ".join(new[:5]))

# --- G4 safety ------------------------------------------------------------------------------
def git_status():
    r = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all"], cwd=ROOT, env=env(),
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return r.returncode, r.stdout


rc0, status0 = git_status()
before = tree(TMP)
for cid in CONTRACT_CASES:
    run_recipe(RECIPE_FILE, CONTRACT_CASES[cid])
for label, factory, opts in REPORT[:3]:
    run_recipe(RECIPE_FILE, factory(), opts, timeout=5)
cases_after_factories = tree(TMP)
markers = [p for p in tree(TMP) if os.path.basename(p) == "PWNED"]
for base in (ROOT, TMP.parent, Path.cwd()):
    if (base / "PWNED").exists():
        markers.append(str(base / "PWNED"))
record("G4 safety: no PWNED marker appears in the fixtures, the repository, or the temp parent", not markers,
       ", ".join(markers))
# New entries come only from the three new fixture folders, not from a recipe run.
extra = sorted(p for p in cases_after_factories - before if not re.search(r"/cases/c\d{3}(/|$)", p))
record("G4 safety: no run creates a file outside its fixture folders", not extra, ", ".join(extra[:5]))
# Each fixture folder holds only the files that its factory made: rerun one case and compare.
probe_case = make_case(HOSTILE)
snap = tree(probe_case)
run_recipe(RECIPE_FILE, probe_case)
record("G4 safety: a hostile run adds no file in its fixture folder", tree(probe_case) == snap,
       ", ".join(sorted(tree(probe_case) - snap)))

# Live run in the repository root: read-only. Print the labeled count, do not assert the value.
rc, out, err, secs = run_recipe(RECIPE_FILE, ROOT)
live = out.splitlines()
print(f"A11 DRIFT candidates: {len(live)}")
record("G4 live: the recipe exits 0 in the repository root", rc == 0, f"rc={rc} stderr={err!r}")
record("G4 live: each output line holds 'DRIFT candidate:'", all("DRIFT candidate:" in ln for ln in live),
       repr(live[:3]))
rc1, status1 = git_status()
record("G4 live: git status of the repository does not change", rc0 == 0 and status0 == status1,
       f"before={status0[:200]!r} after={status1[:200]!r}")

# --- G5 time ----------------------------------------------------------------------------------
N = 10000
big = "".join(f"Claim `big/d{i % 100}/f{i}.txt` here.\n" for i in range(N)).encode()
case = make_case(big, tech=big, dirs=["big/d0"])
rc, out, err, secs = run_recipe(RECIPE_FILE, case)
count = len(out.splitlines())
print(f"  time: {N} path claims in each document: {secs:.3f}s, candidate lines: {count}")
record(f"G5 time: {N} path claims in each document end in less than {TIME_LIMIT:.0f} seconds",
       rc == 0 and secs < TIME_LIMIT, f"rc={rc} seconds={secs:.3f}")
record("G5 time: the run gives exactly 20000 candidate lines", count == 2 * N, f"lines={count}")

# --- G6 sensitivity: broken copies of the recipe --------------------------------------------
MUTANTS = [
    ("no missing-document branch", 'if [ ! -e "$doc" ]; then', 'if false; then'),
    ("no continue after a missing document", 'does not exist"\n    continue', 'does not exist"'),
    ("grep -E loosened to '.'", "grep -E '^[A-Za-z0-9_.-]+/[A-Za-z0-9_./ -]*$'", "grep -E '.'"),
    ("no '/' in the regex", "grep -E '^[A-Za-z0-9_.-]+/[A-Za-z0-9_./ -]*$'", "grep -E '^[A-Za-z0-9_.-]+[A-Za-z0-9_./ -]*$'"),
    ("no '$' anchor in the regex", "[A-Za-z0-9_./ -]*$'", "[A-Za-z0-9_./ -]*'"),
    ("[ -e \"$p\" ] negated", '[ -e "$p" ] ||', '[ ! -e "$p" ] ||'),
    ("no tr -d of the backticks", "| tr -d '`' ", ""),
    ("sort -u replaced by cat", "| sort -u |", "| cat |"),
    ("only product.md in the loop", "for doc in measure/product.md measure/tech-stack.md; do",
     "for doc in measure/product.md; do"),
    ("a different candidate text", "$doc: DRIFT candidate: $p does not exist", "$doc: DRIFT: $p does not exist"),
    ("a different missing-document text", "the document does not exist\"", "missing\""),
    ("no grep -a (text mode)", "grep -ao -- ", "grep -o "),
    ("no space in the path pattern", "^[A-Za-z0-9_.-]+/[A-Za-z0-9_./ -]*$", "^[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]*$"),
    ("no not-a-regular-file branch", 'if [ ! -f "$doc" ]; then', 'if false; then'),
]

mdir = TMP / "mutants"
mdir.mkdir()
for i, (name, old, new) in enumerate(MUTANTS):
    if RECIPE.count(old) != 1:
        record(f"G6 sensitivity: mutant '{name}' applies once", False, f"count={RECIPE.count(old)}")
        continue
    path = mdir / f"m{i}.sh"
    path.write_text(RECIPE.replace(old, new), encoding="utf-8")
    res = contract_results(path, stop_on_fail=True)
    killed = [label for _c, label, ok, _d in res if not ok]
    record(f"G6 sensitivity: mutant '{name}' fails at least one Contract row", bool(killed),
           f"{len(res)} rows, 0 fail")
    if killed:
        print(f"  killed by: {killed[0]}")

print(f"=== Total: {total} checks (PASS={passed}, FAIL={len(failed)}) ===")
sys.exit(1 if failed else 0)
PY
rc=$?
exit "$rc"
