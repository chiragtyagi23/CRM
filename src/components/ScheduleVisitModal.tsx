import { useEffect, useMemo, useState } from 'react'

import { fetchProjects, type ProjectDTO } from '../lib/dashboardDummyApi'
import type { SiteVisitCreatePayload } from '../lib/captureSiteVisitApi'
import { fetchUsers, type CrmUserDTO } from '../lib/usersApi'
import { useAppDispatch } from '../store/hooks'
import { submitSiteVisit } from '../store/siteVisit.slice'

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/20" aria-label="Close modal" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-2xl bg-[#FDFBF7] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="text-[22px] font-bold tracking-[-0.03em] text-gray-900">{title}</div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[12px] font-semibold text-gray-600">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </div>
      {children}
    </label>
  )
}

export function ScheduleVisitModal({
  open,
  leadId,
  onClose,
  onScheduled,
}: {
  open: boolean
  leadId: string
  onClose: () => void
  onScheduled?: () => void
}) {
  const dispatch = useAppDispatch()
  const [projects, setProjects] = useState<ProjectDTO[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(() => new Set())
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [assignmentTab, setAssignmentTab] = useState<'handler' | 'rm'>('handler')
  const [handlers, setHandlers] = useState<CrmUserDTO[]>([])
  const [handlerName, setHandlerName] = useState('')
  const [rmName, setRmName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    fetchProjects().then((p) => setProjects(p))
  }, [open])

  useEffect(() => {
    if (!open) setProjectDropdownOpen(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    // Best-effort: load internal handlers (role=user). If forbidden/unavailable, we still allow manual typing.
    fetchUsers({ role: 'user' })
      .then((res) => {
        setHandlers(res.items ?? [])
        setHandlerName((prev) => {
          if (prev.trim()) return prev
          const first = res.items?.[0]?.name
          return first ? String(first) : ''
        })
      })
      .catch(() => {
        setHandlers([])
      })
  }, [open])

  const selectedProjectsLabel = useMemo(() => {
    const ids = Array.from(selectedProjectIds)
    if (ids.length === 0) return 'Choose project(s)'
    if (ids.length === 1) {
      const p = projects.find((x) => x.id === ids[0])
      return p?.name ?? '1 project selected'
    }
    return `${ids.length} projects selected`
  }, [projects, selectedProjectIds])

  const canSubmit = useMemo(() => {
    return selectedProjectIds.size > 0 && !!date.trim() && !!time.trim() && !saving
  }, [date, saving, selectedProjectIds, time])

  const combinedNotes = useMemo(() => {
    const handler = handlerName.trim()
    const rm = rmName.trim()
    const extra = notes.trim()
    const lines: string[] = []
    if (handler) lines.push(`Handler: ${handler}`)
    if (rm) lines.push(`RM: ${rm}`)
    if (extra) lines.push(extra)
    return lines.join('\n')
  }, [handlerName, notes, rmName])

  return (
    <Modal
      open={open}
      title="Schedule Site Visit"
      onClose={() => {
        if (saving) return
        onClose()
      }}
    >
      <div className="flex flex-col gap-4">
        <Field label="Project" required>
          <div className="relative">
            <button
              type="button"
              className="inline-flex h-11 w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800"
              aria-haspopup="listbox"
              aria-expanded={projectDropdownOpen}
              onClick={() => setProjectDropdownOpen((o) => !o)}
              disabled={saving}
            >
              <span className="truncate">{selectedProjectsLabel}</span>
              <span className="ml-3 text-gray-400" aria-hidden>
                ▾
              </span>
            </button>

            {projectDropdownOpen ? (
              <div
                className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_10px_24px_rgba(17,24,39,0.10)]"
                role="listbox"
                aria-label="Projects"
              >
                <div className="max-h-[220px] overflow-auto p-2">
                  {projects.length === 0 ? (
                    <div className="px-3 py-2 text-[12px] text-gray-500">Loading projects…</div>
                  ) : (
                    projects.map((p) => {
                      const checked = selectedProjectIds.has(p.id)
                      return (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-gray-800 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedProjectIds((prev) => {
                                const next = new Set(prev)
                                if (next.has(p.id)) next.delete(p.id)
                                else next.add(p.id)
                                return next
                              })
                            }}
                          />
                          <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        </label>
                      )
                    })
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-gray-900/10 bg-[#FDFBF7] px-3 py-2">
                  <button
                    type="button"
                    className="text-[12px] font-semibold text-gray-600 hover:text-gray-800 disabled:opacity-60"
                    disabled={saving || selectedProjectIds.size === 0}
                    onClick={() => setSelectedProjectIds(new Set())}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#80654a] px-4 text-[12px] font-semibold text-white hover:bg-[#725940] disabled:opacity-60"
                    disabled={saving}
                    onClick={() => setProjectDropdownOpen(false)}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2">
          <Field label="Date" required>
            <input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="3/31/2026"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800 placeholder:text-gray-400"
            />
          </Field>
          <Field label="Time" required>
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="11:00 AM"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800 placeholder:text-gray-400"
            />
          </Field>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={[
                'flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold',
                assignmentTab === 'handler' ? 'bg-[#faf6ef] text-[#80654a]' : 'bg-white text-gray-500 hover:bg-gray-50',
              ].join(' ')}
              onClick={() => setAssignmentTab('handler')}
              aria-pressed={assignmentTab === 'handler'}
            >
              Handler
            </button>
            <button
              type="button"
              className={[
                'flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold',
                assignmentTab === 'rm' ? 'bg-[#faf6ef] text-[#80654a]' : 'bg-white text-gray-500 hover:bg-gray-50',
              ].join(' ')}
              onClick={() => setAssignmentTab('rm')}
              aria-pressed={assignmentTab === 'rm'}
            >
              RM
            </button>
          </div>

          <div className="mt-3">
            {assignmentTab === 'handler' ? (
              <Field label="Handler (assigned manager/leader)">
                <select
                  value={handlerName}
                  onChange={(e) => setHandlerName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800"
                >
                  <option value="">Select handler</option>
                  {handlers.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
                {handlers.length === 0 ? (
                  <div className="mt-2 text-[11px] font-medium text-gray-400">No handlers loaded (you can still type in Notes).</div>
                ) : null}
              </Field>
            ) : (
              <Field label="RM (relationship manager - builder side)">
                <input
                  value={rmName}
                  onChange={(e) => setRmName(e.target.value)}
                  placeholder="Enter RM name"
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-800 placeholder:text-gray-400"
                />
              </Field>
            )}
          </div>
        </div>

        <Field label="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            className="min-h-[110px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-800 placeholder:text-gray-400"
          />
        </Field>

        <div className="mt-1 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
          <button
            type="button"
            className="h-11 w-full rounded-2xl border border-gray-300 bg-white text-[13px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            disabled={saving}
            onClick={() => onClose()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-[#80654a] text-[13px] font-semibold text-white hover:bg-[#725940] disabled:opacity-60"
            disabled={!canSubmit}
            onClick={async () => {
              const projectIds = Array.from(selectedProjectIds)
              if (projectIds.length === 0 || !date.trim() || !time.trim()) return
              if (saving) return
              setSaving(true)
              try {
                for (const projectId of projectIds) {
                  const payload: SiteVisitCreatePayload = { leadId, projectId, date, time, notes: combinedNotes }
                  await dispatch(submitSiteVisit(payload)).unwrap()
                }
                onClose()
                onScheduled?.()
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? 'Scheduling…' : 'Schedule'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

