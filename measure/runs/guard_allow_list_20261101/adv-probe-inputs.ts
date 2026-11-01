// Input probes of the adversarial scope, on the real parser and guard.
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseAllowList, joinPath } from '../../../plugins/opencode-measure-guard/src/core/parse'
import { isAllowed } from '../../../plugins/opencode-measure-guard/src/core/guards'
import { loadSnapshot } from '../../../plugins/opencode-measure-guard/src/snapshot'
import type { Snapshot } from '../../../plugins/opencode-measure-guard/src/types'
import { fixturePlan, makeGuard, tempProject, withMeasure } from '../../../plugins/opencode-measure-guard/tests/fake'
import type { ToolBeforeEvent } from '../../../plugins/opencode-measure-guard/src/hooks/types'

const show = (label: string, value: unknown): void => console.log(label, JSON.stringify(value))
const snap = (root: string, folders: string[]): Snapshot => ({
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

show('P1 /*/', parseAllowList('/*/'))
show('P2 ///a/', parseAllowList('///a/'))
show('P3 a/./b/', parseAllowList('a/./b/'))
show('P4 a/b/../', parseAllowList('a/b/../'))
show('P5 backslash', parseAllowList('\\'))
show('P6 a\\b/', parseAllowList('a\\b/'))
show('P7 a b/', parseAllowList('a b/'))
show('P8 a/ /', parseAllowList('a/ /'))

const many = Array.from({ length: 50000 }, (_, i) => `d${i}/`).join('\n')
const started = Date.now()
const big = parseAllowList(many)
show('P9 50000 lines', { folders: big.folders.length, ignored: big.ignored.length, ms: Date.now() - started })

const root = await tempProject()
mkdirSync(join(root, 'src'), { recursive: true })
writeFileSync(join(root, 'src/a.md'), 'x')
mkdirSync(join(root, 'work'), { recursive: true })
symlinkSync(join(root, 'src'), join(root, 'work/link'))

const listRoot = await withMeasure(await tempProject(), { plan: fixturePlan().replace('- [~] Task', '- [ ] Task') })
writeFileSync(join(listRoot, 'measure/guard-allow'), 'work/\nmeasure/\n')
mkdirSync(join(listRoot, 'work'), { recursive: true })
mkdirSync(join(listRoot, 'src'), { recursive: true })
symlinkSync(join(listRoot, 'src'), join(listRoot, 'work/link'))

let id = 0
const write = (path: string): ToolBeforeEvent => ({
  tool: 'write',
  sessionID: 'ses_1',
  agent: 'build',
  messageID: 'msg_1',
  id: `call_${++id}`,
  input: { path, content: 'x' },
})
const outcome = async (path: string): Promise<string> => {
  try {
    await makeGuard(listRoot).onToolBefore(write(path))
    return 'allowed'
  } catch (error) {
    return `denied: ${error instanceof Error ? error.message.slice(0, 60) : String(error)}`
  }
}

show('P10 symlink in allowed folder -> src', await outcome(join(listRoot, 'work/link/escape.md')))
show('P11 write to measure/guard-allow', await outcome(join(listRoot, 'measure/guard-allow')))
show('P12 relative-ish double slash path', isAllowed(await loadSnapshot(listRoot), 'work//a.md'))
show('P13 joinPath .. above root', joinPath(root, '../../../../etc/passwd'))
show('P14 isAllowed of .. above root', isAllowed(snap(root, ['work']), joinPath(root, '../../../../etc/passwd')))
