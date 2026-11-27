// FR-2: the registry grammar, the folder rules, and the done date rules.
import { describe, expect, test } from 'vitest'
import { folderDate, folderOfTarget, parseRegistry } from './registry'

describe('parseRegistry entry lines', () => {
  test('reads only column-0 lines with a status marker', () => {
    const md = [
      '# Project Tracks',
      '- [~] **Track: Keep**',
      '  *Link: [./tracks/keep_1/](./tracks/keep_1/)*',
      '  - [x] **Track: Nested**',
      '- A plain line with no marker',
      '  *Link: [./archive/plain_9/](./archive/plain_9/)*',
    ].join('\n')
    const entries = parseRegistry(md)
    expect(entries.map(entry => entry.title)).toEqual(['Keep'])
    expect(entries.map(entry => entry.folder)).toEqual(['tracks/keep_1'])
  })

  test('keeps file order, also across a heading', () => {
    const md = [
      '- [~] **Track: First**',
      '  *Link: [./tracks/first_1/](./tracks/first_1/)*',
      '## Archived Tracks',
      '- [x] **Track: Second**',
      '  *Link: [./archive/second_2/](./archive/second_2/)*',
    ].join('\n')
    expect(parseRegistry(md).map(entry => entry.folder)).toEqual(['tracks/first_1', 'archive/second_2'])
  })

  test('keeps the marker of each entry', () => {
    const md = [
      '- [~] **Track: A**',
      '- [x] **Track: B**',
      '- [b] **Track: C**',
      '- [ ] **Track: D**',
    ].join('\n')
    expect(parseRegistry(md).map(entry => entry.marker)).toEqual(['~', 'x', 'b', ' '])
  })
})

describe('parseRegistry titles', () => {
  const md = [
    '- [~] **Track: Alpha work**',
    '- [x] **Track A: Beta work**',
    '- [ ] **Program: Gamma work**',
    '- [x] **Track 8: Delta work**',
    '- [x] [Epsilon work](archive/epsilon_5/index.md)',
    '- [ ] Zeta work',
  ].join('\n')

  test('takes the first bold pair and removes the leading prefix', () => {
    expect(parseRegistry(md).map(entry => entry.title)).toEqual([
      'Alpha work',
      'Beta work',
      'Gamma work',
      'Delta work',
      'Epsilon work',
      'Zeta work',
    ])
  })
})

describe('parseRegistry link targets', () => {
  test('reads a Link line on the entry line', () => {
    const md = '- [x] **Track: Same** *Link: [./archive/same_1/](./archive/same_1/)*'
    expect(parseRegistry(md)[0]?.folder).toBe('archive/same_1')
  })

  test('reads a Link line three lines below the entry line', () => {
    const md = [
      '- [~] **Track: Long**',
      '  *One description line.*',
      '  *A second description line.*',
      '  *Link: [./tracks/long_1/](./tracks/long_1/)*',
    ].join('\n')
    expect(parseRegistry(md)[0]?.folder).toBe('tracks/long_1')
  })

  test('reads a Link line without the asterisks', () => {
    const md = ['- [~] **Track: Plain**', '  Link: [./tracks/plain_1/](./tracks/plain_1/)'].join('\n')
    expect(parseRegistry(md)[0]?.folder).toBe('tracks/plain_1')
  })

  test('reads a target that starts at the repo root', () => {
    const md = ['- [x] **Track: Root**', '  *Link: [./measure/archive/root_1/](./measure/archive/root_1/)*'].join('\n')
    expect(parseRegistry(md)[0]?.folder).toBe('archive/root_1')
  })

  test('gives no folder for an entry with no target', () => {
    const md = ['- [ ] **Track: No link**', '  *A stub with prose only.*'].join('\n')
    expect(parseRegistry(md)[0]?.folder).toBeNull()
  })

  test('stops the scan at a heading', () => {
    const md = ['- [~] **Track: Cut**', '## Archived Tracks', '  *Link: [./tracks/cut_1/](./tracks/cut_1/)*'].join('\n')
    expect(parseRegistry(md)[0]?.folder).toBeNull()
  })
})

describe('folderOfTarget', () => {
  test('reads the two folder forms and strips index.md, plan.md, and the last slash', () => {
    expect(folderOfTarget('./tracks/alpha_1/')).toBe('tracks/alpha_1')
    expect(folderOfTarget('./tracks/alpha_1/index.md')).toBe('tracks/alpha_1')
    expect(folderOfTarget('archive/beta_2/plan.md')).toBe('archive/beta_2')
    expect(folderOfTarget('tracks/gamma_3')).toBe('tracks/gamma_3')
  })

  test('removes a leading measure/ and resolves . and ..', () => {
    expect(folderOfTarget('./measure/archive/root_1/')).toBe('archive/root_1')
    expect(folderOfTarget('tracks/a_1/../b_2')).toBe('tracks/b_2')
  })

  test('gives no folder for an absolute, schemed, or climbing target', () => {
    expect(folderOfTarget('/home/someone/tracks/x_1')).toBeNull()
    expect(folderOfTarget('~/Desktop/other/measure/tracks/x_1')).toBeNull()
    expect(folderOfTarget('https://example.test/tracks/x_1')).toBeNull()
    expect(folderOfTarget('../tracks/x_1')).toBeNull()
    expect(folderOfTarget('tracks/../../x_1')).toBeNull()
  })
})

describe('folderDate', () => {
  test('reads the last _YYYYMMDD of the folder name', () => {
    expect(folderDate('archive/work_20260101')).toBe('2026-01-01')
    expect(folderDate('tracks/a_20260101_b_20260202')).toBe('2026-02-02')
    expect(folderDate('archive/group/work_20260303')).toBe('2026-03-03')
  })

  test('is null for a folder name with no date', () => {
    expect(folderDate('archive/work')).toBeNull()
    expect(folderDate('tracks/a_2026_1')).toBeNull()
  })
})

describe('parseRegistry done dates', () => {
  const md = [
    '- [x] **Track: Archived** archived 2026-05-06',
    '  *Link: [./archive/a_20260101/](./archive/a_20260101/)*',
    '- [x] **Track: Complete** Done 2026-07-08',
    '  *Link: [./archive/b_2/](./archive/b_2/)*',
    '- [x] **Track: FolderDate**',
    '  *Link: [./archive/c_20260303/](./archive/c_20260303/)*',
    '- [x] **Track: NoDate**',
    '  *Link: [./archive/d_4/](./archive/d_4/)*',
    '- [~] **Track: Open** completed 2026-01-01',
    '  *Link: [./tracks/e_5/](./tracks/e_5/)*',
  ].join('\n')

  test('takes the first ISO date after the word', () => {
    const entries = parseRegistry(md)
    expect(entries[0]?.doneDate).toBe('2026-05-06')
    expect(entries[0]?.doneSource).toBe('registry')
    expect(entries[1]?.doneDate).toBe('2026-07-08')
    expect(entries[1]?.doneSource).toBe('registry')
  })

  test('falls back to the date in the folder name', () => {
    expect(parseRegistry(md)[2]?.doneDate).toBe('2026-03-03')
    expect(parseRegistry(md)[2]?.doneSource).toBe('folder')
  })

  test('gives no date when neither source holds one', () => {
    expect(parseRegistry(md)[3]?.doneDate).toBeNull()
    expect(parseRegistry(md)[3]?.doneSource).toBeNull()
  })

  test('gives no done date for an entry that is not complete', () => {
    expect(parseRegistry(md)[4]?.doneDate).toBeNull()
    expect(parseRegistry(md)[4]?.doneSource).toBeNull()
  })

  test('reads no registry date when more than 24 non-digit characters separate word and date', () => {
    const wide = [
      '- [x] **Track: Wide** done --------------------------- 2026-01-02',
      '  *Link: [./archive/w_20260405/](./archive/w_20260405/)*',
    ].join('\n')
    expect(parseRegistry(wide)[0]?.doneDate).toBe('2026-04-05')
    expect(parseRegistry(wide)[0]?.doneSource).toBe('folder')
  })
})

describe('parseRegistry shelved entries', () => {
  test('an entry under a Shelved heading carries its status note; other headings end it', () => {
    const md = [
      '## Active Tracks',
      '- [~] **Track: Live**',
      '  *Link: [./tracks/live_1/](./tracks/live_1/)*',
      '## Shelved Tracks',
      '- [ ] **Track: Parked**',
      '  *Link: [./tracks/parked_1/](./tracks/parked_1/)*',
      '  *Status: shelved, not done (PM 2026-11-27) | Priority: LOW*',
      '- [ ] **Track: Bare**',
      '  *Link: [./tracks/bare_1/](./tracks/bare_1/)*',
      '## Archived Tracks',
      '- [x] **Track: Old**',
      '  *Link: [./archive/old_1/](./archive/old_1/)*',
    ].join('\n')
    expect(parseRegistry(md).map(entry => entry.shelved)).toEqual([
      null,
      'shelved, not done (PM 2026-11-27)',
      'shelved',
      null,
    ])
  })
})
