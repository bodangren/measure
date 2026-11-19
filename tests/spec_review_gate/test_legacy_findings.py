"""S2 contract tests: the legacy `findings` list maps to the new finding keys.

A role result with the old `findings` key stays readable. Each entry maps by
its severity tag: `[Blocker]` goes to `blocking_findings`, `[Major]` and
`[Nit]` go to `nonblocking_findings`. The checker prints one WARNING that
names the new keys. An entry without a severity tag cannot map, and the
checker rejects it with a clear message.

Each case runs the checker of the repository as a subprocess. Each subprocess
gets an explicit environment, so no inherited gate variable and no host git
configuration reaches it. The fixture track is `demo_track`; no test reads the
real track folder. Each failure case asserts its exact message, not only the
exit code (A4).
"""

from __future__ import annotations

import copy
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHECKER = ROOT / "skills" / "measure-orchestrator" / "scripts" / "measure_interphase_checks.py"

TRACK = "demo_track"
PHASE = "Phase S1: Fixture"
RESULT_REL = f"measure/runs/{TRACK}/review-a-test.json"
WARNING = "WARNING: legacy findings mapped to blocking_findings/nonblocking_findings"

BASE_PAYLOAD = {
    "schema_version": 1,
    "status": "pass",
    "summary": "Review A of demo_track found no Blocker.",
    "blocking_findings": [],
    "nonblocking_findings": ["A loose sentence."],
    "evidence": ["Read the phase diff of demo_track."],
    "commands": ["git rev-parse HEAD"],
    "changed_files": [],
    "retry_recommendation": "none",
    "confidence": "high",
}


def pass_payload() -> dict:
    return copy.deepcopy(BASE_PAYLOAD)


def clean_env(extra: dict[str, str] | None = None) -> dict[str, str]:
    """Build an explicit environment. Nothing from the host gate variables is copied."""
    env = {
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
        "HOME": "/nonexistent-home-for-test",
        "LC_ALL": "C.UTF-8",
        "GIT_CONFIG_GLOBAL": "/dev/null",
        "GIT_CONFIG_NOSYSTEM": "1",
        "PYTHONDONTWRITEBYTECODE": "1",
    }
    if extra:
        env.update(extra)
    return env


class LegacyFindingsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.mkdtemp(prefix="legacy_findings_")
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.assertTrue(os.path.isdir(self.tmp), "mktemp did not return a folder")
        self.repo = Path(self.tmp) / "repo"
        self.repo.mkdir()
        self.write("measure/index.md", "# Measure\n")
        self.write("measure/tracks.md", "# Tracks\n")
        self.write(
            f"measure/tracks/{TRACK}/plan.md",
            f"# Plan\n\n## {PHASE}\n\n- [x] Task 1.1: Fixture task abc1234\n",
        )
        self.git("init", "-q")
        self.git("add", "measure/index.md", "measure/tracks.md", f"measure/tracks/{TRACK}/plan.md")
        self.git("commit", "-q", "-m", "fixture")
        self.baseline = self.git("rev-parse", "HEAD").stdout.strip()
        self.assertRegex(self.baseline, r"^[0-9a-f]{40}$")

    # ------------------------------------------------------------------ helpers
    def write(self, rel: str, text: str) -> Path:
        path = self.repo / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        return path

    def git(self, *args: str) -> subprocess.CompletedProcess:
        proc = subprocess.run(
            ["git", "-c", "user.name=test", "-c", "user.email=test@example.com", "-c", "commit.gpgsign=false", *args],
            cwd=str(self.repo),
            env=clean_env(),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        if proc.returncode != 0:
            self.fail(f"fixture git {' '.join(args)} failed: {proc.stdout}")
        return proc

    def write_result(self, payload: object) -> Path:
        return self.write(RESULT_REL, json.dumps(payload))

    def run_checker(self, *args: str) -> tuple[int, str]:
        proc = subprocess.run(
            [sys.executable, "-I", str(CHECKER), *args],
            cwd=self.tmp,
            env=clean_env(),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            check=False,
        )
        return proc.returncode, proc.stdout

    def audit(self) -> tuple[int, str]:
        return self.run_checker("audit-result", "--role", "review-a", "--file", str(self.repo / RESULT_REL))

    def assert_exit(self, expected: int, code: int, out: str) -> None:
        self.assertEqual(code, expected, f"exit {code}, expected {expected}; output:\n{out}")
        self.assertNotIn("Traceback", out)

    # ------------------------------------------------------------------ normal
    def test_mapped_nit_passes_with_a_warning(self) -> None:
        payload = pass_payload()
        del payload["nonblocking_findings"]
        payload["findings"] = ["A loose sentence. [Nit] Rationale: wording only."]
        self.write_result(payload)
        code, out = self.audit()
        self.assert_exit(0, code, out)
        self.assertIn("PASS: audit result is valid", out)
        self.assertIn(WARNING, out)

    def test_mapped_blocker_lands_in_blocking_findings(self) -> None:
        payload = pass_payload()
        payload.update(status="fail", retry_recommendation="retry_implementation")
        payload["findings"] = ["A wrong branch. [Blocker] Rationale: the main case fails."]
        self.write_result(payload)
        code, out = self.run_checker(
            "role-gate", "--repo", str(self.repo), "--role", "review-a", "--track", TRACK,
            "--phase", PHASE, "--baseline", self.baseline,
            "--result-file", str(self.repo / RESULT_REL),
        )
        self.assert_exit(1, code, out)
        self.assertIn(WARNING, out)
        self.assertIn("A wrong branch. [Blocker] Rationale: the main case fails.", out)

    def test_spec_review_mapped_findings_pass(self) -> None:
        payload = {
            "schema_version": 1,
            "status": "fail",
            "summary": "Spec review found one Blocker.",
            "evidence": ["Read spec.md and plan.md of demo_track."],
            "commands": ["git rev-parse HEAD"],
            "changed_files": [],
            "retry_recommendation": "escalate_human",
            "confidence": "high",
            "paraphrase": {
                "proposes": "The track adds a fixture feature.",
                "current_system": "The current system has no fixture feature.",
            },
            "findings": [
                "F1 [Blocker] spec.md Overview: The spec fixes a symptom. Rationale: the root problem stays.",
                "F2 [Major] plan.md Phase S2: The plan leaves the file location open. Rationale: the implementer must guess.",
            ],
        }
        self.write_result(payload)
        code, out = self.run_checker("audit-result", "--role", "spec-review", "--file", str(self.repo / RESULT_REL))
        self.assert_exit(0, code, out)
        self.assertIn(WARNING, out)

    def test_no_legacy_key_gives_no_warning(self) -> None:
        self.write_result(pass_payload())
        code, out = self.audit()
        self.assert_exit(0, code, out)
        self.assertNotIn("WARNING", out)

    # -------------------------------------------------------------------- edge
    def test_entry_without_a_severity_tag_is_rejected(self) -> None:
        payload = pass_payload()
        payload["findings"] = ["A loose sentence with no tag."]
        self.write_result(payload)
        code, out = self.audit()
        self.assert_exit(1, code, out)
        self.assertIn("cannot map to blocking_findings/nonblocking_findings", out)
        self.assertNotIn("PASS: audit result is valid", out)

    def test_non_list_findings_is_rejected(self) -> None:
        payload = pass_payload()
        payload["findings"] = "A loose sentence."
        self.write_result(payload)
        code, out = self.audit()
        self.assert_exit(1, code, out)
        self.assertIn("must be a list of non-empty strings", out)


if __name__ == "__main__":
    unittest.main()
