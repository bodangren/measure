// S5: the role spawn route guard (a `measure-*` spawn must name an approved route
// of its ra-quota role) and the warning notes on the tool output.
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { KNOWN_ROLES, ROLE_OF_AGENT, roleSpawnOf } from '../src/core/guards'
import type { ToolAfterEvent, ToolBeforeEvent } from '../src/hooks/types'

/** A completed call, so the tests can read `result`. */
type CompletedEvent = ToolAfterEvent & { status: 'completed' }
import { makeGuard, tempProject } from './fake'

const before = (tool: string, input: unknown, id = 'call_1'): ToolBeforeEvent => ({
  tool,
  sessionID: 'ses_1',
  agent: 'build',
  messageID: 'msg_1',
  id,
  input,
})

const after = (event: ToolBeforeEvent, output = 'done'): CompletedEvent => ({
  tool: event.tool,
  sessionID: event.sessionID,
  agent: event.agent,
  messageID: event.messageID,
  id: event.id,
  input: event.input,
  status: 'completed',
  result: { output },
})

const ROUTES = '{"roles":{"red":[{"route":"opencode-go/deepseek-v4.1-flash","family":"deepseek"}],"green":[{"route":"opencode/deepseek-v4.1-flash-free#high","family":"deepseek"}],"acceptance":[{"route":"opencode-go/deepseek-v4-pro#high","family":"deepseek"}],"phase-acceptance":[{"route":"opencode-go/glm-5.3#high","family":"glm"}],"record":[{"route":"opencode-go/deepseek-v4.1-flash","family":"deepseek"}],"review-c":[{"route":"opencode-go/glm-4.5#high","family":"glm"}],"vision-review":[{"route":"claude-code/claude-opus-5-5[1m]#high","family":"claude"}]}}'
const DENY_MODEL = 'claude-code/claude-opus-5-5[1m]#high'
const PHASE_MODEL = 'opencode-go/glm-5.3#high'
const RECORD_MODEL = 'opencode-go/deepseek-v4.1-flash'
const REVIEW_C_MODEL = 'opencode-go/glm-4.5#high'
const VISION_MODEL = 'claude-code/claude-opus-5-5[1m]#high'

/** The output text of a completed call. */
const outputOf = (event: CompletedEvent): string => String(event.result.output)

describe('role spawn routes', () => {
  let originalHome: string | undefined
  let home: string
  let root: string

  beforeEach(async () => {
    originalHome = process.env.HOME
    home = mkdtempSync(join(tmpdir(), 'measure-guard-home-'))
    mkdirSync(join(home, '.config/ra-quota'), { recursive: true })
    writeFileSync(join(home, '.config/ra-quota/routes.json'), ROUTES)
    process.env.HOME = home
    root = await tempProject()
  })

  afterEach(() => {
    if (originalHome === undefined) delete process.env.HOME
    else process.env.HOME = originalHome
    rmSync(home, { recursive: true, force: true })
    rmSync(root, { recursive: true, force: true })
  })

  test('allow: an approved route of the agent role passes', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-mid-red', model: 'opencode-go/deepseek-v4.1-flash' })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
  })

  test('deny: a model outside the approved routes of the role names them', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-mid-red', model: DENY_MODEL })
    let message = ''
    try {
      await guard.onToolBefore(call)
    } catch (error) {
      message = String(error)
    }
    expect(message).toContain('not an approved route')
    expect(message).toContain('  - opencode-go/deepseek-v4.1-flash')
    expect(message).toContain('ra-quota pick red')
  })

  test('phase acceptance: the pick route of phase-acceptance passes', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-phase-acceptance', model: PHASE_MODEL })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
  })

  test('phase acceptance: a model outside phase-acceptance names that pick role', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-phase-acceptance', model: DENY_MODEL })
    let message = ''
    try {
      await guard.onToolBefore(call)
    } catch (error) {
      message = String(error)
    }
    expect(message).toContain('not an approved route')
    expect(message).toContain('  - opencode-go/glm-5.3#high')
    expect(message).toContain('ra-quota pick phase-acceptance')
  })

  test('closeout: the record pick route passes', async () => {
    expect(ROLE_OF_AGENT['measure-closeout']).toBe('record')
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-closeout', model: RECORD_MODEL })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
  })

  test('closeout: a model outside record names that pick role', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-closeout', model: DENY_MODEL })
    let message = ''
    try {
      await guard.onToolBefore(call)
    } catch (error) {
      message = String(error)
    }
    expect(message).toContain('not an approved route')
    expect(message).toContain(`  - ${RECORD_MODEL}`)
    expect(message).toContain('ra-quota pick record')
  })

  test('vision-review is a known role with no agent mapped to it', async () => {
    expect(KNOWN_ROLES).toContain('vision-review')
    expect(Object.values(ROLE_OF_AGENT)).not.toContain('vision-review')
  })

  test('missing file: the spawn passes with a warning note', async () => {
    rmSync(join(home, '.config/ra-quota/routes.json'))
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-mid-red', model: DENY_MODEL })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
    const done = after(call)
    await guard.onToolAfter(done)
    expect(outputOf(done)).toContain('cannot read the approved routes')
  })

  test('unknown role: the spawn passes with a warning note', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-nosuch-review', model: DENY_MODEL })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
    const done = after(call)
    await guard.onToolAfter(done)
    expect(outputOf(done)).toContain('is not in the route map')
  })

  test('no model: the spawn passes with a warning note', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-jr-green' })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
    const done = after(call)
    await guard.onToolAfter(done)
    expect(outputOf(done)).toContain('names no model')
  })

  test('task tool shape: an unapproved model is denied', async () => {
    const guard = makeGuard(root)
    const input = { subagent_type: 'measure-jr-green', model: DENY_MODEL, prompt: 'Write the green implementation' }
    expect(roleSpawnOf('task', input)).toEqual({ agent: 'measure-jr-green', model: DENY_MODEL, prompt: 'Write the green implementation' })
    await expect(guard.onToolBefore(before('task', input))).rejects.toThrow(/not an approved route/)
  })

  test('non-Measure agent: the call passes with no note', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'coder', model: DENY_MODEL })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
    const done = after(call)
    await guard.onToolAfter(done)
    expect(outputOf(done)).not.toContain('measure-guard')
  })

  test('ux browser: the review-c route passes for a text brief', async () => {
    expect(ROLE_OF_AGENT['measure-ux-browser-review']).toBe('review-c')
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-ux-browser-review', model: REVIEW_C_MODEL, prompt: 'Check the API response shape' })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
    const done = after(call)
    await guard.onToolAfter(done)
    expect(outputOf(done)).not.toContain('is not in the route map')
  })

  test('ux browser: a vision-only route is denied for a text brief', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-ux-browser-review', model: VISION_MODEL, prompt: 'Check the API response shape' })
    let message = ''
    try {
      await guard.onToolBefore(call)
    } catch (error) {
      message = String(error)
    }
    expect(message).toContain('not an approved route')
    expect(message).toContain(`  - ${REVIEW_C_MODEL}`)
    expect(message).toContain('ra-quota pick review-c')
  })

  test('ux browser: the vision-review route passes for a picture brief', async () => {
    const guard = makeGuard(root)
    const call = before('subagent', { agent: 'measure-ux-browser-review', model: VISION_MODEL, prompt: 'Review the screenshot for layout bugs' })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
    const done = after(call)
    await guard.onToolAfter(done)
    expect(outputOf(done)).not.toContain('is not in the route map')
  })

  test('advise mode: the deny case passes', async () => {
    const guard = makeGuard(root, 'advise')
    const call = before('subagent', { agent: 'measure-mid-red', model: DENY_MODEL })
    await expect(guard.onToolBefore(call)).resolves.toBeUndefined()
  })

  test('spec review: measure-spec-review maps to spec-review and measure-strategy stays on strategy', () => {
    expect(ROLE_OF_AGENT['measure-spec-review']).toBe('spec-review')
    expect(ROLE_OF_AGENT['measure-strategy']).toBe('strategy')
  })
})
