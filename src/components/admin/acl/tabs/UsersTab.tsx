import { useMemo } from 'react'
import { useUpdateUserRoleMutation } from '../../../../store/aclApi'
import { DataTable, filterRows, paginate, type Column } from '../../../acl/DataTable'
import type { AclRoleDTO, AclUserDTO } from '../../../../acl/types'
import { getApiErrorMessage } from '../../../../services/aclHttp'
import { AclPanelToolbar } from '../AclPanelToolbar'
import { ACL_PAGE_SIZE } from '../constants'
import type { AclPaginatedTabProps } from '../types'

export type UsersTabProps = AclPaginatedTabProps & {
  users: AclUserDTO[]
  roles: AclRoleDTO[]
}

export function UsersTab({ users, roles, loading, search, page, onPageChange, toast }: UsersTabProps) {
  const [updateUserRole] = useUpdateUserRoleMutation()
  const filtered = useMemo(
    () => filterRows(users, search, ['email', 'name', 'role_name']),
    [users, search],
  )
  const paged = paginate(filtered, page, ACL_PAGE_SIZE)

  const columns: Column<AclUserDTO>[] = [
    {
      key: 'name',
      header: 'User',
      render: (u) => (
        <span>
          {u.name}
          <br />
          <small className="acl-muted">{u.email}</small>
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => (
        <select
          className="acl-input acl-input--inline"
          value={u.role_id ?? ''}
          onChange={async (e) => {
            try {
              await updateUserRole({ userId: u.id, roleId: e.target.value || null }).unwrap()
              toast('User role updated', 'success')
            } catch (err) {
              toast(getApiErrorMessage(err), 'error')
            }
          }}
        >
          <option value="">— No role —</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (u.is_active ? 'Active' : 'Disabled'),
    },
  ]

  return (
    <>
      <AclPanelToolbar title="User role assignment" />
      <DataTable
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={ACL_PAGE_SIZE}
        total={filtered.length}
        onPageChange={onPageChange}
      />
    </>
  )
}
