import { TEMPLATE_SECTIONS } from '../lib/campaign/templateSections'
import type { TemplateSectionKey } from '../types/dtos'
import { SidebarButton } from '../ui/campaign/SidebarButton'
import type { TemplateKey } from '../lib/campaign/templateKeys'

function sidebarTitle(templateKey: TemplateKey): string {
  if (templateKey === 'default-template') return 'Default template sections (optional)'
  if (templateKey === 'affordable-template') return 'Affordable template sections'
  return 'Luxury template sections'
}

export function CampaignSidebar({
  activeSection,
  templateKey,
  onSectionChange,
}: {
  activeSection: TemplateSectionKey
  templateKey: TemplateKey
  onSectionChange: (key: TemplateSectionKey) => void
}) {
  return (
    <aside className="rounded-xl border border-[#E8DCCB] bg-white p-3 shadow-sm sticky top-4 h-max">
      <div className="px-2 py-2 text-xs font-semibold tracking-widest uppercase text-[#8B7355]">{sidebarTitle(templateKey)}</div>
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
