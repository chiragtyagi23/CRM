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
      <div className="rounded-xl border border-[#E8DCCB] bg-gray-50 p-4">
        <div className="text-sm font-semibold text-[#2E2E2E]">Amenity list</div>
        <div className="mt-3 grid grid-cols-1 gap-3">
          {amenityItems.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-[#E8DCCB] bg-white p-3">
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
                    <div className="text-xs text-[#8B7355]">{(item.icons ?? []).length} icons</div>
                    <button
                      type="button"
                      className="h-8 rounded-lg border border-[#E8DCCB] bg-white px-3 text-xs font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7]"
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
                      ? 'h-10 px-3 rounded-lg bg-gray-100 text-[#8B7355] text-xs font-semibold cursor-not-allowed'
                      : 'h-10 px-3 rounded-lg border border-[#E8DCCB] bg-white text-[#2E2E2E] text-xs font-semibold hover:bg-[#F5EFE7]'
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
            className="h-10 w-max rounded-lg border border-[#E8DCCB] bg-white px-4 text-sm font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7]"
            onClick={() => setAmenityItems((prev) => [...prev, { name: '', icons: [{ src: '', alt: '' }] }])}
          >
            Add amenity
          </button>
        </div>
      </div>
    </SectionCard>
  )
}
