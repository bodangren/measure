# Spec Review: fixture_paths_20261115

Author model: kimi-code-plan-cn/kimi-for-coding#high

## Round 1

Date: 2026-11-15
Reviewer: measure-spec-review, opencode-go/deepseek-v4.1-flash (substitution for the Kimi table model)

### What this track proposes

The track adds one rule to non_test_paths() of the mid-red checker. A path is
test-owned when a fixtures folder sits at any depth under a folder whose name
ends in -tests. The Decided change adds an is_tests_fixture() helper above
non_test_paths() and two lines directly after the /__tests__/ and /tests/
check. A new suite, tests/spec_review_gate/test_fixture_paths.py, pins every
example path and two end-to-end gate cases. The track then records the change,
archives itself, and adds its registry entry.

### How the current system works, per this spec

non_test_paths() sits in
skills/measure-orchestrator/scripts/measure_interphase_checks.py at line 232.
It lists a path as non-test unless the path starts with measure/, ends with a
TEST_SUFFIXES suffix, or holds /__tests__/, /tests/, or a leading tests/. The
mid-red branch of role-gate calls non_test_committed_files() in the unscoped
mode and non_test_paths() on the track's own paths in the scoped mode. A path
under harness/model-guide-tests/fixtures/ matches none of these rules, so the
gate lists it as non-test and fails. The Lending project therefore needed a
recorded deviation for each such fixture.

### Findings

- F1 [Nit] spec.md Acceptance Criteria: The first criterion says the discover command passes (run directly, Red and Green), but the Test section says the test-owned unit group and Case A must fail before the checker change. Rationale: the Red evidence is a failing run, so a reader of the final acceptance criteria can expect the opposite of the Test section.
- F2 [Nit] spec.md FR-2 and plan.md Task 1.2: "at the top of '## Unreleased' under the existing '### Bug Fixes' heading" names two positions, because "### Chores" is the first subsection of "## Unreleased" (CHANGELOG.md line 5). Rationale: a worker can place the entry above "### Chores" and still follow the words, so name the top of the "### Bug Fixes" list only.
- F3 [Nit] plan.md Task 1.2 and spec.md FR-2: the plan gives the content of the CHANGELOG entry (the rule, the Lending cause, and that every other rule stays) but not its exact text, while the precedent that the plan cites (measure/archive/copywriter_allow_20261115/plan.md Task 1.2, "with the exact text of FR-2") gives it. Rationale: the worker still chooses the bold title and the sentence, so this record text is not pinned.

### Author Response

- F1: FIX
- F2: FIX
- F3: FIX

Round 1 passed with no Blocker. Orchestrator decision: F1 to F3 FIX now, no Round 2.
