// Story S1: the effective guard mode. Precedence is repository (persisted) >
// session (in memory) > the profile config default; /measure-mode reports,
// sets, and clears each level, and a bad argument changes nothing.
import test from 'node:test'
import assert from 'node:assert/strict'

import { MODE_USAGE, SessionModes, effectiveMode, measureModeCommand, measureModeTool } from '../src/modes.js'

const ROOT = '/repo'
const AGENT = { id: 'agent-1', session: { id: 'agent-1' } }

/** The deps the Lead wires: the real SessionModes, a fake persisted Repos, the seam. */
const depsOf = ({ configMode = 'guard', repoMode = null, throwOnRepo = false, session = null } = {}) => {
  const sessionModes = new SessionModes()
  if (session !== null) sessionModes.set(ROOT, session)
  const deps = {
    configMode,
    sessionModes,
    state: {
      repos: {
        async modeOf(root) {
          if (throwOnRepo) throw new Error('unreadable state file')
          assert.equal(root, ROOT)
          return repoMode
        },
        async setMode(root, mode) {
          assert.equal(root, ROOT)
          deps.writtenRepoMode = mode
          repoMode = mode
        },
      },
    },
    async rootOf() {
      return ROOT
    },
  }
  deps.modeOf = root => effectiveMode(deps, root)
  return deps
}

const run = async (deps, rawInput = '') => measureModeCommand(deps).handler({ agent: AGENT, rawInput })

// ---- precedence -----------------------------------------------------------

test('the config default is the fallback', async () => {
  const deps = depsOf({ configMode: 'guard' })
  assert.deepEqual(await effectiveMode(deps, ROOT), { value: 'guard', source: 'config' })
})

test('a session override wins over the config default and is in memory', async () => {
  const deps = depsOf({ session: 'strict' })
  assert.deepEqual(await effectiveMode(deps, ROOT), { value: 'strict', source: 'session' })
  deps.sessionModes.clear(ROOT)
  assert.deepEqual(await effectiveMode(deps, ROOT), { value: 'guard', source: 'config' })
})

test('a repository override wins over the session and survives in the store', async () => {
  const deps = depsOf({ repoMode: 'advise', session: 'strict' })
  assert.deepEqual(await effectiveMode(deps, ROOT), { value: 'advise', source: 'repository' })
})

test('an unreadable repository store fails open to the session/config levels', async () => {
  const deps = depsOf({ throwOnRepo: true, session: 'strict' })
  assert.deepEqual(await effectiveMode(deps, ROOT), { value: 'strict', source: 'session' })
})

test('SessionModes validates the mode and clears with null', () => {
  const modes = new SessionModes()
  modes.set(ROOT, 'strict')
  assert.equal(modes.get(ROOT), 'strict')
  modes.set(ROOT, null)
  assert.equal(modes.get(ROOT), null)
  assert.throws(() => modes.set(ROOT, 'bogus'), /unknown mode/)
})

// ---- the command ----------------------------------------------------------

test('the measure_mode tool reports the effective value and source without writing', async () => {
  const deps = depsOf({ configMode: 'guard', repoMode: 'strict' })
  const tool = measureModeTool(deps)
  assert.equal(tool.name, 'measure_mode')
  assert.deepEqual(tool.parameters, { type: 'object', properties: {}, additionalProperties: false })
  const text = await tool.execute({}, { agent: AGENT })
  assert.equal(text, 'measure-guard: effective mode strict (repository).')
  assert.equal(Object.hasOwn(deps, 'writtenRepoMode'), false)
  const session = depsOf({ configMode: 'advise', session: 'strict' })
  assert.equal(await measureModeTool(session).execute({}, { agent: AGENT }), 'measure-guard: effective mode strict (session).')
  const config = depsOf({ configMode: 'advise' })
  assert.equal(await measureModeTool(config).execute({}, { agent: AGENT }), 'measure-guard: effective mode advise (config).')
})

test('/measure-mode reports the effective mode and source', async () => {
  const reply = await run(depsOf({ session: 'strict' }))
  assert.equal(reply.kind, 'success')
  assert.equal(reply.text, 'measure-guard: mode strict (session).')
})

test('/measure-mode sets the session override without persisting', async () => {
  const deps = depsOf()
  const reply = await run(deps, 'strict')
  assert.equal(reply.text, 'measure-guard: mode set to strict (session); effective mode strict (session).')
  assert.equal(deps.writtenRepoMode, undefined)
  assert.deepEqual(await deps.modeOf(ROOT), { value: 'strict', source: 'session' })
})

test('/measure-mode <mode> repo persists the repository override', async () => {
  const deps = depsOf()
  const reply = await run(deps, 'advise repo')
  assert.equal(reply.text, 'measure-guard: mode set to advise (repository); effective mode advise (repository).')
  assert.equal(deps.writtenRepoMode, 'advise')
  assert.deepEqual(await deps.modeOf(ROOT), { value: 'advise', source: 'repository' })
})

test('/measure-mode default clears the session or repository override', async () => {
  const session = await run(depsOf({ session: 'strict' }), 'default')
  assert.equal(session.text, 'measure-guard: mode override cleared (session); effective mode guard (config).')

  const repoDeps = depsOf({ repoMode: 'strict' })
  const repo = await run(repoDeps, 'default repo')
  assert.equal(repo.text, 'measure-guard: mode override cleared (repository); effective mode guard (config).')
  assert.equal(repoDeps.writtenRepoMode, null)
})

test('/measure-mode rejects unknown modes, unknown scopes, and too many tokens', async () => {
  const deps = depsOf({ session: 'strict' })
  for (const input of ['bogus', 'strict nope', 'strict repo extra']) {
    const reply = await run(deps, input)
    assert.equal(reply.text, MODE_USAGE, input)
  }
  // A bad argument changes nothing.
  assert.deepEqual(await deps.modeOf(ROOT), { value: 'strict', source: 'session' })
})
