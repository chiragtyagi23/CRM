import { apiGet, apiSend } from './crmApi'
import type { MappingRecord } from './bulkDataFields'

export type BulkDataRow = {
  rowNumber: number
  name: string
  phone: string
  email: string
  meta: Record<string, string>
}

export type BulkDataFailure = { rowNumber: number; errors: string[] }

/** Max length of the dataset/import name (matches the backend column). */
export const DATASET_NAME_MAX = 255

/** Shown for rows imported before dataset names existed. */
export const UNNAMED_DATASET = 'Unnamed Dataset'

export async function createBulkData(
  datasetName: string,
  mapping: MappingRecord,
  rows: BulkDataRow[],
): Promise<{ count: number }> {
  return await apiSend<{ count: number }>('/api/bulk-data', 'POST', { datasetName, mapping, rows })
}

export type BulkDataListItem = {
  id: string
  datasetName: string | null
  name: string
  phone: string
  email: string
  created_at: string
  uploader: { id: string; name: string } | null
}

export type BulkDataRecord = BulkDataListItem & {
  meta: Record<string, string>
  mapping: Partial<MappingRecord>
}

export type BulkDataPage = {
  items: BulkDataListItem[]
  total: number
  page: number
  pageSize: number
  /** Admin/manager: all uploads + "Uploaded by" filter. Others: only their own uploads. */
  canViewAll: boolean
}

export type BulkDataQuery = {
  page: number
  pageSize: number
  q?: string
  sortOrder?: 'asc' | 'desc'
  uploadedBy?: string
  /** Rows from any of these datasets; sent as repeated `datasetName` params. */
  datasetNames?: string[]
}

export async function fetchBulkDataPage(query: BulkDataQuery): Promise<BulkDataPage> {
  const params = new URLSearchParams()
  const { datasetNames, ...rest } = query
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  for (const name of datasetNames ?? []) params.append('datasetName', name)
  return await apiGet<BulkDataPage>(`/api/bulk-data?${params.toString()}`)
}

export async function fetchBulkDataUploaders(): Promise<{ items: { id: string; name: string }[] }> {
  return await apiGet<{ items: { id: string; name: string }[] }>('/api/bulk-data/uploaders')
}

/** Dataset names among the rows the current user can see (A–Z). */
export async function fetchBulkDataDatasets(): Promise<{ items: string[] }> {
  return await apiGet<{ items: string[] }>('/api/bulk-data/datasets')
}

export async function fetchBulkDataById(id: string): Promise<BulkDataRecord> {
  return await apiGet<BulkDataRecord>(`/api/bulk-data/${encodeURIComponent(id)}`)
}
