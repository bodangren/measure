// The context layer (FR-1..FR-4): the static rule section, the exactly-once
// task note delivered through agent/pre-step, the end-of-turn reminder, and the
// compaction re-note. Every function takes its dependencies, so the module runs
// without the DSH runtime. The end-of-turn computation itself is a Phase 3 seam.
import { noteKey, ruleSection, taskNote } from './core/parse.ts'
import { MAX_BLOCKS, unshaTasks } from './core/guards.ts'
import { newUserMessage } from './state.js'
import { secondWriterText } from './roots.js'

/** The name and order of the fixed system-prompt section (design §6). */
export const RULE_SECTION_NAME = 'measure:rule'
export const RULE_SECTION_ORDER = 5000

/**
 * The `ctx.systemPrompt.section` argument for an attached agent: the fixed rule
 * text when the project has a `measure/` folder, else null (NFR-1 inertness).
 */
export function ruleSectionRegistration(_agent, snapshot) {
  if (snapshot === null || snapshot === undefined || snapshot.hasMeasure !== true) return null
  return { name: RULE_SECTION_NAME, order: RULE_SECTION_ORDER, text: ruleSection() }
}

/** A model-facing notice with the plugin's source kind (design §2). */
const noticeMessage = (text, summary) =>
  newUserMessage({
    content: [{ type: 'text', text }],
    source: { kind: 'measure-guard', form: 'notice', summary },
  })

/** The reminder text for the problems of the last end-of-turn check. */
export const reminderText = problems =>
  [
    'measure-guard: at the end of the last turn, these problems were open:',
    ...problems.map(problem => `- ${problem}`),
    'Fix them before you continue.',
  ].join('\n')

/** Captures the turn baseline once: the status lines and the `[x]` tasks without SHA. */
const ensureTurn = async (agentId, turn, root, snapshot, deps) => {
  if (turn === undefined || turn === null) return
  if (deps.state.turns.turnOf(agentId, turn) !== undefined) return
  let status = []
  try {
    status = await deps.gitStatusOf(root)
  } catch {
    status = []
  }
  deps.state.turns.setTurn(agentId, turn, {
    status: [...status],
    unsha: snapshot?.active ? unshaTasks(snapshot.active.plan) : [],
    blocks: 0,
  })
}

/**
 * The `agent/pre-step` waterfall handler: let the other listeners decide first,
 * pass a non-enter decision through untouched, then deliver the pending reminder
 * and the task note as appended user messages. The snapshot is refreshed on
 * every step, so an external edit of the plan is seen and changes the noteKey.
 */
export function preStepHook(agent, root, deps) {
  return async (payload, next) => {
    const decision = await next()
    if (decision === null || decision === undefined || decision.kind !== 'enter') return decision

    deps.snapshots.invalidate(root)
    const snapshot = await deps.snapshots.get(root)
    await ensureTurn(agent.id, payload.turn, root, snapshot, deps)

    const session = deps.state.agents.sessionOf(agent.id)
    const notes = []
    if (session.reminder !== null && session.reminder !== undefined) {
      notes.push({ text: session.reminder, summary: 'end-of-turn problems' })
      session.reminder = null
    }
    const key = noteKey(snapshot)
    if (key !== null && key !== session.notedKey) {
      session.notedKey = key
      const note = taskNote(snapshot, deps.mode)
      if (note !== null) notes.push({ text: note, summary: 'active task changed' })
    }
    if (notes.length === 0) return decision

    const messages = notes.map(note => noticeMessage(note.text, note.summary))
    return { ...decision, messages: [...(decision.messages ?? []), ...messages] }
  }
}

/**
 * The `agent/turn-stopping` seam. Phase 3 computes the end-of-turn problems and
 * the strict hold-open here; this phase only forwards to the supplied hook.
 */
export function turnStoppingHook(agent, root, deps) {
  return async payload => {
    if (typeof deps.onTurnStopping === 'function') return deps.onTurnStopping({ agent, root, payload })
    return undefined
  }
}

/**
 * A successful `compaction/end` arms the next task note again; returns true
 * when it did. A compaction with an error keeps the current notedKey.
 */
export function compactionHandler(state, agentId, event) {
  if (event?.type !== 'compaction/end') return false
  if (event.data?.error) return false
  state.agents.sessionOf(agentId).notedKey = null
  return true
}

/**
 * The end-of-turn seam: end the turn state, record the problems, and keep a
 * reminder for the next pre-step. `guard` always arms it; `strict` arms it only
 * after the block limit, so the final report is not lost (the earlier turn
 * stoppings hold the turn open instead). `deps.computeProblems` returns the
 * problems that `onTurnStopping` stored for this turn.
 */
export function endTurnHandler(agentId, root, event, deps) {
  const turnNumber = event?.data?.turn
  if (turnNumber === undefined || turnNumber === null) return []
  const turn = deps.state.turns.turnOf(agentId, turnNumber)
  if (turn === undefined) return []

  let problems = []
  if (typeof deps.computeProblems === 'function') {
    try {
      problems = deps.computeProblems({ agentId, root, turn, event }) ?? []
    } catch {
      problems = []
    }
  }
  const session = deps.state.agents.sessionOf(agentId)
  session.problems = [...problems]
  const blocks = turn.blocks ?? 0
  const remind = deps.mode === 'guard' || (deps.mode === 'strict' && blocks >= MAX_BLOCKS)
  if (remind && problems.length > 0) session.reminder = reminderText(problems)
  deps.state.turns.endTurn(agentId, turnNumber)
  return problems
}

/**
 * The `session/event` delegation: a successful compaction arms the next task
 * note and drops the snapshot; turn/end ends the turn state. `root` is known
 * on the agent-scoped listener; the global listener passes null and drops every
 * snapshot.
 */
export function sessionEventHandler(agentId, event, deps, root = null) {
  if (event?.type === 'compaction/end') {
    const armed = compactionHandler(deps.state, agentId, event)
    if (armed) {
      if (root !== null) deps.snapshots.invalidate(root)
      else deps.snapshots.invalidateAll()
    }
    return armed
  }
  if (event?.type === 'turn/end') return endTurnHandler(agentId, root, event, deps)
  return undefined
}

/**
 * Attaches the context layer to one agent: the agent-scoped rule section and
 * the agent-scoped `agent/pre-step`, `agent/turn-stopping`, and `session/event`
 * listeners (the session/event one filters to the agent's own session). Returns
 * a disposer for all of them.
 */
export async function attachAgent(_ctx, agent, deps) {
  const root = await deps.rootOf(agent)
  const snapshot = await deps.snapshots.get(root)
  const disposers = []

  const section = ruleSectionRegistration(agent, snapshot)
  if (section !== null && agent.ctx?.systemPrompt?.section) {
    disposers.push(agent.ctx.systemPrompt.section(section))
  }

  if (deps.roots !== undefined && deps.roots.claim(agent.id, root) && typeof agent.inject === 'function') {
    agent.inject(noticeMessage(secondWriterText(deps.roots.countOf(root)), 'second writer'))
  }

  disposers.push(agent.ctx.on('agent/pre-step', preStepHook(agent, root, deps)))
  disposers.push(agent.ctx.on('agent/turn-stopping', turnStoppingHook(agent, root, deps)))
  disposers.push(
    agent.ctx.on('session/event', (session, event) => {
      if (session?.id !== agent.id) return undefined
      return sessionEventHandler(agent.id, event, deps, root)
    }),
  )

  return () => {
    for (const dispose of disposers.reverse()) {
      try {
        dispose()
      } catch {
        // A listener the host already removed is not an error.
      }
    }
  }
}
