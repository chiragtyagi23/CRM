export type ApiError = { message: string; status?: number; body?: unknown }

function baseUrl() {
  const raw = (import.meta.env as Record<string, string | undefined>).VITE_CRM_API_URL
  return (raw && raw.trim().length > 0 ? raw.trim() : 'http://localhost:4000').replace(/\/$/, '')
}

function authHeader(): Record<string, string> | undefined {
  try {
    const token = window.localStorage.getItem('crm_token')
    if (!token) return undefined
    return { Authorization: `Bearer ${token}` }
  } catch {
    return undefined
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, { headers: authHeader() })
  if (!res.ok) throw { message: `HTTP ${res.status}`, status: res.status, body: await safeJson(res) } satisfies ApiError
  return (await res.json()) as T
}

export async function apiSend<T>(path: string, method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', body?: unknown): Promise<T> {
  const auth = authHeader()
  const headers = body ? { 'Content-Type': 'application/json', ...(auth ?? {}) } : auth
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw { message: `HTTP ${res.status}`, status: res.status, body: await safeJson(res) } satisfies ApiError
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}


export type UploadImageResponse = {
  message: string
  url: string
  file: { filename: string; mimetype: string; size: number }
}

/** POST multipart file field `image`. Returns absolute URL you can store as `src`. */
export async function apiUploadImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${baseUrl()}/api/upload`, { method: 'POST', body: form })
  const body = await safeJson(res)
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`
    throw { message: msg, status: res.status, body } satisfies ApiError
  }
  const data = body as UploadImageResponse
  const path = data.url.startsWith('/') ? data.url : `/${data.url}`
  return `${baseUrl()}${path}`
}

/** POST multipart file field `video`. Returns absolute URL you can store and play. */
export async function apiUploadVideo(file: File): Promise<string> {
  const form = new FormData()
  form.append('video', file)
  const res = await fetch(`${baseUrl()}/api/upload/video`, { method: 'POST', body: form })
  const body = await safeJson(res)
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`
    throw { message: msg, status: res.status, body } satisfies ApiError
  }
  const data = body as UploadImageResponse
  const path = data.url.startsWith('/') ? data.url : `/${data.url}`
  return `${baseUrl()}${path}`
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

