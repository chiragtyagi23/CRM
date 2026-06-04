import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiAlertCircle, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi'

import { useACL } from '../acl/useACL'
import { loadCaptureLeads } from '../store/captureLeadsSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { listOverdueCallbackLeads } from '../utils/callbackDue'

export function OverdueCallbackPanel() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { hasAccess, isLegacyFullAccess } = useACL()
  const { items, loading } = useAppSelector((s) => s.captureLeads)
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const canSeeLeads = isLegacyFullAccess || hasAccess('leads')

  useEffect(() => {
    if (!canSeeLeads) return
    dispatch(loadCaptureLeads())
    const onFocus = () => dispatch(loadCaptureLeads())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [canSeeLeads, dispatch])

  const overdue = useMemo(() => listOverdueCallbackLeads(items), [items])

  useEffect(() => {
    if (overdue.length > 0) setDismissed(false)
  }, [overdue.length])

  if (!canSeeLeads || dismissed || overdue.length === 0) return null

  return (
    <aside
      className="fixed bottom-4 right-4 z-[60] w-[min(100vw-2rem,340px)] overflow-hidden rounded-xl border border-[#D96B6B]/35 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
      aria-label="Overdue callback reminders"
    >
      <div className="flex items-center gap-2 border-b border-[#8B7355]/10 bg-[#F5EFE7] px-3 py-2.5">
        <FiAlertCircle className="shrink-0 text-[#D96B6B]" size={16} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-[#2E2E2E]">Callback overdue</div>
          <div className="text-[10px] text-[#8B7355]">
            {loading ? 'Updating…' : `${overdue.length} lead${overdue.length === 1 ? '' : 's'}`}
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#8B7355] hover:bg-white"
          aria-label={collapsed ? 'Expand list' : 'Collapse list'}
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </button>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#8B7355] hover:bg-white"
          aria-label="Dismiss reminders"
          onClick={() => setDismissed(true)}
        >
          <FiX size={16} />
        </button>
      </div>

      {!collapsed ? (
        <ul className="max-h-[280px] overflow-y-auto p-2">
          {overdue.map((lead) => (
            <li
              key={lead.id}
              className="mb-2 rounded-lg border border-[#8B7355]/10 bg-[#FAFAF8] p-3 last:mb-0"
            >
              <div className="text-[12px] font-semibold text-[#2E2E2E] truncate">{lead.name}</div>
              <div className="mt-0.5 text-[10px] text-[#8B7355] truncate">{lead.contact}</div>
              <div className="mt-1 text-[10px] font-medium text-[#D96B6B]">Due: {lead.callbackLabel}</div>
              <button
                type="button"
                className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg bg-[#8B7355] px-3 text-[11px] font-semibold text-white hover:bg-[#6d5a43]"
                onClick={() => navigate(`/leads/viewdetail/${lead.id}`)}
              >
                View Details
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  )
}
