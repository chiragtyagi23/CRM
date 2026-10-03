import { useEffect, useMemo, useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  FiAlertCircle,
  FiCheckCircle,
  FiDownload,
  FiSliders,
  FiTrash2,
  FiUpload,
  FiX,
  FiXCircle,
} from 'react-icons/fi'

import { useToast } from '../components/acl/Toast'
import { BulkDataTable } from '../components/BulkDataTable'
import { MapDataFieldsModal } from '../components/MapDataFieldsModal'
import {
  BULK_FILE_ACCEPT,
  DATA_FIELDS,
  autoMapColumns,
  buildMappedRows,
  buildMappingRecord,
  detectHeaderRow,
  headerRowCandidates,
  isSupportedBulkFile,
  missingRequiredFields,
  sheetMatrixToParsed,
  type ColumnMapping,
} from '../lib/bulkDataFields'
import { DATASET_NAME_MAX, createBulkData, type BulkDataFailure } from '../lib/bulkDataApi'
import { registerBulkUploadDirty } from '../lib/bulkUploadNavigation'

const TEMPLATE_ROWS = [
  { Name: 'John Doe', 'Mobile No.': '+91 98765 43210', 'Email Id': 'john@example.com', Location: 'Noida', Budget: '80L', BHK: '2' },
  { Name: 'Jane Smith', 'Mobile No.': '+91 87654 32109', 'Email Id': 'jane@example.com', Location: 'Gurugram', Budget: '1.2Cr', BHK: '3' },
]

type LoadedSheet = {
  matrix: unknown[][]
  /** 1-based sheet row of `matrix[0]`. */
  firstSheetRow: number
}

export function BulkData() {
  const { toast } = useToast()
  const [panelOpen, setPanelOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [datasetName, setDatasetName] = useState('')
  const [loaded, setLoaded] = useState<LoadedSheet | null>(null)
  const [headerRow, setHeaderRow] = useState(0)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [mappingSaved, setMappingSaved] = useState(false)
  const [mappingModalOpen, setMappingModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  /** Row errors returned by the server, merged into the error table. */
  const [serverFailures, setServerFailures] = useState<BulkDataFailure[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dirtyRef = useRef(false)

  useEffect(() => {
    dirtyRef.current = isProcessing || selectedFile !== null || datasetName.trim() !== ''
  }, [isProcessing, selectedFile, datasetName])
  useEffect(() => registerBulkUploadDirty(() => dirtyRef.current), [])

  const sheet = useMemo(
    () => (loaded ? sheetMatrixToParsed(loaded.matrix, headerRow, loaded.firstSheetRow) : null),
    [loaded, headerRow],
  )

  const headerRowOptions = useMemo(
    () =>
      loaded
        ? headerRowCandidates(loaded.matrix).map((index) => {
            const cells = loaded.matrix[index].map((c) => String(c ?? '').trim()).filter(Boolean)
            const text = cells.slice(0, 4).join(', ') + (cells.length > 4 ? ', …' : '')
            return { index, label: `Row ${loaded.firstSheetRow + index}: ${text}` }
          })
        : [],
    [loaded],
  )

  const mappedRows = useMemo(() => {
    if (!sheet || !mappingSaved) return []
    return buildMappedRows(sheet.rows, mapping).map((row) => {
      const hit = serverFailures.find((f) => f.rowNumber === row.rowNumber)
      return hit ? { ...row, isValid: false, errors: [...new Set([...row.errors, ...hit.errors])] } : row
    })
  }, [sheet, mapping, mappingSaved, serverFailures])
  const validCount = mappedRows.filter((r) => r.isValid).length
  const errorCount = mappedRows.length - validCount
  const trimmedDatasetName = datasetName.trim()

  const resetFile = () => {
    setSelectedFile(null)
    setLoaded(null)
    setHeaderRow(0)
    setMapping({})
    setMappingSaved(false)
    setServerFailures([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const closePanel = () => {
    resetFile()
    setDatasetName('')
    setPanelOpen(false)
  }

  const applyHeaderRow = (matrix: unknown[][], firstSheetRow: number, index: number) => {
    setHeaderRow(index)
    setMapping(autoMapColumns(sheetMatrixToParsed(matrix, index, firstSheetRow).columns))
    setMappingSaved(false)
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setMappingSaved(false)
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: false, defval: '', blankrows: true })
      const firstSheetRow = worksheet['!ref'] ? XLSX.utils.decode_range(worksheet['!ref']).s.r + 1 : 1

      const index = detectHeaderRow(matrix)
      const parsed = sheetMatrixToParsed(matrix, index, firstSheetRow)
      if (parsed.columns.length === 0 || parsed.rows.length === 0) {
        toast('No data rows found. Add a header row followed by your contacts.', 'error')
        resetFile()
        return
      }

      setLoaded({ matrix, firstSheetRow })
      applyHeaderRow(matrix, firstSheetRow, index)
      setMappingModalOpen(true)
      toast(`File loaded with ${parsed.rows.length} rows. Map your contact fields to continue.`, 'success')
    } catch {
      toast('Could not read the file. Check that it is a valid CSV or Excel file.', 'error')
      resetFile()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isSupportedBulkFile(file)) {
      toast('Please select a CSV or Excel file (.csv, .xlsx or .xls).', 'error')
      e.target.value = ''
      return
    }
    setSelectedFile(file)
    void processFile(file)
  }

  const handleDownloadTemplate = (bookType: 'xlsx' | 'csv') => {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(TEMPLATE_ROWS), 'Data Template')
    XLSX.writeFile(wb, `bulk_data_template.${bookType}`, { bookType })
  }

  const handleImport = async () => {
    if (!trimmedDatasetName) {
      toast('Enter a dataset / import name before importing.', 'error')
      return
    }
    setIsImporting(true)
    try {
      const res = await createBulkData(
        trimmedDatasetName,
        buildMappingRecord(mapping),
        mappedRows.map(({ rowNumber, name, phone, email, meta }) => ({ rowNumber, name, phone, email, meta })),
      )
      toast(`Imported ${res.count} contact${res.count === 1 ? '' : 's'}.`, 'success')
      closePanel()
    } catch (e: unknown) {
      const err = e as { message?: string; body?: unknown }
      let msg = err.message ? String(err.message) : 'Import failed.'
      const body = err.body
      if (body && typeof body === 'object') {
        const o = body as { message?: string; error?: string; failures?: BulkDataFailure[] }
        if (typeof o.message === 'string') msg = o.message
        else if (typeof o.error === 'string') msg = o.error
        if (Array.isArray(o.failures)) setServerFailures(o.failures)
      }
      toast(msg, 'error')
    } finally {
      setIsImporting(false)
    }
  }

  const mappedFieldSummary = DATA_FIELDS.map((f) => {
    const header = Object.keys(mapping).find((h) => mapping[h] === f.key)
    return header ? { label: f.label, header } : null
  }).filter((x): x is { label: string; header: string } => x !== null)
  const extraColumns = Object.keys(mapping).filter((h) => !mapping[h])

  return (
    <div className="crm-page">
      <div className="crm-page-header">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="crm-page-title">Bulk Data</h1>
            <p className="crm-page-subtitle">Import contact data in bulk from a CSV or Excel file</p>
          </div>
          {!panelOpen ? (
            <button type="button" className="crm-btn-primary h-10" onClick={() => setPanelOpen(true)}>
              <FiUpload className="h-4 w-4 shrink-0" aria-hidden />
              Bulk Upload
            </button>
          ) : null}
        </div>
      </div>

      {!panelOpen ? (
        <BulkDataTable />
      ) : (
        <>
          <div className="mb-6 rounded-2xl border border-[#8B7355]/10 bg-white p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="m-0 text-[16px] font-semibold text-[#2E2E2E]">Upload data file</p>
              <button
                type="button"
                onClick={() => {
                  if (selectedFile && !window.confirm('Discard the loaded file?')) return
                  closePanel()
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#8B7355] hover:bg-[#F5EFE7]"
                aria-label="Close bulk upload"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-6 flex gap-3 rounded-xl border border-[#e7ddcf] bg-[#F5EFE7] p-4">
              <FiAlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#8B7355]" aria-hidden />
              <div className="text-[13px] text-[#2E2E2E]">
                <p className="m-0 mb-1 font-semibold">File columns</p>
                <p className="m-0 text-[#8B7355]">
                  <strong className="font-semibold text-[#2E2E2E]">Name</strong>,{' '}
                  <strong className="font-semibold text-[#2E2E2E]">Number</strong>, and{' '}
                  <strong className="font-semibold text-[#2E2E2E]">Email</strong> are required. Location, Budget, BHK
                  and any other columns are optional — you'll match headers after the file loads.
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleDownloadTemplate('xlsx')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#8B7355] px-4 py-2.5 text-[13px] font-semibold text-[#8B7355] hover:bg-[#FAF7F2]"
              >
                <FiDownload className="h-4 w-4" aria-hidden />
                Excel template
              </button>
              <button
                type="button"
                onClick={() => handleDownloadTemplate('csv')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#8B7355] px-4 py-2.5 text-[13px] font-semibold text-[#8B7355] hover:bg-[#FAF7F2]"
              >
                <FiDownload className="h-4 w-4" aria-hidden />
                CSV template
              </button>
            </div>

            <label htmlFor="crm-bulk-data-dataset-name" className="mb-2 block text-[13px] font-semibold text-[#2E2E2E]">
              Dataset / Import Name <span className="text-red-600">*</span>
            </label>
            <input
              id="crm-bulk-data-dataset-name"
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              maxLength={DATASET_NAME_MAX}
              placeholder="e.g. Delhi Real Estate Leads"
              className="mb-6 w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2.5 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355]/70 focus:border-[#8B7355] focus:outline-none"
            />

            <p className="mb-2 text-[13px] font-semibold text-[#2E2E2E]">
              Data file <span className="text-red-600">*</span>
            </p>
            <div className="rounded-xl border-2 border-dashed border-[#e7ddcf] bg-[#FAF7F2]/40 p-8 text-center hover:border-[#8B7355]/50">
              <input
                ref={fileInputRef}
                type="file"
                accept={BULK_FILE_ACCEPT}
                onChange={handleFileChange}
                className="hidden"
                id="crm-bulk-data-file"
              />
              <label htmlFor="crm-bulk-data-file" className="cursor-pointer">
                <FiUpload className="mx-auto mb-3 h-10 w-10 text-[#8B7355]" aria-hidden />
                {selectedFile ? (
                  <div>
                    <p className="m-0 font-semibold break-all text-[#2E2E2E]">{selectedFile.name}</p>
                    <p className="mt-1 mb-0 text-[13px] text-[#8B7355]">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        resetFile()
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-semibold text-red-700 hover:bg-red-50"
                    >
                      <FiTrash2 className="h-4 w-4" aria-hidden />
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="m-0 font-semibold text-[#2E2E2E]">Click to select a CSV or Excel file</p>
                    <p className="mt-1 mb-0 text-[13px] text-[#8B7355]">.csv, .xlsx or .xls</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {isProcessing ? (
            <div className="mb-6 rounded-xl border border-[#8B7355]/10 bg-white p-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#8B7355] border-t-transparent" />
              <p className="m-0 text-[13px] font-medium text-[#8B7355]">Reading file…</p>
            </div>
          ) : null}

          {sheet && !isProcessing && !mappingSaved ? (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#e7ddcf] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="m-0 text-[13px] text-[#8B7355]">
                {missingRequiredFields(mapping).length > 0
                  ? 'Map Name, Number and Email to continue.'
                  : 'Review and save the field mapping to continue.'}
              </p>
              <button type="button" className="crm-btn-primary h-10" onClick={() => setMappingModalOpen(true)}>
                <FiSliders className="h-4 w-4 shrink-0" aria-hidden />
                Map fields
              </button>
            </div>
          ) : null}

          {mappingSaved && mappedRows.length > 0 && !isProcessing ? (
            <>
              <div className="mb-6 rounded-xl border border-[#8B7355]/10 bg-white p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="m-0 text-[14px] font-semibold text-[#2E2E2E]">Field mapping</p>
                  <button
                    type="button"
                    onClick={() => setMappingModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[#8B7355] hover:bg-[#F5EFE7]"
                  >
                    <FiSliders className="h-4 w-4" aria-hidden />
                    Edit mapping
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mappedFieldSummary.map(({ label, header }) => (
                    <span key={label} className="rounded-lg bg-[#F5EFE7] px-2.5 py-1 text-[12px] text-[#2E2E2E]">
                      <span className="font-semibold">{label}</span>
                      <span className="text-[#8B7355]"> ← {header}</span>
                    </span>
                  ))}
                  {extraColumns.length > 0 ? (
                    <span className="rounded-lg border border-[#E8DCCB] px-2.5 py-1 text-[12px] text-[#8B7355]">
                      +{extraColumns.length} kept as original header{extraColumns.length === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[#8B7355]/10 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <FiUpload className="h-10 w-10 text-[#8B7355]" aria-hidden />
                    <div>
                      <p className="m-0 text-[12px] font-medium text-[#8B7355]">Total Rows</p>
                      <p className="m-0 text-2xl font-bold text-[#2E2E2E]">{mappedRows.length}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-200/60 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <FiCheckCircle className="h-10 w-10 text-[#6FAF8F]" aria-hidden />
                    <div>
                      <p className="m-0 text-[12px] font-medium text-[#8B7355]">Valid Rows</p>
                      <p className="m-0 text-2xl font-bold text-[#6FAF8F]">{validCount}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-red-200/60 bg-white p-6">
                  <div className="flex items-center gap-3">
                    <FiXCircle className="h-10 w-10 text-red-600" aria-hidden />
                    <div>
                      <p className="m-0 text-[12px] font-medium text-[#8B7355]">Errors</p>
                      <p className="m-0 text-2xl font-bold text-red-700">{errorCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {errorCount > 0 ? (
                <div className="mb-6 rounded-xl border border-red-200/60 bg-white p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-[18px] font-bold text-[#2E2E2E]">
                    <FiXCircle className="h-6 w-6 text-red-600" aria-hidden />
                    Rows with Errors ({errorCount})
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-[#E8DCCB]">
                          <th className="py-3 pr-4 font-semibold text-[#8B7355]">Row #</th>
                          <th className="py-3 pr-4 font-semibold text-[#8B7355]">Name</th>
                          <th className="py-3 pr-4 font-semibold text-[#8B7355]">Number</th>
                          <th className="py-3 pr-4 font-semibold text-[#8B7355]">Email</th>
                          <th className="py-3 font-semibold text-[#8B7355]">Errors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappedRows
                          .filter((r) => !r.isValid)
                          .map((r) => (
                            <tr key={r.rowNumber} className="border-b border-[#E8DCCB]">
                              <td className="py-3 pr-4 font-medium text-[#2E2E2E]">{r.rowNumber}</td>
                              <td className="py-3 pr-4 text-[#2E2E2E]">{r.name || '—'}</td>
                              <td className="py-3 pr-4 text-[#2E2E2E]">{r.phone || '—'}</td>
                              <td className="py-3 pr-4 text-[#2E2E2E]">{r.email || '—'}</td>
                              <td className="py-3">
                                <div className="flex flex-wrap gap-1">
                                  {r.errors.map((err) => (
                                    <span key={err} className="rounded-lg bg-red-50 px-2 py-1 text-[11px] font-medium text-red-800">
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
                  onClick={resetFile}
                  className="flex-1 rounded-xl border border-[#E8DCCB] bg-white py-3 text-[13px] font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7]"
                >
                  Clear and start over
                </button>
                <button
                  type="button"
                  onClick={() => void handleImport()}
                  disabled={isImporting || errorCount > 0 || !trimmedDatasetName}
                  title={
                    errorCount > 0
                      ? 'Fix rows with errors in the file and upload it again.'
                      : !trimmedDatasetName
                        ? 'Enter a dataset / import name above.'
                        : undefined
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#8B7355] py-3 text-[13px] font-semibold text-white hover:bg-[#6d5a43] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden />
                      Importing…
                    </>
                  ) : (
                    <>
                      <FiUpload className="h-5 w-5" aria-hidden />
                      Import {mappedRows.length} contact{mappedRows.length === 1 ? '' : 's'}
                    </>
                  )}
                </button>
              </div>
            </>
          ) : null}
        </>
      )}

      {mappingModalOpen && sheet && loaded ? (
        <MapDataFieldsModal
          key={headerRow}
          fileName={selectedFile?.name ?? ''}
          columns={sheet.columns}
          mapping={mapping}
          headerRow={headerRow}
          headerRowOptions={headerRowOptions}
          onHeaderRowChange={(index) => applyHeaderRow(loaded.matrix, loaded.firstSheetRow, index)}
          onClose={() => setMappingModalOpen(false)}
          onSave={(next) => {
            setMapping(next)
            setMappingSaved(true)
            setServerFailures([])
            setMappingModalOpen(false)
            toast('Field mapping saved.', 'success')
          }}
        />
      ) : null}
    </div>
  )
}
