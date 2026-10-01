import { apiGet, apiSend } from './crmApi'

export type IntegrationStatus = 'PENDING' | 'ACTIVE' | 'ERROR' | 'DISABLED'

export type NinetyNineAcresIntegration = {
  id: string
  provider: '99acres'
  accountId: string
  status: IntegrationStatus
  webhookUrl: string | null
  consecutiveFailureCount: number
  lastWebhookAt: string | null
  lastLeadReceivedAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export type WebhookTestStep = {
  name: string
  ok: boolean
  detail?: string
}

export type WebhookTestResult = {
  ok: boolean
  steps: WebhookTestStep[]
  pipeline: { status: number; body: unknown } | null
}

export type WebhookLog = {
  id: string
  integrationId: string
  ownerUserId: string
  provider: string
  eventType: string
  requestHeaders: Record<string, string>
  requestBody: unknown
  responseStatus: number | null
  processingStatus: string
  errorMessage: string | null
  receivedAt: string
  processedAt: string | null
  durationMs: number | null
  leadName: string | null
  leadId: string | null
  externalLeadId: string | null
  result: {
    processingStatus: string
    responseStatus: number | null
    duplicate: boolean
    leadId: string | null
    leadName: string | null
    externalLeadId: string | null
  }
}

const base = '/api/integrations/99acres'

export function fetch99AcresIntegration() {
  return apiGet<{ item: NinetyNineAcresIntegration | null }>(base)
}

export function connect99Acres(accountId: string) {
  return apiSend<{ item: NinetyNineAcresIntegration }>(base, 'POST', { accountId })
}

export function update99Acres(body: { accountId?: string; status?: IntegrationStatus }) {
  return apiSend<{ item: NinetyNineAcresIntegration }>(base, 'PATCH', body)
}

export function disconnect99Acres() {
  return apiSend<{ item: NinetyNineAcresIntegration }>(base, 'DELETE')
}

export function regenerate99AcresWebhook() {
  return apiSend<{ item: NinetyNineAcresIntegration }>(`${base}/regenerate-webhook`, 'POST', {})
}

export function test99AcresWebhook() {
  return apiSend<WebhookTestResult>(`${base}/test`, 'POST', {})
}

export function send99AcresSetupEmail() {
  return apiSend<{ ok: boolean; to: string; sent: boolean; devLogged: boolean }>(
    `${base}/send-setup-email`,
    'POST',
    {},
  )
}

export function fetch99AcresLogs() {
  return apiGet<{ items: WebhookLog[] }>(`${base}/webhook-logs`)
}

export function fetch99AcresLog(id: string) {
  return apiGet<{ item: WebhookLog }>(`${base}/webhook-logs/${id}`)
}
