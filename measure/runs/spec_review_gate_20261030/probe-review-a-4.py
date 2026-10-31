"""Review A probe 4 (S3, 23c72ed): here-string equivalence and is_file() behavior."""
import importlib.util
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path("/home/daniebo/Desktop/measure")
CHECKER = ROOT / "skills/measure-orchestrator/scripts/measure_interphase_checks.py"
OLD_REF = "33f608d:skills/measure-orchestrator/scripts/measure_interphase_checks.py"
SUITES = [
    "tests/spec_review_gate/test_s1_adversarial.sh",
    "tests/spec_review_gate/test_s1_new_track.sh",
    "tests/spec_review_gate/test_s1_standard.sh",
    "tests/spec_review_gate/test_s2_role_docs.sh",
    "tests/spec_review_gate/test_s3_dispositions_docs.sh",
]

TMP = Path(tempfile.mkdtemp(prefix="probe-review-a-4-", dir="/tmp/opencode"))
FAILURES = []


def check(name, ok, detail=""):
    print(("PASS: " if ok else "FAIL: ") + name + ((" -- " + str(detail)) if detail else ""))
    if not ok:
        FAILURES.append(name)


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, str(path))
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


mic = load_module(CHECKER, "mic_new")
old_src = subprocess.run(
    ["git", "-C", str(ROOT), "show", OLD_REF],
    text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=True,
).stdout
old_path = TMP / "mic_old.py"
old_path.write_text(old_src, encoding="utf-8")
mic_old = load_module(old_path, "mic_old")


def bash(script, var=None):
    env = dict(os.environ)
    if var is not None:
        env["PROBE_X"] = var
    r = subprocess.run(["bash", "-c", script], text=True, env=env,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return r.returncode, r.stdout


# ---- Part 1: a here-string gives grep the same bytes as printf '%s\n'.
inputs = ["", "abc", "one\ntwo\nthree", "abc\n", "  --dash", "unicode \u00fc \u2028 line",
          "no suites matched", "x" * 5000, "line with 'quote\" and \\ backslash"]
same = True
detail = ""
for x in inputs:
    _rc_a, a = bash("printf '%s\\n' \"$PROBE_X\" | od -An -tx1", x)
    _rc_b, b = bash("od -An -tx1 <<< \"$PROBE_X\"", x)
    if a != b:
        same = False
        detail = repr(x[:40])
        break
check("printf '%s\\n' and a here-string give the same bytes for 9 inputs", same, detail)

# ---- Part 2: the converted condition form keeps its meaning and can fail.
pairs = [
    ("no suites matched\nmore output", "no suites matched", "-qF", True),
    ("other output only", "no suites matched", "-qF", False),
    ("SUITE-SPACE\n", "SUITE-SPACE", "-qxF", True),
    (" SUITE-SPACE", "SUITE-SPACE", "-qxF", False),
    ("--- suite result: FAIL: test_imp.py ---\n", "--- suite result: FAIL: test_imp.py ", "-qF", True),
    ("--- suite result: PASS: test_imp.py ---\n", "--- suite result: FAIL: test_imp.py ", "-qF", False),
    ("[Specification](./spec.md)", "spec-review", "-qF", False),
    ("see spec-review here", "spec-review", "-qF", True),
]
ok = True
detail = ""
for x, pat, flags, want in pairs:
    script_pipe = "set -uo pipefail; if printf '%s\\n' \"$PROBE_X\" | grep {f} -- \"{p}\"; then echo M; else echo N; fi".format(f=flags, p=pat)
    script_here = "set -uo pipefail; if grep {f} -- \"{p}\" <<< \"$PROBE_X\"; then echo M; else echo N; fi".format(f=flags, p=pat)
    _rc, a = bash(script_pipe, x)
    _rc, b = bash(script_here, x)
    want_s = "M" if want else "N"
    if a.strip() != want_s or b.strip() != want_s or a.strip() != b.strip():
        ok = False
        detail = "pattern {!r} pipe {} here {} want {}".format(pat, a.strip(), b.strip(), want_s)
        break
check("pipe and here-string forms agree and match or miss as expected on 8 cases", ok, detail)

# ---- Part 3: the five suites hold 23 converted conditions and no pipe into grep -q.
converted = 0
pipes = []
for rel in SUITES:
    text = (ROOT / rel).read_text(encoding="utf-8")
    converted += len(re.findall(r"grep\s+-q[^\n]*<<<", text))
    pipes.extend("{}:{}".format(rel, i) for i, ln in enumerate(text.splitlines(), 1)
                 if re.search(r"\|\s*grep\s+-q", ln))
check("the five suites hold 23 'grep -q ... <<<' conditions", converted == 23, str(converted))
check("no suite has a pipe into grep -q left", not pipes, ", ".join(pipes))

# ---- Part 4: is_file() keeps the result for a missing path, a file, and a symlink.
BLOCK = "MEASURE_AGENT_RESULT\nrole: jr-green\nstatus: complete\nEND_MEASURE_AGENT_RESULT\n"
log = TMP / "ok.log"
log.write_text(BLOCK, encoding="utf-8")
link = TMP / "link.log"
link.symlink_to(log)
dangling = TMP / "dangling.log"
dangling.symlink_to(TMP / "gone.log")
folder = TMP / "folder"
folder.mkdir()
missing = TMP / "missing.log"

cases = []
for label, path in [("missing path", missing), ("normal file", log), ("symlink to a file", link),
                    ("dangling symlink", dangling)]:
    a = (mic.has_agent_result(str(path)), mic.dispositions_feedback(str(path)))
    b = (mic_old.has_agent_result(str(path)), mic_old.dispositions_feedback(str(path)))
    cases.append((label, a, b, a == b))
check("missing path, normal file, symlink to a file, and dangling symlink give the same result as before",
      all(c[3] for c in cases), "; ".join("{}: {} vs {}".format(c[0], c[1], c[2]) for c in cases if not c[3]))
check("a normal file and a symlink to it still read the block",
      mic.has_agent_result(str(log)) and mic.has_agent_result(str(link))
      and mic.dispositions_feedback(str(log)) == [] and mic.dispositions_feedback(str(link)) == [])
check("a missing path gives no block and no feedback",
      not mic.has_agent_result(str(missing)) and mic.dispositions_feedback(str(missing)) == [])

folder_results = []
for mod in (mic, mic_old):
    try:
        folder_results.append((mod.has_agent_result(str(folder)), mod.dispositions_feedback(str(folder)), None))
    except Exception as exc:  # the old code raised on a folder
        folder_results.append((None, None, type(exc).__name__))
check("the old code raised on a folder; the new code treats it as no log",
      folder_results[0] == (False, [], None) and folder_results[1][2] == "IsADirectoryError",
      str(folder_results))
check("an empty log path keeps has_agent_result True and no feedback",
      mic.has_agent_result("") is True and mic.dispositions_feedback("") == [])
doc_has = mic.has_agent_result.__doc__
doc_fb = " ".join(mic.dispositions_feedback.__doc__.split())
check("the has_agent_result docstring states the non-file rule",
      "A missing path, a folder, or another non-file path counts as no log." in doc_has)
check("the dispositions_feedback docstring states the non-file rule",
      "A path that is not a file, such as a folder, gives no feedback." in doc_fb)

# ---- Part 5: role-gate through the CLI for a folder, a missing path, and a symlink.
repo = TMP / "repo"
(repo / "measure/tracks/demo_track").mkdir(parents=True)
(repo / "measure/index.md").write_text("# Measure\n", encoding="utf-8")
(repo / "measure/tracks.md").write_text("# Tracks\n", encoding="utf-8")
(repo / "measure/tracks/demo_track/plan.md").write_text(
    "# Plan\n\n## Phase S1: Fixture\n\n- [x] Task 1.1: Fixture task abc1234\n", encoding="utf-8")


def git(*args):
    env = dict(os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_NOSYSTEM="1",
               HOME=str(TMP), PATH=os.environ["PATH"])
    p = subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@e.c", "-c", "commit.gpgsign=false", *args],
                       cwd=str(repo), env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if p.returncode != 0:
        raise SystemExit("git {} failed: {}".format(args, p.stdout))
    return p.stdout


git("init", "-q")
git("add", "-A")
git("commit", "-q", "-m", "fixture")
baseline = git("rev-parse", "HEAD").strip()
(repo / "src.txt").write_text("green\n", encoding="utf-8")
git("add", "src.txt")
git("commit", "-q", "-m", "green")


def gate(log_arg):
    env = dict(os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_NOSYSTEM="1",
               HOME=str(TMP), PATH=os.environ["PATH"], GREEN_TEST_COMMAND="true")
    cmd = [sys.executable, "-I", str(CHECKER), "role-gate", "--repo", str(repo), "--role", "jr-green",
           "--track", "demo_track", "--phase", "Phase S1: Fixture", "--baseline", baseline,
           "--log-file", str(log_arg)]
    p = subprocess.run(cmd, cwd=str(TMP), env=env, text=True,
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    return p.returncode, p.stdout


code, out = gate(folder)
check("role-gate with a folder exits 1 with the missing-block message and no Traceback",
      code == 1 and "missing MEASURE_AGENT_RESULT block" in out and "Traceback" not in out
      and "invalid dispositions line" not in out, "exit {}; tail: {!r}".format(code, out[-160:]))
code, out = gate(missing)
check("role-gate with a missing path exits 1 with the missing-block message and no Traceback",
      code == 1 and "missing MEASURE_AGENT_RESULT block" in out and "Traceback" not in out,
      "exit {}; tail: {!r}".format(code, out[-160:]))
code, out = gate(link)
check("role-gate with a symlink to a valid log exits 0",
      code == 0 and "PASS: jr-green gate passed" in out and "Traceback" not in out,
      "exit {}; tail: {!r}".format(code, out[-160:]))

print()
print("probe failures: " + str(len(FAILURES)))
for f in FAILURES:
    print("  - " + f)
shutil.rmtree(TMP, ignore_errors=True)
sys.exit(1 if FAILURES else 0)
