import { useCallback, useEffect, useRef, useState } from 'react'

import { businessNumbersApi, type SyncStatus } from '../../lib/businessNumbersApi'
import { getApiErrorMessage } from '../../services/aclHttp'

const POLL_MS = 2000

/**
 * Background usage/log refresh. Loads the current status once, polls only while a sync is
 * running (manual or scheduled), and calls `onFinished` when a run completes so data can reload.
 */
export function useUsageSync(onFinished: (status: SyncStatus) => void) {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [starting, setStarting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const wasRunning = useRef(false)
  const finishedRef = useRef(onFinished)
  useEffect(() => {
    finishedRef.current = onFinished
  })

  const apply = useCallback((s: SyncStatus) => {
    if (wasRunning.current && !s.running) finishedRef.current(s)
    wasRunning.current = s.running
    setStatus(s)
  }, [])

  useEffect(() => {
    let cancelled = false
    businessNumbersApi
      .syncStatus()
      .then((s) => !cancelled && apply(s))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [apply])

  const running = Boolean(status?.running)
  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => {
      businessNumbersApi.syncStatus().then(apply).catch(() => {})
    }, POLL_MS)
    return () => window.clearInterval(t)
  }, [running, apply])

  const refresh = useCallback(async () => {
    setStarting(true)
    setMessage(null)
    try {
      const r = await businessNumbersApi.syncUsage()
      if (!r.started && r.reason === 'too_soon') setMessage('Already up to date — refreshed moments ago.')
      apply(r.status)
    } catch (err) {
      setMessage(getApiErrorMessage(err))
    } finally {
      setStarting(false)
    }
  }, [apply])

  return { status, starting, message, refresh }
}

/** "just now", "5 min ago", "3 h ago", "2 days ago". */
export function fmtAgo(iso: string | null) {
  if (!iso) return 'never'
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  const d = Math.floor(s / 86400)
  return `${d} day${d === 1 ? '' : 's'} ago`
}
