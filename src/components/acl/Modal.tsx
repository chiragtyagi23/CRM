import type { ReactNode } from 'react'

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  wide,
  allowDropdownOverflow,
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  wide?: boolean
  /** Lets custom dropdowns extend outside the panel (e.g. role picker). */
  allowDropdownOverflow?: boolean
}) {
  if (!open) return null
  const overflowClass = allowDropdownOverflow ? ' acl-modal-panel--allow-overflow' : ''
  const bodyOverflowClass = allowDropdownOverflow ? ' acl-modal-body--allow-overflow' : ''
  return (
    <div className="acl-modal-root" role="dialog" aria-modal="true" aria-labelledby="acl-modal-title">
      <button type="button" className="acl-modal-scrim" aria-label="Close" onClick={onClose} />
      <div className={`acl-modal-panel${wide ? ' acl-modal-panel--wide' : ''}${overflowClass}`}>
        <header className="acl-modal-header">
          <h2 id="acl-modal-title">{title}</h2>
          <button type="button" className="acl-modal-close" onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </header>
        <div className={`acl-modal-body${bodyOverflowClass}`}>{children}</div>
        {footer ? <footer className="acl-modal-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}
