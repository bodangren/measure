// FR-2: the registry grammar, the folder rules, and the done date rules.
// Pure functions over the text of tracks.md.
import type { Marker } from './types'

export type DoneSource = 'registry' | 'folder'

export type RegistryEntry = {
  marker: Marker
  title: string
  /** `tracks/<id>` or `archive/<id>`; null when the target gives no folder. */
  folder: string | null
  /** `YYYY-MM-DD`, only for marker `x`. */
  doneDate: string | null
  doneSource: DoneSource | null
  /** The status note when the entry sits under a "Shelved" heading, else null. */
  shelved: string | null
}

/** A column-0 line with a status marker. An indented line is not an entry. */
const ENTRY = /^- \[([ ~xb])\] (.*)$/
const HEADING = /^#{1,6} /
const BOLD = /\*\*(.+?)\*\*/
const TITLE_LINK = /^\[([^\]]+)\]\(([^)\s]+)\)/
const LINK_STAR = /\*Link: \[[^\]]*\]\(([^)\s]+)\)\*/
const LINK_PLAIN = /Link: \[[^\]]*\]\(([^)\s]+)\)/
const TITLE_PREFIX = /^(?:Track|Program):\s+/
const TITLE_TRACK = /^Track [A-Za-z0-9.]+:\s+/
const DONE_WORD = /(?:completed|complete|archived|done)\b[^0-9]{0,24}(\d{4}-\d{2}-\d{2})/i
const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/
const SHELVED_HEADING = /^#{1,6}\s+Shelved\b/i
const STATUS_NOTE = /\*Status:\s*([^|*]+)/

/** Removes a leading `Track: `, `Program: `, or `Track <id>: ` prefix. */
const stripPrefix = (title: string): string =>
  title.replace(TITLE_PREFIX, '').replace(TITLE_TRACK, '').trim()

/** The title of an entry: the first bold pair, else a leading link, else the rest. */
const titleOf = (rest: string): string => {
  const bold = BOLD.exec(rest)
  if (bold !== null) return stripPrefix(bold[1] ?? rest.trim())
  const link = TITLE_LINK.exec(rest.trim())
  if (link !== null) return stripPrefix(link[1] ?? '')
  return stripPrefix(rest.trim())
}

/**
 * The folder of a link target. Strips `index.md`, `plan.md`, and the last
 * slash, resolves `.` and `..`, and removes a leading `measure/`. Returns null
 * for an absolute target, a target with a URL scheme, or a target that climbs
 * above `measure/`.
 */
export const folderOfTarget = (target: string): string | null => {
  if (SCHEME.test(target)) return null
  if (target.startsWith('/') || target.startsWith('~')) return null
  const trimmed = target
    .replace(/\/index\.md$/, '')
    .replace(/\/plan\.md$/, '')
    .replace(/\/+$/, '')
  const parts: string[] = []
  for (const segment of trimmed.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      if (parts.length === 0) return null
      parts.pop()
      continue
    }
    parts.push(segment)
  }
  if (parts[0] === 'measure') parts.shift()
  if (parts.length !== 2) return null
  const [top, id] = parts
  if ((top !== 'tracks' && top !== 'archive') || id === undefined || id === '') return null
  return `${top}/${id}`
}

/** The last `_YYYYMMDD` of the folder name, written `YYYY-MM-DD`. */
export const folderDate = (folder: string): string | null => {
  const name = folder.split('/').pop() ?? folder
  let out: string | null = null
  for (const match of name.matchAll(/_(\d{4})(\d{2})(\d{2})(?=$|[_-])/g)) {
    const [, year, month, day] = match
    if (year !== undefined && month !== undefined && day !== undefined) out = `${year}-${month}-${day}`
  }
  return out
}

/**
 * The target of an entry: the first `*Link: ...*` line in the scan range, else
 * the first `Link: ...` line, else the link of a link title. The scan starts
 * at the entry line and stops before the next entry line or heading.
 */
const targetOf = (lines: readonly string[], start: number, end: number, rest: string): string | null => {
  const range = lines.slice(start, end)
  for (const line of range) {
    const match = LINK_STAR.exec(line)
    if (match !== null) return match[1] ?? null
  }
  for (const line of range) {
    const match = LINK_PLAIN.exec(line)
    if (match !== null) return match[1] ?? null
  }
  const link = TITLE_LINK.exec(rest.trim())
  return link === null ? null : (link[2] ?? null)
}

/** One entry for each column-0 registry entry line, in file order. */
export const parseRegistry = (md: string): RegistryEntry[] => {
  const lines = md.split('\n')
  const entries: RegistryEntry[] = []
  let inShelved = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    if (HEADING.test(line)) inShelved = SHELVED_HEADING.test(line)
    const entry = ENTRY.exec(line)
    if (entry === null) continue
    let end = lines.length
    for (let next = index + 1; next < lines.length; next += 1) {
      const text = lines[next] ?? ''
      if (ENTRY.test(text) || HEADING.test(text)) {
        end = next
        break
      }
    }
    const rest = entry[2] ?? ''
    const marker = (entry[1] ?? ' ') as Marker
    const target = targetOf(lines, index, end, rest)
    const folder = target === null ? null : folderOfTarget(target)
    let doneDate: string | null = null
    let doneSource: DoneSource | null = null
    if (marker === 'x') {
      const registry = DONE_WORD.exec(line)
      if (registry !== null) {
        doneDate = registry[1] ?? null
        doneSource = doneDate === null ? null : 'registry'
      }
      if (doneDate === null && folder !== null) {
        const date = folderDate(folder)
        if (date !== null) {
          doneDate = date
          doneSource = 'folder'
        }
      }
    }
    let shelved: string | null = null
    if (inShelved) {
      const status = lines.slice(index, end).map(text => STATUS_NOTE.exec(text)).find(match => match !== null)
      shelved = (status?.[1] ?? '').trim() || 'shelved'
    }
    entries.push({ marker, title: titleOf(rest), folder, doneDate, doneSource, shelved })
  }
  return entries
}
