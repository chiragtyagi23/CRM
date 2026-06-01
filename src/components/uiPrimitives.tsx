import type { ReactNode } from 'react'
import { d } from '../lib/designClasses'

/** Label + left icon gutter for inputs (capture lead form). */
export function IconInsetField({
  label,
  required,
  icon,
  children,
}: {
  label: string
  required?: boolean
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <label className="block">
      <div className={d.label}>
        {label} {required ? <span className="text-[#D96B6B]">*</span> : null}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8B7355]">{icon}</span>
        {children}
      </div>
    </label>
  )
}

export const fieldInputClass =
  'h-11 w-full rounded-lg border border-[#E8DCCB] bg-white pl-11 pr-3 text-sm text-[#2E2E2E] placeholder:text-[#8B7355]/60 focus:border-[#8B7355] focus:outline-none'

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
