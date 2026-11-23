// Red (Task 1.1): the heavy-run hook deny of FR-8 through Guard.onToolBefore.
// Guard does not call heavyRunDecision yet, so the deny tests fail here
// (the unwrapped heavy command passes) and pass once Green wires the hook.
import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'
import type { ToolBeforeEvent } from '../src/hooks/types'
import { makeGuard, tempProject, withMeasure } from './fake'

/** The exact FR-4 deny text for one class and one offending part. */
const denyFor = (cls: string, part: string): string =>
  `measure-guard: heavy ${cls} runs only through heavy-run: HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '${part}'. If this block is wrong, the user can run /measure-off.`

const shell = (command: string, agent = 'build', tool = 'shell'): ToolBeforeEvent => ({
  tool,
  sessionID: 'ses_1',
  agent,
  messageID: 'msg_1',
  id: 'call_1',
  input: { command },
})

describe('heavy-run hook deny', () => {
  test('an unwrapped heavy command from a role agent throws the FR-4 text', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    const error = await guard.onToolBefore(shell('vite')).catch((error: Error) => error)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe(denyFor('dev-server', 'vite'))
  })

  test('an unwrapped heavy suite from a role agent is denied as test-suite', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    await expect(guard.onToolBefore(shell('bun test'))).rejects.toThrow('measure-guard: heavy test-suite runs only through heavy-run:')
  })

  test('the heavy-run form passes', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    await expect(guard.onToolBefore(shell(`scripts/jobs/heavy-run.sh -c 'vite'`))).resolves.toBeUndefined()
    await expect(
      guard.onToolBefore(shell(`HEAVY_PRIORITY=p1 HEAVY_MIN_AVAIL_MB=1500 /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'vite'`)),
    ).resolves.toBeUndefined()
  })

  test('an orchestrator agent passes with a heavy command', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    await expect(guard.onToolBefore(shell('vite', 'measure-orchestrator'))).resolves.toBeUndefined()
    await expect(guard.onToolBefore(shell('bun test', 'measure-orchestrator-audit'))).resolves.toBeUndefined()
  })

  test('advise mode and the bypass pass with a heavy command', async () => {
    const root = await withMeasure(await tempProject())
    await expect(makeGuard(root, 'advise').onToolBefore(shell('vite'))).resolves.toBeUndefined()
    const guard = makeGuard(root)
    await guard.bypass.set(root, 'session')
    await expect(guard.onToolBefore(shell('vite'))).resolves.toBeUndefined()
  })

  test('a non-shell tool is not a heavy-run check', async () => {
    const root = await withMeasure(await tempProject())
    const guard = makeGuard(root)
    await expect(
      guard.onToolBefore({
        tool: 'edit',
        sessionID: 'ses_1',
        agent: 'build',
        messageID: 'msg_1',
        id: 'call_1',
        input: { filePath: join(root, 'src/a.ts'), oldString: 'a', newString: 'b' },
      }),
    ).resolves.toBeUndefined()
  })
})
