import { useEffect, useMemo, useState } from 'react'

import { apiGet, apiSend, apiUploadImage } from '../lib/crmApi'
import { campaignBuilderActions } from '../store/campaignBuilderSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { CampaignListTable } from './campaign/CampaignListTable'
import { CampaignSectionHeader } from './campaign/CampaignSectionHeader'
import { CampaignSidebar } from './campaign/CampaignSidebar'
import { TEMPLATE_SECTIONS } from './campaign/constants'
import {
  AmenitiesSection,
  BenefitsSection,
  FloorplansSection,
  GallerySection,
  HeroSection,
  HighlightsSection,
  MediaSection,
  OverviewSection,
  SocialInfrastructureSection,
} from './campaign/sections'
import type {
  CampaignListResponse,
  ExistingCampaign,
} from './campaign/types'

function resolveSetState<T>(current: T, next: T | ((prev: T) => T)) {
  return typeof next === 'function' ? (next as (p: T) => T)(current) : next
}

function nonEmpty(s: unknown) {
  return typeof s === 'string' && s.trim().length > 0
}

type RequiredIssue = { section: (typeof TEMPLATE_SECTIONS)[number]['key']; message: string }

function validateRequired(builder: any): RequiredIssue[] {
  const issues: RequiredIssue[] = []

  // Banner (hero) required: at least 1 banner image
  const bannerCount = Array.isArray(builder?.bannerImages)
    ? builder.bannerImages.filter((b: any) => nonEmpty(b?.src)).length
    : 0
  if (bannerCount < 1) issues.push({ section: 'hero', message: 'Banner: add at least 1 banner image.' })

  // Overview required fields
  if (!nonEmpty(builder?.campaignName)) issues.push({ section: 'overview', message: 'Overview: Project name is required.' })
  if (!nonEmpty(builder?.coverImageUrl)) issues.push({ section: 'overview', message: 'Overview: Cover image is required.' })
  if (!nonEmpty(builder?.projectLocation)) issues.push({ section: 'overview', message: 'Overview: Location is required.' })
  if (!nonEmpty(builder?.startingPrice)) issues.push({ section: 'overview', message: 'Overview: Starting price is required.' })
  if (!nonEmpty(builder?.reraNo)) issues.push({ section: 'overview', message: 'Overview: RERA No. is required.' })
  if (!nonEmpty(builder?.totalFloors)) issues.push({ section: 'overview', message: 'Overview: Total floors is required.' })

  // Gallery required: at least 1 image across all cells
  const galleryHasAny = Array.isArray(builder?.galleryCells)
    ? builder.galleryCells.some((c: any) => Array.isArray(c?.images) && c.images.some((img: any) => nonEmpty(img?.src)))
    : false
  if (!galleryHasAny) issues.push({ section: 'gallery', message: 'Gallery: add at least 1 image.' })

  // Floor plans required: at least 1 row with some real value OR at least 1 floor plan image
  const floorTabs = Array.isArray(builder?.floorTabs) ? builder.floorTabs : []
  const hasFloorRow = floorTabs.some((t: any) => {
    const rows = builder?.floorRows?.[t?.id] ?? []
    return Array.isArray(rows)
      ? rows.some((r: any) => nonEmpty(r?.configuration) || nonEmpty(r?.carpetArea) || nonEmpty(r?.floorRange) || nonEmpty(r?.price))
      : false
  })
  const hasFloorImg = floorTabs.some((t: any) => {
    const imgs = builder?.floorPlanImages?.[t?.id] ?? []
    return Array.isArray(imgs) ? imgs.some((i: any) => nonEmpty(i?.src)) : false
  })
  if (!hasFloorRow && !hasFloorImg) {
    issues.push({ section: 'floorplans', message: 'Floor Plans: add at least 1 plan row or 1 floor plan image.' })
  }

  // Benefits required: at least 1 item with heading/description
  const benefitsHasAny = Array.isArray(builder?.benefitItems)
    ? builder.benefitItems.some((b: any) => nonEmpty(b?.heading) || nonEmpty(b?.description))
    : false
  if (!benefitsHasAny) issues.push({ section: 'benefits', message: 'Benefits: add at least 1 benefit item.' })

  return issues
}

function stripFilesForDraft<T>(v: T): T {
  const walk = (x: any): any => {
    if (Array.isArray(x)) return x.map(walk)
    if (!x || typeof x !== 'object') return x
    // Remove File objects and blob preview URLs (not restorable).
    if (x instanceof File) return undefined
    const out: any = {}
    for (const k of Object.keys(x)) {
      if (k === 'file') continue
      const val = (x as any)[k]
      if (k === 'src' && typeof val === 'string' && val.startsWith('blob:')) {
        out[k] = ''
      } else {
        out[k] = walk(val)
      }
    }
    return out
  }
  return walk(v)
}

async function materializeImagesForSave(builder: any) {
  const clone = structuredClone(stripFilesForDraft(builder))

  const uploadIfNeeded = async (img: any): Promise<{ src: string; alt: string }> => {
    const file: File | undefined = img?.file
    if (file) {
      const url = await apiUploadImage(file)
      return { src: url, alt: String(img?.alt ?? '') }
    }
    return { src: String(img?.src ?? ''), alt: String(img?.alt ?? '') }
  }

  // banners
  if (Array.isArray(builder?.bannerImages)) {
    clone.bannerImages = await Promise.all(builder.bannerImages.map(uploadIfNeeded))
  }

  // benefits background images
  if (Array.isArray(builder?.benefitBackgroundImages)) {
    clone.benefitBackgroundImages = await Promise.all(builder.benefitBackgroundImages.map(uploadIfNeeded))
  }

  // gallery
  if (Array.isArray(builder?.galleryCells)) {
    clone.galleryCells = await Promise.all(
      builder.galleryCells.map(async (cell: any) => ({
        ...cell,
        images: Array.isArray(cell?.images) ? await Promise.all(cell.images.map(uploadIfNeeded)) : [],
      })),
    )
  }

  // floor plan images
  if (builder?.floorPlanImages && typeof builder.floorPlanImages === 'object') {
    const next: Record<string, any[]> = {}
    for (const k of Object.keys(builder.floorPlanImages)) {
      const arr = builder.floorPlanImages[k]
      next[k] = Array.isArray(arr) ? await Promise.all(arr.map(uploadIfNeeded)) : []
    }
    clone.floorPlanImages = next
  }

  return clone
}

const LS_DRAFT = 'crm_campaign_draft_v1'

function readDraft(): any | null {
  try {
    const raw = window.localStorage.getItem(LS_DRAFT)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeDraft(value: unknown) {
  window.localStorage.setItem(LS_DRAFT, JSON.stringify(value))
}

function clearDraft() {
  try {
    window.localStorage.removeItem(LS_DRAFT)
  } catch {
    // ignore
  }
}

export function Campaign() {
  const dispatch = useAppDispatch()
  const builder = useAppSelector((s) => s.campaignBuilder)

  const sectionMeta = useMemo(
    () => TEMPLATE_SECTIONS.find((s) => s.key === builder.activeSection)!,
    [builder.activeSection],
  )

  const [campaigns, setCampaigns] = useState<ExistingCampaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [loadingSelectedCampaign, setLoadingSelectedCampaign] = useState(false)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'luxury-template' | 'affordable-template'>('luxury-template')
  const [saveState, setSaveState] = useState<
    { type: 'idle' } | { type: 'saving' } | { type: 'error'; message: string } | { type: 'saved' }
  >({ type: 'idle' })
  const [flash, setFlash] = useState<null | { message: string }>(null)

  const showFlash = (message: string) => {
    setFlash({ message })
    window.setTimeout(() => setFlash(null), 1400)
  }

  useEffect(() => {
    apiGet<CampaignListResponse>('/api/campaigns')
      .then((d) => setCampaigns(d.items))
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCampaigns(false))
  }, [])

  // Restore draft if user was mid-creation and refreshed.
  useEffect(() => {
    if (builder.selectedCampaignId) return
    const d = readDraft()
    if (!d) return
    dispatch(campaignBuilderActions.hydrateFromDraft(d))
    showFlash('Draft restored.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const goToPrevSection = () => {
    const idx = TEMPLATE_SECTIONS.findIndex((s) => s.key === builder.activeSection)
    const prev = TEMPLATE_SECTIONS[Math.max(0, idx - 1)]
    dispatch(campaignBuilderActions.setActiveSection(prev.key))
  }

  const goToNextSection = () => {
    const issues = validateRequired(builder)
    const currentIssue = issues.find((i) => i.section === builder.activeSection)
    if (currentIssue) {
      window.alert(`Please fill the required fields before continuing.\n\n- ${currentIssue.message}`)
      return
    }
    const idx = TEMPLATE_SECTIONS.findIndex((s) => s.key === builder.activeSection)
    const next = TEMPLATE_SECTIONS[Math.min(TEMPLATE_SECTIONS.length - 1, idx + 1)]
    dispatch(campaignBuilderActions.setActiveSection(next.key))
  }

  const saveDraftNow = () => {
    if (builder.selectedCampaignId) return
    writeDraft(stripFilesForDraft(builder))
    showFlash('Draft saved.')
  }

  const doSave = async (templateKey: 'luxury-template' | 'affordable-template') => {
    if (saveState.type === 'saving') return
    const issues = validateRequired(builder)
    if (issues.length) {
      const first = issues[0]
      dispatch(campaignBuilderActions.setActiveSection(first.section))
      window.alert(
        `Please fill the required sections before saving the campaign.\n\nMissing:\n${issues
          .map((i) => `- ${i.message}`)
          .join('\n')}`,
      )
      setSaveState({ type: 'idle' })
      return
    }
    setSaveState({ type: 'saving' })
    try {
      // If user selected local files in tiles, upload them now and replace `src` with absolute URLs.
      const builderForSave = await materializeImagesForSave(builder)
      const updating = Boolean(builder.selectedCampaignId)
      const prevSelectedId = builder.selectedCampaignId ? String(builder.selectedCampaignId) : null
      // if (selectedCampaignId) {
      //   const updated = await apiSend<ExistingCampaign>(`/api/campaigns/${selectedCampaignId}`, 'PATCH', {
      //     title: campaignName,
      //     address: projectLocation,
      //     reg_no: reraNo,
      //   })
      //   campaignId = updated.id
      // } else {
        
        const payload = {
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
            items: builderForSave.amenityItems.map((a: any) => ({ name: a.name })).filter((a: any) => a.name.trim().length > 0),
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
              .filter((h) => h.title.trim().length > 0)
              .map((h, idx) => ({
                num: String(idx + 1).padStart(2, '0'),
                title: h.title,
                text: h.description,
              })),
          },
          socialInfrastructure: {
            groups: builder.socialInfrastructureGroups
              .map((g) => ({
                title: g.title.trim().length > 0 ? g.title : 'Untitled',
                items: g.items
                  .filter((it) => it.name.trim().length > 0)
                  .map((it) => ({ name: it.name.trim(), value: it.value })),
              }))
              .filter((g) => g.items.length > 0 || g.title !== 'Untitled'),
          },
          media: {
            items: [
              { url: builder.videos.intro, kind: 'video_intro', sortOrder: 0 },
              { url: builder.videos.walkthrough, kind: 'video_walkthrough', sortOrder: 1 },
              { url: builder.videos.extra, kind: 'video_extra', sortOrder: 2 },
              { url: builder.reels.reel1, kind: 'reel_1', sortOrder: 10 },
              { url: builder.reels.reel2, kind: 'reel_2', sortOrder: 11 },
              { url: builder.reels.reel3, kind: 'reel_3', sortOrder: 12 },
            ].filter((it) => it.url.trim().length > 0),
          },
        }

        const saved = updating
          ? await apiSend<ExistingCampaign>(`/api/campaigns/${builder.selectedCampaignId}/full`, 'PUT', payload)
          : await apiSend<ExistingCampaign>('/api/campaigns/full', 'POST', payload)

        const savedId = String((saved as unknown as { id: unknown }).id)

        if (updating) {
          // Keep editing the same campaign after save.
          dispatch(campaignBuilderActions.setSelectedCampaignId(savedId))
        } else {
          // After creating, go back to "new campaign" mode.
          clearDraft()
          dispatch(campaignBuilderActions.resetBuilder())
          dispatch(campaignBuilderActions.setTemplateKey(templateKey))
        }

        setCampaigns((prev) => {
          if (updating && prevSelectedId) {
            const replaced = prev.map((c) => (String((c as any).id) === prevSelectedId ? (saved as any) : c))
            // If it wasn't in the list (edge case), still add it.
            return replaced.some((c) => String((c as any).id) === prevSelectedId) ? replaced : [saved as any, ...replaced]
          }
          // New create: prepend.
          return [saved as any, ...prev]
        })
      
      showFlash(updating ? 'Your dashboard is updated successfully.' : 'Campaign created successfully.')

      // if (!selectedCampaignId) {
      //   // Full create already saved everything.
      //   setSaveState({ type: 'saved' })
      //   window.setTimeout(() => setSaveState({ type: 'idle' }), 1200)
      //   return
      // }

      // await apiSend(`/api/campaigns/${campaignId}/hero`, 'PUT', {
      //   backgroundImages: bannerImages.filter((b) => b.src.trim().length > 0),
      //   eyebrow: '',
      //   titleLine1: '',
      //   titleLine2Italic: '',
      //   snapshotSummary: '',
      //   locationLine: '',
      //   metaCells: [],
      //   primaryCta: { label: 'Book Site Visit', targetSectionId: 'enquiry' },
      //   secondaryCta: { label: 'View Floor Plans', targetSectionId: 'residences' },
      //   badge: possessionDate,
      // })

      // await apiSend(`/api/campaigns/${campaignId}/overview`, 'PUT', {
      //   sectionLabel: 'Project Overview',
      //   title: { before: 'Everything You Need to ', italic: 'Know', after: '' },
      //   facts: [
      //     { key: 'Project Name', value: campaignName },
      //     { key: 'Email', value: contactEmail },
      //     { key: 'Mobile', value: contactMobile },
      //     { key: 'Starting Price', value: startingPrice },
      //     { key: 'Completion Date (CBT)', value: completionDate },
      //     { key: 'RERA Registration Number', value: reraNo },
      //     { key: 'BHK Range', value: bhkRange },
      //     { key: 'Price Range', value: priceRange },
      //     { key: 'Location', value: projectLocation },
      //     { key: 'Total Floors', value: totalFloors },
      //     { key: 'Square Feet Ranges', value: squareFeetRanges },
      //     { key: 'Possession', value: possessionDate },
      //     { key: 'Serial Number', value: overviewFacts.serialNumber },
      //     { key: 'Code Name', value: overviewFacts.codeName },
      //     { key: 'Location (detail)', value: overviewFacts.location },
      //     { key: 'Land Parcel', value: overviewFacts.landParcel },
      //     { key: 'Project', value: overviewFacts.project },
      //     { key: 'Apartments', value: overviewFacts.apartments },
      //     { key: 'Building', value: overviewFacts.building },
      //     { key: 'Carpet Areas', value: overviewFacts.carpetAreas },
      //   ].filter((f) => f.value.trim().length > 0),
      //   certificationsTitle: 'Project Certifications & Registration',
      //   certifications: [{ label: 'MahaRERA No.', value: reraNo }].filter((c) => c.value.trim().length > 0),
      // })

      // await apiSend(`/api/campaigns/${campaignId}/gallery`, 'PUT', {
      //   sectionLabel: 'Project Images',
      //   title: { before: 'A Glimpse of ', italic: campaignName || 'Project', after: '' },
      //   cells: galleryCells.map((c) => ({
      //     tag: c.tag,
      //     feature: c.feature,
      //     wideBottom: c.wideBottom,
      //     images: c.images.filter((img) => img.src.trim().length > 0),
      //   })),
      // })

      // await apiSend(`/api/campaigns/${campaignId}/floorplans`, 'PUT', {
      //   sectionLabel: 'Size & Floor Plans',
      //   title: { before: 'Choose Your ', italic: 'Residence', after: '' },
      //   blueprintImage: floorBlueprintImage,
      //   defaultTabId: floorDefaultTab,
      //   tabs: [
      //     { id: 'bhk3', label: '3 BHK' },
      //     { id: 'bhk4', label: '4 BHK' },
      //     { id: 'bhk5', label: '5 BHK' },
      //   ],
      //   panels: {
      //     bhk3: {
      //       columns: ['Configuration', 'Carpet Area', 'Floor Range', 'Price'],
      //       rows: floorRows.bhk3.map((r) => [r.configuration, r.carpetArea, r.floorRange, r.price]),
      //       floorPlanImages: floorPlanImages.bhk3.map((i) => i.src).filter((s) => s.trim().length > 0),
      //       priceLabel: 'Starting Price',
      //       price: '',
      //       priceNote: '',
      //       planTag: '3 BHK',
      //       planInnerModifier: '',
      //     },
      //     bhk4: {
      //       columns: ['Configuration', 'Carpet Area', 'Floor Range', 'Price'],
      //       rows: floorRows.bhk4.map((r) => [r.configuration, r.carpetArea, r.floorRange, r.price]),
      //       floorPlanImages: floorPlanImages.bhk4.map((i) => i.src).filter((s) => s.trim().length > 0),
      //       priceLabel: 'Starting Price',
      //       price: '',
      //       priceNote: '',
      //       planTag: '4 BHK',
      //       planInnerModifier: '',
      //     },
      //     bhk5: {
      //       columns: ['Configuration', 'Carpet Area', 'Floor Range', 'Price'],
      //       rows: floorRows.bhk5.map((r) => [r.configuration, r.carpetArea, r.floorRange, r.price]),
      //       floorPlanImages: floorPlanImages.bhk5.map((i) => i.src).filter((s) => s.trim().length > 0),
      //       priceLabel: 'Starting Price',
      //       price: '',
      //       priceNote: '',
      //       planTag: '5 BHK',
      //       planInnerModifier: '',
      //       },
      //   },
      // })

      // await apiSend(`/api/campaigns/${campaignId}/amenities`, 'PUT', {
      //   sectionLabel: 'Amenities',
      //   title: { before: '', italic: 'Amenities', after: '' },
      //   items: amenityItems.map((a) => ({ name: a.name })).filter((a) => a.name.trim().length > 0),
      // })

      // await apiSend(`/api/campaigns/${campaignId}/benefits`, 'PUT', {
      //   sectionLabel: 'Benefits',
      //   title: { before: 'Why Invest in ', italic: campaignName || 'Project', after: '' },
      //   backgroundImages: benefitBackgroundImages.filter((b) => b.src.trim().length > 0),
      //   items: benefitItems
      //     .filter((b) => b.heading.trim().length > 0 || b.description.trim().length > 0)
      //     .map((b, idx) => ({
      //       num: String(idx + 1).padStart(2, '0'),
      //       title: b.heading.trim().length > 0 ? b.heading : `Benefit ${idx + 1}`,
      //       text: b.description,
      //     })),
      //   stats: benefitStats.filter((s) => s.value.trim().length > 0 || s.label.trim().length > 0),
      // })

      // await apiSend(`/api/campaigns/${campaignId}/highlights`, 'PUT', {
      //   items: highlightItems
      //     .filter((h) => h.title.trim().length > 0)
      //     .map((h, idx) => ({
      //       num: String(idx + 1).padStart(2, '0'),
      //       title: h.title,
      //       text: '',
      //     })),
      // })

      // await apiSend(`/api/campaigns/${campaignId}/social-infrastructure`, 'PUT', {
      //   groups: socialInfrastructureGroups
      //     .map((g) => ({
      //       title: g.title.trim().length > 0 ? g.title : 'Untitled',
      //       items: g.items
      //         .filter((it) => it.name.trim().length > 0)
      //         .map((it) => ({ name: it.name.trim(), value: it.value })),
      //     }))
      //     .filter((g) => g.items.length > 0 || g.title !== 'Untitled'),
      // })

      setSaveState({ type: 'saved' })
      window.setTimeout(() => setSaveState({ type: 'idle' }), 1200)
    } catch (e: unknown) {
      setSaveState({
        type: 'error',
        message: e && typeof e === 'object' && 'message' in e ? String((e as { message?: string }).message) : 'Save failed',
      })
    }
  }

  const onSaveClick = () => {
    if (saveState.type === 'saving') return

    // If user is editing an existing campaign, we already have its templateKey in DB.
    // Don't force the user to pick again.
    if (builder.selectedCampaignId) {
      void doSave(builder.templateKey)
      return
    }

    setSelectedTemplateKey(builder.templateKey)
    setTemplateModalOpen(true)
  }

  return (
    <section className="mx-auto box-border w-full max-w-[1280px] py-2 pb-6">
      {flash ? (
        <div className="fixed right-4 top-4 z-9999 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-semibold text-emerald-900 shadow-[0_12px_28px_rgba(16,185,129,0.18)]">
          {flash.message}
        </div>
      ) : null}
      <header className="flex flex-col gap-3 py-2 pb-4 min-[760px]:flex-row min-[760px]:items-start min-[760px]:justify-between">
        <div>
          <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em] text-gray-900">Campaigns</h2>
          <p className="mt-1 text-[14px] font-medium text-gray-500">
            Luxury template builder — sections split into components.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#80654a] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940]"
            onClick={onSaveClick}
          >
            {saveState.type === 'saving' ? 'Saving…' : saveState.type === 'saved' ? 'Saved' : 'Save campaign'}
          </button>
        </div>
      </header>

      {builder.selectedCampaignId ? (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-[13px] font-semibold text-violet-900">
          You are editing: <span className="font-bold">{builder.campaignName || 'Untitled campaign'}</span>
          <span className="ml-2 text-[12px] font-medium text-violet-700">({builder.selectedCampaignId})</span>
          {loadingSelectedCampaign ? <span className="ml-2 text-[12px] font-medium text-violet-700">Loading full data…</span> : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-900">
          You are creating a new campaign.
        </div>
      )}

      {templateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setTemplateModalOpen(false)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-[520px] rounded-3xl border border-gray-900/10 bg-white p-5 shadow-[0_20px_60px_rgba(17,24,39,0.18)]">
            <div className="text-[16px] font-bold tracking-[-0.02em] text-gray-900">Choose template</div>
            <div className="mt-1 text-[13px] font-medium text-gray-500">
              Select which microsite template to use for this campaign.
            </div>

            <div className="mt-5 grid gap-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="campaign-template"
                  className="mt-1"
                  checked={selectedTemplateKey === 'luxury-template'}
                  onChange={() => setSelectedTemplateKey('luxury-template')}
                />
                <div>
                  <div className="text-[13px] font-semibold text-gray-900">Luxury template</div>
                  <div className="text-[12px] font-medium text-gray-500">Best for premium projects.</div>
                </div>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 p-3 hover:bg-gray-50">
                <input
                  type="radio"
                  name="campaign-template"
                  className="mt-1"
                  checked={selectedTemplateKey === 'affordable-template'}
                  onChange={() => setSelectedTemplateKey('affordable-template')}
                />
                <div>
                  <div className="text-[13px] font-semibold text-gray-900">Affordable template</div>
                  <div className="text-[12px] font-medium text-gray-500">Best for budget/affordable projects.</div>
                </div>
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 min-[520px]:flex-row min-[520px]:justify-end">
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 text-[13px] font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => setTemplateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-[#80654a] px-4 text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940]"
                onClick={async () => {
                  setTemplateModalOpen(false)
                  dispatch(campaignBuilderActions.setTemplateKey(selectedTemplateKey))
                  await doSave(selectedTemplateKey)
                }}
              >
                Save campaign
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mt-3 rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <CampaignListTable
          campaigns={campaigns}
          loadingCampaigns={loadingCampaigns}
          selectedCampaignId={builder.selectedCampaignId}
          onSelectCampaign={async (c) => {
            // Toggle Edit <-> Cancel
            if (builder.selectedCampaignId && String(builder.selectedCampaignId) === String((c as any).id)) {
              clearDraft()
              dispatch(campaignBuilderActions.resetBuilder())
              setTemplateModalOpen(false)
              setSaveState({ type: 'idle' })
              return
            }
            dispatch(campaignBuilderActions.hydrateFromCampaignRow(c))
            setLoadingSelectedCampaign(true)
            try {
              const full = await apiGet<any>(`/api/campaigns/${c.id}`)
              dispatch(campaignBuilderActions.hydrateFromCampaignFull(full))
            } catch {
              // keep basic row hydrate; user can still edit the basics
            } finally {
              setLoadingSelectedCampaign(false)
            }
          }}
        />
      </section>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        <section className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
          <CampaignSidebar
            activeSection={builder.activeSection}
            onSectionChange={(k) => {
              // Prevent skipping required checks by clicking sidebar sections.
              const curIdx = TEMPLATE_SECTIONS.findIndex((s) => s.key === builder.activeSection)
              const targetIdx = TEMPLATE_SECTIONS.findIndex((s) => s.key === k)
              const goingBack = targetIdx >= 0 && curIdx >= 0 && targetIdx <= curIdx

              // Always allow going back (no validation gate).
              if (!goingBack) {
                const issues = validateRequired(builder)
                const currentIssue = issues.find((i) => i.section === builder.activeSection)
                if (currentIssue) {
                  window.alert(`Please fill the required fields before changing sections.\n\n- ${currentIssue.message}`)
                  return
                }
              }
              dispatch(campaignBuilderActions.setActiveSection(k))
            }}
          />
        </section>

        <section className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
          <div className="flex flex-col gap-4">
            <CampaignSectionHeader
              label={sectionMeta.label}
              helper={sectionMeta.helper}
              onSaveDraft={saveDraftNow}
              onPrevSection={goToPrevSection}
              onNextSection={goToNextSection}
            />

            {builder.activeSection === 'hero' ? (
              <HeroSection
                bannerImages={builder.bannerImages}
                setBannerImages={(next) =>
                  dispatch(campaignBuilderActions.setBannerImages(resolveSetState(builder.bannerImages, next)))
                }
              />
            ) : null}
            {builder.activeSection === 'overview' ? (
              <OverviewSection
                campaignName={builder.campaignName}
                setCampaignName={(v) => dispatch(campaignBuilderActions.setCampaignName(resolveSetState(builder.campaignName, v)))}
                logoUrl={builder.logoUrl}
                setLogoUrl={(v) => dispatch(campaignBuilderActions.setLogoUrl(resolveSetState(builder.logoUrl, v)))}
                coverImageUrl={builder.coverImageUrl}
                setCoverImageUrl={(v) =>
                  dispatch(campaignBuilderActions.setCoverImageUrl(resolveSetState(builder.coverImageUrl, v)))
                }
                contactEmail={builder.contactEmail}
                setContactEmail={(v) => dispatch(campaignBuilderActions.setContactEmail(resolveSetState(builder.contactEmail, v)))}
                contactMobile={builder.contactMobile}
                setContactMobile={(v) => dispatch(campaignBuilderActions.setContactMobile(resolveSetState(builder.contactMobile, v)))}
                startingPrice={builder.startingPrice}
                setStartingPrice={(v) => dispatch(campaignBuilderActions.setStartingPrice(resolveSetState(builder.startingPrice, v)))}
                completionDate={builder.completionDate}
                setCompletionDate={(v) => dispatch(campaignBuilderActions.setCompletionDate(resolveSetState(builder.completionDate, v)))}
                bhkRange={builder.bhkRange}
                setBhkRange={(v) => dispatch(campaignBuilderActions.setBhkRange(resolveSetState(builder.bhkRange, v)))}
                priceRange={builder.priceRange}
                setPriceRange={(v) => dispatch(campaignBuilderActions.setPriceRange(resolveSetState(builder.priceRange, v)))}
                projectLocation={builder.projectLocation}
                setProjectLocation={(v) => dispatch(campaignBuilderActions.setProjectLocation(resolveSetState(builder.projectLocation, v)))}
                totalFloors={builder.totalFloors}
                setTotalFloors={(v) => dispatch(campaignBuilderActions.setTotalFloors(resolveSetState(builder.totalFloors, v)))}
                squareFeetRanges={builder.squareFeetRanges}
                setSquareFeetRanges={(v) =>
                  dispatch(campaignBuilderActions.setSquareFeetRanges(resolveSetState(builder.squareFeetRanges, v)))
                }
                possessionDate={builder.possessionDate}
                reraNo={builder.reraNo}
                setReraNo={(v) => dispatch(campaignBuilderActions.setReraNo(resolveSetState(builder.reraNo, v)))}
                overviewFacts={builder.overviewFacts}
                setOverviewFacts={(v) =>
                  dispatch(campaignBuilderActions.setOverviewFacts(resolveSetState(builder.overviewFacts, v)))
                }
              />
            ) : null}
            {builder.activeSection === 'gallery' ? (
              <GallerySection
                galleryCells={builder.galleryCells}
                setGalleryCells={(v) =>
                  dispatch(campaignBuilderActions.setGalleryCells(resolveSetState(builder.galleryCells, v)))
                }
              />
            ) : null}
            {builder.activeSection === 'media' ? (
              <MediaSection
                videos={builder.videos}
                setVideos={(v) => dispatch(campaignBuilderActions.setVideos(resolveSetState(builder.videos, v)))}
                reels={builder.reels}
                setReels={(v) => dispatch(campaignBuilderActions.setReels(resolveSetState(builder.reels, v)))}
              />
            ) : null}
            {builder.activeSection === 'floorplans' ? (
              <FloorplansSection
                floorBlueprintImage={builder.floorBlueprintImage}
                setFloorBlueprintImage={(v) =>
                  dispatch(campaignBuilderActions.setFloorBlueprintImage(resolveSetState(builder.floorBlueprintImage, v)))
                }
                floorDefaultTab={builder.floorDefaultTab}
                setFloorDefaultTab={(v) =>
                  dispatch(campaignBuilderActions.setFloorDefaultTab(resolveSetState(builder.floorDefaultTab, v)))
                }
                floorTabs={builder.floorTabs}
                setFloorTabs={(v) => dispatch(campaignBuilderActions.setFloorTabs(resolveSetState(builder.floorTabs, v)))}
                floorRows={builder.floorRows}
                setFloorRows={(v) => dispatch(campaignBuilderActions.setFloorRows(resolveSetState(builder.floorRows, v)))}
                floorPlanImages={builder.floorPlanImages}
                setFloorPlanImages={(v) =>
                  dispatch(campaignBuilderActions.setFloorPlanImages(resolveSetState(builder.floorPlanImages, v)))
                }
              />
            ) : null}
            {builder.activeSection === 'amenities' ? (
              <AmenitiesSection
                amenityItems={builder.amenityItems}
                setAmenityItems={(v) =>
                  dispatch(campaignBuilderActions.setAmenityItems(resolveSetState(builder.amenityItems, v)))
                }
              />
            ) : null}
            {builder.activeSection === 'highlights' ? (
              <HighlightsSection
                highlightItems={builder.highlightItems}
                setHighlightItems={(v) =>
                  dispatch(campaignBuilderActions.setHighlightItems(resolveSetState(builder.highlightItems, v)))
                }
              />
            ) : null}
            {builder.activeSection === 'benefits' ? (
              <BenefitsSection
                benefitItems={builder.benefitItems}
                setBenefitItems={(v) =>
                  dispatch(campaignBuilderActions.setBenefitItems(resolveSetState(builder.benefitItems, v)))
                }
                benefitStats={builder.benefitStats}
                setBenefitStats={(v) =>
                  dispatch(campaignBuilderActions.setBenefitStats(resolveSetState(builder.benefitStats, v)))
                }
                benefitBackgroundImages={builder.benefitBackgroundImages}
                setBenefitBackgroundImages={(v) =>
                  dispatch(
                    campaignBuilderActions.setBenefitBackgroundImages(resolveSetState(builder.benefitBackgroundImages, v)),
                  )
                }
              />
            ) : null}
            {builder.activeSection === 'location' ? (
              <SocialInfrastructureSection
                socialInfrastructureGroups={builder.socialInfrastructureGroups}
                setSocialInfrastructureGroups={(v) =>
                  dispatch(
                    campaignBuilderActions.setSocialInfrastructureGroups(
                      resolveSetState(builder.socialInfrastructureGroups, v),
                    ),
                  )
                }
              />
            ) : null}
          </div>
        </section>
      </div>
    </section>
  )
}
