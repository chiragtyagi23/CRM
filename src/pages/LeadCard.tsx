import type { ReactNode } from 'react'
import type { LeadDTO, LeadScoreDTO, LeadStatusDTO } from '../lib/dashboardDummyApi'
import { FiCalendar, FiEye, FiMail, FiMessageSquare, FiPhone } from 'react-icons/fi'

function BadgeSelect({
  id,
  value,
  onChange,
  badgeClassName,
  children,
}: {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  badgeClassName: string
  children: ReactNode
}) {
  return (
    <span className="relative inline-flex min-w-0">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`w-full min-w-0 cursor-pointer appearance-none rounded-full border-0 py-1 pl-3 pr-9 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8B7355]/40 ${badgeClassName}`}
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[#8B7355]"
        aria-hidden
      >
        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M2.5 4.25L6 7.75L9.5 4.25"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </span>
  )
}

function getScoreBadgeColor(score: LeadScoreDTO) {
  switch (score) {
    case 'Hot':
      return 'bg-[#D96B6B]/20 text-[#D96B6B]'
    case 'Warm':
      return 'bg-[#E8DCCB] text-[#8B7355]'
    case 'Cold':
      return 'bg-[#F5EFE7] text-[#8B7355]'
    default:
      return 'bg-[#E8DCCB] text-[#8B7355]'
  }
}

function getStatusBadgeColor(status: string) {
  if (status === 'Closed Won') return 'bg-[#6FAF8F]/20 text-[#6FAF8F]'
  if (status === 'Closed Lost') return 'bg-[#D96B6B]/20 text-[#D96B6B]'
  return 'bg-[#E8DCCB] text-[#8B7355]'
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function digitsForWhatsApp(contact: string) {
  return String(contact ?? '').replace(/\D/g, '')
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
  const telHref = lead.contact?.trim() ? `tel:${lead.contact.replace(/\s/g, '')}` : undefined
  const waDigits = digitsForWhatsApp(lead.contact)
  const waHref = waDigits.length >= 10 ? `https://wa.me/${waDigits}` : undefined

  return (
    <article className="rounded-xl border border-[#8B7355]/10 bg-white p-6 transition-all hover:shadow-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 text-lg font-semibold text-[#2E2E2E]">{lead.name}</h3>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#8B7355]">
                <span className="inline-flex items-center gap-1">
                  <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                  {lead.contact || '—'}
                </span>
                <span className="text-[#E8DCCB]">•</span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <FiMail className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{lead.email || '—'}</span>
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`lead-score-${lead.id}`}>
                Lead score
              </label>
              <BadgeSelect
                id={`lead-score-${lead.id}`}
                value={lead.score}
                onChange={(e) => onChangeScore?.(e.target.value as LeadScoreDTO)}
                badgeClassName={getScoreBadgeColor(lead.score)}
              >
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </BadgeSelect>
              <label className="sr-only" htmlFor={`lead-status-${lead.id}`}>
                Lead status
              </label>
              <BadgeSelect
                id={`lead-status-${lead.id}`}
                value={lead.status}
                onChange={(e) => onChangeStatus?.(e.target.value as LeadStatusDTO)}
                badgeClassName={getStatusBadgeColor(lead.status)}
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Qualified">Qualified</option>
                <option value="Opportunity">Opportunity</option>
                <option value="Site Visit">Site Visit</option>
              </BadgeSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="mb-0.5 text-[#8B7355]">Budget</p>
              <p className="font-medium text-[#2E2E2E]">{lead.budgetLabel?.trim() || 'Not specified'}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[#8B7355]">BHK</p>
              <p className="font-medium text-[#2E2E2E]">{lead.bhkLabel?.trim() || 'Not specified'}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[#8B7355]">Location</p>
              <p className="font-medium text-[#2E2E2E]">{lead.locationLabel?.trim() || 'Not specified'}</p>
            </div>
            <div>
              <p className="mb-0.5 text-[#8B7355]">Source</p>
              <p className="font-medium text-[#2E2E2E]">{lead.source || 'Not specified'}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#8B7355]">
            <span className="inline-flex items-center gap-1">
              <FiCalendar className="h-3 w-3 shrink-0" aria-hidden />
              Created {formatRelativeDate(lead.createdAtISO)}
            </span>
            <span>•</span>
            <span>Last contact {formatRelativeDate(lead.lastContactAtISO)}</span>
            <span>•</span>
            {canEditAssignee ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span>Assigned to</span>
                <select
                  value={lead.assignedTo === '—' ? '' : lead.assignedTo}
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
              </span>
            ) : (
              <span>Assigned to {lead.assignedTo}</span>
            )}
            {lead.repeatCustomer ? (
              <>
                <span>•</span>
                <span className="font-medium text-[#6FAF8F]">Repeat Customer</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:flex-col">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#8B7355] px-4 py-2 text-sm text-white transition-colors hover:bg-[#6d5a43] lg:flex-none"
            onClick={() => onViewDetails(lead)}
          >
            <FiEye className="h-4 w-4 shrink-0" aria-hidden />
            View Details
          </button>
          {telHref ? (
            <a
              href={telHref}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#8B7355] px-4 py-2 text-sm text-[#8B7355] transition-colors hover:bg-[#F5EFE7] lg:flex-none no-underline"
            >
              <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
              Call
            </a>
          ) : (
            <span className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#E8DCCB] px-4 py-2 text-sm text-[#8B7355]/50 lg:flex-none">
              <FiPhone className="h-4 w-4" aria-hidden />
              Call
            </span>
          )}
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#6FAF8F] px-4 py-2 text-sm text-[#6FAF8F] transition-colors hover:bg-[#6FAF8F]/10 lg:flex-none no-underline"
            >
              <FiMessageSquare className="h-4 w-4 shrink-0" aria-hidden />
              WhatsApp
            </a>
          ) : (
            <span className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-[#E8DCCB] px-4 py-2 text-sm text-[#6FAF8F]/50 lg:flex-none">
              <FiMessageSquare className="h-4 w-4" aria-hidden />
              WhatsApp
            </span>
          )}
          {dirty ? (
            <button
              type="button"
              className="flex flex-1 items-center justify-center rounded-lg border border-[#E8DCCB] bg-[#F5EFE7] px-4 py-2 text-sm font-semibold text-[#8B7355] transition-colors hover:bg-[#ede4d8] lg:flex-none"
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
