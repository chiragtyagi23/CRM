import { apiGet, apiSend } from './crmApi'
import type {
  BulkCaptureLeadRow,
  BulkCaptureLeadsResponse,
  CaptureLeadCreatePayload,
  CaptureLeadDTO,
  CaptureLeadPatchPayload,
} from '../types/dtos'

export type {
  BulkCaptureLeadRow,
  BulkCaptureLeadsResponse,
  BulkCaptureLeadsValidationFailure,
  CaptureLeadCreatePayload,
  CaptureLeadDTO,
  CaptureLeadPatchPayload,
} from '../types/dtos'

export type FetchCaptureLeadsParams = {
  campaignId?: string
  page?: number
  pageSize?: number
  q?: string
  status?: string
  score?: string
  source?: string
  bhk?: string
  budget?: string
}

export type CaptureLeadsListResponse = {
  items: CaptureLeadDTO[]
  total: number
  page: number
  pageSize: number
}

function buildCaptureLeadsQuery(params?: FetchCaptureLeadsParams | string): string {
  if (typeof params === 'string') {
    return params ? `?campaignId=${encodeURIComponent(params)}` : ''
  }
  if (!params) return ''

  const qs = new URLSearchParams()
  if (params.campaignId) qs.set('campaignId', params.campaignId)
  if (params.page != null) qs.set('page', String(params.page))
  if (params.pageSize != null) qs.set('pageSize', String(params.pageSize))
  if (params.q?.trim()) qs.set('q', params.q.trim())
  if (params.status && params.status !== 'all') qs.set('status', params.status)
  if (params.score && params.score !== 'all') qs.set('score', params.score)
  if (params.source && params.source !== 'all') qs.set('source', params.source)
  if (params.bhk && params.bhk !== 'all') qs.set('bhk', params.bhk)
  if (params.budget && params.budget !== 'all') qs.set('budget', params.budget)

  const s = qs.toString()
  return s ? `?${s}` : ''
}

export async function fetchCaptureLeads(
  params?: FetchCaptureLeadsParams | string,
): Promise<CaptureLeadsListResponse> {
  const data = await apiGet<Partial<CaptureLeadsListResponse> & { items: CaptureLeadDTO[] }>(
    `/api/capture-leads${buildCaptureLeadsQuery(params)}`,
  )
  const items = data.items ?? []
  return {
    items,
    total: data.total ?? items.length,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? items.length,
  }
}

/** Property Listings details: any signed-in user, assignee omitted. */
export async function fetchPropertyListingById(id: string): Promise<CaptureLeadDTO> {
  return await apiGet<CaptureLeadDTO>(`/api/capture-leads/listings/${id}`)
}

export async function fetchCaptureLeadById(id: string): Promise<CaptureLeadDTO> {
  return await apiGet<CaptureLeadDTO>(`/api/capture-leads/${id}`)
}

export async function createCaptureLead(payload: CaptureLeadCreatePayload): Promise<CaptureLeadDTO> {
  return await apiSend<CaptureLeadDTO>('/api/capture-leads', 'POST', payload)
}

export async function createCaptureLeadsBulk(payload: {
  source: string
  leads: BulkCaptureLeadRow[]
}): Promise<BulkCaptureLeadsResponse> {
  return await apiSend<BulkCaptureLeadsResponse>('/api/capture-leads/bulk', 'POST', payload)
}

export async function patchCaptureLead(id: string, payload: CaptureLeadPatchPayload): Promise<CaptureLeadDTO> {
  return await apiSend<CaptureLeadDTO>(`/api/capture-leads/${id}`, 'PATCH', payload)
}

/** Property Listings: all leads for any signed-in user (no assignment filter, no assignee field). */
export async function fetchPropertyListings(
  params?: FetchCaptureLeadsParams,
  signal?: AbortSignal,
): Promise<CaptureLeadsListResponse> {
  const data = await apiGet<Partial<CaptureLeadsListResponse> & { items: CaptureLeadDTO[] }>(
    `/api/capture-leads/listings${buildCaptureLeadsQuery(params)}`,
    { signal },
  )
  const items = data.items ?? []
  return {
    items,
    total: data.total ?? items.length,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? items.length,
  }
}
