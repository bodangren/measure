#!/usr/bin/env node
// Test-only helper for the DSH Measure isolated-session rehearsal.
//
// It calls the running web host's session RPC over the same-origin HTTP
// transport: POST /api/<namespace>/<method> with a client-request envelope.
// The GUI's auth is a cookie; the operator exports it as DSH_WEB_COOKIE. The
// helper never prints, logs, or writes the cookie, and reports only whether it
// was present.
//
// Usage:
//   node host-api.mjs list
//   node host-api.mjs create <cwd>
//   node host-api.mjs prompt <sessionId> <text>
//   node host-api.mjs events <sessionId> [maxMessages]
//
// Exit codes: 0 on a successful RPC, 1 on a missing cookie or a failed RPC,
// 2 on usage errors.

const USAGE = "usage: host-api.mjs list | create <cwd> | prompt <sessionId> <text> | events <sessionId> [maxMessages]"
const BASE = process.env.DSH_WEB_URL ?? 'http://127.0.0.1:3080'
const COOKIE = process.env.DSH_WEB_COOKIE ?? ''

const fail = (message, code = 1) => {
  process.stderr.write(`host-api: ${message}\n`)
  process.exit(code)
}

if (COOKIE === '') fail('DSH_WEB_COOKIE is not set (export the GUI session cookie; it is never echoed)', 1)

const [command, ...rest] = process.argv.slice(2)
const rpc = async (method, request) => {
  const response = await fetch(`${BASE}/api/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: COOKIE },
    body: JSON.stringify({
      type: 'client-request',
      rpcId: crypto.randomUUID(),
      method,
      payload: { args: { request } },
    }),
  })
  const body = await response.text()
  let json = null
  try {
    json = JSON.parse(body)
  } catch {
    json = null
  }
  const ok = json?.result?.ok === true
  const error = json?.result?.error ?? null
  if (!response.ok || (json !== null && !ok)) {
    fail(`${method}: HTTP ${response.status}${error ? ` ${JSON.stringify(error)}` : ''}`)
  }
  return { status: response.status, value: json?.result?.value ?? null }
}

const main = async () => {
  if (command === 'list') {
    const { status, value } = await rpc('session/list', {})
    const items = (value?.items ?? []).map(item => ({ sessionId: item.sessionId, cwd: item.cwd ?? null, running: item.running ?? null }))
    process.stdout.write(`${JSON.stringify({ status, items })}\n`)
    return
  }
  if (command === 'create') {
    const cwd = rest[0]
    if (!cwd) fail(USAGE, 2)
    const { status, value } = await rpc('session/create', { cwd })
    process.stdout.write(`${JSON.stringify({ status, sessionId: value?.sessionId ?? null })}\n`)
    return
  }
  if (command === 'prompt') {
    const [sessionId, text] = rest
    if (!sessionId || !text) fail(USAGE, 2)
    const { status } = await rpc('session/prompt', { requestId: crypto.randomUUID(), sessionId, mode: 'queue', content: [{ type: 'text', text }] })
    process.stdout.write(`${JSON.stringify({ status, accepted: true })}\n`)
    return
  }
  if (command === 'events') {
    const [sessionId, maxMessages] = rest
    if (!sessionId) fail(USAGE, 2)
    const { status, value } = await rpc('session/events', { address: { kind: 'session', sessionId }, maxMessages: Number(maxMessages ?? 200) })
    process.stdout.write(`${JSON.stringify({ status, cursor: value?.cursor ?? null, records: (value?.records ?? []).length })}\n`)
    return
  }
  fail(USAGE, 2)
}

main().catch(error => fail(String(error?.message ?? error), 1))
