# Specification: DSH Measure compact status band

## Overview

**Sprint goal:** The Measure band stays on one line and never eats vertical space, while the full position text remains one hover/`measure-status` away.

The band is the `conversation.input.dock` entry that shows the Measure position above the composer. Its primary line is the shared core's `bandLine()` text, which includes the **whole** active task text; the adapter then appends the session suffix. A real project (Mediarr) has task titles several hundred characters long, so the band wraps to many lines and consumes most of the vertical space. The same happens in this repository for long plan tasks. The full text is already available in the panel and in `measure_status`; the band only needs the position at a glance.

This track compacts the band in the adapter (the Client view), keeps the full line available as a hover title, and leaves the shared core untouched.

> **Correction (2026-11-07, dsh_measure_band_followup_20261107):** an earlier
> version of this spec said the sidebar panel also carries the full position
> text. It does not: the panel renders the status lines and the goal line, never
> the active task text. The full text is available through the band's hover
> title (`bandFull`) and in `measure_status` only.

Decisions made for this track (the owner reported the band length directly):

1. **Spec format:** story-shaped (feature track).
2. **Compaction is adapter-side.** `clientView` keeps calling the shared core's `bandLine()` and then produces two fields: `band` (single-line, compacted) and `bandFull` (the complete line). No shared-core change, no parity change.
3. **The cap and the ellipsis rule.** `band` is at most `BAND_MAX = 160` characters. When the full line is longer, cut at the last space at or before 159 characters, strip a trailing ` ·`, and append `…`. The `<n> sessions` suffix is applied before compaction, so a long suffix still truncates. A line of 160 characters or fewer is unchanged.
4. **One line in the UI.** The band container no longer wraps (`flexWrap: 'nowrap'`, `overflow: 'hidden'`); the primary span uses `whiteSpace: 'nowrap'`, `overflow: 'hidden'`, `textOverflow: 'ellipsis'`, `minWidth: 0`, `flex: '1 1 auto'`, and `title = view.bandFull`. The other chips (guards, mode, goal, setup, problems) stay in the same row and may be clipped only on very narrow viewports.
5. **Fail open.** A missing or non-string `band`/`bandFull` stays null; `clientView` never throws.
6. **Verification:** `node --test plugins/dsh-measure-guard/tests/*.test.js`, both parity gates, `bash tests/dsh/run.sh`, `bash tests/spec_review_gate/run.sh`, and a live route check that the band is one capped line with `bandFull` present.

## Stories

### Story S1: The band is one compact line
**As a** Measure user on the DeepSeek Harness
**I want** the status band to show the position without wrapping
**So that** the composer keeps its vertical space

**Acceptance Criteria:**
- Given a band line longer than 160 characters, When `clientView` builds the view, Then `band` is at most 160 characters, ends with `…`, and cuts on a word boundary; `bandFull` carries the complete line.
- Given a band line of 160 characters or fewer, Then `band` equals `bandFull` (no ellipsis).
- Given a second session, Then the `<n> sessions` suffix is part of the compacted `band` and can itself be truncated.
- Given a project without `measure/`, Then `band` stays null and `bandFull` is null.
- Given the Client band, Then the container does not wrap, the primary span ellipsizes, and its `title` attribute is `bandFull`.
- Given the shared core, When I run both parity gates, Then both print `parity: ok` (no core change).

**Estimate:** S
**Priority:** Must

### Story S2: Documentation, live check, and track closeout
**As a** Measure maintainer
**I want** the compact band documented and proven live
**So that** the fix is discoverable and the next session keeps it

**Acceptance Criteria:**
- Given the plugin README, `docs/dsh.md`, and `CHANGELOG.md`, Then the compact band, `BAND_MAX`, `bandFull`, and the one-line UI are documented.
- Given the running web profile after install + reload, When the state route is read, Then `band` is one line of at most 160 characters while `bandFull` holds the full position text.
- Given the track completes, Then `metadata.json` records the real counts and the track is archived with a registry update.

**Estimate:** S
**Priority:** Must

## Non-Functional Requirements

- **NFR-1 (no core change).** Both parity gates stay green; the compaction lives in `src/client-state.js` and `client.js`.
- **NFR-2 (no new dependency, no build).** Pure string handling and theme-token styles.
- **NFR-3 (ordering and localization).** The `measure-guard` plugin chrome labels stay localized; the compacted text is the parity-bound core text (English) as before.
- **NFR-4 (fail open).** A null/absent band and a non-string input never throw.
- **NFR-5 (POSIX).** Windows stays out of scope.

## Acceptance Criteria (track level)

- Given the plugin package, When I run `node --test plugins/dsh-measure-guard/tests/*.test.js`, Then every test passes and the count grows from 278 by the compaction and Client band tests.
- Given both parity gates, Then both print `parity: ok`; `bash tests/dsh/run.sh` and `bash tests/spec_review_gate/run.sh` pass.
- Given the running web profile, When the route is read after a reload, Then the band is capped and `bandFull` is present; the evidence is recorded under `measure/runs/dsh_measure_band_20261107/`.

## Out of Scope

- Core `bandLine()` wording or content changes.
- Redesigning the sidebar panel or the measure-status text.
- Responsive layout below the band (other chips may clip on narrow viewports).
- Windows paths and platform packaging.
