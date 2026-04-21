import type { Dispatch, SetStateAction } from 'react'

import { SectionCard } from '../ui/SectionCard'
import { UploadTile } from '../ui/UploadTile'
import { inputClassName } from '../ui/classNames'

export function AmenitiesSection({
  amenityItems,
  setAmenityItems,
}: {
  amenityItems: { name: string }[]
  setAmenityItems: Dispatch<SetStateAction<{ name: string }[]>>
}) {
  return (
    <SectionCard title="Amenities" subtitle="Amenity cards + optional image/icon per amenity.">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">Amenity list</div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {amenityItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className={inputClassName()}
                  value={item.name}
                  onChange={(e) =>
                    setAmenityItems((prev) => prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)))
                  }
                  placeholder="Amenity name (e.g. Infinity Pool)"
                />
                <button
                  type="button"
                  className={
                    amenityItems.length <= 1
                      ? 'h-10 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed'
                      : 'h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
                  }
                  disabled={amenityItems.length <= 1}
                  onClick={() => setAmenityItems((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 w-max"
              onClick={() => setAmenityItems((prev) => [...prev, { name: '' }])}
            >
              Add amenity
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">Amenity background image (optional)</div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UploadTile label="Amenities BG" hint="Section background image" aspect="wide" />
            <UploadTile label="Amenities side image" hint="Optional side/cover image" aspect="tall" />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
