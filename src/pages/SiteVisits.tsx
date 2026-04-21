import { useEffect, useMemo, useState } from 'react'
import type React from 'react'

import { fetchProjects, type ProjectDTO } from '../lib/dashboardDummyApi'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { loadCaptureLeads } from '../store/captureLeadsSlice'
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
    <div className="rounded-2xl border border-gray-900/5 bg-white p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold text-gray-400">{title}</div>
          <div className="mt-2 text-[28px] font-bold tracking-[-0.02em] text-gray-900">{value}</div>
          <div className="mt-1 text-[11px] font-medium text-gray-400">{note}</div>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
    </div>
  )
}

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M5.25 2.5a.75.75 0 0 1 .75.75V4h6v-.75a.75.75 0 0 1 1.5 0V4h.75A1.75 1.75 0 0 1 16 5.75v8.5A1.75 1.75 0 0 1 14.25 16H3.75A1.75 1.75 0 0 1 2 14.25v-8.5A1.75 1.75 0 0 1 3.75 4h.75v-.75a.75.75 0 0 1 .75-.75zM3.5 7v7.25c0 .14.11.25.25.25h10.5a.25.25 0 0 0 .25-.25V7h-11z"
      />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.25A6.75 6.75 0 1 0 9 15.75 6.75 6.75 0 0 0 9 2.25zm0 1.5a5.25 5.25 0 1 1 0 10.5 5.25 5.25 0 0 1 0-10.5zm.75 2a.75.75 0 0 0-1.5 0V9c0 .25.12.48.32.62l2.25 1.5a.75.75 0 1 0 .84-1.24L9.75 8.6V5.75z"
      />
    </svg>
  )
}

function Pill({ tone, children }: { tone: 'mint' | 'sand'; children: React.ReactNode }) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none'
  const cls = tone === 'mint' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#faf6ef] text-[#80654a]'
  return <span className={`${base} ${cls}`}>{children}</span>
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className={open ? 'rotate-180 transition-transform' : 'transition-transform'}>
      <path fill="currentColor" d="M4.7 6.7a.75.75 0 0 1 1.06 0L9 9.94l3.24-3.24a.75.75 0 1 1 1.06 1.06l-3.77 3.77a.75.75 0 0 1-1.06 0L4.7 7.76a.75.75 0 0 1 0-1.06z" />
    </svg>
  )
}

type LeadVisitGroup = {
  leadId: string
  leadName: string
  locationLabel: string
  visits: SiteVisitDTO[]
}

function VisitRow({ v }: { v: SiteVisitDTO }) {
  return (
    <div className="rounded-xl border border-gray-900/5 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold text-gray-900">{v.projectName}</div>
          <div className="mt-0.5 text-[11px] text-gray-500">{v.visitDateTimeLabel}</div>
          {v.rmName ? <div className="mt-0.5 text-[11px] text-gray-500">RM: {v.rmName}</div> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Pill tone="mint">{v.daysLeftLabel}</Pill>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-gray-600">{v.feedback}</div>
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
    <article className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 rounded-xl px-2 py-2 text-left hover:bg-white/70"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-[15px] font-semibold text-gray-900">{g.leadName}</div>
            <span className="text-gray-300">·</span>
            <div className="text-[12px] font-medium text-gray-500">{g.locationLabel || '—'}</div>
          </div>
          <div className="mt-1 text-[12px] text-gray-600">
            <span className="font-semibold text-gray-900">Latest:</span> {latest.visitDateTimeLabel} · {latest.projectName}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Pill tone="mint">{latest.daysLeftLabel}</Pill>
            <span className="ml-1 text-[11px] font-medium text-gray-500">
              {g.visits.length} scheduled {g.visits.length === 1 ? 'visit' : 'visits'}
              {moreCount ? ` · +${moreCount} more` : ''}
            </span>
          </div>
        </div>
        <span className="mt-1 shrink-0 text-gray-400">
          <IconChevron open={open} />
        </span>
      </button>

      <div className="mt-3">
        <div className="rounded-xl bg-[#faf6ef] px-4 py-3">
          <div className="text-[11px] font-semibold text-gray-500">Latest Notes</div>
          <div className="mt-1 text-[12px] text-gray-700">{latest.feedback}</div>
          {latest.rmName ? <div className="mt-2 text-[11px] font-medium text-gray-600">RM: {latest.rmName}</div> : null}
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
  const { items: leadItems, loading: loadingLeads } = useAppSelector((s) => s.captureLeads)
  const { items: visitItems, loading: loadingVisits } = useAppSelector((s) => s.siteVisits)
  const [projects, setProjects] = useState<ProjectDTO[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [openLeadIds, setOpenLeadIds] = useState<Record<string, boolean>>({})

  useEffect(() => {
    dispatch(loadSiteVisits())
    dispatch(loadCaptureLeads())
  }, [dispatch])

  useEffect(() => {
    let cancelled = false
    setLoadingProjects(true)
    fetchProjects()
      .then((p) => {
        if (!cancelled) setProjects(p)
      })
      .finally(() => {
        if (!cancelled) setLoadingProjects(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const { groups, summary } = useMemo(() => {
    const leadById = new Map(leadItems.map((l) => [l.id, l]))
    const projectById = new Map<ProjectDTO['id'], ProjectDTO>(projects.map((p) => [p.id, p]))

    const uiVisits: SiteVisitDTO[] = visitItems.map((v) => {
      const lead = leadById.get(v.leadId)
      const project = projectById.get(v.projectId as ProjectDTO['id'])

      const visitDateTimeLabel = `${v.date}, ${v.time}`
      const tagPeriodDays = 60
      const expiresOnLabel = v.date
      const daysLeftLabel = `${tagPeriodDays} days left`
      const parsed = parseAssignmentNotes(v.notes)

      return {
        id: v.id,
        leadId: v.leadId,
        projectId: v.projectId,
        leadName: lead?.name ?? 'Unknown Lead',
        projectName: project?.name ?? v.projectId,
        visitDateTimeLabel,
        rmName: parsed.rmName,
        handlerName: parsed.handlerName,
        tagPeriodDays,
        progressPct: 0,
        expiresOnLabel,
        daysLeftLabel,
        locationLabel: lead?.resiLocation ?? '—',
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
      const lead = leadById.get(v.leadId)
      const key = v.leadId
      const cur = groupMap.get(key)
      if (!cur) {
        groupMap.set(key, {
          leadId: key,
          leadName: lead?.name ?? v.leadName,
          locationLabel: lead?.resiLocation ?? v.locationLabel,
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
  }, [leadItems, projects, visitItems])

  const loadingSummary = loadingVisits || loadingLeads || loadingProjects

  return (
    <section className="mx-auto box-border w-full max-w-[1280px]">
      <header className="flex flex-col gap-3 py-2 pb-4 min-[760px]:flex-row min-[760px]:items-start min-[760px]:justify-between">
        <div>
          <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em] text-gray-900">Site Visits</h2>
          <p className="mt-1 text-[14px] font-medium text-gray-500">Track and manage all site visits with customers</p>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-1 gap-6 min-[900px]:grid-cols-3" aria-busy={loadingSummary}>
        <StatCard
          title="Total Visits"
          value={summary ? String(summary.totalVisits) : '—'}
          note={summary ? summary.totalVisitsNote : ''}
          icon={<IconCalendar />}
        />
        <StatCard
          title="Upcoming"
          value={summary ? String(summary.upcoming) : '—'}
          note={summary ? summary.upcomingNote : ''}
          icon={<IconClock />}
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
          <div className="rounded-2xl border border-gray-900/5 bg-white p-6 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
            <p className="m-0 px-1 py-5 text-[13px] text-gray-400">Loading visits…</p>
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
              <div className="rounded-2xl border border-gray-900/5 bg-white p-6 text-[13px] text-gray-500 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
                No site visits scheduled yet.
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  )
}

