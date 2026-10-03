import { useCallback, useEffect, useRef, useState } from 'react'

import { businessNumbersApi, type SyncStatus } from '../../lib/businessNumbersApi'
import { getApiErrorMessage } from '../../services/aclHttp'

/** Poll quickly right after something changes, then back off while a long period is still running. */
const POLL_MIN_MS = 5000
const POLL_MAX_MS = 15000
const POLL_BACKOFF = 1.5

/**
 * Background usage/log refresh. Loads the current status once, polls only while a sync is
 * running (manual or scheduled), calls `onProgress` each time a period lands (newest first, so
 * recent data can show early) and `onFinished` when the run completes.
 */
export function useUsageSync(onFinished: (status: SyncStatus) => void, onProgress?: (status: SyncStatus) => void) {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [starting, setStarting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const wasRunning = useRef(false)
  const finishedRef = useRef(onFinished)
  const progressRef = useRef(onProgress)
  const lastDone = useRef(0)
  useEffect(() => {
    finishedRef.current = onFinished
    progressRef.current = onProgress
  })

  const apply = useCallback((s: SyncStatus) => {
    if (wasRunning.current && !s.running) finishedRef.current(s)
    else if (s.running && wasRunning.current && s.windowsDone > lastDone.current) progressRef.current?.(s)
    lastDone.current = s.running ? s.windowsDone : 0
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

  // Poll only while a sync runs and the tab is visible: start at 5s, back off ×1.5 up to 15s while
  // nothing changes, snap back to 5s when a period lands, and catch up at once when the tab reappears.
  const running = Boolean(status?.running)
  useEffect(() => {
    if (!running) return
    let cancelled = false
    let timer: number | undefined
    let delay = POLL_MIN_MS
    let lastSeen = -1
    let inFlight = false

    const poll = async () => {
      // One chain only: a visibility change while a request is out must not start a second loop.
      if (cancelled || document.hidden || inFlight) return
      inFlight = true
      try {
        const s = await businessNumbersApi.syncStatus()
        if (cancelled) return
        delay = s.windowsDone !== lastSeen ? POLL_MIN_MS : Math.min(POLL_MAX_MS, delay * POLL_BACKOFF)
        lastSeen = s.windowsDone
        apply(s)
        if (!s.running) return
      } catch {
        delay = POLL_MAX_MS
      } finally {
        inFlight = false
      }
      if (!cancelled && !document.hidden) timer = window.setTimeout(poll, delay)
    }

    const onVisibility = () => {
      if (document.hidden) {
        window.clearTimeout(timer)
      } else {
        window.clearTimeout(timer)
        delay = POLL_MIN_MS
        void poll()
      }
    }

    timer = window.setTimeout(poll, POLL_MIN_MS)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
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
