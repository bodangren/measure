#!/usr/bin/env python3
"""Mechanical checks for Measure orchestrator handoffs."""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path


AUDIT_SCHEMA_VERSION = 1
AUDIT_STATUSES = {"pass", "fail", "inconclusive"}
RETRY_RECOMMENDATIONS = {
    "none",
    "retry_tests",
    "retry_implementation",
    "retry_audit",
    "escalate_human",
    "create_remediation_track",
    "infrastructure_retry",
}
CONFIDENCE_LEVELS = {"low", "medium", "high"}
AUDIT_LIST_FIELDS = (
    "blocking_findings",
    "nonblocking_findings",
    "evidence",
    "commands",
    "changed_files",
)
HARD_BLOCKING_FIELDS = (
    "test_strategy_violations",
    "live_contract_violations",
    "prod_wiring_violations",
    "route_parity_violations",
)
CLOSEOUT_MANIFEST = "automation-supervisor-closeout-manifest.json"

ROLE_ALIASES = {
    "strategy": "strategy",
    "measure-strategy": "strategy",
    "mid": "mid-red",
    "mid-red": "mid-red",
    "measure-mid-red": "mid-red",
    "jr": "jr-green",
    "jr-green": "jr-green",
    "measure-jr-green": "jr-green",
    "review-a": "review-a",
    "review_a": "review-a",
    "review-a-correctness": "review-a",
    "measure-review-a-correctness": "review-a",
    "review-b": "review-b",
    "review_b": "review-b",
    "review-b-security": "review-b",
    "measure-review-b-security": "review-b",
    "review-c": "review-c",
    "review_c": "review-c",
    "review-c-ux-api": "review-c",
    "measure-review-c-ux-api": "review-c",
    "phase-acceptance": "phase-acceptance",
    "phase_acceptance": "phase-acceptance",
    "measure-phase-acceptance": "phase-acceptance",
    "adversarial": "adversarial-testing",
    "adversarial-testing": "adversarial-testing",
    "measure-adversarial-testing": "adversarial-testing",
    "ux": "ux-browser-review",
    "ux-browser-review": "ux-browser-review",
    "measure-ux-browser-review": "ux-browser-review",
    "acceptance": "final-acceptance",
    "final-acceptance": "final-acceptance",
    "measure-final-acceptance": "final-acceptance",
    "closeout": "closeout",
    "measure-closeout": "closeout",
}


@dataclass(frozen=True)
class Phase:
    number: int
    track: str
    heading: str
    incomplete: int
    total: int


def repo_root(raw: str) -> Path:
    if raw:
        return Path(raw).expanduser().resolve()
    current = Path.cwd().resolve()
    for candidate in (current, *current.parents):
        if is_measure_repo(candidate):
            return candidate
    raise SystemExit("ERROR: could not locate a Measure repo root; pass --repo")


def is_measure_repo(path: Path) -> bool:
    measure = path / "measure"
    return (
        (measure / "index.md").is_file()
        and (measure / "tracks.md").is_file()
        and (measure / "tracks").is_dir()
    )


def measure_dir(repo: Path) -> Path:
    return repo / "measure"


def git(repo: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *args],
        cwd=str(repo),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )


def git_head(repo: Path) -> str:
    result = git(repo, "rev-parse", "HEAD")
    return result.stdout.strip() if result.returncode == 0 else ""


def git_status(repo: Path) -> str:
    result = git(repo, "status", "--porcelain")
    return result.stdout if result.returncode == 0 else ""


def changed_files(repo: Path, baseline: str) -> list[str]:
    files: set[str] = set()
    commands: list[list[str]] = []
    if baseline:
        commands.append(["diff", "--name-only", f"{baseline}..HEAD"])
    commands.extend((["diff", "--name-only"], ["diff", "--name-only", "--cached"]))
    for command in commands:
        result = git(repo, *command)
        if result.returncode == 0:
            files.update(line.strip() for line in result.stdout.splitlines() if line.strip())
    return sorted(files)


def committed_files(repo: Path, baseline: str) -> list[str]:
    if not baseline:
        return []
    result = git(repo, "diff", "--name-only", f"{baseline}..HEAD")
    if result.returncode != 0:
        return []
    return sorted(line.strip() for line in result.stdout.splitlines() if line.strip())


def non_test_committed_files(repo: Path, baseline: str) -> list[str]:
    test_suffixes = (
        ".test.ts",
        ".test.tsx",
        ".spec.ts",
        ".spec.tsx",
        ".test.js",
        ".test.jsx",
        ".spec.js",
        ".spec.jsx",
        "_test.go",
        ".bats",
    )
    result: list[str] = []
    for path in committed_files(repo, baseline):
        if path.startswith("measure/"):
            continue
        if path.endswith(test_suffixes):
            continue
        if "/__tests__/" in path or "/tests/" in path or path.startswith("tests/"):
            continue
        result.append(path)
    return result


def strip_checkpoint(heading: str) -> str:
    return re.sub(r" *\[(checkpoint|final-verification):[^\]]*\]", "", heading)


def phase_blocks(plan_text: str) -> list[tuple[str, str]]:
    blocks: list[tuple[str, str]] = []
    for block in re.split(r"(?=^## Phase )", plan_text, flags=re.MULTILINE):
        match = re.match(r"^## (Phase .+)", block, re.MULTILINE)
        if match:
            blocks.append((strip_checkpoint(match.group(1)), block))
    return blocks


def phase_counts(plan_path: Path, phase_heading: str) -> tuple[int, int, int, int, int]:
    if not plan_path.exists():
        return 0, 0, 0, 0, 0
    for heading, block in phase_blocks(plan_path.read_text(encoding="utf-8", errors="ignore")):
        if heading != phase_heading:
            continue
        tasks = re.findall(r"^- \[([ ~x])\] (.+)", block, re.MULTILINE)
        total = len(tasks)
        complete = sum(1 for status, _ in tasks if status == "x")
        in_progress = sum(1 for status, _ in tasks if status == "~")
        incomplete = sum(1 for status, task in tasks if status != "x" and "deferred" not in task.lower())
        with_sha = sum(1 for status, task in tasks if status == "x" and re.search(r"\b[0-9a-f]{7,40}\b", task))
        return total, complete, in_progress, incomplete, with_sha
    return 0, 0, 0, 0, 0


def track_incomplete(plan_path: Path) -> int:
    if not plan_path.exists():
        return 0
    text = plan_path.read_text(encoding="utf-8", errors="ignore")
    tasks = re.findall(r"^- \[([ ~x])\] (.+)", text, re.MULTILINE)
    return sum(1 for status, task in tasks if status != "x" and "deferred" not in task.lower())


def discover_phases(repo: Path, track_regex: str) -> list[Phase]:
    tracks_dir = measure_dir(repo) / "tracks"
    pattern = re.compile(track_regex) if track_regex else None
    phases: list[Phase] = []
    for track_dir in sorted(path for path in tracks_dir.iterdir() if path.is_dir()):
        if pattern and not pattern.search(track_dir.name):
            continue
        plan = track_dir / "plan.md"
        if not plan.exists():
            continue
        for heading, block in phase_blocks(plan.read_text(encoding="utf-8", errors="ignore")):
            tasks = re.findall(r"^- \[([ ~x])\] (.+)", block, re.MULTILINE)
            incomplete = sum(1 for status, task in tasks if status != "x" and "deferred" not in task.lower())
            if incomplete:
                phases.append(Phase(len(phases) + 1, track_dir.name, heading, incomplete, len(tasks)))
    return phases


def closeout_candidates(repo: Path, track_regex: str) -> list[str]:
    pattern = re.compile(track_regex) if track_regex else None
    result: list[str] = []
    for track_dir in sorted(path for path in (measure_dir(repo) / "tracks").iterdir() if path.is_dir()):
        if pattern and not pattern.search(track_dir.name):
            continue
        plan = track_dir / "plan.md"
        if plan.exists() and track_incomplete(plan) == 0:
            result.append(track_dir.name)
    return result


def split_env_list(name: str, default: str) -> tuple[str, ...]:
    raw = os.environ.get(name, default)
    return tuple(item.strip() for item in raw.split(",") if item.strip())


def ux_paths(repo: Path, baseline: str) -> list[str]:
    include_prefixes = split_env_list("UX_INCLUDE_PREFIXES", "app/src/,app/public/,src/,frontend/,web/,client/")
    include_suffixes = split_env_list("UX_INCLUDE_SUFFIXES", ".tsx,.jsx,.ts,.js,.css,.scss,.html,.dart")
    exclude_prefixes = split_env_list("UX_EXCLUDE_PREFIXES", "measure/,docs/,server/,scripts/,tests/,.github/")
    exclude_parts = split_env_list("UX_EXCLUDE_PARTS", "/__tests__/,/tests/,/test/,/__mocks__/")
    exclude_suffixes = split_env_list(
        "UX_EXCLUDE_SUFFIXES",
        ".test.ts,.test.tsx,.spec.ts,.spec.tsx,.test.js,.test.jsx,.spec.js,.spec.jsx,_test.dart,.stories.tsx,.stories.jsx,.md,.mdx",
    )
    relevant: list[str] = []
    for path in changed_files(repo, baseline):
        normalized = path.replace("\\", "/").lstrip("./")
        if normalized.startswith(exclude_prefixes):
            continue
        if any(part in f"/{normalized}" for part in exclude_parts):
            continue
        if normalized.endswith(exclude_suffixes):
            continue
        if normalized.endswith(include_suffixes) and normalized.startswith(include_prefixes):
            relevant.append(path)
    return relevant


def validate_string_list(payload: dict[str, object], field: str) -> list[str]:
    value = payload.get(field)
    if not isinstance(value, list):
        return [f"{field} must be a list of strings"]
    if not all(isinstance(item, str) and item.strip() for item in value):
        return [f"{field} must contain only non-empty strings"]
    return []


def validate_audit_payload(payload: object, role: str) -> list[str]:
    if not isinstance(payload, dict):
        return ["audit result must be a JSON object"]
    feedback: list[str] = []
    if payload.get("schema_version") != AUDIT_SCHEMA_VERSION:
        feedback.append(f"schema_version must be {AUDIT_SCHEMA_VERSION}")
    if payload.get("status") not in AUDIT_STATUSES:
        feedback.append("status must be pass, fail, or inconclusive")
    if not isinstance(payload.get("summary"), str) or not payload["summary"].strip():
        feedback.append("summary must be a non-empty string")
    for field in AUDIT_LIST_FIELDS:
        feedback.extend(validate_string_list(payload, field))
    for field in HARD_BLOCKING_FIELDS:
        if field in payload:
            feedback.extend(validate_string_list(payload, field))
    if payload.get("retry_recommendation") not in RETRY_RECOMMENDATIONS:
        feedback.append("retry_recommendation has an invalid value")
    if payload.get("confidence") not in CONFIDENCE_LEVELS:
        feedback.append("confidence must be low, medium, or high")
    if "findings" in payload:
        feedback.append("use blocking_findings and nonblocking_findings, not legacy findings")
    if role == "ux-browser-review":
        feedback.extend(validate_ux_payload(payload))
    return feedback


def validate_ux_payload(payload: dict[str, object]) -> list[str]:
    feedback: list[str] = []
    applicability = payload.get("ux_applicability")
    if applicability not in {"applicable", "not_applicable"}:
        feedback.append("ux_applicability must be applicable or not_applicable")
    if payload.get("webbridge_status") not in {"healthy", "unhealthy", "not_run"}:
        feedback.append("webbridge_status must be healthy, unhealthy, or not_run")
    evidence = payload.get("webbridge_evidence")
    if not isinstance(evidence, dict):
        return [*feedback, "webbridge_evidence must be an object"]
    for field in ("screenshots", "accessibility_snapshots", "interactions"):
        value = evidence.get(field)
        if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
            feedback.append(f"webbridge_evidence.{field} must be a list of non-empty strings")
    if applicability == "applicable" and all(not evidence.get(field) for field in ("screenshots", "accessibility_snapshots", "interactions")):
        feedback.append("applicable UX audit must include screenshot, accessibility, or interaction evidence")
    if applicability == "not_applicable" and payload.get("webbridge_status") != "not_run":
        feedback.append("not_applicable UX audit must record webbridge_status=not_run")
    return feedback


def read_audit(path: Path, role: str) -> tuple[dict[str, object] | None, list[str]]:
    if not path.exists():
        return None, [f"missing audit result: {path}"]
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return None, [f"invalid audit JSON: {exc}"]
    feedback = validate_audit_payload(payload, role)
    return (payload if not feedback else None), feedback


def passing_audit_feedback(path: Path, role: str) -> list[str]:
    payload, feedback = read_audit(path, role)
    if feedback:
        return feedback
    assert payload is not None
    if payload.get("status") != "pass":
        blockers = payload.get("blocking_findings") or []
        detail = "; ".join(blockers) if isinstance(blockers, list) and blockers else "no blocking_findings provided"
        return [f"audit status must be pass, got {payload.get('status')!r}; {detail}"]
    hard_blockers: list[str] = []
    for field in HARD_BLOCKING_FIELDS:
        values = payload.get(field)
        if isinstance(values, list) and values:
            hard_blockers.append(f"{field} must be empty for a passing audit")
            hard_blockers.extend(f"- {value}" for value in values if isinstance(value, str))
    return hard_blockers


def has_agent_result(log_path: str) -> bool:
    if not log_path:
        return True
    path = Path(log_path)
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8", errors="ignore")
    return "MEASURE_AGENT_RESULT" in text and "END_MEASURE_AGENT_RESULT" in text


def gate_command(repo: Path, label: str, command: str, *, expect_failure: bool = False, required: bool = True) -> list[str]:
    if not command:
        return [f"{label} is required but unset"] if required else []
    timeout = int(os.environ.get("PROJECT_GATE_TIMEOUT_SECONDS", os.environ.get("ROLE_TIMEOUT_SECONDS", "3600")))
    result = subprocess.run(
        command,
        cwd=str(repo),
        shell=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
        check=False,
    )
    passed = result.returncode != 0 if expect_failure else result.returncode == 0
    if passed:
        return []
    expectation = "expected failure" if expect_failure else "expected success"
    return [f"{label} failed ({expectation}, exit {result.returncode}): {command}", result.stdout[-4000:]]


def active_registry_contains(repo: Path, track: str) -> bool:
    registry = measure_dir(repo) / "tracks.md"
    if not registry.exists():
        return False
    active = registry.read_text(encoding="utf-8", errors="ignore").split("## Archived Tracks", 1)[0]
    return re.search(rf"(?<![A-Za-z0-9_.-]){re.escape(track)}(?![A-Za-z0-9_.-])", active) is not None


def plan_closeout_feedback(plan_path: Path) -> list[str]:
    if not plan_path.exists():
        return [f"missing closeout plan: {plan_path}"]
    text = plan_path.read_text(encoding="utf-8", errors="ignore")
    feedback: list[str] = []
    for full_line, status, task in re.findall(r"^(\s*- \[([ ~x])\] (.+))$", text, re.MULTILINE):
        if "deferred" in task.lower():
            continue
        if status != "x":
            feedback.append(f"plan task is not complete: {full_line.strip()}")
        elif not re.search(r"\b[0-9a-f]{7,40}\b", task):
            feedback.append(f"completed plan task lacks commit SHA: {full_line.strip()}")
    return feedback


def metadata_closeout_feedback(metadata_path: Path) -> list[str]:
    if not metadata_path.exists():
        return [f"missing metadata: {metadata_path}"]
    try:
        payload = json.loads(metadata_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"metadata is invalid JSON: {exc}"]
    feedback: list[str] = []
    if payload.get("status") != "done":
        feedback.append("metadata status must be done")
    if not isinstance(payload.get("completed"), str) or not payload["completed"].strip():
        feedback.append("metadata must include a completed date")
    return feedback


def closeout_feedback(repo: Path, track: str) -> list[str]:
    archive = measure_dir(repo) / "archive" / track
    active = measure_dir(repo) / "tracks" / track
    feedback: list[str] = []
    if active.exists():
        feedback.append(f"track still exists in active tracks: {active}")
    if not archive.exists():
        feedback.append(f"track is missing from archive: {archive}")
    if active_registry_contains(repo, track):
        feedback.append("track is still listed in the active section of measure/tracks.md")
    feedback.extend(plan_closeout_feedback(archive / "plan.md"))
    feedback.extend(metadata_closeout_feedback(archive / "metadata.json"))
    if not (archive / CLOSEOUT_MANIFEST).exists():
        feedback.append(f"missing closeout manifest: {archive / CLOSEOUT_MANIFEST}")
    return feedback


def normalize_role(role: str) -> str:
    normalized = ROLE_ALIASES.get(role)
    if not normalized:
        valid = ", ".join(sorted(set(ROLE_ALIASES.values())))
        raise SystemExit(f"ERROR: unknown role {role!r}. Valid roles: {valid}")
    return normalized


def cmd_status(args: argparse.Namespace) -> int:
    repo = repo_root(args.repo)
    phases = discover_phases(repo, args.track)
    candidates = closeout_candidates(repo, args.track)
    print(f"repo: {repo}")
    print(f"head: {git_head(repo)}")
    dirty = git_status(repo).strip()
    print("worktree: dirty" if dirty else "worktree: clean")
    if dirty:
        print(dirty)
    print(f"incomplete_phases: {len(phases)}")
    for phase in phases:
        print(f"[{phase.number}] {phase.track} -- {phase.heading} ({phase.incomplete}/{phase.total} remaining)")
    if phases:
        first = phases[0]
        print(f"next_phase: {first.track} -- {first.heading}")
    print(f"closeout_candidates: {len(candidates)}")
    for idx, track in enumerate(candidates, 1):
        print(f"[C{idx}] {track}")
    return 0


def cmd_audit_result(args: argparse.Namespace) -> int:
    role = normalize_role(args.role)
    _payload, feedback = read_audit(Path(args.file), role)
    if feedback:
        for item in feedback:
            print(f"FAIL: {item}")
        return 1
    print("PASS: audit result is valid")
    return 0


def cmd_ux_paths(args: argparse.Namespace) -> int:
    repo = repo_root(args.repo)
    paths = ux_paths(repo, args.baseline)
    for path in paths:
        print(path)
    if args.require and not paths:
        print("FAIL: no UX-relevant paths found")
        return 1
    return 0


def cmd_closeout(args: argparse.Namespace) -> int:
    repo = repo_root(args.repo)
    feedback = closeout_feedback(repo, args.track)
    if feedback:
        for item in feedback:
            print(f"FAIL: {item}")
        return 1
    print("PASS: closeout checks passed")
    return 0


def cmd_role_gate(args: argparse.Namespace) -> int:
    repo = repo_root(args.repo)
    role = normalize_role(args.role)
    plan = measure_dir(repo) / "tracks" / args.track / "plan.md"
    feedback: list[str] = []

    if not has_agent_result(args.log_file):
        feedback.append("missing MEASURE_AGENT_RESULT block")

    if role == "strategy":
        strategy = measure_dir(repo) / "tracks" / args.track / "test-strategy.md"
        if not strategy.exists():
            feedback.append(f"missing test strategy: {strategy}")
    elif role == "mid-red":
        if args.baseline and git_head(repo) == args.baseline:
            feedback.append("expected committed Red-phase test change, but HEAD did not advance")
        total, _complete, in_progress, incomplete, _with_sha = phase_counts(plan, args.phase)
        if total == 0:
            feedback.append(f"could not find phase {args.phase!r} in {plan}")
        elif in_progress == 0 and incomplete > 0:
            feedback.append("expected at least one current phase task marked [~]")
        non_test = non_test_committed_files(repo, args.baseline)
        if non_test:
            feedback.append("Mid Red changed non-test/non-Measure files")
            feedback.extend(f"- {path}" for path in non_test)
        feedback.extend(gate_command(repo, "RED_TEST_COMMAND", os.environ.get("RED_TEST_COMMAND", ""), expect_failure=True))
    elif role == "jr-green":
        if args.baseline and git_head(repo) == args.baseline:
            feedback.append("expected committed Green-phase implementation change, but HEAD did not advance")
        total, complete, _in_progress, incomplete, with_sha = phase_counts(plan, args.phase)
        if total == 0:
            feedback.append(f"could not find phase {args.phase!r} in {plan}")
        elif incomplete:
            feedback.append(f"current phase still has {incomplete} non-deferred incomplete tasks")
        if complete > with_sha:
            feedback.append("some completed [x] tasks lack commit SHA evidence")
        feedback.extend(gate_command(repo, "GREEN_TEST_COMMAND", os.environ.get("GREEN_TEST_COMMAND", "")))
    elif role in {
        "review-a",
        "review-b",
        "review-c",
        "phase-acceptance",
        "adversarial-testing",
        "ux-browser-review",
        "final-acceptance",
        "closeout",
    }:
        if not args.result_file:
            feedback.append("--result-file is required for audit roles")
        else:
            feedback.extend(passing_audit_feedback(Path(args.result_file), role))
        if role in {"review-a", "review-b", "review-c", "phase-acceptance"}:
            total, _complete, _in_progress, incomplete, _with_sha = phase_counts(plan, args.phase)
            if total == 0:
                feedback.append(f"could not find phase {args.phase!r} in {plan}")
            elif incomplete:
                feedback.append(f"current phase still has {incomplete} non-deferred incomplete tasks")
        if role == "adversarial-testing":
            feedback.extend(gate_command(repo, "PROJECT_TESTS", os.environ.get("PROJECT_TESTS", "")))
        if role == "ux-browser-review":
            paths = ux_paths(repo, args.baseline)
            if paths and not os.environ.get("PROJECT_DEV_URL"):
                feedback.append("UX-relevant files changed but PROJECT_DEV_URL is unset")
        if role == "final-acceptance":
            remaining = track_incomplete(plan)
            if remaining:
                feedback.append(f"track still has {remaining} non-deferred incomplete tasks")
            feedback.extend(gate_command(repo, "PROJECT_LINT", os.environ.get("PROJECT_LINT", "")))
            feedback.extend(gate_command(repo, "PROJECT_CHECKS", os.environ.get("PROJECT_CHECKS", "")))
            feedback.extend(gate_command(repo, "PROJECT_TESTS", os.environ.get("PROJECT_TESTS", "")))
        if role == "closeout":
            feedback.extend(closeout_feedback(repo, args.track))

    if feedback:
        for item in feedback:
            print(f"FAIL: {item}")
        return 1
    print(f"PASS: {role} gate passed")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    status = sub.add_parser("status", help="show incomplete phases and closeout candidates")
    status.add_argument("--repo", default="")
    status.add_argument("--track", default="", help="optional track regex")
    status.set_defaults(func=cmd_status)

    audit = sub.add_parser("audit-result", help="validate an audit result JSON file")
    audit.add_argument("--role", required=True)
    audit.add_argument("--file", required=True)
    audit.set_defaults(func=cmd_audit_result)

    ux = sub.add_parser("ux-paths", help="print user-facing changed files since baseline")
    ux.add_argument("--repo", default="")
    ux.add_argument("--baseline", default="")
    ux.add_argument("--require", action="store_true")
    ux.set_defaults(func=cmd_ux_paths)

    closeout = sub.add_parser("closeout", help="validate archived Measure closeout state")
    closeout.add_argument("--repo", default="")
    closeout.add_argument("--track", required=True)
    closeout.set_defaults(func=cmd_closeout)

    role = sub.add_parser("role-gate", help="run the gate for one role handoff")
    role.add_argument("--repo", default="")
    role.add_argument("--role", required=True, help="opencode subagent_type (e.g. measure-jr-green)")
    role.add_argument("--track", required=True)
    role.add_argument("--phase", default="")
    role.add_argument("--baseline", default="")
    role.add_argument("--result-file", default="")
    role.add_argument("--log-file", default="")
    role.set_defaults(func=cmd_role_gate)

    return parser


def main() -> int:
    args = build_parser().parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
