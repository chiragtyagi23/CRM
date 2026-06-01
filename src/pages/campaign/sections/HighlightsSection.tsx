import type { Dispatch, SetStateAction } from 'react'

import { CampaignUploadTile } from '../../../components/CampaignUploadTile'
import { SectionCard } from '../../../ui/campaign/SectionCard'
import { inputClassName } from '../../../ui/campaign/classNames'

export function HighlightsSection({
  highlightItems,
  setHighlightItems,
}: {
  highlightItems: { title: string; description: string }[]
  setHighlightItems: Dispatch<SetStateAction<{ title: string; description: string }[]>>
}) {
  return (
    <SectionCard title="Highlights" subtitle="USP cards shown as highlight tiles.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#E8DCCB] bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[#2E2E2E]">Highlight items</div>
            <button
              type="button"
              className="h-9 px-3 rounded-lg border border-[#E8DCCB] bg-white text-[#2E2E2E] text-xs font-semibold hover:bg-[#F5EFE7]"
              onClick={() => setHighlightItems((prev) => [...prev, { title: '', description: '' }])}
            >
              Add highlight
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3">
            {highlightItems.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-[#E8DCCB] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs font-semibold text-[#8B7355]">#{String(idx + 1).padStart(2, '0')}</div>
                  <input
                    className={inputClassName()}
                    value={item.title}
                    onChange={(e) =>
                      setHighlightItems((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, title: e.target.value } : p)),
                      )
                    }
                    placeholder="Heading (e.g. 180° Sea View)"
                  />
                  <button
                    type="button"
                    className={
                      highlightItems.length <= 1
                        ? 'h-10 px-3 rounded-lg bg-gray-100 text-[#8B7355] text-xs font-semibold cursor-not-allowed'
                        : 'h-10 px-3 rounded-lg border border-[#E8DCCB] bg-white text-[#2E2E2E] text-xs font-semibold hover:bg-[#F5EFE7]'
                    }
                    disabled={highlightItems.length <= 1}
                    onClick={() => setHighlightItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3">
                  <textarea
                    className={inputClassName()}
                    value={item.description}
                    onChange={(e) =>
                      setHighlightItems((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, description: e.target.value } : p)),
                      )
                    }
                    placeholder="Details/description (optional)"
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[#E8DCCB] bg-gray-50 p-4">
          <div className="text-sm font-semibold text-[#2E2E2E]">Highlight cover image</div>
          <div className="mt-4">
            <CampaignUploadTile label="Highlights image" hint="Optional cover image" aspect="wide" />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
