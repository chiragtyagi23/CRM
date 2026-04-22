import { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiSliders, FiTrendingUp, FiUpload } from 'react-icons/fi'

import type { LeadScoreDTO, LeadStatusDTO } from '../lib/dashboardDummyApi'
import { LeadCard } from './LeadCard'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loadCaptureLeads, updateCaptureLead } from '../store/captureLeadsSlice'
import { fetchUsers } from '../lib/usersApi'
import { ALL_LEAD_SCORES, ALL_LEAD_STATUSES, toLeadRow } from '../utils/leadMapping'

export function Leads() {
  const dispatch = useAppDispatch()
  const { items, loading } = useAppSelector((s) => s.captureLeads)
  const isAdmin = useAppSelector((s) => s.auth.user?.role === 'admin')

  const rows = useMemo(() => items.map(toLeadRow), [items])
  const [overrides, setOverrides] = useState<Record<string, { score?: LeadScoreDTO; status?: LeadStatusDTO; assignedTo?: string }>>({})
  const rowsWithOverrides = useMemo(() => {
    return rows.map((r) => {
      const o = overrides[r.id]
      return o ? { ...r, score: o.score ?? r.score, status: o.status ?? r.status, assignedTo: o.assignedTo ?? r.assignedTo } : r
    })
  }, [overrides, rows])

  const baseById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  const [q, setQ] = useState('')
  const [status, setStatus] = useState<(typeof ALL_LEAD_STATUSES)[number]>('all')
  const [score, setScore] = useState<(typeof ALL_LEAD_SCORES)[number]>('all')
  const [source, setSource] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    dispatch(loadCaptureLeads())
  }, [dispatch])

  const allSources = useMemo(() => {
    const unique = Array.from(new Set(rows.map((r) => (r.source ?? '').trim()).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    )
    return ['all', ...unique]
  }, [rows])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return rowsWithOverrides.filter((r) => {
      if (status !== 'all' && r.status !== status) return false
      if (score !== 'all' && r.score !== score) return false
      if (source !== 'all' && r.source !== source) return false
      if (!query) return true
      return (
        r.name.toLowerCase().includes(query) ||
        r.contact.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.source.toLowerCase().includes(query) ||
        r.locationLabel.toLowerCase().includes(query) ||
        r.assignedTo.toLowerCase().includes(query)
      )
    })
  }, [q, rowsWithOverrides, score, source, status])

  const totalCount = rowsWithOverrides.length
  const shownCount = filtered.length
  const [teamMembers, setTeamMembers] = useState<string[]>([])

  useEffect(() => {
    if (!isAdmin) return
    fetchUsers({ role: 'user' })
      .then((res) => {
        const names = (res.items ?? [])
          .map((u) => String(u.name || '').trim())
          .filter(Boolean)
        setTeamMembers(names)
      })
      .catch(() => {
        setTeamMembers([])
      })
  }, [isAdmin])

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-gray-900">Lead Management</p>
              <p className="mt-1 text-[14px] font-medium text-[#8B7355]">
                Manage and track all your leads in one place
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {isAdmin ? (
                <button
                  type="button"
                  className="inline-flex h-10 w-45 items-center justify-center gap-2 rounded-lg border border-[#8B7355] px-6 text-[13px] font-semibold text-[#8B7355] transition-colors hover:bg-[#F5EFE7]"
                  onClick={() => {
                    window.location.hash = '#leads/bulk-upload'
                  }}
                >
                  <FiUpload className="h-4 w-4 shrink-0" aria-hidden />
                  Bulk Upload
                </button>
              ) : null}
              <button
                type="button"
                className="inline-flex h-10 w-46 items-center justify-center gap-2 rounded-lg bg-[#8B7355] px-6 text-[13px] font-semibold text-white transition-colors hover:bg-[#6d5a43]"
                onClick={() => {
                  if (isAdmin) {
                    window.location.hash = '#capture-lead'
                    return
                  }
                  window.alert('Add New Lead (dummy)')
                }}
              >
                <FiTrendingUp className="h-4 w-4 shrink-0" aria-hidden />
                Add New Lead
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[#8B7355]/10 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <FiSearch
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7355]"
                  aria-hidden
                />
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, phone, email, or location..."
                  className="w-full rounded-lg border border-[#E8DCCB] bg-white py-2 pl-10 pr-4 text-[13px] text-gray-900 placeholder:text-[#8B7355]/70 focus:border-[#8B7355] focus:outline-none"
                />
              </div>
              <button
                type="button"
                aria-expanded={showFilters}
                aria-controls="lead-filters"
                onClick={() => setShowFilters((o) => !o)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-semibold transition-colors ${
                  showFilters
                    ? 'border-[#8B7355] bg-[#8B7355] text-white'
                    : 'border-[#E8DCCB] bg-white text-[#8B7355] hover:bg-[#F5EFE7]'
                }`}
              >
                <FiSliders className="h-4 w-4 shrink-0" aria-hidden />
                Filters
              </button>
            </div>

            {showFilters ? (
              <div
                id="lead-filters"
                className="mt-4 grid grid-cols-1 gap-4 border-t border-[#E8DCCB] pt-4 sm:grid-cols-3"
              >
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="lead-filter-status">
                    Status
                  </label>
                  <select
                    id="lead-filter-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as (typeof ALL_LEAD_STATUSES)[number])}
                    className="w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-[13px] text-gray-900 focus:border-[#8B7355] focus:outline-none"
                  >
                    {ALL_LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s === 'all' ? 'All Statuses' : s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="lead-filter-score">
                    Score
                  </label>
                  <select
                    id="lead-filter-score"
                    value={score}
                    onChange={(e) => setScore(e.target.value as (typeof ALL_LEAD_SCORES)[number])}
                    className="w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-[13px] text-gray-900 focus:border-[#8B7355] focus:outline-none"
                  >
                    {ALL_LEAD_SCORES.map((s) => (
                      <option key={s} value={s}>
                        {s === 'all' ? 'All Scores' : s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="lead-filter-source">
                    Source
                  </label>
                  <select
                    id="lead-filter-source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-[13px] text-gray-900 focus:border-[#8B7355] focus:outline-none"
                  >
                    {allSources.map((s) => (
                      <option key={s} value={s}>
                        {s === 'all' ? 'All Sources' : s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mb-4 text-[13px] font-medium text-[#8B7355]">
          Showing {shownCount} of {totalCount} leads
        </div>

        <div className="grid grid-cols-1 gap-4" aria-busy={loading}>
          {loading ? (
            <div className="rounded-xl border border-[#8B7355]/10 bg-white p-12 text-center">
              <p className="text-[14px] font-medium text-[#8B7355]">Loading leads…</p>
            </div>
          ) : (
            filtered.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onChangeScore={(next) => {
                  setOverrides((s) => ({ ...s, [lead.id]: { ...(s[lead.id] ?? {}), score: next } }))
                }}
                onChangeStatus={(next) => {
                  setOverrides((s) => ({ ...s, [lead.id]: { ...(s[lead.id] ?? {}), status: next } }))
                }}
                canEditAssignee={isAdmin}
                assigneeOptions={teamMembers}
                onChangeAssignee={(next) => {
                  if (!isAdmin) return
                  setOverrides((s) => ({ ...s, [lead.id]: { ...(s[lead.id] ?? {}), assignedTo: next } }))
                }}
                dirty={(() => {
                  const base = baseById.get(lead.id)
                  if (!base) return false
                  return base.score !== lead.score || base.status !== lead.status || base.assignedTo !== lead.assignedTo
                })()}
                onUpdate={() => {
                  const base = baseById.get(lead.id)
                  if (!base) return
                  const patch: Record<string, unknown> = {}
                  if (base.score !== lead.score) patch.status = lead.score.toUpperCase()
                  if (base.status !== lead.status) patch.status = lead.status
                  if (isAdmin && base.assignedTo !== lead.assignedTo) patch.callBy = lead.assignedTo

                  if (!isAdmin && base.assignedTo !== lead.assignedTo) {
                    window.alert('Only admin can change Assigned To.')
                    return
                  }

                  dispatch(updateCaptureLead({ id: lead.id, patch })).then(() => {
                    setOverrides((s) => {
                      const next = { ...s }
                      delete next[lead.id]
                      return next
                    })
                  })
                }}
                onViewDetails={() => {
                  window.location.hash = `#leads/viewdetail/${lead.id}`
                }}
              />
            ))
          )}
        </div>

        {!loading && filtered.length === 0 ? (
          <div className="mt-4 rounded-xl border border-[#8B7355]/10 bg-white p-12 text-center">
            <p className="text-[14px] font-medium text-[#8B7355]">No leads found matching your filters.</p>
            <p className="mt-2 text-[13px] text-[#8B7355]/90">Try adjusting your search or filter criteria.</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
