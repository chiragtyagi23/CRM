import type { ApiError } from '../../lib/crmApi'

export function extractError(err: unknown): string {
  const apiErr = err as ApiError | undefined
  const body = apiErr?.body as { error?: unknown } | undefined
  if (body && typeof body.error === 'string' && body.error.trim()) return body.error
  return apiErr?.message ?? 'Something went wrong'
}

export function formatDate(iso?: string | null) {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function roleName(role: unknown): string | null {
  if (!role) return null
  if (typeof role === 'string') return role.trim() || null
  const name = (role as { name?: unknown }).name
  return typeof name === 'string' && name.trim() ? name : null
}

export const card = 'rounded-2xl border border-[#8B7355]/10 bg-white p-5 shadow-[0_1px_2px_rgba(46,46,46,0.04)] min-[520px]:p-6'
export const cardTitle = 'text-[15px] font-bold text-[#2E2E2E]'
export const cardSubtitle = 'mt-0.5 text-[12px] font-medium text-[#8B7355]'
export const btnPrimary =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#8B7355] px-4 text-[12px] font-semibold text-white transition hover:bg-[#6d5a43] disabled:cursor-not-allowed disabled:opacity-60'
export const btnGhost =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E8DCCB] bg-white px-4 text-[12px] font-semibold text-[#2E2E2E] transition hover:bg-[#F5EFE7] disabled:cursor-not-allowed disabled:opacity-60'
export const btnDanger =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E8DCCB] bg-white px-4 text-[12px] font-semibold text-[#D96B6B] transition hover:bg-[#FBEDED] disabled:cursor-not-allowed disabled:opacity-60'
export const iconBtn =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8B7355] transition hover:bg-[#F5EFE7] hover:text-[#2E2E2E] disabled:opacity-50'
export const iconBtnDanger =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8B7355] transition hover:bg-[#FBEDED] hover:text-[#D96B6B] disabled:opacity-50'
export const input =
  'h-10 w-full rounded-lg border border-[#E8DCCB] bg-white px-3 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355]/60 focus:border-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/15'
