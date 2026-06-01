export function CampaignSectionHeader({
  label,
  helper,
  onSaveDraft,
  onPrevSection,
  onNextSection,
}: {
  label: string
  helper: string
  onSaveDraft: () => void
  onPrevSection: () => void
  onNextSection: () => void
}) {
  return (
    <div className="rounded-xl border border-[#E8DCCB] bg-white p-4 sm:p-5 shadow-sm">
      <div className="text-xs tracking-widest uppercase text-[#8B7355] font-semibold">Editing</div>
      <div className="mt-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-[#2E2E2E] text-xl font-bold">{label}</div>
          <div className="mt-1 text-sm text-[#8B7355]">{helper}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-10 px-4 rounded-lg border border-[#E8DCCB] bg-white text-[#2E2E2E] text-sm font-semibold hover:bg-[#F5EFE7]"
            onClick={onSaveDraft}
          >
            Save
          </button>
          <button
            type="button"
            className="h-10 px-4 rounded-lg border border-[#E8DCCB] bg-white text-[#2E2E2E] text-sm font-semibold hover:bg-[#F5EFE7]"
            onClick={onPrevSection}
          >
            Previous section
          </button>
          <button
            type="button"
            className="h-10 px-4 rounded-lg border border-[#E8DCCB] bg-white text-[#2E2E2E] text-sm font-semibold hover:bg-[#F5EFE7]"
            onClick={onNextSection}
          >
            Next section
          </button>
        </div>
      </div>
    </div>
  )
}

