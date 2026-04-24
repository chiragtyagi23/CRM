export type ApiError = { message: string; status?: number; body?: unknown }

function baseUrl() {
  const raw = (import.meta.env as Record<string, string | undefined>).VITE_CRM_API_URL
  return (raw && raw.trim().length > 0 ? raw.trim() : 'http://localhost:4000').replace(/\/$/, '')
}

/** Same origin as the CRM API (for resolving `/uploads/...` draft URLs). */
export function getCrmApiBaseUrl(): string {
  return baseUrl()
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

export type ApiUploadImageOptions = { /** Store on API disk only; use {@link promoteLocalDraftImageUrl} or save-time upload for S3. */ draft?: boolean }

/** POST multipart file field `image`. Returns absolute URL you can store as `src`. Pass `{ draft: true }` while editing; omit on final save to send to S3 when configured. */
export async function apiUploadImage(file: File, opts?: ApiUploadImageOptions): Promise<string> {
  const form = new FormData()
  form.append('image', file)
  const q = opts?.draft ? '?draft=1' : ''
  const res = await fetch(`${baseUrl()}/api/upload${q}`, { method: 'POST', body: form })
  const body = await safeJson(res)
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`
    throw { message: msg, status: res.status, body } satisfies ApiError
  }
  const data = body as UploadImageResponse
  return resolveUploadPublicUrl(data.url)
}

function resolveUploadPublicUrl(url: string): string {
  const u = url.trim()
  if (/^https?:\/\//i.test(u)) return u
  const path = u.startsWith('/') ? u : `/${u}`
  return `${baseUrl()}${path}`
}

/** POST multipart file field `video`. Returns absolute URL you can store and play. */
export async function apiUploadVideo(file: File, opts?: ApiUploadImageOptions): Promise<string> {
  const form = new FormData()
  form.append('video', file)
  const q = opts?.draft ? '?draft=1' : ''
  const res = await fetch(`${baseUrl()}/api/upload/video${q}`, { method: 'POST', body: form })
  const body = await safeJson(res)
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : `HTTP ${res.status}`
    throw { message: msg, status: res.status, body } satisfies ApiError
  }
  const data = body as UploadImageResponse
  return resolveUploadPublicUrl(data.url)
}

/**
 * If `url` points at a draft file on this API (`/uploads/...`), re-uploads it via POST /api/upload (final / S3).
 * Otherwise returns `url` unchanged (e.g. already on S3 or external).
 */
export async function promoteLocalDraftImageUrl(url: string): Promise<string> {
  const u = (url || '').trim()
  if (!u) return u
  const origin = baseUrl()
  const uploadsSegment = '/uploads/'
  let fetchUrl: string | null = null
  if (u.startsWith('/') && u.includes(uploadsSegment)) {
    fetchUrl = `${origin}${u}`
  } else if (u.startsWith(origin) && u.includes(uploadsSegment)) {
    fetchUrl = u
  }
  if (!fetchUrl) return u

  const res = await fetch(fetchUrl)
  if (!res.ok) return u
  const blob = await res.blob()
  const name =
    decodeURIComponent(fetchUrl.split('/').pop() || 'image.jpg')
      .split('?')[0]
      .replace(/[^\w.\-]+/g, '_') || 'image.jpg'
  const file = new File([blob], name, { type: blob.type || 'image/jpeg' })
  return apiUploadImage(file)
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

