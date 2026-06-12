import { useEffect, useMemo, useState } from 'react'

import { dropdownChevronInlineClass } from './uiPrimitives'
import type { ApiError } from '../lib/crmApi'
import { fetchCampaignProjects, type CampaignProjectOption } from '../lib/campaignsApi'
import { crmPayloadBuilder } from '../services/crmPayloadBuilder'
import { useAppDispatch, useAppSelector } from '../store/hooks'
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
      <div className="relative w-full max-w-[520px] rounded-xl bg-[#FFFFFF] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="text-[22px] font-bold tracking-[-0.03em] text-[#2E2E2E]">{title}</div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

const scheduleInputClass =
  'h-11 w-full rounded-xl border border-[#E8DCCB] bg-white px-4 text-[13px] text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none'

function scheduleApiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'body' in err) {
    const body = (err as ApiError).body
    if (body && typeof body === 'object' && body !== null && 'error' in body) {
      return String((body as { error: unknown }).error)
    }
  }
  return 'Failed to schedule site visit. Please try again.'
}

function normalizeLeadAssignee(name?: string | null): string {
  const v = (name ?? '').trim()
  return !v || v === '—' ? '' : v
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-2 text-[12px] font-semibold text-[#8B7355]">
        {label} {required ? <span className="text-[#D96B6B]">*</span> : null}
      </div>
      {children}
    </label>
  )
}

export function ScheduleVisitModal({
  open,
  leadId,
  leadAssignee,
  onClose,
  onScheduled,
}: {
  open: boolean
  leadId: string
  /** Lead’s assigned user (`callBy`); pre-selects Handler when modal opens. */
  leadAssignee?: string | null
  onClose: () => void
  onScheduled?: () => void
}) {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((s) => s.auth.user)
  const [projects, setProjects] = useState<CampaignProjectOption[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(() => new Set())
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [assignmentTab, setAssignmentTab] = useState<'handler' | 'rm'>('handler')
  const [handlerName, setHandlerName] = useState('')
  const [rmName, setRmName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setProjectsLoading(true)
    fetchCampaignProjects()
      .then((p) => setProjects(p))
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false))
  }, [open])

  useEffect(() => {
    if (!open) setProjectDropdownOpen(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    setDate('')
    setTime('')
    setSelectedProjectIds(new Set())
    setProjectDropdownOpen(false)
    setNotes('')
    setRmName('')
    setHandlerName(normalizeLeadAssignee(leadAssignee))
  }, [open, leadAssignee])

  const handlerSelectOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: { key: string; name: string }[] = []
    const add = (name: string, key: string) => {
      const n = name.trim()
      if (!n) return
      const k = n.toLowerCase()
      if (seen.has(k)) return
      seen.add(k)
      options.push({ key, name: n })
    }
    const assignee = normalizeLeadAssignee(leadAssignee)
    if (assignee) add(assignee, '__lead-assignee')
    const me = String(authUser?.name ?? '').trim()
    if (me) add(me, '__self')
    return options
  }, [authUser?.name, leadAssignee])

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
              className="inline-flex h-11 w-full items-center justify-between rounded-xl border border-[#E8DCCB] bg-white px-4 text-[13px] text-[#2E2E2E]"
              aria-haspopup="listbox"
              aria-expanded={projectDropdownOpen}
              onClick={() => setProjectDropdownOpen((o) => !o)}
              disabled={saving}
            >
              <span className="truncate">{selectedProjectsLabel}</span>
              <span className={`ml-3 ${dropdownChevronInlineClass}`} aria-hidden>
                ▾
              </span>
            </button>

            {projectDropdownOpen ? (
              <div
                className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-[#E8DCCB] bg-white shadow-[0_10px_24px_rgba(17,24,39,0.10)]"
                role="listbox"
                aria-label="Projects"
              >
                <div className="max-h-[220px] overflow-auto p-2">
                  {projectsLoading ? (
                    <div className="px-3 py-2 text-[12px] text-[#8B7355]">Loading campaigns…</div>
                  ) : projects.length === 0 ? (
                    <div className="px-3 py-2 text-[12px] text-[#8B7355]">No campaigns found</div>
                  ) : (
                    projects.map((p) => {
                      const checked = selectedProjectIds.has(p.id)
                      return (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-[#2E2E2E] hover:bg-[#F5EFE7]"
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

                <div className="flex items-center justify-between gap-2 border-t border-[#8B7355]/10 bg-[#FFFFFF] px-3 py-2">
                  <button
                    type="button"
                    className="text-[12px] font-semibold text-[#8B7355] hover:text-[#2E2E2E] disabled:opacity-60"
                    disabled={saving || selectedProjectIds.size === 0}
                    onClick={() => setSelectedProjectIds(new Set())}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-[#8B7355] px-4 text-[12px] font-semibold text-white hover:bg-[#6d5a43] disabled:opacity-60"
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
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={scheduleInputClass}
              disabled={saving}
            />
          </Field>
          <Field label="Time" required>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              step={60}
              className={scheduleInputClass}
              disabled={saving}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-[#E8DCCB] bg-white p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={[
                'flex-1 rounded-xl px-3 py-2 text-[12px] font-semibold',
                assignmentTab === 'handler' ? 'bg-[#F5EFE7] text-[#8B7355]' : 'bg-white text-[#8B7355] hover:bg-[#F5EFE7]',
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
                assignmentTab === 'rm' ? 'bg-[#F5EFE7] text-[#8B7355]' : 'bg-white text-[#8B7355] hover:bg-[#F5EFE7]',
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
                  className="h-11 w-full rounded-xl border border-[#E8DCCB] bg-white px-4 text-[13px] text-[#2E2E2E]"
                >
                  <option value="">Select handler</option>
                  {handlerSelectOptions.map((o) => (
                    <option key={o.key} value={o.name}>
                      {o.name}
                    </option>
                  ))}
                </select>
                {handlerSelectOptions.length === 0 ? (
                  <div className="mt-2 text-[11px] font-medium text-[#8B7355]">No handlers loaded (you can still type in Notes).</div>
                ) : null}
              </Field>
            ) : (
              <Field label="RM (relationship manager - builder side)">
                <input
                  value={rmName}
                  onChange={(e) => setRmName(e.target.value)}
                  placeholder="Enter RM name"
                  className="h-11 w-full rounded-xl border border-[#E8DCCB] bg-white px-4 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355]"
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
            className="min-h-[110px] w-full resize-none rounded-xl border border-[#E8DCCB] bg-white px-4 py-3 text-[13px] text-[#2E2E2E] placeholder:text-[#8B7355]"
          />
        </Field>

        <div className="mt-1 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
          <button
            type="button"
            className="h-11 w-full rounded-xl border border-[#E8DCCB] bg-white text-[13px] font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7] disabled:opacity-60"
            disabled={saving}
            onClick={() => onClose()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#8B7355] text-[13px] font-semibold text-white hover:bg-[#6d5a43] disabled:opacity-60"
            disabled={!canSubmit}
            onClick={async () => {
              const projectIds = Array.from(selectedProjectIds)
              if (projectIds.length === 0 || !date.trim() || !time.trim()) return
              if (saving) return
              setSaving(true)
              try {
                for (const projectId of projectIds) {
                  const payload = crmPayloadBuilder.siteVisit.buildCreatePayload({
                    leadId,
                    projectId,
                    date,
                    time,
                    notes: combinedNotes,
                  })
                  await dispatch(submitSiteVisit(payload)).unwrap()
                }
                onClose()
                onScheduled?.()
              } catch (err) {
                window.alert(scheduleApiErrorMessage(err))
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

