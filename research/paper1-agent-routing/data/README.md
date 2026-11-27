# Paper 1 data tables

The script reads one frozen SQLite copy. It selects runs with started_at at or before the cutoff.
The SQLite backup API copies the live database once. The script then reads only the copy.
The default snapshot directory is ~/.local/share/paper1-snapshots/.
Fable found 99.6 percent of rows have rater_route equal to the run route.

## Snapshot

- SHA-256: `59eddd0eb34019870463451367f5f059a176331b00acab0beb30b295776e89b0`
- Snapshot file: `outcomes-20261127T083716761728Z.sqlite`
- Copy time: `2026-11-27T08:37:16.990865Z`
- Copy time basis: `live_backup`
- Cutoff: `2026-11-26T22:21:52Z`
- Runs in frozen copy: 5947
- Selected runs: 5871
- Schema tables: collected_files, findings, rater_checks, ratings, runs, schema_version
- Routes file: `routes.json`
- Routes SHA-256: `a59582047f3a9f50898977086328da9fcfffb1508130de2b1d0602d8d3164030`

Rebuild command:

```sh
python3 research/paper1-agent-routing/scripts/paper1_tables.py --from-snapshot <snapshot.sqlite> --routes <routes.json> --until 2026-11-26T22:21:52Z --outdir research/paper1-agent-routing/data
```

## Tables

- overview.csv: totals, producer and decision rates, and anonymous directory rows.
- by_family_role.csv: family by role, with duration counts and verdict fields.
- by_role_group_family.csv: producer and decision rates by family.
- by_route_top.csv: the 30 largest routes, with duration counts and verdict fields.
- by_domain.csv: domain by role group, with run share.
- by_family_role_leave_one_dir_out.csv: sensitivity for cells with at least 30 verdicts.
- directory_exclusions.csv: fail-maximum directory splits for all cells with at least 30 verdicts and the DeepSeek free route.
- trial-evidence-sonnet.csv: Sonnet phase-acceptance rows after session matching.
- route_match.csv: recorded and executed family agreement by scope and role group.
- trial-evidence.csv: paper metrics and follow-up summary rows.
- findings_by_family.csv: finding counts by family and severity.
- findings_by_decision_runs.csv: findings and escapes per decision-role run.
- ratings_given_by_rater_family.csv: scores grouped by the rater family.
- ratings_received_by_family.csv: scores grouped by the rated run family.
- ratings_by_family.csv: compatibility rows with an explicit direction.
- review_agreement_by_checker_family.csv: one agreement measure by checker family.
- cost_classes.csv: runs and verdict fields by cost class.
- cost_class_routes.csv: route counts, cost classes, and unknown splits.
- per_month.csv: every calendar month, including zero-run months.
- data_quality.csv: duplicate groups, deduplicated rates, and zero durations.
- family_lookup_check.csv: current family counts against the legacy rule.
- snapshot.json: copy metadata, schema tables, and source hashes.
- number-map.csv, trial-evidence.csv, trial-evidence-sonnet.csv, route_match.csv, leave_one_dir_out_focus.csv: hand-maintained inputs. The rebuild command does not regenerate them; it reads the snapshot and writes the other tables plus this README.

## Exact hy routes

- `opencode-go/hy4-flash-free#high`
- `opencode-go/hy4-flash-free#medium`
- `opencode-go/hy4-flash-free#none`
- `opencode-go/hy4-preview`
- `opencode/hy4-flash-free#high`

The exact route set replaces the legacy hy prefix rule.

## Role groups

The script reads distinct roles before it assigns each group.
- acceptance: decision
- adversarial: decision
- coder: producer
- final-acceptance: decision
- green: producer
- phase-acceptance: decision
- record: producer
- red: producer
- review-a: decision
- review-b: decision
- review-c: decision
- small: producer
- spec-review: decision
- strategy: producer
- vision-review: decision

Decision roles are review-a, review-b, review-c, adversarial, phase-acceptance, final-acceptance, acceptance, spec-review, and vision-review.
Every other observed role is a producer role.
A producer pass is a work result. A decision pass is an approval.
No direct key links a producer run to reviewer verdicts about its artifact.
Shared session_id or task_tag does not create that link.
The script does not infer reviewer_mix from shared sessions.

## Verdict fields

- pass_rate is pass / (pass + fail).
- verdicts is pass + fail. Coverage is verdicts / runs.
- lower_bound is pass / runs. Upper_bound is (runs - fail) / runs.
- pass_rate_lo and pass_rate_hi are the Wilson 95 percent interval.
Wilson intervals use pass and fail only. They stay blank when verdicts are zero.
small_cell is true when verdicts are below 30.
Rates are proportions from 0 to 1. The script rounds them to four decimals.
Agreement rates and compatibility agreement means use six decimal places.
The script computes each rate from integer counts. It never rounds a rate before reuse.
Run-level Wilson intervals do not adjust for clustered runs.

## Directories and domains

Directory IDs rank by selected run count. No CSV contains a directory basename.
DOMAIN assigns code, markdown_curriculum, or benchmark from the proposed basename map.
Leave-one-directory-out rows exclude each directory in global rank order.
largest_dir_fail_share stays blank when the full cell has no failures.
Directory exclusions use every family-role cell with at least 30 verdicts.
They also include the DeepSeek free route.
The split uses the directory with the most failures. Ties use global directory rank.
fail_days_inside counts UTC dates with failures inside that directory.
fail_date_min and fail_date_max cover inside failures only.
busiest_two_day_fail_share divides failures on the two busiest UTC dates by all cell failures.

## Matched route follow-up

trial-evidence-sonnet.csv covers phase-acceptance runs from 2026-11-20 through the cutoff.
It assigns each arm from the matched session route. It uses the recorded route when no session matches.
It excludes matched sessions outside the two Sonnet arms.
route_match.csv applies the claude-compare role-agent and run-window rule.
It assigns one session to one run. Family comes from the recorded route.
same_family_runs counts matched sessions whose executed family equals the recorded family.
Unmatched runs have no executed-family check.
A group share stays blank when it has no matchable runs.
trial-evidence.csv keeps its original rows and appends the Sonnet and Jev follow-up summaries.

## Ratings and agreement

The script renamed 4 test_mean rows to test_meaning. It kept evidence unchanged.
The old ratings_by_family.csv rating rows equal ratings_received_by_family.csv.
The ratings schema has rater_route. The given table uses that column.
Rating rows use direction=received. Compatibility agreement rows use direction=rater_agreement.
review_accuracy ratings and rater_checks describe the same check.
The agreement table counts rater_checks once. It does not treat them as independent measures.
Score count columns include zero counts for all scores from 1 through 5.
Muse agreement is 80.6% (25 of 31 checks).

## Findings

Escape check: PASS.
Every selected finding has escaped=1 if and only if severity=escape.
Findings per decision run use decision-role runs in the same family.
The CSVs contain no finding summaries or source paths.

## Cost classes

The claude-code/ prefix keeps its historical subscription fallback.
The current routes file maps claude-agent/ directly. Its fallback stays disabled.
The review found 1,291 unknown-class runs on 20 routes before the fallback change.
That pre-fallback total included 1,047 legacy rows.
Computed unknown class: 1291 runs on 20 routes.
Computed split: 1047 legacy unknown-family runs and 244 named-route runs.
Unknown includes legacy unknown-family rows and named routes without a cost mapping.

Routes still unmapped:

- `opencode/minimax-m3.1-flash-free#high`: 113 runs, named_route_without_map.
- `opencode/glm-5.3-flash-free#high`: 43 runs, named_route_without_map.
- `bailian-token-plan/qwen3.8-max#high`: 38 runs, named_route_without_map.
- `bailian-token-plan/glm-5.3#high`: 14 runs, named_route_without_map.
- `coding-plan/kimi-k3.1-pro#high`: 12 runs, named_route_without_map.
- `volcengine-agent-plan/glm-5.3-flash#high`: 7 runs, named_route_without_map.
- `volcengine-agent-plan/deepseek-v4-pro#high`: 3 runs, named_route_without_map.
- `muse-spark-1.3-contributor`: 2 runs, named_route_without_map.
- `volcengine-agent-plan/ark-code-latest#high`: 2 runs, named_route_without_map.
- `bailian-token-plan/deepseek-v4-pro#high`: 1 runs, named_route_without_map.
- `bailian-token-plan/qwen3.8-flash#high`: 1 runs, named_route_without_map.
- `claude-sonnet-5-5`: 1 runs, named_route_without_map.
- `coding-plan/deepseek-v4-pro#high`: 1 runs, named_route_without_map.
- `coding-plan/doubao-seed-evolving#high`: 1 runs, named_route_without_map.
- `coding-plan/glm-5.3-flash#high`: 1 runs, named_route_without_map.
- `opencode/glm-5.3-flash-free`: 1 runs, named_route_without_map.
- `volcengine-agent-plan/glm-latest#high`: 1 runs, named_route_without_map.
- `volcengine-agent-plan/kimi-k3.1-pro#high`: 1 runs, named_route_without_map.
- `volcengine-agent-plan/minimax-m3#high`: 1 runs, named_route_without_map.

All 17 family labels are unchanged from the legacy rule.

## Data quality

data_quality.csv reports distinct_groups for all unique keys.
It reports duplicate_groups for keys with at least two rows.
It also reports extra_rows and extra_rows_same_result.
extra_rows_same_result counts extra rows that match the retained lowest-id result.
Main tables keep every selected row. Deduplication appears only in data_quality.csv.
Zero duration means ended_at is non-null and equals started_at.

## Caveats

Missing verdicts differ by role and family. Read coverage and bounds with each rate.
Runs cluster inside directories, tasks, and sessions. Run-level intervals can be too narrow.
Family comes from the recorded route. It does not verify the executed model.
Cost classes map plans, not spend. They do not measure token or quota consumption.
Ratings come from project raters, not blind judges.
