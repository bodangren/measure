# Specification: DSH Measure skill-description repository check

## Overview

The `skill_doctor_fixes_20261031` row records that nothing in the repository keeps
each `skills/*/SKILL.md` frontmatter `description` at or below 1024 characters or
free of the `<`/`>` characters, and nothing keeps the `claude-skills/measure`
bundle free of folder links; the track that fixed the `measure` description
(1052 characters before) ran npm `skill-doctor` from `/tmp`, outside the
repository. A future edit can reintroduce a description the harness rejects, and
no CI test notices.

This track adds `tests/dsh/test-skill-docs.sh` to the CLI contract suite: it
parses every `skills/*/SKILL.md` frontmatter description (inline or block),
fails when one exceeds 1024 characters or contains `<`/`>`, and fails when the
`claude-skills/` bundle contains a symlink. Negative fixtures (an oversized
description, an angle-bracket description, a folder link) prove each rule fires.

## Functional Requirements

- **FR-1 (description length).** For every `skills/*/SKILL.md`, the frontmatter
  `description` (inline or `|`/`>` block, whitespace-collapsed) is at most 1024
  characters; a longer one is reported with its skill name and length.
- **FR-2 (angle brackets).** The same description contains no `<` or `>`
  character (the skill format's disallowed characters); each violation is
  reported with its skill name.
- **FR-3 (bundle links).** `claude-skills/` contains no symbolic link (the bundle
  must hold real files, not folder links); each link is reported with its path.
- **FR-4 (fixtures).** The test builds a temporary skills tree and a temporary
  bundle for each negative case (oversized description, angle bracket, folder
  link) and asserts the checker rejects it, so a rule cannot regress to a
  vacuous pass; the real repository must pass.
- **FR-5 (records).** The `skill_doctor_fixes_20261031` row is resolved;
  `CHANGELOG.md` has a bug-fix entry.
- **FR-6 (verification).** `bash tests/dsh/test-skill-docs.sh` passes,
  `bash tests/dsh/run.sh` is 13/13, srg is 11/11, node 301/301, both parity gates
  ok.

## Non-Functional Requirements

- **NFR-1 (bounded).** bash + python3 stdlib; no network, no npm, no write in the
  real repository.
- **NFR-2 (contract preserved).** The real skill files, bundle, and CLI suite
  behavior are unchanged; the new test only reads them.

## Acceptance Criteria (track level)

- Given a 1200-character description, Then the test fails and names the skill.
- Given a description with `<` or `>`, Then the test fails and names the skill.
- Given a symlink under `claude-skills/`, Then the test fails and names it.
- Given the real repository, Then the test passes; CLI 13/13; each phase
  checkpoint is pushed.

## Out of Scope

- The commit staged-read race, the opencode rows, and the remaining
  spec_review_gate docs rows.
