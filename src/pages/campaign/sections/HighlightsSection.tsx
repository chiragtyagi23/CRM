import type { Dispatch, SetStateAction } from 'react'

import { SectionCard } from '../ui/SectionCard'
import { UploadTile } from '../ui/UploadTile'
import { inputClassName } from '../ui/classNames'

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
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">Highlight items</div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {highlightItems.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-center gap-2">
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
                        ? 'h-10 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed'
                        : 'h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
                    }
                    disabled={highlightItems.length <= 1}
                    onClick={() => setHighlightItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-2">
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
            <button
              type="button"
              className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 w-max"
              onClick={() => setHighlightItems((prev) => [...prev, { title: '', description: '' }])}
            >
              Add highlight
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">Highlight cover image</div>
          <div className="mt-4">
            <UploadTile label="Highlights image" hint="Optional cover image" aspect="wide" />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
