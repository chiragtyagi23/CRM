import { useId, useMemo, useState, type Dispatch, type SetStateAction } from 'react'

import type { GalleryCell } from '../types'
import { Field } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { UploadTile } from '../ui/UploadTile'
import { inputClassName } from '../ui/classNames'

type GalleryPart = 'external' | 'internal'

function defaultTagForPart() {
  return ''
}

export function GallerySection({
  galleryCells,
  setGalleryCells,
}: {
  galleryCells: GalleryCell[]
  setGalleryCells: Dispatch<SetStateAction<GalleryCell[]>>
}) {
  const [part, setPart] = useState<GalleryPart>('external')
  const multiIds = useId()

  const sorted = useMemo(() => {
    return galleryCells.map((c, idx) => ({ c, idx }))
  }, [galleryCells])

  const visible = sorted.filter(({ c }) => {
    const tag = String(c.tag ?? '').trim()
    if (tag.startsWith('__')) return false
    // Keep groups in the tab where they were created.
    const cellPart = c.part ?? 'external'
    return cellPart === part
  })

  return (
    <>
      <SectionCard
        title="Gallery *"
        subtitle="Split into External (first) and Internal (second). Groups follow strict storytelling order."
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={
                part === 'external'
                  ? 'h-9 px-4 rounded-xl bg-violet-600 text-white text-xs font-semibold'
                  : 'h-9 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
              }
              onClick={() => setPart('external')}
            >
              External images
            </button>
            <button
              type="button"
              className={
                part === 'internal'
                  ? 'h-9 px-4 rounded-xl bg-violet-600 text-white text-xs font-semibold'
                  : 'h-9 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
              }
              onClick={() => setPart('internal')}
            >
              Internal images
            </button>
          </div>

          <button
            type="button"
            className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50"
            onClick={() =>
              setGalleryCells((prev) => [
                ...prev,
                {
                  tag: defaultTagForPart(),
                  part,
                  feature: false,
                  wideBottom: false,
                  images: [{ src: '', alt: '' }],
                },
              ])
            }
          >
            Add group
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4">
          {visible.map(({ c: cell, idx: cellIdx }) => (
            <div key={cellIdx} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Group tag" required>
                    <input
                      className={inputClassName()}
                      placeholder={part === 'external' ? 'Exterior / Amenities - Gym ...' : 'Interiors - Living Room ...'}
                      value={cell.tag}
                      onChange={(e) =>
                        setGalleryCells((prev) => prev.map((c, i) => (i === cellIdx ? { ...c, tag: e.target.value } : c)))
                      }
                    />
                    <div className="mt-2 text-[11px] font-medium text-gray-500">
                      {part === 'external'
                        ? 'External order: Exterior → Amenities - Swimming pool → Garden → Gym → Clubhouse'
                        : 'Internal order: Interiors - Living Room → Kitchen → Bedroom → Bathroom (optional)'}
                    </div>
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
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <input
                    id={`${multiIds}-g-${cellIdx}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    multiple
                    onChange={async (e) => {
                      const files = Array.from(e.target.files ?? [])
                      e.target.value = ''
                      if (!files.length) return
                      const { buildImageValueFromFile } = await import('../ui/UploadTile')
                      const items = await Promise.all(files.map((f) => buildImageValueFromFile(f, 'Image')))
                      setGalleryCells((prev) =>
                        prev.map((c, i) =>
                          i === cellIdx
                            ? { ...c, images: [...c.images, ...items.map((x) => ({ src: x.src, alt: x.alt, file: x.file }))] }
                            : c,
                        ),
                      )
                    }}
                  />
                  <label
                    htmlFor={`${multiIds}-g-${cellIdx}`}
                    className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50 cursor-pointer inline-flex items-center justify-center"
                  >
                    Add multiple
                  </label>
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
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cell.images.map((img, imgIdx) => (
                  <UploadTile
                    key={imgIdx}
                    label={`Image ${imgIdx + 1}`}
                    hint="Paste image URL (recommended)."
                    aspect="wide"
                    uploadMode="defer"
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
