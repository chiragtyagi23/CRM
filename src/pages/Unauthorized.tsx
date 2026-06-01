import { Link } from 'react-router-dom'

export function Unauthorized() {
  return (
    <section className="acl-admin acl-status-page">
      <div className="acl-status-card">
        <p className="acl-admin-kicker">401</p>
        <h1>Unauthorized</h1>
        <p className="acl-muted">Please sign in to continue.</p>
        <Link to="/login" className="acl-btn acl-btn--primary">
          Go to login
        </Link>
      </div>
    </section>
  )
}
