import { apiGet } from './crmApi'

export type CrmUserDTO = {
  id: string
  name: string
  email: string
  role: string
}

export async function fetchUsers(params?: { role?: string }): Promise<{ items: CrmUserDTO[] }> {
  const q = params?.role ? `?role=${encodeURIComponent(params.role)}` : ''
  return await apiGet<{ items: CrmUserDTO[] }>(`/api/auth/users${q}`)
}

