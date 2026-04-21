import { apiSend } from './crmApi'

export type AuthUserDTO = {
  id: string
  name: string
  email: string
  role?: 'admin' | 'user' | 'no-role'
}

export type AuthResponseDTO = {
  token: string
  user: AuthUserDTO
}

export async function signup(payload: {
  name: string
  email: string
  password: string
  role?: 'admin' | 'user'
}): Promise<AuthResponseDTO> {
  return await apiSend<AuthResponseDTO>('/api/auth/signup', 'POST', payload)
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponseDTO> {
  return await apiSend<AuthResponseDTO>('/api/auth/login', 'POST', payload)
}

