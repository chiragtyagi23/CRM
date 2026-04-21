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
  const cellPad = dense ? 'py-2.5' : 'py-3'

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-[900px] w-full border-separate border-spacing-0" aria-label={ariaLabel} id={tableId}>
        <thead>
          <tr className="text-xs text-gray-400">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={[
                  'sticky top-0 z-1 bg-white px-4',
                  cellPad,
                  'font-semibold',
                  alignClasses(c.align),
                  c.headerClassName ?? '',
                ].join(' ')}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[13px] text-gray-700">
          {rows.map((row, idx) => (
            <tr key={getRowKey(row, idx)} className="border-t border-gray-100">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={[
                    'px-4',
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

