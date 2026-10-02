import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BarChart } from '@mui/x-charts/BarChart'
import { FiDollarSign, FiMessageSquare, FiPhoneIncoming, FiPhoneOutgoing } from 'react-icons/fi'

import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import { businessNumbersApi, fmtDisplayAmount, fmtMoney, toDisplayAmount, type BnAnalytics, type BnOverview } from '../../lib/businessNumbersApi'
import { StatusBadge } from './shared'
import { SyncBar } from './SyncBar'
import { useUsageSync } from './useUsageSync'

const RANGES = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: '12m', label: 'Last 12 months' },
] as const
type RangeId = (typeof RANGES)[number]['id']

function rangeDates(id: RangeId): { from: Date; to: Date } {
  const now = new Date()
  const startOfDay = (d0: Date) => new Date(d0.getFullYear(), d0.getMonth(), d0.getDate())
  switch (id) {
    case 'last_month':
      return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) }
    case '30d':
      return { from: startOfDay(new Date(now.getTime() - 29 * 864e5)), to: now }
    case '90d':
      return { from: startOfDay(new Date(now.getTime() - 89 * 864e5)), to: now }
    case '12m':
      return { from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), to: now }
    default:
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now }
  }
}

const chartSx = {
  '& .MuiChartsAxis-tickLabel': { fill: '#6b7280' },
  '& .MuiChartsAxis-line': { stroke: 'rgba(17,24,39,0.15)' },
  '& .MuiChartsAxis-tick': { stroke: 'rgba(17,24,39,0.15)' },
  '& .MuiChartsGrid-line': { stroke: 'rgba(17,24,39,0.08)' },
  '& .MuiChartsLegend-mark': { rx: 6, ry: 6 },
}

function Kpi({ label, value, note, icon, color }: { label: string; value: ReactNode; note?: ReactNode; icon: ReactNode; color: string }) {
  return (
    <article className={d.cardP5}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-sm text-[#8B7355]">{label}</p>
          <p className="text-2xl font-semibold text-[#2E2E2E]">{value}</p>
          {note ? <p className="mt-1 text-xs text-[#8B7355]">{note}</p> : null}
        </div>
        <div className="shrink-0 rounded-lg p-3" style={{ backgroundColor: `${color}20`, color }} aria-hidden>
          {icon}
        </div>
      </div>
    </article>
  )
}

/** Sums daily rows into months when the range is long, so the chart stays readable. */
function bucket(daily: BnAnalytics['daily'], byMonth: boolean) {
  if (!byMonth) return daily.map((r) => ({ ...r, label: new Date(`${r.day}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) }))
  const months = new Map<string, BnAnalytics['daily'][number] & { label: string }>()
  for (const r of daily) {
    const key = r.day.slice(0, 7)
    const m = months.get(key) ?? { day: key, rental: 0, usage: 0, calls: 0, minutes: 0, sms: 0, label: new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) }
    m.rental += r.rental
    m.usage += r.usage
    m.calls += r.calls
    m.minutes += r.minutes
    m.sms += r.sms
    months.set(key, m)
  }
  return [...months.values()]
}

export function UsageTab({ overview }: { overview: BnOverview }) {
  const { toast } = useToast()
  const [rangeId, setRangeId] = useState<RangeId>('this_month')
  const [userId, setUserId] = useState('all')
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [loaded, setLoaded] = useState<{ key: string; data: BnAnalytics | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  const manager = overview.canManage
  const { from, to } = useMemo(() => rangeDates(rangeId), [rangeId])
  const key = `${rangeId}|${userId}|${reloadTick}`

  useEffect(() => {
    if (!manager) return
    businessNumbersApi.users().then(setUsers).catch(() => setUsers([]))
  }, [manager])

  useEffect(() => {
    let cancelled = false
    businessNumbersApi
      .analytics({
        from: from.toISOString(),
        to: to.toISOString(),
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...(manager ? { userId } : {}),
      })
      .then(
        (data) => {
          if (cancelled) return
          setLoaded({ key, data })
          setError(null)
        },
        (err) => {
          if (cancelled) return
          setLoaded({ key, data: null })
          setError(getApiErrorMessage(err))
        },
      )
    return () => {
      cancelled = true
    }
  }, [from, to, userId, manager, key])

  const loading = loaded?.key !== key
  const a = loading ? null : (loaded?.data ?? null)
  const series = useMemo(() => (a ? bucket(a.daily, rangeId === '12m') : []), [a, rangeId])

  // Background refresh: the page stays usable and reloads itself when new activity lands.
  const sync = useUsageSync((s) => {
    if (s.error) return
    toast(s.stored ? `Usage updated — ${s.stored} new record${s.stored === 1 ? '' : 's'}` : 'Usage is up to date', 'success')
    setReloadTick((t) => t + 1)
  })

  const t = a?.totals
  const selectedUser = users.find((u) => u.id === userId)

  return (
    <div className={d.stack}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {RANGES.map((r) => (
            <button key={r.id} type="button" onClick={() => setRangeId(r.id)} className={r.id === rangeId ? d.rangeActive : d.rangeIdle}>
              {r.label}
            </button>
          ))}
        </div>
        {manager ? (
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${d.selectInline} min-w-[220px]`} value={userId} onChange={(e) => setUserId(e.target.value)} aria-label="User">
              <option value="all">All users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} · {u.email}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <SyncBar status={sync.status} starting={sync.starting} message={sync.message} canRefresh={manager} onRefresh={() => void sync.refresh()} what="Call & SMS activity" />

      {error ? <div className="rounded-lg border border-[#D96B6B]/40 bg-[#D96B6B]/10 px-4 py-3 text-sm text-[#9c3d3d]">{error}</div> : null}
      {manager && selectedUser ? <p className="text-sm text-[#8B7355]">Showing {selectedUser.name}'s numbers and spend.</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Total spend"
          value={loading ? '…' : fmtMoney(t?.spend ?? 0)}
          note={
            t ? (
              <>
                Rental {fmtMoney(t.rental + t.setup)} · Usage {fmtMoney(t.usage)}
              </>
            ) : undefined
          }
          icon={<FiDollarSign size={18} />}
          color="#8B7355"
        />
        <Kpi
          label="Inbound calls"
          value={loading ? '…' : (t?.voice.inboundCalls ?? 0)}
          note={t ? `${t.voice.inboundMinutes.toLocaleString()} min` : undefined}
          icon={<FiPhoneIncoming size={18} />}
          color="#6FAF8F"
        />
        <Kpi
          label="Outbound calls"
          value={loading ? '…' : (t?.voice.outboundCalls ?? 0)}
          note={
            t
              ? `${t.voice.outboundMinutes.toLocaleString()} min · ${fmtMoney(t.voice.spend)} call charges${t.sip.calls ? ` (incl. ${t.sip.calls} SIP trunk)` : ''}`
              : undefined
          }
          icon={<FiPhoneOutgoing size={18} />}
          color="#53A2D9"
        />
        <Kpi
          label="SMS"
          value={loading ? '…' : (t ? t.sms.inbound + t.sms.outbound : 0)}
          note={t ? `${t.sms.outbound} sent · ${t.sms.inbound} received · ${fmtMoney(t.sms.spend)}` : undefined}
          icon={<FiMessageSquare size={18} />}
          color="#C9A04C"
        />
      </div>

      {manager && t?.cost !== undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={d.cardP4}>
            <p className="text-sm text-[#8B7355]">Billed</p>
            <p className="text-xl font-semibold">{fmtMoney(t.spend)}</p>
          </div>
          <div className={d.cardP4}>
            <p className="text-sm text-[#8B7355]">Our cost</p>
            <p className="text-xl font-semibold">{fmtMoney(t.cost)}</p>
          </div>
          <div className={d.cardP4}>
            <p className="text-sm text-[#8B7355]">Margin</p>
            <p className={`text-xl font-semibold ${(t.margin ?? 0) < 0 ? 'text-[#D96B6B]' : 'text-[#3f8a64]'}`}>{fmtMoney(t.margin ?? 0)}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={d.cardP5}>
          <div className="text-sm font-semibold text-[#2E2E2E]">Spend</div>
          <div className="mt-3" aria-busy={loading}>
            {loading ? (
              <p className="py-5 text-[13px] text-[#8B7355]">Loading chart…</p>
            ) : (
              <BarChart
                xAxis={[{ scaleType: 'band', data: series.map((r) => r.label), height: 28 }]}
                yAxis={[{ width: 48 }]}
                series={[
                  { data: series.map((r) => toDisplayAmount(r.rental)), label: 'Rental & setup', stack: 'spend', color: '#8B7355', valueFormatter: (v) => fmtDisplayAmount(v) },
                  { data: series.map((r) => toDisplayAmount(r.usage)), label: 'Calls & SMS', stack: 'spend', color: '#C9B79C', valueFormatter: (v) => fmtDisplayAmount(v) },
                ]}
                height={280}
                grid={{ horizontal: true }}
                sx={chartSx}
              />
            )}
          </div>
        </section>
        <section className={d.cardP5}>
          <div className="text-sm font-semibold text-[#2E2E2E]">Activity</div>
          <div className="mt-3" aria-busy={loading}>
            {loading ? (
              <p className="py-5 text-[13px] text-[#8B7355]">Loading chart…</p>
            ) : (
              <BarChart
                xAxis={[{ scaleType: 'band', data: series.map((r) => r.label), height: 28 }]}
                yAxis={[{ width: 40 }]}
                series={[
                  { data: series.map((r) => r.calls), label: 'Calls', color: '#53A2D9' },
                  { data: series.map((r) => r.sms), label: 'SMS', color: '#6FAF8F' },
                ]}
                height={280}
                grid={{ horizontal: true }}
                sx={chartSx}
              />
            )}
          </div>
        </section>
      </div>

      <section className={d.cardP5}>
        <div className="mb-3 text-sm font-semibold text-[#2E2E2E]">By number</div>
        {!a?.byNumber.length ? (
          <p className="text-sm text-[#8B7355]">{loading ? 'Loading…' : 'No numbers in this period.'}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#E8DCCB]">
                  <th className="px-3 py-2 text-left text-xs font-medium text-[#8B7355]">Number</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Calls</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Minutes</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">SMS</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Rental</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Usage</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Total</th>
                  {manager ? <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Margin</th> : null}
                </tr>
              </thead>
              <tbody>
                {a.byNumber.map((n) => (
                  <tr key={n.id} className={d.trBorder}>
                    <td className="px-3 py-2 text-sm">
                      <span className="font-mono font-semibold">{n.number}</span> <StatusBadge status={n.status} />
                      {n.label ? <span className="block text-xs text-[#8B7355]">{n.label}</span> : null}
                    </td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">{n.calls}</td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">{n.minutes.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">{n.sms}</td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">{fmtMoney(n.rental)}</td>
                    <td className="px-3 py-2 text-right text-sm tabular-nums">{fmtMoney(n.usage)}</td>
                    <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums">{fmtMoney(n.total)}</td>
                    {manager ? (
                      <td className={`px-3 py-2 text-right text-sm tabular-nums ${(n.margin ?? 0) < 0 ? 'text-[#D96B6B]' : 'text-[#3f8a64]'}`}>{fmtMoney(n.margin ?? 0)}</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {manager && a?.byUser ? (
        <section className={d.cardP5}>
          <div className="mb-3 text-sm font-semibold text-[#2E2E2E]">By user</div>
          {!a.byUser.length ? (
            <p className="text-sm text-[#8B7355]">No spend in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-[#E8DCCB]">
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8B7355]">User</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Numbers</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Billed</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Our cost</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Margin</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {a.byUser.map((u) => (
                    <tr key={u.userId ?? 'unassigned'} className={d.trBorder}>
                      <td className="px-3 py-2 text-sm">
                        {u.name}
                        {u.email ? <span className="block text-xs text-[#8B7355]">{u.email}</span> : null}
                      </td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums">{u.numbers}</td>
                      <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums">{fmtMoney(u.spend)}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-[#8B7355]">{fmtMoney(u.cost)}</td>
                      <td className={`px-3 py-2 text-right text-sm tabular-nums ${u.margin < 0 ? 'text-[#D96B6B]' : 'text-[#3f8a64]'}`}>{fmtMoney(u.margin)}</td>
                      <td className="px-3 py-2 text-right">
                        {u.userId ? (
                          <button type="button" className={d.link} onClick={() => setUserId(u.userId as string)}>
                            View
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <p className="text-xs text-[#8B7355]">Rental is charged on the purchase date and each monthly anniversary while a number is held.</p>
    </div>
  )
}
