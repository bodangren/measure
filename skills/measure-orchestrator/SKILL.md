---
name: measure-orchestrator
description: Orchestrate Measure track execution with dedicated subagents, role-specific models, TDD handoffs, audit contracts, and deterministic inter-phase checks. Use this skill whenever the user asks to run Measure automation, supervise a Measure track or phase, replace measure-supervisor.py, delegate Red/Green/review/acceptance/closeout work to subagents, verify phase gates, or archive completed Measure tracks.
---

# Measure Orchestrator

Use this skill to turn a Measure track into a coordinated sequence of focused subagents. The Measure subagents (`measure-strategy`, `measure-mid-red`, `measure-jr-green`, `measure-review-a-correctness`, `measure-review-b-security`, `measure-review-c-ux-api`, `measure-phase-acceptance`, `measure-adversarial-testing`, `measure-ux-browser-review`, `measure-final-acceptance`, `measure-closeout`, `measure-orchestrator-audit`) are already registered as opencode subagent types — invoke them with the `task` tool's `subagent_type` parameter. `scripts/measure_interphase_checks.py` provides mechanical checks between handoffs.

## Anti-Patterns Registry

Every project that uses the orchestrator should have a `measure/anti-patterns.md` that
catalogs orchestrator anti-patterns caught in that project or in the framework. The
catalog uses an A1–AN naming scheme; the orchestrator's auditors and reviewers consult
it before passing phase acceptance. A starter catalog with 10 entries (A1–A10) lives at
`references/anti-pattern-catalog.md` in this skill; projects extend it with project-
specific entries as they catch new classes of failure. The `measure-orchestrator-audit`
subagent appends new entries to project `measure/anti-patterns.md` when it catches a
new class of failure that the framework doesn't yet cover.

## Marker Vocabulary (Standardized)

Every plan uses these three markers:

- `[x]` — complete
- `[~]` — in-progress (live implementation; AI or human is working on it)
- `[b]` — blocked / human-gated (with trailing `deferred:<owner>` field)

The legacy `[ ]` (space) marker is **deprecated**. Some plans still use it for
"deferred" or "not started" but the supervisor no longer treats space as in-progress
(supervisor regex is `r"^- \[([~xb])\] (.+)"`). When a plan has `[ ]` (space) markers,
reclassify them to `[b]` with `deferred:<owner>` per the verification-checkpoint rule.

The supervisor's `is_task_structurally_blocked(task)` helper in
`measure/automation-supervisor.py` recognizes:
- `[b]` checkbox state
- trailing `deferred:<owner>` field (e.g. `… — deferred:phikul`)

A free-text occurrence of the word "deferred" no longer drops a task from the
incomplete count (this is **anti-pattern A1**, the highest-priority orchestrator
anti-pattern; see `references/anti-pattern-catalog.md`).

## `tests/_lib/` Template (deferred — see `tech-debt.md`)

A future template will provide shared bash libraries for every contract test to source:

- `banned_re.sh` — extracts `BANNED_RE` from `measure/doctor.sh` and prints it
- `track_dir.sh` — `track_dir_resolve <id>` prefers `measure/archive/<id>` if it exists
- `marker_consistency.sh` — `marker_consistency_check <plan> <phase>` returns INCOMPLETE on
  a phase with 0 `[x]` tasks (anti-pattern A4)
- `consent_check.sh` — `consent_check <artifact>` returns OK if anonymized or consent
  artifact present (anti-pattern A2)
- `refutation_filter.sh` — `refutation_filter <input>` excludes only file-path contexts
  and policy-disclaimer markers, not bare English words (anti-pattern A7)

The full lib is deferred (large change). Until installed, each `tests/*.sh` re-implements
the patterns inline; the `measure-orchestrator-audit` subagent flags divergence.

## Aggregate `bash measure/test-all.sh` (lightweight, post-deferred-lib)

Until the lib is installed, projects can add a `bash measure/test-all.sh` aggregate that:

- runs every `tests/*.sh` (no glob skip; tests that opt out of aggregates use a
  `## skip-aggregate:` header per test-strategy.md §7)
- emits a single summary: total tests, total PASS, total FAIL, exit code
- is the canonical "run every measure contract test" entry point

This replaces the current `npm test` (which only runs `tests/s1.sh` on TUTOR-001
projects). A future pre-commit hook can run this aggregate.

## Start Here

1. Find the Measure repo root. It must contain `measure/index.md`, `measure/tracks.md`,
   `measure/anti-patterns.md`, and `measure/tracks/`.
2. Read `measure/index.md`, `measure/tracks.md`, `measure/anti-patterns.md`, the
   selected track `spec.md`, the selected track `plan.md`, and `test-strategy.md` if
   present.
3. Run:

```bash
python3 ~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py status --repo .
```

Use the first listed incomplete phase as the default next phase unless the user names a
track or phase. **Note:** a phase with 0 non-deferred incomplete tasks is reported as
"all phases complete" — but this can mean "all automatable work done, humans need to do
the rest." Verify `[b]` markers in the plan are intentional before declaring success.

## Role Order

Run roles in this order. Strategy, Mid, and Jr are sequential. Review A/B/C can run in
parallel after Jr commits Green work if their write scopes are clear. The audit role
runs at any point in the cycle (recommended: weekly + on every supervisor change). Final
Acceptance must pass before Closeout.

1. `measure-strategy`
2. `measure-mid-red`
3. `measure-jr-green`
4. `measure-review-a-correctness`
5. `measure-review-b-security`
6. `measure-review-c-ux-api`
7. `measure-phase-acceptance`
8. `measure-adversarial-testing`
9. `measure-ux-browser-review` when applicable
10. `measure-orchestrator-audit` (anytime; recommended after every supervisor change)
11. `measure-final-acceptance`
12. `measure-closeout`

The `measure-orchestrator-audit` role is the only one that audits the *framework* itself
(supervisor, test scripts, plan truthfulness). Other audit roles audit the
*implementation* of a specific track. The two are complementary.

## Delegation

Invoke each role by calling the `task` tool with `subagent_type` set to the matching
Measure subagent type (e.g. `measure-jr-green`, `measure-mid-red`, `measure-review-a-correctness`,
`measure-orchestrator-audit`). Pass these values in the task prompt:

- repo root (absolute path)
- track id
- phase heading (or "track setup" / "track review" where appropriate)
- baseline SHA (`git rev-parse HEAD` at role start)
- result JSON path for audit roles (where the audit JSON must be written)
- relevant gate commands from the environment (`RED_TEST_COMMAND`, `GREEN_TEST_COMMAND`,
  `PROJECT_LINT`, `PROJECT_CHECKS`, `PROJECT_TESTS`, `PROJECT_DEV_URL`)

Every subagent may edit, because reviewers and auditors are expected to fix proven
blockers before returning. Preserve unrelated user work and do not revert changes made by
other agents.

## Inter-Phase Checks

Run the checker after each role. Treat failures as feedback for the next attempt.

```bash
python3 ~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py role-gate --repo . --role mid-red --track TRACK --phase "Phase 2: Test" --baseline BASE_SHA --log-file LOG
python3 ~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py role-gate --repo . --role phase-acceptance --track TRACK --phase "Phase 2: Test" --baseline BASE_SHA --result-file RESULT.json --log-file LOG
python3 ~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py closeout --repo . --track TRACK
```

The checker intentionally fails when required configured gates are missing. Set:

- `RED_TEST_COMMAND` for Mid.
- `GREEN_TEST_COMMAND` for Jr.
- `PROJECT_LINT`, `PROJECT_CHECKS`, and `PROJECT_TESTS` for final acceptance.
- `PROJECT_DEV_URL` when UX browser review is applicable.
- `UX_REQUIRED=auto|always|never`.

## Contracts

Read `references/contracts.md` before writing or reviewing role prompts. It defines the
required `MEASURE_AGENT_RESULT` block and audit JSON shape.

## Closeout Standard

Do not archive a track just because a markdown artifact says it passed. Closeout must verify:

- no non-deferred plan tasks remain (no `[~]`, no `[ ]` — only `[x]` or `[b]` with
  `deferred:<owner>`)
- completed tasks include commit SHA evidence
- final acceptance audit passed
- `measure/tracks/<track>` was moved to `measure/archive/<track>`
- `measure/tracks.md` no longer lists the track in the active section
- `metadata.json` has `status: "done"` and a completion date
- `automation-supervisor-closeout-manifest.json` exists
- no anti-pattern anti-A5 (false-claim text) or anti-A6 (registry overstatement) is
  present in `plan.md` or `measure/tracks.md`

## Evaluation

Initial eval prompts live at `evals/evals.json`. Before declaring the skill finished, run
the skill-creator evaluation loop and generate the human review artifact with
`eval-viewer/generate_review.py`. The 4th eval prompt (added in this revision) probes
the audit subagent's detection of A1–A7 anti-patterns.
