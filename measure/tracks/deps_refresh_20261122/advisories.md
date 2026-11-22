# Dependency advisories: measure-status and opencode-measure-guard

Track: `deps_refresh_20261122`. Spec: [./spec.md](./spec.md). Plan: [./plan.md](./plan.md).
Record date: 2026-11-22. Phase 1 and Phase 2 records.

## Counts

### Before (2026-11-22, before the Phase 1 updates)

- extensions/measure-status: 21 advisories (4 critical, 5 high, 11 moderate, 1 low).
- plugins/opencode-measure-guard: 8 advisories (1 critical, 4 high, 3 moderate, 0 low).

### After (2026-11-22, after the Phase 1 updates)

- extensions/measure-status: 3 advisories (0 critical, 0 high, 3 moderate, 0 low).
- plugins/opencode-measure-guard: 2 advisories (0 critical, 0 high, 2 moderate, 0 low).

Both folders held 0 critical and 0 high advisories. The counts come from
`bun audit --json` in each folder. The command is `tests/deps_audit/run.sh`.

### After (2026-11-22, after the Phase 2 updates)

- extensions/measure-status: 0 advisories (0 critical, 0 high, 0 moderate, 0 low).
- plugins/opencode-measure-guard: 0 advisories (0 critical, 0 high, 0 moderate, 0 low).

`bun audit --json` prints `{}` in each folder. `bash tests/deps_audit/run.sh`
prints the same zero counts for both folders and exits 0.

## Package changes in Phase 1

| Folder | Package | Before | After | Reason |
| --- | --- | --- | --- | --- |
| extensions/measure-status | happy-dom | ^15.11.7 | ^21.0.0 | The plan floor is 20.14.7. No 20.14.7 exists on npm. The first fixed version of GHSA-c8p4-j97h-3vg8 is 21.0.0. |
| extensions/measure-status | vitest | ^2.1.0 | ^3.2.7 | 3.2.6 is the first fixed version of GHSA-5xrq-8626-4rwp. |
| extensions/measure-status | vite | not listed | ^6.4.4 | 6.4.4 is the first fixed version of GHSA-587h-7wmj-h5pm. The package arrived through vitest. It is now a direct devDependency, so the fixed version stays in the lock. |
| extensions/measure-status | tinypool | not listed | override ^2.1.2 | 2.1.2 is the first fixed version of GHSA-85c8-ppgw-ccpr. vitest 3.2.7 pins tinypool ^1.1.1 and has no fixed release, so an override carries the fix. |
| extensions/measure-status | zod | not listed | override ^4.6.6 | 4.6.6 is the first fixed version of GHSA-mrhx-c7xc-m3w5. @openchamber/sdk 2.7.2 pins zod ^4.3.6 and has no fixed release, so an override carries the fix. |
| plugins/opencode-measure-guard | seroval | not listed | override ^1.6.8 | 1.6.8 is the first fixed version of GHSA-97r2-qh9m-474h, GHSA-wp97-x4hv-qvhp and GHSA-7rv5-mrxv-xcr9. solid-js 1.9.12 pins seroval ~1.5.0 and has no fixed release, so an override carries the fix. |

The guard keeps solid-js 1.9.12. The peer floors stay: @opencode/plugin
>=2.0.0, @opentui/core >=0.6.6, @opentui/solid >=0.6.6, solid-js >=1.9.0.

The lock of extensions/measure-status held stale nested entries for
`vitest/vite` and `vite-node/vite` at vite 5.4.21 and esbuild 0.21.5. Bun
kept those entries, and `bun audit` read them. The entries were dropped, and
`bun install` resolved them to the root vite 6.4.6 and esbuild 0.25.12.

The lock of plugins/opencode-measure-guard is gitignored. The committed change
in that folder is its `package.json` alone.

## Package changes in Phase 2

| Folder | Package | Before | After |
| --- | --- | --- | --- |
| extensions/measure-status | @openchamber/sdk | ^2.7.1 | 2.8.0 |
| extensions/measure-status | typescript | ^5.6.0 | 7.0.2 |
| extensions/measure-status | vite | ^6.4.4 | 8.3.8 |
| extensions/measure-status | vitest | ^3.2.7 | 5.1.1 |
| plugins/opencode-measure-guard | @opencode/plugin | 2.0.32 | 2.3.2 |
| plugins/opencode-measure-guard | @opentui/core | 0.6.6 | 0.9.7 |
| plugins/opencode-measure-guard | @opentui/solid | 0.6.6 | 0.9.7 |
| plugins/opencode-measure-guard | @types/bun | 1.3.14 | 1.4.5 |
| plugins/opencode-measure-guard | typescript | 5.9.3 | 7.0.2 |

Every major step passed every command. No source file and no test file needed
a fix. happy-dom 21.0.4 and @types/node 26.6.6 were already latest.

## Overrides in Phase 2

- Removed `tinypool` override ^2.1.2. vitest 5.1.1 has no package that depends
  on tinypool. The override had no effect.
- Kept `zod` override ^4.6.6. @openchamber/sdk 2.8.0 still pins `zod ^4.3.6`.
  That range still allows a version below the fixed 4.6.6.
- Kept `seroval` override ^1.6.8. solid-js 1.9.12 still pins `seroval ~1.5.0`.
  That range stays below the fixed versions.
- Added `glob` override ^14.0.2 and `minimatch` override ^11.0.1. The parents
  still resolved glob 13.0.5 and minimatch 10.2.5. The overrides resolve
  14.0.6 and 11.0.9.

## Remaining moderate and low advisories

| Folder | Package | GHSA id | Severity | First fixed version | Reason it stays in Phase 1 | Phase 2 |
| --- | --- | --- | --- | --- | --- | --- |
| extensions/measure-status | @vitest/mocker | GHSA-82fw-gwwq-j7x9 | moderate | 4.1.11 | Phase 1 clears the critical and high advisories. vitest 3.2.7 needs @vitest/mocker 3.2.7. | Cleared by vitest 5.1.1. |
| extensions/measure-status | @vitest/mocker | GHSA-qxg6-89mg-rqv8 | moderate | 4.1.12 | The same reason. | Cleared by vitest 5.1.1. |
| extensions/measure-status | vitest | GHSA-82fw-gwwq-j7x9 | moderate | 4.1.11 | Phase 1 takes vitest 3.2.7, the smallest version that clears the vitest critical. | Cleared by vitest 5.1.1. |
| plugins/opencode-measure-guard | glob | GHSA-3g3m-2fjr-6pw4 | moderate | 14.0.2 | Phase 1 changes nothing in the guard but the seroval override. glob arrives through @opencode/plugin and @opentui/solid. | Cleared by the glob override at 14.0.6. |
| plugins/opencode-measure-guard | minimatch | GHSA-g3hv-75wg-m249 | moderate | 11.0.1 | The same reason. minimatch arrives through the same parents. | Cleared by the minimatch override at 11.0.9. |

The moderate and low list is empty after Phase 2. Both folders hold 0
advisories of every severity. Phase 2 cleared these four GHSA ids:
GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8, GHSA-3g3m-2fjr-6pw4, and
GHSA-g3hv-75wg-m249.

## Held-back packages

### Phase 1

None. Every package moved to a version that clears every critical and high
advisory. No package stayed on an older version to keep a command green.

### Phase 2

solid-js stays at 1.9.12 in plugins/opencode-measure-guard. solid-js 2 is a
peer major. The rule takes a peer major only when the plugin still loads with
an OpenCode 2.0.x host. No such host is available here, so that load cannot be
proved. The latest @opentui/solid 0.9.7 also peers `solid-js ^1.9.12`.
solid-js 2 would conflict with that peer range.

The peer floors stay unchanged: @opencode/plugin >=2.0.0, @opentui/* >=0.6.6,
solid-js >=1.9.0.

## PM acceptances

None yet. `tests/deps_audit/allow.txt` holds no advisory id. Every critical
and high advisory was cleared by a package update, not by an acceptance.

## Phase 1 command exits

Every command ran through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`
with `HEAVY_MIN_AVAIL_MB=1500`.

| Command | Exit | Result |
| --- | --- | --- |
| `cd extensions/measure-status && bunx tsc -p . --noEmit` | 0 | No type error. |
| `cd extensions/measure-status && bunx vitest run` | 0 | 25 files, 431 tests passed. |
| `cd plugins/opencode-measure-guard && bun test` | 0 | 186 pass, 0 fail. |
| `cd plugins/opencode-measure-guard && bun x tsc --noEmit -p .` | 0 | No type error. |
| `cd plugins/opencode-measure-guard && bash scripts/check-parity.sh` | 0 | parity: ok |
| `bash plugins/dsh-measure-guard/scripts/check-parity.sh` | 0 | parity: ok |
| `bash plugins/opencode-measure-guard/scripts/check-parity.sh` | 0 | parity: ok |
| `bash tests/dsh/run.sh` | 0 | 15 passed, 0 failed. |
| `bash tests/deps_audit/test.sh` | 0 | 8 checks, PASS=8, FAIL=0. |
| `bash tests/deps_audit/test-r2.sh` | 0 | 4 checks, PASS=4, FAIL=0. |

The audit check reads every advisory record. It exits 2 when a record has a
severity outside critical, high, moderate, and low. An allow line needs the
GHSA id and a nonempty reason. A bare id exempts nothing. Both rules landed
with the Review A fix at commit 35d5a7d.

## Bundle equality

`cd extensions/measure-status && bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=/tmp/deps-main.js && cmp /tmp/deps-main.js panel/main.js`
exits 0. A fresh build gives the same bytes as the committed
`extensions/measure-status/panel/main.js`.

Phase 1 left the bundle unchanged. Phase 2 changed it in commit 2e8b71f.
The cause is the @openchamber/sdk 2.7.2 -> 2.8.0 update. SDK 2.8.0 adds
`dist/navigation.js` with `guestNavigationCalls`, `openWalkthrough`, and a
refactored `openCommit`. It moves `GUEST_COMMIT_SHA` into that module. The
other diff lines drop an SDK comment and join SDK call lines. esbuild stayed
at 0.25.12. No file under `panel/` or `src/` changed.

The extension still declares `openchamber >=2.7.1` in its `engines` field.
The bundle now builds against @openchamber/sdk 2.8.0. This track did not
change the declared floor. The PM can decide whether to raise it.

## Scope note

Phase 1 holds two scope items. Only one reaches outside the two folders of
the spec.

1. The shared guard core fix `match[1] ?? null` also changed
   `mods/measure-guard/hooks/guards.ts` and
   `plugins/dsh-measure-guard/src/core/guards.ts`. These files sit outside
   the two folders. The two parity gates require identical copies, so the
   one line had to change in all three files. The regex always fills the
   group, so the runtime behaviour stays the same. The PM decision is
   pending.
2. The V18 case sits in
   `plugins/opencode-measure-guard/tests/allow-adversarial.test.ts`. That
   path is inside the guard folder. The case changed to match the documented
   control-character rule (`mods/measure-guard/README.md` row 1). The old
   case expected a CR-only allow entry to load as a folder. The parser
   rejects such an entry since commit 6d2fdcf. The sibling cases V6 and V7
   changed in that commit. The case still proves that no real path opens.

Review A passed both items at dcffc7b with no findings. Review A does not
replace the PM decision on the outside-folder change.

## Phase 2 command exits

Every command ran through `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`
with `HEAVY_MIN_AVAIL_MB=1500`.

| Command | Exit | Result |
| --- | --- | --- |
| `cd extensions/measure-status && bunx tsc -p . --noEmit` | 0 | No type error. |
| `cd extensions/measure-status && bunx vitest run` | 0 | 25 files, 431 tests passed. |
| `cd plugins/opencode-measure-guard && bun test` | 0 | 186 pass, 0 fail. |
| `cd plugins/opencode-measure-guard && bun x tsc --noEmit -p .` | 0 | No type error. |
| `cd plugins/opencode-measure-guard && bash scripts/check-parity.sh` | 0 | parity: ok |
| `bash plugins/dsh-measure-guard/scripts/check-parity.sh` | 0 | parity: ok |
| `bash plugins/opencode-measure-guard/scripts/check-parity.sh` | 0 | parity: ok |
| `bash tests/dsh/run.sh` | 0 | 15 passed, 0 failed. |
| `bash tests/deps_audit/test.sh` | 0 | 8 checks, PASS=8, FAIL=0. |
| `bash tests/deps_audit/test-r2.sh` | 0 | 4 checks, PASS=4, FAIL=0. |
| `bash tests/deps_audit/run.sh` | 0 | 0 critical, 0 high, 0 moderate, 0 low in both folders. |
| Fresh esbuild build and `cmp /tmp/deps-main.js panel/main.js` | 0 | Fresh build equals the committed bundle. |
| `cd extensions/measure-status && bun audit` | 0 | No vulnerabilities found. |
| `cd plugins/opencode-measure-guard && bun audit` | 0 | No vulnerabilities found. |
| `cd extensions/measure-status && bun audit --json` | 0 | `{}` |
| `cd plugins/opencode-measure-guard && bun audit --json` | 0 | `{}` |
