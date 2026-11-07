# Spec Review: dsh_measure_midred_evidence_20261107

Author model: deepseek-official/deepseek-flash

## Round 1

Date: 2026-11-07
Reviewer: subagent (fresh context, default model)

### What this track proposes

Repairing the mid-red *records* without touching checker behaviour: define
"closeout-clean" for a manual track (the automation-supervisor closeout manifest
is out of scope), fix the archived follow-up plan's task list and missing SHAs,
record the closeout output plus the four task SHAs in a named ledger under
`measure/runs/`, add the two parity gates to the archived record track's plan,
write the five findings verbatim with one disposition each into that track's
`spec-review.md` (linked from its index), and correct the record track's
spec/plan/metadata.

### How the current system works, per this spec

`measure_interphase_checks.py closeout --track <track>` prints one `FAIL:` line
per problem and exits 1 when the track is still active, a non-deferred plan task
is not `[x]`, an `[x]` task has no 7–40 hex commit SHA, `metadata.json` lacks
`status: done` or a completion date, or `automation-supervisor-closeout-manifest.json`
is absent. `measure/runs/` is gitignored (`.gitignore`), although the repository
already tracks 185 files there; 1.1/1.2/1.3 carry `8a9f4aa`, 2.1 carries
`31835e6`, Task 2.2 `a481293`, and the Phase 2 verification `da75968`.

### Findings

- F1 [Major] spec.md FR-1 / plan.md Task 1.1: the ledger the acceptance depends on lives at `measure/runs/dsh_measure_midred_records_20261107/closeout.txt`, which `.gitignore` ignores; no commit contained it, so the committed plan pointed at a file a fresh clone does not have (185 files under `measure/runs/` are tracked, so the plan must force-add or use a tracked path). Rationale: the deliverable is checkable evidence.
- F2 [Blocker] plan.md Task 1.5: "record the results" named no file or format, and no step read the ledger back although FR-1 said a verification step does. Rationale: the same zero-decision gap the track's own F3 rated Blocker.
- F3 [Major] plan.md Phase 1: the completed tasks carried no commit SHA of their own, so `closeout --track dsh_measure_midred_evidence_20261107` printed four "completed plan task lacks commit SHA" FAILs. Rationale: the track's own F1 requires `[x]` plus a SHA.
- F4 [Major] spec.md Overview / plan.md Task 1.4 (FR-5): the archived record track was left non-closeout-clean — its plan had tasks without SHAs and open Phase 2 tasks, while its `metadata.json` still said `actual_tasks: 7` for the eight-task plan. Rationale: the Overview's "closed the mid-red records" and FR-5's claim were not met.
- F5 [Major] spec.md FR-1: the "exact" closeout-clean definition covered only tasks already `[x]`, metadata, and the registry; it omitted the checker's "every non-deferred task is `[x]`" rule and the active-track rejection. Rationale: `closeout --track dsh_measure_midred_records_20261107` failed on two `[ ]` tasks the definition would not call unclean.
- F6 [Major] spec.md Overview F4: the bullet said the record items had "no finding ids", but the archived records spec's FR-3 already named F1–F3; only severity, the finding text, and ids for the four observations were missing. Rationale: the account of what F4 asked for was inaccurate.
- F7 [Nit] plan.md Tasks 1.2/1.4/2.1: files were named by track or type only. Rationale: the paths are derivable but never stated.

### Author Response

- F1: FIX (the ledger is force-added and now tracked — `git ls-files` lists it — and the closeout read-back is appended to it)
- F2: FIX (the ledger path and its contents are named in Task 1.1/1.5 and read back; the read-back section is in the file)
- F3: FIX (the evidence plan's tasks carry `3b6aa95`/`3119de8`; its closeout now reports only the expected manifest FAIL)
- F4: FIX (the archived record track's tasks are `[x]` with SHAs, its `metadata.json` records 8 tasks, and its closeout reports only the expected manifest FAIL)
- F5: FIX (the definition now includes "every non-deferred task is `[x]`" and the active-registry check)
- F6: FIX (the Overview says the missing parts were the severity/text for F1–F3 and the ids for the observations)
- F7: FIX (the follow-up plan's Phase 3 tasks name `measure/archive/dsh_measure_midred_records_20261107/{spec.md,plan.md,metadata.json}` and the evidence index path)
