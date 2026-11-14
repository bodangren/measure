# Spec Review: guard_link_window_20261115

Author model: volcengine-agent-plan/glm-5.3-flash

## Round 1

Date: 2026-11-15
Reviewer: measure-spec-review, kimi-code-plan-cn/kimi-for-coding#high

### What this track proposes

This track fixes two defects in one branch. D1 widens the measure-guard
parser window: parseTracks in mods/measure-guard/hooks/parse.ts reads a bold
track's *Link:* line only within the next three lines today, and the fix scans
until the next track line, a markdown heading, or the end of the text. D2
repairs tests/spec_review_gate/test_s1_new_track.sh, which calls in_text and
in_flat without defining them, by adding those helpers, with blank and flat,
from test_s2_role_docs.sh, and by proving each check can fail with a temporary
mutation copy. The changed parse.ts is copied byte-for-byte to the two plugin
cores, both README texts are updated, and the track closes with the standard
light-lane finalize, archive, registry, and closeout checks.

### How the current system works, per this spec

parseTracks scans only the three lines below a bold track line for a *Link:*
line and skips the entry otherwise; the same-line Mediarr shape and the
TRACK_LINKED shape are parsed on their own lines. The OpenCode and DSH plugin
cores hold byte-for-byte copies of the mod parse.ts, and each plugin has a
scripts/check-parity.sh gate that prints parity: ok. tests/spec_review_gate/run.sh
runs test_*.sh and test_*.py suites; test_s1_new_track.sh defines pass, fail,
section, line_of, and in_block, but lines 59-60 call in_text and in_flat, which
exist only in test_s2_role_docs.sh, so the two checks print 'command not
found' and never run while the suite still passes.

### Findings

- F1 [Nit] spec.md Overview (D2): the fact line says the file defines `in_block` (line 48), but the definition sits at line 49; line 48 holds only its comment. Rationale: the one-line offset does not change what the implementer builds, and the helper is named either way.

### Author Response
- F1: DECLINE

