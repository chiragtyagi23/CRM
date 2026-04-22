export type ExistingCampaign = {
  id: string
  title: string
  address: string | null
  regNo: string | null
  logo?: string | null
  templateKey?: 'luxury-template' | 'affordable-template'
  createdAt: string
}

export type TemplateSectionKey =
  | 'hero'
  | 'overview'
  | 'gallery'
  | 'media'
  | 'floorplans'
  | 'amenities'
  | 'highlights'
  | 'benefits'
  | 'location'

export type CampaignListResponse = { items: ExistingCampaign[] }

export type BannerImage = { src: string; alt: string; file?: File }

export type OverviewFactsState = {
  serialNumber: string
  codeName: string
  location: string
  landParcel: string
  project: string
  apartments: string
  building: string
  carpetAreas: string
}

export type GalleryCell = {
  tag: string
  feature: boolean
  wideBottom: boolean
  images: BannerImage[]
}

export type FloorTabKey = string

export type FloorRow = { configuration: string; carpetArea: string; floorRange: string; price: string }

export type SocialInfraGroup = { title: string; items: { name: string; value: string }[] }
