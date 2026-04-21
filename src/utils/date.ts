export function toMs(iso?: string | null) {
  if (!iso) return 0
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 0 : d.getTime()
}

export function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

