import type { Dispatch, SetStateAction } from 'react'

import type { GalleryCell } from '../types'
import { Field } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { UploadTile } from '../ui/UploadTile'
import { inputClassName } from '../ui/classNames'

export function GallerySection({
  galleryCells,
  setGalleryCells,
}: {
  galleryCells: GalleryCell[]
  setGalleryCells: Dispatch<SetStateAction<GalleryCell[]>>
}) {
  return (
    <>
      <SectionCard title="Gallery" subtitle="Create image groups (Kitchen, Living Room, etc.) with add/remove and image URLs.">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">{galleryCells.length} groups</div>
          <button
            type="button"
            className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50"
            onClick={() =>
              setGalleryCells((prev) => [
                ...prev,
                { tag: '', feature: false, wideBottom: false, images: [{ src: '', alt: '' }] },
              ])
            }
          >
            Add group
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          {galleryCells.map((cell, cellIdx) => (
            <div key={cellIdx} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Group tag (e.g. Kitchen)" required>
                    <input
                      className={inputClassName()}
                      value={cell.tag}
                      onChange={(e) =>
                        setGalleryCells((prev) => prev.map((c, i) => (i === cellIdx ? { ...c, tag: e.target.value } : c)))
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={cell.feature}
                        onChange={(e) =>
                          setGalleryCells((prev) =>
                            prev.map((c, i) => (i === cellIdx ? { ...c, feature: e.target.checked } : c)),
                          )
                        }
                      />
                      Featured
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={cell.wideBottom}
                        onChange={(e) =>
                          setGalleryCells((prev) =>
                            prev.map((c, i) => (i === cellIdx ? { ...c, wideBottom: e.target.checked } : c)),
                          )
                        }
                      />
                      Wide bottom
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  className={
                    galleryCells.length <= 1
                      ? 'h-9 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed'
                      : 'h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
                  }
                  disabled={galleryCells.length <= 1}
                  onClick={() => setGalleryCells((prev) => prev.filter((_, i) => i !== cellIdx))}
                >
                  Remove group
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs text-gray-500">{cell.images.length} images</div>
                <button
                  type="button"
                  className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
                  onClick={() =>
                    setGalleryCells((prev) =>
                      prev.map((c, i) =>
                        i === cellIdx ? { ...c, images: [...c.images, { src: '', alt: '' }] } : c,
                      ),
                    )
                  }
                >
                  Add image
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cell.images.map((img, imgIdx) => (
                  <UploadTile
                    key={imgIdx}
                    label={`Image ${imgIdx + 1}`}
                    hint="Paste image URL (recommended)."
                    aspect="wide"
                    value={img}
                    onChange={(next) =>
                      setGalleryCells((prev) =>
                        prev.map((c, i) =>
                          i === cellIdx ? { ...c, images: c.images.map((im, j) => (j === imgIdx ? next : im)) } : c,
                        ),
                      )
                    }
                    onRemove={
                      cell.images.length <= 1
                        ? undefined
                        : () =>
                            setGalleryCells((prev) =>
                              prev.map((c, i) =>
                                i === cellIdx ? { ...c, images: c.images.filter((_, j) => j !== imgIdx) } : c,
                              ),
                            )
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  )
}
