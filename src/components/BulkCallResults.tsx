import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

import { apiGet, apiSend } from '../lib/crmApi'
import {
  batchHeading,
  formatWhen,
  pitchedProject,
  projectLabel,
  resultLabel,
  sheetFileName,
  type BulkCallRow,
} from '../lib/bulkCallHistory'
import { useAppDispatch } from '../store/hooks'
import { loadCaptureLeads } from '../store/captureLeadsSlice'

export function BulkCallResults({ activeBatchId }: { activeBatchId: string }) {
  const dispatch = useAppDispatch()
  const [items, setItems] = useState<BulkCallRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [promotingId, setPromotingId] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await apiGet<{ items: BulkCallRow[] }>('/api/calls/bulk-data')
      setItems(Array.isArray(data.items) ? data.items : [])
      setError('')
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Could not load call results'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, activeBatchId])

  const waiting = items.some((row) => row.isLead == null && row.callStatus === 'pending')
  useEffect(() => {
    if (!waiting) return
    const timer = window.setInterval(() => {
      void load()
    }, 8000)
    return () => window.clearInterval(timer)
  }, [waiting, load])

  const batches = useMemo(() => {
    const order: string[] = []
    const grouped = new Map<string, BulkCallRow[]>()
    for (const row of items) {
      if (!grouped.has(row.batchId)) {
        grouped.set(row.batchId, [])
        order.push(row.batchId)
      }
      grouped.get(row.batchId)!.push(row)
    }
    return order.map((batchId) => ({ batchId, rows: grouped.get(batchId) || [] }))
  }, [items])

  const addAsLeads = async (batchId: string, ids: string[]) => {
    setPromotingId(batchId)
    setError('')
    try {
      await apiSend('/api/calls/bulk-data/promote', 'POST', { ids })
      await load()
      void dispatch(loadCaptureLeads({ force: true }))
    } catch (err: unknown) {
      const body = err && typeof err === 'object' && 'body' in err ? (err as { body?: { error?: string } }).body : null
      setError(body?.error || 'Could not add these rows to leads')
    } finally {
      setPromotingId('')
    }
  }

  if (loading && items.length === 0) {
    return <p className="mt-8 text-[13px] text-[#8B7355]">Loading call history…</p>
  }

  if (!loading && items.length === 0 && !error) {
    return (
      <div className="mt-8 rounded-2xl border border-[#E8DCCB] bg-white p-6">
        <h2 className="m-0 text-[18px] font-bold text-[#2E2E2E]">Call history</h2>
        <p className="mt-2 mb-0 text-[13px] text-[#8B7355]">
          Finished calls show up here with the person, the project, and the time. Open one to read the full conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <h2 className="mb-1 text-[18px] font-bold text-[#2E2E2E]">Call history</h2>
      <p className="mb-4 text-[13px] text-[#8B7355]">
        Each card is one call result. The name, project, and time tell you which upload it belongs to. Open it for the summary and conversation.
      </p>
      {error ? <p className="mb-4 text-[13px] text-red-700">{error}</p> : null}
      <div className="flex flex-col gap-3">
        {batches.map(({ batchId, rows }) => {
          const first = rows[0]
          const when = formatWhen(first?.createdAt)
          const project = first ? projectLabel(first) : 'Project not set'
          const pitched = first ? pitchedProject(first) : ''
          const fileName = sheetFileName(first?.callSheetUrl)
          const eligible = rows.filter((row) => row.isLead === true && !row.captureLeadId).map((row) => row.id)
          const single = rows.length === 1 ? rows[0] : null
          const result = single ? resultLabel(single) : ''
          return (
            <article key={batchId} className="rounded-xl border border-[#E8DCCB] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="m-0 text-[15px] font-semibold text-[#2E2E2E]">{batchHeading(rows)}</p>
                  <p className="mt-1 mb-0 text-[13px] text-[#8B7355]">
                    {project}
                    {when ? ` · ${when}` : ''}
                    {single ? ` · ${single.callStatus}` : ` · ${rows.length} people`}
                    {single?.leadScore ? ` · ${single.leadScore}` : ''}
                  </p>
                  {single ? <p className="mt-1 mb-0 text-[13px] text-[#2E2E2E]">{single.mobile}</p> : null}
                  {pitched ? <p className="mt-1 mb-0 text-[13px] text-[#8B7355]">Call was about {pitched}</p> : null}
                  {fileName ? <p className="mt-1 mb-0 text-[13px] text-[#8B7355]">Sheet {fileName}</p> : null}
                  {single?.summary ? (
                    <p className="mt-2 mb-0 line-clamp-2 text-[13px] text-[#2E2E2E]">{single.summary}</p>
                  ) : null}
                  {!single ? (
                    <p className="mt-2 mb-0 text-[13px] text-[#2E2E2E]">
                      {rows.filter((row) => resultLabel(row) === 'Can become a lead').length} can become leads ·{' '}
                      {rows.filter((row) => resultLabel(row) === 'Cannot become a lead').length} cannot ·{' '}
                      {rows.filter((row) => resultLabel(row) === 'Waiting for the call').length} waiting
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  {result ? (
                    <span className="inline-flex rounded-full bg-[#F5EFE7] px-3 py-1 text-[12px] font-semibold text-[#6d5a43]">
                      {result}
                    </span>
                  ) : null}
                  <Link
                    to={`/leads/call-history/${batchId}`}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#E8DCCB] px-3 py-2 text-[13px] font-semibold text-[#2E2E2E] hover:bg-[#FAF7F2]"
                  >
                    Open details
                    <FiArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  {eligible.length > 0 ? (
                    <button
                      type="button"
                      disabled={promotingId === batchId}
                      onClick={() => void addAsLeads(batchId, eligible)}
                      className="rounded-xl bg-[#8B7355] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[#6d5a43] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {promotingId === batchId ? 'Adding…' : `Add ${eligible.length} as lead${eligible.length === 1 ? '' : 's'}`}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
