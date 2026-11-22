// Submit one bounded browser operation to the audit worker.
import { readFile } from 'node:fs/promises'
const state = JSON.parse(await readFile(`measure/runs/board_focus_reasons_20261121/ux-p2/${process.env.MEASURE_FIXTURE_HARNESS === '1' ? 'harness-worker-ready.json' : 'worker-ready.json'}`, 'utf8'))
const response = await fetch(`http://127.0.0.1:${state.port}`, { method: 'POST', body: process.argv[2] })
const result = await response.json()
console.log(JSON.stringify(result, null, 2))
process.exitCode = result.code ?? (result.error ? 1 : 0)
