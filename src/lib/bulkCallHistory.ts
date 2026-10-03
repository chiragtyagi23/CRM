export type BulkCallRow = {
  id: string
  batchId: string
  projectId: string | null
  projectTitle: string | null
  callSheetUrl: string | null
  name: string
  email: string | null
  mobile: string
  additionalInfo: Record<string, unknown> | null
  summary: string | null
  leadScore: string | null
  isLead: boolean | null
  callStatus: string
  callDuration: number | null
  transcriptJson?: unknown
  humanDiversion: boolean
  captureLeadId: string | null
  createdAt?: string
}

export type ConversationTurn = {
  role: 'agent' | 'caller' | 'note'
  text: string
}

export function resultLabel(row: Pick<BulkCallRow, 'captureLeadId' | 'callStatus' | 'isLead'>) {
  if (row.captureLeadId) return 'Added to leads'
  if (row.callStatus === 'not_sent') return 'Call not sent'
  if (row.isLead === true) return 'Can become a lead'
  if (row.isLead === false) return 'Cannot become a lead'
  return 'Waiting for the call'
}

export function projectLabel(row: Pick<BulkCallRow, 'projectTitle' | 'additionalInfo'>) {
  const title = String(row.projectTitle || '').trim()
  if (title) return title
  const pitched = infoText(row.additionalInfo, 'project_name')
  return pitched || 'Project not set'
}

export function pitchedProject(row: Pick<BulkCallRow, 'projectTitle' | 'additionalInfo'>) {
  const pitched = infoText(row.additionalInfo, 'project_name')
  const title = String(row.projectTitle || '').trim()
  if (!pitched || pitched.toLowerCase() === title.toLowerCase()) return ''
  return pitched
}

export function sheetFileName(url: string | null | undefined) {
  const raw = String(url || '').trim()
  if (!raw) return ''
  try {
    const path = new URL(raw).pathname
    return decodeURIComponent(path.split('/').pop() || '')
  } catch {
    const parts = raw.split('/')
    return decodeURIComponent(parts[parts.length - 1] || '')
  }
}

export function formatWhen(iso: string | undefined) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return ''
  const total = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(total / 60)
  const remain = total % 60
  if (minutes === 0) return `${remain}s`
  return `${minutes}m ${String(remain).padStart(2, '0')}s`
}

export function infoText(info: Record<string, unknown> | null | undefined, key: string) {
  const value = info?.[key]
  if (value == null) return ''
  return String(value).trim()
}

export function infoEntries(info: Record<string, unknown> | null | undefined) {
  if (!info || typeof info !== 'object') return []
  return Object.entries(info)
    .filter(([, value]) => value != null && String(value).trim() !== '' && String(value) !== '{}')
    .map(([key, value]) => ({
      key,
      label: key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      value:
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? String(value)
          : JSON.stringify(value),
    }))
}

export function conversationTurns(value: unknown): ConversationTurn[] {
  const list = turnList(value)
  if (!list) return []
  const turns: ConversationTurn[] = []
  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const text = String(row.content ?? row.text ?? row.message ?? '').trim()
    if (!text) continue
    const roleRaw = String(row.role ?? row.speaker ?? '').toLowerCase()
    const role =
      roleRaw === 'user' || roleRaw === 'customer' || roleRaw === 'caller'
        ? 'caller'
        : roleRaw === 'assistant' || roleRaw === 'agent' || roleRaw === 'bot'
          ? 'agent'
          : 'note'
    turns.push({ role, text })
  }
  return turns
}

function turnList(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  for (const key of ['conversation', 'messages', 'items', 'transcript']) {
    if (Array.isArray(obj[key])) return obj[key]
  }
  return null
}

export function batchHeading(rows: BulkCallRow[]) {
  if (rows.length === 1) return rows[0].name
  const names = rows.map((row) => row.name).filter(Boolean)
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} + ${names.length - 2} more`
}
