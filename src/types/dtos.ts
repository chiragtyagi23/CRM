// ---------------------------------------------------------------------------
// Campaign (list API + builder UI shapes)
// ---------------------------------------------------------------------------

export type ExistingCampaign = {
  id: string
  title: string
  assignTo?: string | null
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

export type LeadManualTimelineEntry = {
  type: 'call' | 'email'
  projectId: string
  projectName: string
  note: string
  date: string
  time: string
}

export type LeadWebhookTimelineEntry = {
  type: 'webhook_received'
  source?: string | null
  at: string
  message?: string | null
  propertyType?: string | null
  propertyId?: string | null
  city?: string | null
  payload?: Record<string, unknown>
}

export type LeadEmailAutoReplyTimelineEntry = {
  type: 'email_auto_reply'
  at: string
  status: 'sent' | 'failed' | 'skipped' | 'dev_logged'
  to?: string | null
  source?: string | null
  error?: string | null
  reason?: string | null
}

export type LeadActivityTimelineEntry =
  | LeadManualTimelineEntry
  | LeadWebhookTimelineEntry
  | LeadEmailAutoReplyTimelineEntry

export type LeadInterestedProject = {
  projectId: string
  projectName: string
}

export type CaptureLeadDTO = {
  id: string
  campaignId: string | null
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
  /** Pipeline: NEW, CONTACTED, QUALIFIED, OPPORTUNITY, SITE VISIT */
  status: string | null
  /** Temperature: HOT, WARM, COLD */
  leadScore: string | null
  propertyBuyingStage: string | null
  callbackDate: string | null
  /** Local time string from `<input type="time">`, e.g. `14:30` */
  callbackTime: string | null
  activityTimeline?: LeadActivityTimelineEntry[]
  interestedProjects?: LeadInterestedProject[]
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
  /** Resolved on GET /api/site-visits — no separate leads/campaigns fetch needed. */
  leadName?: string | null
  leadLocation?: string | null
  projectName?: string | null
  created_at?: string
  updated_at?: string
}

export type SiteVisitCreatePayload = Omit<SiteVisitDTO, 'id' | 'created_at' | 'updated_at'>

export type AssigneeOptionDTO = {
  id: string
  name: string
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type AuthRoleDTO = {
  id: string
  name: string
  description?: string | null
}

export type AuthUserDTO = {
  id: string
  name: string
  email: string
  role?: string | AuthRoleDTO | null
}

export type AclModuleDTO = {
  id: string
  module_key: string
  name: string
  route: string
  icon?: string | null
  parent_id?: string | null
  sort_order?: number
}

export type AclOverrideDTO = {
  id: string
  module_id: string
  module_key: string
  effect: 'ALLOW' | 'DENY'
  reason?: string | null
}

export type AuthAccessDTO = {
  modules: AclModuleDTO[]
  overrides?: AclOverrideDTO[]
  permissions?: {
    leads?: {
      view: boolean
      assignTo: boolean
      delete: boolean
      assignedOnly: boolean
    }
    campaign?: {
      view: boolean
      details: boolean
      assignTo: boolean
      edit: boolean
    }
    profile?: {
      view: boolean
      newUser: boolean
      allUserTable: boolean
    }
  }
}

export type AuthResponseDTO = {
  token: string
  user: AuthUserDTO
  access?: AuthAccessDTO
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
