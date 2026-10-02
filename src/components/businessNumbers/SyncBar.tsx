import { FiRefreshCw } from 'react-icons/fi'

import { d } from '../../lib/designClasses'
import type { SyncStatus } from '../../lib/businessNumbersApi'
import { fmtAgo } from './useUsageSync'

/**
 * Freshness + progress for call/SMS/SIP data. Everyone sees when it was last updated; managers get
 * a Refresh button. While a refresh runs the page stays usable and reloads itself when it's done.
 */
export function SyncBar({
  status,
  starting,
  message,
  canRefresh,
  onRefresh,
  what = 'Activity',
}: {
  status: SyncStatus | null
  starting: boolean
  message: string | null
  canRefresh: boolean
  onRefresh: () => void
  what?: string
}) {
  const running = Boolean(status?.running)
  const pct = status && status.windowsTotal ? Math.round((status.windowsDone / status.windowsTotal) * 100) : 0

  return (
    <div className="rounded-xl border border-[#8B7355]/10 bg-white px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
          {running ? (
            <>
              <FiRefreshCw size={14} className="shrink-0 animate-spin text-[#8B7355]" aria-hidden />
              <span className="text-[#2E2E2E]">
                Refreshing {what.toLowerCase()}…{' '}
                <span className="text-[#8B7355]">
                  {status?.windowsTotal && status.windowsTotal > 1 ? `period ${Math.min(status.windowsDone + 1, status.windowsTotal)} of ${status.windowsTotal}` : 'almost there'}
                  {status?.stored ? ` · ${status.stored} new` : ''}
                </span>
              </span>
            </>
          ) : (
            <span className="text-[#8B7355]">
              {what} updated <strong className="font-medium text-[#2E2E2E]">{fmtAgo(status?.lastSyncedAt ?? null)}</strong>
              <span className="hidden sm:inline"> · refreshes automatically every few hours</span>
            </span>
          )}
        </div>
        {canRefresh ? (
          <button type="button" className={d.btnSecondarySm} onClick={onRefresh} disabled={running || starting || !status?.available}>
            <FiRefreshCw size={14} className={starting ? 'animate-spin' : ''} aria-hidden />
            {running ? 'Refreshing…' : 'Refresh now'}
          </button>
        ) : null}
      </div>
      {running ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F5EFE7]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-[#8B7355] transition-all duration-500" style={{ width: `${Math.max(pct, 6)}%` }} />
        </div>
      ) : null}
      {!running && status?.error ? <p className="mt-2 text-xs text-[#D96B6B]">Last refresh failed: {status.error}</p> : null}
      {message ? <p className="mt-2 text-xs text-[#8B7355]">{message}</p> : null}
    </div>
  )
}
