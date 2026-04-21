import { useId, type ReactNode } from 'react'

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  const id = useId()
  return (
    <label className="block" htmlFor={id}>
      <div className="text-[11px] tracking-widest uppercase text-gray-500 font-semibold">
        {label} {required ? <span className="text-rose-600">*</span> : null}
      </div>
      <div className="mt-2" id={id}>
        {children}
      </div>
    </label>
  )
}
