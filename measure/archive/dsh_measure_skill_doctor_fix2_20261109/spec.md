# Specification: DSH Measure skill-doc check fix2

## Overview

The skill-description repository check added
`tests/dsh/test-skill-docs.sh`, but its review found the "folder links" rule was
misread: the archived `skill_doctor_fixes_20261031` finding N3 is a `SKILL.md`
Markdown link to the folder `assets/code_styleguides/` (npm rule
`skill.referenced-directory`), not a filesystem symlink. The check guarded
symlinks, which guards nothing for that regression. The review also found fixture
gaps: no `|`/`>` block description, no 1024/1025 boundary, no `<`-only or
`>`-only case, and no missing-description case.

This track replaces the bundle-symlink rule with the real Markdown-folder-link
rule (plus the symlink scan kept as a separate, correctly named rule), and adds
the missing fixtures.

## Functional Requirements

- **FR-1 (folder links).** For every `skills/*/SKILL.md`, every Markdown link
  target (after stripping any `#anchor` and surrounding `<...>`); if the target is
  empty, starts a scheme, or ends with `/`, or the target resolves to a directory
  relative to the SKILL.md folder, the check reports
  `skill <name> links to a folder: <target>`. A file link passes.
- **FR-2 (fixtures for the rules).** Negative fixtures: a directory Markdown link,
  a trailing-slash target, a bundle symlink (reported as `symbolic link`), and a
  missing `description` key (reported as `missing description`). Positive
  boundary fixtures: a description of exactly 1024 characters passes, 1025 fails;
  a `|` block description is parsed (1025 chars fails, ≤1024 passes); a `<`-only
  and a `>`-only description each fail.
- **FR-3 (records).** The review of `dsh_measure_skill_doctor_check_20261109` is
  recorded with F1–F8 and dispositions; its spec gets a dated correction note;
  the tech-debt row stays resolved; `CHANGELOG.md` is unchanged or clarified.
- **FR-4 (verification).** `bash tests/dsh/test-skill-docs.sh` passes with all
  fixtures, `bash tests/dsh/run.sh` is 13/13, srg 11/11, node 301/301, both parity
  gates ok.

## Non-Functional Requirements

- **NFR-1 (bounded).** bash + python3 stdlib; no network; no write in the real
  repository.
- **NFR-2 (contract preserved).** The existing 12 CLI tests keep their behavior
  and the suite gains this one; the real skills pass.

## Acceptance Criteria (track level)

- Given a SKILL.md link to an existing folder, Then the check fails and names the
  skill and target.
- Given a 1024-character description, Then it passes; given 1025, Then it fails.
- Given a `|` block description with 1025 characters, Then it fails; a ≤1024
  block passes; `<`-only and `>`-only each fail; a missing description fails.
- Given the gates, Then CLI 13/13, srg 11/11, node 301/301, parity ok; each phase
  checkpoint is pushed.

## Out of Scope

- The commit staged-read race, the opencode rows, and the remaining
  spec_review_gate docs rows.

> **Correction (2026-11-09, dsh_measure_skill_doctor_fix3_20261109):** the
> shipped folder-link rule skips `#anchor`-only links and scheme targets; a target
> is a folder claim only when (after removing a `#fragment`) it is empty, ends with
> `/`, or resolves to a directory relative to the skill folder. The folded `>`
> block marker is pinned by a fixture (1025 fails, a short folded description
> passes). The missing-description message is `skill <name> has no description`.
> The existing 13 CLI tests keep their behavior and no test file is added.
