# Implementation Plan: Research paper 1 publication

Track: `research_paper1_20261127`

**Work on main. Push to origin/main only. Light card: no spec, no gates.**

## Phase 1: Publish paper 1 v0.3 with data and table script

- [x] Task 1 Folder created: `research/paper1-agent-routing/` with `figures/`, `data/`, `scripts/` subfolders. Evidence: `ls research/paper1-agent-routing/`.
- [x] Task 2 Files copied: paper1.md, paper1.tex, refs.bib, figures (2 PNG), data CSVs (24), snapshot.json, number-map.csv, data README, paper1_tables.py, paper1_figures.py. Evidence: `diff -rq` against the advantage-pr sources shows only the intended path and scrub edits. No paper1.pdf: the committed PDF could not be rebuilt (no LaTeX/WeasyPrint toolchain in this environment) and the old PDF was deleted rather than committed.
- [x] Task 3 Scrub: no home paths, session ids, keys, tokens, Drive/Task ids, or extra names in any copied file. Evidence: trial-evidence.csv provenance uses `dir_01` (57 cells, numeric columns byte-identical); script DOMAIN map keeps 4 taxonomy names as rebuild input only; mapping at `/tmp/opencode/paper1-dir-map.txt` (outside the repo). Numbers, claims, and caveats unchanged.
- [x] Task 4 Tables rebuild: `paper1_tables.py` runs from the new folder with relative paths. Evidence: heavy-run rebuild against the frozen snapshot reproduces all 19 generated CSVs byte-identical (`diff -q` clean); 4 hand-maintained files (number-map, trial-evidence, trial-evidence-sonnet, route_match, leave_one_dir_out_focus) documented as inputs in the data README.
- [x] Task 5 README links: `research/README.md` one line per paper; main `README.md` links to it. Evidence: `research/README.md` and the `Research papers:` line in `README.md`.
- [x] Task 6 Scan: secret scan on `research/` is clean. Evidence: strict patterns for keys (`sk-…`, `xox…`, `gh…_…`, `AIza…`, `ya29…`), session ids (`ses_…`), Drive/Task URLs, and `/home/` paths all return no hit; remaining `token`/`sk-` hits are English words and route labels, verified by context.
- [x] Task 7 Push: commit and plain push to `origin/main`; remote head equals the commit. Evidence: commit a33de2b; ls-remote matches; files listed via gh api.
