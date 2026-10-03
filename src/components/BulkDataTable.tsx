import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import { FiChevronDown, FiDatabase, FiEye, FiSearch, FiSliders } from 'react-icons/fi'

import {
  UNNAMED_DATASET,
  fetchBulkDataDatasets,
  fetchBulkDataPage,
  fetchBulkDataUploaders,
  type BulkDataListItem,
} from '../lib/bulkDataApi'
import { fmtLongDateTime } from '../utils/format'

const PAGE_SIZE = 40

const selectClass =
  'w-full rounded-lg border border-[#E8DCCB] bg-white px-3 py-2 text-[13px] text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none'

const tableSx = {
  '& .MuiTableCell-root': {
    fontFamily: 'inherit',
    fontSize: 13,
    color: '#2E2E2E',
    borderColor: '#E8DCCB',
  },
  '& .MuiTableCell-head': {
    fontWeight: 600,
    color: '#8B7355',
    backgroundColor: '#FAF7F2',
  },
  '& .MuiTableRow-hover:hover': { backgroundColor: '#FAF7F2' },
} as const

const paginationSx = {
  fontFamily: 'inherit',
  color: '#8B7355',
  borderTop: '1px solid #E8DCCB',
  '& .MuiTablePagination-displayedRows': { fontFamily: 'inherit', fontSize: 13 },
} as const

/** Checkbox dropdown for picking several datasets; an empty selection means all datasets. */
function DatasetMultiSelect({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name])

  const label =
    value.length === 0 ? 'All datasets' : value.length === 1 ? value[0] : `${value.length} datasets selected`

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="bulk-data-dataset"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${selectClass} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">{label}</span>
        <FiChevronDown className="h-4 w-4 shrink-0 text-[#8B7355]" aria-hidden />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-[#E8DCCB] bg-white py-1 shadow-lg"
        >
          {options.length === 0 ? (
            <p className="m-0 px-3 py-2 text-[13px] text-[#8B7355]">No datasets yet</p>
          ) : (
            <>
              {options.map((name) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-2 px-3 py-2 text-[13px] text-[#2E2E2E] hover:bg-[#FAF7F2]"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(name)}
                    onChange={() => toggle(name)}
                    className="h-4 w-4 accent-[#8B7355]"
                  />
                  <span className="break-all">{name}</span>
                </label>
              ))}
              {value.length > 0 ? (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="mt-1 w-full border-t border-[#E8DCCB] px-3 py-2 text-left text-[13px] font-semibold text-[#8B7355] hover:bg-[#FAF7F2]"
                >
                  Clear selection
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

/** Imported data list. Mount it fresh to reload (the Bulk Data page unmounts it while the upload panel is open). */
export function BulkDataTable() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [uploadedBy, setUploadedBy] = useState('')
  const [datasetNames, setDatasetNames] = useState<string[]>([])
  const [datasets, setDatasets] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [uploaders, setUploaders] = useState<{ id: string; name: string }[]>([])
  /** From the list response; decides whether the "Uploaded by" filter/column are shown. */
  const [canViewAll, setCanViewAll] = useState(false)
  const [items, setItems] = useState<BulkDataListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  /** Any change to what we fetch: back to page 1 and show the loading row. */
  const startQuery = () => {
    setPage(0)
    setLoading(true)
    setError(false)
  }

  useEffect(() => {
    const next = q.trim()
    if (next === debouncedQ) return
    const t = window.setTimeout(() => {
      setDebouncedQ(next)
      startQuery()
    }, 300)
    return () => window.clearTimeout(t)
  }, [q, debouncedQ])

  useEffect(() => {
    let cancelled = false
    fetchBulkDataDatasets()
      .then((res) => {
        if (!cancelled) setDatasets(res.items ?? [])
      })
      .catch(() => {
        if (!cancelled) setDatasets([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!canViewAll) return
    let cancelled = false
    fetchBulkDataUploaders()
      .then((res) => {
        if (!cancelled) setUploaders(res.items ?? [])
      })
      .catch(() => {
        if (!cancelled) setUploaders([])
      })
    return () => {
      cancelled = true
    }
  }, [canViewAll])

  useEffect(() => {
    let cancelled = false
    fetchBulkDataPage({
      page: page + 1,
      pageSize: PAGE_SIZE,
      q: debouncedQ || undefined,
      sortOrder,
      uploadedBy: uploadedBy || undefined,
      datasetNames,
    })
      .then((res) => {
        if (cancelled) return
        setItems(res.items)
        setTotal(res.total)
        setCanViewAll(res.canViewAll)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [page, debouncedQ, sortOrder, uploadedBy, datasetNames])

  const hasFilters = Boolean(debouncedQ || uploadedBy || datasetNames.length > 0)

  if (!loading && !error && total === 0 && !hasFilters) {
    return (
      <div className="rounded-2xl border border-[#8B7355]/10 bg-white px-6 py-14 text-center">
        <FiDatabase className="mx-auto mb-3 h-10 w-10 text-[#8B7355]" aria-hidden />
        <p className="m-0 text-[16px] font-semibold text-[#2E2E2E]">No data imported yet</p>
        <p className="mt-1 mb-0 text-[13px] text-[#8B7355]">
          Click <span className="font-semibold">Bulk Upload</span> to import contacts from a CSV or Excel file.
        </p>
      </div>
    )
  }

  const statusMessage = loading
    ? 'Loading data…'
    : error
      ? 'Could not load data. Please try again.'
      : items.length === 0
        ? 'No data matches your search or filters.'
        : null

  return (
    <>
      <div className="mb-4 rounded-xl border border-[#8B7355]/10 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <FiSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7355]"
              aria-hidden
            />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, number, or email..."
              className="w-full rounded-lg border border-[#E8DCCB] bg-white py-2 pl-10 pr-4 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355]/70 focus:border-[#8B7355] focus:outline-none"
            />
          </div>
          <button
            type="button"
            aria-expanded={showFilters}
            aria-controls="bulk-data-filters"
            onClick={() => setShowFilters((o) => !o)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-[13px] font-semibold transition-colors ${
              showFilters
                ? 'border-[#8B7355] bg-[#8B7355] text-white'
                : 'border-[#E8DCCB] bg-white text-[#8B7355] hover:bg-[#F5EFE7]'
            }`}
          >
            <FiSliders className="h-4 w-4 shrink-0" aria-hidden />
            Filters
          </button>
        </div>

        {showFilters ? (
          <div id="bulk-data-filters" className={`mt-4 grid grid-cols-1 gap-4 border-t border-[#E8DCCB] pt-4 ${canViewAll ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="bulk-data-dataset">
                Dataset
              </label>
              <DatasetMultiSelect
                options={datasets}
                value={datasetNames}
                onChange={(next) => {
                  setDatasetNames(next)
                  startQuery()
                }}
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="bulk-data-sort-order">
                Order
              </label>
              <select
                id="bulk-data-sort-order"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'asc' | 'desc')
                  startQuery()
                }}
                className={selectClass}
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
            {canViewAll ? (
              <div>
                <label className="mb-2 block text-[13px] font-semibold text-[#8B7355]" htmlFor="bulk-data-uploaded-by">
                  Uploaded by
                </label>
                <select
                  id="bulk-data-uploaded-by"
                  value={uploadedBy}
                  onChange={(e) => {
                    setUploadedBy(e.target.value)
                    startQuery()
                  }}
                  className={selectClass}
                >
                  <option value="">All users</option>
                  {uploaders.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#8B7355]/10 bg-white">
        <TableContainer>
          <Table size="small" sx={tableSx} aria-label="Imported data">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 72 }}>S.No</TableCell>
                <TableCell>Dataset Name</TableCell>
                {canViewAll ? <TableCell>Uploaded by</TableCell> : null}
                <TableCell>Name</TableCell>
                <TableCell>Number</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statusMessage ? (
                <TableRow>
                  <TableCell colSpan={canViewAll ? 8 : 7} align="center" sx={{ py: 5, color: '#8B7355 !important' }}>
                    {statusMessage}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((row, i) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{page * PAGE_SIZE + i + 1}</TableCell>
                    <TableCell sx={row.datasetName ? undefined : { color: '#8B7355 !important', fontStyle: 'italic' }}>
                      {row.datasetName || UNNAMED_DATASET}
                    </TableCell>
                    {canViewAll ? <TableCell>{row.uploader?.name ?? '—'}</TableCell> : null}
                    <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                    <TableCell>{row.phone}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-all' }}>{row.email}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtLongDateTime(row.created_at)}</TableCell>
                    <TableCell align="right">
                      <button
                        type="button"
                        onClick={() => navigate(`/bulk-data/${row.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#8B7355] px-3 py-1.5 text-[12px] font-semibold text-[#8B7355] hover:bg-[#F5EFE7]"
                      >
                        <FiEye className="h-3.5 w-3.5" aria-hidden />
                        View
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, next) => {
            setLoading(true)
            setError(false)
            setPage(next)
          }}
          rowsPerPage={PAGE_SIZE}
          rowsPerPageOptions={[PAGE_SIZE]}
          sx={paginationSx}
        />
      </div>
    </>
  )
}
