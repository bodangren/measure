// Task 3.4: adversarial tests of the board renderer and the D1 send path.
// Every fixture text is invented; no real repo data appears here. The file
// covers hostile titles, hostile task texts, hostile attribute values, a
// 5,000-card board, the reload race, hostile comment text, and hostile
// service requests. The panel file needs the SDK and the DOM, so its load
// guard is pinned as source text.
import type { IncomingMessage, ServerResponse } from 'node:http'
import { describe, expect, test } from 'vitest'
import { createHandler, type ServiceHost } from '../service/main'
import { buildBoard, type Card, type TrackInput } from './board'
import { canSendComment, COMMENT_TEXT_MAX, formatComment, type CommentInput } from './comment'
import {
  emptyCommentBox,
  finishCommentSend,
  openCommentBox,
  setCommentText,
  startCommentSend,
} from './comment-box'
import { shouldReload, type RepoState } from './load'
import { applyRepoResult, startLoad } from './page-state'
import { parsePlan } from './parse'
import { PM_SESSION_ID } from './pm-target'
import { cardKey, idleComment, renderCard, renderPage, renderSection, type CommentUi, type UiState } from './render'
import { ROSTER, type RosterRepo } from './roster'
import { createCommentSender, isSendDisabled, type SendHost } from './send'

const NOW = 1_800_000_000_000
const DAY = 86_400_000

const ui = (over: Partial<UiState> = {}): UiState => ({
  open: {},
  doneOpen: {},
  expanded: {},
  ...over,
})

const input = (over: Partial<TrackInput> = {}): TrackInput => ({
  repo: 'invented-hostile',
  title: 'Invented track',
  registryMarker: ' ',
  folder: 'tracks/invented_1',
  plan: { kind: 'plan', plan: parsePlan('## Phase 1: Work\n\n- [~] Task: Work\n') },
  lastChange: NOW - DAY,
  doneDate: null,
  doneSource: null,
  now: NOW,
  ...over,
})

const cardOf = (over: Partial<TrackInput> = {}): Card => buildBoard('invented-hostile', [input(over)]).cards[0] as Card

/** FR-14: only a Waits for Daniel card shows the Comment button. */
const danielCardOf = (): Card =>
  cardOf({
    registryMarker: ' ',
    plan: {
      kind: 'plan',
      plan: parsePlan(
        '## Phase 1: Work\n\n- [x] Task: One `aaaaaaa`\n- [b] Task: Pay the bill deferred:spend Task NjBxVXEzVDVVQzJzZ0pKTg\n',
      ),
    },
  })

const repo = (id: string): RosterRepo => ({ id, path: `~/Desktop/${id}` })

const readyOf = (id: string, title: string): RepoState => ({
  status: 'ready',
  repo: repo(id),
  board: buildBoard(id, [input({ repo: id, title })]),
})

const countIn = (html: string, probe: string): number => html.split(probe).length - 1

// ----- The send path fakes. No test calls OpenChamber and no test binds a port.

type SendCall = { service: string; method: string; params: { sessionId: string; text: string } }

const okHost = (): SendHost & { calls: SendCall[] } => {
  const calls: SendCall[] = []
  return {
    calls,
    serviceRequest: (service: string, method: string, params: { sessionId: string; text: string }) => {
      calls.push({ service, method, params })
      return Promise.resolve({ sent: true })
    },
  }
}

/** Holds every send open until the test releases it. */
const deferredHost = (): SendHost & { calls: SendCall[]; release: () => void } => {
  const calls: SendCall[] = []
  let resolve: ((value: unknown) => void) | null = null
  return {
    calls,
    release: () => {
      resolve?.({ sent: true })
      resolve = null
    },
    serviceRequest: (service: string, method: string, params: { sessionId: string; text: string }) => {
      calls.push({ service, method, params })
      return new Promise<unknown>(pending => {
        resolve = pending
      })
    },
  }
}

const comment = (over: Partial<CommentInput> = {}): CommentInput => ({
  repo: 'invented-repo',
  trackId: 'invented_track_1',
  taskLine: '[~] Task: Write the loader',
  blockerLine: 'Task: Wait for the copy',
  text: 'Please look at column two',
  ...over,
})

// ----- The service fakes. The handler runs against a fake host.

const TOKEN = 'invented-service-token'

const fakeServiceHost = (): { host: ServiceHost; calls: Array<{ sessionId: string; text: string }> } => {
  const calls: Array<{ sessionId: string; text: string }> = []
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

/** Holds every send open until the test releases one send after the other. */
const slowServiceHost = (): {
  host: ServiceHost
  calls: Array<{ sessionId: string; text: string }>
  releaseOne: () => void
} => {
  const calls: Array<{ sessionId: string; text: string }> = []
  const pending: Array<(value: unknown) => void> = []
  return {
    calls,
    releaseOne: () => {
      pending.shift()?.({ sent: true })
    },
    host: {
      sessions: {
        send: (sessionId: string, text: string) => {
          calls.push({ sessionId, text })
          return new Promise<unknown>(settle => {
            pending.push(settle)
          })
        },
      },
    },
  }
}

type ReqOpts = { token?: string; authLine?: string; slow?: boolean }

const req = (method: string, url: string, chunks: readonly string[], opts: ReqOpts = {}): IncomingMessage => {
  const headers: Record<string, string> = {}
  if (opts.authLine !== undefined) headers.authorization = opts.authLine
  else if (opts.token !== undefined) headers.authorization = `Bearer ${opts.token}`
  return {
    method,
    url,
    headers,
    [Symbol.asyncIterator]: async function* () {
      for (const chunk of chunks) {
        if (opts.slow === true) await new Promise(resolve => setTimeout(resolve, 2))
        yield Buffer.from(chunk)
      }
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

const bodyOf = (over: Record<string, unknown> = {}): string =>
  JSON.stringify({ sessionId: PM_SESSION_ID, text: 'Please look', ...over })

describe('hostile titles and task texts in the renderer', () => {
  test('keeps a hostile title and a hostile task text as literal text', () => {
    const img = '<img src=x onerror=alert(1)>'
    const taskText = 'javascript:alert(1)"><script>x</script>'
    const board = buildBoard('invented-hostile', [
      input({ title: img, plan: { kind: 'plan', plan: parsePlan(`## Phase 1: Work\n\n- [~] ${taskText}\n`) } }),
    ])
    const state: RepoState = { status: 'ready', repo: repo('invented-hostile'), board }
    const html = renderSection(state, ui(), NOW)
    // The escaped text keeps the hostile words as visible characters. The
    // raw-tag probes prove that no element and no script tag was written.
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;img')
    expect(html).toContain('javascript:alert(1)')
  })

  test('adds no second refresh button for a title that holds a button', () => {
    const fake = '<button data-action="refresh">Fake</button>'
    const board = buildBoard('invented-hostile', [
      input({ title: fake }),
      input({ title: 'javascript:alert(1)//', folder: 'tracks/invented_2' }),
    ])
    const html = renderPage({
      states: [{ status: 'ready', repo: repo('invented-hostile'), board }],
      ui: ui({ open: { 'invented-hostile': true } }),
      now: NOW,
      busy: false,
    })
    expect(countIn(html, 'data-action="refresh"')).toBe(1)
    expect(html).not.toContain(fake)
    expect(html).toContain('javascript:alert(1)//')
    expect(html).not.toContain('href')
  })

  test('renders a very long word whole in the card text and the title attribute', () => {
    const word = 'w'.repeat(10_000)
    const start = Date.now()
    const html = renderCard(cardOf({ title: word }), NOW)
    const elapsedMs = Date.now() - start
    expect(countIn(html, word)).toBe(2)
    expect(html).toContain(`title="${word}"`)
    expect(html.length).toBeGreaterThan(10_000)
    expect(elapsedMs).toBeLessThan(1_000)
  })

  test('renders right-to-left text literally and runs no script', () => {
    const rtl = '\u202Eعنوان مخترع\u202C<script>rtl'
    const html = renderCard(cardOf({ title: rtl }), NOW)
    expect(html).toContain('\u202E')
    expect(html).toContain('عنوان مخترع')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  test('caps 5,000 blocked cards at 8 with a Show 4992 more button', () => {
    const inputs: TrackInput[] = Array.from({ length: 5_000 }, (_value, index): TrackInput => ({
      repo: 'invented-hostile',
      title: `Card ${index}`,
      registryMarker: 'b',
      folder: `tracks/invented_${index}`,
      plan: { kind: 'missing' },
      lastChange: NOW - DAY,
      doneDate: null,
      doneSource: null,
      now: NOW,
    }))
    const board = buildBoard('invented-hostile', inputs)
    expect(board.cards.filter(card => card.column === 'blocked').length).toBe(5_000)
    const state: RepoState = { status: 'ready', repo: repo('invented-hostile'), board }

    const start = Date.now()
    const html = renderSection(state, ui(), NOW)
    const elapsedMs = Date.now() - start
    expect(countIn(html, 'data-card')).toBe(8)
    expect(html).toContain('Show 4992 more')
    expect(html).toContain('data-action="show-more"')
    expect(html).toContain('5000 Waits for PM')
    expect(elapsedMs).toBeLessThan(10_000)

    const page = renderPage({ states: [state], ui: ui(), now: NOW, busy: false })
    expect(page).toContain('5000 Waits for PM')
  })

  test('renders all 5,000 cards when the column is expanded', () => {
    const inputs: TrackInput[] = Array.from({ length: 5_000 }, (_value, index): TrackInput => ({
      repo: 'invented-hostile',
      title: `Card ${index}`,
      registryMarker: 'b',
      folder: `tracks/invented_${index}`,
      plan: { kind: 'missing' },
      lastChange: NOW - DAY,
      doneDate: null,
      doneSource: null,
      now: NOW,
    }))
    const board = buildBoard('invented-hostile', inputs)
    const state: RepoState = { status: 'ready', repo: repo('invented-hostile'), board }
    const html = renderSection(state, ui({ expanded: { 'invented-hostile/blocked': true } }), NOW)
    expect(countIn(html, 'data-card')).toBe(5_000)
    expect(html).not.toContain('Show 4992 more')
  })

  test('caps the open Done group of 5,000 done cards at five with the count line', () => {
    const inputs: TrackInput[] = Array.from({ length: 5_000 }, (_value, index): TrackInput => ({
      repo: 'invented-done',
      title: `Done ${index}`,
      registryMarker: 'x',
      folder: `archive/invented_${index}`,
      plan: { kind: 'missing' },
      lastChange: NOW - DAY,
      doneDate: null,
      doneSource: null,
      now: NOW,
    }))
    const board = buildBoard('invented-done', inputs)
    const state: RepoState = { status: 'ready', repo: repo('invented-done'), board }
    const html = renderSection(
      state,
      ui({ doneOpen: { 'invented-done': true }, doneGroupOpen: { 'invented-done': true } }),
      NOW,
    )
    expect(countIn(html, 'data-card')).toBe(5)
    expect(html).toContain('4995 more done, 5000 archived')
  })
})

describe('hostile attribute values', () => {
  test('escapes a hostile repo id in data-repo', () => {
    const state = readyOf('x"><script>&', 'Invented track')
    const html = renderSection(state, ui(), NOW)
    expect(html).toContain('data-repo="x&quot;&gt;&lt;script&gt;&amp;"')
    expect(html).not.toContain('data-repo="x">')
    const page = renderPage({ states: [state], ui: ui(), now: NOW, busy: false })
    expect(page).toContain('data-repo="x&quot;&gt;&lt;script&gt;&amp;"')
    expect(page).not.toContain('data-repo="x"><script>')
  })

  test('escapes a hostile card key in data-key', () => {
    const hostileKey = 'invented-hostile/"><script>&'
    const open: CommentUi = { status: 'idle', sentAt: null, error: null, open: true, disabled: false }
    const html = renderCard(danielCardOf(), NOW, open, hostileKey)
    expect(html).toContain('data-key="invented-hostile/&quot;&gt;&lt;script&gt;&amp;"')
    expect(html).not.toContain('data-key="invented-hostile/"><script>')
    expect(html).toContain('data-action="send-comment"')
  })

  test('escapes a quote-injection attempt in the title attribute', () => {
    const html = renderCard(cardOf({ title: 'x" onmouseover="alert(1)' }), NOW)
    expect(html).toContain('title="x&quot; onmouseover=&quot;alert(1)"')
    expect(html).not.toContain('onmouseover="alert(1)')
  })
})

describe('a Refresh press and a timer tick while a load runs', () => {
  test('gives no second load for a tick while a load runs', () => {
    // load.test.ts pins the function. This line anchors the race of this file.
    expect(shouldReload(true, true)).toBe(false)
    expect(shouldReload(false, true)).toBe(false)
  })

  test('a repeated startLoad keeps the ready board and starts no duplicate work', () => {
    const ready = readyOf('measure', 'Invented measure track')
    const first = startLoad([ready])
    const second = startLoad(first)
    const third = startLoad(second)
    for (const next of [first, second, third]) {
      expect(next.length).toBe(ROSTER.length)
      expect(next.filter(one => one.repo.id === 'measure').length).toBe(1)
      const kept = next.find(one => one.repo.id === 'measure')
      if (kept?.status !== 'ready') throw new Error('the ready board must stay')
      expect(kept.board.cards.map(card => card.title)).toEqual(['Invented measure track'])
      for (const one of next.filter(state => state.repo.id !== 'measure')) {
        expect(one.status).toBe('loading')
      }
    }
  })

  test('a late repo result lands while the other repos keep their boards', () => {
    const prior = startLoad([readyOf('Workbooks', 'Invented workbook track')])
    const next = applyRepoResult(prior, 'measure', readyOf('measure', 'Invented measure track'))
    const measure = next.find(one => one.repo.id === 'measure')
    const workbooks = next.find(one => one.repo.id === 'Workbooks')
    if (measure?.status !== 'ready' || workbooks?.status !== 'ready') {
      throw new Error('both boards must be ready')
    }
    expect(measure.board.cards.map(card => card.title)).toEqual(['Invented measure track'])
    expect(workbooks.board.cards.map(card => card.title)).toEqual(['Invented workbook track'])
  })

  test('a late result of an unknown repo id lands once at the end', () => {
    const prior = startLoad([])
    const hostileId = 'x"><script>&'
    const next = applyRepoResult(prior, hostileId, readyOf(hostileId, 'Invented track'))
    expect(next.length).toBe(ROSTER.length + 1)
    expect(next.filter(one => one.repo.id === hostileId).length).toBe(1)
  })

  test('a duplicate ready state of one repo collapses to one entry, last wins', () => {
    const first = readyOf('measure', 'First invented track')
    const second = readyOf('measure', 'Second invented track')
    const next = startLoad([first, second])
    const kept = next.filter(one => one.repo.id === 'measure')
    expect(kept.length).toBe(1)
    if (kept[0]?.status !== 'ready') throw new Error('the ready board must stay')
    expect(kept[0].board.cards.map(card => card.title)).toEqual(['Second invented track'])
  })
})

describe('the panel load guard', () => {
  const sources = import.meta.glob(['../panel/main.ts'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>

  // The panel file imports the SDK and touches `document` at module scope,
  // so no Node test can import it. These pins hold the guard as source text.
  const panelText = (): string => sources['../panel/main.ts'] ?? ''

  test('holds the busy guard in the load function', () => {
    expect(panelText()).toMatch(/if \(busy\) return/)
  })

  test('gates the timer tick on shouldReload with the busy flag', () => {
    expect(panelText()).toMatch(/shouldReload\(document\.visibilityState === 'visible', busy\)/)
  })

  test('routes the Refresh button to the load function', () => {
    expect(panelText()).toMatch(/action === 'refresh'[\s\S]{0,40}void loadBoard\(\)/)
  })

  test('turns the Send button off through isSendDisabled while a send runs', () => {
    expect(panelText()).toMatch(/isSendDisabled\(/)
  })
})

describe('hostile comment text on the send path', () => {
  test('sends hostile HTML comment text as plain text to the PM session', async () => {
    const hostile = '<img src=x onerror=alert(1)>"><script>'
    const data = comment({ text: hostile, trackId: '"><script>' })
    const host = okHost()
    const result = await createCommentSender(host).send(data)
    expect(result.ok).toBe(true)
    expect(host.calls.length).toBe(1)
    const text = host.calls[0]?.params.text ?? ''
    expect(text).toBe(formatComment(data))
    expect(text).toContain(hostile)
    expect(text).not.toContain('&lt;')
    expect(host.calls[0]?.params.sessionId).toBe(PM_SESSION_ID)
  })

  test('accepts a text of 2000 characters and refuses 2001 with no host call', async () => {
    const host = okHost()
    const sender = createCommentSender(host)
    const okResult = await sender.send(comment({ text: 'x'.repeat(COMMENT_TEXT_MAX) }))
    expect(okResult.ok).toBe(true)
    expect(host.calls.length).toBe(1)
    const long = await sender.send(comment({ text: 'x'.repeat(COMMENT_TEXT_MAX + 1) }))
    expect(long).toMatchObject({
      ok: false,
      reason: 'too-long',
      code: 'TEXT_TOO_LONG',
      line: `Use ${COMMENT_TEXT_MAX} characters or fewer.`,
    })
    expect(host.calls.length).toBe(1)
  })

  test('refuses a text of only white space with no host call', async () => {
    const host = okHost()
    const result = await createCommentSender(host).send(comment({ text: ' \n\t\u00a0 ' }))
    expect(result).toMatchObject({
      ok: false,
      reason: 'empty-text',
      code: 'EMPTY_TEXT',
      line: 'Write a comment first.',
    })
    expect(host.calls.length).toBe(0)
  })

  // Boundary, pinned: a text of only C0 controls, bidi marks, or
  // zero-width characters must refuse the send. Green owns the visible
  // character rule in canSendComment and isSendDisabled.
  test('refuses a text of only control characters', async () => {
    const controls = '\u0000\u0007\u0001\u202E\u200B'
    expect(canSendComment(controls)).toBe(false)
    expect(isSendDisabled(controls, false)).toBe(true)
    const host = okHost()
    const result = await createCommentSender(host).send(comment({ text: controls }))
    expect(result.ok).toBe(false)
    expect(host.calls.length).toBe(0)
  })
})

describe('two Send clicks during one send', () => {
  test('refuses the second click and takes the third after the first ends', async () => {
    const host = deferredHost()
    const sender = createCommentSender(host)
    const first = sender.send(comment())
    const second = await sender.send(comment({ text: 'A second click' }))
    expect(second).toMatchObject({
      ok: false,
      reason: 'busy',
      code: 'BUSY',
      line: 'A comment is already on its way.',
    })
    expect(host.calls.length).toBe(1)
    host.release()
    expect((await first).ok).toBe(true)
    expect(sender.sending).toBe(false)

    const third = sender.send(comment({ text: 'A third click' }))
    host.release()
    expect((await third).ok).toBe(true)
    expect(host.calls.length).toBe(2)
  })

  test('the comment box keeps the last outcome of a double-click send', () => {
    const key = 'invented-repo/invented_1'
    // The panel calls the sender first and marks the send after, so the
    // refusal of the second click lands before the first send ends.
    let state = emptyCommentBox()
    state = openCommentBox(state, key)
    state = setCommentText(state, key, 'Please look')
    state = startCommentSend(state, key)
    state = startCommentSend(state, key)
    state = finishCommentSend(state, key, {
      ok: false,
      error: 'BUSY: A comment is already on its way.',
    })
    state = finishCommentSend(state, key, { ok: true, sentAt: NOW })
    expect(state.openKey).toBeNull()
    expect(state.status[key]).toMatchObject({ status: 'sent', sentAt: NOW })

    // The reverse order keeps the error line.
    let other = emptyCommentBox()
    other = openCommentBox(other, key)
    other = startCommentSend(other, key)
    other = startCommentSend(other, key)
    other = finishCommentSend(other, key, { ok: true, sentAt: NOW })
    other = finishCommentSend(other, key, {
      ok: false,
      error: 'BUSY: A comment is already on its way.',
    })
    expect(other.status[key]).toMatchObject({ status: 'error', sentAt: null })
  })

  test('the service answers two concurrent slow sends without cross-talk', async () => {
    const slow = slowServiceHost()
    const handle = createHandler(slow.host, TOKEN)
    const outFirst = reply()
    const outSecond = reply()
    const outHealth = reply()
    const first = handle(
      req('POST', '/sendComment', [JSON.stringify({ text: 'First click' })], { token: TOKEN }),
      outFirst.res,
    )
    const second = handle(
      req('POST', '/sendComment', [JSON.stringify({ text: 'Second click' })], { token: TOKEN }),
      outSecond.res,
    )
    await new Promise(resolve => setTimeout(resolve, 5))
    expect(outFirst.status()).toBeNull()
    expect(outSecond.status()).toBeNull()

    // The health route answers while both sends still run.
    await handle(req('GET', '/health', [], { token: TOKEN }), outHealth.res)
    expect(outHealth.status()).toBe(200)

    slow.releaseOne()
    slow.releaseOne()
    await first
    await second
    expect(outFirst.status()).toBe(200)
    expect(outSecond.status()).toBe(200)
    expect(slow.calls.map(one => one.text)).toEqual(['First click', 'Second click'])
    expect(slow.calls.every(one => one.sessionId === PM_SESSION_ID)).toBe(true)
  })
})

describe('service requests with hostile tokens and bodies', () => {
  test('refuses a wrong token, a case-variant scheme, and a query-string token', async () => {
    const { host, calls } = fakeServiceHost()
    const handle = createHandler(host, TOKEN)

    const wrong = reply()
    await handle(req('POST', '/sendComment', [bodyOf()], { token: 'a-wrong-token' }), wrong.res)
    expect(wrong.status()).toBe(401)

    const lower = reply()
    await handle(req('POST', '/sendComment', [bodyOf()], { authLine: `bearer ${TOKEN}` }), lower.res)
    expect(lower.status()).toBe(401)

    const query = reply()
    await handle(
      req('POST', `/sendComment?token=${TOKEN}&authorization=Bearer%20${TOKEN}`, [bodyOf()]),
      query.res,
    )
    expect(query.status()).toBe(401)
    expect(calls.length).toBe(0)
  })

  test('refuses every request when the service token is empty', async () => {
    const { host, calls } = fakeServiceHost()
    const handle = createHandler(host, '')
    const out = reply()
    await handle(req('POST', '/sendComment', [bodyOf()], { authLine: 'Bearer ' }), out.res)
    expect(out.status()).toBe(401)
    const health = reply()
    await handle(req('GET', '/health', [], { authLine: 'Bearer ' }), health.res)
    expect(health.status()).toBe(401)
    expect(calls.length).toBe(0)
  })

  test('concatenates a chunked body within the limit', async () => {
    const { host, calls } = fakeServiceHost()
    const handle = createHandler(host, TOKEN)
    const body = JSON.stringify({ sessionId: PM_SESSION_ID, text: 'Please look at the board' })
    const out = reply()
    await handle(
      req('POST', '/sendComment', [body.slice(0, 10), body.slice(10, 30), body.slice(30)], {
        token: TOKEN,
      }),
      out.res,
    )
    expect(out.status()).toBe(200)
    expect(calls).toEqual([{ sessionId: PM_SESSION_ID, text: 'Please look at the board' }])
  })

  test('refuses a chunked body over the limit across chunks', async () => {
    const { host, calls } = fakeServiceHost()
    const handle = createHandler(host, TOKEN)
    const chunks = Array.from({ length: 100 }, () => 'y'.repeat(700))
    expect(chunks.reduce((sum, one) => sum + one.length, 0)).toBe(70_000)
    const out = reply()
    await handle(req('POST', '/sendComment', chunks, { token: TOKEN }), out.res)
    expect(out.status()).toBe(400)
    expect(calls.length).toBe(0)
  })

  test('answers a slow body only after the last chunk', async () => {
    const { host, calls } = fakeServiceHost()
    const handle = createHandler(host, TOKEN)
    const body = bodyOf({ text: 'A slow body' })
    const out = reply()
    const pending = handle(
      req('POST', '/sendComment', [body.slice(0, 20), body.slice(20)], {
        token: TOKEN,
        slow: true,
      }),
      out.res,
    )
    await new Promise(resolve => setTimeout(resolve, 3))
    expect(calls.length).toBe(0)
    expect(out.status()).toBeNull()
    await pending
    expect(out.status()).toBe(200)
    expect(calls.map(one => one.text)).toEqual(['A slow body'])
  })

  test('refuses a huge single-chunk body', async () => {
    const { host, calls } = fakeServiceHost()
    const handle = createHandler(host, TOKEN)
    const out = reply()
    await handle(
      req('POST', '/sendComment', [JSON.stringify({ sessionId: PM_SESSION_ID, text: 'z'.repeat(200_000) })], {
        token: TOKEN,
      }),
      out.res,
    )
    expect(out.status()).toBe(400)
    expect(calls.length).toBe(0)
  })

  test('refuses a JSON body that is no object or no string text', async () => {
    const { host, calls } = fakeServiceHost()
    const handle = createHandler(host, TOKEN)
    for (const body of ['null', '"just text"', '[1,2]', JSON.stringify({ text: 5 })]) {
      const out = reply()
      await handle(req('POST', '/sendComment', [body], { token: TOKEN }), out.res)
      expect(out.status()).toBe(400)
    }
    expect(calls.length).toBe(0)
  })

  test('refuses a fake session id and keeps the constant target', async () => {
    const { host, calls } = fakeServiceHost()
    const handle = createHandler(host, TOKEN)

    const fake = reply()
    await handle(
      req('POST', '/sendComment', [bodyOf({ sessionId: 'ses_fake_"><script>' })], { token: TOKEN }),
      fake.res,
    )
    expect(fake.status()).toBe(400)
    expect(fake.body()).toContain('WRONG_SESSION')
    expect(calls.length).toBe(0)

    const absent = reply()
    await handle(req('POST', '/sendComment', [bodyOf({ sessionId: undefined, text: 'No id' })], {
      token: TOKEN,
    }), absent.res)
    expect(absent.status()).toBe(200)

    const nonString = reply()
    await handle(req('POST', '/sendComment', [bodyOf({ sessionId: 5, text: 'Number id' })], {
      token: TOKEN,
    }), nonString.res)
    expect(nonString.status()).toBe(200)
    expect(calls.every(one => one.sessionId === PM_SESSION_ID)).toBe(true)
    expect(calls.map(one => one.text)).toEqual(['No id', 'Number id'])
  })
})

describe('the card key and the comment state of a card with no folder', () => {
  test('names a card with no folder by its place', () => {
    const noFolder = cardOf({ folder: null })
    expect(noFolder.trackId).toBe('')
    expect(cardKey(noFolder, 3)).toBe('invented-hostile/entry-3')
    const named = cardOf({ folder: 'tracks/named_1' })
    expect(cardKey(named, 0)).toBe('invented-hostile/named_1')
    // The idle state keeps the box closed and the Send button off.
    const idle = idleComment()
    const html = renderCard(danielCardOf(), NOW, idle, 'k')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('<textarea')
  })
})
