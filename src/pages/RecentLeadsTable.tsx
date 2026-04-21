import type { RecentLeadDTO } from '../lib/dashboardDummyApi'
import { DynamicTable, type TableColumnDef } from '../components/DynamicTable'
import type React from 'react'

function Pill({
  tone,
  children,
}: {
  tone: 'sand' | 'rose' | 'mint' | 'slate'
  children: React.ReactNode
}) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none'
  const cls =
    tone === 'rose'
      ? 'bg-rose-100 text-rose-700'
      : tone === 'mint'
        ? 'bg-emerald-100 text-emerald-700'
        : tone === 'slate'
          ? 'bg-slate-100 text-slate-700'
          : 'bg-[rgba(157,122,86,0.14)] text-[#7a5b3f]'
  return <span className={`${base} ${cls}`}>{children}</span>
}

function scoreTone(score: RecentLeadDTO['score']): 'rose' | 'sand' | 'slate' {
  switch (score) {
    case 'Hot':
      return 'rose'
    case 'Warm':
      return 'sand'
    case 'Cold':
    default:
      return 'slate'
  }
}

function statusTone(status: RecentLeadDTO['status']): 'sand' | 'mint' | 'slate' {
  switch (status) {
    case 'Opportunity':
      return 'sand'
    case 'Qualified':
      return 'mint'
    case 'Site Visit':
      return 'sand'
    case 'Contacted':
      return 'sand'
    case 'New':
    default:
      return 'slate'
  }
}

const columns: TableColumnDef<RecentLeadDTO>[] = [
  {
    key: 'name',
    header: 'Name',
    cell: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
  },
  {
    key: 'contact',
    header: 'Contact',
    cell: (r) => <span className="text-gray-600">{r.contact}</span>,
  },
  {
    key: 'source',
    header: 'Source',
    cell: (r) => <Pill tone="sand">{r.source}</Pill>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill>,
  },
  {
    key: 'score',
    header: 'Score',
    cell: (r) => <Pill tone={scoreTone(r.score)}>{r.score}</Pill>,
  },
  {
    key: 'assignedTo',
    header: 'Assigned To',
    cell: (r) => <span className="text-gray-700">{r.assignedTo}</span>,
  },
]

export function RecentLeadsTable({ rows }: { rows: RecentLeadDTO[] }) {
  return (
    <DynamicTable
      ariaLabel="Recent leads"
      columns={columns}
      rows={rows}
      getRowKey={(r) => r.id}
      dense
    />
  )
}

