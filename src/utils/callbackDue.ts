import type { CaptureLeadDTO } from '../types/dtos'
import { asLeadStatus } from './leadMapping'

/** Local date + time from capture lead callback fields. */
export function parseCallbackDateTime(
  date: string | null | undefined,
  time: string | null | undefined,
): Date | null {
  const rawDate = (date ?? '').trim()
  const rawTime = (time ?? '').trim()
  if (!rawDate) return null

  if (rawDate.includes('T')) {
    const iso = new Date(rawDate)
    if (!Number.isNaN(iso.getTime())) {
      if (rawTime) {
        const m = rawTime.match(/^(\d{1,2}):(\d{2})/)
        if (m) {
          iso.setHours(Number(m[1]), Number(m[2]), 0, 0)
        }
      }
      return iso
    }
  }

  const m = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null

  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const d = Number(m[3])
  const tm = rawTime.match(/^(\d{1,2}):(\d{2})/)
  const hours = tm ? Number(tm[1]) : 23
  const mins = tm ? Number(tm[2]) : 59

  return new Date(y, mo, d, hours, mins, 0, 0)
}

export function isCallbackOverdue(
  date: string | null | undefined,
  time: string | null | undefined,
  now: Date = new Date(),
): boolean {
  const at = parseCallbackDateTime(date, time)
  if (!at) return false
  return at.getTime() < now.getTime()
}

export type OverdueCallbackLead = {
  id: string
  name: string
  contact: string
  callbackLabel: string
  dueAt: Date
}

export function listOverdueCallbackLeads(
  leads: CaptureLeadDTO[],
  now: Date = new Date(),
): OverdueCallbackLead[] {
  const out: OverdueCallbackLead[] = []

  for (const lead of leads) {
    if (asLeadStatus(lead.status) !== 'New') continue
    const dueAt = parseCallbackDateTime(lead.callbackDate, lead.callbackTime)
    if (!dueAt || dueAt.getTime() >= now.getTime()) continue

    const datePart = dueAt.toLocaleDateString(undefined, {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    })
    const timePart = lead.callbackTime?.trim() || dueAt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

    out.push({
      id: lead.id,
      name: lead.name?.trim() || '—',
      contact: lead.number?.trim() || '—',
      callbackLabel: `${datePart}, ${timePart}`,
      dueAt,
    })
  }

  return out.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
}
