// FR-16, D1: the local service of the comment send. The panel asks this
// service to send one message. The service calls `sessions.send` with the
// constant session id of `src/pm-target.ts`. The service runs no command and
// names no socket of its own. It listens on the loopback address only.
// The module holds no server until it runs as the entry of the process.
import { realpathSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { pathToFileURL } from 'node:url'
import { createServiceHost } from '@openchamber/sdk'
import { PM_SESSION_ID } from '../src/pm-target'
import { SEND_METHOD } from '../src/send'

/** The host of OpenChamber. Its `sessions.send` sends one message. */
export type ServiceHost = {
  sessions: {
    send: (sessionId: string, text: string) => Promise<unknown>
  }
}

/** The most characters of one request body. */
const BODY_MAX = 64_000

/** The answer of the service. A failure names the code of the host. */
type ServiceAnswer = { ok: boolean; code?: string; message?: string }

/** Sends the answer of the service. The body is plain JSON. */
const answer = (response: ServerResponse, status: number, body: ServiceAnswer): void => {
  const text = JSON.stringify(body)
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(text),
  })
  response.end(text)
}

/** True when the request carries the token of this service. */
const authorized = (request: IncomingMessage, token: string): boolean => {
  if (token === '') return false
  return request.headers.authorization === `Bearer ${token}`
}

/** The body of the request as text. A body over the limit is refused. */
const readBody = async (request: IncomingMessage): Promise<string> => {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
    size += buffer.length
    if (size > BODY_MAX) throw new Error('The body is too long.')
    chunks.push(buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** The code of a failed host call. */
const errorCode = (error: unknown): string => {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' && code !== '' ? code : 'HOST_UNAVAILABLE'
}

/** The message of a failed host call. */
const errorMessage = (error: unknown): string => {
  const message = (error as { message?: unknown } | null)?.message
  return typeof message === 'string' && message !== ''
    ? message
    : 'OpenChamber gave no message.'
}

/** D1: the one route of the service. It sends one message to the PM session. */
const sendComment = async (
  host: ServiceHost,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> => {
  let body: { text?: unknown; sessionId?: unknown }
  try {
    const text = await readBody(request)
    const value = JSON.parse(text) as { text?: unknown; sessionId?: unknown }
    body = { text: value.text, sessionId: value.sessionId }
  } catch {
    answer(response, 400, {
      ok: false,
      code: 'BAD_REQUEST',
      message: 'The body is no JSON object.',
    })
    return
  }

  if (typeof body.sessionId === 'string' && body.sessionId !== PM_SESSION_ID) {
    answer(response, 400, {
      ok: false,
      code: 'WRONG_SESSION',
      message: 'The service sends only to the PM session.',
    })
    return
  }

  const text = typeof body.text === 'string' ? body.text : ''
  if (text.trim() === '') {
    answer(response, 400, {
      ok: false,
      code: 'EMPTY_TEXT',
      message: 'The message is empty.',
    })
    return
  }

  try {
    await host.sessions.send(PM_SESSION_ID, text)
    answer(response, 200, { ok: true })
  } catch (error) {
    answer(response, 200, {
      ok: false,
      code: errorCode(error),
      message: errorMessage(error),
    })
  }
}

/**
 * D1: the handler of the service. Every request carries the bearer token of
 * the service, also the health route.
 */
export const createHandler = (
  host: ServiceHost,
  token: string,
): ((request: IncomingMessage, response: ServerResponse) => Promise<void>) => {
  const handle = async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    if (!authorized(request, token)) {
      answer(response, 401, {
        ok: false,
        code: 'NOT_GRANTED',
        message: 'The request carries no token of this service.',
      })
      return
    }
    const path = (request.url ?? '').split('?')[0] ?? ''
    if (request.method === 'GET' && path === '/health') {
      answer(response, 200, { ok: true })
      return
    }
    if (request.method !== 'POST' || path !== `/${SEND_METHOD}`) {
      answer(response, 404, {
        ok: false,
        code: 'NOT_FOUND',
        message: 'The service knows no other route.',
      })
      return
    }
    await sendComment(host, request, response)
  }
  return handle
}

/** True when this file runs as the entry of the process. */
const isEntry = (): boolean => {
  const arg = process.argv[1]
  if (arg === undefined || arg === '') return false
  try {
    return pathToFileURL(realpathSync(arg)).href === import.meta.url
  } catch {
    return false
  }
}

if (isEntry()) {
  const host = createServiceHost({ env: process.env })
  const port = Number(process.env.OPENCHAMBER_SERVICE_PORT ?? '')
  const token = process.env.OPENCHAMBER_SERVICE_TOKEN ?? ''
  if (!Number.isInteger(port) || port <= 0) {
    process.stderr.write('The service needs the port of the host.\n')
    process.exit(1)
  }
  const handle = createHandler(host, token)
  createServer((request, response) => {
    void handle(request, response).catch(() => {
      answer(response, 500, {
        ok: false,
        code: 'HOST_UNAVAILABLE',
        message: 'The service could not answer.',
      })
    })
  }).listen(port, '127.0.0.1')
}
