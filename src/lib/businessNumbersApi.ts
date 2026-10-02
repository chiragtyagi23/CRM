import { aclHttp } from '../services/aclHttp'

export type BnStatus = 'active' | 'pending' | 'released'

export type BusinessNumber = {
  id: string
  number: string
  countryIso: string
  type: string | null
  city: string | null
  region: string | null
  voiceEnabled: boolean
  smsEnabled: boolean
  label: string | null
  status: BnStatus
  currency: string
  monthlyPrice: number | null
  setupPrice: number | null
  purchasedAt: string | null
  releasedAt: string | null
}

/** Manager view adds the owner and our cost. */
export type BusinessNumberAdmin = BusinessNumber & {
  owner: { id: string; name: string; email: string } | null
  ownerUserId: string | null
  monthlyCost: number | null
  setupCost: number | null
}

export type AvailableNumber = {
  number: string
  countryIso: string
  type: string | null
  city: string | null
  region: string | null
  voiceEnabled: boolean
  smsEnabled: boolean
  currency: string
  monthlyPrice: number | null
  setupPrice: number
}

export type BnOverview = {
  available: boolean
  currency: string
  countries: { iso: string; name: string }[]
  types: string[]
  /** null = no limit (managers) */
  limit: number | null
  used: number
  canManage: boolean
  markupPercent?: number
}

export type BnSearchQuery = { countryIso: string; type?: string; contains?: string; city?: string; services?: string; offset?: number }

export type BnUnassigned = {
  number: string
  type: string | null
  region: string | null
  voiceEnabled: boolean
  smsEnabled: boolean
  monthlyCost: number | null
  monthlyPrice: number | null
  addedOn: string | null
}

const base = '/api/business-numbers'

export const businessNumbersApi = {
  overview: () => aclHttp.get<BnOverview>(base).then((r) => r.data),
  search: (params: BnSearchQuery) =>
    aclHttp.get<{ items: AvailableNumber[]; hasMore: boolean; nextOffset: number }>(`${base}/search`, { params }).then((r) => r.data),
  mine: (includeReleased = false) =>
    aclHttp.get<{ items: BusinessNumber[] }>(`${base}/mine`, { params: includeReleased ? { released: '1' } : undefined }).then((r) => r.data.items),
  purchase: (body: { number: string; label?: string }) => aclHttp.post<BusinessNumber>(base, body).then((r) => r.data),
  setLabel: (id: string, label: string | null) => aclHttp.patch<BusinessNumber>(`${base}/${id}`, { label }).then((r) => r.data),
  release: (id: string) => aclHttp.delete<BusinessNumber>(`${base}/${id}`).then((r) => r.data),

  all: (params?: { status?: string; ownerId?: string; q?: string }) =>
    aclHttp.get<{ items: BusinessNumberAdmin[] }>(`${base}/admin/all`, { params }).then((r) => r.data.items),
  users: () => aclHttp.get<{ items: { id: string; name: string; email: string }[] }>(`${base}/admin/users`).then((r) => r.data.items),
  assign: (id: string, ownerUserId: string) => aclHttp.post<BusinessNumberAdmin>(`${base}/${id}/assign`, { ownerUserId }).then((r) => r.data),
  reconcile: () =>
    aclHttp.get<{ unassigned: BnUnassigned[]; missing: BusinessNumberAdmin[] }>(`${base}/admin/reconcile`).then((r) => r.data),
  importNumber: (body: { number: string; ownerUserId: string; countryIso: string; label?: string }) =>
    aclHttp.post<BusinessNumberAdmin>(`${base}/admin/import`, body).then((r) => r.data),
}

export function fmtMoney(amount: number | null | undefined, currency = 'USD') {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
}

export const NUMBER_TYPE_LABEL: Record<string, string> = {
  local: 'Local',
  mobile: 'Mobile',
  tollfree: 'Toll-free',
  national: 'National',
  fixed: 'Landline',
}

export function fmtLocation(n: { city: string | null; region: string | null; countryIso: string }) {
  return [n.city, n.region, n.countryIso].filter(Boolean).join(', ')
}
