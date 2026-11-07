// The workflow commands (FR-6, FR-7): the eight defs, the exact message and
// descriptions, the project and reference rails, the skill-root order, and the
// no-cache lookup. Fakes only: no DSH runtime and no host skill installation.
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import {
  WORKFLOWS,
  measureWorkflowCommands,
  resolveSkillFile,
  skillRoots,
  workflowMessage,
} from '../src/workflow.js'

const COMMANDS = [
  'measure-setup',
  'measure-new-track',
  'measure-new-track-set',
  'measure-implement',
  'measure-review',
  'measure-revert',
  'measure-doctor',
  'measure-orchestrate',
]

const DESCRIPTIONS = {
  'measure-setup': 'Setup Measure in this project',
  'measure-new-track': 'Create a new Measure track',
  'measure-new-track-set': 'Create a Measure track set',
  'measure-implement': 'Implement the active Measure track',
  'measure-review': 'Review a Measure track or change',
  'measure-revert': 'Revert Measure work',
  'measure-doctor': 'Run the Measure doctor',
  'measure-orchestrate': 'Orchestrate the active Measure track',
}

const WORKFLOW_OF = {
  'measure-setup': 'setup',
  'measure-new-track': 'new-track',
  'measure-new-track-set': 'new-track-set',
  'measure-implement': 'implement',
  'measure-review': 'review',
  'measure-revert': 'revert',
  'measure-doctor': 'doctor',
  'measure-orchestrate': 'orchestrate',
}

const FILE_OF = {
  'measure-setup': 'references/setup.md',
  'measure-new-track': 'references/new-track.md',
  'measure-new-track-set': 'references/new-track-set.md',
  'measure-implement': 'references/implement.md',
  'measure-review': 'references/review.md',
  'measure-revert': 'references/revert.md',
  'measure-doctor': 'references/doctor.md',
  'measure-orchestrate': 'SKILL.md',
}

const MEASURE_FILES = [
  'references/setup.md',
  'references/new-track.md',
  'references/new-track-set.md',
  'references/implement.md',
  'references/review.md',
  'references/revert.md',
  'references/doctor.md',
]

const NO_MEASURE = 'measure-guard: this project has no measure/ folder. Run /measure-setup first.'

const incomplete = (skill, file) =>
  `measure-guard: the installed measure skill is incomplete (missing ${skill}/${file}). Run bin/install-measure-skill.`

/** A temp world: a project root, a home, and the two home overrides. */
const makeWorld = async t => {
  const base = await mkdtemp(join(tmpdir(), 'dsh-measure-workflow-'))
  t.after(() => rm(base, { recursive: true, force: true }))
  const project = join(base, 'project')
  const home = join(base, 'home')
  const env = { DSH_HOME: join(home, '.dsh'), DSH_AGENTS_HOME: join(home, '.agents') }
  await mkdir(project, { recursive: true })
  await mkdir(home, { recursive: true })
  return { base, project, home, env }
}

/** Writes `<root>/<skill>/<file>` and returns its path. */
const writeSkill = async (root, skill, file, text = `# ${skill}/${file}\n`) => {
  const path = join(root, skill, file)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, text, 'utf8')
  return path
}

/** Installs the whole `measure` skill and the orchestrator skill under one root. */
const installAll = async root => {
  for (const file of MEASURE_FILES) await writeSkill(root, 'measure', file)
  await writeSkill(root, 'measure-orchestrator', 'SKILL.md')
}

/** The user DSH skill root of a world. */
const userRoot = world => join(world.env.DSH_HOME, 'skills')

const fakeAgent = () => ({
  messages: [],
  steer(message) {
    this.messages.push(message)
  },
})

const fakeDeps = (world, { root = world.project, hasMeasure = true, overrides = {} } = {}) => ({
  rootOf: async () => root,
  snapshots: { get: async () => ({ root, hasMeasure }) },
  skillDeps: { env: world.env, home: world.home },
  ...overrides,
})

const definitionOf = (deps, command) => {
  const definition = measureWorkflowCommands(deps).find(candidate => candidate.name === command)
  assert.ok(definition, `missing definition for ${command}`)
  return definition
}

test('WORKFLOWS holds the eight commands in order with the exact descriptions', () => {
  assert.deepEqual(WORKFLOWS.map(entry => entry.command), COMMANDS)
  for (const entry of WORKFLOWS) {
    assert.deepEqual(Object.keys(entry).sort(), ['command', 'description', 'file', 'skill', 'workflow'])
    assert.equal(entry.description, DESCRIPTIONS[entry.command])
    assert.equal(entry.workflow, WORKFLOW_OF[entry.command])
    assert.equal(
      entry.skill,
      entry.command === 'measure-orchestrate' ? 'measure-orchestrator' : 'measure',
    )
    assert.equal(entry.file, FILE_OF[entry.command])
  }
})

test('measureWorkflowCommands registers one whole definition per command', () => {
  const definitions = measureWorkflowCommands(fakeDeps({ project: '/repo', env: {}, home: '/home' }))
  assert.deepEqual(definitions.map(definition => definition.name), COMMANDS)
  for (const definition of definitions) {
    assert.equal(typeof definition.handler, 'function')
    assert.equal(typeof definition.description, 'string')
    assert.ok(definition.description.length > 0)
  }
})

test('every handler steers exactly one message with the resolved reference path', async t => {
  const world = await makeWorld(t)
  await installAll(userRoot(world))
  const deps = fakeDeps(world)

  for (const entry of WORKFLOWS) {
    const agent = fakeAgent()
    const result = await definitionOf(deps, entry.command).handler({ agent, rawInput: '' })
    assert.deepEqual(result, {
      kind: 'success',
      text: `Starting the Measure ${entry.workflow} workflow.`,
    })
    assert.equal(agent.messages.length, 1)

    const message = agent.messages[0]
    assert.equal(message.role, 'user')
    assert.deepEqual(message.source, { kind: 'measure-guard', form: 'instructions' })
    assert.equal(message.content.length, 1)
    assert.equal(message.content[0].type, 'text')

    const path = await realpath(join(userRoot(world), entry.skill, entry.file))
    assert.equal(
      message.content[0].text,
      workflowMessage({ workflow: entry.workflow, skill: entry.skill, path }),
    )
    assert.ok(message.content[0].text.includes(`read \`${path}\``))
    assert.ok(message.content[0].text.includes(`Load the \`${entry.skill}\` skill`))
    assert.ok(message.content[0].text.endsWith('The source of truth is measure/tracks.md and the active track\'s plan.md.'))
  }
})

test('measure-new-track appends a trimmed Arguments line only when rawInput is non-empty', async t => {
  const world = await makeWorld(t)
  await installAll(userRoot(world))
  const deps = fakeDeps(world)
  const path = await realpath(join(userRoot(world), 'measure', 'references', 'new-track.md'))
  const base = workflowMessage({ workflow: 'new-track', skill: 'measure', path })

  const withArgs = fakeAgent()
  await definitionOf(deps, 'measure-new-track').handler({ agent: withArgs, rawInput: 'fix the parser' })
  assert.equal(withArgs.messages[0].content[0].text, `${base}\nArguments: fix the parser`)

  const trimmed = fakeAgent()
  await definitionOf(deps, 'measure-new-track').handler({ agent: trimmed, rawInput: '  fix the parser  ' })
  assert.equal(trimmed.messages[0].content[0].text, `${base}\nArguments: fix the parser`)

  const empty = fakeAgent()
  await definitionOf(deps, 'measure-new-track').handler({ agent: empty, rawInput: '' })
  assert.equal(empty.messages[0].content[0].text, base)
  assert.equal(empty.messages[0].content[0].text.includes('Arguments:'), false)

  const absent = fakeAgent()
  await definitionOf(deps, 'measure-new-track').handler({ agent: absent })
  assert.equal(absent.messages[0].content[0].text, base)
})

test('a project without measure/ errors and steers nothing (except measure-setup)', async t => {
  const world = await makeWorld(t)
  await installAll(userRoot(world))
  const deps = fakeDeps(world, { hasMeasure: false })

  for (const entry of WORKFLOWS.filter(candidate => candidate.command !== 'measure-setup')) {
    const agent = fakeAgent()
    const result = await definitionOf(deps, entry.command).handler({ agent, rawInput: '' })
    assert.deepEqual(result, { kind: 'error', text: NO_MEASURE })
    assert.equal(agent.messages.length, 0)
  }
})

test('a missing reference errors and steers nothing', async t => {
  const world = await makeWorld(t)
  await installAll(userRoot(world))
  await rm(join(userRoot(world), 'measure', 'references', 'implement.md'))
  const deps = fakeDeps(world)
  const agent = fakeAgent()

  const result = await definitionOf(deps, 'measure-implement').handler({ agent, rawInput: '' })
  assert.deepEqual(result, {
    kind: 'error',
    text: incomplete('measure', 'references/implement.md'),
  })
  assert.equal(agent.messages.length, 0)
})

test('measure-setup works without a measure/ folder', async t => {
  const world = await makeWorld(t)
  await installAll(userRoot(world))
  const agent = fakeAgent()
  const deps = fakeDeps(world, { hasMeasure: false })

  const result = await definitionOf(deps, 'measure-setup').handler({ agent, rawInput: '' })
  assert.deepEqual(result, { kind: 'success', text: 'Starting the Measure setup workflow.' })
  assert.equal(agent.messages.length, 1)
  assert.ok(
    agent.messages[0].content[0].text.includes(
      await realpath(join(userRoot(world), 'measure', 'references', 'setup.md')),
    ),
  )
})

test('measure-orchestrate resolves its own skill root, not the measure skill', async t => {
  const world = await makeWorld(t)
  await writeSkill(userRoot(world), 'measure-orchestrator', 'SKILL.md')
  const agent = fakeAgent()
  const deps = fakeDeps(world)

  const result = await definitionOf(deps, 'measure-orchestrate').handler({ agent, rawInput: '' })
  assert.deepEqual(result, { kind: 'success', text: 'Starting the Measure orchestrate workflow.' })
  assert.equal(agent.messages.length, 1)
  const path = await realpath(join(userRoot(world), 'measure-orchestrator', 'SKILL.md'))
  assert.equal(
    agent.messages[0].content[0].text,
    workflowMessage({ workflow: 'orchestrate', skill: 'measure-orchestrator', path }),
  )
  assert.ok(agent.messages[0].content[0].text.includes('`measure-orchestrator` skill'))
  assert.ok(agent.messages[0].content[0].text.includes(path))
})

test('the skill roots follow the documented order and a project root wins', async t => {
  const world = await makeWorld(t)
  const projectRoot = join(world.project, '.dsh', 'skills')
  const projectFile = await writeSkill(projectRoot, 'measure', 'references/review.md', 'project\n')
  await writeSkill(userRoot(world), 'measure', 'references/review.md', 'user\n')

  const roots = await skillRoots({ projectRoot: world.project, env: world.env, home: world.home })
  const canonical = async path => realpath(path).catch(() => path)
  assert.deepEqual(
    roots,
    await Promise.all(
      [
        join(world.project, '.dsh', 'skills'),
        join(world.project, '.agents', 'skills'),
        join(world.env.DSH_HOME, 'skills'),
        join(world.env.DSH_AGENTS_HOME, 'skills'),
        join(world.home, '.claude', 'skills'),
      ].map(canonical),
    ),
  )

  const resolved = await resolveSkillFile(
    { projectRoot: world.project, env: world.env, home: world.home },
    'measure',
    'references/review.md',
  )
  assert.deepEqual(resolved, {
    path: await realpath(projectFile),
    root: await realpath(projectRoot),
  })
})

test('a symlinked agents home is deduplicated against the Claude root', async t => {
  const world = await makeWorld(t)
  const claudeRoot = join(world.home, '.claude', 'skills')
  await writeSkill(claudeRoot, 'measure', 'references/doctor.md')
  await symlink(join(world.home, '.claude'), world.env.DSH_AGENTS_HOME, 'dir')

  const roots = await skillRoots({ projectRoot: world.project, env: world.env, home: world.home })
  assert.equal(roots.length, 4)
  assert.equal(roots.includes(join(world.home, '.agents', 'skills')), false)
  const canonical = async path => realpath(path).catch(() => path)
  const realRoots = await Promise.all(roots.map(canonical))
  assert.equal(new Set(realRoots).size, realRoots.length)
  assert.ok(realRoots.includes(await realpath(claudeRoot)))

  const resolved = await resolveSkillFile(
    { projectRoot: world.project, env: world.env, home: world.home },
    'measure',
    'references/doctor.md',
  )
  assert.equal(resolved.path, await realpath(join(claudeRoot, 'measure', 'references', 'doctor.md')))
})

test('resolveSkillFile does not cache: repairing a missing file makes the next call succeed', async t => {
  const world = await makeWorld(t)
  await installAll(userRoot(world))
  const target = join(userRoot(world), 'measure', 'references', 'revert.md')
  await rm(target)
  const deps = fakeDeps(world)

  const first = fakeAgent()
  const firstResult = await definitionOf(deps, 'measure-revert').handler({ agent: first, rawInput: '' })
  assert.deepEqual(firstResult, { kind: 'error', text: incomplete('measure', 'references/revert.md') })
  assert.equal(first.messages.length, 0)

  await writeSkill(userRoot(world), 'measure', 'references/revert.md')
  const second = fakeAgent()
  const secondResult = await definitionOf(deps, 'measure-revert').handler({ agent: second, rawInput: '' })
  assert.deepEqual(secondResult, { kind: 'success', text: 'Starting the Measure revert workflow.' })
  assert.equal(second.messages.length, 1)
})

test('a throwing root or snapshot becomes an error result and never throws', async t => {
  const world = await makeWorld(t)
  await installAll(userRoot(world))

  const throwers = [
    { overrides: { rootOf: async () => { throw new Error('root exploded') } }, text: 'measure-guard: root exploded' },
    { overrides: { snapshots: { get: async () => { throw new Error('snapshot exploded') } } }, text: 'measure-guard: snapshot exploded' },
  ]
  for (const { overrides, text } of throwers) {
    const agent = fakeAgent()
    const deps = fakeDeps(world, { overrides })
    const result = await definitionOf(deps, 'measure-doctor').handler({ agent, rawInput: '' })
    assert.deepEqual(result, { kind: 'error', text })
    assert.equal(agent.messages.length, 0)
  }
})
