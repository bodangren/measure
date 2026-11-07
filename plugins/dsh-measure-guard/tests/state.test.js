// The four state classes: the repository config store, the agent and turn
// records, the bypass precedence, the message helper, and the mode parsing.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  Agents,
  Bypass,
  Repos,
  Turns,
  createState,
  newUserMessage,
  parseModeOf,
} from '../src/state.js'

const tempBase = async () => {
  const base = await mkdtemp(join(tmpdir(), 'dsh-measure-state-'))
  return { base, cleanup: () => rm(base, { recursive: true, force: true }) }
}

test('Repos round-trips the mode and the repository bypass through repos.json', async () => {
  const { base, cleanup } = await tempBase()
  try {
    const repos = new Repos({ base })
    assert.equal(await repos.modeOf('/repo/a'), null)
    assert.equal(await repos.isOff('/repo/a'), false)

    await repos.setMode('/repo/a', 'strict')
    await repos.setOff('/repo/a', true)

    // A fresh instance reads the same file (read on first use).
    const again = new Repos({ base })
    assert.equal(await again.modeOf('/repo/a'), 'strict')
    assert.equal(await again.isOff('/repo/a'), true)
    assert.equal(await again.modeOf('/repo/b'), null)

    // The write was atomic: only the real file is left in the base folder.
    assert.deepEqual(await readdir(base), ['repos.json'])
    const stored = JSON.parse(await readFile(join(base, 'repos.json'), 'utf8'))
    assert.deepEqual(stored, { '/repo/a': { mode: 'strict', off: true } })

    await again.setMode('/repo/a', 'guard')
    await again.setOff('/repo/a', false)
    assert.equal(await again.modeOf('/repo/a'), 'guard')
    assert.equal(await again.isOff('/repo/a'), false)
  } finally {
    await cleanup()
  }
})

test('Repos tolerates a missing and a corrupt repos.json', async () => {
  const { base, cleanup } = await tempBase()
  try {
    const missing = new Repos({ base })
    assert.equal(await missing.modeOf('/repo'), null)

    await writeFile(join(base, 'repos.json'), '{not json', 'utf8')
    const corrupt = new Repos({ base })
    assert.equal(await corrupt.modeOf('/repo'), null)
    assert.equal(await corrupt.isOff('/repo'), false)

    // A write after the corrupt read replaces the file with valid JSON.
    await corrupt.setOff('/repo', true)
    assert.equal(await corrupt.isOff('/repo'), true)
    assert.deepEqual(JSON.parse(await readFile(join(base, 'repos.json'), 'utf8')), { '/repo': { off: true } })
  } finally {
    await cleanup()
  }
})

test('Bypass precedence is repo > session > null', async () => {
  const { base, cleanup } = await tempBase()
  try {
    const repos = new Repos({ base })
    const bypass = new Bypass(repos)
    assert.equal(await bypass.get('/repo'), null)

    await bypass.set('/repo', 'session')
    assert.equal(await bypass.get('/repo'), 'session')

    await bypass.set('/repo', 'repo')
    assert.equal(await bypass.get('/repo'), 'repo')

    await bypass.clear('/repo', 'repo')
    assert.equal(await bypass.get('/repo'), null)

    await bypass.set('/repo', 'session')
    await bypass.clear('/repo', 'session')
    assert.equal(await bypass.get('/repo'), null)
  } finally {
    await cleanup()
  }
})

test('Agents keeps one record per agent id and forgets it', () => {
  const agents = new Agents()
  const first = agents.sessionOf('agent-1')
  assert.deepEqual(first, {
    notedKey: null,
    setupChoice: null,
    reminder: null,
    problems: [],
    red: null,
    bypass: null,
  })
  assert.equal(agents.sessionOf('agent-1'), first)
  assert.notEqual(agents.sessionOf('agent-2'), first)

  first.notedKey = 'track|task'
  agents.forget('agent-1')
  assert.equal(agents.sessionOf('agent-1').notedKey, null)
})

test('Turns are keyed by agent id and turn, and never leak between turns', () => {
  const turns = new Turns()
  const state = { status: [' M src/a.js'], unsha: ['old task'], blocks: 0 }
  turns.setTurn('agent-1', 1, state)

  assert.deepEqual(turns.turnOf('agent-1', 1), state)
  assert.equal(turns.turnOf('agent-1', 2), undefined)
  assert.equal(turns.turnOf('agent-2', 1), undefined)

  turns.endTurn('agent-1', 1)
  assert.equal(turns.turnOf('agent-1', 1), undefined)

  turns.setTurn('agent-1', 2, { status: [], unsha: [], blocks: 1 })
  assert.deepEqual(turns.turnOf('agent-1', 2), { status: [], unsha: [], blocks: 1 })
  assert.equal(turns.turnOf('agent-1', 1), undefined)

  turns.setTurn('agent-2', 1, { status: [], unsha: [], blocks: 0 })
  turns.forgetAgent('agent-1')
  assert.equal(turns.turnOf('agent-1', 2), undefined)
  assert.notEqual(turns.turnOf('agent-2', 1), undefined)
})

test('newUserMessage deep-clones and deep-freezes a user message with a fresh id', () => {
  const input = {
    content: [{ type: 'text', text: 'measure note' }],
    source: { kind: 'measure-guard', form: 'notice', summary: 'task changed' },
  }
  const message = newUserMessage(input)

  assert.equal(message.role, 'user')
  assert.match(message.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  assert.equal(message.content[0].text, 'measure note')
  assert.deepEqual(message.source, input.source)

  assert.ok(Object.isFrozen(message))
  assert.ok(Object.isFrozen(message.content))
  assert.ok(Object.isFrozen(message.content[0]))
  assert.ok(Object.isFrozen(message.source))

  // A deep clone: changing the input after the call does not change the message.
  input.content[0].text = 'changed'
  assert.equal(message.content[0].text, 'measure note')

  assert.notEqual(newUserMessage(input).id, message.id)
})

test('parseModeOf accepts the three modes, defaults to guard, and warns once on an unknown value', () => {
  const warnings = []
  assert.equal(parseModeOf({ mode: 'advise' }), 'advise')
  assert.equal(parseModeOf({ mode: 'guard' }), 'guard')
  assert.equal(parseModeOf({ mode: 'strict' }), 'strict')
  assert.equal(parseModeOf('strict'), 'strict')
  assert.equal(parseModeOf(undefined), 'guard')
  assert.equal(parseModeOf({}), 'guard')
  assert.deepEqual(warnings, [])

  assert.equal(parseModeOf({ mode: 'nope' }, text => warnings.push(text)), 'guard')
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /unknown mode/i)
  assert.match(warnings[0], /guard/)

  assert.equal(parseModeOf('nope', text => warnings.push(text)), 'guard')
  assert.equal(warnings.length, 2)
  assert.match(warnings[1], /unknown mode/i)
})

test('createState builds the four state classes', async () => {
  const { base, cleanup } = await tempBase()
  try {
    const state = createState({ base })
    assert.ok(state.repos instanceof Repos)
    assert.ok(state.agents instanceof Agents)
    assert.ok(state.turns instanceof Turns)
    assert.ok(state.bypass instanceof Bypass)
  } finally {
    await cleanup()
  }
})
