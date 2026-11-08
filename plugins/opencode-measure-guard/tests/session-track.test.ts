// The track of each session in the task note (track guard_session_track_20261109):
// the prompt, title, and path clues, the work and idle lists, and the guards that keep the project rule.
import { describe, expect, test } from 'bun:test'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Guard } from '../src/guard'
import { Bypass, Sessions } from '../src/state'
import type { CompactionEvent, PromptEvent, ToolAfterEvent, ToolBeforeEvent } from '../src/hooks/types'
import type { SessionSnapshot } from '../src/track'
import type { Marker } from '../src/types'
import { FIXTURES, fakeStorage, makeGuard, tempProject } from './fake'

const ALPHA = 'alpha_20261109'
const BETA = 'beta_20261109'
const GAMMA = 'gamma_20261109'
const IDS = [ALPHA, BETA, GAMMA]
const NAME: Record<string, string> = { [ALPHA]: 'Alpha', [BETA]: 'Beta', [GAMMA]: 'Gamma' }

type Options = {
  /** The tracks.md marker of each track; `~` when unset. */
  markers?: Record<string, Marker>
  /** The marker of the one task of each plan; `~` when unset. */
  tasks?: Record<string, Marker>
}

const tracksText = (markers: Record<string, Marker> = {}): string =>
  ['# Project Tracks', '', '## Active Tracks', '']
    .concat(
      IDS.flatMap(id => [
        `- [${markers[id] ?? '~'}] **Track: ${NAME[id]}**`,
        `  *Link: [./tracks/${id}/](./tracks/${id}/)*`,
        `  *The ${NAME[id]} track.*`,
        '',
      ]),
    )
    .join('\n')

const planText = (id: string, marker: Marker = '~'): string =>
  `# Implementation Plan: ${NAME[id]}\n\n## Phase 1: Work\n\n- [${marker}] Task 1.1: ${NAME[id]} work\n`

const planPath = (root: string, id: string): string => join(root, 'measure/tracks', id, 'plan.md')

/** A temp git project with 3 `[~]` tracks, each with one plan and one task. */
const project = async (options: Options = {}): Promise<string> => {
  const root = await tempProject()
  mkdirSync(join(root, 'measure'), { recursive: true })
  copyFileSync(join(FIXTURES, 'index.md'), join(root, 'measure/index.md'))
  writeFileSync(join(root, 'measure/tracks.md'), tracksText(options.markers))
  for (const id of IDS) {
    mkdirSync(join(root, 'measure/tracks', id), { recursive: true })
    writeFileSync(planPath(root, id), planText(id, options.tasks?.[id] ?? '~'))
  }
  return root
}

/** A Guard with a title function. */
const titledGuard = (root: string, titleOf: (sessionID: string) => Promise<string | null>): Guard =>
  new Guard(root, 'guard', new Sessions(), new Bypass(fakeStorage()), mkdtempSync(join(tmpdir(), 'measure-guard-state-')), titleOf)

/** Sends a prompt and gives the text the plugin added to it; empty when it added nothing. */
const send = async (guard: Guard, text: string, sessionID = 'ses_1'): Promise<string> => {
  const event: PromptEvent = { sessionID, messageID: 'msg_1', prompt: { text } }
  await guard.onPrompt(event)
  return event.prompt.text.slice(text.length)
}

const noteOf = (id: string): string =>
  ['measure-guard (Mode: guard)', `Active track: ${NAME[id]} (measure/tracks/${id}/).`, `Current task: [~] Task 1.1: ${NAME[id]} work`].join('\n')

const workList = (ids: readonly string[]): string =>
  [
    'measure-guard (Mode: guard)',
    `This session names no track. ${ids.length} tracks have a task in progress:`,
    ...ids.map(id => `- ${id}: ${NAME[id]}`),
    'To get the task of one track, write its id in a prompt.',
  ].join('\n')

const idleList = (ids: readonly string[]): string =>
  [
    'measure-guard (Mode: guard)',
    `This session names no track. No track has a task in progress. ${ids.length} tracks have the marker [~]:`,
    ...ids.map(id => `- ${id}: ${NAME[id]}`),
    'To get the next task of one track, write its id in a prompt.',
  ].join('\n')

/** The text that a prompt gets when the plugin adds one note. */
const added = (note: string): string => `\n\n${note}`

const writeCall = (path: string, sessionID: string, id = 'call_1'): ToolBeforeEvent => ({
  tool: 'write',
  sessionID,
  agent: 'build',
  messageID: 'msg_1',
  id,
  input: { filePath: path, content: 'x\n' },
})

const completed = (event: ToolBeforeEvent): ToolAfterEvent & { status: 'completed' } => ({
  tool: event.tool,
  sessionID: event.sessionID,
  agent: event.agent,
  messageID: event.messageID,
  id: event.id,
  input: event.input,
  status: 'completed',
  result: { output: 'done' },
})

const outputOf = (event: ToolAfterEvent & { status: 'completed' }): string => String(event.result.output)

describe('the session track (PM case)', () => {
  test('AC-1: a session that names a track gets the note of that track', async () => {
    const guard = makeGuard(await project())
    const note = await send(guard, `Work on track ${BETA}.`)
    expect(note).toBe(added(noteOf(BETA)))
    expect(note).not.toContain('Alpha')
  })

  test('AC-2: a session that names no track gets the work list', async () => {
    const guard = makeGuard(await project())
    const note = await send(guard, 'hello')
    expect(note).toBe(added(workList(IDS)))
    expect(note).not.toContain('Active track:')
  })
})

describe('the prompt clue', () => {
  test('AC-3: each session has its own track', async () => {
    const guard = makeGuard(await project())
    const a = await send(guard, `Work on ${GAMMA}.`, 'ses_a')
    const b = await send(guard, `Work on ${ALPHA}.`, 'ses_b')
    expect(a).toBe(added(noteOf(GAMMA)))
    expect(b).toBe(added(noteOf(ALPHA)))
  })

  test('AC-4: the latest clue wins', async () => {
    const guard = makeGuard(await project())
    expect(await send(guard, `Work on ${BETA}.`)).toBe(added(noteOf(BETA)))
    expect(await send(guard, `Now work on ${GAMMA}.`)).toBe(added(noteOf(GAMMA)))
  })

  test('AC-5: a prompt that names two tracks names no track and keeps the track', async () => {
    const guard = makeGuard(await project())
    expect(await send(guard, `Compare ${ALPHA} with ${BETA}.`)).toBe(added(workList(IDS)))
    expect(await send(guard, `Work on ${GAMMA}.`, 'ses_g')).toBe(added(noteOf(GAMMA)))
    expect(await send(guard, `Compare ${ALPHA} with ${BETA}.`, 'ses_g')).toBe('')
    expect(guard.session('ses_g').track).toBe(GAMMA)
  })

  test('AC-6: only a whole, case-sensitive id names a track', async () => {
    const guard = makeGuard(await project())
    for (const [i, text] of ['See beta_202611090.', 'See xbeta_20261109.', 'See BETA_20261109.'].entries()) {
      expect(await send(guard, text, `ses_${i}`)).toBe(added(workList(IDS)))
    }
  })

  test('AC-7: the id of a track that is not [~] names no track', async () => {
    const guard = makeGuard(await project({ markers: { [GAMMA]: 'x' } }))
    expect(await send(guard, `Work on ${GAMMA}.`)).toBe(added(workList([ALPHA, BETA])))
  })
})

describe('the title clue', () => {
  test('AC-8: the title names the track until a clue sets one', async () => {
    const guard = titledGuard(await project(), async () => `Review of ${GAMMA}`)
    expect(await send(guard, 'hello')).toBe(added(noteOf(GAMMA)))
    expect(await send(guard, `Work on ${BETA}.`)).toBe(added(noteOf(BETA)))
    expect(await send(guard, 'again')).toBe('')
  })

  test('AC-9: a title that fails or never comes gives no clue, and the prompt continues', async () => {
    const failing = titledGuard(await project(), async () => {
      throw new Error('no title')
    })
    expect(await send(failing, 'hello')).toBe(added(workList(IDS)))
    const silent = titledGuard(await project(), () => new Promise<string | null>(() => {}))
    const start = Date.now()
    expect(await send(silent, 'hello')).toBe(added(workList(IDS)))
    expect(Date.now() - start).toBeLessThan(2000)
  })
})

describe('the path clue', () => {
  test('AC-10: a completed write in a track folder or with the id in its path names the track', async () => {
    const root = await project()
    const guard = makeGuard(root)
    const inMeasure = completed(writeCall(planPath(root, GAMMA), 'ses_m'))
    await guard.onToolAfter(inMeasure)
    expect(outputOf(inMeasure)).toContain(noteOf(GAMMA))
    const outside = completed(writeCall(join(root, 'notes', GAMMA, 'x.md'), 'ses_o'))
    await guard.onToolAfter(outside)
    expect(outputOf(outside)).toContain(noteOf(GAMMA))
  })

  test('AC-11: a failed call gives no clue', async () => {
    const root = await project()
    const guard = makeGuard(root)
    const failed = { ...completed(writeCall(planPath(root, GAMMA), 'ses_1')), status: 'error', error: { message: 'no' } } as ToolAfterEvent
    await guard.onToolAfter(failed)
    expect(guard.session('ses_1').track).toBeNull()
    expect(await send(guard, 'hello')).toBe(added(workList(IDS)))
  })
})

describe('the selection', () => {
  test('AC-12: a named track with no [~] task gets its own note', async () => {
    const guard = makeGuard(await project({ tasks: { [BETA]: ' ' } }))
    const note = await send(guard, `Work on ${BETA}.`)
    expect(note).toContain(`Active track: Beta (measure/tracks/${BETA}/).`)
    expect(note).toContain('No task is in progress.')
    expect(note).not.toContain('Alpha')
  })

  test('AC-13: one working track keeps the old note', async () => {
    const guard = makeGuard(await project({ tasks: { [ALPHA]: ' ', [GAMMA]: ' ' } }))
    expect(await send(guard, 'hello')).toBe(added(noteOf(BETA)))
  })

  test('AC-14: the list key changes only with the listed tracks', async () => {
    const root = await project()
    const guard = makeGuard(root)
    expect(await send(guard, 'hello')).toBe(added(workList(IDS)))
    writeFileSync(planPath(root, ALPHA), `${planText(ALPHA, 'x')}- [~] Task 1.2: Alpha more work\n`)
    expect(await send(guard, 'next')).toBe('')
    writeFileSync(planPath(root, GAMMA), planText(GAMMA, ' '))
    expect(await send(guard, 'later')).toBe(added(workList([ALPHA, BETA])))
  })

  test('AC-15: a compaction carries the note of the session', async () => {
    const guard = makeGuard(await project())
    await send(guard, `Work on ${GAMMA}.`, 'ses_g')
    const named: CompactionEvent = { sessionID: 'ses_g', agent: 'build', system: [], messages: [] }
    await guard.onCompaction(named)
    expect(named.system.map(part => part.text)).toContain(noteOf(GAMMA))
    const unnamed: CompactionEvent = { sessionID: 'ses_n', agent: 'build', system: [], messages: [] }
    await guard.onCompaction(unnamed)
    expect(unnamed.system.map(part => part.text)).toContain(workList(IDS))
  })

  test('AC-16: the edit guard keeps the project rule', async () => {
    const root = await project({ tasks: { [BETA]: ' ' } })
    const guard = makeGuard(root)
    await expect(guard.onToolBefore(writeCall(join(root, 'src/x.ts'), 'ses_n'))).resolves.toBeUndefined()
    await send(guard, `Work on ${BETA}.`, 'ses_b')
    expect(guard.session('ses_b').track).toBe(BETA)
    await expect(guard.onToolBefore(writeCall(join(root, 'src/x.ts'), 'ses_b', 'call_2'))).resolves.toBeUndefined()
  })

  test('AC-20: a parse error keeps the parse-error note', async () => {
    const root = await project()
    writeFileSync(join(root, 'measure/tracks.md'), '# Project Tracks\n\n- [~] Track without a known format\n')
    const guard = makeGuard(root)
    expect(await send(guard, 'hello')).toContain('the Measure files could not be read')
  })

  test('AC-22: with no [~] task, a session that names no track gets the idle list', async () => {
    const guard = makeGuard(await project({ tasks: { [ALPHA]: ' ', [BETA]: ' ', [GAMMA]: ' ' } }))
    const note = await send(guard, 'hello')
    expect(note).toBe(added(idleList(IDS)))
    expect(note).not.toContain('Active track:')
    expect(note).not.toContain('Next task:')
  })
})

describe('the pure functions', () => {
  test('AC-21: namedTrack, sessionList, and sessionNoteKey', async () => {
    const track = await import('../src/track')
    const root = await project()
    const snapshot = (await makeGuard(root).current()) as SessionSnapshot
    for (const clue of [BETA, `(track_id: ${BETA})`, `measure/tracks/${BETA}/plan.md`, `track ${BETA}.`]) {
      expect(track.namedTrack(clue, snapshot.tracks)).toBe(BETA)
    }
    for (const clue of ['BETA_20261109', `${ALPHA} ${BETA}`, '']) {
      expect(track.namedTrack(clue, snapshot.tracks)).toBeNull()
    }
    const list = track.sessionList(snapshot, null)
    expect(list?.kind).toBe('work')
    expect(list?.tracks.map(one => one.entry.id)).toEqual(IDS)
    expect(track.sessionNoteKey(snapshot, null)).toBe(`list|${IDS.join(',')}`)
    expect(readFileSync(planPath(root, BETA), 'utf8')).toContain('[~] Task 1.1: Beta work')
  })
})
