import { useEffect, useRef, useState, type ReactNode } from 'react'
import { d } from '../lib/designClasses'

/** Label + left icon gutter for inputs (capture lead form). */
export function IconInsetField({
  label,
  required,
  icon,
  children,
  /** Use for type="date" / type="time" — inset icons hide the native picker on Windows. */
  dateTime,
}: {
  label: string
  required?: boolean
  icon: ReactNode
  children: ReactNode
  dateTime?: boolean
}) {
  return (
    <label className="block">
      <div className={d.label}>
        {dateTime ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-[#8B7355]">{icon}</span>
            <span>
              {label} {required ? <span className="text-[#D96B6B]">*</span> : null}
            </span>
          </span>
        ) : (
          <>
            {label} {required ? <span className="text-[#D96B6B]">*</span> : null}
          </>
        )}
      </div>
      {dateTime ? (
        children
      ) : (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#8B7355]">{icon}</span>
          {children}
        </div>
      )}
    </label>
  )
}

export const fieldInputClass =
  'h-11 w-full rounded-lg border border-[#E8DCCB] bg-white pl-11 pr-3 text-sm text-[#2E2E2E] placeholder:text-[#8B7355]/60 focus:border-[#8B7355] focus:outline-none'

/** Dropdown chevron — inset from the right edge (shared across custom selects). */
export const dropdownChevronClass =
  'pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#8B7355]'

export const dropdownChevronInlineClass = 'shrink-0 text-[#8B7355] mr-2'

/** Date/time inputs — no left icon inset (native control stays visible). */
export const fieldDateTimeInputClass =
  'h-11 w-full min-w-0 rounded-lg border border-[#E8DCCB] bg-white px-3 text-sm text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none [color-scheme:light]'

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches',
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  options: { id?: string; value: string; label: string }[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const selectedLabel = options.find((o) => o.value === value)?.label

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`${fieldInputClass} relative w-full text-left`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`block truncate pr-6 ${value ? 'text-[#2E2E2E]' : 'text-[#8B7355]/60'}`}
        >
          {selectedLabel || placeholder}
        </span>
        <span className={dropdownChevronClass} aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[#E8DCCB] bg-white shadow-[0_10px_24px_rgba(17,24,39,0.10)]">
          <div className="border-b border-[#E8DCCB] p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border border-[#E8DCCB] bg-white px-3 text-sm text-[#2E2E2E] placeholder:text-[#8B7355]/60 focus:border-[#8B7355] focus:outline-none"
              autoFocus
            />
          </div>
          <ul className="max-h-[200px] overflow-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[#8B7355]">{emptyMessage}</li>
            ) : (
              filtered.map((o) => (
                <li key={o.id ?? o.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.value === value}
                    className={[
                      'w-full px-3 py-2 text-left text-sm transition-colors',
                      o.value === value
                        ? 'bg-[#E8DCCB]/30 font-medium text-[#2E2E2E]'
                        : 'text-[#2E2E2E] hover:bg-[#F5EFE7]',
                    ].join(' ')}
                    onClick={() => {
                      onChange(o.value)
                      setOpen(false)
                      setSearch('')
                    }}
                  >
                    {o.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export function TogglePills<T extends string>({
  label,
  required,
  value,
  options,
  onChange,
}: {
  label: string
  required?: boolean
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <div className={d.label}>
        {label} {required ? <span className="text-[#D96B6B]">*</span> : null}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={[
                'rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-all',
                active
                  ? 'border-[#8B7355] bg-[#E8DCCB]/30 text-[#2E2E2E]'
                  : 'border-[#E8DCCB] text-[#8B7355] hover:border-[#8B7355]/50',
              ].join(' ')}
              aria-pressed={active}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
