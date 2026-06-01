import type { AclModuleDTO } from '../acl/types'

export type ModuleTreeNode = AclModuleDTO & {
  children: ModuleTreeNode[]
}

/** Build parent → children tree from flat modules (sorted). */
export function buildModuleTree(modules: AclModuleDTO[]): ModuleTreeNode[] {
  const byId = new Map(modules.map((m) => [m.id, { ...m, children: [] as ModuleTreeNode[] }]))
  const roots: ModuleTreeNode[] = []

  for (const m of modules) {
    const node = byId.get(m.id)!
    if (m.parent_id && byId.has(m.parent_id)) {
      byId.get(m.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortNodes = (nodes: ModuleTreeNode[]) => {
    nodes.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
    for (const n of nodes) sortNodes(n.children)
  }
  sortNodes(roots)
  return roots
}

export function collectDescendantIds(node: ModuleTreeNode): string[] {
  const ids: string[] = []
  const walk = (n: ModuleTreeNode) => {
    for (const c of n.children) {
      ids.push(c.id)
      walk(c)
    }
  }
  walk(node)
  return ids
}

export function flattenTree(nodes: ModuleTreeNode[]): ModuleTreeNode[] {
  const out: ModuleTreeNode[] = []
  const walk = (list: ModuleTreeNode[]) => {
    for (const n of list) {
      out.push(n)
      walk(n.children)
    }
  }
  walk(nodes)
  return out
}

/** Display label for child rows (e.g. leads.assignto → Assignto). */
export function childActionLabel(moduleKey: string): string {
  const dot = moduleKey.indexOf('.')
  if (dot === -1) return moduleKey
  const part = moduleKey.slice(dot + 1)
  return part
    .split(/[._]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
