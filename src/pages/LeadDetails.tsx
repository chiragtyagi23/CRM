import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiArrowUpRight, FiCalendar, FiChevronLeft, FiClock, FiGrid, FiMail, FiMapPin, FiMessageSquare, FiPhone } from 'react-icons/fi'

import {
  type LeadDTO,
} from '../lib/dashboardDummyApi'
import { fetchCaptureLeadById, patchCaptureLead } from '../lib/captureLeadsApi'
import { ScheduleVisitModal } from '../components/ScheduleVisitModal'
import { fmtLongDateTime } from '../utils/format'
import { BUYING_STAGE_OPTIONS } from '../utils/uiConfig'
import { toLeadDetailsRow } from '../utils/leadMapping'

function IconDot({ tone }: { tone: 'mint' | 'sand' }) {
  const cls = tone === 'mint' ? 'bg-[#6FAF8F]' : 'bg-[#8B7355]'
  return <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${cls}`} />
}

type LeadDetailsTab = 'overview' | 'activity' 
// | 'opportunities' | 'documents'

function LeadTabs({ active, onChange }: { active: LeadDetailsTab; onChange: (t: LeadDetailsTab) => void }) {
  const btn = (on: boolean) =>
    [
      'inline-flex items-center gap-2 border-b-2 px-2 py-3 text-[12px] font-medium',
      on ? 'border-[#8B7355] text-[#2E2E2E]' : 'border-transparent text-[#8B7355] hover:text-[#8B7355]',
    ].join(' ')

  return (
    <div className="mt-2 border-b border-[#8B7355]/10">
      <div className="flex items-center gap-6">
        <button type="button" className={btn(active === 'overview')} onClick={() => onChange('overview')}>
          <FiGrid className="text-[#8B7355]" size={14} aria-hidden /> Overview
        </button>
        <button type="button" className={btn(active === 'activity')} onClick={() => onChange('activity')}>
          <FiClock className="text-[#8B7355]" size={14} aria-hidden /> Activity
        </button>
        {/* <button type="button" className={btn(active === 'opportunities')} onClick={() => onChange('opportunities')}>
          <span className="text-[#8B7355]">⎘</span> Opportunities
        </button>
        <button type="button" className={btn(active === 'documents')} onClick={() => onChange('documents')}>
          <span className="text-[#8B7355]">▤</span> Documents
        </button> */}
      </div>
    </div>
  )
}



function Pill({ tone, children }: { tone: 'rose' | 'sand'; children: React.ReactNode }) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold leading-none'
  const cls = tone === 'rose' ? 'bg-rose-100 text-[#D96B6B]' : 'bg-[rgba(139,115,85,0.16)] text-[#7a5b3f]'
  return <span className={`${base} ${cls}`}>{children}</span>
}

function ActionBtn({
  tone,
  icon,
  label,
  onClick,
}: {
  tone: 'call' | 'wa' | 'outline'
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  const base = 'inline-flex h-9 w-[128px] items-center justify-center gap-2 rounded-xl px-4 text-[11px] font-semibold'
  const cls =
    tone === 'call'
      ? 'bg-[#8B7355] text-white shadow-sm hover:bg-[#6d5a43]'
      : tone === 'wa'
        ? 'bg-[#5aa37f] text-white shadow-sm hover:bg-[#4d936f]'
        : 'border border-[#E8DCCB] bg-white text-[#2E2E2E] hover:bg-[#F5EFE7]'

  return (
    <button type="button" className={`${base} ${cls}`} onClick={onClick}>
      <span className={tone === 'outline' ? 'text-[#8B7355]' : 'text-white/90'}>{icon}</span>
      {label}
    </button>
  )
}

export function LeadDetails({ leadId }: { leadId: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const fromCampaign = (location.state as { fromCampaign?: { id: string; title: string } } | null)?.fromCampaign
  const [lead, setLead] = useState<LeadDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<LeadDetailsTab>('overview')
  const activityTopRef = useRef<HTMLDivElement | null>(null)
  const [notes, setNotes] = useState<string[]>([
    'Looking for immediate possession. Interested in premium projects.',
  ])
  const [noteDraft, setNoteDraft] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [buyingStage, setBuyingStage] = useState<(typeof BUYING_STAGE_OPTIONS)[number]>('SEARCHING')
  const [savingStage, setSavingStage] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchCaptureLeadById(leadId)
      .then((d) => {
        if (cancelled) return
        setLead(toLeadDetailsRow(d))
        const stageRaw = (d.propertyBuyingStage ?? '').trim().toUpperCase()
        const stage = BUYING_STAGE_OPTIONS.find((s) => s === stageRaw) ?? 'SEARCHING'
        setBuyingStage(stage)
      })
      .catch(() => {
        if (!cancelled) setLead(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [leadId])

  const handleUpdateBuyingStage = async () => {
    setSavingStage(true)
    try {
      await patchCaptureLead(leadId, { propertyBuyingStage: buyingStage })
      window.alert('Buying stage updated')
    } catch {
      window.alert('Failed to update buying stage')
    } finally {
      setSavingStage(false)
    }
  }

  const title = useMemo(() => lead?.name || 'Lead Details', [lead])

  return (
    <section className="w-full">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-1 py-2 text-[12px] font-medium text-[#8B7355] hover:text-[#2E2E2E]"
        onClick={() => {
          if (fromCampaign?.id) {
            navigate(`/campaign/${fromCampaign.id}`, {
              state: { title: fromCampaign.title },
            })
            return
          }
          navigate('/leads')
        }}
      >
        <FiChevronLeft size={16} aria-hidden />
        {fromCampaign ? 'Back to Campaign Details' : 'Back to Leads'}
      </button>

      <section className="mt-3 px-1">
        {loading ? (
          <p className="m-0 px-1 py-7 text-[13px] text-[#8B7355]">Loading lead…</p>
        ) : !lead ? (
          <p className="m-0 px-1 py-7 text-[13px] text-[#8B7355]">Lead not found.</p>
        ) : (
          <div>
            <section className="rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] px-8 py-7 ">
              <div className="flex flex-col gap-6 min-[980px]:flex-row min-[980px]:items-start min-[980px]:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-[22px] font-bold tracking-[-0.03em] text-[#2E2E2E]">{title}</div>
                    <Pill tone="rose">{lead.score} Lead</Pill>
                    <Pill tone="sand">{lead.status}</Pill>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-y-2 text-[12px] text-[#8B7355] min-[820px]:grid-cols-2 min-[820px]:gap-x-10">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-[#8B7355]">
                        <FiPhone size={16} aria-hidden />
                      </span>
                      <span className="font-medium">{lead.contact || '—'}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <span className="text-[#8B7355]">
                        <FiMail size={16} aria-hidden />
                      </span>
                      <span className="font-medium">{lead.email || '—'}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <span className="text-[#8B7355]">
                        <FiMapPin size={16} aria-hidden />
                      </span>
                      <span className="font-medium">{lead.locationLabel || '—'}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <FiGrid className="text-[#8B7355]" size={16} aria-hidden />
                      <span className="font-medium">Source: {lead.source || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 min-[980px]:items-end">
                  <ActionBtn
                    tone="call"
                    icon={<FiPhone size={14} aria-hidden />}
                    label="Call"
                    onClick={() => window.alert(`Call (dummy): ${lead.contact}`)}
                  />
                  <ActionBtn
                    tone="wa"
                    icon={<FiMessageSquare size={14} aria-hidden />}
                    label="WhatsApp"
                    onClick={() => window.alert(`WhatsApp (dummy): ${lead.contact}`)}
                  />
                  <ActionBtn
                    tone="outline"
                    icon={<FiMail size={14} aria-hidden />}
                    label="Email"
                    onClick={() => window.alert(`Email (dummy): ${lead.email}`)}
                  />
                  <ActionBtn
                    tone="outline"
                    icon={<FiCalendar size={14} aria-hidden />}
                    label="Schedule Visit"
                    onClick={() => {
                      setScheduleOpen(true)
                    }}
                  />
                </div>
              </div>
            </section>

            <ScheduleVisitModal
              open={scheduleOpen}
              leadId={leadId}
              leadAssignee={lead?.assignedTo}
              onClose={() => setScheduleOpen(false)}
              onScheduled={() => {
                navigate('/site-visits')
              }}
            />

            


            <LeadTabs active={tab} onChange={setTab} />

            {tab === 'overview' ? (
              <div className="mt-6 grid grid-cols-1 gap-6 min-[980px]:grid-cols-[1fr_360px]">
                <div className="flex flex-col gap-6">
                  <section className="rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                    <div className="text-[16px] font-semibold text-[#2E2E2E]">Requirements</div>
                    <div className="mt-4 grid grid-cols-1 gap-y-4 text-[12px] min-[760px]:grid-cols-2 min-[760px]:gap-x-16">
                      <div>
                        <div className="text-[11px] font-medium text-[#8B7355]">Budget</div>
                        <div className="mt-1 font-semibold text-[#2E2E2E]">{lead.budgetLabel || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-[#8B7355]">BHK Preference</div>
                        <div className="mt-1 font-semibold text-[#2E2E2E]">{lead.bhkLabel || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-[#8B7355]">Location</div>
                        <div className="mt-1 font-semibold text-[#2E2E2E]">{lead.locationLabel || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-[#8B7355]">Assigned To</div>
                        <div className="mt-1 font-semibold text-[#2E2E2E]">{lead.assignedTo || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-[#8B7355]">Property Buying Stage</div>
                        <div className="mt-1 flex items-center gap-2">
                          <select
                            value={buyingStage}
                            onChange={(e) => setBuyingStage(e.target.value as (typeof BUYING_STAGE_OPTIONS)[number])}
                            className="h-9 min-w-[180px] rounded-lg border border-[#E8DCCB] bg-white px-3 text-[12px] font-semibold text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none"
                            disabled={savingStage}
                          >
                            {BUYING_STAGE_OPTIONS.map((stage) => (
                              <option key={stage} value={stage}>
                                {stage}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="inline-flex h-9 items-center justify-center rounded-lg bg-[#8B7355] px-3 text-[11px] font-semibold text-white hover:bg-[#6d5a43] disabled:opacity-60"
                            disabled={savingStage}
                            onClick={handleUpdateBuyingStage}
                          >
                            {savingStage ? 'Saving…' : 'Update'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                    <div className="text-[16px] font-semibold text-[#2E2E2E]">Notes</div>

                    <div className="mt-4 flex flex-col gap-3">
                      {notes.slice(0, 2).map((n, idx) => (
                        <div key={idx} className="rounded-xl bg-[#F5EFE7] px-4 py-3 text-[12px] text-[#2E2E2E]">
                          {n}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <input
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add a new note..."
                        className="h-11 flex-1 rounded-xl border border-[#E8DCCB] bg-white px-4 text-[12px] text-[#2E2E2E] placeholder:text-[#8B7355] focus:border-[#8B7355] focus:outline-none"
                      />
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B7355] text-[18px] font-semibold text-white shadow-sm hover:bg-[#6d5a43] disabled:opacity-60"
                        disabled={!noteDraft.trim()}
                        onClick={() => {
                          const v = noteDraft.trim()
                          if (!v) return
                          setNotes((prev) => [v, ...prev])
                          setNoteDraft('')
                        }}
                        aria-label="Add note"
                      >
                        +
                      </button>
                    </div>
                  </section>
                </div>

                <div className="flex flex-col gap-6">
                  <section className="rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[16px] font-semibold text-[#2E2E2E]">Timeline</div>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E8DCCB] bg-white px-3 text-[11px] font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7]"
                        onClick={() => {
                          setTab('activity')
                          requestAnimationFrame(() => {
                            activityTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            window.setTimeout(() => window.scrollBy({ top: -72, left: 0, behavior: 'smooth' }), 50)
                          })
                        }}
                      >
                        View more
                      </button>
                    </div>
                    <div className="mt-4 flex flex-col gap-4 text-[12px] text-[#2E2E2E]">
                      <div className="flex items-start gap-3">
                        <IconDot tone="mint" />
                        <div>
                          <div className="font-medium text-[#2E2E2E]">Lead Created</div>
                          <div className="mt-0.5 text-[11px] text-[#8B7355]">{fmtLongDateTime(lead.createdAtISO)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <IconDot tone="sand" />
                        <div>
                          <div className="font-medium text-[#2E2E2E]">Last Contact</div>
                          <div className="mt-0.5 text-[11px] text-[#8B7355]">{fmtLongDateTime(lead.lastContactAtISO)}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                    <div className="text-[16px] font-semibold text-[#2E2E2E]">Interested Projects</div>
                    <div className="mt-4 flex flex-col gap-3">
                      {['Prestige Lakeside Habitat', 'Brigade Eldorado'].map((p) => (
                        <div key={p} className="rounded-xl bg-[#F5EFE7] px-4 py-3 text-[12px] font-medium text-[#2E2E2E]">
                          {p}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            ) : tab === 'activity' ? (
              <section className="mt-6 rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                <div ref={activityTopRef} />
                <div className="text-[16px] font-semibold text-[#2E2E2E]">Activity History</div>

                <div className="mt-4 divide-y divide-gray-900/5 rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF]">
                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6FAF8F]/20 text-[#6FAF8F]">
                      <FiPhone size={16} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-[#2E2E2E]">Call Connected</div>
                      <div className="mt-1 text-[11px] text-[#8B7355]">Duration: 5m 32s</div>
                      <div className="mt-1 text-[10.5px] text-[#8B7355]">{fmtLongDateTime(lead.lastContactAtISO)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF7F2] text-[#8B7355]">
                      <FiMail size={16} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-[#2E2E2E]">Email Sent</div>
                      <div className="mt-1 text-[11px] text-[#8B7355]">Property brochures shared</div>
                      <div className="mt-1 text-[10.5px] text-[#8B7355]">{fmtLongDateTime(lead.createdAtISO)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5EFE7] text-[#8B7355]">
                      <FiArrowUpRight size={14} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-[#2E2E2E]">Lead Created</div>
                      <div className="mt-1 text-[11px] text-[#8B7355]">Source: {lead.source || '—'}</div>
                      <div className="mt-1 text-[10.5px] text-[#8B7355]">{fmtLongDateTime(lead.createdAtISO)}</div>
                    </div>
                  </div>
                </div>
              </section>
            ) 
            // : tab === 'opportunities' ? (
            //   <section className="mt-6 rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
            //     <div className="text-[16px] font-semibold text-[#2E2E2E]">Matched Properties</div>
            //     <div className="mt-4 grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
            //       {matched.map((p) => (
            //         <PropertyCard key={p.id} p={p} />
            //       ))}
            //     </div>
            //   </section>
            // ) : tab === 'documents' ? (
            //   <section className="mt-6 rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
            //     <div className="text-[16px] font-semibold text-[#2E2E2E]">Documents</div>

            //     <div className="flex min-h-[220px] flex-col items-center justify-center py-10 text-center">
            //       <IconDocument />
            //       <div className="mt-4 text-[12px] font-medium text-[#8B7355]">No documents uploaded yet</div>
            //       <button
            //         type="button"
            //         className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-[#E8DCCB] bg-white px-5 text-[12px] font-medium text-[#2E2E2E] hover:bg-[#F5EFE7]"
            //         onClick={() => window.alert('Upload Document (dummy)')}
            //       >
            //         Upload Document
            //       </button>
            //     </div>
            //   </section>
            // ) 
            : (
              <div className="mt-6 rounded-xl border border-[#8B7355]/10 bg-[#FFFFFF] p-6 text-[13px] text-[#8B7355] shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                Coming soon.
              </div>
            )}
          </div>
        )}
      </section>

    </section>
  )
}

