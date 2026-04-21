import { useEffect, useMemo, useRef, useState } from 'react'

import {
  type LeadDTO,
} from '../lib/dashboardDummyApi'
import { fetchCaptureLeadById } from '../lib/captureLeadsApi'
import { ScheduleVisitModal } from '../components/ScheduleVisitModal'
import { fmtLongDateTime } from '../utils/format'
import { toLeadDetailsRow } from '../utils/leadMapping'

function IconChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M10.9 3.4a.75.75 0 0 1 0 1.06L6.86 8.5H15a.75.75 0 0 1 0 1.5H6.86l4.04 4.04a.75.75 0 0 1-1.06 1.06l-5.32-5.32a.75.75 0 0 1 0-1.06l5.32-5.32a.75.75 0 0 1 1.06 0z"
      />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M5.45 2.25h2.05c.38 0 .7.27.76.64l.38 2.3c.06.37-.16.73-.52.84l-1.56.5c.37.87.98 1.82 1.76 2.6.78.78 1.73 1.39 2.6 1.76l.5-1.56c.11-.36.47-.58.84-.52l2.3.38c.37.06.64.38.64.76v2.05c0 .42-.32.76-.74.8-1.2.1-3.64-.02-6.22-2.6-2.58-2.58-2.7-5.02-2.6-6.22.04-.42.38-.74.8-.74z"
      />
    </svg>
  )
}

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M3.5 4h11A1.5 1.5 0 0 1 16 5.5v7A1.5 1.5 0 0 1 14.5 14h-11A1.5 1.5 0 0 1 2 12.5v-7A1.5 1.5 0 0 1 3.5 4zm.4 1.5 5.1 3.6 5.1-3.6H3.9zm10.6 1.8-4.99 3.52a.9.9 0 0 1-1.02 0L3.5 7.3v5.2c0 .28.22.5.5.5h10c.28 0 .5-.22.5-.5V7.3z"
      />
    </svg>
  )
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 2.25a4.25 4.25 0 0 0-4.25 4.15c0 3.2 3.5 7.85 4.25 8.85.75-1 4.25-5.65 4.25-8.85A4.25 4.25 0 0 0 9 2.25zm0 5.5a1.35 1.35 0 1 1 0-2.7 1.35 1.35 0 0 1 0 2.7z"
      />
    </svg>
  )
}

function IconDot({ tone }: { tone: 'mint' | 'sand' }) {
  const cls = tone === 'mint' ? 'bg-emerald-500' : 'bg-[#80654a]'
  return <span className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${cls}`} />
}

type LeadDetailsTab = 'overview' | 'activity' 
// | 'opportunities' | 'documents'

function LeadTabs({ active, onChange }: { active: LeadDetailsTab; onChange: (t: LeadDetailsTab) => void }) {
  const btn = (on: boolean) =>
    [
      'inline-flex items-center gap-2 border-b-2 px-2 py-3 text-[12px] font-medium',
      on ? 'border-[#80654a] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600',
    ].join(' ')

  return (
    <div className="mt-2 border-b border-gray-900/10">
      <div className="flex items-center gap-6">
        <button type="button" className={btn(active === 'overview')} onClick={() => onChange('overview')}>
          <span className="text-gray-400">◎</span> Overview
        </button>
        <button type="button" className={btn(active === 'activity')} onClick={() => onChange('activity')}>
          <span className="text-gray-400">◷</span> Activity
        </button>
        {/* <button type="button" className={btn(active === 'opportunities')} onClick={() => onChange('opportunities')}>
          <span className="text-gray-400">⎘</span> Opportunities
        </button>
        <button type="button" className={btn(active === 'documents')} onClick={() => onChange('documents')}>
          <span className="text-gray-400">▤</span> Documents
        </button> */}
      </div>
    </div>
  )
}



function Pill({ tone, children }: { tone: 'rose' | 'sand'; children: React.ReactNode }) {
  const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-semibold leading-none'
  const cls = tone === 'rose' ? 'bg-rose-100 text-rose-700' : 'bg-[rgba(157,122,86,0.16)] text-[#7a5b3f]'
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
      ? 'bg-[#80654a] text-white shadow-sm hover:bg-[#725940]'
      : tone === 'wa'
        ? 'bg-[#5aa37f] text-white shadow-sm hover:bg-[#4d936f]'
        : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'

  return (
    <button type="button" className={`${base} ${cls}`} onClick={onClick}>
      <span className={tone === 'outline' ? 'text-gray-500' : 'text-white/90'}>{icon}</span>
      {label}
    </button>
  )
}

export function LeadDetails({ leadId }: { leadId: string }) {
  const [lead, setLead] = useState<LeadDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<LeadDetailsTab>('overview')
  const activityTopRef = useRef<HTMLDivElement | null>(null)
  const [notes, setNotes] = useState<string[]>([
    'Looking for immediate possession. Interested in premium projects.',
  ])
  const [noteDraft, setNoteDraft] = useState('')
  const [scheduleOpen, setScheduleOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchCaptureLeadById(leadId)
      .then((d) => {
        if (!cancelled) setLead(toLeadDetailsRow(d))
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

  const title = useMemo(() => lead?.name || 'Lead Details', [lead])

  return (
    <section className="mx-auto box-border w-full max-w-[1280px]">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-1 py-2 text-[12px] font-medium text-gray-500 hover:text-gray-700"
        onClick={() => {
          window.location.hash = '#leads'
        }}
      >
        <IconChevronLeft />
        Back to Leads
      </button>

      <section className="mt-3 px-1">
        {loading ? (
          <p className="m-0 px-1 py-7 text-[13px] text-gray-400">Loading lead…</p>
        ) : !lead ? (
          <p className="m-0 px-1 py-7 text-[13px] text-gray-500">Lead not found.</p>
        ) : (
          <div>
            <section className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] px-8 py-7 shadow-[0_10px_24px_rgba(17,24,39,0.06)]">
              <div className="flex flex-col gap-6 min-[980px]:flex-row min-[980px]:items-start min-[980px]:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-[22px] font-bold tracking-[-0.03em] text-gray-900">{title}</div>
                    <Pill tone="rose">{lead.score} Lead</Pill>
                    <Pill tone="sand">{lead.status}</Pill>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-y-2 text-[12px] text-gray-600 min-[820px]:grid-cols-2 min-[820px]:gap-x-10">
                    <div className="inline-flex items-center gap-2">
                      <span className="text-gray-400">
                        <IconPhone />
                      </span>
                      <span className="font-medium">{lead.contact || '—'}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <span className="text-gray-400">
                        <IconMail />
                      </span>
                      <span className="font-medium">{lead.email || '—'}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <span className="text-gray-400">
                        <IconPin />
                      </span>
                      <span className="font-medium">{lead.locationLabel || '—'}</span>
                    </div>
                    <div className="inline-flex items-center gap-2">
                      <span className="text-gray-400">▦</span>
                      <span className="font-medium">Source: {lead.source || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 min-[980px]:items-end">
                  <ActionBtn
                    tone="call"
                    icon={<IconPhone />}
                    label="Call"
                    onClick={() => window.alert(`Call (dummy): ${lead.contact}`)}
                  />
                  <ActionBtn
                    tone="wa"
                    icon={<span className="text-[12px] font-bold">W</span>}
                    label="WhatsApp"
                    onClick={() => window.alert(`WhatsApp (dummy): ${lead.contact}`)}
                  />
                  <ActionBtn
                    tone="outline"
                    icon={<IconMail />}
                    label="Email"
                    onClick={() => window.alert(`Email (dummy): ${lead.email}`)}
                  />
                  <ActionBtn
                    tone="outline"
                    icon={<span className="text-[12px] font-bold">◎</span>}
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
              onClose={() => setScheduleOpen(false)}
              onScheduled={() => {
                window.location.hash = '#site-visits'
              }}
            />

            


            <LeadTabs active={tab} onChange={setTab} />

            {tab === 'overview' ? (
              <div className="mt-6 grid grid-cols-1 gap-6 min-[980px]:grid-cols-[1fr_360px]">
                <div className="flex flex-col gap-6">
                  <section className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                    <div className="text-[16px] font-semibold text-gray-900">Requirements</div>
                    <div className="mt-4 grid grid-cols-1 gap-y-4 text-[12px] min-[760px]:grid-cols-2 min-[760px]:gap-x-16">
                      <div>
                        <div className="text-[11px] font-medium text-gray-400">Budget</div>
                        <div className="mt-1 font-semibold text-gray-900">{lead.budgetLabel || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-gray-400">BHK Preference</div>
                        <div className="mt-1 font-semibold text-gray-900">{lead.bhkLabel || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-gray-400">Location</div>
                        <div className="mt-1 font-semibold text-gray-900">{lead.locationLabel || '—'}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium text-gray-400">Assigned To</div>
                        <div className="mt-1 font-semibold text-gray-900">{lead.assignedTo || '—'}</div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                    <div className="text-[16px] font-semibold text-gray-900">Notes</div>

                    <div className="mt-4 flex flex-col gap-3">
                      {notes.slice(0, 2).map((n, idx) => (
                        <div key={idx} className="rounded-xl bg-[#faf6ef] px-4 py-3 text-[12px] text-gray-700">
                          {n}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <input
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add a new note..."
                        className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-[12px] text-gray-700 placeholder:text-gray-400 focus:border-[#cdb89f] focus:outline-none"
                      />
                      <button
                        type="button"
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#80654a] text-[18px] font-semibold text-white shadow-sm hover:bg-[#725940] disabled:opacity-60"
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
                  <section className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[16px] font-semibold text-gray-900">Timeline</div>
                      <button
                        type="button"
                        className="inline-flex h-8 items-center justify-center rounded-xl border border-gray-300 bg-white px-3 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
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
                    <div className="mt-4 flex flex-col gap-4 text-[12px] text-gray-700">
                      <div className="flex items-start gap-3">
                        <IconDot tone="mint" />
                        <div>
                          <div className="font-medium text-gray-900">Lead Created</div>
                          <div className="mt-0.5 text-[11px] text-gray-400">{fmtLongDateTime(lead.createdAtISO)}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <IconDot tone="sand" />
                        <div>
                          <div className="font-medium text-gray-900">Last Contact</div>
                          <div className="mt-0.5 text-[11px] text-gray-400">{fmtLongDateTime(lead.lastContactAtISO)}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                    <div className="text-[16px] font-semibold text-gray-900">Interested Projects</div>
                    <div className="mt-4 flex flex-col gap-3">
                      {['Prestige Lakeside Habitat', 'Brigade Eldorado'].map((p) => (
                        <div key={p} className="rounded-xl bg-[#faf6ef] px-4 py-3 text-[12px] font-medium text-gray-800">
                          {p}
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            ) : tab === 'activity' ? (
              <section className="mt-6 rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                <div ref={activityTopRef} />
                <div className="text-[16px] font-semibold text-gray-900">Activity History</div>

                <div className="mt-4 divide-y divide-gray-900/5 rounded-xl border border-gray-900/5 bg-[#FDFBF7]">
                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <IconPhone />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-gray-900">Call Connected</div>
                      <div className="mt-1 text-[11px] text-gray-500">Duration: 5m 32s</div>
                      <div className="mt-1 text-[10.5px] text-gray-400">{fmtLongDateTime(lead.lastContactAtISO)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6efe4] text-[#80654a]">
                      <IconMail />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-gray-900">Email Sent</div>
                      <div className="mt-1 text-[11px] text-gray-500">Property brochures shared</div>
                      <div className="mt-1 text-[10.5px] text-gray-400">{fmtLongDateTime(lead.createdAtISO)}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#faf6ef] text-[#80654a]">
                      <span className="text-[12px] font-bold">↗</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold text-gray-900">Lead Created</div>
                      <div className="mt-1 text-[11px] text-gray-500">Source: {lead.source || '—'}</div>
                      <div className="mt-1 text-[10.5px] text-gray-400">{fmtLongDateTime(lead.createdAtISO)}</div>
                    </div>
                  </div>
                </div>
              </section>
            ) 
            // : tab === 'opportunities' ? (
            //   <section className="mt-6 rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
            //     <div className="text-[16px] font-semibold text-gray-900">Matched Properties</div>
            //     <div className="mt-4 grid grid-cols-1 gap-6 min-[900px]:grid-cols-2">
            //       {matched.map((p) => (
            //         <PropertyCard key={p.id} p={p} />
            //       ))}
            //     </div>
            //   </section>
            // ) : tab === 'documents' ? (
            //   <section className="mt-6 rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
            //     <div className="text-[16px] font-semibold text-gray-900">Documents</div>

            //     <div className="flex min-h-[220px] flex-col items-center justify-center py-10 text-center">
            //       <IconDocument />
            //       <div className="mt-4 text-[12px] font-medium text-gray-500">No documents uploaded yet</div>
            //       <button
            //         type="button"
            //         className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
            //         onClick={() => window.alert('Upload Document (dummy)')}
            //       >
            //         Upload Document
            //       </button>
            //     </div>
            //   </section>
            // ) 
            : (
              <div className="mt-6 rounded-2xl border border-gray-900/5 bg-[#FDFBF7] p-6 text-[13px] text-gray-500 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                Coming soon.
              </div>
            )}
          </div>
        )}
      </section>

    </section>
  )
}

