import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCalendar, FiChevronLeft, FiDatabase, FiMail, FiPhone, FiUser } from 'react-icons/fi'

import { UNNAMED_DATASET, fetchBulkDataById, type BulkDataRecord } from '../lib/bulkDataApi'
import { DATA_FIELDS } from '../lib/bulkDataFields'
import { fmtLongDateTime } from '../utils/format'

type DetailField = { key: string; label: string; value: string; fileHeader?: string }

/**
 * Optional fields we mapped (location, budget, bhk) use our label and note the file header they came from;
 * every other column is labelled with its original file header.
 */
function detailFields(record: BulkDataRecord): DetailField[] {
  const meta = record.meta ?? {}
  const headers = record.mapping?.meta ?? {}
  const mapped = DATA_FIELDS.filter((f) => !f.required && f.key in meta).map((f) => ({
    key: f.key,
    label: f.label,
    value: meta[f.key],
    fileHeader: headers[f.key],
  }))
  const mappedKeys = new Set<string>(mapped.map((f) => f.key))
  const rest = Object.keys(meta)
    .filter((k) => !mappedKeys.has(k))
    .map((k) => ({ key: k, label: headers[k] || k, value: meta[k] }))
  return [...mapped, ...rest]
}

function FileHeaderNote({ header, label }: { header?: string; label: string }) {
  if (!header || header === label) return null
  return <span className="text-[11px] text-[#8B7355]/80">File column: {header}</span>
}

export function BulkDataDetails({ id }: { id: string }) {
  const navigate = useNavigate()
  const [record, setRecord] = useState<BulkDataRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchBulkDataById(id)
      .then((r) => {
        if (!cancelled) setRecord(r)
      })
      .catch(() => {
        if (!cancelled) setRecord(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const mapping = record?.mapping ?? {}
  const fields = record ? detailFields(record) : []

  return (
    <section className="w-full">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-1 py-2 text-[12px] font-medium text-[#8B7355] hover:text-[#2E2E2E]"
        onClick={() => navigate('/bulk-data')}
      >
        <FiChevronLeft size={16} aria-hidden />
        Back to Bulk Data
      </button>

      <section className="mt-3 px-1">
        {loading ? (
          <p className="m-0 px-1 py-7 text-[13px] text-[#8B7355]">Loading data…</p>
        ) : !record ? (
          <p className="m-0 px-1 py-7 text-[13px] text-[#8B7355]">Record not found.</p>
        ) : (
          <div className="space-y-5">
            <section className="rounded-xl border border-[#8B7355]/10 bg-white px-8 py-7">
              <div className="text-[22px] font-bold tracking-[-0.03em] text-[#2E2E2E]">{record.name}</div>
             

              <div className="mt-4 grid grid-cols-1 gap-y-3 text-[12px] text-[#8B7355] min-[820px]:grid-cols-2 min-[820px]:gap-x-10">
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-2">
                    <FiPhone size={16} aria-hidden />
                    <span className="font-medium">{record.phone}</span>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="inline-flex items-center gap-2">
                    <FiMail size={16} aria-hidden />
                    <span className="font-medium break-all">{record.email}</span>
                  </span>
                </div>
                <span className="inline-flex items-center gap-2">
                  <FiCalendar size={16} aria-hidden />
                  <span className="font-medium">Imported {fmtLongDateTime(record.created_at)}</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <FiUser size={16} aria-hidden />
                  <span className="font-medium">Uploaded by {record.uploader?.name ?? '—'}</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <FiDatabase size={16} aria-hidden />
                  <span className="font-medium">Dataset: {record.datasetName || UNNAMED_DATASET}</span>
                </span>
              </div>
            </section>

            <section className="rounded-xl border border-[#8B7355]/10 bg-white px-8 py-7">
              <p className="m-0 mb-5 text-[16px] font-semibold text-[#2E2E2E]">Details</p>
              {fields.length === 0 ? (
                <p className="m-0 text-[13px] text-[#8B7355]">No other columns were imported for this row.</p>
              ) : (
                <dl className="m-0 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  {fields.map((f) => (
                    <div key={f.key} className="min-w-0">
                      <dt className="text-[12px] text-[#8B7355]">{f.label}</dt>
                      <dd className="m-0 mt-1 text-[14px] break-words text-[#2E2E2E]">{f.value || '—'}</dd>
                      <FileHeaderNote header={f.fileHeader} label={f.label} />
                    </div>
                  ))}
                </dl>
              )}
            </section>
          </div>
        )}
      </section>
    </section>
  )
}
