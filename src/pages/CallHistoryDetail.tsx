import { useCallback, useEffect, useState } from 'react'
import { FiArrowLeft } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'

import { apiGet, apiSend } from '../lib/crmApi'
import {
  batchHeading,
  conversationTurns,
  formatDuration,
  formatWhen,
  infoEntries,
  pitchedProject,
  projectLabel,
  resultLabel,
  sheetFileName,
  type BulkCallRow,
} from '../lib/bulkCallHistory'
import { useAppDispatch } from '../store/hooks'
import { loadCaptureLeads } from '../store/captureLeadsSlice'

export function CallHistoryDetail() {
  const { batchId = '' } = useParams()
  const dispatch = useAppDispatch()
  const [items, setItems] = useState<BulkCallRow[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [promoting, setPromoting] = useState(false)

  const load = useCallback(async () => {
    if (!batchId) return
    try {
      const data = await apiGet<{ items: BulkCallRow[] }>(`/api/calls/bulk-data?batchId=${encodeURIComponent(batchId)}`)
      const next = Array.isArray(data.items) ? data.items : []
      setItems(next)
      setSelectedId((current) => (next.some((row) => row.id === current) ? current : next[0]?.id || ''))
      setError('')
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Could not load this call'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    void load()
  }, [load])

  const waiting = items.some((row) => row.isLead == null && row.callStatus === 'pending')
  useEffect(() => {
    if (!waiting) return
    const timer = window.setInterval(() => {
      void load()
    }, 8000)
    return () => window.clearInterval(timer)
  }, [waiting, load])

  const selected = items.find((row) => row.id === selectedId) || items[0] || null
  const eligible = items.filter((row) => row.isLead === true && !row.captureLeadId).map((row) => row.id)

  const addAsLeads = async () => {
    if (!eligible.length) return
    setPromoting(true)
    setError('')
    try {
      await apiSend('/api/calls/bulk-data/promote', 'POST', { ids: eligible })
      await load()
      void dispatch(loadCaptureLeads({ force: true }))
    } catch (err: unknown) {
      const body = err && typeof err === 'object' && 'body' in err ? (err as { body?: { error?: string } }).body : null
      setError(body?.error || 'Could not add these rows to leads')
    } finally {
      setPromoting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6">
      <Link
        to="/leads/bulk-upload?mode=call"
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#8B7355] hover:text-[#6d5a43]"
      >
        <FiArrowLeft className="h-5 w-5" aria-hidden />
        Back to Bulk Call
      </Link>

      {loading && items.length === 0 ? <p className="text-[13px] text-[#8B7355]">Loading call…</p> : null}
      {!loading && !selected && !error ? (
        <p className="text-[13px] text-[#8B7355]">This call is no longer in the history.</p>
      ) : null}
      {error ? <p className="mb-4 text-[13px] text-red-700">{error}</p> : null}

      {selected ? (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-[#2E2E2E]">{batchHeading(items)}</h1>
              <p className="mt-1 mb-0 text-[14px] text-[#8B7355]">
                {projectLabel(selected)}
                {formatWhen(selected.createdAt) ? ` · ${formatWhen(selected.createdAt)}` : ''}
              </p>
              {pitchedProject(selected) ? (
                <p className="mt-1 mb-0 text-[13px] text-[#8B7355]">Call was about {pitchedProject(selected)}</p>
              ) : null}
              {sheetFileName(selected.callSheetUrl) ? (
                <p className="mt-1 mb-0 text-[13px] text-[#8B7355]">Sheet {sheetFileName(selected.callSheetUrl)}</p>
              ) : null}
            </div>
            {eligible.length > 0 ? (
              <button
                type="button"
                disabled={promoting}
                onClick={() => void addAsLeads()}
                className="rounded-xl bg-[#8B7355] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#6d5a43] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {promoting ? 'Adding…' : `Add ${eligible.length} as lead${eligible.length === 1 ? '' : 's'}`}
              </button>
            ) : null}
          </div>

          {items.length > 1 ? (
            <div className="mb-6 flex gap-2 overflow-x-auto">
              {items.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left text-[13px] ${
                    row.id === selected.id
                      ? 'border-[#8B7355] bg-[#F5EFE7] text-[#2E2E2E]'
                      : 'border-[#E8DCCB] bg-white text-[#8B7355]'
                  }`}
                >
                  <span className="block font-semibold">{row.name}</span>
                  <span className="block">{resultLabel(row)}</span>
                </button>
              ))}
            </div>
          ) : null}

          <PersonDetail row={selected} />
        </>
      ) : null}
    </section>
  )
}

function PersonDetail({ row }: { row: BulkCallRow }) {
  const facts = [
    ['Mobile', row.mobile],
    ['Email', row.email || '—'],
    ['Status', row.callStatus || '—'],
    ['Score', row.leadScore || '—'],
    ['Duration', formatDuration(row.callDuration) || '—'],
    ['Asked for a person', row.humanDiversion ? 'Yes' : 'No'],
    ['Result', resultLabel(row)],
  ]
  const extra = infoEntries(row.additionalInfo)
  const turns = conversationTurns(row.transcriptJson)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#E8DCCB] bg-white p-4 sm:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label}>
            <p className="m-0 text-[12px] font-semibold text-[#8B7355]">{label}</p>
            <p className="mt-1 mb-0 text-[13px] text-[#2E2E2E]">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[#E8DCCB] bg-white p-4">
        <h2 className="m-0 text-[15px] font-semibold text-[#2E2E2E]">Summary</h2>
        <p className="mt-2 mb-0 whitespace-pre-wrap text-[13px] leading-6 text-[#2E2E2E]">
          {row.summary?.trim() || 'No summary was saved for this call.'}
        </p>
      </section>

      {extra.length > 0 ? (
        <section className="rounded-2xl border border-[#E8DCCB] bg-white p-4">
          <h2 className="m-0 mb-3 text-[15px] font-semibold text-[#2E2E2E]">Call details</h2>
          <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {extra.map((entry) => (
              <div key={entry.key}>
                <dt className="text-[12px] font-semibold text-[#8B7355]">{entry.label}</dt>
                <dd className="mt-1 mb-0 text-[13px] text-[#2E2E2E]">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[#E8DCCB] bg-white p-4">
        <h2 className="m-0 mb-3 text-[15px] font-semibold text-[#2E2E2E]">Conversation</h2>
        {turns.length === 0 ? (
          <p className="m-0 text-[13px] text-[#8B7355]">No conversation was saved for this call.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {turns.map((turn, index) => (
              <div key={`${turn.role}-${index}`} className={turn.role === 'caller' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-6 ${
                    turn.role === 'caller' ? 'bg-[#F5EFE7] text-[#2E2E2E]' : 'bg-[#FAF7F2] text-[#2E2E2E]'
                  }`}
                >
                  <p className="m-0 mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#8B7355]">
                    {turn.role === 'caller' ? 'Caller' : turn.role === 'agent' ? 'Agent' : 'Note'}
                  </p>
                  <p className="m-0 whitespace-pre-wrap">{turn.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
