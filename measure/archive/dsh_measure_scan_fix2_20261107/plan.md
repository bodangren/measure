# Implementation Plan: DSH Measure commit scan fix2

Track: `dsh_measure_scan_fix2_20261107`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: Command prefixes [checkpoint: bda9226]

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: a `git` word counts at a command start if it is the first word, directly after a separator, or after a run of command prefixes (an environment assignment matching `^[A-Za-z_][A-Za-z0-9_]*=`, or `env`/`sudo`/`command`/`exec`/`nice`/`time`); documented in the header `f279977`
- [x] Task 1.2: tests: `FOO=1 git add secret.ts`, `env git add a.ts`, `sudo git add b.ts`, and `env FOO=1 sudo git add c.ts` all yield their paths; the `echo git add .` negative and existing cases unchanged; the old scan fails the new cases `f279977`
- [x] Task 1.3: the suite passes and both parity gates stay ok `f279977`
- [x] Task 1.4 (review F3, added after the Phase 1 checkpoint): extend the prefix rule to option-bearing wrappers — `sudo -u <user> git add`, `env -i git add`, `nice -n <n> git add` — skipping a wrapper's option words and the arguments of `-u`/`-n`/`-C`/`--user`/`--nice`/`--chdir`/`--unset`; add the three tests and prove the previous scanner fails them; both parity gates stay ok `38b51cd`
- [x] Task: Measure - User Manual Verification 'Phase 1: Command prefixes' (Protocol in workflow.md) `bda9226`

## Phase 2: Records [checkpoint: dd04ad2]

- [x] Task 2.1: `measure/runs/dsh_measure_midred_records_20261107/closeout.txt`: add a track index at the top and a clearly named section per track and run; the archived `measure/archive/dsh_measure_add_quoting_followup_20261107/plan.md` Task 3.4 cites the ledger and its "Token-scan follow-up gates" section `36d3b23`
- [x] Task 2.2: correct `measure/archive/dsh_measure_token_scan_followup_20261107/spec.md`: the Overview states the exact pre-fix record (Task 4.1 and the verification lines carried SHAs; eight task lines lacked one, the checker reported seven because it skips the deferred task) and FR-4 distinguishes task commits from phase checkpoint SHAs `36d3b23`
- [x] Task 2.3: run the node suite, both parity gates, `bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`; append them under a named "Scan fix2 gates" ledger section and read them back `36d3b23`
- [x] Task: Measure - User Manual Verification 'Phase 2: Records' (Protocol in workflow.md) `dd04ad2`

## Phase 3: Gates and closeout

- [x] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_scan_fix2_20261107` and record that it reports only the expected manifest FAIL; each phase checkpoint pushed; archived at `194899a`
- [ ] Task: Measure - User Manual Verification 'Phase 3: Gates and closeout' (Protocol in workflow.md)
