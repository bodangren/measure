# Specification: Track Sets (create related tracks in one pass)

## Overview

Issue: https://github.com/bodangren/measure/issues/4

`new-track` creates one track per run. Each run asks for a spec format, runs a questioning phase, and has two Approve/Revise gates (spec and plan). A program-level request needs many related tracks that share decisions, a start gate, dependencies, and one overview page. An example is "recreate the Chibi Quest assets in the Riven Lands style": 16 tracks (3 foundation, 12 family, 1 scenes). With today's workflow, that request needs 16 questioning phases and 32 approval prompts for decisions that the user makes once. The agent in that session improvised a batch.

This track adds an opt-in **track set** path. A track set is a group of ordinary tracks that one run creates from one set of shared decisions. Each member is a normal track, so every existing reader (status, implement, review, revert, measure-guard, the orchestrator) keeps working.

**Sprint Goal:** A user can ask for a related set of tracks and get them in one pass: one shared questioning phase, one overview page, two review gates, a member template, a dependency record, and one commit.

### Constraints from earlier decisions

- The cancelled track `track_dependency_graph_20260527` proposed a `depends_on` field, a `measure graph` CLI, cycle detection, and a status rollup. It was cancelled because Measure runs one active track at a time and a CLI breaks the no-build-tools rule. This track adds no CLI, no graph output, and no status rollup. Dependencies are a record that `implement` reads for a warning.
- Opt-in additive design (lessons-learned, scrum_tracks_20260525): gate the new behavior on one signal (the `set` key in `metadata.json`), and every reader treats its absence as a standalone track, with no warning.

## Stories

### Story S1: Track set path in new-track
**As a** developer who plans a program of related work
**I want** `new-track` to offer a track set when my request implies several tracks
**So that** I answer the shared questions once and review a template, not every track

**Acceptance Criteria:**
- Given a description that asks for several tracks or splits into units that close separately, When `new-track` reads it, Then it asks "One track or a track set?" and follows `references/new-track-set.md` for a set.
- Given a description for one unit of work, When `new-track` reads it, Then the flow is unchanged (no extra question).
- Given the track set path, When the agent gathers requirements, Then one questioning phase covers scope and order, the split rule, the shared decisions, and the start gate.
- Given the shared answers, When the agent drafts the set, Then the user sees exactly two Approve/Revise gates: the set overview with the member list, and the samples (each unique member in full, one sample per template group).
- Given a member that needs a structural difference from its template, When the agent generates the members, Then that member is shown for review on its own.

**Estimate:** M
**Priority:** Must

### Story S2: Set overview and member metadata
**As a** developer or agent who picks up a set later
**I want** one overview page and a machine-readable membership record in each member
**So that** the order, the dependencies, and the shared decisions have one source

**Acceptance Criteria:**
- Given a new set, When the agent creates its artifacts, Then `measure/sets/<set_id>.md` holds the goal, the dated shared decisions, the member table (order, track, type, scope, depends on, status), the shared rules, and the open questions.
- Given the first set in a project, When the agent creates `measure/sets/`, Then `measure/index.md` gets a **Track Sets Directory** link.
- Given each member, When the agent writes `metadata.json`, Then it has `set = {id, order, depends_on[]}`, and every `depends_on` entry names a track with a lower order or a track outside the set.
- Given each member, When the agent writes `spec.md` and the registry entry, Then the spec has a `## Track Set` section that links the overview, and the registry entry has a `*Set:*` line under its link.
- Given all artifacts, When the agent finishes, Then it verifies the files, the JSON, and the dependency IDs, and makes one commit with explicit paths.

**Estimate:** S
**Priority:** Must

### Story S3: Keep a set current during implement, archive, and revert
**As a** developer who works through a set
**I want** the workflows to read and update the set record
**So that** a member does not start before its dependencies by accident, and the overview stays true

**Acceptance Criteria:**
- Given a selected track with `set.depends_on` entries that are not complete, When `implement` selects it, Then it names the open dependencies and asks for confirmation before it starts.
- Given a member track, When `implement` loads context, Then it also reads the set overview.
- Given a member track that starts or completes, When `implement` updates the registry, Then it updates the member's status cell in the overview, and marks the set complete when every member is done.
- Given a member track that is archived (implement or review) or reverted, When the workflow changes the registry, Then it updates the member's link or status in the overview.
- Given a track without a `set` key, When any of these workflows runs, Then nothing changes and no message appears.

**Estimate:** S
**Priority:** Must

### Story S4: Documentation and bundle parity
**As a** new user who reads the Measure skill
**I want** SKILL.md, the README, and the product definition to describe track sets
**So that** I know the path exists and when to use it

**Acceptance Criteria:**
- Given the updated skill, When I read `SKILL.md`, Then a "Track Sets (optional)" subsection (15 lines or fewer), the `sets/` directory, a "New Track Set" command entry, and trigger words in the description exist.
- Given the README and `measure/product.md`, When I read the command lists, Then each names the track set path in one line.
- Given any changed skill file, When I run `diff -r skills/measure claude-skills/measure`, Then there is no difference.

**Estimate:** S
**Priority:** Should

### Story S5: Dry run against a real set
**As a** maintainer of Measure
**I want** a fresh agent to follow the new reference for a real program request
**So that** ambiguous steps show up before the change reaches every agent

**Acceptance Criteria:**
- Given the Riven Lands request and the owner's answers from advantage-forge commit e3173ca7, When a fresh agent follows `new-track-set.md` without other context, Then it lists the artifacts it would create and every step where it had to guess.
- Given the dry-run report, When a step is ambiguous, Then the reference is corrected and the correction is recorded in `dry-run.md` in this track folder.

**Estimate:** S
**Priority:** Should

## Non-Functional Requirements

- Backward compatibility (hard constraint): no existing track, registry, or `metadata.json` needs a change. All readers treat `set` as optional.
- Additive only: no existing workflow step is removed, reordered, or renumbered. New steps go at the end of a list or as sub-bullets (lessons-learned: renumbering drifts cross-references).
- No new tool, script, or CLI.
- `skills/measure/` and `claude-skills/measure/` stay identical.

## Acceptance Criteria (track-level)

1. `new-track` offers the track set path only when the request implies several tracks.
2. `references/new-track-set.md` defines the full path: setup check, shared questioning, member list, spec format, overview, two review gates, templates, artifacts, verification, and one commit.
3. A member has `set = {id, order, depends_on}` in `metadata.json`, a `## Track Set` section in `spec.md`, and a `*Set:*` line in the registry. A standalone track has none of them.
4. `implement` warns about open dependencies, reads the overview, and keeps the overview status current. Archive and revert keep the overview links and status current.
5. SKILL.md, README, and `measure/product.md` describe the path.
6. A fresh-agent dry run finds no unresolved ambiguity.

## Out of Scope

- A `measure graph` command, a rendered dependency graph, or cycle detection beyond the order rule.
- A set section in the `status` report, and a set-level velocity.
- Moving or converting existing tracks into sets (including the Riven Lands tracks in advantage-forge).
- Parallel execution of set members. Measure still runs one active track at a time.
- Changes to measure-guard and the orchestrator. They read the registry status and link only, so the `*Set:*` line does not affect them.
