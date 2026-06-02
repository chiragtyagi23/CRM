import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { AppHeader } from '../components/AppHeader'
import { useACL } from '../acl/useACL'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { authActions } from '../store/authSlice'

/**
 * Pathless layout: child routes are normal absolute paths (/dashboard, /profile, …).
 * Gates unauthenticated users and enforces route-level ACL.
 */
export function AuthenticatedLayout() {
  const token = useAppSelector((s) => s.auth.token)
  const bootstrapped = useAppSelector((s) => s.auth.bootstrapped)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { canAccessRoute, isLegacyFullAccess } = useACL()

  useEffect(() => {
    const onExpired = () => {
      dispatch(authActions.logout())
      navigate('/session-expired', { replace: true })
    }
    window.addEventListener('crm:session-expired', onExpired)
    return () => window.removeEventListener('crm:session-expired', onExpired)
  }, [dispatch, navigate])

  if (!bootstrapped) {
    return (
      <div className="acl-status-page" aria-busy="true">
        <p className="acl-muted">Loading session…</p>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const publicPaths = ['/profile', '/403', '/session-expired']
  const path = location.pathname
  if (!isLegacyFullAccess && !publicPaths.includes(path) && !canAccessRoute(path)) {
    return <Navigate to="/403" replace state={{ from: path }} />
  }

  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  )
}
