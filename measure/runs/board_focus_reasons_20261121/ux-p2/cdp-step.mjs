// Capture the real sandboxed iframe through the audit browser's CDP connection.
import { writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const [endpointText, targetKind, mode, output = '-', expression = 'document.title'] = process.argv.slice(2)
const endpoint = endpointText.match(/wss?:\/\/\S+/)?.[0] ?? endpointText
const base = endpoint.startsWith('ws') ? `http://${new URL(endpoint).host}` : endpoint
const tabs = await (await fetch(`${base}/json/list`)).json()
const target = tabs.find(t => targetKind === 'host' ? t.type === 'page' && (t.url.startsWith('http://127.0.0.1:38307') || t.url.includes('/fixture-harness.html')) : t.type === 'iframe' && t.url.includes('guest-files') && t.url.includes('/panel/'))
if (!target) throw new Error(`The ${targetKind} target is absent.`)
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
let id = 0
const waiting = new Map()
const parsed = []
let onPaused
ws.onmessage = e => { const r = JSON.parse(e.data); if (r.method === 'Debugger.scriptParsed') parsed.push(r.params); if (r.method === 'Debugger.paused') onPaused?.(r.params); if (r.id) { const p = waiting.get(r.id); waiting.delete(r.id); r.error ? p.reject(r.error) : p.resolve(r.result) } }
const call = (method, params = {}) => new Promise((resolve, reject) => { waiting.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) })
const evaluate = async expr => { const r = await call('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value }
let result
if (mode === 'fixture-init') {
  const fixtureBytes = await readFile('extensions/measure-status/mockup/fixtures.json')
  const fixture = JSON.parse(fixtureBytes)
  await call('Debugger.enable')
  const script = parsed.find(s=>s.url.endsWith('/panel/main.js'))
  if (!script) throw new Error('The committed panel script is absent.')
  const source = (await call('Debugger.getScriptSource',{scriptId:script.scriptId})).scriptSource
  const lineNumber = source.split('\n').findIndex(line=>line.includes('applyHostReady(ctx, document.documentElement);'))
  if (lineNumber < 0) throw new Error('The host-ready callback is absent.')
  const breakpoint = await call('Debugger.setBreakpointByUrl',{lineNumber,url:script.url})
  let pausedTimer
  const paused = new Promise((resolve,reject)=>{onPaused=resolve;pausedTimer=setTimeout(()=>reject(new Error('The fixture initialization breakpoint did not run.')),8000)})
  const parent = tabs.find(t=>t.type==='page'&&t.url.includes('/fixture-harness.html'))
  const parentWs = new WebSocket(parent.webSocketDebuggerUrl)
  await new Promise(resolve=>{parentWs.onopen=resolve})
  parentWs.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:'window.sendFixtureReady();true'}}))
  const frame = (await paused).callFrames[0]
  clearTimeout(pausedTimer)
  const seeded = await call('Debugger.evaluateOnCallFrame',{
    callFrameId:frame.callFrameId,returnByValue:true,
    expression:`(() => {
      const fixture=${JSON.stringify(fixture)};
      states=fixture.repos.map(r=>({status:'ready',repo:{id:r.repo,path:'~/Desktop/'+r.repo},board:{repo:r.repo,cards:r.cards}}));
      mountedOnce=true;busy=false;
      const chosen=states.flatMap(s=>s.board.cards).find(c=>c.trackId==='gate_delete-file');
      const input={repo:chosen.repo,trackId:chosen.trackId,taskLine:chosen.taskText??chosen.note??'',blockerLine:chosen.reason,text:'Fixture audit draft'};
      window.__fixtureHarness={seeded:true,fixtureCards:states.flatMap(s=>s.board.cards).length,expectedWaiting:states.flatMap(s=>s.board.cards).filter(c=>c.column==='waiting').length,message:formatComment(input),messageReason:chosen.reason};
      window.__fixturePending=()=>painter.pending();
      void refreshBadge();
      return window.__fixtureHarness;
    })()`
  })
  if (seeded.exceptionDetails) throw new Error(JSON.stringify(seeded.exceptionDetails))
  await call('Debugger.removeBreakpoint',{breakpointId:breakpoint.breakpointId})
  await call('Debugger.resume')
  await call('Debugger.disable')
  parentWs.close()
  result={at:new Date().toISOString(),...seeded.result.value,fixture_sha256:createHash('sha256').update(fixtureBytes).digest('hex'),fixture_bytes:fixtureBytes.length,method:'The debugger seeds the committed fixture cards in the unmodified panel closure before its first ready paint. The harness blocks file, service, and session operations.'}
} else if (mode === 'file') result = await evaluate(await readFile(`measure/runs/board_focus_reasons_20261121/ux-p2/${expression}`, 'utf8'))
else if (mode === 'a11y') result = await call('Accessibility.getFullAXTree')
else if (mode === 'bundle') {
  const source = await evaluate(`({url:new URL(document.querySelector('script[src$="main.js"]').src,location.href).href,resources:performance.getEntriesByType('resource').filter(x=>x.name.includes('main.js')).map(x=>({name:x.name,transferSize:x.transferSize}))})`)
  const response = await fetch(source.url, { cache: 'no-store' })
  const served = Buffer.from(await response.arrayBuffer())
  const local = await readFile('extensions/measure-status/panel/main.js')
  const hash = bytes => createHash('sha256').update(bytes).digest('hex')
  await call('Debugger.enable')
  const script = parsed.find(s => s.url === source.url)
  if (!script) throw new Error('The loaded panel script is absent from the debugger.')
  const loaded = Buffer.from((await call('Debugger.getScriptSource', { scriptId: script.scriptId })).scriptSource)
  const loadedText = loaded.toString('utf8')
  result = { at: new Date().toISOString(), ...source, status: response.status, served_bytes: served.length, loaded_bytes: loaded.length, committed_bytes: local.length, served_sha256: hash(served), loaded_sha256: hash(loaded), committed_sha256: hash(local), identical: served.equals(local) && loaded.equals(local), messageReasonField: loadedText.includes('field2("Reason", input.blockerLine)'), legacyMessageBlockerField: loadedText.includes('field2("Blocker", input.blockerLine)'), messageUsesCardReason: loadedText.includes('blockerLine: card.reason ?? ""') }
} else if (mode === 'monitor') {
  const samples = []
  const state = `(() => { const a=document.querySelector('textarea.comment-input');return {at:new Date().toISOString(),focus:document.activeElement===a,documentFocus:document.hasFocus(),sameNode:a===window.__p2.area,value:a?.value,start:a?.selectionStart,end:a?.selectionEnd,rootChanges:window.__p2.rootChanges,eventCount:window.__p2.events.length,pending:window.__fixturePending?.()} })()`
  for (let i = 0; i < 30; i++) {
    if (i === 10) {
      const parent=tabs.find(t=>t.type==='page'&&t.url.includes('/fixture-harness.html'))
      if (parent) {
        const parentWs=new WebSocket(parent.webSocketDebuggerUrl)
        await new Promise(resolve=>{parentWs.onopen=resolve})
        const dispatched=new Promise(resolve=>{parentWs.onmessage=e=>{if(JSON.parse(e.data).id===1)resolve()}})
        parentWs.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:'window.sendFixtureReady();true'}}))
        await dispatched
        parentWs.close()
      }
    }
    samples.push({ stage: 'before', ...await evaluate(state) })
    for (const p of [{type:'keyDown',key:'x',code:'KeyX',text:'x',windowsVirtualKeyCode:88},{type:'keyUp',key:'x',code:'KeyX',windowsVirtualKeyCode:88}]) await call('Input.dispatchKeyEvent',p)
    samples.push({ stage: 'typed', ...await evaluate(state) })
    for (const p of [{type:'keyDown',key:'Backspace',code:'Backspace',windowsVirtualKeyCode:8},{type:'keyUp',key:'Backspace',code:'Backspace',windowsVirtualKeyCode:8}]) await call('Input.dispatchKeyEvent',p)
    await new Promise(resolve=>setTimeout(resolve,500))
  }
  result = { samples, final: await evaluate(state), events: await evaluate('window.__p2.events') }
} else result = await evaluate(expression)
if (output !== '-') await writeFile(`measure/runs/board_focus_reasons_20261121/ux-p2/${output}`, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(mode === 'a11y' ? { saved: output, nodes: result.nodes.length } : mode === 'file' && result.cards ? { saved:output,cards:result.cards.length,checks:result.checks } : mode === 'monitor' ? { saved: output, samples: result.samples.length, allFocused: result.samples.every(s=>s.focus&&s.documentFocus&&s.sameNode), rootChanges: result.final.rootChanges } : result, null, 2))
ws.close()
