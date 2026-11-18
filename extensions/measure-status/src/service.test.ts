// FR-16, D1: the service answers only with the bearer token and sends one
// message to the PM session. The handler is created with a fake host, so the
// test never reaches OpenChamber and never binds a port.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, test } from 'vitest'
import { createHandler } from '../service/main'
import { PM_SESSION_ID } from './pm-target'

const TOKEN = 'invented-service-token'

type SendCall = { sessionId: string; text: string }

const fakeHost = (): {
  host: { sessions: { send: (sessionId: string, text: string) => Promise<unknown> } }
  calls: SendCall[]
} => {
  const calls: SendCall[] = []
  return {
    calls,
    host: {
      sessions: {
        send: (sessionId: string, text: string) => {
          calls.push({ sessionId, text })
          return Promise.resolve({ sent: true })
        },
      },
    },
  }
}

const request = (
  method: string,
  url: string,
  body: string,
  token?: string,
): IncomingMessage => {
  const headers: Record<string, string> =
    token === undefined ? {} : { authorization: `Bearer ${token}` }
  return {
    method,
    url,
    headers,
    [Symbol.asyncIterator]: async function* () {
      yield Buffer.from(body)
    },
  } as unknown as IncomingMessage
}

const reply = (): { res: ServerResponse; status: () => number | null; body: () => string } => {
  let status: number | null = null
  const chunks: string[] = []
  const res = {
    writeHead: (code: number): void => {
      status = code
    },
    end: (text?: unknown): void => {
      if (typeof text === 'string') chunks.push(text)
    },
  } as unknown as ServerResponse
  return { res, status: () => status, body: () => chunks.join('') }
}

const sendBody = (over: Record<string, unknown> = {}): string =>
  JSON.stringify({ sessionId: PM_SESSION_ID, text: 'Please look', ...over })

describe('the bearer token', () => {
  test('no token gives 401 on /health', async () => {
    const { host } = fakeHost()
    const handle = createHandler(host, TOKEN)
    const out = reply()
    await handle(request('GET', '/health', ''), out.res)
    expect(out.status()).toBe(401)
  })

  test('no token gives 401 on /sendComment', async () => {
    const { host } = fakeHost()
    const handle = createHandler(host, TOKEN)
    const out = reply()
    await handle(request('POST', '/sendComment', sendBody()), out.res)
    expect(out.status()).toBe(401)
  })

  test('a good token on /health gives 200', async () => {
    const { host } = fakeHost()
    const handle = createHandler(host, TOKEN)
    const out = reply()
    await handle(request('GET', '/health', '', TOKEN), out.res)
    expect(out.status()).toBe(200)
  })
})

describe('the send route', () => {
  test('a wrong session id gives 400 and sends nothing', async () => {
    const { host, calls } = fakeHost()
    const handle = createHandler(host, TOKEN)
    const out = reply()
    await handle(
      request('POST', '/sendComment', sendBody({ sessionId: 'another-session' }), TOKEN),
      out.res,
    )
    expect(out.status()).toBe(400)
    expect(calls.length).toBe(0)
  })

  test('bad JSON gives 400', async () => {
    const { host, calls } = fakeHost()
    const handle = createHandler(host, TOKEN)
    const out = reply()
    await handle(request('POST', '/sendComment', '{no json', TOKEN), out.res)
    expect(out.status()).toBe(400)
    expect(calls.length).toBe(0)
  })

  test('a body over 64,000 bytes is refused', async () => {
    const { host, calls } = fakeHost()
    const handle = createHandler(host, TOKEN)
    const out = reply()
    await handle(
      request('POST', '/sendComment', sendBody({ text: 'x'.repeat(65_000) }), TOKEN),
      out.res,
    )
    expect(out.status()).toBe(400)
    expect(calls.length).toBe(0)
  })

  test('an unknown path gives 404', async () => {
    const { host } = fakeHost()
    const handle = createHandler(host, TOKEN)
    const out = reply()
    await handle(request('GET', '/unknown', '', TOKEN), out.res)
    expect(out.status()).toBe(404)
  })

  test('a good request calls the fake host sessions.send once with PM_SESSION_ID', async () => {
    const { host, calls } = fakeHost()
    const handle = createHandler(host, TOKEN)
    const out = reply()
    await handle(request('POST', '/sendComment', sendBody({ text: 'Please look' }), TOKEN), out.res)
    expect(out.status()).toBe(200)
    expect(calls).toEqual([{ sessionId: PM_SESSION_ID, text: 'Please look' }])
  })
})
