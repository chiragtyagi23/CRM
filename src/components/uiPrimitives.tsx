import type { ReactNode } from 'react'

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
      <div className="mb-2 text-[11px] font-semibold text-gray-500">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        {children}
      </div>
    </label>
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
      <div className="mb-2 text-[11px] font-semibold text-gray-500">
        {label} {required ? <span className="text-rose-500">*</span> : null}
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
                'h-11 rounded-xl border text-[12px] font-semibold tracking-wide',
                active ? 'border-[#cdb89f] bg-[#faf6ef] text-[#80654a]' : 'border-gray-200 bg-white text-gray-600',
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
