# Implementation Plan: DSH Measure skill-description repository check

Track: `dsh_measure_skill_doctor_check_20261109`
Spec: [./spec.md](./spec.md)

**Each phase checkpoint is pushed to `origin/main` before the next phase.**

## Phase 1: The check and its fixtures

- [x] Task 1.1: `tests/dsh/test-skill-docs.sh`: parse each `skills/*/SKILL.md` frontmatter description (inline or block), fail on more than 1024 characters or a `<`/`>` character, and fail on a symbolic link under `claude-skills/`, each with the offending name
- [x] Task 1.2: negative fixtures in a temporary tree (oversized description, angle bracket, folder link) each rejected, and the real repository passing
- [x] Task 1.3: run `bash tests/dsh/test-skill-docs.sh` and `bash tests/dsh/run.sh` (13/13)
- [ ] Task: Measure - User Manual Verification 'Phase 1: The check and its fixtures' (Protocol in workflow.md)

## Phase 2: Records and gates

- [x] Task 2.1: resolve the `skill_doctor_fixes_20261031` row in `measure/tech-debt.md` and add the `CHANGELOG.md` bug-fix entry
- [x] Task 2.2: run the node suite (301/301), both parity scripts, and `bash tests/spec_review_gate/run.sh` (11/11)
- [ ] Task: Measure - User Manual Verification 'Phase 2: Records and gates' (Protocol in workflow.md)

## Phase 3: Closeout

- [ ] Task 3.1: `metadata.json`, archive the track, update `measure/tracks.md`; run `closeout --track dsh_measure_skill_doctor_check_20261109` and record the manifest-only FAIL
- [ ] Task: Measure - User Manual Verification 'Phase 3: Closeout' (Protocol in workflow.md)
