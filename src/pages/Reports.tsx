import { useEffect, useMemo, useState } from 'react'

import {
  fetchReportsSummary,
  fetchReportsCharts,
  fetchReportsConversionKpis,
  fetchTeamPerformance,
  type ReportsRange,
  type ReportsChartsResponse,
  type ReportsConversionKpisDTO,
  type ReportsSummaryResponse,
  type TeamPerformanceResponse,
} from '../lib/dashboardDummyApi'

import { LineChart } from '@mui/x-charts/LineChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { BarChart } from '@mui/x-charts/BarChart'

type StatTone = 'sand' | 'rose' | 'mint' | 'amber'

function IconDownload() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.25a.75.75 0 0 1 .75.75v6.44l1.72-1.72a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 1.06-1.06l1.72 1.72V3A.75.75 0 0 1 9 2.25zM3.75 12a.75.75 0 0 1 .75.75v.75c0 .14.11.25.25.25h8.5a.25.25 0 0 0 .25-.25v-.75a.75.75 0 0 1 1.5 0v.75A1.75 1.75 0 0 1 13.25 15h-8.5A1.75 1.75 0 0 1 3 13.5v-.75a.75.75 0 0 1 .75-.75z"
      />
    </svg>
  )
}

function IconArrowUpRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M11.25 3.75h3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0V6.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06l5.47-5.47H11.25a.75.75 0 0 1 0-1.5z"
      />
    </svg>
  )
}

function StatIcon({ tone }: { tone: StatTone }) {
  const cls =
    tone === 'sand'
      ? 'bg-[#f6efe4] text-[#80654a]'
      : tone === 'rose'
        ? 'bg-rose-100 text-rose-600'
        : tone === 'mint'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'

  return <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cls}`}>⌁</div>
}

function StatCard({
  tone,
  title,
  value,
  delta,
}: {
  tone: StatTone
  title: string
  value: string
  delta: string
}) {
  return (
    <div className="rounded-2xl border border-gray-900/5 bg-white p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <StatIcon tone={tone} />
        <div className="text-emerald-600">
          <IconArrowUpRight />
        </div>
      </div>
      <div className="mt-4 text-[11px] font-semibold text-gray-400">{title}</div>
      <div className="mt-2 text-[28px] font-bold tracking-[-0.02em] text-gray-900">{value}</div>
      <div className="mt-2 text-[11px] font-medium text-emerald-700">{delta}</div>
    </div>
  )
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M6.1 3.25c.3-.3.78-.33 1.12-.07l1.65 1.25c.3.23.41.63.27.98l-.6 1.52c-.08.2-.06.42.06.6.55.82 1.27 1.54 2.1 2.1.18.12.4.14.6.06l1.52-.6c.35-.14.75-.03.98.27l1.25 1.65c.26.34.23.82-.07 1.12l-.86.86c-.46.46-1.14.64-1.77.46-2.35-.68-4.51-2.06-6.22-3.77C4.72 9.2 3.35 7.04 2.66 4.69c-.18-.63 0-1.31.46-1.77l.86-.86z"
      />
    </svg>
  )
}

function IconBars() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M3.5 14.75a.75.75 0 0 1-.75-.75V3.75a.75.75 0 0 1 1.5 0V14a.75.75 0 0 1-.75.75zm4.5 0a.75.75 0 0 1-.75-.75V7a.75.75 0 0 1 1.5 0v7a.75.75 0 0 1-.75.75zm4.5 0a.75.75 0 0 1-.75-.75V5.25a.75.75 0 0 1 1.5 0V14a.75.75 0 0 1-.75.75z"
      />
    </svg>
  )
}

function IconBadge() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.25c2.2 0 4 1.8 4 4 0 1.66-1.02 3.09-2.47 3.68l.55 5.02a.75.75 0 0 1-1.15.7L9 14.55l-1.93 1.1a.75.75 0 0 1-1.15-.7l.55-5.02A3.99 3.99 0 0 1 5 6.25c0-2.2 1.8-4 4-4zm0 1.5A2.5 2.5 0 1 0 9 8.75a2.5 2.5 0 0 0 0-5z"
      />
    </svg>
  )
}

function KpiCard({
  tone,
  icon,
  title,
  value,
  note,
}: {
  tone: 'brown' | 'green' | 'sand'
  icon: React.ReactNode
  title: string
  value: string
  note: string
}) {
  const cls =
    tone === 'brown'
      ? 'bg-gradient-to-br from-[#6b5a45] to-[#8a7356] text-white'
      : tone === 'green'
        ? 'bg-gradient-to-br from-[#5aa37f] to-[#78b693] text-white'
        : 'bg-gradient-to-br from-[#e9decf] to-[#f6efe4] text-gray-900'

  const subtle = tone === 'sand' ? 'text-gray-700/80' : 'text-white/80'

  return (
    <div className={`rounded-2xl p-5 shadow-[0_10px_24px_rgba(17,24,39,0.10)] ${cls}`}>
      <div className="flex items-start gap-3">
        <div className={tone === 'sand' ? 'text-gray-800/80' : 'text-white/85'}>{icon}</div>
        <div className="mt-0.5 text-[11px] font-semibold">{title}</div>
      </div>
      <div className="mt-2 text-[28px] font-bold tracking-[-0.02em]">{value}</div>
      <div className={`mt-1 text-[11px] font-medium ${subtle}`}>{note}</div>
    </div>
  )
}

const TABS: { id: ReportsRange; label: string }[] = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'leads', label: 'Leads' },
  { id: 'conversion', label: 'Conversion' },
  { id: 'team', label: 'Team' },
]

export function Reports() {
  const [tab, setTab] = useState<ReportsRange>('month')
  const [data, setData] = useState<ReportsSummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [team, setTeam] = useState<TeamPerformanceResponse | null>(null)
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [charts, setCharts] = useState<ReportsChartsResponse | null>(null)
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [conversionKpis, setConversionKpis] = useState<ReportsConversionKpisDTO | null>(null)
  const [loadingKpis, setLoadingKpis] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetchReportsSummary(tab)
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [tab])

  useEffect(() => {
    setLoadingCharts(true)
    fetchReportsCharts(tab)
      .then((d) => setCharts(d))
      .finally(() => setLoadingCharts(false))
  }, [tab])

  useEffect(() => {
    if (tab !== 'team') return
    setLoadingTeam(true)
    fetchTeamPerformance(tab)
      .then((d) => setTeam(d))
      .finally(() => setLoadingTeam(false))
  }, [tab])

  useEffect(() => {
    setLoadingKpis(true)
    fetchReportsConversionKpis(tab)
      .then((d) => setConversionKpis(d))
      .finally(() => setLoadingKpis(false))
  }, [tab])

  const cards = useMemo(() => {
    if (!data) return []
    return data.cards
  }, [data])

  const teamRows = useMemo(() => {
    if (!team) return []
    return team.rows
  }, [team])

  const xLabels = useMemo(() => charts?.funnel.map((p) => p.label) ?? [], [charts])
  const newLeads = useMemo(() => charts?.funnel.map((p) => p.newLeads) ?? [], [charts])
  const contacted = useMemo(() => charts?.funnel.map((p) => p.contacted) ?? [], [charts])
  const qualified = useMemo(() => charts?.funnel.map((p) => p.qualified) ?? [], [charts])
  const closedWon = useMemo(() => charts?.funnel.map((p) => p.closedWon) ?? [], [charts])

  const margin = useMemo(() => ({ top: 14, left: 54, right: 18, bottom: 44 }), [])
  const barMargin = useMemo(() => ({ top: 18, left: 44, right: 18, bottom: 44 }), [])
  const sourceLabels = useMemo(() => charts?.sourcePerformance.labels ?? [], [charts])
  const sourceMax = useMemo(() => {
    const totals = charts?.sourcePerformance.totalLeads ?? []
    const max = totals.length ? Math.max(...totals) : 1
    return max > 0 ? max : 1
  }, [charts])
  const sourceTotal = useMemo(() => (charts?.sourcePerformance.totalLeads ?? []).map((v) => v / sourceMax), [charts, sourceMax])
  const sourceHot = useMemo(() => (charts?.sourcePerformance.hotLeads ?? []).map((v) => v / sourceMax), [charts, sourceMax])
  const sourceClosed = useMemo(() => (charts?.sourcePerformance.closedWon ?? []).map((v) => v / sourceMax), [charts, sourceMax])

  return (
    <section className="mx-auto box-border w-full max-w-[1280px]">
      <header className="flex flex-col gap-3 py-2 pb-4 min-[760px]:flex-row min-[760px]:items-start min-[760px]:justify-between">
        <div>
          <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em] text-gray-900">Reports &amp; Analytics</h2>
          <p className="mt-1 text-[14px] font-medium text-gray-500">
            Comprehensive insights into your sales performance
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#80654a] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940]"
          onClick={() => {
            // Dummy action – in real app this would export a file.
            window.alert('Export started (dummy)')
          }}
        >
          <IconDownload />
          Export Report
        </button>
      </header>

      <div className="mt-1 flex flex-wrap items-center gap-2">
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              className={
                active
                  ? 'h-9 rounded-xl bg-[#80654a] px-4 text-[12px] font-semibold text-white shadow-sm'
                  : 'h-9 rounded-xl border border-[#e7ddcf] bg-white px-4 text-[12px] font-semibold text-[#80654a] hover:bg-[#faf6ef]'
              }
              aria-pressed={active}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 min-[900px]:grid-cols-4" aria-busy={loading}>
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={`sk-${idx}`}
                className="h-[138px] rounded-2xl border border-gray-900/5 bg-white p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]"
              >
                <div className="h-9 w-9 rounded-xl bg-[#f6efe4]" />
                <div className="mt-5 h-3 w-24 rounded bg-gray-100" />
                <div className="mt-4 h-7 w-16 rounded bg-gray-100" />
                <div className="mt-4 h-3 w-28 rounded bg-emerald-50" />
              </div>
            ))
          : cards.map((c) => <StatCard key={c.id} tone={c.tone} title={c.title} value={c.value} delta={c.delta} />)}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 min-[900px]:grid-cols-2" aria-busy={loadingCharts}>
        <section className="rounded-2xl border border-gray-900/5 bg-white p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
          <div className="text-sm font-semibold text-gray-800">Lead Funnel Progression</div>
          <div className="mt-3">
            {loadingCharts ? (
              <p className="m-0 px-1 py-5 text-[13px] text-gray-400">Loading chart…</p>
            ) : (
              <LineChart
                series={[
                  { data: newLeads, label: 'New Leads', color: '#80654a' },
                  { data: contacted, label: 'Contacted', color: '#6aa88a' },
                  { data: qualified, label: 'Qualified', color: '#e9decf' },
                  { data: closedWon, label: 'Closed Won', color: '#d96a6a' },
                ]}
                xAxis={[{ scaleType: 'point', data: xLabels, height: 28 }]}
                yAxis={[{ width: 50 }]}
                margin={margin}
                height={280}
                grid={{ horizontal: true }}
                sx={{
                  '& .MuiChartsAxis-tickLabel': { fill: '#6b7280' },
                  '& .MuiChartsAxis-line': { stroke: 'rgba(17,24,39,0.15)' },
                  '& .MuiChartsAxis-tick': { stroke: 'rgba(17,24,39,0.15)' },
                  '& .MuiChartsGrid-line': { stroke: 'rgba(17,24,39,0.08)' },
                  '& .MuiChartsLegend-mark': { rx: 6, ry: 6 },
                }}
              />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-900/5 bg-white p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
          <div className="text-sm font-semibold text-gray-800">Lead Status Distribution</div>
          <div className="mt-3 flex items-center justify-center">
            {loadingCharts ? (
              <p className="m-0 px-1 py-5 text-[13px] text-gray-400">Loading chart…</p>
            ) : (
              <PieChart
                height={280}
                series={[
                  {
                    data:
                      charts?.status.map((s) => ({
                        id: s.id,
                        value: s.value,
                        label: `${s.label}: ${s.value}%`,
                        color: s.color,
                      })) ?? [],
                    innerRadius: 0,
                    outerRadius: 90,
                    paddingAngle: 1,
                    cornerRadius: 3,
                  },
                ]}
                margin={{ top: 10, left: 10, right: 10, bottom: 10 }}
              />
            )}
          </div>
        </section>
      </div>

      <section className="mt-6" aria-busy={loadingKpis}>
        <div className="grid grid-cols-1 gap-6 min-[900px]:grid-cols-3">
          <KpiCard
            tone="brown"
            icon={<IconPhone />}
            title="Total Calls Made"
            value={conversionKpis ? String(conversionKpis.totalCallsMade.value) : '—'}
            note={conversionKpis ? conversionKpis.totalCallsMade.note : ''}
          />
          <KpiCard
            tone="green"
            icon={<IconBars />}
            title="Site Visits Completed"
            value={conversionKpis ? String(conversionKpis.siteVisitsCompleted.value) : '—'}
            note={conversionKpis ? conversionKpis.siteVisitsCompleted.note : ''}
          />
          <KpiCard
            tone="sand"
            icon={<IconBadge />}
            title="Deals Closed"
            value={conversionKpis ? String(conversionKpis.dealsClosed.value) : '—'}
            note={conversionKpis ? conversionKpis.dealsClosed.note : ''}
          />
        </div>
      </section>

      <section
        className="mt-6 rounded-2xl border border-gray-900/5 bg-white p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]"
        aria-busy={loadingCharts}
      >
        <div className="text-sm font-semibold text-gray-800">Lead Source Performance</div>
        <div className="mt-3">
          {loadingCharts ? (
            <p className="m-0 px-1 py-5 text-[13px] text-gray-400">Loading chart…</p>
          ) : (
            <BarChart
              height={280}
              xAxis={[
                {
                  id: 'sources',
                  data: sourceLabels,
                  scaleType: 'band',
                },
              ]}
              yAxis={[{ min: 0, max: 1, width: 40 }]}
              series={[
                { label: 'Total Leads', data: sourceTotal, color: '#80654a' },
                { label: 'Hot Leads', data: sourceHot, color: '#d96a6a' },
                { label: 'Closed Won', data: sourceClosed, color: '#6aa88a' },
              ]}
              margin={barMargin}
              grid={{ horizontal: true }}
              sx={{
                '& .MuiChartsAxis-tickLabel': { fill: '#6b7280' },
                '& .MuiChartsAxis-line': { stroke: 'rgba(17,24,39,0.15)' },
                '& .MuiChartsAxis-tick': { stroke: 'rgba(17,24,39,0.15)' },
                '& .MuiChartsGrid-line': { stroke: 'rgba(17,24,39,0.08)' },
                '& .MuiChartsLegend-mark': { rx: 6, ry: 6 },
              }}
            />
          )}
        </div>
      </section>

      {tab === 'team' ? (
        <section className="mt-6 rounded-2xl border border-gray-900/5 bg-white p-6 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
          <div className="text-[16px] font-semibold text-gray-900">Team Performance</div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="border-b border-gray-900/10">
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500">Team Member</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500">Total Leads</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500">Hot Leads</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500">Contacted</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500">Closed Won</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-gray-500">Conversion Rate</th>
                </tr>
              </thead>
              <tbody aria-busy={loadingTeam}>
                {loadingTeam
                  ? Array.from({ length: 3 }).map((_, idx) => {
                      return (
                        <tr key={`sk-row-${idx}`} className="border-b border-gray-900/5 last:border-b-0">
                          <td className="px-3 py-4">
                            <div className="h-4 w-32 rounded bg-gray-100" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-4 w-8 rounded bg-gray-100" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-6 w-10 rounded-full bg-rose-50" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-4 w-8 rounded bg-gray-100" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-6 w-10 rounded-full bg-emerald-50" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-2 w-40 rounded-full bg-gray-100" />
                          </td>
                        </tr>
                      )
                    })
                  : teamRows.map((r) => {
                      const pct = Math.max(0, Math.min(100, r.conversionPct))
                      return (
                        <tr key={r.id} className="border-b border-gray-900/5 last:border-b-0">
                          <td className="px-3 py-4 text-[12px] font-medium text-gray-900">{r.name}</td>
                          <td className="px-3 py-4 text-[12px] text-gray-700">{r.totalLeads}</td>
                          <td className="px-3 py-4">
                            <span className="inline-flex h-6 items-center justify-center rounded-full bg-rose-100 px-2.5 text-[11px] font-semibold text-rose-600">
                              {r.hotLeads}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-[12px] text-gray-700">{r.contacted}</td>
                          <td className="px-3 py-4">
                            <span className="inline-flex h-6 items-center justify-center rounded-full bg-emerald-100 px-2.5 text-[11px] font-semibold text-emerald-700">
                              {r.closedWon}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-[160px] rounded-full bg-[#f6efe4]">
                                <div className="h-2 rounded-full bg-[#80654a]" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-[11px] font-semibold text-gray-700">{pct}%</div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  )
}

