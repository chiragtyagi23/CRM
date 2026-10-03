import { useEffect, useState } from 'react'
import { FiAlertCircle, FiX } from 'react-icons/fi'

import {
  DATA_FIELDS,
  missingRequiredFields,
  type ColumnMapping,
  type DataFieldKey,
  type FileColumn,
} from '../lib/bulkDataFields'

const fieldClass =
  'h-11 w-full rounded-xl border border-[#E8DCCB] bg-white px-3 text-[13px] text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none'

/** Mount only while open; the draft mapping is seeded from `mapping` on mount (re-key to reset it). */
type Props = {
  fileName: string
  columns: FileColumn[]
  mapping: ColumnMapping
  headerRow: number
  headerRowOptions: { index: number; label: string }[]
  onHeaderRowChange: (index: number) => void
  onClose: () => void
  onSave: (mapping: ColumnMapping) => void
}

export function MapDataFieldsModal({
  fileName,
  columns,
  mapping,
  headerRow,
  headerRowOptions,
  onHeaderRowChange,
  onClose,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<ColumnMapping>(mapping)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const missing = missingRequiredFields(draft)
  const labelOf = (key: DataFieldKey) => DATA_FIELDS.find((f) => f.key === key)?.label ?? key

  const setField = (header: string, value: DataFieldKey | '') => {
    setDraft((prev) => ({ ...prev, [header]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[#2E2E2E]/40" aria-label="Close field mapping" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-data-fields-title"
        className="relative flex max-h-[min(760px,90vh)] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl border border-[#E8DCCB] bg-white"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E8DCCB] px-6 py-5">
          <div className="min-w-0">
            <h2 id="map-data-fields-title" className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[#2E2E2E]">
              Map Contact Fields
            </h2>
            <p className="mt-1 mb-0 truncate text-[13px] text-[#8B7355]">
              Match the columns in <span className="font-semibold text-[#2E2E2E]">{fileName}</span> with contact fields.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8B7355] hover:bg-[#F5EFE7]"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 flex gap-3 rounded-xl border border-[#e7ddcf] bg-[#F5EFE7] p-4">
            <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#8B7355]" aria-hidden />
            <p className="m-0 text-[13px] text-[#8B7355]">
              <strong className="font-semibold text-[#2E2E2E]">Name</strong>,{' '}
              <strong className="font-semibold text-[#2E2E2E]">Number</strong>, and{' '}
              <strong className="font-semibold text-[#2E2E2E]">Email</strong> are required.{' '}
              <strong className="font-semibold text-[#2E2E2E]">Location</strong>,{' '}
              <strong className="font-semibold text-[#2E2E2E]">Budget</strong>, and{' '}
              <strong className="font-semibold text-[#2E2E2E]">BHK</strong> are optional. Columns left as{' '}
              <strong className="font-semibold text-[#2E2E2E]">Keep original header</strong> are still saved under
              their file header, so no data is lost.
            </p>
          </div>

          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <label htmlFor="map-data-header-row" className="shrink-0 text-[13px] font-semibold text-[#2E2E2E]">
              Header row
            </label>
            <select
              id="map-data-header-row"
              value={headerRow}
              onChange={(e) => onHeaderRowChange(Number(e.target.value))}
              className={fieldClass}
            >
              {headerRowOptions.map((o) => (
                <option key={o.index} value={o.index}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#E8DCCB]">
            <table className="w-full table-fixed text-left text-[13px]">
              <thead className="bg-[#FAF7F2]">
                <tr className="border-b border-[#E8DCCB]">
                  <th className="px-4 py-3 font-semibold text-[#8B7355]">File header</th>
                  <th className="hidden px-4 py-3 font-semibold text-[#8B7355] sm:table-cell">Preview</th>
                  <th className="px-4 py-3 font-semibold text-[#8B7355]">Contact field</th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col) => {
                  const value = draft[col.header] ?? ''
                  const takenElsewhere = new Set(
                    Object.entries(draft)
                      .filter(([h, v]) => h !== col.header && v)
                      .map(([, v]) => v),
                  )
                  return (
                    <tr key={col.header} className="border-b border-[#E8DCCB] last:border-b-0">
                      <td className="px-4 py-3 align-middle font-semibold break-words text-[#2E2E2E]">{col.header}</td>
                      <td className="hidden px-4 py-3 align-middle sm:table-cell">
                        {col.preview.length > 0 ? (
                          <span className="block truncate text-[#2E2E2E]" title={col.preview.join(', ')}>
                            {col.preview.join(', ')}
                          </span>
                        ) : (
                          <span className="italic text-[#8B7355]">No preview</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <select
                          aria-label={`Contact field for ${col.header}`}
                          value={value}
                          onChange={(e) => setField(col.header, e.target.value as DataFieldKey | '')}
                          className={fieldClass}
                        >
                          <option value="">Keep original header</option>
                          {DATA_FIELDS.map((f) => (
                            <option key={f.key} value={f.key} disabled={takenElsewhere.has(f.key)}>
                              {f.label}
                              {f.required ? ' *' : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#E8DCCB] bg-[#FAF7F2] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className={`m-0 text-[12px] font-medium ${missing.length > 0 ? 'text-red-700' : 'text-[#6FAF8F]'}`}>
            {missing.length > 0
              ? `Map required field${missing.length === 1 ? '' : 's'}: ${missing.map(labelOf).join(', ')}`
              : 'All required fields are mapped.'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="crm-btn-secondary h-10">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              disabled={missing.length > 0}
              className="crm-btn-primary h-10"
            >
              Save Mapping
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
