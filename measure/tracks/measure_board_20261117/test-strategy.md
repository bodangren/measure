# Test Strategy: Measure board

Track: `measure_board_20261117`. Spec: [spec.md](./spec.md). Plan: [plan.md](./plan.md).
Written at `role_base_sha` `8c2b555` (branch `chore/measure-board`). This revision covers Phase 1 (sections 1 to 11 and Appendix A) and Phases 2 and 3 (sections 12 to 14, added by Task 2.1 at `role_base_sha` `4219a4f`). Section 14 names the only valid `phase_base_sha` capture point. No section embeds it.

The rules at the top of `plan.md` stay binding. The spec passed review, so this strategy does not reopen a design decision. It adds gates, controls, risk, review applicability, and anti-pattern defenses.

## 1. Decisions for Phase 1

| Question | Decision | Reason |
| --- | --- | --- |
| Does Red apply? | **No.** | Phase 1 adds no production behavior and no test file. It adds three document edits, one data file, one static page, and screenshots. The first test file belongs to Task 2.2. |
| What takes the place of Red? | A control for every gate (section 4). | A gate that never failed proves nothing (A4). A control is a bad input that the gate must reject with exit code 1. |
| Risk class | **medium** | The phase changes no `src/` file and pushes nothing. But it turns private data into text of a public repository. A push makes a leak permanent. |
| Build role | `measure-jr-green` on Sonnet, Tasks 1.1 to 1.4. | PM decision of 2026-11-17. The role stops before Task 1.5. |
| Acceptance | The look gate of Task 1.5: the PM, then Daniel. | The gates below prove structure, privacy, and layout rules. Only a person judges the look. |

Targeted Red command of Phase 1: none. Phases 2 and 3 get their Red commands from Task 2.1. This revision does not set them.

## 2. Environment facts (measured at 8c2b555)

- `HEAD` equals `role_base_sha`. The track line of `measure/tracks.md` is `[~]`. No task of the plan is `[~]`. The build role marks a task `[~]` before it writes outside `measure/`.
- The guard of the strategy session said that no track is in progress, although the track line of this branch is `[~]`. The guard probably read the main checkout. Start the build role with the worktree as its project directory. Then check that the guard allows a write outside `measure/` after Task 1.2 is `[~]`.
- `extensions/measure-status/` is tracked. Its `node_modules/` and its `mockup/` folder do not exist. `tsconfig.json` includes only `src/**/*.ts` and `panel/**/*.ts`, so a file in `mockup/` does not change `tsc` or `vitest`.
- `.gitignore` line 213 ignores `measure/runs/`. Scripts, logs, theme tokens, look notes, and screenshots in `measure/runs/measure_board_20261117/` stay untracked. Phase 1 commits only the files of section 3.
- The private folder `/home/daniebo/.local/share/measure-board-private/` does not exist yet. No git work tree encloses `/home/daniebo/.local/share` (`git -C` prints "not a git repository").
- Playwright 1.61.0 runs with `npx --no-install playwright`. The Node library loads with `NODE_PATH="$(npm root -g)"` and `require('@playwright/test')`. The tools `file`, `jq`, `rg`, `node`, `bun`, and `python3` exist. `identify` does not exist.
- `measure/gates.json` holds the DSH commands. They do not test this track. The interphase script reads an environment variable before the file (`skills/measure-orchestrator/scripts/measure_interphase_checks.py:750-755`).
- Baselines at `8c2b555`: `bash tests/dsh/test-docs.sh` prints `[PASS] test-docs.sh`. `bash tests/spec_review_gate/run.sh` prints `14 suites (PASS=14, FAIL=0)`. The A11 recipe finds 3 candidates in `measure/tech-stack.md`.

## 3. Capture of `phase_base_sha` and commit scope

Capture `phase_base_sha` with `git rev-parse HEAD` directly after the commit of this file lands. Capture it before the build role edits `plan.md` or `tracks.md`. If the orchestrator first makes a commit that changes only `measure/` files, capture after that commit. Do not use `8c2b555`. This file holds no `phase_base_sha` value.

| Task | Files in the commit | Subject (from the plan) |
| --- | --- | --- |
| 1.1 | `measure/tech-stack.md` | `chore(measure): Declare the tooling of the Measure board track` |
| 1.2 | `extensions/measure-status/mockup/fixtures.json` | `chore(measure-status): Add invented fixture data for the board mockup` |
| 1.3 | `extensions/measure-status/mockup/board.html` | `feat(measure-status): Add the static mockup of the Measure board` |
| after `CHANGES` | the same two files | `fix(measure-status): Change the board mockup after the look` |

Tasks 1.4 and 1.5 commit nothing. Plan marker and checkpoint commits change `plan.md` and `tracks.md` only. Stage each file by name. Do not use `git add -A`, `git add .`, or `git commit -a`.

## 4. Gates

Run every command from the worktree root. Set these variables first.

```bash
PB=<phase_base_sha>
PRIV=/home/daniebo/.local/share/measure-board-private
RUN=measure/runs/measure_board_20261117
BOARD=extensions/measure-status/mockup/board.html
FIX=extensions/measure-status/mockup/fixtures.json
export NODE_PATH="$(npm root -g)" LC_ALL=C
```

The orchestrator extracts the check script of Appendix A once. The build role uses the same file and does not edit it.

```bash
mkdir -p $RUN/scripts && awk '/^```js check-mockup.cjs$/{f=1;next} /^```/{f=0} f' measure/tracks/measure_board_20261117/test-strategy.md > $RUN/scripts/check-mockup.cjs
```

`check-mockup.cjs` exits 0 when all checks pass, 1 when a check fails, and 2 on a script error. A control must exit with 1. An exit code of 2 is not a rejection. Every count below is a labeled integer. Keep the output of every gate in `$RUN/phase1-gates.log`. That log holds numbers and labels only, never a title or a task text.

### 4.1 The gates

| Gate | Task | What it proves | Falsified by (the control must fail) |
| --- | --- | --- | --- |
| G0 | all | Only the allowed paths changed. The three commits exist once. Nothing of the deliverables stays uncommitted. | A change to `src/`, `panel/`, or `package.json`; an empty diff; a duplicated subject. |
| G1 | 1.1 | Three rows exist in `tech-stack.md`. The A11 recipe finds no new candidate. The old suites still pass. | The same counter at `$PB` prints `0`. An unprefixed `panel/main.js` gives a new candidate. |
| G2 | 1.2 | The private folder exists and lies under no work tree. The capture counts add up. | A folder inside the worktree; a sum that differs from the entry count. |
| G3 | 1.2 | `fixtures.json` has the card shape of FR-5. It keeps the real shape and the real lengths. | A missing key, a wrong column, a done card with a position, a changed length. |
| G4 | 1.2, 1.3, each fix | No real text reached a committed file or a commit. | A real title pasted into a copy; the real file as input; a private-only word in a copy. |
| G5 | 1.3 | `board.html` is static, holds no remote resource, and holds no colour literal outside the theme sets. Its data equals `fixtures.json`. | A remote `<link>`, a `#ff0000` rule, a changed data block. |
| G6 | 1.3, 1.4 | The page never scrolls sideways at 390, 980, and 1280 px in both themes. The columns, the keys, and the targets follow FR-7, FR-8, and FR-11. | A 2000 px element, a constant debug line, a page that ignores `theme`, a wrong column order. |
| G7 | 1.3 | Hostile text from a file shows as text. It runs no script and adds no element. | A page that writes text with `innerHTML`. |
| G8 | 1.4 | The 18 images exist, show the right width, and are not blank. | An overflowing page gives an image wider than the request. |
| G9 | 1.4, 1.5 | The notes are complete. The build role did not pass the gate task. | A Task 1.5 marker `[x]` or `[b]`; a `look-gate.md` that the build role wrote. |

### 4.2 G0: scope and commits

```bash
git diff --name-only $PB..HEAD | grep -vxF -e measure/tech-stack.md -e $FIX -e $BOARD -e measure/tracks/measure_board_20261117/plan.md -e measure/tracks.md ; test $? -eq 1
test "$(git diff --name-only $PB..HEAD | wc -l)" -ge 3
for s in 'chore(measure): Declare the tooling of the Measure board track' 'chore(measure-status): Add invented fixture data for the board mockup' 'feat(measure-status): Add the static mockup of the Measure board'; do test "$(git log --format=%s $PB..HEAD | grep -cxF "$s")" -eq 1 || echo "subject missing or duplicated: $s"; done
test -z "$(git status --porcelain -- extensions measure/tech-stack.md)"
```

Expected: no output and every `test` exits 0. The second line stops a vacuous pass on an empty diff.

### 4.3 G1: tooling declaration (Task 1.1)

```bash
awk '/^#/ { s = ($0 ~ /Distribution Formats/) ? "distribution" : ($0 ~ /Tooling Exceptions/) ? "tooling" : ($0 ~ /^## Architecture/) ? "architecture" : "" } s=="distribution" && /extensions\/measure-status\// && /OpenChamber 2\.7\.1/ { d++ } s=="tooling" && /measure_board_20261117/ && /vitest run/ && /playwright screenshot/ { t++ } s=="architecture" && /extensions\/measure-status\// { a++ } END { printf "distribution=%d tooling=%d architecture=%d\n", d, t, a }' measure/tech-stack.md
git diff --numstat $PB..HEAD -- measure/tech-stack.md | awk '{ print "added=" $1 " deleted=" $2 }'
a11() { doc="$1"; grep -ao -- '`[^`]*`' "$doc" 2>/dev/null | tr -d '`' | grep -E '^[A-Za-z0-9_.-]+/([A-Za-z0-9_./-]+( [A-Za-z0-9_./-]+)?)?$' | sort -u | while IFS= read -r p; do first="${p%% *}"; if [ "$first" != "$p" ] && [ -f "$first" ] && [ -x "$first" ]; then continue; fi; case "$p" in ../*|*/../*|*/..) continue ;; esac; [ -e "$p" ] || echo "candidate: $p"; done; }
git show $PB:measure/tech-stack.md > /tmp/mb-tech-base.md
diff <(a11 /tmp/mb-tech-base.md) <(a11 measure/tech-stack.md) | grep '^>' ; test $? -eq 1
git diff -U0 $PB..HEAD -- measure/tech-stack.md | grep '^+[^+]' | sed -E 's/^\+//; s/`[^`]*`/CODE/g; s/[|]/ /g' | awk -F'[.!?] ' '{ for (i=1;i<=NF;i++) { n=split($i,w," "); if (n>m) m=n } } END { print "max_sentence_words=" m+0 }'
bash tests/dsh/test-docs.sh | tail -1
bash tests/spec_review_gate/run.sh | tail -1 | rg -o 'PASS=([0-9]+), FAIL=([0-9]+)' -r 'pass=$1 fail=$2'
```

Expected: `distribution=1 tooling=1 architecture=1`; `deleted=0`; no new candidate; `max_sentence_words` at most 25; `[PASS] test-docs.sh`. The last line of the suite run gives the totals: `fail=0` and `pass` at least 14.

- Control: run the first command on `git show $PB:measure/tech-stack.md`. It must print three zeros. Write `extensions/measure-status/panel/main.js` with the folder prefix, because `panel/main.js` alone is a new A11 candidate.
- The sentence counter is a proxy. The orchestrator also reads the added prose against ASD-STE100 (AGENTS.md, section 3).

### 4.4 G2: private folder and capture (Task 1.2)

`capture.ts` writes one line for each repo to `capture.log` in this exact form: `repo=<id> planned=<n> in-progress=<n> blocked=<n> waiting=<n> done=<n> entries=<n> added=<n>`.

```bash
for d in fixtures mockup-real preview-real shots-mockup shots-ui shots-live; do test -d $PRIV/$d || echo "missing $d"; done
git -C $PRIV rev-parse --is-inside-work-tree; test $? -ne 0
case "$(realpath $PRIV)/" in "$(git rev-parse --show-toplevel)/"*) echo INSIDE_WORKTREE ;; esac
awk '/^repo=/ { for (i=1;i<=NF;i++) { split($i,kv,"="); v[kv[1]]=kv[2] } s=v["planned"]+v["in-progress"]+v["blocked"]+v["waiting"]+v["done"]; if (s!=v["entries"]+v["added"]) bad++; n++ } END { printf "repos=%d sum_mismatch=%d\n", n, bad+0 }' $PRIV/fixtures/capture.log
for r in reading-advantage-monorepo Workbooks advantage-pr advantage-forge mastery-advantage ra-math-advantage lending-desk-bench measure; do want=$(rg -c '^- \[[ ~xb]\] ' ~/Desktop/$r/measure/tracks.md); got=$(awk -v r=$r '$1=="repo="r { for (i=1;i<=NF;i++) if ($i ~ /^entries=/) { sub("entries=","",$i); print $i } }' $PRIV/fixtures/capture.log); test "$want" = "$got" || echo "entries mismatch: $r"; done
```

Expected: no `missing`, no `INSIDE_WORKTREE`, `repos=8 sum_mismatch=0`, and no `entries mismatch`. The `entries` check uses `rg` as an independent count of the column-0 entry lines. A live repo can change between capture and check. After one mismatch, run `capture.ts` again once. Treat a second mismatch as a defect of the script.

- Control: `git -C <a folder inside the worktree> rev-parse --is-inside-work-tree` prints `true`. The first `test` then fails.

### 4.5 G3: fixture shape, shape of the real file, lengths (Task 1.2)

```bash
SHAPE='(.capturedAt|type=="number")
 and ([.repos[].repo]==["reading-advantage-monorepo","Workbooks","advantage-pr","advantage-forge","mastery-advantage","ra-math-advantage","lending-desk-bench","measure"])
 and ([.repos[] as $r | $r.cards[] | select(
   (keys!=["column","doneDate","doneSource","lastChange","line","marker","note","position","registered","repo","taskText","title"])
   or (.repo!=$r.repo)
   or ((.column|IN("planned","in-progress","blocked","waiting","done"))|not)
   or ((.title|type)!="string") or (.title=="")
   or ((.registered|type)!="boolean")
   or ((.marker|IN(" ","~","x","b",null))|not)
   or ((.marker==null)!=(.taskText==null)) or ((.marker==null)!=(.position==null))
   or ((.position!=null) and ((.position|keys)!=["phase","phases","task","tasks"] or (.position|[.[]]|any(type!="number" or .<1)) or (.position.task>.position.tasks) or (.position.phase>.position.phases)))
   or ((.lastChange|type) as $t|($t!="number" and $t!="null"))
   or ((.doneSource|IN("registry","folder",null))|not)
   or ((.doneDate==null)!=(.doneSource==null))
   or ((.doneDate!=null) and ((.doneDate|test("^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))|not))
   or (.column!="done" and (.doneDate!=null or .doneSource!=null))
   or (.column=="done" and (.position!=null or .note!=null or .line!=null or .lastChange!=null))
   or (.column!="done" and .position==null and ((.note|type)!="string"))
   or (.position!=null and .note!=null)
   or ((.column|IN("blocked","waiting")) and (((.line|type)!="string") or .line==""))
   or ((.column|IN("planned","in-progress")) and .line!=null)
 )]|length==0)'
jq -e "$SHAPE" $FIX >/dev/null; echo "fixture_shape_exit=$?"
jq -e "$SHAPE" $PRIV/fixtures/real.json >/dev/null; echo "real_shape_exit=$?"
jq -n --slurpfile r $PRIV/fixtures/real.json --slurpfile f $FIX '
 def lens: [.repos[].cards[] | (.title|length), (.taskText|if .==null then -1 else length end), (.line|if .==null then -1 else length end)];
 def kept: [.repos[].cards[] | del(.title, .taskText, .line)];
 ($r[0].capturedAt==$f[0].capturedAt) and (($r[0]|lens)==($f[0]|lens)) and (($r[0]|kept)==($f[0]|kept))'
```

Expected: both exits `0` and the last command prints `true`. The shape check also runs on `real.json`. A failure there shows a defect of `capture.ts` (for example a Blocked card with no line), before Phase 2.

- Controls: each of these changes must give exit 1 or `false`. Delete the `line` key of one card. Set one `column` to `"nope"`. Give a done card a `position`. Add one character to a title.

### 4.6 G4: privacy (Tasks 1.2 and 1.3, each fix, and before each commit)

The patterns come from `real.json`. They have at least 12 characters. They exclude the fixed line of FR-4. The first file holds all eight repos (acceptance criterion 8). The second holds `advantage-pr` only.

```bash
jq -r '.repos[].cards[] | .title, .taskText, .line | select(. != null)' $PRIV/fixtures/real.json | awk 'length($0) >= 12' | grep -vxF 'Registry marker [b].' | sort -u > $PRIV/fixtures/leak-patterns-all.txt
jq -r '.repos[] | select(.repo=="advantage-pr") | .cards[] | .title, .taskText, .line | select(. != null)' $PRIV/fixtures/real.json | awk 'length($0) >= 12' | grep -vxF 'Registry marker [b].' | sort -u > $PRIV/fixtures/leak-patterns-private.txt
echo "patterns_all=$(wc -l < $PRIV/fixtures/leak-patterns-all.txt) patterns_private=$(wc -l < $PRIV/fixtures/leak-patterns-private.txt)"
rg -F -i -f $PRIV/fixtures/leak-patterns-all.txt extensions/measure-status/mockup/ ; test $? -eq 1
git diff --cached | rg -F -i -f $PRIV/fixtures/leak-patterns-private.txt ; test $? -eq 1
git log -p --format= $PB..HEAD | rg -F -i -f $PRIV/fixtures/leak-patterns-private.txt ; test $? -eq 1
rg -F -i -f $PRIV/fixtures/leak-patterns-private.txt $RUN measure/tracks/measure_board_20261117 --glob '!*.png' ; test $? -eq 1
tok() { tr -cs 'A-Za-z0-9_' '\n' | tr 'A-Z' 'a-z' | awk 'length($0)>=6' | sort -u; }
jq -r '.repos[].cards[] | .title, .taskText, .line | select(. != null)' $PRIV/fixtures/real.json | tok > $PRIV/fixtures/real-tokens.txt
git ls-files -z -- . ':!extensions/measure-status/mockup' | xargs -0 cat | tok > $PRIV/fixtures/public-tokens.txt
comm -23 $PRIV/fixtures/real-tokens.txt $PRIV/fixtures/public-tokens.txt > $PRIV/fixtures/private-only-tokens.txt
echo "private_only_tokens=$(wc -l < $PRIV/fixtures/private-only-tokens.txt)"
jq -r '.repos[].cards[] | .title, .taskText, .line | select(. != null)' $FIX | tok | comm -12 - $PRIV/fixtures/private-only-tokens.txt | wc -l | sed 's/^/vocabulary_overlap=/'
bun $RUN/scripts/leak-check.ts ; echo "leak_check_exit=$?"
```

Expected: `patterns_all` at least 200 and `patterns_private` at least 20; every `test` exits 0; `vocabulary_overlap=0`; `leak_check_exit=0`. A `private_only_tokens` value of 0 means the public text covers every real word. Record that value. Then rely on the other checks.

Run the staged check (`git diff --cached`) before each commit of Phase 1. A private text in a commit stays in the pushed history after a later fix commit. Task 4.5 reads only `HEAD` and the merge base, so it cannot find it. If a check finds a hit, do not commit. If a commit holds a hit, stop and report to the orchestrator before any push.

`leak-check.ts` accepts `--fixture <file>` and `--private <dir>`. It prints one summary line `real_strings=<n> hits=<n>`. It exits 0 for `hits=0` and 1 for a hit or for a private folder under the worktree. It prints `private_inside_worktree=true` in the second case.

- Controls: (a) `rg -F -i -f $PRIV/fixtures/leak-patterns-all.txt $PRIV/fixtures/real.json` must exit 0, so the pattern file matches the real file. (b) `leak-check.ts --fixture $PRIV/fixtures/real.json` must print `hits` greater than 0 and exit 1. (c) A copy of `fixtures.json` with one real title in one card must give exit 1. (d) `leak-check.ts --private $PWD/$RUN/tmp-private` (create the folder, then remove it) must print `private_inside_worktree=true` and exit 1. (e) `printf 'zzqxjplorth\n' > /tmp/mb-fake.txt; echo 'a zzqxjplorth b' | tok | comm -12 - /tmp/mb-fake.txt | wc -l` must print 1.

### 4.7 G5: static page (Task 1.3)

```bash
node $RUN/scripts/check-mockup.cjs static $BOARD $FIX ; echo "g5_exit=$?"
node $RUN/scripts/check-mockup.cjs static $PRIV/mockup-real/board.html $PRIV/fixtures/real.json ; echo "g5_real_exit=$?"
```

Expected: both exits `0`, `static_failed_checks=0`, and nine lines that end in `=ok`. The second line proves that `make-real-mockup.ts` kept the data and escaped `<` as `<`.

The page must hold the theme sets between the comments `/* THEME-SETS-START */` and `/* THEME-SETS-END */`. Colour literals may exist only between them. The page must carry no `xmlns` attribute and no `url(`. Hex words such as `#add` in a selector are safe, because the check reads declarations only.

- Controls (each must exit 1):

```bash
sed 's|</head>|<link rel="stylesheet" href="https://example.test/x.css"></head>|' $BOARD > /tmp/mb-c5a.html
sed 's|</style>|.x{color:#ff0000}</style>|' $BOARD > /tmp/mb-c5b.html
sed 's|"capturedAt"|"capturedAtX"|' $BOARD > /tmp/mb-c5c.html
for c in a b c; do node $RUN/scripts/check-mockup.cjs static /tmp/mb-c5$c.html $FIX >/dev/null; echo "control_5$c=$?"; done
```

### 4.8 G6: layout, keys, themes, targets (Tasks 1.3 and 1.4)

```bash
mkdir -p $RUN/shots-mockup
node $RUN/scripts/check-mockup.cjs layout $BOARD | tee $RUN/shots-mockup/layout-invented.log ; echo "g6_exit=${PIPESTATUS[0]}"
node $RUN/scripts/check-mockup.cjs layout $PRIV/mockup-real/board.html | tee $PRIV/shots-mockup/layout-real.log ; echo "g6_real_exit=${PIPESTATUS[0]}"
test "$(rg -c '^case w=(390|980|1280) theme=(light|dark) done=(closed|open) .* ok=true$' $RUN/shots-mockup/layout-invented.log)" -eq 12
```

Expected: both exits `0`, `layout_failed_checks=0`, `theme_changes_computed_style=ok`, `debug_line_absent_without_key=ok`, and 12 lines `case ... ok=true`. For the invented board, `open_key_checked=true`. The real board can print `false` when every repo opens at first paint.

Each case loads the page at one width and theme, with `debug=1`, `open=<a closed repo>`, and `done=open` or none. The case checks these rules:

- `scrollWidth` is at most `innerWidth` before and after the script opens all eight sections. The debug line equals the measured values.
- No visible element has its right edge beyond the viewport, and no element is a sideways scroller (`overflow-x` `auto` or `scroll`).
- Every visible button is at least 40 px high.
- Below 640 px the columns stack in the order of FR-8. At 980 px at least three columns share a row. At 1280 px all five share a row. From 640 px a column is 219 to 321 px wide (a closed Done column is exempt).
- Done is closed at first paint and open with `done=open`. A column other than Done shows at most 8 cards. Done shows at most 5.
- Every `var(--oc-...)` name has a value. The computed colours differ between the light and the dark theme.

Use `clip-path` for visually hidden text. A `left:-9999px` rule counts as an overflow.

- Control (must exit 1): `sed 's|<body[^>]*>|&<div style="width:2000px;height:1px"></div>|' $BOARD > /tmp/mb-c6.html`, then `layout /tmp/mb-c6.html`. The output shows `fail=doc,edge`.

### 4.9 G7: hostile text (Task 1.3)

```bash
node $RUN/scripts/check-mockup.cjs hostile $BOARD ; echo "g7_exit=$?"
```

Expected: exit `0` and `hostile_failed_checks=0`. The script adds three hostile cards to the repo `measure`: `<img src=x onerror=...>`, `"><script>`, a `javascript:` line, a 300-character word, right-to-left text, and `</script><b id="pwn">`. It checks that no element or script appears, that no script runs, that the text shows literally, and that nothing scrolls sideways at 390 px.

- Control (must exit 1): in a temp copy, make the text writer unsafe. Replace `.textContent =` with `.innerHTML =`. If the page builds HTML strings, make its escape function return its input. Run `hostile` on the copy.

### 4.10 G8: screenshots (Task 1.4)

Run the commands of Task 1.4 as written. Use the `open` key in the `-done` set: add `&open=advantage-forge`. Then the PM sees the cap of eight and the `Show N more` button in the largest column.

```bash
n=0; for w in 390 980 1280; do for t in light dark; do
  for f in $PRIV/shots-mockup/real-$w-$t.png $PRIV/shots-mockup/real-$w-$t-done.png $RUN/shots-mockup/invented-$w-$t.png; do
    test -f $f || { echo "missing $f"; continue; }
    n=$((n+1))
    px=$(file -b $f | awk -F'[ ,]+' '{ for (i=1;i<=NF;i++) if ($i ~ /^[0-9]+$/ && $(i+1)=="x") { print $i; exit } }')
    test "$px" -eq $w || echo "width_mismatch file=$f width=$px want=$w"
    test "$(stat -c %s $f)" -ge 30000 || echo "too_small file=$f"
  done
  cmp -s $PRIV/shots-mockup/real-$w-light.png $PRIV/shots-mockup/real-$w-dark.png && echo "same_image w=$w"
  cmp -s $RUN/shots-mockup/invented-$w-light.png $RUN/shots-mockup/invented-$w-dark.png && echo "same_image_invented w=$w"
done; done; echo "images_checked=$n"
test -s $RUN/shots-mockup/shots.log
```

Expected: no other output, `images_checked=18`, and a non-empty `shots.log`. The check script, not the screenshot, proves the overflow rule. The image width is a second proof, because a full-page image of an overflowing page is wider than the request. The dry run gave an image of 2000 px for a request of 390 px.

### 4.11 G9: notes and gate hand-off (Tasks 1.4 and 1.5)

```bash
test -s $RUN/look-notes.md
rg -c '^Theme values: (measured|sample values)$' $RUN/look-notes.md
rg -c 'Done column' $RUN/look-notes.md; rg -c 'header counts' $RUN/look-notes.md; rg -c 'private folder' $RUN/look-notes.md
for f in $(ls $PRIV/shots-mockup/*.png $RUN/shots-mockup/*.png); do rg -qF "$(basename $f)" $RUN/look-notes.md || echo "not listed: $(basename $f)"; done
test -s $RUN/theme-tokens.json && jq -e '(.light|type=="object") and (.dark|type=="object")' $RUN/theme-tokens.json
awk '/^- \[.\] Task 1\.5: GATE/ { print "task15_marker=[" substr($0,4,1) "]" }' measure/tracks/measure_board_20261117/plan.md
rg -n '^- \[[~xb]\] Task 2\.' measure/tracks/measure_board_20261117/plan.md ; test $? -eq 1
awk '/^PM [0-9-]+: /{n++} END { print "look_gate_lines=" n+0 }' $RUN/look-gate.md
```

Expected results:

- The count of `Theme values:` lines is exactly 1.
- The three other counts are at least 1.
- No line says `not listed`.
- `theme-tokens.json` is valid when the line says `Theme values: measured`.
- The output shows `task15_marker=[ ]` or `task15_marker=[~]`.
- No Phase 2 task started. `look-gate.md` holds the PM lines (C1-C4, then D2 ACCEPT with the D1 comment-button CHANGE) and the Daniel line (layout ACCEPT with D1-D2). The pre-verdict rule `test ! -e $RUN/look-gate.md` applied only before the first verdict. It no longer applies.

After the verdicts, the orchestrator reads `look-gate.md` itself:

```bash
awk '/^PM [0-9-]+: /{pm=$0; pn=NR} /^Daniel [0-9-]+: /{d=$0; dn=NR} END { print ((pm ~ /: ACCEPT$/ && d ~ /: ACCEPT$/ && pn < dn) ? "look_gate=accepted" : "look_gate=open") }' $RUN/look-gate.md
```

Only `look_gate=accepted` lets the orchestrator mark Task 1.5 `[x]`. After a `CHANGES` verdict, run G0 and G4 to G8 again on the new HEAD. The last full pass replaces the earlier one.

The interphase script cannot read this gate. It skips every task line that holds the word `deferred` (`measure_interphase_checks.py:387`, `:398`, `:413`). The text of Task 1.5 holds that word. The script therefore counts Task 1.5 as closed while it is open. Read the marker of Task 1.5 yourself.

## 5. Gate levels

- **Green gate of Phase 1** (after Task 1.4): G0 to G9 all pass, and the PM bundle is complete. Do not run `role-gate --role jr-green` for Phase 1. It reads Task 1.5 as closed, it fails on the open verification task, and its `GREEN_TEST_COMMAND` is the DSH command of `measure/gates.json`.
- **Closeout gate of Phase 1** (after the two verdicts): `look_gate=accepted`, then G0 and the history part of G4 on the final HEAD. The orchestrator then marks Task 1.5 `[x]`. The verification task of the phase follows.
- **Intentionally red suites:** none. Phase 1 adds no test file and leaves no red test. No test is skipped or deleted. `tsc` and `vitest` do not run in Phase 1, because `node_modules` does not exist. The baseline of Phase 2 belongs to Task 2.2.

## 6. Fixtures, mocks, and live proof

- **Committed fixtures:** `fixtures.json` holds invented titles, task texts, and lines of the same lengths. The markers, positions, notes, columns, dates, and counts of the real capture stay. The page embeds it in `<script type="application/json" id="fixture">` with `<` written as `<`.
- **Private copy:** `real.json` and the real-data mockup stay under `$PRIV`. `make-real-mockup.ts` swaps the data block with the same escape. G5 and G6 run on that copy.
- **No mock:** Phase 1 uses no host, no SDK stub, and no network. Playwright loads `file://` pages in real Chromium.
- **DOM contract of the page.** The check script reads these hooks. FR-13 names the `data-action` values.
  - Each repo is a `section[data-repo]` that holds a button `data-action="toggle-section"` with `aria-expanded`.
  - Each column is a non-button element `[data-column]` with the value `planned`, `in-progress`, `blocked`, `waiting`, or `done`.
  - Each card carries the attribute `data-card`.
  - The Done column holds a button `data-action="toggle-done"` with `aria-expanded`.
  - A column with hidden cards holds a button `data-action="show-more"`. The page header holds a button `data-action="refresh"`.
  - The element `<div id="debug">` holds `scrollWidth=<n> innerWidth=<n>` when the key `debug=1` is set. It stays empty without the key.
- **Live proof:** a real Chromium measures the layout in G6 to G8. The OpenChamber host takes no part in Phase 1. The `--oc-*` values come from a live extension frame when one is open. Otherwise `look-notes.md` says `Theme values: sample values`. The live proof in the host belongs to Task 4.2.

## 7. Control evidence of the strategy role

The strategy role ran the commands of section 4 on synthetic pages and fixtures in `/tmp/mb-dry`. It did not run them on the real deliverables, because none exists at `8c2b555`. The synthetic board has the DOM contract of section 6.

| Run | Result |
| --- | --- |
| `static`, `layout`, and `hostile` on the good page | exit 0; 12 cases `ok=true` |
| `static` on a page with a remote `<link>` | exit 1, `no_remote_resource=FAIL` |
| `static` on a page with `#ff0000` outside the theme sets | exit 1, `no_colour_literal_outside_theme_sets=FAIL` |
| `layout` on a page with a 2000 px element | exit 1, `fail=doc,edge`, 12 failed cases |
| `layout` on a page with a constant debug line | exit 1, `fail=debug` |
| `layout` on a page that ignores `theme` | exit 1, `theme_changes_computed_style=FAIL` |
| `layout` on a page with `flex-wrap:nowrap` | exit 1, 4 failed cases |
| `layout` on a page with a wrong column order | exit 1, 4 failed cases |
| `hostile` on a page that uses `innerHTML` | exit 1, 3 checks failed |
| `jq` shape check with a missing key or a wrong column | exit 1 |
| Full-page image of the overflowing page | 2000 px wide for a 390 px request |
| `cmp` of the light and the dark image | exit 1 (the images differ) |
| Vocabulary control word `zzqxjplorth` | overlap 1 |
| A11 recipe on an unprefixed `panel/main.js` | one candidate |
| `awk` extraction of Appendix A | the script text only |

## 8. Risk and review applicability

| Role or review | Phase 1 | Reason |
| --- | --- | --- |
| Red (`measure-mid-red`) | Not applicable | No test file and no behavior. The first Red is Task 2.2. |
| Build (`measure-jr-green`) | Applies, Tasks 1.1 to 1.4 | It stops before Task 1.5 and writes no verdict. |
| Review A, correctness | Not applicable | No behavior. G1, G3, and G5 to G7 check the structure and the FR rules. The reviews of Phase 2 read the model. |
| Review B, security | Not applicable as a role. Conditional. | G2 to G5 check privacy and remote resources with tools. Run a read-only `measure-review-b-security` on the HEAD if any privacy gate finds a hit, even once. Run it before the next commit. |
| Review C, UX and API | Not applicable | The look gate is the UX acceptance. The shape check G3 covers the card contract. Phase 1 has no code API. |
| Adversarial testing | Not applicable as a role | G7 and the controls of G4 replace it. Tasks 2.6 and 3.4 are the adversarial roles. |
| UX browser review | Not applicable as a role | G6, G8, and the look gate replace it. The role runs in Task 3.5 on the real UI. |
| Phase acceptance | Not applicable | The plan has no acceptance task in Phase 1. Task 1.5 is the acceptance. |

## 9. Anti-pattern coverage (A1 to A11)

| Id | Status | Defense in Phase 1 |
| --- | --- | --- |
| A1 | Retired | None. |
| A2 | Applies by analogy | The commit of `fixtures.json` publishes data derived from private files. No commit starts before `leak_check_exit=0`, `vocabulary_overlap=0`, and the pattern gates of G4. The leak log is the anonymization record. |
| A3 | Applies | Every count is a labeled integer: `repos=8`, `images_checked=18`, `scrollWidth=<n> innerWidth=<n>`, `pass=<n> fail=<n>`. The PNG width comes from the `<w> x <h>` field of `file`. No gate uses `rg -q '[0-9]+'`. |
| A4 | Applies, main defense | Each gate has a control. G0 needs at least 3 changed paths. G4 needs non-empty pattern files. G6 needs exactly 12 passing cases. G5 fails when the data block does not parse. `open_key_checked=true` marks a real test of the key. A control must exit 1, not 2. |
| A5 | Applies | No plan line, note, or `look-notes.md` says "all checks pass" unless `phase1-gates.log` shows every gate with exit 0. The task evidence of 1.1 to 1.4 cites gate lines. |
| A6 | Closeout only | The registry note at closeout must say "mockup accepted" only after `look_gate=accepted`. It must not say "resolved". |
| A7 | Applies | The data block leaves the remote scan by its exact tag, not by words. The fixed line leaves the patterns with `grep -vxF` on the whole line. Section 4 uses no bare English word as a filter. |
| A8 | Retired | None. |
| A9 | Later | The gates read `measure/tracks/measure_board_20261117/`. Task 4.6 moves it to `measure/archive/`. Any later rerun resolves the archive path first. |
| A10 | Not applicable | The repository has no `measure/doctor.sh` and no `measure/generated/`. |
| A11 | Applies to Task 1.1 | The recipe runs before and after. The new rows name `extensions/measure-status/` and `extensions/measure-status/panel/main.js`, and both exist. See the interim drift below. |

## 10. Artifact tests and live behavior tests

- **Artifact tests:** G0, G1 (the three rows), G2 (folders), and G9 (notes). They prove that text and files exist. They do not prove behavior.
- **Data tests:** G3 and G4. They prove the shape and the privacy of the data. They run on files and on git history.
- **Live behavior tests:** G5 (static rules on the page), G6, G7, and G8. G6 to G8 run the page in a real Chromium at three widths and two themes. None of them involves OpenChamber.

## 11. Changed-contract risks and notes for Task 2.1

- **Interim doc drift (A11):** the new row of `tech-stack.md` states "OpenChamber 2.7.1 and newer". `package.json` still says `>=1.24.0` until Task 2.3 (FR-1.5). The phase acceptance of Phase 2 must check that the field equals `>=2.7.1`.
- **DOM contract:** the hooks of section 6 pass to the real page. Task 3.5 runs `check-mockup.cjs layout` on `preview/preview.html`. The Red tests of Task 3.1 should assert the same hooks. A hook change breaks the script.
- **Colour rule:** after Task 3.2 the rules outside the theme sets live in `src/styles.ts`. The theme sets stay in the page, because the host sets `--oc-*`.
- **Gate commands:** `measure/gates.json` holds DSH commands. Task 2.1 must set `RED_TEST_COMMAND` and `GREEN_TEST_COMMAND` for Phases 2 and 3 as environment variables. The variable wins over the file.
- **Task 1.5 text:** the word `deferred` in the plan line hides the open gate from the interphase script. Before Phase 2 Red starts, the orchestrator checks `look_gate=accepted` and the marker of Task 1.5 itself.
- **History leak:** Task 4.5 reads `HEAD` and the merge base only. A private text that enters a commit stays in the pushed history. G4 guards every commit of Phase 1. Task 2.1 must keep the same rule for the fixtures of the Red tests (plan Tasks 2.2 and 2.6).
- **Addition to Task 1.4:** the plan names no `open` key in the commands of Task 1.4. G8 adds `&open=advantage-forge` to the `-done` set. This adds no file and no task. The orchestrator may refuse it.

## 12. Phase 2: Data model (P2)

Risk class: **medium**. The phase adds the file-reading model and the comment text. It adds no UI and no send. A wrong column rule misleads Daniel. A leaked real title in a committed fixture stays in history.

### 12.1 Red scope

Targeted Red command of Phase 2: `cd extensions/measure-status && bunx vitest run`. Every Red task runs it. Every Red log keeps the failing output.

- Task 2.2 pins FR-1 to FR-4, FR-6, FR-8, and FR-10. It pins each row of the R1 to R4 table. It pins the C1 age rule: R3a applies only when the Updated age is 14 days or less. It pins the labels `MANUAL CHECK`, `GATE`, and `BLOCKER`. It pins the C2 stale group: Planned and In progress cards older than 30 days sit in a closed `Stale (N)` group. It pins the skipped-task shape, the gate-token set, and the two real-plan shapes of the Test section. It pins `formatAge` bounds, `latestChange` with missing and failed `stat`, and the loader call budget.
- Task 2.3a pins FR-16, D2 and `formatComment`. It pins the closed date (last change, not a commit). It pins the 14-day window and the 5-card group. It pins the count line `N more done, M archived`. It pins the label `Not archived` and the header count. It pins the two `stat` calls of a Done track with no read call. It pins the message layout, the dropped empty line, white-space-only refusal, 2000 accepted, 2001 refused, and plain-text card values.

### 12.2 Green gate

- `cd extensions/measure-status && bunx tsc -p . --noEmit && bunx vitest run` exits 0.
- The real-run script prints `ok` for all eight repos. Counts add up. The log prints no title and no task text.
- Every Red log names the missing module. No Red log is skipped.

### 12.3 Closeout gate

- Phase acceptance (Task 2.7) runs at an immutable HEAD. It reruns the test command and the real-run script. It checks FR-1 to FR-4, FR-6, FR-8, FR-10, and FR-16, D2. It records the audited HEAD in the plan.
- Task 1.6 (the D1 look) blocks Phase 3. It never blocks Phase 2.

### 12.4 Fixtures, mocks, live proof

- Red tests use invented fixtures only. They copy the shapes of the Test section. They never paste a real title.
- The loader tests use a fake `BoardHost` with a call counter. The fake returns fixed texts and fixed `stat` values. It returns each error code of FR-10.
- The live proof is `real-run.ts` on the real repos. It prints counts and call budgets only. It prints no title.

### 12.5 Guardrails and changed contracts

- NFR-2 holds: `roster`, `registry`, `parse`, `board`, `age`, and `load` have no SDK import and no DOM access. Tests run in Node.
- NFR-3 holds: `source.test.ts` fails on `writeFile` in `src/` or `panel/main.ts`. It fails on `listDir` outside `src/load.ts` and `src/measure.ts`.
- Task 2.3 changes no band file and no panel file. `MeasureHost` keeps `listDir`.
- Exact C1 and C2 signatures (spec FR-15 sets this task as the source):
  - `TrackInput` gains `now: number`. `classifyTrack` keeps its shape.
  - `ColumnView` gains `stale: readonly Card[]` and `staleOpen: boolean`.
  - `columnView` gains `staleOpen: boolean` after `expanded`. Done ignores it.
  - `UiState` gains `staleOpen: Readonly<Record<string, boolean>>` with key `<repo>/<column>`.
- `DONE_WINDOW_DAYS` equals 14. `doneSummary` returns the group, `more`, `archived`, and `notArchived`.

### 12.6 Intentionally red suites

Phase 2 leaves no red suite at Green. Each Red commit fails by design. Each Green commit turns it green. No test is skipped or deleted. The aggregate `vitest run` must exit 0 at Green and at acceptance.

### 12.7 Artifact tests and live behavior tests

- Artifact tests: `roster.test.ts` (globs), `source.test.ts` (no `writeFile`). They prove text in files.
- Live behavior tests in Node: `registry`, `board`, `age`, `load`, and `comment` tests. They run the pure rules. They use no host.
- Live proof on real files: `real-run.ts`. Only it touches the eight repos.

### 12.8 Reviews

| Role | Phase 2 | Reason |
| --- | --- | --- |
| Review A, correctness | Applies (Task 2.5) | It checks the column rules against FR-4 with C1 and D2. |
| Review B, security | Applies (Task 2.5) | It checks the link path escape, the eight `filesystem` globs, the `listDir` scope, and the escape of file text. |
| Review C, UX and API | Applies (Task 2.5) | It checks the card and view shapes for the renderer. |
| Adversarial testing | Applies (Task 2.6) | Hostile registry text, hostile plans, error codes, 2,000-entry lists, HTML folder names. |
| UX browser review | Not applicable | No page exists in Phase 2. Task 3.5 runs it. |

### 12.9 Anti-pattern coverage

| Id | Defense in Phase 2 |
| --- | --- |
| A2 | No Red test publishes. `real-run.log` holds counts only. A title in a log fails the review. |
| A3 | Every count is a labeled integer: `repos=8 sum_mismatch=0`, column counts, `Stale (N)`, `Show N more`. No test uses a bare digit match. |
| A4 | Each rule row has a positive and a negative case. The `All tasks closed` case must print its note, not pass on nothing. Controls: a fixture with the wrong column fails; a stale card at 30 days stays visible. |
| A5 | No plan line says checks pass unless `vitest run` exits 0 on the logged HEAD. |
| A6 | No registry note says a rule is done before acceptance. |
| A7 | The escape test uses exact hostile strings (`<img>`, `"><script>`), not bare English words. |
| A9 | Tests read invented folders only. No test names an archived path. |
| A10 | Not applicable. No `measure/doctor.sh` exists. |
| A11 | Phase 2 acceptance checks `engines.openchamber` equals `>=2.7.1`. This closes the interim drift of section 11. |
| A1, A8 | Retired. None. |

Every test in Phase 2 has a falsification condition: change the pinned value and the test fails.

## 13. Phase 3: Board UI and band (P3)

Risk class: **high**. The phase ships the send path. It is the only write. A wrong session id sends to the wrong session. An unescaped title runs a script. The phase also owns the approval-facing README sentence.

### 13.1 Red scope

Targeted Red command of Phase 3: `cd extensions/measure-status && bunx vitest run`. Every Red task runs it.

- Task 3.1 pins FR-5, FR-7, FR-8, FR-11, FR-12, and FR-16, D2. It pins header counts, the Blocked badge, the not-archived header count, and hostile-title escape. It pins the closed Done group, the count line, `aria-expanded`, and `Show N more`. It pins no colour literal and no remote URL in `src/styles.ts` and `src/render.ts`. It pins the extended `source.test.ts`: no `writeFile`, `listDir` only in `src/load.ts` and `src/measure.ts`, and no `fetch(` in `panel/main.ts`.
- Task 3.2a pins FR-16, D1. It uses a fake host and never calls OpenChamber. It pins one closed card with one `Comment` button. It pins one open box at a time. It pins Escape and finished Send closing the box. It pins the state line `sent HH:MM` that stays visible while the box is closed. It pins the error text of a failure. It pins plain-text messages, empty-text refusal, 2001 refusal, one send per click, and the disabled Send button while a send runs.

### 13.2 Green gate

- `cd extensions/measure-status && bunx tsc -p . --noEmit && bunx vitest run` exits 0.
- The esbuild panel command exits 0. The esbuild preview command exits 0. `git diff --exit-code extensions/measure-status/panel/main.js` exits 0, so the committed bundle equals the build.
- The preview page renders the real board code from invented fixtures with `now` set to the capture time.
- The band keeps one line. The rail badge equals the Blocked tracks of all repos. Waiting on Daniel never counts.

### 13.3 Closeout gate

- Phase acceptance (Task 3.6) runs at an immutable HEAD. It reruns the test command and the bundle-equality check. It checks FR-5 to FR-12 and FR-16. It records the audited HEAD in the plan.
- Phase 3 starts only after Task 1.6 is `[x]`: the PM and Daniel accept the D1 look.

### 13.4 Fixtures, mocks, live proof

- Render and send tests use invented fixtures only. Hostile titles include `<img src=x onerror=alert(1)>`, `"><script>`, `javascript:` text, long words, right-to-left text, and 5,000 cards.
- The send test uses a fake host. It asserts one call per click. It asserts the disabled state during the send. It never reaches the network.
- The live proof is the UX browser review (Task 3.5): invented-data and real-data previews at 390, 980, and 1280 px in both themes. Real-data images stay in the private folder. The `debug` line must show `scrollWidth` at most `innerWidth`. The review checks 40 px targets, the focus ring, cut text, and column widths against the accepted mockup.

### 13.5 Guardrails and changed contracts

- FR-12 holds: colours come from `--oc-*` only. The CSS is one string in `src/styles.ts`. No remote resource, no `fetch(`, no `XMLHttpRequest`, no `WebSocket`, no `@import`.
- Every file text passes through `escapeHtml` before it reaches HTML. Review B checks each `innerHTML` use.
- The service holds the only send. `PM_SESSION_ID` lives in `src/pm-target.ts` only. No other module holds it. The panel calls `serviceRequest`. The service calls `sessions.send` with the constant id. One click sends one message. No retry loop.
- `service/main.js` is built with `bunx openchamber-guest-bundle --node service/main.ts service/main.js`. It is committed.
- Changed-contract risks: the new `data-action` values (`toggle-stale`, `toggle-done-group`, `open-comment`, `send-comment`), the `CommentUi` state, and the preview `preview.js` ignored file. Task 3.1 tests assert the same DOM hooks as section 6.

### 13.6 Intentionally red suites

Phase 3 leaves no red suite at Green. Each Red commit fails by design. Each Green commit turns it green. No test is skipped or deleted. The aggregate `vitest run` must exit 0 at Green, at acceptance, and at the browser review.

### 13.7 Artifact tests and live behavior tests

- Artifact tests: the colour-literal scan, the remote-URL scan, and the committed-bundle equality. They prove text and files.
- Live behavior tests in Node: `render.test.ts` and `send.test.ts` with the fake host. They run the render and send logic.
- Live behavior in Chromium: Task 3.5 screenshots and the `debug` line. Only they prove layout and width rules.

### 13.8 Reviews

| Role | Phase 3 | Reason |
| --- | --- | --- |
| Review A, correctness | Applies (Task 3.3) | It checks the render against FR-5, FR-7, FR-8, and D2. |
| Review B, security | Applies (Task 3.3) | It checks the escape of file text, each `innerHTML` use, the session id constant, plain-text messages, one send per click, and error text. It reads `service/main.ts`. |
| Review C, UX and API | Applies (Task 3.3) | It checks the card contract, the `UiState` shape, and the preview API. |
| Adversarial testing | Applies (Task 3.4) | Hostile renderer text, 5,000 cards, Refresh and timer races. |
| UX browser review | Applies (Task 3.5) | It opens both previews at 390, 980, and 1280 px in both themes. It compares them with the accepted mockup. |

### 13.9 Anti-pattern coverage

| Id | Defense in Phase 3 |
| --- | --- |
| A2 | The send path needs a user click with non-empty text. No test or preview sends a real message. |
| A3 | Badge and header counts are labeled integers. The `sent HH:MM` state carries a time label. |
| A4 | The escape test fails on an `innerHTML` copy (the G7 control). The send test fails when the fake host records two calls for one click. |
| A5 | No plan line says the UI passes unless `vitest run` and the bundle check exit 0 on the logged HEAD. |
| A6 | No registry note says the send works before Task 3.5 and acceptance. |
| A7 | The colour and remote scans match exact tokens (`#`, `rgb(`, `http`), not bare words. |
| A9 | Tests read invented fixtures only. No test names an archived path. |
| A10 | Not applicable. No `measure/doctor.sh` exists. |
| A11 | Phase 3 acceptance checks the README sections against the code (FR-14). |
| A1, A8 | Retired. None. |

Every test in Phase 3 has a falsification condition: change the pinned value and the test fails.

## 14. `phase_base_sha` capture point

The orchestrator captures the immutable `phase_base_sha` after the commit of this strategy file lands. The command is `git rev-parse HEAD`. It runs after the commit and before any Red work of Task 2.2. It never reuses `8c2b555` or `4219a4f`. Those values predate the committed strategy. The Red, Green, and acceptance roles read the captured value from the plan or the run log, never from this file.

## Appendix A: `check-mockup.cjs`

Run: `NODE_PATH="$(npm root -g)" node check-mockup.cjs <static|layout|hostile> <board.html> [fixture.json]`.

```js check-mockup.cjs
// check-mockup.cjs: the Phase 1 gates of the track measure_board_20261117. Throwaway: it commits nothing.
// Run: NODE_PATH="$(npm root -g)" node check-mockup.cjs <static|layout|hostile> <board.html> [fixture.json]
// It prints one labeled line for each check. Exit 0: all checks ok. Exit 1: a check failed. Exit 2: script error.
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

const [mode, file, fixtureFile] = process.argv.slice(2)
const html = fs.readFileSync(file, 'utf8')
const BLOCK = /<script type="application\/json" id="fixture">([\s\S]*?)<\/script>/
const ORDER = ['planned', 'in-progress', 'blocked', 'waiting', 'done']
const WIDTHS = [390, 980, 1280]
let bad = 0
const check = (name, ok, detail = '') => {
  if (!ok) bad += 1
  console.log(`${name}=${ok ? 'ok' : 'FAIL'}${!ok && detail ? ' ' + detail : ''}`)
}
const swap = (data) => html.replace(BLOCK, () => `<script type="application/json" id="fixture">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`)

const staticMode = () => {
  const m = BLOCK.exec(html)
  let data = null
  try { data = JSON.parse(m[1]) } catch { data = null }
  check('fixture_block_json', data !== null)
  check('fixture_block_no_raw_lt', m !== null && !m[1].includes('<'))
  if (fixtureFile) {
    const want = JSON.stringify(JSON.parse(fs.readFileSync(fixtureFile, 'utf8')))
    check('fixture_block_equals_file', data !== null && JSON.stringify(data) === want)
  }
  const rest = html.replace(BLOCK, '')
  const remote = rest.match(/https?:|(?:^|[^:])\/\/[a-z0-9-]+\.[a-z]{2,}|@import|url\(|<(?:link|img|iframe|object|embed|audio|video|source|base|form)\b|<script[^>]*\ssrc=|\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts)\b|\bimport\s*\(/i)
  check('no_remote_resource', remote === null, remote ? JSON.stringify(remote[0]) : '')
  const START = '/* THEME-SETS-START */'
  const END = '/* THEME-SETS-END */'
  const s = rest.indexOf(START)
  const e = rest.indexOf(END)
  check('theme_sets_markers', s >= 0 && e > s && rest.indexOf(START, s + 1) < 0 && rest.indexOf(END, e + 1) < 0)
  const code = s >= 0 && e > s ? rest.slice(0, s) + rest.slice(e + END.length) : rest
  const styles = [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((x) => x[1]).join('\n')
  const inline = [...code.matchAll(/\sstyle="([^"]*)"/g)].map((x) => x[1] + ';').join('\n')
  const NAMES = 'white|black|red|green|blue|gray|grey|orange|yellow|purple|pink|brown|silver|gold|navy|teal|maroon|olive|lime|aqua|cyan|magenta|crimson|tomato|coral|salmon|khaki|indigo|violet|beige|ivory|lavender|plum|orchid|tan|azure|turquoise'
  const COLOUR = new RegExp(`(?:#[0-9a-f]{3,8}\\b|\\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\\(|(?<=[:\\s])(?:${NAMES})\\b)(?=[^{}]*[;}])`, 'i')
  const colour = (styles + '\n' + inline).match(COLOUR)
  check('no_colour_literal_outside_theme_sets', colour === null, colour ? JSON.stringify(colour[0]) : '')
  const js = [...code.matchAll(/<script(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g)].map((x) => x[1]).join('\n')
  const jsColour = js.match(/['"`](?:#[0-9a-f]{3,8}|(?:rgba?|hsla?)\()|\.style\.(?:color|background\w*|border\w*|outline\w*)\s*=/i)
  check('no_colour_literal_in_script', jsColour === null, jsColour ? JSON.stringify(jsColour[0]) : '')
  check('uses_oc_variables', /var\(--oc-/.test(styles))
  check('focus_ring_uses_oc_focus', /:focus-visible[^{]*\{[^}]*--oc-focus/.test(styles))
}

const probe = () => {
  const vis = (e) => e.getClientRects().length > 0
  const vw = window.innerWidth
  const all = [...document.body.querySelectorAll('*')].filter((e) => vis(e) && e.tagName !== 'SCRIPT' && e.tagName !== 'STYLE')
  const edge = all.filter((e) => { const r = e.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1 }).length
  const scrollers = all.filter((e) => /auto|scroll/.test(getComputedStyle(e).overflowX) && e.scrollWidth > e.clientWidth + 1).length
  const targets = [...document.querySelectorAll('button')].filter(vis).filter((b) => b.getBoundingClientRect().height < 39.5).length
  const rows = []
  for (const s of document.querySelectorAll('section[data-repo]')) {
    const t = s.querySelector('[data-action="toggle-section"]')
    if (!t || t.getAttribute('aria-expanded') !== 'true') continue
    const cols = [...s.querySelectorAll('[data-column]:not(button)')].filter(vis)
    const tops = cols.map((c) => c.getBoundingClientRect().top)
    rows.push({
      order: cols.map((c) => c.dataset.column).join(','),
      maxRow: Math.max(0, ...tops.map((x) => tops.filter((y) => Math.abs(x - y) <= 2).length)),
      sameLeft: new Set(cols.map((c) => Math.round(c.getBoundingClientRect().left))).size <= 1,
      widths: cols.filter((c) => c.dataset.column !== 'done' || c.querySelector('[data-card]')).map((c) => c.getBoundingClientRect().width),
      cards: Object.fromEntries(cols.map((c) => [c.dataset.column, c.querySelectorAll('[data-card]').length])),
    })
  }
  return { vw, sw: document.documentElement.scrollWidth, edge, scrollers, targets, rows }
}
const openAll = (page) => page.$$eval('[data-action="toggle-section"][aria-expanded="false"]', (bs) => bs.forEach((b) => b.click()))
const goto = async (browser, target, w, query) => {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } })
  await page.goto(`${pathToFileURL(path.resolve(target)).href}?${query}`)
  return page
}

const layoutMode = async (browser) => {
  const p0 = await goto(browser, file, 1280, 'theme=light')
  const closed = await p0.$$eval('section[data-repo]', (ss) => ss.filter((s) => s.querySelector('[data-action="toggle-section"]').getAttribute('aria-expanded') === 'false').map((s) => s.dataset.repo))
  const noDebug = await p0.evaluate(() => (document.getElementById('debug') || { textContent: '' }).textContent.trim())
  check('debug_line_absent_without_key', noDebug === '', JSON.stringify(noDebug))
  const target = closed[0] || 'measure'
  console.log(`open_key_checked=${closed.length > 0}`)
  const sig = {}
  let failedCases = 0
  for (const w of WIDTHS) for (const theme of ['light', 'dark']) for (const done of [false, true]) {
    const page = await goto(browser, file, w, `theme=${theme}&debug=1&open=${target}${done ? '&done=open' : ''}`)
    const first = await page.evaluate(() => ({
      iw: window.innerWidth,
      sw: document.documentElement.scrollWidth,
      dbg: (document.getElementById('debug') || { textContent: '' }).textContent,
      done: [...document.querySelectorAll('[data-action="toggle-done"]')].filter((b) => b.getClientRects().length).map((b) => b.getAttribute('aria-expanded')),
      open: (document.querySelector(`section[data-repo="${CSS.escape(new URLSearchParams(location.search).get('open'))}"] [data-action="toggle-section"]`) || { getAttribute: () => null }).getAttribute('aria-expanded'),
    }))
    await openAll(page)
    const m = await page.evaluate(probe)
    const dbg = /scrollWidth=(\d+)\s+innerWidth=(\d+)/.exec(first.dbg)
    const unset = await page.evaluate(() => {
      const el = document.querySelector('section[data-repo]') || document.body
      const names = new Set()
      for (const sheet of document.styleSheets) for (const r of sheet.cssRules) for (const x of r.cssText.matchAll(/var\((--oc-[a-z0-9-]+)/g)) names.add(x[1])
      return [...names].filter((n) => !getComputedStyle(el).getPropertyValue(n).trim()).length
    })
    sig[`${w}-${theme}`] = await page.evaluate(() => { const el = document.querySelector('section[data-repo]') || document.body; return [getComputedStyle(document.body).color, getComputedStyle(document.body).backgroundColor, getComputedStyle(el).backgroundColor].join('|') })
    const ok = {
      doc: first.sw <= first.iw && m.sw <= m.vw,
      edge: m.edge === 0,
      scrollers: m.scrollers === 0,
      targets: m.targets === 0,
      debug: dbg !== null && +dbg[1] === first.sw && +dbg[2] === first.iw && first.iw === w,
      done: first.done.length > 0 && first.done.every((v) => v === (done ? 'true' : 'false')),
      open: closed.length === 0 || first.open === 'true',
      sections: m.rows.length === 8,
      columns: m.rows.every((r) => (w < 640 ? r.maxRow === 1 && r.sameLeft && r.order === ORDER.join(',') : w < 1200 ? r.maxRow >= 3 : r.maxRow === 5)),
      widths: w < 640 || m.rows.every((r) => r.widths.every((x) => x >= 219 && x <= 321)),
      caps: m.rows.every((r) => Object.entries(r.cards).every(([c, n]) => n <= (c === 'done' ? 5 : 8))),
      vars: unset === 0,
    }
    const failed = Object.keys(ok).filter((k) => !ok[k])
    if (failed.length) failedCases += 1
    console.log(`case w=${w} theme=${theme} done=${done ? 'open' : 'closed'} scrollWidth=${m.sw} innerWidth=${m.vw} edge=${m.edge} scrollers=${m.scrollers} targets=${m.targets} ok=${failed.length === 0}${failed.length ? ' fail=' + failed.join(',') : ''}`)
    await page.close()
  }
  check('layout_cases_failed_is_zero', failedCases === 0, `failed_cases=${failedCases}`)
  check('theme_changes_computed_style', WIDTHS.every((w) => sig[`${w}-light`] !== sig[`${w}-dark`]))
}

const hostileMode = async (browser) => {
  const SEL = 'img,iframe,object,embed,[onerror],[onload],[onclick]'
  const read = async (target) => {
    const page = await goto(browser, target, 390, 'theme=light&open=measure&done=open')
    await openAll(page)
    const base = await page.evaluate(probe)
    const extra = await page.evaluate((sel) => ({ injected: document.querySelectorAll(sel).length, scripts: document.scripts.length, pwned: typeof window.__pwned, pwn: document.getElementById('pwn') !== null, text: document.body.innerText }), SEL)
    await page.close()
    return { ...base, ...extra }
  }
  const data = JSON.parse(BLOCK.exec(html)[1])
  const card = (o) => ({ repo: 'measure', title: 't', column: 'blocked', position: { phase: 1, phases: 2, task: 1, tasks: 2 }, marker: 'b', taskText: 't', note: null, line: 'l', registered: true, lastChange: data.capturedAt + 1, doneDate: null, doneSource: null, ...o })
  const T1 = '<img src=x onerror=window.__pwned=1>'
  const L1 = 'javascript:window.__pwned=3'
  data.repos.find((r) => r.repo === 'measure').cards.unshift(
    card({ title: T1, taskText: '"><script>window.__pwned=2</script>', line: L1 }),
    card({ title: 'W'.repeat(300), taskText: 'A'.repeat(300), line: 'B'.repeat(300) }),
    card({ title: '\u05e9\u05dc\u05d5\u05dd \u0645\u0631\u062d\u0628\u0627 </script><b id="pwn">x</b>', column: 'done', position: null, marker: null, taskText: null, line: null, lastChange: null, doneDate: '2099-12-31', doneSource: 'registry' }),
  )
  const tmp = path.join(os.tmpdir(), `board-hostile-${process.pid}.html`)
  fs.writeFileSync(tmp, swap(data))
  try {
    const clean = await read(file)
    const evil = await read(tmp)
    check('hostile_no_injected_element', evil.injected <= clean.injected && evil.scripts === clean.scripts && !evil.pwn)
    check('hostile_no_script_ran', evil.pwned === 'undefined')
    check('hostile_text_shown_literally', evil.text.includes(T1) && evil.text.includes(L1))
    check('hostile_no_sideways_scroll', evil.sw <= evil.vw && evil.edge === 0 && evil.scrollers === 0)
  } finally {
    fs.rmSync(tmp, { force: true })
  }
}

;(async () => {
  if (mode === 'static') staticMode()
  else {
    const { chromium } = require('@playwright/test')
    const browser = await chromium.launch()
    try { await (mode === 'layout' ? layoutMode(browser) : hostileMode(browser)) } finally { await browser.close() }
  }
  console.log(`${mode}_failed_checks=${bad}`)
  process.exit(bad ? 1 : 0)
})().catch((e) => { console.error(`error=${e.message.split('\n')[0]}`); process.exit(2) })
```
