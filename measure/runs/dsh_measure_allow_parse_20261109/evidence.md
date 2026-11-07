# Allow-list parse hardening evidence

Date: 2026-11-09

parse.ts (mods source, byte-identical in both plugin cores): dedupe via visited Set (first-seen order); allowProblem order 1 = C0 control character -> 'has a control character'.
Tests: duplicate/./src dedupe, NUL entry ignored, 2000-line list (315 node tests). OpenCode adapter V6/V7 updated (static; bun not installed) and both README rule tables list the control-character rule as order 1.
Parity ok (both); CLI 13/13; srg 11/11.
Row: dedupe and binary items resolved; extremely wide list remains the accepted operator risk.

## Closeout

FAIL: missing closeout manifest: /home/daniel-bo/Desktop/measure/measure/archive/dsh_measure_allow_parse_20261109/automation-supervisor-closeout-manifest.json
