// S2: session records, the bypass, and the state file.
import { describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Bypass, Sessions, offKey, readStateFile, stateFilePath, writeStateFile } from '../src/state'
import { modeFrom } from '../src/options'
import { fakeStorage } from './fake'

describe('Sessions', () => {
  test('creates a record on first use and keeps it', () => {
    const sessions = new Sessions()
    const one = sessions.sessionOf('ses_1')
    expect(one.sessionID).toBe('ses_1')
    expect(one.turn).toBeNull()
    expect(one.problems).toEqual([])
    one.reminder = 'x'
    expect(sessions.sessionOf('ses_1').reminder).toBe('x')
    sessions.forget('ses_1')
    expect(sessions.sessionOf('ses_1').reminder).toBeNull()
  })
})

describe('Bypass', () => {
  test('session bypass is in memory; repo bypass is stored and survives a new instance', async () => {
    const storage = fakeStorage()
    const bypass = new Bypass(storage)
    expect(await bypass.get('/r')).toBeNull()
    await bypass.set('/r', 'session')
    expect(await bypass.get('/r')).toBe('session')
    expect(await bypass.get('/other')).toBeNull()
    await bypass.clear('/r', 'session')
    expect(await bypass.get('/r')).toBeNull()
    await bypass.set('/r', 'repo')
    expect(await storage.get(offKey('/r'))).toBe(true)
    expect(await new Bypass(storage).get('/r')).toBe('repo')
    await bypass.clear('/r', 'repo')
    expect(await storage.get(offKey('/r'))).toBeUndefined()
    expect(await bypass.get('/r')).toBeNull()
  })
})

describe('state file', () => {
  test('writes and reads the file for a root under the base folder', async () => {
    const base = mkdtempSync(join(tmpdir(), 'measure-guard-state-'))
    const path = stateFilePath('/some/root', base)
    expect(path.startsWith(base)).toBe(true)
    expect(path.endsWith('.json')).toBe(true)
    expect(stateFilePath('/some/root', base)).toBe(path)
    expect(stateFilePath('/other', base)).not.toBe(path)
    const written = await writeStateFile({ root: '/some/root', mode: 'guard', guardsOff: null, problems: ['p'], updatedAt: 'now' }, base)
    expect(written).toBe(path)
    const read = await readStateFile('/some/root', base)
    expect(read?.problems).toEqual(['p'])
    expect(read?.mode).toBe('guard')
    expect(await readStateFile('/none', base)).toBeNull()
  })

  test('the default base is under ~/.local/state/measure/opencode-guard', () => {
    expect(stateFilePath('/r')).toContain('/.local/state/measure/opencode-guard/')
  })
})

describe('modeFrom', () => {
  test('option, then environment, then guard', () => {
    expect(modeFrom({ mode: 'strict' }, {})).toBe('strict')
    expect(modeFrom({}, { MEASURE_GUARD_MODE: 'advise' })).toBe('advise')
    expect(modeFrom({ mode: 'nope' }, { MEASURE_GUARD_MODE: 'strict' })).toBe('strict')
    expect(modeFrom({}, {})).toBe('guard')
  })
})
