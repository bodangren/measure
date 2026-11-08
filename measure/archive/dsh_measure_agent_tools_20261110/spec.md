# Specification: DSH Measure agent tools

## Overview

Two of the plugin's read-only gestures exist only as GUI slash commands: `/measure-verify`
(the on-demand ceremony check) and `/measure-mode` with no argument (report the effective
mode and its source). The agent tool surface can call neither — the tool list holds only
`measure_status` — so an agent that wants the verification verdict must ask the user to run
the command, which the hosted tool surface cannot dispatch. That is a real capability gap
for autonomous work, and the row records it.

This track adds two read-only tools that wrap the same functions the commands use:
`measure_verify` returns `verifyReport(deps, agent)` (git-backed problems, metadata
verdict, or the clean line) and `measure_mode` returns the effective mode and source from
`effectiveMode`. Neither mutates state, plans, metadata, or the guard configuration;
setting a mode stays with the command and the GUI.

## Functional Requirements

- **FR-1 (`measure_verify`).** A tool definition with `name`, `description`, an empty
  parameter object, a string output schema and renderer, whose `execute(_args, exec)`
  returns `verifyReport(deps, exec.agent)`; it is registered in `index.js` beside
  `measure_status`.
- **FR-2 (`measure_mode`).** A tool definition with the same shape whose `execute`
  reports `measure-guard: effective mode <value> (<source>).` from
  `effectiveMode(deps, root)`; it is read-only (no set path) and registered.
- **FR-3 (tests).** `plugin.test.js` asserts three registered tools with the expected
  names; `verify.test.js` asserts the verify tool's shape and its clean/problem output;
  `modes.test.js` asserts the mode tool's shape and the repo/session/config sources.
- **FR-4 (docs).** The guard README's tool section documents both tools and says the
  read-only scope; the tech-debt row about GUI-only commands records the agent tool
  surface for the read-only parts (setting a mode stays a command); `CHANGELOG.md`
  records the addition.
- **FR-5 (live).** The installed plugin is reloaded; the live check passes and the two
  tools are visible in the running host's tool list (the live check's 200 payload and the
  plugin registration test are the evidence).
- **FR-6 (verification).** node suite green with the new cases, both parity gates ok,
  srg 11/11, CLI 13/13; the track is archived with a manifest-only closeout FAIL.

## Non-Functional Requirements

- **NFR-1 (read-only).** No writes, no mode changes, no plan/metadata edits from either
  tool; failures degrade exactly as the commands do.
- **NFR-2 (same text).** The tool text is the command text (one implementation each).

## Acceptance Criteria (track level)

- Given `measure_verify`, Then it returns the same report text as `/measure-verify` for the
  same agent and state.
- Given `measure_mode`, Then it reports the effective value and source without changing
  anything.
- Given `apply(ctx)`, Then three tools are registered: measure_status, measure_verify,
  measure_mode.
