import { TEMPLATE_SECTIONS } from './constants'
import type { TemplateSectionKey } from './types'
import { SidebarButton } from './ui/SidebarButton'

export function CampaignSidebar({
  activeSection,
  onSectionChange,
}: {
  activeSection: TemplateSectionKey
  onSectionChange: (key: TemplateSectionKey) => void
}) {
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sticky top-4 h-max">
      <div className="px-2 py-2 text-xs font-semibold tracking-widest uppercase text-gray-500">Luxury template sections</div>
      <div className="flex flex-col gap-2">
        {TEMPLATE_SECTIONS.map((s) => (
          <SidebarButton
            key={s.key}
            active={s.key === activeSection}
            label={s.label}
            helper={s.helper}
            onClick={() => onSectionChange(s.key)}
          />
        ))}
      </div>
    </aside>
  )
}
