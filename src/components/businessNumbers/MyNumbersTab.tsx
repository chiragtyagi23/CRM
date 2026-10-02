import { useCallback, useEffect, useState } from 'react'
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'

import { ConfirmModal } from '../acl/ConfirmModal'
import { Modal } from '../acl/Modal'
import { useToast } from '../acl/Toast'
import { d } from '../../lib/designClasses'
import { getApiErrorMessage } from '../../services/aclHttp'
import { businessNumbersApi, fmtLocation, fmtMoney, NUMBER_TYPE_LABEL, type BusinessNumber } from '../../lib/businessNumbersApi'
import { Capabilities, StatusBadge } from './shared'

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

export function MyNumbersTab({ onBuy, onChanged }: { onBuy: () => void; onChanged: () => void }) {
  const { toast } = useToast()
  const [items, setItems] = useState<BusinessNumber[]>([])
  const [showReleased, setShowReleased] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<BusinessNumber | null>(null)
  const [labelDraft, setLabelDraft] = useState('')
  const [releasing, setReleasing] = useState<BusinessNumber | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    () =>
      businessNumbersApi
        .mine(showReleased)
        .then((r) => {
          setItems(r)
          setError(null)
        })
        .catch((err) => setError(getApiErrorMessage(err)))
        .finally(() => setLoading(false)),
    [showReleased],
  )

  useEffect(() => {
    void load()
  }, [load])

  const saveLabel = async () => {
    if (!editing) return
    setBusy(true)
    try {
      await businessNumbersApi.setLabel(editing.id, labelDraft.trim() || null)
      setEditing(null)
      void load()
    } catch (err) {
      toast(getApiErrorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmRelease = async () => {
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-[#8B7355]">
          <input type="checkbox" checked={showReleased} onChange={(e) => setShowReleased(e.target.checked)} /> Show released numbers
        </label>
        <button type="button" className={d.btnPrimarySm} onClick={onBuy}>
          <FiPlus size={14} aria-hidden /> Get a number
        </button>
      </div>

      {error ? <div className="rounded-lg border border-[#D96B6B]/40 bg-[#D96B6B]/10 px-4 py-3 text-sm text-[#9c3d3d]">{error}</div> : null}

      {!loading && !items.length ? (
        <div className={`${d.cardP6} text-center`}>
          <p className="text-base font-semibold text-[#2E2E2E]">You don't have any business numbers yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#8B7355]">
            Get a dedicated number for calls and messages with your leads. Pick the country, type and digits you want.
          </p>
          <button type="button" className={`${d.btnPrimarySm} mt-4`} onClick={onBuy}>
            <FiPlus size={14} aria-hidden /> Get your first number
          </button>
        </div>
      ) : (
        <div className={d.tableWrap}>
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-[#E8DCCB]">
                <th className={d.th}>Number</th>
                <th className={d.th}>Location</th>
                <th className={d.th}>Type</th>
                <th className={d.th}>Features</th>
                <th className={d.th}>Monthly</th>
                <th className={d.th}>Since</th>
                <th className={d.th}>Status</th>
                <th className={`${d.th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className={d.td} colSpan={8}>Loading…</td>
                </tr>
              ) : (
                items.map((n) => (
                  <tr key={n.id} className={d.trBorder}>
                    <td className={d.td}>
                      <span className="font-mono font-semibold">{n.number}</span>
                      {n.label ? <span className="block text-xs text-[#8B7355]">{n.label}</span> : null}
                    </td>
                    <td className={`${d.td} text-[#8B7355]`}>{fmtLocation(n)}</td>
                    <td className={d.td}>{NUMBER_TYPE_LABEL[n.type ?? ''] ?? n.type ?? '—'}</td>
                    <td className={d.td}><Capabilities voice={n.voiceEnabled} sms={n.smsEnabled} /></td>
                    <td className={d.td}>{fmtMoney(n.monthlyPrice, n.currency)}</td>
                    <td className={`${d.td} text-[#8B7355]`}>{fmtDate(n.purchasedAt)}</td>
                    <td className={d.td}><StatusBadge status={n.status} /></td>
                    <td className={`${d.td} text-right`}>
                      {n.status !== 'released' ? (
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            className="rounded p-2 text-[#8B7355] hover:bg-[#F5EFE7]"
                            title="Rename"
                            aria-label={`Rename ${n.number}`}
                            onClick={() => {
                              setEditing(n)
                              setLabelDraft(n.label ?? '')
                            }}
                          >
                            <FiEdit2 size={16} />
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
      )}

      <Modal
        open={Boolean(editing)}
        title={editing ? `Name ${editing.number}` : ''}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button type="button" className="acl-btn acl-btn--ghost" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </button>
            <button type="button" className="acl-btn acl-btn--primary" onClick={saveLabel} disabled={busy}>
              Save
            </button>
          </>
        }
      >
        <label className="block">
          <span className={d.label}>Label</span>
          <input className={d.input} value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)} maxLength={60} placeholder="e.g. Sales line, Skyline project" />
        </label>
      </Modal>

      <ConfirmModal
        open={Boolean(releasing)}
        title="Release this number?"
        message={
          releasing
            ? `${releasing.number} will be removed from your account and billing for it stops. Released numbers usually can't be recovered, and anyone calling it won't reach you.`
            : ''
        }
        confirmLabel="Release number"
        danger
        loading={busy}
        onConfirm={confirmRelease}
        onClose={() => setReleasing(null)}
      />
    </div>
  )
}
