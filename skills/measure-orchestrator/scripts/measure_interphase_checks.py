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
    "spec-review": "spec-review",
    "spec_review": "spec-review",
    "measure-spec-review": "spec-review",
    "orchestrator-audit": "orchestrator-audit",
    "measure-orchestrator-audit": "orchestrator-audit",
}

SPEC_REVIEW_FINDING_RE = re.compile(r"^F[1-9][0-9]* \[(Blocker|Major|Nit)\] .+?: .+")
DISPOSITIONS_ITEM_RE = re.compile(r"F[1-9][0-9]*=(FIX|DECLINE|(CONTEST|ESCALATE)\((.+)\))")
DISPOSITIONS_PREFIX = "dispositions:"
# A control character (C0 except tab, and DEL) or a zero-width character inside
# a dispositions value is invisible or misleading in the rendered finding text.
CONTROL_OR_ZERO_WIDTH_RE = re.compile("[\x00-\x08\x0b-\x1f\x7f-\x9f\u061c\u200b\u200c\u200d\u200e\u200f\u2028\u2029\u202a-\u202e\u2060\u2066-\u2069\ufeff]")
AGENT_RESULT_START = "MEASURE_AGENT_RESULT"
AGENT_RESULT_END = "END_MEASURE_AGENT_RESULT"
# The two forms of a commit's track id: the subject tag `(track_id: <id>)` and a
# whole body line `track_id: <id>`. git parses no trailer key with `_`, so the
# checker reads the lines itself.
TRACK_ID_PATTERN = r"[A-Za-z0-9][A-Za-z0-9_.-]*"
TRACK_TAG_RE = re.compile(rf"\(track_id: ({TRACK_ID_PATTERN})\)")
TRACK_LINE_RE = re.compile(rf"track_id: ({TRACK_ID_PATTERN})")
TEST_SUFFIXES = (
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


def history_files(repo: Path, baseline: str) -> set[str]:
    """Every path a commit in `baseline..HEAD` touched, including intermediate ones.

    A tree diff (`git diff baseline..HEAD`) hides a path that one commit added and
    a later commit removed, or changed and reverted. The mid-red, audit-scope, and
    spec-review scope rules must see that work, so the per-commit file list is
    unioned in.
    """
    if not baseline:
        return set()
    revisions = git(repo, "rev-list", f"{baseline}..HEAD")
    if revisions.returncode != 0:
        return set()
    files: set[str] = set()
    for revision in revisions.stdout.split():
        result = git(repo, "diff-tree", "--no-commit-id", "--name-only", "-r", "-z", "--no-renames", revision)
        if result.returncode == 0:
            files.update(path for path in result.stdout.split("\0") if path)
    return files


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
    files.update(history_files(repo, baseline))
    return sorted(files)


def committed_files(repo: Path, baseline: str) -> list[str]:
    """Files changed between `baseline` and HEAD, with both sides of a rename.

    Rename detection is forced off, so a rename is reported as a deletion of the
    old path plus an addition of the new one — the same rule the spec-review
    scope listing uses. Without it a rename prints only the new path and the
    mid-red check can miss a production file moved into `tests/`. `-z` keeps
    paths with spaces intact.
    """
    if not baseline:
        return []
    result = git(repo, "diff", "--name-only", "--no-renames", "-z", f"{baseline}..HEAD")
    files = {path for path in result.stdout.split("\0") if path.strip()} if result.returncode == 0 else set()
    files.update(history_files(repo, baseline))
    return sorted(files)


def non_test_paths(paths: list[str] | set[str]) -> list[str]:
    result: list[str] = []
    for path in sorted(paths):
        if path.startswith("measure/"):
            continue
        if path.endswith(TEST_SUFFIXES):
            continue
        if "/__tests__/" in path or "/tests/" in path or path.startswith("tests/"):
            continue
        result.append(path)
    return result


def non_test_committed_files(repo: Path, baseline: str) -> list[str]:
    return non_test_paths(committed_files(repo, baseline))


def commit_track_ids(message: str) -> list[str]:
    """The track ids of one commit message, in first-seen order, each one time.

    The subject line gives each `(track_id: <id>)` tag. A later line gives an id
    when its whole text, after the strip of spaces, is `track_id: <id>`.
    """
    lines = message.split("\n")
    ids = TRACK_TAG_RE.findall(lines[0])
    for line in lines[1:]:
        match = TRACK_LINE_RE.fullmatch(line.strip())
        if match:
            ids.append(match.group(1))
    return list(dict.fromkeys(ids))


def is_track_folder(repo: Path, track_id: str) -> bool:
    return any((measure_dir(repo) / folder / track_id).is_dir() for folder in ("tracks", "archive"))


@dataclass(frozen=True)
class RedScope:
    own: list[str]
    skipped: list[tuple[str, list[str]]]


def red_scope(repo: Path, baseline: str, track: str) -> RedScope | None:
    """Sort each commit of `baseline..HEAD` as a commit of `track` or of another track.

    A commit belongs to another track when it has one or more track ids, no id is
    `track`, and each id names a folder in `measure/tracks/` or `measure/archive/`.
    Every other commit belongs to `track` (fail closed). The result is None when the
    range has no commit of another track or git cannot list the range: the mid-red
    gate then reads the full range, as before.
    """
    if not baseline:
        return None
    log = git(repo, "log", "-z", "--no-show-signature", "--format=%H%n%B", f"{baseline}..HEAD")
    if log.returncode != 0:
        return None
    own: list[str] = []
    skipped: list[tuple[str, list[str]]] = []
    for record in log.stdout.split("\0"):
        sha, _, message = record.strip("\n").partition("\n")
        if not sha:
            continue
        ids = commit_track_ids(message)
        if ids and track not in ids and all(is_track_folder(repo, track_id) for track_id in ids):
            skipped.append((sha, ids))
        else:
            own.append(sha)
    return RedScope(own, skipped) if skipped else None


def commit_paths(repo: Path, revision: str) -> set[str] | None:
    """Every path one commit changed; for a merge, only the paths the merge changed itself."""
    result = git(repo, "diff-tree", "-r", "--root", "--cc", "--no-renames", "-z", "--name-only", "--no-commit-id", revision)
    if result.returncode != 0:
        return None
    return {path for path in result.stdout.split("\0") if path}


def scoped_changed_files(repo: Path, baseline: str, track: str) -> list[str] | None:
    """Every path the track's own commits of `baseline..HEAD` changed, or None.

    None means "no usable track scope" — no baseline, no track, no commit of another
    track in the range, or a commit whose paths cannot be read — and the caller keeps the
    full-range behavior. A commit of another track is proven by `red_scope` (its ids name
    track folders and none is this track), so narrowing is fail closed.
    """
    scope = red_scope(repo, baseline, track) if track else None
    if scope is None:
        return None
    paths: set[str] = set()
    for sha in scope.own:
        commit = commit_paths(repo, sha)
        if commit is None:
            return None
        paths.update(commit)
    return sorted(paths)


def own_commits_after(repo: Path, baseline: str, track: str) -> list[str] | None:
    """The track's own commits in `baseline..HEAD`, or None when the track scope does not apply."""
    scope = red_scope(repo, baseline, track) if track else None
    return None if scope is None else scope.own


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


def ux_paths(repo: Path, baseline: str, track: str = "") -> list[str]:
    include_prefixes = split_env_list("UX_INCLUDE_PREFIXES", "app/src/,app/public/,src/,frontend/,web/,client/")
    include_suffixes = split_env_list("UX_INCLUDE_SUFFIXES", ".tsx,.jsx,.ts,.js,.css,.scss,.html,.dart")
    exclude_prefixes = split_env_list("UX_EXCLUDE_PREFIXES", "measure/,docs/,server/,scripts/,tests/,.github/")
    exclude_parts = split_env_list("UX_EXCLUDE_PARTS", "/__tests__/,/tests/,/test/,/__mocks__/")
    exclude_suffixes = split_env_list(
        "UX_EXCLUDE_SUFFIXES",
        ".test.ts,.test.tsx,.spec.ts,.spec.tsx,.test.js,.test.jsx,.spec.js,.spec.jsx,_test.dart,.stories.tsx,.stories.jsx,.md,.mdx",
    )
    relevant: list[str] = []
    # With a track, only the track's own commits are read (spec-review/UX track scope);
    # without one, or when the scope does not apply, the full range is read as before.
    scoped = scoped_changed_files(repo, baseline, track)
    changed = scoped if scoped is not None else changed_files(repo, baseline)
    for path in changed:
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
    if role == "spec-review":
        feedback.extend(validate_spec_review_payload(payload))
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


def validate_spec_review_payload(payload: dict[str, object]) -> list[str]:
    feedback: list[str] = []
    paraphrase = payload.get("paraphrase")
    if not isinstance(paraphrase, dict):
        feedback.append("paraphrase must be an object with proposes and current_system")
    else:
        for field in ("proposes", "current_system"):
            value = paraphrase.get(field)
            if not isinstance(value, str) or not value.strip():
                feedback.append(f"paraphrase.{field} must be a non-empty string")
    findings: dict[str, list[tuple[str, str]]] = {}
    for field in ("blocking_findings", "nonblocking_findings"):
        values = payload.get(field)
        valid: list[tuple[str, str]] = []
        if isinstance(values, list):
            for finding in values:
                if not isinstance(finding, str):
                    continue
                match = SPEC_REVIEW_FINDING_RE.fullmatch(finding)
                if not match or len(finding.splitlines()) != 1:
                    feedback.append(f"spec-review finding has an invalid format: {finding}")
                else:
                    valid.append((match.group(1), finding))
        findings[field] = valid
    for severity, finding in findings["blocking_findings"]:
        if severity != "Blocker":
            feedback.append(f"blocking_findings may contain only [Blocker] findings: {finding}")
    for severity, finding in findings["nonblocking_findings"]:
        if severity == "Blocker":
            feedback.append(f"nonblocking_findings may contain only [Major] or [Nit] findings: {finding}")
    status = payload.get("status")
    blocking = payload.get("blocking_findings")
    if status == "pass" and isinstance(blocking, list) and blocking:
        feedback.append("spec-review status pass requires empty blocking_findings")
    if status == "fail" and payload.get("retry_recommendation") != "escalate_human":
        feedback.append("spec-review status fail requires retry_recommendation escalate_human")
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
    """A missing path, a folder, or another non-file path counts as no log."""
    if not log_path:
        return True
    path = Path(log_path)
    if not path.is_file():
        return False
    text = path.read_text(encoding="utf-8", errors="ignore")
    markers = {line.strip() for line in text.split("\n")}
    return AGENT_RESULT_START in markers and AGENT_RESULT_END in markers


def dispositions_feedback(log_path: str) -> list[str]:
    """Validate the optional `dispositions:` line of the last result block (S3).

    The line is optional. Without the line, this returns no feedback. The value `none` is
    valid. Any other value is a `;`-separated list of items. Each item must match the whole
    item pattern after `strip()`, and the text of CONTEST and ESCALATE needs a non-space
    character. The log splits on LF only, so a CR or another separator cannot hide an
    invalid item inside the line.

    The block ends at the last `END_MEASURE_AGENT_RESULT` line that has a
    `MEASURE_AGENT_RESULT` line above it. It starts at the first
    `MEASURE_AGENT_RESULT` line after the last `END_MEASURE_AGENT_RESULT` line that comes
    before the last start line of the block, or at the first start line of the log when no
    such end line exists. Every `dispositions:` line in that range is read, so a second
    start line inside the block cannot hide an invalid line above it. A log without an end
    line gives no feedback. A path that is not a file, such as a folder, gives no feedback.
    Each line list is scanned a fixed number of times, so the cost
    grows linearly with the number of log lines.
    """
    if not log_path:
        return []
    path = Path(log_path)
    if not path.is_file():
        return []
    with path.open(encoding="utf-8", errors="ignore", newline="") as handle:
        text = handle.read()
    lines = text.split("\n")
    starts = [index for index, line in enumerate(lines) if line.strip() == AGENT_RESULT_START]
    ends = [index for index, line in enumerate(lines) if line.strip() == AGENT_RESULT_END]
    last_end = -1
    if starts:
        first_start = starts[0]
        for index in ends:
            if first_start < index:
                last_end = index
    if last_end < 0:
        return []
    starts_before_end = [start for start in starts if start < last_end]
    if not starts_before_end:
        return []
    earlier_ends = [index for index in ends if index < starts_before_end[-1]]
    floor = earlier_ends[-1] if earlier_ends else -1
    block_starts = [start for start in starts if floor < start < last_end]
    if not block_starts:
        return []
    start = block_starts[0]
    values: list[str] = []
    for line in lines[start + 1 : last_end]:
        stripped = line.strip()
        if stripped.startswith(DISPOSITIONS_PREFIX):
            # Keep the raw value too: line.strip() would remove a separator or a
            # C1 control at its start or end before the class search sees it.
            raw = line[line.find(DISPOSITIONS_PREFIX) + len(DISPOSITIONS_PREFIX) :]
            if raw.endswith("\r"):
                raw = raw[:-1]
            values.append(raw)
    if len(values) > 1:
        return ["invalid dispositions line: more than one dispositions line"]
    if not values:
        return []
    raw_value = values[0]
    value = raw_value.strip()
    if value == "none":
        # `none` is valid only as the plain value: a separator or another hidden
        # character around it is still a control character.
        if CONTROL_OR_ZERO_WIDTH_RE.search(raw_value):
            return ["invalid dispositions line: control or zero-width character"]
        return []
    feedback: list[str] = []
    seen: set[str] = set()
    for raw in value.split(";"):
        item = raw.strip()
        if not item:
            feedback.append("invalid dispositions line: empty item")
            continue
        match = DISPOSITIONS_ITEM_RE.fullmatch(item)
        if not match:
            feedback.append(f"invalid dispositions line: {item}")
            continue
        text_value = match.group(3)
        if text_value is not None and not text_value.strip():
            feedback.append(f"invalid dispositions line: {item}")
            continue
        finding_id = item.split("=", 1)[0]
        if finding_id in seen:
            feedback.append(f"invalid dispositions line: duplicate finding id {finding_id}")
            continue
        seen.add(finding_id)
    if not feedback and CONTROL_OR_ZERO_WIDTH_RE.search(raw_value):
        feedback.append("invalid dispositions line: control or zero-width character")
    return feedback


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


def registry_description_feedback(repo: Path, track: str) -> list[str]:
    """The archived track's registry entry must carry the metadata description.

    The registry check (`tests/dsh/test-registry.sh`) compares each entry's
    description with the archive metadata, but it only runs when someone runs the
    CLI suite. Closeout runs per finished track, so it is the natural place to
    catch a post-archive metadata edit that left the registry entry behind.
    """
    registry = measure_dir(repo) / "tracks.md"
    if not registry.exists():
        return []
    lines = registry.read_text(encoding="utf-8", errors="ignore").split("\n")
    link = re.compile(rf"\./archive/{re.escape(track)}/")
    index = next((i for i, line in enumerate(lines) if link.search(line)), None)
    if index is None:
        return [f"missing registry entry for {track}"]
    description = ""
    candidate = lines[index + 1] if index + 1 < len(lines) else ""
    if candidate.startswith("  *") and candidate.endswith("*") and "*Link:" not in candidate:
        description = candidate[3:-1]
    if not description:
        return [f"registry entry has no description for {track}"]
    expected = ""
    metadata = measure_dir(repo) / "archive" / track / "metadata.json"
    if metadata.exists():
        try:
            expected = " ".join(str(json.loads(metadata.read_text(encoding="utf-8")).get("description", "")).split())
        except Exception:
            expected = ""
    if not expected and index > 0:
        title_line = lines[index - 1]
        match = re.match(r"- \[x\] \*\*Track: (.+)\*\*$", title_line)
        if match:
            expected = match.group(1)
    if expected and description != expected:
        return [f"registry description differs from metadata for {track}"]
    return []


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
    feedback.extend(registry_description_feedback(repo, track))
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
    paths = ux_paths(repo, args.baseline, args.track)
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

    if args.log_file and Path(args.log_file).exists():
        feedback.extend(dispositions_feedback(args.log_file))

    if role == "strategy":
        strategy = measure_dir(repo) / "tracks" / args.track / "test-strategy.md"
        if not strategy.exists():
            feedback.append(f"missing test strategy: {strategy}")
    elif role == "mid-red":
        scope = red_scope(repo, args.baseline, args.track)
        if scope is None:
            if args.baseline and git_head(repo) == args.baseline:
                feedback.append("expected committed Red-phase test change, but HEAD did not advance")
        else:
            print(f"INFO: mid-red skipped {len(scope.skipped)} commits of other tracks")
            for sha, ids in scope.skipped:
                print(f"INFO: - {sha[:12]} {','.join(ids)}")
            if not scope.own:
                feedback.append(
                    f"expected committed Red-phase test change, but baseline..HEAD has no commit of track {args.track}"
                )
        total, _complete, in_progress, incomplete, _with_sha = phase_counts(plan, args.phase)
        if total == 0:
            feedback.append(f"could not find phase {args.phase!r} in {plan}")
        elif in_progress == 0 and incomplete > 0:
            feedback.append("expected at least one current phase task marked [~]")
        if scope is None:
            non_test = non_test_committed_files(repo, args.baseline)
        else:
            own_paths: set[str] = set()
            for sha in scope.own:
                paths = commit_paths(repo, sha)
                if paths is None:
                    feedback.append(f"mid-red could not list the files of commit {sha[:12]}")
                else:
                    own_paths.update(paths)
            non_test = non_test_paths(own_paths)
        if non_test:
            feedback.append("Mid Red changed non-test/non-Measure files")
            feedback.extend(f"- {path}" for path in non_test)
        feedback.extend(gate_command(repo, "RED_TEST_COMMAND", os.environ.get("RED_TEST_COMMAND", ""), expect_failure=True))
    elif role == "jr-green":
        own = own_commits_after(repo, args.baseline, args.track)
        if own is not None:
            if not own:
                feedback.append(
                    "expected committed Green-phase implementation change, but baseline..HEAD has only commits of another track"
                )
        elif args.baseline and git_head(repo) == args.baseline:
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
        "spec-review",
        "orchestrator-audit",
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
            paths = ux_paths(repo, args.baseline, args.track)
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
        if role == "spec-review":
            if not args.baseline:
                feedback.append("--baseline is required for spec-review")
            else:
                resolved = git(repo, "rev-parse", "--verify", "--quiet", f"{args.baseline}^{{commit}}")
                if resolved.returncode != 0:
                    feedback.append(f"--baseline does not resolve to a commit: {args.baseline}")
                else:
                    # A shared branch can hold commits of another track; when the track
                    # scope applies, only this track's own commits are read (fail closed to
                    # the full range when the scope cannot be proven).
                    scoped = scoped_changed_files(repo, args.baseline, args.track)
                    paths: list[str] = []
                    if scoped is not None:
                        paths = scoped
                    else:
                        listed = git(repo, "diff", "--name-only", "--no-renames", "-z", f"{args.baseline}..HEAD")
                        if listed.returncode != 0:
                            lines = listed.stdout.splitlines()
                            line = lines[0] if lines else ""
                            feedback.append(f"spec-review could not list committed files: {line}")
                        else:
                            paths = listed.stdout.split("\0")
                            if paths and paths[-1] == "":
                                paths.pop()
                            paths.extend(sorted(history_files(repo, args.baseline) - set(paths)))
                            paths.sort()
                    if any(path for path in paths):
                        outside = [path for path in paths if not path.startswith("measure/runs/")]
                        if outside:
                            feedback.append("spec-review committed files outside measure/runs/")
                            feedback.extend(f"- {path}" for path in outside)

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
    ux.add_argument("--track", default="", help="optional track id: only its own commits are read")
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
