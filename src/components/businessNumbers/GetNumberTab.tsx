import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'

import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import {
  businessNumbersApi,
  fmtLocation,
  fmtMoney,
  NUMBER_TYPE_LABEL,
  type AvailableNumber,
  type BnOverview,
  type BnSearchQuery,
} from '../../lib/businessNumbersApi'
import { Capabilities } from './shared'

const SERVICES = [
  { value: '', label: 'Voice or SMS' },
  { value: 'voice', label: 'Voice' },
  { value: 'sms', label: 'SMS' },
  { value: 'voice,sms', label: 'Voice and SMS' },
]

export function GetNumberTab({ overview, onPurchased }: { overview: BnOverview; onPurchased: () => void }) {
  const { toast } = useToast()
  const [countryIso, setCountryIso] = useState(overview.countries[0]?.iso ?? 'IN')
  const [type, setType] = useState('')
  const [contains, setContains] = useState('')
  const [city, setCity] = useState('')
  const [services, setServices] = useState('')
  const [results, setResults] = useState<AvailableNumber[] | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [choice, setChoice] = useState<AvailableNumber | null>(null)
  const [label, setLabel] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [buying, setBuying] = useState(false)

  const atLimit = overview.limit !== null && overview.used >= overview.limit

  const runSearch = async (offset = 0) => {
    setSearching(true)
    setError(null)
    const q: BnSearchQuery = {
      countryIso,
      type: type || undefined,
      contains: contains.trim() || undefined,
      city: type === 'local' ? city.trim() || undefined : undefined,
      services: services || undefined,
      offset,
    }
    try {
      const r = await businessNumbersApi.search(q)
      setResults((prev) => (offset && prev ? [...prev, ...r.items] : r.items))
      setHasMore(r.hasMore)
      setNextOffset(r.nextOffset)
    } catch (err) {
      setError(getApiErrorMessage(err))
      if (!offset) setResults([])
    } finally {
      setSearching(false)
    }
  }

  const openBuy = (n: AvailableNumber) => {
    setChoice(n)
    setLabel('')
    setAgreed(false)
  }

  const buy = async () => {
    if (!choice) return
    setBuying(true)
    try {
      const bought = await businessNumbersApi.purchase({ number: choice.number, label: label.trim() || undefined })
      toast(bought.status === 'pending' ? `${bought.number} is being activated` : `${bought.number} is yours`, 'success')
      setChoice(null)
      setResults((prev) => prev?.filter((n) => n.number !== choice.number) ?? null)
      onPurchased()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
      // Expired offers / taken numbers: refresh the list so stale entries disappear.
      if ((err as { response?: { status?: number } })?.response?.status === 409) void runSearch(0)
      setChoice(null)
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className={d.stack}>
      {atLimit ? (
        <div className="rounded-lg border border-[#F2C94C]/60 bg-[#F2C94C]/15 px-4 py-3 text-sm text-[#6b5500]">
          You're using all {overview.limit} of your numbers. Release one to get another, or contact support to raise your limit.
        </div>
      ) : null}

      <form
        className={`${d.cardP5} grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]`}
        onSubmit={(e) => {
          e.preventDefault()
          void runSearch(0)
        }}
      >
        <label className="block">
          <span className={d.label}>Country</span>
          <select className={d.select} value={countryIso} onChange={(e) => setCountryIso(e.target.value)}>
            {overview.countries.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={d.label}>Type</span>
          <select className={d.select} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Any type</option>
            {overview.types.map((t) => (
              <option key={t} value={t}>
                {NUMBER_TYPE_LABEL[t] ?? t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={d.label}>Contains digits</span>
          <input className={d.input} value={contains} onChange={(e) => setContains(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="e.g. 7777" inputMode="numeric" />
        </label>
        {type === 'local' ? (
          <label className="block">
            <span className={d.label}>City</span>
            <input className={d.input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Any city" />
          </label>
        ) : (
          <label className="block">
            <span className={d.label}>Features</span>
            <select className={d.select} value={services} onChange={(e) => setServices(e.target.value)}>
              {SERVICES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-end">
          <button type="submit" className={`${d.btnPrimarySm} w-full lg:w-auto`} disabled={searching || !overview.available}>
            <FiSearch size={14} aria-hidden /> {searching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {error ? <div className="rounded-lg border border-[#D96B6B]/40 bg-[#D96B6B]/10 px-4 py-3 text-sm text-[#9c3d3d]">{error}</div> : null}

      {results === null ? (
        <p className="text-sm text-[#8B7355]">Choose what you're looking for and search to see available numbers and their prices.</p>
      ) : !results.length && !searching ? (
        <p className="text-sm text-[#8B7355]">No numbers match. Try another type, fewer digits, or a different city.</p>
      ) : (
        <div className={d.tableWrap}>
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-[#E8DCCB]">
                <th className={d.th}>Number</th>
                <th className={d.th}>Location</th>
                <th className={d.th}>Type</th>
                <th className={d.th}>Features</th>
                <th className={d.th}>Monthly</th>
                <th className={d.th}>One-time setup</th>
                <th className={`${d.th} text-right`} />
              </tr>
            </thead>
            <tbody>
              {results.map((n) => (
                <tr key={n.number} className={`${d.trBorder} hover:bg-[#FAF7F2]`}>
                  <td className={`${d.td} font-mono font-semibold`}>{n.number}</td>
                  <td className={`${d.td} text-[#8B7355]`}>{fmtLocation(n)}</td>
                  <td className={d.td}>{NUMBER_TYPE_LABEL[n.type ?? ''] ?? n.type ?? '—'}</td>
                  <td className={d.td}><Capabilities voice={n.voiceEnabled} sms={n.smsEnabled} /></td>
                  <td className={d.td}>{fmtMoney(n.monthlyPrice, n.currency)}</td>
                  <td className={d.td}>{n.setupPrice ? fmtMoney(n.setupPrice, n.currency) : 'Free'}</td>
                  <td className={`${d.td} text-right`}>
                    <button type="button" className={d.btnPrimarySm} disabled={atLimit} onClick={() => openBuy(n)}>
                      Get number
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hasMore && results?.length ? (
        <div className="flex justify-center">
          <button type="button" className={d.btnSecondarySm} onClick={() => void runSearch(nextOffset)} disabled={searching}>
            {searching ? 'Loading…' : 'Show more numbers'}
          </button>
        </div>
      ) : null}

      <Modal
        open={Boolean(choice)}
        title="Confirm your new number"
        onClose={() => !buying && setChoice(null)}
        footer={
          <>
            <button type="button" className="acl-btn acl-btn--ghost" onClick={() => setChoice(null)} disabled={buying}>
              Cancel
            </button>
            <button type="button" className="acl-btn acl-btn--primary" onClick={buy} disabled={buying || !agreed}>
              {buying ? 'Getting number…' : 'Get number'}
            </button>
          </>
        }
      >
        {choice ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#FAF7F2] p-4">
              <p className="font-mono text-xl font-semibold text-[#2E2E2E]">{choice.number}</p>
              <p className="text-sm text-[#8B7355]">
                {fmtLocation(choice)} · {NUMBER_TYPE_LABEL[choice.type ?? ''] ?? choice.type}
              </p>
              <div className="mt-2"><Capabilities voice={choice.voiceEnabled} sms={choice.smsEnabled} /></div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[#8B7355]">Monthly</dt>
                <dd className="text-lg font-semibold text-[#2E2E2E]">{fmtMoney(choice.monthlyPrice, choice.currency)}</dd>
              </div>
              <div>
                <dt className="text-[#8B7355]">One-time setup</dt>
                <dd className="text-lg font-semibold text-[#2E2E2E]">{choice.setupPrice ? fmtMoney(choice.setupPrice, choice.currency) : 'Free'}</dd>
              </div>
            </dl>
            <label className="block">
              <span className={d.label}>Label (optional)</span>
              <input className={d.input} value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} placeholder="e.g. Sales line" />
            </label>
            <label className="flex items-start gap-2 text-sm text-[#2E2E2E]">
              <input type="checkbox" className="mt-1" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                I agree to be billed {fmtMoney(choice.monthlyPrice, choice.currency)} per month
                {choice.setupPrice ? ` plus a one-time ${fmtMoney(choice.setupPrice, choice.currency)} setup fee` : ''} until I release this number.
              </span>
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
