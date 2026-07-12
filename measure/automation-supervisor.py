#!/usr/bin/env python3
"""Supervised Measure automation pipeline.

This script keeps the old automation-script.sh contract conceptually, but moves
supervision into Python so session capture, retries, server restarts, structured
logs, and programmatic gates stay explicit and testable.
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import hashlib
import json
import os
import re
import selectors
import shutil
import shlex
import signal
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Callable, Iterable, Sequence


@dataclasses.dataclass(frozen=True)
class Config:
    repo_root: Path
    measure_dir: Path
    opencode_bin: str
    opencode_server_hostname: str
    opencode_server_port: int
    opencode_server_url: str
    opencode_server_autostart: bool
    opencode_server_log: Path
    opencode_server_pid_file: Path
    opencode_server_start_timeout: int
    sr_model: str
    mid_model: str
    jr_model: str
    review_a_model: str
    review_b_model: str
    review_c_model: str
    phase_acceptance_model: str
    adversarial_model: str
    ux_model: str
    acceptance_model: str
    closeout_model: str
    sr_agent: str
    mid_agent: str
    jr_agent: str
    review_a_agent: str
    review_b_agent: str
    review_c_agent: str
    phase_acceptance_agent: str
    adversarial_agent: str
    ux_agent: str
    acceptance_agent: str
    closeout_agent: str
    sr_runner: str
    mid_runner: str
    jr_runner: str
    review_a_runner: str
    review_b_runner: str
    review_c_runner: str
    phase_acceptance_runner: str
    adversarial_runner: str
    ux_runner: str
    acceptance_runner: str
    closeout_runner: str
    project_paths: str
    project_tests: str
    project_checks: str
    project_lint: str
    project_dev_url: str
    ux_required: str
    red_test_command: str
    green_test_command: str
    project_gate_timeout_seconds: int
    max_agent_attempts: int
    max_infra_restarts: int
    session_cooldown_seconds: int
    require_agent_result_block: bool
    run_root: Path
    run_id: str
    role_timeout_seconds: int
    supervisor_lock_file: Path


@dataclasses.dataclass(frozen=True)
class Phase:
    number: int
    track_id: str
    heading: str
    incomplete: int
    total: int


@dataclasses.dataclass(frozen=True)
class RoleConfig:
    name: str
    model: str
    agent: str
    runner: str


@dataclasses.dataclass
class RoleContext:
    role: RoleConfig
    track_id: str
    phase_heading: str
    plan_file: str
    strategy_file: str
    context_dir: Path
    baseline_sha: str = ""
    pre_head: str = ""
    log_file: Path | None = None
    gate_log: Path | None = None


@dataclasses.dataclass(frozen=True)
class CommandResult:
    returncode: int
    stdout: str
    stderr: str


@dataclasses.dataclass(frozen=True)
class GateResult:
    passed: bool
    feedback: list[str]


ACTIVE_PROCESS_GROUPS: set[int] = set()
ACTIVE_LOCK_FILE: Path | None = None
ACTIVE_CONFIG: Config | None = None

AUDIT_RESULT_SCHEMA_VERSION = 1
AUDIT_RESULT_STATUSES = {"pass", "fail", "inconclusive"}
AUDIT_RESULT_RETRY_RECOMMENDATIONS = {
    "none",
    "retry_tests",
    "retry_implementation",
    "retry_audit",
    "escalate_human",
    "create_remediation_track",
    "infrastructure_retry",
}
AUDIT_RESULT_CONFIDENCE_LEVELS = {"low", "medium", "high"}
AUDIT_RESULT_LIST_FIELDS = (
    "blocking_findings",
    "nonblocking_findings",
    "evidence",
    "commands",
    "changed_files",
)
CLOSEOUT_MANIFEST_NAME = "automation-supervisor-closeout-manifest.json"
EVIDENCE_GATE_TRACK_ID = "measure_apk_evidence_integrity_gates_20260712"

UX_AUTO_INCLUDE_EXACT = {
    "app/index.html",
    "app/tailwind.config.js",
    "app/tailwind.config.ts",
    "app/vite.config.js",
    "app/vite.config.ts",
    "clients/mediarr-client/pubspec.yaml",
}
UX_AUTO_INCLUDE_PREFIXES = (
    "app/src/",
    "app/public/",
    "clients/mediarr-client/lib/",
    "clients/mediarr-client/assets/",
)
UX_AUTO_INCLUDE_SUFFIXES = (".tsx", ".jsx", ".ts", ".js", ".css", ".scss", ".html", ".dart")
UX_AUTO_EXCLUDE_PREFIXES = (
    "measure/",
    "docs/",
    "server/",
    "scripts/",
    "tests/",
    ".github/",
)
UX_AUTO_EXCLUDE_PARTS = ("/__tests__/", "/tests/", "/test/", "/__mocks__/")
UX_AUTO_EXCLUDE_SUFFIXES = (
    ".test.ts",
    ".test.tsx",
    ".test.js",
    ".test.jsx",
    ".spec.ts",
    ".spec.tsx",
    ".spec.js",
    ".spec.jsx",
    "_test.dart",
    ".stories.tsx",
    ".stories.jsx",
    ".md",
    ".mdx",
)


def env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_int(name: str, default: int) -> int:
    value = os.environ.get(name)
    if value is None or value == "":
        return default
    try:
        parsed = int(value)
    except ValueError as exc:
        raise SystemExit(f"ERROR: {name} must be an integer") from exc
    return parsed


def model_env(name: str, default: str) -> str:
    value = os.environ.get(name, default).strip() or default
    model_name = value.rsplit("/", 1)[-1]
    if model_name in {"deepseek-v4-flash", "deepseek-v4-pro"}:
        return f"deepseek/{model_name}"
    return value


def utc_stamp() -> str:
    return dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")


def display_time() -> str:
    return dt.datetime.now(dt.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def sanitize_id(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", value).strip("_") or "item"


def run_command(
    command: Sequence[str] | str,
    *,
    cwd: Path,
    shell: bool = False,
    env: dict[str, str] | None = None,
    timeout: int | None = None,
    stream_log: Path | None = None,
) -> CommandResult:
    process = subprocess.Popen(
        command,
        cwd=str(cwd),
        shell=shell,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    ACTIVE_PROCESS_GROUPS.add(process.pid)
    started = time.monotonic()
    output_parts: list[str] = []
    selector = selectors.DefaultSelector()

    try:
        assert process.stdout is not None
        selector.register(process.stdout, selectors.EVENT_READ)
        while True:
            for key, _ in selector.select(timeout=0.1):
                chunk = os.read(key.fileobj.fileno(), 4096)
                if not chunk:
                    selector.unregister(key.fileobj)
                    continue
                text = chunk.decode(errors="ignore")
                output_parts.append(text)
                if stream_log is not None:
                    append(stream_log, text.rstrip("\n"))

            if process.poll() is not None:
                while selector.get_map():
                    for key in list(selector.get_map().values()):
                        chunk = os.read(key.fileobj.fileno(), 4096)
                        if chunk:
                            text = chunk.decode(errors="ignore")
                            output_parts.append(text)
                            if stream_log is not None:
                                append(stream_log, text.rstrip("\n"))
                        else:
                            selector.unregister(key.fileobj)
                break

            if timeout is not None and time.monotonic() - started > timeout:
                terminate_process_group(process.pid)
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    kill_process_group(process.pid)
                    process.wait()
                timeout_text = f"\nTIMEOUT: command exceeded {timeout} seconds and was terminated\n"
                output_parts.append(timeout_text)
                if stream_log is not None:
                    append(stream_log, timeout_text.rstrip("\n"))
                return CommandResult(124, "".join(output_parts), "")

        return CommandResult(process.returncode or 0, "".join(output_parts), "")
    finally:
        try:
            selector.close()
        finally:
            ACTIVE_PROCESS_GROUPS.discard(process.pid)


def terminate_process_group(pid: int) -> None:
    try:
        os.killpg(pid, signal.SIGTERM)
    except ProcessLookupError:
        pass


def kill_process_group(pid: int) -> None:
    try:
        os.killpg(pid, signal.SIGKILL)
    except ProcessLookupError:
        pass


def cleanup_active_children() -> None:
    for pid in list(ACTIVE_PROCESS_GROUPS):
        terminate_process_group(pid)
    deadline = time.monotonic() + 5
    while ACTIVE_PROCESS_GROUPS and time.monotonic() < deadline:
        time.sleep(0.1)
    for pid in list(ACTIVE_PROCESS_GROUPS):
        kill_process_group(pid)


def release_active_lock() -> None:
    global ACTIVE_LOCK_FILE
    if ACTIVE_LOCK_FILE and ACTIVE_LOCK_FILE.exists():
        try:
            ACTIVE_LOCK_FILE.unlink()
        except OSError:
            pass
    ACTIVE_LOCK_FILE = None


def cleanup_owned_opencode_server() -> None:
    if ACTIVE_CONFIG is not None and server_owned_by_this_run(ACTIVE_CONFIG):
        stop_recorded_opencode_server(ACTIVE_CONFIG)


def handle_signal(signum: int, _frame: object) -> None:
    print(f"\n>>> Received signal {signum}; cleaning up launched child processes only.", file=sys.stderr)
    cleanup_active_children()
    cleanup_owned_opencode_server()
    release_active_lock()
    raise SystemExit(128 + signum)


def append(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(text)
        if not text.endswith("\n"):
            handle.write("\n")


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def git(config: Config, *args: str) -> CommandResult:
    return run_command(["git", *args], cwd=config.repo_root)


def git_head(config: Config) -> str:
    result = git(config, "rev-parse", "HEAD")
    return result.stdout.strip() if result.returncode == 0 else ""


def git_status_porcelain(config: Config) -> str:
    result = git(config, "status", "--porcelain")
    return result.stdout if result.returncode == 0 else ""


def enforce_clean_worktree(config: Config, context: str) -> None:
    dirty = git_status_porcelain(config).strip()
    if not dirty:
        return
    print(
        f"ERROR: Worktree is dirty after {context}. Commit, stash, or clean these changes before the next phase.",
        file=sys.stderr,
    )
    print(dirty, file=sys.stderr)
    raise SystemExit(1)


def dirty_worktree_context(config: Config, *, max_lines: int = 80) -> str:
    dirty = git_status_porcelain(config).strip()
    if not dirty:
        return "Current git status --porcelain: clean."

    lines = dirty.splitlines()
    displayed = lines[:max_lines]
    suffix = ""
    if len(lines) > max_lines:
        suffix = f"\n... truncated {len(lines) - max_lines} additional dirty path(s)"
    return "Current git status --porcelain:\n" + "\n".join(displayed) + suffix


def changed_files_since(config: Config, base_sha: str) -> list[str]:
    files: set[str] = set()
    commands: list[list[str]] = []
    if base_sha:
        commands.append(["diff", "--name-only", f"{base_sha}..HEAD"])
    commands.extend([["diff", "--name-only"], ["diff", "--name-only", "--cached"]])

    for args in commands:
        result = git(config, *args)
        if result.returncode == 0:
            files.update(line.strip() for line in result.stdout.splitlines() if line.strip())
    return sorted(files)


def non_test_source_changes_since(config: Config, base_sha: str) -> list[str]:
    allowed_suffixes = (
        ".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx",
        ".test.js", ".test.jsx", ".spec.js", ".spec.jsx",
        "_test.go", ".bats",
    )
    result = []
    for path in changed_files_since(config, base_sha):
        if path.startswith("measure/"):
            continue
        if path.endswith(allowed_suffixes):
            continue
        if "/__tests__/" in path or "/tests/" in path or path.startswith("tests/"):
            continue
        result.append(path)
    return result


def committed_changes_since(config: Config, base_sha: str) -> list[str]:
    """Files actually committed between base_sha and HEAD.

    Differs from changed_files_since by ignoring the working tree and the
    index; only `git diff base_sha..HEAD --name-only` is consulted. This
    isolates what the agent committed from pre-existing dirty work.
    """
    if not base_sha:
        return []
    result = git(config, "diff", "--name-only", f"{base_sha}..HEAD")
    if result.returncode != 0:
        return []
    return sorted(line.strip() for line in result.stdout.splitlines() if line.strip())


def non_test_committed_changes_since(config: Config, base_sha: str) -> list[str]:
    """Non-test, non-Measure files the agent committed since base_sha.

    Used by gate_mid to enforce the Red-phase boundary: it inspects the
    agent's actual commits, not the working tree. This avoids false
    positives when the worktree was already dirty at role entry (e.g.,
    pre-existing Green work that the Red role is forbidden to modify).
    """
    allowed_suffixes = (
        ".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx",
        ".test.js", ".test.jsx", ".spec.js", ".spec.jsx",
        "_test.go", ".bats",
    )
    result = []
    for path in committed_changes_since(config, base_sha):
        if path.startswith("measure/"):
            continue
        if path.endswith(allowed_suffixes):
            continue
        if "/__tests__/" in path or "/tests/" in path or path.startswith("tests/"):
            continue
        result.append(path)
    return result


def normalize_repo_path(path: str) -> str:
    return path.replace("\\", "/").lstrip("./")


def ux_auto_excluded_path(path: str) -> bool:
    normalized = normalize_repo_path(path)
    if normalized.startswith(UX_AUTO_EXCLUDE_PREFIXES):
        return True
    if any(part in f"/{normalized}" for part in UX_AUTO_EXCLUDE_PARTS):
        return True
    return normalized.endswith(UX_AUTO_EXCLUDE_SUFFIXES)


def ux_auto_relevant_path(path: str) -> bool:
    normalized = normalize_repo_path(path)
    if ux_auto_excluded_path(normalized):
        return False
    if normalized in UX_AUTO_INCLUDE_EXACT:
        return True
    if not normalized.endswith(UX_AUTO_INCLUDE_SUFFIXES):
        return False
    return normalized.startswith(UX_AUTO_INCLUDE_PREFIXES)


def ux_audit_applicable(config: Config, base_sha: str) -> bool:
    if config.ux_required == "never":
        return False
    if config.ux_required == "always":
        return True
    if not config.project_dev_url:
        return False
    return any(ux_auto_relevant_path(path) for path in changed_files_since(config, base_sha))


def audit_result_path(ctx: RoleContext) -> Path:
    return ctx.context_dir / f"{ctx.role.name}-result.json"


def validate_string_list(payload: dict[str, object], field: str) -> list[str]:
    value = payload.get(field)
    if not isinstance(value, list):
        return [f"Audit result field {field!r} must be a list of strings."]
    if not all(isinstance(item, str) and item.strip() for item in value):
        return [f"Audit result field {field!r} must contain only non-empty strings."]
    return []


def validate_audit_payload(payload: object, role: str) -> list[str]:
    if not isinstance(payload, dict):
        return ["Audit result must be a JSON object."]

    feedback: list[str] = []
    if payload.get("schema_version") != AUDIT_RESULT_SCHEMA_VERSION:
        feedback.append(f"Audit result schema_version must be {AUDIT_RESULT_SCHEMA_VERSION}.")
    if payload.get("status") not in AUDIT_RESULT_STATUSES:
        feedback.append("Audit result status must be one of pass, fail, or inconclusive.")
    if not isinstance(payload.get("summary"), str) or not payload["summary"].strip():
        feedback.append("Audit result must include a non-empty summary.")
    if "findings" in payload:
        feedback.append("Audit result must use blocking_findings and nonblocking_findings, not legacy findings.")

    for field in AUDIT_RESULT_LIST_FIELDS:
        feedback.extend(validate_string_list(payload, field))

    retry = payload.get("retry_recommendation")
    if retry not in AUDIT_RESULT_RETRY_RECOMMENDATIONS:
        feedback.append(
            "Audit result retry_recommendation must be one of "
            + ", ".join(sorted(AUDIT_RESULT_RETRY_RECOMMENDATIONS))
            + "."
        )
    confidence = payload.get("confidence")
    if confidence not in AUDIT_RESULT_CONFIDENCE_LEVELS:
        feedback.append("Audit result confidence must be low, medium, or high.")

    if role == "ux":
        if payload.get("webbridge_status") not in {"healthy", "unhealthy"}:
            feedback.append("UX audit must record webbridge_status as healthy or unhealthy.")
        webbridge_evidence = payload.get("webbridge_evidence")
        if not isinstance(webbridge_evidence, dict):
            feedback.append("UX audit must include webbridge_evidence as an object.")
        else:
            evidence_fields = ("screenshots", "accessibility_snapshots", "interactions")
            for field in evidence_fields:
                value = webbridge_evidence.get(field)
                if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
                    feedback.append(f"UX webbridge_evidence.{field} must be a list of non-empty strings.")
            if all(not webbridge_evidence.get(field) for field in evidence_fields):
                feedback.append("UX audit must include at least one screenshot, accessibility snapshot, or interaction.")

    return feedback


def read_passing_audit_result(ctx: RoleContext) -> list[str]:
    result_path = audit_result_path(ctx)
    if not result_path.exists():
        return [f"Expected structured audit result at {result_path}."]
    try:
        payload = json.loads(result_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"Audit result is not valid JSON: {exc}"]

    feedback = validate_audit_payload(payload, ctx.role.name)
    if feedback:
        return feedback

    if payload.get("status") != "pass":
        blocking = payload.get("blocking_findings") or []
        retry = payload.get("retry_recommendation")
        detail = "; ".join(blocking) if blocking else "no blocking_findings provided"
        return [f"Audit result status must be 'pass', got {payload.get('status')!r}; retry_recommendation={retry}; {detail}."]
    return []


def track_is_archived(config: Config, track_id: str) -> bool:
    return (
        not (config.measure_dir / "tracks" / track_id).exists()
        and (config.measure_dir / "archive" / track_id).exists()
    )


def active_registry_contains_track(config: Config, track_id: str) -> bool:
    registry = config.measure_dir / "tracks.md"
    if not registry.exists():
        return False
    active_section = registry.read_text(encoding="utf-8", errors="ignore").split("## Archived Tracks", 1)[0]
    return re.search(rf"(?<![A-Za-z0-9_.-]){re.escape(track_id)}(?![A-Za-z0-9_.-])", active_section) is not None


def track_requires_evidence_gate(config: Config, track_id: str) -> bool:
    """Checks whether a product track transitively names the integrity gate.

    @param config Supervisor configuration.
    @param track_id Candidate track identifier.
    @returns Whether the track is protected by the Phase 4 gate.
    """
    if track_id == EVIDENCE_GATE_TRACK_ID:
        return False
    if track_id.startswith("apk_"):
        return True
    pending = [track_id]
    visited: set[str] = set()
    while pending:
        current = pending.pop()
        if current == EVIDENCE_GATE_TRACK_ID:
            return True
        if current in visited:
            continue
        visited.add(current)
        active = config.measure_dir / "tracks" / current / "metadata.json"
        archived = config.measure_dir / "archive" / current / "metadata.json"
        metadata_path = archived if archived.exists() else active
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        except (OSError, UnicodeDecodeError, json.JSONDecodeError):
            continue
        if not isinstance(metadata, dict):
            continue
        if "dependencies" in metadata:
            return True
        dependencies = metadata.get("depends_on")
        if isinstance(dependencies, list):
            pending.extend(item for item in dependencies if isinstance(item, str))
    return False


def run_evidence_gate(config: Config, track_id: str, stage: str) -> GateResult:
    """Invokes the versioned evidence gate through its subprocess adapter.

    @param config Supervisor configuration.
    @param track_id Protected track identifier.
    @param stage Gate stage, either preflight or completion.
    @returns Supervisor gate result derived only from process output and status.
    """
    if not track_requires_evidence_gate(config, track_id):
        return GateResult(True, [])
    environment = os.environ.copy()
    environment["PYTHONPATH"] = str(config.repo_root)
    environment["PYTHONDONTWRITEBYTECODE"] = "1"
    result = run_command(
        [
            sys.executable,
            "-P",
            "-m",
            "measure.evidence_integrity_gates.cli",
            "supervisor-completion",
            "--repo",
            str(config.repo_root),
            "--track",
            track_id,
            "--stage",
            stage,
        ],
        cwd=config.repo_root,
        env=environment,
        timeout=config.project_gate_timeout_seconds,
    )
    if result.returncode == 0:
        return GateResult(True, [])
    try:
        report = json.loads(result.stdout)
        blockers = report.get("blockers", []) if isinstance(report, dict) else []
        feedback = [
            f"Evidence integrity gate {item.get('code', 'UNKNOWN')}: {item.get('detail', {})}"
            for item in blockers
            if isinstance(item, dict)
        ]
    except json.JSONDecodeError:
        feedback = []
    if not feedback:
        feedback = [f"Evidence integrity gate command failed: {result.stdout}{result.stderr}"]
    return GateResult(False, feedback)


def closeout_track_dir(config: Config, track_id: str) -> Path:
    archived = config.measure_dir / "archive" / track_id
    if archived.exists():
        return archived
    return config.measure_dir / "tracks" / track_id


def closeout_manifest_path(config: Config, track_id: str) -> Path:
    return config.measure_dir / "archive" / track_id / CLOSEOUT_MANIFEST_NAME


def closeout_plan_path(config: Config, track_id: str) -> Path:
    return closeout_track_dir(config, track_id) / "plan.md"


def closeout_metadata_path(config: Config, track_id: str) -> Path:
    return closeout_track_dir(config, track_id) / "metadata.json"


def is_task_structurally_blocked(task: str, status: str | None = None) -> bool:
    """A task is *structurally blocked / human-gated* iff its marker is structured.

    Structured signals:
      - checkbox status 'b' (e.g. `- [b]`)
      - trailing `deferred:<owner>` field (e.g. `… — deferred:phikul`)

    Free-text occurrences of the word "deferred" do NOT count. Substring
    `"deferred" in task.lower()` is intentionally not used; it was being exploited
    by plans to bypass the incomplete-task count without the underlying work being done.
    See measure_integrity_remediation_20260624 Finding 1.
    """
    if status == "b":
        return True
    if re.search(r"\bdeferred:[\w.-]+", task, re.IGNORECASE):
        return True
    return False


def plan_closeout_feedback(plan_path: Path) -> list[str]:
    if not plan_path.exists():
        return [f"Closeout plan file is missing: {plan_path}."]

    text = plan_path.read_text(encoding="utf-8", errors="ignore")
    feedback: list[str] = []
    for full_line, status, task in re.findall(r"^(\s*- \[([~xb])\] (.+))$", text, re.MULTILINE):
        if is_task_structurally_blocked(task, status):
            continue
        if status != "x":
            feedback.append(f"Closeout plan task is not complete: {full_line.strip()}")
        elif not re.search(r"\b[0-9a-f]{7,40}\b", task):
            feedback.append(f"Completed closeout plan task lacks commit SHA: {full_line.strip()}")

    phase_headings = re.findall(r"^## Phase .+$", text, re.MULTILINE)
    if not phase_headings:
        feedback.append("Closeout plan has no Phase headings.")
    for heading in phase_headings:
        if "[checkpoint:" not in heading and "[final-verification:" not in heading:
            feedback.append(f"Closeout phase heading lacks checkpoint evidence: {heading}")
    return feedback


def metadata_closeout_feedback(metadata_path: Path) -> list[str]:
    if not metadata_path.exists():
        return [f"Closeout metadata file is missing: {metadata_path}."]
    try:
        payload = json.loads(metadata_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"Closeout metadata is not valid JSON: {exc}"]
    feedback: list[str] = []
    if payload.get("status") != "done":
        feedback.append("Closeout metadata status must be 'done'.")
    if not isinstance(payload.get("completed"), str) or not payload["completed"].strip():
        feedback.append("Closeout metadata must include a completed date.")
    return feedback


def artifact_closeout_feedback(config: Config, ctx: RoleContext) -> list[str]:
    feedback: list[str] = []
    manifest = closeout_manifest_path(config, ctx.track_id)
    if not manifest.exists():
        feedback.append(f"Closeout manifest is missing: {manifest}.")

    track_artifact_dir = config.run_root / config.run_id / sanitize_id(ctx.track_id)
    if track_artifact_dir.exists():
        stale = sorted(child for child in track_artifact_dir.iterdir() if child.name != "closeout")
        if stale:
            feedback.append("Closeout must delete bulky phase/run artifacts before passing; remaining paths:")
            feedback.extend(f"- {path}" for path in stale[:20])
            if len(stale) > 20:
                feedback.append(f"- ... {len(stale) - 20} more")
    return feedback


def cleanup_remaining_track_artifacts(config: Config, track_id: str) -> bool:
    run_id_dir = config.run_root / config.run_id
    track_artifact_dir = run_id_dir / sanitize_id(track_id)
    if not track_artifact_dir.exists():
        return False
    if track_artifact_dir.parent != run_id_dir or track_artifact_dir == run_id_dir:
        raise SystemExit(f"ERROR: Refusing unsafe artifact cleanup path: {track_artifact_dir}")
    shutil.rmtree(track_artifact_dir)
    return True


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Supervise Measure track completion with restartable agent sessions and mechanical gates.",
    )
    parser.add_argument("--start", type=int, default=1, help="Start from the Nth incomplete phase, 1-based")
    parser.add_argument("--dry-run", action="store_true", help="Preview the plan without executing")
    parser.add_argument("--track", default="", help="Only process tracks matching this regex")
    parser.add_argument("--skip-strategy", action="store_true", help="Skip test-strategy generation")
    parser.add_argument("--limit", type=int, default=0, help="Process at most N phases after --start")
    return parser.parse_args()


def load_config() -> Config:
    script_dir = Path(__file__).resolve().parent
    repo_root = Path(os.environ.get("MEASURE_REPO_ROOT", str(script_dir.parent))).resolve()
    measure_dir = repo_root / "measure"
    explicit_server_url = os.environ.get("OPENCODE_SERVER_URL")
    default_port = env_int("OPENCODE_SERVER_PORT", 4096)
    server_url = explicit_server_url or f"http://localhost:{default_port}"
    parsed_server_url = urllib.parse.urlparse(server_url)
    try:
        url_port = parsed_server_url.port
    except ValueError as exc:
        raise SystemExit(f"ERROR: OPENCODE_SERVER_URL has an invalid port: {server_url}") from exc
    scheme_default_port = 443 if parsed_server_url.scheme == "https" else 80 if parsed_server_url.scheme == "http" else default_port
    port = env_int("OPENCODE_SERVER_PORT", url_port or (scheme_default_port if explicit_server_url else default_port))
    hostname = os.environ.get("OPENCODE_SERVER_HOSTNAME", parsed_server_url.hostname or "127.0.0.1")
    run_id = os.environ.get("RUN_ID", utc_stamp())
    return Config(
        repo_root=repo_root,
        measure_dir=measure_dir,
        opencode_bin=os.environ.get("OPENCODE_BIN", "opencode"),
        opencode_server_hostname=hostname,
        opencode_server_port=port,
        opencode_server_url=server_url,
        opencode_server_autostart=env_bool("OPENCODE_SERVER_AUTOSTART", False),
        opencode_server_log=Path(os.environ.get("OPENCODE_SERVER_LOG", str(measure_dir / "opencode-server.log"))),
        opencode_server_pid_file=Path(os.environ.get("OPENCODE_SERVER_PID_FILE", str(measure_dir / "opencode-server.pid"))),
        opencode_server_start_timeout=env_int("OPENCODE_SERVER_START_TIMEOUT", 30),
        sr_model=model_env("SR_MODEL", "vocengine-coding/glm-5.2"),
        mid_model=model_env("MID_MODEL", "minimax-cn-coding-plan/MiniMax-M3"),
        jr_model=model_env("JR_MODEL", "deepseek/deepseek-v4-pro"),
        review_a_model=model_env("REVIEW_A_MODEL", "kimi-for-coding/k2p7"),
        review_b_model=model_env("REVIEW_B_MODEL", "deepseek/deepseek-v4-pro"),
        review_c_model=model_env("REVIEW_C_MODEL", "xiaomi/mimo-v2.5"),
        phase_acceptance_model=model_env("PHASE_ACCEPTANCE_MODEL", "vocengine-coding/glm-5.2"),
        adversarial_model=model_env("ADVERSARIAL_MODEL", "minimax-cn-coding-plan/MiniMax-M3"),
        ux_model=model_env("UX_MODEL", "kimi-for-coding/k2p7"),
        acceptance_model=model_env("ACCEPTANCE_MODEL", "openai/gpt-5.5"),
        closeout_model=model_env("CLOSEOUT_MODEL", "deepseek/deepseek-v4-flash"),
        sr_agent=os.environ.get("SR_AGENT", ""),
        mid_agent=os.environ.get("MID_AGENT", ""),
        jr_agent=os.environ.get("JR_AGENT", ""),
        review_a_agent=os.environ.get("REVIEW_A_AGENT", ""),
        review_b_agent=os.environ.get("REVIEW_B_AGENT", ""),
        review_c_agent=os.environ.get("REVIEW_C_AGENT", ""),
        phase_acceptance_agent=os.environ.get("PHASE_ACCEPTANCE_AGENT", ""),
        adversarial_agent=os.environ.get("ADVERSARIAL_AGENT", ""),
        ux_agent=os.environ.get("UX_AGENT", ""),
        acceptance_agent=os.environ.get("ACCEPTANCE_AGENT", ""),
        closeout_agent=os.environ.get("CLOSEOUT_AGENT", ""),
        sr_runner=os.environ.get("SR_RUNNER", ""),
        mid_runner=os.environ.get("MID_RUNNER", ""),
        jr_runner=os.environ.get("JR_RUNNER", ""),
        review_a_runner=os.environ.get("REVIEW_A_RUNNER", ""),
        review_b_runner=os.environ.get("REVIEW_B_RUNNER", ""),
        review_c_runner=os.environ.get("REVIEW_C_RUNNER", ""),
        phase_acceptance_runner=os.environ.get("PHASE_ACCEPTANCE_RUNNER", ""),
        adversarial_runner=os.environ.get("ADVERSARIAL_RUNNER", ""),
        ux_runner=os.environ.get("UX_RUNNER", ""),
        acceptance_runner=os.environ.get("ACCEPTANCE_RUNNER", ""),
        closeout_runner=os.environ.get("CLOSEOUT_RUNNER", ""),
        project_paths=os.environ.get("PROJECT_PATHS", "."),
        project_tests=os.environ.get("PROJECT_TESTS", "npm test"),
        project_checks=os.environ.get("PROJECT_CHECKS", "npm run build"),
        project_lint=os.environ.get("PROJECT_LINT", "npm run lint"),
        project_dev_url=os.environ.get("PROJECT_DEV_URL", ""),
        ux_required=os.environ.get("UX_REQUIRED", "auto").strip().lower(),
        red_test_command=os.environ.get("RED_TEST_COMMAND", ""),
        green_test_command=os.environ.get("GREEN_TEST_COMMAND", os.environ.get("PROJECT_TESTS", "npm test")),
        project_gate_timeout_seconds=env_int("PROJECT_GATE_TIMEOUT_SECONDS", env_int("ROLE_TIMEOUT_SECONDS", 3600)),
        max_agent_attempts=env_int("MAX_AGENT_ATTEMPTS", 3),
        max_infra_restarts=env_int("MAX_INFRA_RESTARTS", 3),
        session_cooldown_seconds=env_int("SESSION_COOLDOWN_SECONDS", 0),
        require_agent_result_block=env_bool("REQUIRE_AGENT_RESULT_BLOCK", True),
        run_root=Path(os.environ.get("RUN_ROOT", str(measure_dir / "runs"))),
        run_id=run_id,
        role_timeout_seconds=env_int("ROLE_TIMEOUT_SECONDS", 3600),
        supervisor_lock_file=Path(os.environ.get("SUPERVISOR_LOCK_FILE", f"/tmp/measure-supervisor-{hashlib.sha1(str(repo_root).encode()).hexdigest()[:12]}.lock")),
    )


def validate_config(config: Config, args: argparse.Namespace) -> None:
    if args.start < 1:
        raise SystemExit("ERROR: --start must be a positive integer")
    if args.limit < 0:
        raise SystemExit("ERROR: --limit must be non-negative")
    if config.max_agent_attempts < 1:
        raise SystemExit("ERROR: MAX_AGENT_ATTEMPTS must be at least 1")
    if config.max_infra_restarts < 0:
        raise SystemExit("ERROR: MAX_INFRA_RESTARTS must be non-negative")
    if config.session_cooldown_seconds < 0:
        raise SystemExit("ERROR: SESSION_COOLDOWN_SECONDS must be non-negative")
    if config.role_timeout_seconds < 1:
        raise SystemExit("ERROR: ROLE_TIMEOUT_SECONDS must be positive")
    if config.project_gate_timeout_seconds < 1:
        raise SystemExit("ERROR: PROJECT_GATE_TIMEOUT_SECONDS must be positive")
    if config.ux_required not in {"auto", "always", "never"}:
        raise SystemExit("ERROR: UX_REQUIRED must be auto, always, or never")


def discover_tracks(config: Config, track_filter: str) -> list[str]:
    tracks_dir = config.measure_dir / "tracks"
    tracks = sorted(path.name for path in tracks_dir.iterdir() if path.is_dir())
    if track_filter:
        pattern = re.compile(track_filter)
        tracks = [track for track in tracks if pattern.search(track)]
    return tracks


def discover_phases(config: Config, tracks: Iterable[str]) -> list[Phase]:
    phases: list[Phase] = []
    for track_id in tracks:
        plan_path = config.measure_dir / "tracks" / track_id / "plan.md"
        if not plan_path.exists():
            continue
        text = plan_path.read_text(encoding="utf-8", errors="ignore")
        for block in re.split(r"(?=^## Phase )", text, flags=re.MULTILINE):
            heading_match = re.match(r"^## (Phase .+)", block, re.MULTILINE)
            if not heading_match:
                continue
            heading = re.sub(r" *\[(checkpoint|final-verification):[^\]]*\]", "", heading_match.group(1))
            tasks = re.findall(r"^- \[([~xb])\] (.+)", block, re.MULTILINE)
            incomplete = sum(
                1
                for status, task in tasks
                if status != "x"
                and not is_task_structurally_blocked(task, status)
            )
            if incomplete > 0:
                phases.append(Phase(len(phases) + 1, track_id, heading, incomplete, len(tasks)))
    return phases


def print_plan(config: Config, tracks: list[str], phases: list[Phase], start: int) -> None:
    print()
    print("+--------------------------------------------------------------+")
    print("|   Measure -- Supervised TDD Production Pipeline              |")
    print("+--------------------------------------------------------------+")
    print()
    print(f"Repository: {config.repo_root}")
    print(f"OpenCode:   {config.opencode_server_url}")
    print(f"Models:     SR={config.sr_model} | MID={config.mid_model} | JR={config.jr_model}")
    print(
        "Reviewers:  "
        f"A={config.review_a_model} | B={config.review_b_model} | C={config.review_c_model}"
    )
    print(
        "Auditors:   "
        f"PHASE={config.phase_acceptance_model} | ADVERSARIAL={config.adversarial_model} | "
        f"UX={config.ux_model} | ACCEPTANCE={config.acceptance_model} | CLOSEOUT={config.closeout_model}"
    )
    print(f"Run logs:   {config.run_root / config.run_id}")
    print(f"Tracks selected: {len(tracks)}")
    print(f"Incomplete phases found: {len(phases)} (completed phases are skipped)")
    print()
    for phase in phases:
        suffix = "  (skipped)" if phase.number < start else ""
        print(f"  [{phase.number}] {phase.track_id} -- {phase.heading}  ({phase.incomplete}/{phase.total} remaining){suffix}")
    print()


def pid_is_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True


def acquire_supervisor_lock(config: Config, args: argparse.Namespace) -> None:
    global ACTIVE_LOCK_FILE
    lock_file = config.supervisor_lock_file
    lock_file.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "pid": os.getpid(),
        "repo_root": str(config.repo_root),
        "track_filter": args.track,
        "start": args.start,
        "limit": args.limit,
        "run_id": config.run_id,
        "created_at": display_time(),
    }
    payload_text = json.dumps(payload, indent=2) + "\n"

    while True:
        try:
            fd = os.open(lock_file, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
        except FileExistsError:
            try:
                existing_payload = json.loads(lock_file.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                existing_payload = {}
            pid = existing_payload.get("pid")
            if isinstance(pid, int) and pid_is_running(pid):
                raise SystemExit(
                    f"ERROR: Supervisor lock is active at {lock_file} for pid {pid}. "
                    "Stop that run before starting another."
                )
            print(f">>> Removing stale supervisor lock at {lock_file}")
            try:
                lock_file.unlink()
            except FileNotFoundError:
                pass
            continue

        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(payload_text)
        ACTIVE_LOCK_FILE = lock_file
        return

def server_owner_file(config: Config) -> Path:
    return config.opencode_server_pid_file.with_suffix(config.opencode_server_pid_file.suffix + ".owner")


def server_owned_by_this_run(config: Config) -> bool:
    owner = server_owner_file(config)
    if not owner.exists():
        return False
    try:
        payload = json.loads(owner.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return False
    return payload.get("run_id") == config.run_id and payload.get("pid_file") == str(config.opencode_server_pid_file)


def opencode_server_reachable(config: Config) -> bool:
    try:
        with urllib.request.urlopen(config.opencode_server_url, timeout=2) as response:
            return response.status != 0
    except urllib.error.HTTPError as exc:
        return exc.code > 0
    except (OSError, urllib.error.URLError):
        return False


def start_opencode_server(config: Config) -> None:
    print(f">>> Starting owned OpenCode server at {config.opencode_server_url}")
    config.opencode_server_log.parent.mkdir(parents=True, exist_ok=True)
    config.opencode_server_pid_file.parent.mkdir(parents=True, exist_ok=True)
    log_handle = config.opencode_server_log.open("ab")
    process = subprocess.Popen(
        [
            config.opencode_bin,
            "serve",
            "--hostname",
            config.opencode_server_hostname,
            "--port",
            str(config.opencode_server_port),
        ],
        cwd=str(config.repo_root),
        stdout=log_handle,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    config.opencode_server_pid_file.write_text(f"{process.pid}\n", encoding="utf-8")
    server_owner_file(config).write_text(json.dumps({"run_id": config.run_id, "pid": process.pid, "pid_file": str(config.opencode_server_pid_file), "created_at": display_time()}, indent=2) + "\n", encoding="utf-8")


def ensure_opencode_server(config: Config) -> bool:
    if opencode_server_reachable(config):
        print(f">>> Reusing shared OpenCode server at {config.opencode_server_url}")
        return True

    if not config.opencode_server_autostart:
        print(f"ERROR: No OpenCode server is reachable at {config.opencode_server_url}")
        print("Start it yourself, or set OPENCODE_SERVER_AUTOSTART=true for an owned test server.")
        return False

    start_opencode_server(config)
    deadline = time.monotonic() + config.opencode_server_start_timeout
    while time.monotonic() < deadline:
        if opencode_server_reachable(config):
            print(f">>> Shared OpenCode server is ready at {config.opencode_server_url}")
            return True
        time.sleep(1)

    print(f"ERROR: OpenCode server did not become reachable within {config.opencode_server_start_timeout} seconds")
    print(f"Log: {config.opencode_server_log}")
    return False


def stop_recorded_opencode_server(config: Config) -> None:
    if not server_owned_by_this_run(config):
        print(">>> Not stopping OpenCode server: it is not owned by this supervisor run")
        return
    if not config.opencode_server_pid_file.exists():
        return
    raw = config.opencode_server_pid_file.read_text(encoding="utf-8", errors="ignore").strip()
    if not raw.isdigit():
        return
    pid = int(raw)
    try:
        os.kill(pid, signal.SIGTERM)
        print(f">>> Stopped owned OpenCode server pid {pid}")
    except ProcessLookupError:
        pass
    except PermissionError:
        print(f">>> Could not stop owned OpenCode server pid {pid}; permission denied")
    try:
        server_owner_file(config).unlink()
    except FileNotFoundError:
        pass


def restart_opencode_server(config: Config) -> bool:
    if not server_owned_by_this_run(config):
        print(">>> Not restarting OpenCode server: current server is shared or externally owned")
        return opencode_server_reachable(config)
    print(">>> Restarting owned OpenCode server")
    stop_recorded_opencode_server(config)
    time.sleep(1)
    return ensure_opencode_server(config)


def infra_failure_text(text: str) -> bool:
    lowered = text.lower()
    patterns = [
        "connection refused",
        "connection reset",
        "connection closed",
        "econnrefused",
        "econnreset",
        "socket hang up",
        "failed to fetch",
        "fetch failed",
        "bad gateway",
        "service unavailable",
        "gateway timeout",
        "timed out",
        "timeout",
        "server did not become reachable",
        "no opencode server",
        "no open code server",
    ]
    return any(pattern in lowered for pattern in patterns)


def extract_session_id_from_events(events_file: Path) -> str:
    if not events_file.exists():
        return ""

    def walk(value: object, parent_key: str = "") -> str:
        if isinstance(value, dict):
            for key, item in value.items():
                normalized = key.replace("-", "_").lower()
                if normalized in {"sessionid", "session_id"} and isinstance(item, str):
                    return item
                if normalized == "session" and isinstance(item, dict):
                    for id_key in ("id", "sessionID", "sessionId", "session_id"):
                        sid = item.get(id_key)
                        if isinstance(sid, str):
                            return sid
                found = walk(item, normalized)
                if found:
                    return found
        elif isinstance(value, list):
            for item in value:
                found = walk(item, parent_key)
                if found:
                    return found
        elif parent_key == "session" and isinstance(value, str) and re.match(r"^[0-9A-Za-z_-]{16,}$", value):
            return value
        return ""

    for line in events_file.read_text(encoding="utf-8", errors="ignore").splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        found = walk(event)
        if found:
            return found
    return ""


def has_agent_result_block(log_file: Path, required: bool) -> bool:
    if not required:
        return True
    if not log_file.exists():
        return False
    text = log_file.read_text(encoding="utf-8", errors="ignore")
    return "MEASURE_AGENT_RESULT" in text and "END_MEASURE_AGENT_RESULT" in text


def agent_result_contract(role: str) -> str:
    return f"""

At the end of your response, include this exact machine-readable block:

MEASURE_AGENT_RESULT
role: {role}
status: complete|blocked|partial
track: <track id>
phase: <phase heading or track setup/review>
commits: <short shas or none>
tests_run: <commands and pass/fail result>
files_changed: <brief list>
plan_updates: <brief summary>
known_failures: <none or exact remaining failures>
handoff: <what the next role or supervisor should know>
END_MEASURE_AGENT_RESULT
"""


def audit_result_contract(ctx: RoleContext, extra_fields: str = "") -> str:
    return f"""

Write a machine-readable audit result to {audit_result_path(ctx)} using this JSON shape:
{{
  "schema_version": {AUDIT_RESULT_SCHEMA_VERSION},
  "status": "pass|fail|inconclusive",
  "summary": "concise evidence-based conclusion",
  "blocking_findings": ["specific issue that blocks this role from passing, or empty"],
  "nonblocking_findings": ["specific follow-up that does not block, or empty"],
  "evidence": ["files, logs, screenshots, or artifacts reviewed"],
  "commands": ["commands run with pass/fail result, or explicit not-run reason"],
  "changed_files": ["files changed by this role, or empty"],
  "retry_recommendation": "none|retry_tests|retry_implementation|retry_audit|escalate_human|create_remediation_track|infrastructure_retry",
  "confidence": "low|medium|high"{extra_fields}
}}
Only use status "pass" when blocking_findings is empty and the role has enough evidence.
Use "inconclusive" for infrastructure/tooling failures that should not be treated as acceptance.
"""


def retry_policy_text() -> str:
    return """Retry and escalation policy:
- If the failure is a clear test or implementation gap, fix only that gap and rerun the smallest relevant command first.
- If the failure is a clear audit-evidence/schema gap, rewrite the audit result without changing product code.
- If the finding requires product judgment, scope tradeoffs, or acceptance of degraded UX, stop with status blocked/partial and request human input.
- If the same blocking class recurs after bounded retries, preserve evidence and recommend a remediation track instead of looping.
- If infrastructure, network, or tool instability prevents a reliable result, mark the audit inconclusive; do not archive the track.
"""


def feedback_prompt(role: str, track_id: str, phase_heading: str, feedback: list[str], log_file: Path, gate_log: Path) -> str:
    feedback_text = "\n".join(feedback)
    return f"""You are continuing the same Measure automation session after supervisor gates failed.

Role: {role}
Track: {track_id}
Phase: {phase_heading}

Fix only the issues listed below. Preserve valid work from the previous attempt.
After fixing, rerun the relevant checks, update Measure docs, commit required changes,
and end with the required MEASURE_AGENT_RESULT block.

{retry_policy_text()}
Supervisor feedback:
{feedback_text}

Relevant logs:
- Agent log: {log_file}
- Gate log: {gate_log}
"""


def run_project_gate(config: Config, name: str, command: str, log_file: Path, expect_failure: bool = False) -> bool:
    if not command:
        append(log_file, f"SKIP: {name} (no command configured)")
        return True
    append(log_file, f"RUN: {name} -> {command}")
    gate_env = os.environ.copy()
    gate_env["CI"] = "true"
    result = run_command(
        command,
        cwd=config.repo_root,
        shell=True,
        env=gate_env,
        timeout=config.project_gate_timeout_seconds,
    )
    append(log_file, result.stdout)
    append(log_file, result.stderr)
    append(log_file, f"EXIT_STATUS: {result.returncode}")
    if result.returncode == 124:
        return False
    return result.returncode != 0 if expect_failure else result.returncode == 0


def phase_counts(plan_path: Path, phase_heading: str) -> tuple[int, int, int, int, int]:
    text = plan_path.read_text(encoding="utf-8", errors="ignore")
    for block in re.split(r"(?=^## Phase )", text, flags=re.MULTILINE):
        heading_match = re.match(r"^## (Phase .+)", block, re.MULTILINE)
        if not heading_match:
            continue
        display = re.sub(r" *\[(checkpoint|final-verification):[^\]]*\]", "", heading_match.group(1))
        if display != phase_heading:
            continue
        tasks = re.findall(r"^- \[([~xb])\] (.+)", block, re.MULTILINE)
        total = len(tasks)
        complete = sum(1 for status, _ in tasks if status == "x")
        in_progress = sum(1 for status, _ in tasks if status == "~")
        incomplete = sum(
            1
            for status, task in tasks
            if status != "x"
            and not is_task_structurally_blocked(task, status)
        )
        with_sha = sum(1 for status, task in tasks if status == "x" and re.search(r"\b[0-9a-f]{7,40}\b", task))
        return total, complete, in_progress, incomplete, with_sha
    return 0, 0, 0, 0, 0


def track_incomplete_count(plan_path: Path) -> int:
    text = plan_path.read_text(encoding="utf-8", errors="ignore")
    tasks = re.findall(r"^- \[([~xb])\] (.+)", text, re.MULTILINE)
    return sum(
        1
        for status, task in tasks
        if status != "x"
        and not is_task_structurally_blocked(task, status)
    )


def gate_strategy(config: Config, ctx: RoleContext) -> GateResult:
    feedback: list[str] = []
    if not (config.repo_root / ctx.strategy_file).exists():
        feedback.append(f"Expected {ctx.strategy_file} to exist, but it was not created.")
    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")
    return GateResult(not feedback, feedback)


def gate_mid(config: Config, ctx: RoleContext) -> GateResult:
    feedback: list[str] = []
    head_after = git_head(config)
    if ctx.pre_head and head_after == ctx.pre_head:
        feedback.append("Expected a committed Red-phase test change, but HEAD did not advance.")

    total, _complete, in_progress, incomplete, _with_sha = phase_counts(config.repo_root / ctx.plan_file, ctx.phase_heading)
    if total == 0:
        feedback.append(f"Could not find phase '{ctx.phase_heading}' in {ctx.plan_file}.")
    elif in_progress == 0 and incomplete > 0:
        feedback.append("Expected at least one current phase task to be marked [~] after Red work.")

    non_test_changes = non_test_committed_changes_since(config, ctx.pre_head)
    if non_test_changes:
        feedback.append("Mid role changed non-test/non-Measure files, which violates the Red-phase boundary:")
        feedback.extend(f"- {path}" for path in non_test_changes)

    if ctx.gate_log and config.red_test_command:
        if not run_project_gate(config, "Red test command (expected failure)", config.red_test_command, ctx.gate_log, expect_failure=True):
            feedback.append("RED_TEST_COMMAND passed, but Red-phase tests should fail before implementation.")

    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")

    return GateResult(not feedback, feedback)


def gate_jr(config: Config, ctx: RoleContext) -> GateResult:
    feedback: list[str] = []
    head_after = git_head(config)
    if ctx.pre_head and head_after == ctx.pre_head:
        feedback.append("Expected a committed Green-phase implementation change, but HEAD did not advance.")

    total, complete, _in_progress, incomplete, with_sha = phase_counts(config.repo_root / ctx.plan_file, ctx.phase_heading)
    if total == 0:
        feedback.append(f"Could not find phase '{ctx.phase_heading}' in {ctx.plan_file}.")
    elif incomplete > 0:
        feedback.append(f"Current phase still has {incomplete} non-deferred incomplete task(s).")
    if complete > with_sha:
        feedback.append("Some completed [x] tasks in this phase do not include a commit SHA.")

    if ctx.gate_log and not run_project_gate(config, "Green test command", config.green_test_command, ctx.gate_log):
        feedback.append(f"GREEN_TEST_COMMAND failed: {config.green_test_command}. See {ctx.gate_log}")

    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")

    evidence_gate = run_evidence_gate(config, ctx.track_id, "completion")
    feedback.extend(evidence_gate.feedback)

    return GateResult(not feedback, feedback)


def gate_review_a(config: Config, ctx: RoleContext) -> GateResult:
    """Correctness and architecture reviewer: audit-result based."""
    feedback = read_passing_audit_result(ctx)
    total, _complete, _in_progress, incomplete, _with_sha = phase_counts(
        config.repo_root / ctx.plan_file, ctx.phase_heading
    )
    if total == 0:
        feedback.append(f"Could not find phase '{ctx.phase_heading}' in {ctx.plan_file}.")
    elif incomplete:
        feedback.append(f"Current phase still has {incomplete} non-deferred incomplete task(s).")
    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")
    return GateResult(not feedback, feedback)


def gate_review_b(config: Config, ctx: RoleContext) -> GateResult:
    """Security and data-handling reviewer: audit-result based."""
    feedback = read_passing_audit_result(ctx)
    total, _complete, _in_progress, incomplete, _with_sha = phase_counts(
        config.repo_root / ctx.plan_file, ctx.phase_heading
    )
    if total == 0:
        feedback.append(f"Could not find phase '{ctx.phase_heading}' in {ctx.plan_file}.")
    elif incomplete:
        feedback.append(f"Current phase still has {incomplete} non-deferred incomplete task(s).")
    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")
    return GateResult(not feedback, feedback)


def gate_review_c(config: Config, ctx: RoleContext) -> GateResult:
    """UX/API E2E reviewer: audit-result based."""
    feedback = read_passing_audit_result(ctx)
    total, _complete, _in_progress, incomplete, _with_sha = phase_counts(
        config.repo_root / ctx.plan_file, ctx.phase_heading
    )
    if total == 0:
        feedback.append(f"Could not find phase '{ctx.phase_heading}' in {ctx.plan_file}.")
    elif incomplete:
        feedback.append(f"Current phase still has {incomplete} non-deferred incomplete task(s).")
    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")
    return GateResult(not feedback, feedback)


def gate_phase_acceptance(config: Config, ctx: RoleContext) -> GateResult:
    feedback = read_passing_audit_result(ctx)
    total, complete, _in_progress, incomplete, with_sha = phase_counts(config.repo_root / ctx.plan_file, ctx.phase_heading)
    if total == 0:
        feedback.append(f"Could not find phase '{ctx.phase_heading}' in {ctx.plan_file}.")
    elif incomplete:
        feedback.append(f"Current phase still has {incomplete} non-deferred incomplete task(s).")
    if complete > with_sha:
        feedback.append("Some completed [x] tasks in this phase do not include a commit SHA.")
    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")
    return GateResult(not feedback, feedback)


def gate_adversarial(config: Config, ctx: RoleContext) -> GateResult:
    feedback = read_passing_audit_result(ctx)
    if ctx.gate_log and not run_project_gate(config, "Adversarial regression tests", config.project_tests, ctx.gate_log):
        feedback.append(f"PROJECT_TESTS failed after adversarial audit: {config.project_tests}")
    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")
    return GateResult(not feedback, feedback)


def gate_ux(config: Config, ctx: RoleContext) -> GateResult:
    feedback = read_passing_audit_result(ctx)
    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")
    return GateResult(not feedback, feedback)


def gate_acceptance(config: Config, ctx: RoleContext) -> GateResult:
    feedback = read_passing_audit_result(ctx)
    incomplete = track_incomplete_count(config.repo_root / ctx.plan_file)
    if incomplete:
        feedback.append(f"Track still has {incomplete} non-deferred incomplete task(s).")
    if ctx.gate_log:
        checks = [
            ("Lint", config.project_lint),
            ("Build/check", config.project_checks),
            ("Tests", config.project_tests),
        ]
        doctor = config.measure_dir / "doctor.sh"
        if doctor.exists() and os.access(doctor, os.X_OK):
            checks.append(("Measure doctor", "./measure/doctor.sh"))
        for name, command in checks:
            if not run_project_gate(config, name, command, ctx.gate_log):
                feedback.append(f"{name} failed: {command}")
    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")
    evidence_gate = run_evidence_gate(config, ctx.track_id, "completion")
    feedback.extend(evidence_gate.feedback)
    return GateResult(not feedback, feedback)


def gate_closeout(config: Config, ctx: RoleContext) -> GateResult:
    feedback = read_passing_audit_result(ctx)
    if not track_is_archived(config, ctx.track_id):
        feedback.append(
            f"Track must be moved from measure/tracks/{ctx.track_id} to measure/archive/{ctx.track_id}."
        )
    if active_registry_contains_track(config, ctx.track_id):
        feedback.append("measure/tracks.md still lists the track in its active section.")
    feedback.extend(plan_closeout_feedback(closeout_plan_path(config, ctx.track_id)))
    feedback.extend(metadata_closeout_feedback(closeout_metadata_path(config, ctx.track_id)))
    feedback.extend(artifact_closeout_feedback(config, ctx))
    if ctx.log_file and not has_agent_result_block(ctx.log_file, config.require_agent_result_block):
        feedback.append("Missing required MEASURE_AGENT_RESULT block.")
    return GateResult(not feedback, feedback)


def gate_for_role(config: Config, ctx: RoleContext) -> GateResult:
    gates: dict[str, Callable[[Config, RoleContext], GateResult]] = {
        "strategy": gate_strategy,
        "mid": gate_mid,
        "jr": gate_jr,
        "review_a": gate_review_a,
        "review_b": gate_review_b,
        "review_c": gate_review_c,
        "phase_acceptance": gate_phase_acceptance,
        "adversarial": gate_adversarial,
        "ux": gate_ux,
        "acceptance": gate_acceptance,
        "closeout": gate_closeout,
    }
    return gates[ctx.role.name](config, ctx)


def run_role_once(config: Config, ctx: RoleContext, prompt: str, session_file: Path, attempt_dir: Path) -> CommandResult:
    attempt_dir.mkdir(parents=True, exist_ok=True)
    events_file = attempt_dir / "events.jsonl"
    output_log = attempt_dir / "output.log"
    ctx.log_file = output_log
    ctx.gate_log = attempt_dir / "gates.log"
    ctx.pre_head = git_head(config)

    append(output_log, f"STARTED_AT: {display_time()}")

    if ctx.role.runner:
        command = [*shlex.split(ctx.role.runner), prompt]
    else:
        if not ensure_opencode_server(config):
            return CommandResult(70, "", "OpenCode server is unavailable")
        command = [
            config.opencode_bin,
            "run",
            "--format",
            "json",
            "--attach",
            config.opencode_server_url,
            "--dir",
            str(config.repo_root),
            "-m",
            ctx.role.model,
        ]
        if ctx.role.agent:
            command.extend(["--agent", ctx.role.agent])
        if session_file.exists() and session_file.read_text(encoding="utf-8").strip():
            command.extend(["--session", session_file.read_text(encoding="utf-8").strip()])
        command.append(prompt)

    append(output_log, "COMMAND: " + " ".join(shlex.quote(part) for part in command[:-1]) + " <prompt>")
    result = run_command(command, cwd=config.repo_root, timeout=config.role_timeout_seconds, stream_log=output_log)
    append(output_log, f"EXIT_STATUS: {result.returncode}")
    append(output_log, f"ENDED_AT: {display_time()}")

    if not ctx.role.runner:
        write(events_file, result.stdout)
        session_id = extract_session_id_from_events(events_file)
        if session_id:
            write(session_file, session_id)
            append(output_log, f"SESSION_ID: {session_id}")

    return result


def role_label(ctx: RoleContext) -> str:
    return f"{ctx.role.name}:{ctx.role.model}"


def supervise_role(config: Config, ctx: RoleContext, initial_prompt: str) -> None:
    ctx.context_dir.mkdir(parents=True, exist_ok=True)
    session_file = ctx.context_dir / f"{ctx.role.name}.session"
    feedback_file = ctx.context_dir / f"{ctx.role.name}.feedback.md"
    prompt = initial_prompt
    attempts = 0
    infra_restarts = 0

    while attempts < config.max_agent_attempts:
        attempts += 1
        attempt_dir = ctx.context_dir / f"{ctx.role.name}-attempt-{attempts}"
        print(f">>> [{role_label(ctx)}] attempt {attempts}/{config.max_agent_attempts}")
        result = run_role_once(config, ctx, prompt, session_file, attempt_dir)

        if config.session_cooldown_seconds:
            time.sleep(config.session_cooldown_seconds)

        combined = "\n".join([result.stdout, result.stderr])
        if result.returncode != 0 and not ctx.role.runner and infra_failure_text(combined):
            if infra_restarts < config.max_infra_restarts:
                infra_restarts += 1
                if server_owned_by_this_run(config):
                    print(f">>> [{role_label(ctx)}] infrastructure-looking failure; restarting owned OpenCode ({infra_restarts}/{config.max_infra_restarts})")
                    restart_opencode_server(config)
                    attempts -= 1
                    continue
                print(f">>> [{role_label(ctx)}] infrastructure-looking failure; shared OpenCode server will not be restarted")

        if result.returncode != 0:
            gate = GateResult(False, [f"Agent command exited with status {result.returncode}. See {ctx.log_file}"])
        else:
            gate = gate_for_role(config, ctx)

        if gate.passed:
            print(f">>> [{role_label(ctx)}] supervisor gates passed")
            return

        prompt = feedback_prompt(ctx.role.name, ctx.track_id, ctx.phase_heading, gate.feedback, ctx.log_file or attempt_dir / "output.log", ctx.gate_log or attempt_dir / "gates.log")
        write(feedback_file, prompt)
        if attempts >= config.max_agent_attempts:
            print(f"ERROR: [{role_label(ctx)}] failed supervisor gates after {config.max_agent_attempts} attempts")
            print(f"Feedback: {feedback_file}")
            raise SystemExit(1)

        if session_file.exists() and session_file.read_text(encoding="utf-8").strip():
            print(f">>> [{role_label(ctx)}] feeding supervisor feedback into original session {session_file.read_text(encoding='utf-8').strip()}")
        else:
            print(f">>> [{role_label(ctx)}] no session id captured; retrying with supervisor feedback as a new session")


def has_more_phases(phases: list[Phase], current: Phase) -> bool:
    return any(phase.number > current.number and phase.track_id == current.track_id for phase in phases)


def main() -> int:
    global ACTIVE_CONFIG
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)
    args = parse_args()
    config = load_config()
    ACTIVE_CONFIG = config
    validate_config(config, args)

    tracks = discover_tracks(config, args.track)
    if not tracks:
        print(f"No tracks found matching filter: {args.track}")
        return 0

    phases = discover_phases(config, tracks)
    if not phases:
        failed = False
        for track_id in tracks:
            evidence_gate = run_evidence_gate(config, track_id, "completion")
            if track_requires_evidence_gate(config, track_id):
                print(f"Evidence gate status: {'PASS' if evidence_gate.passed else 'BLOCKED'} ({track_id})")
            if not evidence_gate.passed:
                failed = True
                for item in evidence_gate.feedback:
                    print(f"- {item}", file=sys.stderr)
        if failed:
            return 1
        print()
        print("All phases are already complete! Nothing to run.")
        return 0

    if args.start > len(phases):
        print(f"ERROR: --start must be between 1 and {len(phases)}", file=sys.stderr)
        return 2

    print_plan(config, tracks, phases, args.start)
    sys.stdout.flush()
    if args.dry_run:
        failed = False
        for track_id in tracks:
            stage = "preflight" if any(phase.track_id == track_id for phase in phases) else "completion"
            evidence_gate = run_evidence_gate(config, track_id, stage)
            if track_requires_evidence_gate(config, track_id):
                print(f"Evidence gate status: {'PASS' if evidence_gate.passed else 'BLOCKED'} ({track_id}, {stage})")
            if not evidence_gate.passed:
                failed = True
                for item in evidence_gate.feedback:
                    print(f"- {item}", file=sys.stderr)
        print("DRY RUN -- no commands will be executed.")
        print(f"Would start from phase {args.start}.")
        return 1 if failed else 0

    startup_dirty = git_status_porcelain(config).strip()
    if startup_dirty:
        print(">>> Worktree is dirty at startup; MID will classify and resolve it against the selected track/phase.")
        print(startup_dirty)

    acquire_supervisor_lock(config, args)

    config.run_root.joinpath(config.run_id).mkdir(parents=True, exist_ok=True)
    if not ensure_opencode_server(config):
        return 1

    roles = {
        "strategy": RoleConfig("strategy", config.sr_model, config.sr_agent, config.sr_runner),
        "mid": RoleConfig("mid", config.mid_model, config.mid_agent, config.mid_runner),
        "jr": RoleConfig("jr", config.jr_model, config.jr_agent, config.jr_runner),
        "review_a": RoleConfig("review_a", config.review_a_model, config.review_a_agent, config.review_a_runner),
        "review_b": RoleConfig("review_b", config.review_b_model, config.review_b_agent, config.review_b_runner),
        "review_c": RoleConfig("review_c", config.review_c_model, config.review_c_agent, config.review_c_runner),
        "phase_acceptance": RoleConfig("phase_acceptance", config.phase_acceptance_model, config.phase_acceptance_agent, config.phase_acceptance_runner),
        "adversarial": RoleConfig("adversarial", config.adversarial_model, config.adversarial_agent, config.adversarial_runner),
        "ux": RoleConfig("ux", config.ux_model, config.ux_agent, config.ux_runner),
        "acceptance": RoleConfig("acceptance", config.acceptance_model, config.acceptance_agent, config.acceptance_runner),
        "closeout": RoleConfig("closeout", config.closeout_model, config.closeout_agent, config.closeout_runner),
    }
    strategy_checked: set[str] = set()

    selected_phases = phases[args.start - 1:]
    if args.limit:
        selected_phases = selected_phases[:args.limit]

    for phase in selected_phases:
        plan_file = f"measure/tracks/{phase.track_id}/plan.md"
        strategy_file = f"measure/tracks/{phase.track_id}/test-strategy.md"
        safe_track = sanitize_id(phase.track_id)
        safe_phase = sanitize_id(phase.heading)
        phase_dir = config.run_root / config.run_id / safe_track / f"phase-{phase.number}-{safe_phase}"
        phase_base_sha = git_head(config)

        evidence_preflight = run_evidence_gate(config, phase.track_id, "preflight")
        if not evidence_preflight.passed:
            print(f"ERROR: Evidence gate preflight blocked {phase.track_id}", file=sys.stderr)
            for item in evidence_preflight.feedback:
                print(f"- {item}", file=sys.stderr)
            return 1

        print("==============================================================")
        print(f"  Phase {phase.number} of {len(phases)}: {phase.heading}")
        print(f"  Track:  {phase.track_id}")
        print(f"  Plan:   {plan_file}")
        print(f"  Tasks:  {phase.incomplete}/{phase.total} remaining")
        print("==============================================================")
        print()

        if not args.skip_strategy and phase.track_id not in strategy_checked:
            if not (config.repo_root / strategy_file).exists():
                prompt = (
                    f"Load the measure skill and the build-graph skill. Read measure/index.md, {plan_file}, "
                    f"and measure/tracks/{phase.track_id}/spec.md if it exists. Use build-graph to understand "
                    "the project before planning tests: check whether graph.db exists and is fresh; run "
                    "build-graph stats ./graph.db when available, or build-graph scan ./ ./graph.db when the "
                    "graph is missing or stale and the project is TypeScript. Use build-graph search/inspect/callers "
                    "for symbols related to this track. You are the Tech Lead for this track. Write a concise "
                    "test-strategy.md in the same directory with: (1) testing pyramid guidance per phase, "
                    "(2) shared test fixtures or mocks, (3) cross-phase edge cases and dependencies, "
                    "(4) architecture guardrails, (5) brief per-phase test approach notes, and "
                    "(6) build-graph findings that shaped the strategy, and (7) a live-proof plan naming the "
                    "exact targeted Red command and Green/closeout gate for each phase. Explicitly distinguish "
                    "artifact/documentation contract tests from tests that prove live behavior. Fake harnesses "
                    "may be used for runner plumbing only; any production gate command they cover must also have "
                    "a bounded non-fake smoke or command-construction proof that cannot fall through into a full "
                    "suite unexpectedly. Call out any intentionally-red test files that would be discovered by "
                    "aggregate suites and state how they are excluded or owned by a still-[~] task. Keep it under 140 lines. "
                    "Do NOT write implementation code. Do NOT modify existing source files."
                    + agent_result_contract("strategy")
                )
                ctx = RoleContext(roles["strategy"], phase.track_id, "track setup", plan_file, strategy_file, config.run_root / config.run_id / safe_track / "strategy")
                supervise_role(config, ctx, prompt)
            else:
                print(f">>> Using existing test-strategy.md for {phase.track_id}")
            strategy_checked.add(phase.track_id)

        dirty_context = dirty_worktree_context(config)
        mid_prompt = (
            f"Load the measure skill and the build-graph skill. Read measure/index.md, {strategy_file}, and {plan_file}. "
            f"Focus on the current phase: {phase.heading}. Use build-graph before writing tests: run build-graph stats "
            "./graph.db when available, and use build-graph search/inspect/callers on symbols, files, routes, components, "
            "or schemas related to this phase. If graph.db is missing or stale and the project is TypeScript, run "
            "build-graph scan ./ ./graph.db first. You own the Red phase for every currently incomplete non-deferred task "
            "in this phase. Mark tasks as [~] before starting. Write tests first and do not implement feature logic. "
            f"Dirty worktree context at MID start:\n{dirty_context}\n"
            "If the worktree is dirty, inspect git status and diffs before editing. Classify every dirty path as "
            "relevant to this track/phase, generated/ignorable, or unrelated user work. Preserve unrelated user work: "
            "do not overwrite, revert, or hide it in this track's commit. If dirty changes are relevant, fold them "
            "into the Red-phase plan/test commit with explicit plan notes. If they are unrelated and cannot be safely "
            "resolved while keeping the phase-end worktree clean, stop and report blocked with exact files and rationale. "
            "Do NOT modify existing source code except test files and Measure docs. Before writing tests, choose the "
            "single most targeted Red command you will run and make it bounded: use specific test files/cases, no watch "
            "mode, no unbounded full-suite smoke unless the phase explicitly requires it. If testing a shell runner or "
            "fake harness, prove the fake mode intercepts the exact command path or test the command string directly; "
            "do not create a 'smoke' test that can accidentally run the real full suite. Red tests must fail because "
            "the current implementation is missing or wrong, not merely because a durable record is stale. Artifact or "
            "markdown assertions are allowed only when the phase deliverable is that artifact, and they must be paired "
            "with a live-behavior proof or an explicit plan note saying which later role owns the live gate. Run the "
            "targeted Red command, confirm the new tests fail for the expected missing behavior, and record the command "
            "plus fail count in plan.md. If the new tests pass at HEAD, tighten the contract until at least one new test "
            "fails or mark the task as already satisfied with evidence instead of creating a false Red phase. Commit tests with a descriptive "
            f"Conventional Commit message. Work in the project codebase paths: {config.project_paths}."
            + agent_result_contract("mid")
        )
        supervise_role(config, RoleContext(roles["mid"], phase.track_id, phase.heading, plan_file, strategy_file, phase_dir), mid_prompt)

        jr_prompt = (
            f"/goal Load the measure skill and the build-graph skill. Read {plan_file} and the tests just written for phase "
            f"{phase.heading}. Use build-graph before implementation: run build-graph stats ./graph.db when available, "
            "inspect the symbols/files touched by the failing tests, and use build-graph callers/deps to understand blast "
            "radius before changing exported functions, schemas, routes, or components. If graph.db is missing or stale "
            "and the project is TypeScript, run build-graph scan ./ ./graph.db first. You own the Green phase for every "
            "currently incomplete non-deferred task in this phase. Implement feature logic to make the Red tests pass. "
            f"Follow existing code patterns in {config.project_paths}. Do NOT modify the tests unless you can demonstrate "
            "they contradict the spec or existing test style. Do NOT create new architectural patterns or utility libraries. "
            "First rerun the exact targeted Red command recorded by the Mid role and make it pass. Then run "
            f"{config.green_test_command} and any more targeted checks needed. Do not treat fake-harness success, markdown "
            "PASS strings, or stale closeout artifacts as proof that a live gate is green. If a full gate remains red, "
            "identify the owning track from concrete failing files; keep this phase's task [~] if the failure is owned "
            "by this phase or if the closeout rule requires the real gate. Commit implementation with a descriptive "
            "Conventional Commit message. Update plan.md: mark completed tasks as [x] only after the targeted Red command "
            "and required live gate are green, and record commit SHAs. If structural "
            "TypeScript files changed, update graph.db with build-graph update ./graph.db <changed-files> before commit. "
            "Closeout boundary: If this phase includes tasks to archive or close the track (e.g., move the track directory "
            "to 99-archive/ or measure/archive/, update measure/tracks.md to mark the track [x] archived), do NOT execute "
            "those archive actions yourself. Mark the tasks as [x] in plan.md with commit SHA evidence, and leave the "
            "physical archive move, tracks.md archive update, metadata.json status change, and closeout manifest to the "
            "dedicated Measure Closeout Steward that runs after the Final Acceptance Auditor. The Closeout Steward will "
            "perform the actual closeout once the gpt-5.5 final acceptance audit passes."
            + agent_result_contract("jr")
        )
        supervise_role(config, RoleContext(roles["jr"], phase.track_id, phase.heading, plan_file, strategy_file, phase_dir), jr_prompt)

        review_a_ctx = RoleContext(
            roles["review_a"],
            phase.track_id,
            phase.heading,
            plan_file,
            strategy_file,
            phase_dir / "review-a",
            baseline_sha=phase_base_sha,
        )
        review_a_prompt = (
            f"Load the measure skill and the build-graph skill. You are Reviewer A for {phase.track_id}, {phase.heading}. "
            "Your focus is correctness and architecture. Read ONLY the current phase section of "
            f"{plan_file} (skip older attempt history), the track spec, and {strategy_file} if it exists. "
            "Use build-graph to inspect changed symbols, callers, and dependencies for this phase. "
            "Verify the implementation is correct, follows existing patterns, introduces no unnecessary abstractions, "
            "and that tests prove live behavior. If you find blocking issues, add focused tests or fixes and commit. "
            "Be concise; do not re-read the full plan history."
            + audit_result_contract(review_a_ctx)
            + agent_result_contract("review_a")
        )
        supervise_role(config, review_a_ctx, review_a_prompt)

        review_b_ctx = RoleContext(
            roles["review_b"],
            phase.track_id,
            phase.heading,
            plan_file,
            strategy_file,
            phase_dir / "review-b",
            baseline_sha=phase_base_sha,
        )
        review_b_prompt = (
            f"Load the measure skill and the build-graph skill. You are Reviewer B for {phase.track_id}, {phase.heading}. "
            "Your focus is security and data handling. Read ONLY the current phase section of "
            f"{plan_file} (skip older attempt history), the track spec, and the changed source/test files. "
            "Audit for input validation, injection risks, auth/z boundaries, secret handling, sensitive data exposure, "
            "and data-flow integrity. Use build-graph to trace changed symbols. If you find blocking issues, "
            "add focused tests or fixes and commit. Be concise; do not re-read the full plan history."
            + audit_result_contract(review_b_ctx)
            + agent_result_contract("review_b")
        )
        supervise_role(config, review_b_ctx, review_b_prompt)

        review_c_ctx = RoleContext(
            roles["review_c"],
            phase.track_id,
            phase.heading,
            plan_file,
            strategy_file,
            phase_dir / "review-c",
            baseline_sha=phase_base_sha,
        )
        review_c_prompt = (
            f"Load the measure skill and the kimi-webbridge skill if browser behavior applies. You are Reviewer C for "
            f"{phase.track_id}, {phase.heading}. Your focus is UX/API end-to-end experience. Read ONLY the current phase "
            f"section of {plan_file} (skip older attempt history), the track spec, and the changed source files. "
            "For API changes, verify endpoint contracts and error responses. For UX changes, use Kimi WebBridge to "
            f"inspect changed flows at {config.project_dev_url}. Do not duplicate the dedicated UX auditor or adversarial "
            "Playwright tests; focus on gaps. If you find blocking issues, fix them or report clearly. Be concise."
            + audit_result_contract(review_c_ctx)
            + agent_result_contract("review_c")
        )
        supervise_role(config, review_c_ctx, review_c_prompt)

        phase_acceptance_ctx = RoleContext(
            roles["phase_acceptance"],
            phase.track_id,
            phase.heading,
            plan_file,
            strategy_file,
            phase_dir / "phase-acceptance",
            baseline_sha=phase_base_sha,
        )
        phase_acceptance_prompt = (
            f"/goal Load the measure skill and build-graph skill. You are the independent Phase Acceptance Auditor for "
            f"{phase.track_id}, {phase.heading}. Read measure/index.md, the track spec, {plan_file}, and {strategy_file} "
            "if it exists. Compare every phase task and applicable acceptance criterion against the implementation, tests, "
            f"and git changes since {phase_base_sha}. Use build-graph callers/deps for changed exported contracts. Look for "
            "missing behavior, shallow tests, stubs, unhandled failure paths, fake-harness masking, artifact-only tests that "
            "claim live behavior, intentionally-red tests left in aggregate suites, and plan/commit-SHA mismatches. Rerun the "
            "phase's targeted Red/Green commands without fake gate environment variables unless the test is specifically about "
            "fake-mode plumbing. Correct blocking issues you can prove, add focused regression tests, commit fixes, and re-audit before passing."
            + audit_result_contract(phase_acceptance_ctx)
            + agent_result_contract("phase_acceptance")
        )
        supervise_role(config, phase_acceptance_ctx, phase_acceptance_prompt)

        adversarial_ctx = RoleContext(
            roles["adversarial"],
            phase.track_id,
            phase.heading,
            plan_file,
            strategy_file,
            phase_dir / "adversarial",
            baseline_sha=phase_base_sha,
        )
        adversarial_prompt = (
            f"/goal Load the measure skill and the build-graph skill. You are the Adversarial Test Auditor for {phase.track_id}, {phase.heading}. "
            f"Read the spec, {plan_file}, {strategy_file} if present, and inspect changes since {phase_base_sha}. Use "
            "build-graph to inspect changed symbols, callers, dependencies, and exported contracts. Try to disprove "
            "correctness with boundary, failure-path, integration, concurrency, and regression tests. Inspect existing "
            "tests for weak assertions, excessive mocking, substring assertions that match negated text, fake harnesses that do "
            "not intercept the real command, and documentation assertions standing in for live gate proof. When browser behavior "
            "is applicable, own durable Playwright E2E coverage and run it. Add and commit valuable tests and any tightly scoped fixes they expose. Run the relevant "
            f"suite, including {config.project_tests}, before passing."
            + audit_result_contract(adversarial_ctx)
            + agent_result_contract("adversarial")
        )
        supervise_role(config, adversarial_ctx, adversarial_prompt)

        if ux_audit_applicable(config, phase_base_sha):
            ux_ctx = RoleContext(
                roles["ux"],
                phase.track_id,
                phase.heading,
                plan_file,
                strategy_file,
                phase_dir / "ux",
                baseline_sha=phase_base_sha,
            )
            ux_prompt = (
                f"Load the measure skill and the kimi-webbridge skill and follow both exactly. You are the multimodal UI/UX Auditor for "
                f"{phase.track_id}, {phase.heading}. First run the required Kimi WebBridge health check. Use the real browser "
                f"to inspect and exercise the changed user-facing flows at {config.project_dev_url}. Review relevant spec "
                "acceptance criteria, visual hierarchy, spacing, responsiveness, loading/empty/error states, labels, keyboard "
                "usability, and accessibility semantics. Do not duplicate Playwright ownership. Capture screenshots using the "
                "skill helper, record interaction/accessibility evidence, correct proven UX defects, commit fixes, and re-audit. "
                "Close the WebBridge session at the end."
                + audit_result_contract(
                    ux_ctx,
                    ',\n  "webbridge_status": "healthy|unhealthy",\n  "webbridge_evidence": {"screenshots": [], "accessibility_snapshots": [], "interactions": []}'
                )
                + agent_result_contract("ux")
            )
            supervise_role(config, ux_ctx, ux_prompt)
        else:
            print(f">>> [ux] skipped for {phase.heading}: UX_REQUIRED={config.ux_required}, PROJECT_DEV_URL={config.project_dev_url or '<unset>'}")

        if not has_more_phases(phases, phase):
            acceptance_ctx = RoleContext(
                roles["acceptance"],
                phase.track_id,
                "track acceptance",
                plan_file,
                strategy_file,
                config.run_root / config.run_id / safe_track / "acceptance",
                baseline_sha=phase_base_sha,
            )
            acceptance_prompt = (
                f"/goal Load the measure skill and build-graph skill. You are the Final Acceptance Auditor for track "
                f"{phase.track_id}. Read measure/index.md, the complete spec, {plan_file}, {strategy_file} if it exists, "
                "measure/lessons-learned.md, and measure/tech-debt.md. Independently verify every non-deferred acceptance "
                "criterion and task, changed callers and contracts, test quality, and the complete track outcome. Treat recorded "
                "markdown results as evidence to cross-check, not proof by themselves. Search for fake-gate masking, stale "
                "intentional-red suites in aggregate test paths, stale 'Red at HEAD' comments after green work, and any [x] task "
                "whose own targeted command or required live gate is still red. Correct proven blocking issues and commit them. "
                "Run the full lint, build/check, and test gates before passing, with fake gate environment variables unset unless "
                "the command explicitly tests fake-mode plumbing."
                + audit_result_contract(acceptance_ctx)
                + agent_result_contract("acceptance")
            )
            supervise_role(config, acceptance_ctx, acceptance_prompt)

            closeout_ctx = RoleContext(
                roles["closeout"],
                phase.track_id,
                "track closeout",
                plan_file,
                strategy_file,
                config.run_root / config.run_id / safe_track / "closeout",
                baseline_sha=phase_base_sha,
            )
            closeout_prompt = (
                f"/goal Load the measure skill and the build-graph skill. You are the Measure Closeout Steward for {phase.track_id}. The final acceptance "
                "audit has passed. Verify all tasks and phase headings are complete with required commit/checkpoint evidence. "
                "Use build-graph when closeout touches generated graph artifacts, exported contracts, or changed TypeScript structure. "
                "Before archiving, rerun the required closeout gates in real mode (for example, use env -u VERIFY_FAKE_GATE_DIR "
                "for verify-style commands) and do not rely only on closeout-verification.md or plan.md PASS text. Confirm there "
                "are no intentionally-red test files in aggregate suites unless the track remains active and the plan names the "
                "owner. Update metadata.json to status done with today's date, update measure/tracks.md, update lessons-learned.md or "
                "tech-debt.md only when warranted, move the track directory from measure/tracks/ to measure/archive/, and write "
                f"a compact closeout manifest at measure/archive/{phase.track_id}/{CLOSEOUT_MANIFEST_NAME}. The manifest must summarize "
                "audit statuses, commands, commit/checkpoint SHAs, retained evidence, and deleted artifact directories. Delete bulky "
                f"run artifacts under {config.run_root / config.run_id / safe_track} before passing, but keep the current closeout "
                "context long enough for the supervisor to read your audit result. Commit the closeout and manifest. Do not leave the completed track active."
                + audit_result_contract(closeout_ctx)
                + agent_result_contract("closeout")
            )
            supervise_role(config, closeout_ctx, closeout_prompt)
            if cleanup_remaining_track_artifacts(config, phase.track_id):
                print(f">>> Removed remaining supervisor artifacts for {phase.track_id}")
            print(f">>> Final acceptance and Measure closeout complete for {phase.track_id}")

        enforce_clean_worktree(config, f"{phase.track_id} -- {phase.heading}")
        print(f"  Phase {phase.number} of {len(phases)} passed supervised gates.")
        print()

    print()
    print("+--------------------------------------------------------------+")
    print(f"|   All {len(selected_phases)} selected phases processed and gated!                 |")
    print("+--------------------------------------------------------------+")
    print()
    release_active_lock()
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    finally:
        cleanup_active_children()
        cleanup_owned_opencode_server()
        release_active_lock()
