import type { RecentLeadDTO } from '../lib/dashboardDummyApi'
import { DynamicTable, type TableColumnDef } from './DynamicTable'
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
      ? 'bg-[#D96B6B]/20 text-[#D96B6B]'
      : tone === 'mint'
        ? 'bg-[#6FAF8F]/20 text-[#6FAF8F]'
        : tone === 'slate'
          ? 'bg-[#F5EFE7] text-[#8B7355]'
          : 'bg-[#E8DCCB] text-[#8B7355]'
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
    cell: (r) => <span className="font-medium text-[#2E2E2E]">{r.name}</span>,
  },
  {
    key: 'contact',
    header: 'Contact',
    cell: (r) => <span className="text-[#8B7355]">{r.contact}</span>,
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
    cell: (r) => <span className="text-[#2E2E2E]">{r.assignedTo}</span>,
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

