import type { ExistingCampaign } from './types'

export function CampaignListTable({
  campaigns,
  loadingCampaigns,
  selectedCampaignId,
  onSelectCampaign,
}: {
  campaigns: ExistingCampaign[]
  loadingCampaigns: boolean
  selectedCampaignId: string | null
  onSelectCampaign: (campaign: ExistingCampaign) => void
}) {
  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 text-xs tracking-widest uppercase text-gray-500 border-b border-gray-200">Campaign list</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500">
            <tr className="border-b border-gray-200">
              <th className="text-left font-semibold px-4 py-3">Campaign name</th>
              <th className="text-left font-semibold px-4 py-3">Address</th>
              <th className="text-left font-semibold px-4 py-3">Reg no.</th>
              <th className="text-left font-semibold px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="text-gray-900">
            {loadingCampaigns ? (
              <tr>
                <td className="px-4 py-4 text-gray-500" colSpan={4}>
                  Loading…
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-gray-500" colSpan={4}>
                  No campaigns yet.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{c.title}</td>
                  <td className="px-4 py-3 text-gray-600">{c.address ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.regNo ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={
                          selectedCampaignId === c.id
                            ? 'h-9 px-3 rounded-lg bg-violet-600 text-white text-xs font-semibold'
                            : 'h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50'
                        }
                        onClick={() => onSelectCampaign(c)}
                      >
                        {selectedCampaignId === c.id ? 'Cancel' : 'Edit'}
                      </button>

                      {/* <a
                        className="h-9 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-xs font-semibold hover:bg-gray-50 inline-flex items-center no-underline"
                        href={`/project-name/${encodeURIComponent(c.id)}?template=${encodeURIComponent(
                          (c as any).templateKey || 'luxury-template',
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Preview
                      </a> */}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
