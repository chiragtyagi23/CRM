import type { AxiosRequestConfig } from 'axios'

import { aclHttp } from '../services/aclHttp'

export type WaTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
export type WaTemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED' | 'IN_APPEAL' | string

export type WaTemplateButton = {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE' | 'OTP'
  text?: string
  url?: string
  phone_number?: string
  example?: string[] | string
  otp_type?: string
}

export type WaTemplateComponent = {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS'
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION'
  text?: string
  buttons?: WaTemplateButton[]
  example?: Record<string, unknown>
}

export type WaTemplate = {
  id: string
  metaTemplateId: string | null
  name: string
  language: string
  category: WaTemplateCategory
  status: WaTemplateStatus
  rejectedReason: string | null
  qualityScore: string | null
  parameterFormat: 'POSITIONAL' | 'NAMED' | null
  components: WaTemplateComponent[]
  lastSyncedAt: string | null
  created_at: string
  updated_at: string
}

export type WaCreateTemplateInput = {
  name: string
  language: string
  category: WaTemplateCategory
  parameterFormat?: 'POSITIONAL' | 'NAMED'
  allowCategoryChange?: boolean
  components: WaTemplateComponent[]
}

export type WaSendParams = {
  header?: string[]
  headerMediaLink?: string
  body?: string[]
  buttons?: Record<string, string>
}

export type WaLeadField = 'name' | 'number' | 'email' | 'budget' | 'bhk' | 'resiLocation' | 'workLocation'
export type WaParamSource = string | { source: 'static'; value: string } | { source: 'lead'; field: WaLeadField; fallback?: string }

export type WaBroadcastParams = {
  header?: WaParamSource[]
  headerMediaLink?: string
  body?: WaParamSource[]
  buttons?: Record<string, WaParamSource>
}

export type WaLeadSummary = {
  id: string
  name: string
  status?: string | null
  leadScore?: string | null
  number?: string
  email?: string | null
}

export type WaConversation = {
  id: string
  waId: string
  profileName: string | null
  leadId: string | null
  lead?: WaLeadSummary | null
  lastMessageAt: string | null
  lastMessagePreview: string | null
  lastInboundAt: string | null
  unreadCount: number
  optedOut: boolean
  windowOpen: boolean
  windowExpiresAt: string | null
  /** Contact fields — every conversation row is also a contact. */
  name: string | null
  tags: string[]
  source: 'manual' | 'import' | 'inbound' | 'send' | 'broadcast' | null
  archived: boolean
  optedInAt: string | null
  consentNote: string | null
  aiEnabled: boolean
  created_at: string
}

export type WaContactImportRow = { name?: string; phone: string; tags?: string[] }
export type WaContactImportResult = { created: number; updated: number; invalid: { row: number; phone: string; reason: string }[] }

export type WaMessageStatus = 'accepted' | 'sent' | 'delivered' | 'read' | 'failed' | 'received'

export type WaMessage = {
  id: string
  conversationId: string
  broadcastId: string | null
  wamid: string | null
  direction: 'inbound' | 'outbound'
  type: string
  body: string | null
  templateName: string | null
  templateLanguage: string | null
  status: WaMessageStatus
  /** CRM user id, or "ai-agent" when your AI backend sent it. */
  sentBy: string | null
  error: { message?: string; title?: string; code?: number | string } | null
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  failedAt: string | null
  created_at: string
}

export type WaCounts = { sent: number; delivered: number; read: number; failed: number; processed: number }

export type WaBroadcast = {
  id: string
  name: string
  templateName: string
  templateLanguage: string
  totalRecipients: number
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  skippedCount: number
  counts: WaCounts
  created_at: string
}

export type WaBroadcastRecipient = {
  id: string
  status: WaMessageStatus
  error: WaMessage['error']
  sentAt: string | null
  deliveredAt: string | null
  readAt: string | null
  failedAt: string | null
  created_at: string
  conversation?: { id: string; waId: string; profileName: string | null; lead?: { id: string; name: string } | null }
}

export type WaBroadcastDetail = Omit<WaBroadcast, 'skippedCount'> & {
  skipped: { to: string; reason: string }[]
  recipients: WaBroadcastRecipient[]
}

export type WaStats = {
  range: { from: string; to: string; tz: string }
  totals: WaCounts & { received: number; contacts: number }
  daily: { day: string; sent: number; delivered: number; read: number; failed: number; received: number }[]
  byTemplate: (WaCounts & { template_name: string; template_language: string })[]
  failures: { code: string; reason: string; count: number }[]
  conversations: { total: number; open_windows: number; unread: number; opted_out: number }
  templatesByStatus: Record<string, number>
}

export type WaMetaAnalytics = {
  totals: { sent: number; delivered: number }
  daily: { day: string; sent: number; delivered: number }[]
}

export type WaPhoneInfo = {
  id: string
  display_phone_number?: string
  verified_name?: string
  quality_rating?: string
  messaging_limit_tier?: string
  name_status?: string
  code_verification_status?: string
  platform_type?: string
  status?: string
  throughput?: { level?: string }
}

export type WaBusinessProfile = {
  about?: string
  address?: string
  description?: string
  email?: string
  profile_picture_url?: string
  websites?: string[]
  vertical?: string
}

export type WaAccount = {
  id: string
  name: string
  displayPhoneNumber: string | null
  verifiedName: string | null
  isActive: boolean
  ready: boolean
}

/** Manager view. Secrets are never returned — only whether each is set. */
export type WaAccountDetail = WaAccount & {
  phoneNumberId: string
  businessAccountId: string
  appId: string | null
  graphVersion: string
  aiWebhookUrl: string | null
  secrets: { accessToken: boolean; appSecret: boolean; webhookVerifyToken: boolean; aiWebhookSecret: boolean; aiApiKey: boolean }
  secretsUpdatedAt: string | null
  lastVerifiedAt: string | null
  lastError: string | null
  webhookPath: string
  userCount?: number
  created_at: string
}

/** Write-only secret fields: a string sets, null clears, omitted leaves unchanged. */
export type WaAccountInput = {
  name?: string
  phoneNumberId?: string
  businessAccountId?: string
  appId?: string | null
  graphVersion?: string
  aiWebhookUrl?: string | null
  isActive?: boolean
  accessToken?: string | null
  appSecret?: string | null
  webhookVerifyToken?: string | null
  aiWebhookSecret?: string | null
  aiApiKey?: string | null
}

export type WaStatus = {
  account: WaAccountDetail
  configured: boolean
  webhook: { verifyTokenSet: boolean; appSecretSet: boolean; path: string }
  headerMediaUploadEnabled: boolean
  agent: { forwardingEnabled: boolean; webhookUrlSet: boolean; webhookSecretSet: boolean; apiKeySet: boolean; replyPath: string }
  graphVersion: string
  phone: WaPhoneInfo | null
  profile: WaBusinessProfile | null
  error: string | null
}

/** UI gates for the action children of the `whatsapp` module. */
export type WaPermissions = { send: boolean; templates: boolean; settings: boolean; contacts: boolean; accounts: boolean }

export type WaContactRecipients = { all?: boolean; tags?: string[]; ids?: string[] }

const base = '/api/whatsapp'

/** The account every WhatsApp call is scoped to; set by the WhatsApp page's account switcher. */
let currentAccountId: string | null = null
export function setWhatsappAccountId(id: string | null) {
  currentAccountId = id
}

function withAccount(config: AxiosRequestConfig = {}): AxiosRequestConfig {
  if (!currentAccountId) return config
  return { ...config, headers: { ...(config.headers ?? {}), 'X-WhatsApp-Account': currentAccountId } }
}

const wa = {
  get: <T>(url: string, config?: AxiosRequestConfig) => aclHttp.get<T>(url, withAccount(config)),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => aclHttp.post<T>(url, data, withAccount(config)),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => aclHttp.patch<T>(url, data, withAccount(config)),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => aclHttp.put<T>(url, data, withAccount(config)),
  delete: <T>(url: string, config?: AxiosRequestConfig) => aclHttp.delete<T>(url, withAccount(config)),
}

export const whatsappApi = {
  accounts: () =>
    wa
      .get<{ items: (WaAccount | WaAccountDetail)[]; canManage: boolean; encryptionConfigured: boolean }>(`${base}/accounts`)
      .then((r) => r.data),
  createAccount: (body: WaAccountInput) => wa.post<WaAccountDetail>(`${base}/accounts`, body).then((r) => r.data),
  updateAccount: (id: string, body: WaAccountInput) => wa.patch<WaAccountDetail>(`${base}/accounts/${id}`, body).then((r) => r.data),
  verifyAccount: (id: string) => wa.post<WaAccountDetail>(`${base}/accounts/${id}/verify`).then((r) => r.data),
  assignableUsers: () =>
    wa.get<{ items: { id: string; name: string; email: string }[] }>(`${base}/accounts/assignable-users`).then((r) => r.data.items),
  accountUsers: (id: string) => wa.get<{ userIds: string[] }>(`${base}/accounts/${id}/users`).then((r) => r.data.userIds),
  setAccountUsers: (id: string, userIds: string[]) =>
    wa.put<{ userIds: string[] }>(`${base}/accounts/${id}/users`, { userIds }).then((r) => r.data.userIds),

  status: () => wa.get<WaStatus>(`${base}/status`).then((r) => r.data),
  updateBusinessProfile: (body: Partial<WaBusinessProfile>) =>
    wa.patch<{ ok: true; profile: WaBusinessProfile }>(`${base}/business-profile`, body).then((r) => r.data),

  templates: (params?: { status?: string; category?: string; q?: string }) =>
    wa.get<{ items: WaTemplate[] }>(`${base}/templates`, { params }).then((r) => r.data.items),
  syncTemplates: () => wa.post<{ synced: number; removed: number }>(`${base}/templates/sync`).then((r) => r.data),
  createTemplate: (body: WaCreateTemplateInput) => wa.post<WaTemplate>(`${base}/templates`, body).then((r) => r.data),
  deleteTemplate: (id: string) => wa.delete(`${base}/templates/${id}`),
  uploadHeaderMedia: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return aclHttp
      .post<{ handle: string }>(`${base}/templates/header-media`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.handle)
  },

  stats: (params: { from: string; to: string; tz?: string }) =>
    wa.get<WaStats>(`${base}/stats`, { params }).then((r) => r.data),
  metaAnalytics: (params: { from: string; to: string }) =>
    wa.get<WaMetaAnalytics>(`${base}/stats/meta`, { params }).then((r) => r.data),

  conversations: (params?: { q?: string; unread?: boolean; limit?: number; offset?: number }) =>
    aclHttp
      .get<{ items: WaConversation[]; total: number }>(`${base}/conversations`, {
        params: { ...params, unread: params?.unread ? '1' : undefined },
      })
      .then((r) => r.data),
  conversation: (id: string) => wa.get<WaConversation>(`${base}/conversations/${id}`).then((r) => r.data),
  messages: (id: string, params?: { before?: string; limit?: number }) =>
    wa.get<{ items: WaMessage[] }>(`${base}/conversations/${id}/messages`, { params }).then((r) => r.data.items),
  markRead: (id: string) => wa.post<WaConversation>(`${base}/conversations/${id}/read`).then((r) => r.data),
  setAi: (id: string, aiEnabled: boolean) =>
    wa.patch<WaConversation>(`${base}/conversations/${id}/ai`, { aiEnabled }).then((r) => r.data),

  contacts: (params?: { q?: string; tag?: string; consent?: 'reachable' | 'opted_out'; limit?: number; offset?: number }) =>
    wa.get<{ items: WaConversation[]; total: number }>(`${base}/contacts`, { params }).then((r) => r.data),
  contactTags: () => wa.get<{ items: { tag: string; count: number }[] }>(`${base}/contacts/tags`).then((r) => r.data.items),
  createContact: (body: { name?: string; phone: string; tags?: string[]; consent: true; consentNote?: string }) =>
    wa.post<WaConversation>(`${base}/contacts`, body).then((r) => r.data),
  updateContact: (id: string, body: { name?: string | null; tags?: string[]; consentNote?: string | null; archived?: boolean }) =>
    wa.patch<WaConversation>(`${base}/contacts/${id}`, body).then((r) => r.data),
  importContacts: (body: { rows: WaContactImportRow[]; defaultTags?: string[]; consent: true; consentNote?: string }) =>
    wa.post<WaContactImportResult>(`${base}/contacts/import`, body).then((r) => r.data),

  sendTemplate: (body: { templateId: string; to?: string; leadId?: string; conversationId?: string; params: WaSendParams }) =>
    wa.post<WaMessage>(`${base}/messages/template`, body).then((r) => r.data),
  sendText: (body: { conversationId: string; text: string }) =>
    wa.post<WaMessage>(`${base}/messages/text`, body).then((r) => r.data),

  broadcasts: () => wa.get<{ items: WaBroadcast[]; total: number }>(`${base}/broadcasts`).then((r) => r.data),
  broadcast: (id: string) => wa.get<WaBroadcastDetail>(`${base}/broadcasts/${id}`).then((r) => r.data),
  createBroadcast: (body: {
    name: string
    templateId: string
    params: WaBroadcastParams
    recipients: {
      leadIds?: string[]
      filter?: { campaignId?: string; status?: string; score?: string; source?: string; q?: string }
      phones?: string[]
      contacts?: WaContactRecipients
    }
  }) =>
    aclHttp
      .post<{ broadcast: WaBroadcast; queued: number; skipped: { to: string; reason: string }[] }>(`${base}/broadcasts`, body)
      .then((r) => r.data),
}
