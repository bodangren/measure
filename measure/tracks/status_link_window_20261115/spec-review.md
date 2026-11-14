# Spec Review: status_link_window_20261115

Author model: volcengine-agent-plan/glm-5.3-flash

## Round 1

Date: 2026-11-15
Reviewer: measure-spec-review, unknown

### What this track proposes

This track fixes two defects in one pass. D1 updates the measure-status parser: `parseTracks` reads a bold track entry's `*Link:*` line past the next three lines, with the scan rule of the guard parser (scan until the next entry line, the next markdown heading, or the end of the text, and take the first Link line). The track adds the three guard test cases, rebuilds the panel bundle, and updates the README parse-rules bullet. D2 adds explicit type annotations in the shared `guards.ts` source and copies it to the two plugin copies by their parity transforms, with no runtime change. Red evidence and gate outputs go to `measure/runs/status_link_window_20261115/`, the work runs on `fix/status-link-window`, and only Daniel merges the pull request.

### How the current system works, per this spec

The measure-status extension parses `measure/tracks.md` with a pure parser and ships the same parser in the built bundle `panel/main.js`. Its `parseTracks` reads the `*Link:` line of a bold entry only in the three lines after the title line (`parse.ts` line 57, bundle line 2043). The guard parser already scans past that window (PR #14, track `guard_link_window_20261115`), so a longer description misses the band but not the guard. The mod's `guards.ts` is the source of two copies: the OpenCode copy is byte-for-byte, and the DSH copy follows one import transform. At `b78377b` the OpenCode type gate fails on implicit-any errors in `guards.ts`, lines 422 to 587.

### Findings

- F1 [Nit] extensions/measure-status/README.md (FR-4): The intro sentence "The parser follows the rules of `mods/measure-guard`" stays, but the extension parser keeps a subset of the guard rules: no ordered-list prefix, no same-line Link check, and a LINK_LINE that requires the leading asterisk (the Mediarr shape). A fresh reader can over-assume band-guard parity beyond the Link window. Rationale: wording that does not change what the implementer builds.
- F2 [Nit] plan.md Task 1.1 and Task 1.2: The plan requires `bun install` in both folders but does not note the recorded guard-hook interaction: the `deviation_notes` of `measure/archive/guard_link_window_20261115/metadata.json` record that the measure-guard shell hook flags the `install` token, blocked the dependency setup, and left the tsc gate stopped (TS2688). The plan should tell the implementer to run plain `bun install` without redirect or pipe decorations, and to record a stopped gate if the hook still blocks it. Rationale: wording that does not change what the implementer builds, but avoids a repeat of the recorded stopped-gate outcome for the D2 Red output and the tsc exit-0 acceptance.

### Author Response
- F1: DECLINE
- F2: DECLINE
