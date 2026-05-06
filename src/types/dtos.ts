// ---------------------------------------------------------------------------
// Campaign (list API + builder UI shapes)
// ---------------------------------------------------------------------------

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
  | 'images'
  | 'overview'
  | 'media'
  | 'floorplans'
  | 'amenities'
  | 'highlights'
  | 'benefits'
  | 'location'

export type CampaignListResponse = { items: ExistingCampaign[] }

export type BannerImage = { src: string; alt: string; file?: File }

export type MediaFile = { url: string; file?: File }

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
  part?: 'external' | 'internal'
  feature: boolean
  wideBottom: boolean
  images: BannerImage[]
}

export type FloorTabKey = string

export type FloorRow = { configuration: string; carpetArea: string; floorRange: string; price: string }

export type SocialInfraGroup = { title: string; items: { name: string; value: string }[] }

// ---------------------------------------------------------------------------
// Capture leads (API)
// ---------------------------------------------------------------------------

export type CaptureLeadDTO = {
  id: string
  source: string | null
  firstCallDate: string | null
  callBy: string | null
  name: string
  number: string
  email: string | null
  whatsappNumber: string | null
  bhk: string | null
  budget: string | null
  resiLocation: string | null
  propertyOwnership: string | null
  workLocation: string | null
  workProfile: string | null
  industryType: string | null
  preferredLocation: string[]
  possessionDate: string | null
  status: string | null
  propertyBuyingStage: string | null
  callbackDate: string | null
  /** Local time string from `<input type="time">`, e.g. `14:30` */
  callbackTime: string | null
  created_at?: string
  updated_at?: string
}

export type CaptureLeadCreatePayload = Omit<CaptureLeadDTO, 'id' | 'created_at' | 'updated_at'>
export type CaptureLeadPatchPayload = Partial<CaptureLeadCreatePayload>

export type BulkCaptureLeadRow = { name: string; number: string; email: string }

export type BulkCaptureLeadsResponse = { count: number; items: CaptureLeadDTO[] }

export type BulkCaptureLeadsValidationFailure = {
  rowNumber: number
  name: string
  phone: string
  email: string
  errors: string[]
}

// ---------------------------------------------------------------------------
// Site visits (API)
// ---------------------------------------------------------------------------

export type SiteVisitDTO = {
  id: string
  leadId: string
  projectId: string
  date: string
  time: string
  notes: string
  created_at?: string
  updated_at?: string
}

export type SiteVisitCreatePayload = Omit<SiteVisitDTO, 'id' | 'created_at' | 'updated_at'>

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type AuthUserDTO = {
  id: string
  name: string
  email: string
  role?: string | null
}

export type AuthResponseDTO = {
  token: string
  user: AuthUserDTO
}

// ---------------------------------------------------------------------------
// CRM directory users (`GET /api/auth/users`)
// ---------------------------------------------------------------------------

export type CrmUserDTO = {
  id: string
  name: string
  email: string
  role?: string | null
  /** Sequelize uses these keys when model timestamps are `createdAt: "created_at"`. */
  created_at?: string
  updated_at?: string
}

// ---------------------------------------------------------------------------
// Uploads (API)
// ---------------------------------------------------------------------------

export type UploadImageResponse = {
  message: string
  url: string
  file: { filename: string; mimetype: string; size: number }
}

export type ApiUploadImageOptions = {
  /** Store on API disk only; use promoteLocalDraftImageUrl or save-time upload for S3. */
  draft?: boolean
}
