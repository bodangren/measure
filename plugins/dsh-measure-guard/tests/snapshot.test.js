// The snapshot loader: real repositories built in a temp folder (git runs
// through node:child_process in the TEST only), the canonical root, the cache,
// and the I/O seam's failure paths.
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { INDEX, MEDIARR_TRACKS, PLAN, TRACK_ID, TRACKS, cleanupRepo, makeRepo } from './fixtures.js'
import { Snapshots, canonicalRoot, gitStatus, loadSnapshot, makeIo } from '../src/snapshot.js'

const exec = promisify(execFile)

/** Runs git in `cwd`; the test-only repository plumbing. */
const git = (cwd, ...args) => exec('git', args, { cwd, encoding: 'utf8' })

/** A temp folder with an initial commit. */
const initRepo = async root => {
  await git(root, 'init', '-q')
  await git(root, 'config', 'user.email', 'test@example.com')
  await git(root, 'config', 'user.name', 'Test')
  await git(root, 'add', '.')
  await git(root, 'commit', '-qm', 'fixture')
}

/** A real filesystem-backed io for the tests (node:child_process is test-only). */
const nodeIo = {
  resolve: async path => {
    try {
      return await realpath(path)
    } catch {
      return path
    }
  },
  readText: async path => {
    try {
      return await readFile(path, 'utf8')
    } catch {
      return ''
    }
  },
  exists: async path => {
    try {
      await stat(path)
      return true
    } catch {
      return false
    }
  },
  gitLines: async (args, cwd) => {
    try {
      const { stdout } = await exec('git', args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 })
      return stdout.split('\n').filter(line => line.trim() !== '')
    } catch {
      return []
    }
  },
}

test('canonicalRoot resolves a subdirectory to the repository root', async () => {
  const root = await makeRepo()
  try {
    await initRepo(root)
    const canonical = await realpath(root)
    const subdirectory = join(root, 'src')
    await mkdir(subdirectory)

    assert.equal(await canonicalRoot(nodeIo, subdirectory), canonical)
    assert.equal(await canonicalRoot(nodeIo, root), canonical)
  } finally {
    await cleanupRepo(root)
  }
})

test('canonicalRoot falls back to the realpathed directory outside git', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dsh-measure-nogit-'))
  try {
    assert.equal(await canonicalRoot(nodeIo, dir), await realpath(dir))
  } finally {
    await cleanupRepo(dir)
  }
})

test('loadSnapshot reads the fixture project, its plans, and the allow list', async () => {
  const root = await makeRepo()
  try {
    await initRepo(root)
    const canonical = await realpath(root)
    const snapshot = await loadSnapshot(nodeIo, canonical)

    assert.equal(snapshot.root, canonical)
    assert.equal(snapshot.hasMeasure, true)
    assert.equal(snapshot.isRepo, true)
    assert.equal(snapshot.tracksPath, join(canonical, 'measure', 'tracks.md'))
    assert.deepEqual(snapshot.tracks.map(track => track.id), [TRACK_ID, 'old_linked_20260101'])
    assert.deepEqual(snapshot.tracks.map(track => track.marker), ['~', 'x'])
    assert.equal(snapshot.inProgressCount, 1)
    assert.equal(snapshot.parseError, null)
    assert.equal(snapshot.active.entry.id, TRACK_ID)
    assert.equal(snapshot.active.planPath, join(canonical, 'measure', 'tracks', TRACK_ID, 'plan.md'))
    assert.equal(snapshot.active.plan.phases.length, 2)
    assert.equal(snapshot.active.plan.phases[1].tasks[0].marker, '~')
    assert.deepEqual(snapshot.allow.folders, ['docs'])
    assert.deepEqual(snapshot.allow.ignored, [{ line: 3, text: '../outside/', reason: 'has a .. segment' }])
  } finally {
    await cleanupRepo(root)
  }
})

test('loadSnapshot reports a tracks file in no known format as a parse error', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-measure-badtracks-'))
  try {
    await mkdir(join(root, 'measure'), { recursive: true })
    await writeFile(join(root, 'measure', 'tracks.md'), '# Tracks\n\n- [~] no link and no bold title\n', 'utf8')
    await initRepo(root)
    const snapshot = await loadSnapshot(nodeIo, await realpath(root))

    assert.equal(snapshot.hasMeasure, true)
    assert.equal(snapshot.isRepo, true)
    assert.deepEqual(snapshot.tracks, [])
    assert.match(snapshot.parseError, /has track lines in no known format/)
  } finally {
    await cleanupRepo(root)
  }
})

test('loadSnapshot reads a numbered, same-line-link registry (the Mediarr shape)', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-measure-mediarr-'))
  try {
    await mkdir(join(root, 'measure', 'tracks', TRACK_ID), { recursive: true })
    await writeFile(join(root, 'measure', 'index.md'), INDEX, 'utf8')
    await writeFile(join(root, 'measure', 'tracks.md'), MEDIARR_TRACKS, 'utf8')
    await writeFile(join(root, 'measure', 'tracks', TRACK_ID, 'plan.md'), PLAN, 'utf8')
    await initRepo(root)
    const snapshot = await loadSnapshot(nodeIo, await realpath(root))

    assert.equal(snapshot.parseError, null)
    assert.equal(snapshot.hasMeasure, true)
    assert.deepEqual(snapshot.tracks.map(track => track.id), [
      TRACK_ID,
      'database_migration_20260713',
      'feature_adult_library_20261107',
      'feature_tv_browse_playback_20261003',
    ])
    assert.deepEqual(snapshot.tracks.map(track => track.marker), ['~', '~', ' ', 'x'])
    assert.equal(snapshot.inProgressCount, 2)
    assert.equal(snapshot.active.entry.id, TRACK_ID)
    assert.equal(snapshot.active.plan.phases.length, 2)
  } finally {
    await cleanupRepo(root)
  }
})

test('loadSnapshot still reports a numbered registry with nothing parseable as a parse error', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-measure-badtracks-numbered-'))
  try {
    await mkdir(join(root, 'measure'), { recursive: true })
    await writeFile(join(root, 'measure', 'tracks.md'), '# Tracks\n\n1. - [~] no bold title and no link\n', 'utf8')
    await initRepo(root)
    const snapshot = await loadSnapshot(nodeIo, await realpath(root))

    assert.equal(snapshot.hasMeasure, true)
    assert.deepEqual(snapshot.tracks, [])
    assert.match(snapshot.parseError, /has track lines in no known format/)
  } finally {
    await cleanupRepo(root)
  }
})

test('loadSnapshot reports an active track without a plan and a plan with no phase', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-measure-noplan-'))
  try {
    await mkdir(join(root, 'measure'), { recursive: true })
    const tracks = '- [~] **Track: No plan**\n  *Link: [./tracks/no_plan/](./tracks/no_plan/)*\n'
    await writeFile(join(root, 'measure', 'tracks.md'), tracks, 'utf8')
    await initRepo(root)
    const noPlan = await loadSnapshot(nodeIo, await realpath(root))
    assert.match(noPlan.parseError, /no plan\.md for the active track no_plan/)

    await mkdir(join(root, 'measure', 'tracks', 'no_plan'), { recursive: true })
    await writeFile(join(root, 'measure', 'tracks', 'no_plan', 'plan.md'), '# Plan\n\n- [~] Task: no phase heading\n', 'utf8')
    const noPhase = await loadSnapshot(nodeIo, await realpath(root))
    assert.match(noPhase.parseError, /has no "## Phase" heading/)
  } finally {
    await cleanupRepo(root)
  }
})

test('a git repository without measure/ is a repo with no snapshot data', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-measure-plain-'))
  try {
    await git(root, 'init', '-q')
    const snapshot = await loadSnapshot(nodeIo, await realpath(root))
    assert.equal(snapshot.isRepo, true)
    assert.equal(snapshot.hasMeasure, false)
    assert.equal(snapshot.active, null)
    assert.equal(snapshot.parseError, null)
    assert.deepEqual(snapshot.allow, { folders: [], ignored: [] })
  } finally {
    await cleanupRepo(root)
  }
})

test('a folder outside git with measure/ stays inert', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-measure-nogit-measure-'))
  try {
    await mkdir(join(root, 'measure'), { recursive: true })
    await writeFile(join(root, 'measure', 'tracks.md'), TRACKS, 'utf8')
    const snapshot = await loadSnapshot(nodeIo, root)
    assert.equal(snapshot.isRepo, false)
    assert.equal(snapshot.hasMeasure, false)
  } finally {
    await cleanupRepo(root)
  }
})

test('gitStatus returns the porcelain lines of the project', async () => {
  const root = await makeRepo()
  try {
    await initRepo(root)
    const canonical = await realpath(root)
    assert.deepEqual(await gitStatus(nodeIo, canonical), [])

    await writeFile(join(canonical, 'measure', 'notes.md'), '# Notes\n', 'utf8')
    await writeFile(join(canonical, 'source.js'), 'export {}\n', 'utf8')
    const lines = await gitStatus(nodeIo, canonical)
    assert.ok(lines.some(line => line.includes('measure/notes.md')))
    assert.ok(lines.some(line => line.includes('source.js')))
  } finally {
    await cleanupRepo(root)
  }
})

test('Snapshots reads once, shares the promise, and invalidates per root and all', async () => {
  const root = await makeRepo()
  try {
    await initRepo(root)
    const canonical = await realpath(root)
    let reads = 0
    const countingIo = {
      ...nodeIo,
      readText: async path => {
        reads += 1
        return nodeIo.readText(path)
      },
    }
    const cache = new Snapshots(countingIo)

    const [first, second] = await Promise.all([cache.get(canonical), cache.get(canonical)])
    assert.equal(first, second)
    const readsAfterLoad = reads
    assert.ok(readsAfterLoad > 0)

    assert.equal(await cache.get(canonical), first)
    assert.equal(reads, readsAfterLoad)

    cache.invalidate(canonical)
    const third = await cache.get(canonical)
    assert.notEqual(third, first)
    assert.ok(reads > readsAfterLoad)

    cache.invalidateAll()
    const fourth = await cache.get(canonical)
    assert.notEqual(fourth, third)
  } finally {
    await cleanupRepo(root)
  }
})

test('makeIo maps the ctx seams and caps the git output', async () => {
  const target = { targetKey: 'key', displayPath: '/real/project' }
  let spawned = null
  const io = makeIo({
    fs: {
      resolve: async path => {
        assert.equal(path, '/project')
        return target
      },
      readText: async (got, signal) => {
        assert.equal(got, target)
        assert.equal(signal, undefined)
        return 'file text'
      },
      stat: async () => ({ kind: 'file' }),
    },
    subprocess: {
      resolveExecutable: async command => {
        assert.equal(command, 'git')
        return '/usr/bin/git'
      },
      spawn: spec => {
        spawned = spec
        return {
          done: Promise.resolve({ exitCode: 0 }),
          collected: { stdout: { readFrom: () => ({ text: 'one\ntwo\n\n' }) } },
        }
      },
    },
  })

  assert.equal(await io.resolve('/project'), '/real/project')
  assert.equal(await io.readText('/project'), 'file text')
  assert.equal(await io.exists('/project'), true)
  assert.deepEqual(await io.gitLines(['status', '--porcelain'], '/project'), ['one', 'two'])
  assert.deepEqual(spawned.argv, ['/usr/bin/git', 'status', '--porcelain'])
  assert.equal(spawned.cwd, '/project')
  assert.equal(spawned.graceMs, 5000)
  assert.equal(spawned.stdio.stdin, 'ignore')
  assert.ok(spawned.stdio.stdout.maxBytes >= 64 * 1024)
  assert.ok(spawned.stdio.stderr.maxBytes >= 8 * 1024)
  assert.equal(spawned.signal, undefined)
})

test('makeIo returns safe values for every failure path', async () => {
  const io = makeIo({
    fs: {
      resolve: async () => {
        throw new Error('no fs')
      },
      readText: async () => {
        throw new Error('no read')
      },
      stat: async () => {
        throw new Error('no stat')
      },
    },
    subprocess: {
      resolveExecutable: async () => {
        throw new Error('no git')
      },
      spawn: () => {
        throw new Error('no spawn')
      },
    },
  })

  assert.equal(await io.resolve('/missing'), '/missing')
  assert.equal(await io.readText('/missing'), '')
  assert.equal(await io.exists('/missing'), false)
  assert.deepEqual(await io.gitLines(['status'], '/missing'), [])
})

test('loadSnapshot and canonicalRoot survive an io that throws everywhere', async () => {
  const throwing = {
    resolve: async path => path,
    readText: async () => {
      throw new Error('read')
    },
    exists: async () => {
      throw new Error('exists')
    },
    gitLines: async () => {
      throw new Error('git')
    },
  }

  assert.equal(await canonicalRoot(throwing, '/nope'), '/nope')
  const snapshot = await loadSnapshot(throwing, '/nope')
  assert.equal(snapshot.root, '/nope')
  assert.equal(snapshot.isRepo, false)
  assert.equal(snapshot.hasMeasure, false)
  assert.equal(snapshot.parseError, null)
})
