import { Navigate, useLocation } from 'react-router-dom'
import { useACL } from './useACL'
import { moduleKeyForPath } from './hasAccess'

type Props = {
  moduleKey?: string
  children: React.ReactNode
}

/** Route guard — redirects to /403 when module access is denied. */
export function ProtectedRoute({ moduleKey, children }: Props) {
  const location = useLocation()
  const { hasAccess: can, isLegacyFullAccess, modules } = useACL()

  const key = moduleKey ?? moduleKeyForPath(location.pathname, modules)
  if (!key || isLegacyFullAccess) return <>{children}</>
  if (!can(key)) return <Navigate to="/403" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
