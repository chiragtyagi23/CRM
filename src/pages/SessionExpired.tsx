import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../store/hooks'
import { authActions } from '../store/authSlice'

export function SessionExpired() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    dispatch(authActions.logout())
  }, [dispatch])

  return (
    <section className="acl-status-page">
      <div className="acl-status-card">
        <p className="acl-admin-kicker">Session</p>
        <h1>Session expired</h1>
        <p className="acl-muted">Your login session has ended. Sign in again to continue.</p>
        <Link
          to="/login"
          className="acl-btn acl-btn--primary"
          onClick={(e) => {
            e.preventDefault()
            navigate('/login', { replace: true })
          }}
        >
          Sign in again
        </Link>
      </div>
    </section>
  )
}
