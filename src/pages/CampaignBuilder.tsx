import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { crmApiServices } from '../services/crmApiServices'
import { CampaignSectionHeader } from '../components/CampaignSectionHeader'
import { CampaignSidebar } from '../components/CampaignSidebar'
import { campaignBuilderActions } from '../store/campaignBuilderSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { buildCampaignPayload } from '../services/crmPayloadBuilder'
import { TEMPLATE_SECTIONS } from '../lib/campaign/templateSections'
import { AmenitiesSection } from './campaign/sections/AmenitiesSection'
import { BenefitsSection } from './campaign/sections/BenefitsSection'
import { FloorplansSection } from './campaign/sections/FloorplansSection'
import { HighlightsSection } from './campaign/sections/HighlightsSection'
import { ImagesSection } from './campaign/sections/ImagesSection'
import { MediaSection } from './campaign/sections/MediaSection'
import { OverviewSection } from './campaign/sections/OverviewSection'
import { SocialInfrastructureSection } from './campaign/sections/SocialInfrastructureSection'

function resolveSetState<T>(current: T, next: T | ((prev: T) => T)) {
  return typeof next === 'function' ? (next as (p: T) => T)(current) : next
}

function nonEmpty(s: unknown) {
  return typeof s === 'string' && s.trim().length > 0
}

type RequiredIssue = { section: (typeof TEMPLATE_SECTIONS)[number]['key']; message: string }

function validateRequired(builder: any): RequiredIssue[] {
  const issues: RequiredIssue[] = []

  const bannerCount = Array.isArray(builder?.bannerImages)
    ? builder.bannerImages.filter((b: any) => nonEmpty(b?.src)).length
    : 0
  if (bannerCount < 1) issues.push({ section: 'images', message: 'Banners: add at least 1 banner image.' })

  if (!nonEmpty(builder?.campaignName)) issues.push({ section: 'overview', message: 'Overview: Project name is required.' })
  if (!nonEmpty(builder?.coverImageUrl)) issues.push({ section: 'overview', message: 'Overview: Cover image is required.' })
  if (!nonEmpty(builder?.projectLocation)) issues.push({ section: 'overview', message: 'Overview: Location is required.' })
  if (!nonEmpty(builder?.startingPrice)) issues.push({ section: 'overview', message: 'Overview: Starting price is required.' })
  if (!nonEmpty(builder?.reraNo)) issues.push({ section: 'overview', message: 'Overview: RERA No. is required.' })
  if (!nonEmpty(builder?.totalFloors)) issues.push({ section: 'overview', message: 'Overview: Total floors is required.' })

  const galleryHasAny = Array.isArray(builder?.galleryCells)
    ? builder.galleryCells.some((c: any) => Array.isArray(c?.images) && c.images.some((img: any) => nonEmpty(img?.src)))
    : false
  if (!galleryHasAny) issues.push({ section: 'images', message: 'Gallery: add at least 1 image.' })

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
      const url = await crmApiServices.uploads.image(file)
      return { src: url, alt: String(img?.alt ?? '') }
    }
    return { src: String(img?.src ?? ''), alt: String(img?.alt ?? '') }
  }

  if (Array.isArray(builder?.bannerImages)) {
    clone.bannerImages = await Promise.all(builder.bannerImages.map(uploadIfNeeded))
  }

  if (Array.isArray(builder?.offerCreatives)) {
    clone.offerCreatives = await Promise.all(builder.offerCreatives.map(uploadIfNeeded))
  }

  if (Array.isArray(builder?.uspImages)) {
    clone.uspImages = await Promise.all(builder.uspImages.map(uploadIfNeeded))
  }

  if (Array.isArray(builder?.benefitBackgroundImages)) {
    clone.benefitBackgroundImages = await Promise.all(builder.benefitBackgroundImages.map(uploadIfNeeded))
  }

  if (Array.isArray(builder?.galleryCells)) {
    clone.galleryCells = await Promise.all(
      builder.galleryCells.map(async (cell: any) => ({
        ...cell,
        images: Array.isArray(cell?.images) ? await Promise.all(cell.images.map(uploadIfNeeded)) : [],
      })),
    )
  }

  if (builder?.floorPlanImages && typeof builder.floorPlanImages === 'object') {
    const next: Record<string, any[]> = {}
    for (const k of Object.keys(builder.floorPlanImages)) {
      const arr = builder.floorPlanImages[k]
      next[k] = Array.isArray(arr) ? await Promise.all(arr.map(uploadIfNeeded)) : []
    }
    clone.floorPlanImages = next
  }

  if (Array.isArray(builder?.amenityItems)) {
    clone.amenityItems = await Promise.all(
      builder.amenityItems.map(async (a: any) => ({
        ...a,
        icons: Array.isArray(a?.icons) ? await Promise.all(a.icons.map(uploadIfNeeded)) : [{ src: '', alt: '' }],
      })),
    )
  }

  return clone
}

async function materializeMediaForSave(builder: any) {
  const clone = structuredClone(stripFilesForDraft(builder))

  const uploadIfNeeded = async (m: any): Promise<{ url: string }> => {
    const file: File | undefined = m?.file
    if (file) {
      const url = await crmApiServices.uploads.video(file)
      return { url }
    }
    return { url: String(m?.url ?? '') }
  }

  if (builder?.videos && typeof builder.videos === 'object') {
    clone.videos = {
      intro: await uploadIfNeeded(builder.videos.intro),
      walkthrough: await uploadIfNeeded(builder.videos.walkthrough),
      extra: await uploadIfNeeded(builder.videos.extra),
    }
  }
  if (builder?.reels && typeof builder.reels === 'object') {
    clone.reels = {
      reel1: await uploadIfNeeded(builder.reels.reel1),
      reel2: await uploadIfNeeded(builder.reels.reel2),
      reel3: await uploadIfNeeded(builder.reels.reel3),
    }
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

export function CampaignBuilder({ initialCampaignId }: { initialCampaignId?: string }) {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const builder = useAppSelector((s) => s.campaignBuilder)
  const isEditing = Boolean(builder.selectedCampaignId)

  const sectionMeta = useMemo(
    () => TEMPLATE_SECTIONS.find((s) => s.key === builder.activeSection)!,
    [builder.activeSection],
  )

  const [loadingSelectedCampaign, setLoadingSelectedCampaign] = useState(false)
  const [saveState, setSaveState] = useState<
    { type: 'idle' } | { type: 'saving' } | { type: 'error'; message: string } | { type: 'saved' }
  >({ type: 'idle' })
  const [flash, setFlash] = useState<null | { message: string }>(null)

  const showFlash = (message: string) => {
    setFlash({ message })
    window.setTimeout(() => setFlash(null), 1400)
  }

  // Restore draft if user was mid-creation and refreshed.
  useEffect(() => {
    if (builder.selectedCampaignId) return
    const d = readDraft()
    if (!d) return
    dispatch(campaignBuilderActions.hydrateFromDraft(d))
    showFlash('Draft restored.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // If we are on edit route, hydrate from server.
  useEffect(() => {
    if (!initialCampaignId) return
    if (String(builder.selectedCampaignId || '') === String(initialCampaignId)) return

    setLoadingSelectedCampaign(true)
    crmApiServices.campaign.getById(String(initialCampaignId))
      .then((full) => {
        dispatch(campaignBuilderActions.setSelectedCampaignId(String(initialCampaignId)))
        dispatch(campaignBuilderActions.hydrateFromCampaignFull(full))
      })
      .catch(() => {
        // ignore; keep empty builder
      })
      .finally(() => setLoadingSelectedCampaign(false))
  }, [dispatch, initialCampaignId, builder.selectedCampaignId])

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
      const builderForSave = await materializeImagesForSave(builder)
      const mediaForSave = await materializeMediaForSave(builder)
      const updating = Boolean(builder.selectedCampaignId)
      const prevSelectedId = builder.selectedCampaignId ? String(builder.selectedCampaignId) : null

      const payload = buildCampaignPayload({ builder, builderForSave, mediaForSave, templateKey })

      const saved = await crmApiServices.campaign.saveFull(payload, builder.selectedCampaignId)

      const savedId = String((saved as unknown as { id: unknown }).id)

      if (updating) {
        dispatch(campaignBuilderActions.setSelectedCampaignId(savedId))
      } else {
        clearDraft()
        dispatch(campaignBuilderActions.resetBuilder())
        dispatch(campaignBuilderActions.setTemplateKey(templateKey))
      }

      showFlash(updating ? 'Your dashboard is updated successfully.' : 'Campaign created successfully.')
      setSaveState({ type: 'saved' })
      window.setTimeout(() => setSaveState({ type: 'idle' }), 1200)

      // If this was a create, go back to list.
      if (!updating || !prevSelectedId) {
        window.setTimeout(() => {
          navigate('/campaign')
        }, 500)
      }
    } catch (e: unknown) {
      setSaveState({
        type: 'error',
        message: e && typeof e === 'object' && 'message' in e ? String((e as { message?: string }).message) : 'Save failed',
      })
    }
  }

  const onSaveClick = () => {
    if (saveState.type === 'saving') return
    void doSave(builder.templateKey)
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 text-[13px] font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => navigate('/campaign')}
            >
              Back
            </button>
            <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em] text-gray-900">
              {isEditing ? 'Edit campaign' : 'Create campaign'}
            </h2>
          </div>
          <p className="mt-1 text-[14px] font-medium text-gray-500">Fill the form to generate your microsite.</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-gray-300 bg-white px-5 text-[13px] font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => {
                dispatch(campaignBuilderActions.resetBuilder())
                navigate('/campaign')
              }}
            >
              Cancel
            </button>
          ) : null}
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

      

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-start">
        <section className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
          <CampaignSidebar
            activeSection={builder.activeSection}
            onSectionChange={(k) => {
              const curIdx = TEMPLATE_SECTIONS.findIndex((s) => s.key === builder.activeSection)
              const targetIdx = TEMPLATE_SECTIONS.findIndex((s) => s.key === k)
              const goingBack = targetIdx >= 0 && curIdx >= 0 && targetIdx <= curIdx

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

            {builder.activeSection === 'images' ? (
              <ImagesSection
                bannerImages={builder.bannerImages}
                setBannerImages={(next) =>
                  dispatch(campaignBuilderActions.setBannerImages(resolveSetState(builder.bannerImages, next)))
                }
                offerCreatives={builder.offerCreatives}
                setOfferCreatives={(next) =>
                  dispatch(campaignBuilderActions.setOfferCreatives(resolveSetState(builder.offerCreatives, next)))
                }
                uspImages={builder.uspImages}
                setUspImages={(next) =>
                  dispatch(campaignBuilderActions.setUspImages(resolveSetState(builder.uspImages, next)))
                }
                galleryCells={builder.galleryCells}
                setGalleryCells={(v) =>
                  dispatch(campaignBuilderActions.setGalleryCells(resolveSetState(builder.galleryCells, v)))
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
                    campaignBuilderActions.setSocialInfrastructureGroups(resolveSetState(builder.socialInfrastructureGroups, v)),
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

