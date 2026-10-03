/** Contact fields a bulk data file column can be mapped to. */
export type DataFieldKey = 'name' | 'phone' | 'email' | 'location' | 'budget' | 'bhk'

/** Column → contact field; `''` keeps the column under its original header. */
export type ColumnMapping = Record<string, DataFieldKey | ''>

export type FileColumn = {
  header: string
  preview: string[]
}

export type ParsedSheet = {
  columns: FileColumn[]
  rows: { rowNumber: number; values: Record<string, string> }[]
}

export type MappedDataRow = {
  rowNumber: number
  name: string
  phone: string
  email: string
  /** Mapped optional fields under our keys (location, budget, bhk) plus unmapped columns under their original header, so no file data is lost. */
  meta: Record<string, string>
  isValid: boolean
  errors: string[]
}

export const DATA_FIELDS: { key: DataFieldKey; label: string; required: boolean }[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'phone', label: 'Number', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'location', label: 'Location', required: false },
  { key: 'budget', label: 'Budget', required: false },
  { key: 'bhk', label: 'BHK', required: false },
]

export const REQUIRED_DATA_FIELDS = DATA_FIELDS.filter((f) => f.required).map((f) => f.key)

const FIELD_ALIASES: Record<DataFieldKey, string[]> = {
  name: ['name', 'fullname', 'customer', 'customername', 'client', 'clientname', 'contactname', 'personname'],
  phone: ['phone', 'phoneno', 'phonenumber', 'mobile', 'mobileno', 'mobilenumber', 'contact', 'contactno', 'contactnumber', 'whatsapp'],
  email: ['email', 'emailid', 'emailaddress', 'mail'],
  location: ['location', 'city', 'area', 'locality', 'address', 'preferredlocation'],
  budget: ['budget', 'price', 'pricerange', 'budgetrange'],
  bhk: ['bhk', 'configuration', 'config', 'unittype', 'bedrooms'],
}

export const PHONE_REGEX = /^[+]?[0-9\s-]{10,18}$/
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const BULK_FILE_ACCEPT =
  '.csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'

export function isSupportedBulkFile(file: File) {
  return /\.(csv|xlsx?)$/i.test(file.name)
}

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[\s_.\-/]/g, '')
const cellText = (cell: unknown) => String(cell ?? '').trim()
const isBlankRow = (row: unknown[]) => row.every((cell) => cellText(cell) === '')

const HEADER_SCAN_ROWS = 20

/**
 * Sheets often start with a title or notes above the real header row.
 * Pick the row (within the first few) that looks most like headers: known field names first, then most filled cells.
 */
export function detectHeaderRow(matrix: unknown[][]): number {
  const known = new Set(Object.values(FIELD_ALIASES).flat())
  let best = 0
  let bestScore = -1
  matrix.slice(0, HEADER_SCAN_ROWS).forEach((row, i) => {
    const cells = row.map(cellText).filter(Boolean)
    if (cells.length < 2) return
    const hits = cells.filter((c) => known.has(normalizeHeader(c))).length
    const score = hits * 100 + cells.length
    if (score > bestScore) {
      best = i
      bestScore = score
    }
  })
  return best
}

/** Non-blank rows near the top, for the "header row" picker. */
export function headerRowCandidates(matrix: unknown[][]): number[] {
  return matrix
    .slice(0, HEADER_SCAN_ROWS)
    .map((row, i) => (isBlankRow(row) ? -1 : i))
    .filter((i) => i !== -1)
}

/**
 * Rows below `headerRowIndex` become records keyed by that row's cells (blank/duplicate headers get a unique fallback).
 * `firstSheetRow` is the 1-based sheet row of `matrix[0]`, so row numbers match what the user sees in Excel.
 */
export function sheetMatrixToParsed(matrix: unknown[][], headerRowIndex: number, firstSheetRow = 1): ParsedSheet {
  const headerRow = matrix[headerRowIndex] ?? []
  const seen = new Map<string, number>()
  const headers = headerRow.map((cell, i) => {
    const base = cellText(cell) || `Column ${i + 1}`
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base} (${count + 1})`
  })

  const rows = matrix
    .slice(headerRowIndex + 1)
    .map((r, i) => ({ r, rowNumber: firstSheetRow + headerRowIndex + 1 + i }))
    .filter(({ r }) => !isBlankRow(r))
    .map(({ r, rowNumber }) => ({
      rowNumber,
      values: Object.fromEntries(headers.map((h, i) => [h, cellText(r[i])])),
    }))

  // Drop untitled columns that hold no data (e.g. trailing formatted-but-empty cells).
  const columns = headers
    .filter((h, i) => cellText(headerRow[i]) !== '' || rows.some((row) => row.values[h] !== ''))
    .map((header) => ({
      header,
      preview: rows
        .map((row) => row.values[header])
        .filter(Boolean)
        .slice(0, 2),
    }))

  return { columns, rows }
}

/** Guess a contact field for each column from common header names. */
export function autoMapColumns(columns: FileColumn[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const used = new Set<DataFieldKey>()
  for (const { header } of columns) {
    const n = normalizeHeader(header)
    const hit = DATA_FIELDS.find((f) => !used.has(f.key) && FIELD_ALIASES[f.key].includes(n))
    mapping[header] = hit?.key ?? ''
    if (hit) used.add(hit.key)
  }
  return mapping
}

export function missingRequiredFields(mapping: ColumnMapping): DataFieldKey[] {
  const mapped = new Set(Object.values(mapping))
  return REQUIRED_DATA_FIELDS.filter((k) => !mapped.has(k))
}

/** Stored with the data: which file header fed each field, mirroring the `meta` keys built in `buildMappedRows`. */
export type MappingRecord = {
  name: string
  phone: string
  email: string
  meta: Record<string, string>
}

export function buildMappingRecord(mapping: ColumnMapping): MappingRecord {
  const record: MappingRecord = { name: '', phone: '', email: '', meta: {} }
  for (const [header, key] of Object.entries(mapping)) {
    if (!key) record.meta[header] = header
    else if (key === 'name' || key === 'phone' || key === 'email') record[key] = header
    else record.meta[key] = header
  }
  return record
}

/** Apply the mapping to every row and validate required fields. */
export function buildMappedRows(rows: ParsedSheet['rows'], mapping: ColumnMapping): MappedDataRow[] {
  const headerFor = (key: DataFieldKey) => Object.keys(mapping).find((h) => mapping[h] === key)

  return rows.map(({ rowNumber, values }) => {
    const get = (key: DataFieldKey) => {
      const h = headerFor(key)
      return h ? values[h] ?? '' : ''
    }
    const meta: Record<string, string> = {}
    for (const [header, key] of Object.entries(mapping)) {
      if (!key) meta[header] = values[header] ?? ''
      else if (!REQUIRED_DATA_FIELDS.includes(key)) meta[key] = values[header] ?? ''
    }

    const name = get('name')
    const phone = get('phone')
    const email = get('email')
    const errors: string[] = []

    if (!name) errors.push('Name is required')
    if (!phone) errors.push('Number is required')
    else if (!PHONE_REGEX.test(phone)) errors.push('Invalid number format')
    if (!email) errors.push('Email is required')
    else if (!EMAIL_REGEX.test(email)) errors.push('Invalid email format')

    return {
      rowNumber,
      name,
      phone,
      email,
      meta,
      isValid: errors.length === 0,
      errors,
    }
  })
}
