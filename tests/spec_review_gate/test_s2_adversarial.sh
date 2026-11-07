#!/usr/bin/env bash
# S2 adversarial tests: `role-gate --role spec-review` and `audit-result --role spec-review`.
# The checker of the repository runs as a subprocess in temporary git repositories.
# "Contract" probes assert the result that the plan defines (plan amendment ccdaae2 and the
# Review B remediation b955a3e included). "Report" probes assert only exit 0 or 1 with no
# Traceback, so a later fix of a reported item does not make this suite fail.
# The sensitivity group runs the target probes against broken copies of the checker; each
# copy must fail at least one probe of its target group (A4).
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
  python3 -I - "$CHECKER" "$TMP" <<'PY'
import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

CHECKER = Path(sys.argv[1])
TMP = Path(sys.argv[2])
TRACK = "demo_track"
PHASE = "track setup"
RESULT_REL = f"measure/runs/{TRACK}/spec-review-test.json"
PASS_LINE = "PASS: spec-review gate passed"
OUTSIDE = "FAIL: spec-review committed files outside measure/runs/"
RESOLVE = "FAIL: --baseline does not resolve to a commit: "
REQUIRED = "FAIL: --baseline is required for spec-review"
INVALID = "FAIL: spec-review finding has an invalid format: "
LISTFAIL = "FAIL: spec-review could not list committed files: "
NONEMPTY_NB = "FAIL: nonblocking_findings must contain only non-empty strings"
PARA_OBJ = "FAIL: paraphrase must be an object with proposes and current_system"
GIT_ID = ["-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false"]

MAJOR = "F1 [Major] plan.md Phase S2: The plan leaves a file open. Rationale: the implementer must guess."
NIT = "F2 [Nit] spec.md Overview: One word is loose. Rationale: wording only."
BLOCKER_LINE = "F9 [Blocker] spec.md Decision 1: The spec hides a Blocker. Rationale: the gate must stop."


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


def pass_payload():
    return {
        "schema_version": 1,
        "status": "pass",
        "summary": "Spec review of demo_track found no Blocker.",
        "blocking_findings": [],
        "nonblocking_findings": [MAJOR, NIT],
        "evidence": ["Read spec.md and plan.md of demo_track."],
        "commands": ["git rev-parse HEAD"],
        "changed_files": [],
        "retry_recommendation": "none",
        "confidence": "high",
        "paraphrase": {
            "proposes": "The track adds a fixture feature.",
            "current_system": "The current system has no fixture feature.",
        },
    }


class Repo:
    counter = 0

    def __init__(self, checker):
        Repo.counter += 1
        self.checker = checker
        self.path = TMP / f"repo{Repo.counter}"
        self.path.mkdir()
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(f"measure/tracks/{TRACK}/plan.md",
                   "# Plan\n\n## Phase S1: Fixture\n\n- [x] Task 1.1: Fixture task abc1234\n")
        self.git("init", "-q")
        self.git("add", "-A")
        self.commit("fixture")
        self.baseline = self.head()

    def write(self, rel, text):
        p = self.path / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
        return p

    def git(self, *args, env=None):
        r = subprocess.run(["git", *GIT_ID, *args], cwd=self.path, env=env or base_env(),
                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        if r.returncode != 0:
            raise RuntimeError(f"git {args} failed: {r.stdout!r}")
        return r.stdout.decode("utf-8", "replace")

    def commit(self, msg):
        self.git("commit", "-q", "--allow-empty", "-m", msg)

    def head(self):
        return self.git("rev-parse", "HEAD").strip()

    def add_commit(self, rel, text="x\n", msg="add"):
        self.write(rel, text)
        self.git("add", "--", rel)
        self.commit(msg)

    def result(self, payload=None, raw=None):
        p = self.path / RESULT_REL
        p.parent.mkdir(parents=True, exist_ok=True)
        if raw is not None:
            p.write_bytes(raw)
        else:
            p.write_text(json.dumps(pass_payload() if payload is None else payload), encoding="utf-8")
        return p

    def run(self, *args, env=None, timeout=120):
        start = time.monotonic()
        r = subprocess.run([sys.executable, "-I", str(self.checker), *args], cwd=self.path,
                           env=env or base_env(), stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                           timeout=timeout)
        return r.returncode, r.stdout.decode("utf-8", "replace"), time.monotonic() - start

    def gate(self, baseline=None, result_file=None, role="spec-review", env=None, use_baseline=True):
        args = ["role-gate", "--repo", str(self.path), "--role", role, "--track", TRACK, "--phase", PHASE]
        if use_baseline:
            args.append(f"--baseline={self.baseline if baseline is None else baseline}")
        args.append(f"--result-file={result_file or (self.path / RESULT_REL)}")
        return self.run(*args, env=env)

    def audit(self, role="spec-review", file=None):
        return self.run("audit-result", "--role", role, "--file", str(file or (self.path / RESULT_REL)))


class Probes:
    def __init__(self, checker, only=None):
        self.checker = checker
        self.only = only
        self.results = []
        self.reports = []

    def check(self, group, label, ok, detail=""):
        self.results.append((group, f"{group}: {label}", bool(ok), detail))

    def report(self, group, label, code, out):
        ok = code in (0, 1) and "Traceback" not in out
        first = out.strip().splitlines()[-1] if out.strip() else ""
        self.check(group, f"{label} (report: exit 0 or 1, no Traceback)", ok, f"exit {code}")
        self.reports.append(f"{group}: {label}: exit {code}; last line: {first[:160]}")

    def repo(self):
        return Repo(self.checker)

    def lines(self, out):
        return out.splitlines()

    # --- groups -----------------------------------------------------------------------------

    def g01_bad_baselines(self):
        g = "G01 bad --baseline values"
        r = self.repo()
        r.result()
        r.add_commit("src/blob.txt", "blob\n")
        blob = r.git("rev-parse", "HEAD:src/blob.txt").strip()
        tree = r.git("rev-parse", "HEAD^{tree}").strip()
        other = self.repo()
        other.add_commit("measure/runs/demo_track/other.txt", "other unique\n")
        foreign = other.head()
        r.git("reset", "-q", "--hard", r.baseline)
        r.result()
        out_target = TMP / f"output-probe-{Repo.counter}" / "x"
        out_target.parent.mkdir()
        values = [tree, blob, foreign, f"{r.baseline}..HEAD", "--all", "-h", f"--output={out_target}", " "]
        for v in values:
            code, out, _ = r.gate(baseline=v)
            ok = code == 1 and (RESOLVE + v) in self.lines(out) and "Traceback" not in out
            self.check(g, f"value {v!r} exits 1 with the resolve message", ok, f"exit {code}: {out[-300:]!r}")
        self.check(g, "--output=<tmp>/x leaves no file", not out_target.exists())

    def g02_empty_baseline(self):
        g = "G02 empty --baseline"
        r = self.repo()
        r.result()
        code, out, _ = r.gate(baseline="")
        self.check(g, "--baseline= exits 1 with the required message",
                   code == 1 and REQUIRED in self.lines(out), f"exit {code}: {out!r}")
        code, out, _ = r.gate(use_baseline=False)
        self.check(g, "no --baseline exits 1 with the required message",
                   code == 1 and REQUIRED in self.lines(out), f"exit {code}: {out!r}")

    def g03_bad_baseline_skips_scope(self):
        g = "G03 bad baseline skips the scope check"
        r = self.repo()
        r.add_commit("src/app.py", "print('a')\n")
        r.result()
        code, out, _ = r.gate(baseline="not-a-ref")
        ok = code == 1 and (RESOLVE + "not-a-ref") in self.lines(out) and OUTSIDE not in out
        self.check(g, "not-a-ref with src/app.py gives only the resolve message", ok, f"exit {code}: {out!r}")

    def g04_good_baselines(self):
        g = "G04 good baseline forms"
        r = self.repo()
        r.git("tag", "-a", "-m", "base", "base_tag", r.baseline)
        r.add_commit("measure/runs/demo_track/note.txt", "note\n")
        r.result()
        for label, v in (("short SHA", r.baseline[:8]), ("annotated tag", "base_tag")):
            code, out, _ = r.gate(baseline=v)
            self.check(g, f"{label} passes", code == 0 and PASS_LINE in self.lines(out), f"exit {code}: {out!r}")
        r2 = self.repo()
        r2.result()
        code, out, _ = r2.gate(baseline="HEAD")
        self.check(g, "HEAD with no new commit passes", code == 0 and PASS_LINE in self.lines(out),
                   f"exit {code}: {out!r}")

    def payload_case(self, g, label, payload, expect):
        r = self.repo()
        r.result(payload)
        code, out, _ = r.audit()
        ok = code == 1 and any(line.startswith(expect) for line in self.lines(out)) and "Traceback" not in out
        self.check(g, label, ok, f"exit {code}: {out[-300:]!r}")

    def g05_finding_formats(self):
        g = "G05 finding formats"
        cases = ["F01 [Major] x: y", "F1 [Major] x:", "F1 [Major] x: ", " F1 [Major] x: y",
                 "F1 [major] x: y", "F1 [Major]x: y", "F1 [Critical] x: y", "F１ [Major] x: y",
                 "Major: no id"]
        for f in cases:
            p = pass_payload()
            p["nonblocking_findings"] = [f]
            self.payload_case(g, f"{f!r} is rejected", p, INVALID + f)
        p = pass_payload()
        p["nonblocking_findings"] = [""]
        self.payload_case(g, "'' is rejected", p, NONEMPTY_NB)

    def g06_multiline_findings(self):
        g = "G06 multi-line findings (remediation regression)"
        seps = {"LF": "\n", "CR": "\r", "CRLF": "\r\n", "U+2028": " ", "U+2029": " ", "NEL": "\x85"}
        for name, sep in seps.items():
            f = NIT + sep + BLOCKER_LINE
            p = pass_payload()
            p["nonblocking_findings"] = [MAJOR, f]
            r = self.repo()
            r.result(p)
            code, out, _ = r.gate()
            ok = code == 1 and "FAIL: spec-review finding has an invalid format" in out and PASS_LINE not in out
            self.check(g, f"second [Blocker] line after {name} with status pass is rejected", ok,
                       f"exit {code}: {out[-300:]!r}")
        p = pass_payload()
        p["nonblocking_findings"] = [NIT + "\n"]
        self.payload_case(g, "a trailing LF is rejected", p, "FAIL: spec-review finding has an invalid format")

    def g07_non_string_items(self):
        g = "G07 non-string finding items"
        for item in (5, None, {}, ["F1 [Major] x: y"]):
            p = pass_payload()
            p["nonblocking_findings"] = [item]
            self.payload_case(g, f"{item!r} is rejected", p, NONEMPTY_NB)

    def g08_paraphrase_types(self):
        g = "G08 paraphrase types"
        for value in (["a", "b"], 5, "text", None, {}):
            p = pass_payload()
            p["paraphrase"] = value
            expect = PARA_OBJ if not isinstance(value, dict) else "FAIL: paraphrase.proposes must be a non-empty string"
            self.payload_case(g, f"paraphrase {value!r} is rejected", p, expect)

    def g09_paraphrase_fields(self):
        g = "G09 paraphrase field types"
        for field, value in (("proposes", 5), ("proposes", ["a"]), ("current_system", None), ("proposes", " ")):
            p = pass_payload()
            p["paraphrase"][field] = value
            self.payload_case(g, f"{field}={value!r} is rejected", p,
                              f"FAIL: paraphrase.{field} must be a non-empty string")

    def g10_unicode_edge(self):
        g = "G10 unicode edge text"
        p = pass_payload()
        p["paraphrase"]["proposes"] = "​"
        r = self.repo()
        r.result(p)
        code, out, _ = r.gate()
        self.report(g, "proposes U+200B", code, out)
        p = pass_payload()
        p["paraphrase"]["extra"] = "x"
        r.result(p)
        code, out, _ = r.gate()
        self.report(g, "extra paraphrase key", code, out)
        for name, tail in (("CR", "\r"), ("VT", "\x0b"), ("U+2028", " ")):
            p = pass_payload()
            p["nonblocking_findings"] = [NIT + tail]
            r.result(p)
            code, out, _ = r.gate()
            self.report(g, f"finding with a trailing {name} and no second line", code, out)
        p = pass_payload()
        p["nonblocking_findings"] = ["F1 [Major] x:  "]
        r.result(p)
        code, out, _ = r.gate()
        self.report(g, "finding with a description of one space", code, out)

    def g11_huge(self):
        g = "G11 huge and unicode strings"
        r = self.repo()
        p = pass_payload()
        p["paraphrase"]["proposes"] = "a" * (5 * 1024 * 1024)
        r.result(p)
        code, out, sec = r.gate()
        self.check(g, "5 MB proposes passes in less than 5 s", code == 0 and PASS_LINE in out and sec < 5,
                   f"exit {code}, {sec:.2f} s")
        p = pass_payload()
        p["nonblocking_findings"] = ["F1 [Major] " + "x" * (1024 * 1024)]
        r.result(p)
        code, out, sec = r.gate()
        self.check(g, "1 MB finding with no ': ' fails in less than 5 s",
                   code == 1 and INVALID in out and sec < 5, f"exit {code}, {sec:.2f} s")
        p = pass_payload()
        p["nonblocking_findings"] = ["F1 [Major] ספר \U0001f680 scope: مرحبا \U0001f600 text"]
        r.result(p)
        code, out, sec = r.gate()
        self.check(g, "emoji and right-to-left text pass", code == 0 and PASS_LINE in out, f"exit {code}: {out!r}")
        p = pass_payload()
        p["nonblocking_findings"] = ["F1 [Major] " + ": " * 3000 + "\n"]
        r.result(p)
        code, out, sec = r.gate()
        self.check(g, "3000 ': ' pairs with a trailing LF fail", code == 1 and "invalid format" in out,
                   f"exit {code}, {sec:.2f} s")
        self.reports.append(f"{g}: 3000 ': ' pairs with a trailing LF: exit {code} in {sec:.2f} s")

    def g12_not_json(self):
        g = "G12 result file not JSON"
        r = self.repo()
        for label, raw, expect in (("plain text", b"hello", "FAIL: invalid audit JSON:"),
                                   ("empty file", b"", "FAIL: invalid audit JSON:"),
                                   ("[]", b"[]", "FAIL: audit result must be a JSON object"),
                                   ("null", b"null", "FAIL: audit result must be a JSON object")):
            r.result(raw=raw)
            code, out, _ = r.gate()
            ok = code == 1 and any(line.startswith(expect) for line in out.splitlines())
            self.check(g, f"{label} is rejected", ok, f"exit {code}: {out!r}")
        code, out, _ = r.gate(result_file=str(r.path / "missing.json"))
        self.check(g, "a missing path is rejected",
                   code == 1 and "FAIL: missing audit result:" in out, f"exit {code}: {out!r}")

    def g13_not_text(self):
        g = "G13 result file not readable as text"
        r = self.repo()
        r.result(raw=b"\xff\xfe\x00")
        code, out, _ = r.gate()
        self.check(g, "bytes ff fe 00 fail closed (report)", code == 1 and PASS_LINE not in out, f"exit {code}")
        self.reports.append(f"{g}: bytes ff fe 00: exit {code}; Traceback={'Traceback' in out}")
        folder = r.path / "measure/runs/demo_track/folder.json"
        folder.mkdir(parents=True)
        code, out, _ = r.gate(result_file=str(folder))
        self.check(g, "a folder fails closed (report)", code == 1 and PASS_LINE not in out, f"exit {code}")
        self.reports.append(f"{g}: folder: exit {code}; Traceback={'Traceback' in out}")

    def scope_case(self, g, label, setup, expect_paths, env=None):
        r = self.repo()
        setup(r)
        r.result()
        code, out, _ = r.gate(env=env)
        lines = self.lines(out)
        ok = code == 1 and OUTSIDE in lines and all(f"FAIL: - {p}" in lines for p in expect_paths)
        self.check(g, label, ok, f"exit {code}: {out!r}")
        return r

    def g14_renames_deletions(self):
        g = "G14 scope: renames and deletions"

        def rename_out(r):
            r.add_commit("measure/runs/demo_track/a.txt", "rename me\n")
            r.baseline = r.head()
            (r.path / "src").mkdir()
            r.git("mv", "measure/runs/demo_track/a.txt", "src/a.txt")
            r.commit("mv")

        def delete(r):
            r.add_commit("src/b.py", "print('b')\n")
            r.baseline = r.head()
            r.git("rm", "-q", "src/b.py")
            r.commit("rm")

        self.scope_case(g, "rename out of measure/runs/ names src/a.txt", rename_out, ["src/a.txt"])
        self.scope_case(g, "deletion names src/b.py", delete, ["src/b.py"])
        self.scope_case(g, "measure/runsX/a is named", lambda r: r.add_commit("measure/runsX/a"), ["measure/runsX/a"])
        self.scope_case(g, "Measure/runs/a is named", lambda r: r.add_commit("Measure/runs/a"), ["Measure/runs/a"])

        def chmod(r):
            r.add_commit("src/m.sh", "echo m\n")
            r.baseline = r.head()
            r.git("update-index", "--chmod=+x", "src/m.sh")
            r.commit("chmod")

        self.scope_case(g, "a mode change names src/m.sh", chmod, ["src/m.sh"])

    def g15_rename_into_runs(self):
        g = "G15 scope: rename into measure/runs/ (amendment ccdaae2)"

        def setup(r):
            r.add_commit("src/a.py", 'print("a")\n')
            r.baseline = r.head()
            (r.path / "measure/runs/demo_track").mkdir(parents=True)
            r.git("mv", "src/a.py", "measure/runs/demo_track/a.py")
            r.commit("mv")

        for name, extra in (("pinned config", None),
                            ("diff.renames=true", {"GIT_CONFIG_COUNT": "1", "GIT_CONFIG_KEY_0": "diff.renames",
                                                   "GIT_CONFIG_VALUE_0": "true"}),
                            ("diff.renames=copies", {"GIT_CONFIG_COUNT": "1", "GIT_CONFIG_KEY_0": "diff.renames",
                                                     "GIT_CONFIG_VALUE_0": "copies"}),
                            ("diff.renames=false", {"GIT_CONFIG_COUNT": "1", "GIT_CONFIG_KEY_0": "diff.renames",
                                                    "GIT_CONFIG_VALUE_0": "false"})):
            self.scope_case(g, f"{name}: exit 1 and names src/a.py", setup, ["src/a.py"], env=base_env(extra))

    def g16_non_ascii(self):
        g = "G16 scope: non-ASCII and whitespace paths (remediation regression)"
        r = self.repo()
        r.add_commit("measure/runs/demo_track/ü.txt", "u\n")
        r.result()
        code, out, _ = r.gate()
        self.check(g, "measure/runs/demo_track/ü.txt passes (default core.quotePath)",
                   code == 0 and PASS_LINE in out, f"exit {code}: {out!r}")
        qp = {"GIT_CONFIG_COUNT": "1", "GIT_CONFIG_KEY_0": "core.quotePath", "GIT_CONFIG_VALUE_0": "false"}
        for label, path in (("leading space", " measure/runs/x"), ("leading TAB", "\tmeasure/runs/x"),
                            ("leading U+3000", "　measure/runs/x"), ("runsX", "measure/runsX/a")):
            for cfg_name, env in (("default", None), ("core.quotePath=false", base_env(qp))):
                self.scope_case(g, f"{label} path {path!r} fails and is named ({cfg_name})",
                                lambda rr, p=path: rr.add_commit(p), [path], env=env)

    def g17_uncommitted(self):
        g = "G17 scope: uncommitted file"
        r = self.repo()
        r.write("src/x.py", "print('x')\n")
        r.result()
        code, out, _ = r.gate()
        self.check(g, "uncommitted src/x.py passes (Decision 17)", code == 0 and PASS_LINE in out,
                   f"exit {code}: {out!r}")

    def g18_alias_case(self):
        g = "G18 alias case"
        r = self.repo()
        r.result()
        code, out, _ = r.gate(role="SPEC-REVIEW")
        self.report(g, "--role SPEC-REVIEW", code, out)

    def g19_extra_scope(self):
        g = "G19 scope: git failure and net-zero history"
        r = self.repo()
        r.add_commit("measure/runs/demo_track/unique-tree.txt", "unique tree content 19\n")
        r.baseline = r.head()
        tree = r.git("rev-parse", "HEAD^{tree}").strip()
        r.add_commit("measure/runs/demo_track/later.txt", "later\n")
        obj = r.path / ".git" / "objects" / tree[:2] / tree[2:]
        if obj.exists():
            obj.chmod(0o644)
            obj.unlink()
        r.result()
        code, out, _ = r.gate()
        ok = code == 1 and any(line.startswith(LISTFAIL) for line in out.splitlines()) and PASS_LINE not in out
        self.check(g, "a missing baseline tree gives the could-not-list message", ok and not obj.exists(),
                   f"exit {code}: {out!r}")
        r2 = self.repo()
        r2.add_commit("src/tmp.py", "print('t')\n")
        r2.git("rm", "-q", "src/tmp.py")
        r2.commit("revert")
        r2.result()
        code, out, _ = r2.gate()
        self.report(g, "add then remove src/tmp.py in two commits", code, out)
        r3 = self.repo()
        r3.add_commit("measure/runs/demo_track/x.txt")
        bad = bytes(r3.path) + b"/measure/runs/demo_track/bad\xff.txt"
        with open(bad, "wb") as fh:
            fh.write(b"b\n")
        subprocess.run(["git", *GIT_ID, "add", "-A", "--", "measure/runs"], cwd=r3.path, env=base_env(),
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        r3.commit("non-utf8")
        r3.result()
        code, out, _ = r3.gate()
        self.check(g, "non-UTF-8 byte in a measure/runs/ file name fails closed (report)",
                   code == 1 and PASS_LINE not in out, f"exit {code}")
        self.reports.append(f"{g}: non-UTF-8 byte in a measure/runs/ file name: exit {code}; "
                            f"Traceback={'Traceback' in out}")

    GROUPS = ["g01_bad_baselines", "g02_empty_baseline", "g03_bad_baseline_skips_scope", "g04_good_baselines",
              "g05_finding_formats", "g06_multiline_findings", "g07_non_string_items", "g08_paraphrase_types",
              "g09_paraphrase_fields", "g10_unicode_edge", "g11_huge", "g12_not_json", "g13_not_text",
              "g14_renames_deletions", "g15_rename_into_runs", "g16_non_ascii", "g17_uncommitted",
              "g18_alias_case", "g19_extra_scope"]

    def run_all(self):
        for name in self.GROUPS:
            if self.only and name not in self.only:
                continue
            try:
                getattr(self, name)()
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
record("probe groups produced checks", len(results) >= 85, f"{len(results)} checks")
for _g, label, ok, detail in results:
    record(label, ok, detail)
for line in main.reports:
    print(f"REPORT: {line}")

# --- G20 sensitivity: broken copies of the checker ---------------------------------------
SOURCE = CHECKER.read_text(encoding="utf-8")
MUTANTS = [
    ("re.match instead of fullmatch", "SPEC_REVIEW_FINDING_RE.fullmatch(finding)",
     "SPEC_REVIEW_FINDING_RE.match(finding)", ["g06_multiline_findings"]),
    ("no splitlines check", " or len(finding.splitlines()) != 1", "", ["g06_multiline_findings"]),
    ("strip() on paths", "paths.sort()", "paths = [p.strip() for p in paths if p.strip()]\n                        paths.sort()",
     ["g16_non_ascii"]),
    ("no -z flag", '"--no-renames", "-z", f"{args.baseline}..HEAD"', '"--no-renames", f"{args.baseline}..HEAD"', ["g16_non_ascii"]),
    ("no baseline check", "if resolved.returncode != 0:", "if False:", ["g01_bad_baselines", "g03_bad_baseline_skips_scope"]),
    ("startswith without slash", 'path.startswith("measure/runs/")', 'path.startswith("measure/runs")',
     ["g14_renames_deletions", "g16_non_ascii"]),
    ("no paraphrase type check", "if not isinstance(paraphrase, dict):", "if paraphrase is None:",
     ["g08_paraphrase_types"]),
    ("git failure ignored", "if listed.returncode != 0:", "if False:", ["g19_extra_scope"]),
]
mdir = TMP / "mutants"
mdir.mkdir()
for i, (name, old, new, groups) in enumerate(MUTANTS):
    if SOURCE.count(old) != 1:
        record(f"G20 sensitivity: mutant '{name}' applies once", False, f"count={SOURCE.count(old)}")
        continue
    path = mdir / f"m{i}.py"
    path.write_text(SOURCE.replace(old, new), encoding="utf-8")
    res = Probes(path, only=set(groups)).run_all()
    killed = [label for _g, label, ok, _d in res if not ok]
    record(f"G20 sensitivity: mutant '{name}' fails at least one probe of {groups}", bool(res) and bool(killed),
           f"{len(res)} checks, 0 fail")
    if killed:
        print(f"  killed by: {killed[0]}")

print(f"=== Total: {total} checks (PASS={passed}, FAIL={len(failed)}) ===")
sys.exit(1 if failed else 0)
PY
rc=$?
exit "$rc"
