# Implementation Plan: DSH Measure commit guard: token-scan `git add` and record corrections

Track: `dsh_measure_add_quoting_followup_20261107`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The whole-command token scan [checkpoint: 3f0a12f]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: replace `GIT_ADD_SEGMENT` + `shellWords(substring)` with `shellTokens(command)` (words, separators `;`/newline/`&`/`&&`/`|`/`||`, single-quote literal, double-quote `\"`/`\\`, backslash-newline continuation, backslash escape, `#` comment to end of line, unterminated quote → `null`) and rewrite `addedPaths` to find every `git` [-C `<dir>`]* `add` token run and parse its words with the current semantics
- [x] Task 1.2: Red: `commit.test.js` cases — a backslash-newline continuation with an untracked path, a quoted `;` path, a real trailing-comment command, a quoted `*` stays `all`, an unterminated quote `all`, existing cases unchanged; run against the old extraction and record the failing cases
- [x] Task 1.3: Green: the suite passes (all cases), both parity gates ok
- [x] Task: Measure - User Manual Verification 'Phase 1: The whole-command token scan' (Protocol in workflow.md) `3f0a12f`

## Phase 2: The quoting record corrections [checkpoint: 964d706]

- [x] Task 2.1: correct the archived quoting track's `spec.md`/`plan.md` (the Overview's old-code claim, FR-2's `--` wording, the quoted-separator claim), add each task its 7-character SHA, and update the installed evidence with the module path and exact `node` invocation; update `plugins/dsh-measure-guard/README.md` and the resolved `measure/tech-debt.md` residual text (only wrapper scripts and command substitution remain)
- [x] Task: Measure - User Manual Verification 'Phase 2: The quoting record corrections' (Protocol in workflow.md) `964d706`

## Phase 3: The mid-red records [checkpoint: e9615ae]

- [x] Task 3.1: force-add the tracked ledger `measure/runs/dsh_measure_midred_records_20261107/closeout.txt` and read it back; the mid-red evidence track's own tasks carry SHAs
- [x] Task 3.2: make the archived record track closeout-clean: every task `[x]` with its SHA (including Task 1.5 and Phase 2's Task 2.1/verification), `metadata.json` `actual_tasks: 8`; correct its closeout-clean definition (every non-deferred task `[x]`, active-registry check) and its Overview F4 wording; `closeout --track dsh_measure_midred_records_20261107` reports only the expected manifest FAIL
- [x] Task 3.3: write `measure/archive/dsh_measure_midred_evidence_20261107/spec-review.md` with the F1–F7 findings verbatim and one disposition each, link it from that track's `index.md`, and add the track's task SHAs
- [x] Task 3.4: run the node suite, both parity gates, `bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`; record the results
- [x] Task: Measure - User Manual Verification 'Phase 3: The mid-red records' (Protocol in workflow.md) `e9615ae`

## Phase 4: Closeout

- [ ] Task 4.1: `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase 4: Closeout' (Protocol in workflow.md)
