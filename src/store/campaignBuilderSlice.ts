import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import type { BannerImage, FloorRow, FloorTabKey, GalleryCell, MediaFile, OverviewFactsState, TemplateSectionKey } from '../types/campaign'

export type CampaignBuilderState = {
  activeSection: TemplateSectionKey
  selectedCampaignId: string | null
  templateKey: 'luxury-template' | 'affordable-template'

  campaignName: string
  projectLocation: string
  reraNo: string
  possessionDate: string

  logoUrl: string
  coverImageUrl: string

  bannerImages: BannerImage[]
  offerCreatives: BannerImage[]
  uspImages: BannerImage[]

  videos: { intro: MediaFile; walkthrough: MediaFile; extra: MediaFile }
  reels: { reel1: MediaFile; reel2: MediaFile; reel3: MediaFile }

  contactEmail: string
  contactMobile: string
  startingPrice: string
  completionDate: string
  bhkRange: string
  priceRange: string
  totalFloors: string
  squareFeetRanges: string

  overviewFacts: OverviewFactsState

  galleryCells: GalleryCell[]

  floorBlueprintImage: string
  floorDefaultTab: FloorTabKey
  floorTabs: { id: FloorTabKey; label: string }[]
  floorRows: Record<string, FloorRow[]>
  floorPlanImages: Record<string, BannerImage[]>

  amenityItems: { name: string; icons: BannerImage[] }[]
  highlightItems: { title: string; description: string }[]

  benefitStats: { value: string; label: string }[]
  benefitBackgroundImages: BannerImage[]
  benefitItems: { heading: string; description: string }[]

  socialInfrastructureGroups: { title: string; items: { name: string; value: string }[] }[]
}

const initialState: CampaignBuilderState = {
  activeSection: 'images',
  selectedCampaignId: null,
  templateKey: 'luxury-template',

  campaignName: '',
  projectLocation: '',
  reraNo: '',
  possessionDate: 'Dec 2026',

  logoUrl: '',
  coverImageUrl: '',

  bannerImages: [{ src: '', alt: '' }],
  offerCreatives: [{ src: '', alt: '' }],
  uspImages: [{ src: '', alt: '' }],

  videos: { intro: { url: '' }, walkthrough: { url: '' }, extra: { url: '' } },
  reels: { reel1: { url: '' }, reel2: { url: '' }, reel3: { url: '' } },

  contactEmail: '',
  contactMobile: '',
  startingPrice: '',
  completionDate: '',
  bhkRange: '',
  priceRange: '',
  totalFloors: '',
  squareFeetRanges: '',

  overviewFacts: {
    serialNumber: '',
    codeName: '',
    location: '',
    landParcel: '',
    project: '',
    apartments: '',
    building: '',
    carpetAreas: '',
  },

  galleryCells: [{ tag: '', part: 'external', feature: true, wideBottom: false, images: [{ src: '', alt: '' }] }],

  floorBlueprintImage: '',
  floorDefaultTab: 'bhk1',
  floorTabs: [{ id: 'bhk1', label: '1 BHK' }],
  floorRows: {
    bhk1: [{ configuration: '', carpetArea: '', floorRange: '', price: '' }],
  },
  floorPlanImages: {
    bhk1: [{ src: '', alt: '' }],
  },

  amenityItems: [{ name: '', icons: [{ src: '', alt: '' }] }],
  highlightItems: [{ title: '', description: '' }],

  benefitStats: [{ value: '', label: '' }],
  benefitBackgroundImages: [{ src: '', alt: '' }],
  benefitItems: [{ heading: '', description: '' }],

  socialInfrastructureGroups: [{ title: '', items: [{ name: '', value: '' }] }],
}

const slice = createSlice({
  name: 'campaignBuilder',
  initialState,
  reducers: {
    resetBuilder() {
      return initialState
    },
    hydrateFromDraft(_state, action: PayloadAction<any>) {
      const d = action.payload && typeof action.payload === 'object' ? action.payload : {}
      const merged = { ...initialState, ...d, selectedCampaignId: null }
      return merged
    },
    setActiveSection(state, action: PayloadAction<TemplateSectionKey>) {
      state.activeSection = action.payload
    },
    setSelectedCampaignId(state, action: PayloadAction<string | null>) {
      state.selectedCampaignId = action.payload
    },
    setTemplateKey(state, action: PayloadAction<'luxury-template' | 'affordable-template'>) {
      state.templateKey = action.payload
    },

    setCampaignName(state, action: PayloadAction<string>) {
      state.campaignName = action.payload
    },
    setProjectLocation(state, action: PayloadAction<string>) {
      state.projectLocation = action.payload
    },
    setReraNo(state, action: PayloadAction<string>) {
      state.reraNo = action.payload
    },

    setCoverImageUrl(state, action: PayloadAction<string>) {
      state.coverImageUrl = action.payload
    },

    setLogoUrl(state, action: PayloadAction<string>) {
      state.logoUrl = action.payload
    },

    setBannerImages(state, action: PayloadAction<BannerImage[]>) {
      state.bannerImages = action.payload
    },

    setOfferCreatives(state, action: PayloadAction<BannerImage[]>) {
      state.offerCreatives = action.payload
    },
    setUspImages(state, action: PayloadAction<BannerImage[]>) {
      state.uspImages = action.payload
    },

    setVideos(state, action: PayloadAction<{ intro: MediaFile; walkthrough: MediaFile; extra: MediaFile }>) {
      state.videos = action.payload
    },
    setReels(state, action: PayloadAction<{ reel1: MediaFile; reel2: MediaFile; reel3: MediaFile }>) {
      state.reels = action.payload
    },

    setContactEmail(state, action: PayloadAction<string>) {
      state.contactEmail = action.payload
    },
    setContactMobile(state, action: PayloadAction<string>) {
      state.contactMobile = action.payload
    },
    setStartingPrice(state, action: PayloadAction<string>) {
      state.startingPrice = action.payload
    },
    setCompletionDate(state, action: PayloadAction<string>) {
      state.completionDate = action.payload
    },
    setBhkRange(state, action: PayloadAction<string>) {
      state.bhkRange = action.payload
    },
    setPriceRange(state, action: PayloadAction<string>) {
      state.priceRange = action.payload
    },
    setTotalFloors(state, action: PayloadAction<string>) {
      state.totalFloors = action.payload
    },
    setSquareFeetRanges(state, action: PayloadAction<string>) {
      state.squareFeetRanges = action.payload
    },

    setOverviewFacts(state, action: PayloadAction<OverviewFactsState>) {
      state.overviewFacts = action.payload
    },

    setGalleryCells(state, action: PayloadAction<GalleryCell[]>) {
      state.galleryCells = action.payload
    },

    setFloorBlueprintImage(state, action: PayloadAction<string>) {
      state.floorBlueprintImage = action.payload
    },
    setFloorDefaultTab(state, action: PayloadAction<FloorTabKey>) {
      state.floorDefaultTab = action.payload
    },
    setFloorTabs(state, action: PayloadAction<{ id: FloorTabKey; label: string }[]>) {
      state.floorTabs = action.payload
      // Ensure default tab exists
      if (!state.floorTabs.some((t) => t.id === state.floorDefaultTab)) {
        state.floorDefaultTab = state.floorTabs[0]?.id ?? state.floorDefaultTab
      }
      // Ensure rows/images maps contain keys for tabs
      for (const t of state.floorTabs) {
        if (!state.floorRows[t.id]) state.floorRows[t.id] = [{ configuration: '', carpetArea: '', floorRange: '', price: '' }]
        if (!state.floorPlanImages[t.id]) state.floorPlanImages[t.id] = [{ src: '', alt: '' }]
      }
    },
    setFloorRows(state, action: PayloadAction<Record<string, FloorRow[]>>) {
      state.floorRows = action.payload
    },
    setFloorPlanImages(state, action: PayloadAction<Record<string, BannerImage[]>>) {
      state.floorPlanImages = action.payload
    },

    setAmenityItems(state, action: PayloadAction<{ name: string; icons: BannerImage[] }[]>) {
      state.amenityItems = action.payload
    },
    setHighlightItems(state, action: PayloadAction<{ title: string; description: string }[]>) {
      state.highlightItems = action.payload
    },

    setBenefitStats(state, action: PayloadAction<{ value: string; label: string }[]>) {
      state.benefitStats = action.payload
    },
    setBenefitBackgroundImages(state, action: PayloadAction<BannerImage[]>) {
      state.benefitBackgroundImages = action.payload
    },
    setBenefitItems(state, action: PayloadAction<{ heading: string; description: string }[]>) {
      state.benefitItems = action.payload
    },

    setSocialInfrastructureGroups(state, action: PayloadAction<{ title: string; items: { name: string; value: string }[] }[]>) {
      state.socialInfrastructureGroups = action.payload
    },

    // Helper: load some fields when selecting a campaign from list
    hydrateFromCampaignRow(
      state,
      action: PayloadAction<{
        id: string | number
        title: string
        address: string | null
        regNo: string | null
        logo?: string | null
        coverImage?: string | null
        templateKey?: 'luxury-template' | 'affordable-template'
      }>,
    ) {
      state.selectedCampaignId = String(action.payload.id)
      state.campaignName = action.payload.title
      state.projectLocation = action.payload.address ?? ''
      state.reraNo = action.payload.regNo ?? ''
      state.logoUrl = action.payload.logo ?? ''
      state.coverImageUrl = action.payload.coverImage ?? ''
      state.templateKey = action.payload.templateKey ?? state.templateKey
    },

    // Full hydrate from GET /api/campaigns/:id response (CampaignMaster + associations)
    hydrateFromCampaignFull(state, action: PayloadAction<any>) {
      const c = action.payload && typeof action.payload === 'object' ? action.payload : {}

      if (typeof c.id === 'string' || typeof c.id === 'number') {
        state.selectedCampaignId = String(c.id)
      }
      state.templateKey =
        c.templateKey === 'affordable-template' || c.templateKey === 'luxury-template' ? c.templateKey : state.templateKey

      state.campaignName = typeof c.title === 'string' ? c.title : state.campaignName
      state.projectLocation = typeof c.address === 'string' ? c.address : state.projectLocation
      state.reraNo = typeof c.regNo === 'string' ? c.regNo : state.reraNo
      state.logoUrl = typeof c.logo === 'string' ? c.logo : state.logoUrl
      state.coverImageUrl = typeof c.coverImage === 'string' ? c.coverImage : state.coverImageUrl

      // HERO banners
      const reserved = Array.isArray(c?.projectImages) ? c.projectImages : []
      const groupImages = (tag: string) => {
        const grp = reserved.find((r: any) => String(r?.tag ?? '') === tag)
        const imgs = Array.isArray(grp?.images) ? grp.images : []
        return imgs
          .map((x: any) => ({
            src: typeof x?.src === 'string' ? x.src : '',
            alt: typeof x?.alt === 'string' ? x.alt : '',
          }))
          .filter((x: any) => x.src.trim().length > 0)
      }

      const bannersFromProjectImages = groupImages('__banners')
      const offersFromProjectImages = groupImages('__festival_offers')
      const uspFromProjectImages = groupImages('__usp_images')

      if (bannersFromProjectImages.length) {
        state.bannerImages = bannersFromProjectImages
      } else {
        const heroBg = c?.hero?.data?.backgroundImages
        if (Array.isArray(heroBg)) {
          const imgs = heroBg
            .map((x: any) => ({
              src: typeof x?.src === 'string' ? x.src : '',
              alt: typeof x?.alt === 'string' ? x.alt : '',
            }))
            .filter((x: any) => x.src.trim().length > 0)
          state.bannerImages = imgs.length ? imgs : [{ src: '', alt: '' }]
        }
      }

      if (offersFromProjectImages.length) {
        state.offerCreatives = offersFromProjectImages
      } else if (Array.isArray(c?.documents)) {
        const docs = c.documents
        const offer = docs
          .filter((d: any) => String(d?.type ?? '') === 'offer_creative')
          .map((d: any) => ({ src: typeof d?.url === 'string' ? d.url : '', alt: '' }))
          .filter((x: any) => x.src.trim().length > 0)
        state.offerCreatives = offer.length ? offer : [{ src: '', alt: '' }]
      }

      if (uspFromProjectImages.length) {
        state.uspImages = uspFromProjectImages
      } else if (Array.isArray(c?.documents)) {
        const docs = c.documents
        const usp = docs
          .filter((d: any) => String(d?.type ?? '') === 'usp_image')
          .map((d: any) => ({ src: typeof d?.url === 'string' ? d.url : '', alt: '' }))
          .filter((x: any) => x.src.trim().length > 0)
        state.uspImages = usp.length ? usp : [{ src: '', alt: '' }]
      }

      // OVERVIEW facts -> builder fields
      const facts = Array.isArray(c?.overview?.facts) ? c.overview.facts : []
      const factValue = (key: string) => {
        const hit = facts.find((f: any) => String(f?.key ?? '').trim().toLowerCase() === key.trim().toLowerCase())
        return typeof hit?.value === 'string' ? hit.value : ''
      }
      state.contactEmail = typeof c.email === 'string' && c.email ? c.email : factValue('Email')
      state.contactMobile = typeof c.mobile === 'string' && c.mobile ? c.mobile : factValue('Mobile')
      state.startingPrice = factValue('Starting Price')
      state.completionDate = factValue('Completion Date (CBT)')
      state.bhkRange = factValue('BHK Range')
      state.priceRange = factValue('Price Range')
      state.totalFloors = factValue('Total Floors')
      state.squareFeetRanges = factValue('Square Feet Ranges')
      state.possessionDate = factValue('Possession') || state.possessionDate

      state.overviewFacts = {
        serialNumber: factValue('Serial Number'),
        codeName: factValue('Code Name'),
        location: factValue('Location (detail)'),
        landParcel: factValue('Land Parcel'),
        project: factValue('Project'),
        apartments: factValue('Apartments'),
        building: factValue('Building'),
        carpetAreas: factValue('Carpet Areas'),
      }

      // GALLERY
      if (Array.isArray(c?.projectImages)) {
        const cells: GalleryCell[] = c.projectImages
          .filter((g: any) => !String(g?.tag ?? '').startsWith('__'))
          .map((g: any) => ({
          tag: typeof g?.tag === 'string' ? g.tag.trim() : 'Gallery',
          part:
            typeof g?.tag === 'string' && (g.tag.trim() === 'Exterior' || g.tag.trim().startsWith('Amenities -'))
              ? 'external'
              : 'internal',
          feature: Boolean(g?.feature),
          wideBottom: Boolean(g?.wideBottom),
          images: Array.isArray(g?.images)
            ? g.images
                .map((img: any) => ({
                  src: typeof img?.src === 'string' ? img.src : '',
                  alt: typeof img?.alt === 'string' ? img.alt : '',
                }))
                .filter((img: any) => img.src.trim().length > 0)
            : [],
        }))
        state.galleryCells = cells.length ? cells : [{ tag: 'Kitchen', feature: true, wideBottom: false, images: [{ src: '', alt: '' }] }]
      }

      // FLOORPLANS
      const sf = c?.sizeFloor
      if (sf && typeof sf === 'object') {
        const defaultTabId = typeof sf.defaultTabId === 'string' ? sf.defaultTabId : 'bhk3'
        if (defaultTabId) state.floorDefaultTab = defaultTabId
        // Tabs: allow any ids
        if (Array.isArray(sf.tabs) && sf.tabs.length) {
          state.floorTabs = sf.tabs
            .map((t: any) => ({ id: String(t?.id ?? '').trim(), label: String(t?.label ?? '').trim() }))
            .filter((t: any) => t.id.length > 0)
        }
        const panels = sf.panels && typeof sf.panels === 'object' ? sf.panels : {}
        const readPanelRows = (key: string): FloorRow[] => {
          const p = (panels as any)[key]
          const rows = Array.isArray(p?.rows) ? p.rows : []
          const mapped = rows
            .map((r: any) => (Array.isArray(r) ? r : []))
            .map((r: any[]) => ({
              configuration: typeof r[0] === 'string' ? r[0] : '',
              carpetArea: typeof r[1] === 'string' ? r[1] : '',
              floorRange: typeof r[2] === 'string' ? r[2] : '',
              price: typeof r[3] === 'string' ? r[3] : '',
            }))
            .filter((r: any) => r.configuration || r.carpetArea || r.floorRange || r.price)
          return mapped.length ? mapped : [{ configuration: '', carpetArea: '', floorRange: '', price: '' }]
        }
        const nextRows: Record<string, FloorRow[]> = {}
        const tabIds = state.floorTabs.map((t) => t.id)
        for (const id of tabIds) nextRows[id] = readPanelRows(id)
        state.floorRows = nextRows

        const readPlanImages = (key: string): BannerImage[] => {
          const p = (panels as any)[key]
          const imgs = Array.isArray(p?.floorPlanImages) ? p.floorPlanImages : []
          const mapped = imgs
            .map((src: any) => (typeof src === 'string' ? src : ''))
            .filter((s: string) => s.trim().length > 0)
            .map((src: string) => ({ src, alt: '' }))
          return mapped.length ? mapped : [{ src: '', alt: '' }]
        }
        const nextImgs: Record<string, BannerImage[]> = {}
        for (const id of tabIds) nextImgs[id] = readPlanImages(id)
        state.floorPlanImages = nextImgs
      }

      // AMENITIES
      if (Array.isArray(c?.amenities)) {
        const items = c.amenities
          .map((a: any) => {
            const name = typeof a?.name === 'string' ? a.name : ''
            const rawIcon = a?.icon
            let iconUrls: string[] = []
            if (Array.isArray(rawIcon)) {
              iconUrls = rawIcon.map((x: any) => String(x ?? '')).filter((s: string) => s.trim().length > 0)
            } else if (typeof rawIcon === 'string') {
              const s = rawIcon.trim()
              if (s) {
                try {
                  const parsed = JSON.parse(s)
                  if (Array.isArray(parsed)) {
                    iconUrls = parsed.map((x: any) => String(x ?? '')).filter((t: string) => t.trim().length > 0)
                  } else if (typeof parsed === 'string') {
                    iconUrls = [parsed]
                  } else {
                    iconUrls = [s]
                  }
                } catch {
                  iconUrls = [s]
                }
              }
            }
            const icons = iconUrls.length ? iconUrls.map((u) => ({ src: u, alt: '' })) : [{ src: '', alt: '' }]
            return { name, icons }
          })
          .filter((a: any) => a.name.trim().length > 0)
        state.amenityItems = items.length ? items : [{ name: '', icons: [{ src: '', alt: '' }] }]
      }

      // HIGHLIGHTS
      if (Array.isArray(c?.highlights)) {
        const items = c.highlights
          .map((h: any) => ({
            title: typeof h?.title === 'string' ? h.title : '',
            description: typeof h?.text === 'string' ? h.text : '',
          }))
          .filter((h: any) => h.title.trim().length > 0 || h.description.trim().length > 0)
        state.highlightItems = items.length ? items : [{ title: '', description: '' }]
      }

      // BENEFITS
      const benefits = c?.benefits
      if (benefits && typeof benefits === 'object') {
        const stats = Array.isArray(benefits.stats) ? benefits.stats : []
        state.benefitStats =
          stats
            .map((s: any) => ({ value: typeof s?.value === 'string' ? s.value : '', label: typeof s?.label === 'string' ? s.label : '' }))
            .filter((s: any) => s.value.trim().length > 0 || s.label.trim().length > 0) || state.benefitStats

        const bg = Array.isArray(benefits.backgroundImages) ? benefits.backgroundImages : []
        const bgMapped = bg
          .map((b: any) => ({ src: typeof b?.src === 'string' ? b.src : '', alt: typeof b?.alt === 'string' ? b.alt : '' }))
          .filter((b: any) => b.src.trim().length > 0)
        state.benefitBackgroundImages = bgMapped.length ? bgMapped : [{ src: '', alt: '' }]

        const items = Array.isArray(benefits.items) ? benefits.items : []
        const mapped = items
          .map((b: any) => ({ heading: typeof b?.title === 'string' ? b.title : '', description: typeof b?.text === 'string' ? b.text : '' }))
          .filter((b: any) => b.heading.trim().length > 0 || b.description.trim().length > 0)
        state.benefitItems = mapped.length ? mapped : [{ heading: '', description: '' }]
      }

      // SOCIAL INFRA
      if (Array.isArray(c?.socialInfraGroups)) {
        const groups = c.socialInfraGroups.map((g: any) => ({
          title: typeof g?.title === 'string' ? g.title : 'Untitled',
          items: Array.isArray(g?.items)
            ? g.items
                .map((it: any) => ({ name: typeof it?.name === 'string' ? it.name : '', value: typeof it?.value === 'string' ? it.value : '' }))
                .filter((it: any) => it.name.trim().length > 0 || it.value.trim().length > 0)
            : [],
        }))
        state.socialInfrastructureGroups = groups.length ? groups : state.socialInfrastructureGroups
      }

      // MEDIA
      if (Array.isArray(c?.media)) {
        const byKind = new Map<string, string>()
        for (const m of c.media) {
          const kind = typeof m?.kind === 'string' ? m.kind : ''
          const url = typeof m?.url === 'string' ? m.url : ''
          if (kind && url) byKind.set(kind, url)
        }
        state.videos = {
          intro: { url: byKind.get('video_intro') ?? '' },
          walkthrough: { url: byKind.get('video_walkthrough') ?? '' },
          extra: { url: byKind.get('video_extra') ?? '' },
        }
        state.reels = {
          reel1: { url: byKind.get('reel_1') ?? '' },
          reel2: { url: byKind.get('reel_2') ?? '' },
          reel3: { url: byKind.get('reel_3') ?? '' },
        }
      }
    },
  },
})

export const campaignBuilderActions = slice.actions
export const campaignBuilderReducer = slice.reducer

