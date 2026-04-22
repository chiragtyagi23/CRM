import { useEffect, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiDownload,
  FiTrash2,
  FiUpload,
  FiXCircle,
} from 'react-icons/fi'

import { apiGet } from '../lib/crmApi'
import {
  BULK_UPLOAD_LEAVE_MESSAGE,
  registerBulkUploadDirty,
} from '../lib/bulkUploadNavigation'
import { createCaptureLeadsBulk } from '../lib/captureLeadsApi'
import { useAppDispatch } from '../store/hooks'
import { loadCaptureLeads } from '../store/captureLeadsSlice'

type CampaignRow = { id: string; title: string }

type UploadedLead = {
  rowNumber: number
  name: string
  phone: string
  email: string
  isValid: boolean
  errors: string[]
}

const PHONE_REGEX = /^[+]?[0-9\s-]{10,18}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** One sheet row → validated lead (sync). `sheetRowIndex` is 0-based index in `sheet_to_json` (row 1 header → first data row index 0 → Excel row 2). */
function parseLeadRowFromSheet(row: Record<string, unknown>, sheetRowIndex: number): UploadedLead {
  const name = row['Name'] ?? row['name'] ?? ''
  const phone =
    row['Mobile No.'] ?? row['Mobile No'] ?? row['mobile'] ?? row['Phone'] ?? row['phone'] ?? ''
  const email = row['Email Id'] ?? row['Email ID'] ?? row['email'] ?? ''

  const errors: string[] = []

  if (!name || String(name).trim() === '') {
    errors.push('Name is required')
  }

  if (!phone || String(phone).trim() === '') {
    errors.push('Mobile No. is required')
  } else {
    const phoneStr = String(phone).trim()
    if (!PHONE_REGEX.test(phoneStr)) {
      errors.push('Invalid phone number format')
    }
  }

  if (!email || String(email).trim() === '') {
    errors.push('Email Id is required')
  } else {
    const emailStr = String(email).trim()
    if (!EMAIL_REGEX.test(emailStr)) {
      errors.push('Invalid email format')
    }
  }

  return {
    rowNumber: sheetRowIndex + 2,
    name: String(name).trim(),
    phone: String(phone).trim(),
    email: String(email).trim(),
    isValid: errors.length === 0,
    errors,
  }
}

/** Parse rows in chunks with `Promise.all` per chunk and `await` between chunks so the UI can update while processing large files. */
async function parseLeadRowsWithPromiseAll(rows: Record<string, unknown>[], chunkSize = 150): Promise<UploadedLead[]> {
  const out: UploadedLead[] = []
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize)
    const chunk = await Promise.all(
      slice.map((row, j) => Promise.resolve().then(() => parseLeadRowFromSheet(row, i + j))),
    )
    out.push(...chunk)
  }
  return out
}

export function BulkUploadLeads() {
  const dispatch = useAppDispatch()
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [uploadedLeads, setUploadedLeads] = useState<UploadedLead[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [flash, setFlash] = useState<null | { type: 'ok' | 'err'; message: string }>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dirtyRef = useRef(false)

  const dirty =
    isProcessing || isUploading || selectedFile !== null || uploadedLeads.length > 0
  dirtyRef.current = dirty

  useEffect(() => {
    return registerBulkUploadDirty(() => dirtyRef.current)
  }, [])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  /** In-app hash links (e.g. header). On cancel, block navigation; on OK, allow default hash change. */
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      if (!dirtyRef.current) return
      const el = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      if (!el) return
      const href = el.getAttribute('href')?.trim() || ''
      if (!href.startsWith('#') || href === '#leads/bulk-upload') return
      if (window.confirm(BULK_UPLOAD_LEAVE_MESSAGE)) return
      e.preventDefault()
      e.stopPropagation()
    }
    document.addEventListener('click', onClickCapture, true)
    return () => document.removeEventListener('click', onClickCapture, true)
  }, [])

  useEffect(() => {
    apiGet<{ items: CampaignRow[] }>('/api/campaigns')
      .then((d) => setCampaigns(Array.isArray(d.items) ? d.items : []))
      .catch(() => setCampaigns([]))
      .finally(() => setCampaignsLoading(false))
  }, [])

  const selectedCampaignTitle =
    campaigns.find((c) => c.id === selectedCampaignId)?.title?.trim() || ''

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setUploadedLeads([])

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]

      const processedLeads = await parseLeadRowsWithPromiseAll(jsonData)

      setUploadedLeads(processedLeads)
      setFlash({ type: 'ok', message: `Processed ${processedLeads.length} rows from Excel file.` })
      window.setTimeout(() => setFlash(null), 4000)
    } catch {
      setFlash({ type: 'err', message: 'Error processing file. Please check the file format.' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const okType =
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      /\.xlsx?$/i.test(file.name)
    if (okType) {
      setSelectedFile(file)
      void processFile(file)
    } else {
      setFlash({ type: 'err', message: 'Please select a valid Excel file (.xlsx or .xls).' })
    }
  }

  const handleDownloadTemplate = () => {
    const template = [
      { Name: 'John Doe', 'Mobile No.': '+91 98765 43210', 'Email Id': 'john@example.com' },
      { Name: 'Jane Smith', 'Mobile No.': '+91 87654 32109', 'Email Id': 'jane@example.com' },
      { Name: 'Mike Johnson', 'Mobile No.': '+91 76543 21098', 'Email Id': 'mike@example.com' },
    ]
    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Leads Template')
    XLSX.writeFile(wb, 'leads_upload_template.xlsx')
    setFlash({ type: 'ok', message: 'Template downloaded successfully.' })
    window.setTimeout(() => setFlash(null), 3000)
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setUploadedLeads([])
    setSelectedCampaignId('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async () => {
    if (!selectedCampaignId) {
      setFlash({ type: 'err', message: 'Please select a campaign.' })
      return
    }

    if (uploadedLeads.length === 0) {
      setFlash({ type: 'err', message: 'No rows to upload. Select an Excel file first.' })
      return
    }

    setIsUploading(true)
    const sourceLabel = selectedCampaignTitle || 'Bulk upload'

    try {
      const res = await createCaptureLeadsBulk({
        source: sourceLabel,
        leads: uploadedLeads.map((lead) => ({
          name: lead.name,
          number: lead.phone,
          email: lead.email,
        })),
      })

      await dispatch(loadCaptureLeads()).unwrap()
      setUploadedLeads([])
      setSelectedFile(null)
      setSelectedCampaignId('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setFlash({
        type: 'ok',
        message: `Successfully uploaded ${res.count} lead(s).`,
      })
      window.setTimeout(() => {
        window.location.hash = '#leads'
      }, 800)
    } catch (e: unknown) {
      const err = e as { message?: string; body?: unknown }
      let msg = err.message ? String(err.message) : 'Upload failed.'
      const body = err.body
      if (body && typeof body === 'object' && body !== null) {
        const o = body as {
          message?: string
          error?: string
          failures?: { rowNumber: number; errors: string[] }[]
        }
        if (typeof o.message === 'string') msg = o.message
        else if (typeof o.error === 'string') msg = o.error
        if (Array.isArray(o.failures) && o.failures.length > 0) {
          const merged = uploadedLeads.map((row) => {
            const hit = o.failures!.find((f) => f.rowNumber === row.rowNumber)
            if (!hit) return row
            return {
              ...row,
              isValid: false,
              errors: [...new Set([...row.errors, ...hit.errors])],
            }
          })
          setUploadedLeads(merged)
        }
      }
      setFlash({ type: 'err', message: msg })
    } finally {
      setIsUploading(false)
    }
  }

  const validLeadsCount = uploadedLeads.filter((lead) => lead.isValid).length
  const errorLeadsCount = uploadedLeads.filter((lead) => !lead.isValid).length

  return (
    <section className="mx-auto box-border w-full max-w-[1280px] px-4 py-6">
      {flash ? (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-[13px] font-medium ${
            flash.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {flash.message}
        </div>
      ) : null}

      <div className="mb-8">
        <button
          type="button"
          className="mb-4 inline-flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] font-semibold text-[#80654a] hover:text-[#5c4835]"
          onClick={() => {
            if (dirty && !window.confirm(BULK_UPLOAD_LEAVE_MESSAGE)) return
            window.location.hash = '#leads'
          }}
        >
          <FiArrowLeft className="h-5 w-5" aria-hidden />
          Back to Leads
        </button>
        <div className="flex flex-col gap-2">
        <p className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-gray-900">Bulk Upload Leads</p>
        <p className="mt-1 text-[14px] font-medium text-gray-500">Upload multiple leads at once using an Excel file</p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-900/5 bg-white p-6 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <div className="mb-6 flex gap-3 rounded-xl border border-[#e7ddcf] bg-[#faf6ef] p-4">
          <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#80654a]" aria-hidden />
          <div className="text-[13px] text-gray-800">
            <p className="m-0 mb-1 font-semibold">Upload Excel file with the following columns:</p>
            <ul className="m-0 list-disc pl-5 text-gray-600">
              <li>
                <strong>Name</strong> — full name (required)
              </li>
              <li>
                <strong>Mobile No.</strong> — phone with country code (required)
              </li>
              <li>
                <strong>Email Id</strong> — valid email (required)
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-6">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#80654a] px-4 py-2.5 text-[13px] font-semibold text-[#80654a] hover:bg-[#f6efe4]"
          >
            <FiDownload className="h-4 w-4" aria-hidden />
            Download Template
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-semibold text-gray-800">
              Select Excel File <span className="text-red-600">*</span>
            </label>
            <div className="rounded-2xl border-2 border-dashed border-[#e7ddcf] p-8 text-center hover:border-[#cdb89f]">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
                id="crm-bulk-file-upload"
              />
              <label htmlFor="crm-bulk-file-upload" className="cursor-pointer">
                <FiUpload className="mx-auto mb-3 h-12 w-12 text-[#80654a]" aria-hidden />
                {selectedFile ? (
                  <div>
                    <p className="m-0 font-semibold text-gray-900">{selectedFile.name}</p>
                    <p className="mt-1 text-[13px] text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        handleClearFile()
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-red-700 hover:bg-red-50"
                    >
                      <FiTrash2 className="h-4 w-4" aria-hidden />
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="m-0 font-semibold text-gray-900">Click to select Excel file</p>
                    <p className="mt-1 text-[13px] text-gray-500">.xlsx or .xls</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-gray-800">
              Campaign <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-3 text-[13px] text-gray-800 focus:border-[#cdb89f] focus:outline-none disabled:opacity-60"
              disabled={!selectedFile || campaignsLoading}
            >
              <option value="">{campaignsLoading ? 'Loading campaigns…' : 'Select a campaign'}</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[12px] font-medium text-gray-500">Stored as lead &quot;source&quot; for reporting.</p>
          </div>
        </div>
      </div>

      {isProcessing ? (
        <div className="mb-6 rounded-2xl border border-gray-900/5 bg-white p-8 text-center shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#80654a] border-t-transparent" />
          <p className="m-0 text-[13px] font-medium text-gray-600">Processing Excel file…</p>
        </div>
      ) : null}

      {uploadedLeads.length > 0 && !isProcessing ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-900/5 bg-white p-6 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
              <div className="flex items-center gap-3">
                <FiUpload className="h-10 w-10 text-[#80654a]" aria-hidden />
                <div>
                  <p className="m-0 text-[12px] font-medium text-gray-500">Total Rows</p>
                  <p className="m-0 text-2xl font-bold text-gray-900">{uploadedLeads.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-200/60 bg-white p-6 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
              <div className="flex items-center gap-3">
                <FiCheckCircle className="h-10 w-10 text-emerald-600" aria-hidden />
                <div>
                  <p className="m-0 text-[12px] font-medium text-gray-500">Valid Leads</p>
                  <p className="m-0 text-2xl font-bold text-emerald-700">{validLeadsCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-red-200/60 bg-white p-6 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
              <div className="flex items-center gap-3">
                <FiXCircle className="h-10 w-10 text-red-600" aria-hidden />
                <div>
                  <p className="m-0 text-[12px] font-medium text-gray-500">Errors</p>
                  <p className="m-0 text-2xl font-bold text-red-700">{errorLeadsCount}</p>
                </div>
              </div>
            </div>
          </div>

          {errorLeadsCount > 0 ? (
            <div className="mb-6 rounded-2xl border border-red-200/60 bg-white p-6 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
              <h2 className="mb-4 flex items-center gap-2 text-[18px] font-bold text-gray-900">
                <FiXCircle className="h-6 w-6 text-red-600" aria-hidden />
                Rows with Errors ({errorLeadsCount})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-3 pr-4 font-semibold text-gray-600">Row #</th>
                      <th className="py-3 pr-4 font-semibold text-gray-600">Name</th>
                      <th className="py-3 pr-4 font-semibold text-gray-600">Mobile No.</th>
                      <th className="py-3 pr-4 font-semibold text-gray-600">Email Id</th>
                      <th className="py-3 font-semibold text-gray-600">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedLeads
                      .filter((lead) => !lead.isValid)
                      .map((lead) => (
                        <tr key={lead.rowNumber} className="border-b border-gray-100">
                          <td className="py-3 pr-4 font-medium text-gray-900">{lead.rowNumber}</td>
                          <td className="py-3 pr-4 text-gray-800">{lead.name || '—'}</td>
                          <td className="py-3 pr-4 text-gray-800">{lead.phone || '—'}</td>
                          <td className="py-3 pr-4 text-gray-800">{lead.email || '—'}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {lead.errors.map((err, idx) => (
                                <span key={idx} className="rounded-lg bg-red-50 px-2 py-1 text-[11px] font-medium text-red-800">
                                  {err}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleClearFile}
              className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear &amp; Start Over
            </button>
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={isUploading || uploadedLeads.length === 0 || !selectedCampaignId}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#80654a] py-3 text-[13px] font-semibold text-white hover:bg-[#725940] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                  Uploading…
                </>
              ) : (
                <>
                  <FiUpload className="h-5 w-5" aria-hidden />
                  Upload {uploadedLeads.length} Lead{uploadedLeads.length === 1 ? '' : 's'}
                </>
              )}
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}
