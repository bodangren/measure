"""Review A probe: dispositions_feedback vs the contracts.md rule text (S3)."""
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path("/home/daniebo/Desktop/measure")
CHECKER = ROOT / "skills/measure-orchestrator/scripts/measure_interphase_checks.py"
CONTRACTS = ROOT / "skills/measure-orchestrator/references/contracts.md"

spec = importlib.util.spec_from_file_location("mic", str(CHECKER))
mic = importlib.util.module_from_spec(spec)
sys.modules["mic"] = mic
spec.loader.exec_module(mic)

FAILURES = []


def check(name, ok, detail=""):
    print(("PASS: " if ok else "FAIL: ") + name + ((" -- " + str(detail)) if detail else ""))
    if not ok:
        FAILURES.append(name)


TMP = Path(tempfile.mkdtemp(prefix="probe-review-a-1-"))


def fb_for(lines):
    path = TMP / "probe.log"
    path.write_bytes(("\n".join(lines) + "\n").encode("utf-8"))
    return mic.dispositions_feedback(str(path))


S = "MEASURE_AGENT_RESULT"
E = "END_MEASURE_AGENT_RESULT"


def block(*extra):
    return [S, "role: jr-green", "status: complete", *extra, E]


# ---- Part 1: the worked example of contracts.md is valid input.
text = CONTRACTS.read_text(encoding="utf-8")
m = re.search(r"```markdown\n(MEASURE_AGENT_RESULT\n.*?dispositions:.*?END_MEASURE_AGENT_RESULT\n)```", text, re.S)
example = m.group(1) if m else ""
check("contracts.md holds a worked-example block with a dispositions line", bool(example), example[:60])
if example:
    fb = fb_for(example.splitlines())
    check("the worked example gives no feedback", fb == [], fb)

# ---- Part 2: function-level parser cases.
ok_cases = [
    ("no dispositions line", block()),
    ("dispositions: none", block("dispositions: none")),
    ("dispositions:none without a space", block("dispositions:none")),
    ("line after the last end does not count", [*block(), "dispositions: F1=bad"]),
    ("only the last complete block counts", [*block("dispositions: F1=bad"), *block("dispositions: none")]),
    ("line before the block start (after an earlier end) does not count",
     [*block(), "dispositions: F1=bad", *block("dispositions: none")]),
    ("stray start line after the last end is ignored", [*block("dispositions: none"), S, "dispositions: F1=bad"]),
    ("a log with an end line only gives no feedback", [E, "dispositions: F1=bad"]),
    ("a log with no end line gives no feedback", [S, "role: jr-green", "dispositions: F1=bad"]),
]
for name, lines in ok_cases:
    check(name + " -> no feedback", fb_for(lines) == [], fb_for(lines))

bad_cases = [
    ("a second start line inside the block cannot hide an invalid line above it",
     [S, "dispositions: F1=bad", S, "role: jr-green", E], "invalid dispositions line: F1=bad"),
    ("two dispositions lines in one block", block("dispositions: none", "dispositions: F1=BOGUS"),
     "more than one dispositions line"),
    ("lowercase word", block("dispositions: F1=fix"), "invalid dispositions line"),
    ("unknown word", block("dispositions: F1=IGNORE"), "invalid dispositions line"),
    ("CONTEST without parentheses", block("dispositions: F2=CONTEST"), "invalid dispositions line"),
    ("CONTEST with empty text", block("dispositions: F2=CONTEST()"), "invalid dispositions line"),
    ("CONTEST with space text", block("dispositions: F2=CONTEST(   )"), "invalid dispositions line"),
    ("ESCALATE with empty text", block("dispositions: F3=ESCALATE()"), "invalid dispositions line"),
    ("FIX with text", block("dispositions: F1=FIX(done)"), "invalid dispositions line"),
    ("empty value", block("dispositions: "), "empty item"),
    ("id zero", block("dispositions: F0=FIX"), "invalid dispositions line"),
    ("id not F", block("dispositions: X1=FIX"), "invalid dispositions line"),
    ("trailing empty item", block("dispositions: F1=FIX;"), "empty item"),
    ("duplicate id", block("dispositions: F1=FIX; F1=DECLINE"), "duplicate finding id F1"),
    ("semicolon inside the parentheses", block("dispositions: F2=CONTEST(a;b)"), "invalid dispositions line"),
    ("a CR cannot split an invalid item", block("dispositions: F1=bad\r=FIX"), "invalid dispositions line"),
]
for name, lines, msg in bad_cases:
    fb = fb_for(lines)
    check(name + " -> rejected", bool(fb) and any(msg in item for item in fb), fb)

# ---- Part 3: role-gate exit codes (jr-green fixture).
repo = TMP / "repo"
repo.mkdir()
(repo / "measure").mkdir()
(repo / "measure/tracks/demo_track").mkdir(parents=True)
(repo / "measure/index.md").write_text("# Measure\n")
(repo / "measure/tracks.md").write_text("# Tracks\n")
(repo / "measure/tracks/demo_track/plan.md").write_text(
    "# Plan\n\n## Phase S1: Fixture\n\n- [x] Task 1.1: Fixture task abc1234\n"
)
(repo / "measure/runs/demo_track").mkdir(parents=True)


def git(*args):
    env = dict(os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_NOSYSTEM="1",
               HOME=str(TMP), PATH=os.environ["PATH"])
    p = subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@e.c", "-c", "commit.gpgsign=false", *args],
                       cwd=str(repo), env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if p.returncode != 0:
        raise SystemExit(f"git {args} failed: {p.stdout}")
    return p.stdout


git("init", "-q")
git("add", "measure/index.md", "measure/tracks.md", "measure/tracks/demo_track/plan.md")
git("commit", "-q", "-m", "fixture")
baseline = git("rev-parse", "HEAD").strip()
(repo / "src.txt").write_text("green\n")
git("add", "src.txt")
git("commit", "-q", "-m", "green")

LOG = TMP / "jr-green.log"
RESULT = repo / "measure/runs/demo_track/review-a-test.json"
RESULT.write_text(json.dumps({
    "audited_head_sha": git("rev-parse", "HEAD").strip(),
    "blocking_findings": [], "changed_files": ["src.txt"], "commands": ["probe"],
    "confidence": "high", "evidence": ["probe"], "nonblocking_findings": [],
    "phase_heading": "Phase S1: Fixture", "retry_recommendation": "none", "role": "review-a",
    "schema_version": 1, "status": "pass", "summary": "probe",
}))


def gate(role, extra):
    env = dict(os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_NOSYSTEM="1",
               HOME=str(TMP), PATH=os.environ["PATH"], GREEN_TEST_COMMAND="true")
    cmd = [sys.executable, "-I", str(CHECKER), "role-gate", "--repo", str(repo), "--role", role,
           "--track", "demo_track", "--phase", "Phase S1: Fixture", "--baseline", baseline,
           "--log-file", str(LOG), *extra]
    p = subprocess.run(cmd, cwd=str(TMP), env=env, text=True,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return p.returncode, p.stdout


def run_gate(name, lines, role="jr-green", extra=(), want_code=0, want_text="", no_text=""):
    LOG.write_bytes(("\n".join(lines) + "\n").encode("utf-8"))
    code, out = gate(role, list(extra))
    ok = code == want_code and (not want_text or want_text in out) and (not no_text or no_text not in out)
    check(name, ok, f"exit {code}; output: {out.strip()[:200]}")


run_gate("Red case: a bad line after END exits 0", [*block(), "dispositions: F1=bad"],
         want_code=0, want_text="PASS: jr-green gate passed")
if example:
    run_gate("the worked example exits 0 through role-gate", example.splitlines(),
             want_code=0, want_text="PASS: jr-green gate passed")
run_gate("a bad line inside the block exits 1", block("dispositions: F1=bad"),
         want_code=1, want_text="invalid dispositions line", no_text="PASS: jr-green gate passed")
run_gate("a log with no end line fails on the missing block, not on dispositions",
         [S, "role: jr-green", "dispositions: F1=bad"],
         want_code=1, want_text="missing MEASURE_AGENT_RESULT block", no_text="invalid dispositions line")
run_gate("the dispositions check runs for an audit role (review-a)",
         block("dispositions: F1=bad"), role="review-a", extra=["--result-file", str(RESULT)],
         want_code=1, want_text="invalid dispositions line")
run_gate("review-a passes with a valid dispositions line and a valid result JSON",
         block("dispositions: F1=FIX"), role="review-a", extra=["--result-file", str(RESULT)],
         want_code=0, want_text="PASS: review-a gate passed")

# ---- Part 4: the contracts.md rule text agrees with the parser behavior above.
rules = [
    "The check reads only the last result block of the log. The block ends at the last `END_MEASURE_AGENT_RESULT` line.",
    "The block starts at the first `MEASURE_AGENT_RESULT` line after the previous `END_MEASURE_AGENT_RESULT` line, or after the first line of the log when no earlier end line exists.",
    "The check reads every `dispositions:` line in that range, so a second start line inside the block cannot hide a line above it. A log with no end line gives no feedback.",
    "The block holds one dispositions line. A second dispositions line fails the check with `invalid dispositions line: more than one dispositions line`.",
    "A `dispositions:` line after the block end does not count.",
    "Items are separated by `;`. An empty value, an empty item, a repeated id, or a word in lowercase fails the `role-gate` check with `invalid dispositions line`.",
]
for rule in rules:
    check("contracts.md states: " + rule[:60] + "...", rule in text)

print()
print("probe failures: " + str(len(FAILURES)))
for f in FAILURES:
    print("  - " + f)
shutil.rmtree(TMP, ignore_errors=True)
sys.exit(1 if FAILURES else 0)
