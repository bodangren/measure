# Commit guard nested fix4 evidence

Date: 2026-11-09

Option-argument behavior: -o/-O, short cluster ending o/O (-euo), --rcfile, --init-file stepped over; -- after -c skipped, before -c stops the scan (matches bash probes).
Cases: bash -euo pipefail -c, bash --rcfile FILE -c (path); bash -c -- (path); bash -- -c and bash -o pipefail -- -c (no path).
Node 311/311; parity ok; CLI 13/13; srg 11/11.
Records: fix2 review with severity/scope + dispositions; fix1 F5 dated correction; fix2 off-by-one corrected; residual/CHANGELOG (node 311) updated.
