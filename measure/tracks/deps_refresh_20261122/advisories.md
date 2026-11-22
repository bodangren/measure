# Dependency advisories: measure-status and opencode-measure-guard

Track: `deps_refresh_20261122`. Spec: [./spec.md](./spec.md). Plan: [./plan.md](./plan.md).
Record date: 2026-11-22. Phase: Phase 1, critical and high advisories.

## Counts

### Before (2026-11-22, before the Phase 1 updates)

- extensions/measure-status: 21 advisories (4 critical, 5 high, 11 moderate, 1 low).
- plugins/opencode-measure-guard: 8 advisories (1 critical, 4 high, 3 moderate, 0 low).

### After (2026-11-22, after the Phase 1 updates)

- extensions/measure-status: 3 advisories (0 critical, 0 high, 3 moderate, 0 low).
- plugins/opencode-measure-guard: 2 advisories (0 critical, 0 high, 2 moderate, 0 low).

Both folders now hold 0 critical and 0 high advisories. The counts come from
`bun audit --json` in each folder. The command is `tests/deps_audit/run.sh`.

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

## Remaining moderate and low advisories

| Folder | Package | GHSA id | Severity | First fixed version | Reason it stays in Phase 1 | Phase 2 |
| --- | --- | --- | --- | --- | --- | --- |
| extensions/measure-status | @vitest/mocker | GHSA-82fw-gwwq-j7x9 | moderate | 4.1.11 | Phase 1 clears the critical and high advisories. vitest 3.2.7 needs @vitest/mocker 3.2.7. | Phase 2 moves vitest to 4.1.12, which clears it. |
| extensions/measure-status | @vitest/mocker | GHSA-qxg6-89mg-rqv8 | moderate | 4.1.12 | The same reason. | Phase 2 moves vitest to 4.1.12, which clears it. |
| extensions/measure-status | vitest | GHSA-82fw-gwwq-j7x9 | moderate | 4.1.11 | Phase 1 takes vitest 3.2.7, the smallest version that clears the vitest critical. | Phase 2 moves vitest to 4.1.12, which clears it. |
| plugins/opencode-measure-guard | glob | GHSA-3g3m-2fjr-6pw4 | moderate | 14.0.2 | Phase 1 changes nothing in the guard but the seroval override. glob arrives through @opencode/plugin and @opentui/solid. | Phase 2 moves glob to 14.0.2 or later. |
| plugins/opencode-measure-guard | minimatch | GHSA-g3hv-75wg-m249 | moderate | 11.0.1 | The same reason. minimatch arrives through the same parents. | Phase 2 moves minimatch to 11.0.1 or later. |

No low advisory remains. Both folders hold 0 critical and 0 high advisories.

## Held-back packages

None. Every package moved to a version that clears every critical and high
advisory. No package stayed on an older version to keep a command green.

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

## Bundle equality

`cd extensions/measure-status && bunx esbuild panel/main.ts --bundle --format=iife --platform=browser --outfile=/tmp/deps-main.js && cmp /tmp/deps-main.js panel/main.js`
exits 0. The rebuild of `extensions/measure-status/panel/main.js` gives the
same bytes as the committed file, so the file is unchanged in the commit.

## Scope note

Two changes of Phase 1 reach outside the two folders of the spec. Both wait
for Review A and the PM.

1. The shared guard core fix `match[1] ?? null` also changed
   `mods/measure-guard/hooks/guards.ts` and
   `plugins/dsh-measure-guard/src/core/guards.ts`. The two parity gates
   require identical copies, so the one line had to change in all three
   files. The regex always fills the group, so the runtime behaviour stays
   the same.
2. The V18 case in `plugins/opencode-measure-guard/tests/allow-adversarial.test.ts`
   changed to match the documented control-character rule
   (`mods/measure-guard/README.md` row 1). The old case expected a CR-only
   allow entry to load as a folder. The parser rejects such an entry since
   commit 6d2fdcf. The sibling cases V6 and V7 changed in that commit. The
   case still proves that no real path opens.
