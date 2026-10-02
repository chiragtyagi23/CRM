import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { FiArrowDownLeft, FiArrowUpRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi'

import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { SyncBar } from './SyncBar'
import { useUsageSync } from './useUsageSync'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import {
  businessNumbersApi,
  fmtMoney,
  fmtDuration,
  type BnOverview,
  type SipCall,
  type SipCallPage,
} from '../../lib/businessNumbersApi'

const PAGE_SIZE = 20
const PRESETS = [
  { id: '24h', label: 'Last 24 hours', days: 1 },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: 'custom', label: 'Custom', days: 0 },
] as const
type PresetId = (typeof PRESETS)[number]['id']

/** Who ended the call, per log type (values come from the API, already provider-neutral). */
const SOURCES: Record<'voice' | 'sip', { value: string; label: string }[]> = {
  voice: [
    { value: 'caller', label: 'Caller' },
    { value: 'callee', label: 'Callee' },
    { value: 'carrier', label: 'Carrier' },
    { value: 'platform', label: 'Network' },
  ],
  sip: [
    { value: 'customer', label: 'Your side' },
    { value: 'carrier', label: 'Carrier' },
    { value: 'platform', label: 'Network' },
  ],
}

function sourceLabel(kind: 'voice' | 'sip', value: string | null) {
  if (!value) return '—'
  return SOURCES[kind].find((s) => s.value === value)?.label ?? value
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function fmtStamp(iso: string | null) {
  return iso ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'
}

function Direction({ value }: { value: SipCall['direction'] }) {
  return value === 'inbound' ? (
    <span className="inline-flex items-center gap-1 text-[#3f8a64]">
      <FiArrowDownLeft size={14} aria-hidden /> In
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[#2f7bb5]">
      <FiArrowUpRight size={14} aria-hidden /> Out
    </span>
  )
}

function StatusCell({ call }: { call: SipCall }) {
  return (
    <span>
      <span className={call.status === 'answered' ? d.badgeWon : d.badgeHot}>{call.status === 'answered' ? 'Answered' : 'Not answered'}</span>
      {call.hangupCause ? <span className="mt-0.5 block text-xs text-[#8B7355]">{call.hangupCause}</span> : null}
    </span>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#F5EFE7] py-2 text-sm last:border-0">
      <dt className="text-[#8B7355]">{label}</dt>
      <dd className="text-right font-medium text-[#2E2E2E]">{children}</dd>
    </div>
  )
}

const yesNo = (v: boolean | null | undefined) => (v === null || v === undefined ? '—' : v ? 'Yes' : 'No')

/** Voice or SIP trunk call log, with the same filters, paging and background refresh. */
export function CallLogsTab({ overview, kind }: { overview: BnOverview; kind: 'voice' | 'sip' }) {
  const { toast } = useToast()
  const manager = overview.canManage
  const [preset, setPreset] = useState<PresetId>('7d')
  const [customFrom, setCustomFrom] = useState(() => toDateInput(new Date(Date.now() - 7 * 864e5)))
  const [customTo, setCustomTo] = useState(() => toDateInput(new Date()))
  const [direction, setDirection] = useState('')
  const [status, setStatus] = useState('')
  const [hangupSource, setHangupSource] = useState('')
  const [q, setQ] = useState('')
  const [userId, setUserId] = useState('all')
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [offset, setOffset] = useState(0)
  const [reloadTick, setReloadTick] = useState(0)
  const [loaded, setLoaded] = useState<{ key: string; page: SipCallPage | null } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<SipCall | null>(null)

  const { from, to } = useMemo(() => {
    if (preset === 'custom') {
      return { from: new Date(`${customFrom}T00:00:00`), to: new Date(`${customTo}T23:59:59`) }
    }
    const days = PRESETS.find((p) => p.id === preset)?.days ?? 7
    const end = new Date()
    return { from: new Date(end.getTime() - days * 864e5), to: end }
    // reloadTick re-anchors "now" for presets on refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customFrom, customTo, reloadTick])

  const filterKey = [preset, customFrom, customTo, direction, status, hangupSource, q, userId].join('|')
  const key = `${filterKey}|${offset}|${reloadTick}`

  useEffect(() => {
    if (!manager) return
    businessNumbersApi.users().then(setUsers).catch(() => setUsers([]))
  }, [manager])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      businessNumbersApi
        .callLogs(kind, {
          from: from.toISOString(),
          to: to.toISOString(),
          direction: direction || undefined,
          status: status || undefined,
          hangupSource: hangupSource || undefined,
          q: q.trim() || undefined,
          ...(manager ? { userId } : {}),
          limit: PAGE_SIZE,
          offset,
        })
        .then(
          (page) => {
            if (cancelled) return
            setLoaded({ key, page })
            setError(null)
          },
          (err) => {
            if (cancelled) return
            setLoaded({ key, page: null })
            setError(getApiErrorMessage(err))
          },
        )
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [key, kind, from, to, direction, status, hangupSource, q, manager, userId, offset])

  /** Filters change → back to the first page. */
  const change = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v)
    setOffset(0)
  }

  const loading = loaded?.key !== key
  const page = loading ? null : (loaded?.page ?? null)
  const items = page?.items ?? []
  const total = page?.total ?? 0

  // Background refresh: filters and paging stay usable; the list reloads when new calls land.
  const sync = useUsageSync((s) => {
    if (s.error) return
    toast('Call logs updated', 'success')
    setReloadTick((t) => t + 1)
  })

  const isVoice = kind === 'voice'
  // Ended, Direction, From, To, Duration, Status, Ended by (+ caller ID for voice, + User for managers)
  const colSpan = 7 + (isVoice ? 1 : 0) + (manager ? 1 : 0)

  return (
    <div className={d.stack}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" onClick={() => change(setPreset)(p.id)} className={p.id === preset ? d.rangeActive : d.rangeIdle}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <SyncBar status={sync.status} starting={sync.starting} message={sync.message} canRefresh={manager} onRefresh={() => void sync.refresh()} what="Call logs" />

      <div className="flex flex-wrap gap-2">
        {preset === 'custom' ? (
          <>
            <input type="date" className={`${d.selectInline}`} value={customFrom} max={customTo} onChange={(e) => change(setCustomFrom)(e.target.value)} aria-label="From date" />
            <input type="date" className={`${d.selectInline}`} value={customTo} min={customFrom} onChange={(e) => change(setCustomTo)(e.target.value)} aria-label="To date" />
          </>
        ) : null}
        <input className={`${d.input} w-full sm:w-56`} value={q} onChange={(e) => change(setQ)(e.target.value)} placeholder="Search number…" aria-label="Search number" inputMode="tel" />
        <select className={d.selectInline} value={direction} onChange={(e) => change(setDirection)(e.target.value)} aria-label="Direction">
          <option value="">Both directions</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
        <select className={d.selectInline} value={status} onChange={(e) => change(setStatus)(e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          <option value="answered">Answered</option>
          <option value="unanswered">Not answered</option>
        </select>
        <select className={d.selectInline} value={hangupSource} onChange={(e) => change(setHangupSource)(e.target.value)} aria-label="Ended by">
          <option value="">Ended by anyone</option>
          {SOURCES[kind].map((s) => (
            <option key={s.value} value={s.value}>
              Ended by {s.label.toLowerCase()}
            </option>
          ))}
        </select>
        {manager ? (
          <select className={`${d.selectInline} min-w-[200px]`} value={userId} onChange={(e) => change(setUserId)(e.target.value)} aria-label="User">
            <option value="all">All users</option>
            <option value="unattributed">Not on a user's number</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {error ? <div className="rounded-lg border border-[#D96B6B]/40 bg-[#D96B6B]/10 px-4 py-3 text-sm text-[#9c3d3d]">{error}</div> : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className={d.cardP4}>
          <p className="text-sm text-[#8B7355]">Calls</p>
          <p className="text-2xl font-semibold">{loading ? '…' : (page?.summary.calls ?? 0)}</p>
        </div>
        <div className={d.cardP4}>
          <p className="text-sm text-[#8B7355]">Answered</p>
          <p className="text-2xl font-semibold">{loading ? '…' : (page?.summary.answered ?? 0)}</p>
          {page?.summary.calls ? (
            <p className="text-xs font-medium text-[#6FAF8F]">{Math.round((page.summary.answered / page.summary.calls) * 100)}% answer rate</p>
          ) : null}
        </div>
        <div className={d.cardP4}>
          <p className="text-sm text-[#8B7355]">Billed minutes</p>
          <p className="text-2xl font-semibold">{loading ? '…' : (page?.summary.minutes ?? 0).toLocaleString()}</p>
        </div>
        <div className={d.cardP4}>
          <p className="text-sm text-[#8B7355]">Charges</p>
          <p className="text-2xl font-semibold">{loading ? '…' : fmtMoney(page?.summary.spend ?? 0)}</p>
          {manager && page?.summary.cost !== undefined ? <p className="text-xs text-[#8B7355]">our cost {fmtMoney(page.summary.cost)}</p> : null}
        </div>
      </div>

      <div className={d.tableWrap}>
        <table className="w-full min-w-[920px]">
          <thead>
            <tr className="border-b border-[#E8DCCB]">
              <th className={d.th}>Ended</th>
              <th className={d.th}>Direction</th>
              <th className={d.th}>From</th>
              <th className={d.th}>To</th>
              <th className={d.th}>Duration</th>
              <th className={d.th}>Status</th>
              <th className={d.th}>Ended by</th>
              {isVoice ? <th className={d.th}>Caller ID verification</th> : null}
              {manager ? <th className={d.th}>User</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading && !items.length ? (
              <tr>
                <td className={d.td} colSpan={colSpan}>Loading…</td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td className={d.td} colSpan={colSpan}>
                  No {isVoice ? 'calls' : 'SIP trunk calls'} match these filters.
                </td>
              </tr>
            ) : (
              items.map((c) => (
                <tr key={c.id} className={`${d.trBorder} cursor-pointer hover:bg-[#FAF7F2]`} onClick={() => setSelected(c)}>
                  <td className={`${d.td} whitespace-nowrap text-[#8B7355]`}>{fmtStamp(c.endedAt)}</td>
                  <td className={d.td}><Direction value={c.direction} /></td>
                  <td className={`${d.td} font-mono text-xs`}>{c.from ?? '—'}</td>
                  <td className={`${d.td} font-mono text-xs`}>{c.to ?? '—'}</td>
                  <td className={`${d.td} tabular-nums`}>{fmtDuration(c.duration)}</td>
                  <td className={d.td}><StatusCell call={c} /></td>
                  <td className={d.td}>{sourceLabel(kind, c.hangupSource)}</td>
                  {isVoice ? <td className={`${d.td} text-[#8B7355]`}>{c.stirVerification ?? '—'}</td> : null}
                  {manager ? <td className={d.td}>{c.owner?.name ?? <span className="text-[#8B7355]">—</span>}</td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm text-[#8B7355]">
          <span>
            {offset + 1}–{Math.min(total, offset + PAGE_SIZE)} of {total.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <button type="button" className={d.btnSecondarySm} disabled={offset === 0 || loading} onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}>
              <FiChevronLeft size={14} aria-hidden /> Previous
            </button>
            <button type="button" className={d.btnSecondarySm} disabled={offset + PAGE_SIZE >= total || loading} onClick={() => setOffset((o) => o + PAGE_SIZE)}>
              Next <FiChevronRight size={14} aria-hidden />
            </button>
          </div>
        </div>
      ) : null}

      <Modal open={Boolean(selected)} title="Call details" onClose={() => setSelected(null)} wide>
        {selected ? (
          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            <dl>
              <Row label="Direction"><Direction value={selected.direction} /></Row>
              <Row label="From"><span className="break-all">{selected.from ?? '—'}</span>{selected.fromCountry ? ` · ${selected.fromCountry}` : ''}</Row>
              <Row label="To"><span className="break-all">{selected.to ?? '—'}</span>{selected.toCountry ? ` · ${selected.toCountry}` : ''}</Row>
              <Row label="Your number">
                {selected.businessNumber ? (
                  <>
                    {selected.businessNumber.number}
                    {selected.businessNumber.label ? <span className="block text-xs font-normal text-[#8B7355]">{selected.businessNumber.label}</span> : null}
                  </>
                ) : (
                  '—'
                )}
              </Row>
              {manager ? <Row label="User">{selected.owner ? `${selected.owner.name} · ${selected.owner.email}` : 'Not on a user\'s number'}</Row> : null}
              {!isVoice ? <Row label="Trunk">{selected.trunk ?? '—'}</Row> : null}
              <Row label="Call ID"><span className="font-mono text-xs">{selected.callId}</span></Row>
            </dl>
            <dl>
              <Row label="Started">{fmtStamp(selected.startedAt)}</Row>
              <Row label="Answered">{fmtStamp(selected.answeredAt)}</Row>
              <Row label="Ended">{fmtStamp(selected.endedAt)}</Row>
              <Row label="Duration">{fmtDuration(selected.duration)} <span className="text-xs font-normal text-[#8B7355]">(billed {fmtDuration(selected.billedDuration)})</span></Row>
              <Row label="Result"><StatusCell call={selected} /></Row>
              <Row label="Ended by">{sourceLabel(kind, selected.hangupSource)}{selected.hangupCode !== null ? ` · code ${selected.hangupCode}` : ''}</Row>
              {!isVoice ? (
                <>
                  <Row label="Transport">{selected.transport ?? '—'}</Row>
                  <Row label="Encrypted media (SRTP)">{yesNo(selected.srtp)}</Row>
                  <Row label="Secure trunking">{yesNo(selected.secureTrunking)}</Row>
                </>
              ) : null}
              <Row label="Caller ID verification">{[selected.stirVerification, selected.attestation].filter(Boolean).join(' · ') || '—'}</Row>
              <Row label="Charge">{fmtMoney(selected.price)}{manager && selected.cost !== undefined ? <span className="block text-xs font-normal text-[#8B7355]">our cost {fmtMoney(selected.cost)}</span> : null}</Row>
            </dl>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
