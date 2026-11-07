# Implementation Plan: DSH Measure hardening — trustworthy live verification and real guard enforcement

Track: `dsh_measure_hardening_20261107`
Spec: [./spec.md](./spec.md)

Every phase follows the Task Workflow in `measure/workflow.md`: contract first,
a failing test recorded in the git note, then the implementation, then docs,
then the deferred manual verification. A **Contract** task records the exact
interface, file locations, framing, and edge cases here and in the module
header, and may add a scaffold with exported signatures only; it contains no
behavior. The **Red** task adds the failing tests; the **Green** task
implements them. Test files are
`plugins/dsh-measure-guard/tests/*.test.js`; the gate is
`node --test plugins/dsh-measure-guard/tests/*.test.js` plus both parity gates,
`bash tests/dsh/run.sh`, and `bash tests/spec_review_gate/run.sh`.

## Phase S1: The live check detects stale plugin code [checkpoint: 1778798]

_Story ref: spec.md#story-s1_

- [x] Task 1.1: Contract: the digest seam (recorded here and in the module headers; scaffold only) `e20cf49`
    - [ ] The manifest framing: SHA-256 over `<relative path>\n<sha256(file bytes)>\n` lines sorted by `LC_ALL=C`; the covered list is exactly `index.js`, `client.js`, `package.json`, `cordis.patch.yml`, `locale/*.json` at depth 1, and every `.js`/`.ts` under `src/` recursively (Node `readdir` with `withFileTypes` and bash `find` yield the same set)
    - [ ] `src/digest.js` scaffold: `digestFiles(packageDir)`, `computeDigest(packageDir)` -> `sha256:<hex>`, `loadedDigest(packageDir)` -> `sha256:<hex> | null`; `index.js` captures `loadedDigest(fileURLToPath(new URL('.', import.meta.url)))` once at module evaluation (never per request) and passes it as `deps.digest`
    - [ ] `src/client-state.js`: both exact routes add `x-measure-guard-digest: sha256:<hex>` when `deps.digest` is a string (the pre-digest instance sends no such header)
    - [ ] `bin/measure-dsh`: `source_digest(dir)` over the same manifest; the live comparison against `$PLUGIN_TARGET` (equal -> PASS naming the first 24 characters of the digest; mismatch -> FAIL naming the loaded and installed digests plus `bin/measure-dsh reload` / restart; header absent -> WARN); `reload` accepts only `--dsh-home`, `--profile`, `--dry-run`, exits 0/1/3 per Decision 4, prints one `PASS reload:` item and `reload complete: …` (dry run: `would rewrite …` + `dry run: no files written`); `install` writes the patch file even when the managed block is unchanged
- [x] Task 1.2: Red: failing tests for the digest and the stale detection `e20cf49`
    - [ ] `tests/digest.test.js`: determinism, creation-order independence, a changed covered file changes the digest, the file list excludes the stamp/`tests/`/`scripts/`/`README.md`, and a temp-copy load-time capture test (import the copied entry; the exported `digest` equals `computeDigest` and does not change after a file is modified; a fresh evaluation returns a different digest)
    - [ ] `tests/client-state.test.js`: the state response carries the digest header when `deps.digest` is set and omits it otherwise
    - [ ] `tests/dsh/test-live-digest.sh` (new): the CLI's bash `source_digest()` equals the plugin's Node `computeDigest()` for the installed copy (the cross-implementation property); three live-item cases driven by a test-owned Node HTTP server on a random port with `DSH_WEB_URL` pointed at it, the CLI invoked with `--session s1`, and the server answering `x-measure-guard-module: file://$PLUGIN_DST/index.js` plus a chosen `x-measure-guard-digest` header — match -> PASS, mismatch -> FAIL naming both digests and `reload`, absent -> WARN; `tests/dsh/lib.sh` is not changed
    - [ ] `tests/dsh/test-reload.sh` (new): `reload --dry-run` writes nothing; `reload` toggles only trailing newlines (the `$(cat)` text is byte-equal, the byte count changes, both managed-block markers survive); a second reload toggles back; an absent profile exits 3; a second real install prints `patch rewritten to trigger a live recompose` and writes no plugin file
    - [ ] `tests/dsh/test-install.sh` (case 2): a second install rewrites only the patch, keeps the YAML text equal, and writes no plugin file
- [x] Task 1.3: Green: implement the module-load digest, the route header, the CLI comparison, `reload`, and the install-time patch write; the live gate passes end to end `e20cf49`
- [x] Task 1.4: Docs: README "Checks" and "State and root resolution" plus `docs/dsh.md` name the digest, the stale FAIL, and `reload` `e20cf49`
- [x] Task: Measure - User Manual Verification 'Phase S1: The live check detects stale plugin code' (Protocol in workflow.md) `1778798`

## Phase S2: Git-backed verification of the task ceremony [checkpoint: aa96a23]

_Story ref: spec.md#story-s2_

- [x] Task 2.1: Contract: the git-verification seam (recorded here and in the module headers; scaffold only) `4d1729c`
    - [ ] `src/snapshot.js` `makeIo`: `gitProbe(args, cwd, signal)` -> exactly `'ok'` (exit 0), `'missing'` (exit 1), or `'error'` (any other exit code, spawn failure, or timeout); `index.js` wires it through `ctx.subprocess` exactly like `gitLines`. `cat-file -e` exit 1 and `notes show` exit 1 mean `missing`; any other failure is `error`
    - [ ] `src/git-verification.js` scaffold: `shaProblems(deps, snapshot)` (for each `[x]` task with a SHA, probe `git cat-file -e <sha>^{commit}`: `missing` -> `the task "<text>" cites SHA <sha>, which no commit in this repository owns.` and then short-circuit that task, so one bad SHA yields one problem; `ok` -> probe `git notes show <sha>`: `missing` -> `the task "<text>" has no git note on its commit <sha>.`; `error` -> silent), `planCompletedCount(plan)`, and `closeoutMetadataCheck(deps, tracksPath, closing)` returning `{ decision }` or `null` with the three texts of Decision 6 (mismatch names both numbers; missing names the completed count; malformed names the path)
- [x] Task 2.2: Red: failing tests for the git verification
    - [ ] `tests/git-verification.test.js` (new): a bad SHA and a missing note each produce one problem naming the task and SHA (one problem for a bad SHA); a good task is silent; a probe `error` is silent; the metadata mismatch deny names both numbers, while the missing-file deny names the completed count and the malformed deny names the path
    - [ ] `tests/end-of-turn.test.js`: the git problems are appended to the turn problems when the guards are on and skipped with a bypass
    - [ ] `tests/closeout.test.js`: the metadata deny is returned from `closeoutGuardFor` for a closed track and the allowed case carries no deny
- [x] Task 2.3: Green: implement the seam and wire `shaProblems` into `onTurnStopping` and `closeoutMetadataCheck` into the registry closeout
- [x] Task 2.4: Docs: README "Guards" (end-of-turn verification, closeout metadata) and `docs/dsh.md`
- [x] Task: Measure - User Manual Verification 'Phase S2: Git-backed verification of the task ceremony' (Protocol in workflow.md) `aa96a23`

## Phase S3: Close the write-path bypasses

_Story ref: spec.md#story-s3_

- [x] Task 3.1: Contract: the bypass-closure seam (recorded here and in the module headers; scaffold only) `008f90f`
    - [ ] `src/shell.js` scaffold: `shellWritePaths(command)` -> `string[]` extracting the targets of `>`/`>>` redirection, `tee` non-option arguments, and `sed -i` file arguments (absolute or relative; `/dev/null`, `&1`, `&2`, `-`, and redirect labels excluded); the bounded grammar and its limits are written in the module header
    - [ ] The two deny texts, exactly: `measure-guard: the closeout guard cannot read the after-text of apply_patch (or str_replace_editor). Use edit or write for measure/tracks.md and measure/**/plan.md. If this block is wrong, the user can run /measure-off.` and the same sentence for a shell write target (`... of a shell write. ...`)
    - [ ] `src/commit.js` scaffold: `addedPaths(command)` -> `{ all: boolean, trackedOnly: boolean, paths: string[] }` parsing every `git add` segment before the commit (non-option tokens; `.`/wildcards set `all`; `-A`/`--all` sets `all`; `-u`/`--update` sets `trackedOnly`), `commitTakesAll(command)` for an explicit commit `-a`/`--all`, and `stagedFiles(deps, root, takesChanges, added)` per Decision 9 (base `git diff --cached`; `add.all` -> every status path; `add.paths` -> exactly those; `add.trackedOnly` or an explicit `-a` -> modified/deleted tracked paths only)
    - [ ] `src/guard.js`: relative shell targets are resolved against the Session-effective directory (`deps.dirOf(agent)`) before the checks, exactly like the file mutations; the shell branch runs the extracted targets through `editDecision`/`tddDecision` and denies registry targets before the commit check; the unreadable-mutation-tool deny covers `apply_patch` and `str_replace_editor` on the registry files. Both denies are inert in `advise` mode and under the `/measure-off` bypass (Decision 10)
- [x] Task 3.2: Red: failing tests for the bypass closures `008f90f`
    - [ ] `tests/shell.test.js` (new): `shellWritePaths` on the documented forms and non-forms (`2>/dev/null`, `>&1`, heredoc target, `| tee file`, `sed -i 's/a/b/' file`); a heredoc body is not parsed separately, which is documented as a fail-closed limit
    - [ ] `tests/edit-guard.test.js`: a redirect/tee/sed target denied without a task and allowed with one; a `measure/tracks.md` redirect denied with the registry text; other `measure/` and outside-root targets ignored; strict TDD through a shell source target
    - [ ] `tests/commit.test.js`: `git add src/app.js` with an unrelated untracked `notes.md` denies and names only `src/app.js`; `git add .` includes the untracked path; `git commit -am` excludes untracked and includes the modified tracked path; unparseable commands are allowed
    - [ ] `tests/closeout.test.js`: `apply_patch`/`str_replace_editor` on `measure/tracks.md` and a `measure/**/plan.md` are denied with the text; the same tools on other files keep the fail-open behavior
- [x] Task 3.3: Green: implement the shell path check, the registry deny for unreadable mutation tools, and the in-command `git add` set `008f90f`
- [x] Task 3.4: Docs: README "Known limits" and "Guards" (bounded shell grammar, registry deny, in-command `git add`) `008f90f`
- [ ] Task: Measure - User Manual Verification 'Phase S3: Close the write-path bypasses' (Protocol in workflow.md)

## Phase S4: Documentation, live check, and track closeout

_Story ref: spec.md#story-s4_

- [~] Task 4.1: Docs: README, `docs/dsh.md`, and `CHANGELOG.md` name the digest check, `reload`, the git-backed verification, and the bypass closures with their limits
- [ ] Task 4.2: Live check: run the stale-instance sequence (install -> PASS with digest; modify the installed `src/status.js` without recompose -> FAIL with mismatched digests; `reload` -> PASS; then delete the modified installed file and reinstall, and record that `--check` is clean again) and record one shell-redirect deny, one `apply_patch` registry deny, one bad-SHA/no-note problem, and one metadata-mismatch deny under `measure/runs/dsh_measure_hardening_20261107/`
- [ ] Task 4.3: Closeout documents: `measure/lessons-learned.md`, `measure/tech-debt.md` (resolve the stale-instance row), `metadata.json`, archive the track, update `measure/tracks.md`
- [ ] Task: Measure - User Manual Verification 'Phase S4: Documentation, live check, and track closeout' (Protocol in workflow.md)
