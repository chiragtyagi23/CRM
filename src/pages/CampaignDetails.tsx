import { useEffect, useMemo, useState } from 'react'
import { FiChevronLeft } from 'react-icons/fi'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { LeadCard } from '../components/LeadCard'
import { fetchCaptureLeads, patchCaptureLead } from '../lib/captureLeadsApi'
import { toLeadRow } from '../utils/leadMapping'
import type { LeadDTO, LeadScoreDTO, LeadStatusDTO } from '../lib/dashboardDummyApi'
import { useACL } from '../acl/useACL'
import { fetchUsers } from '../lib/usersApi'
import { crmPayloadBuilder } from '../services/crmPayloadBuilder'



function CampaignDetails() {
  const { id = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const stateTitle = String((location.state as { title?: string } | null)?.title ?? '').trim()
  const [items, setItems] = useState<LeadDTO[]>([])
  const [loading, setLoading] = useState(true)
  const { hasAccess } = useACL()
  const canAssign = hasAccess('leads.assignto')
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  const [overrides, setOverrides] = useState<Record<string, { score?: LeadScoreDTO; status?: LeadStatusDTO; assignedTo?: string }>>({})

  const rows = useMemo(() => items, [items])
  const rowsWithOverrides = useMemo(() => {
    return rows.map((r) => {
      const o = overrides[r.id]
      return o
        ? {
            ...r,
            score: o.score ?? r.score,
            status: o.status ?? r.status,
            assignedTo: o.assignedTo ?? r.assignedTo,
          }
        : r
    })
  }, [overrides, rows])

  const baseById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetchCaptureLeads(id)
      .then((leadsRes) => {
        if (cancelled) return
        setItems((leadsRes.items ?? []).map(toLeadRow))
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    fetchUsers()
      .then((res) => {
        const names = (res.items ?? [])
          .map((u) => String(u.name || '').trim())
          .filter(Boolean)
        setTeamMembers(names)
      })
      .catch(() => {
        setTeamMembers([])
      })
  }, [])
  

  const title = stateTitle || 'Campaign'

  return (
    <div className="crm-page">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-1 py-2 text-[12px] font-medium text-[#8B7355] hover:text-[#2E2E2E]"
        onClick={() => navigate('/campaign')}
      >
        <FiChevronLeft size={16} aria-hidden />
        Back to Campaign List
      </button>

      <div className="crm-page-header mt-3">
        <h1 className="crm-page-title">{`${title} Details`}</h1>
        <p className="crm-page-subtitle">Leads linked by campaign id</p>
      </div>

      {loading ? (
        <p className="text-[#8B7355]">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-[#8B7355]">No leads yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rowsWithOverrides.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onChangeScore={() => {}}
              onChangeStatus={() => {}}
              canEditAssignee={canAssign}
              assigneeOptions={teamMembers}
              canDelete={false}
              onChangeAssignee={(next) => {
                setOverrides((s) => ({ ...s, [lead.id]: { ...(s[lead.id] ?? {}), assignedTo: next } }))
              }}
              dirty={(() => {
                const base = baseById.get(lead.id)
                if (!base) return false
                return base.assignedTo !== lead.assignedTo
              })()}
              onUpdate={async () => {
                const base = baseById.get(lead.id)
                if (!base) return
                const patch = crmPayloadBuilder.captureLead.buildLeadListCardPatch({
                  base: { score: base.score, status: base.status, assignedTo: base.assignedTo },
                  lead: { score: lead.score, status: lead.status, assignedTo: lead.assignedTo },
                })
                try {
                  await patchCaptureLead(lead.id, patch)
                  setItems((prev) =>
                    prev.map((r) => (r.id === lead.id ? { ...r, assignedTo: lead.assignedTo } : r)),
                  )
                  setOverrides((s) => {
                    const next = { ...s }
                    delete next[lead.id]
                    return next
                  })
                } catch {
                  window.alert('Could not update assignee. Try again.')
                }
              }}
              onViewDetails={() =>
                navigate(`/leads/viewdetail/${lead.id}`, {
                  state: { fromCampaign: { id, title } },
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CampaignDetails
