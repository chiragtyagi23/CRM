import { useMemo, useState } from 'react'
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useUpdateRoleMutation,
} from '../../../../store/aclApi'
import { ConfirmModal } from '../../../acl/ConfirmModal'
import { DataTable, filterRows, paginate, type Column } from '../../../acl/DataTable'
import { Modal } from '../../../acl/Modal'
import type { AclRoleDTO } from '../../../../acl/types'
import { getApiErrorMessage } from '../../../../services/aclHttp'
import { AclPanelToolbar } from '../AclPanelToolbar'
import { ACL_PAGE_SIZE } from '../constants'
import type { AclPaginatedTabProps } from '../types'

export type RolesTabProps = AclPaginatedTabProps & {
  roles: AclRoleDTO[]
}

export function RolesTab({ roles, loading, search, page, onPageChange, toast }: RolesTabProps) {
  const [createRole] = useCreateRoleMutation()
  const [updateRole] = useUpdateRoleMutation()
  const [deleteRole] = useDeleteRoleMutation()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AclRoleDTO | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const filtered = useMemo(() => filterRows(roles, search, ['name', 'description']), [roles, search])
  const paged = paginate(filtered, page, ACL_PAGE_SIZE)

  const columns: Column<AclRoleDTO>[] = [
    { key: 'name', header: 'Name', render: (r) => <strong>{r.name}</strong> },
    { key: 'desc', header: 'Description', render: (r) => r.description || '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="acl-row-actions">
          <button
            type="button"
            className="acl-btn w-[70px] acl-btn--ghost"
            onClick={() => {
              setEditing(r)
              setName(r.name)
              setDescription(r.description || '')
              setModal('edit')
            }}
          >
            Edit
          </button>
          <button type="button" className="acl-btn acl-btn--danger" onClick={() => setConfirmId(r.id)}>
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <AclPanelToolbar
        title="Roles"
        action={
          <button
            type="button"
            className="acl-btn acl-btn--primary"
            onClick={() => {
              setEditing(null)
              setName('')
              setDescription('')
              setModal('create')
            }}
          >
            + New role
          </button>
        }
      />
      <DataTable
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={ACL_PAGE_SIZE}
        total={filtered.length}
        onPageChange={onPageChange}
      />
      <Modal
        open={modal !== null}
        title={modal === 'edit' ? 'Edit role' : 'Create role'}
        onClose={() => setModal(null)}
        footer={
          <>
            <button type="button" className="acl-btn acl-btn--ghost" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="acl-btn acl-btn--primary"
              onClick={async () => {
                try {
                  if (modal === 'edit' && editing) {
                    await updateRole({ id: editing.id, name, description }).unwrap()
                    toast('Role updated', 'success')
                  } else {
                    await createRole({ name, description }).unwrap()
                    toast('Role created', 'success')
                  }
                  setModal(null)
                } catch (e) {
                  toast(getApiErrorMessage(e), 'error')
                }
              }}
            >
              Save
            </button>
          </>
        }
      >
        <label className="acl-field">
          <span>Name</span>
          <input className="acl-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="acl-field">
          <span>Description</span>
          <textarea className="acl-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </Modal>
      <ConfirmModal
        open={!!confirmId}
        title="Delete role"
        message="This removes the role and its module assignments. Users with this role will have a null role."
        danger
        onClose={() => setConfirmId(null)}
        onConfirm={async () => {
          if (!confirmId) return
          try {
            await deleteRole(confirmId).unwrap()
            toast('Role deleted', 'success')
            setConfirmId(null)
          } catch (e) {
            toast(getApiErrorMessage(e), 'error')
          }
        }}
      />
    </>
  )
}
