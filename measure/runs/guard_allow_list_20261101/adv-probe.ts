import { parseAllowList, joinPath } from '../../../plugins/opencode-measure-guard/src/core/parse'
import { isAllowed } from '../../../plugins/opencode-measure-guard/src/core/guards'
import type { Snapshot } from '../../../plugins/opencode-measure-guard/src/types'

const root = '/tmp/probe-root'
const snap = (folders: string[]): Snapshot => ({
  root,
  hasMeasure: true,
  isRepo: true,
  tracksPath: null,
  tracks: [],
  active: null,
  inProgressCount: 0,
  parseError: null,
  allow: { folders, ignored: [] },
})

const show = (label: string, value: unknown) => console.log(label, JSON.stringify(value))

show('BOM', parseAllowList('\uFEFFwork/'))
show('BOM+comment', parseAllowList('\uFEFF# c\nwork/'))
show('CR only \r', parseAllowList('work/\rassets/\r'))
show('CR mid', parseAllowList('work/\rassets/'))
show('NUL', parseAllowList('work\u0000x/'))
show('entry-slash', parseAllowList('/\n//\n.\n./\n./.\nmeasure/\n'))
show('unicode', parseAllowList('work\u2215old/\n\uff57ork/\n'))
show('10000 char', parseAllowList('a'.repeat(9999) + '/'))
const big = Array.from({ length: 10000 }, (_, i) => (i === 9999 ? 'src/*' : i % 2 === 0 ? '# c' : 'work/')).join('\n')
const bigList = parseAllowList(big)
show('10000 lines', { folders: bigList.folders, ignored: bigList.ignored.length, last: bigList.ignored[bigList.ignored.length - 1] })

const s = snap(['scripts/daily-report/work'])
const paths = [
  joinPath(root, 'scripts/daily-report/work/a.md'),
  joinPath(root, 'scripts/daily-report/work/.'),
  joinPath(root, 'scripts/daily-report/work/'),
  joinPath(root, 'scripts/daily-report/work//a.md'),
  joinPath(root, 'scripts/daily-report/work/'),
  joinPath(root, 'scripts/daily-report/workx/'),
  joinPath(root, 'scripts/daily-report/work\u2215a.md'),
  joinPath(root, 'scripts/daily-report/\uff57ork/a.md'),
  joinPath(root, 'scripts/daily-report/Work/a.md'),
  joinPath(root, 'scripts/daily-report/work/../../src/a.ts'),
  joinPath(root, '../src/a.ts'),
  joinPath(root, 'scripts/daily-report/work\u0000x/a.md'),
]
for (const p of paths) show('isAllowed ' + JSON.stringify(p), isAllowed(s, p))
show('isAllowed relative NUL', isAllowed(s, 'scripts/daily-report/work\u0000x/a.md'))
show('isAllowed trailing slash relative', isAllowed(s, 'scripts/daily-report/work/'))
show('isAllowed folder', isAllowed(s, root + '/scripts/daily-report/work'))
show('isAllowed root', isAllowed(snap(['']), root))
show('measure entry', isAllowed(snap(['measure']), root + '/measure/x'))
show('measurex', isAllowed(snap(['measure']), root + '/measurex/y'))
