import { useState } from 'react'

import { CampaignImageListSection } from '../../../components/CampaignImageListSection'
import type { BannerImage, GalleryCell } from '../../../types/dtos'
import { GallerySection } from './GallerySection'

type ImagesTab = 'banners' | 'offers' | 'usp' | 'gallery'

export function ImagesSection({
  bannerImages,
  setBannerImages,
  offerCreatives,
  setOfferCreatives,
  uspImages,
  setUspImages,
  galleryCells,
  setGalleryCells,
}: {
  bannerImages: BannerImage[]
  setBannerImages: (next: BannerImage[] | ((prev: BannerImage[]) => BannerImage[])) => void
  offerCreatives: BannerImage[]
  setOfferCreatives: (next: BannerImage[] | ((prev: BannerImage[]) => BannerImage[])) => void
  uspImages: BannerImage[]
  setUspImages: (next: BannerImage[] | ((prev: BannerImage[]) => BannerImage[])) => void
  galleryCells: GalleryCell[]
  setGalleryCells: (next: GalleryCell[] | ((prev: GalleryCell[]) => GalleryCell[])) => void
}) {
  const [tab, setTab] = useState<ImagesTab>('banners')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          className={
            tab === 'banners'
              ? 'h-9 px-4 rounded-xl bg-violet-600 text-white text-xs font-semibold'
              : 'h-9 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
          }
          onClick={() => setTab('banners')}
        >
          Banners
        </button>
        <button
          type="button"
          className={
            tab === 'offers'
              ? 'h-9 px-4 rounded-xl bg-violet-600 text-white text-xs font-semibold'
              : 'h-9 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
          }
          onClick={() => setTab('offers')}
        >
          Festival / Offer
        </button>
        <button
          type="button"
          className={
            tab === 'usp'
              ? 'h-9 px-4 rounded-xl bg-violet-600 text-white text-xs font-semibold'
              : 'h-9 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
          }
          onClick={() => setTab('usp')}
        >
          USP images
        </button>
        <button
          type="button"
          className={
            tab === 'gallery'
              ? 'h-9 px-4 rounded-xl bg-violet-600 text-white text-xs font-semibold'
              : 'h-9 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
          }
          onClick={() => setTab('gallery')}
        >
          Gallery
        </button>
      </div>

      {tab === 'banners' ? (
        <CampaignImageListSection
          title="Banner images *"
          subtitle="Add up to 5 banner images for the hero slider. Paste image URLs (recommended)."
          max={5}
          aspect="banner"
          labelPrefix="Banner"
          tileHint="Paste image URL (recommended). Upload is only for preview unless you add storage."
          images={bannerImages}
          setImages={setBannerImages}
        />
      ) : null}
      {tab === 'offers' ? (
        <CampaignImageListSection
          title="Festival / Offer creatives"
          subtitle="WhatsApp-style promotional creatives. Add up to 5 images. Use the Alt field to store time text (e.g. Till 9 PM, 2 days left, Offer ends in 1:30)."
          max={5}
          aspect="tall"
          altPlaceholder="Time text (e.g. Till 9 PM, 2 days left)"
          images={offerCreatives}
          setImages={setOfferCreatives}
        />
      ) : null}
      {tab === 'usp' ? (
        <CampaignImageListSection
          title="USP images"
          subtitle="2–3 images that represent project differentiation. Max 3."
          max={3}
          aspect="wide"
          images={uspImages}
          setImages={setUspImages}
        />
      ) : null}
      {tab === 'gallery' ? <GallerySection galleryCells={galleryCells} setGalleryCells={setGalleryCells} /> : null}
    </div>
  )
}

