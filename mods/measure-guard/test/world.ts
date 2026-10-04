// The engine beneath the plugin in a test: a project folder in memory, the
// session facts, and the bottom of each event the mod calls `next` on.
import type { On, SessionMessage } from 'claude-code'
import { mock } from 'claude-code/testing'
import { BENCHMARK_PLAN, GUARD_PLAN, INDEX, TRACKS } from './fixtures/real'

export const ROOT = '/repo'

export const COMPOSE = {
  model: 'claude-test',
  promptModel: 'claude-test',
  surfaces: ['terminal'],
  tools: [],
  outputStyle: null,
  traits: [],
} as const

export const START = { cwd: ROOT, surface: 'terminal', isInteractive: true } as const

/** The props of the band above the prompt, as the engine passes them. */
export const BAND = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 160,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
  },
} as const

export const SURFACES = ['terminal', 'desktop'] as const

/** A compaction keeps at least one message: the summary. */
export const SUMMARY: SessionMessage[] = [{ role: 'user', text: 'summary', toolUses: [] }]

/** This repository's measure/ folder at the fixture snapshot. */
export const realFiles = (): Record<string, string> => ({
  [`${ROOT}/measure/index.md`]: INDEX,
  [`${ROOT}/measure/tracks.md`]: TRACKS,
  [`${ROOT}/measure/tracks/agent_performance_benchmarking_20260527/plan.md`]: BENCHMARK_PLAN,
  [`${ROOT}/measure/tracks/measure_guard_20261004/plan.md`]: GUARD_PLAN,
})

export type World = {
  files: Record<string, string>
}

/**
 * Registers the engine's side for a test. `files` is mutable: an Edit or a
 * Write the test's tool.call bottom runs changes it, as a session would.
 */
export const world = (
  on: On,
  files: Record<string, string>,
  { isRepo = true }: { isRepo?: boolean } = {},
): World => {
  const w: World = { files }
  mock.store(on)

  on('session.root', () => ({ value: ROOT }))
  on('session.cwd', () => ({ value: ROOT }))
  on('session.repo', () => ({
    value: isRepo ? { root: ROOT, remote: null, internal: false, name: null } : null,
  }))
  on('fs.read', ($, e) =>
    e.path in w.files ? { value: w.files[e.path] as string } : { deny: `ENOENT: ${e.path}` },
  )
  on('fs.exists', ($, e) => ({
    value: e.path in w.files || Object.keys(w.files).some(p => p.startsWith(`${e.path}/`)),
  }))

  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.compact', () => ({ messages: [...SUMMARY] }))
  on('prompt.compose', () => ({ sections: [{ id: 'intro', text: 'base', scope: 'shared' }] }))
  on('classic.UserPromptSubmit', () => ({}))
  on('ui.render', () => ({ type: 'Box', props: {}, children: [] }))

  on('tool.call', ($, e) => {
    if (e.tool === 'Edit') {
      const text = w.files[e.file_path] ?? ''
      w.files[e.file_path] = e.replace_all
        ? text.split(e.old_string).join(e.new_string)
        : text.replace(e.old_string, e.new_string)
    }
    if (e.tool === 'Write') w.files[e.file_path] = e.content
    return { result: {} as never, text: 'done' }
  })

  return w
}
