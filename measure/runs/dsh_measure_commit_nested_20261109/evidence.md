# Commit guard nested-command evidence

Date: 2026-11-09

addedPaths: git stage handled like git add; bash/sh/zsh -c and eval inner commands scanned recursively (depth cap 4; unreadable inner fails closed); merge of all/trackedOnly/paths.
Tests: git stage (path/-A/-u), bash -c, sh -c, eval, doubly nested, no-add inner, and a commitCheck no-task integration case. Node 306/306; parity ok (adapter-local); CLI 13/13; srg 11/11.
Tech-debt residual: arbitrary wrapper scripts and shell functions remain; the end-of-turn check stays the backstop.

## Closeout

FAIL: missing closeout manifest: /home/daniel-bo/Desktop/measure/measure/archive/dsh_measure_commit_nested_20261109/automation-supervisor-closeout-manifest.json
