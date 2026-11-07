// The eight Measure workflow commands (FR-6, FR-7). A command resolves the
// installed skill reference first, then submits one instruction message to the
// receiving agent, so the workflow starts without the user retyping it. The
// module imports no Harness package and touches the filesystem read-only.
import { realpath, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

import { newUserMessage } from './state.js'

/** The eight commands, their discovery copy, and the reference each one loads. */
export const WORKFLOWS = [
  {
    command: 'measure-setup',
    workflow: 'setup',
    skill: 'measure',
    file: 'references/setup.md',
    description: 'Setup Measure in this project',
  },
  {
    command: 'measure-new-track',
    workflow: 'new-track',
    skill: 'measure',
    file: 'references/new-track.md',
    description: 'Create a new Measure track',
  },
  {
    command: 'measure-new-track-set',
    workflow: 'new-track-set',
    skill: 'measure',
    file: 'references/new-track-set.md',
    description: 'Create a Measure track set',
  },
  {
    command: 'measure-implement',
    workflow: 'implement',
    skill: 'measure',
    file: 'references/implement.md',
    description: 'Implement the active Measure track',
  },
  {
    command: 'measure-review',
    workflow: 'review',
    skill: 'measure',
    file: 'references/review.md',
    description: 'Review a Measure track or change',
  },
  {
    command: 'measure-revert',
    workflow: 'revert',
    skill: 'measure',
    file: 'references/revert.md',
    description: 'Revert Measure work',
  },
  {
    command: 'measure-doctor',
    workflow: 'doctor',
    skill: 'measure',
    file: 'references/doctor.md',
    description: 'Run the Measure doctor',
  },
  {
    command: 'measure-orchestrate',
    workflow: 'orchestrate',
    skill: 'measure-orchestrator',
    file: 'SKILL.md',
    description: 'Orchestrate the active Measure track',
  },
]

const NO_MEASURE = 'measure-guard: this project has no measure/ folder. Run /measure-setup first.'

const incompleteText = (skill, file) =>
  `measure-guard: the installed measure skill is incomplete (missing ${skill}/${file}). Run bin/install-measure-skill.`

/** The path when it exists, else the literal path; realpath resolves symlinks. */
const canonicalOrSelf = async path => {
  try {
    return await realpath(path)
  } catch {
    return path
  }
}

/**
 * The skill roots in the DSH provider's rank order (design §4): project DSH,
 * project agents, user DSH, user agents, then the Claude compatibility path.
 * Each root is realpathed when it exists and deduplicated, so a symlinked
 * agents home never lists the Claude directory twice.
 */
export async function skillRoots({ projectRoot, env = process.env, home = homedir() } = {}) {
  const dshHome = env?.DSH_HOME ?? join(home, '.dsh')
  const agentsHome = env?.DSH_AGENTS_HOME ?? join(home, '.agents')
  const candidates = [
    join(projectRoot, '.dsh', 'skills'),
    join(projectRoot, '.agents', 'skills'),
    join(dshHome, 'skills'),
    join(agentsHome, 'skills'),
    join(home, '.claude', 'skills'),
  ]

  const roots = []
  const seen = new Set()
  for (const candidate of candidates) {
    const root = await canonicalOrSelf(candidate)
    if (seen.has(root)) continue
    seen.add(root)
    roots.push(root)
  }
  return roots
}

/**
 * The first root where `<root>/<skill>/<file>` is a file, as `{ path, root }`;
 * null when no root has it. Read on every call: no cache, so a repaired skill
 * takes effect immediately.
 */
export async function resolveSkillFile(deps, skill, file) {
  const roots = await skillRoots(deps)
  for (const root of roots) {
    const path = join(root, skill, file)
    try {
      if (!(await stat(path)).isFile()) continue
    } catch {
      continue
    }
    return { path, root }
  }
  return null
}

/** The instruction message of one workflow (design §5), with an optional argument line. */
export function workflowMessage({ workflow, skill, path, args }) {
  const text = `Follow the Measure workflow "${workflow}". Load the \`${skill}\` skill and read \`${path}\`; then continue with that workflow. The source of truth is measure/tracks.md and the active track's plan.md.`
  const argumentsLine = typeof args === 'string' ? args.trim() : ''
  return argumentsLine === '' ? text : `${text}\nArguments: ${argumentsLine}`
}

/** One command run: the project rail, the reference rail, then the steer. */
const runWorkflow = async (deps, entry, agent, rawInput) => {
  const root = await deps.rootOf(agent)

  if (entry.command !== 'measure-setup') {
    const snapshot = await deps.snapshots.get(root)
    if (snapshot?.hasMeasure !== true) return { kind: 'error', text: NO_MEASURE }
  }

  const resolved = await resolveSkillFile(
    { projectRoot: root, ...(deps.skillDeps ?? {}) },
    entry.skill,
    entry.file,
  )
  if (resolved === null) return { kind: 'error', text: incompleteText(entry.skill, entry.file) }

  agent.steer(
    newUserMessage({
      content: [
        {
          type: 'text',
          text: workflowMessage({
            workflow: entry.workflow,
            skill: entry.skill,
            path: resolved.path,
            args: rawInput,
          }),
        },
      ],
      source: { kind: 'measure-guard', form: 'instructions' },
    }),
  )

  return { kind: 'success', text: `Starting the Measure ${entry.workflow} workflow.` }
}

/** The eight `ctx.commands.register` definitions (FR-6, FR-7). */
export function measureWorkflowCommands(deps) {
  return WORKFLOWS.map(entry => ({
    name: entry.command,
    description: entry.description,
    handler: async ({ agent, rawInput } = {}) => {
      try {
        return await runWorkflow(deps, entry, agent, rawInput)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          kind: 'error',
          text: message.startsWith('measure-guard:') ? message : `measure-guard: ${message}`,
        }
      }
    },
  }))
}
