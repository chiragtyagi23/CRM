export function fmtLongDateTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** Callback date/time from capture lead (date may be ISO or YYYY-MM-DD). */
export function formatCallbackDateTime(date: string | null | undefined, time: string | null | undefined): string {
  const rawDate = (date ?? '').trim()
  const rawTime = (time ?? '').trim()
  if (!rawDate && !rawTime) return ''

  let dateLabel = rawDate
  const parsed = new Date(rawDate)
  if (!Number.isNaN(parsed.getTime())) {
    dateLabel = parsed.toLocaleDateString(undefined, {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    })
  } else if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
    const [y, m, d] = rawDate.slice(0, 10).split('-').map(Number)
    dateLabel = new Date(y, m - 1, d).toLocaleDateString(undefined, {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (dateLabel && rawTime) return `${dateLabel}, ${rawTime}`
  return dateLabel || rawTime
}

