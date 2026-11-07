# Spec Review: dsh_measure_midred_records_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-07
Reviewer: subagent (fresh context, default model)

### What this track proposes

Reconciling the two archived mid-red rename tracks: marking the follow-up plan's
Task 2.2 and Phase 2 verification task complete with their SHAs, adding the
missing SHAs to every completed task, adding `assertNotIn("tests/a.py", out)` to
the mid-red rename case, writing the follow-up archive's `spec-review.md` (Round 1
F1–F3, the four closeout observations, and the author responses) and linking it
from that track's `index.md`, and adding a dated correction note to the archived
mid-red `spec.md`. It then runs the follow-up closeout check and requires the
gates (srg 10/10, node 288/288, both parity gates).

### How the current system works, per this spec

`committed_files()` returns both sides of a rename from the single
`git diff --name-only --no-renames -z <baseline>..HEAD` call;
`non_test_committed_files()` drops `measure/`, test suffixes, and `tests/` paths.
The follow-up archive is closed (status `done`) and its Task 2.2 and Phase 2
verification already carried `a481293`/`da75968`; the four completed tasks without
SHAs were 1.1, 1.2, 1.3, and 2.1. `closeout_feedback()` checks the archive path,
the registry, `[x]` with a SHA on non-deferred tasks, metadata status/date, and
`automation-supervisor-closeout-manifest.json`; the follow-up has no manifest, so
the command prints one FAIL line and exits 1.

### Findings

- F1 [Major] spec.md Overview item 1 / FR-1: the spec said the follow-up plan's Task 2.2 and Phase 2 verification task were `[ ]`, but both were `[x]` with SHAs (`a481293`, `da75968`); the tasks that actually lacked a SHA were 1.1, 1.2, 1.3, and 2.1. Rationale: FR-1 and plan Task 1.1 pointed at already-satisfied lines and never named the four lines that needed the edit.
- F2 [Major] spec.md Overview / FR-1: "closeout-clean" was never defined and cannot be read as PASS — `closeout_feedback()` requires `automation-supervisor-closeout-manifest.json`, the follow-up archive has none, and the command PRINTs `FAIL: missing closeout manifest` and exits 1; FR-1 accepted that item as "documented" without saying whether creating the manifest is in scope. Rationale: the goal promised a state the plan does not reach while the acceptance criterion quietly accepted the FAIL.
- F3 [Blocker] plan.md Task 1.1: the task said to "record the result" of the closeout run but named no file and no format, and FR-1's "documented as the archival artifact" named no destination. Rationale: the zero-decision check treats an open file location as a Blocker, and no plan step read the evidence back.
- F4 [Major] spec.md FR-3: the record items were not concrete — no finding ids, severity, or text for the three findings or the four observations — and "the author responses" did not require one disposition per finding (FIX/CONTEST/ESCALATE/DECLINE). Rationale: a fresh implementer would invent the record and nothing could check it.
- F5 [Major] spec.md FR-5 / plan.md Task 1.4: FR-5 required both parity gates, but no plan task ran them or named the scripts (`plugins/dsh-measure-guard/scripts/check-parity.sh`, `plugins/opencode-measure-guard/scripts/check-parity.sh`). Rationale: a track-level acceptance criterion had no corresponding plan step.

### Author Response

- F1: FIX (the spec now names the correct four tasks and their SHAs; Task 2.2/verification keep `a481293`/`da75968`)
- F2: FIX (closeout-clean is defined: every non-deferred `[x]` task has a SHA, metadata `done` + date, registry `[x]`; the automation-supervisor manifest is explicitly out of scope and the single expected FAIL)
- F3: FIX (the ledger is `measure/runs/dsh_measure_midred_records_20261107/closeout.txt`, holding the exact output, the four SHAs, and the parity outputs; a plan step reads it back)
- F4: FIX (this file records the five findings verbatim with ids/severities and one disposition each)
- F5: FIX (the archived record plan gained a parity verification task naming both scripts and the ledger location)
