// Read the audit browser through CDP. This helper changes no implementation file.
import { writeFile } from 'node:fs/promises'
const [endpoint, mode = 'state', output, seconds = '72'] = process.argv.slice(2)
const base = endpoint.startsWith('ws') ? `http://${new URL(endpoint).host}` : endpoint
const tabs = await (await fetch(`${base}/json/list`)).json()
if (mode === 'targets') { console.log(JSON.stringify(tabs, null, 2)); process.exit(0) }
const target = tabs.find(t => mode.startsWith('host') ? t.type === 'page' && t.url.startsWith('http://127.0.0.1:38307') : t.type === 'iframe' && t.url.includes('guest-files'))
if (!target) throw new Error('The audit target is absent.')
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => { ws.onopen = resolve })
let id = 0
const waiting = new Map()
ws.onmessage = e => { const r = JSON.parse(e.data); if (r.id) { const p = waiting.get(r.id); waiting.delete(r.id); r.error ? p.reject(r.error) : p.resolve(r.result) } }
const call = (method, params = {}) => new Promise((resolve, reject) => { waiting.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) })
const evaluate = async expression => { const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value }
const read = `(() => { const a = document.querySelector('textarea.comment-input'); return { at: new Date().toISOString(), url: location.href, active: document.activeElement?.tagName, focus: !!a && document.activeElement === a, documentFocus: document.hasFocus(), value: a?.value, start: a?.selectionStart, end: a?.selectionEnd, sameNode: !!a && a === window.__uxAudit?.area, rootChanges: window.__uxAudit?.rootChanges, events: window.__uxAudit?.events, refresh: document.querySelector('[data-action="refresh"]')?.textContent.trim(), width: innerWidth, scrollWidth: document.documentElement.scrollWidth }; })()`
let result
if (mode === 'eval' || mode === 'host-eval') {
  result = await evaluate(seconds)
} else if (mode === 'setup') {
  await evaluate(`(() => {
    const area = document.querySelector('textarea.comment-input');
    if (!area) throw new Error('The comment box is absent.');
    const audit = window.__uxAudit = { area, events: [], rootChanges: 0 };
    const add = (kind, details = {}) => audit.events.push({ at: new Date().toISOString(), kind, ...details });
    new MutationObserver(records => { audit.rootChanges += records.length; add('root-mutation', { count: records.length }); }).observe(document.querySelector('#root'), { subtree: true, childList: true, attributes: true, characterData: true });
    for (const type of ['focusin', 'focusout', 'input', 'keydown']) document.addEventListener(type, e => add(type, { tag: e.target.tagName, key: e.key, value: area.value, start: area.selectionStart, end: area.selectionEnd }), true);
    window.addEventListener('message', e => { const d = e.data; add('host-message', { type: d?.type, method: d?.method, id: d?.id, keys: d && typeof d === 'object' ? Object.keys(d) : [], surface: d?.context?.surface, hasError: !!d?.error }); });
    area.setSelectionRange(6, 6);
  })()`)
  result = await evaluate(read)
} else if (mode === 'selection') {
  await evaluate(`document.querySelector('textarea.comment-input').setSelectionRange(6, 6)`)
  result = await evaluate(read)
} else if (mode === 'host') {
  result = await evaluate(`({ at: new Date().toISOString(), active: document.activeElement?.outerHTML.slice(0, 800), text: document.body.innerText.slice(-10000), frames: [...document.querySelectorAll('iframe')].map(f => ({src:f.src, title:f.title})) })`)
} else if (mode === 'a11y') {
  result = await call('Accessibility.getFullAXTree')
} else if (mode === 'monitor') {
  const samples = []
  const start = Date.now()
  while (Date.now() - start < Number(seconds) * 1000) {
    samples.push({ stage: 'before-key', ...(await evaluate(read)) })
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'x', code: 'KeyX', text: 'x', unmodifiedText: 'x', windowsVirtualKeyCode: 88 })
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'x', code: 'KeyX', windowsVirtualKeyCode: 88 })
    samples.push({ stage: 'after-key', ...(await evaluate(read)) })
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 })
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  result = { start: new Date(start).toISOString(), end: new Date().toISOString(), samples, final: await evaluate(read) }
} else { result = await evaluate(read) }
if (output && output !== '-') await writeFile(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify(mode === 'monitor' ? { saved: output, samples: result.samples.length, allFocused: result.samples.every(s => s.focus && s.documentFocus && s.sameNode), allBeforeValid: result.samples.filter(s => s.stage === 'before-key').every(s => s.value === 'Alpha audit draft omega' && s.start === 6 && s.end === 6), allAfterValid: result.samples.filter(s => s.stage === 'after-key').every(s => s.value === 'Alpha xaudit draft omega' && s.start === 7 && s.end === 7), rootChanges: result.final.rootChanges } : mode === 'a11y' ? { saved: output, nodes: result.nodes.length } : { ...result, events: result.events?.slice(-5) }, null, 2))
ws.close()
