import { Link } from 'react-router-dom'

import { PageHeader } from '../../components/PageHeader'
import { d } from '../../lib/designClasses'

export function IntegrationsPage() {
  return (
    <div className={d.pageWrap}>
      <PageHeader
        title="Integrations"
        subtitle="Connect lead sources for your account. Each user gets their own webhook."
      />
      <div className={d.grid2}>
        <article className={d.cardP6}>
          <p className={d.sectionLabel}>Lead source</p>
          <h2 className="mb-2 text-xl font-semibold text-[#2E2E2E]">99acres</h2>
          <p className={`${d.muted} mb-5`}>
            Receive 99acres leads on a private webhook URL. The partner API key stays on the server.
          </p>
          <Link to="/settings/integrations/99acres" className={d.btnPrimarySm}>
            Open 99acres
          </Link>
        </article>
      </div>
    </div>
  )
}
