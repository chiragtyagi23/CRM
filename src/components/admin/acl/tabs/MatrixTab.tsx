import { useEffect, useState } from 'react'
import { useGetRoleModulesQuery, useSetRoleModulesMutation } from '../../../../store/aclApi'
import { RoleModuleTree } from '../../../acl/RoleModuleTree'
import type { AclModuleDTO, AclRoleDTO } from '../../../../acl/types'
import { getApiErrorMessage } from '../../../../services/aclHttp'
import { useAppDispatch } from '../../../../store/hooks'
import { refreshAccess } from '../../../../store/authSlice'
import { AclPanelToolbar } from '../AclPanelToolbar'
import type { AclToastFn } from '../types'

export type MatrixTabProps = {
  roles: AclRoleDTO[]
  modules: AclModuleDTO[]
  toast: AclToastFn
}

export function MatrixTab({ roles, modules, toast }: MatrixTabProps) {
  const dispatch = useAppDispatch()
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? '')
  const { data, isLoading } = useGetRoleModulesQuery(selectedRoleId, { skip: !selectedRoleId })
  const [setRoleModules, { isLoading: saving }] = useSetRoleModulesMutation()
  const [checked, setChecked] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (data?.moduleIds) setChecked(new Set(data.moduleIds))
  }, [data?.moduleIds])

  return (
    <>
      <AclPanelToolbar
        title="Role module matrix"
        action={
          <>
            <select
              className="acl-input acl-input--inline"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="acl-btn acl-btn--primary"
              disabled={!selectedRoleId || saving}
              onClick={async () => {
                try {
                  await setRoleModules({ roleId: selectedRoleId, moduleIds: [...checked] }).unwrap()
                  await dispatch(refreshAccess())
                  toast('Role modules saved — navigation updated', 'success')
                } catch (e) {
                  toast(getApiErrorMessage(e), 'error')
                }
              }}
            >
              {saving ? 'Saving…' : 'Save assignments'}
            </button>
          </>
        }
      />
      {isLoading ? (
        <p className="acl-muted">Loading matrix…</p>
      ) : (
        <div className="acl-matrix-tree-wrap">
          <p className="acl-muted acl-matrix-hint">
            Expand a module (e.g. Leads) to assign page access and actions like <code>leads.assignto</code>,{' '}
            <code>leads.delete</code>.
          </p>
          <RoleModuleTree modules={modules} checked={checked} onChange={setChecked} />
        </div>
      )}
    </>
  )
}
