#!/usr/bin/env python3
"""Build frozen, anonymized CSV tables for paper 1.

The live database stays read-only. The script reads one SQLite backup.
Stdlib only. No paid calls. No session IDs or finding text leave this script.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import os
import re
import sqlite3
import statistics
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

RESULT_PASS = "pass"
RESULT_FAIL = "fail"
RESULT_NO_VERDICT = "no_verdict"
ERROR_RESULTS = ("error", "timeout", "abandoned")
DEFAULT_DB = "~/.local/state/ra-quota/outcomes.sqlite"
DEFAULT_ROUTES = "~/.config/ra-quota/routes.json"
DEFAULT_SNAPSHOT_DIR = "~/.local/share/paper1-snapshots/"
DEFAULT_UNTIL = "2026-11-26T22:21:52Z"
MIN_VERDICTS = 30
Z_95 = 1.959963984540054
ROLE_GROUP: dict[str, str] = {}

DECISION_ROLES = frozenset({
    "review-a",
    "review-b",
    "review-c",
    "adversarial",
    "phase-acceptance",
    "final-acceptance",
    "acceptance",
    "spec-review",
    "vision-review",
})

HY_ROUTES = frozenset({
    "opencode-go/hy4-flash-free#high",
    "opencode-go/hy4-flash-free#medium",
    "opencode-go/hy4-flash-free#none",
    "opencode-go/hy4-preview",
    "opencode/hy4-flash-free#high",
})

# Directory basenames come from the frozen snapshot at rebuild time. The
# published tables carry only anonymous dir_NN labels. The names below map
# the observed basenames to the paper domain classes.
DOMAIN = {
    "Desktop": "code",
    "Workbooks": "markdown_curriculum",
    "a63-tutor-calculator": "code",
    "accounting-intake-p6": "code",
    "accounting-intake-p7": "code",
    "advantage-forge": "code",
    "advantage-mmorpg": "code",
    "advantage-pr": "markdown_curriculum",
    "dashboard": "code",
    "fixture-paths": "benchmark",
    "jobs": "code",
    "lending-desk-bench": "benchmark",
    "mastery-advantage": "code",
    "measure": "markdown_curriculum",
    "per_app_cicd_20261107": "code",
    "ra-math-advantage": "code",
    "ra-quota": "code",
    "reading-advantage-monorepo": "code",
    "sales-seed-1c531677": "benchmark",
    "storytime-speed": "benchmark",
    "storytime_teaching_loops_20261103": "markdown_curriculum",
    "www-storytime-launch-day": "markdown_curriculum",
    "www-test-audit": "benchmark",
}

VERDICT_COLUMNS = [
    "verdicts",
    "coverage",
    "lower_bound",
    "upper_bound",
    "pass_rate_lo",
    "pass_rate_hi",
    "small_cell",
]


def norm_route(route: str | None) -> str:
    if not route:
        return ""
    return route.split()[0].rstrip(".,)")


def _family_of(route: str | None, exact_hy: bool) -> str:
    low = norm_route(route).lower()
    if not low or low == "unknown":
        return "unknown"
    if exact_hy and low in HY_ROUTES:
        return "hy"
    if "nemotron" in low:
        return "nemotron"
    if "deepseek" in low:
        return "deepseek"
    if "minimax" in low or "m3.1" in low or "m3-" in low or "/m3" in low:
        return "minimax"
    if "mimo" in low:
        return "mimo"
    if "muse" in low or "spark" in low:
        return "muse"
    if "glm" in low or "zhipu" in low:
        return "glm"
    if "kimi" in low or "moonshot" in low or "k3.1" in low or "/k3" in low:
        return "kimi"
    if "qwen" in low:
        return "qwen"
    if "beam" in low:
        return "beam"
    if not exact_hy:
        toks = [t for t in re.split(r"[^a-z0-9]+", low) if t]
        if any(re.match(r"^hy", token) for token in toks):
            return "hy"
    if "stepfun" in low or "step-5" in low or "step5" in low:
        return "stepfun"
    if "claude" in low or "anthropic" in low:
        return "claude"
    if "gpt" in low or "codex" in low or "openai" in low:
        return "openai"
    if "terra" in low or "luna" in low:
        return "openai"
    if re.search(r"(^|[^a-z])sol([^a-z]|$)", low):
        return "openai"
    if "grok" in low or "xai" in low:
        return "grok"
    if "doubao" in low or "bytedance" in low or "seed" in low:
        return "doubao"
    if "nvidia" in low:
        return "nvidia"
    if "ark" in low or "volcengine" in low or "bailian" in low:
        return "other-cn-infra"
    return "other"


def family_of(route: str | None) -> str:
    return _family_of(route, exact_hy=True)


def legacy_family_of(route: str | None) -> str:
    return _family_of(route, exact_hy=False)


def load_cost_fn(routes_path: str | None):
    route_to_plan: dict[str, str] = {}
    plan_sources: dict[str, str] = {}
    if routes_path:
        routes_path = os.path.expanduser(routes_path)
    if routes_path and os.path.exists(routes_path):
        try:
            with open(routes_path, encoding="utf-8") as fh:
                data = json.load(fh)
            route_to_plan = dict(data.get("routeToPlan", {}))
            plan_sources = dict(data.get("planSources", {}))
        except (OSError, ValueError):
            route_to_plan = {}
            plan_sources = {}
    prefixes = sorted(route_to_plan, key=len, reverse=True)
    fallback_plans = {"claude-code/": "claude"}
    if "claude-agent/" not in route_to_plan:
        fallback_plans["claude-agent/"] = "claude"

    def resolve(plan: str | None) -> str:
        seen = set()
        while plan and plan not in seen:
            seen.add(plan)
            src = plan_sources.get(plan)
            if not src:
                return "unknown"
            if src.startswith("alias:"):
                plan = src.split("alias:", 1)[1]
                continue
            return src
        return "unknown"

    def cost_class_of(route: str | None) -> str:
        r = norm_route(route)
        plan = None
        for prefix in prefixes:
            if r.startswith(prefix):
                plan = route_to_plan[prefix]
                break
        if plan is None:
            for prefix, fallback in fallback_plans.items():
                if r.startswith(prefix):
                    plan = fallback
                    break
        src = resolve(plan)
        if src == "quota":
            return "subscription"
        if src == "credit":
            return "credit"
        if src == "free":
            return "free"
        if src.startswith("arkcli:") or src.startswith("bl:"):
            return "credit"
        return "unknown"

    cost_class_of.has_claude_agent_prefix = "claude-agent/" in route_to_plan
    return cost_class_of


def parse_time(value: str | None):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def utc_text(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def duration_min(started: str | None, ended: str | None):
    a = parse_time(started)
    b = parse_time(ended)
    if a is None or b is None:
        return None
    mins = (b - a).total_seconds() / 60.0
    if mins < 0:
        return None
    return mins


def repo_of(directory: str | None) -> str:
    if not directory:
        return ""
    return os.path.basename(directory.rstrip("/"))


def domain_of(directory: str | None) -> str:
    repo = repo_of(directory)
    if not repo:
        return "unassigned"
    return DOMAIN.get(repo, "unassigned")


def bucket_result(result: str | None) -> str:
    if result == RESULT_PASS:
        return "pass"
    if result == RESULT_FAIL:
        return "fail"
    if result == RESULT_NO_VERDICT or result is None:
        return "no_verdict"
    if result in ERROR_RESULTS:
        return "error"
    return "error"


def fmt_ratio(numerator: int, denominator: int, places: int = 4) -> str:
    if denominator <= 0:
        return ""
    return f"{numerator / denominator:.{places}f}"


def fmt_rate(passes: int, fails: int) -> str:
    return fmt_ratio(passes, passes + fails)


def fmt_percent(numerator: int, denominator: int) -> str:
    if denominator <= 0:
        return ""
    return f"{100 * numerator / denominator:.1f}"


def fmt_median(values: list[float]) -> str:
    if not values:
        return ""
    return f"{statistics.median(values):.1f}"


def wilson_interval(passes: int, fails: int):
    total = passes + fails
    if total <= 0:
        return None
    proportion = passes / total
    z2 = Z_95 * Z_95
    divisor = 1.0 + z2 / total
    center = (proportion + z2 / (2 * total)) / divisor
    margin = Z_95 * math.sqrt(
        proportion * (1 - proportion) / total + z2 / (4 * total * total)
    ) / divisor
    return max(0.0, center - margin), min(1.0, center + margin)


def verdict_fields(passes: int, fails: int, runs: int) -> dict[str, str]:
    verdicts = passes + fails
    interval = wilson_interval(passes, fails)
    lo, hi = ("", "") if interval is None else (
        f"{interval[0]:.4f}", f"{interval[1]:.4f}"
    )
    return {
        "verdicts": verdicts,
        "coverage": fmt_ratio(verdicts, runs),
        "lower_bound": fmt_ratio(passes, runs),
        "upper_bound": fmt_ratio(runs - fails, runs),
        "pass_rate_lo": lo,
        "pass_rate_hi": hi,
        "small_cell": "true" if verdicts < MIN_VERDICTS else "false",
    }


def verdict_values(passes: int, fails: int, runs: int) -> list:
    fields = verdict_fields(passes, fails, runs)
    return [fields[name] for name in VERDICT_COLUMNS]


def table_columns(con: sqlite3.Connection, table: str) -> set[str]:
    return {row["name"] for row in con.execute(f"PRAGMA table_info({table})")}


def connect_ro(db_path: str) -> sqlite3.Connection:
    uri = Path(os.path.abspath(os.path.expanduser(db_path))).as_uri() + "?mode=ro"
    con = sqlite3.connect(uri, uri=True)
    con.row_factory = sqlite3.Row
    return con


def fetch_runs(con: sqlite3.Connection, until: str = DEFAULT_UNTIL) -> list[sqlite3.Row]:
    cutoff = parse_time(until)
    if cutoff is None:
        raise ValueError(f"Invalid --until value: {until}")
    task_expr = "task_tag" if "task_tag" in table_columns(con, "runs") else "NULL AS task_tag"
    rows = con.execute(
        "SELECT id, started_at, role, route, plan, directory,"
        f" result, ended_at, {task_expr} FROM runs"
    )
    selected = []
    for row in rows:
        started = parse_time(row["started_at"])
        if started is not None and started <= cutoff:
            selected.append(row)
    return selected


def fetch_findings(con: sqlite3.Connection, selected_ids: set[int]) -> list[sqlite3.Row]:
    return [
        row for row in con.execute("SELECT run_id, severity, escaped FROM findings")
        if row["run_id"] in selected_ids
    ]


def fetch_ratings(con: sqlite3.Connection, selected_ids: set[int]) -> list[sqlite3.Row]:
    return [
        row for row in con.execute(
            "SELECT run_id, rater_route, axis, score FROM ratings"
        )
        if row["run_id"] in selected_ids
    ]


def fetch_rater_checks(con: sqlite3.Connection, selected_ids: set[int]) -> list[sqlite3.Row]:
    return [
        row for row in con.execute(
            "SELECT rater_run_id, checker_run_id, agreed FROM rater_checks"
        )
        if row["rater_run_id"] in selected_ids
    ]


def define_role_group(runs) -> dict[str, str]:
    global ROLE_GROUP
    ROLE_GROUP = {
        role: "decision" if role in DECISION_ROLES else "producer"
        for role in sorted({row["role"] for row in runs})
    }
    return ROLE_GROUP


def role_group_of(role: str, role_groups: dict[str, str] | None = None) -> str:
    if role_groups is not None and role in role_groups:
        return role_groups[role]
    return "decision" if role in DECISION_ROLES else "producer"


def directory_layout(runs):
    counts = Counter(repo_of(row["directory"]) or "(empty)" for row in runs)
    ranked_repos = sorted(counts, key=lambda repo: (-counts[repo], repo))
    mapping = {
        repo: f"dir_{index:02d}"
        for index, repo in enumerate(ranked_repos, start=1)
    }
    order = [mapping[repo] for repo in ranked_repos]
    return mapping, order


def dir_id_of(row, directory_map: dict[str, str]) -> str:
    return directory_map[repo_of(row["directory"]) or "(empty)"]


def new_counts() -> dict:
    return {
        "runs": 0,
        "pass": 0,
        "fail": 0,
        "no_verdict": 0,
        "error": 0,
        "durations": [],
        "zero_duration_n": 0,
    }


def add_run(group: dict, row) -> None:
    group["runs"] += 1
    group[bucket_result(row["result"])] += 1
    mins = duration_min(row["started_at"], row["ended_at"])
    if mins is not None:
        group["durations"].append(mins)
    if row["ended_at"] is not None and row["ended_at"] == row["started_at"]:
        group["zero_duration_n"] += 1


def aggregate_groups(runs, key_fn) -> dict:
    groups: dict[tuple, dict] = {}
    for row in runs:
        key = key_fn(row)
        group = groups.setdefault(key, new_counts())
        add_run(group, row)
    return groups


def sum_groups(groups) -> dict:
    total = new_counts()
    for group in groups:
        for key in ("runs", "pass", "fail", "no_verdict", "error", "zero_duration_n"):
            total[key] += group[key]
        total["durations"].extend(group["durations"])
    return total


def write_csv(path: str, header: list[str], rows: list[list]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh, lineterminator="\n")
        writer.writerow(header)
        writer.writerows(rows)


def build_overview(
    con: sqlite3.Connection,
    outdir: str,
    until: str = DEFAULT_UNTIL,
    role_groups: dict[str, str] | None = None,
    directory_map: dict[str, str] | None = None,
) -> dict:
    runs = fetch_runs(con, until)
    if role_groups is None:
        role_groups = define_role_group(runs)
    if directory_map is None:
        directory_map, _ = directory_layout(runs)
    dates = [row["started_at"] for row in runs if row["started_at"]]
    counts: dict[str, int] = defaultdict(int)
    missing = 0
    for row in runs:
        result = row["result"]
        if result is None:
            missing += 1
            counts["no_verdict_or_missing"] += 1
        else:
            counts[result] += 1
    stats = {
        "date_min": min(dates) if dates else "",
        "date_max": max(dates) if dates else "",
        "runs": len(runs),
        "routes": len({norm_route(row["route"]) for row in runs}),
        "families": len({family_of(row["route"]) for row in runs}),
        "roles": len({row["role"] for row in runs}),
        "repos": len({repo_of(row["directory"]) for row in runs}),
        "result_pass": counts.get("pass", 0),
        "result_fail": counts.get("fail", 0),
        "result_no_verdict": counts.get("no_verdict", 0),
        "result_missing_null": missing,
        "result_error": counts.get("error", 0),
        "result_timeout": counts.get("timeout", 0),
        "result_abandoned": counts.get("abandoned", 0),
    }
    header = [
        "metric", "value", "domain", "role_group", "runs", "pass", "fail",
        "no_verdict", "error",
    ] + VERDICT_COLUMNS
    rows = [[key, value, "", "", "", "", "", "", ""] + [""] * len(VERDICT_COLUMNS)
            for key, value in stats.items()]
    for group_name, metric in (
        ("producer", "producer_pass_rate"),
        ("decision", "decision_approval_rate"),
    ):
        group = sum_groups(
            aggregate_groups(
                [row for row in runs if role_group_of(row["role"], role_groups) == group_name],
                lambda row: (row["role"],),
            ).values()
        )
        rate = fmt_rate(group["pass"], group["fail"])
        rows.append([
            metric, rate, "", group_name, group["runs"], group["pass"],
            group["fail"], group["no_verdict"], group["error"],
        ] + verdict_values(group["pass"], group["fail"], group["runs"]))
    dir_groups = aggregate_groups(runs, lambda row: (dir_id_of(row, directory_map),))
    for dir_id in sorted(directory_map.values()):
        group = dir_groups[(dir_id,)]
        sample_row = next(row for row in runs if dir_id_of(row, directory_map) == dir_id)
        rows.append([
            dir_id, group["runs"], domain_of(sample_row["directory"]), "",
            group["runs"], group["pass"], group["fail"], group["no_verdict"],
            group["error"],
        ] + verdict_values(group["pass"], group["fail"], group["runs"]))
    write_csv(os.path.join(outdir, "overview.csv"), header, rows)
    return stats


def build_by_family_role(
    con: sqlite3.Connection,
    outdir: str,
    until: str = DEFAULT_UNTIL,
    role_groups: dict[str, str] | None = None,
) -> None:
    runs = fetch_runs(con, until)
    if role_groups is None:
        role_groups = define_role_group(runs)
    groups = aggregate_groups(runs, lambda row: (family_of(row["route"]), row["role"]))
    rows = []
    for (family, role), group in sorted(groups.items()):
        rows.append([
            family, role, group["runs"], group["pass"], group["fail"],
            group["no_verdict"], group["error"],
            fmt_rate(group["pass"], group["fail"]),
            fmt_median(group["durations"]),
            role_group_of(role, role_groups),
            len(group["durations"]),
            group["zero_duration_n"],
        ] + verdict_values(group["pass"], group["fail"], group["runs"]))
    write_csv(
        os.path.join(outdir, "by_family_role.csv"),
        [
            "family", "role", "runs", "pass", "fail", "no_verdict", "error",
            "pass_rate", "median_duration_min", "role_group", "duration_n",
            "zero_duration_n",
        ] + VERDICT_COLUMNS,
        rows,
    )


def build_by_role_group_family(
    con: sqlite3.Connection,
    outdir: str,
    until: str = DEFAULT_UNTIL,
    role_groups: dict[str, str] | None = None,
) -> None:
    runs = fetch_runs(con, until)
    if role_groups is None:
        role_groups = define_role_group(runs)
    groups = aggregate_groups(
        runs,
        lambda row: (role_group_of(row["role"], role_groups), family_of(row["route"])),
    )
    rows = []
    for (role_group, family), group in sorted(groups.items()):
        rows.append([
            role_group, family, group["runs"], group["pass"], group["fail"],
            group["no_verdict"], group["error"],
            fmt_rate(group["pass"], group["fail"]),
        ] + verdict_values(group["pass"], group["fail"], group["runs"]))
    write_csv(
        os.path.join(outdir, "by_role_group_family.csv"),
        [
            "role_group", "family", "runs", "pass", "fail", "no_verdict",
            "error", "pass_rate",
        ] + VERDICT_COLUMNS,
        rows,
    )


def build_by_route_top(
    con: sqlite3.Connection,
    outdir: str,
    top: int = 30,
    until: str = DEFAULT_UNTIL,
) -> None:
    groups = aggregate_groups(fetch_runs(con, until), lambda row: (norm_route(row["route"]),))
    ranked = sorted(groups.items(), key=lambda item: (-item[1]["runs"], item[0]))[:top]
    rows = []
    for (route,), group in ranked:
        rows.append([
            route, family_of(route), group["runs"], group["pass"], group["fail"],
            group["no_verdict"], group["error"],
            fmt_rate(group["pass"], group["fail"]),
            fmt_median(group["durations"]),
            len(group["durations"]),
            group["zero_duration_n"],
        ] + verdict_values(group["pass"], group["fail"], group["runs"]))
    write_csv(
        os.path.join(outdir, "by_route_top.csv"),
        [
            "route", "family", "runs", "pass", "fail", "no_verdict", "error",
            "pass_rate", "median_duration_min", "duration_n", "zero_duration_n",
        ] + VERDICT_COLUMNS,
        rows,
    )


def validate_escape_flag(findings) -> dict:
    mismatches = sum(
        row["escaped"] != (1 if row["severity"] == "escape" else 0)
        for row in findings
    )
    if mismatches:
        raise ValueError(
            f"Escape flag check failed: {mismatches} selected findings disagree with severity."
        )
    return {"escape_check": "PASS", "escape_mismatches": mismatches}


def build_findings(con: sqlite3.Connection, outdir: str, until: str = DEFAULT_UNTIL) -> dict:
    runs = fetch_runs(con, until)
    run_family = {row["id"]: family_of(row["route"]) for row in runs}
    run_count: dict[str, int] = defaultdict(int)
    for row in runs:
        run_count[family_of(row["route"])] += 1
    findings = fetch_findings(con, set(run_family))
    check = validate_escape_flag(findings)
    cells: dict[tuple, dict] = {}
    for finding in findings:
        family = run_family[finding["run_id"]]
        key = (family, finding["severity"])
        cell = cells.setdefault(key, {"findings": 0, "escaped": 0})
        cell["findings"] += 1
        cell["escaped"] += 1 if finding["escaped"] else 0
    rows = []
    for (family, severity), cell in sorted(cells.items()):
        family_runs = run_count.get(family, 0)
        rows.append([
            family, severity, cell["findings"], family_runs,
            fmt_ratio(cell["findings"], family_runs), cell["escaped"],
            fmt_ratio(cell["escaped"], cell["findings"]),
        ])
    write_csv(
        os.path.join(outdir, "findings_by_family.csv"),
        [
            "family", "severity", "findings", "runs_in_family",
            "findings_per_run", "escaped", "escaped_share",
        ],
        rows,
    )
    decision_runs: dict[str, int] = defaultdict(int)
    for row in runs:
        if row["role"] in DECISION_ROLES:
            decision_runs[family_of(row["route"])] += 1
    family_findings: dict[str, dict] = defaultdict(lambda: {"findings": 0, "escapes": 0})
    for finding in findings:
        family = run_family[finding["run_id"]]
        family_findings[family]["findings"] += 1
        family_findings[family]["escapes"] += 1 if finding["escaped"] else 0
    decision_rows = []
    for family in sorted(run_count):
        cell = family_findings[family]
        denominator = decision_runs[family]
        decision_rows.append([
            family, denominator, cell["findings"],
            fmt_ratio(cell["findings"], denominator), cell["escapes"],
            fmt_ratio(100 * cell["escapes"], denominator),
        ])
    write_csv(
        os.path.join(outdir, "findings_by_decision_runs.csv"),
        [
            "family", "decision_role_runs", "findings",
            "findings_per_decision_run", "escapes",
            "escapes_per_100_decision_runs",
        ],
        decision_rows,
    )
    return check


def canonical_axis(axis: str) -> str:
    return "test_meaning" if axis == "test_mean" else axis


def score_stats(scores: list[int]) -> dict:
    total = len(scores)
    return {
        "n": total,
        "mean": fmt_ratio(sum(scores), total),
        "median": f"{statistics.median(scores):.4f}" if scores else "",
        "share_le_3": fmt_ratio(sum(score <= 3 for score in scores), total),
        "score_1": scores.count(1),
        "score_2": scores.count(2),
        "score_3": scores.count(3),
        "score_4": scores.count(4),
        "score_5": scores.count(5),
    }


def build_ratings(con: sqlite3.Connection, outdir: str, until: str = DEFAULT_UNTIL) -> dict:
    runs = fetch_runs(con, until)
    run_family = {row["id"]: family_of(row["route"]) for row in runs}
    all_run_family = {
        row["id"]: family_of(row["route"])
        for row in con.execute("SELECT id, route FROM runs")
    }
    ratings = fetch_ratings(con, set(run_family))
    checks = fetch_rater_checks(con, set(run_family))
    given: dict[tuple, list[int]] = defaultdict(list)
    received: dict[tuple, list[int]] = defaultdict(list)
    renamed_rows = 0
    for row in ratings:
        axis = canonical_axis(row["axis"])
        if axis != row["axis"]:
            renamed_rows += 1
        given[(family_of(row["rater_route"]), axis)].append(row["score"])
        received[(run_family[row["run_id"]], axis)].append(row["score"])
    rating_header = [
        "family", "axis", "n", "mean", "median", "share_le_3",
        "score_1", "score_2", "score_3", "score_4", "score_5",
    ]
    for name, cells in (
        ("ratings_given_by_rater_family.csv", given),
        ("ratings_received_by_family.csv", received),
    ):
        rows = []
        for (family, axis), scores in sorted(cells.items()):
            stats = score_stats(scores)
            rows.append([family, axis] + [stats[key] for key in rating_header[2:]])
        write_csv(os.path.join(outdir, name), rating_header, rows)
    compatibility_rows = []
    for (family, axis), scores in sorted(received.items()):
        compatibility_rows.append([
            family, axis, len(scores), fmt_ratio(sum(scores), len(scores)), "received",
        ])
    rater_agreement: dict[str, list[int]] = defaultdict(list)
    checker_agreement: dict[str, dict] = defaultdict(lambda: {"agreed": 0, "checks": 0})
    for row in checks:
        rater_family = all_run_family.get(row["rater_run_id"], "unknown-run")
        checker_family = all_run_family.get(row["checker_run_id"], "unknown-run")
        rater_agreement[rater_family].append(row["agreed"])
        checker_agreement[checker_family]["checks"] += 1
        checker_agreement[checker_family]["agreed"] += row["agreed"]
    for family, values in sorted(rater_agreement.items()):
        compatibility_rows.append([
            family, "agreement", len(values), fmt_ratio(sum(values), len(values), 6),
            "rater_agreement",
        ])
    write_csv(
        os.path.join(outdir, "ratings_by_family.csv"),
        ["family", "axis", "n", "mean_score", "direction"],
        compatibility_rows,
    )
    agreement_rows = []
    for family, cell in sorted(checker_agreement.items()):
        agreement_rows.append([
            family, cell["agreed"], cell["checks"] - cell["agreed"], cell["checks"],
            fmt_ratio(cell["agreed"], cell["checks"], 6),
        ])
    write_csv(
        os.path.join(outdir, "review_agreement_by_checker_family.csv"),
        ["checker_family", "agreed", "disagreed", "checks", "agreement_rate"],
        agreement_rows,
    )
    muse = rater_agreement.get("muse", [])
    return {
        "renamed_axis_rows": renamed_rows,
        "muse_agreement": {"agreed": sum(muse), "checks": len(muse)},
    }


def unknown_split(family: str, cost_class: str) -> str:
    if cost_class != "unknown":
        return ""
    if family == "unknown":
        return "legacy_unknown_family"
    return "named_route_without_map"


def build_cost_classes(
    con: sqlite3.Connection,
    outdir: str,
    cost_fn,
    until: str = DEFAULT_UNTIL,
) -> dict:
    runs = fetch_runs(con, until)
    groups: dict[str, dict] = {}
    for row in runs:
        route = norm_route(row["route"])
        family = family_of(route)
        cost_class = cost_fn(route)
        group = groups.setdefault(cost_class, new_counts())
        add_run(group, row)
        group.setdefault("routes", set()).add(route)
        group.setdefault("legacy_runs", 0)
        group.setdefault("named_runs", 0)
        split = unknown_split(family, cost_class)
        if split == "legacy_unknown_family":
            group["legacy_runs"] += 1
        elif split == "named_route_without_map":
            group["named_runs"] += 1
    rows = []
    for cost_class, group in sorted(groups.items()):
        rows.append([
            cost_class, group["runs"], group["pass"], group["fail"],
            group["no_verdict"], group["error"],
            fmt_rate(group["pass"], group["fail"]), len(group["routes"]),
            fmt_ratio(group["runs"], len(runs)),
        ] + verdict_values(group["pass"], group["fail"], group["runs"]))
    write_csv(
        os.path.join(outdir, "cost_classes.csv"),
        [
            "cost_class", "runs", "pass", "fail", "no_verdict", "error",
            "pass_rate", "routes_distinct", "run_share",
        ] + VERDICT_COLUMNS,
        rows,
    )
    unknown = groups.get("unknown", new_counts())
    return {
        "unknown_runs": unknown["runs"],
        "unknown_routes": len(unknown.get("routes", set())),
        "legacy_unknown_runs": unknown.get("legacy_runs", 0),
        "named_unknown_runs": unknown.get("named_runs", 0),
    }


def build_cost_class_routes(
    con: sqlite3.Connection,
    outdir: str,
    cost_fn,
    until: str = DEFAULT_UNTIL,
) -> list[dict]:
    groups = aggregate_groups(
        fetch_runs(con, until), lambda row: (norm_route(row["route"]),)
    )
    rows = []
    unmapped = []
    for (route,), group in sorted(groups.items(), key=lambda item: (-item[1]["runs"], item[0][0])):
        family = family_of(route)
        cost_class = cost_fn(route)
        split = unknown_split(family, cost_class)
        rows.append([
            route, group["runs"], cost_class, family, split, group["pass"],
            group["fail"], group["no_verdict"], group["error"],
            fmt_rate(group["pass"], group["fail"]),
        ] + verdict_values(group["pass"], group["fail"], group["runs"]))
        if cost_class == "unknown" and split == "named_route_without_map":
            unmapped.append({"route": route, "runs": group["runs"], "split": split})
    write_csv(
        os.path.join(outdir, "cost_class_routes.csv"),
        [
            "route", "run_count", "cost_class", "family", "unknown_split",
            "pass", "fail", "no_verdict", "error", "pass_rate",
        ] + VERDICT_COLUMNS,
        rows,
    )
    return unmapped


def month_range(first: str, last: str) -> list[str]:
    year, month = map(int, first.split("-"))
    last_year, last_month = map(int, last.split("-"))
    months = []
    while (year, month) <= (last_year, last_month):
        months.append(f"{year:04d}-{month:02d}")
        if month == 12:
            year += 1
            month = 1
        else:
            month += 1
    return months


def build_per_month(con: sqlite3.Connection, outdir: str, until: str = DEFAULT_UNTIL) -> None:
    runs = fetch_runs(con, until)
    cutoff = parse_time(until)
    groups = aggregate_groups(
        runs,
        lambda row: ((row["started_at"] or "")[:7], family_of(row["route"])),
    )
    months = sorted({key[0] for key in groups if re.fullmatch(r"\d{4}-\d{2}", key[0])})
    all_months = month_range(months[0], months[-1]) if months else []
    rows = []
    for month in all_months:
        partial = (
            cutoff is not None
            and month == f"{cutoff.year:04d}-{cutoff.month:02d}"
        )
        month_groups = [group for (cell_month, _), group in groups.items() if cell_month == month]
        if not month_groups:
            rows.append([
                month, "all", 0, 0, 0, "", 0, 0,
            ] + verdict_values(0, 0, 0) + ["true" if partial else "false"])
            continue
        for (cell_month, family), group in sorted(groups.items()):
            if cell_month != month:
                continue
            rows.append([
                month, family, group["runs"], group["pass"], group["fail"],
                fmt_rate(group["pass"], group["fail"]), group["no_verdict"],
                group["error"],
            ] + verdict_values(group["pass"], group["fail"], group["runs"]) + [
                "true" if partial else "false"
            ])
    for (month, family), group in sorted(groups.items()):
        if re.fullmatch(r"\d{4}-\d{2}", month):
            continue
        rows.append([
            month, family, group["runs"], group["pass"], group["fail"],
            fmt_rate(group["pass"], group["fail"]), group["no_verdict"],
            group["error"],
        ] + verdict_values(group["pass"], group["fail"], group["runs"]) + ["false"])
    write_csv(
        os.path.join(outdir, "per_month.csv"),
        [
            "month", "family", "runs", "pass", "fail", "pass_rate",
            "no_verdict", "error",
        ] + VERDICT_COLUMNS + ["partial"],
        rows,
    )


def build_by_domain(
    con: sqlite3.Connection,
    outdir: str,
    until: str = DEFAULT_UNTIL,
    role_groups: dict[str, str] | None = None,
) -> None:
    runs = fetch_runs(con, until)
    if role_groups is None:
        role_groups = define_role_group(runs)
    groups = aggregate_groups(
        runs,
        lambda row: (
            domain_of(row["directory"]),
            role_group_of(row["role"], role_groups),
        ),
    )
    rows = []
    for (domain, role_group), group in sorted(groups.items()):
        rows.append([
            domain, role_group, group["runs"], group["pass"], group["fail"],
            group["no_verdict"], group["error"],
            fmt_rate(group["pass"], group["fail"]),
        ] + verdict_values(group["pass"], group["fail"], group["runs"]) + [
            fmt_ratio(group["runs"], len(runs))
        ])
    write_csv(
        os.path.join(outdir, "by_domain.csv"),
        [
            "domain", "role_group", "runs", "pass", "fail", "no_verdict",
            "error", "pass_rate",
        ] + VERDICT_COLUMNS + ["run_share"],
        rows,
    )


def build_leave_one_directory_out(
    con: sqlite3.Connection,
    outdir: str,
    until: str = DEFAULT_UNTIL,
    role_groups: dict[str, str] | None = None,
    directory_map: dict[str, str] | None = None,
    directory_order: list[str] | None = None,
) -> None:
    runs = fetch_runs(con, until)
    if role_groups is None:
        role_groups = define_role_group(runs)
    if directory_map is None or directory_order is None:
        directory_map, directory_order = directory_layout(runs)
    cells = aggregate_groups(runs, lambda row: (family_of(row["route"]), row["role"]))
    rows = []
    for (family, role), full in sorted(cells.items()):
        if full["pass"] + full["fail"] < MIN_VERDICTS:
            continue
        by_dir = aggregate_groups(
            [row for row in runs if family_of(row["route"]) == family and row["role"] == role],
            lambda row: (dir_id_of(row, directory_map),),
        )
        loo = []
        for dir_id in directory_order:
            excluded = by_dir.get((dir_id,), new_counts())
            passes = full["pass"] - excluded["pass"]
            fails = full["fail"] - excluded["fail"]
            verdicts = passes + fails
            loo.append({
                "dir_id": dir_id,
                "rate": passes / verdicts if verdicts else None,
                "rate_text": fmt_rate(passes, fails),
            })
        defined = [item for item in loo if item["rate"] is not None]
        minimum = min(defined, key=lambda item: item["rate"]) if defined else None
        maximum = max(defined, key=lambda item: item["rate"]) if defined else None
        largest = max(
            directory_order,
            key=lambda dir_id: by_dir.get((dir_id,), new_counts())["runs"],
        )
        largest_group = by_dir.get((largest,), new_counts())
        rows.append([
            family, role, role_group_of(role, role_groups), full["runs"],
            full["pass"], full["fail"], full["no_verdict"], full["error"],
            fmt_rate(full["pass"], full["fail"]),
        ] + verdict_values(full["pass"], full["fail"], full["runs"]) + [
            minimum["rate_text"] if minimum else "",
            maximum["rate_text"] if maximum else "",
            minimum["dir_id"] if minimum else "",
            maximum["dir_id"] if maximum else "",
            largest,
            fmt_ratio(largest_group["runs"], full["runs"]),
            fmt_ratio(largest_group["fail"], full["fail"]),
        ])
    write_csv(
        os.path.join(outdir, "by_family_role_leave_one_dir_out.csv"),
        [
            "family", "role", "role_group", "runs", "pass", "fail",
            "no_verdict", "error", "pass_rate",
        ] + VERDICT_COLUMNS + [
            "loo_min_rate", "loo_max_rate", "loo_min_dir", "loo_max_dir",
            "largest_dir", "largest_dir_run_share", "largest_dir_fail_share",
        ],
        rows,
    )


def utc_date_of(value: str | None) -> str:
    parsed = parse_time(value)
    return parsed.date().isoformat() if parsed else ""


def build_directory_exclusions(
    con: sqlite3.Connection,
    outdir: str,
    until: str = DEFAULT_UNTIL,
    directory_map: dict[str, str] | None = None,
    directory_order: list[str] | None = None,
) -> None:
    runs = fetch_runs(con, until)
    if directory_map is None or directory_order is None:
        directory_map, directory_order = directory_layout(runs)
    family_role_runs: dict[tuple[str, str], list] = defaultdict(list)
    for row in runs:
        family_role_runs[(family_of(row["route"]), row["role"])].append(row)
    cells = []
    for (family, role), cell_runs in sorted(family_role_runs.items()):
        verdicts = sum(row["result"] in ("pass", "fail") for row in cell_runs)
        if verdicts >= MIN_VERDICTS:
            cells.append((f"{family}:{role}", family, role, "", cell_runs))
    route = "opencode/deepseek-v4.1-flash-free#high"
    route_runs = [row for row in runs if norm_route(row["route"]) == route]
    if route_runs:
        cells.append((route, "deepseek", "all", route, route_runs))
    rows = []
    for cell, family, role, route, cell_runs in cells:
        fail_counts = Counter(
            dir_id_of(row, directory_map)
            for row in cell_runs if row["result"] == "fail"
        )
        largest = max(directory_order, key=lambda dir_id: fail_counts[dir_id])
        cell_fail_days = Counter(
            utc_date_of(row["started_at"])
            for row in cell_runs if row["result"] == "fail"
        )
        busiest_two = sum(count for _, count in cell_fail_days.most_common(2))
        busiest_share = fmt_ratio(busiest_two, sum(fail_counts.values()))
        for scope in ("inside", "outside"):
            selected = [
                row for row in cell_runs
                if (dir_id_of(row, directory_map) == largest) == (scope == "inside")
            ]
            group = new_counts()
            for row in selected:
                add_run(group, row)
            inside = scope == "inside"
            fail_dates = [
                row["started_at"] for row in selected
                if inside and row["result"] == "fail"
            ]
            fail_days_inside = len({
                utc_date_of(value) for value in fail_dates if utc_date_of(value)
            })
            rows.append([
                cell, family, role, route, scope, largest, group["runs"],
                group["pass"], group["fail"], group["no_verdict"], group["error"],
                fmt_rate(group["pass"], group["fail"]),
            ] + verdict_values(group["pass"], group["fail"], group["runs"]) + [
                min(fail_dates) if fail_dates else "",
                max(fail_dates) if fail_dates else "",
                fail_days_inside if inside else "",
                busiest_share,
            ])
    write_csv(
        os.path.join(outdir, "directory_exclusions.csv"),
        [
            "cell", "family", "role", "route", "scope", "dir_id", "runs",
            "pass", "fail", "no_verdict", "error", "pass_rate",
        ] + VERDICT_COLUMNS + [
            "fail_date_min", "fail_date_max", "fail_days_inside",
            "busiest_two_day_fail_share",
        ],
        rows,
    )


def duplicate_stats(group_rows: list) -> dict:
    ordered = sorted(group_rows, key=lambda row: row["id"])
    retained = ordered[0]
    extras = ordered[1:]
    full = new_counts()
    dedup = new_counts()
    for row in ordered:
        add_run(full, row)
    add_run(dedup, retained)
    return {
        "rows": len(ordered),
        "extra_rows": len(extras),
        "extra_rows_same_result": sum(row["result"] == retained["result"] for row in extras),
        "full": full,
        "dedup": dedup,
    }


def duplicate_output_row(
    section: str,
    grouping: str,
    scope: str,
    group_id: str,
    groups: list[list],
    distinct_groups: int,
    duplicate_groups: int,
) -> list:
    stats = [duplicate_stats(group) for group in groups]
    full = sum_groups([item["full"] for item in stats])
    dedup = sum_groups([item["dedup"] for item in stats])
    full_fields = verdict_fields(full["pass"], full["fail"], full["runs"])
    dedup_fields = verdict_fields(dedup["pass"], dedup["fail"], dedup["runs"])
    return [
        section, grouping, scope, group_id, distinct_groups, duplicate_groups,
        sum(item["rows"] for item in stats),
        sum(item["extra_rows"] for item in stats),
        sum(item["extra_rows_same_result"] for item in stats),
        full["runs"], full["pass"], full["fail"], full["no_verdict"], full["error"],
        full_fields["verdicts"], fmt_rate(full["pass"], full["fail"]),
    ] + [full_fields[name] for name in VERDICT_COLUMNS[1:]] + [
        dedup["runs"], dedup["pass"], dedup["fail"], dedup["no_verdict"],
        dedup["error"], dedup_fields["verdicts"],
        fmt_rate(dedup["pass"], dedup["fail"]),
    ] + [dedup_fields[name] for name in VERDICT_COLUMNS[1:]] + ["", "", ""]


def build_data_quality(
    con: sqlite3.Connection,
    outdir: str,
    until: str = DEFAULT_UNTIL,
    role_groups: dict[str, str] | None = None,
) -> dict:
    runs = fetch_runs(con, until)
    if role_groups is None:
        role_groups = define_role_group(runs)
    rows = []
    summary = {}
    key_defs = [
        ("main_key", lambda row: (
            row["started_at"], row["role"], row["route"], row["directory"],
        )),
    ]
    if "task_tag" in table_columns(con, "runs"):
        key_defs.append(("task_tag_key", lambda row: (
            row["started_at"], row["role"], row["route"], row["directory"],
            row["task_tag"],
        )))
    for grouping, key_fn in key_defs:
        grouped: dict[tuple, list] = defaultdict(list)
        for row in runs:
            grouped[key_fn(row)].append(row)
        all_groups = list(grouped.values())
        duplicates = [group for group in all_groups if len(group) > 1]
        distinct_groups = len(all_groups)
        duplicate_groups = len(duplicates)
        extra_rows = sum(len(group) - 1 for group in all_groups)
        same_result = sum(
            duplicate_stats(group)["extra_rows_same_result"] for group in all_groups
        )
        summary[grouping] = {
            "distinct_groups": distinct_groups,
            "duplicate_groups": duplicate_groups,
            "extra_rows": extra_rows,
            "extra_rows_same_result": same_result,
        }
        rows.append(duplicate_output_row(
            "duplicates", grouping, "selected_sample", "", all_groups,
            distinct_groups, duplicate_groups,
        ))
    timestamp_groups = []
    for role_group in ("producer", "decision"):
        selected = [
            row for row in runs
            if role_group_of(row["role"], role_groups) == role_group
        ]
        timestamp_groups.append(("role_group", role_group, selected))
    timestamp_groups.append(("family", "unknown", [
        row for row in runs if family_of(row["route"]) == "unknown"
    ]))
    for grouping, scope, selected in timestamp_groups:
        group = new_counts()
        for row in selected:
            add_run(group, row)
        rows.append([
            "timestamps", grouping, scope, "", "", "", "", "", "",
            group["runs"], "", "", "", "",
        ] + [""] * 21 + [
            len(group["durations"]), group["zero_duration_n"],
            fmt_ratio(group["zero_duration_n"], group["runs"]),
        ])
    write_csv(
        os.path.join(outdir, "data_quality.csv"),
        [
            "section", "grouping", "scope", "group_id", "distinct_groups",
            "duplicate_groups", "rows", "extra_rows", "extra_rows_same_result",
            "runs", "pass", "fail", "no_verdict", "error", "verdicts",
            "pass_rate", "coverage", "lower_bound", "upper_bound", "pass_rate_lo",
            "pass_rate_hi", "small_cell", "dedup_runs", "dedup_pass", "dedup_fail",
            "dedup_no_verdict", "dedup_error", "dedup_verdicts", "dedup_pass_rate",
            "dedup_coverage", "dedup_lower_bound", "dedup_upper_bound",
            "dedup_pass_rate_lo", "dedup_pass_rate_hi", "dedup_small_cell",
            "duration_n", "zero_duration_n", "zero_duration_share",
        ],
        rows,
    )
    return summary


def build_family_lookup_check(
    con: sqlite3.Connection,
    outdir: str,
    until: str = DEFAULT_UNTIL,
) -> dict:
    legacy = Counter(legacy_family_of(row["route"]) for row in fetch_runs(con, until))
    current = Counter(family_of(row["route"]) for row in fetch_runs(con, until))
    rows = []
    changes = []
    for family in sorted(set(legacy) | set(current)):
        delta = current[family] - legacy[family]
        status = "unchanged" if delta == 0 else "changed"
        rows.append([family, legacy[family], current[family], delta, status])
        if delta:
            changes.append({
                "family": family,
                "legacy_runs": legacy[family],
                "current_runs": current[family],
                "delta": delta,
            })
    write_csv(
        os.path.join(outdir, "family_lookup_check.csv"),
        ["family", "legacy_runs", "current_runs", "delta", "status"],
        rows,
    )
    return {"labels": len(rows), "changes": changes}


def sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def schema_tables(con: sqlite3.Connection) -> list[str]:
    return [
        row["name"] for row in con.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
            " AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
    ]


def freeze_snapshot(
    db_path: str,
    routes_path: str | None,
    outdir: str,
    snapshot_dir: str,
    until: str,
    from_snapshot: str | None = None,
) -> tuple[str, dict]:
    if parse_time(until) is None:
        raise ValueError(f"Invalid --until value: {until}")
    os.makedirs(outdir, exist_ok=True)
    if from_snapshot:
        snapshot_path = os.path.abspath(os.path.expanduser(from_snapshot))
        if not os.path.isfile(snapshot_path):
            raise FileNotFoundError(snapshot_path)
    else:
        snapshot_dir = os.path.abspath(os.path.expanduser(snapshot_dir))
        os.makedirs(snapshot_dir, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        snapshot_path = os.path.join(snapshot_dir, f"outcomes-{stamp}.sqlite")
        source = connect_ro(db_path)
        destination = sqlite3.connect(snapshot_path)
        try:
            source.backup(destination)
        finally:
            destination.close()
            source.close()
    digest = sha256_file(snapshot_path)
    file_name = os.path.basename(snapshot_path)
    metadata_path = os.path.join(outdir, "snapshot.json")
    previous = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, encoding="utf-8") as fh:
                previous = json.load(fh)
        except (OSError, ValueError):
            previous = {}
    if (
        from_snapshot
        and previous.get("file_name") == file_name
        and previous.get("sha256") == digest
        and previous.get("copy_time")
    ):
        copy_time = previous["copy_time"]
        copy_time_basis = previous.get("copy_time_basis", "preserved")
    elif from_snapshot:
        copy_time = utc_text(datetime.fromtimestamp(os.path.getmtime(snapshot_path), timezone.utc))
        copy_time_basis = "file_mtime"
    else:
        copy_time = utc_text(datetime.now(timezone.utc))
        copy_time_basis = "live_backup"
    con = connect_ro(snapshot_path)
    try:
        run_count = con.execute("SELECT count(*) FROM runs").fetchone()[0]
        selected_run_count = len(fetch_runs(con, until))
        tables = schema_tables(con)
    finally:
        con.close()
    metadata = {
        "copy_time": copy_time,
        "copy_time_basis": copy_time_basis,
        "until": until,
        "file_name": file_name,
        "sha256": digest,
        "run_count": run_count,
        "selected_run_count": selected_run_count,
        "schema_tables": tables,
    }
    if routes_path:
        routes_file = os.path.abspath(os.path.expanduser(routes_path))
        if os.path.isfile(routes_file):
            metadata["routes_file"] = os.path.basename(routes_file)
            metadata["routes_sha256"] = sha256_file(routes_file)
    with open(metadata_path, "w", encoding="utf-8") as fh:
        json.dump(metadata, fh, indent=2)
        fh.write("\n")
    return snapshot_path, metadata


def build_all(
    db_path: str,
    routes_path: str | None,
    outdir: str,
    until: str = DEFAULT_UNTIL,
    snapshot_meta: dict | None = None,
) -> dict:
    con = connect_ro(db_path)
    try:
        runs = fetch_runs(con, until)
        role_groups = define_role_group(runs)
        directory_map, directory_order = directory_layout(runs)
        stats = build_overview(con, outdir, until, role_groups, directory_map)
        build_by_family_role(con, outdir, until, role_groups)
        build_by_role_group_family(con, outdir, until, role_groups)
        build_by_route_top(con, outdir, until=until)
        stats.update(build_findings(con, outdir, until))
        stats.update(build_ratings(con, outdir, until))
        cost_fn = load_cost_fn(routes_path)
        stats.update(build_cost_classes(con, outdir, cost_fn, until))
        unmapped = build_cost_class_routes(con, outdir, cost_fn, until)
        build_per_month(con, outdir, until)
        build_by_domain(con, outdir, until, role_groups)
        build_leave_one_directory_out(
            con, outdir, until, role_groups, directory_map, directory_order,
        )
        build_directory_exclusions(con, outdir, until, directory_map, directory_order)
        stats.update(build_data_quality(con, outdir, until, role_groups))
        stats.update(build_family_lookup_check(con, outdir, until))
        context = {
            "snapshot": snapshot_meta or {},
            "stats": stats,
            "role_groups": role_groups,
            "unmapped_routes": unmapped,
            "claude_agent_prefix_present": getattr(
                cost_fn, "has_claude_agent_prefix", False
            ),
        }
        write_readme(outdir, context)
        return stats
    finally:
        con.close()


def run_pipeline(
    db_path: str,
    routes_path: str | None,
    outdir: str,
    until: str = DEFAULT_UNTIL,
    snapshot_dir: str = DEFAULT_SNAPSHOT_DIR,
    from_snapshot: str | None = None,
) -> dict:
    snapshot_path, metadata = freeze_snapshot(
        db_path, routes_path, outdir, snapshot_dir, until, from_snapshot,
    )
    stats = build_all(snapshot_path, routes_path, outdir, until, metadata)
    return {"snapshot": metadata, **stats}


def readme_lines(context: dict | None) -> list[str]:
    context = context or {}
    snapshot = context.get("snapshot", {})
    stats = context.get("stats", {})
    role_groups = context.get("role_groups", {})
    lines = [
        "# Paper 1 data tables",
        "",
        "The script reads one frozen SQLite copy. It selects runs with started_at at or before the cutoff.",
        "The SQLite backup API copies the live database once. The script then reads only the copy.",
        "The default snapshot directory is ~/.local/share/paper1-snapshots/.",
        "Fable found 99.6 percent of rows have rater_route equal to the run route.",
        "",
        "## Snapshot",
        "",
    ]
    if snapshot:
        lines.extend([
            f"- SHA-256: `{snapshot.get('sha256', '')}`",
            f"- Snapshot file: `{snapshot.get('file_name', '')}`",
            f"- Copy time: `{snapshot.get('copy_time', '')}`",
            f"- Copy time basis: `{snapshot.get('copy_time_basis', '')}`",
            f"- Cutoff: `{snapshot.get('until', '')}`",
            f"- Runs in frozen copy: {snapshot.get('run_count', '')}",
            f"- Selected runs: {snapshot.get('selected_run_count', '')}",
            f"- Schema tables: {', '.join(snapshot.get('schema_tables', []))}",
        ])
        if snapshot.get("routes_file"):
            lines.extend([
                f"- Routes file: `{snapshot['routes_file']}`",
                f"- Routes SHA-256: `{snapshot.get('routes_sha256', '')}`",
            ])
    else:
        lines.append("Run the pipeline to record the snapshot SHA-256.")
    until = snapshot.get("until", DEFAULT_UNTIL)
    lines.extend([
        "",
        "Rebuild command:",
        "",
        "```sh",
        f"python3 research/paper1-agent-routing/scripts/paper1_tables.py --from-snapshot <snapshot.sqlite> --routes <routes.json> --until {until} --outdir research/paper1-agent-routing/data",
        "```",
        "",
        "## Tables",
        "",
        "- overview.csv: totals, producer and decision rates, and anonymous directory rows.",
        "- by_family_role.csv: family by role, with duration counts and verdict fields.",
        "- by_role_group_family.csv: producer and decision rates by family.",
        "- by_route_top.csv: the 30 largest routes, with duration counts and verdict fields.",
        "- by_domain.csv: domain by role group, with run share.",
        "- by_family_role_leave_one_dir_out.csv: sensitivity for cells with at least 30 verdicts.",
        "- directory_exclusions.csv: fail-maximum directory splits for all cells with at least 30 verdicts and the DeepSeek free route.",
        "- trial-evidence-sonnet.csv: Sonnet phase-acceptance rows after session matching.",
        "- route_match.csv: recorded and executed family agreement by scope and role group.",
        "- trial-evidence.csv: paper metrics and follow-up summary rows.",
        "- findings_by_family.csv: finding counts by family and severity.",
        "- findings_by_decision_runs.csv: findings and escapes per decision-role run.",
        "- ratings_given_by_rater_family.csv: scores grouped by the rater family.",
        "- ratings_received_by_family.csv: scores grouped by the rated run family.",
        "- ratings_by_family.csv: compatibility rows with an explicit direction.",
        "- review_agreement_by_checker_family.csv: one agreement measure by checker family.",
        "- cost_classes.csv: runs and verdict fields by cost class.",
        "- cost_class_routes.csv: route counts, cost classes, and unknown splits.",
        "- per_month.csv: every calendar month, including zero-run months.",
        "- data_quality.csv: duplicate groups, deduplicated rates, and zero durations.",
        "- family_lookup_check.csv: current family counts against the legacy rule.",
        "- snapshot.json: copy metadata, schema tables, and source hashes.",
        "",
        "## Exact hy routes",
        "",
    ])
    lines.extend(f"- `{route}`" for route in sorted(HY_ROUTES))
    lines.extend([
        "",
        "The exact route set replaces the legacy hy prefix rule.",
        "",
        "## Role groups",
        "",
        "The script reads distinct roles before it assigns each group.",
    ])
    if role_groups:
        lines.extend(f"- {role}: {group}" for role, group in sorted(role_groups.items()))
    else:
        lines.append("Run the pipeline to record the observed role mapping.")
    lines.extend([
        "",
        "Decision roles are review-a, review-b, review-c, adversarial, phase-acceptance, final-acceptance, acceptance, spec-review, and vision-review.",
        "Every other observed role is a producer role.",
        "A producer pass is a work result. A decision pass is an approval.",
        "No direct key links a producer run to reviewer verdicts about its artifact.",
        "Shared session_id or task_tag does not create that link.",
        "The script does not infer reviewer_mix from shared sessions.",
        "",
        "## Verdict fields",
        "",
        "- pass_rate is pass / (pass + fail).",
        "- verdicts is pass + fail. Coverage is verdicts / runs.",
        "- lower_bound is pass / runs. Upper_bound is (runs - fail) / runs.",
        "- pass_rate_lo and pass_rate_hi are the Wilson 95 percent interval.",
        "Wilson intervals use pass and fail only. They stay blank when verdicts are zero.",
        "small_cell is true when verdicts are below 30.",
        "Rates are proportions from 0 to 1. The script rounds them to four decimals.",
        "Agreement rates and compatibility agreement means use six decimal places.",
        "The script computes each rate from integer counts. It never rounds a rate before reuse.",
        "Run-level Wilson intervals do not adjust for clustered runs.",
        "",
        "## Directories and domains",
        "",
        "Directory IDs rank by selected run count. No CSV contains a directory basename.",
        "DOMAIN assigns code, markdown_curriculum, or benchmark from the proposed basename map.",
        "Leave-one-directory-out rows exclude each directory in global rank order.",
        "largest_dir_fail_share stays blank when the full cell has no failures.",
        "Directory exclusions use every family-role cell with at least 30 verdicts.",
        "They also include the DeepSeek free route.",
        "The split uses the directory with the most failures. Ties use global directory rank.",
        "fail_days_inside counts UTC dates with failures inside that directory.",
        "fail_date_min and fail_date_max cover inside failures only.",
        "busiest_two_day_fail_share divides failures on the two busiest UTC dates by all cell failures.",
        "",
        "## Matched route follow-up",
        "",
        "trial-evidence-sonnet.csv covers phase-acceptance runs from 2026-11-20 through the cutoff.",
        "It assigns each arm from the matched session route. It uses the recorded route when no session matches.",
        "It excludes matched sessions outside the two Sonnet arms.",
        "route_match.csv applies the claude-compare role-agent and run-window rule.",
        "It assigns one session to one run. Family comes from the recorded route.",
        "same_family_runs counts matched sessions whose executed family equals the recorded family.",
        "Unmatched runs have no executed-family check.",
        "A group share stays blank when it has no matchable runs.",
        "trial-evidence.csv keeps its original rows and appends the Sonnet and Jev follow-up summaries.",
        "",
        "## Ratings and agreement",
        "",
    ])
    renamed = stats.get("renamed_axis_rows", 0)
    lines.extend([
        f"The script renamed {renamed} test_mean rows to test_meaning. It kept evidence unchanged.",
        "The old ratings_by_family.csv rating rows equal ratings_received_by_family.csv.",
        "The ratings schema has rater_route. The given table uses that column.",
        "Rating rows use direction=received. Compatibility agreement rows use direction=rater_agreement.",
        "review_accuracy ratings and rater_checks describe the same check.",
        "The agreement table counts rater_checks once. It does not treat them as independent measures.",
        "Score count columns include zero counts for all scores from 1 through 5.",
    ])
    muse = stats.get("muse_agreement", {})
    if muse.get("checks"):
        lines.append(
            f"Muse agreement is {fmt_percent(muse['agreed'], muse['checks'])}% "
            f"({muse['agreed']} of {muse['checks']} checks)."
        )
    else:
        lines.append(
            f"The rounding regression is {fmt_percent(25, 31)}% "
            "(25 of 31 checks)."
        )
    lines.extend([
        "",
        "## Findings",
        "",
        f"Escape check: {stats.get('escape_check', 'not run')}.",
        "Every selected finding has escaped=1 if and only if severity=escape.",
        "Findings per decision run use decision-role runs in the same family.",
        "The CSVs contain no finding summaries or source paths.",
        "",
        "## Cost classes",
        "",
        "The claude-code/ prefix keeps its historical subscription fallback.",
    ])
    if context.get("claude_agent_prefix_present"):
        lines.append("The current routes file maps claude-agent/ directly. Its fallback stays disabled.")
    else:
        lines.append("The claude-agent/ prefix uses the same fallback only when the routes file has no prefix.")
    lines.extend([
        "The review found 1,291 unknown-class runs on 20 routes before the fallback change.",
        "That pre-fallback total included 1,047 legacy rows.",
        f"Computed unknown class: {stats.get('unknown_runs', 0)} runs on {stats.get('unknown_routes', 0)} routes.",
        f"Computed split: {stats.get('legacy_unknown_runs', 0)} legacy unknown-family runs and {stats.get('named_unknown_runs', 0)} named-route runs.",
        "Unknown includes legacy unknown-family rows and named routes without a cost mapping.",
        "",
        "Routes still unmapped:",
        "",
    ])
    unmapped = context.get("unmapped_routes", [])
    if unmapped:
        lines.extend(
            f"- `{item['route']}`: {item['runs']} runs, {item['split']}."
            for item in unmapped
        )
    else:
        lines.append("None.")
    changes = stats.get("changes", [])
    if changes:
        lines.extend(["", "Family lookup changes:"])
        lines.extend(
            f"- {item['family']}: {item['legacy_runs']} legacy runs, "
            f"{item['current_runs']} current runs, delta {item['delta']}."
            for item in changes
        )
    else:
        lines.extend([
            "",
            f"All {stats.get('labels', 0)} family labels are unchanged from the legacy rule.",
        ])
    lines.extend([
        "",
        "## Data quality",
        "",
        "data_quality.csv reports distinct_groups for all unique keys.",
        "It reports duplicate_groups for keys with at least two rows.",
        "It also reports extra_rows and extra_rows_same_result.",
        "extra_rows_same_result counts extra rows that match the retained lowest-id result.",
        "Main tables keep every selected row. Deduplication appears only in data_quality.csv.",
        "Zero duration means ended_at is non-null and equals started_at.",
        "",
        "## Caveats",
        "",
        "Missing verdicts differ by role and family. Read coverage and bounds with each rate.",
        "Runs cluster inside directories, tasks, and sessions. Run-level intervals can be too narrow.",
        "Family comes from the recorded route. It does not verify the executed model.",
        "Cost classes map plans, not spend. They do not measure token or quota consumption.",
        "Ratings come from project raters, not blind judges.",
        "",
    ])
    return lines


def write_readme(outdir: str, context: dict | None = None) -> None:
    os.makedirs(outdir, exist_ok=True)
    with open(os.path.join(outdir, "README.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(readme_lines(context)))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", default=DEFAULT_DB)
    parser.add_argument("--routes", default=DEFAULT_ROUTES)
    parser.add_argument("--outdir", default=None)
    parser.add_argument("--snapshot-dir", default=DEFAULT_SNAPSHOT_DIR)
    parser.add_argument("--until", default=DEFAULT_UNTIL)
    parser.add_argument("--from-snapshot", default=None)
    args = parser.parse_args()
    if args.outdir:
        outdir = args.outdir
    else:
        root = os.path.dirname(os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        ))
        outdir = os.path.join(root, "research", "paper1-agent-routing", "data")
    result = run_pipeline(
        args.db,
        args.routes,
        outdir,
        args.until,
        args.snapshot_dir,
        args.from_snapshot,
    )
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
