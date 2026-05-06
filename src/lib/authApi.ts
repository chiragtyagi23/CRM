import { apiSend } from './crmApi'
import type { AuthResponseDTO } from '../types/dtos'

export type { AuthResponseDTO, AuthUserDTO } from '../types/dtos'

export async function signup(payload: {
  name: string
  email: string
  password: string
  role?: null
}): Promise<AuthResponseDTO> {
  return await apiSend<AuthResponseDTO>('/api/auth/signup', 'POST', payload)
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponseDTO> {
  return await apiSend<AuthResponseDTO>('/api/auth/login', 'POST', payload)
}
