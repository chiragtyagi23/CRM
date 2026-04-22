import type { Dispatch, SetStateAction } from 'react'

import type { BannerImage, FloorRow, FloorTabKey } from '../types'
import { SectionCard } from '../ui/SectionCard'
import { UploadTile } from '../ui/UploadTile'
import { inputClassName } from '../ui/classNames'

export function FloorplansSection({
  floorBlueprintImage,
  setFloorBlueprintImage,
  floorDefaultTab,
  setFloorDefaultTab,
  floorTabs,
  setFloorTabs,
  floorRows,
  setFloorRows,
  floorPlanImages,
  setFloorPlanImages,
}: {
  floorBlueprintImage: string
  setFloorBlueprintImage: Dispatch<SetStateAction<string>>
  floorDefaultTab: FloorTabKey
  setFloorDefaultTab: Dispatch<SetStateAction<FloorTabKey>>
  floorTabs: { id: FloorTabKey; label: string }[]
  setFloorTabs: Dispatch<SetStateAction<{ id: FloorTabKey; label: string }[]>>
  floorRows: Record<string, FloorRow[]>
  setFloorRows: Dispatch<SetStateAction<Record<string, FloorRow[]>>>
  floorPlanImages: Record<string, BannerImage[]>
  setFloorPlanImages: Dispatch<SetStateAction<Record<string, BannerImage[]>>>
}) {
  return (
    <SectionCard title="Floor plans *" subtitle="BHK tabs and type-wise images (add 1BHK/2BHK/3BHK/...).">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-900">BHK tabs</div>
            <button
              type="button"
              className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
              onClick={() =>
                setFloorTabs((prev) => {
                  const nextId = `bhk${prev.length + 1}`
                  return [...prev, { id: nextId, label: `${prev.length + 1} BHK` }]
                })
              }
            >
              Add tab
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {floorTabs.map((t) => (
              <div key={t.id} className="grid grid-cols-[1fr_110px] gap-2 items-center">
                <input
                  className={inputClassName()}
                  value={t.label}
                  onChange={(e) => setFloorTabs((prev) => prev.map((x) => (x.id === t.id ? { ...x, label: e.target.value } : x)))}
                  placeholder="e.g. 2 BHK"
                />
                <button
                  type="button"
                  className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
                  onClick={() =>
                    setFloorTabs((prev) => (prev.length <= 1 ? prev : prev.filter((x) => x.id !== t.id)))
                  }
                  disabled={floorTabs.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="text-sm font-semibold text-gray-900">Blueprint image URL</div>
          <div className="mt-3">
            <input className={inputClassName()} value={floorBlueprintImage} onChange={(e) => setFloorBlueprintImage(e.target.value)} placeholder="/blueprints/..." />
          </div>
          <div className="mt-4 flex gap-2">
            {floorTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={floorDefaultTab === tab.id ? 'h-9 px-3 rounded-lg bg-violet-600 text-white text-xs font-semibold' : 'h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'}
                onClick={() => setFloorDefaultTab(tab.id)}
              >
                {tab.label || tab.id}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
            <div className="font-semibold text-gray-900">Rows (Configuration / Carpet / Floor / Price)</div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {(floorRows[floorDefaultTab] ?? []).map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    className={inputClassName()}
                    placeholder="Configuration"
                    value={row.configuration}
                    onChange={(e) =>
                      setFloorRows((p) => ({
                        ...p,
                        [floorDefaultTab]: (p[floorDefaultTab] ?? []).map((r, i) => (i === idx ? { ...r, configuration: e.target.value } : r)),
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
                        [floorDefaultTab]: (p[floorDefaultTab] ?? []).map((r, i) => (i === idx ? { ...r, carpetArea: e.target.value } : r)),
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
                        [floorDefaultTab]: (p[floorDefaultTab] ?? []).map((r, i) => (i === idx ? { ...r, floorRange: e.target.value } : r)),
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
                        [floorDefaultTab]: (p[floorDefaultTab] ?? []).map((r, i) => (i === idx ? { ...r, price: e.target.value } : r)),
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
                    [floorDefaultTab]: [...(p[floorDefaultTab] ?? []), { configuration: '', carpetArea: '', floorRange: '', price: '' }],
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
                  [floorDefaultTab]: [...(p[floorDefaultTab] ?? []), { src: '', alt: '' }],
                }))
              }
            >
              Add image
            </button>
          </div>
          <div className="mt-1 text-xs text-gray-500">Upload or paste image URL. You can remove images.</div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {(floorPlanImages[floorDefaultTab] ?? []).map((img, idx) => (
              <UploadTile
                key={idx}
                label={`Floor plan ${idx + 1}`}
                hint="Paste image URL or use Upload."
                aspect="wide"
                uploadMode="defer"
                value={img}
                onChange={(next) =>
                  setFloorPlanImages((p) => ({
                    ...p,
                    [floorDefaultTab]: (p[floorDefaultTab] ?? []).map((it, i) => (i === idx ? next : it)),
                  }))
                }
                onRemove={
                  (floorPlanImages[floorDefaultTab] ?? []).length <= 1
                    ? undefined
                    : () =>
                        setFloorPlanImages((p) => ({
                          ...p,
                          [floorDefaultTab]: (p[floorDefaultTab] ?? []).filter((_, i) => i !== idx),
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
