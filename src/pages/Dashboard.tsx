import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  fetchDashboardCharts,
  type DashboardRange,
  type DashboardStatDTO,
  type LeadSourcePointDTO,
  type RecentLeadDTO,
  type SalesFunnelPointDTO,
} from '../lib/dashboardDummyApi'
import { fetchCaptureLeads, type CaptureLeadDTO } from '../lib/captureLeadsApi'
import { fetchSiteVisits } from '../lib/captureSiteVisitApi'
import { DashboardStatCard } from '../components/DashboardStatCard'
import { RecentLeadsTable } from '../components/RecentLeadsTable'
import { BarChart } from '@mui/x-charts/BarChart'
import { PieChart } from '@mui/x-charts'
import { CanAccess } from '../acl/CanAccess'
import { buildDashboardStats, dashboardSubtitle } from '../utils/uiConfig'
import { isSameLocalDay, toMs } from '../utils/date'
import { asRecentLeadScore, asRecentLeadStatus } from '../utils/leads'

export function Dashboard() {
  const navigate = useNavigate()
  const [range, setRange] = useState<DashboardRange>('week')
  const [stats, setStats] = useState<DashboardStatDTO[]>([])
  const [salesFunnel, setSalesFunnel] = useState<SalesFunnelPointDTO[]>([])
  const [leadSources, setLeadSources] = useState<LeadSourcePointDTO[]>([])
  const [recentLeads, setRecentLeads] = useState<RecentLeadDTO[]>([])
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [loadingLeads, setLoadingLeads] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoadingSummary(true)
    Promise.all([fetchCaptureLeads(), fetchSiteVisits()])
      .then(([leadsRes, visitsRes]) => {
        if (cancelled) return

        const items = leadsRes.items
        const totalLeads = items.length
        const hotLeads = items.filter((l) => (l.status ?? '').trim().toLowerCase() === 'hot').length

        const now = new Date()
        const contactedToday = items.filter((l: CaptureLeadDTO) => {
          const d = new Date(l.firstCallDate ?? '')
          if (Number.isNaN(d.getTime())) return false
          return isSameLocalDay(d, now)
        }).length

        const siteVisits = visitsRes.items.length
        setStats(buildDashboardStats(totalLeads, hotLeads, contactedToday, siteVisits))
      })
      .finally(() => {
        if (!cancelled) setLoadingSummary(false)
      })
    return () => {
      cancelled = true
    }
  }, [range])

  useEffect(() => {
    let cancelled = false
    setLoadingLeads(true)
    fetchCaptureLeads()
      .then((res) => {
        if (cancelled) return
        const rows = [...res.items]
          .sort((a, b) => toMs(b.created_at) - toMs(a.created_at))
          .slice(0, 5)
          .map((l): RecentLeadDTO => ({
            id: l.id,
            name: l.name ?? '—',
            contact: l.number ?? '',
            source: l.source ?? '—',
            status: asRecentLeadStatus(l.status),
            score: asRecentLeadScore(l.status),
            assignedTo: l.callBy ?? '—',
          }))
        setRecentLeads(rows)
      })
      .finally(() => {
        if (!cancelled) setLoadingLeads(false)
      })
    return () => {
      cancelled = true
    }
  }, [range])

  useEffect(() => {
    let cancelled = false
    setLoadingCharts(true)
    fetchDashboardCharts(range)
      .then((res) => {
        if (!cancelled) {
          setSalesFunnel(res.salesFunnel)
          setLeadSources(res.leadSources)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCharts(false)
      })
    return () => {
      cancelled = true
    }
  }, [range])

  const rangeBtn = (active: boolean) =>
    ['crm-range-btn', active ? 'crm-range-btn--active' : 'crm-range-btn--idle'].join(' ')

  return (
    <section className="crm-page w-full">
      <header className="crm-page-header">
        <h1 className="crm-page-title">Dashboard</h1>
        <p className="crm-page-subtitle">{dashboardSubtitle(range)}</p>
      </header>

      <div className="crm-range-group mb-6" role="tablist" aria-label="Dashboard range">
        <button
          type="button"
          className={rangeBtn(range === 'today')}
          role="tab"
          aria-selected={range === 'today'}
          onClick={() => setRange('today')}
        >
          Today
        </button>
        <button
          type="button"
          className={rangeBtn(range === 'week')}
          role="tab"
          aria-selected={range === 'week'}
          onClick={() => setRange('week')}
        >
          Week
        </button>
        <button
          type="button"
          className={rangeBtn(range === 'month')}
          role="tab"
          aria-selected={range === 'month'}
          onClick={() => setRange('month')}
        >
          Month
        </button>
      </div>

      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8"
        role="region"
        aria-label="Summary cards"
        aria-busy={loadingSummary}
      >
        {loadingSummary ? (
          <p className="col-span-full m-0 px-1 py-5 text-[13px] text-[#8B7355]">Loading summary…</p>
        ) : (
          stats.map((stat) => <DashboardStatCard key={stat.id} stat={stat} />)
        )}
      </div>

      <CanAccess moduleKey="reports" fallback={<p className="text-sm text-[#8B7355]">Analytics charts require Reports access.</p>}>
      <div className="mt-6 grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
        <section className="crm-card p-5">
          <div className="text-sm font-semibold text-[#2E2E2E]">Sales Funnel</div>
          <div className="mt-3" aria-busy={loadingCharts}>
            {loadingCharts ? (
              <p className="m-0 px-1 py-5 text-[13px] text-[#8B7355]">Loading chart…</p>
            ) : (
              <BarChart
                xAxis={[
                  {
                    id: 'funnelStages',
                    data: salesFunnel.map((p) => p.stage),
                    scaleType: 'band',
                  },
                ]}
                series={[
                  {
                    data: salesFunnel.map((p) => p.value),
                    color: '#8B7355',
                  },
                ]}
                height={280}
                margin={{ top: 20, left: 42, right: 16, bottom: 42 }}
                grid={{ horizontal: true }}
                sx={{
                  '& .MuiChartsAxis-tickLabel': { fill: '#6b7280' },
                  '& .MuiChartsAxis-line': { stroke: 'rgba(17,24,39,0.15)' },
                  '& .MuiChartsAxis-tick': { stroke: 'rgba(17,24,39,0.15)' },
                  '& .MuiChartsGrid-line': { stroke: 'rgba(17,24,39,0.08)' },
                }}
              />
            )}
          </div>
        </section>

        <section className="crm-card p-5">
          <div className="text-sm font-semibold text-[#2E2E2E]">Lead Sources</div>
          <div className="mt-3 flex items-center justify-center" aria-busy={loadingCharts}>
            {loadingCharts ? (
              <p className="m-0 px-1 py-5 text-[13px] text-[#8B7355]">Loading chart…</p>
            ) : (
              <PieChart
                height={280}
                series={[
                  {
                    data: leadSources.map((p) => ({
                      id: p.id,
                      value: p.value,
                      label: `${p.label}: ${p.value}%`,
                      color: p.color,
                    })),
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
      </CanAccess>

      <section className="crm-card mt-6 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-[#2E2E2E]">Recent Leads</div>
          <button
            type="button"
            className="text-xs font-semibold text-[#8B7355] hover:text-[#2E2E2E]"
            onClick={() => {
              navigate('/leads')
            }}
          >
            View All
          </button>
        </div>

        <div className="mt-3" aria-busy={loadingLeads}>
          {loadingLeads ? (
            <p className="m-0 px-1 py-5 text-[13px] text-[#8B7355]">Loading recent leads…</p>
          ) : (
            <RecentLeadsTable rows={recentLeads} />
          )}
        </div>
      </section>

    </section>
  )
}
