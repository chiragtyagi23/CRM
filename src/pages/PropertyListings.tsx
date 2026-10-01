import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiSearch, FiSliders } from 'react-icons/fi'

import { LeadCard } from '../components/LeadCard'
import type { LeadDTO } from '../lib/dashboardDummyApi'
import { fetchPropertyListings } from '../lib/captureLeadsApi'
import { ALL_LEAD_SCORES, ALL_LEAD_STATUSES, toLeadRow } from '../utils/leadMapping'
import { BHK_SELECT_OPTIONS, BUDGET_SELECT_OPTIONS, CAPTURE_LEAD_SOURCE_TILE_OPTIONS } from '../utils/uiConfig'

const LISTINGS_PAGE_SIZE = 10

type ListingsResult = { key: string; rows: LeadDTO[]; total: number; error: string | null }

export function PropertyListings() {
  const navigate = useNavigate()
  const [result, setResult] = useState<ListingsResult | null>(null)

  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [status, setStatus] = useState<(typeof ALL_LEAD_STATUSES)[number]>('all')
  const [score, setScore] = useState<(typeof ALL_LEAD_SCORES)[number]>('all')
  const [source, setSource] = useState<string>('all')
  const [bhk, setBhk] = useState<string>('all')
  const [budget, setBudget] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  // Debounce search; going back to page 1 happens together with the query change.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(t)
  }, [q])

  const requestKey = JSON.stringify([page, debouncedQ, status, score, source, bhk, budget])

  useEffect(() => {
    // Abort the previous request when filters/search/page change, so stale requests don't pile up.
    const controller = new AbortController()
    fetchPropertyListings(
      {
        page,
        pageSize: LISTINGS_PAGE_SIZE,
        q: debouncedQ || undefined,
        status: status === 'all' ? undefined : status,
        score: score === 'all' ? undefined : score,
        source: source === 'all' ? undefined : source,
        bhk: bhk === 'all' ? undefined : bhk,
        budget: budget === 'all' ? undefined : budget,
      },
      controller.signal,
    )
      .then((res) => {
        setResult({ key: requestKey, rows: res.items.map(toLeadRow), total: res.total, error: null })
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message = err instanceof Error ? err.message : 'Failed to load listings'
        setResult({ key: requestKey, rows: [], total: 0, error: message })
      })
    return () => controller.abort()
  }, [bhk, budget, debouncedQ, page, requestKey, score, source, status])

  // Loading until the response for the current filters/page has arrived.
  const loading = result?.key !== requestKey
  const rows = loading ? [] : result.rows
  const total = result?.total ?? 0
  const error = loading ? null : result.error

  const allSources = useMemo(
    () => ['all', ...CAPTURE_LEAD_SOURCE_TILE_OPTIONS.map((s) => s.id)],
    [],
  )

  const totalPages = Math.max(1, Math.ceil(total / LISTINGS_PAGE_SIZE))
  const rangeStart = total === 0 ? 0 : (page - 1) * LISTINGS_PAGE_SIZE + 1
  const rangeEnd = Math.min(page * LISTINGS_PAGE_SIZE, total)

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div className="mb-6">
          <h1 className="crm-page-title">Property Listings</h1>
          <p className="crm-page-subtitle">All leads across the CRM in one place</p>
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
                placeholder="Search by name, phone, email, location, BHK, or budget..."
                className="w-full rounded-lg border border-[#E8DCCB] bg-white py-2 pl-10 pr-4 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355]/70 focus:border-[#8B7355] focus:outline-none"
              />
            </div>
            <button
              type="button"
              aria-expanded={showFilters}
              aria-controls="listing-filters"
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
              id="listing-filters"
              className="mt-4 grid grid-cols-1 gap-4 border-t border-[#E8DCCB] pt-4 sm:grid-cols-3 lg:grid-cols-5"
            >
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="listing-filter-status">
                  Status
                </label>
                <select
                  id="listing-filter-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as (typeof ALL_LEAD_STATUSES)[number])
                    setPage(1)
                  }}
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
                <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="listing-filter-score">
                  Score
                </label>
                <select
                  id="listing-filter-score"
                  value={score}
                  onChange={(e) => {
                    setScore(e.target.value as (typeof ALL_LEAD_SCORES)[number])
                    setPage(1)
                  }}
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
                <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="listing-filter-source">
                  Source
                </label>
                <select
                  id="listing-filter-source"
                  value={source}
                  onChange={(e) => {
                    setSource(e.target.value)
                    setPage(1)
                  }}
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
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="listing-filter-bhk">
                  BHK
                </label>
                <select
                  id="listing-filter-bhk"
                  value={bhk}
                  onChange={(e) => {
                    setBhk(e.target.value)
                    setPage(1)
                  }}
                  className="w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-[13px] text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none"
                >
                  <option value="all">All BHK</option>
                  {BHK_SELECT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="listing-filter-budget">
                  Budget
                </label>
                <select
                  id="listing-filter-budget"
                  value={budget}
                  onChange={(e) => {
                    setBudget(e.target.value)
                    setPage(1)
                  }}
                  className="w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-[13px] text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none"
                >
                  <option value="all">All Budgets</option>
                  {BUDGET_SELECT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-4 text-[13px] font-medium text-[#8B7355]">
        {total === 0 ? 'Showing 0 listings' : `Showing ${rangeStart}–${rangeEnd} of ${total} listings`}
      </div>

      <div className="grid grid-cols-1 gap-4" aria-busy={loading}>
        {loading ? (
          <div className="rounded-xl border border-[#8B7355]/10 bg-white p-12 text-center">
            <p className="text-[14px] font-medium text-[#8B7355]">Loading listings…</p>
          </div>
        ) : (
          rows.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              readOnly
              onViewDetails={() => navigate(`/property-listings/${lead.id}`)}
            />
          ))
        )}
      </div>

      {!loading && error ? (
        <div className="mt-4 rounded-xl border border-[#D96B6B]/30 bg-white p-12 text-center">
          <p className="text-[14px] font-medium text-[#D96B6B]">{error}</p>
        </div>
      ) : null}

      {!loading && !error && total === 0 ? (
        <div className="mt-4 rounded-xl border border-[#8B7355]/10 bg-white p-12 text-center">
          <p className="text-[14px] font-medium text-[#8B7355]">No listings found matching your filters.</p>
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
