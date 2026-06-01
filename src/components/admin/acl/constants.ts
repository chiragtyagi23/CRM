export const ACL_PAGE_SIZE = 8

export type AclTabId = 'roles' | 'modules' | 'matrix' | 'users' | 'overrides'

export const ACL_TABS: { id: AclTabId; label: string }[] = [
  { id: 'roles', label: 'Roles' },
  { id: 'modules', label: 'Modules' },
  { id: 'matrix', label: 'Role × Modules' },
  { id: 'users', label: 'User Roles' },
  { id: 'overrides', label: 'Overrides' },
]
