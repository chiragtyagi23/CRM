import type { Dispatch, SetStateAction } from 'react'
import type { BannerImage } from '../types/campaign'
import { SectionCard } from '../ui/campaign/SectionCard'
import { CampaignUploadTile } from './CampaignUploadTile'

const defaultTileHint = 'Paste image URL or select a file. Upload will happen when you save the campaign.'

export function CampaignImageListSection({
  title,
  subtitle,
  max,
  aspect,
  altPlaceholder,
  labelPrefix = 'Image',
  tileHint = defaultTileHint,
  images,
  setImages,
}: {
  title: string
  subtitle: string
  max: number
  aspect: 'banner' | 'wide' | 'square' | 'tall'
  altPlaceholder?: string
  labelPrefix?: string
  tileHint?: string
  images: BannerImage[]
  setImages: Dispatch<SetStateAction<BannerImage[]>>
}) {
  return (
    <SectionCard title={title} subtitle={subtitle}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">{images.length}/{max} images</div>
        <button
          type="button"
          className={
            images.length >= max
              ? 'h-10 px-4 rounded-lg bg-gray-100 text-gray-400 text-sm font-semibold cursor-not-allowed'
              : 'h-10 px-4 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50'
          }
          disabled={images.length >= max}
          onClick={() => setImages((prev) => (prev.length >= max ? prev : [...prev, { src: '', alt: '' }]))}
        >
          Add image
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {images.map((b, idx) => (
          <CampaignUploadTile
            key={idx}
            label={`${labelPrefix} ${idx + 1}`}
            hint={tileHint}
            aspect={aspect}
            uploadMode="defer"
            altPlaceholder={altPlaceholder}
            allowMultiple
            value={b}
            onChange={(next) => setImages((prev) => prev.map((p, i) => (i === idx ? next : p)))}
            onAddMany={(items) => {
              const remaining = max - images.length
              const toAdd = items.slice(0, remaining)
              if (!toAdd.length) return
              setImages((prev) => [...prev, ...toAdd.map((x) => ({ src: x.src, alt: x.alt, file: x.file }))])
            }}
            onRemove={images.length <= 1 ? undefined : () => setImages((prev) => prev.filter((_, i) => i !== idx))}
          />
        ))}
      </div>
    </SectionCard>
  )
}

