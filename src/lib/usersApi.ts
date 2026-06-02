import { apiGet, apiSend } from './crmApi'
import type { ApiError } from './crmApi'
import type { CrmUserDTO } from '../types/dtos'
import type { AclRoleDTO } from '../acl/types'

export type { CrmUserDTO } from '../types/dtos'

export async function fetchUsers(): Promise<{ items: CrmUserDTO[] }> {
  return await apiGet<{ items: CrmUserDTO[] }>('/api/auth/users')
}

function normalizeRolesPayload(data: { items?: AclRoleDTO[] } | AclRoleDTO[]): AclRoleDTO[] {
  const raw = Array.isArray(data) ? data : (data.items ?? [])
  return raw
    .map((r) => ({
      id: String((r as AclRoleDTO).id ?? ''),
      name: String((r as AclRoleDTO).name ?? ''),
      description: (r as AclRoleDTO).description ?? null,
    }))
    .filter((r) => r.id && r.name)
}

/** Roles for Profile new-user dropdown — tries auth route, then ACL roles route. */
export async function fetchRoles(): Promise<{ items: AclRoleDTO[] }> {
  const paths = ['/api/auth/roles', '/api/roles'] as const
  let lastError: unknown

  for (const path of paths) {
    try {
      const data = await apiGet<{ items?: AclRoleDTO[] } | AclRoleDTO[]>(path)
      return { items: normalizeRolesPayload(data) }
    } catch (err) {
      lastError = err
      const status = (err as ApiError)?.status
      if (status !== 404 && status !== 403) throw err
    }
  }

  throw lastError
}

export async function createUser(payload: {
  name: string
  email: string
  roleId?: string
}): Promise<{ user: CrmUserDTO; message: string }> {
  return await apiSend<{ user: CrmUserDTO; message: string }>('/api/auth/users', 'POST', payload)
}
