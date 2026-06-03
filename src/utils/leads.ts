import type { RecentLeadDTO } from '../lib/dashboardDummyApi'
import { asLeadScore, asLeadStatus } from './leadMapping'

export function asRecentLeadScore(
  status: string | null | undefined,
  leadScore?: string | null,
): RecentLeadDTO['score'] {
  return asLeadScore(status, leadScore)
}

export function asRecentLeadStatus(status: string | null | undefined): RecentLeadDTO['status'] {
  return asLeadStatus(status)
}
