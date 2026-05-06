import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiGet } from '../lib/crmApi'
import { campaignBuilderActions } from '../store/campaignBuilderSlice'
import { useAppDispatch } from '../store/hooks'
import { CampaignListTable } from '../components/CampaignListTable'
import { CampaignTemplateModal } from '../components/CampaignTemplateModal'
import type { CampaignListResponse, ExistingCampaign } from '../types/dtos'

export function CampaignList() {
  const navigate = useNavigate()
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

      <CampaignTemplateModal
        open={templateModalOpen}
        selectedTemplateKey={selectedTemplateKey}
        onChangeTemplate={setSelectedTemplateKey}
        onClose={() => setTemplateModalOpen(false)}
        onContinue={() => {
          setTemplateModalOpen(false)
          dispatch(campaignBuilderActions.resetBuilder())
          dispatch(campaignBuilderActions.setTemplateKey(selectedTemplateKey))
          navigate('/campaign/new')
        }}
      />

      <section className="mt-3 rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-5 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
        <CampaignListTable
          campaigns={campaigns}
          loadingCampaigns={loadingCampaigns}
          selectedCampaignId={null}
          onSelectCampaign={(c) => {
            navigate(`/campaign/edit/${encodeURIComponent(String(c.id))}`)
          }}
        />
      </section>
    </section>
  )
}

