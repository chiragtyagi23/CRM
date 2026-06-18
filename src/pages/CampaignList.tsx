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
import { DEFAULT_TEMPLATE_KEY, type TemplateKey } from '../lib/campaign/templateKeys'
import type { CampaignListResponse, ExistingCampaign } from '../types/dtos'

export function CampaignList() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { permissions } = useACL()
  const canCampaignEdit = permissions.campaign.edit
  const [templateModalOpen, setTemplateModalOpen] = useState(false)
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<TemplateKey>(DEFAULT_TEMPLATE_KEY)

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
        title="Projects"
        subtitle="Create and manage project microsites."
        actions={
          canCampaignEdit ? (
            <button
              type="button"
              className={d.btnPrimary}
              onClick={() => {
                setSelectedTemplateKey(DEFAULT_TEMPLATE_KEY)
                setTemplateModalOpen(true)
              }}
            >
              Create new project
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




