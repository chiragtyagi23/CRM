import type { RecentLeadDTO } from '../lib/dashboardDummyApi'

export function asRecentLeadScore(status: string | null | undefined): RecentLeadDTO['score'] {
  const v = (status ?? '').trim().toLowerCase()
  if (v === 'hot') return 'Hot'
  if (v === 'cold') return 'Cold'
  if (v === 'warm') return 'Warm'
  return 'Warm'
}

export function asRecentLeadStatus(status: string | null | undefined): RecentLeadDTO['status'] {
  const v = (status ?? '').trim().toLowerCase()
  if (v === 'new') return 'New'
  if (v === 'contacted') return 'Contacted'
  if (v === 'qualified') return 'Qualified'
  if (v === 'opportunity') return 'Opportunity'
  if (v === 'site visit' || v === 'site_visit' || v === 'sitevisit') return 'Site Visit'
  // Backend sends HOT/WARM/COLD in capture_leads.status; keep table stable.
  if (v === 'hot' || v === 'warm' || v === 'cold') return 'New'
  return 'New'
}

