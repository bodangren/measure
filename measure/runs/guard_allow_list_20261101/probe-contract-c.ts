// Review C probe: the allow list contract of Phase 1.
// Reads the "advantage-pr list" text of spec.md, parses it with the plugin core,
// prints the status lines, and checks the documented entry reasons.
import { readFileSync } from 'node:fs'
import { parseAllowList, statusLines } from '/home/daniebo/Desktop/measure/plugins/opencode-measure-guard/src/core/parse'
import { isAllowed } from '/home/daniebo/Desktop/measure/plugins/opencode-measure-guard/src/core/guards'
import type { Snapshot } from '/home/daniebo/Desktop/measure/plugins/opencode-measure-guard/src/types'

const specPath = '/home/daniebo/Desktop/measure/measure/tracks/guard_allow_list_20261101/spec.md'
const spec = readFileSync(specPath, 'utf8')
const at = spec.indexOf('## advantage-pr list')
const fenceStart = spec.indexOf('```text', at)
const textStart = spec.indexOf('\n', fenceStart) + 1
const fenceEnd = spec.indexOf('```', textStart)
const listText = spec.slice(textStart, fenceEnd)

const allow = parseAllowList(listText)
const expectedFolders = ['scripts/daily-report/work', 'scripts/daily-reel/work', 'assets/videos', '.drafts']
const foldersOk = JSON.stringify(allow.folders) === JSON.stringify(expectedFolders)
const ignoredOk = allow.ignored.length === 0
console.log('SPEC_LIST folders=' + JSON.stringify(allow.folders))
console.log('SPEC_LIST ignored=' + JSON.stringify(allow.ignored))
console.log('SPEC_LIST folders_ok=' + foldersOk + ' ignored_ok=' + ignoredOk)

const snapshot: Snapshot = {
  root: '/tmp/probe-root',
  hasMeasure: true,
  isRepo: true,
  tracksPath: '/tmp/probe-root/measure/tracks.md',
  tracks: [],
  active: null,
  inProgressCount: 0,
  parseError: null,
  allow,
}
const lines = statusLines(snapshot, null)
const guardsAt = lines.indexOf('Guards: on')
console.log('STATUS_LINE=' + JSON.stringify(lines[guardsAt - 1]))
console.log('STATUS_BEFORE_GUARDS=' + (guardsAt - 1 === lines.length - 2))

const cases: Array<[string, boolean]> = [
  ['scripts/daily-report/work/x.md', true],
  ['scripts/daily-reel/work/x.json', true],
  ['assets/videos/fb-caption-2026-11-02.txt', true],
  ['.drafts/x.md', true],
  ['src/x.md', false],
  ['scripts/daily-report/send.py', false],
]
for (const [path, want] of cases) {
  const got = isAllowed(snapshot, path)
  console.log('ALLOWED ' + (got === want ? 'ok' : 'MISMATCH') + ' ' + path + ' want=' + want + ' got=' + got)
}

const reasonText = [
  '/etc/',
  '/',
  'scripts/../src/',
  '..',
  'src/*/',
  'src/?/',
  'src/[ab]/',
  'src/{a,b}/',
  'scripts/daily-report/work',
  './',
].join('\n')
console.log('REASONS=' + JSON.stringify(parseAllowList(reasonText).ignored.map(one => [one.line, one.text, one.reason])))
