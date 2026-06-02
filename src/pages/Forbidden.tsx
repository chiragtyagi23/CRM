import { Link, useNavigate } from 'react-router-dom'

import { useAppDispatch } from '../store/hooks'
import { authActions } from '../store/authSlice'

export function Forbidden() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  return (
    <section className="acl-admin acl-status-page">
      <div className="acl-status-card">
        <p className="acl-admin-kicker">403</p>
        <h1>Access denied</h1>
        <p className="acl-muted">You don&apos;t have access to this page.</p>
        <p className="acl-muted">Please contact your admin to request permission.</p>
        {/* <Link
          className="acl-btn acl-btn--primary"
          to="/login"
          onClick={(e) => {
            e.preventDefault()
            dispatch(authActions.logout())
            navigate('/login', { replace: true })
          }}
        >
          Back to login
        </Link> */}
      </div>
    </section>
  )
}
