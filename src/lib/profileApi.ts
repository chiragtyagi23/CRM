import { apiGet, apiSend, authHeader, getCrmApiBaseUrl } from './crmApi'
import type { ApiError } from './crmApi'

export type MyProfileDTO = {
  id: string
  name: string
  email: string
  role: { id: string; name: string } | null
  avatarUrl: string | null
  phone: string | null
  designation: string | null
  location: string | null
  linkedinUrl: string | null
  summary: string | null
  createdAt: string | null
  updatedAt: string | null
}

/** Fields editable via PATCH — null or '' clears the value. */
export type MyProfilePatch = Partial<Pick<MyProfileDTO, 'phone' | 'designation' | 'location' | 'linkedinUrl'>>

export type MyStatsDTO = {
  totalLeads: number
  leadsThisMonth: number
  leadsLastMonth: number
  hotLeads: number
  bookedLeads: number
  upcomingCallbacks: number
  siteVisits: number
  monthly: { month: string; count: number }[]
  stages: { stage: string; count: number }[]
}

export async function fetchMyProfile(): Promise<MyProfileDTO> {
  return await apiGet<MyProfileDTO>('/api/auth/me/profile')
}

export async function updateMyProfile(patch: MyProfilePatch): Promise<MyProfileDTO> {
  return await apiSend<MyProfileDTO>('/api/auth/me/profile', 'PATCH', patch)
}

/** POST multipart field `avatar`; server crops to a 512px square WebP. */
export async function uploadMyAvatar(file: File): Promise<MyProfileDTO> {
  const form = new FormData()
  form.append('avatar', file)
  const res = await fetch(`${getCrmApiBaseUrl()}/api/auth/me/avatar`, {
    method: 'POST',
    headers: authHeader(),
    body: form,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw { message: `HTTP ${res.status}`, status: res.status, body } satisfies ApiError
  return body as MyProfileDTO
}

export async function deleteMyAvatar(): Promise<void> {
  await apiSend<void>('/api/auth/me/avatar', 'DELETE')
}

export async function fetchMyStats(): Promise<MyStatsDTO> {
  return await apiGet<MyStatsDTO>('/api/auth/me/stats')
}

export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return await apiSend<{ message: string }>('/api/auth/me/password', 'POST', { currentPassword, newPassword })
}
