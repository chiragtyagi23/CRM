export function CampaignSectionHeader({
  label,
  helper,
  onNextSection,
}: {
  label: string
  helper: string
  onNextSection: () => void
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="text-xs tracking-widest uppercase text-gray-500 font-semibold">Editing</div>
      <div className="mt-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="text-gray-900 text-xl font-bold">{label}</div>
          <div className="mt-1 text-sm text-gray-600">{helper}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50"
            onClick={onNextSection}
          >
            Next section
          </button>
        </div>
      </div>
    </div>
  )
}
