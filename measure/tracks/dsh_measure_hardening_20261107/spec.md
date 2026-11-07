# Specification: DSH Measure hardening — trustworthy live verification and real guard enforcement

## Overview

**Sprint goal:** The DeepSeek Harness adapter proves what it claims: a live check that detects stale plugin code, git-backed verification of the task ceremony, and guards that see the write paths they previously missed.

The evolution track `dsh_measure_evolve_20261107` closed the adapter's deferred roadmap and was live-verified, but it also exposed the remaining gap between the adapter's claims and its enforcement. Three findings drive this track:

1. **A live check that can lie.** `bin/measure-dsh --check --live` passed while the running Host still executed the *old* plugin code, because the route's module header names the loaded module's **path**, and the path does not change when the installed files are replaced. "Live-verified" was not a reliable statement.
2. **Marker-only guard enforcement.** The guard checks `[ ]`/`[~]`/`[x]`/`[b]` markers and checkpoint headings. It never verifies that an `[x]` task's SHA is a real commit, that the commit carries the mandated git note, or that a closed track's `metadata.json` `actual_tasks` matches the plan. A guard that trusts markers cannot enforce the ceremony it describes.
3. **Write paths the guards cannot see — or see too coarsely.** `apply_patch` and `str_replace_editor` fail open in the closeout guard (so `tracks.md`/`plan.md` can be rewritten unchecked), shell redirects/`tee`/`sed -i` writes bypass the edit and TDD guards, and a `git add` earlier in the same commit command makes the guard treat every changed and untracked status path as staged — too broad, so an unrelated untracked file can block a valid commit.

This track closes those three. The broader harness integration (orchestrator roles on DSH agent teams end-to-end, goal↔track drift in the other direction, scheduled updates) is a separate follow-up track; platform and packaging items stay out.

Decisions made for this track (the owner selected the areas and autonomy mode in the follow-up questions):

1. **Spec format:** story-shaped (feature track).
2. **Scope:** verification reliability (S1), git-backed task verification (S2), and write-path bypass closure (S3), then docs/live/closeout (S4). Broader harness integration is the next track; Windows and packaging are out of scope.
3. **The digest is captured at module load and compared with the installed copy.** The plugin computes a SHA-256 synchronously when the module is evaluated and serves it as `x-measure-guard-digest: sha256:<hex>`. A stale instance answers with the digest of the bytes it loaded before the replacement. The exact manifest is: SHA-256 over the concatenation of `<relative path>\n<sha256 of the file bytes>\n` for each covered file, sorted by byte order (`LC_ALL=C`); the covered files are `index.js`, `client.js`, `package.json`, `cordis.patch.yml`, `locale/*.json` at depth 1, and every `.js`/`.ts` file under `src/` recursively. Both implementations enumerate exactly that list. The CLI hashes the **installed plugin copy** (the bytes the Host is supposed to run; the plugin file/stamp item separately detects installed-vs-source drift) and compares: absent → WARN (a pre-digest instance must be recomposed), mismatch → FAIL naming the loaded and installed digests plus the remediation, equal → PASS. The failure mode this catches is an out-of-band replacement of the installed copy while the old instance keeps running: before `reload` the loaded digest is the old one, after it the Host loads the installed bytes and the item passes.
4. **Install triggers a recompose; `reload` is the explicit backstop.** `bin/measure-dsh install` writes the profile patch file after its managed-block update even when the block text is unchanged (a patch write is the known recompose trigger). A new `bin/measure-dsh reload` action performs the same write on demand. Both are content-preserving: the managed block and all other patch entries are untouched; only the trailing-newline count toggles. `reload` accepts `--dsh-home`, `--profile`, and `--dry-run` only (any other option is the CLI's usage error, exit 2); it exits 0 on success or a dry run, 1 when the rewrite itself fails, and 3 when the profile folder, the patch file, or write permission is missing. It prints one `PASS reload:` item and a completion line (dry run prints the would-write item and `dry run: no files written`). The contract test proves the patch text stays equal apart from trailing newlines.
5. **Git-backed verification runs at the end of the turn.** For each `[x]` task with a SHA in the active plan, the adapter runs `git cat-file -e <sha>^{commit}` (the `^{commit}` peel makes a blob, tree, or tag SHA fail, so the probe proves a commit) and then `git notes show <sha>`. A missing commit short-circuits the note probe, so one bad SHA produces exactly one problem. The io seam gains `gitProbe(args, cwd)` returning exactly one of `ok` (exit 0), `missing` (exit 1 — `cat-file -e` exits 1 for an absent object and `notes show` exits 1 for an absent note), or `error` (any other exit code, a spawn failure, or a timeout). `missing` becomes an end-of-turn problem; `error` fails open with no problem. The checks only run when the active plan exists and the guards are on.
6. **Closeout verifies `metadata.json`.** When an edit of `measure/tracks.md` closes a track, `closeoutMetadataCheck(deps, tracksPath, closing)` reads that track's `metadata.json` (path: `<tracks dir>/<folder>/metadata.json`) and its plan. The mismatch deny is `measure-guard: the track "<name>" is closed with metadata actual_tasks <actual> but its plan has <completed> completed tasks. Fix metadata.json first.`; a missing file denies with `measure-guard: the track "<name>" has no metadata.json. Write it (actual_tasks: <completed>) before the close.`; an unparsable file denies with `measure-guard: <path> is not valid JSON, so the track "<name>" cannot be closed. Fix metadata.json first.` Each deny ends with the shared bypass line.
7. **The closeout guard fails closed for unreadable mutation tools on the registry files.** `apply_patch` and `str_replace_editor` carry no reconstructable after-text, so an edit of `measure/tracks.md` or `measure/**/plan.md` through them is denied with a text that says to use `edit` or `write`. Other paths keep today's fail-open behavior.
8. **Shell writes are path-checked within a bounded grammar.** The adapter extracts the targets of `>`/`>>` redirection, `tee` (non-option arguments), and `sed -i` from a bash command. Each target is first resolved against the Session-effective directory (the same base the file mutations use through `normalizeMutation`), then a target inside the project goes through the shared `editDecision` and, in strict mode, `tddDecision`; a target inside `measure/` is denied when it is `measure/tracks.md` or a `measure/**/plan.md` (use `edit`/`write` so the closeout guard can read the after-text) and otherwise allowed. Unparseable or unusual commands are allowed (the end-of-turn check remains the backstop), and no shell content is reconstructed.
9. **The commit guard narrows its file set instead of over-approximating.** Today an earlier `git add` in the same command makes the guard union *every* changed and untracked status path, so an unrelated untracked file blocks a valid commit. The guard now parses the command: an earlier `git add <paths>` contributes exactly its non-option path arguments; `git add .` or a wildcard path expands to the changed and untracked paths; `git add -A`/`--all` contributes every status path and `git add -u`/`--update` the modified and deleted tracked paths; `git commit -a`/`--all` contributes the tracked paths only (never untracked files). `git diff --cached` remains the base. The no-task rule and the format check are unchanged.
10. **The new checks obey the mode and the bypass.** `advise` allows every guard, so the metadata closeout check, the unreadable-tool deny, and the shell registry deny are inert in `advise`; the `/measure-off` bypass silences every deny-producing check. The end-of-turn git problems are recorded exactly like the existing marker problems (band in `advise`, reminder in `guard`, hold-open in `strict`) and are skipped when the bypass is on.
11. **No new dependency, no build, no shared-core change.** All new logic is adapter-side (Node built-ins only: `node:crypto`, `node:fs`). The shared core parity gates must stay green; the CLI stays bash.

## Stories

### Story S1: The live check detects stale plugin code
**As a** Measure maintainer running the DSH environment
**I want** the live check to prove the running Host executes the installed bytes
**So that** "live-verified" cannot pass on a stale instance again

**Acceptance Criteria:**
- Given the plugin package, When the module is evaluated, Then a SHA-256 over the manifest described in Decision 3 is computed exactly once and the digest is served unchanged for the instance's lifetime (a file changed on disk after load does not change the answer).
- Given the CLI and the plugin, When both compute the digest for the same package folder, Then the values are equal, and an executable contract test asserts it (the bash and Node implementations agree on the file list and the framing).
- Given a live state route, When the plugin answers, Then the response carries `x-measure-guard-digest: sha256:<hex>` equal to the digest of the loaded code.
- Given a running Host whose loaded digest differs from the **installed copy's** digest, When `bin/measure-dsh --check --live` runs, Then the live item is FAIL, names both digests, and says to run `bin/measure-dsh reload` or restart DSH.
- Given a Host whose loaded module predates the digest header, When the check runs, Then the live item is WARN (not PASS) and the same remediation is named.
- Given the digests match, When the check runs, Then the live item is PASS and includes the digest prefix.
- Given `bin/measure-dsh install`, Then the profile patch file is written even when the managed block is unchanged, so the loaded plugin recomposes.
- Given `bin/measure-dsh reload`, Then it accepts only `--dsh-home`, `--profile`, and `--dry-run`, performs only the recompose-triggering patch write, reports the documented item and completion line, and uses the exit codes of Decision 4; it never edits the managed block or other entries.
- Given the shared core, When I run the parity checks, Then both print `parity: ok` (no core change).

**Estimate:** M
**Priority:** Must

### Story S2: Git-backed verification of the task ceremony
**As a** Measure developer on the DeepSeek Harness
**I want** the guard to verify that an `[x]` task's SHA is a real commit with its git note
**So that** the plan markers reflect real, traceable work

**Acceptance Criteria:**
- Given an active plan with a task `[x] Task … \`abcdef0\``, When the turn ends, Then the adapter runs `git cat-file -e abcdef0` and `git notes show abcdef0`.
- Given the SHA is not a commit or the note is missing, When the turn ends, Then the end-of-turn problems include exactly one problem per failure naming the task and the SHA.
- Given the commit and its note exist, Then no problem is reported for that task.
- Given a repository where `git` fails or is unavailable, When the turn ends, Then the git checks report nothing (fail open) and the marker-only problems are unchanged.
- Given an edit of `measure/tracks.md` that closes a track whose plan has 5 `[x]` tasks and whose `metadata.json` says `actual_tasks: 4`, When the edit is prepared, Then the close is denied and the deny names both numbers.
- Given the same close with `actual_tasks: 5`, Then the close is allowed; a missing `metadata.json` is denied.

**Estimate:** M
**Priority:** Must

### Story S3: Close the write-path bypasses
**As a** Measure maintainer
**I want** the guards to see the write paths that previously slipped through
**So that** the edit, TDD, closeout, and commit rules apply to every mutation route

**Acceptance Criteria:**
- Given `apply_patch` or `str_replace_editor` targets `measure/tracks.md` or a `measure/**/plan.md`, When the call is prepared, Then it is denied with a text that says to use `edit` or `write` so the guard can read the after-text.
- Given the same tools target other files, Then today's behavior is unchanged (fail open for the closeout decision; the edit and TDD decisions still apply).
- Given a bash command with `>`, `>>`, `tee`, or `sed -i` writing a file inside the project and outside `measure/`, When no task is `[~]`, Then the call is denied with the shared core's edit text; with a `[~]` task it is allowed; in strict mode a source file also goes through `tddDecision`.
- Given such a command writing `measure/tracks.md` or a `measure/**/plan.md`, Then it is denied with the same "use edit or write" text as Decision 7; other `measure/` targets, targets outside the project, allow-listed paths, and non-file targets (`/dev/null`, `>&1`) produce no deny.
- Given `git add src/app.js && git commit -m "fix(app): X"` with no `[~]` task and an unrelated untracked `notes.md`, Then the commit is denied and the deny names `src/app.js` and not `notes.md`.
- Given `git add . && git commit`, Then the changed and untracked paths join the set; given `git commit -am`, Then modified and deleted tracked paths join it and untracked files do not.
- Given an unparseable command, Then no new deny is produced and the end-of-turn check remains the backstop.

**Estimate:** L
**Priority:** Must

### Story S4: Documentation, live check, and track closeout
**As a** Measure maintainer
**I want** the hardening documented and proven against the running harness
**So that** the next session starts from accurate docs and the claims are evidence-backed

**Acceptance Criteria:**
- Given the plugin README and `docs/dsh.md`, Then the digest check, `reload`, the git-backed verification, and the bypass closures are documented with their known limits.
- Given `CHANGELOG.md`, Then one Unreleased entry names this track and the three hardening areas.
- Given the running web profile, When I run the live sequence, Then: install → `--check --live` PASS with digest; replace the **installed** `src/status.js` with a modified copy and do not recompose → `--check --live` FAIL naming the loaded and installed digests; `bin/measure-dsh reload` → the Host loads the modified installed bytes and `--check --live` PASS; then the probe file is deleted from the installed copy and the plugin reinstalled, so `--check` reports all items clean again (an install keeps local edits, so the explicit removal is required). One shell-redirect deny and one `apply_patch` registry deny are recorded; a bad-SHA/no-note problem and a metadata mismatch deny are recorded.
- Given `measure/lessons-learned.md` and `measure/tech-debt.md`, Then the new lessons and findings are recorded and both stay at or below 50 lines.
- Given the track completes, Then `metadata.json` records the real counts and the track is archived with a `tracks.md` update.

**Estimate:** S
**Priority:** Must

## Non-Functional Requirements

- **NFR-1 (inert outside Measure).** Outside a git work tree the plugin does nothing; in a repository without `measure/` only the setup offer applies; the digest, git-backed checks, and shell checks stay inert without an active plan.
- **NFR-2 (no new dependency, no build).** Host-side additions use `node:crypto` and `node:fs` only; the CLI stays bash; the client half is unchanged.
- **NFR-3 (shared core parity).** No shared-core change in this track; both parity gates must pass unchanged.
- **NFR-4 (fail open except the explicit deny).** An unreadable git state, a failed digest read, or an unparseable shell command produces no deny (at most one note). Two intentional fail-closed rules exist: Decision 7 (the registry files through `apply_patch`/`str_replace_editor`) and the registry/plan shell-write deny of Decision 8 — both cover content the guard cannot read.
- **NFR-5 (bounded grammar).** The shell check recognizes only the documented forms; it is a bypass reducer, not a shell parser, and the end-of-turn check remains the backstop.
- **NFR-6 (POSIX).** Windows path support stays out of scope.
- **NFR-7 (evidence).** Every story lands with Red-first tests recorded in the git note, the gate command, and live evidence under `measure/runs/dsh_measure_hardening_20261107/` (gitignored).

## Acceptance Criteria (track level)

- Given the plugin package, When I run `node --test plugins/dsh-measure-guard/tests/*.test.js`, Then every test passes and the count grows from 213 by the new digest, git-verification, closeout-metadata, shell-path, and commit-add tests.
- Given both cores, When I run `bash plugins/dsh-measure-guard/scripts/check-parity.sh` and `bash plugins/opencode-measure-guard/scripts/check-parity.sh`, Then both print `parity: ok`.
- Given a temporary home, When I run `bash tests/dsh/run.sh`, Then the environment CLI contract passes, including the new digest/reload items.
- Given the repository, When I run `bash tests/spec_review_gate/run.sh`, Then 10/10 suites pass.
- Given the running web profile, When the live sequence runs, Then the stale-instance simulation FAILs, `reload` returns it to PASS, and the guard denies are recorded.

## Out of Scope

- The broader harness integration track (orchestrator roles on DSH agent teams end-to-end, goal↔track drift in the other direction, scheduled updates).
- Platform and packaging (Windows paths, bundle-install Plugins-page title/icon).
- Full diff execution for `apply_patch` (the registry-file deny replaces reconstruction).
- An exhaustive shell parser or reconstruction of shell-written content.
- Changes to the shared core or the other two adapters.
- Verifying every git note's content, or SHAs in `metadata.json`.
