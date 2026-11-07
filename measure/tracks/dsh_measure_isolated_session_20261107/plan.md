# Implementation Plan: DSH Measure isolated-session rehearsal

Track: `dsh_measure_isolated_session_20261107`
Spec: [./spec.md](./spec.md)

A feature track in three phases: obtain the authenticated host context and wrap
the session API in a test-only helper, run the fixture-rooted session to capture
the strict deny, then document and close out. The gate is
`node --test plugins/dsh-measure-guard/tests/*.test.js` (stays 288), both parity
scripts, `bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`.

## Phase 1: The authenticated host-API probe [checkpoint: 0f4d32c]

- [x] Task 1.1: discover and record the GUI's auth context (browser bridge: attach to `http://127.0.0.1:3080`, read the page's storage/cookie for the value that authorizes `/api/`; record only whether it exists, never the value) and probe `GET /api/session` with it
- [x] Task 1.2: `tests/dsh/rehearsal/host-api.mjs` (test-only): the auth value from an environment variable; list sessions (`GET /api/session`); create a session with `{ cwd }` (route/verb confirmed by the probe); prompt it with `{ text }`; print status and bounded excerpts; error clearly when auth is missing; never print the auth value
- [x] Task 1.3: run the helper against the live host: list sessions, create a throwaway fixture-rooted session, print its summary (`workingDirectory` = the fixture root), and close/leave it inert
- [x] Task: Measure - User Manual Verification 'Phase 1: The authenticated host-API probe' (Protocol in workflow.md) `0f4d32c`

## Phase 2: The executed strict deny

- [ ] Task 2.1: build the fixture (`tests/dsh/rehearsal/make-project.sh`), write the fixture root's `strict` mode override in `repos.json`, reload, create a session with `cwd` = fixture, prompt a minimal source edit with no Red phase, and capture the strict deny text
- [ ] Task 2.2: cleanup (clear the override, reload, remove the fixture) and record the evidence: fixture path, session id and `workingDirectory`, prompt text, HTTP statuses, deny text verbatim, cleanup commands and results
- [ ] Task: Measure - User Manual Verification 'Phase 2: The executed strict deny' (Protocol in workflow.md)

## Phase 3: Documentation and closeout

- [ ] Task 3.1: replace the "accepted risk" in `skills/measure-orchestrator/references/dsh.md` §10 with the proven session path (keeping the subagent-root limitation); update `docs/dsh.md`, the plugin README, `CHANGELOG.md`, `measure/lessons-learned.md`, and `measure/tech-debt.md`
- [ ] Task 3.2: `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase 3: Documentation and closeout' (Protocol in workflow.md)
