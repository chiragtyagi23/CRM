import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { LineChart } from '@mui/x-charts/LineChart'
import { FiAlertTriangle, FiCheckCircle, FiEye, FiInbox, FiMessageSquare, FiSend } from 'react-icons/fi'

import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import { whatsappApi, type WaMetaAnalytics, type WaStats, type WaStatus } from '../../lib/whatsappApi'
import { Notice, QualityBadge } from './shared'
import { pct, toDateInput } from './format'

const RANGES = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
] as const

const chartSx = {
  '& .MuiChartsAxis-tickLabel': { fill: '#6b7280' },
  '& .MuiChartsAxis-line': { stroke: 'rgba(17,24,39,0.15)' },
  '& .MuiChartsAxis-tick': { stroke: 'rgba(17,24,39,0.15)' },
  '& .MuiChartsGrid-line': { stroke: 'rgba(17,24,39,0.08)' },
  '& .MuiChartsLegend-mark': { rx: 6, ry: 6 },
}

function Kpi({ label, value, note, icon, color }: { label: string; value: ReactNode; note?: string; icon: ReactNode; color: string }) {
  return (
    <article className={d.cardP5}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-sm text-[#8B7355]">{label}</p>
          <p className="text-3xl font-semibold text-[#2E2E2E]">{value}</p>
          {note ? <p className="mt-1 text-xs font-medium text-[#6FAF8F]">{note}</p> : null}
        </div>
        <div className="shrink-0 rounded-lg p-3" style={{ backgroundColor: `${color}20`, color }} aria-hidden>
          {icon}
        </div>
      </div>
    </article>
  )
}

/** Every day in [from, to] so the chart has no gaps on quiet days. */
function fillDays<T extends { day: string }>(rows: T[], from: Date, to: Date, empty: Omit<T, 'day'>): T[] {
  const byDay = new Map(rows.map((r) => [r.day, r]))
  const out: T[] = []
  for (let t = new Date(from); t <= to; t = new Date(t.getTime() + 86400000)) {
    const key = toDateInput(t)
    out.push(byDay.get(key) ?? ({ day: key, ...empty } as T))
  }
  return out
}

export function OverviewTab({ status }: { status: WaStatus | null }) {
  const [rangeId, setRangeId] = useState<(typeof RANGES)[number]['id']>('30d')
  /** Stats plus the range they were loaded for; loading = they don't match the selected range. */
  const [loaded, setLoaded] = useState<{ rangeId: string; stats: WaStats | null } | null>(null)
  const [meta, setMeta] = useState<WaMetaAnalytics | null>(null)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { from, to } = useMemo(() => {
    const days = RANGES.find((r) => r.id === rangeId)?.days ?? 30
    const end = new Date()
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (days - 1))
    return { from: start, to: end }
  }, [rangeId])

  useEffect(() => {
    let cancelled = false
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    whatsappApi.stats({ from: from.toISOString(), to: to.toISOString(), tz }).then(
      (s) => {
        if (cancelled) return
        setLoaded({ rangeId, stats: s })
        setError(null)
      },
      (err) => {
        if (cancelled) return
        setLoaded({ rangeId, stats: null })
        setError(getApiErrorMessage(err))
      },
    )
    return () => {
      cancelled = true
    }
  }, [from, to, rangeId])

  const loading = loaded?.rangeId !== rangeId
  const stats = loading ? null : (loaded?.stats ?? null)

  useEffect(() => {
    if (!status?.configured) return
    let cancelled = false
    whatsappApi
      .metaAnalytics({ from: from.toISOString(), to: to.toISOString() })
      .then((m) => {
        if (cancelled) return
        setMeta(m)
        setMetaError(null)
      })
      .catch((err) => !cancelled && setMetaError(getApiErrorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [status?.configured, from, to])

  const daily = useMemo(
    () => fillDays(stats?.daily ?? [], from, to, { sent: 0, delivered: 0, read: 0, failed: 0, received: 0 }),
    [stats, from, to],
  )

  const t = stats?.totals
  const attempted = (t?.sent ?? 0) + (t?.failed ?? 0)
  const tplStatus = stats?.templatesByStatus ?? {}

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
        {status?.phone ? (
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#8B7355]">
            <span>
              Quality: <QualityBadge score={status.phone.quality_rating} />
            </span>
            <span>
              Limit: <strong className="text-[#2E2E2E]">{status.phone.messaging_limit_tier?.replace('TIER_', '') ?? '—'}</strong>
              <span className="text-xs"> / 24h</span>
            </span>
          </div>
        ) : null}
      </div>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Messages sent" value={loading ? '…' : (t?.sent ?? 0)} note={`${attempted} attempted`} icon={<FiSend size={18} />} color="#8B7355" />
        <Kpi label="Delivered" value={loading ? '…' : (t?.delivered ?? 0)} note={`${pct(t?.delivered ?? 0, t?.sent ?? 0)} of sent`} icon={<FiCheckCircle size={18} />} color="#6FAF8F" />
        <Kpi label="Read" value={loading ? '…' : (t?.read ?? 0)} note={`${pct(t?.read ?? 0, t?.delivered ?? 0)} of delivered`} icon={<FiEye size={18} />} color="#53A2D9" />
        <Kpi label="Failed" value={loading ? '…' : (t?.failed ?? 0)} note={`${pct(t?.failed ?? 0, attempted)} failure rate`} icon={<FiAlertTriangle size={18} />} color="#D96B6B" />
        <Kpi label="Received" value={loading ? '…' : (t?.received ?? 0)} note={`from ${t?.contacts ?? 0} contacts`} icon={<FiInbox size={18} />} color="#8B7355" />
      </div>

      <section className={d.cardP5}>
        <div className="text-sm font-semibold text-[#2E2E2E]">Message activity</div>
        <div className="mt-3" aria-busy={loading}>
          {loading ? (
            <p className="m-0 px-1 py-5 text-[13px] text-[#8B7355]">Loading chart…</p>
          ) : (
            <LineChart
              series={[
                { data: daily.map((p) => p.sent), label: 'Sent', color: '#8B7355' },
                { data: daily.map((p) => p.delivered), label: 'Delivered', color: '#6FAF8F' },
                { data: daily.map((p) => p.read), label: 'Read', color: '#53A2D9' },
                { data: daily.map((p) => p.failed), label: 'Failed', color: '#D96B6B' },
                { data: daily.map((p) => p.received), label: 'Received', color: '#C9B79C' },
              ]}
              xAxis={[
                {
                  scaleType: 'point',
                  data: daily.map((p) => new Date(`${p.day}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
                  height: 28,
                },
              ]}
              yAxis={[{ width: 44 }]}
              height={300}
              grid={{ horizontal: true }}
              sx={chartSx}
            />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className={`${d.cardP5} lg:col-span-2`}>
          <div className="mb-3 text-sm font-semibold text-[#2E2E2E]">Template performance</div>
          {stats?.byTemplate.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-[#E8DCCB]">
                    <th className="px-3 py-2 text-left text-xs font-medium text-[#8B7355]">Template</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Sent</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Delivered</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Read</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-[#8B7355]">Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byTemplate.map((row) => (
                    <tr key={`${row.template_name}-${row.template_language}`} className={d.trBorder}>
                      <td className="px-3 py-2 text-sm text-[#2E2E2E]">
                        <span className="font-medium">{row.template_name}</span>{' '}
                        <span className="text-xs text-[#8B7355]">{row.template_language}</span>
                      </td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums">{row.sent}</td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums">
                        {row.delivered} <span className="text-xs text-[#8B7355]">({pct(row.delivered, row.sent)})</span>
                      </td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums">
                        {row.read} <span className="text-xs text-[#8B7355]">({pct(row.read, row.delivered)})</span>
                      </td>
                      <td className="px-3 py-2 text-right text-sm tabular-nums text-[#D96B6B]">{row.failed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#8B7355]">{loading ? 'Loading…' : 'No template messages sent in this range.'}</p>
          )}
        </section>

        <div className={d.stack}>
          <section className={d.cardP5}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#2E2E2E]">
              <FiMessageSquare size={15} className="text-[#8B7355]" aria-hidden /> Conversations
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[#8B7355]">Total contacts</dt><dd className="text-xl font-semibold">{stats?.conversations.total ?? 0}</dd></div>
              <div><dt className="text-[#8B7355]">Open 24h windows</dt><dd className="text-xl font-semibold">{stats?.conversations.open_windows ?? 0}</dd></div>
              <div><dt className="text-[#8B7355]">Unread</dt><dd className="text-xl font-semibold">{stats?.conversations.unread ?? 0}</dd></div>
              <div><dt className="text-[#8B7355]">Opted out</dt><dd className="text-xl font-semibold">{stats?.conversations.opted_out ?? 0}</dd></div>
            </dl>
          </section>

          <section className={d.cardP5}>
            <div className="mb-3 text-sm font-semibold text-[#2E2E2E]">Templates</div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {['APPROVED', 'PENDING', 'REJECTED', 'PAUSED'].map((s) => (
                <div key={s}>
                  <dt className="capitalize text-[#8B7355]">{s.toLowerCase()}</dt>
                  <dd className="text-xl font-semibold">{tplStatus[s] ?? 0}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={d.cardP5}>
          <div className="mb-3 text-sm font-semibold text-[#2E2E2E]">Top failure reasons</div>
          {stats?.failures.length ? (
            <ul className="space-y-2">
              {stats.failures.map((f) => (
                <li key={`${f.code}-${f.reason}`} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-[#2E2E2E]">
                    {f.reason} <span className="text-xs text-[#8B7355]">#{f.code}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-[#D96B6B]">{f.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#8B7355]">No failures in this range.</p>
          )}
        </section>

        <section className={d.cardP5}>
          <div className="mb-1 text-sm font-semibold text-[#2E2E2E]">Meta-reported totals</div>
          <p className="mb-3 text-xs text-[#8B7355]">
            Counts from WhatsApp Manager for the whole business account, including messages sent outside this CRM.
          </p>
          {!status?.configured ? (
            <p className="text-sm text-[#8B7355]">Connect the Cloud API to see Meta analytics.</p>
          ) : metaError ? (
            <Notice tone="error">{metaError}</Notice>
          ) : meta ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[#8B7355]">Sent</dt><dd className="text-2xl font-semibold">{meta.totals.sent}</dd></div>
              <div>
                <dt className="text-[#8B7355]">Delivered</dt>
                <dd className="text-2xl font-semibold">
                  {meta.totals.delivered} <span className="text-xs font-medium text-[#6FAF8F]">{pct(meta.totals.delivered, meta.totals.sent)}</span>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-[#8B7355]">Loading…</p>
          )}
        </section>
      </div>
    </div>
  )
}
