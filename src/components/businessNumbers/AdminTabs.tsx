import { useCallback, useEffect, useState } from 'react'
import { FiRefreshCw, FiTrash2, FiUserCheck } from 'react-icons/fi'

import { ConfirmModal } from '../acl/ConfirmModal'
import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import {
  businessNumbersApi,
  fmtLocation,
  fmtMoney,
  NUMBER_TYPE_LABEL,
  type BnOverview,
  type BnUnassigned,
  type BusinessNumberAdmin,
} from '../../lib/businessNumbersApi'
import { Capabilities, StatusBadge } from './shared'

type User = { id: string; name: string; email: string }

function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
    businessNumbersApi
      .users()
      .then(setUsers)
      .catch(() => setUsers([]))
  }, [])
  return users
}

function UserSelect({ users, value, onChange }: { users: User[]; value: string; onChange: (id: string) => void }) {
  return (
    <select className={d.select} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select a user…</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name} · {u.email}
        </option>
      ))}
    </select>
  )
}

const errorBox = 'rounded-lg border border-[#D96B6B]/40 bg-[#D96B6B]/10 px-4 py-3 text-sm text-[#9c3d3d]'

export function AllNumbersTab({ onChanged }: { onChanged: () => void }) {
  const { toast } = useToast()
  const users = useUsers()
  const [items, setItems] = useState<BusinessNumberAdmin[]>([])
  const [status, setStatus] = useState('active')
  const [ownerId, setOwnerId] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reassigning, setReassigning] = useState<BusinessNumberAdmin | null>(null)
  const [newOwner, setNewOwner] = useState('')
  const [releasing, setReleasing] = useState<BusinessNumberAdmin | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    () =>
      businessNumbersApi
        .all({ status, ownerId: ownerId || undefined, q: q || undefined })
        .then((r) => {
          setItems(r)
          setError(null)
        })
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => setLoading(false)),
    [status, ownerId, q],
  )

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(t)
  }, [load])

  const active = items.filter((n) => n.status !== 'released')
  const revenue = active.reduce((s, n) => s + (n.monthlyPrice ?? 0), 0)
  const cost = active.reduce((s, n) => s + (n.monthlyCost ?? 0), 0)

  const doReassign = async () => {
    if (!reassigning || !newOwner) return
    setBusy(true)
    try {
      await businessNumbersApi.assign(reassigning.id, newOwner)
      toast('Number reassigned', 'success')
      setReassigning(null)
      void load()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const doRelease = async () => {
    if (!releasing) return
    setBusy(true)
    try {
      await businessNumbersApi.release(releasing.id)
      toast(`${releasing.number} released`, 'success')
      setReleasing(null)
      void load()
      onChanged()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={d.stack}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={d.cardP4}>
          <p className="text-sm text-[#8B7355]">Active numbers</p>
          <p className="text-2xl font-semibold">{active.length}</p>
        </div>
        <div className={d.cardP4}>
          <p className="text-sm text-[#8B7355]">Billed to users / month</p>
          <p className="text-2xl font-semibold">{fmtMoney(revenue)}</p>
        </div>
        <div className={d.cardP4}>
          <p className="text-sm text-[#8B7355]">Our cost / month</p>
          <p className="text-2xl font-semibold">{fmtMoney(cost)}</p>
          <p className="text-xs font-medium text-[#6FAF8F]">margin {fmtMoney(revenue - cost)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input className={`${d.input} w-full sm:w-64`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search number…" aria-label="Search numbers" />
        <select className={d.selectInline} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="active">Active</option>
          <option value="pending">Activating</option>
          <option value="released">Released</option>
          <option value="all">All statuses</option>
        </select>
        <select className={`${d.selectInline} min-w-[220px]`} value={ownerId} onChange={(e) => setOwnerId(e.target.value)} aria-label="Owner">
          <option value="">All users</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {error ? <div className={errorBox}>{error}</div> : null}

      <div className={d.tableWrap}>
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[#E8DCCB]">
              <th className={d.th}>Number</th>
              <th className={d.th}>Owner</th>
              <th className={d.th}>Location</th>
              <th className={d.th}>Features</th>
              <th className={d.th}>Price / mo</th>
              <th className={d.th}>Cost / mo</th>
              <th className={d.th}>Status</th>
              <th className={`${d.th} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={d.td} colSpan={8}>Loading…</td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td className={d.td} colSpan={8}>No numbers match.</td>
              </tr>
            ) : (
              items.map((n) => (
                <tr key={n.id} className={d.trBorder}>
                  <td className={d.td}>
                    <span className="font-mono font-semibold">{n.number}</span>
                    {n.label ? <span className="block text-xs text-[#8B7355]">{n.label}</span> : null}
                  </td>
                  <td className={d.td}>
                    {n.owner ? (
                      <>
                        {n.owner.name}
                        <span className="block text-xs text-[#8B7355]">{n.owner.email}</span>
                      </>
                    ) : (
                      <span className="text-[#D96B6B]">Unassigned</span>
                    )}
                  </td>
                  <td className={`${d.td} text-[#8B7355]`}>{fmtLocation(n)}</td>
                  <td className={d.td}><Capabilities voice={n.voiceEnabled} sms={n.smsEnabled} /></td>
                  <td className={d.td}>{fmtMoney(n.monthlyPrice, n.currency)}</td>
                  <td className={`${d.td} text-[#8B7355]`}>{fmtMoney(n.monthlyCost, n.currency)}</td>
                  <td className={d.td}><StatusBadge status={n.status} /></td>
                  <td className={`${d.td} text-right`}>
                    {n.status !== 'released' ? (
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          className="rounded p-2 text-[#8B7355] hover:bg-[#F5EFE7]"
                          title="Reassign"
                          aria-label={`Reassign ${n.number}`}
                          onClick={() => {
                            setReassigning(n)
                            setNewOwner(n.ownerUserId ?? '')
                          }}
                        >
                          <FiUserCheck size={16} />
                        </button>
                        <button type="button" className="rounded p-2 text-[#D96B6B] hover:bg-[#D96B6B]/10" title="Release" aria-label={`Release ${n.number}`} onClick={() => setReleasing(n)}>
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(reassigning)}
        title={reassigning ? `Reassign ${reassigning.number}` : ''}
        onClose={() => setReassigning(null)}
        footer={
          <>
            <button type="button" className="acl-btn acl-btn--ghost" onClick={() => setReassigning(null)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="acl-btn acl-btn--primary" onClick={doReassign} disabled={busy || !newOwner || newOwner === reassigning?.ownerUserId}>
              Reassign
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-[#8B7355]">The number moves to the new user, who is billed for it from now on.</p>
        <UserSelect users={users} value={newOwner} onChange={setNewOwner} />
      </Modal>

      <ConfirmModal
        open={Boolean(releasing)}
        title="Release this number?"
        message={releasing ? `${releasing.number} will be released from the platform account and removed from ${releasing.owner?.name ?? 'its owner'}. This usually can't be undone.` : ''}
        confirmLabel="Release number"
        danger
        loading={busy}
        onConfirm={doRelease}
        onClose={() => setReleasing(null)}
      />
    </div>
  )
}

export function UnassignedTab({ overview, onChanged }: { overview: BnOverview; onChanged: () => void }) {
  const { toast } = useToast()
  const users = useUsers()
  const [data, setData] = useState<{ unassigned: BnUnassigned[]; missing: BusinessNumberAdmin[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<BnUnassigned | null>(null)
  const [owner, setOwner] = useState('')
  const [countryIso, setCountryIso] = useState(overview.countries[0]?.iso ?? 'IN')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    return businessNumbersApi
      .reconcile()
      .then((r) => {
        setData(r)
        setError(null)
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  const doAssign = async () => {
    if (!assigning || !owner) return
    setBusy(true)
    try {
      await businessNumbersApi.importNumber({ number: assigning.number, ownerUserId: owner, countryIso })
      toast(`${assigning.number} assigned`, 'success')
      setAssigning(null)
      void load()
      onChanged()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={d.stack}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#8B7355]">
          Numbers on the platform account that no user owns yet, e.g. bought before this feature or outside the CRM.
        </p>
        <button type="button" className={d.btnSecondarySm} onClick={() => void load()} disabled={loading}>
          <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden /> Refresh
        </button>
      </div>
      {error ? <div className={errorBox}>{error}</div> : null}

      {data?.missing.length ? (
        <div className="rounded-lg border border-[#F2C94C]/60 bg-[#F2C94C]/15 px-4 py-3 text-sm text-[#6b5500]">
          {data.missing.length} number{data.missing.length === 1 ? ' is' : 's are'} marked active in the CRM but no longer on the platform account:{' '}
          {data.missing.map((m) => m.number).join(', ')}. Release them here to stop billing the user.
        </div>
      ) : null}

      <div className={d.tableWrap}>
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-[#E8DCCB]">
              <th className={d.th}>Number</th>
              <th className={d.th}>Type</th>
              <th className={d.th}>Region</th>
              <th className={d.th}>Features</th>
              <th className={d.th}>Cost / mo</th>
              <th className={`${d.th} text-right`} />
            </tr>
          </thead>
          <tbody>
            {loading && !data ? (
              <tr>
                <td className={d.td} colSpan={6}>Loading…</td>
              </tr>
            ) : !data?.unassigned.length ? (
              <tr>
                <td className={d.td} colSpan={6}>Every number on the account is assigned to a user.</td>
              </tr>
            ) : (
              data.unassigned.map((n) => (
                <tr key={n.number} className={d.trBorder}>
                  <td className={`${d.td} font-mono font-semibold`}>{n.number}</td>
                  <td className={d.td}>{NUMBER_TYPE_LABEL[n.type ?? ''] ?? n.type ?? '—'}</td>
                  <td className={`${d.td} text-[#8B7355]`}>{n.region ?? '—'}</td>
                  <td className={d.td}><Capabilities voice={n.voiceEnabled} sms={n.smsEnabled} /></td>
                  <td className={d.td}>{fmtMoney(n.monthlyCost)}</td>
                  <td className={`${d.td} text-right`}>
                    <button type="button" className={d.btnSecondarySm} onClick={() => { setAssigning(n); setOwner('') }}>
                      Assign to user
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(assigning)}
        title={assigning ? `Assign ${assigning.number}` : ''}
        onClose={() => setAssigning(null)}
        footer={
          <>
            <button type="button" className="acl-btn acl-btn--ghost" onClick={() => setAssigning(null)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="acl-btn acl-btn--primary" onClick={doAssign} disabled={busy || !owner}>
              Assign
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[#8B7355]">
            The user will see it under My numbers and be billed {fmtMoney(assigning?.monthlyPrice ?? null)} per month.
          </p>
          <UserSelect users={users} value={owner} onChange={setOwner} />
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
        </div>
      </Modal>
    </div>
  )
}
