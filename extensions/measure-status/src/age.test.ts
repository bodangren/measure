// FR-6: the last change of a track and the age label of a card.
import { describe, expect, test } from 'vitest'
import { formatAge, latestChange } from './age'

const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR

describe('latestChange', () => {
  test('takes the largest of the file times', () => {
    expect(latestChange([2, 7, 4])).toBe(7)
  })

  test('ignores a missing file', () => {
    expect(latestChange([null, 5, 3])).toBe(5)
  })

  test('is null when no file gives a time', () => {
    expect(latestChange([null, null])).toBeNull()
    expect(latestChange([])).toBeNull()
  })
})

describe('formatAge', () => {
  const now = 1_800_000_000_000
  const age = (then: number) => formatAge(now, then)

  test('gives <1m below one minute', () => {
    expect(age(now)).toBe('<1m')
    expect(age(now - 59 * SEC)).toBe('<1m')
    expect(age(now - MIN + 1)).toBe('<1m')
  })

  test('gives a future time <1m', () => {
    expect(age(now + 5 * MIN)).toBe('<1m')
  })

  test('gives Nm below one hour', () => {
    expect(age(now - MIN)).toBe('1m')
    expect(age(now - 59 * MIN)).toBe('59m')
    expect(age(now - HOUR + 1)).toBe('59m')
  })

  test('gives Nh below one day', () => {
    expect(age(now - HOUR)).toBe('1h')
    expect(age(now - 23 * HOUR)).toBe('23h')
    expect(age(now - DAY + 1)).toBe('23h')
  })

  test('gives Nd below 60 days', () => {
    expect(age(now - DAY)).toBe('1d')
    expect(age(now - 59 * DAY)).toBe('59d')
    expect(age(now - 60 * DAY + 1)).toBe('59d')
  })

  test('gives Nmo from 60 days, with a month of 30 days rounded down', () => {
    expect(age(now - 60 * DAY)).toBe('2mo')
    expect(age(now - 89 * DAY)).toBe('2mo')
    expect(age(now - 90 * DAY)).toBe('3mo')
    expect(age(now - 365 * DAY)).toBe('12mo')
  })
})
