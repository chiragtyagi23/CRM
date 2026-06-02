import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { apiGet } from '../lib/crmApi'
import { campaignBuilderActions } from '../store/campaignBuilderSlice'
import { useAppDispatch } from '../store/hooks'
import { CampaignListTable } from '../components/CampaignListTable'
import { useACL } from '../acl/useACL'
import { PageHeader } from '../components/PageHeader'
import { d } from '../lib/designClasses'
import { CampaignTemplateModal } from '../components/CampaignTemplateModal'
import type { CampaignListResponse, ExistingCampaign } from '../types/dtos'

export function CampaignList() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { permissions } = useACL()
  const canCampaignEdit = permissions.campaign.edit
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
    <section className="w-full">
      <PageHeader
        title="Campaigns"
        subtitle="Create and manage campaign microsites."
        actions={
          canCampaignEdit ? (
            <button
              type="button"
              className={d.btnPrimary}
              onClick={() => {
                setSelectedTemplateKey('luxury-template')
                setTemplateModalOpen(true)
              }}
            >
              Create new campaign
            </button>
          ) : null
        }
      />

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

      <section className={d.cardP6}>
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




