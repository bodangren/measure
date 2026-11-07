// The FR-15 client data channel: the JSON view the band and the panel poll,
// and the exact web-server route that serves it. The view is built from the
// shared core (design §8, §12) so the Client never re-parses the Measure files.
import { bandLine, statusLines } from './core/parse.ts'

/** The route the Client fetches: `GET /measure-guard/state?sessionId=<id>`. */
export const CLIENT_STATE_PATH = '/measure-guard/state'

/**
 * The JSON body of the route: the band line (null when the project has no
 * measure/ folder), the status text, the bypass state, the last end-of-turn
 * problems, and the moment the Host built it. `mode` is accepted because the
 * Host view is built in one place; the band and status lines do not vary with
 * it, and the FR-15 shape keeps the five fields.
 */
export const clientView = ({ snapshot, guardsOff, problems, mode, updatedAt, sessionCount = 1 }) => {
  // An absent snapshot reads as "no read yet"; statusLines() accepts null.
  const project = snapshot === undefined ? null : snapshot
  const line = project === null ? null : bandLine(project, guardsOff)
  // FR-12: a second writer in one worktree is named in the band. The shared
  // core text is kept verbatim; the count is the adapter's own suffix.
  const band = line === null || sessionCount < 2 ? line : `${line} · ${sessionCount} sessions`
  return {
    band,
    status: statusLines(project, guardsOff).join('\n'),
    guardsOff,
    problems: [...problems],
    updatedAt,
  }
}

/** The error text of a caught failure; never undefined. */
const errorText = error => {
  if (error instanceof Error) return error.message === '' ? error.name : error.message
  return String(error)
}

/** A JSON response with the given status. */
const jsonResponse = (value, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })

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
      updatedAt: new Date().toISOString(),
    })
    return jsonResponse(view)
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
  return ctx.effect(() =>
    ctx.webServer.register({
      kind: 'exact',
      path: CLIENT_STATE_PATH,
      resource: request => clientStateResponse(deps, request),
    }),
  )
}
