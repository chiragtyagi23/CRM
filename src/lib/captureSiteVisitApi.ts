import { apiGet, apiSend } from './crmApi'
import type { SiteVisitCreatePayload, SiteVisitDTO } from '../types/dtos'

export type { SiteVisitCreatePayload, SiteVisitDTO } from '../types/dtos'

export async function fetchSiteVisits(): Promise<{ items: SiteVisitDTO[] }> {
  return await apiGet<{ items: SiteVisitDTO[] }>('/api/site-visits')
}

export async function fetchSiteVisitById(id: string): Promise<SiteVisitDTO> {
  return await apiGet<SiteVisitDTO>(`/api/site-visits/${id}`)
}

export async function createSiteVisit(payload: SiteVisitCreatePayload): Promise<SiteVisitDTO> {
  return await apiSend<SiteVisitDTO>('/api/site-visits', 'POST', payload)
}
