type TemplateKey = 'default-template' | 'luxury-template' | 'affordable-template'

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
      <div className="relative w-full max-w-[520px] rounded-xl border border-[#8B7355]/10 bg-white p-5 shadow-[0_20px_60px_rgba(17,24,39,0.18)]">
        <div className="text-[16px] font-bold tracking-[-0.02em] text-[#2E2E2E]">Choose template</div>
        <div className="mt-1 text-[13px] font-medium text-[#8B7355]">Select which microsite template to use for this project.</div>

        <div className="mt-5 grid gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E8DCCB] p-3 hover:bg-[#F5EFE7]">
            <input
              type="radio"
              name="campaign-template"
              className="mt-1"
              checked={selectedTemplateKey === 'default-template'}
              onChange={() => onChangeTemplate('default-template')}
            />
            <div>
              <div className="text-[13px] font-semibold text-[#2E2E2E]">Default template</div>
              <div className="text-[12px] font-medium text-[#8B7355]">
                Clean portal style (Housiey / Housing inspired). All fields optional.
              </div>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E8DCCB] p-3 hover:bg-[#F5EFE7]">
            <input
              type="radio"
              name="campaign-template"
              className="mt-1"
              checked={selectedTemplateKey === 'luxury-template'}
              onChange={() => onChangeTemplate('luxury-template')}
            />
            <div>
              <div className="text-[13px] font-semibold text-[#2E2E2E]">Luxury template</div>
              <div className="text-[12px] font-medium text-[#8B7355]">Best for premium projects. Required fields apply.</div>
            </div>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E8DCCB] p-3 hover:bg-[#F5EFE7]">
            <input
              type="radio"
              name="campaign-template"
              className="mt-1"
              checked={selectedTemplateKey === 'affordable-template'}
              onChange={() => onChangeTemplate('affordable-template')}
            />
            <div>
              <div className="text-[13px] font-semibold text-[#2E2E2E]">Affordable template</div>
              <div className="text-[12px] font-medium text-[#8B7355]">Best for budget projects. Required fields apply.</div>
            </div>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 min-[520px]:flex-row min-[520px]:justify-end">
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E8DCCB] bg-white px-4 text-[13px] font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#8B7355] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#6d5a43]"
            onClick={onContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
