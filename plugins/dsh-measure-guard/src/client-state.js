// The FR-15 client data channel: the JSON view the band and the panel poll,
// and the exact web-server route that serves it. The view is built from the
// shared core (design §8, §12) so the Client never re-parses the Measure files.
import { bandLine, statusLines } from './core/parse.ts'
import { goalLine, goalOf, goalSummary } from './goal.js'
import { needsSetup, resolveSetupChoice, setupBandText } from './setup.js'

/** The route the Client fetches: `GET /measure-guard/state?sessionId=<id>`. */
export const CLIENT_STATE_PATH = '/measure-guard/state'

/**
 * The JSON body of the route: the band line (null when the project has no
 * measure/ folder), the status text, the bypass state, the last end-of-turn
 * problems, and the moment the Host built it. `mode` is accepted because the
 * Host view is built in one place; the band and status lines do not vary with
 * it, and the FR-15 shape keeps the five fields.
 */
export const clientView = ({ snapshot, guardsOff, problems, mode, updatedAt, sessionCount = 1, goal = null, setupChoice = null }) => {
  // An absent snapshot reads as "no read yet"; statusLines() accepts null.
  const project = snapshot === undefined ? null : snapshot
  const line = project === null ? null : bandLine(project, guardsOff)
  // FR-12: a second writer in one worktree is named in the band. The shared
  // core text is kept verbatim; the count is the adapter's own suffix.
  const band = line === null || sessionCount < 2 ? line : `${line} · ${sessionCount} sessions`
  const status = statusLines(project, guardsOff)
  const goalText = goalLine(goal)
  return {
    band,
    status: (goalText === null ? status : [...status, goalText]).join('\n'),
    guardsOff,
    problems: [...problems],
    updatedAt,
    goal: goalSummary(goal),
    setup: {
      choice: setupChoice === 'off' || setupChoice === 'setup' ? setupChoice : null,
      // The offer text exists only where the setup question applies: a git
      // repository with no measure/ folder (NFR-1).
      text: needsSetup(project) ? setupBandText(setupChoice) : null,
    },
  }
}

/** The error text of a caught failure; never undefined. */
const errorText = error => {
  if (error instanceof Error) return error.message === '' ? error.name : error.message
  return String(error)
}

/** The route the band's two setup buttons post to: `POST /measure-guard/setup`. */
export const SETUP_PATH = '/measure-guard/setup'

/**
 * The resource of the setup route (Story S5): a POST `{ sessionId, choice }`
 * records the answer in agent state. `off` makes the edit guard pass (the core
 * treats a non-ask answer as answered); `setup` also delivers the shared core's
 * setup prompt to the agent, exactly once. Non-POST is 405, a malformed body or
 * an unknown choice is 400, an unknown session is 404. Every I/O failure is
 * caught like the state route.
 */
export async function setupResponse(deps, request) {
  try {
    if (request.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405)
    let body
    try {
      body = await request.json()
    } catch {
      return jsonResponse({ error: 'malformed body' }, 400)
    }
    const sessionId = typeof body?.sessionId === 'string' && body.sessionId !== '' ? body.sessionId : null
    const choice = body?.choice
    if (sessionId === null || (choice !== 'off' && choice !== 'setup')) {
      return jsonResponse({ error: 'invalid setup answer' }, 400)
    }
    const agent = deps.agentOf(sessionId)
    if (agent === undefined || agent === null) return jsonResponse({ error: 'not found' }, 404)

    const before = deps.state.agents.sessionOf(agent.id).setupChoice
    resolveSetupChoice(deps.state, agent.id, choice)
    if (choice === 'setup' && before !== 'setup' && typeof deps.injectSetup === 'function') deps.injectSetup(agent)
    return jsonResponse({ choice }, 200, moduleIdentity(deps))
  } catch (error) {
    return jsonResponse({ error: errorText(error) }, 500)
  }
}

/** A JSON response with the given status and optional extra headers. */
const jsonResponse = (value, status = 200, headers = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })

/**
 * The identity of the loaded Host module, as the installed entry reports it.
 * `--check --live` compares this header with the installed `index.js`, so a
 * still-loaded working-tree copy cannot masquerade as the installed copy.
 */
const moduleIdentity = deps =>
  typeof deps.moduleUrl === 'string' && deps.moduleUrl !== ''
    ? { 'x-measure-guard-module': deps.moduleUrl }
    : {}

/**
 * The resource of the state route. Every I/O failure is caught: the response
 * is a 500 JSON `{ error }` and the request never throws (a throwing resource
 * is answered 400 by the web server, which loses the reason).
 */
export async function clientStateResponse(deps, request) {
  try {
    const sessionId = new URL(request.url).searchParams.get('sessionId')
    const agent = sessionId === null ? undefined : deps.agentOf(sessionId)
    if (agent === undefined || agent === null) return new Response('not found', { status: 404 })

    const root = await deps.rootOf(agent)
    const snapshot = await deps.snapshots.get(root)
    const guardsOff = await deps.state.bypass.get(root)
    const problems = deps.state.agents.sessionOf(agent.id).problems
    const view = clientView({
      snapshot,
      guardsOff,
      problems,
      mode: deps.mode,
      sessionCount: deps.roots === undefined ? 1 : deps.roots.countOf(root),
      goal: goalOf(deps, agent),
      setupChoice: deps.state.agents.sessionOf(agent.id).setupChoice,
      updatedAt: new Date().toISOString(),
    })
    return jsonResponse(view, 200, moduleIdentity(deps))
  } catch (error) {
    return jsonResponse({ error: errorText(error) }, 500)
  }
}

/**
 * Registers the exact state route on the Host web server and returns the
 * disposer the caller owns (design §8: an HTTP route, no projection and no
 * remote). `deps.agentOf` is wired by the Lead as `id => ctx.agents.get(id)`.
 */
export function registerClientState(ctx, deps) {
  return ctx.effect(() => {
    const state = ctx.webServer.register({
      kind: 'exact',
      path: CLIENT_STATE_PATH,
      resource: request => clientStateResponse(deps, request),
    })
    const setup = ctx.webServer.register({
      kind: 'exact',
      path: SETUP_PATH,
      resource: request => setupResponse(deps, request),
    })
    return () => {
      state()
      setup()
    }
  })
}
