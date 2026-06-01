import { useMemo, useState } from 'react'
import type { AclModuleDTO } from '../../acl/types'
import {
  buildModuleTree,
  childActionLabel,
  collectDescendantIds,
  type ModuleTreeNode,
} from '../../utils/moduleTree'

type Props = {
  modules: AclModuleDTO[]
  checked: Set<string>
  onChange: (next: Set<string>) => void
}

export function RoleModuleTree({ modules, checked, onChange }: Props) {
  const tree = useMemo(() => buildModuleTree(modules), [modules])
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const setCheckedIds = (ids: string[], on: boolean) => {
    const next = new Set(checked)
    for (const id of ids) {
      if (on) next.add(id)
      else next.delete(id)
    }
    onChange(next)
  }

  const toggleBranch = (node: ModuleTreeNode, on: boolean) => {
    setCheckedIds([node.id, ...collectDescendantIds(node)], on)
    if (on && node.children.length > 0) {
      setExpanded((prev) => new Set(prev).add(node.id))
    }
  }

  if (tree.length === 0) {
    return <p className="acl-muted">No modules defined.</p>
  }

  return (
    <ul className="acl-module-tree" role="tree">
      {tree.map((node) => (
        <TreeRow
          key={node.id}
          node={node}
          depth={0}
          checked={checked}
          expanded={expanded}
          onToggleExpand={toggleExpand}
          onToggleBranch={toggleBranch}
          onToggleLeaf={(id, on) => setCheckedIds([id], on)}
        />
      ))}
    </ul>
  )
}

function TreeRow({
  node,
  depth,
  checked,
  expanded,
  onToggleExpand,
  onToggleBranch,
  onToggleLeaf,
}: {
  node: ModuleTreeNode
  depth: number
  checked: Set<string>
  expanded: Set<string>
  onToggleExpand: (id: string) => void
  onToggleBranch: (node: ModuleTreeNode, on: boolean) => void
  onToggleLeaf: (id: string, on: boolean) => void
}) {
  const hasChildren = node.children.length > 0
  const isOpen = expanded.has(node.id)
  const isChecked = checked.has(node.id)
  const descendantIds = collectDescendantIds(node)
  const someChildrenChecked =
    descendantIds.length > 0 && descendantIds.some((id) => checked.has(id)) && !isChecked

  const title = depth === 0 ? node.name : childActionLabel(node.module_key)

  return (
    <li className="acl-module-tree-item" role="treeitem" aria-expanded={hasChildren ? isOpen : undefined}>
      <div className="acl-module-tree-row" style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}>
        {hasChildren ? (
          <button
            type="button"
            className={`acl-tree-chevron${isOpen ? ' acl-tree-chevron--open' : ''}`}
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            onClick={() => onToggleExpand(node.id)}
          >
            ▶
          </button>
        ) : (
          <span className="acl-tree-chevron acl-tree-chevron--spacer" aria-hidden />
        )}

        <div className="acl-module-tree-label">
          <input
            type="checkbox"
            checked={isChecked}
            ref={(el) => {
              if (el) el.indeterminate = someChildrenChecked
            }}
            onChange={(e) => {
              if (hasChildren) onToggleBranch(node, e.target.checked)
              else onToggleLeaf(node.id, e.target.checked)
            }}
          />
          <button
            type="button"
            className="acl-module-tree-name"
            disabled={!hasChildren}
            onClick={() => hasChildren && onToggleExpand(node.id)}
          >
            <strong>{title}</strong>
          </button>
          <code className="acl-module-tree-key">{node.module_key}</code>
          {node.route ? <span className="acl-muted acl-module-tree-route">{node.route}</span> : null}
        </div>
      </div>

      {hasChildren && isOpen ? (
        <ul className="acl-module-tree-children" role="group">
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              checked={checked}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              onToggleBranch={onToggleBranch}
              onToggleLeaf={onToggleLeaf}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}
