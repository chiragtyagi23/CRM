import type { ReactNode } from 'react'

export function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#8B7355]/10 bg-white p-6">
      <div>
        <h3 className="text-xl font-semibold text-[#2E2E2E]">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-[#8B7355]">{subtitle}</p> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}
