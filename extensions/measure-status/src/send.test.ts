// FR-16, D1: the send path of the comment. Every fixture text is
// invented; no real repo data appears here. The host is a fake. The
// test never calls OpenChamber and never reaches the network. The box
// rules (one Comment button, one open box, Escape, finished-Send close,
// the visible state line) live in ./comment-box.test.ts.
import { describe, expect, test } from 'vitest'
import pkg from '../package.json'
import { formatComment, type CommentInput } from './comment'
import { PM_SESSION_ID } from './pm-target'
import {
  SEND_METHOD,
  SEND_SERVICE,
  createCommentSender,
  formatSendError,
  formatSentLine,
  isSendDisabled,
  type SendHost,
} from './send'

const input = (over: Partial<CommentInput> = {}): CommentInput => ({
  repo: 'invented-repo',
  trackId: 'invented_track_1',
  taskLine: '[~] Task: Write the loader',
  blockerLine: 'Task: Wait for the copy',
  text: 'Please look at column two',
  ...over,
})

type Call = {
  service: string
  method: string
  params: { sessionId: string; text: string }
}

type FakeHost = SendHost & {
  calls: Call[]
  next: () => { resolve: (value: unknown) => void; reject: (error: unknown) => void }
}

const fakeHost = (): FakeHost => {
  const calls: Call[] = []
  let pending: { resolve: (value: unknown) => void; reject: (error: unknown) => void } | null = null
  const host = {
    calls,
    serviceRequest: (service: string, method: string, params: { sessionId: string; text: string }) => {
      calls.push({ service, method, params })
      return new Promise<unknown>((resolve, reject) => {
        pending = { resolve, reject }
      })
    },
    next: () => {
      if (pending === null) throw new Error('no pending send')
      const one = pending
      pending = null
      return one
    },
  }
  return host
}

const okHost = (): SendHost & { calls: Call[] } => {
  const calls: Call[] = []
  const host: SendHost & { calls: Call[] } = {
    calls,
    serviceRequest: (service: string, method: string, params: { sessionId: string; text: string }) => {
      calls.push({ service, method, params })
      return Promise.resolve({ sent: true })
    },
  }
  return host
}

const failingHost = (code: string, message: string): SendHost & { calls: Call[] } => {
  const calls: Call[] = []
  const error = Object.assign(new Error(message), { code })
  const host: SendHost & { calls: Call[] } = {
    calls,
    serviceRequest: (service: string, method: string, params: { sessionId: string; text: string }) => {
      calls.push({ service, method, params })
      return Promise.reject(error)
    },
  }
  return host
}

describe('one send per click', () => {
  test('sends one message for one send call', async () => {
    const host = okHost()
    const sender = createCommentSender(host)
    const result = await sender.send(input())
    expect(result.ok).toBe(true)
    expect(host.calls.length).toBe(1)
  })

  test('sends to the constant PM session id', async () => {
    const host = okHost()
    const sender = createCommentSender(host)
    await sender.send(input())
    expect(host.calls[0]?.params.sessionId).toBe(PM_SESSION_ID)
  })

  test('sends the plain text of formatComment with no HTML', async () => {
    const host = okHost()
    const sender = createCommentSender(host)
    const data = input({
      trackId: '"><script>',
      taskLine: '<img src=x onerror=alert(1)>',
      blockerLine: 'javascript:alert(1)',
      text: 'Please look <b>now</b>',
    })
    await sender.send(data)
    const text = host.calls[0]?.params.text ?? ''
    expect(text).toBe(formatComment(data))
    expect(text).toContain('"><script>')
    expect(text).toContain('<img src=x onerror=alert(1)>')
    expect(text).not.toContain('&lt;')
    expect(text).not.toContain('&gt;')
  })

  test('uses the send service and method of the panel', async () => {
    const host = okHost()
    const sender = createCommentSender(host)
    await sender.send(input())
    expect(host.calls[0]?.service).toBe(SEND_SERVICE)
    expect(host.calls[0]?.method).toBe(SEND_METHOD)
  })
})

describe('empty and long texts', () => {
  test('sends no message for an empty text', async () => {
    const host = okHost()
    const sender = createCommentSender(host)
    await sender.send(input({ text: '' }))
    expect(host.calls.length).toBe(0)
  })

  test('sends no message for a text of only white space', async () => {
    const host = okHost()
    const sender = createCommentSender(host)
    await sender.send(input({ text: '  \n\t ' }))
    expect(host.calls.length).toBe(0)
  })

  test('sends a text of 2000 characters and refuses 2001', async () => {
    const host = okHost()
    const sender = createCommentSender(host)
    await sender.send(input({ text: 'x'.repeat(2000) }))
    expect(host.calls.length).toBe(1)
    await sender.send(input({ text: 'x'.repeat(2001) }))
    expect(host.calls.length).toBe(1)
  })
})

describe('the send button while a send runs', () => {
  test('disables Send while a send runs', async () => {
    const host = fakeHost()
    const sender = createCommentSender(host)
    expect(isSendDisabled('Please look', sender.sending)).toBe(false)
    const pending = sender.send(input())
    expect(sender.sending).toBe(true)
    expect(isSendDisabled('Please look', sender.sending)).toBe(true)
    host.next().resolve({ sent: true })
    await pending
    expect(sender.sending).toBe(false)
  })

  test('gives no second send for a second call during a send', async () => {
    const host = fakeHost()
    const sender = createCommentSender(host)
    const first = sender.send(input())
    const second = sender.send(input({ text: 'A second click' }))
    host.next().resolve({ sent: true })
    await first
    const refused = await second
    expect(refused.ok).toBe(false)
    expect(host.calls.length).toBe(1)
  })
})

describe('the sent and error states', () => {
  test('shows the sent HH:MM state after a send', async () => {
    const host = okHost()
    const sender = createCommentSender(host)
    const result = await sender.send(input())
    expect(result.ok).toBe(true)
    if (result.ok !== true) throw new Error('the send must pass')
    expect(formatSentLine(result.sentAt)).toMatch(/^sent \d\d:\d\d$/)
    // The line shows the local time of the page, not UTC.
    const stamp = Date.UTC(2026, 10, 18, 5, 50)
    const local = new Date(stamp)
    const pad = (n: number): string => String(n).padStart(2, '0')
    expect(formatSentLine(stamp)).toBe(`sent ${pad(local.getHours())}:${pad(local.getMinutes())}`)
    expect(result.line).toBe(formatSentLine(result.sentAt))
  })

  test('shows the error text of a failure', async () => {
    const host = failingHost('NOT_GRANTED', 'Access denied')
    const sender = createCommentSender(host)
    const result = await sender.send(input())
    expect(result.ok).toBe(false)
    if (result.ok !== false || result.reason !== 'send-failed') throw new Error('the send must fail')
    expect(result.code).toBe('NOT_GRANTED')
    expect(result.line).toContain('NOT_GRANTED')
    expect(result.line).toContain('Access denied')
    expect(result.line).toBe(formatSendError('NOT_GRANTED', 'Access denied'))
  })

  test('makes no retry after a failure', async () => {
    const host = failingHost('NOT_GRANTED', 'Access denied')
    const sender = createCommentSender(host)
    await sender.send(input())
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(host.calls.length).toBe(1)
    expect(sender.sending).toBe(false)
  })
})

describe('the manifest grant of the send path', () => {
  test('declares the local service with the built entry', () => {
    const contributes = (pkg as unknown as { openchamber: { contributes: Record<string, unknown> } }).openchamber.contributes
    expect(contributes['service']).toBeDefined()
    expect(JSON.stringify(contributes['service'])).toContain('service/main.js')
  })

  test('declares the session control of the PM session', () => {
    const contributes = (pkg as unknown as { openchamber: { contributes: Record<string, unknown> } }).openchamber.contributes
    expect(contributes['sessionControl']).toBeDefined()
  })

  test('adds no exec or socket permission', () => {
    const text = JSON.stringify((pkg as unknown as { openchamber: unknown }).openchamber)
    expect(text).not.toContain('exec')
    expect(text).not.toContain('socket')
  })
})
