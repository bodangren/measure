# Live evidence — heredoc/quote/comment-aware redirect scan

Date: 2026-11-08

Installed digest: sha256:1b7ec62570b898ed4 (bin/measure-dsh --check --live PASS).
Installed module: ~/.dsh/profiles/web/plugins/dsh-measure-guard/src/shell.js (run via node against the installed copy).

{"command":"cat > measure/tracks.md <<'EOF'\nThe guard denies > measure/plan.md writes.\nEOF\n","paths":["measure/tracks.md"]}
{"command":"echo \"a > measure/b.md\"","paths":[]}
{"command":"# > measure/c.md","paths":[]}
{"command":"cat > a.md <<'EOF'\nbody\nEOF\necho x > b.md","paths":["a.md","b.md"]}
{"command":"echo hi > out.txt; echo b >> out.txt","paths":["out.txt"]}
