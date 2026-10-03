import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiSend } from '../lib/crmApi'
import { useAppDispatch } from '../store/hooks'
import { loadCaptureLeads } from '../store/captureLeadsSlice'

type BulkCallRow = {
  id: string
  batchId: string
  projectId: string
  name: string
  email: string | null
  mobile: string
  summary: string | null
  leadScore: string | null
  isLead: boolean | null
  callStatus: string
  callDuration: number | null
  humanDiversion: boolean
  captureLeadId: string | null
  createdAt?: string
}

function rowGroup(row: BulkCallRow) {
  if (row.captureLeadId) return 'Added to leads'
  if (row.callStatus === 'not_sent') return 'Call not sent'
  if (row.isLead === true) return 'Can become a lead'
  if (row.isLead === false) return 'Cannot become a lead'
  return 'Waiting for the call'
}

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
    return <p className="mt-8 text-[13px] text-[#8B7355]">Loading call results…</p>
  }

  if (!loading && items.length === 0 && !error) {
    return null
  }

  return (
    <div className="mt-8">
      <h2 className="mb-2 text-[18px] font-bold text-[#2E2E2E]">Call results</h2>
      <p className="mb-4 text-[13px] text-[#8B7355]">
        People stay in this list until the call result arrives. Rows marked as a lead can be added to the lead list.
      </p>
      {error ? <p className="mb-4 text-[13px] text-red-700">{error}</p> : null}
      <div className="flex flex-col gap-6">
        {batches.map(({ batchId, rows }) => {
          const eligible = rows.filter((row) => row.isLead === true && !row.captureLeadId).map((row) => row.id)
          const canCount = rows.filter((row) => rowGroup(row) === 'Can become a lead').length
          const cannotCount = rows.filter((row) => rowGroup(row) === 'Cannot become a lead').length
          const waitingCount = rows.filter((row) => rowGroup(row) === 'Waiting for the call').length
          return (
            <section key={batchId} className="rounded-xl border border-[#E8DCCB] bg-white p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="m-0 text-[13px] text-[#2E2E2E]">
                  {rows.length} contact{rows.length === 1 ? '' : 's'} · {canCount} can become leads · {cannotCount} cannot · {waitingCount} waiting
                </p>
                <button
                  type="button"
                  disabled={eligible.length === 0 || promotingId === batchId}
                  onClick={() => void addAsLeads(batchId, eligible)}
                  className="rounded-xl bg-[#8B7355] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#6d5a43] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {promotingId === batchId ? 'Adding…' : `Add ${eligible.length} as leads`}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#E8DCCB]">
                      <th className="py-2 pr-3 font-semibold text-[#8B7355]">Name</th>
                      <th className="py-2 pr-3 font-semibold text-[#8B7355]">Mobile</th>
                      <th className="py-2 pr-3 font-semibold text-[#8B7355]">Status</th>
                      <th className="py-2 pr-3 font-semibold text-[#8B7355]">Score</th>
                      <th className="py-2 pr-3 font-semibold text-[#8B7355]">Summary</th>
                      <th className="py-2 font-semibold text-[#8B7355]">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-b border-[#E8DCCB]">
                        <td className="py-2 pr-3 text-[#2E2E2E]">{row.name}</td>
                        <td className="py-2 pr-3 text-[#2E2E2E]">{row.mobile}</td>
                        <td className="py-2 pr-3 text-[#2E2E2E]">{row.callStatus}</td>
                        <td className="py-2 pr-3 text-[#2E2E2E]">{row.leadScore || '—'}</td>
                        <td className="max-w-[240px] py-2 pr-3 text-[#2E2E2E]">{row.summary || '—'}</td>
                        <td className="py-2 text-[#2E2E2E]">{rowGroup(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
