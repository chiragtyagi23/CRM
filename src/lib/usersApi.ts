import { apiGet } from './crmApi'
import type { CrmUserDTO } from '../types/dtos'

export type { CrmUserDTO } from '../types/dtos'

export async function fetchUsers(): Promise<{ items: CrmUserDTO[] }> {
  return await apiGet<{ items: CrmUserDTO[] }>('/api/auth/users')
}
