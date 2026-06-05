import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { FiCalendar, FiChevronDown, FiClock } from 'react-icons/fi'

import { PageHeader } from '../components/PageHeader'
import { d } from '../lib/designClasses'

import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loadSiteVisits } from '../store/siteVisit.slice'

type SiteVisitsSummaryDTO = {
  totalVisits: number
  totalVisitsNote: string
  upcoming: number
  upcomingNote: string
  avgRating: number
  avgRatingNote: string
}

type SiteVisitDTO = {
  id: string
  leadId: string
  projectId: string
  leadName: string
  projectName: string
  visitDateTimeLabel: string
  rmName: string
  handlerName: string
  tagPeriodDays: number
  progressPct: number
  expiresOnLabel: string
  daysLeftLabel: string
  locationLabel: string
  photosLabel: string
  feedback: string
  created_at?: string
  updated_at?: string
}

function parseAssignmentNotes(notes: string | null | undefined) {
  const raw = (notes ?? '').replace(/\r\n/g, '\n')
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
  const take = (prefix: string) => {
    const hit = lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()))
    if (!hit) return ''
    return hit.slice(prefix.length).trim()
  }
  const handlerName = take('Handler:')
  const rmName = take('RM:')
  const cleanedLines = lines.filter((l) => {
    const low = l.toLowerCase()
    return !(low.startsWith('handler:') || low.startsWith('rm:'))
  })
  return { handlerName, rmName, cleanedNotes: cleanedLines.join('\n') }
}

function StatCard({
  title,
  value,
  note,
  icon,
}: {
  title: string
  value: string
  note: string
  icon: React.ReactNode
}) {
  return (
    <div className={d.cardP6}>
      <div className="mb-2 flex items-center gap-3">
        <span className="text-[#8B7355]">{icon}</span>
        <span className="text-sm text-[#8B7355]">{title}</span>
      </div>
      <p className="text-3xl font-semibold text-[#2E2E2E]">{value}</p>
      <p className="mt-1 text-xs text-[#6FAF8F]">{note}</p>
    </div>
  )
}

function Pill({ tone, children }: { tone: 'mint' | 'sand'; children: React.ReactNode }) {
  const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium'
  const cls =
    tone === 'mint' ? 'bg-[#6FAF8F]/20 text-[#6FAF8F]' : 'bg-[#E8DCCB] text-[#8B7355]'
  return <span className={`${base} ${cls}`}>{children}</span>
}

type LeadVisitGroup = {
  leadId: string
  leadName: string
  locationLabel: string
  visits: SiteVisitDTO[]
}

function VisitRow({ v }: { v: SiteVisitDTO }) {
  return (
    <div className="rounded-lg border border-[#8B7355]/10 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-[#2E2E2E]">{v.projectName}</div>
          <div className="mt-0.5 text-[11px] text-[#8B7355]">{v.visitDateTimeLabel}</div>
          {v.rmName ? <div className="mt-0.5 text-[11px] text-[#8B7355]">RM: {v.rmName}</div> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Pill tone="mint">{v.daysLeftLabel}</Pill>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-[#8B7355]">{v.feedback}</div>
    </div>
  )
}

function LeadVisitSection({
  g,
  open,
  onToggle,
}: {
  g: LeadVisitGroup
  open: boolean
  onToggle: () => void
}) {
  const latest = g.visits[0]
  const moreCount = Math.max(0, g.visits.length - 1)

  return (
    <article className={`${d.cardP6} hover:shadow-lg transition-shadow`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 rounded-xl px-2 py-2 text-left hover:bg-white/70"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-[15px] font-semibold text-[#2E2E2E]">{g.leadName}</div>
            <span className="text-gray-300">·</span>
            <div className="text-[12px] font-medium text-[#8B7355]">{g.locationLabel || '—'}</div>
          </div>
          <div className="mt-1 text-[12px] text-[#8B7355]">
            <span className="font-semibold text-[#2E2E2E]">Latest:</span> {latest.visitDateTimeLabel} · {latest.projectName}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill tone="mint">{latest.daysLeftLabel}</Pill>
            <span className="ml-1 text-[11px] font-medium text-[#8B7355]">
              {g.visits.length} scheduled {g.visits.length === 1 ? 'visit' : 'visits'}
              {moreCount ? ` · +${moreCount} more` : ''}
            </span>
          </div>
        </div>
        <span className="mt-1 shrink-0 text-[#8B7355]">
          <FiChevronDown
            className={open ? 'rotate-180 transition-transform' : 'transition-transform'}
            size={18}
            aria-hidden
          />
        </span>
      </button>

      <div className="mt-3">
        <div className="rounded-xl bg-[#F5EFE7] px-4 py-3">
          <div className="text-[11px] font-semibold text-[#8B7355]">Latest Notes</div>
          <div className="mt-1 text-[12px] text-[#2E2E2E]">{latest.feedback}</div>
          {latest.rmName ? <div className="mt-2 text-[11px] font-medium text-[#8B7355]">RM: {latest.rmName}</div> : null}
        </div>
      </div>

      {open ? (
        <div className="mt-4 grid grid-cols-1 gap-3">
          {g.visits.map((v) => (
            <VisitRow key={v.id} v={v} />
          ))}
        </div>
      ) : null}
    </article>
  )
}

export function SiteVisits() {
  const dispatch = useAppDispatch()
  const { items: visitItems, loading: loadingVisits } = useAppSelector((s) => s.siteVisits)
  const [openLeadIds, setOpenLeadIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    dispatch(loadSiteVisits())
  }, [dispatch])

  const { groups, summary } = useMemo(() => {
    const uiVisits: SiteVisitDTO[] = visitItems.map((v) => {
      const visitDateTimeLabel = `${v.date}, ${v.time}`
      const tagPeriodDays = 60
      const expiresOnLabel = v.date
      const daysLeftLabel = `${tagPeriodDays} days left`
      const parsed = parseAssignmentNotes(v.notes)
      const leadName =
        String(v.leadName ?? '').trim() || (v.leadId ? `Lead ${v.leadId.slice(0, 8)}` : 'Lead')
      const projectName =
        String(v.projectName ?? '').trim() ||
        (v.projectId ? `Project ${v.projectId.slice(0, 8)}` : 'Project')
      const locationLabel = String(v.leadLocation ?? '').trim() || '—'

      return {
        id: v.id,
        leadId: v.leadId,
        projectId: v.projectId,
        leadName,
        projectName,
        visitDateTimeLabel,
        rmName: parsed.rmName,
        handlerName: parsed.handlerName,
        tagPeriodDays,
        progressPct: 0,
        expiresOnLabel,
        daysLeftLabel,
        locationLabel,
        photosLabel: '0 photos uploaded',
        feedback: parsed.cleanedNotes.trim().length ? parsed.cleanedNotes : 'Visit scheduled.',
        created_at: v.created_at,
        updated_at: v.updated_at,
      }
    })

    // Latest first (prefer created_at)
    const toMs = (iso?: string) => {
      if (!iso) return 0
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? 0 : d.getTime()
    }
    uiVisits.sort((a, b) => toMs(b.created_at) - toMs(a.created_at))

    const groupMap = new Map<string, LeadVisitGroup>()
    for (const v of uiVisits) {
      const key = v.leadId
      const cur = groupMap.get(key)
      if (!cur) {
        groupMap.set(key, {
          leadId: key,
          leadName: v.leadName,
          locationLabel: v.locationLabel,
          visits: [v],
        })
      } else {
        cur.visits.push(v)
      }
    }
    const groups = Array.from(groupMap.values()).sort((a, b) => toMs(b.visits[0]?.created_at) - toMs(a.visits[0]?.created_at))

    const now = new Date()
    const upcoming = visitItems.filter((v) => {
      const raw = `${v.date}`.trim()
      const m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
      const d = m ? new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 0, 0, 0)) : new Date(raw)
      if (Number.isNaN(d.getTime())) return false
      return d.getTime() >= now.getTime()
    }).length

    const summary: SiteVisitsSummaryDTO = {
      totalVisits: visitItems.length,
      totalVisitsNote: 'All time',
      upcoming,
      upcomingNote: 'Upcoming (by date)',
      avgRating: uiVisits.length ? 4.5 : 0,
      avgRatingNote: 'Customer satisfaction',
    }

    return { groups, summary }
  }, [visitItems])

  const loadingSummary = loadingVisits

  return (
    <section className="w-full">
      <PageHeader
        title="Site Visits"
        subtitle="Track and manage all site visits with customers"
      />

      <div className={d.gridStats3} aria-busy={loadingSummary}>
        <StatCard
          title="Total Visits"
          value={summary ? String(summary.totalVisits) : '—'}
          note={summary ? summary.totalVisitsNote : ''}
          icon={<FiCalendar size={18} aria-hidden />}
        />
        <StatCard
          title="Upcoming"
          value={summary ? String(summary.upcoming) : '—'}
          note={summary ? summary.upcomingNote : ''}
          icon={<FiClock size={18} aria-hidden />}
        />
        {/* <StatCard
          title="Average Rating"
          value={summary ? String(summary.avgRating) : '—'}
          note={summary ? summary.avgRatingNote : ''}
          icon={<span className="text-[18px]">☆</span>}
        /> */}
      </div>

      <section className="mt-6 flex flex-col gap-5" aria-busy={loadingVisits}>
        {loadingVisits ? (
          <div className={d.cardP6}>
            <p className="m-0 py-5 text-sm text-[#8B7355]">Loading visits…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {groups.length ? (
              groups.map((g) => (
                <LeadVisitSection
                  key={g.leadId}
                  g={g}
                  open={!!openLeadIds[g.leadId]}
                  onToggle={() => {
                    setOpenLeadIds((s) => ({ ...s, [g.leadId]: !s[g.leadId] }))
                  }}
                />
              ))
            ) : (
              <div className={`${d.cardP6} text-center text-sm text-[#8B7355]`}>
                No site visits scheduled yet.
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  )
}

