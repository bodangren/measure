# Specification: DSH Measure rehearsal follow-up corrections

## Overview

The agent-team rehearsal track (`dsh_measure_team_rehearsal_20261107`) ran a real
Red→Green cycle and documented the session-root finding, but its fresh review
found that the track *overclaimed* and that several artefacts are not exact:

1. **The central claim is contradicted by the evidence.** The archived Overview
   says a real Measure phase ran "with the guard live" and that nothing had ever
   executed the mapping, while FR-4 and the evidence record that the fixture's
   strict deny path was **not** exercised (the subagent kept the parent session's
   guard root). The per-agent strict handoff remains unproven.
2. **The plan still prescribes the refuted `cwd` = fixture rule** for Phase 3 and
   omits the isolated session and the Review spawn, so the phase's tasks do not
   implement the corrected FR-3.
3. **"A write under `measure/` is always allowed" is false.** The edit and TDD
   guards skip `measure/`, but the closeout guard denies a `tracks.md` close with
   an open task and a plan phase start without a checkpoint, and the registry
   tools and shell writes to `tracks.md`/`plan.md` are denied.
4. **The reference's closing summary refutes its own finding**: it says the guard
   applies to child agents through their own working directory, when the run
   established they keep the parent session's root.
5. **The acceptance criteria are not checkable**: "the subagent targets" and "the
   observed guard behaviour" have no defined fields or expected values.
6. **Cleanup is not asserted** (NFR-4): no criterion or check proves the fixture,
   its `repos.json` entry, and the temp state are gone.
7. **The fixture contract is underspecified**: FR-1/FR-2 leave the track id, task
   text, and the `loadSnapshot` io seam open, and the contract test checks
   `.git/HEAD` (which `git init` creates) rather than a commit.
8. **The parity gates are unnamed** in NFR-2.

This follow-up corrects the documents, strengthens the fixture contract test,
records the review with an explicit Accepted Risk for the unexecuted strict
path, and adds the concrete cleanup checks. It does not change the plugin.

## Functional Requirements

- **FR-1 (the corrected claim).** The archived rehearsal spec's Overview and
  FR-4 state exactly what the run proved: a Red→Green→commit cycle executed with
  real subagents and the guard watching the parent repository, while the fixture's
  strict deny path was **not** exercised; the Rehearsal reference states the same
  and the "accepted risk" (a true isolated-session rehearsal is deferred) names
  the platform facts: a subagent's `cwd` does not change its guard root, and the
  Host's `session.create` remote accepts a `cwd` but is only reachable through the
  authenticated GUI, not the agent tool surface.
- **FR-2 (the corrected rules).** The Rehearsal section's summary says the guard
  applies to child agents through the **parent session's** working directory (the
  `cwd` option changes only the shell directory); the "always allowed" sentence
  is corrected: `measure/` edits are outside the edit/TDD guards, but the
  closeout guard, the registry tool deny, and the shell-write deny still apply.
- **FR-3 (checkable acceptance).** The archived spec's acceptance and the
  evidence define the fields: the fixture path, the two subagent ids and the
  roles they played, the exact commands, the guard output observed (including
  "no deny" with the reason), the test failure and pass counts, the commit SHA,
  and the cleanup checks. A question ("check whether …") is replaced by a
  pass/fail criterion.
- **FR-4 (cleanup checks).** The evidence and acceptance require and record:
  the fixture directory does not exist, the fixture root has no `repos.json`
  entry, the plugin was reloaded after the cleanup, and `git status` is clean.
- **FR-5 (fixture contract hardening).** `tests/dsh/test-rehearsal-fixture.sh`
  asserts a real commit (`git -C <fixture> rev-parse --verify HEAD` succeeds and
  `git log --oneline` lists exactly one commit, not the `.git/HEAD` file); the
  spec names the exact fixture schema (track id `rehearsal_20260101`, the task
  "Add the greeting function", the four files) and the `loadSnapshot(io, root)`
  io seam the test supplies (an adapter with `resolve`/`readText`/`exists`/
  `gitLines`, as the plugin's snapshot tests do).
- **FR-6 (review record).** The archived track's `spec-review.md` records this
  round's findings and the author responses, with the F2/F3 items marked as an
  Accepted Risk (deferred isolated-session rehearsal) rather than silently fixed.

## Non-Functional Requirements

- **NFR-1 (no plugin change).** This track touches no plugin source; the node
  suite stays at 288 tests and both parity gates stay green:
  `plugins/dsh-measure-guard/scripts/check-parity.sh` and
  `plugins/opencode-measure-guard/scripts/check-parity.sh`.
- **NFR-2 (fixture is test-only).** The builder stays under `tests/dsh/` and uses
  the temp folder only.
- **NFR-3 (honest evidence).** Every claim in the archived spec is matched by a
  line in the evidence; nothing is upgraded to "proven" that the run did not test.
- **NFR-4 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the repository, When I run `bash tests/dsh/test-rehearsal-fixture.sh`,
  Then the new commit assertion passes (and fails against a repo with no commit).
- Given both parity gates, Then both print `parity: ok`; the node suite stays 288/288.
- Given the archived rehearsal track, Then its spec, plan, metadata, and
  `spec-review.md` state the corrected claim, the corrected rules, the exact
  acceptance fields, and the Accepted Risk for the deferred strict path.
- Given the evidence folder, Then it records the cleanup checks with their
  commands and results.

## Out of Scope

- Executing the true isolated-session rehearsal (needs an authenticated GUI
  session with `cwd`; recorded as an Accepted Risk and the next candidate track).
- Changing the guard's per-agent Red record or the plugin.
- Windows paths and platform packaging.
