import { apiGet, apiSend, apiUploadImage, apiUploadVideo } from '../lib/crmApi'
import type { ExistingCampaign } from '../types/campaign'

export const crmApiServices = {
  campaign: {
    getById(id: string) {
      return apiGet<any>(`/api/campaigns/${encodeURIComponent(String(id))}`)
    },
    saveFull(payload: unknown, selectedCampaignId?: string | null) {
      if (selectedCampaignId) {
        return apiSend<ExistingCampaign>(`/api/campaigns/${selectedCampaignId}/full`, 'PUT', payload)
      }
      return apiSend<ExistingCampaign>('/api/campaigns/full', 'POST', payload)
    },
  },
  uploads: {
    image(file: File, draft = false) {
      return apiUploadImage(file, { draft })
    },
    video(file: File, draft = false) {
      return apiUploadVideo(file, { draft })
    },
  },
}

