import { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiSliders, FiTrendingUp, FiUpload } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

import type { LeadScoreDTO, LeadStatusDTO } from '../lib/dashboardDummyApi'
import { LeadCard } from '../components/LeadCard'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { crmPayloadBuilder } from '../services/crmPayloadBuilder'
import { loadCaptureLeads, updateCaptureLead } from '../store/captureLeadsSlice'
import { useACL } from '../acl/useACL'
import { fetchAssignees } from '../lib/usersApi'
import { ALL_LEAD_SCORES, ALL_LEAD_STATUSES, toLeadRow } from '../utils/leadMapping'
import { CAPTURE_LEAD_SOURCE_TILE_OPTIONS } from '../utils/uiConfig'

const LEADS_PAGE_SIZE = 10

export function Leads() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, permissions } = useACL()
  const canAssign = permissions.leads.assignTo
  const canDelete = permissions.leads.delete
  const { items, total, loading } = useAppSelector((s) => s.captureLeads)

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
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<(typeof ALL_LEAD_STATUSES)[number]>('all')
  const [score, setScore] = useState<(typeof ALL_LEAD_SCORES)[number]>('all')
  const [source, setSource] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [assigneeDirectory, setAssigneeDirectory] = useState<string[]>([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => window.clearTimeout(t)
  }, [q])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, status, score, source])

  useEffect(() => {
    dispatch(
      loadCaptureLeads({
        force: true,
        page,
        pageSize: LEADS_PAGE_SIZE,
        q: debouncedQ || undefined,
        status: status === 'all' ? undefined : status,
        score: score === 'all' ? undefined : score,
        source: source === 'all' ? undefined : source,
      }),
    )
  }, [debouncedQ, dispatch, page, score, source, status])

  useEffect(() => {
    if (!canAssign) {
      setAssigneeDirectory([])
      return
    }
    let cancelled = false
    fetchAssignees()
      .then((res) => {
        if (cancelled) return
        setAssigneeDirectory(
          (res.items ?? []).map((u) => String(u.name ?? '').trim()).filter(Boolean),
        )
      })
      .catch(() => {
        if (!cancelled) setAssigneeDirectory([])
      })
    return () => {
      cancelled = true
    }
  }, [canAssign])

  const allSources = useMemo(
    () => ['all', ...CAPTURE_LEAD_SOURCE_TILE_OPTIONS.map((s) => s.id)],
    [],
  )

  const teamMembers = useMemo(() => {
    if (!canAssign) return []
    const names = [...assigneeDirectory]
    const me = String(user?.name ?? '').trim()
    if (me && !names.includes(me)) names.push(me)
    return [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b))
  }, [assigneeDirectory, canAssign, user?.name])

  const totalPages = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : (page - 1) * LEADS_PAGE_SIZE + 1
  const rangeEnd = Math.min(page * LEADS_PAGE_SIZE, total)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="crm-page-title">Lead Management</h1>
            <p className="crm-page-subtitle">Manage and track all your leads in one place</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              className="crm-btn-secondary h-10"
              onClick={() => {
                navigate('/leads/bulk-upload')
              }}
            >
              <FiUpload className="h-4 w-4 shrink-0" aria-hidden />
              Bulk Upload
            </button>
            <button
              type="button"
              className="crm-btn-primary h-10"
              onClick={() => {
                navigate('/capture-lead')
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
                className="w-full rounded-lg border border-[#E8DCCB] bg-white py-2 pl-10 pr-4 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355]/70 focus:border-[#8B7355] focus:outline-none"
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
                  className="w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-[13px] text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none"
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
                  className="w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-[13px] text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none"
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
                  className="w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-[13px] text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none"
                >
                  {allSources.map((s) => {
                    const label =
                      s === 'all'
                        ? 'All Sources'
                        : CAPTURE_LEAD_SOURCE_TILE_OPTIONS.find((o) => o.id === s)?.label ?? s
                    return (
                      <option key={s} value={s}>
                        {label}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-4 text-[13px] font-medium text-[#8B7355]">
        {total === 0 ? 'Showing 0 leads' : `Showing ${rangeStart}–${rangeEnd} of ${total} leads`}
      </div>

      <div className="grid grid-cols-1 gap-4" aria-busy={loading}>
        {loading ? (
          <div className="rounded-xl border border-[#8B7355]/10 bg-white p-12 text-center">
            <p className="text-[14px] font-medium text-[#8B7355]">Loading leads…</p>
          </div>
        ) : (
          rowsWithOverrides.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onChangeScore={(next) => {
                setOverrides((s) => ({ ...s, [lead.id]: { ...(s[lead.id] ?? {}), score: next } }))
              }}
              onChangeStatus={(next) => {
                setOverrides((s) => ({ ...s, [lead.id]: { ...(s[lead.id] ?? {}), status: next } }))
              }}
              canEditAssignee={canAssign}
              assigneeOptions={teamMembers}
              canDelete={canDelete}
              onDelete={() => {
                if (window.confirm(`Delete lead "${lead.name}"?`)) {
                  window.alert('Delete requires API wiring (module: leads.delete)')
                }
              }}
              onChangeAssignee={(next) => {
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
                const patch = crmPayloadBuilder.captureLead.buildLeadListCardPatch({
                  base: { score: base.score, status: base.status, assignedTo: base.assignedTo },
                  lead: { score: lead.score, status: lead.status, assignedTo: lead.assignedTo },
                })

                dispatch(updateCaptureLead({ id: lead.id, patch })).then(() => {
                  setOverrides((s) => {
                    const next = { ...s }
                    delete next[lead.id]
                    return next
                  })
                })
              }}
              onViewDetails={() => {
                navigate(`/leads/viewdetail/${lead.id}`)
              }}
            />
          ))
        )}
      </div>

      {!loading && total === 0 ? (
        <div className="mt-4 rounded-xl border border-[#8B7355]/10 bg-white p-12 text-center">
          <p className="text-[14px] font-medium text-[#8B7355]">No leads found matching your filters.</p>
          <p className="mt-2 text-[13px] text-[#8B7355]/90">Try adjusting your search or filter criteria.</p>
        </div>
      ) : null}

      {!loading && total > 0 ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-[#E8DCCB] bg-white px-4 py-2 text-[13px] font-semibold text-[#8B7355] transition-colors hover:bg-[#F5EFE7] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="text-[13px] font-medium text-[#8B7355]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="rounded-lg border border-[#E8DCCB] bg-white px-4 py-2 text-[13px] font-semibold text-[#8B7355] transition-colors hover:bg-[#F5EFE7] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  )
}
