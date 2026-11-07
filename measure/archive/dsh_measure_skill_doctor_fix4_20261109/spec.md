# Specification: DSH Measure skill-doc check fix4

## Overview

The skill-doc check fix3 added the folded `>` fixture and corrected the records,
but its review found:

- **F1 [Major]:** the fix2 review's F1 disposition claims the fixtures cover an
  anchor-only link and a scheme target as passing, but the test has neither — the
  seven in-page anchors are exercised only by the real-repository run, and no
  fixture pins `https://…`; a regression reporting either as a folder would pass.
- **F2 [Nit]:** the fix2 record and fix3 evidence say the test prints 12 PASS
  lines; a run prints 11 (the short folded pass prints no line).
- **F3 [Nit]:** the CHANGELOG bullet has no conjunction before "rejects a
  SKILL.md Markdown link…", running the description and folder-link rules
  together.
- **F4 [Nit]:** NFR-1 said "no write in the real repository except the record
  corrections and the test fixture" while the plan also writes the review record,
  metadata, the registry, and the archived folder.

This track adds the two passing fixtures (anchor-only and scheme), fixes the
CHANGELOG wording, corrects the stale PASS counts, and records the fix3 review.

## Functional Requirements

- **FR-1 (the passing fixtures).** `tests/dsh/test-skill-docs.sh` gains a
  temporary skill whose body holds an anchor-only link (`[top](#top)`) and a
  scheme link (`[site](https://example.com/x)`) and no folder link; the skill
  passes. Each scenario prints its own `[PASS]` line.
- **FR-2 (the records).** The CHANGELOG bullet gains the missing conjunction; the
  fix2 review's F1 disposition and the fix3 evidence state the true PASS count
  after the new fixtures.
- **FR-3 (the review).** `measure/archive/dsh_measure_skill_doctor_fix3_20261109/spec-review.md`
  records F1–F4 with one disposition each and is linked from that index; its spec
  gets a dated correction note (the passing fixtures exist, the PASS count, the
  CHANGELOG wording, and the NFR-1 wording).
- **FR-4 (verification).** `bash tests/dsh/test-skill-docs.sh` passes with the new
  fixtures, `bash tests/dsh/run.sh` is 13/13, srg 11/11, node 301/301, both parity
  gates ok.

## Non-Functional Requirements

- **NFR-1 (bounded).** bash + python3 stdlib; fixtures live in a temporary tree;
  the track's own bookkeeping writes (review record, metadata, registry, archive)
  are expected.
- **NFR-2 (contract preserved).** The real skills and bundle behavior are
  unchanged; the CLI suite count stays 13.

## Acceptance Criteria (track level)

- Given a skill with an anchor-only link and a scheme link, Then the test passes
  and prints a PASS line for that fixture.
- Given the CHANGELOG bullet, Then it reads grammatically and names both rules.
- Given the fix3 review, Then it holds F1–F4 with dispositions and is linked.
- Given the gates, Then CLI 13/13, srg 11/11, node 301/301, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- The commit staged-read race, the opencode rows, and the remaining
  spec_review_gate docs rows.
