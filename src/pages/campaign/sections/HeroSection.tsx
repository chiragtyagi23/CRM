import type { Dispatch, SetStateAction } from 'react'

import type { BannerImage } from '../types'
import { SectionCard } from '../ui/SectionCard'
import { UploadTile } from '../ui/UploadTile'

export function HeroSection({
  bannerImages,
  setBannerImages,
}: {
  bannerImages: BannerImage[]
  setBannerImages: Dispatch<SetStateAction<BannerImage[]>>
}) {
  return (
    <>
      <SectionCard
        title="Banner images *"
        subtitle="Add up to 5 banner images for the hero slider. Paste image URLs (recommended)."
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">{bannerImages.length}/5 images</div>
          <button
            type="button"
            className={
              bannerImages.length >= 5
                ? 'h-10 px-4 rounded-lg bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed'
                : 'h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50'
            }
            disabled={bannerImages.length >= 5}
            onClick={() => setBannerImages((prev) => (prev.length >= 5 ? prev : [...prev, { src: '', alt: '' }]))}
          >
            Add image
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bannerImages.map((b, idx) => (
            <UploadTile
              key={idx}
              label={`Banner ${idx + 1}`}
              hint="Paste image URL (recommended). Upload is only for preview unless you add storage."
              aspect="banner"
              uploadMode="defer"
              value={b}
              onChange={(next) => setBannerImages((prev) => prev.map((p, i) => (i === idx ? next : p)))}
              onRemove={
                bannerImages.length <= 1 ? undefined : () => setBannerImages((prev) => prev.filter((_, i) => i !== idx))
              }
            />
          ))}
        </div>
      </SectionCard>
    </>
  )
}
