import type {
  BulkCaptureLeadRow,
  CaptureLeadCreatePayload,
  CaptureLeadPatchPayload,
  SiteVisitCreatePayload,
} from '../types/dtos'

type TemplateKey = 'luxury-template' | 'affordable-template'

/** Raw form / page state for “Add New Lead” → {@link CaptureLeadCreatePayload}. */
export type CaptureLeadCreateInput = {
  selectedSource: string | null
  firstCallDate: string
  callBy: string
  fullName: string
  num: string
  whatsapp: string
  email: string
  bhk: string
  budget: string
  resiLocation: string
  ownership: NonNullable<CaptureLeadCreatePayload['propertyOwnership']>
  workLocation: string
  workProfile: NonNullable<CaptureLeadCreatePayload['workProfile']>
  industry: string
  preferredResolved: string
  possessionBy: string
  leadStatus: NonNullable<CaptureLeadCreatePayload['status']>
  buyingStage: NonNullable<CaptureLeadCreatePayload['propertyBuyingStage']>
  callbackDate: string
  callbackTime: string
}

export function buildCaptureLeadCreatePayload(input: CaptureLeadCreateInput): CaptureLeadCreatePayload {
  const {
    selectedSource,
    firstCallDate,
    callBy,
    fullName,
    num,
    whatsapp,
    email,
    bhk,
    budget,
    resiLocation,
    ownership,
    workLocation,
    workProfile,
    industry,
    preferredResolved,
    possessionBy,
    leadStatus,
    buyingStage,
    callbackDate,
    callbackTime,
  } = input

  return {
    source: selectedSource,
    firstCallDate: firstCallDate || null,
    callBy: callBy || null,
    name: fullName,
    number: num,
    whatsappNumber: whatsapp || null,
    email: email || null,
    bhk: bhk || null,
    budget: budget || null,
    resiLocation: resiLocation || null,
    propertyOwnership: ownership,
    workLocation: workLocation || null,
    workProfile,
    industryType: industry || null,
    preferredLocation: preferredResolved ? [preferredResolved] : [],
    possessionDate: possessionBy || null,
    status: leadStatus,
    propertyBuyingStage: buyingStage,
    callbackDate: callbackDate || null,
    callbackTime: callbackTime.trim() || null,
  }
}

export function buildBulkCaptureLeadsPayload(
  source: string,
  rows: { name: string; phone: string; email: string }[],
): { source: string; leads: BulkCaptureLeadRow[] } {
  return {
    source,
    leads: rows.map((r) => ({
      name: r.name,
      number: r.phone,
      email: r.email,
    })),
  }
}

export function buildSiteVisitCreatePayload(input: SiteVisitCreatePayload): SiteVisitCreatePayload {
  return {
    ...input,
    notes: (input.notes ?? '').trim(),
  }
}

/** Inline edits on the leads list card (matches previous patch merge order). */
export function buildCaptureLeadLeadListCardPatch(input: {
  base: { score: string; status: string; assignedTo: string }
  lead: { score: string; status: string; assignedTo: string }
}): CaptureLeadPatchPayload {
  const { base, lead } = input
  const patch: CaptureLeadPatchPayload = {}
  if (base.score !== lead.score) patch.status = lead.score.toUpperCase()
  if (base.status !== lead.status) patch.status = lead.status
  if (base.assignedTo !== lead.assignedTo) patch.callBy = lead.assignedTo
  return patch
}

export function buildCampaignPayload({
  builder,
  builderForSave,
  mediaForSave,
  templateKey,
}: {
  builder: any
  builderForSave: any
  mediaForSave: any
  templateKey: TemplateKey
}) {
  return {
    master: {
      title: builderForSave.campaignName,
      address: builderForSave.projectLocation,
      reg_no: builderForSave.reraNo,
      logo: builderForSave.logoUrl,
      coverImage: builderForSave.coverImageUrl,
      templateKey,
    },
    hero: {
      backgroundImages: builderForSave.bannerImages.filter((b: any) => String(b?.src ?? '').trim().length > 0),
      eyebrow: '',
      titleLine1: '',
      titleLine2Italic: '',
      snapshotSummary: '',
      locationLine: '',
      metaCells: [],
      primaryCta: { label: 'Book Site Visit', targetSectionId: 'enquiry' },
      secondaryCta: { label: 'View Floor Plans', targetSectionId: 'residences' },
      badge: builderForSave.possessionDate,
    },
    overview: {
      sectionLabel: 'Project Overview',
      title: { before: 'Everything You Need to ', italic: 'Know', after: '' },
      facts: [
        { key: 'Project Name', value: builderForSave.campaignName },
        { key: 'Email', value: builderForSave.contactEmail },
        { key: 'Mobile', value: builderForSave.contactMobile },
        { key: 'Starting Price', value: builderForSave.startingPrice },
        { key: 'Completion Date (CBT)', value: builderForSave.completionDate },
        { key: 'RERA Registration Number', value: builderForSave.reraNo },
        { key: 'BHK Range', value: builderForSave.bhkRange },
        { key: 'Price Range', value: builderForSave.priceRange },
        { key: 'Location', value: builderForSave.projectLocation },
        { key: 'Total Floors', value: builderForSave.totalFloors },
        { key: 'Square Feet Ranges', value: builderForSave.squareFeetRanges },
        { key: 'Possession', value: builderForSave.possessionDate },
        { key: 'Serial Number', value: builderForSave.overviewFacts.serialNumber },
        { key: 'Code Name', value: builderForSave.overviewFacts.codeName },
        { key: 'Location (detail)', value: builderForSave.overviewFacts.location },
        { key: 'Land Parcel', value: builderForSave.overviewFacts.landParcel },
        { key: 'Project', value: builderForSave.overviewFacts.project },
        { key: 'Apartments', value: builderForSave.overviewFacts.apartments },
        { key: 'Building', value: builderForSave.overviewFacts.building },
        { key: 'Carpet Areas', value: builderForSave.overviewFacts.carpetAreas },
      ].filter((f) => f.value.trim().length > 0),
      certificationsTitle: 'Project Certifications & Registration',
      certifications: [{ label: 'MahaRERA No.', value: builderForSave.reraNo }].filter((c) => c.value.trim().length > 0),
    },
    gallery: {
      sectionLabel: 'Project Images',
      title: { before: 'A Glimpse of ', italic: builderForSave.campaignName || 'Project', after: '' },
      cells: builderForSave.galleryCells.map((c: any) => ({
        tag: c.tag,
        feature: c.feature,
        wideBottom: c.wideBottom,
        images: c.images.filter((img: any) => String(img?.src ?? '').trim().length > 0),
      })),
    },
    floorplans: {
      sectionLabel: 'Size & Floor Plans',
      title: { before: 'Choose Your ', italic: 'Residence', after: '' },
      blueprintImage: builderForSave.floorBlueprintImage,
      defaultTabId: builderForSave.floorDefaultTab,
      tabs: builderForSave.floorTabs,
      panels: Object.fromEntries(
        builderForSave.floorTabs.map((t: any) => [
          t.id,
          {
            columns: ['Configuration', 'Carpet Area', 'Floor Range', 'Price'],
            rows: (builderForSave.floorRows[t.id] ?? []).map((r: any) => [r.configuration, r.carpetArea, r.floorRange, r.price]),
            floorPlanImages: (builderForSave.floorPlanImages[t.id] ?? []).map((i: any) => i.src).filter((s: any) => String(s).trim().length > 0),
            priceLabel: 'Starting Price',
            price: '',
            priceNote: '',
            planTag: t.label || t.id,
            planInnerModifier: '',
          },
        ]),
      ),
    },
    amenities: {
      sectionLabel: 'Amenities',
      title: { before: '', italic: 'Amenities', after: '' },
      items: builderForSave.amenityItems
        .map((a: any) => {
          const iconUrls = Array.isArray(a?.icons)
            ? a.icons.map((ic: any) => String(ic?.src ?? '')).filter((s: string) => s.trim().length > 0)
            : []
          return { name: a.name, icon: iconUrls.length ? JSON.stringify(iconUrls) : null }
        })
        .filter((a: any) => a.name.trim().length > 0),
    },
    benefits: {
      sectionLabel: 'Benefits',
      title: { before: 'Why Invest in ', italic: builderForSave.campaignName || 'Project', after: '' },
      backgroundImages: builderForSave.benefitBackgroundImages.filter((b: any) => String(b?.src ?? '').trim().length > 0),
      items: builderForSave.benefitItems
        .filter((b: any) => b.heading.trim().length > 0 || b.description.trim().length > 0)
        .map((b: any, idx: number) => ({
          num: String(idx + 1).padStart(2, '0'),
          title: b.heading.trim().length > 0 ? b.heading : `Benefit ${idx + 1}`,
          text: b.description,
        })),
      stats: builderForSave.benefitStats.filter((s: any) => s.value.trim().length > 0 || s.label.trim().length > 0),
    },
    highlights: {
      items: builder.highlightItems
        .filter((h: any) => h.title.trim().length > 0)
        .map((h: any, idx: number) => ({
          num: String(idx + 1).padStart(2, '0'),
          title: h.title,
          text: h.description,
        })),
    },
    documents: {
      items: [
        ...builderForSave.offerCreatives
          .filter((img: any) => String(img?.src ?? '').trim().length > 0)
          .map((img: any) => ({ url: String(img.src), type: 'offer_creative', alt: String(img?.alt ?? '') })),
        ...builderForSave.uspImages
          .filter((img: any) => String(img?.src ?? '').trim().length > 0)
          .map((img: any) => ({ url: String(img.src), type: 'usp_image', alt: String(img?.alt ?? '') })),
      ],
    },
    socialInfrastructure: {
      groups: builder.socialInfrastructureGroups
        .map((g: any) => ({
          title: g.title.trim().length > 0 ? g.title : 'Untitled',
          items: g.items
            .filter((it: any) => it.name.trim().length > 0)
            .map((it: any) => ({ name: it.name.trim(), value: it.value })),
        }))
        .filter((g: any) => g.items.length > 0 || g.title !== 'Untitled'),
    },
    media: {
      items: [
        { url: mediaForSave.videos.intro.url, kind: 'video_intro', sortOrder: 0 },
        { url: mediaForSave.videos.walkthrough.url, kind: 'video_walkthrough', sortOrder: 1 },
        { url: mediaForSave.videos.extra.url, kind: 'video_extra', sortOrder: 2 },
        { url: mediaForSave.reels.reel1.url, kind: 'reel_1', sortOrder: 10 },
        { url: mediaForSave.reels.reel2.url, kind: 'reel_2', sortOrder: 11 },
        { url: mediaForSave.reels.reel3.url, kind: 'reel_3', sortOrder: 12 },
      ].filter((it) => it.url.trim().length > 0),
    },
  }
}

export const crmPayloadBuilder = {
  campaign: {
    buildFullPayload: buildCampaignPayload,
  },
  captureLead: {
    buildCreatePayload: buildCaptureLeadCreatePayload,
    buildLeadListCardPatch: buildCaptureLeadLeadListCardPatch,
  },
  captureLeadsBulk: {
    buildPayload: buildBulkCaptureLeadsPayload,
  },
  siteVisit: {
    buildCreatePayload: buildSiteVisitCreatePayload,
  },
} as const

