import type { AclModuleDTO, AclOverrideDTO } from './types'

const LS_ACCESS = 'crm_access'

/** Resolve allowed module keys — DENY > ALLOW > role modules > default deny */
export function resolveModuleKeys(
  roleModules: Pick<AclModuleDTO, 'module_key'>[],
  overrides: Pick<AclOverrideDTO, 'module_key' | 'effect'>[] = [],
): Set<string> {
  const roleSet = new Set(roleModules.map((m) => m.module_key))
  const deny = new Set<string>()
  const allow = new Set<string>()

  for (const o of overrides) {
    const effect = String(o.effect).toUpperCase()
    if (effect === 'DENY') deny.add(o.module_key)
    if (effect === 'ALLOW') allow.add(o.module_key)
  }

  const allowed = new Set<string>()
  for (const key of roleSet) {
    if (!deny.has(key)) allowed.add(key)
  }
  for (const key of allow) {
    if (!deny.has(key)) allowed.add(key)
  }
  return allowed
}

export function hasAccess(
  moduleKey: string,
  modules: AclModuleDTO[],
  overrides: AclOverrideDTO[] = [],
): boolean {
  if (modules.some((m) => m.module_key === '*')) return true
  const keys = resolveModuleKeys(modules, overrides)
  return keys.has(moduleKey)
}

export function readStoredAccess(): { modules: AclModuleDTO[]; overrides: AclOverrideDTO[] } {
  try {
    const raw = window.localStorage.getItem(LS_ACCESS)
    if (!raw) return { modules: [], overrides: [] }
    const parsed = JSON.parse(raw) as { modules?: AclModuleDTO[]; overrides?: AclOverrideDTO[] }
    return { modules: parsed.modules ?? [], overrides: parsed.overrides ?? [] }
  } catch {
    return { modules: [], overrides: [] }
  }
}

export function writeStoredAccess(access: { modules: AclModuleDTO[]; overrides?: AclOverrideDTO[] }) {
  window.localStorage.setItem(
    LS_ACCESS,
    JSON.stringify({ modules: access.modules, overrides: access.overrides ?? [] }),
  )
}

export function clearStoredAccess() {
  window.localStorage.removeItem(LS_ACCESS)
}

/** Top-level modules only — children (e.g. leads.delete) are actions, not nav items. */
export function modulesForNavbar(modules: AclModuleDTO[]): AclModuleDTO[] {
  return modules
    .filter((m) => !m.parent_id && m.module_key !== 'profile')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
}

/** Match pathname to a page module (prefers parent keys over action children on same route). */
export function moduleKeyForPath(pathname: string, modules: AclModuleDTO[]): string | null {
  const path = pathname.split('?')[0]
  const pageModules = modulesForNavbar(modules)
  const pool = pageModules.length > 0 ? pageModules : modules

  let best: { key: string; len: number; isChild: boolean } | null = null
  for (const m of pool) {
    const route = m.route || ''
    if (!route || route === '*') continue
    if (path === route || path.startsWith(`${route}/`)) {
      const len = route.length
      const isChild = Boolean(m.parent_id) || m.module_key.includes('.')
      if (!best || len > best.len || (len === best.len && best.isChild && !isChild)) {
        best = { key: m.module_key, len, isChild }
      }
    }
  }
  return best?.key ?? null
}
