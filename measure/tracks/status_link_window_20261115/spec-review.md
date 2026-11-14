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

## Round 2

Date: 2026-11-15
Reviewer: measure-spec-review, kimi-code-plan-cn/kimi-for-coding#high

### What this track proposes

This track fixes two defects on one branch. D1 replaces the 3-line Link window in the measure-status parser and its built bundle with the guard parser scan rule (scan until the next entry line, the next markdown heading, or the end of the text, and take the first Link line), adds the three guard parse test cases, rebuilds and commits the panel bundle, and updates the README parse-rules bullet. D2 adds explicit type annotations at the 12 implicit-any places in mods/measure-guard/hooks/guards.ts with no runtime change, then refreshes the two plugin copies through their parity transforms. Red evidence and gate outputs are kept in measure/runs/status_link_window_20261115/, and only Daniel merges the pull request.

### How the current system works, per this spec

The measure-status extension parses measure/tracks.md with a pure parser, and parseTracks reads a bold entry's Link line only in the three lines after the title line (src/parse.ts line 57, shipped bundle panel/main.js line 2043), while the guard parser already scans to the next entry, heading, or end (mods/measure-guard/hooks/parse.ts lines 111-123 at b78377b). mods/measure-guard/hooks/guards.ts is the source of two copies: plugins/opencode-measure-guard/src/core/guards.ts is a byte-for-byte copy, and plugins/dsh-measure-guard/src/core/guards.ts is the source after one sed import transform, and each plugin's check-parity.sh enforces its rule. At b78377b, tsc --noEmit on the OpenCode plugin reports 12 implicit-any errors (TS7006, TS7034, TS7005), all in guards.ts lines 422 to 587; its parse.ts is clean.

### Findings

- F1 [Nit] spec.md Overview (D2): The claim that `bun x tsc --noEmit -p .` exits 2 does not match the measured exit 1 on these files (12 errors, outputs skipped under noEmit; tsc exits 2 only when diagnostics present and outputs generated). Rationale: a pinned volatile value; the fix and the exit-0 acceptance do not depend on it, but the Red evidence the worker keeps will show the real code.
- F2 [Nit] plan.md Task 1.1 and Task 1.2: Neither task notes that the measure-guard shell hook flags the `install` token and plain `cp`, so `bun install` and the byte-for-byte copy can stop a session whose main checkout has no active track; the deviation_notes of measure/archive/guard_link_window_20261115/metadata.json record this, and this review reproduced the block. Rationale: wording only; the worker should not rediscover a recorded stopped gate during the D2 Red step or the parity copy.

### Author Response
- F1: DECLINE
- F2: DECLINE
