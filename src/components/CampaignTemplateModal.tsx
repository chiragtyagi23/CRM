type TemplateKey = 'luxury-template' | 'affordable-template'

export function CampaignTemplateModal({
  open,
  selectedTemplateKey,
  onChangeTemplate,
  onClose,
  onContinue,
}: {
  open: boolean
  selectedTemplateKey: TemplateKey
  onChangeTemplate: (key: TemplateKey) => void
  onClose: () => void
  onContinue: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-[520px] rounded-3xl border border-gray-900/10 bg-white p-5 shadow-[0_20px_60px_rgba(17,24,39,0.18)]">
        <div className="text-[16px] font-bold tracking-[-0.02em] text-gray-900">Choose template</div>
        <div className="mt-1 text-[13px] font-medium text-gray-500">Select which microsite template to use for this campaign.</div>

        <div className="mt-5 grid gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-3 hover:bg-gray-50">
            <input
              type="radio"
              name="campaign-template"
              className="mt-1"
              checked={selectedTemplateKey === 'luxury-template'}
              onChange={() => onChangeTemplate('luxury-template')}
            />
            <div>
              <div className="text-[13px] font-semibold text-gray-900">Luxury template</div>
              <div className="text-[12px] font-medium text-gray-500">Best for premium projects.</div>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-3 hover:bg-gray-50">
            <input
              type="radio"
              name="campaign-template"
              className="mt-1"
              checked={selectedTemplateKey === 'affordable-template'}
              onChange={() => onChangeTemplate('affordable-template')}
            />
            <div>
              <div className="text-[13px] font-semibold text-gray-900">Affordable template</div>
              <div className="text-[12px] font-medium text-gray-500">Best for budget/affordable projects.</div>
            </div>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 min-[520px]:flex-row min-[520px]:justify-end">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 text-[13px] font-semibold text-gray-800 hover:bg-gray-50"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#80654a] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940]"
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

