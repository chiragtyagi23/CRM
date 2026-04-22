import type { Dispatch, SetStateAction } from 'react'

import type { BannerImage } from '../types'
import { Field } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { UploadTile } from '../ui/UploadTile'
import { inputClassName, textareaClassName } from '../ui/classNames'

export function BenefitsSection({
  benefitItems,
  setBenefitItems,
  benefitStats,
  setBenefitStats,
  benefitBackgroundImages,
  setBenefitBackgroundImages,
}: {
  benefitItems: { heading: string; description: string }[]
  setBenefitItems: Dispatch<SetStateAction<{ heading: string; description: string }[]>>
  benefitStats: { value: string; label: string }[]
  setBenefitStats: Dispatch<SetStateAction<{ value: string; label: string }[]>>
  benefitBackgroundImages: BannerImage[]
  setBenefitBackgroundImages: Dispatch<SetStateAction<BannerImage[]>>
}) {
  return (
    <>
      <SectionCard title="Benefits *" subtitle="Add benefit items (heading + description), stats, and background images.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-900">Benefit items</div>
              <button
                type="button"
                className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
                onClick={() => setBenefitItems((prev) => [...prev, { heading: '', description: '' }])}
              >
                Add benefit
              </button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {benefitItems.map((b, idx) => (
                <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs font-semibold text-gray-500">#{String(idx + 1).padStart(2, '0')}</div>
                    <button
                      type="button"
                      className={
                        benefitItems.length <= 1
                          ? 'h-8 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed'
                          : 'h-8 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
                      }
                      disabled={benefitItems.length <= 1}
                      onClick={() => setBenefitItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <Field label="Heading" required>
                      <input
                        className={inputClassName()}
                        value={b.heading}
                        onChange={(e) =>
                          setBenefitItems((prev) => prev.map((p, i) => (i === idx ? { ...p, heading: e.target.value } : p)))
                        }
                        placeholder="e.g. Flexible Payment Plans"
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        className={textareaClassName('min-h-24')}
                        value={b.description}
                        onChange={(e) =>
                          setBenefitItems((prev) => prev.map((p, i) => (i === idx ? { ...p, description: e.target.value } : p)))
                        }
                        placeholder="Write the benefit description…"
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">Stats</div>
                <button
                  type="button"
                  className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50"
                  onClick={() => setBenefitStats((prev) => [...prev, { value: '', label: '' }])}
                >
                  Add stat
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {benefitStats.map((s, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-[160px_1fr_auto] gap-2 items-center">
                    <input
                      className={inputClassName()}
                      placeholder="Value (e.g. 25+)"
                      value={s.value}
                      onChange={(e) =>
                        setBenefitStats((prev) => prev.map((p, i) => (i === idx ? { ...p, value: e.target.value } : p)))
                      }
                    />
                    <input
                      className={inputClassName()}
                      placeholder="Label (e.g. Projects Delivered)"
                      value={s.label}
                      onChange={(e) =>
                        setBenefitStats((prev) => prev.map((p, i) => (i === idx ? { ...p, label: e.target.value } : p)))
                      }
                    />
                    <button
                      type="button"
                      className={
                        benefitStats.length <= 1
                          ? 'h-10 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed'
                          : 'h-10 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
                      }
                      disabled={benefitStats.length <= 1}
                      onClick={() => setBenefitStats((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">Background images</div>
                <button
                  type="button"
                  className={
                    benefitBackgroundImages.length >= 5
                      ? 'h-9 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs font-semibold cursor-not-allowed'
                      : 'h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
                  }
                  disabled={benefitBackgroundImages.length >= 5}
                  onClick={() => setBenefitBackgroundImages((prev) => (prev.length >= 5 ? prev : [...prev, { src: '', alt: '' }]))}
                >
                  Add image
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500">{benefitBackgroundImages.length}/5 images</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefitBackgroundImages.map((img, idx) => (
                  <UploadTile
                    key={idx}
                    label={`Background ${idx + 1}`}
                    hint="Paste image URL (recommended)."
                    aspect="wide"
                    uploadMode="defer"
                    value={img}
                    onChange={(next) => setBenefitBackgroundImages((prev) => prev.map((p, i) => (i === idx ? next : p)))}
                    onRemove={
                      benefitBackgroundImages.length <= 1
                        ? undefined
                        : () => setBenefitBackgroundImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </>
  )
}
