/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NAV_API_URL?: string
  readonly VITE_CAMPAIGN_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
