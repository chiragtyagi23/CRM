import { apiGet, apiSend } from './crmApi'

export type CaptureLeadDTO = {
  id: string
  source: string | null
  firstCallDate: string | null
  callBy: string | null
  name: string
  number: string
  email: string | null
  whatsappNumber: string | null
  bhk: string | null
  budget: string | null
  resiLocation: string | null
  propertyOwnership: string | null
  workLocation: string | null
  workProfile: string | null
  industryType: string | null
  preferredLocation: string[]
  possessionDate: string | null
  status: string | null
  propertyBuyingStage: string | null
  callbackDate: string | null
  /** Local time string from `<input type="time">`, e.g. `14:30` */
  callbackTime: string | null
  created_at?: string
  updated_at?: string
}

export type CaptureLeadCreatePayload = Omit<CaptureLeadDTO, 'id' | 'created_at' | 'updated_at'>
export type CaptureLeadPatchPayload = Partial<CaptureLeadCreatePayload>

export async function fetchCaptureLeads(): Promise<{ items: CaptureLeadDTO[] }> {
  return await apiGet<{ items: CaptureLeadDTO[] }>('/api/capture-leads')
}

export async function fetchCaptureLeadById(id: string): Promise<CaptureLeadDTO> {
  return await apiGet<CaptureLeadDTO>(`/api/capture-leads/${id}`)
}

export async function createCaptureLead(payload: CaptureLeadCreatePayload): Promise<CaptureLeadDTO> {
  return await apiSend<CaptureLeadDTO>('/api/capture-leads', 'POST', payload)
}

export type BulkCaptureLeadRow = { name: string; number: string; email: string }

export type BulkCaptureLeadsResponse = { count: number; items: CaptureLeadDTO[] }

export type BulkCaptureLeadsValidationFailure = {
  rowNumber: number
  name: string
  phone: string
  email: string
  errors: string[]
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

