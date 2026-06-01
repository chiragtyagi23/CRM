import { useMemo } from 'react'
import { useAppSelector } from '../store/hooks'
import { hasAccess, moduleKeyForPath, modulesForNavbar, resolveModuleKeys } from './hasAccess'
import type { AclModuleDTO } from './types'

export function useACL() {
  const { user, access } = useAppSelector((s) => s.auth)
  const modules = access?.modules ?? []
  const overrides = access?.overrides ?? []

  const allowedKeys = useMemo(
    () => resolveModuleKeys(modules, overrides),
    [modules, overrides],
  )

  const isLegacyFullAccess = modules.some((m) => m.module_key === '*')
  /** True when user logged in via RBAC (access payload), not legacy signup-only JWT */
  const hasRbacSession = access != null && !isLegacyFullAccess
  const navModules = useMemo(() => modulesForNavbar(modules), [modules])

  return {
    user,
    modules,
    navModules,
    overrides,
    allowedKeys,
    isLegacyFullAccess,
    hasRbacSession,
    hasAccess: (moduleKey: string) =>
      isLegacyFullAccess || hasAccess(moduleKey, modules, overrides),
    canAccessRoute: (pathname: string) => {
      if (isLegacyFullAccess) return true
      const key = moduleKeyForPath(pathname, modules)
      if (!key) return true
      return hasAccess(key, modules, overrides)
    },
    /** Tree for admin matrix only; navbar uses navModules (roots). */
    sidebarModules: useMemo(() => buildSidebarTree(modules), [modules]),
  }
}

function buildSidebarTree(modules: AclModuleDTO[]) {
  const roots = modulesForNavbar(modules)
  const childrenByParent = new Map<string, AclModuleDTO[]>()
  for (const m of modules) {
    if (!m.parent_id) continue
    const list = childrenByParent.get(m.parent_id) ?? []
    list.push(m)
    childrenByParent.set(m.parent_id, list)
  }
  return roots.map((r) => ({
    ...r,
    children: (childrenByParent.get(r.id) ?? []).sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    ),
  }))
}
