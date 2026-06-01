import { useEffect, useMemo, useState } from 'react'

import type { CaptureLeadDTO, ExistingCampaign } from '../types/dtos'
import { IoEyeSharp } from 'react-icons/io5'
import { Link } from 'react-router-dom'
import { WiDirectionUpRight } from 'react-icons/wi'
import type { LeadDTO } from '../lib/dashboardDummyApi'
import { useACL } from '../acl/useACL'
import { fetchUsers } from '../lib/usersApi'
import { fetchCaptureLeads, patchCaptureLead } from '../lib/captureLeadsApi'

const CAMPAIGN_ASSIGNEE_ROLES = new Set(['manager', 'admin'])
const campaignSiteBase =
  (import.meta.env.VITE_CAMPAIGN_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

function isCampaignAssigneeRole(role: string | null | undefined): boolean {
  return CAMPAIGN_ASSIGNEE_ROLES.has((role ?? '').trim().toLowerCase())
}

function deriveCampaignAssignee(leads: CaptureLeadDTO[]): string {
  const names = leads.map((l) => (l.callBy ?? '').trim()).filter(Boolean)
  if (names.length === 0) return '—'
  const unique = [...new Set(names)]
  return unique.length === 1 ? unique[0] : '—'
}

function assigneeOptionsWithCurrent(options: string[], current?: string): string[] {
  const name = current?.trim()
  if (!name || name === '—' || options.includes(name)) return options
  return [name, ...options]
}

type CampaignsProps = {
  variant?: 'campaigns'
  campaigns: ExistingCampaign[]
  loadingCampaigns: boolean
  selectedCampaignId: string | null
  onSelectCampaign: (campaign: ExistingCampaign) => void
}

type LeadsProps = {
  variant: 'leads'
  leads: LeadDTO[]
  loading: boolean
  canEditAssignee?: boolean
  assigneeOptions?: string[]
  onChangeAssignee?: (leadId: string, assignee: string) => void
  dirtyById?: Record<string, boolean>
  onUpdate?: (leadId: string) => void
  onViewDetails: (lead: LeadDTO) => void
}

export type CampaignListTableProps = CampaignsProps | LeadsProps

function AssignToSelect({
  assignedTo,
  canEditAssignee,
  assigneeOptions,
  onChangeAssignee,
}: {
  assignedTo?: string
  canEditAssignee?: boolean
  assigneeOptions?: string[]
  onChangeAssignee?: (assignee: string) => void
}) {
  const display = assignedTo?.trim() || '—'
  if (!canEditAssignee) {
    return <span className="text-[#2E2E2E]">{display}</span>
  }

  return (
    <select
      value={display === '—' ? '' : display}
      onChange={(e) => onChangeAssignee?.(e.target.value)}
      className="max-w-[160px] rounded-lg border border-[#E8DCCB] bg-white px-2 py-1 text-xs font-medium text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none"
    >
      <option value="" disabled>
        Select
      </option>
      {(assigneeOptions ?? []).map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  )
}

export function CampaignListTable(props: CampaignListTableProps) {
  const { hasAccess } = useACL()
  const canEditAssignee = hasAccess('leads.assignto')
  const [assigneeOptions, setAssigneeOptions] = useState<string[]>([])
  const [assigneeOverrides, setAssigneeOverrides] = useState<Record<string, string>>({})
  const [baseAssigneeByCampaignId, setBaseAssigneeByCampaignId] = useState<Record<string, string>>({})
  const [leadsByCampaignId, setLeadsByCampaignId] = useState<Record<string, CaptureLeadDTO[]>>({})
  const [savingCampaignId, setSavingCampaignId] = useState<string | null>(null)

  const campaignIdsKey = useMemo(() => {
    if (props.variant === 'leads') return ''
    return props.campaigns
      .map((c) => c.id)
      .sort()
      .join(',')
  }, [props])

  useEffect(() => {
    if (props.variant === 'leads') return
    fetchUsers()
      .then((res) => {
        const names = (res.items ?? [])
          .filter((u) => isCampaignAssigneeRole(u.role))
          .map((u) => String(u.name || '').trim())
          .filter(Boolean)
        setAssigneeOptions(names)
      })
      .catch(() => setAssigneeOptions([]))
  }, [props.variant])


  useEffect(() => {
    if (props.variant === 'leads' || !campaignIdsKey) return

    let cancelled = false
    fetchCaptureLeads()
      .then((res) => {
        if (cancelled) return
        const byCampaign: Record<string, CaptureLeadDTO[]> = {}
        for (const lead of res.items ?? []) {
          const campaignId = lead.campaignId
          if (!campaignId) continue
          if (!byCampaign[campaignId]) byCampaign[campaignId] = []
          byCampaign[campaignId].push(lead)
        }
        setLeadsByCampaignId(byCampaign)
        const base: Record<string, string> = {}
        for (const [campaignId, leads] of Object.entries(byCampaign)) {
          base[campaignId] = deriveCampaignAssignee(leads)
        }
        setBaseAssigneeByCampaignId(base)
      })
      .catch(() => {
        if (!cancelled) {
          setLeadsByCampaignId({})
          setBaseAssigneeByCampaignId({})
        }
      })

    return () => {
      cancelled = true
    }
  }, [props.variant, campaignIdsKey])

  const displayAssignee = (campaignId: string) =>
    assigneeOverrides[campaignId] ?? baseAssigneeByCampaignId[campaignId] ?? '—'

  const isAssigneeDirty = (campaignId: string) => {
    const base = baseAssigneeByCampaignId[campaignId] ?? '—'
    return displayAssignee(campaignId) !== base
  }

  const saveCampaignAssignee = async (campaignId: string) => {
    const next = displayAssignee(campaignId)
    const callBy = next === '—' ? null : next
    const leads = leadsByCampaignId[campaignId] ?? []
    if (leads.length === 0) {
      window.alert('No leads linked to this campaign yet.')
      return
    }

    setSavingCampaignId(campaignId)
    try {
      const toPatch = leads.filter((l) => (l.callBy ?? '').trim() !== (callBy ?? '').trim())
      await Promise.all(toPatch.map((l) => patchCaptureLead(l.id, { callBy })))

      setLeadsByCampaignId((prev) => ({
        ...prev,
        [campaignId]: (prev[campaignId] ?? []).map((l) => ({ ...l, callBy })),
      }))
      setBaseAssigneeByCampaignId((prev) => ({ ...prev, [campaignId]: next }))
      setAssigneeOverrides((prev) => {
        const nextOverrides = { ...prev }
        delete nextOverrides[campaignId]
        return nextOverrides
      })
    } catch {
      window.alert('Could not update assignee. Try again.')
    } finally {
      setSavingCampaignId(null)
    }
  }

  if (props.variant === 'leads') {
    const {
      leads,
      loading,
      canEditAssignee,
      assigneeOptions,
      onChangeAssignee,
      dirtyById,
      onUpdate,
      onViewDetails,
    } = props
    const colSpan = 6

    return (
      <div className="mt-5 rounded-xl border border-[#E8DCCB] bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 text-xs tracking-widest uppercase text-[#8B7355] border-b border-[#E8DCCB]">
          Campaign leads
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[#8B7355]">
              <tr className="border-b border-[#E8DCCB]">
                <th className="text-left font-semibold px-4 py-3">Name</th>
                <th className="text-left font-semibold px-4 py-3">Contact</th>
                <th className="text-left font-semibold px-4 py-3">Budget</th>
                <th className="text-left font-semibold px-4 py-3">BHK</th>
                <th className="text-left font-semibold px-4 py-3">Assign To</th>
                <th className="text-left font-semibold px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="text-[#2E2E2E]">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-[#8B7355]" colSpan={colSpan}>
                    Loading…
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-[#8B7355]" colSpan={colSpan}>
                    No leads yet.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-[#E8DCCB] last:border-b-0">
                    <td className="px-4 py-3 font-semibold">{lead.name}</td>
                    <td className="px-4 py-3 text-[#8B7355]">{lead.contact || '—'}</td>
                    <td className="px-4 py-3 text-[#8B7355]">{lead.budgetLabel?.trim() || '—'}</td>
                    <td className="px-4 py-3 text-[#8B7355]">{lead.bhkLabel?.trim() || '—'}</td>
                    <td className="px-4 py-3">
                      <AssignToSelect
                        assignedTo={lead.assignedTo}
                        canEditAssignee={canEditAssignee}
                        assigneeOptions={assigneeOptions}
                        onChangeAssignee={(value) => onChangeAssignee?.(lead.id, value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          className="text-[#8B7355] hover:text-[#2E2E2E]"
                          onClick={() => onViewDetails(lead)}
                          aria-label="View lead details"
                        >
                          <WiDirectionUpRight className="w-8 h-8" />
                        </button>
                        {dirtyById?.[lead.id] ? (
                          <button
                            type="button"
                            className="h-9 px-3 rounded-lg border border-[#E8DCCB] bg-[#F5EFE7] text-xs font-semibold text-[#8B7355] hover:bg-[#ede4d8]"
                            onClick={() => onUpdate?.(lead.id)}
                          >
                            Update
                          </button>
                        ) : null}
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

  const { campaigns, loadingCampaigns, selectedCampaignId, onSelectCampaign } = props
  const colSpan = 6

  return (
    <div className="mt-5 rounded-xl border border-[#E8DCCB] bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 text-xs tracking-widest uppercase text-[#8B7355] border-b border-[#E8DCCB]">
        Campaign list
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[#8B7355]">
            <tr className="border-b border-[#E8DCCB]">
              <th className="text-left font-semibold px-4 py-3">Project name</th>
              <th className="text-left font-semibold px-4 py-3">Address</th>
              <th className="text-left font-semibold px-4 py-3">Reg no.</th>
              <th className="text-left font-semibold px-4 py-3">Action</th>
              <th className="text-left font-semibold px-4 py-3">Details</th>
              <th className="text-left font-semibold px-4 py-3">Assign To</th>

            </tr>
          </thead>
          <tbody className="text-[#2E2E2E]">
            {loadingCampaigns ? (
              <tr>
                <td className="px-4 py-4 text-[#8B7355]" colSpan={colSpan}>
                  Loading…
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-[#8B7355]" colSpan={colSpan}>
                  No campaigns yet.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} className="border-b border-[#E8DCCB] last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{c.title}</td>
                  <td className="px-4 py-3 text-[#8B7355]">{c.address ?? '—'}</td>
                  <td className="px-4 py-3 text-[#8B7355]">{c.regNo ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className={
                          selectedCampaignId === c.id
                            ? 'h-9 px-3 rounded-lg bg-violet-600 text-white text-xs font-semibold'
                            : 'h-9 px-3 rounded-lg border border-[#E8DCCB] bg-white text-[#2E2E2E] text-xs font-semibold hover:bg-[#F5EFE7]'
                        }
                        onClick={() => onSelectCampaign(c)}
                      >
                        {selectedCampaignId === c.id ? 'Cancel' : 'Edit'}
                      </button>
                      <a
                        href={`${campaignSiteBase}/${c.title.toLowerCase().replace(/ /g, '-')}/${c.id}?template=${c.templateKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#8B7355]"
                      >
                        <IoEyeSharp className="w-6 h-6" />
                      </a>
                    </div>
                  </td>
                  <td className="text-[#8B7355] px-4 py-3 font-semibold">
                    <Link to={`/campaign/${c.id}`} state={{ title: c.title }} aria-label={`${c.title} details`}>
                      <WiDirectionUpRight className="w-8 h-8" />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <AssignToSelect
                        assignedTo={displayAssignee(c.id)}
                        canEditAssignee={canEditAssignee}
                        assigneeOptions={assigneeOptionsWithCurrent(assigneeOptions, displayAssignee(c.id))}
                        onChangeAssignee={(value) => setAssigneeOverrides((s) => ({ ...s, [c.id]: value }))}
                      />
                      {isAssigneeDirty(c.id) ? (
                        <button
                          type="button"
                          disabled={savingCampaignId === c.id}
                          className="h-9 px-3 rounded-lg border border-[#E8DCCB] bg-[#F5EFE7] text-xs font-semibold text-[#8B7355] hover:bg-[#ede4d8] disabled:opacity-60"
                          onClick={() => void saveCampaignAssignee(c.id)}
                        >
                          {savingCampaignId === c.id ? 'Saving…' : 'Update'}
                        </button>
                      ) : null}
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
