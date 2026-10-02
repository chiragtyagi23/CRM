import { useState } from 'react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

import { deleteMySummary, saveMySummary } from '../../lib/usersApi'
import { btnDanger, btnGhost, btnPrimary, card, cardSubtitle, cardTitle, extractError } from './shared'

const MAX = 5000

export function SummaryCard({
  summary,
  onChange,
}: {
  summary: string | null
  onChange: (summary: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startEdit = () => {
    setDraft(summary ?? '')
    setError(null)
    setEditing(true)
  }

  const cancel = () => {
    if (saving) return
    setEditing(false)
    setError(null)
  }

  const save = async () => {
    if (!draft.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await saveMySummary(draft.trim())
      onChange(res.summary)
      setEditing(false)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (saving || !window.confirm('Delete your summary?')) return
    setSaving(true)
    setError(null)
    try {
      await deleteMySummary()
      onChange(null)
      setEditing(false)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="profile-summary" className={`${card} scroll-mt-24`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={cardTitle}>About me</h2>
          <p className={cardSubtitle}>A short introduction — your role, experience and the areas you handle</p>
        </div>
        {!editing ? (
          <div className="flex shrink-0 gap-2">
            {summary ? (
              <button type="button" onClick={() => void remove()} disabled={saving} className={btnDanger} aria-label="Delete summary">
                <FiTrash2 size={13} aria-hidden /> <span className="hidden min-[420px]:inline">Delete</span>
              </button>
            ) : null}
            <button type="button" onClick={startEdit} className={btnPrimary}>
              <FiEdit2 size={13} aria-hidden /> {summary ? 'Edit' : 'Add'}
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        {editing ? (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={MAX}
              placeholder="e.g. 6+ years in residential real estate across Gurugram & Noida. I handle premium 3–4 BHK enquiries and site visits for…"
              className="min-h-[140px] w-full resize-y rounded-xl border border-[#E8DCCB] bg-white px-4 py-3 text-[13px] leading-relaxed text-[#2E2E2E] placeholder:text-[#8B7355]/60 focus:border-[#8B7355] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/15"
              autoFocus
            />
            <div className="mt-1 text-right text-[11px] text-[#8B7355]">
              {draft.length}/{MAX}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={cancel} disabled={saving} className={btnGhost}>
                Cancel
              </button>
              <button type="button" onClick={() => void save()} disabled={saving || !draft.trim()} className={btnPrimary}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </>
        ) : summary ? (
          <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#2E2E2E]">{summary}</p>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="w-full rounded-xl border border-dashed border-[#E8DCCB] bg-[#FBF8F4] px-4 py-6 text-center text-[13px] font-medium text-[#8B7355] hover:border-[#8B7355]/40"
          >
            Tell your team a little about yourself →
          </button>
        )}
        {error ? <div className="mt-3 text-[13px] font-medium text-[#D96B6B]">{error}</div> : null}
      </div>
    </section>
  )
}
