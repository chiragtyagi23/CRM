export function Forbidden() {
  return (
    <section className="acl-admin acl-status-page">
      <div className="acl-status-card">
        <p className="acl-admin-kicker">403</p>
        <h1>Access denied</h1>
        <p className="acl-muted">You don&apos;t have access to this page.</p>
        <p className="acl-muted">Please contact your admin to request permission.</p>
      </div>
    </section>
  )
}
