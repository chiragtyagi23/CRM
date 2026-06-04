import { useState } from 'react'
import { useGetModulesQuery, useGetRolesQuery, useGetUsersQuery } from '../../store/aclApi'
import { useToast } from '../../components/acl/Toast'
import {
  ACL_TABS,
  MatrixTab,
  ModulesTab,
  OverridesTab,
  RolesTab,
  UsersTab,
  type AclTabId,
} from '../../components/admin/acl'
import '../../styles/acl-admin.css'

export function AclManagement() {
  const [tab, setTab] = useState<AclTabId>('roles')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { toast } = useToast()

  const needsRoles = tab === 'roles' || tab === 'matrix' || tab === 'users'
  const needsModules = tab === 'modules' || tab === 'matrix' || tab === 'overrides'
  const needsUsers = tab === 'users' || tab === 'overrides'

  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery(undefined, { skip: !needsRoles })
  const { data: modulesData, isLoading: modulesLoading } = useGetModulesQuery(undefined, {
    skip: !needsModules,
  })
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery(undefined, { skip: !needsUsers })

  const roles = rolesData?.items ?? []
  const modules = modulesData?.items ?? []
  const users = usersData?.items ?? []

  const sharedPaginated = {
    search,
    page,
    onPageChange: setPage,
    toast,
  }

  return (
    <div className="acl-admin crm-page">
      <header className="acl-admin-hero crm-page-header">
        <div>
          <p className="acl-admin-kicker">Security</p>
          <h1 className="crm-page-title">ACL Management</h1>
          <p className="crm-page-subtitle">Roles, modules, assignments, and per-user overrides.</p>
        </div>
        <div className="acl-admin-search">
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="acl-input"
          />
        </div>
      </header>

      <nav className="acl-tabs" aria-label="ACL sections">
        {ACL_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`acl-tab${tab === t.id ? ' acl-tab--active' : ''}`}
            onClick={() => {
              setTab(t.id)
              setPage(1)
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="acl-panel">
        {tab === 'roles' && (
          <RolesTab roles={roles} loading={rolesLoading} {...sharedPaginated} />
        )}
        {tab === 'modules' && (
          <ModulesTab modules={modules} loading={modulesLoading} {...sharedPaginated} />
        )}
        {tab === 'matrix' && <MatrixTab roles={roles} modules={modules} toast={toast} />}
        {tab === 'users' && (
          <UsersTab users={users} roles={roles} loading={usersLoading} {...sharedPaginated} />
        )}
        {tab === 'overrides' && (
          <OverridesTab users={users} modules={modules} toast={toast} search={search} />
        )}
      </section>
    </div>
  )
}
