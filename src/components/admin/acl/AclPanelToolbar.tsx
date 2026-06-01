import type { ReactNode } from 'react'

export function AclPanelToolbar({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="acl-panel-toolbar">
      <h2>{title}</h2>
      {action ?? null}
    </div>
  )
}
