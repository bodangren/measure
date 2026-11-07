# Specification: DSH Measure A11 recipe fix3

## Overview

The A11 fix2 track's review found only record/spec defects (the implemented
recipe is correct and the suite is 92/92):

- **F1 [Blocker]:** the spec, plan, and trailing correction note still pin the old
  pattern `^[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]*( [A-Za-z0-9_./-]+)?$`, which matches
  `src/ a.txt`; the shipped pattern (and the intended rule) is
  `^[A-Za-z0-9_.-]+/([A-Za-z0-9_./-]+( [A-Za-z0-9_./-]+)?)?$`.
- **F2 [Major]:** the `CHANGELOG.md` bullet still says "(85 checks)" and names
  only the A11 track, while the suite is 92 checks and the executable skip ships
  in fix2.
- **F3 [Nit]:** the root branch of the unreadable-document row (a G2 contract row
  skipped with a printed note) is unpinned; under root the total is 91, not 92.
- **F4 [Nit]:** FR-1's "and whose full text is not an existing path" clause is
  unobservable (skipped and existing spans both print nothing).
- **F5 [Nit]:** the spec/plan name the live 3-candidate count as an expectation,
  but the suite's G4 live run only prints it.

This track corrects the three pattern occurrences, the CHANGELOG facts, and the
record wording; it records the fix2 review with one disposition each and links
it from the fix2 index.

## Functional Requirements

- **FR-1 (the pattern).** The fix2 spec's FR-2, the plan's Task 1.1, and the
  dated correction note all use the shipped pattern
  `^[A-Za-z0-9_.-]+/([A-Za-z0-9_./-]+( [A-Za-z0-9_./-]+)?)?$`; no old pattern
  string remains in the fix2 track's documents.
- **FR-2 (the CHANGELOG).** The A11 bullet states 92 checks and names both A11
  tracks, and says the executable command skip ships in fix2.
- **FR-3 (the root branch).** The fix2 record states that under root the
  unreadable-document contract row is skipped with a note (91 checks) and that it
  is a contract row, not a G3 report row.
- **FR-4 (the wording).** The fix2 spec's FR-1 drops the unobservable clause and
  the live count is described as evidence (G4 prints it, no test asserts it).
- **FR-5 (the review).** `measure/archive/dsh_measure_a11_recipe_fix2_20261108/spec-review.md`
  records F1–F5 with one disposition each and is linked from that index.

## Non-Functional Requirements

- **NFR-1 (records only).** No recipe or test change; node 301/301, both parity
  gates, srg 10/10, and CLI 11/11 stay green.
- **NFR-2 (bounded).** The tech-debt file stays at or below 50 lines.

## Acceptance Criteria (track level)

- Given the fix2 track's documents, Then they contain the shipped pattern and no
  old pattern string.
- Given the CHANGELOG, Then the A11 bullet states 92 checks, both A11 tracks, and
  the fix2 executable skip.
- Given the fix2 review, Then it holds F1–F5 with dispositions and is linked.
- Given the gates, Then srg 10/10, node 301/301, parity ok, CLI 11/11; each
  phase checkpoint is pushed.

## Out of Scope

- Any recipe or test behavior change.
