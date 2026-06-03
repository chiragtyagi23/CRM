import type { LeadDTO, LeadScoreDTO, LeadStatusDTO } from '../lib/dashboardDummyApi'
import type { CaptureLeadDTO } from '../lib/captureLeadsApi'

export const ALL_LEAD_STATUSES: (LeadStatusDTO | 'all')[] = ['all', 'New', 'Contacted', 'Qualified', 'Opportunity', 'Site Visit']
export const ALL_LEAD_SCORES: (LeadScoreDTO | 'all')[] = ['all', 'Hot', 'Warm', 'Cold']

function norm(value: string | null | undefined) {
  return (value ?? '').trim().toLowerCase()
}

export function asLeadScore(input: string | null | undefined, leadScore?: string | null): LeadScoreDTO {
  const fromScore = norm(leadScore)
  if (fromScore === 'hot') return 'Hot'
  if (fromScore === 'warm') return 'Warm'
  if (fromScore === 'cold') return 'Cold'

  const v = norm(input)
  if (v === 'hot') return 'Hot'
  if (v === 'warm') return 'Warm'
  if (v === 'cold') return 'Cold'
  return 'Warm'
}

export function asLeadStatus(input: string | null | undefined): LeadStatusDTO {
  const v = norm(input)
  if (v === 'new') return 'New'
  if (v === 'contacted') return 'Contacted'
  if (v === 'qualified') return 'Qualified'
  if (v === 'opportunity') return 'Opportunity'
  if (v === 'site visit' || v === 'site_visit' || v === 'sitevisit') return 'Site Visit'
  if (v === 'hot' || v === 'warm' || v === 'cold') return 'New'
  return 'New'
}

export function formatBudgetLabel(input: string | null | undefined): string {
  const raw = (input ?? '').trim()
  if (!raw) return ''

  const legacy: Record<string, string> = {
    under_50: 'Under 50 Lakhs',
    '50_100': '50 Lakhs – 1 Cr',
    '100_150': '1 Cr – 1.5 Cr',
    '150_plus': '1.5 Cr+',
  }
  return legacy[raw] ?? raw
}

export function formatBhkLabel(input: string | null | undefined): string {
  const raw = (input ?? '').trim()
  if (!raw) return ''
  if (/^\d+$/.test(raw)) return `${raw} BHK`
  return raw
}

export function toLeadRow(c: CaptureLeadDTO): LeadDTO {
  const created = c.created_at ?? new Date().toISOString()
  const last = c.updated_at ?? created
  return {
    id: c.id,
    name: c.name ?? '—',
    contact: c.number ?? '',
    email: c.email ?? '',
    source: c.source ?? '—',
    status: asLeadStatus(c.status),
    score: asLeadScore(c.status, c.leadScore),
    assignedTo: c.callBy ?? '—',
    createdAtISO: created,
    lastContactAtISO: last,
    budgetLabel: formatBudgetLabel(c.budget),
    bhkLabel: formatBhkLabel(c.bhk),
    locationLabel: c.resiLocation ?? '',
    repeatCustomer: false,
    sentiment: 'Neutral',
    timelineLabel: '—',
  }
}

export function toLeadDetailsRow(c: CaptureLeadDTO): LeadDTO {
  return toLeadRow(c)
}
