// The track of one session for the task note: the clue rule, the session track,
// and the work and idle lists. Pure functions over the snapshot; the Guard keeps
// the track of each session in its record. The guards keep Snapshot.active.
import { currentTask, noteKey, taskNote } from './core/parse'
import type { ActiveTrack, Mode, Snapshot, TrackEntry } from './types'

/** The snapshot with every `[~]` track that has a plan, in tracks.md order. */
export type SessionSnapshot = Snapshot & { inProgress: ActiveTrack[] }

/** A list note: the tracks with a `[~]` task (`work`), or every `[~]` track when none has one (`idle`). */
export type SessionList = { kind: 'work' | 'idle'; tracks: ActiveTrack[] }

/** A character of a track id; a whole-word match has none just before it and just after it. */
const ID_CHAR = /[A-Za-z0-9_-]/

/** True when `id` occurs in `clue` as a whole, case-sensitive word. */
const hasWord = (clue: string, id: string): boolean => {
  for (let at = clue.indexOf(id); at >= 0; at = clue.indexOf(id, at + 1)) {
    if (!ID_CHAR.test(clue[at - 1] ?? '') && !ID_CHAR.test(clue[at + id.length] ?? '')) return true
  }
  return false
}

/**
 * The id of the one `[~]` track that a clue (a prompt, a title, a path) names
 * as a whole word; null when the clue names no `[~]` track, or 2 or more.
 */
export const namedTrack = (clue: string, tracks: readonly TrackEntry[]): string | null => {
  const named = new Set(tracks.filter(track => track.marker === '~' && track.id !== '' && hasWord(clue, track.id)).map(track => track.id))
  return named.size === 1 ? ([...named][0] ?? null) : null
}

/** No measure/ folder or a parse error: the note stays the old task note. */
const isPlain = (snapshot: Snapshot): boolean => !snapshot.hasMeasure || snapshot.parseError !== null

/** The `[~]` track that `track` names, when its plan has a `## Phase` heading; null otherwise. */
const namedActive = (snapshot: SessionSnapshot, track: string | null): ActiveTrack | null =>
  track === null ? null : (snapshot.inProgress.find(one => one.entry.id === track && one.plan.phases.length > 0) ?? null)

/**
 * The list note of a session that names no track: the work list when 2 or
 * more tracks have a `[~]` task, the idle list when none has one and 2 or more
 * are `[~]`. Null when the note names one track or no track is in progress.
 */
export const sessionList = (snapshot: SessionSnapshot, track: string | null): SessionList | null => {
  if (isPlain(snapshot) || namedActive(snapshot, track) !== null) return null
  const working = snapshot.inProgress.filter(one => currentTask(one.plan) !== null)
  if (working.length >= 2) return { kind: 'work', tracks: working }
  if (working.length === 0 && snapshot.inProgress.length >= 2) return { kind: 'idle', tracks: snapshot.inProgress }
  return null
}

/**
 * The track of a session: the `[~]` track it named, else the project-wide
 * active track. Null when the note is a list or no track is in progress.
 */
export const sessionActive = (snapshot: SessionSnapshot, track: string | null): ActiveTrack | null => {
  if (isPlain(snapshot)) return snapshot.active
  if (sessionList(snapshot, track) !== null) return null
  return namedActive(snapshot, track) ?? snapshot.active
}

const listKey = (list: SessionList): string => `${list.kind === 'work' ? 'list' : 'idle'}|${list.tracks.map(one => one.entry.id).join(',')}`

/** The note key of a session: the list key, else the noteKey of the session track. */
export const sessionNoteKey = (snapshot: SessionSnapshot, track: string | null): string | null => {
  const list = sessionList(snapshot, track)
  return list === null ? noteKey({ ...snapshot, active: sessionActive(snapshot, track) }) : listKey(list)
}

/** The note of a session: the list note, else the task note of the session track. */
export const sessionNote = (snapshot: SessionSnapshot, track: string | null, mode: Mode): string | null => {
  const list = sessionList(snapshot, track)
  if (list === null) return taskNote({ ...snapshot, active: sessionActive(snapshot, track) }, mode)
  const count = list.tracks.length
  return [
    `measure-guard (Mode: ${mode})`,
    list.kind === 'work'
      ? `This session names no track. ${count} tracks have a task in progress:`
      : `This session names no track. No track has a task in progress. ${count} tracks have the marker [~]:`,
    ...list.tracks.map(one => `- ${one.entry.id}: ${one.entry.name}`),
    list.kind === 'work' ? 'To get the task of one track, write its id in a prompt.' : 'To get the next task of one track, write its id in a prompt.',
  ].join('\n')
}
