import { useEffect, useMemo, useState } from 'react'
import { CanAccess } from '../acl/CanAccess'

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
import { FiActivity, FiBarChart2, FiCheckCircle, FiDownload, FiPhoneCall, FiTrendingUp } from 'react-icons/fi'

type StatTone = 'sand' | 'rose' | 'mint' | 'amber'

function StatIcon({ tone }: { tone: StatTone }) {
  const cls =
    tone === 'sand'
      ? 'bg-[#FAF7F2] text-[#8B7355]'
      : tone === 'rose'
        ? 'bg-rose-100 text-[#D96B6B]'
        : tone === 'mint'
          ? 'bg-[#6FAF8F]/20 text-[#6FAF8F]'
          : 'bg-amber-100 text-amber-700'

  return (
    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${cls}`}>
      {tone === 'sand' ? <FiBarChart2 size={16} aria-hidden /> : tone === 'rose' ? <FiActivity size={16} aria-hidden /> : tone === 'mint' ? <FiTrendingUp size={16} aria-hidden /> : <FiCheckCircle size={16} aria-hidden />}
    </div>
  )
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
    <div className="rounded-xl border border-[#8B7355]/10 bg-white p-5 ">
      <div className="flex items-start justify-between gap-4">
        <StatIcon tone={tone} />
        <div className="text-[#6FAF8F]">
          <FiTrendingUp size={16} aria-hidden />
        </div>
      </div>
      <div className="mt-4 text-[11px] font-semibold text-[#8B7355]">{title}</div>
      <div className="mt-2 text-3xl font-semibold text-[#2E2E2E]">{value}</div>
      <div className="mt-2 text-[11px] font-medium text-[#6FAF8F]">{delta}</div>
    </div>
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
        : 'bg-gradient-to-br from-[#e9decf] to-[#FAF7F2] text-[#2E2E2E]'

  const subtle = tone === 'sand' ? 'text-[#2E2E2E]/80' : 'text-white/80'

  return (
    <div className={`rounded-xl p-5 shadow-[0_10px_24px_rgba(17,24,39,0.10)] ${cls}`}>
      <div className="flex items-start gap-3">
        <div className={tone === 'sand' ? 'text-[#2E2E2E]/80' : 'text-white/85'}>{icon}</div>
        <div className="mt-0.5 text-[11px] font-semibold">{title}</div>
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
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
    <section className="w-full">
      <header className="flex flex-col gap-3 py-2 pb-4 min-[760px]:flex-row min-[760px]:items-start min-[760px]:justify-between">
        <div>
          <h2 className="m-0 text-3xl font-semibold text-[#2E2E2E]">Reports &amp; Analytics</h2>
          <p className="mt-1 text-[14px] font-medium text-[#8B7355]">
            Comprehensive insights into your sales performance
          </p>
        </div>

        <CanAccess moduleKey="admin_acl">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#8B7355] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#6d5a43]"
            onClick={() => {
              window.alert('Export started (dummy)')
            }}
          >
            <FiDownload size={18} aria-hidden />
            Export Report
          </button>
        </CanAccess>
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
                  ? 'h-9 rounded-xl bg-[#8B7355] px-4 text-[12px] font-semibold text-white shadow-sm'
                  : 'h-9 rounded-xl border border-[#e7ddcf] bg-white px-4 text-[12px] font-semibold text-[#8B7355] hover:bg-[#F5EFE7]'
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
                className="h-[138px] rounded-xl border border-[#8B7355]/10 bg-white p-5 "
              >
                <div className="h-9 w-9 rounded-xl bg-[#FAF7F2]" />
                <div className="mt-5 h-3 w-24 rounded bg-gray-100" />
                <div className="mt-4 h-7 w-16 rounded bg-gray-100" />
                <div className="mt-4 h-3 w-28 rounded bg-emerald-50" />
              </div>
            ))
          : cards.map((c) => <StatCard key={c.id} tone={c.tone} title={c.title} value={c.value} delta={c.delta} />)}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 min-[900px]:grid-cols-2" aria-busy={loadingCharts}>
        <section className="rounded-xl border border-[#8B7355]/10 bg-white p-5 ">
          <div className="text-sm font-semibold text-[#2E2E2E]">Lead Funnel Progression</div>
          <div className="mt-3">
            {loadingCharts ? (
              <p className="m-0 px-1 py-5 text-[13px] text-[#8B7355]">Loading chart…</p>
            ) : (
              <LineChart
                series={[
                  { data: newLeads, label: 'New Leads', color: '#8B7355' },
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

        <section className="rounded-xl border border-[#8B7355]/10 bg-white p-5 ">
          <div className="text-sm font-semibold text-[#2E2E2E]">Lead Status Distribution</div>
          <div className="mt-3 flex items-center justify-center">
            {loadingCharts ? (
              <p className="m-0 px-1 py-5 text-[13px] text-[#8B7355]">Loading chart…</p>
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
            icon={<FiPhoneCall size={18} aria-hidden />}
            title="Total Calls Made"
            value={conversionKpis ? String(conversionKpis.totalCallsMade.value) : '—'}
            note={conversionKpis ? conversionKpis.totalCallsMade.note : ''}
          />
          <KpiCard
            tone="green"
            icon={<FiBarChart2 size={18} aria-hidden />}
            title="Site Visits Completed"
            value={conversionKpis ? String(conversionKpis.siteVisitsCompleted.value) : '—'}
            note={conversionKpis ? conversionKpis.siteVisitsCompleted.note : ''}
          />
          <KpiCard
            tone="sand"
            icon={<FiCheckCircle size={18} aria-hidden />}
            title="Deals Closed"
            value={conversionKpis ? String(conversionKpis.dealsClosed.value) : '—'}
            note={conversionKpis ? conversionKpis.dealsClosed.note : ''}
          />
        </div>
      </section>

      <section
        className="mt-6 rounded-xl border border-[#8B7355]/10 bg-white p-5 "
        aria-busy={loadingCharts}
      >
        <div className="text-sm font-semibold text-[#2E2E2E]">Lead Source Performance</div>
        <div className="mt-3">
          {loadingCharts ? (
            <p className="m-0 px-1 py-5 text-[13px] text-[#8B7355]">Loading chart…</p>
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
                { label: 'Total Leads', data: sourceTotal, color: '#8B7355' },
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
        <section className="mt-6 rounded-xl border border-[#8B7355]/10 bg-white p-6 ">
          <div className="text-[16px] font-semibold text-[#2E2E2E]">Team Performance</div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse">
              <thead>
                <tr className="border-b border-[#8B7355]/10">
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#8B7355]">Team Member</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#8B7355]">Total Leads</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#8B7355]">Hot Leads</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#8B7355]">Contacted</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#8B7355]">Closed Won</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold text-[#8B7355]">Conversion Rate</th>
                </tr>
              </thead>
              <tbody aria-busy={loadingTeam}>
                {loadingTeam
                  ? Array.from({ length: 3 }).map((_, idx) => {
                      return (
                        <tr key={`sk-row-${idx}`} className="border-b border-[#8B7355]/10 last:border-b-0">
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
                        <tr key={r.id} className="border-b border-[#8B7355]/10 last:border-b-0">
                          <td className="px-3 py-4 text-[12px] font-medium text-[#2E2E2E]">{r.name}</td>
                          <td className="px-3 py-4 text-[12px] text-[#2E2E2E]">{r.totalLeads}</td>
                          <td className="px-3 py-4">
                            <span className="inline-flex h-6 items-center justify-center rounded-full bg-rose-100 px-2.5 text-[11px] font-semibold text-[#D96B6B]">
                              {r.hotLeads}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-[12px] text-[#2E2E2E]">{r.contacted}</td>
                          <td className="px-3 py-4">
                            <span className="inline-flex h-6 items-center justify-center rounded-full bg-[#6FAF8F]/20 px-2.5 text-[11px] font-semibold text-[#6FAF8F]">
                              {r.closedWon}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-[160px] rounded-full bg-[#FAF7F2]">
                                <div className="h-2 rounded-full bg-[#8B7355]" style={{ width: `${pct}%` }} />
                              </div>
                              <div className="text-[11px] font-semibold text-[#2E2E2E]">{pct}%</div>
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

