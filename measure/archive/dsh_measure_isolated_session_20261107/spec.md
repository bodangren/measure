# Specification: DSH Measure isolated-session rehearsal

## Overview

**Sprint goal:** The guard's strict deny is proven in a disposable project by driving a real isolated session whose working directory is that project — closing the Accepted Risk left by the agent-team rehearsal.

The rehearsal track proved the Red→Green→commit handoff with real subagents but not the strict deny path: a subagent spawned from this repo keeps the parent session's guard root, so fixture writes were outside the guard. The Host does expose a session-creation API whose request accepts `cwd` ("Directory the Session owns when no Workspace is named") — the `session.create` remote — but the HTTP API answers `401 unauthorized` to a bare request and is only reachable from the authenticated GUI. This track obtains the GUI's own auth context through the browser bridge, creates a session with `cwd` set to a disposable Measure fixture, prompts it to edit a source file with no Red phase, and records the strict deny. It does not ship any plugin change.

Discovery done before writing this spec (2026-11-07): the web GUI is `http://127.0.0.1:3080`; `GET /api/` etc. return `401`; the browser bridge can attach a tab to the GUI, so the authenticated client context (a token or cookie) is reachable from the page. The session controller's host schema has `session.create` with `{ workspaceId?, cwd? }` and returns `{ sessionId }`.

## Functional Requirements

- **FR-1 (a reusable host-API probe).** A test-support script `tests/dsh/rehearsal/host-api.mjs` (test-only) performs the authenticated calls the rehearsal needs: it reads the GUI auth value from an environment variable (`DSH_WEB_COOKIE`, never echoed), lists sessions (`GET /api/session`), creates one (`POST` with `{ cwd }`, the exact route/verb confirmed at run time), and prompts it (`POST` to the session's prompt route with `{ text }`, or the exact route confirmed at run time). Every call prints the HTTP status and a bounded body excerpt; a missing auth value or an unknown route is a clear error, not a crash. It never prints the auth value.
- **FR-2 (the fixture and its strict mode).** The rehearsal builds the disposable project with `tests/dsh/rehearsal/make-project.sh`, writes the fixture root's `strict` mode override in `repos.json`, and reloads (`bin/measure-dsh reload`) — the same seam the guards read. It removes the override, reloads, and removes the fixture afterwards.
- **FR-3 (the executed strict deny).** The script creates a session with `cwd` = the fixture root (the executed run issued the same calls from the GUI page context, which already holds the auth cookie, instead of exporting the secret; the script is the operator-facing form), prompts it to make a minimal source edit (for example create `src/greeting.js` with a TODO stub) with no Red phase, and captures the **strict deny** text ("write a failing test first") from the session's reply or event stream. A second prompt that follows the protocol (change a test file, run it, then edit the source) may be used to show the allowed path, but it is not required.
- **FR-4 (evidence).** The evidence records: the fixture path; the created session id and its `workingDirectory` (from the session summary, proving the fixture root); the prompt text; the HTTP statuses; the guard deny text verbatim; the cleanup commands and results (fixture absent, no `repos.json` entry, plugin reloaded, `git status` clean).
- **FR-5 (documentation and closeout).** `skills/measure-orchestrator/references/dsh.md` section 10 replaces the "accepted risk" with the proven session path (and keeps the subagent-root limitation); `docs/dsh.md` and the plugin README mention it; `CHANGELOG.md`, lessons, tech debt (the row narrows to the remaining limits), metadata, and the registry are updated and the track is archived.

## Run notes (2026-11-07)

The executed run also found a defect: `bin/measure-dsh reload` toggles a comment
marker, which changes no composed configuration, so the running plugin keeps its
cached repository-mode store (a fixture-rooted session created right after the
reload still reported `guard (config)`). A managed-block content change
(`install --mode <mode>`) did reload. The defect is recorded in
`measure/tech-debt.md` and is the next track (`dsh_measure_reload_20261107`).

## Non-Functional Requirements

- **NFR-1 (no plugin change).** The node suite stays 288/288 and both parity gates stay green (`plugins/dsh-measure-guard/scripts/check-parity.sh`, `plugins/opencode-measure-guard/scripts/check-parity.sh`).
- **NFR-2 (secret hygiene).** The auth value never appears in the script, the evidence, stdout, or a file; the script reads it from the environment and reports only whether it was present.
- **NFR-3 (test-only, temp-only).** The helper and the fixture live under the temp/tests area; no shipped package gains a file.
- **NFR-4 (cleanup).** No fixture, mode override, extra session left behind; the session may be closed or left inert (a session is not a file); document which.
- **NFR-5 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the authenticated GUI context, When I run the host-API probe, Then it lists sessions and creates a fixture-rooted session (its `workingDirectory` is the fixture root).
- Given that session, When it prompts a source edit with no Red phase, Then the reply/events contain the strict deny text; the evidence records it verbatim.
- Given cleanup, Then the fixture is gone, `repos.json` has no fixture entry, the plugin was reloaded, and `git status` is clean; the evidence records each check with its command and result.
- Given the track completes, Then the node suite is 288/288, both parity gates pass, and the docs/registry/archive are updated.

## Out of Scope

- Shipping an HTTP client in the plugin.
- Automating the GUI (the browser bridge is used only to obtain the auth context, if the API confirms it is the same value).
- Windows paths and platform packaging.
