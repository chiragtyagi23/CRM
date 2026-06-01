import type { ReactNode } from 'react'
import { useACL } from './useACL'

export function CanAccess({
  moduleKey,
  children,
  fallback = null,
}: {
  moduleKey: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { hasAccess: can } = useACL()
  if (!can(moduleKey)) return <>{fallback}</>
  return <>{children}</>
}
