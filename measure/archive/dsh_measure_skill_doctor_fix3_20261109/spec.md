# Specification: DSH Measure skill-doc check fix3

## Overview

The skill-doc check fix2 implemented the real N3 folder-link rule, but its review
found the record and one fixture incomplete:

- **F1 [Blocker]:** FR-1 said an anchor-stripped empty target and a scheme-bearing
  target are folder-link reports, while the shipped check skips `#anchor` links
  and scheme targets (the seven in-page anchors in `skills/measure/SKILL.md` must
  pass, and `https://…` is not a folder).
- **F2 [Major]:** only the `|` block form has a fixture; the folded `>` form is
  unverified although the parser accepts both.
- **F3 [Nit]:** `measure/tech-debt.md` and `CHANGELOG.md` still credit the
  `claude-skills/` symlink scan for the folder-link debt; the N3 rule is the
  Markdown folder-link scan.
- **F4 [Nit]:** NFR-2 said the suite gains a test, but the check file already
  existed (13 tests before and after).
- **F5 [Nit]:** FR-2 named the missing-description message as `missing
  description`, while the check prints `skill <name> has no description`.

This track adds the folded `>` fixture, corrects the two records, and records the
fix2 review with dispositions.

## Functional Requirements

- **FR-1 (folded fixture).** `tests/dsh/test-skill-docs.sh` gains a `description: >`
  folded block fixture: a ≤1024 folded description passes and a 1025-character
  folded description fails, so both block markers are pinned.
- **FR-2 (the records).** `measure/tech-debt.md`'s skill_doctor row names the
  Markdown folder-link rule (N3, `skill.referenced-directory`) as the resolved
  check, not the symlink scan; the `CHANGELOG.md` skill-doc bullet names the
  same rule and keeps the separate bundle-symlink rule.
- **FR-3 (the review).** `measure/archive/dsh_measure_skill_doctor_fix2_20261109/spec-review.md`
  records F1–F5 with one disposition each and is linked from that index; its spec
  gets a dated correction note (anchor-only and scheme targets pass; the folded
  marker is pinned; the message is `has no description`; the existing 13 tests
  keep their behavior and no test file is added).
- **FR-4 (verification).** `bash tests/dsh/test-skill-docs.sh` passes,
  `bash tests/dsh/run.sh` is 13/13, srg 11/11, node 301/301, both parity gates ok.

## Non-Functional Requirements

- **NFR-1 (bounded).** bash + python3 stdlib; no write in the real repository
  except the record corrections and the test fixture.
- **NFR-2 (contract preserved).** The real skills and bundle behavior are
  unchanged; the suite count stays 13.

## Acceptance Criteria (track level)

- Given a folded `>` description of 1025 characters, Then the test fails; a
  ≤1024 folded description passes.
- Given the tech-debt row and CHANGELOG bullet, Then both name the Markdown
  folder-link rule and keep the symlink rule separate.
- Given the fix2 review, Then it holds F1–F5 with dispositions and is linked.
- Given the gates, Then CLI 13/13, srg 11/11, node 301/301, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- The commit staged-read race, the opencode rows, and the remaining
  spec_review_gate docs rows.

> **Correction (2026-11-09, dsh_measure_skill_doctor_fix4_20261109):** the fix2
> review's F1 disposition is now literally true: the test has a temporary skill
> with `[top](#top)` and `[site](https://example.com/x)` that must pass. The test
> prints 12 PASS lines (the previous record said 12 while a run printed 11). The
> CHANGELOG bullet has its missing conjunction. NFR-1's "no write in the real
> repository except the record corrections and the test fixture" omitted the
> track's own bookkeeping writes, which the plan requires: the fix2 review record
> (Task 1.3), `metadata.json`, `measure/tracks.md`, and the archived track folder
> (Task 2.2).
