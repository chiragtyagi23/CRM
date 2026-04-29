import type { Dispatch, SetStateAction } from 'react'

import { CampaignUploadTile } from '../../../components/CampaignUploadTile'
import { SectionCard } from '../../../ui/campaign/SectionCard'
import { inputClassName } from '../../../ui/campaign/classNames'

export function AmenitiesSection({
  amenityItems,
  setAmenityItems,
}: {
  amenityItems: { name: string; icons: { src: string; alt: string; file?: File }[] }[]
  setAmenityItems: Dispatch<
    SetStateAction<{ name: string; icons: { src: string; alt: string; file?: File }[] }[]>
  >
}) {
  return (
    <SectionCard title="Amenities" subtitle="Amenity cards + multiple icons per amenity (upload or paste icon URLs).">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="text-sm font-semibold text-gray-900">Amenity list</div>
        <div className="mt-3 grid grid-cols-1 gap-3">
          {amenityItems.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <input
                    className={inputClassName()}
                    value={item.name}
                    onChange={(e) =>
                      setAmenityItems((prev) => prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)))
                    }
                    placeholder="Amenity name (e.g. Infinity Pool)"
                  />

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-xs text-gray-500">{(item.icons ?? []).length} icons</div>
                    <button
                      type="button"
                      className="h-8 rounded-lg border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                      onClick={() =>
                        setAmenityItems((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, icons: [...(p.icons ?? []), { src: '', alt: '' }] } : p)),
                        )
                      }
                    >
                      Add icon
                    </button>
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    {(item.icons ?? []).map((ic, icIdx) => (
                      <CampaignUploadTile
                        key={icIdx}
                        label={`Icon ${icIdx + 1}`}
                        hint=""
                        aspect="square"
                        uploadMode="defer"
                        allowMultiple
                        compact
                        value={ic}
                        onChange={(next) =>
                          setAmenityItems((prev) =>
                            prev.map((p, i) =>
                              i === idx ? { ...p, icons: (p.icons ?? []).map((x, j) => (j === icIdx ? next : x)) } : p,
                            ),
                          )
                        }
                        onAddMany={(items) =>
                          setAmenityItems((prev) =>
                            prev.map((p, i) =>
                              i === idx
                                ? { ...p, icons: [...(p.icons ?? []), ...items.map((x) => ({ src: x.src, alt: x.alt, file: x.file }))] }
                                : p,
                            ),
                          )
                        }
                        onRemove={
                          (item.icons ?? []).length <= 1
                            ? undefined
                            : () =>
                                setAmenityItems((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, icons: (p.icons ?? []).filter((_, j) => j !== icIdx) } : p)),
                                )
                        }
                      />
                    ))}
                  </div>
                </div>

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
            </div>
          ))}
          <button
            type="button"
            className="h-10 w-max rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            onClick={() => setAmenityItems((prev) => [...prev, { name: '', icons: [{ src: '', alt: '' }] }])}
          >
            Add amenity
          </button>
        </div>
      </div>
    </SectionCard>
  )
}
