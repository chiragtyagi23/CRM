import { Link, useLocation } from 'react-router-dom'

export function Forbidden() {
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  return (
    <section className="acl-status-page">
      <div className="acl-status-card">
        <p className="acl-admin-kicker">403</p>
        <h1>Access denied</h1>
        <p className="acl-muted">
          You do not have permission to view this page
          {from ? ` (${from})` : ''}.
        </p>
        <Link to="/dashboard" className="acl-btn acl-btn--primary">
          Back to dashboard
        </Link>
      </div>
    </section>
  )
}
