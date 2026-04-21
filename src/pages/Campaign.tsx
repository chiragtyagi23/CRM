import { useEffect, useMemo, useState } from 'react'

import { apiGet, apiSend } from '../lib/crmApi'
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

  const goToNextSection = () => {
    const idx = TEMPLATE_SECTIONS.findIndex((s) => s.key === builder.activeSection)
    const next = TEMPLATE_SECTIONS[Math.min(TEMPLATE_SECTIONS.length - 1, idx + 1)]
    dispatch(campaignBuilderActions.setActiveSection(next.key))
  }

  const doSave = async (templateKey: 'luxury-template' | 'affordable-template') => {
    if (saveState.type === 'saving') return
    setSaveState({ type: 'saving' })
    try {
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
            title: builder.campaignName,
            address: builder.projectLocation,
            reg_no: builder.reraNo,
            logo: builder.logoUrl,
            coverImage: builder.coverImageUrl,
            templateKey,
          },
          hero: {
            backgroundImages: builder.bannerImages.filter((b) => b.src.trim().length > 0),
            eyebrow: '',
            titleLine1: '',
            titleLine2Italic: '',
            snapshotSummary: '',
            locationLine: '',
            metaCells: [],
            primaryCta: { label: 'Book Site Visit', targetSectionId: 'enquiry' },
            secondaryCta: { label: 'View Floor Plans', targetSectionId: 'residences' },
            badge: builder.possessionDate,
          },
          overview: {
            sectionLabel: 'Project Overview',
            title: { before: 'Everything You Need to ', italic: 'Know', after: '' },
            facts: [
              { key: 'Project Name', value: builder.campaignName },
              { key: 'Email', value: builder.contactEmail },
              { key: 'Mobile', value: builder.contactMobile },
              { key: 'Starting Price', value: builder.startingPrice },
              { key: 'Completion Date (CBT)', value: builder.completionDate },
              { key: 'RERA Registration Number', value: builder.reraNo },
              { key: 'BHK Range', value: builder.bhkRange },
              { key: 'Price Range', value: builder.priceRange },
              { key: 'Location', value: builder.projectLocation },
              { key: 'Total Floors', value: builder.totalFloors },
              { key: 'Square Feet Ranges', value: builder.squareFeetRanges },
              { key: 'Possession', value: builder.possessionDate },
              { key: 'Serial Number', value: builder.overviewFacts.serialNumber },
              { key: 'Code Name', value: builder.overviewFacts.codeName },
              { key: 'Location (detail)', value: builder.overviewFacts.location },
              { key: 'Land Parcel', value: builder.overviewFacts.landParcel },
              { key: 'Project', value: builder.overviewFacts.project },
              { key: 'Apartments', value: builder.overviewFacts.apartments },
              { key: 'Building', value: builder.overviewFacts.building },
              { key: 'Carpet Areas', value: builder.overviewFacts.carpetAreas },
            ].filter((f) => f.value.trim().length > 0),
            certificationsTitle: 'Project Certifications & Registration',
            certifications: [{ label: 'MahaRERA No.', value: builder.reraNo }].filter((c) => c.value.trim().length > 0),
          },
          gallery: {
            sectionLabel: 'Project Images',
            title: { before: 'A Glimpse of ', italic: builder.campaignName || 'Project', after: '' },
            cells: builder.galleryCells.map((c) => ({
              tag: c.tag,
              feature: c.feature,
              wideBottom: c.wideBottom,
              images: c.images.filter((img) => img.src.trim().length > 0),
            })),
          },
          floorplans: {
            sectionLabel: 'Size & Floor Plans',
            title: { before: 'Choose Your ', italic: 'Residence', after: '' },
            blueprintImage: builder.floorBlueprintImage,
            defaultTabId: builder.floorDefaultTab,
            tabs: [
              { id: 'bhk3', label: '3 BHK' },
              { id: 'bhk4', label: '4 BHK' },
              { id: 'bhk5', label: '5 BHK' },
            ],
            panels: {
              bhk3: {
                columns: ['Configuration', 'Carpet Area', 'Floor Range', 'Price'],
                rows: builder.floorRows.bhk3.map((r) => [r.configuration, r.carpetArea, r.floorRange, r.price]),
                floorPlanImages: builder.floorPlanImages.bhk3.map((i) => i.src).filter((s) => s.trim().length > 0),
                priceLabel: 'Starting Price',
                price: '',
                priceNote: '',
                planTag: '3 BHK',
                planInnerModifier: '',
              },
              bhk4: {
                columns: ['Configuration', 'Carpet Area', 'Floor Range', 'Price'],
                rows: builder.floorRows.bhk4.map((r) => [r.configuration, r.carpetArea, r.floorRange, r.price]),
                floorPlanImages: builder.floorPlanImages.bhk4.map((i) => i.src).filter((s) => s.trim().length > 0),
                priceLabel: 'Starting Price',
                price: '',
                priceNote: '',
                planTag: '4 BHK',
                planInnerModifier: '',
              },
              bhk5: {
                columns: ['Configuration', 'Carpet Area', 'Floor Range', 'Price'],
                rows: builder.floorRows.bhk5.map((r) => [r.configuration, r.carpetArea, r.floorRange, r.price]),
                floorPlanImages: builder.floorPlanImages.bhk5.map((i) => i.src).filter((s) => s.trim().length > 0),
                priceLabel: 'Starting Price',
                price: '',
                priceNote: '',
                planTag: '5 BHK',
                planInnerModifier: '',
              },
            },
          },
          amenities: {
            sectionLabel: 'Amenities',
            title: { before: '', italic: 'Amenities', after: '' },
            items: builder.amenityItems.map((a) => ({ name: a.name })).filter((a) => a.name.trim().length > 0),
          },
          benefits: {
            sectionLabel: 'Benefits',
            title: { before: 'Why Invest in ', italic: builder.campaignName || 'Project', after: '' },
            backgroundImages: builder.benefitBackgroundImages.filter((b) => b.src.trim().length > 0),
            items: builder.benefitItems
              .filter((b) => b.heading.trim().length > 0 || b.description.trim().length > 0)
              .map((b, idx) => ({
                num: String(idx + 1).padStart(2, '0'),
                title: b.heading.trim().length > 0 ? b.heading : `Benefit ${idx + 1}`,
                text: b.description,
              })),
            stats: builder.benefitStats.filter((s) => s.value.trim().length > 0 || s.label.trim().length > 0),
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
          <a
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#e7ddcf] bg-[#FDFBF7] px-5 text-[13px] font-semibold text-[#80654a] shadow-sm hover:bg-[#faf6ef] no-underline"
            href={`/project-name?template=${encodeURIComponent(selectedTemplateKey)}`}
            target="_blank"
            rel="noreferrer"
          >
            Preview microsite
          </a>
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
            onSectionChange={(k) => dispatch(campaignBuilderActions.setActiveSection(k))}
          />
        </section>

        <section className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-4 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
          <div className="flex flex-col gap-4">
            <CampaignSectionHeader label={sectionMeta.label} helper={sectionMeta.helper} onNextSection={goToNextSection} />

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
