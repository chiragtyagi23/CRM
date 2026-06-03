import { apiGet } from './crmApi'
import type { CampaignListResponse } from '../types/dtos'

/** Campaign used as a “project” in site-visit scheduling (id + display name). */
export type CampaignProjectOption = {
  id: string
  name: string
}

export async function fetchCampaignProjects(): Promise<CampaignProjectOption[]> {
  const res = await apiGet<CampaignListResponse>('/api/campaigns')
  return (res.items ?? []).map((c) => ({
    id: c.id,
    name: c.title?.trim() || c.id,
  }))
}
