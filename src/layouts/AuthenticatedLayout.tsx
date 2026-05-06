import { Navigate, Outlet } from 'react-router-dom'

import { AppHeader } from '../components/AppHeader'
import { useAppSelector } from '../store/hooks'

/**
 * Pathless layout: child routes are normal absolute paths (/dashboard, /profile, …).
 * URL is always the real path (refresh keeps /profile, /leads, etc.); auth only gates access.
 */
export function AuthenticatedLayout() {
  const token = useAppSelector((s) => s.auth.token)

  if (!token) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  )
}
