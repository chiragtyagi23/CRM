import type { ReactNode } from 'react'
import { FiAward, FiCalendar, FiMapPin, FiPhoneCall, FiTrendingDown, FiTrendingUp, FiUsers, FiZap } from 'react-icons/fi'

import type { MyStatsDTO } from '../../lib/profileApi'
import { getBuyingStageLabel } from '../../utils/uiConfig'
import { card, cardSubtitle, cardTitle } from './shared'

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short' })
}

function Tile({ icon, label, value, hint, accent }: { icon: ReactNode; label: string; value: ReactNode; hint?: ReactNode; accent: string }) {
  return (
    <div className="rounded-xl border border-[#F0E8DC] bg-[#FDFBF8] p-3.5">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#8B7355]">{label}</span>
      </div>
      <div className="mt-2 text-[24px] font-bold leading-none text-[#2E2E2E]">{value}</div>
      {hint ? <div className="mt-1.5 text-[11px] font-medium text-[#8B7355]">{hint}</div> : null}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="mt-5 grid animate-pulse grid-cols-2 gap-3 min-[640px]:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[92px] rounded-xl bg-[#F5EFE7]" />
      ))}
    </div>
  )
}

export function PerformanceCard({ stats, loading, error }: { stats: MyStatsDTO | null; loading: boolean; error: string | null }) {
  const maxMonthly = Math.max(1, ...(stats?.monthly.map((m) => m.count) ?? [0]))
  const delta = stats ? stats.leadsThisMonth - stats.leadsLastMonth : 0
  const conversion = stats && stats.totalLeads > 0 ? Math.round((stats.bookedLeads / stats.totalLeads) * 1000) / 10 : 0
  const stagesTotal = stats?.stages.reduce((s, x) => s + x.count, 0) ?? 0

  return (
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className={cardTitle}>My performance</h2>
          <p className={cardSubtitle}>Leads where you are “Lead Received By”</p>
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="mt-4 rounded-xl bg-[#FBEDED] px-4 py-3 text-[13px] font-medium text-[#D96B6B]">{error}</div>
      ) : stats ? (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 min-[640px]:grid-cols-3">
            <Tile icon={<FiUsers size={14} />} accent="bg-[#F5EFE7] text-[#8B7355]" label="Total leads" value={stats.totalLeads} hint="All time" />
            <Tile
              icon={<FiCalendar size={14} />}
              accent="bg-[#EEF3F8] text-[#4A6A8B]"
              label="This month"
              value={stats.leadsThisMonth}
              hint={
                delta === 0 ? (
                  'Same as last month'
                ) : (
                  <span className={`inline-flex items-center gap-1 ${delta > 0 ? 'text-[#5B8C5A]' : 'text-[#D96B6B]'}`}>
                    {delta > 0 ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
                    {delta > 0 ? '+' : ''}
                    {delta} vs last month
                  </span>
                )
              }
            />
            <Tile icon={<FiZap size={14} />} accent="bg-[#FBEDED] text-[#D96B6B]" label="Hot leads" value={stats.hotLeads} />
            <Tile icon={<FiMapPin size={14} />} accent="bg-[#EEF5EE] text-[#5B8C5A]" label="Site visits" value={stats.siteVisits} />
            <Tile icon={<FiAward size={14} />} accent="bg-[#FBF3E4] text-[#B08D57]" label="Booked" value={stats.bookedLeads} hint={`${conversion}% conversion`} />
            <Tile icon={<FiPhoneCall size={14} />} accent="bg-[#F3EEF8] text-[#7A5C9B]" label="Callbacks due" value={stats.upcomingCallbacks} hint="Today & upcoming" />
          </div>

          <div className="mt-6 grid gap-6 min-[900px]:grid-cols-2">
            <div>
              <div className="text-[12px] font-bold text-[#2E2E2E]">Leads — last 6 months</div>
              <div className="mt-3 flex h-36 items-end gap-2" role="img" aria-label="Monthly lead counts for the last six months">
                {stats.monthly.map((m, i) => {
                  const h = Math.round((m.count / maxMonthly) * 100)
                  const isCurrent = i === stats.monthly.length - 1
                  return (
                    <div key={m.month} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                      <span className="text-[11px] font-semibold text-[#2E2E2E] opacity-70 group-hover:opacity-100">{m.count}</span>
                      <div
                        className={`w-full max-w-[40px] rounded-t-md transition-all duration-700 ${isCurrent ? 'bg-[#8B7355]' : 'bg-[#E8DCCB] group-hover:bg-[#CDB89C]'}`}
                        style={{ height: `${Math.max(h, m.count > 0 ? 6 : 2)}%` }}
                        title={`${monthLabel(m.month)}: ${m.count} leads`}
                      />
                      <span className={`text-[11px] ${isCurrent ? 'font-bold text-[#2E2E2E]' : 'text-[#8B7355]'}`}>{monthLabel(m.month)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold text-[#2E2E2E]">Pipeline by buying stage</div>
              {stagesTotal === 0 ? (
                <div className="mt-3 flex h-36 items-center justify-center rounded-xl border border-dashed border-[#E8DCCB] text-[12px] text-[#8B7355]">
                  No leads yet — capture your first one!
                </div>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {stats.stages.slice(0, 6).map((s) => {
                    const pct = Math.round((s.count / stagesTotal) * 100)
                    return (
                      <li key={s.stage}>
                        <div className="flex justify-between text-[12px]">
                          <span className="font-medium text-[#2E2E2E]">{s.stage === 'UNKNOWN' ? 'Not set' : getBuyingStageLabel(s.stage)}</span>
                          <span className="text-[#8B7355]">
                            {s.count} · {pct}%
                          </span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#F5EFE7]">
                          <div
                            className={`h-full rounded-full ${s.stage === 'BOOKED' ? 'bg-[#5B8C5A]' : s.stage === 'LOST' ? 'bg-[#D96B6B]' : 'bg-[#8B7355]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  )
}
