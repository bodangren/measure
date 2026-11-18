// FR-10: the loader over readFile, stat, and listDir. The fake host counts
// every call. All fixture text is invented.
import { describe, expect, test } from 'vitest'
import {
  MAX_IN_FLIGHT,
  RELOAD_MS,
  errorCode,
  errorLine,
  limiter,
  loadRepo,
  loadRoster,
  shouldReload,
  type BoardHost,
  type RepoState,
} from './load'
import type { RosterRepo } from './roster'
import { doneSummary } from './board'

type Call = { method: 'readFile' | 'stat' | 'listDir'; path: string }
type Errors = Record<string, string>

const repo = (id: string): RosterRepo => ({ id, path: `~/Desktop/${id}` })
const file = (one: RosterRepo, relative: string): string => `${one.path}/measure/${relative}`

class FakeHost implements BoardHost {
  readonly calls: Call[] = []
  active = 0
  peak = 0

  constructor(
    private readonly files: Record<string, string>,
    private readonly dirs: Record<string, Array<{ name: string; kind: string }>>,
    private readonly mtimes: Record<string, number> = {},
    private readonly errors: Errors = {},
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

const REGISTRY = [
  '- [~] **Track: Alpha**',
  '  *Link: [./tracks/alpha_1/](./tracks/alpha_1/)*',
  '- [x] **Track: Beta**',
  '  *Link: [./archive/beta_2/](./archive/beta_2/)*',
  '',
].join('\n')

const ALPHA_PLAN = '## Phase 1: Work\n\n- [x] Task: One\n- [~] Task: Two\n'
const GAMMA_PLAN = '## Phase 1: Work\n\n- [ ] Task: One\n'

const setup = () => {
  const alpha = repo('invented-alpha')
  const files: Record<string, string> = {
    [file(alpha, 'tracks.md')]: REGISTRY,
    [file(alpha, 'tracks/alpha_1/plan.md')]: ALPHA_PLAN,
    [file(alpha, 'tracks/alpha_1/metadata.json')]: '{"status":"in-progress"}',
    [file(alpha, 'tracks/gamma_3/plan.md')]: GAMMA_PLAN,
  }
  const dirs: Record<string, Array<{ name: string; kind: string }>> = {
    [file(alpha, 'tracks')]: [
      { name: 'alpha_1', kind: 'directory' },
      { name: 'gamma_3', kind: 'directory' },
    ],
    [file(alpha, 'archive')]: [
      { name: 'beta_2', kind: 'directory' },
      { name: 'delta_4', kind: 'directory' },
    ],
  }
  const mtimes: Record<string, number> = {
    [file(alpha, 'tracks/alpha_1/plan.md')]: 1_000,
    [file(alpha, 'tracks/alpha_1/metadata.json')]: 3_000,
    [file(alpha, 'tracks/gamma_3/plan.md')]: 2_000,
  }
  return { alpha, files, dirs, mtimes }
}

const readyBoard = (state: RepoState) => {
  if (state.status !== 'ready') throw new Error(`expected a ready repo, got ${state.status}`)
  return state.board
}

describe('the loader contract', () => {
  test('holds the in-flight limit and the reload period of FR-10', () => {
    expect(MAX_IN_FLIGHT).toBe(8)
    expect(RELOAD_MS).toBe(60_000)
  })

  test('reloads only when the page is visible and no load runs', () => {
    expect(shouldReload(true, false)).toBe(true)
    expect(shouldReload(false, false)).toBe(false)
    expect(shouldReload(true, true)).toBe(false)
    expect(shouldReload(false, true)).toBe(false)
  })

  test('reads the code of a failure and gives UNKNOWN without one', () => {
    expect(errorCode({ code: 'DENIED' })).toBe('DENIED')
    expect(errorCode(new Error('plain'))).toBe('UNKNOWN')
    expect(errorCode(null)).toBe('UNKNOWN')
  })

  test('gives the section line of a failed registry read', () => {
    const one = repo('invented-alpha')
    expect(errorLine(one, 'NOT_FOUND')).toBe(`No Measure tracks file at ${file(one, 'tracks.md')}.`)
    expect(errorLine(one, 'DENIED')).toBe('Cannot read invented-alpha: DENIED.')
    expect(errorLine(one, 'NOT_GRANTED')).toBe('Cannot read invented-alpha: NOT_GRANTED.')
  })
})

describe('limiter', () => {
  test('runs at most the given number of jobs at one time', async () => {
    const run = limiter(2)
    let active = 0
    let peak = 0
    const job = async (value: number) => {
      active += 1
      peak = Math.max(peak, active)
      await Promise.resolve()
      await Promise.resolve()
      active -= 1
      return value
    }
    const out = await Promise.all([1, 2, 3, 4].map(value => run(() => job(value))))
    expect(out).toEqual([1, 2, 3, 4])
    expect(peak).toBe(2)
  })
})

describe('loadRepo', () => {
  test('reads the registry, the two folders, and the plan of each open track', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    const host = new FakeHost(files, dirs, mtimes)
    const board = readyBoard(await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT)))

    expect(board.repo).toBe('invented-alpha')
    expect(board.cards.map(one => one.title)).toEqual(['Alpha', 'Beta', 'gamma_3', 'delta_4'])
    expect(board.cards.map(one => one.column)).toEqual(['in-progress', 'done', 'planned', 'done'])
    expect(host.count('readFile')).toBe(3)
    expect(host.count('listDir')).toBe(2)
    expect(host.count('stat')).toBe(8)
    expect(host.calls.length).toBe(13)
  })

  test('lists only the tracks and archive folders', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    const host = new FakeHost(files, dirs, mtimes)
    await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT))
    const listed = host.calls.filter(one => one.method === 'listDir').map(one => one.path)
    expect(listed).toEqual([file(alpha, 'tracks'), file(alpha, 'archive')])
  })

  test('makes two stat calls and no read call for a Done track', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    const host = new FakeHost(files, dirs, mtimes)
    await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT))
    const reads = host.calls.filter(one => one.method === 'readFile').map(one => one.path)
    expect(reads.some(path => path.includes('beta_2'))).toBe(false)
    expect(reads.some(path => path.includes('delta_4'))).toBe(false)
    const stats = host.calls.filter(one => one.method === 'stat' && one.path.includes('beta_2')).map(one => one.path)
    expect(stats).toEqual([file(alpha, 'archive/beta_2/plan.md'), file(alpha, 'archive/beta_2/metadata.json')])
  })

  test('takes the last change from the two files and never from a missing stat', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    const host = new FakeHost(files, dirs, mtimes)
    const board = readyBoard(await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT)))
    const byTitle = new Map(board.cards.map(one => [one.title, one]))
    expect(byTitle.get('Alpha')?.lastChange).toBe(3_000)
    expect(byTitle.get('gamma_3')?.lastChange).toBe(2_000)
    expect(byTitle.get('gamma_3')?.registered).toBe(false)
    expect(byTitle.get('Beta')?.lastChange).toBeNull()
  })

  test('skips a list entry that is not a directory', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    dirs[file(alpha, 'tracks')] = [
      { name: 'alpha_1', kind: 'directory' },
      { name: 'linked_9', kind: 'other' },
    ]
    const host = new FakeHost(files, dirs, mtimes)
    const board = readyBoard(await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT)))
    expect(board.cards.map(one => one.title)).toEqual(['Alpha', 'Beta', 'delta_4'])
  })

  test('gives no card and no further call to a folder with no plan', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    dirs[file(alpha, 'tracks')] = [
      { name: 'alpha_1', kind: 'directory' },
      { name: 'no_plan_5', kind: 'directory' },
    ]
    const host = new FakeHost(files, dirs, mtimes)
    const board = readyBoard(await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT)))
    expect(board.cards.map(one => one.title)).toEqual(['Alpha', 'Beta', 'delta_4'])
    expect(host.calls.some(one => one.path.includes('no_plan_5') && one.method === 'stat')).toBe(false)
  })

  test('gives an empty list for a missing folder', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    delete dirs[file(alpha, 'archive')]
    const host = new FakeHost(files, dirs, mtimes)
    const board = readyBoard(await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT)))
    expect(board.cards.map(one => one.title)).toEqual(['Alpha', 'gamma_3'])
  })

  test('gives an R2 card when the plan read fails', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    const plan = file(alpha, 'tracks/alpha_1/plan.md')
    const host = new FakeHost(files, dirs, mtimes, { [plan]: 'FILE_TOO_LARGE' })
    const board = readyBoard(await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT)))
    const alphaCard = board.cards.find(one => one.title === 'Alpha')
    expect(alphaCard).toMatchObject({ column: 'in-progress', note: 'Plan unreadable', position: null })
  })

  test('gives a section error when the registry read fails', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    const host = new FakeHost(files, dirs, mtimes, { [file(alpha, 'tracks.md')]: 'NOT_FOUND' })
    const state = await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT))
    expect(state.status).toBe('error')
    if (state.status !== 'error') return
    expect(state.code).toBe('NOT_FOUND')
    expect(state.line).toBe(`No Measure tracks file at ${file(alpha, 'tracks.md')}.`)
  })

  test('gives a section error when a folder list fails with another code', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    const host = new FakeHost(files, dirs, mtimes, { [file(alpha, 'tracks')]: 'DENIED' })
    const state = await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT))
    expect(state.status).toBe('error')
    if (state.status !== 'error') return
    expect(state.code).toBe('DENIED')
    expect(state.line).toBe('Cannot read invented-alpha: DENIED.')
  })

  test('gives the NOT_GRANTED code of a refused read', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    const host = new FakeHost(files, dirs, mtimes, { [file(alpha, 'tracks.md')]: 'NOT_GRANTED' })
    const state = await loadRepo(host, alpha, limiter(MAX_IN_FLIGHT))
    expect(state.status).toBe('error')
    if (state.status !== 'error') return
    expect(state.code).toBe('NOT_GRANTED')
    expect(state.line).toBe('Cannot read invented-alpha: NOT_GRANTED.')
  })
})

describe('loadRoster', () => {
  test('loads every repo and isolates a failure', async () => {
    const { alpha, files, dirs, mtimes } = setup()
    const broken = repo('invented-broken')
    const host = new FakeHost(files, dirs, mtimes, { [file(broken, 'tracks.md')]: 'DENIED' })
    const states: RepoState[] = []
    await loadRoster(host, [alpha, broken], state => states.push(state))
    expect(states.map(one => one.repo.id)).toEqual(['invented-alpha', 'invented-broken'])
    expect(states.map(one => one.status)).toEqual(['ready', 'error'])
  })
})

describe('FR-16, D2: the calls of a Done track', () => {
  test('keeps the closed time of the two stats and marks the folder', async () => {
    const one = repo('invented-d2')
    const registry = [
      '- [x] **Track: Beta**',
      '  *Link: [./archive/beta_2/](./archive/beta_2/)*',
      '- [x] **Track: Epsilon**',
      '  *Link: [./tracks/epsilon_5/](./tracks/epsilon_5/)*',
      '',
    ].join('\n')
    const files: Record<string, string> = { [file(one, 'tracks.md')]: registry }
    const dirs: Record<string, Array<{ name: string; kind: string }>> = {
      [file(one, 'tracks')]: [{ name: 'epsilon_5', kind: 'directory' }],
      [file(one, 'archive')]: [{ name: 'beta_2', kind: 'directory' }],
    }
    const mtimes: Record<string, number> = {
      [file(one, 'archive/beta_2/plan.md')]: 5_000,
      [file(one, 'archive/beta_2/metadata.json')]: 2_000,
    }
    const host = new FakeHost(files, dirs, mtimes)
    const board = readyBoard(await loadRepo(host, one, limiter(MAX_IN_FLIGHT)))
    const byTitle = new Map(board.cards.map(oneCard => [oneCard.title, oneCard]))
    expect(byTitle.get('Beta')).toMatchObject({ column: 'done', archived: true, lastChange: 5_000 })
    expect(byTitle.get('Epsilon')).toMatchObject({ column: 'done', archived: false, lastChange: null })
    expect(host.count('readFile')).toBe(1)
    expect(host.count('stat')).toBe(4)

    const summary = doneSummary(board, 1_800_000_000_000)
    expect(summary.archived).toBe(1)
    expect(summary.notArchived).toBe(1)
    expect(summary.shown).toEqual([])
  })
})
