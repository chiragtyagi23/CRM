import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { ConfirmModal } from '../../components/acl/ConfirmModal'
import { Modal } from '../../components/acl/Modal'
import { useToast } from '../../components/acl/Toast'
import { PageHeader } from '../../components/PageHeader'
import { d } from '../../lib/designClasses'
import type { ApiError } from '../../lib/crmApi'
import {
  connect99Acres,
  disconnect99Acres,
  fetch99AcresIntegration,
  fetch99AcresLog,
  fetch99AcresLogs,
  regenerate99AcresWebhook,
  send99AcresSetupEmail,
  test99AcresWebhook,
  type NinetyNineAcresIntegration,
  type WebhookLog,
  type WebhookTestResult,
} from '../../lib/integrationsApi'

const SETUP_EMAIL_TO = '99acres@test.com'

const SETUP_STEPS = [
  'Enter your 99acres Account ID and connect. The integration starts as Pending.',
  'Copy the webhook URL shown on this page.',
  'In 99acres, set the lead webhook to that URL and send the header x-api-key with the partner key your administrator configured on the CRM server. You do not enter that key here.',
  'Use Test webhook, then confirm the test lead appears under Leads. The first successful lead marks the integration Active.',
]

function errorText(err: unknown, fallback: string) {
  const body = (err as ApiError | undefined)?.body as { error?: unknown } | undefined
  if (body && typeof body.error === 'string' && body.error.trim()) return body.error
  return fallback
}

function formatWhen(value?: string | null) {
  if (!value) return '—'
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return '—'
  return new Date(value).toLocaleString()
}

function statusClass(status: NinetyNineAcresIntegration['status']) {
  if (status === 'ACTIVE') return d.badgeWon
  if (status === 'ERROR') return d.badgeHot
  if (status === 'DISABLED') return d.badgeCold
  return d.badgeWarm
}

function maskSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => maskSecrets(item))
  if (!value || typeof value !== 'object') return value
  const out: Record<string, unknown> = {}
  for (const [key, inner] of Object.entries(value as Record<string, unknown>)) {
    if (/api[-_]?key|authorization|token|secret|password/i.test(key)) out[key] = '***'
    else out[key] = maskSecrets(inner)
  }
  return out
}

export function NinetyNineAcresPage() {
  const { toast } = useToast()
  const [item, setItem] = useState<NinetyNineAcresIntegration | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [testing, setTesting] = useState(false)
  const [mailing, setMailing] = useState(false)
  const [mailOpen, setMailOpen] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectOpen, setConnectOpen] = useState(false)
  const [accountId, setAccountId] = useState('')
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [regenerateOpen, setRegenerateOpen] = useState(false)
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [detail, setDetail] = useState<WebhookLog | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const busy = loading || saving || disconnecting || regenerating || testing || mailing

  const load = useCallback((withSpinner = false) => {
    if (withSpinner) setLoading(true)
    setError(null)
    return fetch99AcresIntegration()
      .then((res) => setItem(res.item))
      .catch((err: unknown) => setError(errorText(err, 'Could not load the 99acres integration')))
      .finally(() => {
        if (withSpinner) setLoading(false)
      })
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch99AcresIntegration()
      .then((res) => {
        if (!cancelled) setItem(res.item)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(errorText(err, 'Could not load the 99acres integration'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onConnect() {
    const trimmed = accountId.trim()
    if (!trimmed) {
      setError('99acres Account ID is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await connect99Acres(trimmed)
      setItem(res.item)
      setConnectOpen(false)
      setAccountId('')
      toast('99acres connected', 'success')
    } catch (err) {
      setError(errorText(err, 'Could not connect 99acres'))
    } finally {
      setSaving(false)
    }
  }

  async function onDisconnect() {
    setDisconnecting(true)
    setError(null)
    try {
      const res = await disconnect99Acres()
      setItem(res.item)
      setDisconnectOpen(false)
      toast('99acres disconnected', 'success')
    } catch (err) {
      setError(errorText(err, 'Could not disconnect 99acres'))
    } finally {
      setDisconnecting(false)
    }
  }

  async function onRegenerate() {
    setRegenerating(true)
    setError(null)
    try {
      const res = await regenerate99AcresWebhook()
      setItem(res.item)
      setRegenerateOpen(false)
      toast('Webhook URL regenerated', 'success')
    } catch (err) {
      setError(errorText(err, 'Could not regenerate the webhook'))
    } finally {
      setRegenerating(false)
    }
  }

  async function onTest() {
    setTesting(true)
    setError(null)
    try {
      const res = await test99AcresWebhook()
      setTestResult(res)
      await load(false)
    } catch (err) {
      const body = (err as ApiError | undefined)?.body as WebhookTestResult | undefined
      if (body && Array.isArray(body.steps)) {
        setTestResult(body)
        await load(false)
      } else {
        setError(errorText(err, 'Webhook test failed'))
      }
    } finally {
      setTesting(false)
    }
  }

  async function onMail() {
    setMailing(true)
    setError(null)
    try {
      const res = await send99AcresSetupEmail()
      setMailOpen(false)
      toast(res.sent ? `Setup email sent to ${res.to}` : `Setup email logged for ${res.to}`, 'success')
    } catch (err) {
      setError(errorText(err, 'Could not send the setup email'))
    } finally {
      setMailing(false)
    }
  }

  async function onCopy() {
    if (!item?.webhookUrl) return
    try {
      await navigator.clipboard.writeText(item.webhookUrl)
      toast('Copied', 'success')
    } catch {
      setError('Could not copy the webhook URL')
    }
  }

  async function onViewLogs() {
    setLogsOpen(true)
    setLogsLoading(true)
    setError(null)
    try {
      const res = await fetch99AcresLogs()
      setLogs(res.items ?? [])
    } catch (err) {
      setError(errorText(err, 'Could not load webhook logs'))
    } finally {
      setLogsLoading(false)
    }
  }

  async function onOpenLog(id: string) {
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await fetch99AcresLog(id)
      setDetail(res.item)
    } catch (err) {
      setError(errorText(err, 'Could not load that webhook log'))
    } finally {
      setDetailLoading(false)
    }
  }

  const statusLabel = loading ? 'Loading' : item ? item.status : 'Not connected'

  return (
    <div className={d.pageWrap}>
      <PageHeader
        title="99acres"
        subtitle="Settings / Integrations / 99acres"
        actions={
          <Link to="/settings/integrations" className={d.btnSecondarySm}>
            All integrations
          </Link>
        }
      />

      {error ? (
        <p className="mb-4 rounded-lg border border-[#D96B6B]/30 bg-[#D96B6B]/10 px-4 py-3 text-sm text-[#D96B6B]" role="alert">
          {error}
        </p>
      ) : null}

      <section className={`${d.cardP6} mb-6`}>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-[#2E2E2E]">Connection</h2>
          <span className={item ? statusClass(item.status) : d.badgeCold}>{statusLabel}</span>
          {saving ? <span className={d.muted}>Saving…</span> : null}
          {disconnecting ? <span className={d.muted}>Disconnecting…</span> : null}
          {testing ? <span className={d.muted}>Testing…</span> : null}
          {mailing ? <span className={d.muted}>Sending mail…</span> : null}
        </div>

        {loading ? <p className={d.muted}>Loading…</p> : null}

        {!loading && !item ? (
          <div className="space-y-4">
            <p className={d.body}>
              Not connected. Connect with your 99acres Account ID. The partner API key is configured on the server and is not stored on your user.
            </p>
            <button type="button" className={d.btnPrimarySm} onClick={() => setConnectOpen(true)} disabled={busy}>
              Connect 99acres
            </button>
          </div>
        ) : null}

        {!loading && item ? (
          <div className="space-y-5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className={d.label}>Account ID</dt>
                <dd className={d.body}>{item.accountId}</dd>
              </div>
              <div>
                <dt className={d.label}>Created</dt>
                <dd className={d.body}>{formatWhen(item.createdAt)}</dd>
              </div>
              <div>
                <dt className={d.label}>Last webhook</dt>
                <dd className={d.body}>{formatWhen(item.lastWebhookAt)}</dd>
              </div>
              <div>
                <dt className={d.label}>Last lead</dt>
                <dd className={d.body}>{formatWhen(item.lastLeadReceivedAt)}</dd>
              </div>
            </dl>

            {item.lastError ? <p className={d.muted}>Last error: {item.lastError}</p> : null}
            {item.consecutiveFailureCount > 0 ? (
              <p className={d.muted}>Consecutive failures: {item.consecutiveFailureCount}</p>
            ) : null}

            <div>
              <p className={d.label}>Webhook URL</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input className={d.input} readOnly value={item.webhookUrl ?? 'Unavailable. Regenerate the webhook.'} />
                <button type="button" className={d.btnSecondarySm} onClick={onCopy} disabled={busy || !item.webhookUrl}>
                  Copy webhook URL
                </button>
                <button
                  type="button"
                  className={d.btnSecondarySm}
                  onClick={() => setMailOpen(true)}
                  disabled={busy || !item.webhookUrl}
                >
                  {mailing ? 'Sending…' : 'Send mail'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {item.status === 'DISABLED' ? (
                <button type="button" className={d.btnPrimarySm} onClick={() => { setAccountId(item.accountId); setConnectOpen(true) }} disabled={busy}>
                  Connect again
                </button>
              ) : null}
              <button type="button" className={d.btnSecondarySm} onClick={onTest} disabled={busy || item.status === 'DISABLED'}>
                {testing ? 'Testing…' : 'Test webhook'}
              </button>
              <button type="button" className={d.btnSecondarySm} onClick={onViewLogs} disabled={busy || logsLoading}>
                View logs
              </button>
              <button type="button" className={d.btnSecondarySm} onClick={() => setRegenerateOpen(true)} disabled={busy}>
                {regenerating ? 'Regenerating…' : 'Regenerate webhook'}
              </button>
              {item.status !== 'DISABLED' ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-[#D96B6B] px-4 py-2 text-sm font-semibold text-[#D96B6B] hover:bg-[#D96B6B]/10 disabled:opacity-60"
                  onClick={() => setDisconnectOpen(true)}
                  disabled={busy}
                >
                  {disconnecting ? 'Disconnecting…' : 'Disconnect'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className={`${d.cardP6} mb-6`}>
        <h2 className={`${d.sectionTitle}`}>Setup</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[#2E2E2E]">
          {SETUP_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className={`${d.muted} mt-4`}>
          99acres has not documented a click-path in this repo. Use the webhook URL and the x-api-key header your server already expects.
        </p>
      </section>

      {testResult ? (
        <section className={`${d.cardP6} mb-6`}>
          <h2 className={d.sectionTitle}>Test result</h2>
          <ul className="space-y-2">
            {testResult.steps.map((step) => (
              <li key={step.name} className="flex items-start justify-between gap-4 text-sm">
                <span className="text-[#2E2E2E]">{step.name}</span>
                <span className={step.ok ? 'font-semibold text-[#6FAF8F]' : 'font-semibold text-[#D96B6B]'}>
                  {step.ok ? 'Passed' : 'Failed'}
                </span>
              </li>
            ))}
          </ul>
          {testResult.pipeline ? (
            <p className={`${d.muted} mt-3`}>Pipeline HTTP {testResult.pipeline.status}</p>
          ) : null}
        </section>
      ) : null}

      {logsOpen ? (
        <section className={d.tableWrap}>
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-lg font-semibold text-[#2E2E2E]">Webhook logs</h2>
            {logsLoading ? <span className={d.muted}>Loading…</span> : null}
          </div>
          <table className="w-full">
            <thead>
              <tr className={d.trBorder}>
                <th className={d.th}>Date</th>
                <th className={d.th}>Event</th>
                <th className={d.th}>Lead</th>
                <th className={d.th}>Status</th>
                <th className={d.th}>Response</th>
                <th className={d.th}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !logsLoading ? (
                <tr>
                  <td className={d.td} colSpan={6}>No webhook logs yet.</td>
                </tr>
              ) : null}
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className={`${d.trBorder} cursor-pointer`}
                  onClick={() => onOpenLog(log.id)}
                >
                  <td className={d.td}>{formatWhen(log.receivedAt)}</td>
                  <td className={d.td}>{log.eventType}</td>
                  <td className={d.td}>{log.leadName || '—'}</td>
                  <td className={d.td}>{log.processingStatus}</td>
                  <td className={d.td}>{log.responseStatus ?? '—'}</td>
                  <td className={d.td}>{log.durationMs != null ? `${log.durationMs} ms` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      <Modal
        open={connectOpen}
        title={item?.status === 'DISABLED' ? 'Connect 99acres again' : 'Connect 99acres'}
        onClose={() => {
          if (!saving) setConnectOpen(false)
        }}
        footer={
          <>
            <button type="button" className="acl-btn acl-btn--ghost" onClick={() => setConnectOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="acl-btn acl-btn--primary" onClick={onConnect} disabled={saving || !accountId.trim()}>
              {saving ? 'Saving…' : 'Connect'}
            </button>
          </>
        }
      >
        <label className={d.label} htmlFor="acres-account-id">99acres Account ID</label>
        <input
          id="acres-account-id"
          className={d.input}
          value={accountId}
          onChange={(event) => setAccountId(event.target.value)}
          disabled={saving}
          autoComplete="off"
        />
        <p className={`${d.muted} mt-3`}>
          The partner API key is global and stays on the server. This form does not ask for it.
        </p>
      </Modal>

      <ConfirmModal
        open={mailOpen}
        title="Send mail"
        message={`Send this webhook URL and the JSON lead format we accept to ${SETUP_EMAIL_TO}?`}
        confirmLabel="Send mail"
        loading={mailing}
        onConfirm={onMail}
        onClose={() => {
          if (!mailing) setMailOpen(false)
        }}
      />

      <ConfirmModal
        open={disconnectOpen}
        title="Disconnect 99acres"
        message="99acres will stop creating leads for this account. Existing leads and webhook logs are kept."
        confirmLabel="Disconnect"
        danger
        loading={disconnecting}
        onConfirm={onDisconnect}
        onClose={() => {
          if (!disconnecting) setDisconnectOpen(false)
        }}
      />

      <ConfirmModal
        open={regenerateOpen}
        title="Regenerate webhook"
        message="The current webhook URL stops working immediately. Update 99acres with the new URL."
        confirmLabel="Regenerate"
        loading={regenerating}
        onConfirm={onRegenerate}
        onClose={() => {
          if (!regenerating) setRegenerateOpen(false)
        }}
      />

      <Modal
        open={Boolean(detail) || detailLoading}
        title="Webhook log"
        wide
        onClose={() => {
          if (!detailLoading) setDetail(null)
        }}
      >
        {detailLoading ? <p className={d.muted}>Loading…</p> : null}
        {detail ? (
          <div className="space-y-3 text-sm text-[#2E2E2E]">
            <p>Event ID: {detail.id}</p>
            <p>Integration: {detail.integrationId}</p>
            <p>Received: {formatWhen(detail.receivedAt)}</p>
            <p>Processing status: {detail.processingStatus}</p>
            <p>HTTP status: {detail.responseStatus ?? '—'}</p>
            <p>Result: {detail.result?.duplicate ? 'Duplicate lead' : detail.processingStatus}</p>
            {detail.errorMessage ? <p>Error: {detail.errorMessage}</p> : null}
            <pre className="overflow-auto rounded-lg bg-[#F5EFE7] p-3 text-xs">{JSON.stringify(maskSecrets(detail.requestBody), null, 2)}</pre>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
