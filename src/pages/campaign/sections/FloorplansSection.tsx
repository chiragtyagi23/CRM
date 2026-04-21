import type { Dispatch, SetStateAction } from 'react'

import type { BannerImage, FloorRow, FloorTabKey } from '../types'
import { SectionCard } from '../ui/SectionCard'
import { UploadTile } from '../ui/UploadTile'
import { inputClassName } from '../ui/classNames'

const FLOOR_TABS: FloorTabKey[] = ['bhk3', 'bhk4', 'bhk5']

export function FloorplansSection({
  floorBlueprintImage,
  setFloorBlueprintImage,
  floorDefaultTab,
  setFloorDefaultTab,
  floorRows,
  setFloorRows,
  floorPlanImages,
  setFloorPlanImages,
}: {
  floorBlueprintImage: string
  setFloorBlueprintImage: Dispatch<SetStateAction<string>>
  floorDefaultTab: FloorTabKey
  setFloorDefaultTab: Dispatch<SetStateAction<FloorTabKey>>
  floorRows: Record<FloorTabKey, FloorRow[]>
  setFloorRows: Dispatch<SetStateAction<Record<FloorTabKey, FloorRow[]>>>
  floorPlanImages: Record<FloorTabKey, BannerImage[]>
  setFloorPlanImages: Dispatch<SetStateAction<Record<FloorTabKey, BannerImage[]>>>
}) {
  return (
    <SectionCard title="Floor plans" subtitle="BHK tabs and type-wise images (3BHK/4BHK/5BHK).">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">Blueprint image URL</div>
          <div className="mt-3">
            <input className={inputClassName()} value={floorBlueprintImage} onChange={(e) => setFloorBlueprintImage(e.target.value)} placeholder="/blueprints/..." />
          </div>
          <div className="mt-4 flex gap-2">
            {FLOOR_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={floorDefaultTab === tab ? 'h-9 px-3 rounded-lg bg-violet-600 text-white text-xs font-semibold' : 'h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'}
                onClick={() => setFloorDefaultTab(tab)}
              >
                {tab === 'bhk3' ? '3 BHK' : tab === 'bhk4' ? '4 BHK' : '5 BHK'}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
            <div className="font-semibold text-gray-900">Rows (Configuration / Carpet / Floor / Price)</div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {floorRows[floorDefaultTab].map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    className={inputClassName()}
                    placeholder="Configuration"
                    value={row.configuration}
                    onChange={(e) =>
                      setFloorRows((p) => ({
                        ...p,
                        [floorDefaultTab]: p[floorDefaultTab].map((r, i) => (i === idx ? { ...r, configuration: e.target.value } : r)),
                      }))
                    }
                  />
                  <input
                    className={inputClassName()}
                    placeholder="Carpet Area"
                    value={row.carpetArea}
                    onChange={(e) =>
                      setFloorRows((p) => ({
                        ...p,
                        [floorDefaultTab]: p[floorDefaultTab].map((r, i) => (i === idx ? { ...r, carpetArea: e.target.value } : r)),
                      }))
                    }
                  />
                  <input
                    className={inputClassName()}
                    placeholder="Floor Range"
                    value={row.floorRange}
                    onChange={(e) =>
                      setFloorRows((p) => ({
                        ...p,
                        [floorDefaultTab]: p[floorDefaultTab].map((r, i) => (i === idx ? { ...r, floorRange: e.target.value } : r)),
                      }))
                    }
                  />
                  <input
                    className={inputClassName()}
                    placeholder="Price"
                    value={row.price}
                    onChange={(e) =>
                      setFloorRows((p) => ({
                        ...p,
                        [floorDefaultTab]: p[floorDefaultTab].map((r, i) => (i === idx ? { ...r, price: e.target.value } : r)),
                      }))
                    }
                  />
                </div>
              ))}
              <button
                type="button"
                className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50 w-max"
                onClick={() =>
                  setFloorRows((p) => ({
                    ...p,
                    [floorDefaultTab]: [...p[floorDefaultTab], { configuration: '', carpetArea: '', floorRange: '', price: '' }],
                  }))
                }
              >
                Add row
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-900">Floor plan images ({floorDefaultTab})</div>
            <button
              type="button"
              className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
              onClick={() =>
                setFloorPlanImages((p) => ({
                  ...p,
                  [floorDefaultTab]: [...p[floorDefaultTab], { src: '', alt: '' }],
                }))
              }
            >
              Add image
            </button>
          </div>
          <div className="mt-1 text-xs text-gray-500">Upload or paste image URL. You can remove images.</div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {floorPlanImages[floorDefaultTab].map((img, idx) => (
              <UploadTile
                key={idx}
                label={`Floor plan ${idx + 1}`}
                hint="Paste image URL or use Upload."
                aspect="wide"
                value={img}
                onChange={(next) =>
                  setFloorPlanImages((p) => ({
                    ...p,
                    [floorDefaultTab]: p[floorDefaultTab].map((it, i) => (i === idx ? next : it)),
                  }))
                }
                onRemove={
                  floorPlanImages[floorDefaultTab].length <= 1
                    ? undefined
                    : () =>
                        setFloorPlanImages((p) => ({
                          ...p,
                          [floorDefaultTab]: p[floorDefaultTab].filter((_, i) => i !== idx),
                        }))
                }
              />
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
