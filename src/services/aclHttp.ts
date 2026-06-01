import axios, { type AxiosError } from 'axios'

const LS_TOKEN = 'crm_token'

function baseUrl() {
  const raw = (import.meta.env as Record<string, string | undefined>).VITE_CRM_API_URL
  return (raw && raw.trim().length > 0 ? raw.trim() : 'http://localhost:4000').replace(/\/$/, '')
}

export const aclHttp = axios.create({
  baseURL: baseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

aclHttp.interceptors.request.use((config) => {
  try {
    const token = window.localStorage.getItem(LS_TOKEN)
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {
    // ignore
  }
  return config
})

aclHttp.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ error?: string; code?: string }>) => {
    const status = error.response?.status
    const code = error.response?.data?.code
    if (status === 401 && code === 'SESSION_EXPIRED') {
      window.dispatchEvent(new CustomEvent('crm:session-expired'))
    }
    return Promise.reject(error)
  },
)

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined
    return data?.error || err.message
  }
  if (err instanceof Error) return err.message
  return 'Request failed'
}
