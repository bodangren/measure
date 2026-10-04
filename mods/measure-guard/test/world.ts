// The engine beneath the plugin in a test: a project folder in memory, the
// session facts, and the bottom of each event the mod calls `next` on.
import type { On, SessionMessage } from 'claude-code'
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

/** The /measure-status pane, as the engine passes its props. */
export const STATUS_PANE = {
  component: 'Pane',
  requestId: 'measure-status',
  props: {
    title: 'Measure status',
    isFocused: true,
    bodyColumns: 160,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

export const SURFACES = ['terminal', 'desktop'] as const

/** Runs a slash command as the person typing it. */
export const RUN = (command: string, args = '') =>
  ({
    command,
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: true, columns: 160 },
  }) as const

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
  /** The prompts the mod submitted with $.prompt.submit. */
  submitted: string[]
  /** The ids of the panes the mod opened. */
  opened: string[]
  /** The mod's $.store, across sessions. */
  store: Record<string, unknown>
  /** What `git status --porcelain` prints now. */
  git: string
  /** The toasts the mod showed. */
  toasts: string[]
  /** The Bash commands that fail (non-zero exit) when the mod lets them run. */
  failing: string[]
  /** What `git diff --cached --name-only` prints: the staged paths. */
  staged: string[]
}

/**
 * Registers the engine's side for a test. `files` is mutable: an Edit or a
 * Write the test's tool.call bottom runs changes it, as a session would.
 */
export const world = (
  on: On,
  files: Record<string, string>,
  { isRepo = true, store = {} }: { isRepo?: boolean; store?: Record<string, unknown> } = {},
): World => {
  const w: World = { files, submitted: [], opened: [], store: { ...store }, git: '', toasts: [], failing: [], staged: [] }
  on('store.get', ($, e) => ({ value: w.store[e.key] }))
  on('store.set', ($, e) => {
    w.store[e.key] = e.value
    return { value: undefined }
  })
  on('store.delete', ($, e) => {
    delete w.store[e.key]
    return { value: undefined }
  })
  on('store.keys', () => ({ value: Object.keys(w.store) }))

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
  on('process.run', ($, e) => ({
    value: {
      exitCode: e.argv[0] === 'git' ? 0 : 127,
      stdout:
        e.argv[0] !== 'git' ? '' : e.argv[1] === 'status' ? w.git : e.argv[1] === 'diff' && e.argv.includes('--cached') ? w.staged.join('\n') : '',
      stderr: '',
      isStdoutTruncated: false,
      isStderrTruncated: false,
    },
  }))
  on('ui.toast', ($, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('classic.Stop', () => ({}))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('command.run', () => ({ text: '' }))
  on('ui.open', ($, e) => {
    w.opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('prompt.submit', ($, e) => {
    w.submitted.push(e.text)
    return { text: e.text }
  })

  on('tool.call', ($, e) => {
    if (e.tool === 'Edit') {
      const text = w.files[e.file_path] ?? ''
      w.files[e.file_path] = e.replace_all
        ? text.split(e.old_string).join(e.new_string)
        : text.replace(e.old_string, e.new_string)
    }
    if (e.tool === 'Write') w.files[e.file_path] = e.content
    if (e.tool === 'Bash' && w.failing.includes(e.command)) {
      return { isError: true, result: 'Exit code 1', text: 'Exit code 1' }
    }
    if (e.tool === 'Bash' && /\bgit\s+commit\b/.test(e.command)) {
      const commit = { sha: 'abc1234def5678', kind: 'committed' }
      return { result: { stdout: '', stderr: '', interrupted: false, gitOperation: { commit } } as never, text: 'done' }
    }
    return { result: {} as never, text: 'done' }
  })

  return w
}
