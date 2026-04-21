import { apiGet, apiSend } from './crmApi'

export type SiteVisitDTO = {
  id: string
  leadId: string
  projectId: string
  date: string
  time: string
  notes: string
  created_at?: string
  updated_at?: string
}

export type SiteVisitCreatePayload = Omit<SiteVisitDTO, 'id' | 'created_at' | 'updated_at'>


export async function fetchSiteVisits(): Promise<{ items: SiteVisitDTO[] }> {
  return await apiGet<{ items: SiteVisitDTO[] }>('/api/site-visits')
}

export async function fetchSiteVisitById(id: string): Promise<SiteVisitDTO> {
  return await apiGet<SiteVisitDTO>(`/api/site-visits/${id}`)
}

export async function createSiteVisit(payload: SiteVisitCreatePayload): Promise<SiteVisitDTO> {
  return await apiSend<SiteVisitDTO>('/api/site-visits', 'POST', payload)
}


