import { apiGet, apiSend } from './crmApi'
import type { AuthResponseDTO } from '../types/dtos'

export type { AuthResponseDTO, AuthUserDTO } from '../types/dtos'

export async function login(payload: { email: string; password: string }): Promise<AuthResponseDTO> {
  return await apiSend<AuthResponseDTO>('/api/auth/login', 'POST', payload)
}

export async function fetchMe(): Promise<{ user: AuthResponseDTO['user']; access: AuthResponseDTO['access'] }> {
  return await apiGet<{ user: AuthResponseDTO['user']; access: AuthResponseDTO['access'] }>('/api/auth/me')
}

export async function forgotPassword(payload: { email: string }): Promise<{ message: string }> {
  return await apiSend<{ message: string }>('/api/auth/forgot-password', 'POST', payload)
}

export async function resetPassword(payload: { token: string; password: string }): Promise<{ message: string }> {
  return await apiSend<{ message: string }>('/api/auth/reset-password', 'POST', payload)
}
