import { useId } from 'react'
import type React from 'react'

export type TableAlign = 'left' | 'center' | 'right'

export type TableColumnDef<T> = {
  key: string
  header: string
  align?: TableAlign
  className?: string
  headerClassName?: string
  cell: (row: T) => React.ReactNode
}

type Props<T> = {
  ariaLabel: string
  columns: TableColumnDef<T>[]
  rows: T[]
  getRowKey: (row: T, idx: number) => string
  dense?: boolean
}

function alignClasses(align: TableAlign | undefined): string {
  switch (align) {
    case 'center':
      return 'text-center'
    case 'right':
      return 'text-right'
    case 'left':
    default:
      return 'text-left'
  }
}

export function DynamicTable<T>({ ariaLabel, columns, rows, getRowKey, dense }: Props<T>) {
  const tableId = useId()
  const cellPad = dense ? 'py-3' : 'py-4'

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[900px] w-full border-collapse" aria-label={ariaLabel} id={tableId}>
        <thead>
          <tr className="border-b border-[#E8DCCB]">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={[
                  'sticky top-0 z-1 bg-white px-6',
                  cellPad,
                  'text-sm font-medium text-[#8B7355]',
                  alignClasses(c.align),
                  c.headerClassName ?? '',
                ].join(' ')}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm text-[#2E2E2E]">
          {rows.map((row, idx) => (
            <tr key={getRowKey(row, idx)} className="border-b border-[#E8DCCB] last:border-0">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={[
                    'px-6',
                    cellPad,
                    'whitespace-nowrap',
                    alignClasses(c.align),
                    c.className ?? '',
                  ].join(' ')}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
