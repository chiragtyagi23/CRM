import type { LeadDTO, LeadScoreDTO, LeadStatusDTO } from '../lib/dashboardDummyApi'
import type { CaptureLeadDTO } from '../lib/captureLeadsApi'

export const ALL_LEAD_STATUSES: (LeadStatusDTO | 'all')[] = ['all', 'New', 'Contacted', 'Qualified', 'Opportunity', 'Site Visit']
export const ALL_LEAD_SCORES: (LeadScoreDTO | 'all')[] = ['all', 'Hot', 'Warm', 'Cold']

export function asLeadScore(input: string | null | undefined): LeadScoreDTO {
  const v = (input ?? '').trim().toLowerCase()
  if (v === 'hot') return 'Hot'
  if (v === 'warm') return 'Warm'
  if (v === 'cold') return 'Cold'

  if (v === 'qualified' || v === 'opportunity') return 'Hot'
  if (v === 'site visit' || v === 'site_visit' || v === 'sitevisit') return 'Hot'
  if (v === 'new' || v === 'contacted') return 'Warm'

  return 'Warm'
}

export function asLeadStatus(input: string | null | undefined): LeadStatusDTO {
  const v = (input ?? '').trim().toLowerCase()
  if (v === 'new') return 'New'
  if (v === 'contacted') return 'Contacted'
  if (v === 'qualified') return 'Qualified'
  if (v === 'opportunity') return 'Opportunity'
  if (v === 'site visit' || v === 'site_visit' || v === 'sitevisit') return 'Site Visit'
  if (v === 'hot' || v === 'warm' || v === 'cold') return 'New'
  return 'New'
}

export function toLeadRow(c: CaptureLeadDTO): LeadDTO {
  const created = c.created_at ?? new Date().toISOString()
  const last = c.updated_at ?? created
  return {
    id: c.id,
    name: c.name ?? '—',
    contact: c.number ?? '',
    email: '',
    source: c.source ?? '—',
    status: asLeadStatus(c.status),
    score: asLeadScore(c.status),
    assignedTo: c.callBy ?? '—',
    createdAtISO: created,
    lastContactAtISO: last,
    budgetLabel: c.budget ?? '',
    bhkLabel: c.bhk ?? '',
    locationLabel: c.resiLocation ?? '',
    repeatCustomer: false,
    sentiment: 'Neutral',
    timelineLabel: '—',
  }
}

export function toLeadDetailsRow(c: CaptureLeadDTO): LeadDTO {
  const created = c.created_at ?? new Date().toISOString()
  const last = c.updated_at ?? created
  const statusRaw = (c.status ?? '').trim().toLowerCase()
  const score: LeadDTO['score'] = statusRaw === 'hot' ? 'Hot' : statusRaw === 'cold' ? 'Cold' : 'Warm'
  const status: LeadDTO['status'] = 'New'

  return {
    id: c.id,
    name: c.name ?? '—',
    contact: c.number ?? '',
    email: '',
    source: c.source ?? '—',
    status,
    score,
    assignedTo: c.callBy ?? '—',
    createdAtISO: created,
    lastContactAtISO: last,
    budgetLabel: c.budget ?? '',
    bhkLabel: c.bhk ?? '',
    locationLabel: c.resiLocation ?? '',
    repeatCustomer: false,
    sentiment: 'Neutral',
    timelineLabel: '—',
  }
}

