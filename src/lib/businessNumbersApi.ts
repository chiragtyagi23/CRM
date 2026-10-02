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
  /** Number series per country (e.g. IN → 080 Bengaluru, 022 Mumbai). */
  prefixes: Record<string, { prefix: string; digits: string; label: string }[]>
  /** null = no limit (managers) */
  limit: number | null
  used: number
  canManage: boolean
  /** Managers only: user price = provider cost × this. */
  priceMultiplier?: number
  /** Amounts are USD; they're shown in ₹ at `usdToInr` (null → shown in $). */
  display: { currency: 'INR'; usdToInr: number | null; source: 'fixed' | 'live' | 'unavailable'; asOf: string | null }
}

export type BnSearchQuery = { countryIso: string; type?: string; prefix?: string; contains?: string; city?: string; services?: string; offset?: number }

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

export type BnAnalytics = {
  range: { from: string; to: string; tz: string }
  currency: string
  scope: { userId: string | null }
  /** When call/SMS records were last copied in; usage after this isn't counted yet. */
  lastSyncedAt: string | null
  totals: {
    spend: number
    rental: number
    setup: number
    usage: number
    voice: { inboundCalls: number; outboundCalls: number; inboundMinutes: number; outboundMinutes: number; spend: number }
    sms: { inbound: number; outbound: number; spend: number }
    /** SIP trunk calls — already included in voice totals. */
    sip: { calls: number; minutes: number; spend: number }
    activeNumbers: number
    cost?: number
    margin?: number
  }
  daily: { day: string; rental: number; usage: number; calls: number; minutes: number; sms: number }[]
  byNumber: {
    id: string
    number: string
    label: string | null
    status: BnStatus
    rental: number
    usage: number
    total: number
    calls: number
    minutes: number
    sms: number
    cost?: number
    margin?: number
  }[]
  byUser?: { userId: string | null; name: string; email: string | null; numbers: number; spend: number; cost: number; margin: number }[]
}

/** A voice or SIP trunk call log entry. SIP-only fields are absent on voice calls. */
export type SipCall = {
  id: string
  kind: 'voice' | 'sip'
  callId: string
  direction: 'inbound' | 'outbound'
  from: string | null
  to: string | null
  fromCountry?: string | null
  toCountry?: string | null
  trunk?: string | null
  startedAt: string | null
  answeredAt: string | null
  endedAt: string
  /** seconds */
  duration: number
  billedDuration: number
  status: 'answered' | 'unanswered'
  hangupCause: string | null
  hangupCode: number | null
  /** voice: caller | callee | carrier | platform · sip: customer | carrier | platform */
  hangupSource: string | null
  transport?: string | null
  srtp?: boolean | null
  secureTrunking?: boolean | null
  stirVerification: string | null
  attestation?: string | null
  price: number
  currency: string
  businessNumber: { id: string; number: string; label: string | null } | null
  cost?: number
  owner?: { id: string; name: string; email: string } | null
}

export type SipCallQuery = {
  from: string
  to: string
  direction?: string
  status?: string
  hangupSource?: string
  q?: string
  userId?: string
  limit?: number
  offset?: number
}

export type SipCallPage = {
  range: { from: string; to: string }
  items: SipCall[]
  total: number
  limit: number
  offset: number
  summary: { calls: number; answered: number; minutes: number; spend: number; cost?: number }
}

export type SyncStatus = {
  available: boolean
  running: boolean
  trigger: 'manual' | 'scheduled' | null
  startedAt: string | null
  finishedAt: string | null
  windowsDone: number
  windowsTotal: number
  fetched: number
  stored: number
  error: string | null
  /** Activity up to this moment is in the CRM. */
  lastSyncedAt: string | null
  lastRunAt: string | null
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

  analytics: (params: { from: string; to: string; tz?: string; userId?: string }) =>
    aclHttp.get<BnAnalytics>(`${base}/analytics`, { params }).then((r) => r.data),
  /** Starts a background refresh; returns immediately. Poll syncStatus() for progress. */
  syncUsage: () =>
    aclHttp.post<{ started: boolean; reason?: 'too_soon'; status: SyncStatus }>(`${base}/admin/sync-usage`).then((r) => r.data),
  syncStatus: () => aclHttp.get<SyncStatus>(`${base}/sync-status`).then((r) => r.data),

  /** Call logs: kind "voice" (regular calls) or "sip" (SIP trunk). */
  callLogs: (kind: 'voice' | 'sip', params: SipCallQuery) =>
    aclHttp.get<SipCallPage>(`${base}/${kind}-calls`, { params }).then((r) => r.data),
  callLog: (kind: 'voice' | 'sip', id: string) => aclHttp.get<SipCall>(`${base}/${kind}-calls/${id}`).then((r) => r.data),

  all: (params?: { status?: string; ownerId?: string; q?: string }) =>
    aclHttp.get<{ items: BusinessNumberAdmin[] }>(`${base}/admin/all`, { params }).then((r) => r.data.items),
  users: () => aclHttp.get<{ items: { id: string; name: string; email: string }[] }>(`${base}/admin/users`).then((r) => r.data.items),
  assign: (id: string, ownerUserId: string) => aclHttp.post<BusinessNumberAdmin>(`${base}/${id}/assign`, { ownerUserId }).then((r) => r.data),
  reconcile: () =>
    aclHttp.get<{ unassigned: BnUnassigned[]; missing: BusinessNumberAdmin[] }>(`${base}/admin/reconcile`).then((r) => r.data),
  importNumber: (body: { number: string; ownerUserId: string; countryIso: string; label?: string }) =>
    aclHttp.post<BusinessNumberAdmin>(`${base}/admin/import`, body).then((r) => r.data),
}

/** USD→INR rate for display, set once the page's overview loads. All API amounts are USD. */
let usdToInr: number | null = null
export function setDisplayRate(rate: number | null) {
  usdToInr = rate && rate > 0 ? rate : null
}

/** A USD amount in the display currency (for charts, which need numbers rather than formatted text). */
export function toDisplayAmount(amountUsd: number) {
  return Math.round(amountUsd * (usdToInr ?? 1) * 100) / 100
}

/** Formats an amount that is already in the display currency (e.g. a chart value from toDisplayAmount). */
export function fmtDisplayAmount(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '—'
  return usdToInr
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount)
    : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount)
}

/** Formats a USD amount in ₹ (converted at the display rate), or in $ when no rate is available. */
export function fmtMoney(amountUsd: number | null | undefined) {
  if (amountUsd === null || amountUsd === undefined) return '—'
  return fmtDisplayAmount(amountUsd * (usdToInr ?? 1))
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

export function fmtDuration(seconds: number) {
  if (!seconds) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h ? `${h}h` : '', m ? `${m}m` : '', s || (!h && !m) ? `${s}s` : ''].filter(Boolean).join(' ')
}
