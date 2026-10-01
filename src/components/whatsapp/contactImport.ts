import * as XLSX from 'xlsx'

import type { WaContactImportRow } from '../../lib/whatsappApi'

const PHONE_HEADERS = ['phone', 'number', 'mobile', 'whatsapp', 'whatsapp number', 'phone number', 'contact']
const NAME_HEADERS = ['name', 'full name', 'contact name']
const TAG_HEADERS = ['tags', 'tag', 'labels', 'group']

/** Tags within a cell may be separated by ; | or , */
export function splitTags(value: unknown): string[] {
  return String(value ?? '')
    .split(/[;|,]/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function pick(row: Record<string, unknown>, names: string[]): unknown {
  for (const [k, v] of Object.entries(row)) {
    if (names.includes(k.trim().toLowerCase())) return v
  }
  return undefined
}

function rowsFromObjects(objects: Record<string, unknown>[]): WaContactImportRow[] {
  return objects
    .map((o) => ({
      name: String(pick(o, NAME_HEADERS) ?? '').trim() || undefined,
      phone: String(pick(o, PHONE_HEADERS) ?? '').trim(),
      tags: splitTags(pick(o, TAG_HEADERS)),
    }))
    .filter((r) => r.phone)
}

/**
 * Reads a sheet with a header row (phone/number/mobile + optional name, tags). Without a
 * recognisable header, columns are taken as name, phone, tags — or phone only for one column.
 */
function rowsFromSheet(sheet: XLSX.WorkSheet): WaContactImportRow[] {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, blankrows: false })
  if (!grid.length) return []
  const header = (grid[0] as unknown[]).map((h) => String(h ?? '').trim().toLowerCase())
  if (header.some((h) => PHONE_HEADERS.includes(h))) {
    return rowsFromObjects(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: '' }))
  }
  return grid
    .map((cells) => {
      const c = (cells as unknown[]).map((v) => String(v ?? '').trim())
      return c.length === 1 ? { phone: c[0] } : { name: c[0] || undefined, phone: c[1] ?? '', tags: splitTags(c[2]) }
    })
    .filter((r) => r.phone)
}

export async function parseContactsFile(file: File): Promise<WaContactImportRow[]> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', raw: false })
  const first = workbook.Sheets[workbook.SheetNames[0]]
  return first ? rowsFromSheet(first) : []
}

export function parseContactsText(text: string): WaContactImportRow[] {
  const workbook = XLSX.read(text, { type: 'string', raw: false })
  const first = workbook.Sheets[workbook.SheetNames[0]]
  return first ? rowsFromSheet(first) : []
}

export function downloadContactsTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['name', 'phone', 'tags'],
    ['Customer A', '+91 90000 00000', 'site-visit; hot'],
    ['Customer B', '+971 50 000 0000', 'nri'],
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts')
  XLSX.writeFile(wb, 'whatsapp_contacts_template.xlsx')
}
