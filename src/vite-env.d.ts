/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CRM_API_URL?: string
  readonly VITE_CAMPAIGN_SITE_URL?: string
  readonly VITE_QR_FORM_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
