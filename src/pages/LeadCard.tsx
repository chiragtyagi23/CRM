import type { LeadDTO, LeadScoreDTO, LeadStatusDTO } from '../lib/dashboardDummyApi'

function IconPhone({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M5.45 2.25h2.05c.38 0 .7.27.76.64l.38 2.3c.06.37-.16.73-.52.84l-1.56.5c.37.87.98 1.82 1.76 2.6.78.78 1.73 1.39 2.6 1.76l.5-1.56c.11-.36.47-.58.84-.52l2.3.38c.37.06.64.38.64.76v2.05c0 .42-.32.76-.74.8-1.2.1-3.64-.02-6.22-2.6-2.58-2.58-2.7-5.02-2.6-6.22.04-.42.38-.74.8-.74z"
      />
    </svg>
  )
}

function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M3.5 4h11A1.5 1.5 0 0 1 16 5.5v7A1.5 1.5 0 0 1 14.5 14h-11A1.5 1.5 0 0 1 2 12.5v-7A1.5 1.5 0 0 1 3.5 4zm.4 1.5 5.1 3.6 5.1-3.6H3.9zm10.6 1.8-4.99 3.52a.9.9 0 0 1-1.02 0L3.5 7.3v5.2c0 .28.22.5.5.5h10c.28 0 .5-.22.5-.5V7.3z"
      />
    </svg>
  )
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="currentColor"
        d="M9 4c3.7 0 6.82 2.17 8.3 5.26a1 1 0 0 1 0 .88C15.82 13.83 12.7 16 9 16s-6.82-2.17-8.3-5.26a1 1 0 0 1 0-.88C2.18 6.17 5.3 4 9 4zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.1a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8z"
      />
    </svg>
  )
}

function fmtShortDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

export function LeadCard({
  lead,
  onViewDetails,
  onChangeScore,
  onChangeStatus,
  canEditAssignee,
  assigneeOptions,
  onChangeAssignee,
  dirty,
  onUpdate,
}: {
  lead: LeadDTO
  onViewDetails: (lead: LeadDTO) => void
  onChangeScore?: (score: LeadScoreDTO) => void
  onChangeStatus?: (status: LeadStatusDTO) => void
  canEditAssignee?: boolean
  assigneeOptions?: string[]
  onChangeAssignee?: (assignee: string) => void
  dirty?: boolean
  onUpdate?: () => void
}) {
  return (
    <article className="rounded-2xl border border-gray-900/5 bg-white px-6 py-5 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
      <div className="flex flex-col gap-4 min-[920px]:flex-row min-[920px]:items-start min-[920px]:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-[16px] font-semibold text-gray-900">{lead.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-gray-500">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <IconPhone className="text-gray-400" />
                  <span className="font-medium text-gray-600">{lead.contact || '—'}</span>
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <IconMail className="text-gray-400" />
                  <span className="min-w-0 truncate font-medium text-gray-600">{lead.email || '—'}</span>
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <label className="sr-only" htmlFor={`lead-score-${lead.id}`}>
                Lead score
              </label>
              <select
                id={`lead-score-${lead.id}`}
                value={lead.score}
                onChange={(e) => onChangeScore?.(e.target.value as LeadScoreDTO)}
                className={[
                  'h-8 rounded-full border px-2.5 text-[11px] font-semibold',
                  lead.score === 'Hot'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : lead.score === 'Cold'
                      ? 'border-slate-200 bg-slate-50 text-slate-700'
                      : 'border-[rgba(157,122,86,0.22)] bg-[rgba(157,122,86,0.10)] text-[#7a5b3f]',
                ].join(' ')}
              >
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>

              <label className="sr-only" htmlFor={`lead-status-${lead.id}`}>
                Lead status
              </label>
              <select
                id={`lead-status-${lead.id}`}
                value={lead.status}
                onChange={(e) => onChangeStatus?.(e.target.value as LeadStatusDTO)}
                className={[
                  'h-8 rounded-full border px-2.5 text-[11px] font-semibold',
                  lead.status === 'New' ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-gray-200 bg-white text-gray-800',
                ].join(' ')}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Opportunity">Opportunity</option>
                <option value="Site Visit">Site Visit</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-12 gap-y-3 min-[760px]:grid-cols-4">
            <div>
              <div className="text-[11px] text-gray-400">Budget</div>
              <div className="mt-0.5 text-[12px] font-semibold text-gray-900">{lead.budgetLabel || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">BHK</div>
              <div className="mt-0.5 text-[12px] font-semibold text-gray-900">{lead.bhkLabel || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Location</div>
              <div className="mt-0.5 text-[12px] font-semibold text-gray-900">{lead.locationLabel || '—'}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Source</div>
              <div className="mt-0.5 text-[12px] font-semibold text-gray-900">{lead.source || '—'}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            <span>Created {fmtShortDate(lead.createdAtISO)}</span>
            <span className="text-gray-300">·</span>
            <span>Last contact {fmtShortDate(lead.lastContactAtISO)}</span>
            <span className="text-gray-300">·</span>
            {canEditAssignee ? (
              <span className="inline-flex items-center gap-2">
                <span>Assigned to</span>
                <select
                  value={lead.assignedTo === '—' ? '' : lead.assignedTo}
                  onChange={(e) => onChangeAssignee?.(e.target.value)}
                  className="h-7 rounded-xl border border-gray-200 bg-white px-2 text-[11px] font-semibold text-gray-700"
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
              </span>
            ) : (
              <span>Assigned to {lead.assignedTo}</span>
            )}
            {lead.repeatCustomer ? (
              <>
                <span className="text-gray-300">·</span>
                <span className="font-semibold text-emerald-700">Repeat Customer</span>
              </>
            ) : null}
          </div>

          {/* <div className="mt-2 text-[11px] text-gray-500">
            <span className="text-gray-400">Sentiment:</span>{' '}
            <span className="font-semibold text-emerald-700">{lead.sentiment}</span>{' '}
            <span className="text-gray-300">·</span>{' '}
            <span className="text-gray-400">Timeline:</span> {lead.timelineLabel}
          </div> */}
        </div>

        <div className="flex shrink-0 flex-col gap-2 min-[920px]:items-end">
          <button
            type="button"
            className="inline-flex h-9 w-[132px] items-center justify-center gap-2 rounded-xl bg-[#80654a] px-4 text-[11px] font-semibold text-white shadow-sm hover:bg-[#725940]"
            onClick={() => onViewDetails(lead)}
          >
            <IconEye className="text-white/90" />
            View Details
          </button>

          {dirty ? (
            <button
              type="button"
              className="inline-flex h-9 w-[132px] items-center justify-center rounded-xl border border-[#cdb89f] bg-[#faf6ef] px-4 text-[11px] font-semibold text-[#80654a] hover:bg-[#f3ede3]"
              onClick={() => onUpdate?.()}
            >
              Update
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

