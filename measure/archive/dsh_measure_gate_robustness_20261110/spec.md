# Specification: DSH Measure gate robustness

## Overview

The spec-review-gate suites still carry the last open "group" row (Group (b)): the live
corpus check reads *every* `.log` under `measure/runs/` and the archive — including
gitignored, untracked, or foreign logs — so an invalid log a developer happens to have on
disk can fail `PROJECT_TESTS` without any implementation regression, and the gate is not
reproducible across clones. The A11 doc-drift recipe has the matching wart: under
`bash -o pipefail` an empty document makes the `grep | tr | grep | sort -u | while` pipeline
exit 1, because the first `grep` finds no match, so a consumer that runs the recipe under
`pipefail` sees a failure for a perfectly valid empty document.

This track makes both deterministic: the live corpus is the *committed* corpus
(`git ls-files`), so a foreign or stale log cannot fail the gate and every clone runs the
same checks; and the A11 recipe tolerates an empty or match-less document by ending the
per-document pipeline with `|| true`. Both catalogs keep byte-identical A11 blocks.

## Functional Requirements

- **FR-1 (G19 tracked corpus).** `tests/spec_review_gate/test_s3_adversarial.sh` builds its
  live corpus from `git ls-files -- measure/runs measure/archive` filtered to `.log` files
  (NUL-separated, exact bytes) instead of a filesystem walk, and records the corpus size.
  The two corpus assertions (no dispositions feedback or Traceback; each log with both exact
  result lines exits 0) still run over the tracked logs.
- **FR-2 (pipefail tolerance).** The A11 detection block in
  `skills/measure-orchestrator/references/anti-pattern-catalog.md` and
  `measure/anti-patterns.md` ends the per-document pipeline with `done || true`, so a
  document with no claims (empty, or no matching backtick paths) exits 0 even under
  `bash -o pipefail`; the two blocks stay identical.
- **FR-3 (pins).** `test_s4_adversarial.sh` records that the `-o pipefail` empty-document
  case now exits 0 (was 0-or-1). `test_s3_adversarial.sh` keeps its live corpus assertions.
- **FR-4 (records).** The Group (b) tech-debt row becomes `Resolved`; `CHANGELOG.md`
  records the robustness fix; the installed plugin is reloaded and the live check passes.
- **FR-5 (verification).** srg 11/11, CLI 13/13, node 333/333, both parity gates ok, and the
  foreign-log proof (an untracked invalid log in `measure/runs/` leaves S3 green) is
  recorded; the archive and closeout (manifest-only FAIL) are recorded.

## Non-Functional Requirements

- **NFR-1 (no behavior change for tracked logs).** Every tracked log is still validated; a
  tracked log that regresses still fails the suite.
- **NFR-2 (recipe semantics unchanged).** Exit 0 for the empty case only; the candidates
  and their order do not change.

## Acceptance Criteria (track level)

- Given a foreign untracked `measure/runs/…/bad.log` with an invalid dispositions line,
  Then the S3 live corpus ignores it and the suite passes.
- Given `bash -o pipefail` on the A11 recipe with empty documents, Then it exits 0.
- Given the gates, Then srg 11/11, CLI 13/13, node, and parity are green and the archive
  is pushed.
