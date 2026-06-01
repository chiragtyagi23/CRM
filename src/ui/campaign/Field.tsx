import { useId, type ReactNode } from 'react'

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  const id = useId()
  return (
    <label className="block" htmlFor={id}>
      <div className="mb-2 text-sm font-medium text-[#8B7355]">
        {label} {required ? <span className="text-[#D96B6B]">*</span> : null}
      </div>
      <div id={id}>{children}</div>
    </label>
  )
}
