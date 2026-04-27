import { useEffect, useState } from 'react'

import { apiGet } from '../lib/crmApi'
import { campaignBuilderActions } from '../store/campaignBuilderSlice'
import { useAppDispatch } from '../store/hooks'
import { CampaignListTable } from './campaign/CampaignListTable'
import type { CampaignListResponse, ExistingCampaign } from './campaign/types'

export function CampaignList() {
  const dispatch = useAppDispatch()
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<'luxury-template' | 'affordable-template'>('luxury-template')

  const [campaigns, setCampaigns] = useState<ExistingCampaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)

  useEffect(() => {
    apiGet<CampaignListResponse>('/api/campaigns')
      .then((d) => setCampaigns(d.items))
      .catch(() => setCampaigns([]))
      .finally(() => setLoadingCampaigns(false))
  }, [])

  return (
    <section className="mx-auto box-border w-full max-w-[1280px] py-2 pb-6">
      <header className="flex flex-col gap-3 py-2 pb-4 min-[760px]:flex-row min-[760px]:items-start min-[760px]:justify-between">
        <div>
          <h2 className="m-0 text-[28px] font-bold tracking-[-0.03em] text-gray-900">Campaigns</h2>
          <p className="mt-1 text-[14px] font-medium text-gray-500">Create and manage campaign microsites.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#80654a] px-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#725940]"
            onClick={() => {
              setSelectedTemplateKey('luxury-template')
              setTemplateModalOpen(true)
            }}
          >
            Create new campaign
          </button>
        </div>
      </header>

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
            <div className="mt-1 text-[13px] font-medium text-gray-500">Select which microsite template to use for this campaign.</div>

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
                onClick={() => {
                  setTemplateModalOpen(false)
                  dispatch(campaignBuilderActions.resetBuilder())
                  dispatch(campaignBuilderActions.setTemplateKey(selectedTemplateKey))
                  window.location.hash = '#campaign/new'
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="mt-3 rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <CampaignListTable
          campaigns={campaigns}
          loadingCampaigns={loadingCampaigns}
          selectedCampaignId={null}
          onSelectCampaign={(c) => {
            window.location.hash = `#campaign/edit/${encodeURIComponent(String(c.id))}`
          }}
        />
      </section>
    </section>
  )
}

