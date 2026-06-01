import { useState } from 'react'
import {
  useCreateOverrideMutation,
  useDeleteOverrideMutation,
  useGetUserOverridesQuery,
} from '../../../../store/aclApi'
import { ConfirmModal } from '../../../acl/ConfirmModal'
import type { AclModuleDTO, AclUserDTO } from '../../../../acl/types'
import { getApiErrorMessage } from '../../../../services/aclHttp'
import { AclPanelToolbar } from '../AclPanelToolbar'
import type { AclToastFn } from '../types'

export type OverridesTabProps = {
  users: AclUserDTO[]
  modules: AclModuleDTO[]
  search: string
  toast: AclToastFn
}

export function OverridesTab({ users, modules, toast, search }: OverridesTabProps) {
  const [userId, setUserId] = useState(users[0]?.id ?? '')
  const { data, refetch } = useGetUserOverridesQuery(userId, { skip: !userId })
  const [createOverride] = useCreateOverrideMutation()
  const [deleteOverride] = useDeleteOverrideMutation()
  const [moduleId, setModuleId] = useState('')
  const [effect, setEffect] = useState<'ALLOW' | 'DENY'>('DENY')
  const [reason, setReason] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const items = (data?.items ?? []).filter((o) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return o.module_key.toLowerCase().includes(q) || (o.reason || '').toLowerCase().includes(q)
  })

  return (
    <>
      <AclPanelToolbar
        title="User overrides"
        action={
          <select className="acl-input acl-input--inline" value={userId} onChange={(e) => setUserId(e.target.value)}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        }
      />
      <div className="acl-override-form">
        <select className="acl-input" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
          <option value="">Select module</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.module_key})
            </option>
          ))}
        </select>
        <select className="acl-input" value={effect} onChange={(e) => setEffect(e.target.value as 'ALLOW' | 'DENY')}>
          <option value="DENY">DENY</option>
          <option value="ALLOW">ALLOW</option>
        </select>
        <input className="acl-input" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button
          type="button"
          className="acl-btn acl-btn--primary"
          disabled={!userId || !moduleId}
          onClick={async () => {
            try {
              await createOverride({ userId, moduleId, effect, reason }).unwrap()
              toast('Override saved', 'success')
              setReason('')
              refetch()
            } catch (e) {
              toast(getApiErrorMessage(e), 'error')
            }
          }}
        >
          Add override
        </button>
      </div>
      <ul className="acl-override-list">
        {items.map((o) => (
          <li key={o.id} className={`acl-override-item acl-override-item--${o.effect.toLowerCase()}`}>
            <div>
              <strong>{o.module_key}</strong>
              <span className="acl-badge">{o.effect}</span>
              {o.reason ? <p className="acl-muted">{o.reason}</p> : null}
            </div>
            <button type="button" className="acl-btn acl-btn--danger" onClick={() => setConfirmId(o.id)}>
              Remove
            </button>
          </li>
        ))}
        {items.length === 0 ? <p className="acl-muted">No overrides for this user.</p> : null}
      </ul>
      <ConfirmModal
        open={!!confirmId}
        title="Remove override"
        message="User will fall back to role-based access for this module."
        danger
        onClose={() => setConfirmId(null)}
        onConfirm={async () => {
          if (!confirmId) return
          try {
            await deleteOverride(confirmId).unwrap()
            toast('Override removed', 'success')
            setConfirmId(null)
            refetch()
          } catch (e) {
            toast(getApiErrorMessage(e), 'error')
          }
        }}
      />
    </>
  )
}
