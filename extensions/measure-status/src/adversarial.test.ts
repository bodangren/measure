// Task 2.6: adversarial tests of the board data model. Every fixture text is
// invented; no real repo data appears here. The file covers hostile registry
// text, hostile plans, a host that fails with seeded error codes, and hostile
// folder lists. One open defect is marked `test.fails` and routed to Green.
import { describe, expect, test } from 'vitest'
import { buildBoard, classifyTrack, type PlanState, type TrackInput } from './board'
import { MAX_IN_FLIGHT, limiter, loadRepo, type BoardHost, type RepoState } from './load'
import { ownerToken, parsePlan } from './parse'
import { folderOfTarget, parseRegistry, type RegistryEntry } from './registry'
import type { RosterRepo } from './roster'

const repo = (id: string): RosterRepo => ({ id, path: `~/Desktop/${id}` })
const file = (one: RosterRepo, relative: string): string => `${one.path}/measure/${relative}`

const NOW = 1_800_000_000_000

const input = (
  folder: string,
  registryMarker: TrackInput['registryMarker'],
  plan: PlanState,
): TrackInput => ({
  repo: 'invented-hostile',
  title: 'Invented track',
  registryMarker,
  folder,
  plan,
  lastChange: 1_000,
  doneDate: null,
  doneSource: null,
  now: NOW,
})

const readyBoard = (state: RepoState) => {
  if (state.status !== 'ready') throw new Error(`expected a ready repo, got ${state.status}`)
  return state.board
}

type Call = { method: 'readFile' | 'stat' | 'listDir'; path: string }

class FakeHost implements BoardHost {
  readonly calls: Call[] = []
  active = 0
  peak = 0

  constructor(
    private readonly files: Record<string, string>,
    private readonly dirs: Record<string, Array<{ name: string; kind: string }>>,
    private readonly mtimes: Record<string, number> = {},
    private readonly errors: Record<string, string> = {},
  ) {}

  private async run<T>(method: Call['method'], path: string, work: () => T): Promise<T> {
    this.calls.push({ method, path })
    this.active += 1
    this.peak = Math.max(this.peak, this.active)
    try {
      await Promise.resolve()
      const code = this.errors[path]
      if (code !== undefined) throw { code }
      return work()
    } finally {
      this.active -= 1
    }
  }

  readFile(path: string): Promise<{ content: string }> {
    return this.run('readFile', path, () => {
      const content = this.files[path]
      if (content === undefined) throw { code: 'NOT_FOUND' }
      return { content }
    })
  }

  stat(path: string): Promise<{ kind: string; size: number; mtime: number }> {
    return this.run('stat', path, () => {
      const content = this.files[path]
      const mtime = this.mtimes[path]
      if (content === undefined || mtime === undefined) return { kind: 'missing', size: 0, mtime: 0 }
      return { kind: 'file', size: content.length, mtime }
    })
  }

  listDir(path: string): Promise<{ entries: Array<{ name: string; kind: string }> }> {
    return this.run('listDir', path, () => {
      const entries = this.dirs[path]
      if (entries === undefined) throw { code: 'NOT_FOUND' }
      return { entries }
    })
  }

  count(method: Call['method']): number {
    return this.calls.filter(one => one.method === method).length
  }
}

/** A deterministic PRNG, so a failing host repeats its failure codes. */
const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CODES = ['FILE_TOO_LARGE', 'DENIED', 'BAD_PATH', 'NOT_GRANTED', 'EIO', 'NOT_FOUND'] as const

/** Fails a call when a seeded draw says so, with a seeded code. `safe` paths never fail. */
class RandomHost implements BoardHost {
  readonly failures: Array<{ method: Call['method']; path: string; code: string }> = []
  private readonly next: () => number

  constructor(
    seed: number,
    private readonly files: Record<string, string>,
    private readonly dirs: Record<string, Array<{ name: string; kind: string }>>,
    private readonly mtimes: Record<string, number>,
    private readonly failRate: number,
    private readonly safe: ReadonlySet<string>,
  ) {
    this.next = seededRandom(seed)
  }

  private decide(method: Call['method'], path: string): string | null {
    if (this.safe.has(path)) return null
    if (this.next() >= this.failRate) return null
    const code = CODES[Math.floor(this.next() * CODES.length)] ?? 'EIO'
    this.failures.push({ method, path, code })
    return code
  }

  readFile(path: string): Promise<{ content: string }> {
    const code = this.decide('readFile', path)
    if (code !== null) return Promise.reject({ code })
    const content = this.files[path]
    return content === undefined ? Promise.reject({ code: 'NOT_FOUND' }) : Promise.resolve({ content })
  }

  stat(path: string): Promise<{ kind: string; size: number; mtime: number }> {
    const code = this.decide('stat', path)
    if (code !== null) return Promise.reject({ code })
    const content = this.files[path]
    const mtime = this.mtimes[path]
    return content === undefined || mtime === undefined
      ? Promise.resolve({ kind: 'missing', size: 0, mtime: 0 })
      : Promise.resolve({ kind: 'file', size: content.length, mtime })
  }

  listDir(path: string): Promise<{ entries: Array<{ name: string; kind: string }> }> {
    const code = this.decide('listDir', path)
    if (code !== null) return Promise.reject({ code })
    const entries = this.dirs[path]
    return entries === undefined ? Promise.reject({ code: 'NOT_FOUND' }) : Promise.resolve({ entries })
  }
}

/** Every host call rejects with a plain error that carries no code. */
class BrokenHost implements BoardHost {
  readFile(): Promise<{ content: string }> {
    return Promise.reject(new Error('host broke'))
  }

  stat(): Promise<{ kind: string; size: number; mtime: number }> {
    return Promise.reject(new Error('host broke'))
  }

  listDir(): Promise<{ entries: Array<{ name: string; kind: string }> }> {
    return Promise.reject(new Error('host broke'))
  }
}

const entryLine = (i: number): string => `- [ ] **Track: t${i}**`
const linkLine = (i: number): string => `  *Link: [./tracks/t${i}_1/](./tracks/t${i}_1/)*`

describe('hostile registry text', () => {
  test('parses a 100,000-character entry line', () => {
    const md = `- [ ] **Track: ${'y'.repeat(100_000)}**\n`
    const entries = parseRegistry(md)
    expect(entries.length).toBe(1)
    expect(entries[0]).toMatchObject({ marker: ' ', folder: null })
    expect(entries[0]?.title.length).toBe(100_000)
  })

  test('parses a 2 MB registry within a sane time', () => {
    const parts: string[] = ['# Invented registry', '']
    for (let i = 0; i < 100; i += 1) parts.push(`${entryLine(i)}\n${linkLine(i)}\n`)
    parts.push('# Filler')
    let md = parts.join('\n')
    const fillerLine = `\n# ${'z'.repeat(99_000)}`
    while (md.length < 2_000_000) md += fillerLine
    expect(md.length).toBeGreaterThanOrEqual(2_000_000)
    expect(md.length).toBeLessThanOrEqual(2_100_000)

    const start = Date.now()
    const entries = parseRegistry(md)
    const elapsedMs = Date.now() - start
    expect(entries.length).toBe(100)
    expect(entries[99]).toMatchObject({ title: 't99', folder: 'tracks/t99_1' })
    expect(elapsedMs).toBeLessThan(10_000)
  })

  test('reads 10,000 entries in file order and classifies them', () => {
    const parts: string[] = ['# Invented registry', '']
    for (let i = 0; i < 10_000; i += 1) parts.push(`${entryLine(i)}\n${linkLine(i)}\n`)
    const entries = parseRegistry(parts.join('\n'))
    expect(entries.length).toBe(10_000)
    expect(entries[0]).toMatchObject({ title: 't0', marker: ' ' })
    expect(entries[9_999]).toMatchObject({ title: 't9999', folder: 'tracks/t9999_1' })
    entries.forEach((one: RegistryEntry, i: number) => {
      expect(one.folder).toBe(`tracks/t${i}_1`)
    })

    const plan = parsePlan('## Phase 1: Work\n\n- [~] Task: Work\n')
    const inputs = entries.map(one => input(one.folder ?? 'tracks/none_1', ' ', { kind: 'plan', plan }))
    const board = buildBoard('invented-volume', inputs)
    expect(board.cards.filter(card => card.column === 'in-progress').length).toBe(10_000)
  })

  // Boundary, pinned with the guard in mind: the entry grammar reads a
  // column-0 line that ends at the line end. A CR before the line end breaks
  // the marker match, so a CRLF registry yields no entry. The guard grammar
  // (mods/measure-guard/hooks/parse.ts, the same `$`-anchored patterns over
  // `\n`-split lines) behaves in the same way, so the board agrees with the
  // guard on what is open. To support CRLF later, change this test with the fix.
  test('gives no entry for a CRLF registry', () => {
    const crlf = [
      '- [~] **Track: Crlf one**',
      '  *Link: [./tracks/crlf_1/](./tracks/crlf_1/)*',
      '- [x] **Track: Crlf two**',
      '  *Link: [./archive/crlf_2/](./archive/crlf_2/)*',
      '',
    ].join('\r\n')
    expect(parseRegistry(crlf)).toEqual([])
  })

  test('loads a CRLF registry as a ready board with no card and no error', async () => {
    const one = repo('invented-crlf')
    const crlf = [
      '- [~] **Track: Crlf one**',
      '  *Link: [./tracks/crlf_1/](./tracks/crlf_1/)*',
      '- [x] **Track: Crlf two**',
      '  *Link: [./archive/crlf_2/](./archive/crlf_2/)*',
      '',
    ].join('\r\n')
    const files: Record<string, string> = { [file(one, 'tracks.md')]: crlf }
    const dirs: Record<string, Array<{ name: string; kind: string }>> = {
      [file(one, 'tracks')]: [],
      [file(one, 'archive')]: [],
    }
    const board = readyBoard(await loadRepo(new FakeHost(files, dirs), one, limiter(MAX_IN_FLIGHT)))
    expect(board.cards.length).toBe(0)
  })

  // Boundary, pinned: a BOM sits before the first character, so only the first
  // entry line loses its column-0 match. The guard behaves in the same way.
  test('drops only the first entry of a BOM registry', () => {
    const md = '\uFEFF- [x] **Track: Bom first**\n- [ ] **Track: Bom second**\n'
    const entries = parseRegistry(md)
    expect(entries.length).toBe(1)
    expect(entries[0]).toMatchObject({ title: 'Bom second', marker: ' ' })
  })

  test('takes the raw line as the title of a nested-bracket link', () => {
    const entries = parseRegistry('- [~] [outer [inner]](./tracks/x_1/)\n')
    expect(entries.length).toBe(1)
    expect(entries[0]).toMatchObject({
      title: '[outer [inner]](./tracks/x_1/)',
      marker: '~',
      folder: null,
    })
  })

  test('gives no folder for a nested-bracket Link line', () => {
    const md = '- [~] **Track: Nested**\n*Link: [a [b]](./tracks/nested_1/)*\n'
    const entries = parseRegistry(md)
    expect(entries[0]).toMatchObject({ title: 'Nested', folder: null })
  })

  test('keeps brackets inside a bold title', () => {
    const entries = parseRegistry('- [~] **Track: Alpha [x]**\n')
    expect(entries[0]?.title).toBe('Alpha [x]')
  })

  test('gives no folder for a target that climbs above measure/', () => {
    for (const target of [
      '../../..',
      '../../../etc/passwd',
      '../../tracks/x_1',
      'tracks/../../x_1',
      'tracks/x_1/..',
    ]) {
      expect(folderOfTarget(target)).toBeNull()
    }
    const md = '- [x] **Track: Climb**\n  *Link: [x](../../../)*\n'
    expect(parseRegistry(md)[0]?.folder).toBeNull()
  })

  test('gives no folder for an absolute link target', () => {
    for (const target of [
      '/home/daniebo/Desktop/measure/tracks/x_1',
      '~/Desktop/measure/tracks/x_1',
    ]) {
      expect(folderOfTarget(target)).toBeNull()
    }
    const md = '- [x] **Track: Abs**\n  *Link: [x](/home/daniebo/Desktop/measure/tracks/x_1/)*\n'
    expect(parseRegistry(md)[0]?.folder).toBeNull()
  })
})

describe('hostile plans', () => {
  test('gives an R2 card for a plan with no phase heading', () => {
    const plan = parsePlan('# Invented plan\n\n- [ ] Task: One\n- [~] Task: Two\n')
    expect(plan.phases).toEqual([])
    const planned = classifyTrack(input('tracks/phaseless_1', ' ', { kind: 'plan', plan }))
    expect(planned).toMatchObject({ column: 'planned', position: null, note: 'No plan.' })
    const working = classifyTrack(input('tracks/phaseless_1', '~', { kind: 'plan', plan }))
    expect(working).toMatchObject({ column: 'in-progress', note: 'No plan.' })
    const blocked = classifyTrack(input('tracks/phaseless_1', 'b', { kind: 'plan', plan }))
    expect(blocked).toMatchObject({ column: 'blocked', line: 'Registry marker [b].' })
  })

  test('keeps a [b] line with deferred: and no owner text open and blocked', () => {
    expect(ownerToken('Task: wait deferred:')).toBeNull()
    const plan = parsePlan('## Phase 1: Work\n\n- [b] Task: wait deferred:\n- [ ] Task: Next\n')
    const card = classifyTrack(input('tracks/wait_1', ' ', { kind: 'plan', plan }))
    expect(card).toMatchObject({
      column: 'blocked',
      line: 'Task: wait deferred:',
      position: { phase: 1, phases: 1, task: 2, tasks: 2 },
      marker: ' ',
      taskText: 'Task: Next',
    })
  })

  // DEFECT, routed to Green. FR-4: the note `All tasks closed.` is for a
  // plan with no open task. The plan below holds one open task: a `[b]` line
  // with `deferred:` and no owner text. That task is open for the guard and
  // for the board, so the note must not claim that all tasks are closed.
  // board.ts `noteOf` counts open tasks only before the last done task, so a
  // plan with no done task yields `All tasks closed.` on a Blocked card.
  // While the defect is open this test stays marked `fails`. On the Green
  // fix, turn it into a normal test and pin the exact note of FR-4.
  test.fails('gives no All tasks closed. note while a [b] task stays open', () => {
    const plan = parsePlan('## Phase 1: Work\n\n- [b] Task: wait deferred:\n')
    const card = classifyTrack(input('tracks/wait_1', ' ', { kind: 'plan', plan }))
    expect(card.column).toBe('blocked')
    expect(card.line).toBe('Task: wait deferred:')
    expect(card.note === 'All tasks closed.').toBe(false)
  })

  test('ignores a capital X task marker in a plan', () => {
    const plan = parsePlan('## Phase 1: Work\n\n- [X] Task: Odd\n- [ ] Task: Two\n')
    expect(plan.phases[0]?.tasks.length).toBe(1)
    const card = classifyTrack(input('tracks/capx_1', ' ', { kind: 'plan', plan }))
    expect(card).toMatchObject({
      column: 'planned',
      marker: ' ',
      taskText: 'Task: Two',
      position: { phase: 1, phases: 1, task: 1, tasks: 1 },
    })
  })

  test('ignores a capital X registry line and keeps the scan range open', () => {
    const md = [
      '- [ ] **Track: A**',
      '- [X] **Track: B**',
      '  *Link: [./tracks/a_1/](./tracks/a_1/)*',
      '',
    ].join('\n')
    const entries = parseRegistry(md)
    expect(entries.length).toBe(1)
    expect(entries[0]).toMatchObject({ title: 'A', marker: ' ', folder: 'tracks/a_1' })
  })
})

describe('a host that fails with seeded error codes', () => {
  const SEED = 20_261_118

  test('fails the registry read with the seeded code', async () => {
    const one = repo('invented-seedy')
    const files: Record<string, string> = { [file(one, 'tracks.md')]: '# Invented\n' }
    const dirs: Record<string, Array<{ name: string; kind: string }>> = {
      [file(one, 'tracks')]: [],
      [file(one, 'archive')]: [],
    }
    // Replay the PRNG: at fail rate 1 the first draw fails the registry read
    // and the second draw picks the code of that first failure.
    const replay = seededRandom(SEED)
    replay()
    const expectedCode = CODES[Math.floor(replay() * CODES.length)] ?? 'EIO'
    const host = new RandomHost(SEED, files, dirs, {}, 1, new Set())
    const state = await loadRepo(host, one, limiter(MAX_IN_FLIGHT))
    expect(state).toMatchObject({
      status: 'error',
      code: expectedCode,
      line: `Cannot read invented-seedy: ${expectedCode}.`,
    })
  })

  test('maps random plan-read failures to R2 cards and stays deterministic', async () => {
    const one = repo('invented-flaky')
    const registry = [
      '- [ ] **Track: Rand one**',
      '  *Link: [./tracks/rand_1/](./tracks/rand_1/)*',
      '- [~] **Track: Rand two**',
      '  *Link: [./tracks/rand_2/](./tracks/rand_2/)*',
      '- [b] **Track: Rand three**',
      '  *Link: [./tracks/rand_3/](./tracks/rand_3/)*',
      '- [ ] **Track: Rand four**',
      '  *Link: [./tracks/rand_4/](./tracks/rand_4/)*',
      '',
    ].join('\n')
    const files: Record<string, string> = { [file(one, 'tracks.md')]: registry }
    for (let i = 1; i <= 4; i += 1) {
      files[file(one, `tracks/rand_${i}/plan.md`)] = '## Phase 1: Work\n\n- [~] Task: Work\n'
    }
    const dirs: Record<string, Array<{ name: string; kind: string }>> = {
      [file(one, 'tracks')]: [1, 2, 3, 4].map(i => ({ name: `rand_${i}`, kind: 'directory' })),
      [file(one, 'archive')]: [],
    }
    const mtimes: Record<string, number> = {}
    for (let i = 1; i <= 4; i += 1) mtimes[file(one, `tracks/rand_${i}/plan.md`)] = 1_000
    const safe = new Set([file(one, 'tracks.md'), file(one, 'tracks'), file(one, 'archive')])

    const runOnce = async (): Promise<{
      state: RepoState
      failures: Array<{ method: Call['method']; path: string; code: string }>
    }> => {
      const host = new RandomHost(SEED + 1, files, dirs, mtimes, 0.5, safe)
      const state = await loadRepo(host, one, limiter(MAX_IN_FLIGHT))
      return { state, failures: host.failures }
    }
    const first = await runOnce()
    const second = await runOnce()
    expect(second.failures).toEqual(first.failures)
    expect(second.state).toEqual(first.state)

    const board = readyBoard(first.state)
    expect(board.cards.length).toBe(4)
    const planFailures = new Map(
      first.failures
        .filter(oneFailure => oneFailure.method === 'readFile' && oneFailure.path.endsWith('plan.md'))
        .map(oneFailure => [oneFailure.path, oneFailure.code] as const),
    )
    for (const card of board.cards) {
      const code = planFailures.get(file(one, `tracks/${card.trackId}/plan.md`))
      if (code === undefined) {
        expect(card.position).not.toBeNull()
      } else if (code === 'NOT_FOUND') {
        expect(card.note).toBe('No plan.')
      } else {
        expect(card.note).toBe('Plan unreadable')
      }
    }
    // The seed must cover all three outcomes: a failed read with NOT_FOUND, a
    // failed read with another code, and a read that succeeds.
    expect(planFailures.size).toBeGreaterThan(0)
    expect(planFailures.size).toBeLessThan(4)
    expect(new Set(planFailures.values()).has('NOT_FOUND')).toBe(true)
    expect(new Set(planFailures.values()).size).toBeGreaterThanOrEqual(2)
  })

  test('reads UNKNOWN from a thrown value with no code', async () => {
    const state = await loadRepo(new BrokenHost(), repo('invented-broken'), limiter(MAX_IN_FLIGHT))
    expect(state).toMatchObject({
      status: 'error',
      code: 'UNKNOWN',
      line: 'Cannot read invented-broken: UNKNOWN.',
    })
  })
})

describe('hostile folder lists', () => {
  test('loads a 2,000-entry folder list at the host limit', async () => {
    const one = repo('invented-wide')
    const registry = [
      '- [ ] **Track: Named one**',
      '  *Link: [./tracks/named_1/](./tracks/named_1/)*',
      '- [~] **Track: Named two**',
      '  *Link: [./tracks/named_2/](./tracks/named_2/)*',
      '',
    ].join('\n')
    const files: Record<string, string> = {
      [file(one, 'tracks.md')]: registry,
      [file(one, 'tracks/named_1/plan.md')]: '## Phase 1: Work\n\n- [ ] Task: One\n',
      [file(one, 'tracks/named_2/plan.md')]: '## Phase 1: Work\n\n- [~] Task: Two\n',
      [file(one, 'tracks/f_0000/plan.md')]: '## Phase 1: Work\n\n- [ ] Task: A\n',
      [file(one, 'tracks/f_1987/plan.md')]: '## Phase 1: Work\n\n- [~] Task: B\n',
    }
    // 2 named folders + 1,988 folders that no entry names + 10 entries of
    // kind other = 2,000 entries, the host limit of listDir.
    const tracks: Array<{ name: string; kind: string }> = [
      { name: 'named_1', kind: 'directory' },
      { name: 'named_2', kind: 'directory' },
    ]
    for (let i = 0; i < 1_988; i += 1) {
      const name = `f_${String(i).padStart(4, '0')}`
      tracks.push({ name, kind: 'directory' })
    }
    for (let i = 0; i < 10; i += 1) {
      tracks.push({ name: `other_${String(i).padStart(2, '0')}`, kind: 'other' })
    }
    expect(tracks.length).toBe(2_000)
    const dirs: Record<string, Array<{ name: string; kind: string }>> = {
      [file(one, 'tracks')]: tracks,
      [file(one, 'archive')]: [],
    }
    const mtimes: Record<string, number> = {}
    for (const folder of ['named_1', 'named_2', 'f_0000', 'f_1987']) {
      mtimes[file(one, `tracks/${folder}/plan.md`)] = 1_000
    }
    const host = new FakeHost(files, dirs, mtimes)
    const board = readyBoard(await loadRepo(host, one, limiter(MAX_IN_FLIGHT)))

    expect(board.cards.map(card => card.title)).toEqual(['Named one', 'Named two', 'f_0000', 'f_1987'])
    expect(board.cards.map(card => card.column)).toEqual(['planned', 'in-progress', 'planned', 'in-progress'])
    expect(board.cards.map(card => card.registered)).toEqual([true, true, false, false])
    expect(host.count('readFile')).toBe(1_991)
    expect(host.count('stat')).toBe(8)
    expect(host.count('listDir')).toBe(2)
    expect(host.calls.length).toBe(2_001)
    expect(host.calls.filter(call => call.path.includes('other_')).length).toBe(0)
    expect(host.peak).toBeLessThanOrEqual(MAX_IN_FLIGHT)
  })

  test('keeps a folder name that holds HTML as literal model text', async () => {
    const one = repo('invented-markup')
    const imgName = '<img src=x onerror=alert(1)>'
    const scriptName = '"><script>'
    const files: Record<string, string> = {
      [file(one, 'tracks.md')]: '# Invented registry\n',
      [file(one, `tracks/${imgName}/plan.md`)]: '## Phase 1: Work\n\n- [ ] Task: One\n',
    }
    const dirs: Record<string, Array<{ name: string; kind: string }>> = {
      [file(one, 'tracks')]: [
        { name: imgName, kind: 'directory' },
        { name: scriptName, kind: 'other' },
      ],
      [file(one, 'archive')]: [{ name: '"><b>_20260101', kind: 'directory' }],
    }
    const mtimes: Record<string, number> = { [file(one, `tracks/${imgName}/plan.md`)]: 1_000 }
    const host = new FakeHost(files, dirs, mtimes)
    const board = readyBoard(await loadRepo(host, one, limiter(MAX_IN_FLIGHT)))

    expect(board.cards.length).toBe(2)
    expect(board.cards[0]).toMatchObject({
      title: imgName,
      trackId: imgName,
      column: 'planned',
      registered: false,
      taskText: 'Task: One',
    })
    // The model escapes nothing. The renderer of Phase 3 owns the escape.
    expect(board.cards[0]?.title).toBe(imgName)
    expect(board.cards[1]).toMatchObject({
      title: '"><b>_20260101',
      column: 'done',
      doneDate: '2026-01-01',
      doneSource: 'folder',
      archived: true,
    })
    expect(host.calls.filter(call => call.path.includes(scriptName)).length).toBe(0)
  })
})
