import { useMemo, useState } from 'react'
import {
  useCreateModuleMutation,
  useDeleteModuleMutation,
  useUpdateModuleMutation,
} from '../../../../store/aclApi'
import { ConfirmModal } from '../../../acl/ConfirmModal'
import { DataTable, filterRows, paginate, type Column } from '../../../acl/DataTable'
import { Modal } from '../../../acl/Modal'
import { buildModuleTree } from '../../../../utils/moduleTree'
import type { AclModuleDTO } from '../../../../acl/types'
import { getApiErrorMessage } from '../../../../services/aclHttp'
import { useAppDispatch } from '../../../../store/hooks'
import { refreshAccess } from '../../../../store/authSlice'
import { AclPanelToolbar } from '../AclPanelToolbar'
import { ACL_PAGE_SIZE } from '../constants'
import type { AclPaginatedTabProps } from '../types'

export type ModulesTabProps = AclPaginatedTabProps & {
  modules: AclModuleDTO[]
}

const emptyForm = {
  module_key: '',
  name: '',
  route: '',
  icon: 'grid',
  parent_id: '',
  sort_order: 0,
}

export function ModulesTab({ modules, loading, search, page, onPageChange, toast }: ModulesTabProps) {
  const dispatch = useAppDispatch()
  const [createModule] = useCreateModuleMutation()
  const [updateModule] = useUpdateModuleMutation()
  const [deleteModule] = useDeleteModuleMutation()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<AclModuleDTO | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const moduleTree = useMemo(() => buildModuleTree(modules), [modules])
  const filtered = useMemo(
    () => filterRows(modules, search, ['module_key', 'name', 'route']),
    [modules, search],
  )
  const paged = paginate(filtered, page, ACL_PAGE_SIZE)

  const columns: Column<AclModuleDTO>[] = [
    { key: 'key', header: 'Key', render: (m) => <code>{m.module_key}</code> },
    { key: 'name', header: 'Name', render: (m) => m.name },
    { key: 'route', header: 'Route', render: (m) => m.route },
    { key: 'parent', header: 'Parent', render: (m) => modules.find((p) => p.id === m.parent_id)?.name ?? '—',},
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <div className="acl-row-actions">
          <button
            type="button"
            className="acl-btn acl-btn--ghost"
            onClick={() => {
              setEditing(m)
              setForm({
                module_key: m.module_key,
                name: m.name,
                route: m.route,
                icon: m.icon || 'grid',
                parent_id: m.parent_id || '',
                sort_order: m.sort_order ?? 0,
              })
              setModal(true)
            }}
          >
            Edit
          </button>
          <button type="button" className="acl-btn acl-btn--danger" onClick={() => setConfirmId(m.id)}>
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <AclPanelToolbar
        title="Modules"
        action={
          <button
            type="button"
            className="acl-btn acl-btn--primary"
            onClick={() => {
              setEditing(null)
              setForm(emptyForm)
              setModal(true)
            }}
          >
            + New module
          </button>
        }
      />
      <div className="acl-matrix-tree-wrap acl-modules-preview" aria-hidden>
        <p className="acl-muted acl-matrix-hint">
          Tree structure — set Parent to nest keys like <code>leads.assignto</code>.
        </p>
        <ul className="acl-module-tree">
          {moduleTree.map((root) => (
            <li key={root.id} className="acl-module-tree-item">
              <div className="acl-module-tree-row">
                <code className="acl-module-tree-key">{root.module_key}</code>
                <span className="acl-muted">{root.route}</span>
              </div>
              {root.children.length > 0 ? (
                <ul className="acl-module-tree-children">
                  {root.children.map((c) => (
                    <li key={c.id} className="acl-module-tree-row" style={{ paddingLeft: '2rem' }}>
                      <code className="acl-module-tree-key">{c.module_key}</code>
                      <span className="acl-muted">{c.route}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
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
        open={modal}
        wide
        title={editing ? 'Edit module' : 'Create module'}
        onClose={() => setModal(false)}
        footer={
          <>
            <button type="button" className="acl-btn acl-btn--ghost" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="acl-btn acl-btn--primary"
              onClick={async () => {
                try {
                  const body = {
                    ...form,
                    parent_id: form.parent_id || null,
                    sort_order: Number(form.sort_order),
                  }
                  if (editing) {
                    await updateModule({ id: editing.id, ...body }).unwrap()
                    toast('Module updated', 'success')
                  } else {
                    await createModule(body).unwrap()
                    toast('Module created', 'success')
                  }
                  setModal(false)
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
        <div className="acl-form-grid">
          <label className="acl-field">
            <span>Module key</span>
            <input className="acl-input" value={form.module_key} onChange={(e) => setForm({ ...form, module_key: e.target.value })} />
          </label>
          <label className="acl-field">
            <span>Name</span>
            <input className="acl-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="acl-field">
            <span>Route</span>
            <input className="acl-input" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} />
          </label>
          <label className="acl-field">
            <span>Icon</span>
            <input className="acl-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </label>
          <label className="acl-field">
            <span>Parent module</span>
            <select
              className="acl-input"
              value={form.parent_id}
              onChange={(e) => {
                const parentId = e.target.value
                const parent = modules.find((m) => m.id === parentId)
                setForm((f) => ({
                  ...f,
                  parent_id: parentId,
                  route: parent?.route ?? f.route,
                  name: parent?.name ?? f.name,
                  module_key:
                    parent && !f.module_key.includes('.') ? `${parent.module_key}.` : f.module_key,
                }))
              }}
            >
              <option value="">None (top-level)</option>
              {moduleTree.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.module_key} — {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="acl-field">
            <span>Sort order</span>
            <input
              type="number"
              className="acl-input"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </label>
        </div>
      </Modal>
      <ConfirmModal
        open={!!confirmId}
        title="Delete module"
        message="Removes module and related role/override links."
        danger
        onClose={() => setConfirmId(null)}
        onConfirm={async () => {
          if (!confirmId) return
          try {
            await deleteModule(confirmId).unwrap()
            await dispatch(refreshAccess())
            toast('Module deleted — navigation updated', 'success')
            setConfirmId(null)
          } catch (e) {
            toast(getApiErrorMessage(e), 'error')
          }
        }}
      />
    </>
  )
}
