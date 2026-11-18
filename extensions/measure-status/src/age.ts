// FR-6: the last change of a track and the age label of a card. Pure.
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH_DAYS = 30

/** The largest time of the list; null when no file gives a time. */
export const latestChange = (times: ReadonlyArray<number | null>): number | null => {
  let out: number | null = null
  for (const time of times) {
    if (time === null) continue
    if (out === null || time > out) out = time
  }
  return out
}

/**
 * `<1m` below one minute, `Nm` below one hour, `Nh` below one day, `Nd` below
 * 60 days, then `Nmo` with a month of 30 days rounded down. A future time
 * gives `<1m`.
 */
export const formatAge = (now: number, then: number): string => {
  const age = now - then
  if (age < MINUTE) return '<1m'
  if (age < HOUR) return `${Math.floor(age / MINUTE)}m`
  if (age < DAY) return `${Math.floor(age / HOUR)}h`
  const days = Math.floor(age / DAY)
  if (days < 60) return `${days}d`
  return `${Math.floor(days / MONTH_DAYS)}mo`
}
