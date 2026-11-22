// Keep the audit browser inside one heavy-run job. Bound each browser operation to 30 seconds.
import http from 'node:http'
import { spawn } from 'node:child_process'
import { writeFile, appendFile } from 'node:fs/promises'
import { startFixtureServer } from './fixture-server.mjs'
const dir = 'measure/runs/board_focus_reasons_20261121/ux-p2'
const wrapper = '/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh'
const cli = '/home/daniebo/.npm/_npx/6de2aa2fded2970c/node_modules/.bin/agent-browser'
let endpoint = ''
let closing = false
const fixture = process.env.MEASURE_FIXTURE_HARNESS === '1' ? await startFixtureServer() : null
const readyFile = fixture ? 'harness-worker-ready.json' : 'worker-ready.json'
const run = async (kind, args) => {
  const command = kind === 'browser' ? [cli, '--session', 'measure-ux-p2', ...args] : ['node', `${dir}/cdp-step.mjs`, endpoint, ...args]
  const start = new Date().toISOString()
  const result = await new Promise(resolve => {
    const child = spawn(wrapper, ['timeout', '30', ...command], { env: { ...process.env, HEAVY_PRIORITY: 'p1', HEAVY_MIN_AVAIL_MB: '1500' } })
    let output = ''
    child.stdout.on('data', d => { output += d })
    child.stderr.on('data', d => { output += d })
    child.on('error', e => { output += e.message })
    child.on('close', code => resolve({ code, output }))
  })
  await appendFile(`${dir}/steps.jsonl`, JSON.stringify({ start, end: new Date().toISOString(), kind, args, ...result }) + '\n')
  return result
}
const close = async () => {
  if (closing) return
  closing = true
  console.log(JSON.stringify(await run('browser', ['close'])))
  server.close()
  fixture?.server.close()
}
const server = http.createServer(async (req, res) => {
  let body = ''
  for await (const chunk of req) body += chunk
  try {
    const data = JSON.parse(body)
    const result = await run(data.kind, data.args)
    if (data.output) await writeFile(`${dir}/${data.output}`, result.output)
    if (data.kind === 'browser' && data.args[0] === 'get' && data.args[1] === 'cdp-url' && result.code === 0) endpoint = result.output.trim()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(result))
    if (data.done) await close()
  } catch (error) { res.writeHead(500); res.end(JSON.stringify({ error: String(error) })) }
})
const start = await run('browser', ['--args', '--no-sandbox', 'open', fixture?.url ?? 'http://127.0.0.1:38307'])
console.log(start.output)
if (start.code !== 0) { await run('browser', ['close']); process.exit(start.code ?? 1) }
const url = await run('browser', ['get', 'cdp-url'])
endpoint = url.output.match(/wss?:\/\/\S+/)?.[0] ?? url.output.trim()
if (url.code !== 0) { await run('browser', ['close']); process.exit(url.code ?? 1) }
server.listen(0, '127.0.0.1', async () => {
  const state = { port: server.address().port, endpoint, pid: process.pid, started: new Date().toISOString(), fixtureUrl: fixture?.url }
  await writeFile(`${dir}/${readyFile}`, JSON.stringify(state, null, 2) + '\n')
  console.log('AUDIT_BROWSER_READY', JSON.stringify(state))
})
setTimeout(close, 18 * 60 * 1000).unref()
process.on('SIGTERM', close)
