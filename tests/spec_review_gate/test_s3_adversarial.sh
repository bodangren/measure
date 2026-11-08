#!/usr/bin/env bash
# S3 adversarial tests: the optional `dispositions:` line of a MEASURE_AGENT_RESULT block.
# The checker of the repository runs as a subprocess (`role-gate --role jr-green` unless a
# probe names another role) in a temporary git repository. Each probe writes the log as bytes.
# "Contract" probes assert the result that contracts.md `## Finding Dispositions`, the spec,
# or the dispositions_feedback docstring defines. "Report" probes assert only exit 0 or 1 with
# no Traceback, so a later fix of a reported item does not make this suite fail.
# The block range group holds durable regression tests for the final block range rule.
# The time group requires each run to end in less than 5 seconds.
# The sensitivity group runs the probes against broken copies of the checker; each copy
# must fail at least one probe (A4).
# Fixture rules: explicit subprocess environment, GIT_CONFIG_GLOBAL=/dev/null,
# GIT_CONFIG_NOSYSTEM=1, no inherited gate variable, no write in the real repository.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CHECKER="$ROOT/skills/measure-orchestrator/scripts/measure_interphase_checks.py"

TMP="$(mktemp -d)" || TMP=""
if [ -z "$TMP" ] || [ ! -d "$TMP" ]; then
  echo "FAIL: mktemp -d failed; no fixture can be built"
  echo "=== Total: 1 checks (PASS=0, FAIL=1) ==="
  exit 1
fi
trap 'rm -rf "$TMP"' EXIT

if [ ! -f "$CHECKER" ]; then
  echo "FAIL: checker not found: $CHECKER"
  echo "=== Total: 1 checks (PASS=0, FAIL=1) ==="
  exit 1
fi

env -i PATH="${PATH:-/usr/bin:/bin}" HOME=/nonexistent-home-for-test LC_ALL=C.UTF-8 \
  GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_CEILING_DIRECTORIES="$TMP" \
  python3 -I - "$CHECKER" "$TMP" "$ROOT" <<'PY'
import os
import re
import subprocess
import sys
import time
from pathlib import Path

CHECKER = Path(sys.argv[1])
TMP = Path(sys.argv[2])
ROOT = Path(sys.argv[3])
TRACK = "demo_track"
PHASE = "Phase S1: Fixture"
PASS_LINE = "PASS: jr-green gate passed"
INVALID = "invalid dispositions line"
MISSING = "missing MEASURE_AGENT_RESULT block"
GIT_ID = ["-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false"]
START = "MEASURE_AGENT_RESULT"
END = "END_MEASURE_AGENT_RESULT"
BAD = "dispositions: F1=bad"
BLOCK_LINES = [
    START, "role: jr-green", "status: complete", f"track: {TRACK}", f"phase: {PHASE}",
    "commits: abc1234", "tests_run: true: pass", "files_changed: src.txt", "plan_updates: none",
    "known_failures: none", "handoff: none",
]
TIME_LIMIT = 5.0


def base_env(extra=None):
    env = {
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
        "HOME": "/nonexistent-home-for-test",
        "LC_ALL": "C.UTF-8",
        "GIT_CONFIG_GLOBAL": "/dev/null",
        "GIT_CONFIG_NOSYSTEM": "1",
        "GIT_CEILING_DIRECTORIES": str(TMP),
        "PYTHONDONTWRITEBYTECODE": "1",
    }
    if extra:
        env.update(extra)
    return env


def git(repo, *args):
    r = subprocess.run(["git", *GIT_ID, *args], cwd=repo, env=base_env(),
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if r.returncode != 0:
        raise RuntimeError(f"git {args} failed: {r.stdout!r}")
    return r.stdout.decode("utf-8", "replace")


# One fixture repository: plan phase with one [x] task with a SHA, and a second commit.
REPO = TMP / "repo"
for rel, text in [("measure/index.md", "# Measure\n"), ("measure/tracks.md", "# Tracks\n"),
                  (f"measure/tracks/{TRACK}/plan.md",
                   f"# Plan\n\n## {PHASE}\n\n- [x] Task 1.1: Fixture task abc1234\n")]:
    p = REPO / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
git(REPO, "init", "-q")
git(REPO, "add", "-A")
git(REPO, "commit", "-q", "-m", "fixture")
BASELINE = git(REPO, "rev-parse", "HEAD").strip()
(REPO / "src.txt").write_text("green change\n", encoding="utf-8")
git(REPO, "add", "src.txt")
git(REPO, "commit", "-q", "-m", "green change")
LOGS = TMP / "logs"
LOGS.mkdir()


def blk(*extra):
    return [*BLOCK_LINES, *extra, END]


def enc(lines, eol="\n"):
    return (eol.join(lines) + eol).encode("utf-8")


class Killed(BaseException):
    """Stops a sensitivity run at the first failed probe."""


class Probes:
    def __init__(self, checker, only=None, timeout=120, stop_on_fail=False):
        self.checker = checker
        self.stop_on_fail = stop_on_fail
        self.only = only
        self.timeout = timeout
        self.results = []
        self.reports = []
        self.n = 0

    def check(self, group, label, ok, detail=""):
        self.results.append((group, f"{group}: {label}", bool(ok), detail))
        if self.stop_on_fail and not ok:
            raise Killed()

    def gate(self, log_arg, role="jr-green", extra_env=None, args=()):
        cmd = [sys.executable, "-I", str(self.checker), "role-gate", "--repo", str(REPO), "--role", role,
               "--track", TRACK, "--phase", PHASE, "--baseline", BASELINE, "--log-file", str(log_arg), *args]
        env = base_env({"GREEN_TEST_COMMAND": "true"} if extra_env is None else extra_env)
        t0 = time.monotonic()
        try:
            r = subprocess.run(cmd, cwd=TMP, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                               timeout=self.timeout)
        except subprocess.TimeoutExpired:
            return -9, f"TIMEOUT after {self.timeout} s", time.monotonic() - t0
        return r.returncode, r.stdout.decode("utf-8", "replace"), time.monotonic() - t0

    def log(self, data):
        self.n += 1
        path = LOGS / f"{id(self)}-{self.n}.log"
        path.write_bytes(data)
        return path

    def expect_pass(self, group, label, data, max_seconds=None):
        code, out, sec = self.gate(self.log(data))
        ok = code == 0 and PASS_LINE in out and INVALID not in out and "Traceback" not in out
        if max_seconds is not None:
            ok = ok and sec < max_seconds
            label = f"{label} (exit 0 in less than {max_seconds:g} s)"
            self.reports.append(f"{group}: {label}: {sec:.3f} s")
        else:
            label = f"{label} (exit 0)"
        self.check(group, label, ok, f"exit {code}, {sec:.3f} s, output: {out[-300:]!r}")

    def expect_reject(self, group, label, data, *messages, max_seconds=None):
        code, out, sec = self.gate(self.log(data))
        fails = [ln for ln in out.splitlines() if ln.startswith("FAIL:")]
        ok = (code == 1 and INVALID in out and "Traceback" not in out and PASS_LINE not in out and fails
              and all(ln.startswith(f"FAIL: {INVALID}") for ln in fails)
              and all(m in out for m in messages))
        if max_seconds is not None:
            ok = ok and sec < max_seconds
            label = f"{label} (exit 1 in less than {max_seconds:g} s)"
            self.reports.append(f"{group}: {label}: {sec:.3f} s")
        else:
            label = f"{label} (exit 1, '{INVALID}')"
        self.check(group, label, ok, f"exit {code}, {sec:.3f} s, output: {out[-300:]!r}")

    def report(self, group, label, data=None, log_arg=None):
        code, out, _sec = self.gate(log_arg if log_arg is not None else self.log(data))
        ok = code in (0, 1) and "Traceback" not in out
        self.check(group, f"{label} (report: exit 0 or 1, no Traceback)", ok, f"exit {code}: {out[-300:]!r}")
        fb = "invalid" if INVALID in out else "no dispositions feedback"
        self.reports.append(f"{group}: {label}: exit {code}; {fb}")

    def value_reject(self, group, label, value, *messages):
        self.expect_reject(group, label, enc(blk(f"dispositions: {value}")), *messages)

    def value_pass(self, group, label, value):
        self.expect_pass(group, label, enc(blk(f"dispositions: {value}")))

    # --- groups ---------------------------------------------------------------------------------

    def g00_control(self):
        g = "G00 control"
        self.expect_pass(g, "a block without a dispositions line", enc(blk()))
        self.value_pass(g, "dispositions: none", "none")
        self.value_pass(g, "a valid line with all four dispositions",
                        "F1=FIX; F2=CONTEST(tests/a.py::t covers it); F3=ESCALATE(team call); F4=DECLINE")
        self.value_reject(g, "dispositions: F1=bad", "F1=bad")

    def g01_line_ends(self):
        g = "G01 line ends (contract)"
        self.expect_pass(g, "whole log in CRLF with dispositions: none", enc(blk("dispositions: none"), "\r\n"))
        self.expect_pass(g, "whole log in CRLF with F1=FIX; F2=DECLINE",
                         enc(blk("dispositions: F1=FIX; F2=DECLINE"), "\r\n"))

    def g02_embedded_cr(self):
        g = "G02 embedded CR"
        self.report(g, "F1=FIX CR F2=CONTEST()", enc(blk("dispositions: F1=FIX\rF2=CONTEST()")))
        self.report(g, "F1=FIX CR ; F2=DECLINE", enc(blk("dispositions: F1=FIX\r; F2=DECLINE")))
        # Docstring contract: "The log splits on LF only, so a CR or another separator cannot
        # hide an invalid item inside the line."
        self.value_reject(g, "docstring LF-only rule: F1=FIX CR F2=bad", "F1=FIX\rF2=bad")
        self.value_reject(g, "docstring LF-only rule: F1=FIX U+2028 F2=bad", "F1=FIX F2=bad")

    def g03_unicode_separators(self):
        g = "G03 Unicode line separators"
        self.report(g, "F1=FIX U+2028 F2=CONTEST()", enc(blk("dispositions: F1=FIX F2=CONTEST()")))
        self.report(g, "F1=FIX U+0085 F2=bad", enc(blk("dispositions: F1=FIX\u0085F2=bad")))
        self.report(g, "handoff value x U+2028 MEASURE_AGENT_RESULT before a real block",
                    enc(["handoff: x " + START, *blk("dispositions: none")]))

    def g04_nul(self):
        g = "G04 NUL"
        self.value_reject(g, "F1=FIX NUL (contract)", "F1=FIX\x00")
        self.value_reject(g, "F2=CONTEST(NUL) (contract)", "F2=CONTEST(\x00)", "control or zero-width character")
        self.value_reject(g, "F2=CONTEST(ESC) (contract)", "F2=CONTEST(\x1b)", "control or zero-width character")
        self.value_reject(g, "F2=CONTEST(U+200B) (contract)", "F2=CONTEST(a\u200bb)", "control or zero-width character")
        self.value_reject(g, "F3=ESCALATE(U+FEFF) (contract)", "F3=ESCALATE(\ufeff)", "control or zero-width character")
        self.value_pass(g, "F2=CONTEST(tab between words) (contract)", "F2=CONTEST(a\tb)")

    def g40_ordering(self):
        g = "G04b ordering (contract)"
        self.expect_reject(g, "an invalid item keeps its message with a NUL", enc(blk("dispositions: F2=bad\x00")))
        code, out, _sec = self.gate(self.log(enc(blk("dispositions: F2=bad\x00"))))
        ok = code == 1 and "control or zero-width" not in out and "Traceback" not in out
        self.check(g, "the control message is absent when an item is already invalid", ok, f"exit {code}: {out[-300:]!r}")

    def g41_markers_exact(self):
        g = "G04c marker look-alikes (contract)"
        data = enc(["handoff: MEASURE_AGENT_RESULT_EXTRA", "END_MEASURE_AGENT_RESULT2: x"])
        code, out, _sec = self.gate(self.log(data))
        ok = code == 1 and "missing MEASURE_AGENT_RESULT block" in out and "Traceback" not in out
        self.check(g, "look-alike marker text does not count as a result block", ok, f"exit {code}: {out[-300:]!r}")

    def g42_control_classes(self):
        g = "G04d control classes (contract)"
        self.value_reject(g, "F2=CONTEST(U+2028)", "F2=CONTEST(a\u2028b)", "control or zero-width character")
        self.value_reject(g, "F2=CONTEST(U+0085)", "F2=CONTEST(a\x85b)", "control or zero-width character")
        self.value_reject(g, "F2=CONTEST(U+202E)", "F2=CONTEST(a\u202eb)", "control or zero-width character")
        self.value_reject(g, "F2=CONTEST(U+200E)", "F2=CONTEST(a\u200eb)", "control or zero-width character")
        self.value_reject(g, "F2=CONTEST(U+061C)", "F2=CONTEST(a\u061cb)", "control or zero-width character")
        self.value_reject(g, "F2=CONTEST(U+200F)", "F2=CONTEST(a\u200fb)", "control or zero-width character")
        self.value_reject(g, "a trailing U+2028 after the value", "F2=FIX\u2028", "control or zero-width character")
        self.value_reject(g, "a leading U+0085 before the value", "\u0085F2=FIX", "control or zero-width character")
        self.value_reject(g, "none with a leading U+2028", "\u2028none", "control or zero-width character")

    def g05_semicolon_in_parens(self):
        g = "G05 ';' inside parentheses (contract, spec Decision 18)"
        self.value_reject(g, "F2=CONTEST(a; b)", "F2=CONTEST(a; b)")
        self.value_reject(g, "F3=ESCALATE(x;)", "F3=ESCALATE(x;)")

    def g06_parens(self):
        g = "G06 nested and unbalanced parentheses (contract)"
        for v in ["F2=CONTEST(a(b))", "F2=CONTEST(a)b)", "F2=CONTEST((a)"]:
            self.value_pass(g, v, v)

    def g07_spaces(self):
        g = "G07 spaces"
        self.value_pass(g, "F1=FIX ;F2=DECLINE (contract)", "F1=FIX ;F2=DECLINE")
        self.value_pass(g, "two spaces around F1=FIX (contract)", "  F1=FIX  ")
        self.value_reject(g, "F2=CONTEST(U+00A0) (contract)", "F2=CONTEST( )")
        self.report(g, "F2=CONTEST( )", enc(blk("dispositions: F2=CONTEST( )")))
        self.report(g, "F2=CONTEST(U+200B)", enc(blk("dispositions: F2=CONTEST(​)")))
        self.report(g, "dispositions:none", enc(blk("dispositions:none")))
        self.report(g, "dispositions: and four spaces", enc(blk("dispositions:    ")))

    def g08_id_forms(self):
        g = "G08 id forms (contract)"
        for v in ["F01=FIX", "F１=FIX", "f1=FIX", "F1=Fix", "F1 = FIX", "F1=FIXX", "F1=DECLINE()"]:
            self.value_reject(g, repr(v), v)
        self.value_reject(g, "F1=FIX; F1=FIX", "F1=FIX; F1=FIX", "duplicate finding id F1")

    def g09_several_blocks(self):
        g = "G09 several blocks (contract)"
        self.expect_pass(g, "last block valid, earlier block invalid",
                         enc([*blk(BAD), *blk("dispositions: none")]))
        self.expect_reject(g, "last block invalid, earlier block valid",
                           enc([*blk("dispositions: none"), *blk(BAD)]))
        self.expect_reject(g, "two dispositions lines in the last block (none, then F1=bad)",
                           enc(blk("dispositions: none", BAD)), "more than one dispositions line")

    def g10_substring_start(self):
        g = "G10 start line as a substring"
        self.expect_pass(g, "handoff: see MEASURE_AGENT_RESULT inside the block (contract)",
                         enc(blk("handoff: see MEASURE_AGENT_RESULT", "dispositions: none")))

    def g11_not_utf8(self):
        g = "G11 log not UTF-8"
        self.expect_pass(g, "bytes FF FE outside the block, valid block (contract)",
                         b"\xff\xfe junk\n" + enc(blk("dispositions: F1=FIX")))
        self.report(g, "bytes FF FE inside the dispositions line",
                    enc(blk("dispositions: F1=FIX")).replace(b"F1=FIX", b"F1=FIX\xff\xfe"))

    def g12_log_path(self):
        g = "G12 log path"
        folder = LOGS / f"dir-{id(self)}"
        folder.mkdir(exist_ok=True)
        self.report(g, "--log-file is a folder", log_arg=folder)
        code, out, _ = self.gate(LOGS / "none.log")
        self.check(g, "missing log file (contract: exit 1, missing block message, no dispositions message)",
                   code == 1 and MISSING in out and INVALID not in out and "Traceback" not in out,
                   f"exit {code}: {out[-300:]!r}")

    def g13_every_role(self):
        g = "G13 every role (contract)"
        log = self.log(enc(blk("dispositions: F1=fix")))
        for role in ["strategy", "mid-red", "review-a", "spec-review"]:
            code, out, _ = self.gate(log, role=role, extra_env={})
            self.check(g, f"--role {role} reports '{INVALID}'",
                       code == 1 and INVALID in out and "Traceback" not in out, f"exit {code}: {out[-300:]!r}")

    def g14_fail_open(self):
        g = "G14 fail-open order (contract)"
        code, out, _ = self.gate(self.log(enc(blk("dispositions: F1=FIX"))), extra_env={"GREEN_TEST_COMMAND": "false"})
        self.check(g, "valid line and GREEN_TEST_COMMAND=false exit 1 with the GREEN_TEST_COMMAND failure",
                   code == 1 and "FAIL: GREEN_TEST_COMMAND failed" in out and PASS_LINE not in out,
                   f"exit {code}: {out[-300:]!r}")

    def g15_documented_example(self):
        g = "G15 documented example (contract)"
        doc = ROOT / "skills/measure-orchestrator/references/contracts.md"
        lines = [ln for ln in doc.read_text(encoding="utf-8").splitlines()
                 if "dispositions: F1=FIX; F2=CONTEST(" in ln]
        self.check(g, "contracts.md holds at least one example line", len(lines) >= 1, f"{len(lines)} lines")
        for i, ln in enumerate(lines, 1):
            self.expect_pass(g, f"example line {i} of {len(lines)}", enc(blk(ln.strip())))

    def g16_frozen_corpus(self):
        g = "G16 backward compatibility, frozen corpus (contract)"
        self.expect_pass(g, "S1 shape: no dispositions line", enc(blk()))
        self.expect_pass(g, "S2 shape: dispositions: F1=FIX; F2=FIX", enc(blk("dispositions: F1=FIX; F2=FIX")))
        self.expect_pass(g, "JSON summary above the block",
                         enc(['{"status": "pass", "summary": "MEASURE_AGENT_RESULT text"}', "", *blk()]))

    def g17_block_range(self):
        g = "G17 block range rule (contract, durable regression)"
        self.expect_reject(g, "an inner start line hides nothing",
                           enc([*BLOCK_LINES, BAD, START, "role: x", END]))
        self.expect_reject(g, "a trailing start line after an invalid block", enc([*blk(BAD), START]))
        self.expect_reject(g, "a second dispositions line", enc(blk("dispositions: F1=FIX", "dispositions: F2=FIX")),
                           "more than one dispositions line")
        self.expect_reject(g, "START / bad / START / END / END", enc([START, BAD, START, END, END]))
        self.expect_reject(g, "START / END / bad / END", enc([START, END, BAD, END]))
        self.expect_reject(g, "an end line before the first start line", enc([END, *blk(BAD)]))
        self.expect_reject(g, "CRLF line endings", enc(blk(BAD), "\r\n"))
        self.expect_reject(g, "an end line with trailing spaces", enc([*BLOCK_LINES, BAD, END + "   "]))
        self.expect_reject(g, "a dispositions line with leading spaces", enc(blk("  " + BAD)))
        self.expect_reject(g, "a dispositions line with a leading tab", enc(blk("\t" + BAD)))
        self.expect_reject(g, "a start line on line 1 counts", enc([START, BAD, END]))
        self.expect_pass(g, "two complete blocks, the first invalid", enc([*blk(BAD), *blk()]))
        self.expect_pass(g, "a dispositions line after the last end line", enc([*blk(), BAD]))
        self.expect_pass(g, "a valid one-block log", enc(blk("dispositions: F1=FIX")))

    def g18_time(self):
        g = "G18 time limits (contract)"
        self.expect_pass(g, "20000 end lines, then 20000 start lines and one complete block",
                         enc([END] * 20000 + [START] * 20000 + blk("dispositions: F1=FIX")),
                         max_seconds=TIME_LIMIT)
        items = "; ".join(f"F{n}=FIX" for n in range(1, 50001))
        self.expect_pass(g, "50,000 items F<n>=FIX", enc(blk(f"dispositions: {items}")), max_seconds=TIME_LIMIT)
        self.expect_pass(g, "one CONTEST( item with 5 MB of evidence",
                         enc(blk("dispositions: F1=CONTEST(" + "e" * (5 * 1024 * 1024) + ")")),
                         max_seconds=TIME_LIMIT)
        self.expect_reject(g, "50,000 items with one duplicate at the end",
                           enc(blk(f"dispositions: {items}; F50000=FIX")), "duplicate finding id F50000",
                           max_seconds=TIME_LIMIT)

    def run_all(self):
        for name in sorted(n for n in dir(self) if re.match(r"g\d\d_", n)):
            if self.only is not None and name not in self.only:
                continue
            try:
                getattr(self, name)()
            except Killed:
                break
            except Exception as exc:  # a crash of a probe is a FAIL, not a skip
                self.check(name, "probe group ran without an exception", False, repr(exc))
        return self.results


total = passed = 0
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


main = Probes(CHECKER)
results = main.run_all()
record("probe groups produced checks", len(results) >= 70, f"{len(results)} checks")
for _g, label, ok, detail in results:
    record(label, ok, detail)
for line in main.reports:
    print(f"REPORT: {line}")

# --- G19 backward compatibility, committed corpus (read-only) ---------------------------------
# The corpus is the committed one: a gitignored or foreign log on disk must not fail the gate
# without an implementation regression (Group (b)), and every clone runs the same checks.
g = "G19 live corpus"
listed = subprocess.run(
    ["git", "ls-files", "-z", "--", "measure/runs", "measure/archive"],
    cwd=ROOT, env=base_env(), stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
)
if listed.returncode != 0:
    record(f"{g}: git ls-files lists the committed corpus", False, f"exit {listed.returncode}")
    logs = []
else:
    tracked = listed.stdout.decode("utf-8", "surrogateescape").split("\0")
    logs = sorted(ROOT / p for p in tracked if p.endswith(".log"))
    record(f"{g}: the committed corpus holds at least one log", len(logs) > 0, "0 tracked logs")
live = Probes(CHECKER)
bad, not_zero, exact = [], [], 0
for p in logs:
    code, out, _ = live.gate(p)
    if INVALID in out or "Traceback" in out:
        bad.append(f"{p.relative_to(ROOT)}: {out[-200:]!r}")
    lines = [ln.rstrip("\r") for ln in p.read_bytes().decode("utf-8", "ignore").split("\n")]
    if START in lines and END in lines:
        exact += 1
        if code != 0:
            not_zero.append(f"{p.relative_to(ROOT)}: exit {code}")
print(f"REPORT: {g}: {len(logs)} logs, {exact} with both exact lines")
record(f"{g}: no log gives dispositions feedback or a Traceback", not bad, "; ".join(bad[:5]))
record(f"{g}: each log with both exact lines exits 0", not not_zero, "; ".join(not_zero[:5]))

# --- G20 lint: no pipe into grep -q in the bash suites (F14) --------------------------------
suite_dir = ROOT / "tests" / "spec_review_gate"
shells = sorted(suite_dir.glob("*.sh"))
pipe_rx = re.compile(r"\|\s*grep\s+-q")
hits = [f"{p.name}:{i}" for p in shells for i, ln in enumerate(p.read_text(encoding="utf-8").splitlines(), 1)
        if pipe_rx.search(ln)]
record("G20 lint: the suite folder holds .sh files", len(shells) >= 5, f"{len(shells)} files")
record("G20 lint: no .sh file under tests/spec_review_gate/ has a pipe into grep -q", not hits, ", ".join(hits))

# --- G21 sensitivity: broken copies of the checker ---------------------------------------------
SOURCE = CHECKER.read_text(encoding="utf-8")
PARSER = ["g00_control", "g02_embedded_cr", "g04_nul", "g07_spaces", "g08_id_forms", "g09_several_blocks",
          "g17_block_range"]
MUTANTS = [
    ("re.match instead of fullmatch", "DISPOSITIONS_ITEM_RE.fullmatch(item)", "DISPOSITIONS_ITEM_RE.match(item)", PARSER),
    ("the first start line, not the block range", "start = block_starts[0]", "start = starts[0]", PARSER),
    ("the first block, not the last", "                last_end = index", "                last_end = index\n                break", PARSER),
    ("only the first dispositions line", "if len(values) > 1:", "if False:", PARSER),
    ("no duplicate check", "if finding_id in seen:", "if False:", PARSER),
    ("re.IGNORECASE", '(CONTEST|ESCALATE)\\((.+)\\))")', '(CONTEST|ESCALATE)\\((.+)\\))", re.IGNORECASE)', PARSER),
    ("no strip() of each item", "item = raw.strip()", "item = raw", PARSER),
    ("no strip() of each line", "        stripped = line.strip()", "        stripped = line", PARSER),
    ("exact end line without strip()", "line.strip() == AGENT_RESULT_END]", "line == AGENT_RESULT_END]", PARSER),
    ("splitlines() in place of the LF split", 'lines = text.split("\\n")', "lines = text.splitlines()", PARSER),
    ("the call only for jr-green", "    if args.log_file and Path(args.log_file).exists():",
     '    if role == "jr-green" and args.log_file and Path(args.log_file).exists():', ["g13_every_role"]),
    ("no call", "        feedback.extend(dispositions_feedback(args.log_file))", "        pass", PARSER),
    ("the old quadratic any(...) loop", "if first_start < index:", "if any(start < index for start in starts):",
     ["g18_time"]),
]
mdir = TMP / "mutants"
mdir.mkdir()
for i, (name, old, new, groups) in enumerate(MUTANTS):
    if SOURCE.count(old) != 1:
        record(f"G21 sensitivity: mutant '{name}' applies once", False, f"count={SOURCE.count(old)}")
        continue
    path = mdir / f"m{i}.py"
    path.write_text(SOURCE.replace(old, new), encoding="utf-8")
    res = Probes(path, only=set(groups), timeout=15, stop_on_fail=True).run_all()
    killed = [label for _g, label, ok, _d in res if not ok]
    record(f"G21 sensitivity: mutant '{name}' fails at least one probe", bool(res) and bool(killed),
           f"{len(res)} checks, 0 fail")
    if killed:
        print(f"  killed by: {killed[0]}")

print(f"=== Total: {total} checks (PASS={passed}, FAIL={len(failed)}) ===")
sys.exit(1 if failed else 0)
PY
rc=$?
exit "$rc"
