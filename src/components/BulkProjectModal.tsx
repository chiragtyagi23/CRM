import { useEffect, useMemo, useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'

import type { ExistingCampaign } from '../types/dtos'

const TEMPLATE_OPTIONS = [
  { value: 'all', label: 'All templates' },
  { value: 'default-template', label: 'Default' },
  { value: 'luxury-template', label: 'Luxury' },
  { value: 'affordable-template', label: 'Affordable' },
] as const

function templateLabel(key: ExistingCampaign['templateKey']) {
  return TEMPLATE_OPTIONS.find((o) => o.value === key)?.label ?? 'Default'
}

const fieldClass =
  'h-11 w-full rounded-xl border border-[#E8DCCB] bg-white px-3 text-[13px] text-[#2E2E2E] focus:border-[#8B7355] focus:outline-none'

type Props = {
  open: boolean
  campaigns: ExistingCampaign[]
  loading: boolean
  selectedId: string
  onClose: () => void
  onConfirm: (id: string) => void
}

export function BulkProjectModal({ open, campaigns, loading, selectedId, onClose, onConfirm }: Props) {
  const [query, setQuery] = useState('')
  const [assignee, setAssignee] = useState('all')
  const [template, setTemplate] = useState('all')
  const [draftId, setDraftId] = useState(selectedId)

  useEffect(() => {
    if (!open) return
    setDraftId(selectedId)
    setQuery('')
    setAssignee('all')
    setTemplate('all')
  }, [open, selectedId])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const assignees = useMemo(() => {
    const names = campaigns
      .map((c) => String(c.assignTo ?? '').trim())
      .filter(Boolean)
    return [...new Set(names)].sort((a, b) => a.localeCompare(b))
  }, [campaigns])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return campaigns.filter((c) => {
      if (assignee === 'unassigned' && String(c.assignTo ?? '').trim()) return false
      if (assignee !== 'all' && assignee !== 'unassigned' && String(c.assignTo ?? '').trim() !== assignee) return false
      if (template !== 'all' && (c.templateKey ?? 'default-template') !== template) return false
      if (!q) return true
      const hay = [c.title, c.address, c.regNo, c.assignTo].map((v) => String(v ?? '').toLowerCase()).join(' ')
      return hay.includes(q)
    })
  }, [assignee, campaigns, query, template])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[#2E2E2E]/40" aria-label="Close project picker" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-project-modal-title"
        className="relative flex max-h-[min(720px,90vh)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-[#E8DCCB] bg-white"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E8DCCB] px-6 py-5">
          <div>
            <h2 id="bulk-project-modal-title" className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-[#2E2E2E]">
              Select project
            </h2>
            <p className="mt-1 mb-0 text-[13px] text-[#8B7355]">Filter the list, then choose one project for this call batch.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#8B7355] hover:bg-[#F5EFE7]"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 border-b border-[#E8DCCB] bg-[#FAF7F2] px-6 py-4">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B7355]" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, address, or registration no."
              className={`${fieldClass} pl-9`}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-[#8B7355]">Assignee</span>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={fieldClass}>
                <option value="all">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {assignees.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-[#8B7355]">Template</span>
              <select value={template} onChange={(e) => setTemplate(e.target.value)} className={fieldClass}>
                {TEMPLATE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="px-2 py-8 text-center text-[13px] text-[#8B7355]">Loading projects…</p>
          ) : filtered.length === 0 ? (
            <p className="px-2 py-8 text-center text-[13px] text-[#8B7355]">No projects match these filters.</p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {filtered.map((c) => {
                const active = draftId === c.id
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setDraftId(c.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                        active
                          ? 'border-[#8B7355] bg-[#F5EFE7]'
                          : 'border-[#E8DCCB] bg-white hover:border-[#8B7355]/40 hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="m-0 text-[14px] font-semibold text-[#2E2E2E]">{c.title || 'Untitled project'}</p>
                        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#8B7355] ring-1 ring-[#E8DCCB]">
                          {templateLabel(c.templateKey)}
                        </span>
                      </div>
                      <p className="mt-1 mb-0 text-[12px] text-[#8B7355]">
                        {String(c.address ?? '').trim() || 'No address'}
                        {' · '}
                        {String(c.assignTo ?? '').trim() || 'Unassigned'}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E8DCCB] px-6 py-4">
          <p className="m-0 text-[12px] text-[#8B7355]">
            {filtered.length} project{filtered.length === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E8DCCB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#2E2E2E] hover:bg-[#F5EFE7]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!draftId}
              onClick={() => onConfirm(draftId)}
              className="rounded-xl bg-[#8B7355] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#6d5a43] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use this project
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
