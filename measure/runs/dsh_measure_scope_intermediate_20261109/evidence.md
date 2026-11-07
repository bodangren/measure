# Intermediate-commit scope coverage evidence

Date: 2026-11-09

history_files: git rev-list baseline..HEAD + git diff-tree --no-commit-id --name-only -r -z --no-renames (exact bytes).
Union applied to changed_files, committed_files, and the inline spec-review scope block.

test_checker.py: 35 tests OK (new: spec-review intermediate add/delete + inside-runs; mid-red intermediate add/delete outside tests + test-file-only control; changed_files/ux_paths direct).
srg: 11 suites (PASS=11, FAIL=0); CLI 12/12; node 301/301; parity ok.

Pre-fix, G19's add-then-remove src/tmp.py reported exit 0; now the scope rule names src/tmp.py.

## Closeout

FAIL: missing closeout manifest: /home/daniel-bo/Desktop/measure/measure/archive/dsh_measure_scope_intermediate_20261109/automation-supervisor-closeout-manifest.json
