import { useEffect, useMemo, useState } from 'react'

import type { LeadScoreDTO, LeadStatusDTO } from '../lib/dashboardDummyApi'
import { LeadCard } from './LeadCard'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loadCaptureLeads, updateCaptureLead } from '../store/captureLeadsSlice'
import { fetchUsers } from '../lib/usersApi'
import { ALL_LEAD_SCORES, ALL_LEAD_STATUSES, toLeadRow } from '../utils/leadMapping'

function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M7.75 2.25a5.5 5.5 0 1 0 3.35 9.86l3.05 3.05a.75.75 0 1 0 1.06-1.06l-3.05-3.05A5.5 5.5 0 0 0 7.75 2.25zm0 1.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"
      />
    </svg>
  )
}

function IconSliders({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M4 3.25a.75.75 0 0 1 .75.75v7a.75.75 0 0 1-1.5 0V4A.75.75 0 0 1 4 3.25zm10 0a.75.75 0 0 1 .75.75v10a.75.75 0 0 1-1.5 0V4A.75.75 0 0 1 14 3.25zM9 6.25A.75.75 0 0 1 9.75 7v7a.75.75 0 0 1-1.5 0V7A.75.75 0 0 1 9 6.25zM2.5 6.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5zm10 3h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5zM7 12.5h4a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1 0-1.5z"
      />
    </svg>
  )
}

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
  const [filtersOpen, setFiltersOpen] = useState(false)

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
    <section className="mx-auto box-border w-full max-w-[1280px]">
      <header className="flex flex-col gap-3 py-2 pb-4 min-[760px]:flex-row min-[760px]:items-start min-[760px]:justify-between">
        <div>
          <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em] text-gray-900">Lead Management</h2>
          <p className="mt-1 text-[14px] font-medium text-gray-500">Manage and track all your leads in one place</p>
        </div>

        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#80654a] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(157,122,86,0.45)]"
          onClick={() => alert('Add New Lead (dummy)')}
        >
          <span aria-hidden>↗</span>
          Add New Lead
        </button>
      </header>

      <section className="mt-3 rounded-2xl border border-gray-900/5 bg-white p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 min-[760px]:flex-row min-[760px]:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <IconSearch />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, phone, email, or location..."
                className="h-11 w-full rounded-2xl border border-gray-200 bg-white pl-9 pr-4 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#80654a] px-5 text-[13px] font-semibold text-white hover:bg-[#725940]"
              aria-expanded={filtersOpen}
              aria-controls="lead-filters"
              onClick={() => {
                setFiltersOpen((o) => !o)
              }}
            >
              <IconSliders />
              Filters
            </button>
          </div>

          {filtersOpen ? (
            <div id="lead-filters" className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-3">
              <label className="block">
                <div className="mb-1 text-[11px] font-semibold text-gray-500">Status</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as (typeof ALL_LEAD_STATUSES)[number])}
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
                >
                  {ALL_LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'All Statuses' : s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-1 text-[11px] font-semibold text-gray-500">Score</div>
                <select
                  value={score}
                  onChange={(e) => setScore(e.target.value as (typeof ALL_LEAD_SCORES)[number])}
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
                >
                  {ALL_LEAD_SCORES.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'All Scores' : s}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-1 text-[11px] font-semibold text-gray-500">Source</div>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#cdb89f] focus:outline-none"
                >
                  {allSources.map((s) => (
                    <option key={s} value={s}>
                      {s === 'all' ? 'All Sources' : s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-6 px-1 text-[12px] font-medium text-gray-500">
        Showing {shownCount} of {totalCount} leads
      </div>

      <section className="mt-3 flex flex-col gap-5" aria-busy={loading}>
        {loading ? (
          <div className="rounded-2xl border border-gray-900/5 bg-white p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
            <p className="m-0 px-1 py-5 text-[13px] text-gray-400">Loading leads…</p>
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
      </section>

    </section>
  )
}

