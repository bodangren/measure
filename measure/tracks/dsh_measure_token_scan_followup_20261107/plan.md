# Implementation Plan: DSH Measure token scan follow-up

Track: `dsh_measure_token_scan_followup_20261107`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The two scan rules [checkpoint: 6075a73]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: in `shellTokens`, a backslash-newline inside a double-quoted span is a line continuation (both characters dropped, the word continues; the header states it); in `addedPaths`, a `git` word counts only at a command start (first word or directly after a separator `;`/newline/`&`/`&&`/`|`/`||`), so `echo git add .` contributes nothing while `cd x && git add a.ts` and `git -C dir add .` still do
- [x] Task 1.2: Red/Green tests: a double-quoted backslash-newline continuation (`git add "src/file\` newline `.ts"` → `paths: ['src/file.ts']`), the command-boundary negative (`echo git add . && git commit …` → no paths), a post-separator positive, and the existing cases unchanged; the old scan fails the double-quoted case
- [x] Task 1.3: the suite passes and both parity gates stay ok
- [x] Task: Measure - User Manual Verification 'Phase 1: The two scan rules' (Protocol in workflow.md) `6075a73`

## Phase 2: The records

- [x] Task 2.1: the archived `measure/archive/dsh_measure_add_quoting_followup_20261107/plan.md` tasks carry their SHAs (1.1/1.2/1.3 = `21e03a3`, 2.1 = `313c88a`, 3.1–3.4 = `c9eec5e`, 4.1 = `5f4be9f`); Task 3.4 names the ledger `measure/runs/dsh_measure_midred_records_20261107/closeout.txt` and the format (append the four gate results and read them back)
- [x] Task 2.2: correct `measure/archive/dsh_measure_midred_evidence_20261107/spec.md`'s Overview F4 bullet (F1–F3 were already named in the records spec; what was missing was their severity/text and the four observations' ids); correct `measure/archive/dsh_measure_add_quoting_followup_20261107/spec.md` FR-3 (no "escaped case" in the baseline) and name the evidence file in its plan Task 2.1
- [x] Task 2.3: append the node/parity/CLI/srg results to the mid-red ledger and read them back; run `closeout --track dsh_measure_add_quoting_followup_20261107` and record that it reports only the expected manifest FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 2: The records' (Protocol in workflow.md)

## Phase 3: Gates and closeout

- [ ] Task 3.1: run the node suite, both parity gates, `bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`; archive the track and update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase 3: Gates and closeout' (Protocol in workflow.md)
