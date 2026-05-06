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

export async function fetchCaptureLeads(): Promise<{ items: CaptureLeadDTO[] }> {
  return await apiGet<{ items: CaptureLeadDTO[] }>('/api/capture-leads')
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
