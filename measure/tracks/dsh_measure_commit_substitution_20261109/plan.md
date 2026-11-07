# Implementation Plan: DSH Measure commit guard substitution fail-closed

Track: `dsh_measure_commit_substitution_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The fail-closed rule and its cases

- [x] Task 1.1: `plugins/dsh-measure-guard/src/commit.js`: in `addedPaths()`, set `all` when a command substitution (`$(...)` or backticks) mentions a `git add`, keeping the existing token behavior otherwise
- [x] Task 1.2: `plugins/dsh-measure-guard/tests/commit.test.js`: substitution-with-add cases (dollar and backtick) return `all: true`; substitution-without-add and plain commit stay `all: false`; existing cases unchanged
- [x] Task 1.3: run `node --test plugins/dsh-measure-guard/tests/*.test.js` and both parity scripts
- [ ] Task: Measure - User Manual Verification 'Phase 1: The fail-closed rule and its cases' (Protocol in workflow.md)

## Phase 2: Records and gates

- [x] Task 2.1: resolve the commit-race row in `measure/tech-debt.md` (the substitution case is now fail-closed) and add the `CHANGELOG.md` bug-fix entry
- [x] Task 2.2: run `bash tests/dsh/run.sh` (13/13) and `bash tests/spec_review_gate/run.sh` (11/11)
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_commit_substitution_20261109` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
