// Review A probes for guard_allow_list_20261101, Phase 1. Read-only on the
// repository; every fixture lives under a temp folder.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseAllowList } from '../../../plugins/opencode-measure-guard/src/core/parse'
import { isAllowed } from '../../../plugins/opencode-measure-guard/src/core/guards'
import { loadSnapshot } from '../../../plugins/opencode-measure-guard/src/snapshot'
import type { Snapshot } from '../../../plugins/opencode-measure-guard/src/types'

const temp = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'review-a-'))
  execFileSync('git', ['init', '-q', root])
  return root
}

const measure = (root: string, tracks: string, plan: string | null): void => {
  mkdirSync(join(root, 'measure'), { recursive: true })
  writeFileSync(join(root, 'measure/index.md'), '# Project Index\n\n* Tracks Registry: [./tracks.md](./tracks.md)\n')
  writeFileSync(join(root, 'measure/tracks.md'), tracks)
  if (plan !== null) {
    mkdirSync(join(root, 'measure/tracks/t1'), { recursive: true })
    writeFileSync(join(root, 'measure/tracks/t1/plan.md'), plan)
  }
}

const TRACKS = '# Project Tracks\n\n- [~] **Track: One**\n  *Link: [./tracks/t1/](./tracks/t1/)*\n'

const out: string[] = []
const say = (line: string): void => {
  out.push(line)
}

// R1: the `no plan.md` return keeps allow.
{
  const root = temp()
  measure(root, TRACKS, null)
  writeFileSync(join(root, 'measure/guard-allow'), 'scripts/daily-report/work/\n')
  const snapshot = await loadSnapshot(root)
  say(`R1 no_plan_parse_error=${snapshot.parseError !== null}`)
  say(`R1 no_plan_folders=${JSON.stringify(snapshot.allow.folders)}`)
}

// R2: the `no ## Phase heading` return keeps allow.
{
  const root = temp()
  measure(root, TRACKS, '# Plan\n\n- [~] Task 1.1: Do a thing\n')
  writeFileSync(join(root, 'measure/guard-allow'), 'scripts/daily-report/work/\n')
  const snapshot = await loadSnapshot(root)
  say(`R2 no_phase_parse_error=${snapshot.parseError !== null}`)
  say(`R2 no_phase_folders=${JSON.stringify(snapshot.allow.folders)}`)
}

// R3: the success return keeps allow.
{
  const root = temp()
  measure(root, TRACKS, '# Plan\n\n## Phase 1: One\n\n- [~] Task 1.1: Do a thing\n')
  writeFileSync(join(root, 'measure/guard-allow'), 'scripts/daily-report/work/\n')
  const snapshot = await loadSnapshot(root)
  say(`R3 active=${snapshot.active !== null}`)
  say(`R3 folders=${JSON.stringify(snapshot.allow.folders)}`)
}

// R4: no measure/ gives the empty list.
{
  const root = temp()
  const snapshot = await loadSnapshot(root)
  say(`R4 no_measure=${JSON.stringify(snapshot.allow)}`)
}

// R5: parser edge inputs. Every line must be kept or ignored with a reason,
// and the call must not throw.
{
  const rows = ['//', '///a/', 'a/./b/', 'a/b/../', 'a\\b/', 'a b/', 'a/ /', '\u0000/', '\uFEFFb/']
  for (const row of rows) {
    const list = parseAllowList(`${row}\n`)
    say(`R5 entry=${JSON.stringify(row)} kept=${JSON.stringify(list.folders)} ignored=${JSON.stringify(list.ignored)}`)
  }
}

// R6: isAllowed edge paths.
{
  const root = temp()
  const snapshot: Snapshot = {
    root,
    hasMeasure: true,
    isRepo: true,
    tracksPath: null,
    tracks: [],
    active: null,
    inProgressCount: 0,
    parseError: null,
    allow: { folders: ['scripts/daily-report/work', '/'], ignored: [] },
  }
  const cases = [
    join(root, 'scripts/daily-report/work//a.md'),
    join(root, 'scripts/daily-report/./work/a.md'),
    join(root, 'scripts/daily-report/work'),
    `${root}/scripts/daily-report/work/`,
    join(root, 'scripts/daily-report/work/../../outside.ts'),
    'scripts/daily-report/work/../collect.py',
    '/etc/passwd',
  ]
  for (const path of cases) say(`R6 path=${JSON.stringify(path)} allowed=${isAllowed(snapshot, path)}`)
}

// R7: the same snapshot without the `/` folder: only the real folder.
{
  const root = temp()
  const snapshot: Snapshot = {
    root,
    hasMeasure: true,
    isRepo: true,
    tracksPath: null,
    tracks: [],
    active: null,
    inProgressCount: 0,
    parseError: null,
    allow: { folders: ['scripts/daily-report/work'], ignored: [] },
  }
  say(`R7 src_allowed=${isAllowed(snapshot, join(root, 'src/x.ts'))}`)
  say(`R7 sibling_root=${isAllowed(snapshot, `${root}2/scripts/daily-report/work/a.md`)}`)
}

// R8: an entry of 10000 characters and a 5000-line file do not throw.
{
  const long = parseAllowList(`${'a'.repeat(10000)}/\n`)
  const many = parseAllowList(`${Array.from({ length: 5000 }, (_, i) => `d${i}/`).join('\n')}\n`)
  say(`R8 long_kept=${long.folders.length} long_ignored=${long.ignored.length}`)
  say(`R8 many_kept=${many.folders.length} many_ignored=${many.ignored.length}`)
}

rmSync(join(tmpdir(), 'review-a-placeholder'), { force: true })
console.log(out.join('\n'))
