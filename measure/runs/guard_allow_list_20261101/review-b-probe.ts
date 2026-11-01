// Review B security probe. Runs with bun from the repo root:
//   bun measure/runs/guard_allow_list_20261101/review-b-probe.ts
// Imports the plugin loader and core. Touches only a temporary directory.
import { execSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadSnapshot } from '../../../plugins/opencode-measure-guard/src/snapshot'
import { isAllowed } from '../../../plugins/opencode-measure-guard/src/core/guards'
import type { Snapshot } from '../../../plugins/opencode-measure-guard/src/types'

let failures = 0
const check = (label: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'ok' : 'FAIL'} ${label}${detail ? ' :: ' + detail : ''}`)
  if (!ok) failures++
}

const tempRoot = mkdtempSync(join(tmpdir(), 'review-b-'))
try {
  const makeRepo = (name: string): string => {
    const root = join(tempRoot, name)
    mkdirSync(join(root, 'measure'), { recursive: true })
    writeFileSync(join(root, 'measure', 'tracks.md'), '- [ ] **Track: T**\n  *Link: [./tracks/t/](./tracks/t/)*\n')
    execSync(`git init -q '${root}'`)
    return root
  }

  // 1. Missing guard-allow file.
  {
    const root = makeRepo('missing')
    const snap = await loadSnapshot(root)
    check('missing file: empty list', snap.allow.folders.length === 0 && snap.allow.ignored.length === 0)
    check('missing file: no throw, parseError null', snap.parseError === null && snap.hasMeasure)
  }

  // 2. A folder at the guard-allow path.
  {
    const root = makeRepo('folder')
    mkdirSync(join(root, 'measure', 'guard-allow'))
    const snap = await loadSnapshot(root)
    check('folder at path: empty list, no throw', snap.allow.folders.length === 0 && snap.allow.ignored.length === 0)
    check('folder at path: parseError null', snap.parseError === null)
  }

  // 3. Unreadable file (chmod 000).
  {
    const root = makeRepo('unreadable')
    const list = join(root, 'measure', 'guard-allow')
    writeFileSync(list, 'scripts/daily-report/work/\n')
    chmodSync(list, 0o000)
    let snap: Awaited<ReturnType<typeof loadSnapshot>>
    try {
      snap = await loadSnapshot(root)
      check('unreadable file: empty list, no throw', snap.allow.folders.length === 0 && snap.parseError === null)
    } catch (e) {
      snap = null as never
      check('unreadable file: no throw', false, String(e))
    }
    chmodSync(list, 0o644)
  }

  // 4. Binary content.
  {
    const root = makeRepo('binary')
    const bytes = Buffer.from([0x00, 0xff, 0xfe, 0x0a, 0x80, 0x81, 0x0a, 0x25, 0x2f, 0x0a]) // ..\n .. \n%/\n
    writeFileSync(join(root, 'measure', 'guard-allow'), bytes)
    const snap = await loadSnapshot(root)
    check('binary file: no throw, parseError null', snap.parseError === null)
    console.log(`info binary file: folders=${JSON.stringify(snap.allow.folders)} ignored=${snap.allow.ignored.length}`)
  }

  // 5. Very large file.
  {
    const root = makeRepo('large')
    const lines: string[] = []
    for (let i = 0; i < 50000; i++) lines.push(`scripts/folder-${i}/`)
    writeFileSync(join(root, 'measure', 'guard-allow'), lines.join('\n'))
    const t0 = Date.now()
    const snap = await loadSnapshot(root)
    const ms = Date.now() - t0
    check('large file: no throw, parseError null', snap.parseError === null && snap.allow.folders.length === 50000)
    console.log(`info large file: 50000 lines parsed in ${ms} ms`)
  }

  // 6. isAllowed gaps: relative path that climbs above the root.
  {
    const root = '/tmp/review-b-fake-root'
    const snap = { root, allow: { folders: ['scripts/daily-report/work'], ignored: [] }, parseError: null } as unknown as Snapshot
    const climb = isAllowed(snap, 'scripts/daily-report/work/../../../../etc/passwd')
    check('relative .. climb above root: denied', climb === false)
    const absClimb = isAllowed(snap, '/tmp/review-b-fake-root/scripts/daily-report/work/../../../../etc/passwd')
    check('absolute .. climb above root: denied', absClimb === false)
  }

  // 7. R-A-1 wrong base: session root deeper than the git root.
  {
    const snap = {
      root: '/repo/sub',
      allow: { folders: ['scripts/daily-report/work'], ignored: [] },
      parseError: null,
    } as unknown as Snapshot
    const same = isAllowed(snap, 'sub/scripts/daily-report/work/x') // git-root relative, wrong base
    check('wrong base: real allowed path denied (deny more)', same === false)
    const escape = isAllowed(snap, '../scripts/daily-report/work/x')
    check('wrong base: escape via ../ resolves under the list (theoretical only)', escape === true)
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
console.log(failures === 0 ? 'review-b-probe: all checks pass' : `review-b-probe: ${failures} failures`)
