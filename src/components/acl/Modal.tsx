import type { ReactNode } from 'react'

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  wide,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="acl-modal-root" role="dialog" aria-modal="true" aria-labelledby="acl-modal-title">
      <button type="button" className="acl-modal-scrim" aria-label="Close" onClick={onClose} />
      <div className={`acl-modal-panel${wide ? ' acl-modal-panel--wide' : ''}`}>
        <header className="acl-modal-header">
          <h2 id="acl-modal-title">{title}</h2>
          <button type="button" className="acl-modal-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </header>
        <div className="acl-modal-body">{children}</div>
        {footer ? <footer className="acl-modal-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
