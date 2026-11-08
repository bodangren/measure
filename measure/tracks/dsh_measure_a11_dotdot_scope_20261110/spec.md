# Specification: DSH Measure A11 dotdot scope

## Overview

The A11 doc-drift recipe checks every backtick path claim with `[ -e "$p" ]` relative to
the project root, including claims that leave the repository through `..`. Group (e)'s
remaining residual records it: "the recipe tests `..` paths outside the repository."
A project document could therefore make the audit probe arbitrary paths outside the
project (and report candidates for them), which is both out of scope and an information
leak in the audit result.

This track bounds the recipe: a claim containing a `..` segment is skipped, with the
sentences around the recipe stating the rule and that candidates are reports, not
confirmed drift. The two catalogs keep byte-identical A11 blocks and the S4 contract rows
change to the bounded behavior, including a `..` that resolves inside the repository
(the rule is deliberately conservative: any `..` segment skips the claim).

## Functional Requirements

- **FR-1 (recipe).** The A11 bash block in
  `skills/measure-orchestrator/references/anti-pattern-catalog.md` and
  `measure/anti-patterns.md` skips a claim that contains a `..` segment
  (`../*`, `*/../*`, `*/..`) before the existence check; the blocks stay identical.
- **FR-2 (wording).** The paragraph after the recipe says the `..` rule and that the
  candidates are reports, not confirmed drift (the audit confirms them).
- **FR-3 (tests).** `test_s4_adversarial.sh` contract rows: a `..` path outside the
  repository gives no line (was one line for a missing path); a `..` that resolves inside
  the repository is also skipped; the existing inside-repo cases keep their lines.
- **FR-4 (records).** The Group (e) tech-debt row becomes `Resolved`; `CHANGELOG.md`
  records the bound; the installed plugin/skills are reloaded and the live check passes.
- **FR-5 (verification).** srg 11/11 (S4 with the changed rows), CLI 13/13, node
  342/342, both parity gates ok; the track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (bounded).** One `case` skip; no path resolution, no realpath, no new command.
- **NFR-2 (no behavior change for existing claims).** A claim without `..` keeps its exact
  behavior and output ordering.

## Acceptance Criteria (track level)

- Given `` `../absent_zz.txt` `` in product.md, Then the recipe prints no line and touches
  nothing outside the fixture.
- Given `` `src/../src/missing.txt` ``, Then the recipe prints no line (conservative rule).
- Given the gates, Then srg/CLI/node/parity are green and the track is archived.
