import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiPlus, FiRefreshCw } from 'react-icons/fi'

import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import {
  whatsappApi,
  type WaBroadcast,
  type WaBroadcastDetail,
  type WaCounts,
  type WaPermissions,
  type WaStatus,
} from '../../lib/whatsappApi'
import { EmptyState, MessageTicks, Notice } from './shared'
import { NewBroadcastModal } from './NewBroadcastModal'
import { fmtDateTime, fmtPhone, pct } from './format'

const POLL_MS = 5000

function BroadcastStatus({ status }: { status: WaBroadcast['status'] }) {
  if (status === 'PROCESSING') return <span className={d.badgeWarm}>Sending…</span>
  if (status === 'FAILED') return <span className={d.badgeHot}>Failed</span>
  return <span className={d.badgeWon}>Completed</span>
}

/** Stacked bar: read ⊂ delivered ⊂ sent, plus failed, over total recipients. */
function FunnelBar({ counts, total }: { counts: WaCounts; total: number }) {
  const w = (n: number) => `${total ? (n / total) * 100 : 0}%`
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-[#F5EFE7]" aria-hidden>
      <div className="bg-[#53A2D9]" style={{ width: w(counts.read) }} />
      <div className="bg-[#6FAF8F]" style={{ width: w(counts.delivered - counts.read) }} />
      <div className="bg-[#C9B79C]" style={{ width: w(counts.sent - counts.delivered) }} />
      <div className="bg-[#D96B6B]" style={{ width: w(counts.failed) }} />
    </div>
  )
}

function CountsGrid({ counts, total }: { counts: WaCounts; total: number }) {
  const items = [
    { label: 'Recipients', value: total, note: `${counts.processed} processed` },
    { label: 'Sent', value: counts.sent, note: pct(counts.sent, total) },
    { label: 'Delivered', value: counts.delivered, note: pct(counts.delivered, counts.sent) },
    { label: 'Read', value: counts.read, note: pct(counts.read, counts.delivered) },
    { label: 'Failed', value: counts.failed, note: pct(counts.failed, total) },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {items.map((i) => (
        <div key={i.label} className={d.cardP4}>
          <p className="text-sm text-[#8B7355]">{i.label}</p>
          <p className="text-2xl font-semibold text-[#2E2E2E]">{i.value}</p>
          <p className="text-xs font-medium text-[#6FAF8F]">{i.note}</p>
        </div>
      ))}
    </div>
  )
}

function BroadcastDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const [data, setData] = useState<WaBroadcastDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    () =>
      whatsappApi.broadcast(id).then(
        (b) => {
          setData(b)
          setError(null)
        },
        (err) => setError(getApiErrorMessage(err)),
      ),
    [id],
  )

  useEffect(() => {
    void load()
  }, [load])

  // Keep polling while sending, and briefly after, since delivered/read arrive by webhook.
  useEffect(() => {
    if (!data) return
    const recent = Date.now() - new Date(data.created_at).getTime() < 30 * 60 * 1000
    if (data.status !== 'PROCESSING' && !recent) return
    const t = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(t)
  }, [data, load])

  return (
    <div className={d.stack}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={d.btnSecondarySm} onClick={onBack}>
          <FiArrowLeft size={14} aria-hidden /> All broadcasts
        </button>
        <button type="button" className={d.btnSecondarySm} onClick={() => void load()}>
          <FiRefreshCw size={14} aria-hidden /> Refresh
        </button>
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}
      {data ? (
        <>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-[#2E2E2E]">{data.name}</h2>
              <BroadcastStatus status={data.status} />
            </div>
            <p className="text-sm text-[#8B7355]">
              {data.templateName} ({data.templateLanguage}) · started {fmtDateTime(data.created_at)}
            </p>
          </div>
          <CountsGrid counts={data.counts} total={data.totalRecipients} />
          <FunnelBar counts={data.counts} total={data.totalRecipients} />

          {data.skipped.length ? (
            <details className={d.cardP4}>
              <summary className="cursor-pointer text-sm font-semibold text-[#2E2E2E]">{data.skipped.length} skipped before sending</summary>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
                {data.skipped.map((s, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate text-[#2E2E2E]">{s.to}</span>
                    <span className="shrink-0 text-[#8B7355]">{s.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <div className={d.tableWrap}>
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E8DCCB]">
                  <th className={d.th}>Recipient</th>
                  <th className={d.th}>Status</th>
                  <th className={d.th}>Delivered</th>
                  <th className={d.th}>Read</th>
                  <th className={d.th}>Error</th>
                </tr>
              </thead>
              <tbody>
                {data.recipients.map((r) => (
                  <tr key={r.id} className={d.trBorder}>
                    <td className={d.td}>
                      <span className="font-medium">{r.conversation?.lead?.name || r.conversation?.profileName || '—'}</span>
                      <span className="block text-xs text-[#8B7355]">{r.conversation ? fmtPhone(r.conversation.waId) : ''}</span>
                    </td>
                    <td className={d.td}>
                      <span className="inline-flex items-center gap-2 capitalize">
                        <MessageTicks status={r.status} /> {r.status === 'accepted' ? 'sending' : r.status}
                      </span>
                    </td>
                    <td className={`${d.td} text-[#8B7355]`}>{fmtDateTime(r.deliveredAt)}</td>
                    <td className={`${d.td} text-[#8B7355]`}>{fmtDateTime(r.readAt)}</td>
                    <td className={`${d.td} text-xs text-[#D96B6B]`}>{r.error?.message || r.error?.title || ''}</td>
                  </tr>
                ))}
                {!data.recipients.length ? (
                  <tr>
                    <td className={d.td} colSpan={5}>Queued — messages will appear here as they are sent.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="text-sm text-[#8B7355]">Loading…</p>
      )}
    </div>
  )
}

export function BroadcastsTab({ status, perms }: { status: WaStatus | null; perms: WaPermissions }) {
  const [params, setParams] = useSearchParams()
  const selected = params.get('broadcast')
  const [items, setItems] = useState<WaBroadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(
    () =>
      whatsappApi
        .broadcasts()
        .then(
          (r) => {
            setItems(r.items)
            setError(null)
          },
          (err) => setError(getApiErrorMessage(err)),
        )
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    if (selected) return
    void load()
  }, [selected, load])

  useEffect(() => {
    if (selected || !items.some((b) => b.status === 'PROCESSING')) return
    const t = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(t)
  }, [selected, items, load])

  const select = (id: string | null) => {
    const next = new URLSearchParams(params)
    if (id) next.set('broadcast', id)
    else next.delete('broadcast')
    setParams(next, { replace: true })
  }

  if (selected) return <BroadcastDetail id={selected} onBack={() => select(null)} />

  return (
    <div className={d.stack}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#8B7355]">Send an approved template to many leads at once, personalised per lead.</p>
        {perms.send ? (
          <button type="button" className={d.btnPrimarySm} onClick={() => setModalOpen(true)} disabled={!status?.configured}>
            <FiPlus size={14} aria-hidden /> New broadcast
          </button>
        ) : null}
      </div>
      {error ? <Notice tone="error">{error}</Notice> : null}

      {!loading && !items.length ? (
        <EmptyState title="No broadcasts yet">Broadcasts you send will be listed here with delivery and read rates.</EmptyState>
      ) : (
        <div className={d.tableWrap}>
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-[#E8DCCB]">
                <th className={d.th}>Broadcast</th>
                <th className={d.th}>Status</th>
                <th className={d.th}>Recipients</th>
                <th className={d.th}>Delivered</th>
                <th className={d.th}>Read</th>
                <th className={d.th}>Failed</th>
                <th className={`${d.th} w-40`}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className={d.td} colSpan={7}>Loading…</td>
                </tr>
              ) : (
                items.map((b) => (
                  <tr key={b.id} className={`${d.trBorder} cursor-pointer hover:bg-[#FAF7F2]`} onClick={() => select(b.id)}>
                    <td className={d.td}>
                      <span className="font-medium">{b.name}</span>
                      <span className="block text-xs text-[#8B7355]">
                        {b.templateName} · {fmtDateTime(b.created_at)}
                      </span>
                    </td>
                    <td className={d.td}><BroadcastStatus status={b.status} /></td>
                    <td className={d.td}>
                      {b.totalRecipients}
                      {b.skippedCount ? <span className="block text-xs text-[#8B7355]">{b.skippedCount} skipped</span> : null}
                    </td>
                    <td className={d.td}>{b.counts.delivered} <span className="text-xs text-[#8B7355]">{pct(b.counts.delivered, b.counts.sent)}</span></td>
                    <td className={d.td}>{b.counts.read} <span className="text-xs text-[#8B7355]">{pct(b.counts.read, b.counts.delivered)}</span></td>
                    <td className={`${d.td} text-[#D96B6B]`}>{b.counts.failed}</td>
                    <td className={d.td}><FunnelBar counts={b.counts} total={b.totalRecipients} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <NewBroadcastModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={(id) => select(id)} />
    </div>
  )
}
